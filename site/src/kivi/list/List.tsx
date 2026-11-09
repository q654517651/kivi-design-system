import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type ReactNode,
} from 'react';
import { Button, IconButton } from '../button';
import { Textarea } from '../inputs/Textarea';
import { Dropdown } from '../menu/Dropdown';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './list.css';

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /** 分割线：条目之间加 1px 横线，颜色和 Divider 一样（`--color-border`），不带左右留白 */
  divider?: boolean;
}

/** 列表：一条一条的记录，比如记忆。里面放 ListItem */
export const List = forwardRef<HTMLUListElement, ListProps>(function List({ divider, className, ...rest }, ref) {
  // 写 role="list"：去掉圆点后 Safari 读屏会把 ul 当成普通块
  return <ul ref={ref} role="list" className={cx('kv-list', className)} data-divider={divider ? '' : undefined} {...rest} />;
});
List.displayName = 'List';

export interface ListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'children'> {
  /** 正文：14 / 22，能换行，保留换行符。编辑时是输入框的初始内容，要用字符串 */
  children?: ReactNode;
  /** 小标题：正文上面一行，12 tertiary，一行省略。比如「用户身份」 */
  label?: ReactNode;
  /** 说明：正文下面一行，12 tertiary，一行省略。比如日期 */
  description?: ReactNode;
  /** 右边悬停才出现的「⋯」：写了就出一个 IconButton 28 轻，点开弹出这里的菜单（一般是一个 Menu）。触屏上一直显示 */
  more?: ReactNode;
  /** 「⋯」的说明，读屏用，默认「更多」 */
  moreLabel?: string;
  /** 编辑中（受控）：正文换成 Textarea，框里右下角是取消 / 保存；说明和「⋯」不显示 */
  editing?: boolean;
  /** 默认是否在编辑（非受控） */
  defaultEditing?: boolean;
  /** 进入、退出编辑 */
  onEditingChange?: (editing: boolean) => void;
  /** 保存：回车或点「保存」，传去掉首尾空格的新内容；空的不能保存 */
  onSave?: (text: string) => void;
}

/** 编辑框：挂上就聚焦，光标放到最后 */
function EditField({
  initial,
  label,
  onSave,
  onCancel,
}: {
  initial: string;
  label: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const empty = !draft.trim();
  const save = () => {
    if (!empty) onSave(draft.trim());
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
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={keys}
      actions={
        <>
          <Button size={28} variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button size={28} variant="primary" disabled={empty} onClick={save}>
            保存
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
    onSave,
    className,
    ...rest
  },
  ref,
) {
  const [editing, setEditing] = useControllable(editingProp, defaultEditing, onEditingChange);
  const hasLabel = label != null && label !== false;
  const hasDescription = description != null && description !== false;
  return (
    <li ref={ref} className={cx('kv-list-item', className)} data-editing={editing ? '' : undefined} {...rest}>
      <div className="kv-list-item__body">
        {hasLabel && <span className="kv-list-item__label">{label}</span>}
        {editing ? (
          <EditField
            initial={typeof children === 'string' ? children : ''}
            label={typeof label === 'string' ? `编辑${label}` : '编辑'}
            onSave={(text) => {
              onSave?.(text);
              setEditing(false);
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
          trigger={<IconButton tooltip={false} icon="More" label={moreLabel} size={28} variant="light" />}
        >
          {more}
        </Dropdown>
      )}
    </li>
  );
});
ListItem.displayName = 'ListItem';
