import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { Avatar } from '../tabs-tags-avatar';
import { cx } from '../utils';
import { composeHandlers, useControllable } from '../hooks';
import './agent.css';

export type ProcessRowLevel = 'main' | 'sub';
export type ProcessRowStatus = 'running' | 'done' | 'failed';

export interface ProcessRowProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** 动作文字，比如「创建节点」 */
  action: ReactNode;
  /** 对象文字，比如「活动标题」，比动作淡一档。不传就不显示 */
  object?: ReactNode;
  /** 层级：一级 / 子项，默认一级。子项是展开列表里的一行，没有头像和箭头，不能点 */
  level?: ProcessRowLevel;
  /** 状态：进行中（动作文字扫光）/ 完成 / 失败，默认完成 */
  status?: ProcessRowStatus;
  /** 图标，常用 UseCanvas、Skill、Message、ImageGeneration。不传就不显示 */
  icon?: IconName;
  /** 头像图片地址（Avatar 24 · 图片）。不传就不显示，子项没有 */
  avatar?: string;
  /** 显示箭头，默认开。一级带箭头时整行是按钮，点一下展开 / 收起；子项没有 */
  arrow?: boolean;
  /** 展开：受控。没有箭头的行没有展开状态 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认收起 */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
}

/** Agent 过程行：一行显示思考、调工具、询问、生成。ref 给根元素：带箭头是 button，其余是 div。Figma「Agent」页 ProcessRow */
export const ProcessRow = forwardRef<HTMLElement, ProcessRowProps>(function ProcessRow(
  {
    action,
    object,
    level = 'main',
    status = 'done',
    icon,
    avatar,
    arrow = true,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  const sub = level === 'sub';
  const hasArrow = !sub && arrow;
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);

  const content = (
    <>
      {icon && <Icon name={icon} />}
      {!sub && avatar && <Avatar size={24} src={avatar} name="Agent" aria-hidden />}
      <span className="kv-process-row__action">{action}</span>
      {object != null && object !== false && <span className="kv-process-row__object">{object}</span>}
      {hasArrow && <Icon name="DownArrowSmall" className="kv-process-row__arrow" />}
    </>
  );

  const common = {
    className: cx('kv-process-row', sub && 'kv-process-row--sub', className),
    'aria-busy': status === 'running' || undefined,
    'aria-invalid': status === 'failed' || undefined,
  };

  if (hasArrow) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        {...common}
        aria-expanded={expanded}
        onClick={composeHandlers(onClick, () => setExpanded(!expanded))}
        {...rest}
      >
        {content}
      </button>
    );
  }
  return (
    <div ref={ref as Ref<HTMLDivElement>} {...common} onClick={onClick} {...rest}>
      {content}
    </div>
  );
});
ProcessRow.displayName = 'ProcessRow';
