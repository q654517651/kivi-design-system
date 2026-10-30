# 菜单和提示（menus-tooltip）页：从网站页面里挪出来的内容

来源：`site/src/docs/components/menus-tooltip.mdx` 精简前的版本。原文照搬，没有改写；`<Tag kind="draft">…</Tag>` 写成【待定】/【待确认】。
参数表在网站页面底部；这里放参数表盖不住的：用途、结构、样子、用法、动效、待定项、旧名对照。

## 页面说明

原 lead：

> 非模态浮层：Tooltip 和菜单。Tooltip 是实色 popup；菜单是玻璃浮层：#181818 70% + 背景模糊 32 + 8% 描边。都不加阴影。菜单项、分组标题、分割线是组件；整个菜单是模板，代码里叫 Menu。最后是主站侧栏的三个零件。

原开头：

Tooltip 是鼠标停留时的说明，移开就消失；菜单是点开或右键后选一个操作。操作结果（保存成功、生成失败）不用 Tooltip，用 Toast。

- 菜单在 Figma 里是模板，不是组件：往容器里放 MenuItem、MenuLabel、MenuDivider，条目随便增删。画布右键、节点右键、模型选择、@素材、下拉选择展开的列表，都用它拼，不单独做组件。代码里这个容器叫 `Menu`，条目写成它的子元素。
- 把菜单弹出来用 `Dropdown`（下面「Menu」一节），它是代码层面的组件，Figma 里没有。
- 弹出菜单、Tooltip 的出现和消失动效写在 `menus-tooltip.css` 里，规则见[动效](/foundations/motion)。

属性面板的说明（原文）：

- Tooltip：在右边面板选类型、改文字，和 Figma 右侧属性面板一样。下面的代码跟着变，可以直接复制。面板里摆的是静态的气泡（`Tooltip` 不包任何东西时就只渲染气泡本身），真实的悬停出现看「用法」。
- MenuItem：在右边面板选类型、状态和左右两边放什么。「左边二选一、右边三选一」已经写进面板规则：一边开了，同组的其他开关就灰掉。（现在改成「左边」「右边」两个单选，不再有灰掉的开关。）

## Tooltip

### 用途

鼠标停留时出现的文字提示，移开就消失。

- 只有图标的按钮必须加 Tooltip，写清楚它是做什么的；按钮上已经有文字的不用加。
- 有快捷键的把快捷键带上，比如「撤销 ⌘Z」。
- 和 Toast 的区别：Tooltip 是鼠标停留才出现、移开就消失的说明；操作结果的反馈（保存成功、生成失败）用 Toast。

### 结构

- **简单**：一行文字，后面可以带快捷键，间距 8。
- **说明**：标题 + 一段说明，竖排，间距 4，最宽 240。
- 不带小箭头、描边、阴影、毛玻璃。
- 要悬停弹出，用 `Tooltip` 把触发元素包住：`<Tooltip content="下载"><IconButton … /></Tooltip>`。气泡自己定位，出现在目标下方 8px，挂在 body 上，不会被外层的 overflow 裁掉。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 类型 | 简单 / 说明 | `variant="simple"`（默认）/ `"desc"`；不写时有 `title` 就是说明 |
| 文字 | 提示的文字 | `content`，简单是那一行字，说明是标题下面的说明 |
| 显示快捷键、快捷键 | 开 / 关；快捷键文字，比如 ⌘Z | `shortcut="⌘Z"`，只有简单有 |
| 标题 | 说明的标题 | `title="…"`，只有说明有 |
| 触发元素 | 把谁包住 | `children`，一个元素，比如 IconButton。不写就只渲染气泡本身，文档摆样子用 |
| 显示 | 受控 / 非受控 | `open`、`defaultOpen`、`onOpenChange`。一般不用写，悬停、聚焦自己出现 |
| 出现的延迟 | 默认 500ms | `delay={500}` |

### 样子

