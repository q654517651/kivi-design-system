import { useCallback, type MutableRefObject, type Ref } from 'react';

/** 合并 ref：组件自己要用根元素，外面也通过 forwardRef 传了 ref，两个都要拿到 */
export function useMergedRef<T>(...refs: Array<Ref<T> | undefined>) {
  return useCallback((node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}
