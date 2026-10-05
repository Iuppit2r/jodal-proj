import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, Printer, Share2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import Modal from '../../components/Modal'
import { webzines } from '../../data/mock'
import { useStore } from '../../store'
import { NEWS_TABS } from './Notices'
import { Section, fillerParas } from './ui'
import { WebzineCover } from './Webzine'

export default function WebzineDetail() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const close = useCallback(() => setSp({}, { replace: true }), [setSp])
  const toast = useStore(s => s.toast)
  const sorted = [...webzines].sort((a, b) => b.vol - a.vol)
  const idx = sorted.findIndex(w => w.id === id)
  const issue = sorted[idx]
  if (!issue) {
    return (
      <>
        <PageHeader crumbs={['소식', '웹진']} title="웹진" tabs={NEWS_TABS} />
        <Section><p className="py-16 text-center text-muted">존재하지 않는 호입니다.</p><div className="text-center"><Link className="btn-primary" to="/site/news/webzine">웹진 목록</Link></div></Section>
      </>
    )
  }
  const art = issue.articles.find(a => a.id === sp.get('a'))
  const artIdx = art ? issue.articles.indexOf(art) : -1
  const newer = sorted[idx - 1]
  const older = sorted[idx + 1]
  const open = (aid?: string) => setSp(aid ? { a: aid } : {}, { replace: !!art })

  return (
    <>
      <PageHeader crumbs={['소식', '웹진', `Vol.${issue.vol}`]} title={`Vol.${issue.vol} ${issue.title}`} desc={`${issue.year}년 ${issue.season}호 · 기사 ${issue.articles.length}편`} tabs={NEWS_TABS} />
      <Section>
        <div className="grid gap-10 md:grid-cols-[260px_1fr]">
          <div>
            <WebzineCover issue={issue} big className="aspect-[3/4] w-full shadow-lg" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-outline btn-sm" onClick={() => toast(`웹진 Vol.${issue.vol} PDF 다운로드를 시작합니다.`)}><Download size={14} aria-hidden />PDF</button>
              <button className="btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast('링크가 복사되었습니다.') }}><Share2 size={14} aria-hidden />공유</button>
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-lg font-extrabold">이번 호 차례</h2>
            <ol className="space-y-3">
              {issue.articles.map((a, i) => (
                <li key={a.id}>
                  <button onClick={() => open(a.id)} className="group card flex w-full items-start gap-4 p-5 text-left transition hover:border-brand-500 hover:shadow-md">
                    <span className="text-3xl font-black tabular-nums text-brand-100 group-hover:text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="chip bg-brand-50 text-brand-700">{a.section}</span>
                      <span className="mt-2 block text-lg font-bold leading-snug group-hover:underline">{a.title}</span>
                      <span className="mt-1 block text-sm text-muted">{a.lead}</span>
                      <span className="mt-2 block text-xs text-muted">글 {a.author}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <nav aria-label="다른 호" className="mt-8 flex justify-between gap-2 border-t border-line pt-5 text-sm">
              {older ? <Link className="link-u inline-flex items-center gap-1" to={`/site/news/webzine/${older.id}`}><ArrowLeft size={15} aria-hidden />Vol.{older.vol} {older.title}</Link> : <span />}
              {newer ? <Link className="link-u inline-flex items-center gap-1 text-right" to={`/site/news/webzine/${newer.id}`}>Vol.{newer.vol} {newer.title}<ArrowRight size={15} aria-hidden /></Link> : <span />}
            </nav>
            <Link to="/site/news/webzine" className="btn-ghost mt-4">← 웹진 목록</Link>
          </div>
        </div>
      </Section>

      <Modal open={!!art} onClose={close} title={art ? `${art.section} · ${art.title}` : ''} size="lg"
        footer={art && (
          <>
            <button className="btn-ghost mr-auto" onClick={() => window.print()}><Printer size={15} aria-hidden />인쇄</button>
            {artIdx > 0 && <button className="btn-outline" onClick={() => open(issue.articles[artIdx - 1].id)}>이전 기사</button>}
            {artIdx < issue.articles.length - 1 ? <button className="btn-primary" onClick={() => open(issue.articles[artIdx + 1].id)}>다음 기사</button> : <button className="btn-primary" onClick={() => open()}>닫기</button>}
          </>
        )}>
        {art && (
          <article className="mx-auto max-w-2xl py-2">
            <div className="h-40 overflow-hidden rounded-2xl sm:h-56" style={{ background: `linear-gradient(120deg, ${issue.cover[0]}, ${issue.cover[0]}cc 50%, ${issue.cover[1]})` }} aria-hidden>
              <div className="ml-auto mr-8 mt-8 h-24 w-24 rounded-full" style={{ background: issue.cover[2], opacity: 0.85 }} />
            </div>
            <p className="mt-6 text-sm font-bold text-brand-600">Vol.{issue.vol} · {art.section}</p>
            <h3 className="mt-1 text-2xl font-extrabold leading-snug">{art.title}</h3>
            <p className="mt-1 text-sm text-muted">글 {art.author}</p>
            <p className="mt-6 border-l-4 border-sun-400 pl-4 text-lg font-semibold leading-8">{art.lead}</p>
            <div className="mt-6 space-y-5 text-[15px] leading-8 text-ink/90">
              {fillerParas(art.id, 5).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </article>
        )}
      </Modal>
    </>
  )
}
