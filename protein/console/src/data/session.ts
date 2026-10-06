/* 역할별 세부 권한 (읽기 전용).

   화면은 useRole() 로 현재 역할을 읽고 can(role, cap) 으로 "이 동작을 할 수 있는지"만 판단한다.
   역할 전환 UI 는 사이드바 한 곳에만 두고, 전환 결과는 window 이벤트 'rapid:role' 로 전달받는다.
   (detail 은 'admin' 같은 문자열이거나 { role: 'admin' } 형태 모두 받는다.)

   허용 역할은 권한 매트릭스 화면이 쓰는 PERMS 표와 같은 값을 유지한다. */

import { useSyncExternalStore } from 'react'

export type SessionRole = 'admin' | 'researcher' | 'viewer' | 'agent'

export const SESSION_ROLE_LABEL: Record<SessionRole, string> = {
  admin: '관리자',
  researcher: '연구자',
  viewer: '일반 사용자',
  agent: '외부 연계',
}

const ROLE_KEYS: SessionRole[] = ['admin', 'researcher', 'viewer', 'agent']

function isRole(v: unknown): v is SessionRole {
  return typeof v === 'string' && (ROLE_KEYS as string[]).includes(v)
}

function pickRole(d: unknown): SessionRole | null {
  if (isRole(d)) return d
  if (d && typeof d === 'object') {
    const r = (d as { role?: unknown }).role
    if (isRole(r)) return r
  }
  return null
}

/* ─────────────────────────────────────────────────────────────
   기능 단위 권한 (cap)
   ───────────────────────────────────────────────────────────── */

export type Cap =
  | 'run_execute'
  | 'checkpoint_approve'
  | 'artifact_download'
  | 'report_create'
  | 'model_request'
  | 'model_approve'
  | 'endpoint_patch'
  | 'audit_read'
  | 'secret_manage'

export interface CapSpec {
  cap: Cap
  /* 권한 매트릭스 표의 기능 이름과 같은 문구 */
  label: string
  roles: SessionRole[]
  /* 이 권한이 실제로 걸려 있는 화면과 동작 */
  where: string
}

export const CAPS: CapSpec[] = [
  {
    cap: 'run_execute', label: '실행과 중지',
    roles: ['admin', 'researcher', 'agent'],
    where: '실행 상세: 실행 중지, 재개, 단계 재실행',
  },
  {
    cap: 'checkpoint_approve', label: '체크포인트 승인',
    roles: ['admin', 'researcher'],
    where: '실행 상세: 검토 게이트의 다음 단계 계속',
  },
  {
    cap: 'artifact_download', label: '산출물 다운로드',
    roles: ['admin', 'researcher', 'viewer', 'agent'],
    where: '실행 상세 산출물 탭, 결과 버전 보기',
  },
  {
    cap: 'report_create', label: '보고서 생성',
    roles: ['admin', 'researcher', 'agent'],
    where: '보고서: 생성, 저장, 패키지 내보내기 · 라운드: 결과 버전 되돌리기',
  },
  {
    cap: 'model_request', label: '모델 등록 요청',
    roles: ['admin', 'researcher'],
    where: '등록 모델: 모델 등록 요청',
  },
  {
    cap: 'model_approve', label: '모델 운영 승인',
    roles: ['admin'],
    where: '등록 모델: 운영 승인, 롤백 · 실행 제공자: 저장, 헬스 체크',
  },
  {
    cap: 'endpoint_patch', label: '엔드포인트 패치',
    roles: ['admin'],
    where: '엔드포인트 상세: 설정 패치 적용, 빠른 작업',
  },
  {
    cap: 'audit_read', label: '감사 로그 조회',
    roles: ['admin'],
    where: '사용자 · 보안: 감사 로그 화면 전체',
  },
  {
    cap: 'secret_manage', label: '시크릿 관리',
    roles: ['admin'],
    where: 'API 키 · REST API 연동의 연계 계정 화면',
  },
]

const CAP_INDEX = new Map<Cap, CapSpec>(CAPS.map(c => [c.cap, c]))

