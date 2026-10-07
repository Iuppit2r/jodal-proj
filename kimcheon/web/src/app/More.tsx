import { useEffect, useState } from 'react'
import { Award, Bell, Camera, Check, ChevronRight, Heart, ImagePlus, MapPin, Megaphone, MessageCircle, Mountain as MountainIcon, PenLine, ShieldCheck } from 'lucide-react'
import { byId, fmtDate, mountains, TOTAL } from '../data'
import { terms, type Noti } from '../data/extra'
import { orderOf, recordsLatest, useApp, type Route } from '../store'
import { BottomBar, Card, Chip, Page, PrimaryButton, Scroll, TopBar } from '../components/ui'
import { MountainArt, Osam } from '../components/art'

// ── 방명록 ───────────────────────────────────────────────
export function Guestbook({ mountainId }: { mountainId?: string }) {
  const { posts, push } = useApp()
  const [filter, setFilter] = useState(mountainId ?? '')
  const list = posts.filter((p) => !filter || p.mountainId === filter)
  const hot = [...new Set(posts.map((p) => p.mountainId))]
  return (
    <Page>
      <TopBar title="방명록" />
      <div className="shrink-0 bg-white px-5 pb-3">
        <p className="text-[15px] text-sub">산행 후기를 남기고 다른 산꾼들과 나눠요</p>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 py-1 text-[15px]">
          <Chip active={!filter} onClick={() => setFilter('')}>
            전체
          </Chip>
          {hot.map((id) => (
            <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
              {byId(id).title}
            </Chip>
          ))}
        </div>
      </div>
      <Scroll>
        <div className="space-y-3 px-4 pt-3 pb-28">
          {list.length === 0 && <Empty text="아직 이 산의 후기가 없어요. 첫 후기를 남겨보세요!" />}
          {list.map((p) => {
            const m = byId(p.mountainId)
            return (
              <Card key={p.id} onClick={() => push({ name: 'guestPost', id: p.id })} className="flex gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-brand">
                    {m.title} · {p.author}
                    {p.mine ? ' (나)' : ''}
                  </p>
                  <p className="mt-1 truncate text-[16px] font-bold">{p.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-sub">{p.body}</p>
                  <p className="mt-2 flex items-center gap-3 text-[14px] text-sub">
                    <span>{p.date}</span>
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {p.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={14} /> {p.comments}
                    </span>
                  </p>
                </div>
                {p.photo && (
                  <div className="size-[76px] shrink-0 overflow-hidden rounded-xl">
                    <MountainArt m={m} className="size-full" />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </Scroll>
      <button onClick={() => push({ name: 'guestWrite', mountainId: filter || undefined })} className="absolute right-5 bottom-[46px] z-10 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-[16px] font-bold text-white shadow-lg">
        <PenLine size={20} /> 후기 쓰기
      </button>
    </Page>
  )
}

export function GuestPostView({ id }: { id: string }) {
  const { posts, push } = useApp()
  const p = posts.find((x) => x.id === id)!
  const m = byId(p.mountainId)
  const [liked, setLiked] = useState(false)
  const comments = [
    { a: '이*영', t: '저도 다음 주에 가보려고요. 정보 감사합니다!', d: '2026.09.15' },
    { a: '오삼이', t: '안전 산행 응원해요! 정상 인증도 잊지 마세요 🐻', d: '2026.09.15', staff: true },
  ].slice(0, Math.max(1, Math.min(2, p.comments)))
  return (
    <Page className="bg-white">
      <TopBar title="방명록" />
      <Scroll>
        <article className="px-5 pt-1 pb-6">
          <button onClick={() => push({ name: 'mountain', id: m.id })} className="text-[15px] font-bold text-brand">
            {m.title} {m.height}m ›
          </button>
          <h1 className="mt-1 text-[21px] leading-snug font-extrabold">{p.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-sub">
            <ShieldCheck size={15} className="text-forest" /> {p.author} · 본인인증 회원 · {p.date}
          </p>
          {p.photo && (
            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl">
              <MountainArt m={m} className="size-full" />
            </div>
          )}
          <p className="mt-4 text-[16px] leading-[1.75] whitespace-pre-line">{p.body}</p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setLiked(!liked)} className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-bold ${liked ? 'bg-accent-50 text-accent' : 'bg-bg text-sub'}`}>
              <Heart size={17} fill={liked ? 'currentColor' : 'none'} /> 좋아요 {p.likes + (liked ? 1 : 0)}
            </button>
          </div>
        </article>
        <div className="border-t-8 border-bg px-5 py-5">
          <h2 className="text-[16px] font-extrabold">댓글 {comments.length}</h2>
          <ul className="mt-3 space-y-4">
            {comments.map((c) => (
              <li key={c.t}>
                <p className={`text-[14px] font-bold ${c.staff ? 'text-brand' : ''}`}>
                  {c.a}
                  {c.staff ? ' · 운영자' : ''} · {c.d}
                </p>
                <p className="mt-0.5 text-[15px] leading-relaxed text-sub">{c.t}</p>
              </li>
            ))}
          </ul>
        </div>
      </Scroll>
      <div className="shrink-0 border-t border-line bg-white px-4 pt-3 pb-[46px]">
        <div className="flex h-12 items-center rounded-full bg-bg px-4 text-[15px] text-mute">댓글을 남겨주세요 (본인인증 회원)</div>
      </div>
    </Page>
  )
}

export function GuestWrite({ mountainId }: { mountainId?: string }) {
  const { records, addPost, pop, showToast } = useApp()
  const mine = recordsLatest(records).map((r) => r.mountainId)
  const [mid, setMid] = useState(mountainId ?? mine[0] ?? mountains[0].id)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState(true)
  const ok = title.trim().length >= 2 && body.trim().length >= 10
  return (
    <Page className="bg-white">
      <TopBar title="후기 쓰기" />
      <Scroll>
        <div className="space-y-5 px-5 pt-1 pb-6">
          <div className="flex items-center gap-2 rounded-xl bg-forest-50 px-4 py-3 text-[14px] font-semibold text-forest">
            <ShieldCheck size={17} /> 본인인증 회원만 작성할 수 있어요 (홍*동)
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-bold">다녀온 산</span>
            <select value={mid} onChange={(e) => setMid(e.target.value)} className="h-12 w-full rounded-xl border border-line bg-white px-4 text-[16px]">
              {[...new Set([...mine, ...mountains.map((m) => m.id)])].map((id) => (
                <option key={id} value={id}>
                  {byId(id).title}
                  {mine.includes(id) ? ' (인증 완료)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-bold">제목</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 직지사 코스로 다녀왔어요" className="h-12 w-full rounded-xl border border-line px-4 text-[16px] outline-none focus:border-brand" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[15px] font-bold">내용</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="코스, 난이도, 주차, 주변 맛집 등 다른 산꾼에게 도움이 되는 이야기를 남겨주세요." className="w-full rounded-xl border border-line p-4 text-[16px] leading-relaxed outline-none focus:border-brand" />
            <span className="mt-1 block text-right text-[14px] text-sub">{body.length} / 1,000자</span>
          </label>
          <div>
            <span className="mb-1.5 block text-[15px] font-bold">사진</span>
            <div className="flex gap-2">
              {photo && (
                <div className="relative size-20 overflow-hidden rounded-xl">
                  <MountainArt m={byId(mid)} className="size-full" />
                  <button onClick={() => setPhoto(false)} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-[13px] text-white">
                    ✕
                  </button>
                </div>
              )}
              <button onClick={() => setPhoto(true)} className="grid size-20 place-items-center rounded-xl border border-dashed border-line text-sub">
                <ImagePlus size={24} />
              </button>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-sub">욕설·광고·개인정보가 포함된 글은 운영자가 숨길 수 있어요.</p>
        </div>
      </Scroll>
      <BottomBar>
        <PrimaryButton
          disabled={!ok}
          onClick={() => {
            addPost({ mountainId: mid, title, body, photo })
            pop()
            showToast('후기를 등록했어요')
          }}
        >
          {ok ? '등록하기' : '제목과 내용을 10자 이상 입력해 주세요'}
        </PrimaryButton>
      </BottomBar>
    </Page>
  )
}

// ── 알림함 ───────────────────────────────────────────────
const NOTI_ICON: Record<Noti['kind'], typeof Bell> = { 도착: MapPin, 미션: MountainIcon, 기념품: Award, 공지: Megaphone, 배지: Award }

export function Inbox() {
  const { notis, readNoti, readAll, push } = useApp()
  const groups = ['오늘', '이번 주', '이전'] as const
  return (
    <Page>
      <TopBar
        title="알림"
        right={
          <button onClick={readAll} className="px-3 text-[15px] font-bold text-brand">
            모두 읽음
          </button>
        }
      />
      <Scroll>
        <div className="px-4 pt-2 pb-8">
          {groups.map((g) => {
            const list = notis.filter((n) => n.group === g)
            if (!list.length) return null
            return (
              <section key={g} className="mb-5">
                <h2 className="px-1 pb-2 text-[15px] font-bold text-sub">{g}</h2>
                <Card className="divide-y divide-line">
                  {list.map((n) => {
                    const Icon = NOTI_ICON[n.kind]
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          readNoti(n.id)
                          if (n.to) push(n.to as Route)
                        }}
                        className="flex w-full items-start gap-3 px-4 py-4 text-left"
                      >
                        <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${n.read ? 'bg-alt text-sub' : 'bg-accent-50 text-accent'}`}>
                          <Icon size={20} />
                          {!n.read && <i className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-white" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[16px] leading-snug ${n.read ? 'font-semibold text-sub' : 'font-bold'}`}>{n.title}</span>
                          <span className="mt-0.5 block text-[14px] leading-snug text-sub">{n.body}</span>
                          <span className="mt-1 block text-[14px] text-mute">{n.when}</span>
                        </span>
                      </button>
                    )
                  })}
                </Card>
              </section>
            )
          })}
        </div>
      </Scroll>
    </Page>
  )
}

