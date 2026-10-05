import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useStore } from '../../../store'
import { cx } from '../../../lib/format'
import { Card, Field, MultiCheck, Note, Status, Toggle, errMsg } from '../../ui'
import { ALL_EXTS, PERM_ACTIONS, PERM_ROLES, useCmsLocal, type BoardCfg, type Skin } from './cmsStore'

const SKINS: Skin[] = ['일반형', '뉴스형', '갤러리형']

/** 스킨 미리보기 썸네일 */
export function SkinThumb({ skin, active, className }: { skin: Skin; active?: boolean; className?: string }) {
  const c = active ? '#2647c4' : '#9ca3af'
  return (
    <svg viewBox="0 0 80 56" className={cx('rounded-md border bg-white', active ? 'border-brand-500' : 'border-line', className)} aria-label={`${skin} 스킨`}>
      {skin === '일반형' && [0, 1, 2, 3, 4].map(i => (
        <g key={i}><rect x="6" y={6 + i * 9.5} width="6" height="4" rx="1" fill={c} opacity=".5" /><rect x="15" y={6 + i * 9.5} width={40 - (i % 2) * 10} height="4" rx="1" fill={c} /><rect x="62" y={6 + i * 9.5} width="12" height="4" rx="1" fill={c} opacity=".35" /></g>
      ))}
      {skin === '뉴스형' && [0, 1, 2].map(i => (
        <g key={i}><rect x="6" y={5 + i * 16} width="18" height="13" rx="2" fill={c} opacity=".35" /><rect x="28" y={6 + i * 16} width="40" height="4" rx="1" fill={c} /><rect x="28" y={12 + i * 16} width="46" height="3" rx="1" fill={c} opacity=".4" /></g>
      ))}
      {skin === '갤러리형' && [0, 1, 2, 3, 4, 5].map(i => (
        <g key={i}><rect x={6 + (i % 3) * 24.5} y={5 + Math.floor(i / 3) * 25} width="20" height="16" rx="2" fill={c} opacity=".35" /><rect x={6 + (i % 3) * 24.5} y={23 + Math.floor(i / 3) * 25} width="16" height="3" rx="1" fill={c} /></g>
      ))}
    </svg>
  )
}

