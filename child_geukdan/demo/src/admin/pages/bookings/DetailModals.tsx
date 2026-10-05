import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Modal from '../../../components/Modal'
import SeatMap from '../../../components/SeatMap'
import { useStore, useSeatState, venueOf } from '../../../store'
import { gradeLabel } from '../../../data/mock'
import type { Booking, Performance, Round } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Field, Note, Segmented, errMsg } from '../../ui'
import { roundLabel } from '../../lib'
import { useGradeFn } from './shared'

/** 좌석 변경 – 동일 회차, 동일 등급의 빈 좌석으로만 변경 */
export function SeatChangeModal({ booking: b, perf, round, onClose }: { booking: Booking; perf: Performance; round: Round; onClose: () => void }) {
  const live = b.seats.filter(s => !s.cancelled && !s.used)
  const [from, setFrom] = useState(live[0]?.seatId ?? '')
  const [to, setTo] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const seatState = useSeatState(round.id)
  const gradeOf = useGradeFn(perf)
  const fromGrade = b.seats.find(s => s.seatId === from)?.grade

  const onToggle = (id: string) => {
    setErr('')
    if (to === id) { setTo(null); return }
    if (gradeOf(id) !== fromGrade) { setErr(errMsg('E-TC-330', `동일 등급(${fromGrade ? gradeLabel[fromGrade] : ''}) 좌석으로만 변경할 수 있습니다`)); return }
    setTo(id)
  }
  const save = () => {
    if (!from || !to) { setErr(errMsg('E-TC-331', '변경할 좌석을 선택해 주세요')); return }
    if (seatState.sold.has(to) || seatState.held.has(to)) { setErr(errMsg('E-TC-420', '이미 판매된 좌석입니다')); return }
    const st = useStore.getState()
    st.patchBooking(b.id, { seats: b.seats.map(s => s.seatId === from ? { ...s, seatId: to, issued: false } : s) }, `좌석 변경 ${from} → ${to}`)
    st.log('예매 좌석 변경', `${b.id} ${from}→${to}`)
    st.sendSms(b.bookerPhone, `[국립어린이청소년극단] <${perf.title}> 예매번호 ${b.id} 좌석이 ${from} → ${to}(으)로 변경되었습니다.`)
    st.toast(`좌석 변경 완료 (${from} → ${to})`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="좌석 변경" size="xl"
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" disabled={!to} onClick={save}>변경 저장</button></>}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">{perf.title} · {roundLabel(round)}</span>
        </div>
        {!live.length ? <Note tone="warn">변경 가능한 좌석이 없습니다. (입장 완료·취소 좌석 제외)</Note> : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">변경할 좌석</span>
              {live.map(s => (
                <button key={s.seatId} onClick={() => { setFrom(s.seatId); setTo(null); setErr('') }}
                  className={cx('rounded-md border px-2.5 py-1 text-xs font-bold', from === s.seatId ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white')}>
                  {s.seatId} <span className="font-normal opacity-80">{gradeLabel[s.grade]}</span>
                </button>
              ))}
              <ArrowRight size={14} className="text-muted" />
              <span className={cx('rounded-md px-2.5 py-1 text-xs font-bold', to ? 'bg-ink text-white' : 'bg-paper text-muted')}>{to ?? '새 좌석 선택'}</span>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <SeatMap
                venue={venueOf(perf)} gradeOf={gradeOf} prices={perf.prices} mode="pos" size="md"
                sold={seatState.sold} used={seatState.used} held={seatState.held} siteOnly={seatState.siteOnly}
                selected={to ? [to] : []} maxSelect={2} onToggle={onToggle}
                overlay={id => (gradeOf(id) !== fromGrade ? '#d9dde5' : undefined)}
              />
            </div>
            {err ? <Note tone="err">{err}</Note> : <Note>같은 등급({fromGrade ? gradeLabel[fromGrade] : '-'})의 빈 좌석만 선택할 수 있습니다. 다른 등급은 회색으로 표시됩니다. 변경 시 재발권이 필요합니다.</Note>}
          </>
        )}
      </div>
    </Modal>
  )
}

/** 현금영수증 발급 */
export function CashReceiptModal({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const [kind, setKind] = useState<'소득공제' | '지출증빙'>('소득공제')
  const [no, setNo] = useState(b.bookerPhone)
  const [err, setErr] = useState('')
  const submit = () => {
    const d = no.replace(/\D/g, '')
    if (kind === '소득공제' && !/^01\d{8,9}$/.test(d)) { setErr(errMsg('E-TC-340', '휴대폰 번호 형식이 올바르지 않습니다')); return }
    if (kind === '지출증빙' && d.length !== 10) { setErr(errMsg('E-TC-341', '사업자등록번호 10자리를 입력해 주세요')); return }
    const st = useStore.getState()
    st.patchBooking(b.id, { cashReceipt: true }, `현금영수증 발급 (${kind}, ${kind === '소득공제' ? d.replace(/(\d{3})\d+(\d{4})/, '$1-****-$2') : d.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')})`)
    st.log('현금영수증 발급', `${b.id} ${kind}`)
    st.toast(`현금영수증(${kind}) 발급 완료 · 국세청 전송 예정`)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="현금영수증 발급"
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={submit}>발급</button></>}>
      <div className="space-y-3">
        <Segmented options={[{ value: '소득공제', label: '소득공제(개인)' }, { value: '지출증빙', label: '지출증빙(사업자)' }]} value={kind}
          onChange={v => { setKind(v); setNo(v === '소득공제' ? b.bookerPhone : ''); setErr('') }} />
        <Field label={kind === '소득공제' ? '휴대폰 번호' : '사업자등록번호'} required error={err}>
          <input className="input" value={no} onChange={e => { setNo(e.target.value); setErr('') }} placeholder={kind === '소득공제' ? '010-0000-0000' : '000-00-00000'} />
        </Field>
        <div className="rounded-lg bg-paper p-3 text-xs">
          <div className="flex justify-between"><span>발급 대상 금액</span><b>{b.total.toLocaleString()}원</b></div>
          <div className="mt-1 text-muted">문화비 소득공제 대상 공연은 ‘도서·공연비’ 항목으로 신고됩니다.</div>
        </div>
      </div>
    </Modal>
  )
}
