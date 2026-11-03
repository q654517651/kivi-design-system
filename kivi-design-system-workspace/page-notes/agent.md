# Agent 页 · 搬出来的内容

从 `src/docs/business/agent.mdx` 精简时搬出（2026-10-29），原文照搬，没改字。页面只留演示和「参数」表。属性表整张搬过来，新的参数表在页面最下面。

## 页头原来的说明

lead：Agent 对话里的业务组件：过程行 ProcessRow、用户消息 UserMessage、生成结果叠放 MediaStack、追问面板 QuestionPanel、确认卡片 ActionCard、发送按钮 SendButton、文件卡 FileCard。

## 不是组件的部分

顶栏、整段对话、输入框都是模板，在「模板 · 画布 Agent」页的「侧栏 Agent」。生成中和完成的节点直接用画布页的 NodeCard，不在这一页。

- **助手回复**没有气泡，直接用正文字号（14 / 22，primary）。
- **建议操作**：Button 中 · 次要。**消息操作**：IconButton 32 · 文字。都在模板里拼，不单独做组件。
- **引用画布内容**走右键「发送到对话」，进到输入框的引用条，不做选中即引用。
- 面板外框、内边距和输入框取同一个值，<Tag kind="draft">待定</Tag> 输入框圆角。

## ProcessRow

在右边面板选层级、状态、展开，和 Figma 右侧属性面板一样。进行中的动作文字带扫光。

### 用途

Agent 过程行：一行显示思考、调工具、询问、生成。类型不靠属性，靠图标和文字区分：

| 类型 | 图标 | 文字 |
|---|---|---|
| 思考 | 关掉图标，打开头像 | 「Agent 思考中」。只在 Agent 内部思考、还没返回内容的空档出现 |
| 工具 | `UseCanvas` / `Skill` | 「创建节点 活动标题」。连续调用折叠成「调用了多个工具」，打开箭头 |
| 询问 | `Message` | 「询问中 / 已询问」。展开后看问题和回答 |
| 生成 | `ImageGeneration` | 「图片生成中 / 图片已生成 × 5」 |
| 汇总 | 关掉图标 | 「已完成」 |

<Tag kind="draft">待梳理</Tag> 工具调用的状态用词（询问中 / 已询问、使用中 / 已使用等）还没统一，先照 Figma 现在的写，之后统一梳理。

### 结构

一行，水平排列，间距 4，垂直居中：图标（可选）+ 头像（可选）+ 动作文字 + 对象文字（可选）+ 箭头（可选）。

- 动作文字是主体，对象文字是它作用的东西，比如「创建节点」+「活动标题」，颜色比动作淡一档。
- 一级可以带头像和箭头。子项（展开后列表里的行）没有头像和箭头，也不能点。
- 展开后的列表和一级用同样 20 的图标，不缩进（参考 Codex）。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 动作 | 文字，默认「创建节点」 | `action="创建节点"` |
| 对象 | 文字，默认「活动标题」；显示对象 开 / 关 | `object="活动标题"`，不显示就不传 |
| 层级 | 一级 / 子项 | `level="main"` / `"sub"`，一级是默认 |
| 状态 | 进行中 / 完成 / 失败 | `status="running"` / `"done"` / `"failed"`，完成是默认 |
| 展开 | 否 / 是 | `expanded`（受控）或 `defaultExpanded` + `onExpandedChange`；只有带箭头的一级才有，这时整行渲染成 `<button>` |
| 显示图标 | 开 / 关，默认开 | 传不传 `icon` |
| 显示头像 | 开 / 关，默认关 | 传不传 `avatar="./placeholders/ip-peek-1x1.webp"`（Avatar 24 · 图片） |
| 显示箭头 | 开 / 关，默认开 | `arrow={false}` 关掉 |
| 图标 | 图标库里的图标，常用 `UseCanvas`、`Skill`、`Message`、`ImageGeneration` | `icon="UseCanvas"` |

Figma 的箭头是 `DownArrowSmall`（收起）和 `UpArrowSmall`（展开）两个图标，代码里只放 `DownArrowSmall`，展开时旋转 180°。

### 样子

| 部分 | 规格 |
|---|---|
| 行高 | 20，各部分间距 4 · `--spacing-xxs` |
| 文字 | 14 / 20 常规 · `--font-size-14`、`--font-line-height-20` |
| 图标 | 20 |
| 头像 | 24，圆形 |
| 箭头 | 16，tertiary |

| 状态 | 图标 | 动作文字 | 对象文字 |
|---|---|---|---|
| 进行中 | secondary | secondary，停留超过 0.5 秒走一道 primary 亮光，从左往右（11-02 用户定：进行中不变白，只有悬停才亮；原来是 primary 字 + primary / placeholder 交替扫光） | tertiary |
| 完成 | secondary | secondary | tertiary |
| 失败 | status/danger | status/danger | tertiary |

