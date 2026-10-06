/* 고급 설정 / 빠른 실행 화면용 목업 데이터와 파라미터 카탈로그.
   원본 QUESTION_PRESETS의 라벨·기본값·옵션을 그대로 옮겼다. */

export type QKind = 'text' | 'num' | 'select' | 'bool' | 'textarea' | 'tiers' | 'checks'

export interface Q {
  k: string
  label: string
  kind: QKind
  opts?: { v: string; t: string }[]
  min?: number
  max?: number
  step?: number
  rows?: number
  ph?: string
  note?: string
  req?: boolean
}

export type AnswerVal = string | number | boolean | string[]

const onoff = (on: string, off: string) => [{ v: 'true', t: on }, { v: 'false', t: off }]

export const MODEL_CHOICES = [
  { v: 'rf', t: 'rf (Random Forest)' },
  { v: 'ridge', t: 'ridge' },
  { v: 'xgboost', t: 'xgboost' },
  { v: 'lightgbm', t: 'lightgbm' },
]

export const STANDALONE_STAGES = [
  { v: 'rfd3', t: 'RFD3 (Backbone)' },
  { v: 'bioemu', t: 'BioEmu (Backbone)' },
  { v: 'msa', t: 'MSA (MMseqs2)' },
  { v: 'design', t: 'ProteinMPNN' },
  { v: 'soluprot', t: 'SoluProt' },
  { v: 'af2', t: 'ColabFold / AF2' },
  { v: 'diffdock', t: 'DiffDock' },
]

export const PIPELINE_STAGES = ['msa', 'rfd3', 'bioemu', 'design', 'soluprot', 'af2', 'novelty']

export const STAGE_GUIDE: Record<string, string> = {
  msa: '동족 서열을 탐색하고 보존도 프로파일을 계산합니다.',
  rfd3: '입력 백본을 기준으로 백본 후보를 생성합니다.',
  bioemu: '구조 요동(conformation)을 샘플링해 백본 후보를 확보합니다.',
  design: '백본별 아미노산 서열 후보를 설계합니다 (ProteinMPNN).',
  soluprot: '용해도 기준으로 후보를 점수화하고 필터링합니다.',
  af2: '구조와 품질 지표(pLDDT, RMSD)를 예측합니다.',
  novelty: 'WT 서열과 비교해 WT Diff를 계산합니다.',
}

const STOP_OPTS = [
  { v: 'msa', t: 'msa' }, { v: 'rfd3', t: 'rfd3' }, { v: 'bioemu', t: 'bioemu' },
  { v: 'design', t: 'design' }, { v: 'soluprot', t: 'soluprot' }, { v: 'af2', t: 'af2' },
  { v: 'wt_diff', t: 'wt_diff' }, { v: 'novelty', t: 'novelty' },
]

