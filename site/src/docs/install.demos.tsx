import { useState } from 'react';
import { TabItem, Tabs } from '@kivi';
import { CodeBlock } from '@shell';
import './install.css';

// 装技能：选系统、选 AI 工具，下面出一段发给 AI 的话。克隆 skill 分支（只有技能本身），装好的技能每次用前自己 git pull

const REPO = 'https://github.com/q654517651/kivi-design-system.git';

type System = 'mac' | 'windows';
type Tool = 'claude' | 'codex' | 'cursor';

const TOOLS: { value: Tool; label: string; dir: string }[] = [
  { value: 'claude', label: 'Claude Code', dir: '.claude' },
  { value: 'codex', label: 'Codex', dir: '.codex' },
  { value: 'cursor', label: 'Cursor', dir: '.cursor' },
];

function prompt(system: System, tool: Tool) {
  const dir = TOOLS.find((t) => t.value === tool)!.dir;
  const target = system === 'mac' ? `~/${dir}/skills/kivi-design-system` : `$HOME\\${dir}\\skills\\kivi-design-system`;
  const shell = system === 'mac' ? '在终端运行' : '在 PowerShell 运行（没有 Git 先装 Git）';
  return `帮我安装 KIVI 设计规范技能，${shell}：

git clone -b skill --single-branch ${REPO} ${target}

这个文件夹已经存在的话，先删掉再运行。装完告诉我结果。`;
}

export function InstallPrompt() {
  const [system, setSystem] = useState<System>(() => (/Win/i.test(navigator.platform) ? 'windows' : 'mac'));
  const [tool, setTool] = useState<Tool>('claude');
  return (
    <div className="install">
      <div className="install__pick">
        <div className="install__row">
          <span className="install__label">系统</span>
          <Tabs variant="segment" value={system} onChange={(v) => setSystem(v as System)} aria-label="系统">
            <TabItem value="mac">macOS / Linux</TabItem>
            <TabItem value="windows">Windows</TabItem>
          </Tabs>
        </div>
        <div className="install__row">
          <span className="install__label">工具</span>
          <Tabs variant="segment" value={tool} onChange={(v) => setTool(v as Tool)} aria-label="AI 工具">
            {TOOLS.map((t) => (
              <TabItem key={t.value} value={t.value}>
                {t.label}
              </TabItem>
            ))}
          </Tabs>
        </div>
      </div>
      <CodeBlock code={prompt(system, tool)} lang="text" />
    </div>
  );
}
