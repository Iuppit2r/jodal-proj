import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { useBookings, useStore } from '../../store'
import { ask, DateRange, Field, FilterBar, Note, PageHeader, runHeavy, Tabs } from '../ui'
import { TODAY } from '../lib'
import { filterBookings, type RangeFilter } from './reports/common'
import { ChannelReport, CounterReport, ProductReport, TicketTypeReport } from './reports/SalesReports'
import RoundReport from './reports/RoundReport'
import AudienceReport from './reports/AudienceReport'

const TABS = [
  { id: 'product', label: '상품별' },
  { id: 'round', label: '회차·등급별' },
  { id: 'channel', label: '채널별' },
  { id: 'ttype', label: '권종별' },
  { id: 'counter', label: '일별 창구(현장)' },
  { id: 'audience', label: '관람객 통계' },
]
const HEAVY = new Set(['round', 'audience'])
const INIT: RangeFilter = { from: '2026-06-20', to: TODAY, perfId: '' }

/** PER-004: 장시간 통계 연산 안내 → 진행 표시 */
async function gate(label: string, n: number) {
  const ok = await ask({
    title: '통계 연산 안내', tone: 'warn', confirmText: '조회 실행',
    message: <>통계 연산은 10초 이상 걸릴 수 있습니다 (PER-004).<br /><span className="text-muted">대상: {label} · 예매 원장 {n.toLocaleString()}건</span></>,
  })
  if (ok === null) return false
  await runHeavy({ title: `${label} 집계 중`, message: `예매 원장 ${n.toLocaleString()}건을 집계하고 있습니다. 잠시만 기다려 주세요.`, ms: 1500 })
  return true
}

export default function Reports() {
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const log = useStore(s => s.log)
  const [tab, setTab] = useState('product')
  const [draft, setDraft] = useState<RangeFilter>(INIT)
  const [f, setF] = useState<RangeFilter>(INIT)
  const [loaded, setLoaded] = useState<Set<string>>(new Set(['product', 'channel', 'ttype', 'counter']))
  const [ranAt, setRanAt] = useState<string | null>(null)

  const sales = useMemo(() => bookings.filter(b => b.status !== '입금대기'), [bookings])
  const rows = useMemo(() => filterBookings(sales, f), [sales, f])

  const tabLabel = (id: string) => TABS.find(t => t.id === id)!.label
  const onTab = async (id: string) => {
    if (HEAVY.has(id) && !loaded.has(id)) {
      if (!(await gate(tabLabel(id), sales.length))) return
      setLoaded(new Set([...loaded, id]))
      log('판매보고서 조회', tabLabel(id))
    }
    setTab(id)
  }
  const onSearch = async () => {
    if (draft.from && draft.to && draft.from > draft.to) { useStore.getState().toast('[E-RP-101] 시작일이 종료일보다 늦습니다', 'err'); return }
    if (!(await gate(tabLabel(tab), sales.length))) return
    setF(draft)
    setLoaded(new Set(['product', 'channel', 'ttype', 'counter', tab]))
    setRanAt(new Date().toTimeString().slice(0, 8))
    log('판매보고서 조회', `${tabLabel(tab)} / ${draft.from || '전체'}~${draft.to || '전체'}${draft.perfId ? ` / ${perfs.find(p => p.id === draft.perfId)?.title}` : ''}`)
  }

  const period = `결제일 ${f.from || '전체'} ~ ${f.to || '전체'} · ${f.perfId ? perfs.find(p => p.id === f.perfId)?.title : '전체 공연'}`

  return (
    <div>
      <PageHeader title="판매보고서" code={tab === 'audience' ? 'SFR-TC-016' : 'SFR-TC-014'}
        desc="상품·회차·채널·권종·창구별 판매 실적과 관람객 통계를 조회하고 엑셀·인쇄로 출력합니다." />
      <FilterBar onSearch={onSearch} onReset={() => setDraft(INIT)}>
        <Field label={tab === 'round' || tab === 'audience' ? '기간 (공연일 기준)' : '기간 (결제일 기준)'} className="sm:col-span-2">
          <DateRange from={draft.from} to={draft.to} onChange={(from, to) => setDraft({ ...draft, from, to })} />
        </Field>
        <Field label="공연">
          <select className="input" value={draft.perfId} onChange={e => setDraft({ ...draft, perfId: e.target.value })}>
            <option value="">전체 공연</option>
            {perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="조회 안내">
          <div className="flex items-start gap-1.5 pt-1 text-xs text-muted"><Clock size={13} className="mt-0.5 shrink-0" />
            <span>대량 통계는 백그라운드 집계 후 표시됩니다 (PER-004).{ranAt && <><br />최근 조회 {ranAt}</>}</span>
          </div>
        </Field>
      </FilterBar>
      <Tabs tabs={TABS.map(t => ({ ...t, badge: HEAVY.has(t.id) && !loaded.has(t.id) ? '집계' : undefined }))} value={tab} onChange={onTab} />
      {tab === 'product' && <ProductReport rows={rows} period={period} />}
      {tab === 'round' && <RoundReport key={f.perfId} all={sales} f={f} />}
      {tab === 'channel' && <ChannelReport rows={rows} period={period} />}
      {tab === 'ttype' && <TicketTypeReport rows={rows} period={period} />}
      {tab === 'counter' && <CounterReport rows={rows} period={period} />}
      {tab === 'audience' && <AudienceReport all={sales} f={f} />}
      <Note className="no-print mt-4">판매금액은 취소 좌석·쿠폰 할인을 제외한 순매출(예매수수료 별도) 기준입니다. 입금대기(가상계좌 미입금) 건은 집계에서 제외됩니다.</Note>
    </div>
  )
}
