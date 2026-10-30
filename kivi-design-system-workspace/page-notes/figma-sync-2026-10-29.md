# Figma 和网站对齐 · 2026-10-29

Figma：KIVI UI KIT V2（bfXarGblevAYPh7a6nmXlt）。链接前缀：`https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=`

对比范围：按钮、菜单和提示、选择控件、输入控件、弹窗、反馈、选项卡标签头像、画布、Agent、主站、占位图、播放器，加模板页的关键块。变量页做了数值逐项对比（86 项全部一致），图标页只对了名字（一致）。数值（尺寸、圆角、间距、颜色变量、字号）是读 Figma 节点和网站 CSS / 参数表比的，没有逐像素看图。

---

## 一、本轮已改

### 变量（「变量」页）
- scale 集合加 `motion/ease/expand`（cubic-bezier(0, 0.7, 0.22, 1)）、`motion/ease/spring`（值照 tokens.css），字符串类型，作用范围全关，带 WEB 代码名和说明。
- 「17 动效」分区：加两行（含曲线预览），数量 8 → 10，分区说明补了 expand、spring。

### 选择控件
- Slider（165:822）原地改成刻度滑块：轨道 20 高白 8%、已选白 12%、把手 8 × 20 白条（第二轮改成绑 text/fill/primary）、刻度 1 × 6 白 20%（绑 text/disabled）、刻度数字 22 高 12 号。15 个变体保留，新增「刻度」「刻度数字」两个开关。
- 状态「悬停」改名「聚焦」（网站悬停没有变化，聚焦才有描边，第二轮改）。旧实例 0 个，没有东西要迁。描述、分区说明、提示、文档里的状态名都改了。
- 迁移映射：改了「时长滑块 + 数值」一行（旧数值过时），加了一行「Slider 悬停 → 聚焦」。

### 播放器（新页）
- 新建页「播放器」（页 id 624:3246），VideoPlayer 组件集（624:4626）：大小=小 / 大 × 状态=默认 / 悬停，共 4 个变体。按钮是 IconButton 实例（第一轮是浮层去掉填充，第二轮换成「浮层无底」类型）；播放实心、音量 VolumeFull、全屏 FullScreen；小号渐变 64 / 按钮 28 / 时间 12 / 进度 2 高贴底；大号渐变 96 / 按钮 32 / 时间 14 / 进度浮着带 10 的拖拽点。画面是 PlaceholderImage。描述标了「待确认」。
- 页面版式照其他组件页（页头、分区、提示、迁移映射）。
- 替换：NodeMedia 类型=视频（296:2187）里的「画面 + 时长 + 播放条」换成一个 VideoPlayer 小号实例（已暴露，悬停态在嵌套实例上切「状态」）；ResultTile 视频完成（423:1442）、视频悬停（423:1450）换成 VideoPlayer 小号 默认 / 悬停。模板里 298:2732 的悬停态已切到「悬停」。
- 删了：PlayBar 组件（292:2223）和它的标注文字（292:2237）。删前把 画布、主站、模板 · 画布、模板 · 主站 四页重新扫过，实例 0 个。NodeMedia 的属性「时长」「播放条」也删了。
- 迁移映射：「播放器」页加 PlayBar → VideoPlayer；「画布」页加 3 行（PlayBar → VideoPlayer、NodeMedia 视频合并、NodeCard 上传中改样式）。

### 主站
- ResultTile（423:1522）生成中：删了「进度」「扫光」图层（图片、视频各 2 个），只留遮罩 + 任务角标；描述「遮罩 + 进度 + 扫光」改成「遮罩 + 点阵动效，不画进度和扫光」；「画面按 FIT 放…留底色」改成铺满、居中裁切；「播放条」改成 VideoPlayer 小号。
- GenPrompt（428:895）：删属性「时间」「显示时间」「复制」（原来就没有时间那一行，只剩孤儿属性；复制按钮本来就在，现在固定显示）；保留「显示提示词」。描述里时间的话删了，加了一句「提示词一定有、复制固定显示、工具类关掉提示词、不显示时间」；「参考浮层 popup 底」改成玻璃底（glass + 模糊 + border-subtle）。分区说明「时间、提示词、参数」去掉时间。
- 「模板 · 主站」参考区行（514:2563）：「约 200ms 缓出」改成「400ms 起每多一张 +10ms，最多 700ms，缓动 expand」。

### 标签头像、Agent
- Tag（184:686）描述：圆角 4 → 6。
- QuestionPanel（342:980）描述：底色 popup → surface。

### 画布
- NodeCard（297:2392）完成态：左上「上传中」按钮图标由占位 Add 换成 Loading；右上「文字按钮」默认文字「上传」+ 左图标 Upload。描述和「节点」分区的复用说明同步改了，NodeMedia 描述也改了。
- 顺带修了一个 Figma 里的毛病：Button 的 12 个「浮层」变体（小 / 中 / 大 × 默认 / 悬停 / 按下 / 禁用），leftIcon、rightIcon 图层没连到「左图标」「右图标」开关，打开开关没反应。已连上（上传按钮要用）。

