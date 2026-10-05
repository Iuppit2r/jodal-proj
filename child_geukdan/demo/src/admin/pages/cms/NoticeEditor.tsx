import { useRef, useState } from 'react'
import { FileText, Paperclip, Upload, X } from 'lucide-react'
import { useStore } from '../../../store'
import type { Notice } from '../../../data/types'
import { cx } from '../../../lib/format'
import { Drawer, Field, Note, Toggle, errMsg } from '../../ui'
import { TODAY } from '../../lib'
import RichEditor from './RichEditor'
import { CATEGORIES } from './Boards'
import { CATEGORY_BOARD, useCmsLocal } from './cmsStore'

interface Att { name: string; size?: number }
const fmtSize = (b?: number) => (b == null ? '' : b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`)

/** 시연용 가상 파일 (파일 탐색기 없이 검증 시연) */
const SAMPLES: Att[] = [
  { name: '공연안내문.pdf', size: 1.2 * 1048576 },
  { name: '참가신청서.hwp', size: 84 * 1024 },
  { name: '현장사진.jpg', size: 3.4 * 1048576 },
  { name: 'setup.exe', size: 0.4 * 1048576 },
  { name: '리허설영상_원본.zip', size: 48 * 1048576 },
]

export default function NoticeEditor({ notice, exists, onClose }: { notice: Notice; exists: boolean; onClose: () => void }) {
  const upsert = useStore(s => s.upsertNotice)
  const toast = useStore(s => s.toast)
  const boards = useCmsLocal(s => s.boards)
  const [f, setF] = useState<Notice>({ ...notice, date: notice.date || TODAY })
  const [files, setFiles] = useState<Att[]>((notice.files ?? []).map(name => ({ name })))
  const [err, setErr] = useState<Record<string, string>>({})
  const [fileErr, setFileErr] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const cfg = boards.find(b => b.id === CATEGORY_BOARD[f.category]) ?? boards[0]

  const addFiles = (list: Att[]) => {
    const errs: string[] = []
    const next = [...files]
    for (const a of list) {
      const ext = a.name.split('.').pop()?.toLowerCase() ?? ''
      if (!cfg.exts.includes(ext)) { errs.push(`${errMsg('E-CM-310', '허용되지 않은 확장자')} – ${a.name} (허용: ${cfg.exts.join(', ')})`); continue }
      if ((a.size ?? 0) > cfg.maxMB * 1048576) { errs.push(`${errMsg('E-CM-311', `파일 크기 초과 (최대 ${cfg.maxMB}MB)`)} – ${a.name} ${fmtSize(a.size)}`); continue }
      if (next.length >= cfg.maxCount) { errs.push(`${errMsg('E-CM-312', `첨부 개수 초과 (최대 ${cfg.maxCount}개)`)} – ${a.name}`); continue }
      if (next.some(x => x.name === a.name)) { errs.push(`${errMsg('E-CM-313', '동일한 이름의 파일이 이미 첨부되어 있습니다')} – ${a.name}`); continue }
      next.push(a)
    }
    setFiles(next)
    setFileErr(errs)
  }

  const save = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = errMsg('E-CM-301', '제목은 필수 입력입니다')
    else if (f.title.length > 100) e.title = errMsg('E-CM-302', '제목은 100자 이내로 입력해 주세요')
    const plain = f.body.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    if (!plain && !/<img/i.test(f.body)) e.body = errMsg('E-CM-303', '본문 내용을 입력해 주세요')
    if (/<script/i.test(f.body)) e.body = errMsg('E-CM-304', '스크립트 태그는 사용할 수 없습니다 (XSS 방지)')
    setErr(e)
    if (Object.keys(e).length) return
    upsert({ ...f, title: f.title.trim(), files: files.map(x => x.name), views: exists ? f.views : 0 })
    toast(exists ? '게시물을 수정했습니다. 홈페이지에 즉시 반영됩니다.' : '게시물을 등록했습니다.')
    onClose()
  }

  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={exists ? '게시물 수정' : '게시물 등록'}
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={save}>{exists ? '수정 저장' : '등록'}</button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="분류" required hint={`게시판: ${cfg.name} (${cfg.skin})`}>
            <select className="input" value={f.category} onChange={e => setF({ ...f, category: e.target.value as Notice['category'] })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="게시일" required>
            <input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label="상단 고정">
            <div className="flex h-[42px] items-center gap-2 text-sm"><Toggle checked={!!f.pinned} onChange={v => setF({ ...f, pinned: v })} label="상단 고정" />{f.pinned ? '목록 상단 고정' : '일반 게시물'}</div>
          </Field>
        </div>
        <Field label="제목" required error={err.title}>
          <input className="input" value={f.title} aria-invalid={!!err.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="제목을 입력하세요" />
        </Field>
        <Field label="본문" required error={err.body} hint="툴바로 서식을 적용하거나 「HTML」 모드에서 소스를 직접 편집할 수 있습니다.">
          <RichEditor value={f.body} onChange={body => setF(v => ({ ...v, body }))} invalid={!!err.body} />
        </Field>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="label mb-0 text-[13px]">첨부파일 <span className="font-normal text-muted">({files.length}/{cfg.maxCount})</span></span>
            <span className="text-[11px] text-muted">허용 확장자 {cfg.exts.join(', ')} · 파일당 최대 {cfg.maxMB}MB · 최대 {cfg.maxCount}개</span>
          </div>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles([...e.dataTransfer.files].map(x => ({ name: x.name, size: x.size }))) }}
            className="rounded-lg border-2 border-dashed border-line bg-paper/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={() => input.current?.click()}><Upload size={13} />파일 선택</button>
              <span className="text-xs text-muted">또는 파일을 이곳에 끌어다 놓으세요</span>
              <input ref={input} type="file" multiple className="hidden" onChange={e => { addFiles([...(e.target.files ?? [])].map(x => ({ name: x.name, size: x.size }))); e.target.value = '' }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted">
              <span className="font-semibold">시연용 예시 파일:</span>
              {SAMPLES.map(s => (
                <button key={s.name} type="button" className="rounded border border-line bg-white px-1.5 py-0.5 hover:border-brand-500 hover:text-brand-600" onClick={() => addFiles([s])}>
                  {s.name} <span className="opacity-60">{fmtSize(s.size)}</span>
                </button>
              ))}
            </div>
            {files.length > 0 && (
              <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-white">
                {files.map(a => (
                  <li key={a.name} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <FileText size={14} className="text-brand-600" />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-muted">{a.size != null ? fmtSize(a.size) : '등록됨'}</span>
                    <button type="button" className="btn-ghost p-1" onClick={() => setFiles(files.filter(x => x.name !== a.name))} aria-label={`${a.name} 삭제`}><X size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {fileErr.length > 0 && (
            <Note tone="err" className="mt-2">
              {fileErr.map(m => <div key={m} className="flex gap-1"><Paperclip size={12} className="mt-0.5 shrink-0" />{m}</div>)}
            </Note>
          )}
        </div>
        <div className={cx('grid grid-cols-3 gap-2 text-xs text-muted')}>
          <span>조회수 <b className="text-ink">{exists ? f.views.toLocaleString() : 0}</b></span>
          <span>작성자 <b className="text-ink">관리자</b></span>
          <span>최종 저장 시 변경이력 기록</span>
        </div>
      </div>
    </Drawer>
  )
}
