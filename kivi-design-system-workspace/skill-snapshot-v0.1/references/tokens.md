# 变量表

所有值来自 Figma「KIVI UI KIT V2」的变量（2026-10-27）。CSS 变量名由 Figma 名字的 `/` 换成 `-`，再在前面加 `--` 得到。写代码时带兜底值：`var(--color-bg-fill-popup, #2C2D2E)`。

状态说明：
- **新**：v2 新增，代码里可能还没有，一定要带兜底值。
- **占位**：取值待视觉确定，可以照用。
- **废弃**：不要再用。

## 目录
- 颜色：底色、填充与状态、文字与图标、描边、品牌色、功能色、图片视频上的控件、画布连线
- 尺寸：间距、圆角、描边粗细
- 文字：字号、行高、字重、字体、文字样式
- 透明度、效果
- 可复制的 CSS 变量块

## 底色

| 变量 | CSS 变量 | 值 | 用在哪 / 不要用于 | 状态 |
|---|---|---|---|---|
| color/bg/fill/base | --color-bg-fill-base | #0F1012 | 全局底色：外框、画布、各页面的底。不要用于面板卡片（用叠加）、弹窗（surface）、浮层（glass / popup） | |
| color/bg/fill/surface | --color-bg-fill-surface | #191A1B | 必须不透明的地方：盖在画布上的节点卡片、浮动面板、模态弹窗。不要用于页面里普通的面板和卡片（用 container-light-2） | 新 |
| color/bg/fill/popup | --color-bg-fill-popup | #2C2D2E | 提示类浮层：Tooltip、Toast。不要用于模态弹窗（用 surface + mask） | |
| color/bg/fill/glass | --color-bg-fill-glass | rgba(24,24,24,0.7) | 「选」东西的浮层：菜单、下拉列表、右键菜单、节点工具栏、参数面板、节点面板。必须配 1px `--color-border` 描边、`backdrop-filter: blur(16px)`、圆角 12 | 新 |
| color/bg/fill/mask | --color-bg-fill-mask | rgba(0,0,0,0.6) | 模态弹窗下面的遮罩，每一级弹窗一层，不模糊 | 新 |
| color/bg/fill/popup-raised | --color-bg-fill-popup-raised | 同 popup | 并入 popup | 废弃 |

## 填充与状态

能点的东西从 8% 起：默认 8%、悬停 12%、按下 16%。4% 只用来区分大面积区域。

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/bg/fill/container-light-1 | --color-bg-fill-container-light-1 | rgba(255,255,255,0.08) | 按钮、输入框、标签、可点击卡片的默认底色 | |
| …/container-light-1-hover | --color-bg-fill-container-light-1-hover | rgba(255,255,255,0.12) | light-1 的悬停态 | |
| …/container-light-1-pressed | --color-bg-fill-container-light-1-pressed | rgba(255,255,255,0.16) | light-1 的按下态、选中态 | 新 |
| color/bg/fill/container-light-2 | --color-bg-fill-container-light-2 | rgba(255,255,255,0.04) | 页面里的面板、卡片、侧栏、分组底、列表项。不要单独用来表示「可以点」 | |
| …/container-light-2-hover | --color-bg-fill-container-light-2-hover | rgba(255,255,255,0.08) | light-2 的悬停态；文字按钮、菜单项的悬停 | |
| …/container-light-2-pressed | --color-bg-fill-container-light-2-pressed | rgba(255,255,255,0.12) | light-2 的按下态、选中态 | 新 |
| color/bg/fill/container-dark | --color-bg-fill-container-dark | rgba(0,0,0,0.4) | 凹下去的区域：上传框、图片和视频的垫底 | |
| …/container-dark-hover | --color-bg-fill-container-dark-hover | rgba(0,0,0,0.3) | container-dark 的悬停态 | |

## 文字与图标

图标和文字用同一套颜色。

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/text/fill/primary | --color-text-fill-primary | #FFFFFF | 标题、正文、主要图标 | |
| color/text/fill/secondary | --color-text-fill-secondary | rgba(255,255,255,0.6) | 次要说明、表单标签、未选中的 Tab、次要图标 | |
| color/text/fill/tertiary | --color-text-fill-tertiary | rgba(255,255,255,0.4) | 时间、数量、辅助提示、菜单分组标题、单位 | 新 |
| color/text/fill/placeholder | --color-text-fill-placeholder | rgba(255,255,255,0.3) | 只给输入框里的占位文字，对比度不够，不能放要读的信息 | |
| color/text/fill/disabled | --color-text-fill-disabled | rgba(255,255,255,0.2) | 禁用的文字和图标 | |
| color/text/fill/on-brand | --color-text-fill-on-brand | #000000 | 品牌色、品牌渐变上的文字和图标 | 新 |

