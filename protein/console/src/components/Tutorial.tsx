import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Modal } from './ui'

/* 튜토리얼 오버레이: 단계 카드 + 목차 + 진행 점 + 건너뛰기 / 이전 / 다음 */

type Step = { group: string; title: string; body: string; example?: string; hint: string }

const STEPS: Step[] = [
  {
    group: '작업 공간', title: '홈 · 작업 공간',
    body: '현재 프로젝트, 진행 중인 실행, 최근 결과를 한 화면에서 확인합니다. 프로젝트를 먼저 선택하면 이후 실행과 라운드 기록이 자동으로 연결됩니다.',
    hint: '프로젝트가 없으면 새 프로젝트를 만든 뒤 시작합니다.',
  },
  {
    group: '작업 공간', title: '실행 방법 선택',
    body: '새 실행을 시작하면 빠른 실행, 고급 설정, 대리모델 선별, 단계별 실행, 흐름 설계 다섯 가지 중에서 선택합니다. 각 항목에는 사용 목적이 함께 표시됩니다.',
    example: '표준 기본값으로 바로 돌려보고 싶다면 빠른 실행을 선택합니다.',
    hint: '선택 후에도 다른 화면으로 설정을 그대로 넘길 수 있습니다.',
  },
  {
    group: '설계 · 실행', title: '빠른 실행',
    body: '타깃 파일을 올리거나 서열을 붙여 넣고 바로 실행합니다. 보존율 30 / 50 / 70 과 총 생성 서열 수만 조정하면 나머지는 표준 기본값이 적용됩니다.',
    example: '총 생성 서열 수 기본값은 120 입니다.',
    hint: 'PDB 입력은 RFD3 와 BioEmu 를 함께 사용하고, FASTA 입력은 BioEmu 만 사용합니다.',
  },
  {
    group: '설계 · 실행', title: '고급 설정 5단계',
    body: '입력 · 워크플로 · 평가 기준 · 전문가 설정 · 검토 순서로 진행합니다. 마지막 검토 단계에서 실행 계획을 확인한 뒤 실행합니다.',
    example: '입력 단계에서 사전 점검을 실행하면 필수 입력과 차단 사유가 먼저 표시됩니다.',
    hint: '필수 입력이 채워지기 전에는 실행 버튼이 활성화되지 않습니다.',
  },
  {
    group: '설계 · 실행', title: '잔기 선택기 · 문헌 기반 마스킹',
    body: '3D 구조에서 잔기를 직접 선택하거나 표면 · 코어 · 계면 · 보존율 프리셋으로 한 번에 선택합니다. 논문 PDF 를 올리면 고정할 잔기 후보를 근거 문장과 함께 제안합니다.',
    example: '표면 노출 기준값 기본값은 2.5 입니다.',
    hint: '선택 결과는 고정 위치 설정에 그대로 반영되고, 선택을 비우고 적용하면 초기화됩니다.',
  },
  {
    group: '설계 · 실행', title: '단계별 실행',
    body: '단계를 하나씩 실행하고 결과를 확인한 뒤 다음 단계로 넘깁니다. 포함 · 제외 전환으로 특정 단계를 건너뛸 수 있고 단계 점검으로 실행 가능 여부를 먼저 확인합니다.',
    example: '제외한 단계는 건너뛰고 이후 단계는 남은 백본을 사용합니다.',
    hint: '상위 단계 입력이 바뀌면 같은 실행 재사용 대신 새 실행으로 분기됩니다.',
  },
  {
    group: '모니터링', title: '실행 모니터',
    body: '단계 진행률, 상태, 예상 완료 시각, 데이터 충족도를 확인합니다. 체크포인트에 도달하면 결과를 검토하고 다음 단계 진행 또는 재실행을 선택합니다.',
    example: '자동 갱신을 켜 두면 상태가 주기적으로 반영됩니다.',
    hint: '산출물 목록은 단계 · 보존율 · 형식으로 걸러 묶음 내려받기를 할 수 있습니다.',
  },
  {
    group: '분석', title: '결과 분석',
    body: '구조 비교, 실행 간 비교, 가중 랭킹, 차트를 한 화면에서 확인합니다. 비교는 서열 차이와 구조 차이 두 가지 방식으로 볼 수 있습니다.',
    example: '가중치 기본값은 용해도 0.4 · pLDDT 0.3 · RMSD 0.2 입니다.',
    hint: '잔기 표에서 한 줄을 누르면 좌우 3D 화면에서 같은 위치가 함께 강조됩니다.',
  },
  {
    group: '분석', title: '평가 · 실험값 · 보고서',
    body: '후보 평가와 실험 측정값을 남기고 보고서를 생성합니다. 보고서는 국문과 영문으로 만들 수 있고 차트와 비교 그림이 첨부됩니다.',
    hint: '보고서 언어는 설정 화면의 보고서 언어 항목을 따릅니다.',
  },
  {
    group: '작업 공간', title: '프로젝트 · 라운드',
    body: '프로젝트와 라운드 단위로 목표, 가설, 메모, 연결된 실행을 기록합니다. 다음 라운드 메모는 이후 설계 방향을 정리하는 데 사용합니다.',
    hint: '라운드를 보관하거나 삭제해도 연결된 실행 산출물은 보존됩니다.',
  },
  {
    group: '설정', title: '모델 레지스트리',
    body: '모델별 실행 제공자를 RunPod, HTTP API, 사용 안 함 중에서 지정합니다. 내 모델 설정과 전체 기본값을 구분해 적용할 수 있습니다.',
    example: '제한 시간 기본값은 21600초입니다.',
    hint: '전체 기본값 변경은 모델 관리 권한 이상에서만 가능합니다.',
  },
  {
    group: '설정', title: 'MCP 연계 · Copilot',
    body: 'MCP 화면에서 스킬을 내려받고 마스터 프롬프트를 복사하면 외부 IDE 에서 동일한 권한으로 플랫폼을 사용할 수 있습니다. Copilot 은 현재 화면과 실행 맥락을 바탕으로 해석과 다음 조치를 안내합니다.',
    example: 'Copilot 질문 예시: "이 타깃을 간단히 설명해줘" · 답변: 입력 구조의 체인 구성과 길이, 주요 리간드를 요약해 설명합니다.',
    hint: 'API 키는 접두어 kbfpat_ 로 발급되며 기본 유효기간은 90일입니다.',
  },
]

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const s = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <Modal title={`튜토리얼 ${i + 1} / ${STEPS.length}`} onClose={onClose}
      footer={<>
        <button className="btn ghost" onClick={onClose}>건너뛰기</button>
        <div className="sp" />
        <button className="btn" disabled={i === 0} onClick={() => setI(n => Math.max(0, n - 1))}>
          <ChevronLeft size={14} />이전
        </button>
        {last
          ? <button className="btn primary" onClick={onClose}>시작하기</button>
          : <button className="btn primary" onClick={() => setI(n => Math.min(STEPS.length - 1, n + 1))}>
              다음<ChevronRight size={14} />
            </button>}
      </>}>
      <div className="col" style={{ gap: 8 }}>
        <div className="row">
          <span style={{ fontWeight: 500 }}>목차</span>
          <div className="sp" />
          <span className="badge">{s.group}</span>
        </div>
        <div className="row wrap">
          {STEPS.map((t, n) => (
            <span key={t.title} className="chip"
              style={n === i ? { borderColor: 'var(--brand-2)', background: 'var(--brand-soft)', color: 'var(--brand-ink)' } : undefined}
              onClick={() => setI(n)}>
              {n + 1}. {t.title}
            </span>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="col" style={{ gap: 10 }}>
        <div style={{ fontWeight: 600 }}>{s.title}</div>
        <div className="muted" style={{ lineHeight: 1.7 }}>{s.body}</div>
        {s.example && (
          <div className="col" style={{ gap: 4 }}>
            <div className="faint">예시</div>
            <div className="log" style={{ maxHeight: 96 }}>{s.example}</div>
          </div>
        )}
        <div className="signal">
          <span className="ic"><Lightbulb size={15} color="var(--text-3)" /></span>
          <div><b>도움말</b><p>{s.hint}</p></div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
        {STEPS.map((t, n) => (
          <i key={t.title} className="dot"
            style={{ width: 7, height: 7, color: n === i ? 'var(--brand)' : 'var(--line-strong)', cursor: 'pointer' }}
            onClick={() => setI(n)} />
        ))}
      </div>
    </Modal>
  )
}
