import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { Button } from '../button';
import { Dropdown, MenuItem, type DropdownPlacement } from '../menu';
import { Icon } from '../Icon';
import { cx } from '../utils';
import { useControllable, usePresence } from '../hooks';
import { Calendar, startOfDay } from './Calendar';
import './date.css';

export interface DateRange {
  /** 选了哪个预设（预设的 value）。自己挑的起止日期是 undefined */
  preset?: string;
  /** 开始那天（0 点），没有就是 null */
  start: Date | null;
  /** 结束那天（0 点），没有就是 null */
  end: Date | null;
}

export interface DateRangePreset {
  /** 预设的 id，比如 week */
  value: string;
  /** 显示的字，比如「最近一周」 */
  label: string;
  /** 往前推几天（含今天），比如一周是 7。和 months 二选一 */
  days?: number;
  /** 往前推几个日历月（含今天）：从今天往前数这么多个月的同一号，再加一天，比如 11 月 5 日往前一个月是 10 月 6 日；没有这一天的月取月底。和 days 二选一。days、months 都不写就是「全部」，起止都是空 */
  months?: number;
}

/** 默认的四个预设：照线上 TimeRangeFilter */
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { value: 'all', label: '全部' },
  { value: 'week', label: '最近一周', days: 7 },
  { value: 'month', label: '最近一个月', months: 1 },
  { value: 'quarter', label: '最近三个月', months: 3 },
];

export interface DateRangeFilterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'defaultValue'> {
  /** 当前的范围。传了就是受控 */
  value?: DateRange;
  /** 非受控时的初始值 */
  defaultValue?: DateRange;
  /** 范围变了：点了预设、或者选了起止某一天 */
  onChange?: (value: DateRange) => void;
  /** 展开（受控） */
  open?: boolean;
  /** 默认是否展开（非受控） */
  defaultOpen?: boolean;
  /** 展开状态变化 */
  onOpenChange?: (open: boolean) => void;
  /** 预设，默认 全部 / 最近一周 / 最近一个月 / 最近三个月 */
  presets?: DateRangePreset[];
  /** 没选、或者选了「全部」时触发器上的字，默认「时间筛选」 */
  placeholder?: string;
  /** 最晚能选到哪天，默认今天（筛的是已经发生的事） */
  max?: Date;
  /** 面板出在哪边，默认 bottom-start；放在一行最右边时用 bottom-end */
  placement?: DropdownPlacement;
  /** 禁用 */
  disabled?: boolean;
}

