/* 실행 모니터 / 단계별 실행 전용 목업 데이터.
   원 시스템의 PIPELINE_PROGRESS_STEPS, RUN_PROGRESS_PLANS, ARTIFACT_STAGE_ORDER,
   WORKFLOW_STUDIO_STAGE_FIELDS 구성을 그대로 옮겨 시안에서 조작할 수 있게 만든 것. */

/* ---------------- 진행률 단계 ---------------- */
export interface ProgressStep { key: string; label: string; tierAware?: boolean }

export const PIPELINE_PROGRESS_STEPS: ProgressStep[] = [
  { key: 'msa', label: 'MSA' },
  { key: 'conservation', label: '보존도' },
  { key: 'backbone', label: 'Backbone' },
  { key: 'wt', label: 'WT Baseline' },
  { key: 'masking', label: 'Masking' },
  { key: 'design', label: 'Design', tierAware: true },
  { key: 'soluprot', label: 'SoluProt', tierAware: true },
  { key: 'af2', label: 'AF2', tierAware: true },
  { key: 'relax', label: 'Relax', tierAware: true },
  { key: 'novelty', label: 'Novelty', tierAware: true },
  { key: 'done', label: '완료' },
]

/* 진행 단계 라벨 (plan 에만 등장하는 단계 포함) */
export const PROGRESS_STEP_LABELS: Record<string, string> = {
  ...Object.fromEntries(PIPELINE_PROGRESS_STEPS.map(s => [s.key, s.label])),
  rfd3: 'RFD3',
  bioemu: 'BioEmu',
  diffdock: 'DiffDock',
}

/* 실행 모드별 진행 계획 */
export const RUN_PROGRESS_PLANS: Record<string, string[]> = {
  pipeline: ['msa', 'conservation', 'backbone', 'wt', 'masking', 'design', 'soluprot', 'af2', 'relax', 'novelty', 'done'],
  workflow: ['msa', 'conservation', 'backbone', 'wt', 'masking', 'design', 'soluprot', 'af2', 'relax', 'novelty', 'done'],
  design: ['msa', 'conservation', 'backbone', 'masking', 'design'],
  soluprot: ['msa', 'conservation', 'backbone', 'masking', 'design', 'soluprot'],
  rfd3: ['msa', 'conservation', 'rfd3'],
  bioemu: ['msa', 'conservation', 'bioemu'],
  msa: ['msa'],
  af2: ['af2'],
  diffdock: ['diffdock'],
}

export const RUN_MODE_LABELS: Record<string, string> = {
  pipeline: 'Full Pipeline',
  workflow: '단계별 실행',
  design: 'Single Stage · ProteinMPNN',
  soluprot: 'Single Stage · SoluProt',
  rfd3: 'Single Stage · RFD3',
  bioemu: 'Single Stage · BioEmu',
  msa: 'Single Stage · MSA',
  af2: 'Single Stage · AF2',
  diffdock: 'Single Stage · DiffDock',
}

export interface ProgressUnit { id: string; step: string; label: string; tier?: number }

/* 보존도 tier 를 반영해 진행 단위를 펼친다 (progressUnitsForRequest). */
export function progressUnitsForRequest(mode: string, tiers: number[]): ProgressUnit[] {
  const plan = RUN_PROGRESS_PLANS[mode] ?? RUN_PROGRESS_PLANS.pipeline
  const out: ProgressUnit[] = []
  for (const step of plan) {
    const meta = PIPELINE_PROGRESS_STEPS.find(s => s.key === step)
    const label = PROGRESS_STEP_LABELS[step] ?? step
    if (meta?.tierAware && tiers.length) {
      for (const t of tiers) out.push({ id: `${step}@${t}`, step, label: `${label} tier${t}`, tier: t })
    } else {
      out.push({ id: step, step, label })
    }
  }
  return out
}

/* ---------------- 산출물 단계 분류 ---------------- */
export const ARTIFACT_STAGE_ORDER = [
  'msa', 'conservation', 'rfd3', 'bioemu', 'input_reference', 'working_backbone', 'wt_af2',
  'af2_target', 'pdb_preprocess', 'query_pdb_check', 'diffdock', 'ligand_mask', 'surface_mask',
  'mask_consensus', 'design', 'soluprot', 'surrogate', 'af2', 'novelty', 'wt', 'evolution',
  'agent', 'misc',
] as const

export const ARTIFACT_STAGE_LABELS: Record<string, string> = {
  msa: 'MSA',
  conservation: '보존도',
  rfd3: 'RFD3',
  bioemu: 'BioEmu',
  input_reference: 'Input Structure',
  working_backbone: 'Working Backbone',
  wt_af2: 'WT AF2',
  af2_target: 'ColabFold Target',
  pdb_preprocess: 'PDB 전처리',
  query_pdb_check: 'Query PDB 점검',
  diffdock: 'DiffDock',
  ligand_mask: 'Ligand Mask',
  surface_mask: 'Surface Mask',
  mask_consensus: 'Mask Consensus',
  design: 'Design',
  soluprot: 'SoluProt',
  surrogate: 'Surrogate',
  af2: 'AF2',
  novelty: 'Novelty',
  wt: 'WT',
  evolution: '진화 캠페인',
  agent: 'Agent',
  misc: '기타',
}

export type ArtifactKind = 'pdb' | 'sdf' | 'fasta' | 'json' | 'csv' | 'svg' | 'png' | 'md' | 'log' | 'bin'

export interface RunArtifact {
  run: string
  path: string
  stage: string
  kind: ArtifactKind
  tier?: 30 | 50 | 70
  size: string
  updated: string
  rep?: boolean
}

/* ---------------- 실행 상태 ---------------- */
export type RunState = 'running' | 'completed' | 'failed' | 'cancelled'

export interface QueueStageEta {
  stage: string
  endpoint: string
  queued: number
  running: number
  waitMin: number
  finishAt: string
  approximate?: boolean
  fallback?: boolean
}

export interface QueueEta {
  currentStage: string
  estFinishMin: number
  finishAt: string
  approximate: boolean
  fallback: boolean
  perStage: QueueStageEta[]
}

export interface Checkpoint {
  phase: 'running' | 'reached' | 'final'
  checkpoints: string[]
  nextStage: string
  finalStage: string
  counts: { label: string; value: number }[]
  results: { path: string; kind: ArtifactKind }[]
  panelDisabled?: boolean
}

export interface Completeness {
  rfd3: boolean
  bioemu: 'ready' | 'missing' | 'only'
  wtCompare: boolean
  af2Provider: string
  af2Selected: number
}

/* 실행이 시작된 뒤 지금까지 걸린 시간(분).
   목업이라 '지금'은 마지막으로 조회한 시각(updated)을 쓴다. */
