import { useMemo, useState } from 'react'
import { Download, FileText, Sliders } from 'lucide-react'
import { Card, Field, PageHead, Seg, Tabs } from '../components/ui'
import { Bars, Scatter, SequenceView, StructureViewer } from '../components/viz'
import { CANDIDATES } from '../data/mock'

type Tab = 'hits' | 'compare' | 'runs' | 'binding'

export default function Analyze({ onToast }: { onToast: (m: string) => void }) {
  const [tab, setTab] = useState<Tab>('hits')
  const [sel, setSel] = useState<string>(CANDIDATES[0].id)
  const [w, setW] = useState({ plddt: 45, solu: 35, rmsd: 20 })
  const [srcFilter, setSrcFilter] = useState<'all' | 'input_pdb' | 'rfd3' | 'bioemu'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | '30' | '50' | '70'>('all')

  const ranked = useMemo(() => {
    const tot = w.plddt + w.solu + w.rmsd || 1
    return CANDIDATES
      .filter(c => srcFilter === 'all' || c.source === srcFilter)
      .filter(c => tierFilter === 'all' || String(c.tier) === tierFilter)
      .map(c => ({
        ...c,
        wscore: +(((c.plddt / 100) * w.plddt + c.soluprot * w.solu + (1 - Math.min(c.rmsd, 3) / 3) * w.rmsd) / tot).toFixed(3),
      }))
      .sort((a, b) => b.wscore - a.wscore)
  }, [w, srcFilter, tierFilter])

  const byTier = [30, 50, 70].map(t => ({
    label: `tier${t}`,
    value: CANDIDATES.filter(c => c.tier === t).length,
  }))
  const bySource = (['input_pdb', 'rfd3', 'bioemu'] as const).map(s => ({
    label: s,
    value: CANDIDATES.filter(c => c.source === s).length,
    color: s === 'input_pdb' ? '#3b5bdb' : s === 'rfd3' ? '#0e7c66' : '#d97706',
  }))

  return (
    <>
      <PageHead
        title="Analyze"
        desc="후보군의 구조·서열·지표를 한 화면에서 비교하고 가중 랭킹으로 선별합니다."
        req="SFR-008 · SFR-015 · UIR-004"
        actions={<>
          <button className="btn" onClick={() => onToast('선택 후보 FASTA·PDB 내보내기')}><Download size={14} />선택 후보 내보내기</button>
          <button className="btn primary" onClick={() => onToast('비교 보고서 생성 요청')}><FileText size={14} />비교 보고서 생성</button>
        </>}
      />

      <Tabs<Tab> items={[
        { key: 'hits', label: 'Hit List' },
        { key: 'compare', label: 'Compare Studio' },
        { key: 'runs', label: 'Run 간 비교' },
        { key: 'binding', label: '결합 예측 결과' },
      ]} value={tab} onChange={setTab} />

      {tab === 'hits' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
          <div className="col" style={{ gap: 14 }}>
            <Card title="가중 랭킹" sub={`${ranked.length}개 후보`} req="SFR-015" flush
              right={<>
                <Seg items={[{ key: 'all', label: '전체' }, { key: 'input_pdb', label: 'input' }, { key: 'rfd3', label: 'rfd3' }, { key: 'bioemu', label: 'bioemu' }]}
                  value={srcFilter} onChange={setSrcFilter} />
                <Seg items={[{ key: 'all', label: 'all' }, { key: '30', label: 't30' }, { key: '50', label: 't50' }, { key: '70', label: 't70' }]}
                  value={tierFilter} onChange={setTierFilter} />
              </>}>
              <div className="tbl-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}>#</th><th>후보</th><th>소스</th><th>tier</th>
                      <th className="num">치환</th><th className="num">SoluProt</th><th className="num">pLDDT</th>
                      <th className="num">RMSD (Å)</th><th className="num">ΔΔG</th><th className="num">가중 점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((c, i) => (
                      <tr key={c.id} className={sel === c.id ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSel(c.id)}>
                        <td className="faint">{i + 1}</td>
                        <td className="mono" style={{ fontWeight: 500 }}>{c.id}</td>
                        <td><span className="badge">{c.source}</span></td>
                        <td className="mono">{c.tier}</td>
                        <td className="num">{c.mutations}</td>
                        <td className="num" style={{ color: c.soluprot >= 0.6 ? 'var(--ok)' : 'var(--err)' }}>{c.soluprot.toFixed(3)}</td>
                        <td className="num" style={{ color: c.plddt >= 80 ? 'var(--ok)' : c.plddt >= 70 ? 'var(--warn)' : 'var(--err)' }}>{c.plddt.toFixed(1)}</td>
                        <td className="num">{c.rmsd.toFixed(2)}</td>
                        <td className="num">{c.ddg.toFixed(2)}</td>
                        <td className="num"><b>{c.wscore.toFixed(3)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid g2">
              <Card title="SoluProt vs pLDDT" sub="후보 분포">
                <Scatter data={CANDIDATES} x="soluprot" y="plddt" xLabel="SoluProt score" yLabel="pLDDT"
                  cutoffX={0.6} selected={sel} onPick={setSel} />
              </Card>
              <Card title="RMSD vs ΔΔG" sub="구조 보존 대비 안정성">
                <Scatter data={CANDIDATES} x="rmsd" y="ddg" xLabel="RMSD (Å)" yLabel="ΔΔG (kcal/mol)"
                  selected={sel} onPick={setSel} />
              </Card>
            </div>
          </div>

          <div className="col" style={{ gap: 14 }}>
            <Card title="랭킹 가중치" req="SFR-015" right={<Sliders size={14} color="var(--text-3)" />}>
              <div className="col" style={{ gap: 12 }}>
                {([['plddt', 'pLDDT'], ['solu', 'SoluProt'], ['rmsd', 'RMSD(역)']] as const).map(([k, l]) => (
                  <Field key={k} label={`${l} — ${w[k]}%`}>
                    <input type="range" min={0} max={100} step={5} value={w[k]}
                      onChange={e => setW(s => ({ ...s, [k]: +e.target.value }))} />
                  </Field>
                ))}
                <div className="faint" style={{ fontSize: 11.5 }}>합계 {w.plddt + w.solu + w.rmsd}% — 내부적으로 정규화됩니다.</div>
                <button className="btn sm" onClick={() => onToast('가중치 프리셋 저장')}>가중치 프리셋 저장</button>
              </div>
            </Card>
            <Card title="tier별 후보 수"><Bars data={byTier} unit="개" /></Card>
            <Card title="백본 소스별 후보 수"><Bars data={bySource} unit="개" /></Card>
            <Card title="요약 카드">
              <dl className="kv" style={{ gridTemplateColumns: '96px 1fr' }}>
                <dt>통과 후보</dt><dd>318 / 1,200 (26.5%)</dd>
                <dt>pLDDT ≥ 80</dt><dd>{CANDIDATES.filter(c => c.plddt >= 80).length}개</dd>
                <dt>RMSD ≤ 1.5</dt><dd>{CANDIDATES.filter(c => c.rmsd <= 1.5).length}개</dd>
                <dt>최고 점수</dt><dd className="mono">{ranked[0]?.id} · {ranked[0]?.wscore.toFixed(3)}</dd>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="col" style={{ gap: 14 }}>
          <div className="grid g2">
            <Card title="WT (1EMA)" sub="기준 구조" req="SFR-008">
              <StructureViewer label="1EMA · chain A" seed={3} />
            </Card>
            <Card title={sel} sub="설계 후보 — WT 오버레이" right={
              <select className="input" style={{ height: 28, width: 150 }} value={sel} onChange={e => setSel(e.target.value)}>
                {CANDIDATES.slice(0, 12).map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            }>
              <StructureViewer label={`${sel} · AF2 예측`} seed={9} overlay="WT" />
            </Card>
          </div>
          <Card title="WT Diff — 서열 비교" sub="치환 잔기와 고정 잔기 표시" req="SFR-008">
            <SequenceView candidateId={sel} range={[1, 120]} />
            <div className="divider" />
            <SequenceView candidateId={sel} range={[121, 236]} />
          </Card>
          <div className="grid g3">
            <Card title="지표 비교">
              <table className="tbl matrix" style={{ fontSize: 12.5 }}>
                <thead><tr><th>지표</th><th>WT</th><th>{sel}</th><th>Δ</th></tr></thead>
                <tbody>
                  {(() => {
                    const c = CANDIDATES.find(x => x.id === sel)!
                    return [
                      ['pLDDT', '96.2', c.plddt.toFixed(1), (c.plddt - 96.2).toFixed(1)],
                      ['SoluProt', '0.712', c.soluprot.toFixed(3), (c.soluprot - 0.712).toFixed(3)],
                      ['RMSD (Å)', '0.00', c.rmsd.toFixed(2), c.rmsd.toFixed(2)],
                      ['ΔΔG', '0.00', c.ddg.toFixed(2), c.ddg.toFixed(2)],
                      ['치환 수', '0', String(c.mutations), `+${c.mutations}`],
                    ].map(r => (
                      <tr key={r[0]}>
                        <td>{r[0]}</td><td>{r[1]}</td><td><b>{r[2]}</b></td>
                        <td style={{ color: r[3].startsWith('-') ? 'var(--err)' : 'var(--ok)' }}>{r[3]}</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </Card>
            <Card title="치환 위치 분포">
              <Bars data={[
                { label: 'N-말단 (1–60)', value: 2 }, { label: '중앙 β-barrel (61–150)', value: 4 },
                { label: 'C-말단 (151–236)', value: 3 },
              ]} unit="개" />
            </Card>
            <Card title="후보 작업">
              <div className="col" style={{ gap: 8 }}>
                <button className="btn" onClick={() => onToast(`${sel} PDB 다운로드`)}><Download size={14} />구조 (PDB)</button>
                <button className="btn" onClick={() => onToast(`${sel} FASTA 다운로드`)}><Download size={14} />서열 (FASTA)</button>
                <button className="btn" onClick={() => onToast('지표 JSON 다운로드')}><Download size={14} />지표 (JSON)</button>
                <button className="btn" onClick={() => onToast('비교 뷰 SVG 다운로드')}><Download size={14} />비교 뷰 (SVG)</button>
                <div className="divider" />
                <button className="btn primary" onClick={() => onToast('결합 예측 파이프라인 입력으로 전달')}>결합 예측으로 보내기</button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'runs' && (
        <div className="col" style={{ gap: 14 }}>
          <Card title="run 간 비교" sub="동일 프로젝트 내 라운드 비교" req="SFR-015"
            right={<>
              <select className="input" style={{ height: 28, width: 190 }} defaultValue="run_0412"><option>run_0412 · R2 best</option></select>
              <span className="faint">vs</span>
              <select className="input" style={{ height: 28, width: 190 }} defaultValue="run_0421"><option>run_0421 · R3 tier50</option></select>
            </>} flush>
            <div className="tbl-wrap">
              <table className="tbl matrix">
                <thead><tr><th>지표</th><th>run_0412</th><th>run_0418</th><th>run_0421</th><th>추세</th></tr></thead>
                <tbody>
                  {[
                    ['설계 서열 수', '960', '1,120', '1,200', '↑'],
                    ['SoluProt 통과', '142 (14.8%)', '198 (17.7%)', '318 (26.5%)', '↑'],
                    ['평균 pLDDT', '79.4', '81.2', '84.6', '↑'],
                    ['평균 RMSD (Å)', '1.82', '1.64', '1.41', '↓'],
                    ['상위 20 평균 점수', '0.742', '0.781', '0.826', '↑'],
                    ['GPU 소요 (h)', '8.7', '9.1', '6.4', '↓'],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><b>{r[3]}</b></td>
                      <td style={{ color: r[4] === '↑' ? 'var(--ok)' : 'var(--accent)' }}>{r[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid g2">
            <Card title="라운드별 통과율 추이"><Bars data={[
              { label: 'Round 1', value: 11.2 }, { label: 'Round 2', value: 14.8 },
              { label: 'Round 3 (t70)', value: 17.7 }, { label: 'Round 3 (t50)', value: 26.5 },
            ]} unit="%" /></Card>
            <Card title="소스별 상위 후보 기여도"><Bars data={bySource} unit="개" /></Card>
          </div>
        </div>
      )}

      {tab === 'binding' && (
        <div className="col" style={{ gap: 14 }}>
          <Card title="결합 예측 결과" sub="run_0420 · PD-L1 바인더" req="SFR-021" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr>
                  <th>#</th><th>바인더</th><th>표적</th><th className="num">DiffDock conf.</th>
                  <th className="num">ipTM</th><th className="num">pDockQ</th><th className="num">ΔG (kcal/mol)</th>
                  <th className="num">BSA (Å²)</th><th className="num">결합 점수</th><th>상태</th>
                </tr></thead>
                <tbody>
                  {[
                    ['cand_014', 0.82, 0.871, 0.64, -11.4, 1842, 0.883, 'done'],
                    ['cand_003', 0.78, 0.842, 0.61, -10.8, 1766, 0.851, 'done'],
                    ['cand_021', 0.74, 0.806, 0.58, -10.1, 1690, 0.812, 'done'],
                    ['cand_009', 0.69, 0.774, 0.52, -9.4, 1588, 0.771, 'running'],
                    ['cand_017', 0.66, 0.731, 0.49, -8.9, 1502, 0.734, 'running'],
                    ['cand_026', 0.61, null, null, null, null, null, 'queued'],
                  ].map((r, i) => (
                    <tr key={r[0] as string}>
                      <td className="faint">{i + 1}</td>
                      <td className="mono" style={{ fontWeight: 500 }}>{r[0]}</td>
                      <td className="mono">4ZQK</td>
                      <td className="num">{r[1]}</td>
                      <td className="num">{r[2] ?? '—'}</td>
                      <td className="num">{r[3] ?? '—'}</td>
                      <td className="num">{r[4] ?? '—'}</td>
                      <td className="num">{r[5] ?? '—'}</td>
                      <td className="num"><b>{r[6] ?? '—'}</b></td>
                      <td><span className={'badge ' + (r[7] === 'done' ? 'ok' : r[7] === 'running' ? 'run' : '')}>
                        {r[7] === 'done' ? '완료' : r[7] === 'running' ? '예측중' : '대기'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="grid g-2-1">
            <Card title="복합체 구조" sub="cand_014 + 4ZQK · AF2-Multimer">
              <StructureViewer label="complex cand_014 / 4ZQK" seed={17} height={320} overlay="표적 단독" />
            </Card>
            <Card title="인터페이스 요약">
              <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
                <dt>인터페이스 잔기</dt><dd>바인더 18 · 표적 21</dd>
                <dt>수소결합</dt><dd>9개</dd>
                <dt>염다리</dt><dd>3개</dd>
                <dt>소수성 접촉</dt><dd>14개</dd>
                <dt>ipTM</dt><dd>0.871</dd>
                <dt>pDockQ</dt><dd>0.64 (신뢰 구간 상)</dd>
                <dt>예측 ΔG</dt><dd>-11.4 kcal/mol</dd>
              </dl>
              <div className="divider" />
              <Bars data={[
                { label: '수소결합', value: 9, color: '#3b5bdb' },
                { label: '소수성 접촉', value: 14, color: '#0e7c66' },
                { label: '염다리', value: 3, color: '#d97706' },
              ]} unit="개" />
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
