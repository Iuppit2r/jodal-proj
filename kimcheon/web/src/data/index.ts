// ─────────────────────────────────────────────────────────────
// UI 시안용 데이터
// - 산·봉우리: 김천 100명산 – 2020 재지정 목록 확인분 98개 + 2021~ 인증기록 봉우리 2개(사발봉·갈비봉)
//   목록·높이·산줄기 = 매일신문 「김천의 100산 100설」, 좌표 = OpenStreetMap 정상 노드
// - 관광지·음식·숙박: 김천 실제 관광자원 (좌표는 근사치, 착수 시 문화관광 누리집·TourAPI 데이터로 교체)
// - 사용자 인증기록·게시글: 샘플
// ─────────────────────────────────────────────────────────────
import raw from './peaks.json'

export type PeakRaw = {
  id: string
  name: string
  height: number
  summit: string
  alias: string | null
  hanja: string | null
  region: string | null
  ridge: string | null
  border: string | null
  source: string | null
  lat: number | null
  lng: number | null
}

/** 산줄기 권역 – 권역 완등 배지 단위 */
export type ZoneId = 'daegan' | 'baekdu' | 'sudo' | 'geumo' | 'giyang'

export const zones: { id: ZoneId; name: string; desc: string; color: string }[] = [
  { id: 'daegan', name: '백두대간', desc: '영동·무주 경계를 잇는 김천의 등줄기', color: '#2C4A6E' },
  { id: 'baekdu', name: '백두 갈래', desc: '대간에서 뻗어 내린 단맥·여맥', color: '#3E8A84' },
  { id: 'sudo', name: '가야수도', desc: '수도산·단지봉, 1,300m급 고봉 권역', color: '#6E7F3A' },
  { id: 'geumo', name: '금오', desc: '금오산에서 지례·조마로 이어지는 줄기', color: '#C7793A' },
  { id: 'giyang', name: '기양', desc: '감문·개령 들판을 감싼 낮은 산', color: '#8B5E8E' },
]

function zoneOf(p: PeakRaw): ZoneId {
  const r = p.ridge ?? ''
  if (r === '백두대간') return 'daegan'
  if (r.startsWith('기양') || r === '백두기양지맥') return 'giyang'
  if (r.startsWith('가야수도') || r.startsWith('수도') || r === '') return 'sudo'
  if (r.startsWith('금오')) return 'geumo'
  return 'baekdu'
}

export type Mountain = PeakRaw & {
  no: number
  /** 화면 표시명 (동명 봉우리는 정상 이름 또는 지역으로 구분) */
  title: string
  zone: ZoneId
  regionLabel: string
  canCertify: boolean
  distKm: number | null
  hue: number
  photo?: string
}

/** 목업 현재 위치 (김천시청) */
export const ME = { lat: 36.1398, lng: 128.1136 }

export function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const PHOTOS: Record<string, string> = { geumo: 'geumo.jpg', hwangak: 'hwangak.jpg' }

const peaks = raw as PeakRaw[]
const baseTitle = (p: PeakRaw) => {
  const dup = peaks.filter((o) => o.name === p.name).length > 1
  return !dup ? p.name : p.summit !== p.name ? `${p.name} ${p.summit}` : `${p.name}(${(p.region ?? '').replace(' 일원', '')})`
}
export const mountains: Mountain[] = peaks.map((p, i) => {
  // 지역까지 같은 동명 봉우리는 높이로 구분 (예: 백운산 631m / 618m)
  const t0 = baseTitle(p)
  const title = peaks.filter((o) => baseTitle(o) === t0).length > 1 ? `${p.name}(${p.height}m)` : t0
  const region = p.region ?? '김천시'
  const regionLabel = /[군시] 경계$/.test(region) ? `김천시·${region}` : `김천시 ${region.replace(' 일원', '')}`
  return {
    ...p,
    no: i + 1,
    title,
    zone: zoneOf(p),
    regionLabel,
    canCertify: p.lat != null,
    distKm: p.lat != null ? distKm(ME.lat, ME.lng, p.lat, p.lng!) : null,
    hue: 90 + ((i * 29) % 140),
    photo: PHOTOS[p.id],
  }
})

