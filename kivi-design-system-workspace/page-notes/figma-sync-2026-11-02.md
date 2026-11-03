# Figma 和网站对齐 · 2026-11-02

只读扫了一遍，没改 Figma、没改网站。范围：变量、图标名、8 个通用组件页（按钮到播放器、占位图）、菜单和提示、画布、Agent、主站、4 个模板页。读的是 Figma 节点、变量绑定和网站 CSS / TSX；没逐像素看图，没比动效。抽查过的几条（Slider 数字、播放器轨道、侧栏描述、Rename、tokens 注释、记录流间距）都属实。

链接前缀：`https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=`

---

## 一、改 Figma（网站新，有依据）

### 已定的大块，Figma 还没跟
1. **PromptBox 玻璃、浮在记录上**（11-02）
   - Figma「模板 · 主站」输入框分区 8 个外框还是 container-light-1、没模糊：499:1799、499:1868、499:1946、499:2061、499:2146、499:2231、499:2288、514:2341。
   - 生成页 393:5093 放在记录下面单独一块，没浮在上面。
   - 「模板 · 通用」提示词输入框 171:762 又是 surface。三处统一成玻璃。
2. **参考卡片右上角序号、悬停换删除**（11-02）
   - 输入框分区的 ReferenceItem 实例都是「角标关、权重开」，底部写「图片1」「视频6」「音频1」（514:2229、514:2297、514:2174 等 14 处）；叠放 561:15969 没序号。
   - 首尾帧 514:2209、514:2199 也是底部条，网站是右上角「首帧」「尾帧」。
   - ReferenceItem 组件 458:12252 没有悬停删除态；描述还写「底部可以写图片1」（网站 `canvas.mdx` 的 weight 说明也要一起去掉）。
   - 交互说明 514:2526 / 514:2528 还写「底部写名字」「删除、预览待确认」。
   - 交互说明写「视频、音频标时长」，实例的「时长」全关。
3. **Agent 模式工具条：模型 / 技能 / 手动自动**（11-02）
   - 生成页 393:5098 还是视频参数那套，还带 16fps（同页自己写着「不再带帧率」）。
   - 示例 499:1753、499:1799 是「Agent / Skills / 模型偏好」三个下拉；标题写「都是图标按钮」，和画的也对不上。
4. **ProcessGroup、AskRecord：Figma 没有**
   - 模板里是旧写法：「调用了多个工具」整行 ProcessRow（346:3271）、手拼的「询问组」（353:4475）。
   - QuestionPanel 342:980 描述「留一行 ProcessRow 已询问」跟着改成 AskRecord。
   - 「模板 · 主站」没有主站 Agent 一轮（UserMessage + ProcessGroup + 4 张大图），等 ProcessGroup 有了再补。
5. **ProcessRow 进行中**（11-02）
   - Figma 340:681、340:694、340:754：图标白、动作文字白 / 30% 渐变。
   - 网站：进行中和完成同色，停 0.5 秒才扫一道亮光。
   - 箭头网站是悬停才出，Figma 描述补一句。
6. **ResultTile 失败态保留右上操作**（10-29）：Figma 423:1414、423:1512 只有 EmptyState。
7. **Tooltip 长文的文字**：1013:2476 是 Noto 14/22，没绑字号、行高，没套文字样式（CLAUDE.md 点名要改回苹方 + 文字/14 常规）。
8. **无底 Select 没选值**（11-02）：Figma 170:810 等 5 个变体没有「没选值、占位是白色入口名」这一态。

### 数值、颜色对不上
9. **VideoPlayer**（624:4626）
   - 轨道和已播放都绑 on-media/text 100%，看不出进度（624:4554、624:4592 等）。网站轨道白 30%。
   - 总时长和「/」是白 100%，描述和网站是 50%。
   - 描述「悬停 600ms 后静音播放」→ 立刻播（10-30 定）。
