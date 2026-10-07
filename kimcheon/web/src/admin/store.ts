import { create } from 'zustand'
import { mountains } from '../data'
import { initialApplications, initialRewards, rounds as initialRounds, type AdminApplication, type AdminReward, type PayStatus, type Round } from './data'

export type AdminPage =
  | 'dashboard'
  | 'rounds'
  | 'courses'
  | 'certs'
  | 'rewards'
  | 'payments'
  | 'stats'
  | 'missions'
  | 'boards'
  | 'admins'
  | 'logs'
  | 'weblog'
  | 'mountains'
  | 'tourism'
  | 'menus'
  | 'banners'
  | 'members'
  | 'push'
  | 'mapstatus'

/** 인증지점 (SFR-010) – 회차별 코스에 포함되는 봉우리 */
export type DownloadLog = { no: number; at: string; who: string; menu: string; reason: string; detail: string; rows: number }

export type CoursePoint = { id: string; name: string; height: number; lat: number | null; lng: number | null; radius: number; enabled: boolean }

type S = {
  authed: boolean
  page: AdminPage
  roundId: string
  rounds: Round[]
  rewards: AdminReward[]
  applications: AdminApplication[]
  course: CoursePoint[]
  toast: string | null
  downloads: DownloadLog[]
  rejected: Record<number, string>
  addDownload: (d: Omit<DownloadLog, 'no' | 'at' | 'who'>) => void
  reject: (no: number, reason: string) => void
  login: () => void
  logout: () => void
  go: (p: AdminPage) => void
  setRound: (id: string) => void
  saveRound: (r: Round) => void
  deleteRound: (id: string) => void
  saveReward: (r: AdminReward) => void
  deleteReward: (id: string) => void
  setPayStatus: (no: number, st: PayStatus) => void
  movePoint: (id: string, dir: -1 | 1) => void
  savePoint: (p: CoursePoint) => void
  flash: (m: string) => void
}

let t: number | undefined

export const useAdmin = create<S>((set, get) => ({
  authed: false,
  page: 'dashboard',
  roundId: 'r2026',
  rounds: initialRounds,
  rewards: initialRewards,
  applications: initialApplications,
  course: mountains.map((m) => ({ id: m.id, name: m.title, height: m.height, lat: m.lat, lng: m.lng, radius: 50, enabled: true })),
  toast: null,
  downloads: [
    { no: 3, at: '2026-10-02 10:14', who: '이녹지 (산림녹지과)', menu: '물품 지급 현황', reason: '기념품 택배 발송', detail: '9월 신청분 우체국 택배 접수', rows: 21 },
    { no: 2, at: '2026-09-15 16:40', who: '김산림 (산림녹지과)', menu: '인증지점별 통계', reason: '통계 보고', detail: '상반기 운영 결과 보고', rows: 100 },
    { no: 1, at: '2026-08-31 09:03', who: '이녹지 (산림녹지과)', menu: '인증현황 관리', reason: '민원 처리', detail: '인증 누락 민원 확인', rows: 38 },
  ],
  rejected: {},
  addDownload: (d) => set((s) => ({ downloads: [{ ...d, no: s.downloads.length + 1, at: '2026-10-06 15:30', who: '김산림 (산림녹지과)' }, ...s.downloads] })),
  reject: (no, reason) => set((s) => ({ rejected: { ...s.rejected, [no]: reason } })),
  login: () => set({ authed: true, page: 'dashboard' }),
  logout: () => set({ authed: false }),
  go: (page) => set({ page }),
  setRound: (roundId) => set({ roundId }),
  saveRound: (r) =>
    set((s) => ({ rounds: s.rounds.some((x) => x.id === r.id) ? s.rounds.map((x) => (x.id === r.id ? r : x)) : [r, ...s.rounds] })),
  deleteRound: (id) => set((s) => ({ rounds: s.rounds.filter((x) => x.id !== id) })),
  saveReward: (r) =>
    set((s) => ({ rewards: s.rewards.some((x) => x.id === r.id) ? s.rewards.map((x) => (x.id === r.id ? r : x)) : [...s.rewards, r] })),
  deleteReward: (id) => set((s) => ({ rewards: s.rewards.filter((x) => x.id !== id) })),
  setPayStatus: (no, st) => set((s) => ({ applications: s.applications.map((a) => (a.no === no ? { ...a, status: st } : a)) })),
  movePoint: (id, dir) =>
    set((s) => {
      const i = s.course.findIndex((p) => p.id === id)
      const j = i + dir
      if (j < 0 || j >= s.course.length) return {}
      const c = [...s.course]
      ;[c[i], c[j]] = [c[j], c[i]]
      return { course: c }
    }),
  savePoint: (p) => set((s) => ({ course: s.course.map((x) => (x.id === p.id ? p : x)) })),
  flash: (m) => {
    clearTimeout(t)
    set({ toast: m })
    t = window.setTimeout(() => set({ toast: null }), 2000)
    void get
  },
}))
