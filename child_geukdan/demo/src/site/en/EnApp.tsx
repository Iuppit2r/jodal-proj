import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Globe, Menu, X } from 'lucide-react'
import { cx } from '../../lib/format'
import { EnAbout, EnHome, EnMembership, EnProduction, EnProductions, EnVisit } from './EnPages'

const NAV = [
  { to: '/site/en/about', label: 'About' },
  { to: '/site/en/productions', label: 'Productions' },
  { to: '/site/en/visit', label: 'Visit' },
  { to: '/site/en/membership', label: 'Membership' },
]

export function EnLogo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="48" height="48" rx="14" fill="#2647C4" />
        <path d="M10 34 Q24 8 38 34" stroke="#FFC933" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="30" r="5" fill="#F2664B" />
        <circle cx="35" cy="14" r="3" fill="#1FB592" />
      </svg>
      <span className={cx('text-sm font-extrabold leading-tight sm:text-base', light ? 'text-white' : 'text-ink')}>
        National Theater for<br className="sm:hidden" /> Children and Youth
      </span>
    </span>
  )
}

function EnLayout() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])
  useEffect(() => {
    const prev = document.documentElement.lang
    document.documentElement.lang = 'en'
    return () => { document.documentElement.lang = prev || 'ko' }
  }, [])

  return (
    <div lang="en" className="flex min-h-screen flex-col bg-white text-ink">
      <a href="#en-main" className="skip-link">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur hc-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/site/en" aria-label="National Theater for Children and Youth — Home"><EnLogo /></Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map(n => (
                <li key={n.to}>
                  <NavLink to={n.to} className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-semibold transition hover:underline hover:underline-offset-4', isActive ? 'text-brand-600' : 'text-ink/80 hover:text-ink')}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/site" lang="ko" className="hidden items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-600 sm:inline-flex"><Globe size={14} aria-hidden />한국어</Link>
            <button className="btn-ghost p-2 md:hidden" aria-expanded={open} aria-controls="en-mnav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="en-mnav" aria-label="Mobile" className="border-t border-line bg-white md:hidden" onClick={e => { if ((e.target as HTMLElement).closest('a')) setOpen(false) }}>
            <ul className="mx-auto max-w-6xl px-4 py-2">
              {NAV.map(n => <li key={n.to}><NavLink to={n.to} className={({ isActive }) => cx('block rounded-lg px-3 py-3 font-semibold', isActive ? 'bg-brand-50 text-brand-600' : 'hover:bg-paper')}>{n.label}</NavLink></li>)}
              <li><Link to="/site" lang="ko" className="block rounded-lg px-3 py-3 font-semibold text-muted hover:bg-paper">한국어 (Korean)</Link></li>
            </ul>
          </nav>
        )}
      </header>

      <main id="en-main" className="flex-1"><Outlet /></main>

      <footer className="mt-16 bg-ink text-white/80 hc-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <EnLogo light />
            <p className="mt-4 text-sm leading-6">373 Cheongpa-ro, Yongsan-gu, Seoul, Republic of Korea<br />Tel +82-1600-6261</p>
            <p className="mt-2 text-xs text-white/60">An affiliated organization of the Ministry of Culture, Sports and Tourism</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Explore</p>
            <ul className="mt-3 space-y-1.5 text-sm">{NAV.map(n => <li key={n.to}><Link to={n.to} className="hover:text-white hover:underline">{n.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Tickets</p>
            <p className="mt-3 text-sm leading-6">Online booking is available on our Korean website only.</p>
            <Link to="/site/performances" lang="ko" className="mt-3 inline-flex rounded-lg bg-sun-400 px-4 py-2 text-sm font-bold text-ink hover:bg-sun-500">Go to Korean site</Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50">© 2026 National Theater for Children and Youth of Korea. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function EnApp() {
  return (
    <Routes>
      <Route element={<EnLayout />}>
        <Route index element={<EnHome />} />
        <Route path="about" element={<EnAbout />} />
        <Route path="productions" element={<EnProductions />} />
        <Route path="productions/:id" element={<EnProduction />} />
        <Route path="visit" element={<EnVisit />} />
        <Route path="membership" element={<EnMembership />} />
        <Route path="*" element={<Navigate to="/site/en" replace />} />
      </Route>
    </Routes>
  )
}
