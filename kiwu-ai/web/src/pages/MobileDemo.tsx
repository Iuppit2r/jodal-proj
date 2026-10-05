import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { IPhoneFrame } from '../components/IPhoneFrame'
import { ChatPanel } from '../widget/ChatPanel'
import { LauncherButton } from '../widget/LauncherButton'

// 모바일 예시안 캡처용: HTML 아이폰 목업 안에 실제 모바일 홈페이지 캡처 + 챗봇.
// 런처를 누르면 챗봇이 전체 화면으로 열립니다(실제 모바일 동작과 동일).
const PHONE_H = 852 + 28
type Scene = 'home' | 'chat'

export default function MobileDemo() {
  const [scene, setScene] = useState<Scene>('home')
  const [chatKey, setChatKey] = useState(0) // '처음부터'로 대화 초기화
  const scale = useFitScale()
  const chat = scene === 'chat'

  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-[#eef1f5] to-[#dfe4ec] px-4 py-6">
      <div className="mb-5 flex items-center gap-1 rounded-full bg-white/80 p-1 text-sm shadow-sm ring-1 ring-black/5 backdrop-blur">
        {(
          [
            ['home', '홈페이지'],
            ['chat', '챗봇'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={scene === v}
            onClick={() => setScene(v)}
            className={clsx('h-8 rounded-full px-4 font-medium transition', scene === v ? 'bg-ink text-white' : 'text-ink-2 hover:bg-black/5')}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-black/10" aria-hidden />
        <button
          type="button"
          onClick={() => {
            setChatKey((k) => k + 1)
            setScene('chat')
          }}
          className="h-8 rounded-full px-4 font-medium text-ink-2 hover:bg-black/5"
        >
          처음부터
        </button>
      </div>

      <div style={{ height: PHONE_H * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <IPhoneFrame
            statusBg={chat ? '#ffffff' : '#4c4c50'}
            statusTone={chat ? 'dark' : 'light'}
            indicatorTone={chat ? 'dark' : 'light'}
          >
            {/* 홈페이지 (실제 모바일 메인 화면 캡처) */}
            <img src="/mock/kiwu-home-mobile.jpg" alt="경인여자대학교 모바일 홈페이지" draggable={false} className="block w-full" />
            <div className={clsx('absolute right-4 bottom-[37px] z-10', chat && 'hidden')}>
              <LauncherButton open={false} onClick={() => setScene('chat')} />
            </div>

            {/* 챗봇 (모바일 전체 화면) — 닫아도 대화 유지 */}
            <div className={clsx('absolute inset-0 z-20 bg-white pb-[18px]', chat ? 'anim-pop' : 'hidden')}>
              <ChatPanel key={chatKey} variant="popup" onClose={() => setScene('home')} />
            </div>
          </IPhoneFrame>
        </div>
      </div>
    </div>
  )
}

/** 창 높이에 맞춰 폰을 축소 (확대는 하지 않음) */
function useFitScale() {
  const calc = () => Math.min(1, (window.innerHeight - 100) / PHONE_H)
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const onResize = () => setScale(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}
