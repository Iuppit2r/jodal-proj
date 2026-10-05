import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle2, CircleDollarSign, Cpu, FlaskConical, Info, Layers, Timer,
} from 'lucide-react'
import { Card, PageHead, Progress, Stat, State } from '../components/ui'
import { Bars, Spark } from '../components/viz'
import { ENDPOINTS, JOBS, RUNS, SIGNALS } from '../data/mock'

export default function Dashboard() {
  const nav = useNavigate()
  const active = RUNS.filter(r => r.status === 'running' || r.status === 'gate' || r.status === 'queued')

  return (
    <>
      <PageHead
        title="운영 현황"
        desc="실행 중인 파이프라인, 자원 사용량, 품질 신호를 한 화면에서 확인합니다."
        req="SFR-023 · UIR-001"
        actions={<>
          <button className="btn" onClick={() => nav('/monitor')}><Activity size={14} />Monitor</button>
          <button className="btn primary" onClick={() => nav('/setup')}><FlaskConical size={14} />새 실행</button>
        </>}
      />

      <div className="grid g4">
        <Stat label="진행 중 run" value={2} unit="건" delta="검토 대기 1건" deltaUp icon={<Activity size={13} />} />
        <Stat label="큐 대기 작업" value={10} unit="개" delta="최장 대기 3분 02초" icon={<Timer size={13} />} />
        <Stat label="오늘 GPU 사용" value={17.6} unit="h" delta="전일 대비 +12%" deltaUp icon={<Cpu size={13} />} />
        <Stat label="오늘 비용" value="$79.4" delta="월 예산의 41%" icon={<CircleDollarSign size={13} />} />
      </div>

      <div className="grid g-2-1 mt">
        <Card title="실행 중인 run" sub="상태·단계·진행률" req="SFR-009"
          right={<button className="btn sm" onClick={() => nav('/monitor')}>전체 보기</button>} flush>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>run</th><th>파이프라인</th><th>현재 단계</th><th style={{ width: 160 }}>진행률</th><th>상태</th><th>담당</th></tr>
              </thead>
              <tbody>
                {active.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/monitor?run=${r.id}`)}>
                    <td>
                      <div className="mono" style={{ fontWeight: 500 }}>{r.id}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>{r.name}</div>
                    </td>
                    <td><span className={'badge ' + (r.pipeline === 'stability' ? 'brand' : 'accent')}>
                      {r.pipeline === 'stability' ? '안정화' : '결합예측'}</span></td>
                    <td className="mono">{r.stage}</td>
                    <td>
                      <Progress v={r.progress} />
                      <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{r.progress}%</div>
                    </td>
                    <td><State s={r.status} /></td>
                    <td>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Agent Panel" sub="품질 신호 해석" req="SFR-020">
          <div className="col" style={{ gap: 10 }}>
            {SIGNALS.map(s => (
              <div key={s.title} className={'signal ' + s.level}>
                <span className="ic">
                  {s.level === 'ok' ? <CheckCircle2 size={15} color="var(--ok)" />
                    : s.level === 'warn' ? <AlertTriangle size={15} color="var(--warn)" />
                      : <AlertTriangle size={15} color="var(--err)" />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <b>{s.title}</b>
                  <p>{s.body}</p>
                  <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                    {s.actions.map(a => <button key={a} className="btn sm">{a}</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid g3 mt">
        <Card title="GPU 엔드포인트" sub="RunPod 서버리스" req="SFR-016"
          right={<button className="btn sm" onClick={() => nav('/gpu')}>관리</button>}>
          <div className="col" style={{ gap: 10 }}>
            {ENDPOINTS.map(e => (
              <div key={e.id}>
                <div className="row" style={{ fontSize: 12.5 }}>
                  <span className="mono">{e.name}</span>
                  <div className="sp" />
                  <State s={e.state} />
                </div>
                <div className="row faint" style={{ fontSize: 11.5, marginTop: 3 }}>
                  <span>{e.gpu}</span>
                  <span>·</span>
                  <span>worker {e.workersReady}/{e.workersMax}</span>
                  <span>·</span>
                  <span>queue {e.queued}</span>
                  <div className="sp" />
                  <span>p95 {e.p95}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="작업 큐 상태" sub="우선순위 반영" req="SFR-022"
          right={<button className="btn sm" onClick={() => nav('/jobs')}>큐 보기</button>}>
          <Bars data={[
            { label: '실행 중', value: JOBS.filter(j => j.state === 'running').length, color: 'var(--run)' },
            { label: '대기', value: JOBS.filter(j => j.state === 'queued').length, color: 'var(--text-3)' },
            { label: '재시도', value: JOBS.filter(j => j.state === 'retry').length, color: 'var(--warn)' },
            { label: '실패(24h)', value: JOBS.filter(j => j.state === 'failed').length, color: 'var(--err)' },
          ]} unit="건" />
          <div className="divider" />
          <div className="faint row" style={{ fontSize: 11.5 }}>
            <Info size={12} /> 모델별 자원 요구량과 우선순위에 따라 스케줄링됩니다.
          </div>
        </Card>

        <Card title="주간 처리량" sub="완료 run / 후보 수" req="PER-003">
          <div className="muted" style={{ fontSize: 12 }}>완료 run</div>
          <Spark values={[2, 3, 1, 4, 3, 5, 4]} height={52} />
          <div className="divider" />
          <div className="muted" style={{ fontSize: 12 }}>필터 통과 후보</div>
          <Spark values={[88, 142, 61, 210, 180, 318, 274]} color="#3b5bdb" height={52} />
          <div className="divider" />
          <div className="row faint" style={{ fontSize: 11.5 }}>
            <Layers size={12} /> 화면 렌더링 p95 3.2초 (기준 10초 이내)
          </div>
        </Card>
      </div>
    </>
  )
}
