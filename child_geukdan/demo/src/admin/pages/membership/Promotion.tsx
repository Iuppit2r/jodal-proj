import { useMemo, useState } from 'react'
import { CalendarClock, Gift, MessageCircle, Pencil } from 'lucide-react'
import Modal from '../../../components/Modal'
import { useStore } from '../../../store'
import { cx } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, Note, ask, errMsg, type Col } from '../../ui'
import { useAdminLocal } from '../../adminStore'
import { TODAY } from '../../lib'
import type { Member, Performance } from '../../../data/types'
import { CouponFields, MessageComposer, smsKind } from '../crm/forms'
import { emptyCoupon, toCoupon, validateCoupon, type CouponDraft } from '../crm/shared'
import { nowHm, usePaidMembers } from './util'

type PS = '진행중' | '예정' | '종료'
const PS_CLS: Record<PS, string> = { 진행중: 'bg-emerald-50 text-emerald-700 ring-emerald-200', 예정: 'bg-brand-50 text-brand-700 ring-brand-200', 종료: 'bg-gray-100 text-gray-500 ring-gray-200' }

const pickPaid = (paid: Member[], t: string) => paid.filter(m => m.status === '정상' && (t === 'all' || m.membership!.tierId === t))

export default function Promotion() {
  const perfs = useStore(s => s.performances)
  const coupons = useStore(s => s.coupons)
  const { issueCoupons, sendSms, log, toast } = useStore.getState()
  const tiers = useAdminLocal(s => s.tiers)
  const paid = usePaidMembers()
  const [editPerf, setEditPerf] = useState<Performance | null>(null)
  const [cTarget, setCTarget] = useState('all')
  const [cp, setCp] = useState<CouponDraft>({ ...emptyCoupon(), name: '유료회원 가을 감사 3,000원 할인', amount: 3000 })
  const [cpErr, setCpErr] = useState<ReturnType<typeof validateCoupon>>({})
  const [mTarget, setMTarget] = useState('all')

  const now = nowHm(TODAY)
  const statusOf = (p: Performance): PS => (now < p.presaleAt! ? '예정' : now < p.openAt ? '진행중' : '종료')
  const presale = useMemo(() => perfs.filter(p => p.presaleAt && p.status !== '임시저장'), [perfs])
  const noPresale = perfs.filter(p => !p.presaleAt && p.end >= TODAY && p.status !== '임시저장').length

  const cMembers = useMemo(() => pickPaid(paid, cTarget), [paid, cTarget])
  const mAll = useMemo(() => pickPaid(paid, mTarget), [paid, mTarget])
  const mMembers = mAll.filter(m => m.marketing)
  const tierName = (t: string) => (t === 'all' ? '전체 유료회원' : `${tiers.find(x => x.id === t)?.name ?? t} 등급`)

  const issued = useMemo(() => {
    const paidIds = new Set(paid.map(m => m.id))
    const g = new Map<string, { name: string; n: number; used: number; until: string }>()
    for (const c of coupons) {
      if (!paidIds.has(c.ownerId)) continue
      const x = g.get(c.name) ?? { name: c.name, n: 0, used: 0, until: c.until }
      x.n++; if (c.usedBookingId) x.used++
      g.set(c.name, x)
    }
    return [...g.values()].sort((a, b) => b.n - a.n)
  }, [coupons, paid])

  const issue = async () => {
    const e = validateCoupon(cp, TODAY)
    setCpErr(e)
    if (Object.keys(e).length) return
    if (!cMembers.length) { toast(errMsg('E-PM-150', '발급 대상 유료회원이 없습니다'), 'warn'); return }
    const r = await ask({ title: '쿠폰 일괄 지급', tone: 'warn', confirmText: `${cMembers.length}명 지급`,
      message: <>「<b>{cp.name}</b>」 쿠폰을 <b>{tierName(cTarget)} {cMembers.length.toLocaleString()}명</b>에게 일괄 지급합니다.</> })
    if (r === null) return
    issueCoupons(cMembers.map(m => m.id), toCoupon(cp))
    toast(`${cMembers.length.toLocaleString()}명에게 「${cp.name}」 쿠폰을 지급했습니다`)
  }

  const presaleCols: Col<Performance>[] = [
    { key: 'title', header: '공연', render: p => <div><div className="font-semibold">{p.title}</div><div className="text-[11px] text-muted">{p.start} ~ {p.end}</div></div>, sort: p => p.title },
    { key: 'presale', header: '선예매 기간', render: p => <span className="tabular-nums">{p.presaleAt} ~ {p.openAt}</span>, sort: p => p.presaleAt! },
    { key: 'open', header: '일반 오픈', render: p => <span className="tabular-nums">{p.openAt}</span>, sort: p => p.openAt },
    { key: 'tiers', header: '대상', render: () => <span className="text-xs">{tiers.filter(t => t.presale).map(t => t.name).join('·') || '-'}</span> },
    { key: 'st', header: '상태', render: p => { const s = statusOf(p); return <span className={cx('chip ring-1 ring-inset', PS_CLS[s])}>{s}</span> }, sort: p => ['진행중', '예정', '종료'].indexOf(statusOf(p)) },
    { key: 'act', header: '', align: 'right', render: p => <button className="btn-ghost btn-sm" onClick={() => setEditPerf(p)}><Pencil size={13} />일정 변경</button> },
  ]

  return (
    <div className="space-y-4">
      <Card title={<span className="flex items-center gap-1.5"><CalendarClock size={15} className="text-brand-600" />선예매 설정 현황</span>}
        sub={`유료회원 선예매는 일반 오픈 전 진행되며, 홈페이지 예매 버튼이 자동 전환됩니다. (선예매 미설정 진행 공연 ${noPresale}편)`}
        actions={<ExportButtons filename="선예매현황" count={presale.length} getRows={() => [['공연', '선예매 시작', '일반 오픈', '상태'], ...presale.map(p => [p.title, p.presaleAt!, p.openAt, statusOf(p)])]} />}>
        <DataTable columns={presaleCols} rows={presale} rowKey={p => p.id} initialSort={{ key: 'presale', dir: 'desc' }} dense />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-1.5"><Gift size={15} className="text-brand-600" />쿠폰 일괄 지급</span>} sub="유료회원 등급별 감사 쿠폰·예매권을 일괄 지급합니다.">
          <div className="space-y-3">
            <Field label="지급 대상" required>
              <select className="input" value={cTarget} onChange={e => setCTarget(e.target.value)}>
                <option value="all">전체 유료회원</option>
                {tiers.map(t => <option key={t.id} value={t.id}>{t.name} 등급</option>)}
              </select>
            </Field>
            <CouponFields value={cp} onChange={setCp} errors={cpErr} />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <span className="text-xs text-muted">지급 대상 <b className="text-ink">{cMembers.length.toLocaleString()}명</b> (정상 회원)</span>
              <button className="btn-primary btn-sm" onClick={issue}><Gift size={14} />일괄 지급</button>
            </div>
            {issued.length > 0 && (
              <div className="tbl-wrap max-h-48 overflow-auto rounded-lg border border-line">
                <table className="tbl [&_td]:py-1.5">
                  <thead><tr><th>유료회원 보유 쿠폰</th><th className="text-right">발급</th><th className="text-right">사용</th><th>유효기간</th></tr></thead>
                  <tbody>{issued.map(x => <tr key={x.name}><td>{x.name}</td><td className="text-right tabular-nums">{x.n}</td><td className="text-right tabular-nums">{x.used}</td><td>~{x.until}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-1.5"><MessageCircle size={15} className="text-brand-600" />유료회원 알림톡 발송</span>}
          actions={<select className="input w-auto py-1 text-xs" value={mTarget} onChange={e => setMTarget(e.target.value)} aria-label="발송 대상">
            <option value="all">전체 유료회원</option>
            {tiers.map(t => <option key={t.id} value={t.id}>{t.name} 등급</option>)}
          </select>}>
          <Note className="mb-3">수신 대상 <b>{mMembers.length.toLocaleString()}명</b> · 마케팅 수신 미동의 {(mAll.length - mMembers.length).toLocaleString()}명은 정보통신망법 제50조에 따라 자동 제외됩니다.</Note>
          <MessageComposer count={mMembers.length} recipientLabel={tierName(mTarget)} variables={['#{이름}', '#{등급}']}
            sample={{ '#{이름}': '김**', '#{등급}': mTarget === 'all' ? '나무' : tiers.find(t => t.id === mTarget)?.name ?? '' }}
            templates={[
              { label: '선예매 오픈 안내', text: '#{이름}님, #{등급} 멤버십 선예매가 시작되었습니다!\n일반 오픈 3일 전, 원하는 좌석을 먼저 만나보세요.' },
              { label: '갱신 안내', text: '#{이름}님, #{등급} 멤버십 만료가 다가옵니다. 지금 갱신하시면 다음 시즌 선예매 혜택이 그대로 이어집니다.' },
              { label: '백스테이지 투어 초대', text: '#{이름}님을 백스테이지 투어에 초대합니다. 무대 뒤 이야기를 직접 만나보세요. (선착순 30명)' },
            ]}
            onSend={({ text, kind, scheduleAt }) => {
              sendSms(`유료회원 ${mMembers.length}명`, (scheduleAt ? `[예약 ${scheduleAt}] ` : '') + text, smsKind(kind))
              log(scheduleAt ? `유료회원 ${kind} 예약 등록 (${scheduleAt})` : `유료회원 ${kind} 발송`, `${tierName(mTarget)} ${mMembers.length}명`)
              toast(scheduleAt ? `예약 발송이 등록되었습니다 (${mMembers.length}명)` : `${mMembers.length.toLocaleString()}명에게 ${kind}을(를) 발송했습니다`)
            }} />
        </Card>
      </div>
      {editPerf && <PresaleModal p={editPerf} onClose={() => setEditPerf(null)} />}
    </div>
  )
}

function PresaleModal({ p, onClose }: { p: Performance; onClose: () => void }) {
  const upsert = useStore(s => s.upsertPerformance)
  const toast = useStore(s => s.toast)
  const [pre, setPre] = useState(p.presaleAt!.replace(' ', 'T'))
  const [open, setOpen] = useState(p.openAt.replace(' ', 'T'))
  const [err, setErr] = useState('')
  const save = () => {
    if (!pre || !open) { setErr(errMsg('E-PM-130', '선예매·일반 오픈 일시를 모두 입력해 주세요')); return }
    if (pre >= open) { setErr(errMsg('E-PM-131', '선예매 시작은 일반 오픈 일시보다 빨라야 합니다')); return }
    upsert({ ...p, presaleAt: pre.replace('T', ' '), openAt: open.replace('T', ' ') })
    toast('선예매 일정을 저장했습니다 · 홈페이지에 즉시 반영됩니다')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={`선예매 일정 변경 – ${p.title}`} size="sm"
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={save}>저장</button></>}>
      <div className="space-y-3">
        <Field label="유료회원 선예매 시작" required><input type="datetime-local" className="input" value={pre} onChange={e => setPre(e.target.value)} /></Field>
        <Field label="일반 예매 오픈" required><input type="datetime-local" className="input" value={open} onChange={e => setOpen(e.target.value)} /></Field>
        {err && <Note tone="err">{err}</Note>}
      </div>
    </Modal>
  )
}
