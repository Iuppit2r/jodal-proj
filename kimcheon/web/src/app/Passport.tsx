import { useState } from 'react'
import { missions, mountains, TOTAL, tiers, user, zones } from '../data'
import { missionProgress, useApp, zoneProgress } from '../store'
import { Card, Page, Progress, Scroll, TopBar } from '../components/ui'
import { EmptyStamp, MissionStamp, Osam, Medal, Stamp, TierBadge } from '../components/art'

type Seg = 'stamps' | 'badges'

export default function Passport({ asPage, initial = 'stamps' }: { asPage?: boolean; initial?: Seg }) {
  const [seg, setSeg] = useState<Seg>(initial)
  const body = <PassportBody seg={seg} setSeg={setSeg} asPage={asPage} />
  return asPage ? (
    <Page>
      <TopBar title="산행여권 · 배지" />
      {body}
    </Page>
  ) : (
    <div className="absolute inset-0 flex flex-col">{body}</div>
  )
}

function PassportBody({ seg, setSeg, asPage }: { seg: Seg; setSeg: (s: Seg) => void; asPage?: boolean }) {
  const { records, visits, push } = useApp()
  const count = Object.keys(records).length
  const zp = zoneProgress(records)
  const earnedTiers = tiers.filter((t) => count >= t.count).length
  const earnedZones = zones.filter((z) => zp[z.id].done >= zp[z.id].total).length
  const earnedMissions = missions.filter((m) => missionProgress(m, records, visits).done).length

  return (
    <Scroll underStatus={!asPage}>
      {/* 여권 표지 */}
      <div className={`topo relative overflow-hidden px-5 pb-6 text-white ${asPage ? 'pt-4' : 'pt-[59px]'}`}>
        <svg className="absolute -right-6 -bottom-6 opacity-15" width="220" height="160" viewBox="0 0 220 160">
          <path d="M0 160 L60 70 L95 110 L140 30 L220 160Z" fill="#fff" />
        </svg>
        <p className="text-[14px] font-bold text-gold">김천시 발행 · 2026년 회차</p>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight">김천 100산 디지털 산행여권</h1>
        <div className="mt-4 flex items-center gap-4">
          <div className="rounded-2xl bg-white/12 p-1.5">
            <Osam pose="basic" size={72} />
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-extrabold">
              {user.name} · {user.nick}
            </p>
            <p className="text-[15px] text-white/80">발급일 {user.since}</p>
            <p className="text-[15px] text-white/80">여권번호 제2026-04812호</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ['스탬프', `${count}/${TOTAL}`],
            ['완등 배지', `${earnedTiers + earnedZones}개`],
            ['관광 배지', `${earnedMissions}개`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/10 py-3">
              <p className="text-[20px] font-black">{v}</p>
              <p className="text-[14px] font-semibold text-white/80">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`sticky z-10 flex border-b border-line bg-white ${asPage ? 'top-0' : 'top-[47px]'}`}>
        {(
          [
            ['stamps', '스탬프'],
            ['badges', '배지'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setSeg(k)} className={`h-12 flex-1 text-[16px] font-bold ${seg === k ? 'border-b-[3px] border-brand text-brand' : 'text-mute'}`}>
            {l}
          </button>
        ))}
      </div>

      {seg === 'stamps' ? (
        <div className="bg-paper pb-8">
          {zones.map((z) => {
            const list = mountains.filter((m) => m.zone === z.id)
            const p = zp[z.id]
            return (
              <section key={z.id} className="px-4 pt-6">
                <div className="flex items-center gap-2 px-1">
                  <i className="h-5 w-1.5 rounded-full" style={{ background: z.color }} />
                  <h2 className="flex-1 text-[17px] font-extrabold">{z.name}</h2>
                  <span className="text-[15px] font-bold text-sub">
                    {p.done}/{p.total}
                  </span>
                </div>
                <p className="mt-1 px-1 text-[14px] text-sub">{z.desc}</p>
                <Progress value={p.done / p.total} className="mx-1 mt-2 h-2" />
                <div className="mt-3 grid grid-cols-3 gap-y-2 rounded-2xl border border-dashed border-line bg-white/60 p-2">
                  {list.map((m) => {
                    const rec = records[m.id]
                    return (
                      <button key={m.id} onClick={() => push({ name: 'mountain', id: m.id })} className="grid place-items-center">
                        {rec ? <Stamp m={m} date={rec.at} size={96} /> : <EmptyStamp m={m} size={96} />}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
          <section className="px-4 pt-8">
            <div className="flex items-center gap-2 px-1">
              <i className="h-5 w-1.5 rounded-full bg-accent" />
              <h2 className="flex-1 text-[17px] font-extrabold">관광 스탬프</h2>
              <span className="text-[15px] font-bold text-sub">
                {earnedMissions}/{missions.length}
              </span>
            </div>
            <p className="mt-1 px-1 text-[14px] text-sub">산 인증 후 주변 관광지를 방문하면 찍히는 스탬프</p>
            <div className="mt-3 grid grid-cols-3 gap-y-3 rounded-2xl border border-dashed border-line bg-white/60 px-2 py-4">
              {missions.map((m) => {
                const p = missionProgress(m, records, visits)
                return (
                  <button key={m.id} onClick={() => push({ name: 'mission', id: m.id })} className="grid place-items-center">
                    <MissionStamp mission={m} earned={p.done} size={78} date={p.doneAt} />
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4 p-4 pb-8">
          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">단계별 완등 배지</h2>
            <div className="mt-3 space-y-3">
              {tiers.map((t) => {
                const ok = count >= t.count
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <TierBadge t={t} earned={ok} size={58} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[16px] font-extrabold ${ok ? '' : 'text-sub'}`}>{t.name}</p>
                      <p className="text-[14px] text-sub">{t.desc}</p>
                      {!ok && <Progress value={count / t.count} className="mt-1.5 h-1.5" />}
                    </div>
                    <span className={`text-[15px] font-bold ${ok ? 'text-forest' : 'text-sub'}`}>{ok ? '획득' : `${count}/${t.count}`}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">산줄기 권역 배지</h2>
            <p className="mt-0.5 text-[14px] text-sub">권역 안의 산을 모두 완등하면 받을 수 있어요</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {zones.map((z) => {
                const p = zp[z.id]
                const ok = p.done >= p.total
                return (
                  <div key={z.id} className="flex flex-col items-center text-center">
                    <Medal color={z.color} label={z.name} earned={ok} size={64} />
                    <p className="mt-1 text-[15px] font-bold">{z.name}</p>
                    <p className="text-[14px] font-semibold text-sub">
                      {p.done}/{p.total}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-[17px] font-extrabold">관광 연계 배지</h2>
            <p className="mt-0.5 text-[14px] text-sub">산 인증 + 주변 관광지 방문으로 받는 배지</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {missions.map((m) => {
                const p = missionProgress(m, records, visits)
                return (
                  <button key={m.id} onClick={() => push({ name: 'mission', id: m.id })} className="flex flex-col items-center text-center">
                    <MissionStamp mission={m} earned={p.done} size={66} date={p.doneAt} />
                    <p className="mt-1 text-[15px] leading-tight font-bold">{m.badge}</p>
                    <p className="text-[14px] font-semibold text-sub">{p.done ? '획득' : `${p.steps}/${p.total}`}</p>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </Scroll>
  )
}
