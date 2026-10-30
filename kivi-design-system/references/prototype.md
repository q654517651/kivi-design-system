# 原型做法

产品出原型、做可点击 demo、给评审看效果时用。目标是看起来和设计稿一样，所以颜色、字号、圆角、尺寸都按规范来，只是图标和插图用替代品。

## 做成什么样

- 单个 HTML 文件，打开就能看，不依赖构建工具。
- 外部资源只引两样：Lucide 图标（unpkg）。字体用系统里的苹方，不用另外引。
- 最外层照「页面」里对应页面的结构摆。只画和需求相关的部分，其他地方用简单的占位块。
- 可交互的东西做出悬停、按下、选中状态（用 `:hover`、`:active` 和一个 `.is-selected` 类）；弹窗、菜单、Toast 能点开、关掉。
- 用到的占位值（功能色、画布旧样式）和规范里没有、临时补的东西，在页面角落或 HTML 注释里写一句。

## 起手模板

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>原型名</title>
<style>
/* 1. 把「变量」最后的 :root 变量块整段贴在这里（动效变量也在里面） */

/* 2. 基础样式 */
* { box-sizing: border-box; margin: 0; }
body { background: var(--color-bg-fill-base); color: var(--color-text-fill-primary);
  font-family: var(--font-family), -apple-system, BlinkMacSystemFont, "Noto Sans SC", "Microsoft YaHei", sans-serif;
  font-size: var(--font-size-13); line-height: var(--font-line-height-20); -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; }
.icon { width: 16px; height: 16px; stroke-width: 1.5; flex: none; }
.icon-20 { width: 20px; height: 20px; }
.icon-24 { width: 24px; height: 24px; }

/* 3. 用到哪个组件，从下面「组件写法」里复制 */
</style>
</head>
<body>
  <!-- 页面内容 -->
  <script src="https://unpkg.com/lucide@1.54.0/dist/umd/lucide.min.js"></script>
  <script>lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });</script>
</body>
</html>
```

## 图标

- 写法：`<i data-lucide="search" class="icon"></i>`，页面加载后由 `lucide.createIcons` 换成 SVG。图标颜色跟着文字颜色（currentColor）走。
- KIVI 图标名对应哪个 Lucide 名字，查「图标」表里的「原型用 Lucide」一列。不要用表外的 Lucide 图标顶替已有的 KIVI 图标。
- 动态插进页面的图标，插入后再调用一次 `lucide.createIcons(...)`。
- 实心图标（Play、Pause、CollectSolid、点赞实心）：给 SVG 加 `fill="currentColor"`。
- 比例图标：用 CSS 画矩形。
  ```html
  <span style="display:inline-block;width:12px;aspect-ratio:16/9;border:1.5px solid currentColor;border-radius:2px"></span>
  ```
- 模型 Logo：写模型名文字。
- IP 插图：用同尺寸的占位块，写清楚是什么，比如「IP 插图：暂无内容」。
- 用户作品（图片、视频、节点里的生成结果）：不要用纯黑方块，看起来像没加载出来。用户给了截图或图片链接就直接用；没有的话用「占位图」里的图，随便挑，同一屏别重复。拿不到图片文件时，才用下面的渐变色块。

## 图片占位

拿不到「占位图」里的图片文件时，用柔和的渐变色块代替，几张之间换换颜色。

```css
/* 图片占位：低饱和的暗色渐变，换 --a / --b 做出几种 */
.ph { --a: #3a4a5c; --b: #1c2430; background: linear-gradient(135deg, var(--a), var(--b)); border-radius: var(--border-radius-sm); }
.ph--2 { --a: #5c4a3a; --b: #2a1f1a; }
.ph--3 { --a: #3a5c4e; --b: #182a22; }
.ph--4 { --a: #4e3a5c; --b: #221a2c; }
```

占位色只用来代替图片内容，不能拿来做界面底色。

## 组件写法

下面只写默认态和关键状态。尺寸、颜色的完整规格在各组件文件里。

```css
/* 按钮：中 32；小 28 改 height/padding/radius/字号；大 36 改 height/padding */
.btn { height: 32px; min-width: 64px; padding: 0 var(--spacing-md); border-radius: var(--border-radius-sm);
  display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-xxs);
  font-weight: var(--font-weight-medium); white-space: nowrap; }
.btn--sm { height: 28px; min-width: 0; padding: 0 var(--spacing-sm); border-radius: var(--border-radius-xs); font-size: var(--font-size-12); }
.btn--lg { height: 36px; min-width: 80px; padding: 0 var(--spacing-lg); }
.btn--primary { color: var(--color-text-fill-on-brand); background: linear-gradient(90deg, var(--color-brand-gradient-1), var(--color-brand-gradient-2)); }
.btn--primary:hover { background: linear-gradient(var(--color-bg-fill-container-light-1-hover) 0 0), linear-gradient(90deg, var(--color-brand-gradient-1), var(--color-brand-gradient-2)); }
.btn--primary:active, .btn--danger:active { opacity: .8; }
.btn--secondary { background: var(--color-bg-fill-container-light-1); }
.btn--secondary:hover { background: var(--color-bg-fill-container-light-1-hover); }
.btn--secondary:active { background: var(--color-bg-fill-container-light-1-pressed); }
.btn--text:hover { background: var(--color-bg-fill-container-light-2-hover); }
.btn--text:active { background: var(--color-bg-fill-container-light-2-pressed); }
.btn--danger { background: var(--color-status-danger); }
.btn:disabled { background: var(--color-bg-fill-container-light-1); color: var(--color-text-fill-disabled); cursor: not-allowed; }

/* 纯图标按钮：32 · 图标 20；28 · 图标 16 · 圆角 6；36 · 图标 20 */
.icon-btn { width: 32px; height: 32px; border-radius: var(--border-radius-sm); display: inline-flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--color-bg-fill-container-light-2-hover); }
.icon-btn.is-selected { background: var(--color-brand-subtle); color: var(--color-brand-solid); }

/* 菜单：popup 实色，圆角 12，不加描边和模糊 */
.menu { padding: var(--spacing-xxs); background: var(--color-bg-fill-popup); border-radius: var(--border-radius-md); min-width: 160px; max-width: 320px; max-height: 360px; overflow-y: auto; }
.menu-item { height: 36px; padding: 0 var(--spacing-md); border-radius: var(--border-radius-sm); display: flex; align-items: center; gap: var(--spacing-sm); }
.menu-item:hover { background: var(--color-bg-fill-container-light-2-hover); }
.menu-label { height: 28px; padding: 0 var(--spacing-md); display: flex; align-items: center; font-size: var(--font-size-12); color: var(--color-text-fill-tertiary); }
.menu-divider { height: 1px; margin: 4px 0; background: var(--color-border-subtle); }

/* Tooltip 和 Toast：popup 实色 */
.tooltip { padding: 6px var(--spacing-md); border-radius: var(--border-radius-sm); background: var(--color-bg-fill-popup); font-size: var(--font-size-12); }
.toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); height: 40px; padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md); background: var(--color-bg-fill-popup); display: flex; align-items: center; gap: var(--spacing-sm);
  font-size: var(--font-size-14); line-height: var(--font-line-height-22); }

