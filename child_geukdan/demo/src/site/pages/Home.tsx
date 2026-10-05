import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Crown, HelpCircle, Package, Pause, Play, Ticket, Users, Archive, BookOpen } from 'lucide-react'
import Poster from '../../components/Poster'
import * as M from '../../data/mock'
import { memberTier, saleState, useMe, useStore, venueOf } from '../../store'
import { cx, dow } from '../../lib/format'
import { PerfCard } from '../parts/ui'
import { daysBetween, dday, isCurrent, isPublic } from '../parts/perf'

function Hero() {
  const banners = useStore(s => s.banners)
  const perfs = useStore(s => s.performances)
  const me = useMe()
  const nav = useNavigate()
  const slides = useMemo(() => banners.filter(b => b.active).sort((a, b) => a.order - b.order)
    .map(b => ({ b, p: perfs.find(p => p.id === b.perfId) }))
    .filter(x => !x.p || isPublic(x.p)), [banners, perfs])
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = slides.length
  useEffect(() => {
    if (paused || n < 2) return
    const t = setInterval(() => setI(x => (x + 1) % n), 5500)
    return () => clearInterval(t)
  }, [paused, n])
  if (!n) return null
  const { b, p } = slides[i % n]
  const pal = p?.palette ?? ['#2647c4', '#ffc933', '#ff8a73'] as [string, string, string]
  const sale = p ? saleState(p, me) : null
  return (
    <section aria-roledescription="carousel" aria-label="주요 공연" className="relative overflow-hidden" style={{ background: pal[0] }}>
      <div className="absolute inset-0 opacity-25" aria-hidden style={{ background: `radial-gradient(circle at 80% 20%, ${pal[1]}, transparent 45%), radial-gradient(circle at 10% 90%, ${pal[2]}, transparent 40%)` }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 sm:py-14 md:grid-cols-[1.2fr_1fr] md:gap-10 md:py-16">
        <div className="order-2 text-white md:order-1" aria-live={paused ? 'polite' : 'off'}>
          {p && <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="chip bg-white/15 text-white">{p.subtitle}</span>
            <span className="chip text-ink" style={{ background: pal[1] }}>{dday(p)}</span>
          </p>}
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{b.title}</h2>
          {p && <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85 sm:text-base">{p.summary}</p>}
          <p className="mt-3 text-sm font-semibold" style={{ color: pal[1] }}>{b.copy}</p>
          {p && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="btn bg-white px-5 py-3 text-ink hover:bg-sun-300" onClick={() => nav(sale?.canBook ? `/site/book/${p.id}` : `/site/performances/${p.id}`)}>
                <Ticket size={16} />{sale?.canBook ? sale.label : '공연 자세히 보기'}
              </button>
              <Link to={`/site/performances/${p.id}`} className="btn border border-white/40 px-5 py-3 text-white hover:bg-white/10">공연정보</Link>
            </div>
          )}
        </div>
        {p && (
          <Link to={`/site/performances/${p.id}`} className="order-1 mx-auto w-44 rotate-2 overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/20 transition hover:rotate-0 sm:w-60 md:order-2 md:w-72">
            <Poster title={p.title} palette={p.palette} motif={p.motif} sub={p.subtitle} className="aspect-[5/7] w-full" />
          </Link>
        )}
      </div>
      <div className="relative mx-auto flex max-w-6xl items-center gap-2 px-4 pb-6">
        <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white" aria-live="polite"><b>{i % n + 1}</b> / {n}</span>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white hover:bg-black/40" onClick={() => setI((i - 1 + n) % n)} aria-label="이전 배너"><ChevronLeft size={16} /></button>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white hover:bg-black/40" onClick={() => setPaused(x => !x)} aria-label={paused ? '자동 넘김 재생' : '자동 넘김 일시정지'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-black/25 text-white hover:bg-black/40" onClick={() => setI((i + 1) % n)} aria-label="다음 배너"><ChevronRight size={16} /></button>
        <div className="ml-2 hidden gap-1.5 sm:flex">
          {slides.map((s, k) => (
            <button key={s.b.id} onClick={() => setI(k)} aria-label={`${k + 1}번 배너: ${s.b.title}`} aria-current={k === i % n}
              className={cx('h-2 rounded-full transition-all', k === i % n ? 'w-8 bg-white' : 'w-2 bg-white/40')} />
          ))}
        </div>
      </div>
    </section>
  )
}

const QUICK = [
  { to: '/site/mypage', icon: Ticket, label: '예매확인', color: 'bg-brand-50 text-brand-600' },
  { to: '/site/schedule', icon: CalendarDays, label: '공연일정', color: 'bg-sun-300/40 text-amber-700' },
  { to: '/site/package', icon: Package, label: '패키지', color: 'bg-coral-400/15 text-coral-500' },
  { to: '/site/membership', icon: Crown, label: '멤버십', color: 'bg-mint-400/15 text-mint-500' },
  { to: '/site/support/inquiry', icon: Users, label: '단체관람 문의', color: 'bg-violet-100 text-violet-600' },
  { to: '/site/support/faq', icon: HelpCircle, label: 'FAQ', color: 'bg-sky-100 text-sky-600' },
]

function SectionTitle({ title, sub, more }: { title: string; sub?: string; more?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {more && <Link to={more} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-muted link-u">전체보기 <ArrowRight size={14} /></Link>}
    </div>
  )
}

function WeekStrip() {
  const rounds = useStore(s => s.rounds)
  const perfs = useStore(s => s.performances)
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(M.TODAY + 'T00:00:00'); d.setDate(d.getDate() + k)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  // 이번 주 공연이 없으면 가장 가까운 공연 주간을 보여준다
  const firstDate = rounds.filter(r => r.active && r.date >= M.TODAY && perfs.some(p => p.id === r.perfId && isCurrent(p))).map(r => r.date).sort()[0]
  const base = firstDate && !days.includes(firstDate) ? firstDate : M.TODAY
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + k)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [sel, setSel] = useState(week[0])
  const list = rounds.filter(r => r.date === sel && r.active).map(r => ({ r, p: perfs.find(p => p.id === r.perfId)! })).filter(x => x.p && isCurrent(x.p))
    .sort((a, b) => a.r.time.localeCompare(b.r.time))
  return (
    <section className="mx-auto max-w-6xl px-4 py-12" aria-label="주간 공연 일정">
      <SectionTitle title={base === M.TODAY ? '이번 주 공연' : '다가오는 공연 일정'} sub={base === M.TODAY ? undefined : `가장 가까운 공연 주간 (${base.slice(5).replace('-', '.')}~)`} more="/site/schedule" />
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label="날짜 선택">
        {week.map(d => {
          const has = rounds.some(r => r.date === d && r.active && perfs.some(p => p.id === r.perfId && isCurrent(p)))
          const w = dow(d)
          return (
            <button key={d} role="tab" aria-selected={sel === d} onClick={() => setSel(d)}
              className={cx('flex flex-col items-center rounded-2xl py-2.5 transition sm:py-3',
                sel === d ? 'bg-brand-600 text-white shadow-md' : 'bg-paper hover:bg-brand-50')}>
              <span className={cx('text-[11px] font-semibold', sel !== d && (w === '일' ? 'text-coral-500' : w === '토' ? 'text-brand-600' : 'text-muted'))}>{w}</span>
              <span className="text-lg font-extrabold">{Number(d.slice(8))}</span>
              <span className={cx('mt-0.5 h-1.5 w-1.5 rounded-full', has ? (sel === d ? 'bg-sun-400' : 'bg-brand-500') : 'bg-transparent')} aria-hidden />
              {has && <span className="sr-only">공연 있음</span>}
            </button>
          )
        })}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="tabpanel">
        {list.map(({ r, p }) => (
          <li key={r.id}>
            <Link to={`/site/performances/${p.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand-500">
              <span className="w-14 shrink-0 text-center text-lg font-extrabold text-brand-600">{r.time}</span>
              <span className="h-10 w-px bg-line" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{p.title}</span>
                <span className="block truncate text-xs text-muted">{venueOf(p).name} · {p.ageLimit}</span>
              </span>
              {r.note && <span className="chip shrink-0 bg-sun-300 text-ink">{r.note}</span>}
            </Link>
          </li>
        ))}
        {!list.length && <li className="col-span-full rounded-xl bg-paper p-6 text-center text-sm text-muted">이 날은 공연이 없습니다. (월요일 휴관)</li>}
      </ul>
    </section>
  )
}

export default function Home() {
  const perfs = useStore(s => s.performances)
  const notices = useStore(s => s.notices)
  const me = useMe()
  const tier = memberTier(me)
  const onSale = perfs.filter(p => isCurrent(p) && ['판매중', '선예매중', '오픈예정', '매진'].includes(p.status))
    .sort((a, b) => a.start.localeCompare(b.start))
  const latestNotices = [...notices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date.localeCompare(a.date)).slice(0, 5)
  const wz = M.webzines[0]
  return (
    <>
      <h1 className="sr-only">국립어린이청소년극단 홈페이지</h1>
      <Hero />

      {/* 퀵메뉴 */}
      <nav aria-label="바로가기" className="mx-auto -mt-0 max-w-6xl px-4 pt-8">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {QUICK.map(q => (
            <li key={q.label}>
              <Link to={q.to} className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
                <span className={cx('grid h-11 w-11 place-items-center rounded-xl', q.color)}><q.icon size={22} /></span>
                <span className="text-[13px] font-bold group-hover:text-brand-600">{q.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 지금 예매 중 */}
      <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="now-h">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-coral-500">NOW ON STAGE</p>
            <h2 id="now-h" className="text-xl font-extrabold tracking-tight sm:text-2xl">지금 예매 중인 공연</h2>
          </div>
          <Link to="/site/performances" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-muted link-u">전체보기 <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {onSale.map(p => <PerfCard key={p.id} p={p} />)}
        </div>
        {!onSale.length && <p className="rounded-xl bg-paper p-10 text-center text-muted">현재 예매 중인 공연이 없습니다.</p>}
      </section>

      <WeekStrip />

      {/* 멤버십 프로모 */}
      <section className="mx-auto max-w-6xl px-4" aria-labelledby="mem-h">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-6 py-8 text-white sm:px-10 sm:py-10">
          <svg viewBox="0 0 200 200" className="absolute -right-6 -top-6 h-48 w-48 opacity-30 sm:h-64 sm:w-64" aria-hidden>
            <circle cx="100" cy="100" r="80" fill="#ffc933" /><circle cx="60" cy="150" r="30" fill="#45d1b0" /><circle cx="160" cy="40" r="18" fill="#ff8a73" />
          </svg>
          <div className="relative max-w-xl">
            <p className="text-sm font-bold text-sun-300">유료 멤버십 새싹 · 나무</p>
            <h2 id="mem-h" className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">
              {tier ? `${me!.name}님은 ${tier.name} 멤버십 회원입니다` : '일반 오픈 3일 전, 먼저 예매하세요'}
            </h2>
            <p className="mt-2 text-sm text-white/85">
              {tier ? `선예매 · ${Math.round(tier.discountRate * 100)}% 할인 · 예매수수료 면제 혜택이 자동 적용됩니다. (유효기간 ~${me!.membership!.until})` : '전 공연 최대 20% 할인, 선예매, 예매수수료 면제, 백스테이지 투어까지 — 연 30,000원부터'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/site/membership" className="btn-accent px-5 py-3">{tier ? '멤버십 혜택 보기' : '멤버십 가입하기'} <ArrowRight size={16} /></Link>
              <Link to="/site/package" className="btn border border-white/40 px-5 py-3 text-white hover:bg-white/10">시즌 패키지 최대 25% 할인</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 공지 + 웹진 */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionTitle title="공지사항" more="/site/news/notice" />
          <ul className="divide-y divide-line border-y border-line">
            {latestNotices.map(n => (
              <li key={n.id}>
                <Link to={`/site/news/notice/${n.id}`} className="group flex items-center gap-3 py-3.5">
                  <span className={cx('chip shrink-0', n.pinned ? 'bg-coral-500 text-white' : 'bg-paper text-muted')}>{n.pinned ? '중요' : n.category}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] group-hover:text-brand-600 group-hover:underline underline-offset-4">{n.title}</span>
                  <span className="hidden shrink-0 text-xs text-muted sm:inline">{n.date.replace(/-/g, '.')}</span>
                  {daysBetween(n.date, M.TODAY) <= 7 && <span className="chip shrink-0 bg-sun-400 px-1.5 text-[10px] text-ink">N</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle title="웹진" more="/site/news/webzine" />
          <Link to={`/site/news/webzine/${wz.id}`} className="group flex gap-4 rounded-2xl bg-paper p-4 transition hover:shadow-md">
            <div className="w-28 shrink-0 overflow-hidden rounded-xl shadow sm:w-32">
              <Poster title={`Vol.${wz.vol}`} palette={wz.cover} motif="moon" sub={`${wz.year} ${wz.season}`} className="aspect-[5/7] w-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-600"><BookOpen size={12} className="mr-1 inline" />Vol.{wz.vol} · {wz.year} {wz.season}호</p>
              <h3 className="mt-1 text-lg font-extrabold leading-snug group-hover:text-brand-600">{wz.title}</h3>
              <ul className="mt-2 space-y-1 text-[13px] text-muted">
                {wz.articles.slice(0, 3).map(a => <li key={a.id} className="truncate">· {a.title}</li>)}
              </ul>
            </div>
          </Link>
        </div>
      </section>

      {/* 아카이브 */}
      <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="arc-h">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-mint-500">ARCHIVE SINCE 2011</p>
            <h2 id="arc-h" className="text-xl font-extrabold tracking-tight sm:text-2xl">극단이 걸어온 무대</h2>
          </div>
          <Link to="/site/news/archive" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-muted link-u"><Archive size={14} />아카이브</Link>
        </div>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {M.archive.filter(a => a.kind === '공연기록').map(a => (
            <li key={a.id} className="w-36 shrink-0 snap-start sm:w-44">
              <Link to="/site/news/archive" className="group block">
                <div className="overflow-hidden rounded-xl"><Poster title={a.title} palette={a.palette} motif={a.motif} sub={String(a.year)} className="aspect-[5/7] w-full transition group-hover:scale-105" /></div>
                <p className="mt-2 text-xs text-muted">{a.year} · {a.venue}</p>
                <p className="truncate text-sm font-bold group-hover:text-brand-600">{a.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
