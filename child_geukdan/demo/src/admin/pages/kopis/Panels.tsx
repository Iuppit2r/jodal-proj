import { useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, CheckCircle2, Copy, Layers, Loader2, Plus, Send, Trash2 } from 'lucide-react'
import * as M from '../../../data/mock'
import type { KopisLog, PayMethod } from '../../../data/types'
import { findBooking, useBookings, useStore } from '../../../store'
import { ask, Card, errMsg, Field, Note, Toggle, usePII } from '../../ui'
import { dayOf, num, usePerfMap, useRoundMap, ticketTypeName } from '../../lib'
import { cx } from '../../../lib/format'
import { useKopisLocal } from './store'

/* ───────── 1,000건 단위 분할 전송 ───────── */
export function SplitCard({ log }: { log: KopisLog | null }) {
  const [count, setCount] = useState(log?.count ?? 0)
  const [done, setDone] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => { setCount(log?.count ?? 0); setDone(null) }, [log])
  useEffect(() => () => window.clearInterval(timer.current), [])
  const batches = Math.max(1, Math.ceil(count / 1000))
  const list = Array.from({ length: batches }, (_, i) => ({ i, from: i * 1000 + 1, to: Math.min(count, (i + 1) * 1000) }))
  const run = () => {
    window.clearInterval(timer.current)
    setDone(0)
    let n = 0
    timer.current = window.setInterval(() => {
      n++
      setDone(n)
      if (n >= batches) window.clearInterval(timer.current)
    }, 450)
  }
  return (
    <Card title={<span className="flex items-center gap-1.5"><Layers size={15} />1,000건 단위 분할 전송</span>}
      sub={log ? `${log.date} ${log.kind} (${log.id})` : '전송 이력을 선택하세요'}>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="전송 건수" className="w-32"><input type="number" min={0} className="input py-1.5" value={count} onChange={e => { setCount(Math.max(0, Number(e.target.value))); setDone(null) }} /></Field>
        <div className="pb-2 text-sm">→ <b className="text-brand-600">{batches}</b>개 배치</div>
        <button className="btn-outline btn-sm mb-1 ml-auto" onClick={run} disabled={!count}><Send size={12} />분할 전송 시뮬레이션</button>
      </div>
      <ul className="mt-3 max-h-48 space-y-1.5 overflow-auto pr-1">
        {list.map(b => {
          const st = done === null ? 'idle' : b.i < done ? 'ok' : b.i === done ? 'run' : 'wait'
          return (
            <li key={b.i} className="flex items-center gap-2 rounded-md bg-paper px-2.5 py-1.5 text-xs">
              <span className="w-14 font-semibold">배치 {b.i + 1}</span>
              <span className="tabular-nums text-muted">{num(b.from)} ~ {num(b.to)}건</span>
              <div className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div className={cx('h-full rounded-full transition-all duration-300', st === 'ok' ? 'w-full bg-emerald-500' : st === 'run' ? 'w-1/2 bg-brand-600' : 'w-0')} />
              </div>
              {st === 'ok' ? <CheckCircle2 size={14} className="text-emerald-600" /> : st === 'run' ? <Loader2 size={14} className="animate-spin text-brand-600" /> : <span className="w-3.5" />}
            </li>
          )
        })}
      </ul>
      <Note className="mt-3">KOPIS 연계 규격상 1회 요청당 최대 1,000건까지 전송하며, 배치별 응답코드(0000)를 확인한 뒤 다음 배치를 전송합니다. 실패 배치만 재전송하여 중복 집계를 방지합니다.</Note>
    </Card>
  )
}

