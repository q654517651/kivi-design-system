import type { ReactNode } from 'react';
import { ScrollArea, type ScrollAreaOrientation } from '@kivi';
import { Playground } from '@shell';

// 滚动条页的属性面板。参数表在 scroll-area.mdx

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
