import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../button';
import { toast } from '../feedback';
import { checkFiles, useControllable, usePending, usePresence, useScrollLock } from '../hooks';
import { AttachmentStrip, type AttachmentItem } from '../reference/AttachmentStrip';
import { ReferenceFramePair, type ReferenceFrameSlot } from '../reference/ReferenceFramePair';
import { referenceLabels } from '../reference/ReferenceStack';
import { GenActions, GenToolbar } from '../generation/gen-controls';
import { GEN_NODE_PLACEHOLDER, PROMPT_MAX_LENGTH, UPLOAD_SPECS, genBlockedReason, genTotalCost, isFramesMode, referenceFullMessage, referenceTypeOf, type GenNodeType } from '../generation/gen-rules';
import { GEN_PARAM_DEFAULTS, type GenParamValues } from '../generation/GenParams';
import { countInputs, fallbackParams, inputLimits, supportsLora, type InputKind } from '../generation/model-caps';
import { LoraField, type LoraFieldItem } from '../generation/LoraField';
import { LoraPicker, type LoraPickerItem } from '../generation/LoraPicker';
import { Divider } from '../divider';
import { DEFAULT_MODEL } from '../generation/options';
import { PromptInput } from '../generation/PromptInput';
import { insertMention, promptText, restoreMentions, syncMentions } from '../generation/mentions';
import { cx } from '../utils';
import './canvas.css';

/*
  「模板 · 画布」页的模板：生成面板。
  它在 Figma 里是模板，不是组件：里面放什么按钮、什么参数，随节点类型和模型变，复制整条改内容。
  传了 type 就是完整的生成面板（11-17 用户定，状态都在组件里，画布、模板只传状态）：参考素材、提示词、模型和参数、
  参考方式和首尾帧、不能生成的原因、生成按钮，规则和主站 PromptBox 共用 generation/gen-rules.ts。
  不传 type 只是外框（工具面板用：抠图、高清这些），里面自己放 AttachmentStrip、参数、NodePanelBar。
  节点工具栏 glass 44，画布工具栏 surface 56：都不在这里，是 ButtonGroup。
*/

