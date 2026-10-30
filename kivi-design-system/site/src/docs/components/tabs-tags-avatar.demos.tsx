import { AssetThumb, Avatar, Tabs, Tag, TabItem, type AssetThumbSize, type AssetThumbType, type AvatarSize, type IconName, type TagVariant } from '@kivi';
import { Playground } from '@shell';

// 选项卡、标签和头像页的属性面板。参数表在 tabs-tags-avatar.mdx

const IMG = './placeholders/ip-gouache-1x1.webp';
const THUMB = './placeholders/kivi-future-1x1.webp';

// ---------- TabItem ----------

const TAB_ICONS: IconName[] = ['ImageGeneration', 'VideoGeneration', 'Music'];
const RATIO_ICONS: IconName[] = ['AutoAspect', 'Square11', 'Square43'];

type TabState = { style: string; layout: string; size: string; state: string; left: boolean; text: string };

// 一组三项：第一项按面板，第二项补一个选中，第三项默认
function renderTabs(s: TabState) {
  const segment = s.style === 'segment';
  const vertical = segment && s.layout === 'vertical';
  const icons = vertical ? RATIO_ICONS : TAB_ICONS;
  const texts = [s.text, '选项 2', '选项 3'];
  const values = ['a', 'b', 'c'];
  const showIcon = vertical || (!segment && s.left);
  return (
    <Tabs
      key={[s.style, s.layout, s.size, s.state, s.left].join()}
      variant={segment ? 'segment' : 'tab'}
      layout={vertical ? 'vertical' : 'horizontal'}
      size={vertical ? undefined : (s.size as 'md' | 'lg')}
      defaultValue={s.state === 'selected' ? 'a' : 'b'}
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
        { key: 'size', label: '尺寸', type: 'segment', value: 'md', options: [['md', '中'], ['lg', '大']] },
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

// ---------- Tag ----------

type TagState = { variant: string; thumb: boolean; icon: boolean; text: string };

function renderTag(s: TagState) {
  return (
    <Tag variant={s.variant as TagVariant} thumb={s.thumb ? IMG : undefined} icon={s.icon ? 'Bytedance' : undefined}>
      {s.text}
    </Tag>
  );
}

export function TagPlayground() {
  return (
    <Playground<TagState>
      controls={[
        { key: 'variant', label: '类型', type: 'segment', value: 'default', options: [['default', '默认'], ['on-media', '覆盖'], ['brand', '品牌']] },
        { key: 'thumb', label: '缩略图', type: 'toggle', value: false },
        { key: 'icon', label: '左图标', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: '标签' },
      ]}
      media={(s) => s.variant === 'on-media'}
      render={renderTag}
    />
  );
}

// ---------- Avatar ----------

type AvatarState = { type: string; size: string; initial: string };

function renderAvatar(s: AvatarState) {
  const size = Number(s.size) as AvatarSize;
  return s.type === 'image' ? (
    <Avatar size={size} type="image" src={IMG} name="阿远" />
  ) : (
    <Avatar size={size} type="text" name="Kivi 用户" initial={s.initial} />
  );
}

export function AvatarPlayground() {
  return (
    <Playground<AvatarState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['text', '文字']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['16', '16'], ['24', '24'], ['32', '32']] },
        { key: 'initial', label: '首字', type: 'text', value: 'K' },
      ]}
      // 首字只有文字类型用
      rules={(s) => (s.type === 'text' ? {} : { initial: true })}
      render={renderAvatar}
    />
  );
}

// ---------- AssetThumb ----------

type ThumbState = { type: string; size: string; icon: string };

function renderThumb(s: ThumbState) {
  const size = Number(s.size) as AssetThumbSize;
  const type = s.type as AssetThumbType;
  if (type === 'image') return <AssetThumb size={size} type="image" src={THUMB} />;
  if (type === 'audio') return <AssetThumb size={size} type="audio" />;
  return <AssetThumb size={size} type="icon" icon={s.icon as IconName} />;
}

export function AssetThumbPlayground() {
  return (
    <Playground<ThumbState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['audio', '音频'], ['icon', '图标']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '56', options: [['16', '16'], ['24', '24'], ['56', '56'], ['72', '72']] },
        { key: 'icon', label: '图标', type: 'segment', value: 'Message', options: [['Message', 'Message'], ['Canvas', 'Canvas']] },
      ]}
      // 图标只有「图标」类型可换
      rules={(s) => (s.type === 'icon' ? {} : { icon: true })}
      render={renderThumb}
    />
  );
}
