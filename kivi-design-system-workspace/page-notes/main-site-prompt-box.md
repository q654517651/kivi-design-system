# 主站输入框 · 搬出来的内容

从 `src/docs/business/main-site-prompt-box.mdx` 精简时搬出（2026-10-29），原文照搬，没改字。这个 mdx 是嵌在「主站」页里的一段，页面只留演示；「参数」表合并写在 `main-site.mdx` 最下面。属性表整张搬过来。

## 总说明（原来的「主站输入框」一节开头）

主站首页的创作输入框，主站 Agent 专用。三个组件：整体 `PromptBox`、参考区 `ReferenceStack`、底部的生成按钮 `GenerateButton`。Figma「模板 · 主站」页「输入框」分区。<Tag kind="draft">待确认</Tag>

在右边面板选参考素材的数量、提示词的长短、生成按钮的状态。鼠标移到参考区上会向右展开。

## PromptBox

### 用途

- **PromptBox**：主站创作的输入框，上面写提示词、放参考素材，下面选模式、模型、参数，右边点生成。
- **ReferenceStack**：输入框左上角的参考区，放图片、视频、音频。素材多了叠放，鼠标移上去展开。
- **GenerateButton**：生成按钮，猕猴桃加消耗数，品牌渐变底。

只用在主站首页的创作输入框。画布的生成面板用画布页的 PromptInput，Agent 对话用 Agent 页的 SendButton。

### 结构

PromptBox 从上到下：内容区、工具条，间距 12。

- **内容区**：参考区在左，提示词在右，间距 12，从顶端对齐，最矮 120。
- **工具条**：左边是一串无底的 Select（`variant="plain"`），右边是张数和生成按钮。左边从左到右：任务类型、模型、参考方式、参数（分辨率 · 比例 · 时长合成一个）、其他开关（10-29 用户定：模型在前、参考方式在后）。放不下时换行。
- 参考区有三种：
  - 多个素材：`ReferenceStack`，自己带添加格。
  - 首尾帧：固定两格，放两个 `ReferenceItem`（尺寸 72，底部写「首帧」「尾帧」），空的用 `ReferenceAddSlot`。
  - 不要参考区：不传 `references`，提示词从最左边开始。
- 参考区展开时浮在提示词上面，不把文字往下推。被盖住的那几行字由输入框用遮罩藏起来，参考区和输入框用 `references` 连着，不用另外写。

零件都来自别的页，这一页不另做：

| 零件 | 用在哪 | 来自 |
|---|---|---|
| Select · 无底（已选） | 任务类型、模型、参考方式、参数、张数 | 输入控件页 `Select variant="plain"` |
| Button · 中 · 主要 | 生成按钮，左图标 `Kiwi` + 消耗数 | 按钮页 |
| IconButton · 32 · 文字 | 音频生成的「高级设置」 | 按钮页 |
| ReferenceItem · 72 | 参考区的卡片、首尾帧 | 画布页 |
| Switch | 样片模式 | 选择控件页 |

### 属性

#### PromptBox

| 属性 | 选项 | 代码 |
|---|---|---|
| 提示词 | 文字 | `value` + `onChange`，或 `defaultValue` |
| 占位文字 | 随模式变，比如「描述你想生成的视频，@ 引用参考素材」 | `placeholder` |
| 参考区 | ReferenceStack，或首尾帧的两格；不传就没有 | `references={<ReferenceStack … />}` |
| 工具条左边 | 任务类型、模型、参考方式、参数、开关 | `toolbar={<>…</>}` |
| 工具条右边 | 张数、生成按钮 | `actions={<>…</>}` |
| 提示词最高 | 数字，单位 px，默认 240 <Tag kind="draft">待定</Tag> | `maxHeight={240}` |
| 拖入文件 | 回调，参数是文件列表；不传就不接收拖拽 | `onDropFiles` |

提示词是多行的，随内容长高，超过最高高度就在里面滚动。Enter 换行，Figma 没定怎么发送，先不绑快捷键。<Tag kind="draft">待定</Tag>

