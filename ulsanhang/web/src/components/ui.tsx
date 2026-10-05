import { useId, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'

export function PageHeader({ title, desc, actions, solves }: { title: string; desc?: string; actions?: ReactNode; solves?: string[] }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc">{desc}</p>}
        {solves && (
          <p className="page-solves">
            <span>해결하는 과제</span>
            {solves.map((s) => <span key={s} className="solve-chip">{s}</span>)}
          </p>
        )}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, sub, icon: Icon, actions, children, className = '', bodyClass }: {
  title?: string
  sub?: string
  icon?: LucideIcon
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <div className="stack-sm" style={{ gap: 2 }}>
            <h2 className="card-title">{Icon && <Icon size={16} strokeWidth={2} />}{title}</h2>
            {sub && <p className="card-sub">{sub}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
      {bodyClass === undefined ? children : <div className={bodyClass}>{children}</div>}
    </section>
  )
}

type Trend = { dir: 'up' | 'down' | 'flat'; good: boolean; text: string }

/** 지표 카드 우측의 미니 추세선 */
function Spark({ data, tone }: { data: number[]; tone: 'brand' | 'good' | 'bad' }) {
  const id = useId()
  const w = 88, h = 32, pad = 2
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const color = tone === 'good' ? '#12805c' : tone === 'bad' ? '#c8352f' : '#1a4299'
  return (
    <svg className="stat-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Stat({ label, value, icon: Icon, trend, foot, spark }: { label: string; value: string; icon?: LucideIcon; trend?: Trend; foot?: string; spark?: number[] }) {
  const TrendIcon = trend?.dir === 'up' ? ArrowUpRight : trend?.dir === 'down' ? ArrowDownRight : Minus
  const tone = !trend || trend.dir === 'flat' ? 'brand' : trend.good ? 'good' : 'bad'
  return (
    <div className="card stat">
      <div className="stat-label">{Icon && <Icon size={15} />}{label}</div>
      <div className="stat-main">
        <div className="stat-value">{value}</div>
        {spark && <Spark data={spark} tone={tone} />}
      </div>
      {trend ? (
        <div className={`stat-foot ${trend.dir === 'flat' ? '' : trend.good ? 'trend-good' : 'trend-bad'}`}>
          <TrendIcon size={14} strokeWidth={2.25} />
          {trend.text}
        </div>
      ) : foot ? (
        <div className="stat-foot">{foot}</div>
      ) : null}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

/* ---------- Chart helpers (recharts) ---------- */
export const axis = {
  tick: { fontSize: 12, fill: '#97a1b6', fontFamily: 'inherit' },
  tickLine: false,
  axisLine: false,
} as const
export const grid = { stroke: '#edf1f7', vertical: false } as const

interface TipPayload { name?: string; value?: number | number[]; color?: string; stroke?: string; fill?: string }
export function ChartTip({ active, payload, label, unit = '' }: { active?: boolean; payload?: TipPayload[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{label}</div>
      {payload.map((p) => (
        <div className="chart-tip-row" key={p.name}>
          <i style={{ background: p.color ?? p.stroke ?? p.fill }} />
          {p.name}
          <b>{Array.isArray(p.value) ? `${p.value[0]}~${p.value[1]}` : p.value}{unit}</b>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string; kind?: 'box' | 'line' | 'dash' }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i className={i.kind ?? 'box'} style={{ background: i.color, borderColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
