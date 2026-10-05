import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Check, ChevronDown, CreditCard, Crown, Gift, Leaf, Monitor, Sprout, Ticket, TreeDeciduous } from 'lucide-react'
import PageHeader from '../PageHeader'
import Modal from '../../components/Modal'
import * as M from '../../data/mock'
import type { MembershipTier } from '../../data/types'
import { memberTier, useMe, useStore } from '../../store'
import { cx, fmtDate, won } from '../../lib/format'
import { PgModal, useIsMobile } from '../parts/ui'

const FAQ = [
  { q: '선예매는 언제 할 수 있나요?', a: '일반 예매 오픈 3일 전 14시부터 로그인한 멤버십 회원에게 ‘멤버십 선예매’ 버튼이 노출됩니다.' },
  { q: '멤버십 할인은 몇 매까지 적용되나요?', a: '새싹 등급은 본인 포함 2매, 나무 등급은 본인 포함 4매까지 회차별로 적용됩니다.' },
  { q: '유효기간과 자동연장은 어떻게 되나요?', a: '가입일로부터 1년간 유효하며, 자동연장을 설정하면 만료 7일 전 알림 후 등록된 결제수단으로 연장됩니다.' },
  { q: '중도 해지 시 환불되나요?', a: '가입 후 7일 이내 혜택 미사용 시 전액 환불되며, 이후에는 잔여 개월 수에 따라 일할 환불됩니다. (사용한 예매권·쿠폰 금액 차감)' },
  { q: '모바일에서도 가입할 수 있나요?', a: '유료 멤버십 가입은 PC 홈페이지에서 가능하며, 모바일 웹에서는 가입내역 조회만 가능합니다.' },
]

const tierIcon = (id: string) => (id === 'tier-tree' ? TreeDeciduous : Sprout)

