# 弹窗（dialog）页被删下来的内容

从 `src/docs/components/dialog.mdx` 搬来，原文不改。原页面的 `<Tag kind="draft">待定</Tag>` 写成【待定】。参数表和数值摘要已写进新页面的「参数」。

## Dialog

### 原页面开头

在右边面板选尺寸，开关标题栏、描述、内容、底栏，改标题，和 Figma 右侧属性面板一样。下面的代码跟着变，可以直接复制。面板里摆的是弹窗本体，实际用的时候 `Dialog` 会再带上遮罩和开关，见「用法」。

### 用途

模态弹窗：盖住页面，让用户先处理这一件事。确认、重命名、表单、列表、编辑器都用它。

### 结构

从上到下竖排，内边距 24，区块间距 16。

- **标题栏**（可选）：标题在左，关闭按钮在右，间距 16。可以单独去掉关闭按钮。
- **描述**（可选）：一句话说明要做什么，或者操作的后果。和标题栏同属一组，间距 8。
- **内容区**（可选）：放表单、列表等。只有标题和描述的确认弹窗，不要内容区。Figma 里是「内容」属性，把做好的内容组件换进来；代码里就是 `children`。
- **底栏**（可选）：按钮靠右，间距 8，上方再留 8。用大号 Button：取消用次要，确认用主要。

写的时候注意：

- 标题、描述渲染成 `div`，不是 `h2`、`p`，免得被页面里同名标签的样式带跑。
- `Dialog` 自己写好 `role="dialog"`、`aria-modal="true"`，用 `aria-labelledby` 指向标题、`aria-describedby` 指向描述，不用另外写。
- Figma 里改结构时，4 个尺寸的变体要全选一起改。

```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  size="s"
  title="弹窗标题"
  description="一句话说明这个弹窗要做什么，或者操作的后果。"
  footer={
    <>
      <Button size="lg" onClick={() => setOpen(false)}>取消</Button>
      <Button size="lg" variant="primary">确定</Button>
    </>
  }
>
  …内容…
</Dialog>
```

### 属性（Figma 属性 ↔ 代码）

| 属性 | 选项 | 代码 |
|---|---|---|
| 标题 | 标题文字 | `title="弹窗标题"` |
| 显示标题栏 | 开 / 关 | 传不传 `title`；不传就没有标题栏，关闭按钮也跟着没有 |
| 显示关闭 | 开 / 关，默认开 | 标题栏里的关闭按钮，`showClose={false}` 去掉 |
| 显示描述 | 开 / 关 | 传不传 `description` |
| 描述 | 说明文字 | `description="一句话说明…"` |
| 显示内容 | 开 / 关 | 有没有 `children` |
| 内容 | 任意组件（Figma 里换实例） | `children`，放什么都行 |
| 显示底栏 | 开 / 关 | 传不传 `footer` |
| 显示次按钮 | 开 / 关 | `footer` 里放不放取消按钮；只有一个按钮时去掉 |
| 尺寸 | S / M / L / XL | `size="s"` / `"m"` / `"l"` / `"xl"`，S 是默认 |

- 底栏的两个按钮是 Button 大号，类型和文字在 Button 那一层改：`<Button size="lg">取消</Button>` + `<Button size="lg" variant="primary">确定</Button>`；删除确认把主要换成 `variant="danger"`。
- 全屏（宽 100vw）【待定】：Figma 的 Dialog 还没有这个尺寸，先写 `size="full"`，只定了宽度。

打开、关闭和怎么关，Figma 里画的是弹窗本体，这几个是代码才有的：

| 属性 | 选项 | 代码 |
|---|---|---|
| 打开 | 开 / 关 | `open` + `onOpenChange`，受控；不想自己管就用 `defaultOpen`，非受控 |
| 点遮罩关闭 | 开 / 关，默认开 | `closeOnMaskClick={false}` 点遮罩不关 |
| Esc 关闭 | 开 / 关，默认开 | `closeOnEsc={false}` 按 Esc 不关 |

`onOpenChange` 在按 Esc、点遮罩、点关闭按钮时调用，传 `false`；底栏的取消、确认按钮自己调 `setOpen(false)`。`className` 和其余属性（`style`、`data-*`、`aria-*`）落在弹窗本体上。

### 样子

#### 宽度

| 尺寸 | 宽度 | 用在哪 |
|---|---|---|
| S | 400 | 确认、重命名、简单输入 |
| M | 720 | 表单、上传、设置 |
| L | 1024 | 列表、市场、详情 |
| XL | 1200 | 编辑器 |
| 全屏【待定】 | 100vw | 素材详情 |

- 4 个尺寸只是宽度不同，结构、内边距、间距都一样。
- 高度跟着内容走。最大高度、内容多时怎么滚【待定】：Figma 没定，代码先限制在屏幕里，内容区滚动。

#### 规格

