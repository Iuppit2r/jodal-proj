/* 사용자·보안 / MCP 외부 연계 / Model Providers 화면 전용 목업 데이터 */

/* ── 사용자 ─────────────────────────────────────────── */
export type UserRole = 'admin' | 'model_manager' | 'user'
export type UserStatus = 'approved' | 'pending' | 'disabled'

export interface UserRow {
  username: string
  role: UserRole
  status: UserStatus
  authType: '로컬' | 'OIDC' | 'PAT'
  createdAt: string
  runPrefix: string
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  model_manager: 'Model Manager',
  user: 'User',
}

export const STATUS_LABEL: Record<UserStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  disabled: 'Disabled',
}

export const USERS: UserRow[] = [
  { username: 'admin', role: 'admin', status: 'approved', authType: '로컬', createdAt: '2026-01-04 09:12', runPrefix: 'admin' },
  { username: 'hana.kim', role: 'user', status: 'approved', authType: 'OIDC', createdAt: '2026-02-11 10:40', runPrefix: 'hanakim' },
  { username: 'jiwon.park', role: 'model_manager', status: 'approved', authType: 'OIDC', createdAt: '2026-03-02 14:05', runPrefix: 'jiwonpark' },
  { username: 'sehun.choi', role: 'user', status: 'approved', authType: 'OIDC', createdAt: '2026-04-19 11:28', runPrefix: 'sehunchoi' },
  { username: 'minji.lee', role: 'user', status: 'pending', authType: 'OIDC', createdAt: '2026-10-05 16:51', runPrefix: 'minjilee' },
  { username: 'dohyun.seo', role: 'user', status: 'pending', authType: 'OIDC', createdAt: '2026-10-05 09:03', runPrefix: 'dohyunseo' },
  { username: 'kbf.guest', role: 'user', status: 'pending', authType: '로컬', createdAt: '2026-10-04 18:22', runPrefix: 'kbfguest' },
  { username: 'legacy.batch', role: 'user', status: 'disabled', authType: 'PAT', createdAt: '2025-11-30 08:00', runPrefix: 'legacybatch' },
]

/* OIDC / Keycloak · Google 역할 매핑 */
export const ROLE_MAP: { claim: string; source: string; role: string }[] = [
  { claim: 'pipeline-admin', source: 'Keycloak client role', role: 'admin' },
  { claim: 'realm-admin', source: 'Keycloak realm role', role: 'admin' },
  { claim: 'pipeline-model-manager', source: 'Keycloak client role', role: 'model_manager' },
  { claim: 'model-manager', source: 'Keycloak realm role', role: 'model_manager' },
  { claim: '매핑 없음', source: 'Google Workspace 계정', role: 'user (승인 대기)' },
]

/* ── MCP 도구 카탈로그 ──────────────────────────────── */
export interface McpTool { group: string; name: string; desc: string; admin?: boolean }

