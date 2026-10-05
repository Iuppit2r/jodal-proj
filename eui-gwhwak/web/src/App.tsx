import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom'
import { AppProvider, ROLE_LABEL, useApp, type Role } from './context'
import SearchAssist from './pages/SearchAssist'
import SaveArchive from './pages/SaveArchive'
import Library from './pages/Library'
import MeshReview from './pages/MeshReview'
import Admin from './pages/Admin'

const NAV = [
  { to: '/search', label: 'Search Assist' },
  { to: '/save', label: '질병재난 아카이브' },
  { to: '/library', label: '통합전자도서관' },
  { to: '/mesh', label: 'MeSH 자동색인', staff: true },
  { to: '/admin', label: '운영관리', admin: true },
]

function Shell() {
  const { role, setRole } = useApp()
  const nav = NAV.filter(n => (!n.staff || role !== 'public') && (!n.admin || role === 'admin'))
  return (
    <>
      <a href="#main" className="skip-link">본문 바로가기</a>
      <div className="gov-bar">
        <div className="inner">
          <span>질병관리청 국립보건연구원 · 국립의과학지식센터</span>
          <span className="spacer" />
          <span>프로토타입 v0.1 · 목업 데이터</span>
        </div>
      </div>
      <header className="header">
        <div className="inner">
          <Link to="/search" className="brand" aria-label="NCMIK Search Assist 홈">
            <span className="brand-mark" aria-hidden>N</span>
            <span>
              <small>국가 의과학 지식자원</small>
              <strong>NCMIK Search Assist</strong>
            </span>
          </Link>
          <nav className="nav" aria-label="주 메뉴">
            {nav.map(n => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </nav>
          <label className="role-switch">
            <span>접속 권한</span>
            <select value={role} onChange={e => setRole(e.target.value as Role)} aria-label="접속 권한 전환 (데모)">
              {(Object.keys(ROLE_LABEL) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </label>
        </div>
      </header>
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchAssist />} />
          <Route path="/save" element={<SaveArchive />} />
          <Route path="/library" element={<Library />} />
          <Route path="/mesh" element={role === 'public' ? <Denied /> : <MeshReview />} />
          <Route path="/admin" element={role === 'admin' ? <Admin /> : <Denied />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </main>
    </>
  )
}

function Denied() {
  return (
    <div className="card empty">
      <h2 style={{ fontSize: 18, color: 'var(--text)' }}>접근 권한이 없습니다</h2>
      <p style={{ marginTop: 6 }}>우측 상단에서 접속 권한을 전환해 확인하세요. (내부직원: IP/SSO 자동 인증)</p>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
