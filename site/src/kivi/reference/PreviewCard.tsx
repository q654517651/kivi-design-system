import { forwardRef, useEffect, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { usePointerDrag, useAudioPlayer } from '../hooks';
import { Popover } from '../tooltip';
import { AssetThumb } from '../tags-avatar';
import { cx } from '../utils';
import { fileIcon } from './fileIcon';
import './reference.css';

export type PreviewCardType = 'image' | 'video' | 'audio' | 'file';

/** 标注框：相对 160 见方的预览图，四个值都是 0–1 的比例 */
export interface PreviewCardBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreviewCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 类型：图片 / 视频 / 音频 / 文件，默认图片。图片、视频是 160 见方的大图；音频、文件是缩略图加两行字 */
  type?: PreviewCardType;
  /** 图片、视频：大图地址（视频传封面）。音频：音频地址，传了就能在卡片里播放 */
  src?: string;
  /** 名字，比如「图片1」「产品演示.mp4」，一行，超出省略 */
  name?: ReactNode;
  /** 说明：12 号 tertiary，最多 4 行。标注点的描述写这里 */
  description?: ReactNode;
  /** 时长，视频、音频用，比如「0:12」 */
  duration?: ReactNode;
  /** 文件扩展名，文件用，比如「PDF」 */
  ext?: ReactNode;
  /** 标注框：在大图上画 1.5px 品牌色的框，标注点的预览用 */
  box?: PreviewCardBox;
}

/**
 * 悬停预览卡的内容：附件条、参考图、输入框里的引用标签、标注点悬停时看大图、类型、详情用同一个。
 * 只是内容，不带底；悬停出预览一律用下面的 `PreviewPopover`，别自己再包 Popover。
 */
export const PreviewCard = forwardRef<HTMLDivElement, PreviewCardProps>(function PreviewCard(
  { type = 'image', src, name, description, duration, ext, box, className, ...rest },
  ref,
) {
  const big = type === 'image' || type === 'video';
  if (type === 'audio' && src) {
    return <AudioRow ref={ref} src={src} name={name} description={description} duration={duration} className={className} {...rest} />;
  }
  const boxStyle: CSSProperties | undefined = box
    ? { left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }
    : undefined;
  return (
    <div ref={ref} className={cx('kv-preview-card', big ? 'kv-preview-card--big' : 'kv-preview-card--row', className)} {...rest}>
      {big ? (
        <div className="kv-preview-card__media">
          {src && <img src={src} alt="" />}
          {boxStyle && <span className="kv-preview-card__box" style={boxStyle} />}
          {type === 'video' && duration && <span className="kv-preview-card__duration">{duration}</span>}
        </div>
      ) : (
        <AssetThumb size={56} type="icon" icon={type === 'audio' ? 'Music' : fileIcon(ext)} />
      )}
      {(name != null || description != null || (!big && (duration || ext))) && (
        <div className="kv-preview-card__text">
          {name != null && <div className="kv-preview-card__name">{name}</div>}
          {!big && (duration || ext) && <div className="kv-preview-card__meta">{duration ?? ext}</div>}
          {description != null && <div className="kv-preview-card__description">{description}</div>}
        </div>
      )}
    </div>
  );
});
PreviewCard.displayName = 'PreviewCard';

