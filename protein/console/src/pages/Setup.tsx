import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dna, Link2, Play, Save, Upload } from 'lucide-react'
import { Card, Field, PageHead, Seg } from '../components/ui'
import { MODELS, type PipelineKind } from '../data/mock'

const STEPS = ['파이프라인 선택', '입력 정의', '단계 파라미터', '자원·검토 지점', '확인']

export default function Setup({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [pipeline, setPipeline] = useState<PipelineKind>('stability')
  const [inputMode, setInputMode] = useState<'pdb' | 'seq' | 'run'>('pdb')
  const [tiers, setTiers] = useState<number[]>([30, 50])
  const [numSeq, setNumSeq] = useState(48)
  const [cutoff, setCutoff] = useState(0.6)
  const [plddt, setPlddt] = useState(80)
  const [gates, setGates] = useState<string[]>(['soluprot'])
  const [forkMode, setForkMode] = useState(true)

  const stages = pipeline === 'stability'
    ? ['msa', 'rfd3', 'bioemu', 'design', 'soluprot', 'af2']
    : ['import', 'diffdock', 'multimer', 'interface', 'rank']

  const toggle = (arr: number[], v: number, set: (x: number[]) => void) =>
    set(arr.includes(v) ? arr.filter(i => i !== v) : [...arr, v].sort((a, b) => a - b))

  return (
    <>
      <PageHead
        title="실행 설정"
        desc="파이프라인, 입력, 단계 파라미터, 검토 지점을 정의하고 run을 생성합니다."
        req="SFR-001 · SFR-002"
        actions={<>
          <button className="btn"><Save size={14} />템플릿으로 저장</button>
          <button className="btn primary" onClick={() => { onToast('run_0422 생성됨 — Monitor로 이동'); nav('/monitor') }}>
            <Play size={14} />run 생성
          </button>
        </>}
      />

      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={'step ' + (i === step ? 'on' : i < step ? 'done' : '')} onClick={() => setStep(i)}>
            <span className="n">{i + 1}</span>{s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid g2">
          <div className={'pipe-card' + (pipeline === 'stability' ? ' on' : '')} onClick={() => setPipeline('stability')}>
            <span className="badge brand">안정화 (설계)</span>
            <h4>단백질 안정화 파이프라인</h4>
            <p>MSA·보존도 분석으로 설계 제한을 세우고, 백본 생성 → 서열 설계 → developability 필터 → 구조 검증까지 수행합니다.</p>
            <div className="flow">
              {['msa', 'rfd3', 'bioemu', 'design', 'soluprot', 'af2'].map(s => <span key={s}>{s}</span>)}
            </div>
          </div>
          <div className={'pipe-card' + (pipeline === 'binding' ? ' on' : '')} onClick={() => setPipeline('binding')}>
            <span className="badge accent">결합 예측</span>
            <h4>단백질 결합 예측 파이프라인<span className="req">SFR-021</span></h4>
            <p>안정화 결과(설계 서열·구조)를 입력으로 표적·리간드 도킹, 복합체 구조 예측, 인터페이스 평가, 결합 스코어 랭킹을 수행합니다.</p>
            <div className="flow">
              {['import', 'diffdock', 'multimer', 'interface', 'rank'].map(s => <span key={s}>{s}</span>)}
            </div>
          </div>
          <Card title="실행 모드">
            <div className="col" style={{ gap: 12 }}>
              <Seg items={[{ key: 'stage', label: '정형 Stage 실행' }, { key: 'dag', label: '자유형 DAG 템플릿' }]}
                value="stage" onChange={() => nav('/dag')} />
              <span className="hint faint">자유형 DAG를 선택하면 Workflow Studio(DAG)로 이동합니다. 조건 분기·병렬 분석·사용자 정의 평가 단계를 구성할 수 있습니다.</span>
            </div>
          </Card>
          <Card title="프로젝트 연결" req="SFR-018">
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="프로젝트">
                <select className="input" defaultValue="prj-gfp">
                  <option value="prj-gfp">GFP 열안정화</option>
                  <option value="prj-pdl1">PD-L1 바인더</option>
                  <option value="prj-lip">Lipase 개량</option>
                </select>
              </Field>
              <Field label="라운드">
                <select className="input" defaultValue="r3"><option value="r3">Round 3</option><option value="new">+ 새 라운드</option></select>
              </Field>
            </div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div className="grid g-2-1">
          <Card title="입력 정의" req="SFR-004">
            <div className="col" style={{ gap: 14 }}>
              <Seg items={[
                { key: 'pdb', label: 'PDB 업로드' },
                { key: 'seq', label: '서열 입력' },
                { key: 'run', label: '기존 run 승계' },
              ]} value={inputMode} onChange={setInputMode} />

              {inputMode === 'pdb' && (
                <div style={{ border: '1.5px dashed var(--line-strong)', borderRadius: 10, padding: 26, textAlign: 'center', background: 'var(--surface-2)' }}>
                  <Upload size={22} color="var(--text-3)" />
                  <div style={{ marginTop: 8, fontWeight: 500 }}>PDB / mmCIF 파일을 끌어다 놓으세요</div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>또는 PDB ID 입력 · 최대 200 MB</div>
                  <div className="row" style={{ justifyContent: 'center', marginTop: 12, gap: 8 }}>
                    <input className="input" placeholder="PDB ID (예: 1EMA)" style={{ width: 180 }} defaultValue="1EMA" />
                    <button className="btn">가져오기</button>
                  </div>
                </div>
              )}
              {inputMode === 'seq' && (
                <Field label="FASTA 서열" hint="단일 또는 다중 서열. 체인별 설계 대상은 아래에서 지정합니다.">
                  <textarea className="input mono" rows={6} defaultValue={'>target\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTL'} />
                </Field>
              )}
              {inputMode === 'run' && (
                <Field label="승계할 run" hint="선택한 run의 산출물과 메타데이터를 입력으로 사용합니다 (fork).">
                  <select className="input" defaultValue="run_0412">
                    <option value="run_0412">run_0412 · GFP 열안정성 R2 best (hit 96)</option>
                    <option value="run_0418">run_0418 · GFP 열안정성 R3-tier70 (hit 142)</option>
                  </select>
                </Field>
              )}

              <div className="grid g3" style={{ gap: 10 }}>
                <Field label="설계 대상 체인"><select className="input"><option>A</option><option>A, B</option></select></Field>
                <Field label="설계 구간" hint="비우면 전체"><input className="input" placeholder="예: 20-180" /></Field>
                <Field label="고정 잔기" hint="쉼표 구분"><input className="input" defaultValue="65,66,67" /></Field>
              </div>

              {pipeline === 'binding' && (
                <>
                  <div className="divider" />
                  <div className="grid g2" style={{ gap: 10 }}>
                    <Field label="표적 단백질"><input className="input" placeholder="PDB ID 또는 업로드" defaultValue="4ZQK (PD-L1)" /></Field>
                    <Field label="리간드 / 바인더 출처"><select className="input"><option>run_0412 hit list 상위 24</option><option>직접 업로드</option></select></Field>
                  </div>
                </>
              )}
            </div>
          </Card>
          <Card title="MSA·보존도 설정" req="SFR-003">
            <div className="col" style={{ gap: 12 }}>
              <Field label="MSA 생성기"><select className="input"><option>MMseqs2 (ColabFold DB)</option><option>JackHMMER (UniRef90)</option></select></Field>
              <Field label="최소 Neff" hint="미달 시 Agent Panel에서 경고합니다."><input className="input" type="number" defaultValue={128} /></Field>
              <div className="divider" />
              <div className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>보존도 tier 마스킹</div>
              <div className="row wrap">
                {[30, 50, 70].map(t => (
                  <label key={t} className="check">
                    <input type="checkbox" checked={tiers.includes(t)} onChange={() => toggle(tiers, t, setTiers)} />
                    tier{t}
                  </label>
                ))}
              </div>
              <span className="hint faint">tier는 보존도 상위 백분위를 의미하며, 선택한 tier별로 후보군이 분리 저장·비교됩니다.</span>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="grid g2">
          <Card title="ProteinMPNN · 서열 설계" req="SFR-005">
            <div className="col" style={{ gap: 14 }}>
              <Field label={`서열 수 / 백본 — ${numSeq}`}>
                <input type="range" min={8} max={128} step={8} value={numSeq} onChange={e => setNumSeq(+e.target.value)} />
              </Field>
              <div className="grid g2" style={{ gap: 10 }}>
                <Field label="Sampling temperature"><input className="input" defaultValue="0.1" /></Field>
                <Field label="Backbone noise"><input className="input" defaultValue="0.02" /></Field>
              </div>
              <Field label="모델 버전">
                <select className="input">
                  {MODELS.filter(m => m.kind === 'sequence').map(m => <option key={m.id}>{m.name} {m.version}</option>)}
                </select>
              </Field>
              <span className="hint faint">선택한 tier {tiers.join(', ')} 조합으로 총 {tiers.length} × 40 백본 × {numSeq} ≈ {tiers.length * 40 * numSeq}개 서열이 생성됩니다.</span>
            </div>
          </Card>
          <Card title="SoluProt · developability 필터" req="SFR-006">
            <div className="col" style={{ gap: 14 }}>
              <Field label={`통과 컷오프 — ${cutoff.toFixed(2)}`}>
                <input type="range" min={0.3} max={0.9} step={0.05} value={cutoff} onChange={e => setCutoff(+e.target.value)} />
              </Field>
              <Field label="최대 통과 후보 수" hint="AF2 단계의 GPU 비용을 제한합니다.">
                <input className="input" type="number" defaultValue={200} />
              </Field>
              <div className="divider" />
              <div className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>AF2 / ColabFold 2차 검증 <span className="req">SFR-007</span></div>
              <Field label={`pLDDT 하한 — ${plddt}`}>
                <input type="range" min={50} max={95} step={5} value={plddt} onChange={e => setPlddt(+e.target.value)} />
              </Field>
              <Field label="RMSD 상한 (Å)"><input className="input" defaultValue="1.5" /></Field>
            </div>
          </Card>
          <Card title="백본 생성" req="SFR-004">
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="RFDiffusion3 샘플 수"><input className="input" type="number" defaultValue={24} /></Field>
              <Field label="RFD3 diffusion steps"><input className="input" type="number" defaultValue={50} /></Field>
              <Field label="BioEmu 샘플 수"><input className="input" type="number" defaultValue={16} /></Field>
              <Field label="BioEmu 온도 (K)"><input className="input" type="number" defaultValue={300} /></Field>
            </div>
            <div className="divider" />
            <label className="check"><input type="checkbox" defaultChecked />입력 PDB 자체도 백본 소스로 포함</label>
          </Card>
          <Card title="보고서 설정" req="SFR-009">
            <div className="col" style={{ gap: 10 }}>
              <Field label="보고서 언어"><select className="input"><option>국문</option><option>영문</option><option>국문 + 영문</option></select></Field>
              <Field label="형식"><select className="input"><option>기관 지정 양식</option><option>Markdown</option><option>PDF</option></select></Field>
              <label className="check"><input type="checkbox" defaultChecked />실행 완료 시 자동 생성</label>
              <label className="check"><input type="checkbox" defaultChecked />재현 정보(모델 버전·엔드포인트·환경변수) 포함</label>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="grid g-2-1">
          <Card title="체크포인트 검토 지점" req="SFR-010" sub="선택한 단계 완료 후 실행을 멈추고 검토를 요청합니다.">
            <div className="col" style={{ gap: 8 }}>
              {stages.map(s => (
                <label key={s} className="check" style={{ justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px' }}>
                  <span className="row" style={{ gap: 10 }}>
                    <input type="checkbox" checked={gates.includes(s)}
                      onChange={() => setGates(g => g.includes(s) ? g.filter(x => x !== s) : [...g, s])} />
                    <span className="mono" style={{ fontWeight: 500 }}>{s}</span>
                  </span>
                  <span className="faint" style={{ fontSize: 11.5 }}>
                    {gates.includes(s) ? '완료 후 검토 대기' : '자동 진행'}
                  </span>
                </label>
              ))}
            </div>
            <div className="divider" />
            <label className="check">
              <input type="checkbox" checked={forkMode} onChange={e => setForkMode(e.target.checked)} />
              재실행 시 기존 run을 덮어쓰지 않고 fork 생성 <span className="req">SFR-017</span>
            </label>
          </Card>
          <Card title="자원 및 우선순위" req="SFR-022">
            <div className="col" style={{ gap: 12 }}>
              <Field label="우선순위"><select className="input" defaultValue="normal">
                <option value="high">높음 (긴급 검증)</option><option value="normal">보통</option><option value="low">낮음 (야간 배치)</option>
              </select></Field>
              <Field label="동시 실행 워커 상한"><input className="input" type="number" defaultValue={4} /></Field>
              <Field label="GPU 예산 상한 (GPU-h)" hint="초과 시 자동 중지하고 알림을 보냅니다."><input className="input" type="number" defaultValue={12} /></Field>
              <div className="divider" />
              <div className="kv">
                <dt>예상 소요</dt><dd>약 42분</dd>
                <dt>예상 GPU</dt><dd>6.8 GPU-h</dd>
                <dt>예상 비용</dt><dd>$28.6</dd>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 4 && (
        <div className="grid g-2-1">
          <Card title="실행 요약" sub="run 생성 시 아래 값이 메타데이터로 저장됩니다" req="DAR-002">
            <dl className="kv">
              <dt>파이프라인</dt><dd>{pipeline === 'stability' ? '단백질 안정화 (설계)' : '단백질 결합 예측'}</dd>
              <dt>단계 구성</dt><dd className="mono">{stages.join(' → ')}</dd>
              <dt>입력</dt><dd>{inputMode === 'pdb' ? 'PDB 1EMA · chain A' : inputMode === 'seq' ? 'FASTA 직접 입력' : 'run_0412 승계'}</dd>
              <dt>보존도 tier</dt><dd>{tiers.map(t => `tier${t}`).join(', ') || '없음'}</dd>
              <dt>서열 수/백본</dt><dd>{numSeq}</dd>
              <dt>SoluProt 컷오프</dt><dd>{cutoff.toFixed(2)}</dd>
              <dt>pLDDT 하한</dt><dd>{plddt}</dd>
              <dt>검토 지점</dt><dd className="mono">{gates.join(', ') || '없음'}</dd>
              <dt>재실행 정책</dt><dd>{forkMode ? 'fork (기본)' : '덮어쓰기'}</dd>
              <dt>프로젝트</dt><dd>GFP 열안정화 · Round 3</dd>
            </dl>
          </Card>
          <Card title="사전 점검">
            <div className="col" style={{ gap: 10 }}>
              {[
                ['모델 가용성', '7개 모델 운영 상태 정상'],
                ['엔드포인트', 'colabfold-a100 큐 6건 — 대기 예상'],
                ['권한', '실행·보고서 생성 권한 보유'],
                ['저장소', '아티팩트 저장소 여유 2.1 TB'],
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ fontSize: 12.5 }}>
                  <span className="muted" style={{ width: 92 }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="divider" />
              <button className="btn primary" onClick={() => { onToast('run_0422 생성됨'); nav('/monitor') }}>
                <Play size={14} />이 설정으로 run 생성
              </button>
              <button className="btn"><Link2 size={14} />API / MCP 호출 코드 복사</button>
              <button className="btn"><Dna size={14} />DAG 템플릿으로 내보내기</button>
            </div>
          </Card>
        </div>
      )}

      <div className="row mt">
        <button className="btn" disabled={step === 0} onClick={() => setStep(s => s - 1)}>이전</button>
        <div className="sp" />
        <span className="faint">{step + 1} / {STEPS.length}</span>
        <div className="sp" />
        <button className="btn primary" disabled={step === STEPS.length - 1} onClick={() => setStep(s => s + 1)}>다음</button>
      </div>
    </>
  )
}
