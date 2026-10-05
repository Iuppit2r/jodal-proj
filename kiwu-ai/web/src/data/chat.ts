import type { Answer, Level, LevelId, Source } from '../types'

// UI 확인용 목업 데이터입니다. 실제 응답은 RAG 엔진 연동 후 지식베이스 근거로 생성됩니다.

export const LEVELS: Level[] = [
  { id: 'U1', short: '쉽게', label: '아주 쉽게', audience: '일반 시민', description: '전문 용어 없이 생활 속 예시로' },
  { id: 'U2', short: '학생', label: '학생 눈높이', audience: '중·고등학생', description: '짧은 문장, 개념 중심으로' },
  { id: 'U3', short: '대학생', label: '개념과 배경', audience: '대학생', description: '제도 배경과 학습 자료까지' },
  { id: 'U4', short: '실무', label: '실무 중심', audience: '중소기업 실무자', description: '절차·서류·소관기관 위주로' },
  { id: 'U5', short: '전문가', label: '전문가 수준', audience: '교직원·연구자', description: '기준 원문과 조항 인용까지' },
]

export const levelById = (id: LevelId) => LEVELS.find((l) => l.id === id)!

export const AI_NOTICE =
  '이 챗봇은 생성형 AI가 ESG 지식베이스를 근거로 답변합니다. 답변에 오류가 있을 수 있으니 중요한 내용은 함께 제공되는 출처 원문을 확인해 주세요. 개인정보(이름, 연락처 등)는 입력하지 마세요.'

export const PRACTICE_DISCLAIMER =
  '이 안내는 일반적인 정보 제공을 위한 것으로 법률 자문이나 인증 결과를 보장하지 않습니다. 실제 진행 시 소관기관 또는 전문가와 확인하세요.'

const SRC: Record<string, Source> = {
  ghgScope3: {
    id: 'ghg-scope3',
    title: 'Corporate Value Chain (Scope 3) Accounting and Reporting Standard',
    publisher: 'GHG Protocol (WRI·WBCSD)',
    version: '2011',
    publishedAt: '2011-09',
    location: 'Chapter 5 · Table 5.3 (Scope 3 범주)',
    excerpt: 'Scope 3 emissions are all indirect emissions (not included in scope 2) that occur in the value chain of the reporting company…',
  },
  ghgCorporate: {
    id: 'ghg-corp',
    title: 'GHG Protocol Corporate Accounting and Reporting Standard',
    publisher: 'GHG Protocol (WRI·WBCSD)',
    version: 'Revised Edition',
    publishedAt: '2004-03',
    location: 'Chapter 4 · Setting Operational Boundaries',
    excerpt: 'Scope 1: Direct GHG emissions… Scope 2: Electricity indirect GHG emissions… Scope 3: Other indirect GHG emissions.',
  },
  gri305: {
    id: 'gri-305',
    title: 'GRI 305: Emissions',
    publisher: 'GRI',
    version: '2016',
    publishedAt: '2016-10',
    location: 'Disclosure 305-3 Other indirect (Scope 3) GHG emissions',
    excerpt: 'The reporting organization shall report the following information: gross other indirect (Scope 3) GHG emissions…',
  },
  kesg: {
    id: 'k-esg',
    title: 'K-ESG 가이드라인 v1.0',
    publisher: '산업통상자원부',
    version: 'v1.0',
    publishedAt: '2021-12',
    location: 'Ⅲ. 진단항목 및 설명',
    excerpt: 'K-ESG 가이드라인은 정보공시(P), 환경(E), 사회(S), 지배구조(G) 4개 영역 61개 진단항목으로 구성…',
  },
  kesgSupply: {
    id: 'k-esg-supply',
    title: 'K-ESG 가이드라인 (공급망 대응)',
    publisher: '산업통상자원부',
    version: '공급망 대응 항목',
    publishedAt: '—',
    location: '공급망 실사 대응 체크리스트',
    excerpt: '협력사가 원청의 공급망 ESG 실사에 대응하기 위해 준비해야 할 핵심 항목을 제시…',
  },
  carbonAct: {
    id: 'carbon-act',
    title: '기후위기 대응을 위한 탄소중립·녹색성장 기본법',
    publisher: '대한민국 (국가법령정보센터)',
    version: '현행',
    publishedAt: '2022-03 시행',
    location: '제27조(관리업체의 온실가스 목표관리) 등',
    excerpt: '정부는 … 온실가스 배출관리업체를 지정하고 … 배출량 명세서를 제출하도록 하여야 한다.',
  },
  kiwuCharter: {
    id: 'kiwu-charter',
    title: '경인여자대학교 ESG 헌장 및 추진체계',
    publisher: '경인여자대학교',
    version: '본교 제공 자료',
    publishedAt: '—',
    location: '대학안내 > ESG 교육경영 > 추진체계',
    excerpt: '본교는 환경·사회·지배구조 전 영역에서 지속가능한 교육경영을 실천하기 위해…',
    url: 'https://www.kiwu.ac.kr/ko/index.do',
  },
}

