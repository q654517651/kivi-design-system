import {
  forwardRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type HTMLAttributes,
  type Ref,
} from 'react';
import { toast } from '../feedback';
import { cx } from '../utils';
import { checkFiles, composeDropHandlers, composeHandlers, rejectMessage, useControllable, useFileDrop, useMergedRef, usePasteFiles, usePending } from '../hooks';
import { MentionChip } from '../reference/MentionChip';
import { ReferenceFramePair } from '../reference/ReferenceFramePair';
import type { SelectOption } from '../selection';
import { ReferenceStack, referenceName, relabelReferences, type ReferenceStackItem } from '../reference/ReferenceStack';
import { PromptInput } from './PromptInput';
import { insertChip, insertMention, promptText, restoreMentions, setPromptText, syncMentions } from './mentions';
import { DropOverlay } from './DropOverlay';
import { PromptBoxContext } from './context';
import type { AgentControlsProps } from './AgentControls';
import { GenActions, GenToolbar } from './gen-controls';
import {
  GEN_PLACEHOLDER,
  PROMPT_MAX_LENGTH,
  fileToReference,
  genBlockedReason,
  genTotalCost,
  isFramesMode,
  mainUploadSpec,
  referenceFullMessage,
  referenceTypeOf,
  type GenFrames,
  type GenTask,
} from './gen-rules';
import { countInputs, fallbackParams, inputLimits, supportsLora } from './model-caps';
import { LoraField, type LoraFieldItem } from './LoraField';
import { LoraPicker, type LoraPickerItem } from './LoraPicker';
import { Divider } from '../divider';
import { DEFAULT_MODEL } from './options';
import { TaskSelect } from './GenSelects';
import { GEN_PARAM_DEFAULTS, type GenParamValues } from './GenParams';
import './generation.css';

export interface PromptBoxSubmit {
  task: GenTask;
  /** 这个任务现在选的模型 */
  model: string;
  /** 视频的参考方式 */
  refMode: string;
  text: string;
  references: ReferenceStackItem[];
  frames: GenFrames;
  /** 这个任务参数面板里选的值（比例、分辨率、时长……），键见 GenParams 的 GEN_PARAM_DEFAULTS；Agent、文字没有，是空的 */
  params: GenParamValues;
  /** 张数（图片、视频），别的任务是 1 */
  count: number;
  /** 挂的 Lora（图片模型支持 Lora 时才带） */
  loras?: LoraFieldItem[];
}

