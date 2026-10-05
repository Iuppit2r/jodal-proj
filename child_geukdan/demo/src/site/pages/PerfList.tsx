import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../PageHeader'
import { useStore } from '../../store'
import type { Genre, Performance } from '../../data/types'
import { cx } from '../../lib/format'
import { PerfCard } from '../parts/ui'
import { isCurrent, isPast } from '../parts/perf'

const TARGETS: ('전체' | Performance['target'])[] = ['전체', '어린이', '청소년', '가족']
const GENRES: ('전체' | Genre)[] = ['전체', '연극', '음악극', '인형극', '무용극', '렉처퍼포먼스']

export default function PerfList() {
  const perfs = useStore(s => s.performances)
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') === 'past' ? 'past' : 'now'
  const [target, setTarget] = useState<(typeof TARGETS)[number]>('전체')
  const [genre, setGenre] = useState<(typeof GENRES)[number]>('전체')
  const list = perfs
    .filter(p => (tab === 'now' ? isCurrent(p) : isPast(p)))
    .filter(p => target === '전체' || p.target === target)
    .filter(p => genre === '전체' || p.genre === genre)
    .sort((a, b) => (tab === 'now' ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)))

  return (
    <>
      <PageHeader crumbs={['공연', '공연안내']} title="공연안내" desc="어린이·청소년·가족 관객을 위한 국립어린이청소년극단의 무대를 만나보세요." />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div role="tablist" aria-label="공연 구분" className="inline-flex rounded-xl bg-paper p-1">
          {([['now', '현재·예정 공연'], ['past', '지난 공연']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k}
              onClick={() => setSp(k === 'past' ? { tab: 'past' } : {})}
              className={cx('rounded-lg px-4 py-2 text-sm font-bold transition sm:px-6', tab === k ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink')}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-line p-4">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mr-2 float-left w-12 text-sm font-bold">대상</legend>
            {TARGETS.map(t => (
              <button key={t} type="button" aria-pressed={target === t} onClick={() => setTarget(t)}
                className={cx('rounded-full border px-3.5 py-1.5 text-sm font-semibold transition', target === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:border-brand-500')}>{t}</button>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mr-2 float-left w-12 text-sm font-bold">장르</legend>
            {GENRES.map(g => (
              <button key={g} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)}
                className={cx('rounded-full border px-3.5 py-1.5 text-sm font-semibold transition', genre === g ? 'border-ink bg-ink text-white' : 'border-line hover:border-brand-500')}>{g === '렉처퍼포먼스' ? '렉처 퍼포먼스' : g}</button>
            ))}
          </fieldset>
        </div>

        <p className="mt-6 text-sm text-muted" aria-live="polite">총 <b className="text-ink">{list.length}</b>편</p>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {list.map(p => <PerfCard key={p.id} p={p} showBook={tab === 'now'} />)}
        </div>
        {!list.length && <p className="mt-4 rounded-2xl bg-paper p-12 text-center text-muted">조건에 맞는 공연이 없습니다.</p>}
      </div>
    </>
  )
}
