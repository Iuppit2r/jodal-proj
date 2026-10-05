import { useMemo, useState } from 'react'
import { Ban, CheckCircle2 } from 'lucide-react'
import { useStore, useBookings } from '../../../store'
import { won } from '../../../lib/format'
import type { Booking } from '../../../data/types'
import { Card, DataTable, Field, Kpi, Note, Status, ask, errMsg, runHeavy, usePII, type Col } from '../../ui'
import { TODAY, liveSeats, netAmount, num, roundLabel } from '../../lib'
import { bulkCancelBookings } from './shared'

const REASONS = ['공연 취소(출연진 사정)', '공연 취소(천재지변·재난)', '시설 점검·안전 문제', '회차 변경(일정 조정)']

/** 회차 일괄 취소 (SFR-TC-013) */
export default function BulkCancel() {
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const bookings = useBookings()
  const pii = usePII()
  const [perfId, setPerfId] = useState('p1')
  const [roundId, setRoundId] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [memo, setMemo] = useState('')
  const [stopRound, setStopRound] = useState(true)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<{ round: string; bookings: number; seats: number; amount: number } | null>(null)

  const perf = perfs.find(p => p.id === perfId)
  const perfRounds = useMemo(() => rounds.filter(r => r.perfId === perfId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [rounds, perfId])
  const round = rounds.find(r => r.id === roundId)

  const targets = useMemo(() => bookings.filter(b => b.roundId === roundId && b.status !== '취소완료' && b.status !== '관람완료' && liveSeats(b) > 0), [bookings, roundId])
  const stat = useMemo(() => ({
    seats: targets.reduce((a, b) => a + liveSeats(b), 0),
    amount: targets.reduce((a, b) => a + netAmount(b) + (b.fee ?? 0), 0),
    vacc: targets.filter(b => b.status === '입금대기').length,
  }), [targets])

  const columns: Col<Booking>[] = [
    { key: 'id', header: '예매번호', sort: b => b.id, render: b => <span className="font-mono text-xs">{b.id}</span> },
    { key: 'name', header: '예매자', render: b => pii.name(b.bookerName) },
    { key: 'phone', header: '휴대폰', render: b => pii.phone(b.bookerPhone) },
    { key: 'seats', header: '좌석', render: b => <span className="text-xs">{b.seats.filter(s => !s.cancelled).map(s => s.seatId).join(', ')}</span> },
    { key: 'amt', header: '환불액', align: 'right', sort: b => netAmount(b) + b.fee, render: b => won(netAmount(b) + b.fee) },
    { key: 'pay', header: '결제수단', sort: b => b.payMethod, render: b => b.payMethod },
    { key: 'status', header: '상태', sort: b => b.status, render: b => <Status s={b.status} /> },
  ]

  const run = async () => {
    setErr('')
    if (!round) { setErr(errMsg('E-TC-601', '취소할 회차를 선택해 주세요')); return }
    if (round.date < TODAY) { setErr(errMsg('E-TC-602', '이미 종료된 회차는 일괄 취소할 수 없습니다')); return }
    if (!targets.length) { setErr(errMsg('E-TC-603', '취소할 유효 예매가 없습니다')); return }
    const fullReason = memo.trim() ? `${reason} – ${memo.trim()}` : reason
    const ok = await ask({
      title: '회차 일괄 취소', tone: 'danger', confirmText: `${targets.length}건 전체 취소`,
      reason: '처리 확인 문구 (“일괄취소” 입력)',
      message: (
        <div className="space-y-2">
          <p><b>{perf?.title}</b> {roundLabel(round)} 회차의 유효 예매 <b>{num(targets.length)}건 / {num(stat.seats)}매</b>를 모두 취소하고 <b>{won(stat.amount)}</b>을 전액 환불(수수료 면제) 처리합니다.</p>
          <p className="text-xs text-muted">사유: {fullReason} · 전체 예매자에게 취소 안내 알림톡이 발송됩니다. 이 작업은 되돌릴 수 없습니다.</p>
        </div>
      ),
    })
    if (ok === null) return
    if (ok.replace(/\s/g, '') !== '일괄취소') { setErr(errMsg('E-TC-604', '확인 문구가 일치하지 않아 취소되지 않았습니다 (“일괄취소” 입력)')); return }
    await runHeavy({ title: '회차 일괄 취소 처리 중', message: `${num(targets.length)}건 예매 취소 · PG 환불 요청 · 알림톡 발송 중입니다.`, ms: 2200 })
    const amount = stat.amount
    const r = bulkCancelBookings(targets, fullReason, perf?.title ?? '')
    const st = useStore.getState()
    if (stopRound && perf) {
      st.setRounds(perf.id, st.rounds.filter(x => x.perfId === perf.id).map(x => x.id === round.id ? { ...x, active: false, note: '공연 취소' } : x))
    }
    st.log('회차 일괄 취소', `${perf?.title} ${roundLabel(round)} / ${r.bookings}건 ${r.seats}매 / 사유: ${fullReason}`)
    st.toast(`일괄 취소 완료 · ${num(r.bookings)}건 ${num(r.seats)}매 환불 ${won(amount)}`)
    setResult({ round: roundLabel(round), bookings: r.bookings, seats: r.seats, amount })
  }

  return (
    <div className="space-y-4">
      <Note tone="warn">공연 취소·천재지변 등으로 회차 전체를 취소해야 할 때 사용합니다. 취소수수료는 면제되며, 처리 결과는 변경이력과 각 예매의 처리 로그에 남습니다.</Note>
      <Card title="취소 대상 회차">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="공연" required>
            <select className="input" value={perfId} onChange={e => { setPerfId(e.target.value); setRoundId(''); setResult(null) }}>
              {perfs.map(p => <option key={p.id} value={p.id}>{p.title} ({p.status})</option>)}
            </select>
          </Field>
          <Field label="회차" required>
            <select className="input" value={roundId} onChange={e => { setRoundId(e.target.value); setErr(''); setResult(null) }}>
              <option value="">회차 선택</option>
              {perfRounds.map(r => <option key={r.id} value={r.id} disabled={r.date < TODAY}>{roundLabel(r)}{r.date < TODAY ? ' – 종료' : ''}{!r.active ? ' – 비활성' : ''}</option>)}
            </select>
          </Field>
          <Field label="취소 사유" required>
            <select className="input" value={reason} onChange={e => setReason(e.target.value)}>{REASONS.map(r => <option key={r}>{r}</option>)}</select>
          </Field>
          <Field label="상세 사유 (안내문 포함)">
            <input className="input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 주연 배우 부상" />
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={stopRound} onChange={e => setStopRound(e.target.checked)} />취소 후 해당 회차 판매 중지(비활성)</label>
      </Card>

      {round && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="유효 예매" value={`${num(targets.length)}건`} tone="brand" />
            <Kpi label="취소 좌석" value={`${num(stat.seats)}매`} tone="sun" />
            <Kpi label="환불 예정액" value={won(stat.amount)} tone="coral" />
            <Kpi label="입금대기 포함" value={`${stat.vacc}건`} sub="가상계좌는 발급 취소" tone="ink" />
          </div>
          <Card title={`취소 대상 예매 (${roundLabel(round)})`} bodyClass="p-3"
            actions={<button className="btn-danger btn-sm" onClick={run} disabled={!targets.length}><Ban size={14} />회차 일괄 취소 실행</button>}>
            {err && <Note tone="err" className="mb-3">{err}</Note>}
            <DataTable columns={columns} rows={targets} rowKey={b => b.id} pageSize={10} dense maxHeight="40vh" empty="취소할 유효 예매가 없습니다." />
          </Card>
        </>
      )}
      {!round && err && <Note tone="err">{err}</Note>}

      {result && (
        <Note><CheckCircle2 size={13} className="mr-1 inline -mt-0.5" /><b>{result.round}</b> 회차 일괄 취소 완료 — {num(result.bookings)}건 / {num(result.seats)}매 / 환불 {won(result.amount)}. 예매 조회 탭에서 ‘취소완료’ 상태로 확인할 수 있습니다.</Note>
      )}
    </div>
  )
}
