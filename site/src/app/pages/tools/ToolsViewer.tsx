import { IconButton, placeholderImageSrc } from '@kivi';
import { byId, useDB } from '../../data/db';
import { removeAssets, setCollected } from '../../data/assets';
import { confirmDelete } from '../../flows/delete';
import { attempt } from '../../flows/errors';
import { downloadMedia } from '../../flows/files';
import { AssetInfo } from '../../parts/asset-info';
import { MediaViewer, ViewerAuthor, useLastShown, type ViewerMedia } from '../../parts/media-viewer';
import { groupOf, timeOf } from '../assets/assetCells';
import type { HistoryItem } from './history';

/*
  看大图：全站共用的查看大图（parts/media-viewer.tsx），和创作页、资产页一样：
  历史里已完成的作为一组，↑ ↓ 翻页；收藏、删除、下载；信息栏用 AssetInfo（工具名 + 原图 / 原视频），日期是任务真实时间。
*/

export interface ToolsViewerProps {
  /** 能翻的那一串：历史里已完成的 */
  items: HistoryItem[];
  /** 现在看的任务 id，null 是关着 */
  id: string | null;
  onChange: (id: string | null) => void;
}

const toMedia = (r: HistoryItem): ViewerMedia => ({ type: r.media, src: r.src, poster: r.poster, alt: r.label });

export function ToolsViewer({ items, id, onChange }: ToolsViewerProps) {
  const assets = useDB((s) => s.assets);
  const index = items.findIndex((r) => r.id === id);
  const view = index >= 0 ? items[index] : null;
  const shown = useLastShown(view);
  const asset = shown ? byId(assets, shown.task.outputs[0]?.assetId ?? '') : undefined;

  // 删除：确认后先切到下一张（没有下一张看上一张），再删，免得大图闪一下关掉
  const remove = () => {
    if (!asset) return;
    const next = items[index + 1] ?? items[index - 1];
    void confirmDelete(async () => {
      onChange(next?.id ?? null);
      await removeAssets([asset.id]);
    });
  };

  return (
    <MediaViewer
      media={view && toMedia(view)}
      onClose={() => onChange(null)}
      group={items.map(toMedia)}
      index={Math.max(index, 0)}
      onIndexChange={(i) => onChange(items[i]?.id ?? null)}
      head={
        shown && (
          <ViewerAuthor
            name="KIVI"
            avatar={placeholderImageSrc('ip-peek', '1:1')}
            date={`${groupOf(shown.task.createdAt)} ${timeOf(shown.task.createdAt)}`}
          />
        )
      }
      actions={
        asset && (
          <>
            <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => void downloadMedia([{ src: asset.src }])} />
            <IconButton icon="Delete" label="删除" variant="secondary" size={36} onClick={remove} />
            <IconButton
              icon={asset.collected ? 'CollectSolid' : 'Collect'}
              label={asset.collected ? '取消收藏' : '收藏'}
              variant="secondary"
              size={36}
              data-collected={asset.collected || undefined}
              onClick={() => void attempt(() => setCollected([asset.id], !asset.collected))}
            />
          </>
        )
      }
    >
      {asset && <AssetInfo asset={asset} />}
    </MediaViewer>
  );
}
