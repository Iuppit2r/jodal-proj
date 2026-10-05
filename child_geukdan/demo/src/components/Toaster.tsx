import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '../store'
import { cx } from '../lib/format'

/** 확인 메시지 (UIR-003) */
export default function Toaster() {
  const toasts = useStore(s => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={cx('pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
          t.tone === 'err' ? 'bg-coral-500' : t.tone === 'warn' ? 'bg-amber-600' : 'bg-ink')}>
          {t.tone === 'err' ? <XCircle size={16} /> : t.tone === 'warn' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-mint-400" />}
          {t.text}
        </div>
      ))}
    </div>
  )
}