- 扫光时长 <Tag kind="draft">待定</Tag>：Figma 只画了渐变，没定时长。代码暂用和骨架屏一样的 1.4 秒匀速（`linear`），系统开了「减少动态效果」时不动。
- 箭头展开收起 150ms ease-in-out，见[动效](/foundations/motion)。
- 悬停、按下 Figma 没画，不写。

#### 展开列表

「模板里拼，不是组件」，只给一个 `kv-process-list` 方便复制。行距 6，最大高 160，右侧出 4 宽的细滚动条（`text/fill/disabled`）。超出 160 时加 `kv-process-list--fade`，底部 24 渐隐盖住最后一行；渐隐的终点是底色，放在别的底色上改 `--kv-fade-bg`。

### 用法

- **调工具**：直接显示过程行，跟着滚动。连续调工具折叠成「调用了多个工具」，只显示最新一条，工具返回的内容不折叠。
- **询问、生成确认**：答完后消息里留一行「已询问」，展开看问题和回答。
- **生成**：生成中、完成的节点直接用画布页的 NodeCard。收起后的一组用 MediaStack。

#### 思考中：打开头像，关掉图标

<Demo code={`
<ProcessRow status="running" avatar="./placeholders/ip-peek-1x1.webp" action="Agent 思考中" arrow={false} />
`} />

#### 询问：展开后看问题和回答

<Demo code={`
<div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 428, maxWidth: '100%' }}>
  <ProcessRow icon="Message" action="已询问" defaultExpanded />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ color: 'var(--color-text-fill-secondary)', fontSize: 'var(--font-size-14)', lineHeight: 'var(--font-line-height-20)' }}>
      是否生成新节点「可爱修狗 11-边牧 v2」？
    </div>
    <div style={{ color: 'var(--color-text-fill-tertiary)', fontSize: 'var(--font-size-12)', lineHeight: 'var(--font-line-height-16)' }}>
      批准生成
    </div>
  </div>
</div>
`} />

#### 生成、汇总

<Demo code={`
<>
  <ProcessRow icon="ImageGeneration" action="图片已生成 × 5" />
  <ProcessRow action="已完成" arrow={false} />
</>
`} />

## UserMessage

### 用途

用户消息：气泡靠右，宽度跟文字走，超出换行。可以带素材。

### 结构

垂直排列，间距 8，整体靠右：素材行（可选）+ 气泡。

- 素材行是一排 ReferenceItem 56，间距 8。图片、带时长的视频、音频都放这里。
- 组件宽 428，放进模板里拉满。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 文字 | 气泡里的字，默认「帮我生成 10 个小狗的图片」 | `children` |
| 素材 | 无 / 有 | 有就传 `assets`，里面是 ReferenceItem（56，缩略图用 AssetThumb 56） |

### 样子

| 部分 | 规格 |
|---|---|
| 气泡底色 | container-light-1（白 8%） |
| 气泡圆角 | 12 · `--border-radius-md` |
| 气泡内边距 | 12 / 16 · `--spacing-md`、`--spacing-lg` |
| 气泡文字 | 14 / 22 常规，primary；最宽 340，超出换行 |
| 素材和气泡的间距 | 8 · `--spacing-sm` |

文字太长时，气泡最宽 340，其余换行。

### 用法

- 用户发的消息都用它。带图片、视频、音频时用「素材 = 有」。

## MediaStack

### 用途

生成结果叠放：一组生成完成后收起时用。点开后展开成 NodeCard 网格：面板 460 宽排 2 列，加宽后 3 列。

### 结构

三层叠放：最上面是第一张图，后面两层只是示意叠放，往右下各错开 4。右下角盖一个数量角标。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 画面 | 第一张图（图片填充） | `src="./placeholders/kivi-future-1x1.webp"` |
| 数量 | 文字，如 +4 | `count="+4"`，渲染成 Tag · 浮层 |

没有变体。展开收起由页面决定，组件只管收起的样子：`expanded` 只是把状态写进 `aria-expanded`。组件整个是一个 `<button>`，要自己写 `aria-label`，比如「展开 5 个结果」。

### 样子

| 部分 | 规格 |
|---|---|
| 每一层 | 174，圆角 16 · `--border-radius-lg` |
| 整体 | 182（174 + 错开 8） |
| 后两层 | 底 container-light-2（白 4%），描边 border（白 12%）1；分别往右下错开 4、8 |
| 数量角标 | Tag 覆盖，右下角，离边 8 |

### 用法

- 一次生成多张，全部完成后收起成一叠，放在「图片已生成 × 5」这行下面。
- 生成中、没完成的节点不用它，直接用画布页的 NodeCard。

## QuestionPanel

Agent 需要用户回应时，停在输入框位置的面板：QuestionPanel（追问，选项用 QuestionOption）、ActionCard（生成确认；授权和出错放在消息里）。外框和输入框一致。

### 用途

追问面板：Agent 追问时停在输入框的位置，替换掉输入框。答完后消息里留一行 ProcessRow「已询问」。

### 结构

垂直排列，间距 12：题目栏 + 选项 + 底部操作。

