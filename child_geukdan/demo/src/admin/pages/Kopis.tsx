import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { AlertOctagon, CheckCircle2, Database, Hourglass, Loader2, PlayCircle, RotateCw, Send, ServerCrash, Zap } from 'lucide-react'
import Modal from '../../components/Modal'
import type { KopisLog } from '../../data/types'
import { nowStr, useBookings, useStore } from '../../store'
import { ask, Card, DataTable, ExportButtons, Kpi, Note, PageHeader, runHeavy, Segmented, Status, type Col } from '../ui'
import { TODAY, addDays, dayOf, num, pct } from '../lib'
import { cx } from '../../lib/format'
import { ChartBox, axisTick, gridProps, tipStyle } from './reports/common'
import { PayloadViewer, SmsConfig, SplitCard } from './kopis/Panels'
import { useKopisLocal } from './kopis/store'

type KindF = '전체' | KopisLog['kind']
const STEPS = ['데이터 추출', '1,000건 분할', '전송', '응답 검증']

export default function Kopis() {
  const logs = useStore(s => s.kopisLogs)
  const retryKopis = useStore(s => s.retryKopis)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const sendSms = useStore(s => s.sendSms)
  const bookings = useBookings()
  const [kind, setKind] = useState<KindF>('전체')
  const [status, setStatus] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [runner, setRunner] = useState(false)

  const view = useMemo(() => logs.filter(k => (kind === '전체' || k.kind === kind) && (!status || k.status === status)), [logs, kind, status])
  const selected = logs.find(k => k.id === selId) ?? logs.find(k => k.kind === '결제데이터' && k.status !== '대기') ?? null

  const kpi = useMemo(() => {
    const from = addDays(TODAY, -14)
    const recent = logs.filter(k => k.date >= from && k.status !== '대기')
    const ok = recent.filter(k => k.status === '성공' || k.status === '재전송성공').length
    const first = recent.filter(k => k.status === '성공').length
    return {
      wait: logs.filter(k => k.status === '대기').length,
      rate: pct(ok, recent.length), firstRate: pct(first, recent.length),
      total: logs.filter(k => k.status === '성공' || k.status === '재전송성공').reduce((a, k) => a + k.count, 0),
      fail: logs.filter(k => k.status === '실패').length,
    }
  }, [logs])

  const chart = useMemo(() => logs.filter(k => k.kind === '결제데이터').map(k => ({ d: k.date.slice(5), count: k.count || 0, status: k.status })).reverse(), [logs])

  // 수동 전송 대상: 대기 중인 결제데이터 일자, 없으면 오늘
  const target = logs.find(k => k.kind === '결제데이터' && k.status === '대기')?.date ?? TODAY
  const targetCount = useMemo(() => bookings.filter(b => dayOf(b.createdAt) === target).reduce((a, b) => a + b.seats.length, 0), [bookings, target])

  const retry = async (k: KopisLog) => {
    if ((await ask({ title: '통합전산망 재전송', tone: 'warn', confirmText: '재전송', message: <>{k.date} {k.kind} {num(k.count)}건을 KOPIS로 재전송합니다.<br /><span className="text-xs text-muted">실패 사유: {k.message ?? '-'}</span></> })) === null) return
    await runHeavy({ title: 'KOPIS 재전송 중', message: `${num(k.count)}건 · ${Math.max(1, Math.ceil(k.count / 1000))}개 배치 전송 및 응답 검증`, ms: 1400 })
    retryKopis(k.id)
    toast('재전송 성공 — 응답코드 0000')
    if (useKopisLocal.getState().notifyRetry) for (const c of useKopisLocal.getState().contacts) sendSms(c.phone, `[통합전산망] ${k.date} ${k.kind} ${num(k.count)}건 재전송 성공`, 'SMS')
  }

  const simulate = async () => {
    if ((await ask({ title: '장애 시뮬레이션', tone: 'warn', confirmText: '시뮬레이션', message: 'KOPIS 수신서버 응답 지연(HTTP 504) 상황을 가정하여 최근 전송 대기 건을 실패 처리합니다. (시연용)' })) === null) return
    const cur = useStore.getState().kopisLogs
    const pending = cur.find(k => k.status === '대기')
    const msg = 'HTTP 504 Gateway Timeout — KOPIS 수신서버 응답 없음 [E-KP-504]'
    let target: KopisLog
    if (pending) {
      target = { ...pending, status: '실패', count: pending.count || targetCount || 128, sentAt: nowStr(), message: msg }
      useStore.getState().set({ kopisLogs: cur.map(k => (k.id === pending.id ? target : k)) })
    } else {
      target = { id: `kF${Date.now().toString(36)}`, date: TODAY, kind: '결제데이터', count: targetCount || 128, status: '실패', sentAt: nowStr(), message: msg }
      useStore.getState().set({ kopisLogs: [target, ...cur] })
    }
    log('KOPIS 전송 장애 발생(시뮬레이션)', `${target.date} ${target.kind}`)
    toast(`[E-KP-504] ${target.date} 결제데이터 전송 실패`, 'err')
    setSelId(target.id)
    if (useKopisLocal.getState().notifyFail) {
      const cs = useKopisLocal.getState().contacts
      for (const c of cs) sendSms(c.phone, `[통합전산망 장애] ${target.date} 결제데이터 ${num(target.count)}건 전송 실패(HTTP 504). 관리자 화면에서 재전송하세요.`, 'SMS')
      if (cs.length) toast(`담당자 ${cs.length}명에게 장애 문자 발송`, 'warn')
    }
  }

  const cols: Col<KopisLog>[] = [
    { key: 'date', header: '대상일자', sort: r => r.date, render: r => <span className="tabular-nums font-semibold">{r.date}</span> },
    { key: 'kind', header: '구분', sort: r => r.kind, render: r => <span className={cx('chip', r.kind === '결제데이터' ? 'bg-brand-50 text-brand-700' : r.kind === '일별집계' ? 'bg-gray-100 text-ink' : 'bg-violet-50 text-violet-700')}>{r.kind}</span> },
    { key: 'count', header: '건수', align: 'right', sort: r => r.count, render: r => num(r.count) },
    { key: 'batch', header: '배치', align: 'right', render: r => (r.kind === '결제데이터' && r.count ? Math.ceil(r.count / 1000) : '-') },
    { key: 'status', header: '상태', sort: r => r.status, render: r => <Status s={r.status} /> },
    { key: 'sentAt', header: '전송일시', sort: r => r.sentAt, render: r => <span className="tabular-nums text-xs">{r.sentAt}</span> },
    { key: 'message', header: '메시지', render: r => <span className={cx('block max-w-72 truncate text-xs', r.status === '실패' ? 'font-semibold text-red-600' : 'text-muted')} title={r.message}>{r.message ?? '정상 수신 (0000)'}</span> },
    { key: 'act', header: '', render: r => r.status === '실패' ? <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); retry(r) }}><RotateCw size={12} />재전송</button> : null },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="통합전산망(KOPIS) 연계" code="SFR-TC-018"
        desc="공연예술통합전산망으로 결제데이터·일별/월별 집계를 매일 05:00 이전 자동 전송하고, 전송 결과를 모니터링합니다."
        actions={<>
          <button className="btn-outline btn-sm text-coral-500" onClick={simulate}><ServerCrash size={14} />장애 시뮬레이션</button>
          <button className="btn-primary btn-sm" onClick={() => setRunner(true)}><PlayCircle size={14} />오늘분 전송 실행</button>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="오늘 전송 대기" value={`${kpi.wait}건`} sub="익일 05:00 이전 자동 전송" icon={<Hourglass size={18} />} tone="sun" />
        <Kpi label="최근 14일 성공률" value={kpi.rate} sub={`1차 전송 성공률 ${kpi.firstRate}`} icon={<CheckCircle2 size={18} />} tone="mint" />
        <Kpi label="누적 전송 건수" value={num(kpi.total)} sub="결제데이터 + 집계" icon={<Database size={18} />} />
        <Kpi label="전송 실패" value={`${kpi.fail}건`} sub={kpi.fail ? '재전송 필요' : '이상 없음'} icon={<AlertOctagon size={18} />} tone={kpi.fail ? 'coral' : 'ink'} />
      </div>

      {kpi.fail > 0 && <Note tone="err"><b>[E-KP-504] 전송 실패 {kpi.fail}건</b> — 아래 목록에서 [재전송]을 실행하세요. 담당자에게 장애 문자가 발송되었습니다.</Note>}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="전송 모니터링" sub="행을 클릭하면 분할 전송 내역을 확인할 수 있습니다."
          actions={<>
            <Segmented size="sm" value={kind} onChange={setKind} options={(['전체', '결제데이터', '일별집계', '월별집계'] as KindF[]).map(v => ({ value: v, label: v }))} />
            <select className="input w-auto py-1 text-xs" value={status} onChange={e => setStatus(e.target.value)} aria-label="상태 필터">
              <option value="">전체 상태</option>{['성공', '재전송성공', '실패', '대기'].map(s => <option key={s}>{s}</option>)}
            </select>
            <ExportButtons filename="KOPIS_전송이력" count={view.length}
              getRows={() => [['대상일자', '구분', '건수', '상태', '전송일시', '메시지'], ...view.map(k => [k.date, k.kind, k.count, k.status, k.sentAt, k.message ?? ''])]} />
          </>}>
          <DataTable columns={cols} rows={view} rowKey={r => r.id} pageSize={10} dense onRowClick={r => setSelId(r.id)}
            rowClass={r => cx(r.status === '실패' && 'bg-red-50', r.id === selected?.id && 'outline outline-2 -outline-offset-2 outline-brand-500')} />
          <div className="mt-4">
            <ChartBox height={150} title="일자별 결제데이터 전송 건수 (최근 14일)">
              <BarChart data={chart}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="d" tick={axisTick} />
                <YAxis tick={axisTick} width={36} />
                <Tooltip contentStyle={tipStyle} formatter={v => `${num(Number(v))}건`} />
                <RBar dataKey="count" name="전송 건수" radius={[3, 3, 0, 0]}>
                  {chart.map((c, i) => <Cell key={i} fill={c.status === '실패' ? '#e0533a' : c.status === '재전송성공' ? '#d48806' : c.status === '대기' ? '#cbd5e1' : '#2647c4'} />)}
                </RBar>
              </BarChart>
            </ChartBox>
          </div>
        </Card>
        <div className="space-y-4">
          <SplitCard log={selected} />
          <SmsConfig />
        </div>
      </div>

      <PayloadViewer date={selected && selected.date.length === 10 ? selected.date : addDays(TODAY, -1)} />

      {runner && <SendRunner target={target} count={targetCount} onClose={() => setRunner(false)} />}
    </div>
  )
}

