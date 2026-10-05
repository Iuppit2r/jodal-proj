import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Grade, Round } from '../../../data/types'
import { cx, fmtDate } from '../../../lib/format'
import { Card, Field, Segmented, Toggle, printTarget } from '../../ui'
import { TICKET_FIELDS, type TabProps } from './shared'

/** 바코드 (시연용 CSS 바) */
function Barcode({ value, className }: { value: string; className?: string }) {
  const bars = [...value].flatMap((c, i) => {
    const n = c.charCodeAt(0) + i
    return [1 + (n % 3), 1 + ((n >> 2) % 2)]
  })
  return (
    <div className={cx('flex items-stretch', className)} aria-label={`바코드 ${value}`}>
      {bars.map((w, i) => <span key={i} style={{ width: w * 1.6, background: i % 2 ? 'transparent' : '#111' }} />)}
    </div>
  )
}

export default function TicketLayoutTab({ p, ex, setEx, rounds }: TabProps & { rounds: Round[] }) {
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const L = ex.layout
  const put = (patch: Partial<typeof L>) => setEx({ layout: { ...L, ...patch } })
  const f = (k: string) => L.fields[k] !== false
  const venue = M.venues.find(v => v.id === p.venueId)!
  const r = rounds.find(x => x.active) ?? { date: p.start, time: '11:00', no: 1 }
  const g = (Object.keys(p.prices) as Grade[])[0] ?? 'S'
  const no = `T${M.TODAY.replace(/-/g, '').slice(2)}48213`
  const wide = L.size === 'A4'

  const testPrint = () => {
    log('티켓 레이아웃 테스트 인쇄', `${p.title || p.code} (${wide ? 'A4 쿠폰형' : '감열지 80mm'})`)
    toast('테스트 티켓을 인쇄합니다')
    printTarget()
  }

  const code = L.code === 'qr'
    ? <QRCodeSVG value={`NTCY:${no}:${p.code}`} size={wide ? 96 : 110} level="M" />
    : <div className="text-center"><Barcode value={no} className="h-14" /><div className="mt-1 font-mono text-[10px] tracking-widest">{no}</div></div>

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card title="레이아웃 설정" sub="SFR-TC-010 티켓 디자인">
        <div className="space-y-4">
          <Field label="용지 규격">
            <Segmented value={L.size} onChange={v => put({ size: v })} options={[{ value: '80mm', label: '감열지 80mm' }, { value: 'A4', label: 'A4 쿠폰형' }]} />
          </Field>
          <Field label="입장 코드">
            <Segmented value={L.code} onChange={v => put({ code: v })} options={[{ value: 'qr', label: 'QR코드' }, { value: 'barcode', label: '바코드' }]} />
          </Field>
          <div>
            <div className="label text-[13px]">표시 항목</div>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {TICKET_FIELDS.map(k => (
                <li key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                  {k}
                  <Toggle checked={f(k)} label={`${k} 표시`} onChange={v => put({ fields: { ...L.fields, [k]: v } })} />
                </li>
              ))}
            </ul>
          </div>
          <Field label="유의사항 문구">
            <textarea className="input" rows={3} value={L.notice} onChange={e => put({ notice: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="미리보기" sub={wide ? 'A4 쿠폰형 (210×99mm, 3단 절취)' : '감열지 80mm 롤'}
        actions={<button type="button" className="btn-primary btn-sm" onClick={testPrint}><Printer size={14} />테스트 인쇄</button>}>
        <div className="grid min-h-[420px] place-items-center rounded-xl bg-[repeating-linear-gradient(45deg,#f7f8fb,#f7f8fb_10px,#eef0f5_10px,#eef0f5_20px)] p-4 sm:p-6">
          <div className={cx('print-target bg-white text-ink shadow-xl', wide ? 'flex w-full max-w-[640px] overflow-hidden rounded-md' : 'w-[300px] rounded-sm px-5 py-5 font-mono')}>
            {wide ? (
              <>
                <div className="flex-1 p-5" style={{ borderTop: `6px solid ${p.palette[0]}` }}>
                  <div className="text-[10px] font-bold tracking-widest text-muted">NATIONAL THEATER COMPANY FOR CHILDREN AND YOUTH</div>
                  {f('공연명') && <div className="mt-1 text-xl font-extrabold">{p.title || '공연명'}</div>}
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {f('일시') && <><dt className="text-muted">일시</dt><dd className="font-semibold">{fmtDate(r.date)} {r.time} ({r.no}회)</dd></>}
                    {f('공연장') && <><dt className="text-muted">공연장</dt><dd className="font-semibold">{venue.name}</dd></>}
                    {f('좌석') && <><dt className="text-muted">좌석</dt><dd className="font-semibold">{M.gradeLabel[g]} D열 7번</dd></>}
                    {f('권종') && <><dt className="text-muted">권종</dt><dd className="font-semibold">일반</dd></>}
                    {f('가격') && <><dt className="text-muted">가격</dt><dd className="font-semibold">{(p.prices[g] ?? 0).toLocaleString()}원</dd></>}
                    {f('예매번호') && <><dt className="text-muted">예매번호</dt><dd className="font-mono font-semibold">{no}</dd></>}
                  </dl>
                  {f('유의사항') && <p className="mt-3 border-t border-dashed border-line pt-2 text-[10px] leading-snug text-muted">{L.notice}</p>}
                </div>
                <div className="flex w-40 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-gray-300 p-4" style={{ background: p.palette[0] + '10' }}>
                  {code}
                  <div className="text-[10px] font-bold text-muted">입장권 · 절취선</div>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-[12px] leading-snug">
                <div className="text-center text-[10px] font-bold tracking-widest">국립어린이청소년극단</div>
                <div className="border-y border-dashed border-gray-400 py-2 text-center">
                  {f('공연명') ? <div className="text-base font-extrabold">{p.title || '공연명'}</div> : <div className="text-muted">-</div>}
                  {f('공연장') && <div className="mt-0.5">{venue.name}</div>}
                </div>
                {f('일시') && <div className="flex justify-between"><span>일시</span><b>{r.date.replace(/-/g, '.')} {r.time}</b></div>}
                {f('좌석') && <div className="flex justify-between"><span>좌석</span><b>{M.gradeLabel[g]} D-7</b></div>}
                {f('권종') && <div className="flex justify-between"><span>권종</span><b>일반</b></div>}
                {f('가격') && <div className="flex justify-between"><span>가격</span><b>{(p.prices[g] ?? 0).toLocaleString()}원</b></div>}
                {f('예매번호') && <div className="flex justify-between"><span>예매번호</span><b>{no}</b></div>}
                <div className="grid place-items-center border-t border-dashed border-gray-400 pt-3">{code}</div>
                {f('유의사항') && <p className="border-t border-dashed border-gray-400 pt-2 text-[10px]">{L.notice}</p>}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
