import { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Divider, Icon, IconButton, Popover, toast } from '@kivi';
import { useBalance } from '../../data/db';
import { UserMenu } from '../../parts/shell/UserMenu';
import { shareCanvas } from '../../flows/share';
import './node-tools.css';

/*
  画布右上角的分享（照线上 layouts/canvas/components/HeaderToolbar/ShareToolbarButton.tsx）：
  一个分享图标，悬停出说明「通过链接分享画布」，点了直接复制分享链接、Toast「分享链接已复制」，图标换成对勾 2 秒。
  线上没有弹窗和权限设置，只有这一个按钮。链接是假的，不会真的能打开。
  右上角三样（分享、余额、头像）收进一个玻璃按钮条 44，和左上角画布切换（CanvasHeader）一样高（11-19 用户定）：
  分享｜竖线｜猕猴桃 + 余额｜头像 32（点了出账号菜单，同主站）。
*/

const COPIED_MS = 2000;

export function CanvasCorner({ canvasId }: { canvasId: string }) {
  const balance = useBalance();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const share = async () => {
    await shareCanvas(canvasId);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <ButtonGroup variant="glass" size={44} aria-label="分享和账号" className="app-cv-corner">
      <Popover
        placement="bottom-end"
        title="通过链接分享画布"
        content="任何拥有此链接的人都可以查看并克隆你的画布。"
      >
        <IconButton icon={copied ? 'CheckSmall' : 'Share'} label="分享" tooltip={false} onClick={() => void share()} />
      </Popover>
      <Divider orientation="vertical" />
      <span className="app-cv-corner__balance" aria-label={`余额 ${balance}`}>
        <Icon name="Kiwi" />
        {balance}
      </span>
      <UserMenu />
    </ButtonGroup>
  );
}
