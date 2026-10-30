import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { copyText, CopyButton, Tag } from '@shell';

// 变量页的数据和表格。规范文字在 tokens.mdx。
// 每一行：token 是 CSS 变量名（和 kivi/tokens.css 一一对应），figma 是 Figma 里的名字，use 是用在哪，status 是新 / 占位。
// 「值」不写在这里：页面加载时用 getComputedStyle 从 tokens.css 读，Figma 改了变量只改 tokens.css。

export type TokenKind = 'color' | 'space' | 'radius' | 'stroke' | 'font-size' | 'line-height' | 'weight' | 'opacity' | 'motion' | 'effect';

export interface TokenRow {
  /** CSS 变量名，比如 --color-text-fill-secondary */
  token: string;
  /** Figma 里的变量名 */
  figma: string;
  /** 用在哪。反引号包起来的显示成代码 */
  use: string;
  /** new：v2 新增；draft：占位，取值待视觉确定，可以照用 */
  status?: 'new' | 'draft';
}

export interface TokenGroup {
  /** 「复制全部变量」时这一组的注释 */
  title: string;
  /** 决定预览怎么画 */
  kind: TokenKind;
  /** 最后一列的表头，默认「用在哪」 */
  useHeader?: string;
  rows: TokenRow[];
}

// 顺序就是页面顺序，也是「复制全部变量」的顺序
export const TOKEN_GROUPS = {
  bg: {
    title: '底色',
    kind: 'color',
    rows: [
      { token: '--color-bg-fill-base', figma: 'color/bg/fill/base', use: '全局底色：外框、画布、各页面的底。不要用于面板卡片（用叠加）、弹窗（surface）、浮层（popup）' },
      { token: '--color-bg-fill-surface', figma: 'color/bg/fill/surface', use: '必须不透明的地方：盖在画布上的节点卡片、浮动面板、模态弹窗。不要用于页面里普通的面板和卡片（用 container-light-2）', status: 'new' },
      { token: '--color-bg-fill-popup', figma: 'color/bg/fill/popup', use: '实色的提示浮层：Tooltip、Toast。菜单、下拉用 glass；模态弹窗用 surface + mask' },
      { token: '--color-bg-fill-glass', figma: 'color/bg/fill/glass', use: '玻璃浮层：会浮动、会跟着移动、可能盖住画面、面积不大的东西，比如下拉、右键、节点工具栏、参数面板。配 `--effect-glass-blur` 和描边 `--color-border-subtle`' },
      { token: '--color-bg-fill-mask', figma: 'color/bg/fill/mask', use: '模态弹窗下面的遮罩，每一级弹窗一层，不模糊', status: 'new' },
    ],
  },
  fill: {
    title: '填充与状态',
    kind: 'color',
    rows: [
      { token: '--color-bg-fill-container-light-1', figma: 'container-light-1', use: '按钮、输入框、标签、可点击卡片的默认底色' },
      { token: '--color-bg-fill-container-light-1-hover', figma: 'container-light-1-hover', use: 'light-1 的悬停态' },
      { token: '--color-bg-fill-container-light-1-pressed', figma: 'container-light-1-pressed', use: 'light-1 的按下态、选中态', status: 'new' },
      { token: '--color-bg-fill-container-light-2', figma: 'container-light-2', use: '页面里的面板、卡片、侧栏、分组底、列表项。不要单独用来表示「可以点」' },
      { token: '--color-bg-fill-container-light-2-hover', figma: 'container-light-2-hover', use: 'light-2 的悬停态；文字按钮、菜单项的悬停' },
      { token: '--color-bg-fill-container-light-2-pressed', figma: 'container-light-2-pressed', use: 'light-2 的按下态、选中态', status: 'new' },
      { token: '--color-bg-fill-container-dark', figma: 'container-dark', use: '凹下去的区域：上传框、图片和视频的垫底' },
      { token: '--color-bg-fill-container-dark-hover', figma: 'container-dark-hover', use: 'container-dark 的悬停态' },
    ],
  },
  text: {
    title: '文字与图标',
    kind: 'color',
    rows: [
      { token: '--color-text-fill-primary', figma: 'color/text/fill/primary', use: '标题、正文、主要图标' },
      { token: '--color-text-fill-secondary', figma: 'color/text/fill/secondary', use: '次要说明、表单标签、未选中的 Tab、次要图标' },
      { token: '--color-text-fill-tertiary', figma: 'color/text/fill/tertiary', use: '时间、数量、辅助提示、菜单分组标题、单位', status: 'new' },
      { token: '--color-text-fill-placeholder', figma: 'color/text/fill/placeholder', use: '只给输入框里的占位文字，对比度不够，不能放要读的信息' },
      { token: '--color-text-fill-disabled', figma: 'color/text/fill/disabled', use: '禁用的文字和图标' },
      { token: '--color-text-fill-on-brand', figma: 'color/text/fill/on-brand', use: '品牌色、品牌渐变上的文字和图标', status: 'new' },
    ],
  },
  border: {
    title: '描边',
    kind: 'color',
    rows: [
      { token: '--color-border', figma: 'color/border', use: '卡片的默认描边' },
      { token: '--color-border-subtle', figma: 'color/border-subtle', use: '列表分割线、菜单分割线、区块之间的细线', status: 'new' },
      { token: '--color-border-strong', figma: 'color/border-strong', use: '需要强调的描边，如勾选框未选中的边框', status: 'draft' },
      { token: '--color-border-focus', figma: 'color/border-focus', use: '节点选中、拖拽目标高亮（输入框聚焦不加描边）', status: 'new' },
    ],
  },
  brand: {
    title: '品牌色',
    kind: 'color',
    rows: [
      { token: '--color-brand-solid', figma: 'color/brand/solid', use: '选中指示、开关打开、进度、勾选框选中。不要用于大面积背景、正文' },
      { token: '--color-brand-hover', figma: 'color/brand/hover', use: '品牌色控件的悬停态', status: 'draft' },
      { token: '--color-brand-pressed', figma: 'color/brand/pressed', use: '品牌色控件的按下态', status: 'draft' },
      { token: '--color-brand-subtle', figma: 'color/brand/subtle', use: '选中态的浅底：选中的模型、选中的卡片、选中的图标按钮', status: 'draft' },
      { token: '--color-brand-gradient-1', figma: 'color/brand/gradient-1', use: '品牌渐变起点（左）' },
      { token: '--color-brand-gradient-2', figma: 'color/brand/gradient-2', use: '品牌渐变终点（右）。主要按钮：`linear-gradient(90deg, gradient-1, gradient-2)`' },
    ],
  },
  status: {
    title: '功能色（占位）',
    kind: 'color',
    rows: [
      { token: '--color-status-danger', figma: 'color/status/danger', use: '报错文字和图标、危险按钮、删除菜单项', status: 'draft' },
      { token: '--color-status-danger-subtle', figma: 'color/status/danger-subtle', use: '错误提示条、报错节点浅底、危险菜单项悬停', status: 'draft' },
      { token: '--color-status-warning', figma: 'color/status/warning', use: '警告：余额不足、即将过期', status: 'draft' },
      { token: '--color-status-warning-subtle', figma: 'color/status/warning-subtle', use: '警告提示条浅底', status: 'draft' },
      { token: '--color-status-success', figma: 'color/status/success', use: '成功提示的图标和文字', status: 'draft' },
      { token: '--color-status-success-subtle', figma: 'color/status/success-subtle', use: '成功提示条浅底', status: 'draft' },
    ],
  },
  'on-media': {
    title: '图片和视频上的控件',
    kind: 'color',
    rows: [
      { token: '--color-on-media-fill', figma: 'color/on-media/fill', use: '叠在图片、视频上的按钮、标签、勾选框底色。不要用于普通面板上的按钮', status: 'new' },
      { token: '--color-on-media-fill-hover', figma: 'color/on-media/fill-hover', use: 'on-media/fill 的悬停态', status: 'new' },
      { token: '--color-on-media-text', figma: 'color/on-media/text', use: '叠在图片、视频上的文字和图标', status: 'new' },
    ],
  },
  connector: {
    title: '画布连线',
    kind: 'color',
    rows: [
      { token: '--g-workflow-line-color-default', figma: 'connector-default', use: '连线默认，1.5px' },
      { token: '--g-workflow-line-color-drawing', figma: 'connector-drawing', use: '拖拽创建中，1.5px 虚线 6/6' },
      { token: '--g-workflow-line-color-active', figma: 'connector-active', use: '选中或悬停，2px' },
      { token: '--g-workflow-line-color-flowing', figma: 'connector-flowing', use: '执行中，1.5px + 流光' },
      { token: '--g-workflow-line-color-error', figma: 'connector-error', use: '执行出错' },
    ],
  },
  spacing: {
    title: '间距',
    kind: 'space',
    rows: [
      { token: '--spacing-0', figma: 'spacing/0', use: '去掉间距' },
      { token: '--spacing-2', figma: 'spacing/2', use: '按钮条的内边距（条 32、按钮 28）', status: 'new' },
      { token: '--spacing-4', figma: 'spacing/4', use: '图标和文字之间、紧凑标签内边距、条目之间' },
      { token: '--spacing-6', figma: 'spacing/6', use: '小按钮里图标和文字、紧凑列表项之间' },
      { token: '--spacing-8', figma: 'spacing/8', use: '最常用的组件内间距：按钮内边距、表单项之间、标签和控件之间' },
      { token: '--spacing-12', figma: 'spacing/12', use: '卡片内边距、一组相关元素之间、输入框左右内边距' },
      { token: '--spacing-16', figma: 'spacing/16', use: '面板内边距、区块之间' },
      { token: '--spacing-24', figma: 'spacing/24', use: '弹窗内边距、大区块之间、页面左右边距' },
      { token: '--spacing-32', figma: 'spacing/32', use: '页面级分区之间' },
    ],
  },
  radius: {
    title: '圆角',
    kind: 'radius',
    rows: [
      { token: '--border-radius-4', figma: 'border/radius/4', use: '标签、徽标、方形勾选框' },
      { token: '--border-radius-6', figma: 'border/radius/6', use: '小按钮（28）、chip、输入框里的小控件' },
      { token: '--border-radius-8', figma: 'border/radius/8', use: '按钮、输入框、菜单项、Tooltip，最常用' },
      { token: '--border-radius-12', figma: 'border/radius/12', use: '卡片、画布节点、菜单容器、Toast' },
      { token: '--border-radius-16', figma: 'border/radius/16', use: '弹窗、大面板' },
      { token: '--border-radius-24', figma: 'border/radius/24', use: '大容器：首页提示词输入框、大卡片、Banner。弹窗和面板仍用 16', status: 'new' },
      { token: '--border-radius-round', figma: 'border/radius/round', use: '开关、头像、圆形图标按钮、胶囊' },
    ],
  },
  stroke: {
    title: '描边粗细',
    kind: 'stroke',
    rows: [
      { token: '--border-width-1', figma: 'border/width/1', use: '默认描边' },
      { token: '--border-width-1-25', figma: 'border/width/1-25', use: '需要稍微加强的描边' },
      { token: '--border-width-1-5', figma: 'border/width/1-5', use: '线性图标线宽、选中和聚焦描边' },
    ],
  },
  'font-size': {
    title: '字号',
    kind: 'font-size',
    useHeader: '文字样式',
    rows: [
      { token: '--font-size-10', figma: 'font/size/10', use: 'caption' },
      { token: '--font-size-12', figma: 'font/size/12', use: 'body-sm' },
      { token: '--font-size-13', figma: 'font/size/13', use: 'body' },
      { token: '--font-size-14', figma: 'font/size/14', use: 'body-lg' },
      { token: '--font-size-16', figma: 'font/size/16', use: 'title-sm' },
      { token: '--font-size-20', figma: 'font/size/20', use: 'title' },
      { token: '--font-size-24', figma: 'font/size/24', use: 'display' },
    ],
  },
  'line-height': {
    title: '行高',
    kind: 'line-height',
    useHeader: '配哪个字号',
    rows: [
      { token: '--font-line-height-16', figma: 'font/line-height/16', use: '10' },
      { token: '--font-line-height-20', figma: 'font/line-height/20', use: '12、13' },
      { token: '--font-line-height-22', figma: 'font/line-height/22', use: '14' },
      { token: '--font-line-height-24', figma: 'font/line-height/24', use: '16' },
      { token: '--font-line-height-28', figma: 'font/line-height/28', use: '20' },
      { token: '--font-line-height-32', figma: 'font/line-height/32', use: '24' },
    ],
  },
  weight: {
    title: '字重、字体',
    kind: 'weight',
    rows: [
      { token: '--font-weight-regular', figma: 'font/weight/regular', use: '正文、列表、菜单项、说明' },
      { token: '--font-weight-medium', figma: 'font/weight/medium', use: '按钮文字、标题、选中项、需要强调的文字' },
      { token: '--font-weight-semibold', figma: 'font/weight/semibold', use: '很少用，只给特别需要强调的地方' },
      { token: '--font-family', figma: 'font/family', use: '产品界面字体' },
    ],
  },
  opacity: {
    title: '透明度',
    kind: 'opacity',
    rows: [
      { token: '--opacity-50', figma: 'opacity/50', use: '「轻」按钮的文字和图标' },
      { token: '--opacity-30', figma: 'opacity/30', use: '开关、滑块、勾选框的禁用态' },
      { token: '--opacity-20', figma: 'opacity/20', use: '「轻」按钮禁用时的文字和图标' },
    ],
  },
  effect: {
    title: '效果',
    kind: 'effect',
    rows: [
      { token: '--effect-glass-blur', figma: '效果样式 玻璃/背景模糊', use: '玻璃浮层的背景模糊：`backdrop-filter: blur(var(--effect-glass-blur))`' },
    ],
  },
  motion: {
    title: '动效',
    kind: 'motion',
    rows: [
      { token: '--motion-duration-100', figma: 'motion/duration/100', use: '只换颜色' },
      { token: '--motion-duration-150', figma: 'motion/duration/150', use: '小东西出现、消失' },
      { token: '--motion-duration-200', figma: 'motion/duration/200', use: '移动 100px 以内；菜单、Toast 出现' },
      { token: '--motion-duration-300', figma: 'motion/duration/300', use: '移动 100–400px；面板展开、弹窗出现' },
      { token: '--motion-duration-400', figma: 'motion/duration/400', use: '移动更远或整屏；最长' },
      { token: '--motion-ease-in-out', figma: 'motion/ease/in-out', use: '屏幕内移动、展开收起' },
      { token: '--motion-ease-out', figma: 'motion/ease/out', use: '进入、出现' },
      { token: '--motion-ease-in', figma: 'motion/ease/in', use: '退出、消失' },
      { token: '--motion-ease-expand', figma: '待补', use: '展开、收起一组东西（主站参考区）' },
    ],
  },
} satisfies Record<string, TokenGroup>;

