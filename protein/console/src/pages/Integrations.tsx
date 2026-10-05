import { useState } from 'react'
import { Copy, KeyRound, Plug, Plus } from 'lucide-react'
import { Card, Field, Modal, PageHead, State, Tabs } from '../components/ui'
import { MCP_TOOLS } from '../data/mock'

export default function Integrations({ onToast }: { onToast: (m: string) => void }) {
  const [tab, setTab] = useState<'mcp' | 'http' | 'keys'>('mcp')
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHead
        title="외부 연계"
        desc="MCP 도구 서버와 HTTP Tool API를 통해 외부 IDE·에이전트·자동화 스크립트가 동일 권한 체계로 플랫폼을 사용합니다."
        req="SFR-013 · SIR-001 · SIR-002"
        actions={<>
          <button className="btn" onClick={() => onToast('OpenAPI 문서 열기')}>OpenAPI 문서</button>
          <button className="btn primary" onClick={() => setOpen(true)}><Plus size={14} />연계 계정 발급</button>
        </>}
      />

      <Tabs items={[
        { key: 'mcp', label: 'MCP 도구 서버' },
        { key: 'http', label: 'HTTP Tool API' },
        { key: 'keys', label: '연계 계정 · 키' },
      ]} value={tab} onChange={setTab} />

      {tab === 'mcp' && (
        <div className="grid g-2-1">
          <Card title="도구 목록" sub={`${MCP_TOOLS.length}개 · JSON-RPC 2.0`} req="SIR-001" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>도구</th><th>필요 권한</th><th>설명</th></tr></thead>
                <tbody>
                  {MCP_TOOLS.map(t => (
                    <tr key={t.name}>
                      <td className="mono" style={{ fontWeight: 500 }}>{t.name}</td>
                      <td><span className="badge">{t.scope}</span></td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="col" style={{ gap: 14 }}>
            <Card title="연결 설정" sub="외부 IDE / 에이전트"
              right={<button className="btn sm" onClick={() => onToast('설정 JSON 복사됨')}><Copy size={13} /></button>}>
              <div className="log" style={{ maxHeight: 200 }}>
{`{
  "mcpServers": {
    "protein-platform": {
      "url": "https://rapid.kbiofoundry.kr/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer <AGENT_TOKEN>"
      }
    }
  }
}`}
              </div>
            </Card>
            <Card title="호출 예시">
              <div className="log" style={{ maxHeight: 230 }}>
{`-> {"jsonrpc":"2.0","id":1,"method":"tools/list"}
<- {"jsonrpc":"2.0","id":1,"result":{"tools":[...10]}}

-> {"jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"run_status",
              "arguments":{"run_id":"run_0421"}}}
<- {"jsonrpc":"2.0","id":2,"result":{
     "status":"gate","stage":"soluprot",
     "pass_rate":0.265,"gate_pending":true}}

-> {"jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{"name":"run_continue",
              "arguments":{"run_id":"run_0421",
                           "scope":"top_200"}}}
<- {"error":{"code":-32003,
     "message":"forbidden: scope run:write required"}}`}
              </div>
            </Card>
            <Card title="연계 상태">
              <div className="col" style={{ gap: 9 }}>
                {[
                  ['MCP 엔드포인트', 'healthy'], ['도구 스키마 검증', 'healthy'],
                  ['run 스코프 검증', 'healthy'], ['표준 클라이언트 호환성 시험', 'healthy'],
                ].map(([k, s]) => (
                  <div key={k} className="row" style={{ fontSize: 12.5 }}>
                    <span>{k}</span><div className="sp" /><State s={s} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'http' && (
        <div className="grid g-2-1">
          <Card title="HTTP Tool API" sub="OpenAPI 3.1" req="SIR-002" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>메서드</th><th>경로</th><th>권한</th><th>설명</th></tr></thead>
                <tbody>
                  {[
                    ['POST', '/api/v1/runs', 'run:write', 'run 생성 (정형 Stage 또는 DAG 템플릿)'],
                    ['GET', '/api/v1/runs', 'run:read', 'run 목록 조회 (필터·커서 페이지네이션)'],
                    ['GET', '/api/v1/runs/{id}', 'run:read', 'run 상세 · 단계 상태 · 메타데이터'],
                    ['GET', '/api/v1/runs/{id}/events', 'run:read', '이벤트 로그 스트림 (SSE)'],
                    ['POST', '/api/v1/runs/{id}/continue', 'run:write', '체크포인트 승인 후 재개'],
                    ['POST', '/api/v1/runs/{id}/fork', 'run:write', '조건 변경 분기 실행'],
                    ['GET', '/api/v1/runs/{id}/artifacts', 'artifact:read', '산출물 목록'],
                    ['GET', '/api/v1/artifacts/{key}/url', 'artifact:read', '서명 다운로드 URL 발급'],
                    ['POST', '/api/v1/compare', 'analyze:read', 'run 간 / 후보 간 비교'],
                    ['GET', '/api/v1/hits', 'analyze:read', '가중 랭킹 조회'],
                    ['POST', '/api/v1/reports', 'report:write', '보고서 생성 (국문/영문)'],
                    ['GET', '/api/v1/models', 'model:read', 'Model Registry 조회'],
                    ['POST', '/api/v1/models', 'model:write', '모델 등록 요청 (승인 필요)'],
                    ['GET', '/api/v1/endpoints', 'ops:read', 'GPU 엔드포인트 상태'],
                  ].map(r => (
                    <tr key={r[1] + r[0]}>
                      <td><span className={'badge ' + (r[0] === 'POST' ? 'brand' : '')}>{r[0]}</span></td>
                      <td className="mono">{r[1]}</td>
                      <td><span className="badge">{r[2]}</span></td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="col" style={{ gap: 14 }}>
            <Card title="동적 라우팅" sub="Model Registry 연계" req="SIR-003">
              <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.65 }}>
                실행 요청은 모델 ID와 버전만 지정하며, 실제 엔드포인트 URL은 Registry에서 조회되어 런타임에 결정됩니다. 엔드포인트가 변경되어도 클라이언트 수정이 필요하지 않습니다.
              </div>
              <div className="divider" />
              <div className="log" style={{ maxHeight: 150 }}>
{`"stages": {
  "af2": { "model": "colabfold@1.5.5" }
}
  ↓ registry lookup
endpoint: rp-serverless/colabfold-a100
image:    ghcr.io/kribb/colabfold:1.5.5
gpu:      A100 40GB`}
              </div>
            </Card>
            <Card title="호출 예시 (curl)"
              right={<button className="btn sm" onClick={() => onToast('명령 복사됨')}><Copy size={13} /></button>}>
              <div className="log" style={{ maxHeight: 200 }}>
{`curl -X POST \\
  https://rapid.kbiofoundry.kr/api/v1/runs \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pipeline": "stability",
    "project": "prj-gfp",
    "input": { "pdb_id": "1EMA", "chains": ["A"] },
    "tiers": [30, 50],
    "gates": ["soluprot"],
    "rerun_policy": "fork"
  }'`}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="grid g-2-1">
          <Card title="연계 계정" sub="외부 에이전트 · 자동화" req="SER-001" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>계정</th><th>용도</th><th>권한 범위</th><th>마지막 사용</th><th>만료</th><th>상태</th></tr></thead>
                <tbody>
                  {[
                    ['agent-svc', '외부 IDE 에이전트 (MCP)', 'run:read artifact:read analyze:read', '2026-10-05 09:02', '2026-12-31', 'active'],
                    ['ci-report', '야간 보고서 배치', 'report:write run:read', '2026-10-05 02:00', '2027-03-31', 'active'],
                    ['lab-notebook', '전자연구노트 연동', 'artifact:read', '2026-10-03 16:44', '2026-11-30', 'active'],
                    ['legacy-script', '구 스크립트 (마이그레이션 대상)', 'run:read', '2026-08-12 11:20', '2026-09-30', 'disabled'],
                  ].map(r => (
                    <tr key={r[0]}>
                      <td className="mono" style={{ fontWeight: 500 }}>{r[0]}</td>
                      <td>{r[1]}</td>
                      <td><span className="mono faint" style={{ fontSize: 11 }}>{r[2]}</span></td>
                      <td className="faint">{r[3]}</td>
                      <td className="faint">{r[4]}</td>
                      <td><State s={r[5]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="시크릿 관리" req="SER-005">
            <div className="col" style={{ gap: 9 }}>
              {[
                ['RUNPOD_API_KEY', 'rp_•••••••••••••4f2a', '2026-09-01'],
                ['MONGODB_URI', 'mongodb+srv://•••••', '2026-07-15'],
                ['OIDC_CLIENT_SECRET', '•••••••••••••••••', '2026-08-20'],
                ['ARTIFACT_SIGNING_KEY', '•••••••••••••••••', '2026-09-28'],
              ].map(([k, v, d]) => (
                <div key={k}>
                  <div className="row" style={{ fontSize: 12.5 }}>
                    <span className="mono" style={{ fontWeight: 500 }}>{k}</span>
                    <div className="sp" />
                    <KeyRound size={12} color="var(--text-3)" />
                  </div>
                  <div className="row faint mono" style={{ fontSize: 11, marginTop: 2 }}>
                    <span>{v}</span><div className="sp" /><span>교체 {d}</span>
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                시크릿은 분리 저장되며 환경변수·로그·설정 파일 노출 시 자동 마스킹됩니다. 값 조회는 관리자 권한에서만 가능하고 모든 접근이 감사 로그에 기록됩니다.
              </div>
              <button className="btn" onClick={() => onToast('키 교체 요청 — 관리자 승인 필요')}>키 교체 요청</button>
            </div>
          </Card>
        </div>
      )}

      {open && (
        <Modal title="연계 계정 발급" onClose={() => setOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => { setOpen(false); onToast('토큰 발급됨 — 1회만 표시됩니다') }}>발급</button>
          </>}>
          <Field label="계정 이름"><input className="input mono" placeholder="agent-svc-2" /></Field>
          <Field label="용도"><input className="input" placeholder="외부 IDE 에이전트 연동" /></Field>
          <Field label="권한 범위" hint="최소 권한 원칙에 따라 필요한 범위만 선택합니다.">
            <div className="col" style={{ gap: 5, marginTop: 2 }}>
              {[['run:read', true], ['run:write', false], ['artifact:read', true], ['analyze:read', true],
                ['report:write', false], ['model:read', false], ['model:write', false], ['ops:read', false]].map(([s, d]) => (
                <label key={s as string} className="check">
                  <input type="checkbox" defaultChecked={d as boolean} />
                  <span className="mono" style={{ fontSize: 12 }}>{s}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="만료일"><input className="input" type="date" defaultValue="2026-12-31" /></Field>
            <Field label="허용 IP" hint="기관망 대역"><input className="input mono" defaultValue="10.12.0.0/16" /></Field>
          </div>
          <div className="signal warn">
            <span className="ic"><Plug size={15} color="var(--warn)" /></span>
            <div><b>토큰 표시 정책</b>
              <p>발급된 토큰은 생성 직후 1회만 표시됩니다. 분실 시 재발급해야 하며 발급·폐기 이력은 감사 로그에 남습니다.</p></div>
          </div>
        </Modal>
      )}
    </>
  )
}
