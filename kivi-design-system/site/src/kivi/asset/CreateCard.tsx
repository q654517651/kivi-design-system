import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './asset.css';

export type CreateCardVariant = 'default' | 'canvas';

export interface CreateCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 文字，比如「新建项目」「创建文件夹」「新建画布」 */
  label: string;
  /**
   * 样式：默认 / 画布，默认是默认。
   * 画布给创作首页「最近项目」的「新建画布」（11-10 用户定，照即梦）：渐变底 + 点阵，正中白色方块里一个加号，
   * 悬停时点阵像水波一样从中间一圈圈亮着扩散出去，图标不变
   */
  variant?: CreateCardVariant;
}

/**
 * 新建卡：画布管理页第一格「新建项目」、资产页文件夹区第一格「创建文件夹」、创作首页「新建画布」。
 * 默认：浅底 + 描边，中间加号 24 和文字 14，悬停底色变亮。大小跟着所在的格子走（11-04 两处统一成一种，线上文件夹那格是虚线）
 */
export const CreateCard = forwardRef<HTMLButtonElement, CreateCardProps>(function CreateCard(
  { label, variant = 'default', type = 'button', className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-create-card', variant === 'canvas' && 'kv-create-card--canvas', className)} {...rest}>
      {variant === 'canvas' ? (
        <>
          <span className="kv-create-card__mark" aria-hidden>
            <Icon name="AddSmall" />
          </span>
          <span className="kv-create-card__label">{label}</span>
        </>
      ) : (
        <>
          <Icon name="AddSmall" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
});
CreateCard.displayName = 'CreateCard';
