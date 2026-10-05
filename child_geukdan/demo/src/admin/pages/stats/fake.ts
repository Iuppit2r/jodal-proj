import * as M from '../../../data/mock'
import { TODAY, addDays, rng } from '../../lib'

/** 홈페이지 접속 통계 – 시연용 결정적 가상 데이터 (TODAY 기준 seed) */
export type Gran = 'day' | 'hour' | 'month' | 'year'
export interface TPoint { key: string; label: string; visitors: number; pageviews: number; newV: number; returning: number; avgSec: number; bounce: number }

const OPEN_DAY = '2026-10-01' // 새 홈페이지 오픈
const TICKET_OPEN = ['2026-09-15', '2026-09-22', '2026-10-01', '2026-10-05']

function point(r: () => number, key: string, label: string, visitors: number, newRatio: number): TPoint {
  const v = Math.round(visitors)
  const newV = Math.round(v * newRatio)
  return {
    key, label, visitors: v, pageviews: Math.round(v * (3.1 + r() * 1.4)), newV, returning: v - newV,
    avgSec: Math.round(150 + r() * 110), bounce: Math.round((28 + r() * 16) * 10) / 10,
  }
}

export function traffic(g: Gran): TPoint[] {
  const r = rng(M.hash(TODAY + g))
  if (g === 'day') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(TODAY, i - 29)
      const dow = new Date(d + 'T00:00:00').getDay()
      let v = 2300 + r() * 700
      if (dow === 0 || dow === 6) v *= 1.3
      if (d >= OPEN_DAY) v *= 1.75
      if (TICKET_OPEN.includes(d)) v *= 1.9
      return point(r, d, d.slice(5).replace('-', '.'), v, d >= OPEN_DAY ? 0.46 + r() * 0.08 : 0.3 + r() * 0.08)
    })
  }
  if (g === 'hour') {
    const shape = [0.25, 0.15, 0.1, 0.08, 0.08, 0.12, 0.25, 0.5, 0.8, 1.05, 1.15, 1.1, 1.0, 1.05, 1.95, 1.3, 1.05, 0.95, 0.95, 1.1, 1.3, 1.3, 0.95, 0.55]
    return shape.map((s, h) => point(r, String(h), `${String(h).padStart(2, '0')}시`, (220 + r() * 50) * s, 0.4 + r() * 0.1))
  }
  if (g === 'month') {
    const [y, m] = TODAY.split('-').map(Number)
    return Array.from({ length: 12 }, (_, i) => {
      const dt = new Date(y, m - 1 - (11 - i), 1)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const season = [0.8, 0.85, 1.0, 1.05, 1.25, 0.95, 1.2, 1.3, 1.0, 1.35, 1.1, 1.25][dt.getMonth()]
      let v = 68000 * season * (0.92 + r() * 0.16)
      if (key === TODAY.slice(0, 7)) v = v * (Number(TODAY.slice(8)) / 31) * 1.7 // 진행 중인 월 (오픈 효과)
      return point(r, key, `${dt.getFullYear() % 100}.${String(dt.getMonth() + 1).padStart(2, '0')}`, v, 0.33 + r() * 0.08)
    })
  }
  return [2022, 2023, 2024, 2025, 2026].map((yr, i) => {
    const v = [612000, 688000, 745000, 802000, 0][i] || 0
    const cur = yr === 2026 ? 868000 * (273 / 365) : v * (0.97 + r() * 0.06)
    return point(r, String(yr), yr === 2026 ? '2026(누적)' : String(yr), cur, 0.36 + r() * 0.05)
  })
}

export function sumPoints(ps: TPoint[]) {
  const visitors = ps.reduce((a, p) => a + p.visitors, 0)
  const pageviews = ps.reduce((a, p) => a + p.pageviews, 0)
  const newV = ps.reduce((a, p) => a + p.newV, 0)
  const avgSec = visitors ? ps.reduce((a, p) => a + p.avgSec * p.visitors, 0) / visitors : 0
  const bounce = visitors ? ps.reduce((a, p) => a + p.bounce * p.visitors, 0) / visitors : 0
  return { visitors, pageviews, newV, returning: visitors - newV, avgSec, bounce }
}
export const fmtSec = (s: number) => `${Math.floor(s / 60)}분 ${String(Math.round(s % 60)).padStart(2, '0')}초`

