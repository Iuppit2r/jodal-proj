import { useSearchParams } from 'react-router-dom'
import { PageHeader, Tabs } from '../ui'
import Traffic from './stats/Traffic'
import Sources from './stats/Sources'
import Pages from './stats/Pages'
import Demographics from './stats/Demographics'
import Logs from './stats/Logs'

const TABS = [
  { id: 'traffic', label: '홈페이지 접속 통계', code: 'SFR-ST-001' },
  { id: 'sources', label: '접속 경로', code: 'SFR-ST-002' },
  { id: 'pages', label: '인기 페이지', code: 'SFR-ST-003' },
  { id: 'members', label: '회원 인구통계', code: 'SFR-ST-004' },
  { id: 'logs', label: '관리자 접속·개인정보 처리 로그', code: 'SER-SC-005' },
] as const

export default function Stats() {
  const [sp, setSp] = useSearchParams()
  const tab = TABS.find(t => t.id === sp.get('tab')) ?? TABS[0]
  return (
    <div>
      <PageHeader title="통계" code={tab.code} desc="홈페이지 접속·유입·인기 페이지·회원 통계와 관리자 접속기록을 조회합니다." />
      <Tabs tabs={TABS.map(t => ({ id: t.id, label: t.label }))} value={tab.id} onChange={id => setSp({ tab: id }, { replace: true })} />
      {tab.id === 'traffic' && <Traffic />}
      {tab.id === 'sources' && <Sources />}
      {tab.id === 'pages' && <Pages />}
      {tab.id === 'members' && <Demographics />}
      {tab.id === 'logs' && <Logs />}
    </div>
  )
}
