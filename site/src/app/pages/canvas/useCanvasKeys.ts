import { useEffect, useRef } from 'react';
import { copyNodes, duplicateNodes, getDoc, hasClipboard, redo, removeItems, undo } from '../../data/canvas-doc';

/*
  画布快捷键（照线上 shortcuts/config.ts）：
  ⌘C 复制节点、⌘V 粘贴（剪贴板里是文件就建素材节点）、⌘D 创建副本、⌘A 全选、Delete / Backspace 删除、
  ⌘Z 撤销、⇧⌘Z / ⌘Y 重做、⌘= / ⌘- 缩放、Esc 取消选中；按住空格拖是平移。
  焦点在输入框、可编辑文字里时不管（让它自己处理）。
  只管画布自己的键：焦点在画布外（弹窗、菜单、Agent 侧栏这些）或开着模态弹窗时一律不管，
  不然弹窗里按 Delete 会删掉背后选中的节点（11-20 验收）。空格落在按钮这类控件上时留给控件自己激活。
*/

interface Options {
  canvasId: string;
  sel: { nodes: string[]; edges: string[] };
  setSel: (nodes: string[], edges?: string[]) => void;
  onSpace: (down: boolean) => void;
  onZoom: (dir: 1 | -1) => void;
  /** 粘贴节点（剪贴板里是画布里复制的节点） */
  onPaste: () => void;
  /** 粘贴文件 */
  onFiles: (files: File[]) => void;
  onEscape: () => void;
  /** 画布外框：焦点在它外面的键不管 */
  boardRef: { current: Element | null };
}

const typing = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]');
};

const INTERACTIVE = 'button, a[href], [role="button"], [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"], summary';

/** 这个键是不是画布的：焦点在 body 上或画布里面，并且没开模态弹窗 */
const ownsKey = (target: EventTarget | null, board: Element | null) => {
  if (document.querySelector('[aria-modal="true"]')) return false;
  const t = target as Node | null;
  if (!t || t === document.body || t === document.documentElement || t === document) return true;
  return !!board?.contains(t);
};

export function useCanvasKeys(options: Options) {
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 弹窗、下拉自己处理过的键（比如 Esc 关弹窗）画布不再管，不然关弹窗会把选中也取消
      const o = latest.current;
      if (e.defaultPrevented || typing(e.target) || !ownsKey(e.target, o.boardRef.current)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        if ((e.target as HTMLElement | null)?.closest?.(INTERACTIVE)) return;
        e.preventDefault();
        if (e.repeat) return;
        o.onSpace(true);
        return;
      }
      if (e.key === 'Escape') return o.onEscape();
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!o.sel.nodes.length && !o.sel.edges.length) return;
        e.preventDefault();
        removeItems(o.canvasId, o.sel.nodes, o.sel.edges);
        return;
      }
      if (!mod) return;
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(o.canvasId);
        else undo(o.canvasId);
      } else if (key === 'y') {
        e.preventDefault();
        redo(o.canvasId);
      } else if (key === 'c') {
        // 选中了文字（比如节点名、文字节点内容）就让浏览器复制文字
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        copyNodes(o.canvasId, o.sel.nodes);
      } else if (key === 'd') {
        e.preventDefault();
        const ids = duplicateNodes(o.canvasId, o.sel.nodes);
        if (ids.length) o.setSel(ids);
      } else if (key === 'a') {
        e.preventDefault();
        o.setSel(
          getDoc(o.canvasId).nodes.filter((n) => n.type !== 'group').map((n) => n.id),
          getDoc(o.canvasId).edges.map((ed) => ed.id),
        );
      } else if (key === '=' || key === '+') {
        e.preventDefault();
        o.onZoom(1);
      } else if (key === '-') {
        e.preventDefault();
        o.onZoom(-1);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') latest.current.onSpace(false);
    };
    // 粘贴：剪贴板里有文件就建素材节点，没有就粘贴复制的节点
    const onPaste = (e: ClipboardEvent) => {
      if (typing(e.target) || !ownsKey(e.target, latest.current.boardRef.current)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        latest.current.onFiles(files);
        return;
      }
      if (hasClipboard()) {
        e.preventDefault();
        latest.current.onPaste();
      }
    };
    const onBlur = () => latest.current.onSpace(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('paste', onPaste);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
