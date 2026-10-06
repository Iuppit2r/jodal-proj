import { useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, FlaskConical, Layers, Network, Plus, Rocket,
  Settings, Workflow,
} from 'lucide-react'
import { Card, Modal, MoreMenu, PageHead, Progress, Stat, State } from '../components/ui'
import { Spark } from '../components/viz'
import { hoursText, RUNS, SIGNALS } from '../data/mock'
import { wsStore } from '../data/workspace'

/* 실행 방법 선택: 기존 시스템의 Choose Experiment Type 5지 선택 */
const RUN_METHODS = [
  { to: '/fast', kicker: '기본 경로', title: '빠른 실행', icon: Rocket,
    desc: '타깃 파일을 올리거나 서열을 붙여넣고 표준 기본값으로 바로 실행합니다.' },
  { to: '/setup', kicker: '단계별 설정', title: '고급 설정', icon: FlaskConical,
    desc: '입력, 워크플로, 기준, 전문가 옵션을 차례로 확인하고 검토 후 실행합니다.' },
  { to: '/setup?surrogate=1', kicker: '예산 선별', title: '대리모델 선별', icon: Layers,
    desc: 'AF2 호출 예산을 정해 두고 대리모델로 상위 후보만 추려 구조 예측에 투입합니다.' },
  { to: '/workflow', kicker: '단계 검토', title: '단계별 실행', icon: Workflow,
    desc: '한 단계씩 돌리고 결과를 확인한 뒤 다음 단계로 넘깁니다.' },
  { to: '/dag', kicker: '자유 구성', title: '흐름 설계 (DAG)', icon: Network,
    desc: '노드를 직접 연결해 병렬 분기와 조건 분기가 있는 흐름을 그립니다.' },
]

/* 고른 프로젝트 하나만 보여 주는 대시보드.
   전사 자원 현황은 시스템 운영 메뉴에 있으므로 여기에 두지 않는다. */
