import { useMemo, useState } from 'react';
import { Avatar, Button, DateRangeFilter, TabItem, Tabs, toast, type DateRange } from '@kivi';
import { logExport, money, pct, recordsOf, scopeLabel, usd, type KwGroup, type KwMember, type KwProject, type KwRecord, type KwScope } from '../../data/kiwi';
import { ModelShareList, SpendTrend, trendTitle } from '../../parts/kiwi/charts';
import { PERIOD_OPTIONS, type PeriodKey } from '../../parts/kiwi/records';
import { downloadCsv, fmtTime, KwTable, Pager, pageOf, Stats, type Column, type LoadStatus } from '../../parts/kiwi/ui';

/*
  用量统计（11-27 用户定）：看任意一段时间的消耗，和「成员与额度」（现在的额度、调额度）分开，免得同一张表里口径混着。
  范围跟侧栏走：组管理员看自己组，项目管理员选「全部分组」时多一张分组对比，看各组的费用。
  - 周期：本周 / 上周 / 近 4 周 / 近 3 个月 / 自定义；切到别的页签再回来、从成员详情返回都还在
  - 概览：消耗合计、预估花费、人均消耗、采纳率、下载率
  - 消耗趋势（31 天以内按天，更长按周）+ 模型消耗占比
  - 分组对比（全部分组时）：每组一行，按消耗从高到低，点一行进那个组；超管看全平台时是项目对比，点一行进那个项目
  - 成员排行：这段时间谁用得多，点一行进成员详情（详情停在同一段时间）
*/

const PAGE = 10;

export interface PeriodState {
  key: PeriodKey;
  custom: DateRange;
}

type MemberRow = KwMember & { used: number; share: number };
/** 对比表的一行：一个组或一个项目 */
type GroupRow = { id: string; name: string; count: number; used: number; adoption: number; download: number };

const avg = (list: number[]) => {
  const ok = list.filter((n) => !Number.isNaN(n));
  return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : NaN;
};

