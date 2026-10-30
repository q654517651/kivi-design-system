import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Button,
  GenerateButton,
  PromptBox,
  ReferenceStack,
  ToolbarSwitch,
  referenceName,
  type ButtonSize,
  type ReferenceKind,
  type ReferenceStackItem,
} from '@kivi';
import { Playground } from '@shell';
import { AudioModelControls, CountSelect, ImageModelControls, TaskSelect, VideoModelControls } from './generation';

// 主站输入框的属性面板和可操作演示。参数表在 main-site.mdx 最下面

// ---------- 素材 ----------

const PICS = ['kivi-future', 'monstera-dots', 'kiwi-light', 'ip-gouache', 'bunny-gouache', 'ip-kiwi-pile', 'kiwi-glass', 'ip-future', 'ip-peek'];
const pic = (i: number) => `./placeholders/${PICS[i % PICS.length]}-1x1.webp`;

/** Figma「悬停展开」那张图里的 8 个素材，按添加顺序：图片1、图片2、视频1、视频2、视频3、音频1、图片3、视频4 */
const SAMPLE: ReferenceStackItem[] = [
  { id: 's1', kind: 'image', name: '图片1', src: pic(0) },
  { id: 's2', kind: 'image', name: '图片2', src: pic(1) },
  { id: 's3', kind: 'video', name: '视频1', src: pic(2), duration: '5s' },
  { id: 's4', kind: 'video', name: '视频2', src: pic(3), duration: '8s' },
  { id: 's5', kind: 'video', name: '视频3', src: pic(4), duration: '12s' },
  { id: 's6', kind: 'audio', name: '音频1', duration: '15s' },
  { id: 's7', kind: 'image', name: '图片3', src: pic(5) },
  { id: 's8', kind: 'video', name: '视频4', src: pic(6), duration: '5s' },
];

const SHORT = '生成一张赛博朋克风格的猕猴桃海报';
const LONG =
  '明亮的商业广告风格，饼干是主角。草莓口味参考 @图片1，开场用 @视频1 的构图，音乐在重拍处切入；饼干排成整齐的阵列，镜头参考 @视频2 的运动方式，高潮时饼干掰开进入慢动作，夹心爆开、碎屑飞散，最后定格在 @图片2 的画面，配乐用 @音频1。';
const HUGE = [LONG, LONG, LONG].join('\n');

const noop = () => {};

// ---------- 工具条 ----------
// 下拉、参数面板都用 generation.tsx 里共用的那一份，和画布生成面板一样：选项、顺序、图标、展开方向都一致

const TOOLBARS: Record<string, () => JSX.Element> = {
  image: () => (
    <>
      <TaskSelect defaultValue="image" />
      <ImageModelControls />
    </>
  ),
  video: () => (
    <>
      <TaskSelect defaultValue="video" />
      <VideoModelControls />
    </>
  ),
  audio: () => (
    <>
      <TaskSelect defaultValue="audio" />
      <AudioModelControls />
    </>
  ),
};

const videoToolbar = TOOLBARS.video;
const countSelect = <CountSelect />;

// ---------- 属性面板：整个输入框 ----------

type BoxState = { refs: boolean; text: string; mode: string };

const TEXT: Record<string, string> = { empty: '', short: SHORT, long: LONG, huge: HUGE };
const PLACEHOLDER: Record<string, string> = {
  image: '描述你想生成的图片，可以上传参考图',
  video: '描述你想生成的视频，@ 引用参考素材',
  audio: '描述你想生成的声音，或者输入要念的文字',
};

export function PromptBoxPlayground() {
  return (
    <Playground<BoxState>
      controls={[
        { key: 'refs', label: '参考区', type: 'toggle', value: true },
        { key: 'text', label: '提示词', type: 'segment', value: 'long', options: [['empty', '空'], ['short', '短'], ['long', '长'], ['huge', '超长']] },
        { key: 'mode', label: '模式', type: 'segment', value: 'video', options: [['image', '图片生成'], ['video', '视频生成'], ['audio', '音频生成']] },
      ]}
      render={(s) => (
        <PromptBox
          key={`${s.text}-${s.mode}`}
          placeholder={PLACEHOLDER[s.mode]}
          defaultValue={TEXT[s.text]}
          references={s.refs ? <ReferenceStack items={SAMPLE.slice(0, 6)} onAdd={noop} onRemove={noop} /> : undefined}
          toolbar={TOOLBARS[s.mode]()}
          actions={
            <>
              {countSelect}
              <GenerateButton cost={s.mode === 'image' ? 4 : s.mode === 'audio' ? 2 : 99} />
            </>
          }
        />
      )}
    />
  );
}

