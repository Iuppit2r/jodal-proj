import { useEffect, useMemo, useRef, useState } from 'react'
import { CANDIDATES, FIXED_SITES, MUTATION_SITES, WT_SEQ, type Candidate } from '../data/mock'

/* ---------------- 3D 구조 뷰어 ---------------- */
type ColorMode = 'plddt' | 'chain' | 'conservation'

function ribbonPath(seed: number, turns: number) {
  let s = seed * 7919
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483647) / 2147483647)
  const pts: [number, number][] = []
  for (let i = 0; i <= turns; i++) {
    const t = (i / turns) * Math.PI * 2 * 2.4
    const r = 46 + Math.sin(t * 1.7 + seed) * 22 + rnd() * 10
    pts.push([150 + Math.cos(t) * r, 120 + Math.sin(t * 1.25) * r * 0.74])
  }
  return pts
}

function smooth(pts: [number, number][]) {
  if (!pts.length) return ''
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    d += ` Q ${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`
  }
  return d
}

const PLDDT_COLORS = ['#0b5cd5', '#4fc3f7', '#ffd54f', '#ff8a65']
const CHAIN_COLORS = ['#34d399', '#60a5fa', '#f472b6']
const CONS_COLORS = ['#7c3aed', '#a78bfa', '#ddd6fe', '#f3f4f6']