#### ReferenceStack

| 属性 | 选项 | 代码 |
|---|---|---|
| 素材 | 数组，按添加顺序排，最后一个是叠放时最上面那张 | `items`，每项见下表 |
| 添加 | 点添加格、右下角圆形上传按钮时触发 | `onAdd` |
| 删除 | 点卡片右上角的删除时触发，参数是素材的 `id` | `onRemove` |
| 点卡片 | 预览大图 <Tag kind="draft">待确认</Tag> | `onItemClick` |
| 固定展开 | 不传：鼠标移上去展开，移开收起；传 true：一直展开 | `expanded` |
| 展开最宽 | 默认取输入框内容区的宽度，超过横向滚动 | `maxWidth={600}` |
| 展开、收起时 | 参数是展开了没有 | `onOpenChange` |

素材 `items` 每一项：

| 属性 | 选项 | 代码 |
|---|---|---|
| 标识 | 唯一，增删时用它认哪一张 | `id` |
| 类型 | 图片 / 视频 / 音频 | `kind="image"` / `"video"` / `"audio"` |
| 名字 | 图片1、视频1、音频1，要和提示词里 @ 引用的一致 | `name`；`referenceName(items, 'image')` 按类型给出下一个编号 |
| 缩略图 | 图片、视频封面；音频不用，是渐变底加音符 | `src` |
| 时长 | 视频、音频，展开后显示在卡片左上角 | `duration="8s"` |
| 上传进度 | 0–100；不传就是已经上传完 | `progress={54}` |

#### GenerateButton

| 属性 | 选项 | 代码 |
|---|---|---|
| 消耗 | 数字或文字，写在猕猴桃图标右边 | `cost={99}` |
| 状态 | 默认 / 悬停 / 按下 / 禁用 / 加载中 | 悬停、按下由鼠标触发；禁用 `disabled`；加载中 `loading` |
| 尺寸 | 小 / 中 / 大，默认中 | `size="md"`，其余同按钮 |

<GenerateButtonPlayground />

#### 工具条零件

| 组件 | 做什么 | 代码 |
|---|---|---|
| `ToolbarDivider` | 竖线，1 × 16，把参数组和后面的开关隔开 | `<ToolbarDivider />` |
| `ToolbarSwitch` | 文字加 Switch，点文字也能切换 | `label="样片模式"`，`checked` / `defaultChecked`、`onChange` |
| `ReferenceAddSlot` | 添加格，72 见方，首尾帧里没放素材的那一格用 | `onClick`，`aria-label` 默认「添加参考素材」 |

### 样子

#### 输入框

| 部分 | 规格 |
|---|---|
| 外框 | 宽度拉满（Figma 的示例是 1040）；底 container-light-1；描边 border-subtle 1；圆角 24 · `--border-radius-xl`；内边距 16 · `--spacing-lg` |
| 内容区和工具条 | 间距 12 · `--spacing-md` |
| 内容区 | 最矮 120；参考区和提示词间距 12 |
| 提示词 | 14 / 20 常规，primary；占位文字 placeholder；无底无描边，聚焦也不加描边；最矮 120，最高 240 <Tag kind="draft">待定</Tag> |
| 工具条 | 高 32；左边控件间距 6 · `--spacing-xs`，右边间距 8 · `--spacing-sm`，两边撑开 |
| 工具条里的 Select | 无底：高 32，圆角 8，左右 8，13 号字，左图标 16，右箭头 16 tertiary，悬停白 8% |
| 参数 | 分辨率 · 比例 · 时长合成一个 Select，写「720P · 16:9 · 8s」，不再带帧率；展开的参数面板 Figma 还没画，复用画布的 <Tag kind="draft">待定</Tag> |
| 竖线 | 1 × 16，border，前后间距同工具条 6 |
| 开关 | 13 号字 + Switch 36 × 20，间距 8，左右各留 6 |
| 生成按钮 | Button 中 · 主要：32 高，圆角 8，左右 12，左图标 `Kiwi` 20，间距 4，文字 13；品牌渐变底，on-brand 字 |

