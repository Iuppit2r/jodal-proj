import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CANNED, COLLECTIONS, DOCS, PIPELINE, SUGGEST_TERMS, type Collection, type SourceDoc } from '../data/search'
import { useApp } from '../context'
import { Modal } from '../components/ui'

type Turn = {
  id: number
  q: string
  answer: string
  sources: SourceDoc[]
  stage: number // 0..PIPELINE.length (== 생성중), > length 완료
  shown: number
  perf: { search: number; ttft: number; total: number; embed: number }
  feedback?: 'up' | 'down'
}

const KEYWORD_ROUTE: [RegExp, number][] = [
  [/엠폭스|mpox|monkeypox|원숭이두창/i, 0],
  [/당뇨|diabetes|유전체|prs/i, 1],
  [/코로나|covid|13판|14판/i, 2],
  [/항생제|내성|glass|resistan/i, 3],
]

function resolve(q: string, scope: Set<Collection>, picked: string[]) {
  let idx = -1
  if (picked.length) {
    let best = 0
    CANNED.forEach((c, i) => {
      const hit = c.sources.filter(s => picked.includes(s)).length
      if (hit > best) { best = hit; idx = i }
    })
  }
  if (idx < 0) idx = KEYWORD_ROUTE.find(([re]) => re.test(q))?.[1] ?? -1
  if (idx < 0) {
    return {
      answer: `질의하신 내용과 관련된 근거 문서를 충분히 찾지 못했습니다.\n\n정확성이 중요한 의과학 정보 특성상, **근거가 확인되지 않은 답변은 생성하지 않습니다.**\n- 검색 범위(컬렉션)를 넓히거나 외부 학술자원(PubMed·WoS)을 포함해 보세요.\n- 질환명·MeSH 용어 등 구체적인 키워드를 포함해 다시 질문해 주세요.`,
      sources: [] as SourceDoc[],
    }
  }
  const c = CANNED[idx]
  const all = c.sources.map(id => DOCS[id])
  const excluded = new Set(all.map((d, i) => (scope.has(d.collection) ? -1 : i + 1)).filter(n => n > 0))
  let answer = c.answer
  if (excluded.size) {
    // 제외된 컬렉션 근거를 인용한 문장은 답변에서 제거 (근거 없는 문장 노출 방지)
    answer = answer.split('\n').map(line => {
      if (![...excluded].some(n => line.includes(`[${n}]`))) return line
      const kept = line.split(/(?<=[.다])\s+/).filter(s => ![...excluded].some(n => s.includes(`[${n}]`)))
      return kept.join(' ')
    }).join('\n')
  }
  // 근거 번호는 원본 순서를 유지하되, 제외된 문서는 목록에서 비활성 처리
  return { answer, sources: all.map(d => ({ ...d, excluded: !scope.has(d.collection) })) }
}

