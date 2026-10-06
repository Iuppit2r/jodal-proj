import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from 'react'
import {
  addEdge, Background, BackgroundVariant, Controls, getOutgoers, Handle, MarkerType, MiniMap, Position,
  ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow,
  type Connection, type Edge, type Node, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Cpu, FileInput, FileText, FolderOpen, Funnel, GitBranch, LayoutGrid, Merge, Play, Plus, Save, Shapes, Trash2,
  Wand2, Workflow, type LucideIcon,
} from 'lucide-react'
import { Field, Modal, MoreMenu, PageHead, Seg } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { MODELS } from '../data/mock'
import { tplStore, type WfTemplate } from '../data/templates'
import { useRole } from '../data/session'

type NodeKind = 'input' | 'model' | 'filter' | 'branch' | 'merge' | 'eval' | 'report'
/* 설계 화면이므로 노드에 실행 상태는 두지 않는다.
   실행 상태가 붙은 그래프는 Monitor 의 실행 상세에서 본다. */
type StepData = { kind: NodeKind; label: string; model?: string; note?: string }
type StepNode = Node<StepData, 'step'>

const KIND_META: Record<NodeKind, { color: string; soft: string; name: string; icon: LucideIcon }> = {
  input: { color: '#52525b', soft: '#f4f4f5', name: '입력', icon: FileInput },
  model: { color: '#4f46e5', soft: '#eef2ff', name: '모델 실행', icon: Cpu },
  filter: { color: '#b45309', soft: '#fffbeb', name: '필터', icon: Funnel },
  branch: { color: '#0284c7', soft: '#f0f9ff', name: '조건 분기', icon: GitBranch },
  merge: { color: '#7c3aed', soft: '#f5f3ff', name: '병합', icon: Merge },
  eval: { color: '#0d9488', soft: '#f0fdfa', name: '사용자 정의 평가', icon: Wand2 },
  report: { color: '#e11d48', soft: '#fff1f2', name: '보고서', icon: FileText },
}

const PALETTE: { group: string; items: { kind: NodeKind; label: string; model?: string }[] }[] = [
  {
    group: '입력',
    items: [
      { kind: 'input', label: '입력 (PDB/FASTA)' },
      { kind: 'input', label: '기존 실행 승계' },
    ],
  },
  {
    group: '모델',
    items: [
      { kind: 'model', label: 'MSA 생성', model: 'MMseqs2 v15' },
      { kind: 'model', label: 'RFDiffusion3', model: 'rfdiffusion3@1.2.0' },
      { kind: 'model', label: 'BioEmu', model: 'bioemu@1.1' },
      { kind: 'model', label: 'ProteinMPNN', model: 'proteinmpnn@1.0.1' },
      { kind: 'model', label: 'ColabFold (AF2)', model: 'colabfold@1.5.5' },
      { kind: 'model', label: 'AF2-Multimer', model: 'af2-multimer@2.3.2' },
      { kind: 'model', label: 'DiffDock', model: 'diffdock@1.1' },
    ],
  },
  {
    group: '제어 · 평가',
    items: [
      { kind: 'filter', label: 'SoluProt 필터', model: 'soluprot@1.0' },
      { kind: 'filter', label: '지표 컷오프' },
      { kind: 'branch', label: '조건 분기' },
      { kind: 'merge', label: '결과 병합' },
      { kind: 'eval', label: '사용자 정의 평가' },
      { kind: 'report', label: '보고서 생성' },
    ],
  },
]

/* ---------- 템플릿 ---------- */
type Tpl = { nodes: StepNode[]; edges: Edge[] }

const n = (id: string, kind: NodeKind, label: string, x: number, y: number, model?: string, note?: string): StepNode =>
  ({ id, type: 'step', position: { x, y }, data: { kind, label, model, note } })
const e = (source: string, target: string, sourceHandle?: 'yes' | 'no'): Edge =>
  ({ id: `${source}-${sourceHandle ?? 'out'}-${target}`, source, target, sourceHandle, label: sourceHandle })

