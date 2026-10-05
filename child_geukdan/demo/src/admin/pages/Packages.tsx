import { useMemo, useState } from 'react'
import { create } from 'zustand'
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { CalendarRange, Package, Pencil, Printer, ShoppingBag, Wallet } from 'lucide-react'
import Modal from '../../components/Modal'
import * as M from '../../data/mock'
import type { PackageOrder, PackageProduct, Performance } from '../../data/types'
import { useStore } from '../../store'
import { Bar, Card, DataTable, errMsg, ExportButtons, Field, Kpi, Note, PageHeader, PiiToggle, printTarget, Status, usePII, CHART_COLORS, type Col } from '../ui'
import { TODAY, num, pct, usePerfMap } from '../lib'
import { cx, won } from '../../lib/format'
import { ChartBox, axisTick, gridProps, short, tipStyle, wonFmt } from './reports/common'

/* 관리자 로컬 패키지 사본 (판매기간·한도·할인율 편집) */
const usePkgLocal = create<{ packages: PackageProduct[]; set: (p: PackageProduct[]) => void }>(set => ({
  packages: M.packages.map(p => ({ ...p, perfIds: [...p.perfIds] })),
  set: packages => set({ packages }),
}))

/** 공연 정가 (안분 기준) – 최고 등급 가격 */
const listPrice = (p?: Performance) => (p ? Math.max(...Object.values(p.prices).map(v => v ?? 0)) : 0)
/** 자유 패키지 이관 판매분의 공연 선택 비중 (시연용) */
const FREE_WEIGHT: Record<string, number> = { p1: 0.36, p2: 0.32, p3: 0.22, p6: 0.1 }

