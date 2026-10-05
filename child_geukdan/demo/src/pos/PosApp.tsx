import { useEffect, useState } from 'react'
import { ClipboardList, LockKeyhole, ScanLine, Ticket, TicketCheck, User } from 'lucide-react'
import * as M from '../data/mock'
import { cx, dow, won } from '../lib/format'
import { usePos, type PosTab } from './lib'
import PosLogin from './PosLogin'
import SellView from './SellView'
import IssueView from './IssueView'
import CheckinView from './CheckinView'
import SalesView from './SalesView'
import CloseView from './CloseView'

const TABS: { id: PosTab; label: string; key: string; Icon: typeof Ticket }[] = [
  { id: 'sell', label: '현장판매', key: 'F1', Icon: Ticket },
  { id: 'issue', label: '예매발권', key: 'F2', Icon: TicketCheck },
  { id: 'check', label: '검표', key: 'F3', Icon: ScanLine },
  { id: 'sales', label: '판매내역', key: 'F4', Icon: ClipboardList },
  { id: 'close', label: '마감', key: 'F5', Icon: LockKeyhole },
]

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return (
    <div className="text-right leading-tight">
      <div className="text-[11px] text-white/50">{M.TODAY.replace(/-/g, '.')}({dow(M.TODAY)})</div>
      <div className="font-mono text-lg font-bold tabular-nums">{t.toTimeString().slice(0, 8)}</div>
    </div>
  )
}

/** 현장판매/발권/검표 POS (SFR-TC-003, SFR-TC-010) */
export default function PosApp() {
  const session = usePos(s => s.session)
  const ledger = usePos(s => s.ledger)
  const tab = usePos(s => s.tab)
  const setTab = usePos(s => s.setTab)

  // F1~F5 단축키 (F5 새로고침 방지)
  useEffect(() => {
    if (!session) return
    const onKey = (e: KeyboardEvent) => {
      const i = ['F1', 'F2', 'F3', 'F4', 'F5'].indexOf(e.key)
      if (i < 0) return
      e.preventDefault()
      setTab(TABS[i].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session, setTab])

  if (!session) return <PosLogin />

  const net = ledger.reduce((a, e) => a + (e.kind === 'refund' ? -e.amount : e.amount), 0)
  const qty = ledger.reduce((a, e) => a + (e.kind === 'refund' ? -e.seats.length : e.seats.length), 0)

  return (
    <div className="flex h-[calc(100vh-36px)] min-h-[600px] flex-col overflow-hidden bg-paper text-ink">
      <header className="no-print flex h-16 shrink-0 items-center gap-3 bg-[#0d0f13] px-3 text-white">
        <div className="flex items-center gap-2 pr-2">
          <span className="rounded-lg bg-sun-400 px-2.5 py-1 text-sm font-black text-ink">{session.window}</span>
          <div className="hidden leading-tight lg:block">
            <div className="text-[11px] text-white/50">근무자</div>
            <div className="flex items-center gap-1 text-sm font-bold"><User size={13} />{session.staffName}</div>
          </div>
        </div>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="POS 메뉴">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={cx('flex min-h-12 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition xl:px-4 xl:text-base',
                tab === t.id ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
              <t.Icon size={18} />{t.label}
              <kbd className={cx('rounded px-1 font-mono text-[10px]', tab === t.id ? 'bg-ink text-white' : 'bg-white/15')}>{t.key}</kbd>
            </button>
          ))}
        </nav>
        <div className="text-right leading-tight">
          <div className="text-[11px] text-white/50">오늘 판매 ({qty}매)</div>
          <div className="text-xl font-black tabular-nums text-mint-400">{won(net)}</div>
        </div>
        <div className="h-8 w-px bg-white/15" />
        <Clock />
      </header>
      <main className="min-h-0 flex-1">
        {tab === 'sell' && <SellView />}
        {tab === 'issue' && <IssueView />}
        {tab === 'check' && <CheckinView />}
        {tab === 'sales' && <SalesView />}
        {tab === 'close' && <CloseView />}
      </main>
    </div>
  )
}
