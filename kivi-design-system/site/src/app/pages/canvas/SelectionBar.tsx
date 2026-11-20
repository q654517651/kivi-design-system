import { type CSSProperties } from 'react';
import { Button, ButtonGroup, Dropdown, Menu, MenuItem, type IconName } from '@kivi';
import { arrangeNodes, arrangeTargets } from '../../data/canvas-layout';
import { copyNodes, groupNodes, isBusy, withChildren } from '../../data/canvas-doc';
import { downloadNodes } from './download';
import { isMediaNode } from '../../rules/canvas';
import { ARRANGE_OPTIONS, GROUP_TEXT, type ArrangeMode } from '../../rules/canvas-group';
import type { CanvasDoc } from '../../data/types';
import type { Rect } from './geometry';

/*
  多选浮条（照线上 components/selector-box-popover）：选中两个及以上时，在选区上方居中：
  打组、添加到对话、复制、下载、布局（垂直 / 水平 / 宫格对齐）。
  - 打组：有忙的提示「节点正在执行或上传中无法打组」；选中的里有组就拆开重组成一个新组；打完选中新组。
  - 添加到对话：选中的（组拆开算里面的）里有文 / 图 / 视 / 音才出；有忙的置灰。
  - 布局：能排的不到 2 个置灰。
  浮条大小不跟画布缩放（缩到 50% 以下才跟着小），同节点工具栏。
*/

const TOOLBAR_GAP = 40;

/** 「布局」：点开选垂直 / 水平 / 宫格对齐（多选浮条、组工具栏共用） */
export function ArrangeButton({ disabled, onPick }: { disabled?: boolean; onPick: (mode: ArrangeMode) => void }) {
  return (
    <Dropdown
      placement="bottom-start"
      trigger={
        <Button leftIcon="AutoLayout" disabled={disabled}>
          {GROUP_TEXT.layout}
        </Button>
      }
    >
      <Menu aria-label={GROUP_TEXT.layout}>
        {ARRANGE_OPTIONS.map((o) => (
          <MenuItem key={o.mode} icon={o.icon as IconName} onClick={() => onPick(o.mode)}>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}

export interface SelectionBarProps {
  canvasId: string;
  doc: CanvasDoc;
  ids: string[];
  /** 选中的外框（世界坐标，拖动中的位置） */
  bounds: Rect;
  zoom: number;
  /** 打完组：选中新组 */
  onSelect: (ids: string[]) => void;
  onAddToChat?: (ids: string[]) => void;
}

export function SelectionBar({ canvasId, doc, ids, bounds, zoom, onSelect, onAddToChat }: SelectionBarProps) {
  const all = withChildren(doc, ids)
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n && n.type !== 'group');
  const chat = all.filter(isMediaNode);
  const chatBusy = chat.some(isBusy);
  const canDownload = all.some((n) => !!n.items?.length || !!n.text);
  const style = { '--cv-unzoom': 1 / Math.max(zoom, 0.5), left: bounds.x + bounds.w / 2, top: bounds.y - TOOLBAR_GAP } as CSSProperties;

  return (
    <div className="cv-float cv-float--toolbar" style={style}>
      <ButtonGroup variant="glass" size={44} aria-label="多选操作">
        <Button
          leftIcon="Group"
          onClick={() => {
            const id = groupNodes(canvasId, ids);
            if (id) onSelect([id]);
          }}
        >
          {GROUP_TEXT.group}
        </Button>
        {onAddToChat && chat.length > 0 && (
          <Button leftIcon="AddToCanvas" disabled={chatBusy} onClick={() => onAddToChat(chat.map((n) => n.id))}>
            {GROUP_TEXT.addToChat}
          </Button>
        )}
        <Button leftIcon="Copy" onClick={() => copyNodes(canvasId, ids)}>
          {GROUP_TEXT.copy}
        </Button>
        <Button leftIcon="Download" disabled={!canDownload} onClick={() => downloadNodes(all)}>
          {GROUP_TEXT.download}
        </Button>
        <ArrangeButton disabled={arrangeTargets(doc, ids).length < 2} onPick={(mode) => arrangeNodes(canvasId, ids, mode)} />
      </ButtonGroup>
    </div>
  );
}
