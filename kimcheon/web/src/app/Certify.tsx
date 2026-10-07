import { useRef, useState } from 'react'
import { CalendarX, ChevronDown, CloudOff, Crosshair, ImagePlus, Satellite, SatelliteDish, X, Zap } from 'lucide-react'
import { byId, fmtKm, mountains } from '../data'
import { useApp, type CertDemo } from '../store'
import { round } from '../data'
import { Osam } from '../components/art'
import { MountainArt } from '../components/art'

/** 정상 인증 카메라 – GPS 반경 확인 후 촬영 */
export default function Certify({ id }: { id?: string }) {
  const { records, certDemo, setCertDemo, pop, replace, certify, roundActive, savePending, showPush, home } = useApp()
  const candidates = mountains.filter((m) => m.canCertify && !records[m.id])
  const [target, setTarget] = useState(id && !records[id] ? id : candidates.find((m) => m.id === 'hwangak')?.id ?? candidates[0]?.id)
  const [picking, setPicking] = useState(false)
  const [flash, setFlash] = useState(false)
  const [photo, setPhoto] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  if (!roundActive) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white px-8 text-center anim-slide">
        <span className="grid size-16 place-items-center rounded-2xl bg-alt text-sub">
          <CalendarX size={32} />
        </span>
        <h1 className="mt-5 text-[22px] font-extrabold">지금은 인증 기간이 아니에요</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-sub">
          {round.name}은 {round.end}에 종료되었어요.
          <br />
          다음 회차는 2027.03.01에 시작해요.
        </p>
        <p className="mt-4 rounded-xl bg-bg px-4 py-3 text-[14px] text-sub">지난 인증 기록과 산행여권은 계속 볼 수 있어요</p>
        <button onClick={pop} className="mt-8 h-14 w-full rounded-2xl bg-brand text-[17px] font-bold text-white">
          돌아가기
        </button>
      </div>
    )
  }
  if (!target) {
    return (
      <div className="absolute inset-0 z-30 grid place-items-center bg-black p-8 text-center text-white">
        <div>
          <p className="text-[18px] font-bold">인증 가능한 산을 모두 완등했어요!</p>
          <button onClick={pop} className="mt-6 h-12 rounded-xl bg-white px-6 font-bold text-ink">
            돌아가기
          </button>
        </div>
      </div>
    )
  }
  const m = byId(target)
  const atSummit = certDemo !== 'far'
  const noGps = certDemo === 'nogps'
  const offline = certDemo === 'offline'
  const dist = atSummit ? 9 : Math.round((m.distKm ?? 3) * 1000)
  const inRange = !noGps && dist <= 50

  const shoot = () => {
    if (!inRange) return
    setFlash(true)
    if (offline) {
      savePending(m.id)
      setTimeout(() => {
        setFlash(false)
        setSaved(true)
      }, 380)
      return
    }
    setTimeout(() => replace(certify(m.id, photo)), 380)
  }

  const demo = (d: CertDemo) => {
    setCertDemo(d)
    if (d === 'ok' || d === 'offline') showPush({ title: `${m.title} 정상 근처에 도착했어요`, body: '정상석 50m 안이에요. 지금 인증사진을 찍어보세요!' })
  }

  const onFile = (f?: File) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black text-white anim-slide">
      {/* 상단 */}
      <div className="flex shrink-0 items-center gap-2 px-3 pt-[51px] pb-2">
        <button onClick={pop} className="grid size-10 place-items-center rounded-full bg-white/10" aria-label="닫기">
          <X size={22} />
        </button>
        <button onClick={() => setPicking(true)} className="mx-auto flex h-10 items-center gap-1.5 rounded-full bg-white/12 px-4 text-[16px] font-bold">
          {m.title} {m.height}m <ChevronDown size={18} />
        </button>
        <span className="size-10" />
      </div>

      {/* 뷰파인더 */}
      <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-[22px]">
        {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <MountainArt m={m} className="size-full scale-110" />}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/15" />
          ))}
        </div>
        {/* GPS 상태 */}
        <div className={`absolute inset-x-3 top-3 rounded-2xl p-3.5 backdrop-blur-md ${noGps ? 'bg-[#B5402A]/90' : inRange ? 'bg-forest/85' : 'bg-black/60'}`}>
          <div className="flex items-center gap-2.5">
            <span className="relative grid size-9 place-items-center">
              {inRange && <i className="absolute inset-0 rounded-full bg-white/50" style={{ animation: 'pulse-ring 1.4s ease-out infinite' }} />}
              {noGps ? <SatelliteDish size={22} /> : <Satellite size={22} />}
            </span>
            <div className="flex-1">
              <p className="text-[16px] font-extrabold">{noGps ? '위치를 확인할 수 없어요' : inRange ? '인증 가능 · 정상석 반경 50m 이내' : '아직 정상석 반경 밖이에요'}</p>
              <p className="text-[14px] font-medium text-white/90">
                {noGps ? '하늘이 트인 곳에서 10초 정도 기다려 주세요' : inRange ? `${m.summit} 정상석까지 ${fmtKm(dist / 1000)} · 위치 정확도 ±6m` : `${m.summit} 정상석까지 ${fmtKm(dist / 1000)} 남았어요 · 50m 안에서 촬영할 수 있어요`}
              </p>
            </div>
          </div>
          {offline && inRange && (
            <p className="mt-2.5 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-[14px] font-semibold">
              <CloudOff size={16} /> 인터넷 연결 없음 · 촬영하면 기기에 저장 후 자동 등록돼요
            </p>
          )}
        </div>
        {/* 정상석 가이드 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="rounded-full bg-black/55 px-4 py-2 text-[14px] font-semibold">정상석이 화면 안에 보이도록 촬영하세요</div>
        </div>
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 text-white/60">
          <Crosshair size={44} strokeWidth={1.2} />
        </div>
        {flash && <div className="absolute inset-0 bg-white" style={{ animation: 'pop .4s ease-out reverse both' }} />}
      </div>

      {/* 시연 상황 선택 */}
      <div className="demo-only mx-3 mt-3 shrink-0 rounded-2xl bg-white/8 px-3 py-2.5">
        <p className="flex items-center gap-1.5 px-1 text-[14px] font-semibold text-white/85">
          <Zap size={15} className="text-gold" /> 시연 상황
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {(
            [
              ['ok', '정상 도착'],
              ['far', '반경 밖'],
              ['nogps', '위치 없음'],
              ['offline', '인터넷 끊김'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => demo(k)} className={`h-9 rounded-lg text-[13px] font-bold ${certDemo === k ? 'bg-white text-ink' : 'bg-white/10 text-white/85'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 셔터 */}
      <div className="flex h-[150px] shrink-0 items-center justify-around px-8 pb-[34px]">
        <button onClick={() => fileRef.current?.click()} className="demo-invisible flex w-16 flex-col items-center gap-1 text-[13px] font-semibold text-white/85">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/12">
            <ImagePlus size={22} />
          </span>
          사진 선택
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button onClick={shoot} disabled={!inRange} className="grid size-[78px] place-items-center rounded-full border-4 border-white disabled:opacity-35" aria-label="촬영">
          <span className={`size-[62px] rounded-full ${inRange ? 'bg-accent' : 'bg-white'}`} />
        </button>
        <span className="w-16 text-center text-[13px] font-semibold text-white/85">{candidates.length}산 남음</span>
      </div>

      {/* 인터넷 끊김: 기기 저장 완료 */}
      {saved && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white px-8 text-center text-ink anim-rise">
          <Osam pose="ok" size={110} />
          <h2 className="mt-5 text-[22px] font-extrabold">인증사진을 기기에 저장했어요</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-sub">
            {m.title} · 정상석 {dist}m · 촬영 위치와 시각이 함께 저장됐어요.
            <br />
            인터넷에 연결되면 자동으로 등록돼요.
          </p>
          <button
            onClick={() => {
              home()
            }}
            className="mt-8 h-14 w-full rounded-2xl bg-brand text-[17px] font-bold text-white"
          >
            확인
          </button>
        </div>
      )}

      {/* 산 선택 시트 */}
      {picking && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/50" onClick={() => setPicking(false)}>
          <div className="anim-rise max-h-[70%] overflow-hidden rounded-t-3xl bg-white text-ink" onClick={(e) => e.stopPropagation()}>
            <p className="px-5 pt-5 pb-2 text-[18px] font-extrabold">인증할 산 선택</p>
            <ul className="no-scrollbar max-h-[460px] overflow-y-auto pb-10">
              {candidates
                .slice()
                .sort((a, b) => a.distKm! - b.distKm!)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setTarget(c.id)
                        setPicking(false)
                      }}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left ${c.id === target ? 'bg-brand-50' : ''}`}
                    >
                      <span className="w-7 text-center text-[15px] font-bold text-mute">{c.no}</span>
                      <span className="flex-1 text-[16px] font-bold">
                        {c.title} {c.height}m
                      </span>
                      <span className="text-[15px] font-semibold text-sub">{fmtKm(c.distKm)}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
