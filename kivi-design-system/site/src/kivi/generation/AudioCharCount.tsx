import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import { AUDIO_CHAR_LIMIT, DEFAULT_MODEL } from './options';
import './generation.css';

export interface AudioCharCountProps extends HTMLAttributes<HTMLSpanElement> {
  /** 现在的字数，默认 0 */
  count?: number;
  /** 音频模型的值，上限跟着它变，默认 Seed Audio */
  model?: string;
}

/** 音频生成按钮左边的「字数 / 上限」（照线上音频面板），代替张数 */
export const AudioCharCount = forwardRef<HTMLSpanElement, AudioCharCountProps>(function AudioCharCount(
  { count = 0, model = DEFAULT_MODEL.audio, className, ...rest },
  ref,
) {
  const limit = AUDIO_CHAR_LIMIT[model] ?? AUDIO_CHAR_LIMIT[DEFAULT_MODEL.audio];
  return (
    <span
      ref={ref}
      className={cx('kv-audio-char-count', className)}
      data-over={count > limit ? '' : undefined}
      {...rest}
    >
      {count}/{limit}
    </span>
  );
});
AudioCharCount.displayName = 'AudioCharCount';
