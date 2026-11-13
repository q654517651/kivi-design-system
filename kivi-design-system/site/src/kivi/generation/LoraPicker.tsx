import { forwardRef, useMemo, useState } from 'react';
import { Dialog, type DialogProps } from '../dialog';
import { EmptyState, toast } from '../feedback';
import { Dropdown, Menu, MenuItem } from '../menu';
import { ScrollArea } from '../scroll-area';
import { Select } from '../selection';
import { TabItem, Tabs } from '../navigation';
import { useControllable } from '../hooks';
import { LoraCard } from './LoraCard';
import './generation.css';

export interface LoraPickerItem {
  /** 唯一标识 */
  id: string;
  /** 名字 */
  name: string;
  /** 一句话描述，卡片悬停时显示，最多两行 */
  description?: string;
  /** 封面地址 */
  cover: string;
  /** 底模名，比如「SDXL」「FLUX」，卡片左上角标签；底模筛选也按它 */
  base: string;
  /** 新上线，卡片左上角加「New」 */
  isNew?: boolean;
  /** 一开始是不是收藏的，只在没传 `collectedIds` / `defaultCollectedIds` 时用 */
  collected?: boolean;
}

export interface LoraPickerProps extends Omit<DialogProps, 'children' | 'title' | 'size' | 'footer' | 'defaultValue' | 'onChange'> {
  /** 全部 Lora */
  items: LoraPickerItem[];
  /** 选中的 id。传了就是受控 */
  value?: string[];
  /** 非受控时的初始选中 */
  defaultValue?: string[];
  /** 选中的变了，参数是新的 id 数组 */
  onChange?: (value: string[]) => void;
  /** 最多选几个，默认 4。超了弹 Toast「最多只能添加 N 个 Lora 模型」 */
  max?: number;
  /** 收藏的 id（受控）。不传就从 `items[].collected` 起头、自己管 */
  collectedIds?: string[];
  /** 非受控时的初始收藏 */
  defaultCollectedIds?: string[];
  /** 收藏变了，参数是新的 id 数组 */
  onCollectedIdsChange?: (ids: string[]) => void;
}

const BASES = ['SDXL', 'FLUX', 'SD1.5'];
const ALL = 'all';

/**
 * Lora 选择弹窗：标题「Lora 模型」，一行「全部 / 收藏」选项卡加底模筛选，下面卡片网格，点卡片选中（最多 max 个）。
 * 收藏页里取消收藏，卡片当场消失；没有内容用 EmptyState。页面上要放一个 `<Toaster />`。
 */
export const LoraPicker = forwardRef<HTMLDivElement, LoraPickerProps>(function LoraPicker(
  { items, value, defaultValue = [], onChange, max = 4, collectedIds, defaultCollectedIds, onCollectedIdsChange, ...rest },
  ref,
) {
  const [selected, setSelected] = useControllable(value, defaultValue, onChange);
  const [collected, setCollected] = useControllable(
    collectedIds,
    defaultCollectedIds ?? items.filter((i) => i.collected).map((i) => i.id),
    onCollectedIdsChange,
  );
  const [tab, setTab] = useState<'all' | 'collected'>('all');
  const [base, setBase] = useState(ALL);

  const shown = useMemo(
    () => items.filter((i) => (tab === 'all' || collected.includes(i.id)) && (base === ALL || i.base === base)),
    [items, tab, base, collected],
  );

  const toggle = (id: string) => {
    if (selected.includes(id)) return setSelected(selected.filter((x) => x !== id));
    if (selected.length >= max) return void toast.warning(`最多只能添加${max}个Lora模型`);
    setSelected([...selected, id]);
  };

  const filtered = base !== ALL;

  return (
    <Dialog ref={ref} size={1024} title="Lora 模型" {...rest}>
      <div className="kv-lora-picker">
        <div className="kv-lora-picker__bar">
          <Tabs value={tab} onChange={(v) => setTab(v as 'all' | 'collected')} aria-label="Lora 范围">
            <TabItem value="all">全部</TabItem>
            <TabItem value="collected">收藏</TabItem>
          </Tabs>
          <Dropdown
            className="kv-lora-picker__base"
            style={{ flex: 'none', width: 160 }} // 宽 160，Figma 没变量；填充下拉的外壳宽 100%，用行内样式盖过
            haspopup="listbox"
            matchTriggerWidth
            trigger={<Select aria-label="底模">{base === ALL ? '全部类型' : base}</Select>}
          >
            <Menu role="listbox" aria-label="底模">
              {[ALL, ...BASES].map((b) => (
                <MenuItem key={b} selected={b === base} onClick={() => setBase(b)}>
                  {b === ALL ? '全部类型' : b}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
        </div>
        {shown.length ? (
          <ScrollArea className="kv-lora-picker__scroll">
            <div className="kv-lora-picker__grid">
              {shown.map((item) => (
                <LoraCard
                  key={item.id}
                  name={item.name}
                  description={item.description}
                  cover={item.cover}
                  base={item.base}
                  isNew={item.isNew}
                  checked={selected.includes(item.id)}
                  collected={collected.includes(item.id)}
                  onCollectedChange={(c) => setCollected(c ? [...collected, item.id] : collected.filter((x) => x !== item.id))}
                  onClick={() => toggle(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="kv-lora-picker__empty">
            {tab === 'collected' && !filtered ? (
              <EmptyState type="favorite" title="还没有收藏的 Lora" description="在卡片右上角点星标收藏" />
            ) : (
              <EmptyState title="没有符合条件的 Lora" description="换个底模试试" />
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
});
LoraPicker.displayName = 'LoraPicker';
