import { useMemo, useState } from 'react'
import { AlertTriangle, Printer, RotateCcw, Search, Undo2 } from 'lucide-react'
import { findBooking, useBookings, useStore } from '../store'
import * as M from '../data/mock'
import { cx, fmtDate, maskPhone, won } from '../lib/format'
import type { Booking, PayMethod } from '../data/types'
import { liveSeats, posTag, roundLabel, seatLabel, ttName, usePos } from './lib'
import PayTerminal from './PayTerminal'
import { TicketPrintModal } from './Print'

type Mode = 'id' | 'name' | 'phone' | 'member' | 'round'
const MODES: { id: Mode; label: string; ph: string }[] = [
  { id: 'id', label: '예매번호', ph: '예: T26100100001' },
  { id: 'name', label: '예매자명', ph: '예: 김시연' },
  { id: 'phone', label: '휴대폰 뒤 4자리', ph: '예: 5678' },
  { id: 'member', label: '회원ID', ph: '예: demo' },
  { id: 'round', label: '공연+일시', ph: '' },
]
const REASONS = ['티켓 분실', '티켓 훼손', '오인쇄·출력 불량', '좌석 변경', '기타']

const statusTone = (s: Booking['status']) =>
  s === '입금대기' ? 'bg-amber-100 text-amber-800' : s === '발권완료' ? 'bg-mint-500/15 text-mint-500' : s === '취소완료' ? 'bg-coral-500/15 text-coral-500' : 'bg-brand-50 text-brand-600'

