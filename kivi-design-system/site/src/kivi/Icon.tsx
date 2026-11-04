import { createContext, forwardRef, useContext, type CSSProperties, type HTMLAttributes } from 'react';
import { ICONS, ICON_VIEWBOX, type IconName } from './icons';
import { ICONS_V3 } from './icons-v3';
import { cx } from './utils';

export type IconSize = 16 | 20 | 24 | 40 | 64;

/** 图标版本：V3 是默认（Hugeicons 缩 21、线宽 1.6，Figma「_图标对照」页第三列）；V2 是 Figma「图标」页，数据留着备查，要看就用 IconSetContext 包一层 'v2'（11-04 用户定） */
export type IconSet = 'v2' | 'v3';

/** 这一片用哪版图标，默认 V3。V3 里没有的（Kiwi、Logo，以及后来直接按 V3 规格补进 icons.ts 的）用 icons.ts 里的 */
export const IconSetContext = createContext<IconSet>('v3');

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /** 图标名，和 Figma「图标」页一样，区分大小写 */
  name: IconName;
  /** 尺寸，照 Figma Icon 组件，默认 16。放进按钮这类组件里时由组件定，不用传 */
  size?: IconSize;
  /** 转圈：Loading 图标 1 秒一圈，匀速 */
  spin?: boolean;
}

/**
 * 图标画成蒙版，再整块涂文字颜色（11-04）：V3 是描边、一个图标常有好几段线，直接画的话颜色带透明度时
 * 线和线交叠的地方会叠两次、更亮。蒙版先把整个图标合成一个形状，再统一上色，就不会叠。
 * 每个图标的蒙版只生成一次，存在这里复用
 */
const masks = new Map<string, string>();
function maskOf(set: IconSet, name: IconName, body: string) {
  const key = `${set}:${name}`;
  let url = masks.get(key);
  if (!url) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX[name] ?? '0 0 24 24'}" fill="#000">${body.replace(/currentColor/g, '#000')}</svg>`;
    url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    masks.set(key, url);
  }
  return url;
}

/** 图标，图形和名字都来自 Figma「图标」页 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon({ name, size, spin, className, style, ...rest }, ref) {
  const set = useContext(IconSetContext);
  const v3 = set === 'v3' && ICONS_V3[name];
  const body = v3 || ICONS[name];
  return (
    <span
      ref={ref}
      className={cx('kv-icon', size && size !== 16 && `kv-icon--${size}`, spin && 'kv-icon--spin', className)}
      data-icon={name}
      aria-hidden="true"
      style={{ '--kv-icon-mask': maskOf(v3 ? 'v3' : 'v2', name, body), ...style } as CSSProperties}
      {...rest}
    />
  );
});
Icon.displayName = 'Icon';
