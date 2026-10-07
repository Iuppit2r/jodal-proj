import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Package, Store } from 'lucide-react'
import { faqs, fmtDate, notices, rewards, round, TOTAL, user } from '../data'
import { applicationSteps, useApp } from '../store'
import { BottomBar, Card, Page, PrimaryButton, Progress, Scroll, TopBar } from '../components/ui'
import { Osam } from '../components/art'

// ── 완등 인증서 · 기념품 신청 ───────────────────────────────
export function RewardApply() {
  const { records, application, completeAll, submitApplication, showToast } = useApp()
  const count = Object.keys(records).length
  const complete = count >= TOTAL
  const [rewardId, setRewardId] = useState('badge')
  const [method, setMethod] = useState<'delivery' | 'visit'>('delivery')
  const [phone, setPhone] = useState('010-1234-5678')
  const [address, setAddress] = useState('경상북도 김천시 교동 2길 15, 302호')
  const [agree, setAgree] = useState(false)
  const [receive, setReceive] = useState('2026-10-20')

  if (application) return <RewardStatus />

  return (
    <Page>
      <TopBar title="완등 인증서 · 기념품 신청" />
      <Scroll>
        {/* 신청 자격 */}
        <div className="bg-white px-5 pt-2 pb-6">
          <div className="flex items-end gap-4">
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[15px] font-bold text-accent">{round.name}</p>
              <h1 className="mt-1 text-[22px] leading-snug font-extrabold tracking-tight">
                {complete ? '100산 완등을 축하해요!' : `완등까지 ${TOTAL - count}산 남았어요`}
              </h1>
            </div>
            <Osam pose={complete ? 'love' : 'plum'} size={96} className="shrink-0" />
          </div>
          <div className="mt-4 rounded-2xl bg-bg p-4">
            <div className="flex items-center justify-between text-[15px] font-bold">
              <span>완등 현황</span>
              <span className={complete ? 'text-forest' : 'text-accent'}>
                {count} / {TOTAL}산
              </span>
            </div>
            <Progress value={count / TOTAL} done={complete} className="mt-2.5 h-2.5" />
            <p className="mt-2.5 text-[14px] leading-relaxed text-sub">
              신청 기간 {round.start} ~ {round.end} · 100개 봉우리를 모두 인증하면 1인 1회 신청할 수 있어요.
            </p>
          </div>
          {!complete && (
            <button onClick={completeAll} className="demo-only mt-3 h-11 w-full rounded-xl border border-dashed border-line text-[15px] font-semibold text-sub">
              시연용: 전체 완등 상태로 보기
            </button>
          )}
        </div>

        {/* 기념품 선택 */}
        <section className="px-4 pt-6">
          <h2 className="px-1 text-[17px] font-extrabold">기념품 선택</h2>
          <p className="mt-0.5 px-1 text-[14px] text-sub">인증서는 모든 완등자에게 함께 드리고, 기념품 1개를 고를 수 있어요.</p>
          <div className="mt-3 space-y-2">
            {rewards.map((r, i) => {
              const on = rewardId === r.id
              return (
                <button
                  key={r.id}
                  disabled={!r.enabled}
                  onClick={() => setRewardId(r.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-2 transition ${on ? 'ring-brand' : 'ring-transparent'} disabled:opacity-55`}
                >
                  <span className="w-6 shrink-0 text-center text-[15px] font-bold text-mute">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold">{r.name}</p>
                    <p className="mt-0.5 text-[14px] text-sub">{r.desc}</p>
                    <p className={`mt-1 text-[14px] font-semibold ${r.enabled ? 'text-forest' : 'text-accent'}`}>{r.enabled ? `남은 수량 ${r.stock}개` : '신청 마감'}</p>
                  </div>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-brand bg-brand text-white' : 'border-line'}`}>{on && <Check size={15} strokeWidth={3} />}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 받는 분 정보 */}
        <section className="px-4 pt-7 pb-8">
          <h2 className="px-1 text-[17px] font-extrabold">받는 분 정보</h2>
          <Card className="mt-3 space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2">
              <Field label="이름">
                <div className="flex h-12 items-center rounded-xl bg-bg px-4 text-[16px] text-sub">{user.name}</div>
              </Field>
              <Field label="생년월일">
                <div className="flex h-12 items-center rounded-xl bg-bg px-4 text-[16px] text-sub">1985.04.12</div>
              </Field>
            </div>
            <Field label="연락처">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 w-full rounded-xl bg-bg px-4 text-[16px] outline-none focus:ring-2 focus:ring-brand" />
            </Field>
            <Field label="수령 방법">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['delivery', '택배 수령', Package],
                    ['visit', '방문 수령', Store],
                  ] as const
                ).map(([k, l, I]) => (
                  <button key={k} onClick={() => setMethod(k)} className={`flex h-12 items-center justify-center gap-2 rounded-xl text-[16px] font-bold ring-2 ${method === k ? 'bg-brand-50 text-brand ring-brand' : 'bg-bg text-sub ring-transparent'}`}>
                    <I size={18} /> {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="수령 희망일">
              <input type="date" value={receive} min="2026-10-13" onChange={(e) => setReceive(e.target.value)} className="h-12 w-full rounded-xl bg-bg px-4 text-[16px] outline-none focus:ring-2 focus:ring-brand" />
            </Field>
            {method === 'delivery' ? (
              <Field label="주소">
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 w-full rounded-xl bg-bg px-4 text-[16px] outline-none focus:ring-2 focus:ring-brand" />
              </Field>
            ) : (
              <p className="rounded-xl bg-bg p-3.5 text-[15px] leading-relaxed text-sub">김천시청 산림녹지과 (김천시 시청1길 1) · 평일 09:00~18:00 · 신분증 지참</p>
            )}
          </Card>
          <button onClick={() => setAgree(!agree)} className="mt-4 flex w-full items-start gap-3 px-1 text-left">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 ${agree ? 'border-brand bg-brand text-white' : 'border-[#C9CCC6] bg-white'}`}>{agree && <Check size={15} strokeWidth={3} />}</span>
            <span className="text-[15px] leading-relaxed text-sub">기념품 발송을 위한 개인정보(이름·연락처·주소) 수집·이용에 동의합니다. 지급 완료 후 6개월 뒤 파기됩니다.</span>
          </button>
        </section>
      </Scroll>
      <BottomBar>
        <PrimaryButton
          disabled={!complete || !agree}
          onClick={() => {
            submitApplication({ rewardId, name: user.name, phone, method, address: method === 'delivery' ? address : '김천시청 산림녹지과 방문' })
            showToast('신청이 완료되었어요')
          }}
        >
          {complete ? (agree ? '신청하기' : '개인정보 수집에 동의해 주세요') : `${TOTAL - count}산 더 오르면 신청할 수 있어요`}
        </PrimaryButton>
      </BottomBar>
    </Page>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[15px] font-bold">{label}</p>
      {children}
    </div>
  )
}

function RewardStatus() {
  const { application } = useApp()
  const a = application!
  const reward = rewards.find((r) => r.id === a.rewardId)!
  const stepDates = [fmtDate(a.submittedAt), '2026.10.20 예정', '-']
  return (
    <Page>
      <TopBar title="신청 현황" />
      <Scroll>
        <div className="bg-white px-5 pt-2 pb-6 text-center">
          <div className="mx-auto w-fit">
            <Osam pose="love" size={110} />
          </div>
          <h1 className="mt-3 text-[22px] font-extrabold">{applicationSteps[a.status]}</h1>
          <p className="mt-1 text-[15px] text-sub">지급 준비가 끝나면 앱 알림과 문자로 알려드려요.</p>
        </div>

        <Card className="mx-4 mt-4 p-5">
          <h2 className="text-[17px] font-extrabold">진행 단계</h2>
          <ol className="mt-4">
            {applicationSteps.map((st, i) => {
              const done = i <= a.status
              return (
                <li key={st} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < applicationSteps.length - 1 && <i className={`absolute top-7 left-[13px] h-[calc(100%-24px)] w-0.5 ${i < a.status ? 'bg-forest' : 'bg-line'}`} />}
                  <span className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-[14px] font-bold ${done ? 'bg-forest text-white' : 'bg-alt text-mute'}`}>{done ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
                  <div className="pt-0.5">
                    <p className={`text-[16px] font-bold ${done ? '' : 'text-mute'}`}>{st}</p>
                    <p className="text-[14px] text-sub">{stepDates[i]}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        <Card className="mx-4 mt-3 mb-8 p-5">
          <h2 className="text-[17px] font-extrabold">신청 내용</h2>
          <dl className="mt-3 space-y-2.5 text-[15px]">
            {[
              ['신청일', fmtDate(a.submittedAt)],
              ['인증서', '김천 100산 완등 인증서'],
              ['기념품', reward.name],
              ['받는 분', `${a.name} · ${a.phone}`],
              ['수령 방법', a.method === 'delivery' ? '택배 수령' : '방문 수령'],
              ['수령 희망일', '2026.10.20'],
              ['주소', a.address],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-[72px] shrink-0 font-semibold text-mute">{k}</dt>
                <dd className="min-w-0 flex-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Scroll>
      {a.status < 2 && (
        <BottomBar>
          {a.status === 0 && (
            <button onClick={() => useApp.setState({ application: null })} className="mb-2 h-12 w-full rounded-xl bg-brand-50 text-[16px] font-bold text-brand">
              신청 내용 수정
            </button>
          )}
          <button onClick={() => useApp.setState({ application: { ...a, status: (a.status + 1) as 1 | 2 } })} className="demo-only h-12 w-full rounded-xl border border-dashed border-line text-[15px] font-semibold text-sub">
            시연용: 다음 단계로 진행
          </button>
        </BottomBar>
      )}
    </Page>
  )
}

// ── 공지사항 ──────────────────────────────────────────────
const tagColor = (t: string) => (t === '안전' ? 'text-accent' : 'text-brand')

export function NoticeList() {
  const push = useApp((s) => s.push)
  return (
    <Page>
      <TopBar title="공지사항" />
      <Scroll>
        <div className="px-4 pt-2 pb-8">
          <Card className="divide-y divide-line">
            {notices.map((n) => (
              <button key={n.id} onClick={() => push({ name: 'notice', id: n.id })} className="flex w-full items-start gap-3 px-4 py-4 text-left">
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-bold ${tagColor(n.tag)}`}>
                    {n.pinned ? '필독 · ' : ''}
                    {n.tag} · {n.date}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[16px] leading-snug font-semibold">{n.title}</p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-mute" />
              </button>
            ))}
          </Card>
        </div>
      </Scroll>
    </Page>
  )
}

export function NoticeDetail({ id }: { id: string }) {
  const n = notices.find((x) => x.id === id)!
  return (
    <Page className="bg-white">
      <TopBar title="공지사항" />
      <Scroll>
        <article className="px-5 pt-2 pb-10">
          <p className={`text-[15px] font-bold ${tagColor(n.tag)}`}>{n.tag}</p>
          <h1 className="mt-1.5 text-[21px] leading-snug font-extrabold tracking-tight">{n.title}</h1>
          <p className="mt-2 text-[14px] text-sub">
            {n.date} · 조회 {n.views.toLocaleString()}
          </p>
          <hr className="my-5 border-line" />
          <p className="text-[16px] leading-[1.75] whitespace-pre-line text-ink">{n.body}</p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-bg p-4">
            <Osam pose="notice" size={56} className="shrink-0" />
            <div className="text-[15px] leading-snug">
              <p className="font-bold">김천시청 산림녹지과</p>
              <p className="whitespace-nowrap text-sub">문의 054-420-6324</p>
            </div>
          </div>
        </article>
      </Scroll>
    </Page>
  )
}

// ── 이용안내 · 자주 묻는 질문 ──────────────────────────────
export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const steps = ['앱 설치 후 휴대폰 본인인증', '정상석 반경 50m에서 인증사진 촬영', '산행여권에 스탬프 적립 · 인증카드 공유', '100산 완등 후 인증서·기념품 신청']
  return (
    <Page>
      <TopBar title="이용안내 · 자주 묻는 질문" />
      <Scroll>
        <div className="px-4 pt-2 pb-8">
          <Card className="p-5">
            <h2 className="text-[17px] font-extrabold">완등 인증 이렇게 해요</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-[14px] font-bold text-white">{i + 1}</span>
                  <span className="text-[15px] font-semibold">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
          <h2 className="mt-6 px-1 text-[17px] font-extrabold">자주 묻는 질문</h2>
          <Card className="mt-3 divide-y divide-line">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start gap-3 px-4 py-4 text-left">
                  <span className="text-[16px] font-extrabold text-brand">문</span>
                  <span className="min-w-0 flex-1 text-[16px] leading-snug font-semibold">{f.q}</span>
                  <ChevronDown size={19} className={`mt-0.5 shrink-0 text-mute transition ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && (
                  <div className="flex gap-3 bg-bg px-4 py-4">
                    <span className="text-[16px] font-extrabold text-accent">답</span>
                    <p className="text-[15px] leading-relaxed text-sub">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      </Scroll>
    </Page>
  )
}

// ── 알림 · 위치 권한 설정 ─────────────────────────────────
export function Settings() {
  const { settings, toggleSetting } = useApp()
  const groups: [string, [string, string, string][]][] = [
    [
      '알림',
      [
        ['summit', '정상 도착 알림', '인증지점 50m 안에 들어오면 알려드려요'],
        ['mission', '관광 미션 알림', '근처 관광지와 진행 중인 미션을 알려드려요'],
        ['notice', '공지 · 안전 알림', '입산 통제, 등산로 정비 소식'],
        ['marketing', '이벤트 소식', '김천 관광 이벤트와 혜택 안내'],
      ],
    ],
    [
      '권한',
      [
        ['location', '위치 정보 사용', '정상 인증과 관광지 체크인에 필요해요'],
        ['camera', '카메라 사용', '정상 인증사진 촬영에 필요해요'],
      ],
    ],
  ]
  return (
    <Page>
      <TopBar title="알림 · 위치 권한 설정" />
      <Scroll>
        <div className="space-y-6 px-4 pt-2 pb-8">
          {groups.map(([g, items]) => (
            <section key={g}>
              <h2 className="px-1 text-[15px] font-bold text-sub">{g}</h2>
              <Card className="mt-2 divide-y divide-line">
                {items.map(([k, label, desc]) => (
                  <div key={k} className="flex items-center gap-3 px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold">{label}</p>
                      <p className="mt-0.5 text-[14px] text-sub">{desc}</p>
                    </div>
                    <button onClick={() => toggleSetting(k)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings[k] ? 'bg-forest' : 'bg-[#C9CCC6]'}`} aria-pressed={settings[k]}>
                      <i className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${settings[k] ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </Card>
            </section>
          ))}
          <section>
            <h2 className="px-1 text-[15px] font-bold text-sub">앱 정보</h2>
            <Card className="mt-2 divide-y divide-line">
              {[
                ['앱 버전', '1.0.0 (최신)'],
                ['운영 기관', '김천시청 산림녹지과'],
                ['문의 전화', '054-420-6324'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-4 text-[16px]">
                  <span className="font-semibold">{k}</span>
                  <span className="text-sub">{v}</span>
                </div>
              ))}
            </Card>
          </section>
        </div>
      </Scroll>
    </Page>
  )
}
