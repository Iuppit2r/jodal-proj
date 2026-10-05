import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { Bar, CHART_COLORS, Card, DataTable, ExportButtons, type Col } from '../../ui'
import { num, pct } from '../../lib'
import { devices, sources, type Source } from './fake'

const GROUP_COLOR: Record<Source['group'], string> = { 검색엔진: '#2647c4', SNS: '#f2664b', '직접 접속': '#1fb592', '외부 링크': '#f5b400' }

function Donut({ data, center, sub }: { data: { name: string; value: number; color: string }[]; center: string; sub: string }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
            {data.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v) => num(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div><div className="text-lg font-extrabold tabular-nums">{center}</div><div className="text-[11px] text-muted">{sub}</div></div>
      </div>
    </div>
  )
}

export default function Sources() {
  const rows = useMemo(() => sources(), [])
  const total = rows.reduce((a, r) => a + r.visits, 0)
  const groups = useMemo(() => (Object.keys(GROUP_COLOR) as Source['group'][]).map(g => ({
    name: g, value: rows.filter(r => r.group === g).reduce((a, r) => a + r.visits, 0), color: GROUP_COLOR[g],
  })), [rows])
  const detail = useMemo(() => [...rows].sort((a, b) => b.visits - a.visits).map((r, i) => ({ ...r, color: CHART_COLORS[i % CHART_COLORS.length] })), [rows])
  const max = Math.max(...rows.map(r => r.visits))
  const dev = devices()

  const cols: Col<Source>[] = [
    { key: 'group', header: '구분', render: r => <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[r.group] }} />{r.group}</span>, sort: r => r.group },
    { key: 'name', header: '유입 경로', render: r => <b>{r.name}</b>, sort: r => r.name },
    { key: 'visits', header: '방문 수', align: 'right', render: r => num(r.visits), sort: r => r.visits },
    { key: 'share', header: '비율', render: r => <div className="flex min-w-36 items-center gap-2"><Bar value={r.visits} max={max} color={GROUP_COLOR[r.group]} /><span className="w-12 text-right text-xs tabular-nums">{pct(r.visits, total)}</span></div>, sort: r => r.visits },
    { key: 'conv', header: '예매 전환율', align: 'right', render: r => `${r.conv}%`, sort: r => r.conv },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="유입 경로 구성" sub="최근 30일 · 세션 기준">
          <Donut data={groups} center={num(total)} sub="총 방문" />
          <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {groups.map(g => <li key={g.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />{g.name}<b className="ml-auto tabular-nums">{pct(g.value, total)}</b></li>)}
          </ul>
        </Card>
        <Card title="세부 채널 TOP" sub="방문 수 상위 채널">
          <Donut data={detail.slice(0, 6).map(d => ({ name: d.name, value: d.visits, color: d.color }))} center={detail[0].name} sub={`1위 ${pct(detail[0].visits, total)}`} />
          <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {detail.slice(0, 6).map(d => <li key={d.name} className="flex items-center gap-1.5 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />{d.name}</li>)}
          </ul>
        </Card>
        <Card title="접속 기기" sub="반응형 웹 · 모바일 비중 확대">
          <Donut data={dev} center={`${dev[0].value}%`} sub="모바일" />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {dev.map((d, i) => (
              <div key={d.name} className="rounded-lg bg-paper py-2">
                <span className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: d.color }}>{[<Smartphone size={14} key="m" />, <Monitor size={14} key="p" />, <Tablet size={14} key="t" />][i]}</span>
                <div className="font-semibold">{d.name}</div><div className="font-bold tabular-nums">{d.value}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="유입 경로별 상세" actions={
        <ExportButtons filename="접속경로통계" count={rows.length} getRows={() => [['구분', '유입경로', '방문수', '비율(%)', '예매전환율(%)'], ...detail.map(r => [r.group, r.name, r.visits, ((r.visits / total) * 100).toFixed(1), r.conv])]} />
      }>
        <DataTable columns={cols} rows={detail} rowKey={r => r.name} initialSort={{ key: 'visits', dir: 'desc' }} dense />
      </Card>
    </div>
  )
}
