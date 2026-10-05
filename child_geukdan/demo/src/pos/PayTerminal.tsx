import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, Loader2, QrCode } from 'lucide-react'
import Modal from '../components/Modal'
import { won } from '../lib/format'
import type { PayMethod } from '../data/types'

/** 가상 카드/간편결제 단말기 (시연용) */
export default function PayTerminal({ open, amount, method, onApproved, onCancel }: {
  open: boolean; amount: number; method: PayMethod; onApproved: (approval: string) => void; onCancel: () => void
}) {
  const [step, setStep] = useState<'insert' | 'processing' | 'done'>('insert')
  const [approval, setApproval] = useState('')

  useEffect(() => {
    if (!open) return
    const t1 = setTimeout(() => setStep('processing'), 1800)
    const t2 = setTimeout(() => {
      setApproval(String(Math.floor(Math.random() * 90000000) + 10000000))
      setStep('done')
    }, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open])

  const easy = method === '간편결제'
  return (
    <Modal open={open} onClose={step === 'done' ? () => onApproved(approval) : onCancel} title={`${method} 결제 단말기`} size="sm">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-xl bg-ink px-6 py-4 font-mono text-white">
          <div className="text-[11px] text-white/60">결제금액</div>
          <div className="text-3xl font-black tabular-nums">{won(amount)}</div>
        </div>
        {step === 'insert' && (
          <>
            <div className="grid h-20 w-20 animate-pulse place-items-center rounded-2xl bg-brand-50 text-brand-600">
              {easy ? <QrCode size={40} /> : <CreditCard size={40} />}
            </div>
            <p className="text-lg font-bold">{easy ? '고객 결제 QR/바코드를 스캐너에 인식해주세요' : '카드를 IC 단말기에 꽂아주세요'}</p>
            <p className="text-sm text-muted">{easy ? '페이코 · 카카오페이 · 네이버페이 · 삼성페이' : 'IC 우선 · 마그네틱은 IC 불가 카드만'}</p>
            <button className="btn-outline min-h-11" onClick={() => setStep('processing')}>{easy ? '스캔 완료(시뮬레이션)' : '카드 삽입(시뮬레이션)'}</button>
          </>
        )}
        {step === 'processing' && (
          <>
            <Loader2 size={48} className="animate-spin text-brand-600" />
            <p className="text-lg font-bold">승인 요청 중… 카드를 빼지 마세요</p>
            <p className="text-sm text-muted">VAN 승인 서버 통신 중</p>
          </>
        )}
        {step === 'done' && (
          <>
            <CheckCircle2 size={56} className="text-mint-500" />
            <p className="text-xl font-extrabold text-mint-500">승인 완료</p>
            <div className="w-full rounded-lg bg-paper p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">승인번호</span><b className="font-mono">{approval}</b></div>
              <div className="flex justify-between"><span className="text-muted">할부</span><span>일시불</span></div>
              <div className="flex justify-between"><span className="text-muted">카드사</span><span>{easy ? '간편결제(카카오페이)' : '신한카드 ****-1234'}</span></div>
            </div>
            <button className="btn-primary min-h-12 w-full text-base" autoFocus onClick={() => onApproved(approval)}>확인 · 티켓 발권</button>
          </>
        )}
        {step !== 'done' && <button className="btn-ghost min-h-11" onClick={onCancel}>결제 취소</button>}
      </div>
    </Modal>
  )
}
