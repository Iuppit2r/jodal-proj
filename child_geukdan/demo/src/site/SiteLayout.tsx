import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, Contrast, Home as HomeIcon, LogOut, Menu, Ticket, User, X, Globe, Theater } from 'lucide-react'
import { memberTier, useMe, useStore } from '../store'
import * as M from '../data/mock'
import { cx } from '../lib/format'
import { Logo } from './parts/ui'
import { siteHref } from './parts/perf'

const MENU: { label: string; to: string; items: { label: string; to: string }[] }[] = [
  {
    label: '공연', to: '/site/performances', items: [
      { label: '공연안내', to: '/site/performances' },
      { label: '공연일정', to: '/site/schedule' },
      { label: '패키지 예매', to: '/site/package' },
      { label: '예매/취소 안내', to: '/site/support/guide' },
    ],
  },
  {
    label: '소식/참여', to: '/site/news/notice', items: [
      { label: '공지사항', to: '/site/news/notice' },
      { label: '웹진', to: '/site/news/webzine' },
      { label: '아카이브', to: '/site/news/archive' },
      { label: '오디션', to: '/site/news/audition' },
    ],
  },
  { label: '멤버십', to: '/site/membership', items: [{ label: '유료 멤버십', to: '/site/membership' }] },
  {
    label: '마이페이지', to: '/site/mypage', items: [
      { label: '예매 확인/취소', to: '/site/mypage' },
      { label: '쿠폰/예매권', to: '/site/mypage/coupons' },
      { label: '패키지 예매내역', to: '/site/mypage/package' },
      { label: '나의 관심 공연', to: '/site/mypage/favorites' },
      { label: '회원정보 수정', to: '/site/mypage/profile' },
      { label: '1:1 문의', to: '/site/mypage/inquiries' },
    ],
  },
  {
    label: '극단소개', to: '/site/about/greeting', items: [
      { label: '인사말', to: '/site/about/greeting' },
      { label: '개요', to: '/site/about/overview' },
      { label: '조직도', to: '/site/about/org' },
      { label: 'CI소개', to: '/site/about/ci' },
      { label: '정보공개', to: '/site/info' },
    ],
  },
  {
    label: '고객지원', to: '/site/support/faq', items: [
      { label: '자주 하는 질문', to: '/site/support/faq' },
      { label: '1:1 문의', to: '/site/support/inquiry' },
    ],
  },
]

const sectionOf = (path: string) => {
  if (/\/site\/(performances|schedule|package|support\/guide|book)/.test(path)) return 0
  if (path.startsWith('/site/news')) return 1
  if (path.startsWith('/site/membership')) return 2
  if (path.startsWith('/site/mypage')) return 3
  if (/\/site\/(about|info)/.test(path)) return 4
  if (path.startsWith('/site/support')) return 5
  return -1
}

function UtilityBar() {
  const me = useMe()
  const tier = memberTier(me)
  const logout = useStore(s => s.logout)
  const toast = useStore(s => s.toast)
  const fontScale = useStore(s => s.fontScale)
  const contrast = useStore(s => s.contrast)
  const set = useStore(s => s.set)
  const nav = useNavigate()
  return (
    <div className="hidden border-b border-line bg-paper text-xs md:block hc-surface">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-1" role="group" aria-label="글자 크기">
          <span className="mr-1 text-muted">글자크기</span>
          {(['base', 'lg', 'xl'] as const).map((f, i) => (
            <button key={f} onClick={() => set({ fontScale: f })} aria-pressed={fontScale === f}
              className={cx('grid h-6 w-6 place-items-center rounded font-bold', fontScale === f ? 'bg-ink text-white' : 'text-muted hover:bg-white')}
              aria-label={['기본', '크게', '아주 크게'][i]}>
              <span style={{ fontSize: 11 + i * 2 }}>가</span>
            </button>
          ))}
          <button onClick={() => set({ contrast: contrast === 'high' ? 'normal' : 'high' })} aria-pressed={contrast === 'high'}
            className={cx('ml-2 flex items-center gap-1 rounded px-2 py-1', contrast === 'high' ? 'bg-ink text-white' : 'text-muted hover:bg-white')}>
            <Contrast size={12} /> 고대비
          </button>
        </div>
        <div className="flex items-center gap-3 text-muted">
          {me ? (
            <>
              <span className="flex items-center gap-1.5 text-ink">
                <b>{me.name}</b>님
                {tier && <span className="chip px-2 text-[10px] text-white" style={{ background: tier.color }}>{tier.name} 멤버십</span>}
              </span>
              <button className="flex items-center gap-1 link-u" onClick={() => { logout(); toast('로그아웃되었습니다'); nav('/site') }}><LogOut size={12} />로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/site/login" className="link-u">로그인</Link>
              <Link to="/site/signup" className="link-u">회원가입</Link>
            </>
          )}
          <Link to="/site/mypage" className="link-u">마이페이지</Link>
          <Link to="/site/en" className="flex items-center gap-1 link-u" lang="en"><Globe size={12} />ENG</Link>
        </div>
      </div>
    </div>
  )
}