## 描边

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/border | --color-border | rgba(255,255,255,0.12) | 卡片、玻璃浮层的默认描边 | |
| color/border-subtle | --color-border-subtle | rgba(255,255,255,0.08) | 列表分割线、菜单分割线、区块之间的细线 | 新 |
| color/border-strong | --color-border-strong | rgba(255,255,255,0.5) | 需要强调的描边，如勾选框未选中的边框 | 占位 |
| color/border-focus | --color-border-focus | #2BFF75 | 节点选中、拖拽目标高亮（输入框聚焦不加描边） | 新 |

## 品牌色

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/brand/solid | --color-brand-solid | #2BFF75 | 选中指示、开关打开、进度、勾选框选中。不要用于大面积背景、正文 | |
| color/brand/hover | --color-brand-hover | #5CFF95 | 品牌色控件的悬停态 | 占位 |
| color/brand/pressed | --color-brand-pressed | #1FD962 | 品牌色控件的按下态 | 占位 |
| color/brand/subtle | --color-brand-subtle | rgba(43,255,117,0.12) | 选中态的浅底：选中的模型、选中的卡片、选中的图标按钮 | 占位 |
| color/brand/gradient-1 | --color-brand-gradient-1 | #CEFF5D | 品牌渐变起点（左） | |
| color/brand/gradient-2 | --color-brand-gradient-2 | #2BFF75 | 品牌渐变终点（右）。主要按钮：`linear-gradient(90deg, gradient-1, gradient-2)` | |

## 功能色

文字和图标用实色，提示条和报错底色用对应的 subtle。取值都是占位。

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/status/danger | --color-status-danger | #FF4D4F | 报错文字和图标、危险按钮、删除菜单项 | 占位 |
| color/status/danger-subtle | --color-status-danger-subtle | rgba(255,77,79,0.12) | 错误提示条、报错节点浅底、危险菜单项悬停 | 占位 |
| color/status/warning | --color-status-warning | #FFA940 | 警告：余额不足、即将过期 | 占位 |
| color/status/warning-subtle | --color-status-warning-subtle | rgba(255,169,64,0.12) | 警告提示条浅底 | 占位 |
| color/status/success | --color-status-success | #2BFF75 | 成功提示的图标和文字 | 占位 |
| color/status/success-subtle | --color-status-success-subtle | rgba(43,255,117,0.12) | 成功提示条浅底 | 占位 |

## 图片和视频上的控件

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| color/on-media/fill | --color-on-media-fill | rgba(0,0,0,0.4) | 叠在图片、视频上的按钮、标签、勾选框底色。不要用于普通面板上的按钮 | 新 |
| color/on-media/fill-hover | --color-on-media-fill-hover | rgba(0,0,0,0.6) | on-media/fill 的悬停态 | 新 |
| color/on-media/text | --color-on-media-text | #FFFFFF | 叠在图片、视频上的文字和图标 | 新 |

## 画布连线

代码沿用已有的变量名，不按命名规则转换。

| 变量 | CSS 变量 | 值 | 用在哪 |
|---|---|---|---|
| color/canvas/connector-default | --g-workflow-line-color-default | #424242 | 连线默认，1.5px |
| color/canvas/connector-drawing | --g-workflow-line-color-drawing | rgba(255,255,255,0.35) | 拖拽创建中，1.5px 虚线 6/6 |
| color/canvas/connector-active | --g-workflow-line-color-active | rgba(255,255,255,0.55) | 选中或悬停，2px |
| color/canvas/connector-flowing | --g-workflow-line-color-flowing | rgba(255,255,255,0.9) | 执行中，1.5px + 流光 |
| color/canvas/connector-error | --g-workflow-line-color-error | rgba(255,255,255,0.6) | 执行出错 |

## 间距

