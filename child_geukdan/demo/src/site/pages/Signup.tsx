import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Baby, Check, CheckCircle2, Gift, ShieldCheck, Smartphone, User, X } from 'lucide-react'
import PageHeader from '../PageHeader'
import Modal from '../../components/Modal'
import { ageOf, useStore } from '../../store'
import { cx } from '../../lib/format'
import { Required, Stepper } from '../parts/ui'

type Kind = '개인' | '어린이'
interface Cert { name: string; phone: string; birth: string; telco: string }

const TERMS = [
  { id: 't1', req: true, title: '이용약관 동의', body: '제1조(목적) 이 약관은 국립어린이청소년극단(이하 "극단")이 제공하는 홈페이지 및 티켓예매 서비스의 이용 조건과 절차를 규정합니다. …' },
  { id: 't2', req: true, title: '개인정보 수집·이용 동의', body: '수집 항목: 아이디, 비밀번호, 이름, 생년월일, 휴대폰번호, 이메일, 거주지역 / 목적: 회원관리, 예매·결제, 고지사항 전달 / 보유기간: 회원 탈퇴 시까지' },
  { id: 't3', req: true, title: '만 14세 미만 아동의 개인정보 처리 고지 (해당 시)', body: '만 14세 미만 아동의 경우 법정대리인의 동의를 받아 개인정보를 수집합니다.' },
  { id: 't4', req: false, title: '선택 정보(관심 장르·관람 이력) 수집 동의', body: '맞춤형 공연 추천을 위해 관심 장르와 관람 이력을 활용합니다.' },
  { id: 'mk', req: false, title: '마케팅 정보 수신 동의 (SMS·이메일·알림톡)', body: '신규 공연, 할인 이벤트, 멤버십 혜택 정보를 받아보실 수 있습니다.' },
]
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export default function Signup() {
  const nav = useNavigate()
  const members = useStore(s => s.members)
  const signup = useStore(s => s.signup)
  const toast = useStore(s => s.toast)
  const [step, setStep] = useState(0)
  const [kind, setKind] = useState<Kind>('개인')
  const [agree, setAgree] = useState<Record<string, boolean>>({})
  const [termErr, setTermErr] = useState('')
  const [cert, setCert] = useState<Cert | null>(null)
  const [pass, setPass] = useState(false)
  const [child, setChild] = useState({ name: '', birth: '' })
  const [f, setF] = useState({ loginId: '', pw: '', pw2: '', email: '', region: '서울' })
  const [idChecked, setIdChecked] = useState<'' | 'ok' | 'dup'>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ name: string; age: number } | null>(null)

  // 비밀번호 실시간 검증 (입력 후 0.3초 이내 표시)
  const [pwShown, setPwShown] = useState(f.pw)
  useEffect(() => { const t = setTimeout(() => setPwShown(f.pw), 300); return () => clearTimeout(t) }, [f.pw])
  const pwRules = [
    { ok: pwShown.length >= 8 && pwShown.length <= 16, t: '8~16자' },
    { ok: /[A-Za-z]/.test(pwShown), t: '영문 포함' },
    { ok: /\d/.test(pwShown), t: '숫자 포함' },
    { ok: /[^A-Za-z0-9]/.test(pwShown), t: '특수문자 포함' },
    { ok: !!pwShown && !pwShown.includes(f.loginId || '\u0000'), t: '아이디 미포함' },
  ]

  const reqOk = TERMS.filter(t => t.req && (t.id !== 't3' || kind === '어린이')).every(t => agree[t.id])
  const allOn = TERMS.every(t => agree[t.id])

  const finalName = kind === '어린이' ? child.name : cert?.name ?? ''
  const finalBirth = kind === '어린이' ? child.birth : cert?.birth ?? ''
  const age = finalBirth ? ageOf(finalBirth) : null

  const submitInfo = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!/^[a-z0-9]{4,12}$/.test(f.loginId)) er.loginId = '아이디는 영문 소문자·숫자 4~12자로 입력해주세요.'
    else if (idChecked !== 'ok') er.loginId = '아이디 중복확인을 해주세요.'
    if (!(f.pw.length >= 8 && f.pw.length <= 16 && /[A-Za-z]/.test(f.pw) && /\d/.test(f.pw) && /[^A-Za-z0-9]/.test(f.pw))) er.pw = '비밀번호 규칙을 확인해주세요.'
    if (f.pw !== f.pw2) er.pw2 = '비밀번호가 일치하지 않습니다.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) er.email = '이메일 형식이 올바르지 않습니다.'
    if (kind === '어린이') {
      if (!child.name.trim()) er.childName = '자녀 이름을 입력해주세요.'
      if (!child.birth) er.childBirth = '자녀 생년월일을 입력해주세요.'
      else if (ageOf(child.birth) >= 14) er.childBirth = '만 14세 이상은 개인 회원으로 가입해주세요.'
    }
    setErrors(er)
    const first = Object.keys(er)[0]
    if (first) { document.getElementById(`su-${first}`)?.focus(); return }
    const m = signup({
      loginId: f.loginId, name: finalName.trim(), birth: finalBirth, phone: cert!.phone, email: f.email,
      type: kind, guardian: kind === '어린이' ? `${cert!.name} (보호자 본인인증 완료)` : undefined,
      marketing: !!agree.mk, region: f.region,
    })
    toast(`${m.name}님, 회원가입을 환영합니다!`)
    setDone({ name: m.name, age: ageOf(m.birth) })
    setStep(4)
  }

  return (
    <>
      <PageHeader crumbs={['회원', '회원가입']} title="회원가입" desc="국립어린이청소년극단 회원이 되어 예매·멤버십·관람후기를 이용하세요." />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Stepper steps={['회원유형', '약관동의', '본인인증', '정보입력', '가입완료']} current={step} />

        {step === 0 && (
          <section className="mt-8" aria-labelledby="k-h">
            <h2 id="k-h" className="text-lg font-extrabold">회원 유형을 선택하세요</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="회원 유형">
              {([['개인', User, '만 14세 이상', '본인 휴대폰 인증으로 가입합니다. 만 19세 미만은 청소년 혜택이 자동 적용됩니다.'],
                ['어린이', Baby, '만 14세 미만', '보호자(법정대리인) 본인인증과 동의가 필요합니다.']] as const).map(([k, Icon, t, d]) => (
                <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                  className={cx('rounded-2xl border-2 p-5 text-left transition', kind === k ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-200')}>
                  <Icon className={kind === k ? 'text-brand-600' : 'text-muted'} size={28} />
                  <p className="mt-3 text-lg font-extrabold">{k} 회원 <span className="text-sm font-semibold text-muted">{t}</span></p>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </button>
              ))}
            </div>
            <button className="btn-primary mt-6 w-full py-3" onClick={() => setStep(1)}>다음</button>
            <p className="mt-4 text-center text-sm text-muted">이미 회원이신가요? <Link to="/site/login" className="font-semibold text-brand-600 link-u">로그인</Link></p>
          </section>
        )}

        {step === 1 && (
          <section className="mt-8" aria-labelledby="t-h">
            <h2 id="t-h" className="text-lg font-extrabold">약관 동의</h2>
            <label className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50 p-4 font-bold">
              <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={allOn} onChange={e => setAgree(Object.fromEntries(TERMS.map(t => [t.id, e.target.checked])))} />
              전체 동의 (선택 항목 포함)
            </label>
            <ul className="mt-3 space-y-2">
              {TERMS.filter(t => t.id !== 't3' || kind === '어린이').map(t => (
                <li key={t.id} className="rounded-xl border border-line p-3">
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!agree[t.id]} onChange={e => { setAgree(a => ({ ...a, [t.id]: e.target.checked })); setTermErr('') }} />
                    <span className={cx('chip', t.req ? 'bg-coral-400/15 text-coral-500' : 'bg-paper text-muted')}>{t.req ? '필수' : '선택'}</span>{t.title}
                  </label>
                  <details className="mt-1 pl-7 text-xs text-muted"><summary className="cursor-pointer">내용 보기</summary><p className="mt-1 rounded bg-paper p-2">{t.body}</p></details>
                </li>
              ))}
            </ul>
            <p className="mt-2 min-h-5 text-sm text-coral-500" aria-live="assertive">{termErr}</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-outline" onClick={() => setStep(0)}>이전</button>
              <button className="btn-primary flex-1 py-3" onClick={() => reqOk ? setStep(2) : setTermErr('필수 약관에 모두 동의해주세요.')}>다음</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 text-center" aria-labelledby="c-h">
            <ShieldCheck className="mx-auto text-brand-600" size={44} />
            <h2 id="c-h" className="mt-3 text-lg font-extrabold">{kind === '어린이' ? '보호자(법정대리인) 본인인증' : '휴대폰 본인인증'}</h2>
            <p className="mt-1 text-sm text-muted">{kind === '어린이' ? '만 14세 미만 회원은 보호자 명의 휴대폰으로 인증해야 합니다.' : '안전한 예매를 위해 본인 명의 휴대폰으로 인증해주세요.'}</p>
            {cert ? (
              <div className="mx-auto mt-5 max-w-sm rounded-xl bg-mint-400/10 p-4 text-left text-sm ring-1 ring-mint-400">
                <p className="flex items-center gap-1.5 font-bold text-mint-500"><CheckCircle2 size={16} />인증 완료</p>
                <p className="mt-1">{cert.name} · {cert.phone} · {cert.birth} · {cert.telco}</p>
              </div>
            ) : (
              <button className="btn-primary mx-auto mt-5 px-6 py-3" onClick={() => setPass(true)}><Smartphone size={18} />PASS 휴대폰 인증하기</button>
            )}
            <div className="mt-8 flex gap-2">
              <button className="btn-outline" onClick={() => setStep(1)}>이전</button>
              <button className="btn-primary flex-1 py-3" disabled={!cert} onClick={() => setStep(3)}>다음</button>
            </div>
            <PassModal open={pass} guardian={kind === '어린이'} onClose={() => setPass(false)} onDone={c => {
              if (kind === '개인' && ageOf(c.birth) < 14) { toast('만 14세 미만은 어린이 회원으로 가입해주세요', 'err'); return }
              if (kind === '어린이' && ageOf(c.birth) < 19) { toast('보호자는 만 19세 이상이어야 합니다', 'err'); return }
              setCert(c); setPass(false); toast('본인인증이 완료되었습니다')
            }} />
          </section>
        )}

        {step === 3 && cert && (
          <form className="mt-8 space-y-4" onSubmit={submitInfo} noValidate aria-labelledby="i-h">
            <h2 id="i-h" className="text-lg font-extrabold">회원 정보 입력</h2>
            {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg bg-coral-400/10 p-3 text-sm text-coral-500">입력 항목 {Object.keys(errors).length}건을 확인해주세요.</p>}
            {kind === '어린이' && (
              <fieldset className="rounded-xl bg-paper p-4">
                <legend className="px-1 text-sm font-bold">자녀(회원) 정보 · 보호자 {cert.name}님 인증 완료</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="su-childName" className="label">자녀 이름<Required /></label>
                    <input id="su-childName" className="input" value={child.name} onChange={e => setChild(c => ({ ...c, name: e.target.value }))} aria-invalid={!!errors.childName} aria-describedby="er-childName" />
                    <Err id="childName" msg={errors.childName} />
                  </div>
                  <div>
                    <label htmlFor="su-childBirth" className="label">자녀 생년월일<Required /></label>
                    <input id="su-childBirth" type="date" className="input" value={child.birth} max="2026-10-05" onChange={e => setChild(c => ({ ...c, birth: e.target.value }))} aria-invalid={!!errors.childBirth} aria-describedby="er-childBirth" />
                    <Err id="childBirth" msg={errors.childBirth} />
                  </div>
                </div>
              </fieldset>
            )}
            {age !== null && age < 19 && (
              <p className="flex items-center gap-2 rounded-xl bg-mint-400/10 p-3 text-sm font-semibold text-mint-500 ring-1 ring-mint-400">
                <Gift size={16} />만 {age}세 · 청소년 할인 자동 적용 회원으로 가입됩니다.
              </p>
            )}
            <div>
              <label htmlFor="su-loginId" className="label">아이디<Required /></label>
              <div className="flex gap-2">
                <input id="su-loginId" className="input" value={f.loginId} onChange={e => { setF({ ...f, loginId: e.target.value.toLowerCase() }); setIdChecked('') }} aria-invalid={!!errors.loginId || idChecked === 'dup'} aria-describedby="er-loginId" autoComplete="username" placeholder="영문 소문자·숫자 4~12자" />
                <button type="button" className="btn-outline shrink-0" onClick={() => {
                  if (!/^[a-z0-9]{4,12}$/.test(f.loginId)) { setErrors(e => ({ ...e, loginId: '아이디는 영문 소문자·숫자 4~12자로 입력해주세요.' })); return }
                  const dup = members.some(m => m.loginId === f.loginId)
                  setIdChecked(dup ? 'dup' : 'ok'); setErrors(e => { const { loginId, ...rest } = e; void loginId; return rest })
                }}>중복확인</button>
              </div>
              <Err id="loginId" msg={errors.loginId ?? (idChecked === 'dup' ? '이미 사용 중인 아이디입니다.' : undefined)} ok={idChecked === 'ok' ? '사용 가능한 아이디입니다.' : undefined} />
            </div>
            <div>
              <label htmlFor="su-pw" className="label">비밀번호<Required /></label>
              <input id="su-pw" type="password" className="input" value={f.pw} onChange={e => setF({ ...f, pw: e.target.value })} aria-invalid={!!errors.pw} aria-describedby="pw-rules er-pw" autoComplete="new-password" />
              <ul id="pw-rules" className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
                {pwRules.map(r => (
                  <li key={r.t} className={cx('chip gap-1', r.ok ? 'bg-mint-400/15 text-mint-500' : 'bg-paper text-muted')}>
                    {r.ok ? <Check size={12} /> : <X size={12} />}{r.t}<span className="sr-only">{r.ok ? ' 충족' : ' 미충족'}</span>
                  </li>
                ))}
              </ul>
              <Err id="pw" msg={errors.pw} />
            </div>
            <div>
              <label htmlFor="su-pw2" className="label">비밀번호 확인<Required /></label>
              <input id="su-pw2" type="password" className="input" value={f.pw2} onChange={e => setF({ ...f, pw2: e.target.value })} aria-invalid={!!errors.pw2} aria-describedby="er-pw2" autoComplete="new-password" />
              <Err id="pw2" msg={errors.pw2 ?? (f.pw2 && f.pw !== f.pw2 ? '비밀번호가 일치하지 않습니다.' : undefined)} ok={f.pw2 && f.pw === f.pw2 ? '비밀번호가 일치합니다.' : undefined} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="su-email" className="label">이메일<Required /></label>
                <input id="su-email" type="email" className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} aria-invalid={!!errors.email} aria-describedby="er-email" autoComplete="email" />
                <Err id="email" msg={errors.email} />
              </div>
              <div>
                <label htmlFor="su-region" className="label">거주 지역</label>
                <select id="su-region" className="input" value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select>
              </div>
            </div>
            <dl className="grid grid-cols-[90px_1fr] gap-y-1 rounded-xl bg-paper p-4 text-sm">
              <dt className="text-muted">이름</dt><dd>{kind === '어린이' ? (child.name || '-') : cert.name}</dd>
              <dt className="text-muted">휴대폰</dt><dd>{cert.phone} {kind === '어린이' && <span className="text-xs text-muted">(보호자)</span>}</dd>
              <dt className="text-muted">마케팅 수신</dt><dd>{agree.mk ? '동의' : '미동의'}</dd>
            </dl>
            <div className="flex gap-2">
              <button type="button" className="btn-outline" onClick={() => setStep(2)}>이전</button>
              <button className="btn-primary flex-1 py-3">가입하기</button>
            </div>
          </form>
        )}

        {step === 4 && done && (
          <section className="mt-10 text-center">
            <CheckCircle2 className="mx-auto text-mint-500" size={56} />
            <h2 className="mt-4 text-2xl font-extrabold">{done.name}님, 환영합니다!</h2>
            <p className="mt-2 text-muted">회원가입이 완료되어 자동으로 로그인되었습니다.</p>
            <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
              <p className="flex items-center gap-2 rounded-xl bg-sun-300/30 p-3 text-sm ring-1 ring-sun-400"><Gift size={18} />신규가입 <b>3,000원 할인쿠폰</b>이 발급되었습니다.</p>
              {done.age < 19 && <p className="flex items-center gap-2 rounded-xl bg-mint-400/10 p-3 text-sm text-mint-500 ring-1 ring-mint-400"><CheckCircle2 size={18} /><b>청소년 할인 자동 적용</b> 회원입니다. 예매 시 청소년 권종이 자동 선택됩니다.</p>}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <button className="btn-primary px-6 py-3" onClick={() => nav('/site/performances')}>공연 예매하러 가기</button>
              <button className="btn-accent px-6 py-3" onClick={() => nav('/site/membership')}>유료 멤버십 알아보기</button>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function Err({ id, msg, ok }: { id: string; msg?: string; ok?: string }) {
  return <p id={`er-${id}`} className={cx('mt-1 min-h-4 text-xs', msg ? 'text-coral-500' : 'text-mint-500')} aria-live="polite">{msg ?? ok ?? ''}</p>
}

function PassModal({ open, guardian, onClose, onDone }: { open: boolean; guardian: boolean; onClose: () => void; onDone: (c: Cert) => void }) {
  const [c, setC] = useState<Cert>({ name: guardian ? '김보호' : '이새봄', phone: '010-5555-7777', birth: guardian ? '1985-03-14' : '2009-06-01', telco: 'SKT' })
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setSent(false); setCode(''); setErr('') } }, [open])
  return (
    <Modal open={open} onClose={onClose} title="PASS 본인확인 (시연)" size="sm">
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-2 rounded-lg bg-[#e8202a] px-3 py-2 text-sm font-black text-white">PASS <span className="text-xs font-medium opacity-80">휴대폰 본인확인 서비스</span></div>
        <fieldset>
          <legend className="label">통신사</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {['SKT', 'KT', 'LG U+', '알뜰폰'].map(t => (
              <button key={t} type="button" aria-pressed={c.telco === t} onClick={() => setC({ ...c, telco: t })}
                className={cx('rounded-lg border py-2 text-xs font-bold', c.telco === t ? 'border-ink bg-ink text-white' : 'border-line')}>{t}</button>
            ))}
          </div>
        </fieldset>
        <div><label htmlFor="ps-name" className="label">이름</label><input id="ps-name" className="input" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></div>
        <div><label htmlFor="ps-birth" className="label">생년월일</label><input id="ps-birth" type="date" className="input" value={c.birth} onChange={e => setC({ ...c, birth: e.target.value })} /></div>
        <div className="flex gap-2">
          <div className="flex-1"><label htmlFor="ps-phone" className="label">휴대폰 번호</label><input id="ps-phone" className="input" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} inputMode="tel" /></div>
          <button type="button" className="btn-outline mt-7 shrink-0" onClick={() => {
            if (!c.name || !c.birth || !/^01\d-?\d{3,4}-?\d{4}$/.test(c.phone)) { setErr('이름·생년월일·휴대폰 번호를 확인해주세요.'); return }
            setSent(true); setErr(''); setCode('284519')
          }}>{sent ? '재전송' : '인증요청'}</button>
        </div>
        {sent && (
          <div>
            <label htmlFor="ps-code" className="label">인증번호 6자리 <span className="text-xs font-normal text-muted">(시연: 자동 입력됨)</span></label>
            <input id="ps-code" className="input font-mono tracking-widest" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" />
          </div>
        )}
        <p className="min-h-4 text-xs text-coral-500" aria-live="assertive">{err}</p>
        <button className="btn-primary w-full py-3" disabled={!sent || code.length !== 6} onClick={() => onDone(c)}>인증 완료</button>
      </div>
    </Modal>
  )
}
