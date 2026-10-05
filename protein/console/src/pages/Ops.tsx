import { useState } from 'react'
import { ArrowUp, Gauge, Pause, Play, RefreshCw, Settings2, Users } from 'lucide-react'
import { Card, Field, Modal, PageHead, Progress, Seg, Stat, State } from '../components/ui'
import { Bars, Spark } from '../components/viz'
import { ENDPOINTS, JOBS } from '../data/mock'

/* ============ 작업 큐 (SFR-022) ============ */
export function Jobs({ onToast }: { onToast: (m: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'failed'>('all')
  const rows = JOBS.filter(j =>
    filter === 'all' ? true
      : filter === 'active' ? ['running', 'queued', 'retry'].includes(j.state)
        : ['failed'].includes(j.state))

  return (
    <>
      <PageHead
        title="작업 큐"
        desc="모델별 자원 요구량과 우선순위를 반영해 작업을 스케줄링하고 대기·재시도 상태를 관리합니다."
        req="SFR-022 · SFR-023"
        actions={<>
          <button className="btn"><Pause size={14} />큐 일시중지</button>
          <button className="btn"><RefreshCw size={14} />실패 작업 재시도</button>
          <button className="btn primary"><Settings2 size={14} />스케줄링 정책</button>
        </>}
      />

      <div className="grid g4">
        <Stat label="실행 중" value={2} unit="건" icon={<Play size={13} />} />
        <Stat label="대기" value={3} unit="건" delta="최장 3분 02초" icon={<Gauge size={13} />} />
        <Stat label="재시도" value={1} unit="건" delta="rfd3 입력 오류" icon={<RefreshCw size={13} />} />
        <Stat label="24시간 실패율" value="4.1" unit="%" delta="전일 대비 -1.2%p" deltaUp icon={<ArrowUp size={13} />} />
      </div>

      <Card title="작업 목록" sub={`${rows.length}건`} flush
        right={<Seg items={[{ key: 'all', label: '전체' }, { key: 'active', label: '진행/대기' }, { key: 'failed', label: '실패' }]}
          value={filter} onChange={setFilter} />}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>작업 ID</th><th>run</th><th>단계</th><th>모델</th><th>GPU</th><th>우선순위</th><th>대기</th><th>상태</th><th /></tr></thead>
            <tbody>
              {rows.map(j => (
                <tr key={j.id}>
                  <td className="mono" style={{ fontWeight: 500 }}>{j.id}</td>
                  <td className="mono">{j.run}</td>
                  <td className="mono faint">{j.stage}</td>
                  <td>{j.model}</td>
                  <td className="faint">{j.gpu}</td>
                  <td><span className={'badge ' + (j.priority === 'high' ? 'err' : j.priority === 'low' ? '' : 'accent')}>
                    {j.priority === 'high' ? '높음' : j.priority === 'low' ? '낮음' : '보통'}</span></td>
                  <td className="mono faint">{j.waited}</td>
                  <td><State s={j.state} /></td>
                  <td>
                    {j.state === 'queued' && <button className="btn sm" onClick={() => onToast(`${j.id} 우선순위 상향`)}><ArrowUp size={12} /></button>}
                    {j.state === 'failed' && <button className="btn sm" onClick={() => onToast(`${j.id} 재시도 등록`)}><RefreshCw size={12} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid g3 mt">
        <Card title="모델별 대기 작업"><Bars data={[
          { label: 'ColabFold (AF2)', value: 6, color: 'var(--warn)' },
          { label: 'AF2-Multimer', value: 3, color: 'var(--run)' },
          { label: 'ProteinMPNN', value: 1 }, { label: 'RFDiffusion3', value: 0 },
        ]} unit="건" /></Card>
        <Card title="스케줄링 정책" sub="우선순위 가중">
          <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
            <dt>정책</dt><dd>우선순위 + FIFO</dd>
            <dt>선점</dt><dd>비활성 (실행 중 작업 보존)</dd>
            <dt>최대 동시 작업</dt><dd>사용자당 4 · 전체 16</dd>
            <dt>재시도</dt><dd>최대 2회 · 지수 백오프</dd>
            <dt>기아 방지</dt><dd>대기 10분 초과 시 가중치 상향</dd>
          </dl>
        </Card>
        <Card title="큐 대기 시간 추이" sub="최근 12시간 p95">
          <Spark values={[42, 38, 55, 91, 120, 182, 155, 134, 168, 192, 171, 182]} color="#d97706" height={60} />
          <div className="faint mt" style={{ fontSize: 11.5 }}>현재 p95 182초 — colabfold-a100 워커 상향 권고</div>
        </Card>
      </div>
    </>
  )
}

/* ============ GPU 운영 (SFR-016) ============ */
export function GpuAdmin({ onToast }: { onToast: (m: string) => void }) {
  const [patch, setPatch] = useState<string | null>(null)
  const ep = ENDPOINTS.find(e => e.id === patch)

  return (
    <>
      <PageHead
        title="외부 GPU 운영"
        desc="RunPod 서버리스 엔드포인트의 상태, 워커, 사용량, 비용을 모니터링하고 안전하게 조정합니다."
        req="SFR-016"
        actions={<>
          <button className="btn"><RefreshCw size={14} />상태 새로고침</button>
          <button className="btn primary"><Settings2 size={14} />예산 알림 설정</button>
        </>}
      />

      <div className="grid g4">
        <Stat label="활성 엔드포인트" value="4 / 5" delta="diffdock-l4 유휴" />
        <Stat label="전체 워커" value="8 / 20" delta="가용률 40%" />
        <Stat label="오늘 GPU 사용" value={17.6} unit="h" delta="전일 대비 +12%" deltaUp />
        <Stat label="오늘 비용" value="$79.4" delta="월 예산 $1,950의 41%" />
      </div>

      <Card title="엔드포인트" sub="RunPod 서버리스" flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>엔드포인트</th><th>GPU</th><th style={{ width: 130 }}>워커</th><th className="num">실행</th>
              <th className="num">대기</th><th className="num">p95 지연</th><th className="num">오늘 비용</th><th>상태</th><th />
            </tr></thead>
            <tbody>
              {ENDPOINTS.map(e => (
                <tr key={e.id}>
                  <td className="mono" style={{ fontWeight: 500 }}>{e.name}</td>
                  <td>{e.gpu}</td>
                  <td>
                    <Progress v={(e.workersReady / e.workersMax) * 100} />
                    <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{e.workersReady} / {e.workersMax}</div>
                  </td>
                  <td className="num">{e.inFlight}</td>
                  <td className="num" style={{ color: e.queued > 3 ? 'var(--warn)' : undefined }}>{e.queued}</td>
                  <td className="num mono">{e.p95}</td>
                  <td className="num">${e.costToday.toFixed(1)}</td>
                  <td><State s={e.state} /></td>
                  <td><button className="btn sm" onClick={() => setPatch(e.id)}>조정</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid g3 mt">
        <Card title="엔드포인트별 오늘 비용"><Bars data={ENDPOINTS.map(e => ({
          label: e.name, value: e.costToday, color: e.state === 'degraded' ? 'var(--warn)' : undefined,
        }))} unit=" USD" /></Card>
        <Card title="GPU 사용량 추이" sub="최근 7일 (GPU-h)">
          <Spark values={[9.2, 12.4, 8.1, 15.7, 14.2, 15.7, 17.6]} height={60} />
          <div className="divider" />
          <dl className="kv" style={{ gridTemplateColumns: '92px 1fr' }}>
            <dt>주간 합계</dt><dd>92.9 GPU-h</dd>
            <dt>주간 비용</dt><dd>$412.8</dd>
            <dt>최다 사용</dt><dd className="mono">af2m-h100</dd>
          </dl>
        </Card>
        <Card title="운영 권고" sub="Agent Panel 연계" req="SFR-020">
          <div className="col" style={{ gap: 10 }}>
            <div className="signal warn">
              <div><b style={{ fontSize: 12.5 }}>colabfold-a100 대기 6건</b>
                <p style={{ fontSize: 12 }}>p95 318초로 기준(180초)을 초과했습니다. maxWorkers를 2→4로 상향하면 대기가 해소될 것으로 예상됩니다.</p>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn sm" onClick={() => setPatch('ep-cf')}>워커 상향</button>
                </div></div>
            </div>
            <div className="signal ok">
              <div><b style={{ fontSize: 12.5 }}>diffdock-l4 유휴 6시간</b>
                <p style={{ fontSize: 12 }}>최소 워커를 0으로 유지해 비용이 발생하지 않고 있습니다.</p></div>
            </div>
          </div>
        </Card>
      </div>

      {ep && (
        <Modal title={`엔드포인트 조정 — ${ep.name}`} onClose={() => setPatch(null)}
          footer={<>
            <button className="btn" onClick={() => setPatch(null)}>취소</button>
            <button className="btn primary" onClick={() => { setPatch(null); onToast(`${ep.name} 설정 반영 — 감사 로그 기록`) }}>
              안전하게 적용
            </button>
          </>}>
          <dl className="kv">
            <dt>GPU</dt><dd>{ep.gpu}</dd>
            <dt>현재 워커</dt><dd>{ep.workersReady} / {ep.workersMax}</dd>
            <dt>대기 작업</dt><dd>{ep.queued}건</dd>
            <dt>p95 지연</dt><dd>{ep.p95}</dd>
          </dl>
          <div className="divider" />
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="최소 워커"><input className="input" type="number" defaultValue={0} /></Field>
            <Field label="최대 워커"><input className="input" type="number" defaultValue={ep.workersMax} /></Field>
            <Field label="유휴 타임아웃 (초)"><input className="input" type="number" defaultValue={60} /></Field>
            <Field label="작업 타임아웃 (초)"><input className="input" type="number" defaultValue={1800} /></Field>
          </div>
          <div className="signal warn">
            <div><b>안전 패치</b>
              <p>실행 중인 작업은 보존되며, 변경 사항은 신규 작업부터 적용됩니다. 변경 내역은 감사 로그에 기록됩니다.</p></div>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ============ 동시접속 안정성 (SFR-024 · PER) ============ */
export function Performance() {
  return (
    <>
      <PageHead
        title="성능 · 동시접속"
        desc="동시 사용자 부하, 응답 지연, 대용량 run 조회 성능을 측정값 기준으로 관리합니다."
        req="SFR-024 · PER-001~003"
        actions={<button className="btn primary"><Users size={14} />부하 시험 실행</button>}
      />
      <div className="grid g4">
        <Stat label="현재 동시 사용자" value={11} unit="명" delta="목표 30명 이내" />
        <Stat label="API p95 응답" value={312} unit="ms" delta="기준 1,000ms 이내" deltaUp />
        <Stat label="대용량 run 렌더링" value={3.2} unit="s" delta="기준 10s 이내" deltaUp />
        <Stat label="5분 오류율" value="0.2" unit="%" delta="기준 1% 이내" deltaUp />
      </div>
      <div className="grid g2 mt">
        <Card title="부하 시험 결과" sub="동시 사용자 30명 · 10분" req="SFR-024" flush>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>시나리오</th><th className="num">요청</th><th className="num">p50</th><th className="num">p95</th><th className="num">오류율</th><th>판정</th></tr></thead>
              <tbody>
                {[
                  ['run 목록 조회', '3,420', '82ms', '241ms', '0.0%', 'ok'],
                  ['run 상세 + 단계 조회', '2,180', '114ms', '312ms', '0.1%', 'ok'],
                  ['Hit List 정렬·필터', '1,640', '96ms', '288ms', '0.0%', 'ok'],
                  ['대용량 아티팩트 목록 (500MB run)', '420', '1.8s', '3.2s', '0.2%', 'ok'],
                  ['아티팩트 다운로드 요청', '310', '4.1s', '11.6s', '0.3%', 'ok'],
                  ['동시 run 생성 (10 user)', '120', '206ms', '498ms', '0.0%', 'ok'],
                ].map(r => (
                  <tr key={r[0]}>
                    <td>{r[0]}</td><td className="num">{r[1]}</td><td className="num mono">{r[2]}</td>
                    <td className="num mono">{r[3]}</td><td className="num">{r[4]}</td>
                    <td><span className="badge ok">기준 충족</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="col" style={{ gap: 14 }}>
          <Card title="성능 기준" req="PER-001~003">
            <div className="col" style={{ gap: 9 }}>
              {[
                ['동시 사용자 30명 환경에서 정상 서비스', 'SFR-024'],
                ['API p95 응답 1초 이내 (조회 계열)', 'PER-001'],
                ['대용량 run(500MB↑) 화면 렌더링 10초 이내', 'PER-002'],
                ['아티팩트 다운로드 응답 30초 이내', 'PER-002'],
                ['동시 실행 작업 16건 처리', 'PER-003'],
              ].map(([k, r]) => (
                <div key={k} className="row" style={{ fontSize: 12.5 }}>
                  <span style={{ minWidth: 0 }}>{k}</span>
                  <div className="sp" />
                  <span className="req" style={{ margin: 0 }}>{r}</span>
                  <span className="badge ok">충족</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="안정화 적용 내역">
            <div className="col" style={{ gap: 8 }}>
              {[
                '세션 분리 및 토큰 기반 무상태 API',
                '대용량 아티팩트 목록 커서 페이지네이션',
                '구조 파일 스트리밍 전송 및 서명 URL 발급',
                '지표 집계 결과 캐시 (run 단위 무효화)',
                'MongoDB 인덱스 (run_id, project, created_at, stage)',
                '워커 풀 분리 — 조회 요청과 실행 요청 격리',
              ].map(s => (
                <div key={s} className="row" style={{ fontSize: 12.5 }}>
                  <span className="badge ok" style={{ width: 21, padding: 0, justifyContent: 'center' }}>✓</span>{s}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
