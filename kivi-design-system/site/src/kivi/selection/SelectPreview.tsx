import { forwardRef, useEffect, type HTMLAttributes, type MouseEvent } from 'react';
import { Icon } from '../Icon';
import { composeHandlers, useAudioPlayer } from '../hooks';
import './selection.css';

/**
 * Select 选项左边的试听（音色选择用），不从入口导出。24 见方、圆角 6，播放 / 暂停 / 加载中转圈。
 * 菜单项本身是按钮，里面不能再套按钮：这里是一个不进 Tab 顺序的 span，点它只试听，不选中、不关列表。
 * 同一时间只播一个（useAudioPlayer 走 exclusivePlayback）；列表关了就停
 */
export interface SelectPreviewProps extends HTMLAttributes<HTMLSpanElement> {
  /** 音频地址，没有就是禁用 */
  src?: string;
  /** 这一项的名字，读屏用：「试听 温柔女声」 */
  label: string;
}

export const SelectPreview = forwardRef<HTMLSpanElement, SelectPreviewProps>(function SelectPreview(
  { src, label, onClick, onPointerDown, ...rest },
  ref,
) {
  const { audioRef, audioProps, playing, status, toggle } = useAudioPlayer({ src });
  useEffect(() => {
    const el = audioRef.current;
    return () => el?.pause();
  }, [audioRef]);

  const off = !src || status === 'error';
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <span
      ref={ref}
      className="kv-select-preview"
      role="button"
      tabIndex={-1}
      aria-label={playing ? `暂停试听 ${label}` : `试听 ${label}`}
      aria-pressed={playing}
      aria-disabled={off || undefined}
      onPointerDown={composeHandlers(onPointerDown, stop)}
      onClick={composeHandlers(onClick, (e: MouseEvent) => {
        stop(e);
        if (!off) toggle();
      })}
      {...rest}
    >
      {src && <audio ref={audioRef} src={src} preload="none" {...audioProps} />}
      {playing && status === 'loading' ? (
        <Icon name="Loading" className="kv-icon--spin" />
      ) : (
        <Icon name={playing ? 'Pause' : 'Play'} />
      )}
    </span>
  );
});
SelectPreview.displayName = 'SelectPreview';