export const MCP_CATALOG: McpTool[] = [
  /* 실행 */
  { group: '실행', name: 'pipeline.run', desc: '전체 파이프라인 실행 (msa → rfd3 → bioemu → design → soluprot → af2 → novelty)' },
  { group: '실행', name: 'pipeline.preflight', desc: '실행 없이 입력값과 설정 유효성만 검증' },
  { group: '실행', name: 'pipeline.plan_from_prompt', desc: '자연어 요청을 파라미터로 변환하고 부족한 입력을 질문으로 반환' },
  { group: '실행', name: 'pipeline.run_from_prompt', desc: '자연어 요청을 변환한 뒤 바로 실행 (자동 재시도 옵션 포함)' },
  { group: '실행', name: 'pipeline.af2_predict', desc: 'ColabFold / AF2 단독 실행 (파이프라인 입력 형식)' },
  { group: '실행', name: 'pipeline.run_af2', desc: 'AF2 단독 실행 (서열 문자열 입력)' },
  { group: '실행', name: 'pipeline.diffdock', desc: 'DiffDock 도킹 실행 (파이프라인 입력 형식)' },
  { group: '실행', name: 'pipeline.run_diffdock', desc: 'DiffDock 도킹 실행 (단순 입력)' },
  { group: '실행', name: 'pipeline.classify_residues', desc: '표면 · 코어 · 계면 잔기 분류 (화면의 3D 잔기 선택기와 동일 로직)' },
  { group: '실행', name: 'pipeline.analyze_paper_for_masking', desc: '논문 PDF를 분석해 고정할 잔기 후보를 제안' },
  { group: '실행', name: 'pipeline.status', desc: '실행 상태 조회 (단계 · 상태 · 갱신 시각)' },
  { group: '실행', name: 'pipeline.list_runs', desc: '실행 목록 조회 (하위 실행 · CATH 실행 제외 기본값)' },
  { group: '실행', name: 'pipeline.cancel_run', desc: '진행 중 작업 취소 요청 후 실행을 취소 처리' },
  { group: '실행', name: 'pipeline.delete_run', desc: '실행 디렉터리와 산출물 삭제' },
  { group: '실행', name: 'pipeline.queue_eta', desc: '남은 단계의 작업 큐 기반 예상 완료 시각 계산' },
  /* 산출물 */
  { group: '산출물', name: 'pipeline.list_artifacts', desc: '산출물 목록 조회 (경로 접두어 · 깊이 · 개수 제한)' },
  { group: '산출물', name: 'pipeline.read_artifact', desc: '산출물 내용 읽기 (오프셋 · 인코딩 · base64 지원)' },
  { group: '산출물', name: 'pipeline.save_workflow_session', desc: '단계별 실행 작업 저장' },
  { group: '산출물', name: 'pipeline.get_workflow_session', desc: '단계별 실행 작업 조회' },
  /* 프로젝트·라운드 */
  { group: '프로젝트 · 라운드', name: 'pipeline.save_project', desc: '프로젝트 생성 · 수정' },
  { group: '프로젝트 · 라운드', name: 'pipeline.list_projects', desc: '프로젝트 목록 조회 (보관 항목 포함 선택)' },
  { group: '프로젝트 · 라운드', name: 'pipeline.get_project', desc: '프로젝트 단건 조회' },
  { group: '프로젝트 · 라운드', name: 'pipeline.archive_project', desc: '프로젝트 보관' },
  { group: '프로젝트 · 라운드', name: 'pipeline.restore_project', desc: '보관한 프로젝트 복원' },
  { group: '프로젝트 · 라운드', name: 'pipeline.delete_project', desc: '프로젝트 삭제 (하위 라운드 동시 삭제 선택)' },
  { group: '프로젝트 · 라운드', name: 'pipeline.save_round', desc: '라운드 생성 · 수정 (목표 · 가설 · 연결 실행)' },
  { group: '프로젝트 · 라운드', name: 'pipeline.list_rounds', desc: '라운드 목록 조회' },
  { group: '프로젝트 · 라운드', name: 'pipeline.get_round', desc: '라운드 단건 조회' },
  { group: '프로젝트 · 라운드', name: 'pipeline.archive_round', desc: '라운드 보관' },
  { group: '프로젝트 · 라운드', name: 'pipeline.restore_round', desc: '보관한 라운드 복원' },
  { group: '프로젝트 · 라운드', name: 'pipeline.delete_round', desc: '라운드 삭제 (연결 실행 산출물은 보존)' },
  /* 피드백·실험 */
  { group: '피드백 · 실험', name: 'pipeline.submit_feedback', desc: '후보 평가 등록 (good / bad · 사유 · 단계 · 지표)' },
  { group: '피드백 · 실험', name: 'pipeline.list_feedback', desc: '등록된 평가 목록 조회' },
  { group: '피드백 · 실험', name: 'pipeline.submit_experiment', desc: '실험값 등록 (분석법 · 결과 · 지표 이름 · 값 · 단위 · 방향)' },
  { group: '피드백 · 실험', name: 'pipeline.list_experiments', desc: '등록된 실험값 목록 조회' },
  { group: '피드백 · 실험', name: 'pipeline.list_agent_events', desc: '근거 검토 패널 이벤트 조회 (판정 · 신뢰도 · 근거)' },
  /* 보고서·분석 */
  { group: '보고서 · 분석', name: 'pipeline.generate_report', desc: '산출물 · 평가 · 실험값을 묶어 보고서 생성' },
  { group: '보고서 · 분석', name: 'pipeline.save_report', desc: '보고서 본문과 첨부 저장' },
  { group: '보고서 · 분석', name: 'pipeline.get_report', desc: '최신 보고서 조회 (국문 · 영문)' },
  { group: '보고서 · 분석', name: 'pipeline.compare_runs', desc: '실행 간 비교 (현재 · 기준 · 차이 · 데이터 충족도)' },
  { group: '보고서 · 분석', name: 'pipeline.get_hit_list', desc: '가중 랭킹 조회 (soluprot 0.4 · plddt 0.3 · rmsd 0.2 기본 가중치)' },
  { group: '보고서 · 분석', name: 'pipeline.export_results_package', desc: '결과 묶음 ZIP 내보내기' },
  /* CATH */
  { group: 'CATH 벤치마크', name: 'pipeline.cath_get_batch_overview', desc: 'train · val · test 부분집합 진행 현황 조회', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_launch_batch', desc: '부분집합 배치 실행 (로컬 산출물 유지 · 동시 작업 수)', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_launch_training', desc: '학습 배치 실행 (부분집합 다중 선택)', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_list_jobs', desc: '관리 작업 목록 조회 (batch · train)', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_get_job', desc: '작업 단건 조회', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_read_job_log', desc: '작업 로그 읽기', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_stop_job', desc: '진행 중 작업 중단', admin: true },
  { group: 'CATH 벤치마크', name: 'pipeline.cath_delete_job', desc: '작업 기록 삭제 (산출물은 보존)', admin: true },
  /* RunPod */
  { group: 'RunPod 운영', name: 'pipeline.runpod_list_endpoints', desc: '엔드포인트 목록 · 워커 요약 · 미등록 서비스 조회', admin: true },
  { group: 'RunPod 운영', name: 'pipeline.runpod_get_endpoint', desc: '엔드포인트 상세 조회 (워커 포함 선택)', admin: true },
  { group: 'RunPod 운영', name: 'pipeline.runpod_update_endpoint', desc: '엔드포인트 설정 변경 (GPU · 워커 수 · 타임아웃 등)', admin: true },
  { group: 'RunPod 운영', name: 'pipeline.runpod_list_billing', desc: '기간별 사용 비용 조회', admin: true },
  { group: 'RunPod 운영', name: 'pipeline.runpod_get_history', desc: '사용량 · 비용 이력 조회 (수집기 상태 포함)', admin: true },
  /* 모델 provider */
  { group: '모델 제공자', name: 'pipeline.model_provider_list', desc: '모델 제공자 목록 조회 (헬스 포함 선택)' },
  { group: '모델 제공자', name: 'pipeline.model_provider_update', desc: '제공자 설정 변경 (전체 기본값 변경은 Model Manager 이상)' },
  { group: '모델 제공자', name: 'pipeline.model_provider_health', desc: '제공자 연결 상태 점검 (저장 전 초안도 점검 가능)' },
  /* 챗 */
  { group: '챗 · 추론', name: 'pipeline.agent_chat', desc: '실행 맥락 기반 전문가 응답 (국문 · 영문)' },
  { group: '챗 · 추론', name: 'chat.list_models', desc: 'LLM 제공자별 모델 목록 조회 (키는 브라우저에만 보관)' },
  { group: '챗 · 추론', name: 'chat.send', desc: '대화 전송 (메시지 · 화면 맥락 · 첨부 · 세션)' },
  { group: '챗 · 추론', name: 'chat.list_attachments', desc: '세션에 올린 첨부 목록 조회' },
]

