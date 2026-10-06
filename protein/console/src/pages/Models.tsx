import { useState } from 'react'
import {
  Activity, Download, Plug, Plus, Save, ShieldCheck, Upload, X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Field, Modal, MoreMenu, PageHead, Seg, State, Tabs } from '../components/ui'
import { MODELS, type ModelEntry } from '../data/mock'
import { PROVIDER_TYPE_LABEL, PROVIDERS, type ProviderSpec, type ProviderType } from '../data/admin'
import { can, gateTitle, roleNote, useRole } from '../data/session'

const TYPE_KEYS: ProviderType[] = ['runpod', 'http_api', 'disabled']
const HEALTH_LABEL: Record<ProviderSpec['health'], { cls: string; text: string }> = {
  ready: { cls: 'ok', text: '정상' },
  notready: { cls: 'err', text: '점검 필요' },
  unchecked: { cls: '', text: '미확인' },
}

const KIND_LABEL: Record<string, string> = {
  backbone: '백본 생성', sequence: '서열 설계', structure: '구조 예측',
  filter: '후보 필터', docking: '도킹', complex: '복합체 예측', ensemble: '앙상블 샘플링',
}

/* 모델별 컨테이너 이미지 저장소 (목업) */
const IMAGE_REPO: Record<string, string> = {
  rfdiffusion3: 'ghcr.io/kribb/rfd3',
  proteinmpnn: 'ghcr.io/kribb/proteinmpnn',
  bioemu: 'ghcr.io/kribb/bioemu',
  soluprot: 'ghcr.io/kribb/soluprot',
  colabfold: 'ghcr.io/kribb/colabfold',
  'af2-multimer': 'ghcr.io/kribb/af2-multimer',
  diffdock: 'ghcr.io/kribb/diffdock',
  boltz2: 'ghcr.io/kribb/boltz2',
  esmfold: 'ghcr.io/kribb/esmfold',
}

/* 모델별 이전 버전 이력 (목업) */
const PREV_VERSIONS: Record<string, [string, string][]> = {
  rfdiffusion3: [['1.1.3', '2026-08-02'], ['1.1.0', '2026-06-15'], ['1.0.2', '2026-04-20']],
  proteinmpnn: [['1.0.0', '2026-05-11'], ['0.9.4', '2026-02-27']],
  bioemu: [['1.0', '2026-07-08']],
  soluprot: [['0.9', '2026-03-02']],
  colabfold: [['1.5.3', '2026-07-19'], ['1.5.2', '2026-05-06']],
  'af2-multimer': [['2.3.1', '2026-06-30'], ['2.3.0', '2026-03-14']],
  diffdock: [['1.0', '2026-04-05']],
  boltz2: [],
  esmfold: [['1.0.2', '2026-03-25'], ['1.0.0', '2026-01-19']],
}

interface VerRow { ver: string; change: string; image: string; date: string; by: string; state: string }

function versionRows(m: ModelEntry): VerRow[] {
  const repo = IMAGE_REPO[m.id] ?? `ghcr.io/kribb/${m.id}`
  const head: VerRow = {
    ver: m.version,
    change: m.state === 'staged' ? '승인 대기' : m.state === 'disabled' ? '비활성화' : '운영 반영',
    image: `${repo}:${m.version}`,
    date: m.updated,
    by: m.approvedBy ?? '등록 요청자',
    state: m.state,
  }
  const prev = (PREV_VERSIONS[m.id] ?? []).map(([v, d]) => ({
    ver: v, change: '비활성화', image: `${repo}:${v}`, date: d, by: '관리자', state: 'disabled',
  }))
  return [head, ...prev]
}

