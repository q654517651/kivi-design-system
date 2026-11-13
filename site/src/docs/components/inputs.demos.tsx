import { Button, Input, NumberInput, Textarea } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

// 输入框页的三个属性面板：所有样式、状态都在面板里切。参数表在 inputs.mdx
// 预览里的输入框能打字：写成受控，打的字会写回面板（「文字」「状态」）。
// 悬停、聚焦这种一碰就变的状态不写回，面板上的悬停、聚焦是摆静态样子用的。

/** 这一页的演示用：预览区里把宽度定下来（组件默认填满） */
function DocStyle({ css }: { css: string }) {
  return <style>{css}</style>;
}

const STATE_CLASS: Record<string, string | undefined> = { hover: 'is-hover', focus: 'is-focus' };
const hasValue = (state: string) => state === 'focus' || state === 'typed' || state === 'error';

type Update = (patch: Partial<PlaygroundState>) => void;

/** 打字写回面板：空框里打了字算「已输入」，删空了回到「默认」 */
const typed = (s: { state: string }, update: Update) => (v: string) => {
  if (v) update({ text: v, state: hasValue(s.state) ? s.state : 'typed' });
  else update({ text: v, state: s.state === 'typed' ? 'default' : s.state });
};

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

type InputState = { state: string; icon: boolean; clear: boolean; count: boolean; placeholder: string; text: string; countText: string };

function renderInput(s: InputState, update: Update) {
  return (
    <Input
      className={STATE_CLASS[s.state]}
      leftIcon={s.icon ? 'Search' : undefined}
      placeholder={s.placeholder}
      value={hasValue(s.state) ? s.text : ''}
      onChange={(e) => typed(s, update)(e.target.value)}
      invalid={s.state === 'error' || undefined}
      disabled={s.state === 'disabled' || undefined}
      counter={s.count ? s.countText : undefined}
      clearable={s.clear || undefined}
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
          { key: 'clear', label: '可清空', type: 'toggle', value: false },
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

type NumberState = { state: string; unit: boolean; precision: string; value: string; unitText: string };

function renderNumberInput(s: NumberState, update: Update) {
  return (
    <NumberInput
      className={STATE_CLASS[s.state]}
      value={s.value.replace(s.precision === '0' ? /\D/g : /[^\d.]/g, '')}
      onChange={(v) => update({ value: v })}
      precision={Number(s.precision)}
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
        { key: 'precision', label: '小数位', type: 'segment', value: '0', options: [['0', '整数'], ['1', '1 位'], ['2', '2 位']] },
        { key: 'value', label: '数值', type: 'text', value: '12' },
        { key: 'unitText', label: '单位', type: 'text', value: '秒' },
      ]}
      rules={(s) => ({ unitText: !s.unit })}
      render={renderNumberInput}
    />
  );
}

// ---------- Textarea ----------

type TextareaState = { state: string; count: boolean; actions: boolean; placeholder: string; text: string };

function renderTextarea(s: TextareaState, update: Update) {
  const value = hasValue(s.state) ? s.text : '';
  return (
    <Textarea
      className={STATE_CLASS[s.state]}
      placeholder={s.placeholder}
      value={value}
      onChange={(e) => typed(s, update)(e.target.value)}
      invalid={s.state === 'error' || undefined}
      disabled={s.state === 'disabled' || undefined}
      counter={s.count ? Array.from(value).length + '/500' : undefined}
      actions={
        s.actions ? (
          <>
            <Button size={28} variant="secondary-muted">取消</Button>
            <Button size={28} variant="primary" disabled={!value.trim() || s.state === 'disabled'}>保存</Button>
          </>
        ) : undefined
      }
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
          { key: 'actions', label: '框内按钮', type: 'toggle', value: false },
          { key: 'placeholder', label: '占位文字', type: 'text', value: '请输入描述' },
          { key: 'text', label: '文字', type: 'text', value: SAMPLE },
        ]}
        rules={(s) => ({ placeholder: hasValue(s.state), text: !hasValue(s.state) })}
        render={renderTextarea}
      />
    </div>
  );
}