| | 简单 | 说明 |
|---|---|---|
| 尺寸 | 高 32，宽跟内容 | 最宽 240，高跟内容 |
| 内边距 | 上下 6 · `--spacing-xs`，左右 12 · `--spacing-md` | 12 · `--spacing-md` |
| 圆角 | 8 · `--border-radius-sm` | 8 · `--border-radius-sm` |
| 底色 | `--color-bg-fill-popup` | `--color-bg-fill-popup` |
| 文字 | 12 常规，行高 20，primary | 标题 13 粗，primary；说明 12 常规，secondary；行高都是 20 |
| 间距 | 文字和快捷键 8 · `--spacing-sm` | 标题和说明 4 · `--spacing-xxs` |
| 快捷键 | 12 常规，tertiary | — |

### 出现和消失

| | 规则 |
|---|---|
| 位置 | 目标下方 8px。水平方向 Figma 没定，演示里居中。靠近屏幕边缘时往里挪，下面放不下翻到上方，这也是代码里的兜底。【待定】 |
| 出现 | 鼠标停在目标上 500ms 后，150ms ease-out 淡入。键盘 Tab 到目标也会出现。 |
| 消失 | 移开立刻 100ms ease-in 淡出。按 Esc、点击目标也会收起。 |

- 层级（z-index）Figma 没定，代码里默认 1000，用 CSS 变量 `--kv-popup-z` 改。【待定】

### 用法

#### 图标按钮配 Tooltip

把鼠标停在按钮上，等半秒。IconButton 的 `label` 就是按钮的 `aria-label`；Tooltip 出现时会自动给按钮加上 `aria-describedby`。

（示例：下载 / 复制 ⌘C / 删除 三个 IconButton 各包一个 Tooltip。页面上保留这一个。）

#### 说明型：要多解释一句时用

```tsx
<Tooltip variant="desc" title="参数设置" content="调整比例、分辨率和生成数量。">
  <IconButton icon="Configuration" label="参数设置" variant="secondary" />
</Tooltip>
```

另有一个三合一静态演示（简单 / 简单带快捷键 / 说明），属性面板已覆盖，页面上删了：

```tsx
<>
  <Tooltip content="提示文字" />
  <Tooltip content="撤销" shortcut="⌘Z" />
  <Tooltip variant="desc" title="提示标题" content="提示文字，一段说明，太长就换行。" />
</>
```

## Menu（含 MenuItem、MenuLabel、MenuDivider）

菜单模板：容器 `Menu` 加上 MenuItem、MenuLabel、MenuDivider。Figma 里这个模板在「模板 · 通用」页「菜单」分区。

### 用途

下拉菜单、右键菜单、单选菜单、素材菜单。下拉选择展开的列表也是它，宽度和触发器一样宽。

### 结构

- 容器：玻璃浮层，圆角 12，内边距 4，条目间距 4。圆角 12 = 条目圆角 8 + 内边距 4，里外同心。
- 玻璃只用在会浮动、会跟着移动、可能盖住画面、面积不大的东西上：下拉、右键、子菜单、双击画布的快捷添加、节点工具栏、参数面板。弹窗不用，还是 surface + 遮罩；Tooltip、Toast 是实色 popup。
- 里面放条目：MenuItem、MenuLabel、MenuDivider，数量和顺序随便。
- 菜单在 Figma 里不是组件：条目写死在组件里，加一项就要改组件或解绑，所以用模板拼。代码里 `Menu` 只是这个容器。
- 子菜单：点了会再弹出的项，右边放子菜单箭头；弹出来的也是一个菜单模板。子菜单怎么弹出来 Figma 没定，代码里还没做。【待定】

### 属性（Figma ↔ 代码）

容器没有 Figma 属性，往里放条目就行。代码里有两个：

| 属性 | 选项 | 代码 |
|---|---|---|
| 宽度 | 由使用方定，Figma 里的例子有 120、160、220 | `width={200}`，不写就跟着内容 |
| 角色 | 菜单 / 单选列表 | `role="menu"`（默认）/ `"listbox"` |

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 底色 | glass（#181818 70%） | `--color-bg-fill-glass` |
| 背景模糊 | 32 | `--effect-glass-blur` |
| 描边 | 1，白 8%，描在里面 | `--color-border-subtle` |
| 圆角 | 12（条目 8 + 内边距 4，里外同心；2026-10-29 从 16 改） | `--border-radius-md` |
| 内边距 | 4 | `--spacing-xxs` |
| 条目间距 | 4 | `--spacing-xxs` |
| 投影 | 不加 | — |
| 宽度 | 由使用方定。Figma 里的例子有 120、160、220 几种 | — |
| 最宽、最高、超出怎么办 | Figma 没定，要不要滚动待定【待定】（参数表现在写：宽 120–240，最高 8 项（324），多了滚动，由另一个对话在改 css） | — |
| 离触发按钮、子菜单离父项的位置 | Figma 没定，演示里用 4【待定】 | — |
| 层级 z-index | Figma 没定，代码里默认 1000，用 `--kv-popup-z` 改【待定】 | — |

