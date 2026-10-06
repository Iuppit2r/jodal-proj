import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Cpu, ListTodo, ShieldCheck } from 'lucide-react'
import { Card, MoreMenu, PageHead, Progress, Stat, State } from '../components/ui'
import { Bars, Spark } from '../components/viz'
import { ENDPOINTS, hoursText, JOBS, RUNS, SIGNALS } from '../data/mock'
import { wsStore } from '../data/workspace'
import { useSyncExternalStore } from 'react'

/* 관리자용 운영 현황.
   연구자 대시보드가 자기 프로젝트만 본다면 여기는 기관 전체를 본다.
   자원, 큐, 승인 대기처럼 운영자가 챙길 것만 모은다. */
export default function Overview({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const projects = useSyncExternalStore(wsStore.subscribe, wsStore.projects)

  const live = RUNS.filter(r => r.status === 'running' || r.status === 'gate' || r.status === 'queued')
  const gate = RUNS.filter(r => r.status === 'gate')
  const failed = RUNS.filter(r => r.status === 'failed')
  const queued = JOBS.filter(j => j.state === 'queued').length
  const gpu = RUNS.reduce((a, r) => a + r.gpuHours, 0)
  const activePrj = projects.filter(p => p.status !== 'archived')

  return (
    <>
      <PageHead
        title="운영 현황"
        desc="기관 전체의 실행, 자원, 승인 대기를 한 화면에서 확인하세요."
        actions={<>
          <MoreMenu title="바로 가기" items={[
            { label: '작업 큐', icon: <ListTodo size={14} />, onClick: () => nav('/jobs') },
            { label: 'GPU 엔드포인트', icon: <Cpu size={14} />, onClick: () => nav('/gpu') },
            { label: '사용자 · 승인', icon: <ShieldCheck size={14} />, onClick: () => nav('/admin') },
          ]} />
        </>}
      />

      <div className="grid g4">
        <Stat label="진행 중 실행" value={live.length} unit="건" delta={`검토 대기 ${gate.length}건`} />
        <Stat label="큐 대기 작업" value={queued} unit="개" delta="최장 대기 3분 02초" />
        <Stat label="오늘 GPU 사용" value={hoursText(gpu)} delta="전일 대비 +12%" />
        <Stat label="오늘 비용" value="$79.4" delta="월 예산의 41%" />
      </div>

      <div className="grid g-2-1">
        <Card title="전체 실행" sub={`진행 중 ${live.length}건 · 실패 ${failed.length}건`}
          right={<button className="btn sm" onClick={() => nav('/monitor')}>실행 모니터 열기</button>} flush>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>실행</th><th>프로젝트</th><th>현재 단계</th><th style={{ width: 150 }}>진행률</th><th>상태</th><th>담당</th></tr>
              </thead>
              <tbody>
                {live.concat(failed).map((r, i) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/monitor/${r.id}`)}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <div className="mono" style={{ fontWeight: 500 }}>{r.id}</div>
                      <div className="faint">{r.name}</div>
                    </td>
                    <td>{r.project}</td>
                    <td>{r.stage}</td>
                    <td>
                      <Progress v={r.progress} />
                      <div className="faint" style={{ marginTop: 3 }}>{r.progress}%</div>
                    </td>
                    <td><State s={r.status} /></td>
                    <td>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="처리할 일">
          <div className="col" style={{ gap: 16 }}>
            <div className="signal warn">
              <span className="ic"><AlertTriangle size={15} color="var(--warn)" /></span>
              <div>
                <b>체크포인트 검토 대기 {gate.length}건</b>
                <p>{gate.map(r => r.id).join(', ') || '없음'}</p>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn sm" onClick={() => nav('/monitor')}>실행 모니터에서 처리</button>
                </div>
              </div>
            </div>
            <div className="signal err">
              <span className="ic"><AlertTriangle size={15} color="var(--err)" /></span>
              <div>
                <b>실패한 실행 {failed.length}건</b>
                <p>{failed.map(r => `${r.id} (${r.stage})`).join(', ') || '없음'}</p>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn sm" onClick={() => nav('/jobs')}>재시도 검토</button>
                </div>
              </div>
            </div>
            <div className="signal">
              <span className="ic"><CheckCircle2 size={15} color="var(--accent)" /></span>
              <div>
                <b>승인 대기</b>
                <p>모델 등록 1건, 외부 계정 3건이 승인을 기다리고 있습니다.</p>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn sm" onClick={() => nav('/models')}>모델 승인</button>
                  <button className="btn sm" onClick={() => nav('/admin')}>계정 승인</button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid g3">
        <Card title="GPU 엔드포인트" sub="RunPod 서버리스"
          right={<button className="btn sm" onClick={() => nav('/gpu')}>관리</button>}>
          <div className="col" style={{ gap: 16 }}>
            {ENDPOINTS.map(e => (
              <div key={e.id}>
                <div className="row">
                  <span className="mono">{e.name}</span>
                  <div className="sp" />
                  <State s={e.state} />
                </div>
                <div className="row faint" style={{ marginTop: 3 }}>
                  <span>{e.gpu}</span><span>·</span>
                  <span>worker {e.workersReady}/{e.workersMax}</span><span>·</span>
                  <span>queue {e.queued}</span>
                  <div className="sp" />
                  <span>p95 {e.p95}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="작업 큐 상태" sub="우선순위 반영"
          right={<button className="btn sm" onClick={() => nav('/jobs')}>큐 보기</button>}>
          <Bars data={[
            { label: '실행 중', value: JOBS.filter(j => j.state === 'running').length, color: 'var(--실행)' },
            { label: '대기', value: queued, color: 'var(--text-3)' },
            { label: '재시도', value: JOBS.filter(j => j.state === 'retry').length, color: 'var(--warn)' },
            { label: '실패(24h)', value: JOBS.filter(j => j.state === 'failed').length, color: 'var(--err)' },
          ]} unit="건" />
        </Card>

        <Card title="주간 처리량" sub="완료 실행 / 후보 수">
          <div className="muted">완료 실행</div>
          <Spark values={[2, 3, 1, 4, 3, 5, 4]} height={52} />
          <div className="divider" />
          <div className="muted">필터 통과 후보</div>
          <Spark values={[88, 142, 61, 210, 180, 318, 274]} color="#0ea5e9" height={52} />
        </Card>
      </div>

      <Card title="프로젝트 현황" sub={`사용 중 ${activePrj.length}개`}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="no">No.</th><th>프로젝트</th><th>담당</th><th className="num">구성원</th><th className="num">실행</th><th>갱신</th><th /></tr>
            </thead>
            <tbody>
              {activePrj.map((p, i) => (
                <tr key={p.id}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.owner}</td>
                  <td className="num">{(p.members ?? []).filter(m => m.status === 'active').length}</td>
                  <td className="num">{RUNS.filter(r => r.projectId === p.id).length}</td>
                  <td>{p.updated}</td>
                  <td className="num">
                    <button className="btn sm ghost" onClick={() => nav(`/projects/${p.id}`)}>열기</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="품질 신호" sub="모든 프로젝트의 최근 신호">
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

      <Card title="사용자 현황">
        <div className="row wrap" style={{ gap: 10 }}>
          <span className="muted">전체 8명</span>
          <span className="badge warn">승인 대기 3명</span>
          <span className="badge brand">관리자 1명</span>
          <span className="badge accent">Model Manager 1명</span>
          <div className="sp" />
          <button className="btn sm" onClick={() => nav('/admin')}>계정 관리</button>
        </div>
      </Card>
    </>
  )
}
