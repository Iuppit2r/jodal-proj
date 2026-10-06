import { useState } from 'react'
import { Database, Download, Play, RefreshCw, Square, Trash2 } from 'lucide-react'
import { Block, Card, Field, GroupTitle, Modal, PageHead } from '../components/ui'

type TState = 'completed' | 'failed' | 'running' | 'stopped' | 'waiting'

const TSTATE: Record<TState, { label: string; cls: string }> = {
  completed: { label: '완료', cls: 'ok' },
  failed: { label: '실패', cls: 'err' },
  running: { label: '실행중', cls: 'run' },
  stopped: { label: '중지', cls: 'warn' },
  waiting: { label: '대기', cls: '' },
}

type Target = { name: string; state: TState; stage: string; detail: string; updated: string }
type Subset = { key: 'train' | 'val' | 'test'; dir: string; targets: Target[] }

const SUBSETS: Subset[] = [
  {
    key: 'train', dir: '/data/cath/train',
    targets: [
      { name: '3RGK_A', state: 'completed', stage: 'novelty', detail: '후보 48건, pLDDT 평균 88.4', updated: '2026-10-06 07:12' },
      { name: '1LVM_A', state: 'running', stage: 'af2', detail: 'ColabFold 32/64 접힘 예측 진행', updated: '2026-10-06 08:41' },
      { name: '2OSL_B', state: 'completed', stage: 'novelty', detail: '후보 36건, SoluProt 통과 62%', updated: '2026-10-06 06:55' },
      { name: '1A2P_A', state: 'failed', stage: 'msa', detail: 'mmseqs 검색 시간 초과 (1800s)', updated: '2026-10-06 05:20' },
      { name: '4KL5_A', state: 'completed', stage: 'novelty', detail: '후보 52건, novelty 상위 12건', updated: '2026-10-05 23:48' },
      { name: '1UBQ_A', state: 'waiting', stage: '-', detail: '워커 2개 모두 사용 중', updated: '2026-10-06 08:41' },
      { name: '2LZM_A', state: 'stopped', stage: 'design', detail: '사용자 요청으로 중지', updated: '2026-10-05 21:10' },
      { name: '5PTI_A', state: 'failed', stage: 'af2', detail: 'pLDDT 하한 85를 넘는 후보 없음', updated: '2026-10-05 20:02' },
    ],
  },
  {
    key: 'val', dir: '/data/cath/val',
    targets: [
      { name: '1CRN_A', state: 'completed', stage: 'novelty', detail: '후보 28건', updated: '2026-10-05 18:30' },
      { name: '1MBN_A', state: 'completed', stage: 'novelty', detail: '후보 31건', updated: '2026-10-05 17:12' },
      { name: '3EIY_A', state: 'waiting', stage: '-', detail: 'train 서브셋 완료 후 시작', updated: '2026-10-06 08:41' },
      { name: '1BPI_A', state: 'waiting', stage: '-', detail: 'train 서브셋 완료 후 시작', updated: '2026-10-06 08:41' },
    ],
  },
  {
    key: 'test', dir: '/data/cath/test',
    targets: [
      { name: '1IGD_A', state: 'waiting', stage: '-', detail: '대기열 등록됨', updated: '2026-10-06 08:41' },
      { name: '2PTL_A', state: 'waiting', stage: '-', detail: '대기열 등록됨', updated: '2026-10-06 08:41' },
      { name: '1SHG_A', state: 'waiting', stage: '-', detail: '대기열 등록됨', updated: '2026-10-06 08:41' },
    ],
  },
]

type Job = { id: string; label: string; kind: string; state: TState; created: string }

const INIT_JOBS: Job[] = [
  { id: 'job_7f21', label: 'cath train batch', kind: 'cath_batch', state: 'running', created: '2026-10-06 07:02' },
  { id: 'job_7e04', label: 'cath val batch', kind: 'cath_batch', state: 'waiting', created: '2026-10-06 07:03' },
  { id: 'job_7a98', label: 'cath train batch (재시도)', kind: 'cath_batch', state: 'failed', created: '2026-10-05 19:40' },
  { id: 'job_7a11', label: 'cath pilot 40 targets', kind: 'cath_batch', state: 'completed', created: '2026-10-04 11:25' },
  { id: 'job_79c2', label: 'embedding refresh', kind: 'esm_embedding', state: 'stopped', created: '2026-10-03 14:08' },
]

