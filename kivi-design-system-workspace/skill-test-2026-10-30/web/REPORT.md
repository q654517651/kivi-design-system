# 网页测试：资产页原型（2026-10-30）

子代理（Sonnet）只照 SKILL.md 和网站做的。子代理写不了文件，这份由主对话照它的回报存下。

## 怎么看

在 `kivi-design-system/site/` 下：

```bash
W=../../kivi-design-system-workspace/skill-test-2026-10-30/web
./node_modules/.bin/vite $W --config $W/vite.config.ts --port 4180
```

打开 `http://127.0.0.1:4180/`，`?tab=canvas` 直接看画布。截图：`screenshot-two-tabs.png`。

`vite.config.ts` 把 `@kivi` 指到 site 的组件库，react 借 site 的 node_modules，`publicDir` 指到 skill 根的 `assets/`。`site/src/` 没改。

## 做了什么

- 侧栏：创作、探索、资产、主体，对话、画布两组最近列表，组标题可折叠，条目悬停出「更多」。
- 生成历史：图片 / 视频 / 音频 / 文档，筛选、时间、排序三个下拉；按日期分组的格子网格（ResultTile），悬停出操作；切换先出骨架屏，没结果出空状态。
- 画布：画布 / 历史画布 / 其他，新建项目 + 项目卡片（PlaceholderImage 模糊垫底），空画布出 Canvas 图标。

## 三档归类

| 块 | 档 | 处理 |
|---|---|---|
| 变量、顶部和二级 Tabs、三个下拉（Select plain）、侧栏零件、ResultTile、Skeleton、EmptyState、Toast | 已定 | 直接用 |
| 日期分组标题（16/24 粗）、网格列数（minmax 176）、音频和文档格子、画布封面、新建项目格、空画布占位、卡片「更多」条、骨架摆法 | 能组合 | 用现有组件和变量拼 |
| 侧栏整体（宽 240、底色、Logo）、页边距 24、项目卡片（圆角 12、16:9、悬停描边）、日期文案、「主体」图标、右上角、点开后的预览 | 没覆盖 | 自己定，标待确认 |

## 自查

只看了 1440 × 900，窄屏没查。

- 不合格：SidebarItem「更多」、SidebarLabel「新建」是库里的纯图标按钮，没有 Tooltip，使用方补不了。
- 没做：禁用、卡片按下态。
- 其余通过。

## skill 的问题（子代理原话整理，按严重程度）

1. 「没有设计稿时」第 1 步只列了画布、对话、主站三种页面。资产页是列表 + 网格，三种都不像，整页布局（页边距、分组标题、网格列数、二级筛选条）只能猜。
2. 侧栏组件注释指向「模板 · 主站」页，网站没有这页，也没有整条侧栏的示例：宽、底色、顶部、分隔都是猜的。
3. 没有作品卡片 / 项目卡片；NodeCard 名字像，但不是。
4. 「悬停升一档」对图片、卡片没说法；描边各档用在哪没写。
5. ResultTile 只有图片、视频，没有音频、文档。
6. Select plain 没选值时显示 placeholder 色，在筛选条上像禁用；「没选 = 默认」没写。
7. 没有骨架屏网格模板（Figma 有「作品列表骨架」，网站没有）。
8. 「原型」一节没说在 site 外怎么起项目：alias、`publicDir` 指 assets（否则占位图裂）、`body` 底色和字体要自己写。
9. 图标缺了怎么办 SKILL.md 没写（只在 CLAUDE.md）。
10. 组件库自己违反审查清单（见上面 Tooltip）。
11. 数值散在 mdx、css、tsx 三处，核对慢（不算错）。
12. 「待定」散在各页，交付时要逐页找（小问题）。

好用的：三档判断几乎照填；参数表带数值；`PlaceholderImage fill="blur"` 直接解决竖图封面；侧栏、Tabs、Select、ResultTile 交互内置。
