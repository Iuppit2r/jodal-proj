import { useMemo, useState } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Undo2 } from 'lucide-react'
import { useBookings, useStore } from '../../../store'
import type { Booking } from '../../../data/types'
import { ask, Card, DataTable, ExportButtons, Note, PiiToggle, usePII, CHART_COLORS, type Col } from '../../ui'
import { TODAY, cancelledAmount, num, roundLabel, usePerfMap, useRoundMap } from '../../lib'
import { won } from '../../../lib/format'
import { ChartBox, axisTick, gridProps, short, tipStyle, wonFmt } from '../reports/common'

const CANCEL_FEE_RATE = 0.1
const REFUND_LIMIT = 200

interface FeeRow { perfId: string; title: string; cnt: number; fee: number; cancelCnt: number; cancelAmt: number; cancelFee: number }
interface RefundRow { b: Booking; unused: string[]; amount: number }

export default function FeeRefundTab() {
  const bookings = useBookings()
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const cancelSeats = useStore(s => s.cancelSeats)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [sel, setSel] = useState<string[]>([])

  const fees = useMemo(() => {
    const m = new Map<string, FeeRow>()
    for (const b of bookings) {
      const r = m.get(b.perfId) ?? { perfId: b.perfId, title: perfMap.get(b.perfId)?.title ?? b.perfId, cnt: 0, fee: 0, cancelCnt: 0, cancelAmt: 0, cancelFee: 0 }
      if (b.status !== '취소완료' && b.status !== '입금대기') { r.cnt++; r.fee += b.fee }
      const c = cancelledAmount(b)
      if (c) { r.cancelCnt++; r.cancelAmt += c; r.cancelFee += Math.round((c * CANCEL_FEE_RATE) / 100) * 100 }
      m.set(b.perfId, r)
    }
    return [...m.values()].sort((a, b) => b.fee + b.cancelFee - (a.fee + a.cancelFee))
  }, [bookings, perfMap])
  const ft = fees.reduce((a, r) => ({ fee: a.fee + r.fee, cancelFee: a.cancelFee + r.cancelFee, cancelAmt: a.cancelAmt + r.cancelAmt }), { fee: 0, cancelFee: 0, cancelAmt: 0 })

  const refunds = useMemo(() => {
    const out: RefundRow[] = []
    for (const b of bookings) {
      if (b.status === '취소완료' || b.status === '입금대기') continue
      const r = roundMap.get(b.roundId)
      if (!r || r.date >= TODAY) continue
      const unusedSeats = b.seats.filter(s => !s.cancelled && !s.used && s.price > 0)
      if (!unusedSeats.length) continue
      out.push({ b, unused: unusedSeats.map(s => s.seatId), amount: unusedSeats.reduce((a, s) => a + s.price, 0) })
    }
    return out.sort((a, b) => (roundMap.get(b.b.roundId)?.date ?? '').localeCompare(roundMap.get(a.b.roundId)?.date ?? '')).slice(0, REFUND_LIMIT)
  }, [bookings, roundMap])

  const refund = async (list: RefundRow[]) => {
    if (!list.length) return
    const amt = list.reduce((a, r) => a + r.amount, 0)
    const ok = await ask({
      title: '미사용 환불 처리', tone: 'danger', confirmText: '환불 처리',
      message: <>{list.length === 1 ? <>예매번호 <span className="font-mono">{list[0].b.id}</span>의 미사용 좌석 {list[0].unused.length}매</> : <>{list.length}건 예매의 미사용 좌석</>}를 환불 처리합니다.<br />환불 금액 <b className="text-coral-500">{won(amt)}</b> · 처리 후 예매자에게 알림톡이 발송됩니다.</>,
    })
    if (ok === null) return
    for (const r of list) cancelSeats(r.b.id, r.unused, '미사용 환불')
    log('미사용 티켓 환불', `${list.map(r => r.b.id).slice(0, 3).join(', ')}${list.length > 3 ? ` 외 ${list.length - 3}건` : ''} / ${won(amt)}`)
    toast(`${list.length}건 미사용 환불 완료 (${won(amt)})`)
    setSel([])
  }

  const feeCols: Col<FeeRow>[] = [
    { key: 'title', header: '공연', sort: r => r.title, render: r => <span className="font-semibold">{r.title}</span> },
    { key: 'cnt', header: '유효 예매', align: 'right', sort: r => r.cnt, render: r => num(r.cnt) },
    { key: 'fee', header: '예매수수료', align: 'right', sort: r => r.fee, render: r => won(r.fee) },
    { key: 'cancelCnt', header: '취소 건', align: 'right', sort: r => r.cancelCnt, render: r => num(r.cancelCnt) },
    { key: 'cancelAmt', header: '취소금액', align: 'right', sort: r => r.cancelAmt, render: r => won(r.cancelAmt) },
    { key: 'cancelFee', header: '취소수수료(추정 10%)', align: 'right', sort: r => r.cancelFee, render: r => won(r.cancelFee) },
    { key: 'sum', header: '수수료 합계', align: 'right', sort: r => r.fee + r.cancelFee, render: r => <b>{won(r.fee + r.cancelFee)}</b> },
  ]
  const refundCols: Col<RefundRow>[] = [
    { key: 'id', header: '예매번호', sort: r => r.b.id, render: r => <span className="font-mono text-xs">{r.b.id}</span> },
    { key: 'perf', header: '공연', sort: r => r.b.perfId, render: r => perfMap.get(r.b.perfId)?.title },
    { key: 'round', header: '관람 회차', sort: r => roundMap.get(r.b.roundId)?.date ?? '', render: r => roundLabel(roundMap.get(r.b.roundId)) },
    { key: 'name', header: '예매자', render: r => <>{pii.name(r.b.bookerName)} <span className="text-[11px] text-muted">{pii.phone(r.b.bookerPhone)}</span></> },
    { key: 'pay', header: '결제', sort: r => r.b.payMethod, render: r => r.b.payMethod },
    { key: 'seats', header: '미사용 좌석', render: r => <span className="text-xs">{r.unused.join(', ')}</span> },
    { key: 'amount', header: '환불 예정액', align: 'right', sort: r => r.amount, render: r => <b>{won(r.amount)}</b> },
    { key: 'act', header: '', render: r => <button className="btn-outline btn-sm" onClick={e => { e.stopPropagation(); refund([r]) }}><Undo2 size={12} />환불 처리</button> },
  ]

  return (
    <div className="space-y-4">
      <Card title="예매·취소수수료 집계" sub={`예매수수료 ${won(ft.fee)} · 취소수수료(추정) ${won(ft.cancelFee)} · 취소금액 ${won(ft.cancelAmt)}`}
        actions={<ExportButtons filename="수수료집계" count={fees.length}
          getRows={() => [['공연', '유효예매', '예매수수료', '취소건', '취소금액', '취소수수료(추정)', '합계'], ...fees.map(r => [r.title, r.cnt, r.fee, r.cancelCnt, r.cancelAmt, r.cancelFee, r.fee + r.cancelFee])]} />}>
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <ChartBox height={240} title="공연별 수수료 수입">
              <BarChart data={fees}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="title" tick={axisTick} interval={0} tickFormatter={v => String(v).slice(0, 6)} />
                <YAxis tick={axisTick} tickFormatter={short} width={44} />
                <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RBar dataKey="fee" name="예매수수료" stackId="a" fill={CHART_COLORS[0]} />
                <RBar dataKey="cancelFee" name="취소수수료" stackId="a" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartBox>
          </div>
          <div className="min-w-0 xl:col-span-3">
            <DataTable columns={feeCols} rows={fees} rowKey={r => r.perfId} dense maxHeight="300px" />
            <Note className="mt-2">취소수수료는 관람일 기준 취소 시점별 규정(최대 10%)을 일괄 적용한 추정치입니다. 실제 부과액은 예매 취소 내역의 수수료 항목으로 확정됩니다.</Note>
          </div>
        </div>
      </Card>

      <Card title="미사용 티켓 환불" sub={`관람일이 지났으나 입장(검표) 기록이 없는 유효 좌석 · 최근 ${REFUND_LIMIT}건까지 표시`}
        actions={<>
          <PiiToggle />
          <button className="btn-danger btn-sm" disabled={!sel.length} onClick={() => refund(refunds.filter(r => sel.includes(r.b.id)))}><Undo2 size={14} />선택 환불 ({sel.length})</button>
          <ExportButtons filename="미사용환불대상" count={refunds.length}
            getRows={() => [['예매번호', '공연', '회차', '예매자', '결제', '미사용좌석', '환불예정액'], ...refunds.map(r => [r.b.id, perfMap.get(r.b.perfId)?.title ?? '', roundLabel(roundMap.get(r.b.roundId)), pii.name(r.b.bookerName), r.b.payMethod, r.unused.join(' '), r.amount])]} />
        </>}>
        <DataTable columns={refundCols} rows={refunds} rowKey={r => r.b.id} pageSize={10} selectable selected={sel} onSelectChange={setSel}
          empty="환불 대상 미사용 티켓이 없습니다." />
        <Note tone="warn" className="mt-2">미사용 환불은 「공연 관람 약관」 제12조(천재지변·주최측 사유 등)에 해당하는 경우에 한해 처리하며, 처리 결과는 예매 상세 이력과 변경이력에 함께 기록됩니다.</Note>
      </Card>
    </div>
  )
}
