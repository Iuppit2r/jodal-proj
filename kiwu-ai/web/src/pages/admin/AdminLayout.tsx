import clsx from 'clsx'
import { BarChart3, Bell, Database, LogOut, Menu, MessagesSquare, RefreshCw, Settings, ShieldBan, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ADMINS, CHANGES } from '../../data/admin'
import { Badge, CountBadge, LogoMark, ToastProvider } from './ui'

type NavItem = { to: string; label: string; icon: typeof BarChart3; end?: boolean; count?: number; alert?: boolean }

// 메뉴는 RFP에 명시된 기능만 구성
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: '통계',
    items: [{ to: '/admin', end: true, label: '이용 현황 통계', icon: BarChart3 }],
  },
  {
    label: '지식',
    items: [
      { to: '/admin/knowledge', label: '학습자료 관리', icon: Database },
      { to: '/admin/updates', label: '최신성 관리', icon: RefreshCw, count: 2, alert: true },
    ],
  },
  {
    label: '운영',
    items: [
      { to: '/admin/conversations', label: '질의응답 검수', icon: MessagesSquare, count: 3 },
      { to: '/admin/safety', label: '유해 질의 차단', icon: ShieldBan },
    ],
  },
  {
    label: '설정',
    items: [{ to: '/admin/settings', label: '환경설정·권한', icon: Settings }],
  },
]

const FLAT = GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
const ME = ADMINS[0]

export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()
  const current = FLAT.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 p-4">
        <LogoMark className="size-8" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-zinc-900">ESG 챗봇 관리자</span>
          <span className="block truncate text-xs text-zinc-500">경인여자대학교</span>
        </span>
      </div>

      <nav aria-label="관리자 메뉴" className="mt-2 flex-1 space-y-5 overflow-y-auto px-3 scroll-thin">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-1 px-2 text-[11px] font-medium text-zinc-400">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.end}
                    onClick={() => setNavOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'group flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm transition',
                        isActive
                          ? 'bg-white font-medium text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,.06)] ring-1 ring-zinc-200'
                          : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <n.icon className={clsx('size-4', isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600')} aria-hidden />
                        <span className="flex-1">{n.label}</span>
                        {n.count ? <CountBadge value={n.count} tone={n.alert ? 'primary' : 'neutral'} /> : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-1.5">
          <span className="grid size-8 place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">{ME.name[0]}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium text-zinc-900">{ME.name}</span>
            <span className="block truncate text-xs text-zinc-500">{ME.dept} · {ME.role}</span>
          </span>
          <Link to="/admin/login" aria-label="로그아웃" title="로그아웃" className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700">
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-white text-zinc-900">
        <a href="#admin-main" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-white px-3 py-2 text-sm shadow">
          본문 바로가기
        </a>

        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 lg:block">{sidebar}</aside>

        {navOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="관리자 메뉴">
            <div className="absolute inset-0 bg-zinc-900/30" onClick={() => setNavOpen(false)} />
            <aside className="drawer-in relative h-full w-64 border-r border-zinc-200 bg-zinc-50">
              <button onClick={() => setNavOpen(false)} aria-label="메뉴 닫기" className="absolute top-4 -right-11 grid size-9 place-items-center rounded-full bg-white shadow">
                <X className="size-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur lg:px-8">
            <button onClick={() => setNavOpen(true)} aria-label="메뉴 열기" className="-ml-1 grid size-8 place-items-center rounded-lg hover:bg-zinc-100 lg:hidden">
              <Menu className="size-4.5" />
            </button>
            <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="text-zinc-400 max-sm:hidden">{current?.group}</span>
              <span className="text-zinc-300 max-sm:hidden" aria-hidden>/</span>
              <span className="truncate font-medium text-zinc-900" aria-current="page">{current?.label}</span>
            </nav>
            <div className="ml-auto">
              <Notifications />
            </div>
          </header>
          <main id="admin-main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

/** 감지된 변경 사항을 중요도별로 관리자에게 통지 */
function Notifications() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pending = CHANGES.filter((c) => c.stage < 4)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`변경 통지 ${pending.length}건`}
        aria-expanded={open}
        className="relative grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Bell className="size-4.5" />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-500" />
      </button>
      {open && (
        <div className="anim-pop absolute top-full right-0 z-40 mt-1 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <p className="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold">변경 통지</p>
          <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto scroll-thin">
            {pending.map((c) => (
              <li key={c.id}>
                <Link to="/admin/updates" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <Badge dot tone={c.severity === '긴급' ? 'bad' : c.severity === '중요' ? 'warn' : 'neutral'}>{c.severity}</Badge>
                    <span className="text-xs text-zinc-400 tabular-nums">{c.detectedAt.slice(5)}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-800">{c.title}</p>
                  <p className="text-xs text-zinc-500">{c.source}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
