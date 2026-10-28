/**
 * 接入示例：把四块拼在一起，用假数据跑通「批量管理 → 勾选 → 移动 / 下载 / 删除」。
 * 不接接口：三个操作都是假请求。接入真实页面时：
 *   - 筛选条：用 BatchManageButton 替换现有的 BatchOperations；
 *   - 资产卡片（AssetsListItem）：批量管理时隐藏悬停操作，在右上角放 AssetCheckbox；
 *   - 操作条和二次确认挂在 MyAssetsContent 里。
 */
import classNames from 'classnames';
import { useState } from 'react';
import AssetCheckbox from '../AssetCheckbox';
import BatchActionBar, { FolderOption } from '../BatchActionBar';
import BatchManageButton from '../BatchManageButton';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import styles from './index.module.less';

interface MockAsset {
  id: string;
  url: string;
}

// 假数据，仅演示用
const MOCK_ASSETS: MockAsset[] = Array.from({ length: 21 }, (_, i) => ({
  id: `asset-${i + 1}`,
  url: `https://picsum.photos/seed/kivi-${i + 1}/400/400`,
}));
const MOCK_FOLDERS: FolderOption[] = [
  { id: 1, name: '产品图' },
  { id: 2, name: '海报素材' },
  { id: 3, name: '短视频封面' },
];
const mockRequest = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

const MyAssetsBatchExample = () => {
  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [moving, setMoving] = useState(false);

  // 进入、退出批量管理都清空选择
  const changeBatchMode = (active: boolean) => {
    setIsBatchMode(active);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 成功后退出批量管理（和现有 BatchOperations 一致）；失败时保留选择，方便重试
  const runBatchAction = async (setLoading: (loading: boolean) => void, request: () => Promise<void>) => {
    setLoading(true);
    try {
      await request();
      changeBatchMode(false);
    } catch {
      // 接入时：这里弹错误 Toast
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTo = (_folderId: number) => {
    // 接入时：folderActions.moveAssetsToFolder(_folderId, [...selectedIds])
    runBatchAction(setMoving, mockRequest);
  };

  const handleCreateFolder = () => {
    // 接入时：先 folderActions.openCreateFolderModal() 拿到新文件夹 id，再走 handleMoveTo
    runBatchAction(setMoving, mockRequest);
  };

  const handleDownload = () => {
    // 接入时：1 个用 downloadMediaWithRecord，多个用 batchDownloadImages
    runBatchAction(setDownloading, mockRequest);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      // 接入时：requestKivi.post(API.deleteAssets, { state: true, asset_ids: [...selectedIds] })
      await mockRequest();
      setAssets((prev) => prev.filter((asset) => !selectedIds.has(asset.id)));
      setConfirmOpen(false);
      changeBatchMode(false);
    } catch {
      // 接入时：弹错误 Toast，弹窗保持打开
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* 顶部筛选条：现有的选项卡、收藏、时间筛选、搜索框原样放在前面 */}
      <div className={styles.filterBar}>
        <BatchManageButton active={isBatchMode} disabled={!assets.length} onChange={changeBatchMode} />
      </div>

      <div className={classNames(styles.grid, { [styles.gridWithBar]: isBatchMode })}>
        {assets.map((asset, index) => {
          const checked = selectedIds.has(asset.id);
          return (
            <div
              key={asset.id}
              className={classNames(styles.card, { [styles.cardSelectable]: isBatchMode })}
              // 批量管理时点整张图切换勾选；平时照旧打开详情
              onClick={isBatchMode ? () => toggleSelected(asset.id) : undefined}
            >
              <img className={styles.media} src={asset.url} alt="" loading="lazy" draggable={false} />
              {isBatchMode && (
                <AssetCheckbox
                  checked={checked}
                  ariaLabel={$t('选择第 {n} 项', { n: index + 1 })}
                  onChange={() => toggleSelected(asset.id)}
                />
              )}
              {/* 非批量管理时：这里是现有的悬停操作（右上角 on-media IconButton），批量管理时不渲染 */}
            </div>
          );
        })}
      </div>

      {isBatchMode && (
        <BatchActionBar
          count={selectedIds.size}
          folders={MOCK_FOLDERS}
          moving={moving}
          downloading={downloading}
          onMoveTo={handleMoveTo}
          onCreateFolder={handleCreateFolder}
          onDownload={handleDownload}
          onDelete={() => setConfirmOpen(true)}
        />
      )}

      <DeleteConfirmDialog
        open={confirmOpen}
        count={selectedIds.size}
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MyAssetsBatchExample;
