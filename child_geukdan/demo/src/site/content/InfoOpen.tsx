import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { ArrowRight, Download, ExternalLink, FileSpreadsheet, FileText, Search } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useStore } from '../../store'
import { cx } from '../../lib/format'
import { Empty, Pagination, Section, SectionTitle } from './ui'

const TABS = [
  { to: '/site/info', label: '정보공개 안내', end: true },
  { to: '/site/info/pre', label: '사전정보공표' },
  { to: '/site/info/data', label: '정보공개 자료실' },
]

export default function InfoOpen() {
  return (
    <Routes>
      <Route index element={<Frame title="정보공개 안내" desc="「공공기관의 정보공개에 관한 법률」에 따라 국민의 알권리를 보장합니다."><Guide /></Frame>} />
      <Route path="pre" element={<Frame title="사전정보공표" desc="국민의 관심이 높은 정보를 청구 없이 미리 공개합니다."><Pre /></Frame>} />
      <Route path="data" element={<Frame title="정보공개 자료실" desc="경영·예산·계약 등 극단의 공개 자료를 제공합니다."><Data /></Frame>} />
      <Route path="*" element={<Navigate to="/site/info" replace />} />
    </Routes>
  )
}
function Frame({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return <><PageHeader crumbs={['정보공개', title]} title={title} desc={desc} tabs={TABS} />{children}</>
}

function Guide() {
  const toast = useStore(s => s.toast)
  return (
    <Section className="space-y-12">
      <section>
        <SectionTitle>정보공개 청구 절차</SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[['청구서 제출', '정보공개포털·우편·방문'], ['접수', '접수증 발급'], ['공개 여부 결정', '10일 이내 (10일 연장 가능)'], ['결정 통지', '공개·부분공개·비공개'], ['정보 공개', '열람·사본·전자파일']].map(([t, d], i) => (
            <li key={t} className="relative rounded-2xl bg-paper p-5">
              <span className="text-xs font-black text-brand-600">STEP {i + 1}</span>
              <p className="mt-1 font-bold">{t}</p>
              <p className="mt-1 text-xs text-muted">{d}</p>
              {i < 4 && <ArrowRight size={16} aria-hidden className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-brand-200 lg:block" />}
            </li>
          ))}
        </ol>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <p className="font-bold">청구 방법</p>
          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink/80">
            <li>· 온라인: 정보공개포털(www.open.go.kr)에서 청구</li>
            <li>· 우편·팩스: 정보공개청구서 작성 후 제출</li>
            <li>· 방문: 서울특별시 용산구 청파로 373 경영관리팀</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary btn-sm" onClick={() => toast('정보공개포털(open.go.kr)로 이동합니다. (시연)')}><ExternalLink size={14} aria-hidden />정보공개포털</button>
            <button className="btn-outline btn-sm" onClick={() => toast('정보공개청구서.hwp 다운로드를 시작합니다.')}><Download size={14} aria-hidden />청구서 양식</button>
          </div>
        </div>
        <div className="card p-6">
          <p className="font-bold">수수료 및 담당</p>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">정보공개 수수료</caption>
            <tbody className="divide-y divide-line">
              <tr><th scope="row" className="py-2 text-left font-semibold text-muted">열람·시청</th><td className="py-2">1일 1시간 기준 무료 (이후 30분마다 1,000원)</td></tr>
              <tr><th scope="row" className="py-2 text-left font-semibold text-muted">사본(종이)</th><td className="py-2">A4 1장 250원 (이후 1장 50원)</td></tr>
              <tr><th scope="row" className="py-2 text-left font-semibold text-muted">전자파일</th><td className="py-2">무료 (정보통신망 송부)</td></tr>
              <tr><th scope="row" className="py-2 text-left font-semibold text-muted">담당</th><td className="py-2">경영관리팀 02-3279-2290</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-2xl bg-brand-50 p-5 text-sm leading-7">
        <p className="font-bold text-brand-700">비공개 대상 정보 (법 제9조)</p>
        <p className="text-ink/80">법령상 비밀, 국가안전보장, 개인정보, 영업상 비밀, 공정한 업무수행에 현저한 지장을 줄 우려가 있는 정보 등은 공개가 제한될 수 있습니다. 비공개 결정에 이의가 있는 경우 통지를 받은 날부터 30일 이내에 이의신청할 수 있습니다.</p>
      </section>
    </Section>
  )
}

const PRE = [
  { cat: '기관운영', title: '조직 및 정원 현황', cycle: '수시', when: '변경 시', dept: '경영관리팀', ext: 'pdf' },
  { cat: '기관운영', title: '업무추진비 집행 내역', cycle: '월', when: '익월 10일', dept: '경영관리팀', ext: 'xlsx' },
  { cat: '기관운영', title: '임직원 국외출장 결과', cycle: '수시', when: '귀국 후 30일', dept: '경영관리팀', ext: 'pdf' },
  { cat: '예산·재정', title: '세입·세출 예산서', cycle: '연', when: '매년 1월', dept: '경영관리팀', ext: 'xlsx' },
  { cat: '예산·재정', title: '결산서', cycle: '연', when: '매년 5월', dept: '경영관리팀', ext: 'pdf' },
  { cat: '계약', title: '계약 체결 현황 (2천만원 이상)', cycle: '월', when: '익월 10일', dept: '경영관리팀', ext: 'xlsx' },
  { cat: '계약', title: '수의계약 현황', cycle: '분기', when: '분기 익월', dept: '경영관리팀', ext: 'xlsx' },
  { cat: '공연사업', title: '연간 공연 계획 및 실적', cycle: '연', when: '매년 2월', dept: '공연기획팀', ext: 'pdf' },
  { cat: '공연사업', title: '공연별 관객 수 및 객석점유율', cycle: '분기', when: '분기 익월', dept: '홍보마케팅팀', ext: 'xlsx' },
  { cat: '공연사업', title: '대관 운영 현황', cycle: '반기', when: '반기 익월', dept: '공연기획팀', ext: 'xlsx' },
  { cat: '연구·교육', title: '교육 프로그램 운영 실적', cycle: '반기', when: '반기 익월', dept: '연구개발팀', ext: 'pdf' },
  { cat: '연구·교육', title: '연구용역 결과보고서', cycle: '수시', when: '완료 후 30일', dept: '연구개발팀', ext: 'pdf' },
]
function Pre() {
  const toast = useStore(s => s.toast)
  const cats = ['전체', ...Array.from(new Set(PRE.map(p => p.cat)))]
  const [cat, setCat] = useState('전체')
  const list = PRE.filter(p => cat === '전체' || p.cat === cat)
  return (
    <Section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="pre-cat" className="text-sm font-semibold">분야</label>
          <select id="pre-cat" className="input w-40" value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select>
        </div>
        <p className="text-sm text-muted">공표목록 <b className="text-brand-600">{list.length}</b>건 · 기준일 2026.10.05</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-t-2 border-ink text-sm">
          <caption className="sr-only">사전정보 공표목록 - 분야, 공표항목, 공표주기, 공개시기, 담당부서, 파일</caption>
          <thead>
            <tr className="bg-paper text-muted">
              {['번호', '분야', '공표항목', '공표주기', '공개시기', '담당부서', '파일'].map(h => <th key={h} scope="col" className="border-b border-line px-3 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.title} className="border-b border-line text-center hover:bg-brand-50/40">
                <td className="px-3 py-3 text-muted">{list.length - i}</td>
                <td className="px-3 py-3"><span className="chip bg-brand-50 text-brand-700">{p.cat}</span></td>
                <th scope="row" className="px-3 py-3 text-left font-semibold">{p.title}</th>
                <td className="px-3 py-3">{p.cycle}</td>
                <td className="px-3 py-3">{p.when}</td>
                <td className="px-3 py-3 text-muted">{p.dept}</td>
                <td className="px-3 py-3">
                  <button className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs hover:border-brand-500 hover:text-brand-600"
                    onClick={() => toast(`${p.title}_2026.${p.ext} 다운로드를 시작합니다.`)} aria-label={`${p.title} ${p.ext.toUpperCase()} 다운로드`}>
                    {p.ext === 'xlsx' ? <FileSpreadsheet size={14} className="text-mint-500" aria-hidden /> : <FileText size={14} className="text-coral-500" aria-hidden />}{p.ext.toUpperCase()}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">※ 공공데이터는 공공누리 제1유형(출처표시)에 따라 자유롭게 이용할 수 있습니다.</p>
    </Section>
  )
}

const DATA = [
  ['2026년 9월 업무추진비 집행내역', '경영', '2026-10-02', 'xlsx'],
  ['2026년 3분기 계약 체결 현황', '계약', '2026-10-01', 'xlsx'],
  ['국립어린이청소년극단 설립 및 운영 규정', '규정', '2026-09-30', 'pdf'],
  ['2026년 하반기 공연 사업 계획', '사업', '2026-09-15', 'pdf'],
  ['2026년 8월 업무추진비 집행내역', '경영', '2026-09-08', 'xlsx'],
  ['홈페이지 및 티켓예매시스템 구축 사업 제안요청서', '계약', '2026-09-07', 'hwp'],
  ['2026년 상반기 공연별 관객 현황', '사업', '2026-07-20', 'xlsx'],
  ['2026년 7월 업무추진비 집행내역', '경영', '2026-08-07', 'xlsx'],
  ['2025 어린이청소년극 관객 연구 보고서', '연구', '2026-06-30', 'pdf'],
  ['2026년도 세입·세출 예산서', '예산', '2026-01-20', 'xlsx'],
  ['2025 회계연도 결산서', '예산', '2026-05-28', 'pdf'],
  ['2026년 6월 업무추진비 집행내역', '경영', '2026-07-08', 'xlsx'],
  ['직제 및 정원 규정', '규정', '2026-03-02', 'pdf'],
  ['2026년 2분기 계약 체결 현황', '계약', '2026-07-01', 'xlsx'],
].map(([title, cat, date, ext], i) => ({ id: i + 1, title, cat, date, ext, views: 40 + ((i * 37) % 300) }))
  .sort((a, b) => b.date.localeCompare(a.date))

function Data() {
  const toast = useStore(s => s.toast)
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const list = useMemo(() => DATA.filter(d => !applied || d.title.includes(applied)), [applied])
  const PER = 10
  const total = Math.max(1, Math.ceil(list.length / PER))
  const cur = Math.min(page, total)
  const submit = (e: FormEvent) => { e.preventDefault(); setApplied(q.trim()); setPage(1) }
  return (
    <Section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">총 <b className="text-brand-600">{list.length}</b>건</p>
        <form onSubmit={submit} role="search" className="flex gap-2">
          <label htmlFor="dq" className="sr-only">자료명 검색</label>
          <input id="dq" className="input min-w-0 sm:w-64" placeholder="자료명 검색" value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn-primary shrink-0" aria-label="검색"><Search size={16} aria-hidden /></button>
        </form>
      </div>
      {list.length === 0 ? <Empty /> : (
        <>
          <ul className="border-t-2 border-ink">
            {list.slice((cur - 1) * PER, cur * PER).map((d, i) => (
              <li key={d.id} className="flex flex-col gap-2 border-b border-line px-2 py-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="hidden w-10 text-center text-sm text-muted sm:block">{list.length - ((cur - 1) * PER + i)}</span>
                <span className="chip w-fit bg-paper text-muted ring-1 ring-line">{d.cat}</span>
                <span className="min-w-0 flex-1 font-semibold">{d.title}</span>
                <span className="flex items-center gap-4 text-xs text-muted">
                  <span>{d.date.replace(/-/g, '.')}</span><span>조회 {d.views}</span>
                  <button className={cx('inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink hover:border-brand-500 hover:text-brand-600')}
                    onClick={() => toast(`${d.title}.${d.ext} 다운로드를 시작합니다.`)} aria-label={`${d.title} 다운로드`}>
                    <Download size={13} aria-hidden />{d.ext.toUpperCase()}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <Pagination page={cur} total={total} onChange={setPage} />
        </>
      )}
    </Section>
  )
}
