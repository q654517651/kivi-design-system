# 图标 · 页面笔记

不进页面的待定和发现。页面在 `site/src/docs/foundations/icons.mdx`。

## 模型厂 Logo（10-31）

用户定：模型厂 Logo 一律用 LobeHub Icons（lobehub.com/icons）的厂商原始 Logo，不从网上别处找，不用 Hugeicons 这类图标库里仿的。规则写在图标页「模型厂 Logo」一节和 SKILL.md 审查清单。

拿 V2 的 11 个和 LobeHub Mono 版（`@lobehub/icons-static-svg` 1.101.0）并排比过，都是同一批，只是缩小了。发现两处待设计看：

- **Qwen 是旧版**：LobeHub 现在的 qwen 换成了新 Logo（三块折角），V2 里还是旧的立体六角星。（重下一批时已换成新版，待确认。）
- **大小不统一**：大部分长边 18–18.5（Openai、Gemini、Qwen、Kling、Minimax、Vidu、Bytedance），但 grok 几乎占满 24（23.75），Sora 只有 15，Flux 宽 20，HappyHorse 高 20。（已由下面的重下一批解决，待确认。）

### 10-31 重新下载、统一大小（待确认）

用户说重新下一批、统一缩进 24、视觉和其他图标一致。做法：

- 从 LobeHub（`@lobehub/icons-static-svg` 1.101.0）重下 11 个 Mono 版，Qwen 因此换成了新版 Logo。
- 大小不按外框，按外轮廓（凸包）面积：和直径 19 的圆一样大（V2、Hugeicons 的圆形图标外径约 20，实心的看着更重，所以小 1）；再按涂黑比例修一下，越实越小（系数 (0.6 / 涂黑比例)^0.2，Sora 因此从 19 缩到 18）；最长边不超过 20；按外框居中。
- 结果（宽 × 高）：Openai 20×19.8、Gemini 20×20、Qwen 18.9×19.2、grok 20×19.2、Kling 20×19.1、Minimax 20×16.7、Sora 18×18、Vidu 20×16.1、Flux 20×15.2、Bytedance 19.3×16.7、HappyHorse 17.5×20。
- 放在 Figma「_图标对照」模型 Logo 卡片的第三格，标「LobeHub 重下 · 待确认」。「图标」页的组件还是旧的，确认后再换。
- 图标页「模型厂 Logo」第 2 步已改成这个规则（看起来和圆形图标一样大、约直径 19 的圆、实的再小、最长边 20）。

## 节点图标的星星（10-31 定）

用户第三轮在对照页换了 4 个（都是 24 原大、线宽 1.5，已统一成 22 / 1.6）：ImageGeneration → ai-image-01；SmartEditing → ai-drawing；VideoGeneration、Skill 是用户自己拼的（video 框 + 播放 + 右下星，book-plus 把加号换成星），免费包里没有原样。

用户提的问题：节点图标（Text、ImageGeneration、VideoGeneration、Audio）原想都带星，但 ① Audio 没有框；② 星的位置不一（Text、Video 右下，Image、Audio 右上）；③ 一列全带星，星就没有区分作用。

用户定：
- 节点类型图标去掉星。Text、ImageGeneration、VideoGeneration 用 Hugeicons 同一个超椭圆框（2.5–21.5）：text-square、image-02、play-square。
- Audio 不加框，沿用 ai-speech，只去掉星（右边两根短，是原图给星留的位置，用户说保留）。
- 已换进对照页第三格，标「去星 · 名字」。
- 星星不是全去：只给「同一件事有普通版和 AI 版、会并排出现」的（SmartEditing 这类）。图标页「找不到图标怎么办」那句已改。
- 生成中点阵（GeneratingDots）用的也是这四个图形，用户说先不换，图标定好再说。

## 小号图标（10-31 定）

Hugeicons 免费包没有小号的箭头、加号、关闭、减号；成对的（plus-sign、cancel-02、minus-sign）都比 -01 大，不能当小号。对照页原来大小号用同一个图标。

用户定：小号用同一个图标，图形缩到 0.81，线宽不变（1.6），和 V2 的做法一样。做完和 V2 小号一样大：箭头 6.1 × 10.5（V2 6 × 10.6）、加号和减号 12（V2 12）、关闭 10.5（V2 10.6），都算上线宽。
涉及 7 个：LeftArrowSmall、RightArrowSmall、DownArrowSmall、UpArrowSmall、AddSmall、CloseSmall、SubtractSmall，对照页卡上标「小号 81%」。CheckSmall 只有一个尺寸，没缩；V1 才有的 LineSmall 也没动。

## 分割线（10-31 定）

DividingLine 原来配的 solid-line-01 只是一条横线，和 Subtract 几乎一样。用户定沿用 V2 的图形（中间实线，上下各三段虚线）：照 V2 的位置重画成描边，线宽从 1.5 改成 1.6、圆头，对照页卡上标「沿用 V2 · 线宽改 1.6」。

## V3 预览（10-31）

用户说对照页第三列基本定了，列为 V3，和 V2 并列，网站右上角能切换预览，最后二选一。用户又小修了 3 个（Agent：bubble-chat-add 把加号换成星；Expand：square-arrow-expand-01；Create：自己改的四角星），已统一成 22 / 1.6。

