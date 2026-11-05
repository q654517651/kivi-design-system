import { AssetThumb, Avatar, Tag, type AssetThumbSize, type AssetThumbType, type AvatarSize, type IconName, type TagVariant } from '@kivi';
import { Playground } from '@shell';

// 标签和头像页的属性面板：所有类型、状态都在面板里切。参数表在 tags-avatar.mdx

const IMG = './placeholders/ip-gouache-1x1.webp';
const THUMB = './placeholders/kivi-future-1x1.webp';

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
  return <AssetThumb size={size} type="icon" icon={s.icon as IconName} />;
}

export function AssetThumbPlayground() {
  return (
    <Playground<ThumbState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['icon', '图标']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '56', options: [['16', '16'], ['24', '24'], ['56', '56'], ['72', '72']] },
        { key: 'icon', label: '图标', type: 'segment', value: 'Message', options: [['Message', 'Message'], ['Canvas', 'Canvas'], ['Music', 'Music']] },
      ]}
      // 图标只有「图标」类型可换
      rules={(s) => (s.type === 'icon' ? {} : { icon: true })}
      render={renderThumb}
    />
  );
}
