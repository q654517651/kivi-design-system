/**
 * 批量删除的二次确认，按规范 Dialog · S（400）。
 * 临时做法：项目里的 ConfirmModal / BaseModal 还是旧规格（遮罩带 24 模糊、底色 #2B2D31、
 * 确认用品牌按钮），这里按 v2 写；Dialog 组件迁移完成后替换。
 */
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import KiviButton, { KiviIconButton } from '../KiviButton';
import styles from './index.module.less';

interface DeleteConfirmDialogProps {
  open: boolean;
  /** 要删除的数量，写进标题 */
  count: number;
  /** 删除请求进行中：危险按钮转圈，取消和关闭不可点 */
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog = ({ open, count, loading = false, onCancel, onConfirm }: DeleteConfirmDialogProps) => {
  const titleId = useId();
  const descId = useId();

  const close = () => {
    if (!loading) onCancel();
  };

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    // 确认弹窗没有表单，点遮罩可以关闭
    <div className={styles.mask} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {$t('确认删除选中的 {count} 项吗？', { count })}
          </h2>
          <KiviIconButton icon="Close" tooltip={$t('关闭')} variant="text" size={32} disabled={loading} onClick={close} />
        </div>
        <p id={descId} className={styles.desc}>
          {$t('删除后，内容将无法找回')}
        </p>
        <div className={styles.footer}>
          {/* 默认聚焦「取消」，误按回车不会直接删 */}
          <KiviButton variant="secondary" size="lg" autoFocus disabled={loading} onClick={close}>
            {$t('取消')}
          </KiviButton>
          <KiviButton variant="danger" size="lg" loading={loading} onClick={onConfirm}>
            {$t('删除')}
          </KiviButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmDialog;
