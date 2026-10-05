import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck, ScanLine, Ticket } from 'lucide-react'
import { PageHeader, PiiToggle, Tabs } from '../ui'
import BookingDetail from './bookings/BookingDetail'
import IssueList from './tickets/IssueList'
import CheckinStatus from './tickets/CheckinStatus'
import ManualCheckin from './tickets/ManualCheckin'

const TABS = [
  { id: 'issue', label: <><Ticket size={14} />발권 내역</>, code: 'SFR-TC-015' },
  { id: 'status', label: <><ScanLine size={14} />검표 현황</>, code: 'SFR-TC-016' },
  { id: 'manual', label: <><ClipboardCheck size={14} />수작업 검표</>, code: 'SFR-TC-017' },
]

/** 발권·검표 관리 (SFR-TC-015~017) */
export default function Tickets() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab')! : 'issue'
  const [detailId, setDetailId] = useState<string | null>(null)
  return (
    <div>
      <PageHeader
        title="발권·검표"
        code={TABS.find(t => t.id === tab)!.code}
        desc="현장·모바일·무인발권기 발권 내역과 회차별 입장(검표) 현황을 관리합니다. QR 인식 불가 시 수작업 검표로 입장 처리합니다."
        actions={<PiiToggle />}
      />
      <Tabs tabs={TABS} value={tab} onChange={id => setParams({ tab: id }, { replace: true })} />
      {tab === 'issue' && <IssueList onOpen={setDetailId} />}
      {tab === 'status' && <CheckinStatus onOpen={setDetailId} />}
      {tab === 'manual' && <ManualCheckin onOpen={setDetailId} />}
      <BookingDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
