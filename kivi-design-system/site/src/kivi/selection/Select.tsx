import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './selection.css';

export type SelectVariant = 'fill' | 'plain';

/**
 * 一项选项的数据。Select 本身只是触发器，不收选项；这份结构给拼列表时用（options.ts 里的各种选项都是它），
 * 拼法见 Select 的注释
 */
export interface SelectOption {
  /** 选项的值 */
  value: string;
  /** 列表里和选中后显示的文字 */
  label: string;
  /** 列表里这一项的左图标，比如模型 logo。选中后触发器的左图标也换成它 */
  icon?: IconName;
  /** 列表里的第二行说明。写了这一项就是两行菜单项（MenuItem description，图标 20，当前项打勾不加底）；触发器上只显示 label */
  description?: string;
  /** 试听的音频地址（音色选择用）：MenuItem 的 thumb 放 SelectPreview，点它只试听，不选中、不关列表。和 icon 二选一 */
  preview?: string;
  /** 禁用这一项：灰色，选不了，方向键跳过 */
  disabled?: boolean;
}

export interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 样式：填充 / 无底，默认填充。填充用在表单和面板里，宽度拉伸；无底用在工具条上，宽度跟着内容走 */
  variant?: SelectVariant;
  /** 显示的值：选中项的文字，或者参数摘要（「720P · 16:9 · 5s」）。没有时显示 placeholder */
  children?: ReactNode;
  /** 没有值时显示的占位文字。无底的占位就是入口名（「模型」「技能」），和有值一样白；填充的是灰的 */
  placeholder?: ReactNode;
  /** 左图标，16。选了带图标的选项时传选项的图标（比如模型 logo） */
  leftIcon?: IconName;
  /** 文字后面跟的小图标，16，和文字一样白，比如视频参数生成音频开着时的音量 */
  endIcon?: IconName;
}

/**
 * 下拉选择的触发器。Figma「选择」页 Select：只有 32 一档，文字 13，左图标 16、右箭头 16；展开时箭头朝上。
 * 只管触发器的样子，点开什么由外面套的 Dropdown 决定：
 *   选一个值：Dropdown haspopup="listbox" + Menu role="listbox" + MenuItem selected（当前项用「选中」底色，不打勾）。
 *     Dropdown 会把焦点和滚动放到选中项上；填充的列表和触发器一样宽（matchTriggerWidth），无底的不比触发器窄。
 *   点开一块面板（参数、日期、选择模型、技能）：Dropdown 里放面板，haspopup="dialog" 或默认的 menu。
 * Dropdown 给触发器写 aria-expanded，箭头跟着它换方向，不用自己传。其余原生 button 属性都能传。
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { variant = 'fill', children, placeholder, leftIcon, endIcon, type = 'button', className, ...rest },
  ref,
) {
  const filled = children !== undefined && children !== null && children !== false && children !== '';
  const open = rest['aria-expanded'] === true || rest['aria-expanded'] === 'true';
  return (
    <button ref={ref} type={type} className={cx('kv-select', `kv-select--${variant}`, className)} {...rest}>
      {leftIcon && <Icon name={leftIcon} className="kv-select__lead" data-filled={filled ? '' : undefined} />}
      <span className={cx('kv-select__text', !filled && 'kv-select__text--placeholder')}>{filled ? children : placeholder}</span>
      {endIcon && <Icon name={endIcon} className="kv-select__end" />}
      <Icon name={open ? 'UpArrowSmall' : 'DownArrowSmall'} className="kv-select__arrow" />
    </button>
  );
});
Select.displayName = 'Select';