export function elapsedMin(run: { requested: string; updated: string }) {
  const t = (v: string) => new Date(v.replace(' ', 'T')).getTime()
  const d = t(run.updated) - t(run.requested)
  return Number.isFinite(d) && d > 0 ? Math.round(d / 60000) : 0
}

export function minutesText(m: number) {
  if (m < 1) return '1분 미만'
  const hh = Math.floor(m / 60)
  const mm = m % 60
  if (!hh) return `${mm}분`
  return mm ? `${hh}시간 ${mm}분` : `${hh}시간`
}

export interface MonitorRun {
  id: string
  name: string
  mode: keyof typeof RUN_PROGRESS_PLANS | string
  workflow: boolean
  owner: string
  stage: string
  state: RunState
  detail: string
  requested: string
  updated: string
  progress: number
  tiers: number[]
  score: string
  evidence: string
  recommendation: string
  completeness: Completeness
  queue?: QueueEta
  queueNote?: 'updating' | 'pending'
  checkpoint?: Checkpoint
  error?: { summary: string; raw: string }
  request: Record<string, unknown>
}

export const MONITOR_RUNS: MonitorRun[] = [
  {
    id: 'run_0421',
    name: 'GFP 열안정성 R3-tier50',
    mode: 'workflow',
    workflow: true,
    owner: '김연구',
    stage: 'soluprot',
    state: 'running',
    detail: 'soluprot 체크포인트 도달, 검토 대기 중 (1,200개 중 318개 통과)',
    requested: '2026-10-05 09:12:04',
    updated: '2026-10-05 09:46:12',
    progress: 62,
    tiers: [30, 50, 70],
    score: '0.742',
    evidence: 'pLDDT 중위값 86.4 · SoluProt 통과율 26.5% · RMSD 1.21 Å',
    recommendation: 'tier70은 통과율이 낮아 제외하고 상위 200개만 AF2 단계로 진행',
    completeness: { rfd3: true, bioemu: 'ready', wtCompare: true, af2Provider: 'ColabFold', af2Selected: 200 },
    queue: {
      currentStage: 'af2',
      estFinishMin: 38,
      finishAt: '10:24',
      approximate: true,
      fallback: false,
      perStage: [
        { stage: 'af2', endpoint: 'colabfold-a100', queued: 6, running: 1, waitMin: 22, finishAt: '10:08', approximate: true },
        { stage: 'relax', endpoint: 'internal/cpu-pool', queued: 0, running: 0, waitMin: 4, finishAt: '10:12' },
        { stage: 'novelty', endpoint: 'internal/cpu-pool', queued: 0, running: 0, waitMin: 12, finishAt: '10:24', fallback: true },
      ],
    },
    checkpoint: {
      phase: 'reached',
      checkpoints: ['design', 'soluprot', 'af2'],
      nextStage: 'af2',
      finalStage: 'novelty',
      counts: [
        { label: 'msa', value: 3 },
        { label: 'conservation', value: 4 },
        { label: 'working_backbone', value: 24 },
        { label: 'design', value: 1200 },
        { label: 'soluprot', value: 318 },
      ],
      results: [
        { path: 'soluprot/scores.json', kind: 'json' },
        { path: 'soluprot/pass_report.svg', kind: 'svg' },
        { path: 'soluprot/passed_tier30.fasta', kind: 'fasta' },
        { path: 'design/tier_summary.json', kind: 'json' },
      ],
    },
    request: {
      run_mode: 'workflow', start_from: 'msa', stop_after: 'novelty', selected_tiers: [0.3, 0.5, 0.7],
      rfd3_use: true, bioemu_use: true, num_seq_per_tier: 2, soluprot_cutoff: 0.5,
      af2_provider: 'colabfold', af2_plddt_cutoff: 85, af2_rmsd_cutoff: 2.0,
      relax_enabled: true, novelty_enabled: true, wt_compare: true,
    },
  },
  {
    id: 'run_0420',
    name: 'PD-L1 바인더 결합예측',
    mode: 'pipeline',
    workflow: false,
    owner: '이박사',
    stage: 'af2',
    state: 'running',
    detail: 'ColabFold 예측 중 (tier30 완료, tier50 진행)',
    requested: '2026-10-05 08:40:55',
    updated: '2026-10-05 09:44:02',
    progress: 74,
    tiers: [30, 50, 70],
    score: '0.688',
    evidence: 'ipTM 0.71 · pLDDT 중위값 82.1 · 인터페이스 접촉 18쌍',
    recommendation: 'ipTM 0.7 미만 후보는 제외하고 상위 24개로 결합 검증 진행',
    completeness: { rfd3: false, bioemu: 'only', wtCompare: false, af2Provider: 'ColabFold', af2Selected: 0 },
    queueNote: 'pending',
    queue: {
      currentStage: 'af2',
      estFinishMin: 0,
      finishAt: '-',
      approximate: true,
      fallback: true,
      perStage: [
        { stage: 'af2', endpoint: 'colabfold-a100', queued: 9, running: 2, waitMin: 0, finishAt: '-', fallback: true },
      ],
    },
    request: {
      run_mode: 'pipeline', start_from: 'msa', stop_after: 'af2', selected_tiers: [0.3, 0.5, 0.7],
      rfd3_use: false, bioemu_use: true, af2_provider: 'colabfold', relax_enabled: false, novelty_enabled: false,
    },
  },
  {
    id: 'run_0418',
    name: 'GFP 열안정성 R3-tier70',
    mode: 'pipeline',
    workflow: true,
    owner: '김연구',
    stage: 'novelty',
    state: 'completed',
    detail: '최종 단계까지 완료, 보고서 생성됨 (142개 후보)',
    requested: '2026-10-04 17:02:11',
    updated: '2026-10-04 19:38:40',
    progress: 100,
    tiers: [30, 50, 70],
    score: '0.803',
    evidence: 'pLDDT 중위값 89.2 · WT Diff 평균 11 잔기 · Relax 점수 -412',
    recommendation: '상위 12개 후보를 실험 검증 대상으로 등록',
    completeness: { rfd3: true, bioemu: 'ready', wtCompare: true, af2Provider: 'ColabFold', af2Selected: 142 },
    checkpoint: {
      phase: 'final',
      checkpoints: ['soluprot', 'af2'],
      nextStage: '-',
      finalStage: 'novelty',
      counts: [
        { label: 'design', value: 960 },
        { label: 'soluprot', value: 402 },
        { label: 'af2', value: 142 },
        { label: 'novelty', value: 142 },
      ],
      results: [
        { path: 'novelty/wt_diff.csv', kind: 'csv' },
        { path: 'af2/top_models.pdb', kind: 'pdb' },
      ],
    },
    request: { run_mode: 'pipeline', selected_tiers: [0.3, 0.5, 0.7], novelty_enabled: true, wt_compare: true },
  },
  {
    id: 'run_0415',
    name: 'Lipase 용해도 개선',
    mode: 'rfd3',
    workflow: false,
    owner: '박연구',
    stage: 'rfd3',
    state: 'failed',
    detail: 'RFD3 단계 2회 실패 후 중단',
    requested: '2026-10-04 11:25:30',
    updated: '2026-10-04 11:41:02',
    progress: 34,
    tiers: [30, 50],
    score: '-',
    evidence: '-',
    recommendation: '체인 A만 선택해 전처리 후 재실행',
    completeness: { rfd3: true, bioemu: 'missing', wtCompare: false, af2Provider: 'ColabFold', af2Selected: 0 },
    error: {
      summary: 'RFD3 backbone 생성 실패: 입력 PDB 체인 B에 결손 잔기가 있어 contig 해석이 중단되었습니다.',
      raw: `Traceback (most recent call last):
  File "/opt/rapid/stages/rfd3.py", line 184, in run_stage
    contig = parse_contig(request["rfd3_contig"], chains)
  File "/opt/rapid/lib/contig.py", line 62, in parse_contig
    raise ContigError(f"missing residues in chain {ch}: {gaps}")
rapid.lib.contig.ContigError: missing residues in chain B: [118-124, 203]
runpod.job: 7ad1c2e4 status=FAILED attempt=2/2 worker=rfd3-a100-3
hint: set design_chains=A or enable pdb_strip_nonpositive_resseq`,
    },
    request: { run_mode: 'rfd3', rfd3_mode: 'legacy_contig', rfd3_contig: 'A1-221/B1-240', rfd3_max_return_designs: 10 },
  },
  {
    id: 'run_0412',
    name: 'GFP 열안정성 R2 best',
    mode: 'pipeline',
    workflow: false,
    owner: '김연구',
    stage: 'novelty',
    state: 'completed',
    detail: '완료 (96개 후보, 보고서 2건)',
    requested: '2026-10-02 14:48:00',
    updated: '2026-10-02 17:12:44',
    progress: 100,
    tiers: [30, 50, 70],
    score: '0.771',
    evidence: 'pLDDT 중위값 87.0 · SoluProt 통과율 33.4%',
    recommendation: 'Round 3 입력 백본으로 재사용',
    completeness: { rfd3: true, bioemu: 'ready', wtCompare: true, af2Provider: 'ColabFold', af2Selected: 96 },
    request: { run_mode: 'pipeline', selected_tiers: [0.3, 0.5, 0.7] },
  },
  {
    id: 'run_0409',
    name: 'Amylase 안정화 탐색',
    mode: 'soluprot',
    workflow: false,
    owner: '최연구',
    stage: 'soluprot',
    state: 'completed',
    detail: '완료 (61개 통과)',
    requested: '2026-09-30 10:05:12',
    updated: '2026-09-30 11:02:18',
    progress: 100,
    tiers: [30, 50],
    score: '0.714',
    evidence: 'SoluProt 통과율 29.8%',
    recommendation: 'AF2 단계를 별도 실행으로 이어서 실행',
    completeness: { rfd3: false, bioemu: 'missing', wtCompare: false, af2Provider: 'ColabFold', af2Selected: 0 },
    request: { run_mode: 'soluprot', soluprot_cutoff: 0.5, selected_tiers: [0.3, 0.5] },
  },
  {
    id: 'run_0407',
    name: 'PD-L1 도킹 사전탐색',
    mode: 'diffdock',
    workflow: false,
    owner: '이박사',
    stage: 'diffdock',
    state: 'cancelled',
    detail: '사용자 요청으로 취소 (jobs: 4)',
    requested: '2026-09-29 16:31:40',
    updated: '2026-09-29 16:58:02',
    progress: 41,
    tiers: [],
    score: '-',
    evidence: '-',
    recommendation: '리간드 SMILES 를 수정한 뒤 재실행',
    completeness: { rfd3: false, bioemu: 'missing', wtCompare: false, af2Provider: 'ColabFold', af2Selected: 0 },
    request: { run_mode: 'diffdock', diffdock_ligand: 'CC(=O)Oc1ccccc1C(=O)O' },
  },
  {
    id: 'run_0405',
    name: 'GFP tier30 파일럿',
    mode: 'msa',
    workflow: false,
    owner: '김연구',
    stage: 'msa',
    state: 'running',
    detail: 'MMseqs2 검색 중',
    requested: '2026-09-28 09:00:10',
    updated: '2026-09-28 09:04:52',
    progress: 20,
    tiers: [30],
    score: '-',
    evidence: '-',
    recommendation: '-',
    completeness: { rfd3: false, bioemu: 'missing', wtCompare: false, af2Provider: 'ColabFold', af2Selected: 0 },
    queueNote: 'updating',
    request: { run_mode: 'msa', mmseqs_use_gpu: true },
  },
]

