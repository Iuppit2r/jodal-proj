import { NavLink } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { cx } from '../lib/format'

/** 시연 전환 바: 홈페이지 / 관리자 / 현장판매 */
export default function DemoBar() {
  const reset = useStore(s => s.resetDemo)
  const toast = useStore(s => s.toast)
  const tab = ({ isActive }: { isActive: boolean }) => cx('rounded-md px-2.5 py-1 transition', isActive ? 'bg-white text-ink' : 'text-white/70 hover:text-white')
  return (
    <div className="no-print sticky top-0 z-[45] flex h-9 items-center justify-between gap-2 bg-ink px-3 text-xs font-semibold text-white">
      <div className="flex items-center gap-1 overflow-x-auto">
        <span className="mr-2 hidden whitespace-nowrap text-white/50 sm:inline">시연 모드</span>
        <NavLink to="/" end className={tab}>시작</NavLink>
        <NavLink to="/site" className={tab}>홈페이지</NavLink>
        <NavLink to="/admin" className={tab}>관리자(TMS·CMS)</NavLink>
        <NavLink to="/pos" className={tab}>현장판매 POS</NavLink>
      </div>
      <button
        className="flex shrink-0 items-center gap-1 text-white/70 hover:text-white"
        onClick={() => { if (confirm('시연 데이터를 초기 상태로 되돌릴까요?')) { reset(); toast('시연 데이터를 초기화했습니다') } }}
      >
        <RotateCcw size={12} /> 초기화
      </button>
    </div>
  )
}