/* ---------------- 파라미터 카탈로그 ---------------- */
export const QUESTIONS: Record<string, Q> = {
  run_mode: {
    k: 'run_mode', label: '실행 모드', kind: 'select', req: true, note: '필수',
    opts: [
      { v: 'pipeline', t: 'Full Pipeline' }, { v: 'workflow', t: '단계별 실행' },
      { v: 'standalone', t: 'Single Stage' }, { v: 'surrogate', t: 'Pipeline + Surrogate' },
    ],
  },
  standalone_stage: { k: 'standalone_stage', label: '단일 실행 단계', kind: 'select', opts: STANDALONE_STAGES, note: '단일 단계 모드에서만 사용' },
  target_input: { k: 'target_input', label: '타깃 입력', kind: 'textarea', rows: 8, req: true, note: 'PDB / mmCIF / FASTA 원문, 형식 자동 판별', ph: '>target\nMSKGEELFTGVVPILVELDGD...' },
  start_from: { k: 'start_from', label: '시작 단계', kind: 'select', note: '기본 msa', opts: STOP_OPTS.slice(0, 6) },
  stop_after: { k: 'stop_after', label: '중단 단계', kind: 'select', note: '기본 novelty', opts: STOP_OPTS },
  design_chains: { k: 'design_chains', label: '설계 대상 체인', kind: 'select', note: '기본 전체 체인, 업로드한 PDB에서 추출', opts: [{ v: 'all', t: '전체 체인' }, { v: 'A', t: 'A' }, { v: 'B', t: 'B' }, { v: 'A,B', t: 'A, B' }] },
  pdb_strip_nonpositive_resseq: { k: 'pdb_strip_nonpositive_resseq', label: '비정수 잔기 번호 처리', kind: 'select', note: '기본 제거(권장)', opts: [{ v: 'true', t: '제거 (권장)' }, { v: 'false', t: '그대로 유지' }] },
  pdb_renumber_resseq_from_1: { k: 'pdb_renumber_resseq_from_1', label: '잔기 번호 1부터 재부여', kind: 'bool', note: '기본 미사용', opts: onoff('재부여', '원본 유지') },
  wt_compare: { k: 'wt_compare', label: 'WT 비교', kind: 'bool', note: '기본 사용', opts: onoff('사용', '미사용') },
  mask_consensus_apply: { k: 'mask_consensus_apply', label: '마스크 컨센서스 적용', kind: 'bool', note: '기본 미적용', opts: onoff('컨센서스 적용', '적용 안 함') },
  bioemu_use: { k: 'bioemu_use', label: 'BioEmu 사용', kind: 'bool', note: '기본 사용', opts: onoff('사용', '미사용') },
  rfd3_use: { k: 'rfd3_use', label: 'RFD3 사용', kind: 'bool', note: '기본 true', opts: onoff('사용', '미사용') },
  backbone_filter_use_dssp: { k: 'backbone_filter_use_dssp', label: '입력 백본 게이트에서 루프 무시', kind: 'bool', note: '기본 true (DSSP 기준)', opts: onoff('루프 무시', '전체 포함') },
  bioemu_num_samples: { k: 'bioemu_num_samples', label: 'BioEmu 생성 개수', kind: 'num', note: '기본 20', min: 1, step: 1 },
  bioemu_max_return_structures: { k: 'bioemu_max_return_structures', label: 'BioEmu 반환 개수', kind: 'num', note: '기본 10', min: 1, step: 1 },
  bioemu_target_rmsd_cutoff: { k: 'bioemu_target_rmsd_cutoff', label: 'BioEmu 입력 백본 RMSD 상한', kind: 'num', note: '기본 2.0 Å', min: 0, step: 0.1 },
  bioemu_filter_samples: { k: 'bioemu_filter_samples', label: 'BioEmu 샘플 필터', kind: 'bool', note: '기본 true', opts: onoff('필터 적용', '필터 없음') },
  bioemu_steering_config_text: { k: 'bioemu_steering_config_text', label: 'BioEmu steering 설정', kind: 'textarea', rows: 4, note: 'JSON 다중 행', ph: '{\n  "target_rmsd": 1.8\n}' },
  num_seq_per_tier: { k: 'num_seq_per_tier', label: '백본당 ProteinMPNN 서열 수', kind: 'num', note: '기본 2', min: 1, step: 1 },
  selected_tiers: { k: 'selected_tiers', label: '서열 보존율', kind: 'tiers', note: '기본 30 / 50 / 70 % 모두 선택' },
  af2_max_candidates_per_tier: { k: 'af2_max_candidates_per_tier', label: '보존율별 구조 예측 상한 (Top N)', kind: 'num', note: '기본 0 (전체)', min: 0, step: 1 },
  surrogate_triage_enabled: { k: 'surrogate_triage_enabled', label: 'Surrogate AF2 예산 트리아지', kind: 'bool', note: '기본 false', opts: onoff('사용', '미사용') },
  surrogate_triage_scope: { k: 'surrogate_triage_scope', label: '후보 풀 구성', kind: 'select', note: '기본 pooled_tiers', opts: [{ v: 'pooled_tiers', t: 'Pooled tiers (보존율 통합)' }, { v: 'per_tier', t: 'Per tier (보존율별)' }] },
  surrogate_triage_initial_samples: { k: 'surrogate_triage_initial_samples', label: 'Surrogate 학습 세트', kind: 'num', note: '기본 30, 최소 5, 단위 5', min: 5, step: 5 },
  surrogate_triage_top_k: { k: 'surrogate_triage_top_k', label: 'Surrogate Top K', kind: 'num', note: '기본 20, 최소 1', min: 1, step: 1 },
  surrogate_triage_model: {
    k: 'surrogate_triage_model', label: 'Top K 선정 방식', kind: 'select', note: '기본 auto',
    opts: [{ v: 'auto', t: 'auto (CV로 선택)' }, { v: 'rf', t: 'rf' }, { v: 'ridge', t: 'ridge' }, { v: 'xgboost', t: 'xgboost' }, { v: 'lightgbm', t: 'lightgbm' }, { v: 'ensemble', t: 'ensemble' }],
  },
  surrogate_triage_comparator_models: { k: 'surrogate_triage_comparator_models', label: '비교할 모델', kind: 'checks', note: '기본 rf, ridge, lightgbm, xgboost 전체 선택', opts: MODEL_CHOICES },
  surrogate_triage_ensemble_models: { k: 'surrogate_triage_ensemble_models', label: '선택적 랭크 앙상블', kind: 'checks', note: '기본 선택 없음', opts: MODEL_CHOICES },
  surrogate_triage_cv_folds: { k: 'surrogate_triage_cv_folds', label: 'CV Folds', kind: 'num', note: '기본 5', min: 2, step: 1 },
  af2_plddt_cutoff: { k: 'af2_plddt_cutoff', label: 'pLDDT 컷오프', kind: 'num', note: '기본 85, 범위 0~100', min: 0, max: 100, step: 0.1 },
  af2_rmsd_cutoff: { k: 'af2_rmsd_cutoff', label: 'RMSD 컷오프', kind: 'num', note: '기본 2.0 Å, 최소 0.01', min: 0.01, step: 0.001 },
  compare_rmsd_scope: {
    k: 'compare_rmsd_scope', label: 'RMSD 비교 범위', kind: 'select', note: '기본 off, 화면 표시 전용',
    opts: [{ v: 'off', t: 'Off' }, { v: 'input', t: '입력 구조만' }, { v: 'backbone', t: '백본만' }, { v: 'both', t: '입력 + 백본' }],
  },
  relax_enabled: { k: 'relax_enabled', label: 'Rosetta Relax', kind: 'bool', note: '기본 true', opts: onoff('사용', '미사용') },
  relax_score_per_residue_cutoff: { k: 'relax_score_per_residue_cutoff', label: 'Relax 잔기당 스코어 컷오프', kind: 'num', note: '비우면 미적용', step: 0.1 },
  novelty_enabled: { k: 'novelty_enabled', label: 'WT Diff', kind: 'bool', note: '기본 true', opts: onoff('사용', '미사용') },
  af2_provider: { k: 'af2_provider', label: '구조 예측기', kind: 'select', note: '기본 colabfold', opts: [{ v: 'colabfold', t: 'ColabFold (기본)' }, { v: 'alphafold2', t: 'AlphaFold2' }] },
  rfd3_max_return_designs: { k: 'rfd3_max_return_designs', label: 'RFD3 반환 개수', kind: 'num', note: '기본 10', min: 1, step: 1 },
  rfd3_target_rmsd_cutoff: { k: 'rfd3_target_rmsd_cutoff', label: 'RFD3 입력 백본 RMSD 상한', kind: 'num', note: '기본 2.0 Å', min: 0, step: 0.1 },
  rfd3_input_pdb: { k: 'rfd3_input_pdb', label: 'RFD3 입력 PDB', kind: 'textarea', rows: 3, note: '선택 입력, 타깃이 PDB면 자동 숨김', ph: 'PDB 원문 또는 경로' },
  rfd3_mode: {
    k: 'rfd3_mode', label: 'RFD3 모드', kind: 'select', note: '기본 local_diversify',
    opts: [{ v: 'local_diversify', t: 'Local Diversify' }, { v: 'legacy_contig', t: 'Legacy Contig' }, { v: 'binder', t: 'Binder' }, { v: 'enzyme', t: 'Enzyme' }, { v: 'advanced', t: 'Advanced' }],
  },
  rfd3_contig: { k: 'rfd3_contig', label: 'RFD3 Contig', kind: 'text', note: 'PDB의 양수 번호 단백질 잔기에서 추천', ph: 'A1-221' },
  rfd3_hotspots: { k: 'rfd3_hotspots', label: 'RFD3 hotspots', kind: 'text', note: 'Binder 모드 입력', ph: 'A59, A62, A68' },
  rfd3_infer_ori_strategy: { k: 'rfd3_infer_ori_strategy', label: 'RFD3 방향 추정', kind: 'text', note: '기본 global', ph: 'global' },
  rfd3_is_non_loopy: { k: 'rfd3_is_non_loopy', label: 'RFD3 non-loopy', kind: 'bool', note: '기본 미사용', opts: onoff('사용', '미사용') },
  rfd3_unindex: { k: 'rfd3_unindex', label: 'RFD3 unindex', kind: 'text', note: '제외 구간', ph: 'A45-60' },
  rfd3_length: { k: 'rfd3_length', label: 'RFD3 length', kind: 'text', note: '생성 길이 범위', ph: '20-40' },
  rfd3_select_fixed_atoms: { k: 'rfd3_select_fixed_atoms', label: 'RFD3 고정 원자', kind: 'textarea', rows: 3, note: '다중 행 입력', ph: 'A57:CA,A57:CB' },
  rfd3_partial_t: { k: 'rfd3_partial_t', label: 'RFD3 partial_t', kind: 'num', note: '기본 5.0 (노이즈 스케일)', min: 0, step: 0.5 },
  rfd3_inputs_text: { k: 'rfd3_inputs_text', label: 'RFD3 고급 입력', kind: 'textarea', rows: 4, note: 'JSON / YAML 다중 행', ph: '{ "contigmap": { "contigs": ["A1-221"] } }' },
  rfd3_use_ensemble: { k: 'rfd3_use_ensemble', label: 'RFD3 앙상블 사용', kind: 'bool', note: '기본 미사용', opts: onoff('사용', '미사용') },
  rfd3_design_index: { k: 'rfd3_design_index', label: 'RFD3 design_index', kind: 'text', note: '특정 설계 인덱스만 사용', ph: '0,2,5' },
  rfd3_cli_args: { k: 'rfd3_cli_args', label: 'RFD3 CLI 인자', kind: 'text', note: '추가 실행 인자', ph: '--diffuser.T 50' },
  rfd3_env: { k: 'rfd3_env', label: 'RFD3 환경변수', kind: 'text', note: 'KEY=VALUE 쉼표 구분', ph: 'CUDA_VISIBLE_DEVICES=0' },
  rfd3_ligand: { k: 'rfd3_ligand', label: 'RFD3 리간드', kind: 'text', note: 'Enzyme 모드 리간드 코드', ph: 'LIG' },
  soluprot_cutoff: { k: 'soluprot_cutoff', label: 'SoluProt 컷오프', kind: 'num', note: '기본 0.5, 범위 0~1', min: 0, max: 1, step: 0.01 },
  diffdock_ligand: { k: 'diffdock_ligand', label: 'DiffDock 리간드', kind: 'textarea', rows: 3, note: 'SMILES 또는 SDF', ph: 'CC(=O)Oc1ccccc1C(=O)O' },
  diffdock_extra_args: { k: 'diffdock_extra_args', label: 'DiffDock 추가 인자', kind: 'text', note: '선택 입력', ph: '--inference_steps 20' },
  fixed_positions_extra: { k: 'fixed_positions_extra', label: '고정 잔기 (추가)', kind: 'textarea', rows: 3, note: 'A:6,10;*:120 또는 JSON', ph: 'A:6,10;*:120' },
  ligand_mask_use_original_target: { k: 'ligand_mask_use_original_target', label: '원본 리간드 마스크 보존', kind: 'select', note: '기본 원본 보존', opts: [{ v: 'true', t: '원본 마스크 보존' }, { v: 'false', t: '백본 기준 마스크 사용' }] },
  ligand_mask_distance: { k: 'ligand_mask_distance', label: '리간드 마스크 거리 (Å)', kind: 'num', note: '리간드 주변 고정 반경', min: 0, step: 0.5 },
  ligand_resnames: { k: 'ligand_resnames', label: '리간드 resname', kind: 'text', note: '쉼표 구분', ph: 'HEM, NAD' },
  ligand_atom_chains: { k: 'ligand_atom_chains', label: '리간드 원자 체인', kind: 'text', note: '쉼표 구분', ph: 'A, B' },
  evolution_mode: { k: 'evolution_mode', label: '진화 탐색 사용', kind: 'bool', note: '기본 false', opts: onoff('사용', '미사용') },
  evolution_label_source: { k: 'evolution_label_source', label: '후보 선택 기준', kind: 'select', note: '기본 experimental', opts: [{ v: 'experimental', t: '실험 측정값 사용' }, { v: 'af2', t: 'AF2 스코어로 테스트' }] },
  evolution_objective_metric: { k: 'evolution_objective_metric', label: '최적화 지표', kind: 'select', note: '기본 activity', opts: [{ v: 'activity', t: 'activity' }, { v: 'tm', t: 'Tm' }, { v: 'expression', t: 'expression' }, { v: 'solubility', t: 'solubility' }] },
  evolution_experiment_source_run_id: { k: 'evolution_experiment_source_run_id', label: '측정값이 있는 이전 실행', kind: 'text', note: '기본 비어 있음', ph: 'run_0412' },
  evolution_pool_size: { k: 'evolution_pool_size', label: '후보 풀 크기', kind: 'num', note: '기본 1000', min: 1, step: 10 },
  evolution_initial_samples: { k: 'evolution_initial_samples', label: '첫 테스트 세트 크기', kind: 'num', note: '기본 30', min: 1, step: 1 },
  evolution_oracle_samples: { k: 'evolution_oracle_samples', label: '최종 검증 후보 수', kind: 'num', note: '기본 20', min: 1, step: 1 },
  evolution_rounds: { k: 'evolution_rounds', label: '탐색 반복 횟수', kind: 'num', note: '기본 3', min: 1, step: 1 },
  evolution_samples_per_round: { k: 'evolution_samples_per_round', label: '반복당 후보 수', kind: 'num', note: '기본 5', min: 1, step: 1 },
  confirm_run: { k: 'confirm_run', label: '실행 확인', kind: 'select', req: true, note: '필수', opts: [{ v: 'true', t: '예, 실행합니다' }, { v: 'false', t: '먼저 검토합니다' }] },
  dry_run: { k: 'dry_run', label: 'Dry Run', kind: 'bool', note: '실제 작업 없이 계획만 생성', opts: onoff('사용', '미사용') },
  force: { k: 'force', label: '강제 실행', kind: 'bool', note: '차단 이슈 무시', opts: onoff('사용', '미사용') },
  agent_panel_enabled: { k: 'agent_panel_enabled', label: 'Agent Panel 사용', kind: 'bool', note: '기본 사용', opts: onoff('사용', '미사용') },
  auto_recover: { k: 'auto_recover', label: '자동 복구', kind: 'bool', note: '실패 단계 자동 재시도', opts: onoff('사용', '미사용') },
  mmseqs_use_gpu: { k: 'mmseqs_use_gpu', label: 'MMseqs2 GPU 사용', kind: 'bool', note: '기본 사용', opts: onoff('사용', '미사용') },
  mmseqs_max_seqs: { k: 'mmseqs_max_seqs', label: 'MMseqs2 최대 서열 수', kind: 'num', note: '기본 10000', min: 1, step: 100 },
  mmseqs_threads: { k: 'mmseqs_threads', label: 'MMseqs2 스레드', kind: 'num', note: '기본 8', min: 1, step: 1 },
  msa_min_coverage: { k: 'msa_min_coverage', label: 'MSA 최소 커버리지', kind: 'num', note: '0~1', min: 0, max: 1, step: 0.01 },
  msa_min_identity: { k: 'msa_min_identity', label: 'MSA 최소 identity', kind: 'num', note: '0~1', min: 0, max: 1, step: 0.01 },
  query_pdb_min_identity: { k: 'query_pdb_min_identity', label: '질의 PDB 최소 identity', kind: 'num', note: '0~1', min: 0, max: 1, step: 0.01 },
  conservation_tiers: { k: 'conservation_tiers', label: '보존도 tier 정의', kind: 'text', note: '쉼표 구분 백분위', ph: '0.3, 0.5, 0.7' },
  conservation_cluster_identity: { k: 'conservation_cluster_identity', label: '보존도 클러스터 identity', kind: 'num', note: '0~1', min: 0, max: 1, step: 0.01 },
  conservation_cluster_coverage: { k: 'conservation_cluster_coverage', label: '보존도 클러스터 커버리지', kind: 'num', note: '0~1', min: 0, max: 1, step: 0.01 },
  af2_top_k: { k: 'af2_top_k', label: 'AF2 Top K', kind: 'num', note: '0은 전체', min: 0, step: 1 },
  af2_sequence_ids: { k: 'af2_sequence_ids', label: 'AF2 대상 서열 ID', kind: 'text', note: '쉼표 구분', ph: 'cand_0007, cand_0019' },
  af2_extra_flags: { k: 'af2_extra_flags', label: 'AF2 추가 플래그', kind: 'text', note: '선택 입력', ph: '--num-recycle 6' },
  sampling_temp: { k: 'sampling_temp', label: 'ProteinMPNN sampling_temp', kind: 'num', note: '기본 0.1', min: 0, step: 0.01 },
  seed: { k: 'seed', label: '랜덤 시드', kind: 'num', note: '재현용 시드', min: 0, step: 1 },
  batch_size: { k: 'batch_size', label: '배치 크기', kind: 'num', note: '기본 8', min: 1, step: 1 },
}

