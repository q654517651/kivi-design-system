import { forwardRef, useState, type ReactNode } from 'react';
import { AudioParams, VideoParams } from './GenParams';
import { BackgroundSelect, ModelSelect, RatioSelect, RefModeSelect, SizeSelect, VoiceSelect, type GenSelectProps } from './GenSelects';
import { DEFAULT_MODEL, VIDEO_FIRST_LAST_ONLY, VIDEO_WITH_AUDIO } from './options';

/*
  跟着模型变的一组控件：放进 PromptBox 的 toolbar（任务类型后面）。每个返回一串并排的控件，没有自己的外壳：
  ref 和其余属性都给第一个控件，也就是模型下拉。
*/

/** 模型下拉能接的属性：值由组件自己管，不能传 */
type ModelSelectRest = Omit<GenSelectProps, 'value' | 'defaultValue' | 'onChange'>;

export interface VideoModelControlsProps extends ModelSelectRest {
  /** 一开始选哪个视频模型（值），默认 Seedance 2.0 */
  defaultModel?: string;
  /** 参考方式那一格，默认不受控的 RefModeSelect；要跟着切参考区就自己传一个受控的 */
  refMode?: ReactNode;
}

/**
 * 视频：模型 + 参考方式 + 参数，模型在前、参考方式在后（画布和主站一样）。模型决定参数里有什么、后面跟什么：
 * 照线上分三类：Seedance、Kling V3 Omni 参数里多「生成音频」；只有首尾帧的（Veo、Sora、Grok、Vidu、Seedance 1.5）不出参考方式。
 * refMode 默认是不受控的 RefModeSelect，要跟着切参考区就自己传一个受控的
 */
export const VideoModelControls = forwardRef<HTMLSpanElement, VideoModelControlsProps>(function VideoModelControls(
  { defaultModel = DEFAULT_MODEL.video, refMode = <RefModeSelect />, ...rest },
  ref,
) {
  const [model, setModel] = useState(defaultModel);
  const audio = VIDEO_WITH_AUDIO.includes(model);
  return (
    <>
      <ModelSelect ref={ref} type="video" value={model} onChange={setModel} {...rest} />
      {!VIDEO_FIRST_LAST_ONLY.includes(model) && refMode}
      <VideoParams key={audio ? 'audio' : 'silent'} audio={audio} />
    </>
  );
});
VideoModelControls.displayName = 'VideoModelControls';

export interface ImageModelControlsProps extends ModelSelectRest {
  /** 一开始选哪个图片模型（值），默认 GPT Image 2 */
  defaultModel?: string;
}

/** 图片：模型 + 分辨率 + 比例；GPT Image 多一个背景（Figma 主站「图片生成 · GPT」示例） */
export const ImageModelControls = forwardRef<HTMLSpanElement, ImageModelControlsProps>(function ImageModelControls(
  { defaultModel = DEFAULT_MODEL.image, ...rest },
  ref,
) {
  const [model, setModel] = useState(defaultModel);
  return (
    <>
      <ModelSelect ref={ref} type="image" value={model} onChange={setModel} {...rest} />
      <SizeSelect />
      <RatioSelect />
      {model.startsWith('gpt-image') && <BackgroundSelect />}
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
  { model: modelProp, onModelChange, ...rest },
  ref,
) {
  const [inner, setInner] = useState(DEFAULT_MODEL.audio);
  const model = modelProp ?? inner;
  const change = (m: string) => {
    setInner(m);
    onModelChange?.(m);
  };
  return (
    <>
      <ModelSelect ref={ref} type="audio" value={model} onChange={change} {...rest} />
      <VoiceSelect key={`v-${model}`} model={model} />
      <AudioParams key={`p-${model}`} model={model} />
    </>
  );
});
AudioModelControls.displayName = 'AudioModelControls';
