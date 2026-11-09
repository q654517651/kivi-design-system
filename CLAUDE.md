# KIVI 设计规范

这个文件夹用来写 KIVI 设计规范 skill。规范来源是 Figma「KIVI UI KIT V2」（fileKey `bfXarGblevAYPh7a6nmXlt`），设计、产品、研发共用。

## 目标（11-03 用户定，必须达到）

- 覆盖 100% 线上前端功能所需的组件。
- 前端、网站、Figma 三边对齐。
- 变量和组件收敛，不能再有例外。
- 体验做到优秀：交互、状态都要完善，该有动效的地方要有动效。

## 版本和发布（11-05 用户定，必须照做）

- **分支**：`test` 只做开发，日常提交、推送都在 `test`，推了不发布。`main` 才是发布：发布时开合并请求把 `test` 合进 `main`。合进 `main` 后 GitHub Actions 自动发网站（`pages.yml`）、自动拆 `skill` 分支（`skill-branch.yml`，别人克隆它装技能，技能每次用前自己 `git pull`）。不往 `main` 直接提交。
- **版本号只写一处**：`kivi-design-system/site/package.json` 的 `version`，网站顶栏 `Layout.tsx` 从它读。别处不许写死版本号。
- **版本号怎么涨**（按前端要不要跟着改代码）：
  - 主版本 `X.0.0`：前端必须改代码：组件、属性、变量、图标改名或删除，默认值、行为改了。
  - 次版本 `x.Y.0`：只加东西：新组件、新类型 / 状态 / 尺寸、新变量、新图标、新模板页。
  - 修订号 `x.y.Z`：不加不删：修 bug、对齐 Figma 的小修、改文档文字。
  - 一版里有几种改动按最大的涨；正式上线前用 `0.x`（改名删除涨次版本即可），和新 kit 一起上线的那版定 `1.0.0`。
- **更新日志**：仓库根目录 `CHANGELOG.md`，README 里有入口。每改一件事就在「未发布」下记一行（新增 / 改动 / 改名和删除 / 修复），不等发布时补；改名删除写旧名 → 新名，并指向网站「旧名对照」。
- **发布步骤**（用户说「发布 x.y.z」时照做，发布前先和用户确认版本号）：改 `package.json` 版本号 → 「未发布」改成 `## [x.y.z] - 日期`、上面空出新的「未发布」→ 提交推 `test` → 开合并请求 `test` → `main` 并合入 → 在 `main` 上打标签 `vx.y.z`、发 GitHub Release（正文贴这一版日志）。
- `skill` 分支只有 `kivi-design-system/`，所以**维护者自己的东西（规则、待办、记录、审查材料）一律不放进 `kivi-design-system/`**，放 `kivi-design-system-workspace/` 或仓库根目录。
- skill 和新 kit 一起正式上线（定 `1.0.0`）；上线前图标仓库要做好。技能改成克隆 `skill` 分支装，不再打包 `.skill`（11-05 定）。

## 目录

- `kivi-design-system/`：skill 本体。SKILL.md 是入口，`assets/placeholders/` 放占位图。
- `kivi-design-system/workflows/`：子技能（11-03 起）。`build-page.md` 搭页面和原型，`acceptance.md` 验收（给 UI 设计师验开发稿：对照 Figma、前端代码、交互、需求，分「阻塞 / 不一致 / 体验 / 建议」出单文件 HTML 报告）；加图标子技能还没做。所有功能都在这一个技能包里，不放外部目录，用户只装一个包。
- `kivi-design-system/site/`：规范网站兼组件库，React 18 + TypeScript + Vite + MDX。规范的正文就写在这里。
  - 本地看：在 `site/` 下 `npm install`、`npm run dev`，打开 `http://localhost:4173/`（内网用本机内网地址 `:4173`）。
  - `src/kivi/`：组件库本体。`tokens.css` 是所有数值唯一的地方；`Icon.tsx` + `icons.ts` 是从 Figma 导出的图标；按组件类型分文件夹（11-04 重排：menu、navigation、inputs、selection、upload、tags-avatar、media、tooltip、generation、reference、agent-process 等；11-06 目录再理一轮时文件夹没动，一页可对几个文件夹，旧页到新页的对应见网站「旧名对照」的「页面改名」）：组件 `.tsx` + 这一类的 `.css` + `index.ts`。
  - `src/docs/`：规范页面（`.mdx`，规范文字）+ 旁边的 `.demos.tsx`（属性面板、状态矩阵），文件夹和目录分组跟 `src/kivi/` 一致。
  - `src/docs/templates/`：页面模板（整页怎么拼，只能看），对应 Figma 的「模板 · …」页，目录里放第二组、紧跟「开始」（11-04 用户定，原来放最上面）。外框 `frame.tsx`、布局 `templates.css`。业务页上面不再放整体演示。
  - `src/shell/`：网站自己的外壳（目录、演示、属性面板），不属于组件库。页面清单在 `src/shell/nav.ts`。全局搜索在 `src/shell/search/`，索引由 `scripts/search-index.mjs` 构建时从 nav.ts、MDX、`tokens.demos.tsx`、`icons.ts` 生成，新页进了 nav.ts 就自动能搜。
  - `assets/`（skill 根目录）是网站的静态目录，页面里用 `./placeholders/…`、`./empty-state/…`。
- `kivi-design-system/references/`：只剩 `figma-kit.md`（改 Figma 组件库时读）。旧的 md 规范 11-05 已全部删掉，别再往里加。
- `kivi-design-system-workspace/`：旧版备份（skill-snapshot-v0.1）、存档（纯 HTML 版网站在 `archive/site-html/`，别的对话做的演示在 `archive/demos/`）、测试结果，不进 skill。
- `kivi-design-system.skill`：旧的打包文件，不再用（技能改成克隆装），不进 git。

