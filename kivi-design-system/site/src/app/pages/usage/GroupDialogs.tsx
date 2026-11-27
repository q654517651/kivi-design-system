import { useEffect, useState } from 'react';
import { Avatar, Button, Checkbox, Dialog, Input, ScrollArea, toast } from '@kivi';
import { createGroup, renameGroup, setGroupAdmins, useKiwi, type KwGroup, type KwMember, type KwProject } from '../../data/kiwi';
import { attempt } from '../../flows/errors';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';

/*
  分组的几个弹窗（项目管理员以上，从左栏分组的「⋯」和「新建分组」打开）：任免组管理员、新建分组、重命名分组。
*/

/** 任免组管理员：从本组成员里勾（可以多个） */
export function AdminsDialog({ group, members, onClose }: { group?: KwGroup; members: KwMember[]; onClose: () => void }) {
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

export function CreateGroupDialog({ open, projects, defaultProject, onCreated, onClose }: { open: boolean; projects: KwProject[]; defaultProject?: string; onCreated?: (id: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [busy, setBusy] = useState(false);
  const groups = useKiwi((s) => s.groups);
  useEffect(() => {
    if (!open) return;
    setName('');
    setProject(defaultProject ?? projects[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const dup = groups.some((g) => g.projectId === project && g.name === name.trim());
  const submit = async () => {
    setBusy(true);
    const id = await attempt(() => createGroup(project, name.trim()));
    setBusy(false);
    if (id) {
      toast.success(`已新建「${name.trim()}」，可以在「⋯」里设置组管理员`);
      onCreated?.(id);
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

export function RenameGroupDialog({ group, onClose }: { group?: KwGroup; onClose: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setName(group?.name ?? ''), [group]);
  const submit = async () => {
    if (!group) return;
    setBusy(true);
    const ok = await attempt(() => renameGroup(group.id, name.trim()).then(() => true));
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Dialog
      open={!!group}
      onOpenChange={(v) => !v && !busy && onClose()}
      size={400}
      title="重命名分组"
      footer={
        <>
          <Button size={36} variant="secondary" disabled={busy} onClick={onClose}>
            取消
          </Button>
          <Button size={36} variant="primary" disabled={!name.trim() || name.trim() === group?.name} loading={busy} onClick={submit}>
            确定
          </Button>
        </>
      }
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} onKeyDown={(e) => e.key === 'Enter' && name.trim() && void submit()} />
    </Dialog>
  );
}