/* 관리자 전체 보기에서만 보이는 다른 사용자 실행 */
export const ADMIN_ONLY_RUNS: MonitorRun[] = [
  {
    id: 'run_0399',
    name: '(타 사용자) Protease 안정화',
    mode: 'pipeline',
    workflow: false,
    owner: '정연구',
    stage: 'design',
    state: 'running',
    detail: 'ProteinMPNN 설계 중',
    requested: '2026-09-27 13:20:00',
    updated: '2026-09-27 14:02:30',
    progress: 48,
    tiers: [30, 50, 70],
    score: '-',
    evidence: '-',
    recommendation: '-',
    completeness: { rfd3: true, bioemu: 'missing', wtCompare: false, af2Provider: 'AlphaFold2', af2Selected: 0 },
    request: { run_mode: 'pipeline' },
  },
  {
    id: 'run_0384',
    name: '(타 사용자) Nanobody 결합 탐색',
    mode: 'pipeline',
    workflow: false,
    owner: '한박사',
    stage: 'af2',
    state: 'completed',
    detail: '완료 (38개 후보)',
    requested: '2026-09-22 09:11:00',
    updated: '2026-09-22 12:41:20',
    progress: 100,
    tiers: [30, 50],
    score: '0.690',
    evidence: 'ipTM 0.68',
    recommendation: '-',
    completeness: { rfd3: false, bioemu: 'ready', wtCompare: true, af2Provider: 'ColabFold', af2Selected: 38 },
    request: { run_mode: 'pipeline' },
  },
]

