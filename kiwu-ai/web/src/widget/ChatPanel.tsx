import clsx from 'clsx'
import { ArrowUp, RotateCcw, X } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { BotMark } from '../components/Logo'
import { LevelPicker } from './LevelPicker'
import type { BotMessage, Source } from '../types'
import { MessageList } from './MessageList'
import { ReportSheet } from './ReportSheet'
import { SourceSheet } from './SourceSheet'
import { useChat } from './useChat'
import { WelcomeView } from './WelcomeView'

const MAX_LEN = 500

interface Props {
  /** popup: 홈페이지 레이어 팝업 / page: 전체 화면(모바일 링크·외부 채널용) */
  variant: 'popup' | 'page'
  onClose?: () => void
  titleId?: string
}

export function ChatPanel({ variant, onClose, titleId = 'kiwu-chat-title' }: Props) {
  const chat = useChat()
  const [input, setInput] = useState('')
  const [source, setSource] = useState<Source | null>(null)
  const [reporting, setReporting] = useState<BotMessage | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const submit = (text = input) => {
    if (!text.trim() || chat.busy) return
    chat.send(text)
    setInput('')
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const started = chat.messages.length > 0

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-3">
        <BotMark className="size-9" />
        <div className="min-w-0 flex-1">
          <h1 id={titleId} className="truncate text-[15px] font-bold">
            경인여대 ESG 챗봇
          </h1>
          <p className="flex items-center gap-1 truncate text-xs text-ink-3">
            <span className="size-1.5 shrink-0 rounded-full bg-esg-e" aria-hidden />
            24시간 · 근거와 함께 답변
          </p>
        </div>
        {started && (
          <HeaderBtn label="새 대화" onClick={chat.reset}>
            <RotateCcw className="size-4" />
          </HeaderBtn>
        )}
        {variant === 'popup' && onClose && (
          <HeaderBtn label="챗봇 닫기 (대화 내용은 유지됩니다)" onClick={onClose}>
            <X className="size-5" />
          </HeaderBtn>
        )}
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin" aria-live="polite" aria-relevant="additions">
        {started ? (
          <MessageList
            messages={chat.messages}
            busy={chat.busy}
            onAsk={submit}
            onShift={chat.shift}
            onFeedback={chat.setFeedback}
            onReport={setReporting}
            onSource={setSource}
          />
        ) : (
          <WelcomeView onAsk={submit} />
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="shrink-0 border-t border-line bg-white px-3 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="rounded-2xl border border-line bg-white p-1.5 pl-3.5 shadow-[0_2px_8px_rgba(0,0,0,.04)] focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
          <label htmlFor="kiwu-chat-input" className="sr-only">
            ESG 관련 질문 입력
          </label>
          <textarea
            id="kiwu-chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_LEN}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ESG에 대해 무엇이든 물어보세요"
            className="field-sizing-content block max-h-28 min-h-10 w-full resize-none bg-transparent pt-1.5 pr-2 text-[15px] leading-6 outline-none placeholder:text-ink-3 focus-visible:outline-none"
          />
          <div className="-ml-2 flex items-center gap-2">
            {/* FUR-003: 응답 눈높이 — 시작 전·대화 중 모두 이 자리에서 선택 */}
            <LevelPicker value={chat.level} onChange={chat.setLevel} />
            <span className="flex-1" aria-hidden />
            {input.length > MAX_LEN - 100 && (
              <span className="text-[11px] text-ink-3 tabular-nums">
                {input.length}/{MAX_LEN}
              </span>
            )}
            <button
              type="submit"
              aria-label="질문 보내기"
              disabled={!input.trim() || chat.busy}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-strong text-white transition hover:bg-brand-deep disabled:bg-line disabled:text-ink-3"
            >
              <ArrowUp className="size-4.5" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-ink-3">개인정보는 입력하지 마세요</p>
      </form>

      {source && <SourceSheet source={source} onClose={() => setSource(null)} />}
      {reporting && (
        <ReportSheet
          message={reporting}
          onClose={() => setReporting(null)}
          onDone={() => {
            chat.markReported(reporting.id)
            setReporting(null)
          }}
        />
      )}
    </div>
  )
}

function HeaderBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx('grid size-8 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-canvas hover:text-ink', className)}
    >
      {children}
    </button>
  )
}
