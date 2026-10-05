import { create } from 'zustand'
import * as M from '../data/mock'
import type { AdminUser, MembershipTier } from '../data/types'

/**
 * 관리자 전용 로컬 상태 (공유 store 에 없는 설정성 데이터).
 * 메뉴 이동 간 유지되며 새로고침 시 초기화됩니다. 홈페이지·POS 와 공유할 필요가 없는 값만 둡니다.
 */
export type SettleStatus = '정산대기' | '업체승인대기' | '정산완료' | '보류'
export type PayStatus = '미지급' | '지급요청' | '지급완료'

export interface SiteMenu { id: string; name: string; path: string; visible: boolean; children: SiteMenu[] }

interface AdminLocal {
  showPII: boolean
  piiReason: string
  adminUsers: AdminUser[]
  tiers: MembershipTier[]
  settle: Record<string, { status: SettleStatus; pay: PayStatus; prevStatus?: SettleStatus; memo?: string }>
  menus: SiteMenu[]
  siteInfo: { name: string; tel: string; addr: string; copyright: string; ceo: string; bizNo: string }
  set: (p: Partial<AdminLocal>) => void
}

const menu = (id: string, name: string, path: string, children: SiteMenu[] = []): SiteMenu => ({ id, name, path, visible: true, children })

export const useAdminLocal = create<AdminLocal>()(set => ({
  showPII: false,
  piiReason: '',
  adminUsers: M.adminUsers.map(a => ({ ...a })),
  tiers: M.tiers.map(t => ({ ...t })),
  settle: {},
  menus: [
    menu('m1', '공연', '/site/performances', [menu('m1-1', '공연 목록', '/site/performances'), menu('m1-2', '공연 일정', '/site/schedule'), menu('m1-3', '패키지', '/site/package')]),
    menu('m2', '멤버십', '/site/membership'),
    menu('m3', '극단소개', '/site/about', [menu('m3-1', '극단 소개', '/site/about'), menu('m3-2', '아카이브', '/site/archive'), menu('m3-3', '웹진', '/site/webzine'), menu('m3-4', '오디션', '/site/audition')]),
    menu('m4', '소식', '/site/notices', [menu('m4-1', '공지사항', '/site/notices'), menu('m4-2', 'FAQ', '/site/faq'), menu('m4-3', '1:1 문의', '/site/inquiry')]),
    menu('m5', '관람안내', '/site/guide', [menu('m5-1', '관람 안내', '/site/guide'), menu('m5-2', '정보공개', '/site/info')]),
  ],
  siteInfo: {
    name: '국립어린이청소년극단', tel: '1600-6261', addr: '서울특별시 용산구 청파로 373',
    copyright: '© National Theater Company for Children and Youth. All rights reserved.', ceo: '예술감독', bizNo: '104-82-12345',
  },
  set: p => set(p),
}))
