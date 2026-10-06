import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Eraser, FileUp,
  Info, Play, Plus, RefreshCw, Sparkles, Trash2, Wand2, X,
} from 'lucide-react'
import { Card, Field, Fold, GroupTitle, Modal, PageHead, State } from '../components/ui'
import { PaperMask } from '../components/PaperMask'
import { StructureViewer } from '../components/viz'
import { RUNS, WT_SEQ } from '../data/mock'
import {
  AA3, AA_GROUPS, DEFAULT_ANSWERS, LOG_SEED, PICKER_SOURCES, PIPELINE_STAGES,
  PLAN_QUESTIONS, PREFLIGHT_OK, PREFLIGHT_WARNINGS, QUESTIONS, STAGE_GUIDE,
  STEP_HEADLINES, STEP_LABELS, SURROGATE_PRESET, aaStyle,
  type AnswerVal, type Q,
} from '../data/setup'
import './Run.css'

const stamp = () => new Date().toTimeString().slice(0, 8)

/* ---------------- 파라미터 필드 렌더러 ---------------- */
const TIER_OPTS = [{ v: '0.3', t: '30 %' }, { v: '0.5', t: '50 %' }, { v: '0.7', t: '70 %' }]

function QField({ q, val, onSet }: { q: Q; val: AnswerVal; onSet: (v: AnswerVal) => void }) {
  const hint = q.note ?? ''
  const sv = typeof val === 'boolean' ? String(val) : String(val ?? '')
  const list = Array.isArray(val) ? val : []

  return (
    <Field label={q.label} hint={hint}>
      {q.kind === 'select' && (
        <select className="input" value={sv} onChange={e => onSet(e.target.value)}>
          {(q.opts ?? []).map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
        </select>
      )}
      {q.kind === 'bool' && (
        <div className="seg">
          {(q.opts ?? [{ v: 'true', t: '사용' }, { v: 'false', t: '미사용' }]).map(o => (
            <button key={o.v} className={sv === o.v ? 'on' : ''} onClick={() => onSet(o.v === 'true')}>{o.t}</button>
          ))}
        </div>
      )}
      {q.kind === 'num' && (
        <input className="input" type="number" min={q.min} max={q.max} step={q.step} value={sv}
          onChange={e => onSet(e.target.value === '' ? '' : Number(e.target.value))} />
      )}
      {q.kind === 'text' && (
        <input className="input" placeholder={q.ph} value={sv} onChange={e => onSet(e.target.value)} />
      )}
      {q.kind === 'textarea' && (
        <textarea className="input mono" rows={q.rows ?? 3} placeholder={q.ph} value={sv}
          onChange={e => onSet(e.target.value)} />
      )}
      {q.kind === 'tiers' && (
        <div className="row wrap">
          {TIER_OPTS.map(o => (
            <button key={o.v} className={'btn' + (list.includes(o.v) ? ' primary' : '')} aria-pressed={list.includes(o.v)}
              onClick={() => onSet(list.includes(o.v) ? list.filter(x => x !== o.v) : [...list, o.v].sort())}>
              {o.t}
            </button>
          ))}
        </div>
      )}
      {q.kind === 'checks' && (
        <div className="row wrap" style={{ gap: 14 }}>
          {(q.opts ?? []).map(o => (
            <label key={o.v} className="check">
              <input type="checkbox" checked={list.includes(o.v)}
                onChange={() => onSet(list.includes(o.v) ? list.filter(x => x !== o.v) : [...list, o.v])} />
              <span className="mono">{o.t}</span>
            </label>
          ))}
        </div>
      )}
    </Field>
  )
}

const RUN_MODE_CARDS = [
  { v: 'pipeline', badge: '기본', title: 'Full Pipeline', desc: 'msa부터 novelty까지 전체 단계를 순서대로 실행합니다.', flow: PIPELINE_STAGES },
  { v: 'workflow', badge: '설계형', title: '단계별 실행', desc: '단계를 직접 배치하고 체크포인트를 지정해 실행합니다.', flow: ['palette', 'canvas', 'checkpoint'] },
  { v: 'standalone', badge: '단일', title: 'Single Stage', desc: '한 단계만 실행합니다. 재실행·부분 검증에 사용합니다.', flow: ['stage'] },
  { v: 'surrogate', badge: '예산 절감', title: 'Pipeline + Surrogate', desc: 'SoluProt 통과 풀을 대리 모델로 평가하고 구조 예측은 학습 세트 + Top K에만 사용합니다.', flow: ['msa', 'design', 'soluprot', 'surrogate', 'af2'] },
]

export default function Setup({ onToast }: { onToast: (m: string) => void }) {
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [answers, setAnswers] = useState<Record<string, AnswerVal>>({ ...DEFAULT_ANSWERS })
  const [step, setStep] = useState(0)
  const [runSel, setRunSel] = useState('')
  const [runName, setRunName] = useState('')
  const [targetFile, setTargetFile] = useState('')
  const [logs, setLogs] = useState<{ t: string; c: string; m: string }[]>(LOG_SEED)
  const [prompt, setPrompt] = useState('')
  const [planOpen, setPlanOpen] = useState(false)
  const [pf, setPf] = useState<{ req: string[]; block: string[]; warn: string[] } | null>(null)

  /* 워크플로 설계 */
  const [wfStages, setWfStages] = useState<string[]>(['msa', 'rfd3', 'design', 'soluprot', 'af2'])
  const [checkpoints, setCheckpoints] = useState<string[]>(['soluprot'])
  const [wfOpts, setWfOpts] = useState<string[]>(['pause', 'results'])
  const [hoverStage, setHoverStage] = useState<string>('')

  /* Residue Picker */
  const [pickerSource, setPickerSource] = useState('')
  const [pickerBusy, setPickerBusy] = useState(false)
  const [surfaceCutoff, setSurfaceCutoff] = useState(2.5)
  const [sel, setSel] = useState<Record<string, number[]>>({})
  const [activePresets, setActivePresets] = useState<string[]>([])
  const [popupPref, setPopupPref] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [hoverResi, setHoverResi] = useState<{ c: string; n: number; ch: string } | null>(null)
  const [viewerColor, setViewerColor] = useState<'secondary' | 'chain' | 'spectrum'>('secondary')

  /* ---------------- 값 접근자 ---------------- */
  const S = (k: string) => (typeof answers[k] === 'boolean' ? String(answers[k]) : String(answers[k] ?? ''))
  const N = (k: string) => Number(answers[k] ?? 0)
  const B = (k: string) => answers[k] === true || answers[k] === 'true'
  const L = (k: string) => (Array.isArray(answers[k]) ? (answers[k] as string[]) : [])

  const log = (m: string, c = 't') => setLogs(l => [...l, { t: stamp(), c, m }])

  const set = (k: string, v: AnswerVal) => {
    setAnswers(a => ({ ...a, [k]: v }))
    log(`${k} = ${Array.isArray(v) ? v.join(',') : String(v)}`)
  }

  const F = (key: string) => <QField key={key} q={QUESTIONS[key]} val={answers[key]} onSet={v => set(key, v)} />
  const G = (keys: string[], cols = 2) => <div className={'grid g' + cols}>{keys.map(F)}</div>

  /* ---------------- 파생 ---------------- */
  const mode = S('run_mode')
  const hasTarget = Boolean(S('target_input').trim() || targetFile)
  const isPdb = /\.(pdb|ent|cif|mmcif|bcif)$/i.test(targetFile)
    || /^(HEADER|ATOM|HETATM|data_|loop_)/m.test(S('target_input'))

  const stages = (() => {
    if (mode === 'standalone') return [S('standalone_stage')]
    if (mode === 'workflow') return wfStages
    const stop = S('stop_after') === 'wt_diff' ? 'novelty' : S('stop_after')
    const si = PIPELINE_STAGES.indexOf(S('start_from'))
    const ei = PIPELINE_STAGES.indexOf(stop)
    if (si < 0 || ei < 0 || si > ei) return []
    return PIPELINE_STAGES.slice(si, ei + 1).filter(s =>
      (s !== 'rfd3' || B('rfd3_use')) && (s !== 'bioemu' || B('bioemu_use')) && (s !== 'novelty' || B('novelty_enabled')))
  })()

  const tiers = L('selected_tiers')
  const backbones = (B('rfd3_use') ? N('rfd3_max_return_designs') : 0) + (B('bioemu_use') ? N('bioemu_max_return_structures') : 0)
  const estSeq = Math.max(0, tiers.length * N('num_seq_per_tier') * backbones)
  const estAf2 = B('surrogate_triage_enabled')
    ? N('surrogate_triage_initial_samples') + N('surrogate_triage_top_k')
    : N('af2_max_candidates_per_tier') > 0 ? N('af2_max_candidates_per_tier') * tiers.length : estSeq

  const selRun = RUNS.find(r => r.id === runSel)
  const reuseHint = !runSel
    ? '고급 설정은 항상 새 실행을 생성합니다. Load Request는 선택한 실행의 설정만 복사합니다.'
    : mode === 'workflow'
      ? `${runSel}의 설정을 단계별 실행 구성으로 복사합니다. 기존 실행은 변경되지 않습니다.`
      : `${runSel}의 request.json을 이 양식에 복사합니다. 이어서 실행(resume)이 아닙니다.`

  const selCount = Object.values(sel).reduce((s, v) => s + v.length, 0)
  const selSpec = Object.entries(sel).filter(([, v]) => v.length)
    .map(([c, v]) => `${c}:${[...v].sort((a, b) => a - b).join(',')}`).join(';')

  /* ---------------- 액션 ---------------- */
  const runPreflight = () => {
    const req: string[] = []
    const block: string[] = []
    if (!hasTarget) req.push('타깃이 없습니다. 입력 단계에서 파일을 올리거나 서열을 붙여 넣으세요.')
    if (!tiers.length) req.push('서열 보존율을 1개 이상 고르세요. 기준 단계에서 정합니다.')
    if (S('confirm_run') !== 'true') req.push('아래 실행 확인에서 \'예, 실행합니다\'를 고르세요.')
    if (mode === 'standalone' && S('standalone_stage') === 'diffdock' && !S('diffdock_ligand').trim())
      block.push('DiffDock 단일 실행에는 리간드가 필요합니다. 워크플로 단계에서 입력하세요.')
    if (mode === 'pipeline' && !stages.length)
      block.push('시작 단계가 중단 단계보다 뒤에 있어 실행할 단계가 없습니다.')
    if (!B('rfd3_use') && !B('bioemu_use') && stages.includes('design'))
      block.push('백본 소스가 없습니다. RFD3 또는 BioEmu 중 하나는 사용해야 합니다.')
    if (B('surrogate_triage_enabled') && !L('surrogate_triage_comparator_models').length)
      block.push('대리모델 선별에 비교할 모델이 없습니다. 기준 단계에서 고르세요.')
    const warn = [...PREFLIGHT_WARNINGS]
    if (!isPdb && B('rfd3_use')) warn.push('입력이 FASTA라 RFD3 입력 백본이 없습니다. RFD3 입력 PDB를 지정하거나 RFD3를 끄세요.')
    if (N('af2_max_candidates_per_tier') === 0 && estSeq > 500) warn.push(`구조 예측 상한이 0(전체)이라 후보 ${estSeq}건 전체를 예측합니다. GPU 비용이 큽니다.`)
    setPf({ req, block, warn })
    log(`사전 점검 완료: 필수 ${req.length}건, 차단 ${block.length}건, 경고 ${warn.length}건`, block.length ? 'e' : req.length ? 'w' : 'o')
    onToast(`사전 점검 완료: 필수 입력 ${req.length}건, 차단 이슈 ${block.length}건, 경고 ${warn.length}건`)
  }

  const resetInputs = () => {
    setAnswers({ ...DEFAULT_ANSWERS })
    setTargetFile(''); setPf(null); setPlanOpen(false); setPrompt('')
    log('입력을 초기화했습니다.', 'w')
    onToast('입력을 초기화했습니다.')
  }

  const loadRequest = () => {
    if (!runSel) { onToast('먼저 실행을 선택하세요.'); return }
    setAnswers(a => ({
      ...a,
      target_input: `>loaded_from_${runSel}\n${WT_SEQ.slice(0, 60)}`,
      selected_tiers: ['0.3', '0.5'],
      num_seq_per_tier: 4,
      af2_plddt_cutoff: 88,
      stop_after: 'af2',
    }))
    log(`${runSel}/request.json을 불러와 설정을 복사했습니다.`, 'o')
    onToast(`${runSel}의 설정을 복사했습니다. 새 실행으로 실행됩니다.`)
  }

  const applyPreset = () => {
    setAnswers(a => ({ ...a, ...SURROGATE_PRESET }))
    log('Surrogate 프리셋을 적용했습니다 (RFD3 · BioEmu 비활성, 보존율별 후보 3333)', 'o')
    onToast('Surrogate 프리셋을 적용했습니다. 기준 단계에서 세부값을 확인하세요.')
  }

  const canRun = hasTarget && tiers.length > 0 && S('confirm_run') === 'true' && !(pf?.block.length)
  const runHintText = !hasTarget
    ? '필수 입력을 완료하면 실행할 수 있습니다.'
    : !tiers.length
      ? '서열 보존율을 1개 이상 선택하세요.'
      : pf?.block.length
        ? '차단 이슈를 먼저 해결하세요.'
        : S('confirm_run') !== 'true'
          ? '검토 단계에서 실행 확인을 선택하면 실행됩니다.'
          : '실행 준비가 되었습니다.'

  const doRun = () => {
    if (!canRun) { onToast(runHintText); return }
    log(`${runName || 'advanced_run_01'} 실행 요청을 보냈습니다.`, 'o')
    onToast(`${runName || 'advanced_run_01'} 실행 요청을 보냈습니다. Monitor로 이동합니다.`)
    nav('/monitor')
  }

  /* ---------------- Residue Picker 보조 ---------------- */
  const pickerChains = (pickerSource === 'rfd3_seed' || pickerSource === 'fasta')
    ? [{ id: 'A', start: 1, seq: WT_SEQ.slice(0, 120) }]
    : [{ id: 'A', start: 1, seq: WT_SEQ.slice(0, 120) }, { id: 'B', start: 1, seq: WT_SEQ.slice(120, 180) }]

  const presetMap = (p: string): Record<string, number[]> => {
    const out: Record<string, number[]> = {}
    pickerChains.forEach(c => {
      const ids: number[] = []
      for (let i = 0; i < c.seq.length; i++) {
        const n = c.start + i
        const ok = p === 'surface' ? n % 7 === 0
          : p === 'core' ? n % 11 === 3
            : p === 'interface' ? (c.id === 'B' ? n % 5 === 0 : n % 23 === 0)
              : p === 'c30' ? n % 6 === 1
                : p === 'c50' ? n % 9 === 4
                  : n % 13 === 2
        if (ok) ids.push(n)
      }
      out[c.id] = ids
    })
    return out
  }

  const consAvailable = pickerChains.length === 1 && Boolean(pickerSource)
  const PRESETS = [
    { v: 'surface', t: '표면 (Surface)', spatial: true },
    { v: 'core', t: '내부 (Core)', spatial: true },
    { v: 'interface', t: '인터페이스 (Interface)', spatial: true },
    { v: 'c30', t: '보존 30', spatial: false },
    { v: 'c50', t: '보존 50', spatial: false },
    { v: 'c70', t: '보존 70', spatial: false },
  ]

  const togglePreset = (p: string) => {
    const map = presetMap(p)
    const on = activePresets.includes(p)
    setActivePresets(ps => on ? ps.filter(x => x !== p) : [...ps, p])
    setSel(prev => {
      const next: Record<string, number[]> = { ...prev }
      Object.entries(map).forEach(([c, ids]) => {
        const cur = next[c] ?? []
        next[c] = on ? cur.filter(n => !ids.includes(n)) : [...new Set([...cur, ...ids])]
      })
      return next
    })
    const total = Object.values(map).reduce((s, v) => s + v.length, 0)
    onToast(`${PRESETS.find(x => x.v === p)?.t} 프리셋 ${on ? '해제' : `적용 (${total}개 잔기)`}`)
  }

  const toggleResi = (c: string, n: number) => {
    setSel(prev => {
      const cur = prev[c] ?? []
      return { ...prev, [c]: cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n] }
    })
  }

  const loadStructure = (src: string) => {
    if (src === 'fasta') {
      setPickerBusy(true)
      onToast(`${S('af2_provider') === 'alphafold2' ? 'AlphaFold2' : 'ColabFold'}로 타깃 구조를 예측하고 있습니다.`)
      setTimeout(() => {
        setPickerBusy(false); setPickerSource('fasta'); setSel({}); setActivePresets([])
        log('예측 구조를 불러왔습니다: run_0418/af2/target_pred.pdb', 'o')
        onToast('예측 구조를 불러왔습니다: run_0418 : af2/target_pred.pdb')
      }, 1500)
      return
    }
    setPickerSource(src); setSel({}); setActivePresets([])
    const t = PICKER_SOURCES.find(x => x.v === src)?.t ?? src
    log(`Residue Picker 구조 소스: ${t}`)
    onToast(`구조를 불러왔습니다: ${t}`)
  }

  const applyPicker = () => {
    if (!selCount) {
      set('fixed_positions_extra', '')
      onToast('선택이 비어 있어 고정 잔기(fixed_positions_extra)를 비웠습니다.')
      return
    }
    set('fixed_positions_extra', selSpec)
    onToast(`${selCount}개 잔기를 고정 잔기에 적용했습니다.`)
  }

  const residueState = (c: string, n: number) => {
    if ((sel[c] ?? []).includes(n)) return '선택됨'
    if ((presetMap('surface')[c] ?? []).includes(n)) return '표면'
    if ((presetMap('core')[c] ?? []).includes(n)) return '내부'
    if ((presetMap('interface')[c] ?? []).includes(n)) return '인터페이스'
    return '일반'
  }

  /* ---------------- Residue Picker 본문 ---------------- */
  const pickerBody = (
    <div className="col" style={{ gap: 16 }}>
      <div className="row wrap">
        {PICKER_SOURCES.map(s => (
          <button key={s.v} className={'btn' + (pickerSource === s.v ? ' primary' : '')}
            disabled={pickerBusy} onClick={() => loadStructure(s.v)}>
            {s.t}
          </button>
        ))}
        {pickerBusy && <span className="badge run"><RefreshCw size={14} />구조 예측중</span>}
      </div>
      <div className="row wrap">
        <span className="muted">구조 소스: {pickerSource ? PICKER_SOURCES.find(s => s.v === pickerSource)?.t : '불러오지 않음'}</span>
        <div className="sp" />
        <span className={selCount ? 'muted' : 'faint'}>
          {selCount ? `선택 잔기: ${selSpec}` : '선택된 잔기가 없습니다.'}
        </span>
      </div>

      {!pickerSource && (
        <div className="signal warn">
          <Info size={16} className="ic" color="var(--warn)" />
          <div>
            <b>구조를 먼저 불러오세요</b>
            <p>
              {hasTarget
                ? isPdb
                  ? '업로드한 PDB를 바로 불러올 수 있습니다. RFD3 시드 PDB나 선택한 실행의 구조도 사용할 수 있습니다.'
                  : '입력이 FASTA입니다. 구조 예측으로 좌표를 만든 뒤 잔기를 선택하세요.'
                : '타깃이 없습니다. 입력 단계에서 타깃을 추가하면 구조 소스를 사용할 수 있습니다.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid g2">
        <Field label="표면 판정 컷오프 (Å²)" hint="surface_area_cutoff · 기본 2.5, PyMOL 노출 면적 기준">
          <input className="input" type="number" min={0} step={0.1} value={surfaceCutoff}
            onChange={e => { setSurfaceCutoff(Number(e.target.value) || 0); onToast(`표면 판정 컷오프 ${e.target.value} Å²로 변경`) }} />
        </Field>
        <Field label="뷰어 색상 모드" hint="secondary · chain · spectrum (N→C)">
          <div className="seg">
            {([['secondary', '2차 구조'], ['chain', '체인'], ['spectrum', 'N→C']] as const).map(([v, t]) => (
              <button key={v} className={viewerColor === v ? 'on' : ''} onClick={() => setViewerColor(v)}>{t}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="row wrap">
        <span className="muted">프리셋</span>
        {PRESETS.map(p => {
          const disabled = !pickerSource || (!p.spatial && !consAvailable)
          const reason = !pickerSource
            ? '구조를 먼저 불러오세요.'
            : !p.spatial && !consAvailable
              ? '보존도 프리셋은 MMseqs2 보존도 미리보기가 있는 단일 체인에서만 사용할 수 있습니다.'
              : `${Object.values(presetMap(p.v)).reduce((s, v) => s + v.length, 0)}개 잔기`
          return (
            <button key={p.v} className={'btn' + (activePresets.includes(p.v) ? ' primary' : '')}
              disabled={disabled} title={reason} onClick={() => togglePreset(p.v)}>
              {p.t}
            </button>
          )
        })}
      </div>

      <StructureViewer label={pickerSource ? `picker:${pickerSource}` : 'picker:empty'} seed={6} height={260} />
      <div className="col" style={{ gap: 4 }}>
        <span className="muted">Cartoon 표시 · 기본 색상: {viewerColor === 'secondary' ? '2차 구조' : viewerColor === 'chain' ? '체인' : 'N→C 스펙트럼'}</span>
        <span className="muted">선택 잔기: 주황색 (#d9480f)</span>
        <span className="muted">
          {hoverResi
            ? `${hoverResi.c}:${hoverResi.n} ${AA3[hoverResi.ch] ?? hoverResi.ch} · ${residueState(hoverResi.c, hoverResi.n)}`
            : '잔기에 마우스를 올리면 체인 · 번호 · 잔기명 · 상태가 표시됩니다.'}
        </span>
      </div>

      <div className="divider" />

      <div className="col" style={{ gap: 16 }}>
        <div className="row wrap">
          <b>체인별 서열</b>
          <div className="sp" />
          {AA_GROUPS.map(g => (
            <span key={g.name} className="badge" style={{ background: g.bg, color: g.fg, borderColor: g.bg }}>{g.name}</span>
          ))}
        </div>
        {pickerChains.map(c => (
          <div key={c.id} className="seq">
            <div className="ruler">
              <span className="lbl">위치</span>
              {Array.from({ length: Math.ceil(c.seq.length / 10) }, (_, i) => (
                <span key={i} style={{ display: 'inline-block', width: 140, textAlign: 'left' }}>{c.start + i * 10}</span>
              ))}
            </div>
            <div>
              <span className="lbl">Chain {c.id}</span>
              {c.seq.split('').map((ch, i) => {
                const n = c.start + i
                const on = (sel[c.id] ?? []).includes(n)
                const st = aaStyle(ch)
                return (
                  <span key={n} className="r"
                    style={{ ...(on ? { background: '#d9480f', color: '#fff' } : st), cursor: 'pointer' }}
                    title={`${c.id}:${n} ${AA3[ch] ?? ch} · ${residueState(c.id, n)}`}
                    onMouseEnter={() => setHoverResi({ c: c.id, n, ch })}
                    onMouseLeave={() => setHoverResi(null)}
                    onClick={() => toggleResi(c.id, n)}>
                    {ch}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="row wrap">
        <label className="check">
          <input type="checkbox" checked={popupPref} onChange={e => { setPopupPref(e.target.checked); onToast(e.target.checked ? '다음부터 팝업으로 엽니다.' : '카드 안에서 엽니다.') }} />
          팝업으로 열기
        </label>
        <div className="sp" />
        <button className="btn" onClick={() => { setSel({}); setActivePresets([]); onToast('선택을 해제했습니다.') }}>
          <Eraser size={14} />선택 해제
        </button>
        <button className="btn primary" onClick={applyPicker}>
          <Check size={14} />고정 잔기에 적용
        </button>
      </div>
    </div>
  )

  /* ---------------- 요청 미리보기 ---------------- */
  const requestJson = JSON.stringify({
    run_id: runName || 'advanced_run_01',
    mode: mode === 'surrogate' ? 'pipeline' : mode,
    stages,
    start_from: S('start_from'),
    stop_after: S('stop_after'),
    selected_tiers: tiers.map(Number),
    num_seq_per_tier: N('num_seq_per_tier'),
    rfd3: { use: B('rfd3_use'), mode: S('rfd3_mode'), max_return_designs: N('rfd3_max_return_designs') },
    bioemu: { use: B('bioemu_use'), num_samples: N('bioemu_num_samples'), max_return_structures: N('bioemu_max_return_structures') },
    af2: { provider: S('af2_provider'), plddt_cutoff: N('af2_plddt_cutoff'), rmsd_cutoff: N('af2_rmsd_cutoff'), max_candidates_per_tier: N('af2_max_candidates_per_tier') },
    surrogate: B('surrogate_triage_enabled') ? { scope: S('surrogate_triage_scope'), initial_samples: N('surrogate_triage_initial_samples'), top_k: N('surrogate_triage_top_k'), model: S('surrogate_triage_model'), cv_folds: N('surrogate_triage_cv_folds') } : null,
    relax_enabled: B('relax_enabled'),
    novelty_enabled: B('novelty_enabled'),
    fixed_positions_extra: S('fixed_positions_extra'),
    confirm_run: S('confirm_run') === 'true',
  }, null, 2)

  return (
    <>
      <PageHead
        title="고급 설정"
        desc="다섯 단계를 차례로 채운 뒤 마지막 검토 단계에서 실행하세요."
        actions={<>
          <button className="btn" onClick={resetInputs}><RefreshCw size={14} />입력 초기화</button>
          <button className="btn primary" disabled={!canRun} title={canRun ? undefined : runHintText} onClick={doRun}>
            <Play size={14} />실행
          </button>
        </>}
      />

      {/* 단계 막대를 본문 바로 위에 두어 지금 어디인지 먼저 보이게 한다. */}
      <div className="steps pg-run-steps">
        {STEP_LABELS.map((s, i) => (
          <div key={s} className={'step ' + (i === step ? 'on' : i < step ? 'done' : '')} onClick={() => setStep(i)}>
            <span className="n">{i + 1}</span>{s}
          </div>
        ))}
      </div>

      <div className="grid g-2-1">
        <div className="col" style={{ gap: 16 }}>
          <GroupTitle title={`${step + 1}. ${STEP_LABELS[step]}`} sub={STEP_HEADLINES[step]} />

      {/* ---------------- 1. 입력 ---------------- */}
      {step === 0 && (
        <>
          <Card title="타깃 입력" sub="PDB · mmCIF · FASTA 자동 판별">
            <div className="col" style={{ gap: 16 }}>
              <div className="row wrap">
                <input ref={fileRef} type="file" accept=".pdb,.ent,.cif,.mmcif,.bcif,.fa,.fasta,.txt,.seq"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setTargetFile(f.name); log(`타깃 파일 ${f.name}을 불러왔습니다.`, 'o'); onToast(`${f.name} 불러옴.`) } }} />
                <button className="btn" onClick={() => fileRef.current?.click()}><FileUp size={14} />파일 선택</button>
                <button className="btn ghost" onClick={() => { setTargetFile('1EMA.pdb'); onToast('예시 타깃 1EMA.pdb 불러옴.') }}>예시 타깃 1EMA</button>
                {targetFile && <button className="btn ghost danger" onClick={() => { setTargetFile(''); onToast('타깃 파일을 비웠습니다.') }}><Trash2 size={14} />비우기</button>}
                <div className="sp" />
                <span className="badge">{isPdb ? '구조 입력 (PDB)' : '서열 입력 (FASTA)'}</span>
              </div>
              <span className={hasTarget ? 'muted' : 'faint'}>
                {targetFile ? `${targetFile} 불러옴.` : S('target_input').trim() ? '텍스트 입력 준비됨.' : '아직 타깃을 불러오지 않았습니다.'}
              </span>
              {F('target_input')}
              {G(['design_chains', 'pdb_strip_nonpositive_resseq'])}
              {!isPdb && F('rfd3_input_pdb')}
              {(mode === 'standalone' && S('standalone_stage') === 'diffdock') && F('diffdock_ligand')}
            </div>
          </Card>

          <Fold title="자연어 설정 노트" sub="메모를 적으면 설정값을 제안합니다.">
            <div className="col" style={{ gap: 16 }}>
              <Field label="메모 또는 자연어 설정" hint="prompt · 선택 입력, 실행 메타데이터에 함께 저장됩니다.">
                <textarea className="input" rows={3} value={prompt}
                  placeholder="예: 보존도가 낮은 구간을 넓게 탐색하고 구조 신뢰도를 높게 잡아서 af2까지만 돌려 주세요."
                  onChange={e => setPrompt(e.target.value)} />
              </Field>
              <div className="row wrap">
                <button className="btn" onClick={() => { setPrompt(''); onToast('메모를 비웠습니다.') }}><Eraser size={14} />메모 지우기</button>
                <div className="sp" />
                <button className="btn primary" onClick={() => {
                  if (!prompt.trim()) { onToast('먼저 자연어 설정을 입력하세요.'); return }
                  setPlanOpen(true); log(`plan_from_prompt: ${PLAN_QUESTIONS.length}개 항목을 제안했습니다.`, 'o')
                  onToast(`자연어 설정에서 ${PLAN_QUESTIONS.length}개 항목을 제안했습니다.`)
                }}>
                  <Sparkles size={14} />설정 제안 생성
                </button>
              </div>
              {planOpen && (
                <>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr><th className="no">No.</th><th>항목</th><th>파라미터 키</th><th>제안값</th><th>근거</th><th>적용</th></tr>
                      </thead>
                      <tbody>
                        {PLAN_QUESTIONS.map((p, i) => (
                          <tr key={p.k}>
                            <td className="no">{i + 1}</td>
                            <td>{p.label}</td>
                            <td className="mono">{p.k}</td>
                            <td>{p.suggest}</td>
                            <td className="muted">{p.reason}</td>
                            <td>
                              <button className="btn sm" onClick={() => { log(`제안 적용: ${p.k} = ${p.suggest}`, 'o'); onToast(`${p.label} 제안값을 적용했습니다.`) }}>적용</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="row">
                    <div className="sp" />
                    <button className="btn" onClick={() => { setPlanOpen(false); onToast('제안 목록을 닫았습니다.') }}>닫기</button>
                    <button className="btn primary" onClick={() => {
                      setAnswers(a => ({ ...a, selected_tiers: ['0.3', '0.5'], num_seq_per_tier: 4, af2_plddt_cutoff: 88, relax_enabled: true, stop_after: 'af2' }))
                      log('제안 5건을 모두 적용했습니다.', 'o'); onToast('제안 5건을 모두 적용했습니다.')
                    }}><Wand2 size={14} />모두 적용</button>
                  </div>
                </>
              )}
            </div>
          </Fold>

          <Fold title="문헌 기반 마스킹" sub="논문에서 고정할 잔기를 찾아 적용합니다.">
            <PaperMask onToast={onToast} onApply={spec => set('fixed_positions_extra', spec)} />
          </Fold>

          <Fold title="활동 로그" sub="이 화면에서 바꾼 값의 기록입니다." count={logs.length}>
            <div className="col" style={{ gap: 16 }}>
              {logs.length === 0
                ? <div className="empty">기록된 활동이 없습니다.</div>
                : <div className="log">
                  {logs.map((l, i) => (
                    <div key={i}><span className="t">{l.t}</span> <span className={l.c}>{l.m}</span></div>
                  ))}
                </div>}
              <div className="row">
                <div className="sp" />
                <button className="btn sm" onClick={() => { setLogs([]); onToast('활동 로그를 비웠습니다.') }}>비우기</button>
              </div>
            </div>
          </Fold>

          <Fold title="다른 실행에서 설정 가져오기" sub="고른 실행의 설정을 이 양식으로 복사합니다.">
            <div className="col" style={{ gap: 16 }}>
              <div className="grid g2">
                <Field label="실행 선택" hint="설정을 복사해 올 실행을 고르세요.">
                  <select className="input" value={runSel} onChange={e => { setRunSel(e.target.value); setPf(null) }}>
                    <option value="">실행 선택</option>
                    {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
                  </select>
                </Field>
                <Field label="현재 상태" hint="고른 실행의 단계와 상태입니다.">
                  <div className="row wrap">
                    <span className="badge">단계 {selRun?.stage ?? '-'}</span>
                    {selRun ? <State s={selRun.status} /> : <span className="badge">상태 -</span>}
                  </div>
                </Field>
              </div>
              <div className="row wrap">
                <button className="btn" disabled={!runSel} title={runSel ? undefined : '먼저 실행을 고르세요'} onClick={loadRequest}>
                  <FileUp size={14} />설정 불러오기
                </button>
                <div className="sp" />
                <span className="muted">{reuseHint}</span>
              </div>
            </div>
          </Fold>
        </>
      )}

      {/* ---------------- 2. 워크플로 ---------------- */}
      {step === 1 && (
        <>
          <div className="grid g2">
            {RUN_MODE_CARDS.map(c => (
              <div key={c.v} className={'pipe-card' + (mode === c.v ? ' on' : '')}
                onClick={() => { set('run_mode', c.v); if (c.v === 'surrogate') applyPreset() }}>
                <span className={'badge ' + (c.v === 'surrogate' ? 'accent' : 'brand')}>{c.badge}</span>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
                <div className="flow">{c.flow.map(s => <span key={s}>{s}</span>)}</div>
              </div>
            ))}
          </div>

          {mode === 'standalone' && (
            <Card title="단일 실행 단계" sub="선택한 단계만 실행합니다">
              <div className="col" style={{ gap: 16 }}>
                {F('standalone_stage')}
                <div className="signal">
                  <Info size={16} className="ic" color="var(--text-3)" />
                  <div>
                    <b>{S('standalone_stage')}</b>
                    <p>{STAGE_GUIDE[S('standalone_stage')] ?? '리간드 도킹을 수행하고 결합 포즈를 생성합니다.'}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {mode === 'workflow' && (
            <>
              <GroupTitle title="워크플로 설계" sub="단계를 배치하고 체크포인트를 지정합니다" />
              <div className="grid g2">
                <Card title="단계 팔레트" sub="클릭하면 캔버스에 추가">
                  <div className="col" style={{ gap: 8 }}>
                    {PIPELINE_STAGES.concat('diffdock').map(s => (
                      <button key={s} className="btn" style={{ justifyContent: 'flex-start' }}
                        onMouseEnter={() => setHoverStage(s)} onMouseLeave={() => setHoverStage('')}
                        onClick={() => { setWfStages(w => w.includes(s) ? w : [...w, s]); onToast(`${s} 단계를 추가했습니다.`) }}>
                        <Plus size={14} /><span className="mono">{s}</span>
                      </button>
                    ))}
                  </div>
                </Card>
                <Card title="Flow Canvas">
                  <div className="col" style={{ gap: 8 }}>
                    {wfStages.length === 0 && <div className="empty">단계를 추가하세요.</div>}
                    {wfStages.map(s => (
                      <div key={s} className="row" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 12px' }}>
                        <span className="mono">{s}</span>
                        {checkpoints.includes(s) && <span className="badge warn">Checkpoint</span>}
                        {s === wfStages[wfStages.length - 1] && <span className="badge brand">Final</span>}
                        <div className="sp" />
                        <button className="btn sm ghost" onClick={() => { setCheckpoints(c => c.includes(s) ? c.filter(x => x !== s) : [...c, s]); onToast(`${s} 체크포인트 전환`) }}>
                          체크포인트
                        </button>
                        <button className="btn sm ghost danger" onClick={() => { setWfStages(w => w.filter(x => x !== s)); onToast(`${s} 단계를 제거했습니다.`) }}>
                          <X size={14} />제거
                        </button>
                      </div>
                    ))}
                    <span className="faint">단계 순서는 msa → rfd3 → bioemu → design → soluprot → af2 → novelty로 고정되어 있습니다.</span>
                  </div>
                </Card>
              </div>

              <Card title="단계 설명과 체크포인트 옵션" sub="팔레트 단계 설명과 중단 동작">
                <div className="col" style={{ gap: 8 }}>
                    <div className="signal">
                      <Info size={16} className="ic" color="var(--text-3)" />
                      <div>
                        <b>{hoverStage || '단계 설명'}</b>
                        <p>{hoverStage ? (STAGE_GUIDE[hoverStage] ?? '리간드 도킹을 수행하고 결합 포즈를 생성합니다.') : '왼쪽 팔레트의 단계에 마우스를 올리면 설명이 나타납니다.'}</p>
                      </div>
                    </div>
                    <div className="divider" />
                    {[
                      ['pause', '체크포인트에서 일시정지'],
                      ['results', '체크포인트 결과 표시'],
                      ['graph', '체크포인트에서 그래프 표시'],
                      ['rerun', '검토 패널에서 단계 재실행 허용'],
                    ].map(([v, t]) => (
                      <label key={v} className="check">
                        <input type="checkbox" checked={wfOpts.includes(v)}
                          onChange={() => { setWfOpts(o => o.includes(v) ? o.filter(x => x !== v) : [...o, v]); onToast(`${t} 전환`) }} />
                        {t}
                      </label>
                  ))}
                </div>
              </Card>

              <Card title="계획 스냅샷" sub={`${wfStages.length}단계 · 체크포인트 ${checkpoints.length}개`}>
                <div className="col" style={{ gap: 16 }}>
                  <div className="flow">{wfStages.map(s => <span key={s}>{s}</span>)}</div>
                  <span className="muted">
                    계획: {wfStages[0] ?? '-'} → {wfStages[wfStages.length - 1] ?? '-'} (최종 {wfStages[wfStages.length - 1] ?? '-'})
                  </span>
                  <span className="muted">
                    체크포인트: {checkpoints.length ? checkpoints.join(', ') : '없음 (중단 없이 실행)'}
                  </span>
                  <div className="row">
                    <div className="sp" />
                    <button className="btn" onClick={() => { log('Plan Snapshot을 저장했습니다.', 'o'); onToast('Plan Snapshot을 저장했습니다.') }}>스냅샷 저장</button>
                    <button className="btn primary" onClick={() => { onToast('단계별 실행 작업을 만들었습니다.'); nav('/workflow') }}>
                      단계별 실행으로 보내기
                    </button>
                  </div>
                </div>
              </Card>
            </>
          )}

          <GroupTitle title="실행 범위와 모델" sub="시작 단계, 중단 단계, 백본 소스" />
          <Card title="워크플로 제어">
              <div className="col" style={{ gap: 16 }}>
                {G(['start_from', 'stop_after'])}
                {G(['rfd3_use', 'bioemu_use'])}
                {G(['relax_enabled', 'novelty_enabled'])}
                {F('af2_provider')}
              </div>
          </Card>

          <Card title="단계 계획 요약" sub={stages.join(' → ') || '실행할 단계 없음'}>
            <div className="col" style={{ gap: 16 }}>
              {stages.length === 0
                ? <div className="empty">실행할 단계가 없습니다. 시작 단계와 중단 단계를 확인하세요.</div>
                : <div className="flow">{stages.map(s => <span key={s}>{s}</span>)}</div>}
              <dl className="kv">
                <dt>실행 모드</dt><dd>{RUN_MODE_CARDS.find(c => c.v === mode)?.title ?? mode}</dd>
                <dt>단계 범위</dt><dd className="mono">{S('start_from')} → {S('stop_after')}</dd>
                <dt>백본 소스</dt><dd>{[B('rfd3_use') && 'RFD3', B('bioemu_use') && 'BioEmu'].filter(Boolean).join(', ') || '없음'}</dd>
                <dt>구조 예측기</dt><dd>{S('af2_provider') === 'colabfold' ? 'ColabFold (기본)' : 'AlphaFold2'}</dd>
                <dt>Relax</dt><dd>{B('relax_enabled') ? '사용' : '미사용'}</dd>
                <dt>WT Diff</dt><dd>{B('novelty_enabled') ? '사용' : '미사용'}</dd>
              </dl>
            </div>
          </Card>

          <Card title="대리모델 예산 선별" sub={B('surrogate_triage_enabled') ? '사용중' : '미사용'}>
            <div className="col" style={{ gap: 16 }}>
              <div className="row">
                <div className="sp" />
                <button className="btn sm" onClick={applyPreset}><Wand2 size={14} />프리셋 적용</button>
              </div>
              {G(['surrogate_triage_enabled', 'surrogate_triage_scope'])}
              {B('surrogate_triage_enabled')
                ? <div className="signal ok">
                  <Check size={16} className="ic" color="var(--ok)" />
                  <div>
                    <b>트리아지 사용중</b>
                    <p>SoluProt 통과 풀을 ESM 임베딩으로 표현하고, 구조 예측은 학습 세트 {N('surrogate_triage_initial_samples')}건과 Top K {N('surrogate_triage_top_k')}건에만 사용합니다. 세부 값은 기준 단계에서 조정합니다.</p>
                  </div>
                </div>
                : <div className="signal">
                  <Info size={16} className="ic" color="var(--text-3)" />
                  <div>
                    <b>트리아지 미사용</b>
                    <p>켜면 RFD3와 BioEmu를 쓰지 않고, 보존율별 후보가 3333개로 늘어납니다.</p>
                  </div>
                </div>}
            </div>
          </Card>
        </>
      )}

      {/* ---------------- 3. 기준 ---------------- */}
      {step === 2 && (
        <>
          <div className="grid g2">
            <Card title="평가 기준" sub="보존율과 후보 수">
              <div className="col" style={{ gap: 16 }}>
                {F('selected_tiers')}
                {G(['design_chains', 'num_seq_per_tier'])}
                {F('af2_max_candidates_per_tier')}
                <span className="muted">
                  보존율 {tiers.length}단계 × 백본 {backbones}개 × 서열 {N('num_seq_per_tier')}개 ≈ 설계 서열 {estSeq}개
                </span>
              </div>
            </Card>
            <Card title="후보 기준" sub="통과 컷오프">
              <div className="col" style={{ gap: 16 }}>
                {G(['af2_plddt_cutoff', 'af2_rmsd_cutoff'])}
                {G(['soluprot_cutoff', 'relax_score_per_residue_cutoff'])}
              </div>
            </Card>
          </div>

          <GroupTitle title="백본 생성 단계 설정" sub="BioEmu와 RFD3 세부값" />

          <Card title="BioEmu" sub={B('bioemu_use') ? '구조 요동 샘플링' : '현재 설정에서 비활성'}>
            {B('bioemu_use')
              ? <div className="col" style={{ gap: 16 }}>
                {G(['bioemu_num_samples', 'bioemu_max_return_structures'])}
                {G(['bioemu_filter_samples', 'backbone_filter_use_dssp'])}
              </div>
              : <div className="empty">BioEmu가 꺼져 있어 현재 설정에서 비활성입니다. 워크플로 단계에서 BioEmu를 켜세요.</div>}
          </Card>

          <Card title="RFD3" sub={B('rfd3_use') ? `모드 ${S('rfd3_mode')}` : '현재 설정에서 비활성'}>
            {B('rfd3_use')
              ? <div className="col" style={{ gap: 16 }}>
                {G(['rfd3_max_return_designs', 'rfd3_mode'])}
                {S('rfd3_mode') === 'local_diversify' && G(['rfd3_partial_t', 'rfd3_is_non_loopy', 'rfd3_unindex'], 3)}
                {S('rfd3_mode') === 'legacy_contig' && G(['rfd3_contig', 'rfd3_length'])}
                {S('rfd3_mode') === 'binder' && G(['rfd3_hotspots', 'rfd3_contig', 'rfd3_infer_ori_strategy'], 3)}
                {S('rfd3_mode') === 'enzyme' && <div className="col" style={{ gap: 16 }}>{G(['rfd3_ligand', 'rfd3_contig'])}{F('rfd3_select_fixed_atoms')}</div>}
                {S('rfd3_mode') === 'advanced' && <div className="col" style={{ gap: 16 }}>{G(['rfd3_use_ensemble', 'rfd3_design_index'])}{F('rfd3_cli_args')}{F('rfd3_inputs_text')}</div>}
              </div>
              : <div className="empty">RFD3가 꺼져 있어 현재 설정에서 비활성입니다.</div>}
          </Card>

          <GroupTitle title="입력 정리와 선별 설정" sub="WT 비교 · 대리모델 · 진화 탐색" />

          <Card title="입력 정리와 WT 비교">
            {G(['pdb_strip_nonpositive_resseq', 'wt_compare', 'mask_consensus_apply', 'ligand_mask_use_original_target'], 2)}
          </Card>

          {B('surrogate_triage_enabled') && (
            <Card title="대리모델 선별 세부 설정">
              <div className="col" style={{ gap: 16 }}>
                {G(['surrogate_triage_scope', 'surrogate_triage_model'])}
                {G(['surrogate_triage_initial_samples', 'surrogate_triage_top_k', 'surrogate_triage_cv_folds'], 3)}
                {F('surrogate_triage_comparator_models')}
                {F('surrogate_triage_ensemble_models')}
                <div className="divider" />
                <span className="muted">
                  이 모드는 RFD3와 BioEmu를 사용하지 않고, SoluProt을 통과한 후보 풀을 ESM 워커로 임베딩한 뒤 학습 세트와 Top K에만 구조 예측을 사용합니다.
                </span>
                {G(['num_seq_per_tier', 'af2_provider'])}
              </div>
            </Card>
          )}

          <Card title="진화 탐색 (선택)" sub={B('evolution_mode') ? '사용중' : '측정값 기반 후보 탐색'}>
            <div className="col" style={{ gap: 16 }}>
              {F('evolution_mode')}
              {B('evolution_mode')
                ? <>
                  {G(['evolution_label_source', 'evolution_objective_metric'])}
                  {F('evolution_experiment_source_run_id')}
                  {G(['evolution_pool_size', 'evolution_initial_samples', 'evolution_oracle_samples'], 3)}
                  {G(['evolution_rounds', 'evolution_samples_per_round'])}
                </>
                : <span className="muted">진화 탐색을 켜면 후보 풀, 반복 횟수, 검증 후보 수 설정이 나타납니다.</span>}
            </div>
          </Card>
        </>
      )}

      {/* ---------------- 4. 전문가 ---------------- */}
      {step === 3 && (
        <>
          <GroupTitle title="설계 파라미터" sub="RMSD 한계, 샘플링, 고정 잔기" />

          <Card title="RMSD 한계와 샘플링">
            <div className="col" style={{ gap: 16 }}>
              {G(['bioemu_target_rmsd_cutoff', 'rfd3_target_rmsd_cutoff'])}
              {G(['compare_rmsd_scope', 'sampling_temp'])}
              {G(['seed', 'batch_size'])}
            </div>
          </Card>

          <Card title="고급 제약" sub={S('fixed_positions_extra') ? `고정 잔기 ${S('fixed_positions_extra')}` : '고정 잔기와 리간드 마스크'}>
            <div className="col" style={{ gap: 16 }}>
              {F('fixed_positions_extra')}
              {G(['ligand_mask_distance', 'ligand_resnames'])}
              {F('ligand_atom_chains')}
              {!S('ligand_resnames').trim() && (
                <div className="signal">
                  <Info size={16} className="ic" color="var(--text-3)" />
                  <div><b>리간드 마스크 비활성</b><p>리간드 resname이 비어 있어 현재 설정에서 비활성입니다.</p></div>
                </div>
              )}
            </div>
          </Card>

          <Card title="잔기 선택기" sub={selCount ? `선택 ${selCount}개` : '구조에서 고정 잔기 선택'}>
            <div className="col" style={{ gap: 16 }}>
              <div className="row wrap">
                <span className="badge">{selCount ? `선택 ${selCount}개` : '선택 없음'}</span>
                <div className="sp" />
                <button className="btn sm" onClick={() => { setPopupOpen(true); onToast('Residue Picker 팝업을 열었습니다.') }}>팝업으로 열기</button>
              </div>
              {popupPref && !popupOpen
                ? <div className="empty">팝업으로 열기 설정이 켜져 있습니다. 위의 팝업으로 열기 버튼을 사용하세요.</div>
                : pickerBody}
            </div>
          </Card>

          <GroupTitle title="단계별 세부 설정" sub="MSA, 구조 예측, 도킹" />

          <Card title="MSA · 보존도" sub="MMseqs2 파라미터">
            <div className="col" style={{ gap: 16 }}>
              {G(['mmseqs_use_gpu', 'mmseqs_max_seqs', 'mmseqs_threads'], 3)}
              {G(['msa_min_coverage', 'msa_min_identity', 'query_pdb_min_identity'], 3)}
              {F('conservation_tiers')}
              {G(['conservation_cluster_identity', 'conservation_cluster_coverage'])}
            </div>
          </Card>

          <Card title="구조 예측 · 도킹" sub="AF2 / DiffDock 추가 인자">
            <div className="col" style={{ gap: 16 }}>
              {G(['af2_top_k', 'af2_sequence_ids'])}
              {F('af2_extra_flags')}
              {F('diffdock_ligand')}
              {F('diffdock_extra_args')}
            </div>
          </Card>

          <GroupTitle title="원문 설정과 실행 제어" sub="직접 입력과 재현 옵션" />

          <Card title="단계별 원문 설정 (JSON · YAML)">
            <div className="col" style={{ gap: 16 }}>
              {F('bioemu_steering_config_text')}
              {F('rfd3_inputs_text')}
              {F('rfd3_env')}
            </div>
          </Card>

          <Card title="실행 제어" sub="재현과 복구">
            <div className="col" style={{ gap: 16 }}>
              {G(['dry_run', 'force'])}
              {G(['agent_panel_enabled', 'auto_recover'])}
              {F('pdb_renumber_resseq_from_1')}
            </div>
          </Card>
        </>
      )}

      {/* ---------------- 5. 검토 ---------------- */}
      {step === 4 && (
        <>
          <Card title="사전 점검" sub="실행 전에 막히는 곳이 없는지 확인하세요."
            right={<button className="btn sm" onClick={runPreflight}><CheckCircle2 size={13} />점검 실행</button>}>
            {!pf
              ? <div className="empty">점검 실행을 누르면 필수 입력과 차단 이슈, 경고를 확인합니다.</div>
              : <div className="col" style={{ gap: 8 }}>
                {pf.req.length === 0 && pf.block.length === 0 && (
                  <div className="signal ok"><Check size={16} className="ic" color="var(--ok)" />
                    <div><b>실행할 수 있습니다</b><p>필수 입력이 모두 채워졌고 설정 충돌도 없습니다.</p></div></div>
                )}
                {pf.block.map(m => (
                  <div key={m} className="signal err"><X size={16} className="ic" color="var(--err)" />
                    <div><b>실행 차단</b><p>{m}</p></div></div>
                ))}
                {pf.req.map(m => (
                  <div key={m} className="signal warn"><AlertTriangle size={16} className="ic" color="var(--warn)" />
                    <div><b>필수 입력</b><p>{m}</p></div></div>
                ))}
                {pf.warn.map(m => (
                  <div key={m} className="signal warn"><AlertTriangle size={16} className="ic" color="var(--warn)" />
                    <div><b>경고</b><p>{m}</p></div></div>
                ))}
                <Fold title="정상으로 확인된 항목" count={PREFLIGHT_OK.length}>
                  <div className="col" style={{ gap: 8 }}>
                    {PREFLIGHT_OK.map(m => (
                      <div key={m} className="signal ok"><Check size={16} className="ic" color="var(--ok)" />
                        <div><b>정상</b><p>{m}</p></div></div>
                    ))}
                  </div>
                </Fold>
              </div>}
          </Card>

          <Card title="실행 확인" sub="이름을 정하고 실행에 동의하세요.">
            <div className="col" style={{ gap: 16 }}>
              <div className="grid g2">
                <Field label="실행 이름" hint="비우면 자동으로 만들어집니다.">
                  <input className="input" placeholder="advanced_run_01" value={runName} onChange={e => setRunName(e.target.value)} />
                </Field>
                {F('confirm_run')}
              </div>
            </div>
          </Card>

          <Card title="실행 요약" sub="이 설정으로 실행됩니다.">
            <dl className="kv" style={{ gridTemplateColumns: '150px 1fr' }}>
              <dt>실행 모드</dt><dd>{RUN_MODE_CARDS.find(c => c.v === mode)?.title ?? '선택되지 않음'}</dd>
              <dt>단계</dt><dd className="mono">{stages.join(' → ') || '선택되지 않음'}</dd>
              <dt>입력</dt><dd>{hasTarget ? `타깃 불러옴 (${targetFile || (isPdb ? 'PDB 텍스트' : 'FASTA 텍스트')})` : '타깃 없음'}</dd>
              <dt>설계 체인</dt><dd>{S('design_chains') === 'all' ? '전체 체인' : S('design_chains')}</dd>
              <dt>RFD3</dt><dd>{B('rfd3_use') ? `사용 · ${S('rfd3_mode')} · 반환 ${N('rfd3_max_return_designs')}` : '미사용'}</dd>
              <dt>BioEmu</dt><dd>{B('bioemu_use') ? `사용 · 생성 ${N('bioemu_num_samples')} / 반환 ${N('bioemu_max_return_structures')}` : '미사용'}</dd>
              <dt>구조 예측</dt><dd>{`${S('af2_provider') === 'colabfold' ? 'ColabFold' : 'AlphaFold2'} · pLDDT ${N('af2_plddt_cutoff')} · RMSD ${N('af2_rmsd_cutoff')} Å`}</dd>
              <dt>Relax</dt><dd>{B('relax_enabled') ? '사용' : '미사용'}</dd>
              <dt>보존율</dt><dd>{tiers.length ? tiers.map(t => `${Math.round(+t * 100)}%`).join(', ') : '선택되지 않음'}</dd>
              <dt>대리모델 선별</dt><dd>{B('surrogate_triage_enabled') ? `사용 · 학습 ${N('surrogate_triage_initial_samples')} / 상위 ${N('surrogate_triage_top_k')}` : '미사용'}</dd>
              <dt>진화 탐색</dt><dd>{B('evolution_mode') ? `사용 · ${N('evolution_rounds')}라운드 · 풀 ${N('evolution_pool_size')}` : '미사용'}</dd>
              <dt>고정 잔기</dt><dd className="mono">{S('fixed_positions_extra') || '-'}</dd>
            </dl>
          </Card>

          <Fold title="요청 미리보기" sub="실행 요청에 담기는 값 그대로입니다.">
            <div className="log">
              {requestJson.split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </Fold>
        </>
      )}

        </div>

        {/* 어느 단계에 있든 규모와 준비 상태를 같은 자리에서 보게 둔다. */}
        <div className="pg-run-side">
          <Card title="실행 요약">
            <div className="col" style={{ gap: 16 }}>
              <div className="col" style={{ gap: 8 }}>
                <div className={'pg-run-chk' + (hasTarget ? ' on' : '')}>
                  <Check size={15} />타깃 {hasTarget ? (targetFile || '원문 입력') : '필요'}
                </div>
                <div className={'pg-run-chk' + (tiers.length ? ' on' : '')}>
                  <Check size={15} />보존율 {tiers.length ? tiers.map(t => `${Math.round(+t * 100)}%`).join(', ') : '필요'}
                </div>
                <div className={'pg-run-chk' + (stages.length ? ' on' : '')}>
                  <Check size={15} />{stages.length ? `실행 단계 ${stages.length}개` : '실행할 단계 없음'}
                </div>
                <div className={'pg-run-chk' + (S('confirm_run') === 'true' ? ' on' : '')}>
                  <Check size={15} />실행 확인 {S('confirm_run') === 'true' ? '완료' : '필요'}
                </div>
              </div>

              <div className="divider" />

              <div className="col" style={{ gap: 12 }}>
                <div className="pg-run-est">
                  <span className="pg-run-est-l">실행 단계</span>
                  <b className="pg-run-est-v">{stages.length}개</b>
                  <span className="pg-run-est-n">{stages.join(' → ') || '단계 없음'}</span>
                </div>
                <div className="pg-run-est">
                  <span className="pg-run-est-l">설계 서열 추정</span>
                  <b className="pg-run-est-v">{estSeq}개</b>
                  <span className="pg-run-est-n">보존율 {tiers.length} × 백본 {backbones} × 서열 {N('num_seq_per_tier')}</span>
                </div>
                <div className="pg-run-est">
                  <span className="pg-run-est-l">구조 예측 추정</span>
                  <b className="pg-run-est-v">{estAf2}건</b>
                  <span className="pg-run-est-n">{B('surrogate_triage_enabled') ? '학습 + 상위 K' : '컷오프 통과 후보'}</span>
                </div>
              </div>

              <div className="divider" />

              <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={runPreflight}>
                <CheckCircle2 size={14} />사전 점검
              </button>
              <span className={canRun ? 'muted' : 'hint'}>{runHintText}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ---------------- 단계 이동 ---------------- */}
      <div className="pg-run-nav">
        <div className="row wrap">
          <button className="btn" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={14} />이전
          </button>
          <span className="muted">{step + 1} / {STEP_LABELS.length} · {STEP_LABELS[step]}</span>
          <div className="sp" />
          {step < STEP_LABELS.length - 1
            ? <button className="btn primary" onClick={() => setStep(s => s + 1)}>
              다음: {STEP_LABELS[step + 1]}<ChevronRight size={14} />
            </button>
            : <button className="btn primary" disabled={!canRun} title={canRun ? undefined : runHintText} onClick={doRun}>
              <Play size={14} />이 설정으로 실행
            </button>}
        </div>
      </div>

      {popupOpen && (
        <Modal
          title="Residue Picker 팝업"
          onClose={() => setPopupOpen(false)}
          footer={<>
            <button className="btn" onClick={() => { setPopupOpen(false); onToast('팝업을 닫았습니다.') }}>창 닫기</button>
            <button className="btn primary" onClick={() => { applyPicker(); setPopupOpen(false) }}>적용 후 닫기</button>
          </>}
        >
          <span className="muted">
            {selCount
              ? `선택한 ${selCount}개 잔기를 고급 설정의 고정 잔기로 되돌려 적용합니다.`
              : '선택이 비어 있으면 적용 시 고정 잔기를 비웁니다.'}
          </span>
          {pickerBody}
        </Modal>
      )}
    </>
  )
}
