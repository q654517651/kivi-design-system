import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { composeHandlers, useControllable } from '../hooks';
import './selection.css';

export type CheckboxShape = 'square' | 'round';
export type CheckboxChecked = boolean | 'mixed';

export interface CheckboxProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'value' | 'defaultValue' | 'defaultChecked'> {
  /** 形状：方形 / 圆形，默认方形。方形用在列表和表单，圆形用在图片多选 */
  shape?: CheckboxShape;
  /** 选中：true 是 / false 否 / 'mixed' 部分。传了就是受控，要自己在 onChange 里更新 */
  checked?: CheckboxChecked;
  /** 非受控时的初始值，默认否 */
  defaultChecked?: CheckboxChecked;
  /** 点一下或按空格时触发，参数是点完的值；「部分」点完变成 true */
  onChange?: (checked: boolean) => void;
  /** 禁用：整体透明度 30%，方框和文字一起 */
  disabled?: boolean;
  /** 文字，13 号常规。圆形放在图片上时不带文字，要写 aria-label */
  children?: ReactNode;
}

/**
 * 可以多选的勾选框。Figma「选择控件」页 Checkbox。
 * 「部分」只给全选框用：下面选了一部分时显示。整行（方框加文字）都能点。
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { shape = 'square', checked, defaultChecked = false, onChange, className, children, onClick, type = 'button', ...rest },
  ref,
) {
  const [state, setState] = useControllable<CheckboxChecked>(checked, defaultChecked, (next) => onChange?.(next === true));

  return (
    <button
      ref={ref}
      type={type}
      role="checkbox"
      aria-checked={state}
      className={cx('kv-checkbox', `kv-checkbox--${shape}`, className)}
      onClick={composeHandlers(onClick, () => setState(state !== true))}
      {...rest}
    >
      <span className="kv-checkbox__box" />
      {children != null && children !== false && <span>{children}</span>}
    </button>
  );
});
Checkbox.displayName = 'Checkbox';
