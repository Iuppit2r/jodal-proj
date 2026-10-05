import { useMemo } from 'react'
import { useStore, useBookings } from '../store'
import * as M from '../data/mock'
import type { Booking, Performance, Round } from '../data/types'

export const TODAY = M.TODAY

/** YYYY-MM-DD 날짜 연산 (로컬 기준) */
export function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const dayOf = (createdAt: string) => createdAt.slice(0, 10)
export const monthOf = (date: string) => date.slice(0, 7)

/** 유효 판매 금액 (취소 좌석 제외, 쿠폰할인 차감, 수수료 제외) */
export function netAmount(b: Booking) {
  const live = b.seats.filter(s => !s.cancelled)
  if (!live.length) return 0
  return Math.max(0, live.reduce((a, s) => a + s.price, 0) - (b.couponDiscount ?? 0))
}
/** 취소된 금액 */
export function cancelledAmount(b: Booking) {
  return b.seats.filter(s => s.cancelled).reduce((a, s) => a + s.price, 0)
}
export const liveSeats = (b: Booking) => b.seats.filter(s => !s.cancelled).length
export const isSale = (b: Booking) => b.status !== '취소완료' && b.status !== '입금대기'

export function usePerfMap() {
  const perfs = useStore(s => s.performances)
  return useMemo(() => new Map(perfs.map(p => [p.id, p])), [perfs])
}
export function useRoundMap() {
  const rounds = useStore(s => s.rounds)
  return useMemo(() => new Map(rounds.map(r => [r.id, r])), [rounds])
}

export const seatCount = (p: Performance) => {
  const v = M.venues.find(x => x.id === p.venueId)!
  return v.rows.length * v.cols
}

/** 회차별 판매 좌석 수 집계 (roundId → 판매 좌석) */
export function useSoldByRound() {
  const bookings = useBookings()
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bookings) {
      if (b.status === '취소완료') continue
      m.set(b.roundId, (m.get(b.roundId) ?? 0) + liveSeats(b))
    }
    return m
  }, [bookings])
}

export const roundLabel = (r?: Round) => (r ? `${r.date.replace(/-/g, '.')} ${r.time} (${r.no}회)` : '-')

export const ticketTypeName = (id: string) => M.ticketTypes.find(t => t.id === id)?.name ?? id

/** 결정적 의사난수 (통계 데모용) */
export const rng = M.seeded

export const pct = (a: number, b: number, digits = 1) => (b ? `${((a / b) * 100).toFixed(digits)}%` : '0%')
export const num = (n: number) => n.toLocaleString('ko-KR')