export const DEFAULT_ANSWERS: Record<string, AnswerVal> = {
  run_mode: 'pipeline',
  standalone_stage: 'rfd3',
  target_input: '',
  start_from: 'msa',
  stop_after: 'novelty',
  design_chains: 'all',
  pdb_strip_nonpositive_resseq: 'true',
  pdb_renumber_resseq_from_1: false,
  wt_compare: true,
  mask_consensus_apply: false,
  bioemu_use: true,
  rfd3_use: true,
  backbone_filter_use_dssp: true,
  bioemu_num_samples: 20,
  bioemu_max_return_structures: 10,
  bioemu_target_rmsd_cutoff: 2.0,
  bioemu_filter_samples: true,
  bioemu_steering_config_text: '',
  num_seq_per_tier: 2,
  selected_tiers: ['0.3', '0.5', '0.7'],
  af2_max_candidates_per_tier: 0,
  surrogate_triage_enabled: false,
  surrogate_triage_scope: 'pooled_tiers',
  surrogate_triage_initial_samples: 30,
  surrogate_triage_top_k: 20,
  surrogate_triage_model: 'auto',
  surrogate_triage_comparator_models: ['rf', 'ridge', 'lightgbm', 'xgboost'],
  surrogate_triage_ensemble_models: [],
  surrogate_triage_cv_folds: 5,
  af2_plddt_cutoff: 85,
  af2_rmsd_cutoff: 2.0,
  compare_rmsd_scope: 'off',
  relax_enabled: true,
  relax_score_per_residue_cutoff: '',
  novelty_enabled: true,
  af2_provider: 'colabfold',
  rfd3_max_return_designs: 10,
  rfd3_target_rmsd_cutoff: 2.0,
  rfd3_input_pdb: '',
  rfd3_mode: 'local_diversify',
  rfd3_contig: '',
  rfd3_hotspots: '',
  rfd3_infer_ori_strategy: '',
  rfd3_is_non_loopy: false,
  rfd3_unindex: '',
  rfd3_length: '',
  rfd3_select_fixed_atoms: '',
  rfd3_partial_t: 5.0,
  rfd3_inputs_text: '',
  rfd3_use_ensemble: false,
  rfd3_design_index: '',
  rfd3_cli_args: '',
  rfd3_env: '',
  rfd3_ligand: '',
  soluprot_cutoff: 0.5,
  diffdock_ligand: '',
  diffdock_extra_args: '',
  fixed_positions_extra: '',
  ligand_mask_use_original_target: 'true',
  ligand_mask_distance: 5,
  ligand_resnames: '',
  ligand_atom_chains: '',
  evolution_mode: false,
  evolution_label_source: 'experimental',
  evolution_objective_metric: 'activity',
  evolution_experiment_source_run_id: '',
  evolution_pool_size: 1000,
  evolution_initial_samples: 30,
  evolution_oracle_samples: 20,
  evolution_rounds: 3,
  evolution_samples_per_round: 5,
  confirm_run: 'false',
  dry_run: false,
  force: false,
  agent_panel_enabled: true,
  auto_recover: true,
  mmseqs_use_gpu: true,
  mmseqs_max_seqs: 10000,
  mmseqs_threads: 8,
  msa_min_coverage: 0.5,
  msa_min_identity: 0.3,
  query_pdb_min_identity: 0.9,
  conservation_tiers: '0.3, 0.5, 0.7',
  conservation_cluster_identity: 0.5,
  conservation_cluster_coverage: 0.8,
  af2_top_k: 0,
  af2_sequence_ids: '',
  af2_extra_flags: '',
  sampling_temp: 0.1,
  seed: 42,
  batch_size: 8,
}

