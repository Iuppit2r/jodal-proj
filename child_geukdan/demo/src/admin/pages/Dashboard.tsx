import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowRight, Crown, MessageSquare, Radio, Ticket, TrendingUp, Undo2, Wallet } from 'lucide-react'
import { useStore, useBookings } from '../../store'
import * as M from '../../data/mock'
import { won } from '../../lib/format'
import { Bar as MiniBar, CHART_COLORS, Card, Kpi, PageHeader, Status, krw, usePII } from '../ui'
import { TODAY, addDays, dayOf, liveSeats, netAmount, num, pct, roundLabel, seatCount, usePerfMap, useRoundMap, useSoldByRound } from '../lib'
import type { Channel } from '../../data/types'

const CHANNELS: Channel[] = ['홈페이지', '모바일', '현장', '콜센터', '외부예매처']

/** 대시보드 – 진행상태를 한 페이지에서 확인 (UIR-007) */
export default function Dashboard() {
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const members = useStore(s => s.members)
  const inquiries = useStore(s => s.inquiries)
  const kopis = useStore(s => s.kopisLogs)
  const popups = useStore(s => s.popups)
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const soldByRound = useSoldByRound()
  const pii = usePII()
  const nav = useNavigate()

  const agg = useMemo(() => {
    const yday = addDays(TODAY, -1)
    const from14 = addDays(TODAY, -13)
    const from30 = addDays(TODAY, -29)
    const month = TODAY.slice(0, 7)
    const daily = new Map<string, { 매출: number; 건수: number }>()
    for (let i = 0; i < 14; i++) daily.set(addDays(from14, i), { 매출: 0, 건수: 0 })
    const ch = new Map<string, number>()
    let today = { n: 0, amt: 0 }, yd = { n: 0, amt: 0 }, monthAmt = 0, c30 = 0, n30 = 0, vwait = 0
    for (const b of bookings) {
      const d = dayOf(b.createdAt)
      const amt = netAmount(b)
      if (b.status === '입금대기') vwait++
      if (d === TODAY) { today.n++; today.amt += amt }
      if (d === yday) { yd.n++; yd.amt += amt }
      if (d.startsWith(month)) monthAmt += amt
      if (d >= from30) {
        n30++
        if (b.status === '취소완료' || b.status === '부분취소') c30++
        ch.set(b.channel, (ch.get(b.channel) ?? 0) + amt)
      }
      const dd = daily.get(d)
      if (dd) { dd.매출 += amt; dd.건수++ }
    }
    const recent = [...bookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8)
    return {
      today, yd, monthAmt, cancelRate: pct(c30, n30), vwait, recent,
      daily: [...daily].map(([d, v]) => ({ d: d.slice(5).replace('-', '.'), ...v })),
      channels: CHANNELS.map(c => ({ name: c, value: ch.get(c) ?? 0 })),
    }
  }, [bookings])

  const perfRate = useMemo(() => perfs
    .filter(p => p.status !== '임시저장')
    .map(p => {
      const rs = rounds.filter(r => r.perfId === p.id && r.active)
      const cap = rs.length * seatCount(p)
      const sold = rs.reduce((a, r) => a + (soldByRound.get(r.id) ?? 0), 0)
      return { name: p.title.length > 9 ? p.title.slice(0, 9) + '…' : p.title, 판매율: cap ? Math.round((sold / cap) * 1000) / 10 : 0, sold, cap }
    })
    .filter(x => x.cap > 0), [perfs, rounds, soldByRound])

  const upcoming = useMemo(() => {
    const todays = rounds.filter(r => r.date === TODAY && r.active)
    const list = todays.length ? todays : rounds.filter(r => r.date > TODAY && r.active).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).slice(0, 6)
    return { isToday: todays.length > 0, list }
  }, [rounds])

  const paidMembers = members.filter(m => m.membership && m.status !== '탈퇴').length
  const openInq = inquiries.filter(q => q.status !== '답변완료').length
  const kFail = kopis.filter(k => k.status === '실패').length
  const kWait = kopis.filter(k => k.status === '대기').length
  const dormantTarget = members.filter(m => m.status === '정상' && m.lastLoginAt < addDays(TODAY, -365)).length
  const drafts = perfs.filter(p => p.status === '임시저장').length
  const openSoon = perfs.filter(p => p.status === '오픈예정' && p.openAt.slice(0, 10) <= addDays(TODAY, 7))
  const popupEnding = popups.filter(p => p.active && p.end >= TODAY && p.end <= addDays(TODAY, 30)).length
  const rentals = perfs.filter(p => p.isRental).length

  const todos = [
    { n: openInq, label: '미답변 1:1 문의·VOC', to: '/admin/crm?tab=inquiry', tone: 'coral' },
    { n: agg.vwait, label: '가상계좌 입금대기 예매', to: '/admin/bookings', tone: 'sun' },
    { n: kFail + kWait, label: `KOPIS 전송 ${kFail ? `실패 ${kFail}건 · ` : ''}대기`, to: '/admin/kopis', tone: kFail ? 'coral' : 'sun' },
    { n: openSoon.length, label: `7일 내 티켓오픈 공연${openSoon.length ? ` (${openSoon.map(p => p.title).join(', ')})` : ''}`, to: '/admin/performances', tone: 'brand' },
    { n: drafts, label: '임시저장 공연 (등록 미완료)', to: '/admin/performances', tone: 'ink' },
    { n: rentals, label: '대관공연 정산 확인', to: '/admin/settlement', tone: 'brand' },
    { n: dormantTarget, label: '휴면 전환 대상 회원 (1년 미로그인)', to: '/admin/crm?tab=dormant', tone: 'ink' },
    { n: popupEnding, label: '30일 내 게시 종료 팝업', to: '/admin/cms', tone: 'ink' },
  ]
  const dotCls: Record<string, string> = { coral: 'bg-coral-500', sun: 'bg-amber-500', brand: 'bg-brand-600', ink: 'bg-gray-400' }
  const diff = agg.today.amt - agg.yd.amt

  return (
    <div className="space-y-4">
      <PageHeader title="대시보드" code="UIR-007" desc={`${TODAY.replace(/-/g, '.')}(월) 기준 · 예매·매출·회원·전송 현황을 한 화면에서 확인합니다.`}
        actions={<><Link to="/admin/bookings" className="btn-outline btn-sm">예매 조회</Link><Link to="/admin/performances/new" className="btn-primary btn-sm">+ 공연 등록</Link></>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="오늘 예매" icon={<Ticket size={18} />} value={`${num(agg.today.n)}건`} sub={`전일 ${num(agg.yd.n)}건`} onClick={() => nav('/admin/bookings')} />
        <Kpi label="오늘 매출" icon={<Wallet size={18} />} tone="mint" value={won(agg.today.amt)} sub={<span className={diff >= 0 ? 'text-emerald-700' : 'text-coral-500'}>전일 대비 {diff >= 0 ? '+' : ''}{krw(diff)}원</span>} />
        <Kpi label="이번달 매출 (10월)" icon={<TrendingUp size={18} />} tone="brand" value={`${krw(agg.monthAmt)}원`} sub="취소분 차감 순매출" onClick={() => nav('/admin/settlement')} />
        <Kpi label="취소율 (최근 30일)" icon={<Undo2 size={18} />} tone="coral" value={agg.cancelRate} sub="전체·부분 취소 포함" />
        <Kpi label="유료회원" icon={<Crown size={18} />} tone="sun" value={`${num(paidMembers)}명`} sub={`전체 회원 ${num(members.length)}명`} onClick={() => nav('/admin/membership')} />
        <Kpi label="미답변 문의" icon={<MessageSquare size={18} />} tone={openInq ? 'coral' : 'ink'} value={`${openInq}건`} sub="1:1 문의 · VOC" onClick={() => nav('/admin/crm?tab=inquiry')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="최근 14일 일별 매출" sub="예매일(결제일) 기준 · 취소 차감" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agg.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2647c4" stopOpacity={0.25} />
                    <stop offset="1" stopColor="#2647c4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: '#5b6270' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => krw(Number(v))} tick={{ fontSize: 11, fill: '#5b6270' }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={(v, n) => (n === '매출' ? won(Number(v)) : `${v}건`)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="매출" stroke="#2647c4" strokeWidth={2} fill="url(#dashArea)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="채널별 매출 비중" sub="최근 30일">
          <div className="flex items-center gap-2">
            <div className="h-52 w-1/2 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agg.channels} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="90%" paddingAngle={1} stroke="#fff" strokeWidth={2}>
                    {agg.channels.map((c, i) => <Cell key={c.name} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => won(Number(v))} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5 text-xs">
              {(() => {
                const tot = agg.channels.reduce((a, c) => a + c.value, 0)
                return agg.channels.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i] }} />
                    <span className="flex-1 text-muted">{c.name}</span>
                    <b className="tabular-nums">{pct(c.value, tot, 0)}</b>
                  </li>
                ))
              })()}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="공연별 판매율" sub="사용 회차 전체 좌석 대비 판매 좌석">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfRate} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#5b6270' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: '#16181d' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, _n, it) => [`${v}% (${num((it.payload as { sold: number }).sold)}/${num((it.payload as { cap: number }).cap)}석)`, '판매율']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="판매율" fill="#2647c4" radius={[0, 4, 4, 0]} barSize={14} label={{ position: 'right', fontSize: 11, fill: '#5b6270', formatter: (v: unknown) => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={upcoming.isToday ? '오늘 공연 회차' : '오늘 공연 회차 — 오늘(월) 정기 휴관'} sub={upcoming.isToday ? undefined : '다가오는 회차를 표시합니다'} className="xl:col-span-2" bodyClass="p-0"
          actions={<Link to="/admin/tickets" className="btn-ghost btn-sm">검표 현황 <ArrowRight size={13} /></Link>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>공연</th><th>회차</th><th>비고</th><th className="text-right">판매/총석</th><th className="w-40">점유율</th></tr></thead>
              <tbody>
                {upcoming.list.map(r => {
                  const p = perfMap.get(r.perfId)!
                  const cap = seatCount(p)
                  const sold = soldByRound.get(r.id) ?? 0
                  return (
                    <tr key={r.id} className="cursor-pointer" onClick={() => nav('/admin/seats')}>
                      <td className="font-semibold">{p.title}</td>
                      <td className="text-muted">{roundLabel(r)}</td>
                      <td>{r.note ? <span className="chip bg-brand-50 text-brand-700">{r.note}</span> : <span className="text-muted">-</span>}</td>
                      <td className="text-right tabular-nums">{num(sold)} / {num(cap)}</td>
                      <td><div className="flex items-center gap-2"><MiniBar value={sold} max={cap} color={sold / cap > 0.85 ? '#e0533a' : '#2647c4'} /><span className="w-10 text-right text-xs tabular-nums">{pct(sold, cap, 0)}</span></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="최근 예매" sub="실시간 – 홈페이지·POS 예매 즉시 반영" bodyClass="p-0"
          actions={<span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />LIVE</span>}>
          <ul className="divide-y divide-line">
            {agg.recent.map(b => (
              <li key={b.id}>
                <Link to={`/admin/bookings?q=${b.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50/50">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{perfMap.get(b.perfId)?.title}</div>
                    <div className="text-[11px] text-muted">{b.id} · {pii.name(b.bookerName)} · {b.channel} · {liveSeats(b)}매</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold tabular-nums">{won(netAmount(b))}</div>
                    <div className="text-[10px] text-muted">{b.createdAt.slice(5)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="통합전산망(KOPIS) 전송 상태" sub="매일 05:00 이전 전일 결제데이터 자동 전송" bodyClass="p-0"
          actions={<Link to="/admin/kopis" className="btn-ghost btn-sm"><Radio size={13} />모니터링</Link>}>
          <div className="grid grid-cols-3 gap-2 p-4 pb-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-center"><div className="text-[11px] text-emerald-700">성공</div><b className="text-lg">{kopis.filter(k => k.status === '성공' || k.status === '재전송성공').length}</b></div>
            <div className="rounded-lg bg-amber-50 p-2 text-center"><div className="text-[11px] text-amber-700">대기</div><b className="text-lg">{kWait}</b></div>
            <div className="rounded-lg bg-red-50 p-2 text-center"><div className="text-[11px] text-red-700">실패</div><b className="text-lg">{kFail}</b></div>
          </div>
          <ul className="divide-y divide-line">
            {kopis.slice(0, 5).map(k => (
              <li key={k.id} className="flex items-center gap-2 px-4 py-2 text-xs">
                <span className="w-20 text-muted">{k.date}</span>
                <span className="flex-1 font-semibold">{k.kind} <span className="font-normal text-muted">{k.count ? `${num(k.count)}건` : ''}</span></span>
                <Status s={k.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="처리 필요 업무" sub="담당 업무 진행상태 (UIR-007)" bodyClass="p-0">
          <ul className="divide-y divide-line">
            {todos.map(t => (
              <li key={t.label}>
                <Link to={t.to} className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-brand-50/50">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${t.n ? dotCls[t.tone] : 'bg-gray-200'}`} />
                  <span className={`min-w-0 flex-1 truncate ${t.n ? 'text-ink' : 'text-muted'}`}>{t.label}</span>
                  <b className={`tabular-nums ${t.n ? 'text-ink' : 'text-muted'}`}>{num(t.n)}</b>
                  <ArrowRight size={13} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="text-center text-[11px] text-muted">데이터 기준: 시연 시드 예매 {num(bookings.length)}건 · 회원 {num(members.length)}명 · 공연 {perfs.length}편 · 공연장 {M.venues.length}개</p>
    </div>
  )
}
