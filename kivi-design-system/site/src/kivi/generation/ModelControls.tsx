import { forwardRef, type ReactNode } from 'react';
import { useControllable } from '../hooks';
import { AudioParams, ImageParams, VideoParams } from './GenParams';
import { BackgroundSelect, ModelSelect, RefModeSelect, VoiceSelect, type GenSelectProps } from './GenSelects';
import { DEFAULT_MODEL, VIDEO_FIRST_LAST_ONLY, VIDEO_WITH_AUDIO } from './options';

/*
  跟着模型变的一组控件：放进 PromptBox 的 toolbar（任务类型后面）。每个返回一串并排的控件，没有自己的外壳：
  ref 和其余属性都给第一个控件，也就是模型下拉。
*/

/** 模型下拉能接的属性：值由组件自己管，不能传 */
/** 其余属性给模型那一格；placement 给这一组所有的下拉（往哪边弹由用的地方定） */
type ModelSelectRest = Omit<GenSelectProps, 'value' | 'defaultValue' | 'onChange'>;

export interface VideoModelControlsProps extends ModelSelectRest {
  /** 视频模型（值）。传了就是受控，参考方式、参数跟着它换；外面要按模型算消耗就传 */
  model?: string;
  /** 非受控时一开始选哪个视频模型（值），默认 Seedance 2.0 */
  defaultModel?: string;
  /** 换了模型时触发，参数是新的模型值 */
  onModelChange?: (model: string) => void;
  /** 参考方式那一格，默认不受控的 RefModeSelect（跟着这一组的 placement）；要跟着切参考区就自己传一个受控的 */
  refMode?: ReactNode;
}

/**
 * 视频：模型 + 参考方式 + 参数，模型在前、参考方式在后（画布和主站一样）。模型决定参数里有什么、后面跟什么：
 * 照线上分三类：Seedance、Kling V3 Omni 参数里多「生成音频」；只有首尾帧的（Veo、Sora、Grok、Vidu、Seedance 1.5）不出参考方式。
 * refMode 默认是不受控的 RefModeSelect，要跟着切参考区就自己传一个受控的
 */
export const VideoModelControls = forwardRef<HTMLSpanElement, VideoModelControlsProps>(function VideoModelControls(
  { model: modelProp, defaultModel = DEFAULT_MODEL.video, onModelChange, refMode, placement, ...rest },
  ref,
) {
  const [model, setModel] = useControllable(modelProp, defaultModel, onModelChange);
  const audio = VIDEO_WITH_AUDIO.includes(model);
  return (
    <>
      <ModelSelect ref={ref} type="video" value={model} onChange={setModel} placement={placement} {...rest} />
      {!VIDEO_FIRST_LAST_ONLY.includes(model) && (refMode ?? <RefModeSelect placement={placement} />)}
      <VideoParams audio={audio} placement={placement} />
    </>
  );
});
VideoModelControls.displayName = 'VideoModelControls';

export interface ImageModelControlsProps extends ModelSelectRest {
  /** 图片模型（值）。传了就是受控；外面要按模型算消耗就传 */
  model?: string;
  /** 非受控时一开始选哪个图片模型（值），默认 GPT Image 2 */
  defaultModel?: string;
  /** 换了模型时触发，参数是新的模型值 */
  onModelChange?: (model: string) => void;
}

/** 图片：模型 + 参数（比例、分辨率一个面板，照视频参数，11-11 用户定）；GPT Image 多一个背景（Figma 主站「图片生成 · GPT」示例） */
export const ImageModelControls = forwardRef<HTMLSpanElement, ImageModelControlsProps>(function ImageModelControls(
  { model: modelProp, defaultModel = DEFAULT_MODEL.image, onModelChange, placement, ...rest },
  ref,
) {
  const [model, setModel] = useControllable(modelProp, defaultModel, onModelChange);
  return (
    <>
      <ModelSelect ref={ref} type="image" value={model} onChange={setModel} placement={placement} {...rest} />
      <ImageParams placement={placement} />
      {model.startsWith('gpt-image') && <BackgroundSelect placement={placement} />}
    </>
  );
});
ImageModelControls.displayName = 'ImageModelControls';

export interface AudioModelControlsProps extends ModelSelectRest {
  /** 音频模型（值）。传了就是受控，音色和高级设置跟着它换；外面要用它算字数上限就传 */
  model?: string;
  /** 换了模型时触发，参数是新的模型值 */
  onModelChange?: (model: string) => void;
}

/** 音频：模型 + 音色 + 高级设置，跟着模型换（照线上）。没有张数和比例，右边是字数 / 上限 */
export const AudioModelControls = forwardRef<HTMLSpanElement, AudioModelControlsProps>(function AudioModelControls(
  { model: modelProp, onModelChange, placement, ...rest },
  ref,
) {
  const [model, change] = useControllable(modelProp, DEFAULT_MODEL.audio, onModelChange);
  return (
    <>
      <ModelSelect ref={ref} type="audio" value={model} onChange={change} placement={placement} {...rest} />
      <VoiceSelect key={`v-${model}`} model={model} placement={placement} />
      <AudioParams key={`p-${model}`} model={model} placement={placement} />
    </>
  );
});
AudioModelControls.displayName = 'AudioModelControls';
