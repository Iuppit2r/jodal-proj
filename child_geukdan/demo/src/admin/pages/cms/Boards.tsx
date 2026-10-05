import { useMemo, useState } from 'react'
import { Paperclip, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../../store'
import type { Notice } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Card, DataTable, DateRange, ExportButtons, FilterBar, Field, ask, type Col } from '../../ui'
import { num } from '../../lib'
import NoticeEditor from './NoticeEditor'

export const CATEGORIES: Notice['category'][] = ['공지', '공연', '채용', '입찰', '이벤트']
const CAT_TONE: Record<string, string> = {
  공지: 'bg-brand-50 text-brand-700', 공연: 'bg-violet-50 text-violet-700', 채용: 'bg-emerald-50 text-emerald-700',
  입찰: 'bg-amber-50 text-amber-700', 이벤트: 'bg-orange-50 text-coral-500',
}
export const CatChip = ({ c }: { c: string }) => <span className={cx('chip', CAT_TONE[c] ?? 'bg-gray-100 text-gray-600')}>{c}</span>
export const stripHtml = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

interface Q { kw: string; field: 'all' | 'title' | 'body'; cat: string; pinned: string; from: string; to: string }
const EMPTY: Q = { kw: '', field: 'all', cat: '', pinned: '', from: '', to: '' }

export default function Boards() {
  const notices = useStore(s => s.notices)
  const deleteNotice = useStore(s => s.deleteNotice)
  const toast = useStore(s => s.toast)
  const [draft, setDraft] = useState<Q>(EMPTY)
  const [q, setQ] = useState<Q>(EMPTY)
  const [sel, setSel] = useState<string[]>([])
  const [edit, setEdit] = useState<Notice | null>(null)

  const rows = useMemo(() => {
    const kw = q.kw.trim().toLowerCase()
    return notices
      .filter(n => !q.cat || n.category === q.cat)
      .filter(n => !q.pinned || (q.pinned === 'Y' ? n.pinned : !n.pinned))
      .filter(n => (!q.from || n.date >= q.from) && (!q.to || n.date <= q.to))
      .filter(n => !kw || (q.field !== 'body' && n.title.toLowerCase().includes(kw)) || (q.field !== 'title' && stripHtml(n.body).toLowerCase().includes(kw)))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date))
  }, [notices, q])

  const remove = async (n: Notice) => {
    const r = await ask({ title: '게시물 삭제', tone: 'danger', confirmText: '삭제', message: <>게시물 <b>「{n.title}」</b>을(를) 삭제합니다. 홈페이지에서 즉시 내려가며 복구할 수 없습니다.</> })
    if (r === null) return
    deleteNotice(n.id)
    toast('게시물을 삭제했습니다.')
  }
  const removeSel = async () => {
    const r = await ask({ title: '선택 게시물 삭제', tone: 'danger', confirmText: `${sel.length}건 삭제`, message: <>선택한 게시물 <b>{sel.length}건</b>을 일괄 삭제합니다.</> })
    if (r === null) return
    sel.forEach(id => deleteNotice(id))
    setSel([])
    toast(`${sel.length}건을 삭제했습니다.`)
  }
  const newNotice = (): Notice => ({ id: 'n' + Date.now().toString(36), category: '공지', title: '', body: '', date: '', views: 0, files: [] })

  const cols: Col<Notice>[] = [
    { key: 'no', header: '번호', align: 'center', render: (n, i) => n.pinned ? <Pin size={13} className="mx-auto fill-coral-500 text-coral-500" /> : <span className="text-muted">{rows.length - i}</span> },
    { key: 'category', header: '분류', render: n => <CatChip c={n.category} />, sort: n => n.category },
    {
      key: 'title', header: '제목', className: 'max-w-[460px]', sort: n => n.title, render: n => (
        <button className={cx('block max-w-full truncate text-left hover:text-brand-600 hover:underline', n.pinned && 'font-bold')} onClick={() => setEdit(n)} title={n.title}>{n.title}</button>
      ),
    },
    { key: 'files', header: '첨부', align: 'center', render: n => n.files?.length ? <span className="inline-flex items-center gap-0.5 text-xs text-muted"><Paperclip size={12} />{n.files.length}</span> : '', sort: n => n.files?.length ?? 0 },
    { key: 'date', header: '게시일', render: n => n.date.replace(/-/g, '.'), sort: n => n.date },
    { key: 'views', header: '조회수', align: 'right', render: n => num(n.views), sort: n => n.views },
    {
      key: 'act', header: '관리', align: 'right', render: n => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost btn-sm" onClick={() => setEdit(n)}><Pencil size={13} />수정</button>
          <button className="btn-ghost btn-sm text-coral-500" onClick={() => remove(n)} aria-label="삭제"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <FilterBar onSearch={() => setQ(draft)} onReset={() => { setDraft(EMPTY); setQ(EMPTY) }}>
        <Field label="검색어">
          <div className="flex gap-1">
            <select className="input w-24 shrink-0 px-2" value={draft.field} onChange={e => setDraft({ ...draft, field: e.target.value as Q['field'] })} aria-label="검색 대상">
              <option value="all">전체</option><option value="title">제목</option><option value="body">내용</option>
            </select>
            <input className="input" placeholder="검색어 입력" value={draft.kw} onChange={e => setDraft({ ...draft, kw: e.target.value })} />
          </div>
        </Field>
        <Field label="분류">
          <select className="input" value={draft.cat} onChange={e => setDraft({ ...draft, cat: e.target.value })}>
            <option value="">전체</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="상단 고정">
          <select className="input" value={draft.pinned} onChange={e => setDraft({ ...draft, pinned: e.target.value })}>
            <option value="">전체</option><option value="Y">고정글</option><option value="N">일반글</option>
          </select>
        </Field>
        <Field label="게시일"><DateRange from={draft.from} to={draft.to} onChange={(from, to) => setDraft({ ...draft, from, to })} /></Field>
      </FilterBar>
      <Card title="게시물 목록" sub="상단 고정글이 먼저 표시됩니다. 제목을 클릭하면 수정 화면이 열립니다."
        actions={<>
          {sel.length > 0 && <button className="btn-outline btn-sm text-coral-500" onClick={removeSel}><Trash2 size={13} />선택 삭제 ({sel.length})</button>}
          <ExportButtons filename="게시물목록" count={rows.length}
            getRows={() => [['분류', '제목', '상단고정', '게시일', '조회수', '첨부파일'], ...rows.map(n => [n.category, n.title, n.pinned ? 'Y' : 'N', n.date, n.views, (n.files ?? []).join(' / ')])]} />
          <button className="btn-primary btn-sm" onClick={() => setEdit(newNotice())}><Plus size={14} />글쓰기</button>
        </>}>
        <DataTable columns={cols} rows={rows} rowKey={n => n.id} selectable selected={sel} onSelectChange={setSel} rowClass={n => n.pinned ? 'bg-amber-50/40' : undefined} />
      </Card>
      {edit && <NoticeEditor key={edit.id} notice={edit} exists={notices.some(n => n.id === edit.id)} onClose={() => setEdit(null)} />}
    </div>
  )
}
