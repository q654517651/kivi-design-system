import { Button, GenPrompt, GenPromptRefs, IconButton, Tag } from '@kivi';
import type { Work } from '../../data/catalog';
import { setLiked, toggleFavorite, useFavorites, useLikes } from '../../data/favorites';
import { attempt } from '../../flows/errors';
import { downloadWork } from './work-actions';
import { CopyPrompt } from '../../parts/asset-info';
import { MediaViewer, ViewerAuthor, ViewerSection, useLastShown } from '../../parts/media-viewer';

/*
  发现作品的详情：全站共用的查看大图（media-viewer.tsx），照线上 CardDetailModal。
  头是作者和下载、收藏，内容是提示词和参数、参考图，最下面点赞。没有一键同款（11-09 用户定）。
  探索页「发现」和创作首页「发现」点作品都开它（11-20 用户定：首页点了直接看大图，照线上）。
*/

export function WorkViewer({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const shown = useLastShown(work);
  const collected = useFavorites();
  const liked = useLikes();
  const isCollected = !!shown && collected.includes(shown.id);
  const isLiked = !!shown && liked.includes(shown.id);

  return (
    <MediaViewer
      media={work && { type: work.video ? 'video' : 'image', src: work.src, poster: work.poster, alt: work.prompt }}
      onClose={onClose}
      head={shown && <ViewerAuthor name={shown.author.name} avatar={shown.author.avatar} date={shown.date} />}
      actions={
        shown && (
          <>
            <IconButton icon="Download" label="下载" variant="secondary" size={36} onClick={() => downloadWork(shown)} />
            <IconButton
              icon={isCollected ? 'CollectSolid' : 'Collect'}
              label={isCollected ? '取消收藏' : '收藏'}
              variant="secondary"
              size={36}
              data-collected={isCollected || undefined}
              onClick={() => void attempt(() => toggleFavorite(shown.id, !isCollected))}
            />
          </>
        )
      }
      footer={
        shown && (
          <Button size={36} variant="secondary" leftIcon={isLiked ? 'ThumbsUpFill' : 'ThumbsUp'} onClick={() => setLiked(shown.id, !isLiked)}>
            {shown.likes + (isLiked ? 1 : 0)}
          </Button>
        )
      }
    >
      {shown && (
        <>
          <ViewerSection title="提示词" action={<CopyPrompt text={shown.prompt} />}>
            <p className="tpl-viewer__prompt">{shown.prompt}</p>
          </ViewerSection>
          {/* 参考图跟在参数里（类型 → 模型 → 参考 → 比例），和创作页记录、资产的查看大图同一套（11-19 用户定统一） */}
          <ViewerSection title="参数">
            <GenPrompt>
              <Tag>{shown.video ? '视频生成' : '图片生成'}</Tag>
              <Tag>{shown.model}</Tag>
              {shown.refs.length > 0 && <GenPromptRefs label="参考图" items={shown.refs.map((r) => ({ type: r.type === 'video' || r.type === 'audio' ? r.type : 'image', src: r.src }))} />}
              <Tag>{shown.ratio}</Tag>
            </GenPrompt>
          </ViewerSection>
        </>
      )}
    </MediaViewer>
  );
}
