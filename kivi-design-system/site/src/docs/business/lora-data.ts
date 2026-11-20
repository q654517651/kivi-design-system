import { placeholderImageSrc, type LoraPickerItem, type PlaceholderImageName } from '@kivi';

// Lora 演示数据：参数和模型页的属性面板、演示站画布生成面板共用，只写这一份（11-19 从 generation.demos.tsx 挪出来）

export interface DemoLora extends LoraPickerItem {
  triggerWords: string;
  template: string;
}

const cover = (image: PlaceholderImageName) => placeholderImageSrc(image, '3:4');

/** 演示数据：8 个 Lora，只写这一份 */
export const LORAS: DemoLora[] = [
  {
    id: 'realistic-v2',
    name: '写实人像 V2',
    description: '真实肤质与自然光影，适合半身和特写人像。',
    cover: cover('kiwi-glass'),
    base: 'SDXL',
    isNew: true,
    collected: true,
    triggerWords: 'realistic portrait, soft light',
    template: 'a realistic portrait of {subject}, natural skin texture, soft window light, 85mm lens, shallow depth of field, highly detailed',
  },
  {
    id: 'guochao',
    name: '国潮插画',
    description: '红金配色与传统纹样，带一点现代海报感。',
    cover: cover('kivi-future'),
    base: 'FLUX',
    collected: true,
    triggerWords: 'guochao style, red and gold',
    template: 'guochao illustration of {subject}, traditional patterns, red and gold palette, flat shading, poster layout',
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    description: '雨夜街头的霓虹反光，冷暖对撞。',
    cover: cover('kiwi-light'),
    base: 'SDXL',
    triggerWords: 'cyberpunk neon, rainy street',
    template: 'cyberpunk neon scene of {subject}, wet asphalt reflections, magenta and cyan lights, cinematic',
  },
  {
    id: 'film-jp',
    name: '日系胶片',
    description: '低饱和、轻微颗粒，像随手拍下的一个下午。',
    cover: cover('bunny-gouache'),
    base: 'SD1.5',
    triggerWords: 'film photo, japanese snapshot',
    template: 'japanese film snapshot of {subject}, low saturation, light grain, overexposed highlights, casual framing',
  },
  {
    id: 'blind-box-3d',
    name: '3D 盲盒',
    description: '圆润的玩具质感，柔和的棚拍光。',
    cover: cover('monstera-dots'),
    base: 'FLUX',
    isNew: true,
    collected: true,
    triggerWords: '3d blind box, toy figure',
    template: '3d blind box figure of {subject}, glossy vinyl, rounded shapes, soft studio light, pastel background',
  },
  {
    id: 'watercolor',
    name: '水彩手绘',
    description: '纸面晕染与留白，边缘自然渗开。',
    cover: cover('ip-peek'),
    base: 'SD1.5',
    triggerWords: 'watercolor, hand painted',
    template: 'watercolor painting of {subject}, wet-on-wet blooms, visible paper texture, generous white space',
  },
  {
    id: 'product-white',
    name: '商品白底',
    description: '干净白底与柔和投影，电商主图直接可用。',
    cover: cover('ip-gouache'),
    base: 'SDXL',
    triggerWords: 'product shot, white background',
    template: 'product photo of {subject}, pure white background, soft contact shadow, even lighting, e-commerce',
  },
  {
    id: 'arch-sketch',
    name: '建筑速写',
    description: '钢笔线条加淡彩，几笔勾出空间结构。',
    cover: cover('ip-kiwi-pile'),
    base: 'FLUX',
    triggerWords: 'architectural sketch, pen and wash',
    template: 'architectural sketch of {subject}, loose pen lines, light color wash, perspective view',
  },
];

