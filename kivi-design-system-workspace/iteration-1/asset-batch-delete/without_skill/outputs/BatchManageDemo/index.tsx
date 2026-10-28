import type { IMenuItem } from '@/components/CustomMenu/interface';
import { message } from 'antd';
import { useState } from 'react';
import AssetSelectOverlay from '../AssetSelectOverlay';
import BatchActionBar from '../BatchActionBar';
import BatchDeleteConfirm from '../BatchDeleteConfirm';
import BatchManageButton from '../BatchManageButton';
import styles from './index.module.less';

/**
 * 组装示例：用 mock 数据串起四个组件，演示完整交互（不接接口）
 * 真实接入见 NOTES.md「接入方式」
 */

const MOCK_ASSETS = Array.from({ length: 30 }, (_, i) => ({
  id: `asset_${i + 1}`,
  cover: `linear-gradient(135deg, hsl(${(i * 37) % 360} 45% 32%), hsl(${(i * 37 + 60) % 360} 50% 18%))`,
}));
const MOCK_FOLDERS = [
  { id: 1, name: '灵感收集' },
  { id: 2, name: '海报' },
  { id: 3, name: '角色设定' },
];
const mockRequest = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

const BatchManageDemo = () => {
  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [isBatch, setIsBatch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const selectedCount = selectedIds.size;

  const exitBatch = () => {
    setIsBatch(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const moveMenuItems: IMenuItem[] = MOCK_FOLDERS.map((folder) => ({
    key: folder.id,
    label: folder.name,
    onClick: async () => {
      setMoveLoading(true);
      await mockRequest();
      setMoveLoading(false);
      message.success($t('移动成功'));
      exitBatch();
    },
  }));

  const handleDownload = async () => {
    setDownloadLoading(true);
    await mockRequest();
    setDownloadLoading(false);
    exitBatch();
  };

  const handleConfirmDelete = async () => {
    await mockRequest();
    setAssets((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setDeleteOpen(false);
    exitBatch();
    message.success($t('删除成功'));
  };

  return (
    <div className={styles['batch_manage_demo']}>
      <div className={styles['batch_manage_demo-content']}>
        {/* 顶部筛选条（示意） */}
        <div className={styles['batch_manage_demo-top']}>
          <span className={styles['batch_manage_demo-title']}>{$t('我的资产')}</span>
          <BatchManageButton
            active={isBatch}
            disabled={!assets.length}
            onChange={(active) => (active ? setIsBatch(true) : exitBatch())}
          />
        </div>

        <div className={styles['batch_manage_demo-list']}>
          {assets.map((item) => (
            <div key={item.id} className={styles['batch_manage_demo-card']} style={{ background: item.cover }}>
              {isBatch && (
                <AssetSelectOverlay
                  checked={selectedIds.has(item.id)}
                  onChange={(checked) => toggleSelect(item.id, checked)}
                />
              )}
            </div>
          ))}
        </div>

        {isBatch && (
          <BatchActionBar
            selectedCount={selectedCount}
            moveMenuItems={moveMenuItems}
            moveLoading={moveLoading}
            downloadLoading={downloadLoading}
            onDownload={handleDownload}
            onDelete={() => setDeleteOpen(true)}
          />
        )}
      </div>

      <BatchDeleteConfirm
        open={deleteOpen}
        count={selectedCount}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BatchManageDemo;
