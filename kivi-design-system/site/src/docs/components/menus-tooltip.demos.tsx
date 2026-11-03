import type { ReactNode } from 'react';
import {
  AssetThumb,
  Button,
  Dropdown,
  Menu,
  MenuDivider,
  MenuItem,
  MenuLabel,
  Popover,
  SidebarItem,
  SidebarLabel,
  SidebarMore,
  Tooltip,
  type DropdownPlacement,
  type PopoverPlacement,
} from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 菜单和提示页的属性面板：所有类型、状态都在面板里切。参数表在 menus-tooltip.mdx

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover' };
const THUMB = './placeholders/kiwi-light-1x1.webp';

// ---------- Tooltip ----------

type TooltipState = { type: string; text: string; longText: string; title: string; shortcut: boolean; shortcutText: string };

// 面板里摆的是静态的气泡（不包触发元素）；真实的悬停出现看下面的示例
export function TooltipPlayground() {
  return (
    <Playground<TooltipState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'simple', options: [['simple', '简单'], ['desc', '说明'], ['long', '长文']] },
        { key: 'text', label: '文字', type: 'text', value: '提示文字' },
        { key: 'longText', label: '文字', type: 'text', value: '生成一张赛博朋克风格的猕猴桃海报：霓虹灯下的未来都市街道，雨夜反光的路面，巨大的全息广告牌上写着 KIVI，画面中央是一颗发光的猕猴桃切面，电影级光影，8K 质感。' },
        { key: 'title', label: '标题', type: 'text', value: '提示标题' },
        { key: 'shortcut', label: '显示快捷键', type: 'toggle', value: false },
        { key: 'shortcutText', label: '快捷键', type: 'text', value: '⌘Z' },
      ]}
      // 标题、快捷键只在对应类型下出现
      rules={(s) => ({
        ...(s.type === 'desc' ? { shortcut: true, shortcutText: true } : { title: true }),
        ...(s.type === 'simple' && !s.shortcut ? { shortcutText: true } : {}),
        ...(s.type === 'long' ? { text: true, shortcut: true, shortcutText: true } : { longText: true }),
      })}
      render={(s) =>
        // 长文平时和触发元素一样宽，这里摆样子给个 400
        s.type === 'long' ? (
          <Tooltip variant="long" content={s.longText} style={{ width: 400 }} />
        ) : s.type === 'desc' ? (
          <Tooltip variant="desc" title={s.title} content={s.text} />
        ) : (
          <Tooltip content={s.text} shortcut={s.shortcut ? s.shortcutText : undefined} />
        )
      }
    />
  );
}

// ---------- Popover ----------

type PopoverState = {
  trigger: string;
  side: string;
  align: string;
  showTitle: boolean;
  title: string;
  text: string;
  disabled: boolean;
  open: boolean;
};

// 展开和面板双向同步：悬停、点击、Esc 关闭都写回「展开」。点面板上的选项不算点了气泡外面（不然一调面板就关了）
function renderPopover(s: PopoverState, update: (patch: Partial<PlaygroundState>) => void) {
  const placement = (s.align === 'center' ? s.side : `${s.side}-${s.align}`) as PopoverPlacement;
  return (
    <Popover
      trigger={s.trigger as 'hover' | 'click'}
      placement={placement}
      title={s.showTitle ? s.title : undefined}
      content={s.text}
      disabled={s.disabled || undefined}
      open={s.open}
      onOpenChange={(open) => update({ open })}
      onInteractOutside={(e) => {
        if ((e.target as Element).closest('.shell-pg-panel')) e.preventDefault();
      }}
    >
      <Button variant="secondary">比例</Button>
    </Popover>
  );
}

export function PopoverPlayground() {
  return (
    <Playground<PopoverState>
      controls={[
        { key: 'trigger', label: '出现方式', type: 'segment', value: 'hover', options: [['hover', '悬停'], ['click', '点击']] },
        { key: 'side', label: '方向', type: 'segment', value: 'bottom', options: [['top', '上'], ['bottom', '下'], ['left', '左'], ['right', '右']] },
        { key: 'align', label: '对齐', type: 'segment', value: 'center', options: [['start', '起点'], ['center', '居中'], ['end', '终点']] },
        { key: 'showTitle', label: '显示标题', type: 'toggle', value: true },
        { key: 'title', label: '标题', type: 'text', value: '画面比例' },
        { key: 'text', label: '内容', type: 'text', value: '决定生成画面的宽高比。选「自动」时由模型根据提示词和参考图判断。' },
        { key: 'disabled', label: '禁用', type: 'toggle', value: false },
        { key: 'open', label: '展开', type: 'toggle', value: true },
      ]}
      rules={(s) => (s.showTitle ? {} : { title: true })}
      render={renderPopover}
    />
  );
}

// ---------- Menu（MenuItem、MenuLabel、MenuDivider） ----------

type MenuState = {
  type: string;
  state: string;
  text: string;
  left: string;
  right: string;
  shortcutText: string;
  width: string;
  label: boolean;
  divider: boolean;
};

