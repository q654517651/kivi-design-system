# 画布页 · 搬出来的内容

从 `src/docs/business/canvas.mdx` 精简时搬出（2026-10-29），原文照搬，没改字。页面只留演示和「参数」表。

## 页头下的说明

页头 lead 原文：无限画布：节点、连线、节点工具栏、生成面板。下面的小画布能直接点，看完再看拆解。

组件在 Figma「画布」页。节点、工具栏、生成面板的完整拼法在[「模板 · 画布」页](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=367-2877)。样子、变量、组件以 Figma V2 为准，交互照线上产品。

下面的小画布看整体效果；每个组件单独怎么调，看后面的拆解。

## 待定

- **完成后悬停出什么**：Figma「悬停」画的是右上一个 +，像是图标没换；线上是下载、全屏，演示照线上。「展开」里的「设为封面」线上没有，线上只在展开多张结果时有「设为主图」「设为主视频」。<Tag kind="draft">待定</Tag>
- **素材节点右上的按钮**：Figma 和线上都叫「上传」，图标 `Upload`（底下一个托、上面一个箭头），一直显示，上传中不能点（10-29 用户改回「上传」，之前写的「替换」作废）。Figma 里这个按钮还是旧的 ToolbarItem，要换成 Button 中 · 浮层。<Tag kind="draft">待改 Figma</Tag>
- **上传中**：左上从 + 改成转圈，代码已改，Figma 待改。<Tag kind="draft">待改 Figma</Tag>
- **视频封装、视频剪辑节点**：工具产出都用素材节点，那「待生成 + 打开视频封装」这个样子、NodeCard 的「按钮」开关、`Pack` `Cutting` 两个待生成图标还要不要。<Tag kind="draft">待定</Tag>
- **音频节点**：有生成面板，但 Figma 没画，演示先放参考图、提示词、模型、生成；模型名是示例，线上前端没写死（后端下发），参数没定。工具栏线上没有，Figma 也没画。<Tag kind="draft">待补</Tag>
- **悬停边框**：Figma 有（选中框那圈），线上没有。演示照 Figma。
- **倒计时文字**：Figma 是「59s 生成中」，线上只写「59s」。演示照 Figma。
- **画布底色和点阵**：Figma 没画。演示照线上，18 一个点。<Tag kind="draft">待补</Tag>
- **生成面板**：Figma 里的生成按钮、参数摘要还是旧的，演示用 GenerateButton（和主站同一个）、Select · 无底。「添加 Lora」的占位格没有 V2 组件，演示没放。<Tag kind="draft">待改 Figma</Tag>
- **连线**：执行中流光的形状、长短、亮度没定；变量里有出错色 `--g-workflow-line-color-error`，但 Connector 没有「出错」状态。连接点「高亮」什么时候用没写。<Tag kind="draft">待定</Tag>
- **悬停、按下没定的**：连线删除按钮、播放条的播放和音量图标、画布底部工具栏。视频播放条的出现、消失先用 150ms。<Tag kind="draft">待定</Tag>
- **图标**：`History` 新图标库里还没有，画布底部工具栏的「历史」是空的；那里还藏着 `Text` `ImageGeneration` `Video` `Template` 4 个图标，用途没写。<Tag kind="draft">待补</Tag>
- **节点工具栏的图标**：迁移表写「图标加文字时图标 20 → 16」，但按钮页 Button 中的左图标是 20，两处不一致。<Tag kind="draft">待确认</Tag>

## 节点：NodeWrapper

画布上每个节点都是一层 NodeWrapper 包一个 NodeCard；完成后 NodeCard 里放 NodeMedia。

### 结构

- **NodeWrapper**：节点名在上方；左右各一个连接点 ConnectorDot；选中时外面一圈框。
- **NodeCard**：节点本体，5 个状态：引导、待生成、生成中、完成、失败。
- **NodeMedia**：完成后的内容，四种：文字、图片、视频、音频。

切生成节点、素材节点和状态，开关只在用得上的状态出现。节点是真的：鼠标移上去该出什么就出什么。