- 数据：`site/src/kivi/icons-v3.ts`（`ICONS_V3`，159 个）。是描边（线宽 1.6，Tool 里有一处 2.13 是原图的），不是轮廓；V2 的 `icons.ts` 没动。Kiwi、Logo 不在 V3 里，沿用 V2。
- 切换：`Icon` 读 `IconSetContext`（默认 v2），网站外壳 `Layout.tsx` 顶栏右上角「图标 V2 / V3」分段切换，记在浏览器 localStorage（`kivi-icon-set`），换页、刷新都保持。用法不变：`<Icon name="Close" />`。
- 生成中点阵（`generating/shapes.ts`）直接读 V2 的 `ICONS`，不跟切换走（用户说点阵等图标定了再换）。
- 怎么导出：Figma 脚本把对照页每张卡第三格克隆到一张临时大图（按图标表顺序每行 20 个、间距 40），用 download_assets 导成一个 SVG，本地按顺序拆开、减掉位置偏移、白色换成 currentColor，写成 `icons-v3.ts`，再删掉临时大图。脚本在 scratchpad（临时），要重导时照这个做。
- 定了以后：选 V3 就用 V3 换掉 `icons.ts`（字体打包要先转轮廓）、删 `icons-v3.ts` 和右上角切换；选 V2 就只删后两样。

## 不做 V3（11-02 定）

用户仔细比过以后定：不换 Hugeicons，图标继续用 V2。原因：工具类产品里超椭圆太多，显得不严肃。

- 网站：`icons-v3.ts`、`IconSetContext`、右上角切换都删了，`Icon` 回到只读 `icons.ts`。
- 删之前查过大小：V3 整体和 V2 一样大（中位只大 1%），是方框类大 11–22%（Hugeicons 方框画满 20 格，V2 方框 16–17），开口的反而小；所以看着「普遍大、线不够粗」。讨论过统一缩到 20 / 21，没做。
- Figma「_图标对照」页还在，留作记录。
- 图标页里 10-31 为 V3 改的那句（小四角星只给有普通版和 AI 版要区分的，节点类型不加）和「模型厂 Logo」第 2 步（直径 19 的圆）先不动，用户说后续再研究。重下的 11 个 LobeHub Logo 要不要换进 V2「图标」页也还没定。

## V3 恢复预览、缩到 21、自己画的对齐 Hugeicons 规格（11-02）

用户还想再比一下：恢复右上角 V2 / V3 切换；整套先缩小一档到 21；自己画的那批要和 Hugeicons 的横、竖、方、圆规格一致。另外下一步打算按规则把「不严肃」的图标换成同族里更简单的变体（少框、去装饰、隐喻直白），还没做。

- 缩放：对照页第三列 171 个（Hugeicons 147、自己画 23、分割线 1）全部从 22 缩到 21，线宽还是 1.6；小号也跟着缩（还是大号的 0.81）。模型 Logo（LobeHub 11 个）不缩，Kiwi、KIVI Logo 是 V2 实例没动。
- Hugeicons 的规格：量了 6,091 个图标里的外框（按线中心算，24 格、线宽 1.5）：
  - 圆：直径 20（2–22），最多。
  - 方：19（2.5–21.5）最多，其次 18。
  - 横：宽 20，高 14 / 16 / 17 / 18 常见；竖：高 20，宽 16 / 18 常见。
  - 圆角：Hugeicons 的超椭圆角（控制点 0.4714L、0.7071L，角中点内缩 0.1464L）。角伸进边的长度 L 多数正好是短边的一半（短边 ≥ 10 的框里 64%），也就是短边整条是弯的、长边中间才有直线；其余多是短边的 0.43–0.45。
  - 开口的角标（full-screen、scan 这类 L 形）整条臂都是弯的。框里的分隔线（aspect-ratio）拐角照它围出来的那块算。
  - 虚线框（square-dashed）：拐角是一段实线，边上实虚等分。
- 原来自己画的用的是 L = 短边 × 0.42，比 Hugeicons 方；方框类用了 18 方。按上面重画了 19 个：
  - 比例 12 个（含 Square231、Square321）：长边 20、1:1 是 19，L = 短边一半。
  - AutoAspect、OriginalProportions：框改成 19 方、L 9.5（和 1:1、text-square 一样）；角标整条臂弯；原始比例的分隔线拐角 L 4.75。
  - Divide、CropLeft、CropRight：整体改成 16 × 16（4–20，和 square-split-horizontal 一样大），每半边是 6.5 × 16 的框少一条边，L 3.25；虚线版两个弯角各一段实线，竖边中间一段 3、空 3.25，臂端留 0.5 的头。
  - VideoExtend：横框 20 × 16，L 改成 8。
  - VolumeLevel：两列宽 6.5、整体宽 16（4–20，和 menu-01 一样）。
  - 没动的 4 个是改自某个 Hugeicons 图标的，照原图标：VideoEditing（clapperboard，19 方、L 8）、CopyTraceID（copy-01）、Snap、DisableSnap（磁铁，19）。
- 对照页说明那两段文字已改成 21 和新规格。
- 网站：`icons-v3.ts` 照上次的做法重新导出（159 个，线宽都是 1.6），`IconSetContext` 和右上角切换照原样恢复，默认还是 V2。`npm run check` 通过，浏览器切到 V3 无报错。
- 脚本（临时，在 scratchpad）：量规格 `keyline/corners.py`，重画 `keyline/draw2.py`，导出拆分 `icon-r3/build-v3.py`。
- 分割线重画（11-02，用户说偏小）：原来照 V2 的大小画、又跟着缩到 21，线头还是平的，看上去宽 13.9，比旁边的 UnOrderedList、H1（15.6）窄。改成照 Hugeicons 线条图标（menu-01）的规格：24 格里宽 16（4–20），三行 6 / 12 / 18，中间实线，上下各三段虚线、每段 2（4–6、11–13、18–20），圆头，再缩到 21。现在和 UnOrderedList、H1 一样宽。对照页卡上改成「照 V2 图形重画 · 待确认」，格子名改成 `自己画/DividingLine`；网站 `icons-v3.ts` 同步改了这一条。
