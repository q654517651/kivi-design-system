# KIVI 设计规范

这个文件夹用来写 KIVI 设计规范 skill。规范来源是 Figma「KIVI UI KIT V2」（fileKey `bfXarGblevAYPh7a6nmXlt`），设计、产品、研发共用。

## 目录

- `kivi-design-system/`：skill 本体。SKILL.md 是入口，`references/` 按 Figma 的页分文件。
- `kivi-design-system-workspace/`：旧版备份（skill-snapshot-v0.1）、存档、测试结果，不进 skill。
- `kivi-design-system.skill`：打包文件，现在是旧版，发布时重新打包，不进 git。

## 写规范的规矩

- 以 Figma 为准，Figma 里没定的不写。Figma 和 skill 的同步由用户负责。
- 不参考代码。前端代码是按 UI 发挥的，不是设计稿。代码库 `ai-design-web` 只读，不改、不提交。
- 文件按 Figma 的页分。Figma 改了哪一页，就改对应的文件。
- 每个组件按「用途 / 结构 / 属性 / 样子 / 用法」五块写，样板是 `references/components/buttons.md`。
- 改名必须有映射表：Figma 各页的「迁移映射」，skill 里对应「旧名对照」。
- 写法：中文、短句；只用 .md；路径小写加连字符。
- 改 Figma 组件库本身时，先读 `references/figma-kit.md`。

## 发布

- skill 和新 kit 一起发布，现在都还没上线。
- 发布前补上 iconfont「KIVI v2」的项目地址，再重新打包 `.skill`。

## 进度

写完一篇就更新这里。

- 已按五块格式写完：按钮。
- 待写：其他通用组件；画布（Figma 在调整，要整篇重写）；Agent；页面；图标表和 Figma 同步；AssetThumb；旧名对照逐条对 Figma。

## 协作方式

- 用中文回复，先给结论，说话简短。
- 先回答再动手：消息里有问题就先回答、给方案，用户点头再改。新东西先列关键决定让用户拍板。
- 用户是 UI 设计师，有代码库权限不等于能改代码，前端改动要交给前端。
