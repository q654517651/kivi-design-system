import { useCallback, useMemo, useRef, useState, type DragEvent, type DragEventHandler } from 'react';
import { composeHandlers } from './composeHandlers';

// 组件库内部共用，从 hooks/ 引，不从入口导出。
// 拖文件进来的公用逻辑：PromptBox 的 DropOverlay、画布 Agent 输入框都用它。

/** 为什么拒收：类型不对 / 超过大小 */
export type FileRejectReason = 'type' | 'size';

export interface FileRule {
  /** 收哪些文件，写法和 `<input accept>` 一样：`image/*`、`image/png`、`.pdf`，逗号隔开。不传不限 */
  accept?: string;
  /** 单个文件最大多少字节。不传不限 */
  maxSize?: number;
}

const rulesOf = (accept?: string) =>
  (accept ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** 文件类型收不收：和 `<input accept>` 一样，扩展名、`类型/*`、完整类型都认 */
export function matchAccept(file: { name: string; type: string }, accept?: string): boolean {
  const rules = rulesOf(accept);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r));
}

/** 拖的过程中浏览器只给类型、不给文件名和大小：扩展名规则看不出来，先当收；只有按类型写的规则才能提前判断 */
function dragRejected(items: DataTransferItemList | undefined, accept?: string): boolean {
  const rules = rulesOf(accept);
  if (!rules.length || rules.some((r) => r.startsWith('.')) || !items) return false;
  return Array.from(items).some((it) => it.kind === 'file' && it.type !== '' && !matchAccept({ name: '', type: it.type }, accept));
}

/** 把文件分成收的和拒的。拒的里有类型不对的，原因就写 type，否则是 size */
export function filterFiles(files: File[], rule: FileRule): { accepted: File[]; rejected: File[]; reason?: FileRejectReason } {
  const accepted: File[] = [];
  const rejected: File[] = [];
  let reason: FileRejectReason | undefined;
  for (const f of files) {
    if (!matchAccept(f, rule.accept)) {
      rejected.push(f);
      reason = 'type';
    } else if (rule.maxSize != null && f.size > rule.maxSize) {
      rejected.push(f);
      reason ??= 'size';
    } else accepted.push(f);
  }
  return { accepted, rejected, reason };
}

/** 拒收时提示的文字 */
export function rejectMessage(reason: FileRejectReason, maxSize?: number): string {
  if (reason === 'type' || maxSize == null) return '不支持这种文件';
  const mb = Math.round((maxSize / 1024 / 1024) * 10) / 10;
  return `文件超过 ${mb} MB`;
}

export interface UseFileDropOptions extends FileRule {
  /** 一次能收几个：false 只收第一个。默认 true */
  multiple?: boolean;
  /** 禁用：拖进来也不收（还是拦着，不让浏览器把文件打开） */
  disabled?: boolean;
  /** 拖拽中（受控）。不传由 hook 自己根据拖拽判断；文档里摆静态样子用 */
  dragging?: boolean;
  /** 拖进来的东西不收（受控）。不传由 hook 根据 accept 判断；文档里摆静态样子用 */
  rejected?: boolean;
  /** 放下后，收下的文件 */
  onFiles?: (files: File[]) => void;
  /** 放下后，被拒的文件和原因 */
  onReject?: (files: File[], reason: FileRejectReason) => void;
}

export interface FileDropHandlers<T extends HTMLElement = HTMLElement> {
  onDragEnter: DragEventHandler<T>;
  onDragOver: DragEventHandler<T>;
  onDragLeave: DragEventHandler<T>;
  onDrop: DragEventHandler<T>;
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

/**
 * 拖文件进来：数 dragenter / dragleave 的次数，鼠标在里面的子元素之间移动时不会一闪一闪。
 * 返回 `dragging`（有文件在上面）、`rejected`（拖的类型不收）、`bind`（四个拖拽事件，铺到根元素上）、
 * `receive`（点选文件走同一套检查：选完把文件列表交给它）。
 */
export function useFileDrop(options: UseFileDropOptions) {
  const depth = useRef(0);
  const [over, setOver] = useState({ dragging: false, rejected: false });
  const latest = useRef(options);
  latest.current = options;

  const reset = useCallback(() => {
    depth.current = 0;
    setOver((o) => (o.dragging || o.rejected ? { dragging: false, rejected: false } : o));
  }, []);

  const receive = useCallback((list: Iterable<File> | ArrayLike<File> | null | undefined) => {
    const { multiple = true, accept, maxSize, disabled, onFiles, onReject } = latest.current;
    if (disabled || !list) return;
    const all = Array.from(list);
    if (!all.length) return;
    const { accepted, rejected, reason } = filterFiles(multiple ? all : all.slice(0, 1), { accept, maxSize });
    if (rejected.length && reason) onReject?.(rejected, reason);
    if (accepted.length) onFiles?.(accepted);
  }, []);

  const bind = useMemo<FileDropHandlers>(() => {
    const sync = (e: DragEvent) => {
      const { disabled, accept } = latest.current;
      const rejected = !disabled && dragRejected(e.dataTransfer?.items, accept);
      setOver((o) => (o.dragging && o.rejected === rejected ? o : { dragging: !disabled, rejected }));
    };
    return {
      onDragEnter: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        sync(e);
      },
      onDragOver: (e) => {
        if (!hasFiles(e)) return;
        // 不拦着的话浏览器会把文件当网页打开，把整页换掉
        e.preventDefault();
        const { disabled, accept } = latest.current;
        e.dataTransfer.dropEffect = disabled || dragRejected(e.dataTransfer.items, accept) ? 'none' : 'copy';
        sync(e);
      },
      onDragLeave: (e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) reset();
      },
      onDrop: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        reset();
        receive(e.dataTransfer.files);
      },
    };
  }, [receive, reset]);

  return {
    dragging: options.dragging ?? over.dragging,
    rejected: options.rejected ?? over.rejected,
    bind,
    receive,
  };
}

/** 组件自己的拖拽处理和外面传的合并（外面先调，调了 preventDefault 就不再走组件自己的） */
export function composeDropHandlers<T extends HTMLElement>(
  theirs: Partial<FileDropHandlers<T>>,
  ours: FileDropHandlers,
): FileDropHandlers<T> {
  return {
    onDragEnter: composeHandlers(theirs.onDragEnter, ours.onDragEnter),
    onDragOver: composeHandlers(theirs.onDragOver, ours.onDragOver),
    onDragLeave: composeHandlers(theirs.onDragLeave, ours.onDragLeave),
    onDrop: composeHandlers(theirs.onDrop, ours.onDrop),
  };
}
