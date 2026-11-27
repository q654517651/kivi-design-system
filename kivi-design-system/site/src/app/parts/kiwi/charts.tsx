import { useMemo, useState } from 'react';
import { Icon, Tooltip } from '@kivi';
import { KIWI_USD, modelInfo, money, pct, type KwRecord } from '../../data/kiwi';
import { dayStart, weekStart } from '../../data/kiwi';
import { fmtTime } from './ui';

/*
  消耗趋势（11-27 用户给的参考：按模型堆叠的柱状图 + 右边模型图例，悬停图例高亮那个模型）。成员详情和用量统计共用。
  - 左：每根柱子是一天（31 天以内）或一周（更长，周一开始），按模型分段堆起来；纵轴是预估花费（美元），横向细网格线
  - 右：模型列表（色点 + 名字 + 花费 + 占比），最多 8 个，剩下的并成「其他」
  - 悬停右边某个模型：左边只亮这个模型的段，别的变暗；悬停柱子出当天明细
  颜色：深色分类色板 8 色（dataviz 参考色板的深色一档，在卡片底色 #1d1e20 上跑过校验：CVD、正常视觉、对比度都过），
  按这段时间的花费从高到低排给模型，「其他」灰色。变量在 kiwi.css 的 --kw-series-n。
*/

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const SERIES_MAX = 8;
const OTHER = '__other';
const md = (t: number) => `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;

interface Series {
  key: string;
  label: string;
  icon?: ReturnType<typeof modelInfo>['icon'];
  value: number;
  color: string;
}

/** 坐标轴取整：最大值往上取到好看的数，分 4 格 */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const raw = v / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * p >= raw)! * p;
  return step * 4;
}

export function UsageChart({ spend, from, to }: { spend: KwRecord[]; from: number; to: number }) {
  const [hot, setHot] = useState<string>();
  const end = Math.min(to, Date.now() + 1);
  const byWeek = end - from > 31 * DAY;

  const { series, buckets, max } = useMemo(() => {
    // 模型按花费排，前 8 个单独一种颜色，剩下的并成「其他」
    const totals = new Map<string, number>();
    for (const r of spend) if (r.amount < 0 && r.model) totals.set(r.model, (totals.get(r.model) ?? 0) - r.amount);
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, SERIES_MAX);
    const rest = ranked.slice(SERIES_MAX);
    const series: Series[] = top.map(([model, value], i) => ({ key: model, label: modelInfo(model).label, icon: modelInfo(model).icon, value, color: `var(--kw-series-${i + 1})` }));
    if (rest.length) series.push({ key: OTHER, label: `其他 ${rest.length} 个模型`, value: rest.reduce((a, [, v]) => a + v, 0), color: 'var(--kw-series-other)' });
    const keyOf = (model: string) => (top.some(([m]) => m === model) ? model : OTHER);

    // 一天或一周一根柱子
    const starts: number[] = [];
    if (byWeek) for (let w = weekStart(from); w < end; w += WEEK) starts.push(Math.max(w, from));
    else for (let d = dayStart(from); d < end; d += DAY) starts.push(d);
    const buckets = starts.map((start) => ({ start, values: new Map<string, number>(), total: 0 }));
    for (const r of spend) {
      if (r.amount >= 0 || !r.model) continue;
      const b = [...buckets].reverse().find((x) => r.at >= x.start);
      if (!b) continue;
      const k = keyOf(r.model);
      b.values.set(k, (b.values.get(k) ?? 0) - r.amount);
      b.total -= r.amount;
    }
    return { series, buckets, max: niceMax(Math.max(0, ...buckets.map((b) => b.total)) * KIWI_USD) };
  }, [spend, from, end, byWeek]);

  const total = series.reduce((a, s) => a + s.value, 0);
  const ticks = [4, 3, 2, 1, 0].map((i) => (max / 4) * i);
  const labelEvery = buckets.length > 16 ? Math.ceil(buckets.length / 10) : 1;
  const fmtTick = (v: number) => (max >= 40 ? `$${Math.round(v)}` : `$${v.toFixed(1).replace(/\.0$/, '')}`);

  return (
    <section className="app-kw-usage" data-hot={hot ? '' : undefined}>
      <div className="app-kw-usage__plot">
        <div className="app-kw-card__head">
          <span>{byWeek ? '每周消耗' : '每日消耗'}</span>
          <span className="app-kw-muted">
            合计 {Math.round(total).toLocaleString()} 猕猴桃 · {money(total * KIWI_USD)}
          </span>
        </div>
        <div className="app-kw-usage__chart">
          <div className="app-kw-usage__y" aria-hidden>
            {ticks.map((t) => (
              <span key={t}>{fmtTick(t)}</span>
            ))}
          </div>
          <div className="app-kw-usage__area">
            <div className="app-kw-usage__grid" aria-hidden>
              {ticks.map((t) => (
                <span key={t} />
              ))}
            </div>
            <div className="app-kw-usage__bars">
              {buckets.map((b) => (
                <Tooltip
                  key={b.start}
                  className="app-kw-usage__tip"
                  content={
                    <span className="app-kw-usage__tip-body">
                      <strong>
                        {byWeek ? `${fmtTime(b.start, false)} 这周` : fmtTime(b.start, false)} · {money(b.total * KIWI_USD)}
                      </strong>
                      {series
                        .filter((s) => b.values.get(s.key))
                        .map((s) => (
                          <span key={s.key} className="app-kw-usage__tip-row">
                            <i style={{ background: s.color }} />
                            {s.label}
                            <em>{money((b.values.get(s.key) ?? 0) * KIWI_USD)}</em>
                          </span>
                        ))}
                    </span>
                  }
                >
                  <span className="app-kw-usage__col" tabIndex={0} aria-label={`${md(b.start)} ${money(b.total * KIWI_USD)}`}>
                    <span className="app-kw-usage__stack" style={{ height: `${((b.total * KIWI_USD) / max) * 100}%` }}>
                      {series.map((s) => {
                        const v = b.values.get(s.key);
                        return v ? <span key={s.key} data-on={hot === s.key ? '' : undefined} style={{ flexGrow: v, background: s.color }} /> : null;
                      })}
                    </span>
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
          <span />
          <div className="app-kw-usage__x" aria-hidden>
            {buckets.map((b, i) => (
              <span key={b.start}>{i % labelEvery === 0 ? md(b.start) : ''}</span>
            ))}
          </div>
        </div>
      </div>

      <ul className="app-kw-usage__legend" onMouseLeave={() => setHot(undefined)}>
        {series.length ? (
          series.map((s) => (
            <li key={s.key} data-on={hot === s.key ? '' : undefined} onMouseEnter={() => setHot(s.key)} onFocus={() => setHot(s.key)} onBlur={() => setHot(undefined)} tabIndex={0}>
              <i style={{ background: s.color }} />
              <span className="app-kw-usage__name">
                {s.icon && <Icon name={s.icon} size={16} />}
                <span>{s.label}</span>
              </span>
              <span className="app-kw-usage__num">{money(s.value * KIWI_USD)}</span>
              <span className="app-kw-usage__pct">{pct(total ? s.value / total : NaN)}</span>
            </li>
          ))
        ) : (
          <li className="app-kw-muted">这段时间没有消耗</li>
        )}
      </ul>
    </section>
  );
}
