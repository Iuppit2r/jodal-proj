import { useState } from 'react'
import { Download, Inbox, MessageSquareText, Star, ThumbsDown, ThumbsUp, Timer } from 'lucide-react'
import { Card, PageHeader, Segmented, Stat } from '../../components/ui'
import { Anno } from '../../proposal'

const DIST = [{ star: 5, n: 612 }, { star: 4, n: 388 }, { star: 3, n: 121 }, { star: 2, n: 44 }, { star: 1, n: 29 }]
const ITEMS = [
  { id: 1, time: '09-30 13:42', rating: 'down', q: '정기 컨테이너선 감면율은?', comment: '인센티브 금액이 공고와 다릅니다.', status: '조치 중' },
  { id: 2, time: '09-30 11:08', rating: 'down', q: '위험물 부두 야간 작업 가능?', comment: '답을 못 찾네요. 매뉴얼을 추가해 주세요.', status: '접수' },
  { id: 3, time: '09-30 10:51', rating: 'up', q: '입항신고 절차 알려줘', comment: '', status: '' },
  { id: 4, time: '09-29 17:20', rating: 'down', q: 'Berth availability tomorrow at Onsan', comment: 'Answer was in Korean only.', status: '완료' },
  { id: 5, time: '09-29 15:02', rating: 'up', q: '채용 필기 과목', comment: '빠르고 정확해요', status: '' },
  { id: 6, time: '09-29 09:33', rating: 'down', q: '3부두 대기시간', comment: '예측이 실제보다 3시간 늦었어요', status: '완료' },
]
const FILTERS = ['부정 평가', '전체'] as const

export default function FeedbackPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('부정 평가')
  const total = DIST.reduce((s, d) => s + d.n, 0)
  const avg = DIST.reduce((s, d) => s + d.star * d.n, 0) / total
  const rows = ITEMS.filter((i) => filter === '전체' || i.rating === 'down')

  return (
    <div className="page">
      <PageHeader
        title="사용자 피드백"
        desc="답변별 평가와 서비스 만족도 조사 결과를 확인하고 개선 조치를 관리합니다"
        solves={['일방향 정보 제공', '이용자 의견 반영 경로 부재']}
        actions={<button className="btn"><Download size={15} />Excel 내보내기</button>}
      />

      <div className="grid cols-4 mb">
        <Stat label="평균 만족도" icon={Star} value={`${avg.toFixed(2)} / 5`} foot={`응답 ${total.toLocaleString()}건`} />
        <Stat label="답변 긍정 평가율" spark={[83.1, 84.0, 84.6, 85.2, 85.0, 86.1, 86.9, 87.4]} icon={ThumbsUp} value="87.4%" trend={{ dir: 'up', good: true, text: '전월 대비 2.1%p 상승' }} />
        <Stat label="미처리 개선 요청" icon={Inbox} value="14건" foot="접수 9건 · 조치 중 5건" />
        <Stat label="평균 처리 기간" spark={[3.1, 2.9, 2.6, 2.4, 2.4, 2.1, 1.9, 1.8]} icon={Timer} value="1.8일" trend={{ dir: 'down', good: true, text: '전월 대비 0.6일 단축' }} />
      </div>

      <div className="grid cols-3">
        <Anno n={1}>
        <Card title="만족도 분포" icon={Star} bodyClass="card-body stack">
          {DIST.map((d) => (
            <div key={d.star} className="rating-row">
              <span><Star size={13} fill="#f39322" color="#f39322" />{d.star}</span>
              <div className="progress"><span style={{ width: `${(d.n / DIST[0].n) * 100}%`, background: 'var(--signal)' }} /></div>
              <span>{d.n}</span>
            </div>
          ))}
        </Card>
        </Anno>

        <Anno n={2} className="span-2">
        <Card title="답변별 피드백" icon={MessageSquareText}
          actions={<Segmented label="필터" value={filter} options={FILTERS} onChange={setFilter} />}>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">답변별 사용자 피드백 목록</caption>
              <thead><tr><th>일시</th><th>평가</th><th>질문</th><th>의견</th><th>조치 상태</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="muted num">{r.time}</td>
                    <td>{r.rating === 'up' ? <span className="badge badge-green"><ThumbsUp size={12} />도움됨</span> : <span className="badge badge-red"><ThumbsDown size={12} />아쉬움</span>}</td>
                    <td className="wrap strong" style={{ minWidth: 180 }}>{r.q}</td>
                    <td className="wrap" style={{ minWidth: 200 }}>{r.comment || <span className="faint">의견 없음</span>}</td>
                    <td>
                      {r.status ? (
                        <select className="select" style={{ width: 100 }} defaultValue={r.status} aria-label="조치 상태">
                          <option>접수</option><option>조치 중</option><option>완료</option>
                        </select>
                      ) : <span className="faint">해당 없음</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </Anno>
      </div>
    </div>
  )
}