输入框聚焦不加描边，这是 Figma 定的。

### 用法

- 主站首页的创作输入框用 PromptBox，别的地方不用。
- **工具条左边**：先选任务类型（图片生成 / 视频生成 / 音频生成），后面的控件跟着模式和模型变。选了别的模式，工具条和占位文字整体换一套。
- **参考区**：图片生成、音频生成放一个添加格就行（有素材时换成 ReferenceStack）；视频生成·全能参考用 ReferenceStack，图片、视频、音频混排；首尾帧固定两格。
- **张数 x1** 先保留。<Tag kind="draft">待确认</Tag>
- **生成按钮**：参数不全或正在生成时 `disabled`；点了等结果时 `loading`。
- 工具条上 Select 展开的列表，先用 Select 自带的菜单，向上展开（`placement="top"`）。模式菜单、参考方式菜单、生成模式菜单、视频参数面板、音频高级设置这些弹出层，Figma 还没画。<Tag kind="draft">待定</Tag> Agent 回复中按钮变停止，也还没画。<Tag kind="draft">待定</Tag>

## ReferenceStack

#### 参考区的状态

空 → 一个 → 多个收起叠放 → 上传中。鼠标移到上面都能展开，也可以用键盘 Tab 聚焦。

<ReferenceStates />

悬停展开。这里摆成固定展开，被盖住的那几行字整行藏起来，右边的字慢慢透出来：

<ReferenceExpanded />

#### 参考区的交互

| 状态 / 动作 | 什么时候 | 数值 | 表现 |
|---|---|---|---|
| 空 | 没有参考素材 | 72，圆角 8，白 4% | 只有添加格，点一下上传，也可以把文件拖进输入框 |
| 一个 | 只有 1 个素材 | 卡片 72；上传按钮 24 圆，往右、往下各探出 10 | 卡片正放不叠；右下角挂圆形上传按钮（Upload 图标），继续添加 |
| 收起（叠放） | 2 个及以上，鼠标不在参考区 | 卡片 72 缩到 56；转角 3° / −12° / 8° | 按上传顺序叠在 72 的区域里：最上面是最后加的那张，后面露两张；第 4 张起压在第 3 张下面，40% 透明；底部写最上面那张的名字，名字条和圆角按比例放大，看上去和展开时一样大；右下角还是上传按钮 |
| 悬停展开 | 鼠标移到参考区，或用键盘聚焦 | 卡片 72，间距 6；400ms 起，每多一张加 10ms，最多 700ms；缓动 `--motion-ease-expand`；展开、收起同一条 | 卡片从叠放的位置飞出来，一边放大、转正一边排成一排，后面按添加顺序排；浮在提示词上，不把文字往下推；鼠标移开马上收回叠放 |
| 上传按钮变形 | 展开、收起时 | 变成添加格 150ms，变回圆钮 200ms，匀速 | 右下角的圆钮直接长成最前面的添加格：位置、大小、圆角、底色一起变，Upload 和 AddSmall 两个图标交叉淡入淡出；收起时反过来 |
| 盖住文字 | 展开时 | 不加底色；遮罩和卡片同一个时长、缓动；右边 40 渐隐 | 卡片直接浮在输入框的底上，被盖住的那几行字整行藏起来，不切半行；右边的字慢慢透出来，不和卡片贴着 |
| 名字 | 展开时 | 按类型分别编号 | 每张底部写「图片1 / 视频1 / 音频1」，和提示词里 @ 引用的名字一致；视频、音频左上角标时长 |
| 超出 | 展开后超过输入框宽度 | — | 横向滚动，不换行，滚动条藏起来，滚轮上下滚也能横着滚；右边 40 渐隐提示还能往右滚，滚到头渐隐消失；收起状态不受影响 |
| 上传中 | 素材还在上传 | 黑 40% + 进度环 28 | 卡片盖一层暗色，中间进度环和百分比；上传完自动去掉 |
| 加一张 | 添加素材时 | 和展开同一个时长、缓动 | 新卡片从最上面那张的位置出现，小一点、透明，一边变大一边变实 |
| 删一张 | 点删除，或外面把它从 `items` 里去掉 | 150ms ease-in | 缩小到 80%、淡出，其余卡片挪过来补位 |
| 删除 / 预览 | 展开后悬停某一张 | <Tag kind="draft">待确认</Tag> | 右上角出删除（18 圆，黑 40%）；点卡片看大图。Figma 都还没定样子，先这样做 |
| 手机 | 没有悬停 | — | 点一下参考区展开，再点一下收起 |