#### 出现和消失

| | 规则 |
|---|---|
| 出现 | 200ms ease-out，淡入 |
| 消失 | 150ms ease-in，淡出 |
| 关闭 | 点菜单项、点菜单外面、按 Esc。`Dropdown` 自带 |

### 用法

- 点开一个按钮选操作：基础菜单。在画布、节点上点右键：右键菜单。
- 要把操作分成几类：加 MenuLabel 或 MenuDivider。
- 选一个值（比例、数量、模型）：单选菜单。引用素材：素材菜单。
- 每个菜单里危险操作最多一项，放最后。

页面上删掉的五种拼法示例（属性面板和 Dropdown 面板已覆盖）：

#### 基础菜单：图标 + 文字，删除放最后

点按钮打开，点外面或按 Esc 关掉。

```tsx
<Dropdown trigger={<Button rightIcon="DownArrowSmall">更多操作</Button>}>
  <Menu width={200}>
    <MenuItem icon="Copy">复制</MenuItem>
    <MenuItem icon="Share">分享</MenuItem>
    <MenuItem icon="Download">下载</MenuItem>
    <MenuDivider />
    <MenuItem icon="Delete" variant="danger">删除</MenuItem>
  </Menu>
</Dropdown>
```

#### 右键菜单：文字 + 快捷键，不带图标

在灰色区域里点右键，菜单出现在鼠标位置。不用触发器，用 `anchorPoint` 给坐标，`open` 自己管。（页面上保留，放在 Dropdown 一节。）

#### 分组标题 + 子菜单箭头

```tsx
<Menu width={220}>
  <MenuLabel>引用该节点生成</MenuLabel>
  <MenuItem icon="Text">文本生成</MenuItem>
  <MenuItem icon="ImageGeneration">图片生成</MenuItem>
  <MenuItem icon="VideoGeneration">视频生成</MenuItem>
  <MenuItem icon="Music">音频生成</MenuItem>
  <MenuDivider />
  <MenuItem submenu>更多生成方式</MenuItem>
</Menu>
```

#### 单选：当前项用「选中」状态

白 8% 底，不打勾。外层 `role="listbox"`，每项传 `selected`（自动是 `role="option"`）。点一下切换。（页面上保留。）

#### 多选：勾选

勾放在右边，只给多选用；单选用上面的「选中」。每项传 `checked`。点一下切换，可以勾好几个。（页面上保留。）

**单选的当前项用哪种？** Figma 里两种都在：「模板 · 通用」页的单选示例和「菜单项」分区的提示用勾选；MenuItem 的组件说明和迁移映射写的是「选中」（比例、数量用选中，勾选只给多选）。【待确认】两种代码都能用，定了再删一种。

#### 素材：左边是缩略图

```tsx
<Menu width={160}>
  <MenuItem thumb={<AssetThumb size={24} src="./placeholders/kiwi-light-1x1.webp" />}>图片 1</MenuItem>
  <MenuItem thumb={<AssetThumb size={24} src="./placeholders/ip-kiwi-pile-1x1.webp" />}>图片 2</MenuItem>
  <MenuItem thumb={<AssetThumb size={24} src="./placeholders/monstera-dots-1x1.webp" />}>视频 1</MenuItem>
  <MenuItem thumb={<AssetThumb size={24} type="audio" />}>音频 1</MenuItem>
</Menu>
```

#### 下拉选择：菜单和触发器一样宽

`matchTriggerWidth` 让菜单和触发器一样宽，单选列表用 `haspopup="listbox"`。下拉选择本身的样子见[选择控件](/components/selection)。

