import { create } from 'zustand'
import * as M from '../../../data/mock'
import type { Genre, Grade, PerfStatus, Performance, Round } from '../../../data/types'

export const STATUSES: PerfStatus[] = ['임시저장', '오픈예정', '선예매중', '판매중', '매진', '판매종료', '판매중지']
export const GENRES: Genre[] = ['연극', '음악극', '인형극', '무용극', '렉처퍼포먼스']
export const TARGETS: Performance['target'][] = ['어린이', '청소년', '가족']
export const AGE_LIMITS = ['전체관람가', '24개월 이상', '36개월 이상', '만 5세 이상', '만 6세 이상', '만 7세 이상', '만 10세 이상', '만 13세 이상', '만 15세 이상']
export const MOTIFS: { value: Performance['motif']; label: string }[] = [
  { value: 'moon', label: '달' }, { value: 'star', label: '별' }, { value: 'wave', label: '파도' }, { value: 'bus', label: '버스' },
  { value: 'bird', label: '새' }, { value: 'tree', label: '나무' }, { value: 'box', label: '상자' },
]
export const GRADES: Grade[] = ['R', 'S', 'A', 'W']
export const ACCESS_OPTIONS = ['수어통역', '음성해설', '한글자막', '릴랙스드 퍼포먼스', '휠체어석', '보청기 대여', '유모차 보관', '점자 프로그램북']
export const NOTE_OPTIONS = ['수어통역', '음성해설', '릴랙스드 퍼포먼스', '관객과의 대화', '한글자막']
export const DISTANCING: { value: NonNullable<Round['distancing']>; label: string }[] = [
  { value: 'none', label: '미적용' }, { value: 'together', label: '일행 착석' }, { value: 'apart', label: '한 칸 띄우기' },
]
export const distLabel = (d?: Round['distancing']) => DISTANCING.find(x => x.value === (d ?? 'none'))!.label

/** 'YYYY-MM-DD HH:mm' ↔ datetime-local */
export const toLocalInput = (s?: string) => (s ? s.replace(' ', 'T') : '')
export const fromLocalInput = (s: string) => s.replace('T', ' ')

/** 공연코드 자동채번: NTCY-YYYY-NN */
export function nextCode(perfs: Performance[], year: string) {
  const re = new RegExp(`^NTCY-${year}-(\\d+)$`)
  const max = perfs.reduce((m, p) => { const r = re.exec(p.code); return r ? Math.max(m, Number(r[1])) : m }, 0)
  return `NTCY-${year}-${String(max + 1).padStart(2, '0')}`
}

export const newId = (p = 'p') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function blankPerf(perfs: Performance[]): Performance {
  return {
    id: newId('p'), code: nextCode(perfs, '2026'), title: '', titleEn: '', subtitle: '', genre: '연극', ageLimit: '만 5세 이상',
    target: '어린이', runtime: 70, venueId: 'v1', start: '2026-12-01', end: '2026-12-20', status: '임시저장',
    openAt: '2026-11-01 14:00', presaleAt: '2026-10-29 14:00', producer: '국립어린이청소년극단', manager: '김하늘',
    prices: { R: 30000, S: 25000, A: 20000, W: 15000 }, palette: ['#1d2b6b', '#ffd23f', '#ff8a73'], motif: 'star',
    summary: '', description: '', credits: [{ role: '작', name: '' }, { role: '연출', name: '' }], cast: [], tags: [],
    accessibility: [], feeRate: 0, isRental: false, packageEligible: true, incomeDeduction: true,
  }
}

