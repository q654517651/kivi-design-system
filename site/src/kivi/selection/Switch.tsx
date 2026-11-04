import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import { composeHandlers, useControllable } from '../hooks';
import './selection.css';

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children' | 'role' | 'value' | 'defaultValue' | 'defaultChecked'> {
  /** 开关：开 true / 关 false。传了就是受控，要自己在 onChange 里更新 */
  checked?: boolean;
  /** 非受控时的初始值，默认关 */
  defaultChecked?: boolean;
  /** 点一下或按空格、回车时触发，参数是切换后的值 */
  onChange?: (checked: boolean) => void;
  /** 禁用：整体透明度 30%，不能点，文字一起。开、关都一样 */
  disabled?: boolean;
  /** 文字，13 号常规，写在开关左边，间距 8；点文字也能切换。不写就只有开关，这时必须写 aria-label */
  children?: ReactNode;
}

/**
 * 只有开和关两个状态，点一下立刻生效。Figma「选择控件」页 Switch。
 * 可以带文字（`children`，和 Checkbox 一样整行都能点）；没有文字时必须写 aria-label。
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked = false, onChange, className, onClick, disabled, type = 'button', children, ...rest },
  ref,
) {
  const [on, setOn] = useControllable(checked, defaultChecked, onChange);

  return (
    <button
      ref={ref}
      type={type}
      role="switch"
      aria-checked={on}
      className={cx('kv-switch', className)}
      disabled={disabled}
      onClick={composeHandlers(onClick, () => setOn(!on))}
      {...rest}
    >
      {children != null && children !== false && <span className="kv-switch__label">{children}</span>}
      <span className="kv-switch__track" />
    </button>
  );
});
Switch.displayName = 'Switch';
