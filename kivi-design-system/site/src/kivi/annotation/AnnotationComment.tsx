import { forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { Button, IconButton } from '../button';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import './annotation.css';

export interface AnnotationCommentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** 描述：受控 */
  value?: string;
  /** 描述：非受控的初始值 */
  defaultValue?: string;
  /** 描述变化时触发 */
  onChange?: (value: string) => void;
  /** 悬停预览：只显示一行描述，不能操作。默认是可编辑的评论面板 */
  collapsed?: boolean;
  /** 已经添加到对话：主按钮变成「更新」，描述没改过时不可点 */
  added?: boolean;
  /** 已添加到对话后，描述和对话里的不一样了，「更新」才能点。不传按「描述没改过」处理，即不可点 */
  changed?: boolean;
  /** 出现时聚焦输入框，光标放在末尾。新画完框、点气泡进入编辑时用 */
  autoFocus?: boolean;
  /** 占位文字，默认「添加描述」 */
  placeholder?: string;
  /** 点删除 */
  onDelete?: () => void;
  /** 点「发送」：直接把这条标注和描述发给 Agent */
  onSend?: () => void;
  /** 点「添加到对话」：把这条标注作为引用放进对话输入框 */
  onAddToChat?: () => void;
  /** 点「更新」：用新的描述更新对话输入框里的引用 */
  onUpdate?: () => void;
  /** 按 Esc：只收起浮层，不发送 */
  onCollapse?: () => void;
}

/**
 * 标注的评论浮层：挂在序号气泡右边。悬停是一行描述预览（不能操作）；点气泡后换成编辑面板：
 * 输入框随内容长高，最多 5 行再滚动；底栏左边删除，右边「发送」「添加到对话」，没写字两个都不可点；添加过之后「添加到对话」换成「更新」。
 * 玻璃底（会浮动、面积不大），宽 240，圆角 12，内边距 8。回车换行不发送，Esc 收起。
 */
export const AnnotationComment = forwardRef<HTMLDivElement, AnnotationCommentProps>(function AnnotationComment(
  {
    value: valueProp,
    defaultValue = '',
    onChange,
    collapsed = false,
    added = false,
    changed = false,
    autoFocus,
    placeholder = '添加描述',
    onDelete,
    onSend,
    onAddToChat,
    onUpdate,
    onCollapse,
    className,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
  const field = useRef<HTMLTextAreaElement>(null);
  const canSubmit = value.trim().length > 0;

  // 进入编辑：聚焦，光标放末尾
  useEffect(() => {
    const el = field.current;
    if (!autoFocus || collapsed || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus, collapsed]);

  // 输入框随内容长高
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, collapsed]);

  if (collapsed) {
    return (
      <div ref={ref} className={cx('kv-annotation-comment', 'kv-annotation-comment--collapsed', className)} {...rest}>
        <div className="kv-annotation-comment__preview">{value}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cx('kv-annotation-comment', className)} {...rest}>
      <textarea
        ref={field}
        className="kv-annotation-comment__field"
        aria-label="标注描述"
        placeholder={placeholder}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          // 键盘事件不往上冒，免得触发画布的删除节点这类快捷键
          e.stopPropagation();
          if (e.key === 'Escape') {
            e.preventDefault();
            onCollapse?.();
          }
        }}
      />
      <div className="kv-annotation-comment__footer">
        <IconButton icon="Delete" label="删除标注" size={28} onClick={onDelete} />
        <span className="kv-annotation-comment__spacer" />
        <Button size={28} variant="secondary" disabled={!canSubmit} onClick={onSend}>
          发送
        </Button>
        {added ? (
          <Button size={28} variant="primary" disabled={!canSubmit || !changed} onClick={onUpdate}>
            更新
          </Button>
        ) : (
          <Button size={28} variant="primary" disabled={!canSubmit} onClick={onAddToChat}>
            添加到对话
          </Button>
        )}
      </div>
    </div>
  );
});
AnnotationComment.displayName = 'AnnotationComment';
