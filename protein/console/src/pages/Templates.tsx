import { useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, Field, Modal, MoreMenu, PageHead, Seg } from '../components/ui'
import { tplStore, type WfTemplate } from '../data/templates'
import { useRole } from '../data/session'

/* 워크플로 템플릿 관리.
   공용은 관리자가 등록해 모두가 쓰고, 내 템플릿은 각자 만들어 쓴다.
   흐름 설계 화면에서 바로 불러올 수도 있지만, 모아서 관리하는 자리는 여기다. */
export default function Templates({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const role = useRole()
  const isAdmin = role === 'admin'
  const all = useSyncExternalStore(tplStore.subscribe, tplStore.all)
  const [tab, setTab] = useState<'shared' | 'personal'>('shared')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<WfTemplate | null>(null)
  const [drop, setDrop] = useState<WfTemplate | null>(null)

  const shared = all.filter(t => t.scope === 'shared')
  const mine = all.filter(t => t.scope === 'personal')
  const rows = (tab === 'shared' ? shared : mine)
    .filter(t => !q || (t.name + t.desc).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHead
        title="워크플로 템플릿"
        desc="자주 쓰는 흐름을 템플릿으로 두고 실행할 때 불러오세요."
        actions={<>
          <button className="btn" onClick={() => nav('/dag')}><Network size={15} />흐름 설계 열기</button>
          <button className="btn primary" onClick={() => nav('/dag')}>
            <Plus size={15} />새 템플릿 만들기
          </button>
        </>}
      />

      <Card
        title="템플릿"
        right={<>
          <Seg items={[
            { key: 'shared' as const, label: `공용 템플릿 (${shared.length})` },
            { key: 'personal' as const, label: `내 템플릿 (${mine.length})` },
          ]} value={tab} onChange={setTab} />
          <input className="input" style={{ width: 200 }} value={q} placeholder="이름 또는 설명 검색"
            onChange={e => setQ(e.target.value)} />
        </>}
        flush
      >
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="no">No.</th><th>템플릿</th>
                {tab === 'shared' ? <th>분류</th> : <th>만든 사람</th>}
                <th className="num">노드</th><th className="num">사용</th><th>갱신</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t.id}>
                  <td className="no">{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.name}</div>
                    <div className="faint">{t.desc}</div>
                  </td>
                  <td>{tab === 'shared' ? <span className="badge">{t.category}</span> : t.owner}</td>
                  <td className="num">{t.nodes}</td>
                  <td className="num">{t.used}회</td>
                  <td>{t.updated}</td>
                  <td className="num">
                    {/* 열기만 바로 두고, 복사 · 수정 · 삭제는 더보기에 모은다. */}
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                      <button className="btn sm" onClick={() => {
                        onToast(`${t.name} 을 캔버스로 불러옵니다`)
                        nav('/dag')
                      }}>열기</button>
                      <MoreMenu sm items={t.scope === 'shared'
                        ? [
                          {
                            label: '내 워크플로로 복사', icon: <Copy size={14} />,
                            onClick: () => {
                              tplStore.copyToPersonal(t.id, '김연구')
                              setTab('personal')
                              onToast(`${t.name} 을 내 워크플로로 복사`)
                            },
                          },
                          ...(isAdmin ? [{ label: '템플릿 정보 수정', icon: <Pencil size={14} />, onClick: () => setEdit(t) }] : []),
                        ]
                        : [
                          { label: '템플릿 정보 수정', icon: <Pencil size={14} />, onClick: () => setEdit(t) },
                          { label: '템플릿 삭제', icon: <Trash2 size={14} />, danger: true, onClick: () => setDrop(t) },
                        ]} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="no">-</td><td colSpan={6} className="muted">
                  {q ? '검색 결과가 없습니다.'
                    : tab === 'shared' ? '등록된 공용 템플릿이 없습니다.'
                      : '아직 만든 워크플로가 없습니다. 흐름 설계 화면에서 흐름을 구성한 뒤 저장하세요.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {edit && (
        <Modal title="템플릿 정보 수정" onClose={() => setEdit(null)}
          footer={<>
            <button className="btn" onClick={() => setEdit(null)}>취소</button>
            <button className="btn primary" onClick={() => {
              setEdit(null); onToast(`${edit.name} 저장됨`)
            }}>저장</button>
          </>}>
          <Field label="템플릿 이름"><input className="input" defaultValue={edit.name} /></Field>
          <Field label="설명"><textarea className="input" rows={3} defaultValue={edit.desc} /></Field>
          {edit.scope === 'shared' && (
            <Field label="분류">
              <select className="input" defaultValue={edit.category}>
                <option>안정화</option><option>결합 예측</option><option>비교 검증</option>
              </select>
            </Field>
          )}
        </Modal>
      )}

      {drop && (
        <Modal title="템플릿 삭제" onClose={() => setDrop(null)}
          footer={<>
            <button className="btn" onClick={() => setDrop(null)}>취소</button>
            <button className="btn primary danger" onClick={() => {
              tplStore.remove(drop.id); onToast(`${drop.name} 삭제됨`); setDrop(null)
            }}>삭제</button>
          </>}>
          <p>{drop.name} 을 삭제할까요? 이 템플릿으로 이미 실행한 실행 기록은 그대로 남습니다.</p>
        </Modal>
      )}
    </>
  )
}
