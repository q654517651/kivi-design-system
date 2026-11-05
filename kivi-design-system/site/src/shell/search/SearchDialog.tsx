import { Fragment, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlignLeft, Hash, Palette, Table2, type LucideIcon } from 'lucide-react';
import { Button, Dialog, Icon, IconButton, ICONS, Input, type IconName } from '@kivi';
import { PAGES } from '../nav';
import { complete, createEngine, didYouMean, excerpt, highlight, parseQuery, search, type Engine } from './engine';
import { requestJump } from './jump';
import { KIND, type Kind, type Recent } from './types';
import './search.css';

// 全局搜索：顶栏一个入口（⌘K / Ctrl K / /），点开是一个弹窗，输入就出结果，↑↓ 选、回车跳。
// 匹配、排序、建议在 engine.ts，跳到页面里的位置在 jump.ts，索引在 scripts/search-index.mjs。

const PAGE_SIZE = 40;
const RECENT_KEY = 'kivi-search-recent';
const RECENT_MAX = 6;

// ---------- 索引（第一次要用才加载，之后记住） ----------

let enginePromise: Promise<Engine> | null = null;
function loadEngine(): Promise<Engine> {
  enginePromise ??= import('virtual:search-index').then((m) => createEngine(m.default));
  return enginePromise;
}

// ---------- 最近打开（记在本机浏览器里） ----------

function readRecent(): Recent[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(list) ? list.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: Recent) {
  const { kind, path, anchor, pageTitle, label, crumb, snippet, needle, key } = item;
  const next = [{ kind, path, anchor, pageTitle, label, crumb, snippet: snippet.slice(0, 120), needle, key }, ...readRecent().filter((r) => r.key !== key)];
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, RECENT_MAX)));
  } catch {
    // 无痕模式之类存不了，就不记
  }
}

// ---------- 一条结果 ----------

const KIND_LABEL: Record<Kind, string> = {
  [KIND.page]: '页面',
  [KIND.h2]: '小节',
  [KIND.h3]: '小节',
  [KIND.h4]: '小节',
  [KIND.text]: '正文',
  [KIND.row]: '表格',
  [KIND.token]: '变量',
  [KIND.icon]: '图标',
};

const KIND_ICON: Partial<Record<Kind, LucideIcon>> = {
  [KIND.h2]: Hash,
  [KIND.h3]: Hash,
  [KIND.h4]: Hash,
  [KIND.text]: AlignLeft,
  [KIND.row]: Table2,
  [KIND.token]: Palette,
};

function ResultIcon({ item }: { item: Recent }) {
  if (item.kind === KIND.icon && item.label in ICONS) return <Icon name={item.label as IconName} size={16} />;
  const Lucide = item.kind === KIND.page ? PAGES.find((p) => p.path === item.path)?.icon : KIND_ICON[item.kind];
  return Lucide ? <Lucide size={16} strokeWidth={1.75} aria-hidden="true" /> : null;
}

/** 命中的字标出来 */
function Marked({ text, raw }: { text: string; raw: string[] }) {
  return (
    <>
      {highlight(text, raw).map(([s, hit], i) =>
        hit ? (
          <mark key={i} className="shell-search__mark">
            {s}
          </mark>
        ) : (
          <Fragment key={i}>{s}</Fragment>
        ),
      )}
    </>
  );
}

// ---------- 弹窗里的内容 ----------

function SearchPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const uid = useId();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [failed, setFailed] = useState(false);
  const [value, setValue] = useState('');
  // 拼音输入法打字时不搜（pinyin 字母没有意义），选定了字再搜
  const [searched, setSearched] = useState('');
  const composing = useRef(false);
  const [active, setActive] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [recent] = useState(readRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    loadEngine().then(
      (e) => live && setEngine(e),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);

  // 弹窗放开前遮罩是 visibility: hidden，autoFocus 可能没成；挂上、下一帧、60ms 后各试一次，按 ⌘K 马上打字也不丢字
  useEffect(() => {
    const focus = () => inputRef.current?.focus({ preventScroll: true });
    focus();
    const raf = requestAnimationFrame(focus);
    const id = window.setTimeout(focus, 60);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, []);

  const q = useDeferredValue(searched);
  const query = useMemo(() => parseQuery(q), [q]);
  const typing = query.terms.length > 0;
  const boost = useMemo(() => new Set(recent.map((r) => r.key)), [recent]);
  const hits = useMemo(() => (engine && typing ? search(engine, query, { boost }) : []), [engine, typing, query, boost]);

  // 没输入：最近打开 + 全部页面
  const idle = useMemo(() => {
    if (!engine || typing) return { recent: [] as Recent[], pages: [] as Recent[] };
    const pages = engine.entries.filter((e) => e.kind === KIND.page);
    const recentKeys = new Set(recent.map((r) => r.key));
    return { recent, pages: pages.filter((p) => !recentKeys.has(p.key)) };
  }, [engine, typing, recent]);

  const items: Recent[] = typing ? hits.slice(0, limit).map((h) => h.entry) : [...idle.recent, ...idle.pages];
  const suggestions = useMemo(() => {
    if (!engine || !typing) return [];
    return hits.length ? complete(engine, searched) : didYouMean(engine, searched);
  }, [engine, typing, hits.length, searched]);

  // 结果换了，高亮回到第一条
  useEffect(() => {
    setActive(0);
    setLimit(PAGE_SIZE);
    listRef.current?.scrollTo({ top: 0 });
  }, [q]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' });
  }, [active, items.length]);

  const go = (item: Recent) => {
    saveRecent(item);
    onClose();
    navigate(item.path);
    requestJump({ path: item.path, kind: item.kind, anchor: item.anchor, needle: item.needle });
  };

  const apply = (next: string) => {
    setValue(next);
    setSearched(next);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const n = items.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (n) setActive((i) => (i + 1) % n);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (n) setActive((i) => (i - 1 + n) % n);
        break;
      case 'PageDown':
        e.preventDefault();
        if (n) setActive((i) => Math.min(n - 1, i + 6));
        break;
      case 'PageUp':
        e.preventDefault();
        if (n) setActive((i) => Math.max(0, i - 6));
        break;
      case 'Enter':
        if (items[active]) {
          e.preventDefault();
          go(items[active]);
        }
        break;
      case 'Tab':
        // Tab 接受第一条建议（补全或纠错）
        if (suggestions[0] && !e.shiftKey) {
          e.preventDefault();
          apply(suggestions[0].query);
        }
        break;
    }
  };

  const total = typing ? hits.length : 0;
  const rawTerms = query.raw;
  const recentCount = idle.recent.length;

  return (
    <div className="shell-search">
      <Input
        ref={inputRef}
        autoFocus
        clearable
        leftIcon="Search"
        placeholder="搜索组件、变量、图标、规范文字"
        aria-label="搜索"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${uid}-list`}
        aria-activedescendant={items.length ? `${uid}-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (!composing.current) setSearched(e.target.value);
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setSearched(e.currentTarget.value);
        }}
        onKeyDown={onKeyDown}
      />

      <div className="shell-search__hints" aria-live="polite">
        {typing && suggestions.length > 0 && (
          <>
            <span>{hits.length ? '建议' : `没有找到「${searched.trim()}」，你是不是想搜`}</span>
            {suggestions.map((s) => (
              <Button key={s.query} size={28} variant="light" onClick={() => apply(s.query)}>
                {s.text}
              </Button>
            ))}
          </>
        )}
      </div>

      <div ref={listRef} className="shell-search__list" role="listbox" id={`${uid}-list`} aria-label="搜索结果">
        {failed && <p className="shell-search__empty">索引加载失败，刷新页面再试。</p>}
        {!failed && !engine && <p className="shell-search__empty">加载中…</p>}
        {engine && typing && hits.length === 0 && !suggestions.length && (
          <p className="shell-search__empty">没有找到。换个说法，或者少写几个词。</p>
        )}
        {items.map((item, i) => (
          <Fragment key={`${item.key}-${i}`}>
            {!typing && i === 0 && recentCount > 0 && <div className="shell-search__group">最近打开</div>}
            {!typing && i === recentCount && <div className="shell-search__group">全部页面</div>}
            <button
              type="button"
              role="option"
              id={`${uid}-${i}`}
              tabIndex={-1}
              aria-selected={i === active}
              data-active={i === active ? '' : undefined}
              className="shell-search__item"
              onMouseMove={() => i !== active && setActive(i)}
              onClick={() => go(item)}
            >
              <span className="shell-search__icon">
                <ResultIcon item={item} />
              </span>
              <span className="shell-search__body">
                <span className="shell-search__label">
                  <Marked text={item.label} raw={rawTerms} />
                </span>
                {(item.crumb || item.snippet) && (
                  <span className="shell-search__meta">
                    {item.crumb && (
                      <span className="shell-search__crumb">
                        <Marked text={item.crumb} raw={rawTerms} />
                      </span>
                    )}
                    {item.snippet && (
                      <span className="shell-search__snippet">
                        <Marked text={typing ? excerpt(item.snippet, rawTerms) : item.snippet} raw={rawTerms} />
                      </span>
                    )}
                  </span>
                )}
              </span>
              <span className="shell-search__kind">{KIND_LABEL[item.kind]}</span>
            </button>
          </Fragment>
        ))}
        {typing && hits.length > limit && (
          <div className="shell-search__more">
            <Button size={28} variant="light" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              再显示 {Math.min(PAGE_SIZE, hits.length - limit)} 条
            </Button>
          </div>
        )}
      </div>

      <div className="shell-search__foot">
        <span className="shell-search__keys">↑↓ 选择　↵ 跳转　Tab 接受建议　Esc 关闭</span>
        {typing && <span>共 {total} 条</span>}
      </div>
    </div>
  );
}

// ---------- 顶栏入口 ----------

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function isEditable(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return Boolean(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
}

/** 顶栏的搜索入口和弹窗，同时挂全局快捷键：⌘K / Ctrl K、/ */
export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const warm = () => void loadEngine();

  return (
    <>
      <Button
        size={28}
        variant="secondary"
        leftIcon="Search"
        className="shell-search-btn"
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        onClick={() => setOpen(true)}
        onMouseEnter={warm}
        onFocus={warm}
      >
        搜索
        <span className="shell-search-kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>
      </Button>
      <IconButton icon="Search" label="搜索" className="shell-search-ibtn" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen} size={560} aria-label="搜索">
        <SearchPanel onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
