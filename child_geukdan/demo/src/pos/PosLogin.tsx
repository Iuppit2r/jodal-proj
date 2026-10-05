import { useState, type FormEvent } from 'react'
import { Monitor, Wallet } from 'lucide-react'
import { nowStr } from '../store'
import { cx, won } from '../lib/format'
import { STAFF, usePos, type PosWindow } from './lib'

/** 현장 사용자 로그인 → 개점(시재금 입력) */
export default function PosLogin() {
  const openSession = usePos(s => s.openSession)
  const [step, setStep] = useState<'login' | 'open'>('login')
  const [win, setWin] = useState<PosWindow>('매표소 1')
  const [id, setId] = useState('box01')
  const [pw, setPw] = useState('')
  const [float, setFloat] = useState(200000)
  const [err, setErr] = useState('')

  const login = (e: FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !pw) return setErr('ID와 비밀번호를 입력하세요.')
    setErr('')
    setStep('open')
  }
  const open = (e: FormEvent) => {
    e.preventDefault()
    openSession({ window: win, staffId: id.trim(), staffName: STAFF[id.trim()] ?? id.trim(), float, openedAt: nowStr() })
  }

  return (
    <div className="grid h-[calc(100vh-36px)] place-items-center bg-ink p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-brand-700 px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/70"><Monitor size={14} /> BOX OFFICE POS</div>
          <div className="mt-1 text-xl font-extrabold">국립어린이청소년극단 현장판매</div>
          <div className="text-sm text-white/70">현장결제 · 발권 · 검표 (SFR-TC-003 / 010)</div>
        </div>
        {step === 'login' ? (
          <form className="space-y-4 p-6" onSubmit={login}>
            <div>
              <span className="label">창구</span>
              <div className="grid grid-cols-2 gap-2">
                {(['매표소 1', '매표소 2'] as PosWindow[]).map(w => (
                  <button type="button" key={w} onClick={() => setWin(w)}
                    className={cx('min-h-14 rounded-xl border-2 text-base font-bold', win === w ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line')}>{w}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="pos-id">근무자 ID</label>
              <input id="pos-id" className="input min-h-12 text-base" value={id} onChange={e => setId(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="label" htmlFor="pos-pw">비밀번호</label>
              <input id="pos-pw" type="password" className="input min-h-12 text-base" value={pw} onChange={e => setPw(e.target.value)} autoFocus autoComplete="current-password" placeholder="시연: 아무 값이나 입력" />
            </div>
            {err && <p className="text-sm font-bold text-coral-500" role="alert">{err}</p>}
            <button className="btn-primary min-h-14 w-full text-base">로그인</button>
            <p className="text-center text-xs text-muted">현장 사용자 계정은 관리자 &gt; 권한관리에서 발급 · 접속 IP 제한 적용</p>
          </form>
        ) : (
          <form className="space-y-4 p-6" onSubmit={open}>
            <div className="rounded-xl bg-paper p-3 text-sm">
              <b>{win}</b> · 근무자 <b>{STAFF[id.trim()] ?? id}</b> ({id})
            </div>
            <div>
              <label className="label" htmlFor="pos-float"><Wallet size={14} className="mr-1 inline" />개점 시재금</label>
              <input id="pos-float" className="input min-h-14 text-right text-2xl font-black tabular-nums" inputMode="numeric" autoFocus
                value={float ? float.toLocaleString() : ''} onChange={e => setFloat(Number(e.target.value.replace(/\D/g, '')) || 0)} />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[100000, 200000, 300000, 500000].map(v => (
                  <button type="button" key={v} onClick={() => setFloat(v)} className={cx('btn min-h-11 border text-xs', float === v ? 'border-ink bg-ink text-white' : 'border-line')}>{v / 10000}만</button>
                ))}
              </div>
            </div>
            <button className="btn min-h-14 w-full bg-mint-500 text-base font-extrabold text-white hover:brightness-95">{won(float)}으로 개점</button>
            <button type="button" className="btn-ghost w-full" onClick={() => setStep('login')}>뒤로</button>
          </form>
        )}
      </div>
    </div>
  )
}
