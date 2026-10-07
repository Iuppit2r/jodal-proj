// 관리자 페이지 시연용 운영 데이터
// - 봉우리·관광지·미션: 사용자 앱과 같은 실데이터(src/data)
// - 회차·사용자·인증기록·신청·로그: 고정 시드로 생성한 샘플 (새로고침해도 동일)
import { missions, mountains, rewards as appRewards, TOTAL, type Mountain } from '../data'

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
const r = rng(20261006)
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
const pad = (n: number) => String(n).padStart(2, '0')

// ── 회차 (SFR-009) ───────────────────────────────────────
export type Round = { id: string; name: string; start: string; end: string; peaks: number; note: string }
export const rounds: Round[] = [
  { id: 'r2026', name: '2026년 김천 100산 완등 인증', start: '2026-03-01', end: '2026-12-31', peaks: TOTAL, note: '앱 인증 첫 회차' },
  { id: 'r2025', name: '2025년 김천 100산 완등 인증', start: '2025-03-01', end: '2025-12-31', peaks: TOTAL, note: '밴드 인증' },
  { id: 'r2024', name: '2024년 김천 100산 완등 인증', start: '2024-03-01', end: '2024-12-31', peaks: TOTAL, note: '밴드 인증' },
  { id: 'r2023', name: '2023년 시 승격 70주년 100산 완등', start: '2023-03-01', end: '2023-12-31', peaks: TOTAL, note: '밴드 인증 · 누적 290명 완등' },
]
export const TODAY = '2026-10-06'
export const roundStatus = (rd: Round) => (TODAY < rd.start ? '예정' : TODAY > rd.end ? '종료' : '진행중')

// ── 사용자 ───────────────────────────────────────────────
const LAST = '김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민진나엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용'.split('')
const FIRST = ['민수', '서연', '지훈', '수빈', '영호', '미경', '상철', '은정', '동현', '혜진', '정훈', '순자', '태호', '지영', '성민', '경숙', '재원', '현주', '병철', '숙희', '준혁', '나연', '광수', '영자', '도윤', '하은', '창민', '정희', '우진', '미숙']
const AREAS = ['김천시 교동', '김천시 평화동', '김천시 율곡동', '김천시 아포읍', '구미시 송정동', '대구시 수성구', '김천시 대항면', '상주시 남성동', '김천시 지좌동', '서울시 강남구', '김천시 부곡동', '포항시 남구']

export type AdminUser = { id: string; name: string; masked: string; birth: string; phone: string; area: string; joined: string; count: number; via: '휴대폰' | '아이핀' }
const mask = (n: string) => n[0] + '*'.repeat(n.length - 2) + n.at(-1)

export const users: AdminUser[] = Array.from({ length: 1352 }, (_, i) => {
  const name = pick(LAST) + pick(FIRST)
  // 완등 수 분포: 대부분 소수, 일부 완등
  const x = r()
  const count = i < 86 ? TOTAL : x < 0.45 ? 1 + Math.floor(r() * 9) : x < 0.8 ? 10 + Math.floor(r() * 30) : 40 + Math.floor(r() * 59)
  const y = 1950 + Math.floor(r() * 50)
  return {
    id: `u${String(i + 1).padStart(4, '0')}`,
    name,
    masked: mask(name),
    birth: `${y}.${pad(1 + Math.floor(r() * 12))}.${pad(1 + Math.floor(r() * 28))}`,
    phone: `010-****-${pad(Math.floor(r() * 100))}${pad(Math.floor(r() * 100))}`,
    area: pick(AREAS),
    joined: `2026-${pad(3 + Math.floor(r() * 4))}-${pad(1 + Math.floor(r() * 28))}`,
    count,
    via: r() < 0.86 ? '휴대폰' : '아이핀',
  }
})
users[0] = { ...users[0], name: '홍길동', masked: '홍*동', birth: '1985.04.12', phone: '010-****-5678', area: '김천시 교동', joined: '2026-03-02', count: 9, via: '휴대폰' }

