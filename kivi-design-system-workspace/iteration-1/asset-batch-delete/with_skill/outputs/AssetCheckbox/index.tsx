/**
 * 规范 Checkbox · 圆形：图片多选用。16×16，不带文字，自己定位到图片右上角（距边 8），
 * 父元素需要 position: relative。
 * 临时做法：项目里的 CustomCheckbox 还是旧配色（白描边、黑 20% 底、#37FF74），迁移完成后替换。
 */
import classNames from 'classnames';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import styles from './index.module.less';

interface AssetCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /** 读屏用的名字，比如「选择第 3 张」 */
  ariaLabel?: string;
  className?: string;
}

const AssetCheckbox = ({ checked, disabled = false, onChange, ariaLabel, className }: AssetCheckboxProps) => {
  const toggle = (e: SyntheticEvent) => {
    // 批量管理时点整张卡片也会切换，这里拦住冒泡，避免切两次
    e.stopPropagation();
    if (disabled) return;
    onChange?.(!checked);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    toggle(e);
  };

  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      className={classNames(styles.checkbox, { [styles.checked]: checked, [styles.disabled]: disabled }, className)}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      {checked && (
        // 黑色对勾，线宽 1.5
        <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.75 8.25 7 10.5l4.25-4.75" />
        </svg>
      )}
    </span>
  );
};

export default AssetCheckbox;
