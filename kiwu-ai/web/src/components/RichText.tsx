import { Fragment, type ReactNode } from 'react'

/** 답변용 경량 마크다운: 문단(빈 줄), 목록(- ), 굵게(**) 만 지원 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n')
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="space-y-1 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{inline(l.slice(2))}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{inline(block)}</p>
      })}
    </div>
  )
}
