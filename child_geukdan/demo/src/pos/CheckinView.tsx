import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, QrCode, ScanLine, Undo2, XCircle, AlertTriangle } from 'lucide-react'
import { findBooking, useBookings, useSeatState, useStore } from '../store'
import * as M from '../data/mock'
import { cx } from '../lib/format'
import { posTag, roundLabel, seatLabel, ttName, usePos } from './lib'

type Kind = 'ok' | 'used' | 'cancelled' | 'invalid' | 'unpaid' | 'wrong'
interface Scan { key: string; at: string; code: string; kind: Kind; title: string; detail: string; bookingId?: string; seatIds: string[]; undone?: boolean }

const VIEW: Record<Kind, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: '입장 확인', cls: 'bg-mint-500 text-white', Icon: CheckCircle2 },
  used: { label: '이미 입장 처리됨', cls: 'bg-sun-400 text-ink', Icon: AlertTriangle },
  cancelled: { label: '취소된 티켓', cls: 'bg-coral-500 text-white', Icon: XCircle },
  invalid: { label: '유효하지 않은 티켓', cls: 'bg-coral-500 text-white', Icon: XCircle },
  unpaid: { label: '미결제 티켓 (입금대기)', cls: 'bg-coral-500 text-white', Icon: XCircle },
  wrong: { label: '다른 회차 티켓', cls: 'bg-coral-500 text-white', Icon: XCircle },
}

