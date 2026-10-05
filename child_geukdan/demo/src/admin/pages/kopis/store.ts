import { create } from 'zustand'

export interface Contact { id: string; name: string; phone: string; role: string }

interface KopisLocal {
  contacts: Contact[]
  notifyFail: boolean
  notifyRetry: boolean
  autoRetry: boolean
  set: (p: Partial<Omit<KopisLocal, 'set'>>) => void
}

/** 통합전산망 알림 설정 (관리자 로컬) */
export const useKopisLocal = create<KopisLocal>(set => ({
  contacts: [
    { id: 'c1', name: '정보화담당 최민호', phone: '010-4821-3307', role: '정' },
    { id: 'c2', name: '티켓운영 김하늘', phone: '010-5530-2218', role: '부' },
  ],
  notifyFail: true,
  notifyRetry: true,
  autoRetry: true,
  set: p => set(p),
}))
