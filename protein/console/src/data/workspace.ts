/* 프로젝트 · 라운드 워크스페이스 목업 데이터 (Projects 화면 전용) */

export type RoundStatus = 'planned' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived'
export type ProjectStatus = 'active' | 'archived'

export const ROUND_STATUS: { key: RoundStatus; label: string; cls: string }[] = [
  { key: 'planned', label: '계획', cls: '' },
  { key: 'running', label: '실행중', cls: 'run' },
  { key: 'completed', label: '완료', cls: 'ok' },
  { key: 'failed', label: '실패', cls: 'err' },
  { key: 'cancelled', label: '취소', cls: 'warn' },
  { key: 'archived', label: '보관', cls: '' },
]

export interface WsRun {
  id: string
  stage: string
  state: 'done' | 'running' | 'gate' | 'queued' | 'failed'
  candidates: number
  created: string
}

/* 라운드 안에서 사람이 맡아 처리하는 할 일 (SFR-018 태스크).
   실행은 계산이고 태스크는 사람의 작업이라, 실행이 없는 태스크도 있다. */
export type WsTaskState = 'todo' | 'doing' | 'review' | 'done'

export const TASK_STATE: { key: WsTaskState; label: string; cls: string }[] = [
  { key: 'todo', label: '대기', cls: '' },
  { key: 'doing', label: '진행', cls: 'run' },
  { key: 'review', label: '검토', cls: 'warn' },
  { key: 'done', label: '완료', cls: 'ok' },
]

export interface WsTask {
  id: string
  title: string
  owner: string
  state: WsTaskState
  due: string
  /* 이 태스크로 돌린 실행. 없으면 실험실 작업이나 검토 같은 비계산 작업이다. */
  run?: string
  note: string
}

export interface WsRound {
  id: string
  projectId: string
  title: string
  status: RoundStatus
  goal: string
  hypothesis: string
  notes: string
  selected: string
  expSummary: string
  reportSummary: string
  nextNotes: string
  suggestion: string
  updated: string
  runs: WsRun[]
  tasks: WsTask[]
}

export interface WsProject {
  id: string
  name: string
  status: ProjectStatus
  desc: string
  owner: string
  updated: string
  /* 프로젝트 단위 조회 권한. 공개 범위와 구성원으로 누가 볼 수 있는지 정한다. */
  visibility?: 'project' | 'org'
  members?: WsMember[]
  /* 프로젝트 기본 기준값. 새 실행을 만들 때 초기값으로 채워진다. */
  defaults?: { soluprot: number; plddt: number; rmsd: number; tiers: string }
}

/* 프로젝트 안에서의 권한. 시스템 역할과 별개로 프로젝트마다 따로 가진다.
   실제 가능한 동작은 시스템 역할과 프로젝트 권한의 교집합이다. */
export type WsMemberRole = '소유자' | '편집' | '조회'
export type WsMemberStatus = 'active' | 'invited'

export interface WsMember {
  name: string
  account: string
  role: WsMemberRole
  status: WsMemberStatus
  joined: string
  lastSeen?: string
}

export const MEMBER_ROLES: WsMemberRole[] = ['소유자', '편집', '조회']

export const MEMBER_ROLE_DESC: Record<WsMemberRole, string> = {
  소유자: '구성원 관리, 설정 변경, 삭제까지 모두 가능합니다.',
  편집: '실행과 라운드 기록, 보고서 작성이 가능합니다.',
  조회: '결과와 산출물을 보고 내려받을 수 있습니다.',
}

export const WS_PROJECTS: WsProject[] = [
  {
    id: 'prj_gfp', name: 'GFP 열안정성 개량', status: 'active',
    desc: '형광단백질 GFP의 Tm 상승을 목표로 하는 다회차 설계 과제', owner: '김연구', updated: '2026-10-05',
    visibility: 'project',
    members: [
      { name: '김연구', account: 'hana.kim', role: '소유자', status: 'active', joined: '2026-02-11', lastSeen: '2026-10-06 09:42' },
      { name: '이박사', account: 'jiwon.park', role: '편집', status: 'active', joined: '2026-03-02', lastSeen: '2026-10-05 17:20' },
      { name: '박연구', account: 'dohyun.seo', role: '편집', status: 'active', joined: '2026-06-14', lastSeen: '2026-10-04 11:08' },
      { name: '최열람', account: 'sehun.choi', role: '조회', status: 'active', joined: '2026-04-19', lastSeen: '2026-09-30 14:55' },
      { name: '정민지', account: 'minji.lee', role: '조회', status: 'invited', joined: '2026-10-05' },
    ],
    defaults: { soluprot: 0.6, plddt: 85, rmsd: 2, tiers: '30 · 50 · 70' },
  },
  { id: 'prj_pdl1', name: 'PD-L1 결합 미니바인더', status: 'active', desc: 'PD-L1(4ZQK) 표면 결합 미니바인더 de novo 설계', owner: '이박사', updated: '2026-10-04' },
  { id: 'prj_lip', name: '리파아제 활성 개량', status: 'active', desc: '산업용 리파아제의 비활성도 개선 및 용해도 동시 최적화', owner: '박연구', updated: '2026-09-29' },
  { id: 'prj_cath', name: 'CATH 벤치마크 재현', status: 'active', desc: '73-실행 CATH 코퍼스 재현 및 지표 비교', owner: '최운영', updated: '2026-09-18' },
  { id: 'prj_amy', name: '아밀라아제 내열화 (2025)', status: 'archived', desc: '2025년도 과제, 보고서 제출 완료 후 보관', owner: '김연구', updated: '2026-06-30' },
]

