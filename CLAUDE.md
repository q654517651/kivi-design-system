# KIVI 设计规范

这个文件夹用来写 KIVI 设计规范 skill。规范来源是 Figma「KIVI UI KIT V2」（fileKey `bfXarGblevAYPh7a6nmXlt`），设计、产品、研发共用。

## 目标（11-03 用户定，必须达到）

- 覆盖 100% 线上前端功能所需的组件。
- 前端、网站、Figma 三边对齐。
- 变量和组件收敛，不能再有例外。
- 体验做到优秀：交互、状态都要完善，该有动效的地方要有动效。

## 目录

- `kivi-design-system/`：skill 本体。SKILL.md 是入口，`assets/placeholders/` 放占位图。
- `kivi-design-system/workflows/`：子技能（11-03 起）。`build-page.md` 搭页面和原型，`acceptance.md` 验收（给 UI 设计师验开发稿：对照 Figma、前端代码、交互、需求，分「阻塞 / 不一致 / 体验 / 建议」出单文件 HTML 报告）；加图标子技能还没做。所有功能都在这一个技能包里，不放外部目录，用户只装一个包。
- `kivi-design-system/site/`：规范网站兼组件库，React 18 + TypeScript + Vite + MDX。规范的正文就写在这里。
  - 本地看：在 `site/` 下 `npm install`、`npm run dev`，打开 `http://localhost:4173/`（内网用本机内网地址 `:4173`）。
  - `src/kivi/`：组件库本体。`tokens.css` 是所有数值唯一的地方；`Icon.tsx` + `icons.ts` 是从 Figma 导出的图标；每个 Figma 页一个文件夹：组件 `.tsx` + 这一页的 `.css` + `index.ts`。
  - `src/docs/`：规范页面（`.mdx`，规范文字）+ 旁边的 `.demos.tsx`（属性面板、状态矩阵），按 Figma 的页分。
  - `src/docs/templates/`：页面模板（整页怎么拼，只能看），对应 Figma 的「模板 · …」页，目录里放最上面（11-02 用户定）。外框 `frame.tsx`、布局 `templates.css`。业务页上面不再放整体演示。
  - `src/shell/`：网站自己的外壳（目录、演示、属性面板），不属于组件库。页面清单在 `src/shell/nav.ts`。
  - `assets/`（skill 根目录）是网站的静态目录，页面里用 `./placeholders/…`、`./empty-state/…`。
- `kivi-design-system/references/`：旧的 md 规范，正在往网站迁，迁完删掉，别再往里加。
- `kivi-design-system-workspace/`：旧版备份（skill-snapshot-v0.1）、存档（纯 HTML 版网站在 `archive/site-html/`，别的对话做的演示在 `archive/demos/`）、测试结果，不进 skill。
- `kivi-design-system.skill`：打包文件，现在是旧版，发布时重新打包，不进 git。

## 写规范的规矩

- 以 Figma 为准，Figma 里没定的不写。Figma 和 skill 的同步由用户负责。
- 不参考代码。前端代码是按 UI 发挥的，不是设计稿。代码库 `ai-design-web` 只读，不改、不提交。
- 网站是唯一来源，不再另写 md。skill 直接读 `src/docs/` 的 MDX 和 `src/kivi/` 的组件源码。
- 文件按 Figma 的页分。Figma 改了哪一页，就改对应的文档页和 `src/kivi/` 里那一页的文件夹。
- 页面照 HeroUI 的写法（10-29 用户定，样板是 `src/docs/components/button.mdx`、`button.demos.tsx`）：
  - 页头一句话；每个组件一个 `##` + 属性面板，所有尺寸、类型、状态都在面板里切；整屏 / 整块的演示放「页面模板」组，不放业务页上面（11-02 改）。
  - 额外示例只放面板演示不了的，小标题 + 演示，不写字。
  - 最下面 `## 参数`：每个组件一张「属性 / 类型 / 默认 / 说明」表，关键数值写进说明。
  - 不写用途、结构、样子、用法，不放状态矩阵；待定、讨论、Figma 和线上的对比、为什么这么定，都不进页面，放 `kivi-design-system-workspace/page-notes/<页>.md`。
  - 属性面板里用不上的开关直接不显示（`rules` 返回 true）；代码超过 8 行默认收起。
  - 属性面板和预览双向同步（11-02 用户定）：组件自己能变的状态（展开、勾选、开关、选中、收藏、输入的字、选的项）写成受控，onChange 里用 `render` 的第二个参数 `update` 写回面板；面板上没有的状态（比如点了第几个选项卡）也记进 `update`。悬停、聚焦这种一碰就变的不写回，面板上的悬停、聚焦是摆静态样子用的。