- 题目栏：题目（14 粗）+ 分页（多道题时显示「1/5」，左右切换）。
- 选项：`QuestionOption`，单选时只有一项选中，多选可以选多项。选项间距 4。
- 「其他」一项可以直接输入。
- 底部：忽略（Button 中 · 文字）+ 确认提交（Button 中 · 主要），靠右，间距 8。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 题目 | 文字，默认「1. 你喜欢小猫吗？（2 个选项）」 | `title="…"` |
| 显示分页 | 开 / 关，默认开 | 传不传 `pager` |
| 分页 | 文字，默认「1/5」 | `pager="1/5"`，两边是 IconButton 28 · 文字（`LeftArrowSmall`、`RightArrowSmall`），点了触发 `onPrev`、`onNext` |
| 选项 | 一组 QuestionOption | `children`，写 `value`；编号不写会按顺序补 1、2、3 |
| 单选 / 多选 | 单选是默认 | `multiple` 打开多选 |
| 选中 | 选了哪些 | `value`（受控）或 `defaultValue` + `onChange`，值是选项 `value` 组成的数组，单选最多一项 |
| 显示其他输入 | 开 / 关，默认开 | 放不放 `type="other"` 的那一项 |
| 显示忽略 | 开 / 关，默认开 | `skip={false}` 关掉；点了触发 `onSkip` |
| 确认提交 | 点了提交答案 | `onSubmit` |

### 样子

| 部分 | 规格 |
|---|---|
| 外框 | 底 surface，描边 border-subtle 1，圆角 16 · `--border-radius-lg`，内边距 16 · `--spacing-lg` |
| 题目 | 14 / 22 粗，primary |
| 分页文字 | 13 / 20 常规，secondary；和两个按钮的间距 4 |

- 外框和输入框取同一个值：surface 底、border-subtle 描边、圆角 16、内边距 16。<Tag kind="draft">待定</Tag> 输入框圆角。

### 用法

- Agent 追问时用，停在输入框位置，替换掉输入框。
- 单选的题，点一项就选中它、取消另一项；多选的题可以选多项。
- 「忽略」是跳过这道题，「确认提交」是提交答案。
- 「其他」里输入文字时，要不要取消别的选项 <Tag kind="draft">待定</Tag>：Figma 没画，组件里两边互不影响，输入框的值用 `inputProps` 自己接。

## QuestionOption

### 用途

QuestionPanel 里的一个选项。<Tag kind="off">不发布</Tag> 不单独用。

### 结构

水平排列，间距 8，垂直居中：编号框 + 文字。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 编号 | 文字，默认「1」 | `index={1}`，放进 QuestionPanel 里可以不写 |
| 文字 | 选项上的字 | `children`；「其他」没有文字，是输入框 |
| 类型 | 选项 / 其他 | `type="option"` / `"other"`，选项是默认；「其他」的占位文字用 `placeholder` |
| 状态 | 默认 / 悬停 / 选中 | 悬停由鼠标触发；选中 `checked`，放进 QuestionPanel 里由它管，渲染成 `aria-checked="true"`，单选的 `role="radio"`，多选的 `role="checkbox"` |

「其他」只有默认。文字直接改。

### 样子

| 部分 | 规格 |
|---|---|
| 整体 | 高 36，圆角 8 · `--border-radius-sm`，左右内边距 8 · `--spacing-sm`，14 / 22 |
| 编号框 | 20，圆角 6 · `--border-radius-xs`，底 container-light-1，描边 border 1，12 / 16 |

| 状态 | 底色 | 文字 | 编号框 |
|---|---|---|---|
| 默认 | 透明 | secondary | 描边 border，编号 secondary |
| 悬停 | container-light-2-hover（白 8%） | primary | 同默认 |
| 选中 | container-light-1（白 8%） | primary | 描边 border-strong（白 50%），编号 primary |
| 其他 | 透明 | 占位文字 placeholder（白 30%） | 同默认 |

状态变化 100ms ease-in-out，见[动效](/foundations/motion)。

### 用法

- 只放在 QuestionPanel 里。

## ActionCard

### 用途

确认卡片，三种：生成确认（停在输入框的位置）、授权和出错（在消息里）。

### 结构

垂直排列，间距 12：文字（标题 + 说明，间距 4）+ 操作（靠右，间距 8）。出错只有一行说明。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 类型 | 生成确认 / 授权 / 出错 | `type="confirm"` / `"auth"` / `"error"`，生成确认是默认；生成确认、授权样子一样，出错没有标题和操作 |
| 标题、说明 | 直接改文字 | `title`、`description`；说明里可点的一段用 `<button className="kv-action-card__link">` |
| 显示次按钮 | 开 / 关，默认开 | `actions` 里放不放「取消」；只有生成确认有 |
| 按钮文字 | 改按钮里的文字 | `actions` 里放 Button 中，次要「取消」、主要「确认生成」/「去授权」 |

### 样子

