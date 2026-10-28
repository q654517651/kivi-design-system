# 我的资产 · 批量管理：说明和假设

## 文件
| 目录 | 是什么 |
|---|---|
| BatchManageButton | 筛选条最右边的「批量管理」按钮（次要 · 中 32，Stacking 图标），进入后变成「退出管理」（Close 图标） |
| AssetCheckbox | 图片右上角的圆形勾选框（16，距边 8） |
| BatchActionBar | 底部浮出的操作条：已选 N 项 + 移动到 / 下载 / 删除，「移动到」带文件夹菜单 |
| DeleteConfirmDialog | 删除二次确认（Dialog · S 400，取消 + 危险按钮） |
| KiviButton | 按 v2 规格写的 Button / IconButton（含 Tooltip），上面几块共用 |
| MyAssetsBatchExample | 接入示例，假数据跑通全流程，不接接口 |

## 假设（需要产品 / 设计确认）
1. **操作条样式**：规范里没有批量操作条，按「盖在内容上的常驻浮条」处理：surface 底 + 1px border-subtle，圆角 12，底部居中距底 24，不加投影。属于临时做法。
2. **0 项时**：操作条照常显示「已选 0 项」，三个按钮禁用。
3. **条上的「删除」用文字型按钮，不标红**；红色危险按钮只用在二次确认里（规范：危险按钮给不可撤销操作的确认）。
4. **选中的图片只靠勾选框表示**，不加描边或蒙层：规范没定义图片选中态。
5. 批量管理时点整张图也能切换勾选；悬停操作按钮（下载、收藏等）隐藏。
6. 「移动到」点击后向上弹出玻璃菜单：第一项「新建文件夹」，下面是文件夹列表，文件夹数据由调用方传入。
7. 移动、下载、删除成功后退出批量管理，和现有 BatchOperations 一致；失败时保留选择。
8. 文案：「批量管理」「退出管理」「已选 {count} 项」「确认删除选中的 {count} 项吗？」「删除后，内容将无法找回」（沿用现有 key）。新增 i18n key：批量管理、退出管理、移动到、关闭、已选 {count} 项、确认删除选中的 {count} 项吗？、选择第 {n} 项。

## 没做的（接入时补）
- 全选、下载上限 20 个（现有 BatchOperations 有这个限制，要保留）、收藏、移出文件夹：需求里没提。
- 操作结果提示：现在项目用 antd message，规范要换成 Toast。

## 和规范 / 代码的差异
- **临时实现**：KiviButton、AssetCheckbox、DeleteConfirmDialog 是按 v2 规格写的。现有的 CustomButton（没有危险类型、尺寸不对）、CustomCheckbox（旧配色）、ConfirmModal / BaseModal（遮罩模糊、#2B2D31、确认用品牌按钮）还是旧规格，迁移完成后替换。
- v2 新变量（surface、mask、glass、on-media、font-size-13、font-weight-medium、font-family 等）代码里还没有，全部带了兜底值。
- **占位值**：status-danger、border-strong、brand-hover 还没定稿，代码注释里已标出。
- **图标**：MoveTo 是规范里的图标名，但代码里还没用过（旧代码「添加至」用的是 RemoveFromFolder），要确认 iconfont 里有 MoveTo。
- 示例页的图片来自 picsum，只用来演示。
