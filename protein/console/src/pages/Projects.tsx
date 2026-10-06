import { useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Archive, ArchiveRestore, Download, FileClock, FolderPlus, GitFork, ListPlus,
  MessageSquarePlus, Pencil, Plus, RefreshCw, RotateCcw, Trash2, UserPlus, X,
} from 'lucide-react'
import { Card, Field, Modal, MoreMenu, PageHead, State } from '../components/ui'
import {
  ROUND_STATUS, TASK_STATE, WS_DATASETS, WS_DATASET_LABELS, WS_DATASET_SCOPES, WS_DATASET_UNITS,
  MEMBER_ROLES, MEMBER_ROLE_DESC, WS_FEEDBACK, WS_LINEAGE, WS_MEASURES, WS_VER_KIND_LABEL,
  versionSummary, versionsOfRound, wsStore,
  type ProjectStatus, type RoundStatus, type WsMember, type WsMemberRole, type WsProject,
  type WsRound, type WsTask, type WsTaskState, type WsVersion,
} from '../data/workspace'
import { can, gateTitle, roleNote, useRole } from '../data/session'

/* 라운드 상태 배지. 계획 / 실행중 / 완료 / 실패 / 취소 / 보관 */
function RoundState({ s }: { s: RoundStatus }) {
  const m = ROUND_STATUS.find(r => r.key === s) ?? ROUND_STATUS[0]
  return <span className={'badge ' + m.cls}><i className="dot" />{m.label}</span>
}

function PrjState({ s }: { s: ProjectStatus }) {
  return s === 'archived'
    ? <span className="badge"><i className="dot" />보관</span>
    : <span className="badge ok"><i className="dot" />사용중</span>
}

/* 목업 저장소 구독. 세 화면이 같은 데이터를 본다. */
function useProjects() {
  return useSyncExternalStore(wsStore.subscribe, wsStore.projects)
}
function useRounds() {
  return useSyncExternalStore(wsStore.subscribe, wsStore.rounds)
}
function useVersions() {
  return useSyncExternalStore(wsStore.subscribe, wsStore.versions)
}

const TODAY = '2026-10-06'

/* 결과 버전 상세 보기와 재현 정보를 같은 모달에서 보여 준다. */
function VersionModal({ v, mode, onClose }: {
  v: WsVersion
  mode: 'view' | 'repro'
  onClose: () => void
}) {
  const kind = WS_VER_KIND_LABEL[v.kind]
  return (
    <Modal
      title={mode === 'view' ? `결과 버전 · ${kind} ${v.ver}` : `재현 정보 · ${kind} ${v.ver}`}
      onClose={onClose}
      footer={<button className="btn primary" onClick={onClose}>닫기</button>}>
      {mode === 'view' ? (
        <>
          <dl className="kv">
            <dt>버전</dt><dd className="mono">{v.ver}</dd>
            <dt>종류</dt><dd>{kind}</dd>
            <dt>상태</dt><dd>{v.current
              ? <span className="badge ok"><i className="dot" />현행</span>
              : <span className="badge"><i className="dot" />이전</span>}</dd>
            <dt>요약</dt><dd>{v.summary}</dd>
            <dt>생성자</dt><dd>{v.by}</dd>
            <dt>생성 시각</dt><dd className="muted">{v.at}</dd>
            <dt>연결된 실행</dt><dd className="mono">{v.repro.runId}</dd>
          </dl>
          <div className="signal">
            <div><b>버전 보존 기준</b>
              <p>이전 버전도 그대로 남아 있어 언제든 현행 버전으로 되돌릴 수 있습니다.</p></div>
          </div>
        </>
      ) : (
        <>
          <dl className="kv">
            <dt>run id</dt><dd className="mono">{v.repro.runId}</dd>
            <dt>모델 버전</dt><dd className="mono">{v.repro.models.join(' · ')}</dd>
            <dt>파라미터 해시</dt><dd className="mono">{v.repro.paramHash}</dd>
            <dt>입력 파일 해시</dt><dd className="mono">{v.repro.inputHash}</dd>
            <dt>실행 일시</dt><dd className="muted">{v.repro.ranAt}</dd>
            <dt>난수 시드</dt><dd className="mono">{v.repro.seed}</dd>
          </dl>
          <div className="signal ok">
            <div><b>재현 방법</b>
              <p>같은 입력 해시와 같은 모델 버전으로 다시 실행하면 이 버전과 같은 결과가 나옵니다.</p></div>
          </div>
        </>
      )}
    </Modal>
  )
}

/* 확인 모달 */
function Confirm({ c, onClose }: { c: { title: string; body: string; run: () => void }; onClose: () => void }) {
  return (
    <Modal title={c.title} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" onClick={() => { c.run(); onClose() }}>확인</button>
      </>}>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{c.body}</p>
    </Modal>
  )
}

/* 프로젝트 생성·편집 모달 */
function ProjectForm({ init, onClose, onSave }: {
  init: WsProject | null
  onClose: () => void
  onSave: (name: string, desc: string, owner: string) => void
}) {
  const [name, setName] = useState(init?.name ?? '')
  const [desc, setDesc] = useState(init?.desc ?? '')
  const [owner, setOwner] = useState(init?.owner ?? '김연구')
  const [err, setErr] = useState('')
  return (
    <Modal title={init ? '프로젝트 편집' : '신규 프로젝트'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" onClick={() => {
          if (!name.trim()) { setErr('프로젝트 이름을 입력하세요.'); return }
          onSave(name.trim(), desc.trim(), owner.trim() || '김연구')
        }}>{init ? '프로젝트 저장' : '프로젝트 생성'}</button>
      </>}>
      {init && <div className="row wrap"><span className="badge brand">프로젝트</span><span className="mono muted">{init.id}</span></div>}
      <Field label="프로젝트 이름">
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="GFP 열안정성 개량" />
      </Field>
      <Field label="프로젝트 설명">
        <textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="과제 범위와 표적" />
      </Field>
      <Field label="담당">
        <input className="input" value={owner} onChange={e => setOwner(e.target.value)} placeholder="김연구" />
      </Field>
      {err && <div className="signal err"><div><b>입력 확인</b><p>{err}</p></div></div>}
      <div className="signal">
        <div><b>자동 관리 항목</b>
          <p>라운드 수와 갱신 일자는 기록이 쌓이면 자동으로 채워집니다.</p></div>
      </div>
    </Modal>
  )
}

