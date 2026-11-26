import { Button, Dropdown, IconButton, Menu, MenuItem, Popover, Select, Switch, toast } from '@kivi';
import { db } from '../data/db';
import { demo, setDemo, useDemo, type DemoSwitches } from '../data/demo';
import { resetMemory } from '../data/memory';
import { PREVIEW_BRANCH, PREVIEW_LINKS, switchPreview } from '../preview';

/*
  重置演示数据（11-20 修 S-3）：本机数据、演示开关、记忆都回到初始，再整页刷新，
  页面里的选中、弹窗、挂起的慢请求一起清掉；刷新后出「演示数据已重置」。
*/
const RESET_FLAG = 'kivi-app-reset';

function resetDemo() {
  db.reset();
  demo.reset();
  resetMemory();
  try {
    sessionStorage.setItem(RESET_FLAG, '1');
  } catch {
    /* 存不了就不提示 */
  }
  location.reload();
}

/** 刷新后补一句提示 */
function toastAfterReset() {
  try {
    if (sessionStorage.getItem(RESET_FLAG)) {
      sessionStorage.removeItem(RESET_FLAG);
      setTimeout(() => toast.success('演示数据已重置'), 300);
    }
  } catch {
    /* 读不了就算了 */
  }
}
if (typeof window !== 'undefined') toastAfterReset();

/*
  演示开关：右边竖向居中一个小按钮，点开切出错状态。不是产品功能，只在演示站里有。
*/

const ROWS: { key: keyof DemoSwitches; label: string }[] = [
  { key: 'fast', label: '快速出结果（3 秒）' },
  { key: 'failNext', label: '下次生成失败' },
  { key: 'lowBalance', label: '余额不足' },
  { key: 'offline', label: '断网' },
  { key: 'slow', label: '慢网' },
];

export function DemoPanel() {
  const d = useDemo();
  const on = ROWS.some((r) => r.key !== 'fast' && d[r.key]);
  return (
    <div className="app-demo">
      <Popover
        variant="panel"
        on="click"
        placement="left"
        title="演示开关"
        content={
          <div className="app-demo__panel">
            {/* 部署的网站才有：切到别的分支版本，停在同一页（app/preview.ts）。分支多了分段放不下，用下拉（11-26 用户定） */}
            {PREVIEW_LINKS.length > 1 && (
              <Dropdown
                className="app-demo__branch"
                haspopup="listbox"
                trigger={<Select aria-label="分支">{PREVIEW_LINKS.find((l) => l.name === PREVIEW_BRANCH)?.label ?? PREVIEW_BRANCH}</Select>}
              >
                <Menu role="listbox" aria-label="分支">
                  {PREVIEW_LINKS.map((l) => (
                    <MenuItem key={l.name} selected={l.name === PREVIEW_BRANCH} onClick={() => switchPreview(l.name)}>
                      {l.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Dropdown>
            )}
            {ROWS.map((r) => (
              <Switch key={r.key} checked={d[r.key]} onChange={(v) => setDemo({ [r.key]: v })}>
                {r.label}
              </Switch>
            ))}
            <Button
              size={28}
              variant="secondary-muted"
              leftIcon="Reset"
              onClick={resetDemo}
            >
              重置演示数据
            </Button>
          </div>
        }
      >
        <IconButton icon="Configuration" label="演示开关" variant={on ? 'primary' : 'secondary'} size={36} />
      </Popover>
    </div>
  );
}
