import { forwardRef, useEffect, useState, type ChangeEvent, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { toast } from '../feedback';
import { composeDropHandlers, rejectMessage, useFileDrop, type FileRejectReason } from '../hooks';
import { cx } from '../utils';
import './inputs.css';

export interface DropzoneProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'onSelect' | 'title' | 'children'> {
  /** 收哪些文件，写法同 `<input accept>`，比如 `image/*,.pdf`。不传不限。提示行会跟着写出来 */
  accept?: string;
  /** 单个文件最大多少字节，超了拒收。不传不限。提示行会跟着写出来 */
  maxSize?: number;
  /** 一次能选几个，默认 true */
  multiple?: boolean;
  /** 禁用：不能点、不能拖 */
  disabled?: boolean;
  /** 标题，默认「拖拽文件到这里，或点击上传」。拖入时固定是「松手上传」，不收时是「不支持这种文件」 */
  title?: ReactNode;
  /** 提示行，12 号 tertiary。不传就按 `accept`、`maxSize` 写，比如「支持 图片，单个文件不超过 10 MB」；都没有就不显示 */
  hint?: ReactNode;
  /** 拖拽中（受控）。不传由组件自己判断，用 `data-dragover` 表现；文档里摆静态样子用 */
  dragging?: boolean;
  /** 拖进来的东西不收（受控）。不传由组件根据 `accept` 判断；文档里摆静态样子用 */
  rejected?: boolean;
  /** 选好文件（点选或拖进来）后触发，参数是通过检查的文件列表 */
  onSelect?: (files: File[]) => void;
  /** 文件被拒（类型不对、太大）时触发，参数是被拒的文件和原因 */
  onReject?: (files: File[], reason: FileRejectReason) => void;
  /** 被拒时自动弹 toast（「不支持这种文件」「文件超过 N MB」），默认 true。要自己处理就关掉。页面上要放一个 `<Toaster />` */
  toastOnReject?: boolean;
}

const KIND_NAME: Record<string, string> = { 'image/*': '图片', 'video/*': '视频', 'audio/*': '音频' };

/** 把 accept 写成人话：image/* → 图片，.pdf → PDF，image/png → PNG */
function describeAccept(accept?: string): string {
  const names = (accept ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((r) => KIND_NAME[r] ?? (r.startsWith('.') ? r.slice(1) : (r.split('/')[1] ?? r)).toUpperCase());
  return Array.from(new Set(names)).join('、');
}

const mb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/** 拒收后，不收的样子多留这么久（毫秒） */
const REJECT_FLASH = 1500;

/**
 * 拖拽上传区：整块能点、能拖文件进来。默认 / 悬停 / 拖入 / 不收 / 禁用。Figma 没有，待确认。
 * 文件不对时默认弹 toast，页面上要放一个 `<Toaster />`。
 */
export const Dropzone = forwardRef<HTMLLabelElement, DropzoneProps>(function Dropzone(
  {
    accept,
    maxSize,
    multiple = true,
    disabled,
    title,
    hint,
    dragging: draggingProp,
    rejected: rejectedProp,
    onSelect,
    onReject,
    toastOnReject = true,
    className,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    ...rest
  },
  ref,
) {
  // 刚放下的文件被拒：不收的样子再留一会儿
  const [flash, setFlash] = useState<FileRejectReason | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), REJECT_FLASH);
    return () => clearTimeout(t);
  }, [flash]);

  const { dragging, rejected, bind, receive } = useFileDrop({
    accept,
    maxSize,
    multiple,
    disabled,
    dragging: draggingProp,
    rejected: rejectedProp,
    onFiles: onSelect,
    onReject: (files, reason) => {
      setFlash(reason);
      onReject?.(files, reason);
      if (toastOnReject) toast.error(rejectMessage(reason, maxSize));
    },
  });
  const handlers = composeDropHandlers({ onDragEnter, onDragOver, onDragLeave, onDrop }, bind);

  const refused = !disabled && ((dragging && rejected) || flash !== null);
  const active = !disabled && dragging && !rejected;
  const autoHint = [accept ? `支持 ${describeAccept(accept)}` : '', maxSize != null ? `单个文件不超过 ${mb(maxSize)} MB` : ''].filter(Boolean).join('，');
  const shownHint = hint ?? (autoHint || undefined);

  const onPicked = (e: ChangeEvent<HTMLInputElement>) => {
    receive(e.target.files);
    e.target.value = '';
  };

  return (
    <label
      ref={ref}
      className={cx('kv-dropzone', className)}
      data-dragover={active ? '' : undefined}
      data-rejected={refused ? '' : undefined}
      aria-disabled={disabled || undefined}
      {...handlers}
      {...rest}
    >
      <input className="kv-dropzone__input" type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={onPicked} />
      <Icon name="Upload" size={24} />
      <span className="kv-dropzone__title">{refused ? rejectMessage(dragging ? 'type' : (flash ?? 'type'), maxSize) : active ? '松手上传' : (title ?? '拖拽文件到这里，或点击上传')}</span>
      {shownHint != null && shownHint !== false && <span className="kv-dropzone__hint">{shownHint}</span>}
    </label>
  );
});
Dropzone.displayName = 'Dropzone';
