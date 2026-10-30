import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from '../button';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import './agent.css';

export type FileCardType = 'doc' | 'subtitle' | 'audio';

export interface FileCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 类型：文档（md、txt）/ 字幕（srt）/ 音频（mp3 等），默认文档。文档、字幕的操作是预览、下载，音频是播放、下载 */
  type?: FileCardType;
  /** 文件名，一行，超出省略 */
  name: ReactNode;
  /** 信息：创建时间 / 条数 / 时长。生成中固定写「正在撰写…」 */
  meta?: ReactNode;
  /** 生成中：右边换成转圈的 Loading，没有操作。默认否 */
  generating?: boolean;
  /** 点「预览」（文档、字幕） */
  onPreview?: () => void;
  /** 点「播放」（音频） */
  onPlay?: () => void;
  /** 点「下载」 */
  onDownload?: () => void;
}

const ICON: Record<FileCardType, IconName> = { doc: 'File', subtitle: 'Subtitle', audio: 'FileMusic' };

/**
 * Agent 写出来的文件卡，比如剧本、分镜说明、字幕、配音。悬停才出操作，音频的播放常显。Figma「Agent」页 FileCard
 *
 * @deprecated 废弃：平台没有文件卡这个东西，不要用。组件先留着，不删。
 */
export const FileCard = forwardRef<HTMLDivElement, FileCardProps>(function FileCard(
  { type = 'doc', name, meta, generating, onPreview, onPlay, onDownload, className, ...rest },
  ref,
) {
  const reveal = 'kv-file-card__action--reveal';
  return (
    <div ref={ref} className={cx('kv-file-card', className)} tabIndex={0} aria-busy={generating || undefined} {...rest}>
      <span className="kv-file-card__icon">
        <Icon name={ICON[type]} />
      </span>
      <span className="kv-file-card__info">
        <span className="kv-file-card__name">{name}</span>
        <span className="kv-file-card__meta">{generating ? '正在撰写…' : meta}</span>
      </span>
      {generating ? (
        <Icon name="Loading" spin className="kv-file-card__loading" />
      ) : (
        <span className="kv-file-card__actions">
          {type === 'audio' ? (
            <IconButton icon="Play" label="播放" size={28} variant="light" onClick={onPlay} />
          ) : (
            <IconButton icon="Preview" label="预览" size={28} variant="light" className={reveal} onClick={onPreview} />
          )}
          <IconButton icon="Download" label="下载" size={28} variant="light" className={reveal} onClick={onDownload} />
        </span>
      )}
    </div>
  );
});
FileCard.displayName = 'FileCard';
