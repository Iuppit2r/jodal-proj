// 백엔드(RAG API) 연동 전 UI 확인용 목업 응답. 수치·규정은 모두 예시 데이터임.

export type SourceKind = '웹페이지' | 'PDF' | 'HWP' | 'XLSX' | 'API'

export interface Source {
  title: string
  kind: SourceKind
  site: '대표홈페이지' | 'PortWise' | '업무매뉴얼' | '공공데이터포털'
  dept?: string
  updated: string
  url: string
}

export interface BotAnswer {
  text: { ko: string; en: string }
  sources: Source[]
  followups: string[]
  /** 시맨틱 캐시 적중 여부 (유사 질문 재사용) */
  cached?: boolean
  /** 지식그래프에서 따라간 관계 경로 (복합 질의) */
  graph?: string[]
  /** RAG 범위 밖 → 공사 통합검색 결과로 대체 안내 */
  fallback?: { query: string; results: { title: string; path: string }[] }
}

/** RFP 추진내용 '시나리오 다각화': 단순 안내부터 복합 안내, 예측, 다국어, 범위 밖 질문까지 */
export const STARTERS = [
  { cat: '단순 안내', q: '선박 입항료는 어떻게 산정되나요?' },
  { cat: '복합 안내 · 지식그래프', q: '신규 항로 정기 컨테이너선은 입항료 감면을 받을 수 있나요?' },
  { cat: '선박 제원 · PortWise 연동', q: 'HANA GLORY 선박 제원 알려줘' },
  { cat: '대기시간 예측', q: '지금 3부두 선석 대기 선박이 몇 척인가요?' },
  { cat: '다국어 · 외국 선원', q: 'What documents are needed for crew change at Ulsan?' },
  { cat: '범위 밖 질문 · 통합검색 연계', q: '울산 시내 맛집 추천해줘' },
]

/** 첫 화면에 보여 줄 멀티턴 예시 대화 */
export const DEMO_THREAD = ['선박 입항료는 어떻게 산정되나요?', '그럼 신규 항로 정기 컨테이너선은 감면되나요?']

