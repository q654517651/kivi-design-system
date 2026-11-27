import { useState } from 'react';
import { Button, Input, TabItem, Tabs, toast } from '@kivi';
import { compensate, type KwApplication, type KwApplicationStatus, type KwLog, type KwMember, type KwGroup } from '../../data/kiwi';
import { confirm } from '../../flows/dialogs';
import { attempt } from '../../flows/errors';
import { APP_STATUS, AppStatus } from '../../parts/kiwi/AppStatus';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { fmtTime, KwTable, Pager, pageOf, type Column, type LoadStatus } from '../../parts/kiwi/ui';

/*
  申请单：范围里成员的临时额度申请单，按状态筛。加额失败的单只有超管能「人工补发」，
  补发以申请单号为凭据，已到账的再点会提示不重复加额。
  操作日志：额度调整、成员增删、分组和管理员变更、人工补发、导出，记操作人、时间、对象、前后值、原因。
*/

const PAGE = 10;

export function ApplicationsTab({
  applications,
  members,
  groups,
  canCompensate,
  status,
  onRetry,
}: {
  applications: KwApplication[];
  members: KwMember[];
  groups: KwGroup[];
  canCompensate: boolean;
  status: LoadStatus;
  onRetry: () => void;
}) {
  const [filter, setFilter] = useState<'all' | KwApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const rows = (filter === 'all' ? applications : applications.filter((a) => a.status === filter)).slice().sort((a, b) => b.createdAt - a.createdAt);
  const failedCount = applications.filter((a) => a.status === 'failed').length;
  const memberOf = (id: string) => members.find((m) => m.id === id);

  const doCompensate = (a: KwApplication) =>
    confirm({
      title: `给 ${memberOf(a.memberId)?.name} 补发 ${a.amount.toLocaleString()} 临时额度？`,
      description: `以申请单号 ${a.id} 为凭据，同一张单只会到账一次。`,
      confirmText: '补发',
      danger: false,
      onConfirm: async () => {
        const res = await attempt(() => compensate(a.id));
        if (!res) throw new Error('compensate failed');
        if (res === 'already') toast.info('这张单已经到账，不重复加额');
        else toast.success('已补发，申请人会收到到账通知');
      },
    });

  const columns: Column<KwApplication>[] = [
    { key: 'id', title: '申请单号', width: 160, render: (a) => <span className="app-kw-muted">{a.id}</span> },
    { key: 'who', title: '申请人', width: 120, render: (a) => memberOf(a.memberId)?.name ?? '已移出' },
    { key: 'group', title: '分组', width: 112, render: (a) => groups.find((g) => g.id === memberOf(a.memberId)?.groupId)?.name ?? '—' },
    { key: 'amount', title: '档位', width: 88, align: 'right', render: (a) => a.amount.toLocaleString() },
    { key: 'reason', title: '申请理由', render: (a) => a.reason },
    { key: 'approver', title: '审批人', width: 96, render: (a) => a.approver },
    { key: 'status', title: '状态', width: 104, render: (a) => <AppStatus app={a} /> },
    { key: 'at', title: '申请时间', width: 152, render: (a) => fmtTime(a.createdAt) },
    {
      key: 'op',
      title: '',
      width: 120,
      align: 'right',
      render: (a) =>
        a.status !== 'failed' ? null : canCompensate ? (
          <Button size={28} variant="secondary" onClick={() => void doCompensate(a)}>
            人工补发
          </Button>
        ) : (
          <span className="app-kw-muted">等超管补发</span>
        ),
    },
  ];

  return (
    <>
      <div className="app-kw-toolbar">
        <Tabs variant="segment" size={32} value={filter} onChange={(v) => { setFilter(v as typeof filter); setPage(1); }}>
          <TabItem value="all">全部</TabItem>
          {(Object.keys(APP_STATUS) as KwApplicationStatus[]).map((s) => (
            <TabItem key={s} value={s}>
              {APP_STATUS[s]}
              {s === 'failed' && failedCount ? ` ${failedCount}` : ''}
            </TabItem>
          ))}
        </Tabs>
        <span className="app-kw-filters__note">申请在飞书流程里发起，+1 审批通过后系统自动加额；加额失败会自动重试并告警</span>
      </div>
      <KwTable columns={columns} rows={pageOf(rows, page, PAGE)} rowKey={(a) => a.id} status={status} onRetry={onRetry} empty="没有这个状态的申请单" skeletonRows={6} />
      {status === 'ready' && <Pager total={rows.length} page={page} pageSize={PAGE} onChange={setPage} />}
    </>
  );
}

const LOG_TYPES = ['全部', '调整周上限', '增加周额度', '增加临时额度', '减少临时额度', '添加成员', '移除成员', '调整分组', '新建分组', '任免组管理员', '人工补发', '导出'];

export function LogsTab({ logs, status, onRetry }: { logs: KwLog[]; status: LoadStatus; onRetry: () => void }) {
  const [type, setType] = useState('全部');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const rows = logs.filter((l) => (type === '全部' || l.action === type) && (!q.trim() || l.target.includes(q.trim()) || l.operator.includes(q.trim())));
  const columns: Column<KwLog>[] = [
    { key: 'at', title: '时间', width: 152, render: (l) => fmtTime(l.at) },
    { key: 'operator', title: '操作人', width: 96, render: (l) => l.operator },
    { key: 'action', title: '操作', width: 120, render: (l) => l.action },
    { key: 'target', title: '对象', width: 160, render: (l) => l.target },
    {
      key: 'change',
      title: '变更',
      render: (l) =>
        l.before || l.after ? (
          <span>
            {l.before && <span className="app-kw-muted">{l.before}</span>}
            {l.before && l.after && ' → '}
            {l.after}
          </span>
        ) : (
          <span className="app-kw-muted">—</span>
        ),
    },
    { key: 'reason', title: '原因', width: 200, render: (l) => l.reason || <span className="app-kw-muted">—</span> },
  ];
  return (
    <>
      <div className="app-kw-toolbar">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon="Search" placeholder="搜对象或操作人" clearable onClear={() => setQ('')} />
        <FilterSelect label="操作类型" value={type} options={LOG_TYPES.map((t) => ({ value: t, label: t === '全部' ? '全部操作' : t }))} onChange={(v) => { setType(v); setPage(1); }} />
      </div>
      <KwTable columns={columns} rows={pageOf(rows, page, PAGE)} rowKey={(l) => l.id} status={status} onRetry={onRetry} empty="没有符合条件的日志" skeletonRows={8} />
      {status === 'ready' && <Pager total={rows.length} page={page} pageSize={PAGE} onChange={setPage} />}
    </>
  );
}
