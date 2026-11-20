import { useRef } from 'react';
import { AddTile, AttachmentStrip, GenerateButton, Icon, NodePanel, NodePanelBar, type AttachmentItem } from '@kivi';
import { addLipSyncSource, lipSyncState, runLipSync, type LipSlot } from '../../data/canvas-lip-sync';
import { disconnectPair } from '../../data/canvas-doc';
import type { CanvasDoc, CanvasNode } from '../../data/types';
import { attempt } from '../../flows/errors';
import { LIP_TEXT } from '../../rules/lip-sync';
import './node-tools.css';

/*
  对口型节点下面的面板（照线上 growth-tool-panel）：一排两个格子「音频 → 视频」，右下生成按钮；没有提示词、没有模型。
  有素材的格子是参考格（右上角写格子名，悬停出删除 = 断开连线，和预览）；空格子是添加格，点了选文件，在节点左边建素材节点连进来。
  生成中不能删、不能上传。
*/

export interface LipSyncPanelProps {
  canvasId: string;
  doc: CanvasDoc;
  node: CanvasNode;
  /** 生成中或上传中 */
  busy: boolean;
}

const SLOTS: LipSlot[] = ['audio', 'video'];

export function LipSyncPanel({ canvasId, doc, node, busy }: LipSyncPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const picking = useRef<LipSlot>('audio');
  const st = lipSyncState(doc, node);

  const itemOf = (slot: LipSlot): AttachmentItem | undefined => {
    const n = st[slot];
    if (!n) return undefined;
    const it = n.items?.[0];
    return {
      id: n.id,
      type: slot,
      name: n.name,
      // 视频用封面，音频传音频地址（悬停预览里能播）
      src: slot === 'video' ? it?.poster : it?.src,
      video: slot === 'video' ? it?.src : undefined,
      duration: it?.duration,
      badge: LIP_TEXT[slot],
    };
  };

  const pick = (slot: LipSlot) => {
    picking.current = slot;
    if (fileRef.current) fileRef.current.accept = `${slot}/*`;
    fileRef.current?.click();
  };

  const reason = busy ? '生成中，请稍候' : st.problem;

  return (
    <NodePanel>
      <div className="app-toolstrip app-lipsync__slots">
        {SLOTS.map((slot, i) => {
          const item = itemOf(slot);
          return (
            <span key={slot} className="app-lipsync__slot">
              {i > 0 && <Icon name="RightArrowLong" size={24} className="app-lipsync__arrow" aria-hidden="true" />}
              {item ? (
                <AttachmentStrip items={[item]} aria-label={LIP_TEXT[slot]} onRemove={busy ? undefined : (id) => disconnectPair(canvasId, id, node.id)} />
              ) : (
                <AddTile variant="outline" label={LIP_TEXT[slot]} aria-label={`上传${LIP_TEXT[slot]}`} disabled={busy} onClick={() => pick(slot)} />
              )}
            </span>
          );
        })}
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void addLipSyncSource(canvasId, node, picking.current, f);
            e.target.value = '';
          }}
        />
      </div>
      <NodePanelBar right={<GenerateButton cost={st.cost} disabledReason={reason} onClick={() => attempt(() => runLipSync(canvasId, node.id))} />} />
    </NodePanel>
  );
}
