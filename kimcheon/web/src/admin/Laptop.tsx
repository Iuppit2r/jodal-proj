import { useEffect, useRef, useState } from 'react'
import { Lock, RotateCcw, Smartphone } from 'lucide-react'
import Admin from './Admin'
import { useAdmin } from './store'
import './laptop.css'

const SCREEN_W = 1440
const SCREEN_H = 900
const CHROME_H = 44

/** 관리자 페이지를 노트북 목업 안에서 실행 */
export default function Laptop() {
  const wrap = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(true)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const resize = () => {
      if (!wrap.current) return
      const w = SCREEN_W + 32
      const h = SCREEN_H + 32 + 26
      const s = fit ? Math.min(1, (window.innerHeight - 96) / h, (window.innerWidth - 48) / (w + 120)) : 1
      wrap.current.style.transform = `scale(${s})`
      wrap.current.style.margin = `${(-(1 - s) * h) / 2}px ${(-(1 - s) * (w + 120)) / 2}px`
    }
    resize()
    document.body.style.overflow = fit ? 'hidden' : 'auto'
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [fit])

  return (
    <div className="lap-root">
      <header className="lap-bar">
        <img src="./brand/logo_gimcheon.png" alt="김천시" />
        <div className="lap-title">
          <b>완등 인증 관리 프로그램</b>
          <span>관리자 웹 화면 시안 · 노트북 1440×900</span>
        </div>
        <span style={{ flex: 1 }} />
        <a className="lap-btn" href="?view=app">
          <Smartphone size={16} /> 사용자 앱 목업
        </a>
        <button
          className="lap-btn"
          onClick={() => {
            useAdmin.setState({ authed: false, page: 'dashboard' })
            setKey(key + 1)
          }}
        >
          <RotateCcw size={16} /> 처음부터
        </button>
        <button className="lap-btn" onClick={() => setFit(!fit)}>
          {fit ? '화면 맞춤' : '실제 크기'}
        </button>
      </header>

      <div className="lap-stage">
        <div className="lap-wrap" ref={wrap}>
          <div className="lap-lid">
            <i className="lap-cam" />
            <div className="lap-screen" style={{ width: SCREEN_W, height: SCREEN_H }}>
              <div className="lap-chrome" style={{ height: CHROME_H }}>
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="addr">
                  <Lock size={13} /> 김천시 완등 인증 관리 · 관리자 전용
                </span>
              </div>
              <div className="lap-scroll" key={key} style={{ height: SCREEN_H - CHROME_H, ['--admin-h' as string]: `${SCREEN_H - CHROME_H}px` }}>
                <Admin />
              </div>
            </div>
          </div>
          <div className="lap-base">
            <i />
          </div>
        </div>
      </div>
    </div>
  )
}
