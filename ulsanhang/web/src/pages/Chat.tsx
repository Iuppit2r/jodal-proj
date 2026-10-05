import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUp, Check, Clock, Copy, CornerDownRight, Download, ExternalLink, FileSpreadsheet, FileText, Globe,
  GitBranch, History, Languages, Layers, Loader, LockKeyhole, MessageSquare, Network, PanelLeft, Plug, Plus, Receipt,
  Search, SearchX, ShieldAlert, ShieldCheck, Ship, Sparkles, Square, Star, ThumbsDown, ThumbsUp, Trash2, X, Zap, type LucideIcon,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import RichText from '../components/RichText'
import { LANGS, useI18n } from '../i18n'
import { DEMO_THREAD, getAnswer, SEED_HISTORY, STARTERS, type BotAnswer, type HistoryItem, type SourceKind } from '../mock/chat'
import { Anno } from '../proposal'

interface Msg {
  id: string
  role: 'user' | 'bot'
  text: string
  answer?: BotAnswer
  /** 멀티턴: 이어받은 이전 질문 */
  prevQ?: string
  lang?: 'ko' | 'en'
  streaming?: boolean
  slow?: boolean
  elapsed?: number
  feedback?: 'up' | 'down'
  commentSent?: boolean
}

const STARTER_ICONS: LucideIcon[] = [Receipt, Network, Ship, Clock, Languages, SearchX]
const KIND_ICON: Record<SourceKind, LucideIcon> = { PDF: FileText, HWP: FileText, XLSX: FileSpreadsheet, 웹페이지: Globe, API: Plug }

// 외부 LLM 전송 전 개인정보 감지 → 비식별화
const PII = [
  { re: /\d{6}-?[1-4]\d{6}/g, label: '주민등록번호' },
  { re: /01[016789]-?\d{3,4}-?\d{4}/g, label: '휴대전화번호' },
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/g, label: '이메일' },
]
function maskPII(s: string) {
  const found: string[] = []
  let out = s
  for (const p of PII) {
    if (out.match(p.re)) found.push(p.label)
    out = out.replace(p.re, (m) => '*'.repeat(m.length))
  }
  return { out, found }
}
/** 질문 언어 자동 인식: 한글이 없으면 영어로 답한다 */
const detectLang = (q: string): 'ko' | 'en' => (/[가-힣]/.test(q) ? 'ko' : 'en')

let seq = 0
const uid = () => `m${Date.now()}${seq++}`

/** 첫 화면에 보여 줄 멀티턴 예시 대화 */
function demoMessages(): Msg[] {
  const out: Msg[] = []
  DEMO_THREAD.forEach((q, i) => {
    const answer = getAnswer(q)
    out.push({ id: uid(), role: 'user', text: q })
    out.push({ id: uid(), role: 'bot', text: answer.text.ko, answer, lang: 'ko', elapsed: i ? 2.1 : 1.6, prevQ: i ? DEMO_THREAD[i - 1] : undefined })
  })
  return out
}

