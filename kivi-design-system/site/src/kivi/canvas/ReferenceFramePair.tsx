import { forwardRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent } from 'react';
import { IconButton } from '../button';
import { cx } from '../utils';
import { ReferenceItem } from './ReferenceItem';
import './canvas.css';

export interface ReferenceFrame {
  /** 缩略图地址 */
  src?: string;
}

export interface ReferenceFramePairProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 尺寸：56 用在画布生成面板，72 用在主站输入框。默认 56 */
  size?: 56 | 72;
  /** 首帧。外面换了图（src 变了）就跟着变，之前的互换作废 */
  first: ReferenceFrame;
  /** 尾帧。同上 */
  last: ReferenceFrame;
  /** 点中间的互换按钮后触发，参数是换过来的首帧、尾帧。不传也能换，组件自己记着；外面收到后把 first / last 换成这两个也行，不会换两次 */
  onSwap?: (first: ReferenceFrame, last: ReferenceFrame) => void;
}

/** 互换时两张图各自滑到对方的位置：屏幕内移动，ease-in-out，200ms（移动 100px 以内那档） */
const GAP = 4;
const BUTTON = 28;

/**
 * 首尾帧：两格参考图，右上角标写「首帧」「尾帧」，中间一个互换按钮，点一下两张图对调。
 * 画布生成面板和主站输入框共用。Figma「模板 · 画布」页「参考图区块 · 首尾帧」
 */
export const ReferenceFramePair = forwardRef<HTMLDivElement, ReferenceFramePairProps>(function ReferenceFramePair(
  { size = 56, first, last, onSwap, className, style, ...rest },
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

  // 两张图滑到对方位置（时长取 --motion-duration-200，「减少动态效果」时是 0），滑完再对调数据、去掉位移
  const swap = (e: MouseEvent<HTMLButtonElement>) => {
    if (moving) return;
    const raw = getComputedStyle(e.currentTarget).getPropertyValue('--motion-duration-200');
    const ms = parseFloat(raw) || 0;
    const finish = () => {
      const next: [ReferenceFrame, ReferenceFrame] = [pair[1], pair[0]];
      setSwapped(!swapped);
      setMoving(false);
      onSwap?.(next[0], next[1]);
    };
    if (ms === 0) return finish();
    setMoving(true);
    window.setTimeout(finish, ms);
  };

  return (
    <div
      ref={ref}
      className={cx('kv-reference-frame-pair', className)}
      style={{ '--kv-frame-distance': `${distance}px`, ...style } as CSSProperties}
      data-swapping={moving ? '' : undefined}
      {...rest}
    >
      <ReferenceItem size={size} src={pair[0].src} badge="首帧" className="kv-reference-frame-pair__first" />
      <IconButton icon="Switch" label="交换首帧和尾帧" size={28} className="kv-reference-frame-pair__swap" onClick={swap} />
      <ReferenceItem size={size} src={pair[1].src} badge="尾帧" className="kv-reference-frame-pair__last" />
    </div>
  );
});
ReferenceFramePair.displayName = 'ReferenceFramePair';
