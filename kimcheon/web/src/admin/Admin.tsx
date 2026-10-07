import { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarRange,
  Camera,
  ClipboardList,
  Gift,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessagesSquare,
  Route,
  ShieldCheck,
  Smartphone,
  Truck,
  UserCog,
  Mountain as MountainIcon,
  MapPin,
  ListTree,
  GalleryHorizontal,
  Users,
  BellRing,
  Map as MapIcon,
} from 'lucide-react'
import { useAdmin, type AdminPage } from './store'
import { roundStatus } from './data'
import { inputCls } from './ui'
import { Osam } from '../components/art'
import { Boards, Admins, Logs, WebLog } from './pages/Cms'
import { Dashboard } from './pages/Dashboard'
import { Rounds, Courses } from './pages/Rounds'
import { Certs, Stats } from './pages/Certs'
import { Rewards, Payments } from './pages/Rewards'
import { Missions } from './pages/Missions'
import { Banners, Menus, MountainInfo, Tourism } from './pages/Content'
import { MapStatus, Members, PushSend } from './pages/Ops'

const NAV: { group: string; items: { id: AdminPage; label: string; icon: typeof Activity; req?: string }[] }[] = [
  { group: '현황', items: [{ id: 'dashboard', label: '대시보드', icon: LayoutDashboard }] },
  {
    group: '완등 인증 관리',
    items: [
      { id: 'rounds', label: '인증 회차 관리', icon: CalendarRange },
      { id: 'courses', label: '인증코스 관리', icon: Route },
      { id: 'certs', label: '인증현황 관리', icon: Camera },
      { id: 'members', label: '회원 관리', icon: Users },
      { id: 'rewards', label: '인증물품 관리', icon: Gift },
      { id: 'payments', label: '물품 지급 현황', icon: Truck },
      { id: 'stats', label: '인증지점별 통계', icon: BarChart3 },
    ],
  },
  {
    group: '산 · 관광 정보',
    items: [
      { id: 'mountains', label: '산 정보 관리', icon: MountainIcon },
      { id: 'tourism', label: '관광정보 연계', icon: MapPin },
      { id: 'missions', label: '관광 미션 · 스탬프', icon: MapPinned },
    ],
  },
  {
    group: '콘텐츠 관리',
    items: [
      { id: 'boards', label: '게시판 관리', icon: MessagesSquare },
      { id: 'menus', label: '메뉴 · 콘텐츠', icon: ListTree },
      { id: 'banners', label: '배너 · 팝업', icon: GalleryHorizontal },
      { id: 'push', label: '푸시 알림 발송', icon: BellRing },
      { id: 'admins', label: '관리자 · 권한', icon: UserCog },
      { id: 'logs', label: '접속 · 작업 이력', icon: ClipboardList },
      { id: 'weblog', label: '웹로그 분석', icon: Activity },
      { id: 'mapstatus', label: '지도 서비스 상태', icon: MapIcon },
    ],
  },
]

const PAGES: Record<AdminPage, () => React.ReactElement> = {
  dashboard: Dashboard,
  rounds: Rounds,
  courses: Courses,
  certs: Certs,
  rewards: Rewards,
  payments: Payments,
  stats: Stats,
  missions: Missions,
  boards: Boards,
  admins: Admins,
  logs: Logs,
  weblog: WebLog,
  mountains: MountainInfo,
  tourism: Tourism,
  menus: Menus,
  banners: Banners,
  members: Members,
  push: PushSend,
  mapstatus: MapStatus,
}

export default function Admin() {
  const authed = useAdmin((s) => s.authed)
  return (
    <div className="min-h-full bg-bg text-[15px] text-ink" style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}>
      {authed ? <Shell /> : <AdminLogin />}
      <AdminToast />
    </div>
  )
}

function AdminToast() {
  const toast = useAdmin((s) => s.toast)
  if (!toast) return null
  return <div className="anim-rise fixed bottom-8 left-1/2 z-[1100] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white">{toast}</div>
}

