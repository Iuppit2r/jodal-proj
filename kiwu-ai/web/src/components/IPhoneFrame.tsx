import clsx from 'clsx'
import type { ReactNode } from 'react'

/**
 * HTML/CSS iPhone 15 Pro 목업 (화면 393×852pt).
 * - statusBar: 상태바 영역(54px) 배경색과 글자 톤
 * - children: 상태바 아래 콘텐츠 영역(393×798)
 */
export function IPhoneFrame({
  children,
  statusBg = '#ffffff',
  statusTone = 'dark',
  indicatorTone = 'dark',
}: {
  children: ReactNode
  statusBg?: string
  statusTone?: 'dark' | 'light'
  indicatorTone?: 'dark' | 'light'
}) {
  const ink = statusTone === 'dark' ? '#000' : '#fff'
  return (
    <div className="relative select-none" style={{ width: 393 + 28, height: 852 + 28 }} role="region" aria-label="아이폰 화면 미리보기">
      {/* 측면 버튼 (액션·볼륨·전원) */}
      <span className="absolute top-[118px] -left-[3px] h-8 w-[4px] rounded-l-sm bg-[#3a3a3c]" aria-hidden />
      <span className="absolute top-[176px] -left-[3px] h-14 w-[4px] rounded-l-sm bg-[#3a3a3c]" aria-hidden />
      <span className="absolute top-[244px] -left-[3px] h-14 w-[4px] rounded-l-sm bg-[#3a3a3c]" aria-hidden />
      <span className="absolute top-[200px] -right-[3px] h-[88px] w-[4px] rounded-r-sm bg-[#3a3a3c]" aria-hidden />

      {/* 티타늄 테두리 + 베젤 */}
      <div className="absolute inset-0 rounded-[68px] bg-gradient-to-br from-[#5b5a58] via-[#2c2c2e] to-[#4a4948] p-[3px] shadow-[0_40px_80px_-20px_rgba(15,23,42,.45),0_18px_36px_-18px_rgba(15,23,42,.35)]">
        <div className="size-full rounded-[65px] bg-black p-[11px]">
          {/* 화면 */}
          <div className="relative size-full overflow-hidden rounded-[54px] bg-white [isolation:isolate] [transform:translateZ(0)]">
            {/* 상태바 */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-[54px] items-center justify-between pr-[30px] pl-[52px]" style={{ background: statusBg, color: ink }}>
              <span className="pt-1 text-[17px] font-semibold tracking-tight">9:41</span>
              <span className="flex items-center gap-[6px] pt-1" aria-hidden>
                <svg width="19" height="12" viewBox="0 0 19 12" fill={ink}>
                  <rect x="0" y="8" width="3.2" height="4" rx="1" />
                  <rect x="5" y="5.5" width="3.2" height="6.5" rx="1" />
                  <rect x="10" y="3" width="3.2" height="9" rx="1" />
                  <rect x="15" y="0" width="3.2" height="12" rx="1" />
                </svg>
                <svg width="17" height="12" viewBox="0 0 17 12" fill={ink}>
                  <path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.5 10.5 0 0 0 8.5.6 10.5 10.5 0 0 0 1.1 3.6l1.2 1.2a8.8 8.8 0 0 1 6.2-2.5Z" />
                  <path d="M8.5 5.7c1.5 0 2.8.6 3.8 1.5l1.2-1.2A7 7 0 0 0 8.5 4a7 7 0 0 0-5 2l1.2 1.2c1-1 2.3-1.5 3.8-1.5Z" />
                  <path d="M8.5 9.1c.6 0 1.1.2 1.5.6L8.5 11.3 7 9.7c.4-.4.9-.6 1.5-.6Z" />
                </svg>
                <span className="relative flex h-[13px] w-[27px] items-center rounded-[4px] border p-[1.5px]" style={{ borderColor: statusTone === 'dark' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.45)' }}>
                  <span className="h-full w-[80%] rounded-[2px]" style={{ background: ink }} />
                  <span className="absolute top-1/2 -right-[3.5px] h-[4px] w-[1.5px] -translate-y-1/2 rounded-r" style={{ background: statusTone === 'dark' ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.5)' }} />
                </span>
              </span>
            </div>

            {/* 다이내믹 아일랜드 */}
            <div className="absolute top-[11px] left-1/2 z-30 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" aria-hidden />

            {/* 콘텐츠 */}
            <div className="absolute inset-x-0 top-[54px] bottom-0 overflow-hidden">{children}</div>

            {/* 홈 인디케이터 */}
            <div
              className={clsx('absolute bottom-[8px] left-1/2 z-30 h-[5px] w-[134px] -translate-x-1/2 rounded-full', indicatorTone === 'dark' ? 'bg-black' : 'bg-white/90')}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}
