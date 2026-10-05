import { useMemo } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bar, Card, DataTable, ExportButtons, type Col } from '../../ui'
import { num } from '../../lib'
import { fmtSec, topPages, type PageStat } from './fake'

export default function Pages() {
  const rows = useMemo(() => topPages(), [])
  const maxPv = rows[0].pv
  const maxSec = Math.max(...rows.map(r => r.avgSec))
  const cols: Col<PageStat>[] = [
    { key: 'rank', header: '순위', align: 'center', render: r => { const i = rows.indexOf(r); return <span className={i < 3 ? 'font-extrabold text-brand-600' : 'text-muted'}>{i + 1}</span> } },
    { key: 'title', header: '페이지', render: r => <div><div className="font-semibold">{r.title}</div><div className="font-mono text-[11px] text-muted">/site{r.path === '/' ? '' : r.path}</div></div>, sort: r => r.title },
    { key: 'pv', header: '페이지뷰', render: r => <div className="flex min-w-40 items-center gap-2"><Bar value={r.pv} max={maxPv} /><span className="w-16 text-right text-xs font-semibold tabular-nums">{num(r.pv)}</span></div>, sort: r => r.pv },
    { key: 'uv', header: '순방문자', align: 'right', render: r => num(r.uv), sort: r => r.uv },
    { key: 'avg', header: '평균 체류시간', render: r => <div className="flex min-w-36 items-center gap-2"><Bar value={r.avgSec} max={maxSec} color="#1fb592" /><span className="w-16 text-right text-xs tabular-nums">{fmtSec(r.avgSec)}</span></div>, sort: r => r.avgSec },
    { key: 'bounce', header: '이탈률', render: r => <div className="flex min-w-32 items-center gap-2"><Bar value={r.bounce} max={100} color={r.bounce > 50 ? '#f2664b' : '#f5b400'} /><span className="w-12 text-right text-xs tabular-nums">{r.bounce}%</span></div>, sort: r => r.bounce },
  ]
  return (
    <div className="space-y-4">
      <Card title="인기 페이지 TOP 10" sub="최근 30일 페이지뷰 기준">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#eef0f4" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#5b6270' }} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(Number(v) / 1000)}k`} />
            <YAxis type="category" dataKey="title" width={170} tick={{ fontSize: 11, fill: '#16181d' }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [num(Number(v)), '페이지뷰']} />
            <RBar dataKey="pv" fill="#2647c4" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="인기 페이지 TOP 15 상세" sub="예매 단계 페이지는 체류시간이 길고 이탈률이 낮은 것이 정상입니다."
        actions={<ExportButtons filename="인기페이지" count={rows.length} getRows={() => [['순위', '페이지', '경로', '페이지뷰', '순방문자', '평균체류(초)', '이탈률(%)'], ...rows.map((r, i) => [i + 1, r.title, r.path, r.pv, r.uv, r.avgSec, r.bounce])]} />}>
        <DataTable columns={cols} rows={rows} rowKey={r => r.path} dense maxHeight="none" />
      </Card>
    </div>
  )
}
