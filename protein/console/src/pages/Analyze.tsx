import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftRight, Download, ExternalLink, FileText, Play, RotateCcw, Sliders,
} from 'lucide-react'
import { Block, Card, Field, GroupTitle, Modal, MoreMenu, PageHead, Seg, State, Tabs } from '../components/ui'
import { Bars, Scatter, SequenceView, StructureViewer, useWidth } from '../components/viz'
import { RUNS, type Candidate, hoursText } from '../data/mock'
import {
  AF2_PROVIDER, AZ_ARTIFACTS, CHART_OPTIONS, CMP_BASELINES, CMP_GROUP_ORDER,
  CMP_MANIFEST, CMP_META_FIELDS, CMP_OPTIONS, CMP_PRESETS, CMP_TIERS, DISTRIBUTION, DIVERSITY,
  EXPERIMENT_LIST, EXP_ASSAYS, EXP_DIRECTIONS, EXP_RESULTS, FEEDBACK_LIST, FEEDBACK_REASONS,
  FEEDBACK_STAGES, FUNNEL, HIT_ROWS, REPORT_LINKS, REPORT_MD, REPORT_REVIEW_REASONS,
  REPORT_SUMMARY, RESIDUE_DIFF, RUN_METRICS, SOURCE_COMPARE, STRUCT_DIFF_STAT, SURROGATE_CV,
  SURROGATE_MODEL_LABEL, SURROGATE_ROLE_LABEL, SURROGATE_TOP, SURROGATE_TRIAGE, TIER_COMPARE,
  WT_COMPARE_ENABLED, WT_VS_DESIGN, type HitRow,
} from '../data/analyze'
import { can, gateTitle, roleNote, useRole } from '../data/session'
import './Analyze.css'

type Weights = { soluprot: number; plddt: number; rmsd: number; novelty: number }
type SortKey = 'seqId' | 'source' | 'surrogateRole' | 'surrogateRank' | 'tier' | 'score'
  | 'soluprot' | 'plddt' | 'rmsd' | 'relax'
type Scored = HitRow & { score: number }

const CURRENT_RUN = 'run_0421'
const DEFAULT_WEIGHTS: Weights = { soluprot: 0.4, plddt: 0.3, rmsd: 0.2, novelty: 0 }
const DEFAULT_CUTOFF = 0
const DEFAULT_LIMIT = 120

function num(v: number | null, digits = 2) {
  return v === null || v === undefined ? '-' : v.toFixed(digits)
}

function scoreOf(r: HitRow, w: Weights) {
  const tot = w.soluprot + w.plddt + w.rmsd + w.novelty
  if (tot <= 0) return 0
  const raw = w.soluprot * r.soluprot
    + w.plddt * ((r.plddt ?? 0) / 100)
    + w.rmsd * (1 - Math.min(r.rmsd ?? 3, 3) / 3)
    + w.novelty * Math.min(r.wtDiffN / 30, 1)
  return +((raw / tot) * 100).toFixed(1)
}

/* ===================== 화면 공통: 실행 선택 한 줄 ===================== */

/* 결과 분석 화면들은 주소의 ?run= 으로 대상 실행을 공유한다.
   화면을 옮겨도 같은 실행이 유지되도록 링크에 실행을 붙여 이동한다. */
function useRunContext() {
  const [sp, setSp] = useSearchParams()
  const runId = RUNS.some(r => r.id === sp.get('run')) ? sp.get('run') as string : CURRENT_RUN
  const run = RUNS.find(r => r.id === runId) ?? RUNS[0]
  const setRunId = (v: string) => setSp(new URLSearchParams({ run: v }), { replace: true })
  const withRun = (path: string) => `${path}?run=${runId}`
  return { runId, run, setRunId, withRun }
}

function RunStrip({ ctx, onToast }: { ctx: ReturnType<typeof useRunContext>; onToast: (m: string) => void }) {
  const nav = useNavigate()
  const { run, setRunId } = ctx
  return (
    <Card>
      <div className="row wrap">
        <span className="muted">대상 실행</span>
        <select className="input" style={{ width: 300 }} value={run.id}
          onChange={e => { setRunId(e.target.value); onToast(`${e.target.value} 컨텍스트로 전환`) }}>
          {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
        </select>
        <State s={run.status} />
        <span className="badge brand">stage: {run.stage}</span>
        <span className="muted">후보 {run.candidates}개</span>
        <span className="muted">GPU {hoursText(run.gpuHours)}</span>
        <div className="sp" />
        <button className="btn sm" onClick={() => nav(`/monitor/${run.id}`)}>
          <ExternalLink size={13} />실행 모니터에서 보기
        </button>
      </div>
    </Card>
  )
}

/* ===================== 10.2 Structure Compare Studio ===================== */

function FastaBlock({ title, name, seq, diff, side, hi }: {
  title: string; name: string; seq: string; diff: Set<number>; side: 'left' | 'right'; hi: number | null
}) {
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row"><b>{title}</b><div className="sp" /><span className="muted">{name}</span></div>
      {seq ? (
        <div className="pg-az-fasta">
          {seq.split('').map((ch, i) => {
            const pos = i + 1
            const cls = hi === pos ? 'pg-az-d-hi'
              : diff.has(pos) ? (side === 'left' ? 'pg-az-d-wt' : 'pg-az-d-des') : ''
            return <span key={pos} className={cls}>{ch}</span>
          })}
        </div>
      ) : <div className="empty">이 구조에서 추출된 서열이 없습니다.</div>}
      <div className="muted">길이 {seq.length} aa · 차이 {diff.size}개</div>
    </div>
  )
}

