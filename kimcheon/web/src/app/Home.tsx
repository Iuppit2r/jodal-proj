import { Bell, BookOpen, CalendarX, ChevronRight, CloudUpload, Heart, MapPinned, Share2, UserRound } from 'lucide-react'
import { byId, feed, fmtKm, missions, mountains, notices, placeById, round, TOTAL, tiers, user } from '../data'
import { missionProgress, nextTier, orderOf, recordsLatest, useApp } from '../store'
import { Card, Chip, Progress, Scroll, SectionTitle } from '../components/ui'
import { MissionStamp, Osam, MountainArt, TierBadge } from '../components/art'
import { CardImage } from '../components/CardImage'

function Ring({ value, size = 128 }: { value: number; size?: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
      <defs>
        <linearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F26B3A" />
          <stop offset="1" stopColor="#F26B3A" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${c * Math.max(value, 0.01)} ${c}`} style={{ transition: 'stroke-dasharray .8s ease' }} />
    </svg>
  )
}

export default function Home() {
  const { records, visits, push, setTab, notis, roundActive, pending, syncPending, showToast } = useApp()
  const unread = notis.filter((n) => !n.read).length
  const count = Object.keys(records).length
  const nt = nextTier(count)
  const prevCount = [...tiers].reverse().find((t) => count >= t.count)?.count ?? 0
  const latest = recordsLatest(records)
  const nearby = mountains
    .filter((m) => m.canCertify && !records[m.id])
    .sort((a, b) => a.distKm! - b.distKm!)
    .slice(0, 6)
  const activeMissions = missions
    .map((m) => ({ m, p: missionProgress(m, records, visits) }))
    .filter((x) => !x.p.done)
    .sort((a, b) => b.p.steps / b.p.total - a.p.steps / a.p.total)
    .slice(0, 2)
  const remain = nt ? nt.count - count : 0

  return (
    <div className="absolute inset-0 flex flex-col">
      <Scroll underStatus>
        {/* 헤더 + 여권 요약 */}
        <section className="topo relative overflow-hidden px-5 pt-[59px] pb-6 text-white">
          <div className="pointer-events-none absolute -top-16 -right-20 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="flex items-center gap-2">
            <img src="./brand/logo_gimcheon_white.png" alt="김천시" className="h-7" />
            <span className="flex-1" />
            <button onClick={() => push({ name: 'inbox' })} className="relative grid size-10 place-items-center rounded-full bg-white/10" aria-label="알림">
              <Bell size={21} />
              {unread > 0 && <i className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-accent ring-2 ring-brand" />}
            </button>
            <button onClick={() => push({ name: 'my' })} className="grid size-10 place-items-center rounded-full bg-white/10" aria-label="마이">
              <UserRound size={21} />
            </button>
          </div>
          <p className="mt-5 text-[15px] font-semibold text-white/80">{round.name}</p>
          <h1 className="mt-1 text-[24px] leading-snug font-extrabold tracking-tight">
            {user.nick}님의
            <br />
            김천 100산 산행여권
          </h1>
          <div className="mt-5 flex items-center gap-5">
            <div className="relative grid place-items-center">
              <Ring value={count / TOTAL} />
              <div className="absolute text-center">
                <p className="text-[30px] leading-none font-black">{count}</p>
                <p className="mt-1 text-[14px] font-semibold text-white/80">/ {TOTAL}산</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              {nt ? (
                <>
                  <p className="text-[15px] font-semibold text-white/80">다음 배지</p>
                  <p className="text-[19px] font-extrabold">
                    {nt.name} · {remain}산 남음
                  </p>
                  <Progress value={(count - prevCount) / (nt.count - prevCount)} className="mt-3 h-2.5 bg-white/15" />
                  <p className="mt-2 text-[14px] font-medium text-white/80">
                    {prevCount}산 → {nt.count}산
                  </p>
                </>
              ) : (
                <p className="text-[19px] font-extrabold">김천 100산 전체 완등!</p>
              )}
            </div>
          </div>
          {/* 오삼이 말풍선 */}
          <button onClick={() => setTab('passport')} className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left">
            <Osam pose={count ? 'best' : 'hello'} size={64} className="anim-bob shrink-0" />
            <p className="flex-1 text-[15px] leading-snug font-semibold">
              {count === 0
                ? '첫 산을 인증하고 산행여권 첫 스탬프를 받아보세요!'
                : remain === 1
                  ? `딱 1산만 더! ${nt!.name} 배지가 기다리고 있어요.`
                  : nt
                    ? `${remain}산 더 오르면 「${nt.name}」 배지를 드려요.`
                    : '모든 스탬프를 모았어요. 정말 대단해요!'}
            </p>
            <ChevronRight size={20} className="shrink-0 text-white/70" />
          </button>
        </section>

        {/* 상태 안내 */}
        {(!roundActive || pending.length > 0) && (
          <div className="space-y-2 bg-bg px-5 pt-5">
            {!roundActive && (
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                <CalendarX size={22} className="mt-0.5 shrink-0 text-sub" />
                <div>
                  <p className="text-[16px] font-bold">2026년 인증 기간이 끝났어요</p>
                  <p className="mt-0.5 text-[14px] text-sub">다음 회차는 2027.03.01에 시작해요. 기록과 여권은 계속 볼 수 있어요.</p>
                </div>
              </div>
            )}
            {pending.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-accent/40">
                <CloudUpload size={22} className="shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold">등록 대기 중인 인증 {pending.length}건</p>
                  <p className="text-[14px] text-sub">인터넷이 연결되면 자동으로 등록돼요</p>
                </div>
                <button
                  onClick={() => {
                    syncPending()
                    showToast('인증을 등록했어요')
                  }}
                  className="h-10 shrink-0 rounded-xl bg-accent px-3 text-[14px] font-bold text-white"
                >
                  지금 등록
                </button>
              </div>
            )}
          </div>
        )}

        {/* 특화 서비스 3종 */}
        <div className="-mt-1 grid grid-cols-3 gap-2.5 bg-bg px-5 pt-5">
          {[
            { label: '산행여권', sub: '모으는 재미', icon: BookOpen, on: () => setTab('passport') },
            { label: '인증카드', sub: '알리는 재미', icon: Share2, on: () => (latest[0] ? push({ name: 'card', id: latest[0].mountainId }) : push({ name: 'certify' })) },
            { label: '관광미션', sub: '머무는 재미', icon: MapPinned, on: () => setTab('missions') },
          ].map((f) => (
            <Card key={f.label} onClick={f.on} className="px-3 py-4">
              <span className="flex flex-col items-center text-center">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-white">
                  <f.icon size={22} />
                </span>
                <span className="mt-2.5 text-[16px] font-extrabold">{f.label}</span>
                <span className="mt-0.5 text-[14px] font-medium text-sub">{f.sub}</span>
              </span>
            </Card>
          ))}
        </div>

        {/* 획득 배지 */}
        <section className="mt-7">
          <SectionTitle title="완등 배지" action="전체보기" onAction={() => push({ name: 'badges' })} />
          <div className="no-scrollbar -my-2 flex gap-3 overflow-x-auto px-5 py-2">
            {tiers.map((t) => (
              <div key={t.id} className="flex w-[84px] shrink-0 flex-col items-center">
                <TierBadge t={t} earned={count >= t.count} size={72} />
                <p className={`mt-1 text-center text-[14px] font-bold ${count >= t.count ? 'text-ink' : 'text-mute'}`}>{t.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 가까운 미인증 산 */}
        <section className="mt-7">
          <SectionTitle title="가까운 미인증 산" action="전체" onAction={() => setTab('mountains')} />
          <div className="no-scrollbar -my-2 flex gap-3 overflow-x-auto px-5 py-2">
            {nearby.map((m) => (
              <Card key={m.id} onClick={() => push({ name: 'mountain', id: m.id })} className="w-[150px] shrink-0 overflow-hidden">
                <MountainArt m={m} className="h-[92px] w-full" />
                <div className="p-3">
                  <p className="truncate text-[16px] font-extrabold">{m.title}</p>
                  <p className="mt-0.5 text-[14px] font-medium text-sub">
                    {m.height}m · {fmtKm(m.distKm)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 진행 중인 관광 미션 */}
        <section className="mt-7">
          <SectionTitle title="진행 중인 관광 미션" action="전체" onAction={() => setTab('missions')} />
          <div className="space-y-2.5 px-5">
            {activeMissions.map(({ m, p }) => (
              <Card key={m.id} onClick={() => push({ name: 'mission', id: m.id })} className="flex items-center gap-3.5 p-4">
                <span className="shrink-0">
                  <MissionStamp mission={m} earned={false} size={46} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-extrabold">{m.title}</p>
                  <p className="mt-0.5 truncate text-[14px] font-medium text-sub">
                    {p.peaksOk ? `남은 미션: ${m.spots.map((s) => placeById(s).name).join(', ')} 방문` : `산 인증 ${p.peaksDone}/${m.need}`}
                  </p>
                  <Progress value={p.steps / p.total} className="mt-2 h-2" />
                </div>
                <span className="text-[15px] font-bold text-sub">
                  {p.steps}/{p.total}
                </span>
              </Card>
            ))}
          </div>
        </section>

        {/* 나의 최근 인증카드 */}
        {latest[0] && (
          <section className="mt-7">
            <SectionTitle title="나의 최근 인증카드" action="카드 만들기" onAction={() => push({ name: 'card', id: latest[0].mountainId })} />
            <div className="no-scrollbar -my-2 flex gap-3 overflow-x-auto px-5 py-2">
              {latest.slice(0, 4).map((r, i) => (
                <button key={r.mountainId} onClick={() => push({ name: 'card', id: r.mountainId })} className="w-[132px] shrink-0 overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(2,52,125,.1)]">
                  <CardImage input={{ m: byId(r.mountainId), rec: r, order: orderOf(records, r.mountainId), count: orderOf(records, r.mountainId), style: i % 3, nick: user.nick }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 산꾼 피드 */}
        <section className="mt-7">
          <SectionTitle title="김천 산꾼들의 이야기" action="방명록" onAction={() => push({ name: 'guestbook' })} />
          <div className="space-y-3 px-5">
            {feed.map((p, i) => {
              const m = byId(p.mountainId)
              return (
                <Card key={p.id} className="overflow-hidden">
                  <div className="flex gap-3 p-3">
                    <div className="w-[92px] shrink-0 overflow-hidden rounded-xl">
                      <CardImage input={{ m, rec: { mountainId: m.id, at: p.date.replace(/\./g, '-') + 'T11:00', distM: 10 }, order: [42, 17, 30][i], count: [42, 17, 30][i], style: p.cardStyle, nick: p.author }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-extrabold">{p.author}</p>
                        <p className="text-[15px] font-medium text-mute">{p.date}</p>
                      </div>
                      <p className="mt-1 line-clamp-3 text-[15px] leading-snug text-sub">{p.body}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[14px] font-semibold text-accent">
                        <Heart size={15} fill="currentColor" /> {p.likes}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* 공지 */}
        <section className="mt-7 pb-8">
          <SectionTitle title="공지사항" action="전체" onAction={() => push({ name: 'notices' })} />
          <div className="px-5">
            <Card className="divide-y divide-line">
              {notices.slice(0, 3).map((n) => (
                <button key={n.id} onClick={() => push({ name: 'notice', id: n.id })} className="flex w-full items-start gap-3 px-4 py-4 text-left">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-bold ${n.tag === '안전' ? 'text-accent' : 'text-brand'}`}>
                      {n.tag} · {n.date}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[15px] leading-snug font-semibold">{n.title}</p>
                  </div>
                  <ChevronRight size={18} className="mt-0.5 shrink-0 text-mute" />
                </button>
              ))}
            </Card>
          </div>
        </section>
      </Scroll>
    </div>
  )
}
