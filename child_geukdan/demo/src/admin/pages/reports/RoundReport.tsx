import { useMemo, useState } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import * as M from '../../../data/mock'
import type { Booking, Grade } from '../../../data/types'
import { useStore } from '../../../store'
import { Bar, Card, DataTable, ExportButtons, type Col } from '../../ui'
import { num, pct, usePerfMap } from '../../lib'
import { won } from '../../../lib/format'
import { ChartBox, axisTick, gridProps, tipStyle, cntFmt, type RangeFilter } from './common'

interface Row { key: string; roundId: string; date: string; time: string; no: number; grade: Grade; cap: number; sold: number; amount: number }

/** 회차·등급별 판매 현황 (공연일 기준) */
export default function RoundReport({ all, f }: { all: Booking[]; f: RangeFilter }) {
  const perfMap = usePerfMap()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const overrides = useStore(s => s.gradeOverrides)
  const salesPerfs = useMemo(() => perfs.filter(p => all.some(b => b.perfId === p.id)), [perfs, all])
  const [perfId, setPerfId] = useState(f.perfId || salesPerfs[0]?.id || 'p1')
  const perf = perfMap.get(perfId)

  const cap = useMemo(() => {
    const out: Partial<Record<Grade, number>> = {}
    if (!perf) return out
    const v = M.venues.find(x => x.id === perf.venueId)!
    for (const sid of M.seatIds(v)) {
      const g = overrides[perf.id]?.[sid] ?? M.defaultGrade(v, sid)
      out[g] = (out[g] ?? 0) + 1
    }
    return out
  }, [perf, overrides])

  const data = useMemo(() => {
    const rs = rounds.filter(r => r.perfId === perfId && (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to))
    const ids = new Set(rs.map(r => r.id))
    const m = new Map<string, Row>()
    for (const r of rs) for (const g of Object.keys(cap) as Grade[]) {
      m.set(`${r.id}|${g}`, { key: `${r.id}|${g}`, roundId: r.id, date: r.date, time: r.time, no: r.no, grade: g, cap: cap[g] ?? 0, sold: 0, amount: 0 })
    }
    for (const b of all) {
      if (b.perfId !== perfId || !ids.has(b.roundId) || b.status === '취소완료') continue
      for (const s of b.seats) {
        if (s.cancelled) continue
        const row = m.get(`${b.roundId}|${s.grade}`)
        if (row) { row.sold++; row.amount += s.price }
      }
    }
    return [...m.values()].sort((a, b) => a.no - b.no || a.grade.localeCompare(b.grade))
  }, [rounds, perfId, f.from, f.to, cap, all])

  const chart = useMemo(() => {
    const m = new Map<string, Record<string, string | number>>()
    for (const r of data) {
      const k = r.roundId
      const o = m.get(k) ?? { label: `${r.date.slice(5).replace('-', '/')} ${r.time}` }
      o[r.grade] = r.sold
      m.set(k, o)
    }
    return [...m.values()].slice(0, 40)
  }, [data])

  const t = data.reduce((a, r) => ({ cap: a.cap + r.cap, sold: a.sold + r.sold, amount: a.amount + r.amount }), { cap: 0, sold: 0, amount: 0 })
  const cols: Col<Row>[] = [
    { key: 'no', header: '회차', sort: r => r.no, render: r => <span className="font-semibold">{r.no}회</span> },
    { key: 'date', header: '공연일시', sort: r => r.date + r.time, render: r => <span className="tabular-nums">{r.date} {r.time}</span> },
    { key: 'grade', header: '등급', sort: r => r.grade, render: r => <span className="chip text-white" style={{ background: M.gradeColor[r.grade] }}>{M.gradeLabel[r.grade]}</span> },
    { key: 'cap', header: '좌석수', align: 'right', sort: r => r.cap, render: r => num(r.cap) },
    { key: 'sold', header: '판매석', align: 'right', sort: r => r.sold, render: r => num(r.sold) },
    { key: 'occ', header: '점유율', sort: r => (r.cap ? r.sold / r.cap : 0), render: r => <div className="flex w-28 items-center gap-2"><Bar value={r.sold} max={r.cap} color={M.gradeColor[r.grade]} /><span className="w-10 text-right text-xs tabular-nums">{pct(r.sold, r.cap, 0)}</span></div> },
    { key: 'amount', header: '판매금액', align: 'right', sort: r => r.amount, render: r => <b>{won(r.amount)}</b> },
  ]
  const grades = Object.keys(cap) as Grade[]

  return (
    <Card title={`회차·등급별 판매 현황 — ${perf?.title ?? ''}`} sub={`공연일 기준 ${f.from || '전체'} ~ ${f.to || '전체'} · ${new Set(data.map(r => r.roundId)).size}회차`}
      actions={<>
        <select className="input w-auto py-1.5 text-sm" value={perfId} onChange={e => setPerfId(e.target.value)} aria-label="공연 선택">
          {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <ExportButtons filename={`판매보고서_회차등급별_${perf?.title ?? ''}`} count={data.length}
          getRows={() => [['회차', '공연일', '시간', '등급', '좌석수', '판매석', '점유율', '판매금액'], ...data.map(r => [r.no, r.date, r.time, M.gradeLabel[r.grade], r.cap, r.sold, pct(r.sold, r.cap), r.amount])]} />
      </>}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-paper px-3 py-2"><div className="text-[11px] font-semibold text-muted">총 좌석</div><div className="font-bold tabular-nums">{num(t.cap)}석</div></div>
        <div className="rounded-lg bg-paper px-3 py-2"><div className="text-[11px] font-semibold text-muted">판매석</div><div className="font-bold tabular-nums">{num(t.sold)}석</div></div>
        <div className="rounded-lg bg-paper px-3 py-2"><div className="text-[11px] font-semibold text-muted">평균 점유율</div><div className="font-bold tabular-nums">{pct(t.sold, t.cap)}</div></div>
        <div className="rounded-lg bg-paper px-3 py-2"><div className="text-[11px] font-semibold text-muted">판매금액</div><div className="font-bold tabular-nums">{won(t.amount)}</div></div>
      </div>
      <ChartBox height={260} title={`회차별 등급 판매석${chart.length >= 40 ? ' (앞 40회차)' : ''}`}>
        <BarChart data={chart}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" tick={axisTick} minTickGap={8} />
          <YAxis tick={axisTick} width={36} />
          <Tooltip formatter={v => cntFmt(v) + '석'} contentStyle={tipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {grades.map((g, i) => <RBar key={g} dataKey={g} name={M.gradeLabel[g]} stackId="a" fill={M.gradeColor[g]} radius={i === grades.length - 1 ? [3, 3, 0, 0] : undefined} />)}
        </BarChart>
      </ChartBox>
      <div className="mt-4"><DataTable columns={cols} rows={data} rowKey={r => r.key} dense pageSize={20} empty="선택한 기간에 회차가 없습니다." /></div>
    </Card>
  )
}
