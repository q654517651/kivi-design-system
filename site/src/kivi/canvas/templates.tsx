import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { useControllable } from '../hooks';
import { Dropdown, type DropdownPlacement, type DropdownProps } from '../menus-tooltip';
import { Icon } from '../Icon';
import { cx } from '../utils';
import '../inputs/inputs.css';
import './canvas.css';

/*
  「模板 · 画布」页的模板：节点工具栏、画布工具栏、生成面板、参数面板。
  它们在 Figma 里是模板，不是组件：里面放什么按钮、什么参数，随节点类型和模型变，复制整条改内容。
  这里只提供外框（容器的圆角、底色、间距），里面用 Button、IconButton、ReferenceItem、PromptInput 拼。
*/

export type NodeToolbarProps = HTMLAttributes<HTMLDivElement>;

/** 节点工具栏的外框：选中节点后出现在节点上方。里面放 Button 中 · 文字、IconButton 32 · 文字，用 NodeToolbarDivider 分组 */
export const NodeToolbar = forwardRef<HTMLDivElement, NodeToolbarProps>(function NodeToolbar(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('kv-node-toolbar', className)} role="toolbar" {...rest} />;
});
NodeToolbar.displayName = 'NodeToolbar';

export type NodeToolbarDividerProps = HTMLAttributes<HTMLSpanElement>;

/** 节点工具栏里的竖线：1 宽、20 高，分组用 */
export const NodeToolbarDivider = forwardRef<HTMLSpanElement, NodeToolbarDividerProps>(function NodeToolbarDivider(
  { className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('kv-node-toolbar__divider', className)}
      role="separator"
      aria-orientation="vertical"
      {...rest}
    />
  );
});
NodeToolbarDivider.displayName = 'NodeToolbarDivider';

export type CanvasToolbarProps = HTMLAttributes<HTMLDivElement>;

/** 画布工具栏的外框：画布底部的圆角胶囊，里面放 IconButton 32 · 文字。第一个「添加」给 className="kv-canvas-toolbar__add"（白底黑图标） */
export const CanvasToolbar = forwardRef<HTMLDivElement, CanvasToolbarProps>(function CanvasToolbar(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('kv-canvas-toolbar', className)} role="toolbar" {...rest} />;
});
CanvasToolbar.displayName = 'CanvasToolbar';

export interface NodePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 右上角的全屏按钮：IconButton 32 · 轻，图标 FullScreen */
  expand?: boolean;
  /** 点了全屏按钮 */
  onExpand?: () => void;
}

/** 生成面板的外框：选中节点后出现在节点下方。竖排三块：NodePanelRefs（参考图）、PromptInput（提示词）、NodePanelBar（模型选择栏） */
export const NodePanel = forwardRef<HTMLDivElement, NodePanelProps>(function NodePanel(
  { expand, onExpand, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-node-panel', className)} {...rest}>
      {children}
      {expand && <IconButton icon="FullScreen" label="全屏" variant="light" className="kv-node-panel__expand" onClick={onExpand} />}
    </div>
  );
});
NodePanel.displayName = 'NodePanel';

export type NodePanelRefsProps = HTMLAttributes<HTMLDivElement>;

/** 生成面板的参考图区块：一排 ReferenceItem，间距 4 */
export const NodePanelRefs = forwardRef<HTMLDivElement, NodePanelRefsProps>(function NodePanelRefs(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('kv-node-panel__refs', className)} {...rest} />;
});
NodePanelRefs.displayName = 'NodePanelRefs';

export interface NodePanelBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 左边：模型、质量、比例等下拉（Select · 无底），间距 6 */
  left?: ReactNode;
  /** 右边：数量下拉和生成按钮，间距 8 */
  right?: ReactNode;
}