function AdminLogin() {
  const login = useAdmin((s) => s.login)
  const [id, setId] = useState('admin')
  const [pw, setPw] = useState('••••••••••')
  return (
    <div className="grid min-h-[var(--admin-h,100vh)] lg:grid-cols-[1fr_520px]">
      <div className="topo relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <img src="./brand/logo_gimcheon_white.png" alt="김천시" className="h-9 self-start" />
        <div>
          <p className="text-[16px] font-bold text-gold">김천시 산악 완등 인증시스템</p>
          <h1 className="mt-2 text-[40px] leading-tight font-black tracking-tight">
            완등 인증
            <br />
            관리 프로그램
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/80">회차 · 인증코스 · 인증현황 · 인증물품 · 지급 현황 · 통계</p>
        </div>
        <Osam pose="tour" size={220} className="absolute right-10 bottom-10" />
        <p className="text-[14px] text-white/70">김천시청 산림녹지과</p>
      </div>
      <div className="flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[380px]">
          <img src="./brand/logo_gimcheon.png" alt="김천시" className="h-8 lg:hidden" />
          <h2 className="mt-6 text-[26px] font-extrabold tracking-tight lg:mt-0">관리자 로그인</h2>
          <p className="mt-1 text-[15px] text-sub">등록된 관리자 계정으로 접속하세요.</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-bold">아이디</span>
              <input value={id} onChange={(e) => setId(e.target.value)} className={`${inputCls} h-12 w-full text-[15px]`} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-bold">비밀번호</span>
              <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className={`${inputCls} h-12 w-full text-[15px]`} />
            </label>
          </div>
          <button onClick={login} className="mt-6 h-12 w-full rounded-xl bg-brand text-[16px] font-bold text-white hover:bg-brand-deep">
            로그인
          </button>
          <div className="mt-6 space-y-1.5 rounded-xl bg-bg p-4 text-[14px] text-sub">
            <p className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck size={16} className="text-forest" /> 보안 접속
            </p>
            <p>현재 접속 주소 211.236.12.40 · 허용된 주소에서만 로그인할 수 있습니다.</p>
            <p>비밀번호 5회 오류 시 계정이 잠깁니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Shell() {
  const { page, go, logout, roundId, setRound, rounds } = useAdmin()
  const Page = PAGES[page]
  useEffect(() => {
    // 메뉴를 바꾸면 맨 위로 (노트북 목업 안에서는 화면 스크롤 영역 기준)
    const sc = document.querySelector('.lap-scroll')
    if (sc) sc.scrollTop = 0
    else window.scrollTo(0, 0)
  }, [page])
  const current = NAV.flatMap((g) => g.items).find((i) => i.id === page)!
  return (
    <div className="flex min-h-[var(--admin-h,100vh)] flex-col lg:flex-row">
      {/* 사이드바 (좁은 화면에서는 상단 가로 메뉴) */}
      <aside className="shrink-0 bg-brand-deep text-white lg:w-[256px]">
        <div className="lg:sticky lg:top-0 lg:max-h-[var(--admin-h,100vh)] lg:overflow-y-auto">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src="./brand/logo_gimcheon_white.png" alt="김천시" className="h-7" />
          <span className="text-[15px] font-bold text-white/85">완등 인증 관리</span>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-5 lg:pb-8">
          {NAV.map((g) => (
            <div key={g.group} className="flex gap-1 lg:block lg:space-y-0.5">
              <p className="hidden px-3 pb-1.5 text-[13px] font-bold text-white/60 lg:block">{g.group}</p>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => go(it.id)}
                  className={`flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[15px] font-semibold whitespace-nowrap lg:w-full ${page === it.id ? 'bg-white text-brand-deep' : 'text-white/85 hover:bg-white/10'}`}
                >
                  <it.icon size={18} /> {it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-white/95 px-6 py-3 backdrop-blur">
          <p className="flex-1 text-[15px] font-bold text-sub">{current.label}</p>
          <label className="flex items-center gap-2 text-[14px] font-bold">
            회차
            <select value={roundId} onChange={(e) => setRound(e.target.value)} className={`${inputCls} pr-8`}>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({roundStatus(r)})
                </option>
              ))}
            </select>
          </label>
          <a href="?view=app" className="demo-only inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-[14px] font-bold hover:bg-bg">
            <Smartphone size={16} /> 사용자 앱
          </a>
          <span className="text-[14px] font-semibold text-sub">김산림 (산림녹지과)</span>
          <button onClick={logout} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold text-sub hover:bg-alt">
            <LogOut size={16} /> 로그아웃
          </button>
        </header>
        <main className="mx-auto max-w-[1280px] p-6 lg:p-8">
          <Page />
        </main>
      </div>
    </div>
  )
}
