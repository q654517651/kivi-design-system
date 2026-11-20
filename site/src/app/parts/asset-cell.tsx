import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { ButtonGroup, Icon, IconButton, useTooltip, type IconName } from '@kivi';
import { composeHandlers, useMergedRef, useTruncated } from '@kivi/hooks';

/*
  素材格子的公共零件（资产页、画布「历史」、AI 工具历史共用）：
  - AudioCell：音频素材的格子，正方形、Light 1 底，音符 + 名字 + 时长。能聚焦，Enter / 空格打开；名字截断了悬停出 Tooltip；
    悬停（聚焦）出右上按钮条（操作、收藏）和右下快捷操作，和同页的图片格（ResultTile）一样。
  - activateProps：给图片 / 视频格（ResultTile）补键盘打开：焦点在格子本身时 Enter / 空格等于点击，焦点在格子里的按钮上不管。
*/

export interface AudioCellAction {
  icon: IconName;
  /** 说明，读屏和 Tooltip 用 */
  label: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface AudioCellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** 音频名字，放不下末尾省略号，悬停看全文 */
  name?: string;
  /** 时长，比如 0:12 */
  duration?: string;
  /** 打开（看大图）：点格子、Enter、空格。不传（批量勾选中）就不可点、不可聚焦 */
  onOpen?: () => void;
  /** 右上操作，悬停才出 */
  topActions?: AudioCellAction[];
  /** 右上按钮条最后放收藏 */
  collect?: boolean;
  collected?: boolean;
  onCollectedChange?: (collected: boolean) => void;
  /** 右下快捷操作，悬停才出 */
  quickActions?: AudioCellAction[];
}

export const AudioCell = forwardRef<HTMLDivElement, AudioCellProps>(function AudioCell(
  { name, duration, onOpen, topActions, collect, collected, onCollectedChange, quickActions, className, onKeyDown, ...rest },
  ref,
) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const truncated = useTruncated(labelRef, [name]);
  const tip = useTooltip({ content: name, disabled: !truncated });
  const setRef = useMergedRef(tip.anchorRef as React.Ref<HTMLDivElement>, ref);
  const hasTop = !!topActions?.length || collect;
  return (
    <>
      <div
        ref={setRef}
        className={['tpl-as__audio', className].filter(Boolean).join(' ')}
        data-openable={onOpen ? '' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        aria-describedby={tip.describedBy}
        onClick={(e) => onOpen && !(e.target as HTMLElement).closest('button') && onOpen()}
        onKeyDown={composeHandlers(onKeyDown, (e: KeyboardEvent<HTMLDivElement>) => {
          if (!onOpen || e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onOpen();
        })}
        onMouseEnter={tip.handlers.onMouseEnter}
        onMouseLeave={tip.handlers.onMouseLeave}
        onFocus={tip.handlers.onFocus}
        onBlur={tip.handlers.onBlur}
        {...rest}
      >
        <Icon name="Music" size={24} />
        <span ref={labelRef} className="tpl-as__audio-name">
          {name}
        </span>
        {duration && <span className="tpl-as__audio-time">{duration}</span>}
        {hasTop && (
          <ButtonGroup className="tpl-as__audio-actions tpl-as__audio-actions--top" aria-label="操作">
            {topActions?.map((a) => (
              <IconButton key={a.icon} icon={a.icon} label={a.label} onClick={a.onClick} />
            ))}
            {collect && (
              <IconButton
                icon={collected ? 'CollectSolid' : 'Collect'}
                label={collected ? '取消收藏' : '收藏'}
                selected={collected}
                data-collected={collected || undefined}
                onClick={() => onCollectedChange?.(!collected)}
              />
            )}
          </ButtonGroup>
        )}
        {collect && collected && (
          <ButtonGroup className="tpl-as__audio-pin" aria-hidden>
            <IconButton icon="CollectSolid" label="已收藏" selected data-collected tabIndex={-1} />
          </ButtonGroup>
        )}
        {!!quickActions?.length && (
          <ButtonGroup className="tpl-as__audio-actions tpl-as__audio-actions--quick" aria-label="快捷操作">
            {quickActions.map((a) => (
              <IconButton key={a.icon} icon={a.icon} label={a.label} onClick={a.onClick} />
            ))}
          </ButtonGroup>
        )}
      </div>
      {tip.bubble}
    </>
  );
});
AudioCell.displayName = 'AudioCell';

/** 图片 / 视频格补键盘打开：格子本身有焦点时 Enter、空格 = 点击（打开）；焦点在里面的按钮、播放器上不抢 */
export function activateProps(open: (() => void) | undefined) {
  if (!open) return {};
  return {
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      open();
    },
  };
}
