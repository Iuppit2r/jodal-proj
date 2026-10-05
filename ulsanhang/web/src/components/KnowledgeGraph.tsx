/** 항만 업무 지식그래프 예시: 챗봇 복합 답변에서 따라간 경로를 강조한다 */

type Kind = '요금' | '규정' | '선종' | '혜택' | '부서' | '절차'
interface Node { id: string; label: string; kind: Kind; x: number; y: number }

const NODES: Node[] = [
  { id: 'fee', label: '외항선 입항료', kind: '요금', x: 300, y: 150 },
  { id: 'rule12', label: '사용료 규정 제12조', kind: '규정', x: 110, y: 60 },
  { id: 'berthfee', label: '정박료', kind: '요금', x: 110, y: 245 },
  { id: 'liner', label: '정기 컨테이너선', kind: '선종', x: 500, y: 60 },
  { id: 'hazard', label: '위험물 운송선', kind: '선종', x: 500, y: 245 },
  { id: 'inc5', label: '인센티브 지침 제5조', kind: '규정', x: 700, y: 60 },
  { id: 'cut', label: '신규 항로 30% 감면', kind: '혜택', x: 890, y: 60 },
  { id: 'surcharge', label: '할증 적용', kind: '혜택', x: 700, y: 245 },
  { id: 'mkt', label: '마케팅팀', kind: '부서', x: 890, y: 165 },
  { id: 'ops', label: '항만운영팀', kind: '부서', x: 300, y: 255 },
  { id: 'entry', label: '입항 신고 절차', kind: '절차', x: 110, y: 150 },
]

const EDGES: { from: string; to: string; rel: string; hot?: boolean }[] = [
  { from: 'fee', to: 'rule12', rel: '근거', hot: true },
  { from: 'rule12', to: 'liner', rel: '적용 대상', hot: true },
  { from: 'liner', to: 'inc5', rel: '인센티브', hot: true },
  { from: 'inc5', to: 'cut', rel: '감면', hot: true },
  { from: 'inc5', to: 'mkt', rel: '담당' },
  { from: 'fee', to: 'berthfee', rel: '관련 요금' },
  { from: 'fee', to: 'hazard', rel: '선종별' },
  { from: 'hazard', to: 'surcharge', rel: '할증' },
  { from: 'fee', to: 'ops', rel: '담당' },
  { from: 'fee', to: 'entry', rel: '선행 절차' },
]

const TONE: Record<Kind, { fill: string; stroke: string; text: string }> = {
  요금: { fill: '#f2f5fc', stroke: '#c8d5ef', text: '#133274' },
  규정: { fill: '#ffffff', stroke: '#d7dce4', text: '#0f1626' },
  선종: { fill: '#ffffff', stroke: '#d7dce4', text: '#0f1626' },
  혜택: { fill: '#fff5ea', stroke: '#f6dcbc', text: '#c86f0c' },
  부서: { fill: '#f1f3f6', stroke: '#e1e5ec', text: '#5b6475' },
  절차: { fill: '#ffffff', stroke: '#d7dce4', text: '#0f1626' },
}

const W = 140
const H = 34
const byId = (id: string) => NODES.find((n) => n.id === id)!
const hotIds = new Set(EDGES.filter((e) => e.hot).flatMap((e) => [e.from, e.to]))

export default function KnowledgeGraph() {
  return (
    <div className="kg-graph">
      <svg viewBox="0 0 1000 300" role="img" aria-label="지식그래프 예시: 외항선 입항료에서 신규 항로 감면까지의 관계 경로">
        {EDGES.map((e) => {
          const a = byId(e.from), b = byId(e.to)
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
          return (
            <g key={e.from + e.to}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.hot ? '#1a4299' : '#d7dce4'} strokeWidth={e.hot ? 2 : 1.25} strokeDasharray={e.hot ? undefined : '4 4'} />
              <rect x={mx - 30} y={my - 10} width={60} height={20} rx={10} fill="#fff" stroke={e.hot ? '#c8d5ef' : '#e8ebf0'} />
              <text x={mx} y={my + 4} textAnchor="middle" fontSize="12" fill={e.hot ? '#1a4299' : '#9aa3b2'}>{e.rel}</text>
            </g>
          )
        })}
        {NODES.map((n) => {
          const t = TONE[n.kind]
          const hot = hotIds.has(n.id)
          return (
            <g key={n.id}>
              <rect x={n.x - W / 2} y={n.y - H / 2} width={W} height={H} rx={9} fill={n.id === 'cut' ? '#1a4299' : t.fill} stroke={hot ? '#1a4299' : t.stroke} strokeWidth={hot ? 1.5 : 1} />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fontWeight={600} fill={n.id === 'cut' ? '#fff' : t.text}>{n.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="legend kg-legend">
        <span><i className="line" style={{ background: '#1a4299' }} />챗봇이 복합 질문에 따라간 경로</span>
        <span><i style={{ background: '#f2f5fc', boxShadow: '0 0 0 1px #c8d5ef' }} />요금</span>
        <span><i style={{ background: '#fff', boxShadow: '0 0 0 1px #d7dce4' }} />규정 · 선종 · 절차</span>
        <span><i style={{ background: '#fff5ea', boxShadow: '0 0 0 1px #f6dcbc' }} />혜택 · 할증</span>
        <span><i style={{ background: '#f1f3f6', boxShadow: '0 0 0 1px #e1e5ec' }} />담당 부서</span>
      </div>
    </div>
  )
}
