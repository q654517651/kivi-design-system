import { useState } from 'react';
import {
  AttachmentStrip,
  Button,
  MentionChip,
  PreviewPopover,
  PromptBox,
  ReferenceItem,
  ReferenceStack,
  type AttachmentItem,
  type ReferenceStackItem,
  type MentionChipType,
} from '@kivi';
import { Playground } from '@shell';
import './canvas.demos.css';

// 「参考和引用」页的属性面板和演示：参考区、附件条、参考格、@ 引用胶囊。参数表在 reference.mdx
// 参考格、@ 引用的零件摆放用画布演示的样式（canvas.demos.css）。

const IMG = './placeholders/';

// ---------- 素材 ----------
// 下面的素材和 generation.demos.tsx 里各放一份（那边是主站输入框用）

const PICS = ['kivi-future', 'monstera-dots', 'kiwi-light', 'ip-gouache', 'bunny-gouache', 'ip-kiwi-pile', 'kiwi-glass', 'ip-future', 'ip-peek'];
const pic = (i: number) => `./placeholders/${PICS[i % PICS.length]}-1x1.webp`;

/** Figma「悬停展开」那张图里的 8 个素材，按添加顺序：图片1、图片2、视频1、视频2、视频3、音频1、图片3、视频4 */
const SAMPLE: ReferenceStackItem[] = [
  { id: 's1', type: 'image', name: '图片1', src: pic(0) },
  { id: 's2', type: 'image', name: '图片2', src: pic(1) },
  { id: 's3', type: 'video', name: '视频1', src: pic(2), duration: '5s' },
  { id: 's4', type: 'video', name: '视频2', src: pic(3), duration: '8s' },
  { id: 's5', type: 'video', name: '视频3', src: pic(4), duration: '12s' },
  { id: 's6', type: 'audio', name: '音频1', duration: '15s' },
  { id: 's7', type: 'image', name: '图片3', src: pic(5) },
  { id: 's8', type: 'video', name: '视频4', src: pic(6), duration: '5s' },
];

const LONG =
  '明亮的商业广告风格，饼干是主角。草莓口味参考 @图片1，开场用 @视频1 的构图，音乐在重拍处切入；饼干排成整齐的阵列，镜头参考 @视频2 的运动方式，高潮时饼干掰开进入慢动作，夹心爆开、碎屑飞散，最后定格在 @图片2 的画面，配乐用 @音频1。';

const noop = () => {};

// ---------- 属性面板：参考区 ----------

type StackState = { count: string; kind: string; upload: boolean; pinned: boolean };

const imageItem = (i: number): ReferenceStackItem => ({ id: `i${i}`, type: 'image', name: `图片${i + 1}`, src: pic(i) });

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

// ---------- 属性面板：附件条 ----------

const ATTACHMENTS: AttachmentItem[] = [
  { id: 'a1', type: 'image', name: '图片1', src: pic(0) },
  { id: 'a2', type: 'video', name: '产品演示.mp4', src: pic(2), duration: '0:12' },
  { id: 'a3', type: 'audio', name: '配乐.mp3', duration: '0:36' },
  { id: 'a4', type: 'file', name: '活动策划案.pdf', ext: 'PDF' },
  { id: 'a5', type: 'file', name: '分镜数据.json', ext: 'JSON' },
  { id: 'a6', type: 'file', name: '台词.txt', ext: 'TXT' },
  { id: 'a7', type: 'file', name: '预算表.xlsx', ext: 'XLSX' },
  { id: 'a8', type: 'image', name: '图片2', src: pic(1) },
];

type StripState = { count: string; badge: boolean; remove: boolean; upload: boolean };

export function AttachmentStripPlayground() {
  const [removed, setRemoved] = useState<string[]>([]);
  return (
    <Playground<StripState>
      controls={[
        { key: 'count', label: '附件', type: 'segment', value: '5', options: [['1', '1 个'], ['3', '3 个'], ['5', '5 个'], ['8', '8 个（滚动）']] },
        { key: 'badge', label: '序号', type: 'toggle', value: false },
        { key: 'remove', label: '可删除', type: 'toggle', value: true },
        { key: 'upload', label: '上传中', type: 'toggle', value: false },
      ]}
      render={(s) => {
        const items = ATTACHMENTS.slice(0, Number(s.count))
          .filter((it) => !removed.includes(it.id))
          .map((it, i, list) => ({ ...it, ...(s.badge ? { badge: String(i + 1) } : {}), ...(s.upload && i === list.length - 1 ? { progress: 54 } : {}) }));
        return (
          <div style={{ width: 360 }}>
            <AttachmentStrip items={items} onRemove={s.remove ? (id) => setRemoved((r) => [...r, id]) : undefined} />
            {removed.length > 0 && (
              <Button size={28} variant="text" onClick={() => setRemoved([])} style={{ marginTop: 12 }}>
                恢复删掉的
              </Button>
            )}
          </div>
        );
      }}
    />
  );
}

