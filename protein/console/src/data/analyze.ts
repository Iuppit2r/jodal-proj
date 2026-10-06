/* 결과 분석 화면 전용 목업 데이터.
   원본 파이프라인의 Analyze 탭(실행 컨텍스트 / Compare Studio / 산출물 / 피드백 / 실험 /
   보고서 / 실행 간 비교 / Hit List / 차트) 기능을 모두 담기 위한 정적 데이터이다. */
import { MUTATION_SITES, WT_SEQ } from './mock'

export const AF2_PROVIDER = 'ColabFold'
export const WT_LEN = WT_SEQ.length

function rng(seed: number) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

const ALT = 'AVLIFWYGSTNQDEKRH'

function mutate(seed: number, n: number) {
  const arr = WT_SEQ.split('')
  const r = rng(seed)
  for (let i = 0; i < n; i++) {
    const p = Math.floor(r() * arr.length)
    arr[p] = ALT[Math.floor(r() * ALT.length)]
  }
  return arr.join('')
}

/* ---------------- Hit List ---------------- */

export type HitSource = 'input_pdb' | 'rfd3' | 'bioemu'
export type SurrogateRole = 'top_k' | 'training' | 'evaluated' | null

export interface HitRow {
  seqId: string
  source: HitSource
  surrogateRole: SurrogateRole
  surrogateRank: number | null
  tier: 30 | 50 | 70
  soluprot: number
  plddt: number | null
  rmsd: number | null
  relax: number | null
  wtDiffN: number
  identity: number
  af2Selected: boolean
  isWt: boolean
  hasPdb: boolean
}

const SOURCES: HitSource[] = ['rfd3', 'bioemu', 'rfd3', 'bioemu', 'input_pdb']
const TIERS: HitRow['tier'][] = [70, 50, 30]

export const HIT_ROWS: HitRow[] = [
  {
    seqId: 'wt_1EMA',
    source: 'input_pdb',
    surrogateRole: 'evaluated',
    surrogateRank: null,
    tier: 70,
    soluprot: 0.712,
    plddt: 96.2,
    rmsd: 0,
    relax: -0.42,
    wtDiffN: 0,
    identity: 100,
    af2Selected: true,
    isWt: true,
    hasPdb: true,
  },
  ...Array.from({ length: 119 }, (_, i) => {
    const r = rng(i + 11)
    const noAf2 = i > 44 && i % 7 === 3
    const soluprot = +(0.38 + r() * 0.56).toFixed(3)
    const plddt = noAf2 ? null : +(61 + r() * 35).toFixed(1)
    const rmsd = noAf2 ? null : +(0.52 + r() * 2.9).toFixed(2)
    const relax = noAf2 ? null : +(-1.9 + r() * 2.6).toFixed(3)
    const wtDiffN = 2 + Math.round(r() * 22)
    const role: SurrogateRole = i < 20 ? 'top_k' : i < 52 ? 'training' : 'evaluated'
    return {
      seqId: `seq_${String(i + 1).padStart(4, '0')}`,
      source: SOURCES[i % SOURCES.length],
      surrogateRole: role,
      surrogateRank: role === 'top_k' ? i + 1 : null,
      tier: TIERS[(i >> 1) % 3],
      soluprot,
      plddt,
      rmsd,
      relax,
      wtDiffN,
      identity: +(100 * (1 - wtDiffN / WT_LEN)).toFixed(1),
      af2Selected: plddt !== null && plddt >= 85 && (rmsd ?? 9) <= 2,
      isWt: false,
      hasPdb: i % 11 !== 5,
    } satisfies HitRow
  }),
]

export const SURROGATE_ROLE_LABEL: Record<string, string> = {
  top_k: 'Top-K',
  training: '학습',
  evaluated: '평가',
}

export const SURROGATE_MODEL_LABEL: Record<string, string> = {
  auto: 'CV 자동 선택',
  rf: 'Random forest',
  ridge: 'Ridge',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  ensemble: 'Rank ensemble',
}

export const SURROGATE_TRIAGE = {
  selectedPolicy: 'rf',
  strategy: 'auto (CV 선택)',
  countBefore: 9999,
  countAfter: 1240,
  expectedAf2: 50,
  trainingCount: 30,
  selectedTopCount: 20,
  evaluatedCount: 48,
}

export const SURROGATE_CV = [
  { policy: 'rf', selectionScore: 0.742, spearman: 0.681, mae: 4.118 },
  { policy: 'lightgbm', selectionScore: 0.718, spearman: 0.654, mae: 4.332 },
  { policy: 'xgboost', selectionScore: 0.701, spearman: 0.639, mae: 4.471 },
  { policy: 'ridge', selectionScore: 0.586, spearman: 0.512, mae: 5.264 },
]

export const SURROGATE_TOP = Array.from({ length: 10 }, (_, i) => {
  const r = rng(i + 31)
  return {
    rank: i + 1,
    seqId: `seq_${String(i + 1).padStart(4, '0')}`,
    tier: (['0.70', '0.50', '0.30'] as const)[i % 3],
    policy: i % 4 === 3 ? 'ensemble' : 'rf',
    acqScore: +(0.94 - i * 0.031 + r() * 0.01).toFixed(3),
    af2Label: +(88.4 - i * 0.84 + r() * 1.4).toFixed(1),
  }
})

