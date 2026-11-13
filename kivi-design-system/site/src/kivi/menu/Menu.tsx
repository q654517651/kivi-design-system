import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cx } from '../utils';
import { ScrollArea } from '../scroll-area';
import { MenuContext } from './context';
import './menu.css';

export type MenuVariant = 'default' | 'plain';

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** 类型：默认（玻璃浮层，点开或右键弹出的菜单）/ 平铺（没有玻璃底、描边、内边距、圆角，直接平铺在页面上，给侧栏用），默认 default */
  variant?: MenuVariant;
  /** 宽度，数字按 px，160–240（最窄 160）；不写就跟着内容（平铺的撑满外面）。下拉选择展开的列表要和触发器一样宽，用 Dropdown 的 matchTriggerWidth */
  width?: number | string;
}

/**
 * 菜单容器：往里放 MenuItem、MenuLabel、Divider，条目随便增删，数量和顺序没限制。
 * 单选菜单把 role 改成 listbox。平铺的（variant="plain"）不写 role，侧栏的入口选中用 aria-current。
 * Figma「模板 · 通用」页「菜单」分区的菜单模板
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { variant = 'default', width, role, className, style, children, ...rest },
  ref,
) {
  const plain = variant === 'plain';
  const sized: CSSProperties | undefined = width === undefined ? style : { width, ...style };
  return (
    <MenuContext.Provider value={{ plain }}>
      <div
        ref={ref}
        className={cx('kv-menu', plain && 'kv-menu--plain', className)}
        role={role ?? (plain ? undefined : 'menu')}
        style={sized}
        {...rest}
      >
        {plain ? (
          children
        ) : (
          <ScrollArea className="kv-menu__scroll">
            <div className="kv-menu__list">{children}</div>
          </ScrollArea>
        )}
      </div>
    </MenuContext.Provider>
  );
});
Menu.displayName = 'Menu';
