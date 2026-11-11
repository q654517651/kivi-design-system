import { forwardRef, useRef, useState, type HTMLAttributes } from 'react';
import { ExploreCover } from './ExploreCover';
import { ButtonGroup, IconButton } from '../button';
import { useControllable } from '../hooks';
import { Avatar } from '../tags-avatar/Avatar';
import { cx } from '../utils';
import './explore.css';

export type WorkCardType = 'image' | 'video';

export interface WorkCardAuthor {
  /** 用户名 */
  name: string;
  /** 头像地址，没有就显示首字 */
  avatar?: string;
}

export interface WorkCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：图片 / 视频，默认图片。视频静音循环，悬停开始播、移开停下回到开头（照线上） */
  type?: WorkCardType;
  /** 图片地址，或视频文件 */
  src: string;
  /** 视频封面，没播时显示 */
  poster?: string;
  /** 宽高比：`'3:4'` 这样的字符串或宽 / 高的数字，卡片高度跟着它，默认 1:1 */
  ratio?: string | number;
  /** 说明这张作品是什么，读屏用，比如提示词 */
  title?: string;
  /** 作者：悬停时底部左边头像 16 + 用户名 */
  author: WorkCardAuthor;
  /** 点赞数，悬停时底部右边。点赞了自己加 1（不受控时） */
  likes?: number;
  /** 点赞了没有（受控） */
  liked?: boolean;
  /** 一开始点赞了没有（不受控），likes 里已经算上了这一个 */
  defaultLiked?: boolean;
  /** 点赞、取消点赞 */
  onLikedChange?: (liked: boolean) => void;
  /** 收藏了没有（受控）。收藏了，不悬停右上也留一颗实心星 */
  collected?: boolean;
  /** 一开始收藏了没有（不受控） */
  defaultCollected?: boolean;
  /** 收藏、取消收藏 */
  onCollectedChange?: (collected: boolean) => void;
  /** 右上「下载」 */
  onDownload?: () => void;
  /** 点卡片：打开详情 */
  onOpen?: () => void;
}

/**
 * 作品卡：发现页瀑布流里的一张作品。照线上 CardItem：平时只有画面；悬停右上出下载、收藏，
 * 底部渐变上左边作者、右边点赞。视频悬停才播。整张卡点了打开详情
 */
export const WorkCard = forwardRef<HTMLDivElement, WorkCardProps>(function WorkCard(
  {
    type = 'image',
    src,
    poster,
    ratio = 1,
    title,
    author,
    likes = 0,
    liked: likedProp,
    defaultLiked = false,
    onLikedChange,
    collected: collectedProp,
    defaultCollected = false,
    onCollectedChange,
    onDownload,
    onOpen,
    className,
    style,
    onPointerEnter,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const [liked, setLiked] = useControllable(likedProp, defaultLiked, onLikedChange);
  const [collected, setCollected] = useControllable(collectedProp, defaultCollected, onCollectedChange);
  // 不受控时自己算数：比一开始多赞了就 +1，取消了就 -1
  const initialLiked = useRef(likedProp ?? defaultLiked);
  const count = likedProp === undefined ? likes + (liked === initialLiked.current ? 0 : liked ? 1 : -1) : likes;
  // 悬停整张卡就播（卡上盖着点击层和按钮，封面自己收不到悬停）
  const [hovered, setHovered] = useState(false);
  const aspect = typeof ratio === 'number' ? String(ratio) : ratio.replace(':', ' / ');

  return (
    <div
      ref={ref}
      className={cx('kv-work-card', className)}
      style={{ aspectRatio: aspect, ...style }}
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
      <ExploreCover className="kv-work-card__cover" src={type === 'video' ? poster : src} video={type === 'video' ? src : undefined} playing={hovered} />
      {/* 整张卡是一个按钮：点了打开详情。操作盖在它上面 */}
      <button type="button" className="kv-work-card__open" aria-label={title ? `查看作品：${title}` : '查看作品'} onClick={onOpen} />
      <ButtonGroup className="kv-work-card__actions" aria-label="操作">
        <IconButton icon="Download" label="下载" onClick={onDownload} />
        <IconButton
          icon={collected ? 'CollectSolid' : 'Collect'}
          label={collected ? '取消收藏' : '收藏'}
          selected={collected}
          data-collected={collected || undefined}
          onClick={() => setCollected(!collected)}
        />
      </ButtonGroup>
      {/* 收藏了、不悬停：右上只留一颗实心星，悬停时换成整条（和 ResultTile 一样） */}
      {collected && (
        <ButtonGroup className="kv-work-card__pin" aria-hidden>
          <IconButton icon="CollectSolid" label="已收藏" selected data-collected tabIndex={-1} />
        </ButtonGroup>
      )}
      <div className="kv-work-card__footer">
        <span className="kv-work-card__author">
          <Avatar name={author.name} src={author.avatar} size={16} />
          <span className="kv-work-card__name">{author.name}</span>
        </span>
        <span className="kv-work-card__like">
          <IconButton
            icon={liked ? 'ThumbsUpFill' : 'ThumbsUp'}
            label={liked ? '取消点赞' : '点赞'}
            variant="on-media-ghost"
            size={28}
            tooltip={false}
            onClick={() => setLiked(!liked)}
          />
          <span className="kv-work-card__count">{count}</span>
        </span>
      </div>
    </div>
  );
});
WorkCard.displayName = 'WorkCard';