/* ---------------- Compare Studio ---------------- */

export interface CmpOption {
  id: string
  label: string
  group: string
  role: string
  source: string
  provenance: string
  tier: string
  backbone: string
  chains: string
  fixedCount: string
  wtSeqDiff: string
  inputRmsd: string
  backboneRmsd: string
  wtCfRmsd: string
  commonCa: string
  af2Scope: string
  af2Selected: string
  af2Plddt: string
  af2Rmsd: string
  path: string
  seq: string
}

export const CMP_GROUP_ORDER = [
  'References',
  'Backbone Snapshots',
  `${AF2_PROVIDER} Candidates`,
  'Source Outputs',
  'Other Structures',
]

export const CMP_OPTIONS: CmpOption[] = [
  {
    id: 'ref_input',
    label: 'Input Structure · 1EMA.pdb',
    group: 'References',
    role: 'Input Structure',
    source: 'input_pdb',
    provenance: '사용자 업로드 입력 구조에서 직접 확인',
    tier: '-',
    backbone: '-',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '0 / 236 (identity 100%)',
    inputRmsd: '0.00 Å',
    backboneRmsd: '-',
    wtCfRmsd: '0.84 Å',
    commonCa: '236',
    af2Scope: 'WT reference',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/input/1EMA.pdb',
    seq: WT_SEQ,
  },
  {
    id: 'ref_working',
    label: 'Working Backbone · working.pdb',
    group: 'References',
    role: 'Working Backbone',
    source: 'preprocess',
    provenance: '전처리 단계에서 체인 A로 정리한 작업 백본',
    tier: '-',
    backbone: 'working',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '0 / 236 (identity 100%)',
    inputRmsd: '0.31 Å',
    backboneRmsd: '0.00 Å',
    wtCfRmsd: '0.91 Å',
    commonCa: '234',
    af2Scope: 'Backbone summary',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/preprocess/working.pdb',
    seq: WT_SEQ,
  },
  {
    id: 'ref_wt_cf',
    label: `WT ${AF2_PROVIDER} · wt_colabfold_rank1.pdb`,
    group: 'References',
    role: `WT ${AF2_PROVIDER}`,
    source: 'af2',
    provenance: `WT 서열을 ${AF2_PROVIDER}로 재예측한 기준 구조`,
    tier: '-',
    backbone: 'wt',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '0 / 236 (identity 100%)',
    inputRmsd: '0.84 Å',
    backboneRmsd: '0.91 Å',
    wtCfRmsd: '0.00 Å',
    commonCa: '236',
    af2Scope: 'WT reference',
    af2Selected: 'Yes',
    af2Plddt: '96.2',
    af2Rmsd: '0.84 Å',
    path: 'runs/run_0421/af2/wt/wt_colabfold_rank1.pdb',
    seq: WT_SEQ,
  },
  {
    id: 'bb_rfd3_01',
    label: 'RFD3 backbone 01',
    group: 'Backbone Snapshots',
    role: 'Backbone Snapshot',
    source: 'rfd3',
    provenance: 'RFDiffusion3 백본 생성 스냅샷 01에서 확인',
    tier: '0.70',
    backbone: 'rfd3_01',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '-',
    inputRmsd: '1.24 Å',
    backboneRmsd: '0.00 Å',
    wtCfRmsd: '1.38 Å',
    commonCa: '231',
    af2Scope: 'Backbone summary',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/rfd3/backbone_01.pdb',
    seq: '',
  },
  {
    id: 'bb_rfd3_07',
    label: 'RFD3 backbone 07',
    group: 'Backbone Snapshots',
    role: 'Backbone Snapshot',
    source: 'rfd3',
    provenance: 'RFDiffusion3 백본 생성 스냅샷 07에서 확인',
    tier: '0.50',
    backbone: 'rfd3_07',
    chains: 'A',
    fixedCount: '3',
    wtSeqDiff: '-',
    inputRmsd: '1.61 Å',
    backboneRmsd: '0.00 Å',
    wtCfRmsd: '1.72 Å',
    commonCa: '228',
    af2Scope: 'Backbone summary',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/rfd3/backbone_07.pdb',
    seq: '',
  },
  {
    id: 'bb_bioemu_03',
    label: 'BioEmu ensemble 03',
    group: 'Backbone Snapshots',
    role: 'Backbone Snapshot',
    source: 'bioemu',
    provenance: 'BioEmu 앙상블 프레임 03에서 확인',
    tier: '0.50',
    backbone: 'bioemu_03',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '-',
    inputRmsd: '1.03 Å',
    backboneRmsd: '0.00 Å',
    wtCfRmsd: '1.11 Å',
    commonCa: '233',
    af2Scope: 'Backbone summary',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/bioemu/frame_03.pdb',
    seq: '',
  },
  {
    id: 'cf_seq_0007',
    label: `${AF2_PROVIDER} candidate · seq_0007`,
    group: `${AF2_PROVIDER} Candidates`,
    role: `${AF2_PROVIDER} Candidate`,
    source: 'rfd3 → design → af2',
    provenance: `seq_0007 서열을 ${AF2_PROVIDER}로 예측한 정확 후보 구조`,
    tier: '0.50',
    backbone: 'rfd3_01',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '11 / 236 (identity 95.3%)',
    inputRmsd: '1.41 Å',
    backboneRmsd: '0.96 Å',
    wtCfRmsd: '1.52 Å',
    commonCa: '228',
    af2Scope: 'Exact candidate',
    af2Selected: 'Yes',
    af2Plddt: '89.4',
    af2Rmsd: '1.41 Å',
    path: 'runs/run_0421/af2/seq_0007/rank1.pdb',
    seq: mutate(7, 11),
  },
  {
    id: 'cf_seq_0014',
    label: `${AF2_PROVIDER} candidate · seq_0014`,
    group: `${AF2_PROVIDER} Candidates`,
    role: `${AF2_PROVIDER} Candidate`,
    source: 'bioemu → design → af2',
    provenance: `seq_0014 서열을 ${AF2_PROVIDER}로 예측한 정확 후보 구조`,
    tier: '0.70',
    backbone: 'bioemu_03',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '7 / 236 (identity 97.0%)',
    inputRmsd: '1.18 Å',
    backboneRmsd: '0.74 Å',
    wtCfRmsd: '1.26 Å',
    commonCa: '232',
    af2Scope: 'Exact candidate',
    af2Selected: 'Yes',
    af2Plddt: '91.8',
    af2Rmsd: '1.18 Å',
    path: 'runs/run_0421/af2/seq_0014/rank1.pdb',
    seq: mutate(14, 7),
  },
  {
    id: 'cf_seq_0031',
    label: `${AF2_PROVIDER} candidate · seq_0031`,
    group: `${AF2_PROVIDER} Candidates`,
    role: `${AF2_PROVIDER} Candidate`,
    source: 'rfd3 → design → af2',
    provenance: `seq_0031 서열은 정확 구조가 없어 보존도 tier 요약으로 대체`,
    tier: '0.30',
    backbone: 'rfd3_07',
    chains: 'A',
    fixedCount: '3',
    wtSeqDiff: '19 / 236 (identity 91.9%)',
    inputRmsd: '2.07 Å',
    backboneRmsd: '1.44 Å',
    wtCfRmsd: '2.21 Å',
    commonCa: '221',
    af2Scope: 'Sequence-conservation summary',
    af2Selected: 'No',
    af2Plddt: '78.1',
    af2Rmsd: '2.07 Å',
    path: 'runs/run_0421/af2/tier_030/summary_rank1.pdb',
    seq: mutate(31, 19),
  },
  {
    id: 'src_rfd3_pack',
    label: 'RFD3 source output · backbones.pdb.tar',
    group: 'Source Outputs',
    role: 'Source Output',
    source: 'rfd3',
    provenance: 'RFD3 단계 원본 산출물 묶음에서 첫 모델을 추출',
    tier: '-',
    backbone: 'rfd3_pack',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '-',
    inputRmsd: '1.29 Å',
    backboneRmsd: '0.12 Å',
    wtCfRmsd: '1.41 Å',
    commonCa: '230',
    af2Scope: `Pre-${AF2_PROVIDER}`,
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/rfd3/backbones.pdb.tar#model_1',
    seq: '',
  },
  {
    id: 'src_bioemu_pack',
    label: 'BioEmu source output · ensemble.pdb.tar',
    group: 'Source Outputs',
    role: 'Source Output',
    source: 'bioemu',
    provenance: 'BioEmu 단계 원본 산출물 묶음에서 첫 프레임을 추출',
    tier: '-',
    backbone: 'bioemu_pack',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '-',
    inputRmsd: '1.07 Å',
    backboneRmsd: '0.09 Å',
    wtCfRmsd: '1.15 Å',
    commonCa: '233',
    af2Scope: `Pre-${AF2_PROVIDER}`,
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/bioemu/ensemble.pdb.tar#frame_1',
    seq: '',
  },
  {
    id: 'oth_relax_0007',
    label: 'Relaxed structure · seq_0007 amber',
    group: 'Other Structures',
    role: 'Structure Artifact',
    source: 'relax',
    provenance: 'Amber relax 후처리 산출물에서 확인',
    tier: '0.50',
    backbone: 'rfd3_01',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '11 / 236 (identity 95.3%)',
    inputRmsd: '1.37 Å',
    backboneRmsd: '0.91 Å',
    wtCfRmsd: '1.48 Å',
    commonCa: '228',
    af2Scope: 'Exact candidate',
    af2Selected: 'Yes',
    af2Plddt: '89.4',
    af2Rmsd: '1.37 Å',
    path: 'runs/run_0421/relax/seq_0007_amber.pdb',
    seq: mutate(7, 11),
  },
  {
    id: 'oth_wt_min',
    label: 'WT minimized · wt_min.pdb',
    group: 'Other Structures',
    role: 'Structure Artifact',
    source: 'relax',
    provenance: 'WT 입력 구조를 에너지 최소화한 보조 산출물',
    tier: '-',
    backbone: 'wt',
    chains: 'A',
    fixedCount: '5',
    wtSeqDiff: '0 / 236 (identity 100%)',
    inputRmsd: '0.22 Å',
    backboneRmsd: '0.28 Å',
    wtCfRmsd: '0.79 Å',
    commonCa: '236',
    af2Scope: 'WT reference',
    af2Selected: '-',
    af2Plddt: '-',
    af2Rmsd: '-',
    path: 'runs/run_0421/relax/wt_min.pdb',
    seq: WT_SEQ,
  },
]

