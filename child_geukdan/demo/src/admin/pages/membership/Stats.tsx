import { useMemo, useState } from 'react'
import { Crown, Wallet, RefreshCw, CalendarX } from 'lucide-react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { won } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Kpi, PiiToggle, Segmented, krw, usePII, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY, addDays, pct } from '../../lib'
import type { Member } from '../../../data/types'
import { countByTier, usePaidMembers } from './util'

export default function Stats() {
  const tiers = useAdminLocal(s => s.tiers)
  const paid = usePaidMembers()
  const pii = usePII()
  const [tierF, setTierF] = useState('all')
  const tierMap = useMemo(() => new Map(tiers.map(t => [t.id, t])), [tiers])

  const s = useMemo(() => {
    const counts = countByTier(paid)
    const revenue = paid.reduce((a, m) => a + (tierMap.get(m.membership!.tierId)?.price ?? 0), 0)
    const auto = paid.filter(m => m.membership!.autoRenew).length
    const expiring = paid.filter(m => m.membership!.until <= addDays(TODAY, 180)).length
    const pie = tiers.map(t => ({ name: t.name, value: counts.get(t.id) ?? 0, color: t.color }))
    // 최근 12개월 가입 추이 (membership.since 기준)
    const months: string[] = []
    for (let i = 11; i >= 0; i--) { const d = new Date(TODAY); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }
    const monthly = months.map(mo => {
      const row: Record<string, string | number> = { month: mo.slice(2).replace('-', '.') }
      for (const t of tiers) row[t.id] = paid.filter(m => m.membership!.tierId === t.id && m.membership!.since.startsWith(mo)).length
      return row
    })
    return { counts, revenue, auto, expiring, pie, monthly }
  }, [paid, tiers, tierMap])

  const rows = useMemo(() => (tierF === 'all' ? paid : paid.filter(m => m.membership!.tierId === tierF)), [paid, tierF])

  const cols: Col<Member>[] = [
    { key: 'loginId', header: '아이디', sort: m => m.loginId },
    { key: 'name', header: '성명', render: m => <span className="font-semibold">{pii.name(m.name)}</span>, sort: m => m.name },
    { key: 'phone', header: '연락처', render: m => pii.phone(m.phone) },
    { key: 'tier', header: '등급', render: m => { const t = tierMap.get(m.membership!.tierId); return t ? <span className="chip text-white" style={{ background: t.color }}>{t.name}</span> : '-' }, sort: m => m.membership!.tierId },
    { key: 'since', header: '가입일', render: m => m.membership!.since, sort: m => m.membership!.since },
    { key: 'until', header: '만료일', render: m => m.membership!.until, sort: m => m.membership!.until },
    { key: 'auto', header: '자동갱신', align: 'center', render: m => m.membership!.autoRenew ? <span className="text-xs font-bold text-mint-500">ON</span> : <span className="text-xs text-muted">OFF</span>, sort: m => (m.membership!.autoRenew ? 1 : 0) },
    { key: 'price', header: '연회비', align: 'right', render: m => won(tierMap.get(m.membership!.tierId)?.price ?? 0), sort: m => tierMap.get(m.membership!.tierId)?.price ?? 0 },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Kpi label="총 유료회원" value={`${paid.length.toLocaleString()}명`} icon={<Crown size={18} />} />
        {tiers.map(t => (
          <Kpi key={t.id} label={`${t.name} 회원`} value={`${(s.counts.get(t.id) ?? 0).toLocaleString()}명`} sub={pct(s.counts.get(t.id) ?? 0, paid.length)}
            icon={<span className="h-3 w-3 rounded-full" style={{ background: t.color }} />} tone="ink" onClick={() => setTierF(t.id)} />
        ))}
        <Kpi label="연회비 매출" value={`${krw(s.revenue)}원`} sub={won(s.revenue)} icon={<Wallet size={18} />} tone="mint" />
        <Kpi label="자동갱신율" value={pct(s.auto, paid.length)} sub={`${s.auto}명 / ${paid.length}명`} icon={<RefreshCw size={18} />} tone="sun" />
        <Kpi label="6개월 내 만료" value={`${s.expiring}명`} sub="갱신 안내 대상" icon={<CalendarX size={18} />} tone="coral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="등급별 회원 구성">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={s.pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} label={({ name, value }) => `${name} ${value}명`}>
                {s.pie.map(p => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}명`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="월별 가입 추이" sub="멤버십 가입일 기준 · 최근 12개월">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => `${v}명`} cursor={{ fill: '#f3f5fa' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {tiers.map(t => <RBar key={t.id} dataKey={t.id} name={t.name} stackId="a" fill={t.color} maxBarSize={40} />)}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title={`유료회원 목록 (${rows.length}명)`}
        actions={<>
          <Segmented size="sm" value={tierF} onChange={setTierF} options={[{ value: 'all', label: '전체' }, ...tiers.map(t => ({ value: t.id, label: t.name }))]} />
          <PiiToggle />
          <ExportButtons filename="유료회원목록" count={rows.length} getRows={() => [['아이디', '성명', '연락처', '등급', '가입일', '만료일', '자동갱신', '연회비'],
            ...rows.map(m => [m.loginId, pii.name(m.name), pii.phone(m.phone), tierMap.get(m.membership!.tierId)?.name ?? '', m.membership!.since, m.membership!.until, m.membership!.autoRenew ? 'Y' : 'N', tierMap.get(m.membership!.tierId)?.price ?? 0])]} />
        </>}>
        <DataTable columns={cols} rows={rows} rowKey={m => m.id} dense initialSort={{ key: 'since', dir: 'desc' }} />
      </Card>
    </div>
  )
}
