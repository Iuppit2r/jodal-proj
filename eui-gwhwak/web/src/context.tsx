import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type Role = 'public' | 'staff' | 'admin'
export const ROLE_LABEL: Record<Role, string> = { public: '대국민', staff: '내부직원', admin: '관리자' }

type AppCtx = {
  role: Role
  setRole: (r: Role) => void
  toast: (msg: string) => void
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('staff')
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])
  return (
    <Ctx.Provider value={{ role, setRole, toast }}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </Ctx.Provider>
  )
}

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('AppProvider missing')
  return c
}