| 类型 | 外框 | 内容 |
|---|---|---|
| 生成确认 | 底 surface，描边 border-subtle 1，圆角 16，内边距 16 | 标题 14 / 22 粗 primary；说明 13 / 20 tertiary；取消（次要）+ 确认生成（主要） |
| 授权 | 同生成确认 | 标题 + 说明 + 去授权（主要） |
| 出错 | 描边 border（白 12%）1，圆角 16，不填底，内边距 12 / 16 | 只有一行说明：13 / 20 secondary |

- 生成确认的说明里「点击查看节点参数」带下划线，颜色同说明。
- 确认生成按钮上的猕猴桃消耗数 <Tag kind="draft">待定</Tag>：Figma 里还没补，等猕猴桃图标定了再加。

### 用法

- **生成确认**：停在输入框的位置，答完后消息里留一行 ProcessRow「已询问」。
- **授权**：读取飞书文档这类需要用户授权时，放在消息里。
- **出错**：服务异常时放在消息里，说明本次是否消耗积分。

## SendButton

### 用途

Agent 输入框的发送按钮。两种 Agent 输入框（侧栏、主站创作）都用它；生成面板的「生成」仍用 Button 大 · 主要。

### 结构

36 的圆形，中间一个图标：发送箭头，生成中换成停止方块。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 状态 | 默认（可发送）/ 禁用（还没输入内容）/ 生成中（点了停止生成） | 禁用 `disabled`；生成中 `generating`，图标换成停止方块 |

只有图标，读屏靠 `aria-label`：默认「发送」，生成中「停止生成」，想改就自己传。

### 样子

| 状态 | 底色 | 图标 |
|---|---|---|
| 默认 | 品牌渐变（gradient-1 → gradient-2，从左到右） | `Send` 20，on-brand（黑） |
| 禁用 | container-light-1（白 8%） | `Send`，disabled（白 20%） |
| 生成中 | 品牌渐变 | 停止方块 12 × 12，圆角 4 · `--border-radius-xxs`，on-brand |

- 悬停、按下 <Tag kind="draft">待定</Tag>：Figma 只画了默认、禁用、生成中。

### 用法

- 放在输入框工具条的最右边，和左边的工具按钮（IconButton 32）并排。
- 没输入内容时用禁用；发出去后到回复完之前用生成中，点一下停止生成。

## FileCard

### 用途

Agent 写出来的文件，比如剧本、分镜说明、字幕、配音。出现在回复里，点开预览或下载。主站和画布 Agent 都用。

### 结构

水平排列，间距 12，垂直居中：图标块 + 信息 + 操作（悬停才出，音频的播放常显）。

### 属性

| 属性 | 选项 | 代码 |
|---|---|---|
| 类型 | 文档（md、txt）/ 字幕（srt）/ 音频（mp3 等） | `type="doc"` / `"subtitle"` / `"audio"`，文档是默认；图标：`File` / `Subtitle` / `FileMusic`；文档、字幕的操作是预览（`onPreview`）、下载（`onDownload`），音频是播放（`onPlay`）、下载 |
| 状态 | 默认 / 悬停 / 生成中 | 悬停由鼠标触发；生成中 `generating` |
| 文件名、信息 | 直接改文字 | `name`、`meta` |

操作按钮是 IconButton 28 · 弱。悬停才出的按钮（预览、下载）在 CSS 里加了 `kv-file-card__action--reveal`，音频的播放不加。

### 样子

| 部分 | 规格 |
|---|---|
| 整体 | 宽 360（放进消息里可以拉满），高 64，底 container-light-1，圆角 12 · `--border-radius-md`，内边距 12 |
| 图标块 | 40，圆角 8 · `--border-radius-sm`，底 container-light-1，图标 20 primary |
| 文件名 | 14 / 22 粗，primary，一行，超出省略 |
| 信息 | 12 / 16 常规，tertiary：创建时间 / 条数 / 时长 |

| 状态 | 样子 |
|---|---|
| 默认 | 文档、字幕只有信息；音频右边常显播放 |
| 悬停 | 底色 container-light-1-hover（白 12%），右边出操作：文档、字幕是预览 + 下载，音频是播放 + 下载 |
| 生成中 | 信息写「正在撰写…」，右边是 Loading 小（16，转圈） |

底色变化 100ms ease-in-out，操作出现 150ms ease-out，见[动效](/foundations/motion)。

### 用法

- Agent 回复里提到写出了文件时，放在回复下面。
- 点卡片预览，点右边按钮下载或播放。

## 示例：侧栏 Agent

照「模板 · 画布 Agent」页拼的，只做演示。画布右侧的 Agent 面板：顶栏 + 消息流 + 输入框，面板宽度 <Tag kind="draft">待定</Tag>（3.13 稿 460，加宽后 634）。消息流里每项间距 16。追问、生成确认出现时替换掉输入框。

输入框本身是模板里拼的：surface 底、border-subtle 描边、圆角 16、内边距 16，上面是输入区，下面是工具条。

## 旧名对照

旧稿（KIVI 3.5 · Agent 页、3.13 · 聊天画布同步）里的画面元素，对应到这页的组件或模板。

