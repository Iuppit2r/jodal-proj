import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'
import * as M from './data/mock'
import type {
  Banner, Booking, Coupon, Grade, Inquiry, KopisLog, Member, Notice, PackageOrder, Performance, Popup,
  Review, Round, SeatPick, AuditLog, Channel, PayMethod,
} from './data/types'

export interface Sms { id: string; at: string; to: string; text: string; kind: 'SMS' | '알림톡' | '메일' }
export interface Toast { id: string; text: string; tone?: 'ok' | 'warn' | 'err' }

const SEED_BOOKINGS = M.buildSeedBookings()

export function nowStr() {
  // 시연 기준일(TODAY) + 실제 현재 시각
  const d = new Date()
  return `${M.TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const uid = (p: string) => p + Math.random().toString(36).slice(2, 8)

interface State {
  // 세션
  userId: string | null
  adminId: string | null
  lang: 'ko' | 'en'
  fontScale: 'base' | 'lg' | 'xl'
  contrast: 'normal' | 'high'

  // 데이터
  performances: Performance[]
  rounds: Round[]
  members: Member[]
  coupons: Coupon[]
  extraBookings: Booking[]
  patches: Record<string, Partial<Booking>>
  holds: Record<string, string[]> // roundId -> 보류 좌석
  siteOnly: Record<string, string[]> // roundId -> 현장/콜센터 전용 좌석
  gradeOverrides: Record<string, Record<string, Grade>> // perfId -> seat -> grade
  packageOrders: PackageOrder[]
  notices: Notice[]
  inquiries: Inquiry[]
  reviews: Review[]
  popups: Popup[]
  banners: Banner[]
  kopisLogs: KopisLog[]
  auditLogs: AuditLog[]
  sms: Sms[]
  toasts: Toast[]
  pendingBooking: { perfId: string; roundId?: string } | null // 로그인 전 선택한 공연 유지 (SFR-TC-008)

  // 액션
  set: (p: Partial<State>) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  sendSms: (to: string, text: string, kind?: Sms['kind']) => void
  log: (action: string, target: string) => void

  login: (loginId: string) => Member | null
  logout: () => void
  signup: (m: Omit<Member, 'id' | 'joinedAt' | 'lastLoginAt' | 'favorites' | 'status'>) => Member
  updateMember: (id: string, p: Partial<Member>) => void
  toggleFavorite: (perfId: string) => void
  joinMembership: (tierId: string) => void
  cancelMembership: () => void

  createBooking: (b: {
    perfId: string; roundId: string; seats: SeatPick[]; payMethod: PayMethod; channel: Channel
    bookerName: string; bookerPhone: string; viewerName?: string; couponId?: string; couponDiscount?: number; fee?: number
    userId?: string; packageOrderId?: string; status?: Booking['status']
  }) => Booking
  patchBooking: (id: string, p: Partial<Booking>, logMsg?: string) => void
  cancelSeats: (id: string, seatIds: string[], reason?: string) => void
  issueBooking: (id: string) => void
  checkInSeat: (id: string, seatId?: string) => 'ok' | 'used' | 'cancelled' | 'notfound'

  createPackageOrder: (o: Omit<PackageOrder, 'id' | 'createdAt' | 'status'>) => PackageOrder

  upsertPerformance: (p: Performance) => void
  setRounds: (perfId: string, rs: Round[]) => void
  setHold: (roundId: string, seats: string[]) => void
  setSiteOnly: (roundId: string, seats: string[]) => void
  setGrades: (perfId: string, map: Record<string, Grade>) => void

  addInquiry: (q: Omit<Inquiry, 'id' | 'createdAt' | 'status'>) => void
  updateInquiry: (id: string, p: Partial<Inquiry>) => void
  addReview: (r: Omit<Review, 'id' | 'createdAt'>) => void
  deleteReview: (id: string) => void
  upsertNotice: (n: Notice) => void
  deleteNotice: (id: string) => void
  upsertPopup: (p: Popup) => void
  upsertBanner: (b: Banner) => void
  issueCoupons: (memberIds: string[], c: Omit<Coupon, 'id' | 'ownerId'>) => void
  retryKopis: (id: string) => void
  resetDemo: () => void
}

const initialData = () => ({
  performances: M.performances,
  rounds: M.rounds,
  members: M.members,
  coupons: M.coupons,
  extraBookings: M.demoUserBookings(),
  patches: {},
  holds: { [M.rounds.find(r => r.perfId === 'p2')!.id]: ['A-1', 'A-2', 'A-3', 'A-4'] } as Record<string, string[]>,
  siteOnly: {},
  gradeOverrides: {},
  packageOrders: [],
  notices: M.notices,
  inquiries: M.inquiries,
  reviews: M.reviews,
  popups: M.popups,
  banners: M.banners,
  kopisLogs: M.buildKopisLogs(),
  auditLogs: M.auditLogs,
  sms: [] as Sms[],
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      adminId: null,
      lang: 'ko',
      fontScale: 'base',
      contrast: 'normal',
      toasts: [],
      pendingBooking: null,
      ...initialData(),

      set: p => set(p),
      toast: (text, tone = 'ok') => {
        const id = uid('t')
        set(s => ({ toasts: [...s.toasts, { id, text, tone }] }))
        setTimeout(() => get().dismissToast(id), 3200)
      },
      dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
      sendSms: (to, text, kind = '알림톡') => set(s => ({ sms: [{ id: uid('s'), at: nowStr(), to, text, kind }, ...s.sms].slice(0, 50) })),
      log: (action, target) => set(s => ({
        auditLogs: [{ id: uid('l'), at: nowStr(), who: s.adminId ? (M.adminUsers.find(a => a.id === s.adminId)?.loginId ?? 'admin') : 'admin', ip: '10.10.2.15', action, target }, ...s.auditLogs],
      })),

      login: loginId => {
        const m = get().members.find(x => x.loginId === loginId && x.status !== '탈퇴')
        if (!m) return null
        set(s => ({ userId: m.id, members: s.members.map(x => x.id === m.id ? { ...x, lastLoginAt: M.TODAY, status: '정상' } : x) }))
        return m
      },
      logout: () => set({ userId: null }),
      signup: data => {
        const m: Member = { ...data, id: uid('u'), joinedAt: M.TODAY, lastLoginAt: M.TODAY, favorites: [], status: '정상' }
        set(s => ({
          members: [...s.members, m], userId: m.id,
          coupons: [...s.coupons, { id: uid('c'), name: '신규가입 3,000원 할인', kind: '할인쿠폰', amount: 3000, minPrice: 15000, until: '2026-12-31', ownerId: m.id }],
        }))
        get().sendSms(m.phone, `[국립어린이청소년극단] ${m.name}님, 회원가입을 환영합니다! 신규가입 3,000원 할인쿠폰이 발급되었습니다.`)
        return m
      },
      updateMember: (id, p) => set(s => ({ members: s.members.map(m => m.id === id ? { ...m, ...p } : m) })),
      toggleFavorite: perfId => {
        const { userId } = get()
        if (!userId) return
        set(s => ({
          members: s.members.map(m => m.id !== userId ? m : {
            ...m, favorites: m.favorites.includes(perfId) ? m.favorites.filter(f => f !== perfId) : [...m.favorites, perfId],
          }),
        }))
      },
      joinMembership: tierId => {
        const { userId } = get()
        if (!userId) return
        const tier = M.tiers.find(t => t.id === tierId)!
        const m = get().members.find(x => x.id === userId)!
        set(s => ({
          members: s.members.map(x => x.id !== userId ? x : { ...x, membership: { tierId, since: M.TODAY, until: '2027-10-04', autoRenew: true } }),
          coupons: [...s.coupons, tierId === 'tier-tree'
            ? { id: uid('c'), name: '나무 멤버십 공연 예매권', kind: '예매권', rate: 1, until: '2027-10-04', ownerId: userId }
            : { id: uid('c'), name: '새싹 멤버십 5,000원 할인', kind: '할인쿠폰', amount: 5000, minPrice: 15000, until: '2027-10-04', ownerId: userId }],
        }))
        get().sendSms(m.phone, `[국립어린이청소년극단] ${tier.name} 멤버십 가입이 완료되었습니다. (유효기간 ~2027.10.04) 선예매·할인 혜택이 즉시 적용됩니다.`)
      },
      cancelMembership: () => {
        const { userId } = get()
        set(s => ({ members: s.members.map(x => x.id !== userId ? x : { ...x, membership: undefined }) }))
      },

      createBooking: b => {
        const seq = String(Math.floor(Math.random() * 90000) + 10000)
        const total = b.seats.reduce((a, s) => a + s.price, 0) - (b.couponDiscount ?? 0) + (b.fee ?? 0)
        const vacc = b.payMethod === '가상계좌'
        const booking: Booking = {
          id: `T${M.TODAY.replace(/-/g, '').slice(2)}${seq}`,
          perfId: b.perfId, roundId: b.roundId, userId: b.userId ?? get().userId ?? undefined,
          bookerName: b.bookerName, bookerPhone: b.bookerPhone, viewerName: b.viewerName,
          seats: b.seats, payMethod: b.payMethod,
          status: b.status ?? (vacc ? '입금대기' : b.channel === '현장' ? '발권완료' : '예매완료'),
          channel: b.channel, createdAt: nowStr(), couponId: b.couponId, couponDiscount: b.couponDiscount ?? 0, fee: b.fee ?? 0,
          total: Math.max(0, total), packageOrderId: b.packageOrderId,
          vaccount: vacc ? { bank: '국민은행', no: `940-2026-${seq}`, due: '2026-10-06 23:59' } : undefined,
          logs: [{ at: nowStr(), msg: `${b.channel} ${vacc ? '가상계좌 발급' : `결제 완료 (${b.payMethod})`}` }],
        }
        set(s => ({
          extraBookings: [booking, ...s.extraBookings],
          coupons: b.couponId ? s.coupons.map(c => c.id === b.couponId ? { ...c, usedBookingId: booking.id } : c) : s.coupons,
        }))
        const perf = get().performances.find(p => p.id === b.perfId)!
        const round = get().rounds.find(r => r.id === b.roundId)!
        if (b.channel !== '현장') {
          get().sendSms(b.bookerPhone, vacc
            ? `[국립어린이청소년극단] <${perf.title}> 가상계좌 ${booking.vaccount!.bank} ${booking.vaccount!.no} / ${booking.total.toLocaleString()}원 / 입금기한 ${booking.vaccount!.due}`
            : `[국립어린이청소년극단] <${perf.title}> 예매완료\n예매번호 ${booking.id}\n${round.date} ${round.time} / ${b.seats.map(s => s.seatId).join(', ')}\n모바일 티켓은 마이페이지에서 확인하세요.`)
        }
        return booking
      },
      patchBooking: (id, p, logMsg) => {
        const extra = get().extraBookings.find(b => b.id === id)
        const entry = logMsg ? [{ at: nowStr(), msg: logMsg }] : []
        if (extra) {
          set(s => ({ extraBookings: s.extraBookings.map(b => b.id === id ? { ...b, ...p, logs: [...b.logs, ...entry] } : b) }))
        } else {
          const prev = get().patches[id] ?? {}
          const base = SEED_BOOKINGS.find(b => b.id === id)
          set(s => ({ patches: { ...s.patches, [id]: { ...prev, ...p, logs: [...(prev.logs ?? base?.logs ?? []), ...entry] } } }))
        }
      },
      cancelSeats: (id, seatIds, reason) => {
        const b = getBooking(get(), id)
        if (!b) return
        const seats = b.seats.map(s => seatIds.includes(s.seatId) ? { ...s, cancelled: true } : s)
        const allCancelled = seats.every(s => s.cancelled)
        get().patchBooking(id, { seats, status: allCancelled ? '취소완료' : '부분취소' }, `${allCancelled ? '전체' : '부분'} 취소 (${seatIds.join(', ')})${reason ? ` / 사유: ${reason}` : ''}`)
        const perf = get().performances.find(p => p.id === b.perfId)!
        get().sendSms(b.bookerPhone, `[국립어린이청소년극단] <${perf.title}> 예매번호 ${id} ${seatIds.length}매 취소 완료. 환불은 결제수단에 따라 3~5영업일 소요됩니다.`)
      },
      issueBooking: id => {
        const b = getBooking(get(), id)
        if (!b) return
        get().patchBooking(id, { seats: b.seats.map(s => s.cancelled ? s : { ...s, issued: true }), status: b.status === '입금대기' ? b.status : '발권완료' }, '티켓 발권')
      },
      checkInSeat: (id, seatId) => {
        const b = getBooking(get(), id)
        if (!b) return 'notfound'
        const target = b.seats.filter(s => !seatId || s.seatId === seatId)
        if (!target.length) return 'notfound'
        if (target.every(s => s.cancelled)) return 'cancelled'
        if (target.every(s => s.used || s.cancelled)) return 'used'
        get().patchBooking(id, { seats: b.seats.map(s => (!seatId || s.seatId === seatId) && !s.cancelled ? { ...s, used: true, issued: true } : s) }, `검표 입장 처리${seatId ? ` (${seatId})` : ''}`)
        return 'ok'
      },

      createPackageOrder: o => {
        const order: PackageOrder = { ...o, id: uid('PK').toUpperCase(), createdAt: nowStr(), status: '결제완료' }
        set(s => ({ packageOrders: [order, ...s.packageOrders] }))
        return order
      },

      upsertPerformance: p => {
        set(s => ({ performances: s.performances.some(x => x.id === p.id) ? s.performances.map(x => x.id === p.id ? p : x) : [...s.performances, p] }))
        get().log('공연정보 저장', p.title)
      },
      setRounds: (perfId, rs) => {
        set(s => ({ rounds: [...s.rounds.filter(r => r.perfId !== perfId), ...rs] }))
        get().log('회차 정보 수정', `${get().performances.find(p => p.id === perfId)?.title} (${rs.length}회차)`)
      },
      setHold: (roundId, seats) => set(s => ({ holds: { ...s.holds, [roundId]: seats } })),
      setSiteOnly: (roundId, seats) => set(s => ({ siteOnly: { ...s.siteOnly, [roundId]: seats } })),
      setGrades: (perfId, map) => {
        set(s => ({ gradeOverrides: { ...s.gradeOverrides, [perfId]: map } }))
        get().log('좌석 등급 배정 변경', get().performances.find(p => p.id === perfId)?.title ?? perfId)
      },

      addInquiry: q => {
        set(s => ({ inquiries: [{ ...q, id: uid('q'), createdAt: nowStr(), status: '접수' }, ...s.inquiries] }))
        get().sendSms('담당자 메일', `[1:1 문의 접수] ${q.title} - ${q.name}`, '메일')
      },
      updateInquiry: (id, p) => {
        set(s => ({ inquiries: s.inquiries.map(q => q.id === id ? { ...q, ...p } : q) }))
        const q = get().inquiries.find(x => x.id === id)!
        if (p.answer) get().sendSms(q.email, `[국립어린이청소년극단] 문의하신 「${q.title}」에 답변이 등록되었습니다.`, '메일')
      },
      addReview: r => set(s => ({ reviews: [{ ...r, id: uid('rv'), createdAt: M.TODAY }, ...s.reviews] })),
      deleteReview: id => set(s => ({ reviews: s.reviews.filter(r => r.id !== id) })),
      upsertNotice: n => {
        set(s => ({ notices: s.notices.some(x => x.id === n.id) ? s.notices.map(x => x.id === n.id ? n : x) : [n, ...s.notices] }))
        get().log('게시물 저장', n.title)
      },
      deleteNotice: id => {
        const n = get().notices.find(x => x.id === id)
        set(s => ({ notices: s.notices.filter(x => x.id !== id) }))
        get().log('게시물 삭제', n?.title ?? id)
      },
      upsertPopup: p => {
        set(s => ({ popups: s.popups.some(x => x.id === p.id) ? s.popups.map(x => x.id === p.id ? p : x) : [...s.popups, p] }))
        get().log('팝업 저장', p.title)
      },
      upsertBanner: b => {
        set(s => ({ banners: s.banners.some(x => x.id === b.id) ? s.banners.map(x => x.id === b.id ? b : x) : [...s.banners, b] }))
        get().log('메인배너 저장', b.title)
      },
      issueCoupons: (memberIds, c) => {
        set(s => ({ coupons: [...s.coupons, ...memberIds.map(ownerId => ({ ...c, id: uid('c'), ownerId }))] }))
        get().log('쿠폰 일괄 발급', `${c.name} / ${memberIds.length}명`)
      },
      retryKopis: id => {
        set(s => ({ kopisLogs: s.kopisLogs.map(k => k.id === id ? { ...k, status: '재전송성공', sentAt: nowStr(), message: '관리자 수동 재전송 성공' } : k) }))
        get().log('통합전산망 수동 재전송', id)
      },
      resetDemo: () => {
        set({ ...initialData(), userId: null, toasts: [], pendingBooking: null })
      },
    }),
    {
      name: 'ntcy-demo-v1',
      partialize: s => {
        const { toasts, ...rest } = s
        void toasts
        return rest as unknown as State
      },
    },
  ),
)

// ── 셀렉터 / 헬퍼 ──
function getBooking(s: State, id: string): Booking | undefined {
  const extra = s.extraBookings.find(b => b.id === id)
  if (extra) return extra
  const base = SEED_BOOKINGS.find(b => b.id === id)
  return base ? { ...base, ...s.patches[id] } : undefined
}
export const findBooking = (id: string) => getBooking(useStore.getState(), id)

/** 전체 예매 (기존 시드 + 신규, 패치 반영) */
export function useBookings(): Booking[] {
  const extra = useStore(s => s.extraBookings)
  const patches = useStore(s => s.patches)
  return useMemo(() => [...extra, ...SEED_BOOKINGS.map(b => (patches[b.id] ? { ...b, ...patches[b.id] } : b))], [extra, patches])
}

export function useMe(): Member | null {
  const userId = useStore(s => s.userId)
  const members = useStore(s => s.members)
  return useMemo(() => members.find(m => m.id === userId) ?? null, [members, userId])
}

export function venueOf(p: Performance) { return M.venues.find(v => v.id === p.venueId)! }

export function gradeOf(perfId: string, seatId: string, overrides: State['gradeOverrides']): Grade {
  const p = useStore.getState().performances.find(x => x.id === perfId)!
  return overrides[perfId]?.[seatId] ?? M.defaultGrade(venueOf(p), seatId)
}

/** 회차별 좌석 상태 */
export function useSeatState(roundId: string | undefined) {
  const bookings = useBookings()
  const holds = useStore(s => s.holds)
  const siteOnly = useStore(s => s.siteOnly)
  return useMemo(() => {
    const sold = new Set<string>()
    const used = new Set<string>()
    if (roundId) {
      for (const b of bookings) {
        if (b.roundId !== roundId) continue
        for (const s of b.seats) if (!s.cancelled) { sold.add(s.seatId); if (s.used) used.add(s.seatId) }
      }
    }
    return { sold, used, held: new Set(roundId ? holds[roundId] ?? [] : []), siteOnly: new Set(roundId ? siteOnly[roundId] ?? [] : []) }
  }, [bookings, holds, siteOnly, roundId])
}

/** 회원의 할인 가능 권종 / 선예매 권한 */
export function memberTier(m: Member | null) {
  if (!m?.membership) return null
  return M.tiers.find(t => t.id === m.membership!.tierId) ?? null
}

export function ageOf(birth: string) {
  const b = new Date(birth)
  const t = new Date(M.TODAY)
  let a = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--
  return a
}

/** 판매 상태 → 예매 버튼 노출 (SFR-TC-008: 판매일 기준 자동 노출) */
export function saleState(p: Performance, me: Member | null): { canBook: boolean; presale: boolean; label: string } {
  const now = `${M.TODAY} ${new Date().toTimeString().slice(0, 5)}`
  if (p.status === '임시저장' || p.status === '판매중지') return { canBook: false, presale: false, label: '판매 준비중' }
  if (p.status === '판매종료' || p.end < M.TODAY) return { canBook: false, presale: false, label: '공연 종료' }
  if (p.status === '매진') return { canBook: false, presale: false, label: '매진' }
  if (now >= p.openAt) return { canBook: true, presale: false, label: '예매하기' }
  if (p.presaleAt && now >= p.presaleAt) {
    return memberTier(me) ? { canBook: true, presale: true, label: '멤버십 선예매' } : { canBook: false, presale: true, label: '멤버십 선예매 중' }
  }
  return { canBook: false, presale: false, label: `${p.openAt.slice(5, 10).replace('-', '.')} ${p.openAt.slice(11)} 오픈` }
}
