# 菜单和提示

状态：草稿 0.1.0。

## Tooltip

鼠标停留时出现的文字提示，移开就消失。

| 类型 | 尺寸 | 内容 |
|---|---|---|
| 简单 | 高 32，内边距上下 6、左右 12，圆角 8 | 一行 12 号常规字，primary；可以在后面带快捷键，如「撤销 ⌘Z」 |
| 说明 | 最宽 240，内边距 12，圆角 8，标题和说明间距 4 | 标题 13 粗 + 一段 12 号说明 |

- 底色 popup（#2C2D2E），不带小箭头、描边、阴影、模糊。
- 默认出现在目标下方 8px，延迟 500ms。
- 只有图标的按钮必须加 Tooltip；按钮上已经有文字的不用加。
- 和 Toast 的区别：Tooltip 是悬停时解释一个东西；操作结果（保存成功、生成失败）用 Toast。

## 菜单的零件

### MenuItem 菜单项

- 高 36，圆角 8，左右内边距 12，元素间距 8；图标 16，文字 13 常规。
- 宽度在菜单里设成「填满」。
- 左边放图标或缩略图，二选一。
- 右边放快捷键、子菜单箭头、勾选，三选一。
- 单选菜单（数量、比例）的当前项用「选中」状态：白 8% 底，不打勾。「勾选」只给需要打勾的多选场景。

| 类型 | 默认 | 悬停 | 禁用 |
|---|---|---|---|
| 普通 | 透明底，文字和图标 primary | 底 light-2-hover（白 8%） | 文字和图标 disabled |
| 危险 | 透明底，文字和图标 danger | 底 danger-subtle | 文字和图标 disabled |

危险菜单项（删除）放在菜单最后，用分割线和上面隔开。

### MenuLabel 分组标题

高 28，左右 12，12 号常规，tertiary。

### MenuDivider 分割线

1px 线，颜色 border-subtle，上下各留 4。

## 菜单模板

菜单是模板，不是组件：复制容器，往里放菜单项、分组标题、分割线，条目随便增删。具体某个菜单（画布右键、节点右键、模型选择、快捷添加节点、@素材）都用这个模板拼，不单独做组件。

容器：
- 底色 popup（#2C2D2E），圆角 12，不加描边和模糊。
- 内边距 4，条目之间不留空。
- 宽度 160–320，最高 360，超出就滚动。
- 不加投影。


常见拼法：
- 基础菜单：图标 + 文字。
- 右键菜单：文字 + 快捷键，不带图标。
- 分组标题 + 子菜单箭头。
- 单选：给当前项打勾。比例、数量、模型选择都是这种。
- 素材：左边是缩略图。

子菜单：
- 容器同上，贴着父菜单项弹出，位置错开，不要大面积重叠。
- 下拉选择展开的列表也是这个模板，宽度和触发器一样宽。

```css
.menu { padding: var(--spacing-xxs, 4px); border-radius: var(--border-radius-md, 12px);
  background: var(--color-bg-fill-popup, #2C2D2E);
  min-width: 160px; max-width: 320px; max-height: 360px; overflow-y: auto; }
.menu-item { height: 36px; padding: 0 var(--spacing-md, 12px); border-radius: var(--border-radius-sm, 8px);
  display: flex; align-items: center; gap: var(--spacing-sm, 8px); font-size: var(--font-size-13, 13px);
  color: var(--color-text-fill-primary, #fff); cursor: pointer; }
.menu-item:hover { background: var(--color-bg-fill-container-light-2-hover, rgba(255,255,255,.08)); }
.menu-item--danger { color: var(--color-status-danger, #FF4D4F); }
.menu-item--danger:hover { background: var(--color-status-danger-subtle, rgba(255,77,79,.12)); }
.menu-divider { height: 1px; margin: 4px 0; background: var(--color-border-subtle, rgba(255,255,255,.08)); }
```