/** 시연용 기존 주문 (결정적) */
function historicalOrders(pkgs: PackageProduct[]): PackageOrder[] {
  const rnd = M.seeded(4242)
  const out: PackageOrder[] = []
  for (let i = 0; i < 28; i++) {
    const pk = pkgs[rnd() < 0.45 ? 0 : 1]
    const picks = pk.type === '시즌' ? [...pk.perfIds] : [...pk.perfIds].sort(() => rnd() - 0.5).slice(0, pk.pickCount)
    const qty = rnd() < 0.35 ? 2 : 1
    const base = picks.reduce((a, id) => a + listPrice(M.performances.find(p => p.id === id)), 0)
    const day = 15 + Math.floor((i / 28) * 19)
    const date = day <= 30 ? `2026-09-${String(day).padStart(2, '0')}` : `2026-10-0${day - 30}`
    out.push({
      id: `PKH${date.slice(2).replace(/-/g, '')}${String(101 + i)}`, packageId: pk.id, userId: `u${3 + Math.floor(rnd() * 150)}`,
      perfIds: picks, bookingIds: [], total: Math.round((base * (1 - pk.discountRate) * qty) / 100) * 100,
      status: rnd() < 0.07 ? '취소완료' : '결제완료', createdAt: `${date} ${String(9 + Math.floor(rnd() * 13)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`,
    })
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

interface AllocRow { key: string; pkgId: string; pkg: string; perfId: string; perf: string; price: number; picks: number; ratio: number; amount: number }

export default function Packages() {
  const pkgs = usePkgLocal(s => s.packages)
  const setPkgs = usePkgLocal(s => s.set)
  const storeOrders = useStore(s => s.packageOrders)
  const members = useStore(s => s.members)
  const log = useStore(s => s.log)
  const toast = useStore(s => s.toast)
  const perfMap = usePerfMap()
  const pii = usePII()
  const [edit, setEdit] = useState<PackageProduct | null>(null)

  const hist = useMemo(() => historicalOrders(M.packages), [])
  const orders = useMemo(() => [...storeOrders, ...hist], [storeOrders, hist])
  const newIds = useMemo(() => new Set(storeOrders.map(o => o.id)), [storeOrders])
  const memberName = useMemo(() => new Map(members.map(m => [m.id, m.name])), [members])

  const soldOf = (pk: PackageProduct) => pk.sold + storeOrders.filter(o => o.packageId === pk.id && o.status === '결제완료').length
  const unitPrice = (pk: PackageProduct) => {
    const ps = pk.perfIds.map(id => listPrice(perfMap.get(id))).sort((a, b) => b - a)
    const base = pk.type === '시즌' ? ps.reduce((a, b) => a + b, 0) : ps.slice(0, pk.pickCount).reduce((a, b) => a + b, 0) // 자유: 최대가 기준
    return Math.round((base * (1 - pk.discountRate)) / 100) * 100
  }

  /* 패키지 정산: 패키지 금액을 공연 정가 비율로 안분 */
  const alloc = useMemo(() => {
    const m = new Map<string, AllocRow>()
    const addTo = (pk: PackageProduct, perfId: string, picks: number, amount: number) => {
      const k = `${pk.id}|${perfId}`
      const p = perfMap.get(perfId)
      const r = m.get(k) ?? { key: k, pkgId: pk.id, pkg: pk.name, perfId, perf: p?.title ?? perfId, price: listPrice(p), picks: 0, ratio: 0, amount: 0 }
      r.picks += picks; r.amount += amount
      m.set(k, r)
    }
    for (const pk of pkgs) {
      // 이관 판매분 (pk.sold)
      if (pk.type === '시즌') {
        const sum = pk.perfIds.reduce((a, id) => a + listPrice(perfMap.get(id)), 0)
        const total = unitPrice(pk) * pk.sold
        for (const id of pk.perfIds) addTo(pk, id, pk.sold, Math.round((total * listPrice(perfMap.get(id))) / sum))
      } else {
        for (const id of pk.perfIds) {
          const picks = Math.round(pk.sold * pk.pickCount * (FREE_WEIGHT[id] ?? 0.1))
          addTo(pk, id, picks, Math.round(picks * listPrice(perfMap.get(id)) * (1 - pk.discountRate)))
        }
      }
      // 신규 주문 (store.packageOrders): 주문 금액을 선택 공연 정가 비율로 안분
      for (const o of storeOrders) {
        if (o.packageId !== pk.id || o.status !== '결제완료') continue
        const sum = o.perfIds.reduce((a, id) => a + listPrice(perfMap.get(id)), 0) || 1
        for (const id of o.perfIds) addTo(pk, id, 1, Math.round((o.total * listPrice(perfMap.get(id))) / sum))
      }
    }
    const rows = [...m.values()]
    for (const pk of pkgs) {
      const t = rows.filter(r => r.pkgId === pk.id).reduce((a, r) => a + r.amount, 0)
      for (const r of rows) if (r.pkgId === pk.id) r.ratio = t ? r.amount / t : 0
    }
    return rows
  }, [pkgs, storeOrders, perfMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const chart = useMemo(() => pkgs.map(pk => {
    const o: Record<string, string | number> = { name: pk.type === '시즌' ? '시즌 패키지' : '자유 패키지' }
    for (const r of alloc) if (r.pkgId === pk.id) o[r.perf] = r.amount
    return o
  }), [pkgs, alloc])
  const perfNames = [...new Set(alloc.map(r => r.perf))]
  const totalRev = alloc.reduce((a, r) => a + r.amount, 0)

  const save = (p: PackageProduct) => {
    const prev = pkgs.find(x => x.id === p.id)!
    setPkgs(pkgs.map(x => (x.id === p.id ? p : x)))
    const diff = [
      prev.saleStart !== p.saleStart || prev.saleEnd !== p.saleEnd ? `판매기간 ${p.saleStart}~${p.saleEnd}` : '',
      prev.limit !== p.limit ? `한도 ${prev.limit}→${p.limit}` : '',
      prev.discountRate !== p.discountRate ? `할인율 ${Math.round(prev.discountRate * 100)}%→${Math.round(p.discountRate * 100)}%` : '',
    ].filter(Boolean).join(', ')
    log('패키지 상품 수정', `${p.name}${diff ? ` (${diff})` : ''}`)
    toast('패키지 정보가 저장되었습니다')
    setEdit(null)
  }

  const orderCols: Col<PackageOrder>[] = [
    { key: 'id', header: '주문번호', sort: r => r.id, render: r => <span className="font-mono text-xs">{r.id}{newIds.has(r.id) && <span className="ml-1 rounded bg-coral-500 px-1 text-[9px] font-bold text-white">NEW</span>}</span> },
    { key: 'user', header: '회원', render: r => pii.name(memberName.get(r.userId) ?? r.userId) },
    { key: 'pkg', header: '패키지', sort: r => r.packageId, render: r => pkgs.find(p => p.id === r.packageId)?.name ?? r.packageId },
    { key: 'perfs', header: '선택 공연', render: r => <span className="text-xs">{r.perfIds.map(id => perfMap.get(id)?.title ?? id).join(' · ')}</span> },
    { key: 'total', header: '금액', align: 'right', sort: r => r.total, render: r => <b>{won(r.total)}</b> },
    { key: 'status', header: '상태', sort: r => r.status, render: r => <Status s={r.status} /> },
    { key: 'at', header: '주문일시', sort: r => r.createdAt, render: r => <span className="tabular-nums text-xs">{r.createdAt}</span> },
  ]
  const allocCols: Col<AllocRow>[] = [
    { key: 'pkg', header: '패키지', sort: r => r.pkg, render: r => <span className="font-semibold">{r.pkg}</span> },
    { key: 'perf', header: '공연', sort: r => r.perf },
    { key: 'price', header: '정가(안분 기준)', align: 'right', sort: r => r.price, render: r => won(r.price) },
    { key: 'picks', header: '관람권 수', align: 'right', sort: r => r.picks, render: r => num(r.picks) },
    { key: 'ratio', header: '안분비율', align: 'right', sort: r => r.ratio, render: r => `${(r.ratio * 100).toFixed(1)}%` },
    { key: 'amount', header: '안분 매출', align: 'right', sort: r => r.amount, render: r => <b>{won(r.amount)}</b> },
  ]

  const totalSold = pkgs.reduce((a, p) => a + soldOf(p), 0)
  return (
    <div className="space-y-4">
      <PageHeader title="패키지 관리" code="SFR-TC-017" desc="시즌·자유 패키지 상품의 판매 현황, 주문 내역, 공연별 매출 안분(패키지 정산)을 관리합니다." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="판매중 패키지" value={`${pkgs.filter(p => p.saleStart <= TODAY && p.saleEnd >= TODAY).length}종`} icon={<Package size={18} />} />
        <Kpi label="누적 판매" value={`${num(totalSold)}건`} sub={`한도 ${num(pkgs.reduce((a, p) => a + p.limit, 0))}건`} icon={<ShoppingBag size={18} />} tone="mint" />
        <Kpi label="패키지 매출(안분 합계)" value={won(totalRev)} icon={<Wallet size={18} />} tone="sun" />
        <Kpi label="신규 주문 (홈페이지)" value={`${storeOrders.length}건`} sub="실시간 연동" icon={<CalendarRange size={18} />} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pkgs.map(pk => {
          const sold = soldOf(pk)
          const on = pk.saleStart <= TODAY && pk.saleEnd >= TODAY
          return (
            <Card key={pk.id} title={<span className="flex items-center gap-2">{pk.name}<span className={cx('chip', pk.type === '시즌' ? 'bg-brand-50 text-brand-700' : 'bg-violet-50 text-violet-700')}>{pk.type}</span></span>}
              sub={pk.desc} actions={<button className="btn-outline btn-sm" onClick={() => setEdit(pk)}><Pencil size={12} />수정</button>}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div><div className="text-[11px] font-semibold text-muted">할인율</div><b className="text-coral-500">{Math.round(pk.discountRate * 100)}%</b></div>
                <div><div className="text-[11px] font-semibold text-muted">판매가(1인)</div><b>{won(unitPrice(pk))}</b>{pk.type === '자유' && <span className="text-[10px] text-muted"> 최대</span>}</div>
                <div className="col-span-2"><div className="text-[11px] font-semibold text-muted">판매기간</div><span className="tabular-nums">{pk.saleStart} ~ {pk.saleEnd}</span> <Status s={on ? '판매중' : pk.saleStart > TODAY ? '예정' : '판매종료'} /></div>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-[11px] font-semibold text-muted">대상 공연 {pk.type === '자유' ? `(${pk.perfIds.length}편 중 ${pk.pickCount}편 선택)` : `(${pk.perfIds.length}편 지정)`}</div>
                <div className="flex flex-wrap gap-1">{pk.perfIds.map(id => <span key={id} className="chip bg-paper text-ink">{perfMap.get(id)?.title ?? id}</span>)}</div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs"><span>판매 <b>{num(sold)}</b> / 한도 {num(pk.limit)}건</span><b className="tabular-nums">{pct(sold, pk.limit)}</b></div>
                <Bar value={sold} max={pk.limit} color={sold / pk.limit > 0.8 ? '#e0533a' : '#2647c4'} className="h-2" />
              </div>
            </Card>
          )
        })}
      </div>

      <Card title="패키지 주문 내역" sub="홈페이지 신규 주문(NEW)과 기존 주문 최근 28건"
        actions={<>
          <PiiToggle />
          <ExportButtons filename="패키지주문내역" count={orders.length}
            getRows={() => [['주문번호', '회원', '패키지', '선택공연', '금액', '상태', '주문일시'], ...orders.map(o => [o.id, pii.name(memberName.get(o.userId) ?? o.userId), pkgs.find(p => p.id === o.packageId)?.name ?? '', o.perfIds.map(id => perfMap.get(id)?.title ?? id).join(' / '), o.total, o.status, o.createdAt])]} />
        </>}>
        <DataTable columns={orderCols} rows={orders} rowKey={r => r.id} pageSize={10} dense rowClass={r => (newIds.has(r.id) ? 'bg-amber-50/60' : undefined)} />
      </Card>

      <Card title="패키지 정산 보고서" sub="패키지 판매금액을 대상 공연 정가 비율로 안분하여 공연별 매출로 귀속합니다."
        actions={<>
          <ExportButtons filename="패키지정산_공연별안분" count={alloc.length} print={false}
            getRows={() => [['패키지', '공연', '정가', '관람권수', '안분비율', '안분매출'], ...alloc.map(r => [r.pkg, r.perf, r.price, r.picks, `${(r.ratio * 100).toFixed(1)}%`, r.amount])]} />
          <button className="btn-outline btn-sm" onClick={() => { log('패키지 정산 보고서 인쇄', `${alloc.length}행`); printTarget() }}><Printer size={14} />인쇄</button>
        </>}>
        <div className="print-target bg-white">
          <h3 className="mb-2 hidden text-lg font-bold print:block">패키지 정산 보고서 ({TODAY} 기준)</h3>
          <div className="grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <ChartBox height={260} title="패키지별 공연 안분 매출">
                <BarChart data={chart}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={short} width={48} />
                  <Tooltip formatter={wonFmt} contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {perfNames.map((n, i) => <RBar key={n} dataKey={n} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} maxBarSize={70} />)}
                </BarChart>
              </ChartBox>
            </div>
            <div className="min-w-0 xl:col-span-3">
              <DataTable columns={allocCols} rows={alloc} rowKey={r => r.key} dense pageSize={20} />
              <div className="mt-2 flex justify-end gap-4 rounded-lg bg-paper px-3 py-2 text-xs">
                {pkgs.map(pk => <span key={pk.id}>{pk.type} <b>{won(alloc.filter(r => r.pkgId === pk.id).reduce((a, r) => a + r.amount, 0))}</b></span>)}
                <span>합계 <b className="text-brand-600">{won(totalRev)}</b></span>
              </div>
            </div>
          </div>
          <Note className="mt-3">안분 산식: 공연별 안분액 = 패키지 결제금액 × (해당 공연 정가 ÷ 선택 공연 정가 합계). 이관 판매분은 시즌 패키지는 지정 공연, 자유 패키지는 공연별 선택 비중으로 산출합니다.</Note>
        </div>
      </Card>

      {edit && <EditModal pk={edit} onClose={() => setEdit(null)} onSave={save} minLimit={soldOf(edit)} />}
    </div>
  )
}

function EditModal({ pk, onClose, onSave, minLimit }: { pk: PackageProduct; onClose: () => void; onSave: (p: PackageProduct) => void; minLimit: number }) {
  const [f, setF] = useState({ saleStart: pk.saleStart, saleEnd: pk.saleEnd, limit: String(pk.limit), rate: String(Math.round(pk.discountRate * 100)) })
  const [err, setErr] = useState<Record<string, string>>({})
  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.saleStart || !f.saleEnd) e.period = errMsg('E-PK-101', '판매기간을 입력해 주세요')
    else if (f.saleStart > f.saleEnd) e.period = errMsg('E-PK-102', '판매 시작일이 종료일보다 늦습니다')
    const lim = Number(f.limit)
    if (!Number.isInteger(lim) || lim <= 0) e.limit = errMsg('E-PK-103', '판매 한도는 1 이상의 정수여야 합니다')
    else if (lim < minLimit) e.limit = errMsg('E-PK-104', `이미 ${minLimit}건이 판매되어 그보다 작게 설정할 수 없습니다`)
    const rate = Number(f.rate)
    if (!(rate >= 0 && rate <= 50)) e.rate = errMsg('E-PK-105', '할인율은 0~50% 범위로 입력해 주세요')
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ ...pk, saleStart: f.saleStart, saleEnd: f.saleEnd, limit: lim, discountRate: rate / 100 })
  }
  return (
    <Modal open onClose={onClose} title={`패키지 수정 · ${pk.name}`}
      footer={<><button className="btn-outline btn-sm" onClick={onClose}>취소</button><button className="btn-primary btn-sm" onClick={submit}>저장</button></>}>
      <div className="space-y-3">
        <Field label="판매기간" required error={err.period}>
          <div className="flex items-center gap-1">
            <input type="date" className="input" value={f.saleStart} onChange={e => setF({ ...f, saleStart: e.target.value })} />
            <span className="text-muted">~</span>
            <input type="date" className="input" value={f.saleEnd} onChange={e => setF({ ...f, saleEnd: e.target.value })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="판매 한도(건)" required error={err.limit} hint={`현재 판매 ${minLimit}건`}>
            <input type="number" className="input" value={f.limit} onChange={e => setF({ ...f, limit: e.target.value })} />
          </Field>
          <Field label="할인율(%)" required error={err.rate}>
            <input type="number" className="input" value={f.rate} onChange={e => setF({ ...f, rate: e.target.value })} />
          </Field>
        </div>
        <Note tone="warn">할인율 변경은 저장 이후 신규 주문부터 적용되며, 기존 주문 금액에는 영향을 주지 않습니다. 변경 내역은 변경이력에 기록됩니다.</Note>
      </div>
    </Modal>
  )
}
