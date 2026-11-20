import { forwardRef, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Button, type ButtonProps } from '../button';
import { Popover } from '../tooltip/Popover';
import { cx } from '../utils';
import { usePending } from '../hooks';

export interface GenerateButtonProps extends Omit<ButtonProps, 'variant' | 'leftIcon' | 'rightIcon' | 'children'> {
  /** 这次生成消耗的猕猴桃数，写在图标右边 */
  cost: number | string;
  /**
   * 现在不能生成的原因，比如「请输入画面描述」「请至少上传 1 个视频」。传了按钮置灰、点了不触发，
   * 悬停、键盘聚焦时上面出 Popover 提示写这句（11-17 用户定）。用 aria-disabled 不用 disabled，禁用的按钮收不到悬停
   */
  disabledReason?: ReactNode;
  /**
   * 任务已经提交、正在生成（画布用，11-19 照线上 generate-btn）：按钮变停止，宽度不变。
   * 传了 onStop 和 stopStartedAt，从 stopStartedAt 起 stopWindow（默认 10 秒）内是「可停止」：环从 12 点起匀速收完、中间方块，点了停止；
   * 过了窗口、没传开始时间都是「已锁定」：禁用样子 + 实心圆里挖方块，悬停上面出「任务生成中不能停止」。
   * 不传 onStop 的地方（主站）照旧只置灰
   */
  generating?: boolean;
  /** 拿到任务号的时间（Date.now()），可停止倒计时从这里起 */
  stopStartedAt?: number;
  /** 可停止的时长，毫秒，默认 10000 */
  stopWindow?: number;
  /** 点了停止。返回 Promise 时等它的这段只转圈（取消中）、不能点 */
  onStop?: () => unknown;
}

const RING_R = 8;
const RING_LEN = 2 * Math.PI * RING_R;

/** 可停止：20 的环（粗 2.5，同 Loading 转圈的粗细规则）+ 中间 5 的圆角方块。按挂载时已经过去的时长续上动画，重渲染不重来 */
function CountdownStop({ startedAt, window }: { startedAt: number; window: number }) {
  const [elapsed] = useState(() => Math.max(0, Date.now() - startedAt));
  return (
    <svg className="kv-generate-button__stop" viewBox="0 0 20 20" aria-hidden>
      <circle className="kv-generate-button__track" cx="10" cy="10" r={RING_R} />
      <circle
        className="kv-generate-button__ring"
        cx="10"
        cy="10"
        r={RING_R}
        strokeDasharray={RING_LEN}
        style={{ animationDuration: `${window}ms`, animationDelay: `-${elapsed}ms` }}
      />
      <rect x="7.5" y="7.5" width="5" height="5" rx="1.5" />
    </svg>
  );
}

/** 已锁定：实心圆里挖掉方块（透出按钮底），颜色跟禁用文字 */
function LockedStop() {
  return (
    <svg className="kv-generate-button__stop" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" d="M10 1a9 9 0 1 1 0 18a9 9 0 0 1 0-18ZM9 7.5a1.5 1.5 0 0 0-1.5 1.5v2a1.5 1.5 0 0 0 1.5 1.5h2a1.5 1.5 0 0 0 1.5-1.5v-2a1.5 1.5 0 0 0-1.5-1.5Z" />
    </svg>
  );
}

/**
 * 生成按钮：猕猴桃图标加消耗数，品牌渐变底。就是主要类型的 Button，左图标固定 Kiwi，文字固定是消耗数。
 * 默认中号（32），宽度跟着数字走，最小 64。点了等结果时传 loading，或者让 onClick 返回请求的 Promise：等它的这段时间只在正中转圈（不显示猕猴桃和数字，宽度不变）、不能重复点；条件不满足时传 disabledReason（置灰 + 悬停说为什么），
 * 不用说原因的才直接传 disabled。画布里生成中传 generating + onStop + stopStartedAt，按钮变停止（10 秒内可停止，过了锁定）。
 * Figma「模板 · 主站」页「输入框」分区「生成 · 消耗 99」
 */
export const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(function GenerateButton(
  { cost, size = 32, disabledReason, onClick, loading, generating, stopStartedAt, stopWindow = 10000, onStop, className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  const blocked = disabledReason != null && disabledReason !== false && disabledReason !== '';
  const [pending, run] = usePending();
  const [stopping, runStop] = usePending();
  // 可停止窗口：到点自己换成已锁定
  const stopMode = !!generating && !!onStop;
  const left = stopMode && stopStartedAt != null ? stopStartedAt + stopWindow - Date.now() : 0;
  const [expired, setExpired] = useState(left <= 0);
  useEffect(() => {
    setExpired(left <= 0);
    if (left <= 0) return;
    const t = setTimeout(() => setExpired(true), left);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMode, stopStartedAt, stopWindow]);

  if (stopMode) {
    const locked = expired && !stopping;
    const stopButton = (
      <Button
        ref={ref}
        size={size}
        variant="primary"
        leftIcon="Kiwi"
        className={cx('kv-generate-button', className)}
        data-stop={locked ? 'locked' : 'countdown'}
        aria-label={locked ? '生成中' : '停止生成'}
        loading={stopping}
        aria-disabled={locked || undefined}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          if (!locked) runStop(() => onStop?.());
        }}
        {...rest}
      >
        {/* 消耗数还在、只是看不见：撑着按钮宽度不变 */}
        {cost}
        {!stopping && (locked ? <LockedStop /> : <CountdownStop key={stopStartedAt} startedAt={stopStartedAt ?? Date.now()} window={stopWindow} />)}
      </Button>
    );
    return locked ? (
      <Popover content="任务生成中不能停止" placement="top">
        {stopButton}
      </Popover>
    ) : (
      stopButton
    );
  }
  const button = (
    <Button
      ref={ref}
      size={size}
      variant="primary"
      leftIcon="Kiwi"
      className={cx('kv-generate-button', className)}
      aria-label={ariaLabel ?? `生成，消耗 ${cost} 个猕猴桃`}
      loading={loading || pending}
      aria-disabled={blocked || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        // 置灰时点了（含 Enter、Space）什么都不做，连表单提交一起挡住
        if (blocked) return e.preventDefault();
        run(() => (onClick as ((e: MouseEvent<HTMLButtonElement>) => unknown) | undefined)?.(e));
      }}
      {...rest}
    >
      {cost}
    </Button>
  );
  if (!blocked) return button;
  return (
    <Popover content={disabledReason} placement="top">
      {button}
    </Popover>
  );
});
GenerateButton.displayName = 'GenerateButton';
