# 输入控件（inputs）· 从网站页面搬出来的内容

页面精简时删掉的规范文字，原样放在这里。网站页面只留属性面板 + 参数表 + 少量交互示例。
这一页原来没有「旧名对照」表。

## 页面说明（原来在 PageHeader 下面）

原 lead：让用户输入内容的控件：输入框、数字输入框、下拉选择、多行输入框。高度只有 32 一档，圆角 8，底色白 8%；单行用 13 号字，多行用 14 号字。

### 共用的状态

输入框、数字输入框、多行输入框用同一套状态。聚焦没有特殊样式，只出现光标，不加描边。

| 状态 | 底色 | 文字 | 描边 |
|---|---|---|---|
| 默认（空） | 白 8% · `--color-bg-fill-container-light-1` | 占位文字，白 30% · `--color-text-fill-placeholder` | 无 |
| 悬停 | 白 12% · `--color-bg-fill-container-light-1-hover` | 同默认 | 无 |
| 聚焦 | 白 8% | 只出现光标（`--color-text-fill-primary`） | 无 |
| 已输入 | 白 8% | primary · `--color-text-fill-primary` | 无 |
| 错误 | 白 8% | primary | 1px · `--color-status-danger` |
| 禁用 | 白 4% · `--color-bg-fill-container-light-2` | disabled，白 20% · `--color-text-fill-disabled` | 无 |

数字输入框只有默认、悬停、聚焦、禁用四个，没有「已输入」和「错误」。下拉选择的状态见它自己那一节。

三个输入组件的写法一样：`className`、`style` 加在最外层的框上，其余属性（`value`、`placeholder`、`disabled`、`onChange`、`aria-label` 这些）都给里面真正输入的 `<input>` 或 `<textarea>`，`ref` 也指向它。

属性面板的说明句（原文）：
- Input：在右边面板选状态、左图标、字数，和 Figma 右侧属性面板一样。预览里的输入框也能打字。
- Select：在右边面板选样式、状态，和 Figma 右侧属性面板一样。预览里的下拉也能点开、选值。
- Textarea：在右边面板选状态、字数，和 Figma 右侧属性面板一样。预览里的输入框也能打字，右下角可以拖着改高度。

## Input

### 用途

单行输入：搜索、改名、表单。

### 结构

左图标（可选）+ 输入的文字 + 字数（可选），水平排列，间距 8。外面是一个 `<label>`，点框的任何地方都能输入。

- 占位文字和输入内容是同一个 `<input>`：没内容时显示 `placeholder`，有内容显示内容。
- 左图标固定 16，比如搜索框用 Search。
- 字数放在框内右侧，比如「0/50」。
- 宽度默认填满（`width: 100%`）；Figma 里摆的是 240，用的时候在 `className` 或 `style` 里设。
- 没有可见文字标签时，必须写 `aria-label`。

### 属性（Figma 对应）

| 属性 | 选项 | 代码 |
|---|---|---|
| 占位文字 | 没输入时的提示 | `placeholder="请输入"` |
| 文字 | 输入的内容 | `value="…"`，输入时触发 `onChange`（和原生的一样）；不想自己管状态就用 `defaultValue` |
| 左图标 | 开 / 关 | `leftIcon="Search"` |
| 字数、字数文字 | 开 / 关 | `counter="0/50"`，传什么显示什么，超没超限自己算 |
| 状态 | 默认 / 悬停 / 聚焦 / 已输入 / 错误 / 禁用 | 悬停、聚焦由鼠标、键盘触发；已输入是有 `value`；错误 `invalid`；禁用 `disabled` |

高度不分档，只有 32。弹窗里的输入框也是 32。

### 样子

| 部分 | 值 | 变量 |
|---|---|---|
| 高 | 32 | — |
| 圆角 | 8 | `--border-radius-sm` |
| 左右内边距 | 12 | `--spacing-md` |
| 元素间距 | 8 | `--spacing-sm` |
| 文字 | 13 常规，行高 20 | `--font-size-13` / `--font-line-height-20` |
| 左图标 | 16，tertiary | `--color-text-fill-tertiary` |
| 字数 | 12 常规，tertiary | `--font-size-12` / `--color-text-fill-tertiary` |
| 错误描边 | 1px，向里画 | `--border-width-sm` / `--color-status-danger` |

