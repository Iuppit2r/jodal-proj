// 관리자 콘솔 UI 확인용 목업 데이터

// 최근 30일 (9/1 ~ 9/30)
const WEEKLY_SHAPE = [1, 1.08, 1.02, 1.12, 0.95, 0.42, 0.38]
const series = (base: number, growth: number, noise: number) =>
  Array.from({ length: 30 }, (_, i) => Math.round(base * (1 + growth * i) * WEEKLY_SHAPE[i % 7] + Math.sin(i * 1.7) * noise))

// 일별 이용 건수(질의 수)
export const DAILY_QUERIES = series(190, 0.012, 14)
export const DAILY_LABELS = Array.from({ length: 30 }, (_, i) => `9/${i + 1}`)

// 이용 건수 대비 미해결·오답 신고 비율 (기간 합계 계산용)
export const UNRESOLVED_RATE = 0.0065
export const WRONG_REPORT_RATE = 0.0027

// 시간대별 일평균 질의
export const HOURLY = [3, 1, 0, 0, 1, 2, 6, 14, 28, 42, 51, 47, 38, 44, 49, 46, 40, 31, 22, 25, 29, 24, 15, 8]

// 질의 유형 (RFP 대표 질의 시나리오 기준 분류)
export const QUERY_TYPES = [
  { label: '개념·용어 설명', value: 2210 },
  { label: '인증·공시 절차 안내', value: 1680 },
  { label: '기준·법령 조항 확인', value: 1134 },
  { label: '본교 ESG 정보', value: 512 },
  { label: '서비스 범위 외', value: 208 },
]

export const TOPICS = [
  { topic: '온실가스 산정(Scope 1·2·3)', count: 1435 },
  { topic: '중소기업 ESG 인증 절차', count: 1109 },
  { topic: '공급망 실사 대응', count: 862 },
  { topic: 'ESG 개념·기초', count: 769 },
  { topic: '국내 지속가능성 공시기준', count: 579 },
  { topic: '탄소중립기본법', count: 399 },
  { topic: '본교 ESG 활동', count: 303 },
]

// 처리 상태: 활용 대상 자료가 답변에 반영되기까지의 단계
export type DocStatus = '반영됨' | '검수 대기' | '처리 중' | '오류'

export type Doc = {
  id: string
  title: string
  category: string
  publisher: string
  version: string
  publishedAt: string
  format: string
  status: DocStatus
  updatedAt: string
}

export const DOCS: Doc[] = [
  { id: 'd1', title: 'IFRS S1 일반 요구사항', category: '국제 공시기준', publisher: 'ISSB', version: '2023', publishedAt: '2023-06', format: 'PDF', status: '반영됨', updatedAt: '2026-09-02' },
  { id: 'd2', title: 'IFRS S2 기후 관련 공시', category: '국제 공시기준', publisher: 'ISSB', version: '2023', publishedAt: '2023-06', format: 'PDF', status: '반영됨', updatedAt: '2026-09-02' },
  { id: 'd3', title: '지속가능성 공시기준 제1호 일반요구사항', category: '국내 공시기준', publisher: 'KSSB', version: '확정안', publishedAt: '미상', format: 'PDF', status: '검수 대기', updatedAt: '2026-09-24' },
  { id: 'd4', title: 'GRI 305: Emissions', category: '보고 표준', publisher: 'GRI', version: '2016', publishedAt: '2016-10', format: 'PDF', status: '반영됨', updatedAt: '2026-08-28' },
  { id: 'd5', title: 'Scope 3 Standard', category: '온실가스', publisher: 'GHG Protocol', version: '2011', publishedAt: '2011-09', format: 'PDF', status: '반영됨', updatedAt: '2026-08-28' },
  { id: 'd6', title: '탄소중립·녹색성장 기본법', category: '국내 법령', publisher: '대한민국', version: '현행', publishedAt: '2022-03', format: '웹문서', status: '반영됨', updatedAt: '2026-09-15' },
  { id: 'd7', title: 'K-ESG 가이드라인 v1.0', category: '국내 실무 가이드', publisher: '산업통상자원부', version: 'v1.0', publishedAt: '2021-12', format: 'PDF', status: '반영됨', updatedAt: '2026-08-30' },
  { id: 'd8', title: '중소기업 CEO를 위한 ESG 안내서', category: '중소기업 자료', publisher: '대한상공회의소', version: '미상', publishedAt: '미상', format: 'PDF', status: '처리 중', updatedAt: '2026-09-29' },
  { id: 'd10', title: '경인여대 ESG 헌장 및 추진체계', category: '본교 자료', publisher: '경인여자대학교', version: '2026', publishedAt: '2026-03', format: 'HWP', status: '반영됨', updatedAt: '2026-09-10' },
  { id: 'd11', title: '부서별 ESG 목표', category: '본교 자료', publisher: '경인여자대학교', version: '2026', publishedAt: '2026-03', format: 'XLSX', status: '오류', updatedAt: '2026-09-27' },
]