export const CMP_BASELINES = [
  { key: 'input', label: 'Input Structure', value: '1EMA.pdb · chain A · 236 aa', available: true },
  { key: 'working', label: 'Working Backbone', value: 'working.pdb · chain A · 234 CA', available: true },
  { key: 'wt_cf', label: `WT ${AF2_PROVIDER}`, value: 'wt_colabfold_rank1.pdb · pLDDT 96.2', available: true },
]

export const CMP_PRESETS = [
  { key: 'input_wt', label: 'Input vs WT', left: 'ref_input', right: 'ref_wt_cf' },
  { key: 'input_working', label: 'Input vs Working', left: 'ref_input', right: 'ref_working' },
  { key: 'input_rfd3', label: 'Input vs RFD3', left: 'ref_input', right: 'bb_rfd3_01' },
  { key: 'input_bioemu', label: 'Input vs BioEmu', left: 'ref_input', right: 'bb_bioemu_03' },
  { key: 'wt_rfd3', label: 'WT vs RFD3', left: 'ref_wt_cf', right: 'bb_rfd3_01' },
  { key: 'wt_bioemu', label: 'WT vs BioEmu', left: 'ref_wt_cf', right: 'bb_bioemu_03' },
  { key: 'rfd3_bioemu', label: 'RFD3 vs BioEmu', left: 'bb_rfd3_01', right: 'bb_bioemu_03' },
]

