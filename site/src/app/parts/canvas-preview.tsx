import { useState } from 'react';
import { Avatar, Button, ButtonGroup, Dialog, Divider, Icon, IconButton } from '@kivi';
import type { WorkflowTemplate } from '../data/types';
import { TemplatePreview } from '../pages/canvas/TemplatePreview';
import { useLastShown } from './media-viewer';
import './canvas-preview.css';

/*
  画布预览（照线上 infinite-canvas/workflow-preview，11-20 用户定照线上改）：大弹窗（不铺满，离窗口边 32），里面是只读画布。
  顶上居中一条玻璃按钮条 44：左边身份｜名称，右边「预览模式，如需编辑请点击」+ 主要按钮「应用画布」；关闭单独放右上角。
  身份：官方的（探索页创作精选、工作流，画布底部官方工作流）是 KIVI Logo；我的工作流是自己的头像和名字。
  「应用画布」：新建一块带这段节点的画布、进画布页（线上新开标签页，演示里留在当前页，免得多开一堆）。
  按钮点了等请求时转圈；Esc、关闭按钮关。探索页、创作首页（广场、最近更新）、画布底部工作流共用。
*/

export interface CanvasPreviewItem {
  name: string;
  /** 我的工作流：自己的头像和名字。不传是官方的，显示 KIVI */
  owner?: { name: string; avatar?: string };
  template: WorkflowTemplate;
}

/** 弹窗高度：撑到离窗口边 32（Dialog 传了 height 也不会超出窗口） */
const FILL_HEIGHT = 4000;

export function CanvasPreviewDialog({
  item,
  onClose,
  onAction,
}: {
  /** 预览哪个；null 是关着 */
  item: CanvasPreviewItem | null;
  onClose: () => void;
  /** 点了「应用画布」：返回 Promise 时转圈等它，做完由调用方决定关不关 */
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
    <Dialog size={1200} height={FILL_HEIGHT} open={item !== null} onOpenChange={(v) => !v && !busy && onClose()} aria-label={shown ? `预览 ${shown.name}` : '预览'}>
      {shown && (
        <div className="app-cvp">
          <TemplatePreview template={shown.template} className="app-cvp__canvas" />
          <ButtonGroup variant="glass" size={44} aria-label="工作流预览" className="app-cvp__head">
            <span className="app-cvp__owner">
              {/* Logo 本身就是 KIVI 字标，不再跟一遍名字（同画布左上角） */}
              {shown.owner ? (
                <>
                  <Avatar name={shown.owner.name} src={shown.owner.avatar} size={24} />
                  {shown.owner.name}
                </>
              ) : (
                <Icon name="Logo" size={20} aria-label="KIVI" />
              )}
            </span>
            <Divider orientation="vertical" />
            <span className="app-cvp__name" title={shown.name}>
              {shown.name}
            </span>
            <span className="app-cvp__hint">预览模式，如需编辑请点击</span>
            <Button variant="primary" loading={busy} onClick={() => void act()}>
              应用画布
            </Button>
          </ButtonGroup>
          <ButtonGroup variant="glass" size={44} aria-label="关闭" className="app-cvp__close">
            <IconButton icon="Close" label="关闭" disabled={busy} onClick={onClose} />
          </ButtonGroup>
        </div>
      )}
    </Dialog>
  );
}
