import { Building2, ChevronDown, Cloud, Info, Leaf, School } from 'lucide-react'
import { useState } from 'react'
import { BotMark } from '../components/Logo'
import { AI_NOTICE } from '../data/chat'

// 첫 화면은 최소한의 텍스트만: 인사 한 줄 + 시작 질문 4개 + 한 줄 안내
const STARTERS = [
  { icon: Leaf, title: 'ESG가 뭔가요?', question: 'ESG가 무엇인가요?', tint: 'bg-emerald-50 text-esg-e' },
  { icon: Building2, title: '중소기업 ESG 인증', question: '중소기업인데 ESG 인증을 받으려면 무엇부터 해야 하나요?', tint: 'bg-navy-soft text-navy' },
  { icon: Cloud, title: 'Scope 3 쉽게 알기', question: '온실가스 Scope 3가 무엇인가요?', tint: 'bg-sky-50 text-sky-700' },
  { icon: School, title: '경인여대의 ESG', question: '경인여대는 ESG를 어떻게 실천하고 있나요?', tint: 'bg-brand-soft text-brand-strong' },
]

export function WelcomeView({ onAsk }: { onAsk: (q: string) => void }) {
  const [noticeOpen, setNoticeOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col px-5 pt-8 pb-4">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BotMark className="size-14 shadow-[0_8px_20px_rgba(212,21,45,.25)]" />
        <h2 className="mt-4 text-xl font-bold tracking-tight">ESG, 무엇이든 물어보세요</h2>
        <p className="mt-1.5 text-sm text-ink-3">눈높이에 맞춰 근거와 함께 알려드려요</p>

        <ul className="mt-7 grid w-full grid-cols-2 gap-2">
          {STARTERS.map((s) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => onAsk(s.question)}
                className="group flex h-full w-full flex-col items-start gap-2.5 rounded-2xl border border-line bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-ink-3/40 hover:shadow-[0_6px_16px_rgba(0,0,0,.06)]"
              >
                <span className={`grid size-8 place-items-center rounded-xl ${s.tint}`}>
                  <s.icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-bold text-ink">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* FUR-005: 대화 시작 시 생성형 AI 한계 안내 — 한 줄 요약 + 펼쳐보기 */}
      <div className="mt-6 text-xs text-ink-3">
        <button
          type="button"
          aria-expanded={noticeOpen}
          onClick={() => setNoticeOpen(!noticeOpen)}
          className="mx-auto flex items-center gap-1 rounded-full px-2 py-1 hover:bg-canvas hover:text-ink-2"
        >
          <Info className="size-3.5" aria-hidden />
          AI 답변은 부정확할 수 있어요. 출처를 함께 확인하세요.
          <ChevronDown className={`size-3.5 transition ${noticeOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {noticeOpen && <p className="anim-pop mt-2 rounded-xl bg-canvas p-3 text-left leading-relaxed text-ink-2">{AI_NOTICE}</p>}
      </div>
    </div>
  )
}
