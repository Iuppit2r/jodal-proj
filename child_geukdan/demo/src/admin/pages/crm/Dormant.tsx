import { useMemo, useState } from 'react'
import { BellRing, Moon, MoonStar, UserCheck, CalendarClock } from 'lucide-react'
import { useStore } from '../../../store'
import { Card, DataTable, ExportButtons, Kpi, Note, PiiToggle, Status, ask, errMsg, usePII, type Col } from '../../ui'
import { TODAY, addDays } from '../../lib'
import type { Member } from '../../../data/types'
import MemberDetail from './MemberDetail'
import { useCrmLocal } from './shared'

/** 미접속 일수 */
const idleDays = (last: string, base: string) => Math.floor((new Date(base).getTime() - new Date(last).getTime()) / 864e5)
const yearAgo = (d: string) => `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`

export default function Dormant() {
  const members = useStore(s => s.members)
  const { updateMember, log, toast, sendSms } = useStore.getState()
  const noticed = useCrmLocal(s => s.noticed)
  const setLocal = useCrmLocal(s => s.set)
  const pii = usePII()
  const [base, setBase] = useState(TODAY) // 기준일 (시뮬레이션)
  const [selT, setSelT] = useState<string[]>([])
  const [selD, setSelD] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)

  const cutoff = yearAgo(base) // 이 날짜 이전 마지막 로그인 → 1년 경과
  const soon = yearAgo(addDays(base, 30)) // 30일 이내 1년 도래 → 사전고지 대상

  const { targets, upcoming, dormant } = useMemo(() => {
    const live = members.filter(m => m.status === '정상')
    return {
      targets: live.filter(m => m.lastLoginAt < cutoff),
      upcoming: live.filter(m => m.lastLoginAt >= cutoff && m.lastLoginAt < soon),
      dormant: members.filter(m => m.status === '휴면'),
    }
  }, [members, cutoff, soon])
  const candidates = useMemo(() => [...targets, ...upcoming], [targets, upcoming])

  const sendNotice = async () => {
    const ids = selT.length ? selT : candidates.map(m => m.id)
    if (!ids.length) { toast(errMsg('E-CM-411', '사전 고지 대상 회원이 없습니다'), 'warn'); return }
    const r = await ask({
      title: '휴면 전환 사전 안내 발송', tone: 'warn', confirmText: '안내 발송',
      message: <><b>{ids.length}명</b>에게 휴면 전환 30일 전 사전 고지(이메일·알림톡)를 발송합니다.<br /><span className="text-xs text-muted">개인정보 보호법 시행령 제48조의5 – 휴면 전환 30일 전까지 분리보관 사실·기간·항목 통지</span></>,
    })
    if (r === null) return
    sendSms(`휴면 예정 회원 ${ids.length}명`, `[국립어린이청소년극단] 회원님의 계정이 1년간 로그인 기록이 없어 ${addDays(base, 30)}에 휴면 계정으로 전환될 예정입니다. 전환 시 개인정보는 별도 분리 보관되며, 로그인 시 본인확인 후 즉시 복원됩니다.`, '메일')
    setLocal({ noticed: { ...noticed, ...Object.fromEntries(ids.map(id => [id, TODAY])) } })
    log('휴면 전환 사전 안내 발송', `${ids.length}명`)
    toast(`${ids.length}명에게 휴면 전환 사전 안내를 발송했습니다`)
    setSelT([])
  }

  const convert = async () => {
    const ids = selT.length ? selT.filter(id => targets.some(t => t.id === id)) : targets.map(m => m.id)
    if (!ids.length) { toast(errMsg('E-CM-412', '휴면 전환 대상(1년 경과) 회원이 없습니다. 사전고지 예정 회원은 기한 도래 후 전환됩니다'), 'warn'); return }
    const notNoticed = ids.filter(id => !noticed[id]).length
    const r = await ask({
      title: '휴면 전환 실행', tone: 'danger', confirmText: `${ids.length}명 휴면 전환`,
      message: <>
        <b>{ids.length}명</b>을 휴면 회원으로 전환하고 개인정보를 분리 보관합니다.
        {notNoticed > 0 && <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">⚠ 사전 고지 미발송 회원 {notNoticed}명이 포함되어 있습니다. 고지 후 30일 경과 전환을 권장합니다.</div>}
      </>,
    })
    if (r === null) return
    ids.forEach(id => updateMember(id, { status: '휴면' }))
    log('휴면 전환 실행', `${ids.length}명 (기준일 ${base})`)
    toast(`${ids.length}명을 휴면 전환했습니다`)
    setSelT([])
  }

  const release = async (ids: string[]) => {
    if (!ids.length) { toast(errMsg('E-CM-413', '휴면 해제할 회원을 선택해 주세요'), 'warn'); return }
    const r = await ask({ title: '휴면 해제', tone: 'warn', confirmText: '휴면 해제', message: <><b>{ids.length}명</b>의 휴면 상태를 해제하고 분리 보관된 개인정보를 복원합니다.</>, reasonOptions: ['본인확인 완료(콜센터)', '본인 요청(이메일)', '오류 정정'] })
    if (r === null) return
    ids.forEach(id => updateMember(id, { status: '정상', lastLoginAt: TODAY }))
    log(`휴면 해제(사유: ${r})`, `${ids.length}명`)
    if (ids.length === 1) { const m = members.find(x => x.id === ids[0]); if (m) sendSms(m.phone, '[국립어린이청소년극단] 휴면 상태가 해제되었습니다.', '알림톡') }
    toast(`${ids.length}명 휴면 해제 완료`)
    setSelD([])
  }

  const baseCols: Col<Member>[] = [
    { key: 'loginId', header: '아이디', sort: m => m.loginId },
    { key: 'name', header: '성명', render: m => <span className="font-semibold">{pii.name(m.name)}</span> },
    { key: 'phone', header: '연락처', render: m => pii.phone(m.phone) },
    { key: 'email', header: '이메일', render: m => pii.email(m.email) },
    { key: 'last', header: '최종 로그인', render: m => m.lastLoginAt, sort: m => m.lastLoginAt },
    { key: 'idle', header: '미접속', align: 'right', render: m => `${idleDays(m.lastLoginAt, base).toLocaleString()}일`, sort: m => idleDays(m.lastLoginAt, base) },
  ]
  const targetCols: Col<Member>[] = [
    ...baseCols,
    { key: 'kind', header: '구분', render: m => m.lastLoginAt < cutoff ? <span className="chip bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">전환 대상</span> : <Status s="예정" />, sort: m => m.lastLoginAt },
    { key: 'due', header: '전환 예정일', render: m => `${Number(m.lastLoginAt.slice(0, 4)) + 1}${m.lastLoginAt.slice(4)}`, sort: m => m.lastLoginAt },
    { key: 'notice', header: '사전고지', render: m => noticed[m.id] ? <span className="text-xs font-semibold text-mint-500">발송 {noticed[m.id]}</span> : <span className="text-xs text-amber-600">미발송</span> },
  ]
  const dormantCols: Col<Member>[] = [
    ...baseCols,
    { key: 'st', header: '상태', render: m => <Status s={m.status} /> },
    { key: 'act', header: '', align: 'right', render: m => <button className="btn-outline btn-sm" onClick={e => { e.stopPropagation(); release([m.id]) }}><UserCheck size={13} />해제</button> },
  ]

  const exp = (rows: Member[], name: string) => ({
    filename: name, count: rows.length,
    getRows: () => [['아이디', '성명', '연락처', '이메일', '최종로그인', '미접속일수', '상태'], ...rows.map(m => [m.loginId, pii.name(m.name), pii.phone(m.phone), pii.email(m.email), m.lastLoginAt, idleDays(m.lastLoginAt, base), m.status])],
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="휴면 전환 대상 (1년 경과)" value={`${targets.length}명`} icon={<MoonStar size={18} />} tone="coral" />
        <Kpi label="사전고지 대상 (30일 이내 도래)" value={`${upcoming.length}명`} icon={<BellRing size={18} />} tone="sun" />
        <Kpi label="현재 휴면 회원" value={`${dormant.length}명`} icon={<Moon size={18} />} tone="ink" />
        <Kpi label="사전고지 발송 누계" value={`${Object.keys(noticed).length}명`} icon={<CalendarClock size={18} />} tone="mint" />
      </div>

      <Note>
        <b>휴면 정책</b> · 최종 로그인 후 <b>1년</b> 미접속 시 휴면 전환 및 개인정보 분리 보관 · 전환 <b>30일 전</b> 이메일·알림톡 사전 고지 ·
        기준일 <b>{base}</b> → 최종 로그인 <b>{cutoff}</b> 이전 회원이 전환 대상입니다.
      </Note>

      <Card title={`휴면 전환 대상 / 예정 (${candidates.length}명)`}
        sub="선택 없이 실행하면 목록 전체에 적용됩니다."
        actions={<>
          <label className="flex items-center gap-1 text-xs font-semibold text-muted">기준일(시뮬레이션)
            <input type="date" className="input w-auto py-1 text-xs" value={base} min={TODAY} onChange={e => { setBase(e.target.value || TODAY); setSelT([]) }} />
          </label>
          {[['+7개월', 214], ['+9개월', 275]].map(([l, d]) => (
            <button key={l} className="btn-ghost btn-sm" onClick={() => { setBase(addDays(TODAY, d as number)); setSelT([]) }}>{l}</button>
          ))}
          {base !== TODAY && <button className="btn-ghost btn-sm" onClick={() => setBase(TODAY)}>오늘</button>}
          <PiiToggle />
          <ExportButtons {...exp(candidates, '휴면전환대상')} />
          <button className="btn-outline btn-sm" onClick={sendNotice}><BellRing size={14} />휴면 전환 안내 발송 (30일 전 사전 고지)</button>
          <button className="btn-danger btn-sm" onClick={convert}><Moon size={14} />휴면 전환 실행</button>
        </>}>
        <DataTable columns={targetCols} rows={candidates} rowKey={m => m.id} selectable selected={selT} onSelectChange={setSelT} dense pageSize={10}
          onRowClick={m => setOpen(m.id)} empty={`기준일(${base}) 현재 휴면 전환 대상 회원이 없습니다. 기준일을 변경해 예정 대상을 확인할 수 있습니다.`} />
      </Card>

      <Card title={`휴면 회원 (${dormant.length}명)`} sub="분리 보관 중인 회원 · 본인확인 후 해제할 수 있습니다."
        actions={<>
          <ExportButtons {...exp(dormant, '휴면회원')} />
          <button className="btn-primary btn-sm" onClick={() => release(selD)}><UserCheck size={14} />선택 휴면 해제{selD.length ? ` (${selD.length})` : ''}</button>
        </>}>
        <DataTable columns={dormantCols} rows={dormant} rowKey={m => m.id} selectable selected={selD} onSelectChange={setSelD} dense pageSize={10}
          onRowClick={m => setOpen(m.id)} initialSort={{ key: 'last', dir: 'asc' }} />
      </Card>
      <MemberDetail memberId={open} onClose={() => setOpen(null)} />
    </div>
  )
}
