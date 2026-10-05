export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const DOW = ['일', '월', '화', '수', '목', '금', '토']
export const dow = (date: string) => DOW[new Date(date + 'T00:00:00').getDay()]
/** 2026-10-16 → 2026.10.16(금) */
export const fmtDate = (date: string, withDow = true) => `${date.replace(/-/g, '.')}${withDow ? `(${dow(date)})` : ''}`
export const fmtRange = (a: string, b: string) => `${a.replace(/-/g, '.')} – ${b.slice(5).replace(/-/g, '.')}`
export const maskName = (n: string) => n.length <= 1 ? n : n[0] + '*'.repeat(Math.max(1, n.length - 2)) + (n.length > 2 ? n[n.length - 1] : '')
export const maskPhone = (p: string) => p.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

/** CSV 다운로드 (엑셀 호환, UTF-8 BOM) */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