export const MCP_GROUPS = [
  '실행', '산출물', '프로젝트 · 라운드', '피드백 · 실험',
  '보고서 · 분석', 'CATH 벤치마크', 'RunPod 운영', '모델 제공자', '챗 · 추론',
]

/* ── API 키 (PAT) ───────────────────────────────────── */
export interface PatRow { id: string; label: string; created: string; expires: string; lastUsed: string }

export const PATS: PatRow[] = [
  { id: 'pat_8f21', label: 'my-laptop', created: '2026-09-18', expires: '2026-12-17', lastUsed: '2026-10-05 09:12' },
  { id: 'pat_4c0a', label: 'vscode-office', created: '2026-08-02', expires: '2026-10-31', lastUsed: '2026-10-04 17:40' },
  { id: 'pat_b7e5', label: 'codex-cli', created: '2026-07-11', expires: '무기한', lastUsed: '2026-09-28 11:02' },
  { id: 'pat_1d93', label: 'ci-nightly-report', created: '2026-06-01', expires: '2026-11-29', lastUsed: '2026-10-05 02:00' },
]

export const PROMPT_EXAMPLES: { title: string; body: string }[] = [
  { title: '실행 목록 보기', body: '내 실행 목록을 최근 20건만 보여줘. 각 실행의 단계와 상태도 함께 정리해줘.' },
  { title: '특정 실행 상태 확인', body: 'run_id가 hanakim_20261005_101233_a7f2 인 실행의 현재 단계, 상태, 남은 예상 시간을 알려줘.' },
  { title: 'pipeline.run 예시 만들기', body: '1EMA 체인 A를 타깃으로 보존율 30 / 50 / 70 에서 총 120개 서열을 만드는 pipeline.run 호출 예시를 JSON으로 작성해줘.' },
  { title: 'af2_predict 단독 실행', body: '이 FASTA 서열로 pipeline.af2_predict 를 단독 실행해서 pLDDT와 RMSD만 정리해줘.' },
  { title: 'design 단계까지만 실행', body: 'stop_after 를 design 으로 두고 pipeline.run 을 실행한 다음, 단계가 끝나면 산출물 목록을 보여줘.' },
  { title: 'Codex 변형', body: 'protein-pipeline MCP 서버에 연결했는지 먼저 확인하고, 연결되면 내 최근 실행 하나를 골라 단계별로 결과를 요약해줘.' },
]