const SCOPE3_TEXT: Record<LevelId, string> = {
  U1: '기업이 배출하는 온실가스를 세 갈래로 나눌 때, 회사가 직접 태우는 연료(Scope 1)나 사서 쓰는 전기(Scope 2)가 아니라 **원료를 만들고, 제품을 나르고, 소비자가 쓰고 버리는 과정**까지 포함하는 부분이에요.\n\n쉽게 말해 **회사 울타리 밖에서 생기는 배출**이라고 이해하시면 됩니다.',
  U2: '어떤 회사가 물건을 만들 때, 공장에서 나오는 것 말고도 **재료를 만들거나, 배달하거나, 우리가 쓰고 버릴 때**도 온실가스가 나와요.\n\n이렇게 회사 밖에서 생기는 것들을 모아 부르는 말이 **Scope 3**예요.',
  U3: '온실가스 배출은 **직접배출(Scope 1)**, **간접배출(Scope 2)**, **기타 간접배출(Scope 3)**로 구분합니다.\n\nScope 3는 가치사슬 전반에서 발생하는 배출로, **상류**(구매 원료·자본재 등)와 **하류**(제품 사용·폐기 등)의 15개 범주로 나뉩니다. 일반적으로 기업 총배출의 큰 비중을 차지해 최근 지속가능성 공시에서 중요하게 다뤄집니다.',
  U4: 'Scope 3는 가치사슬에서 발생하는 **기타 간접배출**로, 산정·보고 표준에서 상류 8개·하류 7개 범주로 구분합니다.\n\n실무적으로는 아래 순서로 접근합니다. 거래처가 공급망 실사 자료를 요구하는 경우 대개 이 범주의 자료를 요청합니다.',
  U5: 'Scope 3의 정의·범주 구분 및 산정 요구사항은 GHG Protocol Scope 3 Standard(2011) 제5장에서 규정하며, GRI 305-3에서 보고 요구사항을 정합니다.\n\n공시기준상 기후 관련 공시에서 Scope 3 요구 수준과 **경과규정(적용 유예)** 여부를 함께 확인할 필요가 있습니다. 아래에 조항 원문 위치를 함께 제시합니다.',
}

type Script = { match: RegExp; build: (level: LevelId) => Answer }

