import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ButtonGroup, IconButton } from '../button';
import { EmptyState } from '../feedback';
import { GeneratingDots } from '../generating';
import { useControllable } from '../hooks';
import type { IconName } from '../icons';
import { Tooltip } from '../menus-tooltip';
import { Tag } from '../tabs-tags-avatar';
import { cx } from '../utils';
import { VideoPlayer } from '../video-player';
import './main-site.css';

export type ResultTileType = 'image' | 'video';
export type ResultTileStatus = 'done' | 'loading' | 'failed';

export interface ResultTileAction {
  /** 图标 */
  icon: IconName;
  /** 说明，读屏和 Tooltip 用 */
  label: string;
  onClick?: () => void;
}

export interface ResultTileProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：图片 / 视频，默认图片。视频用 VideoPlayer 小号播：左下是时长，悬停出控制条 */
  type?: ResultTileType;
  /** 状态：完成 / 生成中 / 失败，默认完成。悬停由鼠标触发，操作才出现 */
  status?: ResultTileStatus;
  /** 内容地址：图片是图片，视频是视频文件。生成中传了就是「有原素材」（重新生成）：原素材 + 黑 40% 遮罩 + 背景模糊，上面叠点阵动效；不传（第一次生成）没有遮罩 */
  src?: string;
  /** 视频封面，没播时显示；不传是首帧。生成中有原素材的视频优先用它垫底 */
  poster?: string;
  /** 比例和格子不一致时画面完整显示，留底色；默认铺满（居中裁切） */
  fit?: boolean;
  /** 任务角标文字，左上，Tag 覆盖。生成中用，比如「59s 生成中」 */
  badge?: ReactNode;
  /** 右上操作：删除、下载，合成一条按钮条（IconButton 28 · 文字），带 Tooltip。悬停才出；失败的格子也有（还能删除） */
  topActions?: ResultTileAction[];
  /** 完成：右上按钮条最后放收藏（Collect，收藏了换 CollectSolid，绿色）。收藏了的，不悬停右上还留一个绿星 */
  collect?: boolean;
  /** 完成：收藏了没有 */
  collected?: boolean;
  /** 完成：一开始收藏了没有，不受控时用 */
  defaultCollected?: boolean;
  /** 完成：点了收藏 */
  onCollectedChange?: (collected: boolean) => void;
  /** 左下快捷操作，合成一条按钮条，最后一个是「更多」。悬停才出；视频会抬到控制条上面 */
  quickActions?: ResultTileAction[];
  /** 视频右下「预览」：打开大号预览，参数是播到第几秒。不传就没有这个按钮 */
  onPreview?: (currentTime: number) => void;
  /** 失败时的文字，默认「生成失败，消耗猕猴桃已退回」 */
  failedText?: ReactNode;
}

function Actions({ list, position, extra }: { list?: ResultTileAction[]; position: 'top' | 'quick'; extra?: ReactNode }) {
  if (!list?.length && !extra) return null;
  return (
    <ButtonGroup
      className={`kv-result-tile__actions kv-result-tile__actions--${position}`}
      aria-label={position === 'top' ? '操作' : '快捷操作'}
    >
      {list?.map((a) => (
        <Tooltip key={a.icon} content={a.label}>
          <IconButton icon={a.icon} label={a.label} onClick={a.onClick} />
        </Tooltip>
      ))}
      {extra}
    </ButtonGroup>
  );
}

/** 主站生成结果的一格：一条记录里的一张图或一段视频，每格任务独立。Figma「主站」页 ResultTile */
export const ResultTile = forwardRef<HTMLDivElement, ResultTileProps>(function ResultTile(
  {
    type = 'image',
    status = 'done',
    src,
    poster,
    fit,
    badge,
    topActions,
    collect,
    collected: collectedProp,
    defaultCollected = false,
    onCollectedChange,
    quickActions,
    onPreview,
    failedText = '生成失败，消耗猕猴桃已退回',
    className,
    children,
    ...rest
  },
  ref,
) {
  const [collected, setCollected] = useControllable(collectedProp, defaultCollected, onCollectedChange);
  const cls = cx('kv-result-tile', type === 'video' && 'kv-result-tile--video', fit && 'kv-result-tile--fit', className);

  if (status === 'loading') {
    return (
      <div ref={ref} className={cls} aria-busy="true" {...rest}>
        {src && (
          <>
            {type === 'image' ? (
              <img className="kv-result-tile__media" src={src} alt="" />
            ) : (
              // 视频原素材：不播放，只露封面或首帧
              <video className="kv-result-tile__media" src={src} poster={poster} muted playsInline preload="metadata" aria-hidden />
            )}
            <div className="kv-result-tile__mask" />
          </>
        )}
        <GeneratingDots type={type} />
        {badge != null && (
          <span className="kv-result-tile__badge">
            <Tag variant="on-media">{badge}</Tag>
          </span>
        )}
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div ref={ref} className={cls} aria-invalid="true" tabIndex={topActions?.length ? 0 : undefined} {...rest}>
        <EmptyState scene="failed" size="sm" title={failedText} />
        <Actions list={topActions} position="top" />
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={cls} tabIndex={0} {...rest}>
      {src && type === 'image' && <img className="kv-result-tile__media" src={src} alt="" />}
      {src && type === 'video' && <VideoPlayer src={src} poster={poster} fit={fit} onFullscreen={onPreview} />}
      <Actions
        list={topActions}
        position="top"
        extra={
          collect && (
            <Tooltip content={collected ? '取消收藏' : '收藏'}>
              <IconButton
                icon={collected ? 'CollectSolid' : 'Collect'}
                label={collected ? '取消收藏' : '收藏'}
                selected={collected}
                onClick={() => setCollected(!collected)}
              />
            </Tooltip>
          )
        }
      />
      {/* 收藏了、不悬停：右上只留一个绿星，悬停时换成整条。只是标记，点不到（鼠标一移上去就是整条） */}
      {collect && collected && (
        <ButtonGroup className="kv-result-tile__pin" aria-hidden>
          <IconButton icon="CollectSolid" label="已收藏" selected tabIndex={-1} />
        </ButtonGroup>
      )}
      <Actions list={quickActions} position="quick" />
      {children}
    </div>
  );
});
ResultTile.displayName = 'ResultTile';
