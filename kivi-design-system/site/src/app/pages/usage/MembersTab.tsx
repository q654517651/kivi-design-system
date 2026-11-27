import { useEffect, useMemo, useRef } from 'react';
import { Avatar, Button, Dropdown, IconButton, Input, Menu, MenuItem, Tag, toast } from '@kivi';
import { useBalance } from '../../data/db';
import { logExport, money, pct, removeMember, scopeLabel, statsOf, type KwGroup, type KwMember, type KwScope, type KwStats } from '../../data/kiwi';
import { confirm } from '../../flows/dialogs';
import { attempt } from '../../flows/errors';
import { downloadCsv, fmtTime, KwTable, Pager, pageOf, useFitRows, type Column, type LoadStatus } from '../../parts/kiwi/ui';
import type { QuotaMode } from './QuotaDialog';

/*
  成员与额度：搜索、分页（看哪个组在左栏选）；勾选后出批量操作栏（只对勾了的人生效，筛选不会隐式选中别人）。
  点一行进成员详情，返回时筛选、页码、勾选都还在（状态在 UsagePage 里）。
  「⋯」：调整周上限、调整临时额度、调整分组（项目管理员以上）、调整权限、移除。
  调整权限组管理员也能做：在本组里设别人为组管理员、取消别的组管理员（11-27 用户定，照 Figma）。
*/

export interface ListState {
  q: string;
  page: number;
  selected: string[];
}

type Row = KwMember & { s: KwStats };