const LOGS: Record<string, { t: string; k: string; m: string }[]> = {
  job_7f21: [
    { t: '07:02:11', k: 't', m: 'batch start subset=train max_workers=2 keep_local=true stop_on_error=false' },
    { t: '07:02:14', k: 't', m: '[3RGK_A] stage=msa mmseqs target_db=uniref90 max_seqs=3000' },
    { t: '07:21:50', k: 'o', m: '[3RGK_A] stage=novelty completed candidates=48' },
    { t: '07:22:02', k: 't', m: '[1LVM_A] stage=design proteinmpnn num_seq_per_tier=16' },
    { t: '08:05:31', k: 'w', m: '[1A2P_A] mmseqs search timeout 1800s, marking failed' },
    { t: '08:41:09', k: 't', m: '[1LVM_A] stage=af2 colabfold 32/64' },
  ],
  job_7a98: [
    { t: '19:40:02', k: 't', m: 'batch start subset=train max_workers=2 stop_on_error=true' },
    { t: '19:58:44', k: 'e', m: '[5PTI_A] af2 stage produced 0 candidates above plddt cutoff 85' },
    { t: '19:58:45', k: 'e', m: 'stop_on_error=true, aborting remaining 12 targets' },
  ],
  job_7a11: [
    { t: '11:25:00', k: 't', m: 'batch start subset=pilot targets=40' },
    { t: '15:02:18', k: 'o', m: 'batch completed total=40 completed=37 failed=3' },
    { t: '15:02:20', k: 't', m: 's3 upload done, local outputs kept' },
  ],
}

const BENCH = [
  { name: 'cath_pilot_dataset.csv', kind: '벤치마크 입력', size: '1.2 MB', desc: 'CATH 파일럿 타깃 목록과 체인 정보' },
  { name: 'cath_pilot_emb_320d.npy', kind: '임베딩', size: '48 MB', desc: 'ESM-2 8M 기반 320차원 서열 임베딩 캐시' },
  { name: 'rapid_target_manifest.csv', kind: '매니페스트', size: '240 KB', desc: '체인 보정 재수집 기준 매니페스트' },
  { name: 'data/cath_73/', kind: '실행 코퍼스', size: '요약 2.8 MB', desc: '73건 CATH 실행 코퍼스 요약 (원본 아카이브는 외부 저장소)' },
  { name: 'data/cath_curated/', kind: '정제 요약', size: '1.1 MB', desc: '품질 검사로 걸러낸 재수집 이전 CATH 요약' },
  { name: 'data/case_studies/3RGK', kind: '사례 연구', size: '620 KB', desc: '3RGK 단회차 및 다회차 실행 요약' },
  { name: 'data/case_studies/1LVM', kind: '사례 연구', size: '580 KB', desc: '1LVM 단회차 및 다회차 실행 요약' },
  { name: 'figures/benchmark/', kind: '도표', size: '14 MB', desc: '벤치마크 도표와 LaTeX 표' },
]

function counts(t: Target[]) {
  return {
    total: t.length,
    completed: t.filter(x => x.state === 'completed').length,
    failed: t.filter(x => x.state === 'failed').length,
    running: t.filter(x => x.state === 'running').length,
    stopped: t.filter(x => x.state === 'stopped').length,
    waiting: t.filter(x => x.state === 'waiting').length,
  }
}

