import { useState } from 'react'
import { LogOut, Printer } from 'lucide-react'
import { nowStr, useStore } from '../store'
import { cx, won } from '../lib/format'
import type { PayMethod } from '../data/types'
import { PAY_METHODS, ttName, usePos, type LedgerEntry } from './lib'
import { PrintPortal } from './Print'

const DENOMS = [50000, 10000, 5000, 1000, 500, 100]

function summarize(ledger: LedgerEntry[]) {
  const pay = new Map<PayMethod, { sale: number; saleCnt: number; refund: number; refundCnt: number }>()
  for (const m of PAY_METHODS) pay.set(m, { sale: 0, saleCnt: 0, refund: 0, refundCnt: 0 })
  const types = new Map<string, { qty: number; amount: number }>()
  for (const e of ledger) {
    const row = pay.get(e.method) ?? { sale: 0, saleCnt: 0, refund: 0, refundCnt: 0 }
    const sign = e.kind === 'refund' ? -1 : 1
    if (e.kind === 'refund') { row.refund += e.amount; row.refundCnt++ } else { row.sale += e.amount; row.saleCnt++ }
    pay.set(e.method, row)
    for (const s of e.seats) {
      const t = types.get(s.ticketTypeId) ?? { qty: 0, amount: 0 }
      t.qty += sign; t.amount += sign * s.price
      types.set(s.ticketTypeId, t)
    }
  }
  return { pay, types }
}

