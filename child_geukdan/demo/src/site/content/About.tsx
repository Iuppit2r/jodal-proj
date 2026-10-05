import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Check, Download, Heart, Lightbulb, Sparkles, Users, X } from 'lucide-react'
import PageHeader from '../PageHeader'
import { useStore } from '../../store'
import { Section, SectionTitle } from './ui'

const TABS = [
  { to: '/site/about/greeting', label: '인사말' },
  { to: '/site/about/overview', label: '극단 소개·연혁' },
  { to: '/site/about/org', label: '조직도' },
  { to: '/site/about/ci', label: 'CI 소개' },
]
const META: Record<string, { title: string; desc: string }> = {
  greeting: { title: '인사말', desc: '어린이와 청소년이 처음 만나는 극장, 국립어린이청소년극단입니다.' },
  overview: { title: '극단 소개·연혁', desc: '2011년 어린이청소년극연구소에서 2026년 독립 국립극단으로.' },
  org: { title: '조직도', desc: '국립어린이청소년극단의 조직과 업무를 안내합니다.' },
  ci: { title: 'CI 소개', desc: '국립어린이청소년극단의 상징과 시각 언어를 소개합니다.' },
}

function Frame({ k, children }: { k: keyof typeof META; children: ReactNode }) {
  return (
    <>
      <PageHeader crumbs={['극단소개', META[k].title]} title={META[k].title} desc={META[k].desc} tabs={TABS} />
      {children}
    </>
  )
}

export default function About() {
  return (
    <Routes>
      <Route index element={<Navigate to="greeting" replace />} />
      <Route path="greeting" element={<Frame k="greeting"><Greeting /></Frame>} />
      <Route path="overview" element={<Frame k="overview"><Overview /></Frame>} />
      <Route path="org" element={<Frame k="org"><Org /></Frame>} />
      <Route path="ci" element={<Frame k="ci"><Ci /></Frame>} />
      <Route path="*" element={<Navigate to="greeting" replace />} />
    </Routes>
  )
}

/* ── 인사말 ── */
function Greeting() {
  return (
    <Section>
      <div className="grid items-start gap-10 lg:grid-cols-[360px_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 p-8 text-white">
          <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sun-400" />
          <div aria-hidden className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-coral-400/80" />
          <div aria-hidden className="absolute bottom-10 right-8 h-10 w-10 rounded-full bg-mint-400" />
          <p className="relative text-sm font-semibold text-brand-100">Greeting</p>
          <p className="relative mt-4 text-3xl font-extrabold leading-snug">“극장은<br />아이들이 처음<br />세상을 만나는<br />가장 큰 창문입니다.”</p>
          <p className="relative mt-10 text-sm text-brand-100">국립어린이청소년극단<br /><b className="text-white">단장 겸 예술감독</b></p>
        </div>
        <article className="space-y-5 text-[15px] leading-8 text-ink/90">
          <h2 className="text-2xl font-extrabold leading-snug text-ink">어린이와 청소년의 오늘을 가장 먼저 무대에 올리는 극단이 되겠습니다.</h2>
          <p>안녕하십니까. 국립어린이청소년극단 홈페이지를 찾아주신 여러분을 진심으로 환영합니다.</p>
          <p>국립어린이청소년극단은 2011년 국립극단 어린이청소년극연구소로 첫걸음을 내디딘 이래, 15년 동안 어린이와 청소년을 위한 동시대 연극을 연구하고 창작해 왔습니다. 그리고 2026년, 독립된 국립 예술단체로 새롭게 출범하며 더 넓은 무대를 향해 나아가고 있습니다.</p>
          <p>우리는 어린이와 청소년을 ‘미래의 관객’이 아닌 ‘오늘의 관객’으로 존중합니다. 아이들의 질문에서 이야기를 시작하고, 청소년의 목소리로 장면을 다듬으며, 모든 관객이 차별 없이 공연을 즐길 수 있는 접근성 높은 극장을 만들어 가겠습니다.</p>
          <p>전국의 어린이·청소년이 사는 곳과 관계없이 좋은 공연을 만날 수 있도록 지역 순회와 교육 프로그램을 확대하고, 연구와 아카이브를 통해 우리 어린이청소년극의 역사를 기록해 나가겠습니다.</p>
          <p>극장에서 웃고, 놀라고, 함께 생각하는 시간이 아이들의 삶에 오래 남는 기억이 되기를 바랍니다. 여러분의 많은 관심과 응원을 부탁드립니다. 감사합니다.</p>
          <p className="pt-4 text-right font-bold">국립어린이청소년극단 단장 겸 예술감독</p>
        </article>
      </div>
    </Section>
  )
}

