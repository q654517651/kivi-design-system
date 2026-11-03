# skill 测试 · Figma 里搭「资产」页（2026-10-30）

## 1. 产出

- 新 page「测试 · 资产 生成历史（skill 测试 10-30）」：https://www.figma.com/design/iVABA54n2vNPDE7GKGJrcQ/KIVI-3.14?node-id=225-5807
- 画板「资产 · 生成历史」1440×1024：node-id `227:5538`（https://www.figma.com/design/iVABA54n2vNPDE7GKGJrcQ/KIVI-3.14?node-id=227-5538）
- 画板「资产 · 画布」1440×1024：node-id `227:6201`
- 旁边两条注释「规范未覆盖，待设计确认」：`230:5904`、`230:5913`
- 只动了新 page，没碰 Page 1。

## 2. 读了什么

SKILL.md：规范在哪、先分清任务（「在 Figma 里搭」那行）、核心规则 1–11、规范没覆盖时、没有设计稿时、审查（清单）、路由表。
网站：
- `docs/business/main-site.mdx`（ResultTile、GenPrompt 参数）
- `docs/components/menus-tooltip.mdx`（SidebarItem / SidebarLabel / SidebarMore）
- `docs/components/tabs-tags-avatar.mdx`（TabItem、Tabs、AssetThumb）
- `docs/foundations/placeholder-images.mdx`、`tokens.mdx`、`icons.mdx`（和 `icons.demos.tsx`）、`legacy-names.mdx`、`index.mdx`
- `kivi/menus-tooltip/menus-tooltip.css`、`kivi/tokens.css`、`kivi/icons.ts`

## 3. 用了什么

库：「KIVI UI KIT V2」已经在这个文件里启用（`get_libraries` 返回 added）。没用到别的库。

库组件实例（最外层统计，两个画板合计）：SidebarItem 26、SidebarLabel 4、SidebarMore 4、TabItem 10、Select 6、ResultTile 18、PlaceholderImage 5（嵌在 ResultTile 之外的画布封面）、IconButton 2、Logo 2、图标 AddSmall 1、Canvas 2；侧栏里的 Create / Explore / Folder / Pack / Sidebar / Message / NewChat / More / DownArrowSmall 图标都是库图标实例。

变量（`importVariableByKeyAsync`）：
- 颜色：`color/bg/fill/base`、`container-light-1`、`container-light-2`、`surface`，`color/text/fill/primary / secondary / tertiary`，`color/border-subtle`
- 间距：`spacing/4 / 6 / 8 / 12 / 16 / 24 / 32`
- 圆角：`border/radius/12`
- 字号、行高：`font/size/12 / 13 / 16`，`font/line-height/20 / 24`（实例里的文字原来的 10–16 档也按值重新绑了）
- 不透明度：`opacity/30`（空画布图标）
- 自己画的节点（87 个）：实色填充 0 个没绑变量，文字的字号、行高全绑。

没能绑的：
- 字体族、字重：没绑（`font/family` 值是 PingFang SC，插件里加载不了，绑不上）。
- 文字样式（`文字/13 常规` 等）：一个都没套上，见第 6 条。
- 画板尺寸、侧栏宽 240、网格格宽 137、封面 270×152：写死数字（布局宽度，SKILL 审查清单允许；但没有对应变量）。

用户作品位置：ResultTile 完成（里面嵌 PlaceholderImage）、画布封面直接用 PlaceholderImage，换了 9 款里不同的图，比例不一致的用「模糊垫底」。侧栏缩略图用 AssetThumb 图片，所有头像都是同一张图（见问题 12）。

## 4. 三档

