import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, History, Info, Save } from 'lucide-react'
import { useStore } from '../../../store'
import * as M from '../../../data/mock'
import type { Performance, Round } from '../../../data/types'
import { fmtRange } from '../../../lib/format'
import Poster from '../../../components/Poster'
import { Card, Empty, Note, PageHeader, Stat, Status, Tabs, ask, errMsg, type TabDef } from '../../ui'
import { TODAY, num, seatCount, useSoldByRound } from '../../lib'
import {
  FIELD_TAB, TAB_ORDER, blankPerf, defaultExtras, usePerfExtras, validateAll, validateBasic,
  type Errors, type PerfExtras,
} from './shared'
import { BasicTab, PriceTab } from './BasicTab'
import ContentTab from './ContentTab'
import RoundsTab from './RoundsTab'
import { OpenTab, PresaleTab } from './PresaleTab'
import TicketLayoutTab from './TicketLayoutTab'

const TAB_LABEL: Record<string, string> = {
  basic: '기본정보', price: '가격·권종', content: '콘텐츠', open: '오픈정보', rounds: '회차', presale: '선예매 설정', layout: '티켓 레이아웃',
}

export default function PerfEdit() {
  const { id = 'new' } = useParams()
  const perfs = useStore(s => s.performances)
  const existing = perfs.find(x => x.id === id)
  if (id !== 'new' && !existing) {
    return (
      <div className="space-y-4">
        <PageHeader title="공연 정보" code="SFR-TC-001" />
        <div className="card"><Empty text={errMsg('E-TC-404', '존재하지 않거나 삭제된 공연입니다.')} /></div>
        <Link to="/admin/performances" className="btn-outline btn-sm"><ArrowLeft size={14} />목록으로</Link>
      </div>
    )
  }
  return <Editor key={id} initial={existing} />
}