const ANSWERS: { match: RegExp; answer: BotAnswer }[] = [
  {
    match: /감면|신규 항로|인센티브|incentive|discount/i,
    answer: {
      text: {
        ko: `네, **신규 항로를 개설한 정기 컨테이너선**은 「울산항 인센티브 지급 지침」에 따라 입항료를 감면받을 수 있습니다.

- 대상: 울산항에 신규 정기 항로를 개설한 컨테이너 선사
- 감면: 입항료의 **30%** (예시), 항로 개설일로부터 1년간
- 조건: 월 2회 이상 정기 기항 유지

앞서 안내한 입항료 산정식(총톤수 × 톤당 요율)으로 계산한 금액에 감면율이 적용됩니다. 신청은 **마케팅팀**에서 받습니다.`,
        en: `Yes. **Container liners opening a new regular route** can receive an entry-fee reduction under the **Ulsan Port Incentive Guideline**.

- Eligible: container lines opening a new regular route to Ulsan
- Reduction: **30%** of the entry fee (sample) for one year
- Condition: at least two regular calls per month

The rate applies to the fee calculated with the formula above (GT × rate per ton). Applications go to the **Marketing Team**.`,
      },
      graph: ['외항선 입항료', '사용료 규정 제12조', '정기 컨테이너선', '인센티브 지침 제5조', '신규 항로 30% 감면'],
      sources: [
        { title: '2026년 울산항 인센티브 지급 지침', kind: 'HWP', site: '업무매뉴얼', dept: '마케팅팀', updated: '2026-09-23', url: '#' },
        { title: '울산항 항만시설 사용 및 사용료에 관한 규정', kind: 'PDF', site: '대표홈페이지', dept: '항만운영팀', updated: '2026-03-12', url: '#' },
      ],
      followups: ['감면 신청 서류는 무엇인가요?', '9,000GT 컨테이너선 입항료를 계산해 줘', '다른 선종 인센티브도 있나요?'],
    },
  },
  {
    match: /제원|specification|particulars/i,
    answer: {
      text: {
        ko: `**HANA GLORY** 선박 제원과 이번 기항 정보입니다. (PortWise 선박운항정보 · 14:00 기준)

| 항목 | 내용 |
| 호출부호 | DA278 |
| 선종 | 일반화물선 |
| 총톤수 | 8,420 GT |
| 전장 | 99 m |
| 국적 | 대한민국 |
| 배정 선석 | 1부두 1선석 |
| 예측 접안 | 09-30 18:30 (계획 대비 +1.5시간) |

예측 접안 시각은 시계열 모델 결과이며, 이어서 **예상 대기시간**도 물어보실 수 있습니다.`,
        en: `Particulars of **HANA GLORY** for this call (PortWise vessel data, as of 14:00).

| Item | Value |
| Call sign | DA278 |
| Type | General cargo |
| Gross tonnage | 8,420 GT |
| LOA | 99 m |
| Flag | Korea |
| Berth | Pier 1, Berth 1 |
| Forecast berthing | 09-30 18:30 (+1.5 h vs plan) |`,
      },
      sources: [
        { title: 'PortWise 선박운항정보 API', kind: 'API', site: 'PortWise', updated: '2026-09-30 14:00', url: '#' },
        { title: 'PortWise 선석배정현황 API', kind: 'API', site: 'PortWise', updated: '2026-09-30 14:00', url: '#' },
      ],
      followups: ['이 선박의 예상 대기시간은?', '1부두 1선석 다음 일정은?', '입항 신고 절차를 알려줘'],
    },
  },
  {
    match: /crew|선원 교대/i,
    answer: {
      text: {
        ko: `울산항에서 **선원 교대** 시 필요한 서류입니다.

- 선원명부(Crew List): 교대 전후 명단
- 교대 선원 여권 사본 및 선원수첩
- 출입국 관련 신고서: 대리점을 통해 제출

교대 일정은 입항 24시간 전까지 대리점이 신고해야 합니다.`,
        en: `Documents required for a **crew change** at Ulsan Port:

- Crew list before and after the change
- Passport copies and seaman's books of joining/leaving crew
- Immigration report, submitted through the ship's agent

The agent must report the crew change at least 24 hours before arrival.`,
      },
      sources: [
        { title: '선박 입출항 신고 업무 매뉴얼 4장', kind: 'HWP', site: '업무매뉴얼', dept: '항만운영팀', updated: '2026-02-02', url: '#' },
        { title: 'Port Guide (English)', kind: '웹페이지', site: '대표홈페이지', dept: '마케팅팀', updated: '2026-05-10', url: '#' },
      ],
      followups: ['How do I file the entry report?', 'What are the port dues?', 'Where is the immigration office?'],
    },
  },
  {
    match: /입항료|사용료|요금|tariff|fee/i,
    answer: {
      text: {
        ko: `선박 입항료는 **「울산항 항만시설 사용 및 사용료에 관한 규정」**에 따라 선박의 **총톤수(GT)**와 **항로 구분(외항/내항)**을 기준으로 산정됩니다.

- 산정식: 총톤수(GT) × 톤당 요율 × 입항 횟수
- 외항선과 내항선은 요율이 다르게 적용됩니다.
- 위험물 운송선 등 일부 선종은 할증이 적용될 수 있습니다.

| 구분 | 톤당 요율(예시) |
| 외항선 | 105.4원 |
| 내항선 | 23.2원 |

감면 대상(정기 컨테이너선 인센티브 등)은 별도 기준이 있으니 근거 자료의 **인센티브 지침**을 함께 확인해 주세요. 담당: 항만운영팀.`,
        en: `Vessel entry fees are calculated under the **Ulsan Port Facility Usage Fee Regulation**, based on the vessel's **gross tonnage (GT)** and **route type (ocean-going / coastal)**.

- Formula: GT × rate per ton × number of calls
- Different rates apply to ocean-going and coastal vessels.
- Surcharges may apply to certain types such as hazardous cargo carriers.

| Type | Rate per GT (sample) |
| Ocean-going | KRW 105.4 |
| Coastal | KRW 23.2 |

Check the **incentive guideline** in the sources for reductions. Contact: Port Operations Team.`,
      },
      sources: [
        { title: '울산항 항만시설 사용 및 사용료에 관한 규정', kind: 'PDF', site: '대표홈페이지', dept: '항만운영팀', updated: '2026-03-12', url: '#' },
        { title: '2026년 울산항 인센티브 지급 지침', kind: 'HWP', site: '업무매뉴얼', dept: '마케팅팀', updated: '2026-01-05', url: '#' },
        { title: '항만운영 > 항만시설사용료 안내', kind: '웹페이지', site: '대표홈페이지', dept: '항만운영팀', updated: '2026-08-21', url: '#' },
      ],
      followups: ['정기 컨테이너선 입항료 감면 조건은?', '정박료는 어떻게 계산하나요?', '사용료 납부는 어디서 하나요?'],
    },
  },
  {
    match: /선석|대기|부두|berth|waiting/i,
    answer: {
      text: {
        ko: `**2026-09-30 14:00 기준** 울산항 3부두(울산본항) 현황입니다.

- 접안 중: 4척 (3-1 ~ 3-4 선석)
- 정박지 대기: **3척**
- 예측 평균 대기시간: **약 6.4시간** (전주 대비 +1.2시간)

| 선박명 | 대기 위치 | 예측 접안 시각 |
| HANA GLORY | E-1 정박지 | 09-30 18:30 |
| DONGBANG No.7 | E-2 정박지 | 09-30 21:10 |
| PACIFIC STAR | E-1 정박지 | 10-01 02:40 |

예측 접안 시각은 시계열 예측 모델 결과이며 실제 배정과 다를 수 있습니다. 상세 타임라인은 **스케줄 예측** 메뉴에서 확인하세요.`,
        en: `Status of Berth 3 (Ulsan Main Port) **as of 2026-09-30 14:00**.

- At berth: 4 vessels (3-1 to 3-4)
- Waiting at anchorage: **3 vessels**
- Forecast average waiting time: **approx. 6.4 h** (+1.2 h vs last week)

| Vessel | Anchorage | Forecast berthing |
| HANA GLORY | E-1 | 09-30 18:30 |
| DONGBANG No.7 | E-2 | 09-30 21:10 |
| PACIFIC STAR | E-1 | 10-01 02:40 |

Forecasts come from the time-series model and may differ from actual allocation. See **Schedule Forecast** for the full timeline.`,
      },
      sources: [
        { title: 'PortWise 선석배정현황 API', kind: 'API', site: 'PortWise', updated: '2026-09-30 14:00', url: '#' },
        { title: '선박입출항 예정정보(ETA)', kind: 'API', site: '공공데이터포털', updated: '2026-09-30 13:55', url: '#' },
      ],
      followups: ['HANA GLORY 선박 제원을 알려줘', '이번 주 울산항 전체 혼잡도는?', '정박지 신청은 어떻게 하나요?'],
    },
  },
  {
    match: /입항 신고|입출항|신고|procedure|entry/i,
    answer: {
      text: {
        ko: `외항선 입항 신고는 **Port-MIS(항만운영정보시스템)**를 통해 전자 신고합니다.

- 1단계: 입항 예정 24시간 전까지 **입항예정보고** 제출
- 2단계: 선석/정박지 사용 신청 (PortWise 선석운영지원서비스)
- 3단계: 입항 후 **입항신고서** 제출 (선원명부, 화물 목록 첨부)
- 4단계: 검역·세관·출입국 관련 신고 (CIQ)

처음 이용하시는 경우 공사 홈페이지의 **PORT-MIS 교육자료**를 참고하시면 화면별 입력 방법을 확인할 수 있습니다. 입항신고서 작성은 **서식 어시스턴트**에서 PDF를 올리면 자동 추출도 가능합니다.`,
        en: `Entry reports for ocean-going vessels are filed electronically via **Port-MIS**.

- Step 1: Submit the **pre-arrival report** at least 24 h before arrival
- Step 2: Apply for berth/anchorage (PortWise Berth Operation Service)
- Step 3: File the **entry report** after arrival (crew list, cargo manifest)
- Step 4: Quarantine, customs and immigration (CIQ) reports

See the **PORT-MIS training material** on the UPA website. You can also auto-extract entry forms in the **Form Assistant**.`,
      },
      sources: [
        { title: 'PORT-MIS 사용자 교육자료(입출항 신고)', kind: 'PDF', site: '대표홈페이지', dept: 'AI정보실', updated: '2025-11-18', url: '#' },
        { title: '선박 입출항 신고 업무 매뉴얼', kind: 'HWP', site: '업무매뉴얼', dept: '항만운영팀', updated: '2026-02-02', url: '#' },
      ],
      followups: ['입항예정보고 기한을 넘기면 어떻게 되나요?', '선원명부 양식을 받을 수 있나요?', '출항 신고 절차도 알려줘'],
      cached: true,
    },
  },
  {
    match: /채용|신입|recruit|job/i,
    answer: {
      text: {
        ko: `2026년 하반기 **신입직원 공개채용** 일정(공고 기준)입니다.

- 원서 접수: 2026-10-13 ~ 10-24
- 서류 전형 발표: 11-04
- 필기(NCS 직업기초능력 + 전공): 11-15
- 면접: 12월 초 / 최종 합격: 12월 중순

채용 인원, 직렬별 전공 과목 등 상세 내용은 채용공고 원문을 확인해 주세요.`,
        en: `2026 H2 **entry-level recruitment** schedule (per notice):

- Applications: 2026-10-13 ~ 10-24
- Document screening result: 11-04
- Written test (NCS + major): 11-15
- Interview: early Dec / Final: mid Dec

Please check the original notice for positions and subjects.`,
      },
      sources: [
        { title: '2026년 하반기 울산항만공사 신입직원 채용공고', kind: 'PDF', site: '대표홈페이지', dept: '인사팀', updated: '2026-09-22', url: '#' },
        { title: '인재채용 > FAQ', kind: '웹페이지', site: '대표홈페이지', dept: '인사팀', updated: '2026-07-01', url: '#' },
      ],
      followups: ['필기시험 전공 과목은 무엇인가요?', '가점 대상은 어떻게 되나요?', '지난 채용 경쟁률은?'],
    },
  },
]

