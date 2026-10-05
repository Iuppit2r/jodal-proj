import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bold, Code, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Underline, Undo2 } from 'lucide-react'
import { cx } from '../../../lib/format'

/** 시연용 이미지 (SVG data URI) */
const IMG = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect width="600" height="300" fill="#2647c4"/><circle cx="470" cy="90" r="50" fill="#ffc933"/><path d="M0 230 q75 -50 150 0 t150 0 t150 0 t150 0 v70 h-600z" fill="#1fb592"/><text x="40" y="80" fill="#fff" font-size="34" font-weight="800" font-family="sans-serif">공연 이미지</text></svg>')}`

/** 위지윅 에디터 – 툴바는 HTML 스니펫 삽입, 「에디터 | HTML」 전환 지원 */
export default function RichEditor({ value, onChange, minHeight = 220, invalid }: { value: string; onChange: (html: string) => void; minHeight?: number; invalid?: boolean }) {
  const [mode, setMode] = useState<'editor' | 'html'>('editor')
  const ed = useRef<HTMLDivElement>(null)
  const ta = useRef<HTMLTextAreaElement>(null)
  const range = useRef<Range | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('https://')

  // 모드 전환 시 에디터 DOM 동기화 (입력 중에는 덮어쓰지 않아 커서 유지)
  useEffect(() => {
    if (mode === 'editor' && ed.current && ed.current.innerHTML !== value) ed.current.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const saveRange = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount && ed.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0)
  }
  const restoreRange = () => {
    ed.current?.focus()
    const sel = window.getSelection()
    if (range.current && sel) { sel.removeAllRanges(); sel.addRange(range.current) }
  }
  const sync = () => ed.current && onChange(ed.current.innerHTML)

  const insertHtml = (html: string) => {
    if (mode === 'editor') {
      restoreRange()
      document.execCommand('insertHTML', false, html)
      sync()
    } else {
      const t = ta.current
      if (!t) return
      const s = t.selectionStart, e = t.selectionEnd
      const next = value.slice(0, s) + html + value.slice(e)
      onChange(next)
      requestAnimationFrame(() => { t.focus(); t.selectionStart = t.selectionEnd = s + html.length })
    }
  }
  const selectedText = () => {
    if (mode === 'editor') return range.current?.toString() ?? ''
    const t = ta.current
    return t ? value.slice(t.selectionStart, t.selectionEnd) : ''
  }
  const wrap = (tag: string, cmd: string) => {
    if (mode === 'editor') { restoreRange(); document.execCommand(cmd); sync(); return }
    const txt = selectedText() || '텍스트'
    insertHtml(`<${tag}>${txt}</${tag}>`)
  }
  const list = (ordered: boolean) => {
    if (mode === 'editor') { restoreRange(); document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList'); sync(); return }
    const tag = ordered ? 'ol' : 'ul'
    insertHtml(`<${tag}>\n  <li>항목 1</li>\n  <li>항목 2</li>\n</${tag}>`)
  }
  const link = () => {
    if (!/^(https?:\/\/.+|\/.*)$/.test(url)) return
    const txt = selectedText() || url
    insertHtml(`<a href="${url}" target="_blank" rel="noopener">${txt}</a>`)
    setLinkOpen(false)
    setUrl('https://')
  }

  const Btn = ({ onClick, label, children, active }: { onClick: () => void; label: string; children: ReactNode; active?: boolean }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={e => { e.preventDefault(); saveRange() }} onClick={onClick}
      className={cx('grid h-7 w-7 place-items-center rounded text-muted hover:bg-white hover:text-ink', active && 'bg-white text-brand-600')}>{children}</button>
  )

  return (
    <div className={cx('overflow-hidden rounded-lg border bg-white', invalid ? 'border-coral-500' : 'border-line')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper px-1.5 py-1">
        <Btn label="굵게" onClick={() => wrap('b', 'bold')}><Bold size={14} /></Btn>
        <Btn label="기울임" onClick={() => wrap('i', 'italic')}><Italic size={14} /></Btn>
        <Btn label="밑줄" onClick={() => wrap('u', 'underline')}><Underline size={14} /></Btn>
        <Btn label="소제목" onClick={() => insertHtml(`<h3>${selectedText() || '소제목'}</h3>`)}><Heading2 size={14} /></Btn>
        <span className="mx-1 h-4 w-px bg-line" />
        <Btn label="글머리 목록" onClick={() => list(false)}><List size={14} /></Btn>
        <Btn label="번호 목록" onClick={() => list(true)}><ListOrdered size={14} /></Btn>
        <Btn label="링크" active={linkOpen} onClick={() => setLinkOpen(o => !o)}><Link2 size={14} /></Btn>
        <Btn label="이미지" onClick={() => insertHtml(`<p><img src="${IMG}" alt="공연 이미지" style="max-width:100%;border-radius:8px" /></p>`)}><ImagePlus size={14} /></Btn>
        <Btn label="실행 취소" onClick={() => { if (mode === 'editor') { restoreRange(); document.execCommand('undo'); sync() } }}><Undo2 size={14} /></Btn>
        <div className="ml-auto inline-flex rounded-md border border-line bg-white p-0.5 text-[11px] font-semibold">
          {(['editor', 'html'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cx('flex items-center gap-1 rounded px-2 py-0.5', mode === m ? 'bg-brand-600 text-white' : 'text-muted hover:text-ink')}>
              {m === 'html' && <Code size={11} />}{m === 'editor' ? '에디터' : 'HTML'}
            </button>
          ))}
        </div>
      </div>
      {linkOpen && (
        <div className="flex items-center gap-2 border-b border-line bg-brand-50 px-2 py-1.5">
          <span className="text-xs font-semibold text-brand-700">링크 URL</span>
          <input className="input py-1 text-xs" value={url} autoFocus onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); link() } }} />
          <button type="button" className="btn-primary btn-sm" onClick={link}>삽입</button>
        </div>
      )}
      {mode === 'editor' ? (
        <div ref={ed} contentEditable suppressContentEditableWarning role="textbox" aria-multiline aria-label="본문 에디터"
          onInput={sync} onKeyUp={saveRange} onMouseUp={saveRange} onBlur={saveRange}
          className="rich-body max-h-[420px] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed outline-none [&_a]:text-brand-600 [&_a]:underline [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          style={{ minHeight }} />
      ) : (
        <div className="grid md:grid-cols-2">
          <textarea ref={ta} value={value} onChange={e => onChange(e.target.value)} spellCheck={false} aria-label="HTML 소스"
            className="min-h-[220px] resize-y border-b border-line bg-[#0f172a] p-3 font-mono text-xs leading-relaxed text-emerald-200 outline-none md:border-b-0 md:border-r" style={{ minHeight }} />
          <div className="max-h-[420px] overflow-y-auto p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">미리보기</p>
            <div className="text-sm leading-relaxed [&_a]:text-brand-600 [&_a]:underline [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        </div>
      )}
    </div>
  )
}
