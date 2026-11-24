import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, CreateCard, ExploreCard, Masonry, ProjectCard, PromptBox, ScrollArea, TabItem, Tabs, WorkCard, placeholderImageSrc, type PromptBoxSubmit, type ReferenceStackItem } from '@kivi';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../../../docs/business/skill-data';
import { LORAS } from '../../../docs/business/lora-data';
import { FLOW_CATEGORIES, RATIO, SKILLS, SKILL_CATS, WORKS, flowsOf, type ExploreSkill, type Flow, type Work } from '../../data/catalog';
import { sendAgent } from '../../data/agent';
import { addChatTask, createChat, deleteChat } from '../../data/chats';
import { useDB } from '../../data/db';
import { appendReferences, useReferenceInbox } from '../../data/ref-inbox';
import { submitTask } from '../../data/tasks';
import { attempt } from '../../flows/errors';
import { AgentComposer } from '../../parts/agent-composer';
import { useCanvasCards } from '../../parts/canvas-card';
import type { ExploreTab } from '../explore';
import { FlowPreview } from '../explore/FlowPreview';
import { SkillDetail } from '../explore/SkillDetail';
import { WorkViewer } from '../explore/WorkViewer';
import { downloadWork } from '../explore/work-actions';
import { CategoryTabs, WORK_COLUMNS } from '../explore/shared';
import { setLiked, toggleFavorite, useFavorites, useLikes } from '../../data/favorites';
import { ComposerMotion, HomeAtmosphere, SHOW_COMPOSER_MOTION } from './HomeBackdrop';
import { HomeHead, RecentUpdates } from './HomeParts';
import { genTaskInput } from './submit';
import { handOffComposer } from './handoff';

export type HomeMode = 'generate' | 'canvas';

/*
  创作首页（11-10，照用户的交互原型 kivi-prototype「创作页」：结构和交互照它，样子用组件库）。
  从上到下：标题、「生成 / 画布」切换、输入框、中间一块、广场。
  输入框两种模式各是各的、一样大一样的渐变底（11-10 用户定）：生成是主站提示词框（PromptBox），提交进对话页；画布是画布里 Agent 的输入框，发送新建画布。
  生成提交：新建一个对话（标题取提示词前 20 字，没写字叫「新对话」）→ 在里面提交任务 → 进这个对话页。提交失败（余额不足、断网）把刚建的空对话删掉，留在首页。
  中间一块：生成是「最近更新」（运营位 Banner）；画布换成「最近项目」（新建画布 + 最近 4 个，读 db.canvases），不照原型放在输入框上面（11-10 用户定）。
  广场：生成是「发现」瀑布流；画布是创作精选 / 技能 / 工作流。切模式时中间一块和广场淡入（150ms ease-out）。
*/

/** 最近项目一排几格（新建画布 + 最近 4 个） */
const PROJECT_COLS = 5;

const SQUARE_TABS: { value: SquareTab; label: string }[] = [
  { value: 'featured', label: '创作精选' },
  { value: 'skill', label: '技能' },
  { value: 'workflow', label: '工作流' },
];
/** 首页的广场是探索页同一类内容的前几条；标题行下面一排分类（和探索页同一套，11-23 用户定），每个选项卡各记各的分类 */
const HOME_COUNT = 8;
type SquareTab = Exclude<ExploreTab, 'discover'>;
const SQUARE_CATS: Record<SquareTab, string[]> = { featured: FLOW_CATEGORIES, skill: SKILL_CATS, workflow: FLOW_CATEGORIES };
const inCat = (cat: string) => (x: { category: string }) => cat === 'all' || x.category === cat;
/** 发现放够两屏的量，多出来的截掉 */
const HOME_WORKS = WORKS.slice(0, 40);
/** 发现最高几屏（屏 = 首页滚动区的可见高度） */
const DISCOVER_SCREENS = 2;