export const TOTAL = mountains.length
export const byId = (id: string) => mountains.find((m) => m.id === id)!

export const fullName = (m: Mountain) => (m.title.endsWith(m.summit) ? m.title : `${m.title} ${m.summit}`)
export const zoneById = (id: ZoneId) => zones.find((z) => z.id === id)!

// ── 단계별 완등 배지 ──────────────────────────────────────
export type Tier = { id: string; count: number; name: string; desc: string; color: string }
export const tiers: Tier[] = [
  { id: 't5', count: 5, name: '첫걸음', desc: '김천 5산 완등', color: '#B7794A' },
  { id: 't10', count: 10, name: '산행 입문', desc: '김천 10산 완등', color: '#3E8A84' },
  { id: 't30', count: 30, name: '김천 산꾼', desc: '김천 30산 완등', color: '#2C4A6E' },
  { id: 't50', count: 50, name: '반백 완등', desc: '김천 50산 완등', color: '#C7793A' },
  { id: 't100', count: TOTAL, name: '김천 100산 완등', desc: '지정 봉우리 전체 완등', color: '#1F4434' },
]

// ── 주변 관광정보 ─────────────────────────────────────────
export type PlaceType = 'tour' | 'food' | 'stay'
export const placeTypeLabel: Record<PlaceType, string> = { tour: '관광지', food: '음식', stay: '숙박' }

export type Place = {
  id: string
  type: PlaceType
  name: string
  category: string
  area: string
  desc: string
  lat: number
  lng: number
  /** 대표 전화 – 시안용, 착수 시 문화관광 누리집 데이터로 교체 */
  phone: string
  hours: string
}

