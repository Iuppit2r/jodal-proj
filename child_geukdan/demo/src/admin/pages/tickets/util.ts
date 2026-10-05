import { hash } from '../../../data/mock'
import type { Booking } from '../../../data/types'

export type IssueKind = '현장발권' | '모바일티켓' | '무인발권기'
export const ISSUE_KINDS: IssueKind[] = ['현장발권', '모바일티켓', '무인발권기']

/** 발권 유형 (채널 기준 결정적 산출) */
export function issueKind(b: Booking): IssueKind {
  if (b.channel === '현장') return '현장발권'
  if (b.channel === '모바일' || b.channel === '홈페이지') return '모바일티켓'
  return hash(b.id) % 5 < 3 ? '무인발권기' : '현장발권'
}
export const issuedCount = (b: Booking) => b.seats.filter(s => !s.cancelled && s.issued).length
export const usedCount = (b: Booking) => b.seats.filter(s => !s.cancelled && s.used).length
