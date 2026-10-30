import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ButtonGroup, ButtonGroupDivider, IconButton } from '../button';
import { GeneratingDots } from '../generating';
import { useControllable } from '../hooks';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { MenuItem } from '../menus-tooltip';
import { Tag } from '../tabs-tags-avatar';
import { cx } from '../utils';
import type { NodeMediaType } from './NodeMedia';
import './canvas.css';

export type NodeCardState = 'guide' | 'pending' | 'generating' | 'done' | 'failed';

/** 引导态默认的三个起步方式：音频一套，其他类型一套 */
const GUIDE_OPTIONS: Record<'audio' | 'other', string[]> = {
  other: ['自己编写内容', '图片反推提示词', '视频反推脚本'],
  audio: ['图片参考生成音频', '音频参考生成音频', '生成对话'],
};

/** 待生成态默认的 64 图标，跟着内容类型走 */
const TYPE_ICON: Record<NodeMediaType, IconName> = {
  text: 'Text',
  image: 'ImageGeneration',
  video: 'VideoGeneration',
  audio: 'Audio',
};

export interface NodeCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 状态：引导 / 待生成 / 生成中 / 完成 / 失败，默认引导 */
  state?: NodeCardState;
  /** 内容类型：图片 / 视频 / 音频 / 文字，默认图片。引导项、待生成的图标、生成中动效拼出的图标跟着它走；音频完成态单独放时是 341 宽 */
  type?: NodeMediaType;
  /** 待生成：中间的 64 图标，默认按内容类型取。视频封装用 Pack，视频剪辑用 Cutting */
  icon?: IconName;
  /** 待生成：图标下面的按钮，Button 小 · 次要，比如「打开视频封装」。不传就没有 */
  button?: ReactNode;
  /** 生成中：原素材地址，重新生成时放旧图。传了：原素材 + 黑 40% 遮罩 + 背景模糊，上面叠点阵动效；不传（第一次生成）：没有遮罩，只有点阵动效 */
  cover?: string;
  /** 生成中：左上的倒计时，比如 "59s 生成中"；算不出耗时就写 "生成中"。Figma 里默认开，代码里传了才显示 */
  countdown?: ReactNode;
  /** 完成：左上转圈，素材正在上传。32 的浮层底，里面 Loading 1 秒一圈，不能点 */
  uploading?: boolean;
  /** 完成：右上按钮条最左边放收藏。生成的图片、视频节点开，素材节点不开 */
  collect?: boolean;
  /** 完成：收藏了没有。收藏了图标换实心；悬停才出按钮时，不悬停右上只留一个绿星 */
  collected?: boolean;
  /** 完成：一开始收藏了没有，不受控时用 */
  defaultCollected?: boolean;
  /** 完成：点了收藏 */
  onCollectedChange?: (collected: boolean) => void;
  /** 完成：右上按钮条里的图标按钮，依次是全屏、下载。按钮条里默认就是 IconButton 28 · 文字 */
  iconButton?: ReactNode;
  /** 完成：右上按钮条最右边的文字按钮，和前面隔一条分割线，比如素材节点的「上传」、多图节点的「4 ⌄」。默认 Button 小 · 文字 */
  textButton?: ReactNode;
  /** 完成：右上的按钮条只在鼠标移上去时出现。画布上的真实节点都开；不开就一直显示，文档摆静态用 */
  hoverActions?: boolean;
  /** 失败：文案，默认「生成失败，消耗猕猴桃已退回」 */
  message?: ReactNode;
  /** 失败：插画地址，默认 ./empty-state/failed.png */
  illustration?: string;
  /** 引导：点了某个起步方式。传了 children 时用自己的菜单项 */
  onGuideSelect?: (option: string) => void;
  /** 引导：换掉默认的三个起步方式（MenuItem）；完成：里面放 NodeMedia */
  children?: ReactNode;
}

/** 节点本体，所有节点类型共用，5 个状态。大小跟着外面的 NodeWrapper。Figma「画布」页 NodeCard */
export const NodeCard = forwardRef<HTMLDivElement, NodeCardProps>(function NodeCard(
  {
    state = 'guide',
    type = 'image',
    icon,
    button,
    cover,
    countdown,
    uploading,
    collect,
    collected: collectedProp,
    defaultCollected = false,
    onCollectedChange,
    iconButton,
    textButton,
    hoverActions,
    message = '生成失败，消耗猕猴桃已退回',
    illustration = './empty-state/failed.png',
    onGuideSelect,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const generating = state === 'generating';
  const options = type === 'audio' ? GUIDE_OPTIONS.audio : GUIDE_OPTIONS.other;
  const [collected, setCollected] = useControllable(collectedProp, defaultCollected, onCollectedChange);
  const star = (
    <IconButton
      icon={collected ? 'CollectSolid' : 'Collect'}
      label={collected ? '取消收藏' : '收藏'}
      selected={collected}
      onClick={() => setCollected(!collected)}
    />
  );

  return (
    <div
      ref={ref}
      className={cx(
        'kv-node-card',
        `kv-node-card--${state}`,
        state === 'done' && type === 'audio' && 'kv-node-card--audio',
        hoverActions && 'kv-node-card--hover-actions',
        className,
      )}
      aria-busy={generating || undefined}
      style={style}
      {...rest}
    >
      {state === 'guide' && (
        <div className="kv-node-card__options">
          {children ??
            options.map((o) => (
              <MenuItem key={o} onClick={() => onGuideSelect?.(o)}>
                {o}
              </MenuItem>
            ))}
        </div>
      )}

      {state === 'pending' && (
        <>
          <Icon name={icon ?? TYPE_ICON[type]} size={64} className="kv-node-card__icon" />
          {button}
        </>
      )}

      {generating && (
        <>
          {cover && (
            <>
              <img className="kv-node-card__cover" src={cover} alt="" />
              <div className="kv-node-card__mask" />
            </>
          )}
          <GeneratingDots type={type} />
          {countdown && <Tag variant="on-media" className="kv-node-card__tag">{countdown}</Tag>}
        </>
      )}

      {state === 'done' && (
        <>
          {children}
          {uploading && (
            <span className="kv-node-card__upload" role="status" aria-label="上传中">
              <Icon name="Loading" spin />
            </span>
          )}
          {(collect || iconButton || textButton) && (
            <ButtonGroup className="kv-node-card__actions" aria-label="节点操作">
              {collect && star}
              {iconButton}
              {textButton && (collect || iconButton) && <ButtonGroupDivider />}
              {textButton}
            </ButtonGroup>
          )}
          {/* 收藏了、不悬停：右上只留一个星，悬停时换成整条。只是标记，点不到（鼠标一移上去就是整条） */}
          {collect && collected && hoverActions && (
            <ButtonGroup className="kv-node-card__pin" aria-hidden>
              <IconButton icon="CollectSolid" label="已收藏" selected tabIndex={-1} />
            </ButtonGroup>
          )}
        </>
      )}

      {state === 'failed' && (
        <>
          <img className="kv-node-card__illustration" src={illustration} alt="" />
          <p className="kv-node-card__message">{message}</p>
        </>
      )}
    </div>
  );
});
NodeCard.displayName = 'NodeCard';