/* PERMS 표의 기능 이름 → cap. 권한 매트릭스 화면에서 표와 실제 동작을 잇는 데 쓴다. */
export const PERM_CAP: Record<string, Cap> = {
  '실행 / 중지': 'run_execute',
  '체크포인트 승인': 'checkpoint_approve',
  '산출물 다운로드': 'artifact_download',
  '보고서 생성': 'report_create',
  '모델 등록 요청': 'model_request',
  '모델 운영 승인': 'model_approve',
  '엔드포인트 패치': 'endpoint_patch',
  '감사 로그 조회': 'audit_read',
  '시크릿 관리': 'secret_manage',
}

/* 권한 판정. 같은 화면 안에서도 이 결과로 동작을 제한한다. */
export function can(role: SessionRole, cap: Cap): boolean {
  return CAP_INDEX.get(cap)?.roles.includes(role) ?? false
}

export function capLabel(cap: Cap): string {
  return CAP_INDEX.get(cap)?.label ?? cap
}

export function capWhere(cap: Cap): string {
  return CAP_INDEX.get(cap)?.where ?? '-'
}

export function capRolesText(cap: Cap): string {
  const s = CAP_INDEX.get(cap)
  if (!s) return '-'
  if (s.roles.length === ROLE_KEYS.length) return '모든 역할'
  return s.roles.map(r => SESSION_ROLE_LABEL[r]).join(' · ')
}

/* 권한이 없는 버튼에 붙이는 안내. 버튼은 숨기지 않고 비활성 상태로 두고 이 문구를 title 에 넣는다. */
export function denyTitle(role: SessionRole, cap: Cap): string {
  return `${SESSION_ROLE_LABEL[role]} 권한으로는 할 수 없습니다. ${capLabel(cap)} 허용 역할: ${capRolesText(cap)}`
}

/* 권한이 있으면 undefined, 없으면 안내 문구를 돌려준다. 버튼 title 에 그대로 넣는다. */
export function gateTitle(role: SessionRole, cap: Cap): string | undefined {
  return can(role, cap) ? undefined : denyTitle(role, cap)
}

/* 화면별 안내 한 줄. 그 화면에서 쓰는 cap 만 모아 할 수 있는 것과 없는 것을 적는다.
   예) '연구자 권한: 실행과 중지, 체크포인트 승인 가능, 엔드포인트 패치 불가' */
export function roleNote(role: SessionRole, caps: Cap[]): string {
  const ok = caps.filter(c => can(role, c)).map(capLabel)
  const no = caps.filter(c => !can(role, c)).map(capLabel)
  const parts = [ok.length ? `${ok.join(', ')} 가능` : '이 화면에서 바꿀 수 있는 항목 없음']
  if (no.length) parts.push(`${no.join(', ')} 불가`)
  return `${SESSION_ROLE_LABEL[role]} 권한: ${parts.join(', ')}`
}

/* ─────────────────────────────────────────────────────────────
   역할 저장소. 기본값은 연구자.
   ───────────────────────────────────────────────────────────── */

let currentRole: SessionRole = 'researcher'
const roleListeners = new Set<() => void>()

export const roleStore = {
  getRole: (): SessionRole => currentRole,
  setRole(r: SessionRole) {
    if (r === currentRole) return
    currentRole = r
    roleListeners.forEach(fn => fn())
  },
  subscribe(fn: () => void) {
    roleListeners.add(fn)
    return () => { roleListeners.delete(fn) }
  },
}

/* 사이드바의 역할 전환을 받아 쓴다. 이 파일은 전환 UI 를 만들지 않는다. */
if (typeof window !== 'undefined') {
  window.addEventListener('rapid:role', ev => {
    const next = pickRole((ev as CustomEvent<unknown>).detail)
    if (next) roleStore.setRole(next)
  })
}

/* 읽기 전용 훅 */
export function useRole(): SessionRole {
  return useSyncExternalStore(roleStore.subscribe, roleStore.getRole, roleStore.getRole)
}