export function StatsTab({
  scope,
  members,
  groups,
  projects,
  period,
  onPeriodChange,
  range,
  status,
  onRetry,
  onPickGroup,
  onPickProject,
  onOpenMember,
}: {
  scope: KwScope;
  members: KwMember[];
  groups: KwGroup[];
  /** 全平台时按项目对比 */
  projects: KwProject[];
  period: PeriodState;
  onPeriodChange: (p: PeriodState) => void;
  /** 周期算出来的 [from, to) */
  range: [number, number];
  status: LoadStatus;
  onRetry: () => void;
  onPickGroup: (groupId: string) => void;
  onPickProject: (projectId: string) => void;
  onOpenMember: (id: string) => void;
}) {
  const [from, to] = range;
  const [page, setPage] = useState(1);

  // 每个人这段时间的消耗（只算生成扣的，不算发放、过期）
  const byMember = useMemo(() => new Map(members.map((m) => [m.id, recordsOf(m, from, to)])), [members, from, to]);
  const spend = useMemo(() => [...byMember.values()].flat() as KwRecord[], [byMember]);
  const total = useMemo(() => spend.reduce((s, r) => s - r.amount, 0), [spend]);
  const memberRows = useMemo<MemberRow[]>(
    () =>
      members
        .map((m) => {
          const used = (byMember.get(m.id) ?? []).reduce((s, r) => s - r.amount, 0);
          return { ...m, used, share: total ? used / total : NaN };
        })
        .sort((a, b) => b.used - a.used),
    [members, byMember, total],
  );
  // 对比表：选了项目按组比，全平台（超管）按项目比
  const byProject = !scope.projectId;
  const groupRows = useMemo<GroupRow[]>(() => {
    const units = byProject ? projects.map((p) => ({ id: p.id, name: p.name, has: (m: KwMember) => m.projectId === p.id })) : groups.map((g) => ({ id: g.id, name: g.name, has: (m: KwMember) => m.groupId === g.id }));
    return units
      .map((u) => {
        const inUnit = memberRows.filter(u.has);
        return { id: u.id, name: u.name, count: inUnit.length, used: inUnit.reduce((s, m) => s + m.used, 0), adoption: avg(inUnit.map((m) => m.adoption)), download: avg(inUnit.map((m) => m.download)) };
      })
      .sort((a, b) => b.used - a.used);
  }, [byProject, projects, groups, memberRows]);
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? '';
  const periodText = `${fmtTime(from, false)} ~ ${fmtTime(Math.min(to, Date.now()) - 1, false)}`;

  const exportStats = () => {
    downloadCsv(
      `猕猴桃用量统计-${scopeLabel(scope)}-${periodText}`,
      ['姓名', '分组', '消耗猕猴桃', '预估花费(美元)', '占比', '采纳率', '下载率'],
      memberRows.map((m) => [m.name, groupName(m.groupId), m.used, usd(m.used).slice(1), pct(m.share), pct(m.adoption), pct(m.download)]),
      [`范围：${scopeLabel(scope)}`, `统计周期：${periodText}`, `数据更新时间：${fmtTime(Date.now())}`, '折算汇率：1 猕猴桃 = 0.035 美元'],
    );
    logExport(`${scopeLabel(scope)} 用量统计`, periodText);
    toast.success('已导出');
  };

  const groupColumns: Column<GroupRow>[] = [
    { key: 'name', title: byProject ? '项目' : '分组', width: 160, render: (g) => g.name },
    { key: 'count', title: '人数', width: 80, align: 'right', render: (g) => g.count },
    { key: 'used', title: '消耗猕猴桃', width: 120, align: 'right', render: (g) => g.used.toLocaleString() },
    { key: 'cost', title: '预估花费', width: 120, align: 'right', render: (g) => usd(g.used) },
    { key: 'per', title: '人均消耗', width: 104, align: 'right', render: (g) => (g.count ? Math.round(g.used / g.count).toLocaleString() : '—') },
    { key: 'share', title: '占比', width: 88, align: 'right', render: (g) => pct(total ? g.used / total : NaN) },
    { key: 'adoption', title: '采纳率', width: 88, align: 'right', render: (g) => pct(g.adoption) },
    { key: 'download', title: '下载率', width: 88, align: 'right', render: (g) => pct(g.download) },
  ];

  const memberColumns: Column<MemberRow>[] = [
    {
      key: 'name',
      title: '姓名',
      width: 180,
      render: (m) => (
        <span className="app-kw-name">
          <Avatar name={m.name} size={24} type="text" />
          <span>{m.name}</span>
        </span>
      ),
    },
    ...(scope.groupId ? [] : [{ key: 'group', title: '分组', width: 120, render: (m: MemberRow) => groupName(m.groupId) }]),
    { key: 'used', title: '消耗猕猴桃', width: 120, align: 'right', render: (m) => m.used.toLocaleString() },
    { key: 'cost', title: '预估花费', width: 120, align: 'right', render: (m) => usd(m.used) },
    { key: 'share', title: '占比', width: 88, align: 'right', render: (m) => pct(m.share) },
    { key: 'adoption', title: '采纳率', width: 88, align: 'right', render: (m) => pct(m.adoption) },
    { key: 'download', title: '下载率', width: 88, align: 'right', render: (m) => pct(m.download) },
  ];

  return (
    <>
      <div className="app-kw-toolbar">
        <Tabs
          variant="segment"
          value={period.key}
          onChange={(v) => {
            onPeriodChange({ ...period, key: v as PeriodKey });
            setPage(1);
          }}
        >
          {PERIOD_OPTIONS.map((o) => (
            <TabItem key={o.value} value={o.value}>
              {o.label}
            </TabItem>
          ))}
        </Tabs>
        {period.key === 'custom' && (
          <DateRangeFilter
            value={period.custom}
            onChange={(v) => {
              onPeriodChange({ ...period, custom: v });
              setPage(1);
            }}
            max={new Date()}
          />
        )}
        <span className="app-kw-muted">{periodText}</span>
        <div className="app-kw-toolbar__end">
          <Button size={32} variant="secondary" leftIcon="Download" disabled={status !== 'ready'} onClick={exportStats}>
            导出
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: '消耗合计', value: total.toLocaleString() },
          { label: '预估花费', value: money(total * 0.035) },
          { label: '人均消耗', value: members.length ? Math.round(total / members.length).toLocaleString() : '—' },
          { label: '采纳率', value: pct(avg(members.map((m) => m.adoption))) },
          { label: '下载率', value: pct(avg(members.map((m) => m.download))) },
        ]}
      />

      <div className="app-kw-detail__grid app-kw-stats-charts">
        <section className="app-kw-card">
          <div className="app-kw-card__head">
            <span>{trendTitle(from, to)}</span>
          </div>
          <SpendTrend spend={spend} from={from} to={to} />
        </section>
        <section className="app-kw-card">
          <div className="app-kw-card__head">
            <span>模型消耗占比</span>
          </div>
          <ModelShareList spend={spend} />
        </section>
      </div>

      {!scope.groupId && (
        <section className="app-kw-section">
          <h2>{byProject ? '项目对比' : '分组对比'}</h2>
          <KwTable columns={groupColumns} rows={groupRows} rowKey={(g) => g.id} onRowClick={(g) => (byProject ? onPickProject(g.id) : onPickGroup(g.id))} status={status} onRetry={onRetry} empty={byProject ? '还没有项目' : '还没有分组'} skeletonRows={4} />
        </section>
      )}

      <section className="app-kw-section">
        <h2>成员排行</h2>
        <KwTable columns={memberColumns} rows={pageOf(memberRows, page, PAGE)} rowKey={(m) => m.id} onRowClick={(m) => onOpenMember(m.id)} status={status} onRetry={onRetry} empty="这个范围里还没有成员" skeletonRows={PAGE} />
        {status === 'ready' && <Pager total={memberRows.length} page={page} pageSize={PAGE} onChange={setPage} />}
      </section>
    </>
  );
}