/* 라운드 생성·편집 모달 */
interface RoundFormValue {
  title: string; status: RoundStatus; goal: string; hypothesis: string; notes: string; nextNotes: string
}

function RoundForm({ init, onClose, onSave }: {
  init: WsRound | null
  onClose: () => void
  onSave: (v: RoundFormValue) => void
}) {
  const [v, setV] = useState<RoundFormValue>({
    title: init?.title ?? '', status: init?.status ?? 'planned', goal: init?.goal ?? '',
    hypothesis: init?.hypothesis ?? '', notes: init?.notes ?? '', nextNotes: init?.nextNotes ?? '',
  })
  const [err, setErr] = useState('')
  return (
    <Modal title={init ? '라운드 편집' : '신규 라운드'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" onClick={() => {
          if (!v.title.trim()) { setErr('라운드 제목을 입력하세요.'); return }
          onSave({ ...v, title: v.title.trim() })
        }}>{init ? '라운드 저장' : '라운드 생성'}</button>
      </>}>
      {init && <div className="row wrap"><span className="badge brand">라운드</span><span className="mono muted">{init.id}</span></div>}
      <Field label="라운드 제목">
        <input className="input" value={v.title} onChange={e => setV({ ...v, title: e.target.value })}
          placeholder="Round 5 · tier30 재검증" />
      </Field>
      <Field label="상태" hint="status">
        <select className="input" value={v.status} onChange={e => setV({ ...v, status: e.target.value as RoundStatus })}>
          {ROUND_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="목표"><textarea className="input" rows={2} value={v.goal}
        onChange={e => setV({ ...v, goal: e.target.value })} placeholder="이 라운드에서 확인할 것" /></Field>
      <Field label="가설"><textarea className="input" rows={2} value={v.hypothesis}
        onChange={e => setV({ ...v, hypothesis: e.target.value })} placeholder="검증하려는 가설" /></Field>
      <Field label="메모"><textarea className="input" rows={2} value={v.notes}
        onChange={e => setV({ ...v, notes: e.target.value })} placeholder="파라미터 고정값, 특이사항" /></Field>
      <Field label="다음 라운드 메모"><textarea className="input" rows={2} value={v.nextNotes}
        onChange={e => setV({ ...v, nextNotes: e.target.value })} placeholder="다음 회차로 넘길 판단" /></Field>
      {err && <div className="signal err"><div><b>입력 확인</b><p>{err}</p></div></div>}
      <div className="signal">
        <div><b>자동 관리 항목</b>
          <p>선정 후보와 실험 요약은 연결된 실행 결과에서 자동으로 채워집니다.</p></div>
      </div>
    </Modal>
  )
}

/* ============================================================
   /projects : 프로젝트 목록
   ============================================================ */
