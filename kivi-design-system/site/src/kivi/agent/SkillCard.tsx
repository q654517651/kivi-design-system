import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../button';
import { cx } from '../utils';
import './agent.css';

export interface SkillCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 技能名，一行，超出省略，比如「运营活动主视觉生成」 */
  title: ReactNode;
  /** 一句话说明，一行，超出省略 */
  description?: ReactNode;
  /** 封面图地址。用户没设封面时不传，用技能专用的占位封面（深绿底加 KIVI Logo，Figma 旧版技能卡里那张） */
  cover?: string;
  /** 点「编辑」 */
  onEdit?: () => void;
  /** 点「使用技能」 */
  onUse?: () => void;
  /** 「编辑」按钮的字 */
  editText?: ReactNode;
  /** 「使用技能」按钮的字 */
  useText?: ReactNode;
}

/** 技能专用的占位封面，从 Figma 旧版 KIVI 3.14 技能卡导出，放在 assets/skill-card/ */
export const SKILL_DEFAULT_COVER = './skill-card/default-cover.png';

/**
 * 技能卡：Agent 帮用户新建或更新了一个技能后，在对话里出的一张卡。左边封面，右边技能名和说明，右下角「编辑」「使用技能」。
 * 照旧版 KIVI 3.14「消息气泡」里的技能卡，外框和确认卡（ActionCard）一样。
 */
export const SkillCard = forwardRef<HTMLDivElement, SkillCardProps>(function SkillCard(
  { title, description, cover, onEdit, onUse, editText = '编辑', useText = '使用技能', className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx('kv-skill-card', className)} {...rest}>
      <div className="kv-skill-card__main">
        <span className="kv-skill-card__cover">
          <img src={cover ?? SKILL_DEFAULT_COVER} alt="" />
        </span>
        <span className="kv-skill-card__text">
          <span className="kv-skill-card__title">{title}</span>
          {description != null && description !== false && <span className="kv-skill-card__desc">{description}</span>}
        </span>
      </div>
      <div className="kv-skill-card__actions">
        <Button onClick={onEdit}>{editText}</Button>
        <Button variant="primary" onClick={onUse}>
          {useText}
        </Button>
      </div>
    </div>
  );
});
SkillCard.displayName = 'SkillCard';
