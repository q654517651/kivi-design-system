import { Button, Divider, Menu, MenuItem, MenuLabel } from '@kivi';
import type { KwGroup, KwMember, KwProject } from '../../data/kiwi';

/*
  用量管理左栏：看哪个范围（11-27 用户点头的方案：左栏管「看哪个范围」，上面选项卡管「看什么」）。
  - 第一项「全部分组」（超管看全平台时是「全平台」），下面每个组一行，右边是人数。
  - 超管看全平台：按项目分段，项目名点了展开收起。
  - 组悬停出「⋯」：任免组管理员、重命名、删除。底部「新建分组」。
  管理员只管一个组，没有这一栏。
*/

export interface GroupSideProps {
  /** 一个项目 = 只列这个项目的组；不传 = 全平台，按项目分段 */
  project?: KwProject;
  projects: KwProject[];
  groups: KwGroup[];
  members: KwMember[];
  /** 选中的组，'' = 全部 */
  selected: string;
  onSelect: (groupId: string) => void;
  onCreate: () => void;
  onAdmins: (g: KwGroup) => void;
  onRename: (g: KwGroup) => void;
  onDelete: (g: KwGroup) => void;
}

export function GroupSide({ project, projects, groups, members, selected, onSelect, onCreate, onAdmins, onRename, onDelete }: GroupSideProps) {
  const count = (pred: (m: KwMember) => boolean) => `${members.filter(pred).length} 人`;
  const item = (g: KwGroup) => (
    <MenuItem
      key={g.id}
      selected={selected === g.id || undefined}
      shortcut={count((m) => m.groupId === g.id)}
      onClick={() => onSelect(g.id)}
      more={
        <Menu>
          <MenuItem onClick={() => onAdmins(g)}>任免组管理员</MenuItem>
          <MenuItem icon="Rename" onClick={() => onRename(g)}>
            重命名
          </MenuItem>
          <Divider />
          <MenuItem variant="danger" icon="Delete" onClick={() => onDelete(g)}>
            删除
          </MenuItem>
        </Menu>
      }
    >
      {g.name}
    </MenuItem>
  );

  return (
    <div className="app-kw-side">
      <Menu variant="plain" aria-label="分组">
        <MenuItem selected={selected === '' || undefined} shortcut={count(() => true)} onClick={() => onSelect('')}>
          {project ? '全部分组' : '全平台'}
        </MenuItem>
        {project
          ? groups.map(item)
          : projects.map((p) => (
              <MenuLabel key={p.id} collapsible defaultExpanded items={<>{groups.filter((g) => g.projectId === p.id).map(item)}</>}>
                {p.name}
              </MenuLabel>
            ))}
      </Menu>
      <Button className="app-kw-side__new" size={32} variant="ghost-muted" leftIcon="AddSmall" onClick={onCreate}>
        新建分组
      </Button>
    </div>
  );
}