export const CMP_TIERS = ['0.30', '0.50', '0.70']

export const CMP_MANIFEST = [
  { k: 'run_id', v: 'run_0421' },
  { k: 'manifest', v: 'runs/run_0421/manifest.json (rev 7)' },
  { k: 'stage', v: 'soluprot (검토대기)' },
  { k: '구조 예측기', v: `${AF2_PROVIDER} 1.5.5` },
  { k: '정렬 방식', v: 'CA superposition (Kabsch)' },
  { k: '보존도 소스', v: 'msa/conservation.json · Neff 812' },
]

export const CMP_META_FIELDS: { key: keyof CmpOption; label: string; tip: string }[] = [
  { key: 'role', label: 'Role', tip: '구조가 파이프라인에서 맡는 역할' },
  { key: 'source', label: 'Source', tip: '구조를 생산한 단계 또는 모델' },
  { key: 'provenance', label: 'Provenance', tip: '이 구조를 어디에서 확인했는지' },
  { key: 'tier', label: '보존도 tier', tip: '서열 보존도 마스킹 tier' },
  { key: 'backbone', label: 'Backbone', tip: '참조한 백본 스냅샷 키' },
  { key: 'chains', label: 'Chains', tip: '포함된 체인 식별자' },
  { key: 'fixedCount', label: 'Fixed Count', tip: '고정(마스킹 제외) 잔기 수' },
  { key: 'wtSeqDiff', label: 'WT Seq Diff', tip: 'WT 대비 치환 잔기 수와 identity' },
  { key: 'inputRmsd', label: 'Input RMSD', tip: '입력 구조 대비 CA RMSD' },
  { key: 'backboneRmsd', label: 'Backbone RMSD', tip: '백본 스냅샷 대비 CA RMSD' },
  { key: 'wtCfRmsd', label: `WT ${AF2_PROVIDER} RMSD`, tip: `WT ${AF2_PROVIDER} 구조 대비 CA RMSD` },
  { key: 'commonCa', label: 'Common CA', tip: '정렬에 사용된 공통 CA 원자 수' },
  { key: 'af2Scope', label: `${AF2_PROVIDER} Scope`, tip: '예측 결과가 후보에 얼마나 정확히 대응되는지' },
  { key: 'af2Selected', label: `${AF2_PROVIDER} Selected`, tip: '구조 예측 통과 선정 여부' },
  { key: 'af2Plddt', label: `${AF2_PROVIDER} pLDDT`, tip: '예측 신뢰도 pLDDT' },
  { key: 'af2Rmsd', label: `${AF2_PROVIDER} RMSD`, tip: '예측 구조와 기준 구조의 RMSD' },
  { key: 'path', label: 'Path', tip: '산출물 저장 경로' },
]

export const STRUCT_DIFF_STAT = { rmsd: 1.41, p90: 2.84, commonCa: 228 }

