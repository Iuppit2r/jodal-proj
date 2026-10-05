import { useMemo } from 'react'
import * as M from '../../data/mock'
import type { Booking, Coupon, Grade, Member, Performance, Round, SeatPick } from '../../data/types'
import { useBookings, useStore, venueOf } from '../../store'

/** 홈페이지에 노출 가능한 공연 (임시저장 제외) */
export const isPublic = (p: Performance) => p.status !== '임시저장'
/** 현재·예정 공연 */
export const isCurrent = (p: Performance) => isPublic(p) && p.status !== '판매종료' && p.end >= M.TODAY
export const isPast = (p: Performance) => isPublic(p) && (p.status === '판매종료' || p.end < M.TODAY)

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 864e5)
}

/** D-day 라벨: 개막 전 D-n, 공연 중 '공연중', 종료 '종료' */
export function dday(p: Performance) {
  if (p.end < M.TODAY) return '종료'
  if (p.start <= M.TODAY) return '공연중'
  const n = daysBetween(M.TODAY, p.start)
  return `D-${n}`
}

export const statusTone = (s: Performance['status']) =>
  s === '판매중' ? 'bg-brand-600 text-white'
    : s === '선예매중' ? 'bg-sun-400 text-ink'
      : s === '오픈예정' ? 'bg-mint-500 text-white'
        : s === '매진' ? 'bg-coral-500 text-white'
          : 'bg-gray-200 text-gray-600'

/** 공연 가격표에 없는 등급은 존재하는 등급으로 보정 (예: 소극장 A석 → S석) */
export function effGrade(p: Performance, g: Grade): Grade {
  if (p.prices[g] != null) return g
  if (g === 'W') return p.prices.A != null ? 'A' : 'S'
  if (p.prices.S != null) return 'S'
  return (Object.keys(p.prices)[0] as Grade) ?? 'S'
}
export const priceOf = (p: Performance, g: Grade) => p.prices[effGrade(p, g)] ?? 0

/** 좌석 등급 계산 함수 (관리자 등급 재배정 반영) */
export function useGradeFn(p: Performance | undefined) {
  const overrides = useStore(s => s.gradeOverrides)
  return useMemo(() => {
    if (!p) return () => 'S' as Grade
    const v = venueOf(p)
    return (seatId: string): Grade => effGrade(p, overrides[p.id]?.[seatId] ?? M.defaultGrade(v, seatId))
  }, [p, overrides])
}

export const totalSeats = (p: Performance) => { const v = venueOf(p); return v.rows.length * v.cols }

/** 공연별 회차 잔여석 (판매·보류·현장전용 제외) */
export function useRemainMap(perfId: string | undefined) {
  const bookings = useBookings()
  const holds = useStore(s => s.holds)
  const siteOnly = useStore(s => s.siteOnly)
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  return useMemo(() => {
    const map = new Map<string, number>()
    const p = perfs.find(x => x.id === perfId)
    if (!p) return map
    const total = totalSeats(p)
    const sold = new Map<string, Set<string>>()
    for (const b of bookings) {
      if (b.perfId !== perfId) continue
      let s = sold.get(b.roundId)
      if (!s) { s = new Set(); sold.set(b.roundId, s) }
      for (const st of b.seats) if (!st.cancelled) s.add(st.seatId)
    }
    for (const r of rounds) {
      if (r.perfId !== perfId) continue
      const s = new Set(sold.get(r.id) ?? [])
      for (const h of holds[r.id] ?? []) s.add(h)
      for (const h of siteOnly[r.id] ?? []) s.add(h)
      map.set(r.id, Math.max(0, total - s.size))
    }
    return map
  }, [bookings, holds, siteOnly, perfs, rounds, perfId])
}

export function usePerfRounds(perfId: string | undefined, futureOnly = true) {
  const rounds = useStore(s => s.rounds)
  return useMemo(
    () => rounds.filter(r => r.perfId === perfId && r.active && (!futureOnly || r.date >= M.TODAY))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [rounds, perfId, futureOnly],
  )
}