export const places: Place[] = [
  { id: 'jikjisa', type: 'tour', name: '직지사', category: '사찰 · 천년고찰', area: '김천시 대항면 운수리', desc: '신라 눌지왕 때 아도화상이 창건한 고찰. 황악산 등산로의 들머리이자 사명대사가 출가한 절입니다.', lat: 36.1197, lng: 127.9925, phone: '054-429-1700', hours: '상시 개방 · 문화재 관람 무료' },
  { id: 'jikjipark', type: 'tour', name: '직지문화공원', category: '공원 · 조각공원', area: '김천시 대항면 운수리', desc: '직지사 입구에 조성된 문화공원. 조각 작품과 음악분수, 넓은 잔디광장이 있습니다.', lat: 36.1236, lng: 128.0001, phone: '054-420-6114', hours: '상시 개방 · 음악분수 하절기 운영' },
  { id: 'ceramic', type: 'tour', name: '세계도자기박물관', category: '박물관', area: '김천시 대항면 운수리', desc: '직지문화공원 안의 도자기 전문 박물관. 유럽·아시아 도자기 1,000여 점을 전시합니다.', lat: 36.1243, lng: 127.9993, phone: '054-420-6627', hours: '09:00~18:00 · 월요일 휴관' },
  { id: 'samyeong', type: 'tour', name: '사명대사공원', category: '공원 · 평화의탑', area: '김천시 대항면 운수리', desc: '사명대사의 호국정신을 기리는 공원. 5층 목탑 평화의탑에 오르면 황악산 능선이 한눈에 보입니다.', lat: 36.1181, lng: 128.0062, phone: '054-420-6114', hours: '09:00~18:00 · 평화의탑 무료' },
  { id: 'yeonhwaji', type: 'tour', name: '연화지', category: '연못 · 벚꽃 명소', area: '김천시 교동', desc: '도심 속 연못과 정자 봉황대. 봄 벚꽃과 야간 조명으로 유명한 김천 대표 산책 명소입니다.', lat: 36.1271, lng: 128.1031, phone: '054-420-6114', hours: '상시 개방 · 야간 조명 일몰~23:00' },
  { id: 'buhang', type: 'tour', name: '부항댐 출렁다리', category: '댐 · 출렁다리 · 짚와이어', area: '김천시 부항면 유촌리', desc: '부항호를 가로지르는 출렁다리와 짚와이어. 삼도봉 산행 후 들르기 좋은 레저 명소입니다.', lat: 36.0262, lng: 128.0322, phone: '054-420-6930', hours: '출렁다리 09:00~18:00 · 짚와이어 유료' },
  { id: 'cheongamsa', type: 'tour', name: '청암사', category: '사찰 · 인현왕후길', area: '김천시 증산면 평촌리', desc: '불령산 자락의 비구니 승가대학 사찰. 인현왕후가 머문 곳으로, 수도암까지 인현왕후길이 이어집니다.', lat: 35.9019, lng: 128.0586, phone: '054-432-6040', hours: '상시 개방' },
  { id: 'sudoam', type: 'tour', name: '수도암', category: '사찰 · 수도산', area: '김천시 증산면 수도리', desc: '수도산 중턱 해발 1,080m에 자리한 암자. 수도산 정상 산행의 대표 들머리입니다.', lat: 35.8712, lng: 128.0107, phone: '054-433-6052', hours: '상시 개방 · 차량 진입 제한 구간 있음' },
  { id: 'bangchojeong', type: 'tour', name: '방초정', category: '정자 · 문화재', area: '김천시 구성면 상원리', desc: '연못 위에 세운 조선 중기의 2층 누정. 삼악산·호초당산 산행 길목에 있습니다.', lat: 36.0565, lng: 128.0602, phone: '054-420-6114', hours: '상시 개방' },
  { id: 'gammun', type: 'tour', name: '감문국이야기테마파크', category: '테마파크 · 역사', area: '김천시 개령면 동부리', desc: '삼한시대 소국 감문국의 이야기를 담은 테마파크. 기양 권역 산행과 함께 둘러보기 좋습니다.', lat: 36.1668, lng: 128.1897, phone: '054-420-5990', hours: '09:00~18:00 · 월요일 휴관' },
  { id: 'sanchae', type: 'food', name: '직지사 산채음식촌', category: '한식 · 산채정식', area: '김천시 대항면 운수리', desc: '직지사 입구의 산채정식 식당가. 황악산 하산 후 산나물 정식과 더덕구이를 즐길 수 있습니다.', lat: 36.1212, lng: 127.9978, phone: '054-436-6114', hours: '10:00~20:00 · 업소별 상이' },
  { id: 'jirye', type: 'food', name: '지례흑돼지 식당가', category: '한식 · 흑돼지구이', area: '김천시 지례면 교리', desc: '김천 대표 향토음식 지례흑돼지. 지례 권역 산행 후 숯불구이로 마무리하세요.', lat: 35.9833, lng: 128.0418, phone: '054-420-6114', hours: '11:00~21:00 · 업소별 상이' },
  { id: 'hwanggeum', type: 'food', name: '김천 황금시장', category: '전통시장 · 먹거리', area: '김천시 황금동', desc: '1920년대부터 이어진 김천 대표 전통시장. 순대·국밥 등 시장 먹거리가 가득합니다.', lat: 36.1214, lng: 128.1183, phone: '054-432-2003', hours: '07:00~20:00 · 오일장 3·8일' },
  { id: 'cafe', type: 'food', name: '연화지 카페거리', category: '카페 · 디저트', area: '김천시 교동', desc: '연화지를 둘러싼 카페 거리. 도심 산행 후 쉬어가기 좋습니다.', lat: 36.1279, lng: 128.1043, phone: '054-420-6114', hours: '10:00~22:00 · 업소별 상이' },
  { id: 'templestay', type: 'stay', name: '직지사 템플스테이', category: '템플스테이', area: '김천시 대항면 운수리', desc: '천년고찰에서의 1박 2일. 새벽 예불 후 황악산 일출 산행으로 이어갈 수 있습니다.', lat: 36.1192, lng: 127.9917, phone: '054-429-1716', hours: '1박 2일 · 사전 예약' },
  { id: 'forest', type: 'stay', name: '수도산자연휴양림', category: '자연휴양림 · 숲속의 집', area: '김천시 증산면 수도리', desc: '수도산 해발 600m 숲속 휴양림. 수도산·단지봉 1박 2일 산행 베이스캠프로 적합합니다.', lat: 35.8862, lng: 128.0332, phone: '054-437-8040', hours: '입실 15:00 · 퇴실 11:00 · 숲나들e 예약' },
  { id: 'camping', type: 'stay', name: '부항댐 산내들오토캠핑장', category: '오토캠핑장', area: '김천시 부항면 유촌리', desc: '부항호 옆 오토캠핑장. 삼도봉·백두대간 산행 전후 캠핑을 즐길 수 있습니다.', lat: 36.0301, lng: 128.0361, phone: '054-420-6930', hours: '입실 14:00 · 퇴실 12:00 · 사전 예약' },
]

