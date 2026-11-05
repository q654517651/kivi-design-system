import { Fragment, forwardRef, useRef, useState, type ReactElement } from 'react';
import { IconButton } from '../button';
import { useControllable } from '../hooks';
import { Dropdown, Menu, MenuItem, MenuLabel, type DropdownProps } from '../menu';
import { TabItem, Tabs } from '../navigation';
import { ScrollArea } from '../scroll-area';
import type { SelectOption } from '../selection';
import { Popover } from '../tooltip';
import { GEN_MODEL_GROUPS, GEN_MODEL_MAX } from './options';
import './generation.css';

type GenModelType = 'image' | 'video';

export interface GenModelPickerProps
  extends Omit<DropdownProps, 'trigger' | 'children' | 'anchorPoint' | 'matchTriggerWidth' | 'closeOnSelect' | 'haspopup'> {
  /** 已经插进输入框的模型（值），用来算每组选满没有 */
  picked?: string[];
  /** 点了一个模型：插进输入框，面板关上。参数是选项和它在哪一组（图片 / 视频） */
  onPick?: (model: SelectOption, type: GenModelType) => void;
  /** 触发器，默认工具条上的方块图标按钮（画布 Agent）；主站 Agent 工具条传一个无底按钮 */
  trigger?: ReactElement;
  /** 面板展开。传了就是受控 */
  open?: boolean;
  /** 非受控时一开始是否展开，默认收起 */
  defaultOpen?: boolean;
  /** 展开、收起时触发，参数是新的状态 */
  onOpenChange?: (open: boolean) => void;
}

/**
 * 选择模型（模型偏好）：照线上 ModelSelectorPopover。头部「选择模型」+ 分段「图片 / 视频」，
 * 点分段平滑滚到那一组，滚动时分段跟着变；行是两行菜单项（Logo 24 + 名字 + 说明），不标选中。
 * 点一行把模型插进输入框、关面板；同一组已经选了 4 个时，没选过的行变灰，悬停提示「最多同时选择 4 个图片模型」。
 * ref 给包住触发器的外壳 span（和 Dropdown 一样）。
 */
export const GenModelPicker = forwardRef<HTMLSpanElement, GenModelPickerProps>(function GenModelPicker(
  { picked = [], onPick, trigger, open: openProp, defaultOpen = false, onOpenChange, placement = 'top-start', ...rest },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [active, setActive] = useState<GenModelType>('image');
  const viewport = useRef<HTMLDivElement>(null);
  const labels = useRef<Partial<Record<GenModelType, HTMLDivElement | null>>>({});
  const jumping = useRef(false);

  const count = (type: GenModelType) =>
    GEN_MODEL_GROUPS.find((g) => g.type === type)!.options.filter((o) => picked.includes(o.value)).length;

  const jump = (type: string) => {
    const k = type as GenModelType;
    const el = labels.current[k];
    const vp = viewport.current;
    setActive(k);
    if (!el || !vp) return;
    // 点分段滚过去的途中不按滚动位置改分段，不然会在两个之间闪
    jumping.current = true;
    vp.scrollTo({ top: el.offsetTop - vp.offsetTop, behavior: 'smooth' });
    window.setTimeout(() => (jumping.current = false), 400);
  };

  const onScroll = () => {
    const vp = viewport.current;
    if (!vp || jumping.current) return;
    const atEnd = vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 1;
    const video = labels.current.video;
    setActive(atEnd || (video && video.offsetTop - vp.offsetTop <= vp.scrollTop + 1) ? 'video' : 'image');
  };

  return (
    <Dropdown
      ref={ref}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setActive('image');
      }}
      placement={placement}
      trigger={trigger ?? <IconButton icon="Mdoel" label="选择模型" variant="text" />}
      {...rest}
    >
      <Menu className="kv-gen-model-picker" aria-label="选择模型">
        <div className="kv-gen-model-picker__head">选择模型</div>
        <Tabs variant="segment" value={active} onChange={jump} aria-label="模型分类">
          {GEN_MODEL_GROUPS.map((g) => (
            <TabItem key={g.type} value={g.type}>
              {g.label}
            </TabItem>
          ))}
        </Tabs>
        <ScrollArea maxHeight={320} viewportRef={viewport} viewportProps={{ onScroll }}>
          <div className="kv-gen-model-picker__list">
            {GEN_MODEL_GROUPS.map((g) => {
              const full = count(g.type) >= GEN_MODEL_MAX;
              return (
                <Fragment key={g.type}>
                  <MenuLabel ref={(el) => (labels.current[g.type] = el)}>{g.label}</MenuLabel>
                  {g.options.map((m) => {
                    const off = full && !picked.includes(m.value);
                    const item = (
                      <MenuItem
                        key={m.value}
                        icon={m.icon}
                        description={m.description}
                        aria-disabled={off || undefined}
                        onClick={(e) => {
                          if (off) return e.preventDefault();
                          onPick?.(m, g.type);
                        }}
                      >
                        {m.label}
                      </MenuItem>
                    );
                    return off ? (
                      <Popover key={m.value} content={`最多同时选择 ${GEN_MODEL_MAX} 个${g.label}模型`} placement="right" delay={0} className="kv-gen-model-picker__tip" offset={14}>
                        {item}
                      </Popover>
                    ) : (
                      item
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </ScrollArea>
      </Menu>
    </Dropdown>
  );
});
GenModelPicker.displayName = 'GenModelPicker';
