import { useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowUp, ChevronLeft, ChevronRight, Clock, Flame,
  Info, Pause, RefreshCw, RotateCcw, Settings2, Zap,
} from 'lucide-react'
import { Block, Card, Field, GroupTitle, MoreMenu, PageHead, Progress, Seg, Stat, State } from '../components/ui'
import { Bars, Spark } from '../components/viz'
import { JOBS } from '../data/mock'
import {
  buildSpend, buildUsage, buildWindow, COLLECTOR, DEMO_MODES, deriveStatus, estimateStageEta, EWMA_ALPHA,
  EWMA_BOOTSTRAP_FILES, getDemoMode, MANAGED_SERVICES, PRESETS, QUEUE_RUNS, RP_ENDPOINTS, RP_STATUS,
  setDemoMode, STAGE_ENDPOINT, STAGE_QUEUES, subscribeDemoMode, sumSpend, sumUsage,
  type DemoMode, type MonWindow, type Preset, type RpEndpoint, type SpendPoint, type UsagePoint,
} from '../data/ops'
import { can, gateTitle, roleNote, useRole } from '../data/session'

/* ============ 공통 포매터 ============ */

const money = (v: number) => `$${v.toFixed(2)}`
const num2 = (v: number) => v.toFixed(2)

/* 시안 기준 시각 (모듈 로드 시점 고정) */
const NOW = new Date()

function fmtSec(s: number) {
  if (s < 60) return `${Math.round(s)}초`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m < 60) return sec ? `${m}분 ${sec}초` : `${m}분`
  const h = Math.floor(m / 60)
  return `${h}시간 ${m % 60}분`
}

