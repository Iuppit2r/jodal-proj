import { useRef, useState } from 'react'
import { AlertTriangle, Check, FileText, Loader, Upload, X } from 'lucide-react'

/* 문헌 기반 마스킹 (pipeline.analyze_paper_for_masking).
   빠른 실행 · 고급 설정 화면에서 공용으로 쓴다. 모두 목업 동작.
   바깥 카드는 부르는 쪽에서 씌운다. 여기서 또 감싸면 카드 안에 카드가 겹친다. */

type Conf = 'high' | 'medium' | 'low'

interface Suggestion {
  id: string
  chain: string
  resi: number
  resn: string
  label: string
  quote: string
  confidence: Conf
}

const SUGGESTIONS: Suggestion[] = [
  { id: 'pm1', chain: 'A', resi: 65, resn: 'THR', label: '발색단 형성 잔기', quote: '"The chromophore is formed autocatalytically from Thr65-Tyr66-Gly67."', confidence: 'high' },
  { id: 'pm2', chain: 'A', resi: 66, resn: 'TYR', label: '발색단 형성 잔기', quote: '"...Thr65-Tyr66-Gly67 tripeptide buried in the center of the beta-barrel."', confidence: 'high' },
  { id: 'pm3', chain: 'A', resi: 67, resn: 'GLY', label: '발색단 형성 잔기', quote: '"Substitution of Gly67 abolishes fluorescence entirely."', confidence: 'high' },
  { id: 'pm4', chain: 'A', resi: 148, resn: 'HIS', label: '발색단 수소결합 네트워크', quote: '"His148 and Thr203 hydrogen-bond to the phenolate oxygen."', confidence: 'medium' },
  { id: 'pm5', chain: 'A', resi: 203, resn: 'THR', label: '발색단 수소결합 네트워크', quote: '"...Thr203 stacking interaction determines the 475 nm absorbance."', confidence: 'high' },
  { id: 'pm6', chain: 'A', resi: 222, resn: 'GLU', label: '양성자 전달 경로', quote: '"Glu222 acts as the general base during chromophore maturation."', confidence: 'low' },
  { id: 'pm7', chain: 'B', resi: 96, resn: 'ARG', label: '이량체 인터페이스', quote: '"Arg96 contributes to the A/B dimer interface in the crystal form."', confidence: 'medium' },
]

const CONF_TEXT: Record<Conf, string> = { high: '높음', medium: '보통', low: '낮음' }
const CONF_CLS: Record<Conf, string> = { high: 'ok', medium: 'warn', low: 'err' }

export function PaperMask({ onToast, onApply }: {
  onToast: (m: string) => void
  onApply?: (spec: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'review'>('idle')
  const [picked, setPicked] = useState<string[]>(SUGGESTIONS.map(s => s.id))

  const status = phase === 'analyzing'
    ? `${fileName} 분석중입니다. 본문에서 기능 잔기 서술을 추출하고 있습니다.`
    : phase === 'review'
      ? `${fileName} 분석 완료, 제안 ${SUGGESTIONS.length}건을 검토하세요.`
      : fileName
        ? `${fileName} 준비됨, 분석을 시작하세요.`
        : '아직 업로드한 논문이 없습니다. PDF를 올리면 기능 잔기 후보를 추출합니다.'

  const start = (name: string) => {
    setFileName(name)
    setPhase('analyzing')
    onToast(`${name} 문헌 분석을 시작했습니다.`)
    setTimeout(() => {
      setPhase('review')
      setPicked(SUGGESTIONS.map(s => s.id))
      onToast(`문헌 분석 완료: 마스킹 제안 ${SUGGESTIONS.length}건`)
    }, 1600)
  }

  const toggle = (id: string) =>
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))

  const apply = () => {
    if (!picked.length) { onToast('적용할 제안을 1건 이상 선택하세요.'); return }
    const byChain = new Map<string, number[]>()
    SUGGESTIONS.filter(s => picked.includes(s.id)).forEach(s => {
      byChain.set(s.chain, [...(byChain.get(s.chain) ?? []), s.resi])
    })
    const spec = [...byChain.entries()].map(([c, rs]) => `${c}:${rs.join(',')}`).join(';')
    onApply?.(spec)
    onToast(`마스킹 제안 ${picked.length}건을 고정 잔기에 적용했습니다 (${spec})`)
    setPhase('idle')
    setFileName('')
  }

  const cancel = () => {
    setPhase('idle')
    setFileName('')
    setPicked(SUGGESTIONS.map(s => s.id))
    onToast('문헌 기반 마스킹 검토를 취소했습니다.')
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row wrap">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) start(f.name) }}
        />
        <button className="btn" disabled={phase === 'analyzing'} onClick={() => fileRef.current?.click()}>
          <Upload size={14} />PDF 업로드
        </button>
        <button className="btn ghost" disabled={phase === 'analyzing'} onClick={() => start('Heim_1996_GFP_mutants.pdf')}>
          <FileText size={14} />예시 논문으로 시연
        </button>
        <div className="sp" />
        {phase === 'analyzing' && <span className="badge run"><Loader size={14} />분석중</span>}
        {phase === 'review' && <>
        <span className="badge ok"><Check size={14} />분석 완료</span>
        <span className="badge brand">제안 {SUGGESTIONS.length}건</span>
      </>}
      </div>

      <div className="signal">
        <FileText size={16} className="ic" color="var(--text-3)" />
        <div>
          <b>문헌 상태</b>
          <p>{status}</p>
        </div>
      </div>

      {phase === 'analyzing' && (
        <div className="log">
          <div><span className="t">[1/4]</span> PDF 텍스트 레이어 추출</div>
          <div><span className="t">[2/4]</span> 기능 잔기 문장 후보 선별</div>
          <div><span className="t">[3/4]</span> 잔기 번호 · 체인 매핑</div>
          <div><span className="t">[4/4]</span> 타깃 서열과 번호 정합성 확인</div>
        </div>
      )}

      {phase === 'review' && (
        <>
          <div className="row">
            <b>AI 제안 마스킹</b>
            <div className="sp" />
            <span className="muted">선택 {picked.length} / {SUGGESTIONS.length}</span>
            <button className="btn sm ghost" onClick={() => setPicked(SUGGESTIONS.map(s => s.id))}>전체 선택</button>
            <button className="btn sm ghost" onClick={() => setPicked([])}>전체 해제</button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="no">No.</th>
                  <th>선택</th>
                  <th>잔기</th>
                  <th>역할</th>
                  <th>근거 인용문</th>
                  <th>신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {SUGGESTIONS.map((s, i) => (
                  <tr key={s.id} className={picked.includes(s.id) ? 'sel' : ''}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <label className="check">
                        <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
                      </label>
                    </td>
                    <td className="mono">{s.chain}:{s.resi} {s.resn}</td>
                    <td>{s.label}</td>
                    <td className="muted">{s.quote}</td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        <span className={'badge ' + CONF_CLS[s.confidence]}>{CONF_TEXT[s.confidence]}</span>
                        {s.confidence !== 'high' && (
                          <span title="서열 번호 불일치 의심: 논문의 잔기 번호가 타깃 서열과 어긋날 수 있습니다.">
                            <AlertTriangle size={15} color="var(--warn)" />
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row">
            <span className="faint">신뢰도가 높음이 아닌 항목은 서열 번호 불일치를 먼저 확인하세요.</span>
            <div className="sp" />
            <button className="btn" onClick={cancel}><X size={14} />취소</button>
            <button className="btn primary" onClick={apply}><Check size={14} />선택 항목 적용</button>
          </div>
        </>
      )}
    </div>
  )
}