export default function SearchAssist() {
  const { toast } = useApp()
  const [turns, setTurns] = useState<Turn[]>([])
  const [scope, setScope] = useState<Set<Collection>>(new Set(COLLECTIONS.map(c => c.id)))
  const [picked, setPicked] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [active, setActive] = useState<{ turn: number; idx: number } | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const [params] = useSearchParams()
  const initialAsked = useRef(false)

  const ask = (q: string) => {
    const query = q.trim()
    if (!query) return
    const { answer, sources } = resolve(query, scope, picked)
    const id = Date.now()
    const perf = { search: +(1.2 + Math.random() * 1.6).toFixed(2), ttft: +(1.1 + Math.random() * 1.4).toFixed(2), total: 0, embed: +(0.2 + Math.random() * 0.4).toFixed(2) }
    perf.total = +(perf.search + perf.ttft + 3 + Math.random() * 3).toFixed(2)
    setTurns(t => [...t, { id, q: query, answer, sources, stage: 0, shown: 0, perf }])
    const firstValid = sources.findIndex(s => !s.excluded)
    setActive(sources.length && firstValid >= 0 ? { turn: id, idx: firstValid } : null)
  }

  // #/search?q=... 로 진입 시 바로 질의 (공유 링크)
  useEffect(() => {
    const q = params.get('q')
    if (q && !initialAsked.current) { initialAsked.current = true; ask(q) }
  }, [params])

  // 파이프라인 단계 진행 + 스트리밍
  const running = turns.find(t => t.stage <= PIPELINE.length)
  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => {
      setTurns(ts => ts.map(t => {
        if (t.id !== running.id) return t
        if (t.stage < PIPELINE.length - 1) return { ...t, stage: t.stage + 1 }
        if (t.stage === PIPELINE.length - 1) return { ...t, stage: PIPELINE.length }
        const shown = Math.min(t.shown + 7, t.answer.length)
        return { ...t, shown, stage: shown >= t.answer.length ? PIPELINE.length + 1 : t.stage }
      }))
    }, running.stage < PIPELINE.length ? 380 : 22)
    return () => clearTimeout(timer)
  }, [running])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [turns])

  const activeTurn = turns.find(t => t.id === active?.turn) ?? turns[turns.length - 1]

  if (!turns.length) {
    return (
      <>
        <Home onAsk={ask} scope={scope} setScope={setScope} picked={picked} openPicker={() => setPickerOpen(true)} clearPicked={() => setPicked([])} />
        {pickerOpen && <DocPicker picked={picked} setPicked={setPicked} onClose={() => setPickerOpen(false)} />}
      </>
    )
  }

  return (
    <div className="sa-layout">
      <section className="card sa-chat" aria-label="질의응답">
        <div className="card-head">
          <h2>NCMIK Search Assist</h2>
          <span className="badge badge-teal">RAG · 로컬 LLM</span>
          {picked.length > 0 && <span className="badge badge-violet">선택 문서 {picked.length}건 대상</span>}
          <span className="spacer" />
          <button className="btn btn-sm" onClick={() => { setTurns([]); setActive(null) }}>새 대화</button>
        </div>
        <div className="sa-thread" ref={threadRef} aria-live="polite">
          {turns.map(t => (
            <Fragment key={t.id}>
              <div className="msg-user">{t.q}</div>
              <div className="msg-ai">
                <div className="avatar" aria-hidden>AI</div>
                <div className="body">
                  {t.stage < PIPELINE.length && (
                    <div className="pipeline-steps" aria-label="처리 단계">
                      {PIPELINE.map((p, i) => (
                        <span key={p} className={i < t.stage ? 'done' : i === t.stage ? 'run' : ''}>
                          {i < t.stage ? '✓' : i === t.stage ? '●' : '○'} {p}{i < PIPELINE.length - 1 && ' ›'}
                        </span>
                      ))}
                    </div>
                  )}
                  {t.stage >= PIPELINE.length && (
                    <div className="answer">
                      <RichAnswer text={t.answer.slice(0, t.shown)} activeIdx={active?.turn === t.id ? active.idx : -1}
                        onCite={n => t.sources[n - 1] && setActive({ turn: t.id, idx: n - 1 })} />
                      {t.stage === PIPELINE.length && <span className="caret" aria-hidden />}
                    </div>
                  )}
                  {t.stage > PIPELINE.length && (
                    <>
                      <div className="perf-line">
                        <span>검색 <b>{t.perf.search}s</b></span>
                        <span>임베딩 <b>{t.perf.embed}s</b></span>
                        <span>TTFT <b>{t.perf.ttft}s</b></span>
                        <span>전체 <b>{t.perf.total}s</b></span>
                        <span>근거 <b>{t.sources.filter(s => !s.excluded).length}건</b></span>
                      </div>
                      <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn btn-sm btn-ghost" aria-pressed={t.feedback === 'up'} onClick={() => { setTurns(ts => ts.map(x => x.id === t.id ? { ...x, feedback: 'up' } : x)); toast('피드백이 저장되었습니다.') }}>👍 도움됨</button>
                        <button className="btn btn-sm btn-ghost" aria-pressed={t.feedback === 'down'} onClick={() => { setTurns(ts => ts.map(x => x.id === t.id ? { ...x, feedback: 'down' } : x)); toast('피드백이 저장되었습니다. 품질 개선에 활용됩니다.') }}>👎 부정확</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { navigator.clipboard?.writeText(t.answer); toast('답변을 복사했습니다.') }}>복사</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="sa-composer">
          <QueryInput onSubmit={ask} disabled={!!running} placeholder="이어서 질문하세요 (Enter 전송, Shift+Enter 줄바꿈)" />
        </div>
      </section>

      <SourcePanel turn={activeTurn} activeIdx={active?.turn === activeTurn?.id ? active.idx : -1}
        onSelect={i => activeTurn && setActive({ turn: activeTurn.id, idx: i })} />
    </div>
  )
}

function Home({ onAsk, scope, setScope, picked, openPicker, clearPicked }: {
  onAsk: (q: string) => void; scope: Set<Collection>; setScope: (s: Set<Collection>) => void
  picked: string[]; openPicker: () => void; clearPicked: () => void
}) {
  const toggle = (c: Collection) => {
    const n = new Set(scope)
    n.has(c) ? n.delete(c) : n.add(c)
    if (n.size) setScope(n)
  }
  return (
    <div>
      <div className="sa-hero">
        <h1>의과학 지식, <em>근거와 함께</em> 답합니다</h1>
        <p>연구성과물·학술논문·질병재난 아카이브를 RAG로 검색하고, 모든 답변에 출처를 표시합니다.</p>
        <div className="sa-box">
          <QueryInput onSubmit={onAsk} big placeholder="자연어로 질문하세요. 예) 엠폭스 고위험 접촉자 관리 기준은?" />
        </div>
        <div className="sa-scope" role="group" aria-label="검색 범위">
          {COLLECTIONS.map(c => (
            <button key={c.id} className="chip" aria-pressed={scope.has(c.id)} onClick={() => toggle(c.id)}>
              {scope.has(c.id) ? '✓' : '+'} {c.label}{c.external && <span className="badge" style={{ padding: '0 6px' }}>외부</span>}
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn btn-sm" onClick={openPicker}>📑 다중 문서 지정 질의{picked.length ? ` (${picked.length})` : ''}</button>
          {picked.length > 0 && <button className="btn btn-sm btn-ghost" onClick={clearPicked}>지정 해제</button>}
        </div>
      </div>
      <div className="sa-examples">
        {CANNED.map(c => (
          <button key={c.q} className="sa-example" onClick={() => onAsk(c.q)}>
            <span>{c.tag}</span>{c.q}
          </button>
        ))}
      </div>
      <p className="muted xs" style={{ textAlign: 'center', marginTop: 28 }}>
        답변은 AI가 생성하며 오류가 있을 수 있습니다. 의료적 판단 시 반드시 원문 근거를 확인하세요.
      </p>
    </div>
  )
}

function QueryInput({ onSubmit, big, placeholder, disabled }: { onSubmit: (q: string) => void; big?: boolean; placeholder: string; disabled?: boolean }) {
  const [v, setV] = useState('')
  const [sel, setSel] = useState(-1)
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => {
    const t = v.trim().toLowerCase()
    if (t.length < 1) return []
    return SUGGEST_TERMS.filter(s => s.toLowerCase().includes(t) && s.toLowerCase() !== t).slice(0, 6)
  }, [v])
  const submit = (q = v) => {
    if (disabled || !q.trim()) return
    onSubmit(q)
    setV(''); setOpen(false); setSel(-1)
  }
  return (
    <div style={{ position: 'relative' }}>
      <div className="sa-input" style={big ? undefined : { borderWidth: 1 }}>
        <textarea
          rows={1} value={v} placeholder={placeholder} aria-label="질의 입력"
          role="combobox" aria-expanded={open && suggestions.length > 0} aria-autocomplete="list" aria-controls="sa-suggest"
          onChange={e => { setV(e.target.value); setOpen(true); setSel(-1) }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={e => {
            if (open && suggestions.length) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => (s + 1) % suggestions.length); return }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => (s - 1 + suggestions.length) % suggestions.length); return }
              if (e.key === 'Escape') { setOpen(false); return }
            }
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              if (open && sel >= 0) { setV(suggestions[sel]); setOpen(false); setSel(-1) } else submit()
            }
          }}
        />
        <button className="btn btn-primary" onClick={() => submit()} disabled={disabled || !v.trim()} aria-label="질의 전송">
          {disabled ? '생성 중…' : '질문하기'}
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <div className="sa-suggest">
          <ul id="sa-suggest" role="listbox">
            {suggestions.map((s, i) => (
              <li key={s} role="option" aria-selected={i === sel} onMouseDown={() => { setV(s); setOpen(false) }}>
                <span className="muted" aria-hidden>⌕</span>
                <Highlight text={s} q={v.trim()} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0 || !q) return <>{text}</>
  return <>{text.slice(0, i)}<b style={{ color: 'var(--c-primary)' }}>{text.slice(i, i + q.length)}</b>{text.slice(i + q.length)}</>
}

/** 굵게(**), 인용 [n], 목록(-), 표(|) 정도만 처리하는 경량 렌더러 */
function RichAnswer({ text, onCite, activeIdx }: { text: string; onCite: (n: number) => void; activeIdx: number }) {
  const inline = (s: string, key: string | number): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, i) => {
      const k = `${key}-${i}`
      if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={k}>{part.slice(2, -2)}</strong>
      const m = part.match(/^\[(\d+)\]$/)
      if (m) {
        const n = +m[1]
        return <button key={k} className={`cite ${activeIdx === n - 1 ? 'active' : ''}`} onClick={() => onCite(n)} aria-label={`근거 ${n} 보기`}>{n}</button>
      }
      return <Fragment key={k}>{part}</Fragment>
    })

  const lines = text.split('\n')
  const out: ReactNode[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
      i--
      const cells = rows.filter(r => !/^\|[-\s|]+\|?$/.test(r)).map(r => r.split('|').slice(1, -1).map(c => c.trim()))
      out.push(
        <div key={`t${i}`} style={{ overflowX: 'auto', margin: '6px 0' }}>
          <table className="table" style={{ border: '1px solid var(--line)', borderRadius: 8, whiteSpace: 'normal' }}>
            <thead><tr>{cells[0]?.map((c, j) => <th key={j}>{inline(c, `h${j}`)}</th>)}</tr></thead>
            <tbody>{cells.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${ri}${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      continue
    }
    if (l.startsWith('- ')) {
      out.push(<div key={i} style={{ paddingLeft: 16, textIndent: -12 }}>• {inline(l.slice(2), i)}</div>)
      continue
    }
    out.push(<div key={i} style={{ minHeight: l ? undefined : 10 }}>{inline(l, i)}</div>)
  }
  return <div style={{ whiteSpace: 'normal' }}>{out}</div>
}

function SourcePanel({ turn, activeIdx, onSelect }: { turn?: Turn; activeIdx: number; onSelect: (i: number) => void }) {
  const passageRef = useRef<HTMLSpanElement>(null)
  const doc = turn?.sources[activeIdx]
  useEffect(() => {
    passageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [doc?.id, turn?.id])

  if (!turn || turn.stage < 2) {
    return <aside className="card sa-chat" aria-label="근거 문서"><div className="empty">하이브리드 검색 결과를 불러오는 중…</div></aside>
  }
  if (!turn.sources.length) {
    return <aside className="card sa-chat" aria-label="근거 문서"><div className="empty">표시할 근거 문서가 없습니다.</div></aside>
  }
  return (
    <aside className="card sa-chat" aria-label="근거 문서">
      <div className="card-head">
        <h2>근거 문서</h2>
        <span className="muted small">키워드·벡터 하이브리드 + Re-ranking</span>
      </div>
      <div className="src-list">
        {turn.sources.map((s, i) => {
          const excluded = s.excluded
          const col = COLLECTIONS.find(c => c.id === s.collection)!
          return (
            <button key={s.id} className={`src-item ${i === activeIdx ? 'active' : ''}`} onClick={() => !excluded && onSelect(i)} disabled={excluded}
              style={excluded ? { opacity: .45, cursor: 'not-allowed' } : undefined} aria-pressed={i === activeIdx}>
              <span className="src-num">{i + 1}</span>
              <span>
                <span className="row wrap" style={{ gap: 6, marginBottom: 2 }}>
                  <span className={`badge ${col.external ? 'badge-warn' : s.collection === 'SAVE' ? 'badge-violet' : 'badge-blue'}`}>{col.label}</span>
                  {s.latest && <span className="badge badge-ok">최신판</span>}
                  {excluded && <span className="badge">검색 범위 제외</span>}
                </span>
                <span className="src-title" style={{ display: 'block' }}>{s.title}</span>
                <span className="src-meta">{s.meta} · p.{s.page}</span>
              </span>
              <span className="score-bars" aria-label={`점수: 키워드 ${s.scores.kw}, 벡터 ${s.scores.vec}, 리랭크 ${s.scores.rerank}`}>
                {([['키워드', s.scores.kw], ['벡터', s.scores.vec], ['리랭크', s.scores.rerank]] as const).map(([k, v]) => (
                  <span key={k} className="score-bar"><span>{k}</span><i><b style={{ width: `${v * 100}%`, background: k === '리랭크' ? 'var(--c-accent)' : undefined }} /></i><span>{v.toFixed(2)}</span></span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
      {doc && (
        <>
          <div className="row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
            <span className="small" style={{ fontWeight: 700 }}>[{activeIdx + 1}] {doc.title}</span>
            <span className="spacer" />
            {doc.collection === 'SAVE' && <Link className="btn btn-sm" to="/save">버전 이력</Link>}
            <button className="btn btn-sm">원문 PDF</button>
          </div>
          <div className="doc-viewer">
            <article className="doc-page" aria-label="원문 미리보기">
              {doc.paragraphs.map((p, i) => i === 0
                ? <h3 key={i}>{p}</h3>
                : <p key={i}>{i === doc.passage ? <span className="passage" ref={passageRef}>{p}</span> : p}</p>)}
              <div className="doc-pagenum">— {doc.page} —</div>
            </article>
          </div>
        </>
      )}
    </aside>
  )
}

function DocPicker({ picked, setPicked, onClose }: { picked: string[]; setPicked: (p: string[]) => void; onClose: () => void }) {
  const [sel, setSel] = useState(picked)
  const [q, setQ] = useState('')
  const list = Object.values(DOCS).filter(d => d.title.includes(q) || d.meta.includes(q))
  return (
    <Modal title="다중 문서 지정 질의 (Cross-document)" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>취소</button><button className="btn btn-primary" onClick={() => { setPicked(sel); onClose() }}>{sel.length}건 지정</button></>}>
      <p className="small muted" style={{ marginBottom: 10 }}>선택한 문서를 병렬 검색하여 컨텍스트를 통합한 뒤 비교·요약 답변을 생성합니다.</p>
      <input className="input" placeholder="문서명 검색" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 10 }} />
      <div className="stack" style={{ gap: 6 }}>
        {list.map(d => (
          <label key={d.id} className="row" style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={sel.includes(d.id)} onChange={e => setSel(e.target.checked ? [...sel, d.id] : sel.filter(x => x !== d.id))} />
            <span style={{ flex: 1 }}>
              <b className="small">{d.title}</b>
              <span className="muted xs" style={{ display: 'block' }}>{d.meta}</span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
