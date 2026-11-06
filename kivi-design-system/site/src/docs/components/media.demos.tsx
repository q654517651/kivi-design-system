import { useEffect, useState } from 'react';
import {
  AssetThumb,
  Dialog,
  VideoPlayer,
  type VideoPlayerVariant,
  Image,
  placeholderImageSrc,
  type ImageFit,
  type PlaceholderImageRatio,
  type AssetThumbSize,
  type AssetThumbType,
  type IconName,
} from '@kivi';
import { Playground } from '@shell';
import './media.demos.css';

// 图片和视频页：Image、VideoPlayer 的属性面板，播放器放进节点和生成结果、预览弹窗。参数表在 media.mdx

export const VIDEO = {
  wide: './placeholders/video/kivi-demo-16x9.mp4',
  tall: './placeholders/video/kivi-demo-9x16.mp4',
};

// 预览弹窗只有一个：卡片点「预览」时，把视频和播到哪儿交给它，接着放
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
    <Dialog open={open} onOpenChange={setOpen} size={1200} className="vp-preview" aria-label="预览">
      {open && target && (
        <div className={target.tall ? 'vp-preview__stage vp-preview__stage--tall' : 'vp-preview__stage'}>
          <VideoPlayer variant="preview" src={target.src} startTime={target.time} />
        </div>
      )}
    </Dialog>
  );
}

type PlayerState = { variant: VideoPlayerVariant; state: string };

export function VideoPlayerPlayground() {
  return (
    <Playground<PlayerState>
      controls={[
        { key: 'variant', label: '尺寸', type: 'segment', value: 'card', options: [['card', '小'], ['preview', '大']] },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['failed', '加载失败']] },
      ]}
      stageClassName="vp-stage"
      render={(s) => {
        // 加载失败：给一个不存在的地址
        // 比例由外面的格子定，和播放器无关，演示固定 16:9
        const src = s.state === 'failed' ? './placeholders/video/missing.mp4' : VIDEO.wide;
        return (
          <div className={`vp-frame vp-frame--${s.variant} vp-frame--wide`}>
            <VideoPlayer key={`${s.variant}-${s.state}`} variant={s.variant} src={src} onFullscreen={s.variant === 'card' ? (t) => openPreview(src, t) : undefined} />
          </div>
        );
      }}
    />
  );
}

// ---------- Image ----------

type ImageState = { status: string; ratio: PlaceholderImageRatio; fit: ImageFit; size: string; retry: boolean };

// 面板上的「状态」靠换地址来摆：加载中 = 还没有地址，已加载 = 占位图，失败 = 一个不存在的地址
const IMAGE_BROKEN = './placeholders/not-found.webp';

export function ImagePlayground() {
  return (
    <Playground<ImageState>
      controls={[
        { key: 'status', label: '状态', type: 'segment', value: 'loaded', options: [['loading', '加载中'], ['loaded', '已加载'], ['error', '失败']] },
        { key: 'ratio', label: '比例', type: 'segment', value: '1:1', options: [['1:1', '1:1'], ['3:4', '3:4'], ['16:9', '16:9'], ['9:16', '9:16']] },
        { key: 'fit', label: '填充', type: 'segment', value: 'cover', options: [['cover', '铺满'], ['contain', '完整显示']] },
        { key: 'size', label: '宽', type: 'segment', value: '256', options: [['96', '96'], ['256', '256']] },
        { key: 'retry', label: '可重试', type: 'toggle', value: false },
      ]}
      // 只有失败才有重试
      rules={(s) => (s.status === 'error' ? {} : { retry: true })}
      render={(s) => (
        <Image
          src={s.status === 'loading' ? undefined : s.status === 'error' ? IMAGE_BROKEN : placeholderImageSrc('ip-gouache', s.ratio)}
          alt="示例图片"
          ratio={s.ratio}
          fit={s.fit}
          onRetry={s.retry ? () => {} : undefined}
          style={{ width: Number(s.size) }}
        />
      )}
    />
  );
}

// ---------- AssetThumb ----------

const THUMB = './placeholders/kivi-future-1x1.webp';

type ThumbState = { type: string; size: string; icon: string };

function renderThumb(s: ThumbState) {
  const size = Number(s.size) as AssetThumbSize;
  const type = s.type as AssetThumbType;
  if (type === 'image') return <AssetThumb size={size} type="image" src={THUMB} />;
  return <AssetThumb size={size} type="icon" icon={s.icon as IconName} />;
}

export function AssetThumbPlayground() {
  return (
    <Playground<ThumbState>
      controls={[
        { key: 'type', label: '类型', type: 'segment', value: 'image', options: [['image', '图片'], ['icon', '图标']] },
        { key: 'size', label: '尺寸', type: 'segment', value: '56', options: [['16', '16'], ['24', '24'], ['56', '56'], ['72', '72']] },
        { key: 'icon', label: '图标', type: 'segment', value: 'Message', options: [['Message', 'Message'], ['Canvas', 'Canvas'], ['Music', 'Music']] },
      ]}
      // 图标只有「图标」类型可换
      rules={(s) => (s.type === 'icon' ? {} : { icon: true })}
      render={renderThumb}
    />
  );
}