export interface PromptBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'onSubmit'> {
  /** 提示词（纯文字，@ 引用写成「@图片1」）。传了就是受控，要自己在 onChange 里更新；从外面改了文字，框里的 @ 标签变回纯文字 */
  value?: string;
  /** 非受控时的初始提示词 */
  defaultValue?: string;
  /** 提示词变了触发，参数是新的文字 */
  onChange?: (value: string) => void;
  /** 任务类型：Agent / 图片生成 / 视频生成 / 音频生成。传了就是受控 */
  task?: GenTask;
  /** 非受控时一开始的任务，默认 Agent */
  defaultTask?: GenTask;
  /** 切了任务类型 */
  onTaskChange?: (task: GenTask) => void;
  /** 每种任务各选的模型，比如 `{ video: 'veo-3.1-fast' }`，没写的用默认模型。传了就是受控 */
  models?: Partial<Record<GenTask, string>>;
  /** 非受控时一开始各任务的模型 */
  defaultModels?: Partial<Record<GenTask, string>>;
  /** 换了模型，参数是所有任务的模型 */
  onModelsChange?: (models: Partial<Record<GenTask, string>>) => void;
  /** 视频的参考方式：omni 全能参考 / frames 首尾帧 / edit 视频编辑 / extend 视频延长。传了就是受控。换模型时回到全能参考 */
  refMode?: string;
  /** 非受控时一开始的参考方式，默认全能参考 */
  defaultRefMode?: string;
  /** 换了参考方式 */
  onRefModeChange?: (mode: string) => void;
  /** 参考区的素材（全能参考、视频编辑、视频延长和图片、音频、Agent 都用这一份）。传了就是受控 */
  references?: ReferenceStackItem[];
  /** 非受控时一开始的素材，默认空（只有添加格） */
  defaultReferences?: ReferenceStackItem[];
  /** 素材变了（加、删、拖进来） */
  onReferencesChange?: (items: ReferenceStackItem[]) => void;
  /** 首尾帧的两张图。传了就是受控 */
  frames?: GenFrames;
  /** 非受控时一开始的首尾帧 */
  defaultFrames?: GenFrames;
  /** 首尾帧变了（互换、拖进来、从参考区搬过来） */
  onFramesChange?: (frames: GenFrames) => void;
  /** 参数面板选的值，每种任务各一份（键见 GEN_PARAM_DEFAULTS）。传了就是受控；「重新编辑」回填参数用 */
  params?: Partial<Record<GenTask, GenParamValues>>;
  /** 非受控时一开始的参数 */
  defaultParams?: Partial<Record<GenTask, GenParamValues>>;
  /** 改了任何一项参数，参数是所有任务的整组值 */
  onParamsChange?: (params: Partial<Record<GenTask, GenParamValues>>) => void;
  /** 张数（图片、视频）。传了就是受控 */
  count?: number;
  /** 非受控时一开始的张数，默认 1 */
  defaultCount?: number;
  /** 张数变了 */
  onCountChange?: (count: number) => void;
  /** 已选的 Lora（照线上：图片模型支持 Lora 时，参考区最左边是 Lora 格，后面隔一条竖线再是参考图，格子 72）。传了就是受控 */
  loras?: LoraFieldItem[];
  /** 非受控时一开始的 Lora */
  defaultLoras?: LoraFieldItem[];
  /** 已选的 Lora 变了（添加、删除、改权重） */
  onLorasChange?: (loras: LoraFieldItem[]) => void;
  /** 能选的 Lora：点 Lora 格弹出选择弹窗（LoraPicker，最多 4 个）。不传就没有 Lora 入口；模型不支持 Lora 也不显示 */
  loraOptions?: (LoraPickerItem & { triggerWords?: string; template?: string })[];
  /** 点了参考区的添加格。不传就弹出选文件，选完加进参考区 */
  onAddReference?: () => void;
  /** 参考区固定展开（受控）。不传是鼠标移上去展开 */
  referencesExpanded?: boolean;
  /** 参考区展开收起 */
  onReferencesExpandedChange?: (expanded: boolean) => void;
  /** 点了生成 / 发送，参数是现在的所有选择。不能生成时（按钮置灰）不触发。
   *  图片、视频等生成发出后提示词不清空（照线上，11-18 用户定）；Agent 发出去清空（像聊天，11-20 用户定），返回 `false`（或 Promise 给 `false`）表示没发出去、不清。
   *  返回请求的 Promise 时，等它的这段时间生成按钮转圈、不能重复提交（回车也一样） */
  onSubmit?: (submit: PromptBoxSubmit) => unknown;
  /** Agent 正在回复：Agent 的发送按钮变停止、不能再发。只管 Agent，切到图片、视频等任务照常生成（11-20 修 R-20） */
  generating?: boolean;
  /** Agent 正在回复时点了停止（发送按钮变成的停止） */
  onStop?: () => void;
  /** 消耗的猕猴桃数。不传按任务和模型取示例数字 */
  cost?: number;
  /** 工具条里的下拉往哪边弹：输入框贴底时往上（默认），在页面上面时往下 */
  placement?: 'top-start' | 'bottom-start';
  /** Agent 技能面板里的技能 */
  skills?: AgentControlsProps['skills'];
  /** Agent 技能面板里的分类 */
  skillCategories?: AgentControlsProps['skillCategories'];
  /** Agent 点了一个技能（技能标签输入框自己插，这里只是通知） */
  onPickSkill?: AgentControlsProps['onPickSkill'];
  /** 没输入时的占位文字。不传跟着任务变 */
  placeholder?: string;
  /** 提示词最高多高，超过就在里面滚动，数字按 px。不传走 PromptInput 的默认（最多 6 行） */
  maxHeight?: number;
  /** 把文件拖进输入框、选文件、粘贴时触发，参数是通过 `accept` 和上传要求（大小、时长、宽高，见 gen-rules 的 UPLOAD_SPECS）检查、也没超过模型参考上限的文件列表。不传就直接加进参考区（首尾帧时图片填空着的格）。拖进来时盖一层 DropOverlay「松手上传」，类型不收的显示「不支持这种文件」、不接收，放下后弹 toast（页面上要放 `<Toaster />`） */
  onDropFiles?: (files: File[]) => void;
  /** 收哪些文件，写法同 `<input accept>`。默认图片、视频、音频；首尾帧时只收图片 */
  accept?: string;
  /** 提示词输入框（PromptInput，contentEditable）的 ref，聚焦、选中用 */
  inputRef?: Ref<HTMLDivElement>;
  /** 提示词输入框的说明，读屏用，默认「提示词」 */
  inputLabel?: string;
}