```tsx
<Dropdown matchTriggerWidth haspopup="listbox" trigger={<Button rightIcon="DownArrowSmall" style={{ width: 160 }}>2K</Button>}>
  <Menu role="listbox">
    <MenuItem selected>1K</MenuItem> …
  </Menu>
</Dropdown>
```

## MenuItem

### 用途

菜单里的一条。可以点，点了执行一个操作或选定一个值。

### 结构

左边（可选）+ 文字 + 右边（可选），水平排列，间距 8。

- 左边放图标或缩略图，**二选一**。图标 16；缩略图是 AssetThumb 24，可以切图片 / 音频。
- 右边放快捷键、子菜单箭头、勾选，**三选一**。
- 文字撑满剩下的宽度。宽度在菜单里是「填满」。
- 渲染成 `<button type="button">`，文字包一层 `<span>`。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 菜单项上的字 | `children` |
| 类型 | 普通 / 危险 | `variant="default"`（默认）/ `"danger"` |
| 状态 | 默认 / 悬停 / 禁用 / 选中 | 悬停由鼠标触发；禁用 `disabled`；选中 `selected` |
| 左图标 | 开 / 关 | `icon="Copy"` |
| 缩略图 | 开 / 关 | `thumb={<AssetThumb size={24} src="…" />}`，和左图标二选一 |
| 快捷键、快捷键文字 | 开 / 关；文字，比如 ⌘C | `shortcut="⌘C"` |
| 子菜单箭头 | 开 / 关 | `submenu`，同时加 `aria-haspopup="menu"` |
| 勾选 | 开 / 关 | `checked`，自动是 `role="menuitemradio"` 并加 `aria-checked`；非当前项传 `checked={false}` |

- 「危险」只有默认、悬停、禁用，没有选中。
- 危险菜单项（删除）放在菜单最后，用分割线和上面隔开。
- 选中用 `selected`：自动是 `role="option"`，外层 Menu 要写 `role="listbox"`；单选里非当前项传 `selected={false}`。

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 高 | 36 | — |
| 圆角 | 8 | `--border-radius-sm` |
| 左右内边距 | 12 | `--spacing-md` |
| 元素间距 | 8 | `--spacing-sm` |
| 左图标 | 16 | — |
| 缩略图 | 24，圆角 4（AssetThumb） | — |
| 文字 | 13 常规，行高 20 | `--font-size-13` · `--font-line-height-20` |
| 快捷键 | 12 常规，tertiary | `--font-size-12` · `--color-text-fill-tertiary` |
| 子菜单箭头 | RightArrowSmall，16，tertiary | `--color-text-fill-tertiary` |
| 勾选 | CheckSmall，16，brand/solid | `--color-brand-solid` |

#### 类型和状态

（原页面有一张「类型 × 状态」静态矩阵，悬停摆成静态的，方便对照；现在由属性面板的「类型」「状态」切换代替。）

| 状态 | 普通 | 危险 |
|---|---|---|
| 默认 | 透明底；文字和图标 primary | 透明底；文字和图标 status/danger |
| 悬停 | 底 container-light-2-hover（白 8%） | 底 status/danger-subtle（danger 12%） |
| 禁用 | 文字、图标、快捷键 disabled（白 20%），不响应悬停和点击 | 同普通 |
| 选中 | 底 container-light-1（白 8%），不打勾；文字和图标 primary | — |

- 底色变化 100ms ease-in-out，见[动效](/foundations/motion)。
- 键盘焦点的样子 Figma 没定，现在暂时和悬停一样。【待定】
- 禁用时子菜单箭头、勾选的颜色 Figma 没定，代码里不改它们的颜色。【待定】

### 用法

- **左图标**：基础菜单、分组菜单，让每一项好认。**什么都不放**：右键菜单、比例、数量这类纯文字的选项。**缩略图**：@素材。
- **快捷键**：右键菜单里有快捷键的操作，比如「撤销 ⌘Z」。**子菜单箭头**：点了会再弹一个菜单的项。
- **选中**：单选菜单（包括下拉选择 Select 的列表）标出当前项，白 8% 底，不打勾，比如模型、数量、比例。**勾选**：只给多选，在右边打勾（2026-10-29 用户定）。
- **危险**：删除这类操作，放在菜单最后，用 MenuDivider 和上面隔开。
- **禁用**：条件不满足时用，比如没东西可粘贴。
- 整个菜单的拼法见 Menu。

