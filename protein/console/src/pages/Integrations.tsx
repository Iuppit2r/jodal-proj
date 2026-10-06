import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Copy, Download, KeyRound, Plug, Plus, Search, Trash2 } from 'lucide-react'
import { Card, Field, PageHead, Seg, State } from '../components/ui'
import { MCP_CATALOG, MCP_GROUPS, PATS, PROMPT_EXAMPLES } from '../data/admin'
import type { PatRow } from '../data/admin'
import { useRole } from '../data/session'

type Toast = { onToast: (m: string) => void }

const ENDPOINT = 'https://rapid.kbiofoundry.kr/mcp'
const SERVER_NAME = 'protein-pipeline'
const TOKEN_MASK = 'kbfpat_••••••••••••••••'

const MASTER_PROMPT = `아래 순서대로 진행해줘.

1) protein-pipeline 스킬을 ~/.claude/skills/ 에 설치한다.
2) HTTP 스트리밍 방식 MCP 서버를 등록한다.
   url: ${ENDPOINT}
   header: Authorization: Bearer ${TOKEN_MASK}
3) 클라이언트를 재시작하고 MCP 서버 목록에서 ${SERVER_NAME} 연결을 확인한다.
4) 그다음 아래를 물어보고 내 답에 따라 실행한다.
   - 실행 방식: (1) 전체 파이프라인 (2) Studio 단계별 진행
     (3) 단일 모델 단독 실행 (RFD3 / ColabFold / AF2 / MSA /
        ProteinMPNN / SoluProt / DiffDock / BioEmu)
   - 설정: 기본값 사용 / 고급 설정 직접 지정
   - 서로게이트 AF2 예산 분류 사용 여부
5) 각 단계가 끝나면 결과를 요약하고 다음 단계 진행 여부를 내게 확인한다.
6) run_id, 단계, 상태, 주요 지표를 매 보고에 포함한다.`

const MCP_JSON = `{
  "mcpServers": {
    "${SERVER_NAME}": {
      "url": "${ENDPOINT}",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer ${TOKEN_MASK}"
      }
    }
  }
}`

const CODEX_TOML = `# ~/.codex/config.toml
[mcp_servers.${SERVER_NAME}]
url = "${ENDPOINT}"
http_headers = { Authorization = "Bearer ${TOKEN_MASK}" }`

const TTL_OPTIONS = [
  { key: '30', label: '30일' }, { key: '90', label: '90일' }, { key: '180', label: '180일' },
  { key: '365', label: '365일' }, { key: 'none', label: '무기한' },
] as const
type Ttl = typeof TTL_OPTIONS[number]['key']

const SCOPES = ['run:read', 'run:write', 'artifact:read', 'analyze:read',
  'report:write', 'model:read', 'model:write', 'ops:read']

const HTTP_ROUTES: { group: string; rows: string[][] }[] = [
  {
    group: 'run', rows: [
      ['POST', '/api/v1/runs', 'run:write', '실행 생성 (정형 Stage 또는 DAG 템플릿)'],
      ['GET', '/api/v1/runs', 'run:read', '실행 목록 조회 (필터·커서 페이지네이션)'],
      ['GET', '/api/v1/runs/{id}', 'run:read', '실행 상세 · 단계 상태 · 메타데이터'],
      ['GET', '/api/v1/runs/{id}/events', 'run:read', '이벤트 로그 스트림 (SSE)'],
      ['POST', '/api/v1/runs/{id}/continue', 'run:write', '체크포인트 승인 후 재개'],
      ['POST', '/api/v1/runs/{id}/fork', 'run:write', '조건 변경 분기 실행'],
    ],
  },
  {
    group: '산출물', rows: [
      ['GET', '/api/v1/runs/{id}/artifacts', 'artifact:read', '산출물 목록'],
      ['GET', '/api/v1/artifacts/{key}/url', 'artifact:read', '서명 다운로드 URL 발급'],
    ],
  },
  {
    group: '분석 · 보고서', rows: [
      ['POST', '/api/v1/compare', 'analyze:read', '실행 간 / 후보 간 비교'],
      ['GET', '/api/v1/hits', 'analyze:read', '가중 랭킹 조회'],
      ['POST', '/api/v1/reports', 'report:write', '보고서 생성 (국문/영문)'],
    ],
  },
  {
    group: '모델 · 운영', rows: [
      ['GET', '/api/v1/models', 'model:read', 'Model Registry 조회'],
      ['POST', '/api/v1/models', 'model:write', '모델 등록 요청 (승인 필요)'],
      ['GET', '/api/v1/endpoints', 'ops:read', 'GPU 엔드포인트 상태'],
    ],
  },
  {
    group: '기타', rows: [
      ['GET', '/healthz', '공개', '서비스 상태 점검'],
      ['POST', '/tools/call', 'run:read', 'MCP 도구 단건 호출 (원격 실행 경로)'],
    ],
  },
]

