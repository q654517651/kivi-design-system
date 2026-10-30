import { useEffect, useId, useRef, useState } from 'react';
import { Player, type PlayerOptions } from './player';
import type { GeneratingColor, GeneratingEffect } from './engine';
import type { GeneratingType } from './shapes';

/** 系统有没有开「减少动态效果」 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** useId 变成数字：同一个实例每次渲染都一样，不同实例不一样，点的轨迹各不相同 */
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface GeneratingCommon {
  /**
   * 方案一 星点闪烁 / 方案二 斜飘 / 方案三 静态扫光：图标拼好不动，只有扫光循环。
   * 不传：每个实例挂载时在前两个里随机选一个，之后不变。系统开了减少动态效果时一律用方案三，盖过这里传的值
   */
  effect?: GeneratingEffect;
  /** 速度倍数，1 是一轮 5.8 秒，默认 0.5 */
  speed?: number;
  /** 点距，参照 256 边长，默认 6 */
  spacing?: number;
  /** 点的颜色：品牌渐变 / 白色，默认白色 */
  color?: GeneratingColor;
  /** 光晕强度 0–1，0 是没有，默认 0.25 */
  glow?: number;
  /** 暂停，停在当前画面 */
  paused?: boolean;
  /** 随机种子，决定点的轨迹。不传每个实例各一个 */
  seed?: number;
}

export interface UseGeneratingConfig extends GeneratingCommon {
  type: GeneratingType;
  count: number;
  gap: number;
  radius: number;
}

/** 把一块 canvas 接上点阵动效：返回要挂到根元素和 canvas 上的 ref，以及是不是在「减少动态效果」 */
export function useGenerating(config: UseGeneratingConfig) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useRef<Player | null>(null);
  const reduced = usePrefersReducedMotion();
  const autoSeed = hashId(useId());
  // 不传 effect 时，挂载那一刻在方案一、二里随机选一个，重渲染不换
  const [autoEffect] = useState<GeneratingEffect>(() => (Math.random() < 0.5 ? 'twinkle' : 'drift'));

  const paused = Boolean(config.paused);
  // 系统开了减少动态效果：一律用方案三静态扫光
  const effect: GeneratingEffect = reduced ? 'sheen' : (config.effect ?? autoEffect);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const p = new Player(root, canvas);
    player.current = p;
    return () => {
      p.destroy();
      player.current = null;
    };
  }, []);

  const opts: PlayerOptions = {
    type: config.type,
    effect,
    count: config.count,
    gap: config.gap,
    radius: config.radius,
    spacing: config.spacing ?? 6,
    seed: config.seed ?? autoSeed,
    speed: config.speed && config.speed > 0 ? config.speed : 0.5,
    color: config.color ?? 'white',
    glow: Math.min(1, Math.max(0, config.glow ?? 0.25)),
    paused,
  };
  // 每次渲染都交给播放器，它自己比对哪些要重算
  useEffect(() => {
    player.current?.update(opts);
  });

  return { rootRef, canvasRef, reduced, paused, effect };
}
