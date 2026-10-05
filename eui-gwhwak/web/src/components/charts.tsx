export const PALETTE = ['#0b5cad', '#0f8b7e', '#e08a1e', '#6b4bb8', '#c0362c', '#7a8594']

type Series = { name: string; color: string; values: number[] }

/** 그룹/누적 막대 차트 */
export function BarChart({ labels, series, height = 220, stacked = false, unit = '' }: { labels: string[]; series: Series[]; height?: number; stacked?: boolean; unit?: string }) {
  const W = 640, H = height, padL = 40, padB = 28, padT = 12, padR = 8
  const totals = labels.map((_, i) => stacked ? series.reduce((s, x) => s + x.values[i], 0) : Math.max(...series.map(x => x.values[i])))
  const max = niceMax(Math.max(...totals, 1))
  const cw = (W - padL - padR) / labels.length
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max]
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`막대 차트: ${series.map(s => s.name).join(', ')}`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? '3 3' : undefined} />
            <text x={padL - 6} y={y(t) + 4} fontSize="10.5" textAnchor="end" fill="var(--text-3)">{fmt(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const x0 = padL + cw * i
          const bw = stacked ? cw * 0.56 : (cw * 0.7) / series.length
          let acc = 0
          return (
            <g key={l}>
              {series.map((s, si) => {
                const v = s.values[i]
                const bx = stacked ? x0 + cw * 0.22 : x0 + cw * 0.15 + bw * si
                const top = stacked ? y(acc + v) : y(v)
                const bottom = stacked ? y(acc) : y(0)
                acc += v
                return (
                  <rect key={s.name} x={bx} y={top} width={Math.max(bw - 2, 2)} height={Math.max(bottom - top, 0)} fill={s.color} rx={2}>
                    <title>{`${l} · ${s.name}: ${v.toLocaleString()}${unit}`}</title>
                  </rect>
                )
              })}
              <text x={x0 + cw / 2} y={H - 8} fontSize="10.5" textAnchor="middle" fill="var(--text-3)">{l}</text>
            </g>
          )
        })}
      </svg>
      {series.length > 1 && <Legend items={series} />}
    </figure>
  )
}

export function LineChart({ labels, series, height = 200, target, unit = '' }: { labels: string[]; series: Series[]; height?: number; target?: { value: number; label: string }; unit?: string }) {
  const W = 640, H = height, padL = 40, padB = 26, padT = 12, padR = 10
  const max = niceMax(Math.max(...series.flatMap(s => s.values), target?.value ?? 0, 1))
  const x = (i: number) => padL + ((W - padL - padR) * i) / Math.max(labels.length - 1, 1)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const ticks = [0, max / 2, max]
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`선 차트: ${series.map(s => s.name).join(', ')}`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? '3 3' : undefined} />
            <text x={padL - 6} y={y(t) + 4} fontSize="10.5" textAnchor="end" fill="var(--text-3)">{fmt(t)}{unit}</text>
          </g>
        ))}
        {target && (
          <g>
            <line x1={padL} x2={W - padR} y1={y(target.value)} y2={y(target.value)} stroke="var(--c-danger)" strokeDasharray="6 4" />
            <text x={W - padR} y={y(target.value) - 5} fontSize="10.5" textAnchor="end" fill="var(--c-danger)" fontWeight="700">{target.label}</text>
          </g>
        )}
        {series.map(s => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={s.color}><title>{`${labels[i]} · ${s.name}: ${v}${unit}`}</title></circle>
            ))}
          </g>
        ))}
        {labels.map((l, i) => (i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1) && (
          <text key={i} x={x(i)} y={H - 7} fontSize="10.5" textAnchor="middle" fill="var(--text-3)">{l}</text>
        ))}
      </svg>
      {series.length > 1 && <Legend items={series} />}
    </figure>
  )
}

export function Donut({ data, size = 160, center }: { data: { name: string; value: number; color: string }[]; size?: number; center?: { value: string; label: string } }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = 60, C = 2 * Math.PI * r
  let off = 0
  return (
    <div className="row" style={{ gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={`도넛 차트: ${data.map(d => `${d.name} ${d.value}`).join(', ')}`}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="22" />
        {data.map(d => {
          const len = (d.value / total) * C
          const el = (
            <circle key={d.name} cx="80" cy="80" r={r} fill="none" stroke={d.color} strokeWidth="22"
              strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 80 80)">
              <title>{`${d.name}: ${d.value.toLocaleString()} (${((d.value / total) * 100).toFixed(1)}%)`}</title>
            </circle>
          )
          off += len
          return el
        })}
        {center && (
          <>
            <text x="80" y="80" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">{center.value}</text>
            <text x="80" y="99" textAnchor="middle" fontSize="11" fill="var(--text-3)">{center.label}</text>
          </>
        )}
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        {data.map(d => (
          <li key={d.name} className="row">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span>{d.name}</span>
            <b style={{ marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>{d.value.toLocaleString()}</b>
            <span className="muted xs">({((d.value / total) * 100).toFixed(1)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <figcaption className="row wrap" style={{ gap: 14, fontSize: 12.5, color: 'var(--text-2)', marginTop: 6, justifyContent: 'center' }}>
      {items.map(i => (
        <span key={i.name} className="row" style={{ gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: i.color }} />{i.name}
        </span>
      ))}
    </figcaption>
  )
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return m * p
}
function fmt(v: number) {
  return v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${+v.toFixed(1)}`
}
