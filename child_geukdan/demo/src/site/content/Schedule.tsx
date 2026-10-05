import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, GanttChart, MapPin, Ticket } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useStore, venueOf } from '../../store'
import { TODAY } from '../../data/mock'
import type { Performance, Round } from '../../data/types'
import { cx, fmtDate, fmtRange } from '../../lib/format'
import { FilterTabs, Section } from './ui'

const TARGETS = ['전체', '어린이', '청소년', '가족'] as const
type Target = (typeof TARGETS)[number]
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

function usePublicPerfs(target: Target) {
  const performances = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  return useMemo(() => {
    const perfs = performances.filter(p => p.status !== '임시저장' && (target === '전체' || p.target === target))
    const ids = new Set(perfs.map(p => p.id))
    const byDate = new Map<string, { r: Round; p: Performance }[]>()
    for (const r of rounds) {
      if (!r.active || !ids.has(r.perfId)) continue
      const p = perfs.find(x => x.id === r.perfId)!
      const arr = byDate.get(r.date) ?? []
      arr.push({ r, p })
      byDate.set(r.date, arr)
    }
    for (const arr of byDate.values()) arr.sort((a, b) => a.r.time.localeCompare(b.r.time))
    return { perfs, byDate }
  }, [performances, rounds, target])
}