export default function IssueView() {
  const bookings = useBookings()
  const performances = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const members = useStore(s => s.members)
  const session = usePos(s => s.session)!
  const addLedger = usePos(s => s.addLedger)

  const [mode, setMode] = useState<Mode>('id')
  const [q, setQ] = useState('')
  const [perfId, setPerfId] = useState('p1')
  const [roundId, setRoundId] = useState('')
  const [submitted, setSubmitted] = useState<{ mode: Mode; q: string; roundId: string } | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [reason, setReason] = useState(REASONS[0])
  const [print, setPrint] = useState<{ id: string; seats: string[]; reissue?: boolean } | null>(null)
  const [payMethod, setPayMethod] = useState<PayMethod>('신용카드')
  const [terminal, setTerminal] = useState(false)

  const perfRounds = rounds.filter(r => r.perfId === perfId && r.date >= M.TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const results = useMemo(() => {
    if (!submitted) return []
    const k = submitted.q.trim()
    const pool = bookings.filter(b => b.status !== '취소완료')
    let out: Booking[] = []
    if (submitted.mode === 'id') out = k ? pool.filter(b => b.id.toUpperCase().includes(k.toUpperCase())) : []
    if (submitted.mode === 'name') out = k ? pool.filter(b => b.bookerName.includes(k) || b.viewerName?.includes(k)) : []
    if (submitted.mode === 'phone') out = k.length === 4 ? pool.filter(b => b.bookerPhone.endsWith(k)) : []
    if (submitted.mode === 'member') {
      const ids = members.filter(m => m.loginId.toLowerCase().includes(k.toLowerCase())).map(m => m.id)
      out = k ? pool.filter(b => b.userId && ids.includes(b.userId)) : []
    }
    if (submitted.mode === 'round') out = pool.filter(b => b.roundId === submitted.roundId)
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 80)
  }, [submitted, bookings, members])

  const sel = bookings.find(b => b.id === selId)
  const selPerf = sel && performances.find(p => p.id === sel.perfId)
  const selRound = sel && rounds.find(r => r.id === sel.roundId)

  const search = () => {
    const s = { mode, q, roundId: roundId || perfRounds[0]?.id || '' }
    setSubmitted(s)
    setSelId(null)
  }
  const pick = (b: Booking) => {
    setSelId(b.id)
    setChecked(liveSeats(b).filter(s => !s.issued).map(s => s.seatId))
  }
  const toggle = (id: string) => setChecked(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])

  // 발권 (선택 좌석)
  const issue = () => {
    const b = findBooking(sel!.id)!
    const st = useStore.getState()
    const targets = liveSeats(b).filter(s => checked.includes(s.seatId)).map(s => s.seatId)
    if (!targets.length) return st.toast('발권할 좌석을 선택하세요', 'warn')
    const unissued = liveSeats(b).filter(s => !s.issued).map(s => s.seatId)
    if (unissued.every(id => targets.includes(id))) st.issueBooking(b.id)
    else st.patchBooking(b.id, { seats: b.seats.map(s => targets.includes(s.seatId) && !s.cancelled ? { ...s, issued: true } : s) }, '티켓 부분 발권')
    st.patchBooking(b.id, {}, `${posTag(session)} 현장 발권 (${targets.join(', ')})`)
    setPrint({ id: b.id, seats: targets })
  }
  const reissue = () => {
    const b = findBooking(sel!.id)!
    const targets = liveSeats(b).filter(s => checked.includes(s.seatId) && s.issued).map(s => s.seatId)
    if (!targets.length) return useStore.getState().toast('재발권은 이미 발권된 좌석만 가능합니다', 'warn')
    useStore.getState().patchBooking(b.id, {}, `${posTag(session)} 재발권 (${targets.join(', ')}) / 사유: ${reason}`)
    setPrint({ id: b.id, seats: targets, reissue: true })
  }
  const unissue = () => {
    const b = findBooking(sel!.id)!
    const st = useStore.getState()
    const targets = liveSeats(b).filter(s => checked.includes(s.seatId) && s.issued && !s.used).map(s => s.seatId)
    if (!targets.length) return st.toast('미발권 처리할 발권 좌석(미입장)을 선택하세요', 'warn')
    if (!confirm(`${targets.join(', ')} 좌석을 미발권 상태로 되돌립니다. 회수한 실물 티켓은 폐기하세요.`)) return
    const seats = b.seats.map(s => targets.includes(s.seatId) ? { ...s, issued: false } : s)
    const anyIssued = seats.some(s => !s.cancelled && s.issued)
    st.patchBooking(b.id, { seats, status: b.status === '발권완료' && !anyIssued ? '예매완료' : b.status }, `${posTag(session)} 미발권 처리 (${targets.join(', ')})`)
    st.toast('미발권 처리했습니다')
  }
  // 가상계좌 미입금 → 현장 결제 후 발권
  const collect = (approval?: string) => {
    setTerminal(false)
    const b = findBooking(sel!.id)!
    const st = useStore.getState()
    st.patchBooking(b.id, {
      payMethod, status: '발권완료', vaccount: undefined,
      seats: b.seats.map(s => s.cancelled ? s : { ...s, issued: true }),
    }, `${posTag(session)} 가상계좌 미입금분 현장 결제 (${payMethod}${approval ? ` 승인 ${approval}` : ''}) 후 발권`)
    addLedger({ kind: 'collect', bookingId: b.id, method: payMethod, amount: b.total, approval, seats: liveSeats(b).map(s => ({ ticketTypeId: s.ticketTypeId, price: s.price })) })
    st.toast(`현장 결제 완료 · ${won(b.total)}`)
    setPrint({ id: b.id, seats: liveSeats(b).map(s => s.seatId) })
  }

  const curMode = MODES.find(m => m.id === mode)!
  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_440px]">
      <section className="flex min-h-0 flex-col">
        <div className="border-b border-line bg-white p-4">
          <div className="flex flex-wrap gap-1.5">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={cx('btn min-h-11 border', mode === m.id ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>{m.label}</button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); search() }}>
            {mode === 'round' ? (
              <>
                <select className="input min-h-12" value={perfId} onChange={e => { setPerfId(e.target.value); setRoundId('') }}>
                  {performances.filter(p => p.status !== '임시저장' && p.end >= M.TODAY).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <select className="input min-h-12" value={roundId} onChange={e => setRoundId(e.target.value)}>
                  {perfRounds.map(r => <option key={r.id} value={r.id}>{roundLabel(r)}</option>)}
                </select>
              </>
            ) : (
              <input className="input min-h-12 text-lg" autoFocus placeholder={curMode.ph} value={q} onChange={e => setQ(e.target.value)}
                inputMode={mode === 'phone' ? 'numeric' : undefined} maxLength={mode === 'phone' ? 4 : undefined} />
            )}
            <button className="btn-primary min-h-12 shrink-0 px-6"><Search size={18} /> 조회</button>
          </form>
          <p className="mt-2 text-xs text-muted">시연 팁: 예매번호 <b>T26100100001</b>(홈페이지 예매) · <b>T26092800002</b>(가상계좌 입금대기) · 회원ID <b>demo</b></p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {!submitted ? <p className="py-20 text-center text-muted">검색 조건을 입력하고 조회하세요.</p>
            : results.length === 0 ? <p className="py-20 text-center text-muted">조회 결과가 없습니다. (취소완료 건 제외)</p> : (
              <table className="tbl">
                <thead><tr><th>예매번호</th><th>공연 / 회차</th><th>예매자</th><th>매수</th><th>발권</th><th>상태</th><th>채널</th></tr></thead>
                <tbody>
                  {results.map(b => {
                    const p = performances.find(x => x.id === b.perfId)
                    const r = rounds.find(x => x.id === b.roundId)
                    const live = liveSeats(b)
                    return (
                      <tr key={b.id} onClick={() => pick(b)} className={cx('cursor-pointer', b.id === selId && '!bg-brand-50')}>
                        <td className="font-mono">{b.id}</td>
                        <td><div className="max-w-[220px] truncate font-semibold">{p?.title}</div><div className="text-xs text-muted">{r && roundLabel(r)}</div></td>
                        <td>{b.bookerName}<div className="text-xs text-muted">{maskPhone(b.bookerPhone)}</div></td>
                        <td>{live.length}</td>
                        <td>{live.filter(s => s.issued).length}/{live.length}</td>
                        <td><span className={cx('chip', statusTone(b.status))}>{b.status}</span></td>
                        <td className="text-xs">{b.channel}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col border-l border-line bg-white">
        {!sel || !selPerf || !selRound ? <p className="m-auto text-sm text-muted">예매 건을 선택하세요.</p> : (
          <>
            <div className="border-b border-line p-4">
              <div className="flex items-center gap-2"><span className="font-mono text-sm">{sel.id}</span><span className={cx('chip', statusTone(sel.status))}>{sel.status}</span></div>
              <div className="mt-1 text-lg font-extrabold">{selPerf.title}</div>
              <div className="text-sm text-muted">{fmtDate(selRound.date)} {selRound.time} · {selRound.no}회차</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
                <span className="text-muted">예매자</span><span>{sel.bookerName} · {maskPhone(sel.bookerPhone)}</span>
                <span className="text-muted">결제</span><span>{sel.payMethod} · <b>{won(sel.total)}</b></span>
                <span className="text-muted">채널</span><span>{sel.channel} ({sel.createdAt})</span>
              </div>
            </div>
            {sel.status === '입금대기' && (
              <div className="m-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-3">
                <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle size={18} /> 가상계좌 미입금 — 발권 불가</div>
                <p className="mt-1 text-xs text-amber-800">{sel.vaccount?.bank} {sel.vaccount?.no} · 기한 {sel.vaccount?.due}. 고객 동의 시 현장에서 결제 후 발권할 수 있습니다.</p>
                <div className="mt-2 flex gap-1.5">
                  {(['신용카드', '현금', '간편결제'] as PayMethod[]).map(m => (
                    <button key={m} onClick={() => setPayMethod(m)} className={cx('btn min-h-11 flex-1 border text-xs', payMethod === m ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>{m}</button>
                  ))}
                </div>
                <button className="btn-accent mt-2 min-h-12 w-full" onClick={() => payMethod === '현금' ? (confirm(`현금 ${won(sel.total)} 수납 후 발권합니다.`) && collect()) : setTerminal(true)}>
                  {won(sel.total)} 현장 결제 후 발권
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {sel.seats.map(s => (
                <label key={s.seatId} className={cx('flex min-h-12 items-center gap-3 border-b border-line px-4', s.cancelled ? 'opacity-40' : 'cursor-pointer hover:bg-paper')}>
                  <input type="checkbox" className="h-5 w-5" disabled={s.cancelled} checked={checked.includes(s.seatId)} onChange={() => toggle(s.seatId)} />
                  <span className="flex-1"><b>{seatLabel(s.seatId)}</b> <span className="text-xs text-muted">{M.gradeLabel[s.grade]} · {ttName(s.ticketTypeId)}</span></span>
                  <span className="text-sm tabular-nums">{won(s.price)}</span>
                  <span className={cx('chip', s.cancelled ? 'bg-gray-100 text-gray-500' : s.used ? 'bg-gray-200 text-gray-600' : s.issued ? 'bg-mint-500/15 text-mint-500' : 'bg-sun-300/40 text-amber-800')}>
                    {s.cancelled ? '취소' : s.used ? '입장' : s.issued ? '발권' : '미발권'}
                  </span>
                </label>
              ))}
            </div>
            <div className="space-y-2 border-t border-line p-3">
              <button className="btn-primary min-h-14 w-full text-base" disabled={sel.status === '입금대기'} onClick={issue}><Printer size={18} /> 선택 좌석 발권 ({checked.length})</button>
              <div className="flex gap-2">
                <select className="input min-h-11" value={reason} onChange={e => setReason(e.target.value)} aria-label="재발권 사유">
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <button className="btn-outline min-h-11 shrink-0" disabled={sel.status === '입금대기'} onClick={reissue}><RotateCcw size={16} /> 재발권</button>
              </div>
              <button className="btn-ghost min-h-11 w-full" onClick={unissue}><Undo2 size={16} /> 미발권 처리</button>
            </div>
          </>
        )}
      </aside>

      {terminal && <PayTerminal open amount={sel?.total ?? 0} method={payMethod} onApproved={a => collect(a)} onCancel={() => setTerminal(false)} />}
      {print && <TicketPrintModal bookingId={print.id} seatIds={print.seats} reissue={print.reissue} onClose={() => { setPrint(null); if (sel) pick(findBooking(sel.id)!) }} />}
    </div>
  )
}
