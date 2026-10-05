import clsx from 'clsx'
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Leaf, Search, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ───────────────────────── Layout ───────────────────────── */

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode // 탭 등 헤더 하단 영역
}) {
  return (
    <div className={clsx('mb-6', children && 'border-b border-zinc-200')}>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string; count?: number; icon?: typeof Check; separated?: boolean }[] // separated: 구분선 뒤 오른쪽 끝에 분리
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center gap-1 overflow-x-auto pb-3 scroll-thin">
      {items.map((it) => {
        const active = it.value === value
        return (
          <div key={it.value} className={clsx('flex shrink-0 items-center gap-1', it.separated && 'ml-auto pl-3')}>
            {it.separated && <span className="mr-2 h-5 w-px bg-zinc-200" aria-hidden />}
            <button
              role="tab"
              aria-selected={active}
              onClick={() => onChange(it.value)}
              className={clsx(
                'flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition',
                active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
              )}
            >
              {it.icon && <it.icon className="size-4" aria-hidden />}
              {it.label}
              {it.count !== undefined && <CountBadge value={it.count} tone={active ? 'strong' : 'neutral'} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  flush = false,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  flush?: boolean // 본문 패딩 없음 (테이블용)
}) {
  return (
    <section className={clsx('rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

/** 관리자 콘솔 로고: lucide 아이콘을 원형 배경에 올린 형태 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={clsx('grid shrink-0 place-items-center rounded-full bg-brand-strong text-white', className)} aria-hidden>
      <Leaf className="size-[52%]" />
    </span>
  )
}

/** 숫자 배지: 원 안에 숫자를 가운데 정렬 (두 자리 이상은 알약 형태로 늘어남) */
export function CountBadge({ value, tone = 'neutral', className }: { value: number; tone?: 'neutral' | 'strong' | 'primary' | 'info'; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[11px] leading-none font-medium tabular-nums',
        tone === 'neutral' && 'bg-zinc-200 text-zinc-700',
        tone === 'strong' && 'bg-zinc-900 text-white',
        tone === 'primary' && 'bg-brand-strong text-white',
        tone === 'info' && 'bg-blue-600 text-white',
        className,
      )}
    >
      {value}
    </span>
  )
}

/* ───────────────────────── Controls ───────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50',
        size === 'md' ? 'h-9 px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
        variant === 'primary' && 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-700',
        variant === 'secondary' && 'border border-zinc-200 bg-white text-zinc-800 shadow-[0_1px_1px_rgba(0,0,0,.04)] hover:bg-zinc-50',
        variant === 'ghost' && 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={clsx('grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900', className)}
    >
      {children}
    </button>
  )
}

export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
      <input
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-8 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 focus:outline-none"
      />
    </label>
  )
}

/** 필터 드롭다운: "라벨 값 ⌄" 형태, 선택되면 채워진 칩과 해제 버튼 */
export function FilterChip({ label, options }: { label: string; options: string[] }) {
  const [value, setValue] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div
        className={clsx(
          'flex h-8 items-center rounded-lg border text-xs transition',
          value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300',
        )}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label} 필터: ${value ?? '전체'}`}
          onClick={() => setOpen(!open)}
          className={clsx('flex h-full items-center gap-1.5 pl-2.5', value ? 'pr-1' : 'pr-2')}
        >
          <span className={value ? 'text-zinc-300' : 'text-zinc-500'}>{label}</span>
          <span className="font-medium">{value ?? '전체'}</span>
          {!value && <ChevronDown className={clsx('size-3.5 text-zinc-400 transition', open && 'rotate-180')} aria-hidden />}
        </button>
        {value && (
          <button type="button" aria-label={`${label} 필터 해제`} onClick={() => setValue(null)} className="mr-1 grid size-5 place-items-center rounded-full text-zinc-300 hover:bg-white/15 hover:text-white">
            <X className="size-3" />
          </button>
        )}
      </div>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute top-full left-0 z-30 mt-1 max-h-72 min-w-44 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg scroll-thin">
          {[null, ...options].map((o) => (
            <li key={o ?? '전체'} role="option" aria-selected={value === o}>
              <button
                type="button"
                onClick={() => {
                  setValue(o)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              >
                {o ?? '전체'}
                {value === o && <Check className="size-3.5" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 바깥 클릭·Esc로 닫히는 팝오버용 */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

/* ───────────────────────── Date range ───────────────────────── */

export type DateRange = { from: Date; to: Date }
const DAY = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime()
export const fmtDate = (d: Date) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

/** 기간 선택: 빠른 선택(최근 N일) + 달력에서 시작일·종료일 클릭 */
export function DateRangePicker({
  value,
  onChange,
  today,
  presets = [7, 14, 30],
}: {
  value: DateRange
  onChange: (r: DateRange) => void
  today: Date
  presets?: number[]
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss(open, close)
  const [month, setMonth] = useState(() => new Date(value.to.getFullYear(), value.to.getMonth(), 1))
  const [draft, setDraft] = useState<Date | null>(null) // 시작일만 고른 상태
  const [hover, setHover] = useState<Date | null>(null)
  const max = startOfDay(today)

  const toggle = () => {
    if (!open) {
      setMonth(new Date(value.to.getFullYear(), value.to.getMonth(), 1))
      setDraft(null)
    }
    setOpen(!open)
  }
  const pick = (d: Date) => {
    if (!draft) return setDraft(d)
    const [from, to] = d < draft ? [d, draft] : [draft, d]
    onChange({ from, to })
    setDraft(null)
    setOpen(false)
  }
  const preset = (n: number) => {
    onChange({ from: new Date(max.getTime() - (n - 1) * DAY), to: max })
    setOpen(false)
  }

  const lead = month.getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const lo = draft ? (hover && hover < draft ? hover : draft) : value.from
  const hi = draft ? (hover && hover > draft ? hover : draft) : value.to
  const nextDisabled = new Date(month.getFullYear(), month.getMonth() + 1, 1) > max
  const activePreset = presets.find((n) => sameDay(value.to, max) && Math.round((value.to.getTime() - value.from.getTime()) / DAY) + 1 === n)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-[0_1px_1px_rgba(0,0,0,.04)] hover:bg-zinc-50"
      >
        <CalendarRange className="size-4 text-zinc-500" aria-hidden />
        <span className="tabular-nums">{fmtDate(value.from)} ~ {fmtDate(value.to)}</span>
        <ChevronDown className={clsx('size-3.5 text-zinc-400 transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div role="dialog" aria-label="기간 선택" className="anim-pop absolute top-full right-0 z-40 mt-1 flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg max-sm:flex-col">
          <ul className="flex gap-1 border-zinc-100 bg-zinc-50/60 p-2 sm:w-28 sm:flex-col sm:border-r max-sm:border-b">
            {presets.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => preset(n)}
                  className={clsx('w-full rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap', activePreset === n ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100')}
                >
                  최근 {n}일
                </button>
              </li>
            ))}
          </ul>

          <div className="w-72 p-3">
            <div className="mb-2 flex items-center justify-between">
              <IconButton label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="size-4" />
              </IconButton>
              <p className="text-sm font-semibold tabular-nums">{month.getFullYear()}년 {month.getMonth() + 1}월</p>
              <IconButton label="다음 달" disabled={nextDisabled} className="disabled:opacity-30" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                <ChevronRight className="size-4" />
              </IconButton>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-zinc-400" aria-hidden>
              {WEEK.map((w) => <span key={w} className="py-1">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHover(null)}>
              {cells.map((d, i) => {
                if (!d) return <span key={`e${i}`} />
                const disabled = d > max
                const edge = sameDay(d, lo) || sameDay(d, hi)
                const inside = d > lo && d < hi
                return (
                  <button
                    key={d.getDate()}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(d)}
                    onMouseEnter={() => setHover(d)}
                    aria-label={fmtDate(d)}
                    aria-pressed={edge || inside}
                    className={clsx(
                      'grid h-9 place-items-center text-sm tabular-nums transition disabled:text-zinc-300',
                      inside && 'bg-zinc-100 text-zinc-900',
                      edge ? 'rounded-full bg-zinc-900 font-medium text-white' : !inside && 'rounded-full text-zinc-700 enabled:hover:bg-zinc-100',
                    )}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{draft ? '종료일을 선택하세요' : '시작일을 선택하세요'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── Export menu ───────────────────────── */

const EXPORT_FORMATS = [
  { id: 'csv', label: 'CSV', desc: '쉼표로 구분된 텍스트 (.csv)', icon: FileText, tone: 'bg-sky-50 text-sky-700' },
  { id: 'xlsx', label: 'Excel', desc: '엑셀 통합 문서 (.xlsx)', icon: FileSpreadsheet, tone: 'bg-emerald-50 text-emerald-700' },
] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]['id']

/** 내보내기 버튼 하나에서 파일 형식을 선택 */
export function ExportMenu({ onExport }: { onExport: (format: ExportFormat, label: string) => void }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss(open, close)
  return (
    <div ref={ref} className="relative">
      <Button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Download className="size-4" aria-hidden />
        내보내기
        <ChevronDown className={clsx('size-3.5 text-zinc-400 transition', open && 'rotate-180')} aria-hidden />
      </Button>
      {open && (
        <ul role="menu" aria-label="내보내기 형식" className="anim-pop absolute top-full right-0 z-40 mt-1 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
          {EXPORT_FORMATS.map((f) => (
            <li key={f.id} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onExport(f.id, f.label)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-100"
              >
                <span className={clsx('grid size-9 shrink-0 place-items-center rounded-full', f.tone)}>
                  <f.icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-900">{f.label}</span>
                  <span className="block text-xs text-zinc-500">{f.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-8 items-center rounded-lg bg-zinc-100 p-0.5">
      {items.map((it) => (
        <button
          key={it.value}
          role="radio"
          aria-checked={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx(
            'h-7 rounded-md px-2.5 text-xs font-medium transition',
            value === it.value ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, defaultChecked, description }: { label: string; defaultChecked?: boolean; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-zinc-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input type="checkbox" role="switch" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-zinc-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-900" />
        <span className="absolute left-0.5 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

export const inputCls =
  'h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 focus:outline-none'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}

/* ───────────────────────── Data display ───────────────────────── */

const TONES = {
  neutral: { pill: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-400' },
  good: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  warn: { pill: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  bad: { pill: 'bg-red-50 text-red-700 ring-red-600/15', dot: 'bg-red-500' },
  info: { pill: 'bg-blue-50 text-blue-700 ring-blue-600/15', dot: 'bg-blue-500' },
} as const
export type Tone = keyof typeof TONES

export function Badge({ tone = 'neutral', dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-transparent ring-inset', TONES[tone].pill)}>
      {dot && <span className={clsx('size-1.5 rounded-full', TONES[tone].dot)} aria-hidden />}
      {children}
    </span>
  )
}

export function Table({ head, children, minWidth = 720 }: { head: ReactNode[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/70">
            {head.map((h, i) => (
              <th key={i} scope="col" className="h-9 px-4 text-xs font-medium whitespace-nowrap text-zinc-500 first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  )
}

export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <td className={clsx('h-12 px-4 align-middle first:pl-5 last:pr-5', className)}>{children}</td>
)

export function Checkbox({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="size-4 rounded border-zinc-300 accent-zinc-900"
    />
  )
}

/** 단일 계열 영역 차트: 크로스헤어 + 툴팁 호버, 표 보기 전환 (dataviz: one hue, 2px line, recessive grid) */
export function AreaChart({
  data,
  height = 240,
  format = (v: number) => v.toLocaleString(),
  caption,
}: {
  data: { label: string; value: number }[]
  height?: number
  format?: (v: number) => string
  caption: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value))
  const step = Math.pow(10, Math.floor(Math.log10(max || 1)))
  const top = Math.ceil(max / step) * step || 1
  const ticks = [top, top / 2, 0]
  const x = (i: number) => (i / (data.length - 1)) * 100
  const y = (v: number) => 100 - (v / top) * 100
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const area = `0,100 ${line} 100,100`
  const labelEvery = Math.ceil(data.length / 6)

  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-right text-[11px] text-zinc-400 tabular-nums" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{format(t)}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <div key={t} className={clsx('border-t', t === 0 ? 'border-zinc-200' : 'border-zinc-100')} />
            ))}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity=".16" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#area-fill)" />
            <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {hover !== null && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-px bg-zinc-300" style={{ left: `${x(hover)}%` }} />
              <div
                className="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
                style={{ left: `${x(hover)}%`, top: `${y(data[hover].value)}%` }}
              />
              <div
                className={clsx('pointer-events-none absolute top-0 z-10 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-lg', x(hover) > 70 ? '-translate-x-[calc(100%+10px)]' : 'translate-x-2.5')}
                style={{ left: `${x(hover)}%` }}
              >
                <p className="text-zinc-500">{data[hover].label}</p>
                <p className="font-semibold text-zinc-900 tabular-nums">{format(data[hover].value)}</p>
              </div>
            </>
          )}
          <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div key={d.label} className="h-full flex-1" onMouseEnter={() => setHover(i)} role="img" aria-label={`${d.label} ${format(d.value)}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 ml-9 flex justify-between text-[11px] text-zinc-400" aria-hidden>
        {data.filter((_, i) => i % labelEvery === 0).map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </figure>
  )
}

/** 단일 계열 가로 막대: 값은 텍스트 토큰으로 직접 표기 */
export function HBarList({ data, unit = '' }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <ul className="space-y-1">
      {data.map((d) => (
        <li key={d.label} className="relative flex h-8 items-center justify-between gap-3 px-2.5 text-sm">
          <span className="absolute inset-y-0 left-0 rounded-md bg-blue-50" style={{ width: `${(d.value / max) * 100}%` }} aria-hidden />
          <span className="relative truncate text-zinc-700">{d.label}</span>
          <span className="relative shrink-0 font-medium text-zinc-900 tabular-nums">
            {d.value.toLocaleString()}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ───────────────────────── Overlays ───────────────────────── */

function useOverlay(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [onClose])
  return ref
}

export function Drawer({
  title,
  description,
  onClose,
  children,
  footer,
  width = 520,
}: {
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const ref = useOverlay(onClose)
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="drawer-in absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl outline-none sm:border-l sm:border-zinc-200"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {description && <div className="mt-1 text-sm text-zinc-500">{description}</div>}
          </div>
          <IconButton label="닫기" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scroll-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50/60 px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useOverlay(onClose)
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="anim-pop relative flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl outline-none">
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        <div className="overflow-y-auto px-6 pb-5 scroll-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-200 bg-zinc-50/60 px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ───────────────────────── Toast ───────────────────────── */

const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const push = useCallback((msg: string) => {
    const id = Date.now()
    setItems((p) => [...p, { id, msg }])
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 2800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="anim-pop flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2.5 text-sm text-white shadow-lg">
            <Check className="size-4 text-emerald-400" aria-hidden />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
