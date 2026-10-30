import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './placeholder-image.css';

/** 图片：9 款，值是文件名前缀 */
export type PlaceholderImageName =
  | 'kiwi-glass'
  | 'kivi-future'
  | 'kiwi-light'
  | 'bunny-gouache'
  | 'monstera-dots'
  | 'ip-peek'
  | 'ip-gouache'
  | 'ip-kiwi-pile'
  | 'ip-future';

/** 比例：决定用哪张原图，不改外框形状 */
export type PlaceholderImageRatio = '1:1' | '3:4' | '16:9' | '9:16';

/** 填充：铺满 / 模糊垫底 */
export type PlaceholderImageFill = 'cover' | 'blur';

export interface PlaceholderImageInfo {
  /** 文件名前缀，也是 `image` 属性的值 */
  id: PlaceholderImageName;
  /** 中文名，和 Figma 首选列表一致 */
  name: string;
  /** 有哪几种比例的原图 */
  ratios: readonly PlaceholderImageRatio[];
}

const ALL_RATIOS = ['1:1', '3:4', '16:9', '9:16'] as const;

/** 9 款占位图，顺序同 Figma 首选列表。文档页和属性面板都读这一份 */
export const PLACEHOLDER_IMAGES: readonly PlaceholderImageInfo[] = [
  { id: 'kiwi-glass', name: '晶莹猕猴桃', ratios: ['1:1', '3:4', '9:16'] },
  { id: 'kivi-future', name: 'KIVI 极繁未来', ratios: ALL_RATIOS },
  { id: 'kiwi-light', name: '光影线条', ratios: ALL_RATIOS },
  { id: 'bunny-gouache', name: '水粉兔', ratios: ALL_RATIOS },
  { id: 'monstera-dots', name: '点阵龟背竹', ratios: ALL_RATIOS },
  { id: 'ip-peek', name: 'IP 探头', ratios: ALL_RATIOS },
  { id: 'ip-gouache', name: 'IP 水粉', ratios: ALL_RATIOS },
  { id: 'ip-kiwi-pile', name: 'IP 猕猴桃堆', ratios: ALL_RATIOS },
  { id: 'ip-future', name: 'IP 极繁未来', ratios: ALL_RATIOS },
];

/** 宽高比，比如 '16:9' → 1.78 */
const aspect = (ratio: PlaceholderImageRatio) => {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
};

/**
 * 图片文件地址，形如 `./placeholders/ip-gouache-1x1.webp`。
 * 这一款没有的比例，用最接近的那张（比如晶莹猕猴桃 16:9 → 1:1）。
 * 不用 PlaceholderImage、直接要图片地址时（比如传给 `src`、写 CSS 背景）用它。
 */
export function placeholderImageSrc(
  image: PlaceholderImageName = 'kiwi-glass',
  ratio: PlaceholderImageRatio = '1:1',
  base = './placeholders/',
): string {
  const ratios = PLACEHOLDER_IMAGES.find((i) => i.id === image)?.ratios ?? ALL_RATIOS;
  const use = ratios.includes(ratio)
    ? ratio
    : ratios.reduce((best, r) =>
        Math.abs(Math.log(aspect(r) / aspect(ratio))) < Math.abs(Math.log(aspect(best) / aspect(ratio))) ? r : best,
      );
  const dir = base.endsWith('/') ? base : `${base}/`;
  return `${dir}${image}-${use.replace(':', 'x')}.webp`;
}

export interface PlaceholderImageProps extends HTMLAttributes<HTMLDivElement> {
  /** 图片：9 款之一，默认晶莹猕猴桃 `'kiwi-glass'` */
  image?: PlaceholderImageName;
  /** 比例：只决定用哪张原图，不改外框形状，默认 `'1:1'`。这一款没有的比例用最接近的 */
  ratio?: PlaceholderImageRatio;
  /** 填充：`'cover'` 铺满（居中裁切）/ `'blur'` 模糊垫底（完整显示），默认铺满 */
  fill?: PlaceholderImageFill;
  /** 图片所在目录，默认 `'./placeholders/'`。前端项目把图放在别处时改它 */
  base?: string;
  /** 说明。传了，根元素是 `role="img"`，读屏会读；不传就当装饰 */
  alt?: string;
}

/** 占位图：用户作品的位置用它占位。大小跟着所在格子走，不带圆角，由外层容器裁切。Figma「占位图」页 PlaceholderImage */
export const PlaceholderImage = forwardRef<HTMLDivElement, PlaceholderImageProps>(function PlaceholderImage(
  { image = 'kiwi-glass', ratio = '1:1', fill = 'cover', base = './placeholders/', alt, className, ...rest },
  ref,
) {
  const src = placeholderImageSrc(image, ratio, base);
  return (
    <div
      ref={ref}
      className={cx('kv-placeholder-image', className)}
      data-fill={fill}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      {...rest}
    >
      {fill === 'blur' && (
        <>
          <img className="kv-placeholder-image__backdrop" src={src} alt="" aria-hidden draggable={false} />
          <span className="kv-placeholder-image__mask" aria-hidden />
        </>
      )}
      <img className="kv-placeholder-image__image" src={src} alt="" decoding="async" draggable={false} />
    </div>
  );
});
PlaceholderImage.displayName = 'PlaceholderImage';
