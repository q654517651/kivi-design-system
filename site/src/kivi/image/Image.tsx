import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode, type SyntheticEvent } from 'react';
import { cx } from '../utils';
import { composeHandlers, useMergedRef } from '../hooks';
import { EMPTY_STATE_IMAGES } from '../feedback/EmptyState';
import { Skeleton } from '../feedback/Skeleton';
import './image.css';

export type ImageFit = 'cover' | 'contain';
export type ImageStatus = 'loading' | 'loaded' | 'error';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** 图片地址。换了地址就重新加载；不写（结果还没出来）一直是加载中 */
  src?: string;
  /** 替代文字，读屏用。纯装饰的图写 `""` */
  alt?: string;
  /** 比例：`'1:1'`、`'16:9'` 这样的字符串，或宽 / 高的数字。不写就由外面定宽高 */
  ratio?: string | number;
  /** 填充：铺满、居中裁切 / 完整显示留空，默认铺满 */
  fit?: ImageFit;
  /** 失败后点重试：传了，整块失败图变成按钮，点一下重新加载（地址后面加时间戳避开缓存）；不传就只是静态的失败图 */
  onRetry?: () => void;
  /** 自定义失败时显示的内容，替换默认的 IP 插图 */
  fallback?: ReactNode;
  /** 加载完成 */
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  /** 加载失败 */
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

/** 比例转成 CSS aspect-ratio：'16:9' → '16 / 9'，数字原样 */
const toAspect = (ratio: string | number | undefined) => {
  if (ratio === undefined) return undefined;
  if (typeof ratio === 'number') return ratio;
  const [w, h] = ratio.split(':').map(Number);
  return w > 0 && h > 0 ? `${w} / ${h}` : undefined;
};

/** 失败图大小：短边的一半，最大 120，最小 32 */
const MAX_ILLUSTRATION = 120;
const MIN_ILLUSTRATION = 32;
/** 短边到这么大才在失败图下面写「重试」 */
const LABEL_MIN_SIDE = 160;

/**
 * 图片：加载中是骨架屏扫光，加载完淡入，失败是深色底 + 居中的 IP 失败插图。
 * 状态写在根元素 `data-status`（loading / loaded / error）。外面定宽（再配 `ratio`），或者定宽高。
 * 传了 `onRetry`，失败时整块是一个按钮，点了重新加载。
 * className、style 给外层；ref 和其余 `<img>` 属性（`loading`、`crossOrigin`、`srcSet`…）给里面的 `<img>`。Figma「反馈」页还没有，待确认
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt = '', ratio, fit = 'cover', onRetry, fallback, onLoad, onError, className, style, ...rest },
  ref,
) {
  const [status, setStatus] = useState<ImageStatus>('loading');
  // 重试一次加一，地址后面带上它避开缓存
  const [attempt, setAttempt] = useState(0);
  const [side, setSide] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const setImg = useMergedRef(imgRef, ref);
  const rootRef = useRef<HTMLDivElement>(null);

  const url = src && attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src;

  // 换地址、重试：回到加载中；没有地址（结果还没出来）一直是加载中。
  // 图片已经在缓存里时，浏览器可能不再触发 load，所以挂上后看一眼 complete
  useLayoutEffect(() => {
    setStatus('loading');
    const el = imgRef.current;
    if (url && el?.complete) setStatus(el.naturalWidth > 0 ? 'loaded' : 'error');
  }, [url]);

  // 量短边：失败插图的大小、要不要写「重试」都看它
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setSide(Math.min(el.clientWidth, el.clientHeight));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
    onRetry?.();
  }, [onRetry]);

  const illustration = Math.max(MIN_ILLUSTRATION, Math.min(side * 0.5, MAX_ILLUSTRATION));
  const failed = status === 'error';
  const content = (
    <>
      {fallback ?? <img className="kv-image__failed" src={EMPTY_STATE_IMAGES.failed} alt="" style={{ width: illustration, height: illustration }} />}
      {onRetry && side >= LABEL_MIN_SIDE && <span className="kv-image__retry">重试</span>}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={cx('kv-image', `kv-image--${fit}`, className)}
      data-status={status}
      data-ratio={ratio !== undefined ? '' : undefined}
      style={{ aspectRatio: toAspect(ratio), ...style }}
    >
      {url && (
        <img
          ref={setImg}
          className="kv-image__img"
          src={url}
          alt={alt}
          onLoad={composeHandlers(onLoad, () => setStatus('loaded'))}
          onError={composeHandlers(onError, () => setStatus('error'))}
          {...rest}
        />
      )}
      {status === 'loading' && <Skeleton className="kv-image__skeleton" aria-hidden="true" />}
      {failed &&
        (onRetry ? (
          <button type="button" className="kv-image__error" aria-label={`${alt ? `${alt}，` : ''}加载失败，点击重试`} onClick={retry}>
            {content}
          </button>
        ) : (
          <div className="kv-image__error" role={alt ? 'img' : undefined} aria-label={alt ? `${alt}，加载失败` : undefined}>
            {content}
          </div>
        ))}
    </div>
  );
});
Image.displayName = 'Image';
