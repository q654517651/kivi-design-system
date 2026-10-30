import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import './menus-tooltip.css';

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** 宽度，数字按 px。Figma 里的例子有 120、160、220；不写就跟着内容。下拉选择展开的列表要和触发器一样宽，用 Dropdown 的 matchTriggerWidth */
  width?: number | string;
}

/**
 * 菜单容器：往里放 MenuItem、MenuLabel、MenuDivider，条目随便增删，数量和顺序没限制。
 * 单选菜单把 role 改成 listbox。Figma「模板 · 通用」页「菜单」分区的菜单模板
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { width, role = 'menu', className, style, children, ...rest },
  ref,
) {
  const sized: CSSProperties | undefined = width === undefined ? style : { width, ...style };
  return (
    <div ref={ref} className={cx('kv-menu', className)} role={role} style={sized} {...rest}>
      {children}
    </div>
  );
});
Menu.displayName = 'Menu';
