import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { useAudioPlayer } from '../hooks';
import { cx } from '../utils';
import { VideoPlayer } from '../video-player';
import { AudioWave } from './AudioWave';
import './canvas.css';

export type NodeMediaType = 'image' | 'video' | 'audio' | 'text';

export interface NodeMediaProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：图片 / 视频 / 音频 / 文字，默认图片 */
  type?: NodeMediaType;
  /** 内容地址：图片是图片，视频是视频文件，音频是音频文件（mp4 也行，播它的声音）。视频用 VideoPlayer 小号播，时长、播放、音量、进度都在里面；音频用 <audio> 播，同一时间只播一个 */
  src?: string;
  /** 视频封面，没播时显示；不传是首帧 */
  poster?: string;
  /** 视频右下「预览」：打开大号预览，参数是播到第几秒。不传就没有这个按钮 */
  onPreview?: (currentTime: number) => void;
  /** 时间：音频没传 src 时的静态外观，默认「00:08 / 00:08」；有 src 时以真实播放为准 */
  time?: string;
  /** 播放进度：音频没传 src 时的静态外观，0–100，默认 49；有 src 时以真实播放为准 */
  progress?: number;
  /** 音频播放中。传了就是受控 */
  playing?: boolean;
  /** 音频非受控时一开始是否在播（浏览器可能拦自动播放，拦了就回到暂停） */
  defaultPlaying?: boolean;
  /** 音频播放、暂停变了，参数是新的状态 */
  onPlayingChange?: (playing: boolean) => void;
  /** 音频开始播放 */
  onPlay?: () => void;
  /** 音频暂停 */
  onPause?: () => void;
  /** 音频播完 */
  onEnded?: () => void;
  /** 音频波形每条竖条的高度，默认是 Figma 里画好的 72 条，见 AudioWave */
  bars?: number[];
  /** 正文：文字类型用，超出的裁掉 */
  children?: ReactNode;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** 秒 → 「00:08」 */
const clock = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(Math.floor(sec % 60))}`;

/** 节点完成态里的内容，放进 NodeCard 用。Figma「画布」页 NodeMedia */
export const NodeMedia = forwardRef<HTMLDivElement, NodeMediaProps>(function NodeMedia(
  {
    type = 'image',
    src,
    poster,
    onPreview,
    time,
    progress,
    bars,
    playing,
    defaultPlaying,
    onPlayingChange,
    onPlay,
    onPause,
    onEnded,
    className,
    children,
    ...rest
  },
  ref,
) {
  const cls = cx('kv-node-media', `kv-node-media--${type}`, className);
  // 只有音频用：没有音频地址时不挂 <audio>，播放逻辑空转
  const isAudio = type === 'audio';
  const player = useAudioPlayer({
    src: isAudio ? src : undefined,
    playing,
    defaultPlaying,
    onPlayingChange,
    onPlay,
    onPause,
    onEnded,
  });

  if (type === 'text') {
    return (
      <div ref={ref} className={cls} {...rest}>
        {children}
      </div>
    );
  }

  if (isAudio) {
    const live = !!src;
    const { status, duration, currentTime } = player;
    const shown = live ? (duration > 0 ? (currentTime / duration) * 100 : 0) : (progress ?? 49);
    const clockText = `${clock(currentTime)} / ${clock(duration)}`;
    const failed = live && status === 'error';
    // 有 src：加载中、失败、正常；没 src：静态外观
    const timeText = !live
      ? (time ?? '00:08 / 00:08')
      : failed
        ? '加载失败'
        : duration > 0
          ? clockText
          : status === 'loading'
            ? '加载中…'
            : clockText;
    return (
      <div
        ref={ref}
        className={cls}
        data-status={live ? status : undefined}
        aria-busy={live && status === 'loading' ? true : undefined}
        {...rest}
      >
        {live && <audio ref={player.audioRef} {...player.audioProps} />}
        <div className="kv-node-media__wave">
          <AudioWave
            progress={shown}
            bars={bars}
            disabled={!live || failed || duration <= 0}
            valueText={clockText}
            // 方向键一次快进、快退 5 秒
            step={duration > 0 ? Math.min(100, (5 / duration) * 100) : 5}
            onProgressChange={live ? (v) => player.seek((v / 100) * duration) : undefined}
          />
        </div>
        <div className="kv-node-media__controls">
          <span className="kv-node-media__time" data-failed={failed ? '' : undefined}>
            {timeText}
          </span>
          <IconButton
            icon={player.playing ? 'Pause' : 'Play'}
            label={player.playing ? '暂停' : '播放'}
            size={32}
            variant="secondary"
            className="kv-node-media__play"
            disabled={failed}
            onClick={player.toggle}
          />
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div ref={ref} className={cls} {...rest}>
        {src && <VideoPlayer src={src} poster={poster} onFullscreen={onPreview} />}
      </div>
    );
  }

  return (
    <div ref={ref} className={cls} {...rest}>
      <img className="kv-node-media__picture" src={src} alt="" />
    </div>
  );
});
NodeMedia.displayName = 'NodeMedia';