- 展开收起照 BytePlus 参考区（2026-10-29 用户定）：起步很快、慢慢停稳的 `--motion-ease-expand`，时长随张数变长。这是[动效](/foundations/motion)规则的例外，不用 ease-in-out，也超过 400ms 的上限。Figma 交互说明里写的「约 200ms 缓出」要跟着改。<Tag kind="draft">待确认</Tag>
- 卡片一直是 72，叠放时只是缩小、旋转，展开收起只动 transform，图和名字不会重新排版。
- 卡片收起时的大小、转角、位置照 Figma 的图量出来：最上面那张偏右下（+7 / +6，转 3°），第二张偏左上（−1 / −7，转 −12°），第三张偏右上（+17 / −5，转 8°），都是相对 72 格中心。第三张的右角会探出 72 约 12，贴着提示词的起点，是 Figma 画成这样的。
- 视频、音频的时长：Figma 的 ReferenceItem 把时长放左下，会和底部名字重叠，这里先放左上。<Tag kind="draft">待确认</Tag>
- 拖文件进输入框时输入框什么样，Figma 没定。<Tag kind="draft">待定</Tag>
- 系统开了「减少动态效果」时，展开收起不播动画，直接切换。

## GenerateButton

#### 生成按钮

按钮的状态、尺寸都和按钮页的主要类型一样，这里只加了猕猴桃图标和消耗数。加载中时猕猴桃换成转圈，数字不变，宽度不变。

<GenerateButtonMatrix />

Figma 里生成按钮是**中号（32）**；主站页旧的说明写的是「大」，以 Figma 为准。<Tag kind="draft">待确认</Tag> Agent 模式的按钮要不要显示消耗，先照原稿写 99。<Tag kind="draft">待确认</Tag>

## 可操作演示、接入、各种模式

#### 可操作的输入框

照参考区演示：加图片、视频、音频，模拟上传，删除，清空，固定展开，慢放 5 倍。鼠标移到参考区上展开，也可以把图片文件拖进输入框。缩略图是占位图。

<PromptBoxLab />

#### 接入：参考区自己管素材

PromptBox 只管排版，素材是外面的状态：`onAdd` 里弹出选文件、上传，上传时给素材 `progress`，传完去掉；`onRemove` 里把它从数组里去掉。

```jsx
() => {
  const [items, setItems] = useState([
    { id: 'a', kind: 'image', name: '图片1', src: './placeholders/kivi-future-1x1.webp' },
    { id: 'b', kind: 'image', name: '图片2', src: './placeholders/monstera-dots-1x1.webp' },
  ]);
  const add = () =>
    setItems((list) => [
      ...list,
      { id: String(Date.now()), kind: 'image', name: referenceName(list, 'image'), src: './placeholders/kiwi-light-1x1.webp' },
    ]);
  const remove = (id) => setItems((list) => list.filter((i) => i.id !== id));
  return (
    <PromptBox
      placeholder="描述你想生成的图片，可以上传参考图"
      references={<ReferenceStack items={items} onAdd={add} onRemove={remove} />}
      toolbar={
        <Select
          variant="plain"
          placement="top"
          leftIcon="ImageGeneration"
          defaultValue="image"
          options={[{ value: 'image', label: '图片生成' }, { value: 'video', label: '视频生成' }]}
        />
      }
      actions={<GenerateButton cost={4} />}
    />
  );
}
```

