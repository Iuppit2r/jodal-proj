import type {
  ArchiveItem, Audition, Banner, Booking, Coupon, Faq, Inquiry, KopisLog, Member, MembershipTier,
  Notice, PackageProduct, Performance, Popup, Review, Round, TicketType, Venue, WebzineIssue, AdminUser, AuditLog, Grade,
} from './types'

// 시연 기준일 (오늘)
export const TODAY = '2026-10-05'

// ── 결정적 난수 (새로고침해도 같은 데모 데이터) ──
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
export function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

// ── 공연장 ──
export const venues: Venue[] = [
  {
    id: 'v1', name: '백성희장민호극장', nameEn: 'Baek Seonghee & Jang Minho Theater',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], cols: 16, aisles: [4, 12],
    wheelchair: ['J-1', 'J-2', 'J-15', 'J-16'], address: '서울특별시 용산구 청파로 373',
  },
  {
    id: 'v2', name: '소극장 판', nameEn: 'Small Theater PAN',
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], cols: 12, aisles: [6],
    wheelchair: ['G-1', 'G-12'], address: '서울특별시 용산구 청파로 373',
  },
]

/** 기본 등급 배정: 앞쪽 중앙 R, 나머지 S, 뒤쪽 A, 휠체어석 W */
export function defaultGrade(venue: Venue, seatId: string): Grade {
  if (venue.wheelchair.includes(seatId)) return 'W'
  const [row, colS] = seatId.split('-')
  const r = venue.rows.indexOf(row)
  const c = Number(colS)
  const center = c > venue.cols * 0.2 && c <= venue.cols * 0.8
  if (r < Math.ceil(venue.rows.length * 0.5) && center) return 'R'
  if (r >= venue.rows.length - 2) return 'A'
  return 'S'
}
export const gradeLabel: Record<Grade, string> = { R: 'R석', S: 'S석', A: 'A석', W: '휠체어석' }
export const gradeColor: Record<Grade, string> = { R: '#7c5cff', S: '#2f80ed', A: '#1fb592', W: '#f2994a' }

