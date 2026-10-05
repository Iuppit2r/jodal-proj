import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, RotateCcw } from 'lucide-react'
import Modal from '../components/Modal'
import { useBookings, useStore, venueOf } from '../store'
import { gradeLabel, hash } from '../data/mock'
import { fmtDate, won } from '../lib/format'
import type { Booking, SeatPick } from '../data/types'
import { seatLabel, ttName } from './lib'

/**
 * 인쇄 전용 영역: body 직속 포털로 렌더하고 인쇄 시 나머지 화면은 숨긴다.
 * (모달·스크롤 컨테이너에 잘리지 않도록 #root 밖에 둔다)
 */
export function PrintPortal({ children }: { children: ReactNode }) {
  return createPortal(
    <div className="pos-print-root print-area">
      <style>{`
        @media screen { .pos-print-root { display: none; } }
        @media print {
          body > *:not(.pos-print-root) { display: none !important; }
          .pos-print-root { display: block !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pos-print-root .tk { break-inside: avoid; page-break-inside: avoid; margin: 0 auto 6mm; }
          @page { margin: 8mm; }
        }
      `}</style>
      {children}
    </div>,
    document.body,
  )
}

/** 바코드 모양 줄무늬 (값 해시로 결정적 생성) */
export function Barcode({ value, height = 34 }: { value: string; height?: number }) {
  const bars = useMemo(() => {
    let h = hash(value)
    const out: number[] = []
    for (let i = 0; i < 46; i++) {
      h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0
      out.push(1 + (h % 3))
    }
    return out
  }, [value])
  return (
    <div className="flex items-stretch" style={{ height }} aria-hidden>
      {bars.map((w, i) => <span key={i} style={{ width: w, marginRight: (i * 7) % 3 === 0 ? 2 : 1, background: i % 2 ? 'transparent' : '#111' }} />)}
    </div>
  )
}

/** 실물 티켓 1매 */
export function Ticket({ booking, seat, reissue }: { booking: Booking; seat: SeatPick; reissue?: boolean }) {
  const perf = useStore(s => s.performances.find(p => p.id === booking.perfId))
  const round = useStore(s => s.rounds.find(r => r.id === booking.roundId))
  if (!perf || !round) return null
  const venue = venueOf(perf)
  const [row, col] = seat.seatId.split('-')
  const code = `${booking.id}|${seat.seatId}`
  return (
    <div className="tk relative flex w-[640px] max-w-full overflow-hidden rounded-xl border border-gray-300 bg-white text-ink shadow-sm" style={{ fontFamily: 'inherit' }}>
      <div className="w-2 shrink-0" style={{ background: `linear-gradient(${perf.palette[0]}, ${perf.palette[2]})` }} />
      <div className="min-w-0 flex-1 px-5 py-4">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-500">
          <span>국립어린이청소년극단 · NATIONAL THEATER COMPANY FOR CHILDREN & YOUTH</span>
          {reissue && <span className="rounded border border-coral-500 px-1 text-coral-500">재발권</span>}
        </div>
        <div className="mt-1.5 truncate text-xl font-extrabold leading-tight">{perf.title}</div>
        <div className="truncate text-[11px] text-gray-500">{perf.titleEn} · {perf.ageLimit}</div>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
          <span className="text-gray-500">일시</span><b>{fmtDate(round.date)} {round.time} ({round.no}회)</b>
          <span className="text-gray-500">장소</span><span>{venue.name}</span>
          <span className="text-gray-500">권종</span><span>{gradeLabel[seat.grade]} · {ttName(seat.ticketTypeId)} · <b>{won(seat.price)}</b></span>
          <span className="text-gray-500">예매번호</span><span className="font-mono">{booking.id}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <Barcode value={code} />
          <div className="text-right">
            <div className="text-[10px] font-semibold text-gray-500">SEAT</div>
            <div className="text-3xl font-black leading-none">{row}<span className="text-base font-bold">열</span> {col}<span className="text-base font-bold">번</span></div>
          </div>
        </div>
        <p className="mt-2 text-[9.5px] leading-snug text-gray-500">
          {perf.incomeDeduction ? '문화비 소득공제 대상 (신용카드·현금영수증 결제분) · ' : ''}공연 시작 후 입장이 제한될 수 있습니다. 본 티켓은 재판매할 수 없으며 분실 시 재발권 수수료가 없습니다.
        </p>
      </div>
      <div className="relative flex w-[150px] shrink-0 flex-col items-center justify-center gap-1.5 border-l-2 border-dashed border-gray-300 px-3 py-4">
        <span className="absolute -left-[9px] -top-[9px] h-4 w-4 rounded-full border border-gray-300 bg-paper" aria-hidden />
        <span className="absolute -bottom-[9px] -left-[9px] h-4 w-4 rounded-full border border-gray-300 bg-paper" aria-hidden />
        <QRCodeSVG value={code} size={96} level="M" />
        <div className="text-center text-[10px] leading-tight">
          <b className="block text-sm">{seatLabel(seat.seatId)}</b>
          {round.date.slice(5).replace('-', '/')} {round.time}
        </div>
        <div className="text-[9px] text-gray-400">입장권(관객용)</div>
      </div>
    </div>
  )
}

/** 티켓 출력 미리보기 + 인쇄 */
export function TicketPrintModal({ bookingId, seatIds, onClose, reissue }: {
  bookingId: string | null; seatIds?: string[]; onClose: () => void; reissue?: boolean
}) {
  const bookings = useBookings()
  const patch = useStore(s => s.patchBooking)
  const toast = useStore(s => s.toast)
  const [reprint, setReprint] = useState(false)
  const b = bookings.find(x => x.id === bookingId)
  if (!bookingId || !b) return null
  const seats = b.seats.filter(s => !s.cancelled && (!seatIds || seatIds.includes(s.seatId)))
  const doPrint = () => setTimeout(() => window.print(), 50)
  const onReissue = () => {
    patch(b.id, {}, `재발권 (${seats.map(s => s.seatId).join(', ')}) / 사유: 출력 불량`)
    setReprint(true)
    toast('재발권 이력을 기록했습니다. 다시 출력합니다.')
    doPrint()
  }
  return (
    <Modal open onClose={onClose} title={`티켓 출력 · ${b.id} (${seats.length}매)`} size="xl" footer={<>
      <button className="btn-outline min-h-11" onClick={onReissue}><RotateCcw size={16} /> 재발권</button>
      <button className="btn-outline min-h-11" onClick={onClose}>닫기</button>
      <button className="btn-primary min-h-11 px-6" onClick={doPrint} autoFocus><Printer size={16} /> 출력</button>
    </>}>
      <div className="space-y-3 rounded-xl bg-paper p-3">
        {seats.map(s => <div key={s.seatId} className="flex justify-center"><Ticket booking={b} seat={s} reissue={reissue || reprint} /></div>)}
      </div>
      <PrintPortal>
        {seats.map(s => <Ticket key={s.seatId} booking={b} seat={s} reissue={reissue || reprint} />)}
      </PrintPortal>
    </Modal>
  )
}
