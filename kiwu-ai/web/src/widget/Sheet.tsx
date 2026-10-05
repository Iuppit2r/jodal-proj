import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/** 챗봇 패널 내부에서 아래→위로 올라오는 시트 (출처 상세, 오답 신고 등) */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prev?.focus()
    }
  }, [onClose])

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/30" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="anim-pop max-h-[85%] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl scroll-thin"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="grid size-8 place-items-center rounded-full hover:bg-canvas">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