// ── 공연 ──
export const performances: Performance[] = [
  {
    id: 'p1', code: 'NTCY-2026-07', title: '달을 삼킨 고양이', titleEn: 'The Cat Who Swallowed the Moon',
    subtitle: '2026 어린이극 신작', genre: '음악극', ageLimit: '만 5세 이상', target: '어린이', runtime: 70,
    venueId: 'v1', start: '2026-10-16', end: '2026-11-08', status: '판매중', openAt: '2026-09-15 14:00', presaleAt: '2026-09-12 14:00',
    producer: '국립어린이청소년극단', manager: '김하늘', prices: { R: 30000, S: 25000, A: 20000, W: 20000 },
    palette: ['#1d2b6b', '#ffd23f', '#ff8a73'], motif: 'moon',
    summary: '밤마다 사라지는 달을 찾아 떠나는 고양이 ‘보리’와 친구들의 노래 여행',
    description: '어느 날 밤, 동네 지붕 위에서 달이 사라졌다. 달빛이 없으면 잠들지 못하는 아이들을 위해 길고양이 보리는 달을 찾아 나선다. 라이브 연주와 그림자극이 어우러진 70분의 음악극으로, 어둠을 무서워하는 아이들에게 ‘밤의 아름다움’을 선물한다.',
    credits: [{ role: '작', name: '이소원' }, { role: '연출', name: '박지후' }, { role: '작곡·음악감독', name: '한예린' }, { role: '무대', name: '정다온' }],
    cast: ['김도윤', '서지아', '최민준', '윤하람', '이서진'], tags: ['라이브연주', '그림자극', '가족관람'],
    accessibility: ['수어통역(10/25 14:00)', '음성해설(11/1 11:00)', '릴랙스드 퍼포먼스(10/31 11:00)'],
    feeRate: 0, isRental: false, packageEligible: true, incomeDeduction: true,
  },
  {
    id: 'p2', code: 'NTCY-2026-08', title: '열다섯, 지도에 없는 섬', titleEn: 'Fifteen, an Island Not on the Map',
    subtitle: '청소년극 레퍼토리', genre: '연극', ageLimit: '만 13세 이상', target: '청소년', runtime: 95,
    venueId: 'v2', start: '2026-10-23', end: '2026-11-22', status: '판매중', openAt: '2026-09-22 14:00', presaleAt: '2026-09-19 14:00',
    producer: '국립어린이청소년극단', manager: '이준서', prices: { R: 35000, S: 30000, W: 20000 },
    palette: ['#0f4c5c', '#45d1b0', '#f7f3e3'], motif: 'wave',
    summary: '수학여행 대신 무인도 캠프에 남겨진 다섯 명의 열다섯 살',
    description: '태풍으로 발이 묶인 다섯 명의 중학생. 휴대폰도 어른도 없는 섬에서 그들은 처음으로 서로의 진짜 이름을 부른다. 청소년 창작 워크숍에서 출발한 이야기를 바탕으로, 청소년 관객과 함께 다듬은 2026 레퍼토리.',
    credits: [{ role: '작', name: '정하윤' }, { role: '연출', name: '오세린' }, { role: '드라마투르기', name: '문태오' }],
    cast: ['강유나', '배시우', '장태민', '한소율', '노지환'], tags: ['청소년극', '창작초연', '관객참여'],
    accessibility: ['한글자막 상시', '수어통역(11/8 15:00)'],
    feeRate: 0, isRental: false, packageEligible: true, incomeDeduction: true,
  },
  {
    id: 'p3', code: 'NTCY-2026-09', title: '빨간 버스는 어디로 가나요', titleEn: 'Where Does the Red Bus Go?',
    subtitle: '영유아·가족 인형극', genre: '인형극', ageLimit: '24개월 이상', target: '가족', runtime: 45,
    venueId: 'v2', start: '2026-12-04', end: '2027-01-10', status: '오픈예정', openAt: '2026-10-08 14:00', presaleAt: '2026-10-05 00:00',
    producer: '국립어린이청소년극단', manager: '김하늘', prices: { S: 25000, W: 15000 },
    palette: ['#c8102e', '#fff4e0', '#2a9d8f'], motif: 'bus',
    summary: '아기와 보호자가 함께 타는 45분의 버스 여행',
    description: '종이 상자로 만든 빨간 버스가 동네 구석구석을 달린다. 정류장마다 만나는 작은 친구들과 소리 놀이를 하며, 영유아 관객이 편안하게 움직이고 반응할 수 있도록 설계된 공연이다.',
    credits: [{ role: '구성·연출', name: '윤채원' }, { role: '인형 디자인', name: '임서준' }],
    cast: ['김나래', '한도현'], tags: ['영유아', '인형극', '겨울방학'],
    accessibility: ['릴랙스드 퍼포먼스 전 회차', '유모차 보관'],
    feeRate: 0, isRental: false, packageEligible: true, incomeDeduction: true,
  },
  {
    id: 'p4', code: 'NTCY-2026-10', title: '나무가 된 아이', titleEn: 'The Child Who Became a Tree',
    subtitle: '무용극 | 협력 공연', genre: '무용극', ageLimit: '만 7세 이상', target: '어린이', runtime: 60,
    venueId: 'v1', start: '2027-01-15', end: '2027-02-07', status: '오픈예정', openAt: '2026-11-25 14:00',
    producer: '(주)숲무용단', manager: '이준서', prices: { R: 30000, S: 25000, A: 20000, W: 15000 },
    palette: ['#264653', '#e9c46a', '#8ab17d'], motif: 'tree',
    summary: '움직이지 않기로 결심한 아이, 그리고 계절의 춤',
    description: '말하기 싫은 아이가 어느 날 공원 한가운데 서서 나무가 되기로 한다. 사계절의 변화가 무용수의 몸으로 펼쳐지는 비언어 무용극.',
    credits: [{ role: '안무', name: '최여름' }, { role: '음악', name: '서하준' }],
    cast: ['숲무용단'], tags: ['비언어극', '무용', '대관공연'],
    accessibility: ['음성해설(1/23 11:00)'],
    feeRate: 10, isRental: true, packageEligible: false, incomeDeduction: true,
  },
  {
    id: 'p5', code: 'NTCY-2026-05', title: '새들의 회의', titleEn: 'The Conference of the Birds',
    subtitle: '2026 여름 가족극', genre: '연극', ageLimit: '만 6세 이상', target: '가족', runtime: 75,
    venueId: 'v1', start: '2026-07-24', end: '2026-08-23', status: '판매종료', openAt: '2026-06-20 14:00',
    producer: '국립어린이청소년극단', manager: '김하늘', prices: { R: 30000, S: 25000, A: 20000, W: 20000 },
    palette: ['#3d2c8d', '#ff9f1c', '#cbf3f0'], motif: 'bird',
    summary: '왕을 찾아 떠난 서른 마리 새들의 여정',
    description: '고전 우화를 어린이 눈높이로 다시 쓴 가족극. 관객이 직접 새의 목소리가 되어 여정에 참여한다.',
    credits: [{ role: '각색·연출', name: '박지후' }], cast: ['김도윤', '서지아'], tags: ['고전', '가족극'],
    accessibility: ['수어통역'], feeRate: 0, isRental: false, packageEligible: false, incomeDeduction: true,
  },
  {
    id: 'p6', code: 'NTCY-2027-01', title: '상자 속의 우주', titleEn: 'Universe in a Box',
    subtitle: '렉처 퍼포먼스', genre: '렉처퍼포먼스', ageLimit: '만 10세 이상', target: '청소년', runtime: 80,
    venueId: 'v2', start: '2027-02-12', end: '2027-03-01', status: '임시저장', openAt: '2026-12-10 14:00',
    producer: '국립어린이청소년극단', manager: '오세린', prices: { S: 25000, W: 15000 },
    palette: ['#111827', '#a78bfa', '#f9a8d4'], motif: 'box',
    summary: '과학자와 배우가 함께 여는 질문의 무대',
    description: '천문학자와 배우가 한 무대에서 “우리는 어디에서 왔을까?”를 묻는 렉처 퍼포먼스.',
    credits: [{ role: '구성', name: '문태오' }], cast: ['TBA'], tags: ['과학', '렉처'],
    accessibility: [], feeRate: 0, isRental: false, packageEligible: true, incomeDeduction: true,
  },
]

// ── 회차 자동 생성 (화~금 11:00, 토·일 11:00/14:00/ 청소년극은 19:30) ──
function genRounds(p: Performance): Round[] {
  const out: Round[] = []
  const d = new Date(p.start + 'T00:00:00')
  const end = new Date(p.end + 'T00:00:00')
  let n = 1
  while (d <= end) {
    const dow = d.getDay()
    const ds = d.toISOString().slice(0, 10)
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    void ds
    const times: string[] =
      dow === 1 ? [] :
      p.target === '청소년'
        ? (dow === 0 || dow === 6 ? ['15:00'] : ['19:30'])
        : (dow === 0 || dow === 6 ? ['11:00', '14:00'] : ['11:00'])
    for (const t of times) {
      out.push({ id: `${p.id}-r${n}`, perfId: p.id, date: local, time: t, no: n, active: true, distancing: 'none' })
      n++
    }
    d.setDate(d.getDate() + 1)
  }
  // 접근성 회차 표기
  for (const r of out) {
    const md = `${Number(r.date.slice(5, 7))}/${Number(r.date.slice(8, 10))}`
    const hit = p.accessibility.find(a => a.includes(md) && a.includes(r.time))
    if (hit) r.note = hit.split('(')[0]
  }
  return out
}
export const rounds: Round[] = performances.flatMap(genRounds)