// ---------- 属性面板：参考区 ----------

type StackState = { count: string; kind: string; upload: boolean; pinned: boolean };

const imageItem = (i: number): ReferenceStackItem => ({ id: `i${i}`, kind: 'image', name: `图片${i + 1}`, src: pic(i) });

function stackItems(s: StackState): ReferenceStackItem[] {
  const n = Number(s.count);
  const list = s.kind === 'image' ? Array.from({ length: n }, (_, i) => imageItem(i)) : SAMPLE.slice(0, n);
  // 上传中的是最后加的那张，也就是叠放时最上面那张
  return s.upload && list.length ? list.map((it, i) => (i === list.length - 1 ? { ...it, progress: 54 } : it)) : list;
}

export function ReferenceStackPlayground() {
  return (
    <Playground<StackState>
      controls={[
        { key: 'count', label: '素材', type: 'segment', value: '6', options: [['0', '空'], ['1', '1 个'], ['2', '2 个'], ['3', '3 个'], ['6', '6 个'], ['8', '8 个']] },
        { key: 'kind', label: '类型', type: 'segment', value: 'mixed', options: [['image', '图片'], ['mixed', '混排']] },
        { key: 'upload', label: '上传中', type: 'toggle', value: false },
        { key: 'pinned', label: '固定展开', type: 'toggle', value: false },
      ]}
      // 空的时候只有添加格，没有类型、上传、展开
      rules={(s) => (s.count === '0' ? { kind: true, upload: true, pinned: true } : {})}
      render={(s) => (
        <PromptBox
          placeholder="描述你想生成的视频，@ 引用参考素材"
          defaultValue={LONG}
          references={<ReferenceStack items={stackItems(s)} onAdd={noop} onRemove={noop} expanded={s.pinned || undefined} />}
        />
      )}
    />
  );
}

// ---------- 属性面板：生成按钮 ----------

type GenState = { size: ButtonSize; cost: string; state: string };

const GEN_CLASS: Record<string, string | undefined> = { hover: 'is-hover', active: 'is-active' };

export function GenerateButtonPlayground() {
  return (
    <Playground<GenState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: 'md', options: [['sm', '小'], ['md', '中'], ['lg', '大']] },
        { key: 'cost', label: '消耗', type: 'text', value: '99' },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['loading', '加载中']] },
      ]}
      render={(s) => (
        <GenerateButton
          size={s.size}
          cost={s.cost}
          className={GEN_CLASS[s.state]}
          disabled={s.state === 'disabled' || undefined}
          loading={s.state === 'loading' || undefined}
        />
      )}
    />
  );
}

// ---------- 可操作演示 ----------

const DURATIONS = ['5s', '8s', '12s'];

/** 演示一开始放 6 个素材，和参考区演示一样 */
const LAB_START: ReferenceStackItem[] = [
  { id: 'l1', kind: 'image', name: '图片1', src: pic(0) },
  { id: 'l2', kind: 'video', name: '视频1', src: pic(1), duration: '5s' },
  { id: 'l3', kind: 'video', name: '视频2', src: pic(2), duration: '8s' },
  { id: 'l4', kind: 'video', name: '视频3', src: pic(3), duration: '12s' },
  { id: 'l5', kind: 'audio', name: '音频1', duration: '15s' },
  { id: 'l6', kind: 'video', name: '视频4', src: pic(4), duration: '5s' },
];

