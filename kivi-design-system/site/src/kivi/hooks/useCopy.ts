import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '../feedback/toast-store';

/** 写进剪贴板。不是安全环境（http 的内网地址）时没有 navigator.clipboard，退到 execCommand */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 没权限，接着试老办法
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/**
 * 复制按钮用：copy(text) 写进剪贴板，成功后 copied 为 true，过 ms 毫秒（默认 1500）变回 false。
 * 复制失败不改 copied，弹 Toast「复制失败」（页面上要放 `<Toaster />`），返回 false。
 * 成功只换对勾（copied），不弹 Toast，所有复制按钮一样。
 */
export function useCopy(ms = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      if (!(await writeClipboard(text))) {
        toast.error('复制失败');
        return false;
      }
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), ms);
      return true;
    },
    [ms],
  );

  return { copied, copy };
}
