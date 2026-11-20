import { Button, GenPrompt } from '@kivi';
import { useCopy } from '@kivi/hooks';
import { byId, useDB } from '../data/db';
import type { Asset } from '../data/types';
import { rememberImage, ViewerSection } from './media-viewer';
import { TaskTags } from './task-tags';

/*
  查看大图右边信息栏里「这张图怎么来的」（照线上 CardDetailModal）：从上到下
  - 同一个任务出了几张（> 1）：第一排是这几张的缩略图，点了换成看那张，当前这张白框。
  - 提示词：全文，不收起；复制放在「提示词」标题右边（照线上），无底灰小按钮带图标，复制后换对勾写「已复制」。工具任务没有。
  - 参数：类型、模型、参考（参考方式 + 缩略图，悬停看全部，浮层放不下自己往左挪 / 翻上去）、分辨率、比例、时长，和创作页记录同一套 TaskTags；工具任务是工具名 + 原图。
  不显示来源。资产页、画布「历史」、创作页的大图共用。
*/

export interface AssetInfoProps {
  asset: Asset;
  /** 点了同任务的另一张：换成看它 */
  onPick?: (assetId: string) => void;
  /** 这张能不能切过去（不在当前列表里的不出缩略图，免得点了没处放） */
  pickable?: (assetId: string) => boolean;
}

export function AssetInfo({ asset, onPick, pickable }: AssetInfoProps) {
  const task = useDB((s) => byId(s.tasks, asset.taskId));
  const assets = useDB((s) => s.assets);
  if (!task) return null;

  const siblings = task.outputs.flatMap((o) => {
    const a = byId(assets, o.assetId);
    return a && (a.id === asset.id || !pickable || pickable(a.id)) ? [a] : [];
  });

  return (
    <>
      {siblings.length > 1 && (
        <div className="tpl-viewer__gallery" role="group" aria-label="同一次生成的结果">
          {siblings.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className="tpl-viewer__gallery-item"
              aria-pressed={a.id === asset.id}
              aria-label={`第 ${i + 1} 张`}
              onClick={() => a.id !== asset.id && onPick?.(a.id)}
            >
              {/* 缩略图加载完记下比例：切过去时大图直接出，不再等骨架屏（不然一闪） */}
              <img
                src={a.media === 'video' ? a.poster : a.src}
                alt=""
                onLoad={(e) => a.media !== 'video' && rememberImage(a.src, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
              />
            </button>
          ))}
        </div>
      )}
      {task.prompt?.trim() && (
        <ViewerSection title="提示词" action={<CopyPrompt text={task.prompt} />}>
          <p className="tpl-viewer__prompt">{task.prompt}</p>
        </ViewerSection>
      )}
      <ViewerSection title="参数">
        <GenPrompt>
          <TaskTags task={task} />
        </GenPrompt>
      </ViewerSection>
    </>
  );
}

/** 提示词标题右边的「复制」：Button 无底灰 28 + 图标，复制成功换对勾「已复制」 */
export function CopyPrompt({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <Button variant="ghost-muted" size={28} leftIcon={copied ? 'CheckSmall' : 'Copy'} onClick={() => void copy(text)}>
      {copied ? '已复制' : '复制'}
    </Button>
  );
}
