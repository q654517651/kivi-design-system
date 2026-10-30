import { forwardRef, Fragment, type HTMLAttributes, type ReactNode } from 'react';
import { ReferenceItem } from '../canvas';
import { AssetThumb } from '../tabs-tags-avatar';
import { cx } from '../utils';
import './main-site.css';

export interface GenPromptRefItem {
  /** 素材类型：图片 / 视频（用首帧）/ 音频 */
  type: 'image' | 'video' | 'audio';
  /** 图片或视频首帧的地址，音频不用 */
  src?: string;
  /** 视频时长，比如 0:06，只在悬停浮层里显示 */
  duration?: string;
}

export interface GenPromptRefsProps extends HTMLAttributes<HTMLDivElement> {
  /** 所有参考素材，图片、视频、音频可以混排。参考区最多露 5 格，超过 5 个第 5 个渐隐；悬停时下面的浮层显示全部 */
  items: GenPromptRefItem[];
  /** 参考方式文字，比如「全能参考」「参考图」「原图」 */
  label: ReactNode;
}

/** GenPrompt 参数里的参考区：缩略图 + 参考方式文字，悬停弹出浮层显示全部素材。Figma「主站」页 GenPrompt 里的一块 */
export const GenPromptRefs = forwardRef<HTMLDivElement, GenPromptRefsProps>(function GenPromptRefs(
  { items, label, className, ...rest },
  ref,
) {
  const overflow = items.length > 5;
  const shown = items.slice(0, 5);
  const thumb = (item: GenPromptRefItem) => <AssetThumb size={16} type={item.type === 'audio' ? 'audio' : 'image'} src={item.src} />;

  return (
    <div ref={ref} className={cx('kv-gen-prompt-refs', className)} tabIndex={0} {...rest}>
      <span className="kv-gen-prompt-refs__thumbs">
        {shown.map((item, i) =>
          overflow && i === 4 ? (
            <span key={i} className="kv-gen-prompt-refs__thumb--fade">
              {thumb(item)}
            </span>
          ) : (
            <Fragment key={i}>{thumb(item)}</Fragment>
          ),
        )}
      </span>
      {label}
      <div className="kv-gen-prompt-refs__popover" role="tooltip">
        {items.map((item, i) => (
          <ReferenceItem key={i} size={72} type={item.type === 'audio' ? 'audio' : 'image'} src={item.src} duration={item.duration} />
        ))}
      </div>
    </div>
  );
});
GenPromptRefs.displayName = 'GenPromptRefs';