| 块 | 档 | 说明 |
|---|---|---|
| 侧栏条目（导航、列表）、分组标题、「更多」 | 已定 | 网站 menus-tooltip 页有参数表 |
| Logo | 已定 | Figma 有 Logo 组件（网站没写） |
| 选项卡（生成历史 / 画布，图片 / 视频…） | 能组合 | TabItem 选项卡，一级用大、二级用中；Tabs 容器 Figma 没有，按网站 Tabs 间距 4 拼 |
| 筛选 / 时间 / 排序 | 能组合 | Select 无底·已选（拿「已选」状态当标签用），前面一根 1×16 的竖线（网站 ToolbarDivider 的做法） |
| 结果格（方形缩略图） | 能组合 | ResultTile 完成，改成 137 方；格内 PlaceholderImage |
| 整页布局：侧栏 240、主区内边距 24、底色分层 | 没覆盖 | 网站没有页面骨架；240 是 216 + 内边距 12 推出来的 |
| 日期分组标题、网格间距 8、一行 8 个 | 没覆盖 | 标题用 16 粗（分区标题）；间距 8 是自己定的（网站示例是 4，tokens 说组件之间 12–32） |
| 画布项目卡片（封面、名字、x 月 x 日修改）、新建项目格、空画布占位 | 没覆盖 | 封面 270×152 圆角 12；空画布用 Canvas 图标 40 + opacity/30（照 AssetThumb 图标的做法） |
| 「主体」的图标 | 没覆盖 | 图标表没有，暂用 Pack，注释里标了 |
| 顶部右侧（搜索、会员、头像） | 没画 | 任务没要求 |

## 5. 审查清单自查

- 变量没写死：自己画的节点通过；实例里的文字颜色、字号是组件自带，字号行高我重新绑了；字体族、字重没绑。
- 用现有组件：通过。
- 底色分层：页面 base → 侧栏 container-light-2 → 可点的封面 container-light-1。无浮层。
- 字号：13 / 16 / 12，没用 14（没有阅读类文字）。
- 一屏一个主按钮：0 个。
- 只有图标的按钮配 Tooltip：未做。侧栏收起按钮、分组「新建」按钮没有 Tooltip。静态稿里没法画，SKILL 也没说 Figma 里怎么表示。
- 状态齐全：只画了默认和选中。没画：悬停（结果格、封面）、生成中、失败、生成历史为空（EmptyState 暂无内容）、画布为空、加载骨架、筛选展开菜单。我试了 ResultTile 生成中，在 137 下坏掉（见问题 8），换成了完成。这条没过。
- 动效：不涉及。
- 图标：全是库图标。「主体」暂用 Pack（待确认）。
- 旧名：没用。

## 6. skill 的问题（最重要）

### 路由和信息不够

1. **SKILL.md「在 Figma 里搭」一行没有 Figma 侧信息。** 没有库文件 key。`bfXarGblevAYPh7a6nmXlt` 只写在 `site/src/shell/PageHeader.tsx` 里，SKILL.md、MDX 里都没有；MDX 页头的 `figma={['主站','422:658']}` 只有 node-id，没有说它在哪个文件。库在目标文件里有没有启用、怎么找，也没说。我是靠 `get_libraries` + `search_design_system` 自己摸到的。
2. **网站是 React 属性（英文），Figma 是中文变体属性，没有对照表。** 例如：
   - SidebarItem：`variant="nav|list"` ↔ `类型=导航|列表`，`selected` ↔ `状态=选中`，`more` ↔ `更多`。
   - TabItem：`variant tab|segment` ↔ `样式`，`layout` ↔ `布局`，`size md|lg` ↔ `尺寸 中|大`。
   - Select：`variant="plain"` ↔ `样式=无底`。
   - ResultTile：`status` ↔ `状态`，`src` ↔ 嵌在里面的 PlaceholderImage 的「图片」。
   
   全靠猜、靠读 `componentPropertyDefinitions`。「旧名对照」页是旧→新名，不是 React↔Figma。
3. **Figma 没有暴露、网站却有的属性。** 网站 `icon="Folder"` 在 Figma 的 SidebarItem 上没有对应的实例交换属性（属性面板只有 文字、更多、类型、状态），要钻到 `leftIcon > 图标` 手工换图标；列表项换缩略图类型、PlaceholderImage 的「比例」同理（描述写「嵌套暴露的比例」，但比例并不在 PlaceholderImage 实例上，要对它里面的「画面」实例改；ResultTile 里的 PlaceholderImage 的「图片」也没暴露到 ResultTile）。skill 没提，写 Figma 稿的人必须自己找路径。
4. **没有页面骨架。** 「没有设计稿时」第 1 步让我「找最像的现有页面」，路由表里主站只有 GenPrompt、ResultTile、PromptBox，没有侧栏 + 主区的整页结构、侧栏宽度、主区边距、画板宽度。侧栏三件零件在「菜单和提示」页，和「主站」页分开，路由表也没把「主站侧栏」指到那页（图标页里写了「主站侧栏用」，但要自己 grep 才找到）。
5. **「资产 / 生成历史」不是「生成记录」。** 路由说「生成记录和输入框读『主站』」，但主站页的记录是 GenPrompt + 结果格（创作页里的），资产页是纯缩略图网格。路由没分开，我是靠截图判断。
6. **图标表没有「资产」「主体」的图标。** `icons.demos.tsx` 里 Create、Explore、AITools 标了「主站侧栏用」，但侧栏四项里的资产、主体没有对应。我用 Folder、Pack。skill 说不许拿相近图标顶替，也没说缺图标时怎么办（记忆里的做法是去 Lucide 选、标待确认，但 skill 里没有）。
7. **选项卡还是分段，规则 7 没分清。** 规则 7：「几个值选一个用分段，切换整块内容用选项卡」。资产页的「图片 / 视频 / 音频 / 文档」既是筛选（选一个值），又切换下面整块内容。我按截图用了选项卡。Figma 描述还写「组合方式见模板『选项卡组』『分段选择』」，但模板不是发布的组件，`search_design_system` 搜不到。

