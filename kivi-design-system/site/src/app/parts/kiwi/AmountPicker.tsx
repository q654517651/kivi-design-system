import { useEffect, useState } from 'react';
import { NumberInput, TabItem, Tabs } from '@kivi';

/*
  额度数量：快捷选项 + 自定义（11-27 用户定，比如 3000 / 5000 / 7000 / 自定义）。
  选快捷项直接就是那个数；选「自定义」下面出数字输入框。初始周上限、调整周上限、加减额度都用它。
*/

export const AMOUNT_PRESETS = [3000, 5000, 7000];
const CUSTOM = 'custom';

export function AmountPicker({ value, onChange, presets = AMOUNT_PRESETS, placeholder = '正整数' }: { value: string; onChange: (value: string) => void; presets?: number[]; placeholder?: string }) {
  const isPreset = presets.some((p) => String(p) === value);
  // 打开时值不是快捷项（比如原来的周上限是 2000），直接停在自定义
  const [custom, setCustom] = useState(!isPreset && value !== '');
  useEffect(() => {
    if (value !== '' && !isPreset) setCustom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const tab = custom ? CUSTOM : isPreset ? value : '';
  return (
    <>
      <Tabs
        variant="segment"
        value={tab}
        onChange={(v) => {
          if (v === CUSTOM) {
            setCustom(true);
            onChange('');
          } else {
            setCustom(false);
            onChange(v);
          }
        }}
      >
        {presets.map((p) => (
          <TabItem key={p} value={String(p)}>
            {p.toLocaleString()}
          </TabItem>
        ))}
        <TabItem value={CUSTOM}>自定义</TabItem>
      </Tabs>
      {custom && <NumberInput value={value} onChange={onChange} min={0} precision={0} unit="猕猴桃" placeholder={placeholder} autoFocus />}
    </>
  );
}
