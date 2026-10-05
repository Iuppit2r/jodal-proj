import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageSquare, Ticket } from 'lucide-react'
import { useStore, useBookings } from '../../../store'
import Modal from '../../../components/Modal'
import type { Booking, BookingStatus, Channel, PayMethod } from '../../../data/types'
import { won } from '../../../lib/format'
import {
  Card, DataTable, DateRange, ExportButtons, Field, FilterBar, MultiCheck, Note, Status, ask, errMsg, usePII, type Col,
} from '../../ui'
import { TODAY, addDays, cancelledAmount, liveSeats, num, roundLabel, usePerfMap, useRoundMap } from '../../lib'
import { CHANNELS, PAY_METHODS, STATUSES } from './shared'

type KwType = '통합' | '예매번호' | '예매자명' | '휴대폰' | '회원ID'
const KW_TYPES: KwType[] = ['통합', '예매번호', '예매자명', '휴대폰', '회원ID']

interface Filters {
  kwType: KwType; kw: string; perfId: string; roundDate: string; from: string; to: string
  statuses: BookingStatus[]; channels: Channel[]; pays: PayMethod[]
}
const defaults = (): Filters => ({
  kwType: '통합', kw: '', perfId: '', roundDate: '', from: addDays(TODAY, -30), to: TODAY, statuses: [], channels: [], pays: [],
})

