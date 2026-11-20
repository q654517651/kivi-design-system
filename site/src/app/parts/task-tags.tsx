import { GenPromptRefs, MODELS, TASKS, Tag } from '@kivi';
import { videoPoster } from '../data/mock';
import { toolOf, type ToolId } from '../data/tools';
import type { Task } from '../data/types';

/*
  任务的标签那一排（GenPrompt 里的 Tag）：按 Task 的纯数据画，任务里不存 ReactNode。
  - 生成任务：类型（图片 / 视频 / 音频生成）→ 模型（名字和图标照 generation/options.ts）→ 参考（参考方式文字 + 缩略图）→ 参数值。
  - 工具任务：工具名（工具的图标、任务里的 label）→ 原图 / 原视频。
  创作页的记录、查看大图的信息栏共用。
*/

/** 参数按这个顺序显示，音频的参数不显示 */
const PARAM_ORDER = ['resolution', 'ratio', 'duration'];

const paramText = (key: string, value: string) => (key === 'duration' ? `${value}s` : value);

export function TaskTags({ task }: { task: Task }) {
  if (task.kind === 'tool') {
    const tool = task.tool ? toolOf(task.tool as ToolId) : undefined;
    const media = task.media === 'video' ? 'video' : 'image';
    return (
      <>
        <Tag icon={tool?.icon}>{task.label ?? tool?.name}</Tag>
        <GenPromptRefs label={media === 'image' ? '原图' : '原视频'} items={media === 'video' ? task.refs.map(() => ({ type: media, src: videoPoster(task.ratio) })) : [{ type: media, src: task.refs[0]?.src }]} />
      </>
    );
  }
  const kind = TASKS.find((t) => t.value === task.media);
  const model = MODELS[task.media].find((m) => m.value === task.model);
  return (
    <>
      {kind && <Tag icon={kind.icon}>{kind.label}</Tag>}
      {model && <Tag icon={model.icon}>{model.label}</Tag>}
      {task.refs.length > 0 && <GenPromptRefs label={task.refLabel ?? '参考图'} items={task.refs.map((r) => ({ type: r.type, src: r.src }))} />}
      {task.media !== 'audio' &&
        PARAM_ORDER.filter((k) => task.params[k]).map((k) => <Tag key={k}>{paramText(k, task.params[k])}</Tag>)}
    </>
  );
}
