import { useSearchParams } from 'react-router-dom'
import { PageHeader, Tabs } from '../ui'
import Tiers from './membership/Tiers'
import Stats from './membership/Stats'
import CallCenter from './membership/CallCenter'
import Promotion from './membership/Promotion'

const TABS = [
  { id: 'tiers', label: '등급 관리', code: 'SFR-PM-010', desc: '유료회원 등급별 연회비·할인율·선예매·혜택 설정' },
  { id: 'stats', label: '가입현황 · 결제 통계', code: 'SFR-PM-011', desc: '등급별 가입 현황, 연회비 매출, 자동갱신율 및 월별 가입 추이' },
  { id: 'call', label: '콜센터 가입/탈퇴 처리', code: 'SFR-PM-012', desc: '전화 문의 회원의 멤버십 가입·해지(일할 환불)를 대리 처리' },
  { id: 'promo', label: '프로모션', code: 'SFR-PM-013', desc: '유료회원 선예매 일정, 쿠폰 일괄 지급, 알림톡 발송' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function Membership() {
  const [sp, setSp] = useSearchParams()
  const tab = (TABS.find(t => t.id === sp.get('tab'))?.id ?? 'tiers') as TabId
  const meta = TABS.find(t => t.id === tab)!
  return (
    <div>
      <PageHeader title="유료회원(멤버십) 관리" code={meta.code} desc={meta.desc} />
      <Tabs value={tab} onChange={id => setSp({ tab: id }, { replace: true })} tabs={TABS.map(t => ({ id: t.id, label: t.label }))} />
      {tab === 'tiers' && <Tiers />}
      {tab === 'stats' && <Stats />}
      {tab === 'call' && <CallCenter />}
      {tab === 'promo' && <Promotion />}
    </div>
  )
}
