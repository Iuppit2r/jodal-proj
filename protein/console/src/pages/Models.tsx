import { useState } from 'react'
import { History, Plus, ShieldCheck, Upload } from 'lucide-react'
import { Card, Field, Modal, PageHead, Seg, State, Tabs } from '../components/ui'
import { MODELS } from '../data/mock'

export default function Models({ onToast }: { onToast: (m: string) => void }) {
  const [tab, setTab] = useState<'list' | 'versions' | 'schema'>('list')
  const [filter, setFilter] = useState<'all' | 'active' | 'staged'>('all')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(MODELS[0].id)

  const rows = MODELS.filter(m => filter === 'all' || m.state === filter)
  const selModel = MODELS.find(m => m.id === sel)!

  return (
    <>
      <PageHead
        title="Model Registry"
        desc="모델 ID·버전·컨테이너·엔드포인트·입출력 스키마·자원 요구량을 등록하고 활성 상태를 관리합니다. URL 직접 수정 없이 신규 모델을 도입할 수 있습니다."
        req="SFR-012 · DAR-003"
        actions={<>
          <button className="btn"><Upload size={14} />스키마 가져오기</button>
          <button className="btn primary" onClick={() => setOpen(true)}><Plus size={14} />모델 등록</button>
        </>}
      />

      <Tabs items={[
        { key: 'list', label: `등록 모델 (${MODELS.length})` },
        { key: 'versions', label: '버전 이력' },
        { key: 'schema', label: '입출력 스키마' },
      ]} value={tab} onChange={setTab} />

      {tab === 'list' && (
        <Card flush right={undefined}>
          <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
            <Seg items={[{ key: 'all', label: '전체' }, { key: 'active', label: '운영' }, { key: 'staged', label: '승인대기' }]}
              value={filter} onChange={setFilter} />
            <div className="sp" />
            <span className="faint">승인대기 1건 — 운영 반영 전 검증·승인 절차가 필요합니다 <span className="req">SER-008</span></span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>모델 ID</th><th>이름</th><th>버전</th><th>역할</th><th>엔드포인트</th><th>GPU 요구</th><th>상태</th><th>승인자</th><th>갱신</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(m => (
                  <tr key={m.id} className={sel === m.id ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSel(m.id)}>
                    <td className="mono" style={{ fontWeight: 500 }}>{m.id}</td>
                    <td>{m.name}</td>
                    <td className="mono">{m.version}</td>
                    <td><span className="badge">{m.kind}</span></td>
                    <td className="mono faint">{m.endpoint}</td>
                    <td>{m.gpu}</td>
                    <td><State s={m.state} /></td>
                    <td className="faint">{m.approvedBy ?? '—'}</td>
                    <td className="faint">{m.updated}</td>
                    <td>
                      {m.state === 'staged'
                        ? <button className="btn sm" onClick={e => { e.stopPropagation(); onToast(`${m.id} 운영 승인 요청 등록`) }}><ShieldCheck size={13} />승인</button>
                        : <button className="btn sm ghost" onClick={e => { e.stopPropagation(); setTab('versions') }}><History size={13} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'versions' && (
        <div className="grid g-2-1">
          <Card title={`버전 이력 — ${selModel.name}`} sub="등록·변경·비활성화 이력 보존" req="DAR-003" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>버전</th><th>변경</th><th>컨테이너 이미지</th><th>적용일</th><th>처리자</th><th>상태</th></tr></thead>
                <tbody>
                  {[
                    ['1.2.0', '운영 반영', 'ghcr.io/kribb/rfd3:1.2.0', '2026-09-28', '관리자', 'active'],
                    ['1.1.3', '비활성화', 'ghcr.io/kribb/rfd3:1.1.3', '2026-08-02', '관리자', 'disabled'],
                    ['1.1.0', '비활성화', 'ghcr.io/kribb/rfd3:1.1.0', '2026-06-15', '관리자', 'disabled'],
                    ['1.0.2', '비활성화', 'ghcr.io/kribb/rfd3:1.0.2', '2026-04-20', '관리자', 'disabled'],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td className="mono" style={{ fontWeight: 500 }}>{r[0]}</td>
                      <td>{r[1]}</td><td className="mono faint">{r[2]}</td>
                      <td className="faint">{r[3]}</td><td>{r[4]}</td>
                      <td><State s={r[5]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="버전 관리 정책">
            <div className="col" style={{ gap: 10 }}>
              <dl className="kv" style={{ gridTemplateColumns: '104px 1fr' }}>
                <dt>모델 ID</dt><dd className="mono">{selModel.id}</dd>
                <dt>현재 운영</dt><dd className="mono">{selModel.version}</dd>
                <dt>엔드포인트</dt><dd className="mono">{selModel.endpoint}</dd>
                <dt>자원 요구</dt><dd>{selModel.gpu} · VRAM 48GB↑</dd>
                <dt>롤백 대상</dt><dd className="mono">1.1.3</dd>
              </dl>
              <div className="divider" />
              <div className="faint" style={{ fontSize: 12, lineHeight: 1.6 }}>
                run 메타데이터에는 실행 시점의 모델 ID와 버전이 고정 기록되어, 모델이 갱신되어도 과거 run의 재현 정보가 보존됩니다.
              </div>
              <button className="btn" onClick={() => onToast('1.1.3으로 롤백 요청 — 승인 필요')}>이전 버전으로 롤백</button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'schema' && (
        <div className="grid g2">
          <Card title={`입력 스키마 — ${selModel.name}`} sub="JSON Schema">
            <div className="log" style={{ maxHeight: 340 }}>
{`{
  "$id": "${selModel.id}/input",
  "type": "object",
  "required": ["structure", "num_samples"],
  "properties": {
    "structure":   { "type": "string", "format": "pdb" },
    "chains":      { "type": "array", "items": { "type": "string" } },
    "fixed_residues": { "type": "array", "items": { "type": "integer" } },
    "num_samples": { "type": "integer", "minimum": 1, "maximum": 256 },
    "diffusion_steps": { "type": "integer", "default": 50 },
    "seed":        { "type": "integer" }
  }
}`}
            </div>
          </Card>
          <Card title="출력 스키마" sub="아티팩트 계약">
            <div className="log" style={{ maxHeight: 340 }}>
{`{
  "$id": "${selModel.id}/output",
  "type": "object",
  "properties": {
    "backbones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path": { "type": "string" },
          "source":        { "type": "string", "enum": ["rfd3"] },
          "sample_index":  { "type": "integer" },
          "metrics": {
            "type": "object",
            "properties": { "radius_of_gyration": {"type":"number"} }
          }
        }
      }
    },
    "run_meta": { "$ref": "common/run_meta" }
  }
}`}
            </div>
          </Card>
          <Card title="스키마 검증" sub="등록 시 자동 점검">
            <div className="col" style={{ gap: 8 }}>
              {[['JSON Schema 유효성', 'ok'], ['공통 run_meta 참조', 'ok'], ['선행 단계 출력과 타입 호환', 'ok'], ['아티팩트 경로 규칙 준수', 'ok']].map(([k, s]) => (
                <div key={k} className="row" style={{ fontSize: 12.5 }}>
                  <span>{k}</span><div className="sp" /><span className="badge ok">{s === 'ok' ? '통과' : s}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="DAG 노드 자동 생성" req="SFR-011">
            <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              스키마가 등록되면 Workflow Studio 팔레트에 해당 모델 노드가 자동 노출되고, 입력 포트 타입이 선행 노드 출력과 호환되는지 실행 전에 검사됩니다.
            </div>
            <div className="divider" />
            <div className="pal-item" style={{ cursor: 'default' }}>
              <span className="sw" style={{ background: '#0e7c66' }} />
              <div><div style={{ fontWeight: 500 }}>{selModel.name}</div>
                <div className="faint mono" style={{ fontSize: 10.5 }}>{selModel.id}@{selModel.version}</div></div>
            </div>
          </Card>
        </div>
      )}

      {open && (
        <Modal title="모델 등록" onClose={() => setOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => { setOpen(false); onToast('승인대기 상태로 등록됨 — 관리자 승인 필요') }}>
              등록 요청
            </button>
          </>}>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="모델 ID" hint="실행 시 참조되는 고유 식별자"><input className="input mono" placeholder="boltz2" /></Field>
            <Field label="버전"><input className="input mono" placeholder="0.4.1" /></Field>
            <Field label="표시 이름"><input className="input" placeholder="Boltz-2" /></Field>
            <Field label="역할"><select className="input">
              <option>structure</option><option>backbone</option><option>sequence</option>
              <option>filter</option><option>docking</option><option>complex</option><option>ensemble</option>
            </select></Field>
          </div>
          <Field label="컨테이너 이미지"><input className="input mono" placeholder="ghcr.io/kribb/boltz2:0.4.1" /></Field>
          <Field label="엔드포인트" hint="RunPod 서버리스 엔드포인트 또는 내부 풀">
            <input className="input mono" placeholder="rp-serverless/boltz2-h100" />
          </Field>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="GPU 요구"><select className="input"><option>H100 80GB</option><option>A100 80GB</option><option>A100 40GB</option><option>L4 24GB</option><option>CPU</option></select></Field>
            <Field label="최대 동시 워커"><input className="input" type="number" defaultValue={2} /></Field>
          </div>
          <Field label="입출력 스키마" hint="JSON Schema 파일을 업로드하거나 URL을 입력합니다.">
            <input className="input" placeholder="schema/boltz2.json" />
          </Field>
          <div className="signal warn">
            <span className="ic"><ShieldCheck size={15} color="var(--warn)" /></span>
            <div><b>승인 절차</b>
              <p>등록 요청은 승인대기 상태로 저장되며, 관리자 검증·승인 후에만 운영 환경에서 실행됩니다. 승인 이력과 롤백 지점이 함께 기록됩니다.</p></div>
          </div>
        </Modal>
      )}
    </>
  )
}
