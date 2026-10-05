import { useMemo, useState } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts'
import { Banknote, ReceiptText, RotateCcw, Wallet } from 'lucide-react'
import { useBookings, useStore } from '../../../store'
import { Card, DataTable, DateRange, ExportButtons, FilterBar, Field, Kpi, Segmented, CHART_COLORS, type Col } from '../../ui'
import { TODAY, cancelledAmount, dayOf, monthOf, netAmount, num, pct, usePerfMap, addDays } from '../../lib'
import { won } from '../../../lib/format'
import { ChartBox, axisTick, gridProps, short, tipStyle, wonFmt, filterBookings, type RangeFilter } from '../reports/common'

interface Agg { key: string; label: string; cnt: number; seats: number; gross: number; cancel: number; net: number; fee: number }
const empty = (key: string, label: string): Agg => ({ key, label, cnt: 0, seats: 0, gross: 0, cancel: 0, net: 0, fee: 0 })

function add(a: Agg, b: ReturnType<typeof useBookings>[number]) {
  const live = b.seats.filter(s => !s.cancelled)
  const c = cancelledAmount(b)
  const n = netAmount(b)
  a.cnt++
  a.seats += live.length
  a.gross += n + c
  a.cancel += c
  a.net += n
  a.fee += b.status === '취소완료' ? 0 : b.fee
}

type View = 'perf' | 'pay' | 'period'