export const RESIDUE_DIFF = MUTATION_SITES.map((pos, i) => {
  const r = rng(pos + 3)
  return {
    pos,
    wt: WT_SEQ[pos - 1] ?? 'X',
    design: ALT[(pos * (i + 3)) % ALT.length],
    d: +(0.6 + r() * 3.4).toFixed(2),
  }
}).concat(
  [41, 88, 117, 190, 231].map((pos, i) => {
    const r = rng(pos + 17)
    return {
      pos,
      wt: WT_SEQ[pos - 1] ?? 'X',
      design: ALT[(pos * (i + 5)) % ALT.length],
      d: +(0.4 + r() * 2.1).toFixed(2),
    }
  }),
).sort((a, b) => a.pos - b.pos)

/* ---------------- 비교 요약 ---------------- */

export const FUNNEL = [
  { label: '백본 (Backbones)', value: 40, note: 'RFD3 24 · BioEmu 16' },
  { label: 'SoluProt 통과', value: 318, note: '1,200개 중 26.5%' },
  { label: `${AF2_PROVIDER} 통과`, value: 112, note: '318개 중 35.2%' },
  { label: '백본 유지율', value: 34, note: '40개 중 34개 백본이 통과 후보 보유' },
]

export const WT_VS_DESIGN = [
  { metric: 'SoluProt', wt: '0.712', design: '0.681', delta: '-0.031' },
  { metric: 'pLDDT', wt: '96.2', design: '87.4', delta: '-8.8' },
  { metric: 'RMSD (Å)', wt: '0.00', design: '1.41', delta: '+1.41' },
  { metric: 'Relax/res', wt: '-0.420', design: '-0.361', delta: '+0.059' },
  { metric: 'WT 치환 수', wt: '0', design: '11', delta: '+11' },
]

export const WT_COMPARE_ENABLED = true

export const SOURCE_COMPARE = [
  {
    source: 'RFD3',
    backbones: 24,
    soluPass: 196,
    medSolu: '0.688',
    af2Selected: 71,
    relaxPass: 64,
    medPlddt: '88.1',
    medRmsd: '1.38',
    medRelax: '-0.372',
  },
  {
    source: 'BioEmu',
    backbones: 16,
    soluPass: 122,
    medSolu: '0.661',
    af2Selected: 41,
    relaxPass: 36,
    medPlddt: '86.2',
    medRmsd: '1.52',
    medRelax: '-0.344',
  },
]

export const TIER_COMPARE = [
  { tier: '0.30', designs: 420, soluPass: 148, af2Selected: 62, relaxPass: 55, medPlddt: '85.1', medRmsd: '1.71', medRelax: '-0.318' },
  { tier: '0.50', designs: 420, soluPass: 121, af2Selected: 38, relaxPass: 34, medPlddt: '87.9', medRmsd: '1.44', medRelax: '-0.366' },
  { tier: '0.70', designs: 360, soluPass: 49, af2Selected: 12, relaxPass: 11, medPlddt: '90.4', medRmsd: '1.12', medRelax: '-0.401' },
]

export const DISTRIBUTION = [
  { metric: 'SoluProt', n: 1200, p10: '0.482', p25: '0.571', med: '0.664', p75: '0.742', p90: '0.811', iqr: '0.171' },
  { metric: 'pLDDT', n: 318, p10: '72.4', p25: '80.1', med: '87.4', p75: '91.2', p90: '93.8', iqr: '11.1' },
  { metric: 'RMSD (Å)', n: 318, p10: '0.84', p25: '1.08', med: '1.41', p75: '1.92', p90: '2.46', iqr: '0.84' },
  { metric: 'Relax/res', n: 286, p10: '-0.612', p25: '-0.471', med: '-0.361', p75: '-0.242', p90: '-0.118', iqr: '0.229' },
  { metric: 'Hit Score', n: 1200, p10: '38.2', p25: '48.6', med: '58.4', p75: '67.1', p90: '74.9', iqr: '18.5' },
]

export const DIVERSITY = {
  uniqueSeq: 1174,
  wtIdentityMed: '94.9%',
  pairwiseIdentityMed: '88.2%',
  best: 'seq_0014 (identity 97.0%)',
  worst: 'seq_0106 (identity 86.4%)',
  pairs: 688_851,
  sequences: 1200,
  truncated: '쌍 비교는 상위 1,200개 서열로 제한되었습니다.',
}

/* ---------------- 산출물 뷰어 ---------------- */

export interface AzArtifact {
  name: string
  stage: string
  tier: string
  type: 'pdb' | 'fasta' | 'json' | 'svg' | 'md' | 'log' | 'csv' | 'zip'
  size: string
  updated: string
  preview: string
}

