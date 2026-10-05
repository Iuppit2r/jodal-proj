import { useId } from 'react'

/** 울산항만공사 심볼 모티프: 먼 바다로 나아가는 배 형상의 'U'(블루 그러데이션) + 비전과 열정의 오렌지 원 */
export default function BrandMark({ size = 20 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#4e88b9" />
          <stop offset="0.6" stopColor="#1a4299" />
          <stop offset="1" stopColor="#293b92" />
        </linearGradient>
      </defs>
      <path d="M4.5 2.5h6.2c0 11 2.6 19.2 8.8 19.2 3.4 0 6-2 7.6-4.7-.9 7.4-6.2 12.5-12.3 12.5C8.6 29.5 4.5 20 4.5 9.5Z" fill={`url(#${id})`} />
      <circle cx="21.2" cy="9" r="4.2" fill="#f39322" />
    </svg>
  )
}
