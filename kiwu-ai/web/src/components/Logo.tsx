import clsx from 'clsx'

/** 임시 심볼. 정식 CI(로고 파일)는 발주기관 제공 후 교체 */
export function BotMark({ className, plain = false }: { className?: string; plain?: boolean }) {
  return (
    <span className={clsx('inline-grid place-items-center rounded-full text-white', !plain && 'bg-brand-strong', className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none">
        <path d="M12 3.5c-4 2.4-5.6 5.6-5.6 8.8a5.6 5.6 0 0 0 11.2 0c0-3.2-1.6-6.4-5.6-8.8Z" fill="currentColor" />
        <path d="M12 8.5v11" stroke="#d4152d" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 13.2l2.4-2" stroke="#d4152d" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={clsx('flex items-baseline gap-1.5 font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>
      <span className={clsx('text-[13px] font-medium', light ? 'text-white/80' : 'text-brand-strong')}>감동+대학</span>
      <span className="text-lg">경인여자대학교</span>
    </span>
  )
}
