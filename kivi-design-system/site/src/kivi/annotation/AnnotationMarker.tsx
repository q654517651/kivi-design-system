import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../utils';
import './annotation.css';

export interface AnnotationMarkerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 序号，比如 1、2。按画在图上的先后给，写在气泡里 */
  children: number | string;
}

/**
 * 标注序号气泡：品牌绿的 28 见方，三个角全圆、左下是尖角，白描边，序号 14 中等。任何模式下都能悬停、点击：
 * 悬停出一行描述预览，点了换成可编辑的评论浮层。读屏读「标注 N」。通常由 AnnotationBox 摆在选区右下角，也能单独用。
 */
export const AnnotationMarker = forwardRef<HTMLButtonElement, AnnotationMarkerProps>(function AnnotationMarker(
  { children, type = 'button', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-annotation-marker', className)} aria-label={ariaLabel ?? `标注 ${children}`} {...rest}>
      {children}
    </button>
  );
});
AnnotationMarker.displayName = 'AnnotationMarker';
