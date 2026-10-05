import { Link } from 'react-router-dom'
import { Building2, CalendarHeart, FileSearch, Globe, Headphones, Megaphone, UserRound } from 'lucide-react'
import PageHeader from '../PageHeader'
import { Section } from './ui'

export const SITE_MENU: { title: string; icon: typeof Building2; color: string; items: { label: string; to: string; sub?: { label: string; to: string }[] }[] }[] = [
  {
    title: '공연·예매', icon: CalendarHeart, color: 'bg-brand-600',
    items: [
      { label: '공연 목록', to: '/site/performances' },
      { label: '공연일정', to: '/site/schedule', sub: [{ label: '월간 일정', to: '/site/schedule' }, { label: '연간 일정', to: '/site/schedule?view=year' }] },
      { label: '패키지 예매', to: '/site/package' },
      { label: '유료 멤버십', to: '/site/membership' },
    ],
  },
  {
    title: '극단소개', icon: Building2, color: 'bg-coral-500',
    items: [
      { label: '인사말', to: '/site/about/greeting' },
      { label: '극단 소개·연혁', to: '/site/about/overview' },
      { label: '조직도', to: '/site/about/org' },
      { label: 'CI 소개', to: '/site/about/ci' },
    ],
  },
  {
    title: '소식', icon: Megaphone, color: 'bg-mint-500',
    items: [
      { label: '공지사항', to: '/site/news/notice' },
      { label: '웹진', to: '/site/news/webzine' },
      { label: '공연 아카이브', to: '/site/news/archive' },
      { label: '오디션·모집', to: '/site/news/audition' },
    ],
  },
  {
    title: '고객지원', icon: Headphones, color: 'bg-sun-500',
    items: [
      { label: '예매·취소 안내', to: '/site/support/guide' },
      { label: '자주 묻는 질문', to: '/site/support/faq' },
      { label: '1:1 문의', to: '/site/support/inquiry' },
    ],
  },
  {
    title: '정보공개', icon: FileSearch, color: 'bg-ink',
    items: [
      { label: '정보공개 안내', to: '/site/info' },
      { label: '사전정보공표', to: '/site/info/pre' },
      { label: '정보공개 자료실', to: '/site/info/data' },
    ],
  },
  {
    title: '회원', icon: UserRound, color: 'bg-brand-500',
    items: [
      { label: '로그인', to: '/site/login' },
      { label: '회원가입', to: '/site/signup' },
      { label: '마이페이지', to: '/site/mypage', sub: [{ label: '예매확인/취소', to: '/site/mypage' }, { label: '1:1 문의 내역', to: '/site/support/inquiry' }] },
    ],
  },
]

export default function Sitemap() {
  return (
    <>
      <PageHeader crumbs={['사이트맵']} title="사이트맵" desc="국립어린이청소년극단 홈페이지의 전체 메뉴를 한눈에 볼 수 있습니다." />
      <Section>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_MENU.map(({ title, icon: I, color, items }) => (
            <li key={title} className="card overflow-hidden">
              <h2 className={`flex items-center gap-2 px-5 py-4 text-lg font-extrabold text-white ${color}`}><I size={20} aria-hidden />{title}</h2>
              <ul className="space-y-1 p-5">
                {items.map(it => (
                  <li key={it.label}>
                    <Link to={it.to} className="link-u block py-1 font-semibold">{it.label}</Link>
                    {it.sub && (
                      <ul className="mb-1 ml-3 border-l-2 border-line pl-3">
                        {it.sub.map(s => <li key={s.label}><Link to={s.to} className="link-u block py-0.5 text-sm text-muted">{s.label}</Link></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="card flex flex-col justify-between bg-paper p-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold"><Globe size={20} aria-hidden />English</h2>
              <p className="mt-2 text-sm text-muted">About, Productions, Visit, Membership</p>
            </div>
            <Link to="/site/en" className="btn-outline mt-4 w-fit">English site</Link>
          </li>
        </ul>
      </Section>
    </>
  )
}