### 各种模式的工具条（原来的演示，页面里只留首尾帧和样片模式）

#### 图片生成：模式 · 模型 · 分辨率 · 比例；右边张数 · 生成

<Demo stage="base" code={`
() => {
  const sel = { variant: 'plain', placement: 'top' };
  return (
    <PromptBox
      placeholder="描述你想生成的图片，可以上传参考图"
      references={<ReferenceAddSlot />}
      toolbar={
        <>
          <Select {...sel} leftIcon="ImageGeneration" defaultValue="image" options={[{ value: 'image', label: '图片生成' }, { value: 'video', label: '视频生成' }]} />
          <Select {...sel} leftIcon="Bytedance" defaultValue="seedream" options={[{ value: 'seedream', label: 'Seedream 4.0' }]} />
          <Select {...sel} defaultValue="2k" options={[{ value: '2k', label: '2K' }, { value: '1k', label: '1K' }]} />
          <Select {...sel} defaultValue="1:1" options={[{ value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }]} />
        </>
      }
      actions={
        <>
          <Select {...sel} defaultValue="1" options={[{ value: '1', label: 'x1' }, { value: '2', label: 'x2' }]} />
          <GenerateButton cost={4} />
        </>
      }
    />
  );
}
`} />

GPT 这类模型，比例后面多一个背景（透明背景 / 不透明背景）：

<Demo stage="base" code={`
() => {
  const sel = { variant: 'plain', placement: 'top' };
  return (
    <PromptBox
      placeholder="描述你想生成的图片，可以上传参考图"
      references={<ReferenceAddSlot />}
      toolbar={
        <>
          <Select {...sel} leftIcon="ImageGeneration" defaultValue="image" options={[{ value: 'image', label: '图片生成' }]} />
          <Select {...sel} leftIcon="Openai" defaultValue="gpt" options={[{ value: 'gpt', label: 'GPT Image 2' }]} />
          <Select {...sel} defaultValue="2k" options={[{ value: '2k', label: '2K' }]} />
          <Select {...sel} defaultValue="1:1" options={[{ value: '1:1', label: '1:1' }]} />
          <Select {...sel} defaultValue="opaque" options={[{ value: 'opaque', label: '不透明背景' }, { value: 'transparent', label: '透明背景' }]} />
        </>
      }
      actions={
        <>
          <Select {...sel} defaultValue="1" options={[{ value: '1', label: 'x1' }]} />
          <GenerateButton cost={8} />
        </>
      }
    />
  );
}
`} />

#### 视频生成 · 全能参考：参考方式放在模型后面，参数合成一个

<Demo stage="base" code={`
() => {
  const sel = { variant: 'plain', placement: 'top' };
  const [items, setItems] = useState([
    { id: 'a', kind: 'image', name: '图片1', src: './placeholders/kivi-future-1x1.webp' },
    { id: 'b', kind: 'video', name: '视频1', src: './placeholders/kiwi-light-1x1.webp', duration: '8s' },
    { id: 'c', kind: 'audio', name: '音频1', duration: '0:15' },
  ]);
  return (
    <PromptBox
      defaultValue="开场用 @视频1 的构图，主角参考 @图片1，配乐用 @音频1。"
      placeholder="描述你想生成的视频，@ 引用参考素材"
      references={<ReferenceStack items={items} onRemove={(id) => setItems((l) => l.filter((i) => i.id !== id))} />}
      toolbar={
        <>
          <Select {...sel} leftIcon="VideoGeneration" defaultValue="video" options={[{ value: 'video', label: '视频生成' }, { value: 'image', label: '图片生成' }]} />
          <Select {...sel} leftIcon="OmniReference" defaultValue="omni" options={[{ value: 'omni', label: '全能参考' }, { value: 'frames', label: '首尾帧' }]} />
          <Select {...sel} leftIcon="Bytedance" defaultValue="fast" options={[{ value: 'fast', label: 'Seedance 2.0 Fast' }]} />
          <Select {...sel} defaultValue="8" options={[{ value: '8', label: '720P · 16:9 · 8s' }, { value: '5', label: '720P · 16:9 · 5s' }]} />
        </>
      }
      actions={
        <>
          <Select {...sel} defaultValue="1" options={[{ value: '1', label: 'x1' }]} />
          <GenerateButton cost={99} />
        </>
      }
    />
  );
}
`} />

