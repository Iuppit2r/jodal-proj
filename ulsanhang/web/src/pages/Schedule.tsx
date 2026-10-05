import { useMemo, useState } from 'react'
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Anchor, ArrowUpRight, BellRing, CalendarClock, Clock, ExternalLink, Info, LineChart, Navigation, RadioTower, RefreshCw,
  Search, Ship, Target, TrendingUp, TriangleAlert, Waves, X, type LucideIcon,
} from 'lucide-react'
import { axis, Card, ChartTip, grid, Legend, PageHeader, Stat } from '../components/ui'
import { Anno } from '../proposal'
import { ANOMALIES, BERTHS, CONGESTION_FORECAST, MODEL_METRICS, NOW_HOUR, PORTS, WAIT_HISTORY, type Port, type Vessel } from '../mock/schedule'

const HOURS = Array.from({ length: 12 }, (_, i) => i * 2)
const KIND = {
  actual: { label: '확정', badge: 'badge-blue' },
  pred: { label: '예측', badge: 'badge-sky' },
  delay: { label: '지연 예측', badge: 'badge-amber' },
} as const
const ANOMALY_STYLE: Record<string, { icon: LucideIcon; tile: string }> = {
  danger: { icon: RadioTower, tile: 'tile-red' },
  warn: { icon: TriangleAlert, tile: 'tile-orange' },
  info: { icon: RefreshCw, tile: 'tile-blue' },
}

