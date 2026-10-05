import { useCallback, useRef, useState } from 'react'
import {
  CircleSlash, FolderOpen, GitBranch, Layers, Play, Plus, Save, Trash2, Wand2, Workflow,
} from 'lucide-react'
import { Card, Field, Modal, PageHead, State } from '../components/ui'
import { MODELS } from '../data/mock'

type NodeKind = 'input' | 'model' | 'filter' | 'branch' | 'merge' | 'eval' | 'report'

interface DagNode {
  id: string
  kind: NodeKind
  label: string
  model?: string
  x: number
  y: number
  state?: 'done' | 'running' | 'queued' | 'failed'
  note?: string
}

interface Edge { from: string; to: string; label?: string }

const KIND_META: Record<NodeKind, { color: string; name: string }> = {
  input: { color: '#64748b', name: '입력' },
  model: { color: '#0e7c66', name: '모델 실행' },
  filter: { color: '#d97706', name: '필터' },
  branch: { color: '#3b5bdb', name: '조건 분기' },
  merge: { color: '#7c3aed', name: '병합' },
  eval: { color: '#0891b2', name: '사용자 정의 평가' },
  report: { color: '#be185d', name: '보고서' },
}

const PALETTE: { kind: NodeKind; label: string; model?: string }[] = [
  { kind: 'input', label: '입력 (PDB/FASTA)' },
  { kind: 'input', label: '기존 run 승계' },
  { kind: 'model', label: 'MSA 생성', model: 'MMseqs2 v15' },
  { kind: 'model', label: 'RFDiffusion3', model: 'rfdiffusion3@1.2.0' },
  { kind: 'model', label: 'BioEmu', model: 'bioemu@1.1' },
  { kind: 'model', label: 'ProteinMPNN', model: 'proteinmpnn@1.0.1' },
  { kind: 'model', label: 'ColabFold (AF2)', model: 'colabfold@1.5.5' },
  { kind: 'model', label: 'AF2-Multimer', model: 'af2-multimer@2.3.2' },
  { kind: 'model', label: 'DiffDock', model: 'diffdock@1.1' },
  { kind: 'filter', label: 'SoluProt 필터', model: 'soluprot@1.0' },
  { kind: 'filter', label: '지표 컷오프' },
  { kind: 'branch', label: '조건 분기' },
  { kind: 'merge', label: '결과 병합' },
  { kind: 'eval', label: '사용자 정의 평가' },
  { kind: 'report', label: '보고서 생성' },
]

const TEMPLATES: Record<string, { nodes: DagNode[]; edges: Edge[] }> = {
  stability: {
    nodes: [
      { id: 'n1', kind: 'input', label: '입력 PDB 1EMA', x: 30, y: 180, state: 'done' },
      { id: 'n2', kind: 'model', label: 'MSA 생성', model: 'MMseqs2 v15', x: 240, y: 180, state: 'done' },
      { id: 'n3', kind: 'model', label: 'RFDiffusion3', model: 'rfdiffusion3@1.2.0', x: 450, y: 80, state: 'done' },
      { id: 'n4', kind: 'model', label: 'BioEmu', model: 'bioemu@1.1', x: 450, y: 280, state: 'done' },
      { id: 'n5', kind: 'merge', label: '백본 병합', x: 660, y: 180, state: 'done' },
      { id: 'n6', kind: 'model', label: 'ProteinMPNN', model: 'proteinmpnn@1.0.1', x: 860, y: 180, state: 'done' },
      { id: 'n7', kind: 'filter', label: 'SoluProt 필터', model: 'soluprot@1.0', x: 1060, y: 180, state: 'running' },
      { id: 'n8', kind: 'branch', label: '통과율 ≥ 35%?', x: 1060, y: 330, state: 'queued' },
      { id: 'n9', kind: 'model', label: 'ColabFold', model: 'colabfold@1.5.5', x: 1270, y: 180, state: 'queued' },
      { id: 'n10', kind: 'report', label: '보고서 생성', x: 1270, y: 330, state: 'queued' },
    ],
    edges: [
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n5' }, { from: 'n4', to: 'n5' }, { from: 'n5', to: 'n6' },
      { from: 'n6', to: 'n7' }, { from: 'n7', to: 'n8' },
      { from: 'n8', to: 'n9', label: 'yes' }, { from: 'n8', to: 'n10', label: 'no' },
      { from: 'n9', to: 'n10' },
    ],
  },
  binding: {
    nodes: [
      { id: 'b1', kind: 'input', label: 'run_0412 hit list', x: 30, y: 180, state: 'done' },
      { id: 'b2', kind: 'input', label: '표적 4ZQK (PD-L1)', x: 30, y: 320, state: 'done' },
      { id: 'b3', kind: 'model', label: 'DiffDock', model: 'diffdock@1.1', x: 270, y: 250, state: 'done' },
      { id: 'b4', kind: 'model', label: 'AF2-Multimer', model: 'af2-multimer@2.3.2', x: 500, y: 150, state: 'running' },
      { id: 'b5', kind: 'eval', label: '인터페이스 평가 (ipTM/PRODIGY)', x: 500, y: 340, state: 'queued' },
      { id: 'b6', kind: 'merge', label: '스코어 병합', x: 740, y: 250, state: 'queued' },
      { id: 'b7', kind: 'eval', label: '가중 랭킹', x: 960, y: 250, state: 'queued' },
      { id: 'b8', kind: 'report', label: '결합 후보 보고서', x: 1170, y: 250, state: 'queued' },
    ],
    edges: [
      { from: 'b1', to: 'b3' }, { from: 'b2', to: 'b3' },
      { from: 'b3', to: 'b4' }, { from: 'b3', to: 'b5' },
      { from: 'b4', to: 'b6' }, { from: 'b5', to: 'b6' },
      { from: 'b6', to: 'b7' }, { from: 'b7', to: 'b8' },
    ],
  },
}

