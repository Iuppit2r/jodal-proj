import { Link } from 'react-router-dom'
import { Accessibility, Baby, Banknote, CreditCard, Ear, Eye, Hand, Landmark, LogIn, Search, Smartphone, Sofa, Ticket, Armchair, Users, Wallet } from 'lucide-react'
import PageHeader from '../PageHeader'
import { ticketTypes, tiers } from '../../data/mock'
import { SUPPORT_TABS } from './Faq'
import { Section, SectionTitle } from './ui'

const STEPS = [
  { icon: Search, t: '공연 선택', d: '공연·예매 메뉴에서 관람할 공연을 고릅니다.' },
  { icon: LogIn, t: '로그인', d: '회원 로그인 (선택한 공연은 로그인 후에도 유지돼요)' },
  { icon: Armchair, t: '날짜·회차·좌석', d: '달력에서 날짜와 회차를 고르고 좌석을 선택합니다.' },
  { icon: Ticket, t: '권종·할인', d: '할인 권종과 쿠폰·예매권을 적용합니다.' },
  { icon: CreditCard, t: '결제', d: '신용카드·간편결제·가상계좌로 결제합니다.' },
  { icon: Smartphone, t: '모바일 티켓', d: '알림톡과 마이페이지에서 QR 티켓을 확인합니다.' },
]
const PAY = [
  { icon: CreditCard, t: '신용카드', d: '국내 전 카드사 · 5만원 이상 할부 가능' },
  { icon: Wallet, t: '간편결제', d: '카카오페이 · 네이버페이 · 토스페이' },
  { icon: Landmark, t: '가상계좌', d: '예매 익일 23:59까지 미입금 시 자동 취소' },
  { icon: Banknote, t: '현장 결제', d: '매표소 현금·카드 (공연 1시간 전부터)' },
]
const FEES: [string, string, boolean?][] = [
  ['예매 당일 자정까지', '없음 (전액 환불)', true],
  ['관람일 10일 전까지', '없음 (전액 환불)', true],
  ['관람일 9일 ~ 7일 전', '장당 1,000원 (티켓금액의 10% 한도)'],
  ['관람일 6일 ~ 3일 전', '티켓금액의 10%'],
  ['관람일 2일 ~ 1일 전', '티켓금액의 30%'],
  ['관람 당일', '취소·변경 불가'],
]
const ACCESS = [
  { icon: Accessibility, t: '휠체어석', d: '백성희장민호극장 4석 · 소극장 판 2석. 좌석 선택 화면의 주황색 좌석이며, 동반 1인석이 함께 안내됩니다.', c: 'bg-sun-300/40' },
  { icon: Hand, t: '수어통역', d: '지정 회차에 무대 왼편 수어통역사가 배치됩니다. B~E열 왼편 좌석을 추천합니다.', c: 'bg-brand-50' },
  { icon: Ear, t: '음성해설', d: '시각장애 관객을 위해 무대·움직임을 해설하는 수신기를 무료로 대여해 드립니다. (신분증 지참)', c: 'bg-mint-400/20' },
  { icon: Sofa, t: '릴랙스드 퍼포먼스', d: '조명·음향을 완화하고 공연 중 자유로운 출입과 소리·움직임을 허용하는 회차입니다.', c: 'bg-coral-400/20' },
  { icon: Eye, t: '한글자막', d: '청소년극은 전 회차 한글자막을 제공하며, 자막이 잘 보이는 좌석을 안내해 드립니다.', c: 'bg-paper' },
  { icon: Baby, t: '유모차·수유실', d: '로비에 유모차 보관소와 수유실, 기저귀 교환대가 마련되어 있습니다.', c: 'bg-paper' },
]

