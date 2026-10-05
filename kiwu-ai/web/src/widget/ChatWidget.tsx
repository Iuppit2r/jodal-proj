import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ChatPanel } from './ChatPanel'
import { LauncherButton } from './LauncherButton'

/**
 * 홈페이지 전 페이지 공통 탑재용 레이어 팝업 챗봇 (FUR-007, IR-001, IR-003)
 * - 우측 하단 런처 버튼 → 레이어 팝업, 모바일(<640px)은 전체 화면
 * - 닫아도 대화 내용은 유지(최소화)되어 페이지 이용을 방해하지 않음
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hint, setHint] = useState(true)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    // 모바일 전체 화면일 때 뒤 페이지 스크롤 잠금
    const mq = window.matchMedia('(max-width: 639px)')
    if (mq.matches) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const openChat = () => {
    setMounted(true)
    setOpen(true)
    setHint(false)
  }
  const close = () => {
    setOpen(false)
    launcherRef.current?.focus()
  }

  return (
    <div className="kiwu-chat-root">
      {mounted && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="kiwu-chat-title"
          hidden={!open}
          className={clsx(
            'fixed z-[9999] anim-pop',
            'inset-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(720px,calc(100dvh-8rem))] sm:w-[400px]',
            'sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line sm:shadow-[0_12px_48px_rgba(0,20,60,.18)]',
          )}
        >
          <ChatPanel variant="popup" onClose={close} />
        </div>
      )}

      <div className={clsx('fixed right-4 bottom-4 z-[9998] flex items-end gap-2 sm:right-6 sm:bottom-6', open && 'max-sm:hidden')}>
        {hint && !open && (
          <div className="anim-pop relative mb-2 hidden rounded-2xl rounded-br-sm border border-line bg-white py-2.5 pr-8 pl-3.5 text-sm shadow-lg sm:block">
            <p className="font-bold text-ink">ESG가 궁금하세요?</p>
            <p className="text-xs text-ink-3">눈높이에 맞춰 근거와 함께 알려드려요</p>
            <button
              type="button"
              aria-label="안내 닫기"
              onClick={() => setHint(false)}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full text-ink-3 hover:bg-canvas"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <LauncherButton ref={launcherRef} open={open} onClick={() => (open ? close() : openChat())} />
      </div>
    </div>
  )
}
