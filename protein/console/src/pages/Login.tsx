import { useEffect, useState } from 'react'
import { AlertCircle, KeyRound, LogIn, ShieldCheck } from 'lucide-react'
import './Login.css'

/* 로그인 게이트. 로그인 방식(로컬 계정 / 기관 통합 인증)을 확인한 뒤 해당 폼을 보여준다. */

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'loading' | 'local'>('loading')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setMode('local'), 650)
    return () => clearTimeout(t)
  }, [])

  const submit = () => {
    if (!id.trim()) { setErr('아이디를 입력하세요.'); return }
    if (pw.length < 8) { setErr('비밀번호는 8자 이상이어야 합니다.'); return }
    setErr('')
    onLogin()
  }

  return (
    <div className="pg-login">
      <div className="pg-login-wrap">
        <div className="pg-login-top">
          <span className="brand-logo" role="img" aria-label="KRIBB 한국생명공학연구원" />
          <div className="sp" />
        </div>

        <div className="pg-login-card">
          <div>
            <div className="pg-login-svc">
              <b>RAPID</b>
              <span>단백질 설계 플랫폼</span>
            </div>
            <p className="pg-login-desc">
              국가바이오파운드리 통합 콘솔입니다. 기관 계정으로 접속하면 역할과 실행 권한이 자동으로 적용됩니다.
            </p>
          </div>

          {mode === 'loading' && (
            <div className="pg-login-load">
              <span className="pg-login-spin" />
              <span>로그인 방식을 확인하고 있습니다</span>
            </div>
          )}

          {mode === 'local' && (
            <>
              <form className="pg-login-form" onSubmit={e => { e.preventDefault(); submit() }}>
                <div className="field">
                  <label htmlFor="pg-login-id">아이디</label>
                  <input id="pg-login-id" className="input" autoComplete="username"
                    placeholder="hana.kim" value={id} onChange={e => setId(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pg-login-pw">비밀번호</label>
                  <input id="pg-login-pw" className="input" type="password" autoComplete="current-password"
                    placeholder="8자 이상" value={pw} onChange={e => setPw(e.target.value)} />
                  <span className="hint">비밀번호는 8자 이상으로 설정합니다.</span>
                </div>

                {err && (
                  <div className="pg-login-err" role="alert">
                    <AlertCircle size={15} />
                    <span>{err}</span>
                  </div>
                )}

                <button className="btn primary" type="submit"><LogIn size={14} />콘솔 접속</button>
              </form>

              <div className="pg-login-or"><i /><span>또는</span><i /></div>

              <button className="btn" onClick={onLogin}><ShieldCheck size={14} />KBF SSO로 계속하기</button>

              <p className="pg-login-note">
                KBF SSO 계정은 기관 통합 인증 페이지에서 관리합니다. 외부 계정으로 처음 접속하면 승인 대기 상태로 등록되며, 관리자 승인 후 실행 권한이 부여됩니다.
              </p>
            </>
          )}
        </div>

        <div className="pg-login-meta">
          <span><KeyRound size={13} /> 연결 서버 <span className="mono">/pipeline/api</span></span>
          <span>실행 식별자 접두어 <span className="mono">hanakim_20261006_0942</span></span>
        </div>
      </div>
    </div>
  )
}
