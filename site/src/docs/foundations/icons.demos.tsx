import { useEffect, useInsertionEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Icon, ICON_GROUPS, type IconName } from '@kivi';
import { copyText, Tag } from '@shell';

// 图标页的数据和演示。规范文字在 icons.mdx。
// 图标本身（160 个）在 kivi/icons.ts，分组 ICON_GROUPS 也在那里；这里只写每个图标的意思和备注。
// ICON_INFO 的类型是 Record<IconName, …>：icons.ts 里加了图标，这里不补就过不了 tsc。

export interface IconInfo {
  /** 意思，用来按意思搜图标 */
  means: string;
  /** 备注 */
  note?: string;
  /** 备注前面的黄色标签：待确认 / 先不改 */
  tag?: string;
}

export const ICON_INFO: Record<IconName, IconInfo> = {
  // 方向（11）
  LeftArrow: { means: '左、返回、上一个' },
  RightArrow: { means: '右、下一个、进入' },
  DownArrow: { means: '下、展开' },
  LeftArrowSmall: { means: '小箭头、上一页', note: '图形缩到 18/24' },
  RightArrowSmall: { means: '小箭头、下一页', note: '图形缩到 18/24' },
  DownArrowSmall: { means: '下拉、展开', note: '下拉选择的箭头；图形缩到 18/24' },
  UpArrowSmall: { means: '收起', note: '下拉展开时的箭头；图形缩到 18/24' },
  FullScreen: { means: '全屏、放大' },
  Fold: { means: '收起、退出全屏' },
  StickyOnTop: { means: '置顶' },
  Switch: { means: '切换、交换' },
  // 基础操作（22）
  Add: { means: '添加、新建' },
  AddSmall: { means: '小加号', note: '图形缩到 18/24' },
  Subtract: { means: '减少' },
  SubtractSmall: { means: '小减号、缩小', note: '图形缩到 18/24' },
  Close: { means: '关闭、取消', note: '弹窗关闭用它' },
  CloseSmall: { means: '移除、小叉', note: '标签、输入框里的清除；图形缩到 18/24' },
  CheckSmall: { means: '勾、选中、完成', note: '菜单里标当前项；图形缩到 18/24' },
  More: { means: '更多' },
  Search: { means: '搜索' },
  Copy: { means: '复制' },
  Delete: { means: '删除' },
  Reset: { means: '重置、刷新、重试' },
  Previous: { means: '撤销、上一步' },
  NextStep: { means: '重做、下一步' },
  Loading: { means: '加载', note: '1 秒一圈匀速旋转' },
  Link: { means: '链接' },
  Pin: { means: '固定' },
  Share: { means: '分享、外部打开' },
  Download: { means: '下载、保存' },
  Upload: { means: '上传', note: '旧名 upload，改成首字母大写' },
  ReUpload: { means: '重新上传、替换' },
  Configuration: { means: '设置、配置、参数' },
  // 文件与资产（11）
  File: { means: '文件、文档' },
  Folder: { means: '文件夹' },
  AddFile: { means: '新建文件' },
  AddFolder: { means: '新建文件夹' },
  FileMusic: { means: '音频文件' },
  MoveTo: { means: '移动到' },
  Remove: { means: '移出' },
  Stacking: { means: '堆叠、多选' },
  Template: { means: '模板' },
  Pack: { means: '打包、素材包、封装', note: 'lucide/package（10-29 从 box 换）' },
  Subtitle: { means: '字幕、srt、文本轨', note: 'FileCard 字幕文件（srt）用', tag: '待确认' },
  // 生成与 AI（17）
  Text: { means: '文本节点', note: '自绘；不要用于字号设置（用 FontSize）；旧名 text' },
  ImageGeneration: { means: '图片生成', note: '自绘' },
  VideoGeneration: { means: '视频生成', note: '自绘' },
  Video: { means: '视频', note: '自绘' },
  Music: { means: '音乐、音频' },
  AIEnhancement: { means: 'AI 增强', note: '自绘' },
  ImageToImage: { means: '图生图', note: '自绘' },
  ImageToText: { means: '图生文', note: '自绘' },
  OneClickSameModel: { means: '一键同款', note: '自绘：两张叠放的卡，前面一张带四角星' },
  SmartEditing: { means: '智能编辑', note: '自绘' },
  LoraModel: { means: 'LoRA 模型', note: 'lucide/box' },
  Skill: { means: '技能', note: '自绘' },
  Manual: { means: '手册、说明', note: '自绘' },
  Agent: { means: 'Agent、智能体、助手', note: '大号星星只给 Agent 用；其他 AI 功能用「素材 + 小星星」' },
  OmniReference: { means: '全能参考、多模态参考' },
  FirstLastFrame: { means: '首尾帧', note: '胶片只给首尾帧用；「视频」用 Video' },
  Audio: { means: '音频、声音、音轨', note: '音频节点用它；音频封面用 Music' },
  // 图片编辑（9）
  Crop: { means: '裁剪' },
  Expand: { means: '扩图', note: '自绘' },
  HD: { means: '高清、超分' },
  Rmbg: { means: '抠图、去背景', note: '自绘' },
  RemoveEle: { means: '消除、去除' },
  ImageEditing: { means: '图片编辑', note: '自绘' },
  Brush: { means: '画笔' },
  BrushSize: { means: '笔刷大小', note: '自绘' },
  Eraser: { means: '橡皮擦' },
  // 视频剪辑（9）
  Cutting: { means: '剪切', note: '连线删除按钮也用它；旧名 Cutting1 已合并到这里' },
  Divide: { means: '分割、拆分', note: '自绘' },
  CropLeft: { means: '左侧裁剪', note: '自绘' },
  CropRight: { means: '右侧裁剪', note: '自绘' },
  VideoEditing: { means: '视频编辑', note: '自绘' },
  VideoExtend: { means: '视频延长', note: '待确认 · 自绘：画框 + 右箭头（像时间轴往右拖）' },
  VideoLoop: { means: '循环播放' },
  Connecting: { means: '拼接、连接', note: '自绘' },
  EnableConstraint: { means: '关联、锁定' },
  DisableConstraint: { means: '取消关联' },
  // 播放与音量（9）
  Play: { means: '播放（实心）', note: '按旧版加了填充' },
  Pause: { means: '暂停（实心）', note: '按旧版加了填充' },
  PlayLine: { means: '播放（线框）' },
  VolumeFull: { means: '音量大', note: '10-29 从实心改成描边' },
  VolumeHalf: { means: '音量中', note: '10-29 从实心改成描边' },
  VolumeOff: { means: '静音', note: '10-29 从实心改成描边' },
  VolumeLevel: { means: '音量、音轨', note: '自绘' },
  Preview: { means: '预览、显示' },
  ClosePreview: { means: '关闭预览、隐藏' },
  // 画布与视图（15）
  Map: { means: '小地图、导航' },
  FitContent: { means: '适应画布' },
  ZoomIn: { means: '放大' },
  ZoomOut: { means: '缩小' },
  Snap: { means: '吸附', note: '旧名 Snap1 已合并到这里' },
  DisableSnap: { means: '关闭吸附', note: '自绘：Snap 加斜线，斜线两侧留缝' },
  ShowConnections: { means: '显示连线', note: '旧名 ShowConnections-1 已合并到这里' },
  HideConnections: { means: '隐藏连线' },
  Group: { means: '编组' },
  UnGroup: { means: '取消编组' },
  AddToCanvas: { means: '添加到画布', note: '自绘' },
  Hand: { means: '抓手、拖动' },
  UseCanvas: { means: '使用画布' },
  Canvas: { means: '画布、画布项目、画框', note: '主站侧栏画布列表用', tag: '待确认' },
  Locate: { means: '定位、定位到画布', note: '画布 Agent 生成结果「定位到画布」用', tag: '待确认' },
  // 文本格式（9）
  H1: { means: '标题 1' },
  H2: { means: '标题 2' },
  H3: { means: '标题 3' },
  TextBold: { means: '加粗', note: '旧名 TextBlod' },
  TextItalic: { means: '斜体' },
  FontSize: { means: '字号设置', note: '不要用于文本节点（用 Text）' },
  OrderedList: { means: '有序列表' },
  UnOrderedList: { means: '无序列表' },
  DividingLine: { means: '分割线', note: '自绘；旧名 DivdingLine' },
  // 比例（12）
  AutoAspect: { means: '自动比例', note: '自绘' },
  Square11: { means: '1:1' },
  Square43: { means: '4:3', note: '自绘' },
  Square34: { means: '3:4', note: '自绘' },
  Square169: { means: '16:9', note: '自绘' },
  Square916: { means: '9:16', note: '自绘' },
  Square23: { means: '2:3', note: '自绘' },
  Square32: { means: '3:2', note: '自绘' },
  Square14: { means: '1:4', note: '自绘' },
  Square41: { means: '4:1', note: '自绘' },
  Square921: { means: '9:21', note: '自绘' },
  OriginalProportions: { means: '原始比例', note: '自绘' },
  // 对话与反馈（13）
  ThumbsUp: { means: '点赞' },
  ThumbsUpFill: { means: '已点赞（实心）' },
  ThumbsDown: { means: '点踩' },
  ThumbsDownFill: { means: '已点踩（实心）' },
  Collect: { means: '收藏' },
  CollectSolid: { means: '已收藏（实心）' },
  CopyTraceID: { means: '复制 Trace ID', note: '自绘' },
  Lightbulb: { means: '思考过程、灵感', note: '旧名 Light，容易和「亮色模式」混淆，所以改名' },
  Tool: { means: '工具调用', note: '旧名 icon，按图形（扳手）改名' },
  Feedback: { means: '反馈' },
  Message: { means: '询问、对话、消息' },
  Send: { means: '发送、提交', note: '上箭头' },
  NewChat: { means: '新对话、新建、编辑', note: '主站侧栏对话、画布分组的新建按钮用；和 Add 区分开', tag: '待确认' },
  // 系统（9）
  Home: { means: '首页' },
  Document: { means: '文档、教程' },
  Localization: { means: '语言、国际化' },
  Calendar: { means: '日历、日期', note: '旧名 calendar' },
  Create: { means: '创作、生成', note: '主站侧栏「创作」用', tag: '待确认' },
  Explore: { means: '探索、发现', note: '主站侧栏「探索」用', tag: '待确认' },
  AITools: { means: 'AI 工具、应用', note: '主站侧栏「AI工具」用', tag: '待确认' },
  Sidebar: { means: '侧栏、收起、展开', note: '主站侧栏收起 / 展开用', tag: '待确认' },
  Kiwi: { means: '猕猴桃、积分、余额、消耗', note: '主站积分余额、生成按钮消耗用；颜色跟随所在位置，余额处用品牌绿', tag: '待确认' },
  // 模型 Logo（13）
  Mdoel: { means: '模型 Logo', note: '名字拼错了，应为 Model；代码里在用，改名前要和后端确认', tag: '先不改' },
  Auto: { means: '模型 Logo' },
  Gemini: { means: '模型 Logo' },
  Openai: { means: '模型 Logo' },
  Bytedance: { means: '模型 Logo' },
  Flux: { means: '模型 Logo' },
  Vidu: { means: '模型 Logo' },
  Qwen: { means: '模型 Logo' },
  Kling: { means: '模型 Logo' },
  Minimax: { means: '模型 Logo' },
  Sora: { means: '模型 Logo' },
  HappyHorse: { means: '模型 Logo' },
  grok: { means: '模型 Logo' },
  // 品牌（1）
  Logo: { means: 'KIVI 字标', note: '54×24，单独用；字母跟文字色，星星是品牌绿（brand/solid）；缩放时按比例拉；主站侧栏左上角用', tag: '待确认' },
};

