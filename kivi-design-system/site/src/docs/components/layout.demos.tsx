import type { ReactNode } from 'react';
import { Button, Collapse, Divider, ScrollArea, type CollapseGap, type ScrollAreaOrientation } from '@kivi';
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

// ---------- ScrollArea ----------

type ScrollAreaState = { orientation: ScrollAreaOrientation; fade: boolean; content: string; count: string };

const SHORT = '列表项';
const LONG = '把一颗发光的猕猴桃放在霓虹灯下的未来都市街道上，雨夜的路面反光，远处是巨大的全息广告牌，电影级光影。';

/** 面板里的内容：N 行。横向、两个方向时每行不折行，才有得横着滚。只是演示内容，代码里写成占位 */
function Rows({ count, long, wide }: { count: number; long: boolean; wide: boolean; children?: ReactNode }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            margin: 'var(--spacing-4) 0',
            padding: 'var(--spacing-8) var(--spacing-12)',
            borderRadius: 'var(--border-radius-8)',
            background: 'var(--color-bg-fill-container-light-2)',
            color: 'var(--color-text-fill-primary)',
            fontSize: 'var(--font-size-13)',
            lineHeight: 'var(--font-line-height-20)',
            whiteSpace: wide ? 'nowrap' : undefined,
            minWidth: wide ? (long ? 640 : 360) : undefined,
          }}
        >
          {i + 1}. {long ? LONG : SHORT}
        </div>
      ))}
    </>
  );
}
Rows.docFrame = true;

export function ScrollAreaPlayground() {
  return (
    <Playground<ScrollAreaState>
      controls={[
        { key: 'orientation', label: '方向', type: 'segment', value: 'vertical', options: [['vertical', '纵向'], ['horizontal', '横向'], ['both', '两个方向']] },
        { key: 'fade', label: '渐隐', type: 'toggle', value: false },
        { key: 'content', label: '内容', type: 'segment', value: 'long', options: [['short', '短'], ['long', '长']] },
        { key: 'count', label: '条数', type: 'segment', value: '20', options: [['3', '3'], ['20', '20'], ['60', '60']] },
      ]}
      // 渐隐只有纵向有
      rules={(s) => (s.orientation === 'horizontal' ? { fade: true } : {})}
      render={(s) => (
        <ScrollArea
          orientation={s.orientation}
          fade={s.fade || undefined}
          maxHeight={240}
          style={{ width: 360 }}
        >
          <Rows count={Number(s.count)} long={s.content === 'long'} wide={s.orientation !== 'vertical'}>
            …内容…
          </Rows>
        </ScrollArea>
      )}
    />
  );
}
