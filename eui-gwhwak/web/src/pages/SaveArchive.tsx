import { useMemo, useState } from 'react'
import { CHANGE_COLOR, GROUPS, INITIAL_AUDIT, INITIAL_DOCS, type AuditLog, type ChangeType, type Group, type Meta, type SaveDoc, type Visibility } from '../data/save'
import { ROLE_LABEL, useApp } from '../context'
import { Modal, PageHead, Tabs } from '../components/ui'

type Tab = 'versions' | 'timeline' | 'lineage' | 'diff' | 'audit'
type Policy = 'latest' | 'all'

const VIS_BADGE: Record<Visibility, string> = { 공개: 'badge-ok', 내부공개: 'badge-warn', 비공개: 'badge-danger' }
const UNGROUPED: Group = { id: '', name: '미분류 (그룹 해제됨)', category: '-' }

function recomputeLatest(docs: SaveDoc[], groupId: string): SaveDoc[] {
  const inGroup = docs.filter(d => d.groupId === groupId)
  if (!inGroup.length || inGroup.some(d => d.latestManual)) return docs
  const newest = [...inGroup].sort((a, b) => b.revisedAt.localeCompare(a.revisedAt))[0]
  return docs.map(d => d.groupId === groupId ? { ...d, isLatest: d.id === newest.id } : d)
}

