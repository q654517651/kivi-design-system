/**
 * 合并事件：组件自己要监听、外面也传了同名事件时用。
 * 先调外面的；外面调了 preventDefault 就不再走组件自己的（和 Radix 一样）。
 */
export function composeHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((e: E) => void) | undefined,
  ours: ((e: E) => void) | undefined,
) {
  return (e: E) => {
    theirs?.(e);
    if (!e.defaultPrevented) ours?.(e);
  };
}