export const WS_ROUNDS: WsRound[] = [
  {
    id: 'rnd_gfp_1', projectId: 'prj_gfp', title: 'Round 1 · tier30 파일럿', status: 'completed',
    goal: 'conservation tier 0.3 단독 조건에서 통과율 기준선 확보',
    hypothesis: '보존도가 낮은 영역만 변이하면 SoluProt 통과율이 60% 이상 유지된다',
    notes: 'MSA는 uniref90, max_seqs 3000으로 고정. RFD3 미사용.',
    selected: 'cand_002, cand_007, cand_019 (자동 선정, pLDDT 상위)',
    expSummary: '측정 3건 · 성공 2건 · 평균 Tm 64.8℃ (자동 집계)',
    reportSummary: 'tier30 단독은 통과율 58%, 구조 유사도는 유지되나 Tm 상승 폭이 작음',
    nextNotes: 'tier50을 병행해 변이 폭을 넓힐 것',
    suggestion: 'num_seq_per_tier를 16에서 24로 올려 후보 다양성 확보 권장',
    updated: '2026-09-24',
    runs: [
      { id: 'run_0405', stage: 'novelty', state: 'done', candidates: 96, created: '2026-09-20 09:12' },
      { id: 'run_0409', stage: 'novelty', state: 'done', candidates: 112, created: '2026-09-22 14:40' },
    ],
    tasks: [
      { id: 'tsk_01', title: 'tier30 파일럿 설정 검토', owner: '김연구', state: 'done', due: '2026-09-18', run: 'run_0401', note: '보존율 30% 단독으로 통과율 확인' },
      { id: 'tsk_02', title: '상위 후보 20건 발현 의뢰', owner: '박연구', state: 'done', due: '2026-09-22', note: '실험실 전달 완료' },
      { id: 'tsk_03', title: '라운드 보고서 작성', owner: '김연구', state: 'done', due: '2026-09-24', note: '국문 보고서 v1' },
    ],
  },
  {
    id: 'rnd_gfp_2', projectId: 'prj_gfp', title: 'Round 2 · tier30+50 조합', status: 'completed',
    goal: '변이 폭을 넓혀 Tm 상승 후보를 2건 이상 확보',
    hypothesis: 'tier30과 tier50을 함께 쓰면 상위 후보의 Tm 분포가 상향 이동한다',
    notes: 'run_0409에서 fork. SoluProt cutoff 0.55로 완화.',
    selected: 'cand_014, cand_003, cand_027 (자동 선정)',
    expSummary: '측정 8건 · 성공 5건 · 최고 Tm 68.2℃ (WT 61.4℃) (자동 집계)',
    reportSummary: 'cand_014 / cand_003 모두 WT 대비 +5℃ 이상, 발현량은 WT의 0.9배 수준',
    nextNotes: 'tier70 단독 조건과 비교군을 만들어 한계를 확인',
    suggestion: '실험값 8건이 축적되어 surrogate 학습 가능, 대리모델 선별 사용 권장',
    updated: '2026-10-01',
    runs: [
      { id: 'run_0412', stage: 'novelty', state: 'done', candidates: 128, created: '2026-09-28 10:05' },
      { id: 'run_0414', stage: 'af2', state: 'done', candidates: 64, created: '2026-09-29 16:22' },
    ],
    tasks: [
      { id: 'tsk_01', title: 'tier30+50 조합 실행', owner: '김연구', state: 'done', due: '2026-09-28', run: 'run_0410', note: '조합 비교군 확보' },
      { id: 'tsk_02', title: '용해도 측정값 입력', owner: '박연구', state: 'done', due: '2026-10-01', note: '측정 12건 입력' },
      { id: 'tsk_03', title: '조합 효과 분석', owner: '이박사', state: 'done', due: '2026-10-01', note: 'tier50 단독보다 통과율 높음' },
    ],
  },
  {
    id: 'rnd_gfp_3', projectId: 'prj_gfp', title: 'Round 3 · tier70 비교군', status: 'running',
    goal: 'tier70 단독 조건의 통과율과 구조 보존 한계 측정',
    hypothesis: '보존도 0.7 이상 영역까지 변이하면 통과율이 급격히 떨어진다',
    notes: 'run_0412에서 fork. af2_plddt_cutoff 85 유지.',
    selected: '선정 대기 (연결된 실행 결과에서 자동 수집)',
    expSummary: '측정 기록 없음 (연결된 결과·실험 데이터에서 자동 집계)',
    reportSummary: '보고서 또는 연결 실행 요약이 아직 없습니다.',
    nextNotes: '',
    suggestion: '라운드 단위 학습이 활성화되면 모델 제안이 표시됩니다.',
    updated: '2026-10-05',
    runs: [
      { id: 'run_0418', stage: 'af2', state: 'done', candidates: 88, created: '2026-10-03 09:40' },
      { id: 'run_0421', stage: 'af2', state: 'gate', candidates: 72, created: '2026-10-05 11:18' },
      { id: 'run_0423', stage: 'design', state: 'running', candidates: 0, created: '2026-10-06 08:02' },
    ],
    tasks: [
      { id: 'tsk_01', title: 'tier70 비교군 실행', owner: '김연구', state: 'done', due: '2026-10-03', run: 'run_0418', note: '완료' },
      { id: 'tsk_02', title: '검토 지점 통과 판단', owner: '이박사', state: 'doing', due: '2026-10-06', run: 'run_0421', note: 'SoluProt 통과율 확인 중' },
      { id: 'tsk_03', title: '설계 재실행 (고정 잔기 조정)', owner: '김연구', state: 'doing', due: '2026-10-07', run: 'run_0423', note: '활성 부위 고정 추가' },
      { id: 'tsk_04', title: '상위 후보 선정', owner: '김연구', state: 'todo', due: '2026-10-09', note: '구조 예측 결과 대기' },
    ],
  },
  {
    id: 'rnd_gfp_4', projectId: 'prj_gfp', title: 'Round 4 · 측정값 기반 재설계', status: 'planned',
    goal: '실험값 8건을 라벨로 써서 surrogate 기반 추천 20건 생성',
    hypothesis: 'ESM 임베딩 + 실험 라벨 surrogate가 무작위 선택보다 적중률이 높다',
    notes: 'label_source=experimental, objective_metric=activity',
    selected: '선정 대기 (연결된 실행 결과에서 자동 수집)',
    expSummary: '측정 기록 없음 (연결된 결과·실험 데이터에서 자동 집계)',
    reportSummary: '보고서 또는 연결 실행 요약이 아직 없습니다.',
    nextNotes: '추천 후보는 발현 우선순위로 실험실에 전달',
    suggestion: '라운드 단위 학습이 활성화되면 모델 제안이 표시됩니다.',
    updated: '2026-10-06',
    runs: [],
    tasks: [
      { id: 'tsk_01', title: '이전 라운드 측정값 정리', owner: '박연구', state: 'doing', due: '2026-10-08', note: '실험값 8건 정리' },
      { id: 'tsk_02', title: '대리모델 선별 설정', owner: '김연구', state: 'todo', due: '2026-10-09', note: '예산 분류 기준 정하기' },
      { id: 'tsk_03', title: '추천 후보 발현 의뢰', owner: '박연구', state: 'todo', due: '2026-10-14', note: '추천 20건 전달 예정' },
    ],
  },
  {
    id: 'rnd_gfp_0', projectId: 'prj_gfp', title: 'Round 0 · 폐기된 사전 실험', status: 'archived',
    goal: '입력 PDB 정제 절차 점검',
    hypothesis: 'resseq 음수 잔기 제거만으로 MSA 단계 실패가 사라진다',
    notes: '보관됨. 연결된 실행 출력물은 디스크에 그대로 남아 있습니다.',
    selected: '-',
    expSummary: '측정 기록 없음',
    reportSummary: '보고서 또는 연결 실행 요약이 아직 없습니다.',
    nextNotes: '',
    suggestion: '-',
    updated: '2026-09-12',
    runs: [{ id: 'run_0388', stage: 'msa', state: 'failed', candidates: 0, created: '2026-09-10 13:30' }],
    tasks: [
      { id: 'tsk_01', title: '사전 실험 결과 정리', owner: '김연구', state: 'done', due: '2026-09-12', note: '폐기 결정, 기록만 보관' },
    ],
  },
  {
    id: 'rnd_pdl1_1', projectId: 'prj_pdl1', title: 'Round 1 · RFD3 스캐폴드 탐색', status: 'completed',
    goal: 'hotspot 3개 기준 미니바인더 스캐폴드 200개 생성 및 선별',
    hypothesis: 'partial_t 5.0에서 생성한 스캐폴드가 입력 백본 RMSD 2.0 이내로 수렴한다',
    notes: 'rfd3_contig A1-120/0 60-80, hotspots A:56,58,121',
    selected: 'cand_041, cand_058 (자동 선정)',
    expSummary: '측정 2건 · 성공 1건 · Kd 180 nM (자동 집계)',
    reportSummary: 'RFD3 통과 112/200, ProteinMPNN 이후 AF2 pLDDT 85 이상 34건',
    nextNotes: 'BioEmu 샘플링으로 유연 영역 확인 필요',
    suggestion: 'rfd3_max_return_designs를 10에서 20으로 확대 검토',
    updated: '2026-10-02',
    runs: [
      { id: 'run_0430', stage: 'novelty', state: 'done', candidates: 200, created: '2026-09-30 10:00' },
      { id: 'run_0433', stage: 'novelty', state: 'done', candidates: 112, created: '2026-10-01 15:35' },
    ],
    tasks: [
      { id: 'tsk_01', title: 'RFD3 스캐폴드 탐색', owner: '이박사', state: 'done', due: '2026-09-30', run: 'run_0430', note: '스캐폴드 24종 확보' },
      { id: 'tsk_02', title: '결합 예측 실행', owner: '이박사', state: 'done', due: '2026-10-02', run: 'run_0433', note: 'DiffDock 상위 후보 확인' },
      { id: 'tsk_03', title: '핫스팟 재설정 검토', owner: '이박사', state: 'review', due: '2026-10-07', note: '결합 자유에너지 재확인 필요' },
    ],
  },
  {
    id: 'rnd_pdl1_2', projectId: 'prj_pdl1', title: 'Round 2 · BioEmu 앙상블 검증', status: 'failed',
    goal: '선별 스캐폴드의 유연 영역을 BioEmu 20 샘플로 검증',
    hypothesis: '결합 계면 잔기의 RMSF가 2.0 Å 이하로 안정적이다',
    notes: 'steering config 적용 중 JSON 파싱 오류로 중단',
    selected: '-',
    expSummary: '측정 기록 없음',
    reportSummary: 'bioemu 단계 실패, steering_config 키 이름 오류로 추정',
    nextNotes: 'steering config 스키마를 확인한 뒤 신규 실행으로 재시작',
    suggestion: 'bioemu_steering_config_text를 비우고 기본값으로 1회 검증 권장',
    updated: '2026-10-04',
    runs: [{ id: 'run_0441', stage: 'bioemu', state: 'failed', candidates: 0, created: '2026-10-04 09:14' }],
    tasks: [
      { id: 'tsk_01', title: 'BioEmu 앙상블 실행', owner: '이박사', state: 'done', due: '2026-10-04', run: 'run_0441', note: '실패, 입력 백본 RMSD 초과' },
      { id: 'tsk_02', title: '실패 원인 확인', owner: '이박사', state: 'doing', due: '2026-10-07', note: 'RMSD 상한 조정 검토' },
    ],
  },
  {
    id: 'rnd_lip_1', projectId: 'prj_lip', title: 'Round 1 · 기질 포켓 보호 설계', status: 'cancelled',
    goal: 'HETATM 포켓 6.0 Å 마스킹 조건에서 표면 변이만 적용',
    hypothesis: '포켓 보호 시 활성 손실 없이 용해도를 올릴 수 있다',
    notes: '예산 재배정으로 취소. 입력 세트는 보관.',
    selected: '-',
    expSummary: '측정 기록 없음',
    reportSummary: '보고서 또는 연결 실행 요약이 아직 없습니다.',
    nextNotes: '2027년도 과제로 이관 검토',
    suggestion: '-',
    updated: '2026-09-26',
    runs: [{ id: 'run_0399', stage: 'design', state: 'queued', candidates: 0, created: '2026-09-25 17:40' }],
    tasks: [
      { id: 'tsk_01', title: '기질 포켓 보호 설계', owner: '최연구', state: 'done', due: '2026-09-25', run: 'run_0399', note: '큐 대기 중 취소' },
      { id: 'tsk_02', title: '취소 사유 기록', owner: '최연구', state: 'done', due: '2026-09-26', note: 'GPU 예산 재배정' },
    ],
  },
  {
    id: 'rnd_cath_1', projectId: 'prj_cath', title: 'Round 1 · train 서브셋 재현', status: 'running',
    goal: 'CATH train 서브셋 40 타깃을 동일 파라미터로 재실행',
    hypothesis: '파이프라인 변경 이후에도 통과율 지표가 기존 73-실행 코퍼스와 일치한다',
    notes: 'max_workers 2, 에러 시 정지 해제',
    selected: '선정 대기 (연결된 실행 결과에서 자동 수집)',
    expSummary: '측정 기록 없음 (연결된 결과·실험 데이터에서 자동 집계)',
    reportSummary: '중간 집계: 완료 24 / 실패 3 / 실행중 2',
    nextNotes: 'val, test 서브셋은 train 완료 후 순차 실행',
    suggestion: '라운드 단위 학습이 활성화되면 모델 제안이 표시됩니다.',
    updated: '2026-10-06',
    runs: [
      { id: 'run_cath_3rgk', stage: 'novelty', state: 'done', candidates: 48, created: '2026-10-05 20:10' },
      { id: 'run_cath_1lvm', stage: 'af2', state: 'running', candidates: 32, created: '2026-10-06 07:30' },
    ],
    tasks: [
      { id: 'tsk_01', title: 'train 서브셋 재현 실행', owner: '박운영', state: 'doing', due: '2026-10-07', note: '서브셋 3종 중 1종 완료' },
      { id: 'tsk_02', title: '기준값 대비 지표 비교', owner: '박운영', state: 'todo', due: '2026-10-10', note: '원 시스템 결과와 대조' },
    ],
  },
]

