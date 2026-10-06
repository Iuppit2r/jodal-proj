export type StageState = 'done' | 'running' | 'gate' | 'queued' | 'failed'
export type PipelineKind = 'stability' | 'binding'

export interface Stage {
  key: string
  label: string
  model: string
  state: StageState
  duration?: string
  metric?: string
}

export interface Run {
  id: string
  name: string
  pipeline: PipelineKind
  project: string
  projectId: string
  round: string
  owner: string
  status: 'running' | 'gate' | 'done' | 'failed' | 'queued'
  progress: number
  stage: string
  created: string
  parent?: string
  candidates: number
  gpuHours: number
}

export const RUNS: Run[] = [
  { id: 'run_0421', name: 'GFP 열안정성 R3-tier50', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 3', owner: '김연구', status: 'gate', progress: 72, stage: 'soluprot', created: '2026-10-05 09:12', candidates: 318, gpuHours: 6.4 },
  { id: 'run_0420', name: 'PD-L1 바인더 결합예측', pipeline: 'binding', project: 'PD-L1 바인더', projectId: 'prj_pdl1', round: 'Round 1', owner: '이박사', status: 'running', progress: 48, stage: 'multimer', created: '2026-10-05 08:40', parent: 'run_0412', candidates: 24, gpuHours: 11.2 },
  { id: 'run_0423', name: 'GFP 열안정성 R3 재설계', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 3', owner: '김연구', status: 'running', progress: 31, stage: 'design', created: '2026-10-06 08:02', parent: 'run_0421', candidates: 0, gpuHours: 2.1 },
  { id: 'run_0419', name: 'GFP tier70 재시도', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 3', owner: '박연구', status: 'failed', progress: 41, stage: 'rfd3', created: '2026-10-04 20:15', candidates: 0, gpuHours: 2.4 },
  { id: 'run_0418', name: 'GFP 열안정성 R3-tier70', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 3', owner: '김연구', status: 'done', progress: 100, stage: 'af2', created: '2026-10-04 17:02', candidates: 142, gpuHours: 9.1 },
  { id: 'run_0415', name: 'Lipase 용해도 개선', pipeline: 'stability', project: 'Lipase 개량', projectId: 'prj_lip', round: 'Round 2', owner: '박연구', status: 'failed', progress: 34, stage: 'rfd3', created: '2026-10-04 11:25', candidates: 0, gpuHours: 1.8 },
  { id: 'run_0414', name: 'GFP tier30+50 재현', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 2', owner: '김연구', status: 'done', progress: 100, stage: 'af2', created: '2026-09-29 16:22', parent: 'run_0412', candidates: 64, gpuHours: 7.9 },
  { id: 'run_0412', name: 'GFP 열안정성 R2 best', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 2', owner: '김연구', status: 'done', progress: 100, stage: 'af2', created: '2026-10-02 14:48', candidates: 96, gpuHours: 8.7 },
  { id: 'run_0409', name: 'Amylase 안정화 탐색', pipeline: 'stability', project: 'Amylase', projectId: 'prj_amy', round: 'Round 1', owner: '최연구', status: 'done', progress: 100, stage: 'af2', created: '2026-09-30 10:05', candidates: 61, gpuHours: 7.3 },
  { id: 'run_0407', name: 'PD-L1 도킹 사전탐색', pipeline: 'binding', project: 'PD-L1 바인더', projectId: 'prj_pdl1', round: 'Round 0', owner: '이박사', status: 'done', progress: 100, stage: 'rank', created: '2026-09-29 16:31', candidates: 18, gpuHours: 5.0 },
  { id: 'run_0405', name: 'GFP tier30 파일럿', pipeline: 'stability', project: 'GFP 열안정화', projectId: 'prj_gfp', round: 'Round 1', owner: '김연구', status: 'queued', progress: 0, stage: 'msa', created: '2026-09-28 09:00', candidates: 0, gpuHours: 0 },
]

export interface Candidate {
  id: string
  source: 'input_pdb' | 'rfd3' | 'bioemu'
  tier: 30 | 50 | 70
  mutations: number
  soluprot: number
  plddt: number
  rmsd: number
  score: number
  ddg: number
  selected?: boolean
}

const SOURCES: Candidate['source'][] = ['input_pdb', 'rfd3', 'bioemu']
const TIERS: Candidate['tier'][] = [30, 50, 70]

function seeded(n: number) {
  let s = n * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

export const CANDIDATES: Candidate[] = Array.from({ length: 28 }, (_, i) => {
  const r = seeded(i + 7)
  const soluprot = 0.42 + r() * 0.52
  const plddt = 62 + r() * 33
  const rmsd = 0.6 + r() * 2.8
  const ddg = -3.4 + r() * 4.6
  return {
    id: `cand_${String(i + 1).padStart(3, '0')}`,
    source: SOURCES[i % 3],
    tier: TIERS[(i >> 1) % 3],
    mutations: 3 + Math.round(r() * 14),
    soluprot: +soluprot.toFixed(3),
    plddt: +plddt.toFixed(1),
    rmsd: +rmsd.toFixed(2),
    ddg: +ddg.toFixed(2),
    score: +(soluprot * 0.35 + (plddt / 100) * 0.45 + (1 - Math.min(rmsd, 3) / 3) * 0.2).toFixed(3),
  }
}).sort((a, b) => b.score - a.score)

export interface ModelEntry {
  id: string
  name: string
  version: string
  kind: string
  endpoint: string
  gpu: string
  state: 'active' | 'staged' | 'disabled'
  updated: string
  approvedBy?: string
}

export const MODELS: ModelEntry[] = [
  { id: 'rfdiffusion3', name: 'RFDiffusion3', version: '1.2.0', kind: 'backbone', endpoint: 'rp-serverless/rfd3-a100', gpu: 'A100 80GB', state: 'active', updated: '2026-09-28', approvedBy: '관리자' },
  { id: 'proteinmpnn', name: 'ProteinMPNN', version: '1.0.1', kind: 'sequence', endpoint: 'rp-serverless/mpnn-l4', gpu: 'L4 24GB', state: 'active', updated: '2026-09-20', approvedBy: '관리자' },
  { id: 'bioemu', name: 'BioEmu', version: '1.1', kind: 'ensemble', endpoint: 'rp-serverless/bioemu-a100', gpu: 'A100 80GB', state: 'active', updated: '2026-09-25', approvedBy: '관리자' },
  { id: 'soluprot', name: 'SoluProt', version: '1.0', kind: 'filter', endpoint: 'internal/cpu-pool', gpu: 'CPU', state: 'active', updated: '2026-08-14', approvedBy: '관리자' },
  { id: 'colabfold', name: 'ColabFold (AF2)', version: '1.5.5', kind: 'structure', endpoint: 'rp-serverless/colabfold-a100', gpu: 'A100 40GB', state: 'active', updated: '2026-09-30', approvedBy: '관리자' },
  { id: 'af2-multimer', name: 'AF2-Multimer', version: '2.3.2', kind: 'complex', endpoint: 'rp-serverless/af2m-h100', gpu: 'H100 80GB', state: 'active', updated: '2026-10-01', approvedBy: '관리자' },
  { id: 'diffdock', name: 'DiffDock-L', version: '1.1', kind: 'docking', endpoint: 'rp-serverless/diffdock-l4', gpu: 'L4 24GB', state: 'active', updated: '2026-09-18', approvedBy: '관리자' },
  { id: 'boltz2', name: 'Boltz-2', version: '0.4.1', kind: 'structure', endpoint: 'rp-serverless/boltz2-h100', gpu: 'H100 80GB', state: 'staged', updated: '2026-10-04' },
  { id: 'esmfold', name: 'ESMFold', version: '1.0.3', kind: 'structure', endpoint: 'rp-serverless/esmfold-a10', gpu: 'A10 24GB', state: 'disabled', updated: '2026-06-11', approvedBy: '관리자' },
]

export interface Endpoint {
  id: string
  name: string
  gpu: string
  workersReady: number
  workersMax: number
  inFlight: number
  queued: number
  p95: string
  costToday: number
  state: 'healthy' | 'degraded' | 'idle'
}

export const ENDPOINTS: Endpoint[] = [
  { id: 'ep-rfd3', name: 'rfd3-a100', gpu: 'A100 80GB', workersReady: 2, workersMax: 4, inFlight: 1, queued: 0, p95: '142s', costToday: 18.4, state: 'healthy' },
  { id: 'ep-mpnn', name: 'mpnn-l4', gpu: 'L4 24GB', workersReady: 3, workersMax: 6, inFlight: 2, queued: 1, p95: '26s', costToday: 4.1, state: 'healthy' },
  { id: 'ep-cf', name: 'colabfold-a100', gpu: 'A100 40GB', workersReady: 1, workersMax: 4, inFlight: 1, queued: 6, p95: '318s', costToday: 22.7, state: 'degraded' },
  { id: 'ep-af2m', name: 'af2m-h100', gpu: 'H100 80GB', workersReady: 2, workersMax: 2, inFlight: 2, queued: 3, p95: '406s', costToday: 31.9, state: 'healthy' },
  { id: 'ep-dd', name: 'diffdock-l4', gpu: 'L4 24GB', workersReady: 0, workersMax: 4, inFlight: 0, queued: 0, p95: '-', costToday: 2.3, state: 'idle' },
]

export interface Job {
  id: string
  run: string
  stage: string
  model: string
  priority: 'high' | 'normal' | 'low'
  state: 'running' | 'queued' | 'retry' | 'done' | 'failed'
  waited: string
  gpu: string
}

export const JOBS: Job[] = [
  { id: 'job_8831', run: 'run_0420', stage: 'multimer', model: 'AF2-Multimer 2.3.2', priority: 'high', state: 'running', waited: '00:12', gpu: 'H100 80GB' },
  { id: 'job_8830', run: 'run_0420', stage: 'multimer', model: 'AF2-Multimer 2.3.2', priority: 'high', state: 'running', waited: '00:31', gpu: 'H100 80GB' },
  { id: 'job_8829', run: 'run_0421', stage: 'af2', model: 'ColabFold 1.5.5', priority: 'normal', state: 'queued', waited: '02:48', gpu: 'A100 40GB' },
  { id: 'job_8828', run: 'run_0421', stage: 'af2', model: 'ColabFold 1.5.5', priority: 'normal', state: 'queued', waited: '03:02', gpu: 'A100 40GB' },
  { id: 'job_8826', run: 'run_0415', stage: 'rfd3', model: 'RFDiffusion3 1.2.0', priority: 'normal', state: 'retry', waited: '00:05', gpu: 'A100 80GB' },
  { id: 'job_8820', run: 'run_0418', stage: 'af2', model: 'ColabFold 1.5.5', priority: 'low', state: 'done', waited: '-', gpu: 'A100 40GB' },
  { id: 'job_8817', run: 'run_0415', stage: 'rfd3', model: 'RFDiffusion3 1.2.0', priority: 'normal', state: 'failed', waited: '-', gpu: 'A100 80GB' },
]

export interface AuditRow {
  at: string
  actor: string
  role: string
  action: string
  target: string
  ip: string
}

export const AUDIT: AuditRow[] = [
  { at: '2026-10-05 09:46:12', actor: '김연구', role: '연구자', action: 'run.gate.hold', target: 'run_0421 / soluprot', ip: '10.12.4.31' },
  { at: '2026-10-05 09:12:04', actor: '김연구', role: '연구자', action: 'run.create', target: 'run_0421', ip: '10.12.4.31' },
  { at: '2026-10-05 08:40:55', actor: '이박사', role: '연구자', action: 'run.fork', target: 'run_0420 ← run_0412', ip: '10.12.4.58' },
  { at: '2026-10-04 18:22:31', actor: '관리자', role: '관리자', action: 'model.stage', target: 'boltz2@0.4.1', ip: '10.12.1.9' },
  { at: '2026-10-04 18:01:10', actor: '관리자', role: '관리자', action: 'endpoint.patch', target: 'colabfold-a100 maxWorkers 2→4', ip: '10.12.1.9' },
  { at: '2026-10-04 11:31:48', actor: '박연구', role: '연구자', action: 'artifact.download', target: 'run_0412 package.zip', ip: '10.12.4.77' },
  { at: '2026-10-04 09:02:19', actor: 'agent-svc', role: '외부연계', action: 'mcp.tool.call', target: 'run_status(run_0418)', ip: '10.12.9.2' },
]

export interface Signal {
  level: 'ok' | 'warn' | 'err'
  title: string
  body: string
  actions: string[]
}

export const SIGNALS: Signal[] = [
  {
    level: 'warn',
    title: 'SoluProt 통과율 26.5%, 기준(35%) 미달',
    body: 'tier70 후보군이 통과율을 끌어내리고 있습니다. 컷오프 0.60 유지 시 AF2 단계의 GPU 사용량이 예산 대비 1.4배로 증가할 것으로 예상됩니다.',
    actions: ['tier70 제외 후 재실행', '컷오프 0.55로 조정', '상위 200개만 AF2 진행'],
  },
  {
    level: 'ok',
    title: 'MSA 깊이 양호 (Neff 812)',
    body: '보존도 계산 신뢰 구간이 충분합니다. tier 기반 마스킹 규칙을 그대로 적용해도 무리가 없습니다.',
    actions: ['보존도 리포트 보기'],
  },
  {
    level: 'err',
    title: 'run_0415 rfd3 단계 2회 실패',
    body: '입력 PDB의 체인 B에 결손 잔기가 있어 백본 생성이 중단되었습니다. 전처리에서 체인 선택을 A로 제한하면 해소됩니다.',
    actions: ['체인 A로 fork 재실행', '실패 로그 열기'],
  },
]

export const WT_SEQ = 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK'

export const MUTATION_SITES = [30, 64, 72, 99, 145, 163, 171, 203, 222]
export const FIXED_SITES = [65, 66, 67, 148, 205]

export const PERMS = [
  { cap: '실행 / 중지', admin: true, researcher: true, viewer: false, agent: true },
  { cap: '체크포인트 승인', admin: true, researcher: true, viewer: false, agent: false },
  { cap: '산출물 다운로드', admin: true, researcher: true, viewer: true, agent: true },
  { cap: '보고서 생성', admin: true, researcher: true, viewer: false, agent: true },
  { cap: '모델 등록 요청', admin: true, researcher: true, viewer: false, agent: false },
  { cap: '모델 운영 승인', admin: true, researcher: false, viewer: false, agent: false },
  { cap: '엔드포인트 패치', admin: true, researcher: false, viewer: false, agent: false },
  { cap: '감사 로그 조회', admin: true, researcher: false, viewer: false, agent: false },
  { cap: '시크릿 관리', admin: true, researcher: false, viewer: false, agent: false },
]

/* 소수점 시간(예: 17.6)을 "17시간 36분"으로 바꾼다.
   GPU 사용 시간은 사람이 읽는 값이라 시·분으로 표기한다. */
export function hoursText(h: number) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  if (!hh) return `${mm}분`
  return mm ? `${hh}시간 ${mm}분` : `${hh}시간`
}
