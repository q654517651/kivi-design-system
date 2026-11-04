import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from 'react';
import { cx } from '../utils';
import './canvas.css';

export interface MinimapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MinimapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 画布上所有节点的位置和大小，画布坐标 */
  nodes: MinimapRect[];
  /** 现在看到的那一块（视口），画布坐标 */
  viewport: MinimapRect;
  /** 在小地图里点、拖时触发，参数是视口中心要去的画布坐标；方向键也触发，每次挪视口宽的 10%。不传就只能看 */
  onViewportChange?: (center: { x: number; y: number }) => void;
}

const W = 164;
const H = 108;
const PAD = 8; // 内容离小地图边的空白

interface Frame {
  /** 小地图里 1 个画布单位是多少像素 */
  scale: number;
  /** 画布坐标 (0, 0) 在小地图里的位置 */
  ox: number;
  oy: number;
}

/** 节点和视口合起来放进 164 × 108，按比例缩，居中 */
function frameOf(nodes: MinimapRect[], viewport: MinimapRect): Frame {
  const all = [...nodes, viewport];
  const left = Math.min(...all.map((r) => r.x));
  const top = Math.min(...all.map((r) => r.y));
  const right = Math.max(...all.map((r) => r.x + r.width));
  const bottom = Math.max(...all.map((r) => r.y + r.height));
  const scale = Math.min((W - PAD * 2) / (right - left || 1), (H - PAD * 2) / (bottom - top || 1));
  return { scale, ox: (W - (right - left) * scale) / 2 - left * scale, oy: (H - (bottom - top) * scale) / 2 - top * scale };
}

/**
 * 小地图：画布左下角，缩放条上方。164 × 108，玻璃底；每个节点一块，现在看到的那一块（视口）画成一个框。
 * 点一下、按住拖，视口中心就去那里；拖的时候小地图的比例不变。比例尺是节点和视口合起来放大到刚好放得下，
 * 视口拖出节点范围时小地图跟着变大。出现、收起没有动效。线上用第三方的小地图插件，样式要自己清；这里是自己的组件。
 */
export const Minimap = forwardRef<HTMLDivElement, MinimapProps>(function Minimap(
  { nodes, viewport, onViewportChange, className, onPointerDown, onPointerMove, onPointerUp, onKeyDown, ...rest },
  ref,
) {
  const frozen = useRef<Frame | null>(null);
  const frame = frozen.current ?? frameOf(nodes, viewport);
  const interactive = Boolean(onViewportChange);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = frozen.current ?? frame;
    onViewportChange?.({ x: (e.clientX - r.left - f.ox) / f.scale, y: (e.clientY - r.top - f.oy) / f.scale });
  };

  const place = (r: MinimapRect): CSSProperties => ({
    left: frame.ox + r.x * frame.scale,
    top: frame.oy + r.y * frame.scale,
    width: r.width * frame.scale,
    height: r.height * frame.scale,
  });

  return (
    <div
      ref={ref}
      className={cx('kv-minimap', className)}
      role="group"
      aria-label="小地图"
      data-interactive={interactive ? '' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (!interactive || e.defaultPrevented) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        frozen.current = frame;
        move(e);
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (frozen.current && !e.defaultPrevented) move(e);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        frozen.current = null;
      }}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        if (!interactive || e.defaultPrevented) return;
        const step = viewport.width * 0.1;
        const cx0 = viewport.x + viewport.width / 2;
        const cy0 = viewport.y + viewport.height / 2;
        const to: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const d = to[e.key];
        if (!d) return;
        e.preventDefault();
        onViewportChange?.({ x: cx0 + d[0], y: cy0 + d[1] });
      }}
      {...rest}
    >
      {nodes.map((n, i) => (
        <span key={i} className="kv-minimap__node" style={place(n)} />
      ))}
      <span className="kv-minimap__viewport" style={place(viewport)} />
    </div>
  );
});
Minimap.displayName = 'Minimap';
