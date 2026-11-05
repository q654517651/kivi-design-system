import { forwardRef, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { cx } from '../utils';
import { AnnotationMarker } from './AnnotationMarker';
import './annotation.css';

export type AnnotationCorner = 'tl' | 'br';

export interface AnnotationBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 序号，写在右下角的气泡里。不传就没有气泡（正在画的那个框） */
  index?: number | string;
  /** 左上、右下两个拖动圆点，默认显示（常驻，随时能拖）。正在画的框不要 */
  handles?: boolean;
  /** 评论浮层：放 AnnotationComment，挂在气泡右边、和气泡顶对齐 */
  comment?: ReactNode;
  /** 点气泡 */
  onMarkerClick?: () => void;
  /** 鼠标移进、移出气泡，键盘聚焦、移开也触发（悬停预览用） */
  onMarkerPointerEnter?: () => void;
  onMarkerPointerLeave?: () => void;
  /** 在圆点上按下，开始拖：参数是哪个角。拖的逻辑自己写，固定对角那个点 */
  onHandlePointerDown?: (corner: AnnotationCorner, event: PointerEvent<HTMLSpanElement>) => void;
}

/**
 * 标注框：图片上框出来的一块。盖在图片上，位置和大小由外面用 left / top / width / height 给（百分比最方便，随图缩放）；
 * 3px 品牌绿虚线（8 实 4 空），左上、右下各一个 16 的圆点（nwse-resize），右下角挂序号气泡和评论浮层。
 * 序号气泡、评论浮层会伸出图片，外层不要裁剪。Figma 还没有，样式照线上。
 */
export const AnnotationBox = forwardRef<HTMLDivElement, AnnotationBoxProps>(function AnnotationBox(
  { index, handles = true, comment, onMarkerClick, onMarkerPointerEnter, onMarkerPointerLeave, onHandlePointerDown, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-annotation-box', className)} {...rest}>
      <svg className="kv-annotation-box__rect" aria-hidden="true">
        <rect x="0" y="0" width="100%" height="100%" />
      </svg>
      {handles && (
        <>
          <span className="kv-annotation-box__handle" data-corner="tl" onPointerDown={(e) => onHandlePointerDown?.('tl', e)} />
          <span className="kv-annotation-box__handle" data-corner="br" onPointerDown={(e) => onHandlePointerDown?.('br', e)} />
        </>
      )}
      {index != null && (
        <div className="kv-annotation-box__marker">
          <AnnotationMarker
            onClick={onMarkerClick}
            onPointerEnter={onMarkerPointerEnter}
            onPointerLeave={onMarkerPointerLeave}
            // 键盘聚焦和悬停一样出预览；鼠标点一下聚焦不算
            onFocus={(e) => e.currentTarget.matches(':focus-visible') && onMarkerPointerEnter?.()}
            onBlur={() => onMarkerPointerLeave?.()}
          >
            {index}
          </AnnotationMarker>
        </div>
      )}
      {comment && <div className="kv-annotation-box__comment">{comment}</div>}
    </div>
  );
});
AnnotationBox.displayName = 'AnnotationBox';