没做的：NodeCard 的转圈在 Figma 里只能是静态图，没法动。

---

## 二、第二轮（用户逐条确认后改的）

### 按钮
- **Button 中·主要·默认** 文字字重 Regular → Medium（[137:845](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=137-845)）。新字用 Noto Sans SC Medium，字体族、字重变量没再绑（苹方在脚本里加载不了）。
- **IconButton 加类型「浮层无底」**（代码 on-media-ghost）：尺寸 28 / 32 / 36 × 默认 / 悬停 / 按下 / 禁用 / 选中，共 15 个变体并进原组件集（[139:1203](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=139-1203)）。默认透明；悬停黑 40%（on-media/fill）；按下、选中黑 60%（on-media/fill-hover）；全程没有模糊；禁用透明。描述写了只给播放器这类叠在画面上的控制条用。
- VideoPlayer 里的按钮实例都换成了这个类型，去掉了实例覆盖。
- ButtonGroup（别人加的）：**只加了一个「收藏」开关**（控制最左边的星，素材节点要关掉），其余没动。

### 选择控件
- Slider 把手填充绑 `color/text/fill/primary`（15 个变体都改了）。「聚焦」不再变把手色，改成轨道外偏移 2、1.5 宽的描边，颜色用 `color/border/strong`（白 50%，照网站，不是 border/focus 绿色）。描述和迁移映射同步。
- 「模板 · 画布」参数面板里 3 个手画的刻度滑块（视频时长、语速、音调）换成 Slider 实例，打开「刻度」「刻度数字」。Slider 的刻度固定在 0 / 25 / 50 / 75 / 100 五个位置，所以：语速 0.5x / 1.0x / 2.0x、音调 -12 / 0 / 12 各用 3 个位置；视频时长原来是 0 / 10 / 20 / 30，现在只能写 0 / 15 / 30。把手都在 50%（原来画的也在中间）。

### 菜单和提示
- SidebarLabel（[397:1811](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=397-1811)）描述「IconButton 28 文字」改成「轻，整体 30%」。

### 画布
- NodeCard 完成态右上：删掉散的 Button 中·浮层、IconButton 32·浮层，换成 ButtonGroup 实例「按钮条」（收藏 · 全屏 · 下载 | 文字按钮，已暴露，属性在 NodeCard 实例面板里）+ 单独一个只装实心星的「收藏标记」。属性：「图标按钮」改名「按钮条」，「文字按钮」删，新增「已收藏」。「收藏」开关在按钮条的实例属性里（ButtonGroup 的「收藏」）。收藏星是品牌绿（`color/brand/solid`）、图标 CollectSolid。图标按钮不再是占位 Add，是全屏、下载。描述改了。
- 「模板 · 画布」用到旧按钮的 5 个 NodeCard 实例已改：素材节点 3 个（298:2396、298:2426、298:2439）是「全屏 · 下载 | 上传（左图标 Upload）」，没有收藏；展开态 2 个（298:2634、298:2758）是「收藏 · 全屏 · 下载 | 设为封面」。
- NodeCard 生成中、ResultTile 生成中（图片、视频）各放一帧静态点阵「点阵（示意）」：点距 6、白色、点半径约 1.08，图标拼好（图片 ImageGeneration、视频 VideoGeneration，格子照网站引擎按 0.3 覆盖率算的，图标占边长 56%）。描述写了「示意，动效由程序算，以网站动效页为准」。
- 生成面板「模型选择栏」统一 32：把 9 个 36 高的栏、4 个旧的 ModelSelect 框改成 32；9 个手画的「生成」按钮（60 × 36 的散图层）换成 Button 中·主要实例，左图标 Kiwi、数字 1（原来文字是 🥝 表情，我写成 1，要换数字自己改）。
- 新增「多图节点」分区（「画布」页「节点」分区右边）：**NodeStack**（收起 / 展开，4 张：1 主图 + 3 候选，每张一个 NodeCard 实例；收起往上 8、缩 5%、歪 -4° / 4° / -2°；展开铺格子间距 8；阴影用新效果样式）和 **NodeStackToggle**（收起 / 展开；展开箭头换成 UpArrowSmall，因为实例里不能旋转）。描述写了 400ms 起每张 +10ms、最多 700ms、缓动 spring、两档阴影。
- 「画布」页「节点」分区：AudioWave 和它的标注往左挪到 x=80，补上 PlayBar 的空。
- 迁移映射：「画布」页加一行（NodeCard 「图标按钮」「文字按钮」→ 「按钮条」+「已收藏」）。

