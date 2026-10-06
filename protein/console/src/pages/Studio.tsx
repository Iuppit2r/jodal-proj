import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Download, ExternalLink, FlaskConical, Play, Plus, RefreshCw,
  RotateCcw, Settings2, Sparkles, Square, Trash2,
} from 'lucide-react'
import { Block, Card, Field, Modal, MoreMenu, PageHead, Tabs } from '../components/ui'
import { StructureViewer } from '../components/viz'
import {
  ARTIFACT_PREVIEW_TEXT, ARTIFACT_STAGE_LABELS, MONITOR_RUNS, RUN_ARTIFACTS, STUDIO_RERUN_NOTES,
  STUDIO_SESSIONS, STUDIO_STAGE_CHECKS, STUDIO_STAGE_FIELDS, STUDIO_STAGE_META, STUDIO_STAGE_ORDER,
  STUDIO_STATUS_LABELS, type StudioField, type StudioSession, type StudioStageKey,
} from '../data/runs'

/* studio 단계 → 산출물 단계 매핑 */
const STAGE_ARTIFACTS: Record<StudioStageKey, string[]> = {
  msa: ['msa', 'conservation'],
  rfd3: ['rfd3', 'input_reference', 'pdb_preprocess'],
  bioemu: ['bioemu', 'working_backbone'],
  design: ['design', 'mask_consensus', 'ligand_mask', 'surface_mask'],
  soluprot: ['soluprot', 'surrogate'],
  af2: ['af2', 'af2_target', 'wt_af2'],
  novelty: ['novelty', 'wt', 'evolution'],
}

const TYPE_LABELS: Record<string, string> = {
  pdb: 'PDB', sdf: 'SDF', fasta: 'FASTA', json: 'JSON', csv: 'CSV',
  svg: 'SVG', png: 'PNG', md: 'Markdown', log: 'LOG', bin: '바이너리',
}

const nowTime = () => new Date().toTimeString().slice(0, 8)
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

/* 목록 화면과 상세 화면이 같은 작업 목록을 보도록 모듈 수준에 둔다 (시안용) */
let SESSION_STORE: StudioSession[] = STUDIO_SESSIONS

function defaults() {
  const out: Record<string, string | boolean> = {}
  for (const stage of STUDIO_STAGE_ORDER) {
    for (const f of STUDIO_STAGE_FIELDS[stage]) out[f.key] = f.def
  }
  return out
}

/* 필드가 속한 단계 인덱스 */
const FIELD_STAGE: Record<string, number> = {}
STUDIO_STAGE_ORDER.forEach((s, i) => STUDIO_STAGE_FIELDS[s].forEach(f => { FIELD_STAGE[f.key] = i }))

function stageLabelOf(s: StudioSession, k: StudioStageKey) {
  const row = s.stages.find(x => x.key === k)
  if (!row) return STUDIO_STATUS_LABELS.ready
  return STUDIO_STATUS_LABELS[row.included ? row.status : 'excluded']
}

type Confirm = { title: string; body: string; label: string; ok: () => void }

