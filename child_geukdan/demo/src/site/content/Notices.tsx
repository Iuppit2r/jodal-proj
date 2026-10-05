import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Megaphone, Paperclip, Search } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useStore } from '../../store'
import type { Notice } from '../../data/types'
import { cx } from '../../lib/format'
import { Empty, FilterTabs, Pagination, Section, catTone } from './ui'

export const NOTICE_CATS = ['전체', '공지', '공연', '채용', '입찰', '이벤트'] as const
type Cat = (typeof NOTICE_CATS)[number]
const FIELDS = [['title', '제목'], ['body', '내용'], ['all', '제목+내용']] as const
type Field = (typeof FIELDS)[number][0]
const PER = 10

export const NEWS_TABS = [
  { to: '/site/news/notice', label: '공지사항' },
  { to: '/site/news/webzine', label: '웹진' },
  { to: '/site/news/archive', label: '공연 아카이브' },
  { to: '/site/news/audition', label: '오디션·모집' },
]

/** 고정글 우선 + 최신순 */
export function sortNotices(list: Notice[]) {
  return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export default function Notices() {
  const notices = useStore(s => s.notices)
  const [sp, setSp] = useSearchParams()
  const cat = (NOTICE_CATS as readonly string[]).includes(sp.get('cat') ?? '') ? (sp.get('cat') as Cat) : '전체'
  const q = sp.get('q') ?? ''
  const field = (sp.get('f') as Field) || 'all'
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const [draft, setDraft] = useState(q)
  const [draftField, setDraftField] = useState<Field>(field)

  const update = (p: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(p)) { if (v) next.set(k, v); else next.delete(k) }
    setSp(next)
  }

  const { pinned, rest } = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const hit = (n: Notice) => !kw || (field !== 'body' && n.title.toLowerCase().includes(kw)) || (field !== 'title' && n.body.toLowerCase().includes(kw))
    const list = sortNotices(notices).filter(n => (cat === '전체' || n.category === cat) && hit(n))
    return { pinned: kw ? [] : list.filter(n => n.pinned), rest: kw ? list : list.filter(n => !n.pinned) }
  }, [notices, cat, q, field])

  const totalPages = Math.max(1, Math.ceil(rest.length / PER))
  const cur = Math.min(page, totalPages)
  const rows = rest.slice((cur - 1) * PER, cur * PER)
  const total = pinned.length + rest.length

  const submit = (e: FormEvent) => { e.preventDefault(); update({ q: draft.trim() || undefined, f: draftField === 'all' ? undefined : draftField, page: undefined }) }

  return (
    <>
      <PageHeader crumbs={['소식', '공지사항']} title="공지사항" desc="극단의 새로운 소식과 공연·채용·입찰 공고를 알려드립니다." tabs={NEWS_TABS} />
      <Section>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs label="게시판 분류" items={NOTICE_CATS} value={cat} onChange={c => update({ cat: c === '전체' ? undefined : c, page: undefined })} />
          <form onSubmit={submit} role="search" className="flex w-full gap-2 lg:w-auto">
            <label htmlFor="nf" className="sr-only">검색 항목</label>
            <select id="nf" className="input w-28 shrink-0" value={draftField} onChange={e => setDraftField(e.target.value as Field)}>
              {FIELDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label htmlFor="nq" className="sr-only">검색어</label>
            <input id="nq" className="input min-w-0 flex-1 lg:w-60" placeholder="검색어를 입력하세요" value={draft} onChange={e => setDraft(e.target.value)} />
            <button className="btn-primary shrink-0" aria-label="검색"><Search size={16} aria-hidden /><span className="hidden sm:inline">검색</span></button>
          </form>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <p className="text-muted">총 <b className="text-brand-600">{total}</b>건 {q && <>· “{q}” 검색 결과 <button className="link-u ml-1 text-xs underline" onClick={() => { setDraft(''); update({ q: undefined, f: undefined, page: undefined }) }}>검색 초기화</button></>}</p>
          <p className="text-muted">{cur} / {totalPages} 페이지</p>
        </div>

        {total === 0 ? <Empty /> : (
          <>
            {/* 데스크톱 표 */}
            <table className="hidden w-full border-t-2 border-ink text-sm md:table">
              <caption className="sr-only">공지사항 목록 - 번호, 분류, 제목, 첨부, 등록일, 조회수</caption>
              <thead>
                <tr className="border-b border-line bg-paper text-muted">
                  <th scope="col" className="w-20 py-3 font-semibold">번호</th>
                  <th scope="col" className="w-24 py-3 font-semibold">분류</th>
                  <th scope="col" className="py-3 font-semibold">제목</th>
                  <th scope="col" className="w-16 py-3 font-semibold">첨부</th>
                  <th scope="col" className="w-28 py-3 font-semibold">등록일</th>
                  <th scope="col" className="w-20 py-3 font-semibold">조회</th>
                </tr>
              </thead>
              <tbody>
                {[...pinned, ...rows].map(n => {
                  const isPin = n.pinned && !q
                  const no = isPin ? null : rest.length - rest.indexOf(n)
                  return (
                    <tr key={n.id} className={cx('border-b border-line text-center hover:bg-brand-50/40', isPin && 'bg-sun-300/15')}>
                      <td className="py-3.5">{isPin ? <span className="chip bg-sun-400 text-ink"><Megaphone size={12} className="mr-0.5" aria-hidden />공지</span> : no}</td>
                      <td><span className={cx('chip', catTone[n.category])}>{n.category}</span></td>
                      <td className="px-3 text-left">
                        <Link to={`/site/news/notice/${n.id}`} className={cx('link-u line-clamp-1', isPin && 'font-bold')}>{n.title}</Link>
                        {n.date >= '2026-09-28' && <span className="chip ml-1 bg-coral-500 px-1.5 text-[10px] text-white">N</span>}
                      </td>
                      <td>{n.files?.length ? <Paperclip size={15} className="mx-auto text-muted" aria-label={`첨부파일 ${n.files.length}개`} /> : <span className="sr-only">없음</span>}</td>
                      <td className="tabular-nums text-muted">{n.date.replace(/-/g, '.')}</td>
                      <td className="tabular-nums text-muted">{n.views.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* 모바일 카드 */}
            <ul className="space-y-2 md:hidden">
              {[...pinned, ...rows].map(n => (
                <li key={n.id}>
                  <Link to={`/site/news/notice/${n.id}`} className={cx('card block p-4 active:bg-paper', n.pinned && !q && 'border-sun-400 bg-sun-300/10')}>
                    <div className="flex items-center gap-1.5">
                      {n.pinned && !q && <span className="chip bg-sun-400 text-ink">공지</span>}
                      <span className={cx('chip', catTone[n.category])}>{n.category}</span>
                      {n.files?.length ? <Paperclip size={13} className="text-muted" aria-label="첨부파일 있음" /> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 font-semibold">{n.title}</p>
                    <p className="mt-2 flex items-center gap-3 text-xs text-muted">
                      <span>{n.date.replace(/-/g, '.')}</span>
                      <span className="inline-flex items-center gap-1"><Eye size={12} aria-hidden />{n.views.toLocaleString()}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={cur} total={totalPages} onChange={p => { update({ page: p === 1 ? undefined : String(p) }); window.scrollTo({ top: 0 }) }} />
          </>
        )}
      </Section>
    </>
  )
}
