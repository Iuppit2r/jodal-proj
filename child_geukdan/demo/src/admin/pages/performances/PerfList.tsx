import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, Copy, Drama, Pencil, Plus, Ticket, Trash2, TrendingUp } from 'lucide-react'
import { useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Genre, PerfStatus, Performance } from '../../../data/types'
import { fmtRange } from '../../../lib/format'
import Poster from '../../../components/Poster'
import { Bar, Card, DataTable, DateRange, ExportButtons, FilterBar, Kpi, MultiCheck, PageHeader, Status, ask, type Col } from '../../ui'
import { TODAY, num, pct, seatCount, useSoldByRound } from '../../lib'
import { GENRES, STATUSES, newId, nextCode } from './shared'

interface Row {
  p: Performance
  venue: string
  rounds: number
  activeRounds: number
  sold: number
  capacity: number
  rate: number
}

export default function PerfList() {
  const nav = useNavigate()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const upsert = useStore(s => s.upsertPerformance)
  const setRounds = useStore(s => s.setRounds)
  const soldBy = useSoldByRound()

  const empty = { q: '', genres: [] as Genre[], statuses: [] as PerfStatus[], from: '', to: '', rental: 'all' as 'all' | 'Y' | 'N' }
  const [form, setForm] = useState(empty)
  const [cond, setCond] = useState(empty)

  const rows: Row[] = useMemo(() => perfs.map(p => {
    const rs = rounds.filter(r => r.perfId === p.id)
    const active = rs.filter(r => r.active)
    const sold = rs.reduce((a, r) => a + (soldBy.get(r.id) ?? 0), 0)
    const capacity = active.length * seatCount(p)
    return {
      p, venue: M.venues.find(v => v.id === p.venueId)?.name ?? '-', rounds: rs.length, activeRounds: active.length,
      sold, capacity, rate: capacity ? sold / capacity : 0,
    }
  }), [perfs, rounds, soldBy])

  const filtered = useMemo(() => rows.filter(({ p }) => {
    const q = cond.q.trim().toLowerCase()
    if (q && ![p.title, p.titleEn, p.code, p.producer].some(x => x.toLowerCase().includes(q))) return false
    if (cond.genres.length && !cond.genres.includes(p.genre)) return false
    if (cond.statuses.length && !cond.statuses.includes(p.status)) return false
    if (cond.from && p.end < cond.from) return false
    if (cond.to && p.start > cond.to) return false
    if (cond.rental !== 'all' && p.isRental !== (cond.rental === 'Y')) return false
    return true
  }), [rows, cond])

  const changeStatus = (p: Performance, s: PerfStatus) => {
    if (s === p.status) return
    upsert({ ...p, status: s })
    log('판매상태 변경', `${p.title}: ${p.status} → ${s}`)
    toast(`<${p.title}> 판매상태가 '${s}'(으)로 변경되었습니다${s === '판매중' ? ' · 홈페이지 즉시 반영' : ''}`)
  }

  const duplicate = async (p: Performance) => {
    const r = await ask({ title: '공연 복사', message: <>&lt;{p.title}&gt; 공연 정보와 회차를 복사하여 <b>임시저장</b> 상태의 새 공연을 만듭니다.</>, confirmText: '복사' })
    if (r === null) return
    const id = newId('p')
    const copy: Performance = { ...p, id, code: nextCode(perfs, p.start.slice(0, 4)), title: `${p.title} (복사)`, status: '임시저장',
      credits: p.credits.map(c => ({ ...c })), cast: [...p.cast], tags: [...p.tags], accessibility: [...p.accessibility], prices: { ...p.prices } }
    upsert(copy)
    setRounds(id, rounds.filter(x => x.perfId === p.id).map((x, i) => ({ ...x, id: `${id}-r${i + 1}`, perfId: id })))
    log('공연 복사', `${p.title} → ${copy.code}`)
    toast(`복사본이 생성되었습니다 (${copy.code})`)
  }

  const remove = async (p: Performance) => {
    if (p.status !== '임시저장') {
      toast(`[E-TC-205] 임시저장 상태의 공연만 삭제할 수 있습니다. 판매 중인 공연은 '판매중지' 처리하세요`, 'err')
      return
    }
    const r = await ask({ title: '공연 삭제', tone: 'danger', confirmText: '삭제', reason: '삭제 사유',
      message: <>&lt;{p.title || p.code}&gt; 공연과 등록된 회차가 모두 삭제됩니다. 삭제 후 복구할 수 없습니다.</> })
    if (r === null) return
    const s = useStore.getState()
    s.set({ performances: s.performances.filter(x => x.id !== p.id), rounds: s.rounds.filter(x => x.perfId !== p.id) })
    log(`공연 삭제(사유: ${r})`, `${p.title} (${p.code})`)
    toast('공연이 삭제되었습니다')
  }

  const kpi = useMemo(() => {
    const onSale = perfs.filter(p => p.status === '판매중' || p.status === '선예매중').length
    const upcoming = perfs.filter(p => p.status === '오픈예정').length
    const live = rows.filter(r => r.p.end >= TODAY && r.capacity)
    const sold = live.reduce((a, r) => a + r.sold, 0)
    const cap = live.reduce((a, r) => a + r.capacity, 0)
    return { onSale, upcoming, rate: pct(sold, cap), rounds: live.reduce((a, r) => a + r.activeRounds, 0) }
  }, [perfs, rows])

  const cols: Col<Row>[] = [
    { key: 'poster', header: '포스터', render: r => <Poster title={r.p.title || '제목 미정'} palette={r.p.palette} motif={r.p.motif} showText={false} className="h-12 w-9 rounded shadow-sm" /> },
    { key: 'code', header: '코드', sort: r => r.p.code, render: r => <span className="font-mono text-xs text-muted">{r.p.code}</span> },
    {
      key: 'title', header: '공연명', sort: r => r.p.title, render: r => (
        <div className="max-w-[260px]">
          <div className="truncate font-semibold text-ink">{r.p.title || <span className="text-muted">(제목 미입력)</span>}</div>
          <div className="truncate text-[11px] text-muted">{r.p.producer} · {r.p.target} · {r.p.ageLimit}</div>
        </div>
      ),
    },
    { key: 'genre', header: '장르', sort: r => r.p.genre, render: r => r.p.genre },
    { key: 'venue', header: '공연장', sort: r => r.venue, render: r => r.venue },
    { key: 'period', header: '기간', sort: r => r.p.start, render: r => <span className="tabular-nums">{fmtRange(r.p.start, r.p.end)}</span> },
    { key: 'rounds', header: '회차', align: 'right', sort: r => r.activeRounds, render: r => <>{r.activeRounds}{r.rounds !== r.activeRounds && <span className="text-[11px] text-muted">/{r.rounds}</span>}</> },
    {
      key: 'rate', header: '판매율', sort: r => r.rate, render: r => (
        <div className="w-28">
          <div className="flex justify-between text-[11px] tabular-nums"><b>{(r.rate * 100).toFixed(1)}%</b><span className="text-muted">{num(r.sold)}석</span></div>
          <Bar value={r.rate * 100} color={r.rate > 0.8 ? '#f2664b' : r.rate > 0.5 ? '#1fb592' : '#2647c4'} className="mt-1" />
        </div>
      ),
    },
    { key: 'status', header: '판매상태', sort: r => STATUSES.indexOf(r.p.status), render: r => <Status s={r.p.status} /> },
    { key: 'rental', header: '대관', align: 'center', sort: r => (r.p.isRental ? 1 : 0), render: r => r.p.isRental ? <span className="chip bg-violet-50 text-violet-700">대관 {r.p.feeRate}%</span> : <span className="text-muted">-</span> },
    { key: 'manager', header: '담당자', sort: r => r.p.manager, render: r => r.p.manager },
    {
      key: 'act', header: '관리', render: r => (
        <div className="no-print flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <select aria-label="판매상태 빠른 변경" className="rounded-md border border-line bg-white px-1.5 py-1 text-xs" value={r.p.status}
            onChange={e => changeStatus(r.p, e.target.value as PerfStatus)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-ghost btn-sm px-1.5" title="수정" aria-label="수정" onClick={() => nav(`/admin/performances/${r.p.id}`)}><Pencil size={14} /></button>
          <button className="btn-ghost btn-sm px-1.5" title="복사" aria-label="복사" onClick={() => duplicate(r.p)}><Copy size={14} /></button>
          <button className="btn-ghost btn-sm px-1.5 hover:text-coral-500" title="삭제 (임시저장만)" aria-label="삭제" onClick={() => remove(r.p)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="공연관리" code="SFR-TC-001~003"
        desc="공연 기본정보·가격·회차·선예매·티켓 레이아웃을 등록하고 판매상태를 관리합니다. 저장 즉시 홈페이지·현장판매(POS)에 반영됩니다."
        actions={<button className="btn-primary btn-sm" onClick={() => nav('/admin/performances/new')}><Plus size={15} />공연 등록</button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="판매중·선예매" value={`${kpi.onSale}건`} icon={<Ticket size={18} />} onClick={() => { const c = { ...empty, statuses: ['판매중', '선예매중'] as PerfStatus[] }; setForm(c); setCond(c) }} />
        <Kpi label="오픈예정" value={`${kpi.upcoming}건`} tone="sun" icon={<CalendarRange size={18} />} onClick={() => { const c = { ...empty, statuses: ['오픈예정'] as PerfStatus[] }; setForm(c); setCond(c) }} />
        <Kpi label="진행·예정 공연 판매율" value={kpi.rate} tone="mint" icon={<TrendingUp size={18} />} sub="판매좌석 ÷ (사용회차 × 객석수)" />
        <Kpi label="운영 회차" value={`${num(kpi.rounds)}회`} tone="ink" icon={<Drama size={18} />} sub="종료 공연 제외" />
      </div>

      <FilterBar onSearch={() => setCond(form)} onReset={() => { setForm(empty); setCond(empty) }}>
        <div>
          <label className="label text-[13px]">검색어</label>
          <input className="input py-2" placeholder="공연명 / 공연코드 / 기획사" value={form.q} onChange={e => setForm({ ...form, q: e.target.value })} />
        </div>
        <div>
          <label className="label text-[13px]">장르</label>
          <MultiCheck options={GENRES} value={form.genres} onChange={v => setForm({ ...form, genres: v })} />
        </div>
        <div>
          <label className="label text-[13px]">공연기간</label>
          <DateRange from={form.from} to={form.to} onChange={(from, to) => setForm({ ...form, from, to })} />
        </div>
        <div>
          <label className="label text-[13px]">대관 여부</label>
          <select className="input py-2" value={form.rental} onChange={e => setForm({ ...form, rental: e.target.value as 'all' | 'Y' | 'N' })}>
            <option value="all">전체</option><option value="N">자체 기획</option><option value="Y">대관 공연</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label text-[13px]">판매상태</label>
          <MultiCheck options={STATUSES} value={form.statuses} onChange={v => setForm({ ...form, statuses: v })} />
        </div>
      </FilterBar>

      <Card title={`공연 목록 (${filtered.length}건)`} bodyClass="p-3"
        actions={<ExportButtons filename="공연목록" count={filtered.length} getRows={() => [
          ['공연코드', '공연명', '장르', '공연장', '시작일', '종료일', '사용회차', '판매좌석', '판매율', '판매상태', '대관여부', '수수료(%)', '기획사', '담당자'],
          ...filtered.map(r => [r.p.code, r.p.title, r.p.genre, r.venue, r.p.start, r.p.end, r.activeRounds, r.sold, (r.rate * 100).toFixed(1) + '%', r.p.status, r.p.isRental ? 'Y' : 'N', r.p.feeRate, r.p.producer, r.p.manager]),
        ]} />}>
        <DataTable columns={cols} rows={filtered} rowKey={r => r.p.id} onRowClick={r => nav(`/admin/performances/${r.p.id}`)}
          initialSort={{ key: 'period', dir: 'desc' }} empty="조건에 맞는 공연이 없습니다." />
      </Card>
    </div>
  )
}
