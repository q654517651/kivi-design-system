import { Children, cloneElement, forwardRef, isValidElement, useCallback, useMemo, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { Button, IconButton } from '../button';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import { QuestionContext } from './QuestionContext';
import { QuestionOption, type QuestionOptionProps } from './QuestionOption';
import './agent.css';

export interface QuestionPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onChange' | 'defaultValue'> {
  /** 题目，14 粗，比如「1. 你喜欢小猫吗？（2 个选项）」 */
  title: ReactNode;
  /** 分页文字，比如「1/5」。不传就不显示分页（显示分页 = 关） */
  pager?: ReactNode;
  /** 点分页左边的「上一题」 */
  onPrev?: () => void;
  /** 点分页右边的「下一题」 */
  onNext?: () => void;
  /** 多选：默认单选，只有一项选中；多选可以选多项 */
  multiple?: boolean;
  /** 选中的值：受控。单选最多一项，值是 QuestionOption 的 value */
  value?: string[];
  /** 选中的值：非受控的初始值 */
  defaultValue?: string[];
  /** 选中变化时触发 */
  onChange?: (value: string[]) => void;
  /** 显示「忽略」（跳过这道题），默认开 */
  skip?: boolean;
  /** 「忽略」按钮的文字，默认「忽略」 */
  skipText?: ReactNode;
  /** 点「忽略」 */
  onSkip?: () => void;
  /** 「确认提交」按钮的文字，默认「确认提交」 */
  submitText?: ReactNode;
  /** 点「确认提交」。一项都没选、「其他」也没填字时按钮不能点 */
  onSubmit?: () => void;
  /** 禁用：整个面板不能操作，提交中用 */
  disabled?: boolean;
  /** 选项：QuestionOption，最后一个可以是 type="other" */
  children?: ReactNode;
}

/** 追问面板：Agent 追问时停在输入框的位置，替换掉输入框。Figma「Agent」页 QuestionPanel */
export const QuestionPanel = forwardRef<HTMLElement, QuestionPanelProps>(function QuestionPanel(
  {
    title,
    pager,
    onPrev,
    onNext,
    multiple = false,
    value: valueProp,
    defaultValue = [],
    onChange,
    skip = true,
    skipText = '忽略',
    onSkip,
    submitText = '确认提交',
    onSubmit,
    disabled = false,
    children,
    className,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onChange);

  const toggle = useCallback(
    (v: string) => {
      setValue(multiple ? (value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) : value.includes(v) ? [] : [v]);
    },
    [multiple, value, setValue],
  );
  // 「其他」里有字的算选了：记哪几个「其他」填了字
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const reportOther = useCallback((id: string, on: boolean) => {
    setFilled((f) => (f[id] === on ? f : { ...f, [id]: on }));
  }, []);
  const canSubmit = value.length > 0 || Object.values(filled).some(Boolean);

  // 没写编号的选项按顺序补 1、2、3；顺便找出单选的 Tab 停点
  const keys: string[] = [];
  const options = Children.toArray(children).map((child, i) => {
    if (!isValidElement(child) || child.type !== QuestionOption) return child;
    const props = child.props as QuestionOptionProps;
    if (props.type !== 'other' && !props.disabled) {
      keys.push(props.value ?? String(props.index ?? i + 1));
    }
    return props.index == null ? cloneElement(child as ReactElement<QuestionOptionProps>, { index: i + 1 }) : child;
  });
  const tabStop = value.find((v) => keys.includes(v)) ?? keys[0];

  const ctx = useMemo(
    () => ({ multiple, value, toggle, disabled, tabStop, reportOther }),
    [multiple, value, toggle, disabled, tabStop, reportOther],
  );

  // 单选用方向键换：上、左到上一项，下、右到下一项，首尾相接；焦点到哪就选到哪（和原生单选一样）
  const onOptionsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (multiple || disabled) return;
    const move = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!move || (e.target as HTMLElement).getAttribute('role') !== 'radio') return;
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not(:disabled)'));
    const at = radios.indexOf(e.target as HTMLButtonElement);
    const next = radios[(at + move + radios.length) % radios.length];
    if (!next || next === e.target) return;
    e.preventDefault();
    next.focus();
    if (next.getAttribute('aria-checked') !== 'true') next.click();
  };

  return (
    <section
      ref={ref}
      className={cx('kv-question-panel', className)}
      aria-label="追问"
      aria-busy={disabled || undefined}
      data-disabled={disabled ? '' : undefined}
      {...rest}
    >
      <div className="kv-question-panel__head">
        <div className="kv-question-panel__title">{title}</div>
        {pager != null && (
          <div className="kv-question-panel__pager">
            <IconButton icon="LeftArrowSmall" label="上一题" size={28} variant="text" onClick={onPrev} disabled={disabled} />
            <span>{pager}</span>
            <IconButton icon="RightArrowSmall" label="下一题" size={28} variant="text" onClick={onNext} disabled={disabled} />
          </div>
        )}
      </div>
      <QuestionContext.Provider value={ctx}>
        <div
          className="kv-question-panel__options"
          role={multiple ? 'group' : 'radiogroup'}
          aria-label={typeof title === 'string' ? title : undefined}
          aria-disabled={disabled || undefined}
          onKeyDown={onOptionsKeyDown}
        >
          {options}
        </div>
      </QuestionContext.Provider>
      <div className="kv-question-panel__actions">
        {skip && (
          <Button variant="text" onClick={onSkip} disabled={disabled}>
            {skipText}
          </Button>
        )}
        <Button variant="primary" onClick={onSubmit} disabled={disabled || !canSubmit}>
          {submitText}
        </Button>
      </div>
    </section>
  );
});
QuestionPanel.displayName = 'QuestionPanel';
