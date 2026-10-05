import { useMemo, useState } from 'react'
import { CalendarPlus, Pencil, Plus, Trash2, Wand2, X } from 'lucide-react'
import { useStore } from '../../../store'
import type { Round } from '../../../data/types'
import { cx, fmtDate } from '../../../lib/format'
import { Card, DataTable, Field, Note, Toggle, ask, errMsg, type Col } from '../../ui'
import { seatCount } from '../../lib'
import {
  DISTANCING, DOW, NOTE_OPTIONS, defaultRules, generateSlots, renumber, type RoundRule, type TabProps,
} from './shared'

type Props = TabProps & { rounds: Round[]; setRounds: (rs: Round[]) => void; soldBy: Map<string, number> }
const rid = (perfId: string, i: number) => `${perfId}-r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}${i}`

export default function RoundsTab({ p, rounds, setRounds, soldBy, errors }: Props) {
  const toast = useStore(s => s.toast)
  const [from, setFrom] = useState(p.start)
  const [to, setTo] = useState(p.end)
  const [rules, setRules] = useState<RoundRule[]>(() => defaultRules(p.target))
  const [exclude, setExclude] = useState<string[]>([])
  const [exDate, setExDate] = useState('')
  const [replace, setReplace] = useState(rounds.length === 0)
  const [selected, setSelected] = useState<string[]>([])
  const [single, setSingle] = useState({ date: p.start, time: '11:00' })
  const [bulk, setBulk] = useState({ time: '', note: '__keep', distancing: '__keep', active: '__keep' })
  const [bulkOpen, setBulkOpen] = useState(false)

  const slots = useMemo(() => generateSlots(from, to, rules, exclude), [from, to, rules, exclude])
  const sold = (r: Round) => soldBy.get(r.id) ?? 0
  const cap = seatCount(p)

  const generate = async () => {
    if (!slots.length) { toast(errMsg('E-TC-201', '생성할 회차가 없습니다. 기간·요일·시간을 확인하세요'), 'err'); return }
    let base = rounds
    if (replace && rounds.length) {
      const keep = rounds.filter(r => sold(r) > 0)
      const r = await ask({
        title: '회차 일괄 생성', tone: 'warn', confirmText: '대체 생성',
        message: <>기존 회차 {rounds.length}개를 새 회차 {slots.length}개로 대체합니다.{keep.length > 0 && <><br /><b className="text-coral-500">판매 내역이 있는 회차 {keep.length}개는 삭제되지 않고 유지됩니다.</b></>}</>,
      })
      if (r === null) return
      base = keep
    }
    const exists = new Set(base.map(r => r.date + r.time))
    const add = slots.filter(s => !exists.has(s.date + s.time)).map((s, i): Round => ({
      id: rid(p.id, i), perfId: p.id, date: s.date, time: s.time, no: 0, active: true, distancing: 'none',
    }))
    setRounds(renumber([...base, ...add]))
    toast(`회차 ${add.length}개가 생성되었습니다${slots.length - add.length ? ` (중복 ${slots.length - add.length}개 제외)` : ''} – 저장 시 반영`)
  }

  const addSingle = () => {
    if (!single.date || !single.time) { toast(errMsg('E-TC-102', '회차 일자와 시간을 입력하세요'), 'err'); return }
    if (rounds.some(r => r.date === single.date && r.time === single.time)) { toast(errMsg('E-TC-203', '동일 일시의 회차가 이미 존재합니다'), 'err'); return }
    setRounds(renumber([...rounds, { id: rid(p.id, 0), perfId: p.id, date: single.date, time: single.time, no: 0, active: true, distancing: 'none' }]))
    toast(`${fmtDate(single.date)} ${single.time} 회차가 추가되었습니다`)
  }

  const patch = (id: string, pt: Partial<Round>) => setRounds(rounds.map(r => (r.id === id ? { ...r, ...pt } : r)))

  const remove = async (ids: string[]) => {
    const target = rounds.filter(r => ids.includes(r.id))
    const blocked = target.filter(r => sold(r) > 0)
    const ok = target.filter(r => !sold(r))
    if (!ok.length) { toast(errMsg('E-TC-204', '판매 내역이 있는 회차는 삭제할 수 없습니다 (미사용 처리하세요)'), 'err'); return }
    const r = await ask({
      title: '회차 삭제', tone: 'danger', confirmText: '삭제',
      message: <>{ok.length === 1 ? `${fmtDate(ok[0].date)} ${ok[0].time} (${ok[0].no}회)` : `${ok.length}개`} 회차를 삭제합니다.
        {blocked.length > 0 && <><br /><span className="text-coral-500">{errMsg('E-TC-204', `판매 내역이 있는 ${blocked.length}개 회차는 제외됩니다 (미사용 처리하세요)`)}</span></>}</>,
    })
    if (r === null) return
    const del = new Set(ok.map(x => x.id))
    setRounds(renumber(rounds.filter(x => !del.has(x.id))))
    setSelected(s => s.filter(x => !del.has(x)))
    toast(`회차 ${ok.length}개 삭제 – 저장 시 반영`)
  }

  const applyBulk = () => {
    if (bulk.time && !/^\d{2}:\d{2}$/.test(bulk.time)) { toast(errMsg('E-TC-102', '시간 형식이 올바르지 않습니다'), 'err'); return }
    const sel = new Set(selected)
    setRounds(renumber(rounds.map(r => !sel.has(r.id) ? r : {
      ...r,
      time: bulk.time || r.time,
      note: bulk.note === '__keep' ? r.note : bulk.note === '__none' ? undefined : bulk.note,
      distancing: bulk.distancing === '__keep' ? r.distancing : (bulk.distancing as Round['distancing']),
      active: bulk.active === '__keep' ? r.active : bulk.active === 'Y',
    })))
    toast(`선택 회차 ${selected.length}개 일괄 수정 – 저장 시 반영`)
    setBulkOpen(false)
    setBulk({ time: '', note: '__keep', distancing: '__keep', active: '__keep' })
  }

  const cols: Col<Round>[] = [
    { key: 'no', header: '회차', align: 'right', sort: r => r.no, render: r => <b>{r.no}</b> },
    {
      key: 'date', header: '일자', sort: r => r.date + r.time, render: r => (
        <span className={cx('tabular-nums', (r.date < p.start || r.date > p.end) && 'text-coral-500')} title={r.date < p.start || r.date > p.end ? '공연기간 외 회차' : undefined}>
          {fmtDate(r.date)}
        </span>
      ),
    },
    { key: 'time', header: '시간', sort: r => r.time, render: r => <input type="time" className="rounded border border-line px-1.5 py-1 text-xs" value={r.time} aria-label="회차 시간" onChange={e => patch(r.id, { time: e.target.value })} /> },
    {
      key: 'note', header: '비고 (접근성·특별회차)', render: r => (
        <input list="round-note-opts" className="w-40 rounded border border-line px-1.5 py-1 text-xs" placeholder="선택 또는 입력" value={r.note ?? ''} aria-label="비고"
          onChange={e => patch(r.id, { note: e.target.value || undefined })} />
      ),
    },
    {
      key: 'dist', header: '거리두기', render: r => (
        <select className="rounded border border-line bg-white px-1.5 py-1 text-xs" value={r.distancing ?? 'none'} aria-label="거리두기"
          onChange={e => patch(r.id, { distancing: e.target.value as Round['distancing'] })}>
          {DISTANCING.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      ),
    },
    {
      key: 'sold', header: '판매', align: 'right', sort: r => sold(r), render: r => (
        <span className={cx('tabular-nums', sold(r) ? 'font-semibold text-ink' : 'text-muted')}>{sold(r)}<span className="text-[11px] text-muted">/{cap}</span></span>
      ),
    },
    { key: 'active', header: '사용', align: 'center', sort: r => (r.active ? 1 : 0), render: r => <Toggle checked={r.active} label="회차 사용" onChange={v => patch(r.id, { active: v })} /> },
    {
      key: 'del', header: '', render: r => (
        <button type="button" className={cx('btn-ghost btn-sm px-1.5', sold(r) ? 'opacity-40' : 'hover:text-coral-500')} aria-label="회차 삭제"
          title={sold(r) ? '판매 내역이 있어 삭제 불가 (미사용 처리)' : '삭제'}
          onClick={() => sold(r) ? toast(errMsg('E-TC-204', '판매 내역이 있는 회차는 삭제할 수 없습니다 (미사용 처리하세요)'), 'err') : remove([r.id])}>
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  const setRule = (id: string, pt: Partial<RoundRule>) => setRules(rules.map(r => (r.id === id ? { ...r, ...pt } : r)))

  return (
    <div className="space-y-4">
      <datalist id="round-note-opts">{NOTE_OPTIONS.map(n => <option key={n} value={n} />)}</datalist>
      {errors.rounds && <Note tone="err">{errors.rounds}</Note>}

      <Card title={<span className="flex items-center gap-1.5"><Wand2 size={14} />회차 자동 생성</span>} sub="기간·요일·시간 규칙으로 회차를 일괄 생성합니다 (SFR-TC-002)">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <Field label="생성 기간">
              <div className="flex items-center gap-2">
                <input type="date" className="input py-2" value={from} onChange={e => setFrom(e.target.value)} aria-label="생성 시작일" />
                <span className="text-muted">~</span>
                <input type="date" className="input py-2" value={to} min={from} onChange={e => setTo(e.target.value)} aria-label="생성 종료일" />
              </div>
            </Field>
            <div>
              <div className="label text-[13px]">요일별 공연 시간</div>
              <div className="space-y-2">
                {rules.map(rule => (
                  <div key={rule.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
                    <div className="flex gap-0.5">
                      {DOW.map((d, i) => (
                        <button key={d} type="button" aria-pressed={rule.days.includes(i)}
                          onClick={() => setRule(rule.id, { days: rule.days.includes(i) ? rule.days.filter(x => x !== i) : [...rule.days, i] })}
                          className={cx('h-7 w-7 rounded text-xs font-bold', rule.days.includes(i) ? 'bg-brand-600 text-white' : 'bg-paper text-muted hover:bg-brand-50', (i === 0) && !rule.days.includes(i) && 'text-coral-500')}>{d}</button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {rule.times.map((t, ti) => (
                        <span key={ti} className="flex items-center gap-0.5 rounded border border-line bg-white pl-1">
                          <input type="time" value={t} className="py-0.5 text-xs outline-none" aria-label="공연 시간"
                            onChange={e => setRule(rule.id, { times: rule.times.map((x, j) => (j === ti ? e.target.value : x)) })} />
                          <button type="button" className="px-1 text-muted hover:text-coral-500" aria-label="시간 삭제" onClick={() => setRule(rule.id, { times: rule.times.filter((_, j) => j !== ti) })}><X size={11} /></button>
                        </span>
                      ))}
                      <button type="button" className="rounded border border-dashed border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-brand-500" onClick={() => setRule(rule.id, { times: [...rule.times, '19:30'] })}>+ 시간</button>
                    </div>
                    <button type="button" className="ml-auto text-muted hover:text-coral-500" aria-label="규칙 삭제" onClick={() => setRules(rules.filter(r => r.id !== rule.id))}><Trash2 size={13} /></button>
                  </div>
                ))}
                <button type="button" className="btn-outline btn-sm" onClick={() => setRules([...rules, { id: 'r' + Date.now(), days: [], times: ['11:00'] }])}><Plus size={13} />규칙 추가</button>
              </div>
            </div>
            <Field label="제외일 (휴관일·공휴일)">
              <div className="flex flex-wrap items-center gap-1.5">
                <input type="date" className="input w-44 py-1.5" value={exDate} min={from} max={to} onChange={e => setExDate(e.target.value)} aria-label="제외일" />
                <button type="button" className="btn-outline btn-sm" onClick={() => { if (exDate && !exclude.includes(exDate)) setExclude([...exclude, exDate].sort()); setExDate('') }}>추가</button>
                {exclude.map(d => (
                  <span key={d} className="chip gap-1 bg-red-50 text-red-700">{fmtDate(d)}<button type="button" aria-label="제외일 삭제" onClick={() => setExclude(exclude.filter(x => x !== d))}><X size={11} /></button></span>
                ))}
              </div>
            </Field>
          </div>
          <div className="flex flex-col rounded-xl bg-paper p-4">
            <div className="text-xs font-semibold text-muted">생성 미리보기</div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums text-brand-600">{slots.length}<span className="ml-1 text-base text-ink">회차</span></div>
            <div className="text-[11px] text-muted">{new Set(slots.map(s => s.date)).size}일 공연 · 객석 {cap}석 × {slots.length} = {(cap * slots.length).toLocaleString()}석</div>
            <ul className="mt-2 max-h-28 flex-1 space-y-0.5 overflow-y-auto text-[11px] tabular-nums text-muted">
              {slots.slice(0, 30).map(s => <li key={s.date + s.time}>{fmtDate(s.date)} {s.time}</li>)}
              {slots.length > 30 && <li>… 외 {slots.length - 30}회</li>}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />기존 회차 대체 (판매 회차 유지)
            </label>
            <button type="button" className="btn-primary btn-sm mt-2" onClick={generate}><Wand2 size={14} />회차 생성</button>
          </div>
        </div>
      </Card>

      <Card title={`회차 목록 (${rounds.length}개 · 사용 ${rounds.filter(r => r.active).length}개)`} bodyClass="p-3"
        actions={<>
          <input type="date" className="rounded-md border border-line px-2 py-1 text-xs" value={single.date} onChange={e => setSingle({ ...single, date: e.target.value })} aria-label="추가 회차 일자" />
          <input type="time" className="rounded-md border border-line px-2 py-1 text-xs" value={single.time} onChange={e => setSingle({ ...single, time: e.target.value })} aria-label="추가 회차 시간" />
          <button type="button" className="btn-outline btn-sm" onClick={addSingle}><CalendarPlus size={13} />회차 추가</button>
        </>}>
        {selected.length > 0 && (
          <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50/60 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <b className="text-brand-700">{selected.length}개 회차 선택</b>
              <button type="button" className="btn-outline btn-sm" onClick={() => setBulkOpen(o => !o)}><Pencil size={13} />일괄 수정</button>
              <button type="button" className="btn-outline btn-sm" onClick={() => { const s = new Set(selected); setRounds(rounds.map(r => s.has(r.id) ? { ...r, active: false } : r)); toast(`${selected.length}개 회차 미사용 처리`) }}>미사용 처리</button>
              <button type="button" className="btn-outline btn-sm hover:!border-coral-500 hover:!text-coral-500" onClick={() => remove(selected)}><Trash2 size={13} />선택 삭제</button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected([])}>선택 해제</button>
            </div>
            {bulkOpen && (
              <div className="mt-3 grid gap-2 border-t border-brand-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="text-xs font-semibold">시간<input type="time" className="input mt-1 py-1.5" value={bulk.time} onChange={e => setBulk({ ...bulk, time: e.target.value })} /></label>
                <label className="text-xs font-semibold">비고
                  <select className="input mt-1 py-1.5" value={bulk.note} onChange={e => setBulk({ ...bulk, note: e.target.value })}>
                    <option value="__keep">변경 안 함</option><option value="__none">비고 삭제</option>
                    {NOTE_OPTIONS.map(n => <option key={n}>{n}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">거리두기
                  <select className="input mt-1 py-1.5" value={bulk.distancing} onChange={e => setBulk({ ...bulk, distancing: e.target.value })}>
                    <option value="__keep">변경 안 함</option>
                    {DISTANCING.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">사용 여부
                  <select className="input mt-1 py-1.5" value={bulk.active} onChange={e => setBulk({ ...bulk, active: e.target.value })}>
                    <option value="__keep">변경 안 함</option><option value="Y">사용</option><option value="N">미사용</option>
                  </select>
                </label>
                <div className="flex items-end"><button type="button" className="btn-primary btn-sm w-full" onClick={applyBulk}>적용</button></div>
              </div>
            )}
          </div>
        )}
        <DataTable columns={cols} rows={rounds} rowKey={r => r.id} selectable selected={selected} onSelectChange={setSelected} dense pageSize={20}
          rowClass={r => (!r.active ? 'opacity-50' : undefined)} empty="등록된 회차가 없습니다. 위의 자동 생성 또는 회차 추가를 이용하세요." />
        <p className="mt-2 text-[11px] text-muted">※ 판매 내역이 있는 회차는 삭제할 수 없으며 미사용 처리 시 홈페이지·POS 회차 선택에서 제외됩니다. 변경사항은 [저장] 시 반영됩니다.</p>
      </Card>
    </div>
  )
}
