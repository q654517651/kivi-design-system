import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './upload.css';

export interface AddTileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 图标，默认 `AddSmall`，固定 20 */
  icon?: IconName;
  /** 图标下面的一行字，12 号，比如「Lora」。不传就只有图标；传了图标和文字都是 tertiary */
  label?: ReactNode;
  /** 禁用：图标和文字变灰，不能点 */
  disabled?: boolean;
  /** 说明，读屏用。不传时：有文字就用文字，否则「添加」 */
  'aria-label'?: string;
}

/**
 * 添加格：一个方格，中间图标，下面可以带一行字，点一下添加东西（参考素材、Lora、上传文件）。
 * 56 见方，白 10% 底（深底用 Light 1），圆角 8，悬停 14%、按下 18%。从素材库选还是从电脑上传都是它，点了打开什么由外面定。Figma 里是「参考素材 · 添加」
 */
export const AddTile = forwardRef<HTMLButtonElement, AddTileProps>(function AddTile(
  { icon = 'AddSmall', label, type = 'button', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const hasLabel = label != null && label !== false && label !== '';
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-add-tile', className)}
      data-labeled={hasLabel ? '' : undefined}
      aria-label={ariaLabel ?? (typeof label === 'string' && label ? label : '添加')}
      {...rest}
    >
      <Icon name={icon} size={20} />
      {hasLabel && <span className="kv-add-tile__label">{label}</span>}
    </button>
  );
});
AddTile.displayName = 'AddTile';