export type TokenGroupId = keyof typeof TOKEN_GROUPS;

// ---------- 从 tokens.css 读值 ----------

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---------- 预览 ----------

function Preview({ kind, token }: { kind: TokenKind; token: string }) {
  const v = `var(${token})`;
  switch (kind) {
    case 'color':
      return <span className="tk-swatch" style={{ background: v }} />;
    case 'space':
      return <span className="tk-bar" style={{ width: v }} />;
    case 'radius':
      return <span className="tk-radius" style={{ borderRadius: v }} />;
    case 'stroke':
      return <span className="tk-stroke" style={{ height: v }} />;
    case 'opacity':
      return <span className="tk-opacity" style={{ opacity: v } as CSSProperties} />;
    case 'font-size':
      return (
        <span className="tk-text" style={{ fontSize: v }}>
          字
        </span>
      );
    case 'line-height':
      return <span className="tk-lh" style={{ height: v }} />;
    case 'weight':
      return (
        <span className="tk-text" style={token === '--font-family' ? { fontFamily: v } : { fontWeight: v as CSSProperties['fontWeight'] }}>
          字
        </span>
      );
    default:
      return null;
  }
}

/** 把反引号包起来的文字显示成代码 */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) => (
        <Fragment key={i}>{i % 2 ? <code>{part}</code> : part}</Fragment>
      ))}
    </>
  );
}

