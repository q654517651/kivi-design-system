import { forwardRef, type HTMLAttributes } from 'react';
import { useMergedRef } from '../hooks';
import { cx } from '../utils';
import type { GeneratingType } from './shapes';
import { useGenerating, type GeneratingCommon } from './useGenerating';
import './generating.css';

export type { GeneratingType };

export interface GeneratingDotsProps extends GeneratingCommon, Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** 汇聚时拼出的类型图标：图片 / 视频 / 音频 / 文字（Figma 图标 ImageGeneration / VideoGeneration / Audio / Text） */
  type: GeneratingType;
}

/**
 * 生成中动效：点阵在格子中间拼出类型图标，停一下后散开成星点，循环。
 * 三个方案（effect）：方案一 星点闪烁，点不飞；方案二 斜飘，图标往右上飘散、再从左下飘回；
 * 方案三 静态扫光，图标拼好不动、只有扫光循环；系统开了减少动态效果时一律用它（盖过 effect）。
 * 铺满最近的定位父元素（position: relative 的那层），尺寸跟着父元素变；圆角跟父元素。
 * 2026-10-29 用户在对话里定的，Figma 里还没有。
 */
export const GeneratingDots = forwardRef<HTMLDivElement, GeneratingDotsProps>(function GeneratingDots(
  { type, effect, speed, spacing, color, glow, paused, seed, className, ...rest },
  ref,
) {
  const { rootRef, canvasRef, reduced, paused: isPaused, effect: shown } = useGenerating({
    type,
    effect,
    count: 1,
    gap: 0,
    radius: 0,
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
      className={cx('kv-generating', 'kv-generating--dots', className)}
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
GeneratingDots.displayName = 'GeneratingDots';
