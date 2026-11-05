import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './canvas.css';

export type CropHandlesProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/** 裁剪框：选中图片后点「裁剪」，盖在图片上的拉伸手柄。没有属性，大小用 style 或外层定位给。Figma「画布」页 CropHandles */
export const CropHandles = forwardRef<HTMLDivElement, CropHandlesProps>(function CropHandles(
  { className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-crop-handles', className)} {...rest}>
      <i className="kv-crop-handles__handle kv-crop-handles__handle--nw" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--n" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--ne" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--w" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--e" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--sw" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--s" />
      <i className="kv-crop-handles__handle kv-crop-handles__handle--se" />
    </div>
  );
});
CropHandles.displayName = 'CropHandles';