## 写规范的规矩

- **现在的样式都是定好的（11-04 用户强调，非常重要）：用户没说要改的，一律不动**，包括顺手「统一」「优化」、按规矩推出来的改动。拿不准就先问，不自己改，也不让子代理改。
- **设计规则只写进技能（11-04 用户强调）**：设计规范本身的硬规则（变量、底色、浮层、按钮、提示、状态、动效、图标、组件命名）只写在网站「设计规则」页 `kivi-design-system/site/src/docs/foundations/rules.mdx`，SKILL.md 和验收清单都指向它。用户说了新的设计规则，就写进那一页对应分节，再在对应组件页、组件里落地；不能只记在这个文件或记忆里。这个文件只记这个项目怎么干活。
- **业务组件无权改通用组件的规定（11-09 用户发火）**：业务组件只填自己的内容（图标、文字、选项、参数），不写死方向、间距、样式去盖通用组件的默认值；方向这类由用的地方传，业务组件透传。细则在网站「组件写法 · 业务组件」。
- **严禁脑补多余的尺寸、变体（11-04 用户发火）**：组件只做线上和模板里真用到的尺寸、类型，用户没要求的不加，「以后可能用」「凑一套」都不算理由。功能一样的不拆成两个组件（比如从别处添加和从电脑上传都是「添加素材」）。发现没人用的尺寸、重复的组件，先报给用户。
- 以 Figma 为准，Figma 里没定的不写。Figma 和 skill 的同步由用户负责。
- 先网站、后 Figma（11-04 用户定）：组件先在网站设计好，Figma 不追着改；要改 Figma 的记进 `kivi-design-system-workspace/page-notes/figma-sync-pending.md`，用户说同步时一批做。
- 不参考代码。前端代码是按 UI 发挥的，不是设计稿。代码库 `ai-design-web` 只读，不改、不提交。
- 网站是唯一来源，不再另写 md。skill 直接读 `src/docs/` 的 MDX 和 `src/kivi/` 的组件源码。
- 文件按页分，网站和 Figma 用同一套分页（11-04 用户定按组件类型重排；11-06 收成操作和导航 / 录入 / 展示 / 浮层和反馈 + 业务组件，Figma 要跟着重新分页）。哪一页改了，就改对应的文档页和 `src/kivi/` 里那一页的文件夹。
- 页面照 HeroUI 的写法（10-29 用户定，样板是 `src/docs/components/button.mdx`、`button.demos.tsx`）：
  - 组件页、业务页页头不写描述（11-04 用户定：「页面上所有能点的按钮」这种是废话）；每个组件一个 `##`，标题下一句只写两件事「中文名：用处」，比如「标签：展示参数和状态，比如模型名、比例、生成中。」不写废话、不写样子和数值、不写「XX 的外壳 / 里的一项」这种同义反复（11-04 用户定）。再放属性面板，所有尺寸、类型、状态都在面板里切；整屏 / 整块的演示放「页面模板」组，不放业务页上面（11-02 改）。
  - 额外示例只放面板演示不了的，小标题 + 演示，不写字。
  - 最下面 `## 参数`：每个组件一张「属性 / 类型 / 默认 / 说明」表，关键数值写进说明。
  - 除了组件标题下那一句，不写用途、结构、样子、用法，不放状态矩阵；待定、讨论、Figma 和线上的对比、为什么这么定，都不进页面，放 `kivi-design-system-workspace/page-notes/<页>.md`。
  - 属性面板里用不上的开关直接不显示（`rules` 返回 true）；代码超过 8 行默认收起。
  - 弹出类的属性面板（下拉、参数面板、选择器这类）：触发器放在台子下面、浮层往上弹（`top-start`），默认展开（11-06 用户定）。
  - 属性面板和预览双向同步（11-02 用户定）：组件自己能变的状态（展开、勾选、开关、选中、收藏、输入的字、选的项）写成受控，onChange 里用 `render` 的第二个参数 `update` 写回面板；面板上没有的状态（比如点了第几个选项卡）也记进 `update`。悬停、聚焦这种一碰就变的不写回，面板上的悬停、聚焦是摆静态样子用的。
- 样子、变量、组件以 Figma V2 为准；交互（点哪出什么、什么时候出）照线上产品。两边不一致的记进 `page-notes/`，不写进页面。
- 组件用 React（2026-10-29 用户定：前端是 React，纯 HTML 是「毛坯房」）。不引任何 UI 库、定位库、动画库，交互自己写进组件。组件名就是 Figma 组件名，props 英文、和 Figma 属性一一对应、带中文注释，设 `displayName`。样式用普通 CSS：类名 `kv-组件名`，修饰 `--`，部件 `__`，状态用 `disabled`、`aria-*`，没有对应的用 `data-*`，不用 `is-*`。
- 组件写法照 HeroUI、Radix 这类成熟组件库（10-29 用户定，不能做得垃圾）：细则在网站「组件写法」页（`src/docs/component-api.mdx`）：forwardRef、属性透传、受控三件套、事件合并，公用逻辑放 `src/kivi/hooks/`，组件里不再各写一份。改完在 `site/` 下跑 `npm run check`。和前端怎么协作（抄代码还是装包）还没定。
- 页面不写状态（11-04 用户定）：页头、正文、图标备注里不写「草稿」「待确认」「提议」「Figma 还没有」这类，改东西不用跟着改状态；全站只有顶栏一个总版本号（读 `package.json`，规则见「版本和发布」）。「废弃」是用法不是状态，保留。
- 规范文字写进 MDX，别用 JS 生成，AI 要能直接读。
- 演示要组件化：同一个东西在几页出现（比如生成用的下拉、参数面板），先抽成通用组件，再往里填内容，只写一份。生成控件在 `src/kivi/generation/`（11-04 从 docs 挪进组件库），画布和主站都用它（10-29 用户定）。
- 改名必须有映射表，只放网站「旧名对照」一页（`src/docs/legacy-names.mdx`，变量和组件都在这，11-04 用户定），不放各组件页；Figma 各页的「迁移映射」11-04 已删，只留一句话 + 网站链接，别再加回去。
- 写法：中文、短句；图片这类素材放 `assets/`；路径小写加连字符。
- 改 Figma 组件库本身时，先读 `references/figma-kit.md`。在 Figma 里画任何东西，画完都要过那一篇的「画完自检」（11-04 用户定：图标缩到 16 线宽还是 1.6 是禁忌）。

