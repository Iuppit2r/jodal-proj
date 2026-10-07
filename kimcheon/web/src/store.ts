import { create } from 'zustand'
import { byId, missions, mountains, sampleRecords, sampleVisits, tiers, type CertRecord, type Mission, type Tier } from './data'
import { guestPosts, notifications, type GuestPost, type Noti } from './data/extra'

export type Tab = 'home' | 'mountains' | 'passport' | 'missions'

export type Route =
  | { name: 'mountain'; id: string }
  | { name: 'certify'; id?: string }
  | { name: 'result'; id: string; newTiers: string[]; newZones: string[]; newMissions: string[] }
  | { name: 'card'; id: string }
  | { name: 'place'; id: string; fromMountain?: string }
  | { name: 'mission'; id: string }
  | { name: 'my' }
  | { name: 'badges' }
  | { name: 'reward' }
  | { name: 'notices' }
  | { name: 'notice'; id: string }
  | { name: 'faq' }
  | { name: 'settings' }
  | { name: 'guestbook'; mountainId?: string }
  | { name: 'guestPost'; id: string }
  | { name: 'guestWrite'; mountainId?: string }
  | { name: 'inbox' }
  | { name: 'photos' }
  | { name: 'photo'; id: string }
  | { name: 'terms'; tab?: 'service' | 'privacy' | 'location' }
  | { name: 'withdraw' }

export type StartMode = 'empty' | 'sample' | 'thirty' | 'closed'

/** 시연용 촬영 상황 */
export type CertDemo = 'ok' | 'far' | 'nogps' | 'offline'
export type PushMsg = { title: string; body: string; to?: Route }

type State = {
  mode: StartMode
  /** 본인인증 로그인 여부 */
  authed: boolean
  tab: Tab
  stack: Route[]
  records: Record<string, CertRecord>
  visits: Record<string, string>
  /** 시연용: 정상석(또는 관광지) 반경 진입 시뮬레이션 */
  atSummit: boolean
  toast: string | null
  application: Application | null
  settings: Record<string, boolean>
  /** 인증 회차 기간 여부 (기간 외에는 인증 비활성) */
  roundActive: boolean
  certDemo: CertDemo
  /** 인터넷 연결 전 기기에 저장된 인증 */
  pending: string[]
  posts: GuestPost[]
  notis: Noti[]
  pushMsg: PushMsg | null
  setCertDemo: (d: CertDemo) => void
  savePending: (id: string) => void
  syncPending: () => void
  addPost: (p: Omit<GuestPost, 'id' | 'date' | 'likes' | 'comments' | 'author'>) => void
  readNoti: (id: string) => void
  readAll: () => void
  showPush: (m: PushMsg) => void
  hidePush: () => void
  withdraw: () => void
  setTab: (t: Tab) => void
  push: (r: Route) => void
  replace: (r: Route) => void
  pop: () => void
  home: () => void
  setAtSummit: (v: boolean) => void
  certify: (id: string, photo?: string) => Route
  visit: (placeId: string) => string[]
  setPhoto: (id: string, photo: string) => void
  showToast: (msg: string) => void
  reset: (mode: StartMode) => void
  login: () => void
  logout: () => void
  completeAll: () => void
  submitApplication: (a: Omit<Application, 'submittedAt' | 'status'>) => void
  toggleSetting: (k: string) => void
}

export type Application = {
  rewardId: string
  name: string
  phone: string
  method: 'delivery' | 'visit'
  address: string
  submittedAt: string
  status: 0 | 1 | 2
}
export const applicationSteps = ['신청 완료', '지급 준비', '수령 완료']

function initialRecords(mode: StartMode): Record<string, CertRecord> {
  if (mode === 'empty') return {}
  const base = Object.fromEntries(sampleRecords.map((r) => [r.mountainId, r]))
  if (mode === 'thirty') {
    // 좌표 확보된 봉우리 중 낮은 산부터 채워 30산
    const extra = mountains
      .filter((m) => m.canCertify && !base[m.id] && m.id !== 'hwangak')
      .sort((a, b) => a.height - b.height)
      .slice(0, 30 - sampleRecords.length)
    extra.forEach((m, i) => {
      const d = new Date(2026, 3 + Math.floor(i / 4), 1 + ((i * 7) % 27), 10 + (i % 5), (i * 13) % 60)
      base[m.id] = { mountainId: m.id, at: d.toISOString().slice(0, 16), distM: 6 + ((i * 7) % 30) }
    })
  }
  return base
}
const initialVisits = (mode: StartMode) =>
  mode === 'empty' ? {} : Object.fromEntries(sampleVisits.map((v) => [v.placeId, v.at]))

let toastTimer: number | undefined

