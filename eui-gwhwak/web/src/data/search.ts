// SFR-01 / INR-04 / INR-05 목업 데이터 (실제 문헌 아님)

export type Collection = 'ROMS' | 'KOMS' | 'SAVE' | 'COVID' | 'MESH' | 'PUBMED' | 'WOS'

export const COLLECTIONS: { id: Collection; label: string; external?: boolean }[] = [
  { id: 'ROMS', label: '연구성과물(ROMS)' },
  { id: 'KOMS', label: '학술논문(KOMS)' },
  { id: 'SAVE', label: '질병재난 아카이브' },
  { id: 'COVID', label: '코로나19 웹자원' },
  { id: 'MESH', label: 'MeSH 사전' },
  { id: 'PUBMED', label: 'PubMed', external: true },
  { id: 'WOS', label: 'Web of Science', external: true },
]

export type SourceDoc = {
  id: string
  collection: Collection
  title: string
  meta: string
  page: number
  scores: { kw: number; vec: number; rerank: number }
  paragraphs: string[]
  passage: number // 하이라이트할 문단 index
  latest?: boolean
  excluded?: boolean // 검색 범위에서 제외된 근거
}

export const DOCS: Record<string, SourceDoc> = {
  mpox5: {
    id: 'mpox5', collection: 'SAVE', title: '엠폭스 대응지침 (제5판)', meta: '질병관리청 · 2025.03 · 버전 5 · 최신판', page: 42, latest: true,
    scores: { kw: 0.82, vec: 0.91, rerank: 0.94 },
    paragraphs: [
      '5. 접촉자 관리',
      '가. 접촉자 분류 — 확진환자의 증상 발생 21일 전부터 격리해제 시까지 접촉한 사람을 대상으로 노출 위험도에 따라 고위험, 중위험, 저위험 접촉자로 분류한다.',
      '나. 관리 방법 — 고위험 접촉자는 마지막 노출일로부터 21일간 증상 발생 여부를 능동감시하며, 감시 기간 중 발열·발진 등 의심 증상 발생 시 즉시 관할 보건소에 신고하도록 안내한다.',
      '다. 격리 — 접촉자에 대한 시설 격리는 원칙적으로 시행하지 않으며, 증상 발현 시 의심환자 기준에 따라 검사 및 격리 조치를 시행한다.',
      '라. 노출 후 예방접종 — 고위험 접촉자에게는 노출 후 4일 이내(최대 14일) 백신 접종을 권고할 수 있다.',
    ],
    passage: 2,
  },
  mpox4: {
    id: 'mpox4', collection: 'SAVE', title: '엠폭스 대응지침 (제4판)', meta: '질병관리청 · 2023.06 · 버전 4 · 개정됨', page: 38,
    scores: { kw: 0.79, vec: 0.84, rerank: 0.71 },
    paragraphs: [
      '5. 접촉자 관리',
      '가. 접촉자 분류 — 확진환자의 증상 발생 21일 전부터 격리해제 시까지 접촉한 사람을 대상으로 한다.',
      '나. 관리 방법 — 고위험 접촉자는 21일간 능동감시, 중·저위험 접촉자는 수동감시를 원칙으로 한다.',
      '다. 확진환자 격리 — 확진환자는 모든 피부 병변의 가피가 탈락하고 새로운 피부가 형성될 때까지 격리를 유지한다.',
    ],
    passage: 3,
  },
  mpoxClin: {
    id: 'mpoxClin', collection: 'ROMS', title: '국내 엠폭스 확진환자의 임상적 특성 및 격리기간 분석', meta: '국립보건연구원 연구보고서 · 2024 · ROMS-2024-0318', page: 17,
    scores: { kw: 0.64, vec: 0.88, rerank: 0.86 },
    paragraphs: [
      '3. 결과',
      '분석 대상 환자의 증상 발현부터 모든 병변의 가피 탈락까지 중앙값은 21일(IQR 17–26일)이었으며, 면역저하자군에서 유의하게 길었다.',
      '피부 병변이 완전히 회복된 이후 채취한 검체에서 바이러스 배양 양성 사례는 확인되지 않아, 병변 회복 기준의 격리해제가 타당한 것으로 판단된다.',
    ],
    passage: 1,
  },
  pubmedMpox: {
    id: 'pubmedMpox', collection: 'PUBMED', title: 'Duration of viral shedding in mpox patients: a systematic review', meta: 'PubMed 외부참조 · 2024 · PMID 0000000 (예시)', page: 4,
    scores: { kw: 0.58, vec: 0.83, rerank: 0.79 },
    paragraphs: [
      'Results',
      'Viral DNA was detected in skin lesion samples for a median of 20 days after symptom onset; replication-competent virus was rarely isolated after crusts had fallen off.',
    ],
    passage: 1,
  },
  t2dRoms: {
    id: 't2dRoms', collection: 'ROMS', title: '한국인 2형 당뇨병 유전체 코호트 기반 위험 유전변이 발굴', meta: '국립보건연구원 연구보고서 · 2025 · ROMS-2025-0142', page: 9,
    scores: { kw: 0.88, vec: 0.9, rerank: 0.93 },
    paragraphs: [
      '요약',
      '한국인유전체역학조사사업(KoGES) 참여자를 대상으로 전장유전체 연관분석(GWAS)을 수행하여 2형 당뇨병과 연관된 신규 유전좌위를 발굴하였다.',
      '발굴된 변이를 반영한 다유전자위험점수(PRS) 상위 10% 군은 하위 군 대비 발병 위험이 유의하게 높았으며, 동아시아인 특이 변이의 기여가 확인되었다.',
      '향후 임상 위험예측 모델 고도화 및 정밀의료 적용을 위한 기반 자료로 활용될 수 있다.',
    ],
    passage: 2,
  },
  t2dKoms: {
    id: 't2dKoms', collection: 'KOMS', title: 'Polygenic risk score and incident type 2 diabetes in Korean adults', meta: 'KOMS 학술논문 · 2024 · MeSH: Diabetes Mellitus, Type 2/genetics', page: 3,
    scores: { kw: 0.71, vec: 0.87, rerank: 0.85 },
    paragraphs: [
      'Abstract',
      'Using a prospective community-based cohort, we evaluated the predictive performance of a polygenic risk score for incident type 2 diabetes.',
      'Adding the PRS to conventional clinical risk factors modestly improved discrimination (C-statistic), particularly among participants younger than 50 years.',
    ],
    passage: 2,
  },
  covid14: {
    id: 'covid14', collection: 'SAVE', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제14판', meta: '질병관리청 · 2024.08 · 버전 14 · 최신판', page: 12, latest: true,
    scores: { kw: 0.9, vec: 0.89, rerank: 0.95 },
    paragraphs: [
      '개정 주요 내용',
      '감염병 위기경보 수준 하향에 따라 확진자 격리 의무를 권고로 전환하고, 감시체계를 전수감시에서 표본감시로 변경하였다.',
      '고위험군(60세 이상, 면역저하자, 감염취약시설 입소자) 중심의 검사·치료 체계를 유지한다.',
    ],
    passage: 1,
  },
  covid13: {
    id: 'covid13', collection: 'SAVE', title: '코로나바이러스감염증-19 대응지침 (지자체용) 제13판', meta: '질병관리청 · 2023.05 · 버전 13 · 개정됨', page: 10,
    scores: { kw: 0.87, vec: 0.86, rerank: 0.9 },
    paragraphs: [
      '개정 주요 내용',
      '확진자 격리기간을 7일에서 5일 권고로 조정하고, 일반 의료기관 중심의 진료 체계로 전환하였다.',
    ],
    passage: 1,
  },
  amrKoms: {
    id: 'amrKoms', collection: 'KOMS', title: '국가 항생제 내성균 감시체계(Kor-GLASS) 운영 결과', meta: 'KOMS 학술논문 · 2025 · 주간 건강과 질병', page: 2,
    scores: { kw: 0.85, vec: 0.83, rerank: 0.88 },
    paragraphs: [
      '서론',
      '국가 항생제 내성균 감시체계는 WHO GLASS 기준에 따라 참여 의료기관의 혈액·소변 검체 분리 균주를 수집하여 내성률을 산출한다.',
      '주요 감시 대상은 대장균, 폐렴막대균, 황색포도알균, 장알균 등이며 카바페넴 내성 비율의 지속 증가가 확인되었다.',
    ],
    passage: 2,
  },
  meshT2d: {
    id: 'meshT2d', collection: 'MESH', title: 'MeSH: Diabetes Mellitus, Type 2 [D003924]', meta: 'MeSH 사전 · Tree C18.452.394.750.149', page: 1,
    scores: { kw: 0.93, vec: 0.66, rerank: 0.6 },
    paragraphs: ['Scope Note', 'A subclass of DIABETES MELLITUS that is not INSULIN-responsive or dependent (NIDDM). It is characterized initially by INSULIN RESISTANCE and HYPERINSULINEMIA.'],
    passage: 1,
  },
}

