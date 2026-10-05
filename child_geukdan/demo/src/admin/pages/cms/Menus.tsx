import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, CornerDownRight, FolderTree, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import { useStore } from '../../../store'
import { useAdminLocal, type SiteMenu } from '../../adminStore'
import { cx } from '../../../lib/format'
import { Card, Note, Toggle, ask, errMsg } from '../../ui'
import { uid } from './cmsStore'

const MAX_DEPTH = 3

// ── 트리 유틸 ──
function mapTree(list: SiteMenu[], id: string, f: (m: SiteMenu) => SiteMenu): SiteMenu[] {
  return list.map(m => (m.id === id ? f(m) : { ...m, children: mapTree(m.children, id, f) }))
}
function removeNode(list: SiteMenu[], id: string): SiteMenu[] {
  return list.filter(m => m.id !== id).map(m => ({ ...m, children: removeNode(m.children, id) }))
}
function moveNode(list: SiteMenu[], id: string, d: -1 | 1): SiteMenu[] {
  const i = list.findIndex(m => m.id === id)
  if (i >= 0) {
    const j = i + d
    if (j < 0 || j >= list.length) return list
    const out = [...list];
    [out[i], out[j]] = [out[j], out[i]]
    return out
  }
  return list.map(m => ({ ...m, children: moveNode(m.children, id, d) }))
}
const count = (l: SiteMenu[]): number => l.reduce((a, m) => a + 1 + count(m.children), 0)

