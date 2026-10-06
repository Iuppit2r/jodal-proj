import { Modal } from './ui'

/* 사용 안내 모달: 화면별 사용 순서와 권장 흐름 */

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: '빠른 시작',
    items: [
      '고급 설정 화면에서 타깃 파일을 올리고 사전 점검을 실행한 뒤 실행하거나 단계별 실행 작업을 만듭니다.',
      '빠른 실행 화면은 타깃만 올리면 표준 기본값으로 바로 실행합니다.',
      '실행 모니터 화면에서 단계 상태와 산출물을 확인하고, 단계 재실행은 단계별 실행 화면에서 진행합니다.',
      '결과 분석 화면에서 구조 비교, 실행 간 비교, 가중 랭킹을 확인한 뒤 평가 · 실험값 · 보고서를 남깁니다.',
    ],
  },
  {
    title: '고급 팁',
    items: [
      '이전 실행의 요청값을 불러오면 설정만 복사됩니다. 재개가 아니라 새 실행으로 실행됩니다.',
      '실행 재개와 중단은 실행 모니터와 단계별 실행 화면에 있습니다.',
      '타깃 파일이나 상위 단계 설정을 바꾸면 안전을 위해 새 실행으로 분기됩니다.',
      '자연어 설명을 입력하면 파라미터로 변환되고 부족한 입력은 질문으로 안내됩니다.',
    ],
  },
  {
    title: '모니터링',
    items: [
      '최근 실행 목록에서 실행을 선택하면 단계 진행과 예상 완료 시각이 표시됩니다.',
      '자동 갱신을 켜 두면 상태가 주기적으로 반영되고, 즉시 갱신 버튼으로 직접 확인할 수도 있습니다.',
      '체크포인트에 도달하면 결과를 검토한 뒤 다음 단계 진행 또는 특정 단계 재실행을 선택합니다.',
      '근거 검토 패널에서 단계별 판정과 신뢰도, 권장 조치를 확인하고 평가를 남길 수 있습니다.',
    ],
  },
  {
    title: '분석',
    items: [
      '보존율별로 WT · RFD3 · BioEmu 구조를 비교하고 잔기 단위 차이를 확인합니다.',
      '비교 요약 카드에서 선별 단계별 통과 수와 지표 분포를 함께 확인합니다.',
      '가중치를 조정해 상위 후보를 선별한 뒤 결과 묶음과 보고서를 내보냅니다.',
      '평가와 실험값은 다음 라운드 추천과 보고서 근거로 함께 사용됩니다.',
    ],
  },
  {
    title: '관리자',
    items: [
      '사용자 · 보안 화면에서 계정을 생성하고 승인 대기 사용자를 승인합니다.',
      '모델 관리 권한이 있으면 전체 기본값 제공자를 변경할 수 있습니다.',
      'CATH 벤치마크와 RunPod 운영 기능은 관리자 권한에서만 사용할 수 있습니다.',
    ],
  },
]

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="사용 안내" onClose={onClose}
      footer={<button className="btn primary" onClick={onClose}>확인</button>}>
      {SECTIONS.map(s => (
        <div key={s.title} className="col" style={{ gap: 8 }}>
          <div className="row">
            <span style={{ fontWeight: 600 }}>{s.title}</span>
            <div className="sp" />
            <span className="badge">{s.items.length}항목</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.7 }}>
            {s.items.map(i => <li key={i}>{i}</li>)}
          </ul>
        </div>
      ))}
    </Modal>
  )
}
