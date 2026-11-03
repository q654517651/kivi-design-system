import { useEffect, useMemo, useState } from 'react';
import {
  AssetThumb,
  Avatar,
  Button,
  ButtonGroup,
  Dropdown,
  EmptyState,
  Icon,
  IconButton,
  Menu,
  MenuDivider,
  MenuItem,
  PlaceholderImage,
  ResultTile,
  Select,
  Skeleton,
  TabItem,
  Tabs,
  Tag,
  Tooltip,
  toast,
} from '@kivi';
import { ASSETS, PROJECTS, daysAgo, groupLabel, src, type Asset, type AssetKind, type Project } from './data';

const VIDEO = './placeholders/video/kivi-demo-16x9.mp4';

/* ---------- 假加载：切 tab、切筛选时先出骨架屏 ---------- */

function useFakeLoading(signature: string, ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(t);
  }, [signature, ms]);
  return loading;
}

/* ---------- 二级筛选的三个下拉：筛选、时间、排序 ---------- */

interface Filters {
  status: string;
  time: string;
  sort: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'collected', label: '已收藏' },
  { value: 'loading', label: '生成中' },
  { value: 'failed', label: '生成失败' },
];
const TIME_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '7', label: '近 7 天' },
  { value: '30', label: '近 30 天' },
  { value: 'old', label: '30 天前' },
];
const SORT_OPTIONS = [
  { value: 'new', label: '最新优先' },
  { value: 'old', label: '最早优先' },
];

/** 下拉：选了「默认项」时回到占位文字（筛选 / 时间 / 排序），选了别的就显示选中的文字 */
function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      variant="plain"
      aria-label={label}
      placeholder={label}
      options={options}
      value={value === options[0].value ? null : value}
      onChange={onChange}
    />
  );
}

const Divider = () => <span className="ast-bar__divider" role="separator" aria-orientation="vertical" />;

/* ---------- 生成历史 ---------- */

function HistoryTile({ a, onDelete, onCollect }: { a: Asset; onDelete: () => void; onCollect: (c: boolean) => void }) {
  const top = [
    { icon: 'Delete' as const, label: '删除', onClick: onDelete },
    { icon: 'Download' as const, label: '下载', onClick: () => toast.success('已开始下载') },
  ];
  if (a.status !== 'done') {
    return (
      <ResultTile
        type={a.kind === 'video' ? 'video' : 'image'}
        status={a.status}
        src={a.status === 'loading' && a.image ? src(a.image) : undefined}
        badge={a.status === 'loading' ? '生成中' : undefined}
        topActions={a.status === 'failed' ? [top[0]] : undefined}
      />
    );
  }
  if (a.kind === 'image') {
    return (
      <ResultTile
        src={src(a.image)}
        topActions={top}
        collect
        collected={!!a.collected}
        onCollectedChange={onCollect}
      />
    );
  }
  if (a.kind === 'video') {
    return (
      <ResultTile
        type="video"
        src={VIDEO}
        topActions={top}
        collect
        collected={!!a.collected}
        onCollectedChange={onCollect}
        onPreview={() => toast.info('预览（原型里没做）')}
      />
    );
  }
  // 音频、文档：ResultTile 只有图片和视频两种，这里用 ResultTile 的壳 + AssetThumb / 图标拼
  return (
    <ResultTile topActions={top} collect={a.kind === 'audio'} collected={!!a.collected} onCollectedChange={onCollect}>
      <div className="ast-file">
        {a.kind === 'audio' ? (
          <AssetThumb size={72} type="audio" />
        ) : (
          <Icon name="File" size={24} className="ast-file__icon" />
        )}
        <span className="ast-file__name">{a.name}</span>
        <Tag>{a.duration}</Tag>
      </div>
    </ResultTile>
  );
}

const KIND_LABEL: Record<AssetKind, string> = { image: '图片', video: '视频', audio: '音频', doc: '文档' };