/** 每一组的说明。id 用在标题上，key 是 ICON_GROUPS 里的组名 */
export const GROUP_INFO: Record<string, { id: string; desc: string }> = {
  '方向': { id: 'ic-direction', desc: '箭头、展开收起、全屏、置顶、切换。' },
  '基础操作': { id: 'ic-basic', desc: '增删改查、撤销重做、上传下载等通用操作。' },
  '文件与资产': { id: 'ic-files', desc: '文件、文件夹、移动、模板、打包等资产管理操作。' },
  '生成与 AI': { id: 'ic-generate', desc: '文本 / 图片 / 视频 / 音乐生成，以及各类 AI 功能入口。以后新增的生成类图标也放这里。' },
  '图片编辑': { id: 'ic-image-edit', desc: '裁剪、扩图、高清、抠图、消除、画笔、橡皮擦等图片编辑工具。' },
  '视频剪辑': { id: 'ic-video-edit', desc: '视频编辑器里的剪切、分割、裁剪手柄、拼接、循环、比例关联等。' },
  '播放与音量': { id: 'ic-playback', desc: '播放、暂停、音量、预览开关。播放控制按旧版保持实心风格。' },
  '画布与视图': { id: 'ic-canvas', desc: '画布导航、缩放、吸附、连线、编组、抓手等。' },
  '文本格式': { id: 'ic-text-format', desc: '文本节点工具栏里的标题、加粗、斜体、字号、列表、分割线。' },
  '比例': { id: 'ic-ratio', desc: '生成参数里的画面比例。名字里的数字就是比例，比如 Square169 = 16:9。' },
  '对话与反馈': { id: 'ic-chat', desc: 'AI 对话里的点赞点踩、收藏、复制 Trace ID、思考过程、工具调用、反馈。' },
  '系统': { id: 'ic-system', desc: '首页、文档、语言、日历，主站侧栏导航（创作、探索、AI 工具、收起侧栏），积分（Kiwi）等全局入口。' },
  '模型 Logo': { id: 'ic-models', desc: '模型品牌 Logo，保持原样，不按 Lucide 重画。名字来自后端的模型配置，不要改名（Mdoel 拼错了也先不改，改之前要和后端确认）。' },
  '品牌': { id: 'ic-brand', desc: 'KIVI 字标等品牌图形。不进 Icon 统一组件，单独用；颜色已绑变量。' },
};