/* §4 Surrogate 프리셋이 덮어쓰는 값 */
export const SURROGATE_PRESET: Record<string, AnswerVal> = {
  run_mode: 'surrogate',
  surrogate_triage_enabled: true,
  surrogate_triage_scope: 'pooled_tiers',
  surrogate_triage_initial_samples: 30,
  surrogate_triage_top_k: 20,
  surrogate_triage_model: 'auto',
  surrogate_triage_comparator_models: ['rf', 'ridge', 'lightgbm', 'xgboost'],
  surrogate_triage_ensemble_models: [],
  surrogate_triage_cv_folds: 5,
  num_seq_per_tier: 3333,
  af2_max_candidates_per_tier: 0,
  rfd3_use: false,
  bioemu_use: false,
  soluprot_cutoff: 0.5,
  af2_plddt_cutoff: 85,
  af2_rmsd_cutoff: 2.0,
}

/* ---------------- 단계 그룹 (§3.6) ---------------- */
export const STEP_LABELS = ['입력', '워크플로', '기준', '전문가', '검토']
export const STEP_HEADLINES = [
  '타깃을 먼저 추가하세요',
  '워크플로 경로를 선택하세요',
  '후보 기준을 설정하세요',
  '전문가 재정의',
  '검토 후 실행',
]

