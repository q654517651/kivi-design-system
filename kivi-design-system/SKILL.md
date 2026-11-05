---
name: kivi-design-system
description: KIVI 产品界面（AI 无限画布 Web 端）的设计规范和 React 组件库：变量、动效、图标、占位图、通用组件、画布、Agent、主站。凡是做 KIVI 产品里的界面都先用它——写前端页面或组件、没有设计稿要临时补一个页面、产品做可点击原型、后端做内部页面、UI 设计师验收开发稿（对照 Figma、前端代码、交互、状态、动效）、审查设计稿或已开发页面是否合规、拿不准该用哪个颜色/字号/圆角/动效/图标/组件时——即使用户没提「规范」也要用。编辑 Figma 组件库本身（加组件、改变体、改名、整理页面）时也用它。不用于活动 H5、Banner、品牌和 IP 运营视觉，也不用于节点数据结构、Agent 工具调用这类逻辑。
---

# KIVI 设计规范

来自 Figma「KIVI UI KIT V2」，设计、产品、研发共用。以 Figma 为准，Figma 里没定的不写。

## 先更新

每次开始用这个技能，先在本文件所在目录跑 `git pull --ff-only`，拉到更新就重新读一遍本文件再干活。

- 没网、拉不下来（比如本地改过）：跳过，跟用户说一句「规范没能更新，用的是本地版本」，照常干活。
- 不是 git 仓库（技能是复制过来的，没法自动更新）：照常干活，干完跟用户说一句「这份技能是复制装的，没法自动更新，要改成能更新的装法吗」。用户同意后，删掉本文件所在的文件夹，在原位置重新装：

  ```bash
  git clone -b skill --single-branch https://github.com/q654517651/kivi-design-system.git <本文件所在文件夹的完整路径>
  ```

  `skill` 分支只有技能本身，仓库是公开的，不用登录。

## 规范在哪

规范只有一份，就是 `site/` 里的网站。这个文件只管「先读哪页、怎么做」，不写具体数值。

- **规范文字**：`site/src/docs/**/*.mdx`。每页最下面「参数」表有组件的属性和关键数值。
- **组件**：`site/src/kivi/<页>/`，`.tsx` 看属性，`.css` 看实际尺寸和用了哪些变量。
- **数值**：只在 `site/src/kivi/tokens.css`。要哪个值，查这里的变量名。
- 本文件和网站对不上时，以网站为准。
- 想看效果：在 `site/` 下 `npm install`、`npm run dev`，打开 `http://localhost:4173/`。

## 先分清是哪种任务

一个技能包里有几个子技能，按任务挑一个读。子技能都在本文件所在目录下的 `workflows/`。

| 任务 | 读哪个 |
|---|---|
| 写前端代码（任何栈） | 先读「设计规则」页。样式只用 `tokens.css` 的变量。网站里有的组件，照它的属性、尺寸、状态实现；React 项目可以直接用 `src/kivi/` 的组件。再看下面「路由」 |
| 可点击原型、没有设计稿要补页面 | `workflows/build-page.md` |
| 验收开发稿，审查设计稿或代码是否合规 | `workflows/acceptance.md` |
| 查组件、变量、动效、图标 | 「设计规则」页和下面「路由」，再读网站对应页 |
| 在 Figma 里搭 | 用已发布的「KIVI UI KIT V2」库组件，颜色、间距、圆角、字号都绑变量。用户作品的位置放 PlaceholderImage 实例：先选图片，再选比例 |
| 编辑 Figma 组件库本身 | `references/figma-kit.md`。只有加组件、改变体、改名、整理页面时才读 |
| 加图标、打包图标字体 | 还没做（Figma 导出 → 打包字体 → 提交 GitLab 图标仓库）。先照「图标」页手动补，跟用户说一句 |

## 核心规则

规则只有一份：网站「设计规则」页 `site/src/docs/foundations/rules.mdx`。**任何任务开始前先读完它**，写代码、搭页面、验收都照它判断；它和别的页对不上时，以它为准。

用户在对话里定了新的设计规则（不是这个项目怎么干活的约定），写进这一页对应的分节，不要只记在别处。

## 规范没覆盖时

先判断这件事属于哪一档，再决定怎么做、怎么下结论：

| 档 | 是什么 | 做的时候 | 验收的时候 |
|---|---|---|---|
| 已定 | 网站上写明了：变量、组件属性、参数表数值、「设计规则」页 | 照做 | 不符合就是**不一致** |
| 能组合 | 没有现成组件，但能用现有组件和变量拼出来 | 用现有组件拼，交付时说明怎么拼的 | 写成**建议**，不算不一致 |
| 没覆盖 | 网站上没有依据（比如整页布局、新的业务模块） | 按最像的现有页面给方案，标「规范未覆盖，待设计确认」 | 写成**建议**，标「规范未覆盖」，不判对错 |

- 不要把自己的审美偏好当规范。说不出依据在网站哪一页，就不是「已定」。

## 搭页面、验收

- 原型和没有设计稿时怎么搭：`workflows/build-page.md`。
- 验收和审查（材料、清单、分级、报告）：`workflows/acceptance.md`。
- `site/` 下的 `npm run check` 只查组件库 `src/kivi/` 的写法和写死颜色，不能代替验收。

## 路由

按网站目录的分组。下面的路径都相对 `site/src/`。

