import { useEffect, useRef, useState } from 'react'
import './frame.css'
import App from './app/App'
import { TOTAL } from './data'
import { recordsLatest, useApp, type StartMode } from './store'

const MODES: { id: StartMode; label: string }[] = [
  { id: 'empty', label: '로그인 전' },
  { id: 'sample', label: '9산 진행' },
  { id: 'thirty', label: '30산 달성' },
  { id: 'closed', label: '기간 종료' },
]

function readMode(): StartMode {
  const q = new URLSearchParams(location.search).get('start') as StartMode | null
  if (q && MODES.some((m) => m.id === q)) return q
  try {
    const s = localStorage.getItem('gc100-start') as StartMode | null
    if (s && MODES.some((m) => m.id === s)) return s
  } catch {
    /* 저장소 사용 불가 */
  }
  return 'sample'
}

/** 실제 폰 크기(좁은 화면)에서는 프레임 없이 앱만 표시 */
const isBare = () => window.innerWidth < 500

export default function Frame() {
  const { mode, reset, setTab, push, home } = useApp()
  const wrap = useRef<HTMLDivElement>(null)
  const [fitOn, setFitOn] = useState(true)
  const [bare, setBare] = useState(isBare)
  const [clock, setClock] = useState('9:41')

  const start = (m: StartMode) => {
    reset(m)
    const url = new URL(location.href)
    url.searchParams.set('start', m)
    history.replaceState(null, '', url)
    try {
      localStorage.setItem('gc100-start', m)
    } catch {
      /* 저장소 사용 불가 */
    }
  }

  useEffect(() => {
    start(readMode())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fit = () => {
      setBare(isBare())
      if (!wrap.current) return
      const h = 844 + 24 + 40
      const w = 390 + 24 + 20
      const s = fitOn ? Math.min(1, (window.innerHeight - 32) / h, (window.innerWidth - 24) / w) : 1
      wrap.current.style.transform = `scale(${s})`
      wrap.current.style.margin = `${(-(1 - s) * h) / 2}px ${(-(1 - s) * w) / 2}px`
    }
    fit()
    document.body.style.overflow = fitOn ? 'hidden' : 'auto'
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fitOn, bare])

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock(document.documentElement.classList.contains('capture') ? '9:41' : `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const goCard = () => {
    const latest = recordsLatest(useApp.getState().records)[0]
    home()
    if (latest) push({ name: 'card', id: latest.mountainId })
    else push({ name: 'certify' })
  }

  if (bare) {
    return (
      <div className="bare">
        <App />
      </div>
    )
  }

  return (
    <div className="frame-root">
      <div className="stage">
        <aside className="panel">
          <img className="logo" src="./brand/logo_gimcheon.png" alt="김천시" />
          <h1>
            김천 100산
            <br />
            완등 인증 앱 · 특화제안
          </h1>
          <p className="lead">
            모으는 재미 · 알리는 재미 · 머무는 재미
            <br />
            사용자 모바일 앱 화면 시안
          </p>

          <button className="feat" onClick={() => setTab('passport')}>
            <span className="n">1</span>
            <span>
              <b>오삼이와 함께하는 디지털 산행여권</b>
              <span>산별 스탬프 · 5/10/30/50/100산 배지</span>
            </span>
          </button>
          <button className="feat" onClick={goCard}>
            <span className="n">2</span>
            <span>
              <b>나만의 김천 완등 인증카드</b>
              <span>인증사진 자동 합성 · 카톡/인스타 공유</span>
            </span>
          </button>
          <button className="feat" onClick={() => setTab('missions')}>
            <span className="n">3</span>
            <span>
              <b>김천 100산 × 지역관광 연계 미션</b>
              <span>산 인증 + 관광지 체크인 → 관광 배지</span>
            </span>
          </button>

          <div className="guide" style={{ marginTop: 16 }}>
            <h2>시연 순서 (9산 진행 상태)</h2>
            <ol>
              <li>
                하단 <b>카메라 버튼</b> → <b>황악산</b> 촬영
              </li>
              <li>
                10번째 스탬프 + <b>산행 입문 배지</b> 획득
              </li>
              <li>
                <b>인증카드 만들기</b> → 디자인 선택 → 공유
              </li>
              <li>
                추천 미션 → <b>직지사 체크인</b> → 관광 배지
              </li>
            </ol>
          </div>

          <p className="modes-label">시작 상태</p>
          <div className="modes" role="group" aria-label="시작 상태">
            {MODES.map((m) => (
              <button key={m.id} className="mode" aria-pressed={mode === m.id} onClick={() => start(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn primary" onClick={() => start(mode)}>
              다시 시작
            </button>
            <button className="btn" onClick={() => setFitOn(!fitOn)}>
              {fitOn ? '화면 맞춤' : '실제 크기'}
            </button>
          </div>
          <button
            className="btn"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => {
              home()
              useApp.getState().showPush({ title: '황악산 정상 근처에 도착했어요', body: '정상석 50m 안이에요. 지금 인증사진을 찍어보세요!', to: { name: 'certify', id: 'hwangak' } })
            }}
          >
            정상 도착 푸시 알림 보내기
          </button>
          <a className="admin-link" href="?view=admin">
            <b>관리자 페이지 열기</b>
            <span>회차 · 코스 · 인증현황 · 물품 · 지급 · 통계 · 콘텐츠 관리</span>
          </a>

          <div className="foot">
            <img src="./osam/hello.png" alt="오삼이" style={{ height: 56 }} />
            <span style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>
              캐릭터: 김천시 공식 오삼이
              <br />
              실데이터: 100명산 {TOTAL}개 봉우리 · 관광지 17곳
            </span>
          </div>
        </aside>

        <div className="phone-wrap" ref={wrap}>
          <div className="phone">
            <div className="screen">
              <div className="island" />
              <div className="statusbar">
                <span>{clock}</span>
                <span className="icons" aria-hidden="true">
                  <svg width="18" height="12" viewBox="0 0 18 12">
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                    <rect x="10" y="3" width="3" height="9" rx="1" />
                    <rect x="15" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <svg width="16" height="12" viewBox="0 0 16 12">
                    <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.5 10.5 0 0 0 8 .4 10.5 10.5 0 0 0 .8 3.3L2 4.6a8.7 8.7 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.8 6.8 0 0 0 8 4 6.8 6.8 0 0 0 3.4 5.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.5c-.5 0-1 .2-1.3.5L8 11.2l1.3-1.4c-.3-.3-.8-.5-1.3-.5Z" />
                  </svg>
                  <svg width="27" height="13" viewBox="0 0 27 13">
                    <rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".5" />
                    <rect x="2" y="2" width="20" height="9" rx="2" />
                    <rect x="24.5" y="4.5" width="1.8" height="4" rx=".9" opacity=".5" />
                  </svg>
                </span>
              </div>
              <App />
              <div className="home-indicator" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
