import type { ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import type { Booking } from '../../../data/types'
import { dayOf } from '../../lib'

/** 차트 공통 박스 (명시적 높이) */
export function ChartBox({ height = 260, children, title }: { height?: number; children: ReactNode; title?: ReactNode }) {
  return (
    <div className="min-w-0">
      {title && <div className="mb-2 text-xs font-bold text-muted">{title}</div>}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">{children as ReactElement}</ResponsiveContainer>
      </div>
    </div>
  )
}

export const axisTick = { fontSize: 11, fill: '#6b7280' }
export const gridProps = { stroke: '#eef0f4', strokeDasharray: '3 3', vertical: false }
export const tipStyle = { fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }

/** 축 레이블용 금액 축약 */
export const short = (n: number) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString()}만` : n.toLocaleString())
export const wonFmt = (v: unknown) => `${Number(v).toLocaleString('ko-KR')}원`
export const cntFmt = (v: unknown) => `${Number(v).toLocaleString('ko-KR')}`

export interface RangeFilter { from: string; to: string; perfId: string }

/** 기간(결제일 기준) + 공연 필터 */
export function filterBookings(bookings: Booking[], f: RangeFilter) {
  return bookings.filter(b => {
    if (f.perfId && b.perfId !== f.perfId) return false
    const d = dayOf(b.createdAt)
    if (f.from && d < f.from) return false
    if (f.to && d > f.to) return false
    return true
  })
}

/** 합계 행 스타일 */
export function TotalRow({ cells }: { cells: ReactNode[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-end gap-x-5 gap-y-1 rounded-lg bg-paper px-3 py-2 text-xs">
      {cells.map((c, i) => <span key={i}>{c}</span>)}
    </div>
  )
}