/* ---------------- 사전 점검 목업 ---------------- */
export const PREFLIGHT_WARNINGS = [
  'MSA 깊이(Neff 112)가 권장값 128 미만입니다. 보존도 tier 경계가 불안정할 수 있습니다.',
  'colabfold-a100 큐에 6건이 대기 중입니다. af2 단계 시작이 지연될 수 있습니다.',
  'BioEmu 반환 개수(10)가 생성 개수(20)의 절반입니다. 필터 통과율을 확인하세요.',
]
export const PREFLIGHT_OK = [
  '모델 7종 운영 상태 정상 (ProteinMPNN, RFD3, BioEmu, SoluProt, ColabFold, SoluProt-ESM, Rosetta)',
  '아티팩트 저장소 여유 2.1 TB',
  '실행 및 보고서 생성 권한 보유',
]

/* ---------------- 자연어 설정 제안 (plan_from_prompt) ---------------- */
export const PLAN_QUESTIONS: { k: string; label: string; suggest: string; reason: string }[] = [
  { k: 'selected_tiers', label: '서열 보존율', suggest: '30 / 50 %', reason: '"보존도가 낮은 구간을 넓게 탐색" 문구에서 추정' },
  { k: 'num_seq_per_tier', label: '백본당 ProteinMPNN 서열 수', suggest: '4', reason: '"후보를 넉넉히" 문구에서 추정' },
  { k: 'af2_plddt_cutoff', label: 'pLDDT 컷오프', suggest: '88', reason: '"구조 신뢰도를 높게" 문구에서 추정' },
  { k: 'relax_enabled', label: 'Rosetta Relax', suggest: '사용', reason: '열안정화 목적 기본값' },
  { k: 'stop_after', label: '중단 단계', suggest: 'af2', reason: '"구조 검증까지" 문구에서 추정' },
]