const LINKED_ACCOUNTS: string[][] = [
  ['agent-svc', '외부 IDE 에이전트 (MCP)', 'run:read artifact:read analyze:read', '2026-10-05 09:02', '2026-12-31', 'active'],
  ['ci-report', '야간 보고서 배치', 'report:write run:read', '2026-10-05 02:00', '2027-03-31', 'active'],
  ['lab-notebook', '전자연구노트 연동', 'artifact:read', '2026-10-03 16:44', '2026-11-30', 'active'],
  ['legacy-script', '구 스크립트 (마이그레이션 대상)', 'run:read', '2026-08-12 11:20', '2026-09-30', 'disabled'],
]

/* 목록 화면과 발급 화면이 함께 보는 키 목록. 시안이라 메모리에만 둔다. */
let keyStore: PatRow[] = [...PATS]
const saveKeys = (next: PatRow[]) => { keyStore = next; return next }

/* 오늘(2026-10-06) 기준 30일 안에 만료되는지. */
const expiresSoon = (d: string) => d !== '무기한' && d <= '2026-11-05'

/* ============ 공용 ============ */

/* 줄바꿈을 그대로 살리고 오른쪽 위에 복사 버튼을 둔 코드 블록. */
function CodeBlock({ code, onCopy, maxHeight = 320, copyLabel = '복사' }: {
  code: string; onCopy: () => void; maxHeight?: number; copyLabel?: string
}) {
  return (
    <div className="code">
      <pre style={{ maxHeight }}>{code}</pre>
      <button className="copy" onClick={onCopy}><Copy size={13} />{copyLabel}</button>
    </div>
  )
}

function Step({ n, title, desc, children }: { n: number; title: string; desc: string; children: ReactNode }) {
  return (
    <div className="guide-step">
      <span className="n">{n}</span>
      <div>
        <h4>{title}</h4>
        <div className="d">{desc}</div>
        {children}
      </div>
    </div>
  )
}

/* 발급 직후 한 번만 보여 주는 키 · 토큰 값. */
function IssuedOnce({ title, value, onCopy, onDone }: {
  title: string; value: string; onCopy: () => void; onDone: () => void
}) {
  return (
    <Card>
      <div className="col" style={{ gap: 16 }}>
        <div className="signal ok">
          <span className="ic"><Check size={15} color="var(--ok)" /></span>
          <div><b>{title}</b>
            <p>이 화면을 벗어나면 값을 다시 볼 수 없습니다.</p></div>
        </div>
        <CodeBlock code={value} onCopy={onCopy} />
        <div className="row">
          <div className="sp" />
          <button className="btn primary" onClick={onDone}>목록으로</button>
        </div>
      </div>
    </Card>
  )
}

/* ============ MCP 연결 ============ */

type Client = 'claude' | 'vscode' | 'codex'