- 底色变化 100ms ease-in-out，见动效页。
- 描边用 1px 透明边占位，错误时只换颜色，框的大小和文字位置不变。
- 禁用时占位文字、左图标、字数都是 disabled 色。

状态矩阵（已删）：默认 / 悬停 / 聚焦 / 已输入 / 错误 / 禁用 六格，3 列，每格宽 240。

### 用法

- 搜索、改名、表单里的单行输入用它。只输入数字的用数字输入框。
- 搜索框：左边放 Search 图标，宽度填满。
- 需要限制字数的：右边放字数；超了变错误，提示写清楚原因。
- 表单行是模板（Figma「模板 · 通用」页「表单」）：标签 13 号 secondary 在上，间距 8；提示 12 号 tertiary 在下；出错时提示换成 danger 色。

搜索框：左图标 Search（示例已删，代码如下；属性面板里打开「左图标」就是它）：

```jsx
<div style={{ width: 240 }}>
  <Input leftIcon="Search" placeholder="搜索" aria-label="搜索" />
</div>
```

表单行：标签 + 输入框 + 提示（超过 50 个字变错误）——示例仍在网站页面里。

## NumberInput

### 用途

输入一个数值，可以带单位，比如时长「12 秒」。只输入数字的地方用它，不用普通输入框。

### 结构

数值 + 单位（可选），水平排列，间距 4，居中。宽度跟着内容走，最小 64。

- 范围有限、要拖着调的，左边配一个滑块（见「选择控件」页 Slider）。
- 用文字输入框加 `inputmode="numeric"`，不用 `type="number"`，免得出现上下小箭头。输入时组件会自动去掉非数字，所以只能是非负整数；小数、负数 **待定**。
- 没有可见标签时，必须写 `aria-label`。

### 属性（Figma 对应）

| 属性 | 选项 | 代码 |
|---|---|---|
| 数值 | 输入的数字 | `value="12"`（字符串，空是 `""`），输入时触发 `onChange(value)`，参数是只剩数字的新值；不想自己管状态就用 `defaultValue` |
| 显示单位、单位 | 开 / 关 | `unit="秒"` |
| 状态 | 默认 / 悬停 / 聚焦 / 禁用 | 悬停、聚焦由鼠标、键盘触发；禁用 `disabled` |

### 样子

| 部分 | 值 | 变量 |
|---|---|---|
| 高 / 最小宽 | 32 / 64 | — |
| 圆角 | 8 | `--border-radius-sm` |
| 左右内边距 | 8 | `--spacing-sm` |
| 数值和单位间距 | 4 | `--spacing-xxs` |
| 数值 | 13 常规，primary | `--font-size-13` / `--color-text-fill-primary` |
| 单位 | 12 常规，tertiary | `--font-size-12` / `--color-text-fill-tertiary` |

- 底色和状态同「共用的状态」，聚焦没有描边。禁用时数值和单位都是 disabled 色。

状态矩阵（已删）：默认 / 悬停 / 聚焦 / 禁用 四格（带单位「秒」，数值 12）。

### 用法

- 时长、数量这类只输入数字、可以带单位的地方。
- 要拖着调的，和滑块放在一起，两个联动，见「选择控件」页的「时长」例子。

时长：数值 + 单位（只能输入数字）——示例已删，代码如下：

```jsx
<NumberInput defaultValue="12" unit="秒" aria-label="时长（秒）" />
```

## Select

### 用途

点开后从列表里选一个值。「填充」用在表单和面板里；「无底」用在工具条上，比如输入框里的模型选择。

### 结构

Select 只是触发器：左图标（可选）+ 文字 + 右箭头，间距 4。展开后的列表是菜单模板（Menu）+ MenuItem，由 Dropdown 弹出来，见「菜单和提示」页。

