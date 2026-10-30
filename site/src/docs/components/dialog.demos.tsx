import type { CSSProperties } from 'react';
import { Button, DialogPanel, type DialogProps, type DialogSize } from '@kivi';
import { Playground } from '@shell';

// 弹窗页的属性面板。参数表在 dialog.mdx

/** 内容区的占位，照 Figma 的 _DialogSlot 画一个虚线框；代码里换成自己的内容 */
function Content() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--border-radius-8)',
        color: 'var(--color-text-fill-tertiary)',
        fontSize: 'var(--font-size-13)',
        lineHeight: 'var(--font-line-height-20)',
        textAlign: 'center',
      }}
    >
      内容区：把内容放在 children 里
    </div>
  );
}
Content.displayName = 'Content';

/**
 * 属性面板里摆的「弹窗」：只有盒子，不要遮罩和开关，放在一块压暗的舞台上。
 * displayName 写成 Dialog，面板下面自动生成的代码才是项目里真正要写的。
 */
function DialogDoc({ open: _open, onOpenChange: _onOpenChange, showClose, ...panel }: DialogProps) {
  const stage: CSSProperties = {
    position: 'relative',
    inset: 'auto',
    zIndex: 'auto',
    flex: '1 1 auto',
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    overflowX: 'auto',
    margin: 'calc(-1 * var(--spacing-32))',
    padding: 'var(--spacing-32)',
  };
  return (
    <div className="kv-dialog__mask" style={stage}>
      <DialogPanel
        {...panel}
        showClose={showClose}
        style={{ flex: 'none', maxWidth: 'none', margin: '0 auto' }}
      />
    </div>
  );
}
DialogDoc.displayName = 'Dialog';

type DialogState = {
  size: DialogSize;
  header: boolean;
  title: string;
  close: boolean;
  desc: boolean;
  descText: string;
  body: boolean;
  footer: boolean;
  secondary: boolean;
  confirm: 'primary' | 'danger';
};

function renderDialog(s: DialogState) {
  const confirm = (
    <Button size="lg" variant={s.confirm}>
      {s.confirm === 'danger' ? '删除' : '确定'}
    </Button>
  );
  const footer = s.secondary ? (
    <>
      <Button size="lg">取消</Button>
      {confirm}
    </>
  ) : (
    confirm
  );
  return (
    <DialogDoc
      open
      onOpenChange={() => {}}
      size={s.size}
      title={s.header ? s.title : undefined}
      showClose={s.header && !s.close ? false : undefined}
      description={s.desc ? s.descText : undefined}
      footer={s.footer ? footer : undefined}
    >
      {s.body ? <Content /> : undefined}
    </DialogDoc>
  );
}

export function DialogPlayground() {
  return (
    <Playground<DialogState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: 's', options: [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']] },
        { key: 'header', label: '显示标题栏', type: 'toggle', value: true },
        { key: 'title', label: '标题', type: 'text', value: '弹窗标题' },
        { key: 'close', label: '显示关闭', type: 'toggle', value: true },
        { key: 'desc', label: '显示描述', type: 'toggle', value: true },
        { key: 'descText', label: '描述', type: 'text', value: '一句话说明这个弹窗要做什么，或者操作的后果。' },
        { key: 'body', label: '显示内容', type: 'toggle', value: true },
        { key: 'footer', label: '显示底栏', type: 'toggle', value: true },
        { key: 'secondary', label: '显示次按钮', type: 'toggle', value: true },
        { key: 'confirm', label: '确认按钮', type: 'segment', value: 'primary', options: [['primary', '主要'], ['danger', '危险']] },
      ]}
      // 没有标题栏就没有标题和关闭；没有描述就没有描述文字；没有底栏就没有按钮
      rules={(s) => ({
        ...(s.header ? {} : { title: true, close: true }),
        ...(s.desc ? {} : { descText: true }),
        ...(s.footer ? {} : { secondary: true, confirm: true }),
      })}
      render={renderDialog}
    />
  );
}
