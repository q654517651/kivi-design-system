# 弹窗 Dialog

模态弹窗：确认、重命名、表单、列表、编辑器都用它。

代码里对应：`src/components/BaseModal`、antd Modal、HeroUI Modal（三种写法，迁移中；代码里现在的遮罩带 24 模糊、弹窗底色 #2B2D31，都要改成下面的规格）。状态：草稿 0.1.0。

## 尺寸

| 尺寸 | 宽度 | 用在哪 |
|---|---|---|
| S | 400 | 确认、重命名、简单输入 |
| M | 720 | 表单、上传、设置 |
| L | 1024 | 列表、市场、详情 |
| XL | 1200 | 编辑器 |
| 全屏 | 100vw | 素材详情 |

- 4 个尺寸只是宽度不同，结构一样。
- 高度跟着内容走，最高 80vh，超出时内容区滚动。
- 已有弹窗按就近原则归档，比如 500 → S，700 / 740 / 800 → M，898 / 1056 → L，1208 → XL。

## 结构

从上到下，竖排，内边距 24，区块间距 16：

1. **标题栏**：标题 16 粗 primary，右边是关闭按钮（IconButton 32 · 文字型，Close 图标 20）。
2. **描述**（可选）：一句话说明要做什么，或者操作的后果，14/22 secondary。
3. **内容区**（可选）：放表单、列表等，只有标题和描述的确认弹窗不要内容区。
4. **底栏**（可选）：
   - 按钮靠右，间距 8，上方额外留 8。
   - 用大号按钮（36）：取消用次要，确认用主要。
   - 删除这类不能撤销的操作，把主要换成危险。
   - 只有一个按钮时去掉次按钮。

## 样式

- 底色 surface（#191A1B），圆角 16。
- 不加描边，不加阴影。
- 遮罩：mask（黑 60%），不模糊。

## 行为

- 按 Esc 关闭。
- 点遮罩：只展示内容的弹窗可以关闭；有表单或有没保存的内容的，点遮罩不关闭。
- 二级弹窗在一级弹窗上面再叠一层遮罩，一级会被自动压暗。最多两级。
- 弹窗里的输入框用大号（36）。

```css
.dialog-mask { position: fixed; inset: 0; background: var(--color-bg-fill-mask, rgba(0,0,0,.6));
  display: flex; align-items: center; justify-content: center; }
.dialog { width: 400px; max-height: 80vh; display: flex; flex-direction: column; gap: var(--spacing-lg, 16px);
  padding: var(--spacing-xl, 24px); border-radius: var(--border-radius-lg, 16px);
  background: var(--color-bg-fill-surface, #191A1B); }
.dialog__title { font-size: var(--font-size-16, 16px); line-height: var(--font-line-height-24, 24px); font-weight: var(--font-weight-medium, 500); }
.dialog__desc { font-size: var(--font-size-14, 14px); line-height: var(--font-line-height-22, 22px); color: var(--color-text-fill-secondary, rgba(255,255,255,.6)); }
.dialog__footer { display: flex; justify-content: flex-end; gap: var(--spacing-sm, 8px); padding-top: var(--spacing-sm, 8px); }
```
