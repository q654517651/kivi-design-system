/**
 * 批量管理时浮在页面底部的操作条：「已选 N 项」+ 移动到 / 下载 / 删除。
 * 只负责展示和抛事件，不接接口；删除只负责打开二次确认（DeleteConfirmDialog）。
 */
import Icon from '@/components/Icon';
import { useEffect, useRef, useState } from 'react';
import KiviButton from '../KiviButton';
import styles from './index.module.less';

export interface FolderOption {
  id: number;
  name: string;
}

interface BatchActionBarProps {
  /** 已选数量；为 0 时三个操作禁用 */
  count: number;
  /** 「移动到」菜单里的文件夹（在文件夹里时，调用方先把当前文件夹过滤掉） */
  folders: FolderOption[];
  onMoveTo: (folderId: number) => void;
  /** 菜单第一项「新建文件夹」：新建后把选中的移进去 */
  onCreateFolder: () => void;
  onDownload: () => void;
  /** 点「删除」：打开二次确认 */
  onDelete: () => void;
  moving?: boolean;
  downloading?: boolean;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
}

// 规范 MenuItem · 普通：高 36，圆角 8，图标 16，文字 13 常规
const MenuItem = ({ icon, label, onClick }: MenuItemProps) => (
  <button type="button" role="menuitem" className={styles.menuItem} title={label} onClick={onClick}>
    <Icon name={icon} size={16} />
    <span className={styles.menuItemLabel}>{label}</span>
  </button>
);

const BatchActionBar = ({
  count,
  folders,
  onMoveTo,
  onCreateFolder,
  onDownload,
  onDelete,
  moving = false,
  downloading = false,
}: BatchActionBarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const moveToRef = useRef<HTMLDivElement>(null);
  const isEmpty = count === 0;

  // 菜单打开时：点外面或按 Esc 收起
  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!moveToRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // 选择被清空时，菜单跟着收起
  useEffect(() => {
    if (isEmpty) setMenuOpen(false);
  }, [isEmpty]);

  const pick = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className={styles.bar} role="toolbar" aria-label={$t('批量管理')}>
      <span className={styles.count} aria-live="polite">
        {$t('已选 {count} 项', { count })}
      </span>
      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.moveTo} ref={moveToRef}>
        <KiviButton
          variant="text"
          icon="MoveTo"
          disabled={isEmpty}
          loading={moving}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {$t('移动到')}
        </KiviButton>
        {menuOpen && (
          <div className={styles.menu} role="menu">
            <MenuItem icon="AddSmall" label={$t('新建文件夹')} onClick={() => pick(onCreateFolder)} />
            {folders.length > 0 && <div className={styles.menuDivider} role="separator" />}
            {folders.map((folder) => (
              <MenuItem
                key={folder.id}
                icon="Folder"
                label={folder.name}
                onClick={() => pick(() => onMoveTo(folder.id))}
              />
            ))}
          </div>
        )}
      </div>

      <KiviButton variant="text" icon="Download" disabled={isEmpty} loading={downloading} onClick={onDownload}>
        {$t('下载')}
      </KiviButton>
      {/* 条上的删除只是入口，用文字型；红色的危险按钮留给二次确认里的「删除」 */}
      <KiviButton variant="text" icon="Delete" disabled={isEmpty} onClick={onDelete}>
        {$t('删除')}
      </KiviButton>
    </div>
  );
};

export default BatchActionBar;
