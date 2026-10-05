import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Armchair, BarChart3, Calculator, ChartLine, Crown, Drama, ExternalLink, Globe, LayoutDashboard, LogOut, Menu, Package,
  Radio, ScanLine, Search, Settings, Ticket, TriangleAlert, Users, X, ChartColumn,
} from 'lucide-react'
import { useStore } from '../store'
import { cx } from '../lib/format'
import { useAdminLocal } from './adminStore'

interface Item { to: string; label: string; icon: ReactNode; end?: boolean; badge?: number }

function useMenu(): { group: string; items: Item[] }[] {
  const inquiries = useStore(s => s.inquiries)
  const kopis = useStore(s => s.kopisLogs)
  const open = inquiries.filter(q => q.status !== '답변완료').length
  const kfail = kopis.filter(k => k.status === '실패').length
  return [
    { group: '', items: [{ to: '/admin', label: '대시보드', icon: <LayoutDashboard size={16} />, end: true }] },
    {
      group: 'TMS 티켓관리', items: [
        { to: '/admin/performances', label: '공연관리', icon: <Drama size={16} /> },
        { to: '/admin/seats', label: '좌석관리', icon: <Armchair size={16} /> },
        { to: '/admin/bookings', label: '예매관리', icon: <Ticket size={16} /> },
        { to: '/admin/tickets', label: '발권·검표', icon: <ScanLine size={16} /> },
        { to: '/admin/settlement', label: '정산관리', icon: <Calculator size={16} /> },
        { to: '/admin/reports', label: '판매보고서', icon: <BarChart3 size={16} /> },
        { to: '/admin/kopis', label: '통합전산망(KOPIS)', icon: <Radio size={16} />, badge: kfail || undefined },
        { to: '/admin/packages', label: '패키지 관리', icon: <Package size={16} /> },
      ],
    },
    {
      group: '회원', items: [
        { to: '/admin/membership', label: '유료회원', icon: <Crown size={16} /> },
        { to: '/admin/crm', label: '회원·CRM', icon: <Users size={16} />, badge: open || undefined },
      ],
    },
    {
      group: '홈페이지·운영', items: [
        { to: '/admin/cms', label: 'CMS (홈페이지 관리)', icon: <Globe size={16} /> },
        { to: '/admin/stats', label: '통계', icon: <ChartLine size={16} /> },
        { to: '/admin/system', label: '시스템설정', icon: <Settings size={16} /> },
      ],
    },
  ]
}

function Sidebar({ onNav }: { onNav?: () => void }) {
  const menu = useMenu()
  return (
    <nav className="flex h-full flex-col" aria-label="관리자 메뉴">
      <Link to="/admin" onClick={onNav} className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sun-400 text-sm font-black text-ink">국</span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold text-white">통합관리시스템</span>
          <span className="block text-[10px] text-white/50">국립어린이청소년극단</span>
        </span>
      </Link>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {menu.map(g => (
          <div key={g.group} className="mb-3">
            {g.group && <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-white/40">{g.group}</div>}
            <ul className="space-y-0.5">
              {g.items.map(it => (
                <li key={it.to}>
                  <NavLink to={it.to} end={it.end} onClick={onNav}
                    className={({ isActive }) => cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition',
                      isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
                    {it.icon}<span className="flex-1">{it.label}</span>
                    {it.badge ? <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{it.badge}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-[10px] leading-relaxed text-white/40">
        v1.0 시연판 · 접속 IP 10.10.2.15<br />세션 만료 30분 · 모든 처리 이력 기록
      </div>
    </nav>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [pwBanner, setPwBanner] = useState(true)
  const adminId = useStore(s => s.adminId)
  const set = useStore(s => s.set)
  const log = useStore(s => s.log)
  const users = useAdminLocal(s => s.adminUsers)
  const me = users.find(u => u.id === adminId)
  const nav = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  const logout = () => {
    log('로그아웃', me?.name ?? '관리자')
    set({ adminId: null })
  }
  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    nav(`/admin/bookings?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="min-h-[calc(100vh-36px)] bg-paper">
      {/* 데스크톱 사이드바 */}
      <aside className="no-print fixed bottom-0 left-0 top-9 z-30 hidden w-60 bg-brand-900 lg:block"><Sidebar /></aside>
      {/* 모바일 드로어 */}
      {open && (
        <div className="no-print fixed inset-0 top-9 z-40 bg-black/40 lg:hidden" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
          <aside className="relative h-full w-64 bg-brand-900 shadow-2xl">
            <button className="absolute right-2 top-3 p-2 text-white/70" onClick={() => setOpen(false)} aria-label="메뉴 닫기"><X size={18} /></button>
            <Sidebar onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="no-print sticky top-9 z-20 flex h-14 items-center gap-2 border-b border-line bg-white/95 px-3 backdrop-blur sm:px-5">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="메뉴 열기"><Menu size={20} /></button>
          <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input bg-paper py-2 pl-9" placeholder="예매번호 · 예매자명 · 휴대폰 뒷자리 통합검색" value={q} onChange={e => setQ(e.target.value)} aria-label="통합검색" />
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link to="/site" target="_blank" className="btn-ghost btn-sm hidden md:inline-flex"><ExternalLink size={14} />홈페이지 보기</Link>
            <Link to="/pos" className="btn-ghost btn-sm hidden md:inline-flex"><ChartColumn size={14} />현장판매 POS</Link>
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-bold">{me?.name ?? '관리자'}</div>
              <div className="text-[10px] text-muted">{me?.role ?? '시스템관리자'} · {me?.loginId}</div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{(me?.name ?? '관')[0]}</span>
            <button className="btn-ghost btn-sm" onClick={logout} title="로그아웃"><LogOut size={15} /><span className="hidden sm:inline">로그아웃</span></button>
          </div>
        </header>
        {pwBanner && (
          <div className="no-print flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">
            <TriangleAlert size={14} className="shrink-0" />
            <span className="flex-1">비밀번호 변경 후 <b>90일 경과</b> — 변경을 권고합니다. (보안정책: 관리자 비밀번호 3개월 주기 변경)</span>
            <button className="font-semibold underline" onClick={() => { setPwBanner(false); log('비밀번호 변경 안내 확인', me?.loginId ?? 'admin') }}>나중에</button>
          </div>
        )}
        <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