| 旧 | 新 | 类型 | 说明 |
|---|---|---|---|
| 3.5「消息气泡」（用户） | UserMessage | 新增 | 素材行用 ReferenceItem |
| 3.5「Agent 思考中」（头像 + 文字） | ProcessRow · 打开「显示头像」 | 新增 | 只在 Agent 内部思考的空档出现 |
| 3.13「创建节点 / 调用了多个工具 / 正在更新…」 | ProcessRow · 工具 | 新增 | 连续调用折叠，只显示最新一条 |
| 3.13「询问中 / 已询问」 | ProcessRow · 询问 | 新增 | 展开后看问题和回答 |
| 3.13「图片生成中 / 已生成 × 5 / 待确认后生成 × 5」 | ProcessRow · 生成 + NodeCard / MediaStack | 新增 | 节点状态和画布一致 |
| 3.13「询问」卡片（分页、编号选项） | QuestionPanel + QuestionOption | 新增 | 3.5 的分段式追问卡片不再用 |
| 3.13「生成授权」「飞书授权」「异常失败」 | ActionCard · 生成确认 / 授权 / 出错 | 新增 | — |
| 顶部「会话标题 ▾ + 新建 + 收起」 | 模板「侧栏 Agent」里的顶栏 | 改成模板 | 没有状态、只出现一次，不做组件 |
| 3.5「节点创建（6）」标签列表 | ProcessRow · 子项 | 替换 | 3.13 稿已改成过程行 |


## 删掉的演示和矩阵

- 状态矩阵：`ProcessRowMatrix`（层级 × 状态 × 展开）、`QuestionOptionMatrix`（选项 / 其他 × 默认 / 悬停 / 选中）、`SendButtonMatrix`、`FileCardMatrix`。属性面板里都能切到。
- 演示：用户消息长文字（noCode）、MediaStack、追问 3 个选项、ActionCard 生成确认 / 授权 / 出错、FileCard 文档 / 字幕 / 音频叠放。都是属性面板里能切出来的样子。
- ProcessRow 用法里的「思考中」「询问：展开后看问题和回答」「生成、汇总」三个演示：原文在上面 ProcessRow 的「用法」里。询问的展开样子在页面最上面的「对话：生成图片」里还看得到。

## 追问面板补的状态（10-29）

- 结构不改，Figma V2 是「停在输入框位置、每题翻页」。只补规范内的状态：一项都没选、「其他」也没填字时「确认提交」不可点；「忽略」「确认提交」文字可传；单选方向键切换、组内一个 Tab 停点；`disabled`（提交中）；提交后面板消失、消息里留一行「已询问」（Figma 描述如此）。
- 不做：产品里的多题同屏、「全部由 AI 决策」。Figma 没有。

## 主站 Agent 和画布 Agent 统一、工具调用一行滚动（11-02 用户定）

- 两个 Agent 走同一套对话组件：用户消息、Agent 文字、工具调用组、追问、确认卡、消息操作都一样。只有「产出」不同：
  - 主站 Agent 以直接生成为主：触发生成后，结果直接跟在回复下面，4 张大图（ResultTile），点一张全屏看。
  - 画布 Agent 以操作画布为主：结果放在画布节点里，聊天里同步一份进度和结果的缩略图（MediaStack），不是主要的；点一下画布定位到对应节点。
- 规范站是 UI 库，组件直接拼，不为研发额外抽「主站 / 画布」的配置；以后研发可能共建，暂时不考虑。
- 不做整体折叠：原来做完后一次性折叠，Agent 工作时间长，最后折叠会大幅跳动。现在 Agent 调工具之间的文字回复都留着。
- 工具调用组 `ProcessGroup`（交互照 Codex、Claude，Figma 还没有）：
  - 两段话之间连续调的工具算一组，进行中只占一行，显示当前在调的工具；换下一个时往上滚（新的从下面进来 ease-out、旧的往上出去 ease-in，各 200ms）。
  - 停在一个工具超过 0.5 秒才扫光（ProcessRow 本身也这样，`data-sweep`），快的一闪而过。
  - 每个工具最少停 0.3 秒，这期间又来了新的直接跳到最新那个，不排队（我提的，用户说「基本对」）。
  - 全部做完换成「调用了 N 个工具」，不主动展开；做完才能手动展开，箭头只在鼠标移上去、键盘聚焦、展开时出现，手机一直显示。
  - 只调 1 个：做完直接显示那一个，不能展开。有失败：「调用了 N 个工具，M 个失败」，「M 个失败」危险色，展开后失败那行标红。
  - 生成、询问、确认不进组，各自出自己的块（结果图、问题面板、确认卡），之后的工具另起一组。
  - 汇总行图标默认 `Tool`，Figma 没定。
