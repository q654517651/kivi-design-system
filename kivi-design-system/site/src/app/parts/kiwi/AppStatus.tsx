import { Tag, Tooltip } from '@kivi';
import type { KwApplication, KwApplicationStatus } from '../../data/kiwi';

/** 申请单状态 */
export const APP_STATUS: Record<KwApplicationStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤销',
  failed: '加额失败',
};

/** 状态标签：加额失败标红，驳回、失败悬停看原因 */
export function AppStatus({ app }: { app: KwApplication }) {
  const label = app.compensatedAt ? '已补发' : APP_STATUS[app.status];
  const tag = (
    <Tag variant={app.status === 'approved' ? 'brand' : 'default'} className={app.status === 'failed' ? 'app-kw-danger' : undefined}>
      {label}
    </Tag>
  );
  const why = app.status === 'rejected' ? app.note : app.status === 'failed' ? app.error : undefined;
  return why ? <Tooltip content={why}>{tag}</Tooltip> : tag;
}
