import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, GraduationCap, Lock, Search, User } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useBookings, useStore } from '../../store'
import type { Member } from '../../data/types'
import { cx, fmtDate, maskName, won } from '../../lib/format'
import type { Booking } from '../../data/types'

export default function Login() {
  const [sp] = useSearchParams()
  const next = sp.get('next')
  const nav = useNavigate()
  const login = useStore(s => s.login)
  const toast = useStore(s => s.toast)
  const pending = useStore(s => s.pendingBooking)
  const perfs = useStore(s => s.performances)
  const [tab, setTab] = useState<'member' | 'guest'>('member')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [save, setSave] = useState(false)
  const [err, setErr] = useState('')

  const done = (m: Member | null) => {
    if (!m) { setErr('아이디 또는 비밀번호가 일치하지 않습니다. (시연 계정: demo, teen, user3~user160)'); return }
    toast(`${m.name}님 환영합니다`)
    nav(next && next.startsWith('/site') ? next : '/site', { replace: true })
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim()) { setErr('아이디를 입력해주세요.'); document.getElementById('login-id')?.focus(); return }
    if (!pw) { setErr('비밀번호를 입력해주세요.'); document.getElementById('login-pw')?.focus(); return }
    done(login(id.trim()))
  }
  const pendingPerf = pending && perfs.find(p => p.id === pending.perfId)

  return (
    <>
      <PageHeader crumbs={['회원', '로그인']} title="로그인" />
      <div className="mx-auto max-w-md px-4 py-10">
        {pendingPerf && (
          <p className="mb-4 rounded-xl bg-sun-300/30 p-3 text-sm ring-1 ring-sun-400">
            로그인하시면 <b>&lt;{pendingPerf.title}&gt;</b> 예매를 선택하신 회차부터 바로 이어서 진행합니다.
          </p>
        )}
        <div role="tablist" className="grid grid-cols-2 rounded-xl bg-paper p-1">
          {([['member', '회원 로그인'], ['guest', '비회원 예매확인']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cx('rounded-lg py-2.5 text-sm font-bold', tab === k ? 'bg-white text-brand-600 shadow-sm' : 'text-muted')}>{l}</button>
          ))}
        </div>

        {tab === 'member' ? (
          <div className="mt-6">
            <form onSubmit={submit} noValidate className="space-y-3">
              <div>
                <label htmlFor="login-id" className="label">아이디</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                  <input id="login-id" className="input pl-9" value={id} onChange={e => { setId(e.target.value); setErr('') }} autoComplete="username" aria-invalid={!!err && !id} aria-describedby="login-err" />
                </div>
              </div>
              <div>
                <label htmlFor="login-pw" className="label">비밀번호</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                  <input id="login-pw" type="password" className="input pl-9" value={pw} onChange={e => { setPw(e.target.value); setErr('') }} autoComplete="current-password" aria-invalid={!!err && !pw} aria-describedby="login-err" />
                </div>
              </div>
              <p id="login-err" className="min-h-5 text-sm text-coral-500" aria-live="assertive">{err}</p>
              <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={save} onChange={e => setSave(e.target.checked)} />아이디 저장</label>
              <button className="btn-primary w-full py-3 text-base">로그인</button>
            </form>
            <div className="mt-3 flex justify-center gap-4 text-sm text-muted">
              <button className="link-u" onClick={() => toast('본인인증 후 아이디를 찾을 수 있습니다 (시연 생략)', 'warn')}>아이디 찾기</button>
              <span aria-hidden>|</span>
              <button className="link-u" onClick={() => toast('본인인증 후 비밀번호를 재설정할 수 있습니다 (시연 생략)', 'warn')}>비밀번호 찾기</button>
              <span aria-hidden>|</span>
              <Link to="/site/signup" className="font-semibold text-brand-600 link-u">회원가입</Link>
            </div>

            <div className="mt-8">
              <p className="relative text-center text-xs text-muted before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-line"><span className="relative bg-white px-3">간편 로그인</span></p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn bg-[#FEE500] text-[#191919] hover:brightness-95" onClick={() => done(login('demo'))}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#191919] text-[10px] font-black text-[#FEE500]" aria-hidden>K</span>카카오 로그인
                </button>
                <button className="btn bg-[#03C75A] text-white hover:brightness-95" onClick={() => done(login('demo'))}>
                  <span className="text-base font-black" aria-hidden>N</span>네이버 로그인
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
              <p className="text-xs font-bold text-brand-700">시연용 빠른 로그인</p>
              <div className="mt-3 grid gap-2">
                <button className="flex items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-line transition hover:ring-brand-500" onClick={() => done(login('demo'))}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white"><Crown size={18} /></span>
                  <span><b className="block text-sm">demo · 김시연</b><span className="text-xs text-muted">나무 멤버십 회원 · 선예매·20% 할인·쿠폰 3장</span></span>
                </button>
                <button className="flex items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-line transition hover:ring-brand-500" onClick={() => done(login('teen'))}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-mint-500 text-white"><GraduationCap size={18} /></span>
                  <span><b className="block text-sm">teen · 박하루</b><span className="text-xs text-muted">청소년 회원(만 15세) · 청소년 할인 자동 적용</span></span>
                </button>
              </div>
            </div>
          </div>
        ) : <GuestLookup />}
      </div>
    </>
  )
}