/* ---------------- 산출물 ---------------- */
export const RUN_ARTIFACTS: RunArtifact[] = [
  { run: 'run_0421', path: 'msa/alignment.a3m', stage: 'msa', kind: 'fasta', size: '12.4 MB', updated: '09:16' },
  { run: 'run_0421', path: 'msa/mmseqs_summary.json', stage: 'msa', kind: 'json', size: '18 KB', updated: '09:16' },
  { run: 'run_0421', path: 'conservation/tier_profile.json', stage: 'conservation', kind: 'json', size: '184 KB', updated: '09:18', rep: true },
  { run: 'run_0421', path: 'conservation/tier_plot.svg', stage: 'conservation', kind: 'svg', size: '42 KB', updated: '09:18' },
  { run: 'run_0421', path: 'pdb_preprocess/target_clean.pdb', stage: 'pdb_preprocess', kind: 'pdb', size: '318 KB', updated: '09:13' },
  { run: 'run_0421', path: 'query_pdb_check/identity_report.json', stage: 'query_pdb_check', kind: 'json', size: '6 KB', updated: '09:13' },
  { run: 'run_0421', path: 'input_reference/input_structure.pdb', stage: 'input_reference', kind: 'pdb', size: '322 KB', updated: '09:13', rep: true },
  { run: 'run_0421', path: 'rfd3/backbone_001.pdb', stage: 'rfd3', kind: 'pdb', size: '1.9 MB', updated: '09:28', rep: true },
  { run: 'run_0421', path: 'rfd3/backbones.tar', stage: 'rfd3', kind: 'bin', size: '48.2 MB', updated: '09:28' },
  { run: 'run_0421', path: 'bioemu/ensemble_001.pdb', stage: 'bioemu', kind: 'pdb', size: '2.2 MB', updated: '09:36', rep: true },
  { run: 'run_0421', path: 'bioemu/sample_rmsd.csv', stage: 'bioemu', kind: 'csv', size: '14 KB', updated: '09:36' },
  { run: 'run_0421', path: 'working_backbone/backbone_pool.pdb', stage: 'working_backbone', kind: 'pdb', size: '8.4 MB', updated: '09:37', rep: true },
  { run: 'run_0421', path: 'wt_af2/wt_model.pdb', stage: 'wt_af2', kind: 'pdb', size: '298 KB', updated: '09:22' },
  { run: 'run_0421', path: 'af2_target/target_model.pdb', stage: 'af2_target', kind: 'pdb', size: '301 KB', updated: '09:24' },
  { run: 'run_0421', path: 'ligand_mask/mask_positions.json', stage: 'ligand_mask', kind: 'json', size: '9 KB', updated: '09:38' },
  { run: 'run_0421', path: 'surface_mask/surface_positions.json', stage: 'surface_mask', kind: 'json', size: '11 KB', updated: '09:38' },
  { run: 'run_0421', path: 'mask_consensus/consensus_mask.json', stage: 'mask_consensus', kind: 'json', size: '13 KB', updated: '09:39', rep: true },
  { run: 'run_0421', path: 'design/sequences_tier30.fasta', stage: 'design', kind: 'fasta', size: '720 KB', updated: '09:43', tier: 30, rep: true },
  { run: 'run_0421', path: 'design/sequences_tier50.fasta', stage: 'design', kind: 'fasta', size: '712 KB', updated: '09:43', tier: 50 },
  { run: 'run_0421', path: 'design/sequences_tier70.fasta', stage: 'design', kind: 'fasta', size: '704 KB', updated: '09:43', tier: 70 },
  { run: 'run_0421', path: 'design/tier_summary.json', stage: 'design', kind: 'json', size: '96 KB', updated: '09:43' },
  { run: 'run_0421', path: 'soluprot/scores.json', stage: 'soluprot', kind: 'json', size: '310 KB', updated: '09:45', rep: true },
  { run: 'run_0421', path: 'soluprot/pass_report.svg', stage: 'soluprot', kind: 'svg', size: '42 KB', updated: '09:45' },
  { run: 'run_0421', path: 'soluprot/passed_tier30.fasta', stage: 'soluprot', kind: 'fasta', size: '188 KB', updated: '09:45', tier: 30 },
  { run: 'run_0421', path: 'soluprot/passed_tier50.fasta', stage: 'soluprot', kind: 'fasta', size: '152 KB', updated: '09:45', tier: 50 },
  { run: 'run_0421', path: 'soluprot/passed_tier70.fasta', stage: 'soluprot', kind: 'fasta', size: '21 KB', updated: '09:45', tier: 70 },
  { run: 'run_0421', path: 'surrogate/triage_rank.csv', stage: 'surrogate', kind: 'csv', size: '44 KB', updated: '09:45' },
  { run: 'run_0421', path: 'agent/agent_events.json', stage: 'agent', kind: 'json', size: '36 KB', updated: '09:46' },
  { run: 'run_0421', path: 'agent/agent_report.md', stage: 'agent', kind: 'md', size: '22 KB', updated: '09:46' },
  { run: 'run_0421', path: 'misc/orchestrator.log', stage: 'misc', kind: 'log', size: '1.8 MB', updated: '09:46' },

  { run: 'run_0420', path: 'msa/alignment.a3m', stage: 'msa', kind: 'fasta', size: '9.1 MB', updated: '08:52' },
  { run: 'run_0420', path: 'bioemu/ensemble_001.pdb', stage: 'bioemu', kind: 'pdb', size: '2.0 MB', updated: '09:05', rep: true },
  { run: 'run_0420', path: 'design/sequences_tier30.fasta', stage: 'design', kind: 'fasta', size: '430 KB', updated: '09:21', tier: 30, rep: true },
  { run: 'run_0420', path: 'af2/model_tier30_rank1.pdb', stage: 'af2', kind: 'pdb', size: '288 KB', updated: '09:42', tier: 30, rep: true },
  { run: 'run_0420', path: 'af2/metrics.csv', stage: 'af2', kind: 'csv', size: '31 KB', updated: '09:42' },
  { run: 'run_0420', path: 'diffdock/pose_top1.sdf', stage: 'diffdock', kind: 'sdf', size: '64 KB', updated: '09:12' },

  { run: 'run_0418', path: 'af2/top_models.pdb', stage: 'af2', kind: 'pdb', size: '1.2 MB', updated: '19:21', rep: true },
  { run: 'run_0418', path: 'af2/metrics.csv', stage: 'af2', kind: 'csv', size: '28 KB', updated: '19:21' },
  { run: 'run_0418', path: 'novelty/wt_diff.csv', stage: 'novelty', kind: 'csv', size: '18 KB', updated: '19:38', rep: true },
  { run: 'run_0418', path: 'wt/wt_sequence.fasta', stage: 'wt', kind: 'fasta', size: '1 KB', updated: '17:04' },
  { run: 'run_0418', path: 'misc/report_ko.md', stage: 'misc', kind: 'md', size: '28 KB', updated: '19:38' },

  { run: 'run_0415', path: 'pdb_preprocess/target_clean.pdb', stage: 'pdb_preprocess', kind: 'pdb', size: '210 KB', updated: '11:27', rep: true },
  { run: 'run_0415', path: 'misc/rfd3_stderr.log', stage: 'misc', kind: 'log', size: '84 KB', updated: '11:41' },

  { run: 'run_0412', path: 'af2/top_models.pdb', stage: 'af2', kind: 'pdb', size: '980 KB', updated: '17:02', rep: true },
  { run: 'run_0412', path: 'evolution/round3_pool.csv', stage: 'evolution', kind: 'csv', size: '52 KB', updated: '17:10' },

  { run: 'run_0409', path: 'soluprot/scores.json', stage: 'soluprot', kind: 'json', size: '140 KB', updated: '11:02', rep: true },
  { run: 'run_0407', path: 'diffdock/pose_top1.sdf', stage: 'diffdock', kind: 'sdf', size: '58 KB', updated: '16:52', rep: true },
  { run: 'run_0405', path: 'msa/mmseqs_summary.json', stage: 'msa', kind: 'json', size: '4 KB', updated: '09:04', rep: true },
]

