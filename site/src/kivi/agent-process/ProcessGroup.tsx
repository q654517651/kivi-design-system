import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { useControllable, useScrollFade } from '../hooks';
import { Collapse } from '../collapse';
import { ProcessRow, type ProcessRowStatus } from './ProcessRow';
import './agent-process.css';

export interface ProcessStep {
  /** 唯一标识，不传用下标 */
  id?: string;
  /** 图标，常用 UseCanvas、Skill、Message */
  icon?: IconName;
  /** 动作文字，比如「创建节点」 */
  action: ReactNode;
  /** 对象文字，比如「分镜脚本」，比动作淡一档。不加引号，颜色已经分开了 */
  object?: ReactNode;
  /** 状态：进行中 / 完成 / 失败，默认完成 */
  status?: ProcessRowStatus;
}

export interface ProcessGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 这一组调用的工具，按调用顺序，最后一个是当前在调的。Agent 两段话之间连续调的工具算一组 */
  steps: ProcessStep[];
  /** 还在调用中。不传看最后一个工具是不是进行中 */
  running?: boolean;
  /** 做完后汇总行的图标，默认 Tool */
  icon?: IconName;
  /** 展开：受控。只有做完、调了 2 个及以上才能展开 */
  expanded?: boolean;
  /** 展开：非受控的初始值，默认收起（做完也不自动展开） */
  defaultExpanded?: boolean;
  /** 展开 / 收起时触发 */
  onExpandedChange?: (expanded: boolean) => void;
}

const SUMMARY = -1; // 显示汇总行
const MIN_STAY = 300; // 每个工具最少停 0.3 秒，太快了一行会闪
const ROW = 20; // 一行高
const GAP = 6; // 行距，也是列表和汇总行的间距
const LIST_MAX = 160;

/** 读 tokens.css 里的时长（系统开了减少动态效果时是 0） */
function cssMs(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 一组工具调用：进行中只占一行，显示当前在调的工具，换下一个时往上滚；停留超过 0.5 秒扫光。
 * 全部做完换成「调用了 N 个工具」（有失败的写「M 个失败」），不自动展开，悬停出箭头，点开列出每个工具。只调了 1 个就直接显示那一个。
 * 交互照 Codex、Claude，Figma 还没有。Agent 的文字回复不折叠，夹在两组之间照常显示。
 */
export const ProcessGroup = forwardRef<HTMLDivElement, ProcessGroupProps>(function ProcessGroup(
  { steps, running: runningProp, icon = 'Tool', expanded: expandedProp, defaultExpanded = false, onExpandedChange, className, ...rest },
  ref,
) {
  const count = steps.length;
  const running = runningProp ?? steps[count - 1]?.status === 'running';
  const target = running ? count - 1 : SUMMARY;

  const [shown, setShown] = useState(target);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [rolled, setRolled] = useState(false); // 刚挂上时直接显示，换过一次才播进来的动画
  const lastSwitch = useRef(0);
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const listId = useId();
  const list = useScrollFade<HTMLDivElement>();

  useEffect(() => {
    lastSwitch.current = performance.now();
  }, []);

  // 开始新一轮调用（做完又来了新工具）：列表要卸载了，展开状态复位成收起，做完不会自己又展开
  const wasRunning = useRef(running);
  useEffect(() => {
    if (running && !wasRunning.current && expanded) setExpanded(false);
    wasRunning.current = running;
  }, [running, expanded, setExpanded]);

  // 换到最新的那个：离上次换不到 0.3 秒就等够再换，等的时候又来了新的，直接换到新的
  useEffect(() => {
    if (target === shown) return;
    const wait = Math.max(0, lastSwitch.current + MIN_STAY - performance.now());
    const t = window.setTimeout(() => {
      lastSwitch.current = performance.now();
      setLeaving(shown);
      setShown(target);
      setRolled(true);
    }, wait);
    return () => window.clearTimeout(t);
  }, [target, shown]);

  // 出去的那行播完就拿掉；动画事件没来（比如时长是 0）也按时拿掉
  useEffect(() => {
    if (leaving === null) return;
    const t = window.setTimeout(() => setLeaving(null), cssMs('--motion-duration-200', 200) + 50);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (!count) return null;

  const failed = steps.filter((s) => s.status === 'failed').length;
  const canExpand = shown === SUMMARY && count > 1;
  // 展开收起要走的距离，按它取时长
  const listHeight = GAP + Math.min(LIST_MAX, count * ROW + (count - 1) * GAP);

  const line = (key: number) => {
    if (key !== SUMMARY) {
      const s = steps[Math.min(key, count - 1)];
      return <ProcessRow icon={s.icon} action={s.action} object={s.object} status={s.status} arrow={false} />;
    }
    if (count === 1) {
      const s = steps[0];
      return <ProcessRow icon={s.icon} action={s.action} object={s.object} status={s.status === 'running' ? 'done' : s.status} arrow={false} />;
    }
    return (
      <ProcessRow
        icon={icon}
        action={failed ? `调用了 ${count} 个工具，` : `调用了 ${count} 个工具`}
        object={failed ? <span className="kv-process-group__failed">{failed} 个失败</span> : undefined}
        expanded={expanded}
        onExpandedChange={setExpanded}
        aria-controls={listId}
      />
    );
  };

  const keyOf = (k: number) => (k === SUMMARY ? 'summary' : steps[k]?.id ?? String(k));

  return (
    <div ref={ref} className={cx('kv-process-group', className)} {...rest}>
      <div className="kv-process-group__line" data-rolling={leaving !== null ? '' : undefined}>
        {leaving !== null && (
          <div key={`out-${keyOf(leaving)}`} className="kv-process-group__slot" data-leave="" aria-hidden="true" onAnimationEnd={() => setLeaving(null)}>
            {line(leaving)}
          </div>
        )}
        <div key={`in-${keyOf(shown)}`} className="kv-process-group__slot" data-enter={rolled ? '' : undefined}>
          {line(shown)}
        </div>
      </div>
      {canExpand && (
        <Collapse expanded={expanded} distance={listHeight} gap={6}>
          <div ref={list.ref} id={listId} className="kv-process-list" data-fade={list.fade} onScroll={list.onScroll}>
            {steps.map((s, i) => (
              <ProcessRow key={s.id ?? i} level="sub" icon={s.icon} action={s.action} object={s.object} status={s.status} />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
});
ProcessGroup.displayName = 'ProcessGroup';
