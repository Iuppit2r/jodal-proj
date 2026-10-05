import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DAILY, KIND_LABEL, MESH_DICT, PAPERS, type MeshTerm, type Paper, type ReviewStatus, type TermKind } from '../data/mesh'
import { useApp } from '../context'
import { Modal, PageHead, Stat, Tabs } from '../components/ui'
import { BarChart, Donut, LineChart, PALETTE } from '../components/charts'

type Tab = 'review' | 'monitor' | 'batch'
type TermState = MeshTerm & { state?: 'removed' | 'replaced' | 'added'; original?: string }
type ReviewPaper = Omit<Paper, 'terms'> & { terms: TermState[] }

const STATUS_BADGE: Record<ReviewStatus, string> = { 검수대기: 'badge-warn', 승인: 'badge-ok', 반려: 'badge-danger', 최종확정: 'badge-blue' }

export default function MeshReview() {
  const [tab, setTab] = useState<Tab>('review')
  const [papers, setPapers] = useState<ReviewPaper[]>(PAPERS)
  const counts = {
    auto: 1795 + papers.length,
    sample: papers.length + 140,
    ok: papers.filter(p => p.status === '승인' || p.status === '최종확정').length + 126,
    no: papers.filter(p => p.status === '반려').length + 13,
  }
  return (
    <>
      <PageHead title="MeSH 주제어 자동색인 · 검수" desc="AI가 신규 논문의 제목·초록을 분석해 MeSH 주제어를 추천하고, 무작위 표본 검수로 품질을 관리합니다." reqs={['SFR-04', 'PER-03', 'DAR-11']} />
      <div className="widget-grid" style={{ marginBottom: 16 }}>
        <Stat label="전체 자동색인" value={counts.auto.toLocaleString()} sub="최근 7일" />
        <Stat label="표본 검수" value={counts.sample} sub={`표본 비율 ${(counts.sample / counts.auto * 100).toFixed(1)}%`} />
        <Stat label="승인" value={counts.ok} color="var(--c-ok)" sub={`승인율 ${(counts.ok / (counts.ok + counts.no) * 100).toFixed(1)}%`} />
        <Stat label="반려" value={counts.no} color="var(--c-danger)" />
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'review', label: '표본 검수' }, { id: 'monitor', label: '품질 모니터링' }, { id: 'batch', label: '배치 색인' }]} />
      </div>
      {tab === 'review' && <ReviewTab papers={papers} setPapers={setPapers} />}
      {tab === 'monitor' && <MonitorTab />}
      {tab === 'batch' && <BatchTab />}
    </>
  )
}

