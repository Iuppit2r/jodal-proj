import { useEffect, useState } from 'react'
import { Bell, Camera, Check, ChevronLeft, IdCard, MapPin, ShieldCheck, Smartphone } from 'lucide-react'
import { round, TOTAL } from '../data'
import { useApp } from '../store'
import { PrimaryButton } from '../components/ui'
import { Osam } from '../components/art'

type Step = 'splash' | 'intro' | 'login' | 'phone' | 'ipin' | 'permission'

/** 로그인 전 흐름: 스플래시 → 본인인증 방법 선택 → 휴대폰/아이핀 인증 → 권한 안내 */
export default function Auth() {
  const [step, setStep] = useState<Step>('splash')
  useEffect(() => {
    if (step !== 'splash') return
    const t = setTimeout(() => setStep('intro'), 1400)
    return () => clearTimeout(t)
  }, [step])

  if (step === 'splash') return <Splash />
  if (step === 'intro') return <Intro onDone={() => setStep('login')} />
  if (step === 'login') return <Login onPhone={() => setStep('phone')} onIpin={() => setStep('ipin')} />
  if (step === 'phone') return <PhoneVerify onBack={() => setStep('login')} onDone={() => setStep('permission')} />
  if (step === 'ipin') return <IpinVerify onBack={() => setStep('login')} onDone={() => setStep('permission')} />
  return <Permission />
}

function Splash() {
  return (
    <div className="topo absolute inset-0 z-40 flex flex-col items-center justify-center text-white">
      <div className="anim-pop">
        <Osam pose="hello" size={150} />
      </div>
      <p className="mt-6 text-[16px] font-bold text-gold">김천시 산악 완등 인증</p>
      <h1 className="mt-1 text-[32px] font-black tracking-tight">김천 100산</h1>
      <img src="./brand/logo_gimcheon_white.png" alt="김천시" className="absolute bottom-[70px] h-8" />
    </div>
  )
}

const SLIDES = [
  { pose: 'best' as const, title: '정상에서 찰칵,\n완등 인증', body: '정상석 50m 안에 들어서면 알림이 와요.\n앱 카메라로 찍으면 바로 인증 완료!' },
  { pose: 'love' as const, title: '스탬프 모으고\n인증카드 자랑하기', body: '산행여권에 산별 스탬프가 찍히고\n나만의 인증카드로 공유할 수 있어요.' },
  { pose: 'tour' as const, title: '하산 후엔\n김천 여행까지', body: '주변 관광지에 들르면 관광 스탬프!\n100산 완등 시 인증서와 기념품을 드려요.' },
]

function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white">
      <div className="flex justify-end px-5 pt-[56px]">
        <button onClick={onDone} className="h-10 px-2 text-[15px] font-semibold text-sub">
          건너뛰기
        </button>
      </div>
      <div key={i} className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center anim-rise">
        <div className="grid size-[220px] place-items-center rounded-full bg-paper">
          <Osam pose={s.pose} size={170} />
        </div>
        <h1 className="mt-8 text-[26px] leading-tight font-black tracking-tight whitespace-pre-line">{s.title}</h1>
        <p className="mt-3 text-[16px] leading-relaxed whitespace-pre-line text-sub">{s.body}</p>
      </div>
      <div className="flex justify-center gap-2 pb-6">
        {SLIDES.map((_, k) => (
          <i key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-brand' : 'w-2 bg-line'}`} />
        ))}
      </div>
      <div className="px-6 pb-[46px]">
        <PrimaryButton onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : onDone())}>{i < SLIDES.length - 1 ? '다음' : '시작하기'}</PrimaryButton>
      </div>
    </div>
  )
}

function Login({ onPhone, onIpin }: { onPhone: () => void; onIpin: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white anim-slide">
      <div className="topo relative shrink-0 overflow-hidden px-6 pt-[86px] pb-8 text-white">
        <img src="./brand/logo_gimcheon_white.png" alt="김천시" className="h-7" />
        <h1 className="mt-6 text-[28px] leading-tight font-black tracking-tight">
          김천 {TOTAL}산,
          <br />
          오르고 모으고 남기다
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/85">
          정상에서 인증사진을 찍으면
          <br />
          산행여권에 스탬프가 찍혀요
        </p>
        <Osam pose="best" size={132} className="absolute right-4 bottom-0" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pt-7 pb-[46px]">
        <div className="rounded-2xl bg-bg p-4">
          <p className="flex items-center gap-2 text-[15px] font-bold">
            <ShieldCheck size={18} className="text-forest" /> 김천시 본인인증으로 시작해요
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-sub">완등 기록과 인증서 발급을 위해 본인 확인이 필요해요. 인증 정보는 완등 관리 목적으로만 사용합니다.</p>
        </div>
        <p className="mt-4 text-[14px] font-semibold text-sub">
          {round.name} · {round.start} ~ {round.end}
        </p>
        <span className="flex-1" />
        <PrimaryButton onClick={onPhone}>
          <Smartphone size={20} /> 휴대폰 본인인증
        </PrimaryButton>
        <button onClick={onIpin} className="mt-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line text-[17px] font-bold text-ink">
          <IdCard size={20} /> 아이핀 인증
        </button>
        <p className="mt-4 text-center text-[14px] text-sub">처음이어도 본인인증만 하면 바로 가입돼요</p>
      </div>
    </div>
  )
}

function AuthHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="shrink-0 pt-[47px]">
      <div className="flex h-12 items-center gap-1 px-2">
        <button onClick={onBack} className="grid size-10 place-items-center rounded-full" aria-label="뒤로">
          <ChevronLeft size={26} />
        </button>
        <h1 className="flex-1 text-[17px] font-bold">{title}</h1>
      </div>
    </header>
  )
}

const inputCls = 'h-[52px] w-full rounded-xl border border-line bg-white px-4 text-[16px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

function PhoneVerify({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState('홍길동')
  const [birth, setBirth] = useState('19850412')
  const [carrier, setCarrier] = useState('SK텔레콤')
  const [phone, setPhone] = useState('01012345678')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)
  const [sec, setSec] = useState(180)

  useEffect(() => {
    if (!sent) return
    const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [sent])

  const send = () => {
    setSent(true)
    setSec(180)
    setTimeout(() => setCode('482913'), 900) // 시연: 인증번호 자동 입력
  }
  const ok = sent && code.length === 6 && agree

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white anim-slide">
      <AuthHeader title="휴대폰 본인인증" onBack={onBack} />
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h2 className="text-[22px] leading-snug font-extrabold tracking-tight">
          본인 확인을 위해
          <br />
          정보를 입력해 주세요
        </h2>
        <div className="mt-6 space-y-4">
          <Label text="이름">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Label>
          <Label text="생년월일 8자리">
            <input value={birth} onChange={(e) => setBirth(e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" className={inputCls} />
          </Label>
          <Label text="휴대폰 번호">
            <div className="flex gap-2">
              <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={`${inputCls.replace('w-full', '')} w-[124px] shrink-0`}>
                {['SK텔레콤', '케이티', '엘지유플러스', '알뜰폰'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" className={`${inputCls} min-w-0 flex-1`} />
            </div>
          </Label>
          <button onClick={send} className="h-[52px] w-full rounded-xl bg-brand-50 text-[16px] font-bold text-brand">
            {sent ? '인증번호 다시 받기' : '인증번호 받기'}
          </button>
          {sent && (
            <Label text="인증번호 6자리">
              <div className="relative">
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" className={inputCls} placeholder="문자로 받은 번호" />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-bold text-accent">
                  {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
                </span>
              </div>
            </Label>
          )}
        </div>
        <button onClick={() => setAgree(!agree)} className="mt-6 flex w-full items-start gap-3 text-left">
          <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 ${agree ? 'border-brand bg-brand text-white' : 'border-[#C9CCC6]'}`}>{agree && <Check size={15} strokeWidth={3} />}</span>
          <span className="text-[15px] leading-relaxed text-sub">[필수] 본인확인 서비스 이용약관, 개인정보 수집·이용, 고유식별정보 처리, 통신사 이용약관에 모두 동의합니다.</span>
        </button>
      </div>
      <div className="shrink-0 px-6 pt-3 pb-[46px]">
        <PrimaryButton disabled={!ok} onClick={onDone}>
          {!sent ? '인증번호를 먼저 받아 주세요' : !agree ? '약관에 동의해 주세요' : '인증 완료'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function IpinVerify({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [id, setId] = useState('gildong85')
  const [pw, setPw] = useState('********')
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white anim-slide">
      <AuthHeader title="아이핀 인증" onBack={onBack} />
      <div className="min-h-0 flex-1 px-6 pt-2">
        <h2 className="text-[22px] leading-snug font-extrabold tracking-tight">
          공공 아이핀으로
          <br />
          본인 확인을 해 주세요
        </h2>
        <div className="mt-6 space-y-4">
          <Label text="아이핀 아이디">
            <input value={id} onChange={(e) => setId(e.target.value)} className={inputCls} />
          </Label>
          <Label text="비밀번호">
            <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className={inputCls} />
          </Label>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-sub">아이핀이 없다면 공공 아이핀 누리집에서 발급받을 수 있어요.</p>
      </div>
      <div className="shrink-0 px-6 pt-3 pb-[46px]">
        <PrimaryButton disabled={!id || !pw} onClick={onDone}>
          인증 완료
        </PrimaryButton>
      </div>
    </div>
  )
}

function Permission() {
  const login = useApp((s) => s.login)
  const items = [
    { icon: MapPin, name: '위치 (필수)', desc: '정상석 반경 50m 안인지 확인하고 관광지 체크인에 사용해요' },
    { icon: Camera, name: '카메라 (필수)', desc: '정상 인증사진을 앱 안에서 촬영해요' },
    { icon: Bell, name: '알림 (선택)', desc: '정상 도착, 관광 미션, 안전 공지를 알려드려요' },
  ]
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white anim-slide">
      <div className="min-h-0 flex-1 px-6 pt-[90px]">
        <Osam pose="ok" size={110} />
        <h2 className="mt-5 text-[24px] leading-snug font-extrabold tracking-tight">
          본인인증이 완료됐어요!
          <br />
          앱 사용을 위해 권한을 허용해 주세요
        </h2>
        <ul className="mt-7 space-y-5">
          {items.map((it) => (
            <li key={it.name} className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
                <it.icon size={23} />
              </span>
              <div>
                <p className="text-[17px] font-bold">{it.name}</p>
                <p className="mt-0.5 text-[15px] leading-relaxed text-sub">{it.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="shrink-0 px-6 pt-3 pb-[46px]">
        <PrimaryButton accent onClick={login}>
          허용하고 시작하기
        </PrimaryButton>
      </div>
    </div>
  )
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-bold">{text}</span>
      {children}
    </label>
  )
}