## MenuLabel

### 用途

菜单里的分组标题，给下面几项起个名字。不能点。

### 结构

一行文字，左右内边距 12。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 标题上的字 | `children` |

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 高 | 28 | — |
| 左右内边距 | 12 | `--spacing-md` |
| 文字 | 12 常规，行高 20，tertiary | `--font-size-12` · `--color-text-fill-tertiary` |

```tsx
<Menu width={200}>
  <MenuLabel>分组标题</MenuLabel>
  <MenuItem icon="Text">文本生成</MenuItem>
</Menu>
```

### 用法

- 菜单分成几组、每组要一个名字时放在这组的最上面，比如「引用该节点生成」。
- 只有一组的菜单不用标题。

## MenuDivider

### 用途

菜单里的分割线，把不同性质的几项隔开。

### 结构

一条横线，上下各留 4，左右各缩进 8。

### 属性

没有属性。代码：`<MenuDivider />`

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 线 | 1px | `--border-width-sm` |
| 颜色 | border-subtle（白 8%） | `--color-border-subtle` |
| 上下留白 | 各 4，合起来高 9 | `--spacing-xxs` |
| 左右缩进 | 各 8 | `--spacing-sm` |

```tsx
<Menu width={200}>
  <MenuItem icon="Download">下载</MenuItem>
  <MenuDivider />
  <MenuItem icon="Delete" variant="danger">删除</MenuItem>
</Menu>
```

### 用法

- 危险操作（删除）和上面的普通操作之间必须有。
- 分组菜单里，两组之间用分割线；有了 MenuLabel 的菜单，组与组之间也可以再加。

## Dropdown

### 弹出：Dropdown

`Dropdown` 把一个触发器和一个弹出的菜单配在一起。它是代码层面的组件，Figma 里没有。

```tsx
<Dropdown trigger={<Button rightIcon="DownArrowSmall">更多操作</Button>}>
  <Menu width={200}>…</Menu>
</Dropdown>
```

| 属性 | 选项 | 代码 |
|---|---|---|
| 触发器 | 点它开关菜单，比如 Button、IconButton | `trigger={<Button … />}`，会自动加 `aria-haspopup`、`aria-expanded`、`aria-controls` |
| 弹出的内容 | 一般是一个 Menu | `children` |
| 展开 | 受控 / 非受控 | `open`、`defaultOpen`、`onOpenChange` |
| 位置 | 下方 / 上方，左对齐 / 居中 / 右对齐 | `placement="bottom-start"`（默认）/ `"bottom"` / `"bottom-end"` / `"top-start"` / `"top"` / `"top-end"` |
| 离触发器的距离 | 默认 4 | `offset={4}` |
| 和触发器一样宽 | 开 / 关 | `matchTriggerWidth`，下拉选择展开的列表用 |
| 右键菜单 | 不用触发器，菜单出现在鼠标位置 | `anchorPoint={{ x, y }}`，自己控制 `open` |
| 点菜单项后是否关闭 | 默认关闭 | `closeOnSelect={false}`，多选菜单用 |
| 弹出的是什么 | 菜单 / 单选列表 | `haspopup="menu"`（默认）/ `"listbox"` |

- 弹出层挂在 body 上、`position: fixed`，跟着触发器定位，不会被外层的 overflow 裁掉；放不下会翻到另一边，左右不超出屏幕。
- 键盘：Enter、空格或上下方向键打开，焦点落在第一项；上下方向键移动，Home、End 到头尾；Esc 关闭并回到触发器；Tab 关闭。
- 位置、离触发器的距离：Figma 没定，待定（见 Menu「样子」）。

## SidebarItem

下面三个组件（SidebarItem、SidebarLabel、SidebarMore）是主站侧栏的零件，不是菜单。整条侧栏是模板，在「模板 · 主站」页，主站页里会用到它们。

### 用途

主站侧栏的一项。「导航」是固定入口，比如新建；「列表」是历史记录，对话和画布。

### 结构

