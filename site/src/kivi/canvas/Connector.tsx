import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent } from 'react';
import { composeHandlers } from '../hooks';
import { cx } from '../utils';
import { ConnectorRemove } from './ConnectorRemove';
import './canvas.css';

export type ConnectorState = 'default' | 'active' | 'drawing' | 'flowing';

export interface ConnectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 状态：默认 / 激活 / 拖拽中 / 执行中，默认是默认 */
  state?: ConnectorState;
  /** 宽，默认 240。实际按两个连接点的水平距离拉伸，粗细不跟着变 */
  width?: number;
  /** 高，默认 48。实际按两个连接点的垂直距离拉伸 */
  height?: number;
  /** 走向：up 起点在下、终点在上（默认）；down 起点在上、终点在下；flat 同高，是一条直线（高给 2） */
  direction?: 'up' | 'down' | 'flat';
  /** 删除按钮（ConnectorRemove）：true 一直显示；"hover" 鼠标移到线上才出现。不传就没有。Figma 里默认关。
   *  鼠标在线上移动时，按钮沿着线跟过去（取线上离鼠标最近的点），照线上 */
  remove?: boolean | 'hover';
  /** 点了删除按钮 */
  onRemove?: () => void;
}

/** 三次贝塞尔曲线：从起点水平出去，到终点水平进来，两个控制点都在水平方向的中点 */
function pathOf(direction: 'up' | 'down' | 'flat', w: number, h: number): string {
  if (direction === 'flat') return `M0 ${h / 2}H${w}`;
  if (direction === 'down') return `M0 0C${w / 2} 0 ${w / 2} ${h} ${w} ${h}`;
  return `M0 ${h}C${w / 2} ${h} ${w / 2} 0 ${w} 0`;
}

type Point = { x: number; y: number };

/** 线上离 p 最近的点：先粗采样 40 段找到区间，再三分法收敛 10 次（照线上 use-remove-button-follow） */
function closestOnPath(path: SVGPathElement, p: Point): Point | null {
  const total = path.getTotalLength();
  if (total === 0) return null;
  const dist = (len: number) => {
    const q = path.getPointAtLength(len);
    return (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
  };
  const SAMPLES = 40;
  const step = total / SAMPLES;
  let best = 0;
  let min = Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const d = dist(i * step);
    if (d < min) {
      min = d;
      best = i * step;
    }
  }
  let lo = Math.max(0, best - step);
  let hi = Math.min(total, best + step);
  for (let i = 0; i < 10; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (dist(m1) < dist(m2)) hi = m2;
    else lo = m1;
  }
  const q = path.getPointAtLength((lo + hi) / 2);
  return { x: q.x, y: q.y };
}

/** 节点之间的连线，4 种状态。Figma「画布」页 Connector */
export const Connector = forwardRef<HTMLDivElement, ConnectorProps>(function Connector(
  {
    state = 'default',
    width = 240,
    height = 48,
    direction = 'up',
    remove,
    onRemove,
    className,
    style,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    ...rest
  },
  ref,
) {
  const [hovered, setHovered] = useState(false);
  /** 删除按钮的位置，SVG 坐标；null 是在中点 */
  const [at, setAt] = useState<Point | null>(null);
  /** 跟着鼠标滑：刚出现那一下直接放到鼠标处，不从上次的位置滑过来 */
  const [following, setFollowing] = useState(false);
  const lineRef = useRef<SVGPathElement>(null);
  const frame = useRef(0);
  const d = pathOf(direction, width, height);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /** 鼠标的屏幕坐标换成 SVG 坐标再找线上最近的点。画布缩放时连线被 scale 过，按实际显示的大小换算 */
  const pointOf = (clientX: number, clientY: number, box: DOMRect) => {
    const path = lineRef.current;
    if (!path || box.width === 0 || box.height === 0) return null;
    return closestOnPath(path, {
      x: ((clientX - box.left) / box.width) * width,
      y: ((clientY - box.top) / box.height) * height,
    });
  };
  const follow = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const box = e.currentTarget.getBoundingClientRect();
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const p = pointOf(clientX, clientY, box);
      if (p) {
        setAt(p);
        setFollowing(true);
      }
    });
  };
  const enter = (e: MouseEvent<HTMLDivElement>) => {
    const p = pointOf(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    if (p) setAt(p);
    // 一直显示的按钮本来就在线上，进来时滑过去；悬停才出现的直接出现在鼠标处
    setFollowing(remove === true);
    setHovered(true);
  };
  const leave = () => {
    cancelAnimationFrame(frame.current);
    setFollowing(false);
    setHovered(false);
  };
  const removeAt = at ?? { x: width / 2, y: height / 2 };

  return (
    <div
      ref={ref}
      className={cx('kv-connector', state !== 'default' && `kv-connector--${state}`, className)}
      style={{ width, height, ...style } as CSSProperties}
      onMouseEnter={composeHandlers(onMouseEnter, remove ? enter : undefined)}
      onMouseLeave={composeHandlers(onMouseLeave, remove ? leave : undefined)}
      onMouseMove={composeHandlers(onMouseMove, remove ? follow : undefined)}
      {...rest}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path ref={lineRef} d={d} />
        {state === 'flowing' && <path className="kv-connector__flow" d={d} />}
      </svg>
      {remove && (
        <ConnectorRemove
          className="kv-connector__remove"
          data-following={following ? '' : undefined}
          visible={remove === true || hovered}
          onClick={onRemove}
          style={{ '--kv-remove-x': `${removeAt.x}px`, '--kv-remove-y': `${removeAt.y}px` } as CSSProperties}
        />
      )}
    </div>
  );
});
Connector.displayName = 'Connector';
