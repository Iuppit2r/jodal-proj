import { useMemo, useState } from 'react'
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react'
import { useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { AuditLog } from '../../../data/types'
import { Card, DataTable, DateRange, ExportButtons, Field, FilterBar, Note, Segmented, Status, runHeavy, type Col } from '../../ui'
import { TODAY, addDays } from '../../lib'
import { pastAdminLogs } from './fake'

type View = 'access' | 'pii'
const isAccess = (a: string) => /로그인|로그아웃/.test(a)
const isPii = (a: string) => /개인정보|엑셀|다운로드|표시|회원정보 조회/.test(a)
const nameOf = (loginId: string) => M.adminUsers.find(u => u.loginId === loginId)?.name ?? '-'
/** 위변조 방지용 해시 (시연: FNV 기반 축약값) */
export const hashOf = (l: AuditLog) => M.hash(`${l.id}|${l.at}|${l.who}|${l.action}|${l.target}`).toString(16).padStart(8, '0')

interface Q { who: string; kw: string; from: string; to: string }

export default function Logs() {
  const auditLogs = useStore(s => s.auditLogs)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [view, setView] = useState<View>('access')
  const init: Q = { who: '', kw: '', from: addDays(TODAY, -30), to: TODAY }
  const [draft, setDraft] = useState<Q>(init)
  const [q, setQ] = useState<Q>(init)

  const all = useMemo(() => [...auditLogs, ...pastAdminLogs()].sort((a, b) => b.at.localeCompare(a.at)), [auditLogs])
  const users = useMemo(() => [...new Set(all.map(l => l.who))].sort(), [all])
  const rows = useMemo(() => all
    .filter(l => (view === 'access' ? isAccess(l.action) : isPii(l.action)))
    .filter(l => !q.who || l.who === q.who)
    .filter(l => !q.kw || l.action.includes(q.kw) || l.target.includes(q.kw) || l.ip.includes(q.kw))
    .filter(l => (!q.from || l.at.slice(0, 10) >= q.from) && (!q.to || l.at.slice(0, 10) <= q.to)), [all, view, q])

  const verify = async () => {
    await runHeavy({ title: '로그 무결성 검증', message: `${all.length.toLocaleString()}건의 로그 해시 체인을 검증하고 있습니다.`, ms: 1400 })
    log('로그 무결성 검증', `${all.length}건 이상 없음`)
    toast(`무결성 검증 완료 – ${all.length.toLocaleString()}건 위·변조 없음`)
  }

  const cols: Col<AuditLog>[] = [
    { key: 'at', header: '일시', render: l => <span className="tabular-nums">{l.at}</span>, sort: l => l.at },
    { key: 'who', header: '사용자', render: l => <span><b>{l.who}</b> <span className="text-xs text-muted">{nameOf(l.who)}</span></span>, sort: l => l.who },
    { key: 'ip', header: '접속 IP', render: l => <span className="font-mono text-xs">{l.ip}</span>, sort: l => l.ip },
    { key: 'action', header: view === 'access' ? '구분' : '처리 내용', render: l => l.action, sort: l => l.action },
    { key: 'target', header: '대상', className: 'max-w-[280px] truncate', render: l => <span title={l.target}>{l.target}</span> },
    { key: 'result', header: '결과', align: 'center', render: l => <Status s={/실패/.test(l.action) ? '실패' : '성공'} /> },
    { key: 'hash', header: '무결성 해시', render: l => <span className="font-mono text-[11px] text-muted">{hashOf(l)}</span> },
  ]
  const failCount = rows.filter(l => /실패/.test(l.action)).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented value={view} onChange={setView} options={[
          { value: 'access', label: <span className="flex items-center gap-1"><LogIn size={13} />관리자 접속로그</span> },
          { value: 'pii', label: <span className="flex items-center gap-1"><KeyRound size={13} />개인정보 처리 활동로그</span> },
        ]} />
        <button className="btn-outline btn-sm" onClick={verify}><ShieldCheck size={14} className="text-emerald-600" />무결성 검증</button>
      </div>
      <Note>
        「개인정보의 안전성 확보조치 기준」 제8조에 따라 개인정보처리시스템 접속기록은 <b>최소 1년 이상 보관</b>(5만 명 이상 처리 시 2년)하며, 월 1회 이상 점검합니다.
        로그는 WORM 저장소에 해시 체인 방식으로 기록되어 <b>위·변조가 불가</b>하며, 관리자도 수정·삭제할 수 없습니다.
      </Note>
      <FilterBar onSearch={() => setQ(draft)} onReset={() => { setDraft(init); setQ(init) }}>
        <Field label="사용자">
          <select className="input" value={draft.who} onChange={e => setDraft({ ...draft, who: e.target.value })}>
            <option value="">전체</option>{users.map(u => <option key={u} value={u}>{u} ({nameOf(u)})</option>)}
          </select>
        </Field>
        <Field label="행위·대상·IP 검색"><input className="input" value={draft.kw} placeholder="예: 다운로드, 실패, 10.10.2" onChange={e => setDraft({ ...draft, kw: e.target.value })} /></Field>
        <Field label="기간" className="lg:col-span-2"><DateRange from={draft.from} to={draft.to} onChange={(from, to) => setDraft({ ...draft, from, to })} /></Field>
      </FilterBar>
      <Card title={view === 'access' ? '관리자 접속로그' : '개인정보 처리 활동로그'}
        sub={view === 'access' ? `로그인 실패 ${failCount}건 · 5회 연속 실패 시 계정 잠금` : '개인정보 조회·표시·다운로드 이력 (다운로드 사유 포함)'}
        actions={<ExportButtons filename={view === 'access' ? '관리자접속로그' : '개인정보처리로그'} count={rows.length}
          getRows={() => [['일시', '사용자', '이름', 'IP', '행위', '대상', '해시'], ...rows.map(l => [l.at, l.who, nameOf(l.who), l.ip, l.action, l.target, hashOf(l)])]} />}>
        <DataTable columns={cols} rows={rows} rowKey={l => l.id} initialSort={{ key: 'at', dir: 'desc' }} dense rowClass={l => (/실패/.test(l.action) ? 'bg-red-50/50' : undefined)} />
      </Card>
    </div>
  )
}
