import { cloneElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MentionChip, type MentionChipType } from '../reference/MentionChip';

/*
  提示词输入框（PromptInput，contentEditable）里的 @ 引用：插一个 MentionChip、读出纯文字、素材换了顺序或删了以后跟着改。
  主站 PromptBox 和画布 NodePanel 共用（11-18 用户定：快捷 @ 照线上，点参考缩略图插进提示词）。
  引用标签上挂 data-ref-id（素材 id），名字跟着素材走：素材改名（换了顺序重新编号）标签跟着改，素材删了标签也删。
*/

export interface MentionSource {
  /** 素材 id，标签上记它 */
  id: string;
  /** 图片 / 视频 / 音频 */
  type: string;
  /** 名字，比如「图片1」 */
  name: string;
  /** 缩略图：图片、视频封面 */
  src?: string;
}

const chipType = (t: string): MentionChipType => (t === 'video' ? 'video' : t === 'audio' ? 'audio' : 'image');

/** 引用素材的 @ 标签（图片、视频带缩略图，音频是图标） */
function mentionChip(m: MentionSource) {
  return (
    <MentionChip type={chipType(m.type)} src={m.type === 'audio' ? undefined : m.src} data-ref-id={m.id}>
      {m.name}
    </MentionChip>
  );
}

/** 渲染出一段 HTML（插进 contentEditable 用，组件只写一份）。用静态渲染：在 effect 里（还原 @ 标签）也能同步出结果，flushSync 在那里不生效 */
function toHTML(node: ReactElement) {
  return renderToStaticMarkup(node);
}

// 每个输入框最后一次的光标位置：点缩略图时焦点离开了输入框，插在离开前光标在的地方
const lastRange = new WeakMap<HTMLElement, Range>();

/** 记住输入框里的光标位置。PromptInput 挂上时调用，返回取消函数 */
export function trackCaret(el: HTMLElement) {
  const onChange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount && el.contains(sel.getRangeAt(0).startContainer)) lastRange.set(el, sel.getRangeAt(0).cloneRange());
  };
  document.addEventListener('selectionchange', onChange);
  return () => document.removeEventListener('selectionchange', onChange);
}

/** 在光标处（没有就在最后）插一个 @ 引用，后面带一个空格。传了 replace 就替换掉这一段（打的「@名字」） */
export function insertMention(el: HTMLElement | null, m: MentionSource, replace?: Range) {
  insertChip(el, mentionChip(m), replace);
}

/**
 * 在光标处（焦点离开了就插回离开前的位置，没有就在最后）插一个标签，后面带一个空格。
 * 素材 @、模型、技能都走这里（照线上 upsertMentionSlot 的 restoreLastCursorRange），同一个能插多次。
 * 传了 replace 就替换掉这一段。用 insertHTML：触发 input 事件、能撤销
 */
export function insertChip(el: HTMLElement | null, chip: ReactElement, replace?: Range) {
  if (!el) return;
  el.focus({ preventScroll: true });
  const sel = window.getSelection();
  if (!sel) return;
  const saved = lastRange.get(el);
  let range: Range;
  if (replace) range = replace;
  else if (saved && el.contains(saved.startContainer)) range = saved;
  else {
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
  // 新插的标签先挂个记号：Chrome 的 insertHTML 插完把光标留在标签前面，接着打的字会跑到标签前，插完手动挪到「标签 + 空格」后面
  const mark = `kv-${Math.random().toString(36).slice(2)}`;
  const html = `${toHTML(cloneElement(chip, { 'data-kv-inserted': mark }))} `;
  if (document.execCommand('insertHTML', false, html)) {
    const added = el.querySelector<HTMLElement>(`[data-kv-inserted="${mark}"]`);
    if (!added) return;
    added.removeAttribute('data-kv-inserted');
    const next = added.nextSibling;
    const after = document.createRange();
    if (next?.nodeType === Node.TEXT_NODE && /^[ \u00a0]/.test((next as Text).data)) after.setStart(next, 1);
    else after.setStartAfter(added);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    return;
  }
  // insertHTML 不可用时手动插
  const frag = range.createContextualFragment(html);
  const last = frag.lastChild;
  range.deleteContents();
  range.insertNode(frag);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const BLOCK = new Set(['DIV', 'P']);

/** 读出输入框里的文字：@ 引用写成「@图片1」，换行照原样 */
export function promptText(el: HTMLElement | null): string {
  if (!el) return '';
  const walk = (node: Node, first: boolean): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node as Text).data;
    if (!(node instanceof HTMLElement)) return '';
    if (node.dataset.refId) return `@${node.textContent ?? ''}`;
    if (node.tagName === 'BR') return '\n';
    const inner = Array.from(node.childNodes)
      .map((c, i) => walk(c, i === 0))
      .join('');
    // 回车新起的一行（浏览器包成 div）前面补换行
    return BLOCK.has(node.tagName) && !first ? `\n${inner}` : inner;
  };
  return Array.from(el.childNodes)
    .map((c, i) => walk(c, i === 0))
    .join('')
    .replace(/\n$/, '');
}

/** 换成一段纯文字（外面改了受控的提示词时用，原来的 @ 标签不留） */
export function setPromptText(el: HTMLElement | null, text: string) {
  if (el) el.textContent = text;
}

/**
 * 把框里的「@名字」按现在的素材换回 @ 标签：提示词只存了文字（画布节点、外面改了受控的提示词），再显示时用它还原。
 * 名字长的先配（「图片10」不会被当成「图片1」+「0」）。有改动返回 true
 */
export function restoreMentions(el: HTMLElement | null, sources: MentionSource[]): boolean {
  if (!el || !sources.length) return false;
  const byName = new Map(sources.map((m) => [m.name, m]));
  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`@(${names.join('|')})`, 'g');
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!(n.parentElement?.closest('.kv-mention-chip'))) texts.push(n as Text);
  let changed = false;
  for (const t of texts) {
    const parts = t.data.split(re);
    if (parts.length === 1) continue;
    // split 带分组：单数位是配上的名字
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        if (part) frag.append(part);
        return;
      }
      const box = document.createElement('div');
      box.innerHTML = toHTML(mentionChip(byName.get(part)!));
      frag.append(...box.childNodes);
    });
    t.replaceWith(frag);
    changed = true;
  }
  return changed;
}

/** 素材变了以后同步 @ 标签：改了名的跟着改，删掉的素材标签也删。有改动返回 true */
export function syncMentions(el: HTMLElement | null, sources: MentionSource[]): boolean {
  if (!el) return false;
  let changed = false;
  el.querySelectorAll<HTMLElement>('[data-ref-id]').forEach((chip) => {
    const m = sources.find((s) => s.id === chip.dataset.refId);
    if (!m) {
      chip.remove();
      changed = true;
      return;
    }
    // 名字是标签里最后一段文字
    const text = Array.from(chip.childNodes).reverse().find((c): c is Text => c.nodeType === Node.TEXT_NODE);
    if (text && text.data !== m.name) {
      text.data = m.name;
      changed = true;
    }
  });
  return changed;
}
