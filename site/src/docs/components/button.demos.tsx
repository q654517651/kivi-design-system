import { Button, ButtonGroup, Divider, cx, IconButton, SendButton, type ButtonSize, type ButtonVariant, type IconButtonSize, type IconButtonVariant, type IconName } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 按钮页的三个属性面板：所有尺寸、类型、状态都在面板里切。参数表在 button.mdx

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover', active: 'is-active' };

type ButtonState = { size: string; variant: ButtonVariant; state: string; left: boolean; right: boolean; text: string };

function renderButton(s: ButtonState) {
  return (
    <Button
      size={Number(s.size) as ButtonSize}
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
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['28', '小'], ['32', '中'], ['36', '大']] },
        { key: 'variant', label: '类型', type: 'segment', value: 'primary', options: [['primary', '主要'], ['secondary', '次要'], ['secondary-muted', '次要灰'], ['ghost', '无底'], ['ghost-muted', '无底灰'], ['danger', '危险'], ['on-media', '浮层']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['loading', '加载中']] },
        { key: 'left', label: '左图标', type: 'toggle', value: true },
        { key: 'right', label: '右图标', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: '生成' },
      ]}
      rules={(s) => (s.variant === 'secondary-muted' || s.variant === 'ghost-muted' ? { size: ['36'], state: ['loading'] } : {})}
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
      loading={s.state === 'loading' || undefined}
    />
  );
}

export function IconButtonPlayground() {
  return (
    <Playground<IconButtonState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['28', '28'], ['32', '32'], ['36', '36']] },
        { key: 'variant', label: '类型', type: 'segment', value: 'ghost', options: [['primary', '主要'], ['secondary', '次要'], ['ghost', '无底'], ['ghost-muted', '无底灰'], ['on-media', '浮层'], ['on-media-ghost', '浮层无底']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['loading', '加载中'], ['selected', '选中']] },
        { key: 'icon', label: '图标', type: 'segment', value: 'More', options: [['More', 'More'], ['Add', 'Add'], ['Download', 'Download'], ['TextBold', 'TextBold']] },
      ]}
      rules={(s) => {
        if (s.variant === 'ghost-muted') return { size: ['36'], state: ['loading'] };
        if (s.variant === 'primary') return { state: ['selected'] };
        return {};
      }}
      media={(s) => s.variant === 'on-media' || s.variant === 'on-media-ghost'}
      render={renderIconButton}
    />
  );
}

type ButtonGroupState = { variant: 'on-media' | 'glass'; size: string; content: string; state: string };

/** 按钮条：32 是盖在图上的（节点：收藏、全屏、下载 | 4 ⌄，和主站快捷操作）；44 是节点工具栏（玻璃），56 是画布底部工具栏（实色） */
function renderButtonGroup(s: ButtonGroupState, update: (patch: Partial<PlaygroundState>) => void) {
  const hover = (i: number) => (s.state === 'hover' && i === 0 ? 'is-hover' : undefined);
  if (s.size === '44') {
    return (
      <ButtonGroup variant="glass" size={44} aria-label="节点工具栏">
        {s.content === 'icons' ? (
          <>
            <IconButton icon="ImageToText" label="反推提示词" className={hover(0)} />
            <IconButton icon="Download" label="下载" />
            <IconButton icon="FullScreen" label="全屏" />
          </>
        ) : (
          <>
            <Button leftIcon="Rmbg" className={hover(0)}>抠图</Button>
            <Button leftIcon="Crop">裁剪</Button>
            <Button leftIcon="Expand">扩图</Button>
            <Divider orientation="vertical" />
            <IconButton icon="Download" label="下载" />
            <IconButton icon="FullScreen" label="全屏" />
          </>
        )}
      </ButtonGroup>
    );
  }
  if (s.size === '56') {
    return (
      <ButtonGroup variant="surface" size={56} aria-label="画布工具栏">
        <IconButton icon="Add" label="添加" variant="primary" className={hover(0)} />
        <IconButton icon="Upload" label="上传" />
        {s.content !== 'icons' && (
          <>
            <Divider orientation="vertical" />
            <IconButton icon="Download" label="下载" />
          </>
        )}
      </ButtonGroup>
    );
  }
  if (s.content === 'quick') {
    return (
      <ButtonGroup aria-label="快捷操作" variant={s.variant}>
        <IconButton icon="ImageEditing" label="图片编辑" className={hover(0)} />
        <IconButton icon="VideoGeneration" label="图生视频" />
        <IconButton icon="ImageToImage" label="一键垫图" />
        <IconButton icon="More" label="更多" />
      </ButtonGroup>
    );
  }
  const collected = s.state === 'collected';
  return (
    <ButtonGroup aria-label="节点操作" variant={s.variant}>
      <IconButton
        icon={collected ? 'CollectSolid' : 'Collect'}
        label={collected ? '取消收藏' : '收藏'}
        selected={collected || undefined}
        className={hover(0)}
        onClick={() => update({ state: collected ? 'default' : 'collected' })}
      />
      <IconButton icon="FullScreen" label="全屏" />
      <IconButton icon="Download" label="下载" />
      {s.content === 'mixed' && (
        <>
          <Divider orientation="vertical" />
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
        { key: 'size', label: '尺寸', type: 'segment', value: '32', options: [['32', '32 · 媒体'], ['44', '44 · 节点工具栏'], ['56', '56 · 画布工具栏']] },
        { key: 'variant', label: '底', type: 'segment', value: 'on-media', options: [['on-media', '浮层'], ['glass', '玻璃']] },
        { key: 'content', label: '内容', type: 'segment', value: 'mixed', options: [['icons', '只有图标'], ['mixed', '图标 + 文字'], ['quick', '快捷操作']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['collected', '收藏了']] },
      ]}
      rules={(s) => (s.size === '32' ? (s.content === 'quick' ? { state: ['collected'] } : {}) : { variant: ['on-media'], content: ['quick'], state: ['collected'] })}
      media={(s) => s.size === '32'}
      render={renderButtonGroup}
    />
  );
}

// ---------- SendButton ----------

type SendButtonState = { state: string };

function sendButton(state: string) {
  // 悬停、按下是摆静态样子用的（is-hover / is-active），项目里不用写
  const cls = state === 'hover' ? 'is-hover' : state === 'active' ? 'is-active' : undefined;
  return <SendButton className={cls} disabled={state === 'disabled' || undefined} generating={state === 'busy' || undefined} />;
}

export function SendButtonPlayground() {
  return (
    <Playground<SendButtonState>
      controls={[{ key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['active', '按下'], ['disabled', '禁用'], ['busy', '生成中']] }]}
      render={(s) => sendButton(s.state)}
    />
  );
}