/* 미리보기 텍스트 (read_artifact 결과를 흉내낸 샘플) */
export const ARTIFACT_PREVIEW_TEXT: Record<string, string> = {
  json: `{
  "stage": "soluprot",
  "cutoff": 0.5,
  "total": 1200,
  "passed": 318,
  "pass_rate": 0.265,
  "per_tier": {
    "tier30": { "total": 400, "passed": 165, "rate": 0.4125 },
    "tier50": { "total": 400, "passed": 135, "rate": 0.3375 },
    "tier70": { "total": 400, "passed": 18,  "rate": 0.045 }
  },
  "model": "soluprot@1.0",
  "endpoint": "internal/cpu-pool"
}`,
  csv: `id,tier,soluprot,plddt,rmsd,wt_diff
cand_001,30,0.812,91.4,0.98,9
cand_002,30,0.784,89.1,1.12,11
cand_003,50,0.771,88.0,1.21,13
cand_004,50,0.742,86.4,1.33,12
cand_005,70,0.661,83.9,1.74,18`,
  fasta: `>cand_001 tier30 mut=9
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTL
>cand_002 tier30 mut=11
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGRLPVPWPTL
>cand_003 tier50 mut=13
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGEATYGKLTLKFICTTGRLPVPWPTL`,
  md: `# run_0421 실행 보고서

## 1. 실행 개요
- 실행 모드: 단계별 실행 (msa ~ novelty)
- 보존도 tier: 30 / 50 / 70

## 2. 단계 결과
| 단계 | 산출 | 비고 |
| --- | --- | --- |
| design | 1,200 서열 | tier별 400개 |
| soluprot | 318 통과 | 통과율 26.5% |`,
  log: `09:45:28 [soluprot] scored 1200 sequences in 81s
09:45:29 [soluprot] WARN pass rate 26.5% below baseline 35.0%
09:45:32 [artifact] wrote soluprot/scores.json (310 KB)
09:45:33 [gate] checkpoint reached: soluprot`,
}

/* ---------------- 활동 로그 ---------------- */
export const MONITOR_LOG: [string, string, string][] = [
  ['t', '09:43:02', 'stage design completed, 1,200 sequences across 3 tiers'],
  ['t', '09:43:05', 'artifact written design/sequences_tier30.fasta (720 KB)'],
  ['t', '09:44:11', 'stage soluprot started, model soluprot@1.0 endpoint internal/cpu-pool'],
  ['o', '09:45:28', 'soluprot scored 1,200 sequences in 81s'],
  ['w', '09:45:29', 'pass rate 26.5% below project baseline 35.0%'],
  ['w', '09:45:30', 'tier70 pass rate 4.5%, dominant contributor'],
  ['t', '09:45:32', 'artifact written soluprot/scores.json (310 KB)'],
  ['o', '09:45:33', 'checkpoint reached: soluprot, awaiting review'],
  ['t', '09:46:12', 'pipeline.queue_eta: af2 queued 6 running 1, approximate estimate'],
]

/* ---------------- Evidence Agent Panel ---------------- */
export interface AgentEvent {
  id: string
  run: string
  stage: string
  decision: 'proceed' | 'hold' | 'rerun' | 'abort'
  confidence: number
  createdAt: string
  agents: { name: string; status: 'ok' | 'warn' | 'err' | 'skip' }[]
  summaries: { name: string; text: string }[]
  rationale: string
  error?: string
  actions: string[]
  interpretation: string
}

export const AGENT_DECISION_LABELS: Record<AgentEvent['decision'], { cls: string; text: string }> = {
  proceed: { cls: 'ok', text: '진행 권고' },
  hold: { cls: 'warn', text: '검토 보류' },
  rerun: { cls: 'warn', text: '재실행 권고' },
  abort: { cls: 'err', text: '중단 권고' },
}

export const AGENT_EVENTS: AgentEvent[] = [
  {
    id: 'ev_3012',
    run: 'run_0421',
    stage: 'soluprot',
    decision: 'hold',
    confidence: 0.82,
    createdAt: '2026-10-05 09:45:40',
    agents: [
      { name: 'solubility_expert', status: 'warn' },
      { name: 'conservation_expert', status: 'ok' },
      { name: 'budget_guard', status: 'warn' },
      { name: 'novelty_expert', status: 'skip' },
    ],
    summaries: [
      { name: 'solubility_expert', text: '통과율 26.5%는 동일 타깃 과거 실행 평균(34.8%)보다 8.3%p 낮습니다. tier70 구간이 4.5%로 이상값입니다.' },
      { name: 'conservation_expert', text: 'MSA 깊이 Neff 812로 충분하며 tier 경계는 신뢰할 수 있습니다. 마스킹 규칙 변경은 권하지 않습니다.' },
      { name: 'budget_guard', text: '통과 후보 318개를 모두 AF2로 보내면 예상 GPU 9.4시간으로 잔여 예산의 1.4배입니다.' },
      { name: 'novelty_expert', text: 'AF2 결과가 없어 평가를 건너뛰었습니다.' },
    ],
    rationale: 'tier70 통과율 급락은 보존도 마스킹이 과도하게 적용된 경우의 전형적 패턴이며, 예산 제약과 함께 고려하면 후보 축소가 합리적입니다.',
    actions: ['tier70 제외 후 af2 진행', 'af2_max_candidates_per_tier=70 설정', 'soluprot_cutoff 0.45로 재실행'],
    interpretation: '현재 체크포인트에서 전체 진행보다 상위 200개 선별 진행이 비용 대비 기대 수익이 높습니다.',
  },
  {
    id: 'ev_3008',
    run: 'run_0421',
    stage: 'design',
    decision: 'proceed',
    confidence: 0.91,
    createdAt: '2026-10-05 09:43:10',
    agents: [
      { name: 'design_expert', status: 'ok' },
      { name: 'conservation_expert', status: 'ok' },
      { name: 'structure_expert', status: 'ok' },
    ],
    summaries: [
      { name: 'design_expert', text: 'tier별 400개 서열이 균등하게 생성되었고 중복률 1.2%로 낮습니다.' },
      { name: 'conservation_expert', text: '고정 위치 5개가 모두 유지되었습니다.' },
      { name: 'structure_expert', text: 'Working backbone 24개 중 24개에 대해 서열이 생성되었습니다.' },
    ],
    rationale: '설계 단계 산출 품질 지표가 모두 기준 범위 안에 있습니다.',
    actions: ['soluprot 단계 계속'],
    interpretation: '추가 조치 없이 다음 단계로 진행할 수 있습니다.',
  },
  {
    id: 'ev_2994',
    run: 'run_0415',
    stage: 'rfd3',
    decision: 'abort',
    confidence: 0.76,
    createdAt: '2026-10-04 11:41:02',
    agents: [
      { name: 'structure_expert', status: 'err' },
      { name: 'recovery_agent', status: 'warn' },
    ],
    summaries: [
      { name: 'structure_expert', text: '입력 PDB 체인 B에 7개 결손 잔기가 있어 contig 해석이 실패했습니다.' },
      { name: 'recovery_agent', text: '자동 복구 2회 시도 후 동일 오류가 반복되어 중단했습니다.' },
    ],
    rationale: '입력 구조 결손은 자동 복구 범위를 넘어서며 사용자 입력 변경이 필요합니다.',
    error: 'rapid.lib.contig.ContigError: missing residues in chain B: [118-124, 203]',
    actions: ['design_chains=A 로 재실행', 'pdb_strip_nonpositive_resseq 활성화'],
    interpretation: '체인 A만 사용하도록 입력을 수정하면 동일 조건으로 재실행이 가능합니다.',
  },
]

