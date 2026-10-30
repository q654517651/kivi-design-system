import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cx } from '../utils';
import './canvas.css';

export interface ConnectorRemoveProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 出现：悬停或选中连线时 true，其余时候 false（淡出，读屏也读不到）。默认 true */
  visible?: boolean;
  /** 说明，读屏用，默认「删除连线」 */
  label?: string;
}

/** 连线中点的删除按钮：点一下删掉这条线。Figma「画布」页 ConnectorRemove */
export const ConnectorRemove = forwardRef<HTMLButtonElement, ConnectorRemoveProps>(function ConnectorRemove(
  { visible = true, label = '删除连线', type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('kv-connector-remove', className)}
      aria-label={label}
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? undefined : -1}
      {...rest}
    >
      <Icon name="Cutting" />
    </button>
  );
});
ConnectorRemove.displayName = 'ConnectorRemove';
