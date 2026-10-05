import { useMemo, useState } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Clock, Theater, UserCheck, Users } from 'lucide-react'
import type { Booking } from '../../../data/types'
import { Card, DataTable, ExportButtons, Kpi, Segmented, CHART_COLORS, type Col } from '../../ui'
import { TODAY, num, pct, usePerfMap, useRoundMap } from '../../lib'
import { ChartBox, axisTick, gridProps, tipStyle, cntFmt, type RangeFilter } from './common'

type Basis = 'all' | 'used'
interface PerfRow { id: string; title: string; genre: string; rounds: number; aud: number; used: number; past: number }

/** 관람객 통계 (SFR-TC-016) – 공연일 기준 */
export default function AudienceReport({ all, f }: { all: Booking[]; f: RangeFilter }) {
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const [basis, setBasis] = useState<Basis>('all')

  const agg = useMemo(() => {
    const perf = new Map<string, PerfRow & { roundSet: Set<string> }>()
    const genre = new Map<string, number>()
    const time = new Map<string, number>()
    const month = new Map<string, { m: string; aud: number; used: number }>()
    let aud = 0, used = 0, pastLive = 0
    for (const b of all) {
      if (b.status === '취소완료') continue
      if (f.perfId && b.perfId !== f.perfId) continue
      const r = roundMap.get(b.roundId)
      if (!r) continue
      if (f.from && r.date < f.from) continue
      if (f.to && r.date > f.to) continue
      const live = b.seats.filter(s => !s.cancelled)
      const u = live.filter(s => s.used).length
      const n = basis === 'used' ? u : live.length
      if (!live.length) continue
      const p = perfMap.get(b.perfId)
      const pr = perf.get(b.perfId) ?? { id: b.perfId, title: p?.title ?? b.perfId, genre: p?.genre ?? '-', rounds: 0, aud: 0, used: 0, past: 0, roundSet: new Set<string>() }
      pr.roundSet.add(r.id)
      pr.aud += live.length; pr.used += u
      if (r.date < TODAY) pr.past += live.length
      perf.set(b.perfId, pr)
      aud += live.length; used += u
      if (r.date < TODAY) pastLive += live.length
      if (n) {
        genre.set(pr.genre, (genre.get(pr.genre) ?? 0) + n)
        time.set(r.time, (time.get(r.time) ?? 0) + n)
      }
      const mk = r.date.slice(0, 7)
      const mo = month.get(mk) ?? { m: mk, aud: 0, used: 0 }
      mo.aud += live.length; mo.used += u
      month.set(mk, mo)
    }
    const perfRows: PerfRow[] = [...perf.values()].map(({ roundSet, ...x }) => ({ ...x, rounds: roundSet.size }))
    return {
      perfRows: perfRows.sort((a, b) => b.aud - a.aud),
      genre: [...genre.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      time: [...time.entries()].map(([t, value]) => ({ t, value })).sort((a, b) => a.t.localeCompare(b.t)),
      month: [...month.values()].sort((a, b) => a.m.localeCompare(b.m)),
      aud, used, pastLive,
    }
  }, [all, f, roundMap, perfMap, basis])

  const val = (r: PerfRow) => (basis === 'used' ? r.used : r.aud)
  const cols: Col<PerfRow>[] = [
    { key: 'title', header: '공연', sort: r => r.title, render: r => <span className="font-semibold">{r.title}</span> },
    { key: 'genre', header: '장르', sort: r => r.genre },
    { key: 'rounds', header: '회차', align: 'right', sort: r => r.rounds, render: r => num(r.rounds) },
    { key: 'aud', header: '예매 관객', align: 'right', sort: r => r.aud, render: r => num(r.aud) },
    { key: 'used', header: '입장 관객', align: 'right', sort: r => r.used, render: r => num(r.used) },
    { key: 'rate', header: '입장률(종료회차)', align: 'right', sort: r => (r.past ? r.used / r.past : 0), render: r => (r.past ? pct(r.used, r.past) : <span className="text-muted">공연 전</span>) },
    { key: 'avg', header: '회차당 평균', align: 'right', sort: r => val(r) / Math.max(1, r.rounds), render: r => num(Math.round(val(r) / Math.max(1, r.rounds))) },
  ]
  const label = basis === 'used' ? '입장 관객' : '예매 관객'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="예매 관객 (유효 좌석)" value={`${num(agg.aud)}명`} icon={<Users size={18} />} />
        <Kpi label="입장 관객 (검표)" value={`${num(agg.used)}명`} sub={`종료 회차 입장률 ${pct(agg.used, agg.pastLive)}`} icon={<UserCheck size={18} />} tone="mint" />
        <Kpi label="대상 공연" value={`${agg.perfRows.length}편`} sub={`${agg.perfRows.reduce((a, r) => a + r.rounds, 0)}회차`} icon={<Theater size={18} />} tone="sun" />
        <Kpi label="최다 관람 시간대" value={agg.time.slice().sort((a, b) => b.value - a.value)[0]?.t ?? '-'} sub={label + ' 기준'} icon={<Clock size={18} />} tone="ink" />
      </div>

      <Card title="공연별 관람객" sub={`공연일 기준 ${f.from || '전체'} ~ ${f.to || '전체'}`}
        actions={<>
          <Segmented size="sm" value={basis} onChange={setBasis} options={[{ value: 'all', label: '예매 기준' }, { value: 'used', label: '입장(검표) 기준' }]} />
          <ExportButtons filename="관람객통계_공연별" count={agg.perfRows.length}
            getRows={() => [['공연', '장르', '회차', '예매관객', '입장관객', '입장률'], ...agg.perfRows.map(r => [r.title, r.genre, r.rounds, r.aud, r.used, r.past ? pct(r.used, r.past) : '-'])]} />
        </>}>
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <ChartBox height={240}>
              <BarChart data={agg.perfRows} layout="vertical">
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" tick={axisTick} />
                <YAxis type="category" dataKey="title" tick={axisTick} width={110} />
                <Tooltip formatter={v => cntFmt(v) + '명'} contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RBar dataKey="aud" name="예매 관객" fill={CHART_COLORS[0]} radius={[0, 3, 3, 0]} />
                <RBar dataKey="used" name="입장 관객" fill={CHART_COLORS[1]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ChartBox>
          </div>
          <div className="min-w-0 xl:col-span-3"><DataTable columns={cols} rows={agg.perfRows} rowKey={r => r.id} dense /></div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="장르별 관람객" sub={label}>
          <ChartBox height={240}>
            <PieChart>
              <Pie data={agg.genre} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2}>
                {agg.genre.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => cntFmt(v) + '명'} contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartBox>
        </Card>
        <Card title="시간대별 관람객" sub={`공연 시작시각 · ${label}`}>
          <ChartBox height={240}>
            <BarChart data={agg.time}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="t" tick={axisTick} />
              <YAxis tick={axisTick} width={40} />
              <Tooltip formatter={v => cntFmt(v) + '명'} contentStyle={tipStyle} />
              <RBar dataKey="value" name={label} fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartBox>
        </Card>
        <Card title="월별 관람객 추이" sub="공연월 기준">
          <ChartBox height={240}>
            <LineChart data={agg.month}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="m" tick={axisTick} />
              <YAxis tick={axisTick} width={40} />
              <Tooltip formatter={v => cntFmt(v) + '명'} contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="aud" name="예매 관객" stroke={CHART_COLORS[0]} strokeWidth={2} />
              <Line dataKey="used" name="입장 관객" stroke={CHART_COLORS[1]} strokeWidth={2} />
            </LineChart>
          </ChartBox>
        </Card>
      </div>
    </div>
  )
}
