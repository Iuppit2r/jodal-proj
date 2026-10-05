import { useMemo, useState } from 'react'
import { Headphones, Search, UserPlus, UserMinus, CreditCard, Landmark, Crown } from 'lucide-react'
import { useStore } from '../../../store'
import { cx, won } from '../../../lib/format'
import { Card, Empty, Field, Note, PiiToggle, Segmented, Stat, Status, Toggle, ask, errMsg, usePII } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY } from '../../lib'
import type { Member } from '../../../data/types'
import { refundOf, welcomeCoupon } from './util'

const UNTIL = '2027-10-04'

export default function CallCenter() {
  const members = useStore(s => s.members)
  const tiers = useAdminLocal(s => s.tiers)
  const pii = usePII()
  const [q, setQ] = useState('')
  const [searched, setSearched] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const results = useMemo(() => {
    const k = searched.trim().toLowerCase()
    if (!k) return []
    const kd = k.replace(/-/g, '')
    return members.filter(m => m.status !== '탈퇴' && (m.name.includes(k) || m.loginId.toLowerCase().includes(k) || (kd.length >= 4 && m.phone.replace(/-/g, '').includes(kd)))).slice(0, 20)
  }, [members, searched])
  const sel = members.find(m => m.id === selId) ?? null

  const search = () => {
    if (q.trim().length < 2) { setErr(errMsg('E-PM-140', '검색어를 2자 이상 입력해 주세요')); return }
    setErr('')
    setSearched(q)
    const k = q.trim().toLowerCase(), kd = k.replace(/-/g, '')
    const hit = members.filter(m => m.status !== '탈퇴' && (m.name.includes(k) || m.loginId.toLowerCase().includes(k) || (kd.length >= 4 && m.phone.replace(/-/g, '').includes(kd))))
    setSelId(hit.length === 1 ? hit[0].id : null)
    if (!hit.length) setErr(errMsg('E-PM-141', '일치하는 회원이 없습니다. 비회원은 홈페이지 회원가입 후 멤버십 가입이 가능합니다'))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card title={<span className="flex items-center gap-1.5"><Headphones size={15} className="text-brand-600" />회원 조회</span>} actions={<PiiToggle />}>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); search() }}>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="성명 / 아이디 / 휴대폰번호" aria-label="회원 검색" />
          <button className="btn-primary btn-sm shrink-0"><Search size={14} />조회</button>
        </form>
        <p className="mt-1.5 text-[11px] text-muted">예) 김시연, demo, 5678 · 통화 녹취 동의 후 본인확인(생년월일) 필수</p>
        {err && <Note tone="err" className="mt-2">{err}</Note>}
        <div className="mt-3 max-h-[420px] divide-y divide-line overflow-y-auto rounded-lg border border-line empty:hidden">
          {results.map(m => {
            const t = tiers.find(x => x.id === m.membership?.tierId)
            return (
              <button key={m.id} onClick={() => setSelId(m.id)} className={cx('flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-paper', selId === m.id && 'bg-brand-50')}>
                <span className="min-w-0"><b>{pii.name(m.name)}</b> <span className="text-xs text-muted">{m.loginId} · {pii.phone(m.phone)}</span></span>
                {t ? <span className="chip shrink-0 text-white" style={{ background: t.color }}>{t.name}</span> : <span className="shrink-0 text-[11px] text-muted">무료</span>}
              </button>
            )
          })}
        </div>
      </Card>
      {sel ? <MemberCard key={sel.id} m={sel} /> : <Card><Empty text="회원을 조회·선택하면 멤버십 가입/탈퇴를 처리할 수 있습니다." /></Card>}
    </div>
  )
}