export default function ChatPage() {
  const { t, lang } = useI18n()
  const [history, setHistory] = useState<HistoryItem[]>(SEED_HISTORY)
  const [activeId, setActiveId] = useState<string | null>('demo')
  const [msgs, setMsgs] = useState<Msg[]>(demoMessages)
  const [input, setInput] = useState('')
  const [piiNotice, setPiiNotice] = useState<string[]>([])
  const [threadsOpen, setThreadsOpen] = useState(false)
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [live, setLive] = useState('')
  const timers = useRef<number[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const busy = msgs.some((m) => m.streaming)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const patch = (id: string, p: Partial<Msg>) => setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)))

  function stopAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMsgs((ms) => ms.map((m) => (m.streaming ? { ...m, streaming: false, slow: false } : m)))
  }

  function ask(raw: string) {
    const q = raw.trim()
    if (!q || busy) return
    const { out, found } = maskPII(q)
    setPiiNotice(found)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    if (!activeId) {
      const id = `h${Date.now()}`
      setHistory((h) => [{ id, title: out.slice(0, 40), date: '오늘' }, ...h])
      setActiveId(id)
    }
    const prevQ = [...msgs].reverse().find((m) => m.role === 'user')?.text
    const botId = uid()
    const answer = getAnswer(out)
    const qLang = detectLang(out)
    const full = answer.text[qLang]
    setMsgs((ms) => [...ms, { id: uid(), role: 'user', text: out }, { id: botId, role: 'bot', text: '', answer, lang: qLang, prevQ, streaming: true }])
    setLive('답변을 생성하고 있습니다.')

    const started = Date.now()
    const slowTimer = window.setTimeout(() => patch(botId, { slow: true }), 5000)
    timers.current.push(slowTimer)
    const firstDelay = answer.cached ? 150 : 900
    let i = 0
    const step = () => {
      i = Math.min(full.length, i + 4)
      patch(botId, { text: full.slice(0, i) })
      if (i < full.length) {
        timers.current.push(window.setTimeout(step, 16))
      } else {
        clearTimeout(slowTimer)
        const elapsed = (Date.now() - started) / 1000
        patch(botId, { streaming: false, slow: false, elapsed })
        setLive(`답변이 완료되었습니다. ${elapsed.toFixed(1)}초`)
      }
    }
    timers.current.push(window.setTimeout(step, firstDelay))
  }

  function newChat() {
    stopAll()
    setMsgs([])
    setActiveId(null)
    setPiiNotice([])
    setThreadsOpen(false)
    inputRef.current?.focus()
  }

  function openThread(h: HistoryItem) {
    stopAll()
    setActiveId(h.id)
    setThreadsOpen(false)
    setPiiNotice([])
    if (h.id === 'demo') { setMsgs(demoMessages()); return }
    const answer = getAnswer(h.title)
    const l = detectLang(h.title)
    setMsgs([
      { id: uid(), role: 'user', text: h.title },
      { id: uid(), role: 'bot', text: answer.text[l], answer, lang: l, elapsed: 1.4 },
    ])
  }

  function removeThread(id: string) {
    setHistory((h) => h.filter((x) => x.id !== id))
    if (id === activeId) newChat()
  }

  const lastBotId = [...msgs].reverse().find((m) => m.role === 'bot')?.id
  const groups = [
    { label: '오늘', items: history.filter((h) => h.date === '오늘') },
    { label: '이전', items: history.filter((h) => h.date !== '오늘') },
  ].filter((g) => g.items.length)

  return (
    <div className="chat">
      <aside className={`threads${threadsOpen ? ' open' : ''}`} aria-label={t('chat.history')}>
        <Anno n={11} place="in" className="threads-head">
          <button className="btn" onClick={newChat}><Plus size={16} />{t('chat.new')}</button>
        </Anno>
        <div className="thread-list">
          {history.length === 0 && <p className="threads-empty">저장된 대화가 없습니다.</p>}
          {groups.map((g) => (
            <div key={g.label}>
              <div className="threads-section">
                {g.label}
                {g.label === '오늘' && (
                  <button onClick={() => { if (confirm('모든 대화 이력을 삭제할까요?')) { setHistory([]); newChat() } }}>{t('chat.clearAll')}</button>
                )}
              </div>
              {g.items.map((h) => (
                <div key={h.id} className={`thread${h.id === activeId ? ' active' : ''}`}>
                  <button className="thread-btn" onClick={() => openThread(h)} aria-current={h.id === activeId}>
                    <MessageSquare size={15} />
                    <span>{h.title}</span>
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" aria-label={`${h.title} 삭제`} onClick={() => removeThread(h.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="threads-foot">
          <button className="btn btn-sm" onClick={() => setSurveyOpen(true)}><Star size={14} />서비스 만족도 평가</button>
          <p><Clock size={12} />대화 이력은 30일 후 자동 삭제됩니다</p>
        </div>
      </aside>

      <section className="chat-main" aria-label={t('nav.chat')}>
        <div className="chat-mobile-bar">
          <button className="btn btn-sm" onClick={() => setThreadsOpen((v) => !v)} aria-expanded={threadsOpen}><PanelLeft size={14} />{t('chat.history')}</button>
          <button className="btn btn-sm" onClick={newChat}><Plus size={14} />{t('chat.new')}</button>
        </div>

        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-inner">
            {msgs.length === 0 ? (
              <div className="empty">
                <div className="empty-mark"><BrandMark size={34} /></div>
                <h1>{t('chat.welcome')}</h1>
                <p>{t('chat.welcomeSub')}</p>
                <div className="suggestions">
                  {STARTERS.map((s, i) => {
                    const Icon = STARTER_ICONS[i]
                    return (
                      <button key={s.q} className="suggestion" onClick={() => ask(s.q)}>
                        <span className="icon-tile"><Icon size={16} /></span>
                        <span className="suggestion-text">
                          <small>{s.cat}</small>
                          <b>{s.q}</b>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="msg-user"><span className="sr-only">질문 </span>{m.text}</div>
                ) : (
                  <BotMessage key={m.id} m={m} isLast={m.id === lastBotId} onPatch={(p) => patch(m.id, p)} onAsk={ask} />
                ),
              )
            )}
          </div>
        </div>

        <div className="composer-area">
          <div className="composer-inner">
            {msgs.length > 0 && (
              <Anno n={1} place="out" className="scenario-bar">
                <span className="scenario-label">시나리오</span>
                {STARTERS.map((s, i) => {
                  const Icon = STARTER_ICONS[i]
                  return <button key={s.q} className="scenario-chip" onClick={() => ask(s.q)} disabled={busy} title={s.q}><Icon size={13} />{s.cat.split(' · ')[0]}</button>
                })}
              </Anno>
            )}
            {piiNotice.length > 0 && (
              <div className="callout callout-warn" role="status">
                <LockKeyhole size={16} />
                <span>{piiNotice.join(', ')} 정보가 감지되어 외부 AI로 보내기 전에 마스킹했습니다.</span>
              </div>
            )}
            <Anno n={9} place="out">
              <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
                <label htmlFor="q" className="sr-only">질문 입력</label>
                <textarea
                  id="q"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={1000}
                  placeholder={t('chat.placeholder')}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      ask(input)
                    }
                  }}
                />
                <div className="composer-bar">
                  <Anno n={10} inline place="right">
                    <span className="row" style={{ gap: 6 }}><Globe size={14} />{LANGS.find((l) => l.code === lang)?.label} · 질문 언어 자동 인식</span>
                  </Anno>
                  <span className="grow" />
                  <span className="row hide-sm" style={{ gap: 4 }}><LockKeyhole size={13} />개인정보 자동 마스킹</span>
                  {busy ? (
                    <button type="button" className="btn btn-primary send" onClick={stopAll} aria-label={t('chat.stop')}><Square size={13} fill="currentColor" /></button>
                  ) : (
                    <button type="submit" className="btn btn-primary send" disabled={!input.trim()} aria-label={t('chat.send')}><ArrowUp size={17} strokeWidth={2.25} /></button>
                  )}
                </div>
              </form>
            </Anno>
            <p className="composer-note">{t('chat.disclaimer')}</p>
          </div>
        </div>
        <div className="sr-only" aria-live="polite">{live}</div>
      </section>

      {surveyOpen && <SurveyDialog onClose={() => setSurveyOpen(false)} />}
    </div>
  )
}

function BotMessage({ m, isLast, onPatch, onAsk }: { m: Msg; isLast: boolean; onPatch: (p: Partial<Msg>) => void; onAsk: (q: string) => void }) {
  const { t } = useI18n()
  const [comment, setComment] = useState('')
  const [copied, setCopied] = useState(false)
  const a = m.answer!
  const done = !m.streaming
  // 제안 포인트 번호는 마지막 답변에만 붙인다
  const pin = (n: number, node: ReactNode, inline?: boolean) => (isLast ? <Anno n={n} inline={inline} place={inline ? 'right' : 'out'}>{node}</Anno> : node)

  return (
    <div className="msg-bot">
      <div className="bot-mark" aria-hidden><Sparkles size={15} /></div>
      <div className="msg-body">
        <span className="sr-only">AI 답변</span>

        {m.prevQ && pin(4, <div className="context-line"><History size={13} />이전 질문 “{m.prevQ}”의 맥락을 이어서 답변</div>)}

        {m.text === '' ? (
          <div className="thinking"><Loader size={16} className="spin" />공사 자료를 검색하고 있습니다</div>
        ) : (
          <RichText text={m.text} streaming={m.streaming} />
        )}
        {m.slow && <div className="slow" role="status"><Clock size={14} />{t('chat.slow')}</div>}

        {done && pin(2, a.fallback ? (
          <div className="ground-line warn"><ShieldAlert size={14} />공사 자료에서 근거를 찾지 못해 답변을 만들지 않았습니다 · 환각 방지 가드레일</div>
        ) : (
          <div className="ground-line"><ShieldCheck size={14} />공사 검증 자료 {a.sources.length}건에서 근거를 찾아 답변 · 자료 범위 밖 내용은 생성하지 않음</div>
        ))}

        {done && a.graph && pin(5, (
          <div className="kg">
            <div className="section-label"><GitBranch size={14} />지식그래프 연결 경로 · 흩어진 규정을 이어서 답변</div>
            <ol className="kg-path">
              {a.graph.map((g, i) => (
                <li key={g}>{i > 0 && <ArrowRight size={13} className="faint" />}<span className={i === a.graph!.length - 1 ? 'kg-node end' : 'kg-node'}>{g}</span></li>
              ))}
            </ol>
          </div>
        ))}

        {done && a.fallback && (
          <div>
            <div className="section-label"><Search size={14} />울산항만공사 통합검색 결과로 안내</div>
            <div className="sources">
              {a.fallback.results.map((r) => (
                <a key={r.title} className="source" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="icon-tile"><Globe size={15} /></span>
                  <span className="source-text"><b>{r.title}</b><span>{r.path}</span></span>
                  <ExternalLink size={14} className="faint" />
                </a>
              ))}
            </div>
          </div>
        )}

        {done && a.sources.length > 0 && pin(3, (
          <div>
            <div className="section-label"><Layers size={14} />{t('chat.sources')} · 원문 링크 · 담당 부서 · 첨부파일</div>
            <div className="sources">
              {a.sources.map((s) => {
                const Icon = KIND_ICON[s.kind]
                const file = s.kind === 'PDF' || s.kind === 'HWP' || s.kind === 'XLSX'
                return (
                  <a key={s.title} className="source" href={s.url} onClick={(e) => e.preventDefault()} title={s.title}>
                    <span className="icon-tile"><Icon size={15} /></span>
                    <span className="source-text">
                      <b>{s.title}</b>
                      <span>{s.dept ? `담당 ${s.dept}` : s.site} · {s.updated} 갱신</span>
                    </span>
                    {file ? <Download size={15} className="faint" aria-label="첨부파일 받기" /> : <ExternalLink size={14} className="faint" aria-label="원문 보기" />}
                  </a>
                )
              })}
            </div>
          </div>
        ))}

        {done && (
          <div className="stack">
            {pin(7, (
              <div className="msg-toolbar">
                <button className="btn btn-ghost btn-sm" aria-pressed={m.feedback === 'up'} onClick={() => onPatch({ feedback: 'up' })}><ThumbsUp size={14} />{t('chat.helpful')}</button>
                <button className="btn btn-ghost btn-sm" aria-pressed={m.feedback === 'down'} onClick={() => onPatch({ feedback: 'down' })}><ThumbsDown size={14} />{t('chat.notHelpful')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(m.text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}{t('chat.copy')}
                </button>
                <span className="meta">
                  {pin(8, (
                    <span className="row" style={{ gap: 4 }}>
                      {a.cached ? <Zap size={13} /> : <Clock size={13} />}
                      {a.cached ? '캐시 응답 · ' : ''}{m.elapsed !== undefined ? `${m.elapsed.toFixed(1)}초 · 목표 5초 이내` : ''}
                    </span>
                  ), true)}
                </span>
              </div>
            ))}
            {m.feedback === 'down' && !m.commentSent && (
              <form className="feedback-form" onSubmit={(e) => { e.preventDefault(); onPatch({ commentSent: true }) }}>
                <label htmlFor={`c-${m.id}`} className="sr-only">답변 개선 의견</label>
                <input id={`c-${m.id}`} className="input" placeholder="어떤 점이 아쉬웠나요?" value={comment} onChange={(e) => setComment(e.target.value)} autoFocus />
                <button className="btn btn-primary">보내기</button>
              </form>
            )}
            {(m.feedback === 'up' || m.commentSent) && <p className="thanks" role="status"><Check size={14} />의견이 관리자 피드백 화면으로 전달되었습니다.</p>}
          </div>
        )}

        {done && isLast && a.followups.length > 0 && pin(6, (
          <div>
            <div className="section-label"><CornerDownRight size={14} />{m.lang === 'en' ? 'Suggested next questions' : t('chat.followups')}</div>
            <div className="followups">
              {a.followups.map((f) => (
                <button key={f} className="followup" onClick={() => onAsk(f)}>
                  <CornerDownRight size={15} />{f}<ArrowRight size={15} className="end" />
                </button>
              ))}
              <Link className="followup" to="/schedule">
                <Ship size={15} />스케줄 예측 화면에서 선석·혼잡도 보기<ArrowRight size={15} className="end" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SurveyDialog({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0)
  const [sent, setSent] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="survey-title" className="dialog">
        <div className="row between">
          <h2 id="survey-title">{sent ? '참여해 주셔서 감사합니다' : '서비스 만족도 평가'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="닫기" autoFocus><X size={16} /></button>
        </div>
        {sent ? (
          <>
            <p className="muted">남겨주신 의견은 서비스 개선에 반영됩니다.</p>
            <button className="btn btn-primary" onClick={onClose}>닫기</button>
          </>
        ) : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack-sm">
              <legend className="label" style={{ marginBottom: 6 }}>울산항 AI 서비스에 얼마나 만족하셨나요?</legend>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} className={n <= score ? 'on' : ''} aria-pressed={score === n} aria-label={`${n}점`} onClick={() => setScore(n)}>
                    <Star size={20} fill={n <= score ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="survey-opinion">개선 의견</label>
              <textarea id="survey-opinion" className="textarea" rows={3} placeholder="선택 사항" />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={onClose}>취소</button>
              <button className="btn btn-primary" disabled={!score}>제출</button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
