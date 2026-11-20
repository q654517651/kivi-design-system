import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { ButtonGroup, IconButton } from '../button';
import { EmptyState, GENERATION_FAILED_TITLE } from '../feedback';
import { GeneratingDots } from '../generating';
import { useControllable, useMergedRef } from '../hooks';
import type { IconName } from '../icons';
import { Tag } from '../tags-avatar';
import { cx } from '../utils';
import { Image, VideoPlayer } from '../media';
import { NodeMedia } from '../canvas/NodeMedia';
import './main-site.css';

export type ResultTileType = 'image' | 'video' | 'audio';
export type ResultTileStatus = 'done' | 'generating' | 'failed';

export interface ResultTileAction {
  /** 图标 */
  icon: IconName;
  /** 说明，读屏和 Tooltip 用 */
  label: string;
  /** 点了。带上事件，要从按钮弹菜单（比如「更多」）时拿它的位置 */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface ResultTileProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：图片 / 视频 / 音频，默认图片。视频用 VideoPlayer 卡片播：左下是时长，悬停出控制条；音频和画布音频节点同一块（NodeMedia 音频：波形、时间、播放），不放快捷操作 */
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
  /** 右上操作：删除、下载，合成一条按钮条（IconButton 28 · 无底），带 Tooltip。悬停才出；失败的格子也有（还能删除） */
  topActions?: ResultTileAction[];
  /** 完成：右上按钮条最后放收藏（Collect，收藏了换 CollectSolid，IconButton 选中：白底 + 白图标）。收藏了的，不悬停右上还留一个实心星 */
  collect?: boolean;
  /** 完成：收藏了没有 */
  collected?: boolean;
  /** 完成：一开始收藏了没有，不受控时用 */
  defaultCollected?: boolean;
  /** 完成：点了收藏 */
  onCollectedChange?: (collected: boolean) => void;
  /** 右下快捷操作，合成一条按钮条，最后一个是「更多」。悬停才出；视频会抬到控制条上面 */
  quickActions?: ResultTileAction[];
  /** 视频右下「预览」：打开预览，参数是播到第几秒。不传就没有这个按钮 */
  onPreview?: (currentTime: number) => void;
  /** 失败：标题，默认「生成失败，消耗猕猴桃已退回」。失败态就是 EmptyState 生成失败 · 96，和节点、生成结果组一样 */
  failedTitle?: ReactNode;
  /** 失败：副标题，默认没有 */
  failedDescription?: ReactNode;
}

function Actions({ list, position, extra }: { list?: ResultTileAction[]; position: 'top' | 'quick'; extra?: ReactNode }) {
  if (!list?.length && !extra) return null;
  return (
    <ButtonGroup
      className={`kv-result-tile__actions kv-result-tile__actions--${position}`}
      aria-label={position === 'top' ? '操作' : '快捷操作'}
    >
      {list?.map((a) => (
        <IconButton key={a.icon} icon={a.icon} label={a.label} onClick={a.onClick} />
      ))}
      {extra}
    </ButtonGroup>
  );
}

/** 生成完成后，生成中那层淡出用多久：和 main-site.css 里 --motion-duration-300 一致，只用来兜底 */
const LEAVE_MS = 300;
/** 等结果图加载最多等多久，过了也淡出（露出的是骨架屏） */
const LEAVE_WAIT_MS = 4000;

