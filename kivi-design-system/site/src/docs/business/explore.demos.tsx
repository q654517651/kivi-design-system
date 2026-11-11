import { ExploreCard, WorkCard, placeholderImageSrc } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';
import { VIDEO } from '../components/media.demos';

// ---------- WorkCard ----------

type WorkState = { type: string; ratio: string; liked: boolean; collected: boolean; hover: boolean };

export function WorkCardPlayground() {
  return (
    <Playground<WorkState>
      controls={[
        {
          key: 'type',
          label: '类型',
          type: 'segment',
          value: 'image',
          options: [
            ['image', '图片'],
            ['video', '视频'],
          ],
        },
        {
          key: 'ratio',
          label: '比例',
          type: 'segment',
          value: '3:4',
          options: [
            ['3:4', '3:4'],
            ['1:1', '1:1'],
            ['9:16', '9:16'],
            ['16:9', '16:9'],
          ],
        },
        { key: 'liked', label: '点赞了', type: 'toggle', value: false },
        { key: 'collected', label: '收藏了', type: 'toggle', value: false },
        { key: 'hover', label: '悬停', type: 'toggle', value: true },
      ]}
      render={(s, update: (patch: Partial<PlaygroundState>) => void) => {
        const ratio = s.ratio as '3:4' | '1:1' | '9:16' | '16:9';
        const video = s.type === 'video';
        return (
          <WorkCard
            type={video ? 'video' : 'image'}
            src={video ? (ratio === '9:16' || ratio === '3:4' ? VIDEO.tall : VIDEO.wide) : placeholderImageSrc('kivi-future', ratio)}
            poster={video ? placeholderImageSrc('kivi-future', ratio) : undefined}
            ratio={ratio}
            title="KIVI 极繁未来海报"
            author={{ name: '阿远', avatar: placeholderImageSrc('ip-peek', '1:1') }}
            likes={128 + (s.liked ? 1 : 0)}
            liked={s.liked}
            onLikedChange={(v) => update({ liked: v })}
            collected={s.collected}
            onCollectedChange={(v) => update({ collected: v })}
            className={s.hover ? 'is-hover' : undefined}
            style={{ width: 240 }}
          />
        );
      }}
    />
  );
}

// ---------- ExploreCard ----------

type ExploreState = { cover: string; description: boolean; showTime: boolean; author: boolean };

export function ExploreCardPlayground() {
  return (
    <Playground<ExploreState>
      controls={[
        {
          key: 'cover',
          label: '封面',
          type: 'segment',
          value: 'video',
          options: [
            ['image', '图片'],
            ['video', '视频'],
          ],
        },
        { key: 'description', label: '说明', type: 'toggle', value: false },
        { key: 'showTime', label: '剩余时间', type: 'toggle', value: true },
        { key: 'author', label: '作者', type: 'toggle', value: true },
      ]}
      rules={(st) => ({ showTime: st.cover !== 'video' })}
      render={(s) => (
        <ExploreCard
          name={s.description ? '海报设计' : '新品发布会物料全套'}
          description={s.description ? '按主题、尺寸和文案出一组海报，自动排版标题和信息层级' : undefined}
          cover={s.cover === 'video' ? './placeholders/video/clip-jellyfish.jpg' : placeholderImageSrc('kivi-future', '16:9')}
          video={s.cover === 'video' ? './placeholders/video/clip-jellyfish.mp4' : undefined}
          showTime={s.showTime}
          author={s.author ? { name: '阿远', avatar: placeholderImageSrc('ip-peek', '1:1') } : undefined}
          style={{ width: 300 }}
        />
      )}
    />
  );
}
