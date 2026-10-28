# 旧名对照

看到旧设计稿、旧名字时，按下表换成新的。内容来自 Figma 各页的「迁移映射」。


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
| 旧库 Button Size=large（44） | Button · 大（36、圆角 8、13 粗） |
| 旧库 Button Content=icon-only、ICON background=32 | IconButton；当前工具用「选中」 |
| IconButton 40 | IconButton 32 |
| 侧栏、消息操作里的灰色 IconButton | IconButton · 弱 |
| ToolbarButton、ToolbarItem（填充 / 玻璃） | Button 中 · 文字、IconButton 32 · 文字；玻璃 → 类型=浮层 |
| CustomMenu、AnchoredDropdown、CommonDropdown、菜单容器 | 菜单模板 + MenuItem |
| MenuItem 44 高、圆角 12、14 号 | MenuItem 36 高、圆角 8、13 号 |
| MenuItemAsset | MenuItem 打开「缩略图」 |
| .custom-tooltip、ChatTooltip | Tooltip · 简单 / 说明 |
| CustomTab | 选值的 → 分段选择器；切换内容的 → 选项卡 TabItem |
| 比例、分辨率一个个独立方块 | 分段选择器（选项放进同一条底槽） |
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