export type CannedAnswer = { q: string; sources: string[]; answer: string; tag: string }

export const CANNED: CannedAnswer[] = [
  {
    tag: '감염병 지침', q: '엠폭스 고위험 접촉자 관리 기준과 확진자 격리 해제 시점은?',
    sources: ['mpox5', 'mpoxClin', 'mpox4', 'pubmedMpox'],
    answer:
`최신 지침(제5판) 기준으로 정리하면 다음과 같습니다.

**1. 고위험 접촉자 관리**
- 마지막 노출일로부터 **21일간 능동감시**를 시행하며, 발열·발진 등 의심 증상이 생기면 즉시 관할 보건소에 신고하도록 안내합니다 [1].
- 접촉자에 대한 시설 격리는 원칙적으로 시행하지 않고, 증상 발현 시 의심환자 기준에 따라 검사·격리합니다 [1].

**2. 확진자 격리 해제 시점**
- 모든 피부 병변의 가피가 탈락하고 새 피부가 형성될 때까지 격리를 유지합니다 [3].
- 국내 환자 분석에서 증상 발현~가피 탈락 기간의 중앙값은 21일이었고, 병변 회복 이후 배양 양성 사례는 확인되지 않았습니다 [2]. 해외 체계적 문헌고찰도 유사한 결과를 보고합니다 [4].

※ [3]은 이전 판(제4판) 근거로, 제5판에서 해당 조항의 변경 여부를 확인하시기 바랍니다.`,
  },
  {
    tag: '연구성과', q: '한국인 2형 당뇨병 유전체 연구 성과를 요약해줘',
    sources: ['t2dRoms', 't2dKoms', 'meshT2d'],
    answer:
`국립보건연구원의 주요 연구성과를 요약하면 다음과 같습니다.

**핵심 성과**
- 한국인유전체역학조사사업(KoGES) 자료로 GWAS를 수행해 2형 당뇨병 관련 **신규 유전좌위**를 발굴했습니다 [1].
- 이를 반영한 다유전자위험점수(PRS) **상위 10% 군의 발병 위험이 유의하게 높았고**, 동아시아인 특이 변이의 기여가 확인되었습니다 [1].

**임상적 의미**
- 기존 임상 위험요인에 PRS를 추가하면 예측력이 소폭 개선되며, 특히 50세 미만에서 효과가 컸습니다 [2].

관련 MeSH 표목: Diabetes Mellitus, Type 2 (D003924) [3]`,
  },
  {
    tag: '다중문서 비교', q: '코로나19 대응지침(지자체용) 13판과 14판의 주요 차이는?',
    sources: ['covid14', 'covid13'],
    answer:
`두 문서를 병렬 검색하여 비교한 결과입니다.

| 구분 | 제13판 (2023.05) | 제14판 (2024.08) |
|---|---|---|
| 확진자 격리 | 7일 → 5일 권고 [2] | 격리 의무 → 권고 전환 [1] |
| 감시체계 | 전수감시 | 표본감시로 변경 [1] |
| 진료체계 | 일반 의료기관 중심 전환 [2] | 고위험군 중심 검사·치료 유지 [1] |

**요약:** 제14판은 위기경보 하향에 맞춰 격리를 권고로 바꾸고 감시를 표본감시로 전환한 것이 핵심입니다 [1]. 현재 유효한 최신판은 **제14판**입니다.`,
  },
  {
    tag: '감시체계', q: '국가 항생제 내성균 감시체계 주요 감시 대상은?',
    sources: ['amrKoms'],
    answer:
`국가 항생제 내성균 감시체계(Kor-GLASS)는 WHO GLASS 기준에 따라 참여 의료기관의 혈액·소변 검체 분리 균주를 수집해 내성률을 산출합니다 [1].

**주요 감시 대상균**
- 대장균, 폐렴막대균, 황색포도알균, 장알균 등 [1]

최근 결과에서는 **카바페넴 내성 비율의 지속적인 증가**가 확인되었습니다 [1].`,
  },
]

export const SUGGEST_TERMS = [
  '엠폭스 접촉자 관리', '엠폭스 격리 해제 기준', '엠폭스 대응지침 개정 이력',
  '코로나19 대응지침 지자체용', '코로나19 격리기간 변경', '2형 당뇨병 유전체', '2형 당뇨병 다유전자위험점수',
  '항생제 내성 감시체계', '항생제 내성 카바페넴', '결핵 관리지침', '결핵 잠복감염 치료',
  'Diabetes Mellitus, Type 2', 'Mpox (Monkeypox)', 'Drug Resistance, Bacterial',
]

export const PIPELINE = ['질의 분석·전처리', '하이브리드 검색 (마리너4 + 벡터DB)', 'Re-ranking', '컨텍스트 구성', '답변 생성 (로컬 LLM)']
