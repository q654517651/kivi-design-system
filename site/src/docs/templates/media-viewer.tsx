import { useRef, type ReactNode } from 'react';
import { Avatar, Dialog, Divider, IconButton, VideoPlayer } from '@kivi';

/*
  全站查看大图（11-11 用户定：都和探索页的作品详情一样）。照线上 CardDetailModal 铺满窗口：
  左边作品（完整显示），竖线，右边 440 的信息栏：头（作者或自己 + 日期）和操作、关闭，横线，内容（自己滚），最下面可放一个按钮。
  探索页、创作页记录流、AI 工具历史、资产页生成历史都用它，只填各自的信息。只在模板里拼，不进组件库。
*/

export interface ViewerMedia {
  type: 'image' | 'video';
  src: string;
  /** 视频封面 */
  poster?: string;
  alt?: string;
}

/** 关的时候弹窗还在淡出，内容留着上一次的，不闪空 */
export function useLastShown<T>(value: T | null) {
  const last = useRef(value);
  if (value !== null) last.current = value;
  return value ?? last.current;
}

export interface MediaViewerProps {
  /** 要看的图或视频，null 就是关着 */
  media: ViewerMedia | null;
  onClose: () => void;
  /** 头左边：作者（或自己）+ 日期，用 ViewerAuthor */
  head?: ReactNode;
  /** 头右边、关闭前面的操作：下载、收藏这类，IconButton 次要 36 */
  actions?: ReactNode;
  /** 内容：一节一节的 ViewerSection */
  children?: ReactNode;
  /** 最下面撑满宽的按钮（探索页是点赞），可以不放 */
  footer?: ReactNode;
}

export function MediaViewer({ media, onClose, head, actions, children, footer }: MediaViewerProps) {
  const shown = useLastShown(media);
  return (
    <Dialog size="full" aria-label="查看大图" open={media !== null} onOpenChange={(v) => !v && onClose()}>
      {shown && (
        <div className="tpl-viewer">
          <div className="tpl-viewer__media">
            {shown.type === 'video' ? (
              <VideoPlayer variant="preview" src={shown.src} poster={shown.poster} autoPlay loop />
            ) : (
              <img src={shown.src} alt={shown.alt ?? ''} />
            )}
          </div>
          <Divider orientation="vertical" />
          <aside className="tpl-viewer__info">
            <header className="tpl-viewer__head">
              {head ?? <span />}
              <span className="tpl-viewer__actions">
                {actions}
                <IconButton icon="Close" label="关闭" variant="secondary" size={36} onClick={onClose} />
              </span>
            </header>
            <Divider />
            <div className="tpl-viewer__body">{children}</div>
            {footer && <div className="tpl-viewer__footer">{footer}</div>}
          </aside>
        </div>
      )}
    </Dialog>
  );
}

/** 头左边：头像 32 + 名字 / 日期 */
export function ViewerAuthor({ name, avatar, date }: { name: string; avatar?: string; date: string }) {
  return (
    <span className="tpl-viewer__author">
      <Avatar name={name} src={avatar} size={32} />
      <span>
        <span className="tpl-viewer__name">{name}</span>
        <span className="tpl-viewer__date">{date}</span>
      </span>
    </span>
  );
}

/** 信息栏里的一节：小标题 + 内容 */
export function ViewerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tpl-viewer__section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}
