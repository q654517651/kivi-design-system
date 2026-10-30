import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { AssetThumb } from '../tabs-tags-avatar';
import { cx } from '../utils';
import './canvas.css';

export type MentionChipType = 'image' | 'music';

export interface MentionChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** 类型：图片 / 音乐，默认图片 */
  type?: MentionChipType;
  /** 缩略图地址：图片用。音乐的缩略图是音符 */
  src?: string;
  /** 名字，和参考图区里的名字对应，比如「图片1」「音乐1」 */
  children?: ReactNode;
}

/** 提示词里的 @素材 标签：缩略图 + 名字，放在 PromptInput 里用。Figma「画布」页 MentionChip */
export const MentionChip = forwardRef<HTMLSpanElement, MentionChipProps>(function MentionChip(
  { type = 'image', src, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('kv-mention-chip', type === 'music' && 'kv-mention-chip--music', className)}
      contentEditable={false}
      {...rest}
    >
      <AssetThumb size={16} type={type === 'music' ? 'audio' : 'image'} src={src} />
      {children}
    </span>
  );
});
MentionChip.displayName = 'MentionChip';
