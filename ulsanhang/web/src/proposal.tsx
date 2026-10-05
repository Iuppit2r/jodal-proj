import { createContext, useContext, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Lightbulb, X } from 'lucide-react'

/*
 * 제안 포인트: 화면 요소마다 "발주처 과제 → 우리의 해결 → RFP 근거"를 번호로 연결해 보여준다.
 * 제안 발표·심사 시 화면만으로 RFP 대응 내용을 설명하기 위한 레이어.
 */

export interface Point { n: number; title: string; req: string; pain: string; how: string }

/** RFP 추진배경(Ⅰ-2)에 명시된 발주처 과제 */
export const PAINS = {
  search: '검색 효율성 저하',
  gap: '정보 접근 불균형',
  oneway: '일방향 정보 제공',
  analog: '전화 등 아날로그 문의',
  trust: 'AI 답변 신뢰성',
  manual: '서식 수작업',
  ops: '운영·품질 관리',
} as const

export const POINTS: Record<string, Point[]> = {
  '/chat': [
    { n: 1, title: '업무 시나리오별 시작 질문', req: '추진내용 시나리오 다각화 · SFR-004', pain: PAINS.search, how: '단순 안내, 복합 안내, 선박 제원, 대기시간 예측, 다국어까지 자주 묻는 업무를 카드로 제시해 메뉴를 몰라도 바로 시작합니다.' },
    { n: 2, title: '근거 범위 내 답변 · 환각 방지', req: 'SFR-003 환각 방지 가드레일', pain: PAINS.trust, how: '검증된 공사 자료에서 찾은 근거 수와 가드레일 적용 여부를 답변마다 표시합니다.' },
    { n: 3, title: '원문 링크 · 담당 부서 · 첨부파일', req: '추진내용 직관적 소통 · SFR-003', pain: PAINS.search, how: '모든 답변에 원문 바로가기, 담당 부서, 첨부파일 다운로드를 함께 제공합니다.' },
    { n: 4, title: '이전 대화 맥락 유지', req: 'SFR-004 멀티턴 · 추진내용 문맥 유지', pain: PAINS.oneway, how: '"그럼 감면은?"처럼 이어지는 질문에 앞선 대화의 대상을 이어받아 답합니다.' },
    { n: 5, title: '지식그래프로 연결된 복합 답변', req: 'SFR-003 지식그래프 · 추진내용 하이브리드 색인', pain: PAINS.search, how: '사용료 규정과 인센티브 지침처럼 흩어진 규정을 관계로 연결해 한 번에 답하고 연결 경로를 보여줍니다.' },
    { n: 6, title: '맞춤 추천 질문 · 정보 내비게이션', req: 'SFR-004 맞춤 가이드', pain: PAINS.oneway, how: '대화 맥락에 맞는 다음 질문과 관련 서비스(스케줄 예측) 이동을 제안합니다.' },
    { n: 7, title: '답변별 만족도 · 의견', req: 'SFR-004 사용자 피드백', pain: PAINS.oneway, how: '답변마다 도움됨/아쉬움과 의견을 받아 관리자 피드백 화면으로 모읍니다.' },
    { n: 8, title: '응답 시간 표시 · 스트리밍', req: 'PER-001 5초 이내 · SFR-004 스트리밍', pain: PAINS.analog, how: '답변을 실시간으로 흘려 보여주고 응답 시간을 표시하며, 5초를 넘으면 지연 안내를 띄웁니다.' },
    { n: 9, title: '개인정보 자동 비식별화', req: '추진내용 정보 유출 방지 · SER-006', pain: PAINS.trust, how: '전화번호·주민번호·이메일을 외부 LLM으로 보내기 전에 감지해 마스킹하고 사용자에게 알립니다.' },
    { n: 10, title: '다국어 · 웹 접근성', req: '추진내용 다국어 · 디지털 격차 해소 · COR-003', pain: PAINS.gap, how: '외국 선원·대리점을 위해 질문 언어를 자동 인식해 같은 언어로 답하고, 화면은 4개 언어와 키보드·스크린리더를 지원합니다.' },
    { n: 11, title: '대화 이력 관리', req: 'SFR-004 세션 초기화·이력 삭제', pain: PAINS.oneway, how: '새 대화 시작, 개별·전체 이력 삭제와 보관 기간을 제공합니다.' },
  ],
  '/schedule': [
    { n: 1, title: '실시간 데이터 연동', req: 'SFR-005 데이터 연동 · 개방 데이터 API', pain: PAINS.analog, how: 'PortWise 선석배정과 공사 개방 API의 선박 위치·ETA를 10분 주기로 반영하고 기준 시각을 표시합니다.' },
    { n: 2, title: '항만 혼잡도 핵심 지표', req: 'SFR-005 항만 전체 혼잡도', pain: PAINS.analog, how: '대기 선박, 평균 대기시간, 선석 가용률, 예측 오차를 첫 화면에서 확인합니다.' },
    { n: 3, title: '선석별 입항·접안·출항 타임라인', req: 'SFR-005 스케줄 타임라인', pain: PAINS.analog, how: '확정과 예측, 지연 예측을 구분해 하루 스케줄을 선석별로 보여줍니다.' },
    { n: 4, title: '선박 제원 · 예측 신뢰도', req: '추진내용 시나리오(선박제원→대기시간)', pain: PAINS.search, how: '막대를 선택하면 선박 제원, 계획 대비 예측 시각, 예측 신뢰도를 바로 확인합니다.' },
    { n: 5, title: '72시간 혼잡도 예측', req: 'SFR-005 선석 가용성·대기시간 예측', pain: PAINS.analog, how: '예측 구간과 함께 향후 대기 선박 수를 보여줘 입항 일정 조정을 돕습니다.' },
    { n: 6, title: '예측값 vs 실제값 오차', req: 'SFR-005 오차 시각화·누적 관리', pain: PAINS.trust, how: '실제 스케줄과 비교한 오차를 일별로 누적해 예측을 얼마나 믿을 수 있는지 보여줍니다.' },
    { n: 7, title: '시계열 모델 비교', req: 'SFR-001 LSTM·GRU·TFT 비교 선정', pain: PAINS.trust, how: '후보 모델의 MAE·RMSE·MAPE를 공개하고 운영 모델을 표시합니다.' },
    { n: 8, title: '이상탐지 알림', req: 'SFR-005 AIS 두절·항로 이탈', pain: PAINS.ops, how: 'AIS 신호 두절, 항로 이탈, 예측 오차 초과, 수집 재시도를 시간순으로 알립니다.' },
  ],
  '/forms': [
    { n: 1, title: '서식 자동 분류', req: 'SFR-006 문서서식 분류', pain: PAINS.manual, how: '문서를 올리면 어떤 서식인지 AI가 먼저 판별하고 해당 템플릿을 적용합니다.' },
    { n: 2, title: '비정형 문서 처리 단계 공개', req: 'SFR-006 OCR 기반 추출', pain: PAINS.manual, how: 'OCR, 항목 인식, 개인정보 마스킹, 값 검증 단계를 진행 상황과 함께 보여줍니다.' },
    { n: 3, title: '항목별 신뢰도 · 오류 메시지', req: 'SFR-006 오차 시각화 및 오류 메시지', pain: PAINS.trust, how: '신뢰도가 낮거나 형식이 틀린 항목을 표시하고 원인을 알려줘 검토 시간을 줄입니다.' },
    { n: 4, title: '원본 대조 하이라이트', req: 'SFR-006 텍스트 추출', pain: PAINS.manual, how: '값을 고칠 때 원본 문서의 해당 위치를 함께 강조합니다.' },
    { n: 5, title: '개인정보 마스킹', req: 'SFR-006 비식별화 · SER-006', pain: PAINS.trust, how: '선장 성명, 연락처 같은 개인정보는 기본으로 가리고 권한자만 표시합니다.' },
    { n: 6, title: 'Excel · PDF 내보내기', req: 'SFR-006 다운로드', pain: PAINS.manual, how: '검토가 끝난 값을 표준 양식 Excel과 PDF로 내려받습니다.' },
  ],
  '/admin': [
    { n: 1, title: '이용 현황 · 접속 통계', req: 'SFR-004 활용 점검 페이지 · 모니터링 대시보드', pain: PAINS.ops, how: '이용자, 질의 수, 만족도, 캐시 절감을 기간별로 확인합니다.' },
    { n: 2, title: '핵심 키워드 · 질의 의도', req: '추진내용 모니터링 대시보드', pain: PAINS.ops, how: '많이 묻는 주제를 보고 자료 보강과 콘텐츠 개선 우선순위를 정합니다.' },
    { n: 3, title: '응답 시간 5초 기준선', req: 'PER-001 · PER-002', pain: PAINS.ops, how: 'P50·P95 응답 시간을 5초 기준선과 함께 추적합니다.' },
    { n: 4, title: '시맨틱 캐시 비용 절감', req: '추진내용 시맨틱 캐싱 · SFR-003', pain: PAINS.ops, how: '유사 질문을 LLM 호출 없이 응답한 비율과 절감 건수를 보여줍니다.' },
    { n: 5, title: '클라우드 리소스 실시간', req: 'SFR-007 리소스 모니터링 · 무중단', pain: PAINS.ops, how: '인스턴스별 CPU·메모리와 임계 상태를 1분 주기로 표시합니다.' },
    { n: 6, title: '보안 · 개인정보 현황', req: 'SFR-007 CSAP · SER-002 · SER-006', pain: PAINS.trust, how: '비식별화 처리 건수, 전송구간 암호화, CSAP 클라우드, AI 보안 가이드 준수 여부를 한눈에 점검합니다.' },
  ],
  '/admin/rag': [
    { n: 1, title: 'RAG 특화 다차원 지표', req: 'PER-003 답변 적합성·문맥 재현율·사실적 일관성', pain: PAINS.trust, how: '키워드 매칭이 아닌 LLM 평가로 세 가지 지표를 추적합니다.' },
    { n: 2, title: '평가 주기 · 저하 알림', req: 'PER-003 관리자 설정 주기·알림', pain: PAINS.ops, how: '데이터 갱신 시점이나 정해진 주기로 평가하고 임계치 아래로 떨어지면 알립니다.' },
    { n: 3, title: '문항별 점수와 채점 근거', req: 'PER-003 관리자 페이지에서 근거 확인', pain: PAINS.trust, how: '각 답변의 점수와 구체적인 평가 근거를 행마다 열어 확인합니다.' },
  ],
  '/admin/models': [
    { n: 1, title: 'LLM 후보 비교 · 선정 근거', req: 'SFR-001 정답 유사도·속도·환각률·문맥 이해도', pain: PAINS.trust, how: '후보 모델의 성능 테스트 결과를 같은 기준으로 비교하고 선정 이유를 남깁니다.' },
    { n: 2, title: '공공 AI 보안 기준 충족', req: 'SFR-001 · SFR-007 국가·공공기관 AI 보안 가이드라인', pain: PAINS.trust, how: '배포 방식, 데이터 국외 반출, 로그 보관 등 보안 항목 충족 여부를 함께 표시합니다.' },
    { n: 3, title: '예측 모델 성능 저하 · 데이터 변화 탐지', req: 'PER-003 ML/DL 모델 성능 평가', pain: PAINS.ops, how: '운영 중인 시계열 모델의 오차 추이와 입력 데이터 분포 변화를 감시합니다.' },
  ],
  '/admin/feedback': [
    { n: 1, title: '서비스 만족도 조사', req: 'SFR-004 만족도·의견 제출', pain: PAINS.oneway, how: '만족도 분포와 추이로 서비스 품질을 관리합니다.' },
    { n: 2, title: '의견 → 조치 관리', req: 'SFR-004 · 추진내용 실시간 피드백', pain: PAINS.oneway, how: '부정 평가와 의견을 모아 조치 상태를 관리해 개선으로 연결합니다.' },
  ],
  '/admin/data': [
    { n: 1, title: '데이터 파이프라인 6단계', req: 'SFR-002 수집·정제·전처리 자동화', pain: PAINS.search, how: '수집부터 OCR, 정제, 비식별화, 시맨틱 청킹, 임베딩 적재까지 단계별 처리량을 보여줍니다.' },
    { n: 2, title: '지식그래프 구조화', req: 'SFR-003 · 추진내용 지식 그래프', pain: PAINS.search, how: '규정·요금·절차·부서 간 관계를 그래프로 구성해 복합 질문에 답합니다.' },
    { n: 3, title: '동기화 주기 설정', req: 'SFR-002 데이터 현행화 주기', pain: PAINS.trust, how: '사이트·데이터별 갱신 주기를 공사와 협의한 값으로 설정합니다.' },
    { n: 4, title: '업무 매뉴얼 업로드 · 버전 관리', req: '추진내용 매뉴얼 업로드 및 관리기능', pain: PAINS.search, how: '담당자가 사용료 규정 등 매뉴얼을 올리면 자동으로 AI 답변 근거에 반영됩니다.' },
    { n: 5, title: '수집 실패 재시도 · 로그', req: 'SFR-005 재시도 로직·실패 이력', pain: PAINS.ops, how: '실패 원인과 재시도 결과를 기록하고 담당자에게 알립니다.' },
  ],
}