### 主站
- ResultTile：悬停的右上、左下两处换成 ButtonGroup 实例（右上 删除 · 下载 · 收藏，左下快捷操作 4 个）；完成态加「收藏标记」（属性「已收藏」，只装一颗绿色实心星）。描述同步（对应网站 collect / collected）。

### 播放器
- VideoPlayer 补了 13 个状态变体（共 17 个）：缓冲（居中 Loading，小 24 / 大 40）、失败（EmptyState 小，「加载失败」，没有控制条）、静音、半音量、音量弹出（玻璃竖条，宽 40，圆角 12）、进度悬停（4 高）、全屏中（大号，图标 Fold）。小号 8 个、大号 9 个，页面和描述重排过。
- 页面从末尾挪进了「通用组件」组（选项卡、标签和头像之后）。

### 变量
- 效果样式新增「阴影/叠放」（0 2px 10px 黑 20%）、「阴影/展开」（0 10px 30px 黑 50%），命名、描述写法照「玻璃/背景模糊」。变量页加了分区「18 阴影」（2 行，带预览）。

---

## 三、还没对上

### 弹窗
1. **Dialog 没有全屏尺寸**
   - Figma：S / M / L / XL。
   - 网站：多一个 `full`（100vw），网站自己写了「全屏待定，只定了宽度」。
   - 建议：待定（等全屏定了再做）。
   - [93:744](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=93-744)

### 网站有、Figma 没有组件的
2. 网站有而 Figma 只有模板示意、没有组件的：PromptBox、ReferenceStack、ReferenceAddSlot、GenerateButton（Kiwi + 消耗数，现在是 Button 中·主要 + Kiwi 左图标拼的）、ToolbarSwitch、ToolbarDivider、GenPromptRefs（GenPrompt 里是散 frame）、Tabs（Figma 只有 TabItem + 模板「选项卡组」）、Menu / Dropdown（模板）、NodeToolbar、NodePanel、ParamPicker、CanvasToolbar（模板）。
   - 建议：待定，以后讨论（用户 10-29 定：不在这一轮做）。
   - 位置：[模板 · 主站 输入框 499:1743](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=499-1743) · [参考区叠放 561:15969](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=561-15969)

### 变量
3. **`color/bg/fill/popup-raised`**
   - Figma：有（值同 popup #2C2D2E，没有作用范围）。
   - 网站：tokens.css 里没有。
   - 建议：待定，记待办（项目里用到再补网站，没用到就从 Figma 删）。
   - [变量页 6:2](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=6-2)

### 这一轮新做的东西里没做完 / 要留意的
4. NodeCard 的转圈（上传中）、点阵、NodeStack 的动效在 Figma 里都是静态示意，没法动，以网站为准。
5. NodeStack 摆了 4 张；网站支持任意张，更多张的位置规则（往右每列两张）只写在描述里，没画。
6. 「模板 · 画布」那三个换成 Slider 的刻度滑块：视频时长标签从 0 / 10 / 20 / 30 变成 0 / 15 / 30（Slider 刻度固定五个位置）。要保留四个标签就得让 Slider 的刻度位置能改。
7. 「主站」页没有迁移映射分区，ResultTile、GenPrompt 的改动（GenPrompt 删三个属性）没有映射行；要不要给「主站」页加一个分区，请定。

---

## 四、核对过、一致的（不用动）

- 变量：color、scale 里 86 项数值和 tokens.css 一致；图标名字两边一致。
- 组件数值：Button（尺寸 28 / 32 / 36、圆角 6 / 8 / 8、内边距、浮层模糊 24）、IconButton、Switch、Checkbox、Input、NumberInput、Select、Textarea、Tooltip、Menu / MenuItem / MenuLabel / MenuDivider、SidebarItem、Toast、Loading、Skeleton、EmptyState、TabItem、Tag（圆角 6）、Avatar、AssetThumb、NodeWrapper、ConnectorDot、ConnectorRemove、MentionChip、PromptInput、ReferenceItem、AudioWave、ProcessRow、UserMessage、MediaStack、QuestionPanel、_QuestionOption、ActionCard、SendButton、FileCard、GenPrompt、ResultTile 的尺寸、圆角、间距、颜色变量和网站一致。
- 玻璃浮层：菜单、节点工具栏、参数面板在 Figma 里都是 glass + 模糊 32 + border-subtle，菜单圆角 12，和网站一致。
- 主站输入框模板（圆角 24、内边距 16、间距 12、工具条 32、添加格 72）和网站 PromptBox 一致。

## 五、注意

- 按钮页里的 ButtonGroup 是别人加的，我只加了「收藏」开关，其他没动。
- Figma 里脚本新建的文字用的是 Noto Sans SC（苹方在这个环境加载不了）。新建的文字没有绑字体族变量，只绑了字号、行高、颜色。