export default function CloseView() {
  const session = usePos(s => s.session)!
  const ledger = usePos(s => s.ledger)
  const closeSession = usePos(s => s.closeSession)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [closedAt] = useState(nowStr)

  const { pay, types } = summarize(ledger)
  const cash = pay.get('현금')!
  const expected = session.float + cash.sale - cash.refund
  const actual = DENOMS.reduce((a, d) => a + d * (counts[d] ?? 0), 0)
  const counted = Object.values(counts).some(Boolean)
  const diff = actual - expected
  const totalSale = [...pay.values()].reduce((a, r) => a + r.sale, 0)
  const totalRefund = [...pay.values()].reduce((a, r) => a + r.refund, 0)
  const sales = ledger.filter(e => e.kind !== 'refund').length

  const finish = () => {
    if (!counted && !confirm('실제 시재가 입력되지 않았습니다. 그대로 마감할까요?')) return
    if (counted && diff !== 0 && !confirm(`시재 차액 ${diff > 0 ? '+' : ''}${won(diff)}이 있습니다. 사유를 보고 후 마감하시겠습니까?`)) return
    if (!confirm(`${session.window} 창구를 마감하고 로그아웃합니다.`)) return
    const st = useStore.getState()
    st.log('현장판매 창구 마감', `${session.window} / ${session.staffId} / 순매출 ${won(totalSale - totalRefund)} / 시재차액 ${won(counted ? diff : 0)}`)
    st.toast(`${session.window} 마감 완료. 수고하셨습니다.`)
    closeSession()
  }

  const renderReport = (print?: boolean) => (
    <div className={cx('space-y-4', print && 'mx-auto max-w-[720px] p-2 text-[12px]')}>
      {print && (
        <div className="border-b-2 border-ink pb-2">
          <div className="text-lg font-extrabold">현장판매 창구 마감 보고서</div>
          <div>국립어린이청소년극단 · {session.window} · 근무자 {session.staffName}({session.staffId}) · 개점 {session.openedAt} · 마감 {closedAt}</div>
        </div>
      )}
      <table className="tbl">
        <thead><tr><th>결제수단</th><th className="text-right">판매 건수</th><th className="text-right">판매 금액</th><th className="text-right">환불 건수</th><th className="text-right">환불 금액</th><th className="text-right">순매출</th></tr></thead>
        <tbody>
          {[...pay].map(([m, r]) => (
            <tr key={m}><td className="font-semibold">{m}</td><td className="text-right">{r.saleCnt}</td><td className="text-right tabular-nums">{won(r.sale)}</td>
              <td className="text-right">{r.refundCnt}</td><td className="text-right tabular-nums text-coral-500">{r.refund ? `-${won(r.refund)}` : '0원'}</td>
              <td className="text-right font-bold tabular-nums">{won(r.sale - r.refund)}</td></tr>
          ))}
          <tr className="bg-paper font-extrabold"><td>합계</td><td className="text-right">{sales}</td><td className="text-right tabular-nums">{won(totalSale)}</td>
            <td className="text-right">{ledger.length - sales}</td><td className="text-right tabular-nums text-coral-500">-{won(totalRefund)}</td>
            <td className="text-right tabular-nums">{won(totalSale - totalRefund)}</td></tr>
        </tbody>
      </table>
      <table className="tbl">
        <thead><tr><th>권종</th><th className="text-right">순 판매 수량</th><th className="text-right">금액</th></tr></thead>
        <tbody>
          {[...types].map(([k, v]) => <tr key={k}><td>{ttName(k)}</td><td className="text-right">{v.qty}매</td><td className="text-right tabular-nums">{won(v.amount)}</td></tr>)}
          {types.size === 0 && <tr><td colSpan={3} className="text-center text-muted">판매 내역 없음</td></tr>}
        </tbody>
      </table>
      <table className="tbl">
        <tbody>
          <tr><td>시작 시재</td><td className="text-right tabular-nums">{won(session.float)}</td></tr>
          <tr><td>+ 현금 매출 (판매·현장수납)</td><td className="text-right tabular-nums">{won(cash.sale)}</td></tr>
          <tr><td>− 현금 환불</td><td className="text-right tabular-nums">{won(cash.refund)}</td></tr>
          <tr className="font-bold"><td>= 예상 시재</td><td className="text-right tabular-nums">{won(expected)}</td></tr>
          <tr className="font-bold"><td>실제 시재</td><td className="text-right tabular-nums">{counted ? won(actual) : '미입력'}</td></tr>
          <tr className="font-extrabold"><td>차액</td><td className={cx('text-right tabular-nums', diff === 0 ? 'text-mint-500' : 'text-coral-500')}>{counted ? `${diff > 0 ? '+' : ''}${won(diff)}` : '-'}</td></tr>
        </tbody>
      </table>
      {print && <div className="grid grid-cols-2 gap-8 pt-8 text-center"><div className="border-t border-ink pt-1">근무자 확인 (인)</div><div className="border-t border-ink pt-1">매표 책임자 확인 (인)</div></div>}
    </div>
  )

  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_380px]">
      <section className="min-h-0 overflow-y-auto bg-white p-5">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="mr-auto">
            <h2 className="text-xl font-extrabold">창구 정산 · {session.window}</h2>
            <p className="text-sm text-muted">근무자 {session.staffName}({session.staffId}) · 개점 {session.openedAt} · 수납 {ledger.length}건</p>
          </div>
          <div className="text-right"><div className="text-xs text-muted">순매출</div><div className="text-4xl font-black tabular-nums">{won(totalSale - totalRefund)}</div></div>
        </div>
        {renderReport()}
      </section>
      <aside className="flex min-h-0 flex-col border-l border-line bg-paper">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <h3 className="mb-2 text-sm font-bold">실제 시재 입력 (권종별 매수)</h3>
          <div className="space-y-1.5">
            {DENOMS.map(d => (
              <div key={d} className="flex items-center gap-2">
                <span className="w-20 text-right text-sm font-semibold tabular-nums">{d.toLocaleString()}원</span>
                <span className="text-muted">×</span>
                <input className="input min-h-11 w-24 text-right text-lg font-bold tabular-nums" inputMode="numeric" value={counts[d] ?? ''} placeholder="0"
                  onChange={e => setCounts(c => ({ ...c, [d]: Number(e.target.value.replace(/\D/g, '')) || 0 }))} aria-label={`${d}원 매수`} />
                <span className="ml-auto text-sm tabular-nums">{won(d * (counts[d] ?? 0))}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 rounded-xl bg-white p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">예상 시재</span><b className="tabular-nums">{won(expected)}</b></div>
            <div className="flex justify-between"><span className="text-muted">실제 시재</span><b className="tabular-nums">{won(actual)}</b></div>
            <div className={cx('mt-2 flex items-baseline justify-between rounded-lg p-2', !counted ? 'bg-paper' : diff === 0 ? 'bg-mint-500/15 text-mint-500' : 'bg-coral-500/15 text-coral-500')}>
              <span className="font-bold">차액</span>
              <span className="text-2xl font-black tabular-nums">{counted ? `${diff > 0 ? '+' : ''}${won(diff)}` : '-'}</span>
            </div>
            {counted && diff === 0 && <p className="text-xs font-bold text-mint-500">시재가 일치합니다.</p>}
          </div>
        </div>
        <div className="space-y-2 border-t border-line p-3">
          <button className="btn-outline min-h-12 w-full" onClick={() => setTimeout(() => window.print(), 50)}><Printer size={18} /> 마감 보고서 출력</button>
          <button className="btn min-h-14 w-full bg-ink text-base text-white hover:bg-black" onClick={finish}><LogOut size={18} /> 마감 · 로그아웃</button>
        </div>
      </aside>
      <PrintPortal>{renderReport(true)}</PrintPortal>
    </div>
  )
}
