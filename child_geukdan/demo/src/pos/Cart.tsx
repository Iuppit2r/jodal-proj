import { useMemo, useState } from 'react'
import { Banknote, CreditCard, Gift, Smartphone, X } from 'lucide-react'
import { useStore } from '../store'
import * as M from '../data/mock'
import { cx, won } from '../lib/format'
import type { Grade, PayMethod, Performance, Round, SeatPick } from '../data/types'
import { PAY_METHODS, posTag, priceFor, seatLabel, ttById, usePos } from './lib'
import PayTerminal from './PayTerminal'
import { TicketPrintModal } from './Print'

const PAY_ICON: Record<string, typeof CreditCard> = { 신용카드: CreditCard, 현금: Banknote, 간편결제: Smartphone, 초대: Gift }
const POS_TYPES = M.ticketTypes.filter(t => t.active)

export default function Cart({ perf, round, seats, gradeOf, onRemove, onDone }: {
  perf: Performance; round: Round; seats: string[]; gradeOf: (id: string) => Grade
  onRemove: (id: string) => void; onDone: () => void
}) {
  const session = usePos(s => s.session)!
  const addLedger = usePos(s => s.addLedger)
  const [types, setTypes] = useState<Record<string, string>>({})
  const [proofs, setProofs] = useState<Record<string, boolean>>({})
  const [method, setMethod] = useState<PayMethod>('신용카드')
  const [received, setReceived] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [terminal, setTerminal] = useState(false)
  const [printId, setPrintId] = useState<string | null>(null)

  // 초대 결제 → 모든 좌석 초대권
  const changeMethod = (m: PayMethod) => {
    setMethod(m)
    if (m === '초대') setTypes(Object.fromEntries(seats.map(s => [s, 't-inv'])))
    else if (method === '초대') setTypes(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v === 't-inv' ? 't-gen' : v])))
  }

  const lines = useMemo(() => seats.map(id => {
    const grade = gradeOf(id)
    const base = perf.prices[grade] ?? perf.prices.S ?? 0
    const tt = types[id] ?? (method === '초대' ? 't-inv' : 't-gen')
    return { id, grade, base, tt, price: priceFor(base, tt), needsProof: !!ttById(tt)?.needsProof }
  }), [seats, types, perf, gradeOf, method])

  const subtotal = lines.reduce((a, l) => a + l.base, 0)
  const total = lines.reduce((a, l) => a + l.price, 0)
  const discount = subtotal - total
  const change = received - total
  const proofMissing = lines.filter(l => l.needsProof && !proofs[l.id])
  const cashShort = method === '현금' && total > 0 && received < total
  const invMismatch = method === '초대' && total > 0
  const canPay = lines.length > 0 && proofMissing.length === 0 && !cashShort && !invMismatch

  const complete = (approval?: string) => {
    setTerminal(false)
    const st = useStore.getState()
    const picks: SeatPick[] = lines.map(l => ({ seatId: l.id, grade: l.grade, ticketTypeId: l.tt, price: l.price, issued: true }))
    const pm: PayMethod = total === 0 ? '초대' : method
    const b = st.createBooking({
      perfId: perf.id, roundId: round.id, seats: picks, payMethod: pm, channel: '현장', status: '발권완료',
      bookerName: name.trim() || '현장구매', bookerPhone: phone.trim() || '-', viewerName: name.trim() || undefined,
    })
    const proofTxt = lines.filter(l => l.needsProof).map(l => `${l.id}:${ttById(l.tt)?.name}`).join(', ')
    st.patchBooking(b.id, {}, `${posTag(session)} 현장판매 ${pm}${approval ? ` 승인 ${approval}` : ''}${pm === '현금' ? ` / 받은금액 ${won(received)} 거스름 ${won(Math.max(0, change))}` : ''}${proofTxt ? ` / 증빙확인 ${proofTxt}` : ''}`)
    addLedger({ kind: 'sale', bookingId: b.id, method: pm, amount: b.total, approval, seats: picks.map(p => ({ ticketTypeId: p.ticketTypeId, price: p.price })) })
    if (phone.trim()) st.sendSms(phone.trim(), `[국립어린이청소년극단] <${perf.title}> 현장 구매 완료\n예매번호 ${b.id}\n${round.date} ${round.time} / ${picks.map(p => p.seatId).join(', ')}`, 'SMS')
    st.toast(`결제 완료 · ${b.id} (${picks.length}매 ${won(b.total)})`)
    setPrintId(b.id)
    setTypes({}); setProofs({}); setReceived(0); setName(''); setPhone(''); setMethod('신용카드')
    onDone()
  }
  const pay = () => {
    if (!canPay) return
    if (total > 0 && (method === '신용카드' || method === '간편결제')) setTerminal(true)
    else complete()
  }

  return (
    <aside className="flex min-h-0 flex-col border-l border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-sm font-bold">선택 좌석 <b className="text-brand-600">{lines.length}</b>매</span>
        <span className="text-xs text-muted">권종 변경 시 증빙 확인</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">좌석배치도에서 좌석을 누르거나<br />‘비지정 수량 선택’으로 자동 배정하세요.</p>}
        {lines.map(l => (
          <div key={l.id} className={cx('border-b border-line px-3 py-2', l.needsProof && !proofs[l.id] && 'bg-amber-50')}>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: M.gradeColor[l.grade] }} />
              <b className="text-sm">{seatLabel(l.id)}</b>
              <span className="text-xs text-muted">{M.gradeLabel[l.grade]}</span>
              <span className="ml-auto text-sm font-bold tabular-nums">{won(l.price)}</span>
              <button className="btn-ghost h-9 w-9 p-0" onClick={() => onRemove(l.id)} aria-label={`${l.id} 삭제`}><X size={16} /></button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <select className="input min-h-10 py-1.5" value={l.tt} aria-label={`${l.id} 권종`}
                onChange={e => { setTypes(t => ({ ...t, [l.id]: e.target.value })); setProofs(p => ({ ...p, [l.id]: false })) }}>
                {POS_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}{t.discountRate ? ` (-${Math.round(t.discountRate * 100)}%)` : ''}</option>)}
              </select>
              {l.needsProof && (
                <label className={cx('flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs font-bold',
                  proofs[l.id] ? 'border-mint-500 bg-mint-500/10 text-mint-500' : 'border-amber-400 text-amber-700')}>
                  <input type="checkbox" className="h-4 w-4" checked={!!proofs[l.id]} onChange={e => setProofs(p => ({ ...p, [l.id]: e.target.checked }))} />
                  증빙 확인
                </label>
              )}
            </div>
            {l.needsProof && <p className="mt-0.5 text-[11px] text-amber-700">{ttById(l.tt)?.desc}</p>}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-ink bg-paper px-4 py-3">
        <div className="space-y-0.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">소계</span><span className="tabular-nums">{won(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">할인</span><span className="tabular-nums text-coral-500">-{won(discount)}</span></div>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="font-bold">결제금액</span>
          <span className="text-3xl font-black tabular-nums">{won(total)}</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {PAY_METHODS.map(m => {
            const Icon = PAY_ICON[m]
            return (
              <button key={m} onClick={() => changeMethod(m)}
                className={cx('flex min-h-12 flex-col items-center justify-center rounded-lg border text-xs font-bold',
                  method === m ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-brand-500')}>
                <Icon size={16} />{m}
              </button>
            )
          })}
        </div>
        {method === '현금' && (
          <div className="mt-2 rounded-lg border border-line bg-white p-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-bold">받은 금액</span>
              <input className="input min-h-10 text-right text-lg font-bold tabular-nums" inputMode="numeric" value={received ? received.toLocaleString() : ''}
                placeholder="0" onChange={e => setReceived(Number(e.target.value.replace(/\D/g, '')) || 0)} />
            </div>
            <div className="mt-1.5 grid grid-cols-5 gap-1">
              {[1000, 5000, 10000, 50000].map(v => (
                <button key={v} className="btn-outline min-h-10 px-1 text-xs" onClick={() => setReceived(r => r + v)}>+{v >= 10000 ? `${v / 10000}만` : `${v / 1000}천`}</button>
              ))}
              <button className="btn-outline min-h-10 px-1 text-xs" onClick={() => setReceived(total)}>딱맞게</button>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <button className="text-xs text-muted underline" onClick={() => setReceived(0)}>정정</button>
              <span className={cx('text-sm font-bold', change < 0 ? 'text-coral-500' : 'text-mint-500')}>
                거스름돈 <span className="text-2xl font-black tabular-nums">{won(Math.max(0, change))}</span>
                {change < 0 && <span className="ml-1 text-xs">({won(-change)} 부족)</span>}
              </span>
            </div>
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <input className="input min-h-10" placeholder="관람자명 (선택)" value={name} onChange={e => setName(e.target.value)} />
          <input className="input min-h-10" placeholder="연락처 (문자 발송)" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {invMismatch && <p className="mt-2 text-xs font-bold text-coral-500">초대 결제는 모든 좌석이 초대권이어야 합니다.</p>}
        {proofMissing.length > 0 && <p className="mt-2 text-xs font-bold text-amber-700">할인 증빙 미확인 {proofMissing.length}건 — 신분증·복지카드 확인 후 체크하세요.</p>}
        <button disabled={!canPay} onClick={pay}
          className="btn mt-2 min-h-14 w-full bg-mint-500 text-lg font-extrabold text-white hover:brightness-95">
          {lines.length ? `${won(total)} 결제 · 발권` : '좌석을 선택하세요'}
        </button>
      </div>

      {terminal && <PayTerminal open amount={total} method={method} onApproved={a => complete(a)} onCancel={() => setTerminal(false)} />}
      <TicketPrintModal bookingId={printId} onClose={() => setPrintId(null)} />
    </aside>
  )
}
