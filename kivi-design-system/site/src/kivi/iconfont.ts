/*
  KIVI · 图标字体（11-05）
  网站图标用阿里 Iconfont 项目 KIVI_V2（projectId 5250779），和前端用同一份：
  <span class="iconfont-v2 icon-kivi-v2-Close"></span>。
  字体从 Figma「图标」页导出的单色 SVG 生成；Iconfont 里改了图标、重新「生成代码」后，CSS 地址会变，只改这里。
  彩色的（Logo）和没进字体的（Kiwi）照旧用 icons.ts 里的 SVG。
*/

/** Iconfont 生成的 CSS 地址，全站只写这一处 */
export const ICONFONT_CSS_URL = 'https://at.alicdn.com/t/c/font_5250779_ju3yq3cfupb.css';
/** 字体名（Iconfont 项目设置里的 FontFamily） */
export const ICONFONT_FAMILY = 'iconfont-v2';
/** 类名前缀（Iconfont 项目设置里的 FontClass 前缀） */
export const ICONFONT_PREFIX = 'icon-kivi-v2-';

/** 字体里有的图标（179 个，和 Iconfont 项目一致） */
export const ICONFONT_NAMES: ReadonlySet<string> = new Set(['AIEnhancement', 'AITools', 'Add', 'AddFile', 'AddFolder', 'AddSmall', 'AddToCanvas', 'Agent', 'Audio', 'Auto', 'AutoAspect', 'Brain', 'Brush', 'BrushSize', 'Bytedance', 'Calendar', 'Canvas', 'CheckSmall', 'Close', 'ClosePreview', 'CloseSmall', 'Collect', 'CollectSolid', 'Configuration', 'Connecting', 'Copy', 'CopyTraceID', 'Create', 'Crop', 'CropLeft', 'CropRight', 'Cutting', 'Delete', 'DisableConstraint', 'DisableSnap', 'Divide', 'DividingLine', 'Document', 'DoubleLeftArrowSmall', 'DoubleRightArrowSmall', 'DownArrow', 'DownArrowSmall', 'Download', 'DragSelect', 'EnableConstraint', 'Eraser', 'Expand', 'Explore', 'Feedback', 'File', 'FileCsv', 'FileDoc', 'FileJson', 'FileMusic', 'FilePdf', 'FilePpt', 'FileTxt', 'FileXls', 'FileZip', 'Files', 'FirstLastFrame', 'FitContent', 'Flux', 'Fold', 'Folder', 'FontSize', 'FullScreen', 'Gemini', 'Group', 'H1', 'H2', 'H3', 'HD', 'Hand', 'HappyHorse', 'HideConnections', 'History', 'Home', 'Image', 'ImageEditing', 'ImageGeneration', 'ImageToImage', 'ImageToText', 'Kling', 'LeftArrow', 'LeftArrowSmall', 'Lightbulb', 'Link', 'Loading', 'Localization', 'Locate', 'LoraModel', 'Manual', 'Map', 'Mdoel', 'Message', 'Minimax', 'More', 'MoveTo', 'Music', 'NewChat', 'NewWindow', 'NextStep', 'OmniReference', 'OneClickSameModel', 'Openai', 'OrderedList', 'OriginalProportions', 'Pack', 'Pause', 'Pin', 'Play', 'PlayLine', 'Preview', 'Previous', 'Qwen', 'ReUpload', 'Remove', 'RemoveEle', 'Rename', 'Reset', 'RightArrow', 'RightArrowSmall', 'Rmbg', 'ScanEye', 'Search', 'Send', 'Share', 'ShowConnections', 'Sidebar', 'Skill', 'SmartEditing', 'Snap', 'Sora', 'Square11', 'Square14', 'Square169', 'Square23', 'Square32', 'Square34', 'Square41', 'Square43', 'Square916', 'Square921', 'SquareLibrary', 'Stacking', 'StickyOnTop', 'Subtitle', 'Subtract', 'SubtractSmall', 'Switch', 'Template', 'Text', 'TextBold', 'TextEditing', 'TextItalic', 'ThumbsDown', 'ThumbsDownFill', 'ThumbsUp', 'ThumbsUpFill', 'Tool', 'UnGroup', 'UnOrderedList', 'UpArrowSmall', 'Upload', 'UseCanvas', 'Video', 'VideoEditing', 'VideoExtend', 'VideoGeneration', 'VideoLoop', 'Vidu', 'VolumeFull', 'VolumeHalf', 'VolumeLevel', 'VolumeOff', 'ZoomIn', 'ZoomOut', 'grok']);

/** 第一次用到图标时把 Iconfont 的 CSS 挂到页面上，只挂一次 */
let loaded = false;
export function ensureIconfont() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  if (document.querySelector(`link[href="${ICONFONT_CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = ICONFONT_CSS_URL;
  document.head.appendChild(link);
}
