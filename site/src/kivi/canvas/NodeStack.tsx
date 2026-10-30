import { Children, forwardRef, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../button';
import { cx } from '../utils';
import './canvas.css';

export interface NodeStackProps extends HTMLAttributes<HTMLDivElement> {
  /** 展开：后面的卡铺成格子，间距 8。主图不动，其余依次放右、上、右上，再往右每列两张 */
  expanded?: boolean;
  /** 卡片：第一张是主图，其余按顺序叠在主图后面。每张放一个 NodeCard */
  children?: ReactNode;
}

// 收起时后面每张的旋转，照线上：第 1 张 -4°，第 2 张 4°，第 3 张 -2°，再往后 ±2° 交替
const ROTATE = [-4, 4, -2];
const rotateOf = (i: number) => ROTATE[i] ?? (i % 2 === 0 ? -2 : 2);

// 展开时第 i 张（不算主图）在第几格：x 往右，y 往上为负
function spreadOf(i: number) {
  const preset = [
    [1, 0],
    [0, -1],
    [1, -1],
  ];
  if (i < preset.length) return preset[i];
  const n = i - preset.length;
  return [2 + Math.floor(n / 2), n % 2 === 0 ? 0 : -1];
}

/**
 * 多图节点：一个节点生成了多张图时，主图在前，其余叠在后面；点「张数」展开铺成格子，点哪张就设为主图并收起。
 * Figma「模板 · 画布」的「堆叠」；展开的样子和动效照线上
 */
export const NodeStack = forwardRef<HTMLDivElement, NodeStackProps>(function NodeStack(
  { expanded, className, style, children, ...rest },
  ref,
) {
  const [main, ...others] = Children.toArray(children);
  const total = others.length + 1;
  // 展开、收起的时长是 400ms 的几倍：每多一张加 10ms，最多 700ms（1.75 倍），和参考区一个算法
  const factor = Math.min(1 + others.length / 40, 1.75);
  return (
    <div
      ref={ref}
      className={cx('kv-node-stack', className)}
      data-expanded={expanded ? '' : undefined}
      style={{ '--kv-stack-factor': factor, ...style } as CSSProperties}
      {...rest}
    >
      {others.map((card, i) => {
        const [x, y] = spreadOf(i);
        return (
          <div
            key={i}
            className="kv-node-stack__card"
            aria-hidden={!expanded || undefined}
            // 收起时后面的卡点不到、Tab 也进不去
            ref={(el) => {
              if (el) el.inert = !expanded;
            }}
            style={
              {
                '--kv-i': i + 1,
                '--kv-rotate': `${rotateOf(i)}deg`,
                '--kv-x': x,
                '--kv-y': y,
                zIndex: total - i - 1,
              } as CSSProperties
            }
          >
            {card}
          </div>
        );
      })}
      <div className="kv-node-stack__main" style={{ zIndex: total }}>
        {main}
      </div>
    </div>
  );
});
NodeStack.displayName = 'NodeStack';

export interface NodeStackToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** 一共几张 */
  count: number;
  /** 展开了没有：展开时箭头朝上 */
  expanded?: boolean;
}

/** 主图右上的「张数」按钮：放在节点的按钮条里（Button 小 · 文字），数字 + 下箭头，展开时箭头转到朝上 */
export const NodeStackToggle = forwardRef<HTMLButtonElement, NodeStackToggleProps>(function NodeStackToggle(
  { count, expanded, className, ...rest },
  ref,
) {
  return (
    <Button
      ref={ref}
      rightIcon="DownArrowSmall"
      aria-expanded={!!expanded}
      aria-label={expanded ? `收起 ${count} 张` : `展开 ${count} 张`}
      className={cx('kv-node-stack-toggle', className)}
      {...rest}
    >
      {count}
    </Button>
  );
});
NodeStackToggle.displayName = 'NodeStackToggle';
