import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Building2, Check, Cloud, FileScan, Globe2, KeyRound, Lightbulb, Lock, LogIn, MessageCircleQuestion,
  MessagesSquare, MonitorCog, MousePointerClick, Send, ShieldCheck, Ship, Sparkles, User, Users, X, type LucideIcon,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { Segmented } from '../components/ui'

/*
 * 진입 경로: 이용자가 어디서, 어떤 로그인 상태로 AI 서비스에 들어오는지.
 * 근거: RFP 사업대상(대표홈페이지 · PortWise), 추진내용 SSO 연동(PortWise 통합로그인),
 *       SW사업 영향평가 예상 사용자(내부 100 · 타 기관 30 · 국민·기업 800), SFR-007 CSAP 클라우드.
 * RFP에 진입 방식은 명시돼 있지 않아 제안안으로 제시한다.
 */

interface Lane {
  key: string
  icon: LucideIcon
  channel: string
  host: string
  who: string
  how: string
  auth: string
  authIcon: LucideIcon
  authTone: string
  scope: string[]
  to: string
}

const LANES: Lane[] = [
  {
    key: 'home', icon: Globe2, channel: '울산항만공사 대표홈페이지', host: 'www.upa.or.kr', who: '일반 국민 · 기업 · 구직자',
    how: '모든 페이지 우측 하단 AI 상담 버튼', auth: '비로그인', authIcon: User, authTone: 'badge-gray',
    scope: ['AI 상담(공개 자료)'], to: '/chat?via=home',
  },
  {
    key: 'portwise', icon: Ship, channel: '항만정보공유플랫폼 PortWise', host: 'portwise.upa.or.kr', who: '선사 · 대리점 · 터미널 · 타 기관',
    how: '상단 메뉴 AI 서비스 · 화면별 바로가기', auth: 'PortWise SSO', authIcon: ShieldCheck, authTone: 'badge-blue',
    scope: ['AI 상담(PortWise 데이터 포함)', '스케줄 예측', '서식 어시스턴트'], to: '/chat?via=portwise',
  },
  {
    key: 'admin', icon: Building2, channel: '울산항만공사 업무망', host: '관리자 전용 주소', who: '공사 담당자 · AI정보실',
    how: '관리자 콘솔 주소로 직접 접속', auth: '관리자 인증 · IP 제한', authIcon: KeyRound, authTone: 'badge-amber',
    scope: ['모니터링', 'RAG 성능 평가', '모델 · 데이터 관리'], to: '/admin',
  },
]

type Cell = 'yes' | 'part' | 'no'
const MATRIX: { feature: string; note: string; cells: [Cell, Cell, Cell] }[] = [
  { feature: 'AI 상담 · 공개 자료', note: '사용료 규정, 입출항 절차, 채용, 항만운영 통계', cells: ['yes', 'yes', 'yes'] },
  { feature: 'AI 상담 · PortWise 데이터', note: '선석배정, ETA, 선박 위치를 답변에 인용', cells: ['no', 'yes', 'yes'] },
  { feature: '대화 이력 보관', note: '비로그인은 브라우저 세션 동안만 유지', cells: ['part', 'yes', 'yes'] },
  { feature: '스케줄 예측', note: '선석 타임라인, 72시간 혼잡도, 이상탐지', cells: ['no', 'yes', 'yes'] },
  { feature: '서식 어시스턴트', note: '입항신고서 등 업로드, 추출, 내보내기', cells: ['no', 'yes', 'yes'] },
  { feature: '관리자 콘솔', note: '이용 통계, RAG 평가, 모델·데이터 관리', cells: ['no', 'no', 'yes'] },
]

const PHASES = [
  { n: 1, when: 'M+4', title: '내부 시범 운영', desc: '테스트 주소로 공사 직원과 협조부서에 먼저 공개하고 RAG 품질을 점검합니다.', who: '내부 직원 100명' },
  { n: 2, when: 'M+5', title: 'PortWise 연동 오픈', desc: 'SSO 연동 후 PortWise 메뉴에 노출하고 이해관계자 의견을 받습니다.', who: '+ 이해관계자 · 타 기관' },
  { n: 3, when: '검증 후', title: '대표홈페이지 공개', desc: '공개 자료 범위로 챗봇 버튼을 달아 대국민 서비스로 확대합니다.', who: '+ 일반 국민 · 기업' },
]

