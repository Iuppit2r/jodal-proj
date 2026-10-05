import { Printer } from 'lucide-react'
import Modal from '../../../components/Modal'
import * as M from '../../../data/mock'
import { useStore } from '../../../store'
import { useAdminLocal, type PayStatus, type SettleStatus } from '../../adminStore'
import { printTarget, Status } from '../../ui'
import { TODAY, num } from '../../lib'
import { won } from '../../../lib/format'
import type { SettleRow } from './data'

/** 모달 스크롤 영역에 잘리지 않도록 인쇄 시 해제 */
const STMT_PRINT_CSS = `@media print {
  html.print-only .fixed:has(.print-target) { position: absolute !important; inset: 0 auto auto 0 !important; background: none !important; display: block !important; }
  html.print-only [role="dialog"]:has(.print-target), html.print-only [role="dialog"]:has(.print-target) * { max-height: none !important; overflow: visible !important; box-shadow: none !important; }
}`

const STEP: Record<SettleStatus, number> = { 정산대기: 0, 업체승인대기: 1, 정산완료: 2, 보류: 0 }

export default function Statement({ row, state, onClose }: { row: SettleRow | null; state: { status: SettleStatus; pay: PayStatus }; onClose: () => void }) {
  const info = useAdminLocal(s => s.siteInfo)
  const log = useStore(s => s.log)
  if (!row) return null
  const step = STEP[state.status]
  const signs: [string, string | null][] = [
    ['담당', step >= 1 ? '김하늘' : null],
    ['팀장', step >= 2 ? '이정민' : null],
    ['본부장', step >= 2 ? '박서준' : null],
  ]
  const byGrade = row.lines.reduce<Record<string, { qty: number; amount: number }>>((a, l) => {
    a[l.grade] = a[l.grade] ?? { qty: 0, amount: 0 }
    a[l.grade].qty += l.qty
    a[l.grade].amount += l.amount
    return a
  }, {})
  const onPrint = () => { log('정산서 출력', `${row.title} (${row.id})`); printTarget() }
  const th = 'border border-gray-400 bg-gray-50 px-2 py-1.5 text-left font-semibold'
  const td = 'border border-gray-400 px-2 py-1.5'

  return (
    <Modal open onClose={onClose} title={`정산서 미리보기 · ${row.id}`} size="xl"
      footer={<>
        <span className="mr-auto self-center text-xs text-muted">현재 상태 <Status s={state.status} /> <Status s={state.pay} /></span>
        <button className="btn-outline btn-sm" onClick={onClose}>닫기</button>
        <button className="btn-primary btn-sm" onClick={onPrint}><Printer size={14} />인쇄</button>
      </>}>
      <style>{STMT_PRINT_CSS}</style>
      <div className="print-target mx-auto max-w-[780px] bg-white p-2 text-[12px] leading-relaxed text-black sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <div className="text-[11px] text-gray-600">문서번호 {row.id} · 발행일 {TODAY}</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[0.3em]">공 연 정 산 서</h1>
          </div>
          <table className="shrink-0 border-collapse text-center text-[11px]">
            <tbody>
              <tr>
                <td rowSpan={2} className="w-6 border border-gray-500 bg-gray-50 px-1 font-semibold [writing-mode:vertical-rl]">결재</td>
                {signs.map(([k]) => <td key={k} className="w-16 border border-gray-500 bg-gray-50 py-0.5 font-semibold">{k}</td>)}
              </tr>
              <tr>
                {signs.map(([k, v]) => (
                  <td key={k} className="h-12 border border-gray-500 align-middle">
                    {v ? <span className="inline-block rotate-[-8deg] rounded border-2 border-red-500 px-1 text-[10px] font-bold text-red-600">{v}</span> : ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 text-[11px]">
          <div><b>정산기관</b> {info.name}</div>
          <div><b>사업자등록번호</b> {info.bizNo}</div>
          <div><b>주소</b> {info.addr}</div>
          <div><b>대표전화</b> {info.tel}</div>
        </div>

        <h2 className="mt-4 mb-1 font-bold">1. 공연 정보</h2>
        <table className="w-full border-collapse">
          <tbody>
            <tr><th className={th}>공연명</th><td className={td}>&lt;{row.title}&gt;</td><th className={th}>기획사</th><td className={td}>{row.producer}</td></tr>
            <tr><th className={th}>공연장</th><td className={td}>{row.venue}</td><th className={th}>공연기간</th><td className={td}>{row.perfFrom} ~ {row.perfTo} ({row.rounds}회)</td></tr>
            <tr><th className={th}>정산기간</th><td className={td}>{row.perfFrom} ~ {row.perfTo}</td><th className={th}>수수료율</th><td className={td}>판매금액의 {row.feeRate}% (대관 계약 제7조)</td></tr>
          </tbody>
        </table>

        <h2 className="mt-4 mb-1 font-bold">2. 판매 내역 (권종·등급별)</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr><th className={th}>등급</th><th className={th}>권종</th><th className={th + ' text-right'}>매수</th><th className={th + ' text-right'}>단가</th><th className={th + ' text-right'}>금액</th></tr>
          </thead>
          <tbody>
            {row.lines.length === 0 && <tr><td className={td + ' text-center text-gray-500'} colSpan={5}>판매 실적이 없습니다. (티켓 오픈 전)</td></tr>}
            {row.lines.map((l, i) => (
              <tr key={i}>
                <td className={td}>{M.gradeLabel[l.grade]}</td><td className={td}>{l.ticketType}</td>
                <td className={td + ' text-right'}>{num(l.qty)}</td><td className={td + ' text-right'}>{num(l.unit)}</td><td className={td + ' text-right'}>{num(l.amount)}</td>
              </tr>
            ))}
            {Object.entries(byGrade).map(([g, v]) => (
              <tr key={g} className="bg-gray-50">
                <td className={td + ' font-semibold'} colSpan={2}>{M.gradeLabel[g as keyof typeof M.gradeLabel]} 소계</td>
                <td className={td + ' text-right font-semibold'}>{num(v.qty)}</td><td className={td} /><td className={td + ' text-right font-semibold'}>{num(v.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-4 mb-1 font-bold">3. 정산 금액</h2>
        <table className="w-full border-collapse">
          <tbody>
            <tr><th className={th + ' w-1/3'}>① 총 판매금액 ({num(row.qty)}매)</th><td className={td + ' text-right'}>{won(row.sales)}</td></tr>
            <tr><th className={th}>② 판매수수료 (① × {row.feeRate}%)</th><td className={td + ' text-right'}>{won(row.fee)}</td></tr>
            <tr><th className={th}>③ 지급액 (① − ②)</th><td className={td + ' text-right text-base font-extrabold'}>{won(row.payout)}</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-gray-600">※ 지급액은 정산 확정 후 기획사 승인일로부터 7영업일 이내 지정 계좌로 지급합니다. 카드 결제 취소분은 차기 정산에서 상계 처리합니다.</p>

        <div className="mt-8 flex items-end justify-between">
          <div className="text-[11px] text-gray-600">위 금액을 정산하였음을 확인합니다.<br />{TODAY.replace(/-/g, '. ')}.</div>
          <div className="relative pr-6 text-right">
            <div className="text-base font-bold tracking-widest">{info.name}장</div>
            <span className="absolute -top-4 right-0 grid h-14 w-14 place-items-center rounded-md border-[3px] border-red-500/80 text-center text-[9px] font-bold leading-tight text-red-600/80">
              국립어린이<br />청소년극단<br />장인
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
