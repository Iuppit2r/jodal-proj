import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  BellRing, BookCheck, ChevronRight, CircleCheck, FileSearch, Gavel, ListChecks, Play, Save, Scale, Settings2, ShieldAlert,
  Target, TrendingUp, TriangleAlert, WandSparkles, X,
} from 'lucide-react'
import { axis, Card, ChartTip, grid, Legend, PageHeader, Stat } from '../../components/ui'
import { Anno } from '../../proposal'

const TREND = Array.from({ length: 12 }, (_, i) => ({
  run: `9/${8 + i * 2}`,
  relevancy: +(0.86 + Math.sin(i / 2) * 0.03 + i * 0.004).toFixed(3),
  recall: +(0.81 + Math.cos(i / 3) * 0.03 + i * 0.005 - (i === 7 ? 0.09 : 0)).toFixed(3),
  faithfulness: +(0.9 + Math.sin(i / 4) * 0.02 + i * 0.002).toFixed(3),
}))

interface Row { id: number; q: string; answer: string; context: string; relevancy: number; recall: number; faithfulness: number; reason: string }

const ROWS: Row[] = [
  { id: 1, q: '외항선 입항료 산정 기준은?', answer: '총톤수와 외항·내항 구분에 따라 톤당 요율을 곱해 산정합니다.', context: '사용료 규정 제12조: 선박 입항료는 총톤수를 기준으로 …', relevancy: 0.95, recall: 0.92, faithfulness: 0.97, reason: '질문 의도(산정 기준)에 직접 답했으며, 모든 주장이 제12조 컨텍스트에서 확인됩니다.' },
  { id: 2, q: '정기 컨테이너선 감면율은 얼마인가요?', answer: '신규 항로 개설 시 최대 50%까지 감면됩니다.', context: '인센티브 지침 제5조: 신규 항로 개설 선사는 입항료의 30% …', relevancy: 0.88, recall: 0.61, faithfulness: 0.42, reason: '답변의 "최대 50%"가 컨텍스트(30%)와 다릅니다. 감면 기간 조건이 빠져 문맥 재현율도 낮습니다.' },
  { id: 3, q: '울산신항 북항 선석 수는?', answer: '울산신항 북항에는 컨테이너와 일반화물 선석이 운영 중입니다.', context: '울산항 시설현황: 신항 북항 … 선석', relevancy: 0.71, recall: 0.78, faithfulness: 0.93, reason: '질문은 선석 수를 묻지만 답변에 수치가 없어 답변 적합성이 감점되었습니다.' },
  { id: 4, q: 'NCS 필기시험 과목 알려줘', answer: '직업기초능력(의사소통, 수리, 문제해결 등)과 직렬별 전공 과목입니다.', context: '2026 하반기 채용공고: 필기전형: NCS 직업기초능력 …', relevancy: 0.93, recall: 0.9, faithfulness: 0.96, reason: '과목 구성을 정확히 열거했고 출처 공고와 일치합니다.' },
  { id: 5, q: 'What documents are needed for crew change?', answer: 'A crew list, passport copies and the immigration form are required.', context: '입출항 매뉴얼 4장: 선원 교대 시 선원명부, 여권 사본 …', relevancy: 0.9, recall: 0.84, faithfulness: 0.91, reason: '영문 질의에 영문으로 답했고, 필요 서류 3종 모두 컨텍스트에 근거가 있습니다.' },
  { id: 6, q: '위험물 부두 야간 작업 가능 여부', answer: '관련 규정을 찾을 수 없어 통합검색 결과를 안내했습니다.', context: '검색 결과 없음', relevancy: 0.66, recall: 0, faithfulness: 1, reason: '지식 범위 밖 질문에 가드레일이 정상 작동했습니다(환각 없음). 해당 매뉴얼 수집이 필요합니다.' },
]

const tone = (v: number) => (v >= 0.85 ? 'high' : v >= 0.7 ? 'mid' : 'low')
const METRICS = [
  { key: 'relevancy', label: '답변 적합성', color: '#1a4299' },
  { key: 'recall', label: '문맥 재현율', color: '#f39322' },
  { key: 'faithfulness', label: '사실적 일관성', color: '#8e9ab0' },
] as const

