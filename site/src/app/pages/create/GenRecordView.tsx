import { useState } from 'react';
import { Button, Dropdown, GenPrompt, IconButton, Menu, MenuItem, type PlaceholderImageRatio } from '@kivi';
import { videoPoster } from '../../data/mock';
import { countdownLabel, useNow } from '../../data/tasks';
import type { Asset, Task } from '../../data/types';
import { TaskTags } from '../../parts/task-tags';
import { RecordTile, type TileContext, type TileRef, type ViewerInfo } from './tiles';

/*
  记录流里的一条记录：提示词和标签（GenPrompt）、结果格网格、底下的操作行。
  数据都来自 Task 和它的素材：生成中的格子显示倒计时角标，失败的格子保留操作，工具任务只有标签（没有提示词）。
*/

/** 网格怎么排：多张 4 列；单张横图占 2 列，方图改 3 列占 1 列，竖图占 1 列 */
function gridOf(ratio: PlaceholderImageRatio, count: number) {
  const [w, h] = ratio.split(':').map(Number);
  if (count > 1) return { cols: 4, span: 1 };
  if (w > h) return { cols: 4, span: 2 };
  if (w === h) return { cols: 3, span: 1 };
  return { cols: 4, span: 1 };
}

export function GenRecordView({ task, assets, ctx }: { task: Task; assets: Map<string, Asset>; ctx: TileContext }) {
  // 再次生成提交中：按钮转圈、不能连点
  const [rerunning, setRerunning] = useState(false);
  const rerun = async () => {
    setRerunning(true);
    try {
      await ctx.record.rerun(task);
    } finally {
      setRerunning(false);
    }
  };
  return (
    <div className="tpl-record">
      <GenPrompt prompt={task.prompt}>
        <TaskTags task={task} />
      </GenPrompt>
      <TaskGrid task={task} assets={assets} ctx={ctx} />
      {/* 照即梦：常用的两个是带图标的次要灰按钮，删除收进「⋯」（11-16 用户定） */}
      <div className="tpl-row">
        <Button variant="secondary-muted" leftIcon="Rename" onClick={() => ctx.record.edit(task)}>
          重新编辑
        </Button>
        <Button variant="secondary-muted" leftIcon="Reset" loading={rerunning} onClick={() => void rerun()}>
          再次生成
        </Button>
        <Dropdown placement="bottom-start" trigger={<IconButton icon="More" label="更多" tooltip={false} variant="ghost-muted" />}>
          <Menu aria-label="这组记录的更多操作">
            <MenuItem icon="Delete" variant="danger" onClick={() => ctx.record.remove(task)}>
              删除整组
            </MenuItem>
          </Menu>
        </Dropdown>
      </div>
    </div>
  );
}

/** 一个任务的结果格网格：生成中倒计时、失败保留操作、完成接素材。记录和 Agent 回复里的结果都用它 */
export function TaskGrid({ task, assets, ctx }: { task: Task; assets: Map<string, Asset>; ctx: TileContext }) {
  const now = useNow(task.status === 'running');
  const info: ViewerInfo = { prompt: task.prompt, tags: <TaskTags task={task} /> };
  const grid = gridOf(task.ratio, task.outputs.length);
  const video = task.media === 'video';
  // 结果格的类型：音频生成出来是音频格（11-19，原来当图片画，一直显示失败）
  const media: TileRef['media'] = video ? 'video' : task.media === 'audio' ? 'audio' : 'image';
  // 工具任务生成中先用原图垫着（视频用封面）
  const origin = task.kind === 'tool' ? task.refs[0]?.src ?? '' : '';
  return (
    <div className="tpl-grid" data-cols={grid.cols === 3 ? '3' : undefined}>
      {task.outputs.map((o, i) => {
        const base = { key: `${task.id}-${i}`, ratio: task.ratio, info, taskId: task.id, index: i };
        if (o.status === 'failed') {
          const tile: TileRef = { ...base, media, src: '' };
          return <RecordTile key={i} tile={tile} ctx={ctx} status="failed" span={grid.span} />;
        }
        if (o.status === 'running') {
          const tile: TileRef = { ...base, media, src: origin, poster: video && origin ? videoPoster(task.ratio) : undefined };
          return <RecordTile key={i} tile={tile} ctx={ctx} status="generating" badge={countdownLabel(task, now)} span={grid.span} />;
        }
        const asset = o.assetId ? assets.get(o.assetId) : undefined;
        if (!asset) return null;
        const tile: TileRef = { ...base, media, src: asset.src, poster: asset.poster, assetId: asset.id };
        return <RecordTile key={i} tile={tile} ctx={ctx} span={grid.span} collected={asset.collected} />;
      })}
    </div>
  );
}