- 最外层是 Dropdown 的壳，包着触发器；`className`、`style` 加在它上面，填充的宽度也在这里设。
- 列表挂在 body 上，跟着触发器走，不会被外层的 `overflow` 裁掉；放不下会自己翻到另一边。
- 左图标 16，右边是 16 的小箭头 DownArrowSmall；展开时换成 UpArrowSmall（换图标，不是旋转）。
- 文字没选时是占位文字，选了是选中的值。
- 列表宽度和触发器一样宽；当前项是 MenuItem 的「选中」状态：白 8% 底，不打勾。
- 选项可以带左图标（`icon`），比如模型 logo；选中后触发器的左图标跟着换。
- 点触发器展开，点选项选值，点别处或按 Esc 收起。键盘：↑ ↓ 打开并在列表里移动，Home / End 到头，回车或空格选中，Tab 离开时收起。在弹窗里用时，Esc 只收起列表，不会连弹窗一起关。
- 选项只有 2–6 个、而且一眼能看完的，用分段选择器，不用下拉。

### 属性（Figma 对应）

| 属性 | 选项 | 代码 |
|---|---|---|
| 样式 | 填充 / 无底 | `variant="fill"` / `"plain"`，填充是默认 |
| 选项 | 列表里有哪些 | `options={[{ value: 'png', label: 'PNG' }]}`，某一项不能选就加 `disabled: true` |
| 选中的值 | 没选 / 选了一项 | `value="png"`（没选传 `null`）；不想自己管状态就用 `defaultValue`；选了触发 `onChange(value)` |
| 状态 | 默认 / 悬停 / 展开 / 已选 / 禁用 | 悬停由鼠标触发；展开 `open`，不想自己管就用 `defaultOpen`，展开、收起触发 `onOpenChange(open)`；已选是 `value` 有值，没选时显示 `placeholder`；禁用 `disabled` |
| 占位文字、文字 | 没选时的提示、选中的值 | `placeholder="请选择"`；选中的值显示选项的 `label` |
| 左图标 | 开 / 关 | `leftIcon="ImageGeneration"` |
| 列表位置 | 下面 / 上面 | `placement="bottom-start"`（默认，下方、左对齐）/ `"top-start"` 等，放不下会自己翻到另一边。Figma 没定，**待定** |
| 说明 | 没有可见标签时 | `aria-label="模型"`，写在触发器上 |

只有 32 一档（36 已去掉）。无底一般都有当前值，所以「默认」「悬停」「展开」「已选」都显示值；还没有值时才显示占位文字。

### 样子

| 部分 | 填充 | 无底 |
|---|---|---|
| 高、圆角 | 32、8（`--border-radius-sm`） | 同左 |
| 左右内边距 | 12 · `--spacing-md` | 8 · `--spacing-sm` |
| 宽度 | 拉伸（Figma 里摆的是 200） | 跟着内容走 |
| 元素间距 | 4 · `--spacing-xxs` | 同左 |
| 文字 | 13 常规，行高 20；占位文字 `--color-text-fill-placeholder`，选中的值 `--color-text-fill-primary` | 同左 |
| 左图标、右箭头 | 16，tertiary · `--color-text-fill-tertiary` | 同左 |
| 默认 | 白 8% · `--color-bg-fill-container-light-1` | 透明 |
| 悬停 | 白 12% · `--color-bg-fill-container-light-1-hover` | 白 8% · `--color-bg-fill-container-light-2-hover` |
| 展开 | 白 8%，箭头朝上 | 白 12% · `--color-bg-fill-container-light-2-pressed`，箭头朝上 |
| 已选 | 文字 primary，底同默认 | 文字 primary，底同默认 |
| 禁用 | 白 4% · `--color-bg-fill-container-light-2`；占位文字、箭头 disabled | 透明；占位文字、箭头 disabled |

- 悬停、展开的底色变化 100ms ease-in-out。
- 列表出现 200ms ease-out（淡入），消失 150ms ease-in（淡出），见动效页。
- 列表和触发器的间距：**待定**。Figma 没定，网站暂用 4。
- 无底的触发器很窄，列表要不要跟着窄：**待定**。Figma 只写了「和触发器一样宽」；网站暂时让无底的列表按内容撑宽、但不比触发器窄，填充的列表和触发器一样宽。

