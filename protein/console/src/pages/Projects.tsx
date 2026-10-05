import { useState } from 'react'
import { GitFork, MessageSquarePlus, Plus } from 'lucide-react'
import { Card, Field, Modal, PageHead, State, Tabs } from '../components/ui'
import { PROJECTS, RUNS } from '../data/mock'

export default function Projects({ onToast }: { onToast: (m: string) => void }) {
  const [sel, setSel] = useState(PROJECTS[0].id)
  const [tab, setTab] = useState<'rounds' | 'feedback' | 'lineage' | 'dataset'>('rounds')
  const [open, setOpen] = useState(false)
  const prj = PROJECTS.find(p => p.id === sel)!
  const prjRuns = RUNS.filter(r => r.project === prj.name)

  return (
    <>
      <PageHead
        title="프로젝트 · 라운드"
        desc="프로젝트–라운드–태스크–피드백–실험 기록을 연결해 설계 이력을 장기 축적합니다."
        req="SFR-018 · SFR-025 · DAR-005"
        actions={<>
          <button className="btn" onClick={() => setOpen(true)}><MessageSquarePlus size={14} />실험 결과 기록</button>
          <button className="btn primary"><Plus size={14} />새 프로젝트</button>
        </>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,280px) minmax(0,1fr)' }}>
        <Card title="프로젝트" sub={`${PROJECTS.length}건`} flush>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {PROJECTS.map(p => (
                  <tr key={p.id} className={sel === p.id ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSel(p.id)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="row faint" style={{ fontSize: 11.5, marginTop: 3 }}>
                        <span>{p.rounds} 라운드</span><span>·</span><span>{p.runs} run</span>
                        <span>·</span><span>hit {p.hits}</span>
                      </div>
                      <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{p.owner} · {p.updated}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="col" style={{ gap: 14 }}>
          <Card title={prj.name} sub={`${prj.owner} · 최근 갱신 ${prj.updated}`}
            right={<><span className="badge brand">{prj.rounds} 라운드</span><span className="badge">{prj.runs} run</span></>}>
            <Tabs items={[
              { key: 'rounds', label: '라운드 / run' },
              { key: 'feedback', label: '피드백 · 실험 기록' },
              { key: 'lineage', label: 'run 계보' },
              { key: 'dataset', label: '학습 데이터셋' },
            ]} value={tab} onChange={setTab} />

            {tab === 'rounds' && (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>run</th><th>라운드</th><th>단계</th><th className="num">후보</th><th className="num">GPU-h</th><th>상태</th><th>생성</th><th /></tr></thead>
                  <tbody>
                    {prjRuns.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="mono" style={{ fontWeight: 500 }}>{r.id}</div>
                          <div className="faint" style={{ fontSize: 11.5 }}>{r.name}</div>
                        </td>
                        <td>{r.round}</td>
                        <td className="mono faint">{r.stage}</td>
                        <td className="num">{r.candidates}</td>
                        <td className="num">{r.gpuHours.toFixed(1)}</td>
                        <td><State s={r.status} /></td>
                        <td className="faint">{r.created.slice(5, 16)}</td>
                        <td><button className="btn sm ghost" onClick={() => onToast(`${r.id} fork 생성`)}><GitFork size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'feedback' && (
              <div className="col" style={{ gap: 10 }}>
                {[
                  ['2026-10-05', '김연구', 'run_0421', 'tier70은 통과율이 12%로 낮아 다음 라운드에서 제외. tier30·50 조합이 효율적.', '검토 의견'],
                  ['2026-10-03', '김연구', 'run_0412', 'cand_014, cand_003 발현 성공. Tm 측정값 각 68.2℃, 66.9℃ (WT 61.4℃).', '실험 결과'],
                  ['2026-10-03', '이박사', 'run_0412', '상위 24개를 결합 예측 입력으로 전달. 표적 4ZQK.', '태스크'],
                  ['2026-09-30', '박연구', 'run_0409', 'SoluProt 0.6 컷오프는 이 계열에서 다소 엄격. 0.55 시도 권장.', '검토 의견'],
                ].map(([d, who, run, text, kind], i) => (
                  <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
                    <div className="row" style={{ fontSize: 12 }}>
                      <span className="badge accent">{kind}</span>
                      <span className="mono faint">{run}</span>
                      <div className="sp" />
                      <span className="faint">{who} · {d}</span>
                    </div>
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.6 }}>{text}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'lineage' && (
              <div className="col" style={{ gap: 6, fontFamily: 'var(--mono)', fontSize: 12 }}>
                {[
                  [0, 'run_0405', 'Round 1 · tier30 파일럿', 'queued'],
                  [0, 'run_0409', 'Round 1 · 탐색', 'done'],
                  [1, 'run_0412', 'Round 2 · fork(run_0409) · tier30+50', 'done'],
                  [2, 'run_0418', 'Round 3 · fork(run_0412) · tier70', 'done'],
                  [2, 'run_0421', 'Round 3 · fork(run_0412) · tier30+50', 'gate'],
                  [3, 'run_0420', '결합 예측 · input(run_0412 hits)', 'running'],
                ].map(([d, id, desc, st]) => (
                  <div key={id as string} className="row" style={{ paddingLeft: (d as number) * 22 }}>
                    <span className="faint">{(d as number) > 0 ? '└─' : '●'}</span>
                    <span style={{ fontWeight: 500 }}>{id}</span>
                    <span className="faint" style={{ fontFamily: 'Pretendard, sans-serif' }}>{desc}</span>
                    <div className="sp" />
                    <State s={st as string} />
                  </div>
                ))}
                <div className="divider" />
                <div className="faint" style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 11.5 }}>
                  fork 정책에 따라 모든 재실행은 신규 run으로 기록되며 부모 run은 변경되지 않습니다. <span className="req">SFR-017</span>
                </div>
              </div>
            )}

            {tab === 'dataset' && (
              <div className="grid g2">
                <div className="col" style={{ gap: 10 }}>
                  <div className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>파생 데이터셋 추출 <span className="req">DAR-006</span></div>
                  <Field label="대상 범위"><select className="input"><option>이 프로젝트 전체 run (14건)</option><option>완료 run만 (11건)</option><option>실험 결과가 있는 run (2건)</option></select></Field>
                  <Field label="샘플 단위"><select className="input"><option>후보 서열 단위</option><option>run 단위</option><option>(서열, 구조) 쌍</option></select></Field>
                  <Field label="포함 레이블" hint="후속 surrogate / ranking 모델 학습용">
                    <div className="col" style={{ gap: 5, marginTop: 2 }}>
                      {['SoluProt score', 'pLDDT / RMSD', '가중 랭킹 점수', '사용자 피드백 등급', '실험 측정값 (Tm 등)'].map(l => (
                        <label key={l} className="check"><input type="checkbox" defaultChecked />{l}</label>
                      ))}
                    </div>
                  </Field>
                  <button className="btn primary" onClick={() => onToast('데이터셋 추출 작업 등록 — JSONL 2.1만 행 예상')}>데이터셋 추출</button>
                </div>
                <Card title="추출 이력" flush>
                  <div className="tbl-wrap">
                    <table className="tbl" style={{ fontSize: 12 }}>
                      <thead><tr><th>이름</th><th className="num">행</th><th>형식</th><th>생성</th></tr></thead>
                      <tbody>
                        {[
                          ['gfp_rank_v3.jsonl', '21,140', 'JSONL', '2026-10-04'],
                          ['gfp_solu_surrogate_v2.parquet', '18,602', 'Parquet', '2026-09-28'],
                          ['gfp_exp_labeled_v1.csv', '48', 'CSV', '2026-09-20'],
                        ].map(r => (
                          <tr key={r[0]}><td className="mono">{r[0]}</td><td className="num">{r[1]}</td>
                            <td><span className="badge">{r[2]}</span></td><td className="faint">{r[3]}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      </div>

      {open && (
        <Modal title="실험 결과 기록" onClose={() => setOpen(false)}
          footer={<>
            <button className="btn" onClick={() => setOpen(false)}>취소</button>
            <button className="btn primary" onClick={() => { setOpen(false); onToast('실험 기록 저장됨 — 학습 데이터셋에 반영') }}>저장</button>
          </>}>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="대상 run"><select className="input"><option>run_0412</option><option>run_0418</option><option>run_0421</option></select></Field>
            <Field label="기록 유형"><select className="input"><option>실험 결과</option><option>검토 의견</option><option>태스크</option></select></Field>
          </div>
          <Field label="대상 후보" hint="쉼표로 구분"><input className="input mono" placeholder="cand_014, cand_003" /></Field>
          <div className="grid g3" style={{ gap: 12 }}>
            <Field label="측정 항목"><select className="input"><option>Tm (℃)</option><option>발현량 (mg/L)</option><option>활성 (%)</option><option>Kd (nM)</option></select></Field>
            <Field label="측정값"><input className="input" placeholder="68.2" /></Field>
            <Field label="대조군 (WT)"><input className="input" placeholder="61.4" /></Field>
          </div>
          <Field label="메모"><textarea className="input" rows={3} placeholder="실험 조건, 반복 수, 특이사항" /></Field>
          <div className="signal ok">
            <div><b style={{ fontSize: 12.5 }}>데이터셋 연계 <span className="req">DAR-005</span></b>
              <p style={{ fontSize: 12 }}>기록된 실험값은 해당 후보의 설계 파라미터·지표와 연결되어 후속 ranking 모델 학습 데이터로 추출할 수 있습니다.</p></div>
          </div>
        </Modal>
      )}
    </>
  )
}
