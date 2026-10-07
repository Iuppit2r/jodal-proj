import { useState } from 'react'
import { Bus, Camera, Car, ChevronRight, Clock, Footprints, Info, MessageSquareText, ParkingCircle, Ruler, Share2 } from 'lucide-react'
import { coursesOf, parkingOf, transportOf } from '../data/extra'
import { byId, fmtDate, fmtKm, missions, nearbyPlaces, placeTypeLabel, zoneById, type PlaceType } from '../data'
import { missionProgress, orderOf, useApp } from '../store'
import { BottomBar, Card, Chip, Page, PrimaryButton, Scroll, TopBar } from '../components/ui'
import { MissionStamp, MountainArt, Osam, Stamp } from '../components/art'
import { MapView } from '../components/MapView'

export default function MountainDetail({ id }: { id: string }) {
  const m = byId(id)
  const { records, visits, push, posts } = useApp()
  const rec = records[id]
  const zone = zoneById(m.zone)
  const [ptype, setPtype] = useState<PlaceType | undefined>(undefined)
  const [solid, setSolid] = useState(false)
  const near = nearbyPlaces(m, ptype, 5)
  const relMissions = missions.filter((x) => x.peaks.includes(id))

  return (
    <Page>
      {solid ? (
        <div className="absolute inset-x-0 top-0 z-20 border-b border-line bg-white">
          <TopBar title={m.title} />
        </div>
      ) : (
        <TopBar transparent dark />
      )}
      <Scroll onScrolled={setSolid}>
        <div className="relative h-[300px]">
          <MountainArt m={m} className="size-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          <div className="absolute inset-x-5 bottom-5 text-white">
            <p className="text-[15px] font-semibold text-white/85">{m.no}번 · {zone.name}</p>
            <h1 className="mt-1 text-[30px] font-black tracking-tight">{m.title}</h1>
            <p className="mt-0.5 text-[16px] font-semibold text-white/90">
              {m.summit} {m.height}m{m.hanja ? ` · ${m.hanja}` : ''}
            </p>
          </div>
          {rec && (
            <div className="anim-stamp absolute top-[96px] right-4">
              <Stamp m={m} date={rec.at} size={104} />
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {/* 기본 정보 */}
          <Card className="grid grid-cols-3 divide-x divide-line py-4 text-center">
            {[
              ['해발', `${m.height}m`],
              ['내 위치에서', fmtKm(m.distKm)],
              ['인증 반경', '50m'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[14px] font-medium text-sub">{k}</p>
                <p className="mt-1 text-[17px] font-extrabold">{v}</p>
              </div>
            ))}
          </Card>

          {/* 내 인증 */}
          <Card className="p-4">
            {rec ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-forest">인증 완료 · {orderOf(records, id)}번째 완등</p>
                  <p className="mt-0.5 text-[15px] text-sub">
                    {fmtDate(rec.at)} · 정상석 {rec.distM}m 거리에서 촬영
                  </p>
                </div>
                <button onClick={() => push({ name: 'card', id })} className="flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-[15px] font-bold text-white">
                  <Share2 size={17} /> 인증카드
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Osam pose="ok" size={64} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold">아직 스탬프가 없어요</p>
                  <p className="mt-0.5 text-[15px] text-sub">{m.canCertify ? '정상석 50m 이내에서 인증사진을 찍으면 스탬프를 받아요.' : '인증지점 좌표 등록 후 인증할 수 있어요.'}</p>
                </div>
              </div>
            )}
          </Card>

          {/* 소개 */}
          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">산 소개</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-sub">
              {m.title}
              {m.hanja ? `(${m.hanja})` : ''}은(는) {m.regionLabel}에 있는 해발 {m.height}m의 봉우리로, {m.ridge ?? '가야수도'} 줄기에 속합니다. 2020년 김천시가 지정한 「김천 100명산」입니다.
            </p>
            {m.border && <p className="mt-2 text-[15px] leading-relaxed text-sub">{m.border}</p>}
            <dl className="mt-3 space-y-1.5 text-[15px]">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-semibold text-mute">소재지</dt>
                <dd className="font-medium">{m.regionLabel}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-semibold text-mute">정상 좌표</dt>
                <dd className="font-medium">{m.lat ? `${m.lat.toFixed(5)}, ${m.lng!.toFixed(5)}` : '등록 예정'}</dd>
              </div>
            </dl>
          </Card>

          {/* 등산코스 */}
          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">등산코스</h2>
            <ul className="mt-3 space-y-3">
              {coursesOf(m).map((c) => (
                <li key={c.name} className="rounded-xl bg-bg p-3.5">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-[16px] font-bold">{c.name}</p>
                    <span className={`rounded-md px-2 py-0.5 text-[14px] font-bold ${c.level === '쉬움' ? 'bg-forest-50 text-forest' : c.level === '보통' ? 'bg-[#FBF1DC] text-[#94681A]' : 'bg-accent-50 text-[#C24E22]'}`}>{c.level}</span>
                  </div>
                  <p className="mt-1 text-[14px] leading-snug text-sub">{c.path}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-semibold">
                    <span className="flex items-center gap-1">
                      <Footprints size={15} className="text-mute" /> {c.start}
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler size={15} className="text-mute" /> 편도 {c.km}km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={15} className="text-mute" /> 약 {c.min >= 60 ? `${Math.floor(c.min / 60)}시간 ${c.min % 60 ? `${c.min % 60}분` : ''}` : `${c.min}분`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* 교통 · 주차 */}
          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">교통 · 주차</h2>
            <dl className="mt-3 space-y-3 text-[15px]">
              {[
                [Car, '자가용', transportOf(m).car],
                [Bus, '대중교통', transportOf(m).bus],
                [ParkingCircle, '주차', parkingOf(m)],
              ].map(([I, k, v]) => {
                const Icon = I as typeof Car
                return (
                  <div key={k as string} className="flex gap-3">
                    <dt className="flex w-[84px] shrink-0 items-center gap-1.5 font-semibold text-sub">
                      <Icon size={17} /> {k as string}
                    </dt>
                    <dd className="flex-1 leading-snug font-medium">{v as string}</dd>
                  </div>
                )
              })}
            </dl>
          </Card>

          {/* 지도 + 주변 관광 */}
          {m.lat != null && (
            <Card className="overflow-hidden">
              <MapView className="h-56" center={[m.lat, m.lng!]} zoom={12} focus={m.id} places={near.map((n) => n.place)} onPick={(pid) => pid !== id && push({ name: 'mountain', id: pid })} />
              <div className="p-4">
                <h2 className="text-[17px] font-extrabold">하산 후 들르기 좋은 곳</h2>
                <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 py-1 text-[15px]">
                  <Chip active={!ptype} onClick={() => setPtype(undefined)}>
                    전체
                  </Chip>
                  {(['tour', 'food', 'stay'] as const).map((t) => (
                    <Chip key={t} active={ptype === t} onClick={() => setPtype(t)}>
                      {placeTypeLabel[t]}
                    </Chip>
                  ))}
                </div>
                <ul className="mt-2 divide-y divide-line">
                  {near.map(({ place, km }) => (
                    <li key={place.id}>
                      <button onClick={() => push({ name: 'place', id: place.id })} className="flex w-full items-center gap-3 py-3 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] font-bold">{place.name}</p>
                          <p className="truncate text-[14px] text-sub">
                            {placeTypeLabel[place.type]} · {place.category}
                          </p>
                        </div>
                        <span className="text-[14px] font-bold text-sub">{fmtKm(km)}</span>
                        <ChevronRight size={18} className="text-mute" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 방명록 */}
          <Card onClick={() => push({ name: 'guestbook', mountainId: id })} className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
              <MessageSquareText size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold">이 산 방명록</span>
              <span className="block text-[14px] text-sub">{posts.filter((x) => x.mountainId === id).length}개의 후기 · 다녀온 이야기를 남겨보세요</span>
            </span>
            <ChevronRight size={19} className="text-mute" />
          </Card>

          {/* 연계 미션 */}
          {relMissions.map((mi) => {
            const p = missionProgress(mi, records, visits)
            return (
              <Card key={mi.id} onClick={() => push({ name: 'mission', id: mi.id })} className="flex items-center gap-3 p-4">
                <span className="shrink-0">
                  <MissionStamp mission={mi} earned={p.done} size={46} date={p.doneAt} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-accent">연계 관광 미션</p>
                  <p className="truncate text-[16px] font-extrabold">{mi.title}</p>
                  <p className="truncate text-[14px] text-sub">달성 시 「{mi.badge}」 배지</p>
                </div>
                <span className="text-[15px] font-bold text-sub">{p.done ? '완료' : `${p.steps}/${p.total}`}</span>
              </Card>
            )
          })}

          {m.source && (
            <p className="flex gap-1.5 px-1 pb-4 text-[14px] leading-relaxed text-mute">
              <Info size={16} className="mt-0.5 shrink-0" /> 자료: 매일신문 「김천의 100산 100설」 · 좌표 오픈스트리트맵
            </p>
          )}
        </div>
      </Scroll>
      {!rec && (
        <BottomBar>
          <PrimaryButton accent disabled={!m.canCertify} onClick={() => push({ name: 'certify', id })}>
            <Camera size={21} /> {m.canCertify ? '정상 인증하기' : '인증지점 등록 예정'}
          </PrimaryButton>
        </BottomBar>
      )}
    </Page>
  )
}