### 有哪几种节点

两类：生成节点、素材节点。工具产出的素材也用素材节点。

| 节点 | 状态 | 完成后右上 |
|---|---|---|
| 文字 | 引导（自己编写内容 / 图片反推提示词 / 视频反推脚本）· 待生成（图标 `Text`）· 生成中 · 完成 · 失败 | 没有 |
| 图片 | 同文字；待生成图标 `ImageGeneration` | 悬停出下载、全屏 |
| 视频 | 同文字；待生成图标 `VideoGeneration` | 悬停出下载、全屏；悬停底部出播放条 |
| 音频（4:3） | 引导（图片参考生成音频 / 音频参考生成音频 / 生成对话）· 待生成（图标 `Audio`）· 生成中 · 完成 · 失败 | 没有 |
| 素材（上传的图片、视频、音频） | 上传中 · 完成 | 「上传」，一直在，上传中不能点 |

素材节点和生成节点只差两处：右上的「上传」，和上传中左上的转圈。

### 规格

| 部分 | 规格 |
|---|---|
| 尺寸 | 短边 256：1:1 256 × 256 · 3:4 256 × 341 · 16:9 455 × 256 · 4:3 341 × 256 · 9:16 256 × 455。音频用 4:3 |
| 节点名 | 14 号、500、`--color-text-fill-secondary`；下边离节点 11；超出省略 |
| 连接点 | 16 的圆，2px 描边画在里面，底 #0A0A0A；在节点外 8，垂直居中。默认：描边白 20%。已连接：中间多一个 6 的实心点，白 20%。高亮：描边和点都是白 50%（`--color-border-strong`） |
| 选中框 | 2px 白 40%，圆角 16，盖在节点上；悬停也出 |
| 节点本体 | 圆角 16（`--border-radius-lg`）；底 `--color-bg-fill-surface`；1px `--color-border` 在内容下面（图片盖住它，遮罩盖不住）；内容裁切 |
| 引导 | 内边距 24；一列 3 个 MenuItem，176 宽，间距 4，居中 |
| 待生成 | 64 的类型图标，`--color-text-fill-tertiary`，居中 |
| 生成中 | 遮罩 `--color-bg-fill-container-dark` + 背景模糊 24，铺满；上面是点阵动效 `GeneratingDots`（见[动效](/foundations/motion)）；左上倒计时，Tag 覆盖，离边 8 |
| 完成 | NodeMedia 铺满；右上按钮离边 8，间距 8，悬停出现：150ms，出现 ease-out，消失 ease-in |
| 失败 | 内边距 24；插画 120（`./empty-state/failed.png`），和文案间距 16；文案 14 号、行高 22、白 50% |
| 上传中 | 左上 32 的浮层底（`--color-on-media-fill`，圆角 8），里面 `Loading` 20，1 秒一圈；不能点 |
| 右上按钮 | 文字按钮 Button 中 · 浮层；图标按钮 IconButton 32 · 浮层 |

### 完成后的内容：NodeMedia

| 类型 | 规格 |
|---|---|
| 图片、视频 | 画面铺满，居中裁切。视频左下时长，Tag 覆盖，离边 8；悬停时底部出播放条 PlayBar，时长收起 |
| 音频 | 内边距 16；上面波形 AudioWave 撑满；下面一行高 44、上边留 12：播放键 IconButton 32 · 次要 + 时间（12 号、行高 16、`--color-text-fill-secondary`），间距 12 |
| 文字 | 内边距 16；14 号、行高 22、`--color-text-fill-primary`；超出裁掉 |

### 生成中

- **倒计时**：前端按最近 1 小时同类任务的耗时估算，写「59s 生成中」；算不出写「生成中」。
- **不画进度条**：进度交给点阵动效（2026-10-29 定）。
- **底图**：重新生成时，旧图垫在遮罩下面。
- **连线**：连进这个节点的线变成「执行中」。

## 节点工具栏

