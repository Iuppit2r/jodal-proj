import { useMemo, useState } from 'react'
import { Bookmark, Gift, Lock, MessageSquare, RotateCcw, Target, Trash2, Users } from 'lucide-react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ageOf, nowStr, useStore } from '../../../store'
import { cx, won } from '../../../lib/format'
import { CHART_COLORS, Card, Field, MultiCheck, Note, PiiToggle, Segmented, Toggle, ask, errMsg, usePII } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY } from '../../lib'
import { CouponFields, MessageComposer, smsKind } from './forms'
import { AGE_GROUPS, REGIONS, ageGroup, emptyCoupon, statOf, tierOf, toCoupon, useCrmLocal, useMemberStats, validateCoupon, type CouponDraft, type Segment } from './shared'

type Cond = Segment['cond']
const INIT: Cond = { perfIds: [], minViews: 0, ages: [], regions: [], membership: 'all' }

export default function Targeting() {
  const members = useStore(s => s.members)
  const perfs = useStore(s => s.performances)
  const { log, toast, sendSms, issueCoupons } = useStore.getState()
  const tiers = useAdminLocal(s => s.tiers)
  const stats = useMemberStats()
  const pii = usePII()
  const segments = useCrmLocal(s => s.segments)
  const setLocal = useCrmLocal(s => s.set)
  const [c, setC] = useState<Cond>(INIT)
  const [mode, setMode] = useState<'msg' | 'coupon'>('msg')
  const [perfVar, setPerfVar] = useState(perfs[0]?.id ?? '')
  const [couponVar, setCouponVar] = useState('가을 시즌 재관람 5,000원 할인')
  const [cp, setCp] = useState<CouponDraft>({ ...emptyCoupon(), name: '가을 시즌 재관람 5,000원 할인' })
  const [cpErr, setCpErr] = useState<ReturnType<typeof validateCoupon>>({})
  const [notify, setNotify] = useState(true)

  const salePerfs = useMemo(() => perfs.filter(p => p.status !== '임시저장'), [perfs])
  const titleOf = useMemo(() => new Map(perfs.map(p => [p.id, p.title])), [perfs])
  const idOfTitle = useMemo(() => new Map(perfs.map(p => [p.title, p.id])), [perfs])

  const { matched, targets } = useMemo(() => {
    const matched = members.filter(m => {
      if (m.status !== '정상') return false
      const s = statOf(stats, m.id)
      if (c.perfIds.length && !c.perfIds.some(p => s.perfIds.has(p))) return false
      if (c.minViews > 0 && s.views < c.minViews) return false
      if (c.ages.length && !c.ages.includes(ageGroup(m.birth))) return false
      if (c.regions.length && !c.regions.includes(m.region)) return false
      if (c.membership === 'paid' && !m.membership) return false
      if (c.membership === 'free' && m.membership) return false
      if (!['all', 'paid', 'free'].includes(c.membership) && m.membership?.tierId !== c.membership) return false
      return true
    })
    return { matched, targets: matched.filter(m => m.marketing) }
  }, [members, stats, c])

  const breakdown = useMemo(() => AGE_GROUPS.map(g => ({ name: g, value: targets.filter(m => ageGroup(m.birth) === g).length })), [targets])
  const paidCnt = targets.filter(m => m.membership).length
  const first = targets[0]
  const sample = {
    '#{이름}': first ? pii.name(first.name) : '홍길동',
    '#{공연명}': titleOf.get(perfVar) ?? '',
    '#{쿠폰명}': couponVar,
  }
  const membershipLabel = c.membership === 'all' ? '전체' : c.membership === 'paid' ? '유료' : c.membership === 'free' ? '무료' : tiers.find(t => t.id === c.membership)?.name ?? c.membership
  const condSummary = (x: Cond) => [
    x.perfIds.length ? `관람: ${x.perfIds.map(p => titleOf.get(p)).join(', ')}` : '',
    x.minViews ? `관람 ${x.minViews}회↑` : '',
    x.ages.length ? x.ages.join('·') : '',
    x.regions.length ? x.regions.join('·') : '',
    x.membership !== 'all' ? `멤버십 ${x.membership === 'paid' ? '유료' : x.membership === 'free' ? '무료' : tiers.find(t => t.id === x.membership)?.name ?? x.membership}` : '',
  ].filter(Boolean).join(' / ') || '전체 회원'

  const saveSegment = async () => {
    const name = await ask({ title: '타겟 저장', message: <>현재 조건(<b>{condSummary(c)}</b>, {targets.length}명)을 세그먼트로 저장합니다.</>, reason: '세그먼트 이름', confirmText: '저장' })
    if (name === null) return
    if (segments.some(s => s.name === name)) { toast(errMsg('E-CM-331', '같은 이름의 세그먼트가 이미 있습니다'), 'err'); return }
    setLocal({ segments: [{ id: 'sg' + Date.now(), name, createdAt: nowStr(), count: targets.length, cond: c }, ...segments] })
    log('CRM 타겟 세그먼트 저장', `${name} (${targets.length}명)`)
    toast('타겟 세그먼트를 저장했습니다')
  }
  const delSegment = async (s: Segment) => {
    const r = await ask({ title: '세그먼트 삭제', tone: 'danger', confirmText: '삭제', message: <>「{s.name}」 세그먼트를 삭제하시겠습니까?</> })
    if (r === null) return
    setLocal({ segments: segments.filter(x => x.id !== s.id) })
    log('CRM 타겟 세그먼트 삭제', s.name)
  }

  const issue = async () => {
    const e = validateCoupon(cp, TODAY)
    setCpErr(e)
    if (Object.keys(e).length) return
    if (!targets.length) { toast(errMsg('E-CM-302', '발급 대상이 없습니다. 조건을 확인해 주세요'), 'warn'); return }
    const r = await ask({ title: '타겟 쿠폰 발급', tone: 'warn', confirmText: `${targets.length}명 발급`, message: <>「<b>{cp.name}</b>」 쿠폰을 CRM 타겟 <b>{targets.length.toLocaleString()}명</b>에게 발급합니다.{notify && <><br />발급 안내 알림톡도 함께 발송됩니다.</>}</> })
    if (r === null) return
    const coupon = toCoupon(cp)
    issueCoupons(targets.map(m => m.id), coupon)
    if (notify) sendSms(`CRM 타겟 ${targets.length}명`, `(광고)[국립어린이청소년극단] #{이름}님, 「${coupon.name}」 쿠폰이 발급되었습니다. (~${coupon.until}) 마이페이지 > 쿠폰함에서 확인하세요.\n무료수신거부 080-863-6261`, '알림톡')
    toast(`${targets.length.toLocaleString()}명에게 쿠폰을 발급했습니다`)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      {/* 조건 빌더 */}
      <div className="space-y-4">
        <Card title={<span className="flex items-center gap-1.5"><Target size={15} className="text-brand-600" />타겟 조건</span>}
          actions={<button className="btn-ghost btn-sm" onClick={() => setC(INIT)}><RotateCcw size={13} />초기화</button>}>
          <div className="space-y-4">
            <Field label="관람 공연 (예매 이력 기준, 하나라도 포함)">
              <MultiCheck options={salePerfs.map(p => p.title)} value={c.perfIds.map(id => titleOf.get(id) ?? id)}
                onChange={v => setC({ ...c, perfIds: v.map(t => idOfTitle.get(t)!).filter(Boolean) })} />
            </Field>
            <Field label="관람 횟수" hint="입장(관람완료) 기준">
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={20} className="input w-24" value={c.minViews} onChange={e => setC({ ...c, minViews: Math.max(0, Number(e.target.value)) })} />
                <span className="text-sm text-muted">회 이상</span>
              </div>
            </Field>
            <Field label="연령대"><MultiCheck options={AGE_GROUPS} value={c.ages} onChange={v => setC({ ...c, ages: v })} /></Field>
            <Field label="지역"><MultiCheck options={REGIONS} value={c.regions} onChange={v => setC({ ...c, regions: v })} /></Field>
            <Field label="멤버십">
              <select className="input" value={c.membership} onChange={e => setC({ ...c, membership: e.target.value })}>
                <option value="all">전체</option><option value="paid">유료회원</option><option value="free">무료회원</option>
                {tiers.map(t => <option key={t.id} value={t.id}>{t.name} 등급</option>)}
              </select>
            </Field>
            <div className="rounded-lg border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold"><Lock size={13} className="text-muted" />마케팅 수신동의 회원만</span>
                <Toggle checked onChange={() => {}} disabled label="마케팅 수신동의 회원만" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">정보통신망법 제50조: 광고성 정보는 수신동의 회원에게만 발송 (해제 불가)</p>
            </div>
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-1.5"><Bookmark size={15} />저장된 타겟</span>} bodyClass="divide-y divide-line">
          {segments.length ? segments.map(s => (
            <div key={s.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
              <button className="min-w-0 text-left" onClick={() => { setC(s.cond); toast(`「${s.name}」 조건을 불러왔습니다`) }}>
                <div className="truncate text-sm font-semibold hover:text-brand-600">{s.name}</div>
                <div className="truncate text-[11px] text-muted">{condSummary(s.cond)} · {s.createdAt}{s.count ? ` · 저장시 ${s.count}명` : ''}</div>
              </button>
              <button className="btn-ghost btn-sm shrink-0 p-1.5 text-muted hover:text-coral-500" onClick={() => delSegment(s)} aria-label="삭제"><Trash2 size={14} /></button>
            </div>
          )) : <p className="p-4 text-sm text-muted">저장된 타겟이 없습니다.</p>}
        </Card>
      </div>

      {/* 결과 / 실행 */}
      <div className="min-w-0 space-y-4">
        <Card>
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Users size={14} />발송 가능 타겟</div>
              <div className="mt-1 text-4xl font-extrabold tabular-nums text-brand-600">{targets.length.toLocaleString()}<span className="ml-1 text-base text-ink">명</span></div>
              <div className="mt-1 text-xs text-muted">조건 일치 {matched.length.toLocaleString()}명 중 수신 미동의 <b>{(matched.length - targets.length).toLocaleString()}명</b> 제외</div>
              <div className="mt-1 text-xs text-muted">유료회원 {paidCnt}명 · 멤버십 {membershipLabel}</div>
              <button className="btn-outline btn-sm mt-3 self-start" onClick={saveSegment}><Bookmark size={14} />타겟 저장</button>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-muted">연령대 분포</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={breakdown} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v}명`, '타겟']} cursor={{ fill: '#f3f5fa' }} />
                  <RBar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </RBar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card title="대상 미리보기 (상위 10명)" sub="개인정보는 마스킹되어 표시됩니다." actions={<PiiToggle />} bodyClass="p-0">
          <div className="tbl-wrap overflow-auto">
            <table className="tbl [&_td]:py-1.5">
              <thead><tr><th>아이디</th><th>성명</th><th>연락처</th><th>연령대</th><th>지역</th><th>멤버십</th><th className="text-right">관람</th><th className="text-right">구매금액</th></tr></thead>
              <tbody>
                {targets.slice(0, 10).map(m => {
                  const s = statOf(stats, m.id)
                  const t = tierOf(m, tiers)
                  return (
                    <tr key={m.id}>
                      <td>{m.loginId}</td><td className="font-semibold">{pii.name(m.name)}</td><td>{pii.phone(m.phone)}</td>
                      <td>{ageGroup(m.birth)} ({ageOf(m.birth)}세)</td><td>{m.region}</td>
                      <td>{t ? <span className="chip text-white" style={{ background: t.color }}>{t.name}</span> : <span className="text-muted">-</span>}</td>
                      <td className="text-right tabular-nums">{s.views}회</td><td className="text-right tabular-nums">{won(s.spend)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!targets.length && <p className="py-10 text-center text-sm text-muted">조건에 맞는 수신동의 회원이 없습니다.</p>}
          </div>
        </Card>

        <Card title="타겟 액션" actions={<Segmented size="sm" value={mode} onChange={setMode}
          options={[{ value: 'msg', label: <span className="flex items-center gap-1"><MessageSquare size={13} />알림톡·문자·메일</span> }, { value: 'coupon', label: <span className="flex items-center gap-1"><Gift size={13} />쿠폰 발급</span> }]} />}>
          {mode === 'msg' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="#{공연명} 치환 공연">
                  <select className="input" value={perfVar} onChange={e => setPerfVar(e.target.value)}>
                    {salePerfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </Field>
                <Field label="#{쿠폰명} 치환값"><input className="input" value={couponVar} onChange={e => setCouponVar(e.target.value)} /></Field>
              </div>
              <MessageComposer count={targets.length} recipientLabel="CRM 타겟" variables={['#{이름}', '#{공연명}', '#{쿠폰명}']} sample={sample}
                templates={[
                  { label: '공연 오픈 안내', text: '#{이름}님, 기다리던 <#{공연명}> 티켓이 오픈되었습니다!\n지금 홈페이지에서 좋은 좌석을 먼저 만나보세요.' },
                  { label: '재관람 쿠폰 안내', text: '#{이름}님, 다시 극장에서 만나요!\n「#{쿠폰명}」 쿠폰을 드렸어요. <#{공연명}> 예매 시 사용하실 수 있습니다.' },
                  { label: '접근성 회차 안내', text: '#{이름}님, <#{공연명}> 수어통역·음성해설 회차를 안내드립니다. 자세한 일정은 홈페이지 공연 상세에서 확인하세요.' },
                ]}
                onSend={({ text, kind, scheduleAt }) => {
                  sendSms(`CRM 타겟 ${targets.length}명`, (scheduleAt ? `[예약 ${scheduleAt}] ` : '') + text, smsKind(kind))
                  log(scheduleAt ? `CRM ${kind} 예약 발송 등록 (${scheduleAt})` : `CRM ${kind} 발송`, `${condSummary(c)} / ${targets.length}명`)
                  toast(scheduleAt ? `${scheduleAt} 예약 발송이 등록되었습니다 (${targets.length}명)` : `${targets.length.toLocaleString()}명에게 ${kind}을(를) 발송했습니다`)
                }} />
            </div>
          ) : (
            <div className="space-y-3">
              <CouponFields value={cp} onChange={setCp} errors={cpErr} />
              <label className="flex items-center gap-2 text-sm"><Toggle checked={notify} onChange={setNotify} label="발급 안내 알림톡" />발급 안내 알림톡 함께 발송</label>
              <div className={cx('flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3')}>
                <span className="text-xs text-muted">발급 대상 <b className="text-ink">{targets.length.toLocaleString()}명</b> · 회원 마이페이지 쿠폰함에 즉시 반영됩니다.</span>
                <button className="btn-primary btn-sm" onClick={issue}><Gift size={14} />{targets.length.toLocaleString()}명에게 쿠폰 발급</button>
              </div>
            </div>
          )}
        </Card>
        <Note>타겟 조건은 실시간 회원·예매 데이터 기준으로 계산되며, 발송·발급 이력은 변경이력(감사로그)에 기록됩니다.</Note>
      </div>
    </div>
  )
}
