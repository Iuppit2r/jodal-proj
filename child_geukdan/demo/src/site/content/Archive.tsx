import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Film, Image as ImageIcon, Maximize2, Pause, Play, RotateCcw, Search, Theater, Volume2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import Poster from '../../components/Poster'
import Modal from '../../components/Modal'
import { archive, venues } from '../../data/mock'
import type { ArchiveItem } from '../../data/types'
import { useStore } from '../../store'
import { cx, fmtRange } from '../../lib/format'
import { NEWS_TABS } from './Notices'
import { Empty, Pagination, Section } from './ui'

const KINDS = ['공연기록', '영상', '사진', '연구·발간자료'] as const
const KIND_ICON = { 공연기록: Theater, 영상: Film, 사진: ImageIcon, '연구·발간자료': FileText }
const KIND_TONE: Record<string, string> = { 공연기록: 'bg-brand-600', 영상: 'bg-coral-500', 사진: 'bg-mint-500', '연구·발간자료': 'bg-ink' }
const FIELDS = [['all', '전체'], ['title', '작품명'], ['director', '연출'], ['writer', '작가'], ['cast', '출연진']] as const
type Field = (typeof FIELDS)[number][0]
const YEARS = Array.from({ length: 2026 - 2011 + 1 }, (_, i) => 2011 + i)
const PER = 8

type Item = ArchiveItem & { perfId?: string; period?: string }

