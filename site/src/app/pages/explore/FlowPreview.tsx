import { flowTemplate, cloneToNewCanvas } from '../../data/workflows';
import type { Flow } from '../../data/catalog';
import { attempt } from '../../flows/errors';
import { CanvasPreviewDialog } from '../../parts/canvas-preview';

/*
  创作精选、工作流的预览（照线上 workflow-preview）：只读画布看这段节点，官方的显示 KIVI，「应用画布」：
  新建一块画布（名字照这一项）、整段节点复制进去，进画布页。探索页和创作首页画布广场共用。
*/
export function FlowPreview({ flow, onClose, onCloned }: { flow: Flow | null; onClose: () => void; onCloned: (canvasId: string) => void }) {
  return (
    <CanvasPreviewDialog
      item={flow && { name: flow.name, template: flowTemplate(flow) }}
      onClose={onClose}
      onAction={async () => {
        if (!flow) return;
        const id = await attempt(() => cloneToNewCanvas(flow.name, flowTemplate(flow)));
        if (!id) return;
        onClose();
        onCloned(id);
      }}
    />
  );
}