- 网站：Agent 页加了「示例：主站 Agent」（4 张大图，点了用 Dialog `full` 全屏看）、画布侧栏示例里的「调用了多个工具」换成 ProcessGroup；ProcessGroup 有属性面板和一个「一行滚动」播放示例；原来的「展开列表」示例删了（ProcessGroup 自己会展开）。
- Figma 待补：ProcessGroup（进行中一行、做完汇总、展开）；ProcessRow 箭头悬停才出的状态。
- 还没定：业务组件要不要拆成「生成 / 对话 / 画布 / 主站」四页加「页面模板」一组（11-02 我提的，用户还没回）；两边输入框是否都用 PromptBox。
- 11-02 用户补：展开要有往下推的动效，不能直接蹦（列表高度从 0 推开、淡入，ease-in-out，按距离 200 / 300ms）；「调用了 N 个工具」这类能点的行，悬停亮一档（secondary → primary，对象、箭头也各亮一档）。

## 线上 Agent 的工具清点（11-02，只读查了前后端代码）

- 前端 `agent/ai-design-web`（main 10-15；未合并分支 `origin/feat/3.13-content-sync` 10-28）：聊天在 `packages/ai-chat`，只挂在画布页。没有工具表：每行直接显示后端给的 `display_name`；图标只有两种（节点操作 UseCanvas，其余都是 Skill）；没有逐行的进行中 / 完成 / 失败。连续工具合成一组，做完自动收成「调用了多个工具」。3.13 分支开始做一行滚动（0.5 秒扫光）、生成确认的「询问中 / 已询问 / 询问」、生成结果卡「图片生成中 x N」。
- 后端 `agent/KIVI-business-ai/bussiness-ai`（09-18；origin/test 10-28）：只有画布 Agent，前后端都还没有主站 Agent。工具定义在 `internal/service/business_kivi/agent/`，显示名在 `stream_event_message.go`。HEAD 注册了 26 个，新分支再加会话记录、保存技能、搜索知识库、音频生成、动作复刻、对口型（后三个还没有显示名）。
- 生成会重复出现：同一次生图在 3.13 分支上最多出 4 样东西：工具行「图片生成节点「X」」、确认记录「询问中 / 已询问」、结果卡「图片生成中 x N」、回合结束的「节点创建（N）」标签。用户说的画布「图片生成」同步就是结果卡（workflow_card）。
- askUser 的结果：回答了（answered，单题可跳过）、全部交给 AI 决策（skipped_all）、用户直接发新消息（被取消，no_result）。没有超时状态。
- 待定（我的建议，用户还没回）：工具按「进工具组 / 单独一块 / 不显示」三种显示；生成类不出工具行，只出结果块；去掉回合结束的「节点创建（N）」；询问做三种状态、能收起。

## 询问记录 AskRecord（11-02，用户说询问也要能收起）

- 新组件 `AskRecord`：一行「询问中 / 已询问 / 询问」，下面收起的是问答。默认收起，悬停出箭头，点开往下推（和工具调用组共用 `ProcessDrawer`）。不进工具调用组，自己单独一行。
- 三种状态照用户说的：询问中（等用户回答，扫光）；已询问（回答了，展开有回答）；询问（跳过了，字不带「已」，展开最后写「已跳过」，点了「全部交给 AI 决策」的写「交给 AI 决策」）。后端 askUser 也正好是这三种结果（answered / skipped_all / 被新消息取消）。
- 生成确认也用它：问题「是否生成新节点「X」？」，回答「批准生成 / 取消生成」。
- 网站：画布侧栏示例里那块手拼的「已询问」换成 AskRecord；追问示例里提交留「已询问」、忽略留「询问」；加了 AskRecord 属性面板和参数表。
- Figma 待补：AskRecord 三种状态、收起和展开。

## Agent 输入框底部按钮去底（11-02 用户定）

- 输入框底部那排按钮（添加、模型、技能等）从 IconButton 次要（带底）改成文字（平时无底，悬停才出底），间距 8 → 4。和主站输入框、画布生成面板的工具条一致；发送按钮是工具条里唯一实心的。
- Figma「Agent」页的输入框如果画的是带底按钮，要跟着改。

## 技能卡 SkillCard，FileCard 跟它对齐（11-02 用户定）

- 技能卡和文件卡不是一个东西。技能卡照旧版 KIVI 3.14「消息气泡」里的技能卡（node 13656:57419）补了 `SkillCard`：封面 100 × 56 + 技能名 + 一行说明，右下「编辑」「使用技能」。后端新版本有 `skill_card` 消息（保存技能后出，分新建 / 更新），和它对应。
- 跟旧稿不一样的地方（对齐 V2）：外框用确认卡的 surface + border-subtle（旧稿白 4% 底），上下间距 12（旧稿 16），封面和文字间距 12（旧稿 6），封面圆角 8（旧稿 5.25 是缩放留下的零头），说明 13 tertiary（旧稿 13 白 50%），按钮 Button 中 32（旧稿 36）。用户没设封面时用技能专用的占位封面：从旧稿技能卡导出的那张（深绿底、两团模糊光斑加 KIVI Logo，node 13656:57461，4 倍图 399 × 224），放在 `assets/skill-card/default-cover.png`，组件里是 `SKILL_DEFAULT_COVER`（11-02 用户说要用 Figma 里那张，不要自己拼）。
- FileCard 还是废弃，但外框、字号改成和技能卡一样：内边距 16，圆角 16，surface 底加描边，信息 13 / 20（原来 12 / 16），去掉悬停换底色（悬停仍然出操作）。
- Figma 待补：SkillCard；FileCard 的新外框。
- 加号：V3 里大加号、小加号都有，只是 V3 大加号用的 Hugeicons `add-01`（14），比 V2 显小；建议换 `plus-sign`（16），减号一起换 `minus-sign`，小号照旧缩 0.81。还没定。

