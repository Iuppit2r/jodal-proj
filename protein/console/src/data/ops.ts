/* ============================================================
   RunPod 운영 / 작업 큐 화면용 목업 데이터
   원본: protein_pipeline frontend/runpod-admin (+ queue_stats, metrics collector)
   ============================================================ */

/* ---------------- 엔드포인트 상태 ---------------- */

export type RpStatus = 'running' | 'queued' | 'paused' | 'warm' | 'idle'

export const RP_STATUS: Record<RpStatus, { label: string; cls: string }> = {
  running: { label: '실행 중', cls: 'run' },
  queued: { label: '대기', cls: 'warn' },
  paused: { label: '일시중지', cls: 'err' },
  warm: { label: '웜', cls: 'accent' },
  idle: { label: '유휴', cls: '' },
}

export interface RpWorker { id: string; status: string; gpu: string; costHr: number }

export interface RpEndpoint {
  id: string
  name: string
  managed: string[]
  computeType: string
  gpuTypes: string[]
  workersMin: number
  workersMax: number
  workersLive: number
  workerStates: Record<string, number>
  inQueue: number
  inProgress: number
  scalerType: 'REQUEST_COUNT' | 'QUEUE_DELAY' | 'NONE'
  scalerValue: number
  idleTimeout: number
  executionTimeoutMs: number
  flashBoot: boolean
  templateName: string
  templateId: string
  networkVolumeId: string
  dataCenters: string[]
  binding: string[]
  source: 'admin' | 'health'
  hourlyCost: number
  spendRate: number
  workers: RpWorker[]
}

/** 상태 판정 규칙 (deriveEndpointStatus) */
export function deriveStatus(e: RpEndpoint): RpStatus {
  if (e.inProgress > 0) return 'running'
  if (e.inQueue > 0) return 'queued'
  if (e.workersMax === 0) return 'paused'
  const warm = (e.workerStates.ready ?? 0) + (e.workerStates.warm ?? 0) + (e.workerStates.active ?? 0)
  const idle = e.workerStates.idle ?? 0
  if (warm > 0 || (e.workersLive > 0 && idle === 0)) return 'warm'
  return 'idle'
}

/* ---------------- 관리 서비스 매핑 ---------------- */

export interface ManagedService { key: string; label: string; endpointId: string }

export const MANAGED_SERVICES: ManagedService[] = [
  { key: 'MMSEQS', label: 'MMSEQS', endpointId: 'ep_mmseqs_a10' },
  { key: 'RFD3', label: 'RFD3', endpointId: 'ep_rfd3_a100' },
  { key: 'BIOEMU', label: 'BIOEMU', endpointId: 'ep_bioemu_l40' },
  { key: 'PROTEINMPNN', label: 'PROTEINMPNN', endpointId: 'ep_mpnn_l4' },
  { key: 'COLABFOLD', label: 'COLABFOLD', endpointId: 'ep_colabfold_a100' },
  { key: 'ALPHAFOLD2', label: 'ALPHAFOLD2', endpointId: 'ep_af2m_h100' },
  { key: 'DIFFDOCK', label: 'DIFFDOCK', endpointId: 'ep_diffdock_l4' },
]

/* ---------------- 엔드포인트 ---------------- */