| 变量 | CSS 变量 | 值 | 用在哪 |
|---|---|---|---|
| spacing/none | --spacing-none | 0 | 去掉间距 |
| spacing/xxs | --spacing-xxs | 4px | 图标和文字之间、紧凑标签内边距、条目之间 |
| spacing/xs | --spacing-xs | 6px | 小按钮里图标和文字、紧凑列表项之间 |
| spacing/sm | --spacing-sm | 8px | 最常用的组件内间距：按钮内边距、表单项之间、标签和控件之间 |
| spacing/md | --spacing-md | 12px | 卡片内边距、一组相关元素之间、输入框左右内边距 |
| spacing/lg | --spacing-lg | 16px | 面板内边距、区块之间 |
| spacing/xl | --spacing-xl | 24px | 弹窗内边距、大区块之间、页面左右边距 |
| spacing/xxl | --spacing-xxl | 32px | 页面级分区之间 |

## 圆角

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| border/radius/xxs | --border-radius-xxs | 4px | 标签、徽标、方形勾选框 | |
| border/radius/xs | --border-radius-xs | 6px | 小按钮（28）、chip、输入框里的小控件 | |
| border/radius/sm | --border-radius-sm | 8px | 按钮、输入框、菜单项、Tooltip，最常用 | |
| border/radius/md | --border-radius-md | 12px | 卡片、画布节点、菜单容器、玻璃浮层、Toast | |
| border/radius/lg | --border-radius-lg | 16px | 弹窗、大面板 | |
| border/radius/xl | --border-radius-xl | 24px | 大容器：首页提示词输入框、大卡片、Banner。弹窗和面板仍用 16 | 新 |
| border/radius/round | --border-radius-round | 999px | 开关、头像、圆形图标按钮、胶囊 | |

## 描边粗细

代码里这组变量名曾拼错成 `--border-widtgh-*`，前端会改正。新代码用正确的名字并带兜底值。

| 变量 | CSS 变量 | 值 | 用在哪 |
|---|---|---|---|
| border/width/sm | --border-width-sm | 1px | 默认描边 |
| border/width/md | --border-width-md | 1.25px | 需要稍微加强的描边 |
| border/width/lg | --border-width-lg | 1.5px | 线性图标线宽、选中和聚焦描边 |

## 字号、行高、字重、字体

字号用数字命名。旧名 sm / md / lg 在代码里保留为别名，新代码用数字名。

| 字号 | CSS 变量 | 行高 | 行高变量 | 文字样式 | 用在哪 | 状态 |
|---|---|---|---|---|---|---|
| 10 | --font-size-10 | 16 | --font-line-height-16 | caption | 角标、数字徽标、缩放百分比 | 新 |
| 12 | --font-size-12 | 20 | --font-line-height-20 | body-sm | 次要信息、标签、Tooltip、小号按钮、单位 | 新 |
| 13 | --font-size-13 | 20 | --font-line-height-20 | body | 界面主文字：工具栏、导航、菜单项、按钮、输入框 | 新 |
| 14 | --font-size-14 | 22 | --font-line-height-22 | body-lg | 对话、AI 回复、提示词、说明文字、多行输入、Toast。不要用于按钮和工具栏 | 新 |
| 16 | --font-size-16 | 24 | --font-line-height-24 | title-sm | 面板标题、分区标题、弹窗标题 | 新 |
| 20 | --font-size-20 | 28 | --font-line-height-28 | title | 引导页、空状态的醒目标题 | 新 |
| 24 | --font-size-24 | 32 | --font-line-height-32 | display | 页面标题 | 新 |

| 变量 | CSS 变量 | 值 | 用在哪 | 状态 |
|---|---|---|---|---|
| font/weight/regular | --font-weight-regular | 400 | 正文、列表、菜单项、说明 | |
| font/weight/medium | --font-weight-medium | 500 | 按钮文字、标题、选中项、需要强调的文字 | 新 |
| font/weight/semibold | --font-weight-semibold | 600 | 很少用，只给特别需要强调的地方 | |
| font/family | --font-family | "PingFang SC" | 产品界面字体 | 新 |

Figma 文字样式按「文字/字号 字重」命名：`文字/13 常规`、`文字/13 粗`、`文字/14 常规`……字号 10–16 都有常规、粗、加粗三档。

## 透明度

图层整体透明度，用于禁用的图片、拖拽中的元素。颜色本身的透明度直接用颜色变量。

| 变量 | CSS 变量 | 值 |
|---|---|---|
| opacity/50 | --opacity-50 | 0.5 |
| opacity/30 | --opacity-30 | 0.3（开关、滑块、勾选框的禁用态） |
| opacity/20 | --opacity-20 | 0.2 |

## 效果

| 名字 | 值 | 用在哪 |
|---|---|---|
| 效果样式「玻璃/背景模糊」 | `backdrop-filter: blur(16px)` | 和 glass 填充、`--color-border` 描边、圆角 12 一起用 |

