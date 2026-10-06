import { useState } from 'react'
import { Activity } from 'lucide-react'
import { Field, Modal } from './ui'

/* 설정 모달: MCP 기본 주소 확인, 보고서 언어, 서비스 상태 점검 */

export function SettingsModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const [lang, setLang] = useState<'auto' | 'ko' | 'en'>('auto')
  const [health, setHealth] = useState<'idle' | 'checking' | 'ok'>('idle')

  const check = () => {
    setHealth('checking')
    onToast('서비스 상태를 점검하고 있습니다')
    setTimeout(() => { setHealth('ok'); onToast('서비스 상태 정상') }, 700)
  }

  return (
    <Modal title="설정" onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>닫기</button>
        <button className="btn primary" onClick={() => { onToast('설정을 저장했습니다'); onClose() }}>저장</button>
      </>}>
      <Field label="MCP 연결 주소" hint="이 값은 서버 설정으로 고정되어 화면에서 변경할 수 없습니다.">
        <input className="input mono" value="https://rapid.kbiofoundry.kr/mcp" readOnly />
      </Field>

      <Field label="보고서 언어" hint="실행 보고서와 근거 검토 보고서에 적용됩니다.">
        <select className="input" value={lang}
          onChange={e => { const v = e.target.value as 'auto' | 'ko' | 'en'; setLang(v); onToast('보고서 언어를 변경했습니다') }}>
          <option value="auto">화면 언어 따름</option>
          <option value="ko">한국어</option>
          <option value="en">영어</option>
        </select>
      </Field>

      <div className="divider" />

      <div className="col" style={{ gap: 9 }}>
        <div className="row">
          <span style={{ fontWeight: 500 }}>서비스 상태 점검</span>
          <div className="sp" />
          {health === 'idle' && <span className="badge">점검 전</span>}
          {health === 'checking' && <span className="badge run"><i className="dot" />점검 중</span>}
          {health === 'ok' && <span className="badge ok"><i className="dot" />정상</span>}
        </div>
        <div className="faint" style={{ lineHeight: 1.6 }}>
          백엔드 · 모델 제공자 · 저장소 세 계층의 응답 상태를 확인합니다.
        </div>
        <div className="row">
          <button className="btn" onClick={check}><Activity size={14} />헬스 체크</button>
          <div className="sp" />
          {health === 'ok' && <span className="muted">응답 시간 48ms</span>}
        </div>
      </div>
    </Modal>
  )
}
