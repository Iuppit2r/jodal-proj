import { ExternalLink } from 'lucide-react'
import type { Source } from '../types'
import { Sheet } from './Sheet'

export function SourceSheet({ source, onClose }: { source: Source; onClose: () => void }) {
  const rows: [string, string][] = [
    ['발행기관', source.publisher],
    ['버전', source.version],
    ['발행시점', source.publishedAt],
    ['원문 위치', source.location],
  ]
  return (
    <Sheet title="답변 근거" onClose={onClose}>
      <p className="text-[15px] font-bold leading-snug">{source.title}</p>
      <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <figure className="mt-4">
        <figcaption className="mb-1.5 text-xs font-bold text-ink-3">인용 원문</figcaption>
        <blockquote className="rounded-xl bg-navy-soft p-3.5 text-sm leading-relaxed text-ink-2">
          {source.excerpt}
        </blockquote>
      </figure>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy underline underline-offset-4"
        >
          원문 보기 <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(새 창)</span>
        </a>
      )}
    </Sheet>
  )
}
