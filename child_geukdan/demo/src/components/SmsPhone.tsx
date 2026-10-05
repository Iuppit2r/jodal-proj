import { useEffect, useRef, useState } from 'react'
import { MessageSquareText, X } from 'lucide-react'
import { useStore } from '../store'
import { cx } from '../lib/format'

/** 시연용: 발송된 알림톡/문자/메일을 휴대폰 모양으로 보여준다 */
export default function SmsPhone() {
  const sms = useStore(s => s.sms)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const last = useRef(sms[0]?.id)
  useEffect(() => {
    if (sms[0] && sms[0].id !== last.current) {
      last.current = sms[0].id
      if (!open) setUnread(u => u + 1)
    }
  }, [sms, open])
  return (
    <div className="no-print fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[300px] overflow-hidden rounded-[28px] border-[6px] border-ink bg-[#b2c7d9] shadow-2xl">
          <div className="flex items-center justify-between bg-ink px-4 py-2 text-xs text-white">
            <span>문자·알림톡 수신함 (시연)</span>
            <button onClick={() => setOpen(false)} aria-label="닫기"><X size={14} /></button>
          </div>
          <div className="flex max-h-[420px] min-h-[200px] flex-col gap-2 overflow-y-auto p-3">
            {sms.length === 0 && <p className="mt-16 text-center text-xs text-gray-600">예매·가입·문의 시 발송되는<br />메시지가 여기에 표시됩니다.</p>}
            {sms.map(m => (
              <div key={m.id} className="max-w-[92%] rounded-xl bg-white p-2.5 text-xs leading-relaxed shadow-sm">
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-gray-500">
                  <span className={cx('chip px-1.5 py-0', m.kind === '알림톡' ? 'bg-sun-300 text-ink' : m.kind === '메일' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100')}>{m.kind}</span>
                  <span>{m.to} · {m.at.slice(11)}</span>
                </div>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0) }}
        className="relative grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-lg hover:scale-105"
        aria-label={`발송 메시지 보기${unread ? ` (새 메시지 ${unread}건)` : ''}`}
      >
        <MessageSquareText size={20} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold">{unread}</span>}
      </button>
    </div>
  )
}