选中节点后在节点上方，按节点类型放不同的按钮。它是模板：外框是 `NodeToolbar`，竖线是 `NodeToolbarDivider`，按钮用 Button、IconButton 自己放。

### 什么时候出

- 只选中一个节点时出，多选不出。
- 节点有结果才出；生成中、上传中不出。
- 文字节点双击进入编辑才出。音频节点没有。
- 位置：水平居中，底边离节点 40（节点名在 28 处，空出 12）。大小不跟画布缩放，缩到 50% 以下才跟着变小。


### 规格

| 部分 | 规格 |
|---|---|
| 容器 | 高 44；内边距 6；按钮间距 8；圆角 12；玻璃浮层：底 `--color-bg-fill-glass`、背景模糊 32（`--effect-glass-blur`）、1px 描边 `--color-border-subtle` |
| 带文字的按钮 | Button 中 · 文字（32 高，13 号字，左图标 20） |
| 纯图标按钮 | IconButton 32 · 文字；都要配 Tooltip。有开关的（加粗这类）用选中状态 |
| 竖线 | 1 宽、20 高，`--color-border`，分组用 |

### 四条

| 节点 | 带文字的按钮 | 竖线后的图标按钮 |
|---|---|---|
| 图片（含素材图片） | 抠图 `Rmbg` · 裁剪 `Crop` · 扩图 `Expand` · 高清 `HD` · 重绘 `SmartEditing` · 元素去除 `RemoveEle` | 反推提示词 `ImageToText` · 下载 `Download` · 全屏 `FullScreen` |
| 视频 | 循环 `VideoLoop` · 高清 `HD` · 拼接 `Connecting` · 抠图 `Rmbg` · 剪辑 `Cutting` · 封装 `Pack` | 同图片 |
| 文字 | 没有；前面是 `H1` `H2` `H3` `FontSize`，竖线后 `TextBold` `TextItalic` `UnOrderedList` `OrderedList` `DividingLine`，再一条竖线 | 复制 `Copy` · 全屏 `FullScreen` |
| 打组 | 整组执行 `PlayLine` · 创建工作流 `Template` · 解组 `UnGroup` | 没有 |

裁剪时，工具栏按钮盖在图片上，改用浮层类型（Button 中 · 浮层、IconButton 32 · 浮层）。

## 生成面板

选中生成节点后在节点下方：参考图、提示词、模型和参数、生成。它是模板：外框 `NodePanel`（`expand` 打开右上的全屏图标），参考图区 `NodePanelRefs`，模型选择栏 `NodePanelBar`。

### 什么时候出

- 只选中一个生成节点（文字、图片、视频、音频）时出。空的节点也出；生成中也出，生成按钮不能点。
- 素材节点没有。文字节点编辑时收起。
- 参考图就是连进来的上游节点，按顺序编号 1、2、3。
- 位置：水平居中，离节点底 12。大小同工具栏，不跟画布缩放。


### 规格

| 部分 | 规格 |
|---|---|
| 面板 | 宽 620（默认面板 686、创作页 800）；内边距 16；块间距 16；圆角 12；底 `--color-bg-fill-surface`；右上 24 的全屏图标 |
| 参考类型 | 视频面板最上面一排 Tabs：全能参考 / 首尾帧 / 视频编辑 / 视频延长 |
| 参考图区 | ReferenceItem 56，间距 4。太多时右边渐变遮罩；首尾帧中间用箭头连 |
| 提示词 | PromptInput，可以插 @素材（MentionChip） |
| 模型选择栏 | 高 36；左边 Select · 无底，间距 6；右边张数 Select + 生成按钮 GenerateButton 大（36），间距 8。下拉列表的当前项用「选中」（白 8% 底），不打勾 |

### 有哪几种

