# 按钮

点了会执行一个动作的控件。Button 带文字，IconButton 只有图标。点了是「选一个值」的（比例、分辨率、开关）不用按钮，用分段选择器或开关。

代码里对应：`src/components/CustomButton`（迁移中，旧写法见「旧名对照」）。状态：草稿 0.1.0。

## Button

结构：［左图标］+ 文字 +［右图标］，水平排列，图标和文字间距 4，图标 16。

### 尺寸

| 尺寸 | 高 | 圆角 | 左右内边距 | 文字 | 最小宽度 | 用在哪 |
|---|---|---|---|---|---|---|
| 小 | 28 | 6 | 8 | 12 粗 | — | 顶栏、卡片上的小操作、紧凑的工具条 |
| 中（默认） | 32 | 8 | 12 | 13 粗 | 64 | 节点工具栏、输入框下面的工具条、面板里的操作 |
| 大 | 36 | 8 | 16 | 13 粗 | 80 | 弹窗底栏、表单提交、页面上的主操作 |

不再有 40、44、48 高的按钮。

### 类型和状态

| 类型 | 默认 | 悬停 | 按下 | 文字 | 用在哪 |
|---|---|---|---|---|---|
| 主要 | 品牌渐变 | 渐变上叠白 12% | 整体透明度 80% | on-brand（黑） | 生成、确认、提交。一屏只放一个 |
| 次要 | light-1（白 8%） | light-1-hover（12%） | light-1-pressed（16%） | primary | 取消和普通操作，最常用 |
| 文字 | 透明 | light-2-hover（8%） | light-2-pressed（12%） | primary | 工具栏里的操作、不需要强调的操作 |
| 危险 | status/danger | 叠白 12% | 整体透明度 80% | primary（白） | 删除等不能撤销的操作的确认 |

- **禁用**：底色白 8%（文字型保持透明），文字 disabled（白 20%）。
- **加载中**：底色和文字同默认，左边换成 Loading 图标（16，1 秒一圈匀速旋转），点击后等结果时用。
- 「生成」用普通的主要按钮，不做胶囊，保持品牌渐变。
- 删除确认里，把主要按钮换成危险按钮。

CSS 写法参考：

```css
.btn { height: 32px; padding: 0 var(--spacing-md, 12px); border-radius: var(--border-radius-sm, 8px);
  display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-xxs, 4px);
  min-width: 64px; font-size: var(--font-size-13, 13px); line-height: var(--font-line-height-20, 20px);
  font-weight: var(--font-weight-medium, 500); border: 0; cursor: pointer; }
.btn--primary { color: var(--color-text-fill-on-brand, #000);
  background: linear-gradient(90deg, var(--color-brand-gradient-1, #CEFF5D), var(--color-brand-gradient-2, #2BFF75)); }
.btn--primary:hover { background: linear-gradient(var(--color-bg-fill-container-light-1-hover, rgba(255,255,255,.12)) 0 0),
  linear-gradient(90deg, var(--color-brand-gradient-1, #CEFF5D), var(--color-brand-gradient-2, #2BFF75)); }
.btn--primary:active { opacity: .8; }
.btn--secondary { color: var(--color-text-fill-primary, #fff); background: var(--color-bg-fill-container-light-1, rgba(255,255,255,.08)); }
.btn--secondary:hover { background: var(--color-bg-fill-container-light-1-hover, rgba(255,255,255,.12)); }
.btn--secondary:active { background: var(--color-bg-fill-container-light-1-pressed, rgba(255,255,255,.16)); }
.btn:disabled { background: var(--color-bg-fill-container-light-1, rgba(255,255,255,.08)); color: var(--color-text-fill-disabled, rgba(255,255,255,.2)); opacity: 1; cursor: not-allowed; }
```

## IconButton

纯图标按钮，正方形，圆角和同高的 Button 一致。

| 尺寸 | 图标 | 圆角 | 类型 | 用在哪 |
|---|---|---|---|---|
| 28 | 16 | 6 | 次要 / 文字 | 顶栏、卡片上的小操作 |
| 32（默认） | 20 | 8 | 次要 / 文字 | 节点工具栏、底部工具条、输入框里的操作、弹窗关闭 |
| 36 | 20 | 8 | 主要 / 次要 | 和大按钮并排时，比如输入框的发送 |
| 40 | 24 | 8 | 文字 | 左侧竖向工具栏 |

- 类型的颜色和 Button 一样：主要（品牌渐变 + 黑色图标，用于发送、生成）、次要、文字。
- **选中**：底色 brand/subtle（品牌绿 12%），图标 brand/solid。只给有开关状态的工具用，比如文字工具栏的加粗、竖向工具栏当前选中的工具。主要类型没有选中态。
- **禁用**：同 Button。
- 只有图标的按钮必须配 Tooltip，说明它做什么。
- 图标本身不加背景和内边距，底色和点击区域由 IconButton 提供。
