import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './upload.css';

// 上传进度环：直径 28，线宽 3，白 30% 的底圈加白色的弧，中间写百分比
const RING_R = 12.5;
const RING_LEN = 2 * Math.PI * RING_R;

export interface UploadRingProps extends HTMLAttributes<HTMLSpanElement> {
  /** 上传进度 0–100，超出的夹住。默认 0 */
  progress?: number;
  /** 读屏用，说明是什么在上传，比如「图片1上传中」。默认「上传中」 */
  'aria-label'?: string;
}

/**
 * 上传进度环：盖在暗色遮罩上，中间写百分比。ReferenceStack 的上传中卡片、附件条的上传中都用它。
 * Figma「模板 · 主站」页参考素材「上传中」
 */
export const UploadRing = forwardRef<HTMLSpanElement, UploadRingProps>(function UploadRing(
  { progress = 0, 'aria-label': ariaLabel = '上传中', className, ...rest },
  ref,
) {
  const value = Math.max(0, Math.min(100, progress));
  return (
    <span
      ref={ref}
      className={cx('kv-upload-ring', className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <circle className="kv-upload-ring__ring" cx="14" cy="14" r={RING_R} />
        <circle
          className="kv-upload-ring__arc"
          cx="14"
          cy="14"
          r={RING_R}
          strokeDasharray={RING_LEN}
          strokeDashoffset={RING_LEN * (1 - value / 100)}
          transform="rotate(-90 14 14)"
        />
      </svg>
      <span className="kv-upload-ring__text">{Math.round(value)}%</span>
    </span>
  );
});
UploadRing.displayName = 'UploadRing';
