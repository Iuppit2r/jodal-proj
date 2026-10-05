import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SearchX } from 'lucide-react'
import { cx } from '../../lib/format'

/** 서브페이지 본문 래퍼 */
export function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto max-w-6xl px-4 py-10 sm:py-12', className)}>{children}</div>
}

export function SectionTitle({ children, sub, id }: { children: ReactNode; sub?: ReactNode; id?: string }) {
  return (
    <div className="mb-5">
      <h2 id={id} className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <span aria-hidden className="inline-block h-5 w-1.5 rounded-full bg-sun-400" />
        {children}
      </h2>
      {sub && <p className="mt-1.5 text-sm text-muted">{sub}</p>}
    </div>
  )
}

/** 숫자 페이지네이션 (목록은 한 화면 + 페이징 — RFP) */
export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  const start = Math.floor((page - 1) / 5) * 5 + 1
  const nums = Array.from({ length: Math.min(5, total - start + 1) }, (_, i) => start + i)
  const btn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition'
  return (
    <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-1">
      <button className={cx(btn, 'text-muted hover:bg-paper disabled:opacity-30')} disabled={page === 1} onClick={() => onChange(1)} aria-label="첫 페이지"><ChevronsLeft size={16} /></button>
      <button className={cx(btn, 'text-muted hover:bg-paper disabled:opacity-30')} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지"><ChevronLeft size={16} /></button>
      {nums.map(n => (
        <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined} aria-label={`${n} 페이지`}
          className={cx(btn, n === page ? 'bg-brand-600 text-white' : 'text-ink hover:bg-paper')}>{n}</button>
      ))}
      <button className={cx(btn, 'text-muted hover:bg-paper disabled:opacity-30')} disabled={page === total} onClick={() => onChange(page + 1)} aria-label="다음 페이지"><ChevronRight size={16} /></button>
      <button className={cx(btn, 'text-muted hover:bg-paper disabled:opacity-30')} disabled={page === total} onClick={() => onChange(total)} aria-label="마지막 페이지"><ChevronsRight size={16} /></button>
    </nav>
  )
}

export function Empty({ children = '검색 결과가 없습니다.' }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-16 text-center text-sm text-muted">
      <SearchX size={28} aria-hidden className="text-gray-300" />
      {children}
    </div>
  )
}

/** 탭형 필터 (role=tablist 대신 aria-pressed 토글 버튼) */
export function FilterTabs<T extends string>({ items, value, onChange, label }: { items: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map(it => (
        <button key={it} type="button" aria-pressed={value === it} onClick={() => onChange(it)}
          className={cx('rounded-full border px-4 py-1.5 text-sm font-semibold transition',
            value === it ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-muted hover:border-brand-500 hover:text-brand-600')}>
          {it}
        </button>
      ))}
    </div>
  )
}

/** 공지 카테고리 칩 색 */
export const catTone: Record<string, string> = {
  공지: 'bg-brand-50 text-brand-700',
  공연: 'bg-sun-300/40 text-[#7a5600]',
  채용: 'bg-mint-400/20 text-[#0c6b55]',
  입찰: 'bg-gray-100 text-gray-700',
  이벤트: 'bg-coral-400/20 text-[#b03a22]',
}

/** 결정적 placeholder 본문 생성 */
export function fillerParas(seed: string, n = 4): string[] {
  const pool = [
    '극장의 문이 열리면 아이들은 가장 먼저 소리를 듣는다. 객석을 채우는 웅성거림, 무대 뒤에서 들려오는 작은 발소리, 조명이 바뀌는 순간의 정적. 우리는 이 감각의 순간들을 오래 붙잡고 싶었다.',
    '창작 과정은 질문에서 시작됐다. 어린이 관객에게 ‘좋은 공연’이란 무엇일까. 제작진은 석 달 동안 초등학교와 지역아동센터를 찾아가 아이들과 함께 이야기를 만들고, 장면을 고쳐 나갔다.',
    '청소년 관객은 어른보다 훨씬 정확하게 거짓을 알아챈다. 그래서 우리는 대본의 모든 대사를 청소년 자문단과 함께 소리 내어 읽었다. “이 말은 우리 반에서 아무도 안 써요.” 그 한마디가 장면 전체를 바꾸기도 했다.',
    '무대는 단순하다. 종이와 천, 빛과 그림자. 그러나 그 단순함 덕분에 관객의 상상력이 들어올 자리가 생긴다. 아이들은 빈 상자를 보고 우주를, 파란 천을 보고 바다를 떠올린다.',
    '접근성은 덧붙이는 서비스가 아니라 작품의 일부다. 수어통역사는 배우와 함께 연습실에서 리허설을 했고, 음성해설 대본은 연출가와 함께 쓰였다. 모든 관객이 같은 이야기를 서로 다른 방식으로 만나는 극장을 꿈꾼다.',
    '공연이 끝난 뒤 로비에서 이어지는 대화야말로 우리가 가장 아끼는 장면이다. “고양이는 왜 달을 삼켰을까?” 한 아이의 질문에 다른 아이가 대답하고, 보호자는 그 대화를 조용히 듣는다.',
    '국립어린이청소년극단은 앞으로도 어린이와 청소년이 ‘관객’이자 ‘창작자’로 극장에 머물 수 있도록 연구와 실험을 계속해 나갈 것이다.',
  ]
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return Array.from({ length: n }, (_, i) => pool[(h + i * 3) % pool.length])
}