- **导航**：左图标 20 + 文字，文字和图标都是 primary。
- **列表**：左边缩略图（AssetThumb 24）+ 文字；文字默认 secondary，悬停、选中变 primary。有封面的选「图片」；没封面的选「图标」，对话用 Message，画布用 Canvas，不要直接放裸图标。
- 右边可以有「更多」：IconButton 28 弱，More 图标，点了单独弹一个菜单；悬停和选中时才显示。
- 外层是 `<div>`，不是 `<button>` 或 `<a>`：里面还要放「更多」按钮，按钮不能嵌在按钮里。回车、空格会触发它的 `onClick`。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 这一项的字 | `children` |
| 类型 | 导航 / 列表 | `variant="nav"`（默认）/ `"list"` |
| 状态 | 默认 / 悬停 / 选中 | 悬停由鼠标触发；选中 `selected`，自动加 `aria-current="page"` |
| 更多 | 开 / 关 | `more`；点了做什么：`onMoreClick`，或者 `moreMenu={<Menu>…</Menu>}` 弹出菜单 |
| 左边 | 导航：图标；列表：缩略图 | 导航 `icon="Create"`；列表 `thumb="icon"`（没封面，`thumbIcon="Message"` 或 `"Canvas"`）/ `"image"`（有封面，`thumbSrc="…"`） |

### 样子

| 项 | 导航 | 列表 |
|---|---|---|
| 高 | 36 | 36 |
| 圆角 | 8 · `--border-radius-sm` | 8 · `--border-radius-sm` |
| 内边距 | 左右 12 · `--spacing-md` | 左 12 · `--spacing-md`，右 8 · `--spacing-sm` |
| 元素间距 | 6 · `--spacing-xs` | 6 · `--spacing-xs` |
| 左边 | 图标 20 | 缩略图 24 |
| 文字 | 13 常规，行高 20，primary | 13 常规，行高 20，默认 secondary，悬停、选中 primary |

- 悬停：底 container-light-2-hover（白 8%）。选中：底 container-light-1-hover（白 12%）。底色变化 100ms ease-in-out。
- 「更多」的菜单展开着的时候，这一项保持悬停的样子，「更多」也一直显示。
- 侧栏整体：宽 240，底色 base，右边 1px border-subtle；内边距上下 16、左右 12，各块之间 6，组内各项之间 4。这些写在侧栏模板里，不在这个组件上。
- 原页面有「类型 × 状态」静态矩阵（导航 / 列表 × 默认 / 悬停 / 选中），现由属性面板代替。

### 用法

下面是导航 + 一组对话的样子，鼠标移到列表项上能看到「更多」，点一下弹出菜单。（页面上保留这个示例。）

- **导航**：新建、探索这类固定入口。**列表**：对话、画布的历史记录。
- **选中**：当前打开的那一项，同一时间只有一项。

## SidebarLabel

### 用途

侧栏的分组标题，比如「对话」「画布」。点标题展开或收起这一组，右边的按钮新建一个。

### 结构

左边：标题文字 + 展开箭头；右边：新建按钮。两端对齐。

- 展开时箭头朝下（DownArrowSmall），收起时朝右（RightArrowSmall），下面的列表收起。
- 新建按钮是 IconButton 28，对话、画布都用 NewChat 图标。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 分组名 | `children`，比如「对话」 |
| 展开 | 是 / 否 | `expanded`（受控）或 `defaultExpanded`（默认展开）加 `onExpandedChange`，自动加 `aria-expanded` 并换箭头图标 |
| 新建 | 开 / 关 | `showNew`（默认开），`onNew` 处理点击，`newLabel="新建对话"` 给读屏 |

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 高 | 28 | — |
| 内边距 | 左 12，右 4 | `--spacing-md` · `--spacing-xxs` |
| 标题 | 12 常规，行高 16，tertiary | `--font-size-12` · `--color-text-fill-tertiary` |
| 箭头 | 16，和标题间距 4 | `--spacing-xxs` |
| 新建按钮 | IconButton 28，整体透明度 30%（`--opacity-30`） | — |

- 新建按钮是「弱」还是「文字」类型：Figma 的组件说明写「文字」，实际用的实例是弱（旧名「轻」）。代码按实际实例写成弱。【待确认】
- 新建按钮整体 30% 透明度是 Figma 实例上的值，悬停时要不要变亮没定。【待确认】

