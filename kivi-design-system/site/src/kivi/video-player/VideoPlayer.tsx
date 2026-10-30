import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactEventHandler,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../button';
import { EmptyState } from '../feedback';
import {
  composeHandlers,
  exclusivePlayback,
  useControllable,
  useFloating,
  useHoverIntent,
  useMergedRef,
  usePointerDrag,
  usePresence,
  rectOf,
} from '../hooks';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { Tag } from '../tabs-tags-avatar';
import { cx } from '../utils';
import './video-player.css';

export type VideoPlayerSize = 'sm' | 'lg';

export interface VideoPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onPlay' | 'onPause' | 'onVolumeChange' | 'onError'> {
  /** 视频地址 */
  src: string;
  /** 封面，没播的时候显示；不传就是视频首帧 */
  poster?: string;
  /** 尺寸：小放卡片里（节点、主站结果、资产、历史），大放预览弹窗，默认小 */
  size?: VideoPlayerSize;
  /** 画面完整显示，留黑边；默认铺满、居中裁切。大号默认完整 */
  fit?: boolean;
  /** 悬停播放：鼠标进来立刻静音播放，移开暂停。小号默认开 */
  hoverPlay?: boolean;
  /** 打开就播：大号默认开 */
  autoPlay?: boolean;
  /** 循环，默认开 */
  loop?: boolean;
  /** 从第几秒开始：从小号点全屏打开预览时接着放 */
  startTime?: number;
  /** 静音。传了就是受控 */
  muted?: boolean;
  /** 非受控时一开始是否静音，默认静音：悬停自动播放不能出声 */
  defaultMuted?: boolean;
  /** 点音量按钮、拖音量条到 0 时触发，参数是新的静音状态 */
  onMutedChange?: (muted: boolean) => void;
  /** 音量 0–100。传了就是受控 */
  volume?: number;
  /** 非受控时的初始音量，默认 50 */
  defaultVolume?: number;
  /** 拖音量条、按上下键时触发，参数是新的音量 */
  onVolumeChange?: (volume: number) => void;
  /** 开始播放 */
  onPlay?: ReactEventHandler<HTMLVideoElement>;
  /** 暂停 */
  onPause?: ReactEventHandler<HTMLVideoElement>;
  /** 视频加载失败（地址打不开、格式不支持）或 play() 被拒绝时触发 */
  onError?: ReactEventHandler<HTMLVideoElement>;
  /** 加载失败时显示的文字，默认「加载失败」；失败态是 EmptyState 小 · 生成失败的插图 */
  errorText?: ReactNode;
  /** 全屏按钮：小号是打开预览，不传就不显示；大号不传就是浏览器全屏 */
  onFullscreen?: (currentTime: number) => void;
}