// ---------- ReferenceItem ----------

type ReferenceItemState = { type: 'image' | 'video' | 'audio' | 'file'; size: string; badge: string; duration: string; ext: string; weight: string };

const BADGE: Record<string, string | undefined> = { none: undefined, index: '1', first: '首帧', last: '尾帧' };

export function ReferenceItemPlayground() {
  return (
    <Playground<ReferenceItemState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['video', '视频'], ['audio', '音频'], ['file', '文件']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '56', options: [['56', '56'], ['72', '72']] },
        { key: 'badge', label: '右上角标', type: 'segment', value: 'index', options: [['none', '无'], ['index', '序号'], ['first', '首帧'], ['last', '尾帧']] },
        { key: 'duration', label: '时长', type: 'text', value: '0:12' },
        { key: 'ext', label: '扩展名', type: 'text', value: 'PDF' },
        { key: 'weight', label: '权重', type: 'text', value: '' },
      ]}
      rules={(s) => ({ duration: s.type !== 'video' && s.type !== 'audio', ext: s.type !== 'file' })}
      render={(s) => (
        <ReferenceItem
          type={s.type}
          size={Number(s.size) as 56 | 72}
          src={s.type === 'image' ? `${IMG}kivi-future-1x1.webp` : s.type === 'video' ? `${IMG}kiwi-light-1x1.webp` : undefined}
          badge={BADGE[s.badge]}
          duration={(s.type === 'video' || s.type === 'audio') && s.duration ? s.duration : undefined}
          ext={s.type === 'file' && s.ext ? s.ext : undefined}
          weight={s.weight || undefined}
        />
      )}
    />
  );
}

// ---------- MentionChip ----------

type MentionChipState = { type: MentionChipType; text: string; index: string };

/** 每种类型默认摆的名字 */
const CHIP_TEXT: Record<MentionChipType, string> = {
  image: '图片1',
  video: '视频1',
  music: '音乐1',
  skill: '分镜脚本',
  node: '文本节点',
  annotation: '把这个猕猴桃换成切开的',
  model: 'Kling 2.1',
};

export function MentionChipPlayground() {
  return (
    <Playground<MentionChipState>
      controls={[
        {
          key: 'type',
          label: '类型',
          type: 'segment',
          value: 'image',
          options: [['image', '图片'], ['video', '视频'], ['music', '音乐'], ['skill', '技能'], ['node', '节点'], ['annotation', '标注'], ['model', '模型']],
        },
        { key: 'text', label: '名字', type: 'text', value: '' },
        { key: 'index', label: '序号', type: 'text', value: '1' },
      ]}
      rules={(s) => ({ index: s.type !== 'annotation' })}
      render={(s) => (
        <MentionChip
          type={s.type}
          src={s.type === 'image' || s.type === 'video' || s.type === 'annotation' ? `${IMG}kiwi-light-1x1.webp` : undefined}
          icon={s.type === 'model' ? 'Kling' : undefined}
          index={s.type === 'annotation' ? s.index : undefined}
        >
          {s.text || CHIP_TEXT[s.type]}
        </MentionChip>
      )}
    />
  );
}

// ---------- 引用标签 + 悬停预览（原来在「标注」页） ----------

/** 输入框、用户消息里的标注点标签：悬停看大图（带标注框）和描述，和附件的预览是同一个 PreviewCard */
export function AnnotationChipDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
      <PreviewPopover preview={{ type: 'image', src: `${IMG}kiwi-light-1x1.webp`, box: { x: 0.12, y: 0.18, width: 0.3, height: 0.34 }, description: '把这个猕猴桃换成切开的，露出果肉' }}>
        <MentionChip type="annotation" index={1} src={`${IMG}kiwi-light-1x1.webp`}>
          把这个猕猴桃换成切开的
        </MentionChip>
      </PreviewPopover>
    </div>
  );
}
