import { useMemo, useState } from 'react';
import { Button, Dialog, Icon, TabItem, Tabs, toast } from '@kivi';
import { useBalance, useDB } from '../../data/db';
import { ME, modelInfo, pct, statsOf, usd, useKiwi, type KwApplication, type KwRecord } from '../../data/kiwi';
import { closeMyUsage, useMyUsageOpen } from '../../flows/kiwi';
import { FilterSelect } from './FilterSelect';
import { ledgerOf, RANGE_OPTIONS, rangeFrom, type RangeKey } from './records';
import { AppStatus } from './AppStatus';
import { fmtTime, KwTable, Pager, pageOf, QuotaBar, useLoad, type Column } from './ui';

/*
  「我的用量」（11-27 原型）：账号菜单里点开，人人都有，只看自己。
  上面：当前剩余（= 右上角余额）、额度条（本周已用 / 周剩余 / 临时剩余）、采纳率下载率；右上「申请临时额度」（正式站跳飞书流程）。
  下面两页：消耗明细（时间、模型筛选，分页）、我的申请（申请单状态）。
  照用户给的即梦「积分详情」弹窗的结构。
*/

const PAGE = 10;

export function MyUsageDialog() {
  const open = useMyUsageOpen();
  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeMyUsage()} size={800} title="我的用量">
      {open && <MyUsage />}
    </Dialog>
  );
}

function MyUsage() {
  const balance = useBalance();
  const me = useKiwi((s) => s.members.find((m) => m.id === ME));
  const applications = useKiwi((s) => s.applications);
  const tasks = useDB((s) => s.tasks);
  const [tab, setTab] = useState<'records' | 'apps'>('records');
  const [range, setRange] = useState<RangeKey>('7');
  const [model, setModel] = useState('all');
  const [page, setPage] = useState(1);
  const load = useLoad([range, model, tab]);

  const all = useMemo(() => (me ? ledgerOf(me, rangeFrom(range), Date.now() + 1) : []), [me, range, tasks, applications]); // eslint-disable-line react-hooks/exhaustive-deps
  const models = useMemo(() => [...new Set(all.map((r) => r.model).filter(Boolean) as string[])], [all]);
  const rows = model === 'all' ? all : all.filter((r) => r.model === model);
  const mine = applications.filter((a) => a.memberId === ME);

  if (!me) return null;
  const s = statsOf(me, balance);

  const columns: Column<KwRecord>[] = [
    { key: 'reason', title: '变更原因', width: 160, render: (r) => r.reason },
    {
      key: 'model',
      title: '模型',
      render: (r) => {
        if (!r.model) return <span className="app-kw-muted">—</span>;
        const info = modelInfo(r.model);
        return (
          <span className="app-kw-name">
            {info.icon && <Icon name={info.icon} size={16} />}
            <span>{info.label}</span>
          </span>
        );
      },
    },
    { key: 'at', title: '时间', width: 160, render: (r) => fmtTime(r.at) },
    { key: 'amount', title: '猕猴桃', width: 96, align: 'right', render: (r) => <span className={r.amount > 0 ? 'app-kw-plus' : 'app-kw-minus'}>{r.amount > 0 ? `+${r.amount}` : r.amount}</span> },
    { key: 'usd', title: '预估美金', width: 104, align: 'right', render: (r) => <span className="app-kw-muted">{r.model ? usd(-r.amount) : '—'}</span> },
  ];

  const appColumns: Column<KwApplication>[] = [
    { key: 'id', title: '申请单号', width: 160, render: (a) => <span className="app-kw-muted">{a.id}</span> },
    { key: 'amount', title: '档位', width: 96, align: 'right', render: (a) => a.amount.toLocaleString() },
    { key: 'reason', title: '申请理由', render: (a) => a.reason },
    { key: 'status', title: '状态', width: 112, render: (a) => <AppStatus app={a} /> },
    { key: 'at', title: '申请时间', width: 160, render: (a) => fmtTime(a.createdAt) },
  ];

  return (
    <>
      <div className="app-kw-mine__top">
        <div>
          <div className="app-kw-mine__label">当前剩余</div>
          <div className="app-kw-mine__amount">
            <Icon name="Kiwi" size={24} />
            {balance.toLocaleString()}
            <small>≈ {usd(balance)}</small>
          </div>
        </div>
        <Button size={32} variant="secondary" onClick={() => toast.info('正式站跳转飞书「猕猴桃临时额度申请」流程，+1 审批通过后自动到账')}>
          申请临时额度
        </Button>
      </div>
      <QuotaBar
        parts={[
          { label: '本周已用', value: s.weekUsed, tone: 'used' },
          { label: '周额度剩余', value: s.weekLeft, tone: 'week' },
          { label: '临时额度剩余', value: s.tempLeft, tone: 'temp' },
        ]}
      />
      <div className="app-kw-mine__meta">
        <span>周上限 {s.weeklyLimit.toLocaleString()}，每周一 00:00 重置</span>
        <span>先扣周额度，再扣临时额度；临时额度不随周清零</span>
        <span>采纳率 {pct(me.adoption)}</span>
        <span>下载率 {pct(me.download)}</span>
      </div>

      <Tabs
        className="app-kw-mine__tabs"
        value={tab}
        onChange={(v) => {
          setTab(v as typeof tab);
          setPage(1);
        }}
      >
        <TabItem value="records">消耗明细</TabItem>
        <TabItem value="apps">我的申请</TabItem>
      </Tabs>

      {tab === 'records' ? (
        <>
          <div className="app-kw-filters">
            <FilterSelect
              label="时间范围"
              value={range}
              options={RANGE_OPTIONS}
              onChange={(v) => {
                setRange(v);
                setPage(1);
              }}
            />
            <FilterSelect
              label="模型"
              value={model}
              options={[{ value: 'all', label: '全部模型' }, ...models.map((m) => ({ value: m, label: modelInfo(m).label, icon: modelInfo(m).icon }))]}
              onChange={(v) => {
                setModel(v);
                setPage(1);
              }}
            />
            <span className="app-kw-filters__note">消耗明细可能有几分钟延迟 · 更新于 {fmtTime(Date.now()).slice(11)}</span>
          </div>
          <KwTable columns={columns} rows={pageOf(rows, page, PAGE)} rowKey={(r) => r.id} status={load.status} onRetry={load.retry} empty="这段时间没有变动" skeletonRows={PAGE} />
          {load.status === 'ready' && <Pager total={rows.length} page={page} pageSize={PAGE} onChange={setPage} />}
        </>
      ) : (
        <KwTable columns={appColumns} rows={mine} rowKey={(a) => a.id} status={load.status} onRetry={load.retry} empty="还没有申请过临时额度" skeletonRows={3} />
      )}
    </>
  );
}