没有投影样式：所有浮层都不加阴影。

## 可复制的 CSS 变量块

原型、独立页面或还没接入 v2 变量的项目，把这一段放进全局样式。

```css
:root {
  /* 底色 */
  --color-bg-fill-base: #0F1012;
  --color-bg-fill-surface: #191A1B;
  --color-bg-fill-popup: #2C2D2E;
  --color-bg-fill-glass: rgba(24, 24, 24, 0.7);
  --color-bg-fill-mask: rgba(0, 0, 0, 0.6);
  /* 填充与状态 */
  --color-bg-fill-container-light-1: rgba(255, 255, 255, 0.08);
  --color-bg-fill-container-light-1-hover: rgba(255, 255, 255, 0.12);
  --color-bg-fill-container-light-1-pressed: rgba(255, 255, 255, 0.16);
  --color-bg-fill-container-light-2: rgba(255, 255, 255, 0.04);
  --color-bg-fill-container-light-2-hover: rgba(255, 255, 255, 0.08);
  --color-bg-fill-container-light-2-pressed: rgba(255, 255, 255, 0.12);
  --color-bg-fill-container-dark: rgba(0, 0, 0, 0.4);
  --color-bg-fill-container-dark-hover: rgba(0, 0, 0, 0.3);
  /* 文字与图标 */
  --color-text-fill-primary: #FFFFFF;
  --color-text-fill-secondary: rgba(255, 255, 255, 0.6);
  --color-text-fill-tertiary: rgba(255, 255, 255, 0.4);
  --color-text-fill-placeholder: rgba(255, 255, 255, 0.3);
  --color-text-fill-disabled: rgba(255, 255, 255, 0.2);
  --color-text-fill-on-brand: #000000;
  /* 描边 */
  --color-border: rgba(255, 255, 255, 0.12);
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.5);
  --color-border-focus: #2BFF75;
  /* 品牌色 */
  --color-brand-solid: #2BFF75;
  --color-brand-hover: #5CFF95;
  --color-brand-pressed: #1FD962;
  --color-brand-subtle: rgba(43, 255, 117, 0.12);
  --color-brand-gradient-1: #CEFF5D;
  --color-brand-gradient-2: #2BFF75;
  /* 功能色（占位） */
  --color-status-danger: #FF4D4F;
  --color-status-danger-subtle: rgba(255, 77, 79, 0.12);
  --color-status-warning: #FFA940;
  --color-status-warning-subtle: rgba(255, 169, 64, 0.12);
  --color-status-success: #2BFF75;
  --color-status-success-subtle: rgba(43, 255, 117, 0.12);
  /* 图片和视频上的控件 */
  --color-on-media-fill: rgba(0, 0, 0, 0.4);
  --color-on-media-fill-hover: rgba(0, 0, 0, 0.6);
  --color-on-media-text: #FFFFFF;
  /* 画布连线 */
  --g-workflow-line-color-default: #424242;
  --g-workflow-line-color-drawing: rgba(255, 255, 255, 0.35);
  --g-workflow-line-color-active: rgba(255, 255, 255, 0.55);
  --g-workflow-line-color-flowing: rgba(255, 255, 255, 0.9);
  --g-workflow-line-color-error: rgba(255, 255, 255, 0.6);
  /* 间距 */
  --spacing-none: 0px;
  --spacing-xxs: 4px;
  --spacing-xs: 6px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;
  /* 圆角 */
  --border-radius-xxs: 4px;
  --border-radius-xs: 6px;
  --border-radius-sm: 8px;
  --border-radius-md: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;
  --border-radius-round: 999px;
  /* 描边粗细 */
  --border-width-sm: 1px;
  --border-width-md: 1.25px;
  --border-width-lg: 1.5px;
  /* 字号、行高、字重、字体 */
  --font-size-10: 10px;
  --font-size-12: 12px;
  --font-size-13: 13px;
  --font-size-14: 14px;
  --font-size-16: 16px;
  --font-size-20: 20px;
  --font-size-24: 24px;
  --font-line-height-16: 16px;
  --font-line-height-20: 20px;
  --font-line-height-22: 22px;
  --font-line-height-24: 24px;
  --font-line-height-28: 28px;
  --font-line-height-32: 32px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-family: "PingFang SC";
  /* 透明度 */
  --opacity-50: 0.5;
  --opacity-30: 0.3;
  --opacity-20: 0.2;
}
```