export default function Guide() {
  const types = ticketTypes.filter(t => t.active && t.id !== 't-inv')
  const tierName = (id?: string) => tiers.find(t => t.id === id)?.name
  return (
    <>
      <PageHeader crumbs={['고객지원', '예매·취소 안내']} title="예매·취소 안내" desc="예매 방법부터 취소 수수료, 할인 혜택, 관람 정책과 접근성 서비스까지 안내합니다." tabs={SUPPORT_TABS} />
      <Section className="space-y-16">
        <nav aria-label="페이지 내 바로가기" className="flex flex-wrap gap-2 text-sm">
          {[['steps', '예매 방법'], ['pay', '결제수단'], ['cancel', '취소·환불'], ['discount', '할인'], ['group', '단체관람'], ['age', '관람 연령'], ['access', '접근성 서비스']].map(([id, l]) => (
            <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
              className="rounded-full border border-line px-3 py-1.5 font-semibold text-muted hover:border-brand-500 hover:text-brand-600 hover:underline">{l}</a>
          ))}
        </nav>

        <section aria-labelledby="steps">
          <SectionTitle id="steps" sub="홈페이지·모바일 모두 같은 순서로 예매할 수 있습니다.">예매 방법</SectionTitle>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {STEPS.map(({ icon: I, t, d }, i) => (
              <li key={t} className="relative rounded-2xl bg-paper p-5">
                <span className="absolute right-4 top-3 text-3xl font-black text-brand-100">{i + 1}</span>
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white"><I size={22} /></span>
                <p className="mt-4 font-bold"><span className="sr-only">{i + 1}단계 </span>{t}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6">
            <b>유료회원 선예매</b> — 멤버십 회원은 일반 오픈 3일 전 14시부터 먼저 예매할 수 있습니다. <Link to="/site/membership" className="link-u font-semibold text-brand-600 underline">멤버십 안내</Link>
            <br /><b>예매수수료</b> — 온라인 장당 1,000원 (멤버십 회원·현장 구매 면제) · 온라인 예매는 공연 시작 3시간 전까지 가능합니다.
          </div>
        </section>

        <section aria-labelledby="pay">
          <SectionTitle id="pay">결제수단</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PAY.map(({ icon: I, t, d }) => (
              <li key={t} className="card flex gap-3 p-5"><I size={24} className="shrink-0 text-brand-600" aria-hidden /><div><p className="font-bold">{t}</p><p className="mt-1 text-xs text-muted">{d}</p></div></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">※ 문화비 소득공제 대상 공연은 결제 시 자동 반영되며, 현금영수증은 결제 화면 또는 마이페이지에서 신청할 수 있습니다.</p>
        </section>

        <section aria-labelledby="cancel">
          <SectionTitle id="cancel" sub="취소는 마이페이지 › 예매확인/취소에서 할 수 있으며, 여러 장 중 일부만 취소할 수도 있습니다.">취소 수수료</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-t-2 border-ink text-sm">
              <caption className="sr-only">취소 시점별 취소 수수료 안내</caption>
              <thead><tr className="bg-paper"><th scope="col" className="border-b border-line px-4 py-3 text-left">취소 시점</th><th scope="col" className="border-b border-line px-4 py-3 text-left">취소 수수료</th></tr></thead>
              <tbody>
                {FEES.map(([w, fee, free]) => (
                  <tr key={w} className="border-b border-line">
                    <th scope="row" className="px-4 py-3 text-left font-semibold">{w}</th>
                    <td className="px-4 py-3">{free ? <span className="chip bg-mint-500 text-white">무료</span> : null} <span className={fee.includes('불가') ? 'font-bold text-coral-500' : ''}>{fee}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            <li>· 예매수수료는 예매 당일 취소 시에만 환불됩니다.</li>
            <li>· 환불은 결제수단에 따라 3~5영업일 소요되며, 가상계좌는 환불계좌 입력 후 처리됩니다.</li>
            <li>· 공연 주최 측 사정으로 공연이 취소된 경우 수수료 없이 전액 환불됩니다.</li>
          </ul>
        </section>

        <section aria-labelledby="discount">
          <SectionTitle id="discount" sub="할인은 중복 적용되지 않으며, 증빙이 필요한 권종은 공연 당일 매표소에서 확인합니다.">할인 권종</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-t-2 border-ink text-sm">
              <caption className="sr-only">할인 권종별 할인율, 대상 및 증빙 여부</caption>
              <thead>
                <tr className="bg-paper">
                  <th scope="col" className="border-b border-line px-4 py-3 text-left">권종</th>
                  <th scope="col" className="border-b border-line px-4 py-3 text-left">할인율</th>
                  <th scope="col" className="border-b border-line px-4 py-3 text-left">대상·조건</th>
                  <th scope="col" className="border-b border-line px-4 py-3 text-left">증빙</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <tr key={t.id} className={t.memberOnly ? 'border-b border-line bg-brand-50/50' : 'border-b border-line'}>
                    <th scope="row" className="px-4 py-3 text-left font-semibold">
                      {t.name}{t.memberOnly && <span className="chip ml-1.5 bg-brand-600 text-white">멤버십 {tierName(t.memberOnly)}</span>}
                    </th>
                    <td className="px-4 py-3 font-bold text-brand-600">{t.discountRate ? `${Math.round(t.discountRate * 100)}%` : '정가'}</td>
                    <td className="px-4 py-3">{t.desc}</td>
                    <td className="px-4 py-3">{t.needsProof ? '필요' : t.memberOnly ? '로그인 확인' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">※ 멤버십 할인 권종은 유료 멤버십 회원이 로그인한 경우에만 선택할 수 있습니다. <Link to="/site/membership" className="link-u underline">멤버십 가입하기</Link> · <Link to="/site/package" className="link-u underline">패키지 할인 보기</Link></p>
        </section>

        <section aria-labelledby="group" className="grid gap-6 rounded-3xl bg-sun-300/25 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <SectionTitle id="group">단체관람 안내</SectionTitle>
            <ul className="space-y-1.5 text-sm leading-6">
              <li><Users size={15} className="mr-1 inline text-brand-600" aria-hidden /><b>대상</b> 20인 이상 학교·유치원·어린이집·지역아동센터·기관</li>
              <li>· 학생 단체 30% 할인, 인솔 교사 2인 무료 (20인당)</li>
              <li>· 평일 11:00 회차 우선 배정 · 관람 2주 전까지 신청</li>
              <li>· 공연 전 ‘극장 에티켓’ 사전 교육 자료(PDF) 제공</li>
              <li>· 문의: 1600-6261 (내선 2번) / 1:1 문의 ‘단체관람’ 유형</li>
            </ul>
          </div>
          <Link to="/site/support/inquiry" className="btn-primary">단체관람 신청하기</Link>
        </section>

        <section aria-labelledby="age">
          <SectionTitle id="age">관람 연령 정책</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['영유아 공연', '24개월 이상 관람 가능. 보호자 동반 필수이며 보호자도 티켓이 필요합니다.'],
              ['어린이 공연', '공연별 권장 연령(만 5세·7세 이상 등)을 지켜주세요. 연령 미만 어린이는 입장이 제한될 수 있습니다.'],
              ['청소년 공연', '만 13세 이상 관람 권장. 신분증(학생증)으로 연령을 확인할 수 있습니다.'],
            ].map(([t, d]) => (
              <div key={t} className="card p-5"><p className="font-bold">{t}</p><p className="mt-2 text-sm leading-6 text-muted">{d}</p></div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">※ 공연 시작 후에는 입장이 제한되며, 지정된 재입장 시간에 안내에 따라 입장할 수 있습니다. (릴랙스드 퍼포먼스 회차 제외)</p>
        </section>

        <section aria-labelledby="access">
          <SectionTitle id="access" sub="모든 관객이 차별 없이 공연을 즐길 수 있도록 다양한 접근성 서비스를 제공합니다.">접근성 서비스</SectionTitle>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACCESS.map(({ icon: I, t, d, c }) => (
              <li key={t} className={`rounded-2xl p-5 ${c}`}>
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"><I size={22} /></span>
                <p className="mt-3 font-bold">{t}</p>
                <p className="mt-1 text-sm leading-6 text-ink/75">{d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/site/schedule" className="btn-outline">접근성 회차 일정 보기</Link>
            <a href="tel:1600-6261" className="btn-ghost">접근성 서비스 사전 예약 1600-6261</a>
          </div>
        </section>
      </Section>
    </>
  )
}