/** 时间：不到一小时 00:03，超过 1:02:03 */
export function formatVideoTime(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ms = `${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return h ? `${h}:${ms}` : ms;
}

interface VolumeProps {
  size: VideoPlayerSize;
  /** 显示的音量：静音时是 0 */
  shown: number;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  /** 鼠标进出弹出层时告诉播放器：人还在 */
  hold: { enter: () => void; leave: () => void };
}

/** 音量：点按钮静音 / 取消静音；悬停按钮，上方弹出竖的音量条，上面写数值 */
function Volume({ size, shown, onVolumeChange, onMuteToggle, hold }: VolumeProps) {
  const pop = useHoverIntent(150);
  const { mounted, state } = usePresence(pop.inside, 150);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const icon: IconName = shown === 0 ? 'VolumeOff' : shown < 50 ? 'VolumeHalf' : 'VolumeFull';
  const drag = usePointerDrag({ axis: 'y', onMove: (r) => onVolumeChange(Math.round(r * 100)) });

  useFloating(mounted, popupRef, () => (buttonRef.current ? rectOf(buttonRef.current) : null), 'top', 4);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === 'ArrowUp' ? 10 : e.key === 'ArrowDown' ? -10 : 0;
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    onVolumeChange(Math.min(100, Math.max(0, shown + step)));
    pop.enter();
    pop.leave(1200);
  };

  return (
    <>
      <IconButton
        ref={buttonRef}
        icon={icon}
        label={shown === 0 ? '取消静音' : '静音'}
        size={size === 'lg' ? 32 : 28}
        variant="on-media-ghost"
        className="kv-video-player__button"
        onClick={onMuteToggle}
        onKeyDown={onKeyDown}
        onPointerEnter={pop.enter}
        onPointerLeave={() => pop.leave()}
      />
      {/* 挂在 body 上（全屏时挂在全屏的那个元素上），不被卡片的圆角裁掉 */}
      {mounted &&
        createPortal(
          <div
            ref={popupRef}
            className="kv-popup kv-video-player__volume-popup"
            data-state={state}
            onPointerEnter={() => {
              pop.enter();
              hold.enter();
            }}
            onPointerLeave={() => {
              pop.leave();
              hold.leave();
            }}
          >
            <div className="kv-video-player__volume-panel">
              <span className="kv-video-player__volume-value">{shown}</span>
              <div
                className="kv-video-player__volume-rail"
                role="slider"
                aria-label="音量"
                aria-orientation="vertical"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={shown}
                style={{ '--value': `${shown}%` } as CSSProperties}
                {...drag}
              >
                <span className="kv-video-player__volume-track">
                  <span className="kv-video-player__volume-fill" />
                </span>
                <span className="kv-video-player__volume-thumb" />
              </div>
            </div>
          </div>,
          document.fullscreenElement ?? document.body,
        )}
    </>
  );
}

/**
 * 视频播放器：悬停出控制条，播放、时间、音量、全屏、拖进度。
 * 小号放卡片里，不悬停时左下只有时长；大号放预览，播放中 2 秒不动控制条就藏起来。
 * 进度在控制行下面：小号贴着底边，大号浮着、带拖拽点。
 */
export const VideoPlayer = forwardRef<HTMLDivElement, VideoPlayerProps>(function VideoPlayer(
  {
    src,
    poster,
    size = 'sm',
    fit = size === 'lg',
    hoverPlay = size === 'sm',
    autoPlay = size === 'lg',
    loop = true,
    startTime,
    muted: mutedProp,
    defaultMuted = true,
    onMutedChange,
    volume: volumeProp,
    defaultVolume = 50,
    onVolumeChange,
    onPlay,
    onPause,
    onFullscreen,
    onError,
    errorText = '加载失败',
    className,
    onKeyDown,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(rootRef, ref);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useControllable(mutedProp, defaultMuted, onMutedChange);
  const [volume, setVolume] = useControllable(volumeProp, defaultVolume, onVolumeChange);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [awake, setAwake] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  // 缓冲：播着播着没数据了（waiting / stalled）；失败：加载出错或 play() 被拒
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const hover = useHoverIntent(120);
  const awakeTimer = useRef(0);
  const large = size === 'lg';
  const failedRef = useRef(false);
  failedRef.current = failed;

  // 换了视频：状态从头来
  useEffect(() => {
    setFailed(false);
    setBuffering(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  const play = useCallback(() => {
    if (failedRef.current) return;
    videoRef.current?.play().catch((err: unknown) => {
      const name = (err as { name?: string } | null)?.name;
      // 被暂停打断、浏览器不让自动播放：回到暂停，不算坏了；别的（比如格式不支持）进失败态
      if (name === 'AbortError' || name === 'NotAllowedError') {
        setPlaying(false);
        return;
      }
      setBuffering(false);
      setFailed(true);
    });
  }, []);
  const pause = useCallback(() => videoRef.current?.pause(), []);
  const toggle = () => (videoRef.current?.paused ? play() : pause());

  // 音量、静音跟着状态走
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.volume = volume / 100;
  }, [muted, volume]);

  // 悬停播放：鼠标进来立刻播（和平台一致，不等），离开就停（停在原地，不回到开头）
  useEffect(() => {
    if (!hoverPlay) return;
    if (hover.inside) play();
    else pause();
  }, [hoverPlay, hover.inside, play, pause]);

  // 播放中进度用 rAF 刷，timeupdate 一秒才 4 次，进度条会一跳一跳
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (videoRef.current) setCurrent(videoRef.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // 大号：鼠标 2 秒不动就藏控制条
  const wake = () => {
    setAwake(true);
    window.clearTimeout(awakeTimer.current);
    awakeTimer.current = window.setTimeout(() => setAwake(false), 2000);
  };
  useEffect(() => () => window.clearTimeout(awakeTimer.current), []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 卸载时如果正在播，让出「正在播的那个」
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v) exclusivePlayback.stop(v);
    };
  }, []);

  const seek = (ratio: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = Math.min(1, Math.max(0, ratio)) * duration;
    setCurrent(v.currentTime);
  };
  const progressDrag = usePointerDrag({ axis: 'x', onMove: seek, onDragChange: setDragging });

  const changeVolume = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
  };
  const toggleMute = () => {
    if (muted || volume === 0) {
      if (volume === 0) setVolume(50);
      setMuted(false);
    } else setMuted(true);
  };

  const fullscreenClick = () => {
    if (onFullscreen) return onFullscreen(videoRef.current?.currentTime ?? 0);
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };
  const showFullscreen = large || !!onFullscreen;

  // 大号键盘：空格 / K 播放暂停，M 静音，F 全屏，← → 跳 5 秒
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!large || !v || failed) return;
    const k = e.key.toLowerCase();
    // 按钮上的空格留给按钮自己
    if (k === ' ' && (e.target as HTMLElement).closest('button')) return;
    if (k === ' ' || k === 'k') toggle();
    else if (k === 'm') toggleMute();
    else if (k === 'f') fullscreenClick();
    else if (k === 'arrowleft' || k === 'arrowright') seek((v.currentTime + (k === 'arrowleft' ? -5 : 5)) / (duration || 1));
    else return;
    e.preventDefault();
    wake();
  };

  const ratio = duration ? Math.min(1, current / duration) : 0;
  const controlsOn = large ? !playing || awake || dragging : hover.inside || dragging;
  const shownVolume = muted ? 0 : volume;
  const btnSize = large ? 32 : 28;

  return (
    <div
      ref={mergedRef}
      className={cx('kv-video-player', `kv-video-player--${size}`, fit && 'kv-video-player--fit', className)}
      data-controls={controlsOn ? '' : undefined}
      data-playing={playing ? '' : undefined}
      data-buffering={buffering ? '' : undefined}
      data-failed={failed ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      tabIndex={large ? 0 : undefined}
      onKeyDown={composeHandlers(onKeyDown, handleKeyDown)}
      onPointerEnter={composeHandlers(onPointerEnter, () => {
        hover.enter();
        if (large) wake();
      })}
      onPointerLeave={composeHandlers(onPointerLeave, () => {
        hover.leave();
        if (large) setAwake(false);
      })}
      onPointerMove={composeHandlers(onPointerMove, () => {
        if (large) wake();
      })}
      {...rest}
    >
      <video
        ref={videoRef}
        className="kv-video-player__video"
        src={src}
        poster={poster}
        loop={loop}
        muted
        playsInline
        preload="auto"
        autoPlay={autoPlay}
        onClick={large ? toggle : undefined}
        onDoubleClick={large ? fullscreenClick : undefined}
        onError={(e) => {
          setBuffering(false);
          setFailed(true);
          onError?.(e);
        }}
        onWaiting={() => setBuffering(true)}
        // stalled 浏览器空闲时也会发，只有在播而且真没数据时才算缓冲
        onStalled={(e) => {
          if (!e.currentTarget.paused && e.currentTarget.readyState < 3) setBuffering(true);
        }}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onSeeked={() => setBuffering(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (startTime) e.currentTarget.currentTime = startTime;
          setCurrent(e.currentTarget.currentTime);
        }}
        onPlay={(e) => {
          exclusivePlayback.start(e.currentTarget);
          setPlaying(true);
          onPlay?.(e);
        }}
        onPause={(e) => {
          exclusivePlayback.stop(e.currentTarget);
          setPlaying(false);
          setBuffering(false);
          setCurrent(e.currentTarget.currentTime);
          onPause?.(e);
        }}
      />

      {!large && duration > 0 && !failed && (
        <Tag variant="on-media" className="kv-video-player__duration">
          {formatVideoTime(duration)}
        </Tag>
      )}

      {buffering && !failed && (
        <span className="kv-video-player__spinner" role="status" aria-label="缓冲中">
          <Icon name="Loading" size={large ? 40 : 24} spin />
        </span>
      )}

      {failed && (
        <div className="kv-video-player__status" role="alert">
          <EmptyState scene="failed" size="sm" title={errorText} />
        </div>
      )}

      {/* 不让外面（比如画布）把控制条上的按下当成拖节点。失败了就不放控制条 */}
      {!failed && (
        <div className="kv-video-player__controls" onPointerDown={(e) => e.stopPropagation()}>
          <div
            className="kv-video-player__progress"
            role="slider"
            tabIndex={0}
            aria-label="播放进度"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatVideoTime(current)} / ${formatVideoTime(duration)}`}
            style={{ '--value': `${ratio * 100}%` } as CSSProperties}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              e.preventDefault();
              e.stopPropagation();
              seek((current + (e.key === 'ArrowLeft' ? -5 : 5)) / (duration || 1));
            }}
            {...progressDrag}
          >
            <span className="kv-video-player__track">
              <span className="kv-video-player__played" />
            </span>
            <span className="kv-video-player__thumb" />
          </div>

          <div className="kv-video-player__bar">
            <IconButton
              icon={playing ? 'Pause' : 'Play'}
              label={playing ? '暂停' : '播放'}
              size={btnSize}
              variant="on-media-ghost"
              className="kv-video-player__button"
              onClick={toggle}
            />
            <span className="kv-video-player__time">
              {formatVideoTime(current)}
              <span className="kv-video-player__total"> / {formatVideoTime(duration)}</span>
            </span>
            <span className="kv-video-player__spacer" />
            <Volume
              size={size}
              shown={shownVolume}
              onVolumeChange={changeVolume}
              onMuteToggle={toggleMute}
              hold={{ enter: hover.enter, leave: () => hover.leave() }}
            />
            {showFullscreen && (
              <IconButton
                icon={fullscreen ? 'Fold' : 'FullScreen'}
                label={fullscreen ? '退出全屏' : large ? '全屏' : '预览'}
                size={btnSize}
                variant="on-media-ghost"
                className="kv-video-player__button"
                onClick={fullscreenClick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});
VideoPlayer.displayName = 'VideoPlayer';
