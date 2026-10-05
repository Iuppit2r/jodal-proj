import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Accessibility, ArrowRight, Baby, Bus, Car, Check, Clock, Ear, Hand, Info, MapPin, Phone, Sofa, Train, Ticket, Sparkles, Lightbulb, Heart, Users } from 'lucide-react'
import Poster from '../../components/Poster'
import { useStore, venueOf } from '../../store'
import { TODAY, tiers } from '../../data/mock'
import type { Performance } from '../../data/types'
import { cx } from '../../lib/format'
import { enAge, enCopy, enFallback, enGenre, enRange, enTarget } from './enData'

function Hero({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="border-b border-line bg-paper hc-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {desc && <p className="mt-3 max-w-2xl leading-7 text-muted">{desc}</p>}
      </div>
    </div>
  )
}
const Wrap = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={cx('mx-auto max-w-6xl px-4 py-12', className)}>{children}</div>

function usePublic() {
  const performances = useStore(s => s.performances)
  return useMemo(() => performances.filter(p => p.status !== '임시저장').sort((a, b) => a.start.localeCompare(b.start)), [performances])
}
const isCurrent = (p: Performance) => p.end >= TODAY && p.status !== '판매종료'

function BookingNote({ p, compact = false }: { p: Performance; compact?: boolean }) {
  return (
    <div className={cx('rounded-2xl border border-sun-400 bg-sun-300/20 text-sm', compact ? 'p-3' : 'p-5')}>
      <p className="flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0 text-[#7a5600]" aria-hidden /><span>Ticket booking is available on the Korean site.</span></p>
      <Link to={`/site/performances/${p.id}`} lang="ko" className="mt-2 inline-flex items-center gap-1 font-bold text-brand-600 hover:underline">
        Book on the Korean site <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  )
}

function ProdCard({ p }: { p: Performance }) {
  const v = venueOf(p)
  return (
    <li className="group">
      <Link to={`/site/en/productions/${p.id}`} className="block">
        <div className="overflow-hidden rounded-2xl shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
          <Poster title={p.titleEn} palette={p.palette} motif={p.motif} showText={false} className="block aspect-[5/7] w-full" />
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-600">{enGenre[p.genre]} · {enTarget[p.target]}</p>
        <h3 className="mt-1 text-lg font-extrabold leading-snug group-hover:underline">{p.titleEn}</h3>
      </Link>
      <p className="mt-1 text-sm text-muted">{enRange(p.start, p.end)}</p>
      <p className="text-sm text-muted">{v.nameEn}</p>
    </li>
  )
}