/* ── 모델 provider ──────────────────────────────────── */
export type ProviderType = 'runpod' | 'http_api' | 'disabled'

export interface ProviderSpec {
  key: string
  label: string
  type: ProviderType
  endpointId: string
  baseUrl: string
  timeout: number
  health: 'ready' | 'notready' | 'unchecked'
  runpodEnv: string
  httpEnv: string
  custom?: boolean
}

export const PROVIDER_TYPE_LABEL: Record<ProviderType, string> = {
  runpod: 'RunPod',
  http_api: 'HTTP API',
  disabled: '사용 안 함',
}

export const PROVIDERS: ProviderSpec[] = [
  { key: 'mmseqs', label: 'MMseqs2', type: 'runpod', endpointId: 'ep_mmseqs_8a21', baseUrl: '', timeout: 21600, health: 'ready', runpodEnv: 'MMSEQS_ENDPOINT_ID', httpEnv: 'MMSEQS_HTTP_URL / MMSEQS_GPU_URL' },
  { key: 'proteinmpnn', label: 'ProteinMPNN', type: 'runpod', endpointId: 'ep_mpnn_31cd', baseUrl: '', timeout: 21600, health: 'ready', runpodEnv: 'PROTEINMPNN_ENDPOINT_ID', httpEnv: 'PROTEINMPNN_GPU_URL / PROTEINMPNN_HTTP_URL' },
  { key: 'colabfold', label: 'ColabFold', type: 'runpod', endpointId: 'ep_colabfold_77b0', baseUrl: '', timeout: 21600, health: 'ready', runpodEnv: 'COLABFOLD_ENDPOINT_ID / COLABFOLD_RUNPOD_ENDPOINT_ID', httpEnv: 'COLABFOLD_URL / _HTTP_URL / _GPU_URL' },
  { key: 'alphafold2', label: 'AlphaFold2', type: 'http_api', endpointId: '', baseUrl: 'http://gpu-af2.kribb.internal:18082', timeout: 21600, health: 'ready', runpodEnv: 'ALPHAFOLD2_ENDPOINT_ID / AF2_ENDPOINT_ID', httpEnv: 'AF2_URL / ALPHAFOLD2_HTTP_URL' },
  { key: 'esmfold', label: 'ESMFold', type: 'disabled', endpointId: '', baseUrl: '', timeout: 21600, health: 'unchecked', runpodEnv: 'ESMFOLD_ENDPOINT_ID', httpEnv: 'ESMFOLD_HTTP_URL / ESMFOLD_URL' },
  { key: 'esm_embedding', label: 'ESM Embedding', type: 'http_api', endpointId: '', baseUrl: 'http://gpu-esm.kribb.internal:18163', timeout: 21600, health: 'ready', runpodEnv: 'ESM_EMBEDDING_ENDPOINT_ID / ESM2_ENDPOINT_ID', httpEnv: 'ESM_EMBEDDING_URL / _HTTP_URL / ESM2_HTTP_URL' },
  { key: 'rfd3', label: 'RFD3', type: 'runpod', endpointId: 'ep_rfd3_5f4e', baseUrl: '', timeout: 21600, health: 'ready', runpodEnv: 'RFD3_ENDPOINT_ID', httpEnv: 'RFD3_HTTP_URL / RFD3_GPU_URL' },
  { key: 'bioemu', label: 'BioEmu', type: 'runpod', endpointId: 'ep_bioemu_2c9a', baseUrl: '', timeout: 21600, health: 'notready', runpodEnv: 'BIOEMU_ENDPOINT_ID', httpEnv: 'BIOEMU_HTTP_URL / BIOEMU_GPU_URL' },
  { key: 'diffdock', label: 'DiffDock', type: 'runpod', endpointId: 'ep_diffdock_90aa', baseUrl: '', timeout: 21600, health: 'ready', runpodEnv: 'DIFFDOCK_ENDPOINT_ID', httpEnv: 'DIFFDOCK_HTTP_URL / DIFFDOCK_GPU_URL' },
  { key: 'rosetta_relax', label: 'Rosetta Relax', type: 'http_api', endpointId: '', baseUrl: 'http://127.0.0.1:18081', timeout: 3600, health: 'ready', runpodEnv: 'RUNPOD_RELAX_ENDPOINT_ID', httpEnv: 'ROSETTA_RELAX_HTTP_URL / RELAX_HTTP_URL' },
]

