# 占位图

做原型、在 Figma 里搭设计稿时，用户作品的位置用这组图占位：生成结果、素材、节点里的图片、视频封面。Figma 统一用 PlaceholderImage 组件；原型用对应的图片文件。图在 `assets/placeholders/`，共 9 种风格、35 张，WebP，长边 1024。

## 怎么用

- 随便挑，不用对号入座。同一屏里别重复同一张。
- 按格子的比例挑文件。文件名最后一段是比例：`1x1`、`3x4`、`16x9`、`9x16`。没有正好的比例，就选最接近的，居中裁切。
- 只放在用户作品的位置。不拿来做界面底色、插图，也不代替空状态的 IP 插图，那些照「反馈」里写的做。
- 视频的位置也用这组图当封面。

## 清单

| 风格 | 文件名前缀 | 比例 | 画面 |
|---|---|---|---|
| 晶莹猕猴桃 | `kiwi-glass` | 1:1、3:4、9:16 | 3D 透光的猕猴桃叠放，奶油黄绿底，下方有小字 |
| KIVI 极繁未来 | `kivi-future` | 全部 | 荧光黄绿，猕猴桃切面加大字 KIVI |
| 光影线条 | `kiwi-light` | 全部 | 浮雕线条的猕猴桃切面，浅绿底，标题 Green Silence |
| 水粉兔 | `bunny-gouache` | 全部 | 黄绿水粉底，白兔奔跑，没有字 |
| 点阵龟背竹 | `monstera-dots` | 全部 | 深墨绿底，点阵叶子，竖排英文 |
| IP 探头 | `ip-peek` | 全部 | 黄绿和墨绿撞色，IP 扒着分界线探头 |
| IP 水粉 | `ip-gouache` | 全部 | 黄绿水粉底，IP 挥魔法棒，没有字 |
| IP 猕猴桃堆 | `ip-kiwi-pile` | 全部 | IP 坐在一堆猕猴桃上 |
| IP 极繁未来 | `ip-future` | 全部 | IP 举魔法棒，身后大字 KIVI |

「全部」指 1:1、3:4、16:9、9:16 四种。

## 在原型里

- 把用到的图复制到 HTML 旁边的 `img/` 目录，用相对路径引用。要交单个文件时，转成 base64 内联。
- 图片铺满格子，居中裁切：

```html
<img class="work-img" src="img/ip-gouache-1x1.webp" alt="">
```

```css
.work-img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--border-radius-sm); }
```

- 一组里比例不一致、统一成方格时，做模糊垫底：同一张图放两次，底下那张放大铺满，盖一层 glass 遮罩加背景模糊，上面那张完整显示。

```html
<div class="work-blur">
  <img class="work-blur__bg" src="img/ip-gouache-9x16.webp" alt="">
  <img class="work-blur__img" src="img/ip-gouache-9x16.webp" alt="">
</div>
```

```css
.work-blur { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: var(--border-radius-sm); }
.work-blur__bg { position: absolute; inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover; }
.work-blur::after { content: ""; position: absolute; inset: 0; background: var(--color-bg-fill-glass); backdrop-filter: blur(24px); }
.work-blur__img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: contain; }
```

## 在 Figma 里

- 统一拖入 **PlaceholderImage** 的实例：[组件位置](https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2?node-id=504-2114)。在组件库的「占位图」页。
- **先选图片**：右侧「图片」的首选列表只有 9 款，一款一个入口，不把 35 个图片与比例的组合摊开。
- **再选比例**：在暴露的「画面」属性里选「比例」，选和格子最接近的，裁得最少。比例只决定用哪张原图，不改外框形状。常用 1:1、3:4、16:9、9:16；晶莹猕猴桃目前只有 1:1、3:4、9:16。
- **拉满格子**：实例的大小跟着所在的格子走。在自动布局里，宽高都设 Fill；在普通容器里，约束上下左右都选 Stretch。画面跟着外框缩放，比例对不上时居中裁切，不会留白。
- 保持实例关联，不分离成普通图层，也不重新手贴图片填充。底层的 PlaceholderArtwork 是供首选列表调用的素材，不作为日常入口。
- 组件不自带圆角；放进业务组件后，由外层容器沿用自己的圆角并裁切。
- **最后选填充**，两种：
  - 铺满（默认）：画面盖满格子，比例对不上时居中裁切。单张图、同比例的一组都用它。
  - 模糊垫底：画面完整显示，空出来的地方垫同一张放大的原图，盖 glass 遮罩（70%）加背景模糊 24。一组里比例不一致、统一成方格时用它，比如生成记录里的「比例不一致」。
- 不要手动改原图的填充方式。改了会把那张图锁死，之后换图也不变。
- 新组件在源文件中标「待确认」；跨文件使用前，需先在 Figma 发布组件库并在目标文件启用。

## 补新图

- 用 KIVI 的 Nano Banana 2.1 出。
- 画面要求：铺满整张图，没有边框、白边，也不是海报样机；黄绿色调，主体占画面一大半。
- 图里不画 KIVI 的 logo，模型画不准。要写品牌名只写 KIVI。
- 文件名用「风格前缀-比例」，小写加连字符，存成 WebP，长边 1024。