// 菜单项放在 Menu 里才有玻璃底
function renderMenu(s: MenuState) {
  const danger = s.type === 'danger';
  const selected = s.state === 'selected';
  const check = s.right === 'check';
  return (
    <Menu width={Number(s.width)} role={selected && !check ? 'listbox' : undefined}>
      {s.label && <MenuLabel>分组标题</MenuLabel>}
      <MenuItem
        variant={danger ? 'danger' : undefined}
        icon={s.left === 'icon' ? (danger ? 'Delete' : 'Copy') : undefined}
        thumb={s.left === 'thumb' ? <AssetThumb size={24} type="image" src={THUMB} /> : undefined}
        shortcut={s.right === 'shortcut' ? s.shortcutText : undefined}
        submenu={s.right === 'submenu' || undefined}
        selected={selected ? true : undefined}
        checked={check ? true : undefined}
        disabled={s.state === 'disabled' || undefined}
        className={STATE_CLASS[s.state]}
      >
        {s.text}
      </MenuItem>
      {s.divider && <MenuDivider />}
      {s.divider && (
        <MenuItem icon="Delete" variant="danger">
          删除
        </MenuItem>
      )}
    </Menu>
  );
}

export function MenuPlayground() {
  return (
    <Playground<MenuState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'normal', options: [['normal', '普通'], ['danger', '危险']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['disabled', '禁用'], ['selected', '选中']] },
        { key: 'text', label: '文字', type: 'text', value: '菜单项' },
        { key: 'left', label: '左边', type: 'segment', value: 'icon', options: [['none', '无'], ['icon', '图标'], ['thumb', '缩略图']] },
        { key: 'right', label: '右边', type: 'segment', value: 'none', options: [['none', '无'], ['shortcut', '快捷键'], ['submenu', '子菜单箭头'], ['check', '勾选']] },
        { key: 'shortcutText', label: '快捷键', type: 'text', value: '⌘C' },
        { key: 'width', label: '宽度', type: 'segment', value: '200', options: [['120', '120'], ['160', '160'], ['200', '200'], ['240', '240']] },
        { key: 'label', label: '分组标题', type: 'toggle', value: false },
        { key: 'divider', label: '分割线', type: 'toggle', value: false },
      ]}
      // 危险没有选中；快捷键文字只在右边选了快捷键时出现
      rules={(s) => ({
        ...(s.type === 'danger' ? { state: ['selected'] } : {}),
        ...(s.right !== 'shortcut' ? { shortcutText: true } : {}),
      })}
      render={renderMenu}
    />
  );
}

// ---------- Dropdown ----------

type DropdownState = { dir: string; align: string; popup: string; match: boolean; close: boolean };

// 弹出层挂在 body 上：点一下预览里的按钮就能打开。单选列表点了哪项就选中哪项，记在面板上不显示的 picked 里
function renderDropdown(s: DropdownState, update: (patch: Partial<PlaygroundState>) => void) {
  const list = s.popup === 'listbox';
  const picked = typeof (s as Record<string, unknown>).picked === 'string' ? String((s as Record<string, unknown>).picked) : '2K';
  const placement = (s.align === 'center' ? s.dir : `${s.dir}-${s.align}`) as DropdownPlacement;
  return (
    <Dropdown
      placement={placement === 'bottom-start' ? undefined : placement}
      haspopup={list ? 'listbox' : undefined}
      matchTriggerWidth={s.match || undefined}
      closeOnSelect={s.close ? undefined : false}
      trigger={
        <Button rightIcon="DownArrowSmall" style={s.match ? { width: 160 } : undefined}>
          {list ? picked : '更多操作'}
        </Button>
      }
    >
      <Menu width={s.match ? undefined : list ? 120 : 200} role={list ? 'listbox' : undefined}>
        {list
          ? ['1K', '2K', '4K'].map((v) => (
              <MenuItem key={v} selected={v === picked} onClick={() => update({ picked: v })}>
                {v}
              </MenuItem>
            ))
          : [
              <MenuItem key="copy" icon="Copy">复制</MenuItem>,
              <MenuItem key="share" icon="Share">分享</MenuItem>,
              <MenuItem key="download" icon="Download">下载</MenuItem>,
              <MenuDivider key="divider" />,
              <MenuItem key="delete" icon="Delete" variant="danger">删除</MenuItem>,
            ]}
      </Menu>
    </Dropdown>
  );
}

export function DropdownPlayground() {
  return (
    <Playground<DropdownState>
      controls={[
        { key: 'dir', label: '方向', type: 'segment', value: 'bottom', options: [['bottom', '下方'], ['top', '上方']] },
        { key: 'align', label: '对齐', type: 'segment', value: 'start', options: [['start', '左对齐'], ['center', '居中'], ['end', '右对齐']] },
        { key: 'popup', label: '弹出的是', type: 'segment', value: 'menu', options: [['menu', '菜单'], ['listbox', '单选列表']] },
        { key: 'match', label: '和触发器一样宽', type: 'toggle', value: false },
        { key: 'close', label: '点菜单项后关闭', type: 'toggle', value: true },
      ]}
      render={renderDropdown}
    />
  );
}