| 面板 | 宽 | 模型选择栏 |
|---|---|---|
| 文字 | 620 | Gemini 3.5 Flash。示例模型照线上：Gemini 3.5 Flash / Gemini 3.1 Pro / GPT-5.5 / GPT-5.4 / Qwen 3.7 Max |
| 图片 | 620 | Nano Banana 2 · 1K · 1:1 · x1。模型列表照 Figma「模板 · 通用」的「图片模型选择」：Nano Banana 2 / Nano Banana Pro / Seedream 5 Lite / Seedream 4.5 Lite / GPT Image 1.5，左边带模型 logo |
| 文字支持 Lora、图片使用 Lora | 620 | 同图片；参考图区前面多一格 Lora |
| 全能参考、视频首尾帧 | 620 | Seedance 2.0 Fast · 智能 · 8s · 2K · x1；最上面多一排参考类型。模型列表照 Figma「视频模型选择」：Seedance 2.0 Fast / Seedance 2.0 / Veo 3.1 Fast / Hailuo 2.3 / Kling 2.1 / Kling 2.5 Turbo / Vidu Q3 Pro，演示取 5 个 |
| 默认 | 686 | 文字的那条 |
| 创作页 | 800 | 带参考类型 |
| 音频 | 620 | Figma 没画。演示放了模型 · x1；模型是示例（MiniMax Speech / MiniMax Music / Seed TTS / Seed Music / Gemini TTS），线上由后端下发 <Tag kind="draft">待补</Tag> |

点比例、时长这类参数弹出的参数面板，在「模板 · 画布」页「参数面板」分区，玻璃浮层，同菜单。

## 其他零件

连线有 4 种状态，悬停出删除按钮：

其余零件各摆一个：

| 组件 | 是什么 | 规格 |
|---|---|---|
| Connector | 节点之间的连线。三次贝塞尔，从起点水平出去、到终点水平进来，控制点在水平中点；圆头，粗细不随拉伸变 | 默认 `--g-workflow-line-color-default` 1.5。激活（悬停、选中节点的关联线）`--g-workflow-line-color-active` 2。拖拽中 `--g-workflow-line-color-drawing` 1.5、虚线 6 / 6。执行中 `--g-workflow-line-color-flowing` 1.5 + 流光，2 秒一轮。换色 100ms ease-in-out |
| ConnectorRemove | 连线中点的删除按钮，悬停连线时出现 | 24 的圆；底 `--color-bg-fill-container-light-1`；1px `--color-border`；背景模糊 6；图标 `Cutting` 16；出现、消失 150ms |
| PlayBar | 视频悬停时贴底的播放条 | 内边距 8，高 38；底是竖向渐变，透明到黑 60%；图标 `Play` `VolumeFull` 16；时间 12 号；进度条高 2，底白 50%、已播 `--color-on-media-text` |
| AudioWave | 音频波形和播放头 | 竖条 2 宽、圆头、最高 69，播过的 `--color-text-fill-primary`，没播的白 30%；播放头是 2 宽的线 + 顶上 6 的点，`--color-brand-solid` |
| ReferenceItem | 参考图一格 | 56 / 72，圆角 8，1px `--color-border` 盖在缩略图上。右上角标 20 × 20，只有左下圆角 4，黑 40% + 模糊 16；左下时长高 16；底部通栏写 Lora 权重或「图片1」 |
| PromptInput | 提示词输入 | 无底、无内边距，14 号；空的时候高 68，占位文字 `--color-text-fill-placeholder`；最高 120，超出滚动 |
| MentionChip | 提示词里的 @素材 | 高 17，圆角 4，底 `--color-bg-fill-container-light-1`，1px `--color-border-subtle`；左 2 右 4；缩略图 16 + 名字 14 号 `--color-text-fill-secondary`，间距 4。整体不可编辑（`contenteditable="false"`） |
| CropHandles | 裁剪框，盖在要裁的图片上 | 描边 2px #4AFF70；四角 12 的白圆点，四边中间 120 × 6 的白圆头条 |
| CanvasToolbar | 画布底部工具栏：添加、历史、上传 | 高 56，胶囊；内边距 12 / 16；间距 16；底 `--color-bg-fill-surface`，1px `--color-border-subtle`，背景模糊 12。「添加」白底黑图标（`className="kv-canvas-toolbar__add"`），其余图标 24 |

