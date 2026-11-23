import { useState } from 'react';
import { AssetThumb, Button, Divider, IconButton, Menu, MenuItem, MenuLabel } from '@kivi';

/*
  侧栏的一段（对话 / 画布）：MenuLabel 带 items，标题点了展开收起，列表往下推开、淡入，收起倒着走（Collapse，300ms ease-in-out）。
  默认显示 6 条，点「更多」每次多 10 条，全显示了「更多」就没了（照线上）。
  对话：标题右边新建（NewChat）；画布：标题右边「全部」+ 新建（Add），条目悬停「⋯」左边多一个「在新标签页打开」（11-11 用户定）。
  列表由外面传进来（侧栏从 db 读、排好序），这里只管展示和点击。
*/

export interface HistoryItem {
  id: string;
  text: string;
  thumb?: string;
  /** 置顶：右边挂置顶图标（悬停换成「⋯」），菜单里写「取消置顶」 */
  pinned?: boolean;
  /** 默认对话：一直置顶、排第一个（挂置顶图标），菜单里只有重命名（不能取消置顶、不能删，11-23 用户定） */
  fixed?: boolean;
}

/** 侧栏历史默认显示几条、点「更多」每次多几条（照线上） */
const HISTORY_FIRST = 6;
const HISTORY_STEP = 10;

export interface HistoryGroupProps {
  title: string;
  items: HistoryItem[];
  icon: 'Message' | 'Canvas';
  selected: string;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onPin: (id: string) => void;
  /** 画布：标题右边「全部」，去我的资产看全部画布。不传就没有，新建图标是 NewChat */
  onAll?: () => void;
  /** 画布：条目悬停「⋯」左边的「在新标签页打开」。不传就没有 */
  onOpenNewTab?: (id: string) => void;
}

export function HistoryGroup({ title, items, icon, selected, collapsed, onSelect, onNew, onRemove, onRename, onPin, onAll, onOpenNewTab }: HistoryGroupProps) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [shown, setShown] = useState(HISTORY_FIRST);
  return (
    <MenuLabel
      collapsible
      collapsed={collapsed}
      expanded={open}
      onExpandedChange={setOpen}
      extra={
        onAll && (
          <Button size={28} variant="ghost-muted" onClick={onAll}>
            全部
          </Button>
        )
      }
      action={
        <IconButton
          icon={onAll ? 'Add' : 'NewChat'}
          label={`新建${title}`}
          size={28}
          variant="ghost-muted"
          onClick={() => {
            setOpen(true);
            onNew();
          }}
        />
      }
      items={
        <>
          {items.slice(0, shown).map((c) => (
            <MenuItem
              key={c.id}
              thumb={c.thumb ? <AssetThumb size={24} type="image" src={c.thumb} /> : <AssetThumb size={24} type="icon" icon={icon} />}
              collapsed={collapsed}
              selected={selected === c.id || undefined}
              pinned={c.pinned}
              onClick={() => onSelect(c.id)}
              editing={editing === c.id}
              onEditingChange={(v) => setEditing(v ? c.id : null)}
              onRename={(name) => onRename(c.id, name)}
              actions={onOpenNewTab && <IconButton icon="NewWindow" label="在新标签页打开" size={28} variant="ghost-muted" onClick={() => onOpenNewTab(c.id)} />}
              more={
                // 重命名（在原地改名）、置顶（新版要加，置顶后变「取消置顶」，照线上资产文件夹）、删除
                <Menu>
                  <MenuItem icon="Rename" onClick={() => setEditing(c.id)}>
                    重命名
                  </MenuItem>
                  {!c.fixed && (
                    <>
                      <MenuItem icon="StickyOnTop" onClick={() => onPin(c.id)}>
                        {c.pinned ? '取消置顶' : '置顶'}
                      </MenuItem>
                      <Divider />
                      <MenuItem variant="danger" icon="Delete" onClick={() => onRemove(c.id)}>
                        删除
                      </MenuItem>
                    </>
                  )}
                </Menu>
              }
            >
              {c.text}
            </MenuItem>
          ))}
          {shown < items.length && (
            <MenuItem collapsed={collapsed} onClick={() => setShown((n) => n + HISTORY_STEP)}>
              更多
            </MenuItem>
          )}
        </>
      }
    >
      {title}
    </MenuLabel>
  );
}
