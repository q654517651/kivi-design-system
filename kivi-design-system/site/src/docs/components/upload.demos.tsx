import { AddTile, UploadRing, type IconName } from '@kivi';
import { Playground } from '@shell';

// 上传页的两个属性面板：所有状态都在面板里切。参数表在 upload.mdx

// ---------- AddTile ----------

type AddTileState = { icon: string; label: boolean; text: string; state: string };

export function AddTilePlayground() {
  return (
    <Playground<AddTileState>
      controls={[
        { key: 'icon', label: '图标', type: 'segment', value: 'AddSmall', options: [['AddSmall', 'AddSmall'], ['LoraModel', 'LoraModel']] },
        { key: 'label', label: '显示文字', type: 'toggle', value: false },
        { key: 'text', label: '文字', type: 'text', value: 'Lora' },
        { key: 'state', label: '状态', type: 'segment', value: 'default', options: [['default', '默认'], ['hover', '悬停'], ['disabled', '禁用']] },
      ]}
      rules={(s) => (s.label ? {} : { text: true })}
      render={(s) => (
        <AddTile
          icon={s.icon as IconName}
          label={s.label ? s.text : undefined}
          className={s.state === 'hover' ? 'is-hover' : undefined}
          disabled={s.state === 'disabled' || undefined}
        />
      )}
    />
  );
}

// ---------- UploadRing ----------

type UploadRingState = { progress: string };

export function UploadRingPlayground() {
  return (
    <Playground<UploadRingState>
      controls={[{ key: 'progress', label: '进度', type: 'segment', value: '40', options: [['0', '0%'], ['40', '40%'], ['75', '75%'], ['100', '100%']] }]}
      media={() => true}
      render={(s) => <UploadRing progress={Number(s.progress)} />}
    />
  );
}