const NODE_W = 176, NODE_H = 58

export default function DagStudio({ onToast }: { onToast: (m: string) => void }) {
  const [nodes, setNodes] = useState<DagNode[]>(TEMPLATES.stability.nodes)
  const [edges, setEdges] = useState<Edge[]>(TEMPLATES.stability.edges)
  const [sel, setSel] = useState<string | null>('n7')
  const [armed, setArmed] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.8)
  const [saveOpen, setSaveOpen] = useState(false)
  const [tplOpen, setTplOpen] = useState(false)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const counter = useRef(100)

  const selNode = nodes.find(n => n.id === sel) ?? null

  const onNodeDown = (e: React.PointerEvent, n: DagNode) => {
    e.stopPropagation()
    setSel(n.id)
    drag.current = { id: n.id, dx: e.clientX - n.x * zoom, dy: e.clientY - n.y * zoom }
  }

  const onMove = useCallback((e: React.PointerEvent) => {
    if (drag.current) {
      const { id, dx, dy } = drag.current
      setNodes(ns => ns.map(n => n.id === id
        ? { ...n, x: Math.max(0, (e.clientX - dx) / zoom), y: Math.max(0, (e.clientY - dy) / zoom) } : n))
    } else if (panRef.current) {
      setPan(p => ({ x: p.x + e.clientX - panRef.current!.x, y: p.y + e.clientY - panRef.current!.y }))
      panRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [zoom])

  const addNode = (p: typeof PALETTE[number]) => {
    const id = `n${counter.current++}`
    setNodes(ns => [...ns, {
      id, kind: p.kind, label: p.label, model: p.model, state: 'queued',
      x: (160 - pan.x) / zoom + Math.random() * 60, y: (200 - pan.y) / zoom + Math.random() * 60,
    }])
    setSel(id)
    onToast(`노드 추가: ${p.label}`)
  }

  const clickPort = (id: string, side: 'in' | 'out') => {
    if (side === 'out') { setArmed(id); return }
    if (armed && armed !== id) {
      if (!edges.some(e => e.from === armed && e.to === id)) {
        setEdges(es => [...es, { from: armed, to: id }])
        onToast('연결 추가')
      }
      setArmed(null)
    }
  }

  const removeNode = (id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id))
    setEdges(es => es.filter(e => e.from !== id && e.to !== id))
    setSel(null)
  }

  const loadTpl = (k: keyof typeof TEMPLATES) => {
    setNodes(TEMPLATES[k].nodes); setEdges(TEMPLATES[k].edges)
    setSel(null); setTplOpen(false); setPan({ x: 0, y: 0 })
    onToast(`템플릿 불러옴: ${k === 'stability' ? '안정화 표준' : '결합 예측 표준'}`)
  }

  const edgePath = (e: Edge) => {
    const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to)
    if (!a || !b) return null
    const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2
    const mid = Math.max(40, Math.abs(x2 - x1) / 2)
    return { d: `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 - 6 }
  }

  return (
    <>
      <PageHead
        title="Workflow Studio — 자유형 DAG"
        desc="노드를 조합해 병렬 분기, 조건 분기, 사용자 정의 평가 단계를 설계하고 템플릿으로 저장·재사용합니다."
        req="SFR-011 · UIR-002"
        actions={<>
          <button className="btn" onClick={() => setTplOpen(true)}><FolderOpen size={14} />템플릿 불러오기</button>
          <button className="btn" onClick={() => setSaveOpen(true)}><Save size={14} />템플릿 저장</button>
          <button className="btn primary" onClick={() => onToast('DAG 유효성 검사 통과 — run_0424 생성')}><Play size={14} />실행</button>
        </>}
      />

      <div className="dag-wrap">
        <div className="palette">
          <h4>노드 팔레트</h4>
          {PALETTE.map((p, i) => (
            <div key={i} className="pal-item" onClick={() => addNode(p)} title="클릭하여 캔버스에 추가">
              <span className="sw" style={{ background: KIND_META[p.kind].color }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                <div className="faint" style={{ fontSize: 10.5 }}>{p.model ?? KIND_META[p.kind].name}</div>
              </div>
              <Plus size={13} color="var(--text-3)" style={{ marginLeft: 'auto', flex: 'none' }} />
            </div>
          ))}
        </div>

        <div
          className="canvas"
          ref={canvasRef}
          onPointerDown={e => { panRef.current = { x: e.clientX, y: e.clientY }; setSel(null); setArmed(null) }}
          onPointerMove={onMove}
          onPointerUp={() => { drag.current = null; panRef.current = null }}
          onPointerLeave={() => { drag.current = null; panRef.current = null }}
        >
          <div className="canvas-tools">
            <button className="btn sm" onClick={e => { e.stopPropagation(); setZoom(z => Math.min(1.3, z + 0.1)) }}>＋</button>
            <button className="btn sm" onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.4, z - 0.1)) }}>－</button>
            <button className="btn sm" onClick={e => { e.stopPropagation(); setPan({ x: 0, y: 0 }); setZoom(0.8) }}>맞춤</button>
            <span className="badge">{nodes.length} 노드 · {edges.length} 연결</span>
            {armed && <span className="badge accent">연결 중 — 대상 노드의 입력 포트를 클릭</span>}
          </div>

          <div style={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
            <svg style={{ position: 'absolute', inset: 0, width: 2400, height: 1200, overflow: 'visible', pointerEvents: 'none' }}>
              <defs>
                <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#9aa5b1" />
                </marker>
              </defs>
              {edges.map((e, i) => {
                const p = edgePath(e)
                if (!p) return null
                return (
                  <g key={i}>
                    <path d={p.d} fill="none" stroke="#9aa5b1" strokeWidth="1.8" markerEnd="url(#ar)" />
                    {e.label && (
                      <>
                        <rect x={p.mx - 13} y={p.my - 9} width="26" height="15" rx="4" fill="#fff" stroke="#e4e7ec" />
                        <text x={p.mx} y={p.my + 2} textAnchor="middle" fontSize="9.5" fill="#475467">{e.label}</text>
                      </>
                    )}
                  </g>
                )
              })}
            </svg>

            {nodes.map(n => (
              <div key={n.id} className={'node' + (sel === n.id ? ' sel' : '')}
                style={{ left: n.x, top: n.y }} onPointerDown={e => onNodeDown(e, n)}>
                <div className="node-h" style={{ background: KIND_META[n.kind].color + '14', color: KIND_META[n.kind].color }}>
                  {n.kind === 'branch' ? <GitBranch size={13} /> : n.kind === 'merge' ? <Layers size={13} />
                    : n.kind === 'filter' ? <CircleSlash size={13} /> : n.kind === 'eval' ? <Wand2 size={13} />
                      : <Workflow size={13} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>
                </div>
                <div className="node-b">
                  <div className="row">
                    <span className="mono" style={{ fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.model ?? KIND_META[n.kind].name}
                    </span>
                    <div className="sp" />
                    {n.state && <State s={n.state} />}
                  </div>
                </div>
                {n.kind !== 'input' && (
                  <span className="port in" onPointerDown={e => { e.stopPropagation(); clickPort(n.id, 'in') }} title="입력" />
                )}
                <span className={'port out' + (armed === n.id ? ' armed' : '')}
                  onPointerDown={e => { e.stopPropagation(); clickPort(n.id, 'out') }} title="출력 — 클릭 후 대상 입력 포트 클릭" />
              </div>
            ))}
          </div>

          <div className="minihelp">팔레트 클릭으로 노드 추가 · 노드 드래그로 이동 · 출력→입력 포트 클릭으로 연결 · 빈 영역 드래그로 패닝</div>
        </div>

        <div className="inspector">
          {!selNode ? (
            <div className="empty" style={{ padding: '40px 10px' }}>
              <Workflow size={22} />
              <div style={{ marginTop: 8 }}>노드를 선택하면<br />상세 설정이 표시됩니다.</div>
            </div>
          ) : (
            <div className="col" style={{ gap: 14 }}>
              <div className="row">
                <span className="badge" style={{ color: KIND_META[selNode.kind].color, borderColor: KIND_META[selNode.kind].color + '55' }}>
                  {KIND_META[selNode.kind].name}
                </span>
                <div className="sp" />
                <button className="btn sm danger ghost" onClick={() => removeNode(selNode.id)}><Trash2 size={13} /></button>
              </div>
              <Field label="노드 이름">
                <input className="input" value={selNode.label}
                  onChange={e => setNodes(ns => ns.map(n => n.id === selNode.id ? { ...n, label: e.target.value } : n))} />
              </Field>
              {selNode.kind === 'model' && (
                <Field label="모델 / 버전" hint="Model Registry에 등록된 활성 모델만 선택됩니다.">
                  <select className="input" value={selNode.model}
                    onChange={e => setNodes(ns => ns.map(n => n.id === selNode.id ? { ...n, model: e.target.value } : n))}>
                    {MODELS.filter(m => m.state === 'active').map(m => (
                      <option key={m.id} value={`${m.id}@${m.version}`}>{m.name} {m.version}</option>
                    ))}
                  </select>
                </Field>
              )}
              {selNode.kind === 'branch' && (
                <>
                  <Field label="조건식" hint="단계 지표를 참조하는 식을 입력합니다.">
                    <input className="input mono" defaultValue="soluprot.pass_rate >= 0.35" />
                  </Field>
                  <div className="faint" style={{ fontSize: 11.5 }}>yes / no 두 출력 경로가 생성됩니다.</div>
                </>
              )}
              {selNode.kind === 'filter' && (
                <>
                  <Field label="컷오프"><input className="input" defaultValue="0.60" /></Field>
                  <Field label="최대 통과 수"><input className="input" type="number" defaultValue={200} /></Field>
                </>
              )}
              {selNode.kind === 'eval' && (
                <Field label="평가 스크립트" hint="샌드박스 컨테이너에서 실행되며 운영 반영 시 승인 절차를 거칩니다.">
                  <textarea className="input mono" rows={5} defaultValue={'score = 0.45*plddt/100 + 0.35*soluprot \\\n      + 0.20*(1 - min(rmsd,3)/3)'} />
                </Field>
              )}
              {selNode.kind === 'report' && (
                <Field label="보고서 언어"><select className="input"><option>국문</option><option>영문</option></select></Field>
              )}
              <Field label="재시도 횟수"><input className="input" type="number" defaultValue={2} /></Field>
              <Field label="타임아웃 (분)"><input className="input" type="number" defaultValue={60} /></Field>
              <label className="check"><input type="checkbox" defaultChecked={selNode.kind === 'filter'} />이 노드 완료 후 검토 지점(gate) 설정</label>
              <div className="divider" />
              <div className="kv" style={{ gridTemplateColumns: '68px 1fr' }}>
                <dt>노드 ID</dt><dd className="mono">{selNode.id}</dd>
                <dt>선행</dt><dd className="mono">{edges.filter(e => e.to === selNode.id).map(e => e.from).join(', ') || '—'}</dd>
                <dt>후행</dt><dd className="mono">{edges.filter(e => e.from === selNode.id).map(e => e.to).join(', ') || '—'}</dd>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid g3 mt">
        <Card title="저장된 템플릿" sub="재사용 가능" req="SFR-011">
          <div className="col" style={{ gap: 8 }}>
            {[
              ['안정화 표준 (병렬 백본)', '10 노드 · 사용 14회'],
              ['결합 예측 표준', '8 노드 · 사용 5회'],
              ['tier 비교 전용', '7 노드 · 사용 9회'],
              ['AF2 재검증 only', '4 노드 · 사용 21회'],
            ].map(([n, m]) => (
              <div key={n} className="row" style={{ fontSize: 12.5 }}>
                <span style={{ fontWeight: 500 }}>{n}</span>
                <div className="sp" />
                <span className="faint" style={{ fontSize: 11.5 }}>{m}</span>
                <button className="btn sm ghost" onClick={() => setTplOpen(true)}>열기</button>
              </div>
            ))}
          </div>
        </Card>
        <Card title="유효성 검사" sub="실행 전 자동 점검">
          <div className="col" style={{ gap: 8 }}>
            {[
              ['순환 참조 없음', 'ok'], ['입력 노드 연결 완료', 'ok'],
              ['모델 입출력 스키마 일치', 'ok'], ['미연결 노드', nodes.some(n => !edges.some(e => e.from === n.id || e.to === n.id)) ? 'warn' : 'ok'],
              ['GPU 자원 예산 내', 'ok'],
            ].map(([k, s]) => (
              <div key={k} className="row" style={{ fontSize: 12.5 }}>
                <span>{k}</span><div className="sp" />
                <span className={'badge ' + (s === 'ok' ? 'ok' : 'warn')}>{s === 'ok' ? '통과' : '확인 필요'}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="용어 일관성" sub="정형 Stage ↔ DAG" req="UIR-002">
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead><tr><th>정형 Stage</th><th>DAG 노드</th></tr></thead>
            <tbody>
              {[['msa', 'MSA 생성'], ['rfd3 / bioemu', '백본 생성 + 병합'], ['design', 'ProteinMPNN'], ['soluprot', 'SoluProt 필터'], ['af2', 'ColabFold']].map(([a, b]) => (
                <tr key={a}><td className="mono">{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {saveOpen && (
        <Modal title="템플릿 저장" onClose={() => setSaveOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setSaveOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => { setSaveOpen(false); onToast('템플릿 저장됨 (v3)') }}>저장</button>
          </>}>
          <Field label="템플릿 이름"><input className="input" defaultValue="안정화 표준 (병렬 백본)" /></Field>
          <Field label="설명"><textarea className="input" rows={3} defaultValue="RFD3·BioEmu 병렬 백본 생성 후 통과율 조건 분기를 적용한 안정화 워크플로우." /></Field>
          <Field label="공개 범위"><select className="input"><option>프로젝트 구성원</option><option>본인만</option><option>기관 전체</option></select></Field>
          <label className="check"><input type="checkbox" defaultChecked />현재 파라미터 값 포함</label>
        </Modal>
      )}

      {tplOpen && (
        <Modal title="템플릿 불러오기" onClose={() => setTplOpen(false)}>
          <div className="col" style={{ gap: 10 }}>
            <div className="pipe-card on" onClick={() => loadTpl('stability')}>
              <span className="badge brand">안정화</span>
              <h4>안정화 표준 (병렬 백본)</h4>
              <p>RFD3·BioEmu를 병렬 실행해 백본을 병합하고, SoluProt 통과율 조건으로 AF2 진행 여부를 분기합니다.</p>
            </div>
            <div className="pipe-card" onClick={() => loadTpl('binding')}>
              <span className="badge accent">결합 예측</span>
              <h4>결합 예측 표준</h4>
              <p>hit list와 표적을 입력으로 DiffDock 도킹 후 AF2-Multimer와 인터페이스 평가를 병렬 수행하고 가중 랭킹을 산출합니다.</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
