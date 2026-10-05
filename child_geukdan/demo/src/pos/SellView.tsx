import { useCallback, useMemo, useState } from 'react'
import { Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import SeatMap from '../components/SeatMap'
import { gradeOf, useBookings, useSeatState, useStore, venueOf } from '../store'
import * as M from '../data/mock'
import { cx, dow } from '../lib/format'
import type { Grade } from '../data/types'
import { autoPick } from './lib'
import Cart from './Cart'

/** 현장판매: 공연 → 날짜 → 회차 → 좌석 → 장바구니/결제 */
export default function SellView() {
  const performances = useStore(s => s.performances)
  const allRounds = useStore(s => s.rounds)
  const overrides = useStore(s => s.gradeOverrides)
  const holds = useStore(s => s.holds)
  const bookings = useBookings()

  const perfs = useMemo(
    () => performances.filter(p => p.status !== '임시저장' && p.end >= M.TODAY).sort((a, b) => a.start.localeCompare(b.start)),
    [performances],
  )
  const roundsOf = (pid: string) => allRounds.filter(r => r.perfId === pid && r.active).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  // 기본값: 가장 가까운 회차 날짜(오늘 이후 첫 회차)
  const firstOf = (pid: string, d?: string) => roundsOf(pid).find(r => d ? r.date === d : r.date >= M.TODAY)
  const [perfId, setPerfId] = useState(() => perfs[0]?.id ?? '')
  const [date, setDate] = useState(() => firstOf(perfs[0]?.id ?? '')?.date ?? '')
  const [roundId, setRoundId] = useState(() => firstOf(perfs[0]?.id ?? '')?.id ?? '')
  const [selected, setSelected] = useState<string[]>([])
  const perf = perfs.find(p => p.id === perfId)
  const perfRounds = useMemo(() => roundsOf(perfId), [allRounds, perfId]) // eslint-disable-line react-hooks/exhaustive-deps
  const dates = useMemo(() => [...new Set(perfRounds.filter(r => r.date >= M.TODAY).map(r => r.date))], [perfRounds])
  const dayRounds = perfRounds.filter(r => r.date === date)
  const round = dayRounds.find(r => r.id === roundId)

  const pickRound = (rid: string) => { setRoundId(rid); setSelected([]) }
  const pickDate = (d: string) => { setDate(d); pickRound(firstOf(perfId, d)?.id ?? '') }
  const pickPerf = (pid: string) => {
    setPerfId(pid)
    const r = firstOf(pid)
    setDate(r?.date ?? '')
    pickRound(r?.id ?? '')
  }

  // 회차별 판매 수
  const soldByRound = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bookings) for (const s of b.seats) if (!s.cancelled) m.set(b.roundId, (m.get(b.roundId) ?? 0) + 1)
    return m
  }, [bookings])

  const venue = perf ? venueOf(perf) : M.venues[0]
  const capacity = venue.rows.length * venue.cols
  const st = useSeatState(roundId || undefined)
  const gOf = useCallback((id: string) => gradeOf(perfId, id, overrides), [perfId, overrides])

  // 선택/장바구니 — 다른 창구/홈페이지에서 먼저 팔린 좌석은 제외
  const cart = selected.filter(id => !st.sold.has(id) && !st.held.has(id))
  const [quick, setQuick] = useState(false)
  const [qCount, setQCount] = useState(2)
  const [qGrade, setQGrade] = useState<Grade | 'any'>('any')

  const toggle = (id: string) => setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])
  const doAuto = () => {
    const pick = autoPick({
      rows: venue.rows, cols: venue.cols, count: qCount, grade: qGrade, gradeOf: gOf,
      isFree: id => !st.sold.has(id) && !st.held.has(id) && !cart.includes(id),
    })
    if (pick.length < qCount) useStore.getState().toast(`조건에 맞는 잔여석이 ${pick.length}석뿐입니다`, 'warn')
    setSelected([...cart, ...pick])
  }

  const remain = (rid: string) => capacity - (soldByRound.get(rid) ?? 0) - (holds[rid]?.length ?? 0)

  return (
    <div className="grid h-full min-h-0 grid-cols-[230px_1fr_360px] xl:grid-cols-[260px_1fr_400px]">
      {/* 좌: 공연/일자/회차 */}
      <aside className="flex min-h-0 flex-col border-r border-line bg-white">
        <div className="border-b border-line px-3 py-2 text-xs font-bold text-muted">공연 선택</div>
        <div className="max-h-[38%] shrink-0 overflow-y-auto p-2">
          {perfs.map(p => (
            <button key={p.id} onClick={() => pickPerf(p.id)}
              className={cx('mb-1.5 flex min-h-12 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition',
                p.id === perfId ? 'border-ink bg-ink text-white' : 'border-line hover:border-brand-500')}>
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: p.palette[1] }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{p.title}</span>
                <span className={cx('block text-[11px]', p.id === perfId ? 'text-white/60' : 'text-muted')}>{p.start.slice(5)}~{p.end.slice(5)} · {p.status}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="border-y border-line px-3 py-2 text-xs font-bold text-muted">관람일 <span className="font-normal">({dates.length}일)</span></div>
        <div className="flex shrink-0 gap-1.5 overflow-x-auto p-2">
          {dates.length === 0 && <p className="p-2 text-xs text-muted">예정 회차가 없습니다.</p>}
          {dates.map(d => (
            <button key={d} onClick={() => pickDate(d)}
              className={cx('flex min-h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-lg border px-2 text-xs font-bold',
                d === date ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:border-brand-500',
                d === M.TODAY && d !== date && 'border-mint-500')}>
              <span className="text-[10px] font-semibold opacity-70">{d === M.TODAY ? '오늘' : `${Number(d.slice(5, 7))}월`}</span>
              <span>{Number(d.slice(8))}({dow(d)})</span>
            </button>
          ))}
        </div>
        <div className="border-y border-line px-3 py-2 text-xs font-bold text-muted">회차</div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
          {dayRounds.map(r => {
            const left = remain(r.id)
            return (
              <button key={r.id} onClick={() => pickRound(r.id)}
                className={cx('flex min-h-14 w-full items-center justify-between rounded-lg border px-3 text-left',
                  r.id === roundId ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-line hover:border-brand-500')}>
                <span>
                  <span className="block text-lg font-extrabold tabular-nums">{r.time}</span>
                  <span className="text-[11px] text-muted">{r.no}회차{r.note ? ` · ${r.note}` : ''}</span>
                </span>
                <span className={cx('text-right text-sm font-bold tabular-nums', left === 0 ? 'text-coral-500' : left < 20 ? 'text-amber-600' : 'text-mint-500')}>
                  {left === 0 ? '매진' : `잔여 ${left}`}<span className="block text-[10px] font-normal text-muted">/ {capacity}석</span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* 중: 좌석배치도 */}
      <section className="flex min-h-0 min-w-0 flex-col bg-paper">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2">
          <div className="mr-auto min-w-0">
            <div className="truncate text-sm font-bold">{perf?.title ?? '-'} <span className="font-normal text-muted">· {venue.name}</span></div>
            <div className="text-xs text-muted">
              {round ? `${round.date} (${dow(round.date)}) ${round.time} · ${round.no}회차` : '회차를 선택하세요'} · 판매 {st.sold.size} / 보류 {st.held.size} / 현장전용 {st.siteOnly.size}
            </div>
          </div>
          <button onClick={() => setQuick(q => !q)} className={cx('btn min-h-11 border', quick ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
            <Sparkles size={16} /> 비지정 수량 선택
          </button>
          {cart.length > 0 && <button className="btn-ghost min-h-11" onClick={() => setSelected([])}><Trash2 size={16} /> 선택해제</button>}
        </div>
        {quick && round && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-sun-300/30 px-4 py-2">
            <span className="text-sm font-bold">수량</span>
            <button className="btn-outline h-11 w-11 p-0" onClick={() => setQCount(c => Math.max(1, c - 1))} aria-label="수량 감소"><Minus size={16} /></button>
            <span className="w-8 text-center text-xl font-black tabular-nums">{qCount}</span>
            <button className="btn-outline h-11 w-11 p-0" onClick={() => setQCount(c => Math.min(10, c + 1))} aria-label="수량 증가"><Plus size={16} /></button>
            <span className="ml-3 text-sm font-bold">등급</span>
            {(['any', 'R', 'S', 'A', 'W'] as const).filter(g => g === 'any' || perf?.prices[g]).map(g => (
              <button key={g} onClick={() => setQGrade(g)} className={cx('btn min-h-11 border', qGrade === g ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
                {g === 'any' ? '최적석' : M.gradeLabel[g]}
              </button>
            ))}
            <button className="btn-accent ml-auto min-h-11 px-5" onClick={doAuto}><Sparkles size={16} /> 자동 배정</button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {round ? (
            <SeatMap
              venue={venue} gradeOf={gOf} prices={perf?.prices}
              sold={st.sold} used={st.used} held={st.held} siteOnly={st.siteOnly}
              selected={cart} onToggle={toggle} mode="pos" size="lg" maxSelect={20}
              distancing={round.distancing}
            />
          ) : <p className="py-20 text-center text-muted">판매할 회차를 선택하세요.</p>}
        </div>
      </section>

      {/* 우: 장바구니/결제 */}
      {perf && round
        ? <Cart perf={perf} round={round} seats={cart} gradeOf={gOf} onRemove={id => setSelected(s => s.filter(x => x !== id))} onDone={() => setSelected([])} />
        : <aside className="border-l border-line bg-white" />}
    </div>
  )
}