export const placeById = (id: string) => places.find((p) => p.id === id)!

/** 산 기준 주변 관광정보 (좌표 거리순) */
export function nearbyPlaces(m: Mountain, type?: PlaceType, limit = 6) {
  if (m.lat == null) return []
  return places
    .filter((p) => !type || p.type === type)
    .map((p) => ({ place: p, km: distKm(m.lat!, m.lng!, p.lat, p.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

// ── 지역관광 연계 미션 ────────────────────────────────────
export type Mission = {
  id: string
  title: string
  badge: string
  /** 스탬프에 찍히는 짧은 장소명 */
  stamp: string
  story: string
  /** 인증해야 할 산 (anyOf 가 있으면 그중 need 개) */
  peaks: string[]
  need: number
  spots: string[]
  color: string
}

export const missions: Mission[] = [
  { id: 'm-jikji', title: '천년고찰 직지 코스', badge: '직지 순례자', stamp: '직지사', story: '김천의 진산 황악산을 오르고, 산 아래 천년고찰 직지사에 들러보세요.', peaks: ['hwangak'], need: 1, spots: ['jikjisa'], color: '#B5523B' },
  { id: 'm-queen', title: '인현왕후길 따라', badge: '인현왕후길 탐방가', stamp: '청암사', story: '김천 최고봉 수도산에 오른 뒤, 인현왕후가 머물던 청암사를 찾아가는 길.', peaks: ['sudo'], need: 1, spots: ['cheongamsa'], color: '#3E8A84' },
  { id: 'm-samdo', title: '세 도의 경계에 서다', badge: '삼도봉 탐험가', stamp: '부항댐', story: '경상·충청·전라가 만나는 삼도봉 정상 인증 후 부항댐 출렁다리를 건너보세요.', peaks: ['samdo'], need: 1, spots: ['buhang'], color: '#2C4A6E' },
  { id: 'm-city', title: '도심 3산과 연화지', badge: '김천 도심 산책가', stamp: '연화지', story: '시내에서 가까운 고성산·달봉산·구화산을 오르고 연화지에서 쉬어가는 코스.', peaks: ['goseong', 'dalbong', 'guhwa'], need: 3, spots: ['yeonhwaji'], color: '#C7793A' },
  { id: 'm-jirye', title: '지례 산행과 흑돼지', badge: '지례 미식 산꾼', stamp: '지례흑돼지', story: '문의봉·궁을산·주악산·구산 중 2산을 오르고 지례흑돼지로 마무리.', peaks: ['p29', 'p31', 'p81', 'p82'], need: 2, spots: ['jirye'], color: '#7A5A45' },
  { id: 'm-gammun', title: '감문국을 찾아서', badge: '감문국 탐험가', stamp: '감문국', story: '기양 권역 산 2곳을 오르고, 삼한 소국 감문국 이야기를 만나보세요.', peaks: ['p09', 'p10', 'p11', 'p14'], need: 2, spots: ['gammun'], color: '#8B5E8E' },
]

// ── 샘플 사용자 인증 기록 ──────────────────────────────────
export type CertRecord = { mountainId: string; at: string; distM: number; photo?: string }

export const sampleRecords: CertRecord[] = [
  { mountainId: 'goseong', at: '2026-03-14T10:42', distM: 12 },
  { mountainId: 'dalbong', at: '2026-03-21T09:15', distM: 7 },
  { mountainId: 'guhwa', at: '2026-03-28T16:40', distM: 11 },
  { mountainId: 'nanham', at: '2026-04-05T11:18', distM: 8 },
  { mountainId: 'geumo', at: '2026-04-26T12:55', distM: 21 },
  { mountainId: 'mangwol', at: '2026-05-17T09:30', distM: 15 },
  { mountainId: 'daedeok', at: '2026-07-12T13:21', distM: 18 },
  { mountainId: 'samdo', at: '2026-09-13T12:10', distM: 27 },
  { mountainId: 'sudo', at: '2026-09-20T13:02', distM: 14 },
]
export const sampleVisits: { placeId: string; at: string }[] = [{ placeId: 'cheongamsa', at: '2026-09-20T15:40' }]

export const user = { name: '홍길동', nick: '황악다람쥐', since: '2026.03.02' }

export const round = { name: '2026년 김천 100산 완등 인증', start: '2026.03.01', end: '2026.12.31' }

export type Post = { id: string; author: string; mountainId: string; body: string; date: string; likes: number; cardStyle: number }
export const feed: Post[] = [
  { id: 'g1', author: '김*수', mountainId: 'samdo', body: '세 도가 만나는 삼도봉! 덕유산까지 선명하게 보였어요. 하산 후 부항댐 출렁다리까지 미션 완료 👍', date: '2026.09.14', likes: 42, cardStyle: 1 },
  { id: 'g2', author: '이*영', mountainId: 'hwangak', body: '직지사 코스로 올랐어요. 운수봉까지 완만하고 비로봉 직전이 가파릅니다. 산채정식 추천!', date: '2026.09.12', likes: 31, cardStyle: 0 },
  { id: 'g3', author: '최*진', mountainId: 'sudo', body: '수도산은 역시 쉽지 않네요. 물 넉넉히 챙기세요. 30산 배지 달성!', date: '2026.09.01', likes: 57, cardStyle: 2 },
]

export type Notice = { id: string; tag: string; title: string; date: string; views: number; pinned?: boolean; body: string }
export const notices: Notice[] = [
  {
    id: 'n1',
    tag: '안내',
    title: '2026년 김천 100산 완등 인증 운영 안내',
    date: '2026.02.24',
    views: 3412,
    pinned: true,
    body: '2026년 김천 100산 완등 인증이 3월 1일부터 12월 31일까지 운영됩니다.\n\n• 인증 방법: 앱에서 본인인증 후, 각 산 정상석 반경 50m 이내에서 앱 카메라로 인증사진을 촬영·등록합니다.\n• 완등 기준: 지정된 100개 봉우리 인증사진을 모두 등록하면 완등입니다.\n• 완등 혜택: 완등 인증서와 기념품을 신청할 수 있습니다.\n\n안전한 산행을 위해 출발 전 기상 상황을 꼭 확인해 주세요.',
  },
  {
    id: 'n2',
    tag: '안전',
    title: '가을철 산불조심기간 입산 통제구역 안내 (11.1.~12.15.)',
    date: '2026.09.25',
    views: 842,
    pinned: true,
    body: '11월 1일부터 12월 15일까지 가을철 산불조심기간으로 일부 등산로의 입산이 통제됩니다.\n\n통제구역 안의 인증지점은 기간 동안 인증이 제한될 수 있으며, 통제 해제 후 다시 인증할 수 있습니다. 화기 소지와 취사는 금지됩니다.',
  },
  {
    id: 'n3',
    tag: '이벤트',
    title: '가을 관광연계 미션 달성 시 김천사랑상품권 추첨',
    date: '2026.09.18',
    views: 1203,
    body: '10월 한 달 동안 관광연계 미션을 1개 이상 달성한 분 가운데 100명을 추첨해 김천사랑상품권 1만 원권을 드립니다.\n\n당첨자는 11월 10일 공지사항과 앱 알림으로 안내합니다.',
  },
  {
    id: 'n4',
    tag: '등산로',
    title: '수도산 등산로 정비공사에 따른 우회 안내 (10.5.~10.30.)',
    date: '2026.09.10',
    views: 655,
    body: '수도암 기점 등산로 정비공사로 공사 기간 동안 청암사 기점 코스를 이용해 주시기 바랍니다. 수도산 정상 인증은 정상 이용 가능합니다.',
  },
  {
    id: 'n5',
    tag: '기념품',
    title: '기념품 "등산 스틱" 조기 소진 안내',
    date: '2026.08.30',
    views: 1021,
    body: '준비된 등산 스틱 수량이 모두 소진되어 신청이 마감되었습니다. 다른 기념품을 선택해 주세요. 이미 신청하신 분은 순서대로 발송됩니다.',
  },
]

export const faqs = [
  { q: '정상에 도착했는데 인증 버튼이 눌리지 않아요.', a: '정상석 반경 50m 안에 들어와야 촬영할 수 있습니다. 산 정상에서는 위치 수신이 늦을 수 있으니 하늘이 트인 곳에서 10초 정도 기다린 뒤 다시 시도해 주세요.' },
  { q: '인터넷이 안 되는 곳에서도 인증할 수 있나요?', a: '네. 촬영 시각과 위치가 기기에 저장되고, 인터넷이 연결되면 자동으로 등록됩니다.' },
  { q: '인증 순서가 정해져 있나요?', a: '아니요. 100개 봉우리를 원하는 순서대로 오르면 됩니다.' },
  { q: '관광 스탬프는 어떻게 받나요?', a: '미션에 포함된 산을 인증한 뒤, 관광지 반경 200m 안에서 방문 체크인을 하면 스탬프가 찍힙니다.' },
  { q: '인증카드는 어디서 다시 볼 수 있나요?', a: '마이 > 나의 인증카드, 또는 산 상세 화면의 인증카드 버튼에서 다시 만들고 공유할 수 있습니다.' },
  { q: '기념품은 언제 받을 수 있나요?', a: '신청 후 약 2주 안에 지급 준비가 완료되며, 택배 또는 김천시청 산림녹지과 방문 수령 중 선택할 수 있습니다.' },
]

export type Reward = { id: string; name: string; desc: string; stock: number; enabled: boolean }
export const rewards: Reward[] = [
  { id: 'badge', name: '오삼이 금속 배지', desc: '김천 100산 완등 기념 오삼이 금속 배지', stock: 214, enabled: true },
  { id: 'towel', name: '오삼이 쿨 손수건', desc: '등산용 냉감 손수건 (오삼이 디자인)', stock: 96, enabled: true },
  { id: 'grape', name: '김천 샤인머스캣 교환권', desc: '지역 농산물 판매장에서 사용 (2kg)', stock: 58, enabled: true },
  { id: 'stick', name: '등산 스틱', desc: '재고 소진으로 신청 마감', stock: 0, enabled: false },
]


// ── 표시 형식 ─────────────────────────────────────────────
export const fmtKm = (km: number | null | undefined) =>
  km == null ? '좌표 등록 예정' : km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`

export function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
export const hsl = (h: number, s = 45, l = 42) => `hsl(${h} ${s}% ${l}%)`

/** 산 일러스트 색 – 그린~틸 범위의 차분한 톤 */
export function artPalette(seed: number) {
  const h = 100 + (seed % 70)
  return { sky0: '#EFEBE1', sky1: '#E4ECE6', sun: '#F2B84B', r1: hsl(h, 16, 70), r2: hsl(h, 22, 48), r3: hsl(h + 8, 32, 28) }
}