export default function BoardSettings() {
  const saved = useCmsLocal(s => s.boards)
  const setLocal = useCmsLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [boards, setBoards] = useState<BoardCfg[]>(() => structuredClone(saved))
  const [cur, setCur] = useState(saved[0].id)
  const [err, setErr] = useState('')
  const b = boards.find(x => x.id === cur)!
  const dirty = JSON.stringify(boards) !== JSON.stringify(saved)

  const patch = (p: Partial<BoardCfg>) => setBoards(bs => bs.map(x => x.id === cur ? { ...x, ...p } : x))
  const setPerm = (a: typeof PERM_ACTIONS[number], r: typeof PERM_ROLES[number], v: boolean) =>
    patch({ perms: { ...b.perms, [a]: { ...b.perms[a], [r]: v } } })

  const save = () => {
    const bad = boards.find(x => !x.exts.length || x.maxMB < 1 || x.maxMB > 100 || x.maxCount < 0 || x.maxCount > 20)
    if (bad) { setCur(bad.id); setErr(errMsg('E-CM-401', `「${bad.name}」 첨부 제한 값이 올바르지 않습니다 (용량 1~100MB, 개수 0~20개, 확장자 1개 이상)`)); return }
    setErr('')
    const changed = boards.filter(x => JSON.stringify(x) !== JSON.stringify(saved.find(s => s.id === x.id)))
    setLocal({ boards: structuredClone(boards) })
    log('게시판 설정 저장', changed.map(x => x.name).join(', ') || '변경 없음')
    toast(`게시판 설정을 저장했습니다. (${changed.length}개 게시판)`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card title="게시판 목록" sub={`${boards.length}개 게시판`} bodyClass="p-2">
        <ul className="space-y-1">
          {boards.map(x => (
            <li key={x.id}>
              <button onClick={() => setCur(x.id)} className={cx('flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition', x.id === cur ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-paper')}>
                <SkinThumb skin={x.skin} active={x.id === cur} className="h-10 w-14 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{x.name}</span>
                  <span className="text-[11px] text-muted">{x.skin} · 첨부 {x.maxCount}개/{x.maxMB}MB</span>
                </span>
                <Status s={x.use ? '사용' : '미사용'} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card title={`${b.name} 설정`} sub="게시판 스킨, 권한, 첨부파일 제한을 설정합니다."
          actions={<>
            {dirty && <span className="text-xs font-semibold text-amber-600">저장되지 않은 변경사항</span>}
            <button className="btn-outline btn-sm" disabled={!dirty} onClick={() => setBoards(structuredClone(saved))}><RotateCcw size={13} />되돌리기</button>
            <button className="btn-primary btn-sm" onClick={save}><Save size={13} />저장</button>
          </>}>
          {err && <Note tone="err" className="mb-3">{err}</Note>}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="게시판명"><input className="input" value={b.name} onChange={e => patch({ name: e.target.value })} /></Field>
            <Field label="사용 여부 / 기능">
              <div className="flex h-[42px] flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5"><Toggle checked={b.use} onChange={v => patch({ use: v })} label="사용" />사용</label>
                <label className="flex items-center gap-1.5"><Toggle checked={b.comment} onChange={v => patch({ comment: v })} label="댓글" />댓글</label>
                <label className="flex items-center gap-1.5"><Toggle checked={b.secret} onChange={v => patch({ secret: v })} label="비밀글" />비밀글</label>
              </div>
            </Field>
          </div>
          <p className="label mt-4 text-[13px]">스킨 선택</p>
          <div className="grid grid-cols-3 gap-3">
            {SKINS.map(s => (
              <button key={s} type="button" onClick={() => patch({ skin: s })}
                className={cx('rounded-xl border-2 p-2 text-center transition', b.skin === s ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-200')}>
                <SkinThumb skin={s} active={b.skin === s} className="mx-auto h-auto w-full max-w-[140px]" />
                <span className={cx('mt-1 block text-xs font-bold', b.skin === s ? 'text-brand-600' : 'text-muted')}>{s}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="권한 설정" sub="역할별로 허용할 기능을 체크합니다." bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>기능</th>{PERM_ROLES.map(r => <th key={r} className="text-center">{r}</th>)}</tr></thead>
              <tbody>
                {PERM_ACTIONS.map(a => (
                  <tr key={a}>
                    <td className="font-semibold">{a}</td>
                    {PERM_ROLES.map(r => (
                      <td key={r} className="text-center">
                        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={b.perms[a][r]} disabled={r === '관리자'}
                          onChange={e => setPerm(a, r, e.target.checked)} aria-label={`${a} ${r}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2 text-[11px] text-muted">관리자 권한은 항상 허용됩니다. 비회원 쓰기 허용 시 자동등록방지(CAPTCHA)가 적용됩니다.</p>
        </Card>

        <Card title="첨부파일 제한">
          <div className="grid gap-4 md:grid-cols-[1fr_160px_160px]">
            <Field label="허용 확장자" hint="실행 파일(exe, js, bat 등)은 보안 정책상 선택할 수 없습니다.">
              <MultiCheck options={ALL_EXTS} value={b.exts} onChange={v => patch({ exts: v })} />
            </Field>
            <Field label="파일당 최대 용량">
              <div className="flex items-center gap-1"><input type="number" className="input" min={1} max={100} value={b.maxMB} onChange={e => patch({ maxMB: Number(e.target.value) })} /><span className="text-sm text-muted">MB</span></div>
            </Field>
            <Field label="최대 첨부 개수">
              <div className="flex items-center gap-1"><input type="number" className="input" min={0} max={20} value={b.maxCount} onChange={e => patch({ maxCount: Number(e.target.value) })} /><span className="text-sm text-muted">개</span></div>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  )
}
