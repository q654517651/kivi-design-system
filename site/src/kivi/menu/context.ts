import { createContext, useContext } from 'react';

/** Menu 把自己的类型告诉里面的 MenuItem、MenuLabel：平铺（侧栏）里选中用 aria-current，不是 option */
export interface MenuContextValue {
  plain: boolean;
}

export const MenuContext = createContext<MenuContextValue>({ plain: false });

export const useMenuContext = () => useContext(MenuContext);
