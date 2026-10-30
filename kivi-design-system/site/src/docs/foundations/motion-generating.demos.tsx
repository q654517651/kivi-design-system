import type { CSSProperties } from 'react';
import { GeneratingDots, GeneratingRow, type GeneratingColor, type GeneratingEffect, type GeneratingType } from '@kivi';
import { Playground } from '@shell';

// 「生成中」的两个属性面板。参数表在 motion-generating.mdx

const EFFECTS: [string, string][] = [['twinkle', '方案一 星点闪烁'], ['drift', '方案二 斜飘'], ['sheen', '方案三 静态扫光']];
const COLORS: [string, string][] = [['white', '白色'], ['brand', '品牌渐变']];
const SPACINGS: [string, string][] = [['6', '6'], ['8', '8'], ['10', '10']];
const SPEEDS: [string, string][] = [['0.5', '0.5×'], ['1', '1×'], ['1.5', '1.5×']];
const GLOWS: [string, string][] = [['0', '无'], ['0.25', '25%'], ['0.5', '50%'], ['0.8', '80%']];

/** 父元素：要有尺寸、position: relative，点阵铺满它 */
const NODE: CSSProperties = {
  position: 'relative',
  width: 256,
  height: 256,
  borderRadius: 16,
  background: 'var(--color-bg-fill-surface)',
};

const TILE: CSSProperties = {
  aspectRatio: '1',
  borderRadius: 8,
  background: 'var(--color-bg-fill-surface)',
};

// ---------- GeneratingDots ----------

type DotsState = {
  effect: string;
  type: string;
  color: string;
  spacing: string;
  speed: string;
  glow: string;
  paused: boolean;
};

function renderDots(s: DotsState) {
  return (
    <div style={NODE}>
      <GeneratingDots
        type={s.type as GeneratingType}
        effect={s.effect as GeneratingEffect}
        color={s.color as GeneratingColor}
        spacing={Number(s.spacing)}
        speed={Number(s.speed)}
        glow={Number(s.glow)}
        paused={s.paused || undefined}
      />
    </div>
  );
}

export function GeneratingDotsPlayground() {
  return (
    <Playground<DotsState>
      controls={[
        { key: 'effect', label: '方案', type: 'segment', value: 'twinkle', options: EFFECTS },
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['video', '视频'], ['audio', '音频'], ['text', '文字']] },
        { key: 'color', label: '颜色', type: 'segment', value: 'white', options: COLORS },
        { key: 'spacing', label: '点距', type: 'segment', value: '6', options: SPACINGS },
        { key: 'speed', label: '速度', type: 'segment', value: '0.5', options: SPEEDS },
        { key: 'glow', label: '光晕', type: 'segment', value: '0.25', options: GLOWS },
        { key: 'paused', label: '暂停', type: 'toggle', value: false },
      ]}
      render={renderDots}
    />
  );
}

// ---------- GeneratingRow ----------

type RowState = {
  effect: string;
  count: string;
  color: string;
  spacing: string;
  speed: string;
  glow: string;
  paused: boolean;
};

function renderRow(s: RowState) {
  const count = Number(s.count);
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        gap: 8,
        width: '100%',
        maxWidth: count * 256 + (count - 1) * 8,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={TILE} />
      ))}
      <GeneratingRow
        type="image"
        effect={s.effect as GeneratingEffect}
        count={count}
        gap={8}
        radius={8}
        color={s.color as GeneratingColor}
        spacing={Number(s.spacing)}
        speed={Number(s.speed)}
        glow={Number(s.glow)}
        paused={s.paused || undefined}
      />
    </div>
  );
}

export function GeneratingRowPlayground() {
  return (
    <Playground<RowState>
      controls={[
        { key: 'effect', label: '方案', type: 'segment', value: 'twinkle', options: EFFECTS },
        { key: 'count', label: '张数', type: 'segment', value: '4', options: [['2', '2'], ['3', '3'], ['4', '4']] },
        { key: 'color', label: '颜色', type: 'segment', value: 'white', options: COLORS },
        { key: 'spacing', label: '点距', type: 'segment', value: '6', options: SPACINGS },
        { key: 'speed', label: '速度', type: 'segment', value: '0.5', options: SPEEDS },
        { key: 'glow', label: '光晕', type: 'segment', value: '0.25', options: GLOWS },
        { key: 'paused', label: '暂停', type: 'toggle', value: false },
      ]}
      render={renderRow}
    />
  );
}
