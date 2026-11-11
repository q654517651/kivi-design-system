import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Image } from '../media/Image';
import { Tag } from '../tags-avatar/Tag';
import { cx } from '../utils';
import './explore.css';

export interface ExploreCoverProps extends HTMLAttributes<HTMLDivElement> {
  /** 封面图。有视频时是视频没播时的那一帧（poster） */
  src?: string;
  /** 封面视频：单独配置的，不是发布内容本身。有就悬停在封面上开始播（静音、循环），移开停下、回到封面 */
  video?: string;
  /** 视频左下角显示剩余时间（Tag 浮层，离边 8），没播时是总时长，播起来倒数（案例示例、工作流要，照需求「主帧-首页」） */
  showTime?: boolean;
  /** 播不播（受控）：卡片上盖着别的东西（整张卡的点击层、按钮）时，由卡片按自己的悬停传进来。不传就看封面自己的悬停 */
  playing?: boolean;
  /** 盖在封面上的东西，比如角标、按钮 */
  children?: ReactNode;
}

/** 秒 → m:ss */
const clock = (s: number) => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * 探索页卡片的封面：图片，或者「封面图 + 封面视频」。视频悬停才播，不出进度条、不能拖、不能快进；
 * 移开停下回到开头、露出封面图。大小铺满外面（外面定比例）
 */
export const ExploreCover = forwardRef<HTMLDivElement, ExploreCoverProps>(function ExploreCover(
  { src, video, showTime, playing, className, children, onPointerEnter, onPointerLeave, ...rest },
  ref,
) {
  const el = useRef<HTMLVideoElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const on = playing ?? hovered;

  // 播：从开头静音循环；停：暂停、回到开头、露出封面图，时间回到总时长
  useEffect(() => {
    const v = el.current;
    if (!v) return;
    if (on) {
      void v.play().catch(() => {});
      return;
    }
    v.pause();
    // 播过就重新加载：回到开头、重新露出封面图（只拨回 0 秒会停在第一帧上）
    if (v.currentTime > 0) v.load();
  }, [on]);
  return (
    <div
      ref={ref}
      className={cx('kv-explore-cover', className)}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        setHovered(true);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        setHovered(false);
      }}
      {...rest}
    >
      {video ? (
        <video
          ref={el}
          className="kv-explore-cover__media"
          src={video}
          poster={src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onLoadedMetadata={(e) => setLeft(e.currentTarget.duration)}
          onTimeUpdate={(e) => setLeft(e.currentTarget.duration - e.currentTarget.currentTime)}
        />
      ) : (
        <Image className="kv-explore-cover__media" src={src} alt="" />
      )}
      {video && showTime && left !== null && Number.isFinite(left) && (
        <span className="kv-explore-cover__time">
          <Tag variant="on-media">{clock(left)}</Tag>
        </span>
      )}
      {children}
    </div>
  );
});
ExploreCover.displayName = 'ExploreCover';