const SCRIPTS: Script[] = [
  {
    match: /scope\s*3|스코프\s*3/i,
    build: (level) => ({
      kind: 'grounded',
      level,
      text: SCOPE3_TEXT[level],
      steps:
        level === 'U4'
          ? [
              { title: '해당 범주 식별', detail: '15개 범주 중 우리 회사 사업과 관련된 범주를 고릅니다. (예: 구매 원자재, 운송, 출장)' },
              { title: '활동자료 확보', detail: '구매량·운송거리·출장 횟수 등 범주별 데이터를 모읍니다.' },
              { title: '배출계수 적용', detail: '활동자료에 공인 배출계수를 곱해 배출량을 산정합니다.' },
            ]
          : undefined,
      glossary:
        level === 'U1' || level === 'U2'
          ? [{ term: '온실가스', meaning: '지구를 따뜻하게 만드는 기체. 이산화탄소가 대표적이에요.' }]
          : [
              { term: '가치사슬', meaning: '원료 조달부터 생산·유통·사용·폐기까지 이어지는 사업 활동 전체' },
              { term: '배출계수', meaning: '활동 1단위당 배출되는 온실가스 양' },
            ],
      sources: level === 'U1' || level === 'U2' ? [SRC.ghgCorporate, SRC.ghgScope3] : [SRC.ghgScope3, SRC.gri305, SRC.ghgCorporate],
      followUps: ['Scope 1, 2와는 어떻게 다른가요?', '중소기업도 Scope 3를 계산해야 하나요?'],
    }),
  },
  {
    match: /esg가\s*무엇|esg\s*(란|이란|뜻)/i,
    build: (level) => ({
      kind: 'grounded',
      level,
      text:
        level === 'U1' || level === 'U2'
          ? 'ESG는 기업이나 기관이 **돈을 버는 것 말고도 잘 지켜야 하는 세 가지**를 뜻해요.\n\n- **E (환경)**: 쓰레기를 줄이고 에너지를 아껴요.\n- **S (사회)**: 일하는 사람과 이웃을 존중해요.\n- **G (지배구조)**: 회사를 투명하고 공정하게 운영해요.\n\n예를 들어 카페가 일회용 컵 대신 다회용 컵을 쓰는 건 E, 직원에게 공정한 급여를 주는 건 S에 해당해요.'
          : 'ESG는 **환경(Environmental)·사회(Social)·지배구조(Governance)**의 약자로, 기업의 재무 성과 외에 지속가능성을 평가하는 비재무 요소입니다.\n\n- **E**: 기후변화 대응, 온실가스 감축, 자원순환\n- **S**: 인권·노동, 안전보건, 공급망, 지역사회\n- **G**: 이사회 구성, 윤리경영, 정보공시\n\n국내에서는 산업통상자원부의 K-ESG 가이드라인이 정보공시·환경·사회·지배구조 4개 영역의 진단항목을 제시하고 있습니다.',
      sources: [SRC.kesg],
      followUps: ['ESG 관련 자격증이나 진로에는 무엇이 있나요?', '경인여대는 ESG를 어떻게 실천하고 있나요?'],
    }),
  },
  {
    match: /인증.*(받|무엇부터|어떻게)|무엇부터/,
    build: (level) => ({
      kind: 'grounded',
      level,
      text: '중소기업의 ESG 대응은 보통 **자가진단 → 개선 계획 → 외부 평가·인증** 순서로 진행합니다. 아래 단계를 참고하세요.',
      steps: [
        { title: '자가진단', detail: 'K-ESG 가이드라인의 진단항목으로 현재 수준을 점검합니다. 공급망 대응용 간소화 항목부터 시작하면 부담이 적습니다.' },
        { title: '우선 과제 선정', detail: '거래처 요구, 업종 특성을 고려해 개선이 시급한 항목을 고릅니다. (예: 온실가스 배출량 파악, 안전보건 관리)' },
        { title: '증빙 자료 준비', detail: '에너지 사용량, 안전보건 교육 기록, 윤리규정 등 항목별 증빙을 정리합니다.' },
        { title: '지원사업 확인', detail: '중소벤처기업부·지자체·유관기관의 ESG 컨설팅·진단 지원사업을 확인합니다.' },
        { title: '외부 평가·인증 신청', detail: '거래처가 지정한 평가기관 또는 인증 제도의 신청 요건과 일정을 확인해 진행합니다.' },
      ],
      sources: [SRC.kesg, SRC.kesgSupply],
      disclaimer: PRACTICE_DISCLAIMER,
      followUps: ['거래처가 공급망 실사 자료를 요구합니다. 어떻게 대응해야 하나요?', '준비 서류 목록을 알려주세요.'],
    }),
  },
  {
    match: /공급망|실사/,
    build: (level) => ({
      kind: 'inferred',
      level,
      text: '공급망 실사는 원청 기업이 협력사의 **환경·인권·안전 리스크**를 확인하는 절차입니다. 거래처가 요구하는 자료는 보통 **설문(체크리스트) + 증빙 자료** 형태입니다.\n\n요구 항목은 거래처마다 다르므로, 먼저 요청 양식을 확인한 뒤 아래 순서로 준비하시길 권합니다.',
      steps: [
        { title: '요청 양식 확인', detail: '거래처가 보낸 설문 항목과 제출 기한을 확인합니다.' },
        { title: '항목별 담당자 지정', detail: '환경(에너지·배출), 노동·안전, 윤리 항목별로 내부 담당자를 정합니다.' },
        { title: '증빙 수집', detail: '에너지 사용량, 산업안전 기록, 근로계약 관련 규정 등을 모읍니다.' },
      ],
      sources: [SRC.kesgSupply],
      disclaimer: PRACTICE_DISCLAIMER,
      followUps: ['EU 기업 지속가능성 실사지침(CSDDD)이 무엇인가요?'],
    }),
  },
  {
    match: /바뀐|개정|최신/,
    build: (level) => ({
      kind: 'grounded',
      level,
      text: '최근 지식베이스에 반영된 공시기준 관련 변경 사항입니다. 각 항목의 **적용 시점**과 **구·신 기준 비교**는 출처 원문에서 확인할 수 있습니다.\n\n- 국내 지속가능성 공시기준 관련 자료 갱신\n- 기후 관련 공시의 Scope 3 적용 시점 관련 경과규정 확인 필요',
      updatedNotice: '지식베이스 최종 반영: 2026-09-24 · 변경 감지 2건 반영 완료',
      sources: [SRC.gri305],
      followUps: ['구 기준과 신 기준의 차이를 표로 보여주세요.'],
    }),
  },
  {
    match: /탄소중립.*법|법.*의무/,
    build: (level) => ({
      kind: 'grounded',
      level,
      text: '「탄소중립기본법」은 일정 규모 이상의 온실가스를 배출하는 **관리업체**에 대해 배출량 명세서 제출 등 목표관리 의무를 정하고 있습니다. 관리업체 지정 기준과 세부 의무는 동법 시행령에서 확인할 수 있습니다.',
      sources: [SRC.carbonAct],
      disclaimer: PRACTICE_DISCLAIMER,
    }),
  },
  {
    match: /경인여대|경인여자대학교|본교|우리\s*학교/,
    build: (level) => ({
      kind: 'grounded',
      level,
      text: '경인여자대학교는 **ESG 교육경영**을 대학 의제로 운영하고 있습니다. ESG 헌장과 추진체계를 바탕으로 부서별 ESG 목표를 설정하고 실천하고 있습니다.\n\n자세한 내용은 홈페이지 **대학안내 > ESG 교육경영**에서 확인할 수 있습니다.',
      sources: [SRC.kiwuCharter],
      followUps: ['부서별 ESG 목표를 알려주세요.'],
    }),
  },
]

