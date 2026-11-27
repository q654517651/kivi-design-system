import { useEffect, useState } from 'react';
import { Button, Dialog, Icon, TabItem, Tabs, toast } from '@kivi';
import { AmountPicker } from '../../parts/kiwi/AmountPicker';
import { applyQuota, kiwi, previewQuota, statsOf, useKiwi, type QuotaOp, type QuotaResult } from '../../data/kiwi';
import { handleError } from '../../flows/errors';

/*
  调额度（11-27 原型），单人和批量共用一个弹窗，三步：填写 → 二次确认 → 结果。
  - limit：调整周上限（填调整后的值）。单人、批量都有
  - add：批量增加额度，选周额度（在周上限上加）还是临时额度（单独入账）
  - temp：单人增加 / 减少临时额度
  不合法（周剩余或临时额度会小于 0）的人在填写和确认里都标红，有一个不合法就不能提交。
  批量提交后逐人出结果，失败的能单独重试，成功的不会再做一遍。单人成功直接 Toast 关掉。
*/

export type QuotaMode = 'limit' | 'add' | 'temp';

const TITLE: Record<QuotaMode, [string, string]> = {
  limit: ['调整周上限', '批量调整周上限'],
  add: ['增加额度', '批量增加额度'],
  temp: ['调整临时额度', '批量调整临时额度'],
};