## 每个工具怎么显示、用什么图标（11-02 整理，建议稿，待用户定）

原则：工具组里的行按「做的事」共用图标；生成类不出行，结果块按产出的媒体类型用 4 个图标；不给每个工具单独画图标。下面用到的图标 V2、V3 都有。

| 工具（后端名） | 显示名 | 怎么显示 | 图标 |
|---|---|---|---|
| inputNode、deleteNode、createEdge、deleteEdge（还有不带生成的创建 / 更新节点） | 创建 / 删除节点、节点连线、删除连线 | 工具组一行 | UseCanvas（共用） |
| get_workflow_schema、get_workflow_nodes、understand_url_content、understand_workflow_node_content | 查看画布、查看节点信息、查看链接内容、查看节点内容 | 工具组一行 | Preview（共用） |
| search_knowledge（新分支） | 搜索知识库 | 工具组一行 | Search |
| skill | 加载技能 | 工具组一行 | Skill |
| write_todos | 更新待办清单 | 先当工具组一行；以后要不要做待办清单另说 | OrderedList |
| lark_cli | 执行飞书命令 | 工具组一行 | Tool（汇总行也用 Tool） |
| askUser | 询问用户 | 询问记录 AskRecord（单独一行）+ 问题面板 | Message |
| imageGenerationNode、videoGenerationNode、textGenerationNode、audioGenerationNode（新）、executeNode | 图片 / 视频 / 文本 / 音频生成节点、执行节点 | 不出行，只出结果块 | 按产出：ImageGeneration / VideoGeneration / Text / Audio |
| imageRemoveBgNode、imageEnhanceNode、imageCuttingNode、videoSeamlessLoopNode、videoEnhanceNode、videoStitchNode、motionControlNode（新）、lipSyncNode（新） | 抠图、图片高清、裁切、视频循环、视频高清、视频拼接、动作复刻、对口型 | 不出行，只出结果块（标题写工具名） | 按产出：图片 ImageGeneration / 视频 VideoGeneration |
| save_skill（新分支） | 保存技能 | 不出行，出技能卡 SkillCard | 卡片封面 |
| read_skill_file、read_lark_cli_skill、load_memory、remember、list_session_turns、read_session_history、用户置顶技能的模拟调用、被取消补上的结果 | — | 不显示 | — |
| 回合结束的 done.artifacts（「节点创建（N）」） | — | 去掉，和结果块重复 | — |

不是工具、但对话里要有的：思考（Lightbulb）、生成确认（Message，记录用 AskRecord，面板用 ActionCard 确认）、飞书授权（ActionCard 授权）、出错（ActionCard 出错）。

没有图标的：按上面的分法没有。若结果块标题要按工具配图标，视频拼接、动作复刻、对口型三个 V2 没有合适的。后端缺显示名的：audioGenerationNode、motionControlNode、lipSyncNode（研发补）。

还缺的组件 / 状态：
- 生成结果组（画布）：标题「图片生成中 × N」+ 缩略图，每张有待确认后生成、准备中、生成中（点阵 + 秒数）、已生成、失败、已取消；点了定位节点。现在只有 ProcessRow + MediaStack 拼的。
- 主站结果格 ResultTile：缺「待确认后生成」「已取消」两种。
- 思考记录：思考中（扫光）/ 思考完成（收起，能展开看内容），和 AskRecord 同一个写法。
- 授权卡 ActionCard 授权：缺做完后的状态（授权成功 / 授权失败 / 已跳过）。
- 技能卡 SkillCard：后端分新建 / 更新，卡上要不要区分，没定。
- 待办清单：write_todos，先不做。

## 工具图标预览页（11-02，用户要看效果）

- 网站「试验 · Agent 工具图标」（`src/docs/lab/agent-tools.*`）：整体效果（一行滚动 + 做完展开）、分组（进工具组 4 组 + 不出行 4 种）、画布操作对比（共用 / 按动作分）、查看对比（眼睛 / 放大镜 / 按东西分）。定了搬进 Agent 页、删掉这页。
- 用户 11-02 提：眼睛只表示可见 / 不可见，不是「查看」，没有 AI 看的感觉 → 查看类建议换放大镜 Search（像 Codex 把读、搜合成「探索」），搜索知识库并进「查看」一组。
- 画布操作不分图标（建议）：行里文字已经写了做了什么；列表里出垃圾桶像能点的删除按钮。
- write_todos：后端 deep agent 没关（eino 默认带），模型可能会调；前端没做清单。产品不用 → 放「不显示」，也可以让后端关掉（`WithoutWriteTodos`）。新分支的 submitPlan、list_tools 也放不显示。
- 「执行lark-cli」显示名建议改「执行飞书命令」（研发改后端显示名）。

