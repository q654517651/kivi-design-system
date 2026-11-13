import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import './canvas.css';

/*
  「模板 · 画布」页的模板：生成面板。
  它在 Figma 里是模板，不是组件：里面放什么按钮、什么参数，随节点类型和模型变，复制整条改内容。
  这里只提供外框（容器的圆角、底色、间距），里面用 AttachmentStrip、PromptInput、NodePanelBar 拼。
  节点工具栏 glass 44，画布工具栏 surface 56：都不在这里，是 ButtonGroup。
*/

export interface NodePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 右上角的全屏按钮：IconButton 32 · 无底灰，图标 FullScreen */
  expand?: boolean;
  /** 点了全屏按钮 */
  onExpand?: () => void;
}

/** 生成面板的外框：选中节点后出现在节点下方。竖排三块：AttachmentStrip（参考图，首尾帧用 ReferenceFramePair）、PromptInput（提示词）、NodePanelBar（模型选择栏） */
export const NodePanel = forwardRef<HTMLDivElement, NodePanelProps>(function NodePanel(
  { expand, onExpand, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-node-panel', className)} {...rest}>
      {children}
      {expand && <IconButton icon="FullScreen" label="全屏" variant="ghost-muted" className="kv-node-panel__expand" onClick={onExpand} />}
    </div>
  );
});
NodePanel.displayName = 'NodePanel';

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
