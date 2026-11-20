import { Menu, MenuItem, MenuSub } from '@kivi';
import { useDB } from '../data/db';

/*
  「添加至文件夹」子菜单：悬停往一边甩出文件夹列表，点一个加进去。资产页、创作页结果格、探索页作品右键共用。
*/

export function FolderSubMenu({ label = '添加至文件夹', disabled, onPick }: { label?: string; disabled?: boolean; onPick: (folderId: string, name: string) => void }) {
  const folders = useDB((s) => s.folders);
  return (
    <MenuSub trigger={<MenuItem icon="AddFolder" disabled={disabled}>{label}</MenuItem>}>
      <Menu aria-label="选择文件夹">
        {folders.length === 0 && <MenuItem disabled>暂无文件夹</MenuItem>}
        {folders.map((f) => (
          <MenuItem key={f.id} icon="Folder" onClick={() => onPick(f.id, f.name)}>
            {f.name}
          </MenuItem>
        ))}
      </Menu>
    </MenuSub>
  );
}
