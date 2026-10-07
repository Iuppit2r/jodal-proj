import { useState, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../store'

/** 상태표시줄 높이만큼 비워두는 상단 바 */
export function TopBar({ title, back = true, right, transparent, dark }: { title?: string; back?: boolean; right?: ReactNode; transparent?: boolean; dark?: boolean }) {
  const pop = useApp((s) => s.pop)
  return (
    <header
      className={`shrink-0 pt-[47px] ${transparent ? 'absolute inset-x-0 top-0 z-20' : dark ? '' : 'bg-white'} ${dark ? 'text-white' : 'text-ink'}`}
    >
      <div className="flex h-12 items-center gap-1 px-2">
        {back ? (
          <button onClick={pop} className={`grid size-10 place-items-center rounded-full ${transparent ? 'bg-black/25 text-white backdrop-blur' : ''}`} aria-label="뒤로">
            <ChevronLeft size={26} />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="flex-1 truncate text-[17px] font-bold tracking-tight">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Page({ children, className = 'bg-bg' }: { children: ReactNode; className?: string }) {
  return <div className={`absolute inset-0 z-30 flex flex-col anim-slide ${className}`}>{children}</div>
}

/** 스크롤 영역. underStatus: 화면 맨 위부터 시작하는 화면 – 스크롤하면 상태표시줄 뒤에 배경을 깔아 글자가 겹치지 않게 함 */
export function Scroll({ children, className = '', underStatus, onScrolled }: { children: ReactNode; className?: string; underStatus?: boolean; onScrolled?: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false)
  return (
    <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`} onScroll={underStatus || onScrolled ? (e) => {
          const v = e.currentTarget.scrollTop > (onScrolled ? 220 : 24)
          setScrolled(v)
          onScrolled?.(v)
        } : undefined}>
      {underStatus && !onScrolled && <div className={`pointer-events-none sticky top-0 z-[25] -mb-[47px] h-[47px] border-b bg-white/92 backdrop-blur-md transition-opacity duration-200 ${scrolled ? 'border-line opacity-100' : 'border-transparent opacity-0'}`} />}
      {children}
    </div>
  )
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between px-5">
      <h2 className="text-[18px] font-extrabold tracking-tight">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[15px] font-semibold text-brand">
          {action}
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`block ${onClick && !/(^| )w-/.test(className) ? "w-full" : ""} rounded-[20px] bg-white ${/text-(center|right)/.test(className) ? "" : "text-left"} shadow-[0_1px_2px_rgba(28,32,29,.04),0_4px_16px_rgba(28,32,29,.05)] ${className}`}>
      {children}
    </Tag>
  )
}

export function Chip({ children, active, onClick, tone = 'neutral' }: { children: ReactNode; active?: boolean; onClick?: () => void; tone?: 'neutral' | 'green' | 'accent' | 'brand' }) {
  const toneCls =
    tone === 'green'
      ? 'bg-forest-50 text-forest'
      : tone === 'accent'
        ? 'bg-accent-50 text-accent'
        : tone === 'brand'
          ? 'bg-brand-50 text-brand'
          : active
            ? 'bg-brand text-white'
            : 'bg-white text-sub ring-1 ring-line'
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag onClick={onClick} className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold ${toneCls}`}>
      {children}
    </Tag>
  )
}

export function Progress({ value, className = 'h-2.5', done }: { value: number; className?: string; done?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-full bg-alt ${className}`}>
      <div className={`h-full rounded-full ${done ? 'bg-forest' : 'bg-accent'}`} style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, transition: 'width .6s ease' }} />
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, accent, className = '' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; accent?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold text-white transition active:scale-[.98] disabled:bg-[#E3E2DC] disabled:text-sub ${accent ? 'bg-accent' : 'bg-brand'} ${className}`}
    >
      {children}
    </button>
  )
}

export function BottomBar({ children }: { children: ReactNode }) {
  return <div className="shrink-0 border-t border-line bg-white px-5 pt-3 pb-[46px]">{children}</div>
}

export function Toast() {
  const toast = useApp((s) => s.toast)
  if (!toast) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[120px] z-[80] flex justify-center px-6">
      <div className="anim-rise rounded-full bg-ink/90 px-5 py-3 text-[15px] font-semibold text-white">{toast}</div>
    </div>
  )
}
