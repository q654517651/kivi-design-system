import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { Button, Checkbox, EmptyState, IconButton, ScrollArea, Skeleton, Tooltip } from '@kivi';
import { cx } from '@kivi/utils';
import { listDelay } from '../../data/api';
import { demo } from '../../data/demo';
import './kiwi.css';

/*
  猕猴桃管理（11-27 原型）用的几块：表格、分页、额度条、统计格、趋势图、加载状态。
  组件库里还没有表格、分页、进度条、图表，用户说先搭原型、组件定了再做（11-27），
  所以先写在这里（类名 app-kw-），样子都是临时的，设计师会再调；定了再收进 src/kivi/。
*/

// ---------- 加载 ----------

export type LoadStatus = 'loading' | 'ready' | 'error';

/** 换范围、筛选时假装请求一次：先骨架屏，断网开着就是请求失败（能重试，筛选不清） */
export function useLoad(deps: unknown[]) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setStatus('loading');
    const t = setTimeout(() => setStatus(demo.get().offline ? 'error' : 'ready'), listDelay());
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { status, retry: () => setTick((n) => n + 1) };
}

// ---------- 表格 ----------

export interface Column<T> {
  key: string;
  title: ReactNode;
  /** 列宽，不写自适应 */
  width?: number;
  align?: 'left' | 'right';
  /** 固定宽，不跟着表格变宽（比如最右边的「⋯」） */
  fixed?: boolean;
  render: (row: T) => ReactNode;
}

export interface KwTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** 能勾选：传已勾选的 id 和改勾选的回调 */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  status?: LoadStatus;
  onRetry?: () => void;
  empty?: ReactNode;
  /** 骨架屏几行 */
  skeletonRows?: number;
}

export function KwTable<T>({ columns, rows, rowKey, selected, onSelectedChange, onRowClick, status = 'ready', onRetry, empty = '暂无数据', skeletonRows = 8 }: KwTableProps<T>) {
  const selectable = !!selected && !!onSelectedChange;
  const ids = rows.map(rowKey);
  const checkedCount = selectable ? ids.filter((id) => selected!.includes(id)).length : 0;
  const allState = checkedCount === 0 ? false : checkedCount === ids.length ? true : 'mixed';
  const toggleAll = () => {
    if (!selectable) return;
    onSelectedChange!(allState === true ? selected!.filter((id) => !ids.includes(id)) : [...new Set([...selected!, ...ids])]);
  };
  const toggle = (id: string) => onSelectedChange?.(selected!.includes(id) ? selected!.filter((x) => x !== id) : [...selected!, id]);
  // 列宽：写的宽度是最小值，表格比内容宽时按宽度的比例分掉多出来的（撑满整行，不在右边留空，11-27 用户说）
  const template = [selectable ? '40px' : '', ...columns.map((c) => (c.fixed ? `${c.width ?? 64}px` : `minmax(${c.width ?? 160}px, ${c.width ?? 160}fr)`))].filter(Boolean).join(' ');

  let body: ReactNode;
  if (status === 'loading') {
    body = Array.from({ length: skeletonRows }, (_, i) => (
      <div key={i} className="app-kw-table__row" style={{ gridTemplateColumns: template }}>
        {selectable && <span />}
        {columns.map((c) => (
          <span key={c.key} className="app-kw-table__cell">
            <Skeleton variant="text" width="60%" />
          </span>
        ))}
      </div>
    ));
  } else if (status === 'error') {
    body = (
      <div className="app-kw-table__state">
        <EmptyState
          type="offline"
          size={96}
          title="加载失败"
          description="网络开小差了，筛选条件已保留"
          action={
            <Button size={32} variant="secondary" onClick={onRetry}>
              重试
            </Button>
          }
        />
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className="app-kw-table__state">
        <EmptyState type="empty" size={96} title={empty} />
      </div>
    );
  } else {
    body = rows.map((row) => {
      const id = rowKey(row);
      return (
        <div
          key={id}
          className="app-kw-table__row"
          style={{ gridTemplateColumns: template }}
          data-clickable={onRowClick ? '' : undefined}
          data-selected={selectable && selected!.includes(id) ? '' : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
        >
          {selectable && (
            <span className="app-kw-table__cell" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selected!.includes(id)} onChange={() => toggle(id)} aria-label="勾选" />
            </span>
          )}
          {columns.map((c) => (
            <span key={c.key} className="app-kw-table__cell" data-align={c.align}>
              {c.render(row)}
            </span>
          ))}
        </div>
      );
    });
  }

  return (
    <ScrollArea orientation="horizontal" className="app-kw-table">
      <div className="app-kw-table__inner" role="table">
        <div className="app-kw-table__row app-kw-table__head" style={{ gridTemplateColumns: template }} role="row">
          {selectable && (
            <span className="app-kw-table__cell">
              <Checkbox checked={allState} onChange={toggleAll} disabled={status !== 'ready' || !rows.length} aria-label="全选本页" />
            </span>
          )}
          {columns.map((c) => (
            <span key={c.key} className="app-kw-table__cell" data-align={c.align}>
              {c.title}
            </span>
          ))}
        </div>
        {body}
      </div>
    </ScrollArea>
  );
}

