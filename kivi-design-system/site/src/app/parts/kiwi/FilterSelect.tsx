import { Dropdown, Menu, MenuItem, Select } from '@kivi';
import type { IconName } from '@kivi';

/** 筛选下拉：Select 触发器 + 单选菜单（照「Select 拆成触发器」的拼法） */
export function FilterSelect<V extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  /** 读屏名字 */
  label: string;
  value: V;
  options: { value: V; label: string; icon?: IconName }[];
  onChange: (value: V) => void;
  disabled?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Dropdown haspopup="listbox" trigger={<Select aria-label={label} disabled={disabled} leftIcon={current?.icon}>{current?.label ?? label}</Select>}>
      <Menu role="listbox" aria-label={label}>
        {options.map((o) => (
          <MenuItem key={o.value} icon={o.icon} selected={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}