/* ───────── 담당자 문자 알림 ───────── */
export function SmsConfig() {
  const { contacts, notifyFail, notifyRetry, autoRetry, set } = useKopisLocal()
  const sendSms = useStore(s => s.sendSms)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const pii = usePII()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const add = () => {
    if (!name.trim()) { setErr(errMsg('E-KP-102', '담당자명을 입력해 주세요')); return }
    if (!/^01\d-\d{3,4}-\d{4}$/.test(phone)) { setErr(errMsg('E-KP-103', '휴대폰 번호 형식이 올바르지 않습니다 (010-0000-0000)')); return }
    set({ contacts: [...contacts, { id: 'c' + Date.now(), name: name.trim(), phone, role: '부' }] })
    log('KOPIS 알림 담당자 추가', name.trim())
    setName(''); setPhone(''); setErr('')
  }
  const remove = async (id: string) => {
    const c = contacts.find(x => x.id === id)!
    if ((await ask({ title: '담당자 삭제', tone: 'danger', confirmText: '삭제', message: `${c.name} 담당자를 알림 수신 대상에서 삭제하시겠습니까?` })) === null) return
    set({ contacts: contacts.filter(x => x.id !== id) })
    log('KOPIS 알림 담당자 삭제', c.name)
  }
  const toggle = (k: 'notifyFail' | 'notifyRetry' | 'autoRetry', v: boolean, label: string) => { set({ [k]: v }); log(`KOPIS ${label} ${v ? '사용' : '미사용'}`, '알림 설정') }
  const test = () => {
    if (!contacts.length) { toast(errMsg('E-KP-104', '수신 담당자가 없습니다'), 'warn'); return }
    for (const c of contacts) sendSms(c.phone, `[통합전산망 알림 테스트] KOPIS 전송 장애 알림 수신 테스트입니다. (${new Date().toTimeString().slice(0, 5)})`, 'SMS')
    log('KOPIS 장애 알림 테스트 발송', `${contacts.length}명`)
    toast(`${contacts.length}명에게 테스트 문자를 발송했습니다`)
  }
  return (
    <Card title={<span className="flex items-center gap-1.5"><BellRing size={15} />담당자 문자 알림</span>} sub="전송 실패 시 담당자에게 즉시 SMS 발송"
      actions={<button className="btn-outline btn-sm" onClick={test}><Send size={12} />테스트 발송</button>}>
      <div className="space-y-2 text-sm">
        <label className="flex items-center justify-between gap-2"><span>전송 실패 시 문자 알림</span><Toggle checked={notifyFail} onChange={v => toggle('notifyFail', v, '실패 알림')} label="실패 알림" /></label>
        <label className="flex items-center justify-between gap-2"><span>재전송 성공 시 결과 알림</span><Toggle checked={notifyRetry} onChange={v => toggle('notifyRetry', v, '재전송 알림')} label="재전송 알림" /></label>
        <label className="flex items-center justify-between gap-2"><span>자동 재전송 (10분 간격 3회)</span><Toggle checked={autoRetry} onChange={v => toggle('autoRetry', v, '자동 재전송')} label="자동 재전송" /></label>
      </div>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {contacts.map(c => (
          <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="chip bg-brand-50 text-brand-700">{c.role}</span>
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="tabular-nums text-muted">{pii.phone(c.phone)}</span>
            <button className="btn-ghost btn-sm p-1 text-coral-500" onClick={() => remove(c.id)} aria-label="삭제"><Trash2 size={13} /></button>
          </li>
        ))}
        {!contacts.length && <li className="px-3 py-3 text-center text-xs text-muted">등록된 담당자가 없습니다.</li>}
      </ul>
      <div className="mt-2 flex gap-1.5">
        <input className="input min-w-0 flex-1 py-1.5 text-sm" placeholder="담당자명" value={name} onChange={e => setName(e.target.value)} />
        <input className="input w-36 py-1.5 text-sm" placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        <button className="btn-primary btn-sm" onClick={add}><Plus size={13} />추가</button>
      </div>
      {err && <p className="mt-1 text-xs font-medium text-coral-500">{err}</p>}
    </Card>
  )
}

