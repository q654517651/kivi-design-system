import { forwardRef, useState, type HTMLAttributes } from 'react';
import { Avatar } from '../tags-avatar/Avatar';
import { cx } from '../utils';
import { ExploreCover } from './ExploreCover';
import './explore.css';

export interface ExploreCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 标题，一行省略 */
  name: string;
  /** 说明，最多两行、超出省略，不够两行也占两行高（技能用）。不传就没有这一行（创作精选、工作流） */
  description?: string;
  /** 封面图（必填）：单独配置的横屏封面，不是发布内容本身。有视频时是视频没播时的那一帧。技能公开时必须有封面（11-10 用户定） */
  cover: string;
  /** 封面视频：悬停整张卡开始播（静音循环），移开停下回到封面 */
  video?: string;
  /** 视频左下显示剩余时间（创作精选、工作流要，技能不要） */
  showTime?: boolean;
  /** 作者：头像 16 + 名字，不传就没有这一行。官方的传 KIVI（卡上不挂「官方」标签，11-10 用户定） */
  author?: { name: string; avatar?: string };
  /** 点卡片：打开详情或预览 */
  onOpen?: () => void;
}

/**
 * 探索卡：探索页「创作精选」「技能」「工作流」里的一项，三处一套结构（11-10 用户定）。
 * 一个容器：上面横屏封面（图或视频），下面标题、说明（技能才有）、作者。整张卡点了打开
 */
export const ExploreCard = forwardRef<HTMLDivElement, ExploreCardProps>(function ExploreCard(
  { name, description, cover, video, showTime, author, onOpen, className, onPointerEnter, onPointerLeave, ...rest },
  ref,
) {
  // 悬停整张卡就播封面视频（卡上盖着点击层，封面自己收不到悬停）
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      className={cx('kv-explore-card', className)}
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
      {/* 整张卡是一个按钮：点了打开 */}
      <button type="button" className="kv-explore-card__open" aria-label={`查看 ${name}`} onClick={onOpen} />
      <ExploreCover className="kv-explore-card__cover" src={cover} video={video} showTime={showTime} playing={hovered} />
      <div className="kv-explore-card__body">
        <span className="kv-explore-card__name" title={name}>
          {name}
        </span>
        {description !== undefined && <span className="kv-explore-card__desc">{description}</span>}
        {author && (
          <span className="kv-explore-card__author">
            <Avatar name={author.name} src={author.avatar} size={16} />
            <span className="kv-explore-card__author-name">{author.name}</span>
          </span>
        )}
      </div>
    </div>
  );
});
ExploreCard.displayName = 'ExploreCard';