export default function SchedulePage() {
  const [port, setPort] = useState<Port>('울산본항')
  const [selected, setSelected] = useState<Vessel | null>(null)
  const [query, setQuery] = useState('')
  const berths = BERTHS[port]

  const stats = useMemo(() => {
    const vs = berths.flatMap((b) => b.vessels)
    const waiting = vs.filter((x) => x.kind !== 'actual').length
    const busy = berths.filter((b) => b.vessels.some((x) => x.start <= NOW_HOUR && x.end > NOW_HOUR)).length
    return { waiting, free: berths.length - busy, availability: Math.round(((berths.length - busy) / berths.length) * 100) }
  }, [berths])

  const idx = Math.min(100, 38 + stats.waiting * 12)
  const level = idx >= 70 ? { label: '혼잡', badge: 'badge-red', color: '#c8352f' } : idx >= 50 ? { label: '보통', badge: 'badge-amber', color: '#b86a0f' } : { label: '원활', badge: 'badge-green', color: '#12805c' }
  const matches = (x: Vessel) => !query || x.name.toLowerCase().includes(query.toLowerCase())

  return (
    <div className="page">
      <PageHeader
        title="항만 스케줄 예측"
        desc="시계열 예측 모델 기반 선석별 입항·접안·출항 예측과 항만 혼잡도"
        solves={['전화 등 아날로그 문의', '선석·혼잡 정보 사전 파악 어려움']}
        actions={
          <>
            <Anno n={1} inline><span className="row muted"><RefreshCw size={14} />실시간 연동 · 09-30 14:00 기준 · 10분 주기</span></Anno>
            <label className="sr-only" htmlFor="port">항구</label>
            <div className="input-icon" style={{ width: 150 }}>
              <Anchor size={15} />
              <select id="port" className="select input" value={port} onChange={(e) => { setPort(e.target.value as Port); setSelected(null) }}>
                {PORTS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-icon" style={{ width: 200 }}>
              <Search size={15} />
              <label className="sr-only" htmlFor="vsearch">선박명 검색</label>
              <input id="vsearch" className="input" placeholder="선박명 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </>
        }
      />

      <Anno n={2} className="grid cols-4 mb">
        <Stat label="대기 선박" spark={[2, 3, 2, 3, 4, 3, 3, 4]} icon={Ship} value={`${stats.waiting}척`} trend={{ dir: 'up', good: false, text: '전일 대비 1척 증가' }} />
        <Stat label="예측 평균 대기시간" spark={[4.8, 5.1, 5.0, 5.6, 5.4, 6.0, 6.2, 6.4]} icon={Clock} value="6.4시간" trend={{ dir: 'up', good: false, text: '전주 대비 1.2시간 증가' }} />
        <Stat label="현재 선석 가용률" spark={[62, 58, 55, 60, 52, 54, 48, 50]} icon={Anchor} value={`${stats.availability}%`} foot={`${berths.length}개 선석 중 ${stats.free}개 가용`} />
        <Stat label="예측 오차 (MAE)" spark={[0.92, 0.88, 0.85, 0.83, 0.8, 0.78, 0.76, 0.74]} icon={Target} value="0.74시간" trend={{ dir: 'down', good: true, text: '지난 7일 대비 0.06 개선' }} />
      </Anno>

      <Anno n={3}>
      <Card
        className="mb"
        title="선석별 스케줄 타임라인"
        icon={CalendarClock}
        sub={`${port} · 2026-09-30 · 막대를 선택하면 선박 상세가 열립니다`}
        actions={<Legend items={[{ label: '확정', color: '#1a4299' }, { label: '예측', color: '#8e9ab0' }, { label: '지연 예측', color: '#f39322' }]} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) 300px' : '1fr' }}>
          <div className="table-wrap">
            <div className="timeline" role="table" aria-label={`${port} 선석별 스케줄`}>
              <div className="tl-row tl-head" role="row">
                <div className="tl-label" role="columnheader">선석</div>
                <div className="tl-scale" role="columnheader">
                  {HOURS.map((h) => (Math.abs(h - NOW_HOUR) >= 2 ? <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{String(h).padStart(2, '0')}:00</span> : null))}
                  <span className="now" style={{ left: `${(NOW_HOUR / 24) * 100}%` }}>{NOW_HOUR}:00</span>
                </div>
              </div>
              {berths.map((b) => (
                <div className="tl-row" role="row" key={b.id}>
                  <div className="tl-label" role="rowheader"><b>{b.name}</b><span>{b.cargo}</span></div>
                  <div className="tl-track" role="cell">
                    <div className="tl-now" style={{ left: `${(NOW_HOUR / 24) * 100}%` }} aria-hidden />
                    {b.vessels.map((x) => (
                      <button
                        key={x.id}
                        className={`tl-bar ${x.kind}${selected?.id === x.id ? ' selected' : ''}${matches(x) ? '' : ' dim'}`}
                        style={{ left: `calc(${(x.start / 24) * 100}% + 2px)`, width: `calc(${((x.end - x.start) / 24) * 100}% - 4px)` }}
                        onClick={() => setSelected(x)}
                        aria-label={`${x.name}, ${KIND[x.kind].label}, 접안 ${x.predEta}, 출항 ${x.predEtd}`}
                      >
                        <Ship size={13} />{x.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {selected && (
            <aside style={{ borderLeft: '1px solid var(--border)' }} aria-label="선박 상세"><Anno n={4} place="in" className="card-body stack">
              <div className="row between">
                <h3 className="card-title"><Ship size={16} />{selected.name}</h3>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)} aria-label="상세 닫기"><X size={16} /></button>
              </div>
              <div className="text-sm"><span className={`badge ${KIND[selected.kind].badge}`}><span className="dot" />{KIND[selected.kind].label}</span></div>
              <dl className="detail-list">
                <dt>호출부호</dt><dd>{selected.callSign}</dd>
                <dt>선종</dt><dd>{selected.type}</dd>
                <dt>총톤수</dt><dd>{selected.gt.toLocaleString()} GT</dd>
                <dt>전장</dt><dd>{selected.loa} m</dd>
                <dt>국적</dt><dd>{selected.flag}</dd>
                <dt>계획 ETA</dt><dd>{selected.planEta}</dd>
                <dt>예측 접안</dt><dd>{selected.predEta}</dd>
                <dt>예측 출항</dt><dd>{selected.predEtd}</dd>
              </dl>
              {selected.kind !== 'actual' && (
                <div className="stack-sm">
                  <div className="row between text-sm"><span className="muted">예측 신뢰도</span><b>{Math.round(selected.confidence * 100)}%</b></div>
                  <div className="progress"><span style={{ width: `${selected.confidence * 100}%` }} /></div>
                </div>
              )}
              <button className="btn"><ExternalLink size={15} />PortWise 운항정보</button>
            </Anno></aside>
          )}
        </div>
      </Card>
      </Anno>

      <div className="grid cols-3 mb">
        <Anno n={5} className="span-2">
        <Card title="혼잡도 예측" icon={TrendingUp} sub="향후 72시간 정박지 대기 선박 수 · 음영은 80% 예측 구간"
          actions={<Legend items={[{ label: '예측', color: '#1a4299', kind: 'line' }, { label: '예측 구간', color: '#dfe7f6' }]} />}>
          <div className="chart" style={{ height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={CONGESTION_FORECAST}>
                <defs>
                  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfe7f6" stopOpacity={0.8} /><stop offset="1" stopColor="#f2f5fc" stopOpacity={0.5} /></linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="t" {...axis} interval={3} />
                <YAxis {...axis} width={36} />
                <Tooltip content={<ChartTip unit="척" />} />
                <Area dataKey="band" name="예측 구간" stroke="none" fill="url(#band)" isAnimationActive={false} />
                <Line dataKey="pred" name="예측" stroke="#1a4299" strokeWidth={2.25} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        </Anno>
        <Card title="항만 혼잡도 지수" icon={Waves} actions={<span className={`badge ${level.badge}`}><span className="dot" />{level.label}</span>}>
          <div className="card-body stack" style={{ gap: 18 }}>
            <div className="row" style={{ gap: 18 }}>
              <div className="gauge" style={{ background: `conic-gradient(${level.color} ${idx * 3.6}deg, var(--surface-3) 0)` }} role="img" aria-label={`혼잡도 지수 ${idx}점, ${level.label}`}>
                <div className="gauge-inner">{idx}</div>
              </div>
              <p className="text-sm muted">대기 선박, 평균 대기시간, 선석 점유율을 가중 합산한 0~100 지표입니다.</p>
            </div>
            <ul className="bullet-list">
              <li><ArrowUpRight size={14} className="trend-bad" />내일 06~18시 대기 선박 2척 증가 예상</li>
              <li><Info size={14} />온산항 액체화물 선석 점유율 92%</li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid cols-3">
        <Anno n={6} className="span-2">
        <Card title="예측값과 실제값" icon={LineChart} sub="최근 14일 평균 대기시간과 절대 오차"
          actions={<Legend items={[{ label: '실제', color: '#1a4299', kind: 'line' }, { label: '예측', color: '#f39322', kind: 'dash' }, { label: '오차', color: '#d7dce4' }]} />}>
          <div className="chart" style={{ height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart data={WAIT_HISTORY}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} width={36} />
                <Tooltip content={<ChartTip unit="h" />} />
                <Bar dataKey="error" name="오차" fill="#e1e5ec" barSize={12} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Line dataKey="actual" name="실제" stroke="#1a4299" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="pred" name="예측" stroke="#f39322" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <Anno n={7} place="in">
          <div className="table-wrap" style={{ borderTop: '1px solid var(--border)' }}>
            <table className="table">
              <caption className="sr-only">시계열 모델 성능 비교</caption>
              <thead><tr><th>모델</th><th className="right">MAE (h)</th><th className="right">RMSE (h)</th><th className="right">MAPE (%)</th><th>상태</th></tr></thead>
              <tbody>
                {MODEL_METRICS.map((m) => (
                  <tr key={m.name}>
                    <td className="strong">{m.name.replace(' (운영)', '')}</td>
                    <td className="right num">{m.mae}</td><td className="right num">{m.rmse}</td><td className="right num">{m.mape}</td>
                    <td>{m.active ? <span className="badge badge-green"><span className="dot" />운영 중</span> : <span className="badge badge-gray">비교 모델</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Anno>
        </Card>
        </Anno>
        <Anno n={8}>
        <Card title="이상탐지 알림" icon={BellRing} actions={<span className="badge badge-red">긴급 {ANOMALIES.filter((a) => a.level === 'danger').length}</span>}>
          <ul aria-live="polite">
            {ANOMALIES.map((a) => {
              const s = ANOMALY_STYLE[a.level]
              return (
                <li key={a.title + a.time} className="feed-item">
                  <span className={`icon-tile ${s.tile}`}><s.icon size={16} /></span>
                  <div className="feed-text">
                    <div className="feed-title">{a.title}<time>{a.time}</time></div>
                    <p>{a.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <div style={{ padding: '0 18px 16px' }}>
            <button className="btn btn-sm" style={{ width: '100%' }}><Navigation size={14} />전체 이력 보기</button>
          </div>
        </Card>
        </Anno>
      </div>
    </div>
  )
}
