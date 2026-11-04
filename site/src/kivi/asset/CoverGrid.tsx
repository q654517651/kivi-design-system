import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './asset.css';

export interface CoverGridProps extends HTMLAttributes<HTMLDivElement> {
  /** 封面图地址，最多用前 4 张。没有图就是一块空底 */
  images?: string[];
}

/**
 * 封面拼图：文件夹、画布项目的封面。照线上 CoverGrid：1 张铺满；2 张左右各一；
 * 3 张左边一张占 2 / 3 宽，右边两张上下排；4 张 2 × 2。图之间隔 1，图片居中裁切。大小跟着外层走
 */
export const CoverGrid = forwardRef<HTMLDivElement, CoverGridProps>(function CoverGrid(
  { images = [], className, ...rest },
  ref,
) {
  const list = images.slice(0, 4);
  return (
    <div ref={ref} className={cx('kv-cover-grid', className)} data-count={list.length} {...rest}>
      {list.map((src, i) => (
        <img key={`${i}-${src}`} className="kv-cover-grid__cell" src={src} alt="" draggable={false} />
      ))}
    </div>
  );
});
CoverGrid.displayName = 'CoverGrid';
