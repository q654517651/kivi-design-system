import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { IconName } from '../icons';
import { Icon } from '../Icon';
import { AssetThumb } from '../tags-avatar';
import { cx } from '../utils';
import './reference.css';

export type MentionChipType = 'image' | 'video' | 'music' | 'skill' | 'node' | 'annotation' | 'model';

export interface MentionChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** 类型：图片 / 视频 / 音乐 / 技能 / 节点 / 标注点 / 模型，默认图片。输入框里和用户消息里是同一个 */
  type?: MentionChipType;
  /** 缩略图地址：图片、视频用（视频传封面），标注点传所在图片。音乐、技能、节点、模型不用传，前面是 16 的白色图标 */
  src?: string;
  /** 前面的图标：技能默认 Skill，节点默认 Text（文本节点，11-04 从 Link 改；别的节点传自己类型的图标，比如 ImageGeneration）；视频没传 src 时用 Video；模型必传，是模型自带的厂商 Logo（`SelectOption.icon`）。其余一般不用传 */
  icon?: IconName;
  /** 标注点的序号，只有标注点用：缩略图后面单独一格的小气泡（不压在缩略图上） */
  index?: number | string;
  /** 名字，和参考图区里的名字对应，比如「图片1」「音乐1」 */
  children?: ReactNode;
}

/** 提示词里的 @ 引用标签：缩略图或图标 + 名字，放在 PromptInput、用户消息里用。Figma「画布」页 MentionChip */
export const MentionChip = forwardRef<HTMLSpanElement, MentionChipProps>(function MentionChip(
  { type = 'image', src, icon, index, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('kv-mention-chip', className)}
      contentEditable={false}
      {...rest}
    >
      {/* 有图的（图片、视频封面、标注）放缩略图；只有图标的（音乐、技能、节点、模型、没封面的视频）直接放 16 的白色图标，不加底框（11-04 用户定） */}
      {type === 'music' && <Icon name={icon ?? 'Music'} size={16} className="kv-mention-chip__icon" />}
      {type === 'image' && <AssetThumb size={16} type="image" src={src} />}
      {type === 'video' && (src ? <AssetThumb size={16} type="image" src={src} /> : <Icon name={icon ?? 'Video'} size={16} className="kv-mention-chip__icon" />)}
      {type === 'skill' && <Icon name={icon ?? 'Skill'} size={16} className="kv-mention-chip__icon" />}
      {type === 'annotation' && (
        <span className="kv-mention-chip__marked">
          <AssetThumb size={16} type="image" src={src} />
          {index != null && <span className="kv-mention-chip__marker">{index}</span>}
        </span>
      )}
      {type === 'model' && icon && <Icon name={icon} size={16} className="kv-mention-chip__icon" />}
      {type === 'node' && <Icon name={icon ?? 'Text'} size={16} className="kv-mention-chip__icon" />}
      {children}
    </span>
  );
});
MentionChip.displayName = 'MentionChip';