/* ---------------- 단계별 실행 ---------------- */
export type StudioStatus =
  | 'ready' | 'starting' | 'running' | 'completed' | 'failed' | 'cancelled' | 'stopped' | 'skipped' | 'excluded'

export const STUDIO_STATUS_LABELS: Record<StudioStatus, { cls: string; text: string }> = {
  ready: { cls: '', text: '준비' },
  starting: { cls: 'run', text: '시작' },
  running: { cls: 'run', text: '실행중' },
  completed: { cls: 'ok', text: '완료' },
  failed: { cls: 'err', text: '실패' },
  cancelled: { cls: '', text: '취소' },
  stopped: { cls: 'warn', text: '중지' },
  skipped: { cls: '', text: '건너뜀' },
  excluded: { cls: '', text: '제외' },
}

export const STUDIO_STAGE_ORDER = ['msa', 'rfd3', 'bioemu', 'design', 'soluprot', 'af2', 'novelty'] as const
export type StudioStageKey = typeof STUDIO_STAGE_ORDER[number]

export const STUDIO_STAGE_META: Record<StudioStageKey, { label: string; model: string; desc: string }> = {
  msa: { label: 'MSA', model: 'MMseqs2 v15', desc: '상동 서열을 검색하고 보존도 tier 를 계산합니다.' },
  rfd3: { label: 'RFD3', model: 'RFDiffusion3 1.2.0', desc: '백본 후보를 생성합니다.' },
  bioemu: { label: 'BioEmu', model: 'BioEmu 1.1', desc: '구조 앙상블을 샘플링합니다.' },
  design: { label: 'Design', model: 'ProteinMPNN 1.0.1', desc: '후보 아미노산 서열을 설계합니다.' },
  soluprot: { label: 'SoluProt', model: 'SoluProt 1.0', desc: '용해도 기준으로 후보를 점수화하고 걸러냅니다.' },
  af2: { label: 'AF2', model: 'ColabFold 1.5.5', desc: '구조와 품질 지표를 예측합니다.' },
  novelty: { label: 'Novelty', model: 'WT Diff', desc: 'WT 서열과 비교해 WT Diff 를 계산합니다.' },
}

export interface StudioField {
  key: string
  label: string
  type: 'text' | 'num' | 'area' | 'bool' | 'select'
  def: string | boolean
  opts?: { v: string; t: string }[]
  ph?: string
  rows?: number
  unit?: string
  modes?: string[]
  when?: string
}

const RFD3_MODES = [
  { v: 'local_diversify', t: 'Local Diversify' },
  { v: 'legacy_contig', t: 'Legacy Contig' },
  { v: 'binder', t: 'Binder' },
  { v: 'enzyme', t: 'Enzyme' },
  { v: 'advanced', t: 'Advanced' },
]