/* 실행 계보 (fork 정책 설명용) */
export const WS_LINEAGE: { depth: number; id: string; desc: string; state: string }[] = [
  { depth: 0, id: 'run_0405', desc: 'Round 1 · tier30 파일럿', state: 'done' },
  { depth: 0, id: 'run_0409', desc: 'Round 1 · 탐색', state: 'done' },
  { depth: 1, id: 'run_0412', desc: 'Round 2 · fork(run_0409) · tier30+50', state: 'done' },
  { depth: 2, id: 'run_0418', desc: 'Round 3 · fork(run_0412) · tier70', state: 'done' },
  { depth: 2, id: 'run_0421', desc: 'Round 3 · fork(run_0412) · tier30+50', state: 'gate' },
  { depth: 3, id: 'run_0423', desc: 'Round 3 · fork(run_0421) · design 재실행', state: 'running' },
]

/* 피드백 · 실험 기록 */
export const WS_FEEDBACK: { date: string; who: string; run: string; text: string; kind: string }[] = [
  { date: '2026-10-05', who: '김연구', run: 'run_0421', text: 'tier70은 통과율이 12%로 낮아 다음 라운드에서 제외. tier30·50 조합이 효율적.', kind: '검토 의견' },
  { date: '2026-10-03', who: '김연구', run: 'run_0412', text: 'cand_014, cand_003 발현 성공. Tm 측정값 각 68.2℃, 66.9℃ (WT 61.4℃).', kind: '실험 결과' },
  { date: '2026-10-03', who: '이박사', run: 'run_0412', text: '상위 24개를 결합 예측 입력으로 전달. 표적 4ZQK.', kind: '태스크' },
  { date: '2026-09-30', who: '박연구', run: 'run_0409', text: 'SoluProt 0.6 컷오프는 이 계열에서 다소 엄격. 0.55 시도 권장.', kind: '검토 의견' },
]

