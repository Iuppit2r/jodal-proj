import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Building2, CreditCard, Info, Smartphone, Timer } from 'lucide-react'
import SeatMap from '../../components/SeatMap'
import Poster from '../../components/Poster'
import * as M from '../../data/mock'
import type { Grade, PayMethod, Performance, Round, SeatPick } from '../../data/types'
import { ageOf, memberTier, saleState, useMe, useSeatState, useStore, venueOf } from '../../store'
import { cx, fmtDate, won } from '../../lib/format'
import { PgModal, Required, RoundPicker, Stepper } from '../parts/ui'
import {
  applyRate, BOOKING_FEE, couponDiscount, couponLabel, isMobileWidth, priceOf, ticketTypeOf, usableCoupons, useGradeFn, usePerfRounds, useRemainMap,
} from '../parts/perf'

const STEPS = ['날짜·회차', '좌석 선택', '권종·할인', '예매자 정보·결제']
const HOLD_SEC = 600
const MAX = 8

export default function Booking() {
  const { perfId } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const me = useMe()
  const perfs = useStore(s => s.performances)
  const p = perfs.find(x => x.id === perfId && x.status !== '임시저장')
  const pending = useStore(s => s.pendingBooking)
  const set = useStore(s => s.set)
  const toast = useStore(s => s.toast)

  // 로그인 필요 → 선택 정보 유지 후 로그인으로 (SFR-TC-008)
  const redirected = useRef(false)
  useEffect(() => {
    if (me || !p || redirected.current) return
    redirected.current = true
    set({ pendingBooking: { perfId: p.id, roundId: sp.get('round') ?? (pending?.perfId === p.id ? pending.roundId : undefined) } })
    toast('예매는 로그인 후 이용할 수 있습니다', 'warn')
    nav(`/site/login?next=/site/book/${p.id}`, { replace: true })
  }, [me, p]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <Blocked title="공연 정보를 찾을 수 없습니다." />
  if (!me) return null
  const sale = saleState(p, me)
  if (!sale.canBook) {
    return (
      <Blocked title={`${p.title} — ${sale.label}`}
        desc={sale.presale ? '현재 유료 멤버십 회원 선예매 기간입니다. 멤버십 가입 후 바로 선예매하실 수 있습니다.' : '현재 예매 가능한 기간이 아닙니다.'}
        action={sale.presale ? <Link to="/site/membership" className="btn-accent">멤버십 가입하기</Link> : <Link to={`/site/performances/${p.id}`} className="btn-primary">공연 정보 보기</Link>} />
    )
  }
  return <BookingFlow p={p} presale={sale.presale} />
}

function Blocked({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <AlertCircle className="mx-auto text-coral-500" size={40} />
      <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
      {desc && <p className="mt-2 text-sm text-muted">{desc}</p>}
      <div className="mt-6 flex justify-center gap-2">{action ?? <Link to="/site/performances" className="btn-primary">공연 목록</Link>}</div>
    </div>
  )
}

function BookingFlow({ p, presale }: { p: Performance; presale: boolean }) {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const me = useMe()!
  const tier = memberTier(me)
  const youth = ageOf(me.birth) < 19
  const pending = useStore(s => s.pendingBooking)
  const set = useStore(s => s.set)
  const toast = useStore(s => s.toast)
  const createBooking = useStore(s => s.createBooking)
  const coupons = useStore(s => s.coupons)
  const rounds = usePerfRounds(p.id)
  const remain = useRemainMap(p.id)
  const gradeFn = useGradeFn(p)
  const v = venueOf(p)

  const [step, setStep] = useState(0)
  const [round, setRound] = useState<Round | undefined>()
  const [seats, setSeats] = useState<string[]>([])
  const [types, setTypes] = useState<Record<string, string>>({})
  const [couponId, setCouponId] = useState('')
  const [bookerName, setBookerName] = useState(me.name)
  const [bookerPhone, setBookerPhone] = useState(me.phone)
  const [viewerName, setViewerName] = useState('')
  const [pay, setPay] = useState<PayMethod>('신용카드')
  const [agreeCancel, setAgreeCancel] = useState(false)
  const [agreePriv, setAgreePriv] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pg, setPg] = useState(false)
  const [holdUntil, setHoldUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const topRef = useRef<HTMLDivElement>(null)
  const startHold = () => { const t = Date.now(); setNow(t); setHoldUntil(t + HOLD_SEC * 1000) }

  // 로그인 전 선택한 회차로 복귀
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const rid = sp.get('round') ?? (pending?.perfId === p.id ? pending.roundId : undefined)
    const r = rounds.find(x => x.id === rid)
    if (r) { setRound(r); setStep(1); startHold(); toast(`선택하신 ${r.date.slice(5).replace('-', '/')} ${r.time} 회차로 예매를 이어갑니다`) }
    if (pending) set({ pendingBooking: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 좌석 선점 타이머
  useEffect(() => {
    if (!holdUntil) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [holdUntil])
  const left = holdUntil ? Math.max(0, Math.round((holdUntil - now) / 1000)) : HOLD_SEC
  useEffect(() => {
    if (holdUntil && left === 0) {
      toast('좌석 선점 시간(10분)이 만료되었습니다. 다시 선택해주세요', 'err')
      setSeats([]); setTypes({}); setStep(0); setHoldUntil(null)
    }
  }, [left, holdUntil, toast])

  const st = useSeatState(round?.id)

  const goStep = (n: number) => { setStep(n); topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  // 권종 목록 (멤버십 할인은 해당 등급만)
  const typeOptions = M.ticketTypes.filter(t => t.active && t.id !== 't-inv' && (!t.memberOnly || t.memberOnly === tier?.id))
  const memberLimit = tier?.id === 'tier-tree' ? 4 : 2

  const toggleSeat = (id: string) => {
    setSeats(cur => {
      if (cur.includes(id)) return cur.filter(s => s !== id)
      if (cur.length >= MAX) { toast(`1회 최대 ${MAX}매까지 예매할 수 있습니다`, 'warn'); return cur }
      return [...cur, id]
    })
  }

  // 좌석 확정 시 기본 권종 자동 적용 (멤버십 / 청소년 회원)
  const applyDefaults = () => {
    const mt = typeOptions.find(t => t.memberOnly)
    const next: Record<string, string> = {}
    seats.forEach((s, i) => {
      if (types[s]) { next[s] = types[s]; return }
      if (youth && i === 0) next[s] = 't-youth'
      else if (mt && i < memberLimit) next[s] = mt.id
      else next[s] = 't-gen'
    })
    setTypes(next)
  }

  const picks: SeatPick[] = useMemo(() => seats.map(s => {
    const g = gradeFn(s) as Grade
    const tt = ticketTypeOf(types[s] ?? 't-gen')!
    return { seatId: s, grade: g, ticketTypeId: tt.id, price: applyRate(priceOf(p, g), tt.discountRate) }
  }), [seats, types, gradeFn, p])
  const base = seats.reduce((a, s) => a + priceOf(p, gradeFn(s)), 0)
  const subtotal = picks.reduce((a, s) => a + s.price, 0)
  const myCoupons = usableCoupons(coupons, me)
  const coupon = myCoupons.find(c => c.id === couponId)
  const cDisc = couponDiscount(coupon, picks)
  const fee = tier ? 0 : BOOKING_FEE * seats.length
  const total = Math.max(0, subtotal - cDisc + fee)
  const memberUsed = picks.filter(s => ticketTypeOf(s.ticketTypeId)?.memberOnly).length

  useEffect(() => { if (couponId && coupon && cDisc === 0) setCouponId('') }, [couponId, coupon, cDisc])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!bookerName.trim()) e.bookerName = '예매자 이름을 입력해주세요.'
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(bookerPhone.trim())) e.bookerPhone = '휴대폰 번호를 정확히 입력해주세요. (예: 010-1234-5678)'
    if (!agreeCancel) e.agreeCancel = '취소 수수료 규정에 동의해주세요.'
    if (!agreePriv) e.agreePriv = '개인정보 제3자 제공에 동의해주세요.'
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) document.getElementById(`f-${first}`)?.focus()
    return !first
  }

  const next = () => {
    if (step === 0) {
      if (!round) { toast('관람하실 회차를 선택해주세요', 'warn'); return }
      if (!holdUntil) startHold()
      goStep(1)
    } else if (step === 1) {
      if (!seats.length) { toast('좌석을 선택해주세요', 'warn'); return }
      applyDefaults(); goStep(2)
    } else if (step === 2) {
      if (memberUsed > memberLimit) { toast(`멤버십 할인은 최대 ${memberLimit}매까지 적용됩니다`, 'err'); return }
      goStep(3)
    } else if (validate()) setPg(true)
  }

  const complete = useCallback(() => {
    // 결제 직전 좌석 재확인 (동시 예매 방지)
    const taken = seats.filter(s => st.sold.has(s) || st.held.has(s))
    if (taken.length) { setPg(false); toast(`이미 판매된 좌석이 있습니다: ${taken.join(', ')}`, 'err'); setSeats(c => c.filter(s => !taken.includes(s))); goStep(1); return }
    const b = createBooking({
      perfId: p.id, roundId: round!.id, seats: picks, payMethod: pay, channel: isMobileWidth() ? '모바일' : '홈페이지',
      bookerName: bookerName.trim(), bookerPhone: bookerPhone.trim(), viewerName: viewerName.trim() || undefined,
      couponId: coupon && cDisc ? coupon.id : undefined, couponDiscount: cDisc, fee, userId: me.id,
    })
    if (presale) useStore.getState().patchBooking(b.id, {}, '유료회원 선예매로 예매')
    setPg(false)
    nav(`/site/book/complete/${b.id}`, { replace: true })
  }, [seats, st, picks, pay, bookerName, bookerPhone, viewerName, coupon, cDisc, fee, me.id, p.id, round, presale]) // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const errList = Object.values(errors)

  return (
    <div className="bg-paper pb-28 lg:pb-12">
      <div ref={topRef} className="scroll-mt-32 border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center gap-3">
            <Link to={`/site/performances/${p.id}`} className="btn-ghost -ml-2 p-2" aria-label="공연 상세로 돌아가기"><ArrowLeft size={20} /></Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-600">{presale ? '유료회원 선예매' : '온라인 예매'} · {v.name}</p>
              <h1 className="truncate text-lg font-extrabold sm:text-xl">{p.title}</h1>
            </div>
            {holdUntil && step > 0 && (
              <p className={cx('ml-auto flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold', left < 120 ? 'bg-coral-500 text-white' : 'bg-sun-300 text-ink')} role="timer" aria-label={`좌석 선점 남은 시간 ${mm}분 ${ss}초`}>
                <Timer size={14} />{mm}:{ss}
              </p>
            )}
          </div>
          <div className="mt-4"><Stepper steps={STEPS} current={step} /></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {step === 0 && (
            <section className="card p-5" aria-labelledby="s0">
              <h2 id="s0" className="mb-4 text-lg font-extrabold">관람일과 회차를 선택하세요</h2>
              <RoundPicker rounds={rounds} remain={remain} value={round?.id} onChange={r => { if (r.id !== round?.id) { setSeats([]); setTypes({}) } setRound(r) }} />
            </section>
          )}

          {step === 1 && round && (
            <section className="card p-4 sm:p-5" aria-labelledby="s1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 id="s1" className="text-lg font-extrabold">좌석을 선택하세요 <span className="text-sm font-medium text-muted">(최대 {MAX}매)</span></h2>
                <button className="btn-outline btn-sm" onClick={() => goStep(0)}>{fmtDate(round.date)} {round.time} 변경</button>
              </div>
              {round.distancing && round.distancing !== 'none' && <p className="mb-3 rounded-lg bg-mint-400/10 p-2.5 text-xs text-mint-500">이 회차는 거리두기 좌석제로 운영됩니다. 판매 좌석 양옆은 선택할 수 없습니다.</p>}
              <SeatMap venue={v} gradeOf={gradeFn} prices={p.prices} sold={st.sold} used={st.used} held={st.held} siteOnly={st.siteOnly}
                selected={seats} onToggle={toggleSeat} mode="buy" distancing={round.distancing} maxSelect={MAX} size={isMobileWidth() ? 'sm' : 'md'} />
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><Info size={14} className="mt-0.5 shrink-0" />좌석을 누르면 선택/해제됩니다. 휠체어석(♿)은 동반 1인 좌석이 함께 안내되며, 키보드 Tab·Enter로도 선택할 수 있습니다.</p>
            </section>
          )}

          {step === 2 && (
            <section className="card p-5" aria-labelledby="s2">
              <h2 id="s2" className="text-lg font-extrabold">권종·할인 선택</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tier && <span className="chip text-white" style={{ background: tier.color }}>{tier.name} 멤버십 할인 {Math.round(tier.discountRate * 100)}% · 최대 {memberLimit}매 · 예매수수료 면제</span>}
                {youth && <span className="chip bg-mint-500 text-white">청소년 회원 할인 자동 적용 (만 {ageOf(me.birth)}세)</span>}
              </div>
              <ul className="mt-4 divide-y divide-line">
                {picks.map(s => {
                  const tt = ticketTypeOf(s.ticketTypeId)!
                  return (
                    <li key={s.seatId} className="grid gap-2 py-3 sm:grid-cols-[120px_1fr_100px] sm:items-center">
                      <div>
                        <p className="font-bold">{s.seatId.replace('-', '열 ')}번</p>
                        <p className="text-xs" style={{ color: M.gradeColor[s.grade] }}>{M.gradeLabel[s.grade]} {won(priceOf(p, s.grade))}</p>
                      </div>
                      <div>
                        <label htmlFor={`tt-${s.seatId}`} className="sr-only">{s.seatId} 권종</label>
                        <select id={`tt-${s.seatId}`} className="input" value={s.ticketTypeId} onChange={e => setTypes(t => ({ ...t, [s.seatId]: e.target.value }))}>
                          {typeOptions.map(t => {
                            const full = !!t.memberOnly && t.id !== s.ticketTypeId && memberUsed >= memberLimit
                            return <option key={t.id} value={t.id} disabled={full}>{t.name}{t.discountRate ? ` (${Math.round(t.discountRate * 100)}%)` : ''}{full ? ' - 한도 초과' : ''}</option>
                          })}
                        </select>
                        {tt.needsProof && <p className="mt-1 text-xs text-amber-700">⚠ 현장 증빙 필요 — {tt.desc}</p>}
                        {tt.memberOnly && <p className="mt-1 text-xs text-brand-600">{tt.desc}</p>}
                      </div>
                      <p className="text-right font-bold">{won(s.price)}</p>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 rounded-xl bg-paper p-4">
                <label htmlFor="coupon" className="label">쿠폰·예매권</label>
                <select id="coupon" className="input" value={couponId} onChange={e => setCouponId(e.target.value)}>
                  <option value="">적용 안 함 (보유 {myCoupons.length}장)</option>
                  {myCoupons.map(c => {
                    const ok = couponDiscount(c, picks) > 0
                    return <option key={c.id} value={c.id} disabled={!ok}>{c.name} · {couponLabel(c)}{c.minPrice ? ` (${won(c.minPrice)} 이상)` : ''}{!ok ? ' - 사용 조건 미달' : ''} ~{c.until}</option>
                  })}
                </select>
                {cDisc > 0 && <p className="mt-2 text-sm font-semibold text-coral-500">-{won(cDisc)} 할인 적용</p>}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="card p-5" aria-labelledby="s3">
              <h2 id="s3" className="text-lg font-extrabold">예매자 정보</h2>
              {errList.length > 0 && (
                <div role="alert" className="mt-3 rounded-lg border border-coral-400 bg-coral-400/10 p-3 text-sm text-coral-500">
                  <p className="font-bold">입력 항목을 확인해주세요 ({errList.length}건)</p>
                  <ul className="mt-1 list-disc pl-5">{errList.map(e => <li key={e}>{e}</li>)}</ul>
                </div>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field id="bookerName" label="예매자명" required error={errors.bookerName}>
                  <input id="f-bookerName" className="input" value={bookerName} onChange={e => setBookerName(e.target.value)} aria-invalid={!!errors.bookerName} aria-describedby="e-bookerName" autoComplete="name" />
                </Field>
                <Field id="bookerPhone" label="휴대폰 번호" required error={errors.bookerPhone} hint="예매 확인 알림톡이 발송됩니다.">
                  <input id="f-bookerPhone" className="input" value={bookerPhone} onChange={e => setBookerPhone(e.target.value)} inputMode="tel" aria-invalid={!!errors.bookerPhone} aria-describedby="e-bookerPhone" autoComplete="tel" />
                </Field>
                <Field id="viewerName" label="관람자명 (선택)" hint="예매자와 관람자가 다른 경우 입력해주세요.">
                  <input id="f-viewerName" className="input" value={viewerName} onChange={e => setViewerName(e.target.value)} placeholder="예: 김하늘 외 1인" />
                </Field>
              </div>

              <h2 className="mt-8 text-lg font-extrabold">결제 수단</h2>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="결제 수단">
                {([['신용카드', CreditCard], ['간편결제', Smartphone], ['가상계좌', Building2]] as const).map(([m, Icon]) => (
                  <button key={m} type="button" role="radio" aria-checked={pay === m} onClick={() => setPay(m)}
                    className={cx('flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-semibold transition', pay === m ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-line bg-white hover:border-brand-500')}>
                    <Icon size={22} />{m}
                  </button>
                ))}
              </div>
              {pay === '간편결제' && <p className="mt-2 text-xs text-muted">카카오페이 · 네이버페이 · 토스페이 · PAYCO 중 결제창에서 선택</p>}
              {pay === '가상계좌' && <p className="mt-2 text-xs text-amber-700">입금 기한(익일 23:59)까지 미입금 시 자동 취소됩니다. 입금 전 마이페이지에서 신용카드로 변경할 수 있습니다.</p>}

              <div className="mt-8 space-y-3">
                <Agree id="agreeCancel" checked={agreeCancel} onChange={setAgreeCancel} error={errors.agreeCancel} label="[필수] 취소 수수료 규정 및 예매 유의사항에 동의합니다.">
                  관람일 10일 전까지 무료 · 9~7일 전 매당 1,000원 · 6~3일 전 10% · 2~1일 전 30% · 당일 취소 불가
                </Agree>
                <Agree id="agreePriv" checked={agreePriv} onChange={setAgreePriv} error={errors.agreePriv} label="[필수] 개인정보 제3자 제공에 동의합니다.">
                  제공받는 자: 공연 기획사(대관공연에 한함) · 결제대행사 / 항목: 예매자명, 휴대폰번호 / 보유기간: 관람일 후 1년
                </Agree>
              </div>
            </section>
          )}
        </div>

        {/* 요약 (데스크톱 사이드바) */}
        <aside className="hidden lg:block" aria-label="예매 정보 요약">
          <div className="card sticky top-36 overflow-hidden">
            <div className="flex gap-3 border-b border-line p-4">
              <div className="w-16 shrink-0 overflow-hidden rounded-lg"><Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="aspect-[5/7] w-full" /></div>
              <div className="min-w-0 text-sm">
                <p className="font-bold leading-snug">{p.title}</p>
                <p className="mt-1 text-muted">{round ? `${fmtDate(round.date)} ${round.time}` : '회차 미선택'}</p>
                <p className="text-muted">{v.name}</p>
              </div>
            </div>
            <Summary picks={picks} base={base} subtotal={subtotal} cDisc={cDisc} fee={fee} total={total} feeWaived={!!tier} />
            <div className="flex gap-2 p-4 pt-0">
              {step > 0 && <button className="btn-outline" onClick={() => goStep(step - 1)}>이전</button>}
              <button className="btn-primary flex-1 py-3" onClick={next}>{step === 3 ? `${won(total)} 결제하기` : '다음 단계'} {step < 3 && <ArrowRight size={16} />}</button>
            </div>
          </div>
        </aside>
      </div>

      {/* 모바일 하단 바 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pr-20 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,.06)] lg:hidden hc-surface">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{round ? `${round.date.slice(5).replace('-', '/')} ${round.time}` : '회차 미선택'}{seats.length ? ` · ${seats.join(', ')}` : ''}</p>
            <p className="text-lg font-extrabold">{won(seats.length ? total : 0)}</p>
          </div>
          {step > 0 && <button className="btn-outline px-3" onClick={() => goStep(step - 1)} aria-label="이전 단계">이전</button>}
          <button className="btn-primary px-5 py-3" onClick={next}>{step === 3 ? '결제' : '다음'}</button>
        </div>
      </div>

      <PgModal open={pg} amount={total} method={pay} onClose={() => setPg(false)} onDone={complete} />
    </div>
  )
}

function Summary({ picks, base, subtotal, cDisc, fee, total, feeWaived }: { picks: SeatPick[]; base: number; subtotal: number; cDisc: number; fee: number; total: number; feeWaived: boolean }) {
  return (
    <div className="space-y-3 p-4 text-sm">
      <div>
        <p className="mb-1.5 font-bold">선택 좌석 {picks.length}매</p>
        {picks.length ? (
          <ul className="flex flex-wrap gap-1">{picks.map(s => <li key={s.seatId} className="chip text-white" style={{ background: M.gradeColor[s.grade] }}>{s.seatId}</li>)}</ul>
        ) : <p className="text-xs text-muted">선택한 좌석이 없습니다.</p>}
      </div>
      <dl className="space-y-1.5 border-t border-line pt-3">
        <div className="flex justify-between"><dt className="text-muted">티켓 금액</dt><dd>{won(base)}</dd></div>
        {base - subtotal > 0 && <div className="flex justify-between text-coral-500"><dt>권종 할인</dt><dd>-{won(base - subtotal)}</dd></div>}
        {cDisc > 0 && <div className="flex justify-between text-coral-500"><dt>쿠폰 할인</dt><dd>-{won(cDisc)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">예매수수료</dt><dd>{feeWaived ? <span className="text-mint-500">멤버십 면제</span> : won(fee)}</dd></div>
        <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-bold">총 결제금액</dt><dd className="text-xl font-extrabold text-brand-600">{won(total)}</dd></div>
      </dl>
    </div>
  )
}

function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="label">{label}{required && <Required />}</label>
      {children}
      <p id={`e-${id}`} className={cx('mt-1 text-xs', error ? 'text-coral-500' : 'text-muted')} aria-live="polite">{error ?? hint}</p>
    </div>
  )
}

function Agree({ id, checked, onChange, error, label, children }: { id: string; checked: boolean; onChange: (b: boolean) => void; error?: string; label: string; children: React.ReactNode }) {
  return (
    <div className={cx('rounded-xl border p-3', error ? 'border-coral-500 bg-coral-400/5' : 'border-line')}>
      <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold">
        <input id={`f-${id}`} type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={checked} onChange={e => onChange(e.target.checked)} aria-invalid={!!error} aria-describedby={`e-${id}`} />
        {label}
      </label>
      <p className="mt-1 pl-6 text-xs text-muted">{children}</p>
      {error && <p id={`e-${id}`} className="mt-1 pl-6 text-xs font-semibold text-coral-500">{error}</p>}
    </div>
  )
}
