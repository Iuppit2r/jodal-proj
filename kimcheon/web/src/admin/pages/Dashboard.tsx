import { ChevronRight } from 'lucide-react'
import { byId, fmtDate, TOTAL } from '../../data'
import { dailyVisitors, peakCounts, records, roundStats, roundStatus, userById } from '../data'
import { useAdmin } from '../store'
import { Badge, HBars, Line, PageHead, Panel, Stat, Table } from '../ui'

export function Dashboard() {
  const { roundId, rounds, applications, go } = useAdmin()
  const rd = rounds.find((r) => r.id === roundId)!
  const st = roundStats[roundId]
  const counts = peakCounts(roundId)
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, v]) => ({ label: byId(id).title, v }))
  const today = records.filter((r) => r.at.startsWith('2026-10-0')).length
  const waiting = applications.filter((a) => a.status !== '수령완료').length

  return (
    <>
      <PageHead
        title="대시보드"
        desc={`${rd.name} · ${rd.start.replaceAll('-', '.')} ~ ${rd.end.replaceAll('-', '.')}`}
        actions={<Badge tone={roundStatus(rd) === '진행중' ? 'green' : 'gray'}>{roundStatus(rd)}</Badge>}
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="참여자" value={`${st.participants.toLocaleString()}명`} sub="본인인증 가입 기준" />
        <Stat label="누적 인증" value={`${st.certs.toLocaleString()}건`} sub={roundId === 'r2026' ? `이번 주 ${today}건` : '회차 종료 집계'} />
        <Stat label="완등자" value={`${st.completers.toLocaleString()}명`} sub={`${TOTAL}산 전체 인증`} tone="forest" />
        <Stat label="지급 처리 대기" value={`${waiting}건`} sub="신청완료 · 지급준비" tone="accent" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="앱 일별 방문자 (최근 30일)" action={<button onClick={() => go('weblog')} className="text-[14px] font-bold text-brand">웹로그 분석</button>}>
          <div className="p-5">
            <Line data={dailyVisitors.map((d) => ({ label: d.date, v: d.v }))} />
          </div>
        </Panel>
        <Panel title="인증 많은 산" action={<button onClick={() => go('stats')} className="text-[14px] font-bold text-brand">통계 보기</button>}>
          <div className="p-5">
            <HBars data={top} />
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="최근 인증"
        action={
          <button onClick={() => go('certs')} className="flex items-center text-[14px] font-bold text-brand">
            인증현황 전체 <ChevronRight size={16} />
          </button>
        }
      >
        <Table
          rows={records.slice(0, 8)}
          rowKey={(r) => String(r.no)}
          startNo={records.length}
          cols={[
            { h: '사용자', cell: (r) => <span className="font-semibold">{userById(r.userId).masked}</span> },
            { h: '산 이름', cell: (r) => byId(r.mountainId).title },
            { h: '인증 일시', cell: (r) => `${fmtDate(r.at)} ${r.at.slice(11)}` },
            { h: '정상석 거리', align: 'right', cell: (r) => `${r.distM}m` },
            { h: '상태', align: 'center', cell: () => <Badge tone="green">인증</Badge> },
          ]}
        />
      </Panel>
    </>
  )
}
