import { useState } from 'react'
import { BedDouble, Camera, CheckCircle2, Clock, Copy, MapPin, Navigation, Phone, Utensils } from 'lucide-react'
import { distKm, fmtDate, fmtKm, missions, mountains, placeById, placeTypeLabel } from '../data'
import { missionProgress, useApp } from '../store'
import { BottomBar, Card, Page, PrimaryButton, Scroll, TopBar } from '../components/ui'
import { MissionStamp, MountainArt, Osam } from '../components/art'
import { MapView } from '../components/MapView'

const ICON = { tour: Camera, food: Utensils, stay: BedDouble }
const BG = { tour: '#2C4A6E', food: '#C7793A', stay: '#5E5470' }

export default function PlaceDetail({ id }: { id: string }) {
  const p = placeById(id)
  const { records, visits, visit, atSummit, setAtSummit, push, showToast } = useApp()
  const [earned, setEarned] = useState<string[]>([])
  const Icon = ICON[p.type]
  const rel = missions.filter((m) => m.spots.includes(id))
  const nearPeaks = mountains
    .filter((m) => m.lat != null)
    .map((m) => ({ m, km: distKm(p.lat, p.lng, m.lat!, m.lng!) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
  const visited = visits[id]

  return (
    <Page>
      <TopBar title={placeTypeLabel[p.type]} />
      <Scroll>
        <div className="relative mx-4 mt-1 flex h-40 items-end overflow-hidden rounded-[22px] p-5 text-white" style={{ background: BG[p.type] }}>
          <Icon size={120} strokeWidth={1.2} className="absolute -top-3 -right-3 opacity-25" />
          <div>
            <p className="text-[15px] font-semibold text-white/85">{p.category}</p>
            <h1 className="text-[26px] font-black tracking-tight">{p.name}</h1>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <Card className="p-4">
            <p className="text-[15px] leading-relaxed text-sub">{p.desc}</p>
            <dl className="mt-4 space-y-2.5 text-[15px]">
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 shrink-0 text-mute">
                  <MapPin size={17} />
                </dt>
                <dd className="flex-1 font-semibold">{p.area}</dd>
                <button onClick={() => showToast('주소를 복사했어요')} className="flex shrink-0 items-center gap-1 text-[14px] font-bold text-brand">
                  <Copy size={14} /> 복사
                </button>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 shrink-0 text-mute">
                  <Phone size={17} />
                </dt>
                <dd className="flex-1 font-semibold">{p.phone}</dd>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 shrink-0 text-mute">
                  <Clock size={17} />
                </dt>
                <dd className="flex-1 font-semibold">{p.hours}</dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`tel:${p.phone}`} className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-brand-50 text-[15px] font-bold text-brand">
                <Phone size={17} /> 전화 걸기
              </a>
              <button onClick={() => showToast('지도 앱에서 길찾기를 시작해요')} className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-brand-50 text-[15px] font-bold text-brand">
                <Navigation size={17} /> 길찾기
              </button>
            </div>
            <p className="mt-3 text-[14px] text-sub">정보 출처: 김천 문화관광 누리집 연계</p>
          </Card>

          <Card className="overflow-hidden">
            <MapView className="h-48" center={[p.lat, p.lng]} zoom={12} places={[p]} onPick={(mid) => push({ name: 'mountain', id: mid })} />
          </Card>

          {rel.map((m) => {
            const pr = missionProgress(m, records, visits)
            return (
              <Card key={m.id} onClick={() => push({ name: 'mission', id: m.id })} className="flex items-center gap-3 p-4">
                <MissionStamp mission={m} earned={pr.done} size={50} date={pr.doneAt} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-accent">이곳이 포함된 미션</p>
                  <p className="truncate text-[16px] font-extrabold">{m.title}</p>
                  <p className="truncate text-[14px] text-sub">{pr.done ? '배지 획득 완료' : pr.peaksOk ? '산 인증 완료 · 방문만 남았어요' : `산 인증 ${pr.peaksDone}/${m.need} 필요`}</p>
                </div>
              </Card>
            )
          })}

          <Card className="p-4">
            <h2 className="text-[16px] font-extrabold">가까운 김천 100산</h2>
            <ul className="mt-2">
              {nearPeaks.map(({ m, km }) => (
                <li key={m.id}>
                  <button onClick={() => push({ name: 'mountain', id: m.id })} className="flex w-full items-center gap-3 py-2 text-left">
                    <div className="size-11 shrink-0 overflow-hidden rounded-xl">
                      <MountainArt m={m} className="size-full" />
                    </div>
                    <span className="flex-1 text-[16px] font-bold">
                      {m.title} {m.height}m
                    </span>
                    <span className="text-[14px] font-semibold text-sub">{fmtKm(km)}</span>
                    {records[m.id] && <CheckCircle2 size={18} className="text-forest" />}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <div className="demo-only flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <p className="flex-1 text-[15px] font-semibold text-sub">현장 도착 시뮬레이션 (시연용)</p>
            <button onClick={() => setAtSummit(!atSummit)} className={`relative h-7 w-12 rounded-full transition ${atSummit ? 'bg-forest' : 'bg-[#C9CCC6]'}`} aria-pressed={atSummit}>
              <i className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${atSummit ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Scroll>
      <BottomBar>
        {visited ? (
          <div className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-forest-50 text-[17px] font-bold text-forest">
            <CheckCircle2 size={21} /> {fmtDate(visited)} 방문 인증 완료
          </div>
        ) : (
          <PrimaryButton disabled={!atSummit} onClick={() => {
              const got = visit(id)
              if (got.length) setEarned(got)
              else showToast(`${p.name} 방문 인증 완료!`)
            }}>
            <Navigation size={20} /> {atSummit ? '방문 체크인 (현장 반경 200m)' : '현장에 도착하면 체크인할 수 있어요'}
          </PrimaryButton>
        )}
      </BottomBar>

      {earned.length > 0 && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-8" onClick={() => setEarned([])}>
          <div className="anim-pop w-full rounded-3xl bg-white p-6 text-center">
            {earned.map((eid) => {
              const m = missions.find((x) => x.id === eid)!
              return (
                <div key={eid}>
                  <div className="mx-auto flex w-fit items-end gap-1">
                    <Osam pose="love" size={120} />
                    <span className="anim-stamp inline-block"><MissionStamp mission={m} earned size={92} date={missionProgress(m, records, visits).doneAt} /></span>
                  </div>
                  <p className="mt-3 text-[15px] font-bold text-accent">관광 미션 완료!</p>
                  <p className="mt-1 text-[22px] font-black">「{m.badge}」</p>
                  <p className="mt-1 text-[15px] text-sub">{m.title} 미션을 달성했어요</p>
                </div>
              )
            })}
            <PrimaryButton accent className="mt-5" onClick={() => setEarned([])}>
              확인
            </PrimaryButton>
          </div>
        </div>
      )}
    </Page>
  )
}
