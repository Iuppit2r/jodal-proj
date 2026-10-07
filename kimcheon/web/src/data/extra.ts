// 산 상세 콘텐츠(등산코스·교통·주차), 방명록, 알림, 약관 – UI 시안용
// ※ 대표 명산 코스는 널리 알려진 들머리 기준 근사치, 그 외 봉우리는 높이·거리로 산정한 예시.
//   착수 시 관리자 「산 정보 관리」에서 산림녹지과 자료로 등록·교체한다.
import { byId, distKm, ME, type Mountain } from './index'

export type Difficulty = '쉬움' | '보통' | '어려움'
export type Course = { name: string; start: string; km: number; min: number; level: Difficulty; path: string }

const KNOWN: Record<string, Course[]> = {
  hwangak: [
    { name: '직지사 코스', start: '직지사 주차장', km: 5.4, min: 160, level: '보통', path: '직지사 → 운수암 → 운수봉 → 비로봉' },
    { name: '괘방령 코스', start: '괘방령', km: 6.2, min: 180, level: '보통', path: '괘방령 → 여시골산 → 운수봉 → 비로봉' },
  ],
  sudo: [
    { name: '수도암 코스', start: '수도암 주차장', km: 2.4, min: 80, level: '보통', path: '수도암 → 수도산 정상' },
    { name: '인현왕후길 코스', start: '청암사', km: 7.2, min: 210, level: '어려움', path: '청암사 → 인현왕후길 → 수도암 → 수도산 정상' },
  ],
  samdo: [{ name: '해인리 코스', start: '부항면 해인리', km: 5.1, min: 150, level: '어려움', path: '해인리 → 석교산 갈림길 → 삼도봉' }],
  daedeok: [{ name: '덕산재 코스', start: '덕산재', km: 3.4, min: 100, level: '보통', path: '덕산재 → 얼음폭포 → 대덕산' }],
  goseong: [{ name: '부곡동 코스', start: '부곡동 등산로 입구', km: 2.0, min: 50, level: '쉬움', path: '부곡동 → 체육시설 → 고성산 정상' }],
  dalbong: [{ name: '연화지 코스', start: '교동 연화지', km: 1.8, min: 45, level: '쉬움', path: '연화지 → 달봉산 정상' }],
}

const PARKING: Record<string, string> = {
  hwangak: '직지사 주차장 (유료, 대형버스 가능) · 괘방령 갓길 주차 소형 10대',
  sudo: '수도암 주차장 (소형 15대) · 청암사 주차장 (무료)',
  samdo: '해인리 마을 공터 (소형 10대)',
  goseong: '부곡동 등산로 입구 공영주차장 (무료)',
  dalbong: '연화지 공영주차장 (무료)',
}

/** 들머리 이름 – 지역명에서 리·면 단위 추출 */
function trailhead(m: Mountain) {
  const r = (m.region ?? '').replace(' 일원', '')
  if (/경계$/.test(r)) return `${m.title} 들머리 (경계 능선)`
  return `${r || '김천시'} 마을회관`
}

export function coursesOf(m: Mountain): Course[] {
  if (KNOWN[m.id]) return KNOWN[m.id]
  const km = Math.round((1.4 + m.height / 320) * 10) / 10
  const level: Difficulty = m.height >= 900 ? '어려움' : m.height >= 500 ? '보통' : '쉬움'
  return [{ name: '대표 코스', start: trailhead(m), km, min: Math.round(km * 18 + m.height / 12), level, path: `${trailhead(m)} → ${m.summit} 정상` }]
}

export function transportOf(m: Mountain) {
  const d = m.lat != null ? distKm(ME.lat, ME.lng, m.lat, m.lng!) : null
  const car = d != null ? `김천시청에서 차량 약 ${Math.max(10, Math.round(d * 1.6))}분` : '들머리 좌표 등록 후 안내'
  const bus = m.id === 'hwangak' ? '김천역 앞에서 직지사행 시내버스 (약 30분)' : `김천역·김천종합버스터미널에서 ${(m.region ?? '').includes('면') ? m.region!.replace(' 일원', '') : '해당 면'} 방면 시내버스 이용`
  return { car, bus }
}

export const parkingOf = (m: Mountain) => PARKING[m.id] ?? '들머리 공터 주차 가능 (소형 5대 내외) · 농로 주차 금지'