export default function CheckinView() {
  const performances = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const bookings = useBookings()
  const session = usePos(s => s.session)!
  const perfs = performances.filter(p => p.status !== '임시저장' && p.end >= M.TODAY)
  const roundsOf = (pid: string) => rounds.filter(r => r.perfId === pid && r.date >= M.TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const [perfId, setPerfId] = useState(perfs[0]?.id ?? 'p1')
  const perfRounds = useMemo(() => roundsOf(perfId), [rounds, perfId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [roundId, setRoundId] = useState(() => roundsOf(perfs[0]?.id ?? 'p1')[0]?.id ?? '')
  const changePerf = (pid: string) => { setPerfId(pid); setRoundId(roundsOf(pid)[0]?.id ?? '') }
  const round = perfRounds.find(r => r.id === roundId)
  const st = useSeatState(roundId || undefined)

  const [code, setCode] = useState('')
  const [log, setLog] = useState<Scan[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [roundId])
  const last = log[0]

  const scan = (raw: string) => {
    const v = raw.trim().toUpperCase()
    if (!v) return
    const [bid, seatRaw] = v.split('|')
    const seatId = seatRaw?.trim() || undefined
    const b = findBooking(bid.trim())
    const at = new Date().toTimeString().slice(0, 8)
    const push = (kind: Kind, title: string, detail: string, seatIds: string[] = []) => {
      setLog(l => [{ key: Math.random().toString(36).slice(2), at, code: v, kind, title, detail, bookingId: b?.id, seatIds }, ...l].slice(0, 40))
    }
    const perf = b && performances.find(p => p.id === b.perfId)
    if (!b || (seatId && !b.seats.some(s => s.seatId === seatId))) push('invalid', '조회되지 않는 티켓', `코드 ${v}`)
    else if (b.roundId !== roundId) {
      const r = rounds.find(x => x.id === b.roundId)
      push('wrong', `${perf?.title}`, `티켓 회차: ${r ? roundLabel(r) : '-'} — 현재 검표 회차와 다릅니다`)
    } else if (b.status === '입금대기') push('unpaid', b.bookerName, '가상계좌 미입금 — 매표소 안내')
    else {
      const targets = b.seats.filter(s => !seatId || s.seatId === seatId)
      const desc = targets.map(s => `${seatLabel(s.seatId)} ${ttName(s.ticketTypeId)}`).join(' / ')
      const res = useStore.getState().checkInSeat(b.id, seatId)
      if (res === 'ok') {
        const done = targets.filter(s => !s.cancelled && !s.used).map(s => s.seatId)
        useStore.getState().patchBooking(b.id, {}, `${posTag(session)} 검표 단말 입장`)
        push('ok', `${b.bookerName} · ${done.length}명`, desc, done)
      } else if (res === 'used') push('used', b.bookerName, `${desc} — 재입장 여부 확인`)
      else if (res === 'cancelled') push('cancelled', b.bookerName, `${desc} — 환불된 티켓`)
      else push('invalid', '조회되지 않는 티켓', `코드 ${v}`)
    }
    setCode('')
    inputRef.current?.focus()
  }

  const simulate = () => {
    const pool = bookings.filter(b => b.roundId === roundId && b.status !== '입금대기' && b.status !== '취소완료')
      .flatMap(b => b.seats.filter(s => !s.cancelled && !s.used).map(s => ({ b, s })))
    const issued = pool.filter(x => x.s.issued)
    const src = issued.length ? issued : pool
    if (!src.length) return useStore.getState().toast('이 회차에 입장 가능한 티켓이 없습니다', 'warn')
    const x = src[Math.floor(Math.random() * src.length)]
    scan(`${x.b.id}|${x.s.seatId}`)
  }

  const undo = (sc: Scan) => {
    const b = sc.bookingId && findBooking(sc.bookingId)
    if (!b) return
    useStore.getState().patchBooking(b.id, { seats: b.seats.map(s => sc.seatIds.includes(s.seatId) ? { ...s, used: false } : s) }, `${posTag(session)} 검표 사용처리 취소 (${sc.seatIds.join(', ')})`)
    setLog(l => l.map(x => x.key === sc.key ? { ...x, undone: true } : x))
    useStore.getState().toast('입장 처리를 취소했습니다', 'warn')
  }

  const sold = st.sold.size
  const entered = st.used.size
  const view = last && VIEW[last.kind]
  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_380px]">
      <section className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-2">
          <select className="input min-h-12 w-auto text-base font-bold" value={perfId} onChange={e => changePerf(e.target.value)}>
            {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select className="input min-h-12 w-auto text-base" value={roundId} onChange={e => setRoundId(e.target.value)}>
            {perfRounds.map(r => <option key={r.id} value={r.id}>{roundLabel(r)}{r.date === M.TODAY ? ' · 오늘' : ''}</option>)}
          </select>
          <div className="ml-auto flex items-baseline gap-2 rounded-xl bg-ink px-5 py-2 text-white">
            <span className="text-sm text-white/60">입장</span><span className="text-3xl font-black tabular-nums text-mint-400">{entered}</span>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/60">판매</span><span className="text-2xl font-black tabular-nums">{sold}</span>
            <span className="ml-1 text-sm text-white/60">({sold ? Math.round((entered / sold) * 100) : 0}%)</span>
          </div>
        </div>

        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); scan(code) }}>
          <div className="relative flex-1">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={26} />
            <input ref={inputRef} autoFocus className="input min-h-16 pl-14 font-mono text-2xl" placeholder="바코드 스캔 또는 예매번호 입력 후 Enter"
              value={code} onChange={e => setCode(e.target.value)} aria-label="티켓 코드" />
          </div>
          <button className="btn-primary min-h-16 px-8 text-lg">확인</button>
          <button type="button" className="btn-accent min-h-16 px-5" onClick={simulate}><QrCode size={22} /> QR 스캔<br className="hidden xl:block" /> 시뮬레이션</button>
        </form>

        <div className={cx('flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-3xl p-8 text-center transition-colors',
          view ? (last.undone ? 'bg-gray-200 text-ink' : view.cls) : 'border-2 border-dashed border-line bg-white text-muted')} aria-live="assertive">
          {!last ? (
            <><QrCode size={64} className="opacity-40" /><p className="mt-3 text-lg">티켓 QR/바코드를 스캔하세요</p><p className="text-sm">형식: 예매번호 또는 예매번호|좌석 (예: T26100100001|C-7)</p></>
          ) : (
            <>
              <view.Icon size={84} strokeWidth={2.5} />
              <div className="mt-2 text-5xl font-black tracking-tight">{last.undone ? '입장 취소됨' : view.label}</div>
              <div className="mt-3 text-2xl font-bold">{last.title}</div>
              <div className="mt-1 text-lg opacity-90">{last.detail}</div>
              <div className="mt-2 font-mono text-sm opacity-70">{last.code} · {last.at}</div>
              {last.kind === 'ok' && !last.undone && (
                <button className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-white/20 px-4 font-bold hover:bg-white/30" onClick={() => undo(last)}><Undo2 size={16} /> 사용처리 취소</button>
              )}
            </>
          )}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col border-l border-line bg-white">
        <div className="border-b border-line px-4 py-3 text-sm font-bold">최근 검표 기록 <span className="font-normal text-muted">({log.length})</span></div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {log.length === 0 && <li className="p-6 text-center text-sm text-muted">기록이 없습니다.</li>}
          {log.map(sc => {
            const v = VIEW[sc.kind]
            return (
              <li key={sc.key} className={cx('flex items-start gap-2 border-b border-line px-4 py-2.5', sc.undone && 'opacity-50')}>
                <span className={cx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', v.cls)}><v.Icon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{sc.undone ? '입장 취소됨' : v.label} <span className="font-normal text-muted">{sc.at}</span></div>
                  <div className="truncate text-xs text-muted">{sc.title} · {sc.detail}</div>
                  <div className="truncate font-mono text-[11px] text-muted">{sc.code}</div>
                </div>
                {sc.kind === 'ok' && !sc.undone && <button className="btn-ghost min-h-9 px-2 text-xs" onClick={() => undo(sc)}>취소</button>}
              </li>
            )
          })}
        </ul>
        {round && <div className="border-t border-line p-3 text-xs text-muted">미입장 {sold - entered}명 · 공연 {round.time} 시작 / 입장은 30분 전부터</div>}
      </aside>
    </div>
  )
}
