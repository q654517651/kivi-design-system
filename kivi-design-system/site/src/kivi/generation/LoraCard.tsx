import { forwardRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { ButtonGroup, IconButton } from '../button';
import { Tag } from '../tags-avatar';
import { composeHandlers, useControllable } from '../hooks';
import { cx } from '../utils';
import './generation.css';

export interface LoraCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  /** 名字：底部 14 加粗，悬停时在信息条里 */
  name: string;
  /** 描述：悬停时信息条里，最多两行 */
  description?: string;
  /** 封面地址，铺满 */
  cover: string;
  /** 底模名，左上角标签，比如「FLUX」 */
  base?: string;
  /** 新上线：左上角底模标签旁多一个「New」品牌标签 */
  isNew?: boolean;
  /** 选中：2px 品牌色描边，画在里面。由外面管，点卡片时通过 onClick 通知 */
  selected?: boolean;
  /** 收藏了（受控）。收藏按钮平时隐藏，悬停、聚焦或已收藏时显示 */
  collected?: boolean;
  /** 非受控时初始是否收藏 */
  defaultCollected?: boolean;
  /** 点收藏按钮，参数是新的收藏状态 */
  onCollectedChange?: (collected: boolean) => void;
}

/**
 * 选择弹窗里的一张 Lora 卡，宽跟着网格，3:4。整张卡是一个复选框（Space、Enter 切换），
 * 悬停封面放大 1.05、名字淡出、底部浮出信息条（名字 + 描述）。Figma 还没有，待确认
 */
export const LoraCard = forwardRef<HTMLDivElement, LoraCardProps>(function LoraCard(
  {
    name,
    description,
    cover,
    base,
    isNew,
    selected = false,
    collected: collectedProp,
    defaultCollected = false,
    onCollectedChange,
    className,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const [collected, setCollected] = useControllable(collectedProp, defaultCollected, onCollectedChange);

  return (
    <div
      ref={ref}
      role="checkbox"
      aria-checked={selected}
      aria-label={name}
      tabIndex={0}
      className={cx('kv-lora-card', className)}
      data-selected={selected ? '' : undefined}
      data-collected={collected ? '' : undefined}
      // 只处理卡片自己拿到的按键，焦点在里面的收藏按钮上时留给按钮
      onKeyDown={composeHandlers(onKeyDown, (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        e.currentTarget.click();
      })}
      {...rest}
    >
      <img className="kv-lora-card__cover" src={cover} alt="" draggable={false} />
      {(base || isNew) && (
        <div className="kv-lora-card__tags">
          {base && <Tag variant="on-media">{base}</Tag>}
          {isNew && <Tag variant="brand">New</Tag>}
        </div>
      )}
      <ButtonGroup className="kv-lora-card__actions" aria-label={`${name}操作`}>
        <IconButton
          icon={collected ? 'CollectSolid' : 'Collect'}
          label={collected ? '取消收藏' : '收藏'}
          selected={collected}
          data-collected={collected || undefined}
          onClick={(e) => {
            e.stopPropagation();
            setCollected(!collected);
          }}
        />
      </ButtonGroup>
      <div className="kv-lora-card__name">{name}</div>
      <div className="kv-lora-card__info">
        <div className="kv-lora-card__info-name">{name}</div>
        {description && <div className="kv-lora-card__info-desc">{description}</div>}
      </div>
    </div>
  );
});
LoraCard.displayName = 'LoraCard';
