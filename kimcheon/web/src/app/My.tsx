import { Bell, ChevronRight, HelpCircle, Images, Megaphone, MessageSquareText, Settings } from 'lucide-react'
import { byId, fmtDate, missions, notices, rewards, TOTAL, user } from '../data'
import { applicationSteps, missionProgress, orderOf, recordsLatest, useApp } from '../store'
import { Card, Page, Progress, Scroll, SectionTitle, TopBar } from '../components/ui'
import { Osam } from '../components/art'
import { CardImage } from '../components/CardImage'

export default function My() {
  const { records, visits, application, push, logout } = useApp()
  const list = recordsLatest(records)
  const count = list.length
  const complete = count >= TOTAL
  const missionDone = missions.filter((m) => missionProgress(m, records, visits).done).length
  const totalHeight = list.reduce((s, r) => s + byId(r.mountainId).height, 0)

  const menus = [
    { label: '내 인증사진', sub: `${count}장`, icon: Images, to: () => push({ name: 'photos' }) },
    { label: '방명록', sub: '산행 후기', icon: MessageSquareText, to: () => push({ name: 'guestbook' }) },
    { label: '알림함', sub: '도착·미션 소식', icon: Bell, to: () => push({ name: 'inbox' }) },
    { label: '공지사항', sub: `새 소식 ${notices.length}건`, icon: Megaphone, to: () => push({ name: 'notices' }) },
    { label: '이용안내', sub: '자주 묻는 질문', icon: HelpCircle, to: () => push({ name: 'faq' }) },
    { label: '설정', sub: '알림·권한', icon: Settings, to: () => push({ name: 'settings' }) },
  ]

  return (
    <Page>
      <TopBar title="마이" />
      <Scroll>
        {/* 프로필 */}
        <div className="flex items-center gap-4 bg-white px-5 pt-2 pb-5">
          <div className="grid size-[76px] shrink-0 place-items-center rounded-full bg-paper">
            <Osam pose="hello" size={62} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-extrabold">{user.name}</p>
            <p className="text-[15px] text-sub">{user.nick}</p>
            <p className="text-[15px] text-sub">휴대폰 본인인증 완료 · 가입 {user.since}</p>
          </div>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-2 px-4 pt-4">
          {[
            ['완등', `${count}/${TOTAL}산`],
            ['누적 고도', `${totalHeight.toLocaleString()}m`],
            ['관광 스탬프', `${missionDone}개`],
          ].map(([k, v]) => (
            <Card key={k} className="px-2 py-4 text-center">
              <p className="text-[18px] font-black">{v}</p>
              <p className="mt-0.5 text-[14px] font-semibold text-sub">{k}</p>
            </Card>
          ))}
        </div>

        {/* 인증서 · 기념품 신청 */}
        <div className="px-4 pt-3">
          <button onClick={() => push({ name: 'reward' })} className="topo relative w-full overflow-hidden rounded-[22px] p-5 text-left text-white">
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-gold">완등 인증서 · 기념품</p>
                <p className="mt-1 text-[20px] leading-snug font-extrabold">
                  {application ? `신청 현황: ${applicationSteps[application.status]}` : complete ? '지금 신청할 수 있어요' : `완등까지 ${TOTAL - count}산 남았어요`}
                </p>
                <p className="mt-1 text-[15px] text-white/80">
                  {application ? `${fmtDate(application.submittedAt)} 신청 · ${rewards.find((r) => r.id === application.rewardId)!.name}` : '인증서 + 기념품 3종 중 1개 선택'}
                </p>
              </div>
              <Osam pose="plum" size={84} className="shrink-0" />
            </div>
            {!application && <Progress value={count / TOTAL} className="mt-4 h-2.5 bg-white/15" />}
            <span className="mt-4 flex h-12 items-center justify-center gap-1 rounded-xl bg-white text-[16px] font-bold text-brand">
              {application ? '신청 현황 보기' : complete ? '신청하기' : '신청 안내 보기'} <ChevronRight size={18} />
            </span>
          </button>
        </div>

        {/* 메뉴 */}
        <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
          {menus.map((mn) => (
            <Card key={mn.label} onClick={mn.to} className="flex items-center gap-3 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <mn.icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-bold">{mn.label}</span>
                <span className="block truncate text-[14px] text-sub">{mn.sub}</span>
              </span>
            </Card>
          ))}
        </div>

        {count > 0 && (
          <section className="mt-7">
            <SectionTitle title={`나의 인증카드 ${count}장`} />
            <div className="grid grid-cols-3 gap-2 px-4">
              {list.slice(0, 6).map((r, i) => (
                <button key={r.mountainId} onClick={() => push({ name: 'card', id: r.mountainId })} className="overflow-hidden rounded-xl">
                  <CardImage input={{ m: byId(r.mountainId), rec: r, order: orderOf(records, r.mountainId), count: orderOf(records, r.mountainId), style: i % 3, nick: user.nick }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {count > 0 && (
          <section className="mt-7">
            <SectionTitle title="완등 인증 기록" />
            <div className="px-4">
              <Card className="overflow-hidden">
                <table className="w-full text-[15px]">
                  <thead className="bg-alt text-sub">
                    <tr>
                      <th className="w-14 py-3 font-bold">번호</th>
                      <th className="py-3 text-left font-bold">산</th>
                      <th className="py-3 text-left font-bold">인증일</th>
                      <th className="py-3 pr-4 text-right font-bold">거리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...list].reverse().map((r, i) => {
                      const m = byId(r.mountainId)
                      return (
                        <tr key={r.mountainId} onClick={() => push({ name: 'mountain', id: m.id })} className="cursor-pointer">
                          <td className="py-3 text-center font-bold text-sub">{i + 1}</td>
                          <td className="py-3 font-bold">{m.title}</td>
                          <td className="py-3 text-sub">{fmtDate(r.at)}</td>
                          <td className="py-3 pr-4 text-right text-sub">{r.distM}m</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </section>
        )}

        <div className="mt-6 mb-10 flex items-center justify-center gap-1 text-[15px] font-semibold text-sub">
          <button onClick={() => push({ name: 'terms' })} className="px-3 py-3">
            약관 및 정책
          </button>
          <span className="text-line">|</span>
          <button onClick={logout} className="px-3 py-3">
            로그아웃
          </button>
          <span className="text-line">|</span>
          <button onClick={() => push({ name: 'withdraw' })} className="px-3 py-3">
            회원 탈퇴
          </button>
        </div>
      </Scroll>
    </Page>
  )
}
