import { Tabs, TabItem, type IconName, type TabSize } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 选项卡页的属性面板：所有类型、状态都在面板里切。参数表在 tabs.mdx

// ---------- TabItem ----------

const TAB_ICONS: IconName[] = ['ImageGeneration', 'VideoGeneration', 'Music'];
const RATIO_ICONS: IconName[] = ['AutoAspect', 'Square11', 'Square43'];

type TabState = { style: string; layout: string; size: string; state: string; left: boolean; text: string };

// 一组三项：第一项按面板，第二项补一个选中，第三项默认
const picked = (s: TabState) => {
  const v = (s as Record<string, unknown>).picked;
  return typeof v === 'string' && v !== 'a' ? v : undefined;
};

// 面板「状态」说的是第一项；点了别的项，记在面板上不显示的 picked 里
function renderTabs(s: TabState, update: (patch: Partial<PlaygroundState>) => void) {
  const segment = s.style === 'segment';
  const vertical = segment && s.layout === 'vertical';
  const icons = vertical ? RATIO_ICONS : TAB_ICONS;
  const texts = [s.text, '选项 2', '选项 3'];
  const values = ['a', 'b', 'c'];
  const showIcon = vertical || (!segment && s.left);
  return (
    <Tabs
      key={[s.style, s.layout, s.size, s.left].join()}
      variant={segment ? 'segment' : 'tab'}
      layout={vertical ? 'vertical' : 'horizontal'}
      size={vertical ? undefined : (Number(s.size) as TabSize)}
      value={s.state === 'selected' ? 'a' : (picked(s) ?? 'b')}
      onChange={(v) => update(v === 'a' ? { state: 'selected', picked: v } : { state: s.state === 'selected' ? 'default' : s.state, picked: v })}
      aria-label="选项"
    >
      {values.map((v, i) => (
        <TabItem
          key={v}
          value={v}
          icon={showIcon ? icons[i] : undefined}
          className={i === 0 && s.state === 'hover' ? 'is-hover' : undefined}
          disabled={i === 0 && s.state === 'disabled' ? true : undefined}
        >
          {texts[i]}
        </TabItem>
      ))}
    </Tabs>
  );
}

export function TabItemPlayground() {
  return (
    <Playground<TabState>
      controls={[
        { key: 'style', label: '样式', type: 'segment', value: 'tab', options: [['tab', '选项卡'], ['segment', '分段']] },
        { key: 'layout', label: '布局', type: 'segment', value: 'horizontal', options: [['horizontal', '横排'], ['vertical', '竖排']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['32', '中'], ['36', '大']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['selected', '选中'], ['disabled', '禁用']] },
        { key: 'left', label: '左图标', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: '选项' },
      ]}
      // 布局只有分段有；竖排只有中号、自带图标；分段横排没有左图标
      rules={(s) => {
        const segment = s.style === 'segment';
        const vertical = segment && s.layout === 'vertical';
        return {
          ...(segment ? {} : { layout: true }),
          ...(vertical ? { size: true } : {}),
          ...(segment ? { left: true } : {}),
        };
      }}
      render={renderTabs}
    />
  );
}