export default function SaveArchive() {
  const { role, toast } = useApp()
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [audit, setAudit] = useState(INITIAL_AUDIT)
  const [policy, setPolicy] = useState<Policy>('latest')
  const [groupId, setGroupId] = useState('g-covid')
  const [tab, setTab] = useState<Tab>('versions')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<SaveDoc | null>(null)
  const [uploading, setUploading] = useState(false)

  const canSee = (d: SaveDoc) =>
    role === 'admin' ? true
      : role === 'staff' ? d.visibility !== '비공개'
        : d.visibility === '공개' && (policy === 'all' || d.isLatest)
  const visible = docs.filter(canSee)

  const log = (docId: string, field: string, before: string, after: string) =>
    setAudit(a => [{ id: Date.now() + Math.random(), at: nowStr(), user: role === 'admin' ? '관리자(송규리)' : '정동석', docId, field, before, after }, ...a])

  const groups = useMemo(() => {
    const all = docs.some(d => d.groupId === '') ? [...GROUPS, UNGROUPED] : GROUPS
    const term = q.trim()
    return all
      .map(g => ({ g, items: visible.filter(d => d.groupId === g.id) }))
      .filter(({ g, items }) => items.length && (!term || g.name.includes(term) || items.some(d => d.title.includes(term) || d.keywords.some(k => k.includes(term)))))
  }, [docs, visible, q])

  const group = [...GROUPS, UNGROUPED].find(g => g.id === groupId)!
  const groupDocs = visible.filter(d => d.groupId === groupId).sort((a, b) => a.order - b.order)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'versions', label: `버전 목록 (${groupDocs.length})` },
    ...(role !== 'public' ? [{ id: 'timeline' as Tab, label: '타임라인' }, { id: 'diff' as Tab, label: '메타데이터 비교' }] : []),
    { id: 'lineage', label: '계보 그래프' },
    ...(role === 'admin' ? [{ id: 'audit' as Tab, label: `감사 로그 (${audit.length})` }] : []),
  ]
  const curTab = tabs.some(t => t.id === tab) ? tab : 'versions'

  const update = (id: string, patch: Partial<SaveDoc>, logs: [string, string, string][]) => {
    setDocs(ds => {
      let next = ds.map(d => d.id === id ? { ...d, ...patch } : d)
      const target = next.find(d => d.id === id)!
      if ('revisedAt' in patch) next = recomputeLatest(next, target.groupId)
      return next
    })
    logs.forEach(([f, b, a]) => log(id, f, b, a))
  }

  const moveGroup = (d: SaveDoc, to: string) => {
    setDocs(ds => {
      const maxOrder = Math.max(0, ...ds.filter(x => x.groupId === to).map(x => x.order))
      let next = ds.map(x => x.id === d.id ? { ...x, groupId: to, order: maxOrder + 1, isLatest: false, latestManual: false } : x)
      next = recomputeLatest(recomputeLatest(next, d.groupId), to)
      return next
    })
    log(d.id, '버전그룹', groupName(d.groupId), groupName(to))
    toast(to ? `'${groupName(to)}' 그룹으로 이동했습니다.` : '그룹에서 제거했습니다.')
  }

  const reorder = (fromId: string, toId: string) => {
    const ids = groupDocs.map(d => d.id)
    const from = ids.indexOf(fromId), to = ids.indexOf(toId)
    if (from < 0 || to < 0 || from === to) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    setDocs(ds => ds.map(d => ids.includes(d.id) ? { ...d, order: ids.indexOf(d.id) + 1 } : d))
    log(fromId, '정렬순서', String(from + 1), String(to + 1))
  }

  const setLatest = (d: SaveDoc) => {
    setDocs(ds => ds.map(x => x.groupId === d.groupId ? { ...x, isLatest: x.id === d.id, latestManual: true } : x))
    log(d.id, '최신판', 'false', 'true (수동지정)')
    toast('최신판으로 수동 지정했습니다.')
  }
  const resetLatest = () => {
    setDocs(ds => recomputeLatest(ds.map(x => x.groupId === groupId ? { ...x, latestManual: false } : x), groupId))
    toast('개정일자 기준 자동 판정으로 전환했습니다.')
  }

  return (
    <>
      <PageHead title="질병재난 아카이브 (SAVE)" desc="감염병·재난 대응지침의 버전 이력과 문서 계보를 관리합니다. 업로드 파일은 읽기 전용으로 보존됩니다." reqs={['SFR-02', 'DAR-12']}>
        {role === 'admin' && (
          <div className="card row" style={{ padding: '8px 12px', gap: 10 }}>
            <span className="small" style={{ fontWeight: 700 }}>대국민 노출 정책</span>
            <div className="row" role="radiogroup" aria-label="대국민 노출 정책" style={{ gap: 4 }}>
              {(['latest', 'all'] as Policy[]).map(p => (
                <button key={p} className="chip" role="radio" aria-checked={policy === p} aria-pressed={policy === p}
                  onClick={() => { if (policy !== p) { setPolicy(p); log('-', '대국민노출정책', policy === 'latest' ? '최종판만' : '전체', p === 'latest' ? '최종판만' : '전체'); toast('대국민 노출 정책을 변경했습니다.') } }}>
                  {p === 'latest' ? '최종판만' : '전체 버전'}
                </button>
              ))}
            </div>
          </div>
        )}
      </PageHead>

      {role === 'public' && (
        <div className="card card-pad small" style={{ marginBottom: 16, background: 'var(--c-primary-weak)', borderColor: 'transparent' }}>
          공개 지정된 자료만 조회됩니다. 현재 노출 정책: <b>{policy === 'latest' ? '최종판만 공개' : '전체 버전 공개'}</b>
        </div>
      )}
      {role === 'staff' && (
        <div className="card card-pad small row" style={{ marginBottom: 16, background: 'var(--c-accent-weak)', borderColor: 'transparent' }}>
          <span>🔐 내부망 IP 자동 인증 · SSO 로그인됨 ({ROLE_LABEL[role]})</span><span className="spacer" />
          <span className="muted">공개 + 내부공개 자료 열람 가능</span>
        </div>
      )}

      <div className="save-layout">
        <aside className="card" aria-label="버전 그룹">
          <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
            <input className="input" placeholder="의미 기반 검색 (예: 접촉자, 요양시설)" value={q} onChange={e => setQ(e.target.value)} aria-label="아카이브 검색" />
            <div className="xs muted" style={{ marginTop: 6 }}>SAVE 전용 벡터 인덱스 · 최신 자료 우선 노출</div>
          </div>
          {groups.map(({ g, items }) => {
            const latest = items.find(d => d.isLatest)
            return (
              <button key={g.id || 'none'} className={`group-item ${g.id === groupId ? 'active' : ''}`} onClick={() => setGroupId(g.id)}>
                <div className="xs muted">{g.category}</div>
                <div className="t">{g.name}</div>
                <div className="row xs muted" style={{ marginTop: 4 }}>
                  <span>{items.length}개 버전</span>
                  {latest && <span className="badge badge-ok" style={{ fontSize: 11 }}>최신 v{latest.version}</span>}
                  {latest?.changeType === '폐지' && <span className="badge badge-danger" style={{ fontSize: 11 }}>폐지</span>}
                </div>
              </button>
            )
          })}
          {!groups.length && <div className="empty small">검색 결과가 없습니다.</div>}
        </aside>

        <section className="card" aria-label="그룹 상세">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="xs muted">{group.category}</div>
              <h2 style={{ fontSize: 18 }}>{group.name}</h2>
            </div>
            <span className="spacer" />
            {role === 'admin' && groupDocs.some(d => d.latestManual) && <button className="btn btn-sm" onClick={resetLatest}>최신판 자동판정으로</button>}
            {role === 'admin' && group.id && <button className="btn btn-primary btn-sm" onClick={() => setUploading(true)}>＋ 신규 버전 업로드</button>}
          </div>
          <Tabs value={curTab} onChange={setTab} items={tabs} />
          <div style={{ padding: 16 }}>
            {curTab === 'versions' && (
              <VersionList docs={groupDocs} role={role} onReorder={reorder} onEdit={setEditing}
                onVisibility={(d, v) => update(d.id, { visibility: v }, [['공개상태', d.visibility, v]])}
                onSetLatest={setLatest} onMove={moveGroup}
                onVerify={d => toast(`무결성 검증 완료 ✓ SHA-256 일치 (${d.hash.slice(0, 12)}…)`)} />
            )}
            {curTab === 'timeline' && <Timeline docs={groupDocs} all={docs} />}
            {curTab === 'lineage' && <Lineage all={visible} groupId={groupId} onPick={g => setGroupId(g)} />}
            {curTab === 'diff' && <Diff docs={groupDocs} />}
            {curTab === 'audit' && <Audit logs={audit} docs={docs} />}
          </div>
        </section>
      </div>

      {editing && (
        <MetaEditor doc={editing} onClose={() => setEditing(null)}
          onSave={(m) => {
            const changes = metaChanges(editing, m)
            if (!changes.length) { setEditing(null); return }
            update(editing.id, { ...m, metaHistory: [...editing.metaHistory, pickMeta(editing)] }, changes)
            toast('메타데이터를 저장했습니다. (감사 로그 기록)')
            setEditing(null)
          }}
          onRollback={() => {
            const prev = editing.metaHistory[editing.metaHistory.length - 1]
            update(editing.id, { ...prev, metaHistory: editing.metaHistory.slice(0, -1) }, metaChanges(editing, prev).map(([f, b, a]) => [`${f} (롤백)`, b, a]))
            toast('이전 메타데이터 상태로 롤백했습니다.')
            setEditing(null)
          }} />
      )}
      {uploading && (
        <UploadModal group={group} docs={docs.filter(d => d.groupId === groupId)} onClose={() => setUploading(false)}
          onUpload={(nd) => {
            setDocs(ds => recomputeLatest([...ds, nd], nd.groupId))
            log(nd.id, '신규 버전 업로드', '-', `v${nd.version} (${nd.changeType})`)
            toast(`v${nd.version} 업로드 완료 · 해시 보존됨 · 읽기 전용 저장`)
            setUploading(false)
          }} />
      )}
    </>
  )
}

