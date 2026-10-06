import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, BotMessageSquare, ChevronDown, ChevronRight, Download, ExternalLink,
  FileText, Play, RefreshCw, RotateCcw, ShieldCheck, Square, ThumbsDown, ThumbsUp, Trash2,
} from 'lucide-react'
import { Block, Card, Field, Modal, MoreMenu, PageHead, Progress, Stat, Tabs } from '../components/ui'
import { RunGraph, pipelineGraph, type RunNodeState } from '../components/RunGraph'
import './Monitor.css'
import { Bars, StructureViewer } from '../components/viz'
import {
  ADMIN_ONLY_RUNS, AGENT_DECISION_LABELS, AGENT_EVENTS, ARTIFACT_PREVIEW_TEXT, ARTIFACT_STAGE_LABELS,
  ARTIFACT_STAGE_ORDER, MONITOR_LOG, MONITOR_RUNS, RUN_ARTIFACTS, RUN_MODE_LABELS,
  elapsedMin, minutesText, progressUnitsForRequest, type ArtifactKind, type MonitorRun,
} from '../data/runs'
import { can, gateTitle, roleNote, useRole } from '../data/session'

const RUN_STATE_BADGE: Record<string, { cls: string; text: string }> = {
  running: { cls: 'run', text: '실행중' },
  completed: { cls: 'ok', text: '완료' },
  failed: { cls: 'err', text: '실패' },
  cancelled: { cls: '', text: '취소' },
}

function RunState({ s }: { s: string }) {
  const m = RUN_STATE_BADGE[s] ?? { cls: '', text: s }
  return <span className={'badge ' + m.cls}><i className="dot" />{m.text}</span>
}

const nowTime = () => new Date().toTimeString().slice(0, 8)

const AGENT_STATUS_BADGE: Record<string, string> = { ok: 'ok', warn: 'warn', err: 'err', skip: '' }

const TYPE_LABELS: Record<ArtifactKind, string> = {
  pdb: 'PDB', sdf: 'SDF', fasta: 'FASTA', json: 'JSON', csv: 'CSV',
  svg: 'SVG', png: 'PNG', md: 'Markdown', log: 'LOG', bin: '바이너리',
}

type Confirm = { title: string; body: string; label: string; ok: () => void }

/* 미리보기에서 이미지 자리에 놓는 간단한 목업 차트 */
function MockImage({ name }: { name: string }) {
  const bars = [62, 41, 78, 33, 88, 54, 70]
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, background: 'var(--surface-2)' }}>
      <svg viewBox="0 0 320 140" width="100%" style={{ display: 'block' }}>
        <line x1="34" x2="310" y1="118" y2="118" stroke="#d4d4d8" />
        <line x1="34" x2="34" y1="12" y2="118" stroke="#d4d4d8" />
        {bars.map((v, i) => (
          <rect key={i} x={44 + i * 38} y={118 - v} width="24" height={v} rx="3" fill={i % 2 ? '#6366f1' : '#4f46e5'} />
        ))}
        {[0, 50, 100].map(t => (
          <text key={t} x="28" y={122 - t * 1.06} textAnchor="end" fontSize="12" fill="#71717a">{t}</text>
        ))}
      </svg>
      <div className="faint" style={{ marginTop: 6 }}>{name} (이미지 산출물 인라인 표시)</div>
    </div>
  )
}

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  return (
    <Modal title={c.title} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" onClick={() => { c.ok(); onClose() }}>{c.label}</button>
      </>}>
      <p style={{ margin: 0 }}>{c.body}</p>
    </Modal>
  )
}

/* ===================== /monitor : 실행 목록 ===================== */