/* ── 소개·연혁 ── */
const HISTORY: { y: string; items: string[]; hl?: boolean }[] = [
  { y: '2011', items: ['국립극단 어린이청소년극연구소 개소', '청소년극 <소년이 그랬다> 초연 (소극장 판)'] },
  { y: '2012', items: ['<레슬링 시즌> 국내 초연', '<빨간버스> 초연'] },
  { y: '2013', items: ['<노란 달 YELLOW MOON> 국내 초연 (백성희장민호극장)'] },
  { y: '2014', items: ['<타조 소년들> 세계 초연', '청소년극 릴-레이Ⅱ 개최'] },
  { y: '2015–2020', items: ['어린이극 레퍼토리 정례화 및 지역 순회 공연 확대', '청소년 창작 워크숍·관객 자문단 운영'] },
  { y: '2021–2025', items: ['영유아·가족 공연 및 릴랙스드 퍼포먼스 도입', '수어통역·음성해설 등 접근성 회차 상시화', '웹진 창간 및 관객 연구 보고서 발간'] },
  { y: '2026', hl: true, items: ['국립극단에서 분리, 국립어린이청소년극단 독립 출범', '단장 겸 예술감독 임명 (9월)', '새 홈페이지 및 티켓예매시스템 오픈 (10월)'] },
]
function Overview() {
  return (
    <Section className="space-y-16">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-bold text-brand-600">Mission</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">모든 어린이와 청소년이<br />좋은 연극을 만날 권리</h2>
          <p className="mt-4 leading-7 text-muted">국립어린이청소년극단은 문화체육관광부 소속 국립 예술단체로, 어린이·청소년을 위한 동시대 공연을 제작하고 연구하며, 관객이 극장에서 주체적인 경험을 할 수 있도록 돕습니다.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Sparkles, t: '창작', d: '어린이·청소년의 오늘을 담은 신작 개발', c: 'bg-sun-300/40' },
            { icon: Lightbulb, t: '연구', d: '관객 연구·교육 프로그램·아카이브', c: 'bg-brand-50' },
            { icon: Heart, t: '접근성', d: '장애·지역·경제적 장벽 없는 극장', c: 'bg-coral-400/20' },
            { icon: Users, t: '참여', d: '관객 자문단·워크숍으로 함께 만드는 무대', c: 'bg-mint-400/20' },
          ].map(({ icon: I, t, d, c }) => (
            <li key={t} className={`rounded-2xl p-5 ${c}`}>
              <I size={22} aria-hidden className="text-ink" />
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[['15년', '어린이청소년극 연구·창작'], ['2개', '전용 공연장 (백성희장민호극장·소극장 판)'], ['100%', '접근성 회차 운영 공연 비율 목표']].map(([n, l]) => (
          <div key={l} className="card p-6 text-center">
            <p className="text-3xl font-extrabold text-brand-600">{n}</p>
            <p className="mt-1 text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>

      <div>
        <SectionTitle sub="2011년 연구소에서 2026년 독립 출범까지">연혁</SectionTitle>
        <ol className="relative ml-3 border-l-2 border-brand-100 pl-8">
          {HISTORY.map(h => (
            <li key={h.y} className="relative pb-8 last:pb-0">
              <span aria-hidden className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-white ${h.hl ? 'bg-sun-400 ring-2 ring-sun-400' : 'bg-brand-600'}`} />
              <p className={`text-lg font-extrabold ${h.hl ? 'text-brand-600' : ''}`}>{h.y}{h.hl && <span className="chip ml-2 bg-sun-400 align-middle text-ink">독립 출범</span>}</p>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {h.items.map(i => <li key={i}>· {i}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl bg-paper p-6 text-sm leading-7">
        <p className="font-bold">공연장 안내</p>
        <p className="text-muted">백성희장민호극장 · 소극장 판 — 서울특별시 용산구 청파로 373 | 대표전화 1600-6261 | 주무부처 문화체육관광부</p>
      </div>
    </Section>
  )
}

/* ── 조직도 ── */
const TEAMS = [
  { name: '공연기획팀', color: 'border-brand-600', roles: ['시즌 레퍼토리 기획', '작품 제작·프로덕션 관리', '지역 순회·협력 공연', '대관 공연 운영'] },
  { name: '홍보마케팅팀', color: 'border-coral-500', roles: ['홈페이지·SNS 운영', '티켓 판매·멤버십 관리', '관객 개발·단체관람', '웹진 발행'] },
  { name: '연구개발팀', color: 'border-mint-500', roles: ['어린이청소년극 연구', '교육 프로그램 개발', '공연 아카이브 구축', '관객 자문단 운영'] },
  { name: '무대기술팀', color: 'border-sun-500', roles: ['무대·조명·음향 운영', '공연장 안전 관리', '접근성 설비 운영'] },
  { name: '경영관리팀', color: 'border-gray-500', roles: ['예산·회계·계약', '인사·복무', '정보공개·법무', '시설·정보화 관리'] },
]
function Org() {
  const tel = ['02-3279-2201', '02-3279-2230', '02-3279-2250', '02-3279-2270', '02-3279-2290']
  return (
    <Section>
      <div className="flex flex-col items-center">
        <div className="rounded-2xl bg-brand-600 px-8 py-4 text-center text-white shadow-lg">
          <p className="text-xs text-brand-100">Artistic Director</p>
          <p className="text-lg font-extrabold">단장 겸 예술감독</p>
        </div>
        <div aria-hidden className="h-8 w-0.5 bg-brand-200" />
        <div className="flex w-full items-center justify-center">
          <div className="relative flex items-center">
            <div aria-hidden className="h-0.5 w-10 bg-brand-200 sm:w-20" />
            <div className="rounded-xl border-2 border-dashed border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700">예술자문위원회</div>
          </div>
        </div>
        <div aria-hidden className="h-8 w-0.5 bg-brand-200" />
        <div className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white">사무국</div>
        <div aria-hidden className="h-8 w-0.5 bg-brand-200" />
        <div aria-hidden className="hidden h-0.5 w-[80%] bg-brand-200 lg:block" />
        <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TEAMS.map(t => (
            <li key={t.name} className="relative">
              <div aria-hidden className="mx-auto hidden h-6 w-0.5 bg-brand-200 lg:block" />
              <div className={`card h-full border-t-4 p-5 ${t.color}`}>
                <p className="font-extrabold">{t.name}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {t.roles.map(r => <li key={r} className="flex gap-1.5"><span aria-hidden className="text-brand-600">·</span>{r}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 overflow-x-auto">
        <table className="tbl">
          <caption className="mb-3 text-left text-lg font-extrabold">부서별 연락처</caption>
          <thead><tr><th scope="col">부서</th><th scope="col">주요 업무</th><th scope="col">전화</th></tr></thead>
          <tbody>
            {TEAMS.map((t, i) => (
              <tr key={t.name}><th scope="row" className="!bg-white !text-ink">{t.name}</th><td>{t.roles.join(', ')}</td><td>{tel[i]}</td></tr>
            ))}
            <tr><th scope="row" className="!bg-white !text-ink">티켓 예매 문의</th><td>예매·취소·단체관람</td><td>1600-6261</td></tr>
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/* ── CI ── */
const COLORS = [
  { name: 'Theater Blue', ko: '극장 블루', hex: '#2647C4', rgb: '38 71 196', cls: 'text-white' },
  { name: 'Sunny Yellow', ko: '햇살 옐로', hex: '#FFC933', rgb: '255 201 51', cls: 'text-ink' },
  { name: 'Coral', ko: '코랄', hex: '#F2664B', rgb: '242 102 75', cls: 'text-white' },
  { name: 'Mint', ko: '민트', hex: '#1FB592', rgb: '31 181 146', cls: 'text-white' },
  { name: 'Ink', ko: '잉크', hex: '#16181D', rgb: '22 24 29', cls: 'text-white' },
  { name: 'Paper', ko: '페이퍼', hex: '#F7F8FB', rgb: '247 248 251', cls: 'text-ink' },
]
function Logo({ dark = false, size = 'md' }: { dark?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 48 48" className={size === 'lg' ? 'h-16 w-16' : 'h-11 w-11'} aria-hidden>
        <rect width="48" height="48" rx="14" fill="#2647C4" />
        <path d="M10 34 Q24 8 38 34" stroke="#FFC933" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="30" r="5" fill="#F2664B" />
        <circle cx="35" cy="14" r="3" fill="#1FB592" />
      </svg>
      <div className={dark ? 'text-white' : 'text-ink'}>
        <p className={`${size === 'lg' ? 'text-xl' : 'text-base'} font-extrabold leading-tight`}>국립어린이청소년극단</p>
        <p className={`text-[10px] font-semibold tracking-wide ${dark ? 'text-brand-100' : 'text-muted'}`}>NATIONAL THEATER FOR CHILDREN AND YOUTH</p>
      </div>
    </div>
  )
}
function Ci() {
  const toast = useStore(s => s.toast)
  const copy = (hex: string) => { navigator.clipboard?.writeText(hex).catch(() => {}); toast(`${hex} 색상 코드가 복사되었습니다.`) }
  return (
    <Section className="space-y-14">
      <div>
        <SectionTitle sub="무대의 아치(Arch)와 떠오르는 해, 그리고 관객인 아이를 형상화했습니다.">심볼마크·로고타입</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card flex min-h-48 items-center justify-center p-8"><Logo size="lg" /></div>
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-brand-600 p-8"><Logo dark size="lg" /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['AI', 'PNG', 'SVG'].map(f => (
            <button key={f} className="btn-outline btn-sm" onClick={() => toast(`CI_국립어린이청소년극단.${f.toLowerCase()} 다운로드를 시작합니다.`)}><Download size={14} aria-hidden />{f} 다운로드</button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle sub="색상을 클릭하면 HEX 코드가 복사됩니다.">전용 색상</SectionTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map(c => (
            <li key={c.hex}>
              <button onClick={() => copy(c.hex)} className="w-full overflow-hidden rounded-2xl border border-line text-left transition hover:-translate-y-0.5 hover:shadow-md" aria-label={`${c.ko} ${c.hex} 복사`}>
                <div className={`flex h-24 items-end p-3 text-xs font-bold ${c.cls}`} style={{ background: c.hex }}>{c.name}</div>
                <div className="p-3 text-xs">
                  <p className="font-bold">{c.ko}</p>
                  <p className="mt-1 font-mono text-muted">{c.hex}</p>
                  <p className="font-mono text-muted">RGB {c.rgb}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionTitle sub="웹·인쇄물 공통 서체">전용 서체</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-xs font-bold text-muted">국문 · Pretendard</p>
            <p className="mt-3 text-4xl font-extrabold">가나다 극장</p>
            <p className="mt-2 text-lg">어린이와 청소년의 오늘을 무대에</p>
            <p className="mt-3 text-xs text-muted">ExtraBold 800 (제목) / SemiBold 600 (강조) / Regular 400 (본문)</p>
          </div>
          <div className="card p-6">
            <p className="text-xs font-bold text-muted">영문 · Pretendard Latin</p>
            <p className="mt-3 text-4xl font-extrabold">Aa Theater</p>
            <p className="mt-2 text-lg">Stories for Children and Youth</p>
            <p className="mt-3 text-xs text-muted">0123456789 · Tabular numbers for schedules</p>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle sub="로고의 형태와 색상을 임의로 변경하지 마세요.">사용 규정</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-mint-500 p-5">
            <p className="flex items-center gap-1.5 font-bold text-mint-500"><Check size={18} aria-hidden />이렇게 사용하세요 (Do)</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
              <li>· 심볼 높이의 1/2 이상 여백(Clear space)을 확보합니다.</li>
              <li>· 흰 배경 또는 극장 블루 배경에서 사용합니다.</li>
              <li>· 최소 크기: 화면 24px / 인쇄 10mm 이상.</li>
              <li>· 제공된 원본 파일(AI·SVG)을 사용합니다.</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-coral-500 p-5">
            <p className="flex items-center gap-1.5 font-bold text-coral-500"><X size={18} aria-hidden />이렇게 사용하지 마세요 (Don’t)</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
              <li>· 비율을 늘리거나 줄여 변형하지 않습니다.</li>
              <li>· 지정 색상 외의 색으로 바꾸지 않습니다.</li>
              <li>· 복잡한 사진 위에 대비 없이 올리지 않습니다.</li>
              <li>· 그림자·외곽선 등 효과를 추가하지 않습니다.</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <figure className="card flex flex-col items-center gap-2 overflow-hidden p-4"><div className="scale-75"><Logo /></div><figcaption className="text-xs font-bold text-mint-500">O 올바른 사용</figcaption></figure>
          <figure className="card flex flex-col items-center gap-2 overflow-hidden p-4"><div className="scale-x-125 scale-y-75 opacity-90"><Logo /></div><figcaption className="text-xs font-bold text-coral-500">X 비율 변형</figcaption></figure>
          <figure className="card flex flex-col items-center gap-2 overflow-hidden p-4"><div className="scale-75 hue-rotate-90"><Logo /></div><figcaption className="text-xs font-bold text-coral-500">X 색상 변경</figcaption></figure>
          <figure className="card flex flex-col items-center gap-2 overflow-hidden p-4"><div className="scale-75 -rotate-12"><Logo /></div><figcaption className="text-xs font-bold text-coral-500">X 회전</figcaption></figure>
        </div>
      </div>
    </Section>
  )
}
