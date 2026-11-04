import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button, IconButton } from '../button';
import { EmptyState, Loading } from '../feedback';
import { Input } from '../inputs';
import { Dropdown, Menu, MenuItem } from '../menu';
import { TabItem, Tabs } from '../navigation';
import { PlaceholderImage, type PlaceholderImageName } from '../placeholder-image';
import { ScrollArea } from '../scroll-area';
import { Tag } from '../tags-avatar';
import { Popover } from '../tooltip';
import { cx } from '../utils';
import './generation.css';

/*
  技能面板：Agent 输入框工具条的「技能」按钮点开的面板。主站 Agent、画布 Agent 共用这一份（两个 Agent 一套）。
  照线上 SkillSelectorPopover，组件都是库里已有的：Tabs、Input（搜索）、两行 MenuItem、Tag、Popover 面板（悬停预览）、EmptyState。
  技能和分类都由外面传进来（线上是后端下发的），组件里不带任何内容。
*/

export interface SkillItem {
  id: string;
  /** 名字 */
  title: string;
  /** 一句话说明，列表里一行省略，悬停预览里看全文 */
  description?: string;
  /** 分类，要在 `categories` 里 */
  category: string;
  /** 封面：没有就用 KIVI 的占位图 */
  cover?: PlaceholderImageName;
  /** 推荐的：出现在「推荐」页签里 */
  recommended?: boolean;
  /** 我创建的 */
  mine?: boolean;
  /** 公开的（只在「我的」里标「公共技能」） */
  public?: boolean;
}

/** 技能面板列表的状态：正常 / 加载中 / 加载失败 */
export type SkillPanelStatus = 'ready' | 'loading' | 'failed';

export interface SkillPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 列表的状态：正常 / 加载中 / 加载失败，默认正常。模板摆状态用 */
  status?: SkillPanelStatus;
  /** 技能。没有就显示「暂无技能」 */
  items?: SkillItem[];
  /** 分类，排在「推荐」后面、「我的」前面。线上是后端下发的 */
  categories?: string[];
  /** 一开始在哪个页签：`recommend`、分类名或 `mine`，默认推荐 */
  defaultTab?: string;
  /** 一开始就是搜索、搜的字 */
  defaultSearch?: string;
  /** 点了一个技能：插进输入框，面板关上 */
  onPick?: (skill: SkillItem) => void;
}