// ---------- 一页几行 ----------

/**
 * 一页放几行：按窗口高度算，表格正好铺到分页条（11-27 用户说：人多的时候下面要撑满）。
 * ref 挂在表格外面那层上，量它离窗口顶多远；扣掉表头、分页条和底部留白，除以行高。窗口变了跟着算。
 */
export function useFitRows(ref: RefObject<HTMLElement>, { rowHeight = 52, reserve = 44 + 44 + 32, min = 5 } = {}) {
  const [rows, setRows] = useState(10);
  useLayoutEffect(() => {
    const calc = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setRows(Math.max(min, Math.floor((window.innerHeight - top - reserve) / rowHeight)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [ref, rowHeight, reserve, min]);
  return rows;
}

// ---------- 分页 ----------

export function Pager({ total, page, pageSize, onChange }: { total: number; page: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return total ? <div className="app-kw-pager">共 {total} 条</div> : null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="app-kw-pager">
      <span>共 {total} 条</span>
      <IconButton icon="LeftArrowSmall" label="上一页" variant="ghost-muted" size={28} disabled={page <= 1} onClick={() => onChange(page - 1)} />
      {nums.map((n, i) => (
        <span key={n} className="app-kw-pager__nums">
          {i > 0 && n - nums[i - 1] > 1 && <span className="app-kw-pager__gap">…</span>}
          <Button size={28} variant={n === page ? 'secondary' : 'ghost-muted'} onClick={() => onChange(n)}>
            {n}
          </Button>
        </span>
      ))}
      <IconButton icon="RightArrowSmall" label="下一页" variant="ghost-muted" size={28} disabled={page >= pages} onClick={() => onChange(page + 1)} />
    </div>
  );
}

export const pageOf = <T,>(list: T[], page: number, size: number) => list.slice((page - 1) * size, page * size);

// ---------- 额度条 ----------

export interface BarPart {
  label: string;
  value: number;
  tone: 'used' | 'week' | 'temp';
}

/** 一条横条按段铺开：已用 / 周剩余 / 临时剩余；下面一排图例 */
export function QuotaBar({ parts, className }: { parts: BarPart[]; className?: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <div className={cx('app-kw-bar', className)}>
      <div className="app-kw-bar__track">
        {parts.map((p) => (p.value > 0 ? <span key={p.label} data-tone={p.tone} style={{ flexGrow: p.value / total }} /> : null))}
      </div>
      <div className="app-kw-bar__legend">
        {parts.map((p) => (
          <span key={p.label} data-tone={p.tone}>
            {p.label} {p.value.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- 统计格 ----------

export function Stats({ items }: { items: { label: ReactNode; value: ReactNode; hint?: ReactNode }[] }) {
  return (
    <dl className="app-kw-stats">
      {items.map((it, i) => (
        <div key={i}>
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
          {it.hint && <p>{it.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

// ---------- 趋势图 ----------

/** 每天一根柱子，悬停看当天消耗；没数据的天是一条底线 */
export function TrendChart({ data }: { data: { label: string; value: number; tip: ReactNode }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 14 ? Math.ceil(data.length / 8) : 1;
  return (
    <div className="app-kw-trend">
      <div className="app-kw-trend__bars">
        {data.map((d, i) => (
          <Tooltip key={i} content={d.tip} className="app-kw-trend__tip">
            <span className="app-kw-trend__col" tabIndex={0}>
              <span className="app-kw-trend__bar" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} data-empty={d.value ? undefined : ''} />
            </span>
          </Tooltip>
        ))}
      </div>
      <div className="app-kw-trend__axis">
        {data.map((d, i) => (
          <span key={i}>{i % step === 0 ? d.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- 下载 ----------

/** 导出表格：原型先出 CSV（Excel 能直接开），正式版是 .xlsx */
export function downloadCsv(name: string, header: string[], rows: (string | number)[][], meta: string[] = []) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [...meta.map((m) => esc(m)), ...(meta.length ? [''] : []), header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** 2026-11-27 14:05 */
export function fmtTime(t: number, withTime = true) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return withTime ? `${date} ${p(d.getHours())}:${p(d.getMinutes())}` : date;
}