export default function SalesTab() {
  const bookings = useBookings()
  const perfMap = usePerfMap()
  const perfs = useStore(s => s.performances)
  const [draft, setDraft] = useState<RangeFilter>({ from: addDays(TODAY, -90), to: TODAY, perfId: '' })
  const [f, setF] = useState<RangeFilter>(draft)
  const [view, setView] = useState<View>('perf')
  const [unit, setUnit] = useState<'day' | 'month'>('day')

  const rows = useMemo(() => filterBookings(bookings, f).filter(b => b.status !== '입금대기'), [bookings, f])

  const total = useMemo(() => { const t = empty('t', '합계'); for (const b of rows) add(t, b); return t }, [rows])

  const grouped = useMemo(() => {
    const m = new Map<string, Agg>()
    for (const b of rows) {
      let key: string, label: string
      if (view === 'perf') { key = b.perfId; label = perfMap.get(b.perfId)?.title ?? b.perfId }
      else if (view === 'pay') { key = b.payMethod; label = b.payMethod }
      else { key = unit === 'day' ? dayOf(b.createdAt) : monthOf(b.createdAt); label = key }
      if (!m.has(key)) m.set(key, empty(key, label))
      add(m.get(key)!, b)
    }
    const arr = [...m.values()]
    return view === 'period' ? arr.sort((a, b) => a.key.localeCompare(b.key)) : arr.sort((a, b) => b.net - a.net)
  }, [rows, view, unit, perfMap])

  const viewLabel = view === 'perf' ? '공연' : view === 'pay' ? '결제수단' : unit === 'day' ? '일자' : '월'
  const cols: Col<Agg>[] = [
    { key: 'label', header: viewLabel, sort: r => r.key, render: r => <span className="font-semibold">{r.label}</span> },
    { key: 'cnt', header: '결제건수', align: 'right', sort: r => r.cnt, render: r => num(r.cnt) },
    { key: 'seats', header: '유효매수', align: 'right', sort: r => r.seats, render: r => num(r.seats) },
    { key: 'gross', header: '총매출', align: 'right', sort: r => r.gross, render: r => won(r.gross) },
    { key: 'cancel', header: '취소', align: 'right', sort: r => r.cancel, render: r => <span className="text-coral-500">-{won(r.cancel)}</span> },
    { key: 'net', header: '순매출', align: 'right', sort: r => r.net, render: r => <b>{won(r.net)}</b> },
    { key: 'fee', header: '예매수수료', align: 'right', sort: r => r.fee, render: r => won(r.fee) },
    { key: 'share', header: '비중', align: 'right', sort: r => r.net, render: r => pct(r.net, total.net) },
  ]

  return (
    <div className="space-y-4">
      <FilterBar onSearch={() => setF(draft)} onReset={() => { const d = { from: addDays(TODAY, -90), to: TODAY, perfId: '' }; setDraft(d); setF(d) }}>
        <Field label="결제기간" className="sm:col-span-2"><DateRange from={draft.from} to={draft.to} onChange={(from, to) => setDraft({ ...draft, from, to })} /></Field>
        <Field label="공연">
          <select className="input" value={draft.perfId} onChange={e => setDraft({ ...draft, perfId: e.target.value })}>
            <option value="">전체 공연</option>
            {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="집계 기준" hint="결제일 기준 · 입금대기 제외">
          <div className="pt-1 text-sm text-ink">순매출 = 판매가 − 취소 − 쿠폰할인</div>
        </Field>
      </FilterBar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="총매출" value={won(total.gross)} sub={`${num(total.cnt)}건 결제`} icon={<ReceiptText size={18} />} />
        <Kpi label="취소금액" value={won(total.cancel)} sub={`취소율 ${pct(total.cancel, total.gross)}`} icon={<RotateCcw size={18} />} tone="coral" />
        <Kpi label="순매출" value={won(total.net)} sub={`유효 ${num(total.seats)}매`} icon={<Wallet size={18} />} tone="mint" />
        <Kpi label="예매수수료" value={won(total.fee)} sub="매당 1,000원 (현장 면제)" icon={<Banknote size={18} />} tone="sun" />
      </div>

      <Card
        title="매출 현황"
        sub={`${f.from || '전체'} ~ ${f.to || '전체'} · ${f.perfId ? perfMap.get(f.perfId)?.title : '전체 공연'}`}
        actions={<>
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'perf', label: '공연별' }, { value: 'pay', label: '결제수단별' }, { value: 'period', label: '기간별' }]} />
          {view === 'period' && <Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'day', label: '일' }, { value: 'month', label: '월' }]} />}
          <ExportButtons filename={`매출현황_${viewLabel}별`} count={grouped.length}
            getRows={() => [[viewLabel, '결제건수', '유효매수', '총매출', '취소', '순매출', '예매수수료'], ...grouped.map(r => [r.label, r.cnt, r.seats, r.gross, r.cancel, r.net, r.fee]), ['합계', total.cnt, total.seats, total.gross, total.cancel, total.net, total.fee]]} />
        </>}
      >
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            {view === 'pay' ? (
              <ChartBox height={280} title="결제수단별 순매출 비중">
                <PieChart>
                  <Pie data={grouped} dataKey="net" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {grouped.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ChartBox>
            ) : view === 'period' ? (
              <ChartBox height={280} title={`${unit === 'day' ? '일별' : '월별'} 매출 추이`}>
                <ComposedChart data={grouped}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={axisTick} tickFormatter={v => (unit === 'day' ? String(v).slice(5) : v)} minTickGap={12} />
                  <YAxis tick={axisTick} tickFormatter={short} width={48} />
                  <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="net" name="순매출" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                  <Line dataKey="cancel" name="취소" stroke={CHART_COLORS[3]} dot={false} strokeWidth={2} />
                </ComposedChart>
              </ChartBox>
            ) : (
              <ChartBox height={280} title="공연별 매출 구성">
                <BarChart data={grouped} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" tick={axisTick} tickFormatter={short} />
                  <YAxis type="category" dataKey="label" tick={axisTick} width={110} />
                  <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="net" name="순매출" stackId="a" fill={CHART_COLORS[0]} />
                  <RBar dataKey="cancel" name="취소" stackId="a" fill={CHART_COLORS[3]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ChartBox>
            )}
          </div>
          <div className="min-w-0 xl:col-span-3">
            <DataTable columns={cols} rows={grouped} rowKey={r => r.key} pageSize={view === 'period' ? 20 : 10} maxHeight="340px" dense
              initialSort={view === 'period' ? undefined : { key: 'net', dir: 'desc' }} />
            <div className="mt-2 flex flex-wrap justify-end gap-x-5 gap-y-1 rounded-lg bg-paper px-3 py-2 text-xs">
              <span>합계 <b>{num(total.cnt)}</b>건</span>
              <span>총매출 <b>{won(total.gross)}</b></span>
              <span className="text-coral-500">취소 -{won(total.cancel)}</span>
              <span>순매출 <b className="text-brand-600">{won(total.net)}</b></span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
