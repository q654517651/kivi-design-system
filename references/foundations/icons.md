# 图标

KIVI 用一套线性图标。设计、产品、研发用的是同一套图标、同一个名字。要用图标，先在下面「图标表」里按意思找。

## 规格

- **框和图形**：组件框 24×24，图形缩到 22，居中，四边各留 1。
- **线宽**：1.5。
- **形态**：发布用的是转轮廓、合并后的版本；Figma 里另外留一份能改线宽的描边版。
- **名字**：英文大驼峰，按意思起，比如 `Close`、`OneClickSameModel`。Figma 组件名、iconfont 的 font_class、代码里 Icon 的 `name` 三处用同一个名字，区分大小写。
- **尺寸**：
  - 16：按钮、菜单、输入框里
  - 20：工具栏、面板标题、弹窗关闭
  - 24：大入口、竖向工具栏
  - 40 / 64：空状态、大入口插图位
- **颜色**：用文字颜色变量（primary、secondary、tertiary、disabled、on-brand、brand/solid、danger）。
- **不加背景和内边距**：要底色和点击区域，就放进 IconButton。
- **一个图标只表达一个意思**，不要拿来顶替别的意思。专用规则：
  - Agent（大号星星）只给 Agent 用；其他 AI 功能用「素材 + 小星星」类的图标。
  - FirstLastFrame（胶片）只给首尾帧用；「视频」用 Video。
  - 文本节点用 Text；字号设置用 FontSize。
  - 思考过程用 Lightbulb；工具调用用 Tool。

## 画法

新画的图标，不管是设计师画进 Figma，还是原型里临时画，都照下面这几条，和库里的图标放在一起才不突兀。

**Lucide 的规格**
- 在 24×24 的网格上画，四边至少留 1。
- 线端是圆头，转折是圆角；只描边，不填充。
- 矩形圆角：边长 8 以上用 2，小于 8 用 1。
- 分开的两个部分之间至少留 2。

**KIVI 的调整**
- 画好后等比缩到 22，再把线宽改回 1.5。

**从库里已有图标提炼的写法**
- **内容类**（文本、视频、图片）：一个圆角方框，里面放一个认得出的符号，比如 T、播放三角、山形。参考 Text、Video、ImageToText。
- **AI、生成类**：在主体的一角加一个小四角星，星和主体之间断开留缝。参考 ImageGeneration、VideoGeneration、AIEnhancement。大号四角星只给 Agent。
- **关闭、隐藏类**：在原图标上加一条斜线，斜线两边留缝。参考 DisableSnap、HideConnections。
- **多份、批量**：两层叠放，后面一层只露出一部分。参考 ImageToImage、OneClickSameModel。

## 设计：怎么加新图标

图标表里没有合适的，按下面的步骤加。不要拿意思相近的旧图标顶替。

1. **去 Lucide 找**：
   - 静态图标：https://lucide.dev/icons/
   - 动态图标：https://lucide-animated.com/
2. **下载**：按 24px、线宽 1.5 下载 SVG。
3. **缩放**：等比缩到 22，居中放进 24×24 的框，四边各留 1。缩完把线宽改回 1.5，不要跟着缩成 1.375。
4. **放进 Figma（KIVI UI KIT V2）**：
   - 描边版放进「_源文件 · 图标描边」页，留着以后改。
   - 转轮廓、合并后做成组件，放进「图标」页对应的分组，按上面的规则起名。
   - 组件描述照这个格式写：
     ```
     关键词：发送 提交 上箭头
     来源：lucide/arrow-up · 缩到 22/24 · 线宽 1.5，已转轮廓
     ```
   - 把它加进「Icon 统一组件」里「图标」属性的首选值，之后在 Icon 实例里才选得到。
5. **标「待确认」**：新加进 Figma 的图标，不管是谁加的，都先标「待确认」。设计师确认后才转为正式图标。
6. **补到这份文档的图标表里**：写名字、意思、对应的 Lucide 名字。

**Lucide 里找不到**：必须由设计师亲自画，按上面的「画法」来，描述里加一行「标记：自绘」。AI 不能代替设计师画图标放进 Figma。

## 研发：从哪取图标

- 从 iconfont 的「KIVI v2」图标库取，用图标表里的名字（font_class）。项目地址：发布前补上。
- 图标表里没有的，不要自己去网上找，也不要用意思相近的顶替。在交付里写「缺图标：××（用在哪）」，交给设计按上面的步骤加。

## 产品：原型里怎么画

HTML 原型引用不了代码里的 Icon 组件，用 Lucide 1.54.0 代替。库里大多数图标本来就是从 Lucide 来的，图形一致。

- 用法：`<i data-lucide="x"></i>`，线宽 1.5，做法见「原型做法」。
- 对应哪个 Lucide 名字，看图标表的「原型用 Lucide」一列。
  - 「≈」表示 KIVI 自己画的图标，用意思相近的 Lucide 顶替。
  - 「—」表示没有对应图形：比例图标用 CSS 画矩形；模型 Logo 用文字。
