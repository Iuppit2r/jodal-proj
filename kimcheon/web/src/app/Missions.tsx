import { useState } from 'react'
import { CheckCircle2, ChevronRight, Circle, MapPin, Mountain as MountainIcon } from 'lucide-react'
import { byId, missions, placeById, places, placeTypeLabel, type PlaceType } from '../data'
import { missionProgress, useApp } from '../store'
import { Card, Chip, Page, Progress, Scroll, SectionTitle, TopBar } from '../components/ui'
import { MissionStamp, Osam } from '../components/art'
import { MapView } from '../components/MapView'

export default function Missions() {
  const { records, visits, push } = useApp()
  const [ptype, setPtype] = useState<PlaceType | 'all'>('all')
  const done = missions.filter((m) => missionProgress(m, records, visits).done).length
  const visited = Object.keys(visits).length

  return (
    <div className="absolute inset-0 flex flex-col">
      <Scroll underStatus>
        <section className="bg-white px-5 pt-[59px] pb-5">
          <h1 className="text-[24px] font-extrabold tracking-tight">관광 연계 미션</h1>
          <p className="mt-1 text-[15px] text-sub">산 정상에서 끝나지 않는 김천 여행</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-paper p-4">
            <Osam pose="tour" size={60} />
            <div className="flex-1">
              <p className="text-[16px] font-extrabold">
                미션 {done}/{missions.length} 완료 · 관광지 {visited}곳 방문
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-sub">산 인증 후 주변 관광지에서 위치 체크인하면 관광 배지를 받아요</p>
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3 px-4">
          {missions.map((m) => {
            const p = missionProgress(m, records, visits)
            return (
              <Card key={m.id} onClick={() => push({ name: 'mission', id: m.id })} className="overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <MissionStamp mission={m} earned={p.done} size={56} date={p.doneAt} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-extrabold">{m.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-sub">{m.story}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-line px-4 py-3">
                  <Progress value={p.steps / p.total} className="h-2 flex-1" />
                  <span className={`text-[14px] font-bold ${p.done ? 'text-forest' : 'text-sub'}`}>{p.done ? '배지 획득' : `${p.steps}/${p.total} 단계`}</span>
                </div>
              </Card>
            )
          })}
        </section>

        <section className="mt-7">
          <SectionTitle title="김천 관광지도" />
          <div className="mx-4 overflow-hidden rounded-[20px]">
            <MapView className="h-64" zoom={10} center={[36.02, 128.06]} places={places.filter((p) => ptype === 'all' || p.type === ptype)} onPick={(id) => push({ name: 'mountain', id })} />
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 py-1 text-[15px]">
            {(['all', 'tour', 'food', 'stay'] as const).map((t) => (
              <Chip key={t} active={ptype === t} onClick={() => setPtype(t)}>
                {t === 'all' ? '전체' : placeTypeLabel[t]}
              </Chip>
            ))}
          </div>
          <div className="mt-3 space-y-2 px-4 pb-8">
            {places
              .filter((p) => ptype === 'all' || p.type === ptype)
              .map((p) => (
                <Card key={p.id} onClick={() => push({ name: 'place', id: p.id })} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="w-14 shrink-0 rounded-lg bg-alt py-1 text-center text-[14px] font-bold text-sub">{placeTypeLabel[p.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold">{p.name}</p>
                    <p className="truncate text-[14px] text-sub">{p.area.replace('김천시 ', '')} · {p.category}</p>
                  </div>
                  {visits[p.id] ? <CheckCircle2 size={20} className="text-forest" /> : <ChevronRight size={20} className="text-mute" />}
                </Card>
              ))}
          </div>
        </section>
      </Scroll>
    </div>
  )
}

export function MissionDetail({ id }: { id: string }) {
  const m = missions.find((x) => x.id === id)!
  const { records, visits, push } = useApp()
  const p = missionProgress(m, records, visits)
  const spots = m.spots.map(placeById)
  const peaks = m.peaks.map(byId)
  const center: [number, number] = [
    (spots.reduce((s, x) => s + x.lat, 0) + peaks.reduce((s, x) => s + (x.lat ?? 0), 0)) / (spots.length + peaks.length),
    (spots.reduce((s, x) => s + x.lng, 0) + peaks.reduce((s, x) => s + (x.lng ?? 0), 0)) / (spots.length + peaks.length),
  ]

  return (
    <Page>
      <TopBar title="관광 연계 미션" />
      <Scroll>
        <div className="bg-white px-5 pt-2 pb-5 text-center">
          <div className="mx-auto w-fit anim-pop">
            <MissionStamp mission={m} earned={p.done} size={104} date={p.doneAt} />
          </div>
          <p className="mt-3 text-[15px] font-bold" style={{ color: m.color }}>
            「{m.badge}」 배지
          </p>
          <h1 className="mt-1 text-[24px] font-black tracking-tight">{m.title}</h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-relaxed text-sub">{m.story}</p>
          <Progress value={p.steps / p.total} className="mx-auto mt-4 h-2.5 max-w-[260px]" />
          <p className="mt-2 text-[15px] font-bold text-sub">{p.done ? '미션 완료! 배지를 획득했어요' : `${p.steps}/${p.total} 단계 진행`}</p>
        </div>

        <div className="mx-4 mt-4 overflow-hidden rounded-[20px]">
          <MapView className="h-52" center={center} zoom={11} focus={peaks[0].id} places={spots} onPick={(pid) => push({ name: 'mountain', id: pid })} />
        </div>

        <div className="space-y-3 p-4 pb-8">
          <Card className="p-4">
            <h2 className="text-[16px] font-extrabold">
              1단계 · 산 정상 인증 {m.need < m.peaks.length ? `(${m.peaks.length}곳 중 ${m.need}곳)` : ''}
            </h2>
            <ul className="mt-2">
              {peaks.map((pk) => (
                <li key={pk.id}>
                  <button onClick={() => push({ name: 'mountain', id: pk.id })} className="flex w-full items-center gap-3 py-2.5 text-left">
                    {records[pk.id] ? <CheckCircle2 size={22} className="text-forest" /> : <Circle size={22} className="text-[#C5CCD6]" />}
                    <MountainIcon size={18} className="text-sub" />
                    <span className="flex-1 text-[16px] font-bold">
                      {pk.title} {pk.height}m
                    </span>
                    <ChevronRight size={18} className="text-mute" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="text-[16px] font-extrabold">2단계 · 관광지 방문 체크인</h2>
            <ul className="mt-2">
              {spots.map((s) => (
                <li key={s.id}>
                  <button onClick={() => push({ name: 'place', id: s.id })} className="flex w-full items-center gap-3 py-2.5 text-left">
                    {visits[s.id] ? <CheckCircle2 size={22} className="text-forest" /> : <Circle size={22} className="text-[#C5CCD6]" />}
                    <MapPin size={18} className="text-sub" />
                    <span className="flex-1 text-[16px] font-bold">{s.name}</span>
                    <span className="text-[14px] font-semibold text-brand">{visits[s.id] ? '방문완료' : '체크인'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <p className="px-1 text-[14px] leading-relaxed text-mute">관광지 체크인은 현장 반경 200m 이내에서 위치로 확인합니다. 관광지 정보는 김천 문화관광 누리집 데이터를 연계합니다.</p>
        </div>
      </Scroll>
    </Page>
  )
}
