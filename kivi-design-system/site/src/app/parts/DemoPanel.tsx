import { Button, IconButton, Popover, Switch, TabItem, Tabs, toast } from '@kivi';
import { db } from '../data/db';
import { demo, setDemo, useDemo, type DemoSwitches } from '../data/demo';
import { PREVIEW_BRANCH, PREVIEW_LINKS, switchPreview } from '../preview';

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
            {/* 部署的网站才有：切到别的分支版本，停在同一页（app/preview.ts） */}
            {PREVIEW_LINKS.length > 1 && (
              <Tabs variant="segment" value={PREVIEW_BRANCH} onChange={switchPreview} aria-label="分支">
                {PREVIEW_LINKS.map((l) => (
                  <TabItem key={l.name} value={l.name}>
                    {l.label}
                  </TabItem>
                ))}
              </Tabs>
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
              onClick={() => {
                db.reset();
                demo.reset();
                toast.success('演示数据已重置');
              }}
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