const BLOCKED = /(시발|씨발|병신|개새끼|죽여|자살)/

export function mockAnswer(question: string, level: LevelId): Answer {
  if (BLOCKED.test(question)) {
    return {
      kind: 'blocked',
      level,
      text: '해당 질문에는 답변을 드릴 수 없어요. 서로 존중하는 표현으로 다시 질문해 주세요.\n\n혹시 힘든 일이 있으시다면 **자살예방상담전화 109**(24시간)에서 도움을 받을 수 있어요.',
    }
  }
  if (/날씨|주식|로또|맛집|게임/.test(question)) {
    return {
      kind: 'out-of-scope',
      level,
      text: '저는 **ESG(환경·사회·지배구조)** 관련 질문에 답변하는 챗봇이에요. ESG 개념, 기업의 인증·공시 절차, 관련 기준과 법령, 경인여대의 ESG 활동 등을 물어봐 주세요.',
      followUps: ['ESG가 무엇인가요?', '중소기업인데 ESG 인증을 받으려면 무엇부터 해야 하나요?'],
    }
  }
  const script = SCRIPTS.find((s) => s.match.test(question))
  if (script) return script.build(level)
  return {
    kind: 'unknown',
    level,
    text: '죄송해요. 현재 ESG 지식베이스에서 이 질문에 대한 **근거 자료를 찾지 못했어요.** 근거 없이 추측해서 답변하지 않도록 설계되어 있습니다.\n\n질문을 조금 더 구체적으로 바꾸거나, 아래 추천 질문을 이용해 보세요.',
    followUps: ['ESG가 무엇인가요?', '온실가스 Scope 3가 무엇인가요?'],
  }
}
