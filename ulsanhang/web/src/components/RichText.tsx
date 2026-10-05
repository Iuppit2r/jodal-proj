import { Fragment, type ReactNode } from 'react'

/** 답변용 경량 마크다운 렌더러: 문단, "- " 목록, "| " 표, **굵게** 지원 */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

export default function RichText({ text, streaming }: { text: string; streaming?: boolean }) {
  const blocks = text.split(/\n{2,}/)
  return (
    <div className="answer">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(Boolean)
        const last = bi === blocks.length - 1
        const cursor = last && streaming ? <span className="caret" aria-hidden /> : null
        if (lines.length && lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={bi}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.slice(2))}{i === lines.length - 1 && cursor}</li>
              ))}
            </ul>
          )
        }
        if (lines.length && lines.every((l) => l.startsWith('|'))) {
          const rows = lines.map((l) => l.replace(/\|\s*$/, '').split('|').slice(1).map((c) => c.trim()))
          return (
            <div key={bi} className="table-wrap">
              <table>
                <thead><tr>{rows[0].map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
                <tbody>{rows.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, i) => <td key={i}>{inline(c)}</td>)}</tr>)}</tbody>
              </table>
              {cursor}
            </div>
          )
        }
        const mixed: ReactNode[] = []
        let para: string[] = []
        let list: string[] = []
        const flush = () => {
          if (para.length) mixed.push(<p key={mixed.length}>{inline(para.join(' '))}</p>)
          if (list.length) mixed.push(<ul key={mixed.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>)
          para = []
          list = []
        }
        for (const l of lines) {
          if (l.startsWith('- ')) { if (para.length) flush(); list.push(l.slice(2)) }
          else { if (list.length) flush(); para.push(l) }
        }
        flush()
        return <Fragment key={bi}>{mixed}{cursor}</Fragment>
      })}
    </div>
  )
}