export function MembersTab({
  scope,
  members,
  groups,
  list,
  setList,
  status,
  onRetry,
  canMove,
  onOpen,
  onQuota,
  onAdd,
  onMove,
  onRole,
}: {
  scope: KwScope;
  /** 范围里的全部成员 */
  members: KwMember[];
  /** 范围里的分组 */
  groups: KwGroup[];
  list: ListState;
  setList: (patch: Partial<ListState>) => void;
  status: LoadStatus;
  onRetry: () => void;
  canMove: boolean;
  onOpen: (id: string) => void;
  onQuota: (mode: QuotaMode, ids: string[]) => void;
  onAdd: () => void;
  /** 调整分组：一个人或勾选的几个人 */
  onMove: (ids: string[]) => void;
  /** 调整权限：成员 / 组管理员 */
  onRole: (id: string) => void;
}) {
  const balance = useBalance();
  // 一页几行按窗口高度算，表格铺到分页条
  const tableRef = useRef<HTMLDivElement>(null);
  const PAGE = useFitRows(tableRef);
  const groupOf = (id: string) => groups.find((g) => g.id === id);
  const rows = useMemo<Row[]>(() => {
    const q = list.q.trim();
    return members
      .filter((m) => !q || m.name.includes(q))
      .map((m) => ({ ...m, s: statsOf(m, balance) }))
      .sort((a, b) => b.s.weekUsed - a.s.weekUsed);
  }, [members, list.q, balance]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  useEffect(() => {
    if (list.page > pages) setList({ page: pages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);
  const selected = list.selected.filter((id) => members.some((m) => m.id === id));

  const remove = (m: Row) =>
    confirm({
      title: `把 ${m.name} 移出「${groupOf(m.groupId)?.name}」？`,
      description: '只是移出这个组，不删除 KIVI 账号；他的历史消耗、申请记录和操作日志都保留，移出后这个组的管理员不能再管他的额度。',
      confirmText: '移出',
      onConfirm: async () => {
        const ok = await attempt(() => removeMember(m.id).then(() => true));
        if (!ok) throw new Error('remove failed');
        setList({ selected: list.selected.filter((x) => x !== m.id) });
        toast.success(`已移出 ${m.name}`);
      },
    });

  const exportRows = (target: Row[], what: string) => {
    const now = Date.now();
    downloadCsv(
      `猕猴桃用量-${scopeLabel(scope)}-${fmtTime(now, false)}`,
      ['姓名', '项目', '分组', '周上限', '本周已用', '本周剩余', '临时额度剩余', '本周预估花费(美元)', '采纳率', '下载率'],
      target.map((m) => [m.name, scopeLabel({ projectId: m.projectId }), groupOf(m.groupId)?.name ?? '', m.weeklyLimit, m.s.weekUsed, m.s.weekLeft, m.s.tempLeft, m.s.cost.toFixed(2), pct(m.adoption), pct(m.download)]),
      [`范围：${scopeLabel(scope)}`, `统计周期：本周`, `数据更新时间：${fmtTime(now)}`, `折算汇率：1 猕猴桃 = 0.035 美元`],
    );
    logExport(`${scopeLabel(scope)} 成员列表`, `${what} · ${target.length} 人`);
    toast.success(`已导出 ${target.length} 人`);
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      title: '姓名',
      width: 180,
      render: (m) => (
        <span className="app-kw-name">
          <Avatar name={m.name} size={24} type="text" />
          <span>{m.name}</span>
          {groupOf(m.groupId)?.adminIds.includes(m.id) && <Tag>管理员</Tag>}
        </span>
      ),
    },
    ...(scope.groupId ? [] : [{ key: 'group', title: '分组', width: 120, render: (m: Row) => groupOf(m.groupId)?.name }]),
    { key: 'limit', title: '周上限', width: 96, align: 'right', render: (m) => m.weeklyLimit.toLocaleString() },
    { key: 'used', title: '本周已用', width: 96, align: 'right', render: (m) => m.s.weekUsed.toLocaleString() },
    { key: 'left', title: '本周剩余', width: 96, align: 'right', render: (m) => <span className={m.s.weekLeft === 0 ? 'app-kw-danger' : undefined}>{m.s.weekLeft.toLocaleString()}</span> },
    { key: 'temp', title: '临时额度剩余', width: 120, align: 'right', render: (m) => (m.s.tempLeft ? m.s.tempLeft.toLocaleString() : <span className="app-kw-muted">0</span>) },
    { key: 'cost', title: '本周预估花费', width: 120, align: 'right', render: (m) => money(m.s.cost) },
    { key: 'adoption', title: '采纳率', width: 88, align: 'right', render: (m) => pct(m.adoption) },
    { key: 'download', title: '下载率', width: 88, align: 'right', render: (m) => pct(m.download) },
    {
      key: 'more',
      title: '',
      width: 64,
      fixed: true,
      align: 'right',
      render: (m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Dropdown placement="bottom-end" trigger={<IconButton icon="More" label="更多操作" variant="ghost-muted" size={28} />}>
            <Menu>
              <MenuItem onClick={() => onQuota('limit', [m.id])}>调整周上限</MenuItem>
              <MenuItem onClick={() => onQuota('temp', [m.id])}>调整临时额度</MenuItem>
              {canMove && <MenuItem onClick={() => onMove([m.id])}>调整分组</MenuItem>}
              <MenuItem onClick={() => onRole(m.id)}>调整权限</MenuItem>
              <MenuItem variant="danger" onClick={() => void remove(m)}>
                移除
              </MenuItem>
            </Menu>
          </Dropdown>
        </span>
      ),
    },
  ];

  return (
    <>
      {selected.length ? (
        <div className="app-kw-batch">
          <span>已选 {selected.length} 人</span>
          <Button size={28} variant="secondary" onClick={() => onQuota('limit', selected)}>
            批量调整周上限
          </Button>
          <Button size={28} variant="secondary" onClick={() => onQuota('add', selected)}>
            批量增加额度
          </Button>
          {canMove && (
            <Button size={28} variant="secondary" onClick={() => onMove(selected)}>
              移到分组
            </Button>
          )}
          <Button size={28} variant="secondary" onClick={() => exportRows(rows.filter((r) => selected.includes(r.id)), '勾选的成员')}>
            导出所选
          </Button>
          <Button size={28} variant="ghost-muted" onClick={() => setList({ selected: [] })}>
            取消选择
          </Button>
        </div>
      ) : (
        <div className="app-kw-toolbar">
          <Input value={list.q} onChange={(e) => setList({ q: e.target.value, page: 1 })} leftIcon="Search" placeholder="搜索姓名" clearable onClear={() => setList({ q: '', page: 1 })} />
          <div className="app-kw-toolbar__end">
            <Button size={32} variant="secondary" leftIcon="Download" disabled={status !== 'ready' || !rows.length} onClick={() => exportRows(rows, '当前筛选')}>
              导出
            </Button>
            <Button size={32} variant="primary" leftIcon="AddSmall" onClick={onAdd}>
              添加成员
            </Button>
          </div>
        </div>
      )}
      <div ref={tableRef}>
      <KwTable
        columns={columns}
        rows={pageOf(rows, list.page, PAGE)}
        rowKey={(m) => m.id}
        selected={selected}
        onSelectedChange={(ids) => setList({ selected: ids })}
        onRowClick={(m) => onOpen(m.id)}
        status={status}
        onRetry={onRetry}
        empty={list.q ? '没有符合条件的成员' : '这个范围里还没有成员'}
        skeletonRows={PAGE}
      />
      </div>
      {status === 'ready' && <Pager total={rows.length} page={list.page} pageSize={PAGE} onChange={(page) => setList({ page })} />}
    </>
  );
}
