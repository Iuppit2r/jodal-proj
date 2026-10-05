import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronRight, CircleHelp, ExternalLink, Globe, LayoutGrid, Lock, Menu, Route, Search, type LucideIcon } from 'lucide-react'
import { LANGS, useI18n, type Lang } from '../i18n'
import BrandMark from './BrandMark'
import { ProposalPanel, ProposalToggle } from '../proposal'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; count?: string; external?: boolean; locked?: boolean }
export interface NavGroup { label: string; items: NavItem[] }

/** 서비스별 독립 콘솔 레이아웃(사이드바 + 상단 바). 서비스끼리 메뉴를 공유하지 않는다. */
export default function AppShell({ product, variant, groups, user, showLang, fullBleed = [], access }: {
  product: string
  variant?: 'console'
  /** 자체 스크롤 영역을 가진 화면(채팅 등) */
  fullBleed?: string[]
  groups: NavGroup[]
  user: { initial: ReactNode; name: string; meta: ReactNode }
  showLang?: boolean
  /** 진입 경로 · 로그인 상태 카드(사이드바 하단) */
  access?: ReactNode
}) {
  const { t, lang, setLang } = useI18n()
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => setNavOpen(false), [pathname])

  const items = groups.flatMap((g) => g.items.filter((i) => !i.external))
  const current = [...items].sort((a, b) => b.to.length - a.to.length).find((n) => pathname.startsWith(n.to))

  return (
    <div className="shell">
      <a className="skip-link" href="#main">{t('skip')}</a>

      <aside className={`sidebar${variant ? ` ${variant}` : ''}${navOpen ? ' open' : ''}`} aria-label={`${product} 메뉴`}>
        <div className="brand">
          <span className="brand-mark"><BrandMark /></span>
          {product}
        </div>
        {groups.map((g) => (
          <nav className="nav-group" key={g.label} aria-label={g.label}>
            <div className="nav-label">{g.label}</div>
            {g.items.map(({ to, label, icon: Icon, end, count, external, locked }) =>
              external ? (
                <a key={to} href={to} target="_blank" rel="noreferrer" className="nav-item">
                  <Icon size={17} strokeWidth={1.9} />
                  {label}
                  <ExternalLink size={14} className="faint" style={{ marginLeft: 'auto' }} />
                </a>
              ) : (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <Icon size={17} strokeWidth={1.9} />
                  {label}
                  {count && <span className="count">{count}</span>}
                  {locked && <Lock size={14} className="nav-lock" aria-label="로그인 필요" />}
                </NavLink>
              ),
            )}
          </nav>
        ))}

        <div className="sidebar-foot">
          {showLang && (
            <div className="input-icon">
              <Globe size={15} />
              <label className="sr-only" htmlFor="lang">Language</label>
              <select id="lang" className="select input" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          )}
          {access}
          <div className="user-card">
            <span className="avatar" aria-hidden>{user.initial}</span>
            <div className="user-meta">
              <b>{user.name}</b>
              <span>{user.meta}</span>
            </div>
          </div>
        </div>
      </aside>
      {navOpen && <div className="backdrop" style={{ zIndex: 55 }} onClick={() => setNavOpen(false)} />}

      <div className="content">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon menu-btn" aria-label="메뉴 열기" onClick={() => setNavOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="crumbs">
            <span className="hide-md">{product}</span>
            {current && <><ChevronRight size={14} className="hide-md" /><b>{current.label}</b></>}
          </div>
          <div className="topbar-actions">
            <Link to="/" className="btn btn-ghost btn-sm" aria-label="제안 개요"><LayoutGrid size={14} /><span className="hide-md">제안 개요</span></Link>
            <Link to="/entry" className="btn btn-ghost btn-sm" aria-label="진입 경로"><Route size={14} /><span className="hide-md">진입 경로</span></Link>
            <ProposalToggle />
            <button className="search-trigger" aria-label={t('search')}>
              <Search size={15} />
              {t('search')}
              <kbd>⌘K</kbd>
            </button>
            <button className="btn btn-ghost btn-icon" aria-label="알림"><Bell size={17} /></button>
            <button className="btn btn-ghost btn-icon" aria-label="도움말"><CircleHelp size={17} /></button>
          </div>
        </header>
        <div className="workspace">
          <main id="main" className={fullBleed.some((p) => pathname.startsWith(p)) ? 'bleed' : 'scroll'} tabIndex={-1}>
            <Outlet />
          </main>
          <ProposalPanel />
        </div>
      </div>
    </div>
  )
}
