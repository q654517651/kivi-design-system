/**
 * 顶部筛选条最右边的「批量管理」开关按钮。
 * 进入批量管理后文字变成「退出管理」，再点一次退出。
 */
import KiviButton from '../KiviButton';
import styles from './index.module.less';

interface BatchManageButtonProps {
  /** 是否在批量管理中 */
  active: boolean;
  /** 列表为空时禁用（已经在批量管理中则不禁用，保证能退出） */
  disabled?: boolean;
  onChange: (active: boolean) => void;
}

const BatchManageButton = ({ active, disabled = false, onChange }: BatchManageButtonProps) => (
  // Button · 次要 · 中（32），和筛选条里的搜索框（Input · 中）同高
  <KiviButton
    className={styles.batchManageButton}
    variant="secondary"
    size="md"
    icon={active ? 'Close' : 'Stacking'}
    disabled={disabled && !active}
    aria-pressed={active}
    onClick={() => onChange(!active)}
  >
    {active ? $t('退出管理') : $t('批量管理')}
  </KiviButton>
);

export default BatchManageButton;
