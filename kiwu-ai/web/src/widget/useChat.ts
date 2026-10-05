import { useCallback, useRef, useState } from 'react'
import { LEVELS } from '../data/chat'
import { ask } from '../services/chatService'
import type { BotMessage, ChatMessage, LevelId } from '../types'

// 기본 눈높이 — 진입 경로 기반 초기값은 추후 협의
const DEFAULT_LEVEL: LevelId = 'U3'

const uid = () => Math.random().toString(36).slice(2, 10)

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [level, setLevel] = useState<LevelId>(DEFAULT_LEVEL)
  const [busy, setBusy] = useState(false)
  const sessionId = useRef(uid()).current

  const patchBot = (id: string, patch: Partial<BotMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id && m.role === 'bot' ? { ...m, ...patch } : m)))

  const request = useCallback(
    async (question: string, lv: LevelId, botId: string) => {
      setBusy(true)
      try {
        const answer = await ask({ question, level: lv, sessionId })
        patchBot(botId, { answer, pending: false })
      } finally {
        setBusy(false)
      }
    },
    [sessionId],
  )

  const send = useCallback(
    (text: string) => {
      const q = text.trim()
      if (!q || busy) return
      const lv = level
      const botId = uid()
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: q },
        { id: botId, role: 'bot', question: q, pending: true },
      ])
      void request(q, lv, botId)
    },
    [busy, level, request],
  )

  /** 「더 쉽게」「더 자세히」 — 같은 질문을 다른 수준으로 다시 요청 (FUR-003) */
  const shift = useCallback(
    (msg: BotMessage, dir: -1 | 1) => {
      if (busy || !msg.answer) return
      const idx = LEVELS.findIndex((l) => l.id === msg.answer!.level)
      const next = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, idx + dir))].id
      if (next === msg.answer.level) return
      setLevel(next)
      const botId = uid()
      setMessages((prev) => [...prev, { id: botId, role: 'bot', question: msg.question, pending: true }])
      void request(msg.question, next, botId)
    },
    [busy, request],
  )

  const setFeedback = (id: string, feedback: 'up' | 'down') => patchBot(id, { feedback })
  const markReported = (id: string) => patchBot(id, { reported: true, feedback: 'down' })
  const reset = () => {
    setMessages([])
    setLevel(DEFAULT_LEVEL)
  }

  return { messages, level, setLevel, busy, send, shift, setFeedback, markReported, reset }
}
