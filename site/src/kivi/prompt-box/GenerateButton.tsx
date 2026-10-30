import { forwardRef } from 'react';
import { Button, type ButtonProps } from '../button';

export interface GenerateButtonProps extends Omit<ButtonProps, 'variant' | 'leftIcon' | 'rightIcon' | 'children'> {
  /** 这次生成消耗的猕猴桃数，写在图标右边 */
  cost: number | string;
}

/**
 * 生成按钮：猕猴桃图标加消耗数，品牌渐变底。就是主要类型的 Button，左图标固定 Kiwi，文字固定是消耗数。
 * 默认中号（32），宽度跟着数字走，最小 64。点了等结果时传 loading，条件不满足时传 disabled。
 * Figma「模板 · 主站」页「输入框」分区「生成 · 消耗 99」
 */
export const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(function GenerateButton(
  { cost, size = 'md', 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <Button ref={ref} size={size} variant="primary" leftIcon="Kiwi" aria-label={ariaLabel ?? `生成，消耗 ${cost} 个猕猴桃`} {...rest}>
      {cost}
    </Button>
  );
});
GenerateButton.displayName = 'GenerateButton';
