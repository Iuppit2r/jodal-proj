import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DAILY_LABELS, DAILY_QUERIES, HOURLY, QA_LOGS, QUERY_TYPES, TOPICS, UNRESOLVED_RATE, WRONG_REPORT_RATE } from '../../data/admin'
import { AreaChart, Badge, Card, DateRangePicker, ExportMenu, fmtDate, HBarList, PageHeader, useToast, type DateRange } from './ui'

// 이용 현황 통계 및 분석: 이용 건수·이용 시간대·질의 유형·관심 분야·미해결·오답 질의, 기간별 조회, CSV·Excel 내보내기
const TODAY = new Date(2026, 8, 30) // 목업 기준일
const DAILY = DAILY_QUERIES.map((value, i) => ({ label: DAILY_LABELS[i], value, date: new Date(2026, 8, i + 1) }))
const TOTAL = DAILY_QUERIES.reduce((a, b) => a + b, 0)

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>({ from: new Date(2026, 8, 1), to: TODAY })
  const toast = useToast()

  // 목업: 기간 합계 비율로 유형·분야 건수를 환산
  const chartData = DAILY.filter((d) => d.date >= range.from && d.date <= range.to)
  const usage = chartData.reduce((a, d) => a + d.value, 0)
  const scale = (v: number) => Math.round((v * usage) / TOTAL)
  const period = `${fmtDate(range.from)} ~ ${fmtDate(range.to)}`
  const inRange = (at: string) => {
    const d = new Date(`${at.slice(0, 10)}T00:00:00`)
    return d >= range.from && d <= range.to
  }
  const unresolved = QA_LOGS.filter((q) => (q.status === '오답 신고' || q.status === '미해결') && inRange(q.at))
  const stats = [
    { label: '이용 건수', value: usage, unit: '건' },
    { label: '미해결 질의', value: Math.round(usage * UNRESOLVED_RATE), unit: '건' },
    { label: '오답 신고', value: Math.round(usage * WRONG_REPORT_RATE), unit: '건' },
  ]

  return (
    <>
      <PageHeader
        title="이용 현황 통계"
        description="이용 건수·이용 시간대·질의 유형·관심 분야를 기간별로 조회합니다."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} today={TODAY} />
            <ExportMenu onExport={(_, label) => toast(`${period} 통계를 ${label} 파일로 내보냈습니다`)} />
          </>
        }
      />

      <dl className="grid overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:grid-cols-3">
        {stats.map((k) => (
          <div key={k.label} className="border-zinc-200 p-5 max-sm:not-last:border-b sm:not-last:border-r">
            <dt className="text-sm text-zinc-500">{k.label}</dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
              {k.value.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-zinc-400">{k.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="이용 건수 추이" description={`${period} · 일 단위`} className="lg:col-span-2">
          {chartData.length > 1 ? (
            <AreaChart data={chartData} caption={`${period} 이용 건수 추이`} />
          ) : (
            <p className="grid h-60 place-items-center text-sm text-zinc-500">추이를 보려면 2일 이상의 기간을 선택하세요</p>
          )}
        </Card>

        <Card title="질의 유형" description="유형별 질의 건수">
          <HBarList data={QUERY_TYPES.map((t) => ({ label: t.label, value: scale(t.value) }))} unit="건" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="관심 분야" description="주제별 문의 빈도 · 상위 7개" className="lg:col-span-2">
          <HBarList data={TOPICS.map((t) => ({ label: t.topic, value: scale(t.count) }))} unit="건" />
        </Card>
        <Card title="이용 시간대" description="시간대별 평균 질의">
          <div className="flex h-40 items-end gap-[2px]">
            {HOURLY.map((v, h) => (
              <div key={h} className="group relative flex h-full flex-1 items-end" role="img" aria-label={`${h}시 ${v}건`}>
                <div className="w-full rounded-t-[3px] bg-blue-600/80 group-hover:bg-blue-600" style={{ height: `${(v / 55) * 100}%` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">
                  {h}시 · {v}건
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-zinc-400" aria-hidden>
            <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span>
          </div>
        </Card>
      </div>

      <Card
        title="미해결·오답 질의"
        description="오답 신고 또는 근거를 찾지 못한 질의 · 개선에 활용"
        className="mt-6"
        flush
        actions={
          <Link to="/admin/conversations" className="inline-flex items-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-900">
            전체 보기 <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        }
      >
        {unresolved.length === 0 && <p className="px-5 py-8 text-center text-sm text-zinc-500">선택한 기간에 미해결·오답 질의가 없습니다</p>}
        <ul className="divide-y divide-zinc-100">
          {unresolved.map((q) => (
            <li key={q.id}>
              <Link to="/admin/conversations" className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-zinc-50">
                <Badge dot tone={q.status === '오답 신고' ? 'bad' : 'warn'}>{q.status}</Badge>
                <span className="min-w-0 flex-1 truncate text-zinc-800">{q.question}</span>
                <span className="shrink-0 text-xs text-zinc-400 tabular-nums max-sm:hidden">{q.at.slice(5)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