/* 파생 데이터셋 추출 이력 */
export const WS_DATASETS: { name: string; rows: string; fmt: string; date: string }[] = [
  { name: 'gfp_rank_v3.jsonl', rows: '21,140', fmt: 'JSONL', date: '2026-10-04' },
  { name: 'gfp_solu_surrogate_v2.parquet', rows: '18,602', fmt: 'Parquet', date: '2026-09-28' },
  { name: 'gfp_exp_labeled_v1.csv', rows: '48', fmt: 'CSV', date: '2026-09-20' },
]

/* ───────────────────────────────────────────────────────────────
   주요 결과물의 버전 이력.
   보고서 · 선정 후보 · 데이터셋은 라운드마다 여러 번 갱신되므로
   버전(v1, v2 ...)으로 쌓아 두고 현행 버전 하나만 표시한다.
   각 버전에는 그 결과를 만든 실행과 재현 정보가 함께 붙는다.
   ─────────────────────────────────────────────────────────────── */

export type WsVerKind = 'report' | 'selection' | 'dataset'

export const WS_VER_KIND_LABEL: Record<WsVerKind, string> = {
  report: '보고서',
  selection: '선정 후보',
  dataset: '데이터셋',
}

/* 실행 재현에 필요한 정보. 같은 입력과 같은 모델 버전으로 다시 돌릴 수 있는지 확인하는 데 쓴다. */
export interface WsRepro {
  runId: string
  models: string[]
  paramHash: string
  inputHash: string
  ranAt: string
  seed: string
}

