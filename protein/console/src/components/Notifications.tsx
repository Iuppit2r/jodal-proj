import { useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, Clock, UserPlus } from 'lucide-react'

/* 알림. 프로젝트 초대처럼 바로 수락·거절이 필요한 것과
   체크포인트 대기나 실행 실패처럼 확인만 하면 되는 것을 한 곳에 모은다. */

export type NotiKind = 'invite' | 'gate' | 'failed' | 'approval' | 'done'

export interface Noti {
  id: string
  kind: NotiKind
  title: string
  body: string
  at: string
  read: boolean
  /* 초대는 수락·거절, 나머지는 해당 화면으로 보낸다 */
  to?: string
}

const SEED: Noti[] = [
  {
    id: 'n1', kind: 'invite', at: '방금', read: false,
    title: 'PD-L1 결합 미니바인더 프로젝트 초대',
    body: '이박사 님이 편집 권한으로 초대했습니다.',
  },
  {
    id: 'n2', kind: 'gate', at: '12분 전', read: false,
    title: 'run_0421 체크포인트 검토 대기',
    body: 'soluprot 단계에서 멈췄습니다. 1,200개 중 318개가 통과했습니다.',
    to: '/monitor/run_0421',
  },
  {
    id: 'n3', kind: 'failed', at: '1시간 전', read: false,
    title: 'run_0415 rfd3 단계 2회 실패',
    body: '입력 PDB 체인 B에 결손 잔기가 있어 백본 생성이 중단되었습니다.',
    to: '/monitor/run_0415',
  },
  {
    id: 'n4', kind: 'approval', at: '어제', read: true,
    title: 'Boltz-2 모델 승인 요청',
    body: '김연구 님이 신규 모델 등록을 요청했습니다.',
    to: '/models?role=admin',
  },
  {
    id: 'n5', kind: 'done', at: '어제', read: true,
    title: 'run_0418 완료',
    body: '최종 단계까지 끝났고 후보 142건이 남았습니다.',
    to: '/analyze?run=run_0418',
  },
]

let state: Noti[] = SEED
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(fn => fn())

export const notiStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
  all: () => state,
  read(id: string) { state = state.map(n => (n.id === id ? { ...n, read: true } : n)); emit() },
  readAll() { state = state.map(n => ({ ...n, read: true })); emit() },
  remove(id: string) { state = state.filter(n => n.id !== id); emit() },
}

const ICON: Record<NotiKind, typeof Bell> = {
  invite: UserPlus, gate: Clock, failed: AlertTriangle, approval: CheckCircle2, done: CheckCircle2,
}
const TONE: Record<NotiKind, string> = {
  invite: 'var(--brand)', gate: 'var(--warn)', failed: 'var(--err)',
  approval: 'var(--accent)', done: 'var(--ok)',
}

export function Notifications({ onToast }: { onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const items = useSyncExternalStore(notiStore.subscribe, notiStore.all)
  const unread = items.filter(n => !n.read).length
  const nav = useNavigate()

  return (
    <div className="noti">
      <button className="noti-btn" onClick={() => setOpen(o => !o)}>
        <Bell size={16} />
        <span>알림</span>
        {unread > 0 && <span className="noti-dot">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="noti-back" onClick={() => setOpen(false)} />
          <div className="noti-menu">
            <div className="noti-head">
              <b>알림</b>
              <span className="faint">읽지 않음 {unread}건</span>
              <button className="btn ghost sm" onClick={() => { notiStore.readAll(); onToast('모두 읽음으로 표시') }}>
                모두 읽음
              </button>
            </div>
            <div className="noti-list">
              {items.length === 0 && <div className="empty">새 알림이 없습니다.</div>}
              {items.map(n => {
                const Icon = ICON[n.kind]
                return (
                  <div key={n.id} className={'noti-item' + (n.read ? '' : ' unread')}>
                    <Icon size={16} color={TONE[n.kind]} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{n.title}</div>
                      <p className="muted">{n.body}</p>
                      <div className="row" style={{ gap: 6, marginTop: 8 }}>
                        <span className="faint">{n.at}</span>
                        <div className="sp" />
                        {n.kind === 'invite' ? (
                          <>
                            <button className="btn sm ghost" onClick={() => {
                              notiStore.remove(n.id)
                              onToast('초대를 거절했습니다')
                            }}>거절</button>
                            <button className="btn sm primary" onClick={() => {
                              notiStore.remove(n.id); setOpen(false)
                              onToast('초대를 수락했습니다. 프로젝트에 참여합니다')
                              nav('/projects')
                            }}>수락</button>
                          </>
                        ) : (
                          <button className="btn sm ghost" onClick={() => {
                            notiStore.read(n.id); setOpen(false)
                            if (n.to) nav(n.to)
                          }}>열기</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