const Ctx = createContext<{ on: boolean; setOn: (v: boolean) => void; focus: number | null; setFocus: (n: number | null) => void }>({
  on: true, setOn: () => {}, focus: null, setFocus: () => {},
})

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(() => typeof window === 'undefined' || window.innerWidth > 900)
  const [focus, setFocus] = useState<number | null>(null)
  return <Ctx.Provider value={{ on, setOn, focus, setFocus }}>{children}</Ctx.Provider>
}
export const useProposal = () => useContext(Ctx)

export function usePoints() {
  const { pathname } = useLocation()
  return POINTS[pathname.replace(/\/$/, '')] ?? []
}

/** 화면 요소에 제안 포인트 번호를 붙인다. 제안 포인트 모드가 꺼져 있으면 아무것도 그리지 않는다. */
export function Anno({ n, children, inline, place = 'corner', className = '', role }: { n: number; children: ReactNode; inline?: boolean; place?: 'corner' | 'out' | 'in' | 'right'; className?: string; role?: string }) {
  const { on, focus, setFocus } = useProposal()
  const Tag = inline ? 'span' : 'div'
  return (
    <Tag className={`anno${inline ? ' anno-inline' : ''}${on && focus === n ? ' anno-focus' : ''} ${className}`} id={`anno-${n}`} role={role}>
      {children}
      {on && (
        <button type="button" className={`pin pin-${place}`} aria-label={`제안 포인트 ${n}`} onClick={() => setFocus(focus === n ? null : n)}>{n}</button>
      )}
    </Tag>
  )
}

