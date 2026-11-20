import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './upload.css';

export interface AddTileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 尺寸：56 用在画布生成面板、Lora 栏；72 给主站输入框的首尾帧空格和 Lora 格（和旁边 72 的参考区一样大）。默认 56 */
  size?: 56 | 72;
  /** 类型：默认只有底色；描边 `outline` 再加一圈弱描边（border-subtle）。所有上传占位都用描边（参考素材、首尾帧空格、对口型、拼接，11-19 用户定），不是上传的（添加 Lora）用默认 */
  variant?: 'default' | 'outline';
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
 * 56 见方（主站首尾帧 72），白 10% 底（深底用 Light 1），圆角 8，悬停 14%、按下 18%。从素材库选还是从电脑上传都是它，点了打开什么由外面定。Figma 里是「参考素材 · 添加」
 */
export const AddTile = forwardRef<HTMLButtonElement, AddTileProps>(function AddTile(
  { size = 56, variant = 'default', icon = 'AddSmall', label, type = 'button', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const hasLabel = label != null && label !== false && label !== '';
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-add-tile', size === 72 && 'kv-add-tile--72', variant === 'outline' && 'kv-add-tile--outline', className)}
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
