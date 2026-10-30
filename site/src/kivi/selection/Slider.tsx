import { forwardRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../utils';
import { composeHandlers, useControllable, usePointerDrag } from '../hooks';
import './selection.css';

/** 数值在轨道上的可用范围离两端多远：没有刻度数字时是把手宽的一半（4），有刻度数字时是数字框宽的一半（11），和 selection.css 的 --kv-inset 一致 */
const INSET = 4;
const INSET_LABELED = 11;

export interface SliderMark {
  /** 刻度对应的值 */
  value: number;
  /** 刻度下面的数字，比如 "10"。不传就只画刻度线 */
  label?: ReactNode;
}

export interface SliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'role' | 'children'> {
  /** 当前值。传了就是受控，要自己在 onChange 里更新 */
  value?: number;
  /** 非受控时的初始值，默认等于最小值 */
  defaultValue?: number;
  /** 拖动、点轨道、按方向键时触发，参数是新的值 */
  onChange?: (value: number) => void;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 步长，默认 1 */
  step?: number;
  /** 刻度：轨道上画一条条刻度线，带 label 的在下面写数字，当前值对上的数字高亮。不传就没有 */
  marks?: SliderMark[];
  /** 禁用：整体透明度 30%，不能拖。悬停没有变化 */
  disabled?: boolean;
}

function decimals(n: number): number {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/**
 * 在一个范围里调一个数值，比如时长、语速。样子照 Figma「模板 · 画布」参数面板里的时长（210:1560）：
 * 20 高的灰轨道，已选部分白 12%，把手 8 × 20 的白条，可选刻度和刻度数字。原来的绿色细滑块项目里不用了（2026-10-29 用户说）。
 * 能拖、能点轨道、能用方向键（← ↓ 减，→ ↑ 加，Home / End 到头，PageUp / PageDown 一次 10 步）。
 * 没有文字，必须写 aria-label。
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    value,
    defaultValue,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    marks,
    disabled,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const [current, setValue] = useControllable(value, defaultValue ?? min, onChange);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const snap = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return clamp(Number(stepped.toFixed(Math.max(decimals(step), decimals(min)))));
  };
  const commit = (raw: number) => setValue(snap(raw));

  const labeled = Boolean(marks?.some((m) => m.label != null));
  const inset = labeled ? INSET_LABELED : INSET;
  const at = (v: number) => (max > min ? (Math.min(max, Math.max(min, v)) - min) / (max - min) : 0);

  // 按下就跳到那里、拖着走、松手结束
  const drag = usePointerDrag({ axis: 'x', inset, disabled, onMove: (f) => commit(min + f * (max - min)) });

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const to: Record<string, number> = {
      ArrowLeft: current - step,
      ArrowDown: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      PageDown: current - step * 10,
      PageUp: current + step * 10,
      Home: min,
      End: max,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    commit(to[e.key]);
  };

  const fraction = at(current);

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={disabled ? undefined : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-disabled={disabled || undefined}
      className={cx('kv-slider', labeled && 'kv-slider--labeled', className)}
      style={{ '--kv-value': +fraction.toFixed(4), ...style } as CSSProperties}
      onPointerDown={composeHandlers(onPointerDown, drag.onPointerDown)}
      onPointerMove={composeHandlers(onPointerMove, drag.onPointerMove)}
      onPointerUp={composeHandlers(onPointerUp, drag.onPointerUp)}
      onPointerCancel={composeHandlers(onPointerCancel, drag.onPointerCancel)}
      onKeyDown={composeHandlers(onKeyDown, handleKeyDown)}
      {...rest}
    >
      <span className="kv-slider__track">
        {marks?.map((m) => (
          <span key={m.value} className="kv-slider__tick" style={{ '--kv-at': at(m.value) } as CSSProperties} />
        ))}
        <span className="kv-slider__fill" />
        <span className="kv-slider__thumb" />
      </span>
      {labeled && (
        <span className="kv-slider__labels" aria-hidden="true">
          {marks!.map(
            (m) =>
              m.label != null && (
                <span
                  key={m.value}
                  className="kv-slider__label"
                  data-current={m.value === current ? '' : undefined}
                  style={{ '--kv-at': at(m.value) } as CSSProperties}
                >
                  {m.label}
                </span>
              ),
          )}
        </span>
      )}
    </div>
  );
});
Slider.displayName = 'Slider';