每个组件的属性看 `src/kivi/canvas/` 里的源码，每个属性都有中文注释。


## 旧名对照

来自 Figma「画布」页的「迁移映射」：旧库里的名字，在新库里对应什么（原来是网页上默认折叠的 `<details>`）。

| 旧 | 新 | 类型 · 说明 |
|---|---|---|
| OutputNode（AspectRatio · Instance · 左侧节点 · 右侧节点 · 鼠标选中） | NodeWrapper（比例 · 左侧连接点 · 右侧连接点 · 选中） | 改名。属性改中文；里面的节点换成新节点；「节点」属性去掉，里面固定放 NodeCard（已暴露） |
| ConnectorDot（Status） | ConnectorDot（状态） | 改名。只改属性名 |
| 文字节点 · 图片节点 · 视频节点 · 音频节点（中间一版叫 TextNode 等） | NodeCard（状态）+ NodeMedia（类型） | 合并。旧的 7 个组件 37 个变体已删除；7 种节点的样子放在「模板 · 画布」页「节点」分区 |
| 素材节点（Property 1）· UploadNode | NodeCard 完成 + 开关「上传中」「文字按钮」 | 合并。上传完成的视频、图片、音频只是内容类型不同；「文字按钮」写成「上传」 |
| 视频封装节点 · 视频剪辑节点（VideoPackNode / VideoCutNode） | NodeCard 待生成 + 开关「按钮」 | 合并。按钮从 32 高描边改成 Button 小 · 次要（28 高，白 8% 底），点击态 = 悬停。还要不要见「待定」 |
| 状态 = 引导态 / 待生成 / 生成中 / 完成 / 失败 | NodeCard 状态 = 引导 / 待生成 / 生成中 / 完成 / 失败 | 改名。去掉「态」字 |
| 完成态的内容（图片、视频、音频、文字各画一份） | NodeMedia 类型 = 图片 / 视频 / 音频 / 文字 | 合并。在 NodeCard 完成态的属性面板里切类型 |
| 状态 = 鼠标悬浮 / 展开效果 | NodeCard 完成 + 开关「图标按钮」「文字按钮」 | 合并。不再单独做变体，悬停就是把右上按钮打开 |
| 状态 = 堆叠 | 模板里的「堆叠」：3 张 NodeCard 斜着叠 | 改成模板。多张卡的组合，不是单卡状态 |
| 引导项（散框，14 号次要色） | MenuItem（13 号主色） | 改样式。字小一号、颜色变亮，代码要跟着统一 |
| 角上按钮：ToolbarItem 填充款手动改成黑 40% | Button 中 / IconButton 32，类型 = 浮层 | 改样式。倒计时、上传中、上传、设为封面、下载都用它（中间一版叫 ToolbarItem 样式 = 玻璃） |
| ToolbarItem 玻璃款悬停（和默认一样） | 浮层悬停改成黑 60%（`--color-on-media-fill-hover`） | 改样式。代码里悬停是 rgba(16,19,24,0.9)，没有对应变量，需要和前端对齐 |
| 视频时长「5s」（散框，22 高） | Tag 类型 = 覆盖（24 高） | 改样式 |
| 音频播放键（散框，圆形白 12%） | IconButton 32 · 次要（圆角 8，白 8%） | 改样式。代码里是圆形，需要和前端对齐 |
| 音频波形、视频播放条（散层，最多 90 多层） | AudioWave、PlayBar | 新增。宽度跟随容器 |
| 节点底色 #181818（没绑变量） | `--color-bg-fill-surface`（#191A1B） | 改样式。差 1 个色值，代码可以直接用 surface |
| （无） | Connector · ConnectorRemove | 新增。照代码 line-style 做的连线 4 种状态和删除按钮 |
| ToolbarItem（State · Style · Content）、工具栏（Property 1）、NodeToolbar（类型）、CanvasToolbar | 「模板 · 画布」页「节点工具栏」分区；按钮用 Button 中 · 文字、IconButton 32 · 文字 | 改成模板，按钮合并。前端要跟着改：字号 14 → 13，字重常规 → 中等 |
| 画布工具栏 · 拉伸手柄 | CanvasToolbar · CropHandles | 改名。拉伸手柄在代码里是裁剪框，保留 #4AFF70 |
| 模型调用（没发布过）· 节点面板分区的生成面板 ×7、参考图区块 ×5、模型选择栏 ×4 | 节点生成面板模板（7 种） | 改成模板，移到「模板 · 画布」页「生成面板」分区。面板底色 #191B1D → surface；内容随模型和参数变，所以不做组件 |
| 参考图区块 · 文本区块 · 模型选择区块 ×2 · 基础画布 | 参考图区块 · 模型选择栏（模板）；PanelPrompt → PromptInput、MentionChip（组件） | 改成模板。PanelPrompt 改名 PromptInput，不只节点面板用，首页对话输入框也用它；PanelModelBarCreate 没人用，已删 |
| 参考图区块里的每一格（散框，25 个） | ReferenceItem | 新增。AssetThumb + 右上角标 + 左下时长 + 底部权重，都用开关 |
| 模型选择栏里的下拉（散框，14 个） | Select · 无底（输入控件页） | 改样式。36 高不变，字号 14 → 13 |
| 快捷操作（12 个菜单和参数面板） | 「模板 · 通用」页「菜单」分区、「模板 · 画布」页「参数面板」分区 | 改成模板，移动。快捷菜单分区已删 |
| MenuItem · MenuItemAsset（44 高 · 圆角 12 · 14 号字） | MenuItem（菜单和提示页，36 高 · 圆角 8 · 13 号字） | 改样式。按竞品统一成 36；@素材的缩略图用 AssetThumb；单选菜单的当前项用「选中」（白 8% 底，不打勾）；前端 CustomMenu 改成 36 高、13 号字、图标 16 |
| Heavy 字重（参考图区块 · 菜单） | 常规 400 | 改样式。苹方没有 Heavy，代码里是 400 |
| Inter 字体（模型选择栏的英文） | `--font-family`（苹方） | 改样式。和代码一致 |
| 资产图 | 暂不迁 | 待定。是「我的资产」的卡片，不是画布节点 |
| 图标 AudioGeneration · History · Guide | 待补 | 待定。新图标库里没有，暂时保留矢量 |


