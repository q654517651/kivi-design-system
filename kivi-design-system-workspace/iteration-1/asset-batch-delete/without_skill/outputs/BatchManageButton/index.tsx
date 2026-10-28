import CustomButton from '@/components/CustomButton';
import Icon from '@/components/Icon';
import classNames from 'classnames';
import styles from './index.module.less';

export interface BatchManageButtonProps {
  /** 是否处于批量管理模式 */
  active: boolean;
  /** 切换批量管理模式 */
  onChange: (active: boolean) => void;
  /** 列表为空时禁用（仅在未进入批量模式时生效，保证能退出） */
  disabled?: boolean;
  className?: string;
}

/**
 * 顶部筛选条右侧的「批量管理」入口
 * 进入后文案切换为「退出管理」，再次点击退出
 */
const BatchManageButton = ({ active, onChange, disabled, className }: BatchManageButtonProps) => {
  return (
    <CustomButton
      className={classNames(
        styles['batch_manage_button'],
        { [styles['batch_manage_button__active']]: active },
        className,
      )}
      fontSize="sm"
      fontWeight="regular"
      borderRadius="sm"
      spacing="xxs"
      textColor="primary"
      btnType="primary"
      height={32}
      disabled={!active && disabled}
      aria-pressed={active}
      onClick={() => onChange(!active)}
    >
      <Icon name={active ? 'Close' : 'Stacking'} size={16} />
      <span>{active ? $t('退出管理') : $t('批量管理')}</span>
    </CustomButton>
  );
};

export default BatchManageButton;
