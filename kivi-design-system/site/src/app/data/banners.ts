import { placeholderImageSrc } from '@kivi';

/*
  创作首页「最近更新」运营位：后台配置的 Banner，只读（不存本机）。图在 assets/banners/（11-20 用户给的）。
  点了做什么后台配三种（11-20 用户定）：
  - link：新标签页打开一个地址（比如飞书文档）
  - canvas：打开一块官方画布的预览（创作精选 / 工作流里的一条），「应用画布」，和探索页点卡片一样（11-20 用户定）
  - dialog：弹新功能公告（上图、标题、说明、分点、一个按钮，照 Dialog 的「新功能公告」）
*/

export type BannerAction =
  | { kind: 'link'; url: string }
  /** flowId：创作精选、工作流的 id（catalog.ts 的 flowsOf） */
  | { kind: 'canvas'; flowId: string }
  | {
      kind: 'dialog';
      title: string;
      description: string;
      /** 分点：加粗的名字 + 一句说明 */
      points: { name: string; text: string }[];
      /** 底部唯一的按钮 */
      button: string;
    };

export interface Banner {
  title: string;
  /** 图片地址（assets/banners/，4:3 原图，Banner 和公告顶图都是 16:9 裁切） */
  image: string;
  action: BannerAction;
}

const PLAYBOOK = 'https://micoworld.feishu.cn/wiki/ZVu7wHrQ1igYH1k5ePqcqCoDn6b';

export const BANNERS: Banner[] = [
  { title: 'KIVI Playbook', image: './banners/kivi-playbook.webp', action: { kind: 'link', url: PLAYBOOK } },
  // 网页：KIVI CLI 占位页（assets/kivi-cli.html），正式页面以后换地址
  { title: 'KIVI CLI', image: './banners/kivi-cli.webp', action: { kind: 'link', url: './kivi-cli.html' } },
  {
    title: 'Seedance 2.5 全新上线',
    image: './banners/seedance-2-5.webp',
    action: {
      kind: 'dialog',
      title: 'Seedance 2.5 全新上线',
      description: '画面更稳、动作更顺，支持更长的时长和原生音频。',
      points: [
        { name: '运动更自然', text: '高速镜头、复杂动作不再变形' },
        { name: '全能参考', text: '图片、视频、音频一起参考，一句话出片' },
        { name: '原生音频', text: '画面和声音一起生成，不用再单独配' },
      ],
      button: '立即体验',
    },
  },
  {
    title: 'GPT Image 2.6 全新上线',
    image: './banners/gpt-image-2-6.webp',
    action: {
      kind: 'dialog',
      title: 'GPT Image 2.6 全新上线',
      description: '排版和复杂指令理解更强，支持多图参考和 4K 输出。',
      points: [
        { name: '文字排版', text: '海报标题、多行文案都能准确排进画面' },
        { name: '多图参考', text: '最多 10 张参考图，加一句话就能改' },
        { name: '4K 输出', text: '细节更清楚，直接用在大尺寸物料' },
      ],
      button: '立即体验',
    },
  },
  // 第五张先占位（11-20 用户：别空着），用占位图，点了打开官方示例画布；正式图和去处以后换
  { title: '官方画布 · 短剧制作流程', image: placeholderImageSrc('ip-future', '16:9'), action: { kind: 'canvas', flowId: 'featured-1' } },
];