export default function Menus() {
  const saved = useAdminLocal(s => s.menus)
  const setLocal = useAdminLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [tree, setTree] = useState<SiteMenu[]>(() => structuredClone(saved))
  const [open, setOpen] = useState<Set<string>>(() => new Set(saved.map(m => m.id)))
  const [editing, setEditing] = useState<{ id: string; name: string; path: string } | null>(null)
  const [err, setErr] = useState('')
  const dirty = JSON.stringify(tree) !== JSON.stringify(saved)

  const toggleOpen = (id: string) => setOpen(o => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const addChild = (m: SiteMenu, depth: number) => {
    if (depth >= MAX_DEPTH) { setErr(errMsg('E-CM-501', `메뉴는 최대 ${MAX_DEPTH}단계까지만 생성할 수 있습니다 (「${m.name}」은 ${depth}단계)`)); return }
    setErr('')
    const child: SiteMenu = { id: uid('m'), name: '새 메뉴', path: m.path, visible: true, children: [] }
    setTree(t => mapTree(t, m.id, x => ({ ...x, children: [...x.children, child] })))
    setOpen(o => new Set(o).add(m.id))
    setEditing({ id: child.id, name: child.name, path: child.path })
  }
  const addRoot = () => {
    const m: SiteMenu = { id: uid('m'), name: '새 대메뉴', path: '/site/', visible: true, children: [] }
    setTree(t => [...t, m])
    setEditing({ id: m.id, name: m.name, path: m.path })
  }
  const del = async (m: SiteMenu) => {
    const r = await ask({ title: '메뉴 삭제', tone: 'danger', confirmText: '삭제', message: <>메뉴 <b>「{m.name}」</b>{m.children.length ? <>과 하위 메뉴 <b>{count(m.children)}개</b></> : ''}를 삭제합니다. 저장 시 홈페이지 GNB에서 제거됩니다.</> })
    if (r === null) return
    setTree(t => removeNode(t, m.id))
  }
  const commitEdit = () => {
    if (!editing) return
    if (!editing.name.trim()) { setErr(errMsg('E-CM-502', '메뉴명을 입력해 주세요')); return }
    if (!editing.path.startsWith('/')) { setErr(errMsg('E-CM-503', '연결 경로는 / 로 시작해야 합니다')); return }
    setErr('')
    setTree(t => mapTree(t, editing.id, x => ({ ...x, name: editing.name.trim(), path: editing.path.trim() })))
    setEditing(null)
  }
  const save = () => {
    if (editing) commitEdit()
    setLocal({ menus: structuredClone(tree) })
    log('메뉴 구성 저장', `전체 ${count(tree)}개 메뉴`)
    toast('메뉴 구성을 저장했습니다.')
  }

  const node = (m: SiteMenu, depth: number, idx: number, siblings: number) => {
    const isOpen = open.has(m.id)
    const isEdit = editing?.id === m.id
    return (
      <li key={m.id}>
        <div className={cx('group flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-paper sm:flex-nowrap', !m.visible && 'opacity-55')} style={{ paddingLeft: 8 + (depth - 1) * 24 }}>
          {m.children.length ? (
            <button className="btn-ghost p-0.5" onClick={() => toggleOpen(m.id)} aria-label={isOpen ? '접기' : '펼치기'}>{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>
          ) : depth > 1 ? <CornerDownRight size={14} className="mx-0.5 text-gray-300" /> : <span className="w-5" />}
          <span className={cx('rounded px-1.5 text-[10px] font-bold', depth === 1 ? 'bg-brand-600 text-white' : depth === 2 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-muted')}>{depth}차</span>
          {isEdit ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input className="input py-1 text-sm" autoFocus value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }} aria-label="메뉴명" />
              <input className="input py-1 font-mono text-xs" value={editing.path} onChange={e => setEditing({ ...editing, path: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit() }} aria-label="연결 경로" />
              <button className="btn-primary btn-sm px-2" onClick={commitEdit} aria-label="확인"><Check size={13} /></button>
              <button className="btn-ghost btn-sm px-2" onClick={() => setEditing(null)} aria-label="취소"><X size={13} /></button>
            </div>
          ) : (
            <button className="min-w-0 flex-1 text-left" onDoubleClick={() => setEditing({ id: m.id, name: m.name, path: m.path })}>
              <span className={cx('text-sm', depth === 1 ? 'font-bold' : 'font-medium')}>{m.name}</span>
              <span className="ml-2 font-mono text-[11px] text-muted">{m.path}</span>
            </button>
          )}
          <div className="flex items-center gap-1">
            <Toggle checked={m.visible} onChange={v => setTree(t => mapTree(t, m.id, x => ({ ...x, visible: v })))} label={`${m.name} 노출`} />
            <button className="btn-ghost p-1" disabled={idx === 0} onClick={() => setTree(t => moveNode(t, m.id, -1))} aria-label="위로"><ArrowUp size={13} /></button>
            <button className="btn-ghost p-1" disabled={idx === siblings - 1} onClick={() => setTree(t => moveNode(t, m.id, 1))} aria-label="아래로"><ArrowDown size={13} /></button>
            <button className="btn-ghost p-1" onClick={() => setEditing({ id: m.id, name: m.name, path: m.path })} aria-label="이름 변경"><Pencil size={13} /></button>
            <button className="btn-ghost p-1" onClick={() => addChild(m, depth)} aria-label="하위 메뉴 추가" title="하위 메뉴 추가"><Plus size={13} /></button>
            <button className="btn-ghost p-1 text-coral-500" onClick={() => del(m)} aria-label="삭제"><Trash2 size={13} /></button>
          </div>
        </div>
        {isOpen && m.children.length > 0 && (
          <ul className="border-l border-dashed border-line" style={{ marginLeft: 18 + (depth - 1) * 24 }}>
            {m.children.map((c, i) => node(c, depth + 1, i, m.children.length))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card title={<span className="flex items-center gap-1.5"><FolderTree size={15} />홈페이지 메뉴 구조</span>} sub={`총 ${count(tree)}개 메뉴 · 최대 ${MAX_DEPTH}단계 · 메뉴명을 더블클릭하면 바로 수정합니다.`}
        actions={<>
          {dirty && <span className="text-xs font-semibold text-amber-600">저장되지 않은 변경사항</span>}
          <button className="btn-outline btn-sm" onClick={() => setOpen(o => o.size ? new Set() : new Set(JSON.stringify(tree).match(/"id":"[^"]+"/g)?.map(s => s.slice(6, -1))))}>{open.size ? '모두 접기' : '모두 펼치기'}</button>
          <button className="btn-outline btn-sm" onClick={addRoot}><Plus size={13} />대메뉴 추가</button>
          <button className="btn-outline btn-sm" disabled={!dirty} onClick={() => { setTree(structuredClone(saved)); setErr('') }}><RotateCcw size={13} />되돌리기</button>
          <button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>
        </>}>
        {err && <Note tone="err" className="mb-3">{err}</Note>}
        <ul className="space-y-0.5">
          {tree.map((m, i) => node(m, 1, i, tree.length))}
        </ul>
      </Card>
      <Card title="GNB 미리보기" sub="노출 설정된 메뉴만 표시됩니다.">
        <div className="rounded-xl border border-line">
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-4 py-3 text-sm font-bold">
            <span className="mr-2 text-brand-600">국립어린이청소년극단</span>
            {tree.filter(m => m.visible).map(m => <span key={m.id}>{m.name}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {tree.filter(m => m.visible).map(m => (
              <div key={m.id}>
                <p className="border-b-2 border-brand-600 pb-1 text-xs font-bold">{m.name}</p>
                <ul className="mt-1.5 space-y-1">
                  {m.children.filter(c => c.visible).map(c => (
                    <li key={c.id} className="text-xs text-muted">{c.name}
                      {c.children.filter(g => g.visible).map(g => <div key={g.id} className="pl-2 text-[11px] text-gray-400">· {g.name}</div>)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
