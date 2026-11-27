import { useMemo, useState } from 'react';
import { EmptyState, ScrollArea, TabItem, Tabs } from '@kivi';
import { useBalance } from '../../data/db';
import { useDemo } from '../../data/demo';
import { inScope, isManager, money, ROLE_LABEL, scopeLabel, scopeOf, statsOf, useKiwi } from '../../data/kiwi';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';
import { fmtTime, Stats, useLoad } from '../../parts/kiwi/ui';
import { GroupsTab } from './GroupsTab';
import { MemberDetail } from './MemberDetail';
import { AddMemberDialog, MoveMemberDialog } from './MemberDialogs';
import { MembersTab, type ListState } from './MembersTab';
import { QuotaDialog, type QuotaMode } from './QuotaDialog';
import { ApplicationsTab, LogsTab } from './RecordsTabs';

/*
  用量管理（11-27 原型）：账号菜单「用量管理」进来，管理员以上才有。整页，在主站侧栏右边，和资产页一个位置。
  范围跟角色走（演示开关里切）：管理员 = 当前项目的本组；项目管理员 = 本项目全部分组；超管 = 可切项目或看全平台。
  上面：标题、范围、数据更新时间、概览（人数、本周总消耗、预估花费、周额度合计、临时额度剩余）。
  下面选项卡：成员与额度 / 分组管理（项目管理员以上）/ 申请单（加额失败在这里补发，超管）/ 操作日志。
  点成员进详情，返回时列表的筛选、页码、勾选都留着。
*/

type Tab = 'members' | 'groups' | 'apps' | 'logs';
const ALL = '__all__';

export function UsagePage() {
  const { role } = useDemo();
  const balance = useBalance();
  const state = useKiwi((s) => s);
  const [project, setProject] = useState(ALL);
  const scope = scopeOf(role, project === ALL ? undefined : project);
  const [tab, setTab] = useState<Tab>('members');
  const [list, setListState] = useState<ListState>({ q: '', group: 'all', page: 1, selected: [] });
  const setList = (patch: Partial<ListState>) => setListState((l) => ({ ...l, ...patch }));
  const [detail, setDetail] = useState<string>();
  const [quota, setQuota] = useState<{ mode: QuotaMode; ids: string[] } | null>(null);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<string>();
  const load = useLoad([role, project, tab]);

  const members = useMemo(() => state.members.filter((m) => inScope(m, scope)), [state.members, scope.projectId, scope.groupId]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => state.groups.filter((g) => (!scope.projectId || g.projectId === scope.projectId) && (!scope.groupId || g.id === scope.groupId)), [state.groups, scope.projectId, scope.groupId]);
  const applications = useMemo(() => state.applications.filter((a) => members.some((m) => m.id === a.memberId)), [state.applications, members]);
  const logs = useMemo(() => {
    if (role === 'super-admin' && !scope.projectId) return state.logs;
    const names = new Set([...groups.map((g) => g.name), ...state.projects.filter((p) => p.id === scope.projectId).map((p) => p.name)]);
    return state.logs.filter((l) => !l.scope || [...names].some((n) => l.scope!.includes(n)) || members.some((m) => m.name === l.target));
  }, [state.logs, state.projects, groups, members, role, scope.projectId]);

  const overview = useMemo(() => {
    const stats = members.map((m) => statsOf(m, balance));
    return {
      used: stats.reduce((s, x) => s + x.weekUsed, 0),
      cost: stats.reduce((s, x) => s + x.cost, 0),
      limit: members.reduce((s, m) => s + m.weeklyLimit, 0),
      temp: stats.reduce((s, x) => s + x.tempLeft, 0),
    };
  }, [members, balance]);

  // 角色切成「用户」还停在这页：无权限
  if (!isManager(role)) {
    return (
      <ScrollArea className="app-kw-page">
        <div className="app-kw-page__body">
          <EmptyState type="empty" size={160} title="没有权限" description="用量管理只给管理员、项目管理员和超级管理员。你可以在账号菜单里看「我的用量」。" />
        </div>
      </ScrollArea>
    );
  }

  const canGroups = role === 'project-admin' || role === 'super-admin';
  const failed = applications.filter((a) => a.status === 'failed').length;
  const tabs: { value: Tab; label: string }[] = [
    { value: 'members', label: '成员与额度' },
    ...(canGroups ? [{ value: 'groups' as Tab, label: '分组管理' }] : []),
    { value: 'apps', label: failed ? `申请单 · ${failed} 张加额失败` : '申请单' },
    { value: 'logs', label: '操作日志' },
  ];
  const current = tabs.some((t) => t.value === tab) ? tab : 'members';

  return (
    <ScrollArea className="app-kw-page">
      <div className="app-kw-page__body">
        {detail ? (
          <MemberDetail memberId={detail} onBack={() => setDetail(undefined)} onQuota={(mode, ids) => setQuota({ mode, ids })} />
        ) : (
          <>
            <div className="app-kw-page__head">
              <h1>用量管理</h1>
              {role === 'super-admin' ? (
                <FilterSelect
                  label="项目"
                  value={project}
                  options={[{ value: ALL, label: '全平台' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]}
                  onChange={(v) => {
                    setProject(v);
                    setList({ group: 'all', page: 1, selected: [] });
                  }}
                />
              ) : (
                <span className="app-kw-page__scope">{scopeLabel(scope, state)}</span>
              )}
              <span className="app-kw-muted">{ROLE_LABEL[role]}</span>
              <span className="app-kw-page__updated">额度实时 · 消耗和花费可能有几分钟延迟 · 更新于 {fmtTime(Date.now()).slice(11)}</span>
            </div>
            <Stats
              items={[
                { label: '范围', value: scopeLabel(scope, state), hint: `${groups.length} 个分组` },
                { label: '人数', value: members.length },
                { label: '本周总消耗', value: overview.used.toLocaleString(), hint: '猕猴桃，周一 00:00 起' },
                { label: '本周预估花费', value: money(overview.cost), hint: '已发生消耗 × 0.035' },
                { label: '周额度合计', value: overview.limit.toLocaleString() },
                { label: '临时额度剩余', value: overview.temp.toLocaleString() },
              ]}
            />
            <Tabs className="app-kw-page__tabs" value={current} onChange={(v) => setTab(v as Tab)}>
              {tabs.map((t) => (
                <TabItem key={t.value} value={t.value}>
                  {t.label}
                </TabItem>
              ))}
            </Tabs>
            {current === 'members' && (
              <MembersTab
                scope={scope}
                members={members}
                groups={groups}
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
            {current === 'groups' && (
              <GroupsTab
                groups={groups}
                members={members}
                projects={state.projects.filter((p) => !scope.projectId || p.id === scope.projectId)}
                showProject={!scope.projectId}
                status={load.status}
                onRetry={load.retry}
                onDrill={(groupId) => {
                  setList({ group: groupId, page: 1, selected: [] });
                  setTab('members');
                }}
              />
            )}
            {current === 'apps' && <ApplicationsTab applications={applications} members={members} groups={groups} canCompensate={role === 'super-admin'} status={load.status} onRetry={load.retry} />}
            {current === 'logs' && <LogsTab logs={logs} status={load.status} onRetry={load.retry} />}
          </>
        )}
      </div>
      <QuotaDialog mode={quota?.mode ?? null} memberIds={quota?.ids ?? []} onClose={() => setQuota(null)} />
      <AddMemberDialog open={adding} groups={groups} fixedGroup={scope.groupId} onClose={() => setAdding(false)} />
      <MoveMemberDialog memberId={moving} groups={groups} onClose={() => setMoving(undefined)} />
    </ScrollArea>
  );
}