export function ProjectsList({ onToast }: { onToast: (m: string) => void }) {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const projects = useProjects()
  const rounds = useRounds()
  const [showArchived, setShowArchived] = useState(false)
  /* 사이드바 프로젝트 메뉴에서 "새 프로젝트" 로 들어오면 바로 생성 모달을 연다 */
  const [newOpen, setNewOpen] = useState(sp.get('new') === '1')

  const visible = useMemo(
    () => projects.filter(p => showArchived || p.status !== 'archived'),
    [projects, showArchived],
  )
  const roundsOf = (id: string) => rounds.filter(r => r.projectId === id).length

  return (
    <>
      <PageHead
        title="프로젝트"
        desc="프로젝트를 골라 라운드 기록을 열거나 새 프로젝트를 만드세요."
        actions={<>
          <button className="btn" onClick={() => onToast('프로젝트 목록 새로고침')}><RefreshCw size={14} />새로고침</button>
          <button className="btn primary" onClick={() => setNewOpen(true)}><FolderPlus size={14} />신규 프로젝트</button>
        </>}
      />


      <Card
        title="프로젝트 목록"
        sub={`${visible.length}건`}
        right={<label className="check">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          보관 포함 보기
        </label>}
        flush
      >
        {visible.length === 0 ? (
          <div className="empty">프로젝트가 없습니다. 하나를 만들어 라운드 기록을 시작하세요.</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>프로젝트</th><th>담당</th><th>상태</th><th className="num">라운드</th><th className="num">실행</th><th>갱신</th></tr>
              </thead>
              <tbody>
                {visible.map((p, i) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/projects/${p.id}`)}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="faint">{p.desc}</div>
                    </td>
                    <td className="muted">{p.owner}</td>
                    <td><PrjState s={p.status} /></td>
                    <td className="num">{roundsOf(p.id)}</td>
                    <td className="num">{rounds.filter(r => r.projectId === p.id).reduce((a, r) => a + r.runs.length, 0)}</td>
                    <td className="faint">{p.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {newOpen && (
        <ProjectForm init={null} onClose={() => setNewOpen(false)}
          onSave={(name, desc, owner) => {
            const id = 'prj_new_' + (projects.length + 1)
            wsStore.addProject({ id, name, status: 'active', desc, owner, updated: TODAY })
            setNewOpen(false)
            onToast('프로젝트 생성됨')
            nav(`/projects/${id}`)
          }} />
      )}
    </>
  )
}

/* ============================================================
   /projects/:id : 프로젝트 하나. 개요 + 라운드 목록
   ============================================================ */
export function ProjectDetail({ onToast }: { onToast: (m: string) => void }) {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const projects = useProjects()
  const rounds = useRounds()
  const versions = useVersions()
  const [showArchived, setShowArchived] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null)

  const prj = projects.find(p => p.id === id) ?? null
  const all = rounds.filter(r => r.projectId === id)
  const visible = all.filter(r => showArchived || r.status !== 'archived')
  const verRows = versionSummary(versions, all)

  if (!prj) {
    return (
      <>
        <PageHead title="프로젝트 상세" desc="주소의 프로젝트를 찾을 수 없습니다. 목록에서 다시 선택하세요."
          back={{ to: '/projects', label: '목록으로' }} />
        <Card>
          <div className="empty">프로젝트 {id || '(지정 없음)'}를 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었습니다.</div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={prj.name}
        desc="라운드를 골라 기록을 보거나 새 라운드를 만드세요."
        back={{ to: '/projects', label: '목록으로' }}
        actions={<>
          <button className="btn" onClick={() => setEditOpen(true)}><Pencil size={14} />프로젝트 편집</button>
          <button className="btn primary" onClick={() => setRoundOpen(true)}><ListPlus size={14} />신규 라운드</button>
        </>}
      />

      {/* 보관 · 삭제는 카드 머리의 동작 자리에 둔다. 본문 아래에 홀로 두면 무엇에 대한 동작인지 알기 어렵다.
         상태는 머리에서 한 번만 보여 주고 본문에서는 뺀다. */}
      <Card title="프로젝트 개요" sub={prj.id}
        right={<>
          <PrjState s={prj.status} />
          <MoreMenu sm title="프로젝트 관리" items={[
            {
              label: '프로젝트 보관', icon: <Archive size={14} />,
              disabled: prj.status === 'archived', note: '이미 보관한 프로젝트입니다',
              onClick: () => setConfirm({
                title: '프로젝트 보관',
                body: `${prj.name}을 보관할까요? 연결된 실행은 그대로 유지됩니다.`,
                run: () => { wsStore.patchProject(prj.id, { status: 'archived' }); onToast('프로젝트 보관됨, 실행은 그대로 유지') },
              }),
            },
            {
              label: '보관 해제', icon: <ArchiveRestore size={14} />,
              disabled: prj.status !== 'archived', note: '보관한 프로젝트만 되돌릴 수 있습니다',
              onClick: () => { wsStore.patchProject(prj.id, { status: 'active' }); onToast('프로젝트 복원됨') },
            },
            {
              label: '프로젝트 삭제', icon: <Trash2 size={14} />, danger: true,
              onClick: () => setConfirm({
                title: '프로젝트 삭제',
                body: `${prj.name}과 하위 라운드 기록을 삭제할까요? 연결된 실행 출력물은 디스크에 그대로 남습니다.`,
                run: () => { wsStore.removeProject(prj.id); onToast('프로젝트 삭제됨'); nav('/projects') },
              }),
            },
          ]} />
        </>}>
        <div className="grid g2">
          <dl className="kv">
            <dt>담당</dt><dd>{prj.owner}</dd>
            <dt>갱신</dt><dd className="muted">{prj.updated}</dd>
            <dt>설명</dt><dd>{prj.desc || '-'}</dd>
          </dl>
          <dl className="kv">
            <dt>라운드</dt><dd>{all.length}건 (실행중 {all.filter(r => r.status === 'running').length}건)</dd>
            <dt>연결된 실행</dt><dd>{all.reduce((a, r) => a + r.runs.length, 0)}건</dd>
          </dl>
        </div>
      </Card>

      <Card
        title="라운드"
        sub={`${visible.length}건 · 한 줄을 고르면 라운드 기록이 열립니다`}
        right={<label className="check">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          보관 포함 보기
        </label>}
        flush
      >
        {visible.length === 0 ? (
          <div className="empty">라운드가 없습니다. 이 프로젝트 안에서 하나를 만드세요.</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>라운드</th><th>상태</th><th className="num">실행</th><th className="num">후보</th><th>갱신</th></tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/projects/${prj.id}/rounds/${r.id}`)}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.title}</div>
                      <div className="faint">{r.goal || '목표 미기재'}</div>
                    </td>
                    <td><RoundState s={r.status} /></td>
                    <td className="num">{r.runs.length}</td>
                    <td className="num">{r.runs.reduce((a, x) => a + x.candidates, 0) || '-'}</td>
                    <td className="faint">{r.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="결과 버전 요약">
        <div className="col" style={{ gap: 16 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>라운드</th><th>상태</th><th>최신 버전</th><th>최신 종류</th><th className="num">총 버전</th><th>최근 갱신</th></tr>
              </thead>
              <tbody>
                {verRows.map((s, i) => (
                  <tr key={s.roundId} style={{ cursor: 'pointer' }} onClick={() => nav(`/projects/${prj.id}/rounds/${s.roundId}`)}>
                    <td className="no">{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.title}</td>
                    <td><RoundState s={s.status} /></td>
                    <td className="mono">{s.latestVer}</td>
                    <td>{s.latestKind === '-' ? '-' : <span className="badge">{s.latestKind}</span>}</td>
                    <td className="num">{s.total || '-'}</td>
                    <td className="faint">{s.latestAt}</td>
                  </tr>
                ))}
                {verRows.length === 0 && (
                  <tr><td className="no">-</td><td colSpan={6} className="muted">라운드가 없어 결과 버전도 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => onToast('결과 버전 이력 CSV 내려받기')}><Download size={14} />버전 이력 내려받기</button>
            <span className="faint">한 줄을 고르면 그 라운드의 버전 이력과 재현 정보가 열립니다.</span>
          </div>
        </div>
      </Card>

      {editOpen && (
        <ProjectForm init={prj} onClose={() => setEditOpen(false)}
          onSave={(name, desc, owner) => {
            wsStore.patchProject(prj.id, { name, desc, owner, updated: TODAY })
            setEditOpen(false); onToast('프로젝트 저장됨')
          }} />
      )}

      {roundOpen && (
        <RoundForm init={null} onClose={() => setRoundOpen(false)}
          onSave={v => {
            const rid = 'rnd_new_' + (rounds.length + 1)
            wsStore.addRound({
              id: rid, projectId: prj.id, title: v.title, status: v.status,
              goal: v.goal, hypothesis: v.hypothesis, notes: v.notes,
              selected: '선정 대기 (연결된 실행 결과에서 자동 수집)',
              expSummary: '측정 기록 없음 (연결된 결과·실험 데이터에서 자동 집계)',
              reportSummary: '보고서 또는 연결 실행 요약이 아직 없습니다.',
              nextNotes: v.nextNotes,
              suggestion: '라운드 단위 학습이 활성화되면 모델 제안이 표시됩니다.',
              updated: TODAY, runs: [], tasks: [],
            })
            setRoundOpen(false); onToast('라운드 생성됨')
            nav(`/projects/${prj.id}/rounds/${rid}`)
          }} />
      )}

      {confirm && <Confirm c={confirm} onClose={() => setConfirm(null)} />}
    </>
  )
}


/* 태스크 추가 · 편집 폼. 실행 연결은 선택 사항이라 비워 둘 수 있다. */
function TaskForm({ init, runs, onClose, onSave }: {
  init: WsTask | null
  runs: string[]
  onClose: () => void
  onSave: (v: Omit<WsTask, 'id'>) => void
}) {
  const [title, setTitle] = useState(init?.title ?? '')
  const [owner, setOwner] = useState(init?.owner ?? '김연구')
  const [state, setState] = useState<WsTaskState>(init?.state ?? 'todo')
  const [due, setDue] = useState(init?.due ?? '')
  const [run, setRun] = useState(init?.run ?? '')
  const [note, setNote] = useState(init?.note ?? '')

  return (
    <Modal title={init ? '태스크 편집' : '태스크 추가'} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" disabled={!title.trim()}
          onClick={() => onSave({
            title: title.trim(), owner, state, due: due.trim() || TODAY,
            run: run || undefined, note: note.trim(),
          })}>저장</button>
      </>}>
      <Field label="할 일" hint="이 라운드에서 처리할 작업 한 가지를 적으세요.">
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="상위 후보 20건 발현 의뢰" />
      </Field>
      <div className="grid g3">
        <Field label="담당">
          <select className="input" value={owner} onChange={e => setOwner(e.target.value)}>
            {['김연구', '박연구', '이박사', '최연구', '박운영'].map(x => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="상태">
          <select className="input" value={state} onChange={e => setState(e.target.value as WsTaskState)}>
            {TASK_STATE.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="기한">
          <input className="input" value={due} onChange={e => setDue(e.target.value)} placeholder={TODAY} />
        </Field>
      </div>
      <Field label="연결 실행" hint="계산이 필요 없는 작업이면 비워 두세요.">
        <select className="input" value={run} onChange={e => setRun(e.target.value)}>
          <option value="">연결 없음</option>
          {runs.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="메모">
        <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </Field>
    </Modal>
  )
}

/* ============================================================
   /projects/:id/rounds/:rid : 라운드 하나
   ============================================================ */
export function RoundDetail({ onToast }: { onToast: (m: string) => void }) {
  const { id = '', rid = '' } = useParams()
  const nav = useNavigate()
  const projects = useProjects()
  const rounds = useRounds()
  const versions = useVersions()
  const role = useRole()
  const [editOpen, setEditOpen] = useState(false)
  const [expOpen, setExpOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null)
  const [recTab, setRecTab] = useState<'lineage' | 'feedback'>('lineage')
  const [verOpen, setVerOpen] = useState<{ v: WsVersion; mode: 'view' | 'repro' } | null>(null)
  const [taskOpen, setTaskOpen] = useState<{ mode: 'new' | 'edit'; task?: WsTask } | null>(null)

  const prj = projects.find(p => p.id === id) ?? null
  const rnd = rounds.find(r => r.id === rid && r.projectId === id) ?? null
  const verRows = useMemo(() => versionsOfRound(versions, rid), [versions, rid])
  const canRevert = can(role, 'report_create')

  if (!prj || !rnd) {
    return (
      <>
        <PageHead title="라운드 상세" desc="주소의 라운드를 찾을 수 없습니다. 프로젝트에서 다시 선택하세요."
          back={prj
            ? { to: `/projects/${prj.id}`, label: '프로젝트로' }
            : { to: '/projects', label: '목록으로' }} />
        <Card>
          <div className="empty">라운드 {rid || '(지정 없음)'}를 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었습니다.</div>
        </Card>
      </>
    )
  }

  const runIds = rnd.runs.map(r => r.id)
  const doneCount = rnd.tasks.filter(t => t.state === 'done').length

  return (
    <>
      <PageHead
        title={rnd.title}
        desc="라운드 목표와 연결된 실행을 확인하고 실험 결과를 기록하세요."
        back={{ to: `/projects/${prj.id}`, label: '프로젝트로' }}
        actions={<>
          <button className="btn" onClick={() => setEditOpen(true)}><Pencil size={14} />라운드 편집</button>
          <button className="btn primary" onClick={() => setExpOpen(true)}><MessageSquarePlus size={14} />실험 결과 기록</button>
        </>}
      />

      <Card
        title="라운드 개요"
        sub={`${prj.name} · ${rnd.id}`}
        right={<>
          <select className="input" value={rnd.status} style={{ width: 130 }}
            onChange={e => {
              const s = e.target.value as RoundStatus
              wsStore.patchRound(rnd.id, { status: s, updated: TODAY })
              onToast(`라운드 상태 변경: ${ROUND_STATUS.find(x => x.key === s)?.label ?? s}`)
            }}>
            {ROUND_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <MoreMenu sm title="라운드 관리" items={[
            {
                label: '라운드 보관', icon: <Archive size={14} />,
                disabled: rnd.status === 'archived', note: '이미 보관한 라운드입니다',
                onClick: () => setConfirm({
                  title: '라운드 보관',
                  body: `${rnd.title}을 보관할까요? 연결된 실행은 그대로 유지됩니다.`,
                  run: () => { wsStore.patchRound(rnd.id, { status: 'archived' }); onToast('라운드 보관됨') },
                }),
              },
              {
                label: '보관 해제', icon: <ArchiveRestore size={14} />,
                disabled: rnd.status !== 'archived', note: '보관한 라운드만 되돌릴 수 있습니다',
                onClick: () => { wsStore.patchRound(rnd.id, { status: 'planned' }); onToast('라운드 복원됨, 상태는 계획으로 되돌림') },
              },
              {
                label: '라운드 삭제', icon: <Trash2 size={14} />, danger: true,
                onClick: () => setConfirm({
                  title: '라운드 삭제',
                  body: `${rnd.title}을 삭제할까요? 연결된 실행 출력물은 디스크에 그대로 남습니다.`,
                  run: () => { wsStore.removeRound(rnd.id); onToast('라운드 삭제됨'); nav(`/projects/${prj.id}`) },
                }),
              },
          ]} />
        </>}
      >
        <div className="grid g2">
          <dl className="kv">
            <dt>목표</dt><dd>{rnd.goal || '-'}</dd>
            <dt>가설</dt><dd>{rnd.hypothesis || '-'}</dd>
          </dl>
          <dl className="kv">
            <dt>메모</dt><dd>{rnd.notes || '-'}</dd>
            <dt>갱신</dt><dd className="muted">{rnd.updated}</dd>
          </dl>
        </div>
      </Card>

      <Card title="태스크" sub={`${doneCount} / ${rnd.tasks.length}건 완료`} flush
        right={<button className="btn sm" onClick={() => setTaskOpen({ mode: 'new' })}>
          <Plus size={13} />태스크 추가
        </button>}>
        {rnd.tasks.length === 0 ? (
          <div className="empty">이 라운드에 태스크가 없습니다. 할 일을 추가해 진행 상황을 남기세요.</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="no">No.</th><th>할 일</th><th>담당</th><th>기한</th>
                  <th>연결 실행</th><th style={{ width: 120 }}>상태</th><th />
                </tr>
              </thead>
              <tbody>
                {rnd.tasks.map((t, i) => (
                  <tr key={t.id}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.note && <div className="faint">{t.note}</div>}
                    </td>
                    <td>{t.owner}</td>
                    <td className="muted">{t.due}</td>
                    <td>
                      {t.run
                        ? <button className="btn sm ghost mono" onClick={() => nav(`/monitor/${t.run}`)}>{t.run}</button>
                        : <span className="faint">-</span>}
                    </td>
                    <td>
                      <select className="input" value={t.state}
                        onChange={e => {
                          const st = e.target.value as WsTaskState
                          wsStore.patchTask(rnd.id, t.id, { state: st })
                          wsStore.patchRound(rnd.id, { updated: TODAY })
                          onToast(`${t.title}: ${TASK_STATE.find(x => x.key === st)?.label ?? st}`)
                        }}>
                        {TASK_STATE.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select>
                    </td>
                    <td className="num">
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        <MoreMenu sm items={[
                          { label: '태스크 편집', icon: <Pencil size={14} />, onClick: () => setTaskOpen({ mode: 'edit', task: t }) },
                          {
                            label: '태스크 삭제', icon: <Trash2 size={14} />, danger: true,
                            onClick: () => setConfirm({
                              title: '태스크 삭제',
                              body: `${t.title}을 삭제할까요? 연결된 실행은 그대로 남습니다.`,
                              run: () => { wsStore.removeTask(rnd.id, t.id); onToast('태스크 삭제됨') },
                            }),
                          },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="연결된 실행" sub={`${rnd.runs.length}건`} flush>
        {rnd.runs.length === 0 ? (
          <div className="empty">이 라운드에 연결된 실행이 없습니다.</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>실행</th><th>단계</th><th className="num">후보</th><th>상태</th><th>생성</th><th>액션</th></tr>
              </thead>
              <tbody>
                {rnd.runs.map((r, i) => (
                  <tr key={r.id}>
                    <td className="no">{i + 1}</td>
                    <td className="mono" style={{ fontWeight: 500 }}>{r.id}</td>
                    <td className="mono muted">{r.stage}</td>
                    <td className="num">{r.candidates || '-'}</td>
                    <td><State s={r.state} /></td>
                    <td className="faint">{r.created}</td>
                    <td>
                      <div className="row">
                        <button className="btn sm ghost" onClick={() => nav(`/monitor/${r.id}`)}>열기</button>
                        <button className="btn sm ghost" onClick={() => onToast(`${r.id}에서 신규 실행으로 fork`)}><GitFork size={13} />fork</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="결과 버전" sub={`${verRows.length}건`}>
        <div className="col" style={{ gap: 16 }}>
          {verRows.length === 0 ? (
            <div className="empty">이 라운드에는 아직 결과 버전이 없습니다. 연결된 실행이 결과를 만들면 v1 으로 기록됩니다.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>버전</th><th>종류</th><th>요약</th>
                    <th>생성자</th><th>생성 시각</th><th>상태</th><th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {verRows.map((v, i) => (
                    <tr key={v.id}>
                      <td className="no">{i + 1}</td>
                      <td>
                        <div className="mono" style={{ fontWeight: 500 }}>{v.ver}</div>
                        <div className="mono faint">{v.repro.runId}</div>
                      </td>
                      <td><span className="badge">{WS_VER_KIND_LABEL[v.kind]}</span></td>
                      <td>{v.summary}</td>
                      <td className="muted">{v.by}</td>
                      <td className="faint">{v.at}</td>
                      <td>{v.current
                        ? <span className="badge ok"><i className="dot" />현행</span>
                        : <span className="badge"><i className="dot" />이전</span>}</td>
                      <td>
                        <div className="row">
                          <button className="btn sm ghost" onClick={() => setVerOpen({ v, mode: 'view' })}>이 버전 보기</button>
                          <button className="btn sm ghost" onClick={() => setVerOpen({ v, mode: 'repro' })}>재현 정보</button>
                          <button className="btn sm" disabled={v.current || !canRevert}
                            title={v.current ? '이미 현행 버전입니다' : gateTitle(role, 'report_create')}
                            onClick={() => setConfirm({
                              title: '현재 버전으로 되돌리기',
                              body: `${WS_VER_KIND_LABEL[v.kind]} ${v.ver} 을 현행 버전으로 되돌릴까요? 지금의 현행 버전은 이전 버전으로 남고 삭제되지 않습니다.`,
                              run: () => {
                                wsStore.revertVersion(v.id)
                                wsStore.patchRound(rnd.id, { updated: TODAY })
                                onToast(`${WS_VER_KIND_LABEL[v.kind]} ${v.ver} 을 현행 버전으로 되돌렸습니다`)
                              },
                            })}><RotateCcw size={13} />되돌리기</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="row wrap">
            <button className="btn" onClick={() => onToast('결과 버전 이력 CSV 내려받기')}>
              <Download size={14} />버전 이력 내려받기</button>
            <button className="btn" onClick={() => onToast('결과 버전 목록 새로고침')}><RefreshCw size={14} />새로고침</button>
            <div className="sp" />
            <span className="faint">{roleNote(role, ['report_create', 'artifact_download'])}</span>
          </div>
          <div className="signal">
            <span className="ic"><FileClock size={15} color="var(--text-3)" /></span>
            <div><b>버전 기록 기준</b>
              <p>
                보고서, 선정 후보, 데이터셋은 갱신될 때마다 새 버전으로 쌓이고 이전 버전은 지워지지 않습니다.
                각 버전에는 그 결과를 만든 실행 id, 모델 버전, 파라미터와 입력 파일 해시가 함께 고정 기록됩니다.
              </p></div>
          </div>
        </div>
      </Card>

      <Card title="선정 후보 · 실험 요약 · 보고서" sub="연결된 실행에서 자동 수집한 항목과 모델 제안">
        <dl className="kv" style={{ margin: 0 }}>
          <dt>선정 후보</dt><dd>{rnd.selected} <span className="badge accent">자동</span></dd>
          <dt>실험 요약</dt><dd>{rnd.expSummary} <span className="badge accent">자동</span></dd>
          <dt>보고서 요약</dt><dd>{rnd.reportSummary}</dd>
          <dt>다음 라운드 메모</dt><dd>{rnd.nextNotes || '-'}</dd>
          <dt>모델 제안</dt><dd>{rnd.suggestion || '-'}</dd>
        </dl>
      </Card>

      <Card title="실행 계보 · 피드백">
        <div className="col" style={{ gap: 16 }}>
          <div className="row">
            <div className="seg">
              <button className={recTab === 'lineage' ? 'on' : ''} onClick={() => setRecTab('lineage')}>실행 계보</button>
              <button className={recTab === 'feedback' ? 'on' : ''} onClick={() => setRecTab('feedback')}>피드백 · 실험 기록</button>
            </div>
          </div>
          {recTab === 'lineage' ? (
            <div className="col" style={{ gap: 6 }}>
              {WS_LINEAGE.map(l => (
                <div key={l.id} className="row" style={{ paddingLeft: l.depth * 22 }}>
                  <span className="faint">{l.depth > 0 ? '└─' : '●'}</span>
                  <span className="mono" style={{ fontWeight: 500 }}>{l.id}</span>
                  <span className="faint">{l.desc}</span>
                  <div className="sp" />
                  {runIds.includes(l.id) && <span className="badge brand">이 라운드</span>}
                  <State s={l.state} />
                </div>
              ))}
            </div>
          ) : (
            <div className="col" style={{ gap: 16 }}>
              {WS_FEEDBACK.map(f => (
                <div key={f.date + f.run} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
                  <div className="row">
                    <span className="badge accent">{f.kind}</span>
                    <span className="mono muted">{f.run}</span>
                    <div className="sp" />
                    <span className="faint">{f.who} · {f.date}</span>
                  </div>
                  <p style={{ margin: '7px 0 0', lineHeight: 1.6 }}>{f.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card title="파생 데이터셋 추출" sub={`추출 이력 ${WS_DATASETS.length}건`}>
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g2">
            <Field label="대상 범위">
              <select className="input" defaultValue={WS_DATASET_SCOPES[3]}>
                {WS_DATASET_SCOPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="샘플 단위">
              <select className="input">
                {WS_DATASET_UNITS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="포함 레이블" hint="추출 형식은 JSONL · Parquet · CSV 중 선택">
            <div className="col" style={{ gap: 5 }}>
              {WS_DATASET_LABELS.map(l => (
                <label key={l} className="check"><input type="checkbox" defaultChecked />{l}</label>
              ))}
            </div>
          </Field>
          <div className="row">
            <button className="btn primary" onClick={() => onToast('데이터셋 추출 작업 등록, JSONL 2.1만 행 예상')}>
              <Download size={14} />데이터셋 추출</button>
            <button className="btn" onClick={() => onToast('추출 이력 새로고침')}><RefreshCw size={14} />새로고침</button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>이름</th><th className="num">행</th><th>형식</th><th>생성</th></tr></thead>
              <tbody>
                {WS_DATASETS.map((d, i) => (
                  <tr key={d.name}>
                    <td className="no">{i + 1}</td>
                    <td className="mono">{d.name}</td>
                    <td className="num">{d.rows}</td>
                    <td><span className="badge">{d.fmt}</span></td>
                    <td className="faint">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {editOpen && (
        <RoundForm init={rnd} onClose={() => setEditOpen(false)}
          onSave={v => {
            wsStore.patchRound(rnd.id, {
              title: v.title, status: v.status, goal: v.goal, hypothesis: v.hypothesis,
              notes: v.notes, nextNotes: v.nextNotes, updated: TODAY,
            })
            setEditOpen(false); onToast('라운드 저장됨')
          }} />
      )}

      {expOpen && (
        <Modal title="실험 결과 기록" onClose={() => setExpOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setExpOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => { setExpOpen(false); onToast('실험 기록 저장됨, 라운드 실험 요약에 반영') }}>저장</button>
          </>}>
          <div className="grid g2">
            <Field label="대상 실행" hint="이 라운드에 연결된 실행">
              <select className="input">
                {rnd.runs.length === 0
                  ? <option>연결된 실행 없음</option>
                  : rnd.runs.map(r => <option key={r.id}>{r.id}</option>)}
              </select>
            </Field>
            <Field label="기록 유형">
              <select className="input"><option>실험 결과</option><option>검토 의견</option></select>
            </Field>
          </div>
          <Field label="대상 후보" hint="쉼표로 구분"><input className="input mono" placeholder="cand_014, cand_003" /></Field>
          <div className="grid g3">
            <Field label="측정 항목">
              <select className="input">{WS_MEASURES.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="측정값"><input className="input" placeholder="68.2" /></Field>
            <Field label="대조군 (WT)"><input className="input" placeholder="61.4" /></Field>
          </div>
          <Field label="메모"><textarea className="input" rows={3} placeholder="실험 조건, 반복 수, 특이사항" /></Field>
          <div className="signal ok">
            <div><b>데이터셋 연계</b>
              <p>기록한 실험값은 파생 데이터셋으로 추출할 수 있습니다.</p></div>
          </div>
        </Modal>
      )}

      {taskOpen && (
        <TaskForm init={taskOpen.task ?? null} runs={runIds} onClose={() => setTaskOpen(null)}
          onSave={v => {
            if (taskOpen.mode === 'edit' && taskOpen.task) {
              wsStore.patchTask(rnd.id, taskOpen.task.id, v)
              onToast('태스크 저장됨')
            } else {
              wsStore.addTask(rnd.id, { id: `tsk_new_${Date.now()}`, ...v })
              onToast('태스크 추가됨')
            }
            wsStore.patchRound(rnd.id, { updated: TODAY })
            setTaskOpen(null)
          }} />
      )}

      {verOpen && <VersionModal v={verOpen.v} mode={verOpen.mode} onClose={() => setVerOpen(null)} />}

      {confirm && <Confirm c={confirm} onClose={() => setConfirm(null)} />}
    </>
  )
}

/* ===================== 구성원과 권한 ===================== */
/* 프로젝트를 워크스페이스처럼 쓴다. 초대하고, 권한을 주고, 내보낸다.
   프로젝트 권한은 시스템 역할과 별개이고, 실제 가능한 동작은 둘의 교집합이다. */
export function ProjectMembers({ onToast }: { onToast: (m: string) => void }) {
  const { id } = useParams()
  const role = useRole()
  const projects = useProjects()
  const prj = projects.find(p => p.id === id)

  const [account, setAccount] = useState('')
  const [invRole, setInvRole] = useState<WsMemberRole>('조회')
  const [err, setErr] = useState('')
  const [drop, setDrop] = useState<WsMember | null>(null)
  const [hand, setHand] = useState<WsMember | null>(null)

  if (!prj) {
    return (
      <>
        <PageHead title="구성원과 권한" desc="주소의 프로젝트를 찾을 수 없습니다. 목록에서 다시 고르세요."
          back={{ to: '/', label: '대시보드' }} />
        <Card title="프로젝트 없음">
          <div className="empty">{id ? `${id} 프로젝트가 없거나 삭제되었습니다.` : '프로젝트가 지정되지 않았습니다.'}</div>
        </Card>
      </>
    )
  }

  const members = prj.members ?? []
  const active = members.filter(m => m.status === 'active')
  const invited = members.filter(m => m.status === 'invited')
  /* 구성원 관리는 프로젝트 소유자나 시스템 관리자만 한다. */
  const owner = members.find(m => m.role === '소유자')
  const manage = role === 'admin' || owner?.account === 'hana.kim'

  const invite = () => {
    const a = account.trim()
    if (!a) { setErr('초대할 계정을 입력하세요.'); return }
    if (members.some(m => m.account === a)) { setErr('이미 참여 중이거나 초대한 계정입니다.'); return }
    setErr('')
    wsStore.inviteMember(prj.id, {
      name: a.split('.')[0], account: a, role: invRole, status: 'invited', joined: TODAY,
    })
    setAccount('')
    onToast(`${a} 에게 ${invRole} 권한으로 초대를 보냈습니다`)
  }

  return (
    <>
      <PageHead
        title="구성원과 권한"
        desc="구성원을 초대하고 프로젝트 안에서의 권한을 정하세요."
        back={{ to: '/', label: '대시보드' }}
        actions={<>
          <button className="btn" onClick={() => onToast('구성원 목록 CSV 내려받기')}>
            <Download size={14} />목록 내려받기
          </button>
        </>}
      />

      <Card title={prj.name} sub={`참여 ${active.length}명 · 초대 대기 ${invited.length}명`}>
        <div className="col" style={{ gap: 16 }}>
          <Field label="공개 범위" hint="조회 권한이 없는 사용자에게는 이 프로젝트의 실행과 산출물이 보이지 않습니다">
            <select className="input" value={prj.visibility ?? 'project'} disabled={!manage}
              title={manage ? undefined : '프로젝트 소유자 또는 관리자만 바꿀 수 있습니다'}
              onChange={e => {
                wsStore.patchProject(prj.id, { visibility: e.target.value as 'project' | 'org' })
                onToast('공개 범위 저장됨')
              }}>
              <option value="project">프로젝트 구성원만</option>
              <option value="org">기관 전체 조회 허용</option>
            </select>
          </Field>
          <div className="row wrap" style={{ gap: 10, alignItems: 'flex-start' }}>
            <Field label="초대할 계정" hint="기관 통합 인증 계정 또는 메일 주소">
              <input className="input" style={{ width: 260 }} value={account} placeholder="minji.lee"
                onChange={e => { setAccount(e.target.value); setErr('') }}
                onKeyDown={e => e.key === 'Enter' && invite()} />
            </Field>
            <Field label="권한" hint={MEMBER_ROLE_DESC[invRole]}>
              <select className="input" style={{ width: 160 }} value={invRole}
                onChange={e => setInvRole(e.target.value as WsMemberRole)}>
                {MEMBER_ROLES.filter(r => r !== '소유자').map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            {/* 라벨 자리를 비워 두어 위의 입력칸과 같은 줄에 선다 */}
            <div className="field">
              <label aria-hidden="true">&nbsp;</label>
              <button className="btn primary" disabled={!manage}
                title={manage ? undefined : '프로젝트 소유자 또는 관리자만 초대할 수 있습니다'}
                onClick={invite}><UserPlus size={14} />초대 보내기</button>
            </div>
          </div>
          {err && <div className="signal err"><div><b>초대 확인</b><p>{err}</p></div></div>}
          <span className="faint">
            {manage
              ? '소유자는 한 명입니다. 넘기면 기존 소유자는 편집 권한으로 내려옵니다.'
              : `${role === 'viewer' ? '일반 사용자' : '연구자'} 권한으로는 구성원을 바꿀 수 없습니다. 소유자에게 요청하세요.`}
          </span>
        </div>
      </Card>

      <Card title="구성원" sub={`${members.length}명`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="no">No.</th><th>이름</th><th>계정</th><th style={{ width: 150 }}>권한</th>
                <th>상태</th><th>참여</th><th>최근 접속</th><th />
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.account}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>{m.account}</td>
                  <td>
                    {m.role === '소유자' ? (
                      <span className="badge brand">소유자</span>
                    ) : (
                      <select className="input" value={m.role} disabled={!manage}
                        title={manage ? MEMBER_ROLE_DESC[m.role] : '소유자 또는 관리자만 바꿀 수 있습니다'}
                        onChange={e => {
                          wsStore.patchMember(prj.id, m.account, { role: e.target.value as WsMemberRole })
                          onToast(`${m.name} 권한을 ${e.target.value} 로 변경`)
                        }}>
                        {MEMBER_ROLES.filter(r => r !== '소유자').map(r => <option key={r}>{r}</option>)}
                      </select>
                    )}
                  </td>
                  <td>
                    {m.status === 'invited'
                      ? <span className="badge warn"><i className="dot" />초대 대기</span>
                      : <span className="badge ok"><i className="dot" />참여중</span>}
                  </td>
                  <td>{m.joined}</td>
                  <td>{m.lastSeen ?? '-'}</td>
                  <td className="num">
                    {/* 구성원마다 쓸 수 있는 동작이 달라 더보기 하나에 모은다. */}
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                      <MoreMenu sm items={[
                        ...(m.status === 'invited' ? [{
                          label: '초대 메일 재발송', icon: <RefreshCw size={14} />,
                          disabled: !manage, note: '소유자 또는 관리자만 보낼 수 있습니다',
                          onClick: () => onToast(`${m.account} 초대 메일 재발송`),
                        }] : []),
                        ...(m.role !== '소유자' && m.status === 'active' ? [{
                          label: '소유자 넘기기', icon: <UserPlus size={14} />,
                          disabled: !manage, note: '소유자 또는 관리자만 넘길 수 있습니다',
                          onClick: () => setHand(m),
                        }] : []),
                        ...(m.role !== '소유자' ? [{
                          label: '프로젝트에서 내보내기', icon: <X size={14} />, danger: true,
                          disabled: !manage, note: '소유자 또는 관리자만 내보낼 수 있습니다',
                          onClick: () => setDrop(m),
                        }] : []),
                      ]} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="프로젝트 기본값" sub="새 실행을 만들 때 이 값으로 시작합니다">
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g4">
            <Field label="SoluProt 통과 기준" hint="soluprot_cutoff">
              <input className="input" value={prj.defaults?.soluprot ?? 0.6}
                onChange={e => wsStore.patchProject(prj.id, { defaults: { ...(prj.defaults ?? { plddt: 85, rmsd: 2, tiers: '30 · 50 · 70' }), soluprot: Number(e.target.value) || 0 } })} />
            </Field>
            <Field label="pLDDT 하한" hint="af2_plddt_cutoff">
              <input className="input" value={prj.defaults?.plddt ?? 85}
                onChange={e => wsStore.patchProject(prj.id, { defaults: { ...(prj.defaults ?? { soluprot: 0.6, rmsd: 2, tiers: '30 · 50 · 70' }), plddt: Number(e.target.value) || 0 } })} />
            </Field>
            <Field label="RMSD 상한" hint="af2_rmsd_cutoff">
              <input className="input" value={prj.defaults?.rmsd ?? 2}
                onChange={e => wsStore.patchProject(prj.id, { defaults: { ...(prj.defaults ?? { soluprot: 0.6, plddt: 85, tiers: '30 · 50 · 70' }), rmsd: Number(e.target.value) || 0 } })} />
            </Field>
            <Field label="보존율 단계" hint="selected_tiers">
              <div className="input readonly">{prj.defaults?.tiers ?? '30 · 50 · 70'}</div>
            </Field>
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => onToast('프로젝트 기본값 저장됨, 새 실행에 적용됩니다')}>기본값 저장</button>
            <span className="faint">기존 실행에는 영향을 주지 않습니다.</span>
          </div>
        </div>
      </Card>

      <Card title="권한이 미치는 범위">
        <div className="col" style={{ gap: 16 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>프로젝트 권한</th><th>할 수 있는 일</th></tr></thead>
              <tbody>
                {MEMBER_ROLES.map((r, i) => (
                  <tr key={r}>
                    <td className="no">{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r}</td>
                    <td>{MEMBER_ROLE_DESC[r]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="signal">
            <div>
              <b>시스템 역할과 함께 적용됩니다</b>
              <p>실제 가능한 동작은 시스템 역할과 프로젝트 권한의 교집합입니다.</p>
            </div>
          </div>
          <span className="faint">{roleNote(role, ['run_execute', 'report_create', 'artifact_download'])}</span>
        </div>
      </Card>

      {drop && (
        <Modal title="구성원 내보내기" onClose={() => setDrop(null)}
          footer={<>
            <button className="btn" onClick={() => setDrop(null)}>취소</button>
            <button className="btn primary danger" onClick={() => {
              wsStore.removeMember(prj.id, drop.account)
              onToast(`${drop.name} 내보냄`)
              setDrop(null)
            }}>내보내기</button>
          </>}>
          <p>
            {drop.name}({drop.account})을 이 프로젝트에서 내보낼까요?
            이 사람이 만든 실행과 기록은 그대로 남고, 접근만 막힙니다.
          </p>
        </Modal>
      )}

      {hand && (
        <Modal title="소유자 넘기기" onClose={() => setHand(null)}
          footer={<>
            <button className="btn" onClick={() => setHand(null)}>취소</button>
            <button className="btn primary" onClick={() => {
              wsStore.transferOwner(prj.id, hand.account)
              onToast(`소유자를 ${hand.name} 으로 변경`)
              setHand(null)
            }}>넘기기</button>
          </>}>
          <p>
            소유자를 {hand.name}({hand.account})에게 넘길까요?
            넘기면 지금 소유자는 편집 권한으로 내려오고, 구성원 관리 권한을 잃습니다.
          </p>
        </Modal>
      )}
    </>
  )
}
