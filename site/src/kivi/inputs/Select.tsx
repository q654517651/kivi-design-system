import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../icons';
import { cx } from '../utils';
import { useControllable } from '../hooks';
import { Dropdown, Menu, MenuItem, type DropdownPlacement } from '../menus-tooltip';
import './inputs.css';

export type SelectVariant = 'fill' | 'plain';

export interface SelectOption {
  /** 选项的值 */
  value: string;
  /** 列表里和选中后显示的文字 */
  label: string;
  /** 列表里这一项的左图标，比如模型 logo。选中后触发器的左图标也换成它 */
  icon?: IconName;
  /** 禁用这一项：灰色，选不了，方向键跳过 */
  disabled?: boolean;
}

export interface SelectProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** 选项。列表是菜单（Menu + MenuItem），当前项是「选中」状态：白 8% 底，不打勾 */
  options: SelectOption[];
  /** 样式：填充 / 无底，默认填充。填充用在表单和面板里，宽度拉伸；无底用在工具条上，宽度跟着内容走 */
  variant?: SelectVariant;
  /** 选中的值，没选传 null。传了就是受控，要自己在 onChange 里更新 */
  value?: string | null;
  /** 非受控时的初始值，默认没选 */
  defaultValue?: string | null;
  /** 选了一项时触发，参数是选项的值 */
  onChange?: (value: string) => void;
  /** 没选时显示的占位文字 */
  placeholder?: string;
  /** 左图标，16 */
  leftIcon?: IconName;
  /** 禁用：占位文字和箭头变灰，不能展开 */
  disabled?: boolean;
  /** 展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是不是展开的，默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发 */
  onOpenChange?: (open: boolean) => void;
  /** 列表出现的位置，默认 bottom-start（下方、左对齐），放不下会自己翻到另一边。工具条贴着屏幕底部时可以写 top-start。Figma 没定，待定 */
  placement?: DropdownPlacement;
  /** 触发器上的说明。没有可见标签时必须写 */
  'aria-label'?: string;
}

/**
 * 点开后从列表里选一个值。Figma「输入控件」页 Select。
 * 触发器是它自己的，展开的列表用「菜单和提示」页的 Dropdown + Menu + MenuItem，挂在 body 上，不会被外层裁掉。
 * 点触发器展开、点选项选值；点别处或按 Esc 收起；键盘：↑ ↓ 打开并在列表里移动，Home / End 到头，回车或空格选中。
 * className、style、ref 和其余属性加在最外层的壳上；填充的宽度也在这里设。
 */
export const Select = forwardRef<HTMLSpanElement, SelectProps>(function Select(
  {
    options,
    variant = 'fill',
    value,
    defaultValue = null,
    onChange,
    placeholder,
    leftIcon,
    disabled,
    open,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom-start',
    className,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const [current, setCurrent] = useControllable<string | null>(value, defaultValue, (next) => {
    if (next !== null) onChange?.(next);
  });
  const [isOpen, setOpen] = useControllable<boolean>(open, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 无底的触发器很窄：展开时量一下，列表按内容撑宽，但不比触发器窄
  const [triggerWidth, setTriggerWidth] = useState<number>();
  useLayoutEffect(() => {
    if (isOpen && variant === 'plain') setTriggerWidth(triggerRef.current?.offsetWidth);
  }, [isOpen, variant]);

  // 键盘打开时 Dropdown 把焦点放在第一项；有选中的就改放到选中的那一项
  useEffect(() => {
    if (!isOpen) return;
    const popup = document.getElementById(triggerRef.current?.getAttribute('aria-controls') ?? '');
    const current = popup?.querySelector<HTMLElement>('.kv-menu-item[aria-selected="true"]:not(:disabled)');
    // 列表长了在里面滚：先滚到选中的那一项
    current?.scrollIntoView({ block: 'nearest' });
    const active = document.activeElement;
    if (current && popup && active !== popup && popup.contains(active)) current.focus();
  }, [isOpen]);

  const selected = options.find((o) => o.value === current);

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      className={cx('kv-select', `kv-select--${variant}`)}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {(selected?.icon ?? leftIcon) && (
        <Icon name={(selected?.icon ?? leftIcon)!} className="kv-select__lead" data-filled={selected ? '' : undefined} />
      )}
      <span className={cx('kv-select__text', !selected && 'kv-select__text--placeholder')}>
        {selected ? selected.label : placeholder}
      </span>
      <Icon name={isOpen ? 'UpArrowSmall' : 'DownArrowSmall'} />
    </button>
  );

  return (
    <Dropdown
      ref={ref}
      trigger={trigger}
      open={isOpen}
      onOpenChange={setOpen}
      placement={placement}
      matchTriggerWidth={variant === 'fill'}
      haspopup="listbox"
      className={cx('kv-select__wrap', variant === 'plain' && 'kv-select__wrap--plain', className)}
      {...rest}
    >
      {/* 单选列表：当前项用「选中」状态（白 8% 底），不打勾 */}
      <Menu role="listbox" style={variant === 'plain' && triggerWidth ? ({ '--kv-menu-min': `${triggerWidth}px` } as CSSProperties) : undefined}>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            icon={o.icon}
            selected={o.value === current}
            disabled={o.disabled}
            onClick={() => setCurrent(o.value)}
          >
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
});
Select.displayName = 'Select';
