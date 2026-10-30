import { forwardRef, type HTMLAttributes } from 'react';
import { useMergedRef } from '../hooks';
import { cx } from '../utils';
import type { GeneratingType } from './shapes';
import { useGenerating, type GeneratingCommon } from './useGenerating';
import './generating.css';

export interface GeneratingRowProps extends GeneratingCommon, Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** 每张图里拼出的类型图标，默认图片 */
  type?: GeneratingType;
  /** 一次生成几张，默认 4。父元素要排成同样多的等宽格子 */
  count?: number;
  /** 格子之间的缝，默认 8，要和父元素排版里的 gap 一样 */
  gap?: number;
  /** 每个格子的圆角，默认 8（--border-radius-8），用来裁掉格子之外的光晕 */
  radius?: number;
}

/**
 * 一次生成多张（主站默认 4 张）：几张图共用一片点阵，每张里各拼一个类型图标。
 * 动效和 GeneratingDots 一样，只是每张比左边一张晚 0.1 时间线秒（0.5× 速度下 200ms），扫光也跟着错开，每张各扫一道；
 * 背景星点的噪波是连成一片的。
 * 铺满最近的定位父元素，父元素里要把 count 个等宽格子排成一行，格子之间的缝和 gap 一样。
 * 2026-10-29 用户在对话里定的，Figma 里还没有。
 */
export const GeneratingRow = forwardRef<HTMLDivElement, GeneratingRowProps>(function GeneratingRow(
  {
    type = 'image',
    effect,
    count = 4,
    gap = 8,
    radius = 8,
    speed,
    spacing,
    color,
    glow,
    paused,
    seed,
    className,
    ...rest
  },
  ref,
) {
  const { rootRef, canvasRef, reduced, paused: isPaused, effect: shown } = useGenerating({
    type,
    effect,
    count: Math.max(1, Math.round(count)),
    gap,
    radius,
    speed,
    spacing,
    color,
    glow,
    paused,
      seed,
  });
  const setRoot = useMergedRef(rootRef, ref);
  return (
    <div
      ref={setRoot}
      className={cx('kv-generating', 'kv-generating--row', className)}
      aria-hidden="true"
      data-type={type}
      data-effect={shown}
      data-reduced={reduced || undefined}
      data-paused={isPaused || undefined}
      {...rest}
    >
      <canvas ref={canvasRef} className="kv-generating__canvas" />
    </div>
  );
});
GeneratingRow.displayName = 'GeneratingRow';