// ── 내 인증사진 ───────────────────────────────────────────
export function Photos() {
  const { records, push } = useApp()
  const list = recordsLatest(records)
  return (
    <Page>
      <TopBar title="내 인증사진" />
      <Scroll>
        <p className="px-5 pt-1 pb-3 text-[15px] text-sub">
          {list.length}장 · 앱 카메라로 촬영한 원본과 촬영 일시·위치가 함께 저장돼요
        </p>
        {list.length === 0 ? (
          <Empty text="아직 인증사진이 없어요. 첫 산에 올라 인증해 보세요!" />
        ) : (
          <div className="grid grid-cols-3 gap-1 px-1 pb-8">
            {list.map((r) => {
              const m = byId(r.mountainId)
              return (
                <button key={r.mountainId} onClick={() => push({ name: 'photo', id: r.mountainId })} className="relative aspect-square overflow-hidden">
                  {r.photo ? <img src={r.photo} alt="" className="size-full object-cover" /> : <MountainArt m={m} className="size-full" />}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-5 pb-1.5 text-left text-[13px] font-bold text-white">{m.title}</span>
                </button>
              )
            })}
          </div>
        )}
      </Scroll>
    </Page>
  )
}

export function PhotoView({ id }: { id: string }) {
  const { records, push } = useApp()
  const r = records[id]
  const m = byId(id)
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black text-white anim-slide">
      <div className="text-white">
        <TopBar title={m.title} dark />
      </div>
      <div className="grid min-h-0 flex-1 place-items-center">
        <div className="aspect-[3/4] w-full">{r.photo ? <img src={r.photo} alt="" className="size-full object-cover" /> : <MountainArt m={m} className="size-full" />}</div>
      </div>
      <div className="shrink-0 space-y-2 px-5 pt-4 pb-[46px]">
        <dl className="grid grid-cols-2 gap-y-2 text-[15px]">
          <dt className="text-white/70">촬영 일시</dt>
          <dd className="text-right font-semibold">
            {fmtDate(r.at)} {r.at.slice(11)}
          </dd>
          <dt className="text-white/70">촬영 위치</dt>
          <dd className="text-right font-semibold">{m.lat ? `${m.lat.toFixed(4)}, ${m.lng!.toFixed(4)}` : '-'}</dd>
          <dt className="text-white/70">정상석 거리</dt>
          <dd className="text-right font-semibold">
            {r.distM}m · {orderOf(records, id)}번째 완등
          </dd>
        </dl>
        <PrimaryButton accent className="mt-3" onClick={() => push({ name: 'card', id })}>
          <Camera size={19} /> 이 사진으로 인증카드 만들기
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── 약관 · 개인정보 처리방침 ───────────────────────────────
export function Terms({ tab: initial = 'service' }: { tab?: 'service' | 'privacy' | 'location' }) {
  const [tab, setTab] = useState(initial)
  const tabs = [
    ['service', '이용약관'],
    ['privacy', '개인정보 처리방침'],
    ['location', '위치정보 이용약관'],
  ] as const
  return (
    <Page className="bg-white">
      <TopBar title="약관 및 정책" />
      <div className="flex shrink-0 border-b border-line px-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-12 flex-1 border-b-[3px] text-[15px] font-bold ${tab === k ? 'border-brand text-brand' : 'border-transparent text-sub'}`}>
            {l}
          </button>
        ))}
      </div>
      <Scroll>
        <div className="space-y-5 px-5 pt-5 pb-10">
          {terms[tab].map(([h, b]) => (
            <section key={h}>
              <h2 className="text-[16px] font-extrabold">{h}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-sub">{b}</p>
            </section>
          ))}
          <p className="pt-2 text-[14px] text-sub">시행일 2026.03.01 · 김천시</p>
        </div>
      </Scroll>
    </Page>
  )
}