export function StructureViewer({ label, seed = 3, height = 300, overlay }: {
  label: string; seed?: number; height?: number; overlay?: string
}) {
  const [mode, setMode] = useState<ColorMode>('plddt')
  const [rot, setRot] = useState(0)
  const [zoom, setZoom] = useState(1)
  const drag = useRef<number | null>(null)

  const chains = useMemo(() => [ribbonPath(seed, 60), ribbonPath(seed + 4, 44)], [seed])
  const palette = mode === 'plddt' ? PLDDT_COLORS : mode === 'chain' ? CHAIN_COLORS : CONS_COLORS
  const legend = mode === 'plddt'
    ? ['>90 매우 높음', '70~90 높음', '50~70 보통', '<50 낮음']
    : mode === 'chain' ? ['Chain A', 'Chain B', 'Ligand'] : ['보존 tier70', 'tier50', 'tier30', '가변']

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="seg">
          {(['plddt', 'chain', 'conservation'] as ColorMode[]).map(m => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {m === 'plddt' ? 'pLDDT' : m === 'chain' ? 'Chain' : '보존도'}
            </button>
          ))}
        </div>
        <div className="sp" />
        <button className="btn sm" onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}>＋</button>
        <button className="btn sm" onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}>－</button>
        <button className="btn sm" onClick={() => { setRot(0); setZoom(1) }}>초기화</button>
      </div>
      <div
        className="viewer"
        style={{ height }}
        onPointerDown={e => { drag.current = e.clientX }}
        onPointerMove={e => { if (drag.current !== null) { setRot(r => r + (e.clientX - drag.current!) * 0.4); drag.current = e.clientX } }}
        onPointerUp={() => { drag.current = null }}
        onPointerLeave={() => { drag.current = null }}
      >
        <span className="vh">{label}{overlay ? `  ·  overlay: ${overlay}` : ''}</span>
        <svg viewBox="0 0 300 240" width="100%" height="100%" style={{ display: 'block' }}>
          <g transform={`translate(150 120) rotate(${rot * 0.15}) scale(${zoom}) translate(-150 -120)`}>
            {overlay && (
              <path d={smooth(ribbonPath(seed + 11, 56))} fill="none" stroke="#94a3b8" strokeWidth="5"
                strokeLinecap="round" opacity=".35" strokeDasharray="7 5" />
            )}
            {chains.map((pts, ci) => {
              const seg = Math.ceil(pts.length / palette.length)
              return palette.map((c, i) => {
                const slice = pts.slice(i * seg, (i + 1) * seg + 1)
                if (slice.length < 2) return null
                return (
                  <path key={`${ci}-${i}`} d={smooth(slice)} fill="none"
                    stroke={mode === 'chain' ? palette[ci % palette.length] : c}
                    strokeWidth={ci === 0 ? 7 : 5} strokeLinecap="round" opacity={ci === 0 ? 0.95 : 0.6} />
                )
              })
            })}
            {MUTATION_SITES.slice(0, 6).map((s, i) => {
              const p = chains[0][(s * 7) % chains[0].length]
              return <circle key={s} cx={p[0]} cy={p[1]} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1"
                opacity={0.9 - i * 0.05} />
            })}
          </g>
        </svg>
        <div className="legend">
          {legend.map((l, i) => (
            <span key={l}><i style={{ background: palette[i] }} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- 산점도 ---------------- */
/* 차트 컨테이너의 실제 폭(px). viewBox 를 화면 폭에 맞춰 늘리면 글자가 함께 커지므로
   폭을 재서 그 크기 그대로 그린다. */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function Scatter({ data, x, y, height = 320, xLabel, yLabel, cutoffX, selected, onPick }: {
  data: Candidate[]; x: keyof Candidate; y: keyof Candidate; height?: number
  xLabel: string; yLabel: string; cutoffX?: number; selected?: string | null; onPick?: (id: string) => void
}) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const H = height
  const L = 64, R = 16, T = 12, B = 48
  const xs = data.map(d => Number(d[x])), ys = data.map(d => Number(d[y]))
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const sx = (v: number) => L + ((v - x0) / (x1 - x0 || 1)) * (W - L - R)
  const sy = (v: number) => H - B - ((v - y0) / (y1 - y0 || 1)) * (H - B - T)
  const col = { input_pdb: '#0ea5e9', rfd3: '#4f46e5', bioemu: '#f59e0b' }
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const fmt = (v: number, span: number) => v.toFixed(span < 2 ? 2 : 1)
  const sel = data.find(d => d.id === selected)

  return (
    <div ref={ref}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {ticks.map(t => {
          const vy = y0 + t * (y1 - y0), vx = x0 + t * (x1 - x0)
          return (
            <g key={t}>
              <line x1={L} x2={W - R} y1={sy(vy)} y2={sy(vy)} stroke="#f4f4f5" />
              <text x={L - 8} y={sy(vy) + 4} textAnchor="end" fontSize="12" fill="#71717a">{fmt(vy, y1 - y0)}</text>
              <text x={sx(vx)} y={H - B + 18} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}
                fontSize="12" fill="#71717a">{fmt(vx, x1 - x0)}</text>
            </g>
          )
        })}
        {cutoffX !== undefined && (
          <>
            <line x1={sx(cutoffX)} x2={sx(cutoffX)} y1={T} y2={H - B} stroke="#dc2626" strokeDasharray="4 3" />
            <text x={sx(cutoffX) + 4} y={T + 12} fontSize="12" fill="#dc2626">cutoff {cutoffX}</text>
          </>
        )}
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="#d4d4d8" />
        <line x1={L} x2={L} y1={T} y2={H - B} stroke="#d4d4d8" />
        {data.filter(d => d.id !== selected).map(d => (
          <circle key={d.id} cx={sx(Number(d[x]))} cy={sy(Number(d[y]))} r={5} fill={col[d.source]}
            stroke="#fff" strokeWidth={1} opacity={selected ? 0.45 : 0.85}
            style={{ cursor: 'pointer' }} onClick={() => onPick?.(d.id)}>
            <title>{`${d.id} · ${xLabel} ${d[x]} · ${yLabel} ${d[y]}`}</title>
          </circle>
        ))}
        {sel && (
          <g>
            <circle cx={sx(Number(sel[x]))} cy={sy(Number(sel[y]))} r={8} fill={col[sel.source]}
              stroke="#09090b" strokeWidth={2}>
              <title>{`${sel.id} · ${xLabel} ${sel[x]} · ${yLabel} ${sel[y]}`}</title>
            </circle>
            <text x={sx(Number(sel[x])) + (sx(Number(sel[x])) > W - 120 ? -12 : 12)} y={sy(Number(sel[y])) - 10}
              textAnchor={sx(Number(sel[x])) > W - 120 ? 'end' : 'start'} fontSize="12" fontWeight="600" fill="#09090b">
              {sel.id}
            </text>
          </g>
        )}
        <text x={L + (W - L - R) / 2} y={H - 8} textAnchor="middle" fontSize="13" fill="#52525b">{xLabel}</text>
        <text x={14} y={T + (H - B - T) / 2} textAnchor="middle" fontSize="13" fill="#52525b"
          transform={`rotate(-90 14 ${T + (H - B - T) / 2})`}>{yLabel}</text>
      </svg>
      <div className="row wrap muted" style={{ justifyContent: 'center', gap: 16, marginTop: 6 }}>
        {Object.entries(col).map(([k, v]) => (
          <span key={k} className="row" style={{ gap: 6 }}>
            <i style={{ width: 10, height: 10, borderRadius: 99, background: v, display: 'inline-block' }} />{k}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- 막대 차트 ---------------- */
export function Bars({ data, height = 180, unit = '' }: {
  data: { label: string; value: number; color?: string }[]; height?: number; unit?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="col" style={{ gap: 9, minHeight: height ? undefined : height }}>
      {data.map(d => (
        <div key={d.label}>
          <div className="row" style={{ marginBottom: 3 }}>
            <span className="muted">{d.label}</span><div className="sp" />
            <b style={{ fontVariantNumeric: 'tabular-nums' }}>{d.value}{unit}</b>
          </div>
          <div className="progress">
            <i style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? 'var(--brand-2)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- 스파크라인 ---------------- */
export function Spark({ values, color = '#4f46e5', height = 44 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * 100,
    height - 4 - ((v - min) / (max - min || 1)) * (height - 10),
  ])
  return (
    <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${height} ` + pts.map(p => p.join(',')).join(' ') + ` 100,${height}`} fill={color} opacity=".09" />
    </svg>
  )
}

/* ---------------- 서열 비교 뷰 ---------------- */
export function SequenceView({ candidateId, range = [1, 120] }: { candidateId: string; range?: [number, number] }) {
  const [from, to] = range
  const cand = CANDIDATES.find(c => c.id === candidateId) ?? CANDIDATES[0]
  const mutated = useMemo(() => {
    const arr = WT_SEQ.split('')
    const alt = 'AVLIFWYGSTNQDEKRH'
    MUTATION_SITES.forEach((s, i) => {
      if (s < arr.length) arr[s] = alt[(s * (cand.mutations + i)) % alt.length]
    })
    return arr
  }, [cand])

  const render = (chars: string[], isMut: boolean) =>
    chars.slice(from - 1, to).map((ch, i) => {
      const pos = from + i
      const cls = isMut && MUTATION_SITES.includes(pos) ? 'mut' : FIXED_SITES.includes(pos) ? 'fix' : ''
      return <span key={pos} className={'r ' + cls}>{ch}</span>
    })

  return (
    <div className="seq">
      <div className="ruler">
        <span className="lbl" />
        {Array.from({ length: Math.ceil((to - from + 1) / 10) }, (_, i) => (
          <span key={i} style={{ display: 'inline-block', width: 130, textAlign: 'left' }}>{from + i * 10}</span>
        ))}
      </div>
      <div><span className="lbl">WT (1EMA)</span>{render(WT_SEQ.split(''), false)}</div>
      <div><span className="lbl">{cand.id}</span>{render(mutated, true)}</div>
      <div className="row wrap faint" style={{ gap: 12, marginTop: 8, fontFamily: 'inherit' }}>
        <span><i style={{ background: '#fde68a', width: 10, height: 10, display: 'inline-block', borderRadius: 2, marginRight: 4 }} />치환 잔기 {cand.mutations}개</span>
        <span><i style={{ background: '#dbeafe', width: 10, height: 10, display: 'inline-block', borderRadius: 2, marginRight: 4 }} />고정 잔기 (보존 tier70)</span>
      </div>
    </div>
  )
}