export const AZ_ARTIFACTS: AzArtifact[] = [
  { name: 'msa/alignment.a3m', stage: 'msa', tier: '-', type: 'fasta', size: '12.4 MB', updated: '09:16', preview: '>query\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGK...\n>UniRef90_A0A1B2 0.91\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGK...' },
  { name: 'msa/conservation.json', stage: 'msa', tier: '-', type: 'json', size: '184 KB', updated: '09:16', preview: '{\n  "neff": 812.4,\n  "tiers": { "0.30": 420, "0.50": 420, "0.70": 360 },\n  "fixed_positions": [65, 66, 67, 148, 205]\n}' },
  { name: 'rfd3/backbone_01.pdb', stage: 'rfd3', tier: '0.70', type: 'pdb', size: '418 KB', updated: '09:28', preview: 'ATOM      1  N   MET A   1      12.401  18.332  4.118  1.00 0.00\nATOM      2  CA  MET A   1      13.118  17.204  4.662  1.00 0.00\nATOM      3  C   MET A   1      14.302  17.711  5.471  1.00 0.00' },
  { name: 'rfd3/backbones.pdb.tar', stage: 'rfd3', tier: '-', type: 'zip', size: '48.2 MB', updated: '09:28', preview: '(바이너리 묶음) model_1 ~ model_24, 각 418~441 KB' },
  { name: 'bioemu/frame_03.pdb', stage: 'bioemu', tier: '0.50', type: 'pdb', size: '402 KB', updated: '09:36', preview: 'ATOM      1  N   MET A   1      11.882  18.004  4.221  1.00 0.00\nATOM      2  CA  MET A   1      12.744  16.998  4.713  1.00 0.00' },
  { name: 'bioemu/ensemble.pdb.tar', stage: 'bioemu', tier: '-', type: 'zip', size: '71.8 MB', updated: '09:36', preview: '(바이너리 묶음) frame_1 ~ frame_16' },
  { name: 'design/sequences.fasta', stage: 'design', tier: '0.50', type: 'fasta', size: '2.1 MB', updated: '09:43', preview: '>seq_0001 tier=0.50 backbone=rfd3_01\nMSKGEELFTGVVPILVELDGDVNGHKFSVSG...\n>seq_0002 tier=0.50 backbone=rfd3_01\nMSKGEELFTGVVPILVELDGDVNGHKFSVSG...' },
  { name: 'design/tier_summary.json', stage: 'design', tier: '-', type: 'json', size: '96 KB', updated: '09:43', preview: '{\n  "0.30": { "designs": 420, "fixed": 3 },\n  "0.50": { "designs": 420, "fixed": 5 },\n  "0.70": { "designs": 360, "fixed": 9 }\n}' },
  { name: 'soluprot/scores.json', stage: 'soluprot', tier: '-', type: 'json', size: '310 KB', updated: '09:45', preview: '{\n  "cutoff": 0.6,\n  "passed": 318,\n  "total": 1200,\n  "median": 0.664\n}' },
  { name: 'soluprot/scores.csv', stage: 'soluprot', tier: '-', type: 'csv', size: '142 KB', updated: '09:45', preview: 'seq_id,tier,soluprot,passed\nseq_0001,0.50,0.781,1\nseq_0002,0.50,0.612,1\nseq_0003,0.30,0.544,0' },
  { name: 'soluprot/pass_report.svg', stage: 'soluprot', tier: '-', type: 'svg', size: '42 KB', updated: '09:45', preview: '<svg viewBox="0 0 640 320"> ... 통과율 막대 차트 ... </svg>' },
  { name: 'af2/seq_0007/rank1.pdb', stage: 'af2', tier: '0.50', type: 'pdb', size: '512 KB', updated: '09:52', preview: 'ATOM      1  N   MET A   1      12.114  18.009  4.002  1.00 92.11\nATOM      2  CA  MET A   1      12.904  17.012  4.588  1.00 93.04' },
  { name: 'af2/metrics.json', stage: 'af2', tier: '-', type: 'json', size: '88 KB', updated: '09:52', preview: '{\n  "selected": 112,\n  "median_plddt": 87.4,\n  "median_rmsd": 1.41\n}' },
  { name: 'novelty/wt_diff.json', stage: 'novelty', tier: '-', type: 'json', size: '54 KB', updated: '09:53', preview: '{\n  "wt_identity_median": 0.949,\n  "unique_sequences": 1174\n}' },
  { name: 'report/run_0421_ko.md', stage: 'report', tier: '-', type: 'md', size: '28 KB', updated: '09:56', preview: '# run_0421 분석 보고서\n\n## 요약\nSoluProt 통과율 26.5% ...' },
  { name: 'logs/orchestrator.log', stage: '-', tier: '-', type: 'log', size: '1.8 MB', updated: '09:56', preview: '09:45:02 INFO soluprot stage finished passed=318/1200\n09:45:03 WARN pass rate below target 0.35\n09:52:11 INFO af2 selected=112' },
]

/* ---------------- 피드백 ---------------- */

export const FEEDBACK_REASONS = {
  good: [
    { k: 'high_plddt', l: 'pLDDT 높음' },
    { k: 'low_rmsd', l: 'RMSD 낮음' },
    { k: 'binding_good', l: '결합 양호' },
    { k: 'high_novelty', l: 'WT 대비 신규성 높음' },
    { k: 'stable', l: '안정적' },
    { k: 'other', l: '기타' },
  ],
  bad: [
    { k: 'low_plddt', l: 'pLDDT 낮음' },
    { k: 'high_rmsd', l: 'RMSD 높음' },
    { k: 'binding_poor', l: '결합 미흡' },
    { k: 'low_novelty', l: 'WT 대비 신규성 낮음' },
    { k: 'unstable', l: '불안정' },
    { k: 'other', l: '기타' },
  ],
}

