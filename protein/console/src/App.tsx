import { useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Braces, Boxes, Check, ChevronsUpDown, Cpu, Database, Gauge, KeyRound,
  GraduationCap, HelpCircle, LayoutDashboard, Library, LogOut, Menu, Plug, Plus, Rocket,
  Settings, Shapes, ShieldCheck, Sparkles,
} from 'lucide-react'
import { wsStore } from './data/workspace'
import { Copilot } from './components/Copilot'
import { Notifications } from './components/Notifications'
import { SettingsModal } from './components/SettingsModal'
import { HelpModal } from './components/HelpModal'
import { Tutorial } from './components/Tutorial'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Fast from './pages/Fast'
import Setup from './pages/Setup'
import DagStudio from './pages/DagStudio'
import Cath from './pages/Cath'
import Overview from './pages/Overview'
import Templates from './pages/Templates'
import { StudioDetail, StudioList } from './pages/Studio'
import { MonitorDetail, MonitorList } from './pages/Monitor'
import { AnalyzeBinding, AnalyzeCompare, AnalyzeHits, AnalyzeRecords, AnalyzeReport, AnalyzeRuns } from './pages/Analyze'
import { ProjectDetail, ProjectMembers, ProjectsList, RoundDetail } from './pages/Projects'
import { ModelDetail, ModelProviders, ModelsList } from './pages/Models'
import { McpAccountNew, McpAccounts, McpConnect, McpKeyNew, McpKeys, McpTools, RestRoutes } from './pages/Integrations'
import {
  AdminAudit, AdminData, AdminMigration, AdminPerformance, AdminRoles, AdminSecurity, AdminUsers,
} from './pages/Admin'
import { GpuDetail, GpuList, GpuUsage, Jobs } from './pages/Ops'

/* 역할 기반 접근제어. 로그인한 역할에 허용된 메뉴만 보인다. */
export type Role = 'admin' | 'researcher' | 'viewer'

const ROLE_LABEL: Record<Role, string> = {
  admin: '관리자', researcher: '연구자', viewer: '일반 사용자',
}
const ROLE_USER: Record<Role, { name: string; initial: string }> = {
  admin: { name: '박운영', initial: '박' },
  researcher: { name: '김연구', initial: '김' },
  viewer: { name: '최열람', initial: '최' },
}
const ALL_ROLES: Role[] = ['admin', 'researcher', 'viewer']

/* 사이드바: 상위 항목은 늘 보이고, 지금 보고 있는 영역만 하위 화면이 펼쳐진다. */
interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  tag?: string
  roles?: Role[]
  /* 메뉴에는 안 보이지만 주소로는 열리는 화면. 프로젝트처럼 맥락 전환기에서 들어가는 곳. */
  hidden?: boolean
  children?: { to: string; label: string; roles?: Role[] }[]
}

/* 상세 화면은 메뉴에 두지 않고 목록에서 행을 눌러 들어간다.
   대신 상단 경로에 어떤 항목을 보고 있는지 표시한다. */
const DETAIL_CRUMB: { re: RegExp; label: (m: RegExpMatchArray) => string }[] = [
  { re: /^\/workflow\/(.+)$/, label: m => m[1] },
  { re: /^\/monitor\/(.+)$/, label: m => m[1] },
  { re: /^\/projects\/([^/]+)\/members$/, label: m => m[1] },
  { re: /^\/projects\/([^/]+)\/rounds\/(.+)$/, label: m => `${m[1]} / ${m[2]}` },
  { re: /^\/projects\/(.+)$/, label: m => m[1] },
  { re: /^\/models\/providers$/, label: () => '' },
  { re: /^\/models\/(.+)$/, label: m => m[1] },
  { re: /^\/gpu\/usage$/, label: () => '' },
  { re: /^\/gpu\/(.+)$/, label: m => m[1] },
]

function detailCrumb(path: string) {
  for (const d of DETAIL_CRUMB) {
    const m = path.match(d.re)
    if (m) return d.label(m)
  }
  return ''
}

