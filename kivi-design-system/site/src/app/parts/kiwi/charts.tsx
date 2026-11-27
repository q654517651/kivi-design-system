import { Icon } from '@kivi';
import { modelInfo, pct, usd, type KwRecord } from '../../data/kiwi';
import { dailySpend, modelShare, weeklySpend } from './records';
import { fmtTime, TrendChart } from './ui';

/*
  用量的两块图，成员详情和用量统计共用：
  - SpendTrend：消耗柱状图，31 天以内按天一根，更长按周一根（周一开始）
  - ModelShareList：模型消耗占比，一行一个模型，名字 + 细条 + 数
*/

const DAY = 86_400_000;
const md = (t: number) => `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;

export function SpendTrend({ spend, from, to }: { spend: KwRecord[]; from: number; to: number }) {
  const end = Math.min(to, Date.now() + 1);
  const byWeek = end - from > 31 * DAY;
  const data = byWeek
    ? weeklySpend(spend, from, end).map((w) => ({ label: md(w.start), value: w.value, tip: `${fmtTime(w.start, false)} 这周：${w.value.toLocaleString()} 猕猴桃 · ${usd(w.value)}` }))
    : dailySpend(spend, from, end).map((d) => ({ label: md(d.day), value: d.value, tip: `${fmtTime(d.day, false)}：${d.value.toLocaleString()} 猕猴桃 · ${usd(d.value)}` }));
  return <TrendChart data={data} />;
}

/** 按天还是按周：卡片标题用 */
export const trendTitle = (from: number, to: number) => (Math.min(to, Date.now() + 1) - from > 31 * DAY ? '每周消耗' : '每日消耗');

/** 最多列几个模型，剩下的并成「其他」一行（项目、全平台模型很多，列太长会把旁边的柱状图撑得很高） */
const SHARE_MAX = 8;

export function ModelShareList({ spend }: { spend: KwRecord[] }) {
  const share = modelShare(spend);
  if (!share.rows.length) return <p className="app-kw-muted">这段时间没有消耗，占比显示「—」</p>;
  const top = share.rows.slice(0, SHARE_MAX);
  const rest = share.rows.slice(SHARE_MAX);
  const restValue = rest.reduce((a, r) => a + r.value, 0);
  return (
    <ul className="app-kw-share">
      {top.map((r) => {
        const info = modelInfo(r.model);
        return (
          <li key={r.model}>
            <span className="app-kw-name">
              {info.icon && <Icon name={info.icon} size={16} />}
              <span>{info.label}</span>
            </span>
            <span className="app-kw-share__bar">
              <span style={{ width: `${r.share * 100}%` }} />
            </span>
            <span className="app-kw-share__num">
              {r.value.toLocaleString()} · {pct(r.share)} · {usd(r.value)}
            </span>
          </li>
        );
      })}
      {rest.length > 0 && (
        <li key="__rest">
          <span className="app-kw-name">
            <span>其他 {rest.length} 个模型</span>
          </span>
          <span className="app-kw-share__bar">
            <span style={{ width: `${(restValue / share.total) * 100}%` }} />
          </span>
          <span className="app-kw-share__num">
            {restValue.toLocaleString()} · {pct(restValue / share.total)} · {usd(restValue)}
          </span>
        </li>
      )}
    </ul>
  );
}