export default function Archive() {
  const performances = useStore(s => s.performances)
  const toast = useStore(s => s.toast)

  const all = useMemo<Item[]>(() => {
    const fromPerf: Item[] = performances.filter(p => p.status === '판매종료').map(p => ({
      id: 'perf-' + p.id, perfId: p.id, period: fmtRange(p.start, p.end), year: Number(p.start.slice(0, 4)), title: p.title,
      director: p.credits.filter(c => c.role.includes('연출')).map(c => c.name).join(', ') || '-',
      writer: p.credits.filter(c => /작|각색|구성/.test(c.role) && !c.role.includes('작곡')).map(c => c.name).join(', ') || '-',
      cast: p.cast, venue: venues.find(v => v.id === p.venueId)?.name ?? '-', kind: '공연기록', desc: p.description, palette: p.palette, motif: p.motif,
    }))
    return [...fromPerf, ...archive].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
  }, [performances])

  const [kw, setKw] = useState('')
  const [field, setField] = useState<Field>('all')
  const [from, setFrom] = useState(2011)
  const [to, setTo] = useState(2026)
  const [kinds, setKinds] = useState<string[]>([...KINDS])
  const [applied, setApplied] = useState({ kw: '', field: 'all' as Field, from: 2011, to: 2026 })
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Item | null>(null)
  const close = useCallback(() => setSel(null), [])

  const list = useMemo(() => {
    const k = applied.kw.trim().toLowerCase()
    const m = (s: string) => s.toLowerCase().includes(k)
    return all.filter(it => {
      if (!kinds.includes(it.kind)) return false
      if (it.year < applied.from || it.year > applied.to) return false
      if (!k) return true
      const f = applied.field
      return (f === 'all' || f === 'title') && m(it.title)
        || (f === 'all' || f === 'director') && m(it.director)
        || (f === 'all' || f === 'writer') && m(it.writer)
        || (f === 'all' || f === 'cast') && it.cast.some(m)
    })
  }, [all, applied, kinds])
  const totalPages = Math.max(1, Math.ceil(list.length / PER))
  const cur = Math.min(page, totalPages)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (from > to) { toast('시작 연도가 종료 연도보다 클 수 없습니다.', 'warn'); return }
    setApplied({ kw, field, from, to }); setPage(1)
  }
  const reset = () => { setKw(''); setField('all'); setFrom(2011); setTo(2026); setKinds([...KINDS]); setApplied({ kw: '', field: 'all', from: 2011, to: 2026 }); setPage(1) }
  const toggleKind = (k: string) => { setKinds(ks => ks.includes(k) ? ks.filter(x => x !== k) : [...ks, k]); setPage(1) }

  return (
    <>
      <PageHeader crumbs={['소식', '공연 아카이브']} title="공연 아카이브" desc="2011년 어린이청소년극연구소 시절부터 지금까지, 극단의 공연 기록과 영상·사진·연구 자료를 찾아보세요." tabs={NEWS_TABS} />
      <Section>
        <form onSubmit={submit} className="rounded-3xl bg-paper p-5 sm:p-6" role="search" aria-label="아카이브 검색">
          <div className="grid gap-3 md:grid-cols-[130px_1fr_auto]">
            <div>
              <label htmlFor="af" className="label">검색 항목</label>
              <select id="af" className="input" value={field} onChange={e => setField(e.target.value as Field)}>
                {FIELDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ak" className="label">검색어</label>
              <input id="ak" className="input" placeholder="작품명, 연출, 작가, 출연진" value={kw} onChange={e => setKw(e.target.value)} />
            </div>
            <div>
              <span className="label" aria-hidden>&nbsp;</span>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 md:flex-none"><Search size={16} aria-hidden />검색</button>
                <button type="button" className="btn-outline" onClick={reset}><RotateCcw size={15} aria-hidden />초기화</button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:gap-8">
            <fieldset>
              <legend className="label">공연 연도</legend>
              <div className="flex items-center gap-2">
                <label htmlFor="ay1" className="sr-only">시작 연도</label>
                <select id="ay1" className="input w-28" value={from} onChange={e => setFrom(Number(e.target.value))}>{YEARS.map(y => <option key={y}>{y}</option>)}</select>
                <span aria-hidden>~</span>
                <label htmlFor="ay2" className="sr-only">종료 연도</label>
                <select id="ay2" className="input w-28" value={to} onChange={e => setTo(Number(e.target.value))}>{YEARS.map(y => <option key={y}>{y}</option>)}</select>
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">자료 종류</legend>
              <div className="flex flex-wrap gap-2">
                {KINDS.map(k => {
                  const I = KIND_ICON[k]
                  const on = kinds.includes(k)
                  return (
                    <label key={k} className={cx('inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sun-400',
                      on ? 'border-brand-600 bg-white text-brand-600' : 'border-line bg-white text-muted')}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleKind(k)} />
                      <I size={14} aria-hidden />{k}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </form>

        <p className="mb-4 mt-8 text-sm text-muted" aria-live="polite">검색 결과 <b className="text-brand-600">{list.length}</b>건</p>
        {list.length === 0 ? <Empty>조건에 맞는 자료가 없습니다. 검색어나 필터를 변경해보세요.</Empty> : (
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {list.slice((cur - 1) * PER, cur * PER).map(it => {
              const I = KIND_ICON[it.kind]
              return (
                <li key={it.id}>
                  <button className="group block w-full text-left" onClick={() => setSel(it)} aria-label={`${it.year} ${it.title} (${it.kind}) 상세보기`}>
                    <div className="relative overflow-hidden rounded-2xl shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
                      <Poster title={it.title} palette={it.palette} motif={it.motif} sub={`${it.year} · ${it.venue}`} className="block aspect-[5/7] w-full" />
                      <span className={cx('chip absolute left-2 top-2 gap-1 text-white', KIND_TONE[it.kind])}><I size={12} aria-hidden />{it.kind}</span>
                      {it.kind === '영상' && <span aria-hidden className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink"><Play size={24} /></span>}
                    </div>
                    <p className="mt-3 text-xs font-bold text-brand-600">{it.year}</p>
                    <p className="line-clamp-1 font-bold group-hover:underline">{it.title}</p>
                    <p className="line-clamp-1 text-xs text-muted">{it.director !== '-' ? `연출 ${it.director}` : it.writer}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <Pagination page={cur} total={totalPages} onChange={setPage} />
      </Section>

      <Modal open={!!sel} onClose={close} title={sel ? `${sel.title} (${sel.year})` : ''} size="lg">
        {sel && <ArchiveDetail key={sel.id} it={sel} />}
      </Modal>
    </>
  )
}

function ArchiveDetail({ it }: { it: Item }) {
  const toast = useStore(s => s.toast)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState<number | null>(null)
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <Poster title={it.title} palette={it.palette} motif={it.motif} className="hidden aspect-[5/7] w-full rounded-xl sm:block" />
        <div>
          <span className={cx('chip text-white', KIND_TONE[it.kind])}>{it.kind}</span>
          <h3 className="mt-2 text-xl font-extrabold">{it.title}</h3>
          <dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-1.5 text-sm">
            <dt className="text-muted">연도</dt><dd>{it.period ?? it.year}</dd>
            {it.venue !== '-' && <><dt className="text-muted">공연장</dt><dd>{it.venue}</dd></>}
            {it.director !== '-' && <><dt className="text-muted">연출</dt><dd>{it.director}</dd></>}
            <dt className="text-muted">{it.kind === '연구·발간자료' ? '발간' : '작'}</dt><dd>{it.writer}</dd>
            {it.cast.length > 0 && <><dt className="text-muted">출연</dt><dd>{it.cast.join(', ')}</dd></>}
          </dl>
          <p className="mt-4 text-sm leading-7 text-ink/80">{it.desc}</p>
          {it.perfId && <Link to={`/site/performances/${it.perfId}`} className="btn-outline btn-sm mt-3">공연 상세 페이지</Link>}
        </div>
      </div>

      {it.kind === '영상' && (
        <div>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black" style={{ background: `radial-gradient(circle at 60% 40%, ${it.palette[1]}55, ${it.palette[0]} 60%, #000)` }}>
            <button className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink transition hover:scale-105" onClick={() => setPlaying(p => !p)} aria-label={playing ? '일시정지' : '재생'}>
              {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </button>
            {playing && <p className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white">● 재생 중 (시연용 영상) · 자막 ON</p>}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-white">
              <button onClick={() => setPlaying(p => !p)} aria-label={playing ? '일시정지' : '재생'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
              <div className="h-1 flex-1 rounded bg-white/30"><div className={cx('h-1 rounded bg-sun-400 transition-all duration-[20s] ease-linear', playing ? 'w-full' : 'w-[12%]')} /></div>
              <span className="text-xs tabular-nums">09:12 / 75:40</span>
              <Volume2 size={16} aria-hidden /><Maximize2 size={16} aria-hidden />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">교육·연구 목적 공개 영상입니다. 무단 복제 및 재배포를 금합니다. (한글자막·수어 화면 제공)</p>
        </div>
      )}

      {(it.kind === '사진' || it.kind === '공연기록') && (
        <div>
          <p className="mb-2 text-sm font-bold">{it.kind === '사진' ? '무대 사진 (48컷 중 12컷)' : '공연 사진'}</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: it.kind === '사진' ? 12 : 4 }, (_, i) => (
              <li key={i}>
                <button onClick={() => setZoom(i)} aria-label={`사진 ${i + 1} 크게 보기`} className="block aspect-[4/3] w-full overflow-hidden rounded-lg transition hover:opacity-90"
                  style={{ background: `linear-gradient(${(i * 47) % 360}deg, ${it.palette[i % 3]}, ${it.palette[(i + 1) % 3]})` }}>
                  <span aria-hidden className="block h-full w-full" style={{ background: `radial-gradient(circle at ${20 + (i * 23) % 60}% ${30 + (i * 17) % 50}%, rgba(255,255,255,.35) 0 12%, transparent 13%)` }} />
                </button>
              </li>
            ))}
          </ul>
          {zoom !== null && (
            <div className="mt-3 rounded-xl border border-line p-2">
              <div className="aspect-video rounded-lg" style={{ background: `linear-gradient(${(zoom * 47) % 360}deg, ${it.palette[zoom % 3]}, ${it.palette[(zoom + 1) % 3]})` }} role="img" aria-label={`${it.title} 사진 ${zoom + 1}`} />
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{it.title} · 사진 {zoom + 1} · ⓒ국립어린이청소년극단</span>
                <button className="link-u" onClick={() => setZoom(null)}>닫기</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(it.kind === '연구·발간자료' || it.kind === '공연기록') && (
        <div className="flex flex-col gap-3 rounded-xl bg-paper p-4 sm:flex-row sm:items-center">
          <FileText size={28} className="text-brand-600" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-bold">{it.kind === '연구·발간자료' ? `${it.title}.pdf` : `${it.title}_프로그램북.pdf`}</p>
            <p className="text-xs text-muted">{it.kind === '연구·발간자료' ? 'PDF · 12.4MB · 공공누리 제1유형' : 'PDF · 4.8MB'}</p>
          </div>
          <button className="btn-primary btn-sm" onClick={() => toast(`${it.title} 자료 다운로드를 시작합니다.`)}><Download size={14} aria-hidden />다운로드</button>
        </div>
      )}
    </div>
  )
}