export default function Cath({ onToast }: { onToast: (m: string) => void }) {
  const [keepLocal, setKeepLocal] = useState(true)
  const [stopOnError, setStopOnError] = useState(false)
  const [maxWorkers, setMaxWorkers] = useState(2)
  const [jobs, setJobs] = useState<Job[]>(INIT_JOBS)
  const [jobId, setJobId] = useState<string>('job_7f21')
  const [onlyActive, setOnlyActive] = useState(false)
  const [confirm, setConfirm] = useState<{ body: string; run: () => void } | null>(null)

  const log = LOGS[jobId]

  return (
    <>
      <PageHead
        title="CATH 벤치마크"
        desc="서브셋을 골라 실행하고 작업 로그를 확인하세요."
        actions={<>
          <button className="btn" onClick={() => onToast('CATH 서브셋 진행 상황 새로고침')}><RefreshCw size={14} />새로고침</button>
          <button className="btn primary" onClick={() => onToast(`전체 서브셋 순차 실행 등록, 워커 ${maxWorkers}개`)}><Play size={14} />전체 실행</button>
        </>}
      />

      <Card title="실행 옵션" sub={`보관 ${keepLocal ? '사용' : '해제'} · 에러 정지 ${stopOnError ? '사용' : '해제'} · 워커 ${maxWorkers}개`}>
        <div className="grid g3">
          <Field label="출력물 보관" hint="keep_local">
            <label className="check">
              <input type="checkbox" checked={keepLocal} onChange={e => { setKeepLocal(e.target.checked); onToast(`S3 업로드 후 로컬 보관 ${e.target.checked ? '사용' : '해제'}`) }} />
              S3 업로드 후 로컬 출력물 보관
            </label>
          </Field>
          <Field label="오류 처리" hint="stop_on_error">
            <label className="check">
              <input type="checkbox" checked={stopOnError} onChange={e => { setStopOnError(e.target.checked); onToast(`에러 발생 시 정지 ${e.target.checked ? '사용' : '해제'}`) }} />
              에러 발생 시 정지
            </label>
          </Field>
          <Field label="최대 워커" hint="max_workers · 최소 1">
            <input className="input" type="number" min={1} value={maxWorkers} onChange={e => setMaxWorkers(Math.max(1, Number(e.target.value)))} />
          </Field>
        </div>
      </Card>

      <GroupTitle
        title="서브셋 진행"
        sub="train · val · test"
        right={<label className="check">
          <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />
          대상 표에 진행중 · 실패만 보기
        </label>}
      />

      {SUBSETS.map(s => {
        const cc = counts(s.targets)
        const rows = onlyActive ? s.targets.filter(t => t.state === 'running' || t.state === 'failed') : s.targets
        return (
          <Card
            key={s.key}
            title={`서브셋 ${s.key}`}
            sub={s.dir}
            right={
              <button className="btn sm primary" onClick={() => onToast(`${s.key} 서브셋 파이프라인 실행 등록, 워커 ${maxWorkers}개`)}>
                <Play size={13} />파이프라인 실행
              </button>
            }
          >
            <div className="col" style={{ gap: 16 }}>
              <div className="row wrap">
                <span className="muted">전체 {cc.total}</span>
                <span className="badge ok">완료 {cc.completed}</span>
                <span className="badge err">실패 {cc.failed}</span>
                <span className="badge run">실행중 {cc.running}</span>
                <span className="badge warn">중지 {cc.stopped}</span>
                <span className="muted">대기 {cc.waiting}</span>
                <div className="sp" />
                <span className="muted">출력 경로 {s.dir}/outputs</span>
              </div>
              {s.targets.length === 0 ? (
                <div className="empty">CATH 서브셋 진행 기록이 아직 없습니다.</div>
              ) : rows.length === 0 ? (
                <div className="empty">진행중이거나 실패한 대상이 없습니다.</div>
              ) : (
                <div className="tbl-wrap" style={{ maxHeight: 268, overflowY: 'auto' }}>
                  <table className="tbl">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th className="no">No.</th><th>Target</th><th>상태</th><th>단계</th><th>상세</th><th>갱신</th></tr></thead>
                    <tbody>
                      {rows.map((t, i) => (
                        <tr key={t.name}>
                          <td className="no">{i + 1}</td>
                          <td className="mono" style={{ fontWeight: 500 }}>{t.name}</td>
                          <td><span className={'badge ' + TSTATE[t.state].cls}><i className="dot" />{TSTATE[t.state].label}</span></td>
                          <td className="mono muted">{t.stage}</td>
                          <td title={t.detail}>{t.detail}</td>
                          <td className="faint">{t.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )
      })}

      <GroupTitle title="작업 기록 · 데이터" />

      <Block title="관리 작업 · 작업 로그" sub="작업을 고르면 오른쪽에 로그가 열립니다">
        <div className="grid g-1-2">
          <Card title="관리 작업" sub={`${jobs.length}건`}>
            {jobs.length === 0 ? (
              <div className="empty">등록된 작업이 없습니다.</div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th className="no">No.</th><th>라벨</th><th>종류</th><th>상태</th><th>생성 시각</th><th>액션</th></tr></thead>
                  <tbody>
                    {jobs.map((j, i) => {
                      const active = j.state === 'running' || j.state === 'waiting'
                      return (
                        <tr key={j.id} className={j.id === jobId ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setJobId(j.id)}>
                          <td className="no">{i + 1}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{j.label}</div>
                            <div className="mono faint">{j.id}</div>
                          </td>
                          <td className="mono muted">{j.kind}</td>
                          <td><span className={'badge ' + TSTATE[j.state].cls}><i className="dot" />{TSTATE[j.state].label}</span></td>
                          <td className="faint">{j.created}</td>
                          <td>
                            <div className="row">
                              <button className="btn sm ghost" disabled={!active}
                                onClick={e => {
                                  e.stopPropagation()
                                  setJobs(prev => prev.map(x => (x.id === j.id ? { ...x, state: 'stopped' } : x)))
                                  onToast(`${j.id} 중지 요청`)
                                }}><Square size={13} />중지</button>
                              <button className="btn sm ghost danger" disabled={active}
                                onClick={e => {
                                  e.stopPropagation()
                                  setConfirm({
                                    body: `작업 기록 ${j.id}를 삭제할까요? 파이프라인 출력물은 삭제되지 않습니다.`,
                                    run: () => {
                                      setJobs(prev => prev.filter(x => x.id !== j.id))
                                      if (jobId === j.id) setJobId('')
                                      onToast(`${j.id} 기록 삭제됨`)
                                    },
                                  })
                                }}><Trash2 size={13} />삭제</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="작업 로그"
            sub={jobId ? jobId : undefined}
            right={<button className="btn sm" disabled={!jobId} onClick={() => onToast(`${jobId} 로그 다시 읽기`)}><RefreshCw size={13} />다시 읽기</button>}
          >
            {!jobId ? (
              <div className="empty">작업을 선택하면 로그가 표시됩니다.</div>
            ) : !log ? (
              <div className="empty">이 작업에는 기록된 로그가 없습니다.</div>
            ) : (
              <div className="log">
                {log.map((l, i) => (
                  <div key={i}>
                    <span className="t">{l.t}</span>{' '}
                    <span className={l.k}>{l.m}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Block>

      <Card title="벤치마크 데이터" sub="공개 배포 세트">
        <div className="col" style={{ gap: 16 }}>
          <div className="row">
            <button className="btn sm" onClick={() => onToast('매니페스트와 요약 파일 묶음 내려받기')}><Download size={13} />매니페스트 내려받기</button>
          </div>
          <div className="tbl-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="tbl">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th className="no">No.</th><th>경로</th><th>종류</th><th>크기</th><th>설명</th><th>액션</th></tr></thead>
              <tbody>
                {BENCH.map((b, i) => (
                  <tr key={b.name}>
                    <td className="no">{i + 1}</td>
                    <td className="mono" style={{ fontWeight: 500 }}>{b.name}</td>
                    <td className="muted">{b.kind}</td>
                    <td className="muted">{b.size}</td>
                    <td>{b.desc}</td>
                    <td><button className="btn sm ghost" onClick={() => onToast(`${b.name} 내려받기 요청`)}><Database size={13} />받기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="signal">
            <div><b>73건 코퍼스</b>
              <p>전체 아카이브는 외부 저장소에 있고, 여기서는 요약과 사례 연구만 받습니다.</p></div>
          </div>
        </div>
      </Card>

      {confirm && (
        <Modal title="작업 기록 삭제" onClose={() => setConfirm(null)}
          footer={<>
            <button className="btn" onClick={() => setConfirm(null)}>취소</button>
            <button className="btn primary" onClick={() => { confirm.run(); setConfirm(null) }}>삭제</button>
          </>}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{confirm.body}</p>
        </Modal>
      )}
    </>
  )
}
