/** 응답 눈높이 (RFP 부속서 2 · 이용자 유형 U1~U5 기반). 신원 식별이 아닌 '설명 수준' 선택값 */
export type LevelId = 'U1' | 'U2' | 'U3' | 'U4' | 'U5'

export interface Level {
  id: LevelId
  label: string
  short: string
  audience: string
  description: string
}

/** 답변 근거(출처) — FUR-005, 부속서 1의 메타데이터 요건 */
export interface Source {
  id: string
  title: string
  publisher: string
  version: string
  publishedAt: string
  location: string // 조항·페이지 등 원문 위치
  excerpt: string
  url?: string
}

export interface StepItem {
  title: string
  detail: string
}

export type AnswerKind =
  | 'grounded' // 지식베이스 근거 기반
  | 'inferred' // 추론 포함 (명시 필요)
  | 'unknown' // 근거 없음 → 확인 불가 안내
  | 'blocked' // 유해 질의 차단 (FUR-011)
  | 'out-of-scope' // 서비스 범위 밖

export interface GlossaryTerm {
  term: string
  meaning: string
}

export interface Answer {
  kind: AnswerKind
  level: LevelId
  text: string
  steps?: StepItem[]
  glossary?: GlossaryTerm[]
  sources?: Source[]
  followUps?: string[]
  disclaimer?: string // FUR-004 법적 자문 아님 고지
  updatedNotice?: string // 최신 개정 반영 표시 (S-10)
}

export interface UserMessage {
  id: string
  role: 'user'
  text: string
}

export interface BotMessage {
  id: string
  role: 'bot'
  question: string
  answer?: Answer
  pending?: boolean
  feedback?: 'up' | 'down'
  reported?: boolean
}

export type ChatMessage = UserMessage | BotMessage