/* ---------------- 활동 로그 목업 ---------------- */
export const LOG_SEED = [
  { t: '09:12:04', c: 't', m: '고급 설정 화면을 열었습니다.' },
  { t: '09:12:06', c: 't', m: '실행 목록 8건을 불러왔습니다.' },
  { t: '09:12:18', c: 'o', m: '기본 프리셋 적용: mode=pipeline, start_from=msa, stop_after=novelty' },
]

/* ---------------- Residue Picker ---------------- */
export const PICKER_SOURCES = [
  { v: 'uploaded', t: '업로드한 PDB 불러오기' },
  { v: 'rfd3_seed', t: 'RFD3 시드 PDB 불러오기' },
  { v: 'run', t: '선택한 실행의 PDB 불러오기' },
  { v: 'fasta', t: 'FASTA에서 구조 예측' },
]

export const AA_GROUPS: { name: string; aas: string; bg: string; fg: string }[] = [
  { name: '소수성', aas: 'AVLIMC', bg: '#fef3c7', fg: '#92400e' },
  { name: '극성', aas: 'STNQ', bg: '#dcfce7', fg: '#166534' },
  { name: '양전하', aas: 'KRH', bg: '#dbeafe', fg: '#1e40af' },
  { name: '음전하', aas: 'DE', bg: '#fee2e2', fg: '#991b1b' },
  { name: '방향족', aas: 'FWY', bg: '#ede9fe', fg: '#5b21b6' },
  { name: '특수', aas: 'GP', bg: '#f4f4f5', fg: '#52525b' },
]

export function aaStyle(ch: string) {
  const g = AA_GROUPS.find(x => x.aas.includes(ch))
  return g ? { background: g.bg, color: g.fg } : { background: '#fafafa', color: '#52525b' }
}

export const AA3: Record<string, string> = {
  A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS', Q: 'GLN', E: 'GLU', G: 'GLY',
  H: 'HIS', I: 'ILE', L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO', S: 'SER',
  T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL',
}