## 图标方案（11-05 改：暂用 Iconfont）

- 交付暂用阿里 Iconfont 新项目 KIVI_V2（projectId 5250779，字体名 `iconfont-v2`，类名前缀 `icon-kivi-v2-`），和线上旧项目 font_5024669 隔开。179 个已全部进项目（11-05，新传的要过 Iconfont 人工审核）。网站图标已改用它：CSS 地址和字体里的图标名只在 `site/src/kivi/iconfont.ts`，Iconfont 重新生成代码后改这里；Logo、Kiwi 还是 SVG。
- Figma 两套：「_源文件 · 图标描边」是 V3 描边（改图标改这里），「图标」页是转轮廓合并后的组件（用和导出都从这里）；V2 描边备份在「_备份 · V2 图标描边」，V2 轮廓不留。
- 导出：「图标」页所有单色图标拼临时大图 → download_assets 导一个 SVG → 本机拆开、用 skia-pathops 把 evenodd 合成非零环绕（字体只认这个）→ `kivi-design-system-workspace/iconfont/v3-svg/名字.svg`，`preview.html` 核对。Kiwi、Logo 彩色不传。
- 上传：`kivi-design-system-workspace/iconfont/upload.mjs`，用户自己在终端跑（AI 不能拿账号 cookie 登录，cookie 在钥匙串条目 `codex.iconfont.cn.cookie`，脚本自己读）。传过的记在 `upload-log.json` 不会重传；审核过了跑 `node upload.mjs --refresh` 重新生成代码。
- 以后可能再改成自建字体仓库（GitLab，原 10-29 方案），先不做。

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
- 菜单展开动效（淡入 + 从锚点那边 96% 放大、移 4）、宽 160–240（11-06 最窄从 120 改 160）、最高 8 项（324）滚动；参数面板（`NodeParamPanel`、`NodeParamField`、`NodeParamValue`）照 Figma「视频参数调整」做了。
- Slider 改成 Figma 参数面板里的刻度滑块（20 高灰轨道、8 × 20 白把手、`marks` 刻度），原来的绿色细滑块项目里不用了（10-29 用户说）。Figma「选择控件」页的 Slider 已改成刻度滑块（10-29）。
- 播放器 VideoPlayer（10-29，「通用组件 · 播放器」页，Figma「播放器」页已补，624:4626）：小号放卡片、大号放预览；节点 NodeMedia 视频、主站 ResultTile 视频都换成它，旧的 PlayBar 删了（旧名对照有映射）。按钮用 IconButton 浮层，平时无底；播放、暂停实心，音量描边（Figma 音量图标已改描边，名字不变）。演示视频在 `assets/placeholders/video/`。
- 组件库按「组件写法」整了一轮（10-29）：62 个组件都 forwardRef、属性透传、事件合并、受控用 useControllable；状态 `is-*` 改 `data-*`（文档摆静态的 is-hover / is-active / is-focus 例外）；部件类名改 `__`；颜色走变量，Figma 没变量的注释「Figma 没变量」。公用逻辑在 `src/kivi/hooks/`。`npm run check` 通过，浏览器 17 页无报错。改了的公开属性：ReferenceStack `onOpenChange` → `expanded` / `defaultExpanded` / `onExpandedChange`；VideoPlayer 加 `muted`、`volume` 两套和 `onPlay`、`onPause`；ParamPicker 加 `open` 一套。
- 变量改数字名（10-29）：间距、圆角、描边粗细 17 个改名，新加 `spacing/2`（待确认，给按钮条用）。Figma 变量、代码写法、「变量」页三张表（每行加了旧名）、迁移映射（最上面一张表，含前端用量和 tailwind 键）都改了；网页 `tokens.css` 和 466 行引用换完，「旧名对照」加了「变量」一节。前端 variable.less 还没改，按迁移映射留别名。
- 照外部审查修了一轮（10-29）：Button 加载中挡重复触发（含键盘）；ResultTile 失败态保留操作；VideoPlayer 加缓冲、加载失败、小号键盘可进；Dialog 锁背景滚动（`useScrollLock`）；浮层尺寸变化重新定位；Tabs 竖排上下键；参考卡片键盘预览；NumberInput 失焦按 min/max 夹住；纯图标按钮补 Tooltip。音频节点能真播放（`useAudioPlayer`，和视频互斥、波形可拖动跳转）。追问照 V2 每题翻页不变，补了没选不能提交、`disabled`、按钮文字可传、方向键，提交后留 ProcessRow「已询问」。动效页「最长 400ms」改成正式规则：成组展开 400 起每张 +10、最多 700（不算例外）。
- 按钮条 ButtonGroup（10-29，照用户稿）：条 32 = IconButton 28 + 四周 2，间距 4，on-media 底、不加描边（11-03 从玻璃 + 描边改）。网站在按钮页，NodeCard 收藏挪进右上条（`collect` / `collected`，`leftButton` 删了），ResultTile 右上、左下都换成按钮条；Figma 按钮页加了「ButtonGroup」分区。Figma 的 NodeCard、ResultTile 组件和模板还没换。
- Agent 统一（11-02 用户定）：主站 Agent 和画布侧栏 Agent 一套对话组件，只有产出不同（主站 4 张大图跟在回复下、点了全屏；画布结果在节点里，聊天里同步缩略图、点了定位节点）。不整体折叠，工具调用改成 `ProcessGroup` 一行滚动（停 0.5 秒才扫光、最少停 0.3 秒、做完「调用了 N 个工具」不自动展开、箭头悬停才出），记在 `page-notes/agent.md`。询问也做成能收起的 `AskRecord`（询问中 / 已询问 / 询问三种状态）。Figma 还没有 ProcessGroup、AskRecord。业务组件拆页（生成 / 对话 / 画布 / 主站 + 页面模板）还没定。
- Tooltip 加「长文」类型和「禁用」（11-02，用户定：不能搞特例，缺什么就给组件加类型和状态）：长文给被截断的长文字看全文，14 / 22、能换行、和触发元素一样宽（至少 240）、内边距 8 / 12；`disabled` 时不出现。GenPrompt 照线上改成复制按钮跟在最后一个字后面、自己量行数超两行收起，看全文用 Tooltip 长文。Figma Tooltip 加了「类型=长文」，文字是 Noto 14 / 22，要改回苹方并套「文字/14 常规」。
- 待拍板清单：`kivi-design-system-workspace/decisions-2026-10-29.md`。
- 目录重排（11-04，用户定）：通用组件分操作（按钮）、导航（菜单、导航）、录入（输入框、选择、日期、上传）、展示（标签和头像、图片和视频、正文排版、滚动条）、浮层（提示、弹窗）、反馈六组；业务组件分生成（PromptBox、参考区、附件条、MentionChip、参数面板、Lora）、画布、标注、Agent 对话、Agent 过程（工具调用、思考块、生成结果）、主站，资产待加。`src/kivi/` 文件夹跟着拆：menu、navigation、upload、tags-avatar、media、tooltip、generation、agent-process；组件名不变，页名映射在「旧名对照 · 页面改名」。Figma 还没跟着分页。
- 目录再理一轮（11-06，用户定，只挪不改样子）：通用组件四组：操作和导航（按钮、菜单、选项卡）/ 录入（输入框、选择、日期、上传）/ 展示（标签和头像、图片和视频、正文排版、布局）/ 浮层和反馈（提示、弹窗、消息、加载和空态）；业务组件：创作输入框、参数和模型、参考和引用、生成记录、画布、标注、Agent 对话、Agent 过程、资产。组名和页名、业务页和模板页不重名。滚动条并进布局；AssetThumb → 图片和视频，DropOverlay → 上传，SendButton → 按钮，MediaGroup → 生成记录。`src/kivi/` 文件夹没动（navigation、scroll-area、feedback、main-site 照旧，一页可以对几个文件夹），旧地址在 `nav.ts` 的 `REDIRECTS` 自动跳。映射在旧名对照「页面改名（11-06）」，Figma 待改记在 figma-sync-pending.md。
- Figma 模板页整理和重新分页（11-03、11-04）：「模板 · 画布」四个分区照样板排好（分组 + 小标题 + 示例标签，一行最多 3 个，组间距 120）；`_doc/section-bg` 改成 #2A2B2D；Figma 按网站新目录分页：新建菜单、导航、日期、上传、正文排版、滚动条、提示、生成、标注、Agent 过程、资产和三个模板页，改名输入框、选择、标签和头像、图片和视频、Agent 对话，分区照组件挪好，迁移映射写了页面来源，网站页头 Figma 链接已换。脚本挪不动带苹方的东西，挪过的都换成 Noto。还要用户手动：拖两页顺序、把 ProcessGroup 剪到「Agent 过程」、点头后删「菜单和提示」；「模板 · 主站 / Agent / 通用」还没整理，整页稿还没挪到「页面 · …」。记录在 `page-notes/figma-sync-2026-11-02.md` 末尾。
- 映射表收成一处（11-04，用户定）：网站「旧名对照」补全成唯一的表：变量 146 行（Figma 三张 53 行 + 11-03 + 新增 50 + 线上有、V2 不收 32）、图标、组件补了 56 行，按新页名分节；图标页里重复的那份删了；变量页补了 spring、两个阴影、完整 Figma 路径。Figma 各页的迁移映射已删，换成一句话 + 网页和 Git 链接；`popup-raised` 变量删了。tailwind 新键名和 safelist 是代写的，要前端确认。
- 11-04 用户定（别再忘）：Agent 回复下的推荐按钮用 Button 类型 = 轻（`light`）；生成中点阵整页同步：不传 `effect` 时整页共用一个方案、共用一个时钟（`useGenerating`、`player.ts`），同一排几张节奏一致；结果叠放只有 MediaGroup 一个，MediaStack 删了，画布模板改用 MediaGroup（点开、点图定位节点）。
- 组件收敛（11-04，用户定，盘点在 `page-notes/component-convergence-2026-11-04.md`）：侧栏三件并进 Menu（`variant="plain"`，MenuItem 加 collapsed / editing / more，MenuLabel 加 collapsible / action / items）；ProcessDrawer 改名 Collapse 放通用；四条分割线合成 Divider；NodeToolbar 改成 ButtonGroup glass `size={44}`，CanvasToolbar 改成 ButtonGroup `variant="surface" size={56}`（实色，用户定不改玻璃）；左侧栏「更多」悬停没底色、文字变亮；样片模式从组件库删了；ParamValue → NumberInput；ToolbarSwitch → Switch 带文字；添加格合成 AddTile；NodePanelRefs → AttachmentStrip；拖入高亮和叠层各统一一份。Tooltip 只写工具名（加快捷键），带说明和长文的用 Popover（`variant="long"`）。SendButton、ResultTile / NodeCard 不合。映射都在旧名对照「组件合并（11-04）」。Figma 都没跟。
- 新旧组件总表（11-04）：`kivi-design-system-workspace/page-notes/component-inventory.md`，线上功能分「舍弃 / 转换 / 新做」，用户定过的结论都记这里，补组件、算覆盖、派活都以它为准，改了结论就改它。
- 外部审查逐条过完并改了（10-30）：记录在 `kivi-design-system-workspace/review-2026-10-30.md`，对比图、改后对比、旧版里库没有的配图都在同名文件夹（发用户的是内嵌图片的单文件 html）。定的：参数面板、音频参数、工具条顺序（类型 → 模型 → 参考类型 → 参数）、画布参考类型在底部、MenuItem 禁用、音量浮层都以网站为准，Figma 已跟改；参考浮层一行 5 个、视频音频带时长；生成中分「没素材无遮罩」和「有原素材 + 遮罩 + 模糊 + 点阵」两种（ResultTile 用 `src`、NodeCard 用 `cover`）；FileCard 废弃；播放器悬停立刻播、属性面板去掉比例；首尾帧外部换图会更新。Figma 里仿的分段 / 下拉要换实例、换成 Noto 的文字要改回苹方，清单在记录里。网站截图脚本在 scratchpad（临时）。
- 旧版（KIVI 3.5-3.14，fileKey `jF1VC4ldJtDK9ysA8h2K4c`）里库没有的：16 类通用零件（日历、级联子菜单、两行菜单项、搜索框、上传区、文件树、确认气泡、横幅、进度环、批量条、色块、尺寸输入、筛选胶囊、分步引导、画布缩放条 / 小地图 / 框选、正文排版）+ 约 12 个业务模板，配图在 `review-2026-10-30/旧版里库没有的.html`，还没排期。
- 空状态 IP 插图从 Figma 导出到 `assets/empty-state/`（4 张，画布失败态也用 failed.png）。
- `references/` 里已迁完的 md 11-05 用户点头后删了（components、canvas、agent、pages、foundations、legacy-names、placeholder-images、prototype），只留 figma-kit.md。
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
- 11-03 P0 第一批（网站先做，Figma 都还没有，标待确认）：Popover（提示类，带箭头、popup 实色底，悬停 / 点击，在「菜单和提示」页）、ScrollArea（新页「滚动条」，照 Radix：原生滚动 + 自画滑块，滚动时出现、停 0.6 秒淡出、悬停 6→8、可拖、触底回调、渐隐）、Image（「反馈」页，加载中骨架 / 淡入 / 失败用 IP 插图 + 重试）、UploadTile + Dropzone + UploadRing（「输入控件」页，失败样式 outline / dim / badge 三种待定，记在 `page-notes/inputs.md`）、DropOverlay（主站 PromptBox 和画布 Agent 输入框拖文件「松手上传」，`hooks/useFileDrop`）。通知 Notification 已做（「反馈」页）。还没做：IconButton `loading`、下拉打开时按钮保持按下、「文字」改名「无底」，等用户定。
- 11-03 P1 选择类（网站先做，Figma 都还没有，标待确认；讨论和用户定的在 `page-notes/selection-p1.md`，线上现状复刻 `selection-p1-live-2026-11-03.html`）：用户定选项卡片格、工具箱控件、模型卡和模型浮层、提示词助手都不做（模型选择废弃，工具箱以后映射到已有组件），视频高清面板、裁剪栏、技能面板、资产页做模板。已做：新页「日期」DateRangeFilter + Calendar（照旧版 14637:17589 和线上：浮层玻璃，日历是浮在日期框下面的第二层；11-04 从「在面板里换掉预设」改回来，触发器去掉尺寸）；Input 加 `clearable`（搜索框）；NumberInput 加 `precision`；新页「业务组件 · Lora」LoraField / LoraSettings / LoraCard / LoraPicker，Popover 加 `variant="panel"`（玻璃、无箭头）。两行菜单：MenuItem 加 `description`（图标 24，11-09 改 20；两行选中打勾、单行用底色，11-03 用户定），Select 选项加 `description` 和 `preview`（音色试听）；生成模式、模型偏好、音色已换上。菜单项图标 16 / 20 / 24 列为低优先级、以后讨论（11-03 用户定）。11-04：模型偏好 `GenModelPicker`、技能面板 `SkillPicker`（docs/business，主站和画布 Agent 共用，旧的 GenModelSelect、SkillSelect 删了）；新模板「技能面板」「画布工具」（工具面板、裁剪 / 扩图条、视频封装弹窗），「资产管理」只有顶栏（收藏筛选勾选框 / 胶囊两种，等用户挑）；资产组件：11-04 做了 CoverGrid、FolderCard、ProjectCard、CreateCard（`kivi/asset/`，「业务组件 · 资产」页，按建议先做：分开做、新建卡统一实线、空文件夹用 Folder 图标、「⋯」悬停才出）；AssetCard（和 ResultTile 合不合待定）、BatchBar 还没做。资产管理模板照用户交互原型（本机 kivi-prototype 的 assets-home，记录在 `page-notes/asset.md`）做了总览：我的素材（文件夹）/ 我的画布 / 生成历史（按天分组，来源、类型、收藏胶囊、搜索筛选），FolderCard 数量照线上「名字 (数量)」，日期分组不带作品数；历史格先用 ResultTile。差别记在 `page-notes/skill-panel.md`、`canvas-tools.md`，总表 `page-notes/component-inventory.md`。
- 11-04 缺口对话补了 6 项（网站，Figma 没跟，明细在总表「已做」）：思考块 `ThinkingBlock`、`UserMessage` 超 12 行折叠、`MessageFeedback`（含点踩原因）、`AttachmentStrip` + `PreviewCard`（ReferenceItem 加视频 / 文件）、`Minimap` + 缩放条（`ButtonGroup variant="glass"`）、新页「标注」（`AnnotationBox`、`AnnotationMarker`、`AnnotationComment`，`MentionChip type="annotation"`）。公用复制逻辑进 `hooks/useCopy`；IconButton 轻选中不换色。
- 归类和命名统一（11-04，照两份外部审查，用户定）：网站新加「基础 · 设计规则」页（`docs/foundations/rules.mdx`，所有设计硬规则只写这里，SKILL.md、验收清单指向它）和「展示 · 布局」页（Divider、Collapse）；生成控件（各种 Select、参数面板、GenModelPicker、SkillPanel / SkillPicker）挪进 `src/kivi/generation/`，选项在 `options.ts`，演示技能列表在 `docs/business/skill-data.ts`；属性统一 `variant` / `type` / `status`、尺寸写数字（Button 28/32/36、Tabs 32/36、Loading 16/24/40、EmptyState 160/96、VideoPlayer 改 `variant="card" | "preview"`），映射在旧名对照「属性统一（11-04）」；页头和正文的状态全删，顶栏只留 `v0.1.0`；画布、标注、Agent 过程页小标题改组件名，节点工具栏、画布工具栏挪到模板「画布工具」。四条全局规则已落地：技能没有不能点的状态、IconButton 选中一档白底不变绿、占位按钮用轻、按钮下拉箭头 tertiary。Figma 都没跟（记在 figma-sync-pending.md）。
- Container 底色对比度（11-04，用户定）：相邻两层对比度不低于 1.12；深浅按背景相对亮度分，< 0.015 深底用 Light 1，≥ 0.015 浅底用 Light 2，写在「设计规则 · 颜色和底色」；全站按这个改完，重跑盘点 316 处全合规。容器给里面的组件传 `--kv-nested-fill`。盘点和改动在 `page-notes/container-contrast-2026-11-04.md`。 后来又定：只有 Light 1 / Light 2 两档，默认、hover、pressed 各管各的，不跨语义借用、不在背景上叠色；常驻底色（选中、展开、当前页）用默认，悬停一律 hover；玻璃改 #181818 50%，Container 每档加 2%（Light 1 10/14/18，Light 2 6/10/14），重跑 344 处全合规。
- 参考和引用单开一页（11-04，用户定）：「业务组件 · 参考和引用」（`docs/business/reference.mdx`，代码 `kivi/reference/`），放主站 PromptBox 的参考区和参考格、画布生成面板的附件条和首尾帧、所有 @ 引用胶囊（MentionChip，标注页那份也挪来）、悬停预览。纯搬家，样式没改（搬前搬后 177 个元素逐个比过）。三家共用的删除角标规则还在 generation.css。 之后又定：MentionChip 加了 7 种类型的属性面板，图标类（音乐、技能、节点、模型）直接放 16 白色图标；ReferenceItem 加了属性面板，音频和文件一个样子（图标占位底），文件按扩展名换图标（新加 8 个 Hugeicons 文件图标）；附件条只留 56、间距 4；缩略图删除改回右上 18 的小圆。 11-04 又定：UploadTile 并进 AddTile（添加素材从素材库还是电脑都是它），AddTile 去掉 `size` 只留 56，格子自己的拖入不要；角标和删除、悬停浮层换一个时不交叉淡化（旧的立刻没、新的直接出）。 Dropzone 删了，拖文件只用 DropOverlay，照 Claude 桌面端改：框加 border-strong 描边、不铺底不模糊，正中 popup 小卡、三个图标（新加 Image、Files，Hugeicons）弹簧展开、中间上浮。 拖入提示加 mask 遮罩、图标和字用品牌绿；规则页品牌色改成「省着用，不大面积铺底」+ 举例。PromptBox 宽度照即梦：最宽 1040，最窄是工具条一行排开的宽度（不折行、控件不压缩）。 图标定用 V3（11-04 用户定）：网站默认 V3，去掉 V2 / V3 切换（V2 数据 icons.ts 留着），顶栏右上角加「Hugeicons 图标库」链接；「图标」页规格和「设计规则 · 图标」改成 Hugeicons 缩 21、线宽 1.6，补图标从 Hugeicons 找。 图标改用蒙版渲染（Icon.tsx 生成 `--kv-icon-mask`，底色 currentColor），颜色带透明度时线段交叠处不再叠色；V3 的 Tool 换成 Hugeicons wrench-01。
- 多画布（11-04，飞书「P1 工作区内支持多个画布」，用户点头照方案做）：新组件 `CanvasHeader`（`kivi/canvas`，「画布」页 + 画布模板左上角）：玻璃按钮条 44 Logo｜工作区｜画布名 ⌄，下拉列表当前项选中底色不打勾、7.5 条滚动、「⋯」在新窗口打开 / 重命名 / 复制 / 删除，删除和 Agent 工作中切换都弹 Dialog 400，上限 30 出 Toast。顺手：Dropdown 支持套着的弹出层；弹出菜单里 MenuLabel 按钮一直显示；Icon 名字不存在时画空的不崩；新图标 NewWindow。记录在 `page-notes/multi-canvas.md`，Figma 没跟。
- 文字放不下（11-05，用户定「截断比超过去强」）：Button、TabItem 文字包一层 `__label`，放不下末尾省略号、内边距不让，截断了悬停出 Tooltip 看全文（`hooks/useTruncated`）；分段从 flex 平分改成网格等分（原来条宽是各项文字宽相加再平分，最长那项一定放不下）；画布切换的画布名最宽 160。规则写在「设计规则 · 状态」。网站「开始」组加了「安装技能」页（选系统、工具，复制一段话发给 AI 装）。
- 网站外壳悬浮（11-05，用户定）：全站导航悬浮玻璃（离边 12、圆角 16），Logo 和版本号在导航顶上；顶栏只剩右上角三个玻璃胶囊，内容滑过顶部出模糊带；首页特效铺满窗口。样式在 `src/shell/shell.css`，变量 `--shell-nav-space`。
- 网站全局搜索（11-04，用户要的，不改现有样式）：顶栏「搜索 ⌘K」（也认 Ctrl K、`/`），弹窗用 Dialog 560 + Input + Button 轻。能搜页面、标题、正文、表格行（参数表、旧名对照）、变量、图标；模糊（缩写 pb → PromptBox、隔字 生面 → 生成面板、拼错 Mdoel / buton、空格横线大小写不分）、多个词是「且」。排序：匹配分 + 类型加分（页面 > 二级标题 > 三级标题 > 图标 > 变量 > 表格行 = 正文），最近打开的加分，旧名对照的行扣分。建议三种：没输入时是「最近打开」+ 全部页面；输入时顶上一排补全（Tab 接受第一个）；一条都没有时「你是不是想搜」。点中后切页，滚到对应的标题 / 段落 / 表格行 / 变量 / 图标，闪一下品牌浅底（`[data-search-hit]`，1.6 秒，减少动态效果时不闪）。新样式只在 `src/shell/search/search.css`（新类名、只用 tokens），没改任何已有的类；`.shell-top` 原样没动，手机宽（≤560）不放入口，免得挤掉 Figma 按钮。开发时改了文档要刷新页面索引才更新。新依赖（devDependencies，原来就在 node_modules 里）：unified、remark-parse、remark-mdx、mdast-util-to-string、github-slugger。没做：拼音搜索。
- 自洽审查（11-04）：8 个 Sonnet 分维度查 + 4 个复核，又吸纳了 GPT 那份（`outputs/consistency-audit-2026-11-04/`，新增 25 条复核过）。报告 `kivi-design-system-workspace/review-2026-11-04/report.html`（原始报告和复核在 `raw/`）。用户让先修「bug 和明显写错的」，已修 65 条（报告里标「已修」）：Logo 绿星（Icon 带固定颜色的照旧直接画 SVG）、网站外壳加错误边界、日历翻月、Tabs 方向键、Dropdown 面板类放行 Tab（`haspopup="dialog"`）、Tooltip / MessageFeedback / ReferenceStack 的 Esc 不连弹窗一起关、弹窗焦点陷阱放过挂在 body 上的浮层、禁用 Select、音高负号、首尾帧旧回调、GenPrompt 复制和空提示词、UserMessage 换行、ScrollArea 续载、主站模板改用 MessageFeedback，以及一批参数表、旧百分比、SKILL.md 路由表。追问单选和「其他」互斥是兜底做法（线上没有可照抄的）。没修：画布页里另一个对话在改的（History 空位、CanvasHeader 三条、C-2 / C-3 / C-4），和报告「要你定」的十几组，等用户看。
- 变量收敛（11-05，用户定）：`--color-border-focus` 删了（组件不加聚焦描边，`base.css` 关掉浏览器默认聚焦框，和前端一致）；`--effect-shadow-stack` 删了（叠放用白底加旋转）；背景模糊只有两档、不许例外：32 `--effect-glass-blur` 给玻璃和 on-media，16 `--effect-mask-blur` 给生成中、占位图遮罩，底不透明的不加，`npm run check` 会拦写死的模糊。行高只给多行文字、单行不设（组件库默认 1.4 = Figma 苹方自动行高，单行的 75 处已删）。规则在「设计规则」页，Figma 待改已记。填充色阶（11-05 用户定）：`--color-fill-1~4`（白 6 / 10 / 14 / 18），Container 六个变量改成引用它、名字值不变；`fill-n` 只给 Container 语义不符的静态色块（名单在设计规则：叠层、小地图节点、骨架屏扫光），检查脚本拦名单以外的；开关轨道、文字头像、试听播放中改回 Container 默认。变量只留两层（填充色阶 → 语义变量），不要原始色层（只有深色一套用不上，以后做亮色再加），Figma 隐藏的原始色集合下次同步删。禁用的底和平时一样、只变字色；填充对比度 1.12 不管禁用和遮罩。IconButton 自带提示（label，`tooltip={false}` 关），通用符号不配，名单在设计规则「提示」。SendButton 纳入按钮体系（IconButton 主要 · 36 · `round`，圆形只给规则名单里的专用按钮）。生成失败态统一 EmptyState 生成失败 · 96，可配 `failedTitle` / `failedDescription`。待办（11-05 用户定，都是新增、先不做）：画布生成按钮「10 秒内可停止」、节点和结果格的停止、节点工具栏补框选 / 编辑文字和调顺序、停止图标，细节记在总表 `page-notes/component-inventory.md`「待做」。收藏了的星图标品牌绿（IconButton `data-collected`，设计规则里写成唯一例外）；连线删除改玻璃；音频字数超上限变红（11-05 用户定）；细滑杆暂定给剪辑时间线缩放，记待做。画布底部工具栏「添加」改 IconButton 主要（品牌绿，`__solid` 类删了）；Wan 用 Qwen Logo；Checkbox / Skeleton `shape` → `variant`、Popover `trigger` → `on`；生成结果组不补更多状态、模型面板不做加载 / 失败 / 空态（有缓存）。审查报告 11-05 第二轮又修了 72 条（四个 Sonnet 分组），只剩 6 条：行高 T-11、生成确认卡 L-21 等用户定，L-17 / L-18 待办，侧栏读屏 GPT-PR-09 等前端，C-23 还缺两个属性面板。字号必须对齐变量（11-05 用户定）：两处 9 号字改 10，上传进度环为放下「100%」从 28 放大到 36，`npm run check` 拦写死字号（Markdown 正文 prose 例外）。L-21 用户定按钮不换（确认卡消耗不消耗都有，写在说明里）。T-11 用户定多行行高按表：7 处 14/20 → 14/22、12/16 → 12/20。PromptInput 照线上默认 4 行、最多 6 行（行高乘行数，88 / 132），生成面板和 Agent 输入框一样；粘贴、拖入只取纯文字（不许带进字号颜色），占位文字浮在框上（光标在最前）。L-21 提交中状态也不要。节点工具栏照线上补了框选（DragSelect = Hugeicons select-02，用户挑的）、编辑文字（TextEditing = text-creation），封装挪到剪辑前，图推词 / 视频推词。MediaGroup、AnnotationBox 补了属性面板。审查只剩 L-17（待做）和 GPT-PR-09（读屏）。审查报告剩下的 181 条都分了 P0 / P1 / P2、写了问题和处理（`cur.json` 的 triage），15 条等用户定，其余按已定规矩由我定。
- Textarea 框内按钮（11-05，用户定）：`actions` 放在框里右下角，按钮 28，字数在按钮左边；点踩原因（MessageFeedback）改成 Textarea + 框内「提交」，去掉关闭（Esc、再点踩收起）。起因是 3.14 记忆管理稿（补齐的状态在 Figma 498:6079，记录在 `page-notes/memory-manager.md`）。Figma Textarea 还没跟。
- 裁剪框 CropHandles 能拖了（11-05，用户定）：拖动做进组件（`value` / `ratio` / `bounds` / `contain` 等），四角四边拉伸、Shift 锁比例、Option 从中心拉、裁剪框里按住挪和方向键、Enter 确定 Esc 取消，拖的时候出九宫格，裁剪、扩图都不出尺寸标签（用户说不要）。手柄边条 120 × 6 → 24 × 4，边短于 64 不画。吸附、换比例过渡、扩图挪原图放后面。Figma 没跟（记在 figma-sync-pending.md）。
- AI 工具页演示（11-06）：新模板「AI 工具」（`docs/templates/ai-tools.demos.tsx`），左工具列（不分图片视频）、中间舞台直接扩图 / 涂抹、右历史，参数面板和画布工具面板同一套；生成是假的。多模态编辑 11-06 用户定没有了、以后也不做（演示已删，总表「舍弃」已记）。都待用户确认，记录在 `page-notes/ai-tools.md`。
- 列表 List / ListItem（11-06，用户要的，起因是 3.14 记忆管理稿和豆包「管理记忆」）：MenuItem 是菜单语义，不拿来当列表、也不改名；新组件在 `kivi/list/`、「展示 · 布局」页。线框输入框（Input 加 outline）讨论过，先不做。Figma 没有通用 Divider（只有带留白的 MenuDivider），补 Divider、List 记在 figma-sync-pending.md。等用户看效果。
- Figma 同步（11-06 统计，11-09 做完大头）：变量、图标、已有组件、约 45 个新组件、分页（消息 / 加载和空态 / 创作输入框 / 参考和引用 / 参数和模型 / 生成记录 / 选项卡 / 布局）、模板换新组件和组合件都做了；Figma 页面画布底色统一黑色 #000000（11-09 用户定）。剩下的小项和手动项在 `page-notes/figma-sync-pending.md`「11-09 收尾，还剩」，通用简报 `page-notes/figma-sync-brief.md`。
- Select 拆成触发器（11-09，用户定，照 Figma：Select 本来就只画触发器）：选一个值用 `Dropdown haspopup="listbox"` + Select + Menu + MenuItem 拼；模型、技能、日期筛选、参数选择的触发器都换成无底 Select（原来借文字按钮，图标 20、字加粗，和旁边的下拉不一样大）；Select 加 `endIcon`（视频参数后面的音量）。`npm run check` 拦手抄别的组件的类名。还没换的两处借用（注释了「借用类名」）：SendButton（缺停止图标）、播放器音量浮层（Popover 不能挂进全屏元素），等用户定。
- 发布时把网站编译打进 skill（双击能看需单文件打包，或 `npm run preview`），10-29 讨论，没定。

## 协作方式

- 用中文回复，先给结论，说话简短。
- 先回答再动手：消息里有问题就先回答、给方案，用户点头再改。新东西先列关键决定让用户拍板。
- 用户是 UI 设计师，有代码库权限不等于能改代码，前端改动要交给前端。
- 子代理只照方案做，不许自己改定好的样子和规矩（11-04 用户发火：子代理把画布底部工具栏从实色改成玻璃、去掉开关内边距）。派活时写明「样子不能变；和规矩冲突就停下汇报，别自己改」，收到汇报里的「样子有变化」要先问用户，不能直接当做完。
- 派子代理按活选模型（11-03 用户定，别浪费）。派的时候用 `model` 参数写明，不写就会继承 Opus：
  - 只读的活（读线上代码、读 Figma、查文件、浏览器逐页核对）：Haiku 5.5（`haiku`）。
  - 已经定好、照着做的执行（照方案写组件、批量改、照清单改 Figma）：Sonnet 5.5（`sonnet`）。
  - 真正难的（要拿主意的设计、交互和动效算法、说不清交接的）：自己做，实在要派才用 Opus。
  - 开子对话也一样：只读的、照着做的用便宜的模型。
