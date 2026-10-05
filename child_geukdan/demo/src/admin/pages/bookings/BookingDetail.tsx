import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeftRight, CreditCard, MessageSquare, Receipt, Ticket, XCircle } from 'lucide-react'
import { useStore, useBookings } from '../../../store'
import { gradeLabel } from '../../../data/mock'
import { cx, won } from '../../../lib/format'
import { Drawer, Note, Status, ask, errMsg, usePII } from '../../ui'
import { roundLabel, ticketTypeName, usePerfMap, useRoundMap } from '../../lib'
import { CANCEL_REASONS, cancelFee, ticketSmsText } from './shared'
import { CashReceiptModal, SeatChangeModal } from './DetailModals'

/** 예매 상세 Drawer – 예매관리·발권관리 공용 */
export default function BookingDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const bookings = useBookings()
  const members = useStore(s => s.members)
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const b = useMemo(() => (id ? bookings.find(x => x.id === id) : undefined), [bookings, id])
  const [pick, setPick] = useState<string[]>([])
  const [force, setForce] = useState(false)
  const [err, setErr] = useState('')
  const [seatModal, setSeatModal] = useState(false)
  const [receiptModal, setReceiptModal] = useState(false)

  useEffect(() => { setPick([]); setForce(false); setErr('') }, [id])

  if (!id) return null
  if (!b) {
    return <Drawer open onClose={onClose} title="예매 상세"><Note tone="err">{errMsg('E-TC-404', `예매번호 ${id} 를 찾을 수 없습니다`)}</Note></Drawer>
  }
  const perf = perfMap.get(b.perfId)
  const round = roundMap.get(b.roundId)
  const member = b.userId ? members.find(m => m.id === b.userId) : undefined
  const live = b.seats.filter(s => !s.cancelled)
  const st = useStore.getState()
  const ticketSum = b.seats.reduce((a, s) => a + s.price, 0)
  const cancelSum = b.seats.filter(s => s.cancelled).reduce((a, s) => a + s.price, 0)
  const cancellable = b.status !== '취소완료' && b.status !== '관람완료' && live.length > 0
  const feeInfo = cancelFee(b, round, pick.length ? pick : live.map(s => s.seatId))

  const resendSms = () => {
    st.sendSms(b.bookerPhone, ticketSmsText(b, perf, round), '알림톡')
    st.patchBooking(b.id, {}, '티켓 안내 문자 재발송')
    st.log('예매 문자 재발송', b.id)
    st.toast('티켓 안내 알림톡을 재발송했습니다')
  }

  const doCancel = async (all: boolean) => {
    setErr('')
    const seatIds = all ? live.map(s => s.seatId) : pick
    if (!seatIds.length) { setErr(errMsg('E-TC-305', '취소할 좌석을 선택해 주세요')); return }
    const fi = cancelFee(b, round, seatIds)
    if (fi.blocked && !force) {
      setErr(errMsg('E-TC-310', fi.daysLeft === 0 ? '관람 당일은 취소할 수 없습니다' : '관람일이 지난 예매는 취소할 수 없습니다'))
      return
    }
    const fee = force ? 0 : fi.fee
    const amt = b.seats.filter(s => seatIds.includes(s.seatId)).reduce((a, s) => a + s.price, 0)
    const isAll = seatIds.length === live.length
    const reason = await ask({
      title: isAll ? '전체 취소' : '부분 취소', tone: 'danger', confirmText: '취소 처리',
      reasonOptions: CANCEL_REASONS, reason: '취소 사유',
      message: (
        <div className="space-y-2">
          <p>예매번호 <b>{b.id}</b>의 좌석 <b>{seatIds.join(', ')}</b> ({seatIds.length}매)을 취소합니다.</p>
          <div className="rounded-lg bg-paper p-3 text-xs">
            <div className="flex justify-between"><span>취소 티켓금액</span><b>{won(amt)}</b></div>
            <div className="flex justify-between"><span>취소수수료 {force ? '(관리자 강제 취소 – 면제)' : `(${fi.rule})`}</span><b className="text-coral-500">-{won(fee)}</b></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1"><span>환불 예정금액</span><b>{won(Math.max(0, amt - fee))}</b></div>
          </div>
          <p className="text-xs text-muted">예매자에게 취소 안내 알림톡이 자동 발송됩니다.</p>
        </div>
      ),
    })
    if (reason === null) return
    st.cancelSeats(b.id, seatIds, `${reason} / 취소수수료 ${fee.toLocaleString()}원${force ? ' (관리자 강제 취소)' : ''}`)
    st.log(`예매 ${isAll ? '전체' : '부분'} 취소${force ? '(강제)' : ''}`, `${b.id} ${seatIds.join(',')}`)
    st.toast(`${seatIds.length}매 취소 완료 · 환불 ${won(Math.max(0, amt - fee))}`)
    setPick([]); setForce(false)
  }

  const changePay = async () => {
    const r = await ask({
      title: '결제수단 변경', tone: 'warn', confirmText: '변경',
      message: <>가상계좌(입금대기) 예매를 <b>신용카드</b> 결제로 전환합니다. 기존 가상계좌 <b>{b.vaccount?.bank} {b.vaccount?.no}</b>는 폐기되고 예매가 즉시 확정됩니다.</>,
    })
    if (r === null) return
    st.patchBooking(b.id, { payMethod: '신용카드', status: '예매완료', vaccount: undefined }, '결제수단 변경 (가상계좌 → 신용카드) / 결제 완료')
    st.log('결제수단 변경', `${b.id} 가상계좌→신용카드`)
    st.sendSms(b.bookerPhone, `[국립어린이청소년극단] <${perf?.title}> 예매번호 ${b.id} 신용카드 결제가 완료되어 예매가 확정되었습니다.`)
    st.toast('신용카드 결제로 전환되어 예매가 확정되었습니다')
  }

  const issue = async () => {
    const r = await ask({ title: '티켓 발권', message: <>예매번호 <b>{b.id}</b>의 {live.length}매를 발권 처리합니다.</>, confirmText: '발권' })
    if (r === null) return
    st.issueBooking(b.id)
    st.log('티켓 발권', b.id)
    st.toast(`${live.length}매 발권 완료`)
  }

  const canIssue = (b.status === '예매완료' || b.status === '부분취소') && live.some(s => !s.issued)
  const canChangePay = b.payMethod === '가상계좌' && b.status === '입금대기'
  const canReceipt = !b.cashReceipt && ['가상계좌', '현금', '간편결제'].includes(b.payMethod) && b.status !== '취소완료' && b.status !== '입금대기'

  return (
    <>
      <Drawer
        open onClose={onClose} width="max-w-3xl"
        title={<span className="flex items-center gap-2"><span className="font-mono">{b.id}</span><Status s={b.status} /></span>}
        footer={<>
          <button className="btn-outline btn-sm" onClick={resendSms}><MessageSquare size={14} />SMS 재발송</button>
          <button className="btn-outline btn-sm" disabled={!cancellable || !live.length} onClick={() => setSeatModal(true)}><ArrowLeftRight size={14} />좌석 변경</button>
          <button className="btn-outline btn-sm" disabled={!canChangePay} title={canChangePay ? '' : '가상계좌 입금대기 건만 변경 가능'} onClick={changePay}><CreditCard size={14} />결제수단 변경</button>
          <button className="btn-outline btn-sm" disabled={!canReceipt} title={b.cashReceipt ? '이미 발급됨' : '현금성 결제 건만 발급 가능'} onClick={() => setReceiptModal(true)}><Receipt size={14} />현금영수증</button>
          <button className="btn-primary btn-sm" disabled={!canIssue} onClick={issue}><Ticket size={14} />발권</button>
        </>}
      >
        <div className="space-y-5 text-sm">
          {/* 공연 정보 */}
          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">공연 · 회차</h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-paper p-3 sm:grid-cols-4">
              <Info l="공연" v={perf?.title} className="col-span-2" />
              <Info l="관람일시" v={roundLabel(round)} />
              <Info l="채널 / 예매일" v={<>{b.channel}<span className="block text-[11px] font-normal text-muted">{b.createdAt}</span></>} />
            </div>
          </section>

          {/* 좌석 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted">좌석 ({live.length}/{b.seats.length}매 유효)</h3>
              {cancellable && <span className="text-[11px] text-muted">체크 후 ‘선택 좌석 취소’로 부분 취소</span>}
            </div>
            <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
              <table className="tbl">
                <thead><tr><th className="w-8" /><th>좌석</th><th>등급</th><th>권종</th><th className="text-right">금액</th><th className="text-center">발권</th><th className="text-center">입장</th><th className="text-center">상태</th></tr></thead>
                <tbody>
                  {b.seats.map(s => (
                    <tr key={s.seatId} className={cx(s.cancelled && 'text-muted line-through decoration-gray-300')}>
                      <td>
                        <input type="checkbox" aria-label={`${s.seatId} 선택`} disabled={s.cancelled || !cancellable} checked={pick.includes(s.seatId)}
                          onChange={() => { setErr(''); setPick(p => p.includes(s.seatId) ? p.filter(x => x !== s.seatId) : [...p, s.seatId]) }} />
                      </td>
                      <td className="font-semibold">{s.seatId}</td>
                      <td>{gradeLabel[s.grade]}</td>
                      <td>{ticketTypeName(s.ticketTypeId)}</td>
                      <td className="text-right tabular-nums">{won(s.price)}</td>
                      <td className="text-center">{s.issued ? '●' : <span className="text-gray-300">○</span>}</td>
                      <td className="text-center">{s.used ? '●' : <span className="text-gray-300">○</span>}</td>
                      <td className="text-center no-underline">{s.cancelled ? <Status s="취소" /> : s.used ? <Status s="입장" /> : s.issued ? <Status s="발권" /> : <Status s="미발권" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {cancellable && (
              <div className="mt-3 space-y-2 rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    취소수수료 안내: <b className={feeInfo.blocked ? 'text-coral-500' : 'text-ink'}>{feeInfo.rule}</b>
                    {!feeInfo.blocked && <> · 예상 수수료 <b>{won(force ? 0 : feeInfo.fee)}</b></>}
                  </span>
                  <label className="flex items-center gap-1.5 font-semibold text-coral-500">
                    <input type="checkbox" checked={force} onChange={e => { setForce(e.target.checked); setErr('') }} />관리자 강제 취소(수수료 면제)
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-outline btn-sm text-coral-500" onClick={() => doCancel(false)} disabled={!pick.length}><XCircle size={14} />선택 좌석 취소 ({pick.length})</button>
                  <button className="btn-danger btn-sm" onClick={() => doCancel(true)}><XCircle size={14} />전체 취소</button>
                </div>
                {err && <Note tone="err">{err}</Note>}
                <p className="text-[11px] text-muted">10일 전 무료 · 9~7일 전 매당 1,000원 · 6~3일 전 10% · 2~1일 전 30% · 관람 당일 취소 불가 (예매 당일 취소는 무료)</p>
              </div>
            )}
          </section>

          {/* 결제 */}
          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">결제 정보</h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-paper p-3 sm:grid-cols-4">
              <Info l="결제수단" v={b.payMethod} />
              <Info l="티켓금액" v={won(ticketSum)} />
              <Info l="예매수수료" v={won(b.fee)} />
              <Info l="쿠폰할인" v={b.couponDiscount ? `-${won(b.couponDiscount)}` : '-'} />
              <Info l="결제금액" v={<span className="text-brand-600">{won(b.total)}</span>} />
              <Info l="취소금액" v={cancelSum ? <span className="text-coral-500">{won(cancelSum)}</span> : '-'} />
              <Info l="현금영수증" v={b.cashReceipt ? '발급완료' : '미발급'} />
              <Info l="패키지" v={b.packageOrderId ?? '-'} />
            </div>
            {b.vaccount && (
              <Note tone="warn" className="mt-2">가상계좌 <b>{b.vaccount.bank} {b.vaccount.no}</b> · 입금기한 {b.vaccount.due} {b.status === '입금대기' && '· 미입금 시 자동 취소'}</Note>
            )}
          </section>

          {/* 예매자 */}
          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">예매자</h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-paper p-3 sm:grid-cols-4">
              <Info l="예매자명" v={pii.name(b.bookerName)} />
              <Info l="휴대폰" v={pii.phone(b.bookerPhone)} />
              <Info l="회원" v={member ? <>{member.loginId}<span className="ml-1 text-[11px] font-normal text-muted">{member.membership ? '유료회원' : '일반'}</span></> : '비회원'} />
              <Info l="관람자" v={b.viewerName ? pii.name(b.viewerName) : '-'} />
            </div>
          </section>

          {/* 처리 로그 */}
          <section>
            <h3 className="mb-2 text-xs font-bold text-muted">처리 로그</h3>
            <ol className="relative space-y-2 border-l-2 border-line pl-4">
              <li className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300" />
                <div className="text-[11px] text-muted">{b.createdAt}</div>
                <div>예매 접수 ({b.channel} / {b.payMethod})</div>
              </li>
              {b.logs.map((l, i) => (
                <li key={i} className="relative">
                  <span className={cx('absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full', i === b.logs.length - 1 ? 'bg-brand-600' : 'bg-gray-300')} />
                  <div className="text-[11px] text-muted">{l.at}</div>
                  <div className="whitespace-pre-line">{l.msg}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Drawer>
      {seatModal && perf && round && <SeatChangeModal booking={b} perf={perf} round={round} onClose={() => setSeatModal(false)} />}
      {receiptModal && <CashReceiptModal booking={b} onClose={() => setReceiptModal(false)} />}
    </>
  )
}

function Info({ l, v, className }: { l: string; v: ReactNode; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="text-[11px] font-semibold text-muted">{l}</div>
      <div className="truncate font-semibold text-ink">{v ?? '-'}</div>
    </div>
  )
}