## 生成控件统一（2026-10-29）

- 画布生成面板和主站输入框的下拉、参数面板只写一份：`site/src/docs/business/generation.tsx`（任务类型、参考方式、模型、分辨率、比例、背景、音色、张数、视频 / 音频参数面板，以及跟着模型变的一组 `VideoModelControls` 等）。用户定：选项、顺序、图标、展开方式两边必须一致。
- 参考方式顺序：全能参考 / 首尾帧 / 视频编辑 / 视频延长，下拉带图标。画布视频面板去掉顶上的选项卡，参考方式放到底栏模型后面，和主站输入框同一个下拉（10-29 用户定）。Figma「模板 · 画布」视频面板顶上那排还在，待改。
- 「视频延长」图标 Figma 没有，先用 lucide/clock-arrow-up 手加到 icons.ts（`VideoExtend`），【待确认】，Figma 图标页待补。
- 视频分辨率：Figma 参数面板写 2K / 4K，主站示例写 720P。演示用 720P / 1080P，摘要按主站写「分辨率 · 比例 · 时长」。【待确认】
- Seedance 系列参数面板多「生成音频」；Seedance 2.5 后面多「样片模式」开关（Figma 主站示例）。
- Select 选了值以后左图标白色（Figma Select「已选」），没选 tertiary。

## 多图节点：堆叠和展开（10-29 盘点，还没拍板）

