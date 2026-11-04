import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../utils';
import './generation.css';

/*
  「模板 · 画布」页的参数面板：玻璃浮层里一块块参数。放进 ParamPicker 用。
*/

export type ParamPanelProps = HTMLAttributes<HTMLDivElement>;

/** 参数面板的外框：玻璃浮层，里面一块块 ParamField 竖着排。一般不单独用，放进 ParamPicker。Figma「模板 · 画布」页「参数面板」 */
export const ParamPanel = forwardRef<HTMLDivElement, ParamPanelProps>(function ParamPanel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('kv-param-panel', className)} role="group" {...rest} />;
});
ParamPanel.displayName = 'ParamPanel';

export interface ParamFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 这一块的标题，比如「选择比例」 */
  label: ReactNode;
}

/** 参数面板里的一块：上面标题，下面控件（分段 Tabs、刻度滑块 Slider + 数字输入框 NumberInput） */
export const ParamField = forwardRef<HTMLDivElement, ParamFieldProps>(function ParamField(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-param-field', className)} {...rest}>
      <div className="kv-param-field__label">{label}</div>
      <div className="kv-param-field__body">{children}</div>
    </div>
  );
});
ParamField.displayName = 'ParamField';
