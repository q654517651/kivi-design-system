import { Button, ButtonGroup, ButtonGroupDivider, IconButton, type ButtonSize, type ButtonVariant, type IconButtonSize, type IconButtonVariant, type IconName } from '@kivi';
import { Playground } from '@shell';

// 按钮页的三个属性面板：所有尺寸、类型、状态都在面板里切。参数表在 button.mdx

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover', active: 'is-active' };

type ButtonState = { size: ButtonSize; variant: ButtonVariant; state: string; left: boolean; right: boolean; text: string };

function renderButton(s: ButtonState) {
  return (
    <Button
      size={s.size}
      variant={s.variant}
      className={STATE_CLASS[s.state]}
      disabled={s.state === 'disabled' || undefined}
      loading={s.state === 'loading' || undefined}
      leftIcon={s.left ? 'Add' : undefined}
      rightIcon={s.right ? 'DownArrowSmall' : undefined}
    >
      {s.text}
    </Button>
  );
}

export function ButtonPlayground() {
  return (
    <Playground<ButtonState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: 'md', options: [['sm', '小'], ['md', '中'], ['lg', '大']] },
        { key: 'variant', label: '类型', type: 'segment', value: 'primary', options: [['primary', '主要'], ['secondary', '次要'], ['text', '文字'], ['danger', '危险'], ['on-media', '浮层'], ['light', '轻']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['loading', '加载中']] },
        { key: 'left', label: '左图标', type: 'toggle', value: true },
        { key: 'right', label: '右图标', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: '生成' },
      ]}
      rules={(s) => (s.variant === 'light' ? { size: ['lg'], state: ['loading'] } : {})}
      media={(s) => s.variant === 'on-media'}
      render={renderButton}
    />
  );
}

const ICON_LABEL: Record<string, string> = { More: '更多', Add: '添加', Download: '下载', TextBold: '加粗' };

type IconButtonState = { size: string; variant: IconButtonVariant; state: string; icon: IconName };

function renderIconButton(s: IconButtonState) {
  return (
    <IconButton
      icon={s.icon}
      label={ICON_LABEL[s.icon] ?? s.icon}
      size={Number(s.size) as IconButtonSize}
      variant={s.variant}
      className={STATE_CLASS[s.state]}
      disabled={s.state === 'disabled' || undefined}
      selected={s.state === 'selected' || undefined}
    />
  );
}

export function IconButtonPlayground() {
  return (
    <Playground<IconButtonState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['28', '28'], ['32', '32'], ['36', '36']] },
        { key: 'variant', label: '类型', type: 'segment', value: 'text', options: [['primary', '主要'], ['secondary', '次要'], ['text', '文字'], ['on-media', '浮层'], ['on-media-ghost', '浮层无底'], ['light', '轻']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['selected', '选中']] },
        { key: 'icon', label: '图标', type: 'segment', value: 'More', options: [['More', 'More'], ['Add', 'Add'], ['Download', 'Download'], ['TextBold', 'TextBold']] },
      ]}
      rules={(s) => {
        if (s.variant === 'light') return { size: ['36'], state: ['selected'] };
        if (s.variant === 'primary') return { state: ['selected'] };
        return {};
      }}
      media={(s) => s.variant === 'on-media' || s.variant === 'on-media-ghost'}
      render={renderIconButton}
    />
  );
}

type ButtonGroupState = { content: string; state: string };

/** 按钮条：节点（收藏、全屏、下载 | 4 ⌄）和主站快捷操作两种摆法，盖在图上 */
function renderButtonGroup(s: ButtonGroupState) {
  const hover = (i: number) => (s.state === 'hover' && i === 0 ? 'is-hover' : undefined);
  if (s.content === 'quick') {
    return (
      <ButtonGroup aria-label="快捷操作">
        <IconButton icon="ImageEditing" label="图片编辑" className={hover(0)} />
        <IconButton icon="VideoGeneration" label="图生视频" />
        <IconButton icon="ImageToImage" label="一键垫图" />
        <IconButton icon="More" label="更多" />
      </ButtonGroup>
    );
  }
  const collected = s.state === 'collected';
  return (
    <ButtonGroup aria-label="节点操作">
      <IconButton
        icon={collected ? 'CollectSolid' : 'Collect'}
        label={collected ? '取消收藏' : '收藏'}
        selected={collected || undefined}
        className={hover(0)}
      />
      <IconButton icon="FullScreen" label="全屏" />
      <IconButton icon="Download" label="下载" />
      {s.content === 'mixed' && (
        <>
          <ButtonGroupDivider />
          <Button rightIcon="DownArrowSmall">4</Button>
        </>
      )}
    </ButtonGroup>
  );
}

export function ButtonGroupPlayground() {
  return (
    <Playground<ButtonGroupState>
      controls={[
        { key: 'content', label: '内容', type: 'segment', value: 'mixed', options: [['icons', '只有图标'], ['mixed', '图标 + 文字'], ['quick', '快捷操作']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['collected', '收藏了']] },
      ]}
      rules={(s) => (s.content === 'quick' ? { state: ['collected'] } : {})}
      media={() => true}
      render={renderButtonGroup}
    />
  );
}
