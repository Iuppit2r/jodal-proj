import { Link } from 'react-router-dom'
import {
  Activity, ArrowRight, BrainCircuit, Building2, Globe2, CircleCheck, Database, FileScan, Gauge, Languages, Lightbulb, MessageSquareHeart,
  MessagesSquare, PhoneOff, Quote, Route, SearchX, ShieldCheck, Ship, Target, Users, type LucideIcon,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'

interface Screen { label: string; to: string }
interface Pain { icon: LucideIcon; title: string; quote: string; source: string; solves: string[]; screens: Screen[]; req: string }

/** RFP Ⅰ-2 추진배경과 Ⅰ-3 추진내용에서 뽑은 발주처 과제 */
const PAINS: Pain[] = [
  {
    icon: SearchX, title: '검색 효율성 저하', source: 'RFP Ⅰ-2 추진배경',
    quote: '복잡한 메뉴와 텍스트 위주 정보 제공으로 통합검색 한계',
    solves: ['질문 한 번에 근거와 함께 답하는 RAG 대화형 AI', '지식그래프로 흩어진 규정을 이어서 복합 질문에 답변', '원문 링크 · 담당 부서 · 첨부파일을 답변에 함께 제공'],
    screens: [{ label: 'AI 상담', to: '/chat' }, { label: '데이터·지식 관리', to: '/admin/data' }],
    req: 'SFR-002 · SFR-003 · SFR-004',
  },
  {
    icon: Languages, title: '정보 접근 불균형', source: 'RFP Ⅰ-2 추진배경',
    quote: '사용자의 디지털 활용 능력 차이에 따른 정보 양극화',
    solves: ['메뉴를 몰라도 시작하는 업무 시나리오 카드', '질문 언어를 자동 인식하는 다국어 답변', '웹 접근성 준수 · 키보드 · 스크린리더 지원'],
    screens: [{ label: 'AI 상담', to: '/chat' }],
    req: '추진내용 다국어 · COR-003',
  },
  {
    icon: MessageSquareHeart, title: '일방향 정보 제공', source: 'RFP Ⅰ-2 추진배경',
    quote: '일방향 정보 제공으로 양방향 맞춤 서비스 부재',
    solves: ['이전 대화를 기억하는 멀티턴 상담', '대화 맥락에 맞춘 추천 질문 · 정보 내비게이션', '답변별 의견을 모아 조치까지 관리'],
    screens: [{ label: 'AI 상담', to: '/chat' }, { label: '사용자 피드백', to: '/admin/feedback' }],
    req: 'SFR-004',
  },
  {
    icon: PhoneOff, title: '전화 등 아날로그 문의', source: 'RFP Ⅰ-2 추진배경',
    quote: '전화 등 아날로그 방식에서 데이터 기반 소통형 AI 플랫폼 전환',
    solves: ['선석 · 혼잡도 · 대기시간을 예측해 미리 보여주는 대시보드', 'AIS 두절 · 항로 이탈 이상탐지 알림', '입항신고서 같은 서식을 자동 분류 · 추출'],
    screens: [{ label: '스케줄 예측', to: '/schedule' }, { label: '서식 어시스턴트', to: '/forms' }],
    req: 'SFR-005 · SFR-006',
  },
  {
    icon: ShieldCheck, title: 'AI 신뢰성 · 보안', source: 'RFP Ⅰ-3 추진내용',
    quote: 'RAG 기반의 신뢰성 확보 · 데이터 보안 및 개인정보 보호',
    solves: ['근거 범위 밖 답변을 막는 환각 방지 가드레일', '외부 LLM 전송 전 개인정보 자동 비식별화', 'RAG 품질 · 예측 모델 성능을 상시 평가'],
    screens: [{ label: 'RAG 성능 평가', to: '/admin/rag' }, { label: 'AI 모델 관리', to: '/admin/models' }, { label: '모니터링', to: '/admin' }],
    req: 'SFR-001 · SFR-003 · PER-003 · SER-006',
  },
]

const APPS: { name: string; who: string; auth: string; screens: { icon: LucideIcon; label: string; to: string; desc: string }[] }[] = [
  {
    name: '이용자 앱', who: '대국민 · 항만이해관계자', auth: '홈페이지 비로그인 · PortWise SSO',
    screens: [
      { icon: MessagesSquare, label: 'AI 상담', to: '/chat', desc: '근거 기반 대화형 AI · 시나리오 · 다국어' },
      { icon: Ship, label: '스케줄 예측', to: '/schedule', desc: '선석 타임라인 · 혼잡도 예측 · 이상탐지' },
      { icon: FileScan, label: '서식 어시스턴트', to: '/forms', desc: '서식 자동 분류 · 추출 · 마스킹 · 내보내기' },
    ],
  },
  {
    name: '관리자 앱', who: '울산항만공사 담당자', auth: '관리자 인증 · 내부망',
    screens: [
      { icon: Activity, label: '모니터링', to: '/admin', desc: '이용 통계 · 응답 성능 · 리소스 · 보안' },
      { icon: Gauge, label: 'RAG 성능 평가', to: '/admin/rag', desc: '다차원 지표 · 저하 알림 · 채점 근거' },
      { icon: BrainCircuit, label: 'AI 모델 관리', to: '/admin/models', desc: 'LLM 선정 근거 · 보안 적합성 · 드리프트' },
      { icon: MessageSquareHeart, label: '사용자 피드백', to: '/admin/feedback', desc: '만족도 · 의견 조치 관리' },
      { icon: Database, label: '데이터·지식 관리', to: '/admin/data', desc: '파이프라인 · 지식그래프 · 매뉴얼' },
    ],
  },
]

const COVERAGE: { id: string; name: string; where: string; to: string; evidence: string }[] = [
  { id: 'SFR-001', name: 'AI 모델 선정 및 도입', where: 'AI 모델 관리 · 스케줄 예측', to: '/admin/models', evidence: 'LLM 후보 비교표, 보안 적합성, LSTM·GRU·TFT 비교' },
  { id: 'SFR-002', name: 'AI 대상 데이터 수집·정제·전처리', where: '데이터·지식 관리', to: '/admin/data', evidence: '6단계 파이프라인, 동기화 주기, 매뉴얼 업로드' },
  { id: 'SFR-003', name: 'RAG 구축', where: 'AI 상담 · 데이터·지식 관리', to: '/chat', evidence: '근거 범위 표시, 지식그래프 경로, 시맨틱 캐시 응답' },
  { id: 'SFR-004', name: '생성형 AI 검색 서비스', where: 'AI 상담', to: '/chat', evidence: '스트리밍, 멀티턴, 추천 질문, 이력 관리, 피드백, 통합검색 연계' },
  { id: 'SFR-005', name: '항만 스케줄 예측 서비스', where: '스케줄 예측', to: '/schedule', evidence: '선석 타임라인, 혼잡도, 예측·실제 오차, 이상탐지' },
  { id: 'SFR-006', name: '항만업무지원 AI 어시스턴트', where: '서식 어시스턴트', to: '/forms', evidence: '서식 자동 분류, 신뢰도·오류 메시지, Excel·PDF' },
  { id: 'SFR-007', name: '클라우드 기반 AI 서비스', where: '모니터링', to: '/admin', evidence: '리소스 실시간 모니터링, CSAP, 전송구간 암호화' },
  { id: 'PER-001', name: '응답속도 및 오류 응답시간', where: 'AI 상담 · 모니터링', to: '/chat', evidence: '응답 시간 표시, 5초 지연 안내, P95 기준선' },
  { id: 'PER-003', name: 'AI 성능 요구사항', where: 'RAG 성능 평가 · AI 모델 관리', to: '/admin/rag', evidence: '적합성·재현율·일관성, 채점 근거, 드리프트 탐지' },
  { id: 'SIR-001', name: '사용자 인터페이스', where: '전체 화면', to: '/chat', evidence: '반응형, 용어 일관성, 개인정보 미노출' },
  { id: 'SIR-002', name: '시스템 인터페이스', where: 'AI 상담 · 스케줄 예측', to: '/chat', evidence: '범위 밖 질문 시 홈페이지 통합검색 연계, PortWise API' },
  { id: 'SER-006', name: '개인정보 보호', where: 'AI 상담 · 서식 · 모니터링', to: '/forms', evidence: '입력·문서 개인정보 자동 마스킹, 권한자만 표시' },
  { id: 'COR-003', name: '웹 호환성 및 접근성', where: '전체 화면', to: '/chat', evidence: '키보드 이동, 스크린리더 알림, 4개 언어' },
]

const EFFECTS = [
  { icon: Target, title: '울산항 정보 접근성 향상 · 자가해결률 상승', how: '사용료 규정 등을 근거와 함께 즉시 답하고, 답할 수 없으면 통합검색으로 이어 줍니다.', to: '/chat' },
  { icon: Users, title: '문의·검색 중심에서 AI 질의응답으로 전환', how: '전화 문의 대신 대화로 묻고, 추천 질문으로 필요한 정보까지 안내합니다.', to: '/chat' },
  { icon: Ship, title: '선석·혼잡도 예측 서비스로 UX 혁신', how: '대기시간과 혼잡을 미리 보여주고 예측 정확도를 투명하게 공개합니다.', to: '/schedule' },
]

export default function OverviewPage() {
  return (
    <div className="ov">
      <header className="ov-top">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark"><BrandMark /></span>
          울산항 정보공유 AI 서비스
        </div>
        <div className="row">
          <Link to="/entry" className="btn"><Route size={15} />진입 경로</Link>
          <Link to="/chat" className="btn">이용자 앱<ArrowRight size={15} /></Link>
          <Link to="/admin" className="btn">관리자 앱<ArrowRight size={15} /></Link>
        </div>
      </header>

      <main className="ov-main">
        <section className="ov-hero">
          <p className="ov-eyebrow">울산항 정보공유 AI 서비스 구축 PoC · 제안 화면</p>
          <h1>RFP가 짚은 과제를 화면으로 어떻게 해결하는지</h1>
          <p className="ov-lead">발주처 과제 다섯 가지를 해결 방식, 실제 화면, 요구사항 ID로 연결했습니다. 각 화면에서 <b>제안 포인트</b>를 켜면 화면 요소마다 같은 근거가 번호로 표시됩니다.</p>
          <div className="ov-facts">
            <div><span>사업 대상</span><b>대표홈페이지 · PortWise</b></div>
            <div><span>사업 기간</span><b>계약 후 6개월</b></div>
            <div><span>제안 화면</span><b>이용자 3 · 관리자 5</b></div>
            <div><span>화면 반영 요구사항</span><b>{COVERAGE.length}건</b></div>
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">발주처 과제와 해결 방식</h2>
          <div className="ov-pains">
            {PAINS.map((p) => (
              <article key={p.title} className="ov-pain card">
                <div className="ov-pain-problem">
                  <span className="icon-tile tile-red"><p.icon size={16} /></span>
                  <b>{p.title}</b>
                  <p className="ov-quote"><Quote size={13} />{p.quote}</p>
                  <span className="ov-source">{p.source}</span>
                </div>
                <div className="ov-arrow" aria-hidden><ArrowRight size={18} /></div>
                <div className="ov-pain-solve">
                  <span className="ov-label">우리의 해결</span>
                  <ul>{p.solves.map((s) => <li key={s}><CircleCheck size={15} />{s}</li>)}</ul>
                </div>
                <div className="ov-pain-where">
                  <span className="ov-label">확인할 화면</span>
                  <div className="ov-links">{p.screens.map((s) => <Link key={s.to} to={s.to} className="ov-link">{s.label}<ArrowRight size={14} /></Link>)}</div>
                  <span className="ov-req">{p.req}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">이용자는 어디서 들어오나요</h2>
          <Link to="/entry" className="card ov-entry">
            <span className="ov-entry-lanes">
              <span><Globe2 size={15} /><b>대표홈페이지</b><span>챗봇 버튼 · 비로그인</span></span>
              <span><Ship size={15} /><b>PortWise</b><span>AI 서비스 메뉴 · SSO</span></span>
              <span><Building2 size={15} /><b>공사 업무망</b><span>관리자 콘솔 · 관리자 인증</span></span>
            </span>
            <span className="ov-link">진입 경로 자세히<ArrowRight size={14} /></span>
          </Link>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">화면 구성</h2>
          <div className="grid cols-2">
            {APPS.map((a) => (
              <div key={a.name} className="card">
                <div className="card-header">
                  <div className="stack-sm" style={{ gap: 2 }}>
                    <h3 className="card-title">{a.name}</h3>
                    <p className="card-sub">{a.who} · {a.auth}</p>
                  </div>
                </div>
                <ul className="ov-screens">
                  {a.screens.map((s) => (
                    <li key={s.to}>
                      <Link to={s.to} className="ov-screen">
                        <span className="icon-tile"><s.icon size={16} /></span>
                        <span className="ov-screen-text"><b>{s.label}</b><span>{s.desc}</span></span>
                        <ArrowRight size={15} className="faint" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">요구사항 반영 현황</h2>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">RFP 요구사항별 화면 반영 위치</caption>
                <thead><tr><th>ID</th><th>요구사항</th><th>반영 화면</th><th>화면에서 확인할 요소</th><th /></tr></thead>
                <tbody>
                  {COVERAGE.map((c) => (
                    <tr key={c.id}>
                      <td className="strong num">{c.id}</td>
                      <td>{c.name}</td>
                      <td className="muted">{c.where}</td>
                      <td className="wrap" style={{ minWidth: 280 }}>{c.evidence}</td>
                      <td className="right"><Link to={c.to} className="btn btn-sm">보기<ArrowRight size={13} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="ov-section">
          <h2 className="ov-h2">RFP 기대효과와 연결</h2>
          <div className="grid cols-3">
            {EFFECTS.map((e) => (
              <Link key={e.title} to={e.to} className="card ov-effect">
                <span className="icon-tile tile-brand"><e.icon size={16} /></span>
                <b>{e.title}</b>
                <p>{e.how}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="ov-foot"><Lightbulb size={14} />화면 데이터는 모두 예시이며, 수치·규정은 실제 공사 자료로 대체됩니다.</p>
      </main>
    </div>
  )
}