// ---------- 页面样式（只在这一页挂到 <head>，离开就拿掉） ----------

const STYLE_ID = 'ic-styles';

const CSS = `
/* 顶部搜索：滚动时一直在，输入后自动跳到图标表 */
.ic-find { position: sticky; top: var(--shell-top); z-index: 4; display: flex; align-items: center; gap: var(--spacing-12); margin-top: var(--spacing-24); padding: var(--spacing-12) 0; background: var(--color-bg-fill-base); }
.ic-find .shell-input { flex: 0 1 360px; }
.ic-find-count { color: var(--color-text-fill-tertiary); font-size: var(--font-size-12); line-height: var(--font-line-height-20); white-space: nowrap; }
#icon-table, .ic-group h3 { scroll-margin-top: 64px; }

/* 表格第一列不换行 */
.doc td:first-child { white-space: nowrap; }
.ic-alias td:nth-child(2), .ic-alias td:nth-child(3), .ic-alias td:nth-child(5) { white-space: nowrap; }

/* 有序步骤 */
.doc ol > li + li { margin-top: var(--spacing-8); }
.doc ol ul { margin: var(--spacing-4) 0 0; }

/* 颜色演示 */
.ic-colors { display: flex; flex-wrap: wrap; gap: var(--spacing-24); }
.ic-color { display: grid; justify-items: center; gap: var(--spacing-8); }
.ic-color small { color: var(--color-text-fill-tertiary); font-size: var(--font-size-12); line-height: var(--font-line-height-20); white-space: nowrap; }
.ic-on-brand { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--border-radius-8); background: var(--color-brand-solid); }

/* 图标表 */
.ic-count { margin-left: var(--spacing-6); color: var(--color-text-fill-tertiary); font-size: var(--font-size-13); font-weight: var(--font-weight-regular); }
.ic-table th:first-child, .ic-table td:first-child { width: 88px; }
.ic-table th:nth-child(2), .ic-table td:nth-child(2) { width: 240px; }
.ic-table th:nth-child(3), .ic-table td:nth-child(3) { width: 200px; }
.ic-table td:nth-child(2) { white-space: nowrap; }
.ic-table td:nth-child(4) .shell-tag { margin-right: var(--spacing-6); }
.ic-name {
  padding: 2px var(--spacing-6); border: 0; border-radius: var(--border-radius-4);
  background: var(--color-bg-fill-container-light-1); color: var(--color-text-fill-primary);
  font: inherit; font-family: var(--shell-mono); font-size: var(--font-size-12); line-height: var(--font-line-height-20);
  cursor: pointer;
  transition: background-color var(--motion-duration-100) var(--motion-ease-in-out);
}
.ic-name:hover { background: var(--color-bg-fill-container-light-1-hover); }
.ic-name.is-copied { background: var(--color-brand-subtle); color: var(--color-brand-solid); }
.ic-empty { margin: var(--spacing-24) 0; color: var(--color-text-fill-tertiary); }
`;

