import { X } from 'lucide-react'
import { forwardRef } from 'react'
import { BotMark } from '../components/Logo'

/** 챗봇 런처(원형 버튼) — 홈페이지 위젯과 /mobile 목업이 같은 디자인을 공유 */
export const LauncherButton = forwardRef<HTMLButtonElement, { open: boolean; onClick: () => void }>(function LauncherButton({ open, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? 'ESG 챗봇 닫기' : 'ESG 챗봇 열기'}
      className="group relative grid size-16 place-items-center rounded-full bg-brand-strong text-white shadow-[0_8px_24px_rgba(212,21,45,.4)] transition hover:scale-105 hover:bg-brand-deep"
    >
      {open ? <X className="size-7" /> : <BotMark plain className="size-11" />}
      {!open && <span className="absolute -top-1 -right-1 rounded-full bg-navy px-1.5 py-0.5 text-[10px] font-bold ring-2 ring-white">ESG</span>}
    </button>
  )
})