- **图标表和 Lucide 里都没有合适的**：原型里可以自己画（也可以让 AI 画）一个 SVG，照上面的「画法」，`viewBox="0 0 24 24"`、`stroke-width="1.5"`、`stroke="currentColor"`、`fill="none"`。在原型备注里写「临时图标：××」。临时图标只能留在原型里，要进 Figma 和代码，得交给设计师按上面的步骤做。

## 图标表

### 方向
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| LeftArrow | 左、返回、上一个 | chevron-left | |
| RightArrow | 右、下一个、进入 | chevron-right | |
| DownArrow | 下、展开 | chevron-down | |
| LeftArrowSmall | 小箭头、上一页 | chevron-left | 图形缩到 18/24 |
| RightArrowSmall | 小箭头、下一页 | chevron-right | 图形缩到 18/24 |
| DownArrowSmall | 下拉、展开 | chevron-down | 下拉选择的箭头 |
| UpArrowSmall | 收起 | chevron-up | 下拉展开时的箭头 |
| FullScreen | 全屏、放大 | expand | |
| Fold | 收起、退出全屏 | minimize-2 | |
| StickyOnTop | 置顶 | arrow-up-to-line | |
| Switch | 切换、交换 | arrow-left-right | |

### 基础操作
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Add | 添加、新建 | plus | |
| AddSmall | 小加号 | plus | 图形缩到 18/24 |
| Subtract | 减少 | minus | |
| SubtractSmall | 小减号、缩小 | minus | |
| Close | 关闭、取消 | x | 弹窗关闭用它 |
| CloseSmall | 移除、小叉 | x | 标签、输入框里的清除 |
| CheckSmall | 勾、选中、完成 | check | 菜单里标当前项 |
| More | 更多 | ellipsis | |
| Search | 搜索 | search | |
| Copy | 复制 | copy | |
| Delete | 删除 | trash | |
| Reset | 重置、刷新、重试 | rotate-cw | |
| Previous | 撤销、上一步 | undo-2 | |
| NextStep | 重做、下一步 | redo-2 | |
| Loading | 加载 | loader-circle | 1 秒一圈匀速旋转 |
| Link | 链接 | link-2 | |
| Pin | 固定 | pin | |
| Share | 分享、外部打开 | square-arrow-out-up-right | |
| Download | 下载、保存 | download | |
| Upload | 上传 | upload | |
| ReUpload | 重新上传、替换 | circle-arrow-up | 待确认 |
| Configuration | 设置、配置、参数 | sliders-horizontal | |

### 文件与资产
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| File | 文件、文档 | file-text | |
| Folder | 文件夹 | folder | |
| AddFile | 新建文件 | file-plus | |
| AddFolder | 新建文件夹 | folder-plus | |
| FileMusic | 音频文件 | file-music | |
| MoveTo | 移动到 | folder-input | |
| Remove | 移出 | log-out | 待确认 |
| Stacking | 堆叠、多选 | copy-check | |
| Template | 模板 | layout-panel-left | 待确认 |
| Pack | 打包、素材包 | box | |

### 生成与 AI
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Text | 文本节点 | ≈ text | KIVI 重绘；不要用于字号 |
| ImageGeneration | 图片生成 | ≈ image-plus | KIVI 重绘 |
| VideoGeneration | 视频生成 | ≈ clapperboard | KIVI 重绘 |
| Video | 视频 | ≈ square-play | KIVI 重绘 |
| Music | 音乐、音频 | music | |
| AIEnhancement | AI 增强 | ≈ wand-sparkles | KIVI 重绘 |
| ImageToImage | 图生图 | ≈ images | KIVI 重绘 |
| ImageToText | 图生文 | ≈ scan-text | KIVI 重绘 |
| OneClickSameModel | 一键同款 | ≈ copy-plus | KIVI 自绘：两张叠放的卡，前面一张带四角星 |
| SmartEditing | 智能编辑 | ≈ wand | KIVI 重绘 |
| LoraModel | LoRA 模型 | box | |
| Skill | 技能 | ≈ puzzle | KIVI 重绘 |
| Manual | 手册、说明 | ≈ book | KIVI 重绘 |
| Agent | Agent、智能体、助手 | sparkles | 大号星星只给 Agent |
| OmniReference | 全能参考、多模态参考 | atom | |
| FirstLastFrame | 首尾帧 | film | 胶片只给首尾帧 |

### 图片编辑
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Crop | 裁剪 | crop | |
| Expand | 扩图 | scan | 待确认 |
| HD | 高清、超分 | hd | |
| Rmbg | 抠图、去背景 | ≈ image-minus | 沿用旧图 |
| RemoveEle | 消除、去除 | bandage | |
| ImageEditing | 图片编辑 | square-pen | 待确认 |
| Brush | 画笔 | pencil | |
| BrushSize | 笔刷大小 | brush | 待确认 |
| Eraser | 橡皮擦 | eraser | |

