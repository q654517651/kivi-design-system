import { useMemo, useState } from 'react';
import { Avatar, Button, EmptyState, Notifier, placeholderImageSrc, ScrollArea, TabItem, Tabs, Toaster, toast } from '@kivi';
import { useBalance } from '../../data/db';
import { useDemo } from '../../data/demo';
import { deleteGroup, inScope, isManager, money, ROLE_LABEL, scopeOf, statsOf, useKiwi, type KwGroup, type KwScope } from '../../data/kiwi';
import { confirm, FlowHost } from '../../flows/dialogs';
import { attempt } from '../../flows/errors';
import { DemoPanel } from '../../parts/DemoPanel';
import { Stats, useLoad } from '../../parts/kiwi/ui';
import { AdminsDialog, CreateGroupDialog, RenameGroupDialog } from './GroupDialogs';
import { GroupSide } from './GroupSide';
import { MemberDetail } from './MemberDetail';
import { AddMemberDialog, MoveMemberDialog } from './MemberDialogs';
import { MembersTab, type ListState } from './MembersTab';
import { QuotaDialog, type QuotaMode } from './QuotaDialog';
import { LogsTab } from './RecordsTabs';

/*
  用量管理后台（11-27 原型）：账号菜单「用量管理」在新标签页打开（#/app/admin），单独一套页面，不套主站侧栏（11-27 用户定）。
  - 左边侧栏和主站侧栏同一套（GroupSide）：Logo（回 KIVI）、全部分组、「分组」一段（新建、组的「⋯」）；选哪个组右边就看哪个组
  - 右边：范围名、概览，选项卡 成员与额度 / 操作日志（申请在飞书审批里，状态同步不过来，不放申请单，11-27 用户定）；右上角色和头像；点成员进详情，侧栏不动
  范围：管理员 = 本组（没有侧栏）；项目管理员 = 本项目；超管 = 侧栏顶上切项目（全平台 / 某个项目），切到项目后和项目管理员一样。
*/

type Tab = 'members' | 'logs';
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
  // 超管切的项目（侧栏顶上的下拉），'' = 全平台
  const [project, setProject] = useState('');
  const base = scopeOf(role, project || undefined);
  // 侧栏选的组，'' = 全部分组（全平台时就是全平台）。管理员固定本组
  const [group, setGroup] = useState('');
  const pickedGroup = base.projectId ? state.groups.find((g) => g.id === group && g.projectId === base.projectId) : undefined;
  const scope: KwScope = base.groupId ? base : pickedGroup ? { projectId: pickedGroup.projectId, groupId: pickedGroup.id } : base;

  const [tab, setTab] = useState<Tab>('members');
  const [list, setListState] = useState<ListState>({ q: '', page: 1, selected: [] });
  const setList = (patch: Partial<ListState>) => setListState((l) => ({ ...l, ...patch }));
  const [detail, setDetail] = useState<string>();
  const [quota, setQuota] = useState<{ mode: QuotaMode; ids: string[] } | null>(null);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<string[]>([]);
  const [creating, setCreating] = useState<string>();
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
  const members = useMemo(() => state.members.filter((m) => inScope(m, scope)), [state.members, scope.projectId, scope.groupId]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => state.groups.filter((g) => (!scope.projectId || g.projectId === scope.projectId) && (!scope.groupId || g.id === scope.groupId)), [state.groups, scope.projectId, scope.groupId]);
  // 移到分组、添加成员能选的组：同项目里的全部组
  const projectGroups = useMemo(() => state.groups.filter((g) => !scope.projectId || g.projectId === scope.projectId), [state.groups, scope.projectId]);
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

  const goHome = () => (location.hash = '#/app/create');
  // 右上：角色 + 头像（管理员没有侧栏时，Logo 那个「回 KIVI」也放这里）
  const account = (
    <span className="app-kw-admin__account">
      <span className="app-kw-muted">{ROLE_LABEL[role]}</span>
      {!canGroups && (
        <Button size={32} variant="ghost-muted" leftIcon="LeftArrowSmall" onClick={goHome}>
          返回 KIVI
        </Button>
      )}
      <Avatar name="KIVI" size={32} src={ME_AVATAR} />
    </span>
  );

  return (
    <>
      {!isManager(role) ? (
        <div className="app-kw-admin__denied">
          <EmptyState
            type="empty"
            size={160}
            title="没有权限"
            description="用量管理只给管理员、项目管理员和超级管理员。你可以在账号菜单里看「我的用量」。"
            action={
              <Button size={32} variant="secondary" onClick={goHome}>
                返回 KIVI
              </Button>
            }
          />
        </div>
      ) : (
        <div className="app-kw-admin__main" data-side={canGroups ? '' : undefined}>
          {canGroups && (
            <GroupSide
              project={state.projects.find((p) => p.id === base.projectId)}
              canPickProject={role === 'super-admin'}
              onPickProject={(id) => {
                setProject(id);
                choose('');
              }}
              projects={state.projects}
              groups={sideGroups}
              selected={pickedGroup?.id ?? ''}
              onSelect={choose}
              onHome={goHome}
              onCreate={setCreating}
              onAdmins={setAdminsOf}
              onRename={setRenaming}
              onDelete={(g) => void removeGroup(g)}
            />
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
                    {account}
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
      <CreateGroupDialog open={!!creating} projects={state.projects.filter((p) => p.id === creating)} defaultProject={creating} onCreated={choose} onClose={() => setCreating(undefined)} />
      <AdminsDialog group={adminsOf} members={state.members} onClose={() => setAdminsOf(undefined)} />
      <RenameGroupDialog group={renaming} onClose={() => setRenaming(undefined)} />
    </>
  );
}
