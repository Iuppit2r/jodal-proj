import clsx from 'clsx'
import { ArrowRight, Bell, ChevronRight, Download, Minus, Plus, Rocket, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { CHANGES, MONITOR_TARGETS, UPDATE_HISTORY, type Severity } from '../../data/admin'
import { Badge, Button, Card, Drawer, FilterChip, PageHeader, Table, Tabs, Td, useToast, type Tone } from './ui'

// 수집 → 감지·판정 → 검증·반영 → 배포 → 통지
const STAGES = [
  { name: '수집', desc: '12개 기관 · 매일 03:00', icon: Download },
  { name: '감지·판정', desc: '신규·개정 여부, 중요도', icon: Search },
  { name: '검증·반영', desc: '담당자 검수 후 색인', icon: ShieldCheck },
  { name: '배포', desc: '무중단 반영', icon: Rocket },
  { name: '통지', desc: '담당자 알림·보고', icon: Bell },
]
const SEV_TONE: Record<Severity, Tone> = { 긴급: 'bad', 중요: 'warn', 일반: 'neutral' }
type Change = (typeof CHANGES)[number]
type Tab = 'changes' | 'history' | 'targets'
const RESULT_TONE: Record<(typeof UPDATE_HISTORY)[number]['result'], Tone> = { 반영: 'good', '변경 없음': 'neutral', 반려: 'warn', '수집 실패': 'bad' }

export default function Updates() {
  const [tab, setTab] = useState<Tab>('changes')
  const [open, setOpen] = useState<Change | null>(null)
  const toast = useToast()
  const inStage = (i: number) => CHANGES.filter((c) => c.stage === i).length

  return (
    <>
      <PageHeader
        title="최신성 관리"
        description="ESG 기준 제정기관·소관부처의 신규·개정 자료를 감지해, 검증 후 서비스 중단 없이 반영합니다."
        actions={<span className="text-xs text-zinc-500">마지막 수집 오늘 03:00</span>}
      >
        <Tabs
          label="보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'changes', label: '변경 감지', count: CHANGES.filter((c) => c.stage < 4).length },
            { value: 'history', label: '갱신 이력' },
            { value: 'targets', label: '모니터링 대상', count: MONITOR_TARGETS.length },
          ]}
        />
      </PageHeader>

      {/* 파이프라인: 단계 순서를 화살표로 잇고, 단계별 처리 건수를 문장으로 표시 */}
      <Card flush className="mb-6">
        <ol className="grid grid-cols-1 sm:grid-cols-5">
          {STAGES.map((s, i) => {
            const n = inStage(i)
            const last = i === STAGES.length - 1
            const active = n > 0 && !last
            return (
              <li key={s.name} className="relative flex items-center gap-3 border-zinc-100 px-5 py-4 max-sm:not-last:border-b sm:flex-col sm:items-start sm:not-last:border-r">
                <span className={clsx('grid size-9 shrink-0 place-items-center rounded-full', active ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500')}>
                  <s.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    <span className="mr-1 text-zinc-400 tabular-nums">{i + 1}</span>
                    {s.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{s.desc}</p>
                  <p className={clsx('mt-2 text-xs font-medium', active ? 'text-blue-700' : 'text-zinc-400')}>
                    {last ? `완료 ${n}건` : n ? `처리 중 ${n}건` : '대기 없음'}
                  </p>
                </div>
                {!last && (
                  <span className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200 sm:grid" aria-hidden>
                    <ChevronRight className="size-3.5" />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      {tab === 'changes' ? (
        <Card flush>
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-5 py-3">
            <FilterChip label="중요도" options={['긴급', '중요', '일반']} />
            <FilterChip label="단계" options={STAGES.map((s) => s.name)} />
            <FilterChip label="기관" options={MONITOR_TARGETS.map((t) => t.name)} />
          </div>
          <Table head={['중요도', '변경 내용', '진행', '감지', '']} minWidth={760}>
            {CHANGES.map((c) => (
              <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer hover:bg-zinc-50">
                <Td className="w-24"><Badge dot tone={SEV_TONE[c.severity]}>{c.severity}</Badge></Td>
                <Td>
                  <p className="font-medium text-zinc-900">{c.title}</p>
                  <p className="text-xs text-zinc-500">{c.source}</p>
                </Td>
                <Td>
                  <div className="flex items-center gap-2" aria-label={`${STAGES[c.stage].name} 단계`}>
                    <div className="flex gap-0.5" aria-hidden>
                      {STAGES.map((s, i) => (
                        <span key={s.name} className={clsx('h-1.5 w-4 rounded-full', i < c.stage ? 'bg-zinc-900' : i === c.stage ? (c.stage === 4 ? 'bg-zinc-900' : 'bg-blue-500') : 'bg-zinc-200')} />
                      ))}
                    </div>
                    <span className="text-xs whitespace-nowrap text-zinc-600">{c.stage === 4 ? '완료' : STAGES[c.stage].name}</span>
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{c.detectedAt.slice(5)}</Td>
                <Td className="w-28 text-right">
                  {c.stage === 2 ? (
                    <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setOpen(c) }}>검수하기</Button>
                  ) : c.stage === 1 ? (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setOpen(c) }}>판정하기</Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : tab === 'history' ? (
        <Card flush>
          <Table head={['수집 일시', '대상', '반영 결과', '내용']} minWidth={640}>
            {UPDATE_HISTORY.map((h) => (
              <tr key={h.at + h.target} className="hover:bg-zinc-50">
                <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{h.at}</Td>
                <Td className="font-medium">{h.target}</Td>
                <Td><Badge dot tone={RESULT_TONE[h.result]}>{h.result}</Badge></Td>
                <Td className="text-zinc-600">{h.note}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <Card flush>
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
            <p className="text-sm text-zinc-500">수집 대상 기관 {MONITOR_TARGETS.length}곳</p>
            <Button size="sm" onClick={() => toast('수집 대상 추가 창을 엽니다')}>
              <Plus className="size-3.5" aria-hidden />대상 추가
            </Button>
          </div>
          <Table head={['기관', '분류', '주기', '최근 수집', '상태', '']} minWidth={680}>
            {MONITOR_TARGETS.map((t) => (
              <tr key={t.name} className="hover:bg-zinc-50">
                <Td className="font-medium">{t.name}</Td>
                <Td className="text-zinc-600">{t.group}</Td>
                <Td className="text-zinc-600">{t.cycle}</Td>
                <Td className="text-zinc-500 tabular-nums">{t.last.slice(5)}</Td>
                <Td>{t.ok ? <Badge dot tone="good">정상</Badge> : <Badge dot tone="bad">수집 실패</Badge>}</Td>
                <Td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => toast(`${t.name} 수집 설정을 엽니다`)}>수정</Button>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        <strong className="font-medium text-zinc-700">긴급</strong> 공시기준·법령 제·개정, 적용 시점 변경: 즉시 검수·반영, 즉시 통지 ·{' '}
        <strong className="font-medium text-zinc-700">중요</strong> 부분 개정: 검수 후 반영 · <strong className="font-medium text-zinc-700">일반</strong> 해설·경미 수정: 정기 반영
      </p>

      {open && <ChangeDrawer change={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function ChangeDrawer({ change, onClose }: { change: Change; onClose: () => void }) {
  const toast = useToast()
  return (
    <Drawer
      title={change.title}
      description={<span className="flex items-center gap-2"><Badge dot tone={SEV_TONE[change.severity]}>{change.severity}</Badge>{change.source} · {change.detectedAt}</span>}
      onClose={onClose}
      width={600}
      footer={
        <>
          <Button onClick={onClose}>반려</Button>
          <Button variant="primary" onClick={() => { toast('검수 완료 · 무중단 배포를 시작합니다'); onClose() }}>승인하고 반영</Button>
        </>
      }
    >
      <ol className="mb-6 flex items-center gap-2 text-xs">
        {STAGES.map((s, i) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className={clsx('rounded-full px-2 py-0.5 font-medium', i < change.stage ? 'bg-zinc-100 text-zinc-600' : i === change.stage ? 'bg-blue-600 text-white' : 'text-zinc-400')}>{s.name}</span>
            {i < STAGES.length - 1 && <span className="h-px w-3 bg-zinc-300" aria-hidden />}
          </li>
        ))}
      </ol>

      <h3 className="mb-2 text-sm font-semibold">변경 비교</h3>
      <div className="overflow-hidden rounded-lg border border-zinc-200 text-[13px] leading-relaxed">
        <div className="flex items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-500">(예시) 적용 시기 조항 · 기존 <ArrowRight className="size-3.5" aria-label="에서" /> 신규</div>
        <p className="flex items-start gap-2 bg-red-50 px-3 py-1.5 text-red-800"><Minus className="mt-1 size-3.5 shrink-0 text-red-400" aria-label="삭제" />Scope 3 배출량 공시는 최초 적용 연도부터 적용한다.</p>
        <p className="flex items-start gap-2 bg-emerald-50 px-3 py-1.5 text-emerald-800"><Plus className="mt-1 size-3.5 shrink-0 text-emerald-500" aria-label="추가" />Scope 3 배출량 공시는 최초 적용 연도 이후 일정 기간 유예할 수 있다.</p>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold">반영 전후 응답 변화 확인 대상</h3>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 text-sm">
        {([['우리 회사도 ESG 공시를 해야 하나요?', 142], ['작년에 바뀐 공시기준 내용을 알려주세요.', 57], ['온실가스 Scope 3가 무엇인가요?', 311]] as const).map(([q, n]) => (
          <li key={q} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="truncate">{q}</span>
            <span className="shrink-0 text-xs text-zinc-400">지난 30일 {n}회</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500">승인 시 기존 버전은 이력으로 보관되며, 반영 전후 응답 변화를 비교 리포트로 받습니다.</p>
    </Drawer>
  )
}
