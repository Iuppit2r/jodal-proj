import { useEffect, useState } from 'react'
import { renderCard, type CardInput } from '../lib/card'

const results = new Map<string, string>()
const keyOf = (i: CardInput) => [i.m.id, i.style, i.rec.at, i.rec.photo?.length ?? 0, i.count, i.order, i.nick].join('|')

/** 인증카드 이미지 (Canvas 합성 결과 캐시) */
export function CardImage({ input, className = '', onReady }: { input: CardInput; className?: string; onReady?: (url: string) => void }) {
  const key = keyOf(input)
  const [url, setUrl] = useState(() => results.get(key) ?? null)
  useEffect(() => {
    let alive = true
    const hit = results.get(key)
    if (hit) {
      setUrl(hit)
      onReady?.(hit)
      return
    }
    setUrl(null)
    renderCard(input).then((u) => {
      results.set(key, u)
      if (alive) {
        setUrl(u)
        onReady?.(u)
      }
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return url ? (
    <img src={url} alt={`${input.m.title} 완등 인증카드`} className={`aspect-[4/5] w-full object-cover ${className}`} />
  ) : (
    <div className={`aspect-[4/5] w-full animate-pulse bg-alt ${className}`} />
  )
}
