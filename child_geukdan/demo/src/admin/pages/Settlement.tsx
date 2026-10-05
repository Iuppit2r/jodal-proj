import { useState } from 'react'
import { PageHeader, Tabs } from '../ui'
import { useAdminLocal } from '../adminStore'
import SalesTab from './settlement/SalesTab'
import SettleTab from './settlement/SettleTab'
import PgTab from './settlement/PgTab'
import FeeRefundTab from './settlement/FeeRefundTab'
import { DEFAULT_STATE } from './settlement/data'

const TABS = [
  { id: 'sales', label: '매출 현황', code: 'SFR-TC-014' },
  { id: 'settle', label: '정산 내역', code: 'SFR-TC-015' },
  { id: 'pg', label: 'PG 대사', code: 'SFR-TC-015' },
  { id: 'fee', label: '수수료·미사용 환불', code: 'SFR-TC-013' },
]

export default function Settlement() {
  const [tab, setTab] = useState('sales')
  const settle = useAdminLocal(s => s.settle)
  const pending = Object.keys(DEFAULT_STATE).concat(Object.keys(settle))
    .filter((id, i, a) => a.indexOf(id) === i)
    .filter(id => { const s = (settle[id] ?? DEFAULT_STATE[id]).status; return s === '정산대기' || s === '업체승인대기' }).length
  const cur = TABS.find(t => t.id === tab)!
  return (
    <div>
      <PageHeader title="정산관리" code={cur.code}
        desc="매출 현황, 대관 공연 정산 및 정산서 출력, PG 대사, 수수료·미사용 환불을 관리합니다." />
      <Tabs value={tab} onChange={setTab}
        tabs={TABS.map(t => ({ id: t.id, label: t.label, badge: t.id === 'settle' && pending ? pending : undefined }))} />
      {tab === 'sales' && <SalesTab />}
      {tab === 'settle' && <SettleTab />}
      {tab === 'pg' && <PgTab />}
      {tab === 'fee' && <FeeRefundTab />}
    </div>
  )
}
