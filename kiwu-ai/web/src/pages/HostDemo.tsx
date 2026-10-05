import { Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Wordmark } from "../components/Logo";
import { ChatWidget } from "../widget/ChatWidget";

// 기존 홈페이지(https://www.kiwu.ac.kr/ko/index.do) 위에 챗봇이 탑재된 모습을 보여주는 미리보기 페이지.
// - PC(lg 이상): 실제 홈페이지 메인 화면 캡처를 배경으로 사용 (제안서·예시안 캡처용, 1920×1080 창에서 원본과 동일 비율)
// - 모바일: 레이아웃 참고용 모형
// 실제 탑재 시에는 ChatWidget만 스크립트로 삽입됩니다.

const GNB = [
  "대학안내",
  "총장실",
  "입학안내",
  "학과안내",
  "학사안내",
  "대학생활",
  "경인홍보",
];
const QUICK = [
  "입학안내",
  "학사일정",
  "장학안내",
  "셔틀버스",
  "도서관",
  "ESG 교육경영",
];
const NOTICES = [
  ["2026학년도 2학기 ESG 교육경영 실천 우수부서 선정 안내", "2026.09.25"],
  ["2027학년도 신입생 수시모집 원서접수 안내", "2026.09.19"],
  ["2026학년도 2학기 교내 장학금 신청 안내", "2026.09.12"],
  ["인천 지역 중소기업 ESG 역량강화 특강 개최", "2026.09.05"],
];

export default function HostDemo() {
  return (
    <>
      {/* PC: 실제 홈페이지 캡처 (2026-09-30, 메인 비주얼 'AI 선도대학' 장면) */}
      <div
        className="relative hidden min-h-dvh overflow-hidden lg:block"
        style={{
          background: "linear-gradient(90deg, #4d473a, #615951 50%, #3c3e40)",
        }}
      >
        <img
          src="/mock/kiwu-home-pc.jpg"
          alt="경인여자대학교 홈페이지 메인 화면"
          draggable={false}
          className="block w-full select-none [mask-image:linear-gradient(to_bottom,#000_94%,transparent)]"
        />
      </div>

      <div className="min-h-dvh bg-white lg:hidden">
        <div className="bg-ink px-4 py-2 text-center text-xs text-white/80">
          <strong className="text-white">탑재 미리보기</strong> · 아래 홈페이지
          영역은 모형입니다. 우측 하단 버튼으로 챗봇을 열어보세요.
          <span className="ml-2 inline-flex gap-2">
            <Link
              to="/chat"
              className="underline underline-offset-2 hover:text-white"
            >
              전체화면 챗봇
            </Link>
            <Link
              to="/admin"
              className="underline underline-offset-2 hover:text-white"
            >
              관리자 콘솔
            </Link>
          </span>
        </div>

        <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-4">
            <Wordmark />
            <nav aria-label="주 메뉴" className="hidden flex-1 lg:block">
              <ul className="flex justify-center gap-10 text-[17px] font-bold">
                {GNB.map((m) => (
                  <li key={m}>
                    <a href="#" className="hover:text-brand-strong">
                      {m}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <button
                className="grid size-10 place-items-center rounded-full hover:bg-canvas"
                aria-label="검색"
              >
                <Search className="size-5" />
              </button>
              <button
                className="grid size-10 place-items-center rounded-full hover:bg-canvas"
                aria-label="전체 메뉴"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand-strong to-brand">
            <div className="mx-auto max-w-7xl px-4 py-20 text-white sm:py-28">
              <p className="text-sm font-medium tracking-widest text-white/80">
                KYUNGIN WOMEN'S UNIVERSITY
              </p>
              <h2 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">
                감동+대학
                <br />
                경인여자대학교
              </h2>
              <p className="mt-5 max-w-md text-white/85">
                지역과 함께 성장하는 ESG 교육경영, AI 선도대학으로 나아갑니다.
              </p>
            </div>
            <div
              aria-hidden
              className="absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10"
            />
            <div
              aria-hidden
              className="absolute top-10 right-40 size-40 rounded-full bg-white/10"
            />
          </section>

          <section className="relative z-[1] mx-auto -mt-10 max-w-7xl px-4">
            <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-lg sm:grid-cols-6">
              {QUICK.map((q) => (
                <li key={q} className="bg-white">
                  <a
                    href="#"
                    className="flex h-24 items-center justify-center text-sm font-bold hover:text-brand-strong"
                  >
                    {q}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xl font-bold">공지사항</h3>
              <ul className="divide-y divide-line border-y border-line">
                {NOTICES.map(([t, d]) => (
                  <li
                    key={t}
                    className="flex justify-between gap-4 py-3.5 text-[15px]"
                  >
                    <a href="#" className="truncate hover:underline">
                      {t}
                    </a>
                    <span className="shrink-0 text-sm text-ink-3">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-canvas p-8">
              <p className="text-sm font-bold text-esg-e">ESG 교육경영</p>
              <h3 className="mt-2 text-2xl font-bold">
                지속가능한 내일을 위한
                <br />
                경인여대의 약속
              </h3>
              <p className="mt-3 text-ink-2">
                ESG 헌장과 추진체계를 바탕으로 환경·사회·지배구조 전 영역에서
                실천합니다.
              </p>
              <div className="mt-6 flex gap-2">
                {[
                  ["E", "환경", "bg-esg-e"],
                  ["S", "사회", "bg-esg-s"],
                  ["G", "지배구조", "bg-esg-g"],
                ].map(([k, v, c]) => (
                  <span
                    key={k}
                    className="flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 text-sm font-medium"
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full font-bold text-white ${c}`}
                    >
                      {k}
                    </span>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-[#2f2f2f] px-4 py-10 text-sm text-white/60">
          <div className="mx-auto max-w-7xl">
            <Wordmark light />
            <p className="mt-3">
              인천광역시 계양구 계양산로 63 · 경인여자대학교
            </p>
            <p className="mt-1">
              © Kyungin Women's University. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      <ChatWidget />
    </>
  );
}
