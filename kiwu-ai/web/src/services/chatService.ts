import { mockAnswer } from '../data/chat'
import type { Answer, LevelId } from '../types'

export interface AskParams {
  question: string
  level: LevelId
  sessionId: string
}

/**
 * 챗봇 API 호출 지점.
 * 현재는 UI 확인용 목업을 반환하며, RAG 엔진 구축 후 이 함수만 실제 API 호출로 교체합니다.
 * (웹·카카오톡 등 채널이 같은 API를 쓰도록 채널 독립 구조 유지 — IR-004)
 */
export async function ask({ question, level }: AskParams): Promise<Answer> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600))
  return mockAnswer(question, level)
}

export async function sendFeedback(_messageId: string, _value: 'up' | 'down'): Promise<void> {}

export async function reportWrongAnswer(_messageId: string, _reason: string, _detail: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
}
