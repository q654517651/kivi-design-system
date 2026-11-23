import { Button, ButtonGroup, Divider, Icon, IconButton, Slider } from '@kivi';
import { BRUSH } from './options';

/*
  舞台上浮着的条：涂抹工具条（上方正中）、缩放百分比（左下）、下载 / 重新上传 / 删除（右上）。
*/

export type BrushTool = 'brush' | 'erase' | 'hand';

export interface PaintBarProps {
  tool: BrushTool;
  onTool: (t: BrushTool) => void;
  size: number;
  onSize: (n: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** 清掉笔迹、回到画笔 */
  canReset: boolean;
  onReset: () => void;
}

/** 涂抹工具条：只在局部重绘、元素去除出（智能重绘不出） */
export function PaintBar({ tool, onTool, size, onSize, canUndo, canRedo, onUndo, onRedo, canReset, onReset }: PaintBarProps) {
  return (
    <ButtonGroup variant="glass" size={44} className="tpl-at__top">
      <IconButton icon="Brush" label="画笔" selected={tool === 'brush'} onClick={() => onTool('brush')} />
      <IconButton icon="Eraser" label="橡皮" selected={tool === 'erase'} onClick={() => onTool('erase')} />
      <IconButton icon="Hand" label="拖动" tooltip={{ shortcut: '空格' }} selected={tool === 'hand'} onClick={() => onTool('hand')} />
      <Divider orientation="vertical" />
      <span className="tpl-at__size">
        <Icon name="BrushSize" />
        <Slider aria-label="笔刷大小" min={BRUSH.min} max={BRUSH.max} value={size} onChange={onSize} />
      </span>
      <Divider orientation="vertical" />
      <IconButton icon="Previous" label="撤销" disabled={!canUndo} onClick={onUndo} />
      <IconButton icon="NextStep" label="重做" disabled={!canRedo} onClick={onRedo} />
      <IconButton icon="Reset" label="重置" disabled={!canReset} onClick={onReset} />
    </ButtonGroup>
  );
}

/** 缩放百分比，点了回 100% */
export function ZoomBadge({ z, onReset }: { z: number; onReset: () => void }) {
  return (
    <ButtonGroup variant="glass" size={44} className="tpl-at__zoom">
      <Button aria-label="缩放比例，点击回到 100%" onClick={onReset}>
        {Math.round(z * 100)}%
      </Button>
    </ButtonGroup>
  );
}

/** 右上：下载、重新上传、清空（把舞台清回空的上传状态，结果都还在历史里；不是删除，11-20 用户定用扫把、不弹确认） */
export function StageActions({ onDownload, onReupload, onRemove }: { onDownload: () => void; onReupload: () => void; onRemove?: () => void }) {
  return (
    <ButtonGroup variant="glass" size={44} className="tpl-at__actions">
      <IconButton icon="Download" label="下载" tooltip={{ placement: 'bottom' }} onClick={onDownload} />
      <IconButton icon="ReUpload" label="重新上传" tooltip={{ placement: 'bottom' }} onClick={onReupload} />
      {onRemove && <IconButton icon="Clean" label="清空" tooltip={{ placement: 'bottom' }} onClick={onRemove} />}
    </ButtonGroup>
  );
}
