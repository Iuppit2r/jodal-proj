import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Download, FileText, GitFork, Pause, Play, RotateCcw, ShieldCheck,
} from 'lucide-react'
import { Card, Field, Modal, PageHead, Progress, Seg, State, Tabs } from '../components/ui'
import { ARTIFACTS, BINDING_STAGES, RUNS, SIGNALS, STABILITY_STAGES, type Stage } from '../data/mock'

const LOG_LINES = [
  ['t', '09:43:02', 'stage design completed — 1,200 sequences across 3 tiers'],
  ['t', '09:43:05', 'artifact written design/sequences.fasta (2.1 MB)'],
  ['t', '09:44:11', 'stage soluprot started — model soluprot@1.0 endpoint internal/cpu-pool'],
  ['o', '09:45:28', 'soluprot scored 1,200 sequences in 81s'],
  ['w', '09:45:29', 'pass rate 26.5% below project baseline 35.0%'],
  ['w', '09:45:30', 'tier70 pass rate 12.1% — dominant contributor'],
  ['t', '09:45:32', 'artifact written soluprot/scores.json (310 KB)'],
  ['o', '09:45:33', 'checkpoint gate reached: soluprot — awaiting review'],
  ['t', '09:46:12', 'gate hold by 김연구 (run.gate.hold)'],
] as const