export const roundLabel = (r: Round) => `${r.date.replace(/-/g, '.')} ${r.time} (${r.no}회)`

export const ticketTypeOf = (id: string) => M.ticketTypes.find(t => t.id === id)
export const BOOKING_FEE = 1000

/** 권종별 가격 (100원 단위 반올림) */
export const applyRate = (base: number, rate: number) => Math.round(base * (1 - rate) / 100) * 100

/** 쿠폰 할인액 계산 (예매권은 최고가 1매 무료) */
export function couponDiscount(c: Coupon | undefined, seats: { price: number }[]) {
  if (!c) return 0
  const subtotal = seats.reduce((a, s) => a + s.price, 0)
  if (c.minPrice && subtotal < c.minPrice) return 0
  if (c.kind === '예매권') return seats.length ? Math.max(...seats.map(s => s.price)) : 0
  if (c.amount) return Math.min(c.amount, subtotal)
  if (c.rate) return Math.min(subtotal, Math.round(subtotal * c.rate / 100) * 100)
  return 0
}
export const couponLabel = (c: Coupon) =>
  c.kind === '예매권' ? '1매 무료' : c.amount ? `${c.amount.toLocaleString()}원 할인` : c.rate ? `${Math.round(c.rate * 100)}% 할인` : ''

export const usableCoupons = (coupons: Coupon[], me: Member | null) =>
  coupons.filter(c => me && c.ownerId === me.id && !c.usedBookingId && c.until >= M.TODAY)

/**
 * 취소 수수료 (FAQ 규정)
 * 예매 당일 무료 / 관람 10일 전까지 무료 / 9~7일 전 매당 1,000원 / 6~3일 전 10% / 2~1일 전 30% / 당일 취소 불가
 */
export function cancelRule(b: Booking, round: Round | undefined): { allowed: boolean; label: string; feeFor: (s: SeatPick) => number } {
  if (!round) return { allowed: false, label: '회차 정보 없음', feeFor: () => 0 }
  const days = daysBetween(M.TODAY, round.date)
  if (days <= 0) return { allowed: false, label: days < 0 ? '관람일이 지난 예매입니다' : '관람 당일에는 취소할 수 없습니다', feeFor: () => 0 }
  if (b.createdAt.slice(0, 10) === M.TODAY) return { allowed: true, label: '예매 당일 취소 — 수수료 없음', feeFor: () => 0 }
  if (days >= 10) return { allowed: true, label: `관람 ${days}일 전 — 수수료 없음`, feeFor: () => 0 }
  if (days >= 7) return { allowed: true, label: `관람 ${days}일 전 — 매당 1,000원`, feeFor: s => Math.min(1000, s.price) }
  if (days >= 3) return { allowed: true, label: `관람 ${days}일 전 — 티켓금액의 10%`, feeFor: s => Math.round(s.price * 0.1 / 10) * 10 }
  return { allowed: true, label: `관람 ${days}일 전 — 티켓금액의 30%`, feeFor: s => Math.round(s.price * 0.3 / 10) * 10 }
}

export const bookingTone = (s: Booking['status']) =>
  s === '예매완료' || s === '발권완료' ? 'bg-brand-50 text-brand-700'
    : s === '입금대기' ? 'bg-amber-100 text-amber-800'
      : s === '부분취소' ? 'bg-coral-400/15 text-coral-500'
        : s === '취소완료' ? 'bg-gray-100 text-gray-500'
          : 'bg-mint-400/15 text-mint-500'

export const isMobileWidth = () => typeof window !== 'undefined' && window.innerWidth < 768

/** 링크 경로 보정: '/signup' → '/site/signup' */
export const siteHref = (link: string) => (link.startsWith('/site') || link.startsWith('http') ? link : `/site${link.startsWith('/') ? '' : '/'}${link}`)
