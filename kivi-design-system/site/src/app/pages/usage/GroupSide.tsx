import { Fragment } from 'react';
import { Divider, Icon, IconButton, Menu, MenuItem, MenuLabel, ScrollArea } from '@kivi';
import type { KwGroup, KwProject } from '../../data/kiwi';

/*
  用量管理后台的侧栏：和主站侧栏同一套（tpl-ms__side 那几个类、Menu 无底、MenuLabel 分段），不另画（11-27 用户说：我们有侧边导航）。
  - 顶上 Logo，点了回 KIVI。
  - 导航第一项「全部分组」（超管是「全平台」）。条目都不带图标（11-27 用户定）。
  - 下面「分组」一段：标题点了展开收起，右边「+」新建分组；每个组悬停出「⋯」：任免组管理员、重命名、删除。
  - 超管：每个项目一段（标题是项目名），段里第一项是「全部分组」（看整个项目），新建分组建在这个项目里。
  管理员只管一个组，没有这一栏。
  选中值：'' = 全部 / 全平台，'p:项目 id' = 整个项目，其他 = 组 id。
*/

export interface GroupSideProps {
  /** 一个项目 = 只列这个项目的组；不传 = 全平台，按项目分段（超管） */
  project?: KwProject;
  projects: KwProject[];
  groups: KwGroup[];
  selected: string;
  onSelect: (key: string) => void;
  onHome: () => void;
  onCreate: (projectId: string) => void;
  onAdmins: (g: KwGroup) => void;
  onRename: (g: KwGroup) => void;
  onDelete: (g: KwGroup) => void;
}

export function GroupSide({ project, projects, groups, selected, onSelect, onHome, onCreate, onAdmins, onRename, onDelete }: GroupSideProps) {
  const item = (g: KwGroup) => (
    <MenuItem
      key={g.id}
      selected={selected === g.id || undefined}
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
  const section = (p: KwProject, title: string, withAll: boolean) => (
    <MenuLabel
      key={p.id}
      collapsible
      defaultExpanded
      action={<IconButton icon="Add" label="新建分组" size={28} variant="ghost-muted" onClick={() => onCreate(p.id)} />}
      items={
        <>
          {withAll && (
            <MenuItem selected={selected === `p:${p.id}` || undefined} onClick={() => onSelect(`p:${p.id}`)}>
              全部分组
            </MenuItem>
          )}
          {groups.filter((g) => g.projectId === p.id).map(item)}
        </>
      }
    >
      {title}
    </MenuLabel>
  );

  return (
    <div className="tpl-ms__side-wrap">
      <ScrollArea className="tpl-ms__side-scroll">
        <aside className="tpl-ms__side">
          <div className="tpl-ms__brand">
            <button type="button" className="tpl-ms__home" aria-label="返回 KIVI" onClick={onHome}>
              <Icon name="Logo" />
            </button>
          </div>
          <Menu variant="plain" aria-label="用量管理导航">
            <MenuItem selected={selected === '' || undefined} onClick={() => onSelect('')}>
              {project ? '全部分组' : '全平台'}
            </MenuItem>
            {project ? (
              <>
                <div className="tpl-ms__gap" />
                {section(project, '分组', false)}
              </>
            ) : (
              projects.map((p) => (
                <Fragment key={p.id}>
                  <div className="tpl-ms__gap" />
                  {section(p, p.name, true)}
                </Fragment>
              ))
            )}
          </Menu>
        </aside>
      </ScrollArea>
    </div>
  );
}
