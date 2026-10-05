import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as M from '../data/mock'
import { nowStr } from '../store'
import type { Booking, Grade, PayMethod, Performance, Round, SeatPick } from '../data/types'

// ── 창구 세션 (POS 전용 로컬 상태, 공용 store와 분리) ──
export type PosWindow = '매표소 1' | '매표소 2'
export type PosTab = 'sell' | 'issue' | 'check' | 'sales' | 'close'

export interface PosSession {
  window: PosWindow
  staffId: string
  staffName: string
  float: number // 시작 시재금
  openedAt: string // YYYY-MM-DD HH:mm
}

/** 창구 수납 장부: 판매 / 현장수납(가상계좌 미입금분) / 환불 */
export interface LedgerEntry {
  id: string
  at: string
  kind: 'sale' | 'collect' | 'refund'
  bookingId: string
  method: PayMethod
  amount: number
  seats: { ticketTypeId: string; price: number }[]
  approval?: string
}

interface PosState {
  session: PosSession | null
  ledger: LedgerEntry[]
  tab: PosTab
  openSession: (s: PosSession) => void
  closeSession: () => void
  addLedger: (e: Omit<LedgerEntry, 'id' | 'at'>) => void
  setTab: (t: PosTab) => void
}

export const usePos = create<PosState>()(
  persist(
    set => ({
      session: null,
      ledger: [],
      tab: 'sell',
      openSession: s => set({ session: s, ledger: [], tab: 'sell' }),
      closeSession: () => set({ session: null, ledger: [], tab: 'sell' }),
      addLedger: e => set(st => ({ ledger: [...st.ledger, { ...e, id: Math.random().toString(36).slice(2, 9), at: nowStr() }] })),
      setTab: tab => set({ tab }),
    }),
    { name: 'ntcy-pos-v1' },
  ),
)

export const STAFF: Record<string, string> = { box01: '박매표', box02: '이현장', box03: '최하우스' }

/** 예매 로그에 남기는 창구 태그 (판매내역 필터용) */
export const posTag = (s: PosSession) => `[POS:${s.window}/${s.staffId}]`
export const isWindowBooking = (b: Booking, s: PosSession) => b.logs.some(l => l.msg.includes(`[POS:${s.window}/`))

// ── 공용 헬퍼 ──
export const perfById = (perfs: Performance[], id: string) => perfs.find(p => p.id === id)
export const venueById = (id: string) => M.venues.find(v => v.id === id)!
export const ttById = (id: string) => M.ticketTypes.find(t => t.id === id)
export const ttName = (id: string) => ttById(id)?.name ?? id

/** 권종 할인 적용 금액 (100원 단위 반올림, 시드 데이터와 동일 규칙) */
export function priceFor(base: number, ttId: string) {
  const rate = ttById(ttId)?.discountRate ?? 0
  return Math.round((base * (1 - rate)) / 100) * 100
}

export const PAY_METHODS: PayMethod[] = ['신용카드', '현금', '간편결제', '초대']

export const liveSeats = (b: Booking) => b.seats.filter(s => !s.cancelled)

export function roundLabel(r: Round) {
  return `${r.date.slice(5).replace('-', '.')} ${r.time} (${r.no}회)`
}

export function seatLabel(seatId: string) {
  const [row, col] = seatId.split('-')
  return `${row}열 ${col}번`
}

/** 집계 */
export function sumBy<T>(arr: T[], key: (t: T) => string, val: (t: T) => number) {
  const out = new Map<string, { count: number; amount: number }>()
  for (const x of arr) {
    const k = key(x)
    const cur = out.get(k) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += val(x)
    out.set(k, cur)
  }
  return out
}

/** 비지정(자동배정) 좌석 고르기: 같은 열 연속 좌석 우선, 앞쪽·중앙 우선 */
export function autoPick(opts: {
  rows: string[]; cols: number; count: number; isFree: (id: string) => boolean
  grade?: Grade | 'any'; gradeOf: (id: string) => Grade
}): string[] {
  const { rows, cols, count, isFree, grade = 'any', gradeOf } = opts
  const ok = (id: string) => isFree(id) && (grade === 'any' ? gradeOf(id) !== 'W' : gradeOf(id) === grade)
  const center = (cols + 1) / 2
  let best: { ids: string[]; score: number } | null = null
  rows.forEach((row, ri) => {
    for (let c = 1; c + count - 1 <= cols; c++) {
      const ids = Array.from({ length: count }, (_, i) => `${row}-${c + i}`)
      if (!ids.every(ok)) continue
      const mid = c + (count - 1) / 2
      const score = ri * 3 + Math.abs(mid - center) + (gradeOf(ids[0]) === 'R' ? 0 : 0.5)
      if (!best || score < best.score) best = { ids, score }
    }
  })
  if (best) return (best as { ids: string[] }).ids
  // 연속석이 없으면 개별 좌석 중 좋은 자리 순
  const all: { id: string; score: number }[] = []
  rows.forEach((row, ri) => {
    for (let c = 1; c <= cols; c++) {
      const id = `${row}-${c}`
      if (ok(id)) all.push({ id, score: ri * 3 + Math.abs(c - center) })
    }
  })
  return all.sort((a, b) => a.score - b.score).slice(0, count).map(x => x.id)
}

export type { SeatPick }
