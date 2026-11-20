import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent } from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import { AddTile } from '../upload';
import { cx } from '../utils';
import { ReferenceItem } from './ReferenceItem';
import './reference.css';

export interface ReferenceFrame {
  /** 缩略图地址。不传就是空格：显示添加格 */
  src?: string;
  /** 这张图是谁，删除时原样传回去好认（比如画布里上游节点的 key）。不传也行 */
  id?: string;
}

/** 哪一格：首帧 / 尾帧（按现在显示的位置算） */
export type ReferenceFrameSlot = 'first' | 'last';

export interface ReferenceFramePairProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 尺寸：56 用在画布生成面板，72 用在主站输入框。默认 56 */
  size?: 56 | 72;
  /** 首帧。外面换了图（src 变了）就跟着变，之前的互换作废 */
  first: ReferenceFrame;
  /** 尾帧。同上 */
  last: ReferenceFrame;
  /** 点中间的互换按钮后触发，参数是换过来的首帧、尾帧。不传也能换，组件自己记着；外面收到后把 first / last 换成这两个也行，不会换两次 */
  onSwap?: (first: ReferenceFrame, last: ReferenceFrame) => void;
  /** 点了空格的添加格，参数是哪一格：弹出选图（主站），或新建上游图片节点连进来（画布）。不传添加格点了没反应 */
  onAdd?: (slot: ReferenceFrameSlot) => void;
  /** 点了有图那一格的删除（鼠标移上去右上角出，同时角标隐藏），参数是哪一格和那张图：主站清掉这一格，画布断开那条连线。不传就没有删除 */
  onRemove?: (slot: ReferenceFrameSlot, frame: ReferenceFrame) => void;
}

/** 互换时两张图各自滑到对方的位置：屏幕内移动，ease-in-out，200ms（移动 100px 以内那档） */
const GAP = 4;
const BUTTON = 28;

const LABEL: Record<ReferenceFrameSlot, string> = { first: '首帧', last: '尾帧' };

/**
 * 首尾帧：两格参考图，右上角标写「首帧」「尾帧」，中间一个互换按钮，点一下两张图对调。
 * 空格是添加格（AddTile，和格子一样大），角标照样写；有图的格子鼠标移上去出删除。两格都空时互换不能点，只有一张也能换（换到另一格）。
 * 画布生成面板和主站输入框共用。Figma「模板 · 画布」页「参考图区块 · 首尾帧」
 */
export const ReferenceFramePair = forwardRef<HTMLDivElement, ReferenceFramePairProps>(function ReferenceFramePair(
  { size = 56, first, last, onSwap, onAdd, onRemove, className, style, ...rest },
  ref,
) {
  // 互换只记「换没换」，显示的图永远从外面传的 first / last 来：外面换图就跟着变
  const [swapped, setSwapped] = useState(false);
  const [moving, setMoving] = useState(false);
  // 外面的图变了，之前的互换作废。在渲染里直接调整，不等 effect，免得闪一下旧图
  const source = `${first.src ?? ''}\n${last.src ?? ''}`;
  const [seen, setSeen] = useState(source);
  if (seen !== source) {
    setSeen(source);
    setSwapped(false);
  }
  const pair: [ReferenceFrame, ReferenceFrame] = swapped ? [last, first] : [first, last];
  const distance = size + GAP * 2 + BUTTON;

  // 动画的定时器和当前输入：外面换图、卸载时清掉定时器；滑完时输入已经变了就不回传
  const timer = useRef<number>();
  const sourceRef = useRef(source);
  sourceRef.current = source;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    window.clearTimeout(timer.current);
    setMoving(false);
  }, [source]);

  // 两张图滑到对方位置（时长取 --motion-duration-200，「减少动态效果」时是 0），滑完再对调数据、去掉位移
  const swap = (e: MouseEvent<HTMLButtonElement>) => {
    if (moving) return;
    const raw = getComputedStyle(e.currentTarget).getPropertyValue('--motion-duration-200');
    const ms = parseFloat(raw) || 0;
    const startedWith = source;
    const finish = () => {
      // 动画途中外面换了图：之前的互换作废，不把旧图写回去
      if (sourceRef.current !== startedWith) return;
      const next: [ReferenceFrame, ReferenceFrame] = [pair[1], pair[0]];
      setSwapped(!swapped);
      setMoving(false);
      onSwap?.(next[0], next[1]);
    };
    if (ms === 0) return finish();
    setMoving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(finish, ms);
  };

  const empty = !first.src && !last.src;
  const slot = (frame: ReferenceFrame, which: ReferenceFrameSlot) => (
    <div
      className={cx('kv-reference-frame-pair__slot', `kv-reference-frame-pair__${which}`)}
      data-removable={frame.src && onRemove ? '' : undefined}
    >
      {frame.src ? (
        <>
          <ReferenceItem size={size} src={frame.src} badge={LABEL[which]} />
          {onRemove && (
            <button
              type="button"
              className="kv-reference-frame-pair__remove"
              aria-label={`删除${LABEL[which]}`}
              onClick={() => onRemove(which, frame)}
            >
              <Icon name="CloseSmall" />
            </button>
          )}
        </>
      ) : (
        <>
          <AddTile variant="outline" size={size} aria-label={`添加${LABEL[which]}`} onClick={() => onAdd?.(which)} />
          <span className="kv-reference-item__badge" aria-hidden="true">
            {LABEL[which]}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cx('kv-reference-frame-pair', className)}
      style={{ '--kv-frame-distance': `${distance}px`, ...style } as CSSProperties}
      data-swapping={moving ? '' : undefined}
      {...rest}
    >
      {slot(pair[0], 'first')}
      <IconButton icon="Switch" label="交换首帧和尾帧" size={28} className="kv-reference-frame-pair__swap" disabled={empty} onClick={swap} />
      {slot(pair[1], 'last')}
    </div>
  );
});
ReferenceFramePair.displayName = 'ReferenceFramePair';
