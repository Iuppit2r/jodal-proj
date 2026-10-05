import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Eye, LogOut, UserPlus, Users } from 'lucide-react'
import { Card, DataTable, ExportButtons, Kpi, Segmented, type Col } from '../../ui'
import { TODAY, num, pct } from '../../lib'
import { fmtSec, sumPoints, traffic, type Gran, type TPoint } from './fake'

const GRAN: { value: Gran; label: string }[] = [
  { value: 'hour', label: '시간대별' }, { value: 'day', label: '일별' }, { value: 'month', label: '월별' }, { value: 'year', label: '연도별' },
]
const PERIOD: Record<Gran, string> = { hour: `${TODAY} 기준 최근 7일 시간대 평균`, day: '최근 30일', month: '최근 12개월', year: '2022 ~ 2026' }
const tick = { fontSize: 11, fill: '#5b6270' }
const yfmt = (v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : v.toLocaleString())

export default function Traffic() {
  const [g, setG] = useState<Gran>('day')
  const data = useMemo(() => traffic(g), [g])
  const s = useMemo(() => sumPoints(data), [data])
  const peak = data.reduce((a, p) => (p.visitors > a.visitors ? p : a), data[0])

  const cols: Col<TPoint>[] = [
    { key: 'label', header: g === 'hour' ? '시간' : g === 'day' ? '일자' : g === 'month' ? '월' : '연도', render: p => p.key, sort: p => p.key },
    { key: 'visitors', header: '방문자', align: 'right', render: p => num(p.visitors), sort: p => p.visitors },
    { key: 'pageviews', header: '페이지뷰', align: 'right', render: p => num(p.pageviews), sort: p => p.pageviews },
    { key: 'ppv', header: '방문당 PV', align: 'right', render: p => (p.pageviews / p.visitors).toFixed(2), sort: p => p.pageviews / p.visitors },
    { key: 'newV', header: '신규', align: 'right', render: p => num(p.newV), sort: p => p.newV },
    { key: 'returning', header: '재방문', align: 'right', render: p => num(p.returning), sort: p => p.returning },
    { key: 'avg', header: '평균 체류', align: 'right', render: p => fmtSec(p.avgSec), sort: p => p.avgSec },
    { key: 'bounce', header: '이탈률', align: 'right', render: p => `${p.bounce}%`, sort: p => p.bounce },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented value={g} onChange={setG} options={GRAN} />
        <span className="text-xs text-muted">집계 기간: {PERIOD[g]} · 매일 03:00 웹로그 집계 (GA4 연동 기준)</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label={g === 'hour' ? '일 평균 방문자' : '방문자 수'} value={num(s.visitors)} sub={`최고 ${peak.label} ${num(peak.visitors)}명`} icon={<Users size={16} />} />
        <Kpi label="페이지뷰" value={num(s.pageviews)} sub={`방문당 ${(s.pageviews / Math.max(1, s.visitors)).toFixed(2)}페이지`} icon={<Eye size={16} />} tone="mint" />
        <Kpi label="신규 방문 비율" value={pct(s.newV, s.visitors)} sub={`신규 ${num(s.newV)} · 재방문 ${num(s.returning)}`} icon={<UserPlus size={16} />} tone="sun" />
        <Kpi label="평균 체류시간" value={fmtSec(s.avgSec)} icon={<Clock size={16} />} tone="ink" />
        <Kpi label="이탈률" value={`${s.bounce.toFixed(1)}%`} sub="단일 페이지 방문 비율" icon={<LogOut size={16} />} tone="coral" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="방문자 · 페이지뷰 추이" sub={g === 'day' ? '10/1 새 홈페이지 오픈 이후 방문자 약 1.7배 증가' : PERIOD[g]}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2647c4" stopOpacity={0.35} /><stop offset="1" stopColor="#2647c4" stopOpacity={0} /></linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1fb592" stopOpacity={0.25} /><stop offset="1" stopColor="#1fb592" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#eef0f4" vertical={false} />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={14} />
              <YAxis yAxisId="v" tick={tick} tickLine={false} axisLine={false} tickFormatter={yfmt} />
              <YAxis yAxisId="p" orientation="right" tick={tick} tickLine={false} axisLine={false} tickFormatter={yfmt} />
              <Tooltip formatter={(v) => num(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="p" type="monotone" dataKey="pageviews" name="페이지뷰" stroke="#1fb592" fill="url(#gp)" strokeWidth={2} />
              <Area yAxisId="v" type="monotone" dataKey="visitors" name="방문자" stroke="#2647c4" fill="url(#gv)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="신규 vs 재방문" sub="방문자 유형별 구성">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f4" vertical={false} />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={14} />
              <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={yfmt} />
              <Tooltip formatter={(v) => num(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <RBar dataKey="newV" name="신규" stackId="a" fill="#f5b400" />
              <RBar dataKey="returning" name="재방문" stackId="a" fill="#2647c4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="상세 데이터" actions={
        <ExportButtons filename={`접속통계_${GRAN.find(x => x.value === g)!.label}`} count={data.length}
          getRows={() => [['구분', '방문자', '페이지뷰', '신규', '재방문', '평균체류(초)', '이탈률(%)'], ...data.map(p => [p.key, p.visitors, p.pageviews, p.newV, p.returning, p.avgSec, p.bounce])]} />
      }>
        <DataTable columns={cols} rows={data} rowKey={p => p.key} pageSize={g === 'hour' ? 50 : 20} dense maxHeight="420px" />
      </Card>
    </div>
  )
}
