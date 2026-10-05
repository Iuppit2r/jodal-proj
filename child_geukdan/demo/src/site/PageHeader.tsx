import { Link, NavLink } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cx } from '../lib/format'

/** 서브페이지 공통 상단: 브레드크럼 + 제목 + 3depth 탭 (일관된 메뉴 구조 — SFR-HP-002) */
export default function PageHeader({ crumbs, title, desc, tabs }: {
  crumbs: string[]
  title: string
  desc?: string
  tabs?: { to: string; label: string; end?: boolean }[]
}) {
  return (
    <div className="border-b border-line bg-paper hc-surface">
      <div className="mx-auto max-w-6xl px-4 pb-0 pt-8 sm:pt-10">
        <nav aria-label="현재 위치" className="flex items-center gap-1 text-xs text-muted">
          <Link to="/site" aria-label="홈" className="hover:text-ink"><Home size={13} /></Link>
          {crumbs.map(c => (<span key={c} className="flex items-center gap-1"><ChevronRight size={12} />{c}</span>))}
        </nav>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {desc && <p className="mt-2 text-sm text-muted">{desc}</p>}
        {tabs ? (
          <div className="-mb-px mt-6 flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => cx('whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition',
                  isActive ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}>
                {t.label}
              </NavLink>
            ))}
          </div>
        ) : <div className="h-8" />}
      </div>
    </div>
  )
}
