import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, QrCode, Ticket } from 'lucide-react'
import Poster from '../../components/Poster'
import Modal from '../../components/Modal'
import * as M from '../../data/mock'
import type { Booking } from '../../data/types'
import { useBookings, useMe, useStore, venueOf } from '../../store'
import { cx, fmtDate, won } from '../../lib/format'
import { MobileTicket, PgModal } from './ui'
import { bookingTone, cancelRule, daysBetween, ticketTypeOf } from './perf'

const PERIODS = [['1m', '1개월'], ['3m', '3개월'], ['all', '전체']] as const

export function MyBookings() {
  const me = useMe()!
  const all = useBookings()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>('3m')
  const [openId, setOpenId] = useState<string | null>(null)
  const list = useMemo(() => all.filter(b => b.userId === me.id)
    .filter(b => period === 'all' || daysBetween(b.createdAt.slice(0, 10), M.TODAY) <= (period === '1m' ? 31 : 92))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [all, me.id, period])
  const open = all.find(b => b.id === openId)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">예매 확인/취소</h2>
        <div role="group" aria-label="조회 기간" className="inline-flex rounded-lg bg-paper p-1">
          {PERIODS.map(([k, l]) => (
            <button key={k} aria-pressed={period === k} onClick={() => setPeriod(k)}
              className={cx('rounded-md px-3 py-1.5 text-xs font-bold', period === k ? 'bg-white text-brand-600 shadow-sm' : 'text-muted')}>{l}</button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">예매일 기준 · 총 {list.length}건</p>
      <ul className="mt-4 space-y-3">
        {list.map(b => {
          const p = perfs.find(x => x.id === b.perfId)
          const r = rounds.find(x => x.id === b.roundId)
          if (!p) return null
          const live = b.seats.filter(s => !s.cancelled)
          return (
            <li key={b.id} className="card flex gap-4 p-4">
              <div className="hidden w-20 shrink-0 overflow-hidden rounded-xl sm:block"><Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cx('chip', bookingTone(b.status))}>{b.status}</span>
                  {b.packageOrderId && <span className="chip bg-violet-100 text-violet-700">패키지</span>}
                  <span className="font-mono text-xs text-muted">{b.id}</span>
                </div>
                <p className="mt-1.5 font-bold">{p.title}</p>
                <p className="text-sm text-muted">{r ? `${fmtDate(r.date)} ${r.time}` : '-'} · {venueOf(p).name}</p>
                <p className="text-sm text-muted">{live.length}매 {live.length ? `(${live.map(s => s.seatId).join(', ')})` : ''} · {won(b.total)} · {b.payMethod}</p>
                {b.status === '입금대기' && b.vaccount && <p className="mt-1 text-xs font-semibold text-amber-700">입금기한 {b.vaccount.due} · {b.vaccount.bank} {b.vaccount.no}</p>}
              </div>
              <div className="flex shrink-0 flex-col justify-center gap-1.5">
                <button className="btn-primary btn-sm" onClick={() => setOpenId(b.id)}>상세·취소</button>
                {live.length > 0 && ['예매완료', '발권완료', '부분취소'].includes(b.status) && (
                  <button className="btn-outline btn-sm" onClick={() => setOpenId(b.id)} aria-label={`${p.title} 모바일 티켓`}><QrCode size={13} />티켓</button>
                )}
              </div>
            </li>
          )
        })}
        {!list.length && (
          <li className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">
            <Ticket className="mx-auto mb-2" />조회 기간 내 예매 내역이 없습니다.
            <div className="mt-4"><Link to="/site/performances" className="btn-primary btn-sm">공연 보러 가기</Link></div>
          </li>
        )}
      </ul>
      {open && <BookingDetail b={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function BookingDetail({ b, onClose }: { b: Booking; onClose: () => void }) {
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const cancelSeats = useStore(s => s.cancelSeats)
  const patchBooking = useStore(s => s.patchBooking)
  const sendSms = useStore(s => s.sendSms)
  const toast = useStore(s => s.toast)
  const p = perfs.find(x => x.id === b.perfId)!
  const r = rounds.find(x => x.id === b.roundId)
  const rule = cancelRule(b, r)
  const [pick, setPick] = useState<string[]>([])
  const [tab, setTab] = useState<'info' | 'ticket'>('info')
  const [pg, setPg] = useState(false)
  const live = b.seats.filter(s => !s.cancelled)
  const waiting = b.status === '입금대기'
  const picked = b.seats.filter(s => pick.includes(s.seatId))
  const cancelFee = waiting ? 0 : picked.reduce((a, s) => a + rule.feeFor(s), 0)
  const couponShare = b.couponDiscount && live.length ? Math.round(b.couponDiscount * picked.length / live.length) : 0
  const refund = Math.max(0, picked.reduce((a, s) => a + s.price, 0) - cancelFee - couponShare)
  const canTicket = live.length > 0 && !waiting && b.status !== '취소완료'

  const doCancel = () => {
    if (!pick.length) { toast('취소할 좌석을 선택해주세요', 'warn'); return }
    const msg = `${pick.length}매를 취소하시겠습니까?\n취소수수료 ${won(cancelFee)} / 환불 예정액 ${won(waiting ? 0 : refund)}`
    if (!confirm(msg)) return
    cancelSeats(b.id, pick, `고객 직접 취소 · 수수료 ${won(cancelFee)}`)
    toast(`${pick.length}매 취소가 완료되었습니다`)
    setPick([])
  }

  return (
    <>
      <Modal open={!pg} onClose={onClose} title="예매 상세" size="lg">
        <div className="mb-4 flex gap-2" role="tablist">
          <button role="tab" aria-selected={tab === 'info'} onClick={() => setTab('info')} className={cx('rounded-lg px-3 py-1.5 text-sm font-bold', tab === 'info' ? 'bg-ink text-white' : 'bg-paper text-muted')}>예매 정보·취소</button>
          <button role="tab" aria-selected={tab === 'ticket'} disabled={!canTicket} onClick={() => setTab('ticket')} className={cx('rounded-lg px-3 py-1.5 text-sm font-bold disabled:opacity-40', tab === 'ticket' ? 'bg-ink text-white' : 'bg-paper text-muted')}>모바일 티켓</button>
        </div>
        {tab === 'ticket' && canTicket ? (
          <div className="rounded-2xl bg-paper py-6"><MobileTicket b={b} perf={p} round={r} /></div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="flex gap-4">
              <div className="w-20 shrink-0 overflow-hidden rounded-xl"><Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" /></div>
              <dl className="grid flex-1 grid-cols-[72px_1fr] gap-y-1">
                <dt className="text-muted">공연</dt><dd className="font-bold">{p.title}</dd>
                <dt className="text-muted">일시</dt><dd>{r ? `${fmtDate(r.date)} ${r.time} (${r.no}회)` : '-'}</dd>
                <dt className="text-muted">예매번호</dt><dd className="font-mono">{b.id}</dd>
                <dt className="text-muted">상태</dt><dd><span className={cx('chip', bookingTone(b.status))}>{b.status}</span></dd>
                <dt className="text-muted">결제</dt><dd>{b.payMethod} · {won(b.total)}{b.fee ? ` (수수료 ${won(b.fee)})` : ''}{b.couponDiscount ? ` · 쿠폰 -${won(b.couponDiscount)}` : ''}</dd>
              </dl>
            </div>

            {waiting && b.vaccount && (
              <div className="rounded-xl bg-sun-300/30 p-4 ring-1 ring-sun-400">
                <p className="font-bold">가상계좌 입금 대기</p>
                <p className="mt-1">{b.vaccount.bank} <b className="font-mono">{b.vaccount.no}</b> · {won(b.total)} · 기한 {b.vaccount.due}</p>
                <button className="btn-primary btn-sm mt-3" onClick={() => setPg(true)}><CreditCard size={14} />신용카드로 결제 변경</button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <p className="font-bold">좌석 · 권종</p>
                <p className={cx('text-xs font-semibold', rule.allowed ? 'text-brand-600' : 'text-coral-500')}>{waiting ? '입금 전 취소 — 수수료 없음' : rule.label}</p>
              </div>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {b.seats.map(s => {
                  const can = !s.cancelled && !s.used && rule.allowed
                  return (
                    <li key={s.seatId}>
                      <label className={cx('flex items-center gap-3 px-3 py-2.5', can ? 'cursor-pointer' : 'opacity-60')}>
                        <input type="checkbox" className="h-4 w-4 accent-coral-500" disabled={!can} checked={pick.includes(s.seatId)}
                          onChange={e => setPick(c => e.target.checked ? [...c, s.seatId] : c.filter(x => x !== s.seatId))} aria-label={`${s.seatId} 좌석 취소 선택`} />
                        <span className="w-14 font-bold">{s.seatId}</span>
                        <span className="flex-1 text-muted">{M.gradeLabel[s.grade]} · {ticketTypeOf(s.ticketTypeId)?.name}</span>
                        <span className={cx(s.cancelled && 'line-through')}>{won(s.price)}</span>
                        {s.cancelled && <span className="chip bg-gray-100 text-gray-500">취소</span>}
                        {s.used && <span className="chip bg-mint-400/15 text-mint-500">입장</span>}
                      </label>
                    </li>
                  )
                })}
              </ul>
              {pick.length > 0 && (
                <dl className="mt-3 space-y-1 rounded-xl bg-paper p-3" aria-live="polite">
                  <div className="flex justify-between"><dt>취소 좌석</dt><dd>{pick.join(', ')}</dd></div>
                  <div className="flex justify-between"><dt>취소 수수료</dt><dd className="text-coral-500">{won(cancelFee)}</dd></div>
                  {couponShare > 0 && <div className="flex justify-between"><dt>쿠폰 할인분 차감</dt><dd className="text-coral-500">-{won(couponShare)}</dd></div>}
                  <div className="flex justify-between font-bold"><dt>환불 예정액</dt><dd className="text-brand-600">{waiting ? '입금 전 (환불 없음)' : won(refund)}</dd></div>
                </dl>
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {rule.allowed && live.length > 1 && <button className="btn-ghost btn-sm" onClick={() => setPick(live.filter(s => !s.used).map(s => s.seatId))}>전체 선택</button>}
                <button className="btn-danger btn-sm" disabled={!pick.length} onClick={doCancel}>{pick.length && pick.length < live.length ? `부분 취소 (${pick.length}매)` : '예매 취소'}</button>
              </div>
            </div>

            <div>
              <p className="font-bold">처리 이력</p>
              <ol className="mt-2 space-y-1 border-l-2 border-line pl-3 text-xs text-muted">
                {[{ at: b.createdAt, msg: '예매 접수' }, ...b.logs].map((l, i) => <li key={i}><span className="font-mono">{l.at}</span> · {l.msg}</li>)}
              </ol>
            </div>
          </div>
        )}
      </Modal>
      <PgModal open={pg} amount={b.total} method="신용카드" onClose={() => setPg(false)} onDone={() => {
        patchBooking(b.id, { payMethod: '신용카드', status: '예매완료', vaccount: undefined }, '결제수단 변경: 가상계좌 → 신용카드 결제 완료')
        sendSms(b.bookerPhone, `[국립어린이청소년극단] <${p.title}> 예매번호 ${b.id} 신용카드 결제가 완료되어 예매가 확정되었습니다.`)
        setPg(false); toast('신용카드 결제로 변경되어 예매가 확정되었습니다')
      }} />
    </>
  )
}
