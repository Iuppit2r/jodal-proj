import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, Headphones, Search, Upload } from 'lucide-react'
import { PageHeader, PiiToggle, Tabs } from '../../ui'
import BookingSearch from './BookingSearch'
import BookingDetail from './BookingDetail'
import PhoneBooking from './PhoneBooking'
import BulkCancel from './BulkCancel'
import ExternalUpload from './ExternalUpload'

const TABS = [
  { id: 'search', label: <><Search size={14} />예매 조회</>, code: 'SFR-TC-011' },
  { id: 'phone', label: <><Headphones size={14} />예매 등록(콜센터)</>, code: 'SFR-TC-012' },
  { id: 'bulk', label: <><Ban size={14} />일괄 취소</>, code: 'SFR-TC-013' },
  { id: 'external', label: <><Upload size={14} />외부예매처 업로드</>, code: 'SFR-TC-014' },
]

/** 예매관리 (SFR-TC-011~014) */
export default function Bookings() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab')! : 'search'
  const [detailId, setDetailId] = useState<string | null>(null)

  const setTab = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    if (id !== 'search') next.delete('q')
    setParams(next, { replace: true })
  }
  const code = TABS.find(t => t.id === tab)!.code

  return (
    <div>
      <PageHeader
        title="예매관리"
        code={code}
        desc="온라인·현장·콜센터·외부예매처 예매를 통합 조회하고 취소·변경·발권을 처리합니다. 모든 처리 내역은 변경이력에 기록됩니다."
        actions={<PiiToggle />}
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'search' && <BookingSearch onOpen={setDetailId} />}
      {tab === 'phone' && <PhoneBooking onOpen={id => { setTab('search'); setDetailId(id) }} />}
      {tab === 'bulk' && <BulkCancel />}
      {tab === 'external' && <ExternalUpload />}
      <BookingDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
