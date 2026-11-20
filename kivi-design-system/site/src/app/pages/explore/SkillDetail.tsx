import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Button, Dialog, Dropdown, ExploreCover, Menu, Prose, Select, Tag, Tree, placeholderImageSrc, type SkillItem } from '@kivi';
import { SKILL_FILES, SKILL_TREE, skillTreeExpanded, type ExploreSkill } from '../../data/catalog';
import { useLastShown } from '../../parts/media-viewer';

/*
  技能详情：名称、作者、封面、描述、技能内容（默认 SKILL.md，有别的文件用文件树切过去），底部「使用」（需求「公共技能 · 技能详情」）。
  探索页「技能」和创作首页画布广场「技能」点卡都开它（11-20 用户定：首页点了直接开详情，照线上）。
*/

function skillFile(s: SkillItem, file: string): ReactNode {
  if (file === 'SKILL.md')
    return (
      <>
        <h4>{s.title}</h4>
        <p>{s.description}</p>
        <ol>
          <li>先问清楚用途、尺寸和要放的文字。</li>
          <li>按主题出 4 个方向，每个方向一张草图。</li>
          <li>用户挑一个方向后，出完整版本并给出可以调整的地方。</li>
        </ol>
      </>
    );
  if (file.startsWith('references'))
    return (
      <>
        <h4>风格指南</h4>
        <ul>
          <li>主色用品牌绿，大面积留白。</li>
          <li>标题字号不小于画面高度的 8%。</li>
        </ul>
      </>
    );
  return (
    <>
      <h4>示例</h4>
      <p>「帮我做 4 张新春活动海报，竖版，标题写猕猴桃新年礼盒」</p>
    </>
  );
}

const cover = (s: ExploreSkill) => s.poster ?? placeholderImageSrc(s.cover, '16:9');
const who = (s: ExploreSkill) => s.author ?? { name: 'KIVI' };

export function SkillDetail({ skill, onClose, onUse }: { skill: ExploreSkill | null; onClose: () => void; onUse: (s: ExploreSkill) => void }) {
  const shownSkill = useLastShown(skill);
  const [file, setFile] = useState(SKILL_FILES[0]);
  // 换了一个技能打开，回到 SKILL.md
  useEffect(() => {
    if (skill) setFile(SKILL_FILES[0]);
  }, [skill]);

  return (
    <Dialog
      size={800}
      title={shownSkill?.title}
      open={skill !== null}
      onOpenChange={(v) => !v && onClose()}
      footer={
        shownSkill && (
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onUse(shownSkill);
            }}
          >
            使用
          </Button>
        )
      }
    >
      {shownSkill && (
        <div className="tpl-ex__skill">
          <span className="tpl-ex__shownSkill-author">
            <Avatar name={who(shownSkill).name} src={who(shownSkill).avatar} size={24} />
            {who(shownSkill).name}
            {shownSkill.recommended && <Tag>官方</Tag>}
          </span>
          <ExploreCover className="tpl-ex__skill-cover" src={cover(shownSkill)} video={shownSkill.video} playing={!!shownSkill.video} />
          <section className="tpl-ex__viewer-section">
            <h4>技能描述</h4>
            <p className="tpl-ex__skill-desc">{shownSkill.description}</p>
          </section>
          <section className="tpl-ex__viewer-section">
            <div className="tpl-ex__skill-files">
              <h4>技能内容</h4>
              <Dropdown
                haspopup="tree"
                placement="bottom-end"
                trigger={
                  <Select variant="plain" leftIcon="File" aria-label="切换文件">
                    {file}
                  </Select>
                }
              >
                <Menu role="none">
                  <Tree aria-label="技能文件" items={SKILL_TREE} selected={file} onSelectedChange={setFile} defaultExpanded={skillTreeExpanded(file)} />
                </Menu>
              </Dropdown>
            </div>
            <Prose className="tpl-ex__skill-content">{skillFile(shownSkill, file)}</Prose>
          </section>
        </div>
      )}
    </Dialog>
  );
}