export function ProposalToggle() {
  const { on, setOn } = useProposal()
  return (
    <button className="btn btn-sm proposal-toggle" aria-pressed={on} onClick={() => setOn(!on)}>
      <Lightbulb size={14} />제안 포인트
    </button>
  )
}

export function ProposalPanel() {
  const { on, setOn, focus, setFocus } = useProposal()
  const points = usePoints()
  if (!on || points.length === 0) return null
  const go = (n: number) => {
    setFocus(n)
    document.getElementById(`anno-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <aside className="proposal-panel" aria-label="이 화면의 제안 포인트">
      <div className="proposal-head">
        <div className="stack-sm" style={{ gap: 2 }}>
          <b>이 화면의 제안 포인트</b>
          <span>발주처 과제를 어떻게 해결하는지</span>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" aria-label="제안 포인트 닫기" onClick={() => setOn(false)}><X size={15} /></button>
      </div>
      <ol className="proposal-list">
        {points.map((p) => (
          <li key={p.n}>
            <button className={`proposal-item${focus === p.n ? ' active' : ''}`} onClick={() => go(p.n)}>
              <span className="pin static">{p.n}</span>
              <span className="proposal-text">
                <b>{p.title}</b>
                <span className="pain">과제 · {p.pain}</span>
                <span>{p.how}</span>
                <span className="req">{p.req}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  )
}