// 제외 자료: 처리 상태와 별개로, 학습·활용 대상에서 빠진 자료
export const EXCLUDE_REASONS = ['라이선스 제한', '출처 불명', '개인정보 포함', '발주기관 요청'] as const
export type ExcludeReason = (typeof EXCLUDE_REASONS)[number]

export type ExcludedDoc = Omit<Doc, 'status' | 'updatedAt'> & { reason: ExcludeReason; note: string; excludedAt: string; by: string }

export const EXCLUDED_DOCS: ExcludedDoc[] = [
  { id: 'x1', title: 'GRI 표준 한국어 번역본', category: '보고 표준', publisher: 'GRI', version: '미상', publishedAt: '미상', format: 'PDF', reason: '라이선스 제한', note: '이용약관상 번역본의 복제·기계학습 활용 제한', excludedAt: '2026-08-20', by: '김서연' },
  { id: 'x2', title: 'ESG 공시 요약 정리 (개인 블로그)', category: '국내 공시기준', publisher: '미상', version: '미상', publishedAt: '미상', format: '웹문서', reason: '출처 불명', note: '발행 주체를 확인할 수 없음', excludedAt: '2026-09-05', by: '박준호' },
  { id: 'x3', title: '협력사 ESG 설문 응답 원본', category: '본교 자료', publisher: '경인여자대학교', version: '2026', publishedAt: '2026-05', format: 'XLSX', reason: '개인정보 포함', note: '응답자 성명·연락처 포함', excludedAt: '2026-09-12', by: '이지은' },
]

export type Severity = '긴급' | '중요' | '일반'

export const CHANGES: {
  id: string
  source: string
  title: string
  detectedAt: string
  severity: Severity
  stage: 0 | 1 | 2 | 3 | 4 // 수집 → 감지·판정 → 검증·반영 → 배포 → 통지
}[] = [
  { id: 'c1', source: 'KSSB', title: '지속가능성 공시기준 관련 공지 게시', detectedAt: '2026-09-24 09:12', severity: '긴급', stage: 2 },
  { id: 'c2', source: '금융위원회', title: 'ESG 공시 로드맵 관련 보도자료', detectedAt: '2026-09-22 14:40', severity: '중요', stage: 3 },
  { id: 'c3', source: 'GRI', title: 'Topic Standard 개정 공지', detectedAt: '2026-09-18 03:00', severity: '중요', stage: 4 },
  { id: 'c4', source: '대한상공회의소', title: 'ESG 안내서 개정판 게시', detectedAt: '2026-09-15 03:00', severity: '일반', stage: 4 },
  { id: 'c5', source: 'EU', title: 'CBAM 이행규정 FAQ 갱신', detectedAt: '2026-09-11 03:00', severity: '일반', stage: 1 },
]

export const MONITOR_TARGETS = [
  { name: 'ISSB', group: '국제 기준', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: 'GRI', group: '국제 기준', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: 'GHG Protocol', group: '국제 기준', cycle: '주 1회', last: '2026-09-28 03:00', ok: true },
  { name: 'KSSB', group: '국내 기준', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: '금융위원회', group: '국내 기준', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: '한국거래소', group: '국내 기준', cycle: '매일', last: '2026-09-30 03:00', ok: false },
  { name: '기후에너지환경부', group: '소관 부처', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: '산업통상자원부', group: '소관 부처', cycle: '매일', last: '2026-09-30 03:00', ok: true },
  { name: '대한상공회의소', group: '협회·유관단체', cycle: '주 1회', last: '2026-09-28 03:00', ok: true },
  { name: '한국ESG기준원', group: '협회·유관단체', cycle: '주 1회', last: '2026-09-28 03:00', ok: true },
  { name: 'EU (CSRD)', group: '해외 규제', cycle: '주 1회', last: '2026-09-28 03:00', ok: true },
  { name: 'EU (CBAM)', group: '해외 규제', cycle: '주 1회', last: '2026-09-28 03:00', ok: true },
]

export type QaStatus = '정상' | '오답 신고' | '미해결' | '검수 완료' | '차단'

