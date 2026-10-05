import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Download, Eye, FileText, Heart, List, MessageCircle, Paperclip, Share2, Trash2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useMe, useStore } from '../../store'
import { cx, fmtDate, maskName } from '../../lib/format'
import { NEWS_TABS, sortNotices } from './Notices'
import { Section, catTone } from './ui'

interface Comment { id: string; name: string; body: string; at: string; mine?: boolean }

export default function NoticeDetail() {
  const { id } = useParams()
  return <Detail key={id} id={id} />
}

function Detail({ id }: { id?: string }) {
  const nav = useNavigate()
  const notices = useStore(s => s.notices)
  const toast = useStore(s => s.toast)
  const me = useMe()
  const sorted = useMemo(() => sortNotices(notices), [notices])
  const idx = sorted.findIndex(n => n.id === id)
  const n = sorted[idx]

  const [liked, setLiked] = useState(false)
  const baseLikes = n ? (n.views % 97) + 3 : 0
  const [comments, setComments] = useState<Comment[]>(() => n ? [
    { id: 'c1', name: '이서윤', body: '좋은 소식 감사합니다! 아이와 꼭 보러 갈게요.', at: '2026-10-02 09:14' },
    { id: 'c2', name: '박준호', body: '안내 잘 확인했습니다.', at: '2026-10-03 18:40' },
  ] : [])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')

  if (!n) {
    return (
      <>
        <PageHeader crumbs={['소식', '공지사항']} title="공지사항" tabs={NEWS_TABS} />
        <Section><p className="py-16 text-center text-muted">삭제되었거나 존재하지 않는 게시물입니다.</p><div className="text-center"><Link to="/site/news/notice" className="btn-primary">목록으로</Link></div></Section>
      </>
    )
  }
  const prev = sorted[idx + 1]
  const next = sorted[idx - 1]

  const addComment = (e: FormEvent) => {
    e.preventDefault()
    if (!me) { toast('댓글은 로그인 후 작성할 수 있습니다.', 'warn'); return }
    if (text.trim().length < 2) { setErr('댓글을 2자 이상 입력해주세요.'); return }
    setComments(c => [...c, { id: 'c' + Date.now(), name: me.name, body: text.trim(), at: '2026-10-05 ' + new Date().toTimeString().slice(0, 5), mine: true }])
    setText(''); setErr('')
    toast('댓글이 등록되었습니다.')
  }

  return (
    <>
      <PageHeader crumbs={['소식', '공지사항']} title="공지사항" tabs={NEWS_TABS} />
      <Section>
        <article className="border-t-2 border-ink">
          <header className="border-b border-line px-1 py-6 sm:px-4">
            <span className={cx('chip', catTone[n.category])}>{n.category}</span>
            <h2 className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">{n.title}</h2>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <div className="flex gap-1"><dt>작성자</dt><dd className="text-ink">{n.category === '채용' || n.category === '입찰' ? '경영관리팀' : '홍보마케팅팀'}</dd></div>
              <div className="flex gap-1"><dt>등록일</dt><dd className="text-ink">{fmtDate(n.date)}</dd></div>
              <div className="flex items-center gap-1"><dt><Eye size={14} aria-label="조회수" /></dt><dd className="text-ink">{(n.views + 1).toLocaleString()}</dd></div>
            </dl>
          </header>

          {n.files?.length ? (
            <div className="border-b border-line bg-paper px-4 py-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-bold text-muted"><Paperclip size={13} aria-hidden />첨부파일 {n.files.length}</p>
              <ul className="flex flex-wrap gap-2">
                {n.files.map(f => (
                  <li key={f}>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:border-brand-500 hover:text-brand-600"
                      onClick={() => toast(`${f} 다운로드를 시작합니다.`)}>
                      <FileText size={15} aria-hidden />{f}<Download size={14} aria-hidden className="text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="min-h-48 space-y-4 px-1 py-8 leading-8 text-ink/90 sm:px-4">
            <p>{n.body}</p>
            <p>자세한 사항은 국립어린이청소년극단 고객센터(1600-6261) 또는 홈페이지 1:1 문의를 이용해주시기 바랍니다.</p>
            <p>감사합니다.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-y border-line py-5">
            <button onClick={() => { setLiked(v => !v); if (!liked) toast('이 글을 좋아합니다.') }} aria-pressed={liked}
              className={cx('inline-flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-semibold transition',
                liked ? 'border-coral-500 bg-coral-500 text-white' : 'border-line hover:border-coral-500 hover:text-coral-500')}>
              <Heart size={16} aria-hidden fill={liked ? 'currentColor' : 'none'} />좋아요 {baseLikes + (liked ? 1 : 0)}
            </button>
            <button className="btn-outline rounded-full" onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast('게시물 주소가 복사되었습니다.') }}>
              <Share2 size={16} aria-hidden />공유
            </button>
          </div>
        </article>

        {/* 댓글 */}
        <section aria-labelledby="cmt" className="mt-8">
          <h3 id="cmt" className="mb-3 flex items-center gap-1.5 font-bold"><MessageCircle size={18} aria-hidden />댓글 <span className="text-brand-600">{comments.length}</span></h3>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {comments.map(c => (
              <li key={c.id} className="flex gap-3 p-4">
                <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><b>{c.mine ? c.name : maskName(c.name)}</b> <span className="ml-1 text-xs text-muted">{c.at}</span></p>
                  <p className="mt-1 break-words text-sm text-ink/90">{c.body}</p>
                </div>
                {c.mine && <button className="btn-ghost btn-sm self-start" aria-label="댓글 삭제" onClick={() => { setComments(cs => cs.filter(x => x.id !== c.id)); toast('댓글이 삭제되었습니다.') }}><Trash2 size={14} /></button>}
              </li>
            ))}
          </ul>
          <form onSubmit={addComment} className="mt-3">
            <label htmlFor="cmt-input" className="sr-only">댓글 입력</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea id="cmt-input" rows={2} maxLength={300} className="input flex-1 resize-none" aria-invalid={!!err} aria-describedby={err ? 'cmt-err' : undefined}
                placeholder={me ? '댓글을 입력하세요 (최대 300자). 욕설·비방 글은 관리자에 의해 삭제될 수 있습니다.' : '로그인 후 댓글을 작성할 수 있습니다.'}
                value={text} onChange={e => setText(e.target.value)} disabled={!me} />
              {me ? <button className="btn-primary sm:w-24">등록</button> : <Link to="/site/login" className="btn-accent sm:w-24">로그인</Link>}
            </div>
            {err && <p id="cmt-err" className="mt-1 text-xs text-coral-500" role="alert">{err}</p>}
          </form>
        </section>

        {/* 이전/다음 */}
        <nav aria-label="이전글 다음글" className="mt-10 border-y border-line text-sm">
          <div className="flex items-center gap-3 border-b border-line px-2 py-3.5">
            <span className="flex w-20 shrink-0 items-center gap-1 font-semibold text-muted"><ChevronUp size={15} aria-hidden />다음글</span>
            {next ? <Link to={`/site/news/notice/${next.id}`} className="link-u truncate">{next.title}</Link> : <span className="text-muted">다음 글이 없습니다.</span>}
          </div>
          <div className="flex items-center gap-3 px-2 py-3.5">
            <span className="flex w-20 shrink-0 items-center gap-1 font-semibold text-muted"><ChevronDown size={15} aria-hidden />이전글</span>
            {prev ? <Link to={`/site/news/notice/${prev.id}`} className="link-u truncate">{prev.title}</Link> : <span className="text-muted">이전 글이 없습니다.</span>}
          </div>
        </nav>
        <div className="mt-6 text-center">
          <button className="btn-primary px-8" onClick={() => nav('/site/news/notice')}><List size={16} aria-hidden />목록</button>
        </div>
      </Section>
    </>
  )
}