// ── 권종 (SFR-TC-005) ──
export const ticketTypes: TicketType[] = [
  { id: 't-gen', name: '일반', discountRate: 0, desc: '정가', active: true },
  { id: 't-youth', name: '청소년 할인', discountRate: 0.3, desc: '만 24세 이하 (신분증 확인)', needsProof: true, active: true },
  { id: 't-child', name: '어린이 할인', discountRate: 0.3, desc: '초등학생 이하', needsProof: true, active: true },
  { id: 't-dis', name: '장애인 할인', discountRate: 0.5, desc: '1~3급 동반 1인 / 4~6급 본인', needsProof: true, active: true },
  { id: 't-merit', name: '국가유공자 할인', discountRate: 0.5, desc: '동반 1인까지', needsProof: true, active: true },
  { id: 't-multi', name: '다자녀 할인', discountRate: 0.2, desc: '2자녀 이상 가정', needsProof: true, active: true },
  { id: 't-m1', name: '멤버십 새싹 할인', discountRate: 0.1, desc: '새싹 멤버십 회원 본인 포함 2매', memberOnly: 'tier-sprout', active: true },
  { id: 't-m2', name: '멤버십 나무 할인', discountRate: 0.2, desc: '나무 멤버십 회원 본인 포함 4매', memberOnly: 'tier-tree', active: true },
  { id: 't-inv', name: '초대권', discountRate: 1, desc: '관리자/현장 전용', active: true },
]

// ── 유료 멤버십 (SFR-PM) ──
export const tiers: MembershipTier[] = [
  {
    id: 'tier-sprout', name: '새싹', price: 30000, discountRate: 0.1, presale: true, color: '#1fb592',
    benefits: ['전 공연 10% 할인 (2매)', '유료회원 선예매 (일반 오픈 3일 전)', '가입 즉시 5,000원 할인쿠폰', '예매수수료 면제'],
  },
  {
    id: 'tier-tree', name: '나무', price: 60000, discountRate: 0.2, presale: true, color: '#2647c4',
    benefits: ['전 공연 20% 할인 (4매)', '유료회원 선예매 (일반 오픈 3일 전)', '가입 즉시 공연 예매권 1매', '예매수수료 면제', '백스테이지 투어 우선 초대', '시즌북·웹진 인쇄본 배송'],
  },
]

// ── 패키지 (SFR-HP-009, SFR-TC-017) ──
export const packages: PackageProduct[] = [
  {
    id: 'pk1', name: '2026 가을·겨울 시즌 패키지', type: '시즌',
    desc: '하반기 레퍼토리 3편을 한 번에! 지정 3편 모두 관람 시 25% 할인',
    perfIds: ['p1', 'p2', 'p3'], pickCount: 3, discountRate: 0.25, saleStart: '2026-09-15', saleEnd: '2026-11-30', sold: 182, limit: 300,
  },
  {
    id: 'pk2', name: '자유 패키지 (2편 선택)', type: '자유',
    desc: '패키지 대상 공연 중 원하는 2편을 골라 15% 할인',
    perfIds: ['p1', 'p2', 'p3', 'p6'], pickCount: 2, discountRate: 0.15, saleStart: '2026-09-15', saleEnd: '2027-02-28', sold: 241, limit: 500,
  },
]

