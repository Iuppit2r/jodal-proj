import { useState, type ReactNode } from 'react'
import { ArrowLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Card({ title, sub, right, children, flush }: {
  title?: string; sub?: string; right?: ReactNode; children: ReactNode; flush?: boolean
}) {
  return (
    <section className="card">
      {title && (
        <header className="card-h">
          <h3>{title}</h3>
          {sub && <span className="sub">{sub}</span>}
          {right && <div className="right">{right}</div>}
        </header>
      )}
      <div className={flush ? 'card-b flush' : 'card-b'}>{children}</div>
    </section>
  )
}

/* 기본으로 접혀 있는 카드. 참고 자료나 부가 설정처럼
   들어오자마자 볼 필요가 없는 내용을 숨겨 화면 밀도를 낮춘다. */
export function Fold({ title, sub, children, open, count }: {
  title: string; sub?: string; children: ReactNode; open?: boolean; count?: number
}) {
  return (
    <details className="fold" open={open}>
      <summary>
        <ChevronRight size={16} />
        <b>{title}</b>
        {typeof count === 'number' && <span className="badge">{count}</span>}
        {sub && <span className="sub">{sub}</span>}
      </summary>
      <div className="fold-b">{children}</div>
    </details>
  )
}

/* 자주 쓰지 않는 동작을 접어 두는 버튼. 버튼이 셋을 넘으면 나머지를 여기에 넣는다.
   글자 없이 아이콘만 두어 옆 버튼과 높이가 어긋나지 않게 한다.
   sm 은 옆 버튼이 작은 크기일 때 맞춘다. 위험한 동작은 danger, 비활성 사유는 note 로 알린다. */
export function MoreMenu({ items, title = '더 보기', sm, align = 'right' }: {
  items: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean; note?: string }[]
  title?: string
  sm?: boolean
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <div className="more">
      <button className={'btn icon' + (sm ? ' sm' : '') + (open ? ' on' : '')}
        title={title} aria-label={title} onClick={() => setOpen(o => !o)}>
        <MoreHorizontal size={sm ? 14 : 15} />
      </button>
      {open && (
        <>
          <div className="prj-back" onClick={() => setOpen(false)} />
          <div className={'more-menu' + (align === 'left' ? ' left' : '')}>
            {items.map(i => (
              <button key={i.label} className={'more-item' + (i.danger ? ' danger' : '')}
                disabled={i.disabled} title={i.disabled ? i.note : undefined}
                onClick={() => { setOpen(false); i.onClick() }}>
                {i.icon}
                <span>{i.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* 카드 안에서, 또는 카드 여러 개를 묶을 때 쓰는 소제목 블록.
   테두리를 두르지 않아 카드 안에 넣어도 겹쳐 보이지 않는다. */
export function Block({ title, sub, right, children }: {
  title: string; sub?: string; right?: ReactNode; children: ReactNode
}) {
  return (
    <section className="block">
      <div className="block-h">
        <b>{title}</b>
        {sub && <span className="sub">{sub}</span>}
        {right && <div className="right">{right}</div>}
      </div>
      {children}
    </section>
  )
}

/* 화면 안에서 성격이 다른 묶음을 가르는 제목 줄. */
export function GroupTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="group-title">
      <h2>{title}</h2>
      {sub && <span className="sub">{sub}</span>}
      {right && <div className="right">{right}</div>}
    </div>
  )
}

/* KPI 한 칸. 같은 grid 안에 나란히 두면 하나의 띠로 묶여 보인다.
   아이콘·색상 증감 표시는 쓰지 않고 수치와 보조 설명만 둔다. */
export function Stat({ label, value, unit, delta }: {
  label: string; value: string | number; unit?: string; delta?: string; deltaUp?: boolean; icon?: ReactNode
}) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}{unit && <small>{unit}</small>}</div>
      {delta && <div className="delta">{delta}</div>}
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

/* 하위 화면으로 들어간 경우 제목 위에 돌아가는 줄을 둔다.
   뒤로 가기는 오른쪽 동작 버튼들과 성격이 달라 좌상단에 따로 놓는다. */
export function PageHead({ title, desc, actions, back }: {
  title: string; desc?: string; actions?: ReactNode
  back?: { to: string; label: string }
}) {
  const nav = useNavigate()
  return (
    <div className="page-head">
      <div className="page-head-main">
        {back && (
          <button className="back-link" onClick={() => nav(back.to)}>
            <ArrowLeft size={15} />{back.label}
          </button>
        )}
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}
