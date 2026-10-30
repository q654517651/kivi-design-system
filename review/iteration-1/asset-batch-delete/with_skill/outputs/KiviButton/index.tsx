/**
 * 规范 v2 的 Button / IconButton。
 * 临时做法：项目里的 CustomButton 还是旧规格（没有危险类型，高度、圆角、字号都不对），
 * 这里按规范「按钮」的尺寸和状态写了一个最小实现，CustomButton 迁移完成后直接替换。
 */
import Icon from '@/components/Icon';
import { Tooltip } from '@heroui/react';
import classNames from 'classnames';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import styles from './index.module.less';

export type KiviButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

const VARIANT_CLASS: Record<KiviButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  text: styles.text,
  danger: styles.danger,
};

const SIZE_CLASS = {
  sm: styles.sizeSm, // 28
  md: styles.sizeMd, // 32，默认
  lg: styles.sizeLg, // 36，弹窗底栏、表单
};

export interface KiviButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: KiviButtonVariant;
  size?: keyof typeof SIZE_CLASS;
  /** 左图标，Icon 组件的 name，固定 16 */
  icon?: string;
  /** 加载中：底色和文字同默认，左边换成转圈的 Loading */
  loading?: boolean;
  children?: ReactNode;
}

const KiviButton = forwardRef<HTMLButtonElement, KiviButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, loading = false, disabled, className, children, onClick, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames(
        styles.button,
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        { [styles.interactive]: !disabled && !loading },
        className,
      )}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {(loading || icon) && <Icon name={icon ?? 'Loading'} isLoading={loading} size={16} />}
      {children}
    </button>
  ),
);
KiviButton.displayName = 'KiviButton';

const ICON_SIZE_CLASS = {
  28: styles.iconSize28, // 图标 16
  32: styles.iconSize32, // 图标 20，默认
  36: styles.iconSize36, // 图标 20
};

export interface KiviIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  icon: string;
  /** 必填：只有图标的按钮必须配 Tooltip，写清楚它做什么 */
  tooltip: string;
  variant?: 'secondary' | 'text';
  size?: keyof typeof ICON_SIZE_CLASS;
}

export const KiviIconButton = ({
  icon,
  tooltip,
  variant = 'text',
  size = 32,
  disabled,
  className,
  ...rest
}: KiviIconButtonProps) => (
  // Tooltip · 简单：目标下方 8px，延迟 500ms，不带箭头
  <Tooltip
    content={tooltip}
    placement="bottom"
    offset={8}
    delay={500}
    closeDelay={0}
    isDisabled={disabled}
    classNames={{ content: styles.tooltip }}
  >
    <button
      type="button"
      aria-label={tooltip}
      className={classNames(
        styles.button,
        styles.iconButton,
        ICON_SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        { [styles.interactive]: !disabled },
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      <Icon name={icon} size={size === 28 ? 16 : 20} />
    </button>
  </Tooltip>
);

export default KiviButton;