### 视频剪辑
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Cutting | 剪切 | scissors | 连线删除按钮也用它 |
| Divide | 分割、拆分 | square-split-horizontal | 待确认 |
| CropLeft | 左侧裁剪 | ≈ panel-left-close | 沿用旧图 |
| CropRight | 右侧裁剪 | ≈ panel-right-close | 沿用旧图 |
| VideoEditing | 视频编辑 | ≈ video | 沿用旧图 |
| VideoLoop | 循环播放 | repeat | 待确认 |
| Connecting | 拼接、连接 | ≈ merge | 沿用旧图 |
| EnableConstraint | 关联、锁定 | link-2 | |
| DisableConstraint | 取消关联 | link-2-off | |

### 播放与音量
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Play | 播放（实心） | play，加填充 | 待确认 |
| Pause | 暂停（实心） | pause，加填充 | 待确认 |
| PlayLine | 播放（线框） | play | |
| VolumeFull | 音量大 | volume-2 | 待确认 |
| VolumeHalf | 音量中 | volume-1 | 待确认 |
| VolumeOff | 静音 | volume-x | 待确认 |
| VolumeLevel | 音量、音轨 | audio-lines | 待确认 |
| Preview | 预览、显示 | eye | |
| ClosePreview | 关闭预览、隐藏 | eye-off | |

### 画布与视图
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Map | 小地图 | map | |
| FitContent | 适应画布 | square-dot | |
| ZoomIn | 放大 | zoom-in | |
| ZoomOut | 缩小 | zoom-out | |
| Snap | 吸附 | magnet | |
| DisableSnap | 关闭吸附 | ≈ magnet | 沿用旧图 |
| ShowConnections | 显示连线 | route | |
| HideConnections | 隐藏连线 | route-off | |
| Group | 编组 | group | 待确认 |
| UnGroup | 取消编组 | ungroup | 待确认 |
| AddToCanvas | 添加到画布 | square-plus | 待确认 |
| Hand | 抓手、拖动 | hand | |
| UseCanvas | 使用画布 | square-mouse-pointer | |

### 文本格式
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| H1 / H2 / H3 | 标题 1 / 2 / 3 | heading-1 / heading-2 / heading-3 | |
| TextBold | 加粗 | bold | |
| TextItalic | 斜体 | italic | |
| FontSize | 字号设置 | type | 不要用于文本节点 |
| OrderedList | 有序列表 | list-ordered | |
| UnOrderedList | 无序列表 | list | |
| DividingLine | 分割线 | separator-horizontal | 待确认 |

### 比例
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| AutoAspect | 自动比例 | ≈ ratio | 沿用旧图 |
| Square11 | 1:1 | square | |
| Square43 / Square34 | 4:3 / 3:4 | — | 沿用旧图 |
| Square169 / Square916 | 16:9 / 9:16 | — | 沿用旧图 |
| Square23 / Square32 | 2:3 / 3:2 | — | 沿用旧图 |
| Square14 / Square41 | 1:4 / 4:1 | — | 沿用旧图 |
| Square921 | 9:21 | — | 沿用旧图 |
| OriginalProportions | 原始比例 | ≈ frame | 沿用旧图 |

### 对话与反馈
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| ThumbsUp / ThumbsUpFill | 点赞 / 已点赞 | thumbs-up（实心加填充） | 实心的待确认 |
| ThumbsDown / ThumbsDownFill | 点踩 / 已点踩 | thumbs-down（实心加填充） | 实心的待确认 |
| Collect / CollectSolid | 收藏 / 已收藏 | star（实心加填充） | 实心的待确认 |
| CopyTraceID | 复制 Trace ID | ≈ fingerprint | 沿用旧图 |
| Lightbulb | 思考过程 | lightbulb | 待确认 |
| Tool | 工具调用 | wrench | |
| Feedback | 反馈 | file-pen-line | 待确认 |

### 系统
| 名字 | 意思 | 原型用 Lucide | 备注 |
|---|---|---|---|
| Home | 首页 | house | |
| Document | 文档、教程 | book-open | |
| Localization | 语言 | earth | 待确认 |
| Calendar | 日历、日期 | calendar-days | |

### 模型 Logo

品牌 Logo，保持原样，不按 Lucide 重画。名字来自后端的模型配置，不要改名。原型里用 12–13 号的模型名文字代替。

`Auto`、`Gemini`、`Openai`、`Bytedance`、`Flux`、`Vidu`、`Qwen`、`Kling`、`Minimax`、`Sora`、`HappyHorse`、`grok`、`Mdoel`（拼错了，代码里在用，改名前要和后端确认）
