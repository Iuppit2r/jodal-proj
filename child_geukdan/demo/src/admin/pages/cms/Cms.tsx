import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useStore } from '../../../store'
import { PageHeader, Tabs } from '../../ui'
import { TODAY } from '../../lib'
import Banners from './Banners'
import Popups from './Popups'
import Boards from './Boards'
import BoardSettings from './BoardSettings'
import Menus from './Menus'
import Reviews from './Reviews'
import SiteInfo from './SiteInfo'

const TABS = [
  { id: 'banners', label: '메인 배너', code: 'SFR-CM-001' },
  { id: 'popups', label: '팝업 관리', code: 'SFR-CM-002' },
  { id: 'boards', label: '게시판 관리', code: 'SFR-CM-003' },
  { id: 'board-settings', label: '게시판 설정', code: 'SFR-CM-004' },
  { id: 'menus', label: '메뉴 관리', code: 'SFR-CM-005' },
  { id: 'reviews', label: '관람후기 관리', code: 'SFR-CM-006' },
  { id: 'site', label: '사이트 기본정보', code: 'SFR-CM-007' },
] as const

export default function Cms() {
  const params = useParams()
  const nav = useNavigate()
  const sub = (params['*'] ?? '').split('/')[0]
  const tab = TABS.find(t => t.id === sub) ?? TABS[0]
  const popups = useStore(s => s.popups)
  const notices = useStore(s => s.notices)
  const reviews = useStore(s => s.reviews)
  const livePopups = popups.filter(p => p.active && p.start <= TODAY && p.end >= TODAY).length

  return (
    <div>
      <PageHeader
        title="CMS · 홈페이지 관리" code={tab.code}
        desc="메인 배너·팝업·게시판·메뉴 등 홈페이지 콘텐츠를 관리합니다. 저장 즉시 홈페이지에 반영됩니다."
        actions={<a href="#/site" target="_blank" rel="noreferrer" className="btn-outline btn-sm"><ExternalLink size={14} />홈페이지 열기</a>}
      />
      <Tabs
        value={tab.id}
        onChange={id => nav(`/admin/cms/${id}`)}
        tabs={TABS.map(t => ({
          id: t.id,
          label: t.id === 'boards' ? `${t.label} (${notices.length})` : t.id === 'reviews' ? `${t.label} (${reviews.length})` : t.label,
          badge: t.id === 'popups' ? livePopups || undefined : undefined,
        }))}
      />
      {tab.id === 'banners' && <Banners />}
      {tab.id === 'popups' && <Popups />}
      {tab.id === 'boards' && <Boards />}
      {tab.id === 'board-settings' && <BoardSettings />}
      {tab.id === 'menus' && <Menus />}
      {tab.id === 'reviews' && <Reviews />}
      {tab.id === 'site' && <SiteInfo />}
    </div>
  )
}
