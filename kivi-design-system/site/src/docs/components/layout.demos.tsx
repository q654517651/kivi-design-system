import { Button, Collapse, Divider, type CollapseGap } from '@kivi';
import { Playground } from '@shell';

// 布局页的属性面板。参数表在 layout.mdx

// ---------- Divider ----------

type DividerState = { orientation: 'horizontal' | 'vertical' };

export function DividerPlayground() {
  return (
    <Playground<DividerState>
      controls={[{ key: 'orientation', label: '方向', type: 'segment', value: 'horizontal', options: [['horizontal', '横向'], ['vertical', '竖向']] }]}
      render={(s) =>
        s.orientation === 'vertical' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-fill-secondary)', fontSize: 13 }}>
            <span>文字</span>
            <Divider orientation="vertical" />
            <span>文字</span>
          </div>
        ) : (
          <div style={{ width: 240 }}>
            <Divider />
          </div>
        )
      }
    />
  );
}

// ---------- Collapse ----------

type CollapseState = { open: boolean; gap: string; partial: boolean };

export function CollapsePlayground() {
  return (
    <Playground<CollapseState>
      controls={[
        { key: 'open', label: '展开', type: 'toggle', value: true },
        { key: 'gap', label: '间距', type: 'segment', value: '6', options: [['0', '0'], ['6', '6'], ['8', '8']] },
        { key: 'partial', label: '收起后露一截', type: 'toggle', value: false },
      ]}
      rules={(s) => (s.partial ? { gap: true } : {})}
      render={(s, update) => (
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* 触发行由外面写：aria-controls 指向 Collapse */}
          <Button variant="secondary" aria-expanded={s.open} aria-controls="collapse-demo" onClick={() => update({ open: !s.open })}>
            {s.open ? '收起' : '展开'}
          </Button>
          <Collapse id="collapse-demo" expanded={s.open} distance={s.partial ? 100 : 60} gap={s.partial ? 0 : (Number(s.gap) as CollapseGap)} collapsedSize={s.partial ? 40 : undefined}>
            <p style={{ margin: 0, color: 'var(--color-text-fill-secondary)', fontSize: 'var(--font-size-13)', lineHeight: 'var(--font-line-height-20)' }}>
              能收起的这一块。展开时把下面的内容往下推，同时淡入；收起倒着走。{s.partial && '露一截时收起也不会藏起来，只把高度压到 40，超出的裁掉，所以这段字会多写几行，才看得出前面几行留着、后面的被裁掉。'}
            </p>
          </Collapse>
          <p style={{ margin: 'var(--spacing-8) 0 0', color: 'var(--color-text-fill-tertiary)', fontSize: 'var(--font-size-13)', lineHeight: 'var(--font-line-height-20)' }}>
            下面的内容
          </p>
        </div>
      )}
    />
  );
}
