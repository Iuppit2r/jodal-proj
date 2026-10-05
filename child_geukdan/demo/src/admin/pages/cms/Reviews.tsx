import { useMemo, useState, type ReactNode } from 'react'
import { EyeOff, Plus, ShieldAlert, Star, Trash2, Undo2, X } from 'lucide-react'
import { useStore } from '../../../store'
import type { Review } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, FilterBar, Kpi, Note, PiiToggle, Status, Toggle, ask, errMsg, usePII, type Col } from '../../ui'
import { usePerfMap } from '../../lib'
import { useCmsLocal } from './cmsStore'

const BLIND_TEXT = '관리자에 의해 블라인드 처리된 후기입니다.'

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`별점 ${n}점`}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} className={i <= n ? 'fill-sun-400 text-sun-400' : 'text-gray-300'} />)}
    </span>
  )
}
function highlight(text: string, words: string[]): ReactNode {
  if (!words.length) return text
  const re = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return text.split(re).map((p, i) => words.includes(p) ? <mark key={i} className="rounded bg-red-100 px-0.5 text-red-700">{p}</mark> : p)
}

export default function Reviews() {
  const reviews = useStore(s => s.reviews)
  const members = useStore(s => s.members)
  const perfs = useStore(s => s.performances)
  const deleteReview = useStore(s => s.deleteReview)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const perfMap = usePerfMap()
  const pii = usePII()
  const { badWords, autoBlind, blinded, set } = useCmsLocal()
  const [draft, setDraft] = useState({ perf: '', rating: '', kw: '', state: '' })
  const [q, setQ] = useState(draft)
  const [word, setWord] = useState('')
  const [wordErr, setWordErr] = useState('')

  const hasBad = (r: Review) => badWords.some(w => r.body.includes(w))
  const rows = useMemo(() => reviews
    .filter(r => !q.perf || r.perfId === q.perf)
    .filter(r => !q.rating || r.rating === Number(q.rating))
    .filter(r => !q.kw || r.body.includes(q.kw) || r.name.includes(q.kw))
    .filter(r => !q.state || (q.state === 'blind' ? !!blinded[r.id] : q.state === 'bad' ? hasBad(r) : !blinded[r.id]))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [reviews, q, blinded, badWords])

  const setBody = (id: string, body: string) => useStore.getState().set({ reviews: useStore.getState().reviews.map(r => r.id === id ? { ...r, body } : r) })
  const blind = async (r: Review) => {
    const reason = await ask({ title: '후기 블라인드', tone: 'warn', confirmText: '블라인드', message: <>후기를 블라인드 처리합니다. 홈페이지에는 「{BLIND_TEXT}」로 표시되며 원문은 보관됩니다.</>, reasonOptions: ['금칙어 포함', '욕설·비방', '광고·홍보성', '개인정보 노출', '공연과 무관한 내용'] })
    if (reason === null) return
    set({ blinded: { ...blinded, [r.id]: r.body } })
    setBody(r.id, BLIND_TEXT)
    log(`관람후기 블라인드(사유: ${reason})`, `${perfMap.get(r.perfId)?.title ?? ''} / ${r.name}`)
    toast('후기를 블라인드 처리했습니다.')
  }
  const unblind = async (r: Review) => {
    const ok = await ask({ title: '블라인드 해제', message: '블라인드를 해제하고 원문을 다시 게시합니다.', confirmText: '해제' })
    if (ok === null) return
    setBody(r.id, blinded[r.id])
    const next = { ...blinded }; delete next[r.id]
    set({ blinded: next })
    log('관람후기 블라인드 해제', `${perfMap.get(r.perfId)?.title ?? ''} / ${r.name}`)
    toast('블라인드를 해제했습니다.')
  }
  const remove = async (r: Review) => {
    const reason = await ask({ title: '후기 삭제', tone: 'danger', confirmText: '삭제', message: <>후기를 영구 삭제합니다. 삭제 후 복구할 수 없습니다.</>, reason: '삭제 사유' })
    if (reason === null) return
    deleteReview(r.id)
    log(`관람후기 삭제(사유: ${reason})`, `${perfMap.get(r.perfId)?.title ?? ''} / ${r.name}`)
    toast('후기를 삭제했습니다.')
  }
  const applyAll = async () => {
    const targets = reviews.filter(r => !blinded[r.id] && hasBad(r))
    if (!targets.length) { toast('금칙어가 포함된 게시 중 후기가 없습니다.', 'warn'); return }
    const ok = await ask({ title: '금칙어 일괄 블라인드', tone: 'warn', confirmText: `${targets.length}건 블라인드`, message: <>금칙어가 포함된 후기 <b>{targets.length}건</b>을 일괄 블라인드 처리합니다.</> })
    if (ok === null) return
    const nb = { ...blinded }
    targets.forEach(r => { nb[r.id] = r.body })
    set({ blinded: nb })
    useStore.getState().set({ reviews: useStore.getState().reviews.map(r => nb[r.id] && !blinded[r.id] ? { ...r, body: BLIND_TEXT } : r) })
    log('관람후기 금칙어 일괄 블라인드', `${targets.length}건`)
    toast(`${targets.length}건을 블라인드 처리했습니다.`)
  }
  const addWord = () => {
    const w = word.trim()
    if (!w) return
    if (w.length < 2) { setWordErr(errMsg('E-CM-601', '금칙어는 2자 이상 입력해 주세요')); return }
    if (badWords.includes(w)) { setWordErr(errMsg('E-CM-602', '이미 등록된 금칙어입니다')); return }
    set({ badWords: [...badWords, w] }); setWord(''); setWordErr('')
    log('금칙어 추가', w)
  }

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
  const cols: Col<Review>[] = [
    { key: 'createdAt', header: '작성일', render: r => r.createdAt.replace(/-/g, '.'), sort: r => r.createdAt },
    { key: 'perf', header: '공연', render: r => <span className="font-semibold">{perfMap.get(r.perfId)?.title ?? '-'}</span>, sort: r => perfMap.get(r.perfId)?.title ?? '' },
    { key: 'rating', header: '평점', render: r => <Stars n={r.rating} />, sort: r => r.rating },
    { key: 'name', header: '작성자', render: r => { const m = members.find(x => x.id === r.userId); return m ? pii.name(m.name) : r.name } },
    {
      key: 'body', header: '내용', className: 'max-w-[420px] whitespace-normal', render: r => blinded[r.id]
        ? <span className="text-xs text-muted"><EyeOff size={12} className="mr-1 inline" />{BLIND_TEXT}<span className="ml-1 text-gray-400">(원문: {blinded[r.id].slice(0, 24)}…)</span></span>
        : <span className="line-clamp-2 text-[13px]">{highlight(r.body, badWords)}</span>,
    },
    { key: 'state', header: '상태', render: r => blinded[r.id] ? <Status s="블라인드" /> : hasBad(r) ? <Status s="금칙어" className="!bg-red-50 !text-red-700" /> : <Status s="게시중" /> },
    {
      key: 'act', header: '관리', align: 'right', render: r => (
        <div className="flex justify-end gap-1">
          {blinded[r.id]
            ? <button className="btn-ghost btn-sm" onClick={() => unblind(r)}><Undo2 size={13} />해제</button>
            : <button className="btn-ghost btn-sm" onClick={() => blind(r)}><EyeOff size={13} />블라인드</button>}
          <button className="btn-ghost btn-sm text-coral-500" onClick={() => remove(r)} aria-label="삭제"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="전체 후기" value={`${reviews.length}건`} icon={<Star size={16} />} />
        <Kpi label="평균 평점" value={avg.toFixed(2)} sub="5점 만점" tone="sun" icon={<Star size={16} />} />
        <Kpi label="블라인드" value={`${Object.keys(blinded).length}건`} tone="ink" icon={<EyeOff size={16} />} />
        <Kpi label="금칙어 포함(게시중)" value={`${reviews.filter(r => !blinded[r.id] && hasBad(r)).length}건`} tone="coral" icon={<ShieldAlert size={16} />} />
      </div>
      <FilterBar onSearch={() => setQ(draft)} onReset={() => { const e = { perf: '', rating: '', kw: '', state: '' }; setDraft(e); setQ(e) }}>
        <Field label="공연"><select className="input" value={draft.perf} onChange={e => setDraft({ ...draft, perf: e.target.value })}><option value="">전체</option>{perfs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
        <Field label="평점"><select className="input" value={draft.rating} onChange={e => setDraft({ ...draft, rating: e.target.value })}><option value="">전체</option>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}점)</option>)}</select></Field>
        <Field label="상태"><select className="input" value={draft.state} onChange={e => setDraft({ ...draft, state: e.target.value })}><option value="">전체</option><option value="live">게시중</option><option value="blind">블라인드</option><option value="bad">금칙어 포함</option></select></Field>
        <Field label="검색어"><input className="input" placeholder="내용·작성자" value={draft.kw} onChange={e => setDraft({ ...draft, kw: e.target.value })} /></Field>
      </FilterBar>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card title="관람후기 목록" actions={<>
          <PiiToggle />
          <ExportButtons filename="관람후기" count={rows.length} getRows={() => [['작성일', '공연', '평점', '작성자', '내용', '상태'], ...rows.map(r => [r.createdAt, perfMap.get(r.perfId)?.title ?? '', r.rating, r.name, r.body, blinded[r.id] ? '블라인드' : '게시중'])]} />
        </>}>
          <DataTable columns={cols} rows={rows} rowKey={r => r.id} rowClass={r => blinded[r.id] ? 'bg-paper/70' : undefined} />
        </Card>
        <Card title={<span className="flex items-center gap-1.5"><ShieldAlert size={15} className="text-coral-500" />금칙어 필터</span>} sub="등록된 단어가 포함된 후기는 작성 단계에서 차단됩니다.">
          <div className="flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-sm">
            <span>등록 시 자동 블라인드</span>
            <Toggle checked={autoBlind} onChange={v => { set({ autoBlind: v }); log('금칙어 자동 블라인드 설정', v ? '사용' : '미사용') }} label="자동 블라인드" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badWords.map(w => (
              <span key={w} className="chip gap-1 bg-red-50 text-red-700">
                {w}
                <button onClick={() => { set({ badWords: badWords.filter(x => x !== w) }); log('금칙어 삭제', w) }} aria-label={`${w} 삭제`}><X size={11} /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-1">
            <input className={cx('input py-2')} placeholder="금칙어 입력" value={word} onChange={e => { setWord(e.target.value); setWordErr('') }} onKeyDown={e => e.key === 'Enter' && addWord()} aria-invalid={!!wordErr} />
            <button className="btn-outline btn-sm shrink-0" onClick={addWord}><Plus size={13} />추가</button>
          </div>
          {wordErr && <p className="mt-1 text-xs text-coral-500">{wordErr}</p>}
          <button className="btn-outline btn-sm mt-3 w-full" onClick={applyAll}><EyeOff size={13} />기존 후기에 일괄 적용</button>
          <Note className="mt-3">블라인드 처리된 원문은 분쟁 대응을 위해 1년간 보관 후 자동 파기됩니다.</Note>
        </Card>
      </div>
    </div>
  )
}