export default function RagEvalPage() {
  const [open, setOpen] = useState<Row | null>(null)
  const [threshold, setThreshold] = useState(0.75)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="page">
      <PageHeader
        title="RAG 성능 평가"
        desc="LLM 평가 모델 기반 다차원 정성 평가 · 평가셋 320문항 · 최근 실행 09-29 02:00"
        solves={['AI 답변 신뢰성 검증', '데이터 갱신 후 품질 저하']}
        actions={<button className="btn btn-primary"><Play size={15} />지금 평가 실행</button>}
      />

      <div className="callout callout-warn mb" role="alert">
        <BellRing size={16} />
        <span>9/22 실행에서 문맥 재현율이 0.72로 임계치 아래로 떨어졌습니다. 인센티브 지침 개정본을 9/23에 재수집한 뒤 회복되었습니다.</span>
      </div>

      <Anno n={1} className="grid cols-4 mb">
        <Stat label="답변 적합성" spark={[0.86, 0.87, 0.88, 0.89, 0.88, 0.9, 0.89, 0.91]} icon={Target} value="0.91" trend={{ dir: 'up', good: true, text: '직전 대비 0.02 상승' }} />
        <Stat label="문맥 재현율" spark={[0.81, 0.82, 0.8, 0.83, 0.72, 0.82, 0.84, 0.86]} icon={FileSearch} value="0.86" trend={{ dir: 'up', good: true, text: '직전 대비 0.05 상승' }} />
        <Stat label="사실적 일관성" spark={[0.92, 0.93, 0.92, 0.93, 0.93, 0.92, 0.93, 0.93]} icon={Scale} value="0.93" trend={{ dir: 'flat', good: true, text: '변동 없음' }} />
        <Stat label="환각 의심 응답" spark={[4.6, 4.1, 3.9, 3.6, 3.7, 3.2, 3.0, 2.8]} icon={ShieldAlert} value="2.8%" trend={{ dir: 'down', good: true, text: '직전 대비 0.9%p 감소' }} />
      </Anno>

      <div className="grid cols-3 mb">
        <Card className="span-2" title="평가 지표 추이" icon={TrendingUp}
          actions={<Legend items={METRICS.map((m) => ({ label: m.label, color: m.color, kind: 'line' as const }))} />}>
          <div className="chart" style={{ height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={TREND}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="run" {...axis} />
                <YAxis {...axis} width={40} domain={[0.6, 1]} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={threshold} stroke="#c8352f" strokeDasharray="4 4" />
                {METRICS.map((m) => <Line key={m.key} dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Anno n={2}>
        <Card title="평가 설정" icon={Settings2} bodyClass="card-body stack">
          <div className="field">
            <label htmlFor="cycle">평가 주기</label>
            <select id="cycle" className="select" defaultValue="a">
              <option value="a">데이터 갱신 시 + 매주 월요일</option>
              <option value="b">매일 02:00</option>
              <option value="c">데이터 갱신 시에만</option>
              <option value="d">수동</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="th">알림 임계치 {threshold.toFixed(2)}</label>
            <input id="th" type="range" min={0.5} max={0.95} step={0.05} value={threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ accentColor: 'var(--text)' }} />
          </div>
          <div className="field">
            <label htmlFor="judge">평가 모델</label>
            <select id="judge" className="select"><option>운영 LLM과 분리된 평가 전용 모델</option></select>
          </div>
          <div className="field">
            <label htmlFor="noti">알림 수신</label>
            <input id="noti" className="input" defaultValue="AI정보실 담당자 · 메일, 문자" />
          </div>
          <button className="btn btn-primary"><Save size={15} />설정 저장</button>
        </Card>
        </Anno>
      </div>

      <Anno n={3}>
      <Card title="문항별 평가 결과" icon={ListChecks} actions={<span className="muted">행을 선택하면 채점 근거가 열립니다</span>}>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">문항별 RAG 평가 점수</caption>
            <thead><tr><th>#</th><th>질문</th>{METRICS.map((m) => <th key={m.key} className="right">{m.label}</th>)}<th>판정</th><th /></tr></thead>
            <tbody>
              {ROWS.map((r) => {
                const min = Math.min(r.relevancy, r.recall, r.faithfulness)
                return (
                  <tr key={r.id} onClick={() => setOpen(r)} style={{ cursor: 'pointer' }}>
                    <td className="faint num">{r.id}</td>
                    <td className="wrap strong" style={{ minWidth: 240 }}>{r.q}</td>
                    {METRICS.map((m) => <td key={m.key} className="right"><span className={`conf ${tone(r[m.key])}`}>{r[m.key].toFixed(2)}</span></td>)}
                    <td>
                      {r.faithfulness < 0.6 ? <span className="badge badge-red"><TriangleAlert size={12} />환각 의심</span>
                        : min < threshold ? <span className="badge badge-amber"><span className="dot" />개선 필요</span>
                        : <span className="badge badge-green"><CircleCheck size={12} />양호</span>}
                    </td>
                    <td className="right"><button className="btn btn-ghost btn-icon btn-sm" aria-label={`${r.q} 채점 근거 보기`} onClick={(e) => { e.stopPropagation(); setOpen(r) }}><ChevronRight size={16} /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </Anno>

      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(null)} />
          <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <div className="card-header">
              <h2 id="sheet-title" className="card-title"><Gavel size={16} />채점 상세 #{open.id}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(null)} aria-label="닫기" autoFocus><X size={16} /></button>
            </div>
            <div className="sheet-body">
              <div className="quote"><span className="quote-label">질문</span>{open.q}</div>
              <div className="quote"><span className="quote-label">AI 답변</span>{open.answer}</div>
              <div className="quote"><span className="quote-label">검색된 컨텍스트</span>{open.context}</div>
              <div className="stack">
                {METRICS.map((m) => {
                  const v = open[m.key]
                  return (
                    <div key={m.key} className="meter-row">
                      <span>{m.label}</span>
                      <div className="progress"><span style={{ width: `${v * 100}%`, background: v >= 0.85 ? 'var(--green)' : v >= 0.7 ? 'var(--amber)' : 'var(--red)' }} /></div>
                      <b>{v.toFixed(2)}</b>
                    </div>
                  )
                })}
              </div>
              <div className="callout callout-info"><Gavel size={16} /><span>{open.reason}</span></div>
              <div className="row">
                <button className="btn"><BookCheck size={15} />정답셋에 추가</button>
                <button className="btn"><WandSparkles size={15} />프롬프트 개선 요청</button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