function GuestLookup() {
  const bookings = useBookings()
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const [no, setNo] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const [found, setFound] = useState<Booking | null>(null)
  const norm = (s: string) => s.replace(/\D/g, '')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setFound(null)
    if (!no.trim() || !phone.trim()) { setErr('예매번호와 휴대폰 번호를 모두 입력해주세요.'); return }
    const b = bookings.find(x => x.id.toUpperCase() === no.trim().toUpperCase() && norm(x.bookerPhone) === norm(phone))
    if (!b) { setErr('일치하는 예매 내역이 없습니다. 예매번호와 휴대폰 번호를 확인해주세요.'); return }
    setErr(''); setFound(b)
  }
  const p = found && perfs.find(x => x.id === found.perfId)
  const r = found && rounds.find(x => x.id === found.roundId)
  return (
    <div className="mt-6">
      <form onSubmit={submit} noValidate className="space-y-3">
        <div>
          <label htmlFor="g-no" className="label">예매번호</label>
          <input id="g-no" className="input font-mono" value={no} onChange={e => setNo(e.target.value)} placeholder="예: T26100100001" aria-describedby="g-err" />
        </div>
        <div>
          <label htmlFor="g-phone" className="label">예매 시 입력한 휴대폰 번호</label>
          <input id="g-phone" className="input" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" aria-describedby="g-err" />
        </div>
        <p id="g-err" className="min-h-5 text-sm text-coral-500" aria-live="assertive">{err}</p>
        <button className="btn-primary w-full py-3"><Search size={16} />예매 조회</button>
        <button type="button" className="w-full text-xs text-muted link-u" onClick={() => { setNo('T26100100001'); setPhone('010-1234-5678') }}>시연용 예시 입력</button>
      </form>
      {found && p && (
        <div className="mt-6 card p-5" aria-live="polite">
          <p className="text-xs text-muted">예매번호 <b className="font-mono text-ink">{found.id}</b> · <span className="chip bg-brand-50 text-brand-700">{found.status}</span></p>
          <p className="mt-2 text-lg font-extrabold">{p.title}</p>
          <p className="text-sm text-muted">{r ? `${fmtDate(r.date)} ${r.time}` : ''}</p>
          <p className="mt-2 text-sm">예매자 {maskName(found.bookerName)} · 좌석 {found.seats.filter(s => !s.cancelled).map(s => s.seatId).join(', ') || '-'}</p>
          <p className="mt-1 text-sm font-bold">결제금액 {won(found.total)}</p>
          <p className="mt-3 text-xs text-muted">비회원 예매의 취소는 고객센터(1600-6261)로 문의해주세요.</p>
        </div>
      )}
    </div>
  )
}
