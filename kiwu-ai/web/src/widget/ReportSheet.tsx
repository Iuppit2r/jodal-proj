import { useState } from 'react'
import { reportWrongAnswer } from '../services/chatService'
import type { BotMessage } from '../types'
import { Sheet } from './Sheet'

const REASONS = ['사실과 다른 내용이에요', '출처가 맞지 않아요', '최신 기준이 반영되지 않았어요', '이해하기 어려워요', '기타']

export function ReportSheet({ message, onClose, onDone }: { message: BotMessage; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await reportWrongAnswer(message.id, reason, detail)
    onDone()
  }

  return (
    <Sheet title="오답 신고" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-lg bg-canvas p-3 text-[13px] text-ink-2">
          <span className="font-bold text-ink">질문</span> · {message.question}
        </p>
        <fieldset>
          <legend className="mb-2 text-sm font-bold">어떤 문제가 있나요?</legend>
          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-sm has-checked:border-brand-strong has-checked:bg-brand-soft">
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-brand-strong" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="report-detail" className="mb-1.5 block text-sm font-bold">
            자세한 내용 <span className="font-normal text-ink-3">(선택)</span>
          </label>
          <textarea
            id="report-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="개인정보는 입력하지 마세요."
            className="w-full resize-none rounded-lg border border-line p-3 text-sm focus:border-navy focus:outline-none"
          />
        </div>
        <p className="text-xs text-ink-3">신고 내용은 관리자 검수를 거쳐 답변 품질 개선에 활용됩니다.</p>
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-brand-strong py-3 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-60"
        >
          {sending ? '보내는 중…' : '신고하기'}
        </button>
      </form>
    </Sheet>
  )
}