function clockAfter(base: Date, s: number) {
  const d = new Date(base.getTime() + s * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function deltaText(cur: number, prev: number, fmt: (v: number) => string) {
  const d = cur - prev
  const sign = d > 0 ? '+' : d < 0 ? '-' : '±'
  return `직전 ${fmt(prev)} · ${sign}${fmt(Math.abs(d))}`
}

/* ============ 작은 인라인 SVG 선 차트 ============ */

interface Series { key: string; label: string; color: string; values: number[] }

function niceCeil(v: number) {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return m * mag
}

function LineChart({ series, labels, height = 196, currency = false }: {
  series: Series[]; labels: string[]; height?: number; currency?: boolean
}) {
  const W = 620, H = height, L = 56, R = 14, T = 14, B = 30
  const flat = series.flatMap(s => s.values)
  const max = niceCeil(Math.max(...flat, currency ? 0.5 : 2))
  const n = labels.length
  const sx = (i: number) => (n <= 1 ? L : L + (i / (n - 1)) * (W - L - R))
  const sy = (v: number) => H - B - (v / max) * (H - B - T)
  const step = Math.max(1, Math.ceil(n / 6))
  const scaleLabel = (v: number) => (currency ? `$${v >= 100 ? v.toFixed(0) : v.toFixed(1)}` : String(Math.round(v * 10) / 10))

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <g key={r}>
            {r > 0 && r < 1 && <line x1={L} x2={W - R} y1={sy(max * r)} y2={sy(max * r)} stroke="#f4f4f5" />}
            <text x={L - 8} y={sy(max * r) + 4} textAnchor="end" fontSize="12" fill="#71717a">{scaleLabel(max * r)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#e4e4e7" />
        <line x1={L} x2={L} y1={T} y2={H - B} stroke="#e4e4e7" />
        {series.map(s => (
          <g key={s.key}>
            <polyline
              points={s.values.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')}
              fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={sx(i)} cy={sy(v)} r={n > 24 ? 1.6 : 2.6} fill="#fff" stroke={s.color} strokeWidth="1.4">
                <title>{`${labels[i]} · ${s.label} ${currency ? money(v) : v}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {labels.map((t, i) => (i % step === 0 || i === n - 1
          ? <text key={t + i} x={sx(i)} y={H - 10} textAnchor="middle" fontSize="12" fill="#71717a">{t}</text>
          : null))}
      </svg>
      <div className="row wrap" style={{ gap: 14, justifyContent: 'center' }}>
        {series.map(s => (
          <span key={s.key} className="row muted" style={{ gap: 5 }}>
            <i style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: 'inline-block' }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ============ 엔드포인트 상태 pill ============ */

function EpPill({ e }: { e: RpEndpoint }) {
  const s = deriveStatus(e)
  const m = RP_STATUS[s]
  return <span className={'badge ' + m.cls}><i className="dot" />{m.label}</span>
}

/* ============ 설정 패치 폼 ============ */

interface PatchDraft {
  name: string; gpuTypeIds: string; dataCenterIds: string; templateId: string; networkVolumeId: string
  scalerType: string; scalerValue: string; workersMin: string; workersMax: string
  idleTimeout: string; executionTimeoutMs: string; flashBoot: boolean
}

const draftOf = (e: RpEndpoint): PatchDraft => ({
  name: e.name,
  gpuTypeIds: e.gpuTypes.join(', '),
  dataCenterIds: e.dataCenters.join(', '),
  templateId: e.templateId,
  networkVolumeId: e.networkVolumeId,
  scalerType: e.scalerType,
  scalerValue: String(e.scalerValue),
  workersMin: String(e.workersMin),
  workersMax: String(e.workersMax),
  idleTimeout: String(e.idleTimeout),
  executionTimeoutMs: String(e.executionTimeoutMs),
  flashBoot: e.flashBoot,
})

function buildEndpointPatch(d: PatchDraft) {
  const errors: string[] = []
  const patch: Record<string, unknown> = {}
  const csv = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean)
  const int = (v: string, key: string) => {
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0) { errors.push(`${key}는 0 이상의 숫자여야 합니다.`); return null }
    return Math.round(n)
  }

  if (d.name.trim()) patch.name = d.name.trim()
  const gpu = csv(d.gpuTypeIds)
  if (!gpu.length) errors.push('gpuTypeIds에 GPU 종류가 최소 1개 있어야 합니다.')
  else patch.gpuTypeIds = gpu
  patch.dataCenterIds = csv(d.dataCenterIds)
  if (d.templateId.trim()) patch.templateId = d.templateId.trim()
  if (d.networkVolumeId.trim()) patch.networkVolumeId = d.networkVolumeId.trim()
  if (!d.scalerType) errors.push('scalerType은 필수입니다.')
  else patch.scalerType = d.scalerType
  const sv = int(d.scalerValue, 'scalerValue')
  if (sv !== null) patch.scalerValue = sv
  const wmin = int(d.workersMin, 'workersMin')
  const wmax = int(d.workersMax, 'workersMax')
  if (wmin !== null && wmax !== null && wmin > wmax) errors.push('workersMin은 workersMax보다 작거나 같아야 합니다.')
  if (wmin !== null) patch.workersMin = wmin
  if (wmax !== null) patch.workersMax = wmax
  const idle = int(d.idleTimeout, 'idleTimeout')
  if (idle !== null) patch.idleTimeout = idle
  const exec = int(d.executionTimeoutMs, 'executionTimeoutMs')
  if (exec !== null) patch.executionTimeoutMs = exec
  patch.flashBoot = d.flashBoot

  return { patch, errors }
}

function PatchForm({ ep, readOnly, onToast }: { ep: RpEndpoint; readOnly: boolean; onToast: (m: string) => void }) {
  const role = useRole()
  const canPatch = can(role, 'endpoint_patch')
  const [d, setD] = useState<PatchDraft>(() => draftOf(ep))
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof PatchDraft>(k: K, v: PatchDraft[K]) => setD(p => ({ ...p, [k]: v }))

  const apply = () => {
    const r = buildEndpointPatch(d)
    setErrors(r.errors)
    if (!r.errors.length) onToast(`${ep.id} 설정 패치 적용 (${Object.keys(r.patch).length}개 키), 감사 로그 기록`)
  }

  return (
    <Card title="설정 패치" sub="필요한 항목만 고쳐 적용하세요">
      <div className="col" style={{ gap: 16 }}>
        {readOnly && (
          <div className="signal warn">
            <AlertTriangle size={15} className="ic" />
            <div><b>읽기 전용 키</b>
              <p>이 키는 엔드포인트 쓰기 권한이 없어 패치를 적용할 수 없습니다. 값은 참고용으로만 표시됩니다.</p></div>
          </div>
        )}
        <div className="grid g3">
          <Field label="이름" hint="name"><input className="input" value={d.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="GPU 종류" hint="쉼표로 구분">
            <input className="input" value={d.gpuTypeIds} onChange={e => set('gpuTypeIds', e.target.value)} placeholder="GPU-A, GPU-B" />
          </Field>
          <Field label="데이터센터" hint="쉼표로 구분">
            <input className="input" value={d.dataCenterIds} onChange={e => set('dataCenterIds', e.target.value)} placeholder="US-KS-2, EU-CZ-1" />
          </Field>
          <Field label="템플릿 ID" hint="값이 있을 때만 전송">
            <input className="input" value={d.templateId} onChange={e => set('templateId', e.target.value)} />
          </Field>
          <Field label="네트워크 볼륨 ID" hint="값이 있을 때만 전송">
            <input className="input" value={d.networkVolumeId} onChange={e => set('networkVolumeId', e.target.value)} />
          </Field>
          <Field label="스케일러 종류">
            <select className="input" value={d.scalerType} onChange={e => set('scalerType', e.target.value)}>
              <option value="REQUEST_COUNT">REQUEST_COUNT</option>
              <option value="QUEUE_DELAY">QUEUE_DELAY</option>
              <option value="NONE">NONE</option>
            </select>
          </Field>
          <Field label="스케일러 값" hint="0 이상">
            <input className="input" type="number" min={0} value={d.scalerValue} onChange={e => set('scalerValue', e.target.value)} />
          </Field>
          <Field label="최소 워커" hint="0 이상, workersMax 이하">
            <input className="input" type="number" min={0} value={d.workersMin} onChange={e => set('workersMin', e.target.value)} />
          </Field>
          <Field label="최대 워커" hint="0 이상">
            <input className="input" type="number" min={0} value={d.workersMax} onChange={e => set('workersMax', e.target.value)} />
          </Field>
          <Field label="유휴 타임아웃 (초)" hint="0 이상">
            <input className="input" type="number" min={0} value={d.idleTimeout} onChange={e => set('idleTimeout', e.target.value)} />
          </Field>
          <Field label="실행 타임아웃 (ms)" hint="0 이상">
            <input className="input" type="number" min={0} value={d.executionTimeoutMs} onChange={e => set('executionTimeoutMs', e.target.value)} />
          </Field>
          <Field label="Flash boot">
            <label className="check" style={{ height: 36 }}>
              <input type="checkbox" checked={d.flashBoot} onChange={e => set('flashBoot', e.target.checked)} />
              <span>콜드 스타트 단축 사용</span>
            </label>
          </Field>
        </div>
        {errors.length > 0 && (
          <div className="signal err">
            <AlertTriangle size={15} className="ic" />
            <div><b>검증 실패 {errors.length}건</b>
              {errors.map(m => <p key={m}>{m}</p>)}</div>
          </div>
        )}
        {errors.length === 0 && (
          <div className="signal">
            <Info size={15} className="ic" />
            <div><b>안전 패치</b>
              <p>실행 중인 작업은 보존되며 변경 사항은 신규 작업부터 적용됩니다. 변경 내역은 감사 로그에 기록됩니다.</p></div>
          </div>
        )}
        <div className="row wrap">
          <span className="faint">{roleNote(role, ['endpoint_patch'])}</span>
          <div className="sp" />
          <button className="btn" disabled={readOnly || !canPatch} title={gateTitle(role, 'endpoint_patch')}
            onClick={() => { setD(draftOf(ep)); setErrors([]); onToast('폼 초기화') }}>
            <RotateCcw size={14} />초기화
          </button>
          <button className="btn primary" disabled={readOnly || !canPatch} title={gateTitle(role, 'endpoint_patch')}
            onClick={apply}><Settings2 size={14} />패치 적용</button>
        </div>
      </div>
    </Card>
  )
}

/* ============ 시안 상태 (세 화면 공유) ============ */

function useDemo() {
  const mode = useSyncExternalStore(subscribeDemoMode, getDemoMode)
  return { mode, adminOk: mode !== 'readonly', billingOk: mode === 'full' }
}

const NO_BILLING_MSG = '이 RunPod 키는 과금 이력을 읽을 수 없어, 관리자 권한 키를 설정할 때까지 지출 차트를 사용할 수 없습니다.'

function ModeSignal({ mode }: { mode: DemoMode }) {
  if (mode === 'readonly') {
    return (
      <div className="signal warn">
        <AlertTriangle size={15} className="ic" />
        <div><b>읽기 전용 키로 동작 중</b>
          <p>이 RunPod 키는 작업 제출과 /health 조회는 가능하지만, 엔드포인트 관리와 과금 API는 거부되었습니다.
            상태 기반 모니터링만 제공되며 지출 조회와 패치 작업은 비활성화됩니다.</p>
          <p><span className="mono">RUNPOD_API_KEY</span> 권한을 확인한 뒤 pipeline-mcp를 재시작하세요.</p></div>
      </div>
    )
  }
  if (mode === 'nobilling') {
    return (
      <div className="signal warn">
        <AlertTriangle size={15} className="ic" />
        <div><b>과금 정보 사용 불가</b>
          <p>이 키에는 엔드포인트 과금 조회 권한이 없습니다. 사용량 모니터링은 정상 동작하며 지출 관련 카드만 비활성화됩니다.</p></div>
      </div>
    )
  }
  return null
}

const usageSeries = (rows: UsagePoint[]): Series[] => [
  { key: 'workers', label: '워커', color: '#0b6f7b', values: rows.map(r => r.workers) },
  { key: 'queued', label: '대기', color: '#f3b74f', values: rows.map(r => r.queued) },
  { key: 'running', label: '실행', color: '#2f9e44', values: rows.map(r => r.running) },
]
const spendSeries = (rows: SpendPoint[]): Series[] => [
  { key: 'cost', label: '비용', color: '#c7841d', values: rows.map(r => r.cost) },
]

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const peak = (xs: number[]) => (xs.length ? Math.max(...xs) : 0)

function spendStats(rows: SpendPoint[]) {
  const peakRow = rows.reduce((a, b) => (b.cost > a.cost ? b : a), rows[0] ?? { t: '-', cost: 0, records: 0 })
  return {
    latest: rows.length ? rows[rows.length - 1].cost : 0,
    total: rows.reduce((a, p) => a + p.cost, 0),
    peakT: peakRow.t,
    peakV: peakRow.cost,
    records: rows.reduce((a, p) => a + p.records, 0),
  }
}

/** 창 하나에 대한 엔드포인트별 사용량·지출 시계열 */
function useSeriesByEndpoint(win: MonWindow) {
  const usage = useMemo(() => {
    const m: Record<string, UsagePoint[]> = {}
    RP_ENDPOINTS.forEach(e => { m[e.id] = buildUsage(e.id, win, e) })
    return m
  }, [win])
  const spend = useMemo(() => {
    const m: Record<string, SpendPoint[]> = {}
    RP_ENDPOINTS.forEach(e => { m[e.id] = buildSpend(e.id, win, e) })
    return m
  }, [win])
  return { usage, spend }
}

function SeriesSummary({ series }: { series: Series[] }) {
  return (
    <Card title="계열 요약" sub={`series.length건`}>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th className="no">No.</th><th>계열</th><th className="num">최신</th><th className="num">평균</th><th className="num">최대</th></tr></thead>
          <tbody>
            {series.map((s, i) => (
              <tr key={s.key}>
                <td className="no">{i + 1}</td>
                <td>{s.label}</td>
                <td className="num">{s.values[s.values.length - 1] ?? 0}</td>
                <td className="num">{num2(avg(s.values))}</td>
                <td className="num">{peak(s.values)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ============ 엔드포인트 목록 ============ */

/* 과금 조회가 막혀 있을 때 메뉴에서 알려 주는 사유. */
const BILLING_OFF = '과금 조회 권한이 없어 내려받을 수 없습니다'

export function GpuList({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const { mode, adminOk, billingOk } = useDemo()
  const [preset, setPreset] = useState<Preset>('week')
  const [offset, setOffset] = useState(0)
  const [managedOnly, setManagedOnly] = useState(true)
  const [includeWorkers, setIncludeWorkers] = useState(true)

  const win = useMemo(() => buildWindow(preset, offset), [preset, offset])
  const { spend } = useSeriesByEndpoint(win)

  const visible = useMemo(
    () => RP_ENDPOINTS.filter(e => (managedOnly ? e.managed.length > 0 : true)),
    [managedOnly],
  )

  const spendTotal = (id: string) => (spend[id] ?? []).reduce((a, p) => a + p.cost, 0)
  const fleetCost = visible.reduce((a, e) => a + spendTotal(e.id), 0)

  const kpi = {
    total: RP_ENDPOINTS.length,
    managed: RP_ENDPOINTS.filter(e => e.managed.length > 0).length,
    wMin: visible.reduce((a, e) => a + e.workersMin, 0),
    wMax: visible.reduce((a, e) => a + e.workersMax, 0),
    live: visible.reduce((a, e) => a + e.workersLive, 0),
    running: visible.reduce((a, e) => a + e.inProgress, 0),
    queued: visible.reduce((a, e) => a + e.inQueue, 0),
  }

  const scopeOptions = MANAGED_SERVICES.map(s => ({
    ...s,
    linked: RP_ENDPOINTS.some(e => e.id === s.endpointId),
  }))
  const missing = scopeOptions.filter(s => !s.linked)

  return (
    <>
      <PageHead
        title="RunPod 엔드포인트"
        desc="엔드포인트를 골라 상태와 설정을 확인하세요."
        actions={<>
          <select className="input" value={mode} onChange={e => setDemoMode(e.target.value as DemoMode)}>
            {DEMO_MODES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <button className="btn" onClick={() => nav('/gpu/usage')}>사용량 · 지출</button>
          <button className="btn" onClick={() => onToast(`엔드포인트 상태 새로고침${includeWorkers ? ' (워커 포함)' : ''}`)}>
            <RefreshCw size={14} />새로고침
          </button>
        </>}
      />

      <ModeSignal mode={mode} />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        <Stat label="엔드포인트" value={`${kpi.total} / ${kpi.managed}`} delta="조회 가능 / 관리 대상" />
        <Stat label="용량" value={`${kpi.wMin} / ${kpi.wMax}`} delta="workersMin / workersMax" />
        <Stat label="실행 중 워커" value={kpi.live} unit="개" delta="RunPod가 보고한 워커 수" />
        <Stat label="실행 / 대기" value={`${kpi.running} / ${kpi.queued}`} delta="진행 중 작업 / 큐 작업" />
        <Stat label="기간 비용" value={billingOk ? money(fleetCost) : '사용 불가'}
          delta={billingOk ? '달력 기준 fleet 과금' : '관리자 과금 API 권한 필요'} />
      </div>

      <Card
        title="모니터링 기간"
        right={<>
          <button className="btn sm" onClick={() => setOffset(o => o - 1)}><ChevronLeft size={14} />이전</button>
          <select className="input" value={preset} onChange={e => { setPreset(e.target.value as Preset); setOffset(0) }}>
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <button className="btn sm" disabled={!win.hasNext} onClick={() => setOffset(o => o + 1)}>다음<ChevronRight size={14} /></button>
        </>}
      >
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            <span className="badge brand">{win.title}</span>
            <span>{win.rangeLabel}</span>
            <div className="sp" />
            <span className="muted">마지막 동기화: {COLLECTOR.lastUsageSync}</span>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            목록의 기간 비용, 사용량 화면, CSV 내려받기가 모두 이 달력 기간을 공유합니다.
          </p>
          <Block title="해상도 · 수집 주기 · 보존 기간">
            <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
              <dt>사용량 해상도</dt><dd>{win.usageResolution} · limit {win.usageLimit}</dd>
              <dt>과금 해상도</dt><dd className="mono">{win.billingResolution} · bucket {win.billingBucketSize}</dd>
              <dt>수집 주기</dt><dd>사용량 {COLLECTOR.usageIntervalSeconds}초 · 과금 {COLLECTOR.billingIntervalSeconds}초 · 화면 자동 갱신 {COLLECTOR.autoRefreshMs / 1000}초</dd>
              <dt>보존 기간</dt><dd>사용량 {COLLECTOR.usageRetentionDays}일 · 과금 {COLLECTOR.billingRetentionDays}일</dd>
            </dl>
          </Block>
        </div>
      </Card>

      <Card title="엔드포인트" sub={`${visible.length}개 표시 중 · 카드를 누르면 상세로 이동합니다`}>
        {visible.length === 0 ? <div className="empty">현재 필터에 해당하는 엔드포인트가 없습니다.</div> : (
          <div className="grid g2">
            {visible.map(e => (
              <div key={e.id} className="pipe-card" onClick={() => nav(`/gpu/${e.id}`)}>
                <div className="col" style={{ gap: 12 }}>
                  <div className="row wrap">
                    <b>{e.name}</b>
                    <span className="mono faint">{e.id}</span>
                    <div className="sp" />
                    <EpPill e={e} />
                  </div>
                  <div className="row wrap">
                    {e.managed.length
                      ? e.managed.map(m => <span key={m} className="badge brand">{m}</span>)
                      : <span className="badge">관리 매핑 없음</span>}
                    <span className="muted">{e.computeType}</span>
                  </div>
                  <div className="grid g4">
                    {[
                      ['워커', `${e.workersLive} / ${e.workersMax}`],
                      ['실행', String(e.inProgress)],
                      ['대기', String(e.inQueue)],
                      ['기간 비용', billingOk ? money(spendTotal(e.id)) : '사용 불가'],
                    ].map(([l, v]) => (
                      <div key={l} className="col" style={{ gap: 4 }}>
                        <span className="muted">{l}</span>
                        <b className="mono">{v}</b>
                      </div>
                    ))}
                  </div>
                  <Progress v={e.workersMax ? (e.workersLive / e.workersMax) * 100 : 0} />
                  <dl className="kv" style={{ gridTemplateColumns: '92px 1fr' }}>
                    <dt>GPU 종류</dt><dd>{e.gpuTypes.length ? e.gpuTypes.join(' · ') : 'GPU 종류 없음'}</dd>
                    <dt>스케일</dt><dd className="mono">{e.workersMin} ~ {e.workersMax}</dd>
                    <dt>데이터센터</dt><dd>{e.dataCenters.length ? e.dataCenters.join(' · ') : '데이터센터 정보 없음'}</dd>
                    <dt>바인딩</dt><dd className="mono">{e.binding.length ? e.binding.join(' · ') : '파이프라인 매핑 없음'}</dd>
                  </dl>
                  <div className="row">
                    <div className="sp" />
                    <button className="btn sm" onClick={ev => { ev.stopPropagation(); nav(`/gpu/${e.id}`) }}>엔드포인트 열기</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <GroupTitle title="목록 범위와 연결" />

      <Card title="엔드포인트 범위">
        <div className="col" style={{ gap: 16 }}>
          <p className="muted" style={{ margin: 0 }}>
            fleet 전체를 훑을 때는 관리 대상만 끄고, 차트·내려받기·워커 상태·패치가 필요할 때 엔드포인트 하나를 엽니다.
          </p>
          {scopeOptions.length === 0 ? <div className="empty">관리 엔드포인트 매핑이 설정되지 않았습니다.</div> : (
            <div className="row wrap">
              {scopeOptions.map(s => (
                <button key={s.key} className="btn" disabled={!s.linked} onClick={() => nav(`/gpu/${s.endpointId}`)}>
                  {s.label}<span className="mono">{s.endpointId}</span>
                </button>
              ))}
            </div>
          )}
          <div className="row wrap" style={{ gap: 20 }}>
            <label className="check">
              <input type="checkbox" checked={managedOnly} onChange={e => setManagedOnly(e.target.checked)} />
              <span>관리 대상만</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={includeWorkers} onChange={e => setIncludeWorkers(e.target.checked)} />
              <span>새로고침에 워커 포함</span>
            </label>
          </div>
          {missing.length > 0 && (
            <div className="signal warn">
              <AlertTriangle size={15} className="ic" />
              <div><b>설정됐지만 없는 엔드포인트 {missing.length}건</b>
                {missing.map(m => (
                  <p key={m.key}>{m.label} · <span className="mono">{m.endpointId}</span> 를 RunPod에서 찾을 수 없습니다.</p>
                ))}</div>
            </div>
          )}
        </div>
      </Card>

      <Card title="연결 설정" sub="파이프라인 API 주소와 관리자 권한">
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            <span className={'badge ' + (adminOk ? 'ok' : 'warn')}>{adminOk ? '인증됨 (admin)' : '권한 제한'}</span>
            <span className="muted">마지막 새로고침: {COLLECTOR.lastUsageSync}</span>
          </div>
          <div className="grid g2">
            <Field label="파이프라인 API 기준 주소" hint="로컬은 http://127.0.0.1:18080, 프록시 뒤에서는 /pipeline/api">
              <input className="input" defaultValue="http://127.0.0.1:18080" />
            </Field>
            <Field label="관리자 권한" hint="RunPod 컨트롤룸은 admin 역할이 필요합니다">
              <input className="input" defaultValue="admin · chalco" readOnly />
            </Field>
          </div>
          <div className="row wrap">
            <button className="btn primary" onClick={() => onToast('API 기준 주소 저장')}>주소 저장</button>
            <MoreMenu items={[
              { label: '연결 상태 점검', onClick: () => onToast('GET /healthz 정상 응답') },
              { label: '메인 콘솔로 이동', onClick: () => onToast('메인 콘솔로 이동') },
              { label: '로그아웃', danger: true, onClick: () => onToast('토큰 삭제, 로그아웃') },
            ]} />
          </div>
        </div>
      </Card>
    </>
  )
}

/* ============ 엔드포인트 상세 ============ */

export function GpuDetail({ onToast }: { onToast: (m: string) => void }) {
  const { id } = useParams()
  const { mode, adminOk, billingOk } = useDemo()
  const role = useRole()
  const canPatch = can(role, 'endpoint_patch')
  const [preset, setPreset] = useState<Preset>('week')
  const [view, setView] = useState<'usage' | 'spend'>('usage')

  const win = useMemo(() => buildWindow(preset, 0), [preset])
  const { usage, spend } = useSeriesByEndpoint(win)

  const ep = RP_ENDPOINTS.find(e => e.id === id) ?? null
  const back = { to: '/gpu', label: '목록으로' }

  if (!ep) {
    return (
      <>
        <PageHead title="엔드포인트 상세" desc="목록에서 엔드포인트를 골라 상세 정보를 확인하세요." back={back} />
        <Card title="엔드포인트 상세">
          <div className="empty">
            {id ? `엔드포인트 ${id} 를 찾을 수 없습니다. 목록에서 다시 선택하세요.` : '엔드포인트가 지정되지 않았습니다. 목록에서 선택하세요.'}
          </div>
        </Card>
      </>
    )
  }

  const epUsage = usage[ep.id] ?? []
  const epSpend = spend[ep.id] ?? []
  const es = spendStats(epSpend)
  const spendTotal = epSpend.reduce((a, p) => a + p.cost, 0)

  const dl = (name: string) => onToast(`${name} 내려받기 (목업)`)

  const quickPatch = (kind: 'warm' | 'burst' | 'pause') => {
    const patch = kind === 'pause' ? { workersMin: 0, workersMax: 0 }
      : kind === 'warm' ? { workersMin: Math.max(ep.workersMin, 1), workersMax: Math.max(ep.workersMax, 1) }
        : { workersMax: Math.max(ep.workersMax, 4) }
    onToast(`${ep.id} 빠른 작업: ${JSON.stringify(patch)}`)
  }

  return (
    <>
      <PageHead
        title={ep.name}
        desc="워커 상태를 확인하고 필요한 설정을 고쳐 적용하세요."
        back={back}
        actions={<>
          <button className="btn" disabled={!adminOk || !canPatch} title={gateTitle(role, 'endpoint_patch')}
            onClick={() => quickPatch('warm')}><Flame size={14} />Warm x1</button>
          <button className="btn" disabled={!adminOk || !canPatch} title={gateTitle(role, 'endpoint_patch')}
            onClick={() => quickPatch('burst')}><Zap size={14} />Burst x4</button>
          <button className="btn danger" disabled={!adminOk || !canPatch} title={gateTitle(role, 'endpoint_patch')}
            onClick={() => quickPatch('pause')}><Pause size={14} />일시중지</button>
        </>}
      />

      <ModeSignal mode={mode} />

      <Card title="엔드포인트 개요">
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            <EpPill e={ep} />
            {ep.managed.length
              ? ep.managed.map(m => <span key={m} className="badge brand">{m}</span>)
              : <span className="badge">관리 매핑 없음</span>}
            <span className="muted">{ep.computeType}</span>
            <div className="sp" />
            <span className="muted">
              파이프라인 바인딩: {ep.binding.length ? ep.binding.join(' · ') : '파이프라인 매핑 없음'}
            </span>
          </div>
          <div className="row wrap">
            <span className="faint">{roleNote(role, ['endpoint_patch'])}</span>
          </div>
          <div className="grid g4">
            <Stat label="스케일" value={`${ep.workersMin} ~ ${ep.workersMax}`} delta="workersMin ~ workersMax" />
            <Stat label="스케일러 값" value={ep.scalerValue} delta={`scalerType ${ep.scalerType}`} />
            <Stat label="대기 작업" value={ep.inQueue} unit="건" delta="health_jobs.in_queue" />
            <Stat label="실행 작업" value={ep.inProgress} unit="건" delta="health_jobs.in_progress" />
          </div>
          <div className="grid g2">
            <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
              <dt>상태</dt><dd>{RP_STATUS[deriveStatus(ep)].label}</dd>
              <dt>엔드포인트 ID</dt><dd className="mono">{ep.id}</dd>
              <dt>관리 주체</dt><dd>{ep.managed.join(', ') || '관리 매핑 없음'}</dd>
              <dt>템플릿</dt><dd>{ep.templateName} <span className="mono faint">{ep.templateId}</span></dd>
            </dl>
            <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
              <dt>데이터 출처</dt><dd>{adminOk && ep.source === 'admin' ? 'RunPod 관리 API' : 'Health 대체'}</dd>
              <dt>워커</dt><dd className="mono">{ep.workersMin} ~ {ep.workersMax} · 현재 {ep.workersLive}개</dd>
              <dt>기간 비용</dt><dd>{billingOk ? money(spendTotal) : '사용 불가'}</dd>
              <dt>워커 시간당 비용</dt><dd>{money(ep.hourlyCost)}</dd>
            </dl>
          </div>
        </div>
      </Card>

      <Card title="워커" sub={`${ep.name} 실시간 워커 상태`}>
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            {Object.keys(ep.workerStates).length
              ? Object.entries(ep.workerStates).map(([k, v]) => <span key={k} className="badge accent">{k}:{v}</span>)
              : <span className="badge">워커 없음</span>}
          </div>
          {!adminOk ? (
            <div className="empty">Health API는 워커 수 집계만 제공하므로 워커별 pod 정보는 사용할 수 없습니다.</div>
          ) : ep.workers.length === 0 ? (
            <div className="empty">RunPod가 이 엔드포인트의 실시간 워커를 반환하지 않았습니다.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th className="no">No.</th><th>ID</th><th>상태</th><th>GPU</th><th className="num">시간당 비용</th></tr></thead>
                <tbody>
                  {ep.workers.map((w, i) => (
                    <tr key={w.id}>
                      <td className="no">{i + 1}</td>
                      <td className="mono">{w.id}</td>
                      <td><span className={'badge ' + (w.status === 'running' ? 'run' : w.status === 'idle' ? '' : 'ok')}>{w.status}</span></td>
                      <td>{w.gpu}</td>
                      <td className="num">{money(w.costHr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Block title="배치 · 파이프라인 매핑">
            <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
              <dt>데이터센터</dt><dd>{ep.dataCenters.length ? ep.dataCenters.join(' · ') : '데이터센터 정보 없음'}</dd>
              <dt>파이프라인 매핑</dt><dd className="mono">{ep.binding.length ? ep.binding.join(' · ') : '파이프라인 매핑 없음'}</dd>
            </dl>
          </Block>
        </div>
      </Card>

      <Card
        title={view === 'usage' ? '이 엔드포인트 사용량' : '이 엔드포인트 지출'}
        sub={win.rangeLabel}
        right={<>
          <Seg items={[{ key: 'usage', label: '사용량' }, { key: 'spend', label: '지출' }]} value={view} onChange={setView} />
          <select className="input" value={preset} onChange={e => setPreset(e.target.value as Preset)}>
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {/* 보고 있는 탭에 맞는 파일만 내려받게 한다. */}
          <MoreMenu title="내려받기" items={view === 'usage'
            ? [
              { label: '사용량 표 (CSV)', onClick: () => dl(`runpod-endpoint-${ep.id}-usage-${win.suffix}.csv`) },
              { label: '사용량 그래프 (SVG)', onClick: () => dl(`runpod-endpoint-${ep.id}-usage-${win.suffix}.svg`) },
            ]
            : [
              { label: '과금 표 (CSV)', disabled: !billingOk, note: BILLING_OFF, onClick: () => dl(`runpod-endpoint-${ep.id}-billing-${win.suffix}.csv`) },
              { label: '지출 그래프 (SVG)', disabled: !billingOk, note: BILLING_OFF, onClick: () => dl(`runpod-endpoint-${ep.id}-spend-${win.suffix}.svg`) },
            ]} />
        </>}
      >
        {view === 'usage' ? (
          <div className="col" style={{ gap: 16 }}>
            <LineChart series={usageSeries(epUsage)} labels={win.labels} />
            <SeriesSummary series={usageSeries(epUsage)} />
          </div>
        ) : billingOk ? (
          <div className="col" style={{ gap: 16 }}>
            <LineChart series={spendSeries(epSpend)} labels={win.labels} currency />
            <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
              <dt>최신</dt><dd>{money(es.latest)}</dd>
              <dt>합계</dt><dd>{money(es.total)}</dd>
              <dt>{win.peakLabel}</dt><dd className="mono">{es.peakT} · {money(es.peakV)}</dd>
              <dt>기록 수</dt><dd>{es.records}</dd>
            </dl>
          </div>
        ) : <div className="empty">{NO_BILLING_MSG}</div>}
      </Card>

      <PatchForm key={ep.id} ep={ep} readOnly={!adminOk} onToast={onToast} />
    </>
  )
}

/* ============ fleet 사용량 · 지출 ============ */

export function GpuUsage({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const { mode, billingOk } = useDemo()
  const [preset, setPreset] = useState<Preset>('week')
  const [offset, setOffset] = useState(0)
  const [managedOnly, setManagedOnly] = useState(true)

  const win = useMemo(() => buildWindow(preset, offset), [preset, offset])
  const prevWin = useMemo(() => buildWindow(preset, offset - 1), [preset, offset])
  const cur = useSeriesByEndpoint(win)
  const prev = useSeriesByEndpoint(prevWin)

  const visible = useMemo(
    () => RP_ENDPOINTS.filter(e => (managedOnly ? e.managed.length > 0 : true)),
    [managedOnly],
  )

  const fleetUsage = useMemo(() => sumUsage(visible.map(e => cur.usage[e.id]), win.labels), [visible, cur, win])
  const fleetSpend = useMemo(() => sumSpend(visible.map(e => cur.spend[e.id]), win.labels), [visible, cur, win])
  const prevFleetUsage = useMemo(() => sumUsage(visible.map(e => prev.usage[e.id]), prevWin.labels), [visible, prev, prevWin])
  const prevFleetSpend = useMemo(() => sumSpend(visible.map(e => prev.spend[e.id]), prevWin.labels), [visible, prev, prevWin])

  const fleetCost = fleetSpend.reduce((a, p) => a + p.cost, 0)
  const prevFleetCost = prevFleetSpend.reduce((a, p) => a + p.cost, 0)
  const fs = spendStats(fleetSpend)

  const spendTotal = (id: string) => (cur.spend[id] ?? []).reduce((a, p) => a + p.cost, 0)
  const recordsTotal = (id: string) => (cur.spend[id] ?? []).reduce((a, p) => a + p.records, 0)

  const dl = (name: string) => onToast(`${name} 내려받기 (목업)`)

  return (
    <>
      <PageHead
        title="사용량 · 지출"
        desc="기간을 바꿔 가며 fleet 전체의 사용량과 비용을 직전 기간과 비교하세요."
        actions={<>
          <button className="btn" onClick={() => setOffset(o => o - 1)}><ChevronLeft size={14} />이전</button>
          <select className="input" value={preset} onChange={e => { setPreset(e.target.value as Preset); setOffset(0) }}>
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <button className="btn" disabled={!win.hasNext} onClick={() => setOffset(o => o + 1)}>다음<ChevronRight size={14} /></button>
          <button className="btn" onClick={() => nav('/gpu')}>엔드포인트 목록</button>
        </>}
      />

      <ModeSignal mode={mode} />

      <div className="grid g4">
        <Stat label="기간 비용" value={billingOk ? money(fleetCost) : '사용 불가'}
          delta={billingOk ? deltaText(fleetCost, prevFleetCost, money) : `직전 기간: ${prevWin.rangeLabel}`} />
        <Stat label="평균 워커" value={num2(avg(fleetUsage.map(r => r.workers)))}
          delta={deltaText(avg(fleetUsage.map(r => r.workers)), avg(prevFleetUsage.map(r => r.workers)), num2)} />
        <Stat label="평균 실행" value={num2(avg(fleetUsage.map(r => r.running)))}
          delta={deltaText(avg(fleetUsage.map(r => r.running)), avg(prevFleetUsage.map(r => r.running)), num2)} />
        <Stat label="최대 대기" value={peak(fleetUsage.map(r => r.queued))} unit="건"
          delta={deltaText(peak(fleetUsage.map(r => r.queued)), peak(prevFleetUsage.map(r => r.queued)), v => String(Math.round(v)))} />
      </div>

      <GroupTitle
        title={`${win.title} · ${win.rangeLabel}`}
        sub={`직전 기간 ${prevWin.rangeLabel} 과 비교 · ${visible.length}개 엔드포인트 합계`}
        right={<label className="check">
          <input type="checkbox" checked={managedOnly} onChange={e => setManagedOnly(e.target.checked)} />
          <span>관리 대상만</span>
        </label>}
      />

      <div className="grid g2">
        <Card
          title="fleet 사용량"
          right={<MoreMenu title="내려받기" items={[
            { label: '사용량 표 (CSV)', onClick: () => dl(`runpod-fleet-usage-${win.suffix}.csv`) },
            { label: '사용량 그래프 (SVG)', onClick: () => dl(`runpod-fleet-usage-${win.suffix}.svg`) },
          ]} />}
        >
          <div className="col" style={{ gap: 16 }}>
            <LineChart series={usageSeries(fleetUsage)} labels={win.labels} />
            <SeriesSummary series={usageSeries(fleetUsage)} />
          </div>
        </Card>

        <Card
          title="fleet 지출"
          right={<MoreMenu title="내려받기" items={[
            { label: '과금 표 (CSV)', disabled: !billingOk, note: BILLING_OFF, onClick: () => dl(`runpod-fleet-billing-${win.suffix}.csv`) },
            { label: '지출 그래프 (SVG)', disabled: !billingOk, note: BILLING_OFF, onClick: () => dl(`runpod-fleet-spend-${win.suffix}.svg`) },
          ]} />}
        >
          {billingOk ? (
            <div className="col" style={{ gap: 16 }}>
              <LineChart series={spendSeries(fleetSpend)} labels={win.labels} currency />
              <dl className="kv" style={{ gridTemplateColumns: '132px 1fr' }}>
                <dt>최신</dt><dd>{money(fs.latest)}</dd>
                <dt>합계</dt><dd>{money(fs.total)}</dd>
                <dt>{win.peakLabel}</dt><dd className="mono">{fs.peakT} · {money(fs.peakV)}</dd>
                <dt>기록 수</dt><dd>{fs.records}</dd>
              </dl>
            </div>
          ) : <div className="empty">{NO_BILLING_MSG}</div>}
        </Card>
      </div>

      <Card title="지출 원장">
        <div className="col" style={{ gap: 16 }}>
          <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
            <dt>기간</dt><dd>{win.title} · {win.rangeLabel}</dd>
            <dt>총 지출</dt><dd>{billingOk
              ? `${money(RP_ENDPOINTS.reduce((a, e) => a + spendTotal(e.id), 0))} · ${RP_ENDPOINTS.length}개 엔드포인트`
              : '사용 불가 (관리자 과금 API 권한 필요)'}</dd>
            <dt>관리 대상 지출</dt><dd>{billingOk
              ? money(RP_ENDPOINTS.filter(e => e.managed.length).reduce((a, e) => a + spendTotal(e.id), 0))
              : '사용 불가 (RunPod 관리 API 권한 필요)'}</dd>
          </dl>
          {!billingOk ? (
            <div className="empty">이 키는 과금 이력을 조회할 수 없습니다. 관리자 권한 RunPod 키를 설정하세요.</div>
          ) : visible.length === 0 ? (
            <div className="empty">선택한 달력 기간에 반환된 과금 버킷이 없습니다.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th className="no">No.</th><th>엔드포인트</th><th>이름</th><th className="num">비용</th><th className="num">기록 수</th></tr></thead>
                <tbody>
                  {RP_ENDPOINTS.map((e, i) => (
                    <tr key={e.id} onClick={() => nav(`/gpu/${e.id}`)}>
                      <td className="no">{i + 1}</td>
                      <td className="mono">{e.id}</td>
                      <td>{e.name}</td>
                      <td className="num">{money(spendTotal(e.id))}</td>
                      <td className="num">{recordsTotal(e.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card title="CSV 머리글 안내">
        <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
          <dt>사용량 CSV</dt><dd>endpoint_id,timestamp,workers,queued,running</dd>
          <dt>과금 CSV</dt><dd className="mono">endpoint_id,endpoint_name,timestamp,cost,records</dd>
        </dl>
      </Card>
    </>
  )
}

/* ============ 작업 큐 ============ */

export function Jobs({ onToast }: { onToast: (m: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'failed'>('all')
  const [run, setRun] = useState(QUEUE_RUNS[0].run)
  const [statsMode, setStatsMode] = useState<'ewma' | 'empty'>('ewma')

  const rows = JOBS.filter(j =>
    filter === 'all' ? true
      : filter === 'active' ? ['running', 'queued', 'retry'].includes(j.state)
        : ['failed'].includes(j.state))

  const curRun = QUEUE_RUNS.find(r => r.run === run) ?? QUEUE_RUNS[0]
  const stages = STAGE_QUEUES.map(s => {
    const avg = statsMode === 'ewma' ? s.avg : null
    return { ...s, avg, eta: estimateStageEta(s.queued, s.workers, avg) }
  })
  const cur = stages.find(s => s.stage === curRun.stage)
  const runFinish = cur?.eta.finishS ?? null

  return (
    <>
      <PageHead
        title="작업 큐"
        desc="대기 중인 작업과 예상 완료 시각을 확인하세요."
        actions={<>
          <button className="btn" onClick={() => onToast('큐 일시중지')}><Pause size={14} />큐 일시중지</button>
          <button className="btn" onClick={() => onToast('실패 작업 재시도 등록')}><RefreshCw size={14} />실패 작업 재시도</button>
          <button className="btn primary" onClick={() => onToast('스케줄링 정책 편집')}><Settings2 size={14} />스케줄링 정책</button>
        </>}
      />

      <div className="grid g4">
        <Stat label="실행 중" value={stages.reduce((a, s) => a + s.running, 0)} unit="건" delta="in_progress 합계" />
        <Stat label="대기" value={stages.reduce((a, s) => a + s.queued, 0)} unit="건" delta="최장 3분 02초" />
        <Stat label="재시도" value={1} unit="건" delta="rfd3 입력 오류" />
        <Stat label="24시간 실패율" value="4.1" unit="%" delta="전일 대비 1.2%p 감소" />
      </div>

      <Card title="작업 목록" sub={`${rows.length}건`} flush
        right={<Seg items={[{ key: 'all', label: '전체' }, { key: 'active', label: '진행/대기' }, { key: 'failed', label: '실패' }]}
          value={filter} onChange={setFilter} />}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>작업 ID</th><th>실행</th><th>단계</th><th>모델</th><th>GPU</th><th>우선순위</th><th>대기</th><th>상태</th><th /></tr></thead>
            <tbody>
              {rows.map((j, i) => (
                <tr key={j.id}>
                  <td className="no">{i + 1}</td>
                  <td className="mono">{j.id}</td>
                  <td className="mono">{j.run}</td>
                  <td>{j.stage}</td>
                  <td>{j.model}</td>
                  <td>{j.gpu}</td>
                  <td><span className={'badge ' + (j.priority === 'high' ? 'err' : j.priority === 'low' ? '' : 'accent')}>
                    {j.priority === 'high' ? '높음' : j.priority === 'low' ? '낮음' : '보통'}</span></td>
                  <td className="mono">{j.waited}</td>
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

      <Card
        title="예상 완료 시각" sub="선택한 실행 기준 근사치"
        right={<button className="btn sm" onClick={() => onToast(`${curRun.run} 큐 ETA 재계산`)}><RefreshCw size={14} />재계산</button>}
      >
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g2">
            <Field label="실행 선택" hint="run_id">
              <select className="input" value={run} onChange={e => setRun(e.target.value)}>
                {QUEUE_RUNS.map(r => <option key={r.run} value={r.run}>{r.run} · {r.project}</option>)}
              </select>
            </Field>
            <Field label="평균 소요 집계" hint="EWMA 데이터 유무에 따른 표시 전환">
              <div className="row">
                <Seg items={[{ key: 'ewma', label: 'EWMA 적용' }, { key: 'empty', label: '데이터 부족' }]}
                  value={statsMode} onChange={setStatsMode} />
              </div>
            </Field>
          </div>

          <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
            <dt>현재 단계</dt><dd><span className="mono">{curRun.stage}</span> · {curRun.run} · {curRun.project}</dd>
            <dt>예상 완료까지</dt><dd>{runFinish === null
              ? '산출 불가 (집계 데이터 부족)'
              : `${fmtSec(runFinish)} · 약 ${clockAfter(NOW, runFinish)} 완료 예상`}</dd>
            <dt>표시 방식</dt><dd>{statsMode === 'ewma' ? '근사치' : '건수만 표시'}
              <span className="mono faint"> {statsMode === 'ewma' ? 'approximate = true' : 'fallback = true'}</span></dd>
            <dt>전체 대기 / 실행</dt><dd>{stages.reduce((a, s) => a + s.queued, 0)} / {stages.reduce((a, s) => a + s.running, 0)}</dd>
          </dl>
        </div>
      </Card>

      <GroupTitle title="큐 운영 참고" />

      <Card title="단계별 예상 완료" sub="대기 건수와 워커 기준">
        <div className="col" style={{ gap: 16 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>
                <th className="no">No.</th><th>단계</th><th>엔드포인트</th><th className="num">대기</th><th className="num">실행</th>
                <th className="num">워커</th><th className="num">평균 소요</th><th className="num">예상 대기</th><th>예상 완료</th><th>표시</th>
              </tr></thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr key={s.stage} className={s.stage === curRun.stage ? 'sel' : ''}>
                    <td className="no">{i + 1}</td>
                    <td>{s.stage}</td>
                    <td className="mono">{s.endpoint}</td>
                    <td className="num">{s.queued}</td>
                    <td className="num">{s.running}</td>
                    <td className="num">{s.workers}</td>
                    <td className="num">{s.avg === null ? '-' : fmtSec(s.avg)}</td>
                    <td className="num">{s.eta.waitS === null ? '-' : fmtSec(s.eta.waitS)}</td>
                    <td className="mono">{s.eta.finishS === null ? '-' : `${fmtSec(s.eta.finishS)} (${clockAfter(NOW, s.eta.finishS)})`}</td>
                    <td>
                      {s.eta.fallback
                        ? <span className="badge warn">건수만 표시</span>
                        : <span className="badge accent">근사치</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Field label="집계 방식" hint={`durations.json · 부트스트랩 events.jsonl 최대 ${EWMA_BOOTSTRAP_FILES}개`}>
            <input className="input" readOnly value={`엔드포인트별 EWMA, α = ${EWMA_ALPHA}`} />
          </Field>

          <div className="signal">
            <Info size={15} className="ic" />
            <div><b>모든 ETA는 근사치입니다</b>
              <p>예상 대기 = 올림(대기건수 / 워커 수) × 평균 소요, 예상 완료 = 예상 대기 + 평균 소요</p>
</div>
          </div>
        </div>
      </Card>

      <Card title="단계 · 엔드포인트 매핑" sub={`STAGE_ENDPOINT.length건`}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>단계</th><th>엔드포인트</th><th>엔드포인트 ID</th><th>역할</th><th className="num">표본 수</th></tr></thead>
            <tbody>
              {STAGE_ENDPOINT.map((m, i) => (
                <tr key={m.stage}>
                  <td className="no">{i + 1}</td>
                  <td className="mono">{m.stage}</td>
                  <td className="mono">{m.endpoint}</td>
                  <td className="mono">{m.endpointId}</td>
                  <td>{m.note}</td>
                  <td className="num">{STAGE_QUEUES.find(s => s.stage === m.stage)?.samples ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="스케줄링 정책 · 대기 추이">
        <div className="grid g3">
          <div className="col">
            <div style={{ fontWeight: 500 }}>모델별 대기 작업</div>
            <Bars data={[
              { label: 'ColabFold (AF2)', value: 6, color: 'var(--warn)' },
              { label: 'AF2-Multimer', value: 3, color: 'var(--run)' },
              { label: 'ProteinMPNN', value: 3 }, { label: 'RFDiffusion3', value: 2 },
            ]} unit="건" />
          </div>
          <div className="col">
            <div style={{ fontWeight: 500 }}>스케줄링 정책</div>
            <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
              <dt>정책</dt><dd>우선순위 + FIFO</dd>
              <dt>선점</dt><dd>비활성 (실행 중 작업 보존)</dd>
              <dt>최대 동시 작업</dt><dd>사용자당 4 · 전체 16</dd>
              <dt>재시도</dt><dd>최대 2회 · 지수 백오프</dd>
              <dt>기아 방지</dt><dd>대기 10분 초과 시 가중치 상향</dd>
            </dl>
          </div>
          <div className="col">
            <div style={{ fontWeight: 500 }}>큐 대기 시간 추이</div>
            <Spark values={[42, 38, 55, 91, 120, 182, 155, 134, 168, 192, 171, 182]} color="#f59e0b" height={60} />
            <div className="row">
              <Clock size={14} />
              <span className="muted">현재 p95 182초, colabfold-a100 워커 상향 권고</span>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

