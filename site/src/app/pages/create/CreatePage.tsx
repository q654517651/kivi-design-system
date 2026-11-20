import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ButtonGroup, Dialog, EmptyState, GenPrompt, IconButton, PromptBox, ScrollArea, Loading, Skeleton, placeholderImageSrc, referenceName, toast, type PromptBoxSubmit, type ReferenceStackItem } from '@kivi';
import { SKILL_CATEGORIES, SKILL_ITEMS } from '../../../docs/business/skill-data';
import { LORAS } from '../../../docs/business/lora-data';
import { activeTurnOf, sendAgent, stopAgent } from '../../data/agent';
import { removeAssets, setCollected } from '../../data/assets';
import { addChatTask } from '../../data/chats';
import { byId, useDB } from '../../data/db';
import { ratioNum } from '../../data/mock';
import { removeOutput } from '../../data/outputs';
import { clearComposer, peekComposer, type ComposerFill } from './handoff';
import { removeTask, rerunTask, submitTask, type TaskInput } from '../../data/tasks';
import { uid } from '../../data/store';
import { toolOf, type ToolId } from '../../data/tools';
import type { Chat, Task, Where } from '../../data/types';
import { confirmDelete } from '../../flows/delete';
import { attempt } from '../../flows/errors';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown, type ViewerMedia } from '../../parts/media-viewer';
import { ToolWorkbench, toolTaskInput, type Source, type ToolJob } from '../../parts/tool-workbench';
import { toolCost, toolParams } from '../../parts/tool-workbench/options';
import { INITIAL_STATE } from '../../parts/tool-workbench/types';
import { useBriefLoading } from '../../hooks/useBriefLoading';
import { isScrollingToBottom, scrollToBottom } from '../../hooks/scrollToBottom';
import { useOlderPages } from '../../hooks/useOlderPages';
import { TaskTags } from '../../parts/task-tags';
import { AssetInfo, CopyPrompt } from '../../parts/asset-info';
import { RecordFeed } from './RecordFeed';
import { downloadMedia } from '../../flows/files';
import { appendReferences, useReferenceInbox } from '../../data/ref-inbox';
import { TileMenus, type TileMenuState } from './TileMenus';
import { genTaskInput } from './submit';
import type { TileContext, TileRef, ViewerInfo } from './tiles';

/*
  创作页（对话页）主区：生成记录 + 底部输入框，侧栏在外壳里。
  记录读 db 里这个对话的任务和素材；输入框、工具弹窗、抠图这些「生成」都走 submitTask，结果到点自己出，排在记录流最后。
  点完成的图全屏看大图；收藏、删除改的是素材本身，资产页同步。
*/

/** 记录流一页几条（线上 10） */


/** 大图里的一张 */
interface ViewItem {
  media: ViewerMedia;
  assetId?: string;
  /** 信息栏：这一格所在记录的提示词和参数 */
  info: ViewerInfo;
}
/** 「重新编辑」要填回输入框的东西 */
const FRESH_MS = 10_000;
const PAGE_SIZE = 10;
/** 首次进入对话先出几个骨架 */
const SKELETON_COUNT = 5;
/** 离顶多近就加载更早的 */
const TOP_GAP = 80;

/** 离底多近算「在底部」：在底部时内容变高跟着滚 */
const FOLLOW_GAP = 80;

/** 对话页：对话被删掉了就什么都不画（外壳会回创作首页） */
export function CreatePage({ chatId }: { chatId: string }) {
  const chat = useDB((s) => byId(s.chats, chatId));
  return chat ? <ChatView chat={chat} /> : null;
}