export const STUDIO_STAGE_FIELDS: Record<StudioStageKey, StudioField[]> = {
  msa: [
    { key: 'target_input', label: '타깃 입력', type: 'area', def: '>GFP_wt\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTL', rows: 4 },
    {
      key: 'pdb_strip_nonpositive_resseq', label: '음수 잔기번호 처리', type: 'select', def: 'strip',
      opts: [{ v: 'strip', t: '제거 (권장)' }, { v: 'keep', t: '그대로 유지' }],
    },
    { key: 'backbone_filter_use_dssp', label: '입력 백본 게이트에서 루프 무시', type: 'bool', def: true },
  ],
  rfd3: [
    { key: 'rfd3_use', label: 'RFD3 사용', type: 'bool', def: true },
    { key: 'rfd3_mode', label: 'RFD3 모드', type: 'select', def: 'local_diversify', opts: RFD3_MODES },
    { key: 'rfd3_input_pdb', label: 'RFD3 입력 PDB', type: 'text', def: '', ph: 'input_reference/input_structure.pdb' },
    { key: 'rfd3_contig', label: 'Contig', type: 'text', def: 'A1-221', ph: 'A1-221', modes: ['legacy_contig', 'binder', 'enzyme', 'advanced'] },
    { key: 'rfd3_hotspots', label: 'Hotspot 잔기', type: 'text', def: '', ph: 'A59, A62, A68', modes: ['binder', 'enzyme', 'advanced'] },
    { key: 'rfd3_infer_ori_strategy', label: '방향 추론 전략', type: 'text', def: '', ph: 'global', modes: ['legacy_contig', 'advanced'] },
    { key: 'rfd3_is_non_loopy', label: '루프 억제 (non-loopy)', type: 'bool', def: false, modes: ['legacy_contig', 'binder', 'advanced'] },
    { key: 'rfd3_unindex', label: '인덱스 제외 구간', type: 'text', def: '', ph: 'A45-60', modes: ['local_diversify', 'advanced'] },
    { key: 'rfd3_length', label: '생성 길이', type: 'text', def: '', ph: '20-40', modes: ['binder', 'advanced'] },
    { key: 'rfd3_select_fixed_atoms', label: '고정 원자 선택', type: 'area', def: '', ph: 'A57:CA,A57:CB', rows: 2, modes: ['local_diversify', 'enzyme', 'advanced'] },
    { key: 'rfd3_partial_t', label: 'partial_t 노이즈 스케일', type: 'num', def: '5.0', unit: 'Å', modes: ['local_diversify', 'advanced'] },
    { key: 'rfd3_target_rmsd_cutoff', label: '입력 백본 RMSD 한계', type: 'num', def: '2.0', unit: 'Å' },
    { key: 'rfd3_max_return_designs', label: '반환 설계 수', type: 'num', def: '10' },
    { key: 'rfd3_inputs_text', label: '고급 입력 (JSON/YAML)', type: 'area', def: '', rows: 3, ph: '{ "diffuser": { "T": 50 } }', modes: ['advanced'] },
  ],
  bioemu: [
    { key: 'bioemu_use', label: 'BioEmu 사용', type: 'bool', def: true },
    { key: 'bioemu_num_samples', label: '생성 개수', type: 'num', def: '20' },
    { key: 'bioemu_max_return_structures', label: '반환 구조 수', type: 'num', def: '10' },
    { key: 'bioemu_filter_samples', label: '샘플 필터 사용', type: 'bool', def: true },
    { key: 'bioemu_target_rmsd_cutoff', label: '입력 백본 RMSD 한계', type: 'num', def: '2.0', unit: 'Å' },
    { key: 'bioemu_steering_config_text', label: 'steering 설정 (JSON)', type: 'area', def: '', rows: 3, ph: '{ "temperature_k": 300 }' },
  ],
  design: [
    { key: 'design_chains', label: '설계 체인', type: 'text', def: 'A', ph: 'A 또는 A,B' },
    { key: 'fixed_positions_extra', label: '추가 고정 위치', type: 'area', def: 'A:65,66,67', rows: 2, ph: 'A:6,10;*:120 또는 {"A":[6,10]}' },
    { key: 'num_seq_per_tier', label: '백본당 서열 수', type: 'num', def: '2' },
    {
      key: 'mask_consensus_apply', label: 'Mask Consensus 적용', type: 'select', def: 'apply',
      opts: [{ v: 'apply', t: '합의 마스크 적용' }, { v: 'skip', t: '적용하지 않음' }],
    },
    {
      key: 'ligand_mask_use_original_target', label: '원본 리간드 마스크', type: 'select', def: 'original',
      opts: [{ v: 'original', t: '원본 마스크 유지' }, { v: 'backbone', t: '백본 기준 마스크 사용' }],
    },
    { key: 'evolution_mode', label: '진화 탐색 사용', type: 'bool', def: false },
    {
      key: 'evolution_label_source', label: '후보 선택 방식', type: 'select', def: 'experimental', when: 'evolution_mode',
      opts: [{ v: 'experimental', t: '실험 측정값 사용' }, { v: 'af2', t: 'AF2 점수로 테스트' }],
    },
    {
      key: 'evolution_objective_metric', label: '최적화 지표', type: 'select', def: 'activity', when: 'evolution_mode',
      opts: [{ v: 'activity', t: 'activity' }, { v: 'stability', t: 'stability' }, { v: 'solubility', t: 'solubility' }],
    },
    { key: 'evolution_experiment_source_run_id', label: '측정값 보유 실행', type: 'text', def: '', ph: 'run_0412', when: 'evolution_mode' },
    { key: 'evolution_pool_size', label: '후보 풀 크기', type: 'num', def: '1000', when: 'evolution_mode' },
    { key: 'evolution_initial_samples', label: '초기 테스트 세트', type: 'num', def: '30', when: 'evolution_mode' },
    { key: 'evolution_oracle_samples', label: '최종 검증 후보 수', type: 'num', def: '20', when: 'evolution_mode' },
    { key: 'evolution_rounds', label: '탐색 반복 횟수', type: 'num', def: '3', when: 'evolution_mode' },
    { key: 'evolution_samples_per_round', label: '반복당 후보 수', type: 'num', def: '5', when: 'evolution_mode' },
  ],
  soluprot: [
    { key: 'soluprot_cutoff', label: 'SoluProt 컷오프', type: 'num', def: '0.5' },
  ],
  af2: [
    {
      key: 'af2_provider', label: '구조 예측기', type: 'select', def: 'colabfold',
      opts: [{ v: 'colabfold', t: 'ColabFold (기본)' }, { v: 'alphafold2', t: 'AlphaFold2' }],
    },
    { key: 'af2_max_candidates_per_tier', label: '보존도별 상위 N', type: 'num', def: '0', },
    { key: 'surrogate_triage_enabled', label: 'Surrogate AF2 예산 선별', type: 'bool', def: false },
    {
      key: 'surrogate_triage_scope', label: '후보 풀 범위', type: 'select', def: 'per_tier', when: 'surrogate_triage_enabled',
      opts: [{ v: 'pooled_tiers', t: 'tier 통합' }, { v: 'per_tier', t: 'tier별' }],
    },
    { key: 'surrogate_triage_initial_samples', label: 'Surrogate 학습 세트', type: 'num', def: '30', when: 'surrogate_triage_enabled' },
    { key: 'surrogate_triage_top_k', label: 'Surrogate Top K', type: 'num', def: '20', when: 'surrogate_triage_enabled' },
    {
      key: 'surrogate_triage_model', label: 'Top K 선택 방법', type: 'select', def: 'auto', when: 'surrogate_triage_enabled',
      opts: [{ v: 'auto', t: 'CV로 자동 선택' }, { v: 'rf', t: 'rf' }, { v: 'ridge', t: 'ridge' }, { v: 'lightgbm', t: 'lightgbm' }, { v: 'xgboost', t: 'xgboost' }],
    },
    { key: 'surrogate_triage_comparator_models', label: '비교 모델 목록', type: 'text', def: 'rf, ridge, lightgbm, xgboost', when: 'surrogate_triage_enabled' },
    { key: 'surrogate_triage_ensemble_models', label: '순위 앙상블 (선택)', type: 'text', def: '', ph: 'rf, lightgbm', when: 'surrogate_triage_enabled' },
    { key: 'surrogate_triage_cv_folds', label: 'CV Fold 수', type: 'num', def: '5', when: 'surrogate_triage_enabled' },
    { key: 'af2_plddt_cutoff', label: 'pLDDT 컷오프', type: 'num', def: '85' },
    { key: 'af2_rmsd_cutoff', label: 'RMSD 컷오프', type: 'num', def: '2.0', unit: 'Å' },
    { key: 'relax_enabled', label: 'Rosetta Relax 사용', type: 'bool', def: true },
  ],
  novelty: [
    { key: 'novelty_enabled', label: 'WT Diff 사용', type: 'bool', def: true },
    {
      key: 'wt_compare', label: 'WT 비교', type: 'select', def: 'enable',
      opts: [{ v: 'enable', t: 'WT 비교 사용' }, { v: 'disable', t: '사용하지 않음' }],
    },
  ],
}

export interface StudioSession {
  id: string
  name: string
  run: string
  headStage: StudioStageKey
  nextStage: StudioStageKey
  updated: string
  stages: { key: StudioStageKey; status: StudioStatus; included: boolean; artifacts: number; note: string }[]
  history: { at: string; stage: string; status: StudioStatus; note: string }[]
}

