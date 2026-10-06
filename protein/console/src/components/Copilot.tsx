import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, CornerDownLeft, FolderOpen, Paperclip, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { State } from './ui'
import { hoursText, RUNS } from '../data/mock'

interface Msg { role: 'user' | 'bot'; text: string; actions?: string[] }

const QUICKS = [
  '지금 실행 결과를 해석해줘',
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
    text: '다음 계획을 제안합니다. ① run_0421을 fork하여 design 단계부터 재실행, ② tier를 50 단독으로 지정, ③ ProteinMPNN num_seq_per_target을 48→64로 상향, ④ soluprot 컷오프 0.60 유지. 예상 소요 1.8 GPU-h, 예상 통과 후보 약 240개입니다.',
    actions: ['이 계획으로 fork 생성', 'DAG 템플릿으로 저장'],
  },
  {
    match: /컷오프|plddt|rmsd/,
    text: '현재 실행의 분포를 기준으로 pLDDT ≥ 80, RMSD ≤ 1.5 Å를 권장합니다. 이 조합에서 후보 61개가 남고, 실험 검증 규모(통상 24~48개)에 맞춰 가중 점수 상위 48개를 선별할 수 있습니다. pLDDT ≥ 90으로 올리면 14개만 남아 다양성이 부족해집니다.',
    actions: ['이 컷오프로 Hit List 적용'],
  },
  {
    match: /보고서|리포트/,
    text: 'run_0421의 국문 보고서를 생성할 수 있습니다. 포함 항목은 실행 메타데이터, 단계별 요약, tier 비교, 상위 후보 20개 표, WT 대비 치환 목록, 구조 품질 지표, 재현 정보(모델 버전·엔드포인트·파라미터)입니다.',
    actions: ['국문 보고서 생성', '영문 보고서 생성'],
  },
]

/* 모델은 기관 내부망에 올린 것으로 고정한다. 사용자가 고를 일이 없으므로 설정 화면을 두지 않는다. */
const MODEL = 'EXAONE 3.5 · 기관 내부망'

/* 현재 화면 문맥 요약. 실제 시스템의 Live Snapshot / Current Context에 대응한다.
   실행 레코드에서 읽어 오고, 사람이 쓴 해석 문구는 그 실행에 실제로 있을 때만 덧붙인다. */
const STATUS_TEXT: Record<string, string> = {
  gate: '체크포인트 검토 대기', running: '실행 중', done: '완료', failed: '실패', queued: '대기',
}

/* 해석·권고는 분석이 끝난 실행에만 있다. 시안에서는 run_0421 하나에 채워 둔다. */
const ADVISORY: Record<string, [string, string][]> = {
  run_0421: [
    ['상위 후보', 'cand_014 · 0.871 · pLDDT 92.4 · RMSD 0.94'],
    ['통과율', '318/1,200 (26.5%) · 기준선 35%'],
    ['권고', '상위 200개로 제한 후 AF2 진행'],
  ],
}

function snapshot(page: string, run?: string): [string, string][] {
  const r = RUNS.find(x => x.id === run)
  if (!r) return [['활성 화면', page], ['실행', '이 화면은 특정 실행에 묶여 있지 않습니다'], ['응답 모델', MODEL]]
  return [
    ['활성 화면', page],
    ['run', `${r.id} · ${r.name}`],
    ['프로젝트', `${r.project} · ${r.round}`],
    ['상태', `${r.stage} ${STATUS_TEXT[r.status]}`],
    ['진행률', `${r.progress}%`],
    ['통과 후보', `${r.candidates.toLocaleString()}건`],
    ['GPU 사용', hoursText(r.gpuHours)],
    ...(ADVISORY[r.id] ?? []),
    ['응답 모델', MODEL],
  ]
}

const SUGGESTED = [
  { label: '고급 설정 열기', desc: '현재 문맥으로 실행 설정을 구성합니다' },
  { label: '실행 모니터 열기', desc: '실행 상태와 단계별 산출물을 확인합니다' },
  { label: '결과 분석 열기', desc: '후보 선별과 구조 비교로 이동합니다' },
  { label: '즉시 상태 조회', desc: '현재 실행의 상태를 다시 조회합니다' },
  { label: '산출물 새로고침', desc: '체크포인트 이후 생성된 파일을 다시 읽습니다' },
]