function ChatView({ chat }: { chat: Chat }) {
  const tasks = useDB((s) => s.tasks);
  const assets = useDB((s) => s.assets);
  const agentTurns = useDB((s) => s.agentTurns);
  // Agent 正在回复（或等确认）：发送按钮变停止
  const active = activeTurnOf(agentTurns, chat.id);
  const where: Where = { page: 'create', chatId: chat.id };

  // 看大图：全站共用的查看大图（media-viewer.tsx），信息栏放这条记录的提示词和参数
  // 看大图：上下切的是这个对话里所有出了结果的格子（照即梦，按记录顺序），每次从数据里现算。
  // 记着看的是哪个素材和第几个：素材删了就停在原位置上，看到的是下一个。没有素材的格子（Agent 那一轮写死的）只看这一张
  const [view, setView] = useState<{ assetId?: string; index: number; single?: ViewItem } | null>(null);
  const feedItems: ViewItem[] = useMemo(
    () =>
      tasks
        .filter((t) => t.where.page === 'create' && t.where.chatId === chat.id)
        .sort((x, y) => x.createdAt - y.createdAt)
        .flatMap((t) =>
          t.outputs.flatMap((o) => {
            const a = o.assetId ? assets.find((x) => x.id === o.assetId) : undefined;
            return a
              ? [{ media: { type: a.media, src: a.src, poster: a.poster, name: a.name } as ViewerMedia, assetId: a.id, info: { prompt: t.prompt, tags: <TaskTags task={t} /> } }]
              : [];
          }),
        ),
    [tasks, assets, chat.id],
  );
  const viewGroup: ViewItem[] = !view ? [] : view.single ? [view.single] : feedItems;
  const foundAt = view?.assetId ? viewGroup.findIndex((g) => g.assetId === view.assetId) : -1;
  const viewIndex = view ? (foundAt >= 0 ? foundAt : Math.min(view.index, viewGroup.length - 1)) : 0;
  const viewNow = view && viewGroup.length ? viewGroup[viewIndex] : null;
  const shownView = useLastShown(viewNow);
  const shownAsset = shownView?.assetId ? assets.find((a) => a.id === shownView.assetId && a.taskId) : undefined;
  // 都删光了：关掉
  useEffect(() => {
    if (view && !viewGroup.length) setView(null);
  });
  // 没有素材的格子（Agent 那一轮）收藏只记在页面里
  const [viewCollected, setViewCollected] = useState<string[]>([]);
  // 开局参考区是空的（11-20 修 R-7：原来带两张演示图）；从首页提交过来的接着用那次的素材和配置
  const [handoff] = useState(() => peekComposer(chat.id));
  useEffect(() => clearComposer(chat.id), [chat.id]);
  const [refs, setRefs] = useState<ReferenceStackItem[]>(handoff?.refs ?? []);
  // 探索页「添加到参考图」排着的素材：进来就加进参考区
  useReferenceInbox((items) => setRefs((list) => appendReferences(list, items)));
  // 「重新编辑」回填：参数整组换掉，输入框按新的一份重新挂上（key 变了），素材走上面受控的 refs
  const [fill, setFill] = useState<ComposerFill | null>(handoff?.fill ?? null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [tool, setTool] = useState<{ id: ToolId; source: Source } | null>(null);
  // 「更多」和右键各一个菜单，锚在点的位置
  const [more, setMore] = useState<TileMenuState | null>(null);
  const [menu, setMenu] = useState<TileMenuState | null>(null);

  const feed = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(220);

  /** 提交一个任务：成功后排到对话最后（出错交给 attempt） */
  /** 提交一次生成，成功返回 true（页面的生成按钮等它的时候转圈） */
  const run = async (input: TaskInput) => {
    const t = await attempt(() => submitTask(input));
    if (t) addChatTask(chat.id, t.id);
    return !!t;
  };

  const addRef = (t: TileRef) =>
    setRefs((list) => [
      ...list,
      { id: uid('c'), type: t.media, name: referenceName(list, t.media), src: t.media === 'video' ? t.poster : t.src, duration: t.media === 'video' ? '5s' : t.media === 'audio' ? '12s' : undefined },
    ]);

  // 弹窗里点生成：关弹窗，记录流最后多一条工具任务（只有参数，没有提示词）
  // 工具弹窗：提交成功再关（等请求时弹窗里的生成按钮转圈），失败留着能再点
  const runJob = async (job: ToolJob) => {
    if (await run(toolTaskInput(job, where))) setTool(null);
  };
  // 抠图、视频抠图不开弹窗，点了直接生成（11-11 用户定）；视频抠图用默认输出模式透明视频
  const openTool = (id: ToolId, t: TileRef) => {
    // 工具只给图片、视频（音频格没有工具入口）
    if (t.media === 'audio') return;
    const ratio = ratioNum(t.ratio);
    if (id === 'cutout' || id === 'video-cutout') {
      runJob({ tool: id, label: toolOf(id).name, media: t.media, src: t.src, ratio, targetRatio: ratio, params: toolParams(id, INITIAL_STATE), cost: toolCost(id, INITIAL_STATE) });
    } else setTool({ id, source: { id: uid('v'), media: t.media, src: t.src, ratio } });
  };

  // 删除先二次确认（确认按钮转圈），成功 Toast「删除成功」
  const remove = (t: TileRef) => {
    void confirmDelete(async () => {
      if (t.assetId) await removeAssets([t.assetId]);
      else if (t.taskId !== undefined && t.index !== undefined) await removeOutput(t.taskId, t.index);
      else setRemoved((l) => [...l, t.key]);
    });
  };

  // 重新编辑：生成任务把提示词、任务类型、模型、参考方式、素材、参数、张数填回输入框；工具任务打开那个工具的弹窗，原图带进去
  const reEdit = (t: Task) => {
    if (t.kind === 'tool') {
      const src = t.refs[0]?.src;
      if (t.tool && src && (t.media === 'image' || t.media === 'video')) setTool({ id: t.tool as ToolId, source: { id: uid('v'), media: t.media, src, ratio: ratioNum(t.ratio) } });
      return;
    }
    if (t.media === 'text') return; // 文字任务只在画布里有
    const frames = t.refMode === 'frames';
    setRefs(frames ? [] : t.refs.map((r, i) => ({ id: uid('c'), type: r.type, name: r.label ?? referenceName(t.refs.slice(0, i).map((x) => ({ id: '', type: x.type })), r.type), src: r.src })));
    setFill({
      key: Date.now(),
      task: t.media,
      model: t.model,
      refMode: t.refMode,
      text: t.prompt ?? '',
      frames: frames ? { first: t.refs.find((r) => r.label === '首帧')?.src, last: t.refs.find((r) => r.label === '尾帧')?.src } : undefined,
      params: t.params,
      count: t.outputs.length,
    });
  };
  // 再次生成：原参数直接提交，排到记录最后（照线上提示「任务已提交生成中」）
  const rerun = async (t: Task) => {
    const next = await attempt(() => rerunTask(t));
    if (!next) return;
    addChatTask(chat.id, next.id);
    toast.success('任务已提交生成中');
  };
  const removeGroup = (t: Task) => void confirmDelete(() => removeTask(t.id));

  const ctx: TileContext = {
    record: { edit: reEdit, rerun, remove: removeGroup },
    removed,
    view: (t) => {
      const at = t.assetId ? feedItems.findIndex((g) => g.assetId === t.assetId) : -1;
      setView(at >= 0 ? { assetId: t.assetId, index: at } : { index: 0, single: { media: { type: t.media, src: t.src, poster: t.poster }, assetId: t.assetId, info: t.info } });
    },
    addRef,
    openTool,
    openMore: (t, at) => setMore({ ...at, tile: t }),
    openMenu: (t, at) => setMenu({ ...at, tile: t }),
    remove,
    collect: (t, v) => t.assetId && void attempt(() => setCollected([t.assetId!], v)),
  };

  /** 发给 Agent：带上参考区的素材，发出去后参考区清空（像聊天发附件） */
  const ask = async (text: string, withRefs = refs) => {
    const sent = await attempt(() =>
      sendAgent(chat.id, { text, refs: withRefs.map((r) => ({ type: r.type, src: r.src ?? '', name: r.name, duration: r.duration })) }),
    );
    if (sent && withRefs.length) setRefs([]);
    // 没发出去：告诉输入框别清空提示词
    return !!sent;
  };

  const submit = (s: PromptBoxSubmit) => {
    // 返回请求的 Promise：输入框等它的时候生成按钮转圈、不能重复提交
    if (s.task === 'agent') return ask(s.text, s.references);
    const input = genTaskInput(s, where);
    if (input) return run(input);
  };

  // 输入框浮在记录流上，记录流底部留出它的高度；输入框变高（加参考、打长字）跟着变
  useLayoutEffect(() => {
    const el = composer.current;
    if (!el) return;
    const measure = () => setComposerH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 和线上一样，进来停在最新一条（最下面）；新加了一项平滑滚到最下面
  useLayoutEffect(() => {
    const el = feed.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  // 跟着滚（11-19 用户定，照即梦）：在底部（离底 80 以内）时，回复变长、新记录进来都跟着往上推（新记录平滑推上去，逐字变长直接跟）；
  // 往上翻了就不动，输入框上面浮「生成中 · 回到底部」
  const column = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [awayFromBottom, setAway] = useState(false);
  const smoothNext = useRef(false);
  useEffect(() => {
    const el = feed.current;
    const inner = column.current;
    if (!el || !inner) return;
    const onScroll = () => {
      const at = isScrollingToBottom(el) || el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_GAP;
      atBottomRef.current = at;
      setAway(!at);
    };
    const ro = new ResizeObserver(() => {
      if (!atBottomRef.current) return;
      // 新记录进来：平滑推上去（位移动画）；回复逐字变长：直接跟
      if (smoothNext.current) {
        smoothNext.current = false;
        scrollToBottom(el);
      } else if (!isScrollingToBottom(el)) el.scrollTop = el.scrollHeight;
    });
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(inner);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);
  const toBottom = () => {
    if (!feed.current) return;
    atBottomRef.current = true;
    setAway(false);
    scrollToBottom(feed.current);
  };
  const count = chat.items.length;
  // 分页：先显示最后 10 条，往上滚到顶加载更早的（新的在下面，和线上方向相反）；首次进入先出骨架
  // 刚新建、刚动过（10 秒内）的对话数据就在手上，不出骨架；从侧栏点进别的对话才像线上那样先加载
  const entering = useBriefLoading(chat.id, Date.now() - chat.updatedAt < FRESH_MS);
  const older = useOlderPages(count, PAGE_SIZE, chat.id, feed);
  // 骨架屏换成内容那一下先落到最下面（在「滚到顶加载更早的」检查之前），不然会先加载一页、停在半截
  useLayoutEffect(() => {
    const el = feed.current;
    if (entering || !el) return;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setAway(false);
  }, [entering]);
  const { hasMore, loadOlder } = older;
  useEffect(() => {
    const el = feed.current;
    if (!el || entering) return;
    const check = () => {
      if (el.scrollTop < TOP_GAP) loadOlder();
    };
    el.addEventListener('scroll', check, { passive: true });
    // 内容不满一屏、没法滚的时候，直接把更早的补上
    if (hasMore && el.scrollHeight <= el.clientHeight) loadOlder();
    return () => el.removeEventListener('scroll', check);
  });
  // 新记录进来：在底部就等它撑高时平滑推上去；不在底部不动（不再强行滚到底）
  const prevCount = useRef(count);
  useLayoutEffect(() => {
    if (count > prevCount.current && atBottomRef.current) smoothNext.current = true;
    prevCount.current = count;
  }, [count]);
  // 这个对话里生成中的：几格出了 / 一共几格（照即梦「0/1 生成中…」）
  const running = tasks.filter((t) => t.where.page === 'create' && t.where.chatId === chat.id && t.status === 'running');
  const runTotal = running.reduce((n, t) => n + t.outputs.length, 0);
  const runDone = running.reduce((n, t) => n + t.outputs.filter((o) => o.status !== 'running').length, 0);

  // 看大图里的收藏：有素材的看素材，没有的看页面里记的
  const viewAsset = shownView?.assetId ? assets.find((a) => a.id === shownView.assetId) : undefined;
  const viewCollectedNow = viewAsset ? viewAsset.collected : !!shownView && viewCollected.includes(shownView.media.src);
  const toggleViewCollected = () => {
    if (!shownView) return;
    if (viewAsset) void attempt(() => setCollected([viewAsset.id], !viewAsset.collected));
    else setViewCollected((l) => (l.includes(shownView.media.src) ? l.filter((x) => x !== shownView.media.src) : [...l, shownView.media.src]));
  };

  return (
    <>
      <main className="tpl-ms__main" style={{ '--tpl-composer-h': `${composerH}px` } as CSSProperties}>
        <ScrollArea className="tpl-ms__feed" viewportRef={feed}>
          <div ref={column} className="tpl-ms__column">
            {entering ? (
              Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <div key={i} className="tpl-ms__skeleton">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton style={{ width: '50%', aspectRatio: '4 / 3' }} />
                </div>
              ))
            ) : (
              <>
                {older.loading && <Loading className="tpl-ms__older">加载中</Loading>}
                {count === 0 && <EmptyState type="empty" size={160} title="暂无数据" />}
                <RecordFeed chat={chat} tasks={tasks} assets={assets} agentTurns={agentTurns} ctx={ctx} start={older.start} />
              </>
            )}
          </div>
        </ScrollArea>
        <div ref={composer} className="tpl-ms__composer">
          {/* 往上翻了：输入框上面浮一条（玻璃按钮条 44）：有生成中的写进度，点「回到底部」平滑滚下去 */}
          {awayFromBottom && !entering && (
            <ButtonGroup variant="glass" size={44} className="tpl-ms__to-bottom" aria-label="回到底部">
              {runTotal > 0 && (
                <span className="tpl-ms__to-bottom-status">
                  <Loading size={16} />
                  {runDone}/{runTotal} 生成中…
                </span>
              )}
              <Button variant="ghost" rightIcon="DownArrowSmall" onClick={toBottom}>
                回到底部
              </Button>
            </ButtonGroup>
          )}
          <PromptBox
            key={fill?.key}
            defaultValue={fill?.text}
            defaultTask={fill?.task}
            defaultModels={fill?.model ? { [fill.task]: fill.model } : undefined}
            defaultRefMode={fill?.refMode}
            defaultFrames={fill?.frames}
            defaultParams={fill ? { [fill.task]: fill.params } : undefined}
            defaultCount={fill?.count}
            references={refs}
            onReferencesChange={setRefs}
            skills={SKILL_ITEMS}
            skillCategories={SKILL_CATEGORIES}
            loraOptions={LORAS}
            onSubmit={submit}
            generating={!!active}
            onStop={() => active && stopAgent(active.id)}
          />
        </div>
      </main>

      <TileMenus
        more={more}
        menu={menu}
        onCloseMore={() => setMore(null)}
        onCloseMenu={() => setMenu(null)}
        onTool={openTool}
        onAddRef={addRef}
        onRemove={remove}
      />

      {/* 工具弹窗：每个工具一个，所有工具一个大小（宽 800、高 640），里面和 AI 工具页同一套舞台和参数面板 */}
      <Dialog
        size={800}
        className="tpl-tool-dlg"
        title={tool ? toolOf(tool.id).name : undefined}
        open={tool !== null}
        onOpenChange={(v) => !v && setTool(null)}
      >
        {tool && <ToolWorkbench key={tool.source.id} tool={tool.id} source={tool.source} onGenerate={runJob} promptBar />}
      </Dialog>

      <MediaViewer
        media={viewNow?.media ?? null}
        onClose={() => setView(null)}
        group={viewGroup.map((g) => g.media)}
        index={viewIndex}
        onIndexChange={(i) => setView((v) => (v ? { ...v, index: i, assetId: viewGroup[i]?.assetId } : v))}
        head={<ViewerAuthor name="KIVI" avatar={placeholderImageSrc('ip-peek', '1:1')} date="今天 14:32" />}
        actions={
          shownView && (
            <>
              <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => void downloadMedia([{ src: shownView.media.src }])} />
              {shownView.assetId && (
                <IconButton
                  icon="Delete"
                  label="删除"
                  variant="secondary"
                  size={36}
                  onClick={() => void confirmDelete(() => removeAssets([shownView.assetId!]))}
                />
              )}
              <IconButton
                icon={viewCollectedNow ? 'CollectSolid' : 'Collect'}
                label={viewCollectedNow ? '取消收藏' : '收藏'}
                variant="secondary"
                size={36}
                data-collected={viewCollectedNow || undefined}
                onClick={toggleViewCollected}
              />
            </>
          )
        }
      >
        {/* 有素材的（自己生成的）照资产页那套：同任务几张、提示词、参数、参考；Agent 那一轮写死的格子没有素材，只放提示词和标签 */}
        {shownAsset ? (
          <AssetInfo
            asset={shownAsset}
            pickable={(id) => viewGroup.some((g) => g.assetId === id)}
            onPick={(id) => setView((v) => (v ? { ...v, assetId: id, index: viewGroup.findIndex((g) => g.assetId === id) } : v))}
          />
        ) : (
          shownView && (
            <>
              {shownView.info.prompt && (
                <ViewerSection title="提示词" action={<CopyPrompt text={shownView.info.prompt} />}>
                  <p className="tpl-viewer__prompt">{shownView.info.prompt}</p>
                </ViewerSection>
              )}
              <ViewerSection title="参数">
                <GenPrompt>{shownView.info.tags}</GenPrompt>
              </ViewerSection>
            </>
          )
        )}
      </MediaViewer>
    </>
  );
}
