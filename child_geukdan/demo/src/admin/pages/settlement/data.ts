import { useMemo } from 'react'
import * as M from '../../../data/mock'
import { useBookings, useStore } from '../../../store'
import type { Grade } from '../../../data/types'
import { isSale, ticketTypeName } from '../../lib'
import type { PayStatus, SettleStatus } from '../../adminStore'

export interface SettleLine { grade: Grade; ticketType: string; qty: number; unit: number; amount: number }
export interface SettleRow {
  id: string
  perfId?: string
  title: string
  producer: string
  venue: string
  perfFrom: string
  perfTo: string
  month: string
  feeRate: number
  lines: SettleLine[]
  qty: number
  sales: number
  fee: number
  payout: number
  rounds: number
  historical?: boolean
}

/** 시연용 과거 대관 정산 건 (결정적 금액) */
const HIST: { id: string; title: string; producer: string; venueId: string; from: string; to: string; feeRate: number; rounds: number; prices: Partial<Record<Grade, number>> }[] = [
  { id: 'ST-202607-01', title: '종이 배 항해', producer: '(사)인형극단 꿈틀', venueId: 'v2', from: '2026-07-02', to: '2026-07-19', feeRate: 12, rounds: 18, prices: { S: 25000, A: 20000 } },
  { id: 'ST-202608-01', title: '구름 위 산책', producer: '(주)극단 별무리', venueId: 'v1', from: '2026-08-06', to: '2026-08-30', feeRate: 10, rounds: 24, prices: { R: 35000, S: 30000, A: 25000 } },
  { id: 'ST-202609-01', title: '소리를 그리는 아이', producer: '(주)소리나무컴퍼니', venueId: 'v2', from: '2026-09-03', to: '2026-09-27', feeRate: 10, rounds: 22, prices: { S: 30000, A: 25000, W: 15000 } },
]
const HIST_TT = ['t-gen', 't-child', 't-youth', 't-dis', 't-m2']

/** 기본 상태 (사용자 조작 전) */
export const DEFAULT_STATE: Record<string, { status: SettleStatus; pay: PayStatus }> = {
  'ST-202607-01': { status: '정산완료', pay: '지급완료' },
  'ST-202608-01': { status: '업체승인대기', pay: '미지급' },
  'ST-202609-01': { status: '정산대기', pay: '미지급' },
}

function histRow(h: (typeof HIST)[number]): SettleRow {
  const rnd = M.seeded(M.hash(h.id))
  const lines: SettleLine[] = []
  for (const g of Object.keys(h.prices) as Grade[]) {
    for (const tt of HIST_TT) {
      if (g === 'W' && tt !== 't-dis') continue
      const rate = M.ticketTypes.find(t => t.id === tt)!.discountRate
      const base = tt === 't-gen' ? 160 : tt === 't-child' ? 90 : 35
      const qty = Math.round(base * (g === 'W' ? 0.15 : 0.5 + rnd() * 0.8) * (h.rounds / 20))
      const unit = Math.round((h.prices[g]! * (1 - rate)) / 100) * 100
      lines.push({ grade: g, ticketType: ticketTypeName(tt), qty, unit, amount: qty * unit })
    }
  }
  const venue = M.venues.find(v => v.id === h.venueId)!.name
  return finish({ id: h.id, title: h.title, producer: h.producer, venue, perfFrom: h.from, perfTo: h.to, month: h.from.slice(0, 7), feeRate: h.feeRate, lines, rounds: h.rounds, historical: true })
}

function finish(r: Omit<SettleRow, 'qty' | 'sales' | 'fee' | 'payout'>): SettleRow {
  const qty = r.lines.reduce((a, l) => a + l.qty, 0)
  const sales = r.lines.reduce((a, l) => a + l.amount, 0)
  const fee = Math.round((sales * r.feeRate) / 100)
  return { ...r, qty, sales, fee, payout: sales - fee }
}

/** 정산 대상 (대관 공연 + 과거 정산 이력) */
export function useSettleRows(): SettleRow[] {
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  return useMemo(() => {
    const out: SettleRow[] = []
    for (const p of perfs.filter(x => x.isRental)) {
      const m = new Map<string, SettleLine>()
      for (const b of bookings) {
        if (b.perfId !== p.id || !isSale(b)) continue
        for (const s of b.seats) {
          if (s.cancelled) continue
          const k = `${s.grade}|${s.ticketTypeId}|${s.price}`
          const l = m.get(k) ?? { grade: s.grade, ticketType: ticketTypeName(s.ticketTypeId), qty: 0, unit: s.price, amount: 0 }
          l.qty++
          l.amount += s.price
          m.set(k, l)
        }
      }
      const lines = [...m.values()].sort((a, b) => a.grade.localeCompare(b.grade) || b.amount - a.amount)
      out.push(finish({
        id: `ST-${p.end.slice(0, 7).replace('-', '')}-${p.id.toUpperCase()}`, perfId: p.id, title: p.title, producer: p.producer,
        venue: M.venues.find(v => v.id === p.venueId)?.name ?? '-', perfFrom: p.start, perfTo: p.end, month: p.end.slice(0, 7),
        feeRate: p.feeRate, lines, rounds: rounds.filter(r => r.perfId === p.id).length,
      }))
    }
    return [...out, ...HIST.map(histRow)].sort((a, b) => b.month.localeCompare(a.month))
  }, [bookings, perfs, rounds])
}
