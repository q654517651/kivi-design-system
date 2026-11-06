import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button, ButtonGroup, IconButton } from '../button';
import { Dialog } from '../dialog';
import { Divider } from '../divider';
import { toast } from '../feedback';
import { Icon } from '../Icon';
import { Dropdown, Menu, MenuItem, MenuLabel } from '../menu';
import { useControllable } from '../hooks';
import { cx } from '../utils';
import './canvas.css';

export interface CanvasItem {
  /** 唯一标识 */
  id: string;
  /** 画布名，可以重名 */
  name: string;
}

export interface CanvasHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 工作区名称 */
  workspace: string;
  /** 这个工作区的画布（受控），按创建顺序排；新建、复制都追加到最后 */
  canvases?: CanvasItem[];
  /** 默认的画布列表（非受控） */
  defaultCanvases?: CanvasItem[];
  /** 新建、改名、复制、删除后的新列表 */
  onCanvasesChange?: (canvases: CanvasItem[]) => void;
  /** 当前画布的 id（受控） */
  value?: string;
  /** 默认的当前画布（非受控），不写是第一个 */
  defaultValue?: string;
  /** 切到别的画布 */
  onChange?: (id: string) => void;
  /** 一个工作区最多几个画布，默认 30。到了上限新建、复制都不做，出 Toast「画布已达到上限」 */
  max?: number;
  /** Agent 正在工作：这时切画布先弹窗确认 */
  agentWorking?: boolean;
  /** 点 Logo，比如回首页 */
  onLogoClick?: () => void;
}

