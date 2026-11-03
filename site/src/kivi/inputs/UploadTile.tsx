import { forwardRef, useRef, type ChangeEvent, type HTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { ButtonGroup, IconButton } from '../button';
import { toast } from '../feedback';
import { Tooltip } from '../menus-tooltip';
import { composeDropHandlers, rejectMessage, useFileDrop, type FileRejectReason } from '../hooks';
import { cx } from '../utils';
import { UploadRing } from './UploadRing';
import './inputs.css';

export type UploadTileStatus = 'empty' | 'uploading' | 'done' | 'error';
export type UploadTileSize = 64 | 96;
/** 失败的样子，三种，待定：outline 红描边 + 重试 / dim 预览变暗 + 重试按钮 / badge 保留预览 + 左上角感叹号 */
export type UploadTileErrorStyle = 'outline' | 'dim' | 'badge';

export interface UploadTileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
  /** 状态：空 / 上传中 / 完成 / 失败，默认空。上传到哪一步由外面管，组件只管样子 */
  status?: UploadTileStatus;
  /** 尺寸：96 / 64，默认 96 */
  size?: UploadTileSize;
  /** 预览图地址。选了文件后用 `URL.createObjectURL` 生成本地预览，传进来；上传中显示变暗的预览，完成显示原图（cover） */
  src?: string;
  /** 上传进度 0–100，上传中显示进度环和百分比。默认 0 */
  progress?: number;
  /** 失败的样子，默认 outline。三种样子还没定，待定 */
  errorStyle?: UploadTileErrorStyle;
  /** 失败原因：outline 里写在重试图标下面，badge 里是左上角感叹号的提示。默认「上传失败」 */
  errorMessage?: string;
  /** 收哪些文件，写法同 `<input accept>`，比如 `image/*`。不传不限 */
  accept?: string;
  /** 空格子一次选几个：true 可多选，默认 false。完成后重新上传只收一个 */
  multiple?: boolean;
  /** 单个文件最大多少字节，超了拒收。不传不限 */
  maxSize?: number;
  /** 禁用：不能点、不能拖 */
  disabled?: boolean;
  /** 拖拽中（受控）。不传由组件自己判断，用 `data-dragover` 表现；文档里摆静态样子用 */
  dragging?: boolean;
  /** 空格子上按钮的说明，读屏用，默认「上传文件」 */
  label?: string;
  /** 选好文件（点选或拖进来）后触发，参数是通过检查的文件列表。空格子用 */
  onSelect?: (files: File[]) => void;
  /** 点完成时的删除 */
  onRemove?: () => void;
  /** 完成时点重新上传、或把文件拖到格子上，选好后触发，参数是新文件 */
  onReplace?: (files: File[]) => void;
  /** 失败时点重试 */
  onRetry?: () => void;
  /** 文件被拒（类型不对、太大）时触发，参数是被拒的文件和原因 */
  onReject?: (files: File[], reason: FileRejectReason) => void;
  /** 被拒时自动弹 toast 提示，默认 true。要自己处理就关掉。页面上要放一个 `<Toaster />` */
  toastOnReject?: boolean;
}

/**
 * 上传格：一个方格装一个文件。空 → 点或拖进文件 → 上传中（暗色预览 + 进度环）→ 完成（原图，悬停出删除、重新上传）/ 失败。
 * 拖文件到空格子或完成的格子上会高亮。Figma 没有，待确认。
 */
export const UploadTile = forwardRef<HTMLDivElement, UploadTileProps>(function UploadTile(
  {
    status = 'empty',
    size = 96,
    src,
    progress = 0,
    errorStyle = 'outline',
    errorMessage = '上传失败',
    accept,
    multiple = false,
    maxSize,
    disabled,
    dragging: draggingProp,
    label = '上传文件',
    onSelect,
    onRemove,
    onReplace,
    onRetry,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const replacing = status === 'done';
  // 空格子、完成的格子能收文件；上传中、失败不收
  const droppable = !disabled && (status === 'empty' || replacing);

  const { dragging, bind, receive } = useFileDrop({
    accept,
    maxSize,
    multiple: !replacing && multiple,
    disabled: !droppable,
    dragging: draggingProp,
    onFiles: (files) => (replacing ? onReplace?.(files) : onSelect?.(files)),
    onReject: (files, reason) => {
      onReject?.(files, reason);
      if (toastOnReject) toast.error(rejectMessage(reason, maxSize));
    },
  });
  const handlers = composeDropHandlers({ onDragEnter, onDragOver, onDragLeave, onDrop }, bind);

  const pick = () => inputRef.current?.click();
  const onPicked = (e: ChangeEvent<HTMLInputElement>) => {
    receive(e.target.files);
    // 清掉，同一个文件再选一次也会触发
    e.target.value = '';
  };

  const preview = Boolean(src) && (status === 'uploading' || status === 'done' || (status === 'error' && errorStyle !== 'outline'));
  const retry = (
    <Tooltip content="重试">
      <IconButton icon="Reset" label="重试" size={28} variant="on-media" onClick={onRetry} />
    </Tooltip>
  );

  return (
    <div
      ref={ref}
      className={cx('kv-upload-tile', `kv-upload-tile--${size}`, className)}
      data-status={status}
      data-error-style={status === 'error' ? errorStyle : undefined}
      data-dragover={dragging && droppable ? '' : undefined}
      aria-disabled={disabled || undefined}
      {...handlers}
      {...rest}
    >
      {preview && <img className="kv-upload-tile__image" src={src} alt="" draggable={false} />}
      {status === 'done' && !src && <Icon name="File" size={24} className="kv-upload-tile__file" />}

      {status === 'empty' && (
        <button type="button" className="kv-upload-tile__trigger" aria-label={label} disabled={disabled} onClick={pick}>
          <Icon name="AddSmall" size={20} />
        </button>
      )}

      {status === 'uploading' && (
        <div className="kv-upload-tile__shade">
          <UploadRing progress={progress} />
        </div>
      )}

      {status === 'done' && (
        <ButtonGroup className="kv-upload-tile__actions" aria-label="文件操作">
          <Tooltip content="删除">
            <IconButton icon="Delete" label="删除" disabled={disabled} onClick={onRemove} />
          </Tooltip>
          <Tooltip content="重新上传">
            <IconButton icon="ReUpload" label="重新上传" disabled={disabled} onClick={pick} />
          </Tooltip>
        </ButtonGroup>
      )}

      {status === 'error' && errorStyle === 'outline' && (
        <button type="button" className="kv-upload-tile__retry" aria-label={`${errorMessage}，点击重试`} disabled={disabled} onClick={onRetry}>
          <Icon name="Reset" size={20} />
          <span>{errorMessage}</span>
        </button>
      )}
      {status === 'error' && errorStyle === 'dim' && <div className="kv-upload-tile__shade">{retry}</div>}
      {status === 'error' && errorStyle === 'badge' && (
        <>
          <Tooltip content={errorMessage}>
            <span className="kv-upload-tile__badge" role="img" aria-label={errorMessage} tabIndex={0} />
          </Tooltip>
          <div className="kv-upload-tile__shade kv-upload-tile__shade--hover">{retry}</div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        accept={accept}
        multiple={!replacing && multiple}
        disabled={disabled}
        onChange={onPicked}
      />
    </div>
  );
});
UploadTile.displayName = 'UploadTile';
