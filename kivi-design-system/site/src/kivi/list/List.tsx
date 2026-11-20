import {
  forwardRef,
  useEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';
import { Button, IconButton } from '../button';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { Textarea } from '../inputs/Textarea';
import { Dropdown } from '../menu/Dropdown';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './list.css';

export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'title'> {
  /** 分割线：条目之间加 1px 横线，颜色和 Divider 一样（`--color-border`），不带左右留白 */
  divider?: boolean;
  /**
   * 类型（11-19，照 3.14 记忆管理稿）：默认无底，左右不留；卡片 `card` 是一块 Light 2 底（白 6%）、圆角 12、内边距 24 的分组，
   * 压在弹窗（surface）上用，里面的控件自动换到 Light 2 档（`--kv-nested-fill`）。卡片里第一条不留上边距、最后一条不留下边距
   */
  variant?: 'plain' | 'card';
  /** 标题行：图标 16（secondary）+ 标题 14 / 22，和第一条隔 16。比如「基础信息」「用户记忆」。也当读屏名 */
  title?: ReactNode;
  /** 标题前的图标 */
  icon?: IconName;
  /** 标题行最右边的操作，比如「添加」（Button 28 · 无底 + AddSmall） */
  action?: ReactNode;
}

/** 列表：一条一条的记录，比如记忆。里面放 ListItem */
export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { divider, variant = 'plain', title, icon, action, className, children, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const hasHeader = (title != null && title !== false) || action != null;
  // 写 role="list"：去掉圆点后 Safari 读屏会把 ul 当成普通块
  return (
    <ul
      ref={ref}
      role="list"
      className={cx('kv-list', variant === 'card' && 'kv-list--card', className)}
      data-divider={divider ? '' : undefined}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      {...rest}
    >
      {/* 标题行不是一条记录：presentation，读屏名在 ul 的 aria-label 上 */}
      {hasHeader && (
        <li role="presentation" className="kv-list__header">
          {icon && <Icon name={icon} size={16} className="kv-list__icon" />}
          <span className="kv-list__title">{title}</span>
          {action != null && <span className="kv-list__action">{action}</span>}
        </li>
      )}
      {children}
    </ul>
  );
});
List.displayName = 'List';

export interface ListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'children'> {
  /** 正文：14 / 22，能换行，保留换行符。编辑时是输入框的初始内容，要用字符串 */
  children?: ReactNode;
  /** 小标题：正文上面一行，12 tertiary，一行省略。比如「用户身份」 */
  label?: ReactNode;
  /** 说明：正文下面一行，12 tertiary，一行省略。比如日期 */
  description?: ReactNode;
  /** 右边悬停才出现的「⋯」：写了就出一个 IconButton 28 · 无底灰，点开弹出这里的菜单（一般是一个 Menu）。触屏上一直显示 */
  more?: ReactNode;
  /** 「⋯」的说明，读屏用，默认「更多」 */
  moreLabel?: string;
  /** 编辑中（受控）：正文换成 Textarea，框里右下角是取消 / 保存；说明和「⋯」不显示。取消、Esc 触发 onEditingChange(false) */
  editing?: boolean;
  /** 默认是否在编辑（非受控） */
  defaultEditing?: boolean;
  /** 进入、退出编辑 */
  onEditingChange?: (editing: boolean) => void;
  /** 编辑框里的字（受控）：要知道改没改（放弃修改确认）时用；不传从 children 起、自己存 */
  editValue?: string;
  /** 编辑框里的字变了 */
  onEditValueChange?: (value: string) => void;
  /** 编辑框最多几个字：传了框里左下出「字数 / 上限」 */
  maxLength?: number;
  /** 编辑框没字时的占位 */
  placeholder?: string;
  /** 保存按钮的字，默认「保存」；新加一条时写「添加」 */
  saveLabel?: string;
  /** 保存中：保存按钮转圈 */
  saving?: boolean;
  /** 能不能存空的，默认不能 */
  allowEmpty?: boolean;
  /** 保存：回车或点「保存」，传去掉首尾空格的新内容。非受控时存完自己退出编辑；受控时由外面在存好后把 editing 改回去 */
  onSave?: (text: string) => void;
}

/** 编辑框：挂上就聚焦，光标放到最后 */
function EditField({
  value,
  onChange,
  label,
  maxLength,
  placeholder,
  saveLabel,
  saving,
  allowEmpty,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  maxLength?: number;
  placeholder?: string;
  saveLabel: string;
  saving?: boolean;
  allowEmpty?: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const empty = !value.trim() && !allowEmpty;
  const save = () => {
    if (!empty && !saving) onSave(value.trim());
  };
  const keys = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 回车保存，Shift + 回车换行；输入法选词时的回车不算
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      save();
    }
    // 只退出编辑，不让外层弹窗一起关
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };
  return (
    <Textarea
      ref={ref}
      className="kv-list-item__field"
      aria-label={label}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      counter={maxLength != null ? `${value.length}/${maxLength}` : undefined}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={keys}
      actions={
        <>
          <Button size={28} variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button size={28} variant="primary" disabled={empty} loading={saving} onClick={save}>
            {saveLabel}
          </Button>
        </>
      }
    />
  );
}

/** 列表里的一条：小标题、正文、说明，悬停出「⋯」，能原地编辑 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    children,
    label,
    description,
    more,
    moreLabel = '更多',
    editing: editingProp,
    defaultEditing = false,
    onEditingChange,
    editValue,
    onEditValueChange,
    maxLength,
    placeholder,
    saveLabel = '保存',
    saving,
    allowEmpty,
    onSave,
    className,
    ...rest
  },
  ref,
) {
  const [editing, setEditing] = useControllable(editingProp, defaultEditing, onEditingChange);
  const initial = typeof children === 'string' ? children : '';
  const [draft, setDraft] = useControllable(editValue, initial, onEditValueChange);
  // 每次进编辑，非受控的草稿从正文重新起
  const wasEditing = useRef(editing);
  useEffect(() => {
    if (editing && !wasEditing.current && editValue === undefined) setDraft(initial);
    wasEditing.current = editing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);
  const hasLabel = label != null && label !== false;
  const hasDescription = description != null && description !== false;
  return (
    <li ref={ref} className={cx('kv-list-item', className)} data-editing={editing ? '' : undefined} {...rest}>
      <div className="kv-list-item__body">
        {hasLabel && <span className="kv-list-item__label">{label}</span>}
        {editing ? (
          <EditField
            value={draft}
            onChange={setDraft}
            label={typeof label === 'string' ? `编辑${label}` : '编辑'}
            maxLength={maxLength}
            placeholder={placeholder}
            saveLabel={saveLabel}
            saving={saving}
            allowEmpty={allowEmpty}
            onSave={(text) => {
              onSave?.(text);
              // 受控时外面存好了再退出（存失败还留在编辑）
              if (editingProp === undefined) setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <span className="kv-list-item__content">{children}</span>
        )}
        {hasDescription && !editing && <span className="kv-list-item__description">{description}</span>}
      </div>
      {more != null && !editing && (
        <Dropdown
          className="kv-list-item__more"
          trigger={<IconButton tooltip={false} icon="More" label={moreLabel} size={28} variant="ghost-muted" />}
        >
          {more}
        </Dropdown>
      )}
    </li>
  );
});
ListItem.displayName = 'ListItem';
