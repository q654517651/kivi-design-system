import { useState } from 'react';
import {
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  SidebarItem,
  SidebarLabel,
  SidebarMore,
  toast,
  type IconName,
} from '@kivi';
import { CANVASES, CHATS, src, type Recent } from './data';

const NAV: { id: string; icon: IconName; label: string }[] = [
  { id: 'create', icon: 'Create', label: '创作' },
  { id: 'explore', icon: 'Explore', label: '探索' },
  { id: 'assets', icon: 'Folder', label: '资产' },
  // Figma 图标表里没有「主体」对应的图标，先用 OmniReference（全能参考）顶着，待设计确认
  { id: 'subject', icon: 'OmniReference', label: '主体' },
];

/** 最近列表里一项的「更多」菜单，同一份给对话和画布用 */
const RecentMenu = () => (
  <Menu width={160}>
    <MenuItem icon="Pin" onClick={() => toast.info('已置顶')}>置顶</MenuItem>
    <MenuItem icon="Share" onClick={() => toast.info('已复制分享链接')}>分享</MenuItem>
    <MenuDivider />
    <MenuItem icon="Delete" variant="danger" onClick={() => toast.success('已删除')}>删除</MenuItem>
  </Menu>
);

/** 一个可折叠的最近列表：分组标题 + 条目 + 更多 */
function RecentGroup({
  title,
  newLabel,
  icon,
  items,
  current,
  onSelect,
}: {
  title: string;
  newLabel: string;
  icon: IconName;
  items: Recent[];
  current: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <>
      <SidebarLabel
        expanded={expanded}
        onExpandedChange={setExpanded}
        newLabel={newLabel}
        onNew={() => toast.info(`${newLabel}（原型里没做）`)}
      >
        {title}
      </SidebarLabel>
      {expanded && (
        <>
          {items.map((it) => (
            <SidebarItem
              key={it.id}
              variant="list"
              thumb={it.image ? 'image' : 'icon'}
              thumbSrc={it.image ? src(it.image) : undefined}
              thumbIcon={icon}
              selected={current === it.id}
              onClick={() => onSelect(it.id)}
              more
              moreMenu={<RecentMenu />}
            >
              {it.name}
            </SidebarItem>
          ))}
          <SidebarMore onClick={() => toast.info('展开全部（原型里没做）')} />
        </>
      )}
    </>
  );
}

/** 主站侧栏：导航 + 对话、画布两组最近列表。同一时间只有一项选中 */
export function Sidebar({ current, onSelect }: { current: string; onSelect: (id: string) => void }) {
  return (
    <aside className="ast-side" aria-label="主站侧栏">
      <div className="ast-side__logo">
        <Icon name="Logo" size={24} aria-label="KIVI" />
      </div>
      <nav className="ast-side__nav" aria-label="主导航">
        {NAV.map((n) => (
          <SidebarItem key={n.id} icon={n.icon} selected={current === n.id} onClick={() => onSelect(n.id)}>
            {n.label}
          </SidebarItem>
        ))}
      </nav>
      <div className="ast-side__rule" role="separator" />
      <div className="ast-side__scroll">
        <RecentGroup title="对话" newLabel="新建对话" icon="Message" items={CHATS} current={current} onSelect={onSelect} />
        <RecentGroup title="画布" newLabel="新建画布" icon="Canvas" items={CANVASES} current={current} onSelect={onSelect} />
      </div>
    </aside>
  );
}