const TEMPLATES: Record<'stability' | 'binding', Tpl> = {
  stability: {
    nodes: [
      n('n1', 'input', '입력 PDB 1EMA', 260, 0),
      n('n2', 'model', 'MSA 생성', 260, 96, 'MMseqs2 v15'),
      n('n3', 'model', 'RFDiffusion3', 120, 192, 'rfdiffusion3@1.2.0'),
      n('n4', 'model', 'BioEmu', 400, 192, 'bioemu@1.1'),
      n('n5', 'merge', '백본 병합', 260, 288),
      n('n6', 'model', 'ProteinMPNN', 260, 384, 'proteinmpnn@1.0.1'),
      n('n7', 'filter', 'SoluProt 필터', 260, 480, 'soluprot@1.0'),
      n('n8', 'branch', '통과율 ≥ 35%?', 260, 576),
      n('n9', 'model', 'ColabFold', 120, 672, 'colabfold@1.5.5'),
      n('n10', 'report', '보고서 생성', 400, 768),
    ],
    edges: [
      e('n1', 'n2'), e('n2', 'n3'), e('n2', 'n4'), e('n3', 'n5'), e('n4', 'n5'), e('n5', 'n6'),
      e('n6', 'n7'), e('n7', 'n8'), e('n8', 'n9', 'yes'), e('n8', 'n10', 'no'), e('n9', 'n10'),
    ],
  },
  binding: {
    nodes: [
      n('b1', 'input', 'run_0412 hit list', 120, 0),
      n('b2', 'input', '표적 4ZQK (PD-L1)', 400, 0),
      n('b3', 'model', 'DiffDock', 260, 96, 'diffdock@1.1'),
      n('b4', 'model', 'AF2-Multimer', 120, 192, 'af2-multimer@2.3.2'),
      n('b5', 'eval', '인터페이스 평가', 400, 192),
      n('b6', 'merge', '스코어 병합', 260, 288),
      n('b7', 'eval', '가중 랭킹', 260, 384),
      n('b8', 'report', '결합 후보 보고서', 260, 480),
    ],
    edges: [
      e('b1', 'b3'), e('b2', 'b3'), e('b3', 'b4'), e('b3', 'b5'),
      e('b4', 'b6'), e('b5', 'b6'), e('b6', 'b7'), e('b7', 'b8'),
    ],
  },
}

