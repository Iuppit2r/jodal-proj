import type { ReactNode } from 'react'

export function Card({ title, sub, right, children, flush, req }: {
  title?: string; sub?: string; right?: ReactNode; children: ReactNode; flush?: boolean; req?: string
}) {
  return (
    <section className="card">
      {title && (
        <header className="card-h">
          <h3>{title}</h3>
          {req && <span className="req">{req}</span>}
          {sub && <span className="sub">{sub}</span>}
          {right && <div className="right">{right}</div>}
        </header>
      )}
      <div className={flush ? 'card-b flush' : 'card-b'}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, unit, delta, deltaUp, icon }: {
  label: string; value: string | number; unit?: string; delta?: string; deltaUp?: boolean; icon?: ReactNode
}) {
  return (
    <div className="card stat">
      <div className="label">{icon}{label}</div>
      <div className="value">{value}{unit && <small>{unit}</small>}</div>
      {delta && <div className={'delta ' + (deltaUp ? 'up' : 'down')}>{delta}</div>}
    </div>
  )
}

const STATE_MAP: Record<string, { cls: string; text: string }> = {
  done: { cls: 'ok', text: '완료' },
  running: { cls: 'run', text: '실행중' },
  gate: { cls: 'warn', text: '검토대기' },
  queued: { cls: '', text: '대기' },
  failed: { cls: 'err', text: '실패' },
  retry: { cls: 'warn', text: '재시도' },
  healthy: { cls: 'ok', text: '정상' },
  degraded: { cls: 'warn', text: '지연' },
  idle: { cls: '', text: '유휴' },
  active: { cls: 'ok', text: '운영' },
  staged: { cls: 'warn', text: '승인대기' },
  disabled: { cls: '', text: '비활성' },
}

export function State({ s }: { s: string }) {
  const m = STATE_MAP[s] ?? { cls: '', text: s }
  return <span className={'badge ' + m.cls}><i className="dot" />{m.text}</span>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Tabs<T extends string>({ items, value, onChange }: {
  items: { key: T; label: string; icon?: ReactNode }[]; value: T; onChange: (k: T) => void
}) {
  return (
    <div className="tabs">
      {items.map(i => (
        <div key={i.key} className={'tab' + (i.key === value ? ' active' : '')} onClick={() => onChange(i.key)}>
          {i.icon}{i.label}
        </div>
      ))}
    </div>
  )
}

export function Seg<T extends string>({ items, value, onChange }: {
  items: { key: T; label: string }[]; value: T; onChange: (k: T) => void
}) {
  return (
    <div className="seg">
      {items.map(i => (
        <button key={i.key} className={i.key === value ? 'on' : ''} onClick={() => onChange(i.key)}>{i.label}</button>
      ))}
    </div>
  )
}

export function Progress({ v }: { v: number }) {
  return <div className="progress"><i style={{ width: `${Math.max(0, Math.min(100, v))}%` }} /></div>
}

export function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><div className="sp" /><button className="btn ghost sm" onClick={onClose}>닫기</button></div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  )
}

export function PageHead({ title, desc, req, actions }: {
  title: string; desc?: string; req?: string; actions?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}{req && <span className="req">{req}</span>}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}
