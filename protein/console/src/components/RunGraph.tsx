import { useMemo } from 'react'
import {
  Background, BackgroundVariant, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider,
  type Edge, type Node, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Cpu, FileInput, FileText, Funnel, GitBranch, Merge, Wand2, type LucideIcon } from 'lucide-react'
import { State } from './ui'

/* 실행 중인 실행의 그래프. 읽기 전용이다.
   흐름 설계 화면과 노드 모양을 똑같이 써서 두 화면의 용어가 어긋나지 않게 한다.
   설계 화면에는 실행 상태가 없고, 여기에만 있다.

   정형 파이프라인은 단계가 한 줄로 이어지므로 왼쪽에서 오른쪽으로 흐르게 둔다.
   세로로 쌓으면 단계 수만큼 화면이 길어져 한눈에 안 들어온다. */

export type RunNodeKind = 'input' | 'model' | 'filter' | 'branch' | 'merge' | 'eval' | 'report'
export type RunNodeState = 'done' | 'running' | 'queued' | 'failed'

const KIND: Record<RunNodeKind, { color: string; soft: string; name: string; icon: LucideIcon }> = {
  input: { color: '#52525b', soft: '#f4f4f5', name: '입력', icon: FileInput },
  model: { color: '#4f46e5', soft: '#eef2ff', name: '모델 실행', icon: Cpu },
  filter: { color: '#b45309', soft: '#fffbeb', name: '필터', icon: Funnel },
  branch: { color: '#0284c7', soft: '#f0f9ff', name: '조건 분기', icon: GitBranch },
  merge: { color: '#7c3aed', soft: '#f5f3ff', name: '병합', icon: Merge },
  eval: { color: '#0d9488', soft: '#f0fdfa', name: '사용자 정의 평가', icon: Wand2 },
  report: { color: '#e11d48', soft: '#fff1f2', name: '보고서', icon: FileText },
}

type RunData = { kind: RunNodeKind; label: string; model?: string; state: RunNodeState; metric?: string }
type RunNode = Node<RunData, 'run'>

function RunNodeView({ data }: NodeProps<RunNode>) {
  const m = KIND[data.kind]
  const Icon = m.icon
  return (
    <div className={'dag-node row-flow state-' + data.state}>
      {data.kind !== 'input' && <Handle type="target" position={Position.Left} />}
      <div className="dag-node-h">
        <span className="ic" style={{ background: m.soft, color: m.color }}><Icon size={14} /></span>
        <span className="t">{data.label}</span>
      </div>
      <div className="dag-node-b">
        <span className="m">{data.metric ?? data.model ?? m.name}</span>
        <State s={data.state} />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const TYPES = { run: RunNodeView }

export function RunGraph({ nodes, edges, height = 520 }: {
  nodes: RunNode[]; edges: Edge[]; height?: number
}) {
  const styled = useMemo(() => edges.map(ed => {
    const src = nodes.find(x => x.id === ed.source)
    return {
      ...ed,
      animated: src?.data.state === 'running',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#a1a1aa' },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    }
  }), [edges, nodes])

  return (
    <div className="canvas" style={{ height, borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
      <ReactFlowProvider>
        <ReactFlow<RunNode, Edge>
          nodes={nodes}
          edges={styled}
          nodeTypes={TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          fitView
          fitViewOptions={{ padding: 0.06, maxZoom: 1 }}
          minZoom={0.3}
          maxZoom={1.4}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#d4d4d8" />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

/* 정형 파이프라인 실행의 그래프를 단계 목록에서 만든다. */
export function pipelineGraph(stages: { key: string; label: string; model?: string; state: RunNodeState; metric?: string }[]) {
  /* 제목이 이미 모델 이름이므로 아래줄에는 버전만 남긴다.
     proteinmpnn@1.0.1 처럼 통째로 쓰면 잘려서 버전을 못 읽는다. */
  const ver = (m?: string) => {
    if (!m) return m
    if (m.includes('@')) return 'v' + m.split('@')[1].replace(/^v/, '')
    const last = m.split(' ').pop() ?? m
    return /^v?[\d.]+$/.test(last) ? 'v' + last.replace(/^v/, '') : m
  }
  const nodes: RunNode[] = stages.map((s, i) => ({
    id: s.key,
    type: 'run',
    /* 가로용 노드 폭 156 + 간격 40 */
    position: { x: i * 196, y: 0 },
    data: {
      kind: i === 0 ? 'input' : s.key === 'soluprot' ? 'filter' : s.key === 'novelty' ? 'report' : 'model',
      label: s.label, model: ver(s.model), state: s.state, metric: s.metric,
    },
  }))
  const edges: Edge[] = stages.slice(1).map((s, i) => ({
    id: `${stages[i].key}-${s.key}`, source: stages[i].key, target: s.key,
  }))
  return { nodes, edges }
}