| 项 | 值 | 变量 |
|---|---|---|
| 内边距 | 24 | `--spacing-xl` |
| 区块间距 | 16（标题栏组、内容区、底栏之间） | `--spacing-lg` |
| 标题栏和描述间距 | 8 | `--spacing-sm` |
| 标题和关闭按钮间距 | 16 | `--spacing-lg` |
| 圆角 | 16 | `--border-radius-lg` |
| 底色 | surface | `--color-bg-fill-surface` |
| 描边、阴影 | 都不加 | — |
| 标题 | 16 / 24，粗，primary | `--font-size-16` · `--font-line-height-24` · `--font-weight-medium` · `--color-text-fill-primary` |
| 描述 | 14 / 22，常规，secondary | `--font-size-14` · `--font-line-height-22` · `--color-text-fill-secondary` |
| 关闭按钮 | IconButton 32 · 文字类型，Close 图标 | 见[按钮](/components/button) |
| 底栏 | 靠右，间距 8，上方多留 8；大号 Button（36） | `--spacing-sm` |
| 遮罩 | mask（黑 60%），不模糊 | `--color-bg-fill-mask` |

#### 打开和关闭的动效

| 动作 | 怎么动 | 变量 |
|---|---|---|
| 打开 | 遮罩和弹窗一起淡入，弹窗从 96% 放大到 100% | 300ms · `--motion-ease-out` |
| 关闭 | 遮罩和弹窗一起淡出，弹窗缩回 96% | 200ms · `--motion-ease-in` |

`open` 变 `true` 时先挂到 `body` 上再放开，变 `false` 时先播完淡出，再从 `body` 里拿掉。动画都写在 `dialog.css` 里，靠遮罩上的 `aria-hidden` 切换。系统开了「减少动态效果」时，时长已归零，直接切换。见[动效](/foundations/motion)。

#### 二级弹窗：再叠一层遮罩

在一级弹窗上再打开一个弹窗，就是再渲染一个 `Dialog`。两层遮罩叠起来，一级弹窗被自动压暗。最多两级。

（原页面这里有一个静态示意 `DialogStackDemo`：在小舞台里叠两个弹窗，一级「编辑作品」M，二级「二级弹窗」S。已删，页面里保留可真的打开的二级弹窗演示。）

### 用法

- **S 400**：确认、重命名、简单输入。
- **M 720**：表单、上传、设置。
- **L 1024**：列表、市场、详情。
- **XL 1200**：编辑器。
- **全屏 100vw** 【待定】：素材详情。
- **确认弹窗**：只有标题和描述，关掉内容区。
- **删除这类不能撤销的操作**：把确认按钮从主要换成危险。
- **只有一个按钮**：去掉次按钮。

#### 怎么关

- **Esc**：都能关；二级弹窗开着时，先关二级。
- **点遮罩**：只展示内容的弹窗关闭；有表单或没保存内容的不关，写 `closeOnMaskClick={false}`。
- **关闭按钮、取消**：都能关。

下面的演示都能真的打开和关闭。`Dialog` 自己管了这几件事：Esc、点遮罩、打开时把焦点给弹窗、Tab 不跑出弹窗、关闭后焦点还给原来的按钮。弹窗用 `createPortal` 挂在 `body` 下，不受外层 `overflow`、`z-index` 影响。

#### 被删掉的示例（页面里留了「打开和关闭」「二级弹窗」两个）

- 确认弹窗：S，只有标题和描述（「放弃这次修改？」取消 + 确定）。
- 删除确认：确认按钮换成危险（「删除这个作品？」取消 + 删除）。
- 表单弹窗：M，点遮罩不关。有表单，用户可能已经填了东西，点遮罩不关，只能点关闭或取消。
- 二级弹窗：在一级里再打开一个。一级是表单，点遮罩不关；二级是删除确认，点遮罩能关。后打开的遮罩盖在上面，Esc 先关二级。点「删除」两层一起关。
- 各尺寸：真的宽度。屏幕比弹窗窄时，弹窗最宽就是屏幕宽。五个按钮分别打开 S · 400 / M · 720 / L · 1024 / XL · 1200 / 全屏 · 100vw（待定）；全屏的说明是「素材详情。高度、圆角 Figma 还没定。」

### 属性面板的设计

- 面板里摆的是 `DialogPanel`（只有盒子，没有遮罩和开关），放在压暗的舞台上，`displayName` 写成 `Dialog`，生成的代码才是项目里真正要写的。
- 面板里没有「全屏」：宽 100vw 摆不进舞台，且 Figma 没定。

## 旧名对照

### 现有弹窗归到哪一档

代码里现在的弹窗，按宽度就近归到 S / M / L / XL。

| 尺寸 | 宽度 | 用在哪 | 代码里现在的弹窗（宽度） |
|---|---|---|---|
| S | 400 | 确认、重命名、简单输入 | 400：ConfirmModal · RenameModal · EditFolderNameModal · CompressModal · BalanceInfo · AppDeployVersionCheck · SkillConfirmModal；500：SkillSyncPublicModal |
| M | 720 | 表单、上传、设置 | 700：PasteModal · 740：VersionUpdateModal · 800：FeedBack |
| L | 1024 | 列表、市场、详情 | 898：SkillDetailModal · 1024：SkillMarketModal · 1056：Cropper（裁剪） |
| XL | 1200 | 编辑器 | 1208：SkillEditorModal · 最小 1200：EditMultiImagModal |
| 全屏【待定】 | 100vw | 素材详情 | 铺满：CardDetailModal；按屏幕宽：AIToolsModal 75vw（大屏 60vw）· PadImageModal 60vw，待定 |

- 代码里还没有尺寸档位：弹窗有 BaseModal、antd Modal、HeroUI Modal 三种写法，宽度都是各写各的。
- 要按 S / M / L / XL 走，需要前端给弹窗加一个 size 参数，再把上面这些宽度改过去。