/* 输入框：中 32；大 36 改 height */
.input { height: 32px; padding: 0 var(--spacing-md); border-radius: var(--border-radius-sm); background: var(--color-bg-fill-container-light-1);
  display: flex; align-items: center; gap: var(--spacing-sm); }
.input:hover { background: var(--color-bg-fill-container-light-1-hover); }
.input input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; color: var(--color-text-fill-primary); font: inherit; }
.input input::placeholder { color: var(--color-text-fill-placeholder); }
.input.is-error { box-shadow: inset 0 0 0 1px var(--color-status-danger); }

/* 分段选择器 */
.segmented { display: flex; padding: var(--spacing-xxs); border-radius: var(--border-radius-md); background: var(--color-bg-fill-container-light-1); }
.segment { flex: 1; height: 32px; padding: 0 var(--spacing-md); border-radius: var(--border-radius-sm); color: var(--color-text-fill-secondary); }
.segment:hover { background: var(--color-bg-fill-container-light-2); }
.segment.is-selected { background: var(--color-bg-fill-container-light-1-hover); color: var(--color-text-fill-primary); }

/* 开关 */
.switch { width: 36px; height: 20px; padding: 2px; border-radius: 999px; background: var(--color-bg-fill-container-light-1-pressed); display: inline-flex; }
.switch::after { content: ""; width: 16px; height: 16px; border-radius: 50%; background: var(--color-text-fill-primary); transition: transform var(--motion-duration-150) var(--motion-ease-in-out); }
.switch.is-on { background: var(--color-brand-solid); }
.switch.is-on::after { transform: translateX(16px); }

/* 选项卡 */
.tab { height: 32px; padding: 0 var(--spacing-md); border-radius: var(--border-radius-sm); color: var(--color-text-fill-secondary); }
.tab:hover { color: var(--color-text-fill-primary); }
.tab.is-selected { background: var(--color-bg-fill-container-light-1); color: var(--color-text-fill-primary); }

/* 标签 */
.tag { height: 24px; padding: 0 6px; border-radius: var(--border-radius-xxs); display: inline-flex; align-items: center; gap: var(--spacing-xxs);
  font-size: var(--font-size-12); background: var(--color-bg-fill-container-light-1); color: var(--color-text-fill-secondary); }
.tag--on-media { background: var(--color-on-media-fill); color: var(--color-on-media-text); }

/* 弹窗 */
.mask { position: fixed; inset: 0; background: var(--color-bg-fill-mask); display: flex; align-items: center; justify-content: center; }
.dialog { width: 400px; max-height: 80vh; padding: var(--spacing-xl); border-radius: var(--border-radius-lg); background: var(--color-bg-fill-surface);
  display: flex; flex-direction: column; gap: var(--spacing-lg); }
```

错误态的输入框用 `inset box-shadow` 画 1px 描边，这样不会把框撑大。它只是描边的写法，不是投影。

## 做完检查

- 页面底是 base，没有出现规范外的颜色（图片占位的渐变除外）。
- 图片位置用了截图、占位图或渐变占位，没有纯黑方块。
- 每屏只有一个主要（品牌渐变）按钮。
- 控件高度只有 28 / 32 / 36，纯图标按钮也一样。
- 菜单、下拉、Tooltip、Toast 用 popup，弹窗用 surface + 遮罩，都没有投影。
- 只有图标的按钮都有 `title` 或 Tooltip。