/* ---------- 커스텀 노드 ---------- */
function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  const m = KIND_META[data.kind]
  const Icon = m.icon
  return (
    <div className={'dag-node' + (selected ? ' selected' : '')}>
      {data.kind !== 'input' && <Handle type="target" position={Position.Top} />}
      <div className="dag-node-h">
        <span className="ic" style={{ background: m.soft, color: m.color }}><Icon size={14} /></span>
        <span className="t">{data.label}</span>
      </div>
      <div className="dag-node-b">
        <span className="m">{data.model ?? m.name}</span>
        {data.note && <span className="badge">{data.note}</span>}
      </div>
      {data.kind === 'branch' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%' }} title="yes" />
          <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%' }} title="no" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  )
}

const NODE_TYPES = { step: StepNodeView }
const NODE_W = 220, NODE_H = 72

/* 가장 긴 경로 기준 위→아래 계층 정렬 (실제 구축 시 dagre/elkjs로 대체) */
function layered(nodes: StepNode[], edges: Edge[]): StepNode[] {
  const rank = new Map(nodes.map(x => [x.id, 0]))
  for (let i = 0; i < nodes.length; i++) {
    for (const ed of edges) rank.set(ed.target, Math.max(rank.get(ed.target) ?? 0, (rank.get(ed.source) ?? 0) + 1))
  }
  const cols = new Map<number, StepNode[]>()
  nodes.forEach(x => { const r = rank.get(x.id) ?? 0; cols.set(r, [...(cols.get(r) ?? []), x]) })
  return nodes.map(x => {
    const r = rank.get(x.id) ?? 0
    const col = cols.get(r)!
    const i = col.indexOf(x)
    return { ...x, position: { x: 260 + (i - (col.length - 1) / 2) * (NODE_W + 60), y: r * (NODE_H + 24) } }
  })
}

function hasCycle(nodes: StepNode[], edges: Edge[]) {
  const indeg = new Map(nodes.map(x => [x.id, 0]))
  edges.forEach(ed => indeg.set(ed.target, (indeg.get(ed.target) ?? 0) + 1))
  const q = nodes.filter(x => !indeg.get(x.id)).map(x => x.id)
  let seen = 0
  while (q.length) {
    const id = q.shift()!
    seen++
    edges.filter(ed => ed.source === id).forEach(ed => {
      indeg.set(ed.target, indeg.get(ed.target)! - 1)
      if (!indeg.get(ed.target)) q.push(ed.target)
    })
  }
  return seen !== nodes.length
}

const DND_TYPE = 'application/rapid-node'

function Studio({ onToast }: { onToast: (m: string) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNode>(TEMPLATES.stability.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(TEMPLATES.stability.edges)
  const [saveOpen, setSaveOpen] = useState(false)
  const nav = useNavigate()
  const [tplOpen, setTplOpen] = useState(false)
  const [judge, setJudge] = useState<'valid' | 'term' | null>(null)
  const [tplTab, setTplTab] = useState<'shared' | 'personal'>('shared')
  const [saveName, setSaveName] = useState('안정화 표준 (병렬 백본)')
  const [saveDesc, setSaveDesc] = useState('RFD3 와 BioEmu 를 병렬 실행해 백본을 병합하고, 통과율 조건으로 분기합니다.')
  const [saveScope, setSaveScope] = useState<'shared' | 'personal'>('personal')
  const role = useRole()
  const isAdmin = role === 'admin'
  const templates = useSyncExternalStore(tplStore.subscribe, tplStore.all)
  const shared = templates.filter(t => t.scope === 'shared')
  const mine = templates.filter(t => t.scope === 'personal')
  const { screenToFlowPosition, fitView, getNodes, getEdges } = useReactFlow<StepNode, Edge>()
  const wrapRef = useRef<HTMLDivElement>(null)
  const counter = useRef(100)

  const selNode = nodes.find(x => x.selected) ?? null

  const styledEdges = useMemo(() => edges.map(ed => ({
    ...ed,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: ed.selected ? '#4f46e5' : '#a1a1aa' },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 6,
  })), [edges])

  /* 자기 자신·중복·순환 연결 차단 */
  const isValidConnection = useCallback((c: Connection | Edge) => {
    if (c.source === c.target) return false
    const all = getNodes(), es = getEdges()
    if (es.some(x => x.source === c.source && x.target === c.target && (x.sourceHandle ?? null) === (c.sourceHandle ?? null))) return false
    const target = all.find(x => x.id === c.target)
    if (!target) return false
    const visit = (node: StepNode, seen = new Set<string>()): boolean => {
      if (seen.has(node.id)) return false
      seen.add(node.id)
      return getOutgoers(node, all, es).some(o => o.id === c.source || visit(o, seen))
    }
    return !visit(target)
  }, [getNodes, getEdges])

  const onConnect = useCallback((c: Connection) => {
    setEdges(es => addEdge({ ...c, id: `${c.source}-${c.sourceHandle ?? 'out'}-${c.target}`, label: c.sourceHandle ?? undefined }, es))
    onToast('연결 추가')
  }, [setEdges, onToast])

  const addNode = (p: { kind: NodeKind; label: string; model?: string }, at?: { x: number; y: number }) => {
    const seq = counter.current++
    const id = `n${seq}`
    const rect = wrapRef.current?.getBoundingClientRect()
    const nudge = (seq % 5) * 24 - 48  // 연속 추가 시 겹치지 않도록 대각선으로 비켜 배치
    const pos = at ?? screenToFlowPosition({
      x: (rect ? rect.left + rect.width / 2 : 600) - NODE_W / 2 + nudge,
      y: (rect ? rect.top + rect.height / 2 : 300) - NODE_H / 2 + nudge,
    })
    setNodes(ns => [
      ...ns.map(x => ({ ...x, selected: false })),
      { id, type: 'step', position: pos, selected: true, data: { kind: p.kind, label: p.label, model: p.model } },
    ])
    onToast(`노드 추가: ${p.label}`)
  }

  const onDrop = (ev: DragEvent) => {
    ev.preventDefault()
    const raw = ev.dataTransfer.getData(DND_TYPE)
    if (!raw) return
    const pos = screenToFlowPosition({ x: ev.clientX - NODE_W / 2, y: ev.clientY - 20 })
    addNode(JSON.parse(raw), pos)
  }

  const patch = (id: string, d: Partial<StepData>) =>
    setNodes(ns => ns.map(x => x.id === id ? { ...x, data: { ...x.data, ...d } } : x))

  const removeNode = (id: string) => {
    setNodes(ns => ns.filter(x => x.id !== id))
    setEdges(es => es.filter(x => x.source !== id && x.target !== id))
  }

  const loadTpl = (t: WfTemplate) => {
    const k = t.base
    setNodes(TEMPLATES[k].nodes); setEdges(TEMPLATES[k].edges); setTplOpen(false)
    requestAnimationFrame(() => fitView({ padding: 0.12, maxZoom: 1, duration: 300 }))
    onToast(`템플릿 불러옴: ${t.name}`)
  }

  const autoLayout = () => {
    setNodes(ns => layered(ns, edges))
    requestAnimationFrame(() => fitView({ padding: 0.12, maxZoom: 1, duration: 300 }))
  }

  const isolated = nodes.some(x => !edges.some(ed => ed.source === x.id || ed.target === x.id))
  const cyclic = hasCycle(nodes, edges)
  const checks: [string, boolean][] = [
    ['순환 참조 없음', !cyclic],
    ['입력 노드 존재', nodes.some(x => x.data.kind === 'input')],
    ['모델 입출력 스키마 일치', true],
    ['미연결 노드 없음', !isolated],
    ['GPU 자원 예산 내', true],
  ]
  const valid = checks.every(([, ok]) => ok)
  const failCount = checks.filter(([, ok]) => !ok).length
  const terms: [string, string][] = [['msa', 'MSA 생성'], ['rfd3 / bioemu', '백본 생성 + 병합'], ['design', 'ProteinMPNN'], ['soluprot', 'SoluProt 필터'], ['af2', 'ColabFold']]

  return (
    <>
      <PageHead
        title="흐름 설계 (DAG)"
        desc="왼쪽 팔레트에서 노드를 끌어다 놓고 포트끼리 연결하세요."
        actions={<>
          <button className="btn" onClick={() => setTplOpen(true)}><FolderOpen size={15} />템플릿 불러오기</button>
          <MoreMenu title="템플릿 관리" items={[
            { label: '현재 흐름을 템플릿으로 저장', icon: <Save size={14} />, onClick: () => setSaveOpen(true) },
            { label: '템플릿 관리 화면으로', icon: <Shapes size={14} />, onClick: () => nav('/templates') },
          ]} />
          <button className="btn primary" disabled={!valid}
            onClick={() => onToast('DAG 유효성 검사 통과, run_0424 생성')}><Play size={15} />실행</button>
        </>}
      />

      <div className="dag-wrap">
        <div className="palette">
          {PALETTE.map(g => (
            <div key={g.group}>
              <h4>{g.group}</h4>
              {g.items.map(p => {
                const m = KIND_META[p.kind]
                return (
                  <div key={p.label} className="pal-item" draggable title="드래그하거나 클릭하여 추가"
                    onDragStart={ev => { ev.dataTransfer.setData(DND_TYPE, JSON.stringify(p)); ev.dataTransfer.effectAllowed = 'move' }}
                    onClick={() => addNode(p)}>
                    <span className="pal-ic" style={{ background: m.soft, color: m.color }}><m.icon size={14} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="pal-name">{p.label}</div>
                      <div className="pal-meta">{p.model ?? m.name}</div>
                    </div>
                    <Plus size={14} color="var(--text-3)" style={{ flex: 'none' }} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="canvas" ref={wrapRef} onDragOver={ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move' }} onDrop={onDrop}>
          <ReactFlow<StepNode, Edge>
            nodes={nodes}
            edges={styledEdges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            connectionLineStyle={{ strokeWidth: 2 }}
            fitView
            fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
            minZoom={0.3}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#d4d4d8" />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap position="top-right" pannable zoomable style={{ width: 150, height: 110 }}
              nodeColor={x => KIND_META[(x as StepNode).data.kind].color}
              nodeBorderRadius={6} maskColor="rgba(244,244,245,.7)" />
          </ReactFlow>

          <div className="canvas-tools">
            <button className="btn sm" onClick={autoLayout}><LayoutGrid size={14} />자동 정렬</button>
            <span className="muted">{nodes.length} 노드 · {edges.length} 연결</span>
            <button type="button" className={'badge click ' + (valid ? 'ok' : 'warn')} onClick={() => setJudge('valid')}>
              <i className="dot" />{valid ? '유효성 검사 통과' : `유효성 확인 필요 ${failCount}건`}
            </button>
            <button type="button" className="badge click ok" onClick={() => setJudge('term')}>
              <i className="dot" />용어 일관성 {terms.length}건 대응
            </button>
          </div>
          <div className="minihelp">드래그로 노드 추가 · 포트를 끌어 연결 · Delete로 삭제</div>
        </div>

        <div className="inspector">
          {!selNode ? (
            <div className="empty" style={{ padding: '48px 12px' }}>
              <Workflow size={22} />
              <div style={{ marginTop: 10 }}>노드를 선택하면<br />상세 설정이 표시됩니다.</div>
            </div>
          ) : (
            <div className="col" style={{ gap: 16 }}>
              <div className="row">
                <span className="badge" style={{ color: KIND_META[selNode.data.kind].color, background: KIND_META[selNode.data.kind].soft }}>
                  {KIND_META[selNode.data.kind].name}
                </span>
                <div className="sp" />
                <button className="btn sm danger ghost" title="노드 삭제" onClick={() => removeNode(selNode.id)}><Trash2 size={14} /></button>
              </div>
              <Field label="노드 이름">
                <input className="input" value={selNode.data.label} onChange={ev => patch(selNode.id, { label: ev.target.value })} />
              </Field>
              {selNode.data.kind === 'model' && (
                <Field label="모델 / 버전" hint="모델 레지스트리에 등록된 활성 모델만 선택됩니다.">
                  <select className="input" value={selNode.data.model} onChange={ev => patch(selNode.id, { model: ev.target.value })}>
                    {selNode.data.model && !MODELS.some(m => `${m.id}@${m.version}` === selNode.data.model) && (
                      <option value={selNode.data.model}>{selNode.data.model}</option>
                    )}
                    {MODELS.filter(m => m.state === 'active').map(m => (
                      <option key={m.id} value={`${m.id}@${m.version}`}>{m.name} {m.version}</option>
                    ))}
                  </select>
                </Field>
              )}
              {selNode.data.kind === 'branch' && (
                <Field label="조건식" hint="yes / no 두 출력 포트로 분기됩니다.">
                  <input className="input mono" defaultValue="soluprot.pass_rate >= 0.35" />
                </Field>
              )}
              {selNode.data.kind === 'filter' && (
                <>
                  <Field label="컷오프"><input className="input" defaultValue="0.60" /></Field>
                  <Field label="최대 통과 수"><input className="input" type="number" defaultValue={200} /></Field>
                </>
              )}
              {selNode.data.kind === 'eval' && (
                <Field label="평가 스크립트" hint="샌드박스 컨테이너에서 실행되며 운영 반영 시 승인 절차를 거칩니다.">
                  <textarea className="input mono" rows={5} defaultValue={'score = 0.45*plddt/100 + 0.35*soluprot \\\n      + 0.20*(1 - min(rmsd,3)/3)'} />
                </Field>
              )}
              {selNode.data.kind === 'report' && (
                <Field label="보고서 언어"><select className="input"><option>국문</option><option>영문</option></select></Field>
              )}
              <div className="grid g2" style={{ gap: 16 }}>
                <Field label="재시도 횟수"><input className="input" type="number" defaultValue={2} /></Field>
                <Field label="타임아웃 (분)"><input className="input" type="number" defaultValue={60} /></Field>
              </div>
              <label className="check"><input type="checkbox" defaultChecked={selNode.data.kind === 'filter'} />완료 후 검토 지점(gate) 설정</label>
              <div className="divider" style={{ margin: 0 }} />
              <dl className="kv" style={{ gridTemplateColumns: '64px 1fr', margin: 0 }}>
                <dt>노드 ID</dt><dd className="mono">{selNode.id}</dd>
                <dt>선행</dt><dd className="mono">{edges.filter(x => x.target === selNode.id).map(x => x.source).join(', ') || '-'}</dd>
                <dt>후행</dt><dd className="mono">{edges.filter(x => x.source === selNode.id).map(x => x.target).join(', ') || '-'}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>

      {judge === 'valid' && (
        <Modal title="유효성 검사" onClose={() => setJudge(null)}>
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>항목</th><th>결과</th></tr></thead>
            <tbody>
              {checks.map(([k, ok], i) => (
                <tr key={k}>
                  <td className="no">{i + 1}</td>
                  <td>{k}</td>
                  <td><span className={'badge ' + (ok ? 'ok' : 'warn')}>{ok ? '통과' : '확인 필요'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {judge === 'term' && (
        <Modal title="용어 일관성" onClose={() => setJudge(null)}>
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>정형 Stage</th><th>DAG 노드</th><th>결과</th></tr></thead>
            <tbody>
              {terms.map(([a, b], i) => (
                <tr key={a}>
                  <td className="no">{i + 1}</td>
                  <td className="mono">{a}</td>
                  <td>{b}</td>
                  <td><span className="badge ok">일치</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {saveOpen && (
        <Modal title="템플릿 저장" onClose={() => setSaveOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setSaveOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => {
              /* 관리자가 아니면 공용으로 저장되지 않게 한 번 더 막는다. */
              const scope = isAdmin ? saveScope : 'personal'
              tplStore.add({
                id: `tpl_new_${Date.now()}`,
                name: saveName.trim() || '이름 없는 템플릿',
                desc: saveDesc.trim() || '설명이 없습니다.',
                scope: scope,
                owner: scope === 'shared' ? '박운영' : '김연구',
                base: 'stability',
                nodes: nodes.length,
                used: 0,
                updated: new Date().toISOString().slice(0, 10),
                category: scope === 'shared' ? '안정화' : undefined,
              })
              setSaveOpen(false)
              setTplTab(scope)
              onToast(scope === 'shared' ? '공용 템플릿으로 등록됨' : '내 워크플로로 저장됨')
            }}>저장</button>
          </>}>
          <Field label="템플릿 이름">
            <input className="input" value={saveName} onChange={e => setSaveName(e.target.value)} />
          </Field>
          <Field label="설명">
            <textarea className="input" rows={3} value={saveDesc} onChange={e => setSaveDesc(e.target.value)} />
          </Field>
          {/* 공용 등록은 관리자만 하므로 다른 역할에는 저장 위치 선택을 보이지 않고 내 워크플로로 저장한다. */}
          {isAdmin && (
            <Field label="저장 위치" hint={saveScope === 'shared'
              ? '모든 연구자가 쓸 수 있습니다.'
              : '나만 보이고 나만 고칠 수 있습니다.'}>
              <select className="input" value={saveScope}
                onChange={e => setSaveScope(e.target.value as 'shared' | 'personal')}>
                <option value="personal">내 워크플로</option>
                <option value="shared">공용</option>
              </select>
            </Field>
          )}
          <label className="check"><input type="checkbox" defaultChecked />현재 파라미터 값 포함</label>
        </Modal>
      )}

      {tplOpen && (
        <Modal title="템플릿 불러오기" onClose={() => setTplOpen(false)}>
          <Seg items={[
            { key: 'shared' as const, label: `공용 (${shared.length})` },
            { key: 'personal' as const, label: `내 워크플로 (${mine.length})` },
          ]} value={tplTab} onChange={setTplTab} />
          <div className="col" style={{ gap: 10 }}>
            {(tplTab === 'shared' ? shared : mine).map(t => (
              <div key={t.id} className="pipe-card" onClick={() => loadTpl(t)}>
                <div className="row">
                  {t.scope === 'shared'
                    ? <span className="badge brand">{t.category}</span>
                    : <span className="badge accent">내 워크플로</span>}
                  <div className="sp" />
                  <span className="faint">노드 {t.nodes} · 사용 {t.used}회</span>
                </div>
                <h4>{t.name}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

    </>
  )
}

export default function DagStudio({ onToast }: { onToast: (m: string) => void }) {
  return (
    <ReactFlowProvider>
      <Studio onToast={onToast} />
    </ReactFlowProvider>
  )
}
