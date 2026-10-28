# 旧名对照

评审代码或旧设计稿时，看到下面左边的东西，就换成右边的。改名的变量在代码里保留了别名，旧代码暂时不会坏；新代码一律写新名字。

## 写死的值 → 变量

代码里最常见的写死值。

| 写死的值 | 换成 | 说明 |
|---|---|---|
| #05080A | --color-bg-fill-base（#0F1012） | 全局底色，值也变了 |
| #191B1D、#181818（实色） | --color-bg-fill-surface（#191A1B） | 盖在画布上的面板、模态弹窗 |
| #2B2D31、#222326 | 菜单类 → 玻璃（--color-bg-fill-glass）；Tooltip、Toast → --color-bg-fill-popup；弹窗 → --color-bg-fill-surface | 按用途分开 |
| #36393D | --color-bg-fill-popup | 原来的 popup-light-1，已废弃 |
| rgba(24,24,24,0.7) | --color-bg-fill-glass | 配 1px --color-border、blur(16px)、圆角 12 |
| 遮罩黑 60%、45% 等 | --color-bg-fill-mask（黑 60%） | 遮罩不加模糊 |
| 白 3%、5% | --color-bg-fill-container-light-2（4%） | |
| 白 6%、10% | 8% → light-1 或 light-2-hover；10% → 12%（light-1-hover） | 只用 4 / 8 / 12 / 16 四档 |
| 黑色半透明叠加 | 黑 40%（container-dark、on-media/fill）或黑 60%（mask、on-media/fill-hover） | |
| 白 50% 文字 | --color-text-fill-secondary（白 60%） | secondary 从 50% 改成了 60% |
| #FF4D4F | --color-status-danger | |
| #37FF74、#2BFF75 | --color-brand-solid | |
| font-family: 'PingFang SC' | var(--font-family) | |
| font-weight: 600（按钮、标题） | var(--font-weight-medium)（500） | |
| backdrop-filter: blur(32px)（工具栏） | blur(16px) | 统一成玻璃的模糊 16 |
| box-shadow（浮层、弹窗） | 去掉 | 浮层不加投影 |
| 按钮高 40、44、48 | 36（大）或 32（中） | |
| 按钮、Tab 圆角 12 | 8（小号 6） | |
| 按钮、菜单、Tab 文字 14 | 13（大号选项卡是 14） | |

## 变量改名

| 旧名 | 新名 |
|---|---|
| --background、colors/background | --color-bg-fill-base |
| container-dark-1、container-dark-2 | --color-bg-fill-surface |
| container-dark-3 | --color-bg-fill-container-dark |
| container-dark-4 | 并入 --color-bg-fill-base |
| --color-bg-fill-popup-light-2、popup1 | --color-bg-fill-popup |
| --color-bg-fill-popup-light-1、popup-raised、popup2 | 废弃，改用 --color-bg-fill-popup |
| …container-light-1-hover-active | --color-bg-fill-container-light-1-hover |
| …container-light-2-hover-active | --color-bg-fill-container-light-2-hover |
| …container-dark-hover-active | --color-bg-fill-container-dark-hover |
| color/border-1 | --color-border |
| color/border-2 | --color-border-strong |
| colors/brand/solid、brand/gradient2 | --color-brand-solid、--color-brand-gradient-2 |
| colors/brand/gradient1 | --color-brand-gradient-1 |
| --font-size-xs / sm / md / lg | --font-size-10 / 12 / 14 / 16 |
| --border-widtgh-sm / md / lg（拼错） | --border-width-sm / md / lg |
| 第二个 --opacity-30（实际值 0.2） | --opacity-20 |

## 组件

| 旧 | 新 |
|---|---|
| CustomButton `btnType="balance"` | Button · 主要 |
| CustomButton `btnType="primary"`（白 6% 底） | Button · 次要（白 8%）。旧代码叫 primary，其实是次要按钮 |
| CustomButton `btnType="text"` | Button · 文字 |
| 删除确认用 primary / balance | Button · 危险 |
| 旧库 Button Content=icon-only、ICON background=32 | IconButton |
| ToolbarButton | 画布 ToolbarItem；通用工具条用 Button · 文字 或 IconButton |
| CustomMenu、AnchoredDropdown、CommonDropdown、菜单容器 | 菜单模板（玻璃）+ MenuItem |
| MenuItem 44 高、圆角 12、14 号 | MenuItem 36 高、圆角 8、13 号 |
| MenuItemAsset | MenuItem 打开「缩略图」 |
| .custom-tooltip、ChatTooltip | Tooltip · 简单 / 说明 |
| CustomTab | 选值的 → 分段选择器；切换内容的 → 选项卡 TabItem |
| 比例、分辨率一个个独立方块 | 分段选择器（选项放进同一条底槽） |
| 生成音频「开 / 关」两个方块、VehicleSwitch | Switch |
| CustomCheckbox | Checkbox |
| RenameModal 输入框（40 高、白 4%） | Input · 大（36、白 8%） |
| antd InputNumber、PackagerInlineNumberInput | NumberInput |
| CustomSelect、CustomSelector、HeroUI Select | Select · 填充 |
| 输入框里的模型选择 | Select · 无底 |
| PromptInput | 提示词输入框模板（圆角 24、14 号） |
| BaseModal、antd Modal、HeroUI Modal | Dialog（S / M / L / XL） |
| antd message | Toast |
| HeroUI Spinner | Loading |
| CustomSkeleton、LoadingSkeleton、HeroUI Skeleton | Skeleton |
| Empty（noData、noCollection） | EmptyState |
| gen-info__badge、status-tag、tag-element | Tag · 默认 |
| 图片上的 badge（时长、序号、4K、文件夹角标） | Tag · 覆盖 |
| HeroUI Avatar、CustomAvatar | Avatar 16 / 24 / 32 |
| 旧库 OutputNode | 画布 NodeWrapper |
| 旧库 模型调用 | 画布 NodePanel |

## 图标改名

| 旧名 | 新名 |
|---|---|
| upload | Upload |
| text | Text |
| calendar | Calendar |
| TextBlod | TextBold |
| DivdingLine | DividingLine |
| Light | Lightbulb |
| icon（扳手） | Tool |
| Cutting1 | Cutting |
| Snap1 | Snap |
| ShowConnections-1 | ShowConnections |

另外，添加节点面板里「文本生成」现在误用了 FontSize，应该用 Text。