/** 点变量名，复制 var(--…) */
function TokenChip({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={copied ? 'tk-chip is-copied' : 'tk-chip'}
      title={`复制 var(${token})`}
      onClick={() => {
        copyText(`var(${token})`).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1000);
        });
      }}
    >
      {token}
    </button>
  );
}

/** 一张变量表：预览 | 变量 | CSS 变量 | 值 | 用在哪 */
export function TokenTable({ group }: { group: TokenGroupId }) {
  const g: TokenGroup = TOKEN_GROUPS[group];
  const values = useMemo(() => g.rows.map((r) => readToken(r.token)), [g]);
  const hasPreview = g.kind !== 'motion';
  const hasStatus = g.rows.some((r) => r.status);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {hasPreview && <th>预览</th>}
            <th>变量</th>
            <th>CSS 变量</th>
            <th>值</th>
            <th>{g.useHeader ?? '用在哪'}</th>
            {hasStatus && <th />}
          </tr>
        </thead>
        <tbody>
          {g.rows.map((r, i) => (
            <tr key={r.token}>
              {hasPreview && (
                <td className="tk-preview">
                  <Preview kind={g.kind} token={r.token} />
                </td>
              )}
              <td>{r.figma}</td>
              <td>
                <TokenChip token={r.token} />
              </td>
              <td className="tk-value">{values[i]}</td>
              <td>
                <Inline text={r.use} />
              </td>
              {hasStatus && (
                <td>
                  {r.status === 'new' && <Tag>新</Tag>}
                  {r.status === 'draft' && <Tag kind="draft">占位</Tag>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- 复制全部 ----------

/** 按表分组拼成 :root { … }，值是此刻从 tokens.css 读的 */
function buildRoot(): string {
  const out = [':root {'];
  Object.values(TOKEN_GROUPS as Record<string, TokenGroup>).forEach((g) => {
    out.push(`  /* ${g.title} */`);
    g.rows.forEach((r) => out.push(`  ${r.token}: ${readToken(r.token)};`));
  });
  out.push('}');
  return out.join('\n');
}

export function CopyAllTokens() {
  return (
    <div>
      <CopyButton text={buildRoot} label="复制全部变量" />
    </div>
  );
}
