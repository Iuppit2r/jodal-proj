import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Mail } from 'lucide-react'
import PageHeader from '../PageHeader'
import { webzines } from '../../data/mock'
import type { WebzineIssue } from '../../data/types'
import { useStore } from '../../store'
import { cx } from '../../lib/format'
import { NEWS_TABS } from './Notices'
import { FilterTabs, Section, SectionTitle } from './ui'

/** 웹진 표지 (이미지 대신 팔레트 그래픽) */
export function WebzineCover({ issue, className = '', big = false }: { issue: WebzineIssue; className?: string; big?: boolean }) {
  const [bg, a, b] = issue.cover
  return (
    <div className={cx('relative overflow-hidden rounded-2xl', className)} style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg} 55%, ${bg}dd 100%)` }} role="img" aria-label={`웹진 Vol.${issue.vol} 표지 - ${issue.title}`}>
      <div aria-hidden className="absolute -right-[12%] top-[10%] aspect-square w-[55%] rounded-full" style={{ background: a }} />
      <div aria-hidden className="absolute -left-[10%] bottom-[18%] aspect-square w-[40%] rounded-full opacity-80" style={{ background: b }} />
      <div aria-hidden className="absolute bottom-[34%] right-[22%] aspect-square w-[12%] rounded-full border-4" style={{ borderColor: b }} />
      <div className="absolute inset-0 flex flex-col justify-between p-[7%] text-white">
        <div className="flex items-start justify-between">
          <p className={cx('font-black tracking-tight', big ? 'text-2xl sm:text-3xl' : 'text-base')}>극장<span style={{ color: a }}>+</span>아이</p>
          <p className={cx('text-right font-bold leading-tight', big ? 'text-sm' : 'text-[10px]')}>Vol.{issue.vol}<br />{issue.year} {issue.season}</p>
        </div>
        <p className={cx('font-extrabold leading-snug drop-shadow', big ? 'text-2xl sm:text-3xl' : 'text-sm')}>{issue.title}</p>
      </div>
    </div>
  )
}

export default function Webzine() {
  const toast = useStore(s => s.toast)
  const sorted = useMemo(() => [...webzines].sort((a, b) => b.vol - a.vol), [])
  const latest = sorted[0]
  const years = ['전체', ...Array.from(new Set(sorted.map(w => String(w.year))))] as string[]
  const [year, setYear] = useState('전체')
  const past = sorted.slice(1).filter(w => year === '전체' || String(w.year) === year)
  const [email, setEmail] = useState('')

  return (
    <>
      <PageHeader crumbs={['소식', '웹진']} title="웹진 〈극장+아이〉" desc="계절마다 발행하는 국립어린이청소년극단의 웹진. 창작 노트, 인터뷰, 연구 이야기를 전합니다." tabs={NEWS_TABS} />
      <Section className="space-y-14">
        {/* 최신호 */}
        <div className="grid gap-8 rounded-3xl bg-paper p-5 sm:p-8 md:grid-cols-[300px_1fr]">
          <Link to={`/site/news/webzine/${latest.id}`} className="block transition hover:-translate-y-1">
            <WebzineCover issue={latest} big className="aspect-[3/4] w-full shadow-xl" />
          </Link>
          <div>
            <span className="chip bg-sun-400 text-ink">최신호</span>
            <p className="mt-3 text-sm font-bold text-brand-600">Vol.{latest.vol} · {latest.year} {latest.season}호</p>
            <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{latest.title}</h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {latest.articles.map(a => (
                <li key={a.id}>
                  <Link to={`/site/news/webzine/${latest.id}?a=${a.id}`} className="group flex items-start gap-3 py-4">
                    <span className="chip mt-0.5 shrink-0 bg-white text-brand-600 ring-1 ring-brand-100">{a.section}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold group-hover:text-brand-600 group-hover:underline">{a.title}</span>
                      <span className="mt-1 block text-sm text-muted">{a.lead}</span>
                      <span className="mt-1 block text-xs text-muted">글 {a.author}</span>
                    </span>
                    <ArrowRight size={18} aria-hidden className="mt-1 shrink-0 text-muted group-hover:text-brand-600" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to={`/site/news/webzine/${latest.id}`} className="btn-primary mt-6"><BookOpen size={16} aria-hidden />이번 호 전체 보기</Link>
          </div>
        </div>

        {/* 지난 호 */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle sub="발행 연도와 호수로 지난 웹진을 찾아보세요.">지난 호</SectionTitle>
            <div className="mb-5"><FilterTabs label="발행 연도" items={years} value={year} onChange={setYear} /></div>
          </div>
          {past.length === 0 ? <p className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">해당 연도에 발행된 지난 호가 없습니다.</p> : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {past.map(w => (
                <li key={w.id}>
                  <Link to={`/site/news/webzine/${w.id}`} className="group block">
                    <WebzineCover issue={w} className="aspect-[3/4] w-full transition group-hover:-translate-y-1 group-hover:shadow-lg" />
                    <p className="mt-3 text-xs font-bold text-brand-600">Vol.{w.vol} · {w.year} {w.season}</p>
                    <p className="mt-0.5 font-bold group-hover:underline">{w.title}</p>
                    <p className="text-xs text-muted">기사 {w.articles.length}편</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 구독 */}
        <form className="flex flex-col gap-4 rounded-3xl bg-brand-600 p-6 text-white sm:flex-row sm:items-center sm:p-8"
          onSubmit={e => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) { toast('올바른 이메일 주소를 입력해주세요.', 'warn'); return } toast(`${email}로 웹진 구독 신청이 완료되었습니다.`); setEmail('') }}>
          <div className="flex-1">
            <p className="flex items-center gap-2 text-lg font-extrabold"><Mail size={20} aria-hidden />웹진 뉴스레터 구독</p>
            <p className="mt-1 text-sm text-brand-100">새 호가 발행되면 이메일로 가장 먼저 알려드립니다.</p>
          </div>
          <label htmlFor="wz-mail" className="sr-only">이메일 주소</label>
          <input id="wz-mail" type="email" className="input text-ink sm:w-64" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn-accent shrink-0">구독하기</button>
        </form>
      </Section>
    </>
  )
}