function MemberCard({ m }: { m: Member }) {
  const tiers = useAdminLocal(s => s.tiers)
  const { updateMember, issueCoupons, sendSms, log, toast } = useStore.getState()
  const pii = usePII()
  const [tierId, setTierId] = useState(tiers[0]?.id ?? '')
  const [pay, setPay] = useState<'카드' | '가상계좌'>('카드')
  const [auto, setAuto] = useState(true)
  const cur = m.membership ? tiers.find(t => t.id === m.membership!.tierId) ?? null : null
  const tier = tiers.find(t => t.id === tierId)

  const join = async () => {
    if (!tier) return
    if (m.status !== '정상') { toast(errMsg('E-PM-142', '휴면 회원은 휴면 해제 후 가입할 수 있습니다'), 'err'); return }
    const r = await ask({ title: '멤버십 가입 처리', tone: 'warn', confirmText: '결제 및 가입',
      message: <><b>{pii.name(m.name)}</b> 회원을 <b>{tier.name}</b> 등급으로 가입 처리합니다.<br />결제 {won(tier.price)} ({pay}) · 유효기간 {TODAY} ~ {UNTIL} · 자동갱신 {auto ? 'ON' : 'OFF'}</> })
    if (r === null) return
    updateMember(m.id, { membership: { tierId: tier.id, since: TODAY, until: UNTIL, autoRenew: auto } })
    const c = welcomeCoupon(tier, UNTIL)
    issueCoupons([m.id], c)
    sendSms(m.phone, pay === '가상계좌'
      ? `[국립어린이청소년극단] ${tier.name} 멤버십 가상계좌 국민은행 940-2026-${m.id.replace(/\D/g, '').padStart(6, '0')} / ${tier.price.toLocaleString()}원 입금 확인되어 가입이 완료되었습니다. 가입 혜택 「${c.name}」 지급.`
      : `[국립어린이청소년극단] ${tier.name} 멤버십 가입이 완료되었습니다. (유효기간 ~${UNTIL.replace(/-/g, '.')}) 가입 혜택 「${c.name}」이(가) 지급되었습니다.`, '알림톡')
    log('유료회원 가입 처리(콜센터)', `${m.loginId} / ${tier.name} / ${pay} ${tier.price.toLocaleString()}원`)
    toast(`${tier.name} 멤버십 가입 완료 · 가입 쿠폰 지급 · 안내 알림톡 발송`)
  }

  const leave = async () => {
    if (!cur || !m.membership) return
    const rf = refundOf(cur.price, m.membership.since, m.membership.until, TODAY)
    const r = await ask({ title: '멤버십 탈퇴(해지) 처리', tone: 'danger', confirmText: `해지 및 ${won(rf.amount)} 환불`,
      message: <>
        <b>{pii.name(m.name)}</b> 회원의 <b>{cur.name}</b> 멤버십을 해지합니다.
        <div className="mt-2 rounded-lg bg-paper p-2 text-xs leading-relaxed">잔여기간 일할 환불: {won(cur.price)} × {rf.remain}일 / {rf.total}일 = <b className="text-brand-600">{won(rf.amount)}</b><br />미사용 가입 쿠폰은 회수되며 선예매 권한이 즉시 해제됩니다.</div>
      </>,
      reasonOptions: ['혜택 불만족', '이용 빈도 낮음', '거주지 변경', '중복 가입', '경제적 사유'] })
    if (r === null) return
    updateMember(m.id, { membership: undefined })
    sendSms(m.phone, `[국립어린이청소년극단] ${cur.name} 멤버십 해지가 완료되었습니다. 환불예정금액 ${rf.amount.toLocaleString()}원 (3~5영업일 소요)`, '알림톡')
    log(`유료회원 해지 처리(콜센터, 사유: ${r})`, `${m.loginId} / ${cur.name} / 환불 ${rf.amount.toLocaleString()}원`)
    toast(`멤버십 해지 완료 · 환불 ${won(rf.amount)}`, 'warn')
  }

  const toggleAuto = (v: boolean) => {
    if (!m.membership) return
    updateMember(m.id, { membership: { ...m.membership, autoRenew: v } })
    log(`멤버십 자동갱신 ${v ? 'ON' : 'OFF'}`, m.loginId)
    toast(`자동갱신을 ${v ? '설정' : '해제'}했습니다`)
  }

  return (
    <div className="space-y-4">
      <Card title={<span className="flex items-center gap-2">{pii.name(m.name)} <span className="text-xs font-normal text-muted">{m.loginId}</span><Status s={m.status} /></span>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="연락처" value={pii.phone(m.phone)} />
          <Stat label="생년월일" value={pii.show ? m.birth : `${m.birth.slice(0, 4)}-**-**`} />
          <Stat label="가입일" value={m.joinedAt} />
          <Stat label="회원유형" value={m.type} />
        </div>
      </Card>

      {cur && m.membership ? (
        <Card title={<span className="flex items-center gap-1.5"><Crown size={15} />현재 멤버십</span>}>
          {(() => {
            const rf = refundOf(cur.price, m.membership.since, m.membership.until, TODAY)
            return (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl p-4 text-white" style={{ background: cur.color }}>
                  <div className="text-xs opacity-80">멤버십 등급</div>
                  <div className="text-2xl font-extrabold">{cur.name}</div>
                  <div className="mt-2 text-sm">{m.membership.since} ~ {m.membership.until}</div>
                  <div className="text-xs opacity-80">잔여 {rf.remain}일 · 할인 {Math.round(cur.discountRate * 100)}%</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="font-semibold">자동갱신</span><Toggle checked={m.membership.autoRenew} onChange={toggleAuto} label="자동갱신" />
                  </div>
                  <div className="rounded-lg bg-paper p-3 text-xs leading-relaxed">
                    <div className="font-semibold text-ink">해지 시 예상 환불액</div>
                    <div className="mt-0.5 text-muted">{won(cur.price)} × 잔여 {rf.remain}일 / {rf.total}일 (일할 계산)</div>
                    <div className="mt-1 text-lg font-extrabold text-brand-600">{won(rf.amount)}</div>
                  </div>
                  <button className="btn-danger btn-sm w-full" onClick={leave}><UserMinus size={14} />멤버십 탈퇴(해지) 처리</button>
                </div>
              </div>
            )
          })()}
        </Card>
      ) : (
        <Card title={<span className="flex items-center gap-1.5"><UserPlus size={15} />멤버십 가입</span>} sub="현재 무료회원입니다. 등급과 결제수단을 선택해 가입을 처리합니다.">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {tiers.map(t => (
                <button key={t.id} onClick={() => setTierId(t.id)} className={cx('rounded-xl border-2 p-3 text-left transition', tierId === t.id ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-200')}>
                  <div className="flex items-center justify-between"><span className="font-extrabold" style={{ color: t.color }}>{t.name}</span><span className="text-sm font-bold">{won(t.price)}</span></div>
                  <div className="mt-1 text-[11px] text-muted">{t.benefits.slice(0, 3).join(' · ')}</div>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="결제수단">
                <Segmented value={pay} onChange={setPay} options={[{ value: '카드', label: <span className="flex items-center gap-1"><CreditCard size={14} />카드(ARS)</span> }, { value: '가상계좌', label: <span className="flex items-center gap-1"><Landmark size={14} />가상계좌</span> }]} />
              </Field>
              <Field label="자동갱신"><label className="flex items-center gap-2 text-sm"><Toggle checked={auto} onChange={setAuto} label="자동갱신" />만료 시 자동 결제·갱신</label></Field>
            </div>
            {tier && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2.5">
                <div className="text-sm">결제금액 <b className="text-lg text-brand-600">{won(tier.price)}</b> <span className="text-xs text-muted">· 유효기간 {TODAY} ~ {UNTIL} · 가입혜택 「{welcomeCoupon(tier, UNTIL).name}」 자동 지급</span></div>
                <button className="btn-primary btn-sm" onClick={join}><UserPlus size={14} />가입 처리</button>
              </div>
            )}
          </div>
        </Card>
      )}
      <Note>콜센터 처리 내역은 변경이력에 기록되며, 처리 결과는 회원 휴대폰으로 알림톡 안내됩니다. 홈페이지 마이페이지에 즉시 반영됩니다.</Note>
    </div>
  )
}
