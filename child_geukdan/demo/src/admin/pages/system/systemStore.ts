import { create } from 'zustand'
import * as M from '../../../data/mock'
import type { AdminUser, TicketType } from '../../../data/types'

/** 시스템설정 로컬 상태 (권한·코드·카드 등 기준정보) – 메뉴 이동 간 유지 */
export type Role = AdminUser['role']
export type Level = '없음' | '조회' | '편집'
export const ROLES: Role[] = ['시스템관리자', '공연운영', '티켓매니저', 'CMS운영']
export const MENUS = ['대시보드', '공연관리', '좌석관리', '예매관리', '발권·검표', '정산관리', '판매보고서', 'KOPIS', '패키지', '유료회원', '회원·CRM', 'CMS', '통계', '시스템설정'] as const
export type MenuName = typeof MENUS[number]

const lv = (edit: MenuName[], view: MenuName[]) => Object.fromEntries(MENUS.map(m => [m, edit.includes(m) ? '편집' : view.includes(m) ? '조회' : '없음'])) as Record<MenuName, Level>
export const DEFAULT_PERMS: Record<Role, Record<MenuName, Level>> = {
  시스템관리자: lv([...MENUS], []),
  공연운영: lv(['공연관리', '좌석관리', '예매관리', '발권·검표', '패키지', 'KOPIS'], ['대시보드', '정산관리', '판매보고서', '유료회원', '회원·CRM', '통계']),
  티켓매니저: lv(['예매관리', '발권·검표'], ['대시보드', '좌석관리', '공연관리']),
  CMS운영: lv(['CMS'], ['대시보드', '통계', '회원·CRM']),
}

export const CARD_COMPANIES = [
  { code: '01', name: '비씨카드', pg: 2.1 }, { code: '02', name: 'KB국민카드', pg: 2.05 }, { code: '03', name: '하나카드', pg: 2.1 },
  { code: '04', name: '삼성카드', pg: 2.2 }, { code: '06', name: '신한카드', pg: 2.0 }, { code: '07', name: '현대카드', pg: 2.2 },
  { code: '08', name: '롯데카드', pg: 2.15 }, { code: '11', name: 'NH농협카드', pg: 1.9 }, { code: '12', name: '우리카드', pg: 2.0 },
  { code: '15', name: '씨티카드', pg: 2.3 }, { code: '21', name: '광주은행', pg: 2.0 }, { code: '31', name: '카카오뱅크', pg: 1.8 },
]

export interface Bin { bin: string; card: string; kind: '신용' | '체크'; memo: string; at: string; by: string }
export interface CardGroup { id: string; name: string; cards: string[]; rate: number; from: string; to: string; active: boolean }
export interface Label { id: string; kind: '발권 라벨' | '좌석 표기'; text: string; desc: string; at: string }
export interface Code { code: string; name: string; order: number; use: boolean; desc?: string }
export interface CodeGroup { id: string; name: string; desc: string; codes: Code[] }
export interface Ip { id: string; ip: string; desc: string; at: string }

const codes = (list: [string, string][]): Code[] => list.map(([code, name], i) => ({ code, name, order: i + 1, use: true }))

interface SysLocal {
  ips: Ip[]
  perms: Record<Role, Record<MenuName, Level>>
  genres: string[]
  codeRule: { prefix: string; digits: number; sep: string }
  ticketTypes: TicketType[]
  bins: Bin[]
  cardGroups: CardGroup[]
  labels: Label[]
  codeGroups: CodeGroup[]
  set: (p: Partial<SysLocal>) => void
}

export const useSysLocal = create<SysLocal>()(set => ({
  ips: [
    { id: 'ip1', ip: '10.10.2.0/24', desc: '본관 사무실 내부망', at: '2026-09-01' },
    { id: 'ip2', ip: '10.10.5.0/24', desc: '매표소 POS 단말', at: '2026-09-01' },
    { id: 'ip3', ip: '211.43.120.17', desc: '원격 유지보수 (VPN)', at: '2026-09-20' },
  ],
  perms: structuredClone(DEFAULT_PERMS),
  genres: ['연극', '음악극', '인형극', '무용극', '렉처퍼포먼스'],
  codeRule: { prefix: 'NTCY', digits: 2, sep: '-' },
  ticketTypes: M.ticketTypes.map(t => ({ ...t })),
  bins: [
    { bin: '940915', card: '신한카드', kind: '신용', memo: '문화누리 제휴', at: '2026-09-10 14:02', by: 'admin' },
    { bin: '625817', card: 'NH농협카드', kind: '체크', memo: '문화누리카드', at: '2026-09-10 14:05', by: 'admin' },
    { bin: '457972', card: 'KB국민카드', kind: '신용', memo: '청소년 할인 제휴', at: '2026-09-21 10:30', by: 'sky.kim' },
  ],
  cardGroups: [
    { id: 'cg1', name: '문화누리카드 할인', cards: ['NH농협카드', '신한카드'], rate: 0.1, from: '2026-10-01', to: '2026-12-31', active: true },
    { id: 'cg2', name: 'KB 청소년 제휴', cards: ['KB국민카드'], rate: 0.15, from: '2026-10-01', to: '2027-02-28', active: true },
  ],
  labels: [
    { id: 'lb1', kind: '발권 라벨', text: '휠체어 동반석', desc: '휠체어석 동반 1인 티켓 상단 표기', at: '2026-09-01' },
    { id: 'lb2', kind: '발권 라벨', text: '수어통역 회차', desc: '수어통역 회차 티켓 하단 표기', at: '2026-09-01' },
    { id: 'lb3', kind: '좌석 표기', text: '시야 제한석', desc: 'A열 1·12번 기둥 시야 제한', at: '2026-09-05' },
  ],
  codeGroups: [
    { id: 'BKST', name: '예매상태', desc: '예매 진행 상태', codes: codes([['BK01', '입금대기'], ['BK02', '예매완료'], ['BK03', '발권완료'], ['BK04', '부분취소'], ['BK05', '취소완료'], ['BK06', '관람완료']]) },
    { id: 'PAYM', name: '결제수단', desc: '결제 수단 구분', codes: codes([['PM01', '신용카드'], ['PM02', '가상계좌'], ['PM03', '간편결제'], ['PM04', '현금'], ['PM05', '초대']]) },
    { id: 'CHNL', name: '채널', desc: '판매 채널', codes: codes([['CH01', '홈페이지'], ['CH02', '모바일'], ['CH03', '현장'], ['CH04', '콜센터'], ['CH05', '외부예매처']]) },
    { id: 'CNCL', name: '취소사유', desc: '예매 취소 사유', codes: codes([['CR01', '고객 단순 변심'], ['CR02', '일정 변경'], ['CR03', '공연 취소'], ['CR04', '중복 결제'], ['CR05', '좌석 변경'], ['CR99', '기타']]) },
    { id: 'INQT', name: '문의유형', desc: '1:1 문의 분류', codes: codes([['IQ01', '예매'], ['IQ02', '취소·환불'], ['IQ03', '회원'], ['IQ04', '단체관람'], ['IQ05', '기타'], ['IQ06', 'VOC']]) },
  ],
  set: p => set(p),
}))

export const uid = (p: string) => p + Math.random().toString(36).slice(2, 8)