const ASKS = [
  '대표홈페이지 탑재 방식: 스크립트 위젯(레이어) 또는 새 창 링크 중 공사 선호 방식',
  '대표홈페이지 비로그인 이용 허용 여부와 공개 자료 범위',
  'PortWise SSO 연동 규격(토큰 방식, 사용자 속성)과 연동 테스트 일정',
]

export default function EntryPage() {
  const [tab, setTab] = useState<'대표홈페이지' | 'PortWise' | '공사 업무망'>('대표홈페이지')

  return (
    <div className="ov">
      <header className="ov-top">
        <Link to="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark"><BrandMark /></span>
          울산항 정보공유 AI 서비스
        </Link>
        <div className="row">
          <Link to="/" className="btn">제안 개요</Link>
          <Link to="/chat?via=home" className="btn">이용자 앱<ArrowRight size={15} /></Link>
        </div>
      </header>

      <main className="ov-main">
        <section className="ov-hero">
          <p className="ov-eyebrow">진입 경로 제안</p>
          <h1>이용자는 어디서, 어떻게 들어오나요</h1>
          <p className="ov-lead">AI 서비스는 CSAP 공공 클라우드에 <b>하나의 웹서비스</b>로 구축하고, 이미 쓰고 있는 대표홈페이지와 PortWise에 입구를 답니다. 새 앱을 설치하거나 새 계정을 만들 필요가 없습니다.</p>
          <div className="ov-facts">
            <div><span>일반 국민 · 기업</span><b>800명</b></div>
            <div><span>타 기관 직원</span><b>30명</b></div>
            <div><span>내부 직원</span><b>100명</b></div>
            <div><span>근거</span><b>RFP SW사업 영향평가</b></div>
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">접속 구조</h2>
          <div className="card en-map">
            <div className="en-map-head" aria-hidden>
              <span>진입 채널</span><span /><span>인증</span><span /><span>울산항 AI에서 쓸 수 있는 기능</span>
            </div>
            {LANES.map((l) => (
              <div key={l.key} className="en-lane">
                <div className="en-node">
                  <span className="icon-tile"><l.icon size={16} /></span>
                  <span className="en-node-text">
                    <b>{l.channel}</b>
                    <span>{l.who}</span>
                    <span className="en-how"><MousePointerClick size={13} />{l.how}</span>
                  </span>
                </div>
                <div className="en-arrow" aria-hidden><ArrowRight size={16} /></div>
                <div className="en-auth"><span className={`badge ${l.authTone}`}><l.authIcon size={13} />{l.auth}</span></div>
                <div className="en-arrow" aria-hidden><ArrowRight size={16} /></div>
                <div className="en-scope">
                  <div className="en-chips">{l.scope.map((s) => <span key={s} className="en-chip">{s}</span>)}</div>
                  <Link to={l.to} className="ov-link">체험<ArrowRight size={14} /></Link>
                </div>
              </div>
            ))}
            <div className="en-cloud">
              <Cloud size={15} />
              <span>세 경로 모두 같은 서비스 <b>ai.upa.or.kr</b>(예시)로 연결 · CSAP 공공 클라우드 · 기존 시스템과는 IPsec VPN 연계</span>
            </div>
          </div>
        </section>

        <section className="ov-section">
          <div className="en-section-head">
            <h2 className="ov-h2" style={{ margin: 0 }}>진입 화면 미리보기</h2>
            <Segmented label="진입 채널" value={tab} options={['대표홈페이지', 'PortWise', '공사 업무망'] as const} onChange={setTab} />
          </div>
          {tab === '대표홈페이지' && <HomepageDemo />}
          {tab === 'PortWise' && <PortWiseDemo />}
          {tab === '공사 업무망' && <AdminDemo />}
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">로그인 상태별 이용 범위</h2>
          <div className="card">
            <div className="table-wrap">
              <table className="table en-matrix">
                <caption className="sr-only">진입 경로와 로그인 상태에 따른 기능 이용 범위</caption>
                <thead>
                  <tr><th>기능</th><th>대표홈페이지 · 비로그인</th><th>PortWise · SSO</th><th>공사 담당자</th></tr>
                </thead>
                <tbody>
                  {MATRIX.map((m) => (
                    <tr key={m.feature}>
                      <td className="wrap" style={{ minWidth: 240 }}>
                        <div className="strong">{m.feature}</div>
                        <div className="muted">{m.note}</div>
                      </td>
                      {m.cells.map((c, i) => <td key={i}><MatrixCell c={c} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">단계적 오픈</h2>
          <div className="en-phases">
            {PHASES.map((p) => (
              <div key={p.n} className="card en-phase">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="pin static">{p.n}</span>
                  <span className="badge badge-gray">{p.when}</span>
                </div>
                <b>{p.title}</b>
                <p>{p.desc}</p>
                <span className="en-phase-who"><Users size={13} />{p.who}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">착수 시 발주처와 확정할 사항</h2>
          <div className="card en-asks">
            {ASKS.map((a) => (
              <div key={a} className="en-ask"><MessageCircleQuestion size={16} />{a}</div>
            ))}
          </div>
        </section>

        <p className="ov-foot"><Lightbulb size={14} />RFP에 진입 방식이 명시돼 있지 않아 사업대상, SSO 연동 범위, 예상 사용자를 근거로 제안한 안입니다.</p>
      </main>
    </div>
  )
}

function MatrixCell({ c }: { c: Cell }) {
  if (c === 'yes') return <span className="en-cell yes"><Check size={15} />이용</span>
  if (c === 'part') return <span className="en-cell part"><Check size={15} />일부</span>
  return <span className="en-cell no"><Lock size={14} />로그인 필요</span>
}

/* ---------- 진입 화면 목업 ---------- */

function Browser({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="en-browser">
      <div className="en-browser-bar" aria-hidden>
        <i /><i /><i />
        <span className="en-url"><Lock size={11} />{url}</span>
      </div>
      <div className="en-site">{children}</div>
    </div>
  )
}

function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ol className="en-steps">
      {items.map((s, i) => (
        <li key={s.title}>
          <span className="pin static">{i + 1}</span>
          <span className="en-step-text"><b>{s.title}</b><span>{s.desc}</span></span>
        </li>
      ))}
    </ol>
  )
}

function HomepageDemo() {
  const [open, setOpen] = useState(true)
  return (
    <div className="en-demo">
      <Browser url="www.upa.or.kr">
        <div className="hp-header">
          <span className="hp-logo"><BrandMark size={18} />울산항만공사</span>
          <span className="hp-nav hide-sm"><span>공사소개</span><span>항만운영</span><span>인재채용</span><span>열린경영</span></span>
        </div>
        <div className="hp-hero">
          <b>세계로 나아가는 에너지 물류 허브, 울산항</b>
          <span>항만시설 사용료 · 입출항 안내 · 항만운영 통계</span>
        </div>
        <div className="hp-tiles" aria-hidden>
          <i /><i /><i />
        </div>

        {open ? (
          <div className="widget" role="dialog" aria-label="울산항 AI 상담 미리보기">
            <div className="widget-head">
              <span className="row"><BrandMark size={16} /><b>울산항 AI</b></span>
              <span className="badge badge-gray">비로그인</span>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="닫기" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <div className="widget-body">
              <div className="widget-bubble">안녕하세요. 울산항만공사 공식 자료를 근거로 답변드려요.</div>
              <div className="widget-chips">
                <Link to="/chat?via=home" className="widget-chip">항만시설 사용료 기준</Link>
                <Link to="/chat?via=home" className="widget-chip">입출항 신고 절차</Link>
                <Link to="/chat?via=home" className="widget-chip">채용 일정</Link>
              </div>
              <div className="widget-note"><Lock size={12} />선석·스케줄 예측은 PortWise 로그인 후 이용</div>
            </div>
            <div className="widget-foot">
              <span className="widget-input">질문을 입력하세요</span>
              <span className="btn btn-primary btn-icon btn-sm" aria-hidden><Send size={13} /></span>
            </div>
            <Link to="/chat?via=home" className="widget-full">전체 화면으로 열기<ArrowRight size={13} /></Link>
          </div>
        ) : (
          <button className="fab" onClick={() => setOpen(true)}><MessagesSquare size={16} />AI 상담</button>
        )}
      </Browser>
      <Steps items={[
        { title: '어느 페이지에서나 AI 상담 버튼', desc: '홈페이지에는 스크립트 한 줄만 추가합니다. 기존 화면은 바꾸지 않습니다.' },
        { title: '레이어로 바로 질문', desc: '로그인 없이 공개 자료 범위에서 답합니다. 개인정보는 입력 즉시 마스킹합니다.' },
        { title: '필요하면 전체 화면으로', desc: '근거 원문, 지식그래프, 대화 이력은 전체 화면에서 이어서 봅니다.' },
      ]} />
    </div>
  )
}

function PortWiseDemo() {
  return (
    <div className="en-demo">
      <Browser url="portwise.upa.or.kr">
        <div className="pw-header">
          <span className="pw-logo"><Ship size={15} />PortWise</span>
          <span className="pw-user"><ShieldCheck size={13} />김항만 님 · 한울해운</span>
        </div>
        <div className="pw-nav">
          <span className="hide-sm">선박운항정보</span>
          <span className="hide-sm">선석운영지원</span>
          <span className="hide-sm">항만시설관리</span>
          <span className="pw-ai">AI 서비스<Sparkles size={12} /></span>
        </div>
        <div className="pw-menu" role="menu" aria-label="AI 서비스 메뉴">
          <Link role="menuitem" to="/chat?via=portwise"><MessagesSquare size={15} />AI 상담</Link>
          <Link role="menuitem" to="/schedule?via=portwise"><Ship size={15} />스케줄 예측</Link>
          <Link role="menuitem" to="/forms?via=portwise"><FileScan size={15} />서식 어시스턴트</Link>
        </div>
        <div className="pw-body">
          <b className="pw-title">선석배정 현황</b>
          <div className="pw-table" aria-hidden>{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</div>
          <Link to="/schedule?via=portwise" className="pw-cta"><Sparkles size={14} />이 선석의 대기시간 AI 예측 보기<ArrowRight size={14} /></Link>
        </div>
      </Browser>
      <Steps items={[
        { title: 'PortWise 상단 메뉴에 AI 서비스', desc: '이미 로그인한 이해관계자가 평소 쓰는 화면에서 바로 들어옵니다.' },
        { title: 'SSO 토큰으로 재로그인 없이 이동', desc: '통합로그인 토큰만 넘겨받고, 계정과 비밀번호는 AI 서비스에 두지 않습니다.' },
        { title: '업무 화면별 바로가기', desc: '선석배정 화면에서 해당 선석의 대기시간 예측으로 바로 연결합니다.' },
      ]} />
    </div>
  )
}

function AdminDemo() {
  return (
    <div className="en-demo">
      <Browser url="관리자 전용 주소 (업무망)">
        <div className="ad-login">
          <span className="empty-mark" style={{ margin: 0 }}><MonitorCog size={22} className="faint" /></span>
          <b>울산항 AI 콘솔</b>
          <span className="muted">허용된 업무망 IP에서만 접속할 수 있습니다</span>
          <span className="ad-field" aria-hidden>관리자 아이디</span>
          <span className="ad-field" aria-hidden>비밀번호 · 2단계 인증</span>
          <Link to="/admin" className="btn btn-primary" style={{ width: '100%' }}><LogIn size={15} />로그인</Link>
        </div>
      </Browser>
      <Steps items={[
        { title: '관리자 콘솔은 별도 주소', desc: '이용자 화면과 분리해 노출하지 않고, 업무망 IP만 허용합니다.' },
        { title: '관리자 인증과 권한 분리', desc: '운영 담당과 데이터 담당 권한을 나누고 접속 기록을 남깁니다.' },
        { title: '운영·품질 관리', desc: '이용 통계, RAG 평가, 모델과 데이터 관리를 한곳에서 합니다.' },
      ]} />
    </div>
  )
}
