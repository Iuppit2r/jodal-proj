import { useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { ChevronDown, Crown, Lock, MessageCircle, Trash2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import * as M from '../../data/mock'
import { memberTier, useMe, useStore, ageOf } from '../../store'
import { cx, fmtDate, won } from '../../lib/format'
import { PerfCard, Required, Stars } from '../parts/ui'
import { couponLabel } from '../parts/perf'
import { MyBookings } from '../parts/MyBookings'

const NAV = [
  { to: '/site/mypage', label: '예매 확인/취소', end: true },
  { to: '/site/mypage/package', label: '패키지 예매내역' },
  { to: '/site/mypage/coupons', label: '쿠폰/예매권' },
  { to: '/site/mypage/favorites', label: '나의 관심 공연' },
  { to: '/site/mypage/membership', label: '멤버십' },
  { to: '/site/mypage/inquiries', label: '1:1 문의 내역' },
  { to: '/site/mypage/reviews', label: '나의 관람후기' },
  { to: '/site/mypage/profile', label: '회원정보 수정' },
]

export default function MyPage() {
  const me = useMe()
  const tier = memberTier(me)
  if (!me) {
    return (
      <>
        <PageHeader crumbs={['마이페이지']} title="마이페이지" />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <Lock className="mx-auto text-brand-600" size={40} />
          <p className="mt-4 text-lg font-bold">로그인이 필요한 서비스입니다.</p>
          <p className="mt-1 text-sm text-muted">로그인 후 예매 내역·쿠폰·멤버십 정보를 확인할 수 있습니다.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/site/login?next=/site/mypage" className="btn-primary px-6">로그인</Link>
            <Link to="/site/login" className="btn-outline px-6">비회원 예매확인</Link>
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      <PageHeader crumbs={['마이페이지']} title="마이페이지" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-xl font-black">{me.name[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold">{me.name}님 <span className="text-sm font-medium text-white/70">({me.loginId})</span></p>
            <p className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
              {tier ? <span className="chip bg-sun-400 text-ink"><Crown size={12} className="mr-1" />{tier.name} 멤버십 ~{me.membership!.until}</span> : <Link to="/site/membership" className="chip bg-white/20 text-white hover:bg-white/30">멤버십 미가입 · 가입하기</Link>}
              {ageOf(me.birth) < 19 && <span className="chip bg-mint-500 text-white">청소년 할인 자동 적용</span>}
              <span className="chip bg-white/15 text-white">{me.type} 회원</span>
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <nav aria-label="마이페이지 메뉴" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex gap-1.5 md:flex-col md:gap-0.5">
              {NAV.map(n => (
                <li key={n.to} className="shrink-0">
                  <NavLink to={n.to} end={n.end}
                    className={({ isActive }) => cx('block rounded-full px-3.5 py-2 text-sm font-semibold transition md:rounded-lg md:px-4 md:py-2.5',
                      isActive ? 'bg-brand-600 text-white' : 'bg-paper text-muted hover:text-ink md:bg-transparent md:hover:bg-paper')}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0">
            <Routes>
              <Route index element={<MyBookings />} />
              <Route path="package" element={<MyPackages />} />
              <Route path="coupons" element={<MyCoupons />} />
              <Route path="favorites" element={<MyFavorites />} />
              <Route path="membership" element={<MyMembership />} />
              <Route path="inquiries" element={<MyInquiries />} />
              <Route path="reviews" element={<MyReviews />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="*" element={<MyBookings />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  )
}

function MyPackages() {
  const me = useMe()!
  const orders = useStore(s => s.packageOrders).filter(o => o.userId === me.id)
  const perfs = useStore(s => s.performances)
  return (
    <div>
      <h2 className="text-xl font-extrabold">패키지 예매내역</h2>
      <ul className="mt-4 space-y-3">
        {orders.map(o => {
          const pk = M.packages.find(p => p.id === o.packageId)
          return (
            <li key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{pk?.name}</p>
                <span className={cx('chip', o.status === '결제완료' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500')}>{o.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted">주문번호 <span className="font-mono">{o.id}</span> · {o.createdAt} · {won(o.total)}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {o.perfIds.map((pid, i) => <li key={pid} className="flex justify-between gap-2"><span>· {perfs.find(p => p.id === pid)?.title}</span><span className="font-mono text-xs text-muted">{o.bookingIds[i] ?? '-'}</span></li>)}
              </ul>
            </li>
          )
        })}
        {!orders.length && <li className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">패키지 예매 내역이 없습니다.<div className="mt-4"><Link to="/site/package" className="btn-primary btn-sm">패키지 보러 가기</Link></div></li>}
      </ul>
    </div>
  )
}

function MyCoupons() {
  const me = useMe()!
  const coupons = useStore(s => s.coupons).filter(c => c.ownerId === me.id)
  const [tab, setTab] = useState<'ok' | 'used' | 'exp'>('ok')
  const groups = {
    ok: coupons.filter(c => !c.usedBookingId && c.until >= M.TODAY),
    used: coupons.filter(c => c.usedBookingId),
    exp: coupons.filter(c => !c.usedBookingId && c.until < M.TODAY),
  }
  const list = groups[tab]
  return (
    <div>
      <h2 className="text-xl font-extrabold">쿠폰/예매권</h2>
      <div role="tablist" className="mt-4 flex gap-1 border-b border-line">
        {([['ok', '사용 가능'], ['used', '사용 완료'], ['exp', '기간 만료']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('-mb-px border-b-2 px-4 py-2.5 text-sm font-bold', tab === k ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted')}>{l} {groups[k].length}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {list.map(c => (
          <li key={c.id} className={cx('relative flex overflow-hidden rounded-2xl border border-line', tab !== 'ok' && 'opacity-60')}>
            <div className={cx('grid w-24 shrink-0 place-items-center p-3 text-center font-black', c.kind === '예매권' ? 'bg-brand-600 text-white' : 'bg-sun-400 text-ink')}>
              <span className="text-sm leading-tight">{couponLabel(c)}</span>
            </div>
            <div className="flex-1 border-l-2 border-dashed border-line p-4">
              <span className="chip bg-paper text-muted">{c.kind}</span>
              <p className="mt-1 font-bold">{c.name}</p>
              <p className="text-xs text-muted">{c.minPrice ? `${won(c.minPrice)} 이상 결제 시 · ` : ''}~{fmtDate(c.until, false)}</p>
              {c.usedBookingId && <p className="text-xs text-muted">사용 예매 {c.usedBookingId}</p>}
            </div>
          </li>
        ))}
        {!list.length && <li className="col-span-full rounded-2xl bg-paper p-10 text-center text-sm text-muted">해당하는 쿠폰이 없습니다.</li>}
      </ul>
    </div>
  )
}

function MyFavorites() {
  const me = useMe()!
  const perfs = useStore(s => s.performances).filter(p => me.favorites.includes(p.id) && p.status !== '임시저장')
  return (
    <div>
      <h2 className="text-xl font-extrabold">나의 관심 공연</h2>
      <p className="mt-1 text-sm text-muted">관심 공연의 티켓 오픈 시 알림톡으로 알려드립니다.</p>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
        {perfs.map(p => <PerfCard key={p.id} p={p} />)}
      </div>
      {!perfs.length && <p className="mt-4 rounded-2xl bg-paper p-10 text-center text-sm text-muted">관심 공연이 없습니다. 공연 카드의 하트를 눌러 등록하세요.</p>}
    </div>
  )
}

function MyMembership() {
  const me = useMe()!
  const tier = memberTier(me)
  return (
    <div>
      <h2 className="text-xl font-extrabold">멤버십</h2>
      {tier && me.membership ? (
        <div className="mt-4 rounded-2xl p-6 text-white" style={{ background: `linear-gradient(120deg, ${tier.color}, #121f55)` }}>
          <p className="flex items-center gap-2 text-2xl font-extrabold"><Crown className="text-sun-300" />{tier.name} 멤버십</p>
          <dl className="mt-3 grid grid-cols-[80px_1fr] gap-y-1 text-sm">
            <dt className="text-white/60">가입일</dt><dd>{fmtDate(me.membership.since)}</dd>
            <dt className="text-white/60">유효기간</dt><dd>~ {fmtDate(me.membership.until)}</dd>
            <dt className="text-white/60">자동연장</dt><dd>{me.membership.autoRenew ? '설정' : '해제'}</dd>
          </dl>
          <ul className="mt-4 space-y-1 text-sm text-white/90">{tier.benefits.map(b => <li key={b}>· {b}</li>)}</ul>
          <Link to="/site/membership" className="btn mt-5 bg-white text-ink">멤버십 관리</Link>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-paper p-8 text-center">
          <p className="font-bold">아직 멤버십 회원이 아닙니다.</p>
          <p className="mt-1 text-sm text-muted">선예매·최대 20% 할인·예매수수료 면제 혜택을 누려보세요.</p>
          <Link to="/site/membership" className="btn-accent mt-4">멤버십 가입하기</Link>
        </div>
      )}
    </div>
  )
}

function MyInquiries() {
  const me = useMe()!
  const list = useStore(s => s.inquiries).filter(q => q.userId === me.id)
  const [open, setOpen] = useState<string | null>(list[0]?.id ?? null)
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">1:1 문의 내역</h2>
        <Link to="/site/support/inquiry" className="btn-primary btn-sm"><MessageCircle size={14} />문의하기</Link>
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {list.map(q => (
          <li key={q.id}>
            <button className="flex w-full items-center gap-3 py-4 text-left" aria-expanded={open === q.id} onClick={() => setOpen(open === q.id ? null : q.id)}>
              <span className={cx('chip shrink-0', q.status === '답변완료' ? 'bg-mint-400/15 text-mint-500' : 'bg-amber-100 text-amber-800')}>{q.status}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">[{q.category}] {q.title}</span><span className="text-xs text-muted">{q.createdAt}</span></span>
              <ChevronDown size={16} className={cx('shrink-0 transition', open === q.id && 'rotate-180')} />
            </button>
            {open === q.id && (
              <div className="space-y-3 pb-4 text-sm">
                <p className="rounded-xl bg-paper p-3">{q.body}</p>
                {q.answer ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                    <p className="text-xs font-bold text-brand-700">답변 · {q.answeredAt}</p>
                    <p className="mt-1">{q.answer}</p>
                  </div>
                ) : <p className="text-xs text-muted">담당자가 확인 중입니다. 답변이 등록되면 이메일로 알려드립니다.</p>}
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="py-10 text-center text-sm text-muted">문의 내역이 없습니다.</li>}
      </ul>
    </div>
  )
}

function MyReviews() {
  const me = useMe()!
  const list = useStore(s => s.reviews).filter(r => r.userId === me.id)
  const perfs = useStore(s => s.performances)
  const del = useStore(s => s.deleteReview)
  const toast = useStore(s => s.toast)
  return (
    <div>
      <h2 className="text-xl font-extrabold">나의 관람후기</h2>
      <ul className="mt-4 space-y-3">
        {list.map(r => (
          <li key={r.id} className="card p-4">
            <div className="flex items-center gap-2 text-sm">
              <Link to={`/site/performances/${r.perfId}`} className="font-bold link-u">{perfs.find(p => p.id === r.perfId)?.title}</Link>
              <Stars value={r.rating} />
              <span className="text-xs text-muted">{r.createdAt}</span>
              <button className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-coral-500" onClick={() => { if (confirm('후기를 삭제할까요?')) { del(r.id); toast('후기가 삭제되었습니다') } }}><Trash2 size={13} />삭제</button>
            </div>
            <p className="mt-2 text-sm">{r.body}</p>
          </li>
        ))}
        {!list.length && <li className="rounded-2xl bg-paper p-10 text-center text-sm text-muted">작성한 관람후기가 없습니다. 공연 상세 &gt; 관람후기 탭에서 작성할 수 있습니다.</li>}
      </ul>
    </div>
  )
}

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

function MyProfile() {
  const me = useMe()!
  const update = useStore(s => s.updateMember)
  const logout = useStore(s => s.logout)
  const toast = useStore(s => s.toast)
  const nav = useNavigate()
  const [f, setF] = useState({ phone: me.phone, email: me.email, region: me.region, marketing: me.marketing })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(f.phone)) er.phone = '휴대폰 번호 형식이 올바르지 않습니다.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) er.email = '이메일 형식이 올바르지 않습니다.'
    setErrors(er)
    if (Object.keys(er).length) { document.getElementById(`pf-${Object.keys(er)[0]}`)?.focus(); return }
    update(me.id, f)
    toast('회원정보가 수정되었습니다')
  }
  const withdraw = () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n보유 쿠폰·예매권과 멤버십 혜택이 모두 소멸되며 복구할 수 없습니다.')) return
    update(me.id, { status: '탈퇴', membership: undefined })
    logout()
    toast('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다')
    nav('/site')
  }
  return (
    <div>
      <h2 className="text-xl font-extrabold">회원정보 수정</h2>
      <form onSubmit={save} noValidate className="mt-4 max-w-lg space-y-4">
        <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 rounded-xl bg-paper p-4 text-sm">
          <dt className="text-muted">아이디</dt><dd>{me.loginId}</dd>
          <dt className="text-muted">이름</dt><dd>{me.name}</dd>
          <dt className="text-muted">생년월일</dt><dd>{fmtDate(me.birth, false)} (만 {ageOf(me.birth)}세)</dd>
          <dt className="text-muted">회원유형</dt><dd>{me.type}{me.guardian ? ` · ${me.guardian}` : ''}</dd>
          <dt className="text-muted">가입일</dt><dd>{fmtDate(me.joinedAt, false)}</dd>
        </dl>
        <div>
          <label htmlFor="pf-phone" className="label">휴대폰 번호<Required /></label>
          <input id="pf-phone" className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} aria-invalid={!!errors.phone} aria-describedby="pe-phone" inputMode="tel" />
          <p id="pe-phone" className="mt-1 text-xs text-coral-500" aria-live="polite">{errors.phone}</p>
        </div>
        <div>
          <label htmlFor="pf-email" className="label">이메일<Required /></label>
          <input id="pf-email" type="email" className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} aria-invalid={!!errors.email} aria-describedby="pe-email" />
          <p id="pe-email" className="mt-1 text-xs text-coral-500" aria-live="polite">{errors.email}</p>
        </div>
        <div>
          <label htmlFor="pf-region" className="label">거주 지역</label>
          <select id="pf-region" className="input" value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.marketing} onChange={e => setF({ ...f, marketing: e.target.checked })} />마케팅 정보 수신 동의 (SMS·이메일·알림톡)</label>
        <div className="flex gap-2">
          <button className="btn-primary px-6">저장</button>
          <button type="button" className="btn-outline" onClick={() => toast('비밀번호 변경 메일이 발송되었습니다 (시연)')}>비밀번호 변경</button>
        </div>
      </form>
      <div className="mt-10 max-w-lg rounded-xl border border-coral-400/40 p-4">
        <p className="font-bold">회원 탈퇴</p>
        <p className="mt-1 text-xs text-muted">탈퇴 시 예매 내역은 전자상거래법에 따라 5년간 보관되며, 그 외 개인정보는 즉시 파기됩니다.</p>
        <button className="btn-danger btn-sm mt-3" onClick={withdraw}>회원 탈퇴</button>
      </div>
    </div>
  )
}
