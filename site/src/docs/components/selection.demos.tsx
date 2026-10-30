import { Checkbox, Slider, Switch, type CheckboxChecked, type CheckboxShape } from '@kivi';
import { Playground } from '@shell';

// 选择控件页的三个属性面板：所有形状、选中、状态都在面板里切。参数表在 selection.mdx
// 预览里的控件能点、能拖：用 defaultChecked / defaultValue，选项一变就换 key 重新来过。

const HOVER = { hover: 'is-hover' } as Record<string, string | undefined>;

/** 这一页的演示用：预览区里滑块拉到 240 宽 */
function DocStyle({ css }: { css: string }) {
  return <style>{css}</style>;
}

// ---------- Switch ----------

type SwitchState = { on: string; state: string };

export function SwitchPlayground() {
  return (
    <Playground<SwitchState>
      controls={[
        { key: 'on', label: '开关', type: 'segment', value: 'on', options: [['on', '开'], ['off', '关']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['disabled', '禁用']] },
      ]}
      render={(s) => (
        <Switch
          key={s.on}
          aria-label="生成音频"
          defaultChecked={s.on === 'on'}
          disabled={s.state === 'disabled' || undefined}
        />
      )}
    />
  );
}

// ---------- Slider ----------

type SliderState = { value: string; marks: boolean; state: string };

/** 0–100，每 10 一条刻度，每 50 写数字 */
const SLIDER_MARKS = Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: i % 5 === 0 ? String(i * 10) : undefined }));

export function SliderPlayground() {
  return (
    <div className="sel-pg-slider">
      <DocStyle css=".sel-pg-slider .shell-pg-stage .kv-slider { width: 240px; }" />
      <Playground<SliderState>
        controls={[
          { key: 'value', label: '进度', type: 'segment', value: '50', options: [['0', '0'], ['25', '25'], ['50', '50'], ['75', '75'], ['100', '100']] },
          { key: 'marks', label: '刻度', type: 'toggle', value: true },
          { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['disabled', '禁用']] },
        ]}
        render={(s) => (
          <Slider
            key={s.value}
            aria-label="时长"
            defaultValue={Number(s.value)}
            marks={s.marks ? SLIDER_MARKS : undefined}
            disabled={s.state === 'disabled' || undefined}
          />
        )}
      />
    </div>
  );
}

// ---------- Checkbox ----------

type CheckboxState = { shape: string; checked: string; state: string; label: boolean; text: string };

const CHECKED: Record<string, CheckboxChecked> = { no: false, yes: true, part: 'mixed' };

export function CheckboxPlayground() {
  return (
    <Playground<CheckboxState>
      controls={[
        { key: 'shape', label: '形状', type: 'segment', value: 'square', options: [['square', '方形'], ['round', '圆形']] },
        { key: 'checked', label: '选中', type: 'segment', value: 'yes', options: [['no', '否'], ['yes', '是'], ['part', '部分']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['disabled', '禁用']] },
        { key: 'label', label: '显示文字', type: 'toggle', value: true },
        { key: 'text', label: '文字', type: 'text', value: '选项' },
      ]}
      rules={(s) => (s.label ? {} : { text: true })}
      media={(s) => s.shape === 'round'}
      render={(s) => (
        <Checkbox
          key={s.checked}
          shape={s.shape as CheckboxShape}
          defaultChecked={CHECKED[s.checked]}
          className={HOVER[s.state]}
          disabled={s.state === 'disabled' || undefined}
          aria-label={s.label ? undefined : '选项'}
        >
          {s.label ? s.text : undefined}
        </Checkbox>
      )}
    />
  );
}
