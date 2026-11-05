import { forwardRef, useContext, useEffect, useId, useRef, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../utils';
import { composeHandlers } from '../hooks';
import { QuestionContext } from './QuestionContext';
import './agent.css';

export type QuestionOptionType = 'option' | 'other';

export interface QuestionOptionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** 类型：选项 / 其他，默认选项。「其他」可以直接输入，只有默认状态 */
  type?: QuestionOptionType;
  /** 编号。放进 QuestionPanel 里不写会按顺序补 1、2、3 */
  index?: ReactNode;
  /** 选项的值，QuestionPanel 靠它记哪些选中。不写取编号 */
  value?: string;
  /** 选中：放进 QuestionPanel 里由它管，单独用时才需要写 */
  checked?: boolean;
  /** 禁用：不能点、不能输入。放进 QuestionPanel 里面板禁用时一起禁用 */
  disabled?: boolean;
  /** 选项文字（「其他」没有，是输入框） */
  children?: ReactNode;
  /** 「其他」的占位文字，默认「其他，请直接输入」 */
  placeholder?: string;
  /** 「其他」里输入框的属性，比如 value、onChange */
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

/** 追问面板里的一个选项。ref 给根元素：「其他」是 label，其余是 button。Figma「Agent」页 _QuestionOption，不发布，只在 QuestionPanel 里用 */
export const QuestionOption = forwardRef<HTMLElement, QuestionOptionProps>(function QuestionOption(
  {
    type = 'option',
    index,
    value,
    checked: checkedProp,
    disabled: disabledProp,
    children,
    placeholder = '其他，请直接输入',
    inputProps,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  const ctx = useContext(QuestionContext);
  const disabled = disabledProp || ctx?.disabled || undefined;
  const id = useId();

  // 「其他」里有没有字，告诉面板
  const reportOther = ctx?.reportOther;
  const controlled = inputProps?.value;
  const initial = inputProps?.defaultValue;
  useEffect(() => {
    if (type !== 'other' || !reportOther) return;
    reportOther(id, String(controlled ?? initial ?? '').trim() !== '');
    return () => reportOther(id, false);
  }, [type, id, reportOther, controlled, initial]);

  // 单选时选了选项，面板叫「其他」清空：直接改输入框的值再发 input 事件，受控、非受控都会收到 onChange
  const inputRef = useRef<HTMLInputElement>(null);
  const registerOther = ctx?.registerOther;
  useEffect(() => {
    if (type !== 'other' || !registerOther) return;
    return registerOther(id, () => {
      const input = inputRef.current;
      if (!input || input.value === '') return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }, [type, id, registerOther]);

  if (type === 'other') {
    return (
      <label
        ref={ref as Ref<HTMLLabelElement>}
        className={cx('kv-question-option', 'kv-question-option--other', className)}
        onClick={onClick}
        data-disabled={disabled ? '' : undefined}
        {...rest}
      >
        <span className="kv-question-option__index">{index}</span>
        <input
          ref={inputRef}
          className="kv-question-option__input"
          placeholder={placeholder}
          {...inputProps}
          // 面板禁用时强制禁用，inputProps 里的 disabled 不能覆盖
          disabled={disabled || inputProps?.disabled}
          onChange={composeHandlers(inputProps?.onChange, (e) => {
            const filled = e.currentTarget.value.trim() !== '';
            reportOther?.(id, filled);
            if (filled) ctx?.clearSelection();
          })}
        />
      </label>
    );
  }

  const key = value ?? (index != null ? String(index) : '');
  const checked = checkedProp ?? (ctx ? ctx.value.includes(key) : false);

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      role={ctx?.multiple ? 'checkbox' : 'radio'}
      aria-checked={checked}
      disabled={disabled}
      // 单选只有一个 Tab 停点，组内用方向键换（QuestionPanel 管）；多选各自能 Tab
      tabIndex={ctx && !ctx.multiple ? (key === ctx.tabStop ? 0 : -1) : undefined}
      className={cx('kv-question-option', className)}
      onClick={composeHandlers(onClick, () => ctx?.toggle(key))}
      {...rest}
    >
      <span className="kv-question-option__index">{index}</span>
      <span className="kv-question-option__text">{children}</span>
    </button>
  );
});
QuestionOption.displayName = 'QuestionOption';
