import { useCallback } from 'react'
import { useStore, nowStr, venueOf } from '../../../store'
import * as M from '../../../data/mock'
import type { Booking, BookingStatus, Channel, Grade, PayMethod, Performance, Round } from '../../../data/types'
import { TODAY } from '../../lib'

export const STATUSES: BookingStatus[] = ['입금대기', '예매완료', '발권완료', '부분취소', '취소완료', '관람완료']
export const CHANNELS: Channel[] = ['홈페이지', '모바일', '현장', '콜센터', '외부예매처']
export const PAY_METHODS: PayMethod[] = ['신용카드', '가상계좌', '간편결제', '현금', '초대']
export const CANCEL_REASONS = ['고객 요청', '공연 취소', '중복 예매', '결제 오류']

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 864e5)

/**
 * 취소수수료 (FAQ 기준)
 * 예매 당일 무료 · 관람 10일 전 무료 · 9~7일 전 1,000원(매당) · 6~3일 전 10% · 2~1일 전 30% · 관람 당일/이후 취소 불가
 */
export function cancelFee(b: Booking, round: Round | undefined, seatIds: string[]): {
  fee: number; rule: string; blocked: boolean; daysLeft: number
} {
  const amt = b.seats.filter(s => seatIds.includes(s.seatId)).reduce((a, s) => a + s.price, 0)
  const daysLeft = round ? daysBetween(TODAY, round.date) : 99
  if (daysLeft <= 0) return { fee: 0, rule: daysLeft === 0 ? '관람 당일 – 취소 불가' : '관람일 경과 – 취소 불가', blocked: true, daysLeft }
  if (b.createdAt.slice(0, 10) === TODAY) return { fee: 0, rule: '예매 당일 취소 – 수수료 없음', blocked: false, daysLeft }
  if (daysLeft >= 10) return { fee: 0, rule: `관람 ${daysLeft}일 전 – 수수료 없음`, blocked: false, daysLeft }
  if (daysLeft >= 7) return { fee: 1000 * seatIds.length, rule: `관람 ${daysLeft}일 전 – 매당 1,000원`, blocked: false, daysLeft }
  if (daysLeft >= 3) return { fee: Math.round(amt * 0.1 / 10) * 10, rule: `관람 ${daysLeft}일 전 – 티켓금액의 10%`, blocked: false, daysLeft }
  return { fee: Math.round(amt * 0.3 / 10) * 10, rule: `관람 ${daysLeft}일 전 – 티켓금액의 30%`, blocked: false, daysLeft }
}

/** 공연별 좌석 등급 함수 (등급 재배정 반영) */
export function useGradeFn(perf: Performance | undefined) {
  const overrides = useStore(s => s.gradeOverrides)
  return useCallback((seatId: string): Grade => {
    if (!perf) return 'S'
    return overrides[perf.id]?.[seatId] ?? M.defaultGrade(venueOf(perf), seatId)
  }, [perf, overrides])
}

export const ttPrice = (base: number, rate: number) => Math.round(base * (1 - rate) / 100) * 100

export const phoneOk = (p: string) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(p.trim())
export const fmtPhone = (p: string) => {
  const d = p.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p.trim()
}

/** 관리자용 SMS 티켓 안내 문구 */
export function ticketSmsText(b: Booking, perf?: Performance, round?: Round) {
  const live = b.seats.filter(s => !s.cancelled).map(s => s.seatId)
  return `[국립어린이청소년극단] <${perf?.title ?? ''}> 예매 안내\n예매번호 ${b.id}\n${round ? `${round.date} ${round.time}` : ''} / ${live.join(', ')} (${live.length}매)\n모바일 티켓: 마이페이지 > 예매내역`
}

/**
 * 회차 일괄 취소 – 다수 예매를 한 번의 store.set 으로 반영 (persist 부하 최소화).
 * cancelSeats 와 동일한 결과(좌석 취소·상태 '취소완료'·처리 로그·안내 문자)를 생성합니다.
 */
export function bulkCancelBookings(targets: Booking[], reason: string, perfTitle: string) {
  const st = useStore.getState()
  const at = nowStr()
  const extraIds = new Set(st.extraBookings.map(b => b.id))
  const patches = { ...st.patches }
  const updated = new Map<string, Booking>()
  let seats = 0
  for (const b of targets) {
    const live = b.seats.filter(s => !s.cancelled).map(s => s.seatId)
    if (!live.length) continue
    seats += live.length
    const next: Partial<Booking> = {
      seats: b.seats.map(s => ({ ...s, cancelled: true })),
      status: '취소완료',
      logs: [...b.logs, { at, msg: `회차 일괄 취소 (${live.join(', ')}) / 사유: ${reason}` }],
    }
    if (extraIds.has(b.id)) updated.set(b.id, { ...b, ...next })
    else patches[b.id] = { ...(patches[b.id] ?? {}), ...next }
  }
  const sms = targets.slice(0, 50).map((b, i) => ({
    id: `sbulk${Date.now().toString(36)}${i}`, at, to: b.bookerPhone, kind: '알림톡' as const,
    text: `[국립어린이청소년극단] <${perfTitle}> 공연 회차 취소 안내\n예매번호 ${b.id} 전액 환불 처리되었습니다. (사유: ${reason}) 환불은 결제수단에 따라 3~5영업일 소요됩니다.`,
  }))
  st.set({
    patches,
    extraBookings: st.extraBookings.map(b => updated.get(b.id) ?? b),
    sms: [...sms, ...st.sms].slice(0, 50),
  })
  return { bookings: targets.length, seats }
}

export function parseCsv(text: string): string[][] {
  return text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim()).map(line => {
    const out: string[] = []
    let cur = '', q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ } else if (c === '"') q = false
        else cur += c
      } else if (c === '"') q = true
      else if (c === ',') { out.push(cur.trim()); cur = '' } else cur += c
    }
    out.push(cur.trim())
    return out
  })
}
