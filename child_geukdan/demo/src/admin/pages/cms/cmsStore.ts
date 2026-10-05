import { create } from 'zustand'

/** CMS 전용 로컬 설정 (게시판 설정·금칙어·SNS 등) – 메뉴 이동 간 유지 */
export type Skin = '일반형' | '뉴스형' | '갤러리형'
export type PermAction = '목록' | '읽기' | '쓰기' | '댓글' | '첨부'
export type PermRole = '관리자' | '회원' | '비회원'
export const PERM_ACTIONS: PermAction[] = ['목록', '읽기', '쓰기', '댓글', '첨부']
export const PERM_ROLES: PermRole[] = ['관리자', '회원', '비회원']
export const ALL_EXTS = ['hwp', 'hwpx', 'pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'gif', 'zip', 'mp4']

export interface BoardCfg {
  id: string
  name: string
  skin: Skin
  use: boolean
  perms: Record<PermAction, Record<PermRole, boolean>>
  exts: string[]
  maxMB: number
  maxCount: number
  comment: boolean
  secret: boolean
}

const perms = (write: PermRole[], comment: PermRole[] = ['관리자', '회원']): BoardCfg['perms'] => ({
  목록: { 관리자: true, 회원: true, 비회원: true },
  읽기: { 관리자: true, 회원: true, 비회원: true },
  쓰기: { 관리자: write.includes('관리자'), 회원: write.includes('회원'), 비회원: write.includes('비회원') },
  댓글: { 관리자: comment.includes('관리자'), 회원: comment.includes('회원'), 비회원: comment.includes('비회원') },
  첨부: { 관리자: true, 회원: write.includes('회원'), 비회원: false },
})
const DEF_EXT = ['hwp', 'pdf', 'docx', 'xlsx', 'jpg', 'png', 'zip']
const board = (id: string, name: string, skin: Skin, p: BoardCfg['perms'], extra: Partial<BoardCfg> = {}): BoardCfg => ({
  id, name, skin, use: true, perms: p, exts: [...DEF_EXT], maxMB: 10, maxCount: 5, comment: false, secret: false, ...extra,
})

export const DEFAULT_BOARDS: BoardCfg[] = [
  board('notice', '공지사항', '일반형', perms(['관리자'], [])),
  board('perf', '공연소식', '뉴스형', perms(['관리자'], ['관리자', '회원']), { comment: true }),
  board('recruit', '채용', '일반형', perms(['관리자'], [])),
  board('bid', '입찰', '일반형', perms(['관리자'], [])),
  board('event', '이벤트', '갤러리형', perms(['관리자'], ['관리자', '회원']), { comment: true }),
  board('webzine', '웹진', '갤러리형', perms(['관리자'], [])),
  board('faq', 'FAQ', '일반형', perms(['관리자'], [])),
  board('qna', '1:1문의', '일반형', { ...perms(['관리자', '회원', '비회원'], ['관리자']), 목록: { 관리자: true, 회원: true, 비회원: false } }, { secret: true, maxCount: 1 }),
]

/** 게시물 분류 → 게시판 설정 매핑 */
export const CATEGORY_BOARD: Record<string, string> = { 공지: 'notice', 공연: 'perf', 채용: 'recruit', 입찰: 'bid', 이벤트: 'event' }

interface CmsLocal {
  boards: BoardCfg[]
  badWords: string[]
  autoBlind: boolean
  blinded: Record<string, string> // reviewId -> 원문
  sns: { id: string; name: string; url: string; on: boolean }[]
  set: (p: Partial<CmsLocal>) => void
}

export const useCmsLocal = create<CmsLocal>()(set => ({
  boards: DEFAULT_BOARDS,
  badWords: ['바보', '광고', '홍보문의', '도박', '카톡상담'],
  autoBlind: true,
  blinded: {},
  sns: [
    { id: 'insta', name: '인스타그램', url: 'https://instagram.com/ntcy_official', on: true },
    { id: 'youtube', name: '유튜브', url: 'https://youtube.com/@ntcy', on: true },
    { id: 'kakao', name: '카카오톡 채널', url: 'https://pf.kakao.com/_ntcy', on: true },
    { id: 'blog', name: '네이버 블로그', url: 'https://blog.naver.com/ntcy', on: false },
  ],
  set: p => set(p),
}))

export const uid = (p: string) => p + Math.random().toString(36).slice(2, 8)