export const useApp = create<State>((set, get) => ({
  mode: 'sample',
  authed: true,
  tab: 'home',
  stack: [],
  records: initialRecords('sample'),
  visits: initialVisits('sample'),
  atSummit: true,
  toast: null,
  application: null,
  settings: { summit: true, mission: true, notice: true, marketing: false, location: true, camera: true },
  roundActive: true,
  certDemo: 'ok',
  pending: [],
  posts: guestPosts,
  notis: notifications,
  pushMsg: null,
  setCertDemo: (certDemo) => set({ certDemo, atSummit: certDemo !== 'far' }),
  savePending: (id) => set((s) => ({ pending: s.pending.includes(id) ? s.pending : [...s.pending, id] })),
  syncPending: () => {
    const ids = get().pending
    ids.forEach((id) => get().certify(id))
    set({ pending: [], certDemo: 'ok' })
  },
  addPost: (p) => set((s) => ({ posts: [{ ...p, id: `gb${Date.now()}`, author: '홍*동', date: '2026.10.06', likes: 0, comments: 0, mine: true }, ...s.posts] })),
  readNoti: (id) => set((s) => ({ notis: s.notis.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  readAll: () => set((s) => ({ notis: s.notis.map((n) => ({ ...n, read: true })) })),
  showPush: (pushMsg) => set({ pushMsg }),
  hidePush: () => set({ pushMsg: null }),
  withdraw: () => set({ authed: false, stack: [], tab: 'home', records: {}, visits: {}, application: null, mode: 'empty' }),
  setTab: (tab) => set({ tab, stack: [] }),
  push: (r) => set((s) => ({ stack: [...s.stack, r] })),
  replace: (r) => set((s) => ({ stack: [...s.stack.slice(0, -1), r] })),
  pop: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  home: () => set({ stack: [], tab: 'home' }),
  setAtSummit: (atSummit) => set({ atSummit }),
  certify: (id, photo) => {
    const before = progressOf(get().records, get().visits)
    const now = new Date(2026, 9, 6, 11, 24)
    const rec: CertRecord = { mountainId: id, at: now.toISOString().slice(0, 16), distM: 9, photo }
    const records = { ...get().records, [id]: rec }
    set({ records })
    const after = progressOf(records, get().visits)
    return {
      name: 'result',
      id,
      newTiers: after.tiers.filter((t) => !before.tiers.includes(t)),
      newZones: after.zones.filter((z) => !before.zones.includes(z)),
      newMissions: after.missions.filter((m) => !before.missions.includes(m)),
    }
  },
  visit: (placeId) => {
    const before = progressOf(get().records, get().visits).missions
    const visits = { ...get().visits, [placeId]: new Date(2026, 9, 6, 14, 5).toISOString().slice(0, 16) }
    set({ visits })
    return progressOf(get().records, visits).missions.filter((m) => !before.includes(m))
  },
  setPhoto: (id, photo) => set((s) => ({ records: { ...s.records, [id]: { ...s.records[id], photo } } })),
  showToast: (msg) => {
    clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = window.setTimeout(() => set({ toast: null }), 2200)
  },
  login: () => set({ authed: true, tab: 'home', stack: [] }),
  logout: () => set({ authed: false, stack: [], tab: 'home' }),
  reset: (mode) => set({ mode, authed: mode !== 'empty', roundActive: mode !== 'closed', tab: 'home', stack: [], records: initialRecords(mode), visits: initialVisits(mode), atSummit: true, certDemo: 'ok', pending: [], pushMsg: null, posts: guestPosts, notis: notifications, application: null }),
  completeAll: () =>
    set((s) => {
      const records = { ...s.records }
      mountains.forEach((m, i) => {
        records[m.id] ??= { mountainId: m.id, at: `2026-${String(4 + (i % 6)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}T11:30`, distM: 8 + (i % 20) }
      })
      return { records }
    }),
  submitApplication: (a) => set({ application: { ...a, submittedAt: '2026-10-06T15:20', status: 0 } }),
  toggleSetting: (k) => set((s) => ({ settings: { ...s.settings, [k]: !s.settings[k] } })),
}))

// ── 파생 계산 ─────────────────────────────────────────────
export function missionProgress(m: Mission, records: Record<string, CertRecord>, visits: Record<string, string>) {
  const peaksDone = m.peaks.filter((id) => records[id]).length
  const spotsDone = m.spots.filter((id) => visits[id]).length
  const peaksOk = peaksDone >= m.need
  const done = peaksOk && spotsDone >= m.spots.length
  const dates = [...m.peaks.map((id) => records[id]?.at), ...m.spots.map((id) => visits[id])].filter(Boolean) as string[]
  const doneAt = done ? dates.sort().at(-1) : undefined
  return { doneAt, peaksDone: Math.min(peaksDone, m.need), spotsDone, peaksOk, done, steps: Math.min(peaksDone, m.need) + spotsDone, total: m.need + m.spots.length }
}

export function zoneProgress(records: Record<string, CertRecord>) {
  const out: Record<string, { done: number; total: number }> = {}
  for (const m of mountains) {
    out[m.zone] ??= { done: 0, total: 0 }
    out[m.zone].total++
    if (records[m.id]) out[m.zone].done++
  }
  return out
}

export function progressOf(records: Record<string, CertRecord>, visits: Record<string, string>) {
  const count = Object.keys(records).length
  const zp = zoneProgress(records)
  return {
    count,
    tiers: tiers.filter((t) => count >= t.count).map((t) => t.id),
    zones: Object.entries(zp).filter(([, v]) => v.done >= v.total).map(([k]) => k),
    missions: missions.filter((m) => missionProgress(m, records, visits).done).map((m) => m.id),
  }
}

export function nextTier(count: number): Tier | undefined {
  return tiers.find((t) => count < t.count)
}

export function recordsLatest(records: Record<string, CertRecord>) {
  return Object.values(records).sort((a, b) => b.at.localeCompare(a.at))
}

/** 인증 순번 (n번째 완등) */
export function orderOf(records: Record<string, CertRecord>, id: string) {
  return Object.values(records).sort((a, b) => a.at.localeCompare(b.at)).findIndex((r) => r.mountainId === id) + 1
}

export { byId }
