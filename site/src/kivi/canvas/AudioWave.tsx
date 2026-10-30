import { forwardRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from 'react';
import { composeHandlers, usePointerDrag } from '../hooks';
import { cx } from '../utils';
import './canvas.css';

/** Figma 里画好的 72 条竖条的高度（px），最高 69，最矮 1 */
const SAMPLE_BARS = [1,27,39,27,11,1,19,39,39,59,59,39,19,1,1,1,1,1,1,1,69,51,35,35,17,1,35,35,51,51,35,9,9,1,51,35,1,35,1,35,51,35,35,35,23,9,1,9,23,35,23,9,1,1,1,35,9,9,1,51,35,1,35,1,35,51,35,35,35,23,9,1];

export interface AudioWaveProps extends HTMLAttributes<HTMLDivElement> {
  /** 播放位置，0–100，默认 49。播放头在这里，它左边的竖条是播放过的 */
  progress?: number;
  /** 每条竖条的高度（px，最高 69），默认是 Figma 里画好的 72 条 */
  bars?: number[];
  /** 拖动、点击、按方向键改了位置，参数是新的位置（0–100）。传了波形就是一个滑块，不传只是展示 */
  onProgressChange?: (progress: number) => void;
  /** 方向键一次走多少（0–100 里的份数），默认 5。Home / End 回到头 / 尾 */
  step?: number;
  /** 禁用：不能拖、不能按键，波形变淡 */
  disabled?: boolean;
  /** 读屏读的当前位置，比如「00:03 / 00:08」；不传读百分比 */
  valueText?: string;
  /** 读屏读的名字，默认「播放进度」 */
  label?: string;
}

/** 音频波形，带播放头。宽度随容器，高度默认 80。传 onProgressChange 就能点、能拖、能用键盘调。Figma「画布」页 AudioWave */
export const AudioWave = forwardRef<HTMLDivElement, AudioWaveProps>(function AudioWave(
  {
    progress = 49,
    bars = SAMPLE_BARS,
    onProgressChange,
    step = 5,
    disabled,
    valueText,
    label = '播放进度',
    className,
    style,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    ...rest
  },
  ref,
) {
  const last = Math.max(bars.length - 1, 1);
  const interactive = !!onProgressChange;
  const drag = usePointerDrag({
    disabled: disabled || !interactive,
    onMove: (ratio) => onProgressChange?.(ratio * 100),
  });
  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const sliderProps = interactive
    ? {
        role: 'slider',
        tabIndex: disabled ? -1 : 0,
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': Math.round(progress),
        'aria-valuetext': valueText,
        'aria-disabled': disabled || undefined,
        onPointerDown: composeHandlers(onPointerDown, drag.onPointerDown),
        onPointerMove: composeHandlers(onPointerMove, drag.onPointerMove),
        onPointerUp: composeHandlers(onPointerUp, drag.onPointerUp),
        onPointerCancel: composeHandlers(onPointerCancel, drag.onPointerCancel),
        onKeyDown: composeHandlers(onKeyDown, (e: KeyboardEvent<HTMLDivElement>) => {
          if (disabled) return;
          const to =
            e.key === 'ArrowRight' || e.key === 'ArrowUp'
              ? progress + step
              : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                ? progress - step
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? 100
                    : null;
          if (to === null) return;
          e.preventDefault();
          onProgressChange(clamp(to));
        }),
      }
    : { onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };

  return (
    <div
      ref={ref}
      className={cx('kv-audio-wave', className)}
      data-interactive={interactive ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      style={{ '--progress': `${progress}%`, ...style } as CSSProperties}
      {...sliderProps}
      {...rest}
    >
      <div className="kv-audio-wave__bars">
        {bars.map((h, i) => (
          <i key={i} data-rest={(i / last) * 100 <= progress ? undefined : ''} style={{ '--h': `${h}px` } as CSSProperties} />
        ))}
      </div>
      <span className="kv-audio-wave__head" />
    </div>
  );
});
AudioWave.displayName = 'AudioWave';
