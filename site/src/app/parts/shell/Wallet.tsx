import { Icon, IconButton } from '@kivi';
import { cx } from '@kivi/utils';
import { useBalance } from '../../data/db';
import { UserMenu } from './UserMenu';

/*
  右上角：余额（猕猴桃，读 db 的余额，生成扣费、失败退回都会变）和头像。
  主站每一页都有，挂在外壳 KiviApp 上，不跟着页面换；画布页在右上角分享按钮旁边（11-19）。
*/

export function Wallet({ className, library }: { className?: string; library?: { open: boolean; onToggle: () => void } }) {
  const balance = useBalance();
  return (
    <div className={cx('tpl-ms__wallet', className)}>
      {/* 素材库入口（11-23 原型，3.14 不做）：只在创作页（首页、对话页）有 */}
      {library && <IconButton icon="Folder" label="素材库" variant="secondary" size={32} selected={library.open} onClick={library.onToggle} />}
      <span className="tpl-ms__balance" aria-label={`余额 ${balance}`}>
        <Icon name="Kiwi" />
        {balance}
      </span>
      <UserMenu />
    </div>
  );
}