// ── 방명록 (본인인증 후 작성) ──────────────────────────────
export type GuestPost = { id: string; author: string; mountainId: string; title: string; body: string; date: string; likes: number; comments: number; photo: boolean; mine?: boolean }
export const guestPosts: GuestPost[] = [
  { id: 'gb6', author: '김*수', mountainId: 'samdo', title: '세 도가 만나는 삼도봉 다녀왔어요', body: '해인리에서 출발했는데 석교산 갈림길부터 경사가 꽤 있습니다. 정상에서는 덕유산까지 선명하게 보였어요. 하산 후 부항댐 출렁다리까지 들러 관광 스탬프도 받았습니다.', date: '2026.09.14', likes: 42, comments: 6, photo: true },
  { id: 'gb5', author: '이*영', mountainId: 'hwangak', title: '직지사 코스 추천합니다', body: '운수봉까지는 완만하고 비로봉 직전이 조금 가파릅니다. 하산 후 산채정식 먹고 직지사 둘러보면 하루 코스로 딱 좋아요.', date: '2026.09.12', likes: 31, comments: 4, photo: true },
  { id: 'gb4', author: '박*호', mountainId: 'goseong', title: '퇴근길 야경 산행', body: '시내에서 가까워서 퇴근 후 가볍게 다녀왔습니다. 정상에서 보는 김천 시내 야경이 예뻐요. 헤드랜턴 꼭 챙기세요.', date: '2026.09.08', likes: 18, comments: 2, photo: false },
  { id: 'gb3', author: '최*진', mountainId: 'sudo', title: '30산 달성! 물 넉넉히 챙기세요', body: '수도산은 역시 쉽지 않네요. 수도암 코스로 올랐는데 여름엔 물 1.5리터는 필요합니다. 30산 배지 받아서 기분 좋습니다.', date: '2026.09.01', likes: 57, comments: 9, photo: true },
  { id: 'gb2', author: '정*희', mountainId: 'daedeok', title: '덕산재에서 대덕산 가는 길', body: '얼음폭포 지나서부터 억새가 장관입니다. 정상석 바로 옆에서 인증 성공했어요.', date: '2026.08.29', likes: 22, comments: 1, photo: true },
  { id: 'gb1', author: '강*민', mountainId: 'nanham', title: '정상석 주변 정비 부탁드립니다', body: '정상석 주변 풀이 많이 자라 사진 찍기가 어렵네요. 관리 부탁드립니다.', date: '2026.08.20', likes: 9, comments: 1, photo: false },
]

// ── 알림함 ───────────────────────────────────────────────
export type Noti = { id: string; kind: '도착' | '미션' | '기념품' | '공지' | '배지'; title: string; body: string; when: string; group: '오늘' | '이번 주' | '이전'; read: boolean; to?: { name: string; id?: string } }
export const notifications: Noti[] = [
  { id: 'a1', kind: '도착', title: '황악산 정상 근처에 도착했어요', body: '정상석 50m 안에서 인증사진을 찍으면 10번째 스탬프!', when: '오전 11:20', group: '오늘', read: false, to: { name: 'certify', id: 'hwangak' } },
  { id: 'a2', kind: '미션', title: '천년고찰 직지 코스 미션', body: '황악산 인증 후 직지사에 들르면 관광 스탬프를 받아요.', when: '오전 9:02', group: '오늘', read: false, to: { name: 'mission', id: 'm-jikji' } },
  { id: 'a3', kind: '공지', title: '[안전] 가을철 산불조심기간 입산 통제 안내', body: '11.1.~12.15. 일부 등산로 입산이 통제됩니다.', when: '9월 25일', group: '이번 주', read: true, to: { name: 'notice', id: 'n2' } },
  { id: 'a4', kind: '배지', title: '「인현왕후길 탐방가」 관광 스탬프 획득', body: '수도산 인증 + 청암사 방문 미션을 달성했어요.', when: '9월 20일', group: '이전', read: true, to: { name: 'mission', id: 'm-queen' } },
  { id: 'a5', kind: '배지', title: '「첫걸음」 배지 획득', body: '김천 5산 완등을 축하해요!', when: '4월 26일', group: '이전', read: true, to: { name: 'badges' } },
]

// ── 약관 ─────────────────────────────────────────────────
export const terms = {
  service: [
    ['제1조 (목적)', '이 약관은 김천시(이하 "시")가 제공하는 김천 100산 완등 인증 앱(이하 "서비스")의 이용 조건과 절차, 시와 이용자의 권리·의무를 정합니다.'],
    ['제2조 (회원가입)', '이용자는 김천시 본인인증(휴대폰 또는 아이핀)을 거쳐 회원으로 가입하며, 1인 1계정만 사용할 수 있습니다.'],
    ['제3조 (완등 인증)', '완등 인증은 각 인증지점 정상석 반경 50m 안에서 앱 카메라로 촬영한 사진에 한해 인정합니다. 위치 조작 등 부정한 방법으로 등록한 인증은 취소될 수 있습니다.'],
    ['제4조 (인증서·기념품)', '회차 기간 안에 지정 인증지점을 모두 인증한 회원은 1회에 한해 인증서와 기념품을 신청할 수 있습니다.'],
    ['제5조 (안전)', '산행 중 발생한 사고에 대해 시는 책임을 지지 않으며, 이용자는 기상 상황과 입산 통제 공지를 확인해야 합니다.'],
  ],
  privacy: [
    ['수집 항목', '이름, 생년월일, 휴대폰 번호, 본인확인 정보(연계정보), 인증사진, 촬영 위치·일시, 기념품 수령 주소'],
    ['이용 목적', '완등 인증 관리, 인증서·기념품 지급, 공지·안전 알림 발송'],
    ['보유 기간', '회원 탈퇴 시까지. 기념품 수령 주소는 지급 완료 후 6개월 뒤 파기'],
    ['제3자 제공', '기념품 택배 발송 시 배송업체에 이름·연락처·주소 제공'],
    ['담당 부서', '김천시청 산림녹지과 054-420-6324'],
  ],
  location: [
    ['수집 시점', '정상 인증 촬영, 관광지 체크인, 정상 도착 알림 이용 시'],
    ['이용 목적', '정상석·관광지 반경 확인, 주변 관광정보 거리 계산'],
    ['보관', '인증 위치는 인증 기록과 함께 보관하며 이동 경로는 저장하지 않습니다.'],
  ],
}
export { byId }
