import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tag } from '../tabs-tags-avatar';
import { cx } from '../utils';
import './agent.css';

export interface MediaStackProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 第一张图的地址（图片填充） */
  src: string;
  /** 右下角数量，比如 +4。不传就没有角标 */
  count?: ReactNode;
  /** 展开状态：展开收起由页面决定，组件只管收起的样子，这里只是把状态写进 aria-expanded */
  expanded?: boolean;
}

/** 生成结果叠放：一组生成完成后收起时用。Figma「Agent」页 MediaStack。读屏要靠 aria-label 说明，比如「展开 5 个结果」 */
export const MediaStack = forwardRef<HTMLButtonElement, MediaStackProps>(function MediaStack(
  { src, count, expanded = false, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-media-stack', className)} aria-expanded={expanded} {...rest}>
      <span className="kv-media-stack__layer kv-media-stack__layer--3" />
      <span className="kv-media-stack__layer kv-media-stack__layer--2" />
      <span className="kv-media-stack__cover">
        <img src={src} alt="" />
        {count != null && (
          <span className="kv-media-stack__count">
            <Tag variant="on-media">{count}</Tag>
          </span>
        )}
      </span>
    </button>
  );
});
MediaStack.displayName = 'MediaStack';