function VersionList({ docs, role, onReorder, onEdit, onVisibility, onSetLatest, onMove, onVerify }: {
  docs: SaveDoc[]; role: string
  onReorder: (from: string, to: string) => void
  onEdit: (d: SaveDoc) => void
  onVisibility: (d: SaveDoc, v: Visibility) => void
  onSetLatest: (d: SaveDoc) => void
  onMove: (d: SaveDoc, to: string) => void
  onVerify: (d: SaveDoc) => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const admin = role === 'admin'
  if (!docs.length) return <div className="empty">표시할 자료가 없습니다.</div>
  return (
    <div className="stack" style={{ gap: 8 }}>
      {admin && <div className="xs muted">⠿ 핸들을 드래그하거나 순서 번호를 입력해 그룹 내 정렬 순서를 조정할 수 있습니다.</div>}
      {docs.map((d, i) => (
        <div key={d.id}>
          <div className={`version-row ${dragId === d.id ? 'dragging' : ''} ${overId === d.id && dragId !== d.id ? 'drag-over' : ''}`}
            draggable={admin}
            onDragStart={() => setDragId(d.id)}
            onDragOver={e => { e.preventDefault(); setOverId(d.id) }}
            onDragEnd={() => { setDragId(null); setOverId(null) }}
            onDrop={() => { dragId && onReorder(dragId, d.id); setDragId(null); setOverId(null) }}
            style={!admin ? { gridTemplateColumns: '64px minmax(0,1fr) auto' } : undefined}>
            {admin && <span className="drag-handle" aria-hidden title="드래그하여 이동">⠿</span>}
            {admin ? (
              <input className="input" type="number" min={1} max={docs.length} defaultValue={i + 1} key={`${d.id}-${i}`}
                aria-label={`${d.title} 정렬 순서`} style={{ padding: '4px 8px', width: 60 }}
                onKeyDown={e => { if (e.key === 'Enter') { const n = +(e.target as HTMLInputElement).value; if (docs[n - 1]) onReorder(d.id, docs[n - 1].id) } }}
                onBlur={e => { const n = +e.target.value; if (docs[n - 1] && n !== i + 1) onReorder(d.id, docs[n - 1].id) }} />
            ) : <span className="badge" style={{ justifyContent: 'center' }}>v{d.version}</span>}
            <div style={{ minWidth: 0 }}>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="badge" style={{ background: CHANGE_COLOR[d.changeType], color: '#fff', borderColor: 'transparent' }}>{d.changeType}</span>
                {d.isLatest && <span className="badge badge-ok">★ 최신판{d.latestManual ? ' (수동)' : ''}</span>}
                <span className={`badge ${VIS_BADGE[d.visibility]}`}>{d.visibility}</span>
                <span className="badge" title="읽기 전용 보존">🔒 읽기전용</span>
              </div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{d.title}</div>
              <div className="xs muted">개정 {d.revisedAt} · {d.dept} · {d.fileName} ({d.size})</div>
            </div>
            <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-sm">열람</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setOpenId(openId === d.id ? null : d.id)} aria-expanded={openId === d.id}>상세 {openId === d.id ? '▲' : '▼'}</button>
            </div>
          </div>
          {openId === d.id && (
            <div className="card-pad" style={{ border: '1px solid var(--line)', borderTop: 0, borderRadius: '0 0 10px 10px', margin: '0 8px', background: 'var(--surface-2)' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
                <div>
                  <div className="xs muted" style={{ fontWeight: 700 }}>SHA-256 해시 (업로드 시 자동 추출)</div>
                  <div className="hash" style={{ marginTop: 4 }}>{d.hash}</div>
                  <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => onVerify(d)}>무결성 검증</button>
                </div>
                <div className="small">
                  <div className="xs muted" style={{ fontWeight: 700 }}>키워드</div>
                  <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>{d.keywords.map(k => <span key={k} className="badge">{k}</span>)}</div>
                  <div className="xs muted" style={{ fontWeight: 700, marginTop: 10 }}>업로드</div>
                  <div>{d.uploadedAt} · {d.uploader}</div>
                </div>
                {admin && (
                  <div className="stack" style={{ gap: 8 }}>
                    <label className="field">공개 상태
                      <select className="select" value={d.visibility} onChange={e => onVisibility(d, e.target.value as Visibility)}>
                        {(['공개', '내부공개', '비공개'] as Visibility[]).map(v => <option key={v}>{v}</option>)}
                      </select>
                    </label>
                    <label className="field">버전 그룹 재배정
                      <select className="select" value={d.groupId} onChange={e => onMove(d, e.target.value)}>
                        {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        <option value="">그룹에서 제거</option>
                      </select>
                    </label>
                    <div className="row wrap">
                      <button className="btn btn-sm" onClick={() => onEdit(d)}>메타데이터 수정</button>
                      {!d.isLatest && <button className="btn btn-sm" onClick={() => onSetLatest(d)}>최신판 지정</button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Timeline({ docs, all }: { docs: SaveDoc[]; all: SaveDoc[] }) {
  const sorted = [...docs].sort((a, b) => b.revisedAt.localeCompare(a.revisedAt))
  const title = (id: string) => all.find(d => d.id === id)?.title ?? id
  return (
    <div className="timeline">
      {sorted.map(d => (
        <div key={d.id} className="tl-item" style={{ color: CHANGE_COLOR[d.changeType] }}>
          <span className="tl-dot" />
          <div style={{ color: 'var(--text)' }}>
            <div className="row wrap" style={{ gap: 8 }}>
              <b className="mono" style={{ color: 'var(--text-2)' }}>{d.revisedAt}</b>
              <span className="badge" style={{ background: CHANGE_COLOR[d.changeType], color: '#fff', borderColor: 'transparent' }}>{d.changeType}</span>
              {d.isLatest && <span className="badge badge-ok">최신판</span>}
            </div>
            <div style={{ fontWeight: 700 }}>{d.title}</div>
            {d.relations.map(r => <div key={r.to} className="xs muted">↳ {r.type}: {title(r.to)}</div>)}
          </div>
        </div>
      ))}
    </div>
  )
}

function Lineage({ all, groupId, onPick }: { all: SaveDoc[]; groupId: string; onPick: (g: string) => void }) {
  const [scope, setScope] = useState<'related' | 'all'>('related')
  const [hover, setHover] = useState<string | null>(null)

  const nodes = useMemo(() => {
    if (scope === 'all') return all
    // 선택 그룹과 연결된 컴포넌트만
    const ids = new Set(all.filter(d => d.groupId === groupId).map(d => d.id))
    let changed = true
    while (changed) {
      changed = false
      for (const d of all) for (const r of d.relations) {
        if (ids.has(d.id) !== ids.has(r.to) && all.some(x => x.id === r.to)) { ids.add(d.id); ids.add(r.to); changed = true }
      }
    }
    return all.filter(d => ids.has(d.id))
  }, [all, groupId, scope])

  const lanes = [...new Set(nodes.map(n => n.groupId))]
  const sorted = [...nodes].sort((a, b) => a.revisedAt.localeCompare(b.revisedAt))
  // 열 = 계보 깊이(상위 문서로부터의 최장 경로), 행 = 버전 그룹
  const depth = new Map<string, number>()
  for (const n of sorted) {
    const parents = n.relations.map(r => depth.get(r.to)).filter((d): d is number => d !== undefined)
    let d = parents.length ? Math.max(...parents) + 1 : 0
    while (sorted.some(o => o.id !== n.id && o.groupId === n.groupId && depth.get(o.id) === d)) d++
    depth.set(n.id, d)
  }
  const cols = Math.max(...depth.values(), 0) + 1
  const NW = 138, NH = 54, GX = 32, GY = 40, PX = 20, PY = 30
  const pos = new Map(sorted.map(n => [n.id, { x: PX + depth.get(n.id)! * (NW + GX), y: PY + lanes.indexOf(n.groupId) * (NH + GY) }]))
  const W = PX * 2 + cols * (NW + GX) - GX
  const H = PY * 2 + lanes.length * (NH + GY) - GY + 10
  const edges = nodes.flatMap(n => n.relations.filter(r => pos.has(r.to)).map(r => ({ from: r.to, to: n.id, type: r.type })))
  const related = (id: string) => !hover || id === hover || edges.some(e => (e.from === hover && e.to === id) || (e.to === hover && e.from === id))

  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 4 }}>
          <button className="chip" aria-pressed={scope === 'related'} onClick={() => setScope('related')}>선택 그룹 계보</button>
          <button className="chip" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>전체 아카이브</button>
        </div>
        <span className="spacer" />
        <div className="row wrap xs" style={{ gap: 12 }}>
          {(Object.keys(CHANGE_COLOR) as ChangeType[]).map(t => (
            <span key={t} className="row" style={{ gap: 5 }}><span style={{ width: 14, height: 3, background: CHANGE_COLOR[t], borderRadius: 2 }} />{t}</span>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface-2)' }}>
        <svg className="lineage-svg" width={W} height={H} role="img" aria-label="문서 계보 그래프">
          <defs>
            {(Object.keys(CHANGE_COLOR) as ChangeType[]).map(t => (
              <marker key={t} id={`arr-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={CHANGE_COLOR[t]} />
              </marker>
            ))}
          </defs>
          {lanes.map((g, i) => (
            <text key={g} x={6} y={PY + i * (NH + GY) - 8} fontSize="11" fill="var(--text-3)" fontWeight="700">{groupName(g)}</text>
          ))}
          {edges.map(e => {
            const a = pos.get(e.from)!, b = pos.get(e.to)!
            const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2
            const mx = (x1 + x2) / 2
            const dim = hover && !(e.from === hover || e.to === hover)
            return (
              <g key={`${e.from}-${e.to}`} opacity={dim ? 0.15 : 1}>
                <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`} fill="none" stroke={CHANGE_COLOR[e.type]} strokeWidth={2}
                  strokeDasharray={e.type === '참조' ? '5 4' : undefined} markerEnd={`url(#arr-${e.type})`} />
                {(y1 !== y2 || e.type !== '개정') && (
                  <text x={mx} y={(y1 + y2) / 2 - 5} fontSize="10.5" textAnchor="middle" fill={CHANGE_COLOR[e.type]} fontWeight="700"
                    stroke="var(--surface-2)" strokeWidth={3} paintOrder="stroke">{e.type}</text>
                )}
              </g>
            )
          })}
          {sorted.map(n => {
            const p = pos.get(n.id)!
            return (
              <g key={n.id} transform={`translate(${p.x},${p.y})`} opacity={related(n.id) ? 1 : 0.25} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick(n.groupId)}
                tabIndex={0} role="button" aria-label={`${n.title}, ${n.changeType}, ${n.revisedAt}`} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}>
                <rect width={NW} height={NH} rx={8} fill="var(--surface)" stroke={n.groupId === groupId ? 'var(--c-primary)' : 'var(--line-strong)'} strokeWidth={n.groupId === groupId ? 2 : 1} />
                <rect width={5} height={NH} rx={2} fill={CHANGE_COLOR[n.changeType]} />
                <text x={14} y={20} fontSize="12.5" fontWeight="700" fill="var(--text)">{shortTitle(n)}</text>
                <text x={14} y={38} fontSize="11" fill="var(--text-3)">{n.revisedAt} · {n.changeType}</text>
                {n.isLatest && <text x={NW - 10} y={20} fontSize="13" textAnchor="end" fill="var(--c-ok)">★</text>}
                {n.visibility !== '공개' && <text x={NW - 10} y={40} fontSize="10" textAnchor="end" fill="var(--c-warn)">{n.visibility}</text>}
                <title>{n.title}</title>
              </g>
            )
          })}
        </svg>
      </div>
      <p className="xs muted" style={{ marginTop: 8 }}>노드에 마우스를 올리면 직접 연결된 문서만 강조됩니다. 클릭 시 해당 버전 그룹으로 이동합니다.</p>
    </div>
  )
}

function Diff({ docs }: { docs: SaveDoc[] }) {
  const sorted = [...docs].sort((a, b) => a.revisedAt.localeCompare(b.revisedAt))
  const [aId, setA] = useState(sorted[sorted.length - 2]?.id ?? sorted[0]?.id)
  const [bId, setB] = useState(sorted[sorted.length - 1]?.id)
  const a = docs.find(d => d.id === aId), b = docs.find(d => d.id === bId)
  if (docs.length < 2) return <div className="empty">비교하려면 2개 이상의 버전이 필요합니다.</div>
  const rows: [string, (d: SaveDoc) => string][] = [
    ['제목', d => d.title], ['버전', d => d.version], ['개정일자', d => d.revisedAt], ['부서', d => d.dept],
    ['변경유형', d => d.changeType], ['공개상태', d => d.visibility], ['파일', d => `${d.fileName} (${d.size})`], ['해시', d => d.hash.slice(0, 24) + '…'],
  ]
  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <select className="select" style={{ width: 'auto' }} value={aId} onChange={e => setA(e.target.value)} aria-label="비교 기준 버전">
          {sorted.map(d => <option key={d.id} value={d.id}>v{d.version} · {d.revisedAt}</option>)}
        </select>
        <span>↔</span>
        <select className="select" style={{ width: 'auto' }} value={bId} onChange={e => setB(e.target.value)} aria-label="비교 대상 버전">
          {sorted.map(d => <option key={d.id} value={d.id}>v{d.version} · {d.revisedAt}</option>)}
        </select>
        <span className="spacer" />
        <span className="xs muted"><span className="badge badge-danger">이전</span> <span className="badge badge-ok">변경</span> 강조 표시</span>
      </div>
      {a && b && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table diff-table" style={{ border: '1px solid var(--line)' }}>
            <thead><tr><th style={{ width: 110 }}>항목</th><th>v{a.version}</th><th>v{b.version}</th></tr></thead>
            <tbody>
              {rows.map(([k, f]) => {
                const changed = f(a) !== f(b)
                return (
                  <tr key={k}>
                    <th style={{ background: 'var(--surface-2)' }}>{k}{changed && ' •'}</th>
                    <td className={changed ? 'old' : ''}>{f(a)}</td>
                    <td className={changed ? 'new' : ''}>{f(b)}</td>
                  </tr>
                )
              })}
              <tr>
                <th style={{ background: 'var(--surface-2)' }}>키워드</th>
                <td><div className="row wrap" style={{ gap: 4 }}>{a.keywords.map(k => <span key={k} className={`badge ${b.keywords.includes(k) ? '' : 'badge-danger'}`}>{b.keywords.includes(k) ? k : `− ${k}`}</span>)}</div></td>
                <td><div className="row wrap" style={{ gap: 4 }}>{b.keywords.map(k => <span key={k} className={`badge ${a.keywords.includes(k) ? '' : 'badge-ok'}`}>{a.keywords.includes(k) ? k : `+ ${k}`}</span>)}</div></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Audit({ logs, docs }: { logs: AuditLog[]; docs: SaveDoc[] }) {
  const [f, setF] = useState('')
  const list = logs.filter(l => !f || l.field.includes(f) || l.user.includes(f) || l.docId.includes(f))
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="항목·사용자 필터" value={f} onChange={e => setF(e.target.value)} aria-label="감사 로그 필터" />
        <span className="spacer" />
        <button className="btn btn-sm">CSV 내보내기</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>일시</th><th>사용자</th><th>대상 문서</th><th>항목</th><th>변경 전</th><th>변경 후</th></tr></thead>
          <tbody>
            {list.map(l => (
              <tr key={l.id}>
                <td className="mono">{l.at}</td>
                <td>{l.user}</td>
                <td className="small">{docs.find(d => d.id === l.docId)?.title ?? (l.docId === '-' ? '시스템 설정' : l.docId)}</td>
                <td><span className="badge badge-blue">{l.field}</span></td>
                <td className="small" style={{ color: 'var(--c-danger)' }}>{l.before}</td>
                <td className="small" style={{ color: 'var(--c-ok)' }}>{l.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs muted" style={{ marginTop: 8 }}>메타데이터·공개상태·최신판·정렬·그룹 변경은 자동으로 기록되며 삭제할 수 없습니다.</p>
    </div>
  )
}

function MetaEditor({ doc, onClose, onSave, onRollback }: { doc: SaveDoc; onClose: () => void; onSave: (m: Meta) => void; onRollback: () => void }) {
  const [m, setM] = useState<Meta>(pickMeta(doc))
  const prev = doc.metaHistory[doc.metaHistory.length - 1]
  return (
    <Modal title="메타데이터 수정" onClose={onClose}
      footer={<>
        {prev && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onRollback}>↶ 이전 상태로 롤백</button>}
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(m)}>저장</button>
      </>}>
      <div className="stack">
        <div className="small muted">파일 본문은 읽기 전용입니다. 내용 수정이 필요한 경우 신규 버전으로 재업로드하세요.</div>
        <label className="field">제목<input className="input" value={m.title} onChange={e => setM({ ...m, title: e.target.value })} /></label>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="field">버전<input className="input" value={m.version} onChange={e => setM({ ...m, version: e.target.value })} /></label>
          <label className="field">개정일자<input className="input" type="date" value={m.revisedAt} onChange={e => setM({ ...m, revisedAt: e.target.value })} /></label>
        </div>
        <label className="field">부서<input className="input" value={m.dept} onChange={e => setM({ ...m, dept: e.target.value })} /></label>
        <label className="field">키워드 (쉼표 구분)<input className="input" value={m.keywords.join(', ')} onChange={e => setM({ ...m, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
        <label className="field">변경유형
          <select className="select" value={m.changeType} onChange={e => setM({ ...m, changeType: e.target.value as ChangeType })}>
            {(Object.keys(CHANGE_COLOR) as ChangeType[]).map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        {prev && <div className="xs muted">롤백 가능한 이전 상태 {doc.metaHistory.length}건 보존됨</div>}
      </div>
    </Modal>
  )
}

function UploadModal({ group, docs, onClose, onUpload }: { group: Group; docs: SaveDoc[]; onClose: () => void; onUpload: (d: SaveDoc) => void }) {
  const latest = docs.find(d => d.isLatest) ?? docs[docs.length - 1]
  const [file, setFile] = useState<File | null>(null)
  const [hash, setHash] = useState('')
  const [hashing, setHashing] = useState(false)
  const nextVer = latest ? String((parseInt(latest.version) || 0) + 1) : '1'
  const [m, setM] = useState<Meta>({
    title: latest ? latest.title.replace(/제?\d+판/, `제${nextVer}판`) : group.name,
    version: nextVer, dept: latest?.dept ?? '', keywords: latest?.keywords ?? [], changeType: '개정',
    revisedAt: new Date().toISOString().slice(0, 10),
  })
  const [parent, setParent] = useState(latest?.id ?? '')
  const [vis, setVis] = useState<Visibility>('내부공개')

  const onFile = async (f: File | null) => {
    setFile(f); setHash('')
    if (!f) return
    setHashing(true)
    const buf = await f.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    setHash([...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join(''))
    setHashing(false)
  }

  return (
    <Modal title={`신규 버전 업로드 — ${group.name}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>취소</button>
        <button className="btn btn-primary" disabled={!file || !hash} onClick={() => onUpload({
          ...m, id: `up-${Date.now()}`, groupId: group.id, order: docs.length + 1, visibility: vis, isLatest: false,
          fileName: file!.name, size: `${(file!.size / 1024 / 1024).toFixed(2)}MB`, hash, uploadedAt: m.revisedAt, uploader: '관리자',
          relations: parent && m.changeType !== '원본' ? [{ to: parent, type: m.changeType as Exclude<ChangeType, '원본'> }] : [], metaHistory: [],
        })}>업로드 (읽기 전용 저장)</button></>}>
      <div className="stack">
        <label className="field">지침 파일 (PDF·HWP)
          <input className="input" type="file" accept=".pdf,.hwp,.hwpx,.docx" onChange={e => onFile(e.target.files?.[0] ?? null)} />
        </label>
        {(hashing || hash) && (
          <div>
            <div className="xs muted" style={{ fontWeight: 700 }}>SHA-256 해시 자동 추출 {hashing ? '중…' : '완료 ✓'}</div>
            {hash && <div className="hash" style={{ marginTop: 4 }}>{hash}</div>}
          </div>
        )}
        <label className="field">제목<input className="input" value={m.title} onChange={e => setM({ ...m, title: e.target.value })} /></label>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <label className="field">버전<input className="input" value={m.version} onChange={e => setM({ ...m, version: e.target.value })} /></label>
          <label className="field">개정일자<input className="input" type="date" value={m.revisedAt} onChange={e => setM({ ...m, revisedAt: e.target.value })} /></label>
          <label className="field">공개상태
            <select className="select" value={vis} onChange={e => setVis(e.target.value as Visibility)}>
              {(['공개', '내부공개', '비공개'] as Visibility[]).map(v => <option key={v}>{v}</option>)}
            </select>
          </label>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <label className="field">변경유형
            <select className="select" value={m.changeType} onChange={e => setM({ ...m, changeType: e.target.value as ChangeType })}>
              {(Object.keys(CHANGE_COLOR) as ChangeType[]).map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">관계 대상 문서
            <select className="select" value={parent} onChange={e => setParent(e.target.value)} disabled={m.changeType === '원본'}>
              {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </label>
        </div>
        <div className="xs muted">개정일자가 가장 최근인 버전이 최신판(is_latest)으로 자동 판정됩니다.</div>
      </div>
    </Modal>
  )
}

function pickMeta(d: SaveDoc): Meta {
  return { title: d.title, version: d.version, dept: d.dept, keywords: d.keywords, changeType: d.changeType, revisedAt: d.revisedAt }
}
function metaChanges(a: Meta, b: Meta): [string, string, string][] {
  const out: [string, string, string][] = []
  const fields: [keyof Meta, string][] = [['title', '제목'], ['version', '버전'], ['dept', '부서'], ['changeType', '변경유형'], ['revisedAt', '개정일자']]
  for (const [k, label] of fields) if (a[k] !== b[k]) out.push([label, String(a[k]), String(b[k])])
  if (a.keywords.join(', ') !== b.keywords.join(', ')) out.push(['키워드', a.keywords.join(', '), b.keywords.join(', ')])
  return out
}
function groupName(id: string) {
  return GROUPS.find(g => g.id === id)?.name ?? UNGROUPED.name
}
const SHORT: Record<string, string> = {
  'g-covid': '코로나19 지자체', 'g-covid-ltc': '감염취약시설', 'g-mpox': '엠폭스 대응',
  'g-mpox-hosp': '의료기관 엠폭스', 'g-flu': '신종인플루엔자', 'g-tb': '국가결핵관리',
}
function shortTitle(d: SaveDoc) {
  return `${SHORT[d.groupId] ?? '미분류'} v${d.version}`
}
function nowStr() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
