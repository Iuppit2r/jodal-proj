import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { useStore } from '../../store'
import * as M from '../../data/mock'
import { fmtRange } from '../../lib/format'
import { PageHeader, Status, Tabs, ask } from '../ui'
import { TODAY, roundLabel } from '../lib'
import SeatEditor from './seats/SeatEditor'
import SeatStatus from './seats/SeatStatus'

export default function Seats() {
  const perfs = useStore(s => s.performances)
  const allRounds = useStore(s => s.rounds)
  const [perfId, setPerfId] = useState(() => (perfs.find(p => p.status === '판매중') ?? perfs[0])?.id ?? '')
  const perf = perfs.find(p => p.id === perfId)
  const rounds = useMemo(() => allRounds.filter(r => r.perfId === perfId).sort((a, b) => a.no - b.no), [allRounds, perfId])
  const pickDefault = (rs: typeof rounds) => (rs.find(r => r.active && r.date >= TODAY) ?? rs[0])?.id ?? ''
  const [roundId, setRoundId] = useState(() => pickDefault(rounds))
  const round = rounds.find(r => r.id === roundId) ?? rounds.find(r => r.id === pickDefault(rounds))
  const [tab, setTab] = useState('edit')
  const [dirty, setDirty] = useState(false)
  const onDirty = useCallback((d: boolean) => setDirty(d), [])

  const changePerf = async (id: string) => {
    if (dirty) {
      const r = await ask({ title: '공연 변경', tone: 'warn', confirmText: '이동', message: '저장하지 않은 좌석 등급 변경 내용이 있습니다. 다른 공연으로 이동하면 변경 내용이 사라집니다.' })
      if (r === null) return
    }
    setPerfId(id)
    setRoundId(pickDefault(allRounds.filter(r => r.perfId === id)))
    setDirty(false)
  }

  const venue = perf ? M.venues.find(v => v.id === perf.venueId)! : undefined

  return (
    <div className="space-y-4">
      <PageHeader title="좌석관리" code="SFR-TC-006~007"
        desc="공연별 좌석 등급 배정, 회차별 보류·현장판매 전용 좌석 지정, 실시간 좌석 상태를 관리합니다."
        actions={perf && <Link to={`/admin/performances/${perf.id}`} className="btn-outline btn-sm"><Settings2 size={14} />공연 정보·가격</Link>} />

      <div className="card no-print grid gap-3 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-end">
        <div>
          <label className="label text-[13px]" htmlFor="seat-perf">공연</label>
          <select id="seat-perf" className="input py-2" value={perfId} onChange={e => changePerf(e.target.value)}>
            {perfs.map(p => <option key={p.id} value={p.id}>[{p.status}] {p.title || p.code} ({fmtRange(p.start, p.end)})</option>)}
          </select>
        </div>
        <div>
          <label className="label text-[13px]" htmlFor="seat-round">회차</label>
          <select id="seat-round" className="input py-2" value={round?.id ?? ''} onChange={e => setRoundId(e.target.value)} disabled={!rounds.length}>
            {!rounds.length && <option value="">등록된 회차 없음</option>}
            {rounds.map(r => <option key={r.id} value={r.id}>{roundLabel(r)}{r.note ? ` · ${r.note}` : ''}{!r.active ? ' (미사용)' : ''}</option>)}
          </select>
        </div>
        {perf && venue && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted md:pb-2">
            <Status s={perf.status} /><span>{venue.name}</span><span>·</span><span>{venue.rows.length * venue.cols}석</span><span>·</span><span>{rounds.length}회차</span>
          </div>
        )}
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'edit', label: '좌석 편집', badge: dirty ? '!' : undefined },
        { id: 'status', label: '좌석 상태 조회' },
      ]} />

      {!perf ? <div className="card p-10 text-center text-sm text-muted">공연을 선택하세요.</div>
        : <>
          {/* 편집 탭은 숨김 유지 – 탭 전환 시 미저장 등급 변경 보존 */}
          <div className={tab === 'edit' ? '' : 'hidden'}><SeatEditor key={perf.id} perf={perf} round={round} rounds={rounds} onDirty={onDirty} /></div>
          {tab === 'status' && <SeatStatus perf={perf} round={round} rounds={rounds} onPick={setRoundId} />}
        </>}
    </div>
  )
}