- 样子、变量、组件以 Figma V2 为准；交互（点哪出什么、什么时候出）照线上产品。两边不一致的写进页面的「待定」。
- 组件用 React（2026-10-29 用户定：前端是 React，纯 HTML 是「毛坯房」）。不引任何 UI 库、定位库、动画库，交互自己写进组件。组件名就是 Figma 组件名，props 英文、和 Figma 属性一一对应、带中文注释，设 `displayName`。样式用普通 CSS：类名 `kv-组件名`，修饰 `--`，部件 `__`，状态用 `disabled`、`aria-*`，没有对应的用 `data-*`，不用 `is-*`。
- 组件写法照 HeroUI、Radix 这类成熟组件库（10-29 用户定，不能做得垃圾）：细则在网站「组件写法」页（`src/docs/component-api.mdx`）：forwardRef、属性透传、受控三件套、事件合并，公用逻辑放 `src/kivi/hooks/`，组件里不再各写一份。改完在 `site/` 下跑 `npm run check`。和前端怎么协作（抄代码还是装包）还没定。
- 数值变量（间距、圆角、描边粗细、字号、行高、透明度、时长）直接用数字命名，不用 xs、sm、xxl 这类（10-29 用户定）；只有 `border/radius/round` 例外。Figma 变量名不能带点，小数写成横杠：`border/width/1-25` ↔ `--border-width-1-25`。
- 样式只用 `tokens.css` 里的变量，不写死颜色。规范文字写进 MDX，别用 JS 生成，AI 要能直接读。
- 动效都用加减速（tokens 里的缓动），不用匀速；只有循环动画（转圈、扫光、流光）例外（10-29 用户定）。曲线只从变量里选，不另写 cubic-bezier；接近的就修正变量，修不了就从变量里选（11-03 用户定）。
- 演示要组件化：同一个东西在几页出现（比如生成用的下拉、参数面板），先抽成通用组件，再往里填内容，只写一份。生成控件在 `src/docs/business/generation.tsx`，画布和主站都用它（10-29 用户定）。
- 图标用 Figma 的名字和图形，不用 Lucide 代替。
- 改名必须有映射表：Figma 各页的「迁移映射」，网站里统一放在「旧名对照」一页（`src/docs/legacy-names.mdx`），不放在各组件页。
- 写法：中文、短句；图片这类素材放 `assets/`；路径小写加连字符。
- 改 Figma 组件库本身时，先读 `references/figma-kit.md`。

## 图标方案（2026-10-29 定，还没做）

- 不再用阿里 iconfont。从 Figma「图标」页导出，自己打包字体，类名保持 `iconfont icon-kivi-名字`。
- 字体打包进前端，不放 OSS：单独一个 GitLab 图标仓库，存 SVG、字体、CSS、码位表，打版本号；前端当依赖装，升版本号跟着发版。
- 码位固定，新图标往后排；旧名（Mdoel、Snap1 等）留别名。字体只能单色。
- skill 里加一个子技能：Figma 导出 → 打包字体 → 提交 GitLab、打版本。令牌只放环境变量，不进仓库。
- 待办：用户建 Figma 只读令牌、定 GitLab 仓库；前端装依赖、换掉 `config/config.ts` 里引 iconfont 的那行。

## 发布

- skill 和新 kit 一起发布，现在都还没上线。
- 发布前：图标仓库做好；删掉 `references/` 里已迁完的 md；重新打包 `.skill`。

## 进度

写完一篇就更新这里。

