import { Bot, Flag } from 'lucide-react'
import { useState } from 'react'
import { QA_LOGS, type QaStatus } from '../../data/admin'
import { Badge, Button, Card, Drawer, FilterChip, PageHeader, SearchInput, Table, Tabs, Td, useToast, type Tone } from './ui'

// 답변 검수·수정, 오답 신고 처리, 이력 유형별 분류·검토
const TABS = ['전체', '오답 신고', '미해결', '검수 완료'] as const
type Tab = (typeof TABS)[number]
const STATUS_TONE: Record<QaStatus, Tone> = { 정상: 'neutral', '오답 신고': 'bad', 미해결: 'warn', '검수 완료': 'good', 차단: 'neutral' }
type Log = (typeof QA_LOGS)[number]

export default function Conversations() {
  const [tab, setTab] = useState<Tab>('전체')
  const [open, setOpen] = useState<Log | null>(null)
  const rows = tab === '전체' ? QA_LOGS : QA_LOGS.filter((q) => q.status === tab)

  return (
    <>
      <PageHeader
        title="질의응답 검수"
        description="질의응답 이력을 유형별로 분류·검토하고, 오답 신고를 처리하며 답변을 수정합니다."
      >
        <Tabs
          label="처리 상태"
          value={tab}
          onChange={setTab}
          items={TABS.map((t) => ({ value: t, label: t, count: t === '전체' ? QA_LOGS.length : QA_LOGS.filter((q) => q.status === t).length }))}
        />
      </PageHeader>

      <Card flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-5 py-3">
          <SearchInput placeholder="질문 내용 검색" className="w-full sm:w-64" />
          <FilterChip label="주제" options={['공시기준', '온실가스', '공급망', 'ESG 기초', '지원사업', '진로']} />
          <FilterChip label="눈높이" options={['아주 쉽게', '학생 눈높이', '개념과 배경', '실무 중심', '전문가 수준']} />
          <FilterChip label="답변 유형" options={['근거 기반', '추론 포함', '확인 불가', '차단']} />
        </div>
        <Table head={['질문', '눈높이', '답변 유형', '근거', '상태', '일시']} minWidth={780}>
          {rows.map((q) => (
            <tr key={q.id} onClick={() => setOpen(q)} className="cursor-pointer hover:bg-zinc-50">
              <Td className="max-w-80">
                <p className="truncate font-medium text-zinc-900">{q.question}</p>
                <p className="text-xs text-zinc-500">{q.topic}</p>
              </Td>
              <Td className="whitespace-nowrap text-zinc-600">{q.level}</Td>
              <Td className="whitespace-nowrap text-zinc-600">{q.kind}</Td>
              <Td className="text-zinc-600 tabular-nums">{q.sources}</Td>
              <Td><Badge dot tone={STATUS_TONE[q.status]}>{q.status}</Badge></Td>
              <Td className="whitespace-nowrap text-zinc-500 tabular-nums">{q.at.slice(5)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      {open && <ReviewDrawer log={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function ReviewDrawer({ log, onClose }: { log: Log; onClose: () => void }) {
  const toast = useToast()
  const [editing, setEditing] = useState(log.status === '오답 신고' || log.status === '미해결')
  const [answer, setAnswer] = useState(
    log.sources
      ? 'Scope 3는 상류 8개, 하류 7개 범주로 구분됩니다. 출장(Business travel)은 상류 범주에 해당하며, 임직원의 업무상 이동에서 발생하는 배출을 포함합니다.'
      : '현재 ESG 지식베이스에서 이 질문에 대한 근거 자료를 찾지 못했어요.',
  )
  const done = (msg: string) => {
    toast(msg)
    onClose()
  }

  return (
    <Drawer
      title="답변 검수"
      description={
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge dot tone={STATUS_TONE[log.status]}>{log.status}</Badge>
          <Badge tone="info">{log.level}</Badge>
          <Badge>{log.kind}</Badge>
          <span className="text-xs">{log.at}</span>
        </span>
      }
      onClose={onClose}
      width={560}
      footer={
        <>
          <Button onClick={() => done('정상 답변으로 처리했습니다')}>정상 처리</Button>
          <Button variant="primary" onClick={() => done('수정 답변을 저장하고 검수 완료했습니다')}>저장·검수 완료</Button>
        </>
      }
    >
      {/* 대화 재현 */}
      <div className="space-y-4 rounded-xl bg-zinc-50 p-4">
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-3.5 py-2 text-sm text-white">{log.question}</p>
        </div>
        <div className="flex gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-white" aria-hidden>
            <Bot className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <textarea
                aria-label="답변 수정"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                className="w-full resize-y rounded-2xl rounded-tl-md border border-blue-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed ring-4 ring-blue-50 focus:outline-none"
              />
            ) : (
              <p className="rounded-2xl rounded-tl-md border border-zinc-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-zinc-700">{answer}</p>
            )}
            <button onClick={() => setEditing(!editing)} className="mt-1.5 text-xs font-medium text-blue-700 hover:underline">
              {editing ? '미리보기' : '답변 수정'}
            </button>
          </div>
        </div>
      </div>

      {log.status === '오답 신고' && (
        <div className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3.5 text-sm">
          <Flag className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <div>
            <p className="font-medium text-red-900">이용자 신고 · 사실과 다른 내용이에요</p>
            <p className="mt-0.5 text-red-800/80">“출장은 6번 범주로 알고 있어요”</p>
          </div>
        </div>
      )}

      <h3 className="mt-6 mb-2 text-sm font-semibold">사용된 근거 <span className="font-normal text-zinc-400">{log.sources}건</span></h3>
      {log.sources ? (
        <ul className="space-y-2">
          {Array.from({ length: log.sources }, (_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-medium text-zinc-600">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">Scope 3 Standard</p>
                <p className="text-xs text-zinc-500">GHG Protocol · Chapter 5 · p.{31 + i * 4}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">지식베이스에서 근거를 확인하지 못한 질의입니다</p>
      )}
    </Drawer>
  )
}