10. **Slider 刻度数字**：165:822 全部 15 个变体都是白 100%，描述和网站是 50%。
11. **_QuestionOption**（342:913）缺禁用（50%）和键盘聚焦描边（10-29 审查加的）。

### 描述里的旧话（只改文字）
12. 侧栏三个组件（上一轮我只往后加了 11-02 那段，前面的旧值没删）：
    - SidebarItem 397:1779：「左右 12」「左 12 右 8」→ 导航 8 / 8、列表 6。
    - SidebarLabel 397:1811：「左 12 右 4、整体 30%」→ 删掉旧段。
    - SidebarMore 1021:2779：「左 12」→ 删掉旧段。
13. Tooltip 146:937 只写「目标下方 8px」；位置规则只写在提示 147:633，组件描述没写。
14. GenPrompt 428:895：「复制 IconButton 28 · 弱」→ 轻；「没有不让提交」删（必填是研发的事）；补「收起时悬停用 Tooltip 长文看全文」。
15. SendButton 353:1865：「生成仍用 Button 大·主要」→ 中号 GenerateButton。
16. 变量页 72:53：「菜单、面板圆角 16」→ 菜单 12、参数面板 16、工具栏 12。
17. 「模板 · 主站」432:2106 标签「画面按 FIT 留底色」→ 铺满裁切。

### 低优先
18. 颜色绑的是原始色（值一样）：
    - IconButton 浮层图标绑 text/fill/primary，应为 on-media/text。
    - MentionChip 描边 white/8 → border-subtle。
    - ReferenceItem 时长、权重底 black/40 → container-dark。
    - ConnectorDot 高亮 white/50 → border-strong。
19. ButtonGroup 623:2911 的属性「图标 3」「图标 4」改成看得懂的名字（全屏 / 下载 / 更多）。

---

## 二、改网站 / 仓库（小事）

1. `icons.ts` 的 Rename 还是描边、没转轮廓（注释写「Figma 还没有」）。Figma 1021:3716 已有轮廓版，重新导出；打字体要轮廓。
2. `icons.ts` 文件头的数量过期，实际 165 个（和 Figma 一致）。
3. `tokens.css` 注释过期：expand、spring 写「Figma 待补」，阴影写「Figma 没有」。Figma 都有了，值一致。
4. 笔记过期：
   - `page-notes/video-player.md:19-34`「Figma 只有 PlayBar」。
   - `page-notes/tabs-tags-avatar.md:158`「Tag 圆角 Figma 是 4」，现在是 6。
   - `page-notes/menus-tooltip.md` 末节「68 宽、44」，现在是 60 / 36。
   - CLAUDE.md 的两句（Slider 还是绿色、VideoPlayer Figma 还没有）已改。

---

## 三、要你定的

1. **画布 Agent 侧栏宽**：Figma 460（346:3246 等，MediaStack 描述也写 460）；网站 420（`agent.md` 记的是待定）。
2. **主站记录流**：Figma 记录间距 24、顶部 24；网站 48、72（`templates.css:221-222`）。
3. **右上角积分和头像**：Figma 离边 24、内边距 6 / 12、间距 16、头像 32；网站离边 16、内边距 4 / 12、间距 8、头像 24。
4. **侧栏收起按钮**：Figma IconButton 28、Logo 行高 28；网站 32、行高 32。
5. **生成面板全屏按钮**：Figma 28、离边 16（565:16000）；网站 32、离边 12。
6. **GenPrompt 短态**：Figma 复制按钮撑高、行高 28（整体 56）；网站复制跟在字后、行高 22（整体 50）。
7. **Slider 没刻度数字时的首尾**：Figma 都留 11；网站留 4，有数字才 11。
8. **EmptyState 引导按钮**：网站有 `action`，Figma 没有。Figma 加，还是网站删。
9. **参数面板宽**：Figma 视频 368、音频 365；网站最小 333（没量渲染出来的实际宽）。
10. **画布 Agent 输入框工具条**：Figma 5 个「次要」IconButton（多一个 Openai）；网站 4 个文字类型 + SendButton。
11. **画布模板合页**：网站合成一页（小画布 + Agent），Figma 还是「模板 · 画布」「模板 · 画布 Agent」两页，也没有整页稿。
12. **主站首页稿** 389:1567：网站没做（首页分段是特例）。
13. **`color/bg/fill/popup-raised`**：Figma 变量页已标「废弃，并入 popup」，建议直接删。
14. **FileCard**：两边都废弃，样子也不同。建议不管或删。

