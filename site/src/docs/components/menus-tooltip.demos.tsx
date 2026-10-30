import {
  AssetThumb,
  Button,
  Dropdown,
  Menu,
  MenuDivider,
  MenuItem,
  MenuLabel,
  SidebarItem,
  SidebarLabel,
  SidebarMore,
  Tooltip,
  type DropdownPlacement,
} from '@kivi';
import { Playground } from '@shell';

// 菜单和提示页的属性面板：所有类型、状态都在面板里切。参数表在 menus-tooltip.mdx

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover' };
const THUMB = './placeholders/kiwi-light-1x1.webp';

// ---------- Tooltip ----------

type TooltipState = { type: string; text: string; title: string; shortcut: boolean; shortcutText: string };

// 面板里摆的是静态的气泡（不包触发元素）；真实的悬停出现看下面的示例
export function TooltipPlayground() {
  return (
    <Playground<TooltipState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'simple', options: [['simple', '简单'], ['desc', '说明']] },
        { key: 'text', label: '文字', type: 'text', value: '提示文字' },
        { key: 'title', label: '标题', type: 'text', value: '提示标题' },
        { key: 'shortcut', label: '显示快捷键', type: 'toggle', value: false },
        { key: 'shortcutText', label: '快捷键', type: 'text', value: '⌘Z' },
      ]}
      // 标题、快捷键只在对应类型下出现
      rules={(s) => ({
        ...(s.type === 'desc' ? { shortcut: true, shortcutText: true } : { title: true }),
        ...(s.type === 'simple' && !s.shortcut ? { shortcutText: true } : {}),
      })}
      render={(s) =>
        s.type === 'desc' ? (
          <Tooltip variant="desc" title={s.title} content={s.text} />
        ) : (
          <Tooltip content={s.text} shortcut={s.shortcut ? s.shortcutText : undefined} />
        )
      }
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

// 弹出层挂在 body 上：点一下预览里的按钮就能打开
function renderDropdown(s: DropdownState) {
  const list = s.popup === 'listbox';
  const placement = (s.align === 'center' ? s.dir : `${s.dir}-${s.align}`) as DropdownPlacement;
  return (
    <Dropdown
      placement={placement === 'bottom-start' ? undefined : placement}
      haspopup={list ? 'listbox' : undefined}
      matchTriggerWidth={s.match || undefined}
      closeOnSelect={s.close ? undefined : false}
      trigger={
        <Button rightIcon="DownArrowSmall" style={s.match ? { width: 160 } : undefined}>
          {list ? '2K' : '更多操作'}
        </Button>
      }
    >
      <Menu width={s.match ? undefined : list ? 120 : 200} role={list ? 'listbox' : undefined}>
        {list
          ? ['1K', '2K', '4K'].map((v) => (
              <MenuItem key={v} selected={v === '2K'}>
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

type SidebarItemState = { type: string; state: string; text: string; left: string; more: boolean };

function renderSidebarItem(s: SidebarItemState) {
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
      className={STATE_CLASS[s.state]}
      style={{ width: 216 }}
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
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['selected', '选中']] },
        { key: 'text', label: '文字', type: 'text', value: '侧栏项' },
        { key: 'left', label: '缩略图', type: 'segment', value: 'message', options: [['message', '对话图标'], ['canvas', '画布图标'], ['image', '图片']] },
        { key: 'more', label: '更多（悬停、选中才显示）', type: 'toggle', value: false },
      ]}
      // 导航左边固定是图标，没有缩略图
      rules={(s) => (s.type === 'nav' ? { left: true } : {})}
      render={renderSidebarItem}
    />
  );
}

// ---------- SidebarLabel ----------

type SidebarLabelState = { text: string; expanded: string; showNew: boolean };

// 换了「展开」就换 key 重新来过，预览里还能点标题自己展开收起
export function SidebarLabelPlayground() {
  return (
    <Playground<SidebarLabelState>
      controls={[
        { key: 'text', label: '文字', type: 'text', value: '对话' },
        { key: 'expanded', label: '展开', type: 'segment', value: 'open', options: [['open', '展开'], ['closed', '收起']] },
        { key: 'showNew', label: '新建按钮', type: 'toggle', value: true },
      ]}
      render={(s) => (
        <SidebarLabel
          key={s.expanded}
          defaultExpanded={s.expanded === 'open' ? undefined : false}
          showNew={s.showNew ? undefined : false}
          style={{ width: 216 }}
        >
          {s.text}
        </SidebarLabel>
      )}
    />
  );
}

// ---------- SidebarMore ----------

type SidebarMoreState = { text: string };

export function SidebarMorePlayground() {
  return (
    <Playground<SidebarMoreState>
      controls={[{ key: 'text', label: '文字', type: 'text', value: '更多' }]}
      render={(s) => <SidebarMore style={{ width: 216 }}>{s.text}</SidebarMore>}
    />
  );
}