function HistoryGrid({
  kind,
  filters,
  assets,
  setAssets,
  loading,
  onReset,
}: {
  kind: AssetKind;
  filters: Filters;
  assets: Asset[];
  setAssets: (f: (prev: Asset[]) => Asset[]) => void;
  loading: boolean;
  onReset: () => void;
}) {
  const groups = useMemo(() => {
    let list = assets.filter((a) => a.kind === kind);
    if (filters.status === 'collected') list = list.filter((a) => a.collected);
    else if (filters.status !== 'all') list = list.filter((a) => a.status === filters.status);
    if (filters.time === '7') list = list.filter((a) => daysAgo(a.date) <= 7);
    else if (filters.time === '30') list = list.filter((a) => daysAgo(a.date) <= 30);
    else if (filters.time === 'old') list = list.filter((a) => daysAgo(a.date) > 30);
    const map = new Map<number, Asset[]>();
    list.forEach((a) => map.set(a.date.getTime(), [...(map.get(a.date.getTime()) ?? []), a]));
    const sorted = [...map.entries()].sort((x, y) => (filters.sort === 'old' ? x[0] - y[0] : y[0] - x[0]));
    return sorted.map(([t, items]) => ({ label: groupLabel(new Date(t)), items }));
  }, [assets, kind, filters]);

  if (loading) {
    return (
      <div aria-busy="true" aria-label="加载中">
        {[8, 4].map((count, i) => (
          <section className="ast-group" key={i}>
            <Skeleton shape="text" width={80} height={20} className="ast-group__skeleton-title" />
            <div className="ast-grid">
              {Array.from({ length: count }, (_, j) => (
                <Skeleton key={j} shape="rect" className="ast-grid__skeleton" />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="ast-empty">
        <EmptyState
          scene="empty"
          title={`没有符合条件的${KIND_LABEL[kind]}`}
          description="换个筛选条件试试"
          action={<Button onClick={onReset}>重置筛选</Button>}
        />
      </div>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <section className="ast-group" key={g.label}>
          <h2 className="ast-group__title">{g.label}</h2>
          <div className="ast-grid">
            {g.items.map((a) => (
              <HistoryTile
                key={a.id}
                a={a}
                onDelete={() => {
                  setAssets((prev) => prev.filter((x) => x.id !== a.id));
                  toast.success('已删除');
                }}
                onCollect={(c) => {
                  setAssets((prev) => prev.map((x) => (x.id === a.id ? { ...x, collected: c } : x)));
                  toast.info(c ? '已收藏' : '已取消收藏');
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function HistoryTab() {
  const [kind, setKind] = useState<AssetKind>('image');
  const [filters, setFilters] = useState<Filters>({ status: 'all', time: 'all', sort: 'new' });
  const [assets, setAssets] = useState(ASSETS);
  const loading = useFakeLoading(`${kind}|${filters.status}|${filters.time}|${filters.sort}`);
  const set = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));
  return (
    <>
      <div className="ast-bar">
        <Tabs value={kind} onChange={(v) => setKind(v as AssetKind)} aria-label="资产类型">
          <TabItem value="image">图片</TabItem>
          <TabItem value="video">视频</TabItem>
          <TabItem value="audio">音频</TabItem>
          <TabItem value="doc">文档</TabItem>
        </Tabs>
        <Divider />
        <FilterSelect label="筛选" options={STATUS_OPTIONS} value={filters.status} onChange={set('status')} />
        <FilterSelect label="时间" options={TIME_OPTIONS} value={filters.time} onChange={set('time')} />
        <FilterSelect label="排序" options={SORT_OPTIONS} value={filters.sort} onChange={set('sort')} />
      </div>
      <div className="ast-content">
        <HistoryGrid kind={kind} filters={filters} assets={assets} setAssets={setAssets} loading={loading} onReset={() => setFilters({ status: 'all', time: 'all', sort: 'new' })} />
      </div>
    </>
  );
}

/* ---------- 画布 ---------- */

const modifiedText = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日修改`;

function ProjectCard({ p, onDelete }: { p: Project; onDelete: () => void }) {
  return (
    <div className="ast-card" tabIndex={0} onClick={() => toast.info(`打开「${p.name}」（原型里没做）`)}>
      <div className="ast-card__cover">
        {p.image ? (
          <PlaceholderImage image={p.image} ratio={p.ratio ?? '16:9'} fill="blur" />
        ) : (
          <Icon name="Canvas" size={24} className="ast-card__empty" />
        )}
        <ButtonGroup className="ast-card__actions" aria-label="画布操作" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="更多">
          <Dropdown placement="bottom-end" trigger={<IconButton icon="More" label="更多" />}>
            <Menu width={160}>
              <MenuItem onClick={() => toast.info('重命名（原型里没做）')}>重命名</MenuItem>
              <MenuItem onClick={() => toast.success('已复制')}>创建副本</MenuItem>
              <MenuDivider />
              <MenuItem variant="danger" onClick={onDelete}>删除</MenuItem>
            </Menu>
          </Dropdown>
          </Tooltip>
        </ButtonGroup>
      </div>
      <div className="ast-card__name">{p.name}</div>
      <div className="ast-card__meta">{modifiedText(p.modified)}</div>
    </div>
  );
}

function CanvasTab() {
  const [sub, setSub] = useState<'current' | 'history'>('current');
  const [filters, setFilters] = useState<Filters>({ status: 'all', time: 'all', sort: 'new' });
  const [other, setOther] = useState('all');
  const [projects, setProjects] = useState(PROJECTS);
  const loading = useFakeLoading(`${sub}|${filters.status}|${filters.time}|${filters.sort}|${other}`);
  const set = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const list = useMemo(() => {
    let l = projects.filter((p) => !!p.archived === (sub === 'history'));
    if (filters.time === '7') l = l.filter((p) => daysAgo(p.modified) <= 7);
    else if (filters.time === '30') l = l.filter((p) => daysAgo(p.modified) <= 30);
    else if (filters.time === 'old') l = l.filter((p) => daysAgo(p.modified) > 30);
    if (filters.status === 'empty') l = l.filter((p) => !p.image);
    else if (filters.status === 'cover') l = l.filter((p) => !!p.image);
    const dir = filters.sort === 'old' ? 1 : -1;
    return [...l].sort((a, b) => dir * (a.modified.getTime() - b.modified.getTime()));
  }, [projects, sub, filters]);

  return (
    <>
      <div className="ast-bar">
        <Tabs value={sub} onChange={(v) => setSub(v as 'current' | 'history')} aria-label="画布范围">
          <TabItem value="current">画布</TabItem>
          <TabItem value="history">历史画布</TabItem>
        </Tabs>
        <FilterSelect
          label="其他"
          options={[
            { value: 'all', label: '我创建的' },
            { value: 'shared', label: '与我共享' },
            { value: 'template', label: '模板' },
          ]}
          value={other}
          onChange={setOther}
        />
        <Divider />
        <FilterSelect
          label="筛选"
          options={[
            { value: 'all', label: '全部' },
            { value: 'cover', label: '有内容' },
            { value: 'empty', label: '空画布' },
          ]}
          value={filters.status}
          onChange={set('status')}
        />
        <FilterSelect label="时间" options={TIME_OPTIONS} value={filters.time} onChange={set('time')} />
        <FilterSelect label="排序" options={SORT_OPTIONS} value={filters.sort} onChange={set('sort')} />
      </div>
      <div className="ast-content">
        {loading ? (
          <div className="ast-cards" aria-busy="true" aria-label="加载中">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>
                <Skeleton shape="rect" className="ast-card__skeleton" />
                <Skeleton shape="text" width="40%" style={{ marginTop: 12 }} />
                <Skeleton shape="text" width="30%" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="ast-cards">
            {sub === 'current' && (
              <button type="button" className="ast-card ast-card--new" onClick={() => toast.info('新建项目（原型里没做）')}>
                <span className="ast-card__cover">
                  <Icon name="Add" size={24} />
                </span>
                <span className="ast-card__name">新建项目</span>
              </button>
            )}
            {list.map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                onDelete={() => {
                  setProjects((prev) => prev.filter((x) => x.id !== p.id));
                  toast.success('已删除');
                }}
              />
            ))}
            {!list.length && sub === 'history' && (
              <div className="ast-empty ast-empty--wide">
                <EmptyState scene="empty" title="没有历史画布" />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- 资产页：顶部两个 tab + 右上角 ---------- */

export function AssetsPage() {
  // ?tab=canvas 直接打开画布 tab（截图用）
  const [tab, setTab] = useState<'history' | 'canvas'>(new URLSearchParams(location.search).get('tab') === 'canvas' ? 'canvas' : 'history');
  return (
    <main className="ast-main">
      <header className="ast-top">
        <Tabs size="lg" value={tab} onChange={(v) => setTab(v as 'history' | 'canvas')} aria-label="资产">
          <TabItem value="history">生成历史</TabItem>
          <TabItem value="canvas">画布</TabItem>
        </Tabs>
        <div className="ast-top__right">
          <Tooltip content="搜索">
            <IconButton icon="Search" label="搜索" />
          </Tooltip>
          <Tag icon="Kiwi">40</Tag>
          <Avatar size={32} name="KIVI 用户" />
        </div>
      </header>
      {tab === 'history' ? <HistoryTab /> : <CanvasTab />}
    </main>
  );
}
