import CustomButton from '@/components/CustomButton';
import { CustomMenu } from '@/components/CustomMenu';
import type { IMenuItem } from '@/components/CustomMenu/interface';
import Icon from '@/components/Icon';
import { Tooltip } from '@heroui/react';
import styles from './index.module.less';

/** 平台单次最多下载数量，与现有批量下载限制保持一致 */
export const MAX_BATCH_DOWNLOAD_COUNT = 20;

export interface BatchActionBarProps {
  /** 已选数量 */
  selectedCount: number;
  /** 「移动到」下拉项；接入时直接传 useFolderMenuItems 的返回值 */
  moveMenuItems: IMenuItem[];
  moveLoading?: boolean;
  downloadLoading?: boolean;
  onDownload: () => void;
  /** 点击删除：只负责打开二次确认，不直接删除 */
  onDelete: () => void;
}

const BUTTON_PROPS = {
  fontSize: 'sm',
  fontWeight: 'regular',
  borderRadius: 'sm',
  spacing: 'xxs',
  textColor: 'primary',
  btnType: 'primary',
  height: 32,
} as const;

/**
 * 批量管理底部浮动操作条
 * 需放在滚动容器内容（flex column）的最后一个子元素，靠 sticky 吸底
 */
const BatchActionBar = ({
  selectedCount,
  moveMenuItems,
  moveLoading,
  downloadLoading,
  onDownload,
  onDelete,
}: BatchActionBarProps) => {
  const hasSelection = selectedCount > 0;
  const overDownloadLimit = selectedCount > MAX_BATCH_DOWNLOAD_COUNT;

  return (
    <div className={styles['batch_action_bar']} role="toolbar" aria-label={$t('批量管理')}>
      <span className={styles['batch_action_bar-count']} aria-live="polite">
        {$t('已选 {count} 项', { count: selectedCount })}
      </span>
      <span className={styles['batch_action_bar-divider']} />

      {/* 移动到：在底部，菜单向上展开；hover 触发与现有「添加至」一致（CustomButton 走 onPress，click 触发不稳） */}
      <CustomMenu
        items={moveMenuItems}
        trigger={['hover']}
        placement="top"
        width={188}
        style={{ maxHeight: '360px', overflowY: 'auto' }}
        disabled={!hasSelection || moveLoading}
      >
        <CustomButton
          {...BUTTON_PROPS}
          className={styles['batch_action_bar-button']}
          disabled={!hasSelection}
          isLoading={moveLoading}
        >
          <Icon name="MoveTo" size={16} />
          <span>{$t('移动到')}</span>
          <Icon name="DownArrowSmall" size={16} className={styles['batch_action_bar-arrow']} />
        </CustomButton>
      </CustomMenu>

      {/* 下载：超过上限禁用并提示 */}
      <Tooltip
        placement="top"
        classNames={{
          base: 'custom-tooltip',
          content: 'custom-tooltip-content popup-light-2 icon-button-tooltip',
        }}
        isDisabled={!overDownloadLimit}
        content={
          <div className={styles['batch_action_bar-tooltip']}>
            {$t('当前选择数量已超过平台支持的最多下载数量（n个），请修改后再操作', { n: MAX_BATCH_DOWNLOAD_COUNT })}
          </div>
        }
      >
        <CustomButton
          {...BUTTON_PROPS}
          className={styles['batch_action_bar-button']}
          disabled={!hasSelection || overDownloadLimit}
          isLoading={downloadLoading}
          onClick={onDownload}
        >
          <Icon name="Download" size={16} />
          <span>{$t('下载')}</span>
        </CustomButton>
      </Tooltip>

      <CustomButton
        {...BUTTON_PROPS}
        className={styles['batch_action_bar-button']}
        disabled={!hasSelection}
        onClick={onDelete}
      >
        <Icon name="Delete" size={16} />
        <span>{$t('删除')}</span>
      </CustomButton>
    </div>
  );
};

export default BatchActionBar;