export default function Schedule() {
  const [sp, setSp] = useSearchParams()
  const view = sp.get('view') === 'year' ? 'year' : 'month'
  const [target, setTarget] = useState<Target>('전체')
  const { perfs, byDate } = usePublicPerfs(target)

  return (
    <>
      <PageHeader crumbs={['공연·예매', '공연일정']} title="공연일정" desc="월간 달력과 연간 일정표로 국립어린이청소년극단의 모든 공연 회차를 확인하세요." />
      <Section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="보기 방식" className="inline-flex rounded-xl bg-paper p-1">
            {([['month', '월간 일정', CalendarDays], ['year', '연간 일정', GanttChart]] as const).map(([k, l, Icon]) => (
              <button key={k} role="tab" aria-selected={view === k} onClick={() => setSp(k === 'year' ? { view: 'year' } : {})}
                className={cx('inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition',
                  view === k ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink')}>
                <Icon size={16} aria-hidden />{l}
              </button>
            ))}
          </div>
          <FilterTabs label="관람 대상" items={TARGETS} value={target} onChange={setTarget} />
        </div>
        {view === 'month' ? <MonthView byDate={byDate} perfs={perfs} /> : <YearView perfs={perfs} />}
      </Section>
    </>
  )
}

/* ───────────── 월간 ───────────── */
function MonthView({ byDate, perfs }: { byDate: Map<string, { r: Round; p: Performance }[]>; perfs: Performance[] }) {
  const [ym, setYm] = useState({ y: 2026, m: 9 }) // 2026년 10월
  const [sel, setSel] = useState<string | null>(TODAY)
  const first = new Date(ym.y, ym.m, 1).getDay()
  const days = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const move = (d: number) => setYm(({ y, m }) => { const t = new Date(y, m + d, 1); return { y: t.getFullYear(), m: t.getMonth() } })
  const monthPerfs = perfs.filter(p => p.start <= ymd(ym.y, ym.m, days) && p.end >= ymd(ym.y, ym.m, 1))
  const selItems = sel ? byDate.get(sel) ?? [] : []
  const agendaDays = Array.from({ length: days }, (_, i) => ymd(ym.y, ym.m, i + 1)).filter(d => byDate.has(d))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button className="btn-outline btn-sm" onClick={() => move(-1)} aria-label="이전 달"><ChevronLeft size={16} /><span className="hidden sm:inline">이전 달</span></button>
        <h2 className="text-xl font-extrabold tabular-nums sm:text-2xl" aria-live="polite">{ym.y}. {pad(ym.m + 1)}</h2>
        <button className="btn-outline btn-sm" onClick={() => move(1)} aria-label="다음 달"><span className="hidden sm:inline">다음 달</span><ChevronRight size={16} /></button>
      </div>

      {/* 범례 */}
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs" aria-label="이달의 공연">
        {monthPerfs.length === 0 && <li className="text-muted">이달 예정된 공연이 없습니다.</li>}
        {monthPerfs.map(p => (
          <li key={p.id} className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: p.palette[0] }} />
            <Link to={`/site/performances/${p.id}`} className="link-u font-semibold">{p.title}</Link>
            <span className="text-muted">({p.target})</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* 데스크톱: 달력 그리드 */}
        <div className="hidden md:block">
          <table className="w-full table-fixed border-collapse overflow-hidden rounded-2xl text-sm">
            <caption className="sr-only">{ym.y}년 {ym.m + 1}월 공연 일정 달력</caption>
            <thead>
              <tr>{DOW.map((d, i) => <th key={d} scope="col" className={cx('border-b-2 border-ink/80 py-2 text-xs font-bold', i === 0 && 'text-coral-500', i === 6 && 'text-brand-600')}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, w) => (
                <tr key={w}>
                  {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
                    if (!d) return <td key={i} className="h-28 border border-line bg-paper/60" />
                    const date = ymd(ym.y, ym.m, d)
                    const items = byDate.get(date) ?? []
                    const isSel = sel === date
                    const isToday = date === TODAY
                    return (
                      <td key={i} className={cx('h-28 border border-line p-0 align-top', isSel && 'bg-brand-50')}>
                        <button onClick={() => setSel(date)} aria-pressed={isSel}
                          aria-label={`${ym.m + 1}월 ${d}일 ${DOW[i]}요일, 공연 ${items.length}회차`}
                          className="flex h-full min-h-28 w-full flex-col gap-1 p-1.5 text-left hover:bg-brand-50/60">
                          <span className={cx('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            isToday ? 'bg-sun-400 text-ink' : i === 0 ? 'text-coral-500' : i === 6 ? 'text-brand-600' : 'text-ink')}>{d}</span>
                          {items.slice(0, 3).map(({ r, p }) => (
                            <span key={r.id} className="block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: p.palette[0] }}>
                              {r.time} {p.title}
                            </span>
                          ))}
                          {items.length > 3 && <span className="text-[11px] font-semibold text-muted">+{items.length - 3}회차 더보기</span>}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 일정 리스트 */}
        <div className="md:hidden">
          {agendaDays.length === 0 && <p className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">이달 예정된 공연이 없습니다.</p>}
          <ol className="space-y-3">
            {agendaDays.map(d => (
              <li key={d} className={cx('card p-4', d === TODAY && 'border-sun-400 ring-2 ring-sun-300/50')}>
                <p className="mb-2 text-sm font-bold">{fmtDate(d)} {d === TODAY && <span className="chip ml-1 bg-sun-400 text-ink">오늘</span>}</p>
                <RoundList items={byDate.get(d)!} />
              </li>
            ))}
          </ol>
        </div>

        {/* 선택일 상세 (데스크톱) */}
        <aside className="hidden md:block" aria-live="polite">
          <div className="card sticky top-24 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><CalendarDays size={18} className="text-brand-600" aria-hidden />{sel ? fmtDate(sel) : '날짜를 선택하세요'}</h3>
            {sel && selItems.length === 0 && <p className="py-6 text-center text-sm text-muted">공연이 없는 날입니다.</p>}
            {selItems.length > 0 && <RoundList items={selItems} />}
          </div>
        </aside>
      </div>
      <p className="mt-4 text-xs text-muted">※ 매주 월요일은 공연이 없습니다. 접근성 회차(수어통역·음성해설·릴랙스드)는 별도 표시됩니다.</p>
    </div>
  )
}

function RoundList({ items }: { items: { r: Round; p: Performance }[] }) {
  return (
    <ul className="space-y-2">
      {items.map(({ r, p }) => {
        const past = r.date < TODAY
        const closed = past || p.status === '판매종료'
        return (
          <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
            <span aria-hidden className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: p.palette[0] }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{r.time} · {r.no}회</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{venueOf(p).name}</span>
              </p>
              {r.note && <span className="chip mt-1 bg-mint-400/20 text-[#0c6b55]">{r.note}</span>}
            </div>
            {closed
              ? <span className="chip bg-gray-100 text-gray-500">종료</span>
              : <Link to={`/site/performances/${p.id}`} className="btn-primary btn-sm shrink-0" aria-label={`${p.title} ${r.date} ${r.time} 예매`}><Ticket size={14} aria-hidden />예매</Link>}
          </li>
        )
      })}
    </ul>
  )
}

/* ───────────── 연간 ───────────── */
function YearView({ perfs }: { perfs: Performance[] }) {
  const [year, setYear] = useState(2026)
  const start = new Date(year, 0, 1).getTime()
  const span = new Date(year + 1, 0, 1).getTime() - start
  const pos = (d: string) => Math.min(1, Math.max(0, (new Date(d + 'T00:00:00').getTime() - start) / span))
  const list = perfs.filter(p => p.start <= `${year}-12-31` && p.end >= `${year}-01-01`).sort((a, b) => a.start.localeCompare(b.start))
  const todayPos = TODAY.startsWith(String(year)) ? pos(TODAY) : null

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div role="group" aria-label="연도 선택" className="inline-flex gap-1">
          {[2026, 2027].map(y => (
            <button key={y} aria-pressed={year === y} onClick={() => setYear(y)}
              className={cx('rounded-lg px-4 py-2 text-sm font-bold', year === y ? 'bg-ink text-white' : 'bg-paper text-muted hover:text-ink')}>{y}</button>
          ))}
        </div>
        <p className="text-sm text-muted">총 <b className="text-ink">{list.length}</b>편</p>
      </div>

      {list.length === 0 ? <p className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">{year}년 공개된 공연 일정이 없습니다.</p> : (
        <div className="card overflow-hidden">
          {/* 월 눈금 */}
          <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden border-b border-line bg-paper px-4 py-3 text-xs font-bold text-muted sm:block">공연</div>
            <div className="grid grid-cols-12 border-b border-line bg-paper">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="border-l border-line py-3 text-center text-[11px] font-bold text-muted first:border-l-0 sm:text-xs">{i + 1}<span className="hidden sm:inline">월</span></div>
              ))}
            </div>
          </div>
          <ul>
            {list.map(p => {
              const a = pos(p.start), b = pos(p.end)
              return (
                <li key={p.id} className="grid grid-cols-[minmax(0,1fr)] border-b border-line last:border-b-0 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="px-4 pt-3 sm:py-4">
                    <Link to={`/site/performances/${p.id}`} className="link-u block truncate text-sm font-bold">{p.title}</Link>
                    <p className="text-xs text-muted">{fmtRange(p.start, p.end)} · {venueOf(p).name}</p>
                  </div>
                  <div className="relative grid grid-cols-12 py-3 sm:py-4">
                    {Array.from({ length: 12 }, (_, i) => <div key={i} className="h-8 border-l border-dashed border-line first:border-l-0" />)}
                    {todayPos !== null && <div aria-hidden className="absolute inset-y-0 w-0.5 bg-coral-500" style={{ left: `${todayPos * 100}%` }} />}
                    <Link to={`/site/performances/${p.id}`} title={`${p.title} ${fmtRange(p.start, p.end)}`}
                      aria-label={`${p.title}, ${fmtRange(p.start, p.end)}`}
                      className="absolute top-1/2 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-full px-2 text-[11px] font-bold text-white shadow-sm transition hover:brightness-110"
                      style={{ left: `${a * 100}%`, width: `max(${(b - a) * 100}%, 10px)`, background: `linear-gradient(90deg, ${p.palette[0]}, ${p.palette[0]}cc)` }}>
                      <span className="truncate">{p.start < `${year}-01-01` ? '◀ ' : ''}{p.genre}{p.end > `${year}-12-31` ? ' ▶' : ''}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        {todayPos !== null && <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-0.5 bg-coral-500" />오늘 ({fmtDate(TODAY)})</span>}
        <span>◀ ▶ 표시는 전년도·다음 연도로 이어지는 공연입니다.</span>
      </div>

      {/* 접근성을 위한 표 형태 요약 */}
      <div className="mt-8 overflow-x-auto">
        <table className="tbl">
          <caption className="mb-2 text-left text-sm font-bold">{year}년 공연 일정표</caption>
          <thead><tr><th scope="col">공연명</th><th scope="col">기간</th><th scope="col">공연장</th><th scope="col">대상</th><th scope="col">관람연령</th></tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td><Link className="link-u font-semibold" to={`/site/performances/${p.id}`}>{p.title}</Link></td>
                <td>{fmtDate(p.start)} ~ {fmtDate(p.end)}</td>
                <td>{venueOf(p).name}</td>
                <td>{p.target}</td>
                <td>{p.ageLimit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