/* ── 회차 자동 생성 ── */
export interface RoundRule { id: string; days: number[]; times: string[] }
export const DOW = ['일', '월', '화', '수', '목', '금', '토']
export const defaultRules = (target: Performance['target']): RoundRule[] => target === '청소년'
  ? [{ id: 'r1', days: [2, 3, 4, 5], times: ['19:30'] }, { id: 'r2', days: [0, 6], times: ['15:00'] }]
  : [{ id: 'r1', days: [2, 3, 4, 5], times: ['11:00'] }, { id: 'r2', days: [0, 6], times: ['11:00', '14:00'] }]

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function generateSlots(start: string, end: string, rules: RoundRule[], exclude: string[]): { date: string; time: string }[] {
  if (!start || !end || start > end) return []
  const out: { date: string; time: string }[] = []
  const d = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  let guard = 0
  while (d <= e && guard++ < 800) {
    const ds = ymd(d)
    if (!exclude.includes(ds)) {
      const times = new Set<string>()
      for (const r of rules) if (r.days.includes(d.getDay())) r.times.filter(Boolean).forEach(t => times.add(t))
      for (const t of [...times].sort()) out.push({ date: ds, time: t })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}
/** 일자·시간순 정렬 후 회차번호 재부여 */
export const renumber = (rs: Round[]) => [...rs].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((r, i) => ({ ...r, no: i + 1 }))

/* ── 공연 부가설정 (Performance 타입 외 항목 – 관리자 로컬 보관) ── */
export interface PresaleCfg { tiers: string[]; channels: string[]; roundMode: 'all' | 'selected'; roundIds: string[]; buttonTitle: string; limit: number }
export interface LayoutCfg { fields: Record<string, boolean>; size: '80mm' | 'A4'; code: 'qr' | 'barcode'; notice: string }
export interface PerfExtras { ticketTypes: string[]; mainImage?: string; mainImageName?: string; images: { url: string; name: string }[]; presale: PresaleCfg; layout: LayoutCfg }

export const TICKET_FIELDS = ['공연명', '일시', '좌석', '권종', '가격', '예매번호', '공연장', '유의사항'] as const
export const defaultExtras = (): PerfExtras => ({
  ticketTypes: M.ticketTypes.filter(t => t.id !== 't-inv').map(t => t.id),
  images: [],
  presale: { tiers: M.tiers.map(t => t.id), channels: ['홈페이지', '모바일'], roundMode: 'all', roundIds: [], buttonTitle: '멤버십 인증하고 선예매', limit: 4 },
  layout: { fields: Object.fromEntries(TICKET_FIELDS.map(f => [f, true])), size: '80mm', code: 'qr', notice: '공연 시작 후 입장이 제한될 수 있습니다. 본 티켓은 재판매할 수 없습니다.' },
})

export const usePerfExtras = create<{ map: Record<string, PerfExtras>; put: (id: string, e: PerfExtras) => void }>(set => ({
  map: {},
  put: (id, e) => set(s => ({ map: { ...s.map, [id]: e } })),
}))

/* ── 유효성 검사 (E-TC-102) ── */
export type Errors = Record<string, string>
export const FIELD_TAB: Record<string, string> = {
  title: 'basic', code: 'basic', producer: 'basic', venueId: 'basic', start: 'basic', end: 'basic', manager: 'basic', runtime: 'basic',
  ageLimit: 'basic', feeRate: 'basic', prices: 'price', ticketTypes: 'price', summary: 'content', openAt: 'open', presaleAt: 'open', rounds: 'rounds',
}
export const TAB_ORDER = ['basic', 'price', 'content', 'open', 'rounds', 'presale', 'layout']

export function validateBasic(p: Performance): Errors {
  const e: Errors = {}
  if (!p.title.trim()) e.title = '공연명을 입력해 주세요'
  if (!/^NTCY-\d{4}-\d{2,}$/.test(p.code)) e.code = '공연코드 형식이 올바르지 않습니다 (NTCY-YYYY-NN)'
  if (!p.producer.trim()) e.producer = '기획사를 입력해 주세요'
  if (!p.venueId) e.venueId = '공연장을 선택해 주세요'
  if (!p.start) e.start = '공연 시작일을 입력해 주세요'
  if (!p.end) e.end = '공연 종료일을 입력해 주세요'
  else if (p.start && p.end < p.start) e.end = '종료일이 시작일보다 빠릅니다'
  if (!p.manager) e.manager = '담당자를 선택해 주세요'
  if (!p.ageLimit) e.ageLimit = '관람등급을 선택해 주세요'
  if (!(p.runtime > 0)) e.runtime = '관람시간(분)을 입력해 주세요'
  if (p.isRental && !(p.feeRate > 0)) e.feeRate = '대관 공연은 정산 수수료율을 입력해 주세요'
  return e
}
export function validateAll(p: Performance, rounds: Round[], ex: PerfExtras): Errors {
  const e = validateBasic(p)
  if (!GRADES.some(g => (p.prices[g] ?? 0) > 0)) e.prices = '1개 이상의 좌석 등급 가격을 입력해 주세요'
  if (!ex.ticketTypes.length) e.ticketTypes = '1개 이상의 권종을 선택해 주세요'
  if (!p.summary.trim()) e.summary = '줄거리(요약)를 입력해 주세요'
  if (!p.openAt) e.openAt = '티켓오픈 일시를 입력해 주세요'
  if (p.presaleAt && p.openAt && p.presaleAt >= p.openAt) e.presaleAt = '선예매 시작일시는 티켓오픈 이전이어야 합니다'
  if (!rounds.some(r => r.active)) e.rounds = '사용 중인 회차가 1개 이상 필요합니다'
  return e
}

/** 간이 마크다운 → HTML (에디터 미리보기/HTML 소스 보기) */
export function mdToHtml(src: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s: string) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  const lines = src.split('\n')
  const out: string[] = []
  let list = false
  for (const l of lines) {
    if (/^\s*-\s+/.test(l)) {
      if (!list) { out.push('<ul>'); list = true }
      out.push(`  <li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`)
      continue
    }
    if (list) { out.push('</ul>'); list = false }
    if (l.trim()) out.push(`<p>${inline(l)}</p>`)
  }
  if (list) out.push('</ul>')
  return out.join('\n')
}

/** 탭 공통 props */
export interface TabProps {
  p: Performance
  set: (patch: Partial<Performance>) => void
  errors: Errors
  ex: PerfExtras
  setEx: (patch: Partial<PerfExtras>) => void
}
