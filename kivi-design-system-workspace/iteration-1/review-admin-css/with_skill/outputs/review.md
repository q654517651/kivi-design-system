# 模型管理页样式评审（按 KIVI 设计规范 v2）

## 结论

整份样式没有一个变量，颜色、圆角、字号、间距全是写死的，而且多数取的是旧版的值。主要有五类问题：

1. **底色层级不对**：页面底用了旧色 #05080A；卡片用了实色加投影；下拉、Tooltip、弹窗都用了废弃的 #2B2D31 / #36393D。
2. **尺寸不在档位里**：按钮和输入框高 40，菜单项高 44，圆角有 10 / 12 / 16 这样的错位，间距有 20。
3. **浮层做法不对**：三种浮层都加了投影；下拉没用玻璃；遮罩加了模糊；弹窗加了描边。
4. **状态没画全，还有一个覆盖 bug**：`.btn:hover` 会把「生成」和「删除」按钮的底色盖成灰色。
5. **字号和字重**：按钮、菜单项用 14 号 600，应该是 13 号 500；Tooltip 用 14 号，应该是 12 号。

改好的样式见 `fixed.css`。所有值都写成 `var(--变量, 兜底值)`，前端还没加 v2 变量时也能正确显示。

## 逐条问题

### 全局 body
| 现在 | 问题 | 改成 |
|---|---|---|
| `background: #05080a` | 旧的全局底色，值已经改了 | `--color-bg-fill-base`（#0F1012） |
| `color: #fff` | 写死的颜色 | `--color-text-fill-primary` |
| `font-family: 'PingFang SC'` | 写死的值 | `var(--font-family, "PingFang SC")` |
| `font-size: 14px` | 界面主文字是 13，14 只用在需要阅读的内容 | `--font-size-13`，行高 `--font-line-height-20` |

### .page-title
| 现在 | 问题 | 改成 |
|---|---|---|
| `font-size: 20px` | 20 只用在引导页、空状态的大标题；页面标题是 24/32 | `--font-size-24` / `--font-line-height-32` |
| `font-weight: 600` | 标题用 500，600 很少用 | `--font-weight-medium`（500） |
| `margin-bottom: 20px` | 20 不在间距档位里（4/6/8/12/16/24/32） | `--spacing-xl`（24） |

### .model-card
| 现在 | 问题 | 改成 |
|---|---|---|
| `background: #191b1d` | 旧的实色。页面里普通的卡片用白 4% 叠加，surface 只给盖在画布上的东西和弹窗用 | `--color-bg-fill-container-light-2` + 1px `--color-border` |
| `border-radius: 10px` | 不在圆角档位里，卡片是 12 | `--border-radius-md`（12） |
| `padding: 20px` | 不在间距档位里 | `--spacing-lg`（16） |
| `box-shadow` | 规范里不用投影 | 去掉 |
| `.desc` 白 50% | secondary 已从 50% 改成 60% | `--color-text-fill-secondary`；说明文字 14/22，补上行高 |

### .btn（次要按钮）
| 现在 | 问题 | 改成 |
|---|---|---|
| `height: 40px` | 没有 40 这一档了，控件高度只有 28 / 32 / 36 | 默认中号 32；弹窗底栏和表单提交用大号 36（`.btn--lg`） |
| `padding: 0 16px` | 中号按钮左右是 12 | `--spacing-md`（12）；大号才用 16 |
| `border-radius: 12px` | 按钮圆角是 8 | `--border-radius-sm`（8） |
| `font-size: 14px; font-weight: 600` | 按钮文字是 13 号、500 | `--font-size-13` + `--font-weight-medium` |
| 底色白 6%，悬停白 10% | 叠加只用 4 / 8 / 12 / 16 四档 | 默认 `container-light-1`（8%），悬停 `light-1-hover`（12%） |
| 缺按下、禁用 | 状态要画全 | 按下 `light-1-pressed`（16%）；禁用白 8% 底 + `--color-text-fill-disabled` |
| 没有 `border: 0`、最小宽度、行高 | 原生按钮会带默认边框 | 补上 `border: 0`、`min-width: 64px`、行高 20 |

### .btn-generate（主要按钮）
| 现在 | 问题 | 改成 |
|---|---|---|
| `border-radius: 999px` | 「生成」不做胶囊，用普通主要按钮 | 跟 `.btn` 一样，圆角 8 |
| 渐变和 `#000` 写死 | 写死的颜色 | `--color-brand-gradient-1/2`、`--color-text-fill-on-brand` |
| **悬停时变灰（bug）** | `.btn:hover` 的优先级比 `.btn-generate` 高，悬停时渐变会被盖成白 10% | 单独写 `:hover`（渐变上叠白 12%）和 `:active`（整体透明度 0.8） |
| 用法 | 一屏只放一个主要按钮 | 如果每张模型卡片上都有「生成」，卡片上的改成次要按钮，页面只留一个主要按钮 |

