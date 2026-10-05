import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '../../../components/Modal'
import { useStore } from '../../../store'
import type { Popup } from '../../../data/types'
import { Card, DataTable, ExportButtons, Field, Note, Segmented, Status, Toggle, ask, errMsg, type Col } from '../../ui'
import { TODAY, addDays } from '../../lib'
import { uid } from './cmsStore'

export const popupStatus = (p: Popup) => (!p.active ? '숨김' : p.start > TODAY ? '예정' : p.end < TODAY ? '종료' : '게시중')

export default function Popups() {
  const popups = useStore(s => s.popups)
  const upsert = useStore(s => s.upsertPopup)
  const toast = useStore(s => s.toast)
  const [edit, setEdit] = useState<Popup | null>(null)
  const [preview, setPreview] = useState<Popup | null>(null)
  const [filter, setFilter] = useState<'전체' | '게시중' | '예정' | '종료'>('전체')

  const rows = useMemo(() => popups.filter(p => filter === '전체' || popupStatus(p) === filter), [popups, filter])
  const remove = async (p: Popup) => {
    const r = await ask({ title: '팝업 삭제', tone: 'danger', confirmText: '삭제', message: <>팝업 <b>「{p.title}」</b>을(를) 삭제합니다. 게시 중인 경우 홈페이지에서 즉시 내려갑니다.</> })
    if (r === null) return
    const st = useStore.getState()
    st.set({ popups: st.popups.filter(x => x.id !== p.id) })
    st.log('팝업 삭제', p.title)
    st.toast('팝업을 삭제했습니다.')
  }
  const cols: Col<Popup>[] = [
    { key: 'status', header: '상태', render: p => <Status s={popupStatus(p)} />, sort: p => popupStatus(p) },
    { key: 'title', header: '팝업 제목', render: p => <button className="font-semibold text-ink hover:text-brand-600 hover:underline" onClick={() => setEdit(p)}>{p.title}</button>, sort: p => p.title },
    { key: 'period', header: '게시 기간', render: p => `${p.start.replace(/-/g, '.')} ~ ${p.end.replace(/-/g, '.')}`, sort: p => p.start },
    { key: 'link', header: '연결 링크', render: p => <span className="text-xs text-muted">{p.link || '-'}</span> },
    { key: 'active', header: '사용', align: 'center', render: p => <Toggle checked={p.active} label="사용" onChange={v => { upsert({ ...p, active: v }); toast(`팝업 ${v ? '사용' : '미사용'} 처리 – 홈페이지 즉시 반영`) }} /> },
    {
      key: 'act', header: '관리', align: 'right', render: p => (
        <div className="flex justify-end gap-1">
          <button className="btn-ghost btn-sm" onClick={() => setPreview(p)}><Eye size={13} />미리보기</button>
          <button className="btn-ghost btn-sm" onClick={() => setEdit(p)}><Pencil size={13} />수정</button>
          <button className="btn-ghost btn-sm text-coral-500" onClick={() => remove(p)} aria-label="삭제"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ]
  return (
    <div className="space-y-4">
      <Note>게시 기간과 사용 여부에 따라 홈페이지 메인에 최대 3개까지 레이어 팝업으로 표시됩니다. 이용자는 「오늘 하루 보지 않기」로 닫을 수 있습니다. (기준일 {TODAY})</Note>
      <Card title="팝업 목록" sub={`게시중 ${popups.filter(p => popupStatus(p) === '게시중').length}건 · 예정 ${popups.filter(p => popupStatus(p) === '예정').length}건`}
        actions={<>
          <Segmented size="sm" value={filter} onChange={setFilter} options={(['전체', '게시중', '예정', '종료'] as const).map(v => ({ value: v, label: v }))} />
          <ExportButtons filename="팝업목록" count={rows.length} getRows={() => [['상태', '제목', '시작일', '종료일', '링크', '내용'], ...rows.map(p => [popupStatus(p), p.title, p.start, p.end, p.link ?? '', p.body])]} />
          <button className="btn-primary btn-sm" onClick={() => setEdit({ id: uid('pop'), title: '', body: '', start: TODAY, end: addDays(TODAY, 14), active: true, link: '' })}><Plus size={14} />팝업 등록</button>
        </>}>
        <DataTable columns={cols} rows={rows} rowKey={p => p.id} initialSort={{ key: 'period', dir: 'desc' }} empty="등록된 팝업이 없습니다." />
      </Card>
      {edit && <PopupModal key={edit.id} popup={edit} exists={popups.some(p => p.id === edit.id)} onClose={() => setEdit(null)} onPreview={setPreview} />}
      {preview && <PopupPreview popup={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function PopupModal({ popup, exists, onClose, onPreview }: { popup: Popup; exists: boolean; onClose: () => void; onPreview: (p: Popup) => void }) {
  const [f, setF] = useState<Popup>(popup)
  const [err, setErr] = useState<Record<string, string>>({})
  const upsert = useStore(s => s.upsertPopup)
  const toast = useStore(s => s.toast)
  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = errMsg('E-CM-201', '팝업 제목은 필수 입력입니다')
    if (!f.body.trim()) e.body = errMsg('E-CM-202', '팝업 내용을 입력해 주세요')
    else if (f.body.length > 200) e.body = errMsg('E-CM-203', '내용은 200자 이내로 입력해 주세요')
    if (!f.start || !f.end) e.period = errMsg('E-CM-204', '게시 기간을 입력해 주세요')
    else if (f.end < f.start) e.period = errMsg('E-CM-205', '종료일이 시작일보다 빠릅니다')
    if (f.link && !/^(\/|https?:\/\/)/.test(f.link)) e.link = errMsg('E-CM-206', '링크는 / 또는 http(s):// 로 시작해야 합니다')
    setErr(e)
    return !Object.keys(e).length
  }
  const save = () => {
    if (!validate()) return
    upsert({ ...f, title: f.title.trim(), body: f.body.trim(), link: f.link?.trim() || undefined })
    toast(exists ? '팝업을 수정했습니다.' : '팝업을 등록했습니다.')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={exists ? '팝업 수정' : '팝업 등록'} size="lg"
      footer={<>
        <button className="btn-outline btn-sm mr-auto" onClick={() => onPreview(f)}><Eye size={13} />미리보기</button>
        <button className="btn-outline btn-sm" onClick={onClose}>취소</button>
        <button className="btn-primary btn-sm" onClick={save}>저장</button>
      </>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="팝업 제목" required error={err.title} className="sm:col-span-2">
          <input className="input" value={f.title} aria-invalid={!!err.title} onChange={e => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="내용" required error={err.body} hint={`${f.body.length}/200자`} className="sm:col-span-2">
          <textarea className="input min-h-28" value={f.body} aria-invalid={!!err.body} onChange={e => setF({ ...f, body: e.target.value })} />
        </Field>
        <Field label="게시 시작일" required error={err.period}>
          <input type="date" className="input" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} />
        </Field>
        <Field label="게시 종료일" required>
          <input type="date" className="input" value={f.end} onChange={e => setF({ ...f, end: e.target.value })} />
        </Field>
        <Field label="연결 링크" error={err.link} hint="예: /signup, /performances/p1, https://…" className="sm:col-span-2">
          <input className="input" value={f.link ?? ''} aria-invalid={!!err.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="자세히 보기 버튼 링크 (선택)" />
        </Field>
        <div className="flex items-center gap-2 text-sm sm:col-span-2">
          <Toggle checked={f.active} onChange={v => setF({ ...f, active: v })} label="사용" /> 사용 · 예상 상태 <Status s={popupStatus(f)} />
        </div>
      </div>
    </Modal>
  )
}

/** 홈페이지 팝업과 동일한 디자인으로 렌더링 */
export function PopupPreview({ popup: p, onClose }: { popup: Popup; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="팝업 미리보기 (홈페이지 표시 형태)" size="md">
      <div className="grid place-items-center rounded-xl bg-[repeating-linear-gradient(45deg,#f7f8fb,#f7f8fb_10px,#eef0f5_10px,#eef0f5_20px)] p-6">
        <div className="w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-line">
          <div className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-mint-500 px-6 pb-6 pt-8 text-white">
            <svg viewBox="0 0 100 100" className="absolute right-3 top-3 h-16 w-16 opacity-80" aria-hidden>
              <circle cx="50" cy="50" r="30" fill="#ffc933" /><path d="M35 55 q15 15 30 0" stroke="#16181d" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="40" cy="42" r="4" fill="#16181d" /><circle cx="60" cy="42" r="4" fill="#16181d" />
            </svg>
            <p className="text-xs font-semibold text-sun-300">NOTICE 1</p>
            <h2 className="mt-1 pr-16 text-xl font-extrabold leading-snug">{p.title || '팝업 제목'}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/90">{p.body || '팝업 내용'}</p>
            {p.link && <span className="btn mt-4 bg-white text-brand-700">자세히 보기</span>}
          </div>
          <div className="flex text-sm">
            <span className="flex-1 px-4 py-3 text-left text-muted">오늘 하루 보지 않기</span>
            <span className="border-l border-line px-5 py-3 font-semibold">닫기</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">게시 기간 {p.start} ~ {p.end} · 현재 상태 <Status s={popupStatus(p)} /></p>
    </Modal>
  )
}
