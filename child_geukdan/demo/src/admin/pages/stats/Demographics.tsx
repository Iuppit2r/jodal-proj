import { useMemo } from 'react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Baby, Crown, UserCheck, Users } from 'lucide-react'
import { ageOf, useStore } from '../../../store'
import * as M from '../../../data/mock'
import { CHART_COLORS, Card, ExportButtons, Kpi, Note } from '../../ui'
import { TODAY, num, pct } from '../../lib'

const BANDS = ['영유아', '어린이', '청소년', '20대', '30대', '40대', '50대+'] as const
const band = (a: number) => (a <= 6 ? '영유아' : a <= 12 ? '어린이' : a <= 18 ? '청소년' : a < 30 ? '20대' : a < 40 ? '30대' : a < 50 ? '40대' : '50대+')
const tick = { fontSize: 11, fill: '#5b6270' }

export default function Demographics() {
  const members = useStore(s => s.members)
  const live = useMemo(() => members.filter(m => m.status !== '탈퇴'), [members])

  const ages = useMemo(() => {
    const c = Object.fromEntries(BANDS.map(b => [b, 0])) as Record<string, number>
    for (const m of live) c[band(ageOf(m.birth))]++
    return BANDS.map((b, i) => ({ name: b, value: c[b], color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [live])
  const regions = useMemo(() => {
    const c = new Map<string, number>()
    for (const m of live) c.set(m.region, (c.get(m.region) ?? 0) + 1)
    return [...c].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [live])
  const types = useMemo(() => {
    const tierName = (id?: string) => M.tiers.find(t => t.id === id)?.name ?? '일반'
    const t = new Map<string, number>()
    for (const m of live) { const k = m.membership ? `${tierName(m.membership.tierId)} 멤버십` : '일반 회원'; t.set(k, (t.get(k) ?? 0) + 1) }
    return {
      kind: [{ name: '개인(14세 이상)', value: live.filter(m => m.type === '개인').length, color: '#2647c4' }, { name: '어린이(보호자 동의)', value: live.filter(m => m.type === '어린이').length, color: '#f5b400' }],
      tier: [...t].map(([name, value], i) => ({ name, value, color: ['#1fb592', '#7c5cff', '#9ca3af'][i % 3] })).sort((a, b) => a.name.localeCompare(b.name)),
      status: [{ name: '정상', value: live.filter(m => m.status === '정상').length, color: '#2647c4' }, { name: '휴면', value: live.filter(m => m.status === '휴면').length, color: '#9ca3af' }],
    }
  }, [live])
  const joins = useMemo(() => {
    const c = new Map<string, number>()
    for (const m of members) c.set(m.joinedAt.slice(0, 7), (c.get(m.joinedAt.slice(0, 7)) ?? 0) + 1)
    const keys = [...c.keys()].sort()
    const out: { month: string; label: string; count: number; total: number }[] = []
    if (!keys.length) return out
    let [y, mo] = keys[0].split('-').map(Number)
    let total = 0
    const end = TODAY.slice(0, 7)
    for (;;) {
      const k = `${y}-${String(mo).padStart(2, '0')}`
      if (k > end) break
      total += c.get(k) ?? 0
      out.push({ month: k, label: `${String(y).slice(2)}.${String(mo).padStart(2, '0')}`, count: c.get(k) ?? 0, total })
      mo++; if (mo > 12) { mo = 1; y++ }
    }
    return out
  }, [members])
  const thisMonth = joins.find(j => j.month === TODAY.slice(0, 7))?.count ?? 0
  const paid = live.filter(m => m.membership).length

  const MiniPie = ({ data, title }: { data: { name: string; value: number; color: string }[]; title: string }) => (
    <div>
      <p className="mb-1 text-center text-xs font-bold text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} stroke="none">{data.map(d => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip /></PieChart>
      </ResponsiveContainer>
      <ul className="space-y-0.5 text-[11px]">
        {data.map(d => <li key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />{d.name}<b className="ml-auto tabular-nums">{d.value} ({pct(d.value, live.length, 0)})</b></li>)}
      </ul>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="전체 회원 (탈퇴 제외)" value={num(live.length)} icon={<Users size={16} />} />
        <Kpi label="유료 멤버십 회원" value={num(paid)} sub={pct(paid, live.length)} tone="mint" icon={<Crown size={16} />} />
        <Kpi label="어린이 회원" value={num(types.kind[1].value)} sub="만 14세 미만 · 보호자 동의" tone="sun" icon={<Baby size={16} />} />
        <Kpi label="이번 달 신규 가입" value={num(thisMonth)} sub={TODAY.slice(0, 7)} tone="ink" icon={<UserCheck size={16} />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="연령대별 회원 분포" sub="생년월일 기준 만 나이"
          actions={<ExportButtons filename="회원_연령대" count={ages.length} print={false} getRows={() => [['연령대', '회원수', '비율(%)'], ...ages.map(a => [a.name, a.value, ((a.value / Math.max(1, live.length)) * 100).toFixed(1)])]} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ages} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f4" vertical={false} />
              <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={false} />
              <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v}명`, '회원수']} />
              <RBar dataKey="value" radius={[4, 4, 0, 0]} barSize={34}>{ages.map(a => <Cell key={a.name} fill={a.color} />)}</RBar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="지역별 회원 분포" sub="회원 가입 시 입력 주소(시·도) 기준"
          actions={<ExportButtons filename="회원_지역" count={regions.length} print={false} getRows={() => [['지역', '회원수'], ...regions.map(r => [r.name, r.value])]} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f4" horizontal={false} />
              <XAxis type="number" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={50} tick={tick} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v}명`, '회원수']} />
              <RBar dataKey="value" fill="#1fb592" radius={[0, 4, 4, 0]} barSize={13} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card title="회원 유형">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniPie title="가입 유형" data={types.kind} />
            <MiniPie title="멤버십" data={types.tier} />
            <MiniPie title="계정 상태" data={types.status} />
          </div>
          <Note className="mt-4">성별 정보는 「개인정보 최소수집 원칙」에 따라 수집하지 않아 통계에서 제외됩니다. (n/a)</Note>
        </Card>
        <Card title="월별 가입 추이" sub="신규 가입(막대) · 누적 회원(선)"
          actions={<ExportButtons filename="월별가입추이" count={joins.length} print={false} getRows={() => [['월', '신규가입', '누적'], ...joins.map(j => [j.month, j.count, j.total])]} />}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={joins} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f4" vertical={false} />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis yAxisId="c" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis yAxisId="t" orientation="right" tick={tick} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <RBar yAxisId="c" dataKey="count" name="신규 가입" fill="#2647c4" radius={[3, 3, 0, 0]} />
              <Line yAxisId="t" dataKey="total" name="누적 회원" stroke="#f2664b" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
