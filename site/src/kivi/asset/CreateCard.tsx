import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './asset.css';

export interface CreateCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 文字，比如「新建项目」「创建文件夹」 */
  label: string;
}

/**
 * 新建卡：画布管理页第一格「新建项目」、资产页文件夹区第一格「创建文件夹」。
 * 浅底 + 描边，中间加号 24 和文字 14，悬停底色变亮。大小跟着所在的格子走（11-04 两处统一成一种，线上文件夹那格是虚线）
 */
export const CreateCard = forwardRef<HTMLButtonElement, CreateCardProps>(function CreateCard(
  { label, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('kv-create-card', className)} {...rest}>
      <Icon name="AddSmall" />
      <span>{label}</span>
    </button>
  );
});
CreateCard.displayName = 'CreateCard';
