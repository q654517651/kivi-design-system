/*
  分支切换（11-19 用户定）：网站部署时正式版在根目录，所有 preview/ 开头的功能分支各打一份放在「功能名/」子目录（流程见 CLAUDE.md「功能分支预览」），
  演示开关里多一项「分支」在这几个版本之间切，切过去停在同一页（带上 # 后面的路径）。
  - 部署时（.github/workflows/pages.yml）打包传 VITE_PREVIEW_BRANCH（这一份是哪个分支，正式版是 main）和 VITE_PREVIEW_LINKS（能切到的版本，JSON：[{ name, label, url }]）。
    本地开发不传，这里是空的，不出切换。
  - 本机存的演示数据按分支分开（功能分支的 key 前面加分支名），正式版还用原来的 key，和功能分支不串。
*/

export interface PreviewLink {
  /** 分支名，正式版是 main */
  name: string;
  /** 显示的名字，比如「正式版」「专家模式」 */
  label: string;
  /** 这个版本网站的地址（不带 #） */
  url: string;
}

export const PREVIEW_BRANCH: string = import.meta.env.VITE_PREVIEW_BRANCH ?? '';

export const PREVIEW_LINKS: PreviewLink[] = (() => {
  try {
    return PREVIEW_BRANCH ? (JSON.parse(import.meta.env.VITE_PREVIEW_LINKS ?? '[]') as PreviewLink[]) : [];
  } catch {
    return [];
  }
})();

/** 本机存储的 key：功能分支前面加分支名，正式版不变 */
export const previewKey = (key: string) => (PREVIEW_BRANCH && PREVIEW_BRANCH !== 'main' ? `${PREVIEW_BRANCH}:${key}` : key);

/** 切到另一个版本，停在同一页 */
export function switchPreview(name: string) {
  const link = PREVIEW_LINKS.find((l) => l.name === name);
  if (link && name !== PREVIEW_BRANCH) window.location.href = `${link.url}${window.location.hash}`;
}