export const FEEDBACK_STAGES = ['Auto', 'msa', 'design', 'soluprot', 'af2', 'novelty (WT Diff)', 'rfd3', 'diffdock', 'other']

export const FEEDBACK_LIST = [
  { at: '2026-10-05 10:21', rating: 'good', reasons: 'high_plddt, low_rmsd', stage: 'af2', artifact: 'af2/seq_0007/rank1.pdb', comment: 'tier50 후보 중 가장 안정적인 코어 배치입니다.', by: '김연구' },
  { at: '2026-10-05 10:04', rating: 'bad', reasons: 'high_rmsd', stage: 'af2', artifact: 'af2/seq_0031/rank1.pdb', comment: 'β-barrel 상부가 벌어져 실험 우선순위에서 제외했습니다.', by: '김연구' },
  { at: '2026-10-05 09:58', rating: 'good', reasons: 'stable, high_novelty', stage: 'novelty (WT Diff)', artifact: 'novelty/wt_diff.json', comment: '치환 11개로 신규성과 보존도 균형이 좋습니다.', by: '이박사' },
  { at: '2026-10-05 09:47', rating: 'bad', reasons: 'low_plddt, other', stage: 'soluprot', artifact: 'soluprot/scores.json', comment: 'tier70 구간 통과율이 목표치를 크게 밑돕니다.', by: '박연구' },
  { at: '2026-10-04 18:12', rating: 'good', reasons: 'binding_good', stage: 'diffdock', artifact: '-', comment: '이전 라운드 대비 포즈 신뢰도가 개선되었습니다.', by: '이박사' },
  { at: '2026-10-04 17:30', rating: 'good', reasons: 'low_rmsd', stage: 'rfd3', artifact: 'rfd3/backbone_01.pdb', comment: '백본 01 계열이 전반적으로 안정적입니다.', by: '김연구' },
]

/* ---------------- 실험 ---------------- */

export const EXP_ASSAYS = ['Binding', 'Activity', 'Stability', 'Expression', 'Other']
export const EXP_RESULTS = ['Success', 'Fail', 'Inconclusive']
export const EXP_DIRECTIONS = ['Maximize', 'Minimize']

export const EXPERIMENT_LIST = [
  { at: '2026-10-05 09:30', assay: 'Stability', result: 'Success', sample: 'SMP-2026-114', candidate: 'seq_0007', seq: 'seq_0007', metric: 't50_C', value: '48.2', unit: '°C', dir: 'Maximize', rep: 'R1', by: '김연구' },
  { at: '2026-10-05 09:12', assay: 'Binding', result: 'Success', sample: 'SMP-2026-113', candidate: 'seq_0014', seq: 'seq_0014', metric: 'kd_nM', value: '12.5', unit: 'nM', dir: 'Minimize', rep: 'R1', by: '이박사' },
  { at: '2026-10-04 16:44', assay: 'Expression', result: 'Inconclusive', sample: 'SMP-2026-109', candidate: 'seq_0031', seq: 'seq_0031', metric: 'yield_mg_L', value: '3.8', unit: 'mg/L', dir: 'Maximize', rep: 'R2', by: '박연구' },
  { at: '2026-10-04 11:02', assay: 'Activity', result: 'Fail', sample: 'SMP-2026-104', candidate: 'seq_0052', seq: 'seq_0052', metric: 'activity', value: '0.41', unit: 'rel', dir: 'Maximize', rep: 'R1', by: '최연구' },
  { at: '2026-10-03 15:18', assay: 'Stability', result: 'Success', sample: 'SMP-2026-098', candidate: 'wt_1EMA', seq: 'wt_1EMA', metric: 't50_C', value: '41.6', unit: '°C', dir: 'Maximize', rep: 'R1', by: '김연구' },
]

/* ---------------- 보고서 ---------------- */

export const REPORT_SUMMARY = {
  score: '0.826 (상위 20 평균 가중 점수)',
  evidence: 'SoluProt 318/1,200 · ColabFold 선정 112 · 중위 pLDDT 87.4 · 중위 RMSD 1.41 Å',
  recommendation: 'tier50 구간을 확대하고 tier70은 상위 200개만 구조 예측으로 진행',
}

