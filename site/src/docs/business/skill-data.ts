import type { SkillItem } from '@kivi';

/*
  技能面板的演示数据：线上的分类和技能是后端下发的，仓库里没有真实技能名，这里是示例。
  组件库（kivi/generation）不带任何技能，演示通过 items / categories 传进去。
*/

/** 分类：前面固定「推荐」，后面固定「我的」，面板自己加；这里只写中间的 */
export const SKILL_CATEGORIES = ['设计', '营销', '视频'];

/** 技能：示例数据。`recommended` 的出现在「推荐」页签 */
export const SKILL_ITEMS: SkillItem[] = [
  { id: 'poster', title: '海报设计', description: '按主题、尺寸和文案出一组海报，自动排版标题和信息层级', category: '设计', cover: 'kivi-future', recommended: true },
  { id: 'ecommerce', title: '电商主图', description: '商品白底图换场景，出 1:1 和 3:4 两套主图', category: '营销', cover: 'kiwi-light', recommended: true },
  { id: 'storyboard', title: '分镜脚本', description: '把一段故事拆成镜头，给每个镜头写画面、运镜和台词', category: '视频', cover: 'ip-gouache', recommended: true },
  { id: 'short-video', title: '短视频脚本', description: '15–60 秒口播和剧情脚本，带开头钩子和结尾引导', category: '视频', cover: 'ip-peek', recommended: true },
  { id: 'logo', title: 'Logo 设计', description: '从品牌名和行业出 6 个方向的标志草图', category: '设计', cover: 'monstera-dots' },
  { id: 'social', title: '社媒配图', description: '小红书、抖音封面，一次出多个比例', category: '营销', cover: 'bunny-gouache' },
  { id: 'ip', title: 'IP 形象延展', description: '上传一张角色图，延展表情包、三视图和动作', category: '设计', recommended: true },
  { id: 'my-brand', title: '品牌规范检查', description: '按我们的品牌色和字体检查设计稿', category: '设计', mine: true, public: true },
  { id: 'my-weekly', title: '周报配图', description: '每周数据图配一张头图', category: '营销', mine: true },
];
