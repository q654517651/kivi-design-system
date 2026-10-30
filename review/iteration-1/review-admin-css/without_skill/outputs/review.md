# 模型管理页 CSS 审查（对照 KIVI 规范）

依据：ai-design-web 的 `src/variable.less`（设计 token）、`src/global.less`、`AGENTS.md`，以及现有组件 CustomButton、CustomMenu、BaseModal、ConfirmModal、ModelCard、ThumbBadge、`packages/infinite-canvas/src/components/generate-btn`。

## 结论

1. **一个实际 bug**：hover 时生成按钮的渐变会被盖掉。
2. **用色和交互的规范问题**：生成按钮用了胶囊圆角，删除按钮用了红色，输入框 focus 用了品牌绿，卡片加了投影。
3. **写法问题**：没有用任何 token，有 9 处数值不在 KIVI 的档位里，还直接改了 `body`、通用类名全局裸写。

改好的样式见 `fixed.css`，旧类名到新类名的对照写在文件头部。

---

## 一、必改

| # | 位置 | 问题 | 改法 |
|---|---|---|---|
| 1 | `.btn:hover` + `.btn-generate` | **Bug**：`.btn:hover` 的优先级 (0,2,0) 比 `.btn-generate` (0,1,0) 高，鼠标悬停时渐变会变成 10% 的白底，黑字几乎看不清。`.btn-delete` 也有同样问题。 | 生成按钮 hover 时保留渐变，用 `opacity: 0.9`，active 用 `0.8`（和画布里的 generate-btn 一样） |
| 2 | `.btn-generate` 的 `border-radius: 999px` | KIVI 带文字的渐变主按钮都用 8px 圆角（generate-btn、CanvasGuide、AppDeployVersionCheck、SharePreviewHeader），44/48px 的大按钮用 12px。999px 只给 36×36 的圆形发送按钮用。 | `var(--border-radius-sm)`；渐变色改用 `--color-brand-gradient-1/2` |
| 3 | `.btn-delete` | ① KIVI 没有危险色 token，删除统一用中性的按钮或 Delete 图标，再用 ConfirmModal 做二次确认（"删除后，内容将无法找回"）。② `#2b2d31` 是弹层底色（popup-light-2），不该当按钮底色用。 | 去掉这个类，删除按钮直接用普通按钮样式，点击后弹 ConfirmModal |
| 4 | `.input:focus` 用 `#2bff75` 描边 | 品牌绿只用在主操作渐变和选中、收藏状态上。现有输入框 focus 时是底色变深，或者加中性描边。 | focus 时底色改为 `--color-bg-fill-container-light-2-hover-active`，描边改为 `--color-border`；同时补上 padding、文字色和 placeholder 色 |
| 5 | `.model-card` 的 `box-shadow` | 暗色界面不靠投影分层。现有卡片（ModelCard、ImageCard）都只用底色和 1px 描边。 | 去掉投影 |
| 6 | `body { … }` | 在页面样式里改 body，违反 AGENTS.md 的"样式隔离"要求。背景和字体已经由 HeroUI dark 主题和全局样式提供。另外 `font-family` 只写了 `'PingFang SC'`，没有兜底字体，Windows 上会退回宋体。 | 删掉 body 规则，改成页面根节点 `.model-admin` |
| 7 | `.btn` `.tag` `.input` `.modal` `.dropdown` `.tooltip` | 通用类名全局裸写，容易和别的页面冲突。 | 放进页面目录的 `index.module.less`，按 BEM 命名收进 `.model-admin` |

## 二、数值不在档位里（改成最近的 token）

KIVI 档位：字号 12/14/16，间距 4/6/8/12/16/24/32，圆角 4/6/8/12/16/999，白色透明度 4/8/12/20/30/50%，黑色透明度 30/40/60%。

| 位置 | 原值 | 改成 |
|---|---|---|
| `.page-title` 字号 | 20px | 16px `--font-size-lg`（设计稿确实要更大的话，先在 variable.less 里补 token） |
| `.page-title` 下边距 | 20px | 16px `--spacing-lg` |
| `.model-card` 圆角 | 10px | 12px `--border-radius-md` |
| `.model-card` 内边距 | 20px | 16px `--spacing-lg` |
| `.model-card` 背景 | `#191b1d`（不是 token） | `--color-bg-fill-container-light-1`（白 8% 叠在 #05080a 上约等于 #191c1e，看起来基本不变） |
| `.btn` 背景 / hover | 白 6% / 白 10% | `--color-bg-fill-container-light-1`（8%）/ `-hover-active`（12%） |
| `.dropdown-item:hover` | 白 10% | `--color-bg-fill-container-light-2-hover-active`（8%），和 CustomMenu 一致 |
| `.tag` 背景 | 黑 45% | 叠在图片上用 `--color-bg-fill-container-dark`（40%）加 `blur(4px)`；放在卡片上用 light-1 加次级文字色 |
| `.modal-mask` 背景 | 黑 45% | `--black-60`，和 BaseModal 一致 |

## 三、和现有组件不一致（建议改）

- **`.btn` 40px 高 / 12px 圆角**：常规按钮是 32 或 36px 高、8px 圆角，44/48px 的大按钮才用 12px 圆角，代码里没有 40px 高的按钮。建议改成 36px 高、8px 圆角。
- **`.tag` 22px 高 / 6px 圆角 / 左右内边距 8px**：现有角标（ThumbBadge、ModelCard badge）是 24px 高、4px 圆角、左右内边距 4px、12px 字号。
- **`.dropdown`**：padding 8px、阴影 `0 8px 24px` 黑 50%，和 CustomMenu 不一样。CustomMenu 是 padding 4px、gap 4px、阴影 `0 6px 16px` 黑 32%，菜单项左右内边距 12px，不是 16px。
- **`.tooltip` padding 8px 12px**：14px 文字的 tooltip 用 12px 16px（global.less 里的 `.padding-12-16`）。8px 是给 12px 字号的图标 tooltip 用的。
- **`.modal` 的 1px 描边**：ConfirmModal、RenameModal 等现有弹窗都没有描边，建议去掉。要保留的话用 `--color-border`。
- **缺少交互状态**：按钮没有 active、disabled 和 `cursor: pointer`。AGENTS.md 要求可点击元素有 hover 和 active 状态。

## 四、本来就对，只是没用变量

body 背景 #05080a、正文 14px、次级文字 50%、下拉框底色 #2b2d31 和 16px 圆角、菜单项 44px 高和 12px 圆角、tooltip 底色 #36393d 和 8px 圆角、输入框 40px 高 / 8px 圆角 / 白 4%、弹窗 #2b2d31 / 16px / 24px、遮罩 `blur(24px)`。这些只需要把写死的数值换成对应的 token。

## 更省事的做法

后台页能直接用现有组件，就不用手写这些样式：
- 按钮：`CustomButton`（`btnType="primary"` 或 `"balance"`）
- 下拉：`CustomMenu`
- 弹窗：`BaseModal` 或 `ConfirmModal`
- tooltip：HeroUI 的 Tooltip 加 `custom-tooltip` 类