### 用法

- 放在一组 SidebarItem 的上面，对话、画布各一个。
- 点标题切换展开：展开配 DownArrowSmall，收起配 RightArrowSmall，同时把下面的列表收起来。组件只管箭头和 `aria-expanded`，列表由使用方根据 `expanded` 显示或隐藏，见页面上的演示（保留）。

## SidebarMore

### 用途

侧栏一组列表底部的「更多」，点了看这一组剩下的。

### 结构

一行文字，左对齐，和列表的图标、分组标题的文字对齐。

### 属性（Figma ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 默认「更多」 | `children`，不写就是「更多」 |

### 样子

| 项 | 值 | 变量 |
|---|---|---|
| 高 | 36 | — |
| 左内边距 | 12 | `--spacing-md` |
| 文字 | 12 常规，行高 16，tertiary | `--font-size-12` · `--color-text-fill-tertiary` |

- 悬停、按下的样子 Figma 没定。【待定】

### 用法

- 一组列表只显示最近几条时，放在这组最后。

## 旧名对照

来自 Figma 本页的「迁移映射」。代码没改，前端按这张表改。

#### 旧组件库（KIVI UI KITS）→ 新组件

| 旧 | 新 | 类型 | 说明 |
|---|---|---|---|
| MenuItem | MenuItem | 改尺寸 | 44 → 36，圆角 12 → 8，左右 16 → 12，14 → 13 号字 |
| MenuItem · TrailingContent=icon-text | 「快捷键」「子菜单箭头」开关 | 合并 | 右边的内容不再用变体区分 |
| MenuItem · State=悬浮 | 状态=悬停 | 改名 | 悬停底色白 8%；新增「危险」类型 |
| MenuItemAsset | MenuItem 的「缩略图」开关 | 合并 | 不再单独一个组件 |
| 菜单容器（毛玻璃） | 菜单模板 | 改值 | 还是玻璃：底色绑 glass，模糊统一 32，描边统一白 8%，圆角 12，条目间距 4 |
| 数量 / 比例 / 模型选择、快捷添加节点、封面「更多」、画布右键、节点右键、@素材 | 设计稿里用菜单模板拼 | 不再是组件 | 条目写死在组件里，加一项就要改组件或解绑 |
| 单选菜单的当前项（数量、比例，旧库白 8% 底） | MenuItem 状态=选中 | 新增【新增】 | 白 8% 底，不打勾。「勾选」开关只给需要打勾的多选场景 |
| MenuItem 缩略图（24 纯色块） | AssetThumb 尺寸=24（选项卡、标签和头像页） | 改样式【调整】 | 缩略图换成 AssetThumb 实例，在 MenuItem 面板上直接切图片 / 音频 |

#### 代码 → 新组件

| 代码 | 新 | 类型 | 说明 |
|---|---|---|---|
| CustomMenu 容器 | 菜单模板 | 改值 | 还是玻璃：rgba(24,24,24,.7) 换成 `--color-bg-fill-glass`，模糊 32，描边白 8%，去掉阴影；圆角改成 12（条目 8 + 内边距 4），条目间距 4 |
| CustomMenu 菜单项 | MenuItem | 改值 | 高 36，圆角 12 → 8，14 → 13 号字；悬停白 8% 不变 |
| CustomMenu 子菜单 | 菜单模板 | 改样式 | 底色 popup-light-1（#36393d）→ 玻璃，和父菜单一样 |
| .custom-tooltip（global.less） | Tooltip · 简单 | 改值 | 底色 popup-light-1（#36393d）→ popup；14 → 12 号字 |
| ChatTooltip | Tooltip · 说明 | 改值 | 底色 popup-light-2 → popup；最宽 240 |
| AnchoredDropdown、CommonDropdown 等 | 菜单模板 + MenuItem | 合并 | 样式统一到菜单模板；这几个组件的细节还没逐个核对 |
| 菜单模板分区：菜单 · 模板（复制这个）、示例 · 右键菜单 / 分组和子菜单 / 单选菜单 / 素材菜单 | 「模板 · 通用」页「菜单」分区 | 移动【待确认】 | 改名、去重在整理模板时做 |