export interface WsVersion {
  id: string
  roundId: string
  ver: string
  kind: WsVerKind
  summary: string
  by: string
  at: string
  /* 현행 버전 여부. 라운드 · 종류 조합마다 하나만 true 로 둔다. */
  current: boolean
  repro: WsRepro
}

function rp(runId: string, models: string, paramHash: string, inputHash: string, ranAt: string, seed: string): WsRepro {
  return { runId, models: models.split(' | '), paramHash, inputHash, ranAt, seed }
}

const MDL_STAB = 'mmseqs2@15 | proteinmpnn@1.0.1 | soluprot@1.0 | colabfold@1.5.5'
const MDL_STAB_RFD = 'mmseqs2@15 | rfdiffusion3@1.2.0 | proteinmpnn@1.0.1 | soluprot@1.0 | colabfold@1.5.5'
const MDL_BIND = 'rfdiffusion3@1.2.0 | proteinmpnn@1.0.1 | af2-multimer@2.3.2 | diffdock-l@1.1'

export const WS_VERSIONS: WsVersion[] = [
  /* Round 1 · tier30 파일럿 */
  { id: 'v_g1_s1', roundId: 'rnd_gfp_1', ver: 'v1', kind: 'selection', current: false, by: '김연구', at: '2026-09-20 11:40',
    summary: '자동 선정 24건, pLDDT 상위 기준 (run_0405 단독)',
    repro: rp('run_0405', MDL_STAB, 'ph_4c1e8a72', 'in_9d2f0b55', '2026-09-20 09:12', 'seed 20260920') },
  { id: 'v_g1_s2', roundId: 'rnd_gfp_1', ver: 'v2', kind: 'selection', current: true, by: '김연구', at: '2026-09-22 16:05',
    summary: 'cand_002, cand_007, cand_019 확정 (SoluProt 재집계 반영)',
    repro: rp('run_0409', MDL_STAB, 'ph_4c1e8a72', 'in_9d2f0b55', '2026-09-22 14:40', 'seed 20260922') },
  { id: 'v_g1_r1', roundId: 'rnd_gfp_1', ver: 'v1', kind: 'report', current: true, by: '김연구', at: '2026-09-24 10:18',
    summary: 'tier30 단독 통과율 58% 기준선 보고서 (국문)',
    repro: rp('run_0409', MDL_STAB, 'ph_4c1e8a72', 'in_9d2f0b55', '2026-09-22 14:40', 'seed 20260922') },
  { id: 'v_g1_d1', roundId: 'rnd_gfp_1', ver: 'v1', kind: 'dataset', current: true, by: '박연구', at: '2026-09-20 18:02',
    summary: 'gfp_exp_labeled_v1.csv · 48행 · 실험 측정값 포함',
    repro: rp('run_0409', MDL_STAB, 'ph_4c1e8a72', 'in_9d2f0b55', '2026-09-22 14:40', 'seed 20260922') },

  /* Round 2 · tier30+50 조합 */
  { id: 'v_g2_s1', roundId: 'rnd_gfp_2', ver: 'v1', kind: 'selection', current: false, by: '김연구', at: '2026-09-28 13:20',
    summary: '자동 선정 32건, SoluProt cutoff 0.60 기준',
    repro: rp('run_0412', MDL_STAB, 'ph_7b3390de', 'in_9d2f0b55', '2026-09-28 10:05', 'seed 20260928') },
  { id: 'v_g2_s2', roundId: 'rnd_gfp_2', ver: 'v2', kind: 'selection', current: true, by: '김연구', at: '2026-09-29 18:44',
    summary: 'cand_014, cand_003, cand_027 확정 (cutoff 0.55 완화 반영)',
    repro: rp('run_0414', MDL_STAB, 'ph_a05f1c64', 'in_9d2f0b55', '2026-09-29 16:22', 'seed 20260929') },
  { id: 'v_g2_r1', roundId: 'rnd_gfp_2', ver: 'v1', kind: 'report', current: false, by: '김연구', at: '2026-09-29 09:11',
    summary: '중간 보고서, 실험 측정값 3건 반영 상태',
    repro: rp('run_0412', MDL_STAB, 'ph_7b3390de', 'in_9d2f0b55', '2026-09-28 10:05', 'seed 20260928') },
  { id: 'v_g2_r2', roundId: 'rnd_gfp_2', ver: 'v2', kind: 'report', current: true, by: '김연구', at: '2026-10-01 15:36',
    summary: '최종 보고서, 측정 8건 · 최고 Tm 68.2℃ 반영 (국문 · 영문)',
    repro: rp('run_0414', MDL_STAB, 'ph_a05f1c64', 'in_9d2f0b55', '2026-09-29 16:22', 'seed 20260929') },
  { id: 'v_g2_d1', roundId: 'rnd_gfp_2', ver: 'v1', kind: 'dataset', current: false, by: '박연구', at: '2026-09-28 21:30',
    summary: 'gfp_solu_surrogate_v2.parquet · 18,602행 · SoluProt 라벨',
    repro: rp('run_0412', MDL_STAB, 'ph_7b3390de', 'in_9d2f0b55', '2026-09-28 10:05', 'seed 20260928') },
  { id: 'v_g2_d2', roundId: 'rnd_gfp_2', ver: 'v2', kind: 'dataset', current: true, by: '박연구', at: '2026-10-04 11:02',
    summary: 'gfp_rank_v3.jsonl · 21,140행 · 가중 랭킹 점수 포함',
    repro: rp('run_0414', MDL_STAB, 'ph_a05f1c64', 'in_9d2f0b55', '2026-09-29 16:22', 'seed 20260929') },

  /* Round 3 · tier70 비교군 (진행 중) */
  { id: 'v_g3_s1', roundId: 'rnd_gfp_3', ver: 'v1', kind: 'selection', current: false, by: '김연구', at: '2026-10-03 12:05',
    summary: 'tier70 자동 선정 18건, 통과율 12%',
    repro: rp('run_0418', MDL_STAB, 'ph_c81d4f09', 'in_9d2f0b55', '2026-10-03 09:40', 'seed 20261003') },
  { id: 'v_g3_s2', roundId: 'rnd_gfp_3', ver: 'v2', kind: 'selection', current: false, by: '이박사', at: '2026-10-05 13:28',
    summary: 'tier30 · 50 병합 선정 26건 (비교군 포함)',
    repro: rp('run_0421', MDL_STAB, 'ph_e2740a1b', 'in_9d2f0b55', '2026-10-05 11:18', 'seed 20261005') },
  { id: 'v_g3_s3', roundId: 'rnd_gfp_3', ver: 'v3', kind: 'selection', current: true, by: '김연구', at: '2026-10-06 09:14',
    summary: '가중 점수 상위 200개로 축소, af2 진행 대상 확정',
    repro: rp('run_0421', MDL_STAB, 'ph_e2740a1b', 'in_9d2f0b55', '2026-10-05 11:18', 'seed 20261005') },
  { id: 'v_g3_r1', roundId: 'rnd_gfp_3', ver: 'v1', kind: 'report', current: false, by: '김연구', at: '2026-10-04 08:50',
    summary: 'tier70 단독 중간 보고서, 통과율 급감 지적',
    repro: rp('run_0418', MDL_STAB, 'ph_c81d4f09', 'in_9d2f0b55', '2026-10-03 09:40', 'seed 20261003') },
  { id: 'v_g3_r2', roundId: 'rnd_gfp_3', ver: 'v2', kind: 'report', current: true, by: '김연구', at: '2026-10-06 09:46',
    summary: '검토 게이트 의견 반영 보고서, tier70 제외 권고',
    repro: rp('run_0421', MDL_STAB, 'ph_e2740a1b', 'in_9d2f0b55', '2026-10-05 11:18', 'seed 20261005') },
  { id: 'v_g3_d1', roundId: 'rnd_gfp_3', ver: 'v1', kind: 'dataset', current: false, by: '박연구', at: '2026-10-03 19:40',
    summary: 'gfp_tier70_rank_v1.jsonl · 6,820행',
    repro: rp('run_0418', MDL_STAB, 'ph_c81d4f09', 'in_9d2f0b55', '2026-10-03 09:40', 'seed 20261003') },
  { id: 'v_g3_d2', roundId: 'rnd_gfp_3', ver: 'v2', kind: 'dataset', current: true, by: '박연구', at: '2026-10-06 07:55',
    summary: 'gfp_tier_compare_v2.parquet · 11,304행 · tier 비교 라벨',
    repro: rp('run_0423', MDL_STAB_RFD, 'ph_1f66b8c3', 'in_9d2f0b55', '2026-10-06 08:02', 'seed 20261006') },

  /* Round 0 · 폐기된 사전 실험 */
  { id: 'v_g0_r1', roundId: 'rnd_gfp_0', ver: 'v1', kind: 'report', current: true, by: '김연구', at: '2026-09-12 10:02',
    summary: '입력 PDB 정제 절차 점검 메모 (msa 단계 실패 원인 기록)',
    repro: rp('run_0388', 'mmseqs2@15', 'ph_0a9931fe', 'in_55c7d204', '2026-09-10 13:30', 'seed 20260910') },

  /* PD-L1 Round 1 */
  { id: 'v_p1_s1', roundId: 'rnd_pdl1_1', ver: 'v1', kind: 'selection', current: false, by: '이박사', at: '2026-09-30 14:22',
    summary: 'RFD3 통과 112건 중 자동 선정 34건 (pLDDT 85 이상)',
    repro: rp('run_0430', MDL_BIND, 'ph_6b02ad57', 'in_4zqk1a88', '2026-09-30 10:00', 'seed 20260930') },
  { id: 'v_p1_s2', roundId: 'rnd_pdl1_1', ver: 'v2', kind: 'selection', current: true, by: '이박사', at: '2026-10-01 17:10',
    summary: 'cand_041, cand_058 확정 (계면 ipTM 기준 재정렬)',
    repro: rp('run_0433', MDL_BIND, 'ph_6b02ad57', 'in_4zqk1a88', '2026-10-01 15:35', 'seed 20261001') },
  { id: 'v_p1_r1', roundId: 'rnd_pdl1_1', ver: 'v1', kind: 'report', current: false, by: '이박사', at: '2026-10-01 09:35',
    summary: '스캐폴드 탐색 중간 보고서 (RFD3 통과 112/200)',
    repro: rp('run_0430', MDL_BIND, 'ph_6b02ad57', 'in_4zqk1a88', '2026-09-30 10:00', 'seed 20260930') },
  { id: 'v_p1_r2', roundId: 'rnd_pdl1_1', ver: 'v2', kind: 'report', current: true, by: '이박사', at: '2026-10-02 16:48',
    summary: '최종 보고서, Kd 180 nM 측정 결과 반영',
    repro: rp('run_0433', MDL_BIND, 'ph_6b02ad57', 'in_4zqk1a88', '2026-10-01 15:35', 'seed 20261001') },
  { id: 'v_p1_d1', roundId: 'rnd_pdl1_1', ver: 'v1', kind: 'dataset', current: true, by: '이박사', at: '2026-10-02 18:20',
    summary: 'pdl1_binder_pairs_v1.jsonl · 3,412행 · (서열, 구조) 쌍',
    repro: rp('run_0433', MDL_BIND, 'ph_6b02ad57', 'in_4zqk1a88', '2026-10-01 15:35', 'seed 20261001') },

  /* PD-L1 Round 2 (실패) */
  { id: 'v_p2_r1', roundId: 'rnd_pdl1_2', ver: 'v1', kind: 'report', current: true, by: '이박사', at: '2026-10-04 11:26',
    summary: '실패 원인 보고서, steering_config 키 이름 오류로 추정',
    repro: rp('run_0441', 'bioemu@1.1', 'ph_bb47c190', 'in_4zqk1a88', '2026-10-04 09:14', 'seed 20261004') },

  /* 리파아제 Round 1 (취소) */
  { id: 'v_l1_r1', roundId: 'rnd_lip_1', ver: 'v1', kind: 'report', current: true, by: '박연구', at: '2026-09-26 15:40',
    summary: '취소 사유와 입력 세트 보관 위치 기록',
    repro: rp('run_0399', 'proteinmpnn@1.0.1', 'ph_3d5e7704', 'in_lip77a2', '2026-09-25 17:40', 'seed 20260925') },

  /* CATH Round 1 */
  { id: 'v_c1_s1', roundId: 'rnd_cath_1', ver: 'v1', kind: 'selection', current: true, by: '최운영', at: '2026-10-05 22:31',
    summary: 'train 서브셋 24 타깃 통과 후보 48건',
    repro: rp('run_cath_3rgk', MDL_STAB, 'ph_cath0d11', 'in_cath4e90', '2026-10-05 20:10', 'seed 20261005') },
  { id: 'v_c1_r1', roundId: 'rnd_cath_1', ver: 'v1', kind: 'report', current: false, by: '최운영', at: '2026-10-06 00:12',
    summary: '재현 중간 집계 보고서 (완료 24 / 실패 3)',
    repro: rp('run_cath_3rgk', MDL_STAB, 'ph_cath0d11', 'in_cath4e90', '2026-10-05 20:10', 'seed 20261005') },
  { id: 'v_c1_r2', roundId: 'rnd_cath_1', ver: 'v2', kind: 'report', current: true, by: '최운영', at: '2026-10-06 08:05',
    summary: '기존 73-실행 코퍼스와 지표 대조표 추가',
    repro: rp('run_cath_1lvm', MDL_STAB, 'ph_cath0d11', 'in_cath4e90', '2026-10-06 07:30', 'seed 20261006') },
  { id: 'v_c1_d1', roundId: 'rnd_cath_1', ver: 'v1', kind: 'dataset', current: true, by: '최운영', at: '2026-10-06 08:40',
    summary: 'cath_train_metrics_v1.csv · 1,840행 · 지표 대조용',
    repro: rp('run_cath_1lvm', MDL_STAB, 'ph_cath0d11', 'in_cath4e90', '2026-10-06 07:30', 'seed 20261006') },
]