const CLIENTS: Record<Client, { label: string; desc: string; code: string; what: string }> = {
  claude: { label: 'Claude Code', desc: '대화창에 그대로 붙여 넣으세요.', code: MASTER_PROMPT, what: '마스터 프롬프트' },
  vscode: { label: 'VS Code', desc: '.vscode/mcp.json 에 붙여 넣고 창을 다시 여세요.', code: MCP_JSON, what: 'mcp.json' },
  codex: { label: 'Codex', desc: '설정 파일에 붙여 넣고 Codex 를 재시작하세요.', code: CODEX_TOML, what: 'Codex 설정' },
}

const CHECKS: string[][] = [
  [`서버 목록에 ${SERVER_NAME} 가 연결됨으로 보이는지`, 'MCP: List Servers'],
  ['최근 실행 상태를 물었을 때 단계와 상태가 답으로 오는지', 'pipeline.status'],
  ['응답의 run_id 가 내 계정 접두어로 시작하는지', 'hanakim_2026…'],
]

export function McpConnect({ onToast }: Toast) {
  const nav = useNavigate()
  const [client, setClient] = useState<Client>('claude')
  const c = CLIENTS[client]

  return (
    <>
      <PageHead
        title="MCP 연결"
        desc="아래 세 단계를 순서대로 따라 하세요."
        actions={<span className="badge ok" title="엔드포인트 · 도구 스키마 · 실행 범위 · 클라이언트 호환성 점검 모두 정상">
          <i className="dot" />MCP 서버 정상
        </span>}
      />

      <Card>
        <div className="col" style={{ gap: 0 }}>
          <Step n={1} title="스킬 내려받기" desc="압축을 풀어 ~/.claude/skills/ 폴더에 넣으세요.">
            <div className="row wrap">
              <button className="btn" onClick={() => onToast('protein-pipeline-stepper.zip 내려받기 시작')}>
                <Download size={14} />스킬 내려받기
              </button>
              <span className="mono faint">protein-pipeline-stepper.zip</span>
            </div>
          </Step>

          <Step n={2} title="연결 설정 붙여 넣기" desc="쓰는 도구를 고르고 설정을 복사하세요.">
            <div className="col" style={{ gap: 12 }}>
              <div className="row wrap" style={{ gap: 12 }}>
                <Seg items={(Object.keys(CLIENTS) as Client[]).map(k => ({ key: k, label: CLIENTS[k].label }))}
                  value={client} onChange={setClient} />
                <span className="muted">{c.desc}</span>
              </div>
              <CodeBlock code={c.code} copyLabel="내 토큰 포함 복사" maxHeight={400}
                onCopy={() => onToast(`${c.what}를 내 토큰과 함께 복사했습니다`)} />
              <div className="row wrap muted">
                <KeyRound size={14} />
                <span>복사하면 90일짜리 API 키가 새로 발급되어 함께 들어갑니다.</span>
                <button className="btn sm ghost" onClick={() => nav('/keys')}>
                  API 키 관리<ArrowRight size={13} />
                </button>
              </div>
            </div>
          </Step>

          <Step n={3} title="연결 확인" desc="클라이언트를 재시작한 뒤 세 가지를 확인하세요.">
            <div className="tbl-wrap" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
              <table className="tbl">
                <thead><tr><th className="no">No.</th><th>확인할 내용</th><th>도구 · 명령</th></tr></thead>
                <tbody>
                  {CHECKS.map(([t, cmd], i) => (
                    <tr key={t}>
                      <td className="no">{i + 1}</td>
                      <td><div className="row"><Check size={14} color="var(--ok)" />{t}</div></td>
                      <td className="mono muted">{cmd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Step>
        </div>
      </Card>

      <Card title="프롬프트 예시">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>용도</th><th>프롬프트</th><th /></tr></thead>
            <tbody>
              {PROMPT_EXAMPLES.map((p, i) => (
                <tr key={p.title}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{p.title}</td>
                  <td className="muted">{p.body}</td>
                  <td>
                    <button className="btn sm ghost" title="복사" onClick={() => onToast(`"${p.title}" 프롬프트 복사됨`)}>
                      <Copy size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="서버 정보 · 권한 범위">
        <div className="grid g2">
          <dl className="kv" style={{ gridTemplateColumns: '112px 1fr', margin: 0 }}>
            <dt>서버 이름</dt><dd className="mono">{SERVER_NAME}</dd>
            <dt>주소</dt><dd className="mono">{ENDPOINT}</dd>
            <dt>전송 방식</dt><dd>HTTP 스트리밍 · JSON-RPC 2.0</dd>
            <dt>인증 헤더</dt><dd><span className="mono">Authorization: Bearer</span> + API 키</dd>
            <dt>스킬 경로</dt><dd className="mono">~/.claude/skills/</dd>
          </dl>
          <div className="col" style={{ gap: 10 }}>
            <div className="row wrap">
              <span className="muted">도구 목록 자동 축소 · 실행 소유권 검증</span>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

/* ============ MCP 도구 목록 ============ */

export function McpTools({ onToast }: Toast) {
  const [group, setGroup] = useState<string>('all')
  const [q, setQ] = useState('')
  const [adminOnly, setAdminOnly] = useState(false)
  /* 관리자 전용 도구는 관리자에게만 보인다. 다른 역할에는 있다는 사실도 드러내지 않는다. */
  const isAdmin = useRole() === 'admin'
  const catalog = isAdmin ? MCP_CATALOG : MCP_CATALOG.filter(t => !t.admin)
  const groups = MCP_GROUPS.filter(g => catalog.some(t => t.group === g))

  const kw = q.trim().toLowerCase()
  const tools = catalog.filter(t =>
    (group === 'all' || t.group === group) && (!adminOnly || t.admin) &&
    (!kw || t.name.toLowerCase().includes(kw) || t.desc.toLowerCase().includes(kw)))
  const count = (g: string) => catalog.filter(t => t.group === g).length

  return (
    <>
      <PageHead
        title="MCP 도구"
        desc="그룹을 골라 AI 클라이언트에서 부를 수 있는 도구와 권한을 확인하세요."
        actions={<button className="btn" onClick={() => onToast('MCP 도구 목록 CSV 내려받기')}>
          <Download size={14} />CSV 내려받기
        </button>}
      />

      <div className="chips">
        <button className={'chip' + (group === 'all' ? ' on' : '')} onClick={() => setGroup('all')}>
          전체<span className="c">{catalog.length}</span>
        </button>
        {groups.map(g => (
          <button key={g} className={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>
            {g}<span className="c">{count(g)}</span>
          </button>
        ))}
      </div>

      <Card title="MCP 도구" sub={`${tools.length}개 표시`} flush
        right={<>
          {isAdmin && (
            <label className="check">
              <input type="checkbox" checked={adminOnly} onChange={e => setAdminOnly(e.target.checked)} />
              <span>관리자 전용만</span>
            </label>
          )}
          <div className="search" style={{ width: 240 }}>
            <Search size={14} color="var(--text-3)" />
            <input placeholder="도구 이름이나 설명 검색" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </>}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="no">No.</th><th>도구</th><th>설명</th><th>그룹</th><th>권한</th></tr>
            </thead>
            <tbody>
              {tools.map((t, i) => (
                <tr key={t.name}>
                  <td className="no">{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{t.name}</td>
                  <td className="muted">{t.desc}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{t.group}</td>
                  <td>{t.admin ? <span className="badge err">관리자 전용</span> : <span className="muted">일반</span>}</td>
                </tr>
              ))}
              {tools.length === 0 && (
                <tr><td colSpan={5}><div className="empty">조건에 맞는 도구가 없습니다. 필터를 바꿔 보세요.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="호출 예시" sub="JSON-RPC 2.0">
        <CodeBlock onCopy={() => onToast('호출 예시 복사됨')} maxHeight={300} code={
`-> {"jsonrpc":"2.0","id":1,"method":"tools/list"}
<- {"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}

-> {"jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"pipeline.status",
              "arguments":{"run_id":"hanakim_20261005_101233_a7f2"}}}
<- {"jsonrpc":"2.0","id":2,"result":{
     "run_id":"hanakim_20261005_101233_a7f2",
     "found":true,
     "status":{"stage":"soluprot","state":"running"}}}

-> {"jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{"name":"pipeline.runpod_list_endpoints","arguments":{}}}
<- {"error":{"code":-32003,"message":"admin required"}}`} />
      </Card>

      <Card title="도구 노출 정책">
        <dl className="kv" style={{ gridTemplateColumns: '150px 1fr', margin: 0, lineHeight: 1.6 }}>
          <dt>목록에서 숨는 도구</dt>
          <dd>프로젝트 · 라운드, 단계별 실행 작업, 보고서, 평가, 실험, 근거 이벤트, 챗, 논문 분석, 모델 provider 도구는 기본 목록에서 숨지만 직접 호출은 됩니다. 설정에서 전체 노출을 켤 수 있습니다.</dd>
          <dt>provider 적용</dt>
          <dd>실행 계열 도구는 호출한 사용자의 모델 provider 설정으로 실행 대상을 정합니다.</dd>
          <dt>구성</dt>
          <dd><div className="row wrap">
            <span className="muted">실행 계열 15종 · 조회 계열 24종</span>
          </div></dd>
        </dl>
      </Card>
    </>
  )
}

/* ============ API 키 목록 ============ */

export function McpKeys({ onToast }: Toast) {
  const nav = useNavigate()
  const [keys, setKeys] = useState(keyStore)

  const revoke = (id: string) => {
    setKeys(saveKeys(keyStore.filter(k => k.id !== id)))
    onToast(`${id} 키를 폐기했습니다`)
  }

  return (
    <>
      <PageHead
        title="API 키"
        desc="쓰지 않는 키와 만료가 다가온 키를 정리하세요."
        actions={<button className="btn primary" onClick={() => nav('/keys/new')}>
          <Plus size={14} />새 API 키
        </button>}
      />

      <Card title="내 API 키" sub={`${keys.length}개`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th className="no">No.</th><th>라벨</th><th>식별자</th><th>생성</th><th>만료</th><th>최근 사용</th><th /></tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.id}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{k.label}</td>
                  <td className="mono muted">{k.id}</td>
                  <td className="muted">{k.created}</td>
                  <td>
                    {k.expires === '무기한' ? <span className="badge warn">무기한</span>
                      : expiresSoon(k.expires) ? <span className="badge warn">{k.expires} 만료 임박</span>
                        : <span className="muted">{k.expires}</span>}
                  </td>
                  <td className="muted">{k.lastUsed}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn sm danger" onClick={() => revoke(k.id)}><Trash2 size={13} />폐기</button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={7}><div className="empty">발급된 키가 없습니다. 새 API 키를 발급하세요.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ============ API 키 발급 ============ */

export function McpKeyNew({ onToast }: Toast) {
  const nav = useNavigate()
  const [label, setLabel] = useState('')
  const [ttl, setTtl] = useState<Ttl>('90')
  const [err, setErr] = useState('')
  const [issued, setIssued] = useState<{ label: string; value: string } | null>(null)

  const create = () => {
    if (!label.trim()) { setErr('라벨을 입력하세요. 예: my-laptop'); return }
    const id = 'pat_' + Math.random().toString(16).slice(2, 6)
    saveKeys([{
      id, label: label.trim(), created: '2026-10-06',
      expires: ttl === 'none' ? '무기한' : '2027-01-04', lastUsed: '-',
    }, ...keyStore])
    setIssued({ label: label.trim(), value: `kbfpat_${id}_${Math.random().toString(36).slice(2, 10)}X9kQ` })
    onToast('API 키 발급됨, 값은 1회만 표시됩니다')
  }

  return (
    <>
      <PageHead
        back={{ to: '/keys', label: 'API 키 목록' }}
        title="새 API 키"
        desc={issued ? '키 값을 지금 복사해 안전한 곳에 보관하세요.' : '라벨과 만료 기간을 정하고 발급하세요.'}
      />

      <div className="narrow">
        {issued ? (
          <IssuedOnce title={`${issued.label} 키를 발급했습니다`} value={issued.value}
            onCopy={() => onToast('키 값 복사됨')} onDone={() => nav('/keys')} />
        ) : (
          <Card>
            <div className="col" style={{ gap: 18 }}>
              <Field label="라벨" hint={err || '어디에서 쓰는 키인지 알아볼 수 있게 적으세요.'}>
                <input className="input" placeholder="my-laptop" value={label}
                  style={err ? { borderColor: 'var(--err)' } : undefined}
                  onChange={e => { setLabel(e.target.value); setErr('') }} />
              </Field>
              <Field label="만료 기간" hint={ttl === 'none' ? '무기한 키는 유출되면 위험합니다. 꼭 필요할 때만 고르세요.' : '기본은 90일입니다.'}>
                <div><Seg items={[...TTL_OPTIONS]} value={ttl} onChange={setTtl} /></div>
              </Field>
              <div className="divider" style={{ margin: 0 }} />
              <div className="row">
                <div className="sp" />
                <button className="btn" onClick={() => nav('/keys')}>취소</button>
                <button className="btn primary" onClick={create}><KeyRound size={14} />발급</button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

/* ============ 연계 계정 목록 ============ */

export function McpAccounts() {
  const nav = useNavigate()
  return (
    <>
      <PageHead
        title="연계 계정"
        desc="자동화 계정의 권한과 만료일을 확인하세요."
        actions={<button className="btn primary" onClick={() => nav('/rest/accounts/new')}>
          <Plus size={14} />연계 계정 발급
        </button>}
      />

      <Card title="외부 에이전트 · 자동화 계정" sub={`${LINKED_ACCOUNTS.length}개`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>계정</th><th>용도</th><th>권한 범위</th><th>마지막 사용</th><th>만료</th><th>상태</th></tr></thead>
            <tbody>
              {LINKED_ACCOUNTS.map((r, i) => (
                <tr key={r[0]}>
                  <td className="no">{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 500 }}>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td><div className="row wrap" style={{ gap: 4 }}>
                    {r[2].split(' ').map(s => <span key={s} className="badge mono">{s}</span>)}
                  </div></td>
                  <td className="muted">{r[3]}</td>
                  <td className="muted">{r[4]}</td>
                  <td><State s={r[5]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ============ 연계 계정 발급 ============ */

export function McpAccountNew({ onToast }: Toast) {
  const nav = useNavigate()
  const [scopes, setScopes] = useState<string[]>(['run:read', 'artifact:read', 'analyze:read'])
  const [issued, setIssued] = useState<string | null>(null)

  const toggle = (s: string) =>
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const issue = () => {
    setIssued(`kbfsvc_${Math.random().toString(36).slice(2, 14)}`)
    onToast('토큰 발급됨, 1회만 표시됩니다')
  }

  return (
    <>
      <PageHead
        back={{ to: '/rest/accounts', label: '연계 계정 목록' }}
        title="연계 계정 발급"
        desc={issued ? '토큰을 지금 복사해 연동할 시스템에 넣으세요.' : '필요한 권한만 골라 발급하세요.'}
      />

      <div className="narrow">
        {issued ? (
          <IssuedOnce title="연계 계정을 발급했습니다" value={issued}
            onCopy={() => onToast('토큰 복사됨')} onDone={() => nav('/rest/accounts')} />
        ) : (
          <Card>
            <div className="col" style={{ gap: 18 }}>
              <div className="grid g2">
                <Field label="계정 이름"><input className="input mono" placeholder="agent-svc-2" /></Field>
                <Field label="용도"><input className="input" placeholder="외부 IDE 에이전트 연동" /></Field>
              </div>
              <Field label="권한 범위" hint={`${scopes.length}개 선택 · 쓰기 권한은 꼭 필요할 때만 고르세요.`}>
                <div className="check-grid">
                  {SCOPES.map(s => (
                    <label key={s} className="check">
                      <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} />
                      <span className="mono">{s}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <div className="grid g2">
                <Field label="만료일"><input className="input" type="date" defaultValue="2026-12-31" /></Field>
                <Field label="허용 IP" hint="기관망 대역"><input className="input mono" defaultValue="10.12.0.0/16" /></Field>
              </div>
              <div className="divider" style={{ margin: 0 }} />
              <div className="row">
                <div className="sp" />
                <button className="btn" onClick={() => nav('/rest/accounts')}>취소</button>
                <button className="btn primary" disabled={scopes.length === 0} onClick={issue}>
                  <Plug size={14} />발급
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

/* ============ REST API 경로 ============ */

export function RestRoutes({ onToast }: Toast) {
  const total = HTTP_ROUTES.reduce((n, g) => n + g.rows.length, 0)
  /* 그룹 줄을 끼워 넣어도 No. 는 처음부터 이어서 센다. */
  const start = HTTP_ROUTES.map((_, gi) => HTTP_ROUTES.slice(0, gi).reduce((n, g) => n + g.rows.length, 0))

  return (
    <>
      <PageHead
        title="REST API"
        desc="기본 주소와 인증 방식을 확인한 뒤 필요한 경로를 호출하세요."
        actions={<button className="btn" onClick={() => onToast('OpenAPI 문서 열기')}>OpenAPI 문서</button>}
      />

      <Card>
        <dl className="kv" style={{ gridTemplateColumns: '96px 1fr', margin: 0 }}>
          <dt>기본 주소</dt><dd className="mono">https://rapid.kbiofoundry.kr</dd>
          <dt>인증</dt><dd><span className="mono">Authorization: Bearer</span> + API 키 또는 연계 계정 토큰</dd>
          <dt>형식</dt><dd>JSON · OpenAPI 3.1</dd>
        </dl>
      </Card>

      <Card title="공개 경로" sub={`${total}개`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>메서드</th><th>경로</th><th>권한</th><th>설명</th></tr></thead>
            <tbody>
              {HTTP_ROUTES.map((g, gi) => [
                <tr key={g.group} className="grp"><td colSpan={5}>{g.group}</td></tr>,
                ...g.rows.map((r, ri) => (
                    <tr key={r[0] + r[1]}>
                      <td className="no">{start[gi] + ri + 1}</td>
                      <td><span className={'badge method' + (r[0] === 'POST' ? ' brand' : '')}>{r[0]}</span></td>
                      <td className="mono">{r[1]}</td>
                      <td><span className="badge mono">{r[2]}</span></td>
                      <td className="muted">{r[3]}</td>
                    </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="호출 예시" sub="curl">
        <CodeBlock onCopy={() => onToast('명령 복사됨')} code={
`curl -X POST \\
  https://rapid.kbiofoundry.kr/api/v1/runs \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pipeline": "stability",
    "project": "prj-gfp",
    "input": { "pdb_id": "1EMA", "chains": ["A"] },
    "tiers": [30, 50, 70],
    "gates": ["soluprot"],
    "rerun_policy": "fork"
  }'`} />
      </Card>

      <Card title="모델 엔드포인트 결정 방식" sub="요청에는 모델 ID만 적습니다">
        <div className="col" style={{ gap: 14 }}>
          <CodeBlock onCopy={() => onToast('예시 복사됨')} code={
`"stages": {
  "af2": { "model": "colabfold@1.5.5" }
}
  ↓ registry lookup
endpoint: rp-serverless/colabfold-a100
image:    ghcr.io/kribb/colabfold:1.5.5
gpu:      A100 40GB`} />
        </div>
      </Card>
    </>
  )
}
