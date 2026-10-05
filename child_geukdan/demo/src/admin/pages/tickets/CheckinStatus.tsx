import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DoorOpen, History, Percent, Ticket, UserX } from 'lucide-react'
import { useStore, useBookings } from '../../../store'
import { hash } from '../../../data/mock'
import type { Booking } from '../../../data/types'
import { CHART_COLORS, Card, DataTable, ExportButtons, Field, Kpi, Note, Status, errMsg, usePII, type Col } from '../../ui'
import { TODAY, liveSeats, num, pct, roundLabel } from '../../lib'
import { usedCount } from './util'

const SLOT_W = [0.03, 0.07, 0.14, 0.24, 0.3, 0.17, 0.05] // 공연 60분 전 ~ 시작 10분 후

function addMin(hhmm: string, m: number) {
  const [h, mm] = hhmm.split(':').map(Number)
  const t = h * 60 + mm + m
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** 검표 현황 – 회차별 입장 현황 */
export default function CheckinStatus({ onOpen }: { onOpen: (id: string) => void }) {
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const bookings = useBookings()
  const pii = usePII()

  const sorted = useMemo(() => [...rounds].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [rounds])
  const bookedRounds = useMemo(() => new Set(bookings.map(b => b.roundId)), [bookings])
  const defaultRound = useMemo(() => sorted.find(r => r.date >= TODAY && bookedRounds.has(r.id)) ?? sorted[sorted.length - 1], [sorted, bookedRounds])
  const lastPast = useMemo(() => [...sorted].reverse().find(r => r.date < TODAY && bookedRounds.has(r.id)), [sorted, bookedRounds])

  const [roundId, setRoundId] = useState(defaultRound?.id ?? '')
  const round = rounds.find(r => r.id === roundId)
  const [perfId, setPerfId] = useState(round?.perfId ?? 'p1')
  const perf = perfs.find(p => p.id === perfId)
  const perfRounds = sorted.filter(r => r.perfId === perfId)

  const list = useMemo(() => bookings.filter(b => b.roundId === roundId && b.status !== '취소완료' && b.status !== '입금대기' && liveSeats(b) > 0), [bookings, roundId])
  const kpi = useMemo(() => {
    const sold = list.reduce((a, b) => a + liveSeats(b), 0)
    const used = list.reduce((a, b) => a + usedCount(b), 0)
    return { sold, used, not: sold - used }
  }, [list])

  // 10분 단위 입장 추이 (입장 좌석을 결정적으로 분배)
  const chart = useMemo(() => {
    if (!round) return []
    const slots = SLOT_W.map((_, i) => ({ slot: `${addMin(round.time, -60 + i * 10)}`, 입장: 0 }))
    const cum = SLOT_W.map((_, i) => SLOT_W.slice(0, i + 1).reduce((a, b) => a + b, 0))
    for (const b of list) for (const s of b.seats) {
      if (s.cancelled || !s.used) continue
      const x = (hash(b.id + s.seatId) % 1000) / 1000
      const idx = cum.findIndex(c => x < c)
      slots[idx === -1 ? slots.length - 1 : idx].입장++
    }
    return slots
  }, [list, round])

  const status = (b: Booking) => { const u = usedCount(b), n = liveSeats(b); return u === 0 ? '미입장' : u === n ? '입장' : '부분입장' }

  const checkIn = (b: Booking) => {
    const st = useStore.getState()
    const r = st.checkInSeat(b.id)
    if (r === 'ok') { st.log('검표 입장 처리(관리자)', b.id); st.toast(`${b.id} 입장 처리 완료`) }
    else st.toast(errMsg('E-TC-409', r === 'used' ? '이미 입장 처리된 예매입니다' : '입장 처리할 수 없는 예매입니다'), 'warn')
  }

  const columns: Col<Booking>[] = [
    { key: 'id', header: '예매번호', sort: b => b.id, render: b => <span className="font-mono text-xs font-semibold text-brand-600">{b.id}</span> },
    { key: 'name', header: '예매자', sort: b => b.bookerName, render: b => pii.name(b.bookerName) },
    { key: 'phone', header: '휴대폰', render: b => pii.phone(b.bookerPhone) },
    { key: 'seats', header: '좌석', render: b => <span className="text-xs">{b.seats.filter(s => !s.cancelled).map(s => s.seatId).join(', ')}</span> },
    { key: 'cnt', header: '입장/매수', align: 'right', sort: b => usedCount(b), render: b => <>{usedCount(b)}<span className="text-muted">/{liveSeats(b)}</span></> },
    { key: 'ch', header: '채널', sort: b => b.channel, render: b => b.channel },
    { key: 'st', header: '입장상태', sort: b => status(b), render: b => <Status s={status(b)} /> },
    {
      key: 'act', header: '', align: 'center',
      render: b => status(b) !== '입장'
        ? <button className="btn-outline btn-sm no-print py-1" onClick={e => { e.stopPropagation(); checkIn(b) }}>입장 처리</button>
        : <span className="text-xs text-muted">완료</span>,
    },
  ]

  const exportRows = () => [
    ['예매번호', '예매자', '휴대폰', '좌석', '매수', '입장', '채널', '입장상태'],
    ...list.map(b => [b.id, pii.name(b.bookerName), pii.phone(b.bookerPhone), b.seats.filter(s => !s.cancelled).map(s => s.seatId).join(' '), liveSeats(b), usedCount(b), b.channel, status(b)]),
  ]

  return (
    <div className="space-y-4">
      <Card bodyClass="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="공연">
            <select className="input" value={perfId} onChange={e => { const p = e.target.value; setPerfId(p); const r = sorted.find(x => x.perfId === p && x.date >= TODAY) ?? sorted.filter(x => x.perfId === p).pop(); setRoundId(r?.id ?? '') }}>
              {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="회차" className="lg:col-span-2">
            <select className="input" value={roundId} onChange={e => setRoundId(e.target.value)}>
              {!perfRounds.length && <option value="">등록된 회차 없음</option>}
              {perfRounds.map(r => <option key={r.id} value={r.id}>{roundLabel(r)}{r.date === TODAY ? ' · 오늘' : r.date < TODAY ? ' · 종료' : ''}</option>)}
            </select>
          </Field>
          <Field label="빠른 선택">
            <div className="flex gap-1.5">
              {defaultRound && <button className="btn-outline btn-sm" onClick={() => { setPerfId(defaultRound.perfId); setRoundId(defaultRound.id) }}>다가오는 회차</button>}
              {lastPast && <button className="btn-outline btn-sm" onClick={() => { setPerfId(lastPast.perfId); setRoundId(lastPast.id) }}><History size={13} />최근 종료 회차</button>}
            </div>
          </Field>
        </div>
      </Card>

      {round && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="판매 좌석" value={`${num(kpi.sold)}매`} icon={<Ticket size={18} />} sub={`${perf?.title ?? ''}`} />
            <Kpi label="입장" value={`${num(kpi.used)}명`} icon={<DoorOpen size={18} />} tone="mint" />
            <Kpi label="미입장" value={`${num(kpi.not)}명`} icon={<UserX size={18} />} tone="coral" />
            <Kpi label="입장률" value={pct(kpi.used, kpi.sold)} icon={<Percent size={18} />} tone="sun" sub={roundLabel(round)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
            <Card title="시간대별 입장 (10분 단위)" sub={`공연 시작 ${round.time} 기준`}>
              {kpi.used === 0 ? (
                <div className="grid h-[260px] place-items-center text-center text-sm text-muted">
                  <div>
                    아직 입장 기록이 없습니다.<br />
                    <span className="text-xs">{round.date > TODAY ? '공연 당일 입장이 시작되면 실시간으로 집계됩니다. 수작업 검표 또는 ‘입장 처리’로 시연할 수 있습니다.' : ''}</span>
                  </div>
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                      <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={v => [`${v}명`, '입장']} labelFormatter={l => `${l} ~ ${addMin(String(l), 10)}`} />
                      <Bar dataKey="입장" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card title="예매별 입장 현황" bodyClass="p-3" actions={<ExportButtons filename="검표현황" count={list.length} getRows={exportRows} />}>
              <DataTable columns={columns} rows={list} rowKey={b => b.id} onRowClick={b => onOpen(b.id)} pageSize={10} dense maxHeight="48vh"
                initialSort={{ key: 'st', dir: 'desc' }} empty="이 회차의 유효 예매가 없습니다." />
            </Card>
          </div>
          {round.date < TODAY && <Note>종료된 회차입니다. 미입장(노쇼) 좌석은 통계 메뉴의 노쇼율 집계에 반영됩니다.</Note>}
        </>
      )}
    </div>
  )
}
