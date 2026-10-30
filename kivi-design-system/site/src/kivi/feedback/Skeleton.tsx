import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './feedback.css';

export type SkeletonShape = 'rect' | 'circle' | 'text';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 形状：矩形（图片、卡片）/ 圆形（头像）/ 文字行（高 12），默认矩形 */
  shape?: SkeletonShape;
  /** 宽，照真实内容。数字按 px，也可以写 '60%'。文字行不写就是撑满一行 */
  width?: number | string;
  /** 高，照真实内容。文字行默认 12，不用写 */
  height?: number | string;
}

/** 内容还没出来时占位的灰块，带扫光。Figma「反馈」页 Skeleton。组件只管颜色和圆角，宽高自己写 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'rect', width, height, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('kv-skeleton', `kv-skeleton--${shape}`, className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
});
Skeleton.displayName = 'Skeleton';
