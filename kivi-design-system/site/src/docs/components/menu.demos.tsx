import { type ReactNode } from 'react';
import { AssetThumb, Button, Dropdown, IconButton, Menu, Divider, MenuItem, MenuLabel, type DropdownPlacement, type IconName } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 菜单页的属性面板：所有类型、状态都在面板里切。参数表在 menu.mdx

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover' };
const THUMB = './placeholders/kiwi-light-1x1.webp';

// ---------- Menu（宽度、分组标题、分割线、条目数量） ----------

type MenuState = { width: string; label: boolean; divider: boolean; count: string };

const ROWS: { icon: IconName; text: string }[] = [
  { icon: 'Copy', text: '复制' },
  { icon: 'Share', text: '分享' },
  { icon: 'Download', text: '下载' },
  { icon: 'Rename', text: '重命名' },
  { icon: 'StickyOnTop', text: '置顶' },
  { icon: 'Upload', text: '上传' },
  { icon: 'ImageEditing', text: '编辑' },
  { icon: 'Collect', text: '收藏' },
  { icon: 'Link', text: '复制链接' },
  { icon: 'Search', text: '搜索' },
  { icon: 'Folder', text: '移动到' },
  { icon: 'Reset', text: '重置' },
];

// 条目是普通 MenuItem，随便增删；分割线后面跟一个危险项
function renderMenu(s: MenuState) {
  const rows = ROWS.slice(0, Number(s.count));
  return (
    <Menu width={Number(s.width)}>
      {s.label && <MenuLabel>分组标题</MenuLabel>}
      {rows.map((r) => (
        <MenuItem key={r.text} icon={r.icon}>
          {r.text}
        </MenuItem>
      ))}
      {s.divider && <Divider />}
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
        { key: 'width', label: '宽度', type: 'segment', value: '200', options: [['120', '120'], ['160', '160'], ['200', '200'], ['240', '240']] },
        { key: 'count', label: '条目数量', type: 'segment', value: '3', options: [['1', '1'], ['3', '3'], ['5', '5'], ['8', '8'], ['12', '12（滚动）']] },
        { key: 'label', label: '分组标题', type: 'toggle', value: false },
        { key: 'divider', label: '分割线', type: 'toggle', value: false },
      ]}
      render={renderMenu}
    />
  );
}

// ---------- MenuItem ----------

type MenuItemState = {
  type: string;
  state: string;
  text: string;
  left: string;
  right: string;
  shortcutText: string;
  twoLine: boolean;
  description: string;
};

// 菜单项放在 Menu 里才有玻璃底，这里放一条
function renderMenuItem(s: MenuItemState) {
  const danger = s.type === 'danger';
  const selected = s.state === 'selected';
  const check = s.right === 'check';
  return (
    <Menu width={s.twoLine ? 240 : 200} role={selected && !check ? 'listbox' : undefined}>
      <MenuItem
        variant={danger ? 'danger' : undefined}
        description={s.twoLine ? s.description : undefined}
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
    </Menu>
  );
}

export function MenuItemPlayground() {
  return (
    <Playground<MenuItemState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'normal', options: [['normal', '普通'], ['danger', '危险']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['disabled', '禁用'], ['selected', '选中']] },
        { key: 'text', label: '文字', type: 'text', value: '菜单项' },
        { key: 'twoLine', label: '两行描述', type: 'toggle', value: false },
        { key: 'description', label: '描述', type: 'text', value: '这是一行说明文字' },
        { key: 'left', label: '左边', type: 'segment', value: 'icon', options: [['none', '无'], ['icon', '图标'], ['thumb', '缩略图']] },
        { key: 'right', label: '右边', type: 'segment', value: 'none', options: [['none', '无'], ['shortcut', '快捷键'], ['submenu', '子菜单箭头'], ['check', '勾选']] },
        { key: 'shortcutText', label: '快捷键', type: 'text', value: '⌘C' },
      ]}
      // 危险没有选中；两行的选中在右边打勾，所以右边不能再选别的；描述文字只在开了两行时出现；快捷键文字只在右边选了快捷键时出现
      rules={(s) => ({
        ...(s.type === 'danger' ? { state: ['selected'] } : {}),
        ...(s.twoLine && s.state === 'selected' ? { right: ['shortcut', 'submenu', 'check'] } : {}),
        ...(!s.twoLine ? { description: true } : {}),
        ...(s.right !== 'shortcut' ? { shortcutText: true } : {}),
      })}
      render={renderMenuItem}
    />
  );
}

