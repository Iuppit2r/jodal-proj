# 김천 산악 완등 인증 앱 (UI 시안)

「김천시 산악 완등 인증시스템 구축 사업」 제안요청서 기반 사용자 모바일 앱(Android / iOS) UI 시안입니다.
기능(API·GPS·카메라·본인인증 연동)은 아직 붙이지 않았고, 샘플 데이터와 시연용 상태로 동작합니다.

## 실행

```bash
flutter pub get
flutter run                      # 연결된 기기 / 시뮬레이터
flutter test test/screenshots_test.dart --update-goldens   # 전 화면 캡처 → test/goldens/
```

## 브랜드 (김천시 누리집 > 김천소개 > 상징물)

| 구분 | 값 | 용도 |
|---|---|---|
| CI 주색 (물결 청색) | `#02347D` | Primary, 버튼, 헤더 |
| CI 태양 그라데이션 | `#F3B603 → #E6800D → #D54018 → #C60023` | 완등·성취 표현 (진행 링, 스탬프, 인증 버튼) |
| CI 보조색 | 녹 `#088543`, 청록 `#0A91AE`, 청 `#0070AF`, 주황 `#EF9600` | 인증완료 상태, 정보 강조 |
| BI (Central Gimcheon) | 시안 `#30A8C0`, 그린 `#78C018`, 네이비 `#004A8C` | 보조 강조, 진행중 배지 |

- 에셋: `assets/brand/` (심벌마크, 로고타입, 도시브랜드 슬로건 — 공식 배포 파일에서 배경 제거)
- 서체: Pretendard (`assets/fonts/`, SIL OFL)
- 토큰: `lib/theme/gc_colors.dart`, `lib/theme/gc_theme.dart`

## 화면 ↔ 요구사항

| 화면 | 파일 | RFP |
|---|---|---|
| 스플래시 / 접근권한 안내 | `screens/onboarding/` | – |
| 본인인증 (휴대폰·아이핀) | `screens/auth/` | SFR-004 |
| 홈 (회차·진행률·가까운 인증지점·공지·후기) | `screens/home/` | SFR-005, 008, 009 |
| 산 목록 (검색·필터·정렬·지도 보기) | `screens/mountains/mountain_list_screen.dart` | SFR-005, SFR-004(지도) |
| 산 상세 (소개·등산코스·교통/주차·주변정보) | `screens/mountains/mountain_detail_screen.dart` | SFR-007, 008 |
| 정상 인증 (GPS 반경 확인 → 알림 → 앱 카메라 → 일시 확인 → 등록) | `screens/certify/` | SFR-005 |
| 나의 완등 (스탬프 아이콘·인증기록·신청 버튼 활성화) | `screens/my/my_cert_screen.dart` | SFR-005, 006 |
| 인증서·인증물품 신청서 (필수값 검증, 개인정보 동의/비동의) | `screens/my/application_form_screen.dart` | SFR-006, SER-003 |
| 신청 내역 (확인·수정·지급상태) | `screens/my/application_status_screen.dart` | SFR-006, 013 |
| 주변 음식점·숙박·관광지 | `screens/tour/` | SFR-007 |
| 공지사항 / 방명록(본인인증 후 작성) | `screens/board/` | SFR-008 |
| 이용안내·FAQ (온라인 도움말) | `screens/more/help_screen.dart` | SIR-001 |

## 시연용 요소 (기능 개발 시 제거)

- 정상 인증 화면 하단 **"시연용 · 정상 도착 시뮬레이션"** 스위치
- 더보기 > **UI 시연용** 메뉴 (전체 완등 전환 / 초기화)
- `lib/data/mock_data.dart` 인증기록·관광정보·게시글·사용자는 샘플
- `widgets/mountain_art.dart` 산 일러스트 / `widgets/map_placeholder.dart` 임시 지도 → 실사진·지도 SDK로 교체

## 산 데이터 (김천 100명산)

- `lib/data/gimcheon_peaks.dart` — **실제 목록 98개** (생성 파일, 원본: `../docs/gimcheon_peaks_research.json`)
- 목록·높이·산줄기: 매일신문 연재 「김천의 100산 100설」(2020) 산줄기별 목록 — 2020년 5월 김천시 100명산 재지정 기준
- 정상 좌표: OpenStreetMap `natural=peak` (이름·높이 ±30m 일치분만) — **71개 확보 / 27개 미확보**
- 지역: 기사 표기 우선, 없으면 좌표 역지오코딩(리 단위 `○○리 일원` 또는 `영동군 경계` 등)
- 좌표 없는 봉우리는 지도·거리에서 제외되고 인증 화면에서 "인증지점 등록 전"으로 잠김
- 등산코스·교통·주차는 출처가 없어 비워두고 "관리 프로그램에서 등록 예정"으로 표시

**주의** — 김천시 공식 목록 원문은 확보하지 못했습니다. 2개 봉우리 미확인, 2021년 이후 목록 개정(추가·명칭 변경) 정황이 있습니다.
착수 시 김천시 산림녹지과(054-420-6324) 원본 목록과 좌표로 교체해야 합니다.

## 봉우리 사진

- `assets/peaks/` + `manifest.json` → `python3 tool/gen_peak_photos.py` 로 `lib/data/peak_photos.dart` 생성
- 공공누리 제1·3유형, CC0/CC BY/CC BY-SA만 사용. 제3유형(변경금지) 준수를 위해 모든 사진은 자르지 않고 원본 비율로, 사진 위 오버레이 없이 표시. 블로그·카페·뉴스, 공공누리 2·4유형(상업이용 금지)은 제외
- 현재 **2개**: 금오산 서봉(한국관광공사 김지호, 공공누리 제1유형), 황악산 정상석(한국관광공사, 공공누리 제3유형). 나머지 96개는 일러스트
- 저작자 표시: 산 상세 사진 우하단 + 더보기 > 사진 출처

## 다음 단계 (기능)

- 지도: 카카오맵 + 대체 지도 이중화 (SFR-004)
- 위치: geolocator 기반 정상석 반경 판정, 지오펜스 푸시
- 카메라: 앱 내 촬영 전용 (갤러리 차단), EXIF/서버 시각 검증
- 본인인증: 김천시 본인인증 모듈 WebView 연동
- 백엔드: 전자정부표준프레임워크 CMS / 관리 프로그램(모바일 웹) API
