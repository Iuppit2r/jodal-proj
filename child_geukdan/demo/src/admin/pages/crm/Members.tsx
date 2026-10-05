import { useMemo, useState } from 'react'
import { Users, UserCheck, Moon, Crown, Megaphone } from 'lucide-react'
import { ageOf, useStore } from '../../../store'
import { won } from '../../../lib/format'
import { Card, DataTable, DateRange, ExportButtons, Field, FilterBar, Kpi, MultiCheck, PiiToggle, Status, usePII, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { pct } from '../../lib'
import type { Member } from '../../../data/types'
import MemberDetail from './MemberDetail'
import { statOf, tierOf, useMemberStats } from './shared'

const STATUS = ['정상', '휴면', '탈퇴'] as const
const TYPES = ['개인', '어린이'] as const
interface Filter { q: string; status: Member['status'][]; type: Member['type'][]; tier: string; from: string; to: string; mkt: 'all' | 'Y' | 'N' }
const INIT: Filter = { q: '', status: ['정상', '휴면'], type: [], tier: 'all', from: '', to: '', mkt: 'all' }

export default function Members() {
  const members = useStore(s => s.members)
  const tiers = useAdminLocal(s => s.tiers)
  const stats = useMemberStats()
  const pii = usePII()
  const [draft, setDraft] = useState<Filter>(INIT)
  const [f, setF] = useState<Filter>(INIT)
  const [open, setOpen] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    const qd = q.replace(/-/g, '')
    return members.filter(m => {
      if (q && !(m.name.includes(q) || m.loginId.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (qd && m.phone.replace(/-/g, '').includes(qd)))) return false
      if (f.status.length && !f.status.includes(m.status)) return false
      if (f.type.length && !f.type.includes(m.type)) return false
      if (f.tier === 'none' && m.membership) return false
      if (f.tier === 'paid' && !m.membership) return false
      if (f.tier !== 'all' && f.tier !== 'none' && f.tier !== 'paid' && m.membership?.tierId !== f.tier) return false
      if (f.from && m.joinedAt < f.from) return false
      if (f.to && m.joinedAt > f.to) return false
      if (f.mkt === 'Y' && !m.marketing) return false
      if (f.mkt === 'N' && m.marketing) return false
      return true
    })
  }, [members, f])

  const kpi = useMemo(() => {
    const live = members.filter(m => m.status !== '탈퇴')
    return {
      total: live.length,
      normal: live.filter(m => m.status === '정상').length,
      dormant: live.filter(m => m.status === '휴면').length,
      paid: live.filter(m => m.membership).length,
      mkt: live.filter(m => m.marketing).length,
    }
  }, [members])

  const cols: Col<Member>[] = [
    { key: 'id', header: '회원번호', render: m => <span className="font-mono text-xs text-muted">{m.id}</span>, sort: m => Number(m.id.replace(/\D/g, '')) || 0 },
    { key: 'loginId', header: '아이디', sort: m => m.loginId },
    { key: 'name', header: '성명', render: m => <span className="font-semibold">{pii.name(m.name)}</span>, sort: m => m.name },
    { key: 'phone', header: '연락처', render: m => <span className="tabular-nums">{pii.phone(m.phone)}</span> },
    { key: 'email', header: '이메일', render: m => pii.email(m.email) },
    { key: 'type', header: '유형', render: m => m.type, sort: m => m.type },
    { key: 'age', header: '연령', align: 'right', render: m => `${ageOf(m.birth)}세`, sort: m => ageOf(m.birth) },
    { key: 'region', header: '지역', sort: m => m.region },
    { key: 'tier', header: '멤버십', render: m => { const t = tierOf(m, tiers); return t ? <span className="chip text-white" style={{ background: t.color }}>{t.name}</span> : <span className="text-xs text-muted">-</span> }, sort: m => m.membership?.tierId ?? '' },
    { key: 'joined', header: '가입일', render: m => m.joinedAt, sort: m => m.joinedAt },
    { key: 'last', header: '최종로그인', render: m => m.lastLoginAt, sort: m => m.lastLoginAt },
    { key: 'cnt', header: '예매', align: 'right', render: m => `${statOf(stats, m.id).count}건`, sort: m => statOf(stats, m.id).count },
    { key: 'spend', header: '구매금액', align: 'right', render: m => won(statOf(stats, m.id).spend), sort: m => statOf(stats, m.id).spend },
    { key: 'mkt', header: '마케팅', align: 'center', render: m => m.marketing ? <span className="text-xs font-bold text-mint-500">동의</span> : <span className="text-xs text-muted">미동의</span>, sort: m => (m.marketing ? 1 : 0) },
    { key: 'status', header: '상태', render: m => <Status s={m.status} />, sort: m => m.status },
  ]

  const exportRows = () => [
    ['회원번호', '아이디', '성명', '연락처', '이메일', '유형', '연령', '지역', '멤버십', '가입일', '최종로그인', '예매건수', '구매금액', '마케팅동의', '상태'],
    ...rows.map(m => {
      const s = statOf(stats, m.id)
      return [m.id, m.loginId, pii.name(m.name), pii.phone(m.phone), pii.email(m.email), m.type, ageOf(m.birth), m.region, tierOf(m, tiers)?.name ?? '-', m.joinedAt, m.lastLoginAt, s.count, s.spend, m.marketing ? 'Y' : 'N', m.status]
    }),
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="전체 회원" value={`${kpi.total.toLocaleString()}명`} icon={<Users size={18} />} sub="탈퇴 제외" />
        <Kpi label="정상" value={`${kpi.normal.toLocaleString()}명`} icon={<UserCheck size={18} />} tone="mint" onClick={() => { const n = { ...INIT, status: ['정상'] as Member['status'][] }; setDraft(n); setF(n) }} />
        <Kpi label="휴면" value={`${kpi.dormant.toLocaleString()}명`} icon={<Moon size={18} />} tone="sun" onClick={() => { const n = { ...INIT, status: ['휴면'] as Member['status'][] }; setDraft(n); setF(n) }} />
        <Kpi label="유료회원" value={`${kpi.paid.toLocaleString()}명`} icon={<Crown size={18} />} tone="brand" sub={pct(kpi.paid, kpi.total)} onClick={() => { const n = { ...INIT, tier: 'paid' }; setDraft(n); setF(n) }} />
        <Kpi label="마케팅 수신동의" value={`${kpi.mkt.toLocaleString()}명`} icon={<Megaphone size={18} />} tone="coral" sub={pct(kpi.mkt, kpi.total)} />
      </div>

      <FilterBar onSearch={() => setF(draft)} onReset={() => { setDraft(INIT); setF(INIT) }}>
        <Field label="검색어" hint="성명·아이디·연락처·이메일">
          <input className="input" value={draft.q} onChange={e => setDraft({ ...draft, q: e.target.value })} placeholder="예) 김시연, demo, 010-1234" />
        </Field>
        <Field label="회원 상태"><MultiCheck options={STATUS} value={draft.status} onChange={v => setDraft({ ...draft, status: v })} /></Field>
        <Field label="회원 유형"><MultiCheck options={TYPES} value={draft.type} onChange={v => setDraft({ ...draft, type: v })} /></Field>
        <Field label="멤버십 등급">
          <select className="input" value={draft.tier} onChange={e => setDraft({ ...draft, tier: e.target.value })}>
            <option value="all">전체</option><option value="paid">유료회원 전체</option>
            {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="none">없음 (무료회원)</option>
          </select>
        </Field>
        <Field label="가입일" className="sm:col-span-2"><DateRange from={draft.from} to={draft.to} onChange={(a, b) => setDraft({ ...draft, from: a, to: b })} /></Field>
        <Field label="마케팅 수신동의">
          <select className="input" value={draft.mkt} onChange={e => setDraft({ ...draft, mkt: e.target.value as Filter['mkt'] })}>
            <option value="all">전체</option><option value="Y">동의</option><option value="N">미동의</option>
          </select>
        </Field>
      </FilterBar>

      <Card title={`회원 목록 (${rows.length.toLocaleString()}명)`} sub="행을 클릭하면 회원 상세(구매이력·쿠폰·멤버십)를 확인할 수 있습니다."
        actions={<><PiiToggle /><ExportButtons filename="회원목록" count={rows.length} getRows={exportRows} /></>}>
        <DataTable columns={cols} rows={rows} rowKey={m => m.id} onRowClick={m => setOpen(m.id)} initialSort={{ key: 'joined', dir: 'desc' }} dense
          rowClass={m => (m.status === '탈퇴' ? 'opacity-50' : undefined)} />
      </Card>
      <MemberDetail memberId={open} onClose={() => setOpen(null)} />
    </div>
  )
}