// ---------- SidebarItem ----------

type SidebarItemState = { type: string; state: string; text: string; left: string; more: boolean; collapsed: boolean };

/** 收起时宽度跟着外面的侧栏：这里用一个 216 / 36 的框代替侧栏，宽度变化 300ms ease-in-out。代码里不写它 */
function SidebarBox({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <div style={{ width: collapsed ? 36 : 216, transition: 'width var(--motion-duration-300) var(--motion-ease-in-out)' }}>{children}</div>
  );
}
SidebarBox.docFrame = true;

// 预览里改名（回车）会写回面板的「文字」，进出重命名写回「状态」
function renderSidebarItem(s: SidebarItemState, update: (patch: Partial<SidebarItemState>) => void) {
  const list = s.type === 'list';
  return (
    <SidebarItem
      variant={list ? 'list' : undefined}
      icon={list ? undefined : 'Create'}
      thumb={list ? (s.left === 'image' ? 'image' : 'icon') : undefined}
      thumbSrc={list && s.left === 'image' ? THUMB : undefined}
      thumbIcon={list && s.left === 'canvas' ? 'Canvas' : undefined}
      selected={s.state === 'selected' || undefined}
      more={s.more || undefined}
      collapsed={s.collapsed || undefined}
      editing={list ? s.state === 'editing' : undefined}
      onEditingChange={list ? (v) => update({ state: v ? 'editing' : 'default' }) : undefined}
      onRename={list ? (name) => update({ text: name }) : undefined}
      className={STATE_CLASS[s.state]}
    >
      {s.text}
    </SidebarItem>
  );
}

export function SidebarItemPlayground() {
  return (
    <Playground<SidebarItemState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'nav', options: [['nav', '导航'], ['list', '列表']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['selected', '选中'], ['editing', '重命名中']] },
        { key: 'text', label: '文字', type: 'text', value: '侧栏项' },
        { key: 'left', label: '缩略图', type: 'segment', value: 'message', options: [['message', '对话图标'], ['canvas', '画布图标'], ['image', '图片']] },
        { key: 'more', label: '更多（悬停、选中才显示）', type: 'toggle', value: false },
        { key: 'collapsed', label: '收起', type: 'toggle', value: false },
      ]}
      // 导航左边固定是图标，没有缩略图，也不能重命名；收起时不显示「更多」、不能重命名
      rules={(s) => ({
        ...(s.type === 'nav' ? { left: true, state: ['editing'] } : {}),
        ...(s.collapsed ? { more: true, state: ['editing'] } : {}),
      })}
      render={(s, update) => <SidebarBox collapsed={s.collapsed}>{renderSidebarItem(s, update)}</SidebarBox>}
    />
  );
}

// ---------- SidebarLabel ----------

type SidebarLabelState = { state: string; text: string; expanded: string; showNew: boolean; collapsed: boolean };

// 预览里点标题展开收起，面板「展开」跟着变
export function SidebarLabelPlayground() {
  return (
    <Playground<SidebarLabelState>
      controls={[
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停']] },
        { key: 'text', label: '文字', type: 'text', value: '对话' },
        { key: 'expanded', label: '展开', type: 'segment', value: 'open', options: [['open', '展开'], ['closed', '收起']] },
        { key: 'showNew', label: '新建按钮', type: 'toggle', value: true },
        { key: 'collapsed', label: '收起', type: 'toggle', value: false },
      ]}
      // 收起时只剩新建按钮（一直显示），标题、展开状态、悬停都看不出
      rules={(s) => (s.collapsed ? { state: true, text: true, expanded: true, showNew: true } : {})}
      render={(s, update) => (
        <SidebarBox collapsed={s.collapsed}>
          <SidebarLabel
            expanded={s.expanded === 'open'}
            onExpandedChange={(v) => update({ expanded: v ? 'open' : 'closed' })}
            showNew={s.showNew || s.collapsed ? undefined : false}
            newLabel={`新建${s.text}`}
            collapsed={s.collapsed || undefined}
            className={s.collapsed ? undefined : STATE_CLASS[s.state]}
          >
            {s.text}
          </SidebarLabel>
        </SidebarBox>
      )}
    />
  );
}

// ---------- SidebarMore ----------

type SidebarMoreState = { text: string; collapsed: boolean };

export function SidebarMorePlayground() {
  return (
    <Playground<SidebarMoreState>
      controls={[
        { key: 'text', label: '文字', type: 'text', value: '更多' },
        { key: 'collapsed', label: '收起', type: 'toggle', value: false },
      ]}
      render={(s) => (
        <SidebarBox collapsed={s.collapsed}>
          <SidebarMore collapsed={s.collapsed || undefined}>{s.text}</SidebarMore>
        </SidebarBox>
      )}
    />
  );
}
