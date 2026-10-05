import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useStore } from '../../../store'
import type { TicketType } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Card, Note, Toggle, ask, errMsg } from '../../ui'
import { TODAY } from '../../lib'
import { useSysLocal } from './systemStore'
import { BinsSection, CardGroupsSection, CardsSection, LabelsSection } from './BasicCards'

const SECTIONS = [
  { id: 'genre', label: '카테고리(장르)' },
  { id: 'code', label: '상품코드 규칙' },
  { id: 'ticket', label: '권종 코드' },
  { id: 'cards', label: '카드사 조회' },
  { id: 'bin', label: '카드 BIN 등록' },
  { id: 'cardgroup', label: '카드 할인그룹' },
  { id: 'label', label: '수동 라벨' },
] as const
type Sec = typeof SECTIONS[number]['id']

export default function Basic() {
  const [sec, setSec] = useState<Sec>('genre')
  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
      <nav className="card h-fit p-2" aria-label="기본정보 항목">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map(s => (
            <li key={s.id} className="shrink-0">
              <button onClick={() => setSec(s.id)} className={cx('w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-semibold transition', sec === s.id ? 'bg-brand-600 text-white' : 'text-muted hover:bg-paper hover:text-ink')}>{s.label}</button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">
        {sec === 'genre' && <Genres />}
        {sec === 'code' && <CodeRule />}
        {sec === 'ticket' && <TicketTypes />}
        {sec === 'cards' && <CardsSection />}
        {sec === 'bin' && <BinsSection />}
        {sec === 'cardgroup' && <CardGroupsSection />}
        {sec === 'label' && <LabelsSection />}
      </div>
    </div>
  )
}

function Genres() {
  const genres = useSysLocal(s => s.genres)
  const set = useSysLocal(s => s.set)
  const perfs = useStore(s => s.performances)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const used = (g: string) => perfs.filter(p => p.genre === g).length
  const move = (i: number, d: -1 | 1) => {
    const n = [...genres];
    [n[i], n[i + d]] = [n[i + d], n[i]]
    set({ genres: n })
    log('장르 순서 변경', n.join(' > '))
  }
  const add = () => {
    const v = name.trim()
    if (!v) { setErr(errMsg('E-SY-301', '장르명을 입력해 주세요')); return }
    if (genres.includes(v)) { setErr(errMsg('E-SY-302', '이미 등록된 장르입니다')); return }
    set({ genres: [...genres, v] }); setName(''); setErr('')
    log('장르 추가', v); toast(`'${v}' 장르를 추가했습니다.`)
  }
  const del = async (g: string) => {
    if (used(g)) { setErr(errMsg('E-SY-303', `'${g}' 장르로 등록된 공연 ${used(g)}건이 있어 삭제할 수 없습니다`)); return }
    const r = await ask({ title: '장르 삭제', tone: 'danger', confirmText: '삭제', message: <>장르 <b>「{g}」</b>를 삭제합니다.</> })
    if (r === null) return
    set({ genres: genres.filter(x => x !== g) }); log('장르 삭제', g)
  }
  return (
    <Card title="카테고리(장르) 순서 관리" sub="홈페이지 공연 목록 필터·정렬 순서에 사용됩니다. 변경 즉시 저장됩니다.">
      {err && <Note tone="err" className="mb-3">{err}</Note>}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {genres.map((g, i) => (
          <li key={g} className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 text-center text-sm font-bold text-muted">{i + 1}</span>
            <span className="flex-1 font-semibold">{g}</span>
            <span className="text-xs text-muted">공연 {used(g)}건</span>
            <button className="btn-ghost p-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로"><ArrowUp size={14} /></button>
            <button className="btn-ghost p-1" disabled={i === genres.length - 1} onClick={() => move(i, 1)} aria-label="아래로"><ArrowDown size={14} /></button>
            <button className="btn-ghost p-1 text-coral-500" onClick={() => del(g)} aria-label="삭제"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex max-w-md gap-1">
        <input className="input py-2" placeholder="새 장르명 (예: 마임극)" value={name} onChange={e => { setName(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-outline btn-sm shrink-0" onClick={add}><Plus size={13} />추가</button>
      </div>
    </Card>
  )
}

function CodeRule() {
  const saved = useSysLocal(s => s.codeRule)
  const set = useSysLocal(s => s.set)
  const perfs = useStore(s => s.performances)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [f, setF] = useState(saved)
  const [err, setErr] = useState('')
  const year = TODAY.slice(0, 4)
  const nextSeq = 1 + Math.max(0, ...perfs.filter(p => p.code.includes(year)).map(p => Number(p.code.match(/(\d+)$/)?.[1] ?? 0)))
  const preview = (n: number) => [f.prefix, year, String(n).padStart(f.digits, '0')].join(f.sep)
  const save = () => {
    if (!/^[A-Z]{2,6}$/.test(f.prefix)) { setErr(errMsg('E-SY-311', '접두어는 영문 대문자 2~6자로 입력해 주세요')); return }
    setErr('')
    set({ codeRule: f })
    log('상품코드 규칙 변경', `${f.prefix}${f.sep}YYYY${f.sep}${'N'.repeat(f.digits)}`)
    toast('상품코드 규칙을 저장했습니다. 신규 등록 공연부터 적용됩니다.')
  }
  return (
    <Card title="상품코드 규칙" sub="공연 등록 시 상품코드가 자동 채번됩니다. (통합전산망 공연코드와 별도)"
      actions={<button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>}>
      {err && <Note tone="err" className="mb-3">{err}</Note>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label text-[13px]">접두어</label><input className="input font-mono" value={f.prefix} onChange={e => setF({ ...f, prefix: e.target.value.toUpperCase() })} /></div>
        <div><label className="label text-[13px]">구분자</label>
          <select className="input" value={f.sep} onChange={e => setF({ ...f, sep: e.target.value })}><option value="-">하이픈 (-)</option><option value="_">언더바 (_)</option><option value="">없음</option></select>
        </div>
        <div><label className="label text-[13px]">일련번호 자릿수</label>
          <select className="input" value={f.digits} onChange={e => setF({ ...f, digits: Number(e.target.value) })}>{[2, 3, 4].map(n => <option key={n} value={n}>{n}자리</option>)}</select>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-paper p-4">
        <p className="text-xs font-semibold text-muted">미리보기 (형식: {f.prefix}{f.sep}YYYY{f.sep}{'N'.repeat(f.digits)})</p>
        <p className="mt-1 font-mono text-2xl font-extrabold text-brand-600">{preview(nextSeq)}</p>
        <p className="mt-1 text-xs text-muted">다음 등록 공연에 부여될 코드 · 연도는 공연 시작일 기준, 일련번호는 연도별 초기화</p>
      </div>
      <p className="label mt-4 text-[13px]">현재 등록된 상품코드</p>
      <div className="flex flex-wrap gap-1.5">{perfs.map(p => <span key={p.id} className="chip bg-gray-100 font-mono text-gray-700" title={p.title}>{p.code}</span>)}</div>
    </Card>
  )
}

type TT = TicketType & { isNew?: boolean }
function TicketTypes() {
  const saved = useSysLocal(s => s.ticketTypes)
  const set = useSysLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [rows, setRows] = useState<TT[]>(() => saved.map(t => ({ ...t })))
  const [err, setErr] = useState('')
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved)
  const patch = (id: string, p: Partial<TT>) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...p } : r))
  const copy = (t: TT) => {
    let n = 1
    while (rows.some(r => r.id === `${t.id}-c${n}`)) n++
    const c: TT = { ...t, id: `${t.id}-c${n}`, name: `${t.name} (복사)`, isNew: true }
    const i = rows.findIndex(r => r.id === t.id)
    setRows([...rows.slice(0, i + 1), c, ...rows.slice(i + 1)])
  }
  const save = () => {
    const bad = rows.find(r => !r.name.trim())
    if (bad) { setErr(errMsg('E-SY-320', '권종명을 입력해 주세요')); return }
    const badRate = rows.find(r => r.discountRate < 0 || r.discountRate > 1 || Number.isNaN(r.discountRate))
    if (badRate) { setErr(errMsg('E-SY-321', `「${badRate.name}」 할인율은 0~100% 사이여야 합니다`)); return }
    const dup = rows.find((r, i) => rows.findIndex(x => x.name.trim() === r.name.trim()) !== i)
    if (dup) { setErr(errMsg('E-SY-322', `권종명 「${dup.name}」이(가) 중복됩니다`)); return }
    setErr('')
    const added = rows.filter(r => r.isNew).length
    const clean = rows.map(({ isNew, ...r }) => { void isNew; return r })
    set({ ticketTypes: clean })
    setRows(clean)
    log('권종 코드 저장', `${clean.length}개 권종${added ? ` (신규 ${added})` : ''}`)
    toast('권종 코드를 저장했습니다.')
  }
  return (
    <Card title="권종 코드" sub="예매·발권 시 선택 가능한 권종입니다. 「기존 값 복사」로 유사 권종을 빠르게 만들 수 있습니다."
      actions={<>
        {dirty && <span className="text-xs font-semibold text-amber-600">저장되지 않은 변경사항</span>}
        <button className="btn-outline btn-sm" disabled={!dirty} onClick={() => { setRows(saved.map(t => ({ ...t }))); setErr('') }}><RotateCcw size={13} />되돌리기</button>
        <button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>
      </>} bodyClass="p-0">
      {err && <Note tone="err" className="m-4 mb-0">{err}</Note>}
      <div className="tbl-wrap overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>코드</th><th>권종명</th><th className="text-right">할인율</th><th>설명·증빙</th><th className="text-center">증빙</th><th className="text-center">사용</th><th className="text-right">관리</th></tr></thead>
          <tbody>
            {rows.map(t => (
              <tr key={t.id} className={cx(t.isNew && 'bg-amber-50/60', !t.active && 'opacity-60')}>
                <td className="font-mono text-xs">{t.id}{t.isNew && <span className="ml-1 rounded bg-amber-400 px-1 text-[10px] font-bold text-ink">NEW</span>}</td>
                <td>{t.isNew ? <input className="input w-40 py-1 text-sm" value={t.name} onChange={e => patch(t.id, { name: e.target.value })} aria-label="권종명" /> : <b>{t.name}</b>}</td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-1">
                    <input type="number" min={0} max={100} className="input w-20 py-1 text-right text-sm" value={Math.round(t.discountRate * 100)} onChange={e => patch(t.id, { discountRate: Number(e.target.value) / 100 })} aria-label="할인율" />%
                  </span>
                </td>
                <td>{t.isNew ? <input className="input w-56 py-1 text-xs" value={t.desc} onChange={e => patch(t.id, { desc: e.target.value })} aria-label="설명" /> : <span className="text-xs text-muted">{t.desc}{t.memberOnly && ' · 멤버십 전용'}</span>}</td>
                <td className="text-center"><input type="checkbox" className="accent-brand-600" checked={!!t.needsProof} onChange={e => patch(t.id, { needsProof: e.target.checked })} aria-label="증빙 필요" /></td>
                <td className="text-center"><Toggle checked={t.active} onChange={v => patch(t.id, { active: v })} label={`${t.name} 사용`} /></td>
                <td className="text-right">
                  <button className="btn-ghost btn-sm" onClick={() => copy(t)}><Copy size={13} />기존 값 복사</button>
                  {t.isNew && <button className="btn-ghost btn-sm text-coral-500" onClick={() => setRows(rows.filter(r => r.id !== t.id))} aria-label="행 삭제"><Trash2 size={13} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-[11px] text-muted">기존 권종은 판매 이력 보존을 위해 삭제할 수 없으며 「미사용」으로 전환합니다. 할인율 변경은 변경 이후 예매분부터 적용됩니다.</p>
    </Card>
  )
}