/* 역할별 입출력 스키마 (목업) */
const INPUT_PROPS: Record<string, string> = {
  backbone: `    "structure":   { "type": "string", "format": "pdb" },
    "chains":      { "type": "array", "items": { "type": "string" } },
    "fixed_residues": { "type": "array", "items": { "type": "integer" } },
    "num_samples": { "type": "integer", "minimum": 1, "maximum": 256 },
    "diffusion_steps": { "type": "integer", "default": 50 },
    "seed":        { "type": "integer" }`,
  sequence: `    "structure":   { "type": "string", "format": "pdb" },
    "num_seq_per_target": { "type": "integer", "default": 2 },
    "sampling_temp": { "type": "number", "default": 0.1 },
    "fixed_residues": { "type": "array", "items": { "type": "integer" } },
    "seed":        { "type": "integer" }`,
  structure: `    "sequence":    { "type": "string", "pattern": "^[ACDEFGHIKLMNPQRSTVWY]+$" },
    "msa_mode":    { "type": "string", "enum": ["uniref90", "none"] },
    "num_recycles": { "type": "integer", "default": 3 },
    "num_models":  { "type": "integer", "default": 5 },
    "seed":        { "type": "integer" }`,
  filter: `    "sequences":   { "type": "array", "items": { "type": "string" } },
    "cutoff":      { "type": "number", "default": 0.6, "minimum": 0, "maximum": 1 },
    "batch_size":  { "type": "integer", "default": 64 }`,
  docking: `    "receptor":    { "type": "string", "format": "pdb" },
    "ligand":      { "type": "string", "format": "sdf" },
    "num_poses":   { "type": "integer", "default": 10 },
    "inference_steps": { "type": "integer", "default": 20 }`,
  complex: `    "sequences":   { "type": "array", "items": { "type": "string" }, "minItems": 2 },
    "num_recycles": { "type": "integer", "default": 3 },
    "pair_msa":    { "type": "boolean", "default": true },
    "seed":        { "type": "integer" }`,
  ensemble: `    "structure":   { "type": "string", "format": "pdb" },
    "num_samples": { "type": "integer", "default": 20 },
    "temperature": { "type": "number", "default": 300 },
    "steering_config": { "type": "object" }`,
}

const OUTPUT_PROPS: Record<string, string> = {
  backbone: `    "backbones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path": { "type": "string" },
          "sample_index":  { "type": "integer" },
          "metrics": {
            "type": "object",
            "properties": { "radius_of_gyration": {"type":"number"} }
          }
        }
      }
    },`,
  sequence: `    "sequences": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id":       { "type": "string" },
          "sequence": { "type": "string" },
          "score":    { "type": "number" }
        }
      }
    },`,
  structure: `    "structures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path": { "type": "string" },
          "plddt":         { "type": "number" },
          "ptm":           { "type": "number" }
        }
      }
    },`,
  filter: `    "scores": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id":     { "type": "string" },
          "score":  { "type": "number" },
          "passed": { "type": "boolean" }
        }
      }
    },`,
  docking: `    "poses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path":    { "type": "string" },
          "confidence":       { "type": "number" },
          "binding_affinity": { "type": "number" }
        }
      }
    },`,
  complex: `    "complexes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path": { "type": "string" },
          "iptm":          { "type": "number" },
          "interface_plddt": { "type": "number" }
        }
      }
    },`,
  ensemble: `    "ensemble": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact_path": { "type": "string" },
          "frame_index":   { "type": "integer" },
          "rmsf":          { "type": "number" }
        }
      }
    },`,
}

/* ============================================================
   /models : 등록 모델 목록
   ============================================================ */