- 网站已迁到 React（2026-10-29）：14 页都在，组件库在 `src/kivi/`，浏览器逐页检查过无报错。通用组件：按钮、菜单和提示（含侧栏、Dropdown）、选择控件、输入控件、弹窗、反馈（toast）、选项卡标签和头像；业务组件：画布、Agent、主站。
- 生成中点阵动效 V2 已定稿并同步到网站（10-29）：星点闪烁、斜飘两个方案加第三个「静态扫光」（专给减少动态效果用，只有拼好的图标加扫光），`GeneratingDots`、`GeneratingRow` 加 `effect`，不传则每个实例挂载时在前两个里随机选一个，系统开了减少动态效果就一律用方案三（`reducedMotion` 属性已删，和 `effect="sheen"` 重复）；默认速度 0.5、白色、光晕 0.25、点距 6；图标用 Figma 的 ImageGeneration、VideoGeneration、Audio、Text。记录在 `kivi-design-system-workspace/page-notes/motion-generating.md`，动效页「生成中」只留 Dots、Row 两个属性面板和参数表，并排对照已删。
- 新做的：生成中点阵动效（`GeneratingDots`、`GeneratingRow`，照别的对话里认可的演示，写在动效页「生成中」）；主站输入框 `PromptBox`（参考区叠放、悬停展开、上传、删除，底部生成栏和 `GenerateButton`）。
- 用户 10-29 定：
  - GenPrompt：没有提示词就不显示这一行（照线上；必填校验是研发的事，UI 不管），有提示词时复制固定显示；工具类任务只显示一排参数；不显示时间。
  - 失败文案统一「生成失败，消耗猕猴桃已退回」（10-29 用户定）。
  - 网站内容区铺满屏幕宽。
  - 只维护 React 版。单文件 HTML 原型不再管，`references/prototype.md` 作废，SKILL.md 改路由时去掉「HTML 原型」那条。
  - 「减少动态效果」时的动效：用方案三静态扫光（10-29 定）。
  - 参考区 `ReferenceStack` 照 BytePlus 参考区重做：卡片只动 transform，缓动 `--motion-ease-expand`，400ms 起每多一张 +10ms、最多 700ms；右下角是小圆加号（AddSmall，10-29 从上传图标改），展开时和卡片同一个时长、走弧线变成添加格（横竖两种缓动）。
  - 11-02 用户定：参考卡片和画布统一，底部「图片1」改成右上角序号（按添加顺序），悬停时序号隐藏、换成删除（线上逻辑，两个互斥）；时长回到左下。`name` 留给 @ 引用和读屏。Figma「模板 · 主站」输入框的参考卡如果还画着底部名字要跟改。
