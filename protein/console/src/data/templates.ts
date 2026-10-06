/* 워크플로 템플릿. 두 종류로 나눈다.
   - 공용: 관리자가 등록하고 모든 연구자가 쓴다. 연구자는 고칠 수 없고 복사만 한다.
   - 내 워크플로: 연구자가 자기 용도로 만든다. 본인만 보이고 고칠 수 있다. */

export type TplScope = 'shared' | 'personal'

export interface WfTemplate {
  id: string
  name: string
  desc: string
  scope: TplScope
  /* 공용은 등록한 관리자, 개인은 만든 사람 */
  owner: string
  /* 캔버스에 올릴 기준 템플릿 (시안에서는 두 종류의 기본 그래프를 가리킨다) */
  base: 'stability' | 'binding'
  nodes: number
  used: number
  updated: string
  /* 공용 템플릿에서만 쓰는 분류 */
  category?: '안정화' | '결합 예측' | '비교 검증'
}

export const WF_TEMPLATES: WfTemplate[] = [
  {
    id: 'tpl_std_stability', name: '안정화 표준 (병렬 백본)', scope: 'shared', owner: '박운영',
    desc: 'RFD3 와 BioEmu 를 병렬 실행해 백본을 병합하고, SoluProt 통과율 조건으로 구조 예측 진행 여부를 분기합니다.',
    base: 'stability', nodes: 10, used: 142, updated: '2026-09-28', category: '안정화',
  },
  {
    id: 'tpl_std_binding', name: '결합 예측 표준', scope: 'shared', owner: '박운영',
    desc: 'hit list 와 표적을 입력으로 도킹한 뒤 복합체 구조 예측과 인터페이스 평가를 병렬 수행하고 가중 랭킹을 냅니다.',
    base: 'binding', nodes: 8, used: 76, updated: '2026-09-30', category: '결합 예측',
  },
  {
    id: 'tpl_std_tier', name: 'tier 비교 전용', scope: 'shared', owner: '박운영',
    desc: '보존율 단계별로 같은 조건을 돌려 통과율과 구조 품질을 비교합니다.',
    base: 'stability', nodes: 7, used: 58, updated: '2026-08-14', category: '비교 검증',
  },
  {
    id: 'tpl_std_af2', name: '구조 재검증 only', scope: 'shared', owner: '박운영',
    desc: '이미 만든 서열을 구조 예측과 WT 비교만 다시 돌립니다.',
    base: 'stability', nodes: 4, used: 203, updated: '2026-07-02', category: '비교 검증',
  },
  {
    id: 'tpl_me_gfp', name: 'GFP tier70 집중', scope: 'personal', owner: '김연구',
    desc: 'tier70 만 돌리고 통과율이 낮으면 바로 보고서로 넘기는 개인용 구성입니다.',
    base: 'stability', nodes: 9, used: 11, updated: '2026-10-05',
  },
  {
    id: 'tpl_me_relax', name: 'Relax 추가 검증', scope: 'personal', owner: '김연구',
    desc: '표준 흐름 뒤에 Rosetta Relax 점수 컷오프를 하나 더 둔 구성입니다.',
    base: 'stability', nodes: 11, used: 4, updated: '2026-10-02',
  },
  {
    id: 'tpl_me_binder', name: 'PD-L1 바인더 사전탐색', scope: 'personal', owner: '김연구',
    desc: '도킹 결과 상위만 복합체 예측으로 넘기는 축소판입니다.',
    base: 'binding', nodes: 6, used: 7, updated: '2026-09-21',
  },
]

let state: WfTemplate[] = WF_TEMPLATES
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(fn => fn())

export const tplStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
  all: () => state,
  add(t: WfTemplate) { state = [t, ...state]; emit() },
  remove(id: string) { state = state.filter(t => t.id !== id); emit() },
  /* 공용 템플릿을 내 것으로 복사한다. 원본은 그대로 둔다. */
  copyToPersonal(id: string, owner: string) {
    const src = state.find(t => t.id === id)
    if (!src) return
    state = [{
      ...src,
      id: `${src.id}_copy_${state.length}`,
      name: `${src.name} 사본`,
      scope: 'personal',
      owner,
      used: 0,
      updated: new Date().toISOString().slice(0, 10),
      category: undefined,
    }, ...state]
    emit()
  },
}
