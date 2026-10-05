import { useRef, useState } from 'react'
import { Bold, Code2, Eye, Italic, Link2, List, X } from 'lucide-react'
import { cx } from '../../../lib/format'
import { Segmented } from '../../ui'
import { mdToHtml } from './shared'

/** 태그형 입력 (Enter/쉼표로 추가, 추천 항목 클릭 추가) */
export function ChipInput({ value, onChange, placeholder, suggestions = [], invalid }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[]; invalid?: boolean
}) {
  const [text, setText] = useState('')
  const add = (t: string) => {
    const v = t.trim().replace(/,$/, '')
    if (v && !value.includes(v)) onChange([...value, v])
    setText('')
  }
  const rest = suggestions.filter(s => !value.some(v => v.startsWith(s)))
  return (
    <div>
      <div className={cx('input flex min-h-[42px] flex-wrap items-center gap-1 py-1.5', invalid && 'border-coral-500')}>
        {value.map(v => (
          <span key={v} className="chip gap-1 bg-brand-50 text-brand-700">
            {v}
            <button type="button" aria-label={`${v} 삭제`} onClick={() => onChange(value.filter(x => x !== v))} className="hover:text-coral-500"><X size={11} /></button>
          </span>
        ))}
        <input className="min-w-[120px] flex-1 bg-transparent text-sm outline-none" placeholder={placeholder} value={text}
          onChange={e => (e.target.value.endsWith(',') ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(text) }
            if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => text && add(text)} />
      </div>
      {rest.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {rest.map(s => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded border border-dashed border-line px-1.5 py-0.5 text-[11px] text-muted hover:border-brand-500 hover:text-brand-600">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 웹 에디터 (SFR-TC-001: 에디터/HTML 전환) – 간이 마크업 + 툴바 */
export function RichEditor({ value, onChange, rows = 6, invalid, placeholder, id }: {
  value: string; onChange: (v: string) => void; rows?: number; invalid?: boolean; placeholder?: string; id?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'editor' | 'html' | 'preview'>('editor')

  const wrap = (before: string, after = before, fallback = '텍스트') => {
    const el = ref.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const sel = value.slice(a, b) || fallback
    const next = value.slice(0, a) + before + sel + after + value.slice(b)
    onChange(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length) })
  }
  const list = () => {
    const el = ref.current
    if (!el) return
    const a = value.lastIndexOf('\n', el.selectionStart - 1) + 1
    onChange(value.slice(0, a) + '- ' + value.slice(a))
  }
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('https://')
  const [linkErr, setLinkErr] = useState('')
  const insertLink = () => {
    if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(url)) { setLinkErr('[E-CM-110] 올바른 URL 형식이 아닙니다'); return }
    wrap('[', `](${url})`, '링크 텍스트')
    setLinkOpen(false); setUrl('https://'); setLinkErr('')
  }

  const html = mdToHtml(value)
  const tb = 'grid h-7 w-7 place-items-center rounded hover:bg-white hover:text-brand-600 disabled:opacity-30'
  return (
    <div className={cx('overflow-hidden rounded-lg border', invalid ? 'border-coral-500 ring-2 ring-coral-400/30' : 'border-line')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-2 py-1">
        <div className="flex items-center gap-0.5 text-muted">
          <button type="button" className={tb} title="굵게" aria-label="굵게" disabled={mode !== 'editor'} onClick={() => wrap('**')}><Bold size={14} /></button>
          <button type="button" className={tb} title="기울임" aria-label="기울임" disabled={mode !== 'editor'} onClick={() => wrap('*')}><Italic size={14} /></button>
          <button type="button" className={tb} title="목록" aria-label="목록" disabled={mode !== 'editor'} onClick={list}><List size={14} /></button>
          <button type="button" className={tb} title="링크 삽입" aria-label="링크 삽입" disabled={mode !== 'editor'} onClick={() => setLinkOpen(o => !o)}><Link2 size={14} /></button>
          <span className="ml-2 text-[11px] tabular-nums">{value.length.toLocaleString()}자</span>
        </div>
        <Segmented size="sm" value={mode} onChange={setMode} options={[
          { value: 'editor', label: '에디터' },
          { value: 'html', label: <span className="inline-flex items-center gap-1"><Code2 size={12} />HTML</span> },
          { value: 'preview', label: <span className="inline-flex items-center gap-1"><Eye size={12} />미리보기</span> },
        ]} />
      </div>
      {mode === 'editor' && linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-50/50 px-3 py-2">
          <input className="input max-w-sm py-1.5 text-xs" value={url} aria-label="링크 URL" aria-invalid={!!linkErr} autoFocus
            onChange={e => { setUrl(e.target.value); setLinkErr('') }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), insertLink())} />
          <button type="button" className="btn-primary btn-sm" onClick={insertLink}>삽입</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setLinkOpen(false)}>닫기</button>
          {linkErr && <span className="text-xs font-medium text-coral-500">{linkErr}</span>}
        </div>
      )}
      {mode === 'editor' && (
        <textarea id={id} ref={ref} rows={rows} value={value} placeholder={placeholder} aria-invalid={invalid}
          onChange={e => onChange(e.target.value)} className="block w-full resize-y bg-white px-3 py-2.5 text-sm leading-relaxed outline-none" />
      )}
      {mode === 'html' && (
        <pre className="max-h-[320px] min-h-[120px] overflow-auto whitespace-pre-wrap bg-[#0f172a] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-emerald-200">{html || '<!-- 내용 없음 -->'}</pre>
      )}
      {mode === 'preview' && (
        <div className="min-h-[120px] px-4 py-3 text-sm leading-relaxed [&_a]:text-brand-600 [&_a]:underline [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: html || '<p style="color:#9ca3af">내용 없음</p>' }} />
      )}
    </div>
  )
}