export const REPORT_MD = `# run_0421 분석 보고서

## 1. 요약
GFP 열안정화 Round 3 (tier50) 실행 결과입니다. 설계 서열 1,200개 중 SoluProt 컷오프 0.60을
통과한 후보는 318개(26.5%)이며, 구조 예측 단계에서 112개가 선정되었습니다.
상위 20개 후보의 평균 가중 점수는 0.826으로 Round 2(0.781) 대비 개선되었습니다.

## 2. 단계별 지표
| 단계 | 모델 | 산출 | 소요 |
| --- | --- | --- | --- |
| msa | MMseqs2 v15 | Neff 812 | 04:12 |
| rfd3 | RFDiffusion3 1.2.0 | backbone 24 | 11:40 |
| bioemu | BioEmu 1.1 | backbone 16 | 08:03 |
| design | ProteinMPNN 1.0.1 | seq 1,200 | 06:55 |
| soluprot | SoluProt 1.0 | 318 / 1,200 | 01:21 |
| af2 | ColabFold 1.5.5 | selected 112 | 24:38 |

## 3. 후보 차트 (SVG 첨부)
- chart_plddt_rmsd.svg : pLDDT 대비 RMSD 산점도, WT 기준점 포함
- chart_hit_score_hist.svg : Hit Score 분포 (bins 12)
- chart_pass_rate_by_tier.svg : 보존도 tier별 구조 예측 통과율

## 4. 구조·서열 차이 (SVG 첨부)
- diff_seq_wt_seq0007.svg : WT 대비 seq_0007 서열 diff (치환 11개)
- diff_struct_wt_seq0007.svg : CA 정렬 후 거리 밴드 (RMSD 1.41 Å, P90 2.84 Å)

## 5. Hit List
상위 후보는 tier50 백본 rfd3_01 계열에 집중되어 있습니다.

## 6. 권고
1. tier50 구간 설계 수를 1.5배로 확대합니다.
2. tier70은 상위 200개만 구조 예측으로 보내 GPU 예산을 보전합니다.
3. seq_0007, seq_0014를 열안정성 실험 1차 대상으로 제안합니다.
`

export const REPORT_LINKS = [
  { name: 'report/run_0421_ko.md', note: '국문 보고서 본문' },
  { name: 'report/run_0421_package.zip', note: '보고서 + 차트 + 구조 묶음' },
  { name: 'af2/metrics.json', note: '구조 예측 지표 원본' },
  { name: 'soluprot/pass_report.svg', note: '통과율 차트' },
  { name: 'hitlist/run_0421_top120.csv', note: 'Hit List 내보내기' },
]

export const REPORT_REVIEW_REASONS = {
  good: [
    { k: 'report_clear', l: '설명이 명확함' },
    { k: 'report_actionable', l: '바로 실행 가능' },
    { k: 'report_complete', l: '내용이 충실함' },
    { k: 'report_other', l: '기타' },
  ],
  bad: [
    { k: 'report_missing_metrics', l: '지표 누락' },
    { k: 'report_inaccurate', l: '내용 부정확' },
    { k: 'report_confusing', l: '이해하기 어려움' },
    { k: 'report_other', l: '기타' },
  ],
}

/* ---------------- 실행 간 비교 ---------------- */

export interface RunMetric {
  soluprot: number
  plddt: number
  rmsd: number
  relax: number
  soluPass: number
  af2Pass: number
}

export const RUN_METRICS: Record<string, RunMetric> = {
  run_0421: { soluprot: 0.664, plddt: 87.4, rmsd: 1.41, relax: -0.361, soluPass: 26.5, af2Pass: 35.2 },
  run_0418: { soluprot: 0.631, plddt: 81.2, rmsd: 1.64, relax: -0.318, soluPass: 17.7, af2Pass: 28.4 },
  run_0412: { soluprot: 0.608, plddt: 79.4, rmsd: 1.82, relax: -0.294, soluPass: 14.8, af2Pass: 24.1 },
  run_0409: { soluprot: 0.592, plddt: 77.8, rmsd: 1.94, relax: -0.271, soluPass: 12.6, af2Pass: 21.8 },
  run_0405: { soluprot: 0.571, plddt: 74.1, rmsd: 2.11, relax: -0.248, soluPass: 11.2, af2Pass: 19.4 },
  run_0423: { soluprot: 0.657, plddt: 85.9, rmsd: 1.48, relax: -0.352, soluPass: 24.1, af2Pass: 0 },
  run_0419: { soluprot: 0.498, plddt: 66.4, rmsd: 2.61, relax: -0.174, soluPass: 5.2, af2Pass: 0 },
  run_0414: { soluprot: 0.619, plddt: 80.3, rmsd: 1.73, relax: -0.306, soluPass: 16.2, af2Pass: 26.3 },
  run_0420: { soluprot: 0.648, plddt: 84.1, rmsd: 1.52, relax: -0.342, soluPass: 22.4, af2Pass: 31.6 },
  run_0415: { soluprot: 0.511, plddt: 68.2, rmsd: 2.48, relax: -0.188, soluPass: 6.4, af2Pass: 9.1 },
  run_0407: { soluprot: 0.584, plddt: 76.4, rmsd: 2.02, relax: -0.262, soluPass: 10.8, af2Pass: 18.2 },
}

/* ---------------- 차트 ---------------- */

export const CHART_OPTIONS = [
  { k: 'plddt_rmsd', l: 'Scatter: pLDDT vs RMSD vs WT' },
  { k: 'plddt_soluprot', l: 'Scatter: pLDDT vs SoluProt' },
  { k: 'plddt_relax', l: 'Scatter: pLDDT vs Relax/res' },
  { k: 'rmsd_relax', l: 'Scatter: RMSD vs Relax/res' },
  { k: 'hist_score', l: 'Histogram: Hit Score' },
  { k: 'pass_tier', l: `보존도 tier별 ${AF2_PROVIDER} 통과율` },
]