| 页 | 规范 | 组件 | 什么时候读 |
|---|---|---|---|
| 页面模板 | `docs/templates/main-site.mdx`、`canvas.mdx`、`canvas-tools.mdx`、`skills.mdx`、`assets.mdx` | `docs/templates/*.demos.tsx` | 一整页怎么拼：主站生成页（侧栏、生成记录、主站 Agent、输入框）、画布 + Agent 侧栏、画布工具（节点工具栏、工具面板、裁剪扩图、视频封装、画布底部工具栏）、技能面板、资产管理 |
| 设计规则 | `docs/foundations/rules.mdx` | — | 每个任务都先读：所有硬规则（变量、底色、浮层、按钮、提示、状态、动效、图标、组件命名） |
| 变量 | `docs/foundations/tokens.mdx` | `kivi/tokens.css` | 要变量名、取值，或核对某个值该用哪个变量 |
| 动效 | `docs/foundations/motion.mdx`、`motion-generating.mdx` | `kivi/generating/` | 做任何过渡和动画；生成中的点阵动效 |
| 图标 | `docs/foundations/icons.mdx` | `kivi/Icon.tsx`、`kivi/icons-v3.ts`（默认用的 V3 数据）、`kivi/icons.ts`（V2 数据和新补的图标） | 选图标、确认图标名、补模型厂 Logo |
| 占位图 | `docs/foundations/placeholder-images.mdx` | `kivi/placeholder-image/` | 用户作品的位置要放图 |
| 按钮 | `docs/components/button.mdx` | `kivi/button/` | Button、IconButton、ButtonGroup |
| 菜单 | `docs/components/menu.mdx` | `kivi/menu/` | 菜单、下拉、右键菜单 |
| 导航 | `docs/components/navigation.mdx` | `kivi/navigation/` | 选项卡、分段 |
| 输入框 | `docs/components/inputs.mdx` | `kivi/inputs/` | 输入框、数字输入、多行输入 |
| 选择 | `docs/components/selection.mdx` | `kivi/selection/` | 下拉选择、开关、滑块、勾选框 |
| 日期 | `docs/components/date.mdx` | `kivi/date/` | 日期范围筛选、日历 |
| 上传 | `docs/components/upload.mdx` | `kivi/upload/` | 添加素材格（AddTile）、上传进度环（UploadRing）；拖文件进输入框用 DropOverlay（`kivi/generation/`），见「生成」页 |
| 标签和头像 | `docs/components/tags-avatar.mdx` | `kivi/tags-avatar/` | 标签、头像、素材缩略图 |
| 正文排版 | `docs/components/prose.mdx` | `kivi/prose/` | 正文、代码块 |
| 滚动条 | `docs/components/scroll-area.mdx` | `kivi/scroll-area/` | 自画滚动条、滚动渐隐、触底回调 |
| 布局 | `docs/components/layout.mdx` | `kivi/divider/`、`kivi/collapse/` | 分割线、展开收起 |
| 图片和视频 | `docs/components/media.mdx` | `kivi/media/` | 图片（加载、失败、重试）、卡片里和预览里的视频 |
| 提示 | `docs/components/tooltip.mdx` | `kivi/tooltip/` | Tooltip、Popover |
| 弹窗 | `docs/components/dialog.mdx` | `kivi/dialog/` | 确认、表单、列表、编辑器弹窗 |
| 反馈 | `docs/components/feedback.mdx` | `kivi/feedback/` | Toast、加载、骨架屏、空状态 |
| 生成 | `docs/business/generation.mdx` | `kivi/generation/` | 创作输入框、提示词输入、生成按钮、参数面板、Lora |
| 参考和引用 | `docs/business/reference.mdx` | `kivi/reference/` | 主站参考区、参考格、首尾帧、附件条（画布生成面板、发给 Agent 的附件）、所有 @ 引用胶囊、悬停预览 |
| 画布 | `docs/business/canvas.mdx` | `kivi/canvas/` | 节点、多图节点、连线、生成面板、小地图（节点工具栏、画布工具栏在模板「画布工具」） |
| 标注 | `docs/business/annotation.mdx` | `kivi/annotation/` | 标注框、标注点、标注评论 |
| Agent 对话 | `docs/business/agent.mdx` | `kivi/agent/` | 对话里的询问记录、用户消息、追问、确认卡片、技能卡、发送按钮 |
| Agent 过程 | `docs/business/agent-process.mdx` | `kivi/agent-process/`、`docs/business/agent-tools.ts` | 过程行、工具调用组、思考块、结果叠放；Agent 调的每个工具出不出一行、用什么图标 |
| 主站 | `docs/business/main-site.mdx` | `kivi/main-site/` | 生成记录、结果格 |
| 资产 | `docs/business/asset.mdx` | `kivi/asset/` | 封面格、文件夹卡、项目卡、新建卡 |
| 生成控件 | `docs/business/generation.mdx` | `kivi/generation/` | 画布和主站共用的类型、模型、参考类型、参数下拉，模型偏好、技能面板 |
| 旧名对照 | `docs/legacy-names.mdx` | — | 遇到旧变量名、旧组件名、旧图标名 |
| 组件写法 | `docs/component-api.mdx` | `kivi/hooks/` | 写或改 React 组件：forwardRef、受控、事件合并 |
