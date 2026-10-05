# NCMIK Search Assist — UI 프로토타입

「국가 의과학 지식자원 RAG 기반 지능형 서비스 구축」 제안요청서(2026.8, 국립보건연구원) 기반 화면 프로토타입입니다.
모든 데이터는 목업이며 백엔드 연동은 없습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 정적 산출물
```

우측 상단 **접속 권한**(대국민 / 내부직원 / 관리자)을 바꾸면 권한별 화면·메뉴가 달라집니다.
`#/search?q=질문` 형태로 진입하면 바로 질의가 실행됩니다.

## 화면 ↔ 요구사항 매핑

| 화면 | 경로 | 주요 기능 | 요구사항 |
|---|---|---|---|
| Search Assist | `#/search` | 자연어 질의, 자동완성, 검색범위(컬렉션·외부 PubMed/WoS) 선택, 다중 문서 지정 질의, 파이프라인 단계 표시, 스트리밍 답변, 인용 번호 ↔ 근거 문서 분할 뷰·출처 하이라이트, 키워드/벡터/리랭크 점수, 응답시간(검색·TTFT·E2E) 표시, 근거 없을 때 답변 생성 거부 | SFR-01, INR-04, INR-05, PER-02 |
| 질병재난 아카이브 | `#/save` | 버전 그룹 목록·의미 검색, 드래그/번호 입력 정렬, 그룹 재배정·제거, SHA-256 해시 추출(업로드 시 실제 계산)·무결성 검증, 읽기 전용, 메타데이터 수정·롤백, 최신판 자동판정/수동지정, 3단계 공개상태, 대국민 노출정책(최종판만/전체), 타임라인, 메타데이터 Diff, 계보 그래프(Lineage Graph), 감사 로그 | SFR-02, DAR-12 |
| 통합전자도서관 | `#/library` | 통합검색·정확도(Score) 정렬, Facet 다중선택, 유사 소장자료 추천, 예약·희망도서 신청, My Library(대출/연장/예약/제재), 관리자 대시보드 위젯 설정·My메뉴·최근메뉴·접속이력·경영통계 차트 | SFR-03 |
| MeSH 자동색인 | `#/mesh` (내부직원+) | 랜덤 표본 추출(비율/건수), 원문 ↔ AI 추천 2분할 검수 뷰, 근거 키워드 하이라이트, 참조 정답셋 링크, 주표목/부표목/핵심주제/Publication Type/Check·Geographic Tag 분류, NLM 유효성 표시, 원클릭 승인·반려(단축키 A/R/J/K), MeSH 용어 검색 교체·추가, 품질 모니터링 차트, 배치 색인 현황 | SFR-04, PER-03, DAR-11 |
| 운영관리 | `#/admin` (관리자) | 하이브리드 가중치 동적 조정, Re-ranker·Top-K, vLLM/TEI 모델, 외부 생성형 AI·학술자원 연계 스위치, 마리너4 연동 상태, 자동완성 사전, 성능 지표(목표 대비 P95), 가용성·GPU, RAG 데이터 파이프라인 현황 | SFR-01, PER-02/04, INR-05/06, DAR-13 |

## 웹 접근성·호환성 (COR-08, INR-01)

- 반응형(PC·모바일), 본문 바로가기, `lang="ko"`, 포커스 표시, ARIA role(tab, combobox, dialog, radiogroup), 키보드 조작(자동완성·모달 ESC·검수 단축키)
- 외부 라이브러리 없이 SVG 차트·계보 그래프 직접 구현 (React + Vite + TypeScript)

## 구조

```
src/
  App.tsx            앱 셸, 라우팅, 권한별 메뉴
  context.tsx        권한(Role)·토스트 상태
  components/        공통 UI, SVG 차트
  data/              화면별 목업 데이터
  pages/             SearchAssist · SaveArchive · Library · MeshReview · Admin
```