/* ───────────────────────────────────────────────────────────────
   화면이 목록 / 프로젝트 상세 / 라운드 상세로 나뉘어 있으므로
   편집 결과가 화면 이동 후에도 남아 있도록 모듈 단위 목업 저장소를 둔다.
   (시안이므로 저장은 메모리에만 한다.)
   ─────────────────────────────────────────────────────────────── */

/* 지금 보고 있는 프로젝트. 사이드바에서 바꾸면 전 화면이 따라간다. */
let currentProjectId = WS_PROJECTS[0]?.id ?? ''

let projectState: WsProject[] = WS_PROJECTS
let roundState: WsRound[] = WS_ROUNDS
let versionState: WsVersion[] = WS_VERSIONS
const wsListeners = new Set<() => void>()

function emit() { wsListeners.forEach(fn => fn()) }

export const wsStore = {
  subscribe(fn: () => void) { wsListeners.add(fn); return () => { wsListeners.delete(fn) } },
  projects: () => projectState,
  rounds: () => roundState,
  addProject(p: WsProject) { projectState = [...projectState, p]; emit() },
  inviteMember(id: string, m: WsMember) {
    projectState = projectState.map(x => (x.id === id ? { ...x, members: [...(x.members ?? []), m] } : x))
    emit()
  },
  patchMember(id: string, account: string, p: Partial<WsMember>) {
    projectState = projectState.map(x => (x.id === id
      ? { ...x, members: (x.members ?? []).map(m => (m.account === account ? { ...m, ...p } : m)) }
      : x))
    emit()
  },
  removeMember(id: string, account: string) {
    projectState = projectState.map(x => (x.id === id
      ? { ...x, members: (x.members ?? []).filter(m => m.account !== account) } : x))
    emit()
  },
  /* 소유자는 한 명만 둔다. 넘기면 기존 소유자는 편집으로 내려온다. */
  transferOwner(id: string, account: string) {
    projectState = projectState.map(x => (x.id === id
      ? {
        ...x,
        owner: (x.members ?? []).find(m => m.account === account)?.name ?? x.owner,
        members: (x.members ?? []).map(m => (
          m.account === account ? { ...m, role: '소유자' as WsMemberRole }
            : m.role === '소유자' ? { ...m, role: '편집' as WsMemberRole } : m)),
      } : x))
    emit()
  },
  patchProject(id: string, p: Partial<WsProject>) {
    projectState = projectState.map(x => (x.id === id ? { ...x, ...p } : x)); emit()
  },
  removeProject(id: string) {
    projectState = projectState.filter(x => x.id !== id)
    roundState = roundState.filter(x => x.projectId !== id)
    emit()
  },
  addRound(r: WsRound) { roundState = [...roundState, r]; emit() },
  patchRound(id: string, p: Partial<WsRound>) {
    roundState = roundState.map(x => (x.id === id ? { ...x, ...p } : x)); emit()
  },
  /* 태스크는 라운드 안에만 있으므로 라운드를 갈아 끼우는 방식으로 고친다. */
  addTask(roundId: string, t: WsTask) {
    roundState = roundState.map(x => (x.id === roundId ? { ...x, tasks: [...x.tasks, t] } : x)); emit()
  },
  patchTask(roundId: string, taskId: string, p: Partial<WsTask>) {
    roundState = roundState.map(x => (x.id === roundId
      ? { ...x, tasks: x.tasks.map(t => (t.id === taskId ? { ...t, ...p } : t)) }
      : x)); emit()
  },
  removeTask(roundId: string, taskId: string) {
    roundState = roundState.map(x => (x.id === roundId
      ? { ...x, tasks: x.tasks.filter(t => t.id !== taskId) } : x)); emit()
  },
  removeRound(id: string) {
    roundState = roundState.filter(x => x.id !== id)
    versionState = versionState.filter(x => x.roundId !== id)
    emit()
  },
  versions: () => versionState,
  /* 고른 버전을 현행으로 되돌린다. 같은 라운드·같은 종류의 다른 버전은 이전 버전이 된다. */
  revertVersion(id: string) {
    const target = versionState.find(v => v.id === id)
    if (!target) return
    versionState = versionState.map(v =>
      v.roundId === target.roundId && v.kind === target.kind
        ? { ...v, current: v.id === id }
        : v)
    emit()
  },
  currentId: () => currentProjectId,
  setCurrent(id: string) { currentProjectId = id; emit() },
}

