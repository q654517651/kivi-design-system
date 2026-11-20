import { Button, Dialog, EmptyState, Loading } from '@kivi';
import { MemoryList } from './MemoryList';
import { ProfileQuiz } from './ProfileQuiz';
import { useMemoryManager, type MemoryConfirmation } from './useMemoryManager';

/** 问卷的几个阶段共用一个场景，形象在阶段间连着 */
const QUIZ_STAGES = ['intro', 'quiz', 'building', 'complete', 'saveFailed'];

/** 二次确认文案（照线上 getConfirmCopy） */
const confirmCopy = (type?: MemoryConfirmation['type']) => {
  switch (type) {
    case 'discard':
      return { title: '放弃修改？', description: '你修改的内容尚未保存，放弃后将不会生效。', confirmText: '放弃' };
    default:
      return { title: '退出填写？', description: '目前的记忆不会被保存。', confirmText: '退出' };
  }
};

/** 记忆管理弹窗：按阶段显示加载 / 失败 / 暂无 / 列表 / 问卷，二次确认是第二层弹窗 */
export function MemoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const manager = useMemoryManager(onClose);
  const { stage, confirmation } = manager;
  const copy = confirmCopy(confirmation?.type);
  const isQuiz = QUIZ_STAGES.includes(stage);

  return (
    <>
      <Dialog open={open} size={800} height={800} title="记忆管理" onOpenChange={(v) => !v && manager.requestClose()}>
        {stage === 'list' && <MemoryList manager={manager} />}
        {isQuiz && (
          <ProfileQuiz
            key="quiz"
            stage={stage}
            questions={manager.questions}
            onStageChange={manager.setStage}
            onSubmit={manager.submitProfile}
            onDone={manager.finishQuiz}
          />
        )}
        {stage === 'empty' && (
          <div className="app-memory__scene app-memory__scene--center">
            <EmptyState
              title="暂无记忆"
              action={
                <Button size={32} variant="secondary-muted" onClick={manager.startQuiz}>
                  去完善
                </Button>
              }
            />
          </div>
        )}
        {stage === 'loading' && (
          <div className="app-memory__scene app-memory__scene--center">
            <Loading size={40}>记忆加载中</Loading>
          </div>
        )}
        {stage === 'failed' && (
          <div className="app-memory__scene app-memory__scene--center">
            <EmptyState
              title="记忆加载失败"
              action={
                <Button size={32} variant="secondary-muted" onClick={() => void manager.load()}>
                  重试
                </Button>
              }
            />
          </div>
        )}
      </Dialog>
      <Dialog
        open={!!confirmation}
        size={400}
        title={copy.title}
        description={copy.description}
        onOpenChange={(v) => !v && manager.closeConfirmation()}
        footer={
          <>
            <Button size={36} variant="secondary" onClick={manager.closeConfirmation}>
              取消
            </Button>
            <Button
              size={36}
              variant="primary"
              onClick={() => {
                confirmation?.run();
                manager.closeConfirmation();
              }}
            >
              {copy.confirmText}
            </Button>
          </>
        }
      />
    </>
  );
}
