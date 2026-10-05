import { useMemo } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts'
import type { Booking } from '../../../data/types'
import { useStore } from '../../../store'
import { Card, DataTable, ExportButtons, CHART_COLORS, type Col } from '../../ui'
import { cancelledAmount, dayOf, netAmount, num, pct, seatCount, ticketTypeName, usePerfMap } from '../../lib'
import { won } from '../../../lib/format'
import { ChartBox, axisTick, gridProps, short, tipStyle, wonFmt, cntFmt, TotalRow } from './common'

type P = { rows: Booking[]; period: string }

/* ───────── 상품(공연)별 ───────── */
interface ProdRow { id: string; title: string; genre: string; cnt: number; seats: number; cSeats: number; gross: number; cancel: number; net: number; cap: number }
export function ProductReport({ rows, period }: P) {
  const perfMap = usePerfMap()
  const rounds = useStore(s => s.rounds)
  const data = useMemo(() => {
    const m = new Map<string, ProdRow>()
    for (const b of rows) {
      const p = perfMap.get(b.perfId)
      if (!m.has(b.perfId)) {
        const cap = p ? rounds.filter(r => r.perfId === p.id && r.active).length * seatCount(p) : 0
        m.set(b.perfId, { id: b.perfId, title: p?.title ?? b.perfId, genre: p?.genre ?? '-', cnt: 0, seats: 0, cSeats: 0, gross: 0, cancel: 0, net: 0, cap })
      }
      const r = m.get(b.perfId)!
      const c = cancelledAmount(b), n = netAmount(b)
      r.cnt++
      r.seats += b.seats.filter(s => !s.cancelled).length
      r.cSeats += b.seats.filter(s => s.cancelled).length
      r.gross += n + c; r.cancel += c; r.net += n
    }
    return [...m.values()].sort((a, b) => b.net - a.net)
  }, [rows, perfMap, rounds])
  const t = data.reduce((a, r) => ({ seats: a.seats + r.seats, net: a.net + r.net, cancel: a.cancel + r.cancel }), { seats: 0, net: 0, cancel: 0 })
  const cols: Col<ProdRow>[] = [
    { key: 'title', header: '공연(상품)', sort: r => r.title, render: r => <span className="font-semibold">{r.title}</span> },
    { key: 'genre', header: '장르', sort: r => r.genre },
    { key: 'cnt', header: '예매건수', align: 'right', sort: r => r.cnt, render: r => num(r.cnt) },
    { key: 'seats', header: '판매매수', align: 'right', sort: r => r.seats, render: r => num(r.seats) },
    { key: 'cSeats', header: '취소매수', align: 'right', sort: r => r.cSeats, render: r => num(r.cSeats) },
    { key: 'gross', header: '총매출', align: 'right', sort: r => r.gross, render: r => won(r.gross) },
    { key: 'cancel', header: '취소금액', align: 'right', sort: r => r.cancel, render: r => won(r.cancel) },
    { key: 'net', header: '순매출', align: 'right', sort: r => r.net, render: r => <b>{won(r.net)}</b> },
    { key: 'avg', header: '객단가', align: 'right', sort: r => (r.seats ? r.net / r.seats : 0), render: r => won(r.seats ? Math.round(r.net / r.seats) : 0) },
    { key: 'occ', header: '판매율', align: 'right', sort: r => (r.cap ? r.seats / r.cap : 0), render: r => pct(r.seats, r.cap) },
  ]
  return (
    <Card title="상품(공연)별 판매 현황" sub={period}
      actions={<ExportButtons filename="판매보고서_상품별" count={data.length}
        getRows={() => [['공연', '장르', '예매건수', '판매매수', '취소매수', '총매출', '취소금액', '순매출', '판매율'], ...data.map(r => [r.title, r.genre, r.cnt, r.seats, r.cSeats, r.gross, r.cancel, r.net, pct(r.seats, r.cap)])]} />}>
      <ChartBox height={240}>
        <ComposedChart data={data}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="title" tick={axisTick} interval={0} />
          <YAxis yAxisId="l" tick={axisTick} tickFormatter={short} width={48} />
          <YAxis yAxisId="r" orientation="right" tick={axisTick} width={40} />
          <Tooltip contentStyle={tipStyle} formatter={(v, n) => (n === '판매매수' ? cntFmt(v) + '매' : wonFmt(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <RBar yAxisId="l" dataKey="net" name="순매출" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={56} />
          <Line yAxisId="r" dataKey="seats" name="판매매수" stroke={CHART_COLORS[1]} strokeWidth={2} />
        </ComposedChart>
      </ChartBox>
      <div className="mt-4"><DataTable columns={cols} rows={data} rowKey={r => r.id} dense initialSort={{ key: 'net', dir: 'desc' }} /></div>
      <TotalRow cells={[<>판매 <b>{num(t.seats)}</b>매</>, <>취소 <b className="text-coral-500">{won(t.cancel)}</b></>, <>순매출 <b className="text-brand-600">{won(t.net)}</b></>]} />
    </Card>
  )
}

/* ───────── 채널별 ───────── */
interface ChRow { ch: string; cnt: number; seats: number; net: number; fee: number }
export function ChannelReport({ rows, period }: P) {
  const data = useMemo(() => {
    const m = new Map<string, ChRow>()
    for (const b of rows) {
      const r = m.get(b.channel) ?? { ch: b.channel, cnt: 0, seats: 0, net: 0, fee: 0 }
      r.cnt++; r.seats += b.seats.filter(s => !s.cancelled).length; r.net += netAmount(b); r.fee += b.status === '취소완료' ? 0 : b.fee
      m.set(b.channel, r)
    }
    return [...m.values()].sort((a, b) => b.net - a.net)
  }, [rows])
  const total = data.reduce((a, r) => a + r.net, 0)
  const cols: Col<ChRow>[] = [
    { key: 'ch', header: '판매채널', sort: r => r.ch, render: (r, i) => <span className="flex items-center gap-2 font-semibold"><i className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{r.ch}</span> },
    { key: 'cnt', header: '예매건수', align: 'right', sort: r => r.cnt, render: r => num(r.cnt) },
    { key: 'seats', header: '매수', align: 'right', sort: r => r.seats, render: r => num(r.seats) },
    { key: 'net', header: '순매출', align: 'right', sort: r => r.net, render: r => <b>{won(r.net)}</b> },
    { key: 'share', header: '비중', align: 'right', render: r => pct(r.net, total) },
    { key: 'avg', header: '건당 매출', align: 'right', render: r => won(r.cnt ? Math.round(r.net / r.cnt) : 0) },
    { key: 'fee', header: '예매수수료', align: 'right', sort: r => r.fee, render: r => won(r.fee) },
  ]
  return (
    <Card title="판매채널별 현황" sub={period}
      actions={<ExportButtons filename="판매보고서_채널별" count={data.length}
        getRows={() => [['채널', '예매건수', '매수', '순매출', '비중', '예매수수료'], ...data.map(r => [r.ch, r.cnt, r.seats, r.net, pct(r.net, total), r.fee])]} />}>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartBox height={280}>
            <PieChart>
              <Pie data={data} dataKey="net" nameKey="ch" innerRadius={62} outerRadius={105} paddingAngle={2}
                label={(e: { percent?: number }) => `${Math.round((e.percent ?? 0) * 100)}%`} labelLine={false}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartBox>
        </div>
        <div className="min-w-0 lg:col-span-3">
          <DataTable columns={cols} rows={data} rowKey={r => r.ch} dense />
          <TotalRow cells={[<>합계 <b>{num(data.reduce((a, r) => a + r.cnt, 0))}</b>건</>, <>순매출 <b className="text-brand-600">{won(total)}</b></>]} />
        </div>
      </div>
    </Card>
  )
}

/* ───────── 권종별 ───────── */
interface TtRow { id: string; name: string; seats: number; amount: number; list: number }
export function TicketTypeReport({ rows, period }: P) {
  const perfMap = usePerfMap()
  const data = useMemo(() => {
    const m = new Map<string, TtRow>()
    for (const b of rows) {
      const p = perfMap.get(b.perfId)
      for (const s of b.seats) {
        if (s.cancelled) continue
        const r = m.get(s.ticketTypeId) ?? { id: s.ticketTypeId, name: ticketTypeName(s.ticketTypeId), seats: 0, amount: 0, list: 0 }
        r.seats++; r.amount += s.price; r.list += p?.prices[s.grade] ?? s.price
        m.set(s.ticketTypeId, r)
      }
    }
    return [...m.values()].sort((a, b) => b.seats - a.seats)
  }, [rows, perfMap])
  const tSeats = data.reduce((a, r) => a + r.seats, 0)
  const cols: Col<TtRow>[] = [
    { key: 'name', header: '권종', sort: r => r.name, render: r => <span className="font-semibold">{r.name}</span> },
    { key: 'seats', header: '매수', align: 'right', sort: r => r.seats, render: r => num(r.seats) },
    { key: 'share', header: '매수 비중', align: 'right', sort: r => r.seats, render: r => pct(r.seats, tSeats) },
    { key: 'amount', header: '판매금액', align: 'right', sort: r => r.amount, render: r => <b>{won(r.amount)}</b> },
    { key: 'unit', header: '평균단가', align: 'right', sort: r => (r.seats ? r.amount / r.seats : 0), render: r => won(r.seats ? Math.round(r.amount / r.seats) : 0) },
    { key: 'disc', header: '할인액', align: 'right', sort: r => r.list - r.amount, render: r => <span className="text-coral-500">{won(r.list - r.amount)}</span> },
  ]
  return (
    <Card title="권종별 판매 현황" sub={period}
      actions={<ExportButtons filename="판매보고서_권종별" count={data.length}
        getRows={() => [['권종', '매수', '판매금액', '평균단가', '할인액'], ...data.map(r => [r.name, r.seats, r.amount, r.seats ? Math.round(r.amount / r.seats) : 0, r.list - r.amount])]} />}>
      <ChartBox height={260}>
        <BarChart data={data}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" tick={axisTick} interval={0} />
          <YAxis yAxisId="l" tick={axisTick} width={44} />
          <YAxis yAxisId="r" orientation="right" tick={axisTick} tickFormatter={short} width={48} />
          <Tooltip contentStyle={tipStyle} formatter={(v, n) => (n === '매수' ? cntFmt(v) + '매' : wonFmt(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <RBar yAxisId="l" dataKey="seats" name="매수" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={40} />
          <RBar yAxisId="r" dataKey="amount" name="판매금액" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ChartBox>
      <div className="mt-4"><DataTable columns={cols} rows={data} rowKey={r => r.id} dense /></div>
    </Card>
  )
}

/* ───────── 일별 창구(현장) 판매 ───────── */
interface CtRow { day: string; cnt: number; seats: number; card: number; cash: number; inv: number; total: number }
export function CounterReport({ rows, period }: P) {
  const data = useMemo(() => {
    const m = new Map<string, CtRow>()
    for (const b of rows) {
      if (b.channel !== '현장') continue
      const d = dayOf(b.createdAt)
      const r = m.get(d) ?? { day: d, cnt: 0, seats: 0, card: 0, cash: 0, inv: 0, total: 0 }
      const n = netAmount(b)
      r.cnt++; r.seats += b.seats.filter(s => !s.cancelled).length
      if (b.payMethod === '현금') r.cash += n
      else if (b.payMethod === '초대') r.inv += b.seats.filter(s => !s.cancelled).length
      else r.card += n
      r.total += n
      m.set(d, r)
    }
    return [...m.values()].sort((a, b) => a.day.localeCompare(b.day))
  }, [rows])
  const t = data.reduce((a, r) => ({ card: a.card + r.card, cash: a.cash + r.cash, total: a.total + r.total, seats: a.seats + r.seats }), { card: 0, cash: 0, total: 0, seats: 0 })
  const cols: Col<CtRow>[] = [
    { key: 'day', header: '일자', sort: r => r.day, render: r => <span className="tabular-nums">{r.day}</span> },
    { key: 'cnt', header: '거래건수', align: 'right', sort: r => r.cnt, render: r => num(r.cnt) },
    { key: 'seats', header: '발권매수', align: 'right', sort: r => r.seats, render: r => num(r.seats) },
    { key: 'card', header: '카드', align: 'right', sort: r => r.card, render: r => won(r.card) },
    { key: 'cash', header: '현금', align: 'right', sort: r => r.cash, render: r => won(r.cash) },
    { key: 'inv', header: '초대(매)', align: 'right', sort: r => r.inv, render: r => num(r.inv) },
    { key: 'total', header: '합계', align: 'right', sort: r => r.total, render: r => <b>{won(r.total)}</b> },
  ]
  return (
    <Card title="일별 창구(현장) 판매 현황" sub={`${period} · 매표소 POS 판매분`}
      actions={<ExportButtons filename="판매보고서_일별창구" count={data.length}
        getRows={() => [['일자', '거래건수', '발권매수', '카드', '현금', '초대(매)', '합계'], ...data.map(r => [r.day, r.cnt, r.seats, r.card, r.cash, r.inv, r.total]), ['합계', '', t.seats, t.card, t.cash, '', t.total]]} />}>
      <ChartBox height={240}>
        <BarChart data={data}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="day" tick={axisTick} tickFormatter={v => String(v).slice(5)} minTickGap={10} />
          <YAxis tick={axisTick} tickFormatter={short} width={48} />
          <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <RBar dataKey="card" name="카드" stackId="a" fill={CHART_COLORS[0]} />
          <RBar dataKey="cash" name="현금" stackId="a" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartBox>
      <div className="mt-4"><DataTable columns={cols} rows={data} rowKey={r => r.day} dense initialSort={{ key: 'day', dir: 'desc' }} /></div>
      <TotalRow cells={[<>발권 <b>{num(t.seats)}</b>매</>, <>카드 <b>{won(t.card)}</b></>, <>현금 <b>{won(t.cash)}</b></>, <>합계 <b className="text-brand-600">{won(t.total)}</b></>]} />
    </Card>
  )
}