/* ── 보안 운영 기준 (SER-003 ~ SER-006) ──────────────── */

/* 환경별 공개 범위와 인증 수단. 운영은 기관 통합 인증만 허용한다. */
export const ENV_MATRIX: { env: string; audience: string; url: string; guard: string; auth: string }[] = [
  { env: 'production', audience: '기관 연구자 전체', url: 'rapid.kbiofoundry.kr', guard: '리버스 프록시 · 허용 출처 고정', auth: '기관 통합 인증 (OIDC)' },
  { env: 'staging', audience: '과제 참여자', url: 'stg.rapid.kbiofoundry.kr', guard: '기본 인증 추가', auth: '기관 통합 인증 + 기본 인증' },
  { env: 'development', audience: '개발자', url: '비공개 (루프백)', guard: '외부 공개 없음', auth: '로컬 계정' },
]

/* 분리 저장하는 비밀값. 값은 화면에 싣지 않고 이름과 보관 위치만 둔다. */
export const SECRET_POLICY: { key: string; kind: '민감' | '주의'; where: string }[] = [
  { key: 'RUNPOD_API_KEY', kind: '민감', where: '서버 환경변수 · 시크릿 저장소' },
  { key: 'MONGODB_URI', kind: '민감', where: '서버 환경변수' },
  { key: 'OIDC_CLIENT_SECRET', kind: '민감', where: '시크릿 저장소' },
  { key: 'ARTIFACT_SIGNING_KEY', kind: '민감', where: '시크릿 저장소' },
  { key: 'EXTERNAL_MODEL_KEY', kind: '주의', where: '사용자별 분리 보관' },
]

/* 적용 중인 보안 조치. 릴리스 전 점검에서 확인하는 항목이다. */
export const SECURITY_CONTROLS: { group: string; items: string[] }[] = [
  { group: '저장 데이터 (SER-003)', items: ['데이터베이스 저장 암호화', '아티팩트 저장소 암호화', '시크릿 평문 저장 금지'] },
  { group: '전송 구간 (SER-004)', items: ['웹 화면 TLS 적용', 'HTTP API · MCP TLS 적용', '내부 서비스 간 암호화 채널'] },
  { group: '시크릿 (SER-005)', items: ['환경변수 분리 보관', '로그 · 설정 파일 마스킹', '키 교체 이력 기록'] },
  { group: '실행 노드 (SER-006)', items: ['컨테이너 격리', '네트워크 정책 적용', '자원 상한 설정', '사용자 정의 모델 승인 절차'] },
]

/* 릴리스 전 점검 항목. 저장소와 번들에서 노출된 비밀값을 찾는다. */
export const RELEASE_CHECKS = [
  '저장소 전체에서 채워진 환경변수 파일 검색',
  'API 키 · 토큰 문자열 패턴 검색',
  '비공개 서버 주소 노출 검색',
  '화면 번들 내 엔드포인트 식별자 검색',
  '로그 샘플에서 서열 · 자격 증명 노출 확인',
]

/* ── 데이터 저장소 (DAR-004, DAR-009) ─────────────── */

