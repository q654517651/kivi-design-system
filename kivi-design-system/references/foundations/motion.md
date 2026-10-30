# 动效

动效只用来交代「东西从哪来、到哪去、变成了什么」，不做装饰。2026-10-29 定的草稿。变量在 Figma「变量」页的「动效」分区，scale 集合里的 `motion/`。

先看「怎么动」选缓动，再看「动多远」选时长。

## 缓动：按怎么动选

| 怎么动 | 缓动 | CSS |
|---|---|---|
| 在屏幕内移动、变大变小、展开收起、换颜色 | 先加速后减速（ease-in-out） | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 进入：从屏幕外移进来，或从无到有（出现、淡入） | 减速（ease-out） | `cubic-bezier(0, 0, 0.2, 1)` |
| 退出：移出屏幕，或在屏幕内消失（淡出） | 加速（ease-in） | `cubic-bezier(0.4, 0, 1, 1)` |
| 循环：转圈、骨架屏扫光 | 匀速（linear） | `linear` |

- 不用 CSS 默认的 `ease`，它不属于上面任何一种。
- 同一个东西出现和消失分开写：出现用 ease-out，消失用 ease-in。

## 时长：按动多远选

| 时长 | 用在哪 |
|---|---|
| 100ms | 只换颜色：悬停、按下的底色和文字颜色 |
| 150ms | 小东西出现、消失：Tooltip、删除按钮、角标、开关滑块 |
| 200ms | 移动 100px 以内；菜单、下拉列表、Toast 出现 |
| 300ms | 移动 100–400px：参考区展开收起、面板展开收起、弹窗出现 |
| 400ms | 移动 400px 以上，或整屏：侧栏、抽屉滑进滑出 |

- 消失比出现短一档：菜单出现 200ms，消失 150ms。
- 最长 400ms，再长就拖了。
- 几样东西依次出现时，每个错开 20–30ms，整体不超过 400ms。
- 悬停触发的展开，鼠标离开后等 150ms 再收起，免得划过时来回闪。
- 系统开了「减少动态效果」（`prefers-reduced-motion`）时，去掉位移和缩放，只留透明度，或者直接切换。

## 常见场景

| 场景 | 出现 | 消失 |
|---|---|---|
| 按钮、菜单项悬停 | 底色 100ms ease-in-out | 同左 |
| Tooltip | 延迟 500ms，再 150ms ease-out 淡入 | 100ms ease-in 淡出 |
| 菜单、下拉列表 | 200ms ease-out 淡入 | 150ms ease-in 淡出 |
| Toast | 200ms ease-out，从上方移入 | 150ms ease-in 淡出 |
| 模态弹窗 | 遮罩和弹窗一起 300ms ease-out 淡入，弹窗从 96% 放大到 100% | 200ms ease-in 淡出 |
| 开关 | 滑块 150ms ease-in-out | 同左 |
| 主站输入框参考区 | 展开、收起 300ms ease-in-out；盖字的底色 150ms ease-out 出现 | 等卡片收完，底色再 150ms ease-in 消失 |

## CSS 变量

Figma 里是 `motion/duration/100` 这样的名字，按「`/` 换成 `-`、前面加 `--`」得到 CSS 变量名。Figma 的时长只存数字，代码里带上 ms。这些变量在「变量」最后的 CSS 变量块里也有。

```css
:root {
  /* 时长 */
  --motion-duration-100: 100ms;
  --motion-duration-150: 150ms;
  --motion-duration-200: 200ms;
  --motion-duration-300: 300ms;
  --motion-duration-400: 400ms;
  /* 缓动 */
  --motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-100: 0ms;
    --motion-duration-150: 0ms;
    --motion-duration-200: 0ms;
    --motion-duration-300: 0ms;
    --motion-duration-400: 0ms;
  }
}
```

写法：出现和消失的缓动不同时，把消失的写在默认状态上，出现的写在出现后的状态上。

```css
.menu { opacity: 0; transition: opacity var(--motion-duration-150) var(--motion-ease-in); }
.menu.is-open { opacity: 1; transition: opacity var(--motion-duration-200) var(--motion-ease-out); }
```
