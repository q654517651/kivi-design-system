import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  AnnotationBox,
  AnnotationComment,
  AnnotationMarker,
  Button,
  ButtonGroup,
  IconButton,
  type AnnotationCorner,
} from '@kivi';
import { Playground } from '@shell';

// 「标注」页的演示：整套能画、能拖、能编辑的图片节点，加每个零件一个属性面板。参数表在 annotation.mdx

const IMG = './placeholders/';

// ---------- 整套：图片节点上的标注 ----------

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Note {
  id: number;
  rect: Rect;
  text: string;
  /** 已经添加到对话，对话里那份描述是什么 */
  chatText?: string;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const fromPoints = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
});
const percent = (r: Rect) => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` });

const START: Note[] = [
  { id: 1, rect: { x: 0.12, y: 0.18, width: 0.3, height: 0.34 }, text: '把这个猕猴桃换成切开的，露出果肉' },
  { id: 2, rect: { x: 0.52, y: 0.5, width: 0.22, height: 0.26 }, text: '背景加一点星点', chatText: '背景加一点星点' },
];

/** 图片节点上的标注：点「框选」进入标注态，在图上拖出一块加评论；悬停气泡看一行预览，点气泡编辑；拖两个圆点改大小 */
export function AnnotationDemo() {
  const [notes, setNotes] = useState<Note[]>(START);
  const [mode, setMode] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: number; fixed: { x: number; y: number } } | null>(null);
  const node = useRef<HTMLDivElement>(null);
  const seq = useRef(START.length);

  const norm = (e: { clientX: number; clientY: number }) => {
    const r = node.current!.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };
  const patch = (id: number, p: Partial<Note>) => setNotes((list) => list.map((n) => (n.id === id ? { ...n, ...p } : n)));

  // 画新框、拖圆点：移动、松手挂在 window 上，拖出图片外也能正常结束
  useEffect(() => {
    if (!drawing && !resizing) return;
    const move = (e: globalThis.PointerEvent) => {
      if (drawing) setDraft(fromPoints(drawing, norm(e)));
      if (resizing) patch(resizing.id, { rect: fromPoints(resizing.fixed, norm(e)) });
    };
    const up = (e: globalThis.PointerEvent) => {
      if (drawing) {
        const rect = fromPoints(drawing, norm(e));
        setDraft(null);
        setDrawing(null);
        // 单击没有面积，不创建
        if (rect.width * rect.height > 0.002) {
          const id = ++seq.current;
          setNotes((list) => [...list, { id, rect, text: '' }]);
          setEditing(id);
        }
      }
      setResizing(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing, resizing]);

  const startResize = (note: Note, corner: AnnotationCorner, e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y, width, height } = note.rect;
    setResizing({ id: note.id, fixed: corner === 'tl' ? { x: x + width, y: y + height } : { x, y } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, padding: '56px 0 24px', width: 640, maxWidth: '100%' }}>
      <div style={{ position: 'relative', width: 360, height: 240 }}>
        {mode && (
          <ButtonGroup variant="glass" size={44} aria-label="标注" style={{ position: 'absolute', left: '50%', bottom: 'calc(100% + 8px)', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            <IconButton tooltip={false} icon="Close" label="退出框选" onClick={() => setMode(false)} />
            <span style={{ color: 'var(--color-text-fill-tertiary)', fontSize: 14, lineHeight: '20px', paddingRight: 8 }}>在图像上拖拽选区添加评论</span>
          </ButtonGroup>
        )}
        <div
          ref={node}
          style={{ position: 'absolute', inset: 0 }}
          onPointerDown={(e) => {
            // 点在标注以外：收起编辑
            if (!(e.target as HTMLElement).closest('.kv-annotation-box')) setEditing(null);
          }}
        >
          <img
            src={`${IMG}kiwi-light-1x1.webp`}
            alt=""
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
          />
          {/* 标注态：整块盖住图片，拖出新框 */}
          {mode && (
            <div
              style={{ position: 'absolute', inset: 0, cursor: 'crosshair', touchAction: 'none' }}
              onPointerDown={(e) => {
                if (e.button !== 0 || e.target !== e.currentTarget) return;
                setEditing(null);
                setDrawing(norm(e));
              }}
            />
          )}
          {notes.map((n, i) => (
            <AnnotationBox
              key={n.id}
              style={percent(n.rect)}
              index={i + 1}
              onMarkerClick={() => setEditing(n.id)}
              onMarkerPointerEnter={() => setHover(n.id)}
              onMarkerPointerLeave={() => setHover(null)}
              onHandlePointerDown={(corner, e) => startResize(n, corner, e)}
              comment={
                editing === n.id ? (
                  <AnnotationComment
                    autoFocus
                    value={n.text}
                    onChange={(text) => patch(n.id, { text })}
                    added={n.chatText != null}
                    changed={n.text !== n.chatText}
                    onDelete={() => {
                      setNotes((list) => list.filter((x) => x.id !== n.id));
                      setEditing(null);
                    }}
                    onSend={() => setEditing(null)}
                    onAddToChat={() => {
                      patch(n.id, { chatText: n.text });
                      setEditing(null);
                    }}
                    onUpdate={() => {
                      patch(n.id, { chatText: n.text });
                      setEditing(null);
                    }}
                    onCollapse={() => setEditing(null)}
                  />
                ) : hover === n.id && n.text ? (
                  <AnnotationComment collapsed value={n.text} />
                ) : undefined
              }
            />
          ))}
          {draft && <AnnotationBox style={percent(draft)} handles={false} />}
        </div>
      </div>
      <Button variant={mode ? 'primary' : 'secondary'} leftIcon="Crop" onClick={() => setMode(!mode)}>
        {mode ? '退出框选' : '框选'}
      </Button>
    </div>
  );
}

// ---------- 属性面板 ----------

type MarkerState = { label: string };

export function AnnotationMarkerPlayground() {
  return (
    <Playground<MarkerState>
      controls={[{ key: 'label', label: '序号', type: 'text', value: '1' }]}
      render={(s) => <AnnotationMarker>{s.label || '1'}</AnnotationMarker>}
    />
  );
}

type CommentState = { status: string; added: string; text: string };

export function AnnotationCommentPlayground() {
  return (
    <Playground<CommentState>
      controls={[
        { key: 'status', label: '状态', type: 'segment', value: 'edit', options: [['edit', '编辑'], ['collapsed', '悬停预览']] },
        { key: 'added', label: '对话里', type: 'segment', value: 'no', options: [['no', '没添加'], ['added', '已添加'], ['changed', '已添加，改过']] },
        { key: 'text', label: '描述', type: 'text', value: '把这个猕猴桃换成切开的，露出果肉' },
      ]}
      rules={(s) => (s.status === 'collapsed' ? { added: true } : {})}
      render={(s, update) => <AnnotationComment collapsed={s.status === 'collapsed'} added={s.added !== 'no'} changed={s.added === 'changed'} value={s.text} onChange={(text) => update({ text })} />}
    />
  );
}
