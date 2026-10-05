import { useMemo, useState } from 'react'
import { Gift, KeyRound, Heart, UserCheck, UserX, Crown } from 'lucide-react'
import Modal from '../../../components/Modal'
import { ageOf, useStore } from '../../../store'
import { won } from '../../../lib/format'
import { DataTable, Drawer, Note, Stat, Status, ask, usePII, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY, liveSeats, netAmount, usePerfMap, useRoundMap, roundLabel } from '../../lib'
import type { Booking } from '../../../data/types'
import { CouponFields } from './forms'
import { ageGroup, couponBenefit, emptyCoupon, statOf, tierOf, toCoupon, useMemberStats, validateCoupon, type CouponDraft } from './shared'

export default function MemberDetail({ memberId, onClose }: { memberId: string | null; onClose: () => void }) {
  const member = useStore(s => s.members.find(m => m.id === memberId))
  const allCoupons = useStore(s => s.coupons)
  const { updateMember, log, toast, sendSms, issueCoupons } = useStore.getState()
  const tiers = useAdminLocal(s => s.tiers)
  const stats = useMemberStats()
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const [couponOpen, setCouponOpen] = useState(false)

  const coupons = useMemo(() => allCoupons.filter(c => c.ownerId === memberId), [allCoupons, memberId])
  if (!member) return null
  const st = statOf(stats, member.id)
  const tier = tierOf(member, tiers)
  const history = [...st.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const changeStatus = async (to: '정상' | '탈퇴') => {
    const r = await ask(to === '정상'
      ? { title: '휴면 해제', tone: 'warn', confirmText: '휴면 해제', message: <><b>{pii.name(member.name)}</b>({member.loginId}) 회원의 휴면 상태를 해제합니다. 분리 보관된 개인정보가 복원됩니다.</>, reasonOptions: ['본인확인 완료(콜센터)', '본인 요청(이메일)', '오류 정정'] }
      : { title: '탈퇴 처리', tone: 'danger', confirmText: '탈퇴 처리', message: <><b>{pii.name(member.name)}</b>({member.loginId}) 회원을 탈퇴 처리합니다. 보유 쿠폰은 소멸되며, 전자상거래법에 따른 거래기록(5년)을 제외한 개인정보는 즉시 파기됩니다.</>, reasonOptions: ['본인 요청', '부정 이용', '사망·실종 신고'] })
    if (r === null) return
    updateMember(member.id, to === '탈퇴' ? { status: '탈퇴', membership: undefined, marketing: false } : { status: '정상' })
    log(to === '정상' ? `휴면 해제(사유: ${r})` : `회원 탈퇴 처리(사유: ${r})`, `${member.loginId} (${member.id})`)
    if (to === '정상') sendSms(member.phone, '[국립어린이청소년극단] 휴면 상태가 해제되었습니다. 지금 바로 로그인하실 수 있습니다.', '알림톡')
    toast(to === '정상' ? '휴면 해제되었습니다' : '탈퇴 처리되었습니다', to === '정상' ? 'ok' : 'warn')
  }

  const resetPw = async () => {
    const r = await ask({ title: '비밀번호 초기화 안내', tone: 'warn', confirmText: '안내 발송', message: <>등록된 연락처({pii.phone(member.phone)})로 비밀번호 재설정 링크(유효시간 30분)를 발송합니다. 관리자는 회원 비밀번호를 직접 조회·지정할 수 없습니다.</> })
    if (r === null) return
    sendSms(member.phone, '[국립어린이청소년극단] 비밀번호 재설정 안내: https://ntcy.go.kr/reset?t=•••• (30분 이내 1회 사용 가능)', 'SMS')
    log('비밀번호 초기화 안내 발송', `${member.loginId}`)
    toast('비밀번호 재설정 안내를 발송했습니다')
  }

  const cols: Col<Booking>[] = [
    { key: 'id', header: '예매번호', render: b => <span className="font-mono text-xs">{b.id}</span>, sort: b => b.id },
    { key: 'perf', header: '공연 / 회차', render: b => <div><div className="font-semibold">{perfMap.get(b.perfId)?.title}</div><div className="text-[11px] text-muted">{roundLabel(roundMap.get(b.roundId))}</div></div>, sort: b => b.roundId },
    { key: 'ea', header: '매수', align: 'right', render: b => liveSeats(b), sort: b => liveSeats(b) },
    { key: 'amt', header: '결제금액', align: 'right', render: b => won(netAmount(b)), sort: b => netAmount(b) },
    { key: 'ch', header: '채널', render: b => b.channel },
    { key: 'st', header: '상태', render: b => <Status s={b.status} />, sort: b => b.status },
  ]

  return (
    <>
      <Drawer open={!!memberId} onClose={onClose} width="max-w-3xl"
        title={<span className="flex items-center gap-2">{pii.name(member.name)} <span className="text-xs font-normal text-muted">{member.loginId} · {member.id}</span> <Status s={member.status} /></span>}
        footer={<>
          {member.status === '휴면' && <button className="btn-outline btn-sm" onClick={() => changeStatus('정상')}><UserCheck size={14} />휴면 해제</button>}
          {member.status !== '탈퇴' && <button className="btn-outline btn-sm text-coral-500" onClick={() => changeStatus('탈퇴')}><UserX size={14} />탈퇴 처리</button>}
          {member.status !== '탈퇴' && <button className="btn-outline btn-sm" onClick={resetPw}><KeyRound size={14} />비밀번호 초기화 안내</button>}
          {member.status !== '탈퇴' && <button className="btn-primary btn-sm" onClick={() => setCouponOpen(true)}><Gift size={14} />쿠폰 발급</button>}
        </>}>
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">기본 정보</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="성명" value={pii.name(member.name)} />
              <Stat label="연락처" value={pii.phone(member.phone)} />
              <Stat label="이메일" value={<span className="break-all">{pii.email(member.email)}</span>} />
              <Stat label="생년월일 / 연령" value={`${pii.show ? member.birth : member.birth.slice(0, 4) + '-**-**'} (${ageOf(member.birth)}세·${ageGroup(member.birth)})`} />
              <Stat label="회원 유형" value={member.type + (member.guardian ? ` (${member.guardian})` : '')} />
              <Stat label="지역" value={member.region} />
              <Stat label="가입일" value={member.joinedAt} />
              <Stat label="최종 로그인" value={member.lastLoginAt} />
              <Stat label="마케팅 수신" value={member.marketing ? '동의' : '미동의'} />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <div className="rounded-xl border border-line p-3">
              <h3 className="mb-2 flex items-center gap-1 text-xs font-bold text-muted"><Crown size={13} />멤버십</h3>
              {tier && member.membership ? (
                <div>
                  <span className="chip text-white" style={{ background: tier.color }}>{tier.name}</span>
                  <div className="mt-2 text-sm">{member.membership.since} ~ {member.membership.until}</div>
                  <div className="text-xs text-muted">자동갱신 {member.membership.autoRenew ? 'ON' : 'OFF'} · 할인 {Math.round(tier.discountRate * 100)}% · 선예매 {tier.presale ? '가능' : '-'}</div>
                </div>
              ) : <p className="text-sm text-muted">무료회원 (유료 멤버십 미가입)</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="총 구매금액" value={won(st.spend)} />
              <Stat label="예매 건수" value={`${st.count}건`} />
              <Stat label="관람 횟수" value={`${st.views}회`} />
              <Stat label="관람 공연" value={`${st.perfIds.size}편`} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">보유 쿠폰 ({coupons.filter(c => !c.usedBookingId && c.until >= TODAY).length}장 사용 가능)</h3>
            {coupons.length ? (
              <div className="tbl-wrap overflow-auto rounded-lg border border-line">
                <table className="tbl [&_td]:py-1.5">
                  <thead><tr><th>쿠폰명</th><th>종류</th><th>혜택</th><th>유효기간</th><th>상태</th></tr></thead>
                  <tbody>{coupons.map(c => (
                    <tr key={c.id}><td className="font-semibold">{c.name}</td><td>{c.kind}</td><td>{couponBenefit(c)}{c.minPrice ? ` (${c.minPrice.toLocaleString()}원↑)` : ''}</td><td>~{c.until}</td>
                      <td><Status s={c.usedBookingId ? '사용' : c.until < TODAY ? '만료' : '미사용'} /></td></tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted">보유 쿠폰이 없습니다.</p>}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1 text-xs font-bold text-muted"><Heart size={13} />관심 공연</h3>
            <div className="flex flex-wrap gap-1.5">
              {member.favorites.length ? member.favorites.map(f => <span key={f} className="chip bg-orange-50 text-coral-500">{perfMap.get(f)?.title ?? f}</span>)
                : <span className="text-sm text-muted">등록된 관심 공연이 없습니다.</span>}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">구매 이력</h3>
            <DataTable columns={cols} rows={history} rowKey={b => b.id} pageSize={10} dense maxHeight="40vh" empty="구매 이력이 없습니다." />
          </section>
          {member.status === '탈퇴' && <Note tone="warn">탈퇴 회원입니다. 관련 법령에 따라 거래기록만 보관되며 조회 외 처리가 제한됩니다.</Note>}
        </div>
      </Drawer>
      {couponOpen && <SingleCoupon name={pii.name(member.name)} onClose={() => setCouponOpen(false)}
        onIssue={c => { issueCoupons([member.id], c); sendSms(member.phone, `[국립어린이청소년극단] ${c.name} 쿠폰이 발급되었습니다. (~${c.until}) 마이페이지에서 확인하세요.`, '알림톡'); toast(`${c.name} 쿠폰을 발급했습니다`); setCouponOpen(false) }} />}
    </>
  )
}

function SingleCoupon({ name, onClose, onIssue }: { name: string; onClose: () => void; onIssue: (c: ReturnType<typeof toCoupon>) => void }) {
  const [d, setD] = useState<CouponDraft>({ ...emptyCoupon(), name: '고객 보상 5,000원 할인' })
  const [errs, setErrs] = useState<ReturnType<typeof validateCoupon>>({})
  const submit = () => {
    const e = validateCoupon(d, TODAY)
    setErrs(e)
    if (Object.keys(e).length) return
    onIssue(toCoupon(d))
  }
  return (
    <Modal open onClose={onClose} title={`쿠폰 발급 – ${name}`}
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={submit}>발급</button></>}>
      <CouponFields value={d} onChange={setD} errors={errs} />
    </Modal>
  )
}