/* 라운드 하나의 결과 버전. 종류별로 묶고 버전 번호 역순(최신 먼저)으로 정렬한다. */
export function versionsOfRound(versions: WsVersion[], roundId: string): WsVersion[] {
  const order: WsVerKind[] = ['report', 'selection', 'dataset']
  return versions
    .filter(v => v.roundId === roundId)
    .slice()
    .sort((a, b) => (order.indexOf(a.kind) - order.indexOf(b.kind))
      || (Number(b.ver.slice(1)) - Number(a.ver.slice(1))))
}

/* 라운드별 최신 버전 요약 (프로젝트 상세에서 쓴다) */
export interface WsVerSummary {
  roundId: string
  title: string
  status: RoundStatus
  total: number
  latestVer: string
  latestKind: string
  latestAt: string
}

export function versionSummary(versions: WsVersion[], rounds: WsRound[]): WsVerSummary[] {
  return rounds.map(r => {
    const rows = versions.filter(v => v.roundId === r.id)
    const latest = rows.slice().sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))[0]
    return {
      roundId: r.id,
      title: r.title,
      status: r.status,
      total: rows.length,
      latestVer: latest ? latest.ver : '-',
      latestKind: latest ? WS_VER_KIND_LABEL[latest.kind] : '-',
      latestAt: latest ? latest.at : '-',
    }
  })
}

/* 실험 결과 기록에서 고를 측정 항목 */
export const WS_MEASURES = ['Tm (℃)', '발현량 (mg/L)', '활성 (%)', 'Kd (nM)', 'kcat/Km (1/mM·s)']

/* 파생 데이터셋 추출 옵션 */
export const WS_DATASET_SCOPES = [
  '이 프로젝트 전체 실행',
  '완료 실행만',
  '실험 결과가 있는 실행',
  '이 라운드의 실행만',
]
export const WS_DATASET_UNITS = ['후보 서열 단위', '실행 단위', '(서열, 구조) 쌍']
export const WS_DATASET_LABELS = [
  'SoluProt score',
  'pLDDT / RMSD',
  '가중 랭킹 점수',
  '사용자 피드백 등급',
  '실험 측정값 (Tm, activity 등)',
]