/* ───────── 수동 전송 실행 (단계별 진행) ───────── */
function SendRunner({ target, count, onClose }: { target: string; count: number; onClose: () => void }) {
  const [step, setStep] = useState(-1)
  const batches = Math.max(1, Math.ceil(count / 1000))
  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return
    const t = setTimeout(() => setStep(step + 1), 750)
    return () => clearTimeout(t)
  }, [step])
  useEffect(() => {
    if (step !== STEPS.length) return
    const s = useStore.getState()
    const sentAt = nowStr()
    const rest = s.kopisLogs.filter(k => !(k.date === target && k.kind === '결제데이터' && k.status === '대기'))
    const id = Date.now().toString(36)
    s.set({
      kopisLogs: [
        { id: `kS${id}a`, date: target, kind: '결제데이터', count, status: '성공', sentAt, message: `관리자 수동 전송 (${batches}개 배치) · 응답 0000` },
        { id: `kS${id}b`, date: target, kind: '일별집계', count: 1, status: '성공', sentAt },
        ...rest,
      ],
    })
    s.log('KOPIS 수동 전송 실행', `${target} 결제데이터 ${count.toLocaleString()}건`)
    s.toast(`KOPIS 전송 완료 — ${target} ${count.toLocaleString()}건`)
  }, [step, target, count, batches])
  const detail = [
    `${target} 결제·취소 티켓 ${num(count)}건 추출 (개인정보 제외)`,
    `${batches}개 배치로 분할 (최대 1,000건/배치)`,
    `HTTPS 전송 ${batches}/${batches} 배치 완료`,
    '응답코드 0000 · 건수 일치 검증 완료',
  ]
  const running = step >= 0 && step < STEPS.length
  return (
    <Modal open onClose={running ? () => undefined : onClose} title="통합전산망 수동 전송" size="md"
      footer={step === STEPS.length
        ? <button className="btn-primary btn-sm" onClick={onClose}>확인</button>
        : <>
          <button className="btn-outline btn-sm" onClick={onClose} disabled={running}>취소</button>
          <button className="btn-primary btn-sm" onClick={() => setStep(0)} disabled={running}><Send size={13} />전송 시작</button>
        </>}>
      <div className="mb-3 rounded-lg bg-paper px-3 py-2 text-sm">
        대상: <b>{target}</b> 결제데이터 <b>{num(count)}</b>건 → KOPIS (kopis.or.kr 연계 API)
      </div>
      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const st = step > i ? 'done' : step === i ? 'run' : 'wait'
          return (
            <li key={s} className={cx('flex items-start gap-3 rounded-lg border px-3 py-2.5 transition', st === 'done' ? 'border-emerald-200 bg-emerald-50/50' : st === 'run' ? 'border-brand-200 bg-brand-50' : 'border-line')}>
              <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold', st === 'done' ? 'bg-emerald-500 text-white' : st === 'run' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-muted')}>
                {st === 'done' ? <CheckCircle2 size={14} /> : st === 'run' ? <Loader2 size={14} className="animate-spin" /> : i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{s}</div>
                <div className="text-xs text-muted">{st === 'wait' ? '대기' : st === 'run' ? '처리 중…' : detail[i]}</div>
              </div>
            </li>
          )
        })}
      </ol>
      {step === STEPS.length && <Note className="mt-3"><Zap size={12} className="mr-1 inline" />전송 이력에 성공 로그가 추가되었고 변경이력에 기록되었습니다.</Note>}
    </Modal>
  )
}