function ReviewTab({ papers, setPapers }: { papers: ReviewPaper[]; setPapers: (fn: (p: ReviewPaper[]) => ReviewPaper[]) => void }) {
  const { toast } = useApp()
  const [selId, setSelId] = useState(papers[0].id)
  const [ratio, setRatio] = useState<'pct' | 'cnt'>('pct')
  const [pct, setPct] = useState(10)
  const [cnt, setCnt] = useState(30)
  const [hoverTerm, setHoverTerm] = useState<string | null>(null)
  const [replacing, setReplacing] = useState<{ idx: number } | 'add' | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [filter, setFilter] = useState<ReviewStatus | '전체'>('전체')

  const list = papers.filter(p => filter === '전체' || p.status === filter)
  const paper = papers.find(p => p.id === selId)!
  const pending = papers.filter(p => p.status === '검수대기')

  const patchPaper = (id: string, fn: (p: ReviewPaper) => ReviewPaper) => setPapers(ps => ps.map(p => p.id === id ? fn(p) : p))
  const patchTerm = (idx: number, t: Partial<TermState>) => patchPaper(paper.id, p => ({ ...p, terms: p.terms.map((x, i) => i === idx ? { ...x, ...t } : x) }))

  const next = useCallback(() => {
    const n = papers.find(p => p.status === '검수대기' && p.id !== paper.id)
    if (n) setSelId(n.id)
  }, [papers, paper.id])

  const decide = useCallback((status: ReviewStatus, reason?: string) => {
    patchPaper(paper.id, p => ({ ...p, status: status === '승인' ? '최종확정' : status }))
    toast(status === '승인'
      ? `✓ 승인 → '최종 확정' · 서비스 DB 및 검색엔진(마리너4) 동기화 완료`
      : `반려 처리됨${reason ? ` (${reason})` : ''} · 재색인 대기열로 이동`)
    next()
  }, [paper.id, next])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || replacing || rejecting) return
      if (e.key === 'a' && paper.status === '검수대기') decide('승인')
      if (e.key === 'r' && paper.status === '검수대기') setRejecting(true)
      if (e.key === 'j' || e.key === 'k') {
        const i = list.findIndex(p => p.id === paper.id)
        const n = list[i + (e.key === 'j' ? 1 : -1)]
        if (n) setSelId(n.id)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [paper, list, decide, replacing, rejecting])

  const grouped = useMemo(() => {
    const g: Record<TermKind, { t: TermState; i: number }[]> = { major: [], minor: [], pubtype: [], check: [], geo: [] }
    paper.terms.forEach((t, i) => g[t.kind].push({ t, i }))
    return g
  }, [paper])

  const activeEvidence = hoverTerm ? paper.terms.find(t => t.ui + t.name === hoverTerm)?.evidence ?? [] : paper.terms.flatMap(t => t.state === 'removed' ? [] : t.evidence)

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card card-pad row wrap" style={{ gap: 12 }}>
        <b className="small">랜덤 표본 추출</b>
        <div className="row" style={{ gap: 4 }} role="radiogroup" aria-label="추출 기준">
          <button className="chip" aria-pressed={ratio === 'pct'} onClick={() => setRatio('pct')}>비율</button>
          <button className="chip" aria-pressed={ratio === 'cnt'} onClick={() => setRatio('cnt')}>건수</button>
        </div>
        {ratio === 'pct'
          ? <label className="row small">자동색인의 <input className="input" type="number" min={1} max={100} value={pct} onChange={e => setPct(+e.target.value)} style={{ width: 72 }} />%</label>
          : <label className="row small"><input className="input" type="number" min={1} value={cnt} onChange={e => setCnt(+e.target.value)} style={{ width: 80 }} />건</label>}
        <select className="select" style={{ width: 'auto' }} aria-label="추출 대상 기간"><option>오늘 색인분 (318건)</option><option>최근 7일 (1,795건)</option></select>
        <button className="btn btn-primary btn-sm" onClick={() => toast(`무작위 표본 ${ratio === 'pct' ? Math.round(318 * pct / 100) : cnt}건을 추출했습니다.`)}>표본 추출</button>
        <span className="spacer" />
        <span className="xs muted">단축키 <span className="kbd">A</span> 승인 <span className="kbd">R</span> 반려 <span className="kbd">J</span>/<span className="kbd">K</span> 이동</span>
      </div>

      <div className="grid mesh-layout">
        <aside className="card" aria-label="검수 대상 목록">
          <div className="card-head">
            <h3>검수 대상</h3><span className="badge badge-warn">{pending.length} 대기</span><span className="spacer" />
            <select className="select" style={{ width: 'auto', padding: '4px 8px' }} value={filter} onChange={e => setFilter(e.target.value as ReviewStatus | '전체')} aria-label="상태 필터">
              {['전체', '검수대기', '최종확정', '반려'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {list.map(p => (
            <button key={p.id} className={`group-item ${p.id === selId ? 'active' : ''}`} onClick={() => setSelId(p.id)}>
              <div className="row xs muted"><span className="mono">{p.koms}</span><span className="spacer" /><span className={`badge ${STATUS_BADGE[p.status]}`} style={{ fontSize: 11 }}>{p.status}</span></div>
              <div className="t" style={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
            </button>
          ))}
        </aside>

        <div className="stack" style={{ gap: 12, minWidth: 0 }}>
          <div className="split">
            <section className="card" aria-label="논문 원문" style={{ position: 'sticky', top: 80 }}>
              <div className="card-head"><h3>논문 원문</h3><span className="spacer" /><span className="xs muted mono">{paper.koms}</span></div>
              <div className="card-pad">
                <div className="xs muted">{paper.journal} · {paper.year}</div>
                <h2 style={{ fontSize: 17, margin: '6px 0 14px' }}><Marked text={paper.title} words={activeEvidence} /></h2>
                <div className="xs muted" style={{ fontWeight: 700, marginBottom: 4 }}>ABSTRACT</div>
                <p style={{ lineHeight: 1.8, fontSize: 14.5 }}><Marked text={paper.abstract} words={activeEvidence} /></p>
                <div className="divider" />
                <div className="xs muted">자동색인 {paper.indexedAt} · 처리시간 <b>{paper.procSec}s</b> (목표 ≤ 5s)</div>
              </div>
            </section>

            <section className="card" aria-label="AI 추천 MeSH">
              <div className="card-head">
                <h3>AI 추천 MeSH</h3>
                <span className="badge badge-ok" title="NLM MeSH 2026 마스터와 실시간 대조">✓ NLM MeSH 2026 유효성 검증</span>
                <span className="spacer" />
                <button className="btn btn-sm" onClick={() => setReplacing('add')} disabled={paper.status !== '검수대기'}>＋ 추가</button>
              </div>
              <div className="card-pad stack" style={{ gap: 14 }}>
                {(Object.keys(grouped) as TermKind[]).filter(k => grouped[k].length).map(k => (
                  <div key={k}>
                    <div className="xs" style={{ fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>{KIND_LABEL[k]}</div>
                    <div className="stack" style={{ gap: 6 }}>
                      {grouped[k].map(({ t, i }) => (
                        <div key={t.ui + t.name + i} className={`mesh-term ${t.state ?? ''}`}
                          onMouseEnter={() => setHoverTerm(t.ui + t.name)} onMouseLeave={() => setHoverTerm(null)}>
                          <div style={{ minWidth: 0 }}>
                            <div className="row wrap" style={{ gap: 6 }}>
                              {t.star && <span title="핵심주제 (Major Topic)" style={{ color: 'var(--c-warn)' }}>★</span>}
                              <span className="name">{t.name}</span>
                              {t.qualifiers.map(q => <span key={q} className="qual">/{q}</span>)}
                              {t.state === 'added' && <span className="badge badge-violet">검수자 추가</span>}
                              {t.state === 'replaced' && <span className="badge badge-violet">교체 (원: {t.original})</span>}
                            </div>
                            <div className="row wrap xs muted" style={{ gap: 8, marginTop: 2 }}>
                              <span className="mono">{t.ui}</span>
                              {t.evidence.length > 0 && <span>근거: {t.evidence.map(e => `“${e}”`).join(', ')}</span>}
                              {t.refs.map(r => <a key={r} href="#" onClick={e => e.preventDefault()} title="참조 정답셋 (기색인 유사 논문)">↗ {r}</a>)}
                            </div>
                          </div>
                          <div className="row" style={{ gap: 4 }}>
                            <ConfBar v={t.conf} />
                            {paper.status === '검수대기' && (t.state === 'removed'
                              ? <button className="btn btn-sm btn-ghost" onClick={() => patchTerm(i, { state: undefined })}>복원</button>
                              : <>
                                <button className="btn btn-sm btn-ghost" onClick={() => setReplacing({ idx: i })} aria-label={`${t.name} 교체`}>교체</button>
                                <button className="btn btn-sm btn-ghost" onClick={() => patchTerm(i, { state: 'removed' })} aria-label={`${t.name} 제외`}>✕</button>
                              </>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="card card-pad row wrap" style={{ position: 'sticky', bottom: 12, boxShadow: 'var(--shadow-lg)' }}>
            <span className={`badge ${STATUS_BADGE[paper.status]}`}>{paper.status}</span>
            <span className="small muted">
              {paper.terms.filter(t => t.state === 'removed').length}개 제외 · {paper.terms.filter(t => t.state === 'replaced' || t.state === 'added').length}개 수정
            </span>
            <span className="spacer" />
            {paper.status === '검수대기' ? <>
              <button className="btn btn-danger btn-lg" onClick={() => setRejecting(true)}>부적정 (반려) <span className="kbd">R</span></button>
              <button className="btn btn-ok btn-lg" onClick={() => decide('승인')}>적정 (승인) <span className="kbd" style={{ color: 'var(--c-ok)' }}>A</span></button>
            </> : <button className="btn" onClick={() => patchPaper(paper.id, p => ({ ...p, status: '검수대기' }))}>검수 상태 되돌리기</button>}
          </div>
        </div>
      </div>

      {replacing && (
        <MeshSearch title={replacing === 'add' ? 'MeSH 표준 용어 추가' : `'${paper.terms[replacing.idx].name}' 교체`} onClose={() => setReplacing(null)}
          onPick={m => {
            if (replacing === 'add') {
              patchPaper(paper.id, p => ({ ...p, terms: [...p.terms, { ui: m.ui, name: m.name, qualifiers: [], kind: 'minor', conf: 1, evidence: [], refs: [], state: 'added' }] }))
            } else {
              const old = paper.terms[replacing.idx]
              patchTerm(replacing.idx, { ui: m.ui, name: m.name, qualifiers: [], conf: 1, state: 'replaced', original: old.original ?? old.name })
            }
            setReplacing(null)
          }} />
      )}
      {rejecting && <RejectModal onClose={() => setRejecting(false)} onSubmit={r => { setRejecting(false); decide('반려', r) }} />}
    </div>
  )
}

function Marked({ text, words }: { text: string; words: string[] }) {
  const ws = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length)
  if (!ws.length) return <>{text}</>
  const re = new RegExp(`(${ws.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts: ReactNode[] = text.split(re).map((p, i) => i % 2 ? <mark key={i} className="kw">{p}</mark> : p)
  return <>{parts}</>
}

function ConfBar({ v }: { v: number }) {
  const color = v >= 0.85 ? 'var(--c-ok)' : v >= 0.6 ? 'var(--c-warn)' : 'var(--c-danger)'
  return (
    <span className="row" style={{ gap: 6, width: 92 }} title={`추천 정확도 ${(v * 100).toFixed(0)}%`}>
      <span className="progress" style={{ flex: 1, height: 6 }}><span style={{ width: `${v * 100}%`, background: color }} /></span>
      <span className="conf" style={{ color }}>{(v * 100).toFixed(0)}</span>
    </span>
  )
}

function MeshSearch({ title, onClose, onPick }: { title: string; onClose: () => void; onPick: (m: typeof MESH_DICT[number]) => void }) {
  const [q, setQ] = useState('')
  const list = MESH_DICT.filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.ui.includes(q.toUpperCase()))
  return (
    <Modal title={title} onClose={onClose}>
      <input className="input" autoFocus placeholder="MeSH 용어 또는 UI 검색 (예: Quarantine, D017445)" value={q} onChange={e => setQ(e.target.value)} />
      <div className="xs muted" style={{ margin: '6px 0 10px' }}>NLM MeSH 2026 마스터 · UMLS 정규화 매핑 포함</div>
      <div className="stack" style={{ gap: 6 }}>
        {list.map(m => (
          <button key={m.ui} className="src-item" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => onPick(m)}>
            <span><span className="src-title" style={{ display: 'block' }}>{m.name}</span><span className="src-meta mono">{m.ui} · Tree {m.tree}</span></span>
            <span className="btn btn-sm">선택</span>
          </button>
        ))}
        {!list.length && <div className="empty small">일치하는 용어가 없습니다.</div>}
      </div>
    </Modal>
  )
}

function RejectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const reasons = ['주표목 누락', '부적절한 주표목', '부표목(Qualifier) 오류', 'Check Tag 오류', '기타']
  const [r, setR] = useState(reasons[0])
  return (
    <Modal title="부적정 (반려) 사유" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>취소</button><button className="btn btn-danger" onClick={() => onSubmit(r)}>반려</button></>}>
      <div className="stack" style={{ gap: 6 }}>
        {reasons.map(x => <label key={x} className="row"><input type="radio" name="reason" checked={r === x} onChange={() => setR(x)} />{x}</label>)}
        <textarea className="textarea" rows={3} placeholder="상세 의견 (선택)" style={{ marginTop: 8 }} />
      </div>
    </Modal>
  )
}

function MonitorTab() {
  const rate = DAILY.labels.map((_, i) => {
    const t = DAILY.approved[i] + DAILY.rejected[i]
    return t ? +(DAILY.approved[i] / t * 100).toFixed(1) : 0
  })
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}>
      <section className="card"><div className="card-head"><h3>일자별 검수 처리 현황</h3></div>
        <div className="card-pad"><BarChart labels={DAILY.labels} stacked unit="건" series={[
          { name: '승인', color: PALETTE[1], values: DAILY.approved }, { name: '반려', color: PALETTE[4], values: DAILY.rejected }, { name: '검수대기', color: PALETTE[2], values: DAILY.pending }]} /></div>
      </section>
      <section className="card"><div className="card-head"><h3>검수 결과 분포 (최근 7일)</h3></div>
        <div className="card-pad"><Donut center={{ value: '90.5%', label: '승인율' }} data={[
          { name: '승인', value: 129, color: PALETTE[1] }, { name: '반려', value: 14, color: PALETTE[4] }, { name: '검수대기', value: 18, color: PALETTE[2] }]} /></div>
      </section>
      <section className="card"><div className="card-head"><h3>일자별 자동색인 건수</h3></div>
        <div className="card-pad"><BarChart labels={DAILY.labels} unit="건" series={[{ name: '자동색인', color: PALETTE[0], values: DAILY.auto }]} /></div>
      </section>
      <section className="card"><div className="card-head"><h3>승인율 추이</h3></div>
        <div className="card-pad"><LineChart labels={DAILY.labels} unit="%" target={{ value: 85, label: '목표 85%' }} series={[{ name: '승인율', color: PALETTE[1], values: rate }]} /></div>
      </section>
      <section className="card"><div className="card-head"><h3>반려 사유</h3></div>
        <table className="table"><tbody>
          {[['주표목 누락', 5], ['부적절한 주표목', 4], ['부표목(Qualifier) 오류', 3], ['Check Tag 오류', 1], ['기타', 1]].map(([k, v]) => (
            <tr key={k}><td>{k}</td><td style={{ width: '45%' }}><div className="progress"><span style={{ width: `${(+v / 5) * 100}%`, background: 'var(--c-danger)' }} /></div></td><td style={{ textAlign: 'right' }}><b>{v}</b></td></tr>
          ))}
        </tbody></table>
      </section>
      <section className="card"><div className="card-head"><h3>표목 유형별 정확도</h3></div>
        <table className="table"><thead><tr><th>유형</th><th>추천 수</th><th>수정률</th><th>정확도</th></tr></thead><tbody>
          {[['주표목', 612, 6.2, 93.8], ['부가 표목', 980, 11.4, 88.6], ['Publication Type', 161, 0.6, 99.4], ['Check Tag', 402, 2.5, 97.5], ['Geographic', 144, 4.2, 95.8]].map(([k, n, m, a]) => (
            <tr key={k as string}><td>{k}</td><td>{n}</td><td>{m}%</td><td><b className={+a >= 90 ? 'metric-ok' : ''}>{a}%</b></td></tr>
          ))}
        </tbody></table>
      </section>
    </div>
  )
}

function BatchTab() {
  const { toast } = useApp()
  const [jobs, setJobs] = useState([
    { id: 'B-20261005-02', total: 1000, done: 640, start: '09:40', status: '진행중', workers: 5 },
    { id: 'B-20261005-01', total: 318, done: 318, start: '08:00', status: '완료', workers: 5, took: '17분 42초' },
    { id: 'B-20261004-01', total: 1000, done: 1000, start: '02:00', status: '완료', workers: 5, took: '52분 10초' },
  ])
  useEffect(() => {
    const t = setInterval(() => setJobs(js => js.map(j => j.status === '진행중' ? { ...j, done: Math.min(j.total, j.done + 7), status: j.done + 7 >= j.total ? '완료' : '진행중', took: j.done + 7 >= j.total ? '56분 03초' : undefined } : j)), 600)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="widget-grid">
        <Stat label="단일 문서 평균 처리" value="3.3s" color="var(--c-ok)" sub="목표 ≤ 5초 · P95 4.6s" />
        <Stat label="배치 1,000건 평균" value="52분" color="var(--c-ok)" sub="목표 ≤ 60분" />
        <Stat label="병렬 처리" value="5건" sub="목표 ≥ 5건 동시" />
        <Stat label="실패/재시도" value="3" sub="NLM 대조 타임아웃 2, 파싱 1" />
      </div>
      <section className="card">
        <div className="card-head"><h3>배치 색인 작업</h3><span className="spacer" />
          <button className="btn btn-primary btn-sm" onClick={() => { setJobs(js => [{ id: `B-20261005-0${js.length + 1}`, total: 1000, done: 0, start: '지금', status: '진행중', workers: 5 }, ...js]); toast('배치 색인 작업을 등록했습니다.') }}>신규 배치 실행</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>작업 ID</th><th>시작</th><th>대상</th><th style={{ width: '30%' }}>진행</th><th>워커</th><th>상태</th><th>소요</th></tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td className="mono">{j.id}</td><td>{j.start}</td><td>{j.total.toLocaleString()}건</td>
                  <td><div className="row"><div className="progress" style={{ flex: 1 }}><span style={{ width: `${j.done / j.total * 100}%`, background: j.status === '완료' ? 'var(--c-ok)' : undefined }} /></div><span className="xs mono">{j.done}/{j.total}</span></div></td>
                  <td>{j.workers}</td>
                  <td><span className={`badge ${j.status === '완료' ? 'badge-ok' : 'badge-blue'}`}>{j.status}</span></td>
                  <td className="small">{j.took ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
