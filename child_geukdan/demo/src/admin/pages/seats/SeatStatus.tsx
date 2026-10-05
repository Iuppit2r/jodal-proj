import { useCallback, useMemo } from 'react'
import { Printer } from 'lucide-react'
import { gradeOf, useBookings, useSeatState, useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Performance, Round } from '../../../data/types'
import { cx, fmtDate } from '../../../lib/format'
import SeatMap from '../../../components/SeatMap'
import { Bar, Card, DataTable, ExportButtons, Stat, printTarget, type Col } from '../../ui'
import { roundLabel } from '../../lib'

interface Row { r: Round; total: number; sold: number; held: number; site: number; used: number; left: number; rate: number }

export default function SeatStatus({ perf, round, rounds, onPick }: { perf: Performance; round?: Round; rounds: Round[]; onPick: (id: string) => void }) {
  const venue = M.venues.find(v => v.id === perf.venueId)!
  const total = venue.rows.length * venue.cols
  const bookings = useBookings()
  const holds = useStore(s => s.holds)
  const siteOnly = useStore(s => s.siteOnly)
  const overrides = useStore(s => s.gradeOverrides)
  const st = useSeatState(round?.id)

  const rows: Row[] = useMemo(() => {
    const ids = new Set(rounds.map(r => r.id))
    const sold = new Map<string, Set<string>>(), used = new Map<string, number>()
    for (const b of bookings) {
      if (!ids.has(b.roundId)) continue
      const s = sold.get(b.roundId) ?? new Set<string>()
      for (const x of b.seats) if (!x.cancelled) { s.add(x.seatId); if (x.used) used.set(b.roundId, (used.get(b.roundId) ?? 0) + 1) }
      sold.set(b.roundId, s)
    }
    return rounds.map(r => {
      const s = sold.get(r.id) ?? new Set<string>()
      const held = (holds[r.id] ?? []).filter(x => !s.has(x)).length
      const site = (siteOnly[r.id] ?? []).filter(x => !s.has(x)).length
      return { r, total, sold: s.size, held, site, used: used.get(r.id) ?? 0, left: total - s.size - held, rate: s.size / total }
    })
  }, [bookings, rounds, holds, siteOnly, total])

  const sum = rows.reduce((a, x) => ({ sold: a.sold + x.sold, total: a.total + (x.r.active ? x.total : 0), used: a.used + x.used }), { sold: 0, total: 0, used: 0 })

  const gradeFn = useCallback((id: string) => gradeOf(perf.id, id, overrides), [perf.id, overrides])
  const legend = useMemo(() => {
    const free = total - st.sold.size - [...st.held].filter(x => !st.sold.has(x)).length
    return [
      { label: '판매', v: st.sold.size - st.used.size, c: '#e5e7eb' },
      { label: '입장완료', v: st.used.size, c: '#9ca3af' },
      { label: '보류', v: [...st.held].filter(x => !st.sold.has(x)).length, c: '#fde68a' },
      { label: '현장전용(잔여)', v: [...st.siteOnly].filter(x => !st.sold.has(x) && !st.held.has(x)).length, c: '#374151' },
      { label: '판매가능', v: free, c: '#2647c4' },
    ]
  }, [st, total])

  const cols: Col<Row>[] = [
    { key: 'no', header: '회차', align: 'right', sort: x => x.r.no, render: x => <b>{x.r.no}</b> },
    { key: 'date', header: '일시', sort: x => x.r.date + x.r.time, render: x => <span className="tabular-nums">{fmtDate(x.r.date)} {x.r.time}{!x.r.active && <span className="chip ml-1 bg-gray-100 text-[10px] text-gray-500">미사용</span>}{x.r.note && <span className="chip ml-1 bg-violet-50 text-[10px] text-violet-700">{x.r.note}</span>}</span> },
    { key: 'total', header: '총좌석', align: 'right', render: x => x.total },
    { key: 'sold', header: '판매', align: 'right', sort: x => x.sold, render: x => <b>{x.sold}</b> },
    { key: 'held', header: '보류', align: 'right', sort: x => x.held, render: x => x.held || <span className="text-muted">0</span> },
    { key: 'site', header: '현장전용', align: 'right', sort: x => x.site, render: x => x.site || <span className="text-muted">0</span> },
    { key: 'used', header: '입장', align: 'right', sort: x => x.used, render: x => x.used },
    { key: 'left', header: '잔여', align: 'right', sort: x => x.left, render: x => <span className={cx(x.left === 0 && 'font-bold text-coral-500')}>{x.left === 0 ? '매진' : x.left}</span> },
    {
      key: 'rate', header: '점유율', sort: x => x.rate, render: x => (
        <div className="flex w-32 items-center gap-2">
          <Bar value={x.rate * 100} color={x.rate >= 0.9 ? '#f2664b' : x.rate >= 0.5 ? '#1fb592' : '#2647c4'} />
          <span className="w-11 text-right text-xs tabular-nums">{(x.rate * 100).toFixed(1)}%</span>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title="회차별 좌석 현황" sub={`${perf.title} · 행을 클릭하면 우측 좌석도가 바뀝니다`} bodyClass="p-3"
        actions={<ExportButtons filename={`좌석현황_${perf.code}`} count={rows.length} print={false} getRows={() => [
          ['회차', '일자', '시간', '총좌석', '판매', '보류', '현장전용', '입장', '잔여', '점유율'],
          ...rows.map(x => [x.r.no, x.r.date, x.r.time, x.total, x.sold, x.held, x.site, x.used, x.left, (x.rate * 100).toFixed(1) + '%']),
        ]} />}>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <Stat label="누적 판매" value={`${sum.sold.toLocaleString()}석`} />
          <Stat label="평균 점유율" value={sum.total ? `${((sum.sold / sum.total) * 100).toFixed(1)}%` : '-'} />
          <Stat label="누적 입장" value={`${sum.used.toLocaleString()}명`} />
        </div>
        <DataTable columns={cols} rows={rows} rowKey={x => x.r.id} dense pageSize={20} maxHeight="56vh" onRowClick={x => onPick(x.r.id)}
          rowClass={x => cx(x.r.id === round?.id && '!bg-brand-50 font-semibold', !x.r.active && 'opacity-50')} empty="등록된 회차가 없습니다." />
      </Card>

      <Card className="print-target" title={round ? roundLabel(round) : '회차 미선택'} sub={`${venue.name} · 실시간 좌석 상태 (조회 전용)`}
        actions={<button type="button" className="btn-outline btn-sm" onClick={printTarget}><Printer size={13} />출력</button>}>
        <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {legend.map(l => (
            <li key={l.label} className="rounded-lg bg-paper px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.c }} />{l.label}</div>
              <div className="text-base font-extrabold tabular-nums">{l.v}</div>
            </li>
          ))}
        </ul>
        {round
          ? <SeatMap venue={venue} gradeOf={gradeFn} prices={perf.prices} sold={st.sold} used={st.used} held={st.held} siteOnly={st.siteOnly}
              selected={[]} mode="pos" distancing={round.distancing} size="md"
              overlay={id => (st.siteOnly.has(id) && !st.sold.has(id) && !st.held.has(id) ? '#374151' : undefined)} />
          : <p className="py-10 text-center text-sm text-muted">회차를 선택하세요.</p>}
      </Card>
    </div>
  )
}