/** 参考区的增删：加图片、视频、音频，模拟上传，删除，清空。上传中的进度自己走，2.4 秒走完 */
function useReferenceLab(initial: ReferenceStackItem[]) {
  const [items, setItems] = useState(initial);
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearInterval);
  }, []);

  const stop = (id: string) => {
    clearInterval(timers.current.get(id));
    timers.current.delete(id);
  };

  const add = (kind: ReferenceKind, upload = false, src?: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    setItems((list) => {
      const n = list.length;
      return [
        ...list,
        {
          id,
          kind,
          name: referenceName(list, kind),
          src: kind === 'audio' ? undefined : (src ?? pic(n)),
          duration: kind === 'video' ? DURATIONS[n % 3] : kind === 'audio' ? '15s' : undefined,
          progress: upload ? 0 : undefined,
        },
      ];
    });
    if (upload) {
      const t0 = performance.now();
      const timer = setInterval(() => {
        const p = Math.min(100, ((performance.now() - t0) / 2400) * 100);
        setItems((list) => list.map((i) => (i.id === id ? { ...i, progress: p >= 100 ? undefined : p } : i)));
        if (p >= 100) stop(id);
      }, 50);
      timers.current.set(id, timer);
    }
  };

  const remove = (id: string) => {
    stop(id);
    setItems((list) => list.filter((i) => i.id !== id));
  };

  const clear = () => {
    timers.current.forEach(clearInterval);
    timers.current.clear();
    setItems([]);
  };

  return { items, add, remove, clear, popLast: () => items.length && remove(items[items.length - 1].id) };
}

const SLOW = {
  '--motion-duration-100': '500ms',
  '--motion-duration-150': '750ms',
  '--motion-duration-200': '1000ms',
  '--motion-duration-300': '1500ms',
  '--motion-duration-400': '2000ms',
} as CSSProperties;

const caption: CSSProperties = {
  margin: 'var(--spacing-6) 0 0',
  color: 'var(--color-text-fill-tertiary)',
  fontSize: 'var(--font-size-12)',
  lineHeight: 'var(--font-line-height-20)',
};

const bar: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  padding: 'var(--spacing-12) var(--spacing-24)',
  borderTop: 'var(--border-width-1) solid var(--color-border-subtle)',
};

/**
 * 可操作的输入框：照参考区演示。加素材、鼠标移上去展开、模拟上传、删除、清空、固定展开、慢放。
 * 也能把图片文件拖进输入框。缩略图是占位图，不是真实素材。
 */
export function PromptBoxLab() {
  const { items, add, remove, clear, popLast } = useReferenceLab(LAB_START);
  const [pinned, setPinned] = useState(false);
  const [slow, setSlow] = useState(false);
  const [open, setOpen] = useState(false);

  const dropFiles = (files: File[]) =>
    files.forEach((f) => {
      const kind: ReferenceKind = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
      add(kind, true, kind === 'image' ? URL.createObjectURL(f) : undefined);
    });

  const status = items.length === 0 ? '空' : items.length === 1 ? '一个' : open || pinned ? '展开' : '收起（叠放）';

  return (
    <figure className="shell-demo" style={slow ? SLOW : undefined}>
      <div className="shell-demo-preview" data-stage="base">
        <PromptBox
          defaultValue={LONG}
          placeholder="描述你想生成的视频，@ 引用参考素材"
          onDropFiles={dropFiles}
          references={
            <ReferenceStack
              items={items}
              expanded={pinned || undefined}
              onAdd={() => add('image')}
              onRemove={remove}
              onExpandedChange={setOpen}
            />
          }
          toolbar={videoToolbar()}
          actions={
            <>
              {countSelect}
              <GenerateButton cost={99} />
            </>
          }
        />
      </div>
      <div style={bar}>
        <Button size="sm" onClick={() => add('image')}>加图片</Button>
        <Button size="sm" onClick={() => add('video')}>加视频</Button>
        <Button size="sm" onClick={() => add('audio')}>加音频</Button>
        <Button size="sm" onClick={() => add('image', true)}>模拟上传</Button>
        <Button size="sm" onClick={popLast}>删掉最后一个</Button>
        <Button size="sm" onClick={clear}>清空</Button>
        <ToolbarSwitch label="固定展开" checked={pinned} onChange={setPinned} />
        <ToolbarSwitch label="慢放 5 倍" checked={slow} onChange={setSlow} />
        <span style={{ ...caption, margin: 0, marginLeft: 'auto', fontFamily: 'var(--shell-mono)' }}>
          {status} · {items.length} 个素材
        </span>
      </div>
    </figure>
  );
}

