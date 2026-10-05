import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Brush, CopyCheck, Eraser, History, Lock, MousePointer2, Printer, RotateCcw, Save, Store, Unlock } from 'lucide-react'
import { gradeOf, useSeatState, useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Grade, Performance, Round } from '../../../data/types'
import { cx } from '../../../lib/format'
import SeatMap from '../../../components/SeatMap'
import { Card, Empty, Note, Segmented, Stat, ask, errMsg, printTarget } from '../../ui'
import { roundLabel } from '../../lib'

const GRADES: Grade[] = ['R', 'S', 'A', 'W']
const SEAT_RE = /^([A-Z]+)열 (\d+)번/
const seatFromEvent = (e: MouseEvent) => {
  const el = (e.target as HTMLElement).closest('[role=gridcell]')
  const m = el && SEAT_RE.exec(el.getAttribute('aria-label') ?? '')
  return m ? `${m[1]}-${m[2]}` : null
}
const short = (ids: string[]) => (ids.length > 6 ? `${ids.slice(0, 6).join(', ')} 외 ${ids.length - 6}석` : ids.join(', '))

export default function SeatEditor({ perf, round, rounds, onDirty }: {
  perf: Performance; round?: Round; rounds: Round[]; onDirty: (d: boolean) => void
}) {
  const venue = M.venues.find(v => v.id === perf.venueId)!
  const allIds = useMemo(() => M.seatIds(venue), [venue])
  const overrides = useStore(s => s.gradeOverrides)
  const auditLogs = useStore(s => s.auditLogs)
  const { setHold, setSiteOnly, setGrades, log, toast } = useStore.getState()
  const st = useSeatState(round?.id)

  const saved = useMemo(() => Object.fromEntries(allIds.map(id => [id, gradeOf(perf.id, id, overrides)])) as Record<string, Grade>, [allIds, perf.id, overrides])
  const [draft, setDraft] = useState<Record<string, Grade>>(saved)
  useEffect(() => setDraft(saved), [saved])
  const changed = useMemo(() => allIds.filter(id => draft[id] !== saved[id]), [allIds, draft, saved])
  useEffect(() => onDirty(changed.length > 0), [changed.length, onDirty])

  const [selected, setSelected] = useState<string[]>([])
  const [tool, setTool] = useState<'select' | 'paint'>('select')
  const [brush, setBrush] = useState<Grade>('R')
  const [preview, setPreview] = useState<Grade | null>(null)
  const [range, setRange] = useState({ from: '', to: '' })
  const [rangeErr, setRangeErr] = useState('')

  /* ── 드래그 선택 / 칠하기 ── */
  const drag = useRef<{ on: boolean; add: boolean } | null>(null)
  const mouseHandled = useRef(false)
  const apply = useCallback((id: string, add: boolean) => {
    if (tool === 'paint') setDraft(d => (d[id] === brush ? d : { ...d, [id]: brush }))
    else setSelected(s => (add ? (s.includes(id) ? s : [...s, id]) : s.filter(x => x !== id)))
  }, [tool, brush])
  useEffect(() => {
    const up = () => { drag.current = null; setTimeout(() => { mouseHandled.current = false }, 0) }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])
  const onDown = (e: MouseEvent) => {
    const id = seatFromEvent(e)
    if (!id || e.button !== 0) return
    e.preventDefault()
    mouseHandled.current = true
    const add = !selected.includes(id)
    drag.current = { on: true, add }
    apply(id, add)
  }
  const onOver = (e: MouseEvent) => {
    if (!drag.current) return
    const id = seatFromEvent(e)
    if (id) apply(id, drag.current.add)
  }
  const onToggle = (id: string) => {
    if (mouseHandled.current) return // 마우스는 onDown 에서 처리, 키보드(Enter/Space)만 여기서
    apply(id, !selected.includes(id))
  }

  const gradeFn = useCallback((id: string) => draft[id], [draft])
  const overlay = useCallback((id: string) => (preview && selected.includes(id) ? M.gradeColor[preview] : undefined), [preview, selected])

  /* ── 선택 도구 ── */
  const toggleRow = (row: string) => {
    const ids = allIds.filter(id => id.startsWith(row + '-'))
    const all = ids.every(id => selected.includes(id))
    setSelected(s => (all ? s.filter(x => !ids.includes(x)) : [...new Set([...s, ...ids])]))
  }
  const selectRange = () => {
    const re = /^([A-Za-z])-?(\d{1,2})$/
    const a = re.exec(range.from.trim()), b = re.exec(range.to.trim())
    if (!a || !b) { setRangeErr(errMsg('E-TC-302', '좌석 형식이 올바르지 않습니다 (예: A-1 ~ C-16)')); return }
    const r1 = venue.rows.indexOf(a[1].toUpperCase()), r2 = venue.rows.indexOf(b[1].toUpperCase())
    const c1 = Number(a[2]), c2 = Number(b[2])
    if (r1 < 0 || r2 < 0 || c1 < 1 || c2 < 1 || c1 > venue.cols || c2 > venue.cols) { setRangeErr(errMsg('E-TC-303', `존재하지 않는 좌석입니다 (${venue.rows[0]}~${venue.rows.at(-1)}열, 1~${venue.cols}번)`)); return }
    const ids: string[] = []
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) ids.push(`${venue.rows[r]}-${c}`)
    setSelected(s => [...new Set([...s, ...ids])])
    setRangeErr('')
  }
  const selectBy = (pred: (id: string) => boolean) => setSelected(allIds.filter(pred))

  const needSel = () => { if (!selected.length) { toast(errMsg('E-TC-301', '좌석을 먼저 선택하세요'), 'warn'); return true } return false }
  const applyGrade = (g: Grade) => {
    if (needSel()) return
    setDraft(d => { const n = { ...d }; for (const id of selected) n[id] = g; return n })
    toast(`선택 ${selected.length}석 → ${M.gradeLabel[g]} (등급 저장 시 반영)`)
  }

  /* ── 보류 / 현장전용 (회차별 즉시 반영) ── */
  const holdOp = (kind: 'hold' | 'site', on: boolean) => {
    if (!round) { toast(errMsg('E-TC-305', '회차를 선택하세요'), 'warn'); return }
    if (needSel()) return
    const cur = kind === 'hold' ? st.held : st.siteOnly
    let ids = selected
    if (on) {
      const soldSel = ids.filter(id => st.sold.has(id))
      ids = ids.filter(id => !st.sold.has(id))
      if (soldSel.length) toast(errMsg('E-TC-304', `판매된 좌석 ${soldSel.length}석은 제외되었습니다`), 'warn')
      if (!ids.length) return
    }
    const next = on ? [...new Set([...cur, ...ids])] : [...cur].filter(id => !ids.includes(id))
    if (kind === 'hold') setHold(round.id, next)
    else setSiteOnly(round.id, next)
    const label = kind === 'hold' ? '좌석 보류' : '현장판매 전용 좌석'
    log(`${label} ${on ? '설정' : '해제'}`, `${perf.title} ${roundLabel(round)} ${ids.length}석 (${short(ids)})`)
    toast(`${label} ${on ? '설정' : '해제'}: ${ids.length}석 · 홈페이지·POS 즉시 반영`)
    setSelected([])
  }
  const copyToAll = async () => {
    if (!round) return
    const others = rounds.filter(r => r.id !== round.id)
    const r = await ask({
      title: '다른 회차에 일괄 적용', tone: 'warn', confirmText: `${others.length}개 회차에 적용`,
      message: <>현재 회차({roundLabel(round)})의 <b>보류 {st.held.size}석 · 현장전용 {st.siteOnly.size}석</b> 설정을 &lt;{perf.title}&gt;의 다른 회차 {others.length}개에 덮어씁니다.<br /><span className="text-xs text-muted">각 회차에서 이미 판매된 좌석은 판매 상태가 우선 적용됩니다.</span></>,
    })
    if (r === null) return
    const S = useStore.getState()
    const holds = { ...S.holds }, site = { ...S.siteOnly }
    for (const o of others) { holds[o.id] = [...st.held]; site[o.id] = [...st.siteOnly] }
    S.set({ holds, siteOnly: site })
    log('보류·현장전용 좌석 일괄 적용', `${perf.title} ${roundLabel(round)} → ${others.length}개 회차`)
    toast(`${others.length}개 회차에 일괄 적용되었습니다`)
  }

  const saveGrades = () => {
    if (!changed.length) { toast('변경된 등급이 없습니다', 'warn'); return }
    const missing = GRADES.filter(g => allIds.some(id => draft[id] === g) && perf.prices[g] == null)
    setGrades(perf.id, draft)
    toast(`좌석 등급 ${changed.length}석 변경 저장${missing.length ? ` · ${missing.map(g => M.gradeLabel[g]).join(', ')} 가격 미설정 – 공연관리에서 가격을 입력하세요` : ''}`, missing.length ? 'warn' : 'ok')
  }
  const revert = async () => {
    const r = await ask({ title: '변경 취소', tone: 'warn', message: `저장하지 않은 등급 변경 ${changed.length}석을 되돌립니다.`, confirmText: '되돌리기' })
    if (r !== null) setDraft(saved)
  }
  const resetDefault = async () => {
    const r = await ask({ title: '기본 배치로 초기화', tone: 'warn', message: `${venue.name} 기본 등급 배치로 되돌립니다. [등급 저장]을 눌러야 반영됩니다.`, confirmText: '초기화' })
    if (r !== null) setDraft(Object.fromEntries(allIds.map(id => [id, M.defaultGrade(venue, id)])))
  }

  const counts = useMemo(() => {
    const c: Record<Grade, number> = { R: 0, S: 0, A: 0, W: 0 }
    for (const id of allIds) c[draft[id]]++
    return c
  }, [allIds, draft])
  const history = useMemo(() => auditLogs.filter(l => /좌석|보류|현장/.test(l.action) && (l.target.includes(perf.title) || l.action.includes('좌석'))).slice(0, 20), [auditLogs, perf.title])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <Card bodyClass="p-3" className="no-print">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented value={tool} onChange={setTool} options={[
              { value: 'select', label: <span className="inline-flex items-center gap-1"><MousePointer2 size={13} />선택</span> },
              { value: 'paint', label: <span className="inline-flex items-center gap-1"><Brush size={13} />브러시</span> },
            ]} />
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs font-semibold text-muted">등급</span>
              {GRADES.map(g => (
                <button key={g} type="button" aria-pressed={tool === 'paint' && brush === g}
                  onMouseEnter={() => tool === 'select' && selected.length && setPreview(g)} onMouseLeave={() => setPreview(null)}
                  onClick={() => { setPreview(null); if (tool === 'paint') setBrush(g); else applyGrade(g) }}
                  title={tool === 'paint' ? `${M.gradeLabel[g]} 브러시` : `선택 좌석에 ${M.gradeLabel[g]} 적용`}
                  className={cx('flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-bold text-white transition hover:brightness-110',
                    tool === 'paint' && brush === g ? 'ring-2 ring-ink ring-offset-1' : 'border-transparent')}
                  style={{ background: M.gradeColor[g] }}>
                  {g === 'W' ? '휠체어' : g}{tool === 'select' && <span className="font-normal opacity-80">적용</span>}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">{tool === 'paint' ? '좌석을 클릭·드래그하면 바로 등급이 칠해집니다' : '좌석 클릭·드래그로 선택 → 등급/보류 적용 (등급 버튼에 마우스를 올리면 미리보기)'}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="mr-1 text-xs font-semibold text-muted">행 선택</span>
            {venue.rows.map(r => {
              const all = allIds.filter(id => id.startsWith(r + '-')).every(id => selected.includes(id))
              return <button key={r} type="button" onClick={() => toggleRow(r)} className={cx('h-7 w-7 rounded text-xs font-bold', all ? 'bg-ink text-white' : 'bg-paper text-muted hover:bg-brand-50')}>{r}</button>
            })}
            <span className="mx-2 h-5 w-px bg-line" />
            <span className="text-xs font-semibold text-muted">범위</span>
            <input className="w-16 rounded border border-line px-2 py-1 text-xs" placeholder="A-1" value={range.from} aria-label="범위 시작 좌석" aria-invalid={!!rangeErr} onChange={e => setRange({ ...range, from: e.target.value })} />
            <span className="text-muted">~</span>
            <input className="w-16 rounded border border-line px-2 py-1 text-xs" placeholder="C-16" value={range.to} aria-label="범위 끝 좌석" aria-invalid={!!rangeErr} onChange={e => setRange({ ...range, to: e.target.value })} />
            <button type="button" className="btn-outline btn-sm" onClick={selectRange}>범위 선택</button>
            <span className="mx-2 h-5 w-px bg-line" />
            <button type="button" className="btn-ghost btn-sm" onClick={() => selectBy(id => st.held.has(id))}>보류석</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => selectBy(id => st.siteOnly.has(id))}>현장전용석</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected(allIds)}>전체</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected([])}><Eraser size={13} />선택 초기화</button>
          </div>
          {rangeErr && <p className="mt-1.5 text-xs font-medium text-coral-500">{rangeErr}</p>}
        </Card>

        <Card className="print-target" title={`${perf.title} · ${venue.name} 좌석도`} sub={round ? `${roundLabel(round)} · 선택 ${selected.length}석${changed.length ? ` · 미저장 등급 변경 ${changed.length}석` : ''}` : '회차 미선택'}
          actions={<button type="button" className="btn-outline btn-sm" onClick={() => { log('좌석 도면 출력', `${perf.title} ${venue.name}`); printTarget() }}><Printer size={13} />도면 출력</button>}>
          <div className="select-none" onMouseDown={onDown} onMouseOver={onOver}>
            <SeatMap venue={venue} gradeOf={gradeFn} prices={perf.prices} sold={st.sold} used={st.used} held={st.held} siteOnly={st.siteOnly}
              selected={preview ? [] : selected} onToggle={onToggle} mode="edit" size="lg" overlay={overlay} />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-gray-300" style={{ outline: '2px dashed #b45309', outlineOffset: 1 }} />보류 (점선)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-gray-300" style={{ outline: '2px dotted #111', outlineOffset: 1 }} />현장판매 전용</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-gray-400 opacity-50" />판매완료 (흐림)</span>
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card title="등급별 집계" sub={changed.length ? `미저장 변경 ${changed.length}석` : '저장된 배치'}>
          <ul className="space-y-2 text-sm">
            {GRADES.map(g => (
              <li key={g} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: M.gradeColor[g] }} />
                <span className="w-16 font-semibold">{M.gradeLabel[g]}</span>
                <span className="flex-1 text-right tabular-nums">{counts[g]}석</span>
                <span className={cx('w-20 text-right text-xs tabular-nums', perf.prices[g] == null && counts[g] ? 'font-semibold text-coral-500' : 'text-muted')}>
                  {perf.prices[g] != null ? `${perf.prices[g]!.toLocaleString()}원` : counts[g] ? '가격 미설정' : '-'}
                </span>
              </li>
            ))}
            <li className="flex justify-between border-t border-line pt-2 font-bold"><span>총 좌석</span><span className="tabular-nums">{allIds.length}석</span></li>
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-primary btn-sm col-span-2" disabled={!changed.length} onClick={saveGrades}><Save size={13} />등급 저장 ({changed.length})</button>
            <button type="button" className="btn-outline btn-sm" disabled={!changed.length} onClick={revert}><RotateCcw size={13} />변경 취소</button>
            <button type="button" className="btn-outline btn-sm" onClick={resetDefault}>기본 배치</button>
          </div>
          {changed.some(id => st.sold.has(id)) && <Note tone="warn" className="mt-3">이미 판매된 좌석의 등급 변경은 기존 예매 금액에 영향을 주지 않습니다.</Note>}
        </Card>

        <Card title="보류 · 현장판매 전용" sub={round ? roundLabel(round) : '회차를 선택하세요'}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="보류" value={`${st.held.size}석`} />
            <Stat label="현장 전용" value={`${st.siteOnly.size}석`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => holdOp('hold', true)}><Lock size={13} />보류 설정</button>
            <button type="button" className="btn-outline btn-sm" onClick={() => holdOp('hold', false)}><Unlock size={13} />보류 해제</button>
            <button type="button" className="btn-outline btn-sm" onClick={() => holdOp('site', true)}><Store size={13} />현장전용 지정</button>
            <button type="button" className="btn-outline btn-sm" onClick={() => holdOp('site', false)}>현장전용 해제</button>
            <button type="button" className="btn-outline btn-sm col-span-2" disabled={!round || rounds.length < 2} onClick={copyToAll}><CopyCheck size={13} />다른 회차에 일괄 적용</button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">보류석은 모든 채널에서 판매 불가, 현장전용석은 홈페이지·모바일에서 숨김 처리되고 POS·콜센터에서만 판매됩니다. 즉시 반영됩니다.</p>
        </Card>

        <Card title={<span className="flex items-center gap-1.5"><History size={14} />변경이력</span>} bodyClass="p-0">
          {history.length ? (
            <ul className="max-h-72 divide-y divide-line overflow-y-auto">
              {history.map(l => (
                <li key={l.id} className="px-4 py-2 text-xs">
                  <div className="font-semibold">{l.action}</div>
                  <div className="truncate text-muted" title={l.target}>{l.target}</div>
                  <div className="text-[11px] text-muted tabular-nums">{l.at} · {l.who}</div>
                </li>
              ))}
            </ul>
          ) : <Empty text="좌석 변경이력이 없습니다." />}
        </Card>
      </aside>
    </div>
  )
}