export default function Membership() {
  const me = useMe()
  const tier = memberTier(me)
  const mobile = useIsMobile()
  const nav = useNavigate()
  const toast = useStore(s => s.toast)
  const update = useStore(s => s.updateMember)
  const cancel = useStore(s => s.cancelMembership)
  const [join, setJoin] = useState<MembershipTier | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const startJoin = (t: MembershipTier) => {
    if (!me) { toast('로그인 후 가입할 수 있습니다', 'warn'); nav('/site/login?next=/site/membership'); return }
    if (mobile) { toast('유료 멤버십 가입은 PC에서 가능합니다', 'warn'); return }
    setJoin(t)
  }

  return (
    <>
      <PageHeader crumbs={['멤버십', '유료 멤버십']} title="유료 멤버십" desc="먼저 예매하고, 더 많이 할인받고, 극장의 뒷모습까지 — 국립어린이청소년극단 멤버십" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {mobile && (
          <p className="mb-6 flex items-start gap-2 rounded-xl bg-sun-300/30 p-3 text-sm ring-1 ring-sun-400" role="note">
            <Monitor size={18} className="mt-0.5 shrink-0" />모바일 웹에서는 멤버십 <b>가입내역 조회만 가능</b>합니다. 신규 가입·등급 변경은 PC 홈페이지를 이용해주세요.
          </p>
        )}

        {/* 현재 상태 */}
        {me && tier && me.membership && (
          <section className="mb-10 overflow-hidden rounded-3xl text-white" style={{ background: `linear-gradient(120deg, ${tier.color}, #121f55)` }} aria-labelledby="my-h">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm text-white/70">나의 멤버십</p>
                <h2 id="my-h" className="mt-1 flex items-center gap-2 text-2xl font-extrabold sm:text-3xl"><Crown className="text-sun-300" />{tier.name} 멤버십 · {me.name}님</h2>
                <dl className="mt-4 grid grid-cols-[80px_1fr] gap-y-1 text-sm text-white/90">
                  <dt className="text-white/60">가입일</dt><dd>{fmtDate(me.membership.since)}</dd>
                  <dt className="text-white/60">유효기간</dt><dd>~ {fmtDate(me.membership.until)}</dd>
                  <dt className="text-white/60">혜택</dt><dd>{Math.round(tier.discountRate * 100)}% 할인 · 선예매 · 수수료 면제</dd>
                </dl>
              </div>
              <div className="space-y-3 rounded-2xl bg-white/10 p-4 text-sm">
                <label className="flex items-center justify-between gap-6">
                  <span>자동연장</span>
                  <button role="switch" aria-checked={me.membership.autoRenew} aria-label="자동연장" disabled={mobile}
                    onClick={() => { update(me.id, { membership: { ...me.membership!, autoRenew: !me.membership!.autoRenew } }); toast(`자동연장을 ${me.membership!.autoRenew ? '해제' : '설정'}했습니다`) }}
                    className={cx('relative h-7 w-12 rounded-full transition disabled:opacity-50', me.membership.autoRenew ? 'bg-sun-400' : 'bg-white/30')}>
                    <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', me.membership.autoRenew ? 'left-6' : 'left-1')} />
                  </button>
                </label>
                <button className="w-full rounded-lg border border-white/30 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50" disabled={mobile}
                  onClick={() => {
                    if (!confirm(`${tier.name} 멤버십을 해지하시겠습니까?\n해지 즉시 선예매·할인 혜택이 중단되며, 잔여기간은 일할 환불됩니다.`)) return
                    cancel(); toast('멤버십이 해지되었습니다. 환불은 3~5영업일 내 처리됩니다')
                    useStore.getState().sendSms(me.phone, `[국립어린이청소년극단] ${tier.name} 멤버십 해지가 완료되었습니다. 잔여기간 환불은 3~5영업일 내 처리됩니다.`)
                  }}>멤버십 해지</button>
              </div>
            </div>
          </section>
        )}

        {/* 등급 비교 */}
        <section aria-labelledby="tier-h">
          <h2 id="tier-h" className="text-center text-2xl font-extrabold">멤버십 등급 안내</h2>
          <p className="mt-2 text-center text-sm text-muted">연회비 결제 후 1년간 혜택이 제공됩니다.</p>
          <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
            {M.tiers.map(t => {
              const Icon = tierIcon(t.id)
              const mine = tier?.id === t.id
              const best = t.id === 'tier-tree'
              return (
                <article key={t.id} className={cx('relative flex flex-col rounded-3xl border-2 bg-white p-6 sm:p-8', best ? 'border-brand-600 shadow-xl' : 'border-line')}>
                  {best && <span className="chip absolute -top-3 left-6 bg-sun-400 text-ink">추천</span>}
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: t.color }}><Icon size={24} /></span>
                    <div>
                      <h3 className="text-xl font-extrabold">{t.name}</h3>
                      <p className="text-sm text-muted">최대 {Math.round(t.discountRate * 100)}% 할인 · {t.id === 'tier-tree' ? 4 : 2}매</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-black">{won(t.price)}<span className="text-base font-semibold text-muted"> / 년</span></p>
                  <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
                    {t.benefits.map(b => <li key={b} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0" style={{ color: t.color }} />{b}</li>)}
                  </ul>
                  <button
                    className={cx('mt-6 w-full py-3.5 text-base', mine ? 'btn-outline' : best ? 'btn-primary' : 'btn-accent')}
                    disabled={mine || (!!tier && !mine) || mobile}
                    onClick={() => startJoin(t)}
                  >
                    {mine ? '이용 중인 등급' : tier ? '등급 변경은 만료 후 가능' : mobile ? 'PC에서 가입 가능' : `${t.name} 가입하기`}
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        {/* 혜택 상세 */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="주요 혜택">
          {[
            { icon: Ticket, t: '선예매', d: '일반 오픈 3일 전 먼저 좌석을 고를 수 있어요', c: 'bg-brand-50 text-brand-600' },
            { icon: Leaf, t: '상시 할인', d: '전 공연 10~20% 할인, 가족과 함께 최대 4매', c: 'bg-mint-400/15 text-mint-500' },
            { icon: Gift, t: '웰컴 기프트', d: '가입 즉시 할인쿠폰 또는 공연 예매권 지급', c: 'bg-sun-300/40 text-amber-700' },
            { icon: Crown, t: '특별 프로그램', d: '백스테이지 투어·창작진 만남 우선 초대', c: 'bg-coral-400/15 text-coral-500' },
          ].map(x => (
            <div key={x.t} className="rounded-2xl border border-line p-5">
              <span className={cx('grid h-11 w-11 place-items-center rounded-xl', x.c)}><x.icon size={22} /></span>
              <p className="mt-3 font-bold">{x.t}</p>
              <p className="mt-1 text-sm text-muted">{x.d}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-xl font-extrabold">멤버십 자주 묻는 질문</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <button className="flex w-full items-center justify-between gap-3 py-4 text-left font-semibold" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span><span className="mr-2 text-brand-600">Q.</span>{f.q}</span>
                  <ChevronDown size={18} className={cx('shrink-0 transition', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && <p className="pb-4 pl-6 text-sm leading-relaxed text-muted">{f.a}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-sm text-muted">더 궁금한 점은 <Link to="/site/support/inquiry" className="font-semibold text-brand-600 link-u">1:1 문의</Link>를 이용해주세요.</p>
        </section>
      </div>

      {join && <JoinModal tier={join} onClose={() => setJoin(null)} />}
    </>
  )
}

function JoinModal({ tier, onClose }: { tier: MembershipTier; onClose: () => void }) {
  const joinMembership = useStore(s => s.joinMembership)
  const toast = useStore(s => s.toast)
  const [a1, setA1] = useState(false)
  const [a2, setA2] = useState(false)
  const [auto, setAuto] = useState(true)
  const [pay, setPay] = useState<'신용카드' | '가상계좌'>('신용카드')
  const [err, setErr] = useState('')
  const [pg, setPg] = useState(false)
  const [done, setDone] = useState(false)
  const me = useMe()
  const update = useStore(s => s.updateMember)
  return (
    <>
      <Modal open={!pg} onClose={onClose} title={done ? '가입 완료' : `${tier.name} 멤버십 가입`}>
        {done ? (
          <div className="py-4 text-center">
            <Crown className="mx-auto text-sun-500" size={44} />
            <p className="mt-3 text-lg font-extrabold">{tier.name} 멤버십 회원이 되셨습니다!</p>
            <p className="mt-1 text-sm text-muted">선예매·할인 혜택이 즉시 적용되며, 웰컴 기프트가 쿠폰함에 지급되었습니다.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Link to="/site/mypage/coupons" className="btn-outline" onClick={onClose}>쿠폰함 보기</Link>
              <Link to="/site/performances" className="btn-primary" onClick={onClose}>공연 예매하기</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-paper p-4">
              <span className="font-bold">{tier.name} 멤버십 (1년)</span>
              <span className="text-xl font-extrabold text-brand-600">{won(tier.price)}</span>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={a1} onChange={e => { setA1(e.target.checked); setErr('') }} /><span><b>[필수]</b> 유료 멤버십 이용약관 동의 (혜택·유효기간·환불 규정)</span></label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={a2} onChange={e => { setA2(e.target.checked); setErr('') }} /><span><b>[필수]</b> 결제 및 개인정보 제3자(결제대행사) 제공 동의</span></label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={auto} onChange={e => setAuto(e.target.checked)} /><span>[선택] 만료 시 자동연장 (만료 7일 전 알림)</span></label>
            </div>
            <fieldset>
              <legend className="label">결제 수단</legend>
              <div className="grid grid-cols-2 gap-2">
                {([['신용카드', CreditCard], ['가상계좌', Building2]] as const).map(([m, I]) => (
                  <button key={m} type="button" aria-pressed={pay === m} onClick={() => setPay(m)}
                    className={cx('flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold', pay === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line')}><I size={18} />{m}</button>
                ))}
              </div>
            </fieldset>
            <p className="min-h-4 text-sm text-coral-500" aria-live="assertive">{err}</p>
            <button className="btn-primary w-full py-3" onClick={() => (a1 && a2 ? setPg(true) : setErr('필수 약관에 동의해주세요.'))}>{won(tier.price)} 결제하기</button>
          </div>
        )}
      </Modal>
      <PgModal open={pg} amount={tier.price} method={pay} onClose={() => setPg(false)} onDone={() => {
        joinMembership(tier.id)
        if (!auto && me) {
          const m = useStore.getState().members.find(x => x.id === me.id)
          if (m?.membership) update(me.id, { membership: { ...m.membership, autoRenew: false } })
        }
        setPg(false); setDone(true); toast(`${tier.name} 멤버십 가입이 완료되었습니다`)
      }} />
    </>
  )
}
