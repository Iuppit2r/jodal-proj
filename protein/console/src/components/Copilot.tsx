import { useEffect, useRef, useState } from 'react'
import { Bot, CornerDownLeft, Sparkles, X } from 'lucide-react'

interface Msg { role: 'user' | 'bot'; text: string; actions?: string[] }

const QUICKS = [
  '지금 run 결과를 해석해줘',
  'SoluProt 통과율이 낮은 이유는?',
  'tier50만으로 재실행 계획 세워줘',
  'pLDDT와 RMSD 컷오프 추천',
  '국문 보고서 생성',
]

const CANNED: { match: RegExp; text: string; actions?: string[] }[] = [
  {
    match: /통과율|soluprot|낮은/,
    text: 'run_0421의 SoluProt 통과율은 26.5%(318/1,200)로 프로젝트 기준선 35%보다 낮습니다. tier별로 보면 tier30 41.2%, tier50 33.8%, tier70 12.1%로, 보존도 상위 구간을 과도하게 치환한 tier70이 주요 원인입니다. 컷오프 자체는 0.60으로 표준값이며 조정보다 tier 구성 변경이 효과적입니다.',
    actions: ['tier70 제외하고 fork 실행', 'tier별 분포 차트 보기'],
  },
  {
    match: /해석|결과|지금/,
    text: 'run_0421은 soluprot 단계에서 체크포인트 검토 대기 상태입니다. 상위 후보 cand_014(score 0.871, pLDDT 92.4, RMSD 0.94 Å)를 포함해 318개가 필터를 통과했습니다. AF2 단계를 전체 후보로 진행하면 약 9.4 GPU-h가 추가로 소요될 것으로 추정되어, 상위 200개로 제한하는 편을 권장합니다.',
    actions: ['상위 200개로 게이트 승인', '전체 승인', 'Hit List 열기'],
  },
  {
    match: /재실행|계획|tier50/,
    text: '다음 계획을 제안합니다 — ① run_0421을 fork하여 design 단계부터 재실행, ② tier를 50 단독으로 지정, ③ ProteinMPNN num_seq_per_target을 48→64로 상향, ④ soluprot 컷오프 0.60 유지. 예상 소요 1.8 GPU-h, 예상 통과 후보 약 240개입니다.',
    actions: ['이 계획으로 fork 생성', 'DAG 템플릿으로 저장'],
  },
  {
    match: /컷오프|plddt|rmsd/,
    text: '현재 run의 분포를 기준으로 pLDDT ≥ 80, RMSD ≤ 1.5 Å를 권장합니다. 이 조합에서 후보 61개가 남고, 실험 검증 규모(통상 24–48개)에 맞춰 가중 점수 상위 48개를 선별할 수 있습니다. pLDDT ≥ 90으로 올리면 14개만 남아 다양성이 부족해집니다.',
    actions: ['이 컷오프로 Hit List 적용'],
  },
  {
    match: /보고서|리포트/,
    text: 'run_0421의 국문 보고서를 생성할 수 있습니다. 포함 항목은 실행 메타데이터, 단계별 요약, tier 비교, 상위 후보 20개 표, WT 대비 치환 목록, 구조 품질 지표, 재현 정보(모델 버전·엔드포인트·파라미터)입니다.',
    actions: ['국문 보고서 생성', '영문 보고서 생성'],
  },
]

export function Copilot({ ctx, onClose }: { ctx: { page: string; run?: string }; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'bot',
    text: '현재 화면과 실행 문맥을 읽고 있습니다. 실행 계획 수립, 파라미터 추천, 결과 해석, 다음 단계 제안을 도울 수 있습니다.',
  }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [msgs, busy])

  const send = (text: string) => {
    if (!text.trim()) return
    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    setBusy(true)
    setTimeout(() => {
      const hit = CANNED.find(c => c.match.test(text))
      setMsgs(m => [...m, hit
        ? { role: 'bot', text: hit.text, actions: hit.actions }
        : { role: 'bot', text: '해당 질의는 현재 run 문맥(run_0421 / soluprot 게이트)에서 처리할 수 있습니다. 실행 계획, 파라미터, 결과 해석, 보고서 중 어느 쪽을 보시겠습니까?', actions: ['실행 계획', '결과 해석', '보고서'] }])
      setBusy(false)
    }, 650)
  }

  return (
    <aside className="copilot">
      <div className="copilot-h">
        <Sparkles size={16} color="var(--brand)" />
        <b>Copilot</b>
        <span className="req">UIR-003 · SFR-014</span>
        <div className="sp" />
        <button className="btn ghost sm" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="copilot-ctx">
        <div className="row"><span className="faint" style={{ width: 62 }}>화면 문맥</span><b>{ctx.page}</b></div>
        <div className="row"><span className="faint" style={{ width: 62 }}>실행 문맥</span>
          <span className="mono">{ctx.run ?? '선택된 run 없음'}</span>
          {ctx.run && <span className="badge warn" style={{ marginLeft: 'auto' }}>soluprot 게이트</span>}
        </div>
      </div>
      <div className="copilot-body" ref={bodyRef}>
        {msgs.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            {m.text}
            {m.actions && (
              <div className="actions">
                {m.actions.map(a => <button key={a} className="chip" onClick={() => send(a)}>{a}</button>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg bot faint"><Bot size={13} style={{ verticalAlign: -2 }} /> 문맥 분석 중…</div>}
      </div>
      <div className="quick">
        {QUICKS.map(q => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}
      </div>
      <div className="copilot-in">
        <input className="input" placeholder="자연어로 지시하거나 질문하세요" value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} />
        <button className="btn primary" onClick={() => send(input)}><CornerDownLeft size={14} /></button>
      </div>
    </aside>
  )
}
