import { useCallback, useRef, useState } from 'react';

// 组件库内部共用，从 hooks/ 引，不从入口导出。

/** 受控 / 非受控二合一：传了 value 就听外面的，没传就自己存 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;
  const latest = useRef({ current, onChange });
  latest.current = { current, onChange };
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      if (next !== latest.current.current) latest.current.onChange?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}
