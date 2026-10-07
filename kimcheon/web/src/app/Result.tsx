import { BookOpen, ChevronRight, Share2, Sparkles } from 'lucide-react'
import { byId, fmtDate, fmtKm, missions, nearbyPlaces, placeTypeLabel, TOTAL, tiers, zoneById, type ZoneId } from '../data'
import { missionProgress, nextTier, useApp, type Route } from '../store'
import { Card, PrimaryButton, Scroll } from '../components/ui'
import { Osam, Medal, MissionStamp, Stamp, TierBadge } from '../components/art'

const CONFETTI = ['#F26B3A', '#E0A93B', '#1F4434', '#3E8A84', '#C7793A', '#2C4A6E']

export default function Result({ r }: { r: Extract<Route, { name: 'result' }> }) {
  const { records, visits, push, home, setTab } = useApp()
  const m = byId(r.id)
  const rec = records[r.id]
  const count = Object.keys(records).length
  const nt = nextTier(count)
  const near = nearbyPlaces(m, undefined, 3)
  const relMission = missions.find((mi) => mi.peaks.includes(m.id) && !missionProgress(mi, records, visits).done)
  const unlocked = [
    ...r.newTiers.map((id) => ({ kind: 'tier' as const, id })),
    ...r.newZones.map((id) => ({ kind: 'zone' as const, id })),
    ...r.newMissions.map((id) => ({ kind: 'mission' as const, id })),
  ]

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-paper anim-slide">
      {/* 축하 효과 */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {Array.from({ length: 36 }).map((_, i) => (
          <i
            key={i}
            className="absolute top-0 block h-3 w-2 rounded-sm"
            style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % 6], animation: `confetti ${1.6 + (i % 5) * 0.3}s ${(i % 7) * 0.12}s ease-in both` }}
          />
        ))}
      </div>
      <Scroll underStatus>
        <div className="px-5 pt-[70px] text-center">
          <p className="anim-rise text-[16px] font-bold text-accent">김천 100산 · {count}번째 완등</p>
          <h1 className="anim-rise mt-1 text-[28px] font-black tracking-tight">{m.title} 정상 인증 완료!</h1>
          <p className="anim-rise mt-1 text-[15px] font-medium text-sub">
            {fmtDate(rec.at)} · {m.summit} {m.height}m · 정상석 {rec.distM}m
          </p>
        </div>

        {/* 여권 페이지 + 스탬프 */}
        <div className="relative mx-5 mt-6 rounded-3xl border-2 border-dashed border-line bg-white/70 px-5 pt-5 pb-4">
          <p className="text-[14px] font-bold text-mute">디지털 산행여권 · {zoneById(m.zone).name}</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Osam pose="best" size={130} className="anim-bob" />
            <div className="anim-stamp" style={{ animationDelay: '.25s' }}>
              <Stamp m={m} date={rec.at} size={150} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-alt">
              <div className="bg-accent h-full rounded-full" style={{ width: `${(count / TOTAL) * 100}%` }} />
            </div>
            <span className="text-[15px] font-bold text-sub">
              {count}/{TOTAL}
            </span>
          </div>
          {nt && (
            <p className="mt-2 text-[15px] font-semibold text-sub">
              다음 배지 「{nt.name}」까지 {nt.count - count}산
            </p>
          )}
        </div>

        {/* 새로 받은 배지 */}
        {unlocked.length > 0 && (
          <div className="mx-5 mt-4 rounded-3xl bg-ink p-5 text-white">
            <p className="flex items-center gap-1.5 text-[16px] font-extrabold text-gold">
              <Sparkles size={18} /> 새 배지를 획득했어요
            </p>
            <div className="mt-3 space-y-3">
              {unlocked.map((u, i) => {
                const t = u.kind === 'tier' ? tiers.find((x) => x.id === u.id)! : null
                const z = u.kind === 'zone' ? zoneById(u.id as ZoneId) : null
                const mi = u.kind === 'mission' ? missions.find((x) => x.id === u.id)! : null
                return (
                  <div key={u.id} className="anim-pop flex items-center gap-3" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
                    {t ? <TierBadge t={t} earned size={60} /> : mi ? <MissionStamp mission={mi} earned size={52} /> : <Medal color={z!.color} label="" earned size={60} />}
                    <div>
                      <p className="text-[17px] font-extrabold">{t ? t.name : z ? `${z.name} 권역 완등` : mi!.badge}</p>
                      <p className="text-[14px] text-white/75">{t ? t.desc : z ? z.desc : mi!.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 관광 연계 추천 */}
        <div className="mt-6 px-5">
          <h2 className="text-[18px] font-extrabold">하산 후, 김천에 조금 더 머물러요</h2>
          {relMission && (
            <Card onClick={() => push({ name: 'mission', id: relMission.id })} className="mt-3 flex items-center gap-3 p-4 ring-2 ring-accent/40">
              <MissionStamp mission={relMission} earned={false} size={50} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-accent">미션 1단계 달성!</p>
                <p className="text-[16px] font-extrabold">{relMission.title}</p>
                <p className="text-[14px] text-sub">관광지 방문 시 「{relMission.badge}」 배지</p>
              </div>
              <ChevronRight size={20} className="text-mute" />
            </Card>
          )}
          <div className="mt-3 space-y-2">
            {near.map(({ place, km }) => (
              <Card key={place.id} onClick={() => push({ name: 'place', id: place.id })} className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-14 shrink-0 rounded-lg bg-alt py-1 text-center text-[14px] font-bold text-sub">{placeTypeLabel[place.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold">{place.name}</p>
                  <p className="truncate text-[14px] text-sub">{place.category}</p>
                </div>
                <span className="text-[14px] font-bold text-sub">{fmtKm(km)}</span>
              </Card>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </Scroll>
      <div className="shrink-0 space-y-2 border-t border-line bg-white px-5 pt-3 pb-[46px]">
        <PrimaryButton accent onClick={() => push({ name: 'card', id: m.id })}>
          <Share2 size={20} /> 완등 인증카드 만들기
        </PrimaryButton>
        <button
          onClick={() => {
            home()
            setTab('passport')
          }}
          className="flex h-12 w-full items-center justify-center gap-1.5 text-[16px] font-bold text-brand"
        >
          <BookOpen size={19} /> 산행여권에서 보기
        </button>
      </div>
    </div>
  )
}
