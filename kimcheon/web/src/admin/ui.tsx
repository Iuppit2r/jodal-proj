import { useState, type ReactNode } from 'react'
import { Download, ShieldAlert, X } from 'lucide-react'
import { useAdmin } from './store'

export function PageHead({ title, desc, req, actions }: { title: string; desc?: string; req?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        {req && <p className="text-[14px] font-bold text-accent">{req}</p>}
        <h1 className="text-[24px] font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-[15px] text-sub">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-extrabold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'accent' | 'forest' }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <p className="text-[14px] font-semibold text-sub">{label}</p>
      <p className={`mt-1 text-[26px] font-black tracking-tight ${tone === 'accent' ? 'text-accent' : tone === 'forest' ? 'text-forest' : ''}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[14px] text-sub">{sub}</p>}
    </div>
  )
}

export function Btn({ children, onClick, kind = 'line', disabled }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'line' | 'danger' | 'ghost'; disabled?: boolean }) {
  const cls =
    kind === 'primary'
      ? 'bg-brand text-white hover:bg-brand-deep'
      : kind === 'danger'
        ? 'border border-[#E8C4B8] bg-white text-[#B5402A] hover:bg-[#FDF3EF]'
        : kind === 'ghost'
          ? 'text-sub hover:bg-alt'
          : 'border border-line bg-white text-ink hover:bg-bg'
  return (
    <button onClick={onClick} disabled={disabled} className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[14px] font-bold whitespace-nowrap transition disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  )
}

export const inputCls = 'h-10 rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'accent' | 'brand' | 'gold' }) {
  const t = {
    gray: 'bg-alt text-sub',
    green: 'bg-forest-50 text-forest',
    accent: 'bg-accent-50 text-[#C24E22]',
    brand: 'bg-brand-50 text-brand',
    gold: 'bg-[#FBF1DC] text-[#94681A]',
  }[tone]
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[14px] font-bold whitespace-nowrap ${t}`}>{children}</span>
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} aria-pressed={on} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-forest' : 'bg-[#C9CCC6]'}`}>
      <i className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

/** 표 – 첫 열은 항상 번호 */
export function Table<T>({
  cols,
  rows,
  rowKey,
  onRow,
  empty = '조회된 내용이 없습니다',
  numbered = true,
  startNo,
  offset = 0,
}: {
  cols: { h: string; w?: string; align?: 'left' | 'center' | 'right'; cell: (r: T, i: number) => ReactNode }[]
  rows: T[]
  rowKey: (r: T, i: number) => string
  onRow?: (r: T) => void
  empty?: string
  numbered?: boolean
  /** 번호를 역순으로 매길 때의 시작 값 */
  startNo?: number
  /** 페이지 넘김 시 번호 시작 위치 */
  offset?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[14px]">
        <thead>
          <tr className="border-b border-line bg-bg text-sub">
            {numbered && <th className="w-16 px-3 py-3 text-center font-bold">번호</th>}
            {cols.map((c) => (
              <th key={c.h} className={`px-3 py-3 font-bold whitespace-nowrap ${c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : 'text-left'}`} style={{ width: c.w }}>
                {c.h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length + 1} className="px-3 py-10 text-center text-sub">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'cursor-pointer hover:bg-bg' : ''}>
              {numbered && <td className="px-3 py-3 text-center font-semibold text-sub">{startNo != null ? startNo - i : offset + i + 1}</td>}
              {cols.map((c) => (
                <td key={c.h} className={`px-3 py-3 ${c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {c.cell(r, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total: number }) {
  if (pages <= 1) return <p className="px-5 py-3 text-[14px] text-sub">총 {total.toLocaleString()}건</p>
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
  return (
    <div className="flex items-center gap-1 border-t border-line px-5 py-3">
      <p className="flex-1 text-[14px] text-sub">총 {total.toLocaleString()}건</p>
      {list.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && list[i - 1] !== p - 1 && <span className="px-1 text-mute">…</span>}
          <button onClick={() => onPage(p)} className={`grid size-9 place-items-center rounded-lg text-[14px] font-bold ${p === page ? 'bg-brand text-white' : 'text-sub hover:bg-alt'}`}>
            {p}
          </button>
        </span>
      ))}
    </div>
  )
}

export function Modal({ title, children, onClose, footer, wide }: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className={`anim-rise max-h-[calc(var(--admin-h,100vh)*0.9)] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-[760px]' : 'max-w-[520px]'} flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center border-b border-line px-6 py-4">
          <h3 className="flex-1 text-[18px] font-extrabold">{title}</h3>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-alt" aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-sub">{hint}</span>}
    </label>
  )
}

// ── 차트 (단일 계열 · 직접 라벨 · 마우스 오버 툴팁) ─────────────────
const BAR = '#1F4434'
const BAR_HOVER = '#F26B3A'

/** 가로 막대 – 순위형 비교 */
export function HBars({ data, unit = '건', max: maxIn }: { data: { label: string; v: number; sub?: string }[]; unit?: string; max?: number }) {
  const max = maxIn ?? Math.max(...data.map((d) => d.v), 1)
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="group grid grid-cols-[112px_1fr_72px] items-center gap-3" title={`${d.label} ${d.v.toLocaleString()}${unit}`}>
          <span className="truncate text-[14px] font-semibold">{d.label}</span>
          <span className="h-5 rounded-r bg-alt/60">
            <span className="block h-full rounded-r transition-colors group-hover:!bg-[var(--hover)]" style={{ width: `${Math.max(1.5, (d.v / max) * 100)}%`, background: BAR, ['--hover' as string]: BAR_HOVER }} />
          </span>
          <span className="text-right text-[14px] font-bold text-sub">
            {d.v.toLocaleString()}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** 세로 막대 – 기간별 추이 */
export function VBars({ data, unit = '', height = 180 }: { data: { label: string; v: number }[]; unit?: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.v), 1)
  return (
    <div>
      <div className="relative flex items-end gap-1.5 border-b border-line" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="w-full rounded-t-[4px] transition-colors" style={{ height: `${(d.v / max) * 100}%`, background: hover === i ? BAR_HOVER : BAR }} />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-white">
                {d.label} · {d.v.toLocaleString()}
                {unit}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 truncate text-center text-[13px] text-sub">
            {data.length > 12 && i % 3 !== 0 ? '' : d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** 꺾은선 – 일별 방문자 */
export function Line({ data, unit = '명', height = 200 }: { data: { label: string; v: number }[]; unit?: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = height
  const max = Math.max(...data.map((d) => d.v)) * 1.1
  const x = (i: number) => (i / (data.length - 1)) * (W - 20) + 10
  const y = (v: number) => H - 24 - (v / max) * (H - 40)
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.v)}`).join(' ')
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="10" x2={W - 10} y1={y(max * g)} y2={y(max * g)} stroke="#E7E5DF" strokeWidth="1" />
        ))}
        <line x1="10" x2={W - 10} y1={H - 24} y2={H - 24} stroke="#C9CCC6" />
        <path d={`${path} L${x(data.length - 1)},${H - 24} L${x(0)},${H - 24} Z`} fill={BAR} opacity=".08" />
        <path d={path} fill="none" stroke={BAR} strokeWidth="2" strokeLinejoin="round" />
        {hover != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1="8" y2={H - 24} stroke="#737B76" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].v)} r="5" fill={BAR_HOVER} stroke="#fff" strokeWidth="2" />
          </>
        )}
        {data.map((_, i) => (
          <rect key={i} x={x(i) - W / data.length / 2} y="0" width={W / data.length} height={H - 24} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      <div className="relative mt-1 h-5">
        {data.map((d, i) =>
          i % 5 === 0 || i === data.length - 1 ? (
            <span key={i} className="absolute text-[13px] text-sub" style={{ left: `${(x(i) / W) * 100}%`, transform: i === data.length - 1 ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)' }}>
              {d.label}
            </span>
          ) : null,
        )}
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-bold text-white" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          {data[hover].label} · {data[hover].v.toLocaleString()}
          {unit}
        </div>
      )}
    </div>
  )
}

/** 개인정보 포함 자료 내려받기 – 사유 입력 후 이력 기록 */
export function DownloadBtn({ menu, rows, label = '엑셀 내려받기', personal = true }: { menu: string; rows: number; label?: string; personal?: boolean }) {
  const { addDownload, flash } = useAdmin()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('민원 처리')
  const [detail, setDetail] = useState('')
  return (
    <>
      <Btn onClick={() => setOpen(true)}>
        <Download size={16} /> {label}
      </Btn>
      {open && (
        <Modal
          title="내려받기 사유 입력"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Btn onClick={() => setOpen(false)}>취소</Btn>
              <Btn
                kind="primary"
                disabled={detail.trim().length < 4}
                onClick={() => {
                  addDownload({ menu, reason, detail, rows })
                  setOpen(false)
                  setDetail('')
                  flash(`${rows.toLocaleString()}건을 내려받았습니다 · 이력이 기록되었습니다`)
                }}
              >
                내려받기
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            {personal && (
              <div className="flex gap-2.5 rounded-lg bg-accent-50 p-3 text-[14px] leading-relaxed text-[#9A3E1B]">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <span>개인정보가 포함된 자료입니다. 이름·연락처는 가려서 내려받으며, 원본이 필요하면 최고관리자 승인이 필요합니다. 내려받은 이력은 「접속 · 작업 이력」에 보관됩니다.</span>
              </div>
            )}
            <Field label="자료">
              <div className={`${inputCls} flex w-full items-center bg-bg`}>
                {menu} · {rows.toLocaleString()}건
              </div>
            </Field>
            <Field label="사유">
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} w-full`}>
                {['민원 처리', '기념품 택배 발송', '통계 보고', '감사 자료 제출', '기타'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="상세 사유" hint="4자 이상 입력해야 내려받을 수 있습니다.">
              <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="예: 10월 신청분 택배 접수" className={`${inputCls} w-full`} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  )
}
