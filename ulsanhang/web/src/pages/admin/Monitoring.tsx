import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Cloud, Download, EyeOff, Hash, KeyRound, LockKeyhole, MessagesSquare, ScanSearch, Server, ShieldCheck, ThumbsUp, Timer, TrendingUp, Users, Zap } from 'lucide-react'
import { axis, Card, ChartTip, grid, Legend, PageHeader, Segmented, Stat } from '../../components/ui'
import { Anno } from '../../proposal'

const DAILY = Array.from({ length: 30 }, (_, i) => {
  const weekend = i % 7 === 5 || i % 7 === 6
  return {
    d: `9/${i + 1}`,
    users: Math.round(320 + Math.sin(i / 3) * 80 + i * 6 + (weekend ? -140 : 0)),
    queries: Math.round(1100 + Math.sin(i / 3) * 260 + i * 18 + (weekend ? -480 : 0)),
  }
})
const HOURLY = Array.from({ length: 24 }, (_, h) => ({ h: `${h}시`, q: Math.round(h < 7 ? 8 + h * 3 : h < 19 ? 90 + Math.sin((h - 7) / 3.8) * 70 : 60 - (h - 19) * 9) }))
const LATENCY = Array.from({ length: 24 }, (_, h) => ({ h: `${h}시`, p50: +(1.6 + Math.sin(h / 4) * 0.3).toFixed(2), p95: +(3.4 + Math.sin(h / 4) * 0.7 + (h === 10 ? 1.1 : 0)).toFixed(2) }))
const KEYWORDS: [string, number][] = [
  ['입항료', 412], ['선석배정', 356], ['정박료', 288], ['ETA', 251], ['채용', 214], ['인센티브', 198], ['입항신고', 176], ['위험물', 142],
]
const INTENTS = [
  { name: '사용료·요금', v: 31 }, { name: '선박·선석', v: 27 }, { name: '입출항 절차', v: 16 }, { name: '채용', v: 11 }, { name: '공사 일반', v: 9 }, { name: '기타', v: 6 },
]
const RESOURCES = [
  { name: 'web-01', role: 'WEB', cpu: 34, mem: 52 }, { name: 'web-02', role: 'WEB', cpu: 31, mem: 49 },
  { name: 'rag-api-01', role: 'WAS', cpu: 68, mem: 71 }, { name: 'rag-api-02', role: 'WAS', cpu: 81, mem: 77 },
  { name: 'vector-db', role: 'DB', cpu: 42, mem: 83 }, { name: 'gpu-infer-01', role: 'GPU', cpu: 57, mem: 64 },
  { name: 'ml-forecast', role: 'ML', cpu: 22, mem: 38 }, { name: 'tibero-01', role: 'DB', cpu: 29, mem: 61 },
]

const SECURITY = [
  { icon: EyeOff, title: '개인정보 자동 비식별화', value: '이번 달 312건', desc: '성명·연락처·주민번호를 감지해 외부 LLM 전송 전에 마스킹' },
  { icon: LockKeyhole, title: '전송구간 암호화', value: 'IPsec VPN · TLS 1.3', desc: '질의응답 전 과정 암호화로 유출·위변조 차단' },
  { icon: Server, title: 'CSAP 인증 클라우드', value: '공공 영역 분리 운영', desc: 'KISA CSAP 인증 공공 클라우드, 민간 영역과 물리적 분리' },
  { icon: KeyRound, title: 'AI 보안 가이드라인', value: '점검 18 / 18 항목', desc: '국가·공공기관 AI 보안 가이드라인 기준 자체 점검' },
]

const usage = (v: number) => (
  <div className="meter">
    <div className="progress"><span style={{ width: `${v}%`, background: v >= 80 ? 'var(--red)' : v >= 70 ? 'var(--amber)' : 'var(--accent)' }} /></div>
    <span className="num" style={{ textAlign: 'right' }}>{v}%</span>
  </div>
)

const RANGES = ['오늘', '7일', '30일'] as const

