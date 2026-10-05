import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  Activity, BarChart3, Boxes, Database, FlaskConical, Gauge, LayoutDashboard, Menu, Network,
  Plug, Search, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react'
import { Copilot } from './components/Copilot'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import Monitor from './pages/Monitor'
import DagStudio from './pages/DagStudio'
import Analyze from './pages/Analyze'
import Models from './pages/Models'
import Projects from './pages/Projects'
import Integrations from './pages/Integrations'
import Admin from './pages/Admin'
import { GpuAdmin, Jobs, Performance } from './pages/Ops'

const NAV = [
  {
    group: '설계 · 실행',
    items: [
      { to: '/', label: '운영 현황', icon: LayoutDashboard, crumb: '운영 현황' },
      { to: '/setup', label: '실행 설정', icon: FlaskConical, crumb: 'Setup' },
      { to: '/workflow', label: 'Workflow Studio', icon: Workflow, crumb: 'Workflow Studio' },
      { to: '/dag', label: 'DAG Studio', icon: Network, tag: '자유형', crumb: 'DAG Studio' },
      { to: '/monitor', label: 'Monitor', icon: Activity, crumb: 'Monitor' },
      { to: '/analyze', label: 'Analyze', icon: BarChart3, crumb: 'Analyze' },
    ],
  },
  {
    group: '자산 · 이력',
    items: [
      { to: '/projects', label: '프로젝트', icon: Boxes, crumb: '프로젝트' },
      { to: '/models', label: 'Model Registry', icon: Database, crumb: 'Model Registry' },
    ],
  },
  {
    group: '운영',
    items: [
      { to: '/jobs', label: '작업 큐', icon: Gauge, crumb: '작업 큐' },
      { to: '/gpu', label: 'GPU 운영', icon: Activity, crumb: 'GPU 운영' },
      { to: '/perf', label: '성능 · 동시접속', icon: Gauge, crumb: '성능' },
      { to: '/integrations', label: '외부 연계', icon: Plug, crumb: '외부 연계' },
      { to: '/admin', label: '보안 · 데이터', icon: ShieldCheck, crumb: '보안 · 데이터' },
    ],
  },
]

const ALL = NAV.flatMap(g => g.items)

export default function App() {
  const [copilot, setCopilot] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [run, setRun] = useState('run_0421')
  const loc = useLocation()

  const onToast = (m: string) => setToast(m)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => { setNavOpen(false) }, [loc.pathname])

  const current = ALL.find(i => i.to === loc.pathname) ?? ALL[0]

  return (
    <div className={'shell' + (copilot ? ' copilot-open' : '')}>
      <nav className={'side' + (navOpen ? ' open' : '')}>
        <div className="brand">
          <span className="brand-mark">R</span>
          <span>
            <b>RAPID</b>
            <small>단백질 설계 자동화 플랫폼</small>
          </span>
        </div>
        {NAV.map(g => (
          <div className="nav-group" key={g.group}>
            <div className="nav-group-title">{g.group}</div>
            {g.items.map(i => (
              <NavLink key={i.to} to={i.to} end={i.to === '/'}
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                <i.icon size={15} />
                {i.label}
                {i.tag && <span className="tag">{i.tag}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="side-foot">
          한국생명공학연구원<br />국가바이오파운드리사업단
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <button className="btn ghost sm mobile-nav" onClick={() => setNavOpen(o => !o)}><Menu size={16} /></button>
          <div className="crumbs">
            <span>통합 콘솔</span><span>/</span><b>{current.crumb}</b>
          </div>
          <div className="search">
            <Search size={14} />
            <input placeholder="run, 후보, 프로젝트 검색" />
            <span className="kbd">⌘K</span>
          </div>
          <button className={'btn' + (copilot ? ' primary' : '')} onClick={() => setCopilot(o => !o)}>
            <Sparkles size={14} />Copilot
          </button>
          <div className="avatar">김</div>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<Setup onToast={onToast} />} />
            <Route path="/workflow" element={<Monitor onToast={onToast} onRunChange={setRun} />} />
            <Route path="/monitor" element={<Monitor onToast={onToast} onRunChange={setRun} />} />
            <Route path="/dag" element={<DagStudio onToast={onToast} />} />
            <Route path="/analyze" element={<Analyze onToast={onToast} />} />
            <Route path="/projects" element={<Projects onToast={onToast} />} />
            <Route path="/models" element={<Models onToast={onToast} />} />
            <Route path="/jobs" element={<Jobs onToast={onToast} />} />
            <Route path="/gpu" element={<GpuAdmin onToast={onToast} />} />
            <Route path="/perf" element={<Performance />} />
            <Route path="/integrations" element={<Integrations onToast={onToast} />} />
            <Route path="/admin" element={<Admin onToast={onToast} />} />
          </Routes>
        </div>
      </main>

      {copilot && <Copilot ctx={{ page: current.crumb, run }} onClose={() => setCopilot(false)} />}
      {toast && <div className="toast"><Sparkles size={14} />{toast}</div>}
    </div>
  )
}
