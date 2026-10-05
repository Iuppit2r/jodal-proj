import clsx from 'clsx'
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Copy,
  Flag,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Minus,
  Plus,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { BotMark } from '../components/Logo'
import { RichText } from '../components/RichText'
import { LEVELS, levelById } from '../data/chat'
import type { AnswerKind, BotMessage, ChatMessage, Source } from '../types'

interface Props {
  messages: ChatMessage[]
  busy: boolean
  onAsk: (q: string) => void
  onShift: (m: BotMessage, dir: -1 | 1) => void
  onFeedback: (id: string, v: 'up' | 'down') => void
  onReport: (m: BotMessage) => void
  onSource: (s: Source) => void
}

const KIND_BADGE: Partial<Record<AnswerKind, { label: string; icon: typeof Lightbulb; cls: string }>> = {
  inferred: { label: '추론 포함 답변', icon: Lightbulb, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  unknown: { label: '근거 확인 불가', icon: HelpCircle, cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  blocked: { label: '답변 제한', icon: ShieldAlert, cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  'out-of-scope': { label: '서비스 범위 안내', icon: HelpCircle, cls: 'bg-slate-100 text-slate-700 border-slate-200' },
}

export function MessageList(props: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const count = props.messages.length
  const last = props.messages.at(-1)
  const lastPending = last?.role === 'bot' && last.pending
  useEffect(() => {
    if (lastPending || last?.role !== 'bot') {
      // 질문 전송·답변 작성 중: 맨 아래로
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      return
    }
    // 답변 도착: 긴 답변도 처음부터 읽을 수 있게 직전 질문(없으면 답변) 시작 위치로
    const items = listRef.current?.children
    if (!items) return
    const i = props.messages.length - 1
    const prevIsUser = props.messages[i - 1]?.role === 'user'
    ;(items[prevIsUser ? i - 1 : i] as HTMLElement | undefined)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [count, lastPending]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={listRef} className="space-y-4 px-4 py-4">
      {props.messages.map((m) =>
        m.role === 'user' ? (
          <div key={m.id} className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-white">
              <span className="sr-only">내 질문: </span>
              {m.text}
            </p>
          </div>
        ) : (
          <BotBubble key={m.id} m={m} {...props} />
        ),
      )}
      <div ref={endRef} />
    </div>
  )
}

function BotBubble({ m, busy, onAsk, onShift, onFeedback, onReport, onSource }: Props & { m: BotMessage }) {
  if (m.pending || !m.answer) {
    return (
      <div>
        <BotHeader />
        <div className="inline-block rounded-2xl bg-canvas px-4 py-3" role="status">
          <span className="sr-only">답변을 작성하고 있습니다</span>
          <span className="flex gap-1" aria-hidden>
            <span className="typing-dot size-2 rounded-full bg-ink-3" />
            <span className="typing-dot size-2 rounded-full bg-ink-3" />
            <span className="typing-dot size-2 rounded-full bg-ink-3" />
          </span>
        </div>
      </div>
    )
  }

  const a = m.answer
  const badge = KIND_BADGE[a.kind]
  const lvIdx = LEVELS.findIndex((l) => l.id === a.level)
  const canShift = a.kind === 'grounded' || a.kind === 'inferred'

  return (
    <article className="anim-pop" aria-label="챗봇 답변">
      <BotHeader>
        <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold text-brand-deep">{levelById(a.level).label}</span>
        {badge && (
          <span className={clsx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium', badge.cls)}>
            <badge.icon className="size-3" aria-hidden />
            {badge.label}
          </span>
        )}
      </BotHeader>
      <div className="space-y-3">
        <div className="text-[15px] leading-relaxed text-ink-2">

          <RichText text={a.text} />

          {a.kind === 'inferred' && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              이 답변에는 지식베이스 근거를 바탕으로 한 <strong>추론</strong>이 포함되어 있어요. 출처 원문과 함께 확인해 주세요.
            </p>
          )}

          {a.steps && (
            <ol className="mt-3.5 space-y-2" aria-label="단계별 안내">
              {a.steps.map((s, i) => (
                <li key={s.title} className="flex gap-3 rounded-xl bg-canvas p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="text-sm">
                    <p className="font-bold text-ink">{s.title}</p>
                    <p className="mt-0.5 text-ink-2">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {a.glossary && (
            <dl className="mt-3.5 space-y-1.5 border-t border-dashed border-line pt-3 text-[13px]">
              <p className="text-xs font-bold text-ink-3">용어 풀이</p>
              {a.glossary.map((g) => (
                <div key={g.term} className="flex gap-2">
                  <dt className="shrink-0 font-bold text-ink">{g.term}</dt>
                  <dd className="text-ink-2">{g.meaning}</dd>
                </div>
              ))}
            </dl>
          )}

          {a.updatedNotice && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-esg-e">
              <RefreshCw className="size-3.5" aria-hidden />
              {a.updatedNotice}
            </p>
          )}

          {a.disclaimer && (
            <p className="mt-3 flex gap-1.5 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-3">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
              {a.disclaimer}
            </p>
          )}
        </div>

        {/* FUR-005 · IR-002: 답변 근거(출처) */}
        {a.sources && a.sources.length > 0 && (
          <section aria-label="답변 근거" className="rounded-xl border border-line bg-white p-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-bold text-ink-2">
              <BookOpen className="size-3.5 text-navy" aria-hidden />
              답변 근거 {a.sources.length}건
            </p>
            <ul className="space-y-1">
              {a.sources.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSource(s)}
                    className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-canvas"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded bg-navy-soft text-[11px] font-bold text-navy">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{s.title}</span>
                      <span className="block truncate text-[11px] text-ink-3">
                        {s.publisher} · {s.location}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-3 group-hover:text-ink" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FUR-003: 더 쉽게 / 더 자세히 + 피드백 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {canShift && (
            <>
              <button
                type="button"
                disabled={busy || lvIdx === 0}
                onClick={() => onShift(m, -1)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-ink-3 disabled:opacity-40"
              >
                <Minus className="size-3" aria-hidden /> 더 쉽게
              </button>
              <button
                type="button"
                disabled={busy || lvIdx === LEVELS.length - 1}
                onClick={() => onShift(m, 1)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-ink-3 disabled:opacity-40"
              >
                <Plus className="size-3" aria-hidden /> 더 자세히
              </button>
            </>
          )}
          <span className="ml-auto flex items-center gap-0.5">
            <IconBtn label="답변 복사" onClick={() => navigator.clipboard?.writeText(a.text.replace(/\*\*/g, ''))}>
              <Copy className="size-3.5" />
            </IconBtn>
            <IconBtn label="도움이 됐어요" pressed={m.feedback === 'up'} onClick={() => onFeedback(m.id, 'up')}>
              <ThumbsUp className="size-3.5" />
            </IconBtn>
            <IconBtn label="도움이 안 됐어요" pressed={m.feedback === 'down'} onClick={() => onFeedback(m.id, 'down')}>
              <ThumbsDown className="size-3.5" />
            </IconBtn>
            <IconBtn label={m.reported ? '오답 신고 완료' : '오답 신고'} pressed={m.reported} onClick={() => !m.reported && onReport(m)}>
              <Flag className="size-3.5" />
            </IconBtn>
          </span>
        </div>

        {a.followUps && a.followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {a.followUps.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => onAsk(q)}
                className="rounded-full bg-brand-soft px-3 py-1.5 text-left text-[13px] font-medium text-brand-deep hover:bg-brand-line disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function IconBtn({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        'grid size-7 place-items-center rounded-full transition',
        pressed ? 'bg-navy-soft text-navy' : 'text-ink-3 hover:bg-canvas hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/** 답변 머리줄: 작은 챗봇 아이콘 + 이름 + 배지 (아이콘을 옆이 아닌 위에 두어 본문이 전체 폭 사용) */
function BotHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <BotMark className="size-6" />
      <span className="mr-0.5 text-[13px] font-bold text-ink">ESG 챗봇</span>
      {children}
    </div>
  )
}
