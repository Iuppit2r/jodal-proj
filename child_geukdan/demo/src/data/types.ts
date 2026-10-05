// 시연용 도메인 모델 (RFP SFR-HP / SFR-PM / SFR-TC 기준)

export type Grade = 'R' | 'S' | 'A' | 'W' // W: 휠체어석

export type PerfStatus = '임시저장' | '오픈예정' | '선예매중' | '판매중' | '매진' | '판매종료' | '판매중지'

export type Genre = '연극' | '음악극' | '인형극' | '무용극' | '렉처퍼포먼스'

export interface Venue {
  id: string
  name: string
  nameEn: string
  rows: string[]
  cols: number
  aisles: number[] // 해당 열 번호 뒤에 통로
  wheelchair: string[] // 휠체어석 좌석 ID
  address: string
}

export interface Round {
  id: string
  perfId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  no: number // 회차
  active: boolean
  distancing?: 'none' | 'together' | 'apart'
  cast?: string
  note?: string // 수어통역, 음성해설 등
}

export interface Performance {
  id: string
  code: string
  title: string
  titleEn: string
  subtitle: string
  genre: Genre
  ageLimit: string // 관람등급
  target: '어린이' | '청소년' | '가족'
  runtime: number // 분
  venueId: string
  start: string
  end: string
  status: PerfStatus
  openAt: string // 티켓오픈 일시
  presaleAt?: string // 유료회원 선예매 시작
  producer: string
  manager: string
  prices: Partial<Record<Grade, number>>
  palette: [string, string, string] // 포스터 생성용
  motif: 'moon' | 'star' | 'wave' | 'bus' | 'bird' | 'tree' | 'box'
  summary: string
  description: string
  credits: { role: string; name: string }[]
  cast: string[]
  tags: string[]
  accessibility: string[] // 수어통역, 음성해설, 릴랙스드 퍼포먼스 등
  feeRate: number // 대관 공연 정산 수수료(%)
  isRental: boolean
  packageEligible: boolean
  incomeDeduction: boolean // 문화비 소득공제
}

export interface TicketType {
  id: string
  name: string
  discountRate: number // 0~1
  desc: string
  needsProof?: boolean
  memberOnly?: string // 멤버십 등급 id
  active: boolean
}

export interface SeatPick {
  seatId: string
  grade: Grade
  ticketTypeId: string
  price: number // 최종 금액
  cancelled?: boolean
  issued?: boolean
  used?: boolean
}

export type BookingStatus = '입금대기' | '예매완료' | '발권완료' | '부분취소' | '취소완료' | '관람완료'
export type Channel = '홈페이지' | '모바일' | '현장' | '콜센터' | '외부예매처'
export type PayMethod = '신용카드' | '가상계좌' | '간편결제' | '현금' | '초대'

export interface Booking {
  id: string // 예매번호
  perfId: string
  roundId: string
  userId?: string
  bookerName: string
  bookerPhone: string
  viewerName?: string
  seats: SeatPick[]
  payMethod: PayMethod
  status: BookingStatus
  channel: Channel
  createdAt: string
  couponId?: string
  couponDiscount: number
  fee: number // 예매수수료
  total: number
  packageOrderId?: string
  cashReceipt?: boolean
  vaccount?: { bank: string; no: string; due: string }
  logs: { at: string; msg: string }[]
}

export interface MembershipTier {
  id: string
  name: string
  price: number
  discountRate: number
  presale: boolean
  benefits: string[]
  color: string
}

export interface Member {
  id: string
  loginId: string
  name: string
  birth: string
  phone: string
  email: string
  type: '개인' | '어린이'
  guardian?: string
  joinedAt: string
  lastLoginAt: string
  membership?: { tierId: string; since: string; until: string; autoRenew: boolean }
  marketing: boolean
  favorites: string[]
  status: '정상' | '휴면' | '탈퇴'
  region: string
}

export interface Coupon {
  id: string
  name: string
  amount?: number
  rate?: number
  minPrice?: number
  until: string
  ownerId: string
  usedBookingId?: string
  kind: '할인쿠폰' | '예매권'
}

export interface PackageProduct {
  id: string
  name: string
  type: '시즌' | '자유'
  desc: string
  perfIds: string[] // 시즌: 고정 / 자유: 선택 가능 목록
  pickCount: number
  discountRate: number
  saleStart: string
  saleEnd: string
  sold: number
  limit: number
}

export interface PackageOrder {
  id: string
  packageId: string
  userId: string
  perfIds: string[]
  bookingIds: string[]
  total: number
  status: '결제완료' | '취소완료'
  createdAt: string
}

export interface Notice {
  id: string
  category: '공지' | '공연' | '채용' | '입찰' | '이벤트'
  title: string
  body: string
  date: string
  views: number
  pinned?: boolean
  files?: string[]
}

export interface WebzineIssue {
  id: string
  vol: number
  year: number
  season: string
  title: string
  cover: [string, string, string]
  articles: { id: string; section: string; title: string; author: string; lead: string }[]
}

export interface ArchiveItem {
  id: string
  year: number
  title: string
  director: string
  writer: string
  cast: string[]
  venue: string
  kind: '공연기록' | '영상' | '사진' | '연구·발간자료'
  desc: string
  palette: [string, string, string]
  motif: Performance['motif']
}

export interface Audition {
  id: string
  title: string
  status: '접수중' | '접수예정' | '마감' | '결과발표'
  period: string
  target: string
  body: string
}

export interface Faq { id: string; category: string; q: string; a: string }

export interface Inquiry {
  id: string
  userId?: string
  name: string
  email: string
  category: '예매' | '취소·환불' | '회원' | '단체관람' | '기타' | 'VOC'
  title: string
  body: string
  createdAt: string
  status: '접수' | '담당자배정' | '답변완료'
  assignee?: string
  answer?: string
  answeredAt?: string
}

export interface Review {
  id: string
  perfId: string
  userId: string
  name: string
  rating: number
  body: string
  createdAt: string
}

export interface Popup { id: string; title: string; body: string; start: string; end: string; active: boolean; link?: string }
export interface Banner { id: string; perfId?: string; title: string; copy: string; active: boolean; order: number }

export interface KopisLog {
  id: string
  date: string
  kind: '결제데이터' | '일별집계' | '월별집계'
  count: number
  status: '성공' | '실패' | '재전송성공' | '대기'
  sentAt: string
  message?: string
}

export interface AuditLog { id: string; at: string; who: string; ip: string; action: string; target: string }

export interface AdminUser { id: string; name: string; role: '시스템관리자' | '공연운영' | '티켓매니저' | 'CMS운영'; loginId: string; lastLogin: string; active: boolean }
