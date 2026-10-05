import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Lock, LogIn, ShieldCheck } from 'lucide-react'

/*
 * 진입 경로에 따른 이용 모드.
 *  home      대표홈페이지 챗봇 버튼으로 진입 · 비로그인 · 공개 자료 기반 AI 상담만
 *  portwise  PortWise 메뉴로 진입 · 통합로그인(SSO) 토큰 전달 · 전체 이용자 서비스
 * 시연에서는 URL의 ?via=home | ?via=portwise 로 전환한다.
 */
export type Via = 'home' | 'portwise'

const Ctx = createContext<{ via: Via; setVia: (v: Via) => void }>({ via: 'portwise', setVia: () => {} })

export function AccessProvider({ children }: { children: ReactNode }) {
  const [via, setVia] = useState<Via>('portwise')
  return <Ctx.Provider value={{ via, setVia }}>{children}</Ctx.Provider>
}
export const useAccess = () => useContext(Ctx)

/** URL의 ?via= 값을 이용 모드에 반영한다. */
export function useViaParam() {
  const [params] = useSearchParams()
  const { setVia } = useAccess()
  const v = params.get('via')
  useEffect(() => {
    if (v === 'home' || v === 'portwise') setVia(v)
  }, [v, setVia])
}

/** PortWise 로그인이 필요한 화면. 비로그인(대표홈페이지 진입) 상태면 안내를 보여준다. */
export function SsoGate({ title, children }: { title: string; children: ReactNode }) {
  const { via, setVia } = useAccess()
  if (via === 'portwise') return <>{children}</>
  return (
    <div className="page">
      <div className="empty en-gate">
        <div className="empty-mark"><Lock size={24} className="faint" /></div>
        <h1>{title} 화면은 PortWise 로그인 후 이용할 수 있어요</h1>
        <p>선석배정, ETA, 선박 위치 같은 PortWise 데이터를 쓰는 서비스라 항만이해관계자 계정이 필요합니다. 로그인하면 지금 화면으로 바로 돌아옵니다.</p>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => setVia('portwise')}><LogIn size={15} />PortWise 통합로그인</button>
          <Link to="/chat" className="btn">AI 상담 계속하기</Link>
        </div>
        <p className="en-gate-note"><ShieldCheck size={14} />공사 SSO 서버가 발급한 토큰만 확인하며, 비밀번호는 AI 서비스에 저장하지 않습니다.</p>
      </div>
    </div>
  )
}