const FALLBACK: BotAnswer = {
  text: {
    ko: `죄송합니다. 문의하신 내용은 현재 AI가 학습한 **공사 자료 범위에서 근거를 찾지 못해** 정확한 답변을 드리기 어렵습니다.

대신 **울산항만공사 통합검색** 결과를 안내해 드립니다. 추가 문의는 해당 업무 담당 부서로 연락 주세요.`,
    en: `Sorry, I couldn't find grounds for this question **within the official UPA data** I have access to.

Here are results from the **UPA integrated search** instead.`,
  },
  sources: [],
  followups: ['선박 입항료는 어떻게 산정되나요?', '울산항 부두 현황', '입항 신고 절차 안내'],
}

export function getAnswer(question: string): BotAnswer {
  const hit = ANSWERS.find((a) => a.match.test(question))
  if (hit) return hit.answer
  return {
    ...FALLBACK,
    fallback: {
      query: question,
      results: [
        { title: `"${question.slice(0, 20)}" 관련 게시물 (공지사항)`, path: '알림마당 > 공지사항' },
        { title: '울산항 시설현황', path: '항만운영 > 울산항 시설현황' },
        { title: '자주 묻는 질문', path: '고객서비스 > FAQ' },
      ],
    },
  }
}

export interface HistoryItem {
  id: string
  title: string
  date: string
}

export const SEED_HISTORY: HistoryItem[] = [
  { id: 'demo', title: '입항료 산정과 신규 항로 감면', date: '오늘' },
  { id: 'h1', title: '액체화물 부두 정박료 문의', date: '오늘' },
  { id: 'h2', title: '온산항 7번 선석 가용 시간', date: '어제' },
  { id: 'h3', title: 'Crew change procedure at Ulsan', date: '9월 27일' },
  { id: 'h4', title: '항만시설 사용 허가 신청서 양식', date: '9월 25일' },
]