状态矩阵（已删）：行 填充 / 无底，列 默认 / 悬停 / 展开 / 已选 / 禁用；另有「展开后的样子」两个静态例子：填充（还没选）、无底（当前是选项一），列表是直接摊开的 Menu。

### 用法

- **填充**：表单、面板里，宽度拉伸，和输入框并排时高度一致。
- **无底**：工具条上，比如输入框里的模型选择，宽度跟着内容走。
- 从列表里选一个值，选项多、或者文字长的用下拉；只有 2–6 个、一眼能看完的用分段选择器。
- 展开后的列表用菜单模板，当前项用「选中」状态，不打勾（2026-10-29 用户定）。

示例（已删，代码如下）：

填充：表单里选一个值。点开选一个，点别处或按 Esc 收起。

```jsx
<div style={{ width: 200 }}>
  <Select
    aria-label="导出格式"
    placeholder="请选择"
    options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }, { value: 'webp', label: 'WebP' }]}
  />
</div>
```

无底：工具条上选模型，带左图标。

```jsx
<Select
  variant="plain"
  aria-label="模型"
  leftIcon="ImageGeneration"
  defaultValue="a"
  options={[{ value: 'a', label: '模型 A' }, { value: 'b', label: '模型 B' }, { value: 'c', label: '模型 C' }]}
/>
```

## Textarea

### 用途

输入一段话：描述、备注。14 号字，是需要阅读的内容。

### 结构

输入的文字在上，字数在右下角，垂直排列，间距 8。外面是一个 `<label>`，点框的任何地方都能输入。

- 默认 320 × 104，可以拉伸；宽度默认填满（`width: 100%`），高度可以拖。
- 占位文字和输入内容是同一个 `<textarea>`。
- 字数放在右下角，和正文间距 8。
- 提示词输入用画布页的 PromptInput；首页、对话里的整块输入区是模板，见下面「提示词输入框」。

### 属性（Figma 对应）

| 属性 | 选项 | 代码 |
|---|---|---|
| 占位文字 | 没输入时的提示 | `placeholder="请输入描述"` |
| 文字 | 输入的内容 | `value="…"`，输入时触发 `onChange`；不想自己管状态就用 `defaultValue` |
| 字数 | 开 / 关 | `counter="0/500"` |
| 状态 | 默认 / 悬停 / 聚焦 / 已输入 / 错误 / 禁用 | 同输入框：错误 `invalid`，禁用 `disabled` |

### 样子

| 部分 | 值 | 变量 |
|---|---|---|
| 默认尺寸 | 320 × 104，可以拉伸 | — |
| 圆角 | 8 | `--border-radius-sm` |
| 内边距 | 12 | `--spacing-md` |
| 文字 | 14 常规，行高 22 | `--font-size-14` / `--font-line-height-22` |
| 字数 | 12 常规，tertiary，右下角 | `--font-size-12` / `--color-text-fill-tertiary` |
| 错误 | 1px danger 描边，字数也变 danger | `--color-status-danger` |
| 禁用 | 字数 disabled 色 | `--color-text-fill-disabled` |

- 底色和状态同「共用的状态」，聚焦没有描边。

状态矩阵（已删）：默认 / 悬停 / 聚焦 / 已输入 / 错误 / 禁用 六格，2 列，每格宽 320。

### 用法

- 描述、备注这类一段话的输入用它；一行的用输入框。
- 需要限制字数的，右下角放字数；超了变错误，字数一起变红。

描述：字数实时变化（超过 500 个字变错误）——示例仍在网站页面里。

提示词输入框（模板，不是组件）：产品首页、对话面板里的输入区按它做。底色 surface，圆角 24，内边距 16，文字 14/22；下面一条工具条：左边上传（IconButton 32 · 次要）、模型选择（Select · 无底），右边发送（IconButton 36 · 主要）。工具条里的东西按场景增删。完整版在 Figma「模板 · 通用」页「输入框」。

输入区贴着屏幕底部，所以模型选择的列表向上展开（`placement="top-start"`）。（示例仍在网站页面里。）