// ── 인증 기록 (SFR-011) ──────────────────────────────────
// 산별 인기 가중치: 낮고 시내에서 가까운 산, 대표 명산일수록 높음
const FAMOUS: Record<string, number> = { hwangak: 3, geumo: 2.6, sudo: 2.4, goseong: 2.8, samdo: 2, daedeok: 1.8, dalbong: 2.2, guhwa: 1.6, nanham: 1.4 }
const weight = (m: Mountain) => (FAMOUS[m.id] ?? 1) * (1.4 - Math.min(1, m.height / 1400) * 0.6) * (1.3 - Math.min(1, (m.distKm ?? 30) / 40) * 0.6)
const ranked = [...mountains].sort((a, b) => weight(b) - weight(a))

export type AdminRecord = { no: number; roundId: string; userId: string; mountainId: string; at: string; distM: number; hue: number }

const recs: AdminRecord[] = []
for (const u of users) {
  // 사용자마다 인기순에 약간의 흔들림을 준 순서로 count개
  const order = [...ranked].map((m) => ({ m, k: weight(m) * (0.5 + r()) })).sort((a, b) => b.k - a.k)
  for (let j = 0; j < u.count; j++) {
    const month = 3 + Math.floor(((j / Math.max(1, u.count)) * 7 + r()) % 8)
    const at = `2026-${pad(Math.min(10, month))}-${pad(1 + Math.floor(r() * (month >= 10 ? 5 : 28)))}T${pad(7 + Math.floor(r() * 9))}:${pad(Math.floor(r() * 60))}`
    recs.push({ no: 0, roundId: 'r2026', userId: u.id, mountainId: order[j].m.id, at, distM: 3 + Math.floor(r() * 46), hue: order[j].m.hue })
  }
}
recs.sort((a, b) => b.at.localeCompare(a.at))
recs.forEach((x, i) => (x.no = recs.length - i))
export const records = recs
export const userById = (id: string) => users.find((u) => u.id === id)!

// 회차별 집계 (과거 회차는 밴드 인증 집계값)
export const roundStats: Record<string, { participants: number; certs: number; completers: number }> = {
  r2026: { participants: users.length, certs: recs.length, completers: users.filter((u) => u.count >= TOTAL).length },
  r2025: { participants: 1184, certs: 31260, completers: 142 },
  r2024: { participants: 962, certs: 24877, completers: 118 },
  r2023: { participants: 804, certs: 20511, completers: 96 },
}

/** 산별 인증 수 – 2026은 실제 샘플 기록, 과거 회차는 비율로 추정 */
export function peakCounts(roundId: string) {
  const out: Record<string, number> = {}
  if (roundId === 'r2026') {
    for (const x of recs) out[x.mountainId] = (out[x.mountainId] ?? 0) + 1
    return out
  }
  const total = roundStats[roundId].certs
  const sum = mountains.reduce((s, m) => s + weight(m), 0)
  for (const m of mountains) out[m.id] = Math.round((weight(m) / sum) * total * (0.85 + ((m.no * 37) % 30) / 100))
  return out
}

// ── 인증물품 (SFR-012) · 지급 현황 (SFR-013) ─────────────────
export type AdminReward = { id: string; name: string; desc: string; stock: number; enabled: boolean; created: string }
export const initialRewards: AdminReward[] = [
  { id: 'cert', name: '완등 인증서', desc: '김천시장 명의 인증서 (완등자 전원 기본 지급)', stock: 999, enabled: true, created: '2026-02-10' },
  ...appRewards.map((x, i) => ({ ...x, created: `2026-02-${pad(10 + i)}` })),
  { id: 'cap', name: '오삼이 등산 모자', desc: '2025년 회차 기념품 (지급 종료)', stock: 0, enabled: false, created: '2025-02-14' },
]

