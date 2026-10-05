import { useMemo, useState } from 'react'
import { ArrowRight, Ban, CheckCircle2, FileText, Hourglass, Send, Undo2, Wallet } from 'lucide-react'
import { useStore } from '../../../store'
import { useAdminLocal, type PayStatus, type SettleStatus } from '../../adminStore'
import { ask, Card, DataTable, ExportButtons, Field, FilterBar, Kpi, Note, Status, type Col } from '../../ui'
import { num } from '../../lib'
import { cx, won } from '../../../lib/format'
import { DEFAULT_STATE, useSettleRows, type SettleRow } from './data'
import Statement from './Statement'

type St = { status: SettleStatus; pay: PayStatus; prevStatus?: SettleStatus; memo?: string }
const FLOW: SettleStatus[] = ['정산대기', '업체승인대기', '정산완료']

export default function SettleTab() {
  const rows = useSettleRows()
  const settle = useAdminLocal(s => s.settle)
  const setLocal = useAdminLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const sendSms = useStore(s => s.sendSms)
  const [q, setQ] = useState({ text: '', status: '', pay: '' })
  const [applied, setApplied] = useState(q)
  const [doc, setDoc] = useState<SettleRow | null>(null)

  const stOf = (id: string): St => settle[id] ?? DEFAULT_STATE[id] ?? { status: '정산대기', pay: '미지급' }

  const view = useMemo(() => rows.filter(r => {
    const st = settle[r.id] ?? DEFAULT_STATE[r.id] ?? { status: '정산대기', pay: '미지급' }
    if (applied.text && !`${r.title}${r.producer}${r.id}`.includes(applied.text)) return false
    if (applied.status && st.status !== applied.status) return false
    if (applied.pay && st.pay !== applied.pay) return false
    return true
  }), [rows, settle, applied])

  const kpi = useMemo(() => {
    let wait = 0, waitAmt = 0, done = 0, hold = 0
    for (const r of rows) {
      const st = settle[r.id] ?? DEFAULT_STATE[r.id] ?? { status: '정산대기', pay: '미지급' }
      if (st.status === '보류') hold++
      else if (st.status !== '정산완료') { wait++; waitAmt += r.payout }
      if (st.pay === '지급완료') done += r.payout
    }
    return { wait, waitAmt, done, hold }
  }, [rows, settle])

  const update = (r: SettleRow, patch: Partial<St>, action: string) => {
    const cur = useAdminLocal.getState().settle[r.id] ?? DEFAULT_STATE[r.id] ?? { status: '정산대기', pay: '미지급' }
    setLocal({ settle: { ...useAdminLocal.getState().settle, [r.id]: { ...cur, ...patch } } })
    log(action, `${r.title} (${r.id})`)
    toast(`${r.title} · ${action}`)
  }

  const confirm = async (r: SettleRow, title: string, message: string, tone: 'warn' | 'danger' = 'warn') =>
    (await ask({ title, tone, confirmText: '진행', message: <><b>&lt;{r.title}&gt;</b> ({r.producer})<br />{message}</> })) !== null

  const act = {
    request: async (r: SettleRow) => {
      if (!(await confirm(r, '정산 확정', `지급액 ${won(r.payout)}으로 정산을 확정하고 기획사에 승인을 요청합니다.`))) return
      update(r, { status: '업체승인대기' }, '정산 확정 → 업체승인 요청')
      sendSms(`${r.producer} 정산담당`, `[국립어린이청소년극단] <${r.title}> 정산서(${r.id})가 발행되었습니다. 지급액 ${won(r.payout)} — 승인 바랍니다.`, '메일')
    },
    approve: async (r: SettleRow) => {
      if (!(await confirm(r, '업체 승인 처리', '기획사 승인 회신을 확인하였습니까? 정산완료 처리 후에는 금액 수정이 불가합니다.'))) return
      update(r, { status: '정산완료' }, '업체 승인 확인 → 정산완료')
    },
    hold: async (r: SettleRow) => {
      const reason = await ask({ title: '정산 보류', tone: 'danger', confirmText: '보류', message: <><b>&lt;{r.title}&gt;</b> 정산을 보류합니다. 보류 사유는 변경이력에 기록됩니다.</>, reasonOptions: ['판매 금액 이의 제기', '계약서 확인 필요', '세금계산서 미수취', '현장 매출 정산 대기'] })
      if (reason === null) return
      const cur = stOf(r.id)
      update(r, { status: '보류', prevStatus: cur.status, memo: reason }, `정산 보류(사유: ${reason})`)
    },
    release: async (r: SettleRow) => {
      const cur = stOf(r.id)
      if (!(await confirm(r, '보류 해지', `보류를 해지하고 이전 상태(${cur.prevStatus ?? '정산대기'})로 복원합니다.`))) return
      update(r, { status: cur.prevStatus ?? '정산대기', prevStatus: undefined, memo: undefined }, `보류 해지 → ${cur.prevStatus ?? '정산대기'}`)
    },
    payReq: async (r: SettleRow) => {
      if (!(await confirm(r, '지급 요청', `재무팀에 ${won(r.payout)} 지급을 요청합니다.`))) return
      update(r, { pay: '지급요청' }, '정산금 지급요청')
    },
    paid: async (r: SettleRow) => {
      if (!(await confirm(r, '지급 완료 처리', `${won(r.payout)} 이체 완료를 확인하였습니까?`))) return
      update(r, { pay: '지급완료' }, '정산금 지급완료')
      sendSms(`${r.producer} 정산담당`, `[국립어린이청소년극단] <${r.title}> 정산금 ${won(r.payout)} 지급이 완료되었습니다.`, '메일')
    },
  }

  const cols: Col<SettleRow>[] = [
    { key: 'id', header: '정산번호', sort: r => r.id, render: r => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'month', header: '정산월', sort: r => r.month, render: r => r.month },
    {
      key: 'title', header: '공연 / 기획사', sort: r => r.title, render: r => (
        <div className="leading-tight">
          <div className="font-semibold">{r.title}</div>
          <div className="text-[11px] text-muted">{r.producer} · {r.perfFrom.slice(5)}~{r.perfTo.slice(5)}</div>
        </div>
      ),
    },
    { key: 'qty', header: '매수', align: 'right', sort: r => r.qty, render: r => num(r.qty) },
    { key: 'sales', header: '판매금액', align: 'right', sort: r => r.sales, render: r => won(r.sales) },
    { key: 'fee', header: '수수료', align: 'right', sort: r => r.fee, render: r => <span>{won(r.fee)} <span className="text-[11px] text-muted">({r.feeRate}%)</span></span> },
    { key: 'payout', header: '지급액', align: 'right', sort: r => r.payout, render: r => <b className="text-brand-700">{won(r.payout)}</b> },
    {
      key: 'status', header: '정산상태', sort: r => stOf(r.id).status, render: r => {
        const st = stOf(r.id)
        return <div className="leading-tight"><Status s={st.status} />{st.memo && <div className="mt-0.5 max-w-36 truncate text-[10px] text-coral-500" title={st.memo}>{st.memo}</div>}</div>
      },
    },
    { key: 'pay', header: '지급상태', sort: r => stOf(r.id).pay, render: r => <Status s={stOf(r.id).pay} /> },
    {
      key: 'act', header: '처리', render: r => {
        const st = stOf(r.id)
        return (
          <div className="flex items-center gap-1">
            {st.status === '정산대기' && <button className="btn-primary btn-sm" disabled={!r.sales} title={!r.sales ? '판매 실적이 없습니다' : undefined} onClick={() => act.request(r)}><Send size={12} />정산확정</button>}
            {st.status === '업체승인대기' && <button className="btn-primary btn-sm" onClick={() => act.approve(r)}><CheckCircle2 size={12} />업체승인</button>}
            {st.status === '정산완료' && st.pay === '미지급' && <button className="btn-accent btn-sm" onClick={() => act.payReq(r)}><Wallet size={12} />지급요청</button>}
            {st.status === '정산완료' && st.pay === '지급요청' && <button className="btn-accent btn-sm" onClick={() => act.paid(r)}><CheckCircle2 size={12} />지급완료</button>}
            {st.status === '보류' && <button className="btn-outline btn-sm" onClick={() => act.release(r)}><Undo2 size={12} />보류해지</button>}
            {st.status !== '보류' && st.status !== '정산완료' && <button className="btn-ghost btn-sm text-coral-500" onClick={() => act.hold(r)}><Ban size={12} />보류</button>}
            <button className="btn-outline btn-sm" onClick={() => setDoc(r)}><FileText size={12} />정산서</button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="정산 진행중" value={`${kpi.wait}건`} sub={`지급 예정 ${won(kpi.waitAmt)}`} icon={<Hourglass size={18} />} tone="sun" />
        <Kpi label="정산 대상 공연" value={`${rows.length}건`} sub="대관(협력) 공연 기준" icon={<FileText size={18} />} />
        <Kpi label="지급 완료액" value={won(kpi.done)} sub="누적" icon={<Wallet size={18} />} tone="mint" />
        <Kpi label="보류" value={`${kpi.hold}건`} sub="사유 확인 필요" icon={<Ban size={18} />} tone="coral" />
      </div>

      <FilterBar onSearch={() => setApplied(q)} onReset={() => { const e = { text: '', status: '', pay: '' }; setQ(e); setApplied(e) }}>
        <Field label="공연명 / 기획사 / 정산번호"><input className="input" value={q.text} onChange={e => setQ({ ...q, text: e.target.value })} placeholder="검색어" /></Field>
        <Field label="정산상태">
          <select className="input" value={q.status} onChange={e => setQ({ ...q, status: e.target.value })}>
            <option value="">전체</option>{[...FLOW, '보류'].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="지급상태">
          <select className="input" value={q.pay} onChange={e => setQ({ ...q, pay: e.target.value })}>
            <option value="">전체</option>{['미지급', '지급요청', '지급완료'].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="정산 절차">
          <div className="flex flex-wrap items-center gap-1 pt-1.5 text-[11px] font-semibold text-muted">
            {FLOW.map((s, i) => <span key={s} className="flex items-center gap-1">{i > 0 && <ArrowRight size={11} />}<span className={cx('rounded px-1.5 py-0.5', i === 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-paper')}>{s}</span></span>)}
          </div>
        </Field>
      </FilterBar>

      <Card title="대관 공연 정산 내역" sub="판매금액에서 계약 수수료율을 차감한 금액을 기획사에 지급합니다. 자체 제작 공연은 수입금 전액 세입 처리되어 정산 대상에서 제외됩니다."
        actions={<ExportButtons filename="대관정산내역" count={view.length}
          getRows={() => [['정산번호', '정산월', '공연', '기획사', '매수', '판매금액', '수수료율', '수수료', '지급액', '정산상태', '지급상태'],
            ...view.map(r => { const st = stOf(r.id); return [r.id, r.month, r.title, r.producer, r.qty, r.sales, `${r.feeRate}%`, r.fee, r.payout, st.status, st.pay] })]} />}>
        <DataTable columns={cols} rows={view} rowKey={r => r.id} pageSize={10} />
        <Note className="mt-3">정산 상태 흐름: <b>정산대기 → (정산확정) 업체승인대기 → (업체승인) 정산완료 → 지급요청 → 지급완료</b>. 보류 시 직전 상태가 저장되며 보류해지 시 복원됩니다. 모든 처리는 변경이력에 기록됩니다.</Note>
      </Card>

      {doc && <Statement row={doc} state={stOf(doc.id)} onClose={() => setDoc(null)} />}
    </div>
  )
}