/** 参考区展开时，盖不住的字从盖住的边往右渐隐出来，渐隐这么宽 */
const FADE = 40;

const DEFAULT_ACCEPT = 'image/*,video/*,audio/*';

/**
 * 主站的创作输入框（首页、对话页）。上面是内容区（参考区 + 提示词），下面是工具条：左边先选任务类型，后面的控件跟着任务和模型变；右边是张数和生成。
 * 提示词是多行的，随内容长高，超过最高高度就在里面滚动；参考区展开时浮在提示词上面，被盖住的字藏起来。
 * 状态都在组件里（11-17 用户定，不许各处自己拼）：任务、模型、参考方式和参考区（叠放 / 首尾帧）、素材上传和拖入、不能生成的原因、消耗。
 * 用的地方只传状态（task、models、refMode、references…），要哪个状态切哪个。规则和画布生成面板 NodePanel 共用 gen-rules.ts。
 * Figma「模板 · 主站」页「输入框」分区。
 */
export const PromptBox = forwardRef<HTMLDivElement, PromptBoxProps>(function PromptBox(
  {
    value: valueProp,
    defaultValue = '',
    onChange,
    task: taskProp,
    defaultTask = 'agent',
    onTaskChange,
    models: modelsProp,
    defaultModels = {},
    onModelsChange,
    refMode: refModeProp,
    defaultRefMode = 'omni',
    onRefModeChange,
    references: referencesProp,
    defaultReferences = [],
    onReferencesChange,
    frames: framesProp,
    defaultFrames = {},
    onFramesChange,
    params: paramsProp,
    defaultParams = {},
    onParamsChange,
    count: countProp,
    defaultCount = 1,
    onCountChange,
    onAddReference,
    loras: lorasProp,
    defaultLoras = [],
    onLorasChange,
    loraOptions,
    referencesExpanded,
    onReferencesExpandedChange,
    onSubmit,
    onStop,
    generating,
    cost,
    placement = 'top-start',
    skills,
    skillCategories,
    onPickSkill,
    placeholder,
    maxHeight = 240,
    onDropFiles,
    accept = DEFAULT_ACCEPT,
    inputRef,
    inputLabel = '提示词',
    className,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    onPasteCapture,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
  const [task, setTask] = useControllable<GenTask>(taskProp, defaultTask, onTaskChange);
  const [models, setModels] = useControllable(modelsProp, defaultModels, onModelsChange);
  const [refMode, setRefMode] = useControllable(refModeProp, defaultRefMode, onRefModeChange);
  const [references, setReferencesRaw] = useControllable(referencesProp, defaultReferences, onReferencesChange);
  // 素材名字按排列顺序、每种类型各自编号（图片1、视频1…）：删了、换了顺序都重新编，提示词里的 @ 跟着改
  const setReferences = (list: ReferenceStackItem[]) => setReferencesRaw(relabelReferences(list));
  const [frames, setFrames] = useControllable(framesProp, defaultFrames, onFramesChange);
  // 参数面板和张数：每种任务各记一份，切任务再切回来还在；发出时一起交出去
  const [params, setParams] = useControllable(paramsProp, defaultParams, onParamsChange);
  const [countNum, setCountNum] = useControllable(countProp, defaultCount, onCountChange);
  const count = String(countNum);
  const setCount = (v: string) => setCountNum(Number(v));
  const paramsOf = (t: GenTask): GenParamValues => params[t] ?? (t in GEN_PARAM_DEFAULTS ? GEN_PARAM_DEFAULTS[t as keyof typeof GEN_PARAM_DEFAULTS] : {});
  // 实际在用的参数：当前模型不支持的值按它支持的算（比如一开始就选了 Veo，时长是 4 而不是默认的 5）
  const paramsNow = (t: GenTask): GenParamValues => fallbackParams(t, models[t] ?? (t === 'agent' ? '' : DEFAULT_MODEL[t]), paramsOf(t)).values;
  const textRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useMergedRef(textRef, inputRef);
  const fileRef = useRef<HTMLInputElement>(null);
  // 上传是异步的：读最新的素材，免得两次加素材互相覆盖
  const latestRefs = useRef(references);
  latestRefs.current = references;

  const modelOf = (t: GenTask) => models[t] ?? (t === 'agent' ? '' : DEFAULT_MODEL[t]);
  const model = modelOf(task);
  const framesNow = task === 'video' && isFramesMode(model, refMode);
  // 参考满了没有：这个模型收的类型（上限 > 0）都放到上限了。Agent 不限
  const referencesFull = (() => {
    if (task === 'agent') return false;
    const limits = inputLimits(model, refMode);
    const counts = countInputs(references.map((r) => r.type));
    const kinds = (['image', 'video', 'audio'] as const).filter((k) => limits[k].max > 0);
    return kinds.length > 0 && kinds.every((k) => counts[k] >= limits[k].max);
  })();
  // Lora：只有图片任务、这个模型支持、给了可选列表才有（照线上 showLora），和画布生成面板一样
  const [loras, setLoras] = useControllable(lorasProp, defaultLoras, onLorasChange);
  const [loraPicker, setLoraPicker] = useState(false);
  const lora = task === 'image' && supportsLora(model) && !!loraOptions;
  // 从弹窗里选了一批：留着的保留原来的权重，新选的权重 1
  const pickLoras = (ids: string[]) =>
    setLoras(
      ids.flatMap((id) => {
        const had = loras.find((l) => l.id === id);
        if (had) return [had];
        const o = loraOptions?.find((l) => l.id === id);
        return o ? [{ id: o.id, name: o.name, cover: o.cover, weight: 1, triggerWords: o.triggerWords, template: o.template }] : [];
      }),
    );

  // 换视频的模型或参考方式（照线上主站）：进首尾帧时两格空着，就把参考区前两张图搬进去（参考区留着）；
  // 出首尾帧时参考区空着，就把首尾帧的图搬回参考区。没有过渡，直接换（11-17 用户定）
  const switchVideo = (nextModel: string, nextMode: string) => {
    const was = isFramesMode(modelOf('video'), refMode);
    const now = isFramesMode(nextModel, nextMode);
    if (!was && now && !frames.first && !frames.last) {
      const imgs = references.filter((i) => i.type === 'image');
      if (imgs.length) setFrames({ first: imgs[0]?.src, last: imgs[1]?.src });
    }
    if (was && !now && references.length === 0) {
      const back = [frames.first, frames.last]
        .filter((src): src is string => !!src)
        .reduce<ReferenceStackItem[]>((list, src, i) => [...list, { id: `frame-${Date.now()}-${i}`, type: 'image', name: referenceName(list, 'image'), src }], []);
      if (back.length) setReferences(back);
    }
    if (nextModel !== modelOf('video')) setModels({ ...models, video: nextModel });
    setRefMode(nextMode);
  };
  // 换模型时参考方式回到全能参考（照线上：模型支持的参考方式不一样）
  // 新模型不支持当前参数值（比如 Veo 的时长只有 4 / 6 / 8）：改回默认并提示一声，都支持就不提示
  const changeModel = (m: string) => {
    if (task === 'image' || task === 'video' || task === 'audio') {
      const { values, changed } = fallbackParams(task, m, paramsNow(task));
      if (changed) {
        setParams({ ...params, [task]: values });
        toast.info('所选模型不支持当前参数，已调整为默认值');
      }
    }
    if (task === 'video') switchVideo(m, 'omni');
    else setModels({ ...models, [task]: m });
  };

  // 加文件（选的、拖进来的）：首尾帧时图片按顺序填空着的首帧、尾帧；其余加进参考区
  // 点了首尾帧哪一格的添加格：选的第一张图放进这一格，多的再填另一格（空着的话）
  const frameTarget = useRef<'first' | 'last' | null>(null);
  const addFiles = async (files: File[]) => {
    if (framesNow) {
      const srcs = files.filter((f) => f.type.startsWith('image')).map((f) => URL.createObjectURL(f));
      const target = frameTarget.current;
      frameTarget.current = null;
      const first = target === 'first' ? srcs.shift() ?? frames.first : frames.first ?? srcs.shift();
      const last = target === 'last' ? srcs.shift() ?? frames.last : frames.last ?? srcs.shift();
      setFrames({ first, last });
      return;
    }
    let list = latestRefs.current;
    for (const f of files) list = [...list, await fileToReference(f, list)];
    setReferences(list);
  };
  // 选的、拖进来的、粘贴的文件都走这里：先按场景的上传要求逐个检查（大小、时长、宽高），再看参考有没有满；
  // 不合格、放不下的跳过，弹 Toast 说第一个原因，合格的照常加。首尾帧里的图不算参考，不看上限
  const intake = async (files: File[]) => {
    const spec = mainUploadSpec(task, model, refMode);
    const checked = await checkFiles(files, (f) => spec[referenceTypeOf(f)]);
    let first = checked.message;
    let accepted = checked.accepted;
    if (!framesNow && task !== 'agent') {
      const limits = inputLimits(model, refMode);
      const counts = countInputs(latestRefs.current.map((r) => r.type));
      const omni = task === 'video' && refMode === 'omni';
      accepted = accepted.filter((f) => {
        const t = referenceTypeOf(f);
        if (counts[t] >= limits[t].max) {
          first ??= referenceFullMessage(t, limits[t].max, omni);
          return false;
        }
        counts[t] += 1;
        return true;
      });
    }
    if (first) toast.error(first);
    if (!accepted.length) {
      frameTarget.current = null;
      return;
    }
    if (onDropFiles) onDropFiles(accepted);
    else void addFiles(accepted);
  };
  const dropFiles = (files: File[]) => void intake(files);
  const pickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) dropFiles(files);
  };
  const fileAccept = framesNow ? 'image/*' : accept;

  // 拖文件进来
  const { dragging, rejected, bind } = useFileDrop({
    accept: fileAccept,
    // 拖进来的不算点了哪一格：按顺序填空格（点了添加格又取消选文件，留下的目标作废）
    onFiles: (files) => {
      frameTarget.current = null;
      dropFiles(files);
    },
    onReject: (_, reason) => toast.error(rejectMessage(reason)),
  });

  // 粘贴文件：焦点在输入框里时 ⌘V，只取第一个符合的，走同一套检查
  const paste = usePasteFiles({
    accept: fileAccept,
    onFile: (file) => dropFiles([file]),
    onUnsupported: () => toast.error('剪贴板中的文件类型不支持，请检查文件格式'),
  });

  const reason = genBlockedReason({
    kind: task,
    text: value,
    model,
    refMode,
    referenceTypes: references.map((r) => r.type),
    hasFirstFrame: !!frames.first,
  });
  const [submitting, runSubmit] = usePending();
  const submit = () => {
    if ((task === 'agent' && generating) || submitting || (task === 'agent' ? !value.trim() : reason)) return;
    return runSubmit(() => {
      const result = onSubmit?.({ task, model, refMode, text: value, references, frames, params: paramsNow(task), count: task === 'image' || task === 'video' ? Number(count) : 1, loras: lora && loras.length ? loras : undefined });
      // Agent 发出去就清空提示词；生成不清
      if (task === 'agent') {
        const clear = (r: unknown) => r !== false && setValue('');
        if (result && typeof (result as { then?: unknown }).then === 'function') void (result as Promise<unknown>).then(clear, () => undefined);
        else clear(result);
      }
      return result;
    });
  };
  const dropHandlers = composeDropHandlers({ onDragEnter, onDragOver, onDragLeave, onDrop }, bind);

  // Agent：插进框里的模型（标签上 data-model 记值），删了标签就不算，用来算每组选满没有
  const [pickedModels, setPickedModels] = useState<string[]>([]);
  // 提示词框是 contentEditable（能放 @ 标签），不能直接受控：记下框里现在的文字，外面改成别的文字时才重写框里的内容
  const shownText = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (value === shownText.current) return;
    setPromptText(textRef.current, value);
    // 文字里的「@图片1」按现在的素材换回标签
    restoreMentions(textRef.current, relabelReferences(latestRefs.current));
    shownText.current = value;
    setPickedModels([]);
  }, [value]);
  const onInput = (e: FormEvent<HTMLDivElement>) => {
    const next = promptText(e.currentTarget);
    shownText.current = next;
    setValue(next);
    setPickedModels(Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-model]'), (c) => c.dataset.model!));
  };
  // Agent 选了模型、技能：在光标处插一个标签（照线上 insertGenModelMention / insertSkillMention，同一个能插多次）
  const pickModel = (m: SelectOption) =>
    insertChip(
      textRef.current,
      <MentionChip type="model" icon={m.icon} data-model={m.value}>
        {m.label}
      </MentionChip>,
    );
  const pickSkill: NonNullable<PromptBoxProps['onPickSkill']> = (s) => {
    insertChip(
      textRef.current,
      <MentionChip type="skill" data-skill={s.title}>
        {s.title}
      </MentionChip>,
    );
    onPickSkill?.(s);
  };
  // 素材改了名、删了：框里的 @ 标签跟着改、跟着删
  // 外面传进来的名字不一定是新编的，按现在的顺序算一遍
  const named = relabelReferences(references);
  useLayoutEffect(() => {
    if (!syncMentions(textRef.current, named)) return;
    const next = promptText(textRef.current);
    shownText.current = next;
    setValue(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [references]);

  // 参考区展开全部：参考区一整行在上、提示词排到下面（11-23 照即梦）。
  // 切之前量好内容区多高、提示词在哪，切完从旧样子补间过去：内容区高度撑开 / 收回，提示词移下来 / 移回去（FLIP）
  const contentRef = useRef<HTMLDivElement>(null);
  const [refsAll, setRefsAll] = useState(false);
  const flipFrom = useRef<{ height: number; left: number; top: number; duration: string } | null>(null);
  useLayoutEffect(() => {
    const from = flipFrom.current;
    const content = contentRef.current;
    const input = textRef.current;
    flipFrom.current = null;
    if (!from || !content || !input) return;
    const to = input.getBoundingClientRect();
    const height = content.offsetHeight;
    const ease = `${from.duration} var(--motion-ease-expand)`;
    content.style.transition = 'none';
    content.style.height = `${from.height}px`;
    input.style.transition = 'none';
    input.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
    void content.offsetHeight;
    content.style.transition = `height ${ease}`;
    content.style.height = `${height}px`;
    input.style.transition = `transform ${ease}`;
    input.style.transform = '';
    const done = () => {
      content.style.transition = '';
      content.style.height = '';
      input.style.transition = '';
    };
    const ms = parseFloat(getComputedStyle(content).transitionDuration) * 1000;
    const t = window.setTimeout(done, (Number.isFinite(ms) ? ms : 0) + 50);
    return () => {
      window.clearTimeout(t);
      done();
      input.style.transform = '';
    };
  }, [refsAll]);

  // 参考区展开了多宽，就把提示词左边这么宽、4 行高的一块藏起来（再多一段渐隐）
  const ctx = useMemo(
    () => ({
      setCoverWidth: (width: number, duration?: string) => {
        const el = textRef.current;
        if (!el) return;
        const over = width - el.offsetLeft;
        el.style.setProperty('--kv-prompt-cover', over > 0 ? `${over + FADE}px` : '0px');
        if (duration) el.style.setProperty('--kv-prompt-cover-duration', duration);
      },
      setShowAll: (next: boolean, duration: string) => {
        const content = contentRef.current;
        const input = textRef.current;
        if (content && input) {
          const r = input.getBoundingClientRect();
          flipFrom.current = { height: content.offsetHeight, left: r.left, top: r.top, duration };
        }
        setRefsAll(next);
      },
    }),
    [],
  );

  return (
    <PromptBoxContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cx('kv-prompt-box', className)}
        data-dragover={dragging && !rejected ? '' : undefined}
        data-rejected={dragging && rejected ? '' : undefined}
        {...dropHandlers}
        onPasteCapture={composeHandlers(onPasteCapture, paste.onPasteCapture)}
        {...rest}
      >
        <div ref={contentRef} className="kv-prompt-box__content" data-all={refsAll && !framesNow ? '' : undefined}>
          <div className="kv-prompt-box__refs">
            {lora && (
              <>
                <LoraField size={72} placement={placement} value={loras} onChange={setLoras} onAdd={() => setLoraPicker(true)} />
                <Divider orientation="vertical" />
              </>
            )}
            {framesNow ? (
              <ReferenceFramePair
                size={72}
                first={{ src: frames.first }}
                last={{ src: frames.last }}
                onSwap={(a, b) => setFrames({ first: a.src, last: b.src })}
                onAdd={(slot) => {
                  frameTarget.current = slot;
                  fileRef.current?.click();
                }}
                onRemove={(slot) => setFrames({ ...frames, [slot]: undefined })}
              />
            ) : (
              <ReferenceStack
                items={references}
                // 参考满了（这个模型收的每种类型都到上限）就不出加号；再拖进来、粘贴照旧弹 Toast 说满了
                max={referencesFull ? references.length : undefined}
                expanded={referencesExpanded}
                onExpandedChange={onReferencesExpandedChange}
                onAdd={onAddReference ?? (() => fileRef.current?.click())}
                onRemove={(id) => setReferences(references.filter((i) => i.id !== id))}
                onClear={() => setReferences([])}
                // 展开全部由输入框记着（它要跟着换排法）；切走首尾帧再回来还是展开的
                showAll={refsAll}
                onReorder={(from, to) => {
                  const next = [...references];
                  next.splice(to, 0, ...next.splice(from, 1));
                  setReferences(next);
                }}
                // 快捷 @（照线上）：点缩略图，把它以 @ 引用插进提示词
                onQuote={(item) => insertMention(textRef.current, named.find((i) => i.id === item.id) ?? item)}
              />
            )}
            <input ref={fileRef} type="file" multiple hidden accept={fileAccept} onChange={pickFiles} />
          </div>
          {lora && (
            <LoraPicker open={loraPicker} onOpenChange={setLoraPicker} items={loraOptions ?? []} value={loras.map((l) => l.id)} onChange={pickLoras} />
          )}
          <PromptInput
            ref={setRefs}
            className="kv-prompt-box__input"
            aria-label={inputLabel}
            placeholder={placeholder ?? GEN_PLACEHOLDER[task]}
            maxLength={PROMPT_MAX_LENGTH}
            style={{ maxHeight }}
            onInput={onInput}
            // 打 @ 弹出参考区的素材（首尾帧时没有）
            mentions={framesNow ? undefined : named}
            // Agent 模式回车发送、Shift + 回车换行；生成模式回车换行（11-19 用户定）
            onEnter={task === 'agent' ? () => void submit() : undefined}
          />
        </div>
        <div className="kv-prompt-box__toolbar">
          <div className="kv-prompt-box__toolbar-start">
            <TaskSelect placement={placement} value={task} onChange={(t) => setTask(t as GenTask)} />
            <GenToolbar
              kind={task}
              model={model}
              onModelChange={changeModel}
              refMode={refMode}
              onRefModeChange={(m) => switchVideo(modelOf('video'), m)}
              placement={placement}
              skills={skills}
              skillCategories={skillCategories}
              onPickSkill={pickSkill}
              pickedModels={pickedModels}
              onPickModel={pickModel}
              params={paramsNow(task)}
              onParamsChange={(p) => setParams({ ...params, [task]: p })}
            />
          </div>
          <div className="kv-prompt-box__toolbar-end">
            <GenActions
              kind={task}
              model={model}
              text={value}
              cost={cost ?? genTotalCost(task, model, Number(count) || 1)}
              reason={reason}
              generating={task === 'agent' && generating}
              loading={submitting}
              onSubmit={submit}
              onStop={onStop}
              placement={placement}
              count={count}
              onCountChange={setCount}
            />
          </div>
        </div>
        <DropOverlay active={dragging} rejected={rejected} />
      </div>
    </PromptBoxContext.Provider>
  );
});
PromptBox.displayName = 'PromptBox';
