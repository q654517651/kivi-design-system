import type { CSSProperties } from 'react';
import { Button, DialogPanel, ScrollArea, placeholderImageSrc, type DialogProps, type DialogSize } from '@kivi';
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

const STAGE_H = 640;

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
    // 台子固定高（当成一个矮窗口），弹窗最高到台子减上下 32，内容多了能看到中间那块滚
    height: STAGE_H,
    justifyContent: 'flex-start',
    margin: 'calc(-1 * var(--spacing-32))',
    padding: 'var(--spacing-32)',
  };
  return (
    <div className="kv-dialog__mask" style={stage}>
      <ScrollArea orientation="horizontal" style={{ flex: '1 1 auto', minWidth: 0, alignSelf: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: `calc(${STAGE_H}px - 2 * var(--spacing-32))` }}>
          <DialogPanel
            {...panel}
            showClose={showClose}
            style={{ flex: 'none', maxWidth: 'none', margin: '0 auto' }}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
DialogDoc.displayName = 'Dialog';

type DialogState = {
  /** 面板的分段只收字符串，用的时候转成数字 */
  size: string;
  media: boolean;
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
    <Button size={36} variant={s.confirm}>
      {s.confirm === 'danger' ? '删除' : '确定'}
    </Button>
  );
  const footer = s.secondary ? (
    <>
      <Button size={36}>取消</Button>
      {confirm}
    </>
  ) : (
    confirm
  );
  return (
    <DialogDoc
      open
      onOpenChange={() => {}}
      size={Number(s.size) as DialogSize}
      media={s.media ? <img src={placeholderImageSrc('kivi-future', '16:9')} alt="" /> : undefined}
      title={s.header ? s.title : undefined}
      showClose={(s.header || s.media) && !s.close ? false : undefined}
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
        { key: 'size', label: '宽度', type: 'segment', value: '400', options: [['400', '400'], ['560', '560'], ['800', '800'], ['1024', '1024'], ['1200', '1200']] },
        { key: 'media', label: '显示顶图', type: 'toggle', value: false },
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
      // 没有标题栏就没有标题；没有标题栏也没有顶图就没有关闭；没有描述就没有描述文字；没有底栏就没有按钮
      rules={(s) => ({
        ...(s.header ? {} : { title: true }),
        ...(s.header || s.media ? {} : { close: true }),
        ...(s.desc ? {} : { descText: true }),
        ...(s.footer ? {} : { secondary: true, confirm: true }),
      })}
      render={renderDialog}
    />
  );
}