export function CreateHome({
  onSubmit,
  onOpenCanvas,
  onOpenProject,
  onUseSkill,
  onExplore,
  onAllCanvases,
  initialMode = 'generate',
}: {
  /** 生成：对话建好、任务提交后，进这个对话页（参数是新对话的 id） */
  onSubmit: (chatId: string) => void;
  /** 画布：新建画布、打开最近项目、提交想法，都进画布页 */
  onOpenCanvas: () => void;
  /** 最近项目：打开点的那块画布 */
  onOpenProject: (canvasId: string) => void;
  /** 技能详情里点「使用」：新建画布，Agent 输入框带上这个技能 */
  onUseSkill: (name: string) => void;
  /** 广场搜索框回车（带着关键词）、「查看全部」「更多」：去探索页对应选项卡 */
  /** 去探索页：带上搜索词、分类（广场「查看全部」停在同一个分类） */
  onExplore: (tab: ExploreTab, keyword?: string, category?: string) => void;
  /** 最近项目「查看全部」：直接进全部画布页，返回回到这里的「画布」 */
  onAllCanvases: () => void;
  /** 进来停在「生成」还是「画布」：从全部画布页返回时是「画布」 */
  initialMode?: HomeMode;
}) {
  const [mode, setMode] = useState<HomeMode>(initialMode);
  // 生成输入框的参考区：探索页「添加到参考图」排着的素材进来就加上
  const [refs, setRefs] = useState<ReferenceStackItem[]>([]);
  useReferenceInbox((items) => {
    setMode('generate');
    setRefs((list) => appendReferences(list, items));
  });
  const projectCards = useCanvasCards(onOpenProject);
  // 发现、广场的卡点了直接开详情（11-20 用户定，照线上）：作品看大图、技能看详情、创作精选和工作流看画布预览
  const [work, setWork] = useState<Work | null>(null);
  const [skill, setSkill] = useState<ExploreSkill | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  // 发现卡上的收藏、点赞和探索页同一份
  const collected = useFavorites();
  const liked = useLikes();
  // 最近项目：最近改过的 4 块画布（和侧栏画布历史、资产页「我的画布」同一批）
  const canvases = useDB((s) => s.canvases);
  const recent = useMemo(() => [...canvases].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, PROJECT_COLS - 1), [canvases]);
  // 提交中不重复提交（新建对话和提交任务各有一次请求的延迟）
  const submitting = useRef(false);
  const submit = async (s: PromptBoxSubmit) => {
    if (submitting.current) return false;
    submitting.current = true;
    try {
      const chat = await attempt(() => createChat(s.text.trim().slice(0, 20) || '新对话'));
      if (!chat) return false;
      // Agent：把这句话（连同参考区的素材）发出去，进对话页看它回复
      if (s.task === 'agent') {
        const sent = await attempt(() =>
          sendAgent(chat.id, { text: s.text, refs: s.references.map((r) => ({ type: r.type, src: r.src ?? '', name: r.name, duration: r.duration })) }),
        );
        if (!sent) {
          await attempt(() => deleteChat(chat.id));
          return false;
        }
        onSubmit(chat.id);
        return;
      }
      const input = genTaskInput(s, { page: 'create', chatId: chat.id });
      if (input) {
        const task = await attempt(() => submitTask(input));
        if (!task) {
          await attempt(() => deleteChat(chat.id));
          return;
        }
        addChatTask(chat.id, task.id);
      }
      // 对话页输入框接着用这次的配置（任务类型、模型、提示词、参数、素材）
      handOffComposer(chat.id, s);
      onSubmit(chat.id);
    } finally {
      submitting.current = false;
    }
  };
  // 外壳高度跟着显示的那套走：两套高度不一样时（画布里加了附件），切换时高度做动画，下面的内容跟着挪
  const generateBox = useRef<HTMLDivElement>(null);
  /** 点阵氛围画到输入框下面 52，要量它 */
  const composerRef = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  // 画布那套至少和生成那套平时一样高：什么都没加时两套一样高，切换时外壳高度不动。
  // 只取生成那套平时的高度（挂上半秒后定住，页面变宽变窄时重量），生成里展开了参考区、写了多行不带着画布变高：
  // 两套各是各的，切过去外壳 200ms 变到那套的高度，下面跟着动（11-23 用户定）
  const [generateHeight, setGenerateHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = generateBox.current;
    const page = el?.parentElement;
    if (!el || !page) return;
    let settled = false;
    let width = page.clientWidth;
    const measure = () => setGenerateHeight(el.offsetHeight);
    measure();
    const settle = window.setTimeout(() => (settled = true), 500);
    const ro = new ResizeObserver(() => {
      if (!settled) measure();
    });
    ro.observe(el);
    const pageRo = new ResizeObserver(() => {
      if (page.clientWidth === width) return;
      width = page.clientWidth;
      measure();
    });
    pageRo.observe(page);
    return () => {
      window.clearTimeout(settle);
      ro.disconnect();
      pageRo.disconnect();
    };
  }, []);
  // 外壳高度 = 显示的那套的高度。直接写进 DOM，不走 React 状态：输入框自己在动画里变高时（参考区展开全部）每帧都会量到新高度，
  // 走状态的话整个首页每帧重渲染一遍，掉帧（11-23）。
  // 外壳只在切模式时自己做 200ms 过渡（data-switching，两套高度不一样）；平时跟着里面的输入框同步变高，不另加过渡，免得慢半拍
  const shellRef = useRef<HTMLDivElement>(null);
  const firstMode = useRef(true);
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const active = mode === 'generate' ? generateBox.current : canvasBox.current;
    if (!shell || !active) return;
    let switching = 0;
    if (firstMode.current) firstMode.current = false;
    else {
      shell.setAttribute('data-switching', '');
      switching = window.setTimeout(() => shell.removeAttribute('data-switching'), 250);
    }
    const measure = () => {
      shell.style.height = `${active.offsetHeight}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(active);
    return () => {
      window.clearTimeout(switching);
      ro.disconnect();
    };
  }, [mode]);
  const [square, setSquare] = useState<SquareTab>('featured');
  const [squareCat, setSquareCat] = useState<Record<SquareTab, string>>({ featured: 'all', skill: 'all', workflow: 'all' });
  const cat = squareCat[square];
  const squareSkills = useMemo(() => SKILLS.filter(inCat(squareCat.skill)).slice(0, HOME_COUNT), [squareCat.skill]);
  const squareFlows = useMemo(() => (square === 'skill' ? [] : flowsOf(square).filter(inCat(cat)).slice(0, HOME_COUNT)), [square, cat]);
  // 一屏多高：量首页滚动区的可见高度，发现最高两屏
  const scrollRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<number>();
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setScreen(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  // 中间一块（最近更新 / 最近项目）和广场，按模式出内容
  const swapContent = (m: HomeMode) => (
    <>
      {m === 'generate' ? (
        <RecentUpdates onPreviewFlow={setFlow} />
      ) : (
        <section className="tpl-home__section" aria-label="最近项目">
          <HomeHead title="最近项目" onMore={onAllCanvases} />
          <div className="tpl-home__project-grid" data-create-span={Math.max(1, PROJECT_COLS - recent.length)}>
            {/* 一排 5 格：新建画布占掉最近项目没占的格子，一个画布都没有时铺满整排（11-10 用户定，照即梦） */}
<CreateCard variant="canvas" label="新建画布" onClick={onOpenCanvas} />
            {recent.map((c) => (
              <ProjectCard key={c.id} name={c.name} covers={c.covers} updatedAt={c.updatedAt} {...projectCards.cardProps(c.id)} />
            ))}
          </div>
        </section>
      )}

      <section className="tpl-home__section" aria-label={m === 'canvas' ? '画布推荐内容' : '生成推荐内容'}>
        {m === 'generate' ? (
          <>
            <HomeHead title="发现" onMore={() => onExplore('discover')} search={{ placeholder: '搜索提示词、模型、作者', onSearch: (k) => onExplore('discover', k) }} />
            {/* 最高约两屏，下面压着的截掉，底部正中「更多」去探索页发现（11-17 用户定） */}
            <div className="tpl-home__discover" style={screen ? { maxHeight: screen * DISCOVER_SCREENS } : undefined}>
              <Masonry columns={WORK_COLUMNS} gap={2} ratios={HOME_WORKS.map((w) => RATIO[w.ratio])}>
                {HOME_WORKS.map((w) => (
                  <WorkCard
                    key={w.id}
                    type={w.video ? 'video' : 'image'}
                    src={w.src}
                    poster={w.poster}
                    ratio={w.ratio}
                    title={w.prompt}
                    author={w.author}
                    likes={w.likes + (liked.includes(w.id) ? 1 : 0)}
                    liked={liked.includes(w.id)}
                    onLikedChange={(v) => setLiked(w.id, v)}
                    collected={collected.includes(w.id)}
                    onCollectedChange={(v) => void attempt(() => toggleFavorite(w.id, v))}
                    onDownload={() => downloadWork(w)}
                    onOpen={() => setWork(w)}
                  />
                ))}
              </Masonry>
              <Button size={36} variant="on-media" rightIcon="RightArrowSmall" className="tpl-home__discover-more" onClick={() => onExplore('discover')}>
                更多
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 右边回到「查看全部」（11-17 用户定，11-16 换过搜索框），去探索页对应选项卡 */}
            <HomeHead onMore={() => onExplore(square, '', cat)}>
              <Tabs size={36} value={square} onChange={(v) => setSquare(v as typeof square)} aria-label="画布内容分类">
                {SQUARE_TABS.map((t) => (
                  <TabItem key={t.value} value={t.value}>
                    {t.label}
                  </TabItem>
                ))}
              </Tabs>
            </HomeHead>
            <CategoryTabs
              key={square}
              label={`${SQUARE_TABS.find((t) => t.value === square)?.label}分类`}
              value={cat}
              options={SQUARE_CATS[square]}
              onChange={(v) => setSquareCat((c) => ({ ...c, [square]: v }))}
              className="tpl-home__cats"
            />
            <div className="tpl-ex__grid">
              {square === 'skill'
                ? squareSkills.map((s) => (
                    <ExploreCard
                      key={s.id}
                      name={s.title}
                      description={s.description}
                      cover={s.poster ?? placeholderImageSrc(s.cover, '16:9')}
                      video={s.video}
                      author={s.author ?? { name: 'KIVI' }}
                      onOpen={() => setSkill(s)}
                    />
                  ))
                : squareFlows.map((f) => (
                    <ExploreCard key={f.id} name={f.name} cover={f.cover} video={f.video} showTime author={f.author} onOpen={() => setFlow(f)} />
                  ))}
            </div>
          </>
        )}
      </section>
    </>
  );

  return (
    <main className="tpl-home">
      <ScrollArea className="tpl-home__scroll" viewportRef={scrollRef}>
        <div className="tpl-home__page">
        <HomeAtmosphere targetRef={composerRef} />
        <div className="tpl-home__inner">
          <div className="tpl-home__intro">
            <h1>今天想在 KIVI 创作什么？</h1>
            {/* 分段自己的底是白 10%，压在点阵上会透出来，外面垫一层玻璃（11-16 用户定），不改分段本身 */}
            <div className="tpl-home__mode-glass">
              <Tabs variant="segment-brand" size={36} value={mode} onChange={(v) => setMode(v as HomeMode)} aria-label="创作方式" className="tpl-home__mode">
                <TabItem value="generate">生成</TabItem>
                <TabItem value="canvas">画布</TabItem>
              </Tabs>
            </div>
          </div>

          {/* 生成：主站提示词框，提交进对话页；画布：画布里 Agent 的输入框，发送新建画布。两个一样大、一样的渐变底，内容各是各的 */}
          {/* 外壳只有一个（渐变底、描边、圆角）不动；两套内容叠在同一格里都挂着，切换时交叉淡化，框的大小位置不变、打的字也还在。
              一格的高度取两套里高的那个，所以两个一样高 */}
          <div ref={composerRef} className="tpl-home__composer">
            <div ref={shellRef} className="tpl-home__shell">
              {SHOW_COMPOSER_MOTION && <ComposerMotion />}
              <div ref={generateBox} className="tpl-home__box" data-active={mode === 'generate' || undefined}>
                <PromptBox placement="bottom-start" references={refs} onReferencesChange={setRefs} onSubmit={submit} skills={SKILL_ITEMS} skillCategories={SKILL_CATEGORIES} loraOptions={LORAS} />
              </div>
              <div ref={canvasBox} className="tpl-home__box" data-active={mode === 'canvas' || undefined} style={generateHeight != null ? { minHeight: generateHeight } : undefined}>
                <AgentComposer className="tpl-home__agent" placement="bottom-start" onSend={onOpenCanvas} />
              </div>
            </div>
          </div>

          {/* 切模式：中间一块和广场换掉，淡入 */}
          {/* 切模式：中间一块和广场直接换，不做淡入淡出（淡入要从全透明起，中间会空一帧、页面闪） */}
          {/* 两套都挂着，只显示当前的：不卸载，图片加载过的不用再从占位图重新加载，选项卡等状态也还在。
              不当前的那套不用 hidden（从排版里拿掉）：再显示时瀑布流要重新量宽重排、图片要重新解码，会闪一两帧（11-23 修）。
              改成照样排版、只是看不见、高度收成 0（.tpl-home__swap），切换只换可见性 */}
          <div className="tpl-home__swap">
            {(['generate', 'canvas'] as const).map((m) => (
              <div key={m} data-active={mode === m || undefined} aria-hidden={mode !== m || undefined} {...(mode !== m ? { inert: '' } : null)}>
                {swapContent(m)}
              </div>
            ))}
          </div>
        </div>
        </div>
      </ScrollArea>
      <WorkViewer work={work} onClose={() => setWork(null)} />
      <SkillDetail skill={skill} onClose={() => setSkill(null)} onUse={(s) => onUseSkill(s.title)} />
      <FlowPreview flow={flow} onClose={() => setFlow(null)} onCloned={onOpenProject} />
      {projectCards.dialog}
    </main>
  );
}
