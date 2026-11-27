import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Checkbox, Dialog, Dropdown, IconButton, Input, Menu, MenuItem, ScrollArea, toast } from '@kivi';
import { useBalance } from '../../data/db';
import { createGroup, money, setGroupAdmins, statsOf, useKiwi, type KwGroup, type KwMember, type KwProject } from '../../data/kiwi';
import { attempt } from '../../flows/errors';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { KwTable, type Column, type LoadStatus } from '../../parts/kiwi/ui';

/*
  分组管理（项目管理员以上）：每组的管理员、人数、周额度合计、本周已用、预估花费、平均采纳率。
  点一行 = 下钻到成员列表并按这个组筛选。「⋯」：任免组管理员。右上新建分组。
  超管看全平台时多一列「项目」。
*/

type Row = KwGroup & { project?: string; count: number; limit: number; used: number; cost: number; adoption: number };

export function GroupsTab({
  groups,
  members,
  projects,
  showProject,
  status,
  onRetry,
  onDrill,
}: {
  groups: KwGroup[];
  members: KwMember[];
  projects: KwProject[];
  showProject: boolean;
  status: LoadStatus;
  onRetry: () => void;
  onDrill: (groupId: string) => void;
}) {
  const balance = useBalance();
  const [adminsOf, setAdminsOf] = useState<string>();
  const [creating, setCreating] = useState(false);
  const rows = useMemo<Row[]>(
    () =>
      groups.map((g) => {
        const inGroup = members.filter((m) => m.groupId === g.id);
        const stats = inGroup.map((m) => statsOf(m, balance));
        const rated = inGroup.filter((m) => !Number.isNaN(m.adoption));
        return {
          ...g,
          project: projects.find((p) => p.id === g.projectId)?.name,
          count: inGroup.length,
          limit: inGroup.reduce((s, m) => s + m.weeklyLimit, 0),
          used: stats.reduce((s, x) => s + x.weekUsed, 0),
          cost: stats.reduce((s, x) => s + x.cost, 0),
          adoption: rated.length ? rated.reduce((s, m) => s + m.adoption, 0) / rated.length : NaN,
        };
      }),
    [groups, members, projects, balance],
  );
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name;

  const columns: Column<Row>[] = [
    ...(showProject ? [{ key: 'project', title: '项目', width: 120, render: (g: Row) => g.project }] : []),
    { key: 'name', title: '分组', width: 140, render: (g) => g.name },
    { key: 'admins', title: '组管理员', render: (g) => (g.adminIds.length ? g.adminIds.map(nameOf).filter(Boolean).join('、') : <span className="app-kw-muted">未设置</span>) },
    { key: 'count', title: '人数', width: 80, align: 'right', render: (g) => g.count },
    { key: 'limit', title: '周额度合计', width: 120, align: 'right', render: (g) => g.limit.toLocaleString() },
    { key: 'used', title: '本周已用', width: 112, align: 'right', render: (g) => g.used.toLocaleString() },
    { key: 'cost', title: '本周预估花费', width: 120, align: 'right', render: (g) => money(g.cost) },
    { key: 'adoption', title: '平均采纳率', width: 112, align: 'right', render: (g) => (Number.isNaN(g.adoption) ? '—' : `${(g.adoption * 100).toFixed(1)}%`) },
    {
      key: 'more',
      title: '',
      width: 64,
      align: 'right',
      render: (g) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Dropdown placement="bottom-end" trigger={<IconButton icon="More" label="更多操作" variant="ghost-muted" size={28} />}>
            <Menu>
              <MenuItem onClick={() => onDrill(g.id)}>查看成员</MenuItem>
              <MenuItem onClick={() => setAdminsOf(g.id)}>任免组管理员</MenuItem>
            </Menu>
          </Dropdown>
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="app-kw-toolbar">
        <span className="app-kw-muted">点一行看这个组的成员</span>
        <div className="app-kw-toolbar__end">
          <Button size={32} variant="primary" leftIcon="AddSmall" onClick={() => setCreating(true)}>
            新建分组
          </Button>
        </div>
      </div>
      <KwTable columns={columns} rows={rows} rowKey={(g) => g.id} onRowClick={(g) => onDrill(g.id)} status={status} onRetry={onRetry} empty="还没有分组" skeletonRows={4} />
      <AdminsDialog group={groups.find((g) => g.id === adminsOf)} members={members} onClose={() => setAdminsOf(undefined)} />
      <CreateGroupDialog open={creating} projects={showProject ? projects : projects.filter((p) => groups.some((g) => g.projectId === p.id))} onClose={() => setCreating(false)} />
    </>
  );
}

/** 任免组管理员：从本组成员里勾（可以多个） */
function AdminsDialog({ group, members, onClose }: { group?: KwGroup; members: KwMember[]; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => setIds(group?.adminIds ?? []), [group]);
  const inGroup = members.filter((m) => m.groupId === group?.id);
  const submit = async () => {
    if (!group) return;
    setBusy(true);
    const ok = await attempt(() => setGroupAdmins(group.id, ids).then(() => true));
    setBusy(false);
    if (ok) {
      toast.success('已更新组管理员');
      onClose();
    }
  };
  return (
    <Dialog
      open={!!group}
      onOpenChange={(v) => !v && !busy && onClose()}
      size={400}
      title={`任免组管理员 · ${group?.name ?? ''}`}
      description="组管理员只能看和管本组的用量、成员和额度"
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" loading={busy} onClick={submit}>
            保存
          </Button>
        </>
      }
    >
      <ScrollArea className="app-kw-people">
        <div className="app-kw-form">
          {inGroup.map((m) => (
            <Checkbox key={m.id} checked={ids.includes(m.id)} onChange={(v) => setIds((all) => (v ? [...all, m.id] : all.filter((x) => x !== m.id)))}>
              <span className="app-kw-name">
                <Avatar name={m.name} size={24} type="text" />
                <span>{m.name}</span>
              </span>
            </Checkbox>
          ))}
        </div>
      </ScrollArea>
    </Dialog>
  );
}

function CreateGroupDialog({ open, projects, onClose }: { open: boolean; projects: KwProject[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [busy, setBusy] = useState(false);
  const groups = useKiwi((s) => s.groups);
  useEffect(() => {
    if (!open) return;
    setName('');
    setProject(projects[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const dup = groups.some((g) => g.projectId === project && g.name === name.trim());
  const submit = async () => {
    setBusy(true);
    const ok = await attempt(() => createGroup(project, name.trim()).then(() => true));
    setBusy(false);
    if (ok) {
      toast.success(`已新建「${name.trim()}」，可以在「⋯」里设置组管理员`);
      onClose();
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && !busy && onClose()}
      size={400}
      title="新建分组"
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" disabled={!name.trim() || !project || dup} loading={busy} onClick={submit}>
            新建
          </Button>
        </>
      }
    >
      <div className="app-kw-form">
        {projects.length > 1 && (
          <label className="app-kw-form__field">
            <span>项目</span>
            <FilterSelect label="项目" value={project} options={projects.map((p) => ({ value: p.id, label: p.name }))} onChange={setProject} />
          </label>
        )}
        <label className="app-kw-form__field">
          <span>分组名</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="比如 视觉组" maxLength={20} invalid={dup} />
          {dup && <span className="app-kw-form__error">这个项目里已经有同名分组</span>}
        </label>
      </div>
    </Dialog>
  );
}
