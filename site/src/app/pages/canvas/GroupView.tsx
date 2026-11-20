import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AssetThumb, Button, ButtonGroup, Input, Menu, MenuItem, NodeWrapper, Popover, ScrollArea, TabItem, Tabs, toast } from '@kivi';
import { arrangeTargets, arrangeNodes } from '../../data/canvas-layout';
import { cancelGroup, childrenOf, createWorkflow, executeGroup, groupBusy, groupCover, updateWorkflow, useGroupRun } from '../../data/canvas-group';
import { ungroup, updateNode } from '../../data/canvas-doc';
import { downloadNodes } from './download';
import { useMyWorkflows } from '../../data/workflows';
import { attempt } from '../../flows/errors';
import { GROUP_TEXT, WORKFLOW_NAME_MAX } from '../../rules/canvas-group';
import type { CanvasDoc, CanvasNode } from '../../data/types';
import { ArrangeButton } from './SelectionBar';
import './canvas-extra.css';

/*
  组（照线上 nodes/group、components/group）：
  - GroupFrame：画在画布上的组。外框是 NodeWrapper（组名在上方，悬停、选中有描边），里面铺一块底。
    点底选中组、拖底整组挪（组里的节点跟着），组名双击原地改（回车、点外面保存，Esc 取消，空的不改；双击由画布判断）。
  - GroupFloat：只选中一个组时，组上方的工具栏：整组执行 / 取消、保存工作流、解组、布局、下载。
    背景色（线上 无 / 青 / 蓝 / 紫 / 橙 / 黄）tokens 里没有对应颜色，先不做（只有「无」）。
*/

/** 节点名最多 100 字（线上 MAX_NODE_TITLE_LENGTH） */
const NAME_MAX = 100;
const TOOLBAR_GAP = 40;

function GroupName({ name, editing, onRename, onEnd }: { name: string; editing: boolean; onRename: (name: string) => void; onEnd: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [editing]);
  const finish = (save: boolean) => {
    const next = (ref.current?.textContent ?? '').trim().slice(0, NAME_MAX);
    onEnd();
    if (save && next && next !== name) onRename(next);
  };
  return (
    <span
      // 退出编辑时换一个元素：编辑时浏览器改过里面的文字，不让 React 接着用旧的文字节点
      key={editing ? 'edit' : 'view'}
      ref={ref}
      className="app-cv-group__name"
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={() => editing && finish(true)}
      onKeyDown={(e) => {
        if (!editing || e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }}
    >
      {name}
    </span>
  );
}

export interface GroupFrameProps {
  canvasId: string;
  group: CanvasNode;
  selected: boolean;
  /** 组名在原地改（双击组名，画布那边判断） */
  renaming: boolean;
  onRenameEnd: () => void;
}

/** 画布上的组：data-node 让画布按节点处理（点选、拖动、右键），data-group 让连线不落在组上 */
export function GroupFrame({ canvasId, group, selected, renaming, onRenameEnd }: GroupFrameProps) {
  return (
    <div data-node={group.id} data-group="" style={{ left: group.x, top: group.y }}>
      <NodeWrapper name={<GroupName name={group.name} editing={renaming} onEnd={onRenameEnd} onRename={(name) => updateNode(canvasId, group.id, { name })} />} selected={selected || undefined} style={{ width: group.w, height: group.h }}>
        <div className="app-cv-group__bg" />
      </NodeWrapper>
    </div>
  );
}

// ---------- 保存工作流 ----------

function SavePanel({ canvasId, doc, groupId, onClose }: { canvasId: string; doc: CanvasDoc; groupId: string; onClose: () => void }) {
  const mine = useMyWorkflows();
  const [tab, setTab] = useState<'create' | 'update'>('create');
  const [name, setName] = useState<string>(GROUP_TEXT.defaultWorkflowName);
  const [cover, setCover] = useState(() => groupCover(doc, groupId));
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasNodes = childrenOf(doc, groupId).length > 0;

  const submit = async () => {
    if (tab === 'create') {
      if (!name.trim()) return toast.warning(GROUP_TEXT.nameRequired);
      if (!hasNodes) return toast.warning(GROUP_TEXT.emptyGroupCreate);
    } else {
      if (!picked) return toast.warning(GROUP_TEXT.pickHistory);
      if (!hasNodes) return toast.warning(GROUP_TEXT.emptyGroupUpdate);
    }
    setSaving(true);
    const ok = await attempt(() => (tab === 'create' ? createWorkflow(canvasId, groupId, name.trim(), cover) : updateWorkflow(canvasId, groupId, picked!)).then(() => true));
    setSaving(false);
    if (!ok) return;
    toast.success(tab === 'create' ? GROUP_TEXT.created : GROUP_TEXT.updated);
    onClose();
  };

  return (
    <div className="app-cv-save">
      <Tabs value={tab} onChange={(v) => setTab(v as 'create' | 'update')} aria-label={GROUP_TEXT.saveWorkflow}>
        <TabItem value="create">{GROUP_TEXT.createTab}</TabItem>
        <TabItem value="update">{GROUP_TEXT.updateTab}</TabItem>
      </Tabs>
      {tab === 'create' ? (
        <>
          <div className="app-cv-save__cover">
            <img src={cover} alt="" />
            <Button variant="on-media" size={28} leftIcon="Upload" onClick={() => fileRef.current?.click()}>
              {GROUP_TEXT.upload}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) setCover(URL.createObjectURL(f));
              }}
            />
          </div>
          <label className="app-cv-save__field">
            {GROUP_TEXT.nameLabel}
            <Input value={name} maxLength={WORKFLOW_NAME_MAX} placeholder={GROUP_TEXT.namePlaceholder} counter={`${name.trim().length}/${WORKFLOW_NAME_MAX}`} onChange={(e) => setName(e.target.value)} />
          </label>
        </>
      ) : mine.length ? (
        <ScrollArea maxHeight={240}>
          <Menu variant="plain" role="listbox" aria-label={GROUP_TEXT.updateTab}>
            {mine.map((w) => (
              <MenuItem key={w.id} thumb={<AssetThumb size={24} src={w.cover} />} selected={picked === w.id} onClick={() => setPicked(w.id)}>
                {w.name}
              </MenuItem>
            ))}
          </Menu>
        </ScrollArea>
      ) : (
        <div className="app-cv-save__empty">{GROUP_TEXT.noHistory}</div>
      )}
      <div className="app-cv-actions">
        <Button onClick={onClose}>取消</Button>
        <Button variant="primary" loading={saving} disabled={tab === 'create' ? !name.trim() : !picked} onClick={() => void submit()}>
          确认
        </Button>
      </div>
    </div>
  );
}

