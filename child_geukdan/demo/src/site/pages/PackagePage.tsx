import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Check, CheckCircle2, CreditCard, Minus, Package as PackageIcon, Plus } from 'lucide-react'
import PageHeader from '../PageHeader'
import Poster from '../../components/Poster'
import SeatMap from '../../components/SeatMap'
import * as M from '../../data/mock'
import type { Booking, PackageProduct, Performance, Round } from '../../data/types'
import { useMe, useSeatState, useStore, venueOf } from '../../store'
import { cx, fmtDate, fmtRange, won } from '../../lib/format'
import { PgModal, RoundPicker, Stepper } from '../parts/ui'
import { applyRate, effGrade, isMobileWidth, priceOf, useGradeFn, usePerfRounds, useRemainMap } from '../parts/perf'

interface Sel { roundId?: string; seats: string[] }

export default function PackagePage() {
  const me = useMe()
  const nav = useNavigate()
  const toast = useStore(s => s.toast)
  const perfs = useStore(s => s.performances)
  const orders = useStore(s => s.packageOrders)
  const allRounds = useStore(s => s.rounds)
  const [pk, setPk] = useState<PackageProduct | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [qty, setQty] = useState(2)
  const [step, setStep] = useState(0) // 0 공연선택 1 좌석 2 결제 3 완료
  const [idx, setIdx] = useState(0)
  const [sels, setSels] = useState<Record<string, Sel>>({})
  const [pay, setPay] = useState<'신용카드' | '가상계좌'>('신용카드')
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState('')
  const [pg, setPg] = useState(false)
  const [result, setResult] = useState<{ orderId: string; bookings: Booking[] } | null>(null)

  const eligible = (p: PackageProduct) => p.perfIds.map(id => perfs.find(x => x.id === id)).filter((x): x is Performance => !!x && x.status !== '임시저장' && x.end >= M.TODAY)
  const choose = (p: PackageProduct) => {
    if (!me) { toast('패키지 예매는 로그인 후 이용할 수 있습니다', 'warn'); nav('/site/login?next=/site/package'); return }
    setPk(p); setSels({}); setIdx(0); setResult(null); setAgree(false); setErr('')
    if (p.type === '시즌') { setPicked(eligible(p).map(x => x.id)); setStep(1) } else { setPicked([]); setStep(0) }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chosen = picked.map(id => perfs.find(p => p.id === id)!).filter(Boolean)
  const gradeFns = useGradeFnsLookup()
  const lines = chosen.map(p => {
    const s = sels[p.id] ?? { seats: [] }
    const seats = s.seats.map(id => { const g = gradeFns(p, id); const base = priceOf(p, g); return { seatId: id, grade: g, base, price: applyRate(base, pk?.discountRate ?? 0) } })
    return { p, roundId: s.roundId, seats }
  })
  const base = lines.reduce((a, l) => a + l.seats.reduce((x, s) => x + s.base, 0), 0)
  const total = lines.reduce((a, l) => a + l.seats.reduce((x, s) => x + s.price, 0), 0)

  const createPackageOrder = useStore(s => s.createPackageOrder)
  const createBooking = useStore(s => s.createBooking)
  const finish = () => {
    if (!pk || !me) return
    const order = createPackageOrder({ packageId: pk.id, userId: me.id, perfIds: picked, bookingIds: [], total })
    const bookings = lines.map(l => createBooking({
      perfId: l.p.id, roundId: l.roundId!, payMethod: pay, channel: isMobileWidth() ? '모바일' : '홈페이지',
      seats: l.seats.map(s => ({ seatId: s.seatId, grade: s.grade, ticketTypeId: 't-gen', price: s.price })),
      bookerName: me.name, bookerPhone: me.phone, fee: 0, userId: me.id, packageOrderId: order.id,
    }))
    // 주문에 예매번호 연결 (store에 별도 액션이 없어 set으로 갱신)
    const st = useStore.getState()
    st.set({ packageOrders: st.packageOrders.map(o => o.id === order.id ? { ...o, bookingIds: bookings.map(b => b.id) } : o) })
    for (const b of bookings) st.patchBooking(b.id, {}, `${pk.name} 패키지 예매 (${Math.round(pk.discountRate * 100)}% 할인)`)
    setPg(false); setResult({ orderId: order.id, bookings }); setStep(3)
    toast('패키지 예매가 완료되었습니다')
  }

  if (pk && step < 3) {
    const cur = chosen[idx]
    return (
      <>
        <PageHeader crumbs={['공연', '패키지 예매', pk.name]} title={pk.name} desc={`${pk.desc} · ${Math.round(pk.discountRate * 100)}% 할인`} />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <button className="btn-ghost -ml-3 mb-4" onClick={() => setPk(null)}><ArrowLeft size={16} />패키지 목록</button>
          <Stepper steps={[pk.type === '자유' ? `공연 선택 (${pk.pickCount}편)` : '구성 공연 확인', '공연별 회차·좌석', '결제']} current={step} />

          {step === 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-extrabold">관람할 공연 {pk.pickCount}편을 선택하세요 <span className="text-sm font-medium text-muted">({picked.length}/{pk.pickCount})</span></h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {eligible(pk).map(p => {
                  const on = picked.includes(p.id)
                  return (
                    <li key={p.id}>
                      <button aria-pressed={on} onClick={() => setPicked(c => on ? c.filter(x => x !== p.id) : c.length >= pk.pickCount ? c : [...c, p.id])}
                        className={cx('relative block w-full overflow-hidden rounded-2xl text-left ring-2 transition', on ? 'ring-brand-600' : 'ring-transparent hover:ring-brand-200')}>
                        <Poster title={p.title} palette={p.palette} motif={p.motif} sub={p.subtitle} className="aspect-[5/7] w-full" />
                        {on && <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white"><Check size={18} /></span>}
                        <span className="block p-2 text-xs text-muted">{fmtRange(p.start, p.end)} · {p.status}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button className="btn-primary mt-6 w-full py-3 sm:w-auto sm:px-10" disabled={picked.length !== pk.pickCount} onClick={() => setStep(1)}>다음: 회차·좌석 선택</button>
            </section>
          )}

          {step === 1 && cur && (
            <section className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">인원(공연별 매수)</span>
                  <div className="flex items-center gap-1">
                    <button className="btn-outline btn-sm" aria-label="매수 줄이기" disabled={qty <= 1} onClick={() => { setQty(q => q - 1); setSels({}) }}><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
                    <button className="btn-outline btn-sm" aria-label="매수 늘리기" disabled={qty >= 4} onClick={() => { setQty(q => q + 1); setSels({}) }}><Plus size={14} /></button>
                  </div>
                </div>
                <ol className="flex flex-wrap gap-1.5">
                  {chosen.map((p, i) => {
                    const ok = (sels[p.id]?.seats.length ?? 0) === qty && sels[p.id]?.roundId
                    return <li key={p.id}><button onClick={() => setIdx(i)} aria-current={i === idx} className={cx('chip py-1.5', i === idx ? 'bg-brand-600 text-white' : ok ? 'bg-mint-400/15 text-mint-500' : 'bg-white text-muted ring-1 ring-line')}>{ok && <Check size={12} className="mr-1" />}{i + 1}. {p.title}</button></li>
                  })}
                </ol>
              </div>
              <PerfSeatPicker key={cur.id + qty} p={cur} qty={qty} sel={sels[cur.id] ?? { seats: [] }} onChange={s => setSels(x => ({ ...x, [cur.id]: s }))} />
              <div className="flex gap-2">
                <button className="btn-outline" disabled={idx === 0 && pk.type === '시즌'} onClick={() => (idx === 0 ? setStep(0) : setIdx(idx - 1))}>이전</button>
                <button className="btn-primary flex-1 py-3" onClick={() => {
                  const s = sels[cur.id]
                  if (!s?.roundId || s.seats.length !== qty) { toast(`<${cur.title}> 회차와 좌석 ${qty}매를 선택해주세요`, 'warn'); return }
                  if (idx < chosen.length - 1) setIdx(idx + 1); else setStep(2)
                }}>{idx < chosen.length - 1 ? `다음 공연 (${idx + 2}/${chosen.length})` : '결제하기'}</button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="card divide-y divide-line">
                {lines.map(l => {
                  const r = allRounds.find(x => x.id === l.roundId)
                  return (
                    <div key={l.p.id} className="flex gap-4 p-4">
                      <div className="w-16 shrink-0 overflow-hidden rounded-lg"><Poster title={l.p.title} palette={l.p.palette} motif={l.p.motif} showText={false} className="aspect-[5/7] w-full" /></div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-bold">{l.p.title}</p>
                        <p className="text-muted">{r && `${fmtDate(r.date)} ${r.time}`} · {venueOf(l.p).name}</p>
                        <p className="mt-1">{l.seats.map(s => `${s.seatId}(${M.gradeLabel[s.grade]})`).join(', ')}</p>
                      </div>
                      <p className="shrink-0 text-right text-sm"><s className="text-xs text-muted">{won(l.seats.reduce((a, s) => a + s.base, 0))}</s><br /><b>{won(l.seats.reduce((a, s) => a + s.price, 0))}</b></p>
                    </div>
                  )
                })}
              </div>
              <div className="card space-y-4 p-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">정가 합계</dt><dd>{won(base)}</dd></div>
                  <div className="flex justify-between text-coral-500"><dt>패키지 할인 {Math.round(pk.discountRate * 100)}%</dt><dd>-{won(base - total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">예매수수료</dt><dd className="text-mint-500">면제</dd></div>
                  <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-bold">총 결제금액</dt><dd className="text-xl font-extrabold text-brand-600">{won(total)}</dd></div>
                </dl>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="결제 수단">
                  {([['신용카드', CreditCard], ['가상계좌', Building2]] as const).map(([m, I]) => (
                    <button key={m} role="radio" aria-checked={pay === m} onClick={() => setPay(m)} className={cx('flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold', pay === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line')}><I size={18} />{m}</button>
                  ))}
                </div>
                <label className={cx('flex items-start gap-2 rounded-lg border p-3 text-xs', err ? 'border-coral-500' : 'border-line')}>
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={agree} onChange={e => { setAgree(e.target.checked); setErr('') }} aria-invalid={!!err} aria-describedby="pk-err" />
                  <span><b>[필수]</b> 패키지 취소 규정 동의 — 패키지는 구성 공연 전체 취소만 가능하며, 일부 관람 후에는 취소할 수 없습니다.</span>
                </label>
                <p id="pk-err" className="text-xs text-coral-500" aria-live="assertive">{err}</p>
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => setStep(1)}>이전</button>
                  <button className="btn-primary flex-1 py-3" onClick={() => (agree ? setPg(true) : setErr('취소 규정에 동의해주세요.'))}>{won(total)} 결제</button>
                </div>
              </div>
            </section>
          )}
        </div>
        <PgModal open={pg} amount={total} method={pay} onClose={() => setPg(false)} onDone={finish} />
      </>
    )
  }

  if (pk && step === 3 && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <CheckCircle2 className="mx-auto text-mint-500" size={56} />
        <h1 className="mt-4 text-2xl font-extrabold">패키지 예매가 완료되었습니다!</h1>
        <p className="mt-2 text-muted">주문번호 <b className="font-mono text-ink">{result.orderId}</b> · {pk.name}</p>
        <ul className="mt-6 space-y-2 text-left">
          {result.bookings.map(b => {
            const p = perfs.find(x => x.id === b.perfId)!
            return (
              <li key={b.id} className="card flex items-center justify-between gap-3 p-4 text-sm">
                <span><b>{p.title}</b><br /><span className="text-muted">예매번호 {b.id} · {b.seats.map(s => s.seatId).join(', ')}</span></span>
                <span className="chip bg-brand-50 text-brand-700">{b.status}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-sm text-muted">공연별 예매 알림톡이 발송되었습니다. (오른쪽 아래 말풍선)</p>
        <div className="mt-8 flex justify-center gap-2">
          <Link to="/site/mypage/package" className="btn-primary px-6 py-3">패키지 예매내역</Link>
          <button className="btn-outline px-6 py-3" onClick={() => setPk(null)}>패키지 목록</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader crumbs={['공연', '패키지 예매']} title="패키지 예매" desc="여러 공연을 한 번에, 더 저렴하게. 시즌 패키지와 자유 패키지를 만나보세요." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {M.packages.map(p => {
            const list = eligible(p)
            const sold = p.sold + orders.filter(o => o.packageId === p.id).length
            const pct = Math.min(100, Math.round(sold / p.limit * 100))
            const onSale = p.saleStart <= M.TODAY && p.saleEnd >= M.TODAY
            return (
              <article key={p.id} className="card flex flex-col overflow-hidden">
                <div className="flex h-40 items-end gap-2 bg-gradient-to-br from-brand-600 to-brand-900 px-5 pb-0 pt-5">
                  {list.map((x, i) => (
                    <div key={x.id} className="w-20 shrink-0 overflow-hidden rounded-t-lg shadow-lg sm:w-24" style={{ transform: `rotate(${(i - 1) * 4}deg) translateY(${i % 2 ? 6 : 12}px)` }}>
                      <Poster title={x.title} palette={x.palette} motif={x.motif} showText={false} className="aspect-[5/7] w-full" />
                    </div>
                  ))}
                  <span className="ml-auto self-start rounded-2xl bg-sun-400 px-3 py-2 text-center text-ink"><b className="block text-2xl leading-none">{Math.round(p.discountRate * 100)}%</b><span className="text-[11px] font-bold">할인</span></span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex items-center gap-2"><span className={cx('chip', p.type === '시즌' ? 'bg-brand-50 text-brand-700' : 'bg-mint-400/15 text-mint-500')}>{p.type} 패키지</span><span className="text-xs text-muted">판매 {fmtRange(p.saleStart, p.saleEnd)}</span></p>
                  <h2 className="mt-2 text-xl font-extrabold">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted">{p.desc}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">{list.map(x => <li key={x.id} className="chip bg-paper text-ink">{x.title}{x.status === '오픈예정' && <span className="ml-1 text-mint-500">· 패키지 선오픈</span>}</li>)}</ul>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted"><span>판매 {sold.toLocaleString()} / {p.limit.toLocaleString()}</span><span>{pct}%</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="판매 현황"><div className="h-full rounded-full bg-coral-500" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <button className="btn-primary mt-5 py-3" disabled={!onSale || sold >= p.limit} onClick={() => choose(p)}>
                    <PackageIcon size={16} />{sold >= p.limit ? '매진' : onSale ? (p.type === '자유' ? `${p.pickCount}편 골라 예매하기` : '시즌 패키지 예매하기') : '판매 기간 아님'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
        <div className="mt-10 rounded-2xl bg-paper p-5 text-sm text-muted">
          <p className="font-bold text-ink">패키지 예매 안내</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>패키지는 일반 권종(정가) 기준으로 할인되며, 다른 할인·쿠폰과 중복 적용되지 않습니다.</li>
            <li>티켓 오픈 전 공연도 패키지 구매자는 우선 좌석 선택이 가능합니다.</li>
            <li>공연별 예매번호가 각각 발급되며, 마이페이지 &gt; 패키지 예매내역에서 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/** 좌석 등급 조회 (공연별 관리자 등급 재배정 반영) */
function useGradeFnsLookup() {
  const overrides = useStore(s => s.gradeOverrides)
  return useMemo(() => (p: Performance, seatId: string) => {
    const raw = overrides[p.id]?.[seatId] ?? M.defaultGrade(venueOf(p), seatId)
    return effGrade(p, raw)
  }, [overrides])
}

function PerfSeatPicker({ p, qty, sel, onChange }: { p: Performance; qty: number; sel: Sel; onChange: (s: Sel) => void }) {
  const rounds = usePerfRounds(p.id)
  const remain = useRemainMap(p.id)
  const gradeFn = useGradeFn(p)
  const st = useSeatState(sel.roundId)
  const round: Round | undefined = rounds.find(r => r.id === sel.roundId)
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="card p-4">
        <p className="mb-3 font-extrabold">{p.title} <span className="text-xs font-medium text-muted">{venueOf(p).name}</span></p>
        <RoundPicker rounds={rounds} remain={remain} value={sel.roundId} onChange={r => onChange({ roundId: r.id, seats: [] })} compact />
      </div>
      <div className="card p-4">
        {round ? (
          <>
            <p className="mb-3 text-sm font-bold">{fmtDate(round.date)} {round.time} · 좌석 {sel.seats.length}/{qty}매 선택</p>
            <SeatMap venue={venueOf(p)} gradeOf={gradeFn} prices={p.prices} sold={st.sold} used={st.used} held={st.held} siteOnly={st.siteOnly}
              selected={sel.seats} maxSelect={qty} distancing={round.distancing} size={isMobileWidth() ? 'sm' : 'md'}
              onToggle={id => onChange({ ...sel, seats: sel.seats.includes(id) ? sel.seats.filter(x => x !== id) : sel.seats.length >= qty ? sel.seats : [...sel.seats, id] })} />
          </>
        ) : <p className="grid h-full min-h-40 place-items-center text-sm text-muted">왼쪽에서 회차를 먼저 선택하세요.</p>}
      </div>
    </div>
  )
}