const EMPTY: DateRange = { start: null, end: null };
const pad = (n: number) => String(n).padStart(2, '0');
/** 26-08-24 */
export const formatShortDate = (d: Date) => `${String(d.getFullYear()).slice(2)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Side = 'start' | 'end';

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDate = (a: Date | null, b: Date | null) => (a && b ? a.getTime() === b.getTime() : a === b);

/** 往前推 n 个日历月，保持几号；那个月没有这一天（3 月 31 日往前一个月）就取月底 */
function monthsBack(d: Date, n: number) {
  const last = new Date(d.getFullYear(), d.getMonth() - n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() - n, Math.min(d.getDate(), last));
}

/** 预设对应的起止（含今天，结束是 today）。「全部」没有范围，返回 null */
export function presetRange(p: DateRangePreset, today: Date): { start: Date; end: Date } | null {
  if (p.days) return { start: addDays(today, -(p.days - 1)), end: today };
  if (p.months) return { start: addDays(monthsBack(today, p.months), 1), end: today };
  return null;
}

/**
 * 时间筛选：一个文字按钮（32），点开是玻璃面板：上面起止两个日期框，下面一列预设。
 * 点预设立刻生效并收起；点日期框，在这个框下面浮出第二层单月日历（Calendar），和框左对齐、离 4，压在预设上；
 * 点一天填进去、日历收起，面板不关。开始不能晚于结束，都不能晚于 max（默认今天）。Esc 先关日历，再关面板。
 * 照 Figma 旧版 KIVI 3.5-3.14（14637:17589）和线上 TimeRangeFilter；两层都是玻璃（11-03、11-04 用户定）
 */
export const DateRangeFilter = forwardRef<HTMLSpanElement, DateRangeFilterProps>(function DateRangeFilter(
  {
    value,
    defaultValue = EMPTY,
    onChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    presets = DATE_RANGE_PRESETS,
    placeholder = '时间筛选',
    max,
    placement = 'bottom-start',
    disabled,
    className,
    ...rest
  },
  ref,
) {
  const [range, setRange] = useControllable(value, defaultValue, onChange);
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [side, setSide] = useState<Side | null>(null);
  const today = startOfDay(max ?? new Date());
  const calId = useId();
  const fieldRefs = { start: useRef<HTMLButtonElement>(null), end: useRef<HTMLButtonElement>(null) };

  // 面板关了（自己关、外面受控关都算）就收起日历，下次打开不直接浮出
  const shown = open && !disabled;
  useEffect(() => {
    if (!shown) setSide(null);
  }, [shown]);

  // 日历层的出现、消失：关的时候先播 150ms 消失动画再卸掉，期间还要显示着关之前的那一边
  const cal = usePresence(side !== null, 150);
  const lastSide = useRef<Side>('start');
  if (side) lastSide.current = side;
  const calSide = side ?? lastSide.current;

  const preset = presets.find((p) => p.value === range.preset);
  const label =
    preset && (preset.days || preset.months)
      ? preset.label
      : range.start || range.end
        ? `${range.start ? formatShortDate(range.start) : ''} ~ ${range.end ? formatShortDate(range.end) : ''}`.trim()
        : placeholder;

  const pickPreset = (p: DateRangePreset) => {
    setSide(null);
    const r = presetRange(p, today);
    setRange({ preset: p.value, start: r?.start ?? null, end: r?.end ?? null });
  };

  // 选了一天：另一端保留。起止凑巧等于某个预设，就算选中那个预设
  const pickDay = (d: Date) => {
    const s = side;
    if (!s) return;
    const start = s === 'start' ? d : range.start;
    const end = s === 'end' ? d : range.end;
    const hit = presets.find((p) => {
      const r = presetRange(p, today);
      return r && sameDate(r.start, start) && sameDate(r.end, end);
    });
    setRange({ preset: hit?.value, start, end });
    setSide(null);
    fieldRefs[s].current?.focus();
  };

  // 点的是已经选中的那天：Calendar 不重复触发 onChange，这里直接收起日历
  const closeOnSameDay = (e: MouseEvent<HTMLDivElement>) => {
    if (!side || !(e.target as HTMLElement).closest('.kv-calendar__day[aria-selected="true"]:not([aria-disabled="true"])')) return;
    setSide(null);
    fieldRefs[side].current?.focus();
  };

  // 日历开着时 Esc 只关日历：挂在 window 的捕获阶段，比 Dropdown 挂在 document 上的先收到
  useEffect(() => {
    if (!side) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      fieldRefs[side].current?.focus();
      setSide(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  // 面板里 Tab 照常在控件之间走（Dropdown 默认按 Tab 关闭，那是给纯菜单的）
  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') e.stopPropagation();
  };

  const field = (s: Side) => {
    const v = range[s];
    return (
      <button
        ref={fieldRefs[s]}
        type="button"
        className="kv-date-range__field"
        aria-haspopup="dialog"
        aria-expanded={side === s}
        aria-controls={side === s ? calId : undefined}
        aria-label={s === 'start' ? '开始日期' : '结束日期'}
        onClick={() => setSide(side === s ? null : s)}
      >
        <span className={cx('kv-date-range__date', !v && 'kv-date-range__date--placeholder')}>
          {v ? formatShortDate(v) : s === 'start' ? '开始日期' : '结束日期'}
        </span>
        <Icon name="Calendar" />
      </button>
    );
  };


  return (
    <Dropdown
      ref={ref}
      className={cx('kv-date-range-filter', className)}
      open={shown}
      onOpenChange={setOpen}
      placement={placement}
      haspopup="dialog"
      trigger={
        <Button
          variant="text"
          rightIcon="DownArrowSmall"
          disabled={disabled}
          className="kv-date-range-filter__trigger"
          data-filled={label !== placeholder ? '' : undefined}
        >
          {label}
        </Button>
      }
      {...rest}
    >
      {/* 日历和面板并排放在弹出层里，不嵌在面板里：面板有背景模糊，嵌在里面的模糊不生效，预设的字会透上来 */}
      <div className="kv-date-range" role="dialog" aria-label={placeholder} onKeyDown={onPanelKey}>
        <div className="kv-date-range__fields">
          {field('start')}
          {field('end')}
        </div>
        <div role="listbox" aria-label="预设" className="kv-date-range__presets">
          {presets.map((p) => (
            <MenuItem key={p.value} selected={range.preset === p.value} onClick={() => pickPreset(p)}>
              {p.label}
            </MenuItem>
          ))}
        </div>
      </div>
      {cal.mounted && (
        <div
          id={calId}
          key={calSide}
          className={cx('kv-date-range__calendar', calSide === 'end' && 'kv-date-range__calendar--end')}
          role="group"
          aria-label={calSide === 'start' ? '选择开始日期' : '选择结束日期'}
          data-state={cal.state}
          aria-hidden={cal.state === 'closed' || undefined}
          onKeyDown={onPanelKey}
          onClick={closeOnSameDay}
        >
          <Calendar
            value={range[calSide]}
            defaultMonth={range[calSide] ?? (calSide === 'start' ? range.end : range.start) ?? today}
            max={calSide === 'start' && range.end ? range.end : today}
            min={calSide === 'end' && range.start ? range.start : undefined}
            onChange={pickDay}
          />
        </div>
      )}
    </Dropdown>
  );
});
DateRangeFilter.displayName = 'DateRangeFilter';