### .btn-delete
| 现在 | 问题 | 改成 |
|---|---|---|
| `background: #2b2d31` | 已废弃的颜色 | 危险按钮底色是 `--color-status-danger`，文字是白色（`--color-text-fill-primary`） |
| `color: #ff4d4f` | 写死的颜色 | `--color-status-danger`（取值是占位） |
| 悬停同样被 `.btn:hover` 盖成灰色 | 和「生成」是同一个 bug | 悬停叠白 12%，按下整体透明度 0.8 |
| 用法 | 规范里的危险按钮只用在「删除确认弹窗」里 | 卡片上的删除入口放进「更多」菜单，做成最后一项危险菜单项（`.dropdown-item--danger`）；点了先弹确认弹窗，弹窗里再用 `.btn-delete` |

### .tag
| 现在 | 问题 | 改成 |
|---|---|---|
| `height: 22px` | 标签高 24 | 24 |
| `padding: 0 8px` | 标签左右是 6 | `--spacing-xs`（6） |
| `border-radius: 6px` | 标签圆角是 4 | `--border-radius-xxs`（4） |
| 底色黑 45% | 没有 45% 这一档；黑色半透明只用在图片和视频上面 | 普通标签用 `container-light-1` + secondary 文字；盖在模型封面上的用 `.tag--on-media`（`--color-on-media-fill` 黑 40% + 白字） |
| 没有文字颜色 | 写死的值缺失 | 默认 secondary；on-media 用 `--color-on-media-text` |

### .dropdown / .dropdown-item
| 现在 | 问题 | 改成 |
|---|---|---|
| 底色 `#2b2d31` | 下拉是「选」东西的浮层，要用玻璃 | `--color-bg-fill-glass` + 1px `--color-border` + `backdrop-filter: blur(16px)` |
| `border-radius: 16px` | 菜单容器圆角是 12 | `--border-radius-md`（12） |
| `padding: 8px` | 菜单容器内边距是 4 | `--spacing-xxs`（4） |
| `box-shadow` | 规范里不用投影 | 去掉 |
| 菜单项 `height: 44px` | 菜单项高 36 | 36 |
| 菜单项 `padding: 0 16px` | 左右 12 | `--spacing-md` |
| 菜单项 `border-radius: 12px` | 菜单项圆角 8 | `--border-radius-sm` |
| 菜单项 `font-size: 14px` | 菜单项 13 号常规 | `--font-size-13` + `--font-weight-regular` |
| 悬停白 10% | 不在档位里；菜单项悬停是 8% | `--color-bg-fill-container-light-2-hover` |
| 缺禁用、危险项、分割线 | 状态不全 | 补上 `.is-disabled`、`--danger`、`.dropdown-divider`；容器宽度限制在 160–320，最高 360，超出就滚动 |

### .tooltip
| 现在 | 问题 | 改成 |
|---|---|---|
| `background: #36393d` | 已废弃的 popup-light-1 | `--color-bg-fill-popup`（#2C2D2E） |
| `font-size: 14px` | Tooltip 用 12 号 | `--font-size-12`，行高 20 |
| `padding: 8px 12px` | 简单 Tooltip 上下 6、左右 12，总高 32 | `--spacing-xs` / `--spacing-md` |
| 没有文字颜色 | — | `--color-text-fill-primary` |

### .input
| 现在 | 问题 | 改成 |
|---|---|---|
| `height: 40px` | 没有 40 这一档 | 页面里用中号 32；弹窗里用大号 36（`.modal .input`） |
| 底色白 4% | 输入框是能点的，从 8% 起 | `container-light-1`（8%），悬停 12% |
| `:focus` 加了品牌绿描边 | 输入框聚焦不加描边，只出现光标；品牌绿也不该用在这里 | `outline: none`，描边保持透明 |
| 缺内边距、字号、文字和占位文字颜色 | — | 左右 12，13 号，primary；占位文字用 `--color-text-fill-placeholder` |
| 缺错误、禁用 | 状态要画全 | 错误时加 1px `--color-status-danger` 描边，提示文字也换成 danger 色并写清原因；禁用时底色 light-2，文字 disabled |

### .modal-mask / .modal
| 现在 | 问题 | 改成 |
|---|---|---|
| 遮罩黑 45% | 遮罩是黑 60% | `--color-bg-fill-mask` |
| `backdrop-filter: blur(24px)` | 遮罩不模糊 | 去掉 |
| 弹窗底色 `#2b2d31` | 弹窗用 surface | `--color-bg-fill-surface`（#191A1B） |
| `border: 1px solid rgba(255,255,255,.12)` | 弹窗不加描边 | 去掉 |
| `width: 480px` | 不在弹窗尺寸里（S 400 / M 720 / L 1024 / XL 1200） | 按就近原则归到 S 400；表单内容多的用 M 720 |
| 缺最大高度、区块间距 | — | `max-height: 80vh`，区块之间 16 |
| 圆角 16、内边距 24 | 取值对，但写死了 | 换成 `--border-radius-lg`、`--spacing-xl` |

## 写组件时顺带注意

- 弹窗结构：标题 16 号 500；描述 14/22 secondary；底栏按钮靠右，间距 8，用大号按钮（取消用次要，确认用主要，删除确认用危险）；关闭按钮用 IconButton 32 · 文字型。
- 如果页面上有只有图标的按钮（编辑、更多），必须加 Tooltip 说明它做什么。
- `--color-status-danger` / `--color-status-danger-subtle` 的取值是占位，`fixed.css` 里已经加了注释，方便以后统一替换。
