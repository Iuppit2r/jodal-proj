import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../../store'
import { PageHeader, Tabs } from '../../ui'
import Members from './Members'
import Dormant from './Dormant'
import Inquiries from './Inquiries'
import Targeting from './Targeting'

const TAB_IDS = ['members', 'dormant', 'inquiry', 'targeting'] as const
type TabId = (typeof TAB_IDS)[number]

const META: Record<TabId, { code: string; desc: string }> = {
  members: { code: 'SFR-PM-001', desc: '회원 검색·상세 조회, 구매이력·쿠폰·멤버십 통합 관리 (개인정보 기본 마스킹)' },
  dormant: { code: 'SFR-PM-004', desc: '1년 미접속 회원 휴면 전환 · 30일 전 사전 고지 · 휴면 해제' },
  inquiry: { code: 'SFR-PM-006', desc: '1:1 문의·VOC 담당자 배정 및 답변 (답변 등록 시 고객 메일 자동 발송)' },
  targeting: { code: 'SFR-PM-008', desc: '관람이력·연령·지역·멤버십 조건으로 타겟을 추출해 쿠폰 발급 및 알림톡·문자·메일 발송' },
}

export default function Crm() {
  const [sp, setSp] = useSearchParams()
  const raw = sp.get('tab')
  const tab: TabId = (TAB_IDS as readonly string[]).includes(raw ?? '') ? (raw as TabId) : 'members'
  const inquiries = useStore(s => s.inquiries)
  const unanswered = useMemo(() => inquiries.filter(q => q.status !== '답변완료').length, [inquiries])

  return (
    <div>
      <PageHeader title="회원·CRM" code={META[tab].code} desc={META[tab].desc} />
      <Tabs value={tab} onChange={id => setSp({ tab: id }, { replace: true })}
        tabs={[
          { id: 'members', label: '회원 목록' },
          { id: 'dormant', label: '휴면회원 관리' },
          { id: 'inquiry', label: 'VOC · 1:1 문의', badge: unanswered || undefined },
          { id: 'targeting', label: 'CRM 타겟팅' },
        ]} />
      {tab === 'members' && <Members />}
      {tab === 'dormant' && <Dormant />}
      {tab === 'inquiry' && <Inquiries />}
      {tab === 'targeting' && <Targeting />}
    </div>
  )
}