/* MongoDB 컬렉션. runs + artifacts 메타데이터를 일관된 스키마로 둔다. */
export const COLLECTIONS: { name: string; desc: string; docs: string; size: string; keys: string }[] = [
  { name: 'runs', desc: '실행 메타데이터 · 요청 파라미터 · 상태', docs: '1,284', size: '142 MB', keys: 'run_id · owner · created' },
  { name: 'artifacts', desc: '산출물 경로 · 단계 · 형식 · 크기', docs: '38,902', size: '96 MB', keys: 'run_id · stage · kind' },
  { name: 'projects', desc: '프로젝트 · 라운드 · 태스크 · 피드백', docs: '412', size: '18 MB', keys: 'project_id · round_id' },
  { name: 'models', desc: '등록 모델 · 버전 · 스키마', docs: '47', size: '4 MB', keys: 'model_id · version' },
  { name: 'experiments', desc: '실험 측정값 · 평가 기록', docs: '1,967', size: '22 MB', keys: 'run_id · candidate_id' },
  { name: 'audit', desc: '감사 로그', docs: '84,513', size: '210 MB', keys: 'at · actor · action' },
]

/* 아티팩트 저장소. 단계별 디렉터리로 나누고 보존 기간을 따로 둔다. */
export const ARTIFACT_STORE: { kind: string; path: string; size: string; files: string; keep: string }[] = [
  { kind: '구조 (PDB · mmCIF)', path: 'artifacts/{run_id}/structure/', size: '1.8 TB', files: '214,882', keep: '2년' },
  { kind: '서열 (FASTA)', path: 'artifacts/{run_id}/sequence/', size: '42 GB', files: '38,104', keep: '2년' },
  { kind: '지표 (JSON · CSV)', path: 'artifacts/{run_id}/metrics/', size: '96 GB', files: '52,310', keep: '2년' },
  { kind: '그림 (SVG · PNG)', path: 'artifacts/{run_id}/figure/', size: '128 GB', files: '18,224', keep: '1년' },
  { kind: '보고서 (MD · PDF)', path: 'artifacts/{run_id}/report/', size: '12 GB', files: '1,842', keep: '영구' },
  { kind: '로그', path: 'artifacts/{run_id}/log/', size: '310 GB', files: '94,501', keep: '6개월' },
]

/* ── 동시접속 안정화 (SFR-024) ───────────────────── */

/* 부하 시험 결과. 시나리오별 응답 시간과 오류율을 측정한다. */
export const LOAD_TESTS: { scenario: string; users: number; p50: string; p95: string; errRate: string; pass: boolean }[] = [
  { scenario: '화면 조회 (목록 · 상세)', users: 30, p50: '180 ms', p95: '420 ms', errRate: '0.0 %', pass: true },
  { scenario: '실행 요청 제출', users: 30, p50: '640 ms', p95: '1.4 s', errRate: '0.0 %', pass: true },
  { scenario: '산출물 내려받기', users: 20, p50: '1.2 s', p95: '3.1 s', errRate: '0.2 %', pass: true },
  { scenario: '구조 비교 (3D 2개 동시)', users: 10, p50: '2.4 s', p95: '5.8 s', errRate: '0.0 %', pass: true },
  { scenario: 'Copilot 응답', users: 15, p50: '1.8 s', p95: '4.2 s', errRate: '0.4 %', pass: true },
]

/* 안정화 적용 내역. 부하 시험에서 걸린 문제와 조치를 함께 둔다. */
export const STABILIZATION: { item: string; body: string }[] = [
  { item: '세션 분리 보관', body: '화면 세션을 서버 메모리에서 분리해 보관합니다. 서버를 늘려도 로그인이 유지됩니다.' },
  { item: '실행 요청 큐 분리', body: '무거운 실행 요청을 작업 큐로 넘겨 화면 응답과 분리했습니다.' },
  { item: '모델 컨테이너 프리로딩', body: '같은 모델을 다시 부를 때 캐시를 써서 대기 시간을 최초 호출 대비 절반 이하로 줄였습니다.' },
  { item: '목록 조회 페이지 분할', body: '실행과 산출물 목록을 나눠 받아 큰 목록에서도 응답 시간을 유지합니다.' },
  { item: '동시 내려받기 상한', body: '사용자당 동시 내려받기 수를 제한해 저장소 대역을 보호합니다.' },
]