/** 技能面板本体（不带触发器），模板里直接摆出来看。Figma 还没有（待确认） */
export const SkillPanel = forwardRef<HTMLDivElement, SkillPanelProps>(function SkillPanel(
  { status = 'ready', items = [], categories = [], defaultTab = 'recommend', defaultSearch, onPick, className, ...rest },
  ref,
) {
  const [tab, setTab] = useState(defaultTab);
  const [searching, setSearching] = useState(defaultSearch !== undefined);
  const [keyword, setKeyword] = useState(defaultSearch ?? '');

  const inTab = items.filter((s) => (tab === 'recommend' ? s.recommended : tab === 'mine' ? s.mine : s.category === tab));
  const k = keyword.trim();
  const list = k ? inTab.filter((s) => s.title.includes(k) || s.description?.includes(k)) : inTab;

  const closeSearch = () => {
    setSearching(false);
    setKeyword('');
  };

  // 搜索框里按 Esc 只关搜索、不关面板：挂在 window 的捕获阶段，比 Dropdown 挂在 document 上的先收到
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!searching) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !searchRef.current?.contains(document.activeElement)) return;
      e.stopPropagation();
      closeSearch();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searching]);

  const body = () => {
    if (status === 'loading') return <Loading className="kv-skill-panel__state" />;
    if (status === 'failed')
      return (
        <div className="kv-skill-panel__state">
          <span>加载失败</span>
          <Button size={28} variant="light">
            点击重试
          </Button>
        </div>
      );
    if (list.length === 0) {
      if (k) return <EmptyState size={96} title="没有搜索到技能" className="kv-skill-panel__state" />;
      if (tab === 'mine')
        return (
          <EmptyState
            size={96}
            title="你还没有创建技能，开始创建吧"
            action={<Button variant="light">创建技能</Button>}
            className="kv-skill-panel__state"
          />
        );
      return <EmptyState size={96} title="暂无技能" className="kv-skill-panel__state" />;
    }
    return (
      <ScrollArea className="kv-skill-panel__scroll" maxHeight="100%">
        <div className="kv-skill-panel__list" role="menu" aria-label="技能">
          {list.map((s) => (
            <SkillRow key={s.id} skill={s} showPublic={tab === 'mine'} onPick={onPick} />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div ref={ref} className={cx('kv-skill-panel', className)} role="dialog" aria-label="技能" {...rest}>
      <div className="kv-skill-panel__head">
        <span className="kv-skill-panel__title">技能</span>
        <div className="kv-skill-panel__actions">
          <Dropdown placement="bottom-end" trigger={<Button size={28} variant="secondary" leftIcon="Add" rightIcon="DownArrowSmall">创建</Button>}>
            <Menu>
              <MenuItem icon="Skill" description="通过与 Agent 对话创建">
                创建新的技能
              </MenuItem>
              <MenuItem icon="Upload" description="上传 .md 文件或文件夹">
                导入已有技能
              </MenuItem>
            </Menu>
          </Dropdown>
          <Button size={28} variant="secondary">
            全部技能
          </Button>
        </div>
      </div>

      {searching ? (
        <div ref={searchRef} className="kv-skill-panel__search">
          <Input
            leftIcon="Search"
            clearable
            autoFocus={defaultSearch === undefined}
            placeholder="搜索技能"
            aria-label="搜索技能"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button size={28} variant="text" onClick={closeSearch}>
            取消
          </Button>
        </div>
      ) : (
        <div className="kv-skill-panel__tabs">
          <Tabs value={tab} onChange={setTab} aria-label="技能分类">
            <TabItem value="recommend">推荐</TabItem>
            {categories.map((c) => (
              <TabItem key={c} value={c}>
                {c}
              </TabItem>
            ))}
            <TabItem value="mine">我的</TabItem>
          </Tabs>
          <IconButton icon="Search" label="搜索技能" variant="text" size={28} onClick={() => setSearching(true)} />
        </div>
      )}

      <div className="kv-skill-panel__body">{body()}</div>
    </div>
  );
});
SkillPanel.displayName = 'SkillPanel';

/** 一行技能：两行菜单项 + 悬停出「详情」+ 左边出预览卡。技能没有不能点的状态 */
function SkillRow({ skill, showPublic, onPick }: { skill: SkillItem; showPublic: boolean; onPick?: (skill: SkillItem) => void }) {
  const label = (
    <>
      {skill.title}
      {showPublic && skill.public && <Tag className="kv-skill-panel__badge">公共技能</Tag>}
    </>
  );
  const item = (
    <MenuItem
      icon="Tool"
      description={skill.description}
      onClick={() => onPick?.(skill)}
    >
      {label}
    </MenuItem>
  );

  return (
    <Popover
      variant="panel"
      placement="left-start"
      // 悬停出来的离 8：从面板外边量，行在面板里还缩进了 8（面板内边距）
      offset={16}
      delay={0}
      className="kv-skill-panel__row"
      content={
        <div className="kv-skill-panel__preview">
          <PlaceholderImage image={skill.cover ?? 'kiwi-glass'} ratio="16:9" className="kv-skill-panel__preview-cover" />
          <b className="kv-skill-panel__preview-title">{skill.title}</b>
          {skill.description && <p className="kv-skill-panel__preview-desc">{skill.description}</p>}
        </div>
      }
    >
      <div className="kv-skill-panel__row-inner">
        {item}
        <Button size={28} variant="light" className="kv-skill-panel__detail">
          详情
        </Button>
      </div>
    </Popover>
  );
}