export default function Monitor({ onToast, onRunChange }: { onToast: (m: string) => void; onRunChange: (id: string) => void }) {
  const [runId, setRunId] = useState('run_0421')
  const [tab, setTab] = useState<'stages' | 'events' | 'artifacts' | 'params'>('stages')
  const [sel, setSel] = useState('soluprot')
  const [gateOpen, setGateOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active'>('all')

  const run = RUNS.find(r => r.id === runId)!
  const stages: Stage[] = run.pipeline === 'stability' ? STABILITY_STAGES : BINDING_STAGES
  const selStage = useMemo(() => stages.find(s => s.key === sel) ?? stages[0], [stages, sel])
  const list = filter === 'all' ? RUNS : RUNS.filter(r => ['running', 'gate', 'queued'].includes(r.status))

  const pick = (id: string) => {
    setRunId(id); onRunChange(id)
    const st = RUNS.find(r => r.id === id)!
    setSel((st.pipeline === 'stability' ? STABILITY_STAGES : BINDING_STAGES).find(s => s.state === 'gate' || s.state === 'running')?.key ?? 'msa')
  }

  return (
    <>
      <PageHead
        title="Monitor"
        desc="단계별 실행 상태를 추적하고 체크포인트에서 검토·재개·분기를 제어합니다."
        req="SFR-002 · SFR-010"
        actions={<>
          <button className="btn"><Pause size={14} />일시중지</button>
          <button className="btn"><GitFork size={14} />fork 실행</button>
          <button className="btn primary" onClick={() => setGateOpen(true)}><ShieldCheck size={14} />체크포인트 검토</button>
        </>}
      />

      <div className="grid g-1-2" style={{ gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)' }}>
        <Card title="run 목록" sub={`${list.length}건`} flush
          right={<Seg items={[{ key: 'all', label: '전체' }, { key: 'active', label: '진행' }]} value={filter} onChange={setFilter} />}>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className={r.id === runId ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => pick(r.id)}>
                    <td>
                      <div className="row">
                        <span className="mono" style={{ fontWeight: 500 }}>{r.id}</span>
                        <div className="sp" />
                        <State s={r.status} />
                      </div>
                      <div className="faint" style={{ fontSize: 11.5, margin: '3px 0 5px' }}>{r.name}</div>
                      <Progress v={r.progress} />
                      <div className="row faint" style={{ fontSize: 11, marginTop: 3 }}>
                        <span className="mono">{r.stage}</span><div className="sp" /><span>{r.created.slice(5)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="col" style={{ gap: 14 }}>
          <Card
            title={run.id}
            sub={run.name}
            right={<>
              <span className={'badge ' + (run.pipeline === 'stability' ? 'brand' : 'accent')}>
                {run.pipeline === 'stability' ? '안정화' : '결합예측'}
              </span>
              <State s={run.status} />
            </>}>
            <div className="stages">
              {stages.map(s => (
                <div key={s.key} className={`stage ${s.state} ${sel === s.key ? 'sel' : ''}`} onClick={() => setSel(s.key)}>
                  <div className="s-name">{s.label}</div>
                  <div className="s-model">{s.model}</div>
                  <div className="s-state"><State s={s.state} /></div>
                  {s.metric && <div className="faint" style={{ fontSize: 11, marginTop: 5 }}>{s.metric}</div>}
                  {s.duration && <div className="faint mono" style={{ fontSize: 10.5 }}>{s.duration}</div>}
                </div>
              ))}
            </div>
            {run.status === 'gate' && (
              <div className="signal warn mt">
                <span className="ic"><AlertTriangle size={15} color="var(--warn)" /></span>
                <div>
                  <b>체크포인트 검토 대기 — {selStage.label}</b>
                  <p>이 단계의 결과를 검토한 뒤 재개(continue), 단계 재실행(rerun), 조건 변경 분기(fork) 중 하나를 선택하세요. 기본 정책은 fork이며 기존 run은 보존됩니다.</p>
                  <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                    <button className="btn sm primary" onClick={() => setGateOpen(true)}><Play size={13} />검토 후 재개</button>
                    <button className="btn sm"><RotateCcw size={13} />이 단계 재실행</button>
                    <button className="btn sm"><GitFork size={13} />조건 변경 fork</button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card flush>
            <div style={{ padding: '12px 16px 0' }}>
              <Tabs items={[
                { key: 'stages', label: `단계 상세 — ${selStage.label}` },
                { key: 'events', label: '이벤트 로그' },
                { key: 'artifacts', label: `산출물 (${ARTIFACTS.length})` },
                { key: 'params', label: '실행 파라미터' },
              ]} value={tab} onChange={setTab} />
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              {tab === 'stages' && (
                <div className="grid g2">
                  <dl className="kv">
                    <dt>단계</dt><dd className="mono">{selStage.key}</dd>
                    <dt>모델</dt><dd>{selStage.model}</dd>
                    <dt>상태</dt><dd><State s={selStage.state} /></dd>
                    <dt>소요</dt><dd>{selStage.duration ?? '—'}</dd>
                    <dt>결과 요약</dt><dd>{selStage.metric ?? '—'}</dd>
                    <dt>엔드포인트</dt><dd className="mono">internal/cpu-pool</dd>
                    <dt>재현 키</dt><dd className="mono">sha256:4f9c…a21b</dd>
                  </dl>
                  <div className="col" style={{ gap: 8 }}>
                    <div className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>이 단계의 품질 신호</div>
                    {SIGNALS.slice(0, 2).map(s => (
                      <div key={s.title} className={'signal ' + s.level}>
                        <span className="ic">{s.level === 'ok'
                          ? <CheckCircle2 size={14} color="var(--ok)" />
                          : <AlertTriangle size={14} color="var(--warn)" />}</span>
                        <div><b style={{ fontSize: 12.5 }}>{s.title}</b><p style={{ fontSize: 12 }}>{s.body}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === 'events' && (
                <div className="log">
                  {LOG_LINES.map(([lvl, t, msg], i) => (
                    <div key={i}><span className="t">{t}</span> <span className={lvl}>{msg}</span></div>
                  ))}
                </div>
              )}
              {tab === 'artifacts' && (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>이름</th><th>단계</th><th>형식</th><th className="num">크기</th><th>갱신</th><th /></tr></thead>
                    <tbody>
                      {ARTIFACTS.map(a => (
                        <tr key={a.name}>
                          <td className="mono">{a.name}</td>
                          <td className="mono faint">{a.stage}</td>
                          <td><span className="badge">{a.kind}</span></td>
                          <td className="num">{a.size}</td>
                          <td className="faint">{a.updated}</td>
                          <td><button className="btn sm ghost" onClick={() => onToast(`${a.name} 다운로드`)}><Download size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="row mt" style={{ padding: '0 0 4px' }}>
                    <button className="btn sm" onClick={() => onToast('run 패키지(zip) 생성 요청')}><Download size={13} />전체 패키지 다운로드</button>
                    <button className="btn sm" onClick={() => onToast('국문 보고서 생성 요청')}><FileText size={13} />보고서 재생성</button>
                  </div>
                </div>
              )}
              {tab === 'params' && (
                <div className="log" style={{ maxHeight: 300 }}>
{`{
  "run_id": "${run.id}",
  "pipeline": "${run.pipeline}",
  "parent_run": ${run.parent ? `"${run.parent}"` : 'null'},
  "input": { "pdb_id": "1EMA", "chains": ["A"], "fixed_residues": [65, 66, 67] },
  "conservation": { "generator": "mmseqs2", "min_neff": 128, "tiers": [30, 50, 70] },
  "stages": {
    "rfd3":     { "model": "rfdiffusion3@1.2.0", "samples": 24, "steps": 50 },
    "bioemu":   { "model": "bioemu@1.1", "samples": 16, "temperature_k": 300 },
    "design":   { "model": "proteinmpnn@1.0.1", "num_seq_per_target": 48, "temperature": 0.1 },
    "soluprot": { "model": "soluprot@1.0", "cutoff": 0.60, "max_pass": 200 },
    "af2":      { "model": "colabfold@1.5.5", "plddt_min": 80, "rmsd_max": 1.5 }
  },
  "gates": ["soluprot"],
  "rerun_policy": "fork",
  "priority": "normal",
  "budget_gpu_hours": 12
}`}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {gateOpen && (
        <Modal title="체크포인트 검토 — soluprot" onClose={() => setGateOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setGateOpen(false)}>취소</button>
            <button className="btn" onClick={() => { setGateOpen(false); onToast('run_0423으로 fork 생성') }}>
              <GitFork size={14} />조건 변경하여 fork
            </button>
            <button className="btn primary" onClick={() => { setGateOpen(false); onToast('af2 단계 재개 — 상위 200개') }}>
              <Play size={14} />승인하고 재개
            </button>
          </>}>
          <div className="signal warn">
            <span className="ic"><AlertTriangle size={15} color="var(--warn)" /></span>
            <div>
              <b>통과율 26.5% (318 / 1,200)</b>
              <p>프로젝트 기준선 35%보다 낮습니다. tier70 구간이 12.1%로 가장 낮아 전체 통과율을 끌어내리고 있습니다.</p>
            </div>
          </div>
          <dl className="kv">
            <dt>통과 후보</dt><dd>318개 (tier30 165 · tier50 135 · tier70 18)</dd>
            <dt>적용 컷오프</dt><dd>0.60</dd>
            <dt>다음 단계</dt><dd>af2 / ColabFold 1.5.5</dd>
            <dt>예상 추가 GPU</dt><dd>전체 9.4 GPU-h · 상위 200개 5.9 GPU-h</dd>
          </dl>
          <div className="divider" />
          <Field label="다음 단계로 넘길 후보 범위">
            <select className="input" defaultValue="top200">
              <option value="all">통과 후보 전체 (318개)</option>
              <option value="top200">가중 점수 상위 200개</option>
              <option value="tier">tier30 · tier50만 (300개)</option>
            </select>
          </Field>
          <Field label="검토 의견" hint="감사 로그와 보고서에 함께 기록됩니다.">
            <textarea className="input" rows={3} defaultValue="tier70은 통과율이 낮아 다음 라운드에서 제외 검토. 본 run은 상위 200개로 af2 진행." />
          </Field>
        </Modal>
      )}
    </>
  )
}
