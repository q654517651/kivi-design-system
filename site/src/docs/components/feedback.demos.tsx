import { useEffect, useRef } from 'react';
import {
  Banner,
  Button,
  EmptyState,
  Loading,
  Notification,
  Notifier,
  Skeleton,
  Toast,
  Toaster,
  notify,
  toast,
  type BannerType,
  type EmptyStateType,
  type EmptyStateSize,
  type LoadingSize,
  type NotificationType,
  type SkeletonVariant,
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

// ---------- Notification ----------

type NotificationState = { type: NotificationType | 'none'; title: string; description: string; showDescription: boolean; closable: boolean };

export function NotificationPlayground() {
  return (
    <Playground<NotificationState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'error', options: [['none', '无图标'], ['info', '信息'], ['success', '成功'], ['warning', '警告'], ['error', '错误']] },
        { key: 'title', label: '标题', type: 'text', value: '生成失败' },
        { key: 'showDescription', label: '显示说明', type: 'toggle', value: true },
        { key: 'description', label: '说明', type: 'text', value: '网络中断，请检查网络后重试。已消耗的猕猴桃会退回。' },
        { key: 'closable', label: '显示关闭', type: 'toggle', value: true },
      ]}
      rules={(s) => (s.showDescription ? {} : { description: true })}
      render={(s) => (
        <Notification
          type={s.type === 'none' ? undefined : s.type}
          title={s.title}
          description={s.showDescription ? s.description : undefined}
          onClose={s.closable ? () => {} : undefined}
        />
      )}
    />
  );
}

const LONG_TEXT =
  '任务「春日花园」生成失败：模型服务暂时不可用，已自动重试 3 次仍未成功。已消耗的猕猴桃已全部退回到你的账户，可以在「我的资产」里查看明细。你可以稍后再试，或者换一个模型。如果多次失败，请把任务编号发给我们，我们会尽快排查并给你回复。';

/**
 * 点出来试试：多点几下，通知会叠成一叠，鼠标停上去展开、挪开又收起。
 * 项目里 Notifier 放在应用根上就是屏幕右上角，这里把它框在舞台里（position: absolute）。
 */
export function NotificationStage() {
  useEffect(() => () => notify.clear(), []);
  return (
    <figure className="shell-demo">
      <div
        className="shell-demo-preview"
        style={{
          position: 'relative',
          isolation: 'isolate',
          alignItems: 'flex-end',
          height: 420,
          overflow: 'hidden',
          background: 'var(--color-bg-fill-base)',
        }}
      >
        <Notifier style={{ position: 'absolute', top: 16, right: 16, maxHeight: 'calc(100% - 32px)' }} />
        <Button onClick={() => notify.info('已加入队列', { description: '前面还有 2 个任务，预计 1 分钟后开始' })}>信息</Button>
        <Button onClick={() => notify.success('生成完成', { description: '4 张图片已保存到我的作品' })}>成功</Button>
        <Button onClick={() => notify.warning('余额不足', { description: '本次生成需要 20 个猕猴桃，当前余额 12 个' })}>警告</Button>
        <Button onClick={() => notify.error('生成失败', { description: '网络中断，请检查网络后重试' })}>错误</Button>
        <Button onClick={() => notify.show({ title: '版本更新：新增画布分组功能' })}>无图标</Button>
        <Button onClick={() => notify.error('生成失败：模型服务暂时不可用，已自动重试 3 次', { description: LONG_TEXT })}>很长的文字</Button>
        <Button onClick={() => notify.info('3 秒后消失', { duration: 3000 })}>自己消失</Button>
        <Button onClick={() => notify.clear()}>全部关掉</Button>
      </div>
    </figure>
  );
}

// ---------- Banner ----------

type BannerState = { type: BannerType; text: string; multiline: boolean; closable: boolean };

export function BannerPlayground() {
  return (
    <Playground<BannerState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'warning', options: [['info', '信息'], ['success', '成功'], ['warning', '警告'], ['error', '错误']] },
        { key: 'text', label: '文字', type: 'text', value: '请上传符合规格的图片' },
        { key: 'multiline', label: '多行', type: 'toggle', value: false },
        { key: 'closable', label: '显示关闭', type: 'toggle', value: false },
      ]}
      render={(s) => (
        <div style={{ width: 360 }}>
          <Banner type={s.type} onClose={s.closable ? () => {} : undefined}>
            {s.text}
            {s.multiline ? '。图片尺寸需为 168 × 168，格式为 PNG 或 JPG，大小不超过 2 MB；不符合规格的图片会被自动裁剪，可能影响效果。' : ''}
          </Banner>
        </div>
      )}
    />
  );
}

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
          action={s.action ? <Button variant="light">去画布</Button> : undefined}
        />
      )}
    />
  );
}
