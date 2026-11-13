import {
  Button,
  EmptyState,
  Loading,
  Skeleton,
  type EmptyStateType,
  type EmptyStateSize,
  type LoadingSize,
  type SkeletonVariant,
} from '@kivi';
import { Playground } from '@shell';

// 加载和空态页的属性面板。参数表在 loading-empty.mdx

// ---------- Loading ----------

type LoadingState = { size: string; showText: boolean; text: string };

export function LoadingPlayground() {
  return (
    <Playground<LoadingState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: '16', options: [['16', '小'], ['24', '中'], ['40', '大']] },
        { key: 'showText', label: '显示文字', type: 'toggle', value: true },
        { key: 'text', label: '文字', type: 'text', value: '加载中…' },
      ]}
      rules={(s) => (s.showText ? {} : { text: true })}
      render={(s) => <Loading size={Number(s.size) as LoadingSize}>{s.showText ? s.text : undefined}</Loading>}
    />
  );
}

// ---------- Skeleton ----------

type SkeletonState = { variant: SkeletonVariant };

// 宽高是 Figma 里摆的示意尺寸，不是默认尺寸
const SKELETON_SIZE: Record<SkeletonVariant, { width: number; height?: number }> = {
  rect: { width: 160, height: 90 },
  circle: { width: 32, height: 32 },
  text: { width: 200 },
};

export function SkeletonPlayground() {
  return (
    <Playground<SkeletonState>
      controls={[
        { key: 'variant', label: '形状', type: 'segment', value: 'rect', options: [['rect', '矩形'], ['circle', '圆形'], ['text', '文字行']] },
      ]}
      render={(s) => <Skeleton variant={s.variant} {...SKELETON_SIZE[s.variant]} />}
    />
  );
}

// ---------- EmptyState ----------

type EmptyStateState = { type: EmptyStateType; size: string; title: string; showDesc: boolean; desc: string; action: boolean };

const EMPTY_TYPES: [EmptyStateType, string][] = [['empty', '暂无内容'], ['favorite', '暂无收藏'], ['offline', '无网络'], ['failed', '生成失败']];

export function EmptyStatePlayground() {
  return (
    <Playground<EmptyStateState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'empty', options: EMPTY_TYPES },
        { key: 'size', label: '尺寸', type: 'segment', value: '160', options: [['160', '大'], ['96', '小']] },
        { key: 'title', label: '标题', type: 'text', value: '标题文字' },
        { key: 'showDesc', label: '显示描述', type: 'toggle', value: true },
        { key: 'desc', label: '描述', type: 'text', value: '一句话说清楚下一步做什么' },
        { key: 'action', label: '显示引导操作', type: 'toggle', value: false },
      ]}
      rules={(s) => (s.showDesc ? {} : { desc: true })}
      render={(s) => (
        <EmptyState
          type={s.type}
          size={Number(s.size) as EmptyStateSize}
          title={s.title}
          description={s.showDesc ? s.desc : undefined}
          action={s.action ? <Button variant="secondary-muted">去画布</Button> : undefined}
        />
      )}
    />
  );
}