/* ───────── 전송 페이로드 샘플 ───────── */
const SETLE: Record<PayMethod, string> = { 신용카드: '01', 가상계좌: '03', 간편결제: '05', 현금: '09', 초대: '00' }
const CHNL: Record<string, string> = { 홈페이지: 'WEB', 모바일: 'MOB', 현장: 'BOX', 콜센터: 'TEL', 외부예매처: 'EXT' }

export function PayloadViewer({ date }: { date: string }) {
  const bookings = useBookings()
  const perfMap = usePerfMap()
  const roundMap = useRoundMap()
  const toast = useStore(s => s.toast)
  const sample = useMemo(() => bookings.filter(b => dayOf(b.createdAt) === date && b.status !== '입금대기').slice(0, 15), [bookings, date])
  const [id, setId] = useState('')
  const b = (id && findBooking(id)) || sample[0]
  const json = useMemo(() => {
    if (!b) return null
    const p = perfMap.get(b.perfId)!
    const r = roundMap.get(b.roundId)!
    const venue = M.venues.find(v => v.id === p.venueId)!
    return {
      header: { trnsmisBsnmCode: 'NTCY0001', trnsmisDt: date.replace(/-/g, '') + '050000', dataCnt: b.seats.length, version: '2.1' },
      tickets: b.seats.map((s, i) => ({
        fcltyPerfCode: `FC0012${venue.id === 'v1' ? '01' : '02'}-${p.code}`,
        mt10Id: 'FC001247',
        mt13Id: `FC001247-${venue.id === 'v1' ? '01' : '02'}`,
        mt20Id: `PF${p.code.replace(/\D/g, '')}`,
        prfnm: p.title,
        prfDt: r.date.replace(/-/g, ''),
        prfTm: r.time.replace(':', ''),
        prfRound: r.no,
        trnsmisBsnmCode: 'NTCY0001',
        tickerInnb: `${b.id}-${String(i + 1).padStart(2, '0')}`,
        ntssOrCancl: s.cancelled ? '2' : '1',
        setleDt: b.createdAt.slice(0, 10).replace(/-/g, ''),
        setleTm: b.createdAt.slice(11).replace(':', '') + '00',
        amount: s.price,
        seatGrade: M.gradeLabel[s.grade],
        seatNo: s.seatId,
        dscntNm: ticketTypeName(s.ticketTypeId),
        setleMthd: SETLE[b.payMethod],
        salesChnnl: CHNL[b.channel] ?? 'ETC',
        invtYn: s.ticketTypeId === 't-inv' ? 'Y' : 'N',
      })),
    }
  }, [b, perfMap, roundMap, date])
  const text = json ? JSON.stringify(json, null, 2) : ''
  const copy = () => { navigator.clipboard?.writeText(text).catch(() => undefined); toast('페이로드를 클립보드에 복사했습니다') }
  return (
    <Card title="전송 데이터 샘플 (결제데이터)" sub={`KOPIS 공연예술통합전산망 연계 규격 v2.1 · ${date} 결제분`}
      actions={<>
        <select className="input w-auto py-1.5 font-mono text-xs" value={b?.id ?? ''} onChange={e => setId(e.target.value)} aria-label="예매 선택">
          {sample.map(x => <option key={x.id} value={x.id}>{x.id} · {perfMap.get(x.perfId)?.title.slice(0, 8)}</option>)}
        </select>
        <button className="btn-outline btn-sm" onClick={copy} disabled={!json}><Copy size={12} />복사</button>
      </>}>
      {json ? (
        <pre className="max-h-80 overflow-auto rounded-lg bg-[#0f172a] p-3 text-[11px] leading-relaxed text-emerald-200">{text}</pre>
      ) : <p className="py-8 text-center text-sm text-muted">해당 일자 결제 데이터가 없습니다.</p>}
      <p className="mt-2 text-[11px] text-muted">※ 개인정보(예매자 성명·연락처)는 전송 대상에서 제외되며, 티켓 고유번호(tickerInnb)는 예매번호-좌석순번으로 생성됩니다.</p>
    </Card>
  )
}