/** 生成面板的模型选择栏：高 32，左边下拉、右边数量和生成按钮 */
export const NodePanelBar = forwardRef<HTMLDivElement, NodePanelBarProps>(function NodePanelBar(
  { left, right, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-node-panel__bar', className)} {...rest}>
      <div className="kv-node-panel__bar-left">{left}</div>
      <div className="kv-node-panel__bar-right">{right}</div>
    </div>
  );
});
NodePanelBar.displayName = 'NodePanelBar';

export type ParamPanelProps = HTMLAttributes<HTMLDivElement>;

/** 参数面板的外框：玻璃浮层，里面一块块 ParamField 竖着排。一般不单独用，放进 ParamPicker。Figma「模板 · 画布」页「参数面板」 */
export const ParamPanel = forwardRef<HTMLDivElement, ParamPanelProps>(function ParamPanel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx('kv-param-panel', className)} role="group" {...rest} />;
});
ParamPanel.displayName = 'ParamPanel';

export interface ParamFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 这一块的标题，比如「选择比例」 */
  label: ReactNode;
}

/** 参数面板里的一块：上面标题，下面控件（分段 Tabs、刻度滑块 Slider + ParamValue） */
export const ParamField = forwardRef<HTMLDivElement, ParamFieldProps>(function ParamField(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-param-field', className)} {...rest}>
      <div className="kv-param-field__label">{label}</div>
      <div className="kv-param-field__body">{children}</div>
    </div>
  );
});
ParamField.displayName = 'ParamField';

export interface ParamValueProps extends HTMLAttributes<HTMLDivElement> {
  /** 数值，比如 12 */
  value: ReactNode;
  /** 单位，比如 S、x */
  unit?: ReactNode;
}

/** 滑块右边的数值框：56 × 46，数值白色、单位 secondary，两头对齐 */
export const ParamValue = forwardRef<HTMLDivElement, ParamValueProps>(function ParamValue(
  { value, unit, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-param-value', className)} aria-hidden="true" {...rest}>
      <span>{value}</span>
      {unit != null && <span className="kv-param-value__unit">{unit}</span>}
    </div>
  );
});
ParamValue.displayName = 'ParamValue';

export interface ParamPickerProps
  extends Omit<DropdownProps, 'trigger' | 'children' | 'matchTriggerWidth' | 'anchorPoint' | 'closeOnSelect' | 'haspopup'> {
  /** 触发器上的参数摘要，比如「720P · 16:9 · 8s」，跟着面板里的选择变 */
  summary: ReactNode;
  /** 面板里的内容：一块块 ParamField */
  children?: ReactNode;
  /** 面板出现的位置，默认 bottom-start（下方、左对齐），放不下自己翻到上方。和下拉选择一样 */
  placement?: DropdownPlacement;
  /** 面板展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是否展开，默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发，参数是新的状态 */
  onOpenChange?: (open: boolean) => void;
  /** 触发器的说明，读屏用，默认「参数」 */
  'aria-label'?: string;
}

/**
 * 参数选择：长得和无底的 Select 一样，点开的是参数面板（ParamPanel），不是列表。
 * 画布生成面板和主站输入框共用，比例、时长、分辨率、生成音频这类放在一起调的参数都用它。
 * ref 给包住触发器的外壳 span（和 Dropdown 一样）。
 */
export const ParamPicker = forwardRef<HTMLSpanElement, ParamPickerProps>(function ParamPicker(
  {
    summary,
    children,
    placement,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    'aria-label': ariaLabel = '参数',
    className,
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  return (
    <Dropdown
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      closeOnSelect={false}
      className={cx('kv-select__wrap kv-select__wrap--plain', className)}
      trigger={
        <button type="button" className="kv-select kv-select--plain" aria-label={ariaLabel}>
          <span className="kv-select__text">{summary}</span>
          <Icon name={open ? 'UpArrowSmall' : 'DownArrowSmall'} />
        </button>
      }
      {...rest}
    >
      <ParamPanel>{children}</ParamPanel>
    </Dropdown>
  );
});
ParamPicker.displayName = 'ParamPicker';
