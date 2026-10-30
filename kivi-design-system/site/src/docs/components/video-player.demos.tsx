import { useEffect, useState } from 'react';
import { Dialog, NodeCard, NodeMedia, ResultTile, VideoPlayer, type VideoPlayerSize } from '@kivi';
import { Playground } from '@shell';
import './video-player.demos.css';

// 播放器页：属性面板、放进节点和生成结果、预览弹窗。参数表在 video-player.mdx

export const VIDEO = {
  wide: './placeholders/video/kivi-demo-16x9.mp4',
  tall: './placeholders/video/kivi-demo-9x16.mp4',
};

// 预览弹窗只有一个：小号点「预览」时，把视频和播到哪儿交给它，接着放
type PreviewTarget = { src: string; tall: boolean; time: number };
let showPreview: (t: PreviewTarget) => void = () => {};

export const openPreview = (src: string, time: number) => showPreview({ src, tall: src === VIDEO.tall, time });

export function PreviewHost() {
  const [target, setTarget] = useState<PreviewTarget | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    showPreview = (t) => {
      setTarget(t);
      setOpen(true);
    };
    return () => {
      showPreview = () => {};
    };
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen} size="xl" className="vp-preview" aria-label="预览">
      {open && target && (
        <div className={target.tall ? 'vp-preview__stage vp-preview__stage--tall' : 'vp-preview__stage'}>
          <VideoPlayer size="lg" src={target.src} startTime={target.time} />
        </div>
      )}
    </Dialog>
  );
}

type PlayerState = { size: VideoPlayerSize; state: string };

export function VideoPlayerPlayground() {
  return (
    <Playground<PlayerState>
      controls={[
        { key: 'size', label: '尺寸', type: 'segment', value: 'sm', options: [['sm', '小'], ['lg', '大']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['failed', '加载失败']] },
      ]}
      stageClassName="vp-stage"
      render={(s) => {
        // 加载失败：给一个不存在的地址
        // 比例由外面的格子定，和播放器无关，演示固定 16:9
        const src = s.state === 'failed' ? './placeholders/video/missing.mp4' : VIDEO.wide;
        return (
          <div className={`vp-frame vp-frame--${s.size} vp-frame--wide`}>
            <VideoPlayer key={`${s.size}-${s.state}`} size={s.size} src={src} onFullscreen={s.size === 'sm' ? (t) => openPreview(src, t) : undefined} />
          </div>
        );
      }}
    />
  );
}

/** 放进节点：NodeMedia 视频里就是小号 */
export function InNodeDemo() {
  return (
    <div className="vp-row">
      <NodeCard state="done" type="video" className="vp-node vp-node--wide">
        <NodeMedia type="video" src={VIDEO.wide} onPreview={(t) => openPreview(VIDEO.wide, t)} />
      </NodeCard>
      <NodeCard state="done" type="video" className="vp-node vp-node--tall">
        <NodeMedia type="video" src={VIDEO.tall} onPreview={(t) => openPreview(VIDEO.tall, t)} />
      </NodeCard>
    </div>
  );
}

/** 放进主站生成结果：ResultTile 视频里就是小号。右上是下载、更多、收藏（收藏放最后），左下快捷操作抬到控制行上面 */
export function InResultDemo() {
  return (
    <div className="vp-row">
      <ResultTile
        type="video"
        className="vp-tile"
        topActions={[
          { icon: 'Download', label: '下载' },
          { icon: 'More', label: '更多' },
        ]}
        collect
        quickActions={[
          { icon: 'VideoEditing', label: '视频编辑' },
          { icon: 'VideoExtend', label: '视频延长' },
          { icon: 'More', label: '更多工具' },
        ]}
        src={VIDEO.wide}
        onPreview={(t) => openPreview(VIDEO.wide, t)}
      />
    </div>
  );
}