export const RP_ENDPOINTS: RpEndpoint[] = [
  {
    id: 'ep_mmseqs_a10', name: 'mmseqs-msa-a10', managed: ['MMSEQS'], computeType: 'serverless',
    gpuTypes: ['NVIDIA A10 24GB'], workersMin: 1, workersMax: 4, workersLive: 2,
    workerStates: { running: 1, ready: 1 }, inQueue: 1, inProgress: 1,
    scalerType: 'QUEUE_DELAY', scalerValue: 4, idleTimeout: 60, executionTimeoutMs: 900000, flashBoot: true,
    templateName: 'mmseqs-server-0.9', templateId: 'tpl_mmseqs_09', networkVolumeId: 'vol_msa_db',
    dataCenters: ['US-KS-2', 'EU-CZ-1'], binding: ['RUNPOD_MMSEQS_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 0.52, spendRate: 6.4,
    workers: [
      { id: 'wk_8a31c2', status: 'running', gpu: 'NVIDIA A10 24GB', costHr: 0.52 },
      { id: 'wk_8a31d7', status: 'ready', gpu: 'NVIDIA A10 24GB', costHr: 0.52 },
    ],
  },
  {
    id: 'ep_rfd3_a100', name: 'rfd3-a100-80', managed: ['RFD3'], computeType: 'serverless',
    gpuTypes: ['NVIDIA A100 80GB PCIe'], workersMin: 0, workersMax: 4, workersLive: 1,
    workerStates: { running: 1 }, inQueue: 2, inProgress: 1,
    scalerType: 'REQUEST_COUNT', scalerValue: 2, idleTimeout: 120, executionTimeoutMs: 2700000, flashBoot: false,
    templateName: 'rfdiffusion3-1.2.0', templateId: 'tpl_rfd3_120', networkVolumeId: 'vol_weights',
    dataCenters: ['US-KS-2'], binding: ['RUNPOD_RFD3_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 2.18, spendRate: 22.5,
    workers: [{ id: 'wk_11f0ab', status: 'running', gpu: 'NVIDIA A100 80GB PCIe', costHr: 2.18 }],
  },
  {
    id: 'ep_bioemu_l40', name: 'bioemu-l40s', managed: ['BIOEMU'], computeType: 'serverless',
    gpuTypes: ['NVIDIA L40S 48GB'], workersMin: 0, workersMax: 3, workersLive: 0,
    workerStates: {}, inQueue: 0, inProgress: 0,
    scalerType: 'REQUEST_COUNT', scalerValue: 1, idleTimeout: 30, executionTimeoutMs: 3600000, flashBoot: false,
    templateName: 'bioemu-0.4.1', templateId: 'tpl_bioemu_041', networkVolumeId: '',
    dataCenters: ['EU-CZ-1'], binding: ['RUNPOD_BIOEMU_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 1.14, spendRate: 7.8,
    workers: [],
  },
  {
    id: 'ep_mpnn_l4', name: 'proteinmpnn-l4', managed: ['PROTEINMPNN'], computeType: 'serverless',
    gpuTypes: ['NVIDIA L4 24GB'], workersMin: 1, workersMax: 6, workersLive: 3,
    workerStates: { ready: 2, warm: 1 }, inQueue: 0, inProgress: 0,
    scalerType: 'REQUEST_COUNT', scalerValue: 3, idleTimeout: 45, executionTimeoutMs: 600000, flashBoot: true,
    templateName: 'proteinmpnn-1.0.1', templateId: 'tpl_mpnn_101', networkVolumeId: '',
    dataCenters: ['US-KS-2', 'US-TX-3'], binding: ['RUNPOD_PROTEINMPNN_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 0.44, spendRate: 4.2,
    workers: [
      { id: 'wk_5c90e1', status: 'ready', gpu: 'NVIDIA L4 24GB', costHr: 0.44 },
      { id: 'wk_5c90e2', status: 'ready', gpu: 'NVIDIA L4 24GB', costHr: 0.44 },
      { id: 'wk_5c90f8', status: 'warm', gpu: 'NVIDIA L4 24GB', costHr: 0.44 },
    ],
  },
  {
    id: 'ep_colabfold_a100', name: 'colabfold-a100-40', managed: ['COLABFOLD'], computeType: 'serverless',
    gpuTypes: ['NVIDIA A100 40GB PCIe', 'NVIDIA A10 24GB'], workersMin: 1, workersMax: 4, workersLive: 1,
    workerStates: { idle: 1 }, inQueue: 6, inProgress: 0,
    scalerType: 'QUEUE_DELAY', scalerValue: 6, idleTimeout: 90, executionTimeoutMs: 1800000, flashBoot: true,
    templateName: 'colabfold-1.5.5', templateId: 'tpl_cf_155', networkVolumeId: 'vol_msa_db',
    dataCenters: ['US-KS-2'], binding: ['RUNPOD_COLABFOLD_ENDPOINT_ID', 'RUNPOD_AF2_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 1.64, spendRate: 19.1,
    workers: [{ id: 'wk_71aa04', status: 'idle', gpu: 'NVIDIA A100 40GB PCIe', costHr: 1.64 }],
  },
  {
    id: 'ep_af2m_h100', name: 'af2-multimer-h100', managed: ['ALPHAFOLD2'], computeType: 'serverless',
    gpuTypes: ['NVIDIA H100 80GB HBM3'], workersMin: 0, workersMax: 0, workersLive: 0,
    workerStates: {}, inQueue: 0, inProgress: 0,
    scalerType: 'NONE', scalerValue: 0, idleTimeout: 60, executionTimeoutMs: 3600000, flashBoot: false,
    templateName: 'alphafold2-multimer-2.3.2', templateId: 'tpl_af2m_232', networkVolumeId: 'vol_af2_params',
    dataCenters: ['US-TX-3'], binding: ['RUNPOD_ALPHAFOLD2_ENDPOINT_ID'], source: 'admin',
    hourlyCost: 3.92, spendRate: 11.6,
    workers: [],
  },
  {
    id: 'ep_sandbox_l4', name: 'sandbox-esm-l4', managed: [], computeType: 'serverless',
    gpuTypes: ['NVIDIA L4 24GB'], workersMin: 0, workersMax: 2, workersLive: 1,
    workerStates: { idle: 1 }, inQueue: 0, inProgress: 0,
    scalerType: 'REQUEST_COUNT', scalerValue: 1, idleTimeout: 20, executionTimeoutMs: 300000, flashBoot: false,
    templateName: 'esm-embedding-0.2.0', templateId: 'tpl_esm_020', networkVolumeId: '',
    dataCenters: [], binding: [], source: 'health',
    hourlyCost: 0.44, spendRate: 1.3,
    workers: [{ id: 'wk_a0b113', status: 'idle', gpu: 'NVIDIA L4 24GB', costHr: 0.44 }],
  },
]

/* ---------------- 시안 상태 (화면 3개가 공유) ----------------
   엔드포인트 목록 화면의 상태 전환 select 가 이 값을 바꾸고,
   상세·사용량 화면은 같은 값을 읽어 같은 제약을 적용한다. */

export type DemoMode = 'full' | 'readonly' | 'nobilling'

export const DEMO_MODES: { key: DemoMode; label: string }[] = [
  { key: 'full', label: '시안 상태: 정상 (관리자 키)' },
  { key: 'readonly', label: '시안 상태: 읽기 전용 키' },
  { key: 'nobilling', label: '시안 상태: 과금 정보 사용 불가' },
]

let demoMode: DemoMode = 'full'
const demoSubs = new Set<() => void>()

export const getDemoMode = () => demoMode

export function setDemoMode(m: DemoMode) {
  demoMode = m
  demoSubs.forEach(f => f())
}

export function subscribeDemoMode(f: () => void) {
  demoSubs.add(f)
  return () => { demoSubs.delete(f) }
}

/* ---------------- 수집기 상태 (metrics collector) ---------------- */

export const COLLECTOR = {
  enabled: true,
  usageIntervalSeconds: 60,
  billingIntervalSeconds: 300,
  usageRetentionDays: 90,
  billingRetentionDays: 400,
  lastUsageSync: '2026.10.06 09:42:11',
  lastBillingSync: '2026.10.06 09:40:02',
  autoRefreshMs: 30000,
}

/* ---------------- 모니터링 기간 ---------------- */

export type Preset = 'week' | 'month' | 'months_6'

export const PRESETS: { key: Preset; label: string; title: string }[] = [
  { key: 'week', label: '이번 주(월~일)', title: '주' },
  { key: 'month', label: '이번 달', title: '월' },
  { key: 'months_6', label: '최근 6개월', title: '6개월' },
]

export interface MonWindow {
  preset: Preset
  offset: number
  title: string
  rangeLabel: string
  labels: string[]
  usageResolution: string
  billingResolution: string
  billingBucketSize: string
  usageLimit: number
  spendMultiplier: number
  suffix: string
  peakLabel: string
  hasNext: boolean
}

const p2 = (n: number) => String(n).padStart(2, '0')
const fmtDay = (d: Date) => `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}`
const fmtMd = (d: Date) => `${p2(d.getMonth() + 1)}.${p2(d.getDate())}`

function monday(base: Date) {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** 달력 기준 모니터링 창 (buildMonitoringWindow) */
export function buildWindow(preset: Preset, offset: number, now = new Date()): MonWindow {
  if (preset === 'week') {
    const start = monday(now)
    start.setDate(start.getDate() + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const labels: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      labels.push(fmtMd(d))
    }
    return {
      preset, offset, title: '주', rangeLabel: `${fmtDay(start)} ~ ${fmtDay(end)}`, labels,
      usageResolution: 'day', billingResolution: 'day', billingBucketSize: 'day', usageLimit: 16,
      spendMultiplier: 1, suffix: `week-${fmtDay(start).replace(/\./g, '')}`, peakLabel: '최대일',
      hasNext: offset < 0,
    }
  }
  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    const labels: string[] = []
    for (let i = 1; i <= end.getDate(); i++) labels.push(fmtMd(new Date(start.getFullYear(), start.getMonth(), i)))
    return {
      preset, offset, title: '월', rangeLabel: `${fmtDay(start)} ~ ${fmtDay(end)}`, labels,
      usageResolution: 'day', billingResolution: 'day', billingBucketSize: 'day', usageLimit: 40,
      spendMultiplier: 1, suffix: `month-${start.getFullYear()}${p2(start.getMonth() + 1)}`, peakLabel: '최대일',
      hasNext: offset < 0,
    }
  }
  const anchor = new Date(now.getFullYear(), now.getMonth() + offset * 6, 1)
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - 5, 1)
  const labels: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    labels.push(`${d.getFullYear()}.${p2(d.getMonth() + 1)}`)
  }
  return {
    preset, offset, title: '6개월', rangeLabel: `${labels[0]} ~ ${labels[5]}`, labels,
    usageResolution: 'month', billingResolution: 'month', billingBucketSize: 'day', usageLimit: 12,
    spendMultiplier: 26, suffix: `months6-${start.getFullYear()}${p2(start.getMonth() + 1)}`, peakLabel: '최대월',
    hasNext: offset < 0,
  }
}

/* ---------------- 시계열 (결정적 목업) ---------------- */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const rnd01 = (key: string) => (hash(key) % 100000) / 100000

export interface UsagePoint { t: string; workers: number; queued: number; running: number }
export interface SpendPoint { t: string; cost: number; records: number }

export function buildUsage(key: string, w: MonWindow, ep: RpEndpoint): UsagePoint[] {
  const cap = Math.max(ep.workersMax, 1)
  return w.labels.map(t => {
    const seed = `${key}|${w.suffix}|${t}`
    const workers = Math.round(ep.workersMin + rnd01(seed + '|w') * cap * 0.95)
    const running = Math.min(workers, Math.round(rnd01(seed + '|r') * cap * 0.8))
    const q = rnd01(seed + '|q')
    const queued = Math.round(q * q * cap * 1.7)
    return { t, workers, queued, running }
  })
}

export function buildSpend(key: string, w: MonWindow, ep: RpEndpoint): SpendPoint[] {
  return w.labels.map(t => {
    const seed = `${key}|${w.suffix}|${t}`
    const cost = Math.round(rnd01(seed + '|c') * ep.spendRate * w.spendMultiplier * 100) / 100
    const records = 4 + Math.round(rnd01(seed + '|n') * 20)
    return { t, cost, records }
  })
}

export function sumUsage(list: UsagePoint[][], labels: string[]): UsagePoint[] {
  return labels.map((t, i) => ({
    t,
    workers: list.reduce((a, s) => a + (s[i]?.workers ?? 0), 0),
    queued: list.reduce((a, s) => a + (s[i]?.queued ?? 0), 0),
    running: list.reduce((a, s) => a + (s[i]?.running ?? 0), 0),
  }))
}

export function sumSpend(list: SpendPoint[][], labels: string[]): SpendPoint[] {
  return labels.map((t, i) => ({
    t,
    cost: Math.round(list.reduce((a, s) => a + (s[i]?.cost ?? 0), 0) * 100) / 100,
    records: list.reduce((a, s) => a + (s[i]?.records ?? 0), 0),
  }))
}

/* ---------------- 큐 ETA (queue_stats) ---------------- */

export const EWMA_ALPHA = 0.3
export const EWMA_BOOTSTRAP_FILES = 300

/** 단계 -> RunPod 엔드포인트 매핑 */
export const STAGE_ENDPOINT: { stage: string; endpoint: string; endpointId: string; note: string }[] = [
  { stage: 'msa', endpoint: 'MMSEQS', endpointId: 'ep_mmseqs_a10', note: 'MSA 생성 및 보존도 산출' },
  { stage: 'rfd3', endpoint: 'RFD3', endpointId: 'ep_rfd3_a100', note: 'RFdiffusion3 백본 생성' },
  { stage: 'bioemu', endpoint: 'BIOEMU', endpointId: 'ep_bioemu_l40', note: '앙상블 샘플링' },
  { stage: 'design', endpoint: 'PROTEINMPNN', endpointId: 'ep_mpnn_l4', note: '서열 설계' },
  { stage: 'af2', endpoint: 'COLABFOLD / ALPHAFOLD2', endpointId: 'ep_colabfold_a100', note: '구조 예측 (preset에 따라 분기)' },
  { stage: 'novelty', endpoint: 'MMSEQS', endpointId: 'ep_mmseqs_a10', note: '신규성 검색' },
]

export interface StageQueue {
  stage: string
  endpoint: string
  endpointId: string
  queued: number
  running: number
  workers: number
  /** EWMA 평균 소요(초). null 이면 집계 데이터 부족 */
  avg: number | null
  samples: number
}

export const STAGE_QUEUES: StageQueue[] = [
  { stage: 'msa', endpoint: 'MMSEQS', endpointId: 'ep_mmseqs_a10', queued: 1, running: 1, workers: 2, avg: 182, samples: 214 },
  { stage: 'rfd3', endpoint: 'RFD3', endpointId: 'ep_rfd3_a100', queued: 2, running: 1, workers: 1, avg: 412, samples: 96 },
  { stage: 'bioemu', endpoint: 'BIOEMU', endpointId: 'ep_bioemu_l40', queued: 0, running: 0, workers: 0, avg: 1540, samples: 18 },
  { stage: 'design', endpoint: 'PROTEINMPNN', endpointId: 'ep_mpnn_l4', queued: 3, running: 2, workers: 3, avg: 96, samples: 302 },
  { stage: 'af2', endpoint: 'COLABFOLD / ALPHAFOLD2', endpointId: 'ep_colabfold_a100', queued: 6, running: 1, workers: 1, avg: 318, samples: 177 },
  { stage: 'novelty', endpoint: 'MMSEQS', endpointId: 'ep_mmseqs_a10', queued: 0, running: 0, workers: 2, avg: null, samples: 0 },
]

export interface EtaResult { waitS: number | null; finishS: number | null; approximate: boolean; fallback: boolean }

/** estimate_stage_eta(jobs_ahead, workers, avg_duration_s) */
export function estimateStageEta(ahead: number, workers: number, avg: number | null): EtaResult {
  if (avg === null) return { waitS: null, finishS: null, approximate: true, fallback: true }
  const waitS = Math.ceil(ahead / Math.max(workers, 1)) * avg
  return { waitS, finishS: waitS + avg, approximate: true, fallback: false }
}

export const QUEUE_RUNS: { run: string; project: string; stage: string }[] = [
  { run: 'run_0421', project: 'GFP 안정화', stage: 'af2' },
  { run: 'run_0420', project: 'GFP 안정화', stage: 'design' },
  { run: 'run_0415', project: 'PETase 개량', stage: 'rfd3' },
  { run: 'run_0409', project: '항체 CDR 설계', stage: 'msa' },
]
