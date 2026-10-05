# RAPID — AI 기반 단백질 설계 자동화 플랫폼 통합 콘솔 (UI 시안)

제안요청서 「AI 기반 단백질 설계 자동화 플랫폼 구축」(한국생명공학연구원 국가바이오파운드리사업단)의
사용자 인터페이스 요구사항에 대응하는 화면 시안입니다. 프런트엔드 UI만 포함하며 백엔드는 목(mock) 데이터로 대체했습니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 정적 산출물 dist/
```

기술스택: React 19 · TypeScript · Vite (제안요청서 지정 Frontend React 준수)

## 화면 구성과 요구사항 대응

| 화면 | 경로 | 대응 요구사항 |
|---|---|---|
| 운영 현황 (대시보드) | `/` | SFR-023 모니터링, SFR-020 Agent Panel, UIR-001 통합 정보구조 |
| 실행 설정 (Setup) | `/setup` | SFR-001 통합 실행환경, SFR-002 Stage 오케스트레이션, SFR-003 MSA·보존도, SFR-004 백본 관리, SFR-005 ProteinMPNN tier, SFR-006 SoluProt, SFR-007 AF2, SFR-021 결합 예측, SFR-017 fork 정책 |
| Workflow Studio (정형) | `/workflow` `/monitor` | SFR-010 체크포인트 실행 제어 |
| **DAG Studio (자유형)** | `/dag` | **SFR-011 자유형 DAG 구축**, UIR-002 양 모드 용어·조작 일관성 |
| Monitor | `/monitor` | SFR-002 체크포인트, SFR-009 run 중심 산출물, SFR-019 다운로드, DAR-001·DAR-002 메타데이터 |
| Analyze | `/analyze` | SFR-008 WT Diff·비교, SFR-015 Compare Studio·Hit List, SFR-021 결합 결과, UIR-004 3D·서열·지표 통합 뷰어 |
| 프로젝트 · 라운드 | `/projects` | SFR-018 프로젝트·라운드·태스크·피드백, SFR-025 버전 관리, DAR-005 피드백 축적, DAR-006 학습 데이터셋 |
| Model Registry | `/models` | SFR-012 모델 확장·버전 관리, DAR-003 Registry 저장소, SER-008 등록 승인 |
| 작업 큐 | `/jobs` | SFR-022 큐 관리·스케줄링 |
| GPU 운영 | `/gpu` | SFR-016 RunPod Admin·외부 GPU 운영 |
| 성능 · 동시접속 | `/perf` | SFR-024 동시접속 안정화, PER-001~003 성능 기준 |
| 외부 연계 | `/integrations` | SFR-013 MCP 도구 서버, SIR-001 JSON-RPC, SIR-002 HTTP API·OpenAPI, SIR-003 동적 라우팅, SER-005 시크릿 |
| 보안 · 데이터 | `/admin` | SER-001 RBAC, SER-002 OIDC/SSO, SER-003~007 암호화·격리·감사, DAR-004 아티팩트 저장소, DAR-007 레거시 마이그레이션, DAR-008 아카이빙, DAR-009 MongoDB |
| Copilot 패널 (전 화면) | 우측 패널 | SFR-014 자연어 계획·실행·해석, UIR-003 대화형 제어 화면 |

승계 대상(Setup · Workflow Studio · Monitor · Analyze · RunPod Admin)은 모두 동일 정보구조 안에 배치했고,
핵심 고도화 범위인 자유형 DAG Studio와 Model Registry를 별도 화면으로 신설했습니다.

반응형(UIR-005)은 1280 / 960 / 560px 분기로 사이드바·Copilot·DAG 캔버스·그리드가 재배치됩니다.

## 조작 가능한 부분

- **DAG Studio** — 팔레트 클릭으로 노드 추가, 노드 드래그 이동, 출력→입력 포트 클릭으로 연결, 캔버스 패닝·확대, 노드별 인스펙터 편집, 템플릿 저장·불러오기, 유효성 검사
- **Setup** — 5단계 위저드, 파이프라인 선택에 따라 단계 구성·입력 폼 전환, 파라미터 슬라이더가 요약에 반영
- **Monitor** — run 선택 → 단계 바 → 단계별 상세/이벤트/산출물/파라미터 탭, 체크포인트 검토 모달
- **Analyze** — 가중치 슬라이더로 Hit List 실시간 재정렬, 산점도 점 선택과 표 선택 연동, 구조 뷰어 드래그 회전·착색 모드 전환, 서열 뷰 치환/고정 잔기 표시
- **Copilot** — 빠른 프롬프트·질의 유형별 응답과 추천 액션

## 데이터

모든 수치는 `src/data/mock.ts`의 시연용 데이터입니다. 실제 모델 실행이나 API 호출은 없습니다.