/** 유입 경로 */
export interface Source { group: '검색엔진' | 'SNS' | '직접 접속' | '외부 링크'; name: string; visits: number; conv: number }
export function sources(): Source[] {
  const r = rng(M.hash(TODAY + 'src'))
  const base: [Source['group'], string, number][] = [
    ['검색엔진', '네이버', 31.5], ['검색엔진', '구글', 12.4], ['검색엔진', '다음', 4.1], ['검색엔진', '기타 검색', 1.2],
    ['SNS', '인스타그램', 9.8], ['SNS', '카카오', 8.6], ['SNS', '유튜브', 3.9], ['SNS', '페이스북·X', 1.1],
    ['직접 접속', '직접 입력·즐겨찾기', 17.9],
    ['외부 링크', '국립극단·문화포털', 3.6], ['외부 링크', '학교 가정통신문', 3.2], ['외부 링크', '외부 예매처', 2.7],
  ]
  const total = 128400
  return base.map(([group, name, p]) => ({ group, name, visits: Math.round(total * p / 100 * (0.94 + r() * 0.12)), conv: Math.round((2 + r() * 6) * 10) / 10 }))
}
export function devices() {
  return [
    { name: '모바일', value: 68.4, color: '#2647c4' },
    { name: 'PC', value: 27.1, color: '#1fb592' },
    { name: '태블릿', value: 4.5, color: '#f5b400' },
  ]
}

/** 인기 페이지 */
export interface PageStat { path: string; title: string; pv: number; uv: number; avgSec: number; bounce: number }
export function topPages(): PageStat[] {
  const r = rng(M.hash(TODAY + 'pages'))
  const list: [string, string, number][] = [
    ['/', '메인', 142000], ['/performances', '공연 목록', 61200], ['/performances/p1', '달을 삼킨 고양이 상세', 48300],
    ['/book/p1', '예매 – 좌석 선택', 31900], ['/performances/p3', '빨간 버스는 어디로 가나요 상세', 29400], ['/performances/p2', '열다섯, 지도에 없는 섬 상세', 26800],
    ['/membership', '유료 멤버십', 19700], ['/schedule', '공연 일정', 18200], ['/mypage', '마이페이지', 16100], ['/notices', '공지사항', 13800],
    ['/package', '패키지', 11300], ['/login', '로그인', 10900], ['/notices/n1', '독립 출범 및 새 홈페이지 오픈 안내', 8700], ['/guide', '관람 안내', 6400], ['/faq', 'FAQ', 5200],
  ]
  return list.map(([path, title, pv]) => {
    const p = Math.round(pv * (0.93 + r() * 0.14))
    return {
      path, title, pv: p, uv: Math.round(p * (0.55 + r() * 0.2)),
      avgSec: Math.round(path.startsWith('/book') ? 260 + r() * 80 : path.includes('/performances/') ? 120 + r() * 70 : 40 + r() * 90),
      bounce: Math.round((path === '/' ? 22 : path.startsWith('/book') ? 14 : 30 + r() * 35) * 10) / 10,
    }
  }).sort((a, b) => b.pv - a.pv)
}

/** 관리자 접속·개인정보 처리 로그 (시드 이력 – 최근 30일) */
export function pastAdminLogs() {
  const r = rng(M.hash(TODAY + 'adm'))
  const users = M.adminUsers
  const ips: Record<string, string> = { admin: '10.10.2.15', 'sky.kim': '10.10.2.31', 'js.lee': '10.10.2.32', box01: '10.10.5.11', box02: '10.10.5.12', 'sr.oh': '10.10.2.40' }
  const pii = ['개인정보 표시(사유: 고객 문의 응대)', '개인정보 엑셀 다운로드(사유: 공연 안내 문자)', '예매자 목록 다운로드', '회원정보 조회', '개인정보 표시(사유: 환불 처리)']
  const out: { id: string; at: string; who: string; ip: string; action: string; target: string }[] = []
  for (let d = 1; d <= 30; d++) {
    const date = addDays(TODAY, -d)
    for (const u of users) {
      if (!u.active && d < 7) continue
      if (r() < 0.35) continue
      const h = 8 + Math.floor(r() * 3), m = Math.floor(r() * 60)
      const ip = ips[u.loginId] ?? '10.10.2.99'
      out.push({ id: `pl-${d}-${u.id}-i`, at: `${date} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, who: u.loginId, ip, action: r() < 0.9 ? '로그인(2차인증)' : '로그인 실패(비밀번호 오류)', target: '관리자' })
      if (r() < 0.3) {
        const t = pii[Math.floor(r() * pii.length)]
        out.push({ id: `pl-${d}-${u.id}-p`, at: `${date} ${String(h + 2).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`, who: u.loginId, ip, action: t, target: t.includes('다운로드') ? `예매자 목록 ${50 + Math.floor(r() * 400)}건` : `회원 ${['u' + (3 + Math.floor(r() * 150))]}` })
      }
      out.push({ id: `pl-${d}-${u.id}-o`, at: `${date} ${String(h + 8).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`, who: u.loginId, ip, action: r() < 0.8 ? '로그아웃' : '로그아웃(세션 만료 30분)', target: '관리자' })
    }
  }
  return out
}
