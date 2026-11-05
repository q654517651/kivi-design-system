import {
  cx,
  Icon,
  Menu,
  MenuItem,
  Select,
  type IconName,
  type SelectOption,
  type SelectProps,
  type SelectVariant,
  Checkbox,
  Slider,
  Switch,
  type CheckboxChecked,
  type CheckboxVariant,
} from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 选择页的四个属性面板：所有形状、选中、状态都在面板里切。参数表在 selection.mdx
// 预览里的控件能点、能拖：写成受控（checked / value + onChange），点了、拖了，右边面板跟着变。
// 下拉选择：选了哪项记在面板上不显示的 picked 里；悬停、聚焦这种一碰就变的状态不写回。

/** 这一页的演示用：预览区里把宽度定下来（组件默认填满） */
function DocStyle({ css }: { css: string }) {
  return <style>{css}</style>;
}

type Update = (patch: Partial<PlaygroundState>) => void;

const HOVER = { hover: 'is-hover' } as Record<string, string | undefined>;

// ---------- Select ----------

type SelectState = { variant: string; state: string; icon: boolean; optIcon: boolean; placeholder: string; text: string };

const OPTION_ICONS: IconName[] = ['ImageGeneration', 'VideoGeneration', 'Audio'];

function optionsOf(text: string, withIcon: boolean): SelectOption[] {
  return [
    { value: 'a', label: text },
    { value: 'b', label: '选项二' },
    { value: 'c', label: '选项三' },
  ].map((o, i) => (withIcon ? { ...o, icon: OPTION_ICONS[i] } : o));
}

/** 无底一般都有当前值；填充要选过才有值（展开时还没选）；禁用只显示占位文字 */
function showsValue(variant: string, state: string) {
  return state !== 'disabled' && (variant === 'plain' || state === 'selected');
}

/**
 * 文档里摆静态的「展开」：触发器按展开的样子画（底色变、箭头朝上），列表是一个直接摊开的 Menu，当前项是「选中」状态。
 * 真正的列表是挂在 body 上、跟着触发器走的弹出层，一直开着会在页面滚动时盖住别的内容，所以文档里不用它摆静态。
 */
