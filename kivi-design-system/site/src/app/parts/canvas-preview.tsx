import { useState } from 'react';
import { Avatar, Button, ButtonGroup, Dialog, Divider, IconButton } from '@kivi';
import type { WorkflowTemplate } from '../data/types';
import { TemplatePreview } from '../pages/canvas/TemplatePreview';
import { useLastShown } from './media-viewer';
import './canvas-preview.css';

/*
  画布预览（照线上 workflow-preview / 画布分享预览）：铺满窗口的弹窗里是只读画布，看这段节点和连线的样子。
  按我们的规范画：弹窗 full，画布四周和画布页一样的两条玻璃按钮条 44——
  左上：作者头像 + 名字｜名称；右上：「预览模式，如需编辑请点击」+ 主要按钮（克隆 / 应用画布）｜关闭。
  按钮点了等请求时转圈；Esc、关闭按钮关。探索页创作精选、工作流和创作首页广场共用。
*/

export interface CanvasPreviewItem {
  name: string;
  author: { name: string; avatar?: string };
  template: WorkflowTemplate;
}

export function CanvasPreviewDialog({
  item,
  onClose,
  actionLabel,
  onAction,
}: {
  /** 预览哪个；null 是关着 */
  item: CanvasPreviewItem | null;
  onClose: () => void;
  /** 右上角主要按钮的字：探索里是「克隆」，画布底部工作流是「应用画布」 */
  actionLabel: string;
  /** 点了主要按钮：返回 Promise 时转圈等它，做完由调用方决定关不关 */
  onAction: () => unknown;
}) {
  const shown = useLastShown(item);
  const [busy, setBusy] = useState(false);
  const act = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onAction();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog size="full" open={item !== null} onOpenChange={(v) => !v && !busy && onClose()} aria-label={shown ? `预览 ${shown.name}` : '预览'}>
      {shown && (
        <div className="app-cvp">
          <TemplatePreview template={shown.template} className="app-cvp__canvas" />
          <ButtonGroup variant="glass" size={44} aria-label="作者和名称" className="app-cvp__bar app-cvp__bar--left">
            <span className="app-cvp__owner">
              <Avatar name={shown.author.name} src={shown.author.avatar} size={24} />
              {shown.author.name}
            </span>
            <Divider orientation="vertical" />
            <span className="app-cvp__name" title={shown.name}>
              {shown.name}
            </span>
          </ButtonGroup>
          <ButtonGroup variant="glass" size={44} aria-label="预览操作" className="app-cvp__bar app-cvp__bar--right">
            <span className="app-cvp__hint">预览模式，如需编辑请点击</span>
            <Button variant="primary" loading={busy} onClick={() => void act()}>
              {actionLabel}
            </Button>
            <Divider orientation="vertical" />
            <IconButton icon="Close" label="关闭" disabled={busy} onClick={onClose} />
          </ButtonGroup>
        </div>
      )}
    </Dialog>
  );
}
