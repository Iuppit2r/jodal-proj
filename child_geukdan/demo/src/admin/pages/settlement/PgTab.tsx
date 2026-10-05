import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, Scale, Wrench } from 'lucide-react'
import { useBookings, useStore } from '../../../store'
import { ask, Card, ExportButtons, Kpi, Note, runHeavy, Status } from '../../ui'
import { TODAY, addDays, dayOf, netAmount, num } from '../../lib'
import { cx, won } from '../../../lib/format'
import type { PayMethod } from '../../../data/types'

const METHODS: { m: PayMethod; pg: string; settleDays: number }[] = [
  { m: '신용카드', pg: 'KG이니시스 (카드)', settleDays: 2 },
  { m: '간편결제', pg: 'KG이니시스 (간편결제)', settleDays: 3 },
  { m: '가상계좌', pg: 'KG이니시스 (가상계좌)', settleDays: 1 },
]
const PG_FEE: Record<string, number> = { 신용카드: 0.022, 간편결제: 0.025, 가상계좌: 0 }

interface Row { m: PayMethod; pg: string; sysCnt: number; sysAmt: number; pgCnt: number; pgAmt: number; diff: number; fee: number; due: string; deposited: string | null; mismatchId?: string }

export default function PgTab() {
  const bookings = useBookings()
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [date, setDate] = useState(addDays(TODAY, -1))
  const [runAt, setRunAt] = useState('2026-10-05 06:00')
  const [resolved, setResolved] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const rows = useMemo<Row[]>(() => METHODS.map(({ m, pg, settleDays }) => {
    const list = bookings.filter(b => b.payMethod === m && dayOf(b.createdAt) === date && b.status !== '입금대기')
    const sysAmt = list.reduce((a, b) => a + netAmount(b) + (b.status === '취소완료' ? 0 : b.fee), 0)
    // 시연: 전일 간편결제에서 PG 취소 반영 1건 불일치
    const bad = date === '2026-10-04' && m === '간편결제' ? list.find(b => netAmount(b) > 0) : undefined
    const badAmt = bad ? netAmount(bad) + bad.fee : 0
    const pgCnt = list.length - (bad ? 1 : 0)
    const pgAmt = sysAmt - badAmt
    const due = addDays(date, settleDays)
    return {
      m, pg, sysCnt: list.length, sysAmt, pgCnt, pgAmt, diff: pgAmt - sysAmt, fee: Math.round(pgAmt * PG_FEE[m]),
      due, deposited: due <= TODAY ? due : null, mismatchId: bad?.id,
    }
  }), [bookings, date])

  const total = rows.reduce((a, r) => ({ sys: a.sys + r.sysAmt, pg: a.pg + r.pgAmt, cnt: a.cnt + r.sysCnt }), { sys: 0, pg: 0, cnt: 0 })
  const mism = rows.filter(r => r.diff !== 0 && !resolved[`${date}|${r.m}`])

  const rerun = async () => {
    await runHeavy({ title: 'PG 대사 재실행', message: `${date} 결제분 시스템 원장과 PG 승인내역(${total.cnt}건)을 비교하고 있습니다.`, ms: 1800 })
    setRunAt(`${TODAY} ${new Date().toTimeString().slice(0, 5)}`)
    log('PG 대사 재실행', `${date} / 불일치 ${mism.length}건`)
    toast(mism.length ? `대사 완료 — 불일치 ${mism.length}건 확인 필요` : '대사 완료 — 전 건 일치', mism.length ? 'warn' : 'ok')
  }
  const fix = async (r: Row) => {
    const reason = await ask({
      title: '불일치 조정 처리', tone: 'warn', confirmText: '조정 확정',
      message: <>{r.m} 차액 <b className="text-coral-500">{won(r.diff)}</b>을 조정합니다.<br />원인 예매번호: <span className="font-mono">{r.mismatchId}</span> (PG 취소 승인 / 시스템 결제완료)</>,
      reasonOptions: ['PG 취소 미반영 → 시스템 취소 동기화', '망취소 건 수기 확인', 'PG사 정정 요청'],
    })
    if (reason === null) return
    setResolved({ ...resolved, [`${date}|${r.m}`]: reason })
    log(`PG 대사 불일치 조정(사유: ${reason})`, `${date} ${r.m} ${won(r.diff)}`)
    toast('불일치 조정이 완료되었습니다')
  }
  const toggleDeposit = (r: Row) => {
    const k = `${date}|${r.m}`
    const v = !(checked[k] ?? !!r.deposited)
    setChecked({ ...checked, [k]: v })
    log(v ? 'PG 입금 확인' : 'PG 입금 확인 취소', `${date} ${r.m} ${won(r.pgAmt - r.fee)}`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="시스템 결제금액" value={won(total.sys)} sub={`${num(total.cnt)}건 · ${date}`} icon={<Scale size={18} />} />
        <Kpi label="PG 승인금액" value={won(total.pg)} sub="KG이니시스 정산파일" icon={<Scale size={18} />} tone="ink" />
        <Kpi label="차액" value={won(total.pg - total.sys)} sub={mism.length ? `불일치 ${mism.length}건` : '전 건 일치'} icon={mism.length ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} tone={mism.length ? 'coral' : 'mint'} />
        <Kpi label="최근 대사 실행" value={runAt.slice(11)} sub={`${runAt.slice(0, 10)} · 매일 06:00 자동`} icon={<RefreshCw size={18} />} tone="sun" />
      </div>

      <Card title="PG 대사 (결제수단별)" sub="시스템 결제 원장과 PG사 승인·정산 내역을 비교합니다."
        actions={<>
          <input type="date" className="input w-auto py-1.5 text-sm" value={date} max={TODAY} onChange={e => setDate(e.target.value)} aria-label="대사 일자" />
          <button className="btn-primary btn-sm" onClick={rerun}><RefreshCw size={14} />대사 재실행</button>
          <ExportButtons filename={`PG대사_${date}`} count={rows.length}
            getRows={() => [['결제수단', 'PG', '시스템건수', '시스템금액', 'PG건수', 'PG금액', '차액', '상태', 'PG수수료', '입금예정일', '입금일자'],
              ...rows.map(r => [r.m, r.pg, r.sysCnt, r.sysAmt, r.pgCnt, r.pgAmt, r.diff, r.diff && !resolved[`${date}|${r.m}`] ? '불일치' : '일치', r.fee, r.due, r.deposited ?? ''])]} />
        </>}>
        <div className="tbl-wrap overflow-auto rounded-lg border border-line">
          <table className="tbl">
            <thead>
              <tr>
                <th>결제수단</th><th>PG사</th><th className="text-right">시스템 건수</th><th className="text-right">시스템 금액</th>
                <th className="text-right">PG 건수</th><th className="text-right">PG 금액</th><th className="text-right">차액</th><th>상태</th>
                <th className="text-right">PG 수수료</th><th>입금예정일</th><th>입금일자</th><th className="text-center">입금확인</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const k = `${date}|${r.m}`
                const bad = r.diff !== 0 && !resolved[k]
                const dep = checked[k] ?? !!r.deposited
                return (
                  <tr key={r.m} className={cx(bad && 'bg-red-50 hover:!bg-red-50')}>
                    <td className="font-semibold">{r.m}</td>
                    <td className="text-xs text-muted">{r.pg}</td>
                    <td className="text-right tabular-nums">{num(r.sysCnt)}</td>
                    <td className="text-right tabular-nums">{won(r.sysAmt)}</td>
                    <td className={cx('text-right tabular-nums', bad && 'font-bold text-red-600')}>{num(r.pgCnt)}</td>
                    <td className={cx('text-right tabular-nums', bad && 'font-bold text-red-600')}>{won(r.pgAmt)}</td>
                    <td className={cx('text-right tabular-nums', r.diff ? 'font-bold text-red-600' : 'text-muted')}>{r.diff ? won(r.diff) : '0원'}</td>
                    <td>{bad ? <Status s="불일치" /> : r.diff ? <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">일치(조정)</span> : <Status s="일치" />}</td>
                    <td className="text-right tabular-nums text-muted">{won(r.fee)}</td>
                    <td className="tabular-nums">{r.due}</td>
                    <td className="tabular-nums">{dep ? (r.deposited ?? TODAY) : <span className="text-muted">-</span>}</td>
                    <td className="text-center"><input type="checkbox" checked={dep} onChange={() => toggleDeposit(r)} aria-label={`${r.m} 입금확인`} /></td>
                    <td>{bad && <button className="btn-danger btn-sm" onClick={() => fix(r)}><Wrench size={12} />조정</button>}</td>
                  </tr>
                )
              })}
              <tr className="bg-paper font-bold">
                <td colSpan={2}>합계</td>
                <td className="text-right tabular-nums">{num(total.cnt)}</td><td className="text-right tabular-nums">{won(total.sys)}</td>
                <td /><td className="text-right tabular-nums">{won(total.pg)}</td>
                <td className={cx('text-right tabular-nums', total.pg !== total.sys && 'text-red-600')}>{won(total.pg - total.sys)}</td>
                <td colSpan={6} />
              </tr>
            </tbody>
          </table>
        </div>
        {mism.map(r => (
          <Note key={r.m} tone="err" className="mt-3">
            <b>[E-ST-311] {r.m} 금액 불일치</b> — 예매번호 <span className="font-mono">{r.mismatchId}</span>: PG에서는 승인취소({won(-r.diff)})되었으나 시스템에는 결제완료 상태입니다. 고객 취소 요청 후 망취소가 발생한 것으로 추정되며, [조정] 버튼으로 시스템 취소 동기화 또는 PG 정정 요청을 진행하세요.
          </Note>
        ))}
        <Note className="mt-3">대사 기준: 결제일(D) 승인 건 / 카드 D+2, 간편결제 D+3, 가상계좌 D+1 입금. 시스템 금액은 순결제액(취소·쿠폰 차감) + 예매수수료입니다.</Note>
      </Card>
    </div>
  )
}
