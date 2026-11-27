import { useMemo, useState } from 'react';
import { Avatar, Button, DateRangeFilter, Icon, TabItem, Tabs, toast, type DateRange } from '@kivi';
import { useBalance, useDB } from '../../data/db';
import { KIWI_USD, logExport, modelInfo, money, pct, statsOf, usd, useKiwi, type KwRecord } from '../../data/kiwi';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { dailySpend, ledgerOf, modelShare, rangeFrom } from '../../parts/kiwi/records';
import { downloadCsv, fmtTime, KwTable, Pager, pageOf, Stats, TrendChart, useLoad, type Column } from '../../parts/kiwi/ui';
import type { QuotaMode } from './QuotaDialog';

/*
  成员详情：额度和花费、消耗趋势（近 7 天 / 近 30 天 / 自定义）、模型消耗占比、逐笔消耗记录（时间、模型筛选，分页）。
  只给用量元数据，不给生成的内容。右上：调整周上限、调整临时额度、导出。
*/

const PAGE = 10;
const DAY = 86_400_000;

type Range = '7' | '30' | 'custom';

export function MemberDetail({ memberId, onBack, onQuota }: { memberId: string; onBack: () => void; onQuota: (mode: QuotaMode, ids: string[]) => void }) {
  const balance = useBalance();
  const m = useKiwi((s) => s.members.find((x) => x.id === memberId));
  const group = useKiwi((s) => s.groups.find((g) => g.id === m?.groupId));
  const project = useKiwi((s) => s.projects.find((p) => p.id === m?.projectId));
  const logs = useKiwi((s) => s.logs);
  const tasks = useDB((s) => s.tasks);
  const [range, setRange] = useState<Range>('7');
  const [custom, setCustom] = useState<DateRange>({ start: null, end: null });
  const [model, setModel] = useState('all');
  const [page, setPage] = useState(1);
  const load = useLoad([range, custom.start, custom.end, model]);

  const [from, to] = useMemo(() => {
    if (range === 'custom' && custom.start && custom.end) return [custom.start.getTime(), custom.end.getTime() + DAY];
    return [rangeFrom(range === '30' ? '30' : '7'), Date.now() + 1];
  }, [range, custom]);
  const ledger = useMemo(() => (m ? ledgerOf(m, from, to) : []), [m, from, to, tasks, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const spend = useMemo(() => ledger.filter((r) => r.amount < 0 && r.model), [ledger]);
  const share = useMemo(() => modelShare(spend), [spend]);
  const days = useMemo(() => dailySpend(spend, from, Math.min(to, Date.now() + 1)), [spend, from, to]);
  const rows = model === 'all' ? spend : spend.filter((r) => r.model === model);

  if (!m) {
    return (
      <div className="app-kw-section">
        <Button size={32} variant="ghost-muted" leftIcon="LeftArrowSmall" onClick={onBack}>
          返回成员列表
        </Button>
        <p className="app-kw-muted">这个成员已不在当前范围。</p>
      </div>
    );
  }
  const s = statsOf(m, balance);

  const exportDetail = () => {
    downloadCsv(
      `猕猴桃用量-${m.name}-${fmtTime(Date.now(), false)}`,
      ['时间', '模型', '消耗猕猴桃', '预估花费(美元)', '关联会话'],
      spend.map((r) => [fmtTime(r.at), modelInfo(r.model!).label, -r.amount, (-r.amount * KIWI_USD).toFixed(2), r.session ?? '']),
      [
        `成员：${m.name}（${project?.name} · ${group?.name}）`,
        `统计周期：${fmtTime(from, false)} ~ ${fmtTime(Math.min(to, Date.now()) - 1, false)}`,
        `数据更新时间：${fmtTime(Date.now())}`,
        '折算汇率：1 猕猴桃 = 0.035 美元',
        ...share.rows.map((r) => `模型汇总：${modelInfo(r.model).label} ${r.value} 猕猴桃 ${pct(r.share)} ${usd(r.value)}`),
      ],
    );
    logExport(`${m.name} 消耗明细`, `${fmtTime(from, false)} ~ ${fmtTime(Math.min(to, Date.now()) - 1, false)}`);
    toast.success('已导出');
  };

  const columns: Column<KwRecord>[] = [
    { key: 'at', title: '使用时间', width: 160, render: (r) => fmtTime(r.at) },
    {
      key: 'model',
      title: '模型',
      render: (r) => {
        const info = modelInfo(r.model!);
        return (
          <span className="app-kw-name">
            {info.icon && <Icon name={info.icon} size={16} />}
            <span>{info.label}</span>
          </span>
        );
      },
    },
    { key: 'reason', title: '类型', width: 112, render: (r) => r.reason },
    { key: 'amount', title: '消耗猕猴桃', width: 112, align: 'right', render: (r) => -r.amount },
    { key: 'usd', title: '预估花费', width: 104, align: 'right', render: (r) => usd(-r.amount) },
    { key: 'session', title: '关联会话', width: 140, render: (r) => <span className="app-kw-muted">{r.session}</span> },
  ];

  return (
    <>
      <div className="app-kw-page__head">
        <Button size={32} variant="ghost-muted" leftIcon="LeftArrowSmall" onClick={onBack}>
          返回
        </Button>
        <Avatar name={m.name} size={32} type="text" />
        <h1>{m.name}</h1>
        <span className="app-kw-page__scope">
          {project?.name} · {group?.name}
        </span>
        <div className="app-kw-toolbar__end">
          <Button size={32} variant="secondary" onClick={() => onQuota('limit', [m.id])}>
            调整周上限
          </Button>
          <Button size={32} variant="secondary" onClick={() => onQuota('temp', [m.id])}>
            调整临时额度
          </Button>
          <Button size={32} variant="secondary" leftIcon="Download" onClick={exportDetail}>
            导出
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: '周上限', value: s.weeklyLimit.toLocaleString() },
          { label: '本周已用', value: s.weekUsed.toLocaleString() },
          { label: '本周剩余', value: s.weekLeft.toLocaleString() },
          { label: '临时额度剩余', value: s.tempLeft.toLocaleString() },
          { label: '本周预估花费', value: money(s.cost) },
          { label: '采纳率 / 下载率', value: `${pct(m.adoption)} / ${pct(m.download)}` },
        ]}
      />

      <div className="app-kw-page__tabs app-kw-toolbar">
        <Tabs variant="segment" value={range} onChange={(v) => { setRange(v as Range); setPage(1); }}>
          <TabItem value="7">近 7 天</TabItem>
          <TabItem value="30">近 30 天</TabItem>
          <TabItem value="custom">自定义</TabItem>
        </Tabs>
        {range === 'custom' && <DateRangeFilter value={custom} onChange={(v) => { setCustom(v); setPage(1); }} max={new Date()} />}
      </div>

      <div className="app-kw-detail__grid">
        <section className="app-kw-card">
          <div className="app-kw-card__head">
            <span>每日消耗</span>
            <span className="app-kw-muted">合计 {share.total.toLocaleString()} 猕猴桃 · {usd(share.total)}</span>
          </div>
          <TrendChart
            data={days.map((d) => ({
              label: `${new Date(d.day).getMonth() + 1}/${new Date(d.day).getDate()}`,
              value: d.value,
              tip: `${fmtTime(d.day, false)}：${d.value.toLocaleString()} 猕猴桃 · ${usd(d.value)}`,
            }))}
          />
        </section>
        <section className="app-kw-card">
          <div className="app-kw-card__head">
            <span>模型消耗占比</span>
          </div>
          {share.rows.length ? (
            <ul className="app-kw-share">
              {share.rows.map((r) => {
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
            </ul>
          ) : (
            <p className="app-kw-muted">这段时间没有消耗，占比显示「—」</p>
          )}
        </section>
      </div>

      <section className="app-kw-section">
        <div className="app-kw-filters" style={{ marginTop: 'var(--spacing-24)' }}>
          <FilterSelect
            label="模型"
            value={model}
            options={[{ value: 'all', label: '全部模型' }, ...share.rows.map((r) => ({ value: r.model, label: modelInfo(r.model).label, icon: modelInfo(r.model).icon }))]}
            onChange={(v) => { setModel(v); setPage(1); }}
          />
          <span className="app-kw-filters__note">只展示用量，不展示生成的内容</span>
        </div>
        <KwTable columns={columns} rows={pageOf(rows, page, PAGE)} rowKey={(r) => r.id} status={load.status} onRetry={load.retry} empty="这段时间没有消耗" skeletonRows={PAGE} />
        {load.status === 'ready' && <Pager total={rows.length} page={page} pageSize={PAGE} onChange={setPage} />}
      </section>
    </>
  );
}
