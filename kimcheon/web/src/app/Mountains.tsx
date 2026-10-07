import { useMemo, useState } from 'react'
import { CheckCircle2, List, Map as MapIcon, Search } from 'lucide-react'
import { fmtKm, mountains, TOTAL, zoneById, zones, type ZoneId } from '../data'
import { useApp } from '../store'
import { Chip, Scroll } from '../components/ui'
import { MountainArt } from '../components/art'
import { MapView } from '../components/MapView'
import { Empty } from './More'

type Sort = 'dist' | 'high' | 'no'
type Status = 'all' | 'todo' | 'done'

export default function Mountains() {
  const { records, push } = useApp()
  const [q, setQ] = useState('')
  const [zone, setZone] = useState<ZoneId | 'all'>('all')
  const [status, setStatus] = useState<Status>('all')
  const [sort, setSort] = useState<Sort>('dist')
  const [view, setView] = useState<'list' | 'map'>('list')

  const list = useMemo(() => {
    const r = mountains.filter(
      (m) =>
        (zone === 'all' || m.zone === zone) &&
        (status === 'all' || (status === 'done' ? !!records[m.id] : !records[m.id])) &&
        (!q || m.title.includes(q) || m.summit.includes(q) || m.regionLabel.includes(q)),
    )
    return r.sort((a, b) =>
      sort === 'high' ? b.height - a.height : sort === 'no' ? a.no - b.no : (a.distKm ?? 999) - (b.distKm ?? 999),
    )
  }, [q, zone, status, sort, records])

  const done = Object.keys(records).length

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="shrink-0 bg-white px-5 pt-[59px] pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-extrabold tracking-tight">김천 100산</h1>
          <div className="flex rounded-xl bg-alt p-1">
            {(['list', 'map'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`flex h-9 items-center gap-1 rounded-lg px-3 text-[15px] font-bold ${view === v ? 'bg-white text-brand shadow-sm' : 'text-sub'}`}>
                {v === 'list' ? <List size={17} /> : <MapIcon size={17} />}
                {v === 'list' ? '목록' : '지도'}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-[15px] font-medium text-sub">
          김천 {TOTAL}명산 · 내 인증 {done}산
        </p>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl bg-alt px-4">
          <Search size={19} className="text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="산 이름, 지역 검색" className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-mute" />
        </label>
        <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 py-1 text-[15px]">
          <Chip active={zone === 'all'} onClick={() => setZone('all')}>
            전체 권역
          </Chip>
          {zones.map((z) => (
            <Chip key={z.id} active={zone === z.id} onClick={() => setZone(z.id)}>
              {z.name}
            </Chip>
          ))}
        </div>
      </header>

      {view === 'map' ? (
        <div className="relative min-h-0 flex-1">
          <MapView className="absolute inset-0" zoom={10} onPick={(id) => push({ name: 'mountain', id })} />
          <div className="absolute inset-x-4 bottom-4 z-[500] flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-white/95 px-4 py-3 text-[14px] font-semibold shadow">
            <span className="flex items-center gap-1.5">
              <i className="size-3 rounded-full bg-forest" /> 인증완료
            </span>
            {zones.map((z) => (
              <span key={z.id} className="flex items-center gap-1.5">
                <i className="size-3 rounded-full" style={{ background: z.color }} /> {z.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-5 py-2.5 text-[15px]">
            {(
              [
                ['all', '전체'],
                ['todo', '미인증'],
                ['done', '인증완료'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setStatus(k)} className={`font-bold ${status === k ? 'text-brand' : 'text-mute'}`}>
                {l}
              </button>
            ))}
            <span className="flex-1" />
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent font-semibold text-sub outline-none">
              <option value="dist">가까운순</option>
              <option value="high">높은순</option>
              <option value="no">번호순</option>
            </select>
          </div>
          <Scroll className="bg-white">
            <p className="px-5 pt-3 text-[14px] font-semibold text-mute">{list.length}개 봉우리</p>
            {list.length === 0 && <Empty text={`「${q}」에 맞는 산이 없어요. 산 이름이나 면 이름으로 다시 검색해 보세요.`} />}
            <ul>
              {list.map((m) => {
                const isDone = !!records[m.id]
                return (
                  <li key={m.id}>
                    <button onClick={() => push({ name: 'mountain', id: m.id })} className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-alt">
                      <span className="w-7 shrink-0 text-center text-[15px] font-bold text-mute">{m.no}</span>
                      <div className="relative size-[60px] shrink-0 overflow-hidden rounded-2xl">
                        <MountainArt m={m} className="size-full" />
                        {isDone && (
                          <span className="absolute inset-0 grid place-items-center bg-forest/70 text-white">
                            <CheckCircle2 size={26} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-extrabold">{m.title}</p>
                        <p className="mt-0.5 truncate text-[14px] font-medium text-sub">
                          {m.height}m · {m.regionLabel}
                        </p>
                        <p className="mt-0.5 text-[14px] font-semibold" style={{ color: zoneById(m.zone).color }}>
                          {zoneById(m.zone).name}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[14px] font-bold ${m.canCertify ? 'text-sub' : 'text-mute'}`}>{fmtKm(m.distKm)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="px-5 py-6 text-[14px] leading-relaxed text-mute">
              출처: 매일신문 「김천의 100산 100설」(2020) · 정상 좌표 오픈스트리트맵. 좌표 미확보 봉우리는 관리자 등록 후 인증 가능합니다.
            </p>
          </Scroll>
        </>
      )}
    </div>
  )
}
