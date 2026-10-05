import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, BrainCircuit, CircleCheck, CircleMinus, CircleX, RefreshCw, ShieldCheck, Trophy } from 'lucide-react'
import { axis, Card, ChartTip, grid, Legend, PageHeader } from '../../components/ui'
import { Anno } from '../../proposal'

// 성능 수치는 PoC 계획상의 예시 값
const LLMS = [
  { name: '후보 A', desc: '국내 공공 특화 LLM · 전용 인스턴스', sim: 0.89, latency: 2.1, halluc: 2.8, ctx: 0.91, ko: 0.93, en: 0.86, len: '128K', pick: true },
  { name: '후보 B', desc: '글로벌 상용 LLM · API', sim: 0.87, latency: 3.4, halluc: 3.5, ctx: 0.92, ko: 0.88, en: 0.93, len: '200K' },
  { name: '후보 C', desc: '오픈소스 LLM · 자체 호스팅', sim: 0.81, latency: 4.6, halluc: 6.1, ctx: 0.84, ko: 0.82, en: 0.80, len: '32K' },
]
type Key = 'sim' | 'latency' | 'halluc' | 'ctx' | 'ko' | 'en'
const COLS: { key: Key; label: string; lowerBetter?: boolean; fmt: (v: number) => string }[] = [
  { key: 'sim', label: '정답 유사도', fmt: (v) => v.toFixed(2) },
  { key: 'latency', label: '응답 속도', lowerBetter: true, fmt: (v) => `${v.toFixed(1)}초` },
  { key: 'halluc', label: '환각 발생률', lowerBetter: true, fmt: (v) => `${v.toFixed(1)}%` },
  { key: 'ctx', label: '문맥 이해도', fmt: (v) => v.toFixed(2) },
  { key: 'ko', label: '한국어', fmt: (v) => v.toFixed(2) },
  { key: 'en', label: '영어', fmt: (v) => v.toFixed(2) },
]
const best = (k: Key, lower?: boolean) => (lower ? Math.min : Math.max)(...LLMS.map((m) => m[k]))

const SECURITY: { item: string; v: ('ok' | 'partial' | 'no')[] }[] = [
  { item: '입력 데이터 학습 미활용 보장', v: ['ok', 'ok', 'ok'] },
  { item: '국내 리전 처리 · 국외 이전 없음', v: ['ok', 'partial', 'ok'] },
  { item: '전용 인스턴스 · 망 분리 구성', v: ['ok', 'no', 'ok'] },
  { item: '접근 로그 보관 · 접근 통제', v: ['ok', 'ok', 'partial'] },
  { item: '개인정보 비식별화 모듈 연동', v: ['ok', 'ok', 'ok'] },
]
const MARK = {
  ok: <span className="row trend-good" style={{ gap: 4 }}><CircleCheck size={15} />충족</span>,
  partial: <span className="row" style={{ gap: 4, color: 'var(--amber)' }}><CircleMinus size={15} />조건부</span>,
  no: <span className="row trend-bad" style={{ gap: 4 }}><CircleX size={15} />미충족</span>,
}

const MAE = Array.from({ length: 12 }, (_, i) => ({ w: `${i + 1}주`, mae: +(0.82 - i * 0.012 + (i === 8 ? 0.21 : i === 9 ? 0.09 : 0)).toFixed(2) }))
const DRIFT = [
  { f: 'ETA 신고 편차', psi: 0.27 },
  { f: '입항 선박 크기 분포', psi: 0.08 },
  { f: '선석 점유율', psi: 0.12 },
  { f: '기상(풍속·파고)', psi: 0.05 },
]

