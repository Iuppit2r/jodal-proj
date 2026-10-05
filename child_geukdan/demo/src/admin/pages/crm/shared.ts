import { useMemo } from 'react'
import { create } from 'zustand'
import { ageOf, useBookings, useStore } from '../../../store'
import type { Booking, Coupon, Member, MembershipTier } from '../../../data/types'
import { netAmount } from '../../lib'
import { errMsg } from '../../ui'

/* ── 연령대 ── */
export const AGE_GROUPS = ['어린이', '청소년', '20대', '30대', '40대', '50대+'] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]
export function ageGroup(birth: string): AgeGroup {
  const a = ageOf(birth)
  if (a <= 12) return '어린이'
  if (a <= 18) return '청소년'
  if (a < 30) return '20대'
  if (a < 40) return '30대'
  if (a < 50) return '40대'
  return '50대+'
}

export const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '강원', '충북', '전북', '경남'] as const

/* ── 회원별 예매 통계 (bookings 를 userId 로 1회 색인) ── */
export interface MemberStat {
  bookings: Booking[]
  count: number // 유효 예매 건수
  spend: number // 총 구매금액
  views: number // 관람 횟수 (관람완료/입장)
  perfIds: Set<string>
  last?: string
}
const EMPTY_STAT: MemberStat = { bookings: [], count: 0, spend: 0, views: 0, perfIds: new Set() }
export const statOf = (m: Map<string, MemberStat>, id: string) => m.get(id) ?? EMPTY_STAT

export function useMemberStats() {
  const bookings = useBookings()
  return useMemo(() => {
    const idx = new Map<string, MemberStat>()
    for (const b of bookings) {
      if (!b.userId) continue
      let s = idx.get(b.userId)
      if (!s) { s = { bookings: [], count: 0, spend: 0, views: 0, perfIds: new Set() }; idx.set(b.userId, s) }
      s.bookings.push(b)
      if (b.status === '취소완료') continue
      s.count++
      s.spend += netAmount(b)
      s.perfIds.add(b.perfId)
      if (b.status === '관람완료' || b.seats.some(x => x.used)) s.views++
      if (!s.last || b.createdAt > s.last) s.last = b.createdAt
    }
    return idx
  }, [bookings])
}

/* ── 회원 멤버십 표시 ── */
export function tierOf(m: Member, tiers: MembershipTier[]) {
  return m.membership ? tiers.find(t => t.id === m.membership!.tierId) ?? null : null
}

/* ── CRM 로컬 상태 (저장 세그먼트, 휴면 사전고지 이력) ── */
export interface Segment {
  id: string; name: string; createdAt: string; count: number
  cond: { perfIds: string[]; minViews: number; ages: AgeGroup[]; regions: string[]; membership: string }
}
interface CrmLocal {
  segments: Segment[]
  noticed: Record<string, string> // memberId → 사전고지 발송일
  set: (p: Partial<Omit<CrmLocal, 'set'>>) => void
}
export const useCrmLocal = create<CrmLocal>()(set => ({
  segments: [
    { id: 'sg1', name: '가을 신작 관심 가족 (어린이·30~40대)', createdAt: '2026-09-20 10:00', count: 0, cond: { perfIds: [], minViews: 1, ages: ['어린이', '30대', '40대'], regions: [], membership: 'all' } },
    { id: 'sg2', name: '유료회원 재관람 유도 (2회 이상)', createdAt: '2026-09-28 16:30', count: 0, cond: { perfIds: [], minViews: 2, ages: [], regions: [], membership: 'paid' } },
  ],
  noticed: {},
  set: p => set(p),
}))

/* ── 쿠폰 입력값 ── */
export interface CouponDraft {
  name: string; kind: Coupon['kind']; mode: 'amount' | 'rate'; amount: number; rate: number; minPrice: number; until: string
}
export const emptyCoupon = (until = '2026-12-31'): CouponDraft => ({ name: '', kind: '할인쿠폰', mode: 'amount', amount: 5000, rate: 10, minPrice: 15000, until })

export function validateCoupon(c: CouponDraft, today: string): Partial<Record<keyof CouponDraft, string>> {
  const e: Partial<Record<keyof CouponDraft, string>> = {}
  if (!c.name.trim()) e.name = errMsg('E-PM-201', '쿠폰명을 입력해 주세요')
  if (c.kind === '할인쿠폰') {
    if (c.mode === 'amount' && (!c.amount || c.amount < 100)) e.amount = errMsg('E-PM-202', '할인 금액은 100원 이상이어야 합니다')
    if (c.mode === 'rate' && (!c.rate || c.rate < 1 || c.rate > 100)) e.rate = errMsg('E-PM-203', '할인율은 1~100% 범위로 입력해 주세요')
  }
  if (!c.until) e.until = errMsg('E-PM-204', '유효기간을 입력해 주세요')
  else if (c.until < today) e.until = errMsg('E-PM-205', '유효기간은 오늘 이후여야 합니다')
  return e
}

export function toCoupon(c: CouponDraft): Omit<Coupon, 'id' | 'ownerId'> {
  if (c.kind === '예매권') return { name: c.name.trim(), kind: '예매권', rate: 1, until: c.until }
  return c.mode === 'amount'
    ? { name: c.name.trim(), kind: '할인쿠폰', amount: c.amount, minPrice: c.minPrice || undefined, until: c.until }
    : { name: c.name.trim(), kind: '할인쿠폰', rate: c.rate / 100, minPrice: c.minPrice || undefined, until: c.until }
}

export const couponBenefit = (c: Pick<Coupon, 'kind' | 'amount' | 'rate'>) =>
  c.kind === '예매권' ? '공연 1매 무료' : c.amount ? `${c.amount.toLocaleString()}원 할인` : `${Math.round((c.rate ?? 0) * 100)}% 할인`

/* ── 메시지 바이트 계산 (EUC-KR 기준: 한글 2byte) ── */
export function byteLen(s: string) {
  let n = 0
  for (const ch of s) n += ch.charCodeAt(0) > 127 ? 2 : 1
  return n
}

/** 상태 변경 등 공통 회원 변경 처리 */
export function useMemberActions() {
  const updateMember = useStore(s => s.updateMember)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const sendSms = useStore(s => s.sendSms)
  return { updateMember, log, toast, sendSms }
}
