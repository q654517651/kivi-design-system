import CustomCheckbox from '@/components/CustomCheckbox';
import classNames from 'classnames';
import styles from './index.module.less';

export interface AssetSelectOverlayProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * 批量管理模式下覆盖在资产卡片上的选择层
 * - 右上角勾选框（复用 CustomCheckbox 视觉，仅作展示，点击由整层接管）
 * - 整张卡片可点击切换选中，选中后描品牌色边框
 * 父元素需要 position: relative（AssetsListItem 已满足）
 */
const AssetSelectOverlay = ({ checked, onChange, className }: AssetSelectOverlayProps) => {
  const toggle = () => onChange(!checked);

  return (
    <div
      className={classNames(
        styles['asset_select_overlay'],
        { [styles['asset_select_overlay__checked']]: checked },
        className,
      )}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={(e) => {
        // 阻止冒泡到卡片，避免打开详情弹窗
        e.stopPropagation();
        toggle();
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <CustomCheckbox className={styles['asset_select_overlay-checkbox']} checked={checked} />
    </div>
  );
};

export default AssetSelectOverlay;