function DesktopNav() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const active = sectionOf(loc.pathname)
  useEffect(() => setOpen(false), [loc.pathname])
  return (
    <div
      ref={ref}
      className="hidden flex-1 lg:block"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={e => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false) }}
      onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
    >
      <nav aria-label="주 메뉴">
        <ul className="flex justify-center">
          {MENU.map((m, i) => (
            <li key={m.label} className="w-[118px] text-center">
              <Link to={m.to} aria-expanded={open}
                className={cx('relative block py-6 text-[16px] font-bold transition hover:text-brand-600',
                  active === i ? 'text-brand-600' : 'text-ink')}>
                {m.label}
                {active === i && <span className="absolute inset-x-6 bottom-3 h-1 rounded-full bg-sun-400" aria-hidden />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={cx('absolute inset-x-0 top-full border-y border-line bg-white shadow-xl transition hc-surface', open ? 'visible opacity-100' : 'invisible opacity-0')}>
        <div className="mx-auto flex max-w-6xl px-4">
          <div className="hidden w-[220px] shrink-0 py-7 pr-6 xl:block">
            <p className="text-lg font-extrabold leading-snug text-brand-600">상상력이 자라는<br />극장으로</p>
            <p className="mt-2 text-xs text-muted">어린이·청소년·가족 모두를 위한<br />국립 공연예술 단체</p>
          </div>
          <div className="flex flex-1 justify-center">
            {MENU.map(m => (
              <ul key={m.label} className="w-[118px] space-y-2.5 border-l border-line/60 py-7 text-center first:border-l-0">
                {m.items.map(it => (
                  <li key={it.label}><Link to={it.to} className="text-sm text-muted link-u">{it.label}</Link></li>
                ))}
              </ul>
            ))}
          </div>
          <div className="hidden w-[220px] xl:block" />
        </div>
      </div>
    </div>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe()
  const tier = memberTier(me)
  const logout = useStore(s => s.logout)
  const fontScale = useStore(s => s.fontScale)
  const contrast = useStore(s => s.contrast)
  const set = useStore(s => s.set)
  const toast = useStore(s => s.toast)
  const loc = useLocation()
  const [exp, setExp] = useState<number>(Math.max(0, sectionOf(loc.pathname)))
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="전체 메뉴"
      className="fixed inset-x-0 bottom-0 top-9 z-50 flex flex-col overflow-y-auto bg-white outline-none lg:hidden hc-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Logo compact />
        <button className="btn-ghost p-2" onClick={onClose} aria-label="메뉴 닫기"><X size={22} /></button>
      </div>
      <div className="bg-gradient-to-br from-brand-600 to-brand-500 px-4 py-5 text-white">
        {me ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{me.name}님, 반가워요!</p>
              {tier ? <span className="chip mt-1 bg-white/20 text-white">{tier.name} 멤버십 · ~{me.membership!.until}</span> : <Link to="/site/membership" onClick={onClose} className="mt-1 inline-block text-xs text-white/80 underline">멤버십 가입하고 선예매 받기</Link>}
            </div>
            <button className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold" onClick={() => { logout(); toast('로그아웃되었습니다'); onClose() }}>로그아웃</button>
          </div>
        ) : (
          <div>
            <p className="font-bold">로그인하고 예매·멤버십 혜택을 누리세요</p>
            <div className="mt-3 flex gap-2">
              <Link to="/site/login" onClick={onClose} className="btn flex-1 bg-white text-brand-700">로그인</Link>
              <Link to="/site/signup" onClick={onClose} className="btn flex-1 bg-sun-400 text-ink">회원가입</Link>
            </div>
          </div>
        )}
      </div>
      <nav aria-label="모바일 주 메뉴" className="flex-1">
        <ul>
          {MENU.map((m, i) => (
            <li key={m.label} className="border-b border-line">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-bold" aria-expanded={exp === i} onClick={() => setExp(exp === i ? -1 : i)}>
                {m.label}<ChevronDown size={18} className={cx('transition', exp === i && 'rotate-180')} />
              </button>
              {exp === i && (
                <ul className="grid grid-cols-2 gap-1 bg-paper px-5 py-3">
                  {m.items.map(it => (
                    <li key={it.label}><NavLink to={it.to} end onClick={onClose} className={({ isActive }) => cx('block rounded-lg px-3 py-2 text-sm', isActive ? 'bg-white font-bold text-brand-600' : 'text-muted')}>{it.label}</NavLink></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-4 text-xs">
        <span className="text-muted">글자크기</span>
        {(['base', 'lg', 'xl'] as const).map((f, i) => (
          <button key={f} onClick={() => set({ fontScale: f })} aria-pressed={fontScale === f} className={cx('rounded-md border px-2.5 py-1.5', fontScale === f ? 'border-ink bg-ink text-white' : 'border-line')}>
            {['기본', '크게', '아주크게'][i]}
          </button>
        ))}
        <button onClick={() => set({ contrast: contrast === 'high' ? 'normal' : 'high' })} aria-pressed={contrast === 'high'} className={cx('rounded-md border px-2.5 py-1.5', contrast === 'high' ? 'border-ink bg-ink text-white' : 'border-line')}>고대비</button>
        <Link to="/site/en" onClick={onClose} className="ml-auto rounded-md border border-line px-2.5 py-1.5" lang="en">ENG</Link>
      </div>
    </div>
  )
}

function Header() {
  const [drawer, setDrawer] = useState(false)
  const me = useMe()
  const loc = useLocation()
  useEffect(() => setDrawer(false), [loc.pathname])
  return (
    <header className="no-print sticky top-9 z-40 bg-white/95 backdrop-blur hc-surface">
      <UtilityBar />
      <div className="relative border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:h-[76px]">
          <Link to="/site" aria-label="국립어린이청소년극단 홈" className="shrink-0"><Logo /></Link>
          <DesktopNav />
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Link to="/site/schedule" className="btn-ghost hidden p-2 sm:inline-flex lg:hidden" aria-label="공연일정"><CalendarDays size={20} /></Link>
            <Link to={me ? '/site/mypage' : '/site/login'} className="btn-ghost p-2 lg:hidden" aria-label={me ? '마이페이지' : '로그인'}><User size={20} /></Link>
            <Link to="/site/performances" className="btn-accent hidden lg:inline-flex"><Ticket size={16} />예매하기</Link>
            <button className="btn-ghost p-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="전체 메뉴 열기" aria-expanded={drawer}><Menu size={24} /></button>
          </div>
        </div>
      </div>
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
    </header>
  )
}

function Footer() {
  const toast = useStore(s => s.toast)
  const policy = (t: string) => (e: React.MouseEvent) => { e.preventDefault(); toast(`${t} 페이지는 시연에서 생략되었습니다`, 'warn') }
  return (
    <footer className="no-print mt-20 bg-ink pb-24 pt-10 text-white/70 md:pb-10 hc-surface">
      <div className="mx-auto max-w-6xl px-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-b border-white/10 pb-5 text-sm">
          <li><a href="#" onClick={policy('개인정보처리방침')} className="font-bold text-sun-300 link-u">개인정보처리방침</a></li>
          <li><a href="#" onClick={policy('이용약관')} className="link-u hover:text-white">이용약관</a></li>
          <li><a href="#" onClick={policy('이메일무단수집거부')} className="link-u hover:text-white">이메일무단수집거부</a></li>
          <li><Link to="/site/sitemap" className="link-u hover:text-white">사이트맵</Link></li>
          <li><Link to="/site/info" className="link-u hover:text-white">정보공개</Link></li>
        </ul>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5 text-[13px]">
            <Logo light compact />
            <address className="mt-3 not-italic">(04310) 서울특별시 용산구 청파로 373 국립어린이청소년극단</address>
            <p>예매문의 <a href="tel:1600-6261" className="font-bold text-white link-u">1600-6261</a> (평일 10:00~18:00, 주말·공휴일 휴무) · 단체관람 내선 2번</p>
            <p>사업자등록번호 000-00-00000 · 대표 국립어린이청소년극단장</p>
            <p className="pt-2 text-xs text-white/40">Copyright © 2026 National Theater for Children and Youth of Korea. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-28 flex-col items-center justify-center rounded-lg border border-white/20 text-center text-[10px] leading-tight" role="img" aria-label="웹 접근성 품질인증 마크 (시연용 자리표시)">
              <span className="text-base font-black text-sun-300">WA</span>웹 접근성<br />품질인증
            </div>
            <div className="flex h-16 w-28 flex-col items-center justify-center rounded-lg border border-white/20 text-center text-[10px] leading-tight" role="img" aria-label="공공누리 마크 (시연용 자리표시)">
              <span className="text-base font-black text-mint-400">KOGL</span>공공누리
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function BottomTabs() {
  const me = useMe()
  const tab = ({ isActive }: { isActive: boolean }) => cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold', isActive ? 'text-brand-600' : 'text-muted')
  return (
    <nav aria-label="하단 바로가기" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] pr-16 backdrop-blur md:hidden hc-surface">
      <div className="flex">
        <NavLink to="/site" end className={tab}><HomeIcon size={20} />홈</NavLink>
        <NavLink to="/site/performances" className={tab}><Theater size={20} />공연</NavLink>
        <NavLink to="/site/mypage" end className={tab}><Ticket size={20} />예매확인</NavLink>
        <NavLink to={me ? '/site/mypage/profile' : '/site/login'} className={tab}><User size={20} />마이</NavLink>
      </div>
    </nav>
  )
}

const POPUP_KEY = 'ntcy-popup-hide'
function readHidden(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(POPUP_KEY) ?? '{}') } catch { return {} }
}

function PopupLayer() {
  const popups = useStore(s => s.popups)
  const nav = useNavigate()
  const [closed, setClosed] = useState<string[]>([])
  const [hidden, setHidden] = useState(readHidden)
  const list = popups.filter(p => p.active && p.start <= M.TODAY && p.end >= M.TODAY && hidden[p.id] !== M.TODAY && !closed.includes(p.id))
  if (!list.length) return null
  const hideToday = (id: string) => {
    const next = { ...hidden, [id]: M.TODAY }
    try { localStorage.setItem(POPUP_KEY, JSON.stringify(next)) } catch { /* 저장 불가 환경 무시 */ }
    setHidden(next)
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 top-28 z-[44] flex flex-wrap justify-center gap-4 px-4 md:left-8 md:right-auto md:top-40 md:justify-start">
      {list.slice(0, 3).map((p, i) => (
        <div key={p.id} role="dialog" aria-label={`알림 팝업: ${p.title}`} className="pointer-events-auto w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-line hc-surface">
          <div className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-mint-500 px-6 pb-6 pt-8 text-white">
            <svg viewBox="0 0 100 100" className="absolute right-3 top-3 h-16 w-16 opacity-80" aria-hidden>
              <circle cx="50" cy="50" r="30" fill="#ffc933" /><path d="M35 55 q15 15 30 0" stroke="#16181d" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="40" cy="42" r="4" fill="#16181d" /><circle cx="60" cy="42" r="4" fill="#16181d" />
            </svg>
            <p className="text-xs font-semibold text-sun-300">NOTICE {i + 1}</p>
            <h2 className="mt-1 pr-16 text-xl font-extrabold leading-snug">{p.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">{p.body}</p>
            {p.link && (
              <button className="btn mt-4 bg-white text-brand-700" onClick={() => { setClosed(c => [...c, p.id]); nav(siteHref(p.link!)) }}>자세히 보기</button>
            )}
          </div>
          <div className="flex text-sm">
            <button className="flex-1 px-4 py-3 text-left text-muted hover:bg-paper" onClick={() => hideToday(p.id)}>오늘 하루 보지 않기</button>
            <button className="border-l border-line px-5 py-3 font-semibold hover:bg-paper" onClick={() => setClosed(c => [...c, p.id])}>닫기</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SiteLayout() {
  const loc = useLocation()
  const isHome = loc.pathname === '/site' || loc.pathname === '/site/'
  const hideTabs = loc.pathname.startsWith('/site/book/') && !loc.pathname.includes('/complete/')
  return (
    <div className="min-h-screen bg-white hc-surface">
      <a href="#main" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus() }}>본문 바로가기</a>
      <a href="#gnb" className="skip-link" onClick={e => { e.preventDefault(); [...document.querySelectorAll<HTMLElement>('header nav[aria-label="주 메뉴"] a, header button[aria-label="전체 메뉴 열기"]')].find(el => el.offsetParent !== null)?.focus() }}>주 메뉴 바로가기</a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      {!hideTabs && <BottomTabs />}
      {isHome && <PopupLayer />}
    </div>
  )
}
