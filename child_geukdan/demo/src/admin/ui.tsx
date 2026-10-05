import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import {
  AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Eye, EyeOff, FileSpreadsheet, Printer, X,
} from 'lucide-react'
import Modal from '../components/Modal'
import { useStore } from '../store'
import { cx, downloadCsv, maskName, maskPhone } from '../lib/format'
import { useAdminLocal } from './adminStore'
import { TODAY, addDays } from './lib'

/* ─────────────────────────── 레이아웃 요소 ─────────────────────────── */

export function PageHeader({ title, desc, code, actions }: { title: string; desc?: ReactNode; code?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{title}</h1>
          {code && <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">{code}</span>}
        </div>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, actions, children, className, bodyClass, sub }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; sub?: ReactNode
}) {
  return (
    <section className={cx('card overflow-hidden', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-ink">{title}</h2>}
            {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          </div>
          {actions && <div className="no-print flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={cx(bodyClass ?? 'p-4')}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, sub, icon, tone = 'brand', onClick }: {
  label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: 'brand' | 'mint' | 'coral' | 'sun' | 'ink'; onClick?: () => void
}) {
  const toneCls = { brand: 'bg-brand-50 text-brand-600', mint: 'bg-emerald-50 text-mint-500', coral: 'bg-orange-50 text-coral-500', sun: 'bg-amber-50 text-amber-600', ink: 'bg-gray-100 text-ink' }[tone]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cx('card flex items-start gap-3 p-4 text-left', onClick && 'transition hover:border-brand-500')}>
      {icon && <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneCls)}>{icon}</span>}
      <div className="min-w-0">
        <div className="text-xs font-semibold text-muted">{label}</div>
        <div className="mt-0.5 truncate text-xl font-extrabold tabular-nums text-ink">{value}</div>
        {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
      </div>
    </Tag>
  )
}

export interface TabDef { id: string; label: ReactNode; disabled?: boolean; badge?: ReactNode }
export function Tabs({ tabs, value, onChange, className }: { tabs: TabDef[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cx('no-print mb-4 flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {tabs.map(t => (
        <button
          key={t.id} role="tab" aria-selected={value === t.id} disabled={t.disabled}
          onClick={() => onChange(t.id)}
          className={cx('-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition',
            value === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink',
            t.disabled && 'cursor-not-allowed opacity-40 hover:text-muted')}
        >
          {t.label}
          {t.badge != null && <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{t.badge}</span>}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange, size = 'md' }: {
  options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-paper p-0.5">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx('rounded-md font-semibold transition', size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === o.value ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-40', checked ? 'bg-brand-600' : 'bg-gray-300')}>
      <span className={cx('inline-block h-4 w-4 rounded-full bg-white shadow transition', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
    </button>
  )
}

const STATUS_TONE: Record<string, string> = {}
for (const s of ['판매중', '예매완료', '발권완료', '성공', '재전송성공', '정상', '답변완료', '정산완료', '사용', '결제완료', '관람완료', '지급완료', '입장', '일치', '노출', '게시중'])
  STATUS_TONE[s] = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
for (const s of ['선예매중', '오픈예정', '담당자배정', '업체승인대기', '지급요청', '발권', '예정'])
  STATUS_TONE[s] = 'bg-brand-50 text-brand-700 ring-brand-200'
for (const s of ['입금대기', '대기', '부분취소', '휴면', '접수', '정산대기', '보류', '임시저장', '미지급', '미발권', '미입장'])
  STATUS_TONE[s] = 'bg-amber-50 text-amber-700 ring-amber-200'
for (const s of ['취소완료', '실패', '판매중지', '매진', '탈퇴', '취소', '불일치', '오류'])
  STATUS_TONE[s] = 'bg-red-50 text-red-700 ring-red-200'

/** 상태값 뱃지 – 텍스트에 따라 색상 자동 지정 */
export function Status({ s, className }: { s: string; className?: string }) {
  return <span className={cx('chip ring-1 ring-inset', STATUS_TONE[s] ?? 'bg-gray-100 text-gray-600 ring-gray-200', className)}>{s}</span>
}

export function Field({ label, required, error, hint, children, className }: {
  label: ReactNode; required?: boolean; error?: string | false; hint?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="label text-[13px]">{label}{required && <span className="ml-0.5 text-coral-500">*</span>}</label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-coral-500" role="alert">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

/** 오류코드 포함 메시지 (예: [E-TC-102] 필수 입력값 누락) */
export const errMsg = (code: string, msg: string) => `[${code}] ${msg}`

export function Empty({ text = '조회 결과가 없습니다.' }: { text?: string }) {
  return <div className="py-12 text-center text-sm text-muted">{text}</div>
}

/** 검색 조건 영역 */
export function FilterBar({ children, onSearch, onReset }: { children: ReactNode; onSearch?: () => void; onReset?: () => void }) {
  return (
    <form className="card no-print mb-4 p-4" onSubmit={e => { e.preventDefault(); onSearch?.() }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      {(onSearch || onReset) && (
        <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
          {onReset && <button type="button" className="btn-outline btn-sm" onClick={onReset}>초기화</button>}
          {onSearch && <button type="submit" className="btn-primary btn-sm">검색</button>}
        </div>
      )}
    </form>
  )
}

export function MultiCheck<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(o => {
        const on = value.includes(o)
        return (
          <button key={o} type="button" onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}
            className={cx('rounded-md border px-2 py-1 text-xs font-semibold transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-muted hover:border-brand-500')}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** 기간 + 빠른선택 (오늘/1주/1개월/3개월) */
export function DateRange({ from, to, onChange, quick = true }: { from: string; to: string; onChange: (from: string, to: string) => void; quick?: boolean }) {
  const q: [string, number][] = [['오늘', 0], ['1주', 7], ['1개월', 30], ['3개월', 90]]
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <input type="date" className="input py-2" value={from} onChange={e => onChange(e.target.value, to)} aria-label="시작일" />
        <span className="text-muted">~</span>
        <input type="date" className="input py-2" value={to} onChange={e => onChange(from, e.target.value)} aria-label="종료일" />
      </div>
      {quick && (
        <div className="flex gap-1">
          {q.map(([l, d]) => (
            <button key={l} type="button" className="rounded border border-line px-2 py-0.5 text-[11px] font-semibold text-muted hover:border-brand-500 hover:text-brand-600"
              onClick={() => onChange(addDays(TODAY, -d), TODAY)}>{l}</button>
          ))}
          <button type="button" className="rounded border border-line px-2 py-0.5 text-[11px] font-semibold text-muted hover:border-brand-500" onClick={() => onChange('', '')}>전체</button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── 데이터 테이블 ─────────────────────────── */

export interface Col<T> {
  key: string
  header: ReactNode
  render?: (r: T, i: number) => ReactNode
  /** 정렬 키 – 지정 시 헤더 클릭 정렬 가능 */
  sort?: (r: T) => string | number
  align?: 'left' | 'right' | 'center'
  className?: string
}

export function DataTable<T>({
  columns, rows, rowKey, pageSize = 20, onRowClick, selectable, selected, onSelectChange, maxHeight = '62vh', empty, initialSort, dense, rowClass,
}: {
  columns: Col<T>[]; rows: T[]; rowKey: (r: T) => string; pageSize?: number; onRowClick?: (r: T) => void
  selectable?: boolean; selected?: string[]; onSelectChange?: (ids: string[]) => void; maxHeight?: string; empty?: string
  initialSort?: { key: string; dir: 'asc' | 'desc' }; dense?: boolean; rowClass?: (r: T) => string | undefined
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(pageSize)
  useEffect(() => setPage(1), [rows.length, size])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col?.sort) return rows
    const f = col.sort
    const out = [...rows].sort((a, b) => {
      const x = f(a), y = f(b)
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1)
    })
    return out
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / size))
  const cur = Math.min(page, pages)
  const view = sorted.slice((cur - 1) * size, cur * size)
  const sel = new Set(selected ?? [])
  const allOnPage = view.length > 0 && view.every(r => sel.has(rowKey(r)))

  const toggleSort = (c: Col<T>) => {
    if (!c.sort) return
    setSort(s => (s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' }))
  }

  return (
    <div>
      <div className="tbl-wrap overflow-auto rounded-lg border border-line" style={{ maxHeight }}>
        <table className={cx('tbl', dense && '[&_td]:py-1.5 [&_th]:py-2')}>
          <thead className="sticky top-0 z-[1]">
            <tr>
              {selectable && (
                <th className="w-8">
                  <input type="checkbox" aria-label="현재 페이지 전체 선택" checked={allOnPage}
                    onChange={() => {
                      const ids = view.map(rowKey)
                      onSelectChange?.(allOnPage ? [...sel].filter(id => !ids.includes(id)) : [...new Set([...sel, ...ids])])
                    }} />
                </th>
              )}
              {columns.map(c => (
                <th key={c.key} className={cx(c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.sort && 'cursor-pointer select-none hover:text-ink', c.className)}
                  onClick={() => toggleSort(c)} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <span className={cx('inline-flex items-center gap-0.5', c.align === 'right' && 'flex-row-reverse')}>
                    {c.header}
                    {c.sort && (sort?.key === c.key ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={11} className="opacity-40" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => {
              const id = rowKey(r)
              return (
                <tr key={id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx(onRowClick && 'cursor-pointer', sel.has(id) && 'bg-brand-50', rowClass?.(r))}>
                  {selectable && (
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" aria-label="선택" checked={sel.has(id)}
                        onChange={() => onSelectChange?.(sel.has(id) ? [...sel].filter(x => x !== id) : [...sel, id])} />
                    </td>
                  )}
                  {columns.map(c => (
                    <td key={c.key} className={cx(c.align === 'right' && 'text-right tabular-nums', c.align === 'center' && 'text-center', c.className)}>
                      {c.render ? c.render(r, (cur - 1) * size + i) : String((r as Record<string, unknown>)[c.key] ?? '')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <Empty text={empty} />}
      </div>
      {rows.length > 0 && (
        <div className="no-print mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>총 <b className="text-ink">{rows.length.toLocaleString()}</b>건{selected && selected.length > 0 && <> · 선택 <b className="text-brand-600">{selected.length}</b>건</>}</span>
            <select className="rounded border border-line bg-white px-1.5 py-0.5" value={size} onChange={e => setSize(Number(e.target.value))} aria-label="페이지당 행 수">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}개씩</option>)}
            </select>
          </div>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button className="btn-ghost btn-sm px-1.5" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="이전 페이지"><ChevronLeft size={14} /></button>
              {pageNums(cur, pages).map((n, i) => n === -1
                ? <span key={'e' + i} className="px-1">…</span>
                : <button key={n} onClick={() => setPage(n)} className={cx('min-w-7 rounded px-1.5 py-1 font-semibold', n === cur ? 'bg-brand-600 text-white' : 'hover:bg-paper')}>{n}</button>)}
              <button className="btn-ghost btn-sm px-1.5" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="다음 페이지"><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
function pageNums(cur: number, pages: number): number[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const s = new Set([1, pages, cur - 1, cur, cur + 1])
  const arr = [...s].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out: number[] = []
  arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push(-1); out.push(n) })
  return out
}

/* ─────────────────────────── 출력 (엑셀/인쇄) ─────────────────────────── */

/** 화면 인쇄 (사이드바·버튼 제외) */
export function printPage() { window.print() }
/** 특정 영역(.print-target)만 인쇄 – 정산서·티켓 미리보기 등 */
export function printTarget() {
  const el = document.documentElement
  el.classList.add('print-only')
  setTimeout(() => {
    window.print()
    setTimeout(() => el.classList.remove('print-only'), 300)
  }, 50)
}

/** 엑셀(CSV)·인쇄 버튼 – 대량 데이터는 PER-004 안내 후 진행 */
export function ExportButtons({ filename, getRows, count, heavyAt = 5000, print = true, label = '엑셀' }: {
  filename: string; getRows: () => (string | number)[][]; count: number; heavyAt?: number; print?: boolean; label?: string
}) {
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const onCsv = async () => {
    if (!count) { toast(errMsg('E-CM-201', '다운로드할 데이터가 없습니다'), 'warn'); return }
    if (count > heavyAt) {
      const ok = await ask({
        title: '대량 데이터 다운로드', tone: 'warn',
        message: <>조회 결과가 <b>{count.toLocaleString()}건</b>입니다. 대량 데이터 조회 시 시간이 걸릴 수 있습니다. (PER-004)<br />다운로드 사유를 선택하면 개인정보 처리 활동로그에 기록됩니다.</>,
        reasonOptions: ['정산 검증', '공연 안내 문자', '통계 분석', '감사 대응'], confirmText: '다운로드',
      })
      if (ok === null) return
      await runHeavy({ title: '엑셀 파일 생성 중', message: `${count.toLocaleString()}건 데이터를 파일로 변환하고 있습니다.`, ms: 1800 })
      log(`엑셀 다운로드(사유: ${ok})`, `${filename} ${count.toLocaleString()}건`)
    } else {
      log('엑셀 다운로드', `${filename} ${count.toLocaleString()}건`)
    }
    downloadCsv(`${filename}_${TODAY}.csv`, getRows())
    toast(`${filename} 다운로드 완료 (${count.toLocaleString()}건)`)
  }
  return (
    <>
      <button type="button" className="btn-outline btn-sm" onClick={onCsv}><FileSpreadsheet size={14} className="text-emerald-600" />{label}</button>
      {print && <button type="button" className="btn-outline btn-sm" onClick={printPage}><Printer size={14} />인쇄·PDF</button>}
    </>
  )
}

/* ─────────────────────────── 확인 / 진행 다이얼로그 ─────────────────────────── */

interface AskOpts {
  title: string
  message: ReactNode
  confirmText?: string
  tone?: 'danger' | 'warn' | 'default'
  /** 사유 입력 필수 – 문자열이면 입력 라벨 */
  reason?: boolean | string
  reasonOptions?: string[]
}
interface DlgState {
  ask: (AskOpts & { resolve: (v: string | null) => void }) | null
  heavy: { title: string; message: string; ms: number; resolve: () => void } | null
}
const useDlg = create<DlgState>(() => ({ ask: null, heavy: null }))

/**
 * 확인 대화상자 (UIR-003). 취소 시 null, 확인 시 사유 문자열(사유 없으면 '') 반환.
 *   const r = await ask({ title: '삭제', message: '삭제하시겠습니까?', tone: 'danger' }); if (r === null) return
 */
export function ask(o: AskOpts): Promise<string | null> {
  return new Promise(resolve => useDlg.setState({ ask: { ...o, resolve } }))
}
/** 장시간 연산 진행 표시 (PER-004) */
export function runHeavy(o: { title: string; message: string; ms?: number }): Promise<void> {
  return new Promise(resolve => useDlg.setState({ heavy: { ms: 1600, ...o, resolve } }))
}

export function DialogHost() {
  const a = useDlg(s => s.ask)
  const h = useDlg(s => s.heavy)
  return (
    <>
      {a && <AskDialog key={a.title + String(a.message)} o={a} />}
      {h && <HeavyDialog key={h.title} o={h} />}
    </>
  )
}
function AskDialog({ o }: { o: NonNullable<DlgState['ask']> }) {
  const needReason = !!o.reason || !!o.reasonOptions
  const [reason, setReason] = useState(o.reasonOptions?.[0] ?? '')
  const [etc, setEtc] = useState('')
  const [err, setErr] = useState('')
  const close = (v: string | null) => { useDlg.setState({ ask: null }); o.resolve(v) }
  const finalReason = reason === '기타' ? etc.trim() : reason.trim()
  const submit = () => {
    if (needReason && !finalReason) { setErr(errMsg('E-CM-102', '사유를 입력해 주세요')); return }
    close(finalReason)
  }
  return (
    <Modal open onClose={() => close(null)} title={o.title} size="sm"
      footer={<>
        <button className="btn-outline btn-sm" onClick={() => close(null)}>취소</button>
        <button className={cx('btn-sm', o.tone === 'danger' ? 'btn-danger' : 'btn-primary')} onClick={submit}>{o.confirmText ?? '확인'}</button>
      </>}>
      <div className="flex gap-3">
        {o.tone && o.tone !== 'default' && <AlertTriangle className={cx('mt-0.5 shrink-0', o.tone === 'danger' ? 'text-coral-500' : 'text-amber-500')} size={20} />}
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink">{o.message}</div>
      </div>
      {needReason && (
        <div className="mt-4 space-y-2">
          <label className="label text-[13px]">{typeof o.reason === 'string' ? o.reason : '사유'}<span className="text-coral-500">*</span></label>
          {o.reasonOptions ? (
            <select className="input" value={reason} onChange={e => { setReason(e.target.value); setErr('') }}>
              {[...o.reasonOptions, '기타'].map(r => <option key={r}>{r}</option>)}
            </select>
          ) : null}
          {(!o.reasonOptions || reason === '기타') && (
            <input className="input" autoFocus placeholder="사유 입력" aria-invalid={!!err}
              value={o.reasonOptions ? etc : reason} onChange={e => { (o.reasonOptions ? setEtc : setReason)(e.target.value); setErr('') }} />
          )}
          {err && <p className="text-xs font-medium text-coral-500">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
function HeavyDialog({ o }: { o: NonNullable<DlgState['heavy']> }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => {
      const v = Math.min(100, ((Date.now() - start) / o.ms) * 100)
      setP(v)
      if (v >= 100) {
        clearInterval(t)
        setTimeout(() => { useDlg.setState({ heavy: null }); o.resolve() }, 200)
      }
    }, 60)
    return () => clearInterval(t)
  }, [o])
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" role="alertdialog" aria-label={o.title}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center gap-2 text-sm font-bold"><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />{o.title}</div>
        <p className="mt-2 text-xs text-muted">{o.message}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${p}%` }} /></div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>PER-004 장시간 처리 안내</span><span className="tabular-nums">{Math.round(p)}%</span></div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Drawer ─────────────────────────── */

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-2xl' }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string
}) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 top-9 z-40 flex justify-end bg-black/30" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className={cx('flex h-full w-full flex-col bg-white shadow-2xl', width)} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="min-w-0 truncate text-base font-bold">{title}</h2>
          <button className="btn-ghost -mr-2 p-2" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>
  )
}

/* ─────────────────────────── 개인정보 마스킹 ─────────────────────────── */

/** 개인정보 표시 토글 – 사유 입력 후 해제, 처리 활동로그 기록 */
export function PiiToggle() {
  const show = useAdminLocal(s => s.showPII)
  const set = useAdminLocal(s => s.set)
  const log = useStore(s => s.log)
  const onClick = async () => {
    if (show) { set({ showPII: false }); return }
    const r = await ask({
      title: '개인정보 표시', tone: 'warn', confirmText: '표시',
      message: '마스킹된 개인정보(성명·연락처)를 표시합니다. 조회 사유는 개인정보 처리 활동로그에 기록됩니다.',
      reasonOptions: ['고객 문의 응대', '예매 확인 요청', '환불 처리', '현장 본인 확인'],
    })
    if (r === null) return
    set({ showPII: true, piiReason: r })
    log(`개인정보 표시(사유: ${r})`, '마스킹 해제')
  }
  return (
    <button type="button" onClick={onClick} className={cx('btn-sm', show ? 'btn-accent' : 'btn-outline')}>
      {show ? <EyeOff size={14} /> : <Eye size={14} />}{show ? '마스킹 적용' : '개인정보 표시'}
    </button>
  )
}
export function usePII() {
  const show = useAdminLocal(s => s.showPII)
  return useMemo(() => ({
    show,
    name: (n?: string) => (n ? (show ? n : maskName(n)) : '-'),
    phone: (p?: string) => (p ? (show ? p : maskPhone(p)) : '-'),
    email: (e?: string) => (e ? (show ? e : e.replace(/^(.{2}).*(@.*)$/, '$1***$2')) : '-'),
  }), [show])
}

/* ─────────────────────────── 기타 ─────────────────────────── */

export function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-lg bg-paper px-3 py-2', className)}>
      <div className="text-[11px] font-semibold text-muted">{label}</div>
      <div className="text-sm font-bold tabular-nums text-ink">{value}</div>
    </div>
  )
}

export function Bar({ value, max = 100, color = '#2647c4', className }: { value: number; max?: number; color?: string; className?: string }) {
  const w = max ? Math.min(100, (value / max) * 100) : 0
  return <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-gray-100', className)}><div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} /></div>
}

/** 정보성 알림 박스 */
export function Note({ children, tone = 'info', className }: { children: ReactNode; tone?: 'info' | 'warn' | 'err'; className?: string }) {
  return (
    <div className={cx('rounded-lg border px-3 py-2 text-xs leading-relaxed',
      tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-800' : tone === 'err' ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-100 bg-brand-50 text-brand-700', className)}>
      {children}
    </div>
  )
}

/** recharts 공통 색상 */
export const CHART_COLORS = ['#2647c4', '#d48806', '#17a37f', '#e0533a', '#8b5cf6', '#0891b2', '#9ca3af'] // CVD 검증 완료 순서 – 순서대로 사용
export const krw = (n: number) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString()}만` : n.toLocaleString())