- 浮层统一（10-29 用户定，11-03 改了分法）：悬浮在页面上的东西用玻璃（下面是什么都行，通常配描边；11-03 底色从 #181818 70% 改成黑 50%），贴在图片、视频上的控件（按钮、按钮条、标签、播放器控件）用 on-media、不加描边、只限媒体；原来的说法是「会浮动、跟着移动、可能盖住画面、面积不大的东西用玻璃」（`--color-bg-fill-glass` + `--effect-glass-blur` 32 + 描边 border-subtle）：菜单、下拉、右键、节点工具栏、参数面板；弹窗还是 surface + 遮罩；Tooltip、Toast 是实色 popup。网站和 Figma 都已改。菜单圆角 12（条目 8 + 内边距 4，10-29 从 16 改）；单选列表（含 Select）当前项用「选中」底色，不打勾，勾选只给多选。
- 生成中不画进度条，进度交给点阵动效（10-29 用户定），NodeCard 的 `progress` 已删。
- 画布页重写（10-29）：上面一块小画布看整体（5 个节点连线，点选出工具栏和生成面板，悬停、假生成、假上传、拖动和缩放，不放底部工具栏），下面待定清单 + 节点、节点工具栏、生成面板、连线各一个属性面板，其他零件各摆一个，旧名对照收起。属性面板（shell Playground）用不上的开关改成不显示。NodeCard 加了 `hoverActions`，上传中左上改成转圈。Figma 待改：上传中转圈、素材节点「上传」按钮（图标 Upload）。
- 全站照按钮页的写法重写（10-29）：14 个页面都改了，删下来的说明和待定在 `kivi-design-system-workspace/page-notes/`，旧名对照合成一页。网站字号整体大一档，左侧目录加了 Lucide 图标（只给网站外壳用）。
- 菜单展开动效（淡入 + 从锚点那边 96% 放大、移 4）、宽 120–240、最高 8 项（324）滚动；参数面板（`NodeParamPanel`、`NodeParamField`、`NodeParamValue`）照 Figma「视频参数调整」做了。
- Slider 改成 Figma 参数面板里的刻度滑块（20 高灰轨道、8 × 20 白把手、`marks` 刻度），原来的绿色细滑块项目里不用了（10-29 用户说）。Figma「选择控件」页的 Slider 已改成刻度滑块（10-29）。
- 播放器 VideoPlayer（10-29，「通用组件 · 播放器」页，Figma「播放器」页已补，624:4626）：小号放卡片、大号放预览；节点 NodeMedia 视频、主站 ResultTile 视频都换成它，旧的 PlayBar 删了（旧名对照有映射）。按钮用 IconButton 浮层，平时无底；播放、暂停实心，音量描边（Figma 音量图标已改描边，名字不变）。演示视频在 `assets/placeholders/video/`。
- 组件库按「组件写法」整了一轮（10-29）：62 个组件都 forwardRef、属性透传、事件合并、受控用 useControllable；状态 `is-*` 改 `data-*`（文档摆静态的 is-hover / is-active / is-focus 例外）；部件类名改 `__`；颜色走变量，Figma 没变量的注释「Figma 没变量」。公用逻辑在 `src/kivi/hooks/`。`npm run check` 通过，浏览器 17 页无报错。改了的公开属性：ReferenceStack `onOpenChange` → `expanded` / `defaultExpanded` / `onExpandedChange`；VideoPlayer 加 `muted`、`volume` 两套和 `onPlay`、`onPause`；ParamPicker 加 `open` 一套。
- 变量改数字名（10-29）：间距、圆角、描边粗细 17 个改名，新加 `spacing/2`（待确认，给按钮条用）。Figma 变量、代码写法、「变量」页三张表（每行加了旧名）、迁移映射（最上面一张表，含前端用量和 tailwind 键）都改了；网页 `tokens.css` 和 466 行引用换完，「旧名对照」加了「变量」一节。前端 variable.less 还没改，按迁移映射留别名。
- 照外部审查修了一轮（10-29）：Button 加载中挡重复触发（含键盘）；ResultTile 失败态保留操作；VideoPlayer 加缓冲、加载失败、小号键盘可进；Dialog 锁背景滚动（`useScrollLock`）；浮层尺寸变化重新定位；Tabs 竖排上下键；参考卡片键盘预览；NumberInput 失焦按 min/max 夹住；纯图标按钮补 Tooltip。音频节点能真播放（`useAudioPlayer`，和视频互斥、波形可拖动跳转）。追问照 V2 每题翻页不变，补了没选不能提交、`disabled`、按钮文字可传、方向键，提交后留 ProcessRow「已询问」。动效页「最长 400ms」改成正式规则：成组展开 400 起每张 +10、最多 700（不算例外）。
- 按钮条 ButtonGroup（10-29，照用户稿）：条 32 = IconButton 28 + 四周 2，间距 4，on-media 底、不加描边（11-03 从玻璃 + 描边改）。网站在按钮页，NodeCard 收藏挪进右上条（`collect` / `collected`，`leftButton` 删了），ResultTile 右上、左下都换成按钮条；Figma 按钮页加了「ButtonGroup」分区。Figma 的 NodeCard、ResultTile 组件和模板还没换。
- Agent 统一（11-02 用户定）：主站 Agent 和画布侧栏 Agent 一套对话组件，只有产出不同（主站 4 张大图跟在回复下、点了全屏；画布结果在节点里，聊天里同步缩略图、点了定位节点）。不整体折叠，工具调用改成 `ProcessGroup` 一行滚动（停 0.5 秒才扫光、最少停 0.3 秒、做完「调用了 N 个工具」不自动展开、箭头悬停才出），记在 `page-notes/agent.md`。询问也做成能收起的 `AskRecord`（询问中 / 已询问 / 询问三种状态）。Figma 还没有 ProcessGroup、AskRecord。业务组件拆页（生成 / 对话 / 画布 / 主站 + 页面模板）还没定。
- Tooltip 加「长文」类型和「禁用」（11-02，用户定：不能搞特例，缺什么就给组件加类型和状态）：长文给被截断的长文字看全文，14 / 22、能换行、和触发元素一样宽（至少 240）、内边距 8 / 12；`disabled` 时不出现。GenPrompt 照线上改成复制按钮跟在最后一个字后面、自己量行数超两行收起，看全文用 Tooltip 长文。Figma Tooltip 加了「类型=长文」，文字是 Noto 14 / 22，要改回苹方并套「文字/14 常规」。
- 待拍板清单：`kivi-design-system-workspace/decisions-2026-10-29.md`。
- 外部审查逐条过完并改了（10-30）：记录在 `kivi-design-system-workspace/review-2026-10-30.md`，对比图、改后对比、旧版里库没有的配图都在同名文件夹（发用户的是内嵌图片的单文件 html）。定的：参数面板、音频参数、工具条顺序（类型 → 模型 → 参考类型 → 参数）、画布参考类型在底部、MenuItem 禁用、音量浮层都以网站为准，Figma 已跟改；参考浮层一行 5 个、视频音频带时长；生成中分「没素材无遮罩」和「有原素材 + 遮罩 + 模糊 + 点阵」两种（ResultTile 用 `src`、NodeCard 用 `cover`）；FileCard 废弃；播放器悬停立刻播、属性面板去掉比例；首尾帧外部换图会更新。Figma 里仿的分段 / 下拉要换实例、换成 Noto 的文字要改回苹方，清单在记录里。网站截图脚本在 scratchpad（临时）。
- 旧版（KIVI 3.5-3.14，fileKey `jF1VC4ldJtDK9ysA8h2K4c`）里库没有的：16 类通用零件（日历、级联子菜单、两行菜单项、搜索框、上传区、文件树、确认气泡、横幅、进度环、批量条、色块、尺寸输入、筛选胶囊、分步引导、画布缩放条 / 小地图 / 框选、正文排版）+ 约 12 个业务模板，配图在 `review-2026-10-30/旧版里库没有的.html`，还没排期。
- 空状态 IP 插图从 Figma 导出到 `assets/empty-state/`（4 张，画布失败态也用 failed.png）。
- `references/` 里已迁完可删的 md：components/ 全部、canvas/、agent/、pages/、foundations/（tokens、motion、icons）。还没删，等用户点头。
- 已加：占位图（`references/placeholder-images.md`，9 种风格 35 张，待迁到网站）。Figma「占位图」页已建统一入口 PlaceholderImage：先选 9 款图片之一，再选比例；组件描述标「待确认」。已改成实例拉满格子、画面跟着缩放；PlaceholderImage 是组件集，「填充」有铺满 / 模糊垫底两种；ResultTile 和「模板 · 主站」的生成记录已换上。其他业务组件里的旧占位图待替换。提示词存档在 `kivi-design-system-workspace/archive/placeholder-images/prompts.md`。
- 已加：动效。2026-10-29 用户口头定的规则：屏幕内移动 ease-in-out，出现 ease-out，消失 ease-in；时长按距离分 5 档。Figma「变量」页已加「17 动效」分区，变量在 scale 集合的 `motion/`，时长按数字命名（不用 xs、sm），作用范围全关，只为导出。
- 占位图页（10-30）：「基础 · 占位图」，组件 `PlaceholderImage`（`image` 9 款、`ratio`、`fill` 铺满 / 模糊垫底、`base` 图片目录）和 `placeholderImageSrc()`、`PLACEHOLDER_IMAGES`，在 `src/kivi/placeholder-image/`。旧 md 的用法、Figma 用法、补新图要求在 `page-notes/placeholder-images.md`。别的页面里手写的 `./placeholders/…` 还没换成它。`references/placeholder-images.md` 可删，等用户点头。
- SKILL.md 改成指向网站（10-30，照外部审查）：路由表全指 `site/src/docs/` 和 `src/kivi/`，不再写具体数值（网站为准）；浮层改成玻璃 / surface / popup 三种；原型改 React；加了「规范没覆盖时」三档（已定 = 违规、能组合 = 建议、没覆盖 = 未覆盖，不判对错）和「审查」（先说查了什么、清单、每条问题写位置 / 现状 / 依据 / 改法）。需求拆解不做（不是设计规范的事）。还没做：用真实任务（补页面、原型、审查）派子代理试一遍。
- 图标试用（10-30 试验，11-02 已删）：`src/docs/lab/` 和目录里「试验」一组都删了。
- 图标选型（10-30，进行中）：用户倾向 Hugeicons 免费版（圆角描边、超椭圆、6,000+，MIT，官方包 `@hugeicons/core-free-icons` 和官网是同一批；`@hugeicons/static` 协议禁止修改，不能用）。Figma 新页「_图标对照」（在最后，待用户拖到「不发布」组）：V1（前端 iconfont font_5024669，170 个）/ V2 / Hugeicons 三个一排，顶上有 24–20 的尺寸试样（第一轮，量出来约 21 和 V2 一样大）。10-31 第二轮：用户定 Hugeicons 缩到 22、线宽 1.6；每个图标的同族变体（-01、-02…）都渲染出来和 V2 并排挑过，用户在 Figma 里换的 11 个保留（卡上标「你换的」）；156 个能配上，28 个没有（比例 11、Logo 和品牌 8、视频剪辑 5、VolumeLevel、DisableSnap、OriginalProportions、CopyTraceID）。配对结果就是 Figma 卡片下面的名字。10-31 用户让按 Hugeicons 规矩补画：比例 11 个加 1:1 重画、AutoAspect、OriginalProportions、Divide、CropLeft、CropRight、VideoExtend、VideoEditing、VolumeLevel、CopyTraceID、Snap、DisableSnap，共 23 个，卡上标「自己画 · 待确认」（24 格、活动区 2–22、线宽 1.5、超椭圆圆角 R = 短边 × 0.42，比例图标长边 20、1:1 是 19）。模型厂 Logo（11 个）用户定一律沿用 V2：都是从 LobeHub Icons 下的厂商原始 Logo，对照页第三格换成 V2 实例；KIVI 自家 Logo、猕猴桃也沿用 V2。补模型厂 Logo 的规则（LobeHub 下 Mono 版、长边 18、放「模型 Logo」组）已写进图标页「模型厂 Logo」和 SKILL.md 审查清单；10-31 又按用户说的重下了一批 LobeHub Mono 版（Qwen 变新版），按外轮廓面积统一大小（同直径 19 的圆，实的再小，最长边 20），放在对照页模型 Logo 第三格待确认，「图标」页组件还没换；做法记在 `page-notes/icons.md`。10-31 第三轮：用户又换了 4 个（ImageGeneration、VideoGeneration、SmartEditing、Skill，已统一成 22 / 1.6）；节点类型图标定为去星：Text、ImageGeneration、VideoGeneration 用同一个超椭圆框（text-square、image-02、play-square），Audio 沿用 ai-speech 只去星不加框；星星只给有普通版和 AI 版要区分的（图标页那句已改）。生成中点阵的四个图形先不换，图标定好再说。小号（7 个 …Small）用同一个图标、图形缩 0.81、线宽不变，和 V2 小号一样大。DividingLine 沿用 V2 图形（描边重画、线宽 1.6）。10-31 对照页第三列列为 V3，网站加过右上角 V2 / V3 切换。**11-02 用户定不做 V3**：工具类产品超椭圆太多，显得不严肃，图标继续用 V2；网站的 V3 数据和切换已删，Figma「_图标对照」页还在（留作记录）。图标页的说法（星星那句、模型厂 Logo 第 2 步）先不动，后续再研究。**11-02 用户又想再比一下**：V3 恢复右上角切换预览；整套从 22 缩到 21（线宽 1.6，Logo 不缩）；自己画的 19 个按量出来的 Hugeicons 规格重画（方 19、横竖长边 20、圆 20，超椭圆角伸进边 = 短边一半，角标整条臂弯，改自某个 Hugeicons 图标的照原图标），记在 `page-notes/icons.md`。下一步打算按规则（少框、去装饰、隐喻直白）把不严肃的换成同族变体，还没做。
- Agent 工具（11-02 用户定，「业务组件 · Agent 工具」页）：改画布 UseCanvas、查看类（画布、节点信息、节点内容、链接内容）ScanEye、知识库 SquareLibrary、记忆 Brain（写入长期记忆，进工具组）、技能 Skill、飞书 Tool（不用飞书 Logo）；生成不出行按产出用图标，询问、保存技能、不显示各一种。数据只写一份在 `docs/business/agent-tools.ts`，Agent 页的工具演示也用它。ScanEye、SquareLibrary、Brain 已补进 Figma「图标」页（对话与反馈，Lucide 缩 22、线宽 1.5，转轮廓；描边源文件也补了）和「_图标对照」V3（Hugeicons 缩 21、线宽 1.6），网站图标 163 个。试验页和「试验」组已删。记录在 `page-notes/agent.md`。
- 页面模板（11-02 用户定）：目录最上面「页面模板」组两页，都是只能看的整页（16:9 框，里面自己滚，能全屏看；不生成、不调接口，生成中的一直停着）。主站：侧栏（Logo、导航、对话和画布历史）+ 生成记录（1:1、16:9 视频、3:4 有失败、9:16 生成中、16:9 生成中，夹一轮主站 Agent）+ 底部 PromptBox，点图全屏看；下面单独摆一条侧栏。画布：小画布（`MiniCanvas`，业务页的小画布也是它）+ 右侧 Agent 侧栏 420，点对话里的结果缩略图画布平移到节点并选中。原来的「画布 Agent」页并进画布页。Figma「模板 · 通用」网站还没有对应页。 主站侧栏收起成 60 宽的图标栏（11-02 用户定，3.14 只参考、照 V2 做：Logo、导航图标、封面、新建、更多；悬停 Logo 换成「展开侧栏」；300ms ease-in-out），`SidebarItem` / `SidebarLabel` / `SidebarMore` 加了 `collapsed`，Tooltip 加了 `placement`（右边给图标栏用）；Figma 这三个组件还没有「收起」。侧栏细节（11-02，先改网站、用户确认后改 Figma）：新建按钮去掉外面的 30%（不要套透明度）、左边图标都放在 36 的格子正中（导航左右 8、列表左右 6，标题、更多左 8）、分组标题悬停变白、「⋯」菜单重命名 / 置顶 / 删除、原地重命名（SidebarItem `editing`）、新图标 Rename（待确认）；无底下拉没选值时占位是白的入口名（Agent 工具条的模型、技能），记在 `page-notes/main-site.md`。11-02 又定：「⋯」菜单加回置顶（新版需求）；分组标题的箭头和新建悬停这一行才出现；以上侧栏改动 Figma 已跟改（三个组件加「收起」，SidebarItem 加「重命名中」，图标页加 Rename，模板加两张收起的侧栏），对话 / 画布能展开收起（往下推、淡入）、新建一条、「⋯」菜单（重命名、置顶、删除）。PromptBox 改玻璃、浮在记录上；Agent 模式工具条是模型 / 技能 / 手动自动；生成选项照线上代码改了（记录在 `page-notes/main-site.md`）。
- 待写：组件库维护（figma-kit.md）、旧名对照（legacy-names.md）迁到网站；图标打包子技能。
- Figma 和网站对齐清单：`kivi-design-system-workspace/page-notes/figma-sync-2026-10-29.md`；11-02 又扫了一遍，分「改 Figma / 改网站 / 要定的」记在 `figma-sync-2026-11-02.md`。还没定的：Dialog 全屏（网站 `full` 只定了宽 100vw）；网站有、Figma 只有模板示意的组合体（PromptBox、ReferenceStack、GenerateButton、NodeToolbar 等）要不要做成 Figma 组件，以后讨论；Figma 变量 `color/bg/fill/popup-raised` 网站没有，用到再补、用不到就删（10-29 用户：记待办）。
- 11-03 按 `figma-sync-2026-11-02.md` 同步了一轮：第一节（改 Figma）1–19、第二节（改网站）1–4 都做了；Figma 新做 ProcessGroup（1037:6384）、AskRecord（1037:6497），模板换成实例，「模板 · 主站」夹了一轮主站 Agent。用户定：画布 Agent 侧栏照线上默认 500（可拖 360–720）；主站记录流照即梦，轮间距 48、第一条离顶 104；侧栏收起按钮照 Figma 28；右上角积分头像数值照网站、背景改玻璃；生成面板全屏按钮照网站 32 / 12；FileCard 先不删；参数浮层 ParamPanel 宽固定 368（视频、音频、高级设置一样，两边都改了）；画布 Agent 输入框工具条：方块（Mdoel）是「模型偏好」（生图模型），Openai 是「切换对话模型」（GPT / Claude / 千问，内部测试用的隐藏功能）；ProcessGroup 展开列表渐隐改成遮罩、跟滑动方向走（`hooks/useScrollFade`，照线上 ToolCallSkill），Figma 同步了；Figma 第五节杂物已清。Tooltip 长文 1013:2478 的文字样式脚本挂不上，要在 Figma 手点「文字/14 常规」。第三节 6–13 还没定。
- 11-03 技能拆成子技能：SKILL.md 只管分任务和路由，原来的「原型」「没有设计稿时」挪到 `workflows/build-page.md`，「审查」并进新写的 `workflows/acceptance.md`（验收），「规范没覆盖时」的结论档改成和验收分级一致（不一致 / 建议）。用户还没看过验收那份。
- 生成结果组 `MediaGroup`（11-03，先做效果，放在「Agent 工具」页「生成结果」）：标题行 + 叠放 ↔ 两列瀑布流，封面取第一张成功的、叠放比例跟封面，展开收起只动 transform、缓动 ease-expand，展开 400 起每张 +10 最多 700、收起固定 300；叠层照 LibTV（右错 4 / 8、旋转 2° / 4°、两层都白 16% `container-light-1-pressed`）。11-03 用户定曲线不能有例外：参考区和这里自写的竖向缓动删了，不走弧线。还没换掉画布模板里的 MediaStack，Figma 没跟改，参数表没写。
- 11-03 Dialog 宽度按线上弹窗内容改成 400 / 560 / 800 / 1024 / 1200 / full（`size` 直接写数字，原 S / M / L / XL 停用，旧名对照有映射；full 铺满、圆角 0；遮罩离边 32），理由在 `page-notes/dialog.md`；Figma Dialog 的尺寸和内容区换 Slot 还没改。线上已定要改的记在 `kivi-design-system-workspace/acceptance/live-frontend.md`（验收待改清单），之后统一交前端。
- 11-03 P0 第一批（网站先做，Figma 都还没有，标待确认）：Popover（提示类，带箭头、popup 实色底，悬停 / 点击，在「菜单和提示」页）、ScrollArea（新页「滚动条」，照 Radix：原生滚动 + 自画滑块，滚动时出现、停 0.6 秒淡出、悬停 6→8、可拖、触底回调、渐隐）、Image（「反馈」页，加载中骨架 / 淡入 / 失败用 IP 插图 + 重试）、UploadTile + Dropzone + UploadRing（「输入控件」页，失败样式 outline / dim / badge 三种待定，记在 `page-notes/inputs.md`）、DropOverlay（主站 PromptBox 和画布 Agent 输入框拖文件「松手上传」，`hooks/useFileDrop`）。还没做：通知 Notification、IconButton `loading`、下拉打开时按钮保持按下、「文字」改名「无底」，等用户定。
- 发布时把网站编译打进 skill（双击能看需单文件打包，或 `npm run preview`），10-29 讨论，没定。

## 协作方式

- 用中文回复，先给结论，说话简短。
- 先回答再动手：消息里有问题就先回答、给方案，用户点头再改。新东西先列关键决定让用户拍板。
- 用户是 UI 设计师，有代码库权限不等于能改代码，前端改动要交给前端。