function Editor({ initial }: { initial?: Performance }) {
  const nav = useNavigate()
  const allPerfs = useStore(s => s.performances)
  const auditLogs = useStore(s => s.auditLogs)
  const store = useStore.getState()
  const isNew = !initial
  const [p, setP] = useState<Performance>(() => initial ? structuredClone(initial) : blankPerf(allPerfs))
  const [rounds, setRoundsLocal] = useState<Round[]>(() => useStore.getState().rounds.filter(r => r.perfId === p.id).map(r => ({ ...r })))
  const [ex, setExState] = useState<PerfExtras>(() => usePerfExtras.getState().map[p.id] ?? defaultExtras())
  const [errors, setErrors] = useState<Errors>({})
  const [tab, setTab] = useState('basic')
  const [dirty, setDirty] = useState(false)
  const soldBy = useSoldByRound()

  const set = (patch: Partial<Performance>) => {
    setP(prev => ({ ...prev, ...patch }))
    setDirty(true)
    if (Object.keys(errors).length) setErrors(e => { const n = { ...e }; for (const k of Object.keys(patch)) delete n[k]; return n })
  }
  const setEx = (patch: Partial<PerfExtras>) => {
    setExState(prev => ({ ...prev, ...patch }))
    setDirty(true)
    if ('ticketTypes' in patch && errors.ticketTypes) setErrors(e => { const n = { ...e }; delete n.ticketTypes; return n })
  }
  const setRounds = (rs: Round[]) => {
    setRoundsLocal(rs)
    setDirty(true)
    if (errors.rounds) setErrors(e => { const n = { ...e }; delete n.rounds; return n })
  }

  const basicErr = useMemo(() => validateBasic(p), [p])
  const locked = isNew && Object.keys(basicErr).length > 0
  const errCount = (t: string) => Object.keys(errors).filter(k => FIELD_TAB[k] === t).length

  const tabs: TabDef[] = TAB_ORDER.map(t => ({
    id: t, label: TAB_LABEL[t] + (t === 'rounds' ? ` (${rounds.filter(r => r.active).length})` : ''),
    disabled: t !== 'basic' && locked, badge: errCount(t) || undefined,
  }))

  const history = useMemo(() => {
    const keys = [initial?.title, p.title, p.code].filter((x): x is string => !!x && x.length > 1)
    return auditLogs.filter(l => keys.some(k => l.target.includes(k))).slice(0, 30)
  }, [auditLogs, initial?.title, p.title, p.code])

  const sold = rounds.reduce((a, r) => a + (soldBy.get(r.id) ?? 0), 0)
  const cap = rounds.filter(r => r.active).length * seatCount(p)

  const save = async (draft: boolean) => {
    const errs = draft ? (p.title.trim() ? {} : { title: '임시저장 시에도 공연명은 필수입니다' }) : validateAll(p, rounds, ex)
    const keys = Object.keys(errs)
    if (keys.length) {
      setErrors(errs)
      const first = TAB_ORDER.find(t => keys.some(k => FIELD_TAB[k] === t)) ?? 'basic'
      setTab(first)
      store.toast(errMsg('E-TC-102', `필수 입력값 누락 (${keys.length}건) – ${TAB_LABEL[first]} 탭을 확인하세요`), 'err')
      return
    }
    let status = p.status
    if (draft) status = '임시저장'
    else if (status === '임시저장') {
      const now = `${TODAY} ${new Date().toTimeString().slice(0, 5)}`
      status = now >= p.openAt ? '판매중' : p.presaleAt && now >= p.presaleAt ? '선예매중' : '오픈예정'
    }
    if (!draft && initial && initial.status !== status && (status === '판매중지' || status === '판매종료')) {
      const r = await ask({ title: '판매상태 변경', tone: 'warn', confirmText: '변경 후 저장', message: <>판매상태를 <b>{status}</b>(으)로 변경하면 홈페이지 예매 버튼이 즉시 비활성화됩니다. 계속하시겠습니까?</> })
      if (r === null) return
    }
    const finalP: Performance = { ...p, status, title: p.title.trim() }
    store.upsertPerformance(finalP)
    const before = JSON.stringify(useStore.getState().rounds.filter(r => r.perfId === p.id))
    if (before !== JSON.stringify(rounds)) store.setRounds(p.id, rounds)
    usePerfExtras.getState().put(p.id, ex)
    if (initial && initial.status !== status) store.log('판매상태 변경', `${finalP.title}: ${initial.status} → ${status}`)
    store.toast(draft ? `<${finalP.title}> 임시저장되었습니다` : `<${finalP.title}> 저장 완료 · 판매상태 '${status}'${['판매중', '선예매중', '오픈예정'].includes(status) ? ' (홈페이지 즉시 반영)' : ''}`)
    setDirty(false)
    nav('/admin/performances')
  }

  const cancel = async () => {
    if (dirty) {
      const r = await ask({ title: '작성 취소', tone: 'warn', confirmText: '나가기', message: '저장하지 않은 변경 내용이 사라집니다. 목록으로 이동하시겠습니까?' })
      if (r === null) return
    }
    nav('/admin/performances')
  }

  const tp = { p, set, errors, ex, setEx }
  const venue = M.venues.find(v => v.id === p.venueId)

  return (
    <div className="space-y-4">
      <PageHeader
        title={isNew ? '공연 등록' : '공연 정보 수정'}
        code="SFR-TC-001~004"
        desc={isNew ? '기본정보 필수항목(*)을 입력하면 나머지 탭이 활성화됩니다.' : <>{p.code} · {p.title}</>}
        actions={<button className="btn-outline btn-sm" onClick={cancel}><ArrowLeft size={14} />목록</button>}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          {locked && tab === 'basic' && (
            <Note className="mb-3"><Info size={12} className="mr-1 inline" />신규 공연은 기본정보 필수항목({Object.keys(basicErr).length}건 미입력)을 모두 입력해야 가격·회차 등 다음 단계 탭이 활성화됩니다.</Note>
          )}
          {tab === 'basic' && <BasicTab {...tp} />}
          {tab === 'price' && <PriceTab {...tp} />}
          {tab === 'content' && <ContentTab {...tp} />}
          {tab === 'open' && <OpenTab {...tp} />}
          {tab === 'rounds' && <RoundsTab {...tp} rounds={rounds} setRounds={setRounds} soldBy={soldBy} />}
          {tab === 'presale' && <PresaleTab {...tp} rounds={rounds} />}
          {tab === 'layout' && <TicketLayoutTab {...tp} rounds={rounds} />}
        </div>

        <aside className="space-y-4">
          <Card title="미리보기" bodyClass="p-4">
            <div className="flex gap-3">
              {ex.mainImage
                ? <img src={ex.mainImage} alt="대표이미지" className="h-32 w-24 shrink-0 rounded-lg object-cover shadow" />
                : <Poster title={p.title || '공연명'} palette={p.palette} motif={p.motif} sub={p.subtitle} className="h-32 w-24 shrink-0 rounded-lg shadow" />}
              <div className="min-w-0 space-y-1 text-xs">
                <Status s={p.status} />
                <div className="truncate text-sm font-bold">{p.title || '(공연명 미입력)'}</div>
                <div className="text-muted">{p.code}</div>
                <div className="text-muted">{venue?.name}</div>
                <div className="text-muted tabular-nums">{p.start && p.end ? fmtRange(p.start, p.end) : '-'}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="사용 회차" value={`${rounds.filter(r => r.active).length}회`} />
              <Stat label="판매 좌석" value={`${num(sold)} / ${num(cap)}`} />
            </div>
            {!isNew && (
              <a href={`#/site/performances/${p.id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm mt-3 w-full">
                <ExternalLink size={13} />홈페이지에서 보기
              </a>
            )}
          </Card>
          <Card title={<span className="flex items-center gap-1.5"><History size={14} />변경이력</span>} sub="이 공연 관련 관리자 작업 로그" bodyClass="p-0">
            {history.length ? (
              <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
                {history.map(l => (
                  <li key={l.id} className="px-4 py-2.5 text-xs">
                    <div className="font-semibold text-ink">{l.action}</div>
                    <div className="truncate text-muted">{l.target}</div>
                    <div className="mt-0.5 text-[11px] text-muted tabular-nums">{l.at} · {l.who} · {l.ip}</div>
                  </li>
                ))}
              </ul>
            ) : <Empty text="변경이력이 없습니다." />}
          </Card>
        </aside>
      </div>

      <div className="no-print sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-white/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="text-xs text-muted">
          {Object.keys(errors).length
            ? <span className="font-semibold text-coral-500">{errMsg('E-TC-102', `필수 입력값 누락 (${Object.keys(errors).length}건)`)}</span>
            : dirty ? '저장하지 않은 변경사항이 있습니다.' : '변경사항 없음'}
        </div>
        <div className="flex gap-2">
          <button className="btn-outline btn-sm" onClick={cancel}>취소</button>
          <button className="btn-outline btn-sm" onClick={() => save(true)}>임시저장</button>
          <button className="btn-primary btn-sm" onClick={() => save(false)}><Save size={14} />저장</button>
        </div>
      </div>
    </div>
  )
}