const NAV: { group: string; scoped?: boolean; items: NavItem[] }[] = [
  {
    group: '이 프로젝트',
    scoped: true,
    items: [
      { to: '/', label: '대시보드', icon: LayoutDashboard },
      /* 실행은 반드시 어느 라운드에 속한다. 그래서 라운드 밑에 둔다.
         만드는 곳(새 실행)은 행위라서 따로 뺀다. */
      {
        to: '/projects/:id', label: '라운드', icon: Boxes,
        children: [
          { to: '/projects/:id', label: '라운드 목록' },
          { to: '/monitor', label: '실행 기록' },
        ],
      },
      /* 구성원·권한은 라운드가 아니라 프로젝트 설정이다.
         메뉴에는 두지 않고 좌상단 프로젝트 드롭다운에서 들어간다. */
      { to: '/projects/:id/members', label: '프로젝트 설정', icon: Settings, hidden: true },
      {
        to: '/fast', label: '새 실행', icon: Rocket, roles: ['admin', 'researcher'],
        children: [
          { to: '/fast', label: '빠른 실행' },
          { to: '/setup', label: '고급 설정' },
          { to: '/workflow', label: '단계별 실행' },
          { to: '/dag', label: '흐름 설계 (DAG)' },
        ],
      },
      {
        to: '/analyze', label: '결과 분석', icon: BarChart3,
        children: [
          { to: '/analyze', label: '후보 선별' },
          { to: '/analyze/compare', label: '구조 비교' },
          { to: '/analyze/runs', label: '실행 간 비교' },
          { to: '/analyze/report', label: '보고서' },
          { to: '/analyze/records', label: '피드백 · 실험' },
          { to: '/analyze/binding', label: '결합 예측 결과' },
        ],
      },
    ],
  },
  {
    group: '자산',
    items: [
      { to: '/templates', label: '워크플로 템플릿', icon: Shapes },
      {
        to: '/models', label: '모델 레지스트리', icon: Database, roles: ['admin'],
        children: [
          { to: '/models', label: '등록 모델' },
          { to: '/models/providers', label: '실행 제공자' },
        ],
      },
      { to: '/cath', label: 'CATH 벤치마크', icon: Library, roles: ['admin'] },
    ],
  },
  {
    /* 외부 도구 연동은 자기 실행을 API 로 돌릴 사람에게만 필요하다. 조회 권한만 가진 사용자에게는 감춘다.
       MCP 는 AI 클라이언트용, REST API 는 직접 코드로 부르는 용도라 메뉴를 나눈다. 키는 둘이 함께 쓴다. */
    group: '연동',
    items: [
      {
        to: '/mcp', label: 'MCP 연동', icon: Plug, roles: ['admin', 'researcher'],
        children: [
          { to: '/mcp', label: '연결 방법' },
          { to: '/mcp/tools', label: 'MCP 도구' },
        ],
      },
      {
        to: '/rest', label: 'REST API 연동', icon: Braces, roles: ['admin', 'researcher'],
        children: [
          { to: '/rest', label: 'API 경로' },
          { to: '/rest/accounts', label: '연계 계정' },
        ],
      },
      { to: '/keys', label: 'API 키', icon: KeyRound, roles: ['admin', 'researcher'] },
    ],
  },
  {
    group: '시스템 운영',
    items: [
      { to: '/overview', label: '운영 현황', icon: Gauge, roles: ['admin'] },
      /* 작업 큐는 GPU 엔드포인트로 흘러가므로 큐 · GPU · 부하 시험을 한 메뉴에 둔다. */
      {
        to: '/jobs', label: '자원 · 작업', icon: Cpu, roles: ['admin'],
        children: [
          { to: '/jobs', label: '작업 큐' },
          { to: '/gpu', label: 'GPU 엔드포인트' },
          { to: '/gpu/usage', label: '사용량 · 지출' },
          { to: '/perf', label: '성능 · 동시접속' },
        ],
      },
      {
        to: '/admin/data', label: '데이터 관리', icon: Database, roles: ['admin'],
        children: [
          { to: '/admin/data', label: '데이터 저장소' },
          { to: '/admin/migration', label: '레거시 마이그레이션' },
        ],
      },
      {
        to: '/admin', label: '사용자 · 보안', icon: ShieldCheck, roles: ['admin'],
        children: [
          { to: '/admin', label: '사용자 · 승인' },
          { to: '/admin/roles', label: '권한 매트릭스' },
          { to: '/admin/security', label: '보안 운영 기준' },
          { to: '/admin/audit', label: '감사 로그' },
        ],
      },
    ],
  },
]