function StaticSelect({ variant = 'fill', options, value, placeholder, leftIcon, className, style, onChange }: SelectProps) {
  const selected = options.find((o) => o.value === value);
  const plain = variant === 'plain';
  const icon = selected?.icon ?? leftIcon;
  return (
    <span
      className={cx('kv-dropdown', 'kv-select__wrap', plain && 'kv-select__wrap--plain', className)}
      style={{ position: 'relative', ...style }}
    >
      <button type="button" tabIndex={-1} className={`kv-select kv-select--${variant}`} aria-haspopup="listbox" aria-expanded="true">
        {icon && <Icon name={icon} className="kv-select__lead" data-filled={selected ? '' : undefined} />}
        <span className={cx('kv-select__text', !selected && 'kv-select__text--placeholder')}>{selected ? selected.label : placeholder}</span>
        <Icon name="UpArrowSmall" />
      </button>
      <Menu role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1, width: plain ? undefined : '100%', minWidth: plain ? '100%' : undefined }}>
        {options.map((o) => (
          <MenuItem key={o.value} icon={o.icon} selected={o.value === value} onClick={() => onChange?.(o.value)}>
            {o.label}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}

/** 属性面板里的 Select：选「展开」时换成静态的展开样子，生成的代码仍然写 <Select … open /> */
function DocSelect(props: SelectProps) {
  if (!props.open) return <Select {...props} />;
  return <StaticSelect {...props} value={props.value ?? props.defaultValue} />;
}
DocSelect.displayName = 'Select';

// 选了哪项记在面板上不显示的 picked 里；选了以后「状态」变成「已选」（无底一直有值，状态不动）。
// 点开真的下拉不写回「展开」：面板的「展开」是摆静态样子用的
function renderSelect(s: SelectState, update: Update) {
  const raw = (s as Record<string, unknown>).picked;
  const picked = typeof raw === 'string' ? raw : 'a';
  const show = showsValue(s.variant, s.state) || (s.state === 'open' && typeof raw === 'string');
  return (
    <DocSelect
      key={s.variant}
      variant={s.variant as SelectVariant}
      className={s.state === 'hover' ? 'is-hover' : undefined}
      options={optionsOf(s.text, s.optIcon)}
      value={show ? picked : null}
      onChange={(v) => update({ picked: v, state: s.variant === 'plain' || s.state === 'disabled' ? s.state : 'selected' })}
      placeholder={s.placeholder}
      leftIcon={s.icon ? 'Add' : undefined}
      disabled={s.state === 'disabled' || undefined}
      open={s.state === 'open' || undefined}
      aria-label="下拉选择"
    />
  );
}

export function SelectPlayground() {
  return (
    <div className="in-pg-select">
      <DocStyle
        css={`
          .in-pg-select .shell-pg-stage { align-items: flex-start; padding-top: 56px; }
          .in-pg-select .shell-pg-stage .kv-select__wrap:not(.kv-select__wrap--plain) { width: 200px; }
        `}
      />
      <Playground<SelectState>
        controls={[
          { key: 'variant', label: '样式', type: 'segment', value: 'fill', options: [['fill', '填充'], ['plain', '无底']] },
          { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['open', '展开'], ['selected', '已选'], ['disabled', '禁用']] },
          { key: 'icon', label: '左图标', type: 'toggle', value: false },
          { key: 'optIcon', label: '选项图标', type: 'toggle', value: false },
          { key: 'placeholder', label: '占位文字', type: 'text', value: '请选择' },
          { key: 'text', label: '文字', type: 'text', value: '选项一' },
        ]}
        rules={(s) => {
          const value = showsValue(s.variant, s.state);
          const listOrValue = value || s.state === 'open';
          return { placeholder: value, text: !listOrValue, optIcon: !listOrValue };
        }}
        render={renderSelect}
      />
    </div>
  );
}

// ---------- Switch ----------

type SwitchState = { on: string; state: string; label: boolean; text: string };

export function SwitchPlayground() {
  return (
    <Playground<SwitchState>
      controls={[
        { key: 'on', label: '开关', type: 'segment', value: 'on', options: [['on', '开'], ['off', '关']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['disabled', '禁用']] },
        { key: 'label', label: '显示文字', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: '生成音频' },
      ]}
      rules={(s) => (s.label ? {} : { text: true })}
      render={(s, update) => (
        <Switch
          aria-label={s.label ? undefined : '生成音频'}
          checked={s.on === 'on'}
          onChange={(on) => update({ on: on ? 'on' : 'off' })}
          disabled={s.state === 'disabled' || undefined}
        >
          {s.label ? s.text : undefined}
        </Switch>
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
        // 拖到不是 0 / 25 / 50 / 75 / 100 的位置，面板上「进度」一个都不亮
        render={(s, update) => (
          <Slider
            aria-label="时长"
            value={Number(s.value)}
            onChange={(v) => update({ value: String(v) })}
            marks={s.marks ? SLIDER_MARKS : undefined}
            disabled={s.state === 'disabled' || undefined}
          />
        )}
      />
    </div>
  );
}

// ---------- Checkbox ----------

type CheckboxState = { variant: string; checked: string; state: string; label: boolean; text: string };

const CHECKED: Record<string, CheckboxChecked> = { no: false, yes: true, part: 'mixed' };

export function CheckboxPlayground() {
  return (
    <Playground<CheckboxState>
      controls={[
        { key: 'variant', label: '形状', type: 'segment', value: 'square', options: [['square', '方形'], ['round', '圆形']] },
        { key: 'checked', label: '选中', type: 'segment', value: 'yes', options: [['no', '否'], ['yes', '是'], ['part', '部分']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['disabled', '禁用']] },
        { key: 'label', label: '显示文字', type: 'toggle', value: true },
        { key: 'text', label: '文字', type: 'text', value: '选项' },
      ]}
      rules={(s) => (s.label ? {} : { text: true })}
      media={(s) => s.variant === 'round'}
      render={(s, update) => (
        <Checkbox
          variant={s.variant as CheckboxVariant}
          checked={CHECKED[s.checked]}
          onChange={(on) => update({ checked: on ? 'yes' : 'no' })}
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
