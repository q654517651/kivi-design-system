import { PLACEHOLDER_IMAGES, PlaceholderImage, type PlaceholderImageFill, type PlaceholderImageName, type PlaceholderImageRatio } from '@kivi';
import { Playground } from '@shell';

// 占位图页的属性面板：图片、比例、填充都在面板里切。参数表在 placeholder-images.mdx
// 9 款的名字、能选的比例都读 kivi 的 PLACEHOLDER_IMAGES，这里不再写一份

const RATIOS: PlaceholderImageRatio[] = ['1:1', '3:4', '16:9', '9:16'];

type PlaceholderImageState = { image: PlaceholderImageName; ratio: PlaceholderImageRatio; fill: PlaceholderImageFill };

/** 外层容器定大小、定圆角并裁切；组件自己不带圆角 */
function renderPlaceholderImage(s: PlaceholderImageState) {
  return (
    <div style={{ width: 256, height: 256, borderRadius: 'var(--border-radius-8)', overflow: 'hidden' }}>
      <PlaceholderImage image={s.image} ratio={s.ratio} fill={s.fill} />
    </div>
  );
}

export function PlaceholderImagePlayground() {
  return (
    <Playground<PlaceholderImageState>
      controls={[
        { key: 'image', label: '图片', type: 'segment', value: 'kiwi-glass', options: PLACEHOLDER_IMAGES.map((i): [string, string] => [i.id, i.name]) },
        { key: 'ratio', label: '比例', type: 'segment', value: '1:1', options: RATIOS.map((r): [string, string] => [r, r]) },
        { key: 'fill', label: '填充', type: 'segment', value: 'cover', options: [['cover', '铺满'], ['blur', '模糊垫底']] },
      ]}
      // 这一款没有的比例选不了
      rules={(s) => ({ ratio: RATIOS.filter((r) => !PLACEHOLDER_IMAGES.find((i) => i.id === s.image)?.ratios.includes(r)) })}
      render={renderPlaceholderImage}
    />
  );
}
