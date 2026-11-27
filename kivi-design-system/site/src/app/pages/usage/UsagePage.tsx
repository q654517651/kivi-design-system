import { useMemo, useState } from 'react';
import { Avatar, Button, EmptyState, Icon, Notifier, placeholderImageSrc, ScrollArea, TabItem, Tabs, Toaster, toast } from '@kivi';
import { useBalance } from '../../data/db';
import { useDemo } from '../../data/demo';
import { deleteGroup, inScope, isManager, money, ROLE_LABEL, scopeOf, statsOf, useKiwi, type KwGroup, type KwScope } from '../../data/kiwi';
import { confirm, FlowHost } from '../../flows/dialogs';
import { attempt } from '../../flows/errors';
import { DemoPanel } from '../../parts/DemoPanel';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { fmtTime, Stats, useLoad } from '../../parts/kiwi/ui';
import { AdminsDialog, CreateGroupDialog, RenameGroupDialog } from './GroupDialogs';
import { GroupSide } from './GroupSide';
import { MemberDetail } from './MemberDetail';
import { AddMemberDialog, MoveMemberDialog } from './MemberDialogs';
import { MembersTab, type ListState } from './MembersTab';
import { QuotaDialog, type QuotaMode } from './QuotaDialog';
import { ApplicationsTab, LogsTab } from './RecordsTabs';

/*
  用量管理后台（11-27 原型）：账号菜单「用量管理」在新标签页打开（#/app/admin），单独一套页面，不套主站侧栏（11-27 用户定）。
  - 顶栏：Logo · 用量管理｜项目切换（只有超管）｜角色、返回 KIVI、头像
  - 左栏（项目管理员以上）：分组列表，选哪个组右边就看哪个组（GroupSide）
  - 右边：范围名、概览，选项卡 成员与额度 / 申请单 / 操作日志；点成员进详情，左栏不动
  范围：管理员 = 本组（没有左栏）；项目管理员 = 本项目；超管 = 顶栏切项目或全平台。
*/

type Tab = 'members' | 'apps' | 'logs';
const ALL = '__all__';
const ME_AVATAR = placeholderImageSrc('ip-peek', '1:1');

export function UsageAdmin() {
  return (
    <div className="app-kw-admin">
      <Toaster />
      <Notifier />
      <FlowHost />
      <Admin />
      <DemoPanel />
    </div>
  );
}