// ---------- 组工具栏 ----------

export interface GroupFloatProps {
  canvasId: string;
  doc: CanvasDoc;
  group: CanvasNode;
  /** 画布缩放：工具栏不跟着缩（缩到 50% 以下才跟着小），同节点工具栏 */
  zoom: number;
}

export function GroupFloat({ canvasId, doc, group, zoom }: GroupFloatProps) {
  const run = useGroupRun(group.id);
  const busy = groupBusy(doc, group.id);
  const [saveOpen, setSaveOpen] = useState(false);
  const kids = childrenOf(doc, group.id);
  const canDownload = kids.some((n) => !!n.items?.length || !!n.text);
  const style = { '--cv-unzoom': 1 / Math.max(zoom, 0.5), left: group.x + group.w / 2, top: group.y - TOOLBAR_GAP } as CSSProperties;

  return (
    <div className="cv-float cv-float--toolbar" style={style}>
      <ButtonGroup variant="glass" size={44} aria-label="组工具栏">
        {run ? (
          <Button loading={run.cancelling} onClick={() => void cancelGroup(group.id)}>
            {run.cancelling ? GROUP_TEXT.cancelling : GROUP_TEXT.cancel}
          </Button>
        ) : (
          <Button leftIcon="PlayLine" disabled={busy} onClick={() => executeGroup(canvasId, group.id)}>
            {GROUP_TEXT.execute}
          </Button>
        )}
        <Popover
          variant="panel"
          on="click"
          placement="bottom-start"
          open={saveOpen && !busy}
          onOpenChange={setSaveOpen}
          content={saveOpen ? <SavePanel canvasId={canvasId} doc={doc} groupId={group.id} onClose={() => setSaveOpen(false)} /> : <span />}
        >
          <Button leftIcon="Template" disabled={busy || !!run}>
            {GROUP_TEXT.saveWorkflow}
          </Button>
        </Popover>
        <Button leftIcon="UnGroup" disabled={busy || !!run} onClick={() => ungroup(canvasId, group.id)}>
          {GROUP_TEXT.ungroup}
        </Button>
        <ArrangeButton disabled={arrangeTargets(doc, [group.id]).length < 2} onPick={(mode) => arrangeNodes(canvasId, [group.id], mode)} />
        <Button leftIcon="Download" disabled={busy || !canDownload} onClick={() => downloadNodes(kids)}>
          {GROUP_TEXT.download}
        </Button>
      </ButtonGroup>
    </div>
  );
}