/** 秒 → 「0:36」 */
const clock = (sec: number) => {
  const t = Math.max(0, Math.floor(sec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

type AudioRowProps = Omit<PreviewCardProps, 'type' | 'ext' | 'box'> & { src: string };

/**
 * 音频预览卡：照线上（ai-chat AudioHoverCard）能播。56 缩略图就是播放按钮：平时音符，悬停、播放中换成播放 / 暂停；
 * 第二行平时是时长，播过之后是「已播 / 总长」；下面一条细进度条，点、拖跳到那里，方向键前后 5 秒。
 * 同一时间只播一个（useAudioPlayer 走 exclusivePlayback），卡片收起（卸载）就停。
 */
const AudioRow = forwardRef<HTMLDivElement, AudioRowProps>(function AudioRow(
  { src, name, description, duration: durationText, className, ...rest },
  ref,
) {
  const { audioRef, audioProps, playing, currentTime, duration, status, toggle, seek, seekBy } = useAudioPlayer({ src });
  useEffect(() => {
    const el = audioRef.current;
    return () => el?.pause();
  }, [audioRef]);

  const failed = status === 'error';
  const started = playing || currentTime > 0;
  const total = duration > 0 ? clock(duration) : durationText;
  const ratio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const drag = usePointerDrag({ disabled: !(duration > 0), onMove: (r) => seek(r * duration) });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (step != null) seekBy(step);
    else if (e.key === 'Home') seek(0);
    else if (e.key === 'End') seek(duration);
    else return;
    e.preventDefault();
  };
  const label = typeof name === 'string' ? name : '音频';

  return (
    <div ref={ref} className={cx('kv-preview-card', 'kv-preview-card--row', className)} {...rest}>
      <audio ref={audioRef} {...audioProps} />
      <button
        type="button"
        className="kv-preview-card__play"
        aria-label={playing ? `暂停 ${label}` : `播放 ${label}`}
        aria-pressed={playing}
        disabled={failed}
        data-active={started || undefined}
        onClick={toggle}
      >
        <AssetThumb size={56} type="icon" icon="Music" />
        <span className="kv-preview-card__play-icon" aria-hidden="true">
          {playing && status === 'loading' ? <Icon name="Loading" className="kv-icon--spin" /> : <Icon name={playing ? 'Pause' : 'Play'} />}
        </span>
      </button>
      <div className="kv-preview-card__text kv-preview-card__text--audio">
        {name != null && <div className="kv-preview-card__name">{name}</div>}
        <div className="kv-preview-card__meta">{failed ? '加载失败' : started ? `${clock(currentTime)} / ${total ?? '—'}` : total}</div>
        <div
          className="kv-preview-card__progress"
          role="slider"
          tabIndex={failed ? -1 : 0}
          aria-label={`${label}播放进度`}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${clock(currentTime)} / ${total ?? ''}`}
          aria-disabled={failed || undefined}
          style={{ '--value': `${ratio * 100}%` } as CSSProperties}
          onKeyDown={onKeyDown}
          {...drag}
        >
          <span className="kv-preview-card__track">
            <span className="kv-preview-card__played" />
          </span>
        </div>
        {description != null && <div className="kv-preview-card__description">{description}</div>}
      </div>
    </div>
  );
});
AudioRow.displayName = 'PreviewCardAudio';

export interface PreviewPopoverProps {
  /** 预览卡的内容：类型、大图、名字、时长、扩展名、说明、标注框，同 PreviewCard */
  preview: Omit<PreviewCardProps, keyof HTMLAttributes<HTMLDivElement>> & { description?: ReactNode };
  /** 不出预览：上传中、没有图的时候 */
  disabled?: boolean;
  /** 触发元素：缩略图、引用标签、标注点 */
  children: ReactElement;
}

/**
 * 悬停预览：所有素材的悬停预览都用它，样子和时机只写这一份（11-04 用户定统一）。
 * 玻璃底（Popover panel），在触发元素上方、左对齐，间距 8，悬停 200ms 出现，鼠标能挪进卡片里。
 * 用在参考区、附件条（含画布生成面板的参考图）、标注标签。
 * 不转发 ref：它只是把 Popover 和 PreviewCard 拼在一起，ref 由 children（触发元素）自己带。
 */
export function PreviewPopover({ preview, disabled, children }: PreviewPopoverProps) {
  return (
    <Popover variant="panel" placement="top-start" offset={8} disabled={disabled} content={<PreviewCard {...preview} />}>
      {children}
    </Popover>
  );
}
PreviewPopover.displayName = 'PreviewPopover';