let mounted = 0;
function useIconStyles() {
  useInsertionEffect(() => {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = CSS;
    mounted += 1;
    return () => {
      mounted -= 1;
      if (mounted <= 0) document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

// ---------- 搜索：搜索框和图标表分在页面两头，用一个小仓库共享搜索词 ----------

let query = '';
const listeners = new Set<() => void>();
function setQuery(q: string) {
  query = q;
  listeners.forEach((l) => l());
}
function useQuery() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => query,
  );
}

/** 搜索词按空格拆开，每个词都要在名字、意思、备注里出现 */
function toWords(q: string) {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function matches(name: IconName, words: string[]) {
  const i = ICON_INFO[name];
  const text = [name, i.means, i.tag ?? '', i.note ?? ''].join(' ').toLowerCase();
  return words.every((w) => text.includes(w));
}

const TOTAL = ICON_GROUPS.reduce((n, g) => n + g.icons.length, 0);

/** 页面顶部的搜索框，滚动时一直在。输入后如果还没滚到图标表，就跳过去 */
export function IconSearch() {
  useIconStyles();
  const q = useQuery();
  const words = toWords(q);
  const found = words.length ? ICON_GROUPS.reduce((n, g) => n + g.icons.filter((x) => matches(x, words)).length, 0) : TOTAL;

  // 离开页面时清掉搜索词
  useEffect(() => () => setQuery(''), []);

  return (
    <div className="ic-find">
      <input
        className="shell-input"
        type="search"
        placeholder="按名字或意思搜索，比如 Close、关闭、箭头"
        aria-label="搜索图标"
        autoComplete="off"
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          const table = document.getElementById('icon-table');
          if (v && table && table.getBoundingClientRect().top > window.innerHeight * 0.6) {
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
      <span className="ic-find-count" aria-live="polite">
        {words.length ? `找到 ${found} 个` : `共 ${TOTAL} 个`}
      </span>
    </div>
  );
}

// ---------- 图标表 ----------

/** 点名字复制名字 */
function NameChip({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={copied ? 'ic-name is-copied' : 'ic-name'}
      title="点击复制名字"
      onClick={() => {
        copyText(name).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1000);
        });
      }}
    >
      {name}
    </button>
  );
}

/** 全部 160 个图标，按 ICON_GROUPS 分组：图标 | 名字 | 意思 | 备注 */
export function IconTable() {
  useIconStyles();
  const q = useQuery();
  const words = toWords(q);
  const groups = ICON_GROUPS.map((g) => ({ g, rows: g.icons.filter((n) => matches(n, words)) })).filter((x) => x.rows.length);

  return (
    <>
      <div className="ic-table" id="icon-table">
        {groups.map(({ g, rows }) => {
          const gi = GROUP_INFO[g.name];
          return (
            <section className="ic-group" key={g.name}>
              <h3 id={gi?.id}>
                {g.name} <span className="ic-count">{g.icons.length}</span>
              </h3>
              {gi && <p>{gi.desc}</p>}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>图标</th>
                      <th>名字</th>
                      <th>意思</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((name) => {
                      const i = ICON_INFO[name];
                      return (
                        <tr key={name}>
                          <td>
                            <Icon name={name} size={24} />
                          </td>
                          <td>
                            <NameChip name={name} />
                          </td>
                          <td>{i.means}</td>
                          <td>
                            {i.tag && <Tag kind="draft">{i.tag}</Tag>}
                            {i.note}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
      {groups.length === 0 && <p className="ic-empty">没有找到。换个词试试，或者按「怎么加新图标」去加。</p>}
    </>
  );
}

// ---------- 颜色演示 ----------

const COLORS: { label: string; token: string; onBrand?: boolean }[] = [
  { label: 'primary', token: '--color-text-fill-primary' },
  { label: 'secondary', token: '--color-text-fill-secondary' },
  { label: 'tertiary', token: '--color-text-fill-tertiary' },
  { label: 'disabled', token: '--color-text-fill-disabled' },
  { label: 'on-brand', token: '--color-text-fill-on-brand', onBrand: true },
  { label: 'brand/solid', token: '--color-brand-solid' },
  { label: 'danger', token: '--color-status-danger' },
];

/** 图标颜色：跟着文字颜色变量走 */
export function IconColors() {
  useIconStyles();
  return (
    <figure className="shell-demo">
      <div className="shell-demo-preview">
        <div className="ic-colors">
          {COLORS.map((c) => {
            const icon = <Icon name="Add" size={24} />;
            return c.onBrand ? (
              <div className="ic-color" key={c.label}>
                <span className="ic-on-brand" style={{ color: `var(${c.token})` }}>
                  {icon}
                </span>
                <small>{c.label}</small>
              </div>
            ) : (
              <div className="ic-color" key={c.label} style={{ color: `var(${c.token})` }}>
                {icon}
                <small>{c.label}</small>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}

/** 旧名对照表的外框：让表里的旧名、新名、类型、状态不换行。表本身写在 MDX 里 */
export function AliasTable({ children }: { children: ReactNode }) {
  useIconStyles();
  return <div className="ic-alias">{children}</div>;
}
