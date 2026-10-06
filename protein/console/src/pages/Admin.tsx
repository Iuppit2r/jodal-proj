import { useState } from 'react'
import { Download, Lock, RefreshCw, Save, ShieldCheck, UserPlus } from 'lucide-react'
import { Card, Field, GroupTitle, PageHead, Progress, Seg, Stat, State } from '../components/ui'
import { Bars } from '../components/viz'
import { AUDIT, PERMS } from '../data/mock'
import {
  ARTIFACT_STORE, COLLECTIONS, ENV_MATRIX, LOAD_TESTS, RELEASE_CHECKS, ROLE_LABEL, ROLE_MAP,
  SECRET_POLICY, SECURITY_CONTROLS, STABILIZATION, STATUS_LABEL, USERS,
  type UserRole, type UserStatus,
} from '../data/admin'
import {
  CAPS, PERM_CAP, SESSION_ROLE_LABEL, can, capRolesText, capWhere, useRole,
} from '../data/session'

const ROLE_KEYS: UserRole[] = ['user', 'model_manager', 'admin']
const STATUS_KEYS: UserStatus[] = ['approved', 'pending', 'disabled']

/* ============ 사용자 · 승인 ============ */

export function AdminUsers({ onToast }: { onToast: (m: string) => void }) {
  /* 사용자 생성 폼 */
  const [newUser, setNewUser] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('user')
  const [formMsg, setFormMsg] = useState('')

  /* 사용자 목록 (역할·상태 편집) */
  const [users, setUsers] = useState(USERS)
  const [uFilter, setUFilter] = useState<'all' | 'pending' | 'approved' | 'disabled'>('all')

  const rows = users.filter(u => uFilter === 'all' || u.status === uFilter)
  const pendingCount = users.filter(u => u.status === 'pending').length

  const createUser = () => {
    if (!newUser.trim()) { setFormMsg('계정 이름을 입력하세요.'); return }
    if (newPw.length < 8) { setFormMsg('비밀번호는 8자 이상이어야 합니다.'); return }
    setUsers(prev => [...prev, {
      username: newUser.trim(), role: newRole, status: 'approved', authType: '로컬',
      createdAt: '2026-10-06 방금', runPrefix: newUser.trim().replace(/[^a-z0-9]/gi, '').toLowerCase(),
    }])
    setFormMsg(`${newUser.trim()} 계정을 생성했습니다.`)
    onToast(`${newUser.trim()} 계정 생성, 역할 ${ROLE_LABEL[newRole]}`)
    setNewUser(''); setNewPw(''); setNewRole('user')
  }

  const setRole = (username: string, role: UserRole) =>
    setUsers(prev => prev.map(u => u.username === username ? { ...u, role } : u))
  const setStatus = (username: string, status: UserStatus) =>
    setUsers(prev => prev.map(u => u.username === username ? { ...u, status } : u))

  return (
    <>
      <PageHead
        title="사용자 · 승인"
        desc="대기 중인 계정을 승인하고 역할을 지정한 뒤 저장하세요."
        actions={<button className="btn" onClick={() => { setUsers(USERS); onToast('사용자 목록을 새로 불러왔습니다') }}>
          <RefreshCw size={14} />새로 고침
        </button>}
      />

      <div className="grid g4">
        <Stat label="전체 사용자" value={users.length} unit="명" />
        <Stat label="승인 대기" value={pendingCount} unit="명" delta="외부 계정 첫 접속" />
        <Stat label="Model Manager" value={users.filter(u => u.role === 'model_manager').length} unit="명" />
        <Stat label="관리자" value={users.filter(u => u.role === 'admin').length} unit="명" />
      </div>

      <Card title="사용자 목록" sub={`${rows.length}명 표시 중`} flush
        right={<Seg items={[
          { key: 'all', label: '전체' }, { key: 'pending', label: '승인 대기' },
          { key: 'approved', label: '승인' }, { key: 'disabled', label: '비활성' },
        ]} value={uFilter} onChange={setUFilter} />}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="no">No.</th><th>계정</th><th>인증</th><th style={{ width: 160 }}>역할</th>
                <th style={{ width: 150 }}>상태</th><th>생성</th><th>실행 접두어</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.username}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td className="muted">{u.authType}</td>
                  <td>
                    <select className="input" value={u.role} onChange={e => setRole(u.username, e.target.value as UserRole)}>
                      {ROLE_KEYS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input" value={u.status} onChange={e => setStatus(u.username, e.target.value as UserStatus)}>
                      {STATUS_KEYS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="faint">{u.createdAt}</td>
                  <td className="mono faint">{u.runPrefix}</td>
                  <td>
                    <button className="btn sm" onClick={() => onToast(`${u.username} 저장됨, 역할 ${ROLE_LABEL[u.role]} · 상태 ${STATUS_LABEL[u.status]}`)}>
                      <Save size={13} />저장
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8}><div className="empty">해당 조건의 사용자가 없습니다.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="사용자 생성" sub="로컬 계정 발급">
        <div className="col" style={{ gap: 16 }}>
          <div className="grid g3">
            <Field label="계정 이름" hint="username">
              <input className="input" placeholder="new.user" value={newUser}
                onChange={e => setNewUser(e.target.value)} />
            </Field>
            <Field label="비밀번호" hint="8자 이상">
              <input className="input" type="password" placeholder="8자 이상" value={newPw}
                onChange={e => setNewPw(e.target.value)} />
            </Field>
            <Field label="역할" hint="role">
              <select className="input" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                {ROLE_KEYS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </Field>
          </div>
          <div className="row">
            {formMsg && <span className="muted">{formMsg}</span>}
            <div className="sp" />
            <button className="btn primary" onClick={createUser}><UserPlus size={14} />사용자 생성</button>
          </div>
        </div>
      </Card>

    </>
  )
}

/* ============ 권한 매트릭스 ============ */

export function AdminRoles({ onToast }: { onToast: (m: string) => void }) {
  const role = useRole()
  return (
    <>
      <PageHead
        title="권한 매트릭스"
        desc="역할마다 어떤 기능이 허용되는지 확인하세요."
        actions={<button className="btn" onClick={() => onToast('권한 매트릭스 CSV 내려받기')}>
          <Download size={14} />매트릭스 내려받기
        </button>}
      />

        <Card title="역할 기반 접근제어" sub={`${PERMS.length}개 기능`}
          right={<span className="badge brand">현재 역할: {SESSION_ROLE_LABEL[role]}</span>}>
          <div className="row wrap">
            <span className="faint">맨 오른쪽 열은 지금 역할에 적용된 결과입니다.</span>
          </div>
          <div className="tbl-wrap" style={{ marginTop: 12 }}>
            <table className="tbl matrix">
              <thead><tr>
                <th className="no">No.</th><th>기능</th><th>관리자</th><th>연구자</th><th>일반 사용자</th><th>외부 연계</th>
                <th>현재 적용 상태</th>
              </tr></thead>
              <tbody>
                {PERMS.map((p, ri) => {
                  const cap = PERM_CAP[p.cap]
                  const ok = cap ? can(role, cap) : false
                  return (
                    <tr key={p.cap}><td className="no">{ri + 1}</td>
                      <td>{p.cap}</td>
                      {[p.admin, p.researcher, p.viewer, p.agent].map((v, i) => (
                        <td key={i} style={{ color: v ? 'var(--ok)' : 'var(--text-3)', fontWeight: v ? 600 : 400 }}>
                          {v ? '허용' : '-'}
                        </td>
                      ))}
                      <td>{ok
                        ? <span className="badge ok"><i className="dot" />사용 가능</span>
                        : <span className="badge warn"><i className="dot" />버튼 비활성</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      <Card title="권한이 적용되는 화면" sub={`기능 ${CAPS.length}종 · 표의 권한이 어느 화면 동작을 막는지 확인합니다`}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="no">No.</th><th>기능</th><th>허용 역할</th><th>적용 화면과 동작</th><th>현재 적용 상태</th>
            </tr></thead>
            <tbody>
              {CAPS.map((c, i) => (
                <tr key={c.cap}>
                  <td className="no">{i + 1}</td>
                  <td>{c.label}</td>
                  <td className="muted">{capRolesText(c.cap)}</td>
                  <td className="muted">{capWhere(c.cap)}</td>
                  <td>{can(role, c.cap)
                    ? <span className="badge ok"><i className="dot" />사용 가능</span>
                    : <span className="badge warn"><i className="dot" />버튼 비활성</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="역할 자동 매핑 · 역할별 권한 범위" sub={`ROLE_MAP.length건`}>
        <div className="grid g2">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>역할 정보</th><th>출처</th><th>플랫폼 역할</th></tr></thead>
              <tbody>
                {ROLE_MAP.map((r, i) => (
                  <tr key={r.claim + r.source}>
                    <td className="no">{i + 1}</td>
                    <td className="mono">{r.claim}</td>
                    <td className="muted">{r.source}</td>
                    <td><span className="badge brand mono">{r.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card title="실행 식별자 범위 제한 · 모델 관리 권한">
        <div className="grid g2">
          <div className="col" style={{ gap: 9 }}>
            <div className="log" style={{ maxHeight: 128 }}>
{`hanakim_20261005_101233_a7f2
  소유자 hana.kim · 조회 · 제어 가능

jiwonpark_20261004_221801_9b1c
  → run_id not allowed for this user`}
            </div>
            <div className="row wrap">
              <span className="muted">목록 자동 필터 · 소유권 검증 · 접두어 자동 부여</span>
            </div>
          </div>
          <div className="col" style={{ gap: 9 }}>
            <div className="faint" style={{ lineHeight: 1.6 }}>
              권한이 없는 상태에서 전체 기본값을 변경하면 model manager required 응답으로 차단됩니다.
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

export function AdminAudit({ onToast }: { onToast: (m: string) => void }) {
  return (
    <>
      <PageHead
        title="감사 로그"
        desc="누가 무엇을 바꿨는지 추적하고 필요하면 내보내세요."
        actions={<button className="btn" onClick={() => onToast('감사 로그 CSV 내보내기')}>
          <Download size={14} />감사 로그 내보내기
        </button>}
      />

      <div className="grid g4">
        <Stat label="오늘 기록" value={142} unit="건" />
        <Stat label="권한 거부" value={3} unit="건" delta="외부 연계 계정" />
        <Stat label="설정 변경" value={2} unit="건" />
        <Stat label="보관 기간" value={3} unit="년" delta="기관 정책 준수" />
      </div>

      <Card title="주요 행위 기록" sub={`${AUDIT.length}건`} flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>시각</th><th>행위자</th><th>역할</th><th>행위</th><th>대상</th><th>IP</th></tr></thead>
            <tbody>
              {AUDIT.map((a, i) => (
                <tr key={i}>
                  <td className="no">{i + 1}</td>
                  <td className="faint">{a.at}</td>
                  <td style={{ fontWeight: 500 }}>{a.actor}</td>
                  <td className="muted">{a.role}</td>
                  <td className="mono">{a.action}</td>
                  <td className="muted">{a.target}</td>
                  <td className="mono faint">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid g2">
        <Card title="행위 유형 분포" sub="최근 7일"><Bars data={[
          { label: '실행 · 제어', value: 412 }, { label: '산출물 조회 · 다운로드', value: 286 },
          { label: 'MCP / API 호출', value: 198, color: '#0ea5e9' },
          { label: '보고서 생성', value: 64 }, { label: '설정 · 모델 변경', value: 12, color: 'var(--warn)' },
        ]} unit="건" /></Card>
        <Card title="보고서 · 승인 아카이빙">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>보고서</th><th>버전</th><th>생성</th><th>승인</th></tr></thead>
              <tbody>
                {[
                  ['run_0421_ko.md', 'v2', '2026-10-05', '대기'],
                  ['run_0418_ko.md', 'v1', '2026-10-04', '김연구'],
                  ['run_0412_ko.md', 'v3', '2026-10-03', '김연구'],
                  ['run_0412_en.md', 'v1', '2026-10-03', '김연구'],
                  ['run_0409_ko.md', 'v1', '2026-09-30', '최연구'],
                ].map((r, i) => (
                  <tr key={r[0] + r[1]}>
                    <td className="no">{i + 1}</td>
                    <td className="mono">{r[0]}</td><td>{r[1]}</td><td className="faint">{r[2]}</td>
                    <td>{r[3] === '대기' ? <span className="badge warn">승인 대기</span> : r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}

export function AdminMigration({ onToast }: { onToast: (m: string) => void }) {
  return (
    <>
      <PageHead
        title="레거시 마이그레이션"
        desc="이관 진행률을 확인하고 수동 확인이 필요한 항목을 처리하세요."
        actions={<button className="btn" onClick={() => onToast('이관 작업 재시작 요청')}>
          <RefreshCw size={14} />이관 재시작
        </button>}
      />

      <div className="grid g-2-1">
        <Card title="이관 현황" sub="원본 경로별 진행" flush>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>원본 경로</th><th className="num">실행 수</th><th className="num">용량</th><th style={{ width: 140 }}>진행</th><th>상태</th></tr></thead>
              <tbody>
                {[
                  ['outputs/2025-H2/', 182, '480 GB', 100, 'done'],
                  ['outputs/2026-H1/', 416, '1.2 TB', 100, 'done'],
                  ['outputs/2026-H2/', 298, '910 GB', 68, 'running'],
                  ['outputs/archive-notebooks/', 64, '120 GB', 0, 'queued'],
                  ['outputs/legacy-unstructured/', 41, '88 GB', 0, 'failed'],
                ].map((r, i) => (
                  <tr key={r[0] as string}>
                    <td className="no">{i + 1}</td>
                    <td className="mono">{r[0]}</td>
                    <td className="num">{r[1]}</td>
                    <td className="num">{r[2]}</td>
                    <td><Progress v={r[3] as number} />
                      <div className="faint">{r[3]}%</div></td>
                    <td><State s={r[4] as string} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="col" style={{ gap: 16 }}>
          <Card title="변환 규칙">
            <div className="col" style={{ gap: 8 }}>
              {[
                ['디렉터리명 → run_id', '경로 해시 기반 안정 ID 부여'],
                ['config.yaml → run.request', '파라미터 키 매핑 테이블 적용'],
                ['stage 디렉터리 → artifacts', 'stage·kind 자동 분류'],
                ['로그 파일 → run_events', '타임스탬프 파싱 후 이벤트 변환'],
                ['누락 모델 버전', '실행 시점 기준 추정 후 estimated 표시'],
              ].map(([a, b]) => (
                <div key={a}>
                  <div style={{ fontWeight: 500 }}>{a}</div>
                  <div className="faint">{b}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="검증 결과">
            <div className="col" style={{ gap: 9 }}>
              {[
                ['변환 실행 조회 가능', 'ok'], ['아티팩트 경로 유효성', 'ok'],
                ['지표 값 일치 (표본 50건)', 'ok'], ['모델 버전 확정', 'warn'],
                ['비정형 결과 변환', 'err'],
              ].map(([k, s]) => (
                <div key={k} className="row">
                  <span>{k}</span><div className="sp" />
                  <span className={'badge ' + s}>{s === 'ok' ? '통과' : s === 'warn' ? '일부 추정' : '수동 확인'}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="faint" style={{ lineHeight: 1.6 }}>
                비정형 결과 41건은 자동 변환 대상에서 제외되어 담당 연구자 확인 후 개별 이관합니다.
              </div>
              <button className="btn" onClick={() => onToast('검증 결과서 다운로드')}><Download size={14} />검증 결과서</button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ============ 보안 운영 기준 (SER-003 ~ SER-006) ============ */

export function AdminSecurity({ onToast }: { onToast: (m: string) => void }) {
  return (
    <>
      <PageHead
        title="보안 운영 기준"
        desc="릴리스 전 점검을 실행하고 적용 중인 보안 조치를 확인하세요."
        actions={<button className="btn primary" onClick={() => onToast('보안 점검을 실행했습니다')}>
          <ShieldCheck size={14} />보안 점검 실행
        </button>}
      />

      <Card title="릴리스 전 점검" sub="최근 점검 2026-10-05 · 통과"
        right={<button className="btn sm" onClick={() => onToast('점검 결과서 다운로드')}><Download size={13} />결과서</button>}>
        <div className="col" style={{ gap: 9 }}>
          {RELEASE_CHECKS.map(k => (
            <label key={k} className="check">
              <input type="checkbox" defaultChecked onChange={() => onToast('점검 항목 상태를 변경했습니다')} />
              <span>{k}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="적용 중인 보안 조치">
        <div className="grid g2" style={{ gap: 16 }}>
          {SECURITY_CONTROLS.map(g => (
            <div key={g.group} className="col" style={{ gap: 9 }}>
              <div style={{ fontWeight: 500 }}>{g.group}</div>
              {g.items.map(k => (
                <div key={k} className="row">
                  <Lock size={12} color="var(--text-3)" />
                  <span style={{ minWidth: 0 }}>{k}</span>
                  <div className="sp" />
                  <span className="badge ok">적용</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <GroupTitle title="기준 문서" />

      <Card title="인증 방식">
        <div className="col" style={{ gap: 16 }}>
          {[
            ['OIDC / 기관 통합 인증', 'Keycloak 또는 기관 계정으로 접속하며 범위는 openid profile email 입니다. 역할은 클라이언트·렐름 역할에서 자동 매핑됩니다.'],
            ['로컬 로그인', '관리자 계정과 예외 계정을 서버 저장소에 보관합니다. 발급된 토큰은 24시간 후 만료됩니다.'],
            ['장기 API 키 (PAT)', '접두어 kbfpat_ 로 발급되며 기본 유효기간은 90일입니다. 값은 해시로만 보관하고 언제든 폐기할 수 있습니다.'],
            ['세션 쿠키', '쿠키 이름 kbf_session 으로 화면 접속 상태를 유지하며 보안 속성과 전송 범위가 설정으로 고정됩니다.'],
            ['외부 연계 토큰', '자동화 · 에이전트 계정에 발급하는 토큰으로 REST API 연동의 연계 계정 화면에서 관리합니다.'],
          ].map(([k, v]) => (
            <div key={k} className="col" style={{ gap: 4 }}>
              <div className="row">
                <span style={{ fontWeight: 500 }}>{k}</span><div className="sp" /><State s="active" />
              </div>
              <div className="faint" style={{ lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="환경별 운영 기준" sub="공개 범위와 인증 수단">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>환경</th><th>이용 대상</th><th>공개 주소</th><th>보호 수단</th><th>인증</th></tr></thead>
            <tbody>
              {ENV_MATRIX.map((e, i) => (
                <tr key={e.env}>
                  <td className="no">{i + 1}</td>
                  <td><span className={'badge ' + (e.env === 'production' ? 'err' : e.env === 'staging' ? 'warn' : '')}>{e.env}</span></td>
                  <td>{e.audience}</td>
                  <td className="muted">{e.url}</td>
                  <td className="muted">{e.guard}</td>
                  <td className="muted">{e.auth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="시크릿 보관 위치" sub="값은 화면에 싣지 않고 이름과 위치만 둡니다">
        <div className="col" style={{ gap: 14 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="no">No.</th><th>이름</th><th>등급</th><th>보관 위치</th></tr></thead>
              <tbody>
                {SECRET_POLICY.map((s, i) => (
                  <tr key={s.key}>
                    <td className="no">{i + 1}</td>
                    <td className="mono">{s.key}</td>
                    <td><span className={'badge ' + (s.kind === '민감' ? 'err' : 'warn')}>{s.kind}</span></td>
                    <td className="muted">{s.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="faint">값은 어느 화면에도 표시하지 않습니다.</div>
        </div>
      </Card>

      <Card title="리버스 프록시 요건" sub="외부 공개 경로">
        <div className="col" style={{ gap: 9 }}>
          {[
            'TLS 종료 및 인증서 자동 갱신',
            '백엔드는 루프백 바인딩 유지',
            '/api 경로 프록시 및 상한 설정',
            '검증 환경 기본 인증 또는 위임 인증',
            '허용 출처 목록 고정',
          ].map(k => (
            <div key={k} className="row">
              <span style={{ minWidth: 0 }}>{k}</span><div className="sp" />
              <span className="badge ok">충족</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ============ 데이터 저장소 (DAR-004, DAR-009) ============ */

export function AdminData({ onToast }: { onToast: (m: string) => void }) {
  const totalDocs = COLLECTIONS.reduce((n, c) => n + Number(c.docs.replace(/,/g, '')), 0)
  return (
    <>
      <PageHead
        title="데이터 저장소"
        desc="컬렉션과 아티팩트 사용량을 확인하고 보존 정책을 점검하세요."
        actions={<button className="btn" onClick={() => onToast('스키마 정의서 다운로드')}>
          <Download size={14} />스키마 정의서
        </button>}
      />

      <div className="grid g3">
        <Stat label="컬렉션" value={COLLECTIONS.length} unit="개" delta="MongoDB" />
        <Stat label="문서" value={totalDocs.toLocaleString()} delta="메타데이터 전체" />
        <Stat label="아티팩트 용량" value="2.4" unit="TB" delta="파일 419,863개" />
      </div>

      <Card title="MongoDB 컬렉션" flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>컬렉션</th><th>내용</th><th className="num">문서</th><th className="num">용량</th><th>주요 키</th></tr></thead>
            <tbody>
              {COLLECTIONS.map((c, i) => (
                <tr key={c.name}>
                  <td className="no">{i + 1}</td>
                  <td className="mono" style={{ fontWeight: 500 }}>{c.name}</td>
                  <td className="muted">{c.desc}</td>
                  <td className="num">{c.docs}</td>
                  <td className="num">{c.size}</td>
                  <td className="mono muted">{c.keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="아티팩트 저장소" sub="실행별 디렉터리로 나누어 보관" flush
        right={<button className="btn sm" onClick={() => onToast('저장 규칙서 다운로드')}>저장 규칙서</button>}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="no">No.</th><th>종류</th><th>경로</th><th className="num">용량</th><th className="num">파일</th><th>보존 기간</th></tr></thead>
            <tbody>
              {ARTIFACT_STORE.map((a, i) => (
                <tr key={a.kind}>
                  <td className="no">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{a.kind}</td>
                  <td className="mono muted">{a.path}</td>
                  <td className="num">{a.size}</td>
                  <td className="num">{a.files}</td>
                  <td><span className={'badge ' + (a.keep === '영구' ? 'brand' : '')}>{a.keep}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="보존 · 정리 정책">
        <div className="col" style={{ gap: 14 }}>
          {[
            ['보고서는 지우지 않습니다', '보고서와 승인 기록은 감사 대상이라 보존 기간을 두지 않습니다.'],
            ['로그는 6개월 뒤 압축 보관', '압축한 뒤 조회 전용으로 옮기고, 1년이 지나면 삭제합니다.'],
            ['구조 파일은 2년 보관', '보관 기간이 지나면 담당 연구자에게 알리고 확인 후 정리합니다.'],
            ['실행을 지워도 메타데이터는 남습니다', '어떤 설정으로 무엇을 돌렸는지는 추적할 수 있도록 유지합니다.'],
          ].map(([k, v]) => (
            <div key={k} className="col" style={{ gap: 4 }}>
              <div style={{ fontWeight: 500 }}>{k}</div>
              <div className="faint" style={{ lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
          <div className="divider" />
          <button className="btn" onClick={() => onToast('정리 대상 조회, 구조 파일 1,284건')}>정리 대상 조회</button>
        </div>
      </Card>
    </>
  )
}

/* ============ 성능 · 동시접속 (SFR-024) ============ */

export function AdminPerformance({ onToast }: { onToast: (m: string) => void }) {
  const allPass = LOAD_TESTS.every(t => t.pass)
  return (
    <>
      <PageHead
        title="성능 · 동시접속"
        desc="부하 시험 결과와 안정화 조치를 확인하세요."
        actions={<button className="btn" onClick={() => onToast('부하 시험 결과서 다운로드')}>
          <Download size={14} />결과서
        </button>}
      />

      <div className="grid g3">
        <Stat label="동시 접속" value={30} unit="명" delta="시험 기준 인원" />
        <Stat label="최대 응답 시간" value="5.8" unit="초" delta="구조 비교 p95" />
        <Stat label="판정" value={allPass ? '충족' : '미충족'} delta={`시나리오 ${LOAD_TESTS.length}종`} />
      </div>

      <Card title="부하 시험 결과" flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="no">No.</th><th>시나리오</th><th className="num">동시 사용자</th>
              <th className="num">중간값</th><th className="num">상위 5%</th><th className="num">오류율</th><th>판정</th>
            </tr></thead>
            <tbody>
              {LOAD_TESTS.map((t, i) => (
                <tr key={t.scenario}>
                  <td className="no">{i + 1}</td>
                  <td>{t.scenario}</td>
                  <td className="num">{t.users}명</td>
                  <td className="num">{t.p50}</td>
                  <td className="num">{t.p95}</td>
                  <td className="num">{t.errRate}</td>
                  <td>{t.pass
                    ? <span className="badge ok"><i className="dot" />충족</span>
                    : <span className="badge warn"><i className="dot" />확인 필요</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="안정화 적용 내역" sub={`${STABILIZATION.length}건`}>
        <div className="col" style={{ gap: 14 }}>
          {STABILIZATION.map(s => (
            <div key={s.item} className="col" style={{ gap: 4 }}>
              <div className="row">
                <span style={{ fontWeight: 500 }}>{s.item}</span>
                <div className="sp" />
                <span className="badge ok">적용</span>
              </div>
              <div className="faint" style={{ lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