export function MonitorList({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const [runs, setRuns] = useState<MonitorRun[]>(MONITOR_RUNS)
  const [showAll, setShowAll] = useState(false)
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const visible = useMemo(() => (showAll ? [...runs, ...ADMIN_ONLY_RUNS] : runs), [runs, showAll])
  const listed = visible.filter(r =>
    !q || r.id.includes(q) || r.name.includes(q) || r.stage.includes(q) || r.owner.includes(q))

  const deleteRun = (r: MonitorRun) => setConfirm({
    title: '실행 삭제', label: '삭제',
    body: `실행 ${r.id} 을 삭제할까요? 되돌릴 수 없습니다. 라운드 연결이 해제되고 캐시된 상태와 해당 실행의 단계별 실행 작업도 함께 삭제됩니다.`,
    ok: () => { setRuns(rs => rs.filter(x => x.id !== r.id)); onToast(`${r.id} 을 삭제했습니다`) },
  })

  return (
    <>
      <PageHead
        title="실행 모니터"
        desc="표에서 실행을 눌러 진행 상황과 산출물을 확인하세요."
        actions={<>
          <button className="btn" onClick={() => onToast('최근 실행 목록을 새로 고쳤습니다')}>
            <RefreshCw size={14} />목록 새로고침
          </button>
          <button className="btn primary" onClick={() => nav('/fast')}><Play size={14} />빠른 실행</button>
        </>}
      />


      <Card title="실행 목록" sub={`${listed.length} / ${visible.length}건`}>
        <div className="row wrap">
          <input className="input" style={{ flex: '1 1 240px' }} value={q} onChange={e => setQ(e.target.value)}
            placeholder="실행 id · 이름 · 단계 · 담당자 검색" />
          <label className="check">
            <input type="checkbox" checked={showAll}
              onChange={e => { setShowAll(e.target.checked); onToast(e.target.checked ? '관리자 전체 실행 보기를 켰습니다' : '내 실행만 표시합니다') }} />
            <span>전체 실행 보기 (관리자)</span>
          </label>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr>
              <th className="no">No.</th><th>실행</th><th>이름</th><th>파이프라인</th><th>단계</th>
              <th>진행률</th><th className="nw">경과 · 남은 시간</th><th className="nw">상태</th><th className="nw">담당</th><th className="nw">갱신</th><th />
            </tr></thead>
            <tbody>
              {listed.map((r, i) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/monitor/${r.id}`)}>
                  <td className="no">{i + 1}</td>
                  <td className="mono">{r.id}</td>
                  <td>{r.name}</td>
                  <td>{RUN_MODE_LABELS[r.mode] ?? String(r.mode)}</td>
                  <td>{r.stage}</td>
                  <td>
                    <div className="col" style={{ gap: 5, minWidth: 110 }}>
                      <span className="mono">{r.progress}%</span>
                      <Progress v={r.progress} />
                    </div>
                  </td>
                  <td className="nw">
                    {r.state === 'running' ? (
                      <div className="col" style={{ gap: 2 }}>
                        <span>{minutesText(elapsedMin(r))} 경과</span>
                        <span className="faint">
                          {r.queue && !r.queueNote ? `남은 시간 약 ${r.queue.estFinishMin}분` : '남은 시간 산출 중'}
                        </span>
                      </div>
                    ) : <span className="muted">-</span>}
                  </td>
                  <td className="nw"><RunState s={r.state} /></td>
                  <td className="nw">{r.owner}</td>
                  <td className="muted nw">{r.updated}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn sm ghost" onClick={e => { e.stopPropagation(); nav(`/monitor/${r.id}`) }}>열기</button>
                      <button className="btn sm ghost danger" onClick={e => { e.stopPropagation(); deleteRun(r) }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!listed.length && <tr><td colSpan={10}><div className="empty">조건에 맞는 실행이 없습니다.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </>
  )
}

/* ===================== /monitor/:id : 실행 하나 ===================== */

export function MonitorDetail({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const run = [...MONITOR_RUNS, ...ADMIN_ONLY_RUNS].find(r => r.id === id)
  const role = useRole()
  const canExec = can(role, 'run_execute')
  const canApprove = can(role, 'checkpoint_approve')

  const [autoPoll, setAutoPoll] = useState(true)
  const [polledAt, setPolledAt] = useState<string | null>(null)
  const [errOpen, setErrOpen] = useState(false)

  const [tab, setTab] = useState<'artifacts' | 'agent' | 'log' | 'request'>('artifacts')
  const [aFilter, setAFilter] = useState('')
  const [aStage, setAStage] = useState('all')
  const [aTier, setATier] = useState('all')
  const [aType, setAType] = useState('all')
  const [picked, setPicked] = useState<string[]>([])
  const [preview, setPreview] = useState<string | null>(null)

  const [logs, setLogs] = useState(MONITOR_LOG)
  const [rerunStage, setRerunStage] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [agentAt, setAgentAt] = useState('09:46:40')

  const artifacts = useMemo(() => RUN_ARTIFACTS.filter(a => a.run === id), [id])
  const stageOpts = useMemo(
    () => ARTIFACT_STAGE_ORDER.filter(s => artifacts.some(a => a.stage === s)),
    [artifacts])
  const typeOpts = useMemo(() => Array.from(new Set(artifacts.map(a => a.kind))), [artifacts])
  const filtered = useMemo(() => artifacts.filter(a => {
    const q = aFilter.trim().toLowerCase()
    if (q && !a.path.toLowerCase().includes(q) && !a.stage.includes(q)) return false
    if (aStage !== 'all' && a.stage !== aStage) return false
    if (aTier !== 'all' && String(a.tier ?? '') !== aTier) return false
    if (aType !== 'all' && a.kind !== aType) return false
    return true
  }), [artifacts, aFilter, aStage, aTier, aType])

  const running = run?.state === 'running'

  const runGraph = useMemo(() => {
    const order = ['msa', 'rfd3', 'bioemu', 'design', 'soluprot', 'af2', 'novelty'] as const
    const labels: Record<string, string> = {
      msa: 'MSA 생성', rfd3: 'RFDiffusion3', bioemu: 'BioEmu', design: 'ProteinMPNN',
      soluprot: 'SoluProt 필터', af2: 'ColabFold', novelty: 'WT Diff',
    }
    const models: Record<string, string> = {
      msa: 'MMseqs2 v15', rfd3: 'rfdiffusion3@1.2.0', bioemu: 'bioemu@1.1', design: 'proteinmpnn@1.0.1',
      soluprot: 'soluprot@1.0', af2: 'colabfold@1.5.5', novelty: 'mmseqs2 v15',
    }
    const cur = order.indexOf((run?.stage ?? '') as typeof order[number])
    return pipelineGraph(order.map((k, i) => ({
      key: k,
      label: labels[k],
      model: models[k],
      state: (run?.state === 'failed' && i === cur ? 'failed'
        : i < cur ? 'done'
          : i === cur ? (run?.state === 'running' ? 'running' : 'queued')
            : 'queued') as RunNodeState,
    })))
  }, [run?.stage, run?.state])

  if (!run) {
    return (
      <>
        <PageHead title="실행 상세" desc="주소의 실행을 찾을 수 없습니다. 목록에서 다시 선택하세요."
          back={{ to: '/monitor', label: '목록으로' }} />
        <Card title="실행 없음">
          <div className="empty">
            {id ? `실행 ${id} 이 없거나 삭제되었습니다.` : '실행이 지정되지 않았습니다.'} 실행 모니터 목록에서 실행을 선택하세요.
          </div>
        </Card>
      </>
    )
  }

  const units = progressUnitsForRequest(run.mode, run.tiers)
  const doneUnits = Math.max(0, Math.min(units.length, Math.round((run.progress / 100) * units.length)))
  const curUnit = run.state === 'running' ? units[Math.min(doneUnits, units.length - 1)] : undefined
  const events = AGENT_EVENTS.filter(e => e.run === run.id)
  const previewArt = artifacts.find(a => a.path === preview)
  const ck = run.checkpoint
  const rerunOpts = ck ? ck.checkpoints.concat(ck.finalStage) : []
  const rerunPick = rerunStage || rerunOpts[0] || ''

  const log = (lvl: string, msg: string) =>
    setLogs(l => [...l, [lvl, nowTime(), msg] as [string, string, string]])
  const poll = () => {
    const t = nowTime()
    setPolledAt(t)
    log('t', `pipeline.status ${run.id} → ${run.stage} / ${run.state}`)
    onToast(`${run.id} 상태를 조회했습니다 (${run.stage} / ${RUN_STATE_BADGE[run.state].text})`)
  }
  const toggleSel = (p: string) => setPicked(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p])
  const feedback = (ev: string, rating: 'good' | 'bad') => {
    setSaved(s => ({ ...s, [ev]: rating === 'good' ? '긍정 평가로 저장되었습니다' : '부정 평가로 저장되었습니다' }))
    log('t', `pipeline.submit_feedback ${ev} rating=${rating}`)
    onToast(`평가를 저장했습니다 (${rating === 'good' ? 'Good' : 'Bad'})`)
  }

  const gateText = !ck ? '' : ck.phase === 'running'
    ? `체크포인트까지 실행 중: ${ck.nextStage}`
    : ck.phase === 'reached'
      ? `${run.stage} 단계에서 체크포인트에 도달했습니다. 결과를 검토하고 다음 동작을 선택하세요.`
      : `최종 단계까지 완료되었습니다: ${ck.finalStage}`

  return (
    <>
      <PageHead
        title={run.id}
        desc="진행률과 실행 제어를 확인하고, 아래 탭에서 산출물과 점검 결과를 보세요."
        back={{ to: '/monitor', label: '목록으로' }}
        actions={<>
          <button className="btn" onClick={() => onToast(`${run.id} 실행 보고서를 엽니다`)}><FileText size={14} />보고서 보기</button>
          <button className="btn" onClick={() => onToast(`${run.id} 에이전트 보고서를 엽니다`)}><BotMessageSquare size={14} />에이전트 보고서 보기</button>
          <button className="btn primary" onClick={poll}><RefreshCw size={14} />즉시 조회</button>
        </>}
      />

      <div className="grid g5">
        <Stat label="진행률" value={`${run.progress}%`} delta={`${doneUnits} / ${units.length} 단위 완료`} />
        <Stat label="현재 단계" value={run.stage} delta={RUN_MODE_LABELS[run.mode] ?? String(run.mode)} />
        <Stat label="평가 점수" value={run.score} delta={`보존도 tier ${run.tiers.length ? run.tiers.join(' · ') : '없음'}`} />
        <Stat label="경과 시간" value={minutesText(elapsedMin(run))}
          delta={`${run.requested.slice(11, 16)} 시작`} />
        <Stat label="남은 시간"
          value={run.queue && !run.queueNote ? `약 ${run.queue.estFinishMin}분` : '-'}
          delta={run.queue && !run.queueNote ? `${run.queue.finishAt} 완료 예상 (근사치)` : '큐 추정 정보 없음'} />
      </div>

      <Card title={run.name} sub={run.detail}
        right={<>
          <span className="badge brand">{RUN_MODE_LABELS[run.mode] ?? String(run.mode)}</span>
          {run.workflow && <span className="badge accent">workflow</span>}
          <RunState s={run.state} />
        </>}>
        <div className="row wrap">
          <span style={{ fontWeight: 600 }}>진행률</span>
          <span className="muted">{curUnit ? `${curUnit.label} 진행 중` : run.state === 'completed' ? '모든 단계 완료' : '진행 없음'}</span>
          <div className="sp" />
          {running && (
            <span className="muted">
              {minutesText(elapsedMin(run))} 경과
              {run.queue && !run.queueNote
                ? ` · 남은 시간 약 ${run.queue.estFinishMin}분 (${run.queue.finishAt} 예상)`
                : ' · 남은 시간 산출 중'}
            </span>
          )}
          <span className="mono" style={{ fontWeight: 600 }}>{run.progress}%</span>
        </div>
        <div style={{ marginTop: 8 }}><Progress v={run.progress} /></div>
        <div style={{ marginTop: 12 }}>
          <RunGraph {...runGraph} height={260} />
        </div>

        {run.error && (
          <>
            <div className="divider" />
            <button className="btn sm ghost" onClick={() => setErrOpen(o => !o)}>
              {errOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}오류 상세
            </button>
            <div className="signal err" style={{ marginTop: 8 }}>
              <span className="ic"><AlertTriangle size={15} color="var(--err)" /></span>
              <div>
                <b>{run.error.summary}</b>
                {errOpen && <pre className="log" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{run.error.raw}</pre>}
              </div>
            </div>
          </>
        )}

        <div className="divider" />

        <div className="row wrap">
          <button className="btn sm" onClick={poll}><RefreshCw size={13} />즉시 조회</button>
          <MoreMenu sm title="실행 제어" items={[
            {
              label: '실행 중지', icon: <Square size={14} />, danger: true,
              disabled: run.state !== 'running' || !canExec,
              note: canExec ? '실행 중일 때만 멈출 수 있습니다' : gateTitle(role, 'run_execute'),
              onClick: () => setConfirm({
                title: '실행 중지', label: '중지 요청',
                body: `실행 ${run.id} 을 중지할까요? RunPod 작업 취소를 요청합니다.`,
                ok: () => { log('w', `pipeline.cancel_run ${run.id}`); onToast(`${run.id} 중지를 요청했습니다 (jobs: 3)`) },
              }),
            },
            {
              label: '실행 재개', icon: <Play size={14} />, disabled: !canExec, note: gateTitle(role, 'run_execute'),
              onClick: () => { log('t', `pipeline.run resume ${run.id}`); onToast(`${run.id} 실행을 재개했습니다`) },
            },
          ]} />
          <div className="sp" />
          <label className="check">
            <input type="checkbox" checked={autoPoll}
              onChange={e => { setAutoPoll(e.target.checked); onToast(e.target.checked ? '자동 조회를 켰습니다 (5초 간격)' : '자동 조회를 껐습니다') }} />
            <span>자동 조회</span>
          </label>
        </div>

        <div className="row wrap" style={{ marginTop: 10 }}>
          <span className="faint">{roleNote(role, ['run_execute', 'checkpoint_approve', 'artifact_download'])}</span>
        </div>

        <div className="divider" />

        <div className="row wrap" style={{ gap: 6 }}>
          <span className={'badge ' + (run.completeness.rfd3 ? 'ok' : 'warn')}>
            {run.completeness.rfd3 ? 'RFD3 준비' : 'RFD3 없음'}
          </span>
          <span className={'badge ' + (run.completeness.bioemu === 'ready' ? 'ok' : run.completeness.bioemu === 'only' ? 'accent' : 'warn')}>
            {run.completeness.bioemu === 'ready' ? 'BioEmu 준비' : run.completeness.bioemu === 'only' ? 'BioEmu 단독' : 'BioEmu 없음'}
          </span>
          <span className={'badge ' + (run.completeness.wtCompare ? 'ok' : '')}>
            WT 비교 {run.completeness.wtCompare ? 'on' : 'off'}
          </span>
          <span className={'badge ' + (run.completeness.af2Selected ? 'accent' : 'warn')}>
            {run.completeness.af2Provider} {run.completeness.af2Selected ? `선정 ${run.completeness.af2Selected}건` : '선정 없음'}
          </span>
        </div>

        <div className="divider" />

        <div className="col" style={{ gap: 16 }}>
        <Block title="실행 메타 정보">
          <dl className="kv">
            <dt>Run ID</dt><dd className="mono">{run.id}</dd>
            <dt>상세</dt><dd>{run.detail}</dd>
            <dt>단계</dt><dd>{run.stage}</dd>
            <dt>상태</dt><dd><RunState s={run.state} /></dd>
            <dt>담당</dt><dd>{run.owner}</dd>
            <dt>요청</dt><dd>{run.requested}</dd>
            <dt>갱신</dt><dd>{polledAt ? `${run.updated} (조회 ${polledAt})` : run.updated}</dd>
            <dt>예상 완료</dt>
            <dd>{run.queue && !run.queueNote ? `약 ${run.queue.estFinishMin}분 후 (${run.queue.finishAt} 예상)` : '산출 중'}</dd>
            <dt>평가 근거</dt><dd>{run.evidence}</dd>
            <dt>권고</dt><dd>{run.recommendation}</dd>
          </dl>
        </Block>

        <Block title="큐 대기 예상" sub="워커 대기열 기반 추정">
          <div className="row wrap">
            <span className="muted">단계별 대기·실행 건수와 예상 완료 시각입니다.</span>
            <div className="sp" />
            <button className="btn sm" onClick={() => { log('t', `pipeline.queue_eta ${run.id}`); onToast('큐 ETA 를 다시 계산했습니다') }}>
              <RefreshCw size={13} />ETA 다시 계산
            </button>
          </div>
          {!run.queue && <div className="empty">이 실행에는 큐 추정 정보가 없습니다.</div>}
          {run.queue && (
            <>
              <div className="signal">
                <span className="ic"><RefreshCw size={15} color="var(--text-3)" /></span>
                <div>
                  {run.queueNote === 'updating' && <b>큐 정보 갱신 중</b>}
                  {run.queueNote === 'pending' && (
                    <b>대기 {run.queue.perStage[0].queued} · 실행 {run.queue.perStage[0].running} (예상 시간 산출 중)</b>
                  )}
                  {!run.queueNote && (
                    <b>현재 단계 {run.queue.currentStage} · {run.queue.perStage[0].queued}건 대기 · 약 {run.queue.estFinishMin}분</b>
                  )}
                  <p>
                    {run.queueNote
                      ? '워커 통계가 모이면 예상 완료 시각이 표시됩니다.'
                      : `예상 완료 ${run.queue.finishAt}${run.queue.approximate ? ' (근사치)' : ''}${run.queue.fallback ? ' · 일부 단계는 대체 추정값' : ''}`}
                  </p>
                </div>
              </div>
              <div className="tbl-wrap" style={{ marginTop: 12 }}>
                <table className="tbl">
                  <thead><tr>
                    <th className="no">No.</th><th>단계</th><th>엔드포인트</th>
                    <th className="num">대기</th><th className="num">실행</th><th className="num">예상 대기</th><th>완료</th><th>비고</th>
                  </tr></thead>
                  <tbody>
                    {run.queue.perStage.map((s, i) => (
                      <tr key={s.stage}>
                        <td className="no">{i + 1}</td>
                        <td>{s.stage}</td>
                        <td className="mono muted">{s.endpoint}</td>
                        <td className="num">{s.queued}</td>
                        <td className="num">{s.running}</td>
                        <td className="num">{s.waitMin ? `${s.waitMin}분` : '-'}</td>
                        <td className="mono">{s.finishAt}</td>
                        <td>{s.fallback ? <span className="badge warn">대체 추정</span>
                          : s.approximate ? <span className="badge">근사치</span> : <span className="badge ok">확정</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Block>
        </div>
      </Card>

      {ck && (
        <Card title="Workflow 검토 게이트" sub={gateText}
          right={<>
            <button className="btn sm" onClick={() => nav('/analyze')}><ExternalLink size={13} />후보 선별 열기</button>
            <button className="btn sm primary" disabled={ck.phase === 'final' || !canApprove}
              title={canApprove ? undefined : gateTitle(role, 'checkpoint_approve')}
              onClick={() => setGateOpen(true)}>
              <Play size={13} />다음 단계 계속
            </button>
          </>}>
          <div className="col" style={{ gap: 16 }}>
            <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
              <dt>체크포인트</dt><dd className="mono">{ck.checkpoints.join(' · ')}</dd>
              <dt>다음 단계</dt><dd className="mono">{ck.nextStage}</dd>
              <dt>최종 단계</dt><dd className="mono">{ck.finalStage}</dd>
            </dl>

            <Block title="단계 되돌리기" sub="앞선 단계부터 다시 돌리려면 단계를 고르고 재실행하세요.">
              <div className="pg-mn-rerun">
                <select className="input" value={rerunPick} onChange={e => setRerunStage(e.target.value)}>
                  {rerunOpts.map(s => <option key={s} value={s}>{s} 단계까지</option>)}
                </select>
                <button className="btn" disabled={!canExec} title={gateTitle(role, 'run_execute')}
                  onClick={() => setConfirm({
                    title: '단계 재실행', label: '재실행',
                    body: `${run.id} 을 ${rerunPick} 단계까지 재실행할까요? 해당 단계 이후 산출물은 새로 생성됩니다.`,
                    ok: () => { log('t', `pipeline.run rerun_to=${rerunPick}`); onToast(`${rerunPick} 단계까지 재실행을 요청했습니다`) },
                  })}><RotateCcw size={14} />재실행</button>
                <div className="sp" />
                <button className="btn" disabled={!canExec} title={gateTitle(role, 'run_execute')}
                  onClick={() => setConfirm({
                    title: 'MMseqs 재실행', label: '재실행',
                    body: `MSA 를 다시 생성하고 ${run.id} 의 보존도 tier 를 재계산할까요? 하위 단계 결과가 모두 무효화됩니다.`,
                    ok: () => { log('w', 'pipeline.run rerun mmseqs'); onToast('MMseqs 재실행을 요청했습니다') },
                  })}><RotateCcw size={14} />MMseqs 부터 다시</button>
              </div>
              <span className="faint">{roleNote(role, ['checkpoint_approve', 'run_execute'])}</span>
            </Block>

            <Block title="단계별 산출물 수" sub="체크포인트까지 생성된 수량">
              {ck.counts.length
                ? <Bars data={ck.counts.map(c => ({ label: ARTIFACT_STAGE_LABELS[c.label] ?? c.label, value: c.value }))} unit="개" />
                : <div className="empty">아직 산출물 수가 없습니다. 체크포인트 후 산출물을 새로 고치세요.</div>}
            </Block>

            <Block title="체크포인트 결과" sub="항목을 누르면 산출물 미리보기가 열립니다.">
              {ck.panelDisabled
                ? <div className="empty">체크포인트 결과 패널이 설정에서 비활성화되어 있습니다.</div>
                : ck.results.length ? (
                  <div className="col" style={{ gap: 8 }}>
                    <div className="muted">지금까지 {ck.results.length}개 산출물이 생성되었습니다.</div>
                    <div className="tbl-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <table className="tbl">
                        <thead><tr><th className="no">No.</th><th>경로</th><th>형식</th></tr></thead>
                        <tbody>
                          {ck.results.map((r, i) => (
                            <tr key={r.path} style={{ cursor: 'pointer' }}
                              onClick={() => { setPreview(r.path); setTab('artifacts'); onToast(`${r.path} 미리보기`) }}>
                              <td className="no">{i + 1}</td>
                              <td className="mono">{r.path}</td>
                              <td className="muted">{TYPE_LABELS[r.kind]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : <div className="empty">아직 결과 산출물이 없습니다.</div>}
            </Block>
          </div>
        </Card>
      )}

      <Card flush>
        <div style={{ padding: '12px 18px 0' }}>
          <Tabs items={[
            { key: 'artifacts', label: `산출물 (${artifacts.length})` },
            { key: 'agent', label: `Evidence Agent Panel (${events.length})` },
            { key: 'log', label: '활동 로그' },
            { key: 'request', label: '실행 파라미터' },
          ]} value={tab} onChange={setTab} />
        </div>
        <div style={{ padding: '0 18px 18px' }}>
          {tab === 'artifacts' && (
            <div className="col" style={{ gap: 16 }}>
              <div className="grid g4">
                <Field label="이름 · 단계 검색">
                  <input className="input" value={aFilter} onChange={e => setAFilter(e.target.value)} placeholder="이름 또는 단계로 필터" />
                </Field>
                <Field label="단계">
                  <select className="input" value={aStage} onChange={e => setAStage(e.target.value)}>
                    <option value="all">전체 단계</option>
                    {stageOpts.map(s => <option key={s} value={s}>{ARTIFACT_STAGE_LABELS[s]} ({s})</option>)}
                  </select>
                </Field>
                <Field label="보존도 tier">
                  <select className="input" value={aTier} onChange={e => setATier(e.target.value)}>
                    <option value="all">전체 보존도</option>
                    {[30, 50, 70].map(t => <option key={t} value={String(t)}>tier{t}</option>)}
                  </select>
                </Field>
                <Field label="형식">
                  <select className="input" value={aType} onChange={e => setAType(e.target.value)}>
                    <option value="all">전체 형식</option>
                    {typeOpts.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </Field>
              </div>

              <div className="row wrap">
                <span className="muted">{picked.length} / {filtered.length} 선택</span>
                <button className="btn sm primary" disabled={!picked.length}
                  onClick={() => onToast(`선택한 ${picked.length}개 파일을 ZIP 으로 내려받습니다`)}>
                  <Download size={13} />선택 ZIP 다운로드
                </button>
                <div className="sp" />
                <MoreMenu sm items={[
                  { label: '필터된 파일 모두 선택', onClick: () => setPicked(filtered.map(a => a.path)) },
                  { label: '선택 해제', disabled: !picked.length, note: '선택한 파일이 없습니다', onClick: () => setPicked([]) },
                  {
                    label: '목록 새로 고침', icon: <RefreshCw size={14} />,
                    onClick: () => { log('t', `pipeline.list_artifacts ${run.id}`); onToast('산출물 목록을 새로 고쳤습니다') },
                  },
                ]} />
              </div>

              <div className="grid g-2-1">
                <div className="tbl-wrap" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                  <table className="tbl">
                    <thead><tr>
                      <th className="no">No.</th><th>선택</th><th>이름</th><th>단계</th><th>tier</th>
                      <th>형식</th><th className="num">크기</th><th>갱신</th><th />
                    </tr></thead>
                    <tbody>
                      {filtered.map((a, i) => (
                        <tr key={a.path} className={preview === a.path ? 'sel' : ''}>
                          <td className="no">{i + 1}</td>
                          <td>
                            <label className="check">
                              <input type="checkbox" checked={picked.includes(a.path)} onChange={() => toggleSel(a.path)} />
                            </label>
                          </td>
                          <td className="mono" style={{ cursor: 'pointer' }} onClick={() => setPreview(a.path)}>
                            {a.path}{a.rep && <span className="badge brand" style={{ marginLeft: 6 }}>대표</span>}
                          </td>
                          <td className="muted">{ARTIFACT_STAGE_LABELS[a.stage] ?? a.stage}</td>
                          <td className="mono muted">{a.tier ? `tier${a.tier}` : '-'}</td>
                          <td>{TYPE_LABELS[a.kind]}</td>
                          <td className="num">{a.size}</td>
                          <td className="muted">{a.updated}</td>
                          <td><button className="btn sm ghost" onClick={() => onToast(`${a.path} 다운로드`)}><Download size={13} /></button></td>
                        </tr>
                      ))}
                      {!filtered.length && <tr><td colSpan={9}><div className="empty">조건에 맞는 산출물이 없습니다.</div></td></tr>}
                    </tbody>
                  </table>
                </div>

                <div className="col" style={{ gap: 16 }}>
                  <Block title="산출물 미리보기" sub={previewArt ? TYPE_LABELS[previewArt.kind] : '선택 없음'}>
                    {!previewArt && <div className="empty">목록에서 산출물을 선택하세요.</div>}
                    {previewArt && (previewArt.kind === 'pdb' || previewArt.kind === 'sdf') && (
                      <StructureViewer label={previewArt.path} seed={previewArt.path.length % 9} height={240}
                        overlay={`${ARTIFACT_STAGE_LABELS[previewArt.stage]} · cartoon spectrum`} />
                    )}
                    {previewArt && (previewArt.kind === 'svg' || previewArt.kind === 'png') && (
                      <MockImage name={previewArt.path} />
                    )}
                    {previewArt && ['json', 'csv', 'fasta', 'md', 'log'].includes(previewArt.kind) && (
                      <pre className="log" style={{ whiteSpace: 'pre-wrap' }}>
                        {ARTIFACT_PREVIEW_TEXT[previewArt.kind] ?? '(내용 없음)'}
                      </pre>
                    )}
                    {previewArt && previewArt.kind === 'bin' && (
                      <div className="empty">바이너리 파일은 미리보기가 제한됩니다. 다운로드 후 확인하세요.</div>
                    )}
                    {previewArt && (
                      <div className="row wrap" style={{ marginTop: 12 }}>
                        <span className="mono muted">{previewArt.size}</span>
                        <div className="sp" />
                        <button className="btn sm" onClick={() => onToast(`${previewArt.path} 다운로드`)}><Download size={13} />다운로드</button>
                      </div>
                    )}
                  </Block>
                  <Card title="비교 기능 위치" sub="Analyze 로 이동">
                    <p className="muted" style={{ margin: 0 }}>
                      실행 간 지표·구조·서열 비교는 결과 분석 화면으로 옮겨졌습니다. 후보 랭킹과 보고서 생성도 함께 제공됩니다.
                    </p>
                    <div className="row wrap" style={{ marginTop: 12 }}>
                      <button className="btn sm" onClick={() => nav(`/analyze?run=${run.id}`)}><ExternalLink size={13} />후보 선별</button>
                      <button className="btn sm" onClick={() => nav(`/analyze/compare?run=${run.id}`)}><ExternalLink size={13} />구조 비교</button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {tab === 'agent' && (
            <div className="col" style={{ gap: 16 }}>
              <div className="row wrap">
                <span className="muted">
                  {events.length ? `에이전트 이벤트 ${events.length}건 · 최근 갱신 ${agentAt}` : '이 실행에는 에이전트 이벤트가 없습니다.'}
                </span>
                <div className="sp" />
                <button className="btn sm" onClick={() => { setAgentAt(nowTime()); log('t', `pipeline.list_agent_events ${run.id}`); onToast('에이전트 이벤트를 새로 고쳤습니다') }}>
                  <RefreshCw size={13} />새로고침
                </button>
                <button className="btn sm" onClick={() => onToast(`${run.id} 실행 보고서를 엽니다`)}><FileText size={13} />보고서 보기</button>
                <button className="btn sm" onClick={() => onToast(`${run.id} 에이전트 보고서를 엽니다`)}><BotMessageSquare size={13} />에이전트 보고서 보기</button>
              </div>
              <p className="muted" style={{ margin: 0 }}>단계별 전문가 점검 결과, 복구 메모, 보고서 링크를 모아 보여줍니다.</p>

              {!events.length && <div className="empty">표시할 에이전트 이벤트가 없습니다.</div>}
              {events.map(ev => {
                const dec = AGENT_DECISION_LABELS[ev.decision]
                return (
                  <Card key={ev.id} title={`${ev.stage} 단계 점검`} sub={ev.createdAt}
                    right={<>
                      <span className={'badge ' + dec.cls}>{dec.text}</span>
                      <span className="muted">신뢰도 {ev.confidence.toFixed(2)}</span>
                    </>}>
                    <div className="row wrap" style={{ gap: 6 }}>
                      {ev.agents.map(a => (
                        <span key={a.name} className={'badge ' + AGENT_STATUS_BADGE[a.status]}>
                          <span className="mono">{a.name}:{a.status}</span>
                        </span>
                      ))}
                    </div>
                    <div className="divider" />
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th className="no">No.</th><th>에이전트</th><th>요약</th></tr></thead>
                        <tbody>
                          {ev.summaries.map((s, i) => (
                            <tr key={s.name}>
                              <td className="no">{i + 1}</td>
                              <td>{s.name}</td>
                              <td>{s.text}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="divider" />
                    <dl className="kv">
                      <dt>근거</dt><dd>{ev.rationale}</dd>
                      <dt>해석</dt><dd>{ev.interpretation}</dd>
                      {ev.error && <><dt>오류</dt><dd className="mono">{ev.error}</dd></>}
                    </dl>
                    <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>
                      {ev.actions.map(a => (
                        <button key={a} className="chip" onClick={() => onToast(`권장 조치 적용: ${a}`)}>{a}</button>
                      ))}
                    </div>
                    <div className="divider" />
                    <div className="row wrap">
                      <input className="input" style={{ flex: '1 1 240px' }} value={notes[ev.id] ?? ''}
                        onChange={e => setNotes(n => ({ ...n, [ev.id]: e.target.value }))}
                        placeholder="평가 메모 (선택)" />
                      <button className="btn sm" onClick={() => feedback(ev.id, 'good')}><ThumbsUp size={13} />Good</button>
                      <button className="btn sm" onClick={() => feedback(ev.id, 'bad')}><ThumbsDown size={13} />Bad</button>
                      {saved[ev.id] && <span className="badge ok">{saved[ev.id]}</span>}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {tab === 'log' && (
            <div className="col" style={{ gap: 12 }}>
              <div className="row">
                <span className="muted">활동 로그 {logs.length}건</span>
                <div className="sp" />
                <button className="btn sm" onClick={() => { setLogs([]); onToast('활동 로그를 비웠습니다') }}>비우기</button>
              </div>
              {logs.length
                ? <div className="log">
                  {logs.map(([lvl, t, msg], i) => (
                    <div key={i}><span className="t">{t}</span> <span className={lvl}>{msg}</span></div>
                  ))}
                </div>
                : <div className="empty">기록된 활동이 없습니다.</div>}
            </div>
          )}

          {tab === 'request' && (
            <div className="col" style={{ gap: 12 }}>
              <div className="row">
                <span className="muted">{run.id} 실행 요청 (request.json)</span>
                <div className="sp" />
                <button className="btn sm" onClick={() => onToast('request.json 을 내려받습니다')}><Download size={13} />다운로드</button>
              </div>
              <pre className="log" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(run.request, null, 2)}</pre>
            </div>
          )}
        </div>
      </Card>

      {gateOpen && ck && (
        <Modal title={`체크포인트 검토 · ${run.stage}`} onClose={() => setGateOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setGateOpen(false)}>취소</button>
            <button className="btn primary" disabled={!canApprove} title={gateTitle(role, 'checkpoint_approve')}
              onClick={() => {
                setGateOpen(false)
                log('o', `pipeline.run continue from ${ck.nextStage}`)
                onToast(`${ck.nextStage} 단계로 계속 진행합니다`)
              }}><Play size={14} />승인하고 계속</button>
          </>}>
          <div className="signal warn">
            <span className="ic"><ShieldCheck size={15} color="var(--warn)" /></span>
            <div>
              <b>{gateText}</b>
              <p>{run.recommendation}</p>
            </div>
          </div>
          <dl className="kv">
            <dt>다음 단계</dt><dd className="mono">{ck.nextStage}</dd>
            <dt>최종 단계</dt><dd className="mono">{ck.finalStage}</dd>
            <dt>평가 근거</dt><dd>{run.evidence}</dd>
          </dl>
          <Field label="다음 단계로 넘길 후보 범위">
            <select className="input" defaultValue="top200">
              <option value="all">통과 후보 전체</option>
              <option value="top200">가중 점수 상위 200개</option>
              <option value="tier">tier30 · tier50 만</option>
            </select>
          </Field>
          <Field label="검토 의견" hint="감사 로그와 보고서에 함께 기록됩니다.">
            <textarea className="input" rows={3} defaultValue="tier70 은 통과율이 낮아 다음 라운드에서 제외 검토. 본 실행은 상위 200개로 af2 진행." />
          </Field>
        </Modal>
      )}

      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </>
  )
}
