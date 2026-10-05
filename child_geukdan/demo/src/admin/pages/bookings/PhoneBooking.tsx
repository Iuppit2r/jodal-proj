import { useMemo, useState, type ReactNode } from 'react'
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react'
import SeatMap from '../../../components/SeatMap'
import Poster from '../../../components/Poster'
import { useStore, useSeatState, venueOf } from '../../../store'
import * as M from '../../../data/mock'
import type { Member, PayMethod, SeatPick } from '../../../data/types'
import { cx, won } from '../../../lib/format'
import { Card, Field, Note, Segmented, errMsg, usePII } from '../../ui'
import { TODAY, roundLabel, seatCount, useSoldByRound } from '../../lib'
import { fmtPhone, phoneOk, ttPrice, useGradeFn } from './shared'

const STEPS = ['고객', '공연·회차', '좌석', '권종', '결제']
type Pay = Extract<PayMethod, '신용카드' | '가상계좌' | '초대'>

/** 콜센터 전화 예매 등록 (SFR-TC-012) */
export default function PhoneBooking({ onOpen }: { onOpen: (id: string) => void }) {
  const members = useStore(s => s.members)
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const soldByRound = useSoldByRound()
  const pii = usePII()

  const [step, setStep] = useState(0)
  const [custMode, setCustMode] = useState<'member' | 'guest'>('member')
  const [mq, setMq] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [guest, setGuest] = useState({ name: '', phone: '' })
  const [perfId, setPerfId] = useState('')
  const [roundId, setRoundId] = useState('')
  const [seats, setSeats] = useState<string[]>([])
  const [types, setTypes] = useState<Record<string, string>>({})
  const [pay, setPay] = useState<Pay>('신용카드')
  const [card, setCard] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ id: string; total: number; phone: string } | null>(null)

  const perf = perfs.find(p => p.id === perfId)
  const round = rounds.find(r => r.id === roundId)
  const seatState = useSeatState(roundId || undefined)
  const gradeOf = useGradeFn(perf)

  const memberHits = useMemo(() => {
    const q = mq.trim()
    if (q.length < 2) return []
    const d = q.replace(/\D/g, '')
    return members.filter(m => m.status !== '탈퇴' && (m.name.includes(q) || m.loginId.includes(q) || (d.length >= 4 && m.phone.replace(/\D/g, '').includes(d)))).slice(0, 8)
  }, [members, mq])

  const salePerfs = perfs.filter(p => p.status === '판매중' || p.status === '선예매중')
  const perfRounds = useMemo(() => rounds.filter(r => r.perfId === perfId && r.active && r.date >= TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [rounds, perfId])

  const availTypes = M.ticketTypes.filter(t => t.active && t.id !== 't-inv' && (!t.memberOnly || member?.membership?.tierId === t.memberOnly))
  const picks: SeatPick[] = seats.map(sid => {
    const g = gradeOf(sid)
    const base = perf?.prices[g] ?? perf?.prices.S ?? 0
    const tt = pay === '초대' ? 't-inv' : types[sid] ?? 't-gen'
    const rate = M.ticketTypes.find(t => t.id === tt)?.discountRate ?? 0
    return { seatId: sid, grade: g, ticketTypeId: tt, price: ttPrice(base, rate) }
  })
  const ticketSum = picks.reduce((a, s) => a + s.price, 0)
  const fee = pay === '초대' ? 0 : 1000 * seats.length
  const custName = custMode === 'member' ? member?.name ?? '' : guest.name.trim()
  const custPhone = custMode === 'member' ? member?.phone ?? '' : fmtPhone(guest.phone)

  const validate = (s: number): string => {
    if (s === 0) {
      if (custMode === 'member' && !member) return errMsg('E-TC-201', '회원을 검색하여 선택해 주세요')
      if (custMode === 'guest' && !guest.name.trim()) return errMsg('E-TC-202', '예매자 이름을 입력해 주세요')
      if (custMode === 'guest' && !phoneOk(guest.phone)) return errMsg('E-TC-203', '휴대폰 번호 형식이 올바르지 않습니다 (예: 010-1234-5678)')
    }
    if (s === 1 && (!perfId || !roundId)) return errMsg('E-TC-204', '공연과 회차를 선택해 주세요')
    if (s === 2 && !seats.length) return errMsg('E-TC-205', '좌석을 1매 이상 선택해 주세요')
    return ''
  }
  const next = () => { const e = validate(step); setErr(e); if (!e) setStep(step + 1) }

  const submit = () => {
    if (pay === '신용카드' && card.replace(/\D/g, '').length !== 16) { setErr(errMsg('E-TC-501', '카드번호 16자리를 입력해 주세요')); return }
    const taken = seats.filter(s => seatState.sold.has(s) || seatState.held.has(s))
    if (taken.length) { setErr(errMsg('E-TC-420', `이미 판매된 좌석입니다 (${taken.join(', ')})`)); setStep(2); return }
    const st = useStore.getState()
    const b = st.createBooking({
      perfId, roundId, seats: picks, payMethod: pay, channel: '콜센터', bookerName: custName, bookerPhone: custPhone,
      userId: member?.id, fee,
    })
    st.patchBooking(b.id, member ? {} : { userId: undefined }, `콜센터 상담원 등록 (${custMode === 'member' ? `회원 ${member!.loginId}` : '비회원'}${pay === '신용카드' ? `, 카드 ****-${card.replace(/\D/g, '').slice(-4)}` : ''})`)
    st.log('콜센터 예매 등록', `${b.id} ${perf?.title} ${seats.length}매`)
    st.toast(`예매 등록 완료 · ${b.id}`)
    setDone({ id: b.id, total: b.total, phone: custPhone })
  }

  const reset = () => {
    setStep(0); setMember(null); setGuest({ name: '', phone: '' }); setMq(''); setPerfId(''); setRoundId('')
    setSeats([]); setTypes({}); setPay('신용카드'); setCard(''); setErr(''); setDone(null)
  }

  if (done) {
    return (
      <Card>
        <div className="mx-auto max-w-md py-8 text-center">
          <CheckCircle2 size={48} className="mx-auto text-mint-500" />
          <h2 className="mt-3 text-lg font-extrabold">예매가 등록되었습니다</h2>
          <div className="mt-4 rounded-xl bg-paper p-4 text-sm">
            <div className="text-xs text-muted">예매번호</div>
            <div className="font-mono text-2xl font-extrabold tracking-wider text-brand-600">{done.id}</div>
            <div className="mt-2 text-muted">{perf?.title} · {roundLabel(round)} · {seats.join(', ')}</div>
            <div className="mt-1 font-bold">{won(done.total)} ({pay})</div>
          </div>
          <p className="mt-3 text-xs text-muted">{pii.phone(done.phone)} 으로 {pay === '가상계좌' ? '가상계좌 입금 안내' : '예매 확인'} 알림톡이 발송되었습니다.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-outline btn-sm" onClick={reset}>새 예매 등록</button>
            <button className="btn-primary btn-sm" onClick={() => onOpen(done.id)}>상세 보기</button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <Card bodyClass="p-0">
        {/* stepper */}
        <ol className="flex overflow-x-auto border-b border-line px-2">
          {STEPS.map((s, i) => (
            <li key={s} className={cx('flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold', i === step ? 'text-brand-600' : i < step ? 'text-ink' : 'text-muted')}>
              <span className={cx('grid h-6 w-6 place-items-center rounded-full text-xs', i < step ? 'bg-mint-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-paper')}>
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              {s}
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </li>
          ))}
        </ol>

        <div className="min-h-[360px] p-4">
          {step === 0 && (
            <div className="space-y-4">
              <Segmented options={[{ value: 'member', label: '회원 검색' }, { value: 'guest', label: '비회원' }]} value={custMode} onChange={v => { setCustMode(v); setErr('') }} />
              {custMode === 'member' ? (
                <div className="max-w-xl space-y-2">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input className="input pl-9" value={mq} onChange={e => setMq(e.target.value)} placeholder="이름 / 휴대폰 / 회원ID (2자 이상) — 예: 김시연, 5678, demo" autoFocus />
                  </div>
                  <ul className="divide-y divide-line rounded-lg border border-line">
                    {memberHits.map(m => (
                      <li key={m.id}>
                        <button onClick={() => { setMember(m); setErr('') }} className={cx('flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-paper', member?.id === m.id && 'bg-brand-50')}>
                          <UserRound size={16} className="text-muted" />
                          <span className="font-semibold">{pii.name(m.name)}</span>
                          <span className="text-xs text-muted">{m.loginId}</span>
                          <span className="tabular-nums text-xs text-muted">{pii.phone(m.phone)}</span>
                          {m.membership && <span className="chip ml-auto bg-amber-50 text-amber-700">{M.tiers.find(t => t.id === m.membership!.tierId)?.name}</span>}
                          {member?.id === m.id && <Check size={15} className="text-brand-600" />}
                        </button>
                      </li>
                    ))}
                    {mq.trim().length >= 2 && !memberHits.length && <li className="px-3 py-4 text-center text-xs text-muted">{errMsg('E-PM-404', '일치하는 회원이 없습니다')} – 비회원으로 등록하세요.</li>}
                    {mq.trim().length < 2 && <li className="px-3 py-4 text-center text-xs text-muted">검색어를 입력하세요.</li>}
                  </ul>
                </div>
              ) : (
                <div className="grid max-w-xl gap-3 sm:grid-cols-2">
                  <Field label="예매자 이름" required><input className="input" value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} placeholder="홍길동" /></Field>
                  <Field label="휴대폰" required><input className="input" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} placeholder="010-0000-0000" inputMode="tel" /></Field>
                  <Note className="sm:col-span-2">비회원 예매는 예매번호 + 휴대폰 번호로 조회·취소할 수 있습니다. 녹취 동의 및 본인확인 후 진행하세요.</Note>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {salePerfs.map(p => (
                  <button key={p.id} onClick={() => { setPerfId(p.id); setRoundId(''); setSeats([]); setTypes({}); setErr('') }}
                    className={cx('flex gap-3 rounded-xl border p-3 text-left transition', perfId === p.id ? 'border-brand-600 ring-2 ring-brand-100' : 'border-line hover:border-brand-500')}>
                    <div className="w-14 shrink-0 overflow-hidden rounded-md"><Poster title={p.title} palette={p.palette} motif={p.motif} showText={false} className="block h-auto w-full" /></div>
                    <div className="min-w-0">
                      <div className="truncate font-bold">{p.title}</div>
                      <div className="text-xs text-muted">{venueOf(p).name} · {p.start} ~ {p.end}</div>
                      <div className="mt-1 text-xs">{Object.entries(p.prices).map(([g, v]) => `${g}석 ${v!.toLocaleString()}`).join(' / ')}</div>
                    </div>
                  </button>
                ))}
              </div>
              {perf && (
                <div>
                  <div className="mb-2 text-xs font-bold text-muted">회차 선택 ({perfRounds.length}회차)</div>
                  <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                    {perfRounds.map(r => {
                      const remain = seatCount(perf) - (soldByRound.get(r.id) ?? 0)
                      return (
                        <button key={r.id} onClick={() => { setRoundId(r.id); setSeats([]); setTypes({}); setErr('') }} disabled={remain <= 0}
                          className={cx('rounded-lg border px-3 py-2 text-left text-xs transition disabled:opacity-40', roundId === r.id ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-500')}>
                          <div className="font-bold">{roundLabel(r)}</div>
                          <div className={cx('mt-0.5', remain < 20 ? 'text-coral-500' : 'text-muted')}>잔여 {remain}석{r.note && ` · ${r.note}`}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && perf && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{perf.title} · {roundLabel(round)}</span>
                <span className="text-xs text-muted">최대 8매 · 현장/콜센터 전용석 선택 가능 · 선택 {seats.length}매</span>
              </div>
              <div className="rounded-xl border border-line p-3">
                <SeatMap venue={venueOf(perf)} gradeOf={gradeOf} prices={perf.prices} mode="pos" maxSelect={8}
                  sold={seatState.sold} used={seatState.used} held={seatState.held} siteOnly={seatState.siteOnly}
                  selected={seats} distancing={round?.distancing}
                  onToggle={id => { setErr(''); setSeats(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]) }} />
              </div>
            </div>
          )}

          {step === 3 && perf && (
            <div className="space-y-3">
              {pay === '초대' && <Note tone="warn">결제수단이 ‘초대’로 선택되어 모든 좌석이 초대권(0원)으로 처리됩니다.</Note>}
              <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
                <table className="tbl">
                  <thead><tr><th>좌석</th><th>등급</th><th>권종</th><th className="text-right">정가</th><th className="text-right">판매가</th></tr></thead>
                  <tbody>
                    {picks.map(p => (
                      <tr key={p.seatId}>
                        <td className="font-semibold">{p.seatId}</td>
                        <td>{M.gradeLabel[p.grade]}</td>
                        <td>
                          <select className="input py-1.5 text-xs" value={p.ticketTypeId} disabled={pay === '초대'} onChange={e => setTypes(t => ({ ...t, [p.seatId]: e.target.value }))}>
                            {pay === '초대' ? <option value="t-inv">초대권</option> : availTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.discountRate ? ` (${Math.round(t.discountRate * 100)}%)` : ''}</option>)}
                          </select>
                        </td>
                        <td className="text-right tabular-nums text-muted">{won(perf.prices[p.grade] ?? 0)}</td>
                        <td className="text-right font-semibold tabular-nums">{won(p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {picks.some(p => M.ticketTypes.find(t => t.id === p.ticketTypeId)?.needsProof) && (
                <Note tone="warn">증빙이 필요한 할인 권종이 포함되어 있습니다. 관람 당일 매표소에서 증빙서류(신분증·복지카드 등)를 확인하도록 안내하세요.</Note>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="max-w-xl space-y-4">
              <Segmented options={[{ value: '신용카드', label: '신용카드' }, { value: '가상계좌', label: '가상계좌' }, { value: '초대', label: '초대(무료)' }]}
                value={pay} onChange={v => { setPay(v); setErr('') }} />
              {pay === '신용카드' && (
                <Field label="카드번호 (상담원 대리 입력 · 시연)" required hint="실제 운영 시 ARS 안전결제로 전환되어 상담원에게 카드번호가 노출되지 않습니다.">
                  <input className="input font-mono tracking-widest" value={card} inputMode="numeric" placeholder="0000-0000-0000-0000"
                    onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(0, 16); setCard(d.replace(/(\d{4})(?=\d)/g, '$1-')); setErr('') }} />
                </Field>
              )}
              {pay === '가상계좌' && <Note>국민은행 가상계좌가 발급되며, 입금기한(익일 23:59) 내 미입금 시 자동 취소됩니다. 계좌 정보는 알림톡으로 발송됩니다.</Note>}
              {pay === '초대' && <Note tone="warn">초대권은 예매수수료가 면제되며 정산 시 초대 매수로 집계됩니다.</Note>}
            </div>
          )}

          {err && <Note tone="err" className="mt-4">{err}</Note>}
        </div>

        <div className="flex justify-between border-t border-line px-4 py-3">
          <button className="btn-outline btn-sm" disabled={step === 0} onClick={() => { setErr(''); setStep(step - 1) }}><ChevronLeft size={14} />이전</button>
          {step < 4
            ? <button className="btn-primary btn-sm" onClick={next}>다음<ChevronRight size={14} /></button>
            : <button className="btn-primary btn-sm" onClick={submit}>{pay === '가상계좌' ? '가상계좌 발급 · 예매' : pay === '초대' ? '초대 예매 등록' : '결제 · 예매 완료'}</button>}
        </div>
      </Card>

      {/* 요약 */}
      <Card title="예매 요약" className="h-fit xl:sticky xl:top-28">
        <dl className="space-y-2 text-sm">
          <Row l="고객" v={custName ? <>{pii.name(custName)}<span className="ml-1 text-xs text-muted">{custMode === 'member' ? member?.loginId : '비회원'}</span></> : '-'} />
          <Row l="연락처" v={custPhone ? pii.phone(custPhone) : '-'} />
          <Row l="공연" v={perf?.title ?? '-'} />
          <Row l="회차" v={round ? roundLabel(round) : '-'} />
          <Row l="좌석" v={seats.length ? seats.join(', ') : '-'} />
          <div className="border-t border-line pt-2" />
          <Row l="티켓금액" v={won(ticketSum)} />
          <Row l={`예매수수료${pay === '초대' ? ' (면제)' : ''}`} v={won(fee)} />
          <div className="flex items-center justify-between border-t border-line pt-2">
            <dt className="font-bold">결제 예정금액</dt><dd className="text-lg font-extrabold text-brand-600">{won(ticketSum + fee)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-muted">채널: 콜센터 · 상담원 처리 내역은 변경이력에 기록됩니다.</p>
      </Card>
    </div>
  )
}

function Row({ l, v }: { l: string; v: ReactNode }) {
  return <div className="flex items-start justify-between gap-3"><dt className="shrink-0 text-muted">{l}</dt><dd className="min-w-0 text-right font-semibold">{v}</dd></div>
}
