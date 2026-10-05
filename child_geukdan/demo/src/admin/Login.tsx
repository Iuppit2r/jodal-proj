import { useState } from 'react'
import { KeyRound, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useStore } from '../store'
import { errMsg } from './ui'

/** 관리자 로그인 + 2차 인증 (보안 요구사항: 접속 IP 제한, OTP, 3개월 주기 비밀번호 변경) */
export default function Login() {
  const set = useStore(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [step, setStep] = useState<1 | 2>(1)
  const [id, setId] = useState('admin')
  const [pw, setPw] = useState('')
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState('')
  const [fails, setFails] = useState(0)

  const submit1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !pw) { setErr(errMsg('E-AU-101', '아이디와 비밀번호를 입력해 주세요')); return }
    if (id.trim() !== 'admin') {
      const f = fails + 1
      setFails(f)
      setErr(errMsg('E-AU-103', `등록되지 않은 관리자 계정입니다. (실패 ${f}/5회, 5회 실패 시 계정 잠금)`))
      return
    }
    setErr('')
    setStep(2)
  }
  const submit2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) { setErr(errMsg('E-AU-201', '인증번호 6자리를 입력해 주세요')); return }
    set({ adminId: 'ad1' })
    log('로그인(2차인증)', '관리자')
    toast('관리자 로그인 완료 — 최근 접속: 2026-10-05 09:01 (10.10.2.15)')
  }

  return (
    <div className="grid min-h-[calc(100vh-36px)] place-items-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><ShieldCheck /></div>
          <h1 className="text-xl font-extrabold">국립어린이청소년극단 통합관리시스템</h1>
          <p className="mt-1 text-sm text-white/70">TMS 티켓관리 · CMS 홈페이지 관리 · 유료회원 · CRM</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
            <span className={step === 1 ? 'text-brand-600' : 'text-muted'}>① 계정 확인</span>
            <span className="h-px flex-1 bg-line" />
            <span className={step === 2 ? 'text-brand-600' : 'text-muted'}>② 2차 인증(OTP)</span>
          </div>
          {step === 1 ? (
            <form onSubmit={submit1} className="space-y-3">
              <div>
                <label className="label" htmlFor="aid">관리자 ID</label>
                <input id="aid" className="input" value={id} onChange={e => setId(e.target.value)} autoComplete="username" aria-invalid={!!err && !id} />
              </div>
              <div>
                <label className="label" htmlFor="apw">비밀번호</label>
                <input id="apw" type="password" className="input" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" placeholder="시연: 아무 값이나 입력" aria-invalid={!!err && !pw} />
              </div>
              {err && <p className="text-xs font-medium text-coral-500" role="alert">{err}</p>}
              <button className="btn-primary w-full"><Lock size={15} />로그인</button>
              <p className="text-center text-[11px] text-muted">시연 계정: <b>admin</b> / 비밀번호 임의 입력</p>
            </form>
          ) : (
            <form onSubmit={submit2} className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                접속 IP <b>10.10.2.15</b> — 관리자 접속 허용 목록 확인 완료
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                <span>비밀번호 변경 후 <b>90일 경과</b> — 변경을 권고합니다. (보안정책: 3개월 주기 비밀번호 변경)</span>
              </div>
              <div>
                <label className="label" htmlFor="otp">OTP 인증번호</label>
                <input id="otp" inputMode="numeric" maxLength={6} className="input text-center text-lg tracking-[0.5em]" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus aria-invalid={!!err} />
                <p className="mt-1 text-[11px] text-muted">등록된 OTP 앱 또는 담당자 휴대폰(010-****-1234)으로 발송된 6자리 (시연: 아무 숫자 6자리)</p>
              </div>
              {err && <p className="text-xs font-medium text-coral-500" role="alert">{err}</p>}
              <div className="flex gap-2">
                <button type="button" className="btn-outline flex-1" onClick={() => { setStep(1); setErr('') }}>이전</button>
                <button className="btn-primary flex-[2]"><KeyRound size={15} />인증 후 접속</button>
              </div>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/60">본 시스템은 인가된 사용자만 접근할 수 있으며 모든 접속·처리 내역이 기록됩니다.</p>
      </div>
    </div>
  )
}
