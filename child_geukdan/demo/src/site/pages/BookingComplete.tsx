import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Copy, MessageSquareText, Printer } from 'lucide-react'
import * as M from '../../data/mock'
import { useBookings, useStore, venueOf } from '../../store'
import { fmtDate, won } from '../../lib/format'
import { MobileTicket } from '../parts/ui'
import { ticketTypeOf } from '../parts/perf'

export default function BookingComplete() {
  const { bookingId } = useParams()
  const bookings = useBookings()
  const b = bookings.find(x => x.id === bookingId)
  const perfs = useStore(s => s.performances)
  const rounds = useStore(s => s.rounds)
  const toast = useStore(s => s.toast)
  if (!b) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-lg font-bold">예매 정보를 찾을 수 없습니다.</p>
        <Link to="/site/mypage" className="btn-primary mt-6">마이페이지</Link>
      </div>
    )
  }
  const p = perfs.find(x => x.id === b.perfId)!
  const r = rounds.find(x => x.id === b.roundId)
  const waiting = b.status === '입금대기'
  const base = b.seats.reduce((a, s) => a + (p.prices[s.grade] ?? s.price), 0)
  const copy = (t: string) => { try { navigator.clipboard?.writeText(t) } catch { /* noop */ } toast('복사되었습니다') }

  return (
    <div className="bg-paper py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-mint-500" size={56} />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">{waiting ? '가상계좌가 발급되었습니다' : '예매가 완료되었습니다!'}</h1>
          <p className="mt-2 text-muted">{waiting ? '입금 기한 내에 입금하시면 예매가 확정됩니다.' : '즐거운 관람 되세요. 공연 당일 모바일 티켓으로 바로 입장할 수 있습니다.'}</p>
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-line">
            예매번호 <b className="font-mono tracking-wider text-brand-600">{b.id}</b>
            <button onClick={() => copy(b.id)} aria-label="예매번호 복사" className="text-muted hover:text-ink"><Copy size={14} /></button>
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="card p-5 sm:p-6">
            {waiting && b.vaccount && (
              <div className="mb-5 rounded-xl bg-sun-300/30 p-4 ring-1 ring-sun-400">
                <p className="font-bold">입금 계좌 안내</p>
                <dl className="mt-2 grid grid-cols-[80px_1fr] gap-y-1 text-sm">
                  <dt className="text-muted">은행</dt><dd>{b.vaccount.bank}</dd>
                  <dt className="text-muted">계좌번호</dt><dd className="flex items-center gap-2 font-mono font-bold">{b.vaccount.no}<button onClick={() => copy(b.vaccount!.no)} className="text-muted hover:text-ink" aria-label="계좌번호 복사"><Copy size={13} /></button></dd>
                  <dt className="text-muted">예금주</dt><dd>국립어린이청소년극단</dd>
                  <dt className="text-muted">입금액</dt><dd className="font-bold text-coral-500">{won(b.total)}</dd>
                  <dt className="text-muted">입금기한</dt><dd>{b.vaccount.due}</dd>
                </dl>
              </div>
            )}
            <h2 className="text-lg font-extrabold">{p.title}</h2>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">예매 상세</caption>
              <tbody className="[&_th]:w-24 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-muted [&_td]:py-2 [&_tr]:border-b [&_tr]:border-line">
                <tr><th scope="row">관람일시</th><td>{r ? `${fmtDate(r.date)} ${r.time} (${r.no}회차)` : '-'}</td></tr>
                <tr><th scope="row">장소</th><td>{venueOf(p).name}</td></tr>
                <tr><th scope="row">예매자</th><td>{b.bookerName} · {b.bookerPhone}{b.viewerName ? ` (관람자 ${b.viewerName})` : ''}</td></tr>
                <tr><th scope="row">좌석</th><td>
                  <ul className="space-y-0.5">{b.seats.map(s => <li key={s.seatId}>{s.seatId} · {M.gradeLabel[s.grade]} · {ticketTypeOf(s.ticketTypeId)?.name} <b className="float-right">{won(s.price)}</b></li>)}</ul>
                </td></tr>
                <tr><th scope="row">결제수단</th><td>{b.payMethod} · {b.channel}</td></tr>
                {base - b.seats.reduce((a, s) => a + s.price, 0) > 0 && <tr><th scope="row">권종 할인</th><td className="text-coral-500">-{won(base - b.seats.reduce((a, s) => a + s.price, 0))}</td></tr>}
                {b.couponDiscount > 0 && <tr><th scope="row">쿠폰 할인</th><td className="text-coral-500">-{won(b.couponDiscount)}</td></tr>}
                <tr><th scope="row">예매수수료</th><td>{b.fee ? won(b.fee) : '면제'}</td></tr>
                <tr><th scope="row">{waiting ? '입금 예정액' : '결제금액'}</th><td className="text-lg font-extrabold text-brand-600">{won(b.total)}</td></tr>
              </tbody>
            </table>
            {b.seats.some(s => ticketTypeOf(s.ticketTypeId)?.needsProof) && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">할인 권종으로 예매하셨습니다. 공연 당일 매표소에서 증빙자료(학생증·복지카드 등)를 확인합니다.</p>
            )}
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
              <MessageSquareText size={18} className="mt-0.5 shrink-0" />
              <span>{b.bookerPhone}로 <b>알림톡이 발송되었습니다.</b> 화면 오른쪽 아래 말풍선 버튼에서 수신 내용을 확인할 수 있습니다.</span>
            </p>
          </div>
          <div>
            {waiting ? (
              <div className="card p-5 text-center text-sm text-muted">입금이 확인되면 모바일 티켓(QR)이 발급됩니다.</div>
            ) : <MobileTicket b={b} perf={p} round={r} />}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} />인쇄</button>
              <button className="btn-outline btn-sm" onClick={() => toast('캘린더에 관람 일정이 추가되었습니다')}><CalendarPlus size={14} />캘린더 추가</button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/site/mypage" className="btn-primary px-6 py-3">예매내역 확인</Link>
          <Link to="/site/performances" className="btn-outline px-6 py-3">다른 공연 보기</Link>
          <Link to="/site" className="btn-ghost px-6 py-3">홈으로</Link>
        </div>
      </div>
    </div>
  )
}
