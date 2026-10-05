import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MessageSquarePlus, Phone, Search } from 'lucide-react'
import PageHeader from '../PageHeader'
import { faqs } from '../../data/mock'
import { cx } from '../../lib/format'
import { Empty, FilterTabs, Section } from './ui'

export const SUPPORT_TABS = [
  { to: '/site/support/guide', label: '예매·취소 안내' },
  { to: '/site/support/faq', label: '자주 묻는 질문' },
  { to: '/site/support/inquiry', label: '1:1 문의' },
]

function Highlight({ text, kw }: { text: string; kw: string }) {
  if (!kw) return <>{text}</>
  const parts = text.split(new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return <>{parts.map((p, i) => p.toLowerCase() === kw.toLowerCase() ? <mark key={i} className="rounded bg-sun-300 px-0.5">{p}</mark> : p)}</>
}

export default function Faq() {
  const cats = ['전체', ...Array.from(new Set(faqs.map(f => f.category)))]
  const [cat, setCat] = useState('전체')
  const [kw, setKw] = useState('')
  const [open, setOpen] = useState<string[]>([])
  const k = kw.trim()
  const list = useMemo(() => faqs.filter(f => (cat === '전체' || f.category === cat) && (!k || (f.q + f.a).toLowerCase().includes(k.toLowerCase()))), [cat, k])
  const toggle = (id: string) => setOpen(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id])

  return (
    <>
      <PageHeader crumbs={['고객지원', '자주 묻는 질문']} title="자주 묻는 질문" desc="예매, 취소·환불, 관람, 회원·멤버십에 관해 자주 묻는 질문을 모았습니다." tabs={SUPPORT_TABS} />
      <Section>
        <div className="mx-auto mb-8 max-w-2xl">
          <label htmlFor="faq-q" className="sr-only">질문 검색</label>
          <div className="relative">
            <Search size={20} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input id="faq-q" type="search" className="input rounded-full py-3.5 pl-12 text-base" placeholder="궁금한 내용을 검색해보세요 (예: 취소, 휠체어)" value={kw} onChange={e => { setKw(e.target.value); setOpen([]) }} />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <FilterTabs label="질문 분류" items={cats} value={cat} onChange={setCat} />
          <p className="text-sm text-muted" aria-live="polite"><b className="text-brand-600">{list.length}</b>개의 질문</p>
        </div>

        {list.length === 0 ? <Empty>검색 결과가 없습니다. 아래 1:1 문의를 이용해주세요.</Empty> : (
          <ul className="divide-y divide-line border-y-2 border-t-ink border-b-line">
            {list.map(f => {
              const isOpen = k ? !open.includes(f.id) : open.includes(f.id)
              return (
                <li key={f.id}>
                  <h2>
                    <button className="flex w-full items-center gap-4 px-2 py-5 text-left hover:bg-paper/60" aria-expanded={isOpen} aria-controls={`faq-${f.id}`} onClick={() => toggle(f.id)}>
                      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">Q</span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-0.5 block text-xs font-semibold text-brand-600">{f.category}</span>
                        <span className="block font-semibold"><Highlight text={f.q} kw={k} /></span>
                      </span>
                      <ChevronDown size={20} aria-hidden className={cx('shrink-0 text-muted transition', isOpen && 'rotate-180')} />
                    </button>
                  </h2>
                  <div id={`faq-${f.id}`} hidden={!isOpen} className="flex gap-4 bg-paper px-2 py-5">
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun-400 text-sm font-black text-ink">A</span>
                    <p className="pt-1 text-sm leading-7 text-ink/85"><Highlight text={f.a} kw={k} /></p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-12 flex flex-col items-start gap-5 rounded-3xl bg-brand-600 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div className="flex-1">
            <p className="text-xl font-extrabold">원하는 답을 못 찾으셨나요?</p>
            <p className="mt-1 text-sm text-brand-100">1:1 문의를 남겨주시면 담당자가 확인 후 빠르게 답변드립니다. (평일 09:00–18:00)</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <a href="tel:1600-6261" className="btn border border-white/40 text-white hover:bg-white/10"><Phone size={16} aria-hidden />1600-6261</a>
            <Link to="/site/support/inquiry" className="btn-accent"><MessageSquarePlus size={16} aria-hidden />1:1 문의하기</Link>
          </div>
        </div>
      </Section>
    </>
  )
}