### Figma 里的实际阻碍

8. **库组件和网站对不上时，没说谁为准，而且我必须用库组件。** SKILL 说「和网站对不上以网站为准」，任务要求用库组件，两句冲突。具体：
   - ResultTile 生成中：网站是点阵 GeneratingDots（无原素材无遮罩，有原素材遮罩 + 模糊 + 点阵），Figma 的「生成中」还是旧的「遮罩 + 进度条 + 扫光」。而且缩到 137 方就坏了：灰条不跟着缩，角标文字被截。网站写了「宽高随排版改」，Figma 这一档没做响应。
   - SidebarLabel 的「新建」按钮：网站 CSS 是 IconButton 轻 + 透明度 30%，Figma 描述是 IconButton「文字」。
   - Tag 圆角：Figma 描述 4，网站 6。
9. **字体。** SKILL 核心规则 4 写「字体苹方」，但 Figma 插件里没有苹方：
   - 连把带苹方文字的实例 `appendChild` 到别的 frame 都会报 unloaded font。要先把实例里所有文字换成别的字体再放；而且要先关掉 `figma.skipInvisibleInstanceChildren`，否则隐藏的文字漏掉，报错信息也不告诉是哪个节点。
   - 换字体会清掉文字样式（`textStyleId` 变空）。所以「文字/13 常规」这类样式一个都套不上，整页文字靠重新绑字号、行高变量。
   - `font/family` 变量描述说「改完要改回 PingFang SC」，但插件里改不回去。我按任务要求留成 Noto Sans SC（实例里 56 段 + 自己的 32 段）。用户打开这个文件如果有苹方，需要手动换回。
   
   SKILL.md 和网站都没说这件事，只有库里 `font/family` 变量的描述提了一句。tokens.mdx 说「字体是 PingFang SC」「文字样式按文字/字号 字重命名」，没说文字样式在插件环境用不了。
10. **缩略图换不了图。** AssetThumb「图片」带一张固定的图片填充，插件不能创建新图片，侧栏里每个有封面的条目都是同一张图。SKILL 说「用户作品位置用 PlaceholderImage」，但 AssetThumb 里放不进 PlaceholderImage。侧栏封面这种小缩略图该怎么表达，没写。
11. **PlaceholderImage「模糊垫底」** 在我的两处用法（137 方里放 3:4 / 9:16，270×152 里放 9:16）里，截图看起来仍像铺满，没有完整显示原图，我没深究是组件问题还是我的设置问题。网站写的是「原图完整显示」。
12. **间距取值冲突。** 网站示例里结果格网格间距是 4（`main-site.mdx`），tokens.mdx 说「组件之间 12–32」。资产网格该用哪个，没规则；我用了 8（既不是 4 也不是 12）。
13. **「选项」型下拉的触发器没有「已选标签」状态。** Select 只有「占位文字」（占位色）和「已选」（值文字）两种，筛选、时间、排序这种带固定标签的触发器，我拿「已选」顶。skill 没提。

### 其他

14. 审查清单里「只有图标的按钮都有 Tooltip」「状态齐全」对 Figma 静态稿没有可执行的做法（Tooltip 怎么画、状态是画全还是只摆组件）。
15. 「状态画全」和 SKILL 对 Figma 的要求没给范围：整页是否每种状态都要摆一份，没写。
