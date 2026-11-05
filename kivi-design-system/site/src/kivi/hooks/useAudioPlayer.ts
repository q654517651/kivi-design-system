import { useCallback, useEffect, useRef, useState, type AudioHTMLAttributes } from 'react';
import { exclusivePlayback } from './exclusivePlayback';
import { useControllable } from './useControllable';

// 组件库内部共用，从 hooks/ 引，不从入口导出。

/** 加载状态：没地址 / 加载中 / 能播了 / 加载失败 */
export type AudioStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AudioPlayerOptions {
  /** 音频地址。没有就不播，状态是 idle */
  src?: string;
  /** 播放中。传了就是受控 */
  playing?: boolean;
  /** 非受控时一开始是否在播（浏览器可能拦自动播放，拦了就回到暂停） */
  defaultPlaying?: boolean;
  /** 播放 / 暂停变了，参数是新的状态 */
  onPlayingChange?: (playing: boolean) => void;
  /** 开始播放 */
  onPlay?: () => void;
  /** 暂停 */
  onPause?: () => void;
  /** 播完了 */
  onEnded?: () => void;
}

/**
 * 音频播放：<audio> 的播放、暂停、进度、时长、加载状态，同一时间只播一个（走 exclusivePlayback）。
 * 返回的 audioRef 和 audioProps 展开到 <audio> 上；seek、seekBy 用来拖进度条、按方向键。
 */
export function useAudioPlayer({ src, playing, defaultPlaying = false, onPlayingChange, onPlay, onPause, onEnded }: AudioPlayerOptions) {
  const ref = useRef<HTMLAudioElement>(null);
  const [isPlaying, setPlaying] = useControllable(playing, defaultPlaying, onPlayingChange);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<AudioStatus>(src ? 'loading' : 'idle');

  // 换地址：重新来过（第一次渲染不清零）。然后照元素现在的样子补一次状态：
  // 元素在挂上去之前就加载好了的话（缓存），React 收不到那几个事件
  const lastSrc = useRef(src);
  useEffect(() => {
    const el = ref.current;
    if (lastSrc.current !== src) {
      lastSrc.current = src;
      setCurrentTime(0);
      setDuration(0);
      setStatus(src ? 'loading' : 'idle');
    }
    if (!el || !src) return;
    if (el.error) setStatus('error');
    else if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      setStatus('ready');
    }
  }, [src]);

  // 外面改了 playing：让元素跟上。被浏览器拦了（自动播放）就退回暂停
  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    if (isPlaying && el.paused) {
      el.play().catch(() => setPlaying(false));
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [isPlaying, src, setPlaying]);

  // 播放时每帧读一次进度，波形走得顺；不播时靠 timeupdate
  useEffect(() => {
    const el = ref.current;
    if (!isPlaying || !el) return;
    let raf = 0;
    const tick = () => {
      setCurrentTime(el.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // 卸载时让出互斥位
  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el) exclusivePlayback.stop(el);
    };
  }, []);

  const readDuration = (el: HTMLAudioElement) => setDuration(Number.isFinite(el.duration) ? el.duration : 0);

  const toggle = useCallback(() => {
    const el = ref.current;
    // 没地址：只切状态，让外面的开关还能用
    if (!src) return setPlaying(!isPlaying);
    if (!el) return;
    if (el.paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [src, isPlaying, setPlaying]);

  /** 跳到第几秒 */
  const seek = useCallback((time: number) => {
    const el = ref.current;
    if (!el) return;
    const max = Number.isFinite(el.duration) ? el.duration : 0;
    const next = Math.min(max, Math.max(0, time));
    el.currentTime = next;
    setCurrentTime(next);
  }, []);

  /** 快进、快退多少秒 */
  const seekBy = useCallback((delta: number) => seek((ref.current?.currentTime ?? 0) + delta), [seek]);

  const audioProps: AudioHTMLAttributes<HTMLAudioElement> = {
    src,
    preload: 'metadata',
    onLoadStart: () => setStatus(src ? 'loading' : 'idle'),
    onLoadedMetadata: (e) => {
      readDuration(e.currentTarget);
      setStatus('ready');
    },
    onDurationChange: (e) => readDuration(e.currentTarget),
    onCanPlay: () => setStatus('ready'),
    onWaiting: () => setStatus('loading'),
    onPlaying: () => setStatus('ready'),
    onError: () => setStatus('error'),
    onTimeUpdate: (e) => setCurrentTime(e.currentTarget.currentTime),
    onPlay: (e) => {
      exclusivePlayback.start(e.currentTarget);
      setPlaying(true);
      onPlay?.();
    },
    onPause: (e) => {
      exclusivePlayback.stop(e.currentTarget);
      setPlaying(false);
      onPause?.();
    },
    onEnded: () => {
      setPlaying(false);
      onEnded?.();
    },
  };

  return { audioRef: ref, audioProps, playing: isPlaying, currentTime, duration, status, toggle, seek, seekBy };
}
