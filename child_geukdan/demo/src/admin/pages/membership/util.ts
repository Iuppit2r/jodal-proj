import { useMemo } from 'react'
import { useStore } from '../../../store'
import type { Coupon, Member, MembershipTier } from '../../../data/types'

/** 등급별 가입 회원 (탈퇴 제외) */
export function usePaidMembers() {
  const members = useStore(s => s.members)
  return useMemo(() => members.filter(m => m.membership && m.status !== '탈퇴'), [members])
}

export function countByTier(paid: Member[]) {
  const m = new Map<string, number>()
  for (const x of paid) m.set(x.membership!.tierId, (m.get(x.membership!.tierId) ?? 0) + 1)
  return m
}

/** 등급 혜택 문구에서 가입 즉시 지급 쿠폰 도출 */
export function welcomeCoupon(t: MembershipTier, until: string): Omit<Coupon, 'id' | 'ownerId'> {
  if (t.benefits.some(b => b.includes('예매권'))) return { name: `${t.name} 멤버십 공연 예매권`, kind: '예매권', rate: 1, until }
  const hit = t.benefits.map(b => b.match(/([\d,]+)원\s*할인쿠폰/)).find(Boolean)
  const amount = hit ? Number(hit[1].replace(/,/g, '')) : 3000
  return { name: `${t.name} 멤버십 ${amount.toLocaleString()}원 할인`, kind: '할인쿠폰', amount, minPrice: 15000, until }
}

export const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5)

/** 잔여기간 일할 환불액 (10원 단위 절사) */
export function refundOf(price: number, since: string, until: string, today: string) {
  const total = Math.max(1, daysBetween(since, until) + 1)
  const remain = Math.max(0, Math.min(total, daysBetween(today, until)))
  return { total, remain, amount: Math.floor((price * remain) / total / 10) * 10 }
}

export const nowHm = (today: string) => `${today} ${new Date().toTimeString().slice(0, 5)}`
