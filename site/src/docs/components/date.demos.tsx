import { Calendar, DateRangeFilter, DATE_RANGE_PRESETS, formatShortDate, type DateRange } from '@kivi';
import { Playground } from '@shell';

// 日期页的两个属性面板。参数表在 date.mdx

/** 面板上的日期写成「26-11-03」，转回 Date；写不对就当没有 */
function parse(s: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(2000 + Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

type CalendarState = { value: string; limit: string };

export function CalendarPlayground() {
  return (
    <Playground<CalendarState>
      controls={[
        { key: 'limit', label: '可选范围', type: 'segment', value: 'past', options: [['none', '不限'], ['past', '到今天为止']] },
        { key: 'value', label: '选中', type: 'text', value: '' },
      ]}
      render={(s, update) => (
        <Calendar
          value={parse(s.value)}
          max={s.limit === 'past' ? new Date() : undefined}
          onChange={(d) => update({ value: formatShortDate(d) })}
        />
      )}
    />
  );
}

type FilterState = { placement: string; state: string; preset: string; start: string; end: string; open: boolean };

export function DateRangeFilterPlayground() {
  return (
    <Playground<FilterState>
      controls={[
        { key: 'placement', label: '面板位置', type: 'segment', value: 'bottom-start', options: [['bottom-start', '左对齐'], ['bottom-end', '右对齐']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['disabled', '禁用']] },
        {
          key: 'preset',
          label: '值',
          type: 'segment',
          value: 'none',
          options: [['none', '没选'], ...DATE_RANGE_PRESETS.map((p): [string, string] => [p.value, p.label]), ['custom', '自己选']],
        },
        { key: 'start', label: '开始', type: 'text', value: '26-10-01' },
        { key: 'end', label: '结束', type: 'text', value: '' },
        { key: 'open', label: '展开', type: 'toggle', value: true },
      ]}
      rules={(s) => ({ start: s.preset !== 'custom', end: s.preset !== 'custom', open: s.state === 'disabled' })}
      render={(s, update) => {
        const value: DateRange =
          s.preset === 'custom'
            ? { start: parse(s.start), end: parse(s.end) }
            : s.preset === 'none'
              ? { start: null, end: null }
              : { preset: s.preset, start: null, end: null };
        return (
          <div style={{ minHeight: 420, width: 520, display: 'flex', alignItems: 'flex-start', justifyContent: s.placement === 'bottom-end' ? 'flex-end' : 'flex-start' }}>
            <DateRangeFilter
              placement={s.placement as 'bottom-start' | 'bottom-end'}
              disabled={s.state === 'disabled' || undefined}
              value={value}
              onChange={(v) =>
                update(
                  v.preset
                    ? { preset: v.preset }
                    : { preset: 'custom', start: v.start ? formatShortDate(v.start) : '', end: v.end ? formatShortDate(v.end) : '' },
                )
              }
              open={s.open}
              onOpenChange={(open) => update({ open })}
            />
          </div>
        );
      }}
    />
  );
}