/* ------------------------------------------------------------------ */
/* /workflow : 단계별 실행 작업 목록                                               */
/* ------------------------------------------------------------------ */
export function StudioList({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const [sessions, setSessions] = useState<StudioSession[]>(SESSION_STORE)
  const [keep, setKeep] = useState(SESSION_STORE[0]?.id ?? '')
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const commit = (next: StudioSession[]) => { SESSION_STORE = next; setSessions(next) }

  const createSession = () => {
    const id = `ws_new_${sessions.length + 1}`
    const fresh: StudioSession = {
      id, name: `새 작업 ${sessions.length + 1}`, run: 'run_0421',
      headStage: 'msa', nextStage: 'msa', updated: nowStamp(),
      stages: STUDIO_STAGE_ORDER.map(k => ({ key: k, status: 'ready', included: true, artifacts: 0, note: '대기' })),
      history: [],
    }
    commit([fresh, ...sessions])
    onToast('작업을 만들었습니다')
    nav(`/workflow/${id}`)
  }

  return (
    <>
      <PageHead
        title="단계별 실행"
        desc="이어서 할 작업을 고르거나 새 작업을 만드세요."
        actions={<>
          <button className="btn primary" onClick={createSession}><Plus size={14} />작업 만들기</button>
          <MoreMenu items={[
            { label: '목록 새로 고침', icon: <RefreshCw size={14} />, onClick: () => onToast(`작업 목록 새로고침, ${sessions.length}건 확인`) },
            { label: '실행 모니터 열기', icon: <ExternalLink size={14} />, onClick: () => nav('/monitor') },
          ]} />
        </>}
      />

      <Card title="작업" sub={`${sessions.length}건`} flush>
        {sessions.length === 0 ? (
          <div style={{ padding: 18 }}><div className="empty">저장된 작업이 없습니다. 단계별로 진행할 작업을 만드세요.</div></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>
                <th className="no">No.</th><th>작업</th><th>연결 실행</th><th>현재 단계</th><th>상태</th><th>갱신</th><th />
              </tr></thead>
              <tbody>
                {sessions.map((s, i) => {
                  const st = stageLabelOf(s, s.headStage)
                  return (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/workflow/${s.id}`)}>
                      <td className="no">{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div className="mono muted">{s.id}</div>
                      </td>
                      <td className="mono">{s.run}</td>
                      <td>{STUDIO_STAGE_META[s.headStage].label}</td>
                      <td><span className={'badge ' + st.cls}><i className="dot" />{st.text}</span></td>
                      <td className="muted">{s.updated}</td>
                      <td>
                        <button className="btn sm danger" onClick={e => {
                          e.stopPropagation()
                          setConfirm({
                            title: '작업 삭제', label: '삭제',
                            body: `작업 ${s.name} 을 삭제할까요? 저장된 단계 입력과 이력이 함께 삭제됩니다.`,
                            ok: () => {
                              const rest = sessions.filter(x => x.id !== s.id)
                              commit(rest)
                              if (keep === s.id) setKeep(rest[0]?.id ?? '')
                              onToast('작업을 삭제했습니다')
                            },
                          })
                        }}><Trash2 size={13} />삭제</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="작업 정리">
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g2">
            <Field label="남길 작업" hint="선택한 작업 외 전부 삭제">
              <select className="input" value={keep} onChange={e => setKeep(e.target.value)}>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name} · {s.run}</option>)}
              </select>
            </Field>
          </div>
          <div className="row wrap">
            <button className="btn" disabled={sessions.length <= 1} onClick={() => setConfirm({
              title: '다른 작업 삭제', label: '삭제',
              body: `선택한 작업을 제외한 ${sessions.length - 1}개 작업을 모두 삭제할까요?`,
              ok: () => {
                const only = sessions.filter(s => s.id === keep)
                commit(only.length ? only : sessions.slice(0, 1))
                onToast(`${sessions.length - 1}개 작업을 삭제했습니다`)
              },
            })}>다른 작업 삭제</button>
            <button className="btn" onClick={() => setConfirm({
              title: '중복 작업 정리', label: '정리',
              body: '같은 기준 실행을 가리키는 중복 작업을 하나만 남기고 정리할까요?',
              ok: () => {
                const seen = new Set<string>()
                const kept = sessions.filter(s => (seen.has(s.run) ? false : (seen.add(s.run), true)))
                const removed = sessions.length - kept.length
                commit(kept)
                if (!kept.some(s => s.id === keep)) setKeep(kept[0]?.id ?? '')
                onToast(removed ? `중복 작업 ${removed}건을 정리했습니다` : '정리할 중복 작업이 없습니다')
              },
            })}>중복 정리</button>
          </div>
        </div>
      </Card>

      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* /workflow/:id : 작업 하나의 단계 진행                                */
/* ------------------------------------------------------------------ */
export function StudioDetail({ onToast }: { onToast: (m: string) => void }) {
  const { id } = useParams()
  const found = SESSION_STORE.find(s => s.id === id)

  if (!found) {
    return (
      <>
        <PageHead title="단계별 실행" desc="주소의 작업을 찾지 못했습니다. 목록에서 다시 고르세요."
          back={{ to: '/workflow', label: '목록으로' }} />
        <Card><div className="empty">작업 {id ?? '(없음)'} 을 찾을 수 없습니다.</div></Card>
      </>
    )
  }
  return <StudioDetailBody key={found.id} sid={found.id} onToast={onToast} />
}

function StudioDetailBody({ sid, onToast }: { sid: string; onToast: (m: string) => void }) {
  const nav = useNavigate()
  const [session, setSession] = useState<StudioSession>(
    () => SESSION_STORE.find(s => s.id === sid) as StudioSession,
  )
  const [stage, setStage] = useState<StudioStageKey>(session.headStage)
  const [vals, setVals] = useState<Record<string, string | boolean>>(defaults)
  const [changed, setChanged] = useState<string[]>([])
  const [tab, setTab] = useState<'inputs' | 'results' | 'history'>('inputs')
  const [preview, setPreview] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [picker, setPicker] = useState(false)
  const [pickerSel, setPickerSel] = useState<number[]>([65, 66, 67])

  const run = MONITOR_RUNS.find(r => r.id === session.run)
  const stageRow = session.stages.find(s => s.key === stage)
  const meta = STUDIO_STAGE_META[stage]
  const check = STUDIO_STAGE_CHECKS[stage]
  const stageIdx = STUDIO_STAGE_ORDER.indexOf(stage)
  const nextStage = STUDIO_STAGE_ORDER[Math.min(stageIdx + 1, STUDIO_STAGE_ORDER.length - 1)]

  /* 작업 변경은 모듈 저장소에도 반영해 목록 화면과 값을 맞춘다 */
  const patch = (next: StudioSession) => {
    SESSION_STORE = SESSION_STORE.map(s => (s.id === next.id ? next : s))
    setSession(next)
  }

  const fields = useMemo(() => STUDIO_STAGE_FIELDS[stage].filter(f => {
    if (f.modes && !f.modes.includes(String(vals.rfd3_mode))) return false
    if (f.when && vals[f.when] !== true) return false
    return true
  }), [stage, vals])

  const arts = useMemo(() => {
    const allow = STAGE_ARTIFACTS[stage]
    return RUN_ARTIFACTS.filter(a => a.run === session.run && allow.includes(a.stage))
  }, [session.run, stage])
  const rep = arts.find(a => a.rep) ?? arts[0]
  const previewArt = arts.find(a => a.path === preview) ?? rep

  /* 재실행 판단 안내문 */
  const note = useMemo(() => {
    const upstream = changed.map(k => FIELD_STAGE[k]).filter(i => i < stageIdx)
    if (!upstream.length) return STUDIO_RERUN_NOTES.reuse
    const min = Math.min(...upstream)
    if (min === 0) return STUDIO_RERUN_NOTES.forkMsa
    return STUDIO_RERUN_NOTES.restart(STUDIO_STAGE_META[STUDIO_STAGE_ORDER[min]].label)
  }, [changed, stageIdx])

  const set = (k: string, v: string | boolean) => {
    setVals(o => ({ ...o, [k]: v }))
    setChanged(c => c.includes(k) ? c : [...c, k])
  }

  const setStatus = (key: StudioStageKey, p: Partial<StudioSession['stages'][number]>) =>
    patch({ ...session, stages: session.stages.map(st => st.key === key ? { ...st, ...p } : st) })

  const runStage = () => {
    if (check.state === 'blocked') { onToast('차단 항목을 해결한 뒤 이 단계를 실행할 수 있습니다'); return }
    setRunning(true)
    patch({
      ...session,
      stages: session.stages.map(st => st.key === stage ? { ...st, status: 'starting' } : st),
      history: [{ at: nowTime(), stage, status: 'starting', note }, ...session.history],
    })
    onToast(`${meta.label} 단계 실행을 요청했습니다 (pipeline.run)`)
  }

  return (
    <>
      <PageHead
        title={session.name}
        desc="단계를 하나씩 실행하고 결과를 확인한 뒤 다음으로 넘어가세요."
        back={{ to: '/workflow', label: '목록으로' }}
        actions={<>
          <button className="btn" onClick={() => nav('/monitor')}><ExternalLink size={14} />실행 모니터 열기</button>
          <button className="btn" onClick={() => { setChanged([]); onToast('작업 상태를 새로 고쳤습니다') }}>
            <RefreshCw size={14} />새로고침
          </button>
        </>}
      />

      <Card title="작업 요약" sub={`선택 단계 ${meta.label}`}
        right={<span className="badge brand">{session.id}</span>}>
        <div className="col" style={{ gap: 16 }}>
          {/* 자주 쓰는 셋만 두고 나머지는 더보기로 넘긴다. */}
          <div className="row wrap">
            <button className="btn primary" disabled={running} onClick={runStage}><Play size={14} />이 단계 실행</button>
            <button className="btn" disabled={!running} onClick={() => {
              setRunning(false); setStatus(stage, { status: 'stopped' }); onToast('실행 중지를 요청했습니다')
            }}><Square size={14} />실행 중지</button>
            <button className="btn" onClick={() => { setStage(nextStage); setPreview(null); onToast(`다음 단계 ${STUDIO_STAGE_META[nextStage].label} 로 이동했습니다`) }}>
              다음 단계: {STUDIO_STAGE_META[nextStage].label}
            </button>
            <div className="sp" />
            <MoreMenu items={[
              {
                label: '실행 재개', icon: <RotateCcw size={14} />, disabled: running,
                note: '이미 실행 중입니다',
                onClick: () => { setRunning(true); setStatus(stage, { status: 'running' }); onToast('실행을 재개했습니다') },
              },
              {
                label: '현재 실행을 기준 실행으로 적용', icon: <Sparkles size={14} />,
                onClick: () => onToast(`현재 실행 ${session.run} 을 이 작업의 기준 실행으로 적용했습니다`),
              },
              { label: '고급 설정으로 이동', icon: <Settings2 size={14} />, onClick: () => nav('/setup') },
            ]} />
          </div>

          <div className="grid g2">
            <Field label="기준 실행" hint="단계 입력과 산출물을 가져오는 실행">
              <select className="input" value={session.run}
                onChange={e => { patch({ ...session, run: e.target.value }); setPreview(null) }}>
                {MONITOR_RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
              </select>
            </Field>
            <Field label="선택 단계" hint="아래 단계 표에서 행을 눌러 바꿀 수 있습니다">
              <select className="input" value={stage}
                onChange={e => { setStage(e.target.value as StudioStageKey); setPreview(null) }}>
                {STUDIO_STAGE_ORDER.map(k => <option key={k} value={k}>{STUDIO_STAGE_META[k].label}</option>)}
              </select>
            </Field>
          </div>

          <dl className="kv">
            <dt>현재 단계</dt><dd className="mono">{session.headStage}</dd>
            <dt>다음 실행</dt><dd className="mono">{session.nextStage}</dd>
            <dt>갱신</dt><dd>{session.updated}</dd>
          </dl>

          <Block title="실행 상태 상세">
            {!run && <div className="empty">상태 갱신 대기 중입니다.</div>}
            {run && (
              <dl className="kv">
                <dt>실행</dt><dd className="mono">{run.id}</dd>
                <dt>Backend Stage</dt><dd>{run.stage}</dd>
                <dt>Requested</dt><dd>{run.requested}</dd>
                <dt>Updated</dt><dd>{run.updated}</dd>
                <dt>State</dt><dd><span className={'badge ' + (run.state === 'running' ? 'run' : run.state === 'completed' ? 'ok' : run.state === 'failed' ? 'err' : '')}>
                  <i className="dot" />{run.state}
                </span></dd>
              </dl>
            )}
          </Block>
        </div>
      </Card>

      <Card title="단계" sub="행을 누르면 아래 입력·결과가 그 단계로 바뀝니다" flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="no">No.</th><th>단계</th><th>모델</th><th>상태</th>
              <th className="num">산출물</th><th>메모</th><th>포함</th>
            </tr></thead>
            <tbody>
              {session.stages.map((row, i) => {
                const s = stageLabelOf(session, row.key)
                return (
                  <tr key={row.key} className={row.key === stage ? 'sel' : ''}
                    style={{ cursor: 'pointer' }} onClick={() => { setStage(row.key); setPreview(null) }}>
                    <td className="no">{i + 1}</td>
                    <td><span className="mono" style={{ fontWeight: 600 }}>{row.key}</span></td>
                    <td className="muted">{STUDIO_STAGE_META[row.key].model}</td>
                    <td><span className={'badge ' + s.cls}><i className="dot" />{s.text}</span></td>
                    <td className="num">{row.artifacts}</td>
                    <td className="muted">{row.note}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <label className="check">
                        <input type="checkbox" checked={row.included} onChange={e => {
                          setStatus(row.key, { included: e.target.checked })
                          onToast(`${row.key} 단계를 ${e.target.checked ? '포함' : '제외'}했습니다`)
                        }} />
                        <span>{row.included ? '포함' : '제외'}</span>
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 18px 16px' }}>
          <p className="muted" style={{ margin: 0 }}>제외한 단계는 건너뜁니다. 하위 단계는 남은 백본을 사용합니다.</p>
        </div>
      </Card>

      <Card flush>
        <div style={{ padding: '12px 18px 0' }}>
          <Tabs items={[
            { key: 'inputs', label: `${meta.label} 입력` },
            { key: 'results', label: `${meta.label} 결과 (${arts.length})` },
            { key: 'history', label: `이력 (${session.history.length})` },
          ]} value={tab} onChange={setTab} />
        </div>
        <div style={{ padding: '0 18px 18px' }}>
          {tab === 'inputs' && (
            <div className="col" style={{ gap: 16 }}>
              <p className="muted" style={{ margin: 0 }}>{meta.desc}</p>
              <div className="grid g2">
                {fields.map(f => <StudioInput key={f.key} f={f} v={vals[f.key]} onChange={set} />)}
              </div>
              {stage === 'design' && (
                <div className="row wrap">
                  <button className="btn sm" onClick={() => setPicker(true)}><FlaskConical size={13} />잔기 선택기 열기</button>
                  <span className="muted">선택된 잔기 {pickerSel.length}개</span>
                </div>
              )}
              <div className="row wrap">
                <button className="btn sm" onClick={() => {
                  setVals(defaults()); setChanged([]); onToast('이 단계 입력을 기본값으로 되돌렸습니다')
                }}><RotateCcw size={13} />입력 초기화</button>
                <button className="btn sm" onClick={() => onToast('작업 입력을 저장했습니다 (pipeline.save_workflow_session)')}>
                  저장
                </button>
                {changed.length > 0 && <span className="badge warn">변경 {changed.length}개</span>}
              </div>

              <Block title="단계 점검" sub={check.state === 'ok' ? '실행 준비 완료' : check.state === 'loading' ? '점검 중' : check.state === 'failed' ? '점검 실패' : '해결할 항목 있음'}>
                <div className="col" style={{ gap: 8 }}>
                  <div className={'signal ' + (check.state === 'ok' ? 'ok' : check.state === 'blocked' ? 'err' : '')}>
                    <span className="ic">{check.state === 'ok'
                      ? <CheckCircle2 size={15} color="var(--ok)" />
                      : <AlertTriangle size={15} color="var(--err)" />}</span>
                    <div>
                      <b>{check.state === 'ok'
                        ? '이 단계는 실행할 준비가 되었습니다.'
                        : check.state === 'loading'
                          ? '점검 중입니다.'
                          : check.state === 'failed'
                            ? '점검을 수행하지 못했습니다.'
                            : '아래 항목을 해결한 뒤 이 단계를 실행하세요.'}</b>
                      <p>총 {check.editor.length + check.required.length + check.blocking.length + check.warnings.length}건의 점검 항목이 있습니다.</p>
                    </div>
                  </div>
                  <div className="divider" />
                  {([
                    ['편집기 오류', check.editor, 'err'],
                    ['필수 입력', check.required, 'warn'],
                    ['차단 항목', check.blocking, 'err'],
                    ['경고', check.warnings, 'warn'],
                  ] as [string, string[], string][]).map(([label, items, cls]) => (
                    <div key={label} className="col" style={{ gap: 6, marginTop: 8 }}>
                      <div className="row">
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span className={'badge ' + (items.length ? cls : '')}>{items.length}건</span>
                      </div>
                      {items.length
                        ? items.map(t => <p key={t} className="muted" style={{ margin: 0 }}>{t}</p>)
                        : <p className="faint" style={{ margin: 0 }}>해당 항목 없음</p>}
                    </div>
                  ))}
                  <div className="divider" />
                  <button className="btn sm" onClick={() => onToast(`${meta.label} 단계 점검을 다시 실행했습니다 (pipeline.preflight)`)}>
                    <RefreshCw size={13} />다시 점검
                  </button>
                </div>
              </Block>

              <Block title="재실행 판단">
                <div className="col" style={{ gap: 8 }}>
                  <p style={{ margin: 0 }}>{note}</p>
                  {changed.length > 0 && (
                    <>
                      <div className="divider" />
                      <div className="muted" style={{ fontWeight: 500 }}>변경된 입력</div>
                      <div className="row wrap" style={{ gap: 6 }}>
                        {changed.map(k => <span key={k} className="badge warn"><span className="mono">{k}</span></span>)}
                      </div>
                    </>
                  )}
                </div>
              </Block>
            </div>
          )}

          {tab === 'results' && (
            <div className="col" style={{ gap: 16 }}>
              <div className="col" style={{ gap: 12 }}>
                {!arts.length && (
                  <div className="empty">
                    {stageRow && stageRow.status === 'ready'
                      ? '이 단계는 현재 기준 실행에서 돌지 않았습니다.'
                      : '이 단계의 결과 산출물이 아직 없습니다.'}
                  </div>
                )}
                {arts.length > 0 && (
                  <>
                    <div className="row wrap">
                      <span className="muted">{arts.length}개 파일</span>
                      <div className="sp" />
                      <div className="field" style={{ flex: '0 1 260px' }}>
                        <select className="input" value={previewArt?.path ?? ''} onChange={e => setPreview(e.target.value)}>
                          {arts.map(a => <option key={a.path} value={a.path}>{a.path}</option>)}
                        </select>
                      </div>
                      <button className="btn sm" onClick={() => onToast('산출물 목록을 새로 고쳤습니다')}><RefreshCw size={13} /></button>
                    </div>
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead><tr><th className="no">No.</th><th>경로</th><th>단계</th><th>형식</th><th className="num">크기</th><th>구분</th><th /></tr></thead>
                        <tbody>
                          {arts.map((a, i) => (
                            <tr key={a.path} className={previewArt?.path === a.path ? 'sel' : ''}>
                              <td className="no">{i + 1}</td>
                              <td className="mono" style={{ cursor: 'pointer' }} onClick={() => setPreview(a.path)}>{a.path}</td>
                              <td><span className="badge">{ARTIFACT_STAGE_LABELS[a.stage] ?? a.stage}</span></td>
                              <td>{TYPE_LABELS[a.kind] ?? a.kind}</td>
                              <td className="num">{a.size}</td>
                              <td>{a.rep ? <span className="badge brand">대표 산출물</span> : <span className="muted">기타</span>}</td>
                              <td><button className="btn sm ghost" onClick={() => onToast(`${a.path} 다운로드`)}><Download size={13} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              <Block title="산출물 미리보기" sub={previewArt ? `${previewArt.path} · ${TYPE_LABELS[previewArt.kind] ?? previewArt.kind}` : '선택 없음'}>
                {!previewArt && <div className="empty">미리볼 산출물이 없습니다.</div>}
                {previewArt && (previewArt.kind === 'pdb' || previewArt.kind === 'sdf') && (
                  <StructureViewer label={previewArt.path} seed={previewArt.path.length % 9} height={230} />
                )}
                {previewArt && ['json', 'csv', 'fasta', 'md', 'log'].includes(previewArt.kind) && (
                  <pre className="log" style={{ whiteSpace: 'pre-wrap' }}>{ARTIFACT_PREVIEW_TEXT[previewArt.kind] ?? '(내용 없음)'}</pre>
                )}
                {previewArt && ['svg', 'png', 'bin'].includes(previewArt.kind) && (
                  <div className="empty">이 형식은 Monitor 산출물 패널에서 미리보기를 지원합니다.</div>
                )}
              </Block>
            </div>
          )}

          {tab === 'history' && (
            session.history.length ? (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th className="no">No.</th><th>시각</th><th>단계</th><th>상태</th><th>메모</th></tr></thead>
                  <tbody>
                    {session.history.map((h, i) => (
                      <tr key={`${h.at}-${i}`}>
                        <td className="no">{i + 1}</td>
                        <td>{h.at}</td>
                        <td className="mono">{h.stage}</td>
                        <td><span className={'badge ' + STUDIO_STATUS_LABELS[h.status].cls}>
                          <i className="dot" />{STUDIO_STATUS_LABELS[h.status].text}
                        </span></td>
                        <td className="muted">{h.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty">아직 기록된 단계 실행이 없습니다.</div>
          )}
        </div>
      </Card>

      {picker && (
        <Modal title="잔기 선택기" onClose={() => setPicker(false)}
          footer={<>
            <button className="btn" onClick={() => { setPickerSel([]); setPicker(false); set('fixed_positions_extra', ''); onToast('고정 위치를 비웠습니다') }}>
              선택 초기화
            </button>
            <button className="btn primary" onClick={() => {
              setPicker(false)
              set('fixed_positions_extra', `A:${pickerSel.join(',')}`)
              onToast(`${pickerSel.length}개 잔기를 fixed_positions_extra 에 반영했습니다`)
            }}>적용하고 닫기</button>
          </>}>
          <p className="muted" style={{ margin: 0 }}>
            구조 소스: 선택한 실행의 입력 PDB. 표면 컷오프 2.5 Å 기준으로 노출 잔기를 분류합니다.
          </p>
          <div className="row wrap" style={{ gap: 6 }}>
            {['Surface', 'Core', 'Interface', 'Conserved 30', 'Conserved 50', 'Conserved 70'].map(p => (
              <button key={p} className="chip" onClick={() => onToast(`${p} 프리셋을 적용했습니다`)}>{p}</button>
            ))}
          </div>
          <Field label="표면 컷오프" hint="surface_area_cutoff · 기본값 2.5">
            <input className="input" type="number" step="0.1" defaultValue="2.5" />
          </Field>
          <div className="row wrap" style={{ gap: 4 }}>
            {Array.from({ length: 30 }, (_, i) => i + 55).map(r => (
              <button key={r} className={'chip' + (pickerSel.includes(r) ? ' on' : '')}
                style={pickerSel.includes(r) ? { borderColor: 'var(--brand-2)', background: 'var(--brand-soft)', color: 'var(--brand-ink)' } : undefined}
                onClick={() => setPickerSel(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])}>
                A{r}
              </button>
            ))}
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {pickerSel.length ? `선택된 잔기: A:${pickerSel.join(',')}` : '선택된 잔기가 없습니다.'}
          </p>
        </Modal>
      )}
    </>
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

function StudioInput({ f, v, onChange }: {
  f: StudioField; v: string | boolean | undefined; onChange: (k: string, v: string | boolean) => void
}) {
  const hint = f.unit ? `${f.key} · 단위 ${f.unit}` : f.key
  if (f.type === 'bool') {
    return (
      <div className="field">
        <label>{f.label}</label>
        <label className="check">
          <input type="checkbox" checked={v === true} onChange={e => onChange(f.key, e.target.checked)} />
          <span>{v === true ? '사용' : '사용하지 않음'}</span>
        </label>
        <span className="hint">{hint}</span>
      </div>
    )
  }
  return (
    <Field label={f.label} hint={hint}>
      {f.type === 'select' ? (
        <select className="input" value={String(v ?? '')} onChange={e => onChange(f.key, e.target.value)}>
          {(f.opts ?? []).map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
        </select>
      ) : f.type === 'area' ? (
        <textarea className="input" rows={f.rows ?? 3} value={String(v ?? '')} placeholder={f.ph}
          onChange={e => onChange(f.key, e.target.value)} />
      ) : (
        <input className="input" type={f.type === 'num' ? 'number' : 'text'} value={String(v ?? '')} placeholder={f.ph}
          onChange={e => onChange(f.key, e.target.value)} />
      )}
    </Field>
  )
}