export default function BookingSearch({ onOpen }: { onOpen: (id: string) => void }) {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const members = useStore(s => s.members)
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const pii = usePII()
  const toast = useStore(s => s.toast)
  const log = useStore(s => s.log)

  const initial = (): Filters => (q ? { ...defaults(), kw: q, from: '', to: '' } : defaults())
  const [form, setForm] = useState<Filters>(initial)
  const [applied, setApplied] = useState<Filters>(initial)
  const [selected, setSelected] = useState<string[]>([])
  const [smsOpen, setSmsOpen] = useState(false)

  // 상단 통합검색(?q=) 변경 시 조건 재설정
  useEffect(() => {
    if (!q) return
    const f = { ...defaults(), kw: q, from: '', to: '' }
    setForm(f); setApplied(f)
  }, [q])

  const loginOf = useMemo(() => new Map(members.map(m => [m.id, m.loginId])), [members])

  const rows = useMemo(() => {
    const f = applied
    const kw = f.kw.trim().toLowerCase()
    const kwDigits = kw.replace(/\D/g, '')
    const st = new Set(f.statuses), ch = new Set(f.channels), pm = new Set(f.pays)
    const match = (b: Booking) => {
      if (!kw) return true
      const t = f.kwType
      if ((t === '통합' || t === '예매번호') && b.id.toLowerCase().includes(kw)) return true
      if ((t === '통합' || t === '예매자명') && b.bookerName.includes(kw)) return true
      if ((t === '통합' || t === '휴대폰') && kwDigits.length >= 4 && b.bookerPhone.replace(/\D/g, '').includes(kwDigits)) return true
      if ((t === '통합' || t === '회원ID') && b.userId && (loginOf.get(b.userId) ?? '').toLowerCase().includes(kw)) return true
      return false
    }
    return bookings.filter(b => {
      if (f.perfId && b.perfId !== f.perfId) return false
      if (st.size && !st.has(b.status)) return false
      if (ch.size && !ch.has(b.channel)) return false
      if (pm.size && !pm.has(b.payMethod)) return false
      const d = b.createdAt.slice(0, 10)
      if (f.from && d < f.from) return false
      if (f.to && d > f.to) return false
      if (f.roundDate && roundMap.get(b.roundId)?.date !== f.roundDate) return false
      return match(b)
    })
  }, [bookings, applied, loginOf, roundMap])

  const sum = useMemo(() => {
    let seats = 0, paid = 0, cancel = 0
    for (const b of rows) { seats += liveSeats(b); paid += b.status === '취소완료' ? 0 : b.total; cancel += cancelledAmount(b) }
    return { seats, paid, cancel }
  }, [rows])

  const columns: Col<Booking>[] = useMemo(() => [
    { key: 'id', header: '예매번호', sort: b => b.id, render: b => <span className="font-mono text-xs font-semibold text-brand-600">{b.id}</span> },
    { key: 'createdAt', header: '예매일시', sort: b => b.createdAt, render: b => <span className="whitespace-nowrap text-xs">{b.createdAt}</span> },
    { key: 'perf', header: '공연', sort: b => perfMap.get(b.perfId)?.title ?? '', render: b => <span className="block max-w-[180px] truncate">{perfMap.get(b.perfId)?.title}</span> },
    { key: 'round', header: '관람일시', sort: b => { const r = roundMap.get(b.roundId); return r ? r.date + r.time : '' }, render: b => <span className="whitespace-nowrap text-xs">{roundLabel(roundMap.get(b.roundId))}</span> },
    { key: 'name', header: '예매자', sort: b => b.bookerName, render: b => pii.name(b.bookerName) },
    { key: 'phone', header: '휴대폰', sort: b => b.bookerPhone, render: b => <span className="whitespace-nowrap tabular-nums">{pii.phone(b.bookerPhone)}</span> },
    { key: 'cnt', header: '매수', align: 'right', sort: b => liveSeats(b), render: b => <>{liveSeats(b)}{liveSeats(b) !== b.seats.length && <span className="text-muted">/{b.seats.length}</span>}</> },
    { key: 'total', header: '금액', align: 'right', sort: b => b.total, render: b => won(b.total) },
    { key: 'pay', header: '결제수단', sort: b => b.payMethod, render: b => b.payMethod },
    { key: 'ch', header: '채널', sort: b => b.channel, render: b => b.channel },
    { key: 'status', header: '상태', sort: b => b.status, render: b => <Status s={b.status} /> },
  ], [perfMap, roundMap, pii])

  const exportRows = () => [
    ['예매번호', '예매일시', '공연', '관람일시', '예매자', '휴대폰', '매수', '금액', '결제수단', '채널', '상태'],
    ...rows.map(b => [b.id, b.createdAt, perfMap.get(b.perfId)?.title ?? '', roundLabel(roundMap.get(b.roundId)), pii.name(b.bookerName), pii.phone(b.bookerPhone), liveSeats(b), b.total, b.payMethod, b.channel, b.status]),
  ]

  const bulkIssue = async () => {
    const targets = rows.filter(b => selected.includes(b.id))
    const ok = targets.filter(b => b.status === '예매완료' || b.status === '부분취소')
    if (!ok.length) { toast(errMsg('E-TC-301', '발권 가능한 예매가 없습니다 (예매완료·부분취소 상태만 발권 가능)'), 'warn'); return }
    const r = await ask({
      title: '일괄 발권', confirmText: `${ok.length}건 발권`,
      message: <>선택한 {targets.length}건 중 <b>{ok.length}건</b>을 발권 처리합니다.{targets.length > ok.length && <><br /><span className="text-xs text-muted">입금대기·취소완료·이미 발권된 {targets.length - ok.length}건은 제외됩니다.</span></>}</>,
    })
    if (r === null) return
    const st = useStore.getState()
    ok.forEach(b => st.issueBooking(b.id))
    log('예매 일괄 발권', `${ok.length}건 (${ok[0].id} 외)`)
    toast(`${ok.length}건 발권 처리 완료`)
    setSelected([])
  }

  const setF = <K extends keyof Filters>(k: K, v: Filters[K]) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <FilterBar onSearch={() => { setApplied(form); setSelected([]) }} onReset={() => { const d = defaults(); setForm(d); setApplied(d) }}>
        <Field label="검색어" className="sm:col-span-2">
          <div className="flex gap-1.5">
            <select className="input w-28 shrink-0" value={form.kwType} onChange={e => setF('kwType', e.target.value as KwType)} aria-label="검색 구분">
              {KW_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="input" value={form.kw} onChange={e => setF('kw', e.target.value)} placeholder="예매번호 / 예매자명 / 휴대폰(뒤 4자리 가능) / 회원ID" />
          </div>
        </Field>
        <Field label="공연">
          <select className="input" value={form.perfId} onChange={e => setF('perfId', e.target.value)}>
            <option value="">전체 공연</option>
            {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="회차일(관람일)">
          <input type="date" className="input" value={form.roundDate} onChange={e => setF('roundDate', e.target.value)} />
        </Field>
        <Field label="예매일" className="sm:col-span-2">
          <DateRange from={form.from} to={form.to} onChange={(a, b) => setForm(f => ({ ...f, from: a, to: b }))} />
        </Field>
        <Field label="예매 상태" className="sm:col-span-2">
          <MultiCheck options={STATUSES} value={form.statuses} onChange={v => setF('statuses', v)} />
        </Field>
        <Field label="판매 채널" className="sm:col-span-2">
          <MultiCheck options={CHANNELS} value={form.channels} onChange={v => setF('channels', v)} />
        </Field>
        <Field label="결제수단" className="sm:col-span-2">
          <MultiCheck options={PAY_METHODS} value={form.pays} onChange={v => setF('pays', v)} />
        </Field>
      </FilterBar>

      {q && applied.kw === q && (
        <Note className="mb-3">상단 통합검색어 <b>“{q}”</b>로 전체 기간을 조회했습니다. (예매번호·예매자명·휴대폰 뒤 4자리·회원ID 일치)</Note>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['조회 건수', `${num(rows.length)}건`], ['예매 매수', `${num(sum.seats)}매`],
          ['결제금액', won(sum.paid)], ['취소금액', won(sum.cancel)],
        ].map(([l, v]) => (
          <div key={l} className="card px-4 py-3">
            <div className="text-[11px] font-semibold text-muted">{l}</div>
            <div className={l === '취소금액' ? 'text-lg font-extrabold tabular-nums text-coral-500' : 'text-lg font-extrabold tabular-nums text-ink'}>{v}</div>
          </div>
        ))}
      </div>

      <Card
        title="예매 내역"
        sub="행을 클릭하면 상세 정보와 취소·좌석변경·발권 처리를 할 수 있습니다."
        bodyClass="p-3"
        actions={<>
          <button className="btn-outline btn-sm" disabled={!selected.length} onClick={bulkIssue}><Ticket size={14} />선택 발권</button>
          <button className="btn-outline btn-sm" disabled={!selected.length} onClick={() => setSmsOpen(true)}><MessageSquare size={14} />선택 문자</button>
          <ExportButtons filename="예매내역" count={rows.length} getRows={exportRows} heavyAt={3000} />
        </>}
      >
        <DataTable
          columns={columns} rows={rows} rowKey={b => b.id} onRowClick={b => onOpen(b.id)}
          selectable selected={selected} onSelectChange={setSelected}
          initialSort={{ key: 'createdAt', dir: 'desc' }} dense
          empty="조건에 맞는 예매가 없습니다. 검색 조건을 변경해 보세요."
        />
      </Card>

      <SmsModal open={smsOpen} onClose={() => setSmsOpen(false)} targets={rows.filter(b => selected.includes(b.id))} onDone={() => setSelected([])} />
    </>
  )
}

function SmsModal({ open, onClose, targets, onDone }: { open: boolean; onClose: () => void; targets: Booking[]; onDone: () => void }) {
  const [text, setText] = useState('[국립어린이청소년극단] 예매하신 공연 관람 안내드립니다. 공연 시작 20분 전까지 입장해 주시기 바랍니다. 모바일 티켓은 마이페이지에서 확인하실 수 있습니다.')
  const [kind, setKind] = useState<'알림톡' | 'SMS'>('알림톡')
  const [err, setErr] = useState('')
  const send = () => {
    if (!text.trim()) { setErr(errMsg('E-CM-102', '발송 내용을 입력해 주세요')); return }
    const st = useStore.getState()
    targets.forEach(b => st.sendSms(b.bookerPhone, text, kind))
    st.log(`예매자 ${kind} 일괄 발송`, `${targets.length}건`)
    st.toast(`${targets.length}명에게 ${kind} 발송 완료`)
    onDone(); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={`선택 예매자 문자 발송 (${targets.length}명)`}
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={send}>발송</button></>}>
      <div className="space-y-3">
        <div className="flex gap-3 text-sm">
          {(['알림톡', 'SMS'] as const).map(k => (
            <label key={k} className="flex items-center gap-1.5"><input type="radio" checked={kind === k} onChange={() => setKind(k)} />{k}</label>
          ))}
        </div>
        <textarea className="input min-h-32" value={text} onChange={e => { setText(e.target.value); setErr('') }} />
        <div className="flex justify-between text-xs text-muted"><span>{err && <span className="font-medium text-coral-500">{err}</span>}</span><span>{new Blob([text]).size} byte</span></div>
        <Note>알림톡 실패 시 SMS로 대체 발송됩니다. 발송 이력은 변경이력에 기록됩니다.</Note>
      </div>
    </Modal>
  )
}
