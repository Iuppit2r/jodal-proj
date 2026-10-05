import clsx from 'clsx'
import { Check, ChevronDown, GraduationCap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LEVELS, levelById } from '../data/chat'
import type { LevelId } from '../types'

/**
 * 응답 눈높이 선택 (FUR-003) — 입력창 하단 칩 + 위로 열리는 팝오버.
 * 대화 시작 전·중 어디서든 같은 자리에서 즉시 바꿀 수 있음.
 */
export function LevelPicker({ value, onChange }: { value: LevelId; onChange: (id: LevelId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = levelById(value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition',
          open ? 'bg-navy text-white' : 'bg-navy-soft text-navy hover:bg-[#e2ebf7]',
        )}
      >
        <GraduationCap className="size-3.5" aria-hidden />
        <span className="sr-only">답변 눈높이: </span>
        {current.label}
        <ChevronDown className={clsx('size-3.5 transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="anim-pop absolute bottom-full left-0 z-30 mb-2 w-64 rounded-2xl border border-line bg-white p-1.5 shadow-[0_12px_32px_rgba(0,20,60,.16)]">
          <p id="level-pop-title" className="px-2.5 pt-1.5 pb-1 text-xs font-bold text-ink-3">
            어떤 눈높이로 설명할까요?
          </p>
          <div role="radiogroup" aria-labelledby="level-pop-title">
            {LEVELS.map((l) => {
              const active = l.id === value
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    onChange(l.id)
                    setOpen(false)
                  }}
                  className={clsx('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition', active ? 'bg-brand-soft' : 'hover:bg-canvas')}
                >
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block text-sm font-bold', active ? 'text-brand-deep' : 'text-ink')}>{l.label}</span>
                    <span className="block truncate text-xs text-ink-3">{l.description}</span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-brand-strong" aria-hidden />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
