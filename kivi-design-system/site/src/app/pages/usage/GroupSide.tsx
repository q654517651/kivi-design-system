import { Divider, Icon, IconButton, Menu, MenuItem, MenuLabel, ScrollArea } from '@kivi';
import type { KwGroup, KwProject } from '../../data/kiwi';
import { FilterSelect } from '../../parts/kiwi/FilterSelect';

/*
  用量管理后台的侧栏：和主站侧栏同一套（tpl-ms__side 那几个类、Menu 无底、MenuLabel 分段），不另画（11-27 用户说：我们有侧边导航）。
  - 顶上 Logo，点了回 KIVI。
  - 导航第一项「全部分组」（超管是「全平台」）。
  - 条目用导航那种图标（20，不带方框；11-27 用户定，缩略图格子是给对话历史这种有封面的）。全部分组 UserGroup、每个组 UserMultiple（Hugeicons 补的）。
    条目必须带图标或缩略图：侧栏菜单里不带的会被当成「更多」（12 号灰字、悬停没底色），11-27 去掉过一次就变成这样，又加回来了。
  - 下面「分组」一段：标题点了展开收起，右边「+」新建分组；每个组悬停出「⋯」：重命名、删除（任免组管理员在成员的「⋯ → 调整权限」里，11-27 用户定）。
  - 超管：Logo 下面一个项目下拉（全平台 / 各项目），切到项目后和项目管理员一样；全平台时下面列项目，点了切过去（11-27 用户：超管要能切项目）。
  管理员只管一个组，没有这一栏。
*/

export interface GroupSideProps {
  /** 当前项目；不传 = 全平台（只有超管会这样） */
  project?: KwProject;
  projects: KwProject[];
  groups: KwGroup[];
  /** 选中的组 id，'' = 全部分组 / 全平台 */
  selected: string;
  onSelect: (groupId: string) => void;
  /** 超管：侧栏顶上能切项目 */
  canPickProject?: boolean;
  /** 切项目，'' = 全平台 */
  onPickProject?: (projectId: string) => void;
  onHome: () => void;
  onCreate: (projectId: string) => void;
  onRename: (g: KwGroup) => void;
  onDelete: (g: KwGroup) => void;
}

export function GroupSide({ project, projects, groups, selected, onSelect, canPickProject, onPickProject, onHome, onCreate, onRename, onDelete }: GroupSideProps) {
  const item = (g: KwGroup) => (
    <MenuItem
      key={g.id}
      icon="UserMultiple"
      selected={selected === g.id || undefined}
      onClick={() => onSelect(g.id)}
      more={
        <Menu>
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
    <div className="tpl-ms__side-wrap">
      <ScrollArea className="tpl-ms__side-scroll">
        <aside className="tpl-ms__side">
          <div className="tpl-ms__brand">
            <button type="button" className="tpl-ms__home" aria-label="返回 KIVI" onClick={onHome}>
              <Icon name="Logo" />
            </button>
          </div>
          {canPickProject && (
            <div className="app-kw-side__project">
              <FilterSelect label="项目" value={project?.id ?? ''} options={[{ value: '', label: '全平台' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} onChange={(v) => onPickProject?.(v)} />
            </div>
          )}
          <Menu variant="plain" aria-label="用量管理导航">
            <MenuItem icon="UserGroup" selected={selected === '' || undefined} onClick={() => onSelect('')}>
              {project ? '全部分组' : '全平台'}
            </MenuItem>
            <div className="tpl-ms__gap" />
            {project ? (
              <MenuLabel
                collapsible
                defaultExpanded
                action={<IconButton icon="Add" label="新建分组" size={28} variant="ghost-muted" onClick={() => onCreate(project.id)} />}
                items={<>{groups.filter((g) => g.projectId === project.id).map(item)}</>}
              >
                分组
              </MenuLabel>
            ) : (
              // 全平台：列出项目，点了切到那个项目
              <MenuLabel
                collapsible
                defaultExpanded
                items={
                  <>
                    {projects.map((p) => (
                      <MenuItem key={p.id} icon="Folder" onClick={() => onPickProject?.(p.id)}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </>
                }
              >
                项目
              </MenuLabel>
            )}
          </Menu>
        </aside>
      </ScrollArea>
    </div>
  );
}
