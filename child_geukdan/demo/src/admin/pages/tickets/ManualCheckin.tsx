import { useMemo, useState } from 'react'
import { AlertTriangle, Ban, CheckCircle2, ScanLine, SearchX } from 'lucide-react'
import { useStore, useBookings, findBooking, nowStr } from '../../../store'
import { cx } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, Note, Status, errMsg, usePII, type Col } from '../../ui'
import { TODAY, roundLabel, usePerfMap, useRoundMap } from '../../lib'

type Result = 'ok' | 'used' | 'cancelled' | 'notfound' | 'unpaid'
interface Rec { id: string; at: string; bookingId: string; seat: string; result: Result; msg: string; reason: string }

const REASONS = ['QR 인식 불가', '모바일 기기 미지참', '배터리 방전', '단체 관람 일괄 입장', '기타']
const RES_UI: Record<Result, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  ok: { label: '입장 완료', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
  used: { label: '중복 입장', cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
  cancelled: { label: '취소 티켓', cls: 'border-red-200 bg-red-50 text-red-700', icon: Ban },
  notfound: { label: '조회 불가', cls: 'border-red-200 bg-red-50 text-red-700', icon: SearchX },
  unpaid: { label: '미결제', cls: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
}

/** 수작업 검표 등록 */
export default function ManualCheckin({ onOpen }: { onOpen: (id: string) => void }) {
  const bookings = useBookings()
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const [no, setNo] = useState('')
  const [seat, setSeat] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [last, setLast] = useState<Rec | null>(null)
  const [recs, setRecs] = useState<Rec[]>([])

  const lookup = useMemo(() => {
    const id = no.trim().toUpperCase()
    return id.length >= 8 ? bookings.find(b => b.id === id) : undefined
  }, [no, bookings])

  // 시연용 예시 예매번호 (다가오는 회차의 유효 예매 + 취소 예매 1건)
  const samples = useMemo(() => {
    const up = bookings.filter(b => (b.status === '예매완료' || b.status === '발권완료') && (roundMap.get(b.roundId)?.date ?? '') >= TODAY && b.seats.some(s => !s.cancelled && !s.used))
    const cancelled = bookings.find(b => b.status === '취소완료' && (roundMap.get(b.roundId)?.date ?? '') >= TODAY)
    return [...up.slice(0, 3).map(b => ({ id: b.id, tag: '유효' })), ...(cancelled ? [{ id: cancelled.id, tag: '취소' }] : [])]
  }, [bookings, roundMap])

  const submit = () => {
    const id = no.trim().toUpperCase()
    const st = useStore.getState()
    let result: Result
    let msg: string
    const b = id ? findBooking(id) : undefined
    if (!id) { result = 'notfound'; msg = errMsg('E-TC-400', '예매번호를 입력해 주세요') }
    else if (!b) { result = 'notfound'; msg = errMsg('E-TC-404', `예매번호 ${id} 를 찾을 수 없습니다`) }
    else if (b.status === '입금대기') { result = 'unpaid'; msg = errMsg('E-TC-411', '입금 대기 중인 예매는 입장할 수 없습니다 (결제 확인 필요)') }
    else {
      result = st.checkInSeat(id, seat || undefined)
      const perf = perfMap.get(b.perfId)
      msg = result === 'ok' ? `${perf?.title ?? ''} · ${roundLabel(roundMap.get(b.roundId))} · ${seat || b.seats.filter(s => !s.cancelled && !s.used).map(s => s.seatId).join(', ')} 입장 처리되었습니다.`
        : result === 'used' ? errMsg('E-TC-409', '이미 입장 처리된 티켓입니다 (중복 입장 시도)')
        : result === 'cancelled' ? errMsg('E-TC-410', '취소된 티켓입니다. 입장할 수 없습니다')
        : errMsg('E-TC-404', `해당 예매에 ${seat} 좌석이 없습니다`)
      if (result === 'ok') st.log(`수작업 검표(사유: ${reason})`, `${id}${seat ? ` ${seat}` : ''}`)
    }
    const rec: Rec = { id: Math.random().toString(36).slice(2), at: nowStr(), bookingId: id || '-', seat: seat || '전체', result, msg, reason }
    setLast(rec)
    setRecs(r => [rec, ...r].slice(0, 50))
    if (result === 'ok') { setNo(''); setSeat('') }
  }

  const columns: Col<Rec>[] = [
    { key: 'at', header: '처리시각', sort: r => r.at, render: r => <span className="text-xs">{r.at}</span> },
    { key: 'b', header: '예매번호', sort: r => r.bookingId, render: r => <span className="font-mono text-xs">{r.bookingId}</span> },
    { key: 'seat', header: '좌석', render: r => r.seat },
    { key: 'reason', header: '사유', render: r => <span className="text-xs">{r.reason}</span> },
    { key: 'res', header: '결과', sort: r => r.result, render: r => <Status s={r.result === 'ok' ? '입장' : r.result === 'used' ? '대기' : '오류'} /> },
    { key: 'msg', header: '메시지', render: r => <span className={cx('text-xs', r.result !== 'ok' && 'text-coral-500')}>{r.msg}</span> },
  ]

  const ui = last ? RES_UI[last.result] : null

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Card title="수작업 검표 등록" sub="QR 인식이 불가한 경우 예매번호로 입장 처리합니다.">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit() }}>
          <Field label="예매번호" required>
            <div className="relative">
              <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-9 font-mono uppercase tracking-wider" value={no} autoFocus
                onChange={e => { setNo(e.target.value); setSeat('') }} placeholder="T26100100001" />
            </div>
          </Field>
          {lookup && (
            <div className="rounded-lg bg-paper p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => onOpen(lookup.id)}>{perfMap.get(lookup.perfId)?.title}</button>
                <Status s={lookup.status} />
              </div>
              <div className="mt-1 text-muted">{roundLabel(roundMap.get(lookup.roundId))} · {pii.name(lookup.bookerName)}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {lookup.seats.map(s => (
                  <span key={s.seatId} className={cx('rounded px-1.5 py-0.5 font-semibold', s.cancelled ? 'bg-red-50 text-red-600 line-through' : s.used ? 'bg-gray-200 text-gray-500' : 'bg-white text-ink ring-1 ring-line')}>
                    {s.seatId}{s.used && ' ✓'}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="좌석 (선택)" hint="미선택 시 전체 좌석">
              <select className="input" value={seat} onChange={e => setSeat(e.target.value)} disabled={!lookup}>
                <option value="">전체 좌석</option>
                {lookup?.seats.map(s => <option key={s.seatId} value={s.seatId}>{s.seatId}</option>)}
              </select>
            </Field>
            <Field label="처리 사유">
              <select className="input" value={reason} onChange={e => setReason(e.target.value)}>{REASONS.map(r => <option key={r}>{r}</option>)}</select>
            </Field>
          </div>
          <button type="submit" className="btn-primary w-full"><CheckCircle2 size={16} />입장 처리</button>
        </form>

        {last && ui && (
          <div className={cx('mt-4 flex gap-3 rounded-xl border p-4', ui.cls)} role="status" aria-live="polite">
            <ui.icon size={28} className="shrink-0" />
            <div className="min-w-0">
              <div className="text-base font-extrabold">{ui.label}</div>
              <div className="text-xs">{last.bookingId} · {last.seat}</div>
              <div className="mt-1 text-sm">{last.msg}</div>
            </div>
          </div>
        )}

        {samples.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1.5 text-[11px] font-semibold text-muted">시연용 예매번호</div>
            <div className="flex flex-wrap gap-1.5">
              {samples.map(s => (
                <button key={s.id} type="button" onClick={() => { setNo(s.id); setSeat('') }}
                  className="rounded-md border border-line px-2 py-1 font-mono text-[11px] hover:border-brand-500">
                  {s.id} <span className={s.tag === '취소' ? 'text-coral-500' : 'text-emerald-600'}>{s.tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="최근 수작업 검표 내역" sub="이 화면에서 처리한 내역 (변경이력에도 기록됩니다)" bodyClass="p-3"
        actions={<ExportButtons filename="수작업검표내역" count={recs.length} getRows={() => [['처리시각', '예매번호', '좌석', '사유', '결과', '메시지'], ...recs.map(r => [r.at, r.bookingId, r.seat, r.reason, RES_UI[r.result].label, r.msg])]} />}>
        {recs.length ? <DataTable columns={columns} rows={recs} rowKey={r => r.id} pageSize={10} dense /> : <Note>아직 처리한 내역이 없습니다. 왼쪽에서 예매번호를 입력하거나 시연용 예매번호를 선택해 입장 처리해 보세요.</Note>}
      </Card>
    </div>
  )
}