export const QA_LOGS: {
  id: string
  at: string
  question: string
  level: string
  kind: string
  sources: number
  feedback: 'up' | 'down' | null
  status: QaStatus
  topic: string
}[] = [
  { id: 'q1', at: '2026-09-30 10:42', question: '우리 회사도 ESG 공시를 해야 하나요?', level: '실무 중심', kind: '근거 기반', sources: 3, feedback: 'up', status: '정상', topic: '공시기준' },
  { id: 'q2', at: '2026-09-30 10:31', question: 'Scope 3 범주 중 출장은 몇 번인가요?', level: '실무 중심', kind: '근거 기반', sources: 2, feedback: 'down', status: '오답 신고', topic: '온실가스' },
  { id: 'q3', at: '2026-09-30 10:17', question: 'ESG가 무엇인가요?', level: '학생 눈높이', kind: '근거 기반', sources: 1, feedback: 'up', status: '정상', topic: 'ESG 기초' },
  { id: 'q4', at: '2026-09-30 09:58', question: '인천시 ESG 지원사업 마감일이 언제인가요?', level: '실무 중심', kind: '확인 불가', sources: 0, feedback: null, status: '미해결', topic: '지원사업' },
  { id: 'q5', at: '2026-09-30 09:44', question: '작년에 바뀐 공시기준 내용을 알려주세요.', level: '전문가 수준', kind: '근거 기반', sources: 4, feedback: null, status: '검수 완료', topic: '공시기준' },
  { id: 'q6', at: '2026-09-30 09:20', question: '(금칙어 포함 질의)', level: '해당 없음', kind: '차단', sources: 0, feedback: null, status: '차단', topic: '해당 없음' },
  { id: 'q7', at: '2026-09-30 09:03', question: '공급망 실사 체크리스트 양식이 있나요?', level: '실무 중심', kind: '추론 포함', sources: 1, feedback: 'down', status: '오답 신고', topic: '공급망' },
  { id: 'q8', at: '2026-09-29 22:15', question: 'ESG 관련 자격증 추천해 주세요', level: '개념과 배경', kind: '근거 기반', sources: 2, feedback: 'up', status: '정상', topic: '진로' },
]

export const BANNED = ['비속어 예시1', '비속어 예시2', '혐오표현 예시', '성적 표현 예시', '폭력 조장 표현']

export const BLOCK_LOGS = [
  { at: '2026-09-30 09:20', rule: '금칙어', category: '욕설·비속어', action: '차단 후 안내' },
  { at: '2026-09-29 18:02', rule: '자동 판별', category: '자해·위험', action: '응답 제한 + 상담 안내' },
  { at: '2026-09-29 11:47', rule: '자동 판별', category: '서비스 범위 외', action: '범위 안내' },
  { at: '2026-09-28 20:31', rule: '금칙어', category: '혐오 표현', action: '차단 후 안내' },
]

export const ADMINS = [
  { name: '김서연', dept: '산학협력단', role: '최고관리자', last: '2026-09-30 09:12' },
  { name: '이지은', dept: 'ESG 챗봇 TF', role: '검수자', last: '2026-09-29 16:40' },
  { name: '박준호', dept: '전산팀', role: '운영자', last: '2026-09-27 10:05' },
]

// 갱신 이력 (수집 일시 · 대상 · 반영 결과)
export const UPDATE_HISTORY: { at: string; target: string; result: '반영' | '변경 없음' | '반려' | '수집 실패'; note: string }[] = [
  { at: '2026-09-30 03:00', target: '한국거래소', result: '수집 실패', note: '응답 시간 초과' },
  { at: '2026-09-30 03:00', target: 'ISSB', result: '변경 없음', note: '없음' },
  { at: '2026-09-24 09:12', target: 'KSSB', result: '반영', note: '공시기준 관련 공지 · 긴급' },
  { at: '2026-09-18 03:00', target: 'GRI', result: '반영', note: 'Topic Standard 개정 공지 · 중요' },
  { at: '2026-09-15 03:00', target: '대한상공회의소', result: '반영', note: 'ESG 안내서 개정판 · 일반' },
  { at: '2026-09-09 03:00', target: '금융위원회', result: '반려', note: '기존 자료와 동일 내용' },
]

// 관리자 계정 인증 및 접근 이력
export const ACCESS_LOGS: { at: string; name: string; event: string; ip: string; ok: boolean }[] = [
  { at: '2026-09-30 09:12', name: '김서연', event: '로그인', ip: '10.12.4.21', ok: true },
  { at: '2026-09-30 08:57', name: '박준호', event: '로그인 실패 (비밀번호 불일치)', ip: '10.12.7.3', ok: false },
  { at: '2026-09-29 16:40', name: '이지은', event: '로그인', ip: '10.12.4.35', ok: true },
  { at: '2026-09-29 16:02', name: '김서연', event: '권한 변경 · 이지은을 검수자로 지정', ip: '10.12.4.21', ok: true },
  { at: '2026-09-27 10:05', name: '박준호', event: '로그인', ip: '10.12.7.3', ok: true },
]
