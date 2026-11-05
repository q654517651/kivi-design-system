# KIVI 设计规范技能

面向 KIVI AI 无限画布 Web 端的设计规范技能与 React 组件库。网站在技能目录内，与技能一起维护。

- 在线规范：https://q654517651.github.io/kivi-design-system/
- 技能入口：[`kivi-design-system/SKILL.md`](kivi-design-system/SKILL.md)
- 网站源码：[`kivi-design-system/site/`](kivi-design-system/site/)
- 图片和演示素材：[`kivi-design-system/assets/`](kivi-design-system/assets/)

## 使用技能

克隆 `skill` 分支到所用 Agent 的技能目录（Claude Code 是 `~/.claude/skills/`，Codex 是 `~/.codex/skills/`）：

```bash
git clone -b skill --single-branch https://github.com/q654517651/kivi-design-system.git ~/.claude/skills/kivi-design-system
```

`skill` 分支只有技能本身（`kivi-design-system/` 里的东西），推送 `test` 后由 GitHub Actions 自动更新。技能每次使用前会自己 `git pull`，不用手动更新。不要只复制文件夹：复制的没有 git 记录，没法更新。

## 本地查看网站

```bash
cd kivi-design-system/site
npm ci
npm run dev
```

打开 http://localhost:4173/。

## 发布网站

推送 `test` 分支后，GitHub Actions 会检查组件、构建技能目录内的网站，并将 `site/dist/` 发布到本仓库的 GitHub Pages。也可以在 Actions 中手动运行 `Publish design site`。

## 当前状态

规范来源于 Figma「KIVI UI KIT V2」，当前仍在完善中；具体约束与适用范围见技能入口。