export interface NodePanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** 右上角的全屏按钮：IconButton 32 · 无底灰，图标 FullScreen。点了面板放大到屏幕正中 800 × 600、背后加遮罩，提示词框撑满；
   *  按钮换成关闭，点关闭、点遮罩、按 Esc、点生成都回到原位（照线上）。写的字、@ 标签都还在 */
  expand?: boolean;
  /** 全屏着没有。传了就是受控 */
  expanded?: boolean;
  /** 非受控时一开始全屏没有，默认 false */
  defaultExpanded?: boolean;
  /** 进出全屏 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 点了全屏按钮（进全屏时） */
  onExpand?: () => void;
  /** 生成节点的类型：文字 / 图片 / 视频 / 音频。传了就是完整的生成面板；不传只是外框，里面放 children（工具面板） */
  type?: GenNodeType;
  /** 参考素材：连进来的上游节点，按连接顺序排，右上角自动写「图片1、视频1」（每种类型各自编号），点缩略图把它 @ 进提示词。文字节点也有（图 4、视频 1，反推提示词、脚本用）。首尾帧时前两张图片是首帧、尾帧。附件条和首尾帧里都能删（照线上：悬停时右上角名字直接换成删除，点了断开连线） */
  references?: AttachmentItem[];
  /** 点了参考图右上角的删除（附件条、首尾帧都有），参数是那张图的 `id`（上游节点）：断开这条连线 */
  onRemoveReference?: (id: string) => void;
  /** 首尾帧里点了空格的添加格，参数是哪一格。不传时有 `onUploadReference` 就弹出选图片 */
  onAddReference?: (slot: ReferenceFrameSlot) => void;
  /** 快捷上传（照线上）：参考素材最后跟一个添加格（首尾帧是空格），点了选一个本地文件，选完给你，照线上新建素材节点连进来，传完添加格往右挪。
   *  只能选这个模型还收得下的类型（图片 png / jpg / webp、视频 mp4、音频 mp3 / wav），都满了就没有添加格；大小、时长不合格弹 Toast 不给。不传就没有 */
  onUploadReference?: (file: File) => void;
  /** 附件条里拖着排序，参数是挪的那个 `id` 和挪到哪个 `id` 的位置：改连线的顺序，名字（图片1…）跟着变。不分类型，随便换（11-18 用户定）。不传就不能拖 */
  onReorderReference?: (id: string, targetId: string) => void;
  /** 已选的 Lora（照线上：模型支持 Lora 时，参考素材这一行最前面是 Lora 格，后面隔一条竖线再是参考图）。传了就是受控 */
  loras?: LoraFieldItem[];
  /** 非受控时一开始的 Lora */
  defaultLoras?: LoraFieldItem[];
  /** 已选的 Lora 变了（添加、删除、改权重） */
  onLorasChange?: (loras: LoraFieldItem[]) => void;
  /** 能选的 Lora：点 Lora 格弹出选择弹窗（LoraPicker，最多 4 个）。不传就没有 Lora 入口；当前模型不支持 Lora 也不显示 */
  loraOptions?: (LoraPickerItem & { triggerWords?: string; template?: string })[];
  /** 开头的提示词（只在第一次渲染时用，之后由用户编辑） */
  defaultValue?: ReactNode;
  /** 提示词变了，参数是现在的文字 */
  onChange?: (text: string) => void;
  /** 模型（值）。传了就是受控；不传用这个类型的默认模型 */
  model?: string;
  /** 非受控时一开始的模型 */
  defaultModel?: string;
  /** 换了模型 */
  onModelChange?: (model: string) => void;
  /** 视频的参考方式，同 PromptBox。换模型时回到全能参考 */
  refMode?: string;
  /** 非受控时一开始的参考方式，默认全能参考 */
  defaultRefMode?: string;
  /** 换了参考方式 */
  onRefModeChange?: (mode: string) => void;
  /** 参数（比例、分辨率、时长…）。传了就是受控；画布里每个节点记住自己的参数 */
  params?: GenParamValues;
  /** 非受控时一开始的参数，不传用这个类型的默认值 */
  defaultParams?: GenParamValues;
  /** 改了参数（换模型回落时也会触发） */
  onParamsChange?: (params: GenParamValues) => void;
  /** 张数（图片、视频，'1'–'4'）。传了就是受控 */
  count?: string;
  /** 非受控时一开始的张数，默认 '1' */
  defaultCount?: string;
  onCountChange?: (count: string) => void;
  /** 点了生成，带上这次的提示词、模型、参考方式、实际生效的参数、是不是首尾帧。不能生成时（按钮置灰）不触发。
   *  返回请求的 Promise 时，等它的这段时间生成按钮转圈、不能重复点 */
  onGenerate?: (submit: NodePanelSubmit) => void | Promise<unknown>;
  /** 正在生成：生成按钮置灰；传了 onStop 变停止（11-19 照线上：拿到任务号后 10 秒内可停止，过了锁定） */
  generating?: boolean;
  /** 拿到任务号的时间（Date.now()），可停止倒计时从这里起；不传就是已锁定 */
  stopStartedAt?: number;
  /** 生成中点了停止。返回 Promise 时等它的这段转圈（取消中） */
  onStop?: () => unknown;
  /** 消耗的猕猴桃数。不传按类型和模型取示例数字 */
  cost?: number;
  /** 没输入时的占位文字，默认「描述任何你想要生成的内容」 */
  placeholder?: string;
}

/** 点生成时带出来的东西 */
export interface NodePanelSubmit {
  text: string;
  model: string;
  refMode: string;
  /** 按当前模型实际生效的参数（不支持的已回落到默认） */
  params: GenParamValues;
  /** 张数：图片、视频按选的，文字、音频是 1 */
  count: number;
  /** 挂的 Lora（模型支持 Lora 时才带） */
  loras?: LoraFieldItem[];
  /** 视频是不是首尾帧方式；是的话 frames 是首帧、尾帧的上游 id（互换过就是换过的顺序） */
  frames?: { first?: string; last?: string };
}

