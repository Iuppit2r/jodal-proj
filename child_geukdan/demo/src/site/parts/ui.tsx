import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Heart, Loader2, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Poster from '../../components/Poster'
import Modal from '../../components/Modal'
import type { Booking, Performance, Round } from '../../data/types'
import { saleState, useMe, useStore, venueOf } from '../../store'
import { cx, fmtDate, fmtRange, won } from '../../lib/format'
import * as M from '../../data/mock'
import { dday, statusTone } from './perf'

/** 로고 워드마크 */
export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden className="shrink-0">
        <rect width="40" height="40" rx="12" fill="#2647c4" />
        <circle cx="13" cy="16" r="3.2" fill="#ffc933" />
        <circle cx="27" cy="16" r="3.2" fill="#ffc933" />
        <path d="M10 24 q10 10 20 0" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M30 4 l2 4 4.5 .6 -3.3 3 .8 4.4 -4 -2.2 -4 2.2 .8 -4.4 -3.3 -3 4.5 -.6z" fill="#ff8a73" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cx('text-[10px] font-semibold tracking-wide', light ? 'text-white/70' : 'text-brand-600')}>NATIONAL THEATER FOR CHILDREN AND YOUTH</span>
        <span className={cx('mt-0.5 font-extrabold tracking-tight', compact ? 'text-[15px]' : 'text-[17px]', light ? 'text-white' : 'text-ink')}>국립어린이청소년극단</span>
      </span>
    </span>
  )
}

export function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const on = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return m
}

/** 관심공연 하트 (로그인 필요) */
export function FavButton({ perfId, className = '' }: { perfId: string; className?: string }) {
  const me = useMe()
  const toggle = useStore(s => s.toggleFavorite)
  const toast = useStore(s => s.toast)
  const on = !!me?.favorites.includes(perfId)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? '관심 공연 해제' : '관심 공연 등록'}
      onClick={e => {
        e.preventDefault(); e.stopPropagation()
        if (!me) { toast('로그인 후 관심 공연을 등록할 수 있습니다', 'warn'); return }
        toggle(perfId)
        toast(on ? '관심 공연에서 해제했습니다' : '관심 공연에 등록했습니다')
      }}
      className={cx('grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm transition hover:scale-110', className)}
    >
      <Heart size={17} className={on ? 'fill-coral-500 text-coral-500' : 'text-gray-500'} />
    </button>
  )
}