export default function Dashboard({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const [pick, setPick] = useState(false)
  const projects = useSyncExternalStore(wsStore.subscribe, wsStore.projects)
  const allRounds = useSyncExternalStore(wsStore.subscribe, wsStore.rounds)
  const curId = useSyncExternalStore(wsStore.subscribe, wsStore.currentId)
  const prj = projects.find(p => p.id === curId)

  const runs = RUNS.filter(r => r.projectId === curId)
  const rounds = allRounds.filter(r => r.projectId === curId)
  const live = runs.filter(r => r.status === 'running' || r.status === 'gate' || r.status === 'queued')
  const gate = runs.filter(r => r.status === 'gate').length
  const curRound = rounds.find(r => r.status === 'running') ?? rounds[rounds.length - 1]
  const ORDER: Record<string, number> = { running: 0, gate: 1, queued: 2, failed: 3, done: 4 }
  const rows = [...runs].sort((a, b) =>
    (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || b.created.localeCompare(a.created))
  const candidates = runs.reduce((a, r) => a + r.candidates, 0)
  const gpu = runs.reduce((a, r) => a + r.gpuHours, 0)
  const members = (prj?.members ?? []).filter(m => m.status === 'active').length

  return (
    <>
      <PageHead
        title={prj?.name ?? '프로젝트 대시보드'}
        desc={prj?.desc ?? '왼쪽 위에서 프로젝트를 고르세요.'}
        actions={<>
          <button className="btn primary" onClick={() => setPick(true)}><Plus size={15} />새 실행</button>
          <MoreMenu title="바로 가기" items={[
            { label: '실행 모니터', icon: <Activity size={14} />, onClick: () => nav('/monitor') },
            { label: '결과 분석', icon: <BarChart3 size={14} />, onClick: () => nav('/analyze') },
          ]} />
        </>}
      />

      <div className="row wrap">
        <span className="badge brand">{curRound ? `${curRound.title} 진행중` : '라운드 없음'}</span>
        <span className="muted">구성원 {members}명</span>
        <span className="muted">담당 {prj?.owner ?? '-'}</span>
        <div className="sp" />
        <button className="btn sm" onClick={() => nav(`/projects/${curId}/members`)}>
          <Settings size={14} />프로젝트 설정
        </button>
      </div>

      <div className="grid g4">
        <Stat label="진행 중 실행" value={live.length} unit="건"
          delta={gate ? `검토 대기 ${gate}건` : '검토 대기 없음'} />
        <Stat label="라운드" value={rounds.length} unit="개"
          delta={curRound ? `현재 ${curRound.title}` : '라운드를 만드세요'} />
        <Stat label="누적 후보" value={candidates.toLocaleString()} unit="개"
          delta={`실행 ${runs.length}건 합계`} />
        <Stat label="GPU 사용" value={hoursText(gpu)} delta="이 프로젝트 누적" />
      </div>

      <div className="grid g-2-1">
        <Card title="이 프로젝트의 실행" sub={`${rows.length}건 · 진행 중 ${live.length}건`}
          right={<button className="btn sm" onClick={() => nav('/monitor')}>전체 보기</button>} flush>
          {rows.length === 0 ? (
            <div className="empty">실행이 없습니다. 새 실행을 시작하세요.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>실행</th><th className="nw">라운드</th><th className="nw">현재 단계</th>
                    <th style={{ width: 150 }}>진행률</th><th className="num">후보</th><th className="nw">상태</th><th className="nw">담당</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/monitor/${r.id}`)}>
                      <td className="no">{i + 1}</td>
                      <td>
                        <div className="mono" style={{ fontWeight: 500 }}>{r.id}</div>
                        <div className="faint">{r.name}</div>
                      </td>
                      <td className="nw">{r.round}</td>
                      <td className="nw mono">{r.stage}</td>
                      <td>
                        <Progress v={r.progress} />
                        <div className="faint" style={{ marginTop: 3 }}>{r.progress}%</div>
                      </td>
                      <td className="num">{r.candidates ? r.candidates.toLocaleString() : '-'}</td>
                      <td className="nw"><State s={r.status} /></td>
                      <td className="nw">{r.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Evidence Agent Panel" sub="품질 신호 해석"
          right={<button className="btn sm" onClick={() => nav('/monitor')}>전체 신호</button>}>
          <div className="col" style={{ gap: 16 }}>
            {SIGNALS.map(s => (
              <div key={s.title} className={'signal ' + s.level}>
                <span className="ic">
                  {s.level === 'ok' ? <CheckCircle2 size={15} color="var(--ok)" />
                    : <AlertTriangle size={15} color={s.level === 'warn' ? 'var(--warn)' : 'var(--err)'} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <b>{s.title}</b>
                  <p>{s.body}</p>
                  <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                    {s.actions.map(a => <button key={a} className="btn sm" onClick={() => onToast(a)}>{a}</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="라운드 진행" sub={`${rounds.length}개`} flush>
          {rounds.length === 0 ? (
            <div className="empty">라운드가 없습니다.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th className="no">No.</th><th>라운드</th><th>상태</th><th className="num">실행</th><th>갱신</th></tr>
                </thead>
                <tbody>
                  {rounds.map((r, i) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }}
                      onClick={() => nav(`/projects/${curId}/rounds/${r.id}`)}>
                      <td className="no">{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{r.title}</td>
                      <td>
                        <State s={r.status === 'running' ? 'running' : r.status === 'completed' ? 'done' : 'queued'} />
                      </td>
                      <td className="num">{r.runs.length}</td>
                      <td>{r.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="후보 추이" sub="실행 별 통과 후보 수">
          <Spark values={runs.map(r => r.candidates)} height={64} />
          <div className="divider" />
          <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
            <dt>최근 완료 실행</dt><dd className="mono">{runs.find(r => r.status === 'done')?.id ?? '없음'}</dd>
            <dt>누적 GPU</dt><dd>{hoursText(gpu)}</dd>
            <dt>갱신</dt><dd>{prj?.updated ?? '-'}</dd>
          </dl>
        </Card>
      </div>

      {pick && (
        <Modal title="실행 방법 선택" onClose={() => setPick(false)}>
          <div className="grid g2" style={{ gap: 10 }}>
            {RUN_METHODS.map(e => (
              <div key={e.title} className="pipe-card" onClick={() => { setPick(false); nav(e.to) }}>
                <div className="row">
                  <e.icon size={16} color="var(--brand)" />
                  <span className="faint">{e.kicker}</span>
                </div>
                <h4>{e.title}</h4>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
