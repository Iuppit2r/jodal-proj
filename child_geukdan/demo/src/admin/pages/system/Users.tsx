import { useMemo, useState } from 'react'
import { Check, KeyRound, Plus, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import Modal from '../../../components/Modal'
import { useStore } from '../../../store'
import type { AdminUser } from '../../../data/types'
import { useAdminLocal } from '../../adminStore'
import { cx } from '../../../lib/format'
import { Card, DataTable, ExportButtons, Field, Note, Status, Toggle, ask, errMsg, type Col } from '../../ui'
import { TODAY } from '../../lib'
import { ROLES, uid, useSysLocal, type Role } from './systemStore'

const ROLE_TONE: Record<Role, string> = { 시스템관리자: 'bg-brand-600 text-white', 공연운영: 'bg-violet-50 text-violet-700', 티켓매니저: 'bg-amber-50 text-amber-700', CMS운영: 'bg-emerald-50 text-emerald-700' }
export const RoleChip = ({ r }: { r: Role }) => <span className={cx('chip', ROLE_TONE[r])}>{r}{r === '티켓매니저' && <span className="ml-1 opacity-70">(현장)</span>}</span>

export const pwRules = (pw: string) => [
  { ok: pw.length >= 9, label: '9자 이상' },
  { ok: /[A-Za-z]/.test(pw), label: '영문 포함' },
  { ok: /\d/.test(pw), label: '숫자 포함' },
  { ok: /[^A-Za-z0-9]/.test(pw), label: '특수문자 포함' },
]

export default function Users() {
  const users = useAdminLocal(s => s.adminUsers)
  const setAdmin = useAdminLocal(s => s.set)
  const adminId = useStore(s => s.adminId)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const sendSms = useStore(s => s.sendSms)
  const [role, setRole] = useState('')
  const [kw, setKw] = useState('')
  const [adding, setAdding] = useState(false)
  const me = users.find(u => u.id === adminId)

  const rows = useMemo(() => users.filter(u => (!role || u.role === role) && (!kw || u.name.includes(kw) || u.loginId.includes(kw))), [users, role, kw])
  const patch = (id: string, p: Partial<AdminUser>) => setAdmin({ adminUsers: useAdminLocal.getState().adminUsers.map(u => u.id === id ? { ...u, ...p } : u) })

  const toggle = async (u: AdminUser, v: boolean) => {
    if (!v && (u.id === adminId || u.loginId === 'admin')) { toast(errMsg('E-SY-130', '현재 로그인한 계정·최고관리자 계정은 미사용 처리할 수 없습니다'), 'err'); return }
    const r = await ask({
      title: v ? '계정 사용 처리' : '계정 미사용 처리', tone: v ? 'warn' : 'danger', confirmText: v ? '사용' : '미사용',
      message: <><b>{u.name}({u.loginId})</b> 계정을 {v ? '사용 상태로 변경합니다.' : '미사용 처리합니다. 즉시 로그인이 차단되고 진행 중인 세션이 종료됩니다.'}</>,
      reason: '변경 사유',
    })
    if (r === null) return
    patch(u.id, { active: v })
    log(`관리자 계정 ${v ? '사용' : '미사용'} 처리(사유: ${r})`, `${u.loginId} (${u.name})`)
    toast(`${u.name} 계정을 ${v ? '사용' : '미사용'} 처리했습니다.`)
  }
  const resetPw = async (u: AdminUser) => {
    const r = await ask({ title: '비밀번호 초기화', tone: 'warn', confirmText: '초기화', message: <><b>{u.name}({u.loginId})</b>의 비밀번호를 초기화합니다. 임시 비밀번호가 등록된 휴대전화로 발송되며, 최초 로그인 시 변경이 강제됩니다.</> })
    if (r === null) return
    sendSms(`${u.loginId} 등록 휴대전화`, `[국립어린이청소년극단 관리자] 임시 비밀번호: Ntcy!${Math.floor(Math.random() * 9000 + 1000)}a (최초 로그인 시 변경 필요)`, 'SMS')
    log('관리자 비밀번호 초기화', `${u.loginId} (${u.name})`)
    toast(`${u.name}님에게 임시 비밀번호를 발송했습니다.`)
  }

  const cols: Col<AdminUser>[] = [
    { key: 'name', header: '이름', render: u => <span className="font-semibold">{u.name}{u.id === adminId && <span className="ml-1 rounded bg-brand-50 px-1 text-[10px] font-bold text-brand-600">나</span>}</span>, sort: u => u.name },
    { key: 'loginId', header: '아이디', render: u => <span className="font-mono text-xs">{u.loginId}</span>, sort: u => u.loginId },
    { key: 'role', header: '역할(권한그룹)', render: u => <RoleChip r={u.role} />, sort: u => u.role },
    { key: 'lastLogin', header: '최근 접속', render: u => <span className={cx('tabular-nums', u.lastLogin < '2026-09-05' && 'text-amber-600')}>{u.lastLogin}</span>, sort: u => u.lastLogin },
    { key: 'status', header: '상태', render: u => <Status s={u.active ? '사용' : '미사용'} />, sort: u => Number(u.active) },
    { key: 'active', header: '사용', align: 'center', render: u => <Toggle checked={u.active} onChange={v => toggle(u, v)} label={`${u.loginId} 사용`} /> },
    { key: 'pw', header: '비밀번호', align: 'center', render: u => <button className="btn-ghost btn-sm" onClick={() => resetPw(u)}><KeyRound size={13} />초기화</button> },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card title="관리자 · 현장 사용자" sub={`전체 ${users.length}명 · 사용 ${users.filter(u => u.active).length}명 · 티켓매니저는 매표소 POS 로그인 계정입니다.`}
        actions={<>
          <select className="input w-32 py-1.5 text-xs" value={role} onChange={e => setRole(e.target.value)} aria-label="역할 필터"><option value="">전체 역할</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
          <input className="input w-36 py-1.5 text-xs" placeholder="이름·아이디" value={kw} onChange={e => setKw(e.target.value)} aria-label="검색" />
          <ExportButtons filename="관리자계정" count={rows.length} getRows={() => [['이름', '아이디', '역할', '최근접속', '상태'], ...rows.map(u => [u.name, u.loginId, u.role, u.lastLogin, u.active ? '사용' : '미사용'])]} />
          <button className="btn-primary btn-sm" onClick={() => setAdding(true)}><UserPlus size={14} />사용자 등록</button>
        </>}>
        <DataTable columns={cols} rows={rows} rowKey={u => u.id} rowClass={u => (!u.active ? 'opacity-60' : undefined)} />
        <Note className="mt-3">90일 이상 미접속 계정은 자동 잠금, 비밀번호는 90일마다 변경이 요구됩니다. 로그인 5회 연속 실패 시 계정이 잠깁니다. {me && <>현재 로그인: <b>{me.name}({me.loginId})</b></>}</Note>
      </Card>
      <IpCard />
      {adding && <AddUserModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const users = useAdminLocal(s => s.adminUsers)
  const setAdmin = useAdminLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [f, setF] = useState({ name: '', loginId: '', role: '티켓매니저' as Role, pw: '', pw2: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const rules = pwRules(f.pw)
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = errMsg('E-SY-101', '이름은 필수 입력입니다')
    if (!/^[a-z][a-z0-9._]{3,19}$/.test(f.loginId)) e.loginId = errMsg('E-SY-111', '아이디는 영문 소문자로 시작하는 4~20자 (영문·숫자·._)')
    else if (users.some(u => u.loginId.toLowerCase() === f.loginId.toLowerCase())) e.loginId = errMsg('E-SY-110', '이미 사용 중인 아이디')
    if (!rules.every(r => r.ok)) e.pw = errMsg('E-SY-120', '비밀번호는 9자 이상 영문·숫자·특수문자를 조합해야 합니다')
    else if (f.pw.toLowerCase().includes(f.loginId.toLowerCase()) && f.loginId) e.pw = errMsg('E-SY-121', '비밀번호에 아이디를 포함할 수 없습니다')
    if (f.pw !== f.pw2) e.pw2 = errMsg('E-SY-122', '비밀번호 확인이 일치하지 않습니다')
    setErr(e)
    if (Object.keys(e).length) return
    const u: AdminUser = { id: uid('ad'), name: f.name.trim(), loginId: f.loginId, role: f.role, lastLogin: '-', active: true }
    setAdmin({ adminUsers: [...users, u] })
    log('관리자 계정 등록', `${u.loginId} (${u.name}) / ${u.role}`)
    toast(`${u.name} 계정을 등록했습니다.`)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="관리자 · 현장 사용자 등록"
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={save}>등록</button></>}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="이름" required error={err.name}><input className="input" value={f.name} aria-invalid={!!err.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="역할" required>
            <select className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value as Role })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
          </Field>
        </div>
        <Field label="아이디" required error={err.loginId} hint="영문 소문자로 시작하는 4~20자 · 이미 등록된 예: admin, sky.kim, box01">
          <input className="input font-mono" value={f.loginId} aria-invalid={!!err.loginId} onChange={e => setF({ ...f, loginId: e.target.value.trim() })} autoComplete="off" />
        </Field>
        <Field label="초기 비밀번호" required error={err.pw}>
          <input type="password" className="input" value={f.pw} aria-invalid={!!err.pw} onChange={e => setF({ ...f, pw: e.target.value })} autoComplete="new-password" />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {rules.map(r => (
            <span key={r.label} className={cx('chip gap-1', r.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-muted')}>{r.ok ? <Check size={11} /> : <X size={11} />}{r.label}</span>
          ))}
        </div>
        <Field label="비밀번호 확인" required error={err.pw2}>
          <input type="password" className="input" value={f.pw2} aria-invalid={!!err.pw2} onChange={e => setF({ ...f, pw2: e.target.value })} autoComplete="new-password" />
        </Field>
        <Note>등록 후 최초 로그인 시 비밀번호 변경 및 2차 인증(OTP) 등록이 필요합니다.</Note>
      </div>
    </Modal>
  )
}

function IpCard() {
  const ips = useSysLocal(s => s.ips)
  const set = useSysLocal(s => s.set)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const [ip, setIp] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState('')
  const valid = (v: string) => {
    const m = v.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?$/)
    return !!m && [1, 2, 3, 4].every(i => Number(m[i]) <= 255) && (!m[6] || Number(m[6]) <= 32)
  }
  const add = () => {
    if (!valid(ip.trim())) { setErr(errMsg('E-SY-140', 'IP 형식이 올바르지 않습니다 (예: 10.10.2.15 또는 10.10.2.0/24)')); return }
    if (ips.some(x => x.ip === ip.trim())) { setErr(errMsg('E-SY-141', '이미 등록된 IP입니다')); return }
    set({ ips: [...ips, { id: uid('ip'), ip: ip.trim(), desc: desc.trim() || '-', at: TODAY }] })
    log('접속 허용 IP 추가', `${ip.trim()} (${desc.trim() || '-'})`)
    toast('접속 허용 IP를 추가했습니다.')
    setIp(''); setDesc(''); setErr('')
  }
  const del = async (id: string, v: string) => {
    if (ips.length <= 1) { toast(errMsg('E-SY-142', '최소 1개의 허용 IP가 필요합니다'), 'err'); return }
    const r = await ask({ title: '허용 IP 삭제', tone: 'danger', confirmText: '삭제', message: <><b className="font-mono">{v}</b> 대역의 관리자 접속이 즉시 차단됩니다.</> })
    if (r === null) return
    set({ ips: ips.filter(x => x.id !== id) })
    log('접속 허용 IP 삭제', v)
  }
  return (
    <Card title={<span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-600" />관리자 접속 허용 IP</span>} sub="등록된 IP·대역에서만 관리자 페이지 접속이 허용됩니다." className="h-fit">
      <ul className="divide-y divide-line rounded-lg border border-line">
        {ips.map(x => (
          <li key={x.id} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1"><p className="font-mono text-sm font-semibold">{x.ip}</p><p className="truncate text-[11px] text-muted">{x.desc} · 등록 {x.at}</p></div>
            <button className="btn-ghost p-1.5 text-coral-500" onClick={() => del(x.id, x.ip)} aria-label="삭제"><Trash2 size={13} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1.5">
        <input className="input py-2 font-mono text-sm" placeholder="IP 또는 CIDR (예: 10.10.3.0/24)" value={ip} aria-invalid={!!err} onChange={e => { setIp(e.target.value); setErr('') }} />
        <div className="flex gap-1">
          <input className="input py-2 text-sm" placeholder="설명 (예: 2층 기획팀)" value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <button className="btn-outline btn-sm shrink-0" onClick={add}><Plus size={13} />추가</button>
        </div>
        {err && <p className="text-xs text-coral-500">{err}</p>}
        <p className="text-[11px] text-muted">현재 접속 IP: <span className="font-mono">10.10.2.15</span> (허용됨)</p>
      </div>
    </Card>
  )
}
