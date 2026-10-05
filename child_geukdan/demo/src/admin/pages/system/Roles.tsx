import { useState } from 'react'
import { Lock, RotateCcw, Save } from 'lucide-react'
import { useStore } from '../../../store'
import { useAdminLocal } from '../../adminStore'
import { cx } from '../../../lib/format'
import { Card, Note, ask, errMsg } from '../../ui'
import { DEFAULT_PERMS, MENUS, ROLES, useSysLocal, type Level, type MenuName, type Role } from './systemStore'
import { RoleChip } from './Users'

const LEVELS: Level[] = ['없음', '조회', '편집']
const TONE: Record<Level, string> = { 없음: 'bg-gray-200 text-gray-600', 조회: 'bg-brand-100 text-brand-700', 편집: 'bg-brand-600 text-white' }
const locked = (r: Role, m: MenuName) => r === '시스템관리자' && m === '시스템설정'

export default function Roles() {
  const saved = useSysLocal(s => s.perms)
  const setSys = useSysLocal(s => s.set)
  const users = useAdminLocal(s => s.adminUsers)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [perms, setPerms] = useState(() => structuredClone(saved))
  const [err, setErr] = useState('')

  const diff = ROLES.flatMap(r => MENUS.filter(m => perms[r][m] !== saved[r][m]).map(m => `${r}·${m}: ${saved[r][m]}→${perms[r][m]}`))
  const setCell = (r: Role, m: MenuName, l: Level) => {
    if (locked(r, m) && l !== '편집') { setErr(errMsg('E-SY-210', '시스템관리자의 시스템설정 편집 권한은 해제할 수 없습니다 (관리 불능 방지)')); return }
    setErr('')
    setPerms(p => ({ ...p, [r]: { ...p[r], [m]: l } }))
  }
  const setCol = (r: Role, l: Level) => setPerms(p => ({ ...p, [r]: Object.fromEntries(MENUS.map(m => [m, locked(r, m) ? '편집' : l])) as Record<MenuName, Level> }))

  const save = async () => {
    if (!diff.length) { toast('변경된 권한이 없습니다.', 'warn'); return }
    const r = await ask({
      title: '권한 변경 저장', tone: 'warn', confirmText: '저장', reason: '변경 사유',
      message: <>권한 <b>{diff.length}건</b>이 변경됩니다. 해당 역할 사용자의 다음 화면 이동부터 적용됩니다.<ul className="mt-2 max-h-32 list-disc overflow-y-auto pl-5 text-xs text-muted">{diff.map(d => <li key={d}>{d}</li>)}</ul></>,
    })
    if (r === null) return
    setSys({ perms: structuredClone(perms) })
    log(`권한 변경(사유: ${r})`, diff.join(', '))
    toast(`권한 ${diff.length}건을 저장했습니다.`)
  }

  return (
    <Card title="역할별 메뉴 권한" sub="역할(권한그룹)마다 메뉴 접근 수준을 없음 / 조회 / 편집으로 지정합니다. 조회 권한은 엑셀 다운로드가 제한됩니다."
      actions={<>
        {diff.length > 0 && <span className="text-xs font-semibold text-amber-600">변경 {diff.length}건</span>}
        <button className="btn-outline btn-sm" onClick={() => setPerms(structuredClone(DEFAULT_PERMS))}>기본값</button>
        <button className="btn-outline btn-sm" disabled={!diff.length} onClick={() => { setPerms(structuredClone(saved)); setErr('') }}><RotateCcw size={13} />되돌리기</button>
        <button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>
      </>}>
      {err && <Note tone="err" className="mb-3">{err}</Note>}
      <div className="tbl-wrap overflow-x-auto rounded-lg border border-line">
        <table className="tbl">
          <thead>
            <tr>
              <th className="sticky left-0 z-[1]">메뉴</th>
              {ROLES.map(r => (
                <th key={r} className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <RoleChip r={r} />
                    <span className="text-[10px] font-normal">사용자 {users.filter(u => u.role === r).length}명</span>
                    <span className="flex gap-0.5">{LEVELS.map(l => <button key={l} className="rounded border border-line bg-white px-1 text-[10px] font-semibold hover:border-brand-500" onClick={() => setCol(r, l)}>전체 {l}</button>)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MENUS.map(m => (
              <tr key={m}>
                <td className="sticky left-0 bg-white font-semibold">{m}</td>
                {ROLES.map(r => {
                  const changed = perms[r][m] !== saved[r][m]
                  return (
                    <td key={r} className="text-center">
                      <div className={cx('inline-flex rounded-md border bg-paper p-0.5', changed ? 'border-amber-400 ring-2 ring-amber-200' : 'border-line')} role="radiogroup" aria-label={`${r} ${m}`}>
                        {LEVELS.map(l => (
                          <button key={l} role="radio" aria-checked={perms[r][m] === l} onClick={() => setCell(r, m, l)}
                            className={cx('rounded px-2 py-0.5 text-[11px] font-semibold transition', perms[r][m] === l ? TONE[l] : 'text-muted hover:text-ink')}>
                            {l}
                          </button>
                        ))}
                        {locked(r, m) && <Lock size={11} className="mx-1 self-center text-muted" />}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted">노란 테두리는 저장되지 않은 변경입니다. 권한 변경은 변경이력(사유 포함)에 기록됩니다.</p>
    </Card>
  )
}