/** 主站生成结果的一格：一条记录里的一张图或一段视频，每格任务独立。Figma「生成记录」页 ResultTile */
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
    failedTitle = GENERATION_FAILED_TITLE,
    failedDescription,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [collected, setCollected] = useControllable(collectedProp, defaultCollected, onCollectedChange);
  const cls = cx('kv-result-tile', type !== 'image' && `kv-result-tile--${type}`, fit && 'kv-result-tile--fit', className);

  // 生成中 → 完成：生成中那层（连同当时的原素材）留在上面盖着，结果图加载好再淡出，露出下面的图，不跳变（11-18 用户定）
  const prev = useRef({ status, src, poster });
  const [leaving, setLeaving] = useState<{ src?: string; poster?: string; out: boolean } | null>(null);
  const mediaRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRootRef = useMergedRef(ref, rootRef);
  useLayoutEffect(() => {
    if (prev.current.status === 'generating' && status === 'done') setLeaving({ src: prev.current.src, poster: prev.current.poster, out: false });
    else if (status !== 'done') setLeaving(null);
    prev.current = { status, src, poster };
  }, [status, src, poster]);
  const fadeOut = () => setLeaving((l) => (l && !l.out ? { ...l, out: true } : l));
  useEffect(() => {
    if (!leaving || leaving.out) return;
    // 兜底：等不到 load / 首帧（加载失败）也撤，露出的是骨架屏或失败态
    const t = window.setTimeout(fadeOut, LEAVE_WAIT_MS);
    if (type === 'image') {
      // 图片已经在缓存里（不会再来 load）直接走，否则等 Image 的 onLoad
      if (mediaRef.current?.complete) fadeOut();
      return () => window.clearTimeout(t);
    }
    // 视频：等首帧（loadeddata）。媒体事件不冒泡，在根上用捕获接；生成中那层的原素材视频不算
    const root = rootRef.current;
    const ready = root?.querySelector<HTMLVideoElement>('video:not(.kv-result-tile__leaving video)');
    if (ready && ready.readyState >= 2) fadeOut();
    const onData = (e: Event) => {
      if (e.target instanceof Element && !e.target.closest('.kv-result-tile__leaving')) fadeOut();
    };
    root?.addEventListener('loadeddata', onData, true);
    return () => {
      window.clearTimeout(t);
      root?.removeEventListener('loadeddata', onData, true);
    };
  }, [leaving, type]);
  // 淡出结束撤掉；transitionend 不来（减少动态效果、后台标签页）按时长兜底
  useEffect(() => {
    if (!leaving?.out) return;
    const t = window.setTimeout(() => setLeaving(null), LEAVE_MS + 100);
    return () => window.clearTimeout(t);
  }, [leaving?.out]);

  // 生成中的样子：有原素材时原素材 + 遮罩，上面点阵。生成完成那一下它留在上面，等结果加载好再淡出
  const generatingLayer = (from: { src?: string; poster?: string }) => (
    <>
      {from.src && (
        <>
          {type === 'image' ? (
            <img className="kv-result-tile__media" src={from.src} alt="" />
          ) : (
            // 视频原素材：不播放，只露封面或首帧
            <video className="kv-result-tile__media" src={from.src} poster={from.poster} muted playsInline preload="metadata" aria-hidden />
          )}
          <div className="kv-result-tile__mask" />
        </>
      )}
      <GeneratingDots type={type} />
    </>
  );

  if (status === 'generating') {
    return (
      <div ref={ref} className={cls} aria-busy="true" {...rest}>
        {generatingLayer({ src, poster })}
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
        <EmptyState type="failed" size={96} title={failedTitle} description={failedDescription} />
        <Actions list={topActions} position="top" />
        {children}
      </div>
    );
  }

  return (
    <div ref={mergedRootRef} className={cls} tabIndex={0} {...rest}>
      {/* 图片：加载中骨架屏，加载完淡入（Image） */}
      {src && type === 'image' && <Image ref={mediaRef} className="kv-result-tile__media" src={src} fit={fit ? 'contain' : 'cover'} onLoad={fadeOut} />}
      {src && type === 'video' && <VideoPlayer src={src} poster={poster} fit={fit ? 'contain' : undefined} onFullscreen={onPreview} />}
      {/* 音频：和画布音频节点同一块（波形能拖、时间、播放），11-19 用户定照画布做 */}
      {src && type === 'audio' && <NodeMedia type="audio" src={src} />}
      {leaving && (
        <div
          className="kv-result-tile__leaving"
          data-out={leaving.out || undefined}
          aria-hidden
          onTransitionEnd={(e) => e.target === e.currentTarget && e.propertyName === 'opacity' && setLeaving(null)}
        >
          {generatingLayer(leaving)}
        </div>
      )}
      <Actions
        list={topActions}
        position="top"
        extra={
          collect && (
            <IconButton
                icon={collected ? 'CollectSolid' : 'Collect'}
                label={collected ? '取消收藏' : '收藏'}
                selected={collected}
                data-collected={collected || undefined}
                onClick={() => setCollected(!collected)}
              />
          )
        }
      />
      {/* 收藏了、不悬停：右上只留一个实心星，悬停时换成整条。只是标记，点不到（鼠标一移上去就是整条）。里面的星不设选中，只留按钮条一层玻璃（11-20 用户定：原来叠了选中的底，看着两层） */}
      {collect && collected && (
        <ButtonGroup className="kv-result-tile__pin" aria-hidden>
          <IconButton icon="CollectSolid" label="已收藏" tooltip={false} data-collected tabIndex={-1} />
        </ButtonGroup>
      )}
      <Actions list={quickActions} position="quick" />
      {children}
    </div>
  );
});
ResultTile.displayName = 'ResultTile';
