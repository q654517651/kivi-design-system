import { forwardRef, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './date.css';

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** 选中的日子。传了就是受控 */
  value?: Date | null;
  /** 非受控时的初始值 */
  defaultValue?: Date | null;
  /** 点了一天，参数是那一天（0 点） */
  onChange?: (date: Date) => void;
  /** 显示哪个月（取这天所在的月）。传了就是受控 */
  month?: Date;
  /** 非受控时一开始显示的月，默认选中那天的月，没选就是今天的月 */
  defaultMonth?: Date;
  /** 翻月了，参数是那个月的 1 号 */
  onMonthChange?: (month: Date) => void;
  /** 最早能选的日子，再早的变灰不能点，也翻不过去 */
  min?: Date;
  /** 最晚能选的日子，再晚的变灰不能点，也翻不过去。筛选「已经发生的事」传今天 */
  max?: Date;
  /** 另外不能选的日子，返回 true 就变灰 */
  disabledDate?: (date: Date) => boolean;
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/** 去掉时分秒 */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
/** 翻月保持「几号」：目标月没有这一天（3/31 往前翻）就取目标月最后一天 */
const shiftMonth = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const sameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && a.toDateString() === b.toDateString();
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 单月日历：点一天选它。一周从周日开始，6 行 42 格，不是这个月的日子淡一档、也能点。
 * 方向键按天 / 按周移动，PageUp / PageDown 翻月，Home / End 到这一周的头尾，Enter / 空格选中。
 * 照 Figma 旧版 KIVI 3.5-3.14（13110:30974）和线上 TimeRangeFilter，V2 还没有，待确认
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  { value, defaultValue = null, onChange, month, defaultMonth, onMonthChange, min, max, disabledDate, className, onKeyDown, ...rest },
  ref,
) {
  const [selected, setSelected] = useControllable<Date | null>(value, defaultValue, (d) => d && onChange?.(d));
  const [shown, setShown] = useControllable<Date>(
    month && startOfMonth(month),
    startOfMonth(defaultMonth ?? value ?? defaultValue ?? new Date()),
    onMonthChange,
  );
  const lo = min && startOfDay(min);
  const hi = max && startOfDay(max);
  const isDisabled = (d: Date) => (lo && d < lo) || (hi && d > hi) || !!disabledDate?.(d);

  // 键盘焦点所在的那一天（roving tabindex）：默认选中的、否则今天、否则这个月 1 号
  const [focus, setFocus] = useState<Date>(() => startOfDay(selected ?? new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  const first = startOfMonth(shown);
  const days = useMemo(() => {
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first.getTime()]);
  const focusInView = days.some((d) => sameDay(d, focus) && d.getMonth() === first.getMonth())
    ? focus
    : days.find((d) => sameDay(d, selected) && d.getMonth() === first.getMonth()) ?? first;

  // 键盘移动后把焦点挪到新的那一格
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  // 翻不过 min / max 所在的月；一次翻一年翻过头了就停在那个月
  const canPrev = !lo || first > startOfMonth(lo);
  const canNext = !hi || first < startOfMonth(hi);
  const go = (n: number) => {
    let next = addMonths(first, n);
    if (lo && next < startOfMonth(lo)) next = startOfMonth(lo);
    if (hi && next > hi) next = startOfMonth(hi);
    setShown(next);
  };

  const pick = (d: Date) => {
    if (isDisabled(d)) return;
    setFocus(d);
    setSelected(d);
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, Date> = {
      ArrowLeft: addDays(focusInView, -1),
      ArrowRight: addDays(focusInView, 1),
      ArrowUp: addDays(focusInView, -7),
      ArrowDown: addDays(focusInView, 7),
      Home: addDays(focusInView, -focusInView.getDay()),
      End: addDays(focusInView, 6 - focusInView.getDay()),
      PageUp: shiftMonth(focusInView, -1),
      PageDown: shiftMonth(focusInView, 1),
    };
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      pick(focusInView);
      return;
    }
    let next = moves[e.key];
    if (!next) return;
    // 方向键自己用，不让外层的菜单（Dropdown 上下键切菜单项）接着处理
    e.preventDefault();
    e.stopPropagation();
    if (lo && next < lo) next = lo;
    if (hi && next > hi) next = hi;
    moved.current = true;
    setFocus(next);
    if (next.getMonth() !== first.getMonth() || next.getFullYear() !== first.getFullYear()) setShown(startOfMonth(next));
  };

  const nav = (n: number, label: string, icon: 'LeftArrowSmall' | 'RightArrowSmall' | 'DoubleLeftArrowSmall' | 'DoubleRightArrowSmall') => (
    <IconButton tooltip={false} size={28} icon={icon} label={label} disabled={!(n < 0 ? canPrev : canNext)} onClick={() => go(n)} />
  );

  const title = `${first.getFullYear()}年${pad(first.getMonth() + 1)}月`;
  const today = startOfDay(new Date());

  return (
    <div ref={ref} className={cx('kv-calendar', className)} onKeyDown={onKeyDown} {...rest}>
      <div className="kv-calendar__head">
        {nav(-12, '上一年', 'DoubleLeftArrowSmall')}
        {nav(-1, '上个月', 'LeftArrowSmall')}
        <b className="kv-calendar__title" aria-live="polite">
          {title}
        </b>
        {nav(1, '下个月', 'RightArrowSmall')}
        {nav(12, '下一年', 'DoubleRightArrowSmall')}
      </div>
      <div ref={gridRef} className="kv-calendar__grid" role="grid" aria-label={title} onKeyDown={onGridKey}>
        <div className="kv-calendar__row" role="row">
          {WEEK.map((w) => (
            <span key={w} className="kv-calendar__week" role="columnheader" aria-label={`星期${w}`}>
              {w}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, r) => (
          <div key={r} className="kv-calendar__row" role="row">
            {days.slice(r * 7, r * 7 + 7).map((d) => {
              const off = isDisabled(d);
              return (
                <button
                  key={d.getTime()}
                  type="button"
                  role="gridcell"
                  className="kv-calendar__day"
                  tabIndex={sameDay(d, focusInView) ? 0 : -1}
                  aria-selected={sameDay(d, selected)}
                  aria-disabled={off || undefined}
                  aria-current={sameDay(d, today) ? 'date' : undefined}
                  aria-label={`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`}
                  data-outside={d.getMonth() !== first.getMonth() ? '' : undefined}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
Calendar.displayName = 'Calendar';