export type PayStatus = '신청완료' | '지급준비' | '수령완료'
export type AdminApplication = { no: number; userId: string; rewardId: string; method: '택배' | '방문'; receiveDate: string; applied: string; status: PayStatus }
export const initialApplications: AdminApplication[] = users
  .filter((u) => u.count >= TOTAL)
  .slice(1, 64)
  .map((u, i) => {
    const st: PayStatus = i % 3 === 0 ? '수령완료' : i % 3 === 1 ? '지급준비' : '신청완료'
    return {
      no: i + 1,
      userId: u.id,
      rewardId: ['badge', 'towel', 'grape', 'badge', 'stick'][i % 5],
      method: i % 4 === 0 ? '방문' : '택배',
      receiveDate: `2026-${pad(9 + (i % 2))}-${pad(5 + ((i * 3) % 20))}`,
      applied: `2026-${pad(8 + (i % 2))}-${pad(2 + ((i * 5) % 25))}`,
      status: st,
    }
  })

// ── 관광 미션 ────────────────────────────────────────────
export const missionStats = missions.map((m, i) => ({ mission: m, done: [38, 21, 17, 44, 12, 9][i], inProgress: [61, 33, 28, 52, 24, 19][i] }))

// ── CMS: 관리자 · 로그 · 게시판 · 웹로그 ────────────────────
export const admins = [
  { id: 'admin', name: '김산림', dept: '산림녹지과', group: '최고관리자', ip: '211.236.*.*', last: '2026-10-06 09:12', locked: false },
  { id: 'forest01', name: '이녹지', dept: '산림녹지과', group: '완등인증 담당', ip: '211.236.*.*', last: '2026-10-05 17:40', locked: false },
  { id: 'tour02', name: '박관광', dept: '문화관광과', group: '관광정보 담당', ip: '211.236.*.*', last: '2026-10-02 10:03', locked: false },
  { id: 'it03', name: '최정보', dept: '정보통신과', group: '시스템 관리', ip: '211.236.*.*', last: '2026-09-28 14:22', locked: false },
  { id: 'vendor', name: '유지보수', dept: '외부 위탁', group: '유지보수', ip: '1.234.*.*', last: '2026-08-31 11:00', locked: true },
]

export const accessLogs = Array.from({ length: 18 }, (_, i) => {
  const a = admins[i % 4]
  const acts = ['로그인', '인증현황 조회', '물품 지급상태 변경', '공지사항 등록', '인증지점 좌표 수정', '회차 정보 수정', '엑셀 내려받기', '로그아웃']
  return { no: 18 - i, id: a.id, name: a.name, act: acts[(i * 3) % acts.length], ip: a.ip.replace('*.*', `${12 + i}.${40 + i * 3}`), at: `2026-10-${pad(6 - Math.floor(i / 4))} ${pad(17 - (i % 9))}:${pad((i * 13) % 60)}` }
})

export const guestbook = [
  { no: 6, author: '김*수', mountain: '삼도봉', title: '세 도가 만나는 삼도봉 다녀왔어요', date: '2026-09-14', hidden: false },
  { no: 5, author: '이*영', mountain: '황악산', title: '직지사 코스 추천합니다', date: '2026-09-12', hidden: false },
  { no: 4, author: '박*호', mountain: '고성산', title: '퇴근길 야경 산행', date: '2026-09-08', hidden: false },
  { no: 3, author: '최*진', mountain: '수도산', title: '30산 달성! 물 넉넉히 챙기세요', date: '2026-09-01', hidden: false },
  { no: 2, author: '정*희', mountain: '대덕산', title: '광고성 글입니다', date: '2026-08-29', hidden: true },
  { no: 1, author: '강*민', mountain: '난함산', title: '정상석 주변 정비 부탁드립니다', date: '2026-08-20', hidden: false },
]

/** 최근 30일 일별 방문자 (웹로그 분석) */
export const dailyVisitors = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 8, 7 + i)
  const weekend = d.getDay() === 0 || d.getDay() === 6
  return { date: `${d.getMonth() + 1}.${d.getDate()}`, v: Math.round((weekend ? 1650 : 820) + r() * 380 + i * 14) }
})
export const osShare = [
  { name: '안드로이드', v: 64 },
  { name: '아이폰', v: 33 },
  { name: '기타', v: 3 },
]
export const hourly = [2, 1, 1, 1, 3, 9, 18, 26, 22, 17, 14, 15, 19, 16, 12, 10, 9, 8, 9, 11, 10, 7, 4, 3]