export default function MonitoringPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('30일')
  return (
    <div className="page">
      <PageHeader
        title="서비스 모니터링"
        desc="이용 현황, 핵심 키워드, 응답 성능과 클라우드 리소스 상태"
        solves={['서비스 활용도 점검', '응답 성능·운영 비용 관리', '정보 유출 우려']}
        actions={<><Segmented label="조회 기간" value={range} options={RANGES} onChange={setRange} /><button className="btn"><Download size={15} />보고서</button></>}
      />

      <Anno n={1} className="grid cols-4 mb">
        <Stat label="누적 이용자" spark={[6, 7, 7.6, 8.4, 9.1, 10.2, 11.3, 12.5]} icon={Users} value="12,480명" trend={{ dir: 'up', good: true, text: '전월 대비 18% 증가' }} />
        <Stat label="총 질의 수" spark={[22, 24, 27, 29, 32, 35, 38, 41]} icon={MessagesSquare} value="41,236건" foot="세션당 평균 3.3턴" />
        <Stat label="답변 만족도" spark={[83.1, 84.0, 84.6, 85.2, 85.0, 86.1, 86.9, 87.4]} icon={ThumbsUp} value="87.4%" trend={{ dir: 'up', good: true, text: '전월 대비 2.1%p 상승' }} />
        <Anno n={4}><Stat label="시맨틱 캐시 적중률" spark={[21, 25, 28, 30, 33, 35, 37, 38]} icon={Zap} value="38.2%" foot="LLM 호출 15,752건 절감" /></Anno>
      </Anno>

      <div className="grid cols-3 mb">
        <Card className="span-2" title="일별 이용 추이" icon={TrendingUp}
          actions={<Legend items={[{ label: '질의 수', color: '#1a4299', kind: 'line' }, { label: '이용자', color: '#8e9ab0', kind: 'line' }]} />}>
          <div className="chart" style={{ height: 268 }}>
            <ResponsiveContainer>
              <AreaChart data={DAILY}>
                <defs>
                  <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a4299" stopOpacity={0.16} /><stop offset="1" stopColor="#1a4299" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8e9ab0" stopOpacity={0.16} /><stop offset="1" stopColor="#8e9ab0" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="d" {...axis} interval={4} />
                <YAxis {...axis} width={44} />
                <Tooltip content={<ChartTip />} />
                <Area dataKey="queries" name="질의 수" stroke="#1a4299" fill="url(#gq)" strokeWidth={2} isAnimationActive={false} />
                <Area dataKey="users" name="이용자" stroke="#8e9ab0" fill="url(#gu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Anno n={2}>
        <Card title="핵심 키워드" icon={Hash} actions={<span className="muted">최근 {range}</span>}>
          <ol style={{ padding: '8px 0' }}>
            {KEYWORDS.map(([k, n], i) => (
              <li key={k} className="keyword">
                <span className="faint num">{i + 1}</span>
                <span>{k}</span>
                <div className="progress"><span style={{ width: `${(n / 412) * 100}%` }} /></div>
                <span className="n">{n}</span>
              </li>
            ))}
          </ol>
        </Card>
        </Anno>
      </div>

      <div className="grid cols-3 mb">
        <Card title="시간대별 질의" icon={Clock} actions={<span className="muted">오늘</span>}>
          <div className="chart" style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={HOURLY}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="h" {...axis} interval={5} />
                <YAxis {...axis} width={32} />
                <Tooltip content={<ChartTip unit="건" />} cursor={{ fill: '#f1f4f9' }} />
                <Bar dataKey="q" name="질의" fill="#3a63bf" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Anno n={3}>
        <Card title="응답 시간" icon={Timer} actions={<Legend items={[{ label: 'P50', color: '#1a4299', kind: 'line' }, { label: 'P95', color: '#f39322', kind: 'line' }]} />}>
          <div className="chart" style={{ height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={LATENCY}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="h" {...axis} interval={5} />
                <YAxis {...axis} width={32} domain={[0, 6]} />
                <Tooltip content={<ChartTip unit="초" />} />
                <ReferenceLine y={5} stroke="#c8352f" strokeDasharray="4 4" />
                <Line dataKey="p50" name="P50" stroke="#1a4299" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line dataKey="p95" name="P95" stroke="#f39322" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        </Anno>
        <Card title="질의 의도 분포" icon={ScanSearch}>
          <div className="card-body stack">
            {INTENTS.map((it) => (
              <div key={it.name} className="meter-row">
                <span>{it.name}</span>
                <div className="progress"><span style={{ width: `${(it.v / 31) * 100}%` }} /></div>
                <b>{it.v}%</b>
              </div>
            ))}
            <p className="text-sm muted" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>답변 불가 후 통합검색으로 안내한 비율 4.7%</p>
          </div>
        </Card>
      </div>

      <Anno n={5} className="mb">
      <Card title="클라우드 리소스" icon={Cloud} sub="CSAP 인증 공공 클라우드 · 오토스케일링 활성 · 1분 주기 수집"
        actions={<span className="badge badge-amber"><span className="dot" />주의 2</span>}>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">서버별 리소스 사용률</caption>
            <thead><tr><th>인스턴스</th><th>역할</th><th style={{ width: '28%' }}>CPU</th><th style={{ width: '28%' }}>메모리</th><th>상태</th></tr></thead>
            <tbody>
              {RESOURCES.map((r) => {
                const warn = r.cpu >= 80 || r.mem >= 80
                return (
                  <tr key={r.name}>
                    <td className="strong">{r.name}</td>
                    <td><span className="badge badge-gray">{r.role}</span></td>
                    <td>{usage(r.cpu)}</td>
                    <td>{usage(r.mem)}</td>
                    <td>{warn ? <span className="badge badge-amber"><span className="dot" />주의</span> : <span className="badge badge-green"><span className="dot" />정상</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </Anno>

      <Anno n={6}>
        <Card title="보안 · 개인정보 보호" icon={ShieldCheck} sub="외부 LLM 사용에 따른 정보 유출 방지와 공공 클라우드 보안 기준 점검"
          actions={<span className="badge badge-green"><span className="dot" />전 항목 충족</span>}>
          <div className="sec-grid">
            {SECURITY.map((x) => (
              <div key={x.title} className="sec-item">
                <span className="icon-tile tile-brand"><x.icon size={16} /></span>
                <b>{x.title}</b>
                <span className="sec-value">{x.value}</span>
                <p>{x.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </Anno>
    </div>
  )
}