const ALL = NAV.flatMap(g => g.items)

const allowed = (roles: Role[] | undefined, role: Role) => !roles || roles.includes(role)

/* 메뉴 주소의 :id 는 지금 고른 프로젝트로 바꾼다. */
const resolve = (to: string, projectId: string) => to.replace(':id', projectId)

/* 현재 주소가 어느 상위 메뉴에 속하는지. '/' 는 정확히 일치할 때만. */
function matches(path: string, to: string) {
  return to === '/' ? path === '/' : path === to || path.startsWith(to + '/')
}

/* 하위 화면이 다른 경로를 쓰는 경우(자유형 DAG 등)도 같은 영역으로 본다. */
function inSection(path: string, item: NavItem, projectId: string) {
  const to = resolve(item.to, projectId)
  return matches(path, to) || (item.children ?? []).some(c => matches(path, resolve(c.to, projectId)))
}

export default function App() {
  const [authed, setAuthed] = useState(true)
  /* 역할은 주소로 정한다. 예: #/gpu?role=admin
     시안 검토나 목업 촬영에서 화면을 건드리지 않고 권한을 바꾸기 위한 것이다. */
  const loc = useLocation()
  const role: Role = (() => {
    const r = new URLSearchParams(loc.search).get('role')
    return ALL_ROLES.includes(r as Role) ? (r as Role) : 'researcher'
  })()
  const [copilot, setCopilot] = useState(() => window.innerWidth >= 1680)
  const [navOpen, setNavOpen] = useState(false)
  const [modal, setModal] = useState<'settings' | 'help' | 'tutorial' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const nav = useNavigate()
  const projects = useSyncExternalStore(wsStore.subscribe, wsStore.projects)
  const curPrj = useSyncExternalStore(wsStore.subscribe, wsStore.currentId)
  const rounds = useSyncExternalStore(wsStore.subscribe, wsStore.rounds)
  const cur = projects.find(p => p.id === curPrj)
  const roundsOf = (id: string) => rounds.filter(r => r.projectId === id).length
  const [prjOpen, setPrjOpen] = useState(false)

  const onToast = (m: string) => setToast(m)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('rapid:role', { detail: role }))
  }, [role])

  const [prevPath, setPrevPath] = useState(loc.pathname)
  if (prevPath !== loc.pathname) { setPrevPath(loc.pathname); setNavOpen(false) }

  if (!authed) return <Login onLogin={() => { setAuthed(true); nav('/') }} />

  const visible = ALL.filter(i => allowed(i.roles, role))
  /* 더 깊은 경로를 가진 항목이 먼저 걸려야 한다.
     그래야 /projects/:id/members 가 '라운드'가 아니라 '프로젝트 설정'으로 잡힌다. */
  const section = [...visible]
    .sort((a, b) => resolve(b.to, curPrj).length - resolve(a.to, curPrj).length)
    .find(i => inSection(loc.pathname, i, curPrj)) ?? visible[0]
  const blocked = !visible.some(i => inSection(loc.pathname, i, curPrj))
  const detail = detailCrumb(loc.pathname)
  /* 보고 있는 화면이 특정 실행을 가리킬 때만 Copilot 에 넘긴다.
     실행과 무관한 화면에서 아무 실행이나 붙여 두면 틀린 맥락을 보여 주게 된다. */
  const run = loc.pathname.startsWith('/monitor/')
    ? loc.pathname.split('/')[2]
    : new URLSearchParams(loc.search).get('run') ?? undefined

  return (
    <div className={'shell' + (copilot ? ' copilot-open' : '')}>
      <nav className={'side' + (navOpen ? ' open' : '')}>
        <div className="brand">
          <span className="brand-logo" role="img" aria-label="KRIBB 한국생명공학연구원" />
          <div className="brand-svc"><b>RAPID</b><span>단백질 설계 플랫폼</span></div>
        </div>
        <div className="prj-switch">
          <button className={'prj-btn' + (prjOpen ? ' on' : '')} onClick={() => setPrjOpen(o => !o)}>
            <span className="prj-name">
              <b>{cur?.name ?? '프로젝트 선택'}</b>
              <small>{cur ? `라운드 ${roundsOf(cur.id)}개` : '프로젝트를 고르세요'}</small>
            </span>
            <ChevronsUpDown size={14} />
          </button>
          {prjOpen && (
            <>
              <div className="prj-back" onClick={() => setPrjOpen(false)} />
              <div className="prj-menu">
                <div className="prj-menu-head">프로젝트</div>
                {projects.filter(p => p.status !== 'archived').map(p => (
                  <button key={p.id} className={'prj-item' + (p.id === curPrj ? ' on' : '')}
                    onClick={() => {
                      wsStore.setCurrent(p.id); setPrjOpen(false)
                      onToast(`${p.name} 기준으로 전환`)
                    }}>
                    <span className="prj-name">
                      <b>{p.name}</b>
                      <small>{p.owner} · 라운드 {roundsOf(p.id)}개</small>
                    </span>
                    {p.id === curPrj && <Check size={15} />}
                  </button>
                ))}
                <div className="prj-menu-foot">
                  <button className="prj-item" onClick={() => {
                    setPrjOpen(false); nav('/projects?new=1')
                  }}><Plus size={15} />새 프로젝트</button>
                  <button className="prj-item" onClick={() => {
                    setPrjOpen(false); nav(cur ? `/projects/${cur.id}/members` : '/projects')
                  }}><Settings size={15} />프로젝트 설정</button>
                </div>
              </div>
            </>
          )}
        </div>
        {NAV.filter(g => g.items.some(i => !i.hidden && allowed(i.roles, role))).map(g => (
          <div className={'nav-group' + (g.scoped ? ' scoped' : '')} key={g.group}>
            <div className="nav-group-title">{g.group}</div>
            {g.items.filter(i => !i.hidden && allowed(i.roles, role)).map(i => {
              /* 상단 경로가 고른 영역과 같은 기준으로 켠다.
                 따로 판정하면 /projects/:id/members 에서 '라운드'까지 함께 켜진다. */
              const active = i === section
              return (
                <div key={i.to}>
                  {/* NavLink 는 주소가 앞부분만 맞아도 active 를 붙인다.
                      함수형으로 넘겨 그 기본 동작을 끄고 영역 판정만 쓴다. */}
                  <NavLink to={resolve(i.to, curPrj)} end={i.to === '/'}
                    className={() => 'nav-item' + (active ? ' active' : '')}>
                    <i.icon size={16} />
                    {i.label}
                    {i.tag && <span className="tag">{i.tag}</span>}
                  </NavLink>
                  {active && i.children && (
                    <div className="nav-sub">
                      {i.children.filter(c => allowed(c.roles, role)).map(c => (
                        <NavLink key={c.to} to={resolve(c.to, curPrj)}
                          end={c.to === i.to || i.children!.some(o => o.to.startsWith(c.to + '/'))}
                          className={({ isActive }) => 'nav-sub-item' + (isActive ? ' active' : '')}>
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div className="side-foot">
          <Notifications onToast={onToast} />
          <div className="user-chip">
            <div className="avatar">{ROLE_USER[role].initial}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{ROLE_USER[role].name}</div>
              <div className="faint">{ROLE_LABEL[role]}</div>
            </div>
            <button className="btn ghost sm" title="로그아웃" onClick={() => setAuthed(false)}><LogOut size={15} /></button>
          </div>
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <button className="btn ghost sm mobile-nav" onClick={() => setNavOpen(o => !o)}><Menu size={16} /></button>
          <div className="crumbs">
            <span>통합 콘솔</span><span>/</span>
            {detail
              ? <><NavLink to={section.to}>{section.label}</NavLink><span>/</span><b className="mono">{detail}</b></>
              : <b>{section.label}</b>}
          </div>
          <div className="sp" />
          <button className="btn ghost sm" title="튜토리얼" onClick={() => setModal('tutorial')}><GraduationCap size={16} /></button>
          <button className="btn ghost sm" title="사용 안내" onClick={() => setModal('help')}><HelpCircle size={16} /></button>
          <button className="btn ghost sm" title="설정" onClick={() => setModal('settings')}><Settings size={16} /></button>
          <button className={'btn sm' + (copilot ? ' primary' : '')} onClick={() => setCopilot(o => !o)}>
            <Sparkles size={14} />Copilot
          </button>
        </header>

        <div className="content">
          {blocked ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <b>접근 권한이 없습니다</b>
              <p className="muted" style={{ marginTop: 6 }}>
                {ROLE_LABEL[role]} 권한으로는 열 수 없는 화면입니다. 필요하면 관리자에게 권한을 요청하세요.
              </p>
              <button className="btn primary" style={{ marginTop: 14, alignSelf: 'center' }} onClick={() => nav('/')}>홈으로</button>
            </div>
          ) : (
          <Routes>
            <Route path="/" element={<Dashboard onToast={onToast} />} />
            <Route path="/fast" element={<Fast onToast={onToast} />} />
            <Route path="/setup" element={<Setup onToast={onToast} />} />
            <Route path="/workflow" element={<StudioList onToast={onToast} />} />
            <Route path="/workflow/:id" element={<StudioDetail onToast={onToast} />} />
            <Route path="/dag" element={<DagStudio onToast={onToast} />} />
            <Route path="/monitor" element={<MonitorList onToast={onToast} />} />
            <Route path="/monitor/:id" element={<MonitorDetail onToast={onToast} />} />
            <Route path="/analyze" element={<AnalyzeHits onToast={onToast} />} />
            <Route path="/analyze/compare" element={<AnalyzeCompare onToast={onToast} />} />
            <Route path="/analyze/runs" element={<AnalyzeRuns onToast={onToast} />} />
            <Route path="/analyze/report" element={<AnalyzeReport onToast={onToast} />} />
            <Route path="/analyze/records" element={<AnalyzeRecords onToast={onToast} />} />
            <Route path="/analyze/binding" element={<AnalyzeBinding onToast={onToast} />} />
            <Route path="/projects" element={<ProjectsList onToast={onToast} />} />
            <Route path="/projects/:id" element={<ProjectDetail onToast={onToast} />} />
            <Route path="/projects/:id/members" element={<ProjectMembers onToast={onToast} />} />
            <Route path="/projects/:id/rounds/:rid" element={<RoundDetail onToast={onToast} />} />
            <Route path="/models" element={<ModelsList onToast={onToast} />} />
            <Route path="/models/providers" element={<ModelProviders onToast={onToast} />} />
            <Route path="/models/:id" element={<ModelDetail onToast={onToast} />} />
            <Route path="/cath" element={<Cath onToast={onToast} />} />
            <Route path="/templates" element={<Templates onToast={onToast} />} />
            <Route path="/overview" element={<Overview onToast={onToast} />} />
            <Route path="/jobs" element={<Jobs onToast={onToast} />} />
            <Route path="/gpu" element={<GpuList onToast={onToast} />} />
            <Route path="/gpu/usage" element={<GpuUsage onToast={onToast} />} />
            <Route path="/gpu/:id" element={<GpuDetail onToast={onToast} />} />
            <Route path="/mcp" element={<McpConnect onToast={onToast} />} />
            <Route path="/mcp/tools" element={<McpTools onToast={onToast} />} />
            <Route path="/rest" element={<RestRoutes onToast={onToast} />} />
            <Route path="/rest/accounts" element={<McpAccounts />} />
            <Route path="/rest/accounts/new" element={<McpAccountNew onToast={onToast} />} />
            <Route path="/keys" element={<McpKeys onToast={onToast} />} />
            <Route path="/keys/new" element={<McpKeyNew onToast={onToast} />} />
            {/* 예전 주소 */}
            <Route path="/integrations/*" element={<Navigate to="/mcp" replace />} />
            <Route path="/admin" element={<AdminUsers onToast={onToast} />} />
            <Route path="/admin/roles" element={<AdminRoles onToast={onToast} />} />
            <Route path="/admin/audit" element={<AdminAudit onToast={onToast} />} />
            <Route path="/admin/security" element={<AdminSecurity onToast={onToast} />} />
            <Route path="/admin/data" element={<AdminData onToast={onToast} />} />
            <Route path="/admin/migration" element={<AdminMigration onToast={onToast} />} />
            <Route path="/perf" element={<AdminPerformance onToast={onToast} />} />
          </Routes>
          )}
        </div>
      </main>

      {copilot && <Copilot ctx={{ page: section.label, run }} onClose={() => setCopilot(false)} onToast={onToast} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} onToast={onToast} />}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
      {modal === 'tutorial' && <Tutorial onClose={() => setModal(null)} />}
      {toast && <div className="toast"><Sparkles size={14} />{toast}</div>}
    </div>
  )
}