## 工具图标定稿（11-02 用户定）

| 组 | 工具 | 图标 |
|---|---|---|
| 改画布 | 输入节点、节点连线、删除节点、删除节点连线 | UseCanvas（共用，动作靠文字区分） |
| 查看 | 查看画布、查看画布节点信息、查看节点内容、查看链接内容（链接是图片 / 视频 / 音频地址，后端交给 Gemini 理解） | ScanEye（新加；用户比过 FileView，文档外形像读文字，不用） |
| 知识库 | 搜索知识库 | SquareLibrary（新加；方框里两本竖书一本斜书。Hugeicons Library、LibraryBig 细节多，不用） |
| 记忆 | 写入长期记忆（显示「更新记忆」） | Brain（新加；V2 Lucide brain，V3 Hugeicons Brain03） |
| 技能 | 加载技能 | Skill |
| 外部工具 | 执行飞书命令 | Tool（不用飞书 Logo：品牌不能改成线条，实心又和线条图标不搭，用户定算了） |
| 汇总行 | 调用了 N 个工具 | Tool |

- 规则：做的事不同才换图标，对象不同不换。眼睛 Preview 只表示显示 / 隐藏，不用在工具上。
- 查看画布用 Canvas、查看节点用 VectorSquare 试过，用户觉得不好，查看类都统一成 ScanEye（11-02）。
- 以上图标 11-02 用户全部确认。
- 写入长期记忆（11-02 改）：之前归到不显示是错的，后端只在用户明确说「记住」时调（v2 也能改、删记忆）。用户定放进工具组，和别的工具一样一行「更新记忆」+ Brain，不显示记住了什么。
- 其余不显示的理由：读取技能详情、加载 lark-cli 技能是读说明书，真正做事的那行已经有了；加载长期记忆是后台准备；查看 / 读取会话记录是翻本会话被压缩掉的记录（保存技能前用），结果是技能卡。
- 新加的图标只在试验页临时挂着（`src/docs/lab/lab-icons.ts`）：ScanEye、SquareLibrary、Brain。V2 照 Lucide（scan-eye、square-library、brain，线宽 1.5），V3 照 Hugeicons（ScanEye、SquareLibrary、Brain03，缩 21、线宽 1.6）。
- 待做：Figma「图标」页补这几个（V2）、「_图标对照」第三列补 V3，重新导出后删掉 lab-icons.ts，再搬进 Agent 页。
- 研发：「理解素材」行后面跟素材名，不显示网址；lark-cli 显示名改「执行飞书命令」。
- 过程行的对象文字不加「」（11-02 用户定）：对象已经比动作淡一档，颜色就分开了。连线写「活动文案 → 主视觉」，箭头两边空格。句子里提到节点名（Agent 回复、询问的问题）照常用「」。网站 Agent 页、试验页的示例和 ProcessRow / ProcessGroup 的注释、参数表都改了；Figma「Agent」页的过程行示例如果带「」要跟改。前端 3.13 分支的工具行本来就不带「」，只有确认问题「是否生成新节点「X」？」是句子，照旧。

- 进行中不变白（11-02 用户定）：过程行进行中和完成一样是 secondary，只有能点的行悬停才亮一档；停留超过 0.5 秒动作文字上走一道 primary 亮光。Figma「Agent」页 ProcessRow 进行中如果画的是白字，要跟改。

## 工具图标转正、页面模板（11-02）

- 试验页转正为「业务组件 · Agent 工具」（`docs/business/agent-tools.mdx`）：一行滚动、分组、对照表（后端名 / 显示 / 图标 / 怎么显示）。工具数据只写一份在 `docs/business/agent-tools.ts`，Agent 页 ProcessGroup 的演示也换成这份（原来是「读取画布操作规范」「创建节点」这些不存在的工具）。
- ScanEye、SquareLibrary、Brain 补进 Figma：「图标」页对话与反馈分区（1010:4154 / 4177 / 4196，描述写来源 lucide/…、缩到 22/24、线宽 1.5、已转轮廓，分区计数 13 → 16）、「_源文件 · 图标描边」同一分区的描边源、「_图标对照」对话与反馈加了三张卡（V1 没有、V2 实例、V3 Hugeicons scan-eye / square-library / brain-03 缩 21、线宽 1.6）。网站 `icons.ts`、`icons-v3.ts`、图标页说明都加了，临时的 lab-icons.ts 删了。
- 页面模板组放目录最上面（照 Figma 页的顺序）：主站（主站 Agent + 一条生成记录）、画布 Agent（对话：生成图片、追问）、画布（整块小画布）。画布 Agent 模板里的工具步骤换成真实工具（加载技能、查看画布、查看画布节点信息）。
- 页面里不写的：研发要改的显示名（`remember` 后端叫「写入长期记忆」→ 显示「更新记忆」；`lark_cli`「执行lark-cli」→「执行飞书命令」；audioGenerationNode、motionControlNode、lipSyncNode 还没有显示名）。
