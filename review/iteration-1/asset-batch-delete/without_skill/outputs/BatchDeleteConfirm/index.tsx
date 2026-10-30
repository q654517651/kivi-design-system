import ConfirmModal from '@/components/ConfirmModal';
import { useState } from 'react';

export interface BatchDeleteConfirmProps {
  open: boolean;
  /** 待删除数量 */
  count: number;
  onCancel: () => void;
  /** 确认删除；返回 Promise 时按钮自动 loading，成功后由父组件关闭弹窗 */
  onConfirm: () => Promise<void> | void;
}

/**
 * 批量删除二次确认
 * 复用现有 ConfirmModal，补充数量文案和 loading 管理
 */
const BatchDeleteConfirm = ({ open, count, onCancel, onConfirm }: BatchDeleteConfirmProps) => {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmModal
      title={count > 1 ? $t('确认删除选中的 {count} 项内容吗？', { count }) : $t('确认删除该内容吗？')}
      desc={$t('删除后，内容将无法找回')}
      // 删除进行中不允许关闭
      onClose={() => !loading && onCancel()}
      onSubmit={handleSubmit}
      isLoading={loading}
    />
  );
};

export default BatchDeleteConfirm;