function Admin() {
  const { role } = useDemo();
  const balance = useBalance();
  const state = useKiwi((s) => s);
  const [project, setProject] = useState(ALL);
  const base = scopeOf(role, project === ALL ? undefined : project);
  // 左栏选的组（'' = 全部）。管理员固定本组
  const [group, setGroup] = useState('');
  const pickedGroup = state.groups.find((g) => g.id === group && (!base.projectId || g.projectId === base.projectId));
  const scope: KwScope = base.groupId ? base : pickedGroup ? { projectId: pickedGroup.projectId, groupId: pickedGroup.id } : base;

  const [tab, setTab] = useState<Tab>('members');
  const [list, setListState] = useState<ListState>({ q: '', page: 1, selected: [] });
  const setList = (patch: Partial<ListState>) => setListState((l) => ({ ...l, ...patch }));
  const [detail, setDetail] = useState<string>();
  const [quota, setQuota] = useState<{ mode: QuotaMode; ids: string[] } | null>(null);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [adminsOf, setAdminsOf] = useState<KwGroup>();
  const [renaming, setRenaming] = useState<KwGroup>();
  const load = useLoad([role, scope.projectId, scope.groupId, tab]);

  // 换范围：回到列表第一页、清掉勾选、退出详情
  const choose = (groupId: string) => {
    setGroup(groupId);
    setDetail(undefined);
    setList({ page: 1, selected: [] });
  };

  // 左栏的范围（不受选中的组影响）
  const sideGroups = useMemo(() => state.groups.filter((g) => !base.projectId || g.projectId === base.projectId), [state.groups, base.projectId]);
  const sideMembers = useMemo(() => state.members.filter((m) => inScope(m, { projectId: base.projectId })), [state.members, base.projectId]);
  const members = useMemo(() => state.members.filter((m) => inScope(m, scope)), [state.members, scope.projectId, scope.groupId]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => state.groups.filter((g) => (!scope.projectId || g.projectId === scope.projectId) && (!scope.groupId || g.id === scope.groupId)), [state.groups, scope.projectId, scope.groupId]);
  // 移到分组、添加成员能选的组：同项目里的全部组
  const projectGroups = useMemo(() => state.groups.filter((g) => !scope.projectId || g.projectId === scope.projectId), [state.groups, scope.projectId]);
  const applications = useMemo(() => state.applications.filter((a) => members.some((m) => m.id === a.memberId)), [state.applications, members]);
  const logs = useMemo(() => {
    if (!scope.projectId) return state.logs;
    const names = new Set([...groups.map((g) => g.name), ...(scope.groupId ? [] : state.projects.filter((p) => p.id === scope.projectId).map((p) => p.name))]);
    return state.logs.filter((l) => (l.scope && [...names].some((n) => l.scope!.includes(n))) || members.some((m) => m.name === l.target));
  }, [state.logs, state.projects, groups, members, scope.projectId, scope.groupId]);

  const overview = useMemo(() => {
    const stats = members.map((m) => statsOf(m, balance));
    return {
      used: stats.reduce((s, x) => s + x.weekUsed, 0),
      cost: stats.reduce((s, x) => s + x.cost, 0),
      limit: members.reduce((s, m) => s + m.weeklyLimit, 0),
      temp: stats.reduce((s, x) => s + x.tempLeft, 0),
    };
  }, [members, balance]);

  const project0 = state.projects.find((p) => p.id === scope.projectId);
  const group0 = state.groups.find((g) => g.id === scope.groupId);
  const title = group0 ? group0.name : project0 ? `${project0.name} · 全部分组` : '全平台';
  const canGroups = role === 'project-admin' || role === 'super-admin';

  const removeGroup = (g: KwGroup) =>
    confirm({
      title: `删除分组「${g.name}」？`,
      description: '组里还有成员时不能删，先把他们调到别的组。历史消耗和日志都保留。',
      confirmText: '删除',
      onConfirm: async () => {
        const ok = await attempt(() => deleteGroup(g.id).then(() => true));
        if (!ok) throw new Error('delete failed');
        if (group === g.id) choose('');
        toast.success(`已删除「${g.name}」`);
      },
    });

  const failed = applications.filter((a) => a.status === 'failed').length;

  return (
    <>
      <header className="app-kw-admin__top">
        <Icon name="Logo" className="app-kw-admin__logo" />
        <span className="app-kw-admin__name">用量管理</span>
        {role === 'super-admin' && (
          <FilterSelect
            label="项目"
            value={project}
            options={[{ value: ALL, label: '全平台' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]}
            onChange={(v) => {
              setProject(v);
              choose('');
            }}
          />
        )}
        <div className="app-kw-admin__end">
          <span className="app-kw-muted">{ROLE_LABEL[role]}</span>
          <Button size={32} variant="ghost-muted" leftIcon="LeftArrowSmall" onClick={() => (location.hash = '#/app/create')}>
            返回 KIVI
          </Button>
          <Avatar name="KIVI" size={32} src={ME_AVATAR} />
        </div>
      </header>

      {!isManager(role) ? (
        <div className="app-kw-admin__denied">
          <EmptyState type="empty" size={160} title="没有权限" description="用量管理只给管理员、项目管理员和超级管理员。你可以在账号菜单里看「我的用量」。" />
        </div>
      ) : (
        <div className="app-kw-admin__main" data-side={canGroups ? '' : undefined}>
          {canGroups && (
            <ScrollArea className="app-kw-admin__side">
              <GroupSide
                project={state.projects.find((p) => p.id === base.projectId)}
                projects={state.projects}
                groups={sideGroups}
                members={sideMembers}
                selected={pickedGroup?.id ?? ''}
                onSelect={choose}
                onCreate={() => setCreating(true)}
                onAdmins={setAdminsOf}
                onRename={setRenaming}
                onDelete={(g) => void removeGroup(g)}
              />
            </ScrollArea>
          )}
          <ScrollArea className="app-kw-admin__content">
            <div className="app-kw-admin__body">
              {detail ? (
                <MemberDetail memberId={detail} onBack={() => setDetail(undefined)} onQuota={(mode, ids) => setQuota({ mode, ids })} />
              ) : (
                <>
                  <div className="app-kw-page__head">
                    <h1>{title}</h1>
                    {group0 && <span className="app-kw-page__scope">管理员：{group0.adminIds.map((id) => state.members.find((m) => m.id === id)?.name).filter(Boolean).join('、') || '未设置'}</span>}
                    <span className="app-kw-page__updated">额度实时 · 消耗和花费可能有几分钟延迟 · 更新于 {fmtTime(Date.now()).slice(11)}</span>
                  </div>
                  <Stats
                    items={[
                      { label: '人数', value: members.length, hint: scope.groupId ? undefined : `${groups.length} 个分组` },
                      { label: '本周总消耗', value: overview.used.toLocaleString(), hint: '猕猴桃，周一 00:00 起' },
                      { label: '本周预估花费', value: money(overview.cost), hint: '已发生消耗 × 0.035' },
                      { label: '周额度合计', value: overview.limit.toLocaleString() },
                      { label: '临时额度剩余', value: overview.temp.toLocaleString() },
                    ]}
                  />
                  <Tabs className="app-kw-page__tabs" value={tab} onChange={(v) => setTab(v as Tab)}>
                    <TabItem value="members">成员与额度</TabItem>
                    <TabItem value="apps">{failed ? `申请单 · ${failed} 张加额失败` : '申请单'}</TabItem>
                    <TabItem value="logs">操作日志</TabItem>
                  </Tabs>
                  {tab === 'members' && (
                    <MembersTab
                      scope={scope}
                      members={members}
                      groups={projectGroups}
                      list={list}
                      setList={setList}
                      status={load.status}
                      onRetry={load.retry}
                      canMove={canGroups}
                      onOpen={setDetail}
                      onQuota={(mode, ids) => setQuota({ mode, ids })}
                      onAdd={() => setAdding(true)}
                      onMove={setMoving}
                    />
                  )}
                  {tab === 'apps' && <ApplicationsTab applications={applications} members={members} groups={projectGroups} canCompensate={role === 'super-admin'} status={load.status} onRetry={load.retry} />}
                  {tab === 'logs' && <LogsTab logs={logs} status={load.status} onRetry={load.retry} />}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <QuotaDialog mode={quota?.mode ?? null} memberIds={quota?.ids ?? []} onClose={() => setQuota(null)} />
      <AddMemberDialog open={adding} groups={scope.groupId ? groups : projectGroups} fixedGroup={scope.groupId} onClose={() => setAdding(false)} />
      <MoveMemberDialog memberIds={moving} groups={projectGroups.length ? projectGroups : state.groups} onDone={() => setList({ selected: [] })} onClose={() => setMoving([])} />
      <CreateGroupDialog open={creating} projects={base.projectId ? state.projects.filter((p) => p.id === base.projectId) : state.projects} defaultProject={base.projectId} onCreated={choose} onClose={() => setCreating(false)} />
      <AdminsDialog group={adminsOf} members={state.members} onClose={() => setAdminsOf(undefined)} />
      <RenameGroupDialog group={renaming} onClose={() => setRenaming(undefined)} />
    </>
  );
}