---

## 四、上轮留下的，仍未对上

- Dialog `full`：Figma 只有 S / M / L / XL。
- 网站有、Figma 只有模板示意的组合体（以后讨论）。上轮之后又多了：ReferenceFramePair、ParamPicker / ParamPanel / ParamField / ParamValue、NodePanelRefs、NodePanelBar、NodeToolbarDivider、SkillCard。
- Tabs、Toast、GeneratingDots / GeneratingRow 不是 Figma 组件。
- Slider 刻度固定 5 个位置，网站 `marks` 任意。
- NodeStack 多于 4 张的摆法没画。

---

## 五、Figma 里的杂物（可删）

- 变量页 75:1417「Rectangle 1」，在所有分区下面。
- 图标页 598:3981、598:4008、598:4034、598:4061，四个「shape」，像 VideoExtend 转轮廓剩下的。
- 「模板 · 主站」451:14383「ResultTile」，三张矩形手摆的，在分区外。
- 「画布」页 668:4394、668:4416（ReferenceStrip）、667:5083（ModelSelect 实例）叠在页头左上；500:14821 是旧的画布整页草图。

---

## 六、核对过、一致的

- 变量：color 44 项、scale（间距含 spacing/2、圆角、描边、字号、行高、字重、动效时长 5、缓动 5）、效果样式（玻璃模糊 32、阴影/叠放、阴影/展开）全一致。opacity Figma 写 50、网站写 0.5，是写法不同。
- 图标名：165 个两边完全一样。
- 通用组件：Button、IconButton、ButtonGroup、Switch、Checkbox、Slider（其余数值）、Input、NumberInput、Select、Textarea、Dialog S–XL、Toast、Loading、Skeleton、EmptyState（除引导按钮）、TabItem、Tag（圆角 6）、Avatar、AssetThumb、VideoPlayer（尺寸）、PlaceholderImage。
- 菜单和提示：Tooltip 三种、MenuItem / MenuLabel / MenuDivider、菜单玻璃圆角 12；侧栏三个组件的变体数值（只有描述旧）。
- 画布：NodeWrapper、NodeCard（上传中转圈、按钮条、收藏标记都已换好）、NodeMedia、NodeStack、连线三件、AudioWave、CropHandles、MentionChip、PromptInput、节点工具栏、生成面板、参数面板外框。
- Agent：ProcessRow 尺寸和完成 / 失败色、UserMessage、MediaStack、QuestionPanel、ActionCard、SendButton。
- 主站：GenPrompt 参考区、ResultTile 尺寸和按钮条位置、GenerateButton、ToolbarSwitch、ToolbarDivider、侧栏 240 / 收起 60、记录流最宽 1040、结果网格。
- 「模板 · 通用」14 个菜单都是玻璃 + 模糊 32 + 圆角 12 + 内边距 4。

## 七、没查的

- 图标图形（只比了名字）、icons-v3。
- 动效（时长、曲线），Figma 只有描述。
- 嵌套实例里具体换了哪个图标（只抽查了几处）。
- 「模板 · 主站」的生成记录、参数全集、首页排版数值；「模板 · 画布」的节点示例、三个 Agent 侧栏的内容；「模板 · 通用」除菜单外的块。
- 字体（Noto / 苹方）一律跳过，只记了 Tooltip 长文。
