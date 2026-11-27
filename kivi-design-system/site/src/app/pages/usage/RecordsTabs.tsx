import { useRef, useState } from 'react';
import { Input } from '@kivi';
import type { KwLog } from '../../data/kiwi';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { fmtTime, KwTable, Pager, pageOf, useFitRows, type Column, type LoadStatus } from '../../parts/kiwi/ui';

/*
  操作日志：额度调整、成员增删、分组和管理员变更、导出，记操作人、时间、对象、前后值（不记原因，11-27 用户定）。
*/


const LOG_TYPES = ['全部', '调整周上限', '增加周额度', '增加临时额度', '减少临时额度', '添加成员', '移除成员', '调整分组', '新建分组', '任免组管理员', '重命名分组', '删除分组', '导出'];

export function LogsTab({ logs, status, onRetry }: { logs: KwLog[]; status: LoadStatus; onRetry: () => void }) {
  const [type, setType] = useState('全部');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  // 一页几行按窗口高度算，表格铺到分页条
  const tableRef = useRef<HTMLDivElement>(null);
  const PAGE = useFitRows(tableRef);
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
  ];
  return (
    <>
      <div className="app-kw-toolbar">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} leftIcon="Search" placeholder="搜对象或操作人" clearable onClear={() => setQ('')} />
        <FilterSelect label="操作类型" value={type} options={LOG_TYPES.map((t) => ({ value: t, label: t === '全部' ? '全部操作' : t }))} onChange={(v) => { setType(v); setPage(1); }} />
      </div>
      <div ref={tableRef}>
        <KwTable columns={columns} rows={pageOf(rows, Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE))), PAGE)} rowKey={(l) => l.id} status={status} onRetry={onRetry} empty="没有符合条件的日志" skeletonRows={PAGE} />
      </div>
      {status === 'ready' && <Pager total={rows.length} page={page} pageSize={PAGE} onChange={setPage} />}
    </>
  );
}
