import { Link } from 'react-router-dom'
import { Globe, LayoutDashboard, MonitorSmartphone, Ticket, ArrowRight } from 'lucide-react'

const scenarios = [
  { no: 1, title: '유료회원 선예매', steps: '홈페이지 → 로그인(demo) → <빨간 버스는 어디로 가나요> → 멤버십 선예매 → 좌석·권종 선택 → 결제 → 알림톡 수신', to: '/site/login' },
  { no: 2, title: '비회원 → 로그인 후 예매 이어하기', steps: '공연 선택 후 예매 클릭 → 로그인 → 선택했던 공연 예매로 바로 복귀 (SFR-TC-008)', to: '/site/performances' },
  { no: 3, title: '시즌 패키지 예매', steps: '패키지 예매 → 3편 공연별 회차·좌석 지정 → 패키지 할인 일괄 결제', to: '/site/package' },
  { no: 4, title: '부분 취소', steps: '마이페이지 → 예매확인/취소 → 3매 중 1매만 취소 → 취소수수료 자동 계산', to: '/site/mypage' },
  { no: 5, title: '현장 판매·발권·검표', steps: 'POS → 회차 선택 → 좌석 직접 선택 → 권종 → 결제 → 티켓 출력(QR) → 검표', to: '/pos' },
  { no: 6, title: '공연 등록 → 홈페이지 자동 반영', steps: '관리자 → 공연관리 → 신규 등록 → 판매중 저장 → 홈페이지 메인에 즉시 노출 (SFR-TC-014)', to: '/admin/performances' },
  { no: 7, title: '정산·통합전산망', steps: '관리자 → 정산관리(기획사 수수료) → KOPIS 전송 모니터링 → 실패건 재전송', to: '/admin/settlement' },
  { no: 8, title: 'CRM 타겟 마케팅', steps: '관리자 → 회원·CRM → 조건(관람이력·연령·지역) 타겟팅 → 쿠폰 일괄 발급/알림톡 발송', to: '/admin/crm' },
]

export default function Launcher() {
  return (
    <main className="min-h-[calc(100vh-36px)] bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-sm font-semibold text-sun-300">국립어린이청소년극단 홈페이지 및 티켓예매시스템 구축</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">기능 시연 프로토타입</h1>
        <p className="mt-4 max-w-2xl text-white/80">
          제안요청서의 3개 사용자 인터페이스(홈페이지·모바일 예매 / 관리자 TMS·CMS / 현장판매 POS)를 실제로 조작해 볼 수 있습니다.
          모든 화면은 하나의 데이터를 공유하므로, 홈페이지에서 예매하면 관리자와 POS에 즉시 반영됩니다.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { to: '/site', icon: Globe, t: '홈페이지 · 모바일 예매', d: '공연안내, 일정, 좌석선택 예매, 패키지, 유료 멤버십, 마이페이지, 웹진·아카이브, 국/영문', tag: 'SFR-HP · SFR-PM', hint: '데모 계정: demo (나무 멤버십) / teen (청소년)' },
            { to: '/admin', icon: LayoutDashboard, t: '관리자 (TMS · CMS)', d: '공연·회차·선예매 등록, 좌석도 편집, 예매/발권, 정산, 판매보고서, 통합전산망, CRM, 게시판·팝업', tag: 'SFR-TC · SFR-HP-003', hint: '2차 인증 코드: 아무 6자리' },
            { to: '/pos', icon: MonitorSmartphone, t: '현장판매 · 발권 POS', d: '매표소 현장판매, 예매티켓 발권, 티켓 출력(QR), 검표 입장 처리, 창구 마감', tag: 'SFR-TC-010', hint: '매표소 PC/노트북 전체화면 최적화' },
          ].map(c => (
            <Link key={c.to} to={c.to} className="group rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur transition hover:bg-white hover:text-ink">
              <c.icon className="text-sun-300 group-hover:text-brand-600" size={28} />
              <p className="mt-4 text-xs font-semibold text-white/60 group-hover:text-brand-600">{c.tag}</p>
              <h2 className="mt-1 text-xl font-bold">{c.t}</h2>
              <p className="mt-2 text-sm text-white/75 group-hover:text-muted">{c.d}</p>
              <p className="mt-4 text-xs text-white/60 group-hover:text-muted">{c.hint}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">열기 <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>

        <h2 className="mt-14 flex items-center gap-2 text-lg font-bold"><Ticket size={18} className="text-sun-300" /> 추천 시연 시나리오</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {scenarios.map(s => (
            <li key={s.no}>
              <Link to={s.to} className="flex h-full gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sun-400 text-sm font-extrabold text-ink">{s.no}</span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/70">{s.steps}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-xs text-white/50">※ 시연 기준일 2026.10.05 · 결제(PG)·본인인증(PASS)·문자 발송·통합전산망 전송은 모의 처리됩니다. 우측 하단 말풍선 버튼에서 발송된 알림톡/문자를 확인할 수 있습니다.</p>
      </div>
    </main>
  )
}
