# skill 测试汇总（2026-10-30）

任务：照即梦「资产」页，做 KIVI 的「生成历史 / 画布」两个 tab。两个 Sonnet 子代理只看 SKILL.md 和网站。

- 网页：`web/`（报告 `web/REPORT.md`，截图 `web/screenshot-two-tabs.png`）
- Figma：KIVI-3.14 新 page「测试 · 资产 生成历史（skill 测试 10-30）」，https://www.figma.com/design/iVABA54n2vNPDE7GKGJrcQ/KIVI-3.14?node-id=225-5807（报告 `figma/REPORT.md`）

## 结论

组件层面够用：侧栏、Tabs、Select、ResultTile、占位图、骨架、空状态都直接用上，两边做出来结构一致。
缺的是**整页层面**：同一件事两边各猜各的，说明规范没定。

| 两边猜得不一样 | 网页 | Figma |
|---|---|---|
| 侧栏底色 | base + 右描边 | 比主区亮一档 |
| 缩略图网格间距 | 4（照主站示例） | 8 |
| 「主体」图标 | OmniReference | Pack |

## A. SKILL.md 自己能补的

1. 「原型」：写清在 site 外起项目（`@kivi` alias、`publicDir` 指 `assets/` 否则占位图裂、自己写 `body` 底色和字体）。
2. 缺图标：去 Lucide 选，按图标库规则加进 Figma 并标待确认，不拿意思不对的图标顶。
3. 「在 Figma 里搭」：写库文件 key；MDX 页头的 `figma` node-id 都在库文件里；React 属性和 Figma 属性怎么对应；脚本加载不了苹方先换 Noto（含 `skipInvisibleInstanceChildren`、换字体会丢文字样式，改绑字号行高变量）。
4. 网站和 Figma 库不一致时：Figma 里照用库组件，差异写进交付说明，不自己仿。
5. 路由：主站侧栏在「菜单和提示」；「主站」页只有生成记录和输入框，不含整页结构。
6. 核心规则 7：切换整块内容的（图片 / 视频 / 音频 / 文档）用选项卡，哪怕看起来像选值。
7. 审查 Figma 静态稿：Tooltip 不用画；状态是否要另画一版，写清楚。

## B. 规范缺口（要先在 Figma 定）

1. **页面骨架**：整条侧栏（宽、底色、顶部、分隔）、主区页边距、分组标题、网格列数和间距。最大的缺口。组件注释里提到的「模板 · 主站」页网站上没有。
2. **作品 / 项目卡片**：封面 + 名字 + 修改时间，两边都是猜的（NodeCard 名字像但不是）。
3. ResultTile 只有图片、视频，没有音频、文档。
4. 骨架屏网格模板（Figma 旧版有「作品列表骨架」，网站没有）。
5. 「资产」「主体」图标。
6. 筛选条的 Select：没选时显示 placeholder 色，像禁用；「固定标签」的触发器没定。
7. 图片、卡片悬停怎么表现（描边升档？）。

## C. 组件 / Figma 库的问题

- 网站：SidebarItem「更多」、SidebarLabel「新建」是纯图标按钮，没 Tooltip，使用方补不了。
- Figma：
  - ResultTile「生成中」还是旧样式（遮罩 + 进度条），缩到 137 宽会坏。
  - SidebarItem 换图标要钻进 `leftIcon`，没暴露；PlaceholderImage 的比例、ResultTile 里的图片没暴露到外层。
  - PlaceholderImage「模糊垫底」疑似没生效（没查实）。
  - AssetThumb 图片写死，侧栏所有封面都是同一张。
  - Tag 圆角 Figma 描述 4、网站 6；SidebarLabel 新建按钮描述和网站不一致。