export function QuotaDialog({ mode, memberIds, onClose }: { mode: QuotaMode | null; memberIds: string[]; onClose: () => void }) {
  const members = useKiwi((s) => s.members);
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form');
  const [value, setValue] = useState('');
  const [kind, setKind] = useState<'week' | 'temp'>('temp');
  const [sign, setSign] = useState<'add' | 'sub'>('add');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<QuotaResult[]>([]);

  const open = !!mode;
  const batch = memberIds.length > 1;
  const targets = memberIds.map((id) => members.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const single = !batch ? targets[0] : undefined;

  // 打开时：单人调周上限，先填上现在的值
  useEffect(() => {
    if (!open) return;
    setStep('form');
    setResults([]);
    setKind('temp');
    setSign('add');
    setValue(mode === 'limit' && single ? String(single.weeklyLimit) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const n = Number(value);
  const valid = value !== '' && Number.isInteger(n) && (mode === 'limit' ? n >= 0 : n > 0);
  const op: QuotaOp | null = !valid ? null : mode === 'limit' ? { kind: 'set-limit', value: n } : mode === 'add' ? (kind === 'week' ? { kind: 'add-limit', value: n } : { kind: 'temp', value: n }) : { kind: 'temp', value: sign === 'add' ? n : -n };
  const previews = op ? targets.map((m) => ({ m, ...previewQuota(m, op) })) : [];
  const invalid = previews.filter((p) => p.error);
  const canNext = !!op && !invalid.length;

  const opLabel = !op ? '' : op.kind === 'set-limit' ? '调整周上限' : op.kind === 'add-limit' ? '增加周额度（周上限）' : op.value >= 0 ? '增加临时额度' : '减少临时额度';
  const unitLabel = op?.kind === 'temp' ? '临时额度' : '周上限';

  const submit = async (ids: string[], retry = false) => {
    if (!op) return;
    setBusy(true);
    try {
      const res = await applyQuota(ids, op, { retry });
      const merged = retry ? results.map((r) => res.find((x) => x.id === r.id) ?? r) : res;
      setResults(merged);
      if (!batch && merged.every((r) => r.ok)) {
        toast.success(`已${opLabel}`);
        onClose();
        return;
      }
      if (!batch) {
        toast.error(merged[0]?.error ?? '操作失败');
        setStep('form');
        return;
      }
      setStep('result');
      if (merged.every((r) => r.ok)) toast.success(`${merged.length} 人都已${opLabel}`);
    } catch (e) {
      handleError(e); // 失败时弹窗和填的内容都留着
    } finally {
      setBusy(false);
    }
  };

  const failed = results.filter((r) => !r.ok);
  const nameOf = (id: string) => kiwi.get().members.find((m) => m.id === id)?.name ?? id;

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;
  if (step === 'form') {
    body = (
      <div className="app-kw-form">
        {single && (
          <p className="app-kw-summary">
            {single.name} · 周上限 {single.weeklyLimit.toLocaleString()} · 本周已用 {statsOf(single).weekUsed.toLocaleString()} · 本周剩余 {statsOf(single).weekLeft.toLocaleString()} · 临时额度 {statsOf(single).tempLeft.toLocaleString()}
          </p>
        )}
        {batch && <p className="app-kw-summary">已选 {targets.length} 人，只对勾选的人生效</p>}
        {mode === 'add' && (
          <div className="app-kw-form__field">
            <span>额度类型</span>
            <Tabs variant="segment" value={kind} onChange={(v) => setKind(v as typeof kind)}>
              <TabItem value="temp">临时额度</TabItem>
              <TabItem value="week">周额度</TabItem>
            </Tabs>
            <span className="app-kw-form__hint">{kind === 'week' ? '加在现有周上限上，以后每周都按新上限发放' : '单独入账，不随周清零，先扣完周额度才扣它'}</span>
          </div>
        )}
        {mode === 'temp' && (
          <div className="app-kw-form__field">
            <span>操作</span>
            <Tabs variant="segment" value={sign} onChange={(v) => setSign(v as typeof sign)}>
              <TabItem value="add">增加</TabItem>
              <TabItem value="sub">减少</TabItem>
            </Tabs>
          </div>
        )}
        <div className="app-kw-form__field">
          <span>{mode === 'limit' ? '调整后的周上限' : '数量'}</span>
          <AmountPicker value={value} onChange={setValue} placeholder={mode === 'limit' ? '调整后的周上限' : '正整数'} />
          {value !== '' && !valid && <span className="app-kw-form__error">请填{mode === 'limit' ? '不小于 0 的整数' : '正整数'}</span>}
          {single && op && !previews[0]?.error && (
            <span className="app-kw-form__hint">
              {unitLabel} {previews[0].before.toLocaleString()} → {previews[0].after.toLocaleString()}
            </span>
          )}
          {invalid.length > 0 && <span className="app-kw-form__error">{batch ? `${invalid.length} 人${invalid[0].error}（${invalid.map((p) => p.m.name).join('、')}）` : invalid[0].error}</span>}
        </div>
      </div>
    );
    footer = (
      <>
        <Button size={36} variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button size={36} variant="primary" disabled={!canNext} onClick={() => setStep('confirm')}>
          下一步
        </Button>
      </>
    );
  } else if (step === 'confirm') {
    body = (
      <>
        <p className="app-kw-summary">
          {opLabel} · {op?.kind === 'set-limit' ? `调整为 ${n.toLocaleString()}` : `${Math.abs(op?.value ?? 0).toLocaleString()} 猕猴桃`} · 影响 {targets.length} 人
        </p>
        <ul className="app-kw-diff">
          {previews.map((p) => (
            <li key={p.m.id}>
              <span>{p.m.name}</span>
              <span className="app-kw-diff__value">
                {unitLabel} {p.before.toLocaleString()} → {p.after.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
    footer = (
      <>
        <Button size={36} variant="secondary" disabled={busy} onClick={() => setStep('form')}>
          返回修改
        </Button>
        <Button size={36} variant="primary" loading={busy} onClick={() => submit(targets.map((m) => m.id))}>
          确认{batch ? `（${targets.length} 人）` : ''}
        </Button>
      </>
    );
  } else {
    body = (
      <>
        <p className="app-kw-summary">
          成功 {results.length - failed.length} 人{failed.length ? `，失败 ${failed.length} 人` : ''}
        </p>
        <ul className="app-kw-diff">
          {results.map((r) => (
            <li key={r.id}>
              <span>{nameOf(r.id)}</span>
              <span className={r.ok ? 'app-kw-plus' : 'app-kw-danger'}>
                {r.ok ? (
                  <>
                    <Icon name="CheckSmall" size={16} /> 成功
                  </>
                ) : (
                  `失败：${r.error}`
                )}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
    footer = (
      <>
        {failed.length > 0 && (
          <Button size={36} variant="secondary" loading={busy} onClick={() => submit(failed.map((r) => r.id), true)}>
            重试失败的 {failed.length} 人
          </Button>
        )}
        <Button size={36} variant="primary" disabled={busy} onClick={onClose}>
          完成
        </Button>
      </>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && !busy && onClose()}
      // 填写、确认、结果三步内容不一样长，弹窗高度定死不跳（设计规则 · 浮层），放不下在里面滚
      size={560}
      height={560}
      title={step === 'confirm' ? `确认${mode ? TITLE[mode][batch ? 1 : 0] : ''}` : step === 'result' ? '操作结果' : mode ? TITLE[mode][batch ? 1 : 0] : ''}
      footer={footer}
    >
      {body}
    </Dialog>
  );
}