/** 新画布的名字：新建前一共几个 + 1，允许重名 */
const nameFor = (count: number) => `画布 ${count + 1}`;
const uid = () => `canvas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * 画布左上角：Logo｜工作区名称｜画布名称 ⌄。玻璃按钮条 44（和节点工具栏同一档）。
 * 点画布名称展开下拉：顶上「画布 +」，下面这个工作区的所有画布，当前的用选中底色（单选不打勾）；超过 7.5 条滚动，新建、复制后滚到新的那条。
 * 点一条切过去，下拉不关（还能双击改名）；悬停出「⋯」：重命名画布、复制画布、删除画布（只剩 1 个时置灰）。
 * 双击一条或点「重命名画布」原地改名，回车生效；删除先弹窗确认，删的是当前画布就切到上面最近的一个，上面没有切到下面。
 * Agent 正在工作时切画布先弹窗确认。新建、复制到上限出 Toast，页面里要放一个 Toaster
 */
export const CanvasHeader = forwardRef<HTMLDivElement, CanvasHeaderProps>(function CanvasHeader(
  {
    workspace,
    canvases: canvasesProp,
    defaultCanvases = [{ id: 'canvas-1', name: '画布 1' }],
    onCanvasesChange,
    value: valueProp,
    defaultValue,
    onChange,
    max = 30,
    agentWorking,
    onLogoClick,
    className,
    ...rest
  },
  ref,
) {
  const [canvases, setCanvases] = useControllable(canvasesProp, defaultCanvases, onCanvasesChange);
  const [value, setValue] = useControllable(valueProp, defaultValue ?? (canvasesProp ?? defaultCanvases)[0]?.id ?? '', onChange);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CanvasItem | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const current = canvases.find((c) => c.id === value) ?? canvases[0];

  // 新建、复制后滚到新的那条（菜单打开动画开始后再滚）
  useEffect(() => {
    if (!scrollTo || !open) return;
    const t = window.requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-canvas-id="${scrollTo}"]`)?.scrollIntoView({ block: 'nearest' });
      setScrollTo(null);
    });
    return () => window.cancelAnimationFrame(t);
  }, [scrollTo, open, canvases]);

  const full = () => {
    if (canvases.length < max) return false;
    toast.info('画布已达到上限');
    return true;
  };

  const create = () => {
    if (full()) return;
    const item = { id: uid(), name: nameFor(canvases.length) };
    setCanvases([...canvases, item]);
    setValue(item.id);
    setScrollTo(item.id);
  };

  const duplicate = (c: CanvasItem) => {
    if (full()) return;
    const item = { id: uid(), name: `${c.name} 副本` };
    setCanvases([...canvases, item]);
    setScrollTo(item.id);
  };

  const rename = (id: string, name: string) => setCanvases(canvases.map((c) => (c.id === id ? { ...c, name } : c)));

  const remove = (c: CanvasItem) => {
    const i = canvases.findIndex((x) => x.id === c.id);
    const rest = canvases.filter((x) => x.id !== c.id);
    setCanvases(rest);
    // 删的是当前画布：切到上面最近的一个，上面没有切到下面
    if (c.id === value && rest.length) setValue(rest[Math.max(0, i - 1)].id);
  };

  const select = (id: string) => {
    if (id === value) return;
    if (agentWorking) {
      // 弹窗前先收起下拉，免得 Esc 先关下拉
      setOpen(false);
      setSwitching(id);
      return;
    }
    setValue(id);
  };

  return (
    <>
      <ButtonGroup ref={ref} variant="glass" size={44} aria-label="画布" className={cx('kv-canvas-header', className)} {...rest}>
        <Button aria-label="KIVI" onClick={onLogoClick}>
          <Icon name="Logo" size={20} />
        </Button>
        <Divider orientation="vertical" />
        <span className="kv-canvas-header__workspace" title={workspace}>
          {workspace}
        </span>
        <Divider orientation="vertical" />
        <Dropdown
          open={open}
          onOpenChange={setOpen}
          closeOnSelect={false}
          haspopup="listbox"
          // 从看得见的边量：按钮没底，看得见的是外面的条，按钮底到条底还有内边距 6，再空 4
          offset={10}
          trigger={
            <Button className="kv-canvas-header__canvas" rightIcon={open ? 'UpArrowSmall' : 'DownArrowSmall'}>
              {current?.name}
            </Button>
          }
        >
          <Menu width={240} role="group" aria-label="画布" className="kv-canvas-header__menu">
            <MenuLabel action={<IconButton icon="Add" label="新建画布" size={28} variant="light" onClick={create} />}>画布</MenuLabel>
            <div ref={listRef} className="kv-canvas-header__list" role="listbox" aria-label="画布列表">
              {canvases.map((c) => (
                <MenuItem
                  key={c.id}
                  data-canvas-id={c.id}
                  selected={c.id === value}
                  onClick={() => select(c.id)}
                  onDoubleClick={() => setEditing(c.id)}
                  editing={editing === c.id}
                  onEditingChange={(v) => setEditing(v ? c.id : null)}
                  onRename={(name) => rename(c.id, name)}
                  more={
                    <Menu>
                      <MenuItem icon="Rename" onClick={() => setEditing(c.id)}>
                        重命名画布
                      </MenuItem>
                      <MenuItem icon="Copy" onClick={() => duplicate(c)}>
                        复制画布
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        variant="danger"
                        icon="Delete"
                        disabled={canvases.length <= 1}
                        onClick={() => {
                          setOpen(false);
                          setRemoving(c);
                        }}
                      >
                        删除画布
                      </MenuItem>
                    </Menu>
                  }
                >
                  {c.name}
                </MenuItem>
              ))}
            </div>
          </Menu>
        </Dropdown>
      </ButtonGroup>

      <Dialog
        open={removing !== null}
        onOpenChange={(v) => !v && setRemoving(null)}
        title={`确定要删除画布「${removing?.name ?? ''}」吗？`}
        description="此操作不可恢复。"
        footer={
          <>
            <Button size={36} variant="secondary" onClick={() => setRemoving(null)}>
              取消
            </Button>
            <Button
              size={36}
              variant="danger"
              onClick={() => {
                if (removing) remove(removing);
                setRemoving(null);
              }}
            >
              删除
            </Button>
          </>
        }
      />

      <Dialog
        open={switching !== null}
        onOpenChange={(v) => !v && setSwitching(null)}
        title="Agent 正在工作，确定切换画布吗？"
        description="Agent 只能操作当前画布，切换后它会停在原来的画布。"
        footer={
          <>
            <Button size={36} variant="secondary" onClick={() => setSwitching(null)}>
              取消
            </Button>
            <Button
              size={36}
              variant="primary"
              onClick={() => {
                if (switching) setValue(switching);
                setSwitching(null);
              }}
            >
              切换
            </Button>
          </>
        }
      />
    </>
  );
});
CanvasHeader.displayName = 'CanvasHeader';
