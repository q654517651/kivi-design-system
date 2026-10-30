import { cx, Icon, Input, Menu, MenuItem, NumberInput, Select, Textarea, type IconName, type SelectOption, type SelectProps, type SelectVariant } from '@kivi';
import { Playground } from '@shell';

// 输入控件页的四个属性面板：所有样式、状态都在面板里切。参数表在 inputs.mdx
// 预览里的输入框能打字、下拉能点开：用 defaultValue / defaultOpen，选项一变就换 key 重新来过。

/** 这一页的演示用：预览区里把宽度定下来（组件默认填满） */
function DocStyle({ css }: { css: string }) {
  return <style>{css}</style>;
}

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover', focus: 'is-focus' };
const hasValue = (state: string) => state === 'focus' || state === 'typed' || state === 'error';

const SAMPLE = '一个女生站在樱花树下，镜头从远景慢慢推近，背景是黄昏的城市天际线。';

const STATES: [string, string][] = [
  ['default', '默认'],
  ['hover', '悬停'],
  ['focus', '聚焦'],
  ['typed', '已输入'],
  ['error', '错误'],
  ['disabled', '禁用'],
];

// ---------- Input ----------

type InputState = { state: string; icon: boolean; count: boolean; placeholder: string; text: string; countText: string };

function renderInput(s: InputState) {
  return (
    <Input
      key={s.state + '|' + s.text}
      className={STATE_CLASS[s.state]}
      leftIcon={s.icon ? 'Search' : undefined}
      placeholder={s.placeholder}
      defaultValue={hasValue(s.state) ? s.text : undefined}
      invalid={s.state === 'error' || undefined}
      disabled={s.state === 'disabled' || undefined}
      counter={s.count ? s.countText : undefined}
      aria-label="输入框"
    />
  );
}

export function InputPlayground() {
  return (
    <div className="in-pg-input">
      <DocStyle css=".in-pg-input .shell-pg-stage .kv-input { width: 240px; }" />
      <Playground<InputState>
        controls={[
          { key: 'state', label: '状态', type: 'segment', value: 'default', options: STATES },
          { key: 'icon', label: '左图标', type: 'toggle', value: false },
          { key: 'count', label: '字数', type: 'toggle', value: false },
          { key: 'placeholder', label: '占位文字', type: 'text', value: '请输入' },
          { key: 'text', label: '文字', type: 'text', value: '输入的内容' },
          { key: 'countText', label: '字数文字', type: 'text', value: '0/50' },
        ]}
        rules={(s) => ({ placeholder: hasValue(s.state), text: !hasValue(s.state), countText: !s.count })}
        render={renderInput}
      />
    </div>
  );
}

// ---------- NumberInput ----------

type NumberState = { state: string; unit: boolean; value: string; unitText: string };

function renderNumberInput(s: NumberState) {
  return (
    <NumberInput
      key={s.state + '|' + s.value}
      className={STATE_CLASS[s.state]}
      defaultValue={s.value.replace(/\D/g, '')}
      unit={s.unit ? s.unitText : undefined}
      disabled={s.state === 'disabled' || undefined}
      aria-label="数值"
    />
  );
}

export function NumberInputPlayground() {
  return (
    <Playground<NumberState>
      controls={[
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['focus', '聚焦'], ['disabled', '禁用']] },
        { key: 'unit', label: '显示单位', type: 'toggle', value: true },
        { key: 'value', label: '数值', type: 'text', value: '12' },
        { key: 'unitText', label: '单位', type: 'text', value: '秒' },
      ]}
      rules={(s) => ({ unitText: !s.unit })}
      render={renderNumberInput}
    />
  );
}

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
function StaticSelect({ variant = 'fill', options, value, placeholder, leftIcon, className, style }: SelectProps) {
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
          <MenuItem key={o.value} icon={o.icon} selected={o.value === value}>
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

function renderSelect(s: SelectState) {
  return (
    <DocSelect
      key={s.variant + '|' + s.state}
      variant={s.variant as SelectVariant}
      className={s.state === 'hover' ? 'is-hover' : undefined}
      options={optionsOf(s.text, s.optIcon)}
      defaultValue={showsValue(s.variant, s.state) ? 'a' : undefined}
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

// ---------- Textarea ----------

type TextareaState = { state: string; count: boolean; placeholder: string; text: string };

function renderTextarea(s: TextareaState) {
  const value = hasValue(s.state) ? s.text : '';
  return (
    <Textarea
      key={s.state + '|' + s.text}
      className={STATE_CLASS[s.state]}
      placeholder={s.placeholder}
      defaultValue={value || undefined}
      invalid={s.state === 'error' || undefined}
      disabled={s.state === 'disabled' || undefined}
      counter={s.count ? Array.from(value).length + '/500' : undefined}
      aria-label="描述"
    />
  );
}

export function TextareaPlayground() {
  return (
    <div className="in-pg-textarea">
      <DocStyle css=".in-pg-textarea .shell-pg-stage .kv-textarea { width: 320px; }" />
      <Playground<TextareaState>
        controls={[
          { key: 'state', label: '状态', type: 'segment', value: 'default', options: STATES },
          { key: 'count', label: '字数', type: 'toggle', value: true },
          { key: 'placeholder', label: '占位文字', type: 'text', value: '请输入描述' },
          { key: 'text', label: '文字', type: 'text', value: SAMPLE },
        ]}
        rules={(s) => ({ placeholder: hasValue(s.state), text: !hasValue(s.state) })}
        render={renderTextarea}
      />
    </div>
  );
}