export function Copilot({ ctx, onClose, onToast }: { ctx: { page: string; run?: string }; onClose: () => void; onToast?: (m: string) => void }) {
  const cur = RUNS.find(r => r.id === ctx.run)
  const [openCtx, setOpenCtx] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const toast = (m: string) => onToast?.(m)
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'bot',
    text: '현재 화면과 실행 문맥을 읽고 있습니다. 실행 계획 수립, 파라미터 추천, 결과 해석, 다음 단계 제안을 도울 수 있습니다.',
  }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [msgs, busy])

  /* 입력한 만큼 세로로 늘어나게 한다. 줄이 길어져도 쓰던 내용이 가려지지 않는다. */
  const grow = () => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }

  const send = (text: string) => {
    if (!text.trim()) return
    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    requestAnimationFrame(grow)
    setBusy(true)
    setTimeout(() => {
      const hit = CANNED.find(c => c.match.test(text))
      setMsgs(m => [...m, hit
        ? { role: 'bot', text: hit.text, actions: hit.actions }
        : {
          role: 'bot',
          text: cur
            ? `${cur.id} 의 ${cur.stage} 단계 문맥에서 답할 수 있습니다. 실행 계획, 파라미터, 결과 해석, 보고서 중 어느 쪽을 보시겠습니까?`
            : '이 화면은 특정 실행에 묶여 있지 않습니다. 실행 모니터에서 실행을 열고 다시 물어보시면 그 실행의 맥락으로 답합니다.',
          actions: cur ? ['실행 계획', '결과 해석', '보고서'] : ['실행 모니터 열기'],
        }])
      setBusy(false)
    }, 650)
  }

  return (
    <aside className="copilot">
      <div className="copilot-h">
        <Sparkles size={16} color="var(--brand)" />
        <b>Copilot</b>
        <div className="sp" />
        <button className="btn ghost sm" title="새 대화"
          onClick={() => { setMsgs(m => m.slice(0, 1)); setFiles([]); toast('새 대화를 시작했습니다') }}><Plus size={15} /></button>
        <button className="btn ghost sm" title="대화 삭제" onClick={() => toast('대화를 삭제했습니다')}><Trash2 size={15} /></button>
        <button className="btn ghost sm" onClick={onClose}><X size={15} /></button>
      </div>
      {/* 문맥은 한 줄로 접어 두고, 펼쳤을 때만 상세와 추천 작업을 보여 준다.
          대화 영역을 최대한 넓게 쓰기 위한 구성이다. */}
      <button className={'copilot-ctxbar' + (openCtx ? ' on' : '')} onClick={() => setOpenCtx(o => !o)}>
        <ChevronDown size={14} />
        <b>{ctx.page}</b>
        {cur
          ? <><span className="mono">{cur.id}</span><span className="badge">{cur.stage}</span><State s={cur.status} /></>
          : <span className="faint">연결된 실행 없음</span>}
      </button>
      {openCtx && (
        <div className="copilot-ctxbody">
          <dl className="kv" style={{ gridTemplateColumns: '92px 1fr' }}>
            {snapshot(ctx.page, ctx.run).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt><dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="divider" style={{ margin: '12px 0' }} />
          <div className="col" style={{ gap: 6 }}>
            {SUGGESTED.map(a => (
              <button key={a.label} className="sugg" onClick={() => toast(a.label)}>
                <b>{a.label}</b>
                <span className="faint">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
        {busy && <div className="msg bot faint"><Bot size={14} style={{ verticalAlign: -2 }} /> 문맥 분석 중…</div>}
      </div>
      {files.length > 0 && (
        <div className="quick">
          {files.map(f => (
            <span key={f} className="chip" onClick={() => setFiles(v => v.filter(x => x !== f))}>{f} ×</span>
          ))}
        </div>
      )}
      {msgs.length <= 1 && (
        <div className="quick">
          {QUICKS.map(q => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}
        </div>
      )}
      <div className="copilot-in">
        <div className="composer">
          <textarea
            ref={taRef} rows={3} value={input}
            placeholder="현재 실행이나 화면에 대해 물어보세요"
            onChange={e => { setInput(e.target.value); grow() }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
            }}
          />
          <div className="composer-tools">
            <button className="btn ghost sm" title="파일 첨부"
              onClick={() => { setFiles(v => [...v, `target_${v.length + 1}.pdb (84 KB)`]); toast('파일을 첨부했습니다') }}>
              <Paperclip size={15} />
            </button>
            <button className="btn ghost sm" title="폴더 첨부"
              onClick={() => { setFiles(v => [...v, `run_0421/ (12 파일)`]); toast('폴더를 첨부했습니다') }}>
              <FolderOpen size={15} />
            </button>
            <div className="sp" />
            <button className="btn primary sm" disabled={!input.trim()} onClick={() => send(input)}>
              <CornerDownLeft size={14} />보내기
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
