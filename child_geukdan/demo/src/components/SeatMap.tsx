import { useMemo } from 'react'
import type { Grade, Venue } from '../data/types'
import { gradeColor, gradeLabel } from '../data/mock'
import { cx } from '../lib/format'

export type SeatMode = 'buy' | 'pos' | 'edit'

interface Props {
  venue: Venue
  gradeOf: (seatId: string) => Grade
  prices?: Partial<Record<Grade, number>>
  sold?: Set<string>
  used?: Set<string>
  held?: Set<string>
  siteOnly?: Set<string>
  selected: string[]
  onToggle?: (seatId: string) => void
  mode?: SeatMode
  distancing?: 'none' | 'together' | 'apart'
  maxSelect?: number
  size?: 'sm' | 'md' | 'lg'
  /** 편집 모드에서 좌석 색상 강제 */
  overlay?: (seatId: string) => string | undefined
}

/**
 * 좌석배치도 (SFR-TC-007)
 * - buy : 홈페이지/모바일 예매. 판매·보류·현장전용 좌석 선택 불가
 * - pos : 현장판매. 현장전용 좌석 선택 가능
 * - edit: 관리자 등급/보류 편집. 모든 좌석 클릭 가능
 */
export default function SeatMap({
  venue, gradeOf, prices, sold = new Set(), used = new Set(), held = new Set(), siteOnly = new Set(), selected, onToggle,
  mode = 'buy', distancing = 'none', maxSelect = 8, size = 'md', overlay,
}: Props) {
  // 거리두기: 판매 좌석 양옆 한 칸 차단
  const blocked = useMemo(() => {
    const out = new Set<string>()
    if (distancing === 'none') return out
    for (const s of sold) {
      const [r, c] = s.split('-')
      const n = Number(c)
      for (const d of [-1, 1]) {
        const nb = `${r}-${n + d}`
        if (!sold.has(nb)) out.add(nb)
      }
    }
    return out
  }, [sold, distancing])

  const px = size === 'sm' ? 18 : size === 'lg' ? 30 : 24
  const gap = size === 'sm' ? 3 : 4
  const grades = useMemo(() => {
    const g = new Set<Grade>()
    for (const r of venue.rows) for (let c = 1; c <= venue.cols; c++) g.add(gradeOf(`${r}-${c}`))
    return [...g].sort((a, b) => 'RSAW'.indexOf(a) - 'RSAW'.indexOf(b))
  }, [venue, gradeOf])

  const status = (id: string) => {
    if (sold.has(id)) return used.has(id) ? 'used' : 'sold'
    if (held.has(id)) return 'held'
    if (mode === 'buy' && siteOnly.has(id)) return 'site'
    if (blocked.has(id)) return 'blocked'
    return 'free'
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max px-2">
          <div className="mx-auto mb-5 rounded-b-[40px] bg-gradient-to-b from-gray-300 to-gray-100 py-2 text-center text-xs font-bold tracking-[0.4em] text-gray-600" style={{ width: venue.cols * (px + gap) * 0.75 }}>
            STAGE
          </div>
          <div role="grid" aria-label={`${venue.name} 좌석배치도`} className="flex flex-col" style={{ gap }}>
            {venue.rows.map(row => (
              <div role="row" key={row} className="flex items-center" style={{ gap }}>
                <span className="w-5 text-center text-[11px] font-semibold text-muted" aria-hidden>{row}</span>
                {Array.from({ length: venue.cols }, (_, i) => {
                  const col = i + 1
                  const id = `${row}-${col}`
                  const g = gradeOf(id)
                  const st = status(id)
                  const isSel = selected.includes(id)
                  const disabled = mode !== 'edit' && (st !== 'free' || (!isSel && selected.length >= maxSelect))
                  const color = overlay?.(id) ?? gradeColor[g]
                  const label = `${row}열 ${col}번 ${gradeLabel[g]}${prices?.[g] ? ` ${prices[g]!.toLocaleString()}원` : ''} ${
                    st === 'sold' ? '판매완료' : st === 'used' ? '입장완료' : st === 'held' ? '보류' : st === 'site' ? '현장판매 전용' : st === 'blocked' ? '거리두기' : isSel ? '선택됨' : '선택 가능'}`
                  return (
                    <span key={id} className="contents">
                      <button
                        type="button"
                        role="gridcell"
                        aria-label={label}
                        aria-pressed={isSel}
                        title={label}
                        disabled={disabled && !isSel}
                        onClick={() => onToggle?.(id)}
                        className={cx(
                          'relative grid place-items-center rounded-t-md rounded-b-sm text-[9px] font-bold transition',
                          isSel ? 'ring-2 ring-ink ring-offset-1 scale-110 z-10' : '',
                          st === 'free' && !isSel && 'hover:scale-110',
                          mode === 'edit' && 'cursor-pointer',
                        )}
                        style={{
                          width: px, height: px,
                          background: isSel ? '#16181d' : st === 'free' || mode === 'edit' ? color : st === 'held' ? '#fde68a' : st === 'site' ? '#d1d5db' : st === 'used' ? '#9ca3af' : '#e5e7eb',
                          color: isSel ? '#fff' : st === 'free' || mode === 'edit' ? '#fff' : '#6b7280',
                          outline: mode === 'edit' && held.has(id) ? '2px dashed #b45309' : mode === 'edit' && siteOnly.has(id) ? '2px dotted #111' : undefined,
                          outlineOffset: 1,
                          opacity: mode === 'edit' && sold.has(id) ? 0.45 : 1,
                        }}
                      >
                        {g === 'W' && st === 'free' && !isSel ? '♿' : size !== 'sm' ? col : ''}
                        {st === 'blocked' && <span aria-hidden className="absolute inset-0 grid place-items-center text-gray-400">×</span>}
                      </button>
                      {venue.aisles.includes(col) && <span style={{ width: px * 0.8 }} aria-hidden />}
                    </span>
                  )
                })}
                <span className="w-5 text-center text-[11px] font-semibold text-muted" aria-hidden>{row}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
        {grades.map(g => (
          <li key={g} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: gradeColor[g] }} />
            {gradeLabel[g]}{prices?.[g] ? ` ${prices[g]!.toLocaleString()}원` : ''}
          </li>
        ))}
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-gray-200" />판매완료</li>
        {mode !== 'buy' && <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-amber-200" />보류</li>}
        {mode === 'buy' && siteOnly.size > 0 && <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-gray-300" />현장판매 전용</li>}
        {distancing !== 'none' && <li className="flex items-center gap-1.5"><span className="text-gray-400">×</span>거리두기</li>}
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-ink" />선택</li>
      </ul>
    </div>
  )
}