// ---------- 平铺（侧栏）：Menu variant="plain" ----------

type PlainState = { state: string; text: string; thumb: string; more: boolean; action: boolean; bare: boolean; expanded: string; collapsed: boolean };

/** 收起时宽度跟着外面的侧栏：这里用一个 216 / 36 的框代替侧栏，宽度变化 300ms ease-in-out。代码里不写它 */
function SidebarBox({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return <div style={{ width: collapsed ? 36 : 216, transition: 'width var(--motion-duration-300) var(--motion-ease-in-out)' }}>{children}</div>;
}
SidebarBox.docFrame = true;

// 点标题展开收起、点第一条选中、改名（回车）都写回面板
function renderPlain(s: PlainState, update: (patch: Partial<PlaygroundState>) => void) {
  const c = s.collapsed || undefined;
  const hover = STATE_CLASS[s.state];
  return (
    <SidebarBox collapsed={s.collapsed}>
      <Menu variant="plain" aria-label="侧栏">
        <MenuItem icon="Create" collapsed={s.collapsed}>
          新建
        </MenuItem>
        <MenuLabel
          collapsible
          collapsed={c}
          expanded={s.expanded === 'open'}
          onExpandedChange={(v) => update({ expanded: v ? 'open' : 'closed' })}
          action={s.action || s.collapsed ? <IconButton icon="NewChat" label="新建对话" size={28} variant="light" /> : undefined}
          items={
            <>
              <MenuItem
                thumb={
                  s.thumb === 'image' ? (
                    <AssetThumb size={24} type="image" src={THUMB} />
                  ) : (
                    <AssetThumb size={24} type="icon" icon={s.thumb === 'canvas' ? 'Canvas' : 'Message'} />
                  )
                }
                collapsed={s.collapsed}
                selected={s.state === 'selected' || undefined}
                onClick={() => update({ state: 'selected' })}
                editing={s.state === 'editing'}
                onEditingChange={(v) => update({ state: v ? 'editing' : 'default' })}
                onRename={(name) => update({ text: name })}
                more={
                  s.more && !s.collapsed ? (
                    <Menu>
                      <MenuItem icon="Rename" onClick={() => update({ state: 'editing' })}>
                        重命名
                      </MenuItem>
                      <MenuItem icon="StickyOnTop">置顶</MenuItem>
                      <Divider />
                      <MenuItem icon="Delete" variant="danger">
                        删除
                      </MenuItem>
                    </Menu>
                  ) : undefined
                }
                className={hover}
              >
                {s.text}
              </MenuItem>
              <MenuItem thumb={<AssetThumb size={24} type="icon" icon={s.thumb === 'canvas' ? 'Canvas' : 'Message'} />} collapsed={s.collapsed}>
                夏日饮品系列
              </MenuItem>
              {s.bare && <MenuItem collapsed={s.collapsed}>更多</MenuItem>}
            </>
          }
        >
          对话
        </MenuLabel>
      </Menu>
    </SidebarBox>
  );
}

export function PlainMenuPlayground() {
  return (
    <Playground<PlainState>
      controls={[
        { key: 'state', label: '条目状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['selected', '选中'], ['editing', '重命名中']] },
        { key: 'text', label: '条目文字', type: 'text', value: '生成一张猕猴桃海报' },
        { key: 'thumb', label: '缩略图', type: 'segment', value: 'message', options: [['message', '对话图标'], ['canvas', '画布图标'], ['image', '图片']] },
        { key: 'more', label: '「⋯」更多菜单（悬停、选中才显示）', type: 'toggle', value: true },
        { key: 'action', label: '分组标题右边的新建（悬停才显示）', type: 'toggle', value: true },
        { key: 'bare', label: '「更多」条目', type: 'toggle', value: true },
        { key: 'expanded', label: '分组', type: 'segment', value: 'open', options: [['open', '展开'], ['closed', '收起']] },
        { key: 'collapsed', label: '收起成图标栏', type: 'toggle', value: false },
      ]}
      // 收起成图标栏后「⋯」不显示、不能重命名，新建按钮一直显示
      rules={(s) => (s.collapsed ? { more: true, action: true, state: ['editing'] } : {})}
      render={renderPlain}
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
              <Divider key="divider" />,
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