export function ModelsList({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const role = useRole()
  const canRequest = can(role, 'model_request')
  const canApprove = can(role, 'model_approve')
  const [filter, setFilter] = useState<'all' | 'active' | 'staged'>('all')
  const [open, setOpen] = useState(false)

  const rows = MODELS.filter(m => filter === 'all' || m.state === filter)

  return (
    <>
      <PageHead
        title="등록 모델"
        desc="모델을 등록하고 한 줄을 골라 버전과 스키마를 확인하세요."
        actions={<>
          <button className="btn primary" disabled={!canRequest} title={gateTitle(role, 'model_request')}
            onClick={() => setOpen(true)}><Plus size={14} />모델 등록</button>
          <MoreMenu items={[
            { label: '스키마 파일 가져오기', icon: <Upload size={14} />, onClick: () => onToast('스키마 파일 가져오기') },
            { label: '실행 제공자 설정', icon: <Plug size={14} />, onClick: () => nav('/models/providers') },
          ]} />
        </>}
      />


      <Card
        title="모델 목록"
        sub={`${rows.length}종 · 한 줄을 고르면 모델 상세가 열립니다`}
        right={<Seg items={[{ key: 'all', label: '전체' }, { key: 'active', label: '운영' }, { key: 'staged', label: '승인대기' }]}
          value={filter} onChange={setFilter} />}
      >
        <div className="row wrap">
          <span className="faint">{roleNote(role, ['model_request', 'model_approve'])}</span>
        </div>
        {rows.length === 0 ? (
          <div className="empty">조건에 맞는 모델이 없습니다. 필터를 전체로 되돌리세요.</div>
        ) : (
          <div className="tbl-wrap" style={{ marginTop: 12 }}>
            <table className="tbl">
              <thead>
                <tr><th className="no">No.</th><th>모델 ID</th><th>이름</th><th>버전</th><th>역할</th><th>상태</th><th>갱신</th><th>액션</th></tr>
              </thead>
              <tbody>
                {rows.map((m, i) => (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/models/${m.id}`)}>
                    <td className="no">{i + 1}</td>
                    <td className="mono" style={{ fontWeight: 500 }}>{m.id}</td>
                    <td>{m.name}</td>
                    <td className="mono">{m.version}</td>
                    <td className="muted">{KIND_LABEL[m.kind] ?? m.kind}</td>
                    <td><State s={m.state} /></td>
                    <td className="faint">{m.updated}</td>
                    <td>
                      {m.state === 'staged'
                        ? <button className="btn sm" disabled={!canApprove} title={gateTitle(role, 'model_approve')}
                          onClick={e => { e.stopPropagation(); onToast(`${m.id} 운영 승인 요청 등록`) }}>
                          <ShieldCheck size={13} />승인</button>
                        : <button className="btn sm ghost" onClick={e => { e.stopPropagation(); nav(`/models/${m.id}`) }}>상세</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && <RegisterModal onClose={() => setOpen(false)} onToast={onToast} />}
    </>
  )
}

/* 모델 등록 모달 */
function RegisterModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const role = useRole()
  return (
    <Modal title="모델 등록" onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn primary" disabled={!can(role, 'model_request')} title={gateTitle(role, 'model_request')}
          onClick={() => { onClose(); onToast('승인대기 상태로 등록됨, 관리자 승인 필요') }}>
          등록 요청
        </button>
      </>}>
      <div className="grid g2">
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
      <div className="grid g2">
        <Field label="GPU 요구"><select className="input">
          <option>H100 80GB</option><option>A100 80GB</option><option>A100 40GB</option><option>L4 24GB</option><option>CPU</option>
        </select></Field>
        <Field label="최대 동시 워커"><input className="input" type="number" defaultValue={2} /></Field>
      </div>
      <Field label="입출력 스키마" hint="JSON Schema 파일을 업로드하거나 URL을 입력합니다.">
        <input className="input" placeholder="schema/boltz2.json" />
      </Field>
      <div className="signal warn">
        <span className="ic"><ShieldCheck size={15} color="var(--warn)" /></span>
        <div><b>승인 절차</b>
          <p>등록 요청은 승인 대기 상태로 저장되고, 관리자 승인 후 운영에 반영됩니다.</p></div>
      </div>
    </Modal>
  )
}

/* ============================================================
   /models/:id : 모델 하나. 개요 + 탭(버전 이력 / 입출력 스키마)
   ============================================================ */
export function ModelDetail({ onToast }: { onToast: (m: string) => void }) {
  const { id = '' } = useParams()
  const role = useRole()
  const canApprove = can(role, 'model_approve')
  const [tab, setTab] = useState<'versions' | 'schema'>('versions')

  const m = MODELS.find(x => x.id === id) ?? null

  if (!m) {
    return (
      <>
        <PageHead title="모델 상세" desc="주소의 모델을 찾을 수 없습니다. 목록에서 다시 선택하세요."
          back={{ to: '/models', label: '목록으로' }} />
        <Card>
          <div className="empty">모델 {id || '(지정 없음)'}를 찾을 수 없습니다. 등록되지 않았거나 주소가 잘못되었습니다.</div>
        </Card>
      </>
    )
  }

  const vers = versionRows(m)
  const rollback = vers[1]?.ver ?? '없음'
  const inProps = INPUT_PROPS[m.kind] ?? INPUT_PROPS.structure
  const outProps = OUTPUT_PROPS[m.kind] ?? OUTPUT_PROPS.structure

  return (
    <>
      <PageHead
        title={m.name}
        desc="이 모델의 운영 버전과 입출력 계약을 확인하세요."
        back={{ to: '/models', label: '목록으로' }}
        actions={<>
          {m.state === 'staged'
            ? <button className="btn primary" disabled={!canApprove} title={gateTitle(role, 'model_approve')}
              onClick={() => onToast(`${m.id} 운영 승인 요청 등록`)}><ShieldCheck size={14} />운영 승인</button>
            : <button className="btn" disabled={rollback === '없음' || !canApprove} title={gateTitle(role, 'model_approve')}
              onClick={() => onToast(`${rollback}으로 롤백 요청, 승인 필요`)}>
              이전 버전으로 롤백</button>}
        </>}
      />

      <Card title="모델 개요" right={<State s={m.state} />}>
        <div className="row wrap" style={{ marginBottom: 12 }}>
          <span className="faint">{roleNote(role, ['model_request', 'model_approve'])}</span>
        </div>
        <div className="grid g3">
          <dl className="kv">
            <dt>모델 ID</dt><dd className="mono">{m.id}</dd>
            <dt>현재 운영</dt><dd className="mono">{m.version}</dd>
            <dt>역할</dt><dd>{KIND_LABEL[m.kind] ?? m.kind}</dd>
          </dl>
          <dl className="kv">
            <dt>엔드포인트</dt><dd className="mono">{m.endpoint}</dd>
            <dt>자원 요구</dt><dd>{m.gpu}</dd>
            <dt>롤백 대상</dt><dd className="mono">{rollback}</dd>
          </dl>
          <dl className="kv">
            <dt>상태</dt><dd><State s={m.state} /></dd>
            <dt>승인자</dt><dd>{m.approvedBy ?? '-'}</dd>
            <dt>갱신</dt><dd className="muted">{m.updated}</dd>
          </dl>
        </div>
      </Card>

      <Tabs items={[
        { key: 'versions', label: `버전 이력 (${vers.length})` },
        { key: 'schema', label: '입출력 스키마' },
      ]} value={tab} onChange={setTab} />

      {tab === 'versions' && (
        <>
          <Card title="버전 이력" sub={`${m.name} · 변경 기록 ${vers.length}건`} flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th className="no">No.</th><th>버전</th><th>변경</th><th>컨테이너 이미지</th><th>적용일</th><th>처리자</th><th>상태</th></tr>
                </thead>
                <tbody>
                  {vers.map((r, i) => (
                    <tr key={r.ver}>
                      <td className="no">{i + 1}</td>
                      <td className="mono" style={{ fontWeight: 500 }}>{r.ver}</td>
                      <td>{r.change}</td>
                      <td className="mono faint">{r.image}</td>
                      <td className="faint">{r.date}</td>
                      <td>{r.by}</td>
                      <td><State s={r.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="버전 관리 정책">
            <div className="col" style={{ gap: 16 }}>
              <div className="row">
                <button className="btn" disabled={rollback === '없음' || !canApprove} title={gateTitle(role, 'model_approve')}
                  onClick={() => onToast(`${rollback}으로 롤백 요청, 승인 필요`)}>
                  이전 버전으로 롤백
                </button>
                <button className="btn" onClick={() => onToast(`${m.id} 버전 이력 CSV 내려받기`)}>
                  <Download size={14} />이력 내려받기
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'schema' && (
        <>
          <div className="grid g2">
            <Card title="입력 스키마" sub="JSON Schema">
              <div className="log" style={{ maxHeight: 340 }}>
{`{
  "$id": "${m.id}/input",
  "type": "object",
  "required": ${m.kind === 'filter' ? '["sequences"]' : m.kind === 'docking' ? '["receptor", "ligand"]' : m.kind === 'structure' || m.kind === 'complex' ? '["sequences"]' : '["structure"]'},
  "properties": {
${inProps}
  }
}`}
              </div>
            </Card>
            <Card title="출력 스키마" sub="아티팩트 계약">
              <div className="log" style={{ maxHeight: 340 }}>
{`{
  "$id": "${m.id}/output",
  "type": "object",
  "properties": {
${outProps}
    "run_meta": { "$ref": "common/run_meta" }
  }
}`}
              </div>
            </Card>
          </div>

          <Card title="스키마 검증 결과">
            <div className="col" style={{ gap: 9 }}>
              {['JSON Schema 유효성', '공통 run_meta 참조', '선행 단계 출력과 타입 호환', '아티팩트 경로 규칙 준수'].map(k => (
                <div key={k} className="row">
                  <span>{k}</span><div className="sp" /><span className="badge ok">통과</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="DAG 노드 자동 생성" sub="단계별 실행 팔레트 노출">
            <div className="col" style={{ gap: 16 }}>
              <div className="pal-item" style={{ cursor: 'default' }}>
                <span className="pal-ic" style={{ background: '#4f46e5' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{m.name}</div>
                  <div className="faint mono">{m.id}@{m.version}</div>
                </div>
              </div>
              <div className="row">
                <button className="btn" onClick={() => onToast(`${m.id} 스키마 JSON 내려받기`)}>
                  <Download size={14} />스키마 내려받기
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  )
}

/* ============================================================
   /models/providers : 실행 제공자 설정
   ============================================================ */
export function ModelProviders({ onToast }: { onToast: (m: string) => void }) {
  const role = useRole()
  const canApprove = can(role, 'model_approve')
  const [scope, setScope] = useState<'user' | 'global'>('user')
  const [provs, setProvs] = useState(PROVIDERS)
  const [selProv, setSelProv] = useState(PROVIDERS[0].key)
  const [addOpen, setAddOpen] = useState(false)
  const [nKey, setNKey] = useState('')
  const [nLabel, setNLabel] = useState('')
  const [nType, setNType] = useState<ProviderType>('http_api')
  const [nEndpoint, setNEndpoint] = useState('')
  const [nBaseUrl, setNBaseUrl] = useState('')
  const [nToken, setNToken] = useState('')
  const [nTimeout, setNTimeout] = useState(21600)
  const [addMsg, setAddMsg] = useState('')

  const selP = provs.find(p => p.key === selProv) ?? provs[0]

  const patchP = (key: string, p: Partial<ProviderSpec>) =>
    setProvs(prev => prev.map(x => (x.key === key ? { ...x, ...p } : x)))

  const addProvider = () => {
    if (!nKey.trim() || !nLabel.trim()) { setAddMsg('모델 키와 표시 이름은 필수입니다.'); return }
    setProvs(prev => [...prev, {
      key: nKey.trim(), label: nLabel.trim(), type: nType,
      endpointId: nEndpoint.trim(), baseUrl: nBaseUrl.trim(), timeout: nTimeout,
      health: 'unchecked', runpodEnv: '-', httpEnv: '-', custom: true,
    }])
    setSelProv(nKey.trim())
    onToast(`${nLabel.trim()} 모델을 추가했습니다`)
    setAddMsg(''); setAddOpen(false)
    setNKey(''); setNLabel(''); setNType('http_api'); setNEndpoint(''); setNBaseUrl(''); setNToken(''); setNTimeout(21600)
  }

  return (
    <>
      <PageHead
        title="실행 제공자"
        desc="모델을 어디서 실행할지 지정하고 연결 상태를 점검하세요."
        actions={<>
          <button className="btn" onClick={() => setAddOpen(o => !o)}>
            {addOpen ? <X size={14} /> : <Plus size={14} />}{addOpen ? '추가 닫기' : '모델 추가'}
          </button>
        </>}
      />

      <Card title="설정 범위" sub={scope === 'global' ? '전체 기본값' : '내 모델 설정'}>
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap">
            <Seg items={[{ key: 'user', label: '내 모델 설정' }, { key: 'global', label: '전체 기본값' }]}
              value={scope} onChange={k => {
                setScope(k)
                onToast(k === 'global' ? '전체 기본값 범위로 전환, Model Manager 권한이 필요합니다' : '내 모델 설정 범위로 전환')
              }} />
            <div className="sp" />
            {scope === 'global'
              ? <span className="badge warn">Model Manager 이상</span>
              : <span className="badge ok">본인 실행에만 적용</span>}
          </div>

          {addOpen && (
            <>
              <div className="divider" />
              <div className="grid g3">
                <Field label="모델 키" hint="model_key">
                  <input className="input mono" placeholder="esmfold_large" value={nKey} onChange={e => setNKey(e.target.value)} />
                </Field>
                <Field label="표시 이름">
                  <input className="input" placeholder="ESMFold Large" value={nLabel} onChange={e => setNLabel(e.target.value)} />
                </Field>
                <Field label="provider 종류" hint="provider_type">
                  <select className="input" value={nType} onChange={e => setNType(e.target.value as ProviderType)}>
                    {TYPE_KEYS.map(t => <option key={t} value={t}>{PROVIDER_TYPE_LABEL[t]}</option>)}
                  </select>
                </Field>
                <Field label="RunPod 엔드포인트 ID" hint="endpoint_id">
                  <input className="input mono" placeholder="ep_xxxxxxxx" value={nEndpoint}
                    onChange={e => setNEndpoint(e.target.value)} disabled={nType !== 'runpod'} />
                </Field>
                <Field label="HTTP API 주소" hint="base_url">
                  <input className="input mono" placeholder="http://gpu.example:18162" value={nBaseUrl}
                    onChange={e => setNBaseUrl(e.target.value)} disabled={nType !== 'http_api'} />
                </Field>
                <Field label={nType === 'runpod' ? 'RunPod API 키' : 'HTTP API 토큰'} hint="저장 후에는 마스킹되어 표시됩니다">
                  <input className="input" type="password" placeholder="••••••••" value={nToken}
                    onChange={e => setNToken(e.target.value)} disabled={nType === 'disabled'} />
                </Field>
                <Field label="제한 시간" hint="timeout_s · 초">
                  <input className="input" type="number" value={nTimeout} onChange={e => setNTimeout(Number(e.target.value))} />
                </Field>
              </div>
              <div className="row">
                {addMsg && <span className="muted">{addMsg}</span>}
                <div className="sp" />
                <button className="btn" onClick={() => { setAddOpen(false); setAddMsg('') }}>닫기</button>
                <button className="btn primary" onClick={addProvider}><Plus size={14} />모델 추가</button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card title="provider 목록" sub={`${provs.length}종 · 한 줄을 고르면 아래에서 설정합니다`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="no">No.</th><th>모델 키</th><th>이름</th><th>provider 종류</th><th>연결 대상</th><th>상태</th><th>액션</th></tr>
            </thead>
            <tbody>
              {provs.map((p, i) => (
                <tr key={p.key} className={selProv === p.key ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelProv(p.key)}>
                  <td className="no">{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 500 }}>{p.key}</td>
                  <td>{p.label}{p.custom && <span className="badge brand">사용자 추가</span>}</td>
                  <td className="muted">{PROVIDER_TYPE_LABEL[p.type]}</td>
                  <td className="mono faint">{p.type === 'disabled' ? '사용 안 함'
                    : p.type === 'runpod' ? (p.endpointId || '미설정')
                      : (p.baseUrl || '미설정')}</td>
                  <td><span className={'badge ' + HEALTH_LABEL[p.health].cls}>{HEALTH_LABEL[p.health].text}</span></td>
                  <td><button className="btn sm" onClick={e => { e.stopPropagation(); setSelProv(p.key) }}>설정</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`provider 설정 · ${selP.label}`} sub={selP.key}
        right={<>
          {selP.custom && <span className="badge brand">사용자 추가</span>}
          <span className={'badge ' + HEALTH_LABEL[selP.health].cls}>{HEALTH_LABEL[selP.health].text}</span>
        </>}>
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g2">
            <Field label="provider 종류" hint="provider_type">
              <select className="input" value={selP.type}
                onChange={e => patchP(selP.key, { type: e.target.value as ProviderType, health: 'unchecked' })}>
                {TYPE_KEYS.map(t => <option key={t} value={t}>{PROVIDER_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="제한 시간" hint="timeout_s · 초">
              <input className="input" type="number" value={selP.timeout}
                onChange={e => patchP(selP.key, { timeout: Number(e.target.value) })} />
            </Field>
            <Field label="RunPod 엔드포인트 ID" hint="endpoint_id">
              <input className="input mono" value={selP.endpointId} placeholder="ep_xxxxxxxx"
                disabled={selP.type !== 'runpod'}
                onChange={e => patchP(selP.key, { endpointId: e.target.value })} />
            </Field>
            <Field label="HTTP API 주소" hint="base_url">
              <input className="input mono" value={selP.baseUrl} placeholder="http://gpu.example:18162"
                disabled={selP.type !== 'http_api'}
                onChange={e => patchP(selP.key, { baseUrl: e.target.value })} />
            </Field>
          </div>
          <Field label={selP.type === 'runpod' ? 'RunPod API 키' : 'HTTP API 토큰'}
            hint="저장된 토큰을 유지하려면 비워 둡니다">
            <input className="input" type="password" placeholder="••••••••" disabled={selP.type === 'disabled'} />
          </Field>
          <div className="row wrap">
            <span className="muted">
              연결 {selP.type === 'disabled' ? '사용 안 함'
                : selP.type === 'runpod' ? (selP.endpointId || '미설정')
                  : (selP.baseUrl || '미설정')}
            </span>
            <div className="sp" />
            <span className={'badge ' + (selP.type === 'disabled' ? '' : (selP.endpointId || selP.baseUrl) ? 'ok' : 'warn')}>
              {selP.type === 'disabled' ? '사용 안 함' : (selP.endpointId || selP.baseUrl) ? '설정 완료' : '설정 필요'}
            </span>
          </div>
          <div className="row wrap">
            <button className="btn sm" disabled={!canApprove} title={gateTitle(role, 'model_approve')}
              onClick={() => {
                patchP(selP.key, { health: selP.type === 'disabled' ? 'unchecked' : 'ready' })
                onToast(`${selP.label} 연결 상태를 점검했습니다`)
              }}><Activity size={13} />헬스 체크</button>
            <div className="sp" />
            <button className="btn sm primary" disabled={!canApprove} title={gateTitle(role, 'model_approve')}
              onClick={() => onToast(`${selP.label} 저장됨 (${scope === 'global' ? '전체 기본값' : '내 모델 설정'})`)}>
              <Save size={13} />저장
            </button>
          </div>
          <div className="row wrap">
            <span className="faint">{roleNote(role, ['model_approve'])}</span>
          </div>
        </div>
      </Card>

      <Card title="기본 제공 모델 환경변수" sub="환경변수 기준 기본 provider">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="no">No.</th><th>모델 키</th><th>이름</th><th>현재 provider</th><th>RunPod 환경변수</th><th>HTTP 환경변수</th><th>상태</th></tr>
            </thead>
            <tbody>
              {provs.filter(p => !p.custom).map((p, i) => (
                <tr key={p.key}>
                  <td className="no">{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 500 }}>{p.key}</td>
                  <td>{p.label}</td>
                  <td className="muted">{PROVIDER_TYPE_LABEL[p.type]}</td>
                  <td className="mono faint">{p.runpodEnv}</td>
                  <td className="mono faint">{p.httpEnv}</td>
                  <td><span className={'badge ' + HEALTH_LABEL[p.health].cls}>{HEALTH_LABEL[p.health].text}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="등록 방식 두 가지">
        <div className="grid g2">
          <div className="col" style={{ gap: 16 }}>
            <div className="row">
              <span style={{ fontWeight: 600 }}>RunPod 이미지로 등록</span>
              <span className="badge brand">권장</span>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {['1. 이미지 준비', '2. 엔드포인트 생성', '3. 값 입력', '4. 헬스 체크'].map(k => (
                <div key={k} style={{ fontWeight: 500 }}>{k}</div>
              ))}
            </div>
            <div className="log" style={{ maxHeight: 110 }}>
{`image:       mimikyou0607/proteinmpnn-runpod:latest
endpoint_id: ep_xxxxxxxx
api_key:     rp_••••••••••••••••`}
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="row">
              <span style={{ fontWeight: 600 }}>GPU 서버 API로 등록</span>
              <div className="sp" />
              <button className="btn sm" onClick={() => onToast('protein-model-api-registration.zip 내려받기 시작')}>
                <Download size={13} />등록 스킬
              </button>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {['1. 등록 스킬 내려받기', '2. 서버에 배치', '3. 필수 경로 공개', '4. 주소 입력'].map(k => (
                <div key={k} style={{ fontWeight: 500 }}>{k}</div>
              ))}
            </div>
            <div className="log" style={{ maxHeight: 110 }}>
{`work_dir: /opt/protein-model-api-registration
expose:   GET /healthz
          POST /run`}
            </div>
          </div>
        </div>
      </Card>

      <Card title="필수 API 계약 · 요청 응답 예시" sub={`3건`}>
        <div className="col" style={{ gap: 16 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>메서드</th><th>경로</th><th>필수</th><th>요청</th><th>응답</th></tr></thead>
              <tbody>
                {[
                  ['GET', '/healthz', '필수', '없음', '서비스 상태와 모델 적재 여부'],
                  ['POST', '/실행', '필수', '모델별 입력 JSON', '산출물 경로 또는 결과 JSON'],
                  ['POST', '/cancel', '선택', '작업 식별자', '취소 처리 결과'],
                ].map((r, i) => (
                  <tr key={r[1]}>
                    <td className="no">{i + 1}</td>
                    <td><span className={'badge ' + (r[0] === 'POST' ? 'brand' : '')}>{r[0]}</span></td>
                    <td className="mono" style={{ fontWeight: 500 }}>{r[1]}</td>
                    <td>{r[2] === '필수' ? <span className="badge err">필수</span> : <span className="muted">선택</span>}</td>
                    <td className="muted">{r[3]}</td>
                    <td className="muted">{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="log" style={{ maxHeight: 240 }}>
{`GET /healthz
<- {"ok": true, "model": "proteinmpnn", "ready": true}

POST /run
-> {"input": {"pdb": "<base64>",
              "num_seq_per_target": 2,
              "sampling_temp": 0.1}}
<- {"ok": true,
    "outputs": [{"id": "seq_0001",
                 "sequence": "MSKGEELFT..."}]}

POST /cancel
-> {"job_id": "job_8812"}
<- {"ok": true, "cancelled": true}`}
          </div>
        </div>
      </Card>

      <Card title="등록 후 점검 항목" sub={`5건`}>
        <div className="col" style={{ gap: 9 }}>
          {[
            ['상태 점검 경로 응답', 'ok'],
            ['실행 경로 응답 형식', 'ok'],
            ['제한 시간 설정 (기본 21600초)', 'ok'],
            ['토큰 인증 동작', 'ok'],
            ['취소 경로 구현', 'warn'],
          ].map(([k, s]) => (
            <div key={k} className="row">
              <span style={{ minWidth: 0 }}>{k}</span><div className="sp" />
              <span className={'badge ' + s}>{s === 'ok' ? '확인' : '선택 항목'}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