export default function ModelsPage() {
  return (
    <div className="page">
      <PageHeader
        title="AI 모델 관리"
        desc="생성형 AI(LLM) 선정 근거와 운영 중인 시계열 예측 모델의 성능·데이터 변화를 관리합니다"
        solves={['AI 답변 신뢰성', '공공기관 AI 보안', '운영 중 모델 성능 저하']}
        actions={<button className="btn"><RefreshCw size={15} />성능 테스트 재실행</button>}
      />

      <Anno n={1} className="mb">
        <Card title="LLM 후보 성능 비교" icon={BrainCircuit} sub="동일한 울산항 평가셋 320문항으로 측정 · 최종 선정은 공사와 협의"
          actions={<span className="badge badge-blue"><Trophy size={13} />후보 A 선정</span>}>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">LLM 후보별 성능 테스트 결과</caption>
              <thead><tr><th>후보</th><th>구성</th>{COLS.map((c) => <th key={c.key} className="right">{c.label}</th>)}<th className="right">컨텍스트</th></tr></thead>
              <tbody>
                {LLMS.map((m) => (
                  <tr key={m.name} className={m.pick ? 'row-pick' : ''}>
                    <td className="strong">{m.name}{m.pick && <span className="badge badge-blue" style={{ marginLeft: 8 }}>선정</span>}</td>
                    <td className="muted">{m.desc}</td>
                    {COLS.map((c) => (
                      <td key={c.key} className={`right num${m[c.key] === best(c.key, c.lowerBetter) ? ' best' : ''}`}>{c.fmt(m[c.key])}</td>
                    ))}
                    <td className="right num">{m.len}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-body pick-note">
            <CircleCheck size={16} />
            <span>선정 근거 · 한국어 정답 유사도와 환각 발생률이 가장 우수하고 응답 속도가 5초 기준(PER-001)을 여유 있게 충족합니다. 영어는 후보 B가 높아 다국어 품질은 프롬프트로 보완합니다.</span>
          </div>
        </Card>
      </Anno>

      <div className="grid cols-2">
        <Anno n={2}>
          <Card title="공공 AI 보안 적합성" icon={ShieldCheck} sub="국가·공공기관 AI 보안 가이드라인 기준">
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">후보별 보안 항목 충족 여부</caption>
                <thead><tr><th>점검 항목</th>{LLMS.map((m) => <th key={m.name}>{m.name}</th>)}</tr></thead>
                <tbody>
                  {SECURITY.map((r) => (
                    <tr key={r.item}>
                      <td className="wrap">{r.item}</td>
                      {r.v.map((v, i) => <td key={i}>{MARK[v]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Anno>

        <Anno n={3}>
          <Card title="예측 모델 성능 · 데이터 변화" icon={Activity} sub="운영 모델 TFT · 주간 MAE와 입력 데이터 분포 변화(PSI)"
            actions={<Legend items={[{ label: 'MAE', color: '#1a4299', kind: 'line' }, { label: '재학습 기준', color: '#c8352f', kind: 'dash' }]} />}>
            <div className="chart" style={{ height: 190 }}>
              <ResponsiveContainer>
                <LineChart data={MAE}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="w" {...axis} />
                  <YAxis {...axis} width={36} domain={[0.5, 1.1]} />
                  <Tooltip content={<ChartTip unit="h" />} />
                  <ReferenceLine y={0.95} stroke="#c8352f" strokeDasharray="4 4" />
                  <Line dataKey="mae" name="MAE" stroke="#1a4299" strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card-body stack" style={{ borderTop: '1px solid var(--border)' }}>
              {DRIFT.map((d) => (
                <div key={d.f} className="meter-row" style={{ gridTemplateColumns: '130px 1fr 44px 64px' }}>
                  <span>{d.f}</span>
                  <div className="progress"><span style={{ width: `${Math.min(100, d.psi * 300)}%`, background: d.psi >= 0.25 ? 'var(--red)' : d.psi >= 0.1 ? 'var(--amber)' : 'var(--green)' }} /></div>
                  <b>{d.psi.toFixed(2)}</b>
                  <span className={d.psi >= 0.25 ? 'trend-bad' : d.psi >= 0.1 ? '' : 'trend-good'} style={{ textAlign: 'right' }}>{d.psi >= 0.25 ? '변화 큼' : d.psi >= 0.1 ? '주의' : '안정'}</span>
                </div>
              ))}
              <div className="callout callout-warn">
                <Activity size={16} />
                <span>9주차 ETA 신고 편차 분포가 바뀌며 오차가 기준을 넘었습니다. 최근 8주 데이터로 재학습해 10주차에 회복했습니다.</span>
              </div>
            </div>
          </Card>
        </Anno>
      </div>
    </div>
  )
}
