import { useMemo, useState } from 'react'
import { Ticket } from 'lucide-react'
import { useStore, useBookings } from '../../../store'
import type { Booking } from '../../../data/types'
import { Card, DataTable, ExportButtons, Field, FilterBar, MultiCheck, Stat, Status, ask, errMsg, usePII, type Col } from '../../ui'
import { liveSeats, num, pct, roundLabel, usePerfMap, useRoundMap } from '../../lib'
import { ISSUE_KINDS, issueKind, issuedCount, usedCount, type IssueKind } from './util'

interface F { perfId: string; roundDate: string; kinds: IssueKind[]; issued: '' | '발권' | '미발권'; kw: string }
const empty: F = { perfId: '', roundDate: '', kinds: [], issued: '', kw: '' }

/** 발권 내역 */
export default function IssueList({ onOpen }: { onOpen: (id: string) => void }) {
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const [form, setForm] = useState<F>(empty)
  const [applied, setApplied] = useState<F>(empty)
  const [selected, setSelected] = useState<string[]>([])

  const base = useMemo(() => bookings.filter(b => b.status !== '취소완료' && liveSeats(b) > 0), [bookings])
  const rows = useMemo(() => {
    const f = applied
    const kinds = new Set(f.kinds)
    const kw = f.kw.trim().toUpperCase()
    return base.filter(b => {
      if (f.perfId && b.perfId !== f.perfId) return false
      if (f.roundDate && roundMap.get(b.roundId)?.date !== f.roundDate) return false
      if (kinds.size && !kinds.has(issueKind(b))) return false
      if (f.issued === '발권' && !issuedCount(b)) return false
      if (f.issued === '미발권' && issuedCount(b)) return false
      if (kw && !b.id.includes(kw)) return false
      return true
    })
  }, [base, applied, roundMap])

  const sum = useMemo(() => {
    let seats = 0, issued = 0, used = 0
    const byKind: Record<string, number> = {}
    for (const b of rows) {
      const n = liveSeats(b), i = issuedCount(b)
      seats += n; issued += i; used += usedCount(b)
      if (i) byKind[issueKind(b)] = (byKind[issueKind(b)] ?? 0) + i
    }
    return { seats, issued, used, byKind }
  }, [rows])

  const columns: Col<Booking>[] = useMemo(() => [
    { key: 'id', header: '예매번호', sort: b => b.id, render: b => <span className="font-mono text-xs font-semibold text-brand-600">{b.id}</span> },
    { key: 'perf', header: '공연', sort: b => perfMap.get(b.perfId)?.title ?? '', render: b => <span className="block max-w-[180px] truncate">{perfMap.get(b.perfId)?.title}</span> },
    { key: 'round', header: '관람일시', sort: b => { const r = roundMap.get(b.roundId); return r ? r.date + r.time : '' }, render: b => <span className="whitespace-nowrap text-xs">{roundLabel(roundMap.get(b.roundId))}</span> },
    { key: 'name', header: '예매자', sort: b => b.bookerName, render: b => pii.name(b.bookerName) },
    { key: 'ch', header: '채널', sort: b => b.channel, render: b => b.channel },
    { key: 'kind', header: '발권유형', sort: b => issueKind(b), render: b => issueKind(b) },
    { key: 'issued', header: '발권/매수', align: 'right', sort: b => issuedCount(b), render: b => <>{issuedCount(b)}<span className="text-muted">/{liveSeats(b)}</span></> },
    { key: 'used', header: '입장', align: 'right', sort: b => usedCount(b), render: b => usedCount(b) },
    { key: 'st', header: '발권상태', sort: b => (issuedCount(b) ? 1 : 0), render: b => <Status s={issuedCount(b) ? '발권' : '미발권'} /> },
    { key: 'status', header: '예매상태', sort: b => b.status, render: b => <Status s={b.status} /> },
  ], [perfMap, roundMap, pii])

  const bulkIssue = async () => {
    const st = useStore.getState()
    const targets = rows.filter(b => selected.includes(b.id) && (b.status === '예매완료' || b.status === '부분취소') && issuedCount(b) < liveSeats(b))
    if (!targets.length) { st.toast(errMsg('E-TC-301', '발권 가능한 예매가 없습니다 (미발권·결제완료 건만 가능)'), 'warn'); return }
    const seats = targets.reduce((a, b) => a + liveSeats(b), 0)
    const r = await ask({
      title: '일괄 발권', confirmText: '발권',
      message: <>선택한 {selected.length}건 중 발권 가능한 <b>{targets.length}건 / {seats}매</b>를 발권 처리합니다.<br /><span className="text-xs text-muted">발권 시 모바일 티켓 QR이 재생성되며 무인발권기 재출력이 제한됩니다.</span></>,
    })
    if (r === null) return
    targets.forEach(b => st.issueBooking(b.id))
    st.log('티켓 일괄 발권', `${targets.length}건 ${seats}매`)
    st.toast(`${targets.length}건 ${seats}매 발권 완료`)
    setSelected([])
  }

  const exportRows = () => [
    ['예매번호', '공연', '관람일시', '예매자', '채널', '발권유형', '매수', '발권매수', '입장매수', '발권상태', '예매상태'],
    ...rows.map(b => [b.id, perfMap.get(b.perfId)?.title ?? '', roundLabel(roundMap.get(b.roundId)), pii.name(b.bookerName), b.channel, issueKind(b), liveSeats(b), issuedCount(b), usedCount(b), issuedCount(b) ? '발권' : '미발권', b.status]),
  ]

  return (
    <>
      <FilterBar onSearch={() => { setApplied(form); setSelected([]) }} onReset={() => { setForm(empty); setApplied(empty) }}>
        <Field label="공연">
          <select className="input" value={form.perfId} onChange={e => setForm({ ...form, perfId: e.target.value })}>
            <option value="">전체 공연</option>
            {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="회차일(관람일)">
          <input type="date" className="input" value={form.roundDate} onChange={e => setForm({ ...form, roundDate: e.target.value })} />
        </Field>
        <Field label="발권상태">
          <select className="input" value={form.issued} onChange={e => setForm({ ...form, issued: e.target.value as F['issued'] })}>
            <option value="">전체</option><option>발권</option><option>미발권</option>
          </select>
        </Field>
        <Field label="예매번호">
          <input className="input" value={form.kw} onChange={e => setForm({ ...form, kw: e.target.value })} placeholder="T2610…" />
        </Field>
        <Field label="발권유형" className="sm:col-span-2">
          <MultiCheck options={ISSUE_KINDS} value={form.kinds} onChange={v => setForm({ ...form, kinds: v })} />
        </Field>
      </FilterBar>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Stat className="card bg-white" label="예매 매수" value={`${num(sum.seats)}매`} />
        <Stat className="card bg-white" label="발권 매수" value={`${num(sum.issued)}매 (${pct(sum.issued, sum.seats)})`} />
        <Stat className="card bg-white" label="입장 매수" value={`${num(sum.used)}매`} />
        {ISSUE_KINDS.map(k => <Stat key={k} className="card bg-white" label={k} value={`${num(sum.byKind[k] ?? 0)}매`} />)}
      </div>

      <Card title="발권 내역" bodyClass="p-3" sub="취소완료 예매는 제외됩니다. 행 클릭 시 예매 상세."
        actions={<>
          <button className="btn-primary btn-sm" disabled={!selected.length} onClick={bulkIssue}><Ticket size={14} />일괄 발권{selected.length ? ` (${selected.length})` : ''}</button>
          <ExportButtons filename="발권내역" count={rows.length} getRows={exportRows} heavyAt={3000} />
        </>}>
        <DataTable columns={columns} rows={rows} rowKey={b => b.id} onRowClick={b => onOpen(b.id)} selectable selected={selected}
          onSelectChange={setSelected} dense initialSort={{ key: 'round', dir: 'desc' }} />
      </Card>
    </>
  )
}
