import { useEffect, useRef } from 'react';
import {
  Button,
  EmptyState,
  Loading,
  Skeleton,
  Toast,
  Toaster,
  toast,
  type EmptyStateScene,
  type EmptyStateSize,
  type LoadingSize,
  type SkeletonShape,
  type ToastType,
} from '@kivi';
import { Playground } from '@shell';

// 反馈页的属性面板和 Toast 的演示舞台。参数表在 feedback.mdx

// ---------- Toast ----------

type ToastState = { type: ToastType; text: string; action: boolean; actionText: string };

export function ToastPlayground() {
  return (
    <Playground<ToastState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'info', options: [['info', '信息'], ['success', '成功'], ['warning', '警告'], ['error', '错误'], ['loading', '加载中']] },
        { key: 'text', label: '文字', type: 'text', value: '提示文字' },
        { key: 'action', label: '显示操作', type: 'toggle', value: false },
        { key: 'actionText', label: '操作文字', type: 'text', value: '撤销' },
      ]}
      rules={(s) => (s.action ? {} : { actionText: true })}
      render={(s) => (
        <Toast type={s.type} action={s.action ? s.actionText : undefined}>
          {s.text}
        </Toast>
      )}
    />
  );
}

/**
 * 点出来试试：Toast 固定在舞台顶部居中，不跑到真的屏幕顶上。
 * 项目里 Toaster 放在应用根上就是屏幕顶部，这里只是把它框在舞台里（position: absolute）。
 */
export function ToastStage() {
  const timer = useRef<number>();
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      toast.hide();
    },
    [],
  );

  const upload = () => {
    window.clearTimeout(timer.current);
    const id = toast.show({
      type: 'loading',
      text: '正在上传 3 张图片',
      action: '取消',
      onAction: () => window.clearTimeout(timer.current),
    });
    // 加载中结束后换成成功
    timer.current = window.setTimeout(() => toast.update(id, { type: 'success', text: '上传完成' }), 2000);
  };

  const run = (fn: () => void) => () => {
    window.clearTimeout(timer.current);
    fn();
  };

  return (
    <figure className="shell-demo">
      <div
        className="shell-demo-preview"
        style={{
          position: 'relative',
          isolation: 'isolate',
          alignItems: 'flex-end',
          height: 280,
          overflow: 'hidden',
          background: 'var(--color-bg-fill-base)',
        }}
      >
        <Toaster style={{ position: 'absolute' }} />
        <Button onClick={run(() => toast.info('已复制链接'))}>信息</Button>
        <Button onClick={run(() => toast.success('已保存到我的作品'))}>成功</Button>
        <Button onClick={run(() => toast.warning('余额不足，请先充值'))}>警告</Button>
        <Button onClick={run(() => toast.error('生成失败，请重试'))}>错误</Button>
        <Button onClick={run(() => toast.success('已删除 1 张图片', { action: '撤销' }))}>带操作</Button>
        <Button onClick={upload}>上传</Button>
      </div>
    </figure>
  );
}

// ---------- Loading ----------

type LoadingState = { size: LoadingSize; showText: boolean; text: string };

export function LoadingPlayground() {
  return (
    <Playground<LoadingState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: 'sm', options: [['sm', '小'], ['md', '中'], ['lg', '大']] },
        { key: 'showText', label: '显示文字', type: 'toggle', value: true },
        { key: 'text', label: '文字', type: 'text', value: '加载中…' },
      ]}
      rules={(s) => (s.showText ? {} : { text: true })}
      render={(s) => <Loading size={s.size}>{s.showText ? s.text : undefined}</Loading>}
    />
  );
}

// ---------- Skeleton ----------

type SkeletonState = { shape: SkeletonShape };

// 宽高是 Figma 里摆的示意尺寸，不是默认尺寸
const SKELETON_SIZE: Record<SkeletonShape, { width: number; height?: number }> = {
  rect: { width: 160, height: 90 },
  circle: { width: 32, height: 32 },
  text: { width: 200 },
};

export function SkeletonPlayground() {
  return (
    <Playground<SkeletonState>
      controls={[
        { key: 'shape', label: '形状', type: 'segment', value: 'rect', options: [['rect', '矩形'], ['circle', '圆形'], ['text', '文字行']] },
      ]}
      render={(s) => <Skeleton shape={s.shape} {...SKELETON_SIZE[s.shape]} />}
    />
  );
}

// ---------- EmptyState ----------

type EmptyStateState = { scene: EmptyStateScene; size: EmptyStateSize; title: string; showDesc: boolean; desc: string; action: boolean };

const SCENES: [EmptyStateScene, string][] = [['empty', '暂无内容'], ['favorite', '暂无收藏'], ['offline', '无网络'], ['failed', '生成失败']];

export function EmptyStatePlayground() {
  return (
    <Playground<EmptyStateState>
      controls={[
        { key: 'scene', label: '场景', type: 'segment', value: 'empty', options: SCENES },
        { key: 'size', label: '尺寸', type: 'segment', value: 'lg', options: [['lg', '大'], ['sm', '小']] },
        { key: 'title', label: '标题', type: 'text', value: '标题文字' },
        { key: 'showDesc', label: '显示描述', type: 'toggle', value: true },
        { key: 'desc', label: '描述', type: 'text', value: '一句话说清楚下一步做什么' },
        { key: 'action', label: '显示引导操作', type: 'toggle', value: false },
      ]}
      rules={(s) => (s.showDesc ? {} : { desc: true })}
      render={(s) => (
        <EmptyState
          scene={s.scene}
          size={s.size}
          title={s.title}
          description={s.showDesc ? s.desc : undefined}
          action={s.action ? <Button>去画布</Button> : undefined}
        />
      )}
    />
  );
}