/** 공연 카드 (포스터 + 상태 + 예매 버튼) */
export function PerfCard({ p, showBook = true }: { p: Performance; showBook?: boolean }) {
  const me = useMe()
  const nav = useNavigate()
  const sale = saleState(p, me)
  const d = dday(p)
  return (
    <article className="group flex flex-col">
      <div className="relative">
      <Link to={`/site/performances/${p.id}`} className="relative block overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line transition group-hover:-translate-y-1 group-hover:shadow-lg">
        <Poster title={p.title} palette={p.palette} motif={p.motif} sub={p.subtitle} className="aspect-[5/7] w-full" />
        <span className="absolute left-3 top-3 flex gap-1.5">
          <span className={cx('chip shadow-sm', statusTone(p.status))}>{p.status === '오픈예정' && p.presaleAt && sale.presale ? '선예매중' : p.status}</span>
          {d !== '종료' && <span className="chip bg-ink/80 text-white shadow-sm">{d}</span>}
        </span>
        <span className="sr-only">{p.title} 상세보기</span>
      </Link>
      <FavButton perfId={p.id} className="absolute bottom-3 right-3" />
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs font-semibold text-brand-600">{p.genre} · {p.target}</p>
        <h3 className="mt-1 text-[17px] font-bold leading-snug">
          <Link to={`/site/performances/${p.id}`} className="link-u">{p.title}</Link>
        </h3>
        <dl className="mt-2 space-y-0.5 text-[13px] text-muted">
          <div className="flex gap-1.5"><dt className="sr-only">기간</dt><dd>{fmtRange(p.start, p.end)}</dd></div>
          <div className="flex gap-1.5"><dt className="sr-only">장소</dt><dd>{venueOf(p).name} · {p.ageLimit}</dd></div>
        </dl>
        {showBook && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={cx('flex-1 px-2', sale.canBook ? (sale.presale ? 'btn-accent' : 'btn-primary') : sale.presale ? 'btn-accent' : 'btn-outline')}
              disabled={!sale.canBook && !sale.presale}
              onClick={() => sale.canBook ? nav(`/site/book/${p.id}`) : !me ? nav(`/site/login?next=/site/performances/${p.id}`) : nav('/site/membership')}
              aria-label={`${p.title} ${sale.label}`}
            >
              {sale.canBook ? sale.label : sale.presale ? (me ? '멤버십 가입 후 선예매' : '로그인 후 선예매') : sale.label}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

/** 미니 달력: 공연 회차가 있는 날짜만 선택 가능 */
export function MiniCalendar({ dates, value, onChange, initialMonth }: {
  dates: string[]; value?: string; onChange: (d: string) => void; initialMonth?: string
}) {
  const set = useMemo(() => new Set(dates), [dates])
  const first = initialMonth ?? value ?? dates[0] ?? M.TODAY
  const [ym, setYm] = useState(first.slice(0, 7))
  useEffect(() => { if (value) setYm(value.slice(0, 7)) }, [value])
  const [y, m] = ym.split('-').map(Number)
  const startDow = new Date(y, m - 1, 1).getDay()
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`)]
  const move = (d: number) => {
    const nd = new Date(y, m - 1 + d, 1)
    setYm(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`)
  }
  const months = [...new Set(dates.map(d => d.slice(0, 7)))]
  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className="btn-ghost p-1.5" onClick={() => move(-1)} disabled={!!months.length && ym <= months[0]} aria-label="이전 달"><ChevronLeft size={18} /></button>
        <p className="text-sm font-bold" aria-live="polite">{y}년 {m}월</p>
        <button type="button" className="btn-ghost p-1.5" onClick={() => move(1)} disabled={!!months.length && ym >= months[months.length - 1]} aria-label="다음 달"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted" aria-hidden>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <span key={d} className={cx('py-1', i === 0 && 'text-coral-500', i === 6 && 'text-brand-600')}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={'e' + i} />
          const ok = set.has(d)
          const sel = d === value
          return (
            <button
              key={d} type="button" disabled={!ok}
              onClick={() => onChange(d)}
              aria-pressed={sel}
              aria-label={`${fmtDate(d)}${ok ? ' 공연 있음' : ''}`}
              className={cx('relative aspect-square rounded-lg text-sm font-semibold transition',
                sel ? 'bg-brand-600 text-white shadow' : ok ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'text-gray-300',
                d === M.TODAY && !sel && 'ring-1 ring-sun-400')}
            >
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** 날짜 선택 → 회차 목록 */
export function RoundPicker({ rounds, remain, value, onChange, compact = false }: {
  rounds: Round[]; remain: Map<string, number>; value?: string; onChange: (r: Round) => void; compact?: boolean
}) {
  const dates = useMemo(() => [...new Set(rounds.map(r => r.date))], [rounds])
  const cur = rounds.find(r => r.id === value)
  const [date, setDate] = useState(cur?.date ?? dates[0])
  useEffect(() => { if (cur) setDate(cur.date) }, [cur])
  const list = rounds.filter(r => r.date === date)
  if (!rounds.length) return <p className="rounded-xl bg-paper p-6 text-center text-sm text-muted">예매 가능한 회차가 없습니다.</p>
  return (
    <div className={cx('grid gap-5', !compact && 'md:grid-cols-[1fr_1fr]')}>
      <MiniCalendar dates={dates} value={date} onChange={setDate} />
      <div>
        <p className="mb-2 text-sm font-bold">{date ? `${fmtDate(date)} 회차` : '날짜를 선택하세요'}</p>
        <ul className="space-y-2" role="radiogroup" aria-label="회차 선택">
          {list.map(r => {
            const left = remain.get(r.id) ?? 0
            const sel = r.id === value
            return (
              <li key={r.id}>
                <button
                  type="button" role="radio" aria-checked={sel} disabled={left === 0}
                  onClick={() => onChange(r)}
                  className={cx('flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition',
                    sel ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-500',
                    left === 0 && 'opacity-50')}
                >
                  <span>
                    <span className="block text-base font-bold">{r.time} <span className="text-xs font-medium text-muted">{r.no}회차</span></span>
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      {r.note && <span className="chip bg-sun-300 text-ink">{r.note}</span>}
                      {r.cast && <span className="text-xs text-muted">출연 {r.cast}</span>}
                      {r.distancing && r.distancing !== 'none' && <span className="chip bg-mint-400/15 text-mint-500">거리두기</span>}
                    </span>
                  </span>
                  <span className={cx('shrink-0 text-sm font-bold', left === 0 ? 'text-coral-500' : left < 20 ? 'text-coral-500' : 'text-brand-600')}>
                    {left === 0 ? '매진' : `잔여 ${left}석`}
                  </span>
                </button>
              </li>
            )
          })}
          {!list.length && <li className="text-sm text-muted">선택한 날짜에 회차가 없습니다.</li>}
        </ul>
      </div>
    </div>
  )
}

/** 단계 표시 */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1 sm:gap-2" aria-label="진행 단계">
      {steps.map((s, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={s} className="flex shrink-0 items-center gap-1 sm:gap-2" aria-current={now ? 'step' : undefined}>
            <span className={cx('grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
              done ? 'bg-mint-500 text-white' : now ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400')}>
              {done ? <Check size={14} /> : i + 1}
            </span>
            <span className={cx('text-xs font-semibold sm:text-sm', now ? 'text-ink' : 'text-muted', !now && 'hidden sm:inline')}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-line sm:w-8" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

/** 가상 PG 결제창 */
export function PgModal({ open, amount, method, onDone, onClose }: {
  open: boolean; amount: number; method: string; onDone: () => void; onClose: () => void
}) {
  const [phase, setPhase] = useState<'confirm' | 'paying'>('confirm')
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => { if (open) setPhase('confirm') }, [open])
  useEffect(() => {
    if (phase !== 'paying' || !open) return
    const t = setTimeout(() => doneRef.current(), 1200)
    return () => clearTimeout(t)
  }, [phase, open])
  return (
    <Modal open={open} onClose={() => phase === 'confirm' && onClose()} title="결제하기 (시연용 PG)" size="sm">
      {phase === 'confirm' ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ShieldCheck size={28} /></div>
          <div>
            <p className="text-sm text-muted">{method}</p>
            <p className="mt-1 text-2xl font-extrabold">{won(amount)}</p>
          </div>
          <p className="rounded-lg bg-paper p-3 text-xs text-muted">시연 환경에서는 실제 결제가 이루어지지 않습니다.<br />전자결제(PG) 연동 시 카드사 인증창이 표시됩니다.</p>
          <div className="flex gap-2">
            <button className="btn-outline flex-1" onClick={onClose}>취소</button>
            <button className="btn-primary flex-1" onClick={() => setPhase('paying')} autoFocus>
              {method === '가상계좌' ? '가상계좌 발급' : `${won(amount)} 결제`}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center" role="status" aria-live="assertive">
          <Loader2 className="mx-auto animate-spin text-brand-600" size={40} />
          <p className="mt-4 font-bold">결제 진행 중...</p>
          <p className="mt-1 text-xs text-muted">창을 닫거나 새로고침하지 마세요.</p>
        </div>
      )}
    </Modal>
  )
}

/** 모바일 티켓 */
export function MobileTicket({ b, perf, round }: { b: Booking; perf: Performance; round?: Round }) {
  const live = b.seats.filter(s => !s.cancelled)
  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl text-white shadow-lg" style={{ background: perf.palette[0] }}>
      <div className="p-5">
        <p className="text-[11px] font-semibold opacity-70">MOBILE TICKET · 국립어린이청소년극단</p>
        <p className="mt-1 text-lg font-extrabold leading-snug">{perf.title}</p>
        {round && <p className="mt-1 text-sm opacity-90">{fmtDate(round.date)} {round.time}</p>}
        <p className="text-sm opacity-90">{venueOf(perf).name}</p>
      </div>
      <div className="relative border-t-2 border-dashed border-white/40 bg-white p-5 text-ink">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full" style={{ background: 'var(--color-paper)' }} aria-hidden />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full" style={{ background: 'var(--color-paper)' }} aria-hidden />
        <div className="flex justify-center">
          <QRCodeSVG value={b.id} size={148} level="M" aria-label={`예매번호 ${b.id} 입장 QR코드`} role="img" />
        </div>
        <p className="mt-3 text-center font-mono text-sm font-bold tracking-wider">{b.id}</p>
        <p className="mt-1 text-center text-xs text-muted">{live.map(s => s.seatId).join(', ') || '취소된 좌석'} · {live.length}매</p>
        <p className="mt-2 text-center text-[11px] text-muted">입장 시 QR코드를 검표 단말기에 보여주세요</p>
      </div>
    </div>
  )
}

export const Required = () => <span className="text-coral-500" aria-hidden> *</span>

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`별점 ${value}점 (5점 만점)`} role="img">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 20 20" width={size} height={size} aria-hidden>
          <path d="M10 1.5l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L10 14.8l-5.4 2.9 1.2-5.9L1.4 7.7l6-.7z" fill={i <= value ? '#ffc933' : '#e3e6ec'} />
        </svg>
      ))}
    </span>
  )
}

