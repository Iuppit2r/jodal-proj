import { useMemo, useState } from 'react'
import { Printer, Undo2 } from 'lucide-react'
import Modal from '../components/Modal'
import { findBooking, useBookings, useStore } from '../store'
import * as M from '../data/mock'
import { cx, won } from '../lib/format'
import type { Booking } from '../data/types'
import { isWindowBooking, liveSeats, posTag, roundLabel, seatLabel, sumBy, ttName, usePos } from './lib'
import { TicketPrintModal } from './Print'

const REASONS = ['고객 단순 변심', '관람일 변경', '좌석 변경', '결제수단 변경', '판매 오류 정정', '기타']

export default function SalesView() {
  const bookings = useBookings()
  const performances = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const session = usePos(s => s.session)!
  const addLedger = usePos(s => s.addLedger)
  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cSeats, setCSeats] = useState<string[]>([])
  const [reason, setReason] = useState(REASONS[0])
  const [printId, setPrintId] = useState<string | null>(null)

  const list = useMemo(() => bookings
    .filter(b => b.channel === '현장' && b.createdAt.startsWith(M.TODAY) && (scope === 'all' || isWindowBooking(b, session)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [bookings, scope, session])

  const seatsAll = list.flatMap(b => liveSeats(b))
  const byType = sumBy(seatsAll, s => s.ticketTypeId, s => s.price)
  const byPay = sumBy(list.filter(b => b.status !== '취소완료'), b => b.payMethod, b => liveSeats(b).reduce((a, s) => a + s.price, 0))
  const gross = seatsAll.reduce((a, s) => a + s.price, 0)
  const refunded = list.flatMap(b => b.seats.filter(s => s.cancelled)).reduce((a, s) => a + s.price, 0)

  const target = list.find(b => b.id === cancelId)
  const openCancel = (b: Booking) => { setCancelId(b.id); setCSeats(b.seats.filter(s => !s.cancelled && !s.used).map(s => s.seatId)) }
  const doCancel = () => {
    const b = findBooking(cancelId!)!
    const seats = b.seats.filter(s => cSeats.includes(s.seatId) && !s.cancelled && !s.used)
    if (!seats.length) return
    const amount = seats.reduce((a, s) => a + s.price, 0)
    if (!confirm(`${seats.map(s => s.seatId).join(', ')} ${seats.length}매를 취소하고 ${won(amount)}을(를) ${b.payMethod === '현금' ? '현금으로 환불' : `${b.payMethod} 승인취소`}합니다. 실물 티켓을 회수하셨습니까?`)) return
    const st = useStore.getState()
    st.cancelSeats(b.id, seats.map(s => s.seatId), reason)
    st.patchBooking(b.id, {}, `${posTag(session)} 환불 ${won(amount)} (${b.payMethod}) / 티켓 회수`)
    addLedger({ kind: 'refund', bookingId: b.id, method: b.payMethod, amount, seats: seats.map(s => ({ ticketTypeId: s.ticketTypeId, price: s.price })) })
    st.toast(`취소/환불 완료 · ${won(amount)}`, 'warn')
    setCancelId(null)
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3">
          <h2 className="mr-auto text-lg font-extrabold">오늘 현장 판매내역 <span className="text-sm font-normal text-muted">{M.TODAY}</span></h2>
          {(['mine', 'all'] as const).map(s => (
            <button key={s} onClick={() => setScope(s)} className={cx('btn min-h-11 border', scope === s ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
              {s === 'mine' ? `${session.window}` : '전체 현장'}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {list.length === 0 ? <p className="py-20 text-center text-muted">오늘 판매 내역이 없습니다. 현장판매(F1)에서 판매하세요.</p> : (
            <table className="tbl">
              <thead><tr><th>시각</th><th>예매번호</th><th>공연 / 회차</th><th>좌석 · 권종</th><th>결제</th><th className="text-right">금액</th><th>상태</th><th /></tr></thead>
              <tbody>
                {list.map(b => {
                  const p = performances.find(x => x.id === b.perfId)
                  const r = rounds.find(x => x.id === b.roundId)
                  const net = liveSeats(b).reduce((a, s) => a + s.price, 0)
                  const cancellable = b.seats.some(s => !s.cancelled && !s.used)
                  return (
                    <tr key={b.id} className={cx(b.status === '취소완료' && 'text-muted line-through decoration-coral-400')}>
                      <td className="tabular-nums">{b.createdAt.slice(11)}</td>
                      <td className="font-mono text-xs">{b.id}</td>
                      <td><div className="max-w-[180px] truncate font-semibold">{p?.title}</div><div className="text-xs text-muted">{r && roundLabel(r)}</div></td>
                      <td className="text-xs">{b.seats.map(s => (
                        <div key={s.seatId} className={cx(s.cancelled && 'text-coral-500 line-through')}>{seatLabel(s.seatId)} · {ttName(s.ticketTypeId)}</div>
                      ))}</td>
                      <td>{b.payMethod}</td>
                      <td className="text-right font-bold tabular-nums">{won(net)}</td>
                      <td><span className={cx('chip', b.status === '취소완료' ? 'bg-coral-500/15 text-coral-500' : b.status === '부분취소' ? 'bg-amber-100 text-amber-800' : 'bg-mint-500/15 text-mint-500')}>{b.status}</span></td>
                      <td className="space-x-1 text-right">
                        <button className="btn-outline min-h-10 px-2.5" disabled={b.status === '취소완료'} onClick={() => setPrintId(b.id)} aria-label="재출력"><Printer size={15} /></button>
                        <button className="btn-outline min-h-10 px-2.5 text-coral-500" disabled={!cancellable} onClick={() => openCancel(b)}><Undo2 size={15} /> 취소/환불</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto border-l border-line bg-paper p-4">
        <div className="rounded-xl bg-ink p-4 text-white">
          <div className="text-xs text-white/60">순매출 ({list.length}건 · {seatsAll.length}매)</div>
          <div className="text-3xl font-black tabular-nums">{won(gross)}</div>
          <div className="mt-1 text-xs text-coral-400">취소·환불 {won(refunded)}</div>
        </div>
        <div className="card p-3">
          <h3 className="mb-2 text-sm font-bold">결제수단별</h3>
          {[...byPay].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-sm"><span>{k} <span className="text-muted">{v.count}건</span></span><b className="tabular-nums">{won(v.amount)}</b></div>
          ))}
          {byPay.size === 0 && <p className="text-xs text-muted">-</p>}
        </div>
        <div className="card p-3">
          <h3 className="mb-2 text-sm font-bold">권종별</h3>
          {[...byType].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-sm"><span>{ttName(k)} <span className="text-muted">{v.count}매</span></span><b className="tabular-nums">{won(v.amount)}</b></div>
          ))}
          {byType.size === 0 && <p className="text-xs text-muted">-</p>}
        </div>
      </aside>

      <Modal open={!!target} onClose={() => setCancelId(null)} title={`취소/환불 · ${target?.id ?? ''}`} footer={<>
        <button className="btn-outline min-h-11" onClick={() => setCancelId(null)}>닫기</button>
        <button className="btn-danger min-h-11 px-6" disabled={!cSeats.length} onClick={doCancel}>선택 {cSeats.length}매 취소·환불</button>
      </>}>
        {target && (
          <div className="space-y-3">
            <div className="divide-y divide-line rounded-lg border border-line">
              {target.seats.map(s => {
                const dis = !!s.cancelled || !!s.used
                return (
                  <label key={s.seatId} className={cx('flex min-h-12 items-center gap-3 px-3', dis ? 'opacity-40' : 'cursor-pointer')}>
                    <input type="checkbox" className="h-5 w-5" disabled={dis} checked={cSeats.includes(s.seatId)}
                      onChange={() => setCSeats(c => c.includes(s.seatId) ? c.filter(x => x !== s.seatId) : [...c, s.seatId])} />
                    <span className="flex-1">{seatLabel(s.seatId)} · {ttName(s.ticketTypeId)}</span>
                    <span className="tabular-nums">{won(s.price)}</span>
                    {dis && <span className="chip bg-gray-100">{s.cancelled ? '취소됨' : '입장완료'}</span>}
                  </label>
                )
              })}
            </div>
            <div>
              <label className="label" htmlFor="pos-cancel-reason">취소 사유</label>
              <select id="pos-cancel-reason" className="input min-h-11" value={reason} onChange={e => setReason(e.target.value)}>
                {REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-between rounded-lg bg-coral-500/10 p-3 font-bold text-coral-500">
              <span>환불 금액 ({target.payMethod})</span>
              <span className="tabular-nums">{won(target.seats.filter(s => cSeats.includes(s.seatId)).reduce((a, s) => a + s.price, 0))}</span>
            </div>
            <p className="text-xs text-muted">현장 구매분은 당일 취소 수수료가 없습니다. 카드 결제는 승인취소, 현금은 시재에서 즉시 환불됩니다.</p>
          </div>
        )}
      </Modal>
      <TicketPrintModal bookingId={printId} onClose={() => setPrintId(null)} />
    </div>
  )
}
