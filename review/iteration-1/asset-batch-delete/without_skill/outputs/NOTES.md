# 我的资产 · 批量管理

## 文件

| 目录 | 内容 |
| --- | --- |
| `BatchManageButton/` | 顶部筛选条右侧「批量管理 / 退出管理」切换按钮 |
| `AssetSelectOverlay/` | 卡片选择层：右上角勾选框，整卡可点，选中后描品牌色边 |
| `BatchActionBar/` | 底部浮动操作条：已选 N 项 / 移动到 / 下载 / 删除 |
| `BatchDeleteConfirm/` | 删除二次确认（包了一层现有 `ConfirmModal`，只有 tsx） |
| `BatchManageDemo/` | 用 mock 数据把上面四个串起来的示例，不接接口 |

## 假设（没有设计稿）

1. 这是对现有「批量编辑」（`BatchOperations`，顶部一排按钮）的改版：入口改名「批量管理」，操作挪到底部浮条。需求里没提「全选」「收藏」「移出文件夹」，这次没放，要加的话放进 `BatchActionBar` 就行。
2. 视觉全部沿用现有 token 和组件：`CustomButton` 32px、`CustomCheckbox`（绿色）、`popup-light-2` 背景、品牌绿 `--color-brand-solid` 作选中描边。没有新增颜色。
3. 勾选框从原来的左上角挪到右上角。批量模式下原来右上角的 hover 按钮本来就隐藏，不冲突。整张卡片都能点着切换选中，不再打开详情。
4. 一进批量模式就出现底部条，选 0 项时三个按钮置灰。退出入口只有顶部「退出管理」，另外操作成功后自动退出（沿用现有行为）。
5. 「移动到」就是现有的「添加至文件夹」，菜单项直接传 `useFolderMenuItems` 的返回值（带「新建文件夹」）。hover 时向上展开，跟现有「添加至」的触发方式一样。
6. 下载沿用现有 20 个的上限，超过就置灰，并用 tooltip 提示。
7. 删除确认沿用现有 `ConfirmModal` 样式，确认按钮是品牌色，不是红色。只删 1 项时用原文案，多项时显示数量。删除过程中不能关闭弹窗。
8. 底部条用 `sticky` 吸底，没用 `fixed`。这样它会自动在内容区居中，不用去算侧边栏宽度。前提是它必须放在滚动内容（flex column）的最后一个子元素。

## 接入 `MyAssetsContent`（复用现有状态，改动最小）

- 顶部：把 `<BatchOperations …/>` 换成 `<BatchManageButton active={isBatchSelect} onChange={setIsBatchSelect} disabled={!assetsList.length} />`。
- `AssetsListItem`：把 `isBatchSelect && <CustomCheckbox …/>` 换成 `<AssetSelectOverlay checked={!!item.selected} onChange={(c) => setAssetsListSelected('selected', c, [item.asset_id || ''])} />`。批量模式下不渲染 `.more-icon-box`。
- `.my_assets_content` 的最后一个子元素放 `{isBatchSelect && <BatchActionBar … onDelete={() => setDeleteAssetInfo({ isOpen: true, assetInfo: selectAssets })} />}`。下载、移动的逻辑（含埋点）从 `BatchOperations` 原样搬过来。
- 删除确认：现有 `ConfirmModal` 换成 `<BatchDeleteConfirm open={deleteAssetInfo.isOpen} count={deleteAssetInfo.assetInfo?.length ?? 0} onCancel={…} onConfirm={handleDelete} />`。

## 需要补的多语言 key（zh-CN / en-US）

不补的话 `formatMessage` 不会替换 `{count}`。

- `批量管理`：Batch manage
- `退出管理`：Exit
- `已选 {count} 项`：{count} selected
- `移动到`：Move to
- `确认删除选中的 {count} 项内容吗？`：Delete {count} selected items?
- `移动成功`：Moved（只有 demo 用到）

## 没验证的地方

仓库没装 `node_modules`，所以没跑 tsc，也没在页面里实际渲染过。图标名（`Stacking` / `Close` / `MoveTo` / `DownArrowSmall` / `Download` / `Delete`）都取自仓库里已经在用的。
