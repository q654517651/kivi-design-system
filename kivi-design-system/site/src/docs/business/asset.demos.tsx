import { CoverGrid, CreateCard, FolderCard, ProjectCard, placeholderImageSrc, type PlaceholderImageName } from '@kivi';
import { Playground, type PlaygroundState } from '@shell';

const PICS: PlaceholderImageName[] = ['kivi-future', 'ip-gouache', 'kiwi-light', 'bunny-gouache'];
/** 前 n 张演示图 */
export const covers = (n: number) => PICS.slice(0, n).map((p) => placeholderImageSrc(p, '1:1'));

const COUNT: [string, string][] = [
  ['0', '没有'],
  ['1', '1 张'],
  ['2', '2 张'],
  ['3', '3 张'],
  ['4', '4 张'],
];

// ---------- CoverGrid ----------

type CoverState = { count: string };

export function CoverGridPlayground() {
  return (
    <Playground<CoverState>
      controls={[{ key: 'count', label: '图片', type: 'segment', value: '4', options: COUNT.slice(1) }]}
      render={(s) => <CoverGrid images={covers(Number(s.count))} style={{ width: 257, height: 157, borderRadius: 'var(--border-radius-8)' }} />}
    />
  );
}

// ---------- FolderCard ----------

type FolderState = { count: string; pinned: boolean; hover: boolean };

export function FolderCardPlayground() {
  return (
    <Playground<FolderState>
      controls={[
        { key: 'count', label: '封面', type: 'segment', value: '4', options: COUNT },
        { key: 'pinned', label: '置顶', type: 'toggle', value: false },
        { key: 'hover', label: '悬停', type: 'toggle', value: false },
      ]}
      render={(s, update: (patch: Partial<PlaygroundState>) => void) => (
        <FolderCard
          name="新春活动素材"
          count={Number(s.count) * 6}
          covers={covers(Number(s.count))}
          pinned={s.pinned}
          onPinnedChange={(v) => update({ pinned: v })}
          className={s.hover ? 'is-hover' : undefined}
          style={{ width: 320 }}
        />
      )}
    />
  );
}

// ---------- ProjectCard ----------

type ProjectState = { count: string; time: string; hover: boolean };

const AGO: Record<string, number> = { now: 0, min: 12 * 60_000, hour: 3 * 3_600_000, day: 9 * 86_400_000 };

export function ProjectCardPlayground() {
  return (
    <Playground<ProjectState>
      controls={[
        { key: 'count', label: '封面', type: 'segment', value: '3', options: COUNT },
        {
          key: 'time',
          label: '修改时间',
          type: 'segment',
          value: 'min',
          options: [
            ['now', '刚刚'],
            ['min', '分钟前'],
            ['hour', '小时前'],
            ['day', '更早'],
          ],
        },
        { key: 'hover', label: '悬停', type: 'toggle', value: false },
      ]}
      render={(s) => (
        <ProjectCard
          name="新春海报 · 主视觉"
          covers={covers(Number(s.count))}
          updatedAt={Date.now() - AGO[s.time]}
          className={s.hover ? 'is-hover' : undefined}
          style={{ width: 320 }}
        />
      )}
    />
  );
}

// ---------- CreateCard ----------

type CreateState = { label: string; hover: boolean };

export function CreateCardPlayground() {
  return (
    <Playground<CreateState>
      controls={[
        {
          key: 'label',
          label: '用在',
          type: 'segment',
          value: 'canvas',
          options: [
            ['canvas', '新建画布'],
            ['wide', '新建画布 · 没有画布'],
            ['project', '新建项目'],
            ['folder', '创建文件夹'],
          ],
        },
        { key: 'hover', label: '悬停', type: 'toggle', value: false },
      ]}
      render={(s) => {
        const hover = s.hover ? 'is-hover' : undefined;
        if (s.label === 'canvas' || s.label === 'wide')
          return (
            <div style={s.label === 'wide' ? { width: 640, height: 160 } : { width: 257, aspectRatio: '257 / 210' }}>
              <CreateCard variant="canvas" label="新建画布" className={hover} />
            </div>
          );
        return s.label === 'project' ? (
          <div style={{ width: 257, aspectRatio: '257 / 210' }}>
            <CreateCard label="新建项目" className={hover} />
          </div>
        ) : (
          <div style={{ width: 223, aspectRatio: '223 / 181' }}>
            <CreateCard label="创建文件夹" className={hover} />
          </div>
        );
      }}
    />
  );
}