/* ── Home ── */
export function EnHome() {
  const list = usePublic()
  const current = list.filter(isCurrent)
  const feat = current[0]
  return (
    <>
      <section className="relative overflow-hidden bg-brand-600 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sun-400" />
        <div aria-hidden className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-coral-400/80" />
        <div aria-hidden className="absolute bottom-10 right-16 h-14 w-14 rounded-full bg-mint-400" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-bold uppercase tracking-widest text-sun-300">Seoul · Since 2011</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Theatre for the young audiences of today.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-brand-100">The National Theater for Children and Youth creates contemporary theatre with and for children, teenagers and families in Korea.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/site/en/productions" className="inline-flex items-center gap-1.5 rounded-lg bg-sun-400 px-5 py-3 font-bold text-ink hover:bg-sun-500">Current productions <ArrowRight size={16} aria-hidden /></Link>
            <Link to="/site/en/visit" className="inline-flex items-center rounded-lg border border-white/40 px-5 py-3 font-bold hover:bg-white/10">Plan your visit</Link>
          </div>
        </div>
      </section>

      {feat && (
        <Wrap>
          <div className="grid gap-8 rounded-3xl bg-paper p-5 sm:p-8 md:grid-cols-[260px_1fr] md:items-center">
            <Poster title={feat.titleEn} palette={feat.palette} motif={feat.motif} showText={false} className="block aspect-[5/7] w-full rounded-2xl shadow-lg" />
            <div>
              <span className="inline-flex rounded-full bg-mint-500 px-3 py-1 text-xs font-bold text-white">Now on stage</span>
              <h2 className="mt-3 text-3xl font-extrabold">{feat.titleEn}</h2>
              <p className="mt-2 text-muted">{enRange(feat.start, feat.end)} · {venueOf(feat).nameEn}</p>
              <p className="mt-4 leading-7">{(enCopy[feat.id] ?? enFallback).summary}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/site/en/productions/${feat.id}`} className="btn-primary">More details</Link>
              </div>
              <div className="mt-5"><BookingNote p={feat} compact /></div>
            </div>
          </div>
        </Wrap>
      )}

      <Wrap className="pt-0">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold">Current & upcoming productions</h2>
          <Link to="/site/en/productions" className="hidden text-sm font-bold text-brand-600 hover:underline sm:inline">View all</Link>
        </div>
        <ul className="grid grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">{current.map(p => <ProdCard key={p.id} p={p} />)}</ul>
        <p className="mt-8 rounded-xl bg-paper p-4 text-sm text-muted"><Ticket size={15} className="mr-1 inline text-brand-600" aria-hidden />Ticket booking is available on the Korean site. For assistance in English, call +82-1600-6261.</p>
      </Wrap>

      <Wrap className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: '/site/en/about', t: 'About us', d: 'From a research lab in 2011 to an independent national company in 2026.', c: 'bg-brand-50' },
            { to: '/site/en/visit', t: 'Visit', d: 'Getting here, accessibility services and family facilities.', c: 'bg-mint-400/15' },
            { to: '/site/en/membership', t: 'Membership', d: 'Priority booking and discounts for our paid members.', c: 'bg-sun-300/30' },
          ].map(x => (
            <Link key={x.to} to={x.to} className={cx('group rounded-2xl p-6 transition hover:shadow-md', x.c)}>
              <p className="flex items-center justify-between text-lg font-extrabold group-hover:underline">{x.t}<ArrowRight size={18} aria-hidden /></p>
              <p className="mt-2 text-sm leading-6 text-muted">{x.d}</p>
            </Link>
          ))}
        </div>
      </Wrap>
    </>
  )
}

/* ── About ── */
export function EnAbout() {
  const hist = [
    ['2011', 'Founded as the Children and Youth Theatre Research Lab of the National Theater Company of Korea. Premiere of “The Boy Did It” (소년이 그랬다).'],
    ['2012', 'Korean premiere of “Wrestling Season” and premiere of “Red Bus”.'],
    ['2013', 'Korean premiere of David Greig’s “Yellow Moon”.'],
    ['2014', 'World premiere of “Ostrich Boys”; Youth Theatre Relay II festival.'],
    ['2015–2025', 'Regular children’s repertoire, national touring, youth advisory panels, relaxed performances and accessibility services across all productions.'],
    ['2026', 'Became an independent national theatre company, separated from the National Theater Company of Korea. A new Artistic Director was appointed in September.'],
  ]
  return (
    <>
      <Hero eyebrow="About" title="Every child deserves great theatre." desc="We are a national performing arts company under the Ministry of Culture, Sports and Tourism, dedicated to creating, researching and sharing theatre for children and young people." />
      <Wrap>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Sparkles, t: 'Create', d: 'New work that reflects the lives of children and teenagers today.' },
            { i: Lightbulb, t: 'Research', d: 'Audience research, education programs and a living archive.' },
            { i: Heart, t: 'Access', d: 'A theatre without barriers of ability, region or income.' },
            { i: Users, t: 'Participate', d: 'Young advisors and workshops that shape what we put on stage.' },
          ].map(({ i: I, t, d }) => (
            <li key={t} className="card p-6"><I size={24} className="text-brand-600" aria-hidden /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm leading-6 text-muted">{d}</p></li>
          ))}
        </ul>
        <h2 className="mb-6 mt-14 text-2xl font-extrabold">Our history</h2>
        <ol className="relative ml-2 border-l-2 border-brand-100 pl-7">
          {hist.map(([y, t], i) => (
            <li key={y} className="relative pb-7 last:pb-0">
              <span aria-hidden className={cx('absolute -left-[37px] top-1 h-4 w-4 rounded-full border-4 border-white', i === hist.length - 1 ? 'bg-sun-400 ring-2 ring-sun-400' : 'bg-brand-600')} />
              <p className="font-extrabold text-brand-600">{y}</p>
              <p className="mt-1 leading-7 text-ink/85">{t}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 rounded-3xl bg-brand-600 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-wider text-sun-300">A message from the Artistic Director</p>
          <p className="mt-3 text-xl font-bold leading-relaxed">“We believe children and young people are not the audience of tomorrow — they are the audience of today. We will keep making theatre that begins with their questions.”</p>
          <p className="mt-4 text-sm text-brand-100">— Artistic Director, National Theater for Children and Youth</p>
        </div>
      </Wrap>
    </>
  )
}

/* ── Productions ── */
export function EnProductions() {
  const list = usePublic()
  const [tab, setTab] = useState<'now' | 'past'>('now')
  const shown = list.filter(p => (tab === 'now' ? isCurrent(p) : !isCurrent(p)))
  return (
    <>
      <Hero eyebrow="Productions" title="On stage" desc="Plays, music theatre, puppetry and dance for babies, children, teenagers and families." />
      <Wrap>
        <div role="tablist" aria-label="Productions" className="mb-8 inline-flex rounded-xl bg-paper p-1">
          {([['now', 'Current & upcoming'], ['past', 'Past']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-sm font-bold', tab === k ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink')}>{l}</button>
          ))}
        </div>
        {shown.length === 0 ? <p className="py-16 text-center text-muted">No productions to show.</p> : (
          <ul className="grid grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">{shown.map(p => <ProdCard key={p.id} p={p} />)}</ul>
        )}
      </Wrap>
    </>
  )
}

export function EnProduction() {
  const { id } = useParams()
  const list = usePublic()
  const p = list.find(x => x.id === id)
  if (!p) return <Wrap><p className="py-16 text-center text-muted">Production not found.</p><div className="text-center"><Link to="/site/en/productions" className="btn-primary">All productions</Link></div></Wrap>
  const copy = enCopy[p.id] ?? enFallback
  const v = venueOf(p)
  const facts: [string, string][] = [
    ['Dates', enRange(p.start, p.end)],
    ['Venue', v.nameEn],
    ['Running time', `${p.runtime} minutes, no intermission`],
    ['Age guidance', enAge(p.ageLimit)],
    ['Genre', enGenre[p.genre]],
    ['Tickets', Object.values(p.prices).length ? `KRW ${Math.min(...Object.values(p.prices) as number[]).toLocaleString()} – ${Math.max(...Object.values(p.prices) as number[]).toLocaleString()}` : '-'],
  ]
  return (
    <>
      <div className="border-b border-line" style={{ background: `linear-gradient(135deg, ${p.palette[0]}, ${p.palette[0]}e6)` }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-white sm:py-14 md:grid-cols-[280px_1fr] md:items-center">
          <Poster title={p.titleEn} palette={p.palette} motif={p.motif} showText={false} className="block aspect-[5/7] w-full max-w-[280px] rounded-2xl shadow-2xl" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-80">{enGenre[p.genre]} · {enTarget[p.target]}</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{p.titleEn}</h1>
            <p lang="ko" className="mt-1 opacity-80">{p.title}</p>
            <p className="mt-5 max-w-xl text-lg leading-8 opacity-95">{copy.summary}</p>
          </div>
        </div>
      </div>
      <Wrap>
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-xl font-extrabold">About the production</h2>
            <p className="mt-3 leading-8 text-ink/85">{copy.body}</p>
            <h2 className="mt-10 text-xl font-extrabold">Creative team</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {p.credits.map(c => (
                <div key={c.role + c.name} className="contents"><dt className="text-muted" lang="ko">{c.role}</dt><dd lang="ko">{c.name}</dd></div>
              ))}
            </dl>
            {p.accessibility.length > 0 && (
              <>
                <h2 className="mt-10 text-xl font-extrabold">Accessible performances</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.accessibility.map(a => (
                    <li key={a} className="rounded-full bg-mint-400/15 px-3 py-1.5 text-sm font-semibold text-[#0c6b55]">
                      {a.replace('수어통역', 'Korean Sign Language').replace('음성해설', 'Audio description').replace('릴랙스드 퍼포먼스', 'Relaxed performance').replace('한글자막 상시', 'Korean surtitles at all shows').replace('전 회차', '(all shows)').replace('유모차 보관', 'Stroller parking')}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <aside className="space-y-4">
            <dl className="card divide-y divide-line">
              {facts.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{val}</dd></div>
              ))}
            </dl>
            {isCurrent(p)
              ? <BookingNote p={p} />
              : <p className="rounded-2xl bg-paper p-5 text-sm text-muted">This production has closed.</p>}
            <p className="text-xs leading-5 text-muted">Online booking is provided in Korean only. For help booking in English, call +82-1600-6261 (Tue–Sun, 10:00–18:00 KST) or visit the box office one hour before the show.</p>
          </aside>
        </div>
        <Link to="/site/en/productions" className="mt-10 inline-block font-bold text-brand-600 hover:underline">← All productions</Link>
      </Wrap>
    </>
  )
}

/* ── Visit ── */
export function EnVisit() {
  return (
    <>
      <Hero eyebrow="Visit" title="Plan your visit" desc="Both of our theatres are located at the same address in Yongsan-gu, central Seoul." />
      <Wrap className="space-y-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative min-h-72 overflow-hidden rounded-3xl bg-[#e8eef7]" role="img" aria-label="Map showing the theatre near Seoul Station and Sookmyung Women's University Station">
            <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#d5deeb 2px, transparent 2px), linear-gradient(90deg, #d5deeb 2px, transparent 2px)', backgroundSize: '56px 56px' }} />
            <div aria-hidden className="absolute left-0 right-0 top-1/2 h-4 -rotate-6 bg-white shadow" />
            <div aria-hidden className="absolute bottom-0 left-1/3 top-0 w-3 rotate-12 bg-white shadow" />
            <span className="absolute left-[18%] top-[22%] rounded-full bg-[#0052a4] px-2.5 py-1 text-xs font-bold text-white">Seoul Station</span>
            <span className="absolute bottom-[20%] right-[12%] rounded-full bg-[#00a5de] px-2.5 py-1 text-xs font-bold text-white">Sookmyung Women’s Univ.</span>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">NTCY</span>
                <MapPin size={36} className="-mt-1 fill-coral-500 text-white" aria-hidden />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-6">
              <p className="flex items-center gap-2 font-bold"><MapPin size={18} className="text-brand-600" aria-hidden />Address</p>
              <p className="mt-2 leading-7">373 Cheongpa-ro, Yongsan-gu, Seoul 04310<br /><span lang="ko" className="text-sm text-muted">서울특별시 용산구 청파로 373</span></p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                <li>· Baek Seonghee & Jang Minho Theater</li>
                <li>· Small Theater PAN</li>
              </ul>
            </div>
            <div className="card p-6">
              <p className="flex items-center gap-2 font-bold"><Phone size={18} className="text-brand-600" aria-hidden />Contact</p>
              <p className="mt-2 text-sm leading-7">+82-1600-6261<br /><Clock size={13} className="mr-1 inline" aria-hidden />Box office opens 1 hour before each performance</p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-5 text-2xl font-extrabold">Getting here</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              { i: Train, t: 'Subway', d: 'Line 4 Sookmyung Women’s University Station, Exit 1 — 7 min walk. Seoul Station (Lines 1, 4, Airport Railroad), Exit 15 — 10 min walk.' },
              { i: Bus, t: 'Bus', d: 'Get off at “Seoul Station West Exit” or “Cheongpa-dong Entrance”. Several blue and green buses stop nearby.' },
              { i: Car, t: 'Parking', d: 'Parking is very limited. We strongly recommend public transport. Priority spaces are reserved for visitors with disabilities.' },
            ].map(({ i: I, t, d }) => (
              <li key={t} className="rounded-2xl bg-paper p-6"><I size={24} className="text-brand-600" aria-hidden /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm leading-6 text-muted">{d}</p></li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-extrabold">Accessibility & family services</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: Accessibility, t: 'Wheelchair seating', d: 'Wheelchair spaces with a companion seat in both theatres, plus step-free access from the entrance.' },
              { i: Hand, t: 'Korean Sign Language', d: 'Selected performances are interpreted in Korean Sign Language.' },
              { i: Ear, t: 'Audio description', d: 'Free receivers for audio-described performances. Please bring ID to borrow one.' },
              { i: Sofa, t: 'Relaxed performances', d: 'Softer light and sound, and you are free to move, make noise and leave the room.' },
              { i: Baby, t: 'Family facilities', d: 'Stroller parking, a nursing room and baby-changing tables in the lobby.' },
              { i: Info, t: 'Language support', d: 'Youth productions are surtitled in Korean. Ask our front-of-house staff for help in English.' },
            ].map(({ i: I, t, d }) => (
              <li key={t} className="card p-6"><I size={22} className="text-brand-600" aria-hidden /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm leading-6 text-muted">{d}</p></li>
            ))}
          </ul>
        </section>
      </Wrap>
    </>
  )
}

/* ── Membership (안내 전용 — 가입은 국문에서) ── */
const TIER_EN: Record<string, { name: string; benefits: string[] }> = {
  'tier-sprout': { name: 'Sprout', benefits: ['10% off all productions (up to 2 tickets)', 'Priority booking 3 days before general sale', 'KRW 5,000 welcome coupon', 'No booking fees'] },
  'tier-tree': { name: 'Tree', benefits: ['20% off all productions (up to 4 tickets)', 'Priority booking 3 days before general sale', 'One complimentary ticket voucher', 'No booking fees', 'Priority invitation to backstage tours', 'Printed season book & webzine by post'] },
}
export function EnMembership() {
  return (
    <>
      <Hero eyebrow="Membership" title="Become a member" desc="Our paid membership gives families and young theatregoers priority booking, discounts and special experiences throughout the year." />
      <Wrap>
        <ul className="grid gap-6 md:grid-cols-2">
          {tiers.map(t => {
            const en = TIER_EN[t.id]
            return (
              <li key={t.id} className="card overflow-hidden">
                <div className="p-6 text-white" style={{ background: t.color }}>
                  <p className="text-sm font-bold uppercase tracking-wider opacity-80">Membership</p>
                  <p className="mt-1 text-3xl font-extrabold">{en?.name ?? t.name}</p>
                  <p className="mt-3 text-lg font-bold">KRW {t.price.toLocaleString()} <span className="text-sm font-semibold opacity-80">/ year</span></p>
                </div>
                <ul className="space-y-2.5 p-6">
                  {(en?.benefits ?? t.benefits).map(b => <li key={b} className="flex gap-2 text-sm"><Check size={18} className="shrink-0 text-mint-500" aria-hidden />{b}</li>)}
                </ul>
              </li>
            )
          })}
        </ul>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Valid for 12 months', 'Membership starts on the day you join and can be set to renew automatically.'],
            ['One account, your family', 'Member discounts apply to the member and accompanying family tickets.'],
            ['Cancel anytime', 'Unused memberships can be refunded within 7 days of purchase.'],
          ].map(([t, d]) => <div key={t} className="rounded-2xl bg-paper p-5"><p className="font-bold">{t}</p><p className="mt-1 text-sm leading-6 text-muted">{d}</p></div>)}
        </div>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-3xl border-2 border-sun-400 bg-sun-300/20 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex-1">
            <p className="text-lg font-extrabold">How to join</p>
            <p className="mt-1 text-sm leading-6 text-muted">Membership sign-up and payment are available on our Korean website only. This page is for information purposes. For assistance in English, please call +82-1600-6261.</p>
          </div>
          <Link to="/site/membership" lang="ko" className="btn-primary shrink-0">Go to Korean membership page <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </Wrap>
    </>
  )
}
