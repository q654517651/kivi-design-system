import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { AnnotationBox, AnnotationComment, Dialog } from '@kivi';
import './node-tools.css';

/*
  框选（照线上 image-annotation-plugin）：在图上拖出选区，写评论，每个选区一个序号；再点序号改、悬停看一行预览；
  只画了框没写字的，收起时算放弃。线上是图放大居中后在画布上原地标注，评论「发送」直接发给 Agent、「添加到对话」放进对话输入框；
  这里是弹窗：「添加到对话」往 Agent 输入框插一个标注胶囊（缩略图 + 序号 + 评论），「发送」直接发给 Agent（11-19 用户定补上）。
*/

/** 一条标注带进对话：序号、评论；send 是直接发出去 */
export interface AnnotationNote {
  index: number;
  text: string;
  send?: boolean;
}

interface Annotation {
  id: number;
  /** 相对图的框，0–1 */
  rect: { x: number; y: number; w: number; h: number };
  text: string;
  /** 已经添加到对话 */
  added: boolean;
}

/** 选区太小（相对图的比例）当作误点，不建 */
const MIN_SIZE = 0.02;

export interface AnnotateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  /** 原图宽 / 高 */
  ratio: number;
  /** 点评论里的「发送」「添加到对话」：带上这条标注 */
  onAddToChat: (note: AnnotationNote) => void;
}

export function AnnotateDialog({ open, onOpenChange, src, ratio, onAddToChat }: AnnotateDialogProps) {
  return (
    <Dialog size={800} className="app-stage-dlg" title="框选" open={open} onOpenChange={onOpenChange}>
      {open && <AnnotateStage src={src} ratio={ratio} onAddToChat={onAddToChat} />}
    </Dialog>
  );
}

function AnnotateStage({ src, ratio, onAddToChat }: Omit<AnnotateDialogProps, 'open' | 'onOpenChange'>) {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = Math.min(area.w, area.h * ratio);
  const h = w / ratio;

  const [list, setList] = useState<Annotation[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [drawing, setDrawing] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const seq = useRef(1);

  // 收起评论：只画了框没写字的算放弃（序号不回收）
  const closeEditing = () => {
    setList((l) => l.filter((a) => a.id !== editing || a.text.trim()));
    setEditing(null);
  };
  const patch = (id: number, p: Partial<Annotation>) => setList((l) => l.map((a) => (a.id === id ? { ...a, ...p } : a)));

  const point = (e: PointerEvent) => {
    const r = frameRef.current!.getBoundingClientRect();
    const c = (v: number) => Math.min(1, Math.max(0, v));
    return { x: c((e.clientX - r.left) / r.width), y: c((e.clientY - r.top) / r.height) };
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.kv-annotation-box')) return;
    closeEditing();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    setDrawing({ x0: p.x, y0: p.y, ...p });
  };
  const move = (e: PointerEvent) => drawing && setDrawing({ ...drawing, ...point(e) });
  const up = () => {
    if (!drawing) return;
    const rect = { x: Math.min(drawing.x0, drawing.x), y: Math.min(drawing.y0, drawing.y), w: Math.abs(drawing.x - drawing.x0), h: Math.abs(drawing.y - drawing.y0) };
    setDrawing(null);
    if (rect.w < MIN_SIZE || rect.h < MIN_SIZE) return;
    const id = seq.current++;
    setList((l) => [...l, { id, rect, text: '', added: false }]);
    setEditing(id);
  };

  const pct = (r: Annotation['rect']) => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });
  const add = (a: Annotation, send = false) => {
    onAddToChat({ index: a.id, text: a.text.trim(), send });
    patch(a.id, { added: true });
    setEditing(null);
  };

  return (
    <>
      <div className="app-stage__bar">
        <div className="app-stage__bar-left">在图像上拖拽选区添加评论</div>
      </div>
      <div ref={areaRef} className="app-stage app-stage--center">
        {w > 0 && (
          <div ref={frameRef} className="app-annot__frame" style={{ width: w, height: h }} onPointerDown={down} onPointerMove={move} onPointerUp={up}>
            <img src={src} alt="" draggable={false} />
            {list.map((a) => (
              <AnnotationBox
                key={a.id}
                index={a.id}
                handles={false}
                style={pct(a.rect)}
                onMarkerClick={() => (editing === a.id ? closeEditing() : (closeEditing(), setEditing(a.id)))}
                onMarkerPointerEnter={() => setHover(a.id)}
                onMarkerPointerLeave={() => setHover(null)}
                comment={
                  editing === a.id ? (
                    <AnnotationComment
                      autoFocus
                      value={a.text}
                      onChange={(text) => patch(a.id, { text })}
                      added={a.added}
                      changed
                      onDelete={() => (setList((l) => l.filter((x) => x.id !== a.id)), setEditing(null))}
                      onSend={() => add(a, true)}
                      onAddToChat={() => add(a)}
                      onUpdate={() => add(a)}
                      onCollapse={closeEditing}
                    />
                  ) : hover === a.id && a.text ? (
                    <AnnotationComment collapsed value={a.text} />
                  ) : undefined
                }
              />
            ))}
            {drawing && (
              <AnnotationBox
                handles={false}
                style={pct({ x: Math.min(drawing.x0, drawing.x), y: Math.min(drawing.y0, drawing.y), w: Math.abs(drawing.x - drawing.x0), h: Math.abs(drawing.y - drawing.y0) } as Annotation['rect'])}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