// ── 회원 탈퇴 ─────────────────────────────────────────────
export function Withdraw() {
  const { records, application, withdraw, push } = useApp()
  const [reason, setReason] = useState('')
  const [agree, setAgree] = useState(false)
  const count = Object.keys(records).length
  const reasons = ['산행을 더 이상 하지 않아요', '앱 사용이 불편해요', '알림이 너무 많아요', '개인정보가 걱정돼요', '기타']
  return (
    <Page className="bg-white">
      <TopBar title="회원 탈퇴" />
      <Scroll>
        <div className="px-5 pt-1 pb-6">
          <div className="flex items-end gap-3">
            <h1 className="flex-1 text-[22px] leading-snug font-extrabold">
              정말 떠나시나요?
              <br />
              탈퇴 전에 꼭 확인해 주세요
            </h1>
            <Osam pose="basic" size={84} />
          </div>
          <ul className="mt-5 space-y-2.5 rounded-2xl bg-bg p-4 text-[15px] leading-relaxed">
            <li>
              • 인증 기록 <b>{count}건</b>과 인증사진, 산행여권 스탬프·배지가 모두 삭제되며 복구할 수 없어요.
            </li>
            <li>• 같은 본인인증 정보로 30일 동안 다시 가입할 수 없어요.</li>
            {application && <li>• 진행 중인 기념품 신청은 지급 완료 후 탈퇴할 수 있어요.</li>}
            <li>• 방명록에 남긴 글은 삭제되지 않으니 먼저 지워 주세요.</li>
          </ul>
          <p className="mt-6 text-[16px] font-bold">탈퇴 이유 (선택)</p>
          <div className="mt-2 space-y-2">
            {reasons.map((r) => (
              <button key={r} onClick={() => setReason(r)} className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-[15px] font-semibold ring-1 ${reason === r ? 'bg-brand-50 text-brand ring-brand' : 'ring-line'}`}>
                <span className={`grid size-5 place-items-center rounded-full border-2 ${reason === r ? 'border-brand' : 'border-[#C9CCC6]'}`}>{reason === r && <i className="size-2.5 rounded-full bg-brand" />}</span>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => setAgree(!agree)} className="mt-5 flex w-full items-start gap-3 text-left">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 ${agree ? 'border-brand bg-brand text-white' : 'border-[#C9CCC6]'}`}>{agree && <Check size={15} strokeWidth={3} />}</span>
            <span className="text-[15px] leading-relaxed text-sub">위 내용을 모두 확인했으며, 기록 삭제에 동의합니다.</span>
          </button>
          <button onClick={() => push({ name: 'terms', tab: 'privacy' })} className="mt-4 flex items-center text-[14px] font-semibold text-sub underline underline-offset-4">
            개인정보 처리방침 보기 <ChevronRight size={15} />
          </button>
        </div>
      </Scroll>
      <BottomBar>
        <button disabled={!agree || !!application} onClick={withdraw} className="h-14 w-full rounded-2xl bg-[#B5402A] text-[17px] font-bold text-white disabled:bg-[#E3E2DC] disabled:text-sub">
          {application ? '기념품 지급 완료 후 탈퇴할 수 있어요' : '탈퇴하기'}
        </button>
      </BottomBar>
    </Page>
  )
}

// ── 푸시 알림 배너 (잠금화면/앱 위 알림) ─────────────────────
export function PushBanner() {
  const { pushMsg, hidePush, push } = useApp()
  useEffect(() => {
    if (!pushMsg) return
    const t = setTimeout(hidePush, 6000)
    return () => clearTimeout(t)
  }, [pushMsg, hidePush])
  if (!pushMsg) return null
  return (
    <button
      onClick={() => {
        hidePush()
        if (pushMsg.to) push(pushMsg.to)
      }}
      className="absolute inset-x-2.5 top-[52px] z-[90] flex items-start gap-3 rounded-[22px] bg-white/95 p-3.5 text-left shadow-[0_12px_32px_rgba(0,0,0,.25)] backdrop-blur"
      style={{ animation: 'drop .35s cubic-bezier(.2,.9,.3,1.1) both' }}
    >
      <img src="./brand/symbol_mark.png" alt="" className="size-10 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-line" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="flex-1 text-[14px] font-bold text-sub">김천 100산 · 지금</span>
        </span>
        <span className="mt-0.5 block text-[15px] leading-snug font-bold">{pushMsg.title}</span>
        <span className="mt-0.5 block text-[14px] leading-snug text-sub">{pushMsg.body}</span>
      </span>
    </button>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <Osam pose="basic" size={96} />
      <p className="mt-4 text-[15px] leading-relaxed text-sub">{text}</p>
    </div>
  )
}

export { TOTAL }