function CompareStudio({ onToast }: { onToast: (m: string) => void }) {
  const role = useRole()
  const [mode, setMode] = useState<'sequence' | 'structure'>('sequence')
  const [left, setLeft] = useState('ref_input')
  const [right, setRight] = useState('cf_seq_0007')
  const [ran, setRan] = useState(true)
  const [hi, setHi] = useState<number | null>(null)
  const [detail, setDetail] = useState(false)
  const [presetTier, setPresetTier] = useState<Record<string, string>>(
    Object.fromEntries(CMP_PRESETS.map(p => [p.key, '0.50'])),
  )

  const L = CMP_OPTIONS.find(o => o.id === left) ?? CMP_OPTIONS[0]
  const R = CMP_OPTIONS.find(o => o.id === right) ?? CMP_OPTIONS[1]

  const diff = useMemo(() => {
    const s = new Set<number>()
    if (!L.seq || !R.seq) return s
    const n = Math.min(L.seq.length, R.seq.length)
    for (let i = 0; i < n; i++) if (L.seq[i] !== R.seq[i]) s.add(i + 1)
    return s
  }, [L.seq, R.seq])

  const resolved = CMP_BASELINES.filter(b => b.available).length

  const optionSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <Field label={label}>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {CMP_GROUP_ORDER.map(g => (
          <optgroup key={g} label={g}>
            {CMP_OPTIONS.filter(o => o.group === g).map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  )

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="비교 설정"
        right={<Seg items={[{ key: 'sequence', label: '서열 diff' }, { key: 'structure', label: '구조 diff' }]}
          value={mode} onChange={setMode} />}>
        <div className="grid g2">
          {optionSelect(left, setLeft, 'Reference 3D (좌)')}
          {optionSelect(right, setRight, 'Candidate 3D (우)')}
        </div>
        <div className="divider" />
        <div className="row wrap">
          <button className="btn primary" onClick={() => { setRan(true); onToast(`비교 실행: ${L.label} vs ${R.label}`) }}>
            <Play size={14} />비교 실행
          </button>
          <MoreMenu items={[
            {
              label: '좌우 구조 교체', icon: <ArrowLeftRight size={14} />,
              onClick: () => { setLeft(right); setRight(left); onToast('좌우 구조를 교체했습니다.') },
            },
            {
              label: '비교 화면 초기화', icon: <RotateCcw size={14} />,
              onClick: () => {
                setLeft('ref_input'); setRight('cf_seq_0007'); setHi(null); setRan(false)
                onToast('비교 화면을 처음 상태로 되돌렸습니다.')
              },
            },
          ]} />
          <div className="sp" />
          <span className="muted">{mode === 'sequence' ? '서열 차이' : '구조 차이'} 비교</span>
        </div>
      </Card>

      {!ran ? (
        <Card title="비교 결과"><div className="empty">좌우 구조를 선택하고 비교 실행을 누르세요.</div></Card>
      ) : (
        <>
          <Card title="비교 결과" sub={`${L.label} vs ${R.label}`}
            right={<span className="muted">{mode === 'structure' ? 'CA 정렬 후 구조 diff' : '서열 diff'}</span>}>
            <div className="grid g2">
              <div className="col">
                <div className="row"><b>Reference 3D</b><div className="sp" /><span className="muted">{L.label}</span></div>
                <StructureViewer label={`${L.role} · ${L.chains}`} seed={3} height={280}
                  overlay={hi ? `잔기 ${hi} 강조` : undefined} />
              </div>
              <div className="col">
                <div className="row"><b>Candidate 3D</b><div className="sp" /><span className="muted">{R.label}</span></div>
                <StructureViewer label={`${R.role} · ${R.chains}`} seed={9} height={280}
                  overlay={hi ? `잔기 ${hi} 강조` : 'Reference'} />
              </div>
            </div>
            <div className="divider" />
            {mode === 'structure' ? (
              <div className="col">
                <div className="pg-az-legend">
                  <span><i style={{ background: '#a1a1aa' }} />정렬 일치 (1.5 Å 이하)</span>
                  <span><i style={{ background: '#facc15' }} />1.5 ~ 3.0 Å</span>
                  <span><i style={{ background: '#dc2626' }} />3.0 Å 초과</span>
                </div>
                <div className="muted">
                  RMSD {STRUCT_DIFF_STAT.rmsd.toFixed(2)} Å · P90 거리 {STRUCT_DIFF_STAT.p90.toFixed(2)} Å · 공통 CA {STRUCT_DIFF_STAT.commonCa}개
                </div>
              </div>
            ) : (
              <div className="col">
                <div className="pg-az-legend">
                  <span><i style={{ background: '#dbeafe' }} />WT 전용 / WT 치환 잔기</span>
                  <span><i style={{ background: '#ffedd5' }} />Design 전용 / Design 치환 잔기</span>
                  <span><i style={{ background: '#e4e4e7' }} />동일 잔기</span>
                  <span><i style={{ background: '#99f6e4' }} />선택한 잔기</span>
                </div>
                <div className="muted">
                  {diff.size === 0 ? '잔기 수준 차이가 없습니다.' : `잔기 수준 차이 ${diff.size}개를 찾았습니다.`}
                </div>
              </div>
            )}
          </Card>

          <Block title="잔기 차이와 서열 비교" sub="잔기 테이블에서 위치를 고르면 양쪽 뷰어와 FASTA 가 연동됩니다.">
            <div className="grid g-1-2">
              <Card title="잔기 테이블" flush>
              <div className="tbl-wrap pg-az-scroll-sm">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="no">No.</th><th>Residue</th><th>WT</th><th>Design</th><th className="num">d(Å)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESIDUE_DIFF.map((r, i) => (
                      <tr key={r.pos} className={hi === r.pos ? 'pg-az-sel' : ''} style={{ cursor: 'pointer' }}
                        onClick={() => { setHi(r.pos); onToast(`잔기 ${r.pos} 강조 (양쪽 뷰어 연동)`) }}>
                        <td className="no">{i + 1}</td>
                        <td className="mono">{r.pos}</td>
                        <td className="mono">{r.wt}</td>
                        <td className="mono">{r.design}</td>
                        <td className="num" style={{ color: r.d > 3 ? 'var(--err)' : r.d > 1.5 ? 'var(--warn)' : undefined }}>
                          {r.d.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="서열 (FASTA) 나란히 보기" sub={hi ? `강조 잔기 ${hi}` : '잔기 테이블에서 위치를 선택하세요.'}
              right={<button className="btn sm" onClick={() => setHi(null)}>강조 해제</button>}>
              <div className="grid g2">
                <FastaBlock title="Reference" name={L.label} seq={L.seq}
                  diff={mode === 'sequence' ? diff : new Set<number>()} side="left" hi={hi} />
                <FastaBlock title="Candidate" name={R.label} seq={R.seq}
                  diff={mode === 'sequence' ? diff : new Set<number>()} side="right" hi={hi} />
              </div>
              <div className="divider" />
              <SequenceView candidateId="cand_001" range={[1, 120]} />
            </Card>
            </div>
          </Block>

          <Card title="비교 메타데이터">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>필드</th><th>Reference (좌)</th><th>Candidate (우)</th>
                  </tr>
                </thead>
                <tbody>
                  {CMP_META_FIELDS.map((f, i) => (
                    <tr key={f.key as string} title={f.tip}>
                      <td className="no">{i + 1}</td>
                      <td>{f.label}</td>
                      <td className={f.key === 'path' ? 'mono' : ''}>{String(L[f.key] || '-')}</td>
                      <td className={f.key === 'path' ? 'mono' : ''}>{String(R[f.key] || '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <GroupTitle title="비교 입력 정보와 요약" sub="필요할 때 펼쳐서 확인하세요." />

      <Block title="기준 구조와 Manifest 컨텍스트">
        <div className="grid g2">
          <Card title={`기준 구조 (${resolved}/${CMP_BASELINES.length})`}>
            <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
              {CMP_BASELINES.map(b => (
                <div key={b.key} style={{ display: 'contents' }}>
                  <dt>{b.label}</dt>
                  <dd>{b.available ? <span className="mono">{b.value}</span> : <span className="muted">사용 불가</span>}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Manifest · 컨텍스트">
            <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
              {CMP_MANIFEST.map(m => (
                <div key={m.k} style={{ display: 'contents' }}>
                  <dt>{m.k}</dt><dd>{m.v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Block>

      <Card title="Quick Compare 프리셋" sub="자주 쓰는 비교 조합을 바로 실행합니다.">
        <div className="grid g3">
          {CMP_PRESETS.map(p => (
            <div key={p.key} className="col" style={{ gap: 8 }}>
              <button className="btn" onClick={() => {
                setLeft(p.left); setRight(p.right); setRan(true)
                onToast(`${p.label} 비교 (tier ${presetTier[p.key]})`)
              }}>{p.label}</button>
              <select className="input" value={presetTier[p.key]}
                onChange={e => setPresetTier(s => ({ ...s, [p.key]: e.target.value }))}>
                {CMP_TIERS.map(t => <option key={t} value={t}>tier {t}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Block title="비교 요약">
        <div className="row wrap">
          <button className="btn" onClick={() => setDetail(true)}>상세 보기</button>
          <button className="btn primary" disabled={!can(role, 'report_create')} title={gateTitle(role, 'report_create')}
            onClick={() => onToast('비교 요약 기반 보고서 생성 요청')}>
            <FileText size={14} />보고서 생성
          </button>
        </div>
        <div className="divider" />
        <div className="grid g3">
          <Card title="단계별 통과 수">
            <Bars data={FUNNEL.map(f => ({ label: f.label, value: f.value }))} unit="개" />
            <div className="divider" />
            <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
              {FUNNEL.map(f => (
                <div key={f.label} style={{ display: 'contents' }}>
                  <dt>{f.label}</dt><dd>{f.note}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="WT vs Design" sub={`WT 비교 사용: ${WT_COMPARE_ENABLED ? '예' : '아니오'}`} flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th className="no">No.</th><th>지표</th><th>WT</th><th>Design 중위</th><th>Δ</th></tr></thead>
                <tbody>
                  {WT_VS_DESIGN.map((r, i) => (
                    <tr key={r.metric}>
                      <td className="no">{i + 1}</td>
                      <td>{r.metric}</td><td>{r.wt}</td><td><b>{r.design}</b></td><td>{r.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="RFD3 vs BioEmu" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>Source</th><th className="num">백본</th><th className="num">SoluProt 통과</th>
                    <th className="num">중위 SoluProt</th><th className="num">{AF2_PROVIDER} 선정</th>
                    <th className="num">Relax 통과</th><th className="num">중위 pLDDT</th><th className="num">중위 RMSD</th>
                    <th className="num">Relax/res</th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_COMPARE.map((r, i) => (
                    <tr key={r.source}>
                      <td className="no">{i + 1}</td>
                      <td>{r.source}</td><td className="num">{r.backbones}</td><td className="num">{r.soluPass}</td>
                      <td className="num">{r.medSolu}</td><td className="num">{r.af2Selected}</td>
                      <td className="num">{r.relaxPass}</td><td className="num">{r.medPlddt}</td>
                      <td className="num">{r.medRmsd}</td><td className="num">{r.medRelax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="보존도 tier 비교" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>tier</th><th className="num">설계 수</th><th className="num">SoluProt 통과</th>
                    <th className="num">{AF2_PROVIDER} 선정</th><th className="num">Relax 통과</th>
                    <th className="num">중위 pLDDT</th><th className="num">중위 RMSD</th><th className="num">Relax/res</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_COMPARE.map((r, i) => (
                    <tr key={r.tier}>
                      <td className="no">{i + 1}</td>
                      <td className="num">{r.tier}</td><td className="num">{r.designs}</td><td className="num">{r.soluPass}</td>
                      <td className="num">{r.af2Selected}</td><td className="num">{r.relaxPass}</td>
                      <td className="num">{r.medPlddt}</td><td className="num">{r.medRmsd}</td><td className="num">{r.medRelax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="분포 (P10 ~ P90)" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no">No.</th><th>지표</th><th className="num">n</th><th className="num">P10</th>
                    <th className="num">P25</th><th className="num">중위</th><th className="num">P75</th>
                    <th className="num">P90</th><th className="num">IQR</th>
                  </tr>
                </thead>
                <tbody>
                  {DISTRIBUTION.map((r, i) => (
                    <tr key={r.metric}>
                      <td className="no">{i + 1}</td>
                      <td>{r.metric}</td><td className="num">{r.n}</td><td className="num">{r.p10}</td>
                      <td className="num">{r.p25}</td><td className="num"><b>{r.med}</b></td>
                      <td className="num">{r.p75}</td><td className="num">{r.p90}</td><td className="num">{r.iqr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="서열 다양성">
            <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
              <dt>고유 설계 서열</dt><dd>{DIVERSITY.uniqueSeq.toLocaleString()}개</dd>
              <dt>WT identity 중위</dt><dd>{DIVERSITY.wtIdentityMed}</dd>
              <dt>쌍 identity 중위</dt><dd>{DIVERSITY.pairwiseIdentityMed}</dd>
              <dt>최고</dt><dd>{DIVERSITY.best}</dd>
              <dt>최저</dt><dd>{DIVERSITY.worst}</dd>
              <dt>비교 쌍 수</dt><dd>{DIVERSITY.pairs.toLocaleString()}쌍</dd>
              <dt>서열 수</dt><dd>{DIVERSITY.sequences.toLocaleString()}개</dd>
            </dl>
            <div className="divider" />
            <div className="muted">{DIVERSITY.truncated}</div>
          </Card>
        </div>
      </Block>

      {detail && (
        <Modal title="비교 상세" onClose={() => setDetail(false)}
          footer={<>
            <button className="btn" onClick={() => onToast('비교 상세 JSON 내보내기')}><Download size={14} />JSON 내보내기</button>
            <div className="sp" />
            <button className="btn primary" onClick={() => setDetail(false)}>확인</button>
          </>}>
          <div className="col" style={{ gap: 16 }}>
            <dl className="kv" style={{ gridTemplateColumns: '160px 1fr' }}>
              <dt>비교 대상</dt><dd>{L.label} vs {R.label}</dd>
              <dt>모드</dt><dd>{mode === 'sequence' ? '서열 diff' : '구조 diff'}</dd>
              <dt>정렬 CA</dt><dd>{STRUCT_DIFF_STAT.commonCa}개</dd>
              <dt>RMSD</dt><dd>{STRUCT_DIFF_STAT.rmsd.toFixed(2)} Å</dd>
              <dt>P90 거리</dt><dd>{STRUCT_DIFF_STAT.p90.toFixed(2)} Å</dd>
              <dt>서열 차이</dt><dd>{diff.size}개 위치</dd>
            </dl>
            <div className="pg-az-md">{`비교 대상: ${L.path}\n              ${R.path}\n정렬: CA superposition (Kabsch)\n거리 밴드: <=1.5 Å 일치, 1.5~3.0 Å 주의, >3.0 Å 불일치\n차이 위치: ${RESIDUE_DIFF.map(r => r.pos).join(', ')}`}</div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* 산출물 목록·미리보기는 실행 모니터 상세 화면에 있다. 중복을 없애고 안내 링크만 둔다. */
function ArtifactNote() {
  const nav = useNavigate()
  const { runId } = useRunContext()
  return (
    <div className="col">
      <p className="muted" style={{ margin: 0 }}>
        실행 산출물 전체 목록과 파일 미리보기, ZIP 내려받기는 실행 모니터 상세 화면에서 제공합니다.
      </p>
      <div className="row wrap">
        <button className="btn sm" onClick={() => nav(`/monitor/${runId}`)}>
          <ExternalLink size={13} />실행 모니터 상세에서 산출물 보기
        </button>
      </div>
    </div>
  )
}

/* ===================== 10.4 피드백 / 10.5 실험 ===================== */

function FeedbackPanel({ onToast }: { onToast: (m: string) => void }) {
  const [rating, setRating] = useState<'good' | 'bad'>('good')
  const [reasons, setReasons] = useState<string[]>([])
  const [artifact, setArtifact] = useState('')
  const [stage, setStage] = useState('Auto')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('제출된 피드백이 없습니다.')
  const [list, setList] = useState(FEEDBACK_LIST)

  const opts = FEEDBACK_REASONS[rating]

  const submit = () => {
    if (!reasons.length) { setStatus('사유를 1개 이상 선택하세요.'); onToast('사유를 1개 이상 선택하세요.'); return }
    const row = {
      at: '2026-10-06 11:02', rating, reasons: reasons.join(', '), stage,
      artifact: artifact || '-', comment: comment || '-', by: '김연구',
    }
    setList([row, ...list])
    setStatus(`피드백을 제출했습니다. (${rating} · 사유 ${reasons.length}개)`)
    setReasons([]); setComment('')
    onToast('피드백을 제출했습니다.')
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="피드백"
        right={<Seg items={[{ key: 'good', label: 'Good' }, { key: 'bad', label: 'Bad' }]}
          value={rating} onChange={k => { setRating(k); setReasons([]) }} />}>
        <div className="col" style={{ gap: 16 }}>
          <Field label="사유" hint="평가에 따라 목록이 바뀝니다">
            <div className="row wrap" style={{ gap: 14 }}>
              {opts.map(o => (
                <label key={o.k} className="check">
                  <input type="checkbox" checked={reasons.includes(o.k)}
                    onChange={() => setReasons(s => s.includes(o.k) ? s.filter(x => x !== o.k) : [...s, o.k])} />
                  {o.l}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid g2">
            <Field label="산출물 (선택)">
              <select className="input" value={artifact} onChange={e => setArtifact(e.target.value)}>
                <option value="">선택 없음</option>
                {AZ_ARTIFACTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="단계">
              <select className="input" value={stage} onChange={e => setStage(e.target.value)}>
                {FEEDBACK_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="코멘트">
            <textarea className="input" rows={4} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="예: tier50 후보 중 코어 패킹이 가장 안정적입니다." />
          </Field>
          <div className="row wrap">
            <button className="btn primary" onClick={submit}>피드백 제출</button>
            <MoreMenu title="내보내기" items={[
              { label: 'CSV 파일 (최대 2,000행)', icon: <Download size={14} />, onClick: () => onToast('피드백 CSV 내보내기 (최대 2,000행)') },
              { label: 'TSV 파일 (최대 2,000행)', icon: <Download size={14} />, onClick: () => onToast('피드백 TSV 내보내기 (최대 2,000행)') },
            ]} />
            <div className="sp" />
            <span className="muted">{status}</span>
          </div>
        </div>
      </Card>

      <Card title="최근 피드백">
        <div className="tbl-wrap pg-az-scroll-sm">
          <table className="tbl">
            <thead>
              <tr>
                <th className="no">No.</th><th>시각</th><th>평가</th><th>사유</th><th>단계</th>
                <th>산출물</th><th>코멘트</th><th>작성자</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f, i) => (
                <tr key={`${f.at}-${i}`}>
                  <td className="no">{i + 1}</td>
                  <td>{f.at}</td>
                  <td><span className={'badge ' + (f.rating === 'good' ? 'ok' : 'err')}>{f.rating === 'good' ? 'Good' : 'Bad'}</span></td>
                  <td className="mono">{f.reasons}</td>
                  <td>{f.stage}</td>
                  <td className="mono">{f.artifact}</td>
                  <td>{f.comment}</td>
                  <td>{f.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ExperimentPanel({ onToast }: { onToast: (m: string) => void }) {
  const [f, setF] = useState({
    assay: 'Binding', result: 'Success', sample: '', artifact: '', candidate: '', seq: '',
    metric: 'activity', value: '', unit: '', dir: 'Maximize', rep: '',
    json: '', notes: '',
  })
  const [status, setStatus] = useState('제출된 실험 기록이 없습니다.')
  const [list, setList] = useState(EXPERIMENT_LIST)
  const set = (k: keyof typeof f, v: string) => setF(s => ({ ...s, [k]: v }))

  const submit = () => {
    if (!f.sample) { setStatus('Sample ID를 입력하세요.'); onToast('Sample ID를 입력하세요.'); return }
    if (f.json) {
      try { JSON.parse(f.json) } catch { setStatus('Metrics JSON 형식이 올바르지 않습니다.'); onToast('Metrics JSON 형식 오류'); return }
    }
    setList([{
      at: '2026-10-06 11:05', assay: f.assay, result: f.result, sample: f.sample,
      candidate: f.candidate || '-', seq: f.seq || '-', metric: f.metric,
      value: f.value || '-', unit: f.unit || '-', dir: f.dir, rep: f.rep || '-', by: '김연구',
    }, ...list])
    setStatus(`실험 기록을 제출했습니다. (${f.assay} · ${f.result})`)
    onToast('실험 기록을 제출했습니다.')
  }

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="실험 기록">
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g3">
            <Field label="Assay 유형">
              <select className="input" value={f.assay} onChange={e => set('assay', e.target.value)}>
                {EXP_ASSAYS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="결과">
              <select className="input" value={f.result} onChange={e => set('result', e.target.value)}>
                {EXP_RESULTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Sample ID">
              <input className="input" value={f.sample} onChange={e => set('sample', e.target.value)} placeholder="SMP-2026-115" />
            </Field>
            <Field label="산출물">
              <select className="input" value={f.artifact} onChange={e => set('artifact', e.target.value)}>
                <option value="">선택 없음</option>
                {AZ_ARTIFACTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Candidate ID">
              <input className="input" value={f.candidate} onChange={e => set('candidate', e.target.value)} placeholder="seq_0007" />
            </Field>
            <Field label="Sequence ID">
              <input className="input" value={f.seq} onChange={e => set('seq', e.target.value)} placeholder="seq_0007" />
            </Field>
            <Field label="목표 지표" hint="기본값 activity">
              <input className="input" value={f.metric} onChange={e => set('metric', e.target.value)} />
            </Field>
            <Field label="지표 값">
              <input className="input" type="number" step="0.01" value={f.value} onChange={e => set('value', e.target.value)} placeholder="12.5" />
            </Field>
            <Field label="단위">
              <input className="input" value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="nM" />
            </Field>
            <Field label="최적화 방향">
              <select className="input" value={f.dir} onChange={e => set('dir', e.target.value)}>
                {EXP_DIRECTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Replicate ID">
              <input className="input" value={f.rep} onChange={e => set('rep', e.target.value)} placeholder="R1" />
            </Field>
            <Field label="상태" hint="제출 결과 메시지">
              <input className="input" value={status} readOnly />
            </Field>
          </div>
          <Card title="Metrics JSON 과 조건 기록" sub="추가 정보 (선택 입력)">
            <div className="grid g2">
              <Field label="Metrics (JSON)">
                <textarea className="input" rows={4} value={f.json} onChange={e => set('json', e.target.value)}
                  placeholder={'{"kd_nM": 12.5, "t50_C": 48}'} />
              </Field>
              <Field label="조건 / 비고">
                <textarea className="input" rows={4} value={f.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="예: 37도 PBS, 3회 반복 평균" />
              </Field>
            </div>
          </Card>
          <div className="row wrap">
            <button className="btn primary" onClick={submit}>실험 제출</button>
            <MoreMenu title="내보내기" items={[
              { label: 'CSV 파일', icon: <Download size={14} />, onClick: () => onToast('실험 CSV 내보내기') },
              { label: 'TSV 파일', icon: <Download size={14} />, onClick: () => onToast('실험 TSV 내보내기') },
            ]} />
          </div>
        </div>
      </Card>

      <Card title="최근 실험">
        <div className="tbl-wrap pg-az-scroll-sm">
          <table className="tbl">
            <thead>
              <tr>
                <th className="no">No.</th><th>시각</th><th>Assay</th><th>결과</th><th>Sample ID</th>
                <th>Candidate</th><th>지표</th><th className="num">값</th><th>단위</th><th>방향</th>
                <th>Replicate</th><th>작성자</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e, i) => (
                <tr key={`${e.at}-${i}`}>
                  <td className="no">{i + 1}</td>
                  <td>{e.at}</td><td>{e.assay}</td>
                  <td><span className={'badge ' + (e.result === 'Success' ? 'ok' : e.result === 'Fail' ? 'err' : 'warn')}>{e.result}</span></td>
                  <td className="mono">{e.sample}</td>
                  <td className="mono">{e.candidate}</td>
                  <td className="mono">{e.metric}</td>
                  <td className="num">{e.value}</td><td>{e.unit}</td><td>{e.dir}</td>
                  <td className="mono">{e.rep}</td><td>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ===================== 10.6 보고서 ===================== */

function renderMarkdown(md: string) {
  const out: ReactNode[] = []
  let bullets: string[] = []
  const flush = (key: string) => {
    if (bullets.length) {
      out.push(<ul key={key}>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>)
      bullets = []
    }
  }
  md.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('#')) {
      flush(`u${i}`)
      out.push(<div className="pg-az-h" key={i}>{t.replace(/^#+\s*/, '')}</div>)
    } else if (t.startsWith('- ') || /^\d+\.\s/.test(t)) {
      bullets.push(t.replace(/^(-\s|\d+\.\s)/, ''))
    } else if (t.startsWith('|')) {
      flush(`u${i}`)
      out.push(<div className="pg-az-tbl-line" key={i}>{t}</div>)
    } else if (t) {
      flush(`u${i}`)
      out.push(<p key={i}>{t}</p>)
    } else {
      flush(`u${i}`)
    }
  })
  flush('u-last')
  return out
}

function ReportPanel({ onToast }: { onToast: (m: string) => void }) {
  /* 보고서에 첨부되는 Hit List 범위는 후보 선별 화면의 기본 설정을 기준으로 적는다. */
  const total = HIT_ROWS.length
  const cutoff = DEFAULT_CUTOFF
  const shown = Math.min(DEFAULT_LIMIT, HIT_ROWS.filter(r => scoreOf(r, DEFAULT_WEIGHTS) >= cutoff).length)

  const role = useRole()
  const canReport = can(role, 'report_create')
  const [md, setMd] = useState(REPORT_MD)
  const [status, setStatus] = useState('마지막 저장: 2026-10-05 09:56')
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState<'raw' | 'rendered'>('rendered')
  const [rvRating, setRvRating] = useState<'good' | 'bad'>('good')
  const [rvReasons, setRvReasons] = useState<string[]>([])
  const [rvComment, setRvComment] = useState('')
  const [rvStatus, setRvStatus] = useState('제출된 보고서 평가가 없습니다.')

  const rvOpts = REPORT_REVIEW_REASONS[rvRating]

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="보고서 (Markdown)" sub={`${md.split('\n').length}행`}
        right={<>
          <button className="btn sm" onClick={() => setOpen(true)}>렌더링 보기</button>
          <button className="btn primary sm" disabled={!canReport} title={gateTitle(role, 'report_create')}
            onClick={() => { setStatus('보고서를 저장했습니다. (rev 8)'); onToast('보고서 저장') }}>저장</button>
          <MoreMenu sm items={[
            {
              label: '저장된 보고서 불러오기',
              onClick: () => { setMd(REPORT_MD); setStatus('저장된 보고서를 불러왔습니다.'); onToast('보고서 불러오기') },
            },
            {
              label: '보고서 새로 생성', disabled: !canReport, note: gateTitle(role, 'report_create'),
              onClick: () => { setStatus('보고서를 새로 생성했습니다.'); onToast('보고서 생성 요청') },
            },
            {
              label: '결과 패키지 내보내기', disabled: !canReport, note: gateTitle(role, 'report_create'),
              onClick: () => onToast('결과 패키지(보고서 + 차트 + 구조) 내보내기'),
            },
          ]} />
        </>}>
        <div className="col">
          <dl className="kv" style={{ gridTemplateColumns: '160px 1fr' }}>
            <dt>Score</dt><dd>0.826 · {REPORT_SUMMARY.score}</dd>
            <dt>Evidence</dt><dd>318 / 1,200 · {REPORT_SUMMARY.evidence}</dd>
            <dt>Recommendation</dt><dd>tier50 확대 · {REPORT_SUMMARY.recommendation}</dd>
          </dl>
          <div className="divider" />
          <textarea className="input" rows={16} value={md} onChange={e => setMd(e.target.value)} />
          <div className="row">
            <span className="muted">{status}</span>
            <div className="sp" />
            <span className="muted">후보 선별 행 {shown} / {total} · 컷오프 {cutoff} 이상</span>
          </div>
          <div className="row wrap">
            <span className="faint">{roleNote(role, ['report_create', 'artifact_download'])}</span>
          </div>
        </div>
      </Card>

      <Card title="산출물 링크">
        <ArtifactNote />
        <div className="divider" />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>파일</th><th>설명</th><th>작업</th></tr></thead>
            <tbody>
              {REPORT_LINKS.map((l, i) => (
                <tr key={l.name}>
                  <td className="no">{i + 1}</td>
                  <td>{l.name}</td>
                  <td>{l.note}</td>
                  <td><button className="btn sm" onClick={() => onToast(`${l.name} 열기`)}>열기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="보고서 평가" sub="보고서 내용에 대한 평가를 남깁니다.">
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            <span className="muted">평가</span>
            <Seg items={[{ key: 'good', label: 'Good' }, { key: 'bad', label: 'Bad' }]}
              value={rvRating} onChange={k => { setRvRating(k); setRvReasons([]) }} />
          </div>
          <Field label="사유">
            <div className="row wrap" style={{ gap: 14 }}>
              {rvOpts.map(o => (
                <label key={o.k} className="check">
                  <input type="checkbox" checked={rvReasons.includes(o.k)}
                    onChange={() => setRvReasons(s => s.includes(o.k) ? s.filter(x => x !== o.k) : [...s, o.k])} />
                  {o.l}
                </label>
              ))}
            </div>
          </Field>
          <Field label="코멘트">
            <textarea className="input" rows={3} value={rvComment} onChange={e => setRvComment(e.target.value)}
              placeholder="예: 권고 항목이 명확해 바로 다음 라운드 설계에 반영할 수 있습니다." />
          </Field>
          <div className="row wrap">
            <button className="btn primary" onClick={() => {
              if (!rvReasons.length) { setRvStatus('사유를 1개 이상 선택하세요.'); onToast('사유를 1개 이상 선택하세요.'); return }
              setRvStatus(`보고서 평가를 제출했습니다. (${rvRating} · 사유 ${rvReasons.length}개)`)
              onToast('보고서 평가를 제출했습니다.')
            }}>평가 제출</button>
            <div className="sp" />
            <span className="muted">{rvStatus}</span>
          </div>
        </div>
      </Card>

      {open && (
        <Modal title="보고서" onClose={() => setOpen(false)}
          footer={<>
            <Seg items={[{ key: 'rendered', label: '렌더링' }, { key: 'raw', label: '원문' }]}
              value={rendered} onChange={setRendered} />
            <div className="sp" />
            <button className="btn" onClick={() => onToast('보고서 다운로드 (run_0421_ko.md)')}>
              <Download size={14} />다운로드
            </button>
            <button className="btn primary" onClick={() => setOpen(false)}>닫기</button>
          </>}>
          <div className="col" style={{ gap: 16 }}>
            {rendered === 'rendered'
              ? <div className="pg-az-rend">{renderMarkdown(md)}</div>
              : <div className="pg-az-md">{md}</div>}
            <Card title="첨부 구성">
              <dl className="kv" style={{ gridTemplateColumns: '200px 1fr' }}>
                <dt>후보 차트 (SVG 첨부)</dt><dd>3종: pLDDT vs RMSD, Hit Score 분포, tier별 통과율</dd>
                <dt>구조·서열 차이 (SVG 첨부)</dt><dd>2종: 서열 diff, CA 정렬 거리 밴드</dd>
                <dt>Hit List</dt><dd>행: {shown} / {total} (cutoff {'>='} {cutoff})</dd>
              </dl>
            </Card>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ===================== 10.7 실행 간 비교 ===================== */

function RunComparePanel({ onToast, runId, runName }: {
  onToast: (m: string) => void; runId: string; runName: string
}) {
  const [baseline, setBaseline] = useState(runId === 'run_0418' ? 'run_0412' : 'run_0418')
  const [detail, setDetail] = useState(false)
  const cur = RUN_METRICS[runId] ?? RUN_METRICS[CURRENT_RUN]
  const base = RUN_METRICS[baseline] ?? RUN_METRICS[CURRENT_RUN]
  const same = baseline === runId

  const rows = same ? [] : [
    { m: 'SoluProt', a: cur.soluprot.toFixed(3), b: base.soluprot.toFixed(3), d: (cur.soluprot - base.soluprot).toFixed(3) },
    { m: 'pLDDT', a: cur.plddt.toFixed(1), b: base.plddt.toFixed(1), d: (cur.plddt - base.plddt).toFixed(1) },
    { m: 'RMSD (Å)', a: cur.rmsd.toFixed(2), b: base.rmsd.toFixed(2), d: (cur.rmsd - base.rmsd).toFixed(2) },
    { m: 'Relax/res', a: cur.relax.toFixed(3), b: base.relax.toFixed(3), d: (cur.relax - base.relax).toFixed(3) },
    { m: 'SoluProt 통과율 (%)', a: cur.soluPass.toFixed(1), b: base.soluPass.toFixed(1), d: (cur.soluPass - base.soluPass).toFixed(1) },
    { m: `${AF2_PROVIDER} 통과율 (%)`, a: cur.af2Pass.toFixed(1), b: base.af2Pass.toFixed(1), d: (cur.af2Pass - base.af2Pass).toFixed(1) },
  ]

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="실행 간 비교"
        right={<>
          <button className="btn sm" onClick={() => onToast(same ? '기준 실행과 다른 실행을 선택하세요.' : `${runId} vs ${baseline} 비교`)}>비교</button>
          <button className="btn sm" onClick={() => same ? onToast('기준 실행과 다른 실행을 선택하세요.') : setDetail(true)}>상세 보기</button>
        </>}>
        <div className="grid g2">
          <Field label="현재 실행">
            <input className="input" value={`${runId} · ${runName}`} readOnly />
          </Field>
          <Field label="비교 대상 실행 (baseline)">
            <select className="input" value={baseline} onChange={e => setBaseline(e.target.value)}>
              {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
            </select>
          </Field>
        </div>
        {same && <>
          <div className="divider" />
          <div className="signal warn"><b>기준 실행과 다른 실행을 선택해야 합니다.</b>
            <p>비교 대상이 현재 실행과 동일하면 지표 차이를 계산할 수 없습니다.</p></div>
        </>}
      </Card>

      {!same && (
        <Card title="지표 비교" flush>
          <div className="tbl-wrap">
            <table className="tbl matrix">
              <thead>
                <tr><th className="no">No.</th><th>지표</th><th className="num">{runId}</th>
                  <th className="num">{baseline}</th><th className="num">Δ</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.m}>
                    <td className="no">{i + 1}</td>
                    <td>{r.m}</td>
                    <td className="num"><b>{r.a}</b></td>
                    <td className="num">{r.b}</td>
                    <td className="num" style={{ color: r.d.startsWith('-') ? 'var(--err)' : 'var(--ok)' }}>
                      {r.d.startsWith('-') ? r.d : `+${r.d}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Block title="라운드별 통과율 추이">
        <div className="grid g2">
          <Card title="라운드별 SoluProt 통과율" sub="단위 %">
            <Bars data={['run_0405', 'run_0412', 'run_0418', 'run_0421'].map(id => ({
              label: id, value: RUN_METRICS[id].soluPass,
            }))} unit="%" />
          </Card>
          <Card title={`라운드별 ${AF2_PROVIDER} 통과율`} sub="단위 %">
            <Bars data={['run_0405', 'run_0412', 'run_0418', 'run_0421'].map(id => ({
              label: id, value: RUN_METRICS[id].af2Pass, color: '#0ea5e9',
            }))} unit="%" />
          </Card>
        </div>
      </Block>

      {detail && (
        <Modal title="실행 비교 상세" onClose={() => setDetail(false)}
          footer={<>
            <button className="btn" onClick={() => onToast('실행 비교 결과 CSV 내보내기')}><Download size={14} />CSV 내보내기</button>
            <div className="sp" />
            <button className="btn primary" onClick={() => setDetail(false)}>확인</button>
          </>}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>지표</th><th className="num">{runId}</th>
                  <th className="num">{baseline}</th><th className="num">Δ</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.m}>
                    <td className="no">{i + 1}</td><td>{r.m}</td>
                    <td className="num">{r.a}</td><td className="num">{r.b}</td><td className="num">{r.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ===================== 10.9 차트 ===================== */

function Histogram({ values, bins = 12 }: { values: number[]; bins?: number }) {
  const [ref, W] = useWidth<HTMLDivElement>()
  const H = 300, PAD = 44
  if (!values.length) return <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
  const min = Math.min(...values), max = Math.max(...values)
  const step = (max - min) / bins || 1
  const counts = Array.from({ length: bins }, () => 0)
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step))
    counts[idx] += 1
  })
  const cmax = Math.max(...counts, 1)
  const bw = (W - PAD - 14) / bins
  return (
    <div ref={ref}>
    <svg width={W} height={H} style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = H - PAD - t * (H - PAD - 14)
        return (
          <g key={t}>
            <line x1={PAD} x2={W - 14} y1={y} y2={y} stroke="#f4f4f5" />
            <text x={PAD - 6} y={y + 3} textAnchor="end" fontSize="12" fill="#71717a">{Math.round(t * cmax)}</text>
          </g>
        )
      })}
      {counts.map((c, i) => {
        const h = (c / cmax) * (H - PAD - 14)
        return (
          <rect key={i} x={PAD + i * bw + 1.5} y={H - PAD - h} width={bw - 3} height={h} fill="#4f46e5" opacity=".85" rx="2">
            <title>{`${(min + i * step).toFixed(1)} ~ ${(min + (i + 1) * step).toFixed(1)} · ${c}개`}</title>
          </rect>
        )
      })}
      <line x1={PAD} x2={W - 14} y1={H - PAD} y2={H - PAD} stroke="#e4e4e7" />
      <line x1={PAD} x2={PAD} y1={10} y2={H - PAD} stroke="#e4e4e7" />
      <text x={PAD} y={H - 8} fontSize="12" fill="#52525b">{min.toFixed(0)}</text>
      <text x={W - 14} y={H - 8} textAnchor="end" fontSize="12" fill="#52525b">{max.toFixed(0)}</text>
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#52525b">Hit Score</text>
      <text x={10} y={H / 2} textAnchor="middle" fontSize="12" fill="#52525b" transform={`rotate(-90 10 ${H / 2})`}>Count</text>
    </svg>
    </div>
  )
}

function ChartsPanel({ rows, cutoff, sel, onPick }: {
  rows: Scored[]; cutoff: number; sel: string | null; onPick: (id: string) => void
}) {
  const [type, setType] = useState('plddt_rmsd')

  /* Scatter 는 Candidate 형태를 받으므로 ddg 슬롯에 Relax/res 값을 담아 재사용한다. */
  const asCandidates = (need: (r: Scored) => boolean): Candidate[] => rows.filter(need).map(r => ({
    id: r.seqId,
    source: r.source,
    tier: r.tier,
    mutations: r.wtDiffN,
    soluprot: r.soluprot,
    plddt: r.plddt ?? 0,
    rmsd: r.rmsd ?? 0,
    score: r.score,
    ddg: r.relax ?? 0,
  }))

  const hasAf2 = (r: Scored) => r.plddt !== null && r.rmsd !== null
  const hasRelax = (r: Scored) => hasAf2(r) && r.relax !== null

  let body: ReactNode = null
  let caption = ''
  const selCount = rows.filter(r => r.af2Selected).length
  const wtCount = rows.filter(r => r.isWt).length

  if (type === 'plddt_rmsd') {
    const d = asCandidates(hasAf2)
    body = d.length ? <Scatter data={d} x="rmsd" y="plddt" xLabel="RMSD (Å)" yLabel="pLDDT" selected={sel} onPick={onPick} />
      : <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
    caption = `점 ${d.length}개 · ${AF2_PROVIDER} 선정 ${selCount}개 · WT ${wtCount}개 (컷오프 ${cutoff} 이상)`
  } else if (type === 'plddt_soluprot') {
    const d = asCandidates(hasAf2)
    body = d.length ? <Scatter data={d} x="soluprot" y="plddt" xLabel="SoluProt" yLabel="pLDDT" cutoffX={0.6} selected={sel} onPick={onPick} />
      : <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
    caption = `점 ${d.length}개 · ${AF2_PROVIDER} 선정 ${selCount}개 (컷오프 ${cutoff} 이상)`
  } else if (type === 'plddt_relax') {
    const d = asCandidates(hasRelax)
    body = d.length ? <Scatter data={d} x="ddg" y="plddt" xLabel="Relax/res" yLabel="pLDDT" selected={sel} onPick={onPick} />
      : <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
    caption = `점 ${d.length}개 · ${AF2_PROVIDER} 선정 ${selCount}개 (컷오프 ${cutoff} 이상)`
  } else if (type === 'rmsd_relax') {
    const d = asCandidates(hasRelax)
    body = d.length ? <Scatter data={d} x="ddg" y="rmsd" xLabel="Relax/res" yLabel="RMSD (Å)" selected={sel} onPick={onPick} />
      : <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
    caption = `점 ${d.length}개 · ${AF2_PROVIDER} 선정 ${selCount}개 (컷오프 ${cutoff} 이상)`
  } else if (type === 'hist_score') {
    const vals = rows.map(r => r.score)
    body = <Histogram values={vals} bins={12} />
    caption = `후보 ${vals.length}개 · 12구간 (컷오프 ${cutoff} 이상)`
  } else {
    const tiers = [70, 50, 30] as const
    const data = tiers.map(t => {
      const g = rows.filter(r => r.tier === t)
      const pass = g.filter(r => r.af2Selected).length
      return { label: `보존도 tier 0.${t}`, value: g.length ? +((pass / g.length) * 100).toFixed(1) : 0 }
    })
    body = data.some(d => d.value > 0) ? <Bars data={data} unit="%" height={200} />
      : <div className="empty">현재 필터에서 선택한 차트에 사용할 수치 데이터가 없습니다.</div>
    caption = `tier ${tiers.length}종 · 후보 ${rows.length}개 (컷오프 ${cutoff} 이상)`
  }

  return (
    <Card title="차트" sub="점을 누르면 표에서 그 후보가 선택됩니다."
      right={<>
        <span className="muted">{caption}</span>
        <select className="input" style={{ width: 260 }} value={type} onChange={e => setType(e.target.value)}>
          {CHART_OPTIONS.map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
        </select>
      </>}>
      {body}
    </Card>
  )
}

/* ===================== 10.8 Hit List ===================== */

const HIT_COLS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: 'seqId', label: 'seq_id' },
  { key: 'source', label: 'source' },
  { key: 'surrogateRole', label: 'Surrogate' },
  { key: 'surrogateRank', label: 'Model rank' },
  { key: 'tier', label: 'tier' },
  { key: 'score', label: 'score', num: true },
  { key: 'soluprot', label: 'SoluProt', num: true },
  { key: 'plddt', label: 'pLDDT', num: true },
  { key: 'rmsd', label: 'RMSD (Å)', num: true },
  { key: 'relax', label: 'Relax/res', num: true },
]

function SurrogatePanel() {
  const maxCv = Math.max(...SURROGATE_CV.map(c => c.selectionScore))
  return (
    <Block title="Surrogate triage 요약" sub={`선택 모델: ${SURROGATE_MODEL_LABEL[SURROGATE_TRIAGE.selectedPolicy]}`}>
      <div className="col" style={{ gap: 16 }}>
        <div className="grid g2">
          <dl className="kv" style={{ gridTemplateColumns: '170px 1fr' }}>
            <dt>선택 전략</dt><dd>{SURROGATE_TRIAGE.strategy}</dd>
            <dt>후보 수 (triage 전 ~ 후)</dt>
            <dd>{SURROGATE_TRIAGE.countBefore.toLocaleString()} ~ {SURROGATE_TRIAGE.countAfter.toLocaleString()}개</dd>
            <dt>예상 구조 예측 호출</dt><dd>{SURROGATE_TRIAGE.expectedAf2}회</dd>
          </dl>
          <dl className="kv" style={{ gridTemplateColumns: '170px 1fr' }}>
            <dt>학습 샘플</dt><dd>{SURROGATE_TRIAGE.trainingCount}개</dd>
            <dt>선정 Top K</dt><dd>{SURROGATE_TRIAGE.selectedTopCount}개</dd>
            <dt>평가 완료</dt><dd>{SURROGATE_TRIAGE.evaluatedCount}개</dd>
          </dl>
        </div>
        <div className="grid g2">
          <Card title="모델 비교 (CV)" flush>
            <div className="tbl-wrap">
              <table className="tbl pg-az-nowrap">
                <thead>
                  <tr><th className="no">No.</th><th>모델</th><th className="num">선정 점수</th>
                    <th className="num">Spearman</th><th className="num">MAE</th></tr>
                </thead>
                <tbody>
                  {SURROGATE_CV.map((c, i) => (
                    <tr key={c.policy} className={c.policy === SURROGATE_TRIAGE.selectedPolicy ? 'pg-az-sel' : ''}>
                      <td className="no">{i + 1}</td>
                      <td>
                        {SURROGATE_MODEL_LABEL[c.policy]}
                        {c.policy === SURROGATE_TRIAGE.selectedPolicy && <span className="badge ok" style={{ marginLeft: 8 }}>선택</span>}
                      </td>
                      <td className="num">
                        {c.selectionScore.toFixed(3)}
                        <span className="pg-az-bar"><i style={{ width: `${(c.selectionScore / maxCv) * 100}%` }} /></span>
                      </td>
                      <td className="num">{c.spearman.toFixed(3)}</td>
                      <td className="num">{c.mae.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Top 후보" sub="획득 점수 상위" flush>
            <div className="tbl-wrap">
              <table className="tbl pg-az-nowrap">
                <thead>
                  <tr><th className="no">No.</th><th className="num">rank</th><th>seq_id</th><th>tier</th>
                    <th>획득 정책</th><th className="num">획득 점수</th><th className="num">pLDDT 예측</th></tr>
                </thead>
                <tbody>
                  {SURROGATE_TOP.map((r, i) => (
                    <tr key={r.seqId}>
                      <td className="no">{i + 1}</td>
                      <td className="num">{r.rank}</td>
                      <td className="mono">{r.seqId}</td>
                      <td className="num">{r.tier}</td>
                      <td>{SURROGATE_MODEL_LABEL[r.policy]}</td>
                      <td className="num">{r.acqScore.toFixed(3)}</td>
                      <td className="num">{r.af2Label.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Block>
  )
}

function HitListPanel({
  onToast, weights, setWeights, cutoff, setCutoff, limit, setLimit, sort, setSort,
  picked, setPicked, sel, setSel, filtered, shown,
}: {
  onToast: (m: string) => void
  weights: Weights; setWeights: (w: Weights) => void
  cutoff: number; setCutoff: (v: number) => void
  limit: number; setLimit: (v: number) => void
  sort: { key: SortKey; order: 'asc' | 'desc' }; setSort: (s: { key: SortKey; order: 'asc' | 'desc' }) => void
  picked: string[]; setPicked: (p: string[]) => void
  sel: string | null; setSel: (s: string) => void
  filtered: Scored[]; shown: Scored[]
}) {
  const [detail, setDetail] = useState(false)

  const head = (c: { key: SortKey; label: string; num?: boolean }) => (
    <th key={c.key} className={(c.num ? 'num ' : '') + 'pg-az-sortable'}
      onClick={() => setSort({
        key: c.key,
        order: sort.key === c.key ? (sort.order === 'desc' ? 'asc' : 'desc') : (c.key === 'surrogateRank' ? 'asc' : 'desc'),
      })}>
      {c.label}{sort.key === c.key ? (sort.order === 'desc' ? ' ▼' : ' ▲') : ''}
    </th>
  )

  const pickedRows = shown.filter(r => picked.includes(r.seqId))

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="점수 설정" sub="가중치와 컷오프를 바꾸면 아래 표가 바로 다시 계산됩니다."
        right={<button className="btn sm" onClick={() => {
          setWeights(DEFAULT_WEIGHTS); setCutoff(DEFAULT_CUTOFF); setLimit(DEFAULT_LIMIT)
          onToast('후보 선별 설정을 기본값으로 되돌렸습니다.')
        }}><RotateCcw size={13} />기본값</button>}>
        <div className="pg-az-weights">
          <div className="field">
            <label>점수 컷오프 {cutoff}점 이상</label>
            <input type="range" min={0} max={100} step={1} value={cutoff} onChange={e => setCutoff(+e.target.value)} />
            <span className="hint">0 ~ 100</span>
          </div>
          <div className="field">
            <label>표시 행 수</label>
            <input className="input" type="number" min={10} max={500} step={10} value={limit}
              onChange={e => setLimit(Math.max(10, Math.min(500, +e.target.value || 10)))} />
            <span className="hint">10 ~ 500</span>
          </div>
          {([['soluprot', 'SoluProt'], ['plddt', 'pLDDT'], ['rmsd', 'RMSD']] as const).map(([k, l]) => (
            <div className="field" key={k}>
              <label>{l} 가중치</label>
              <input className="input" type="number" min={0} step={0.05} value={weights[k]}
                onChange={e => setWeights({ ...weights, [k]: Math.max(0, +e.target.value || 0) })} />
              <span className="hint">기본 {DEFAULT_WEIGHTS[k]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Hit List" sub={`${shown.length}행 표시 · 전체 ${filtered.length}개 · 열 제목을 눌러 정렬하세요.`} flush
        right={<>
          <span className="muted">{picked.length}개 체크</span>
          <button className="btn sm" disabled={!sel}
            onClick={() => onToast(`${sel} 를 구조 비교 화면으로 보냈습니다.`)}>
            <ArrowLeftRight size={13} />{sel ? `${sel} 구조 비교` : '구조 비교'}
          </button>
          {/* 내려받기와 상세 보기를 한 메뉴에 모은다. 같은 아이콘을 둘 나란히 두지 않는다. */}
          <MoreMenu sm items={[
            { label: '선택 행 상세 보기', disabled: !sel, note: '먼저 표에서 행을 고르세요', onClick: () => setDetail(true) },
            {
              label: '체크한 서열 내려받기 (FASTA)', disabled: !picked.length, note: '먼저 표에서 행을 체크하세요',
              onClick: () => onToast(`${picked.length}개 후보 FASTA 다운로드`),
            },
            {
              label: '체크한 구조 내려받기 (PDB ZIP)',
              disabled: !picked.length || !pickedRows.some(r => r.hasPdb),
              note: picked.length ? '체크한 행에 PDB 산출물이 없습니다' : '먼저 표에서 행을 체크하세요',
              onClick: () => onToast(`${pickedRows.filter(r => r.hasPdb).length}개 PDB ZIP 다운로드`),
            },
          ]} />
        </>}>
        <div className="tbl-wrap pg-az-scroll">
          <table className="tbl pg-az-hits">
            <thead>
              <tr>
                <th className="no">No.</th>
                <th>
                  <label className="check" title="보이는 행 전체 선택">
                    <input type="checkbox" checked={shown.length > 0 && picked.length === shown.length}
                      onChange={() => setPicked(picked.length === shown.length ? [] : shown.map(r => r.seqId))} />
                  </label>
                </th>
                {HIT_COLS.map(head)}
                <th className="num" title="WT 대비 변이 수 / 길이 · identity">WT Diff</th>
                <th>{AF2_PROVIDER} 선정</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={15}><div className="empty">컷오프를 만족하는 후보가 없습니다.</div></td></tr>
              )}
              {shown.map((r, i) => {
                const cls = sel === r.seqId ? 'pg-az-sel'
                  : r.isWt ? 'pg-az-wt'
                    : r.plddt === null ? 'pg-az-na'
                      : r.af2Selected ? 'pg-az-pass' : ''
                return (
                  <tr key={r.seqId} className={cls} style={{ cursor: 'pointer' }}
                    onClick={() => setSel(r.seqId)}>
                    <td className="no">{i + 1}</td>
                    <td>
                      <label className="check" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={picked.includes(r.seqId)}
                          onChange={() => setPicked(picked.includes(r.seqId)
                            ? picked.filter(x => x !== r.seqId) : [...picked, r.seqId])} />
                      </label>
                    </td>
                    <td className="mono">{r.seqId}</td>
                    <td className="muted">{r.source}</td>
                    <td>{r.surrogateRole ? SURROGATE_ROLE_LABEL[r.surrogateRole] : '-'}</td>
                    <td title={r.surrogateRank !== null ? SURROGATE_MODEL_LABEL[SURROGATE_TRIAGE.selectedPolicy] : undefined}>
                      {r.surrogateRank !== null ? `Top ${r.surrogateRank}` : '-'}</td>
                    <td className="num">0.{r.tier}</td>
                    <td className="num"><b>{r.score.toFixed(1)}</b></td>
                    <td className="num">{r.soluprot.toFixed(3)}</td>
                    <td className="num">{num(r.plddt, 1)}</td>
                    <td className="num">{num(r.rmsd, 2)}</td>
                    <td className="num">{num(r.relax, 3)}</td>
                    <td className="num">{r.wtDiffN}/236 · {r.identity.toFixed(1)}%</td>
                    <td>{r.af2Selected
                      ? <span className="badge ok">Yes</span>
                      : <span className="badge">No</span>}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <button className="btn sm" onClick={e => { e.stopPropagation(); onToast(`${r.seqId} FASTA 다운로드`) }}>FASTA</button>
                        <button className="btn sm" disabled={!r.hasPdb} title={r.hasPdb ? undefined : 'PDB 산출물이 없습니다'}
                          onClick={e => { e.stopPropagation(); onToast(`${r.seqId} PDB 다운로드`) }}>PDB</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="행 표시 범례와 랭킹 규칙">
        <div className="col">
          <div className="pg-az-legend">
            <span><i style={{ background: 'var(--ok-soft)', border: '1px solid var(--line)' }} />{AF2_PROVIDER} 통과 행</span>
            <span><i style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }} />pLDDT 미산출 행</span>
            <span><i style={{ background: 'var(--accent-soft)', border: '1px solid var(--line)' }} />WT 행</span>
            <span><i style={{ background: 'var(--brand-soft)', border: '1px solid var(--line)' }} />선택 행 (비교 뷰어 연동)</span>
          </div>
          <div className="row wrap">
            <Sliders size={14} color="var(--text-3)" />
            <span className="muted">identity 는 퍼센트로만 표시되며 랭킹과 필터링에 영향을 주지 않습니다.</span>
          </div>
        </div>
      </Card>

      <SurrogatePanel />

      <ChartsPanel rows={filtered} cutoff={cutoff} sel={sel} onPick={setSel} />

      {detail && (
        <Modal title="Hit List 상세" onClose={() => setDetail(false)}
          footer={<>
            <button className="btn" onClick={() => onToast('Hit List 상세 마크다운 내보내기')}><Download size={14} />마크다운 내보내기</button>
            <div className="sp" />
            <button className="btn primary" onClick={() => setDetail(false)}>확인</button>
          </>}>
          <div className="pg-az-md">{[
            `# Hit List (run_0421)`,
            `행: ${shown.length} / ${filtered.length} / ${HIT_ROWS.length} (cutoff >= ${cutoff})`,
            `가중치: soluprot ${weights.soluprot} · plddt ${weights.plddt} · rmsd ${weights.rmsd} · novelty ${weights.novelty} (사용 안 함)`,
            '',
            '| # | seq_id | source | surrogate | tier | score | soluprot | plddt | rmsd | relax | wt_diff |',
            '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
            ...filtered.slice(0, 200).map((r, i) => `| ${i + 1} | ${r.seqId} | ${r.source} | ${r.surrogateRole ?? '-'} | 0.${r.tier} | ${r.score.toFixed(1)} | ${r.soluprot.toFixed(3)} | ${num(r.plddt, 1)} | ${num(r.rmsd, 2)} | ${num(r.relax, 3)} | ${r.wtDiffN}/236 |`),
            '',
            '최대 200행까지 표시됩니다.',
          ].join('\n')}</div>
        </Modal>
      )}
    </div>
  )
}

/* ===================== 결합 예측 결과 (기존 기능 유지) ===================== */

function BindingPanel({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="col" style={{ gap: 16 }}>
      <Card title="결합 예측 결과" sub="run_0420 · PD-L1 바인더" flush
        right={<button className="btn sm" onClick={() => onToast('결합 예측 결과 CSV 내보내기')}>CSV 내보내기</button>}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="no">No.</th><th>바인더</th><th>표적</th><th className="num">DiffDock conf.</th>
              <th className="num">ipTM</th><th className="num">pDockQ</th><th className="num">ΔG (kcal/mol)</th>
              <th className="num">BSA (Å²)</th><th className="num">결합 점수</th><th>상태</th>
            </tr></thead>
            <tbody>
              {[
                ['seq_0014', 0.82, 0.871, 0.64, -11.4, 1842, 0.883, 'done'],
                ['seq_0007', 0.78, 0.842, 0.61, -10.8, 1766, 0.851, 'done'],
                ['seq_0021', 0.74, 0.806, 0.58, -10.1, 1690, 0.812, 'done'],
                ['seq_0009', 0.69, 0.774, 0.52, -9.4, 1588, 0.771, 'running'],
                ['seq_0017', 0.66, 0.731, 0.49, -8.9, 1502, 0.734, 'running'],
                ['seq_0026', 0.61, null, null, null, null, null, 'queued'],
              ].map((r, i) => (
                <tr key={r[0] as string}>
                  <td className="no">{i + 1}</td>
                  <td className="mono">{r[0]}</td>
                  <td className="mono">4ZQK</td>
                  <td className="num">{r[1]}</td>
                  <td className="num">{r[2] ?? '-'}</td>
                  <td className="num">{r[3] ?? '-'}</td>
                  <td className="num">{r[4] ?? '-'}</td>
                  <td className="num">{r[5] ?? '-'}</td>
                  <td className="num"><b>{r[6] ?? '-'}</b></td>
                  <td><State s={String(r[7])} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Block title="복합체 구조와 인터페이스">
      <div className="grid g-2-1">
        <Card title="복합체 구조" sub="seq_0014 + 4ZQK · AF2-Multimer">
          <StructureViewer label="complex seq_0014 / 4ZQK" seed={17} height={320} overlay="표적 단독" />
        </Card>
        <Card title="인터페이스 요약">
          <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
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
            { label: '수소결합', value: 9, color: '#0ea5e9' },
            { label: '소수성 접촉', value: 14, color: '#4f46e5' },
            { label: '염다리', value: 3, color: '#f59e0b' },
          ]} unit="개" />
        </Card>
      </div>
      </Block>
    </div>
  )
}

/* ===================== 화면 ===================== */

/* /analyze : 후보 선별 */
export function AnalyzeHits({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [cutoff, setCutoff] = useState(DEFAULT_CUTOFF)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [sort, setSort] = useState<{ key: SortKey; order: 'asc' | 'desc' }>({ key: 'score', order: 'desc' })
  const [picked, setPicked] = useState<string[]>([])
  const [sel, setSel] = useState<string | null>('seq_0007')

  const filtered = useMemo(() => {
    const scored: Scored[] = HIT_ROWS.map(r => ({ ...r, score: scoreOf(r, weights) }))
    const rows = scored.filter(r => r.score >= cutoff)
    const dir = sort.order === 'desc' ? -1 : 1
    rows.sort((a, b) => {
      const av = a[sort.key] as string | number | null
      const bv = b[sort.key] as string | number | null
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * dir
      return (av - bv) * dir
    })
    return rows
  }, [weights, cutoff, sort])

  const shown = useMemo(() => filtered.slice(0, limit), [filtered, limit])

  return (
    <>
      <PageHead
        title="후보 선별"
        desc="가중치와 컷오프를 조절해 다음 단계로 보낼 후보를 고르세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/compare'))}>
            <ArrowLeftRight size={14} />구조 비교
          </button>
          <button className="btn primary" onClick={() => nav(ctx.withRun('/analyze/report'))}>
            <FileText size={14} />보고서 작성
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />
      <HitListPanel
        onToast={onToast}
        weights={weights} setWeights={setWeights}
        cutoff={cutoff} setCutoff={setCutoff}
        limit={limit} setLimit={setLimit}
        sort={sort} setSort={setSort}
        picked={picked} setPicked={setPicked}
        sel={sel} setSel={setSel}
        filtered={filtered} shown={shown}
      />
    </>
  )
}

/* /analyze/compare : 구조·서열 비교 */
export function AnalyzeCompare({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  return (
    <>
      <PageHead
        title="구조 · 서열 비교"
        desc="기준 구조와 후보 구조를 골라 잔기·서열 차이를 확인하세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze'))}>
            <Sliders size={14} />후보 선별
          </button>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/report'))}>
            <FileText size={14} />보고서 작성
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />
      <CompareStudio onToast={onToast} />
    </>
  )
}

/* /analyze/runs : 실행 간 비교 */
export function AnalyzeRuns({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  return (
    <>
      <PageHead
        title="실행 간 비교"
        desc="기준 실행과 이전 실행의 지표 차이를 비교하세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze'))}>
            <Sliders size={14} />후보 선별
          </button>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/report'))}>
            <FileText size={14} />보고서 작성
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />
      <RunComparePanel onToast={onToast} runId={ctx.runId} runName={ctx.run.name} />
    </>
  )
}

/* /analyze/report : 보고서 작성·내보내기 */
export function AnalyzeReport({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  return (
    <>
      <PageHead
        title="보고서"
        desc="보고서를 생성·편집해 내보내고 품질 평가를 남기세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze'))}>
            <Sliders size={14} />후보 선별
          </button>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/records'))}>
            <FileText size={14} />피드백 · 실험 기록
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />
      <ReportPanel onToast={onToast} />
    </>
  )
}

/* /analyze/records : 피드백과 실험 기록 */
export function AnalyzeRecords({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  const [tab, setTab] = useState<'feedback' | 'experiment'>('feedback')
  return (
    <>
      <PageHead
        title="피드백 · 실험 기록"
        desc="후보와 보고서에 대한 평가, 실험 결과를 기록하고 내보내세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze'))}>
            <Sliders size={14} />후보 선별
          </button>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/report'))}>
            <FileText size={14} />보고서 작성
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />

      <Tabs items={[
        { key: 'feedback' as const, label: `피드백 (${FEEDBACK_LIST.length})` },
        { key: 'experiment' as const, label: `실험 기록 (${EXPERIMENT_LIST.length})` },
      ]} value={tab} onChange={setTab} />

      {tab === 'feedback' && <FeedbackPanel onToast={onToast} />}
      {tab === 'experiment' && <ExperimentPanel onToast={onToast} />}
    </>
  )
}

/* /analyze/binding : 결합 예측 결과 */
export function AnalyzeBinding({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const ctx = useRunContext()
  return (
    <>
      <PageHead
        title="결합 예측 결과"
        desc="바인더 후보의 결합 지표와 인터페이스를 확인하세요."
        actions={<>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze/compare'))}>
            <ArrowLeftRight size={14} />구조 비교
          </button>
          <button className="btn" onClick={() => nav(ctx.withRun('/analyze'))}>
            <Sliders size={14} />후보 선별
          </button>
        </>}
      />
      <RunStrip ctx={ctx} onToast={onToast} />
      <BindingPanel onToast={onToast} />
    </>
  )
}