#### 音频生成：模式 · 模型 · 音色 · 高级设置

高级设置是图标按钮，内容随模型变，所以工具条上不展开。音色用什么图标，还没定。<Tag kind="draft">待确认</Tag>

<Demo stage="base" code={`
() => {
  const sel = { variant: 'plain', placement: 'top' };
  return (
    <PromptBox
      placeholder="输入要朗读的文字"
      references={<ReferenceAddSlot />}
      toolbar={
        <>
          <Select {...sel} leftIcon="Audio" defaultValue="audio" options={[{ value: 'audio', label: '音频生成' }]} />
          <Select {...sel} leftIcon="Bytedance" defaultValue="doubao" options={[{ value: 'doubao', label: '豆包语音合成' }]} />
          <Select {...sel} defaultValue="gentle" options={[{ value: 'gentle', label: '温柔女声' }, { value: 'calm', label: '沉稳男声' }]} />
          <IconButton icon="Configuration" label="高级设置" />
        </>
      }
      actions={<GenerateButton cost={2} />}
    />
  );
}
`} />

#### Agent：模式后面是技能、模型偏好

<Demo stage="base" code={`
() => {
  const sel = { variant: 'plain', placement: 'top' };
  return (
    <PromptBox
      placeholder="输入想法、剧本或上传参考，支持「/」使用技能，@ 添加主体，和 Agent 一起创作"
      references={<ReferenceAddSlot />}
      toolbar={
        <>
          <Select {...sel} leftIcon="Agent" defaultValue="agent" options={[{ value: 'agent', label: 'Agent' }]} />
          <Select {...sel} leftIcon="Skill" defaultValue="skills" options={[{ value: 'skills', label: 'Skills' }]} />
          <Select {...sel} leftIcon="Mdoel" defaultValue="prefer" options={[{ value: 'prefer', label: '模型偏好' }]} />
        </>
      }
      actions={<GenerateButton cost={99} />}
    />
  );
}
`} />

### 样片模式（页面里还留着演示，这是它旁边的话）

#### 视频生成 · Seedance 2.5：样片模式不放进参数组，单独放在参数后面，用竖线隔开

样片模式用开关还是选择框，还没定。<Tag kind="draft">待确认</Tag>

## 旧名对照

| 旧写法 | 新写法 |
|---|---|
| 「模板 · 主站」里的输入框，复制模板改 | `PromptBox`；参考区 `ReferenceStack`；「生成 · 消耗 99」是 `GenerateButton` |
| 工具条上的「参考素材 · 添加」「参考 · 图片1」 | `ReferenceAddSlot`、`ReferenceStack` 的卡片（`ReferenceItem` 72） |
| Select 无底（已选） | `Select variant="plain"` |


## 删掉的演示和矩阵

- `GenerateButtonMatrix`（默认 / 悬停 / 按下 / 禁用 / 加载中）：生成按钮的属性面板里都能切到，另外加了尺寸。
- `ReferenceStates`（参考区状态摆在一起：空、一个、多个收起叠放、上传中）、`ReferenceExpanded`（固定展开摆静态，和 Figma「悬停展开」对照，素材 8 个）：现在是参考区的属性面板，素材数、类型、上传中、固定展开都能切。
- 原来整个输入框的属性面板有「参考素材（空 / 一个 / 多个 / 上传中）」「固定展开」「生成按钮（默认 / 禁用 / 加载中）」三项：搬到参考区、生成按钮各自的属性面板；输入框的面板留「参考区开关、提示词、模式」。「参考区」开关关掉就是不传 `references`，提示词从最左边开始。