- 线上（`ai-design-web` `packages/infinite-canvas/src/components/spread-card-stack`，framer-motion）：
  - 收起：后面的卡每张往上 8、缩 5%，旋转依次 0 / -4° / 4° / -2°（左右交替，比较错开），阴影 0 2 10 黑 20%。
  - 展开：铺成格子，间距 8，主图在左下，其余依次放右、上、右上，再往右排两列；展开阴影 0 10 30 黑 50%。弹簧 stiffness 450 / damping 30（约 4% 回弹），不错开。
  - 右上「4 ⌄」按钮切换展开，箭头转 180°；点别的卡设为主图。左上收藏星标：悬停、已收藏或选中时显示。
  - 右上按钮顺序：全屏、下载、「4 ⌄」；素材节点是全屏、下载、「上传」。都是 32 高。
- Figma「模板 · 画布」`模板 / 图片节点`（298:3080）：「堆叠」是后面 3 张往右上同方向斜着叠（-3° / -6° / -8°，偏移 7,-7 / 14,-13 / 19,-17）；「展开」只画了单卡悬停（设为封面 + 加号，旧的），没有展开后的样子和动效。
- 网站：素材节点右上已改成全屏、下载、上传（10-29），生成节点改成全屏、下载。
- 10-29 用户定：堆叠、展开直接照线上搬。网站已做 `NodeStack` + `NodeStackToggle`（画布页「多图节点」），NodeCard 加了左上 `leftButton`（收藏，收藏了常驻）。
  - 动效用新 token `--motion-ease-spring`（线上弹簧采样成 CSS linear()），阴影新 token `--effect-shadow-stack` / `--effect-shadow-spread`，Figma 都没有，待补。
  - 和线上的小差别：候选卡右上我们是「全屏、下载、设为主图」（文字按钮统一放最右），线上是「设为主图」在最左；展开超过 7 张时线上的格子会重叠，我们改成往右每列两张。
  - Figma「模板 · 画布」的「堆叠」还是同方向斜叠，要改成线上这样；「展开」那格是旧的悬停，要换。
- 合并按钮条（用户 10-29 问）：28 的按钮 + 4 边距 = 36，比节点按钮 32 高。我先推荐「条高等于按钮高、里面不留边」，用户否了（悬停底和条一样高看不出来，一般也没人这么做）。
  - 定了（10-29，照用户 Figma 稿 605:17053）：条 32 = 按钮 28 + 四周 2（新加 `spacing/2`），按钮间距 4，圆角 8 套按钮 6；玻璃底 + 模糊 32，我加了描边 border-subtle（浮层统一的规矩）。不用 36 的条：少挡画面、和线上节点按钮一样高。
  - 收藏从左上挪进右上条最左边，和主站统一；收藏了的不悬停右上只留一个星（只是标记，鼠标一移上去就是整条）。
  - 条里选中（收藏了）只换实心图标、不加底：Figma IconButton 文字 · 选中是品牌绿底，我觉得盖在图上太跳，待用户看。
  - 网站：`ButtonGroup` + `ButtonGroupDivider`（按钮页），里面的按钮不写尺寸、类型就是 28 · 文字、小 · 文字。Figma：按钮页「ButtonGroup」分区（组件 623:2911，开关 图标 3 / 图标 4 / 文字按钮）。
  - Figma 里 NodeCard、ResultTile 组件和「模板 · 画布」「模板 · 主站」还没换成按钮条。

## 音频节点能播（10-29）

- NodeMedia 音频传 `src` 真播（`<audio>`）：播放 / 暂停、时间走、波形跟着走、点击拖动波形跳转、左右键快进快退 5 秒；同一时间只播一个（`hooks/useAudioPlayer` + `exclusivePlayback`）。没传 `src` 保持静态外观（`time`、`progress`）。
- 加载中：时间位置写「加载中…」，波形变淡。加载失败：时间位置写红字「加载失败」，波形变淡，播放键禁用。Figma 没画这两个状态，按最简做，待设计确认。
- 演示音频：`assets/placeholders/video/` 里没有纯音频，用 kivi-demo-9x16.mp4（有 aac 音轨，10.5 秒）当 audio src。
- 多图节点展开 / 收起时长：400ms 起每多一张 +10ms、最多 700ms（和主站参考区一个算法），弹簧缓动。
