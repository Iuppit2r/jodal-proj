import { useState } from 'react'
import { useApp } from '../context'
import { PageHead, Tabs } from '../components/ui'
import { LineChart, PALETTE } from '../components/charts'

type Tab = 'search' | 'perf' | 'data'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('search')
  return (
    <>
      <PageHead title="운영관리" desc="RAG 검색 제어, 성능 모니터링, 데이터 구축 파이프라인을 관리합니다." reqs={['SFR-01', 'PER-02', 'PER-04', 'INR-05', 'INR-06', 'DAR-13']} />
      <div className="card" style={{ marginBottom: 16 }}>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'search', label: '검색·AI 제어' }, { id: 'perf', label: '성능 모니터링' }, { id: 'data', label: '데이터 파이프라인' }]} />
      </div>
      {tab === 'search' && <SearchControl />}
      {tab === 'perf' && <Perf />}
      {tab === 'data' && <DataPipe />}
    </>
  )
}

function SearchControl() {
  const { toast } = useApp()
  const [alpha, setAlpha] = useState(40)
  const [rerank, setRerank] = useState(true)
  const [topK, setTopK] = useState(50)
  const [ctxN, setCtxN] = useState(6)
  const [model, setModel] = useState('local-32b')
  const [ext, setExt] = useState({ genai: false, pubmed: true, wos: true })
  const [dirty, setDirty] = useState(false)
  const d = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true) }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}>
      <section className="card">
        <div className="card-head"><h3>하이브리드 검색 가중치</h3><span className="spacer" /><span className="badge badge-blue">실시간 반영</span></div>
        <div className="card-pad stack">
          <div>
            <div className="row small" style={{ fontWeight: 700 }}>
              <span>키워드 (마리너4 BM25) <span style={{ color: 'var(--c-primary)' }}>{alpha}%</span></span>
              <span className="spacer" />
              <span>벡터 (Dense) <span style={{ color: 'var(--c-accent)' }}>{100 - alpha}%</span></span>
            </div>
            <input type="range" className="range" min={0} max={100} step={5} value={alpha} onChange={e => d(setAlpha)(+e.target.value)} aria-label="키워드 가중치" />
            <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', marginTop: 4 }} aria-hidden>
              <span style={{ width: `${alpha}%`, background: 'var(--c-primary)' }} /><span style={{ flex: 1, background: 'var(--c-accent)' }} />
            </div>
            <div className="xs muted" style={{ marginTop: 6 }}>최종 점수 = α·키워드 + (1−α)·벡터 → Re-ranker 재정렬 (RRF 결합 옵션 지원)</div>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {[['키워드 중심', 70], ['균형', 50], ['의미 중심 (기본)', 40], ['벡터 전용', 0]].map(([l, v]) => (
              <button key={l} className="chip" aria-pressed={alpha === v} onClick={() => d(setAlpha)(v as number)}>{l}</button>
            ))}
          </div>
          <div className="divider" style={{ margin: 0 }} />
          <label className="row small" style={{ justifyContent: 'space-between' }}>
            <span><b>Re-ranker 사용</b><div className="xs muted">의과학 도메인 Cross-encoder</div></span>
            <input type="checkbox" checked={rerank} onChange={e => d(setRerank)(e.target.checked)} />
          </label>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">1차 후보 수 (Top-K)<input className="input" type="number" value={topK} onChange={e => d(setTopK)(+e.target.value)} /></label>
            <label className="field">LLM 컨텍스트 문서 수<input className="input" type="number" value={ctxN} onChange={e => d(setCtxN)(+e.target.value)} /></label>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>생성형 AI 모델 · 외부 연계</h3></div>
        <div className="card-pad stack">
          <label className="field">답변 생성 모델 (vLLM 서빙)
            <select className="select" value={model} onChange={e => d(setModel)(e.target.value)}>
              <option value="local-32b">로컬 LLM 32B (AWQ 4bit) · GPU 32GB</option>
              <option value="local-14b">로컬 LLM 14B · 저지연 모드</option>
            </select>
          </label>
          <label className="field">임베딩 모델 (TEI 서빙)
            <select className="select" defaultValue="ko-med"><option value="ko-med">의과학 특화 한국어 임베딩 (1024d)</option></select>
          </label>
          <div className="divider" style={{ margin: 0 }} />
          {([['genai', '외부 생성형 AI API 연계', '비식별·공개자료 질의에 한해 허용 (내부 자료 외부 전송 차단)'], ['pubmed', 'PubMed E-utilities 참조', '외부 학술 근거로 표시'], ['wos', 'Web of Science API 참조', '기관 구독 키 사용']] as const).map(([k, l, s]) => (
            <label key={k} className="row small" style={{ justifyContent: 'space-between' }}>
              <span><b>{l}</b><div className="xs muted">{s}</div></span>
              <input type="checkbox" checked={ext[k]} onChange={e => d(setExt)({ ...ext, [k]: e.target.checked })} />
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>마리너4 연동 상태</h3><span className="spacer" /><span className="badge badge-ok">● 정상</span></div>
        <table className="table"><tbody>
          {[['검색 API', '정상', '42ms'], ['색인 DB 동기화', '정상', '5분 전'], ['동의어 사전', '12,480건', '2026-10-01'], ['전문용어 사전', '38,912건', '2026-10-01'], ['벡터DB 컬렉션', '4개', 'ncmik_roms · koms · save · mesh']].map(([k, v, s]) => (
            <tr key={k}><td>{k}</td><td><b>{v}</b></td><td className="xs muted">{s}</td></tr>
          ))}
        </tbody></table>
      </section>

      <section className="card">
        <div className="card-head"><h3>검색어 자동완성 사전</h3></div>
        <div className="card-pad stack">
          <div className="small">인기 질의 · MeSH 국문/영문 용어 · 마리너4 동의어 기반으로 자동완성 후보를 생성합니다.</div>
          <div className="row wrap" style={{ gap: 6 }}>
            {['엠폭스', '코로나19 대응지침', '결핵 잠복감염', '항생제 내성', '2형 당뇨병', 'Mpox'].map(t => <span key={t} className="badge">{t} ✕</span>)}
          </div>
          <div className="row"><input className="input" placeholder="금칙어/추천어 추가" /><button className="btn">추가</button></div>
        </div>
      </section>

      <div className="card card-pad row" style={{ gridColumn: '1 / -1', position: 'sticky', bottom: 12, boxShadow: 'var(--shadow-lg)' }}>
        <span className="small muted">{dirty ? '변경사항이 있습니다. 적용 시 설정 변경 이력이 기록됩니다.' : '저장된 설정입니다.'}</span>
        <span className="spacer" />
        <button className="btn" disabled={!dirty} onClick={() => { setAlpha(40); setRerank(true); setTopK(50); setCtxN(6); setDirty(false) }}>되돌리기</button>
        <button className="btn btn-primary" disabled={!dirty} onClick={() => { setDirty(false); toast('검색 설정을 적용했습니다.') }}>적용</button>
      </div>
    </div>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}시`)
const wave = (base: number, amp: number, seed: number) => HOURS.map((_, i) => +(base + amp * Math.sin((i + seed) / 3.2) + (((i * 7 + seed) % 5) / 10) * amp * 0.6).toFixed(2))

function Perf() {
  const metrics = [
    { k: '하이브리드 검색 + Re-ranking', v: 2.1, p95: 3.8, target: 5, unit: 's' },
    { k: 'LLM 첫 토큰 도달 (TTFT)', v: 1.7, p95: 3.1, target: 4, unit: 's' },
    { k: 'End-to-End 응답 (500자)', v: 8.9, p95: 13.2, target: 15, unit: 's' },
    { k: 'TEI 임베딩 지연', v: 0.31, p95: 0.62, target: 3, unit: 's' },
  ]
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="widget-grid">
        {metrics.map(m => (
          <div key={m.k} className="card stat">
            <div className="label">{m.k}</div>
            <div className="value">{m.v}<span style={{ fontSize: 15 }}>{m.unit}</span></div>
            <div className="sub">P95 <b className={m.p95 <= m.target ? 'metric-ok' : 'metric-bad'}>{m.p95}{m.unit}</b> · 목표 ≤ {m.target}{m.unit}</div>
            <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${(m.p95 / m.target) * 100}%`, background: m.p95 <= m.target * 0.8 ? 'var(--c-ok)' : 'var(--c-warn)' }} /></div>
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))' }}>
        <section className="card"><div className="card-head"><h3>End-to-End 응답시간 (오늘)</h3></div>
          <div className="card-pad"><LineChart labels={HOURS} unit="s" target={{ value: 15, label: '목표 15s' }} series={[
            { name: '평균', color: PALETTE[0], values: wave(8.5, 1.4, 1) }, { name: 'P95', color: PALETTE[2], values: wave(12.2, 1.6, 3) }]} /></div>
        </section>
        <section className="card"><div className="card-head"><h3>동시 사용자 · TTFT</h3></div>
          <div className="card-pad"><LineChart labels={HOURS} series={[
            { name: '동시 사용자(명)', color: PALETTE[1], values: wave(9, 6, 0).map(v => Math.max(0, Math.round(v))) }, { name: 'TTFT P95(s)', color: PALETTE[3], values: wave(2.9, 0.4, 2) }]} /></div>
        </section>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))' }}>
        <section className="card"><div className="card-head"><h3>가용성 (업무시간)</h3></div>
          <div className="card-pad"><div style={{ fontSize: 34, fontWeight: 800 }} className="metric-ok">99.87%</div><div className="small muted">이번 달 · 목표 99% 이상 · 장애 0건</div></div>
        </section>
        <section className="card"><div className="card-head"><h3>GPU 리소스</h3></div>
          <div className="card-pad stack" style={{ gap: 10 }}>
            {[['vLLM VRAM', 78], ['TEI VRAM', 9], ['GPU 사용률', 46]].map(([k, v]) => (
              <div key={k}><div className="row small"><span>{k}</span><span className="spacer" /><b>{v}%</b></div><div className="progress"><span style={{ width: `${v}%`, background: +v > 85 ? 'var(--c-danger)' : undefined }} /></div></div>
            ))}
          </div>
        </section>
        <section className="card"><div className="card-head"><h3>최근 알림</h3></div>
          <ul className="card-pad stack small" style={{ margin: 0, listStyle: 'none', gap: 8 }}>
            <li><span className="badge badge-warn">경고</span> 14:02 P95 13.9s (임계 90% 도달)</li>
            <li><span className="badge badge-ok">복구</span> 14:09 P95 정상화</li>
            <li><span className="badge">정보</span> 09:00 벡터 인덱스 증분 갱신 완료</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function DataPipe() {
  const steps = [['수집', 182340], ['파싱·정제 (PDF/HWP)', 180912], ['청킹', 2412880], ['임베딩 (TEI)', 2398102], ['벡터DB 적재', 2398102]] as const
  const sources = [
    ['연구성과물 (ROMS)', 48210, 99.2], ['학술논문 (KOMS)', 112430, 99.6], ['질병재난 아카이브 (SAVE)', 3920, 100], ['코로나19 웹자원', 17780, 97.8], ['MeSH 사전어', 30956, 100],
  ] as const
  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="card">
        <div className="card-head"><h3>RAG 데이터 구축 파이프라인</h3><span className="spacer" /><span className="xs muted">마지막 증분 실행 2026-10-05 09:00</span></div>
        <div className="card-pad pipe">
          {steps.map(([k, n], i) => (
            <div key={k} className="pipe-step">
              <div className="xs muted" style={{ fontWeight: 700 }}>{i + 1}. {k}</div>
              <div className="n">{n.toLocaleString()}</div>
              <div className="xs muted">{i < 2 ? '문서' : '청크'}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h3>원천 데이터별 구축 현황</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>원천</th><th>문서 수</th><th style={{ width: '35%' }}>임베딩 완료율</th><th>품질검증 (중복·오류)</th></tr></thead>
            <tbody>
              {sources.map(([k, n, p]) => (
                <tr key={k}><td><b>{k}</b></td><td>{n.toLocaleString()}</td>
                  <td><div className="row"><div className="progress" style={{ flex: 1 }}><span style={{ width: `${p}%`, background: p === 100 ? 'var(--c-ok)' : undefined }} /></div><span className="xs">{p}%</span></div></td>
                  <td><span className="badge badge-ok">통과</span> <span className="xs muted">중복 {Math.round(n * 0.004)}건 제거</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