/** 生成面板：选中节点后出现在节点下方。竖排三块：参考素材（AttachmentStrip，首尾帧时 ReferenceFramePair）、PromptInput（提示词）、NodePanelBar（模型选择栏） */
export const NodePanel = forwardRef<HTMLDivElement, NodePanelProps>(function NodePanel(
  {
    expand,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    onExpand,
    type,
    references = [],
    onRemoveReference,
    onAddReference,
    onUploadReference,
    onReorderReference,
    loras: lorasProp,
    defaultLoras = [],
    onLorasChange,
    loraOptions,
    defaultValue,
    onChange,
    model: modelProp,
    defaultModel,
    onModelChange,
    refMode: refModeProp,
    defaultRefMode = 'omni',
    onRefModeChange,
    params: paramsProp,
    defaultParams = {},
    onParamsChange,
    count: countProp,
    defaultCount = '1',
    onCountChange,
    onGenerate,
    stopStartedAt,
    onStop,
    generating,
    cost,
    placeholder = GEN_NODE_PLACEHOLDER,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [model, setModel] = useControllable(modelProp, defaultModel ?? (type ? DEFAULT_MODEL[type] : ''), onModelChange);
  const [refMode, setRefMode] = useControllable(refModeProp, defaultRefMode, onRefModeChange);
  // 参数面板的值：换模型时新模型不支持的值改回默认并提示一声（和主站输入框一样）。实际在用的值按当前模型支持的算
  const [rawParams, setRawParams] = useControllable(paramsProp, defaultParams, onParamsChange);
  const [count, setCount] = useControllable(countProp, defaultCount, onCountChange);
  const [loras, setLoras] = useControllable(lorasProp, defaultLoras, onLorasChange);
  const [loraPicker, setLoraPicker] = useState(false);
  const [submitting, runSubmit] = usePending();
  const params = type && type !== 'text' ? fallbackParams(type, model, { ...GEN_PARAM_DEFAULTS[type], ...rawParams }).values : {};
  const changeModel = (m: string) => {
    if (type && type !== 'text') {
      const { values, changed } = fallbackParams(type, m, params);
      if (changed) {
        setRawParams(values);
        toast.info('所选模型不支持当前参数，已调整为默认值');
      }
    }
    setModel(m);
    // 换模型时参考方式回到全能参考（照线上）
    setRefMode('omni');
  };
  const [text, setText] = useState(typeof defaultValue === 'string' ? defaultValue : '');
  const inputRef = useRef<HTMLDivElement>(null);
  // 参考素材按连接顺序、每种类型各自编号（图片1、视频1…），和右上角、@ 出来的一致
  const labels = referenceLabels(references.map((r) => r.type));
  const named = references.map((r, i) => ({ ...r, name: labels[i] }));
  const namesKey = named.map((r) => `${r.id}:${r.name}`).join('\n');
  // 节点只存了文字：再选中时把里面的「@图片1」按现在连进来的素材换回标签
  useLayoutEffect(() => {
    restoreMentions(inputRef.current, named);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 断开了连线、换了顺序：提示词里的 @ 标签跟着删、跟着改名
  useLayoutEffect(() => {
    if (!syncMentions(inputRef.current, named)) return;
    const next = promptText(inputRef.current);
    setText(next);
    onChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);
  // 首尾帧互换过没有：连进来的图变了就作废，回到按连接顺序
  const [swap, setSwap] = useState({ key: '', on: false });

  // 全屏：面板本身不重建（写的字、@ 标签、光标都在），整块挪到 body 上的遮罩里，退出再挪回原位。
  // 动效和弹窗一样：进 300ms ease-out 淡入 + 96% → 100%，出 200ms ease-in 淡出 + 缩回 96%，出的动画放完才挪回去（usePresence）
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
  const fullscreen = Boolean(expand && expanded);
  const { mounted: staged } = usePresence(fullscreen, EXIT_MS);
  const [host] = useState(() => (typeof document === 'undefined' ? null : Object.assign(document.createElement('div'), { className: 'kv-node-panel__host' })));
  const slotRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!expand || !host) return;
    (staged ? stageRef.current : slotRef.current)?.appendChild(host);
    // 挪走和拿掉放在同一个副作用里：换位置、卸载、开发时热更新重跑都不会把面板弄丢
    return () => host.remove();
  }, [expand, staged, host]);
  useScrollLock(staged);
  // 先挂上（还是隐藏的）、算一遍样式再放开，进场过渡才会播；退出时先收（aria-hidden），放完再拿掉
  const [entered, setEntered] = useState(false);
  useLayoutEffect(() => {
    if (!fullscreen) return setEntered(false);
    stageRef.current?.getBoundingClientRect();
    setEntered(true);
  }, [fullscreen]);
  // 进全屏把光标放进提示词最后；Esc 退出（里面的下拉自己处理了 Esc 就不管，也不让画布拿去取消选中）
  useEffect(() => {
    if (!fullscreen) return;
    const input = inputRef.current;
    if (input) {
      input.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(input);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  // 快捷上传：选文件只给这个模型还收得下的类型
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickKinds, setPickKinds] = useState<InputKind[]>([]);
  const pick = (kinds: InputKind[]) => {
    if (!kinds.length || !fileRef.current) return;
    setPickKinds(kinds);
    fileRef.current.accept = kinds.map((k) => UPLOAD_SPECS.canvas[k].accept).join(',');
    fileRef.current.click();
  };
  const onPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadReference) return;
    const kind = referenceTypeOf(file);
    if (!pickKinds.includes(kind)) {
      toast.error(referenceFullMessage(kind, inputLimits(model, refMode)[kind].max, refMode === 'omni'));
      return;
    }
    const { accepted, message } = await checkFiles([file], (f) => UPLOAD_SPECS.canvas[referenceTypeOf(f)]);
    if (message) toast.error(message);
    if (accepted[0]) onUploadReference(accepted[0]);
  };

  let body: ReactNode = children;
  if (type) {
    const frames = type === 'video' && isFramesMode(model, refMode);
    // 首尾帧：连进来的前两张图片按顺序当首帧、尾帧（照线上画布）
    const images = references.filter((r) => r.type === 'image');
    const imageKey = images.map((r) => r.id).join('\n');
    const swapped = swap.on && swap.key === imageKey;
    const [firstImg, lastImg] = swapped ? [images[1], images[0]] : [images[0], images[1]];
    const reason = genBlockedReason({
      kind: type,
      text,
      model,
      refMode,
      referenceTypes: references.map((r) => r.type),
      hasFirstFrame: !!firstImg?.src,
    });
    // 还能加哪些类型的参考：没满的才给选（照线上 addInputAvailability），都满了就没有添加格
    const limits = inputLimits(model, refMode);
    const counts = countInputs(references.map((r) => r.type));
    const addKinds: InputKind[] = onUploadReference && !frames ? (['image', 'video', 'audio'] as const).filter((k) => counts[k] < limits[k].max) : [];
    // Lora：只有图片模型、这个模型支持、给了可选列表才有（照线上 showLora）
    const lora = type === 'image' && supportsLora(model) && !!loraOptions;
    const showStrip = !frames && (references.length > 0 || addKinds.length > 0);
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
    const onInput = (e: FormEvent<HTMLDivElement>) => {
      const next = promptText(e.currentTarget);
      setText(next);
      onChange?.(next);
    };
    body = (
      <>
        {frames ? (
          <ReferenceFramePair
            first={{ id: firstImg?.id, src: firstImg?.src }}
            last={{ id: lastImg?.id, src: lastImg?.src }}
            onSwap={() => setSwap({ key: imageKey, on: !swapped })}
            onAdd={onAddReference ?? (onUploadReference && (() => pick(['image'])))}
            onRemove={onRemoveReference && ((_, frame) => frame.id && onRemoveReference(frame.id))}
          />
        ) : (
          (lora || showStrip) && (
            // 参考素材这一行：Lora 格 ｜ 参考图。右上角有全屏按钮时，这一行右边给它让位（canvas.css）
            <div className="kv-node-panel__refs">
              {lora && <LoraField placement="top-start" value={loras} onChange={setLoras} onAdd={() => setLoraPicker(true)} />}
              {lora && showStrip && <Divider orientation="vertical" />}
              {showStrip && (
                <AttachmentStrip
                  className="kv-node-panel__strip"
                  items={named}
                  aria-label="参考图"
                  labels
                  onReorder={onReorderReference && ((from, to) => onReorderReference(references[from].id, references[to].id))}
                  // 快捷 @（照线上）：点缩略图，把它以 @ 引用插进提示词
                  onQuote={(item) => insertMention(inputRef.current, item)}
                  // 悬停时右上角名字直接换成删除，点了断开这条连线（照线上）
                  onRemove={onRemoveReference}
                  onAdd={addKinds.length ? () => pick(addKinds) : undefined}
                />
              )}
            </div>
          )
        )}
        {lora && (
          <LoraPicker open={loraPicker} onOpenChange={setLoraPicker} items={loraOptions ?? []} value={loras.map((l) => l.id)} onChange={pickLoras} />
        )}
        <PromptInput
          ref={inputRef}
          // 全屏时撑满面板、不限行数（canvas.css）
          className="kv-node-panel__prompt"
          placeholder={placeholder}
          maxLength={PROMPT_MAX_LENGTH}
          onInput={onInput}
          mentions={frames ? undefined : named}
        >
          {defaultValue}
        </PromptInput>
        <NodePanelBar
          left={
            <GenToolbar
              kind={type}
              model={model}
              onModelChange={changeModel}
              refMode={refMode}
              onRefModeChange={setRefMode}
              params={type === 'text' ? undefined : params}
              onParamsChange={setRawParams}
            />
          }
          right={
            <GenActions
              kind={type}
              model={model}
              text={text}
              cost={cost ?? genTotalCost(type, model, Number(count) || 1)}
              reason={reason}
              generating={generating}
              stopStartedAt={stopStartedAt}
              onStop={onStop}
              loading={submitting}
              count={count}
              onCountChange={setCount}
              onSubmit={() => {
                if (reason || generating || submitting) return;
                // 全屏里点生成：发出去就回到原位（照线上）
                setExpanded(false);
                runSubmit(() => onGenerate?.({
                  text,
                  model,
                  refMode,
                  params,
                  count: type === 'image' || type === 'video' ? Number(count) : 1,
                  frames: frames ? { first: firstImg?.id, last: lastImg?.id } : undefined,
                  loras: lora && loras.length ? loras : undefined,
                }));
              }}
            />
          }
        />
      </>
    );
  }

  const panel = (
    <div ref={ref} className={cx('kv-node-panel', className)} data-fullscreen={staged ? '' : undefined} {...rest}>
      {body}
      {onUploadReference && <input ref={fileRef} type="file" hidden onChange={(e) => void onPicked(e)} />}
      {expand &&
        (fullscreen ? (
          <IconButton icon="Close" label="退出全屏" variant="ghost-muted" className="kv-node-panel__expand" onClick={() => setExpanded(false)} />
        ) : (
          <IconButton
            icon="FullScreen"
            label="全屏"
            variant="ghost-muted"
            className="kv-node-panel__expand"
            onClick={() => {
              onExpand?.();
              setExpanded(true);
            }}
          />
        ))}
    </div>
  );
  if (!expand || !host) return panel;
  // 带全屏的：面板渲染进 host，host 平时在原位，全屏时挪进遮罩。遮罩上的事件不往画布上冒（不然点遮罩会被画布当成点空白处）
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <>
      <div ref={slotRef} className="kv-node-panel__slot" />
      {createPortal(panel, host)}
      {staged &&
        createPortal(
          <div
            ref={stageRef}
            className="kv-node-panel__mask"
            aria-hidden={!entered}
            onPointerDown={stop}
            onMouseDown={stop}
            onWheel={stop}
            onContextMenu={stop}
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) setExpanded(false);
            }}
          />,
          document.body,
        )}
    </>
  );
});
NodePanel.displayName = 'NodePanel';

/** 全屏退出动画的时长，和弹窗一样（--motion-duration-200） */
const EXIT_MS = 200;

export interface NodePanelBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 左边：模型、质量、比例等下拉（Select · 无底），间距 6 */
  left?: ReactNode;
  /** 右边：数量下拉和生成按钮，间距 8 */
  right?: ReactNode;
}

/** 生成面板的模型选择栏：高 32，左边下拉、右边数量和生成按钮 */
export const NodePanelBar = forwardRef<HTMLDivElement, NodePanelBarProps>(function NodePanelBar(
  { left, right, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-node-panel__bar', className)} {...rest}>
      <div className="kv-node-panel__bar-left">{left}</div>
      <div className="kv-node-panel__bar-right">{right}</div>
    </div>
  );
});
NodePanelBar.displayName = 'NodePanelBar';
