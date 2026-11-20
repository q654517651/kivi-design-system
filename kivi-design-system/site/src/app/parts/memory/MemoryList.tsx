import { useEffect, useRef } from 'react';
import { Button, List, ListItem, Menu, MenuItem } from '@kivi';
import { MEMORY_ITEM_MAX_CHARS } from '../../data/memory';
import type { MemoryManagerController } from './useMemoryManager';
import { NEW_MEMORY_DRAFT_KEY, PROFILE_TEXT_MAX_CHARS, formatProfileValues, memoryDraftKey, profileDraftKey, profilePlaceholder } from './utils';

/** 记忆列表：基础信息（只能编辑）+ 用户记忆（能编辑、删除、添加）。平时纯文字，悬停才出「⋯」，编辑和添加都在原地换成输入框 */
export function MemoryList({ manager }: { manager: MemoryManagerController }) {
  const { memory, questions, drafts, savingKey, locateSignal } = manager;
  const userListRef = useRef<HTMLUListElement>(null);
  const isAdding = !!drafts[NEW_MEMORY_DRAFT_KEY];

  // 新增成功后滚到用户记忆的第一条
  useEffect(() => {
    if (locateSignal || isAdding) userListRef.current?.querySelector('.kv-list-item')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [locateSignal, isAdding]);

  if (!memory) return null;

  const moreMenu = (onEdit: () => void, onDelete?: () => void) => (
    <Menu>
      <MenuItem onClick={onEdit}>编辑</MenuItem>
      {onDelete && (
        <MenuItem variant="danger" onClick={onDelete}>
          删除
        </MenuItem>
      )}
    </Menu>
  );

  // 一条：平时纯文字、悬停出「⋯」；编辑时 ListItem 原地换成输入框（取消 / 保存在框里）。草稿交给 manager 存，关弹窗时好判断有没有没存的改动
  const row = (key: string, text: string, opts: { label?: string; placeholder?: string; isProfile?: boolean; onDelete?: () => void }) => {
    const draft = drafts[key];
    const edit = () => manager.startEdit(key, text);
    return (
      <ListItem
        key={key}
        label={opts.label}
        more={moreMenu(edit, opts.onDelete)}
        moreLabel="更多操作"
        onDoubleClick={draft ? undefined : edit}
        editing={!!draft}
        onEditingChange={(v) => (v ? edit() : manager.cancelDraft(key))}
        editValue={draft?.value ?? text}
        onEditValueChange={(v) => manager.changeDraft(key, v)}
        maxLength={opts.isProfile ? PROFILE_TEXT_MAX_CHARS : MEMORY_ITEM_MAX_CHARS}
        placeholder={opts.isProfile ? undefined : '写下想让 KIVI 记住的事'}
        saveLabel={draft && !draft.original ? '添加' : '保存'}
        saving={savingKey === key}
        allowEmpty={opts.isProfile}
        onSave={() => void manager.saveDraft(key)}
      >
        {text || (opts.placeholder && <span className="app-memory__placeholder">{opts.placeholder}</span>)}
      </ListItem>
    );
  };

  return (
    <div className="app-memory__groups">
      {questions.length > 0 && (
        <List variant="card" divider title="基础信息" icon="Document">
          {questions.map((q) => row(profileDraftKey(q.key), formatProfileValues(q, memory.profile[q.key]), { label: q.label, placeholder: profilePlaceholder(q), isProfile: true }))}
        </List>
      )}
      <List
        ref={userListRef}
        variant="card"
        divider
        title="用户记忆"
        icon="Brain"
        action={
          <Button size={28} variant="ghost" leftIcon="AddSmall" disabled={isAdding} onClick={manager.addMemory}>
            添加
          </Button>
        }
      >
        {isAdding && row(NEW_MEMORY_DRAFT_KEY, '', {})}
        {memory.content.map((text) => row(memoryDraftKey(text), text, { onDelete: () => manager.removeMemory(text) }))}
        {!memory.content.length && !isAdding && <li className="app-memory__none">暂无用户记忆</li>}
      </List>
    </div>
  );
}
