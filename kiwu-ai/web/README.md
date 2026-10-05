# 경인여자대학교 ESG 챗봇 — Web (UI)

제안요청서(`../2. 제안요청서.hwp`) 기반 1단계 UI. 현재 응답·관리자 데이터는 모두 목업입니다.

```bash
npm install
npm run dev      # http://localhost:5173
```

| 경로 | 화면 | 관련 요구사항 |
|---|---|---|
| `/` | 홈페이지 탑재 미리보기 (우측 하단 런처 → 레이어 팝업, 모바일은 전체화면). PC 배경은 실제 홈페이지 캡처 `public/mock/kiwu-home-pc.jpg` — 예시안 캡처는 1920×1080 창 권장 | FUR-007, IR-001, IR-003 |
| `/mobile` | 모바일 예시안 캡처용 — HTML 아이폰 15 Pro 목업 안에 실제 모바일 홈페이지 캡처(`public/mock/kiwu-home-mobile.jpg`) + 챗봇. 상단 토글로 홈페이지/챗봇 전환, ‘처음부터’로 대화 초기화 | IR-003 |
| `/chat` | 전체화면 챗봇 (모바일 바로가기·외부 채널 웹뷰용) | IR-004 |
| `/admin` | 대시보드·통계, CSV/Excel 내보내기 | FUR-009 |
| `/admin/knowledge` | 지식베이스 자료 등록·버전·라이선스 관리 | FUR-002, FUR-008, DAR-002 |
| `/admin/updates` | 최신성 관리 (수집→감지·판정→검증·반영→배포→통지) | FUR-006, 부속서 3 |
| `/admin/conversations` | 질의응답 이력·오답 신고 검수 | FUR-008, DAR-003 |
| `/admin/safety` | 금칙어·자동 판별·차단 이력 | FUR-011 |
| `/admin/settings` | 안내 문구, 응답 정책, 보관 기간, 권한 | FUR-008 |
| `/admin/login` | 관리자 로그인 | SER-001 |

## 챗봇 UI 요소 ↔ 요구사항

- 대화 시작 시 생성형 AI 한계 안내 (FUR-005)
- 첫 화면은 인사 한 줄 + 시작 질문 4개 + 한 줄 AI 안내(펼쳐보기)로 최소화 (FUR-005)
- 눈높이 5단계(U1~U5)는 입력창 하단 칩 팝오버에서 선택·전환, 답변별 「더 쉽게/더 자세히」 (FUR-003, 부속서 2)
- 답변 근거 카드 → 출처 상세 시트(발행기관·버전·발행시점·원문 위치·인용문) (FUR-005, IR-002)
- 답변 유형 배지: 추론 포함 / 근거 확인 불가 / 답변 제한 / 범위 안내 (FUR-005, FUR-011)
- 단계별 안내 + 법적 자문 아님 고지 (FUR-004)
- 최신 반영 표시 (S-10), 용어 풀이, 오답 신고, 피드백
- 다국어 [선택 항목] (FUR-010): 언어 선택 UI 없이 입력 언어 자동 감지 응답 방식으로 제안 예정

## 구조

- `src/widget/` — 챗봇 위젯 (홈페이지 삽입 단위)
- `src/services/chatService.ts` — API 호출 지점. RAG 연동 시 이 파일만 교체
- `src/data/` — 목업 데이터
- `src/pages/admin/` — 관리자 콘솔

## 디자인 메모

- 관리자 콘솔은 SaaS 스타일(zinc 뉴트럴 팔레트): 공통 컴포넌트는 `src/pages/admin/ui.tsx` (Tabs, FilterChip, Table, Drawer, Modal, Toast, AreaChart 등). ⌘K 커맨드 팔레트 지원

- 브랜드 컬러는 홈페이지의 `#fd3148`. 흰 글자 대비가 3.68:1이라 버튼·텍스트에는 `#d4152d`(5.32:1)를 사용 (KWCAG 4.5:1)
- 보조 컬러 네이비 `#003876`, 폰트 Pretendard Variable (npm `pretendard`, 자체 호스팅 · 다이나믹 서브셋)
- 로고는 임시 심볼/워드마크 — 정식 CI 파일 수령 후 `src/components/Logo.tsx` 교체
