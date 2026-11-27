import { useEffect, useState } from 'react';
import { Avatar, Button, Dialog, Input, Menu, MenuItem, NumberInput, ScrollArea, toast } from '@kivi';
import { addMember, DIRECTORY, moveMembers, useKiwi, type KwGroup } from '../../data/kiwi';
import { attempt } from '../../flows/errors';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';

/*
  添加成员：飞书通讯录里搜人（演示是一份假名单），选分组（管理员只能是本组）、填初始周上限。
  已在当前项目里的人列表里直接标「已在 X」不能选；后端也再拦一次。
  调整分组 / 批量移到分组（项目管理员以上）：同项目里换组，之前的消耗按原来的组算。
*/

const DEFAULT_LIMIT = '3000';

export function AddMemberDialog({ open, groups, fixedGroup, onClose }: { open: boolean; groups: KwGroup[]; fixedGroup?: string; onClose: () => void }) {
  const members = useKiwi((s) => s.members);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string>();
  const [group, setGroup] = useState(fixedGroup ?? groups[0]?.id ?? '');
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setPicked(undefined);
    setGroup(fixedGroup ?? groups[0]?.id ?? '');
    setLimit(DEFAULT_LIMIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const projectId = groups.find((g) => g.id === group)?.projectId;
  const already = (id: string, name: string) => members.find((m) => (m.id === id || m.name === name) && m.projectId === projectId);
  const people = DIRECTORY.filter((p) => !q.trim() || p.name.includes(q.trim()) || p.dept.includes(q.trim()));
  const person = DIRECTORY.find((p) => p.id === picked);
  const n = Number(limit);
  const ok = !!person && !!group && limit !== '' && Number.isInteger(n) && n >= 0;

  const submit = async () => {
    if (!person) return;
    setBusy(true);
    const done = await attempt(() => addMember(person, group, n).then(() => true));
    setBusy(false);
    if (done) {
      toast.success(`已添加 ${person.name}`);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && !busy && onClose()}
      size={560}
      title="添加成员"
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" disabled={!ok} loading={busy} onClick={submit}>
            添加
          </Button>
        </>
      }
    >
      <div className="app-kw-form">
        <label className="app-kw-form__field">
          <span>飞书人员</span>
          <Input value={q} onChange={(e) => setQ(e.target.value)} leftIcon="Search" placeholder="搜姓名或部门" clearable onClear={() => setQ('')} />
        </label>
        <ScrollArea className="app-kw-people">
          <Menu variant="plain" role="listbox" aria-label="飞书人员" width="100%">
          {people.map((p) => {
            const dup = already(p.id, p.name);
            return (
              <MenuItem
                key={p.id}
                thumb={<Avatar name={p.name} size={24} type="text" />}
                selected={picked === p.id}
                disabled={!!dup}
                onClick={() => setPicked(p.id)}
                description={dup ? `已在「${groups.find((g) => g.id === dup.groupId)?.name ?? '本项目'}」` : p.dept}
              >
                {p.name}
              </MenuItem>
            );
          })}
          </Menu>
          {!people.length && <p className="app-kw-form__hint">没找到这个人</p>}
        </ScrollArea>
        <label className="app-kw-form__field">
          <span>所属分组</span>
          <FilterSelect label="所属分组" value={group} options={groups.map((g) => ({ value: g.id, label: g.name }))} onChange={setGroup} disabled={!!fixedGroup} />
        </label>
        <label className="app-kw-form__field">
          <span>初始周上限</span>
          <NumberInput value={limit} onChange={setLimit} min={0} precision={0} unit="猕猴桃" />
        </label>
      </div>
    </Dialog>
  );
}

export function MoveMemberDialog({ memberIds, groups, onDone, onClose }: { memberIds: string[]; groups: KwGroup[]; onDone?: () => void; onClose: () => void }) {
  const all = useKiwi((s) => s.members);
  const members = all.filter((m) => memberIds.includes(m.id));
  const first = members[0];
  const [group, setGroup] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (first) setGroup(members.every((m) => m.groupId === first.groupId) ? first.groupId : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIds.join()]);
  // 只能在同一个项目里换组
  const options = groups.filter((g) => g.projectId === first?.projectId);
  const moving = members.filter((m) => m.groupId !== group);
  const target = options.find((g) => g.id === group);

  const submit = async () => {
    setBusy(true);
    const done = await attempt(() => moveMembers(moving.map((m) => m.id), group).then(() => true));
    setBusy(false);
    if (done) {
      toast.success(moving.length > 1 ? `已把 ${moving.length} 人调到「${target?.name}」` : `已把 ${moving[0]?.name} 调到「${target?.name}」`);
      onDone?.();
      onClose();
    }
  };

  return (
    <Dialog
      open={memberIds.length > 0}
      onOpenChange={(v) => !v && !busy && onClose()}
      size={400}
      title={members.length > 1 ? `把 ${members.length} 人移到分组` : '调整分组'}
      description="之前的消耗还算在原来的组，换组后按新组管理"
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" disabled={!target || !moving.length} loading={busy} onClick={submit}>
            确定
          </Button>
        </>
      }
    >
      {first && (
        <FilterSelect label="分组" value={group} options={[...(group ? [] : [{ value: '', label: '选择分组' }]), ...options.map((g) => ({ value: g.id, label: g.name }))]} onChange={setGroup} />
      )}
    </Dialog>
  );
}
