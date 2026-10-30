import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../utils';
import './agent.css';

export type ActionCardType = 'confirm' | 'auth' | 'error';

export interface ActionCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** 类型：生成确认 / 授权 / 出错，默认生成确认。生成确认、授权样子一样；出错只有一行说明，描边不填底 */
  type?: ActionCardType;
  /** 标题，14 粗。出错没有标题 */
  title?: ReactNode;
  /** 说明，13 tertiary（出错是 secondary）。里面可点的一段用 <a className="kv-action-card__link"> */
  description?: ReactNode;
  /** 操作，靠右：Button 中。生成确认是取消（次要）+ 确认生成（主要），授权是去授权（主要）。出错没有操作 */
  actions?: ReactNode;
}

/** 确认卡片：生成确认（停在输入框的位置）、授权和出错（在消息里）。ref 给根元素，出错是 div，其余是 section。Figma「Agent」页 ActionCard */
export const ActionCard = forwardRef<HTMLElement, ActionCardProps>(function ActionCard(
  { type = 'confirm', title, description, actions, className, ...rest },
  ref,
) {
  if (type === 'error') {
    return (
      <div ref={ref as Ref<HTMLDivElement>} className={cx('kv-action-card', 'kv-action-card--error', className)} role="alert" {...rest}>
        <div className="kv-action-card__desc">{description}</div>
      </div>
    );
  }
  return (
    <section ref={ref} className={cx('kv-action-card', className)} {...rest}>
      <div className="kv-action-card__text">
        <div className="kv-action-card__title">{title}</div>
        <div className="kv-action-card__desc">{description}</div>
      </div>
      {actions && <div className="kv-action-card__actions">{actions}</div>}
    </section>
  );
});
ActionCard.displayName = 'ActionCard';