// ── 회원 ──
export const members: Member[] = [
  {
    id: 'u1', loginId: 'demo', name: '김시연', birth: '1987-04-12', phone: '010-1234-5678', email: 'demo@example.com',
    type: '개인', joinedAt: '2024-03-02', lastLoginAt: '2026-10-04', marketing: true, favorites: ['p2', 'p3'], status: '정상', region: '서울',
    membership: { tierId: 'tier-tree', since: '2026-03-01', until: '2027-02-28', autoRenew: true },
  },
  {
    id: 'u2', loginId: 'teen', name: '박하루', birth: '2011-08-20', phone: '010-2222-3333', email: 'haru@example.com',
    type: '개인', joinedAt: '2025-11-11', lastLoginAt: '2026-09-28', marketing: false, favorites: ['p2'], status: '정상', region: '경기',
  },
]
// 관리자 통계·CRM용 가상 회원 (이름은 무작위 조합)
const LN = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권']
const FN = ['서연', '민준', '하은', '도윤', '지우', '예준', '수아', '시우', '지호', '하린', '주원', '유나', '건우', '채원', '은우', '소율']
const REG = ['서울', '서울', '서울', '경기', '경기', '인천', '부산', '대구', '대전', '광주', '강원', '충북', '전북', '경남']
{
  const rnd = seeded(7)
  for (let i = 3; i <= 160; i++) {
    const y = 1972 + Math.floor(rnd() * 45)
    const child = y > 2012
    const tier = rnd()
    members.push({
      id: `u${i}`, loginId: `user${i}`, name: LN[Math.floor(rnd() * LN.length)] + FN[Math.floor(rnd() * FN.length)],
      birth: `${y}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
      phone: `010-${String(1000 + Math.floor(rnd() * 8999))}-${String(1000 + Math.floor(rnd() * 8999))}`,
      email: `user${i}@example.com`, type: child ? '어린이' : '개인', guardian: child ? '보호자 동의 완료' : undefined,
      joinedAt: `202${3 + Math.floor(rnd() * 4)}-${String(1 + Math.floor(rnd() * 9)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
      lastLoginAt: rnd() < 0.12 ? '2025-06-01' : `2026-${String(5 + Math.floor(rnd() * 5)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
      marketing: rnd() < 0.62, favorites: [], status: '정상', region: REG[Math.floor(rnd() * REG.length)],
      membership: tier < 0.18 ? { tierId: 'tier-tree', since: '2026-03-01', until: '2027-02-28', autoRenew: rnd() < 0.7 }
        : tier < 0.42 ? { tierId: 'tier-sprout', since: '2026-04-01', until: '2027-03-31', autoRenew: rnd() < 0.5 } : undefined,
    })
  }
  for (const m of members) if (m.lastLoginAt < '2025-10-05' && m.id !== 'u1') m.status = '휴면'
}

export const coupons: Coupon[] = [
  { id: 'c1', name: '나무 멤버십 공연 예매권', kind: '예매권', rate: 1, until: '2027-02-28', ownerId: 'u1' },
  { id: 'c2', name: '가을 시즌 오픈 기념 5,000원 할인', kind: '할인쿠폰', amount: 5000, minPrice: 20000, until: '2026-11-30', ownerId: 'u1' },
  { id: 'c3', name: '첫 관람 10% 할인', kind: '할인쿠폰', rate: 0.1, until: '2026-12-31', ownerId: 'u1' },
  { id: 'c4', name: '신규가입 3,000원 할인', kind: '할인쿠폰', amount: 3000, minPrice: 15000, until: '2026-12-31', ownerId: 'u2' },
]

// ── 기존 예매 데이터 생성 (관리자 리포트·정산 시연용) ──
const CH: Booking['channel'][] = ['홈페이지', '홈페이지', '모바일', '모바일', '모바일', '현장', '콜센터', '외부예매처']
const PM: Booking['payMethod'][] = ['신용카드', '신용카드', '신용카드', '간편결제', '간편결제', '가상계좌', '현금']
export function seatIds(v: Venue) {
  return v.rows.flatMap(r => Array.from({ length: v.cols }, (_, i) => `${r}-${i + 1}`))
}
export function buildSeedBookings(): Booking[] {
  const out: Booking[] = []
  const rnd = seeded(2026)
  let seq = 1
  for (const p of performances) {
    if (p.status === '임시저장' || p.status === '오픈예정') continue
    const v = venues.find(x => x.id === p.venueId)!
    const all = seatIds(v)
    const rs = rounds.filter(r => r.perfId === p.id)
    for (const r of rs) {
      // 회차별 점유율: 지난 공연 85~100%, 진행 공연 날짜가 가까울수록 높게
      const past = r.date < TODAY
      const daysAway = (new Date(r.date).getTime() - new Date(TODAY).getTime()) / 864e5
      const occ = past ? 0.82 + rnd() * 0.18 : Math.max(0.25, 0.9 - daysAway * 0.012 + (rnd() - 0.5) * 0.2)
      const pool = all.filter(s => !v.wheelchair.includes(s) || rnd() < 0.3).sort(() => rnd() - 0.5)
      let take = Math.floor(pool.length * occ)
      let idx = 0
      while (take > 0) {
        const n = Math.min(take, 1 + Math.floor(rnd() * 4))
        const picks = pool.slice(idx, idx + n)
        idx += n
        take -= n
        const ch = CH[Math.floor(rnd() * CH.length)]
        const pm = ch === '현장' ? (rnd() < 0.7 ? '신용카드' : '현금') : PM[Math.floor(rnd() * (PM.length - 1))]
        const bookDaysBefore = Math.floor(rnd() * 25)
        const created = new Date(new Date(r.date).getTime() - bookDaysBefore * 864e5)
        const createdStr = created.toISOString().slice(0, 10) < TODAY ? created.toISOString().slice(0, 10) : '2026-10-0' + (1 + Math.floor(rnd() * 5))
        const seats = picks.map(sid => {
          const g = defaultGrade(v, sid)
          const base = p.prices[g] ?? p.prices.S ?? 25000
          const t = rnd()
          const tt = t < 0.55 ? 't-gen' : t < 0.75 ? 't-child' : t < 0.85 ? 't-youth' : t < 0.93 ? 't-m2' : t < 0.97 ? 't-dis' : 't-inv'
          const rate = ticketTypes.find(x => x.id === tt)!.discountRate
          return { seatId: sid, grade: g, ticketTypeId: tt, price: Math.round(base * (1 - rate) / 100) * 100, issued: past || ch === '현장', used: past && rnd() < 0.96 }
        })
        const cancelled = rnd() < 0.05
        const total = seats.reduce((a, s) => a + s.price, 0)
        const id = `T${createdStr.replace(/-/g, '').slice(2)}${String(seq++).padStart(5, '0')}`
        const nm = LN[Math.floor(rnd() * LN.length)] + FN[Math.floor(rnd() * FN.length)]
        out.push({
          id, perfId: p.id, roundId: r.id, userId: rnd() < 0.7 ? `u${3 + Math.floor(rnd() * 150)}` : undefined,
          bookerName: nm, bookerPhone: `010-${String(1000 + Math.floor(rnd() * 8999))}-${String(1000 + Math.floor(rnd() * 8999))}`,
          seats: cancelled ? seats.map(s => ({ ...s, cancelled: true })) : seats,
          payMethod: seats.every(s => s.ticketTypeId === 't-inv') ? '초대' : pm,
          status: cancelled ? '취소완료' : past ? '관람완료' : ch === '현장' ? '발권완료' : '예매완료',
          channel: ch, createdAt: `${createdStr} ${String(9 + Math.floor(rnd() * 13)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`,
          couponDiscount: 0, fee: ch === '현장' ? 0 : 1000 * seats.length, total, logs: [],
        })
      }
    }
  }
  return out
}

// 데모 회원 u1 의 예매 2건 (마이페이지 시연)
export function demoUserBookings(): Booking[] {
  return [
    {
      id: 'T26100100001', perfId: 'p1', roundId: rounds.find(r => r.perfId === 'p1' && r.date === '2026-10-17' && r.time === '14:00')!.id,
      userId: 'u1', bookerName: '김시연', bookerPhone: '010-1234-5678', viewerName: '김시연 외 2인',
      seats: [
        { seatId: 'C-7', grade: 'R', ticketTypeId: 't-m2', price: 24000 },
        { seatId: 'C-8', grade: 'R', ticketTypeId: 't-child', price: 21000 },
        { seatId: 'C-9', grade: 'R', ticketTypeId: 't-child', price: 21000 },
      ],
      payMethod: '신용카드', status: '예매완료', channel: '홈페이지', createdAt: '2026-09-12 14:03',
      couponDiscount: 0, fee: 0, total: 66000, logs: [{ at: '2026-09-12 14:03', msg: '유료회원 선예매 결제 완료 (신용카드)' }],
    },
    {
      id: 'T26092800002', perfId: 'p2', roundId: rounds.find(r => r.perfId === 'p2' && r.date === '2026-10-24')!.id,
      userId: 'u1', bookerName: '김시연', bookerPhone: '010-1234-5678',
      seats: [{ seatId: 'D-5', grade: 'R', ticketTypeId: 't-gen', price: 35000 }],
      payMethod: '가상계좌', status: '입금대기', channel: '모바일', createdAt: '2026-10-04 21:10',
      couponDiscount: 0, fee: 0, total: 35000, vaccount: { bank: '국민은행', no: '940-2026-118842', due: '2026-10-06 23:59' },
      logs: [{ at: '2026-10-04 21:10', msg: '가상계좌 발급' }],
    },
  ]
}

// ── 콘텐츠 ──
export const notices: Notice[] = [
  { id: 'n1', category: '공지', pinned: true, title: '국립어린이청소년극단 독립 출범 및 새 홈페이지 오픈 안내', date: '2026-10-01', views: 3812, body: '국립어린이청소년극단이 국립극단에서 독립하여 새롭게 출범했습니다. 새 홈페이지에서 공연 예매, 패키지, 유료 멤버십을 한 번에 이용하실 수 있습니다. 기존 국립극단 홈페이지 회원은 최초 1회 본인인증 후 그대로 이용 가능합니다.', files: ['출범안내문.pdf'] },
  { id: 'n2', category: '공연', pinned: true, title: '<달을 삼킨 고양이> 수어통역·음성해설 회차 안내', date: '2026-09-25', views: 1290, body: '10월 25일(일) 14시 수어통역, 11월 1일(일) 11시 음성해설 회차가 운영됩니다. 접근성 회차는 휠체어석 및 동반석을 우선 배정합니다.' },
  { id: 'n3', category: '공연', title: '<열다섯, 지도에 없는 섬> 관객과의 대화 일정', date: '2026-09-22', views: 842, body: '10월 31일(토), 11월 14일(토) 공연 종료 후 30분간 창작진과의 대화가 진행됩니다.' },
  { id: 'n4', category: '채용', title: '2026년 하반기 공연기획팀 계약직 채용 공고', date: '2026-09-18', views: 2104, body: '공연기획팀 계약직(1명)을 채용합니다. 접수기간: 2026.9.18 ~ 10.10', files: ['채용공고문.hwp', '입사지원서.hwp'] },
  { id: 'n5', category: '입찰', title: '홈페이지 및 티켓예매시스템 구축 사업 입찰 공고', date: '2026-09-07', views: 1533, body: '국립어린이청소년극단 홈페이지 및 티켓예매시스템 구축 사업 제한경쟁입찰 공고입니다.', files: ['제안요청서.hwp'] },
  { id: 'n6', category: '이벤트', title: '[이벤트] 우리 가족 첫 공연 사진 공모', date: '2026-09-10', views: 977, body: '극장에서 찍은 가족 사진을 보내주세요. 추첨을 통해 50가족에게 시즌 패키지를 드립니다.' },
  { id: 'n7', category: '공지', title: '시스템 점검에 따른 예매 일시 중단 안내 (10/13 02:00~05:00)', date: '2026-09-08', views: 410, body: '안정적인 서비스를 위한 정기 점검이 진행됩니다.' },
  { id: 'n8', category: '공연', title: '단체관람(학교·기관) 신청 안내', date: '2026-09-01', views: 1765, body: '20인 이상 단체관람은 1:1 문의 또는 1600-6261(내선 2번)으로 신청해주세요. 학교 단체는 교사 2인 무료입니다.' },
  { id: 'n9', category: '공지', title: '개인정보처리방침 개정 안내 (2026.10.1 시행)', date: '2026-08-25', views: 288, body: '유료 멤버십 도입에 따라 개인정보 수집 항목이 일부 변경됩니다.' },
  { id: 'n10', category: '공지', title: '여름 가족극 <새들의 회의> 관람후기 이벤트 당첨자 발표', date: '2026-08-30', views: 650, body: '당첨되신 분들께 개별 문자로 안내드렸습니다.' },
  { id: 'n11', category: '채용', title: '2027 청소년 관객 자문단 ‘틴즈 크루’ 모집', date: '2026-08-20', views: 1408, body: '만 13~18세 청소년 20명을 모집합니다.' },
  { id: 'n12', category: '공지', title: '극장 주차 안내 및 대중교통 이용 권장', date: '2026-08-12', views: 932, body: '주차 공간이 협소하오니 대중교통 이용을 부탁드립니다.' },
]

export const webzines: WebzineIssue[] = [
  {
    id: 'w12', vol: 12, year: 2026, season: '가을', title: '밤을 무서워하는 아이들에게', cover: ['#1d2b6b', '#ffd23f', '#ff8a73'],
    articles: [
      { id: 'w12a1', section: '커버스토리', title: '어둠을 무대에 올리는 법 — <달을 삼킨 고양이> 창작노트', author: '박지후(연출)', lead: '아이들은 어둠을 무서워하지만, 동시에 어둠 속에서 가장 많이 상상한다.' },
      { id: 'w12a2', section: '인터뷰', title: '열다섯 살 관객이 대본을 고쳤다', author: '편집팀', lead: '청소년 창작 워크숍 참여자 5명과 나눈 대화.' },
      { id: 'w12a3', section: '리서치', title: '영유아 공연의 ‘릴랙스드’란 무엇인가', author: '연구개발팀', lead: '움직여도 괜찮은 극장을 위한 7가지 원칙.' },
      { id: 'w12a4', section: '극장 사람들', title: '무대감독의 하루', author: '편집팀', lead: '오전 8시, 극장의 불이 켜진다.' },
    ],
  },
  {
    id: 'w11', vol: 11, year: 2026, season: '여름', title: '새들이 회의하는 계절', cover: ['#3d2c8d', '#ff9f1c', '#cbf3f0'],
    articles: [
      { id: 'w11a1', section: '커버스토리', title: '고전을 아이에게 건넨다는 것', author: '박지후', lead: '천 년 전 우화가 2026년 아이들에게 도착하기까지.' },
      { id: 'w11a2', section: '에세이', title: '관객석의 소리', author: '이소원(작가)', lead: '아이들은 공연 중에 말을 한다. 그게 좋다.' },
    ],
  },
  { id: 'w10', vol: 10, year: 2026, season: '봄', title: '처음 극장에 온 날', cover: ['#ef476f', '#ffd166', '#06d6a0'], articles: [{ id: 'w10a1', section: '커버스토리', title: '첫 관람의 기억', author: '편집팀', lead: '당신의 첫 극장은 어디였나요?' }] },
  { id: 'w9', vol: 9, year: 2025, season: '겨울', title: '연극이 끝나고 난 뒤', cover: ['#22223b', '#c9ada7', '#f2e9e4'], articles: [{ id: 'w9a1', section: '커버스토리', title: '공연 이후의 대화', author: '편집팀', lead: '관객과의 대화 10년 기록.' }] },
  { id: 'w8', vol: 8, year: 2025, season: '가을', title: '열여섯의 목소리', cover: ['#006d77', '#83c5be', '#ffddd2'], articles: [{ id: 'w8a1', section: '커버스토리', title: '청소년극은 누구의 것인가', author: '연구개발팀', lead: '청소년 관객 설문 1,200명 분석.' }] },
]

export const archive: ArchiveItem[] = [
  { id: 'a1', year: 2011, title: '소년이 그랬다', director: '남인우', writer: '한현주', cast: ['청소년 배우 앙상블'], venue: '소극장 판', kind: '공연기록', desc: '어린이청소년극연구소 출범작. 청소년 범죄와 책임을 다룬 창작 청소년극.', palette: ['#1b263b', '#e0e1dd', '#778da9'], motif: 'box' },
  { id: 'a2', year: 2012, title: '레슬링 시즌', director: '서재형', writer: '로리 브룩스', cast: ['청소년 배우 앙상블'], venue: '소극장 판', kind: '공연기록', desc: '레슬링 선수인 고등학생들의 소문과 진실을 다룬 해외 청소년극 국내 초연.', palette: ['#9d0208', '#ffba08', '#370617'], motif: 'wave' },
  { id: 'a3', year: 2012, title: '빨간버스', director: '이성열', writer: '김민정', cast: ['앙상블'], venue: '소극장 판', kind: '공연기록', desc: '청소년의 일상을 버스라는 공간에 담은 작품.', palette: ['#c8102e', '#fff4e0', '#2a9d8f'], motif: 'bus' },
  { id: 'a4', year: 2013, title: '노란 달 YELLOW MOON', director: '서충식', writer: '데이비드 그레이그', cast: ['앙상블'], venue: '백성희장민호극장', kind: '공연기록', desc: '스코틀랜드 청소년극의 국내 초연. 도망친 두 십대의 여정.', palette: ['#0b132b', '#ffd23f', '#3a506b'], motif: 'moon' },
  { id: 'a5', year: 2014, title: '타조 소년들', director: '김미란', writer: '키스 사가', cast: ['앙상블'], venue: '백성희장민호극장', kind: '공연기록', desc: '친구의 유골을 들고 여행을 떠난 세 소년의 이야기. 세계 초연.', palette: ['#283618', '#dda15e', '#fefae0'], motif: 'bird' },
  { id: 'a6', year: 2014, title: '햄스터 살인사건', director: '박해성', writer: '청소년극 릴-레이Ⅱ', cast: ['앙상블'], venue: '소극장 판', kind: '공연기록', desc: '국립극단 청소년극 릴-레이Ⅱ 참여작.', palette: ['#3c096c', '#ff9e00', '#e0aaff'], motif: 'star' },
  { id: 'a7', year: 2026, title: '새들의 회의', director: '박지후', writer: '박지후 각색', cast: ['김도윤', '서지아'], venue: '백성희장민호극장', kind: '영상', desc: '2026 여름 가족극 전막 영상 (교육용 공개).', palette: ['#3d2c8d', '#ff9f1c', '#cbf3f0'], motif: 'bird' },
  { id: 'a8', year: 2025, title: '어린이청소년극 관객 연구 2025', director: '-', writer: '연구개발팀', cast: [], venue: '-', kind: '연구·발간자료', desc: '관객 설문 및 인터뷰 기반 연구 보고서 (PDF, 148p).', palette: ['#14213d', '#fca311', '#e5e5e5'], motif: 'box' },
  { id: 'a9', year: 2025, title: '숲속의 작은 극장', director: '윤채원', writer: '윤채원', cast: ['김나래', '한도현'], venue: '소극장 판', kind: '사진', desc: '영유아 공연 무대 사진 48컷.', palette: ['#264653', '#8ab17d', '#e9c46a'], motif: 'tree' },
]

export const auditions: Audition[] = [
  { id: 'au1', title: '2027 시즌 어린이극 출연 배우 공개 오디션', status: '접수중', period: '2026.10.01 ~ 2026.10.20', target: '만 20세 이상 배우 (노래 가능자 우대)', body: '1차 서류 → 2차 실기(자유연기·노래) → 3차 워크숍 오디션. 합격자는 2027년 1~6월 공연 참여.' },
  { id: 'au2', title: '청소년 관객 자문단 ‘틴즈 크루’ 3기', status: '접수예정', period: '2026.11.01 ~ 2026.11.15', target: '만 13~18세 청소년', body: '대본 리딩, 공연 모니터링, 웹진 기고 활동.' },
  { id: 'au3', title: '2026 하반기 인형 연희자 오디션', status: '결과발표', period: '2026.07.01 ~ 2026.07.14', target: '인형극 경력 1년 이상', body: '최종 합격자 4명 개별 통보 완료.' },
]

export const faqs: Faq[] = [
  { id: 'f1', category: '예매', q: '예매는 언제까지 가능한가요?', a: '온라인 예매는 공연 시작 3시간 전까지 가능하며, 이후에는 현장 매표소에서 구매하실 수 있습니다.' },
  { id: 'f2', category: '취소·환불', q: '취소 수수료는 어떻게 되나요?', a: '예매 당일 자정까지 무료 취소, 관람일 10일 전까지 무료, 9~7일 전 1,000원, 6~3일 전 공연금액의 10%, 2~1일 전 30%가 부과됩니다. 관람 당일은 취소가 불가합니다.' },
  { id: 'f3', category: '취소·환불', q: '여러 장 중 일부만 취소할 수 있나요?', a: '네. 마이페이지 > 예매 확인/취소에서 취소할 좌석만 선택해 부분 취소할 수 있습니다.' },
  { id: 'f4', category: '관람', q: '아이가 관람 연령보다 어리면 입장할 수 없나요?', a: '공연별 관람 연령은 작품 특성을 고려해 정해졌습니다. 다른 관객의 관람을 위해 연령 미만 어린이는 입장이 제한됩니다.' },
  { id: 'f5', category: '관람', q: '보호자도 티켓이 필요한가요?', a: '24개월 이상 모든 관객은 티켓이 필요합니다. 영유아 공연은 보호자 동반이 필수입니다.' },
  { id: 'f6', category: '멤버십', q: '유료 멤버십 선예매는 어떻게 하나요?', a: '일반 예매 오픈 3일 전 14시부터 로그인한 멤버십 회원에게 ‘선예매’ 버튼이 노출됩니다.' },
  { id: 'f7', category: '회원', q: '만 14세 미만 어린이도 가입할 수 있나요?', a: '네. 어린이 회원 가입 시 보호자(법정대리인) 휴대폰 본인인증과 동의가 필요합니다.' },
  { id: 'f8', category: '예매', q: '가상계좌 입금 전에 카드로 바꿀 수 있나요?', a: '입금 기한 전이라면 마이페이지에서 결제수단을 신용카드로 변경할 수 있습니다.' },
  { id: 'f9', category: '관람', q: '휠체어석은 어떻게 예매하나요?', a: '좌석 선택 화면에서 주황색 휠체어석을 선택하시면 동반 1인 좌석이 함께 안내됩니다.' },
]

export const inquiries: Inquiry[] = [
  { id: 'q1', userId: 'u1', name: '김시연', email: 'demo@example.com', category: '예매', title: '수어통역 회차 좌석 문의', body: '수어통역 회차에서 통역사가 잘 보이는 좌석을 추천받을 수 있을까요?', createdAt: '2026-09-27 10:12', status: '답변완료', assignee: '김하늘', answer: '수어통역사는 무대 왼편에 위치합니다. B~E열 1~6번 좌석을 추천드립니다.', answeredAt: '2026-09-27 15:40' },
  { id: 'q2', userId: 'u1', name: '김시연', email: 'demo@example.com', category: '단체관람', title: '어린이집 단체 관람 가능 여부', body: '5세반 18명 + 교사 3명 단체관람 가능한가요?', createdAt: '2026-10-03 09:30', status: '접수' },
  { id: 'q3', name: '이민호', email: 'mh@example.com', category: '취소·환불', title: '부분 환불 후 영수증 재발급', body: '현금영수증 재발급 부탁드립니다.', createdAt: '2026-10-02 18:01', status: '담당자배정', assignee: '이준서' },
  { id: 'q4', name: '정유리', email: 'yr@example.com', category: 'VOC', title: '로비 수유실 위치 안내가 부족합니다', body: '현장 안내판을 늘려주세요.', createdAt: '2026-10-01 13:22', status: '접수' },
  { id: 'q5', name: '최도윤', email: 'dy@example.com', category: '회원', title: '휴면 계정 해제', body: '본인인증 후에도 로그인이 되지 않습니다.', createdAt: '2026-09-30 11:00', status: '답변완료', answer: '휴면 해제 처리 완료되었습니다.', answeredAt: '2026-09-30 14:00', assignee: '오세린' },
]

export const reviews: Review[] = [
  { id: 'rv1', perfId: 'p5', userId: 'u7', name: '이**', rating: 5, body: '아이가 새 소리를 따라 하면서 끝까지 집중했어요. 극장 안내도 친절했습니다.', createdAt: '2026-08-20' },
  { id: 'rv2', perfId: 'p5', userId: 'u9', name: '박**', rating: 4, body: '무대 미술이 정말 아름다웠습니다. 중간 휴식이 있으면 더 좋겠어요.', createdAt: '2026-08-18' },
  { id: 'rv3', perfId: 'p1', userId: 'u12', name: '정**', rating: 5, body: '프리뷰 봤는데 라이브 연주가 최고! 고양이 보리 너무 귀여워요.', createdAt: '2026-10-03' },
]

export const popups: Popup[] = [
  { id: 'pop1', title: '새 홈페이지 오픈!', body: '국립어린이청소년극단 독립 출범과 함께 새 홈페이지가 열렸습니다. 지금 가입하면 3,000원 할인쿠폰을 드려요.', start: '2026-10-01', end: '2026-10-31', active: true, link: '/signup' },
]
export const banners: Banner[] = [
  { id: 'b1', perfId: 'p1', title: '달을 삼킨 고양이', copy: '10.16 – 11.8 백성희장민호극장', active: true, order: 1 },
  { id: 'b2', perfId: 'p2', title: '열다섯, 지도에 없는 섬', copy: '10.23 – 11.22 소극장 판', active: true, order: 2 },
  { id: 'b3', perfId: 'p3', title: '빨간 버스는 어디로 가나요', copy: '10.8(목) 14시 티켓오픈 · 멤버십 선예매 진행중', active: true, order: 3 },
]

export function buildKopisLogs(): KopisLog[] {
  const out: KopisLog[] = []
  const rnd = seeded(99)
  for (let i = 14; i >= 1; i--) {
    const d = new Date(new Date(TODAY).getTime() - i * 864e5).toISOString().slice(0, 10)
    const cnt = 40 + Math.floor(rnd() * 260)
    const fail = i === 3
    out.push({ id: `k${i}a`, date: d, kind: '결제데이터', count: cnt, status: fail ? '재전송성공' : '성공', sentAt: `${d.slice(0, 8)}${String(Number(d.slice(8)) + 1).padStart(2, '0')} 0${fail ? 4 : 2}:1${i % 10}`, message: fail ? '1차 전송 타임아웃(HTTP 504) → 04:12 재전송 성공, 담당자 SMS 발송' : undefined })
    out.push({ id: `k${i}b`, date: d, kind: '일별집계', count: 1, status: '성공', sentAt: `${d.slice(0, 8)}${String(Number(d.slice(8)) + 1).padStart(2, '0')} 02:3${i % 10}` })
  }
  out.push({ id: 'kM', date: '2026-09', kind: '월별집계', count: 1, status: '성공', sentAt: '2026-10-01 03:00' })
  out.push({ id: 'k0a', date: '2026-10-04', kind: '결제데이터', count: 0, status: '대기', sentAt: '-', message: '익일 05:00 이전 자동 전송 예정' })
  return out.reverse()
}

export const adminUsers: AdminUser[] = [
  { id: 'ad1', name: '관리자', loginId: 'admin', role: '시스템관리자', lastLogin: '2026-10-05 09:01', active: true },
  { id: 'ad2', name: '김하늘', loginId: 'sky.kim', role: '공연운영', lastLogin: '2026-10-05 08:47', active: true },
  { id: 'ad3', name: '이준서', loginId: 'js.lee', role: '공연운영', lastLogin: '2026-10-04 18:20', active: true },
  { id: 'ad4', name: '매표소1', loginId: 'box01', role: '티켓매니저', lastLogin: '2026-10-04 19:40', active: true },
  { id: 'ad5', name: '매표소2', loginId: 'box02', role: '티켓매니저', lastLogin: '2026-09-28 13:00', active: false },
  { id: 'ad6', name: '오세린', loginId: 'sr.oh', role: 'CMS운영', lastLogin: '2026-10-02 10:10', active: true },
]

export const auditLogs: AuditLog[] = [
  { id: 'l1', at: '2026-10-05 09:01', who: 'admin', ip: '10.10.2.15', action: '로그인(2차인증)', target: '관리자' },
  { id: 'l2', at: '2026-10-04 17:44', who: 'sky.kim', ip: '10.10.2.31', action: '회차 일괄 수정', target: '달을 삼킨 고양이 / 10.25 회차 비고' },
  { id: 'l3', at: '2026-10-04 15:12', who: 'js.lee', ip: '10.10.2.32', action: '좌석 보류 설정', target: '열다섯, 지도에 없는 섬 / A열 1~4' },
  { id: 'l4', at: '2026-10-03 11:05', who: 'sr.oh', ip: '10.10.2.40', action: '팝업 등록', target: '새 홈페이지 오픈!' },
  { id: 'l5', at: '2026-10-02 10:10', who: 'admin', ip: '10.10.2.15', action: '권한 변경', target: 'box02 → 미사용' },
  { id: 'l6', at: '2026-10-01 09:00', who: 'admin', ip: '10.10.2.15', action: '개인정보 엑셀 다운로드(사유: 공연 안내 문자)', target: '예매자 목록 412건' },
]
