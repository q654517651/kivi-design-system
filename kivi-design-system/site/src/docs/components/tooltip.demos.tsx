import { Button, Popover, Tooltip, type PopoverPlacement } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 提示页的属性面板：所有类型、状态都在面板里切。参数表在 tooltip.mdx。Tooltip 只写工具名，Popover 写说明

// ---------- Tooltip ----------

type TooltipState = { text: string; shortcut: boolean; shortcutText: string };

// 面板里摆的是静态的气泡（不包触发元素）；真实的悬停出现看下面的示例
export function TooltipPlayground() {
  return (
    <Playground<TooltipState>
      controls={[
        { key: 'text', label: '工具名', type: 'text', value: '复制' },
        { key: 'shortcut', label: '显示快捷键', type: 'toggle', value: false },
        { key: 'shortcutText', label: '快捷键', type: 'text', value: '⌘C' },
      ]}
      // 快捷键文字只在显示快捷键时出现
      rules={(s) => (s.shortcut ? {} : { shortcutText: true })}
      render={(s) => <Tooltip content={s.text} shortcut={s.shortcut ? s.shortcutText : undefined} />}
    />
  );
}

// ---------- Popover ----------

type PopoverState = {
  type: string;
  trigger: string;
  side: string;
  align: string;
  showTitle: boolean;
  title: string;
  text: string;
  longText: string;
  disabled: boolean;
  open: boolean;
};

// 展开和面板双向同步：悬停、点击、Esc 关闭都写回「展开」。点面板上的选项不算点了气泡外面（不然一调面板就关了）
function renderPopover(s: PopoverState, update: (patch: Partial<PlaygroundState>) => void) {
  const long = s.type === 'long';
  const placement = (long || s.align === 'center' ? s.side : `${s.side}-${s.align}`) as PopoverPlacement;
  // 长文的触发元素是一段被截断的文字，Popover 和它一样宽（这里给 400）
  const trigger = long ? (
    <div style={{ width: 400, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 14, lineHeight: '22px', color: 'var(--color-text-fill-primary)' }}>
      {s.longText}
    </div>
  ) : (
    <Button variant="secondary">比例</Button>
  );
  return (
    <Popover
      variant={long ? 'long' : 'tip'}
      trigger={long ? 'hover' : (s.trigger as 'hover' | 'click')}
      placement={placement}
      title={!long && s.showTitle ? s.title : undefined}
      content={long ? s.longText : s.text}
      disabled={s.disabled || undefined}
      open={s.open}
      onOpenChange={(open) => update({ open })}
      onInteractOutside={(e) => {
        if ((e.target as Element).closest('.shell-pg-panel')) e.preventDefault();
      }}
    >
      {trigger}
    </Popover>
  );
}

export function PopoverPlayground() {
  return (
    <Playground<PopoverState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'tip', options: [['tip', '说明'], ['long', '长文']] },
        { key: 'trigger', label: '出现方式', type: 'segment', value: 'hover', options: [['hover', '悬停'], ['click', '点击']] },
        { key: 'side', label: '方向', type: 'segment', value: 'bottom', options: [['top', '上'], ['bottom', '下'], ['left', '左'], ['right', '右']] },
        { key: 'align', label: '对齐', type: 'segment', value: 'center', options: [['start', '起点'], ['center', '居中'], ['end', '终点']] },
        { key: 'showTitle', label: '显示标题', type: 'toggle', value: true },
        { key: 'title', label: '标题', type: 'text', value: '画面比例' },
        { key: 'text', label: '内容', type: 'text', value: '决定生成画面的宽高比。选「自动」时由模型根据提示词和参考图判断。' },
        { key: 'longText', label: '全文', type: 'text', value: '生成一张赛博朋克风格的猕猴桃海报：霓虹灯下的未来都市街道，雨夜反光的路面，巨大的全息广告牌上写着 KIVI，画面中央是一颗发光的猕猴桃切面，电影级光影，8K 质感。' },
        { key: 'disabled', label: '禁用', type: 'toggle', value: false },
        { key: 'open', label: '展开', type: 'toggle', value: true },
      ]}
      // 说明：标题可选；长文没有标题、箭头，只能悬停出现，对齐无意义
      rules={(s) =>
        s.type === 'long'
          ? { trigger: true, align: true, showTitle: true, title: true, text: true }
          : { longText: true, ...(s.showTitle ? {} : { title: true }) }
      }
      render={renderPopover}
    />
  );
}
