import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FileUp, Play, Settings2, Trash2 } from 'lucide-react'
import { Card, Field, Fold, PageHead, Seg } from '../components/ui'
import { PaperMask } from '../components/PaperMask'
import './Run.css'

const ACCEPT = '.pdb,.ent,.cif,.mmcif,.bcif,.fa,.fasta,.txt,.seq'
const TIERS = [
  { v: '0.3', t: '30 %' },
  { v: '0.5', t: '50 %' },
  { v: '0.7', t: '70 %' },
]

/* 입력이 끝나기 전에는 추정값을 숫자로 보여 주지 않는다.
   아직 아무것도 고르지 않은 상태에서 120개 같은 수치가 먼저 보이면
   사용자가 이미 설정이 끝난 것으로 읽게 된다. */
function Estimate({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="pg-run-est">
      <span className="pg-run-est-l">{label}</span>
      <b className="pg-run-est-v">{value}</b>
      <span className="pg-run-est-n">{note}</span>
    </div>
  )
}

export default function Fast({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [source, setSource] = useState<'file' | 'text'>('file')
  const [fileName, setFileName] = useState('')
  const [pasted, setPasted] = useState('')
  const [notes, setNotes] = useState('')
  const [runName, setRunName] = useState('')
  const [tiers, setTiers] = useState<string[]>(['0.3', '0.5', '0.7'])
  const [total, setTotal] = useState(120)
  const [surrogate, setSurrogate] = useState(false)
  const [maskSpec, setMaskSpec] = useState('')

  const hasTarget = Boolean(fileName || pasted.trim())
  const isPdb = useMemo(() => {
    const byName = /\.(pdb|ent|cif|mmcif|bcif)$/i.test(fileName)
    const byText = /^(HEADER|ATOM|HETATM|data_|loop_)/m.test(pasted)
    return byName || byText
  }, [fileName, pasted])

  /* buildFastLaunchPreset 파생 계산 */
  const numSeqPerTier = surrogate ? 3333 : 2
  const sources = isPdb ? 2 : 1
  const tierCount = Math.max(1, tiers.length)
  const perSource = Math.max(1, Math.ceil(total / (tierCount * numSeqPerTier * sources)))
  const bioemuSamples = perSource * 2
  const af2Calls = surrogate ? 30 + 20 : total

  /* 실행을 막는 이유는 한 가지만 짚어 준다. 여러 줄로 늘어놓으면 무엇부터
     해야 할지 오히려 알기 어렵다. */
  const blockReason = !hasTarget
    ? '타깃을 먼저 올리세요.'
    : !tiers.length
      ? '서열 보존율을 1개 이상 고르세요.'
      : ''
  const ready = !blockReason

  const toggleTier = (v: string) => {
    setTiers(p => {
      const next = p.includes(v) ? p.filter(x => x !== v) : [...p, v].sort()
      onToast(next.length ? `보존율 ${next.map(x => `${Math.round(+x * 100)}%`).join(', ')} 선택` : '보존율이 모두 해제되었습니다.')
      return next
    })
  }

  const run = () => {
    if (!ready) { onToast(blockReason); return }
    onToast(`${runName || 'fast_run_01'} 실행 요청을 보냈습니다. 실행 모니터로 이동합니다.`)
    nav('/monitor')
  }

  const openAdvanced = () => {
    onToast('지금 입력한 값을 고급 설정으로 가져갑니다.')
    nav('/setup')
  }

  return (
    <>
      <PageHead
        title="빠른 실행"
        desc="타깃을 올리고 보존율만 고르면 나머지는 기본값으로 실행됩니다."
        actions={<>
          <button className="btn" onClick={openAdvanced}><Settings2 size={14} />고급 설정으로 열기</button>
          <button className="btn primary" disabled={!ready} title={blockReason || undefined} onClick={run}>
            <Play size={14} />실행
          </button>
        </>}
      />

      <div className="grid g-2-1">
        <div className="col" style={{ gap: 16 }}>
          <Card title="1. 타깃" sub="설계할 단백질의 구조 또는 서열을 올리세요."
            right={<Seg items={[{ key: 'file' as const, label: '파일 올리기' }, { key: 'text' as const, label: '직접 붙여넣기' }]}
              value={source} onChange={setSource} />}>
            <div className="col" style={{ gap: 16 }}>
              {source === 'file' ? (
                <div className="col" style={{ gap: 12 }}>
                  <div className="row wrap">
                    <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) { setFileName(f.name); onToast(`${f.name} 불러옴.`) }
                      }} />
                    <button className="btn" onClick={() => fileRef.current?.click()}><FileUp size={14} />파일 선택</button>
                    <button className="btn ghost" onClick={() => { setFileName('1EMA.pdb'); onToast('예시 타깃 1EMA.pdb 불러옴.') }}>
                      예시 타깃 1EMA
                    </button>
                    {fileName && (
                      <button className="btn ghost danger" onClick={() => { setFileName(''); onToast('타깃 파일을 비웠습니다.') }}>
                        <Trash2 size={14} />비우기
                      </button>
                    )}
                  </div>
                  <span className="hint">PDB · mmCIF · FASTA 파일을 올릴 수 있습니다 ({ACCEPT}).</span>
                </div>
              ) : (
                <Field label="타깃 원문" hint="FASTA, PDB, mmCIF 원문을 그대로 붙여 넣으면 형식을 자동으로 판별합니다.">
                  <textarea className="input mono" rows={8} value={pasted}
                    placeholder={'>target\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTG'}
                    onChange={e => setPasted(e.target.value)} />
                </Field>
              )}

              <div className={'signal' + (hasTarget ? ' ok' : '')}>
                {hasTarget && <Check size={16} className="ic" color="var(--ok)" />}
                <div>
                  <b>{hasTarget ? (isPdb ? '구조 입력 (PDB)' : '서열 입력 (FASTA)') : '타깃이 아직 없습니다'}</b>
                  <p>
                    {hasTarget
                      ? (fileName ? `${fileName} 을 불러왔습니다. ` : '붙여 넣은 원문을 사용합니다. ')
                        + (isPdb ? 'RFD3 와 BioEmu 두 가지로 백본을 만듭니다.' : 'BioEmu 하나로 백본을 만듭니다.')
                      : '파일을 올리거나 서열을 붙여 넣으면 다음 단계가 열립니다.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="2. 실행 옵션" sub="보존율과 출력 개수만 정하면 됩니다.">
            <div className="col" style={{ gap: 16 }}>
              <Field label="서열 보존율" hint="보존율이 높을수록 원본 서열을 많이 유지합니다. 기본은 세 단계 모두 사용합니다.">
                <div className="row wrap">
                  {TIERS.map(t => (
                    <button key={t.v} className={'btn' + (tiers.includes(t.v) ? ' primary' : '')}
                      aria-pressed={tiers.includes(t.v)} onClick={() => toggleTier(t.v)}>
                      {t.t}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid g2">
                <Field label="총 출력 서열 수" hint="보존율 단계마다 나누어 생성합니다. 기본 120개.">
                  <input className="input" type="number" min={1} step={1} value={total}
                    onChange={e => setTotal(Math.max(1, Number(e.target.value) || 1))} />
                </Field>
                <Field label="GPU 예산 절감" hint="켜면 구조 예측을 50건으로 줄이는 대신 후보를 넓게 훑습니다.">
                  <Seg items={[{ key: 'off' as const, label: '미사용' }, { key: 'on' as const, label: '사용' }]}
                    value={surrogate ? 'on' : 'off'}
                    onChange={k => {
                      setSurrogate(k === 'on')
                      onToast(k === 'on'
                        ? '예산 절감을 켰습니다. 학습 30건과 상위 20건만 구조를 예측합니다.'
                        : '예산 절감을 껐습니다.')
                    }} />
                </Field>
              </div>

              {surrogate && (
                <div className="signal">
                  <div>
                    <b>예산 절감을 켜면 이렇게 바뀝니다</b>
                    <p>보존율별 후보가 3,333개로 늘어나고, 구조 예측은 학습 30건과 상위 20건까지 50건만 수행합니다.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="3. 실행 이름과 노트" sub="비워 두어도 실행됩니다.">
            <div className="grid g2">
              <Field label="실행 이름" hint="비우면 자동으로 만들어집니다.">
                <input className="input" placeholder="fast_run_01" value={runName} onChange={e => setRunName(e.target.value)} />
              </Field>
              <Field label="고정 잔기" hint="아래 문헌 기반 마스킹에서 잔기를 적용하면 여기에 채워집니다.">
                <input className="input mono" value={maskSpec} placeholder="예: A:65,66,67" readOnly />
              </Field>
            </div>
            <div className="divider" />
            <Field label="실행 노트" hint="실행 기록에 함께 저장됩니다.">
              <textarea className="input" rows={3} value={notes}
                placeholder="예: 65~67번 발색단은 고정하고 표면 잔기만 탐색"
                onChange={e => setNotes(e.target.value)} />
            </Field>
          </Card>

          <Fold title="문헌 기반 마스킹" sub="논문에서 고정할 잔기를 찾아 적용합니다.">
            <PaperMask onToast={onToast} onApply={setMaskSpec} />
          </Fold>

          <Fold title="자동으로 채워지는 설정" sub="빠른 실행이 대신 정하는 값입니다.">
            <div className="col" style={{ gap: 16 }}>
              <dl className="kv" style={{ gridTemplateColumns: '180px 1fr' }}>
                <dt>실행 단계</dt><dd className="mono">msa → rfd3 → bioemu → design → soluprot → af2 → novelty</dd>
                <dt>백본 생성</dt><dd>{isPdb ? 'RFD3 (local_diversify) 와 BioEmu 사용' : '입력이 FASTA 라 BioEmu 만 사용'}</dd>
                <dt>보존율별 서열 수</dt><dd>{numSeqPerTier}개</dd>
                <dt>소스별 백본 수</dt>
                <dd>{perSource}개 = 올림({total} ÷ ({tierCount}단계 × {numSeqPerTier} × {sources}소스))</dd>
                <dt>BioEmu 생성 / 반환</dt><dd>{bioemuSamples}개 생성 후 {perSource}개 반환</dd>
                <dt>RFD3 반환</dt><dd>{isPdb ? `${perSource}개` : '사용 안 함'}</dd>
                <dt>Relax</dt><dd>사용</dd>
                <dt>WT 비교</dt><dd>사용 (합의 서열 마스킹은 사용 안 함)</dd>
                <dt>입력 정리</dt><dd>번호가 0 이하인 잔기를 제거합니다.</dd>
              </dl>
              <div className="row wrap">
                <span className="muted">이 값을 직접 바꾸려면 고급 설정을 사용하세요.</span>
                <div className="sp" />
                <button className="btn sm" onClick={openAdvanced}><Settings2 size={13} />고급 설정으로 열기</button>
              </div>
            </div>
          </Fold>
        </div>

        {/* 입력하는 동안 결과 규모가 어떻게 변하는지 옆에서 따라가게 둔다. */}
        <div className="pg-run-side">
          <Card title="실행 요약">
            <div className="col" style={{ gap: 16 }}>
              <div className="col" style={{ gap: 8 }}>
                <div className={'pg-run-chk' + (hasTarget ? ' on' : '')}>
                  <Check size={15} />타깃 {hasTarget ? (fileName || '원문 입력') : '필요'}
                </div>
                <div className={'pg-run-chk' + (tiers.length ? ' on' : '')}>
                  <Check size={15} />보존율 {tiers.length ? `${tiers.map(t => `${Math.round(+t * 100)}%`).join(', ')}` : '필요'}
                </div>
              </div>

              <div className="divider" />

              <div className="col" style={{ gap: 12 }}>
                <Estimate label="총 출력 서열" value={ready ? `${total}개` : '-'} note={`보존율 ${tierCount}단계로 나눕니다`} />
                <Estimate label="소스별 백본 수" value={ready ? `${perSource}개` : '-'}
                  note={isPdb ? 'RFD3 와 BioEmu 2개 소스' : 'BioEmu 1개 소스'} />
                <Estimate label="BioEmu 생성 개수" value={ready ? `${bioemuSamples}개` : '-'} note="백본 수의 2배를 만듭니다" />
                <Estimate label="예상 구조 예측" value={ready ? `${af2Calls}건` : '-'}
                  note={surrogate ? '학습 30건 + 상위 20건' : '후보 전체를 예측합니다'} />
              </div>

              <div className="divider" />

              <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
                disabled={!ready} title={blockReason || undefined} onClick={run}>
                <Play size={14} />실행
              </button>
              <span className={ready ? 'muted' : 'hint'}>
                {ready ? '실행하면 실행 모니터로 이동합니다.' : blockReason}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
