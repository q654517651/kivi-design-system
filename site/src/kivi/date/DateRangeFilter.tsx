import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { Button } from '../button';
import { Dropdown, MenuItem, type DropdownPlacement } from '../menu';
import { Icon } from '../Icon';
import { cx } from '../utils';
import { useControllable } from '../hooks';
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
  /** 往前推几天（含今天）。不写就是「全部」，起止都是空 */
  days?: number;
}

/** 默认的四个预设：照线上 TimeRangeFilter */
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { value: 'all', label: '全部' },
  { value: 'week', label: '最近一周', days: 7 },
  { value: 'month', label: '最近一个月', days: 30 },
  { value: 'quarter', label: '最近三个月', days: 90 },
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
  const [open, setOpen] = useControllable(openProp, defaultOpen, (o) => {
    if (!o) setSide(null);
    onOpenChange?.(o);
  });
  const [side, setSide] = useState<Side | null>(null);
  const today = startOfDay(max ?? new Date());
  const calId = useId();
  const fieldRefs = { start: useRef<HTMLButtonElement>(null), end: useRef<HTMLButtonElement>(null) };

  const preset = presets.find((p) => p.value === range.preset);
  const label =
    preset && preset.days
      ? preset.label
      : range.start || range.end
        ? `${range.start ? formatShortDate(range.start) : ''} ~ ${range.end ? formatShortDate(range.end) : ''}`.trim()
        : placeholder;

  const pickPreset = (p: DateRangePreset) => {
    setSide(null);
    if (!p.days) return setRange({ preset: p.value, start: null, end: null });
    setRange({ preset: p.value, start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - p.days + 1), end: today });
  };

  const pickDay = (d: Date) => {
    const s = side;
    if (!s) return;
    setRange({ preset: undefined, start: s === 'start' ? d : preset ? null : range.start, end: s === 'end' ? d : preset ? null : range.end });
    setSide(null);
    fieldRefs[s].current?.focus();
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
    const v = preset ? null : range[s];
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
      open={open && !disabled}
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
      {side && (
        <div
          id={calId}
          key={side}
          className={cx('kv-date-range__calendar', side === 'end' && 'kv-date-range__calendar--end')}
          role="group"
          aria-label={side === 'start' ? '选择开始日期' : '选择结束日期'}
          onKeyDown={onPanelKey}
        >
          <Calendar
            value={preset ? null : range[side]}
            defaultMonth={(preset ? null : range[side] ?? (side === 'start' ? range.end : range.start)) ?? today}
            max={side === 'start' && !preset && range.end ? range.end : today}
            min={side === 'end' && !preset && range.start ? range.start : undefined}
            onChange={pickDay}
          />
        </div>
      )}
    </Dropdown>
  );
});
DateRangeFilter.displayName = 'DateRangeFilter';