export const STUDIO_SESSIONS: StudioSession[] = [
  {
    id: 'ws_0421_a',
    name: 'GFP R3 tier50 단계별 실행',
    run: 'run_0421',
    headStage: 'soluprot',
    nextStage: 'af2',
    updated: '2026-10-05 09:46:12',
    stages: [
      { key: 'msa', status: 'completed', included: true, artifacts: 3, note: 'Neff 812' },
      { key: 'rfd3', status: 'completed', included: true, artifacts: 2, note: 'backbone 24개' },
      { key: 'bioemu', status: 'completed', included: true, artifacts: 2, note: 'ensemble 10개' },
      { key: 'design', status: 'completed', included: true, artifacts: 4, note: '서열 1,200개' },
      { key: 'soluprot', status: 'running', included: true, artifacts: 5, note: '318 / 1,200 통과' },
      { key: 'af2', status: 'ready', included: true, artifacts: 0, note: '대기' },
      { key: 'novelty', status: 'ready', included: true, artifacts: 0, note: '대기' },
    ],
    history: [
      { at: '09:46:12', stage: 'soluprot', status: 'running', note: '체크포인트 도달, 검토 대기' },
      { at: '09:44:11', stage: 'soluprot', status: 'starting', note: 'cutoff 0.5 로 실행 요청' },
      { at: '09:43:02', stage: 'design', status: 'completed', note: 'num_seq_per_tier=2' },
      { at: '09:36:40', stage: 'bioemu', status: 'completed', note: 'num_samples=20' },
      { at: '09:28:14', stage: 'rfd3', status: 'completed', note: 'local_diversify, partial_t=5.0' },
      { at: '09:18:02', stage: 'msa', status: 'completed', note: 'MMseqs2 GPU' },
    ],
  },
  {
    id: 'ws_0418_b',
    name: 'GFP R3 tier70 재현',
    run: 'run_0418',
    headStage: 'novelty',
    nextStage: 'novelty',
    updated: '2026-10-04 19:38:40',
    stages: [
      { key: 'msa', status: 'completed', included: true, artifacts: 2, note: 'Neff 790' },
      { key: 'rfd3', status: 'completed', included: true, artifacts: 2, note: 'backbone 18개' },
      { key: 'bioemu', status: 'excluded', included: false, artifacts: 0, note: '제외됨' },
      { key: 'design', status: 'completed', included: true, artifacts: 3, note: '서열 960개' },
      { key: 'soluprot', status: 'completed', included: true, artifacts: 4, note: '402 통과' },
      { key: 'af2', status: 'completed', included: true, artifacts: 2, note: '142 선정' },
      { key: 'novelty', status: 'completed', included: true, artifacts: 2, note: 'WT Diff 평균 11' },
    ],
    history: [
      { at: '19:38:40', stage: 'novelty', status: 'completed', note: '최종 단계 완료' },
      { at: '19:21:02', stage: 'af2', status: 'completed', note: 'plddt 85 / rmsd 2.0' },
      { at: '18:04:30', stage: 'soluprot', status: 'completed', note: 'cutoff 0.5' },
    ],
  },
  {
    id: 'ws_0415_c',
    name: 'Lipase RFD3 복구',
    run: 'run_0415',
    headStage: 'rfd3',
    nextStage: 'rfd3',
    updated: '2026-10-04 11:41:02',
    stages: [
      { key: 'msa', status: 'completed', included: true, artifacts: 2, note: 'Neff 410' },
      { key: 'rfd3', status: 'failed', included: true, artifacts: 1, note: 'contig 해석 실패' },
      { key: 'bioemu', status: 'skipped', included: true, artifacts: 0, note: '상위 단계 실패' },
      { key: 'design', status: 'ready', included: true, artifacts: 0, note: '대기' },
      { key: 'soluprot', status: 'ready', included: true, artifacts: 0, note: '대기' },
      { key: 'af2', status: 'stopped', included: true, artifacts: 0, note: '중지됨' },
      { key: 'novelty', status: 'cancelled', included: false, artifacts: 0, note: '취소됨' },
    ],
    history: [
      { at: '11:41:02', stage: 'rfd3', status: 'failed', note: 'ContigError: chain B 결손 잔기' },
      { at: '11:27:18', stage: 'rfd3', status: 'starting', note: 'legacy_contig A1-221/B1-240' },
      { at: '11:26:02', stage: 'msa', status: 'completed', note: 'MMseqs2 CPU' },
    ],
  },
]

export interface StageCheck {
  state: 'ok' | 'blocked' | 'loading' | 'failed'
  editor: string[]
  required: string[]
  blocking: string[]
  warnings: string[]
}

export const STUDIO_STAGE_CHECKS: Record<StudioStageKey, StageCheck> = {
  msa: { state: 'ok', editor: [], required: [], blocking: [], warnings: ['타깃 입력이 FASTA 이므로 구조 기반 게이트는 건너뜁니다.'] },
  rfd3: {
    state: 'blocked', editor: ['Contig 형식 오류: 체인 B 구간이 입력 PDB 범위를 벗어납니다.'],
    required: ['RFD3 입력 PDB'], blocking: ['입력 PDB 체인 B에 결손 잔기 7개가 있습니다.'],
    warnings: ['partial_t 5.0은 큰 변형을 만듭니다. 2.0~3.0 범위를 권장합니다.'],
  },
  bioemu: { state: 'ok', editor: [], required: [], blocking: [], warnings: ['steering 설정이 비어 있어 기본값으로 실행됩니다.'] },
  design: {
    state: 'ok', editor: [], required: [], blocking: [],
    warnings: ['고정 위치 3개가 보존도 tier70 구간과 겹칩니다.'],
  },
  soluprot: {
    state: 'ok', editor: [], required: [], blocking: [],
    warnings: ['Design(ProteinMPNN) 산출 서열 1,200개를 입력으로 사용합니다.'],
  },
  af2: {
    state: 'blocked', editor: [], required: ['SoluProt 통과 서열'],
    blocking: ['SoluProt 통과 서열이 tier70 구간에서 18개뿐입니다. 상위 N 설정을 확인하세요.'],
    warnings: ['ColabFold 엔드포인트 대기열이 6건입니다. 예상 대기 약 22분.'],
  },
  novelty: {
    state: 'ok', editor: [], required: [], blocking: [],
    warnings: ['AF2 선정 서열 200개를 입력으로 사용합니다.'],
  },
}

export const STUDIO_RERUN_NOTES = {
  reuse: '현재 실행을 재사용해 이 단계만 실행합니다.',
  newRun: '이 단계부터 새 실행을 시작합니다.',
  forkMsa: '상위 단계 입력이 변경되었습니다. MSA 부터 새 실행으로 분기합니다.',
  restart: (stage: string) => `상위 단계 입력이 변경되었습니다. ${stage} 단계부터 다시 시작합니다.`,
}
