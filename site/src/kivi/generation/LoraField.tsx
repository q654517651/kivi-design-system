import { forwardRef, type HTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { ReferenceItem } from '../reference/ReferenceItem';
import { Popover, type PopoverProps } from '../tooltip';
import { useControllable } from '../hooks';
import { AddTile } from '../upload';
import { cx } from '../utils';
import { LoraSettings } from './LoraSettings';
import './generation.css';

export interface LoraFieldItem {
  /** 唯一标识 */
  id: string;
  /** 名字，悬停弹出的设置面板里显示 */
  name: string;
  /** 封面地址 */
  cover: string;
  /** 权重 0–2，格子底部通栏显示一位小数 */
  weight: number;
  /** 触发词，设置面板里显示、可复制 */
  triggerWords?: string;
  /** 提示词模版，设置面板里显示、可复制 */
  template?: string;
}

export interface LoraFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'defaultValue'> {
  /** 已选的 Lora。传了就是受控，要自己在 onChange 里更新 */
  value?: LoraFieldItem[];
  /** 非受控时的初始值 */
  defaultValue?: LoraFieldItem[];
  /** 已选的变了（改权重、删除），参数是新的列表。添加走 onAdd，由外面打开 LoraPicker 再把选中的放进来 */
  onChange?: (value: LoraFieldItem[]) => void;
  /** 最多几个，默认 4。满了添加格隐藏 */
  max?: number;
  /** 点添加格 */
  onAdd?: () => void;
  /** 点卡片弹出的设置面板往哪边弹，跟着 Popover（默认在下面），用的地方传 */
  placement?: PopoverProps['placement'];
}

/**
 * 一排已选的 Lora 加一个添加格，主站输入框和画布生成面板共用。已选的是 56 的参考格，底部通栏写权重；
 * 悬停弹出设置面板（`LoraSettings`，鼠标能挪进去），悬停格子右上角出删除。
 */
export const LoraField = forwardRef<HTMLDivElement, LoraFieldProps>(function LoraField(
  { value, defaultValue = [], onChange, max = 4, onAdd, placement, className, ...rest },
  ref,
) {
  const [items, setItems] = useControllable(value, defaultValue, onChange);

  return (
    <div ref={ref} className={cx('kv-lora-field', className)} {...rest}>
      {items.map((item) => (
        <Popover
          key={item.id}
          variant="panel"
          placement={placement}
          content={
            <LoraSettings
              name={item.name}
              triggerWords={item.triggerWords}
              template={item.template}
              weight={item.weight}
              onWeightChange={(weight) => setItems(items.map((x) => (x.id === item.id ? { ...x, weight } : x)))}
            />
          }
        >
          <div className="kv-lora-field__item" role="group" aria-label={`${item.name}，权重 ${item.weight.toFixed(1)}`} tabIndex={0}>
            <ReferenceItem size={56} src={item.cover} weight={item.weight.toFixed(1)} />
            <button
              type="button"
              className="kv-lora-field__remove"
              aria-label={`删除${item.name}`}
              onClick={() => setItems(items.filter((x) => x.id !== item.id))}
            >
              <Icon name="CloseSmall" />
            </button>
          </div>
        </Popover>
      ))}
      {items.length < max && (
        <AddTile icon="LoraModel" label="Lora" aria-label="添加 Lora" onClick={onAdd} />
      )}
    </div>
  );
});
LoraField.displayName = 'LoraField';
