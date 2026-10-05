import { useState } from 'react'
import { Database, Download, Lock, ShieldCheck } from 'lucide-react'
import { Card, PageHead, Progress, Stat, State, Tabs } from '../components/ui'
import { Bars } from '../components/viz'
import { AUDIT, PERMS } from '../data/mock'

export default function Admin({ onToast }: { onToast: (m: string) => void }) {
  const [tab, setTab] = useState<'perms' | 'audit' | 'data' | 'migration'>('perms')

  return (
    <>
      <PageHead
        title="보안 · 데이터 운영"
        desc="권한 체계, 감사 로그, 데이터 저장소, 레거시 마이그레이션을 관리합니다."
        req="SER-001~008 · DAR-004 · DAR-007"
        actions={<>
          <button className="btn" onClick={() => onToast('감사 로그 CSV 내보내기')}><Download size={14} />감사 로그 내보내기</button>
          <button className="btn primary"><ShieldCheck size={14} />보안 점검 실행</button>
        </>}
      />

      <Tabs items={[
        { key: 'perms', label: '권한 · 인증' },
        { key: 'audit', label: '감사 로그' },
        { key: 'data', label: '데이터 저장소' },
        { key: 'migration', label: '레거시 마이그레이션' },
      ]} value={tab} onChange={setTab} />

      {tab === 'perms' && (
        <div className="grid g-2-1">
          <Card title="권한 매트릭스" sub="역할 기반 접근제어" req="SER-001" flush>
            <div className="tbl-wrap">
              <table className="tbl matrix">
                <thead><tr><th>기능</th><th>관리자</th><th>연구자</th><th>일반 사용자</th><th>외부 연계</th></tr></thead>
                <tbody>
                  {PERMS.map(p => (
                    <tr key={p.cap}>
                      <td>{p.cap}</td>
                      {[p.admin, p.researcher, p.viewer, p.agent].map((v, i) => (
                        <td key={i} style={{ color: v ? 'var(--ok)' : 'var(--text-3)', fontWeight: v ? 600 : 400 }}>
                          {v ? '허용' : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="col" style={{ gap: 14 }}>
            <Card title="인증 연동" req="SER-002">
              <div className="col" style={{ gap: 9 }}>
                {[
                  ['OIDC / SSO (기관 계정)', 'active'], ['토큰 검증 · 세션 종료', 'active'],
                  ['로컬 계정 (예비)', 'disabled'], ['외부 연계 토큰', 'active'],
                ].map(([k, s]) => (
                  <div key={k} className="row" style={{ fontSize: 12.5 }}>
                    <span>{k}</span><div className="sp" /><State s={s} />
                  </div>
                ))}
                <div className="divider" />
                <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                  운영 환경에서는 기관 통합 인증을 우선 사용하며, 로그인 시 역할이 자동 매핑됩니다.
                </div>
              </div>
            </Card>
            <Card title="보안 점검 현황">
              <div className="col" style={{ gap: 9 }}>
                {[
                  ['전송 구간 TLS 적용', 'SER-004'], ['저장 데이터 암호화', 'SER-003'],
                  ['시크릿 마스킹', 'SER-005'], ['실행 노드 컨테이너 격리', 'SER-006'],
                  ['네트워크 정책 · 자원 제한', 'SER-006'], ['감사 로그 기록', 'SER-007'],
                  ['사용자 정의 모델 승인 절차', 'SER-008'],
                ].map(([k, r]) => (
                  <div key={k} className="row" style={{ fontSize: 12.5 }}>
                    <Lock size={12} color="var(--text-3)" />
                    <span style={{ minWidth: 0 }}>{k}</span>
                    <div className="sp" />
                    <span className="req" style={{ margin: 0 }}>{r}</span>
                    <span className="badge ok">적용</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="col" style={{ gap: 14 }}>
          <div className="grid g4">
            <Stat label="오늘 기록" value={142} unit="건" />
            <Stat label="권한 거부" value={3} unit="건" delta="외부 연계 계정" />
            <Stat label="설정 변경" value={2} unit="건" />
            <Stat label="보관 기간" value={3} unit="년" delta="기관 정책 준수" />
          </div>
          <Card title="감사 로그" sub="주요 행위 추적" req="SER-007" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>시각</th><th>행위자</th><th>역할</th><th>행위</th><th>대상</th><th>IP</th></tr></thead>
                <tbody>
                  {AUDIT.map((a, i) => (
                    <tr key={i}>
                      <td className="mono faint">{a.at}</td>
                      <td style={{ fontWeight: 500 }}>{a.actor}</td>
                      <td><span className="badge">{a.role}</span></td>
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
              { label: 'run 실행 · 제어', value: 412 }, { label: '산출물 조회 · 다운로드', value: 286 },
              { label: 'MCP / API 호출', value: 198, color: '#3b5bdb' },
              { label: '보고서 생성', value: 64 }, { label: '설정 · 모델 변경', value: 12, color: 'var(--warn)' },
            ]} unit="건" /></Card>
            <Card title="보고서 · 승인 아카이빙" req="DAR-008">
              <div className="tbl-wrap">
                <table className="tbl" style={{ fontSize: 12 }}>
                  <thead><tr><th>보고서</th><th>버전</th><th>생성</th><th>승인</th></tr></thead>
                  <tbody>
                    {[
                      ['run_0421_ko.md', 'v2', '2026-10-05', '대기'],
                      ['run_0418_ko.md', 'v1', '2026-10-04', '김연구'],
                      ['run_0412_ko.md', 'v3', '2026-10-03', '김연구'],
                      ['run_0412_en.md', 'v1', '2026-10-03', '김연구'],
                      ['run_0409_ko.md', 'v1', '2026-09-30', '최연구'],
                    ].map(r => (
                      <tr key={r[0] + r[1]}>
                        <td className="mono">{r[0]}</td><td>{r[1]}</td><td className="faint">{r[2]}</td>
                        <td>{r[3] === '대기' ? <span className="badge warn">승인 대기</span> : r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="col" style={{ gap: 14 }}>
          <div className="grid g4">
            <Stat label="MongoDB 컬렉션" value={11} icon={<Database size={13} />} />
            <Stat label="run 메타데이터" value="1,284" unit="건" />
            <Stat label="아티팩트" value="48,210" unit="개" />
            <Stat label="저장소 사용" value="3.4" unit="TB" delta="여유 2.1 TB" />
          </div>
          <div className="grid g2">
            <Card title="MongoDB 스키마" sub="메타데이터 · 작업 데이터" req="DAR-009" flush>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>컬렉션</th><th>용도</th><th className="num">문서 수</th><th>주요 인덱스</th></tr></thead>
                  <tbody>
                    {[
                      ['runs', 'run 요청값·상태·단계 이력', '1,284', 'run_id, project, created_at'],
                      ['run_events', '단계 이벤트 로그', '96,402', 'run_id, ts'],
                      ['artifacts', '산출물 메타데이터·경로', '48,210', 'run_id, stage, kind'],
                      ['candidates', '후보 서열·지표', '412,880', 'run_id, score'],
                      ['comparisons', 'run 간 / 후보 간 비교 결과', '3,106', 'run_ids'],
                      ['hit_lists', '가중 랭킹 스냅샷', '1,842', 'run_id, weights_hash'],
                      ['models', 'Model Registry', '9', 'model_id, version'],
                      ['model_versions', '버전 변경 이력', '41', 'model_id, applied_at'],
                      ['projects', '프로젝트·라운드·태스크', '4', 'project_id'],
                      ['feedback', '사용자 피드백·실험 기록', '186', 'project_id, run_id'],
                      ['audit_logs', '감사 로그', '142,610', 'actor, ts, action'],
                    ].map(r => (
                      <tr key={r[0]}>
                        <td className="mono" style={{ fontWeight: 500 }}>{r[0]}</td>
                        <td className="muted" style={{ fontSize: 12.5 }}>{r[1]}</td>
                        <td className="num">{r[2]}</td>
                        <td className="mono faint" style={{ fontSize: 11 }}>{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <div className="col" style={{ gap: 14 }}>
              <Card title="아티팩트 저장소" req="DAR-004">
                <div className="col" style={{ gap: 10 }}>
                  <div>
                    <div className="row" style={{ fontSize: 12.5 }}><span>사용량</span><div className="sp" /><b>3.4 / 5.5 TB</b></div>
                    <Progress v={62} />
                  </div>
                  <div className="divider" />
                  <Bars data={[
                    { label: 'PDB · 구조 파일', value: 1840, color: '#0e7c66' },
                    { label: 'MSA · 정렬 파일', value: 920, color: '#3b5bdb' },
                    { label: 'FASTA · 서열', value: 120 },
                    { label: 'JSON · 지표', value: 280 },
                    { label: '로그 · 보고서', value: 240 },
                  ]} unit=" GB" />
                  <div className="divider" />
                  <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                    경로 규칙 <span className="mono">runs/&#123;run_id&#125;/&#123;stage&#125;/&#123;artifact&#125;</span> · 90일 미접근 run은 자동 압축 보관됩니다.
                  </div>
                </div>
              </Card>
              <Card title="보존 · 정리 정책">
                <dl className="kv" style={{ gridTemplateColumns: '120px 1fr' }}>
                  <dt>run 메타데이터</dt><dd>영구 보존</dd>
                  <dt>대용량 중간 산출물</dt><dd>180일 후 압축</dd>
                  <dt>실패 run 산출물</dt><dd>30일 후 정리</dd>
                  <dt>보고서 · 감사 로그</dt><dd>3년 보존</dd>
                  <dt>데이터 반출</dt><dd>기관망 내부로 제한 <span className="req">COR-003</span></dd>
                </dl>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'migration' && (
        <div className="grid g-2-1">
          <Card title="레거시 결과 마이그레이션" sub="기존 protein_pipeline outputs → 신규 체계" req="DAR-007" flush>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>원본 경로</th><th className="num">run 수</th><th className="num">용량</th><th style={{ width: 140 }}>진행</th><th>상태</th></tr></thead>
                <tbody>
                  {[
                    ['outputs/2025-H2/', 182, '480 GB', 100, 'done'],
                    ['outputs/2026-H1/', 416, '1.2 TB', 100, 'done'],
                    ['outputs/2026-H2/', 298, '910 GB', 68, 'running'],
                    ['outputs/archive-notebooks/', 64, '120 GB', 0, 'queued'],
                    ['outputs/legacy-unstructured/', 41, '88 GB', 0, 'failed'],
                  ].map(r => (
                    <tr key={r[0] as string}>
                      <td className="mono">{r[0]}</td>
                      <td className="num">{r[1]}</td>
                      <td className="num">{r[2]}</td>
                      <td><Progress v={r[3] as number} />
                        <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{r[3]}%</div></td>
                      <td><State s={r[4] as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="col" style={{ gap: 14 }}>
            <Card title="변환 규칙">
              <div className="col" style={{ gap: 8, fontSize: 12.5 }}>
                {[
                  ['디렉터리명 → run_id', '경로 해시 기반 안정 ID 부여'],
                  ['config.yaml → run.request', '파라미터 키 매핑 테이블 적용'],
                  ['stage 디렉터리 → artifacts', 'stage·kind 자동 분류'],
                  ['로그 파일 → run_events', '타임스탬프 파싱 후 이벤트 변환'],
                  ['누락 모델 버전', '실행 시점 기준 추정 후 estimated 표시'],
                ].map(([a, b]) => (
                  <div key={a}>
                    <div style={{ fontWeight: 500 }}>{a}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>{b}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="검증 결과">
              <div className="col" style={{ gap: 9 }}>
                {[
                  ['변환 run 조회 가능', 'ok'], ['아티팩트 경로 유효성', 'ok'],
                  ['지표 값 일치 (표본 50건)', 'ok'], ['모델 버전 확정', 'warn'],
                  ['비정형 결과 변환', 'err'],
                ].map(([k, s]) => (
                  <div key={k} className="row" style={{ fontSize: 12.5 }}>
                    <span>{k}</span><div className="sp" />
                    <span className={'badge ' + s}>{s === 'ok' ? '통과' : s === 'warn' ? '일부 추정' : '수동 확인'}</span>
                  </div>
                ))}
                <div className="divider" />
                <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                  비정형 결과 41건은 자동 변환 대상에서 제외되어 담당 연구자 확인 후 개별 이관합니다.
                </div>
                <button className="btn" onClick={() => onToast('검증 결과서 다운로드')}><Download size={14} />검증 결과서</button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
