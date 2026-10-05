import 'package:flutter/material.dart';

/// 김천시 CI(심벌마크) · BI(도시브랜드 슬로건 "Central Gimcheon") 기반 색상 체계.
///
/// 출처: 김천시 누리집 > 김천소개 > 상징물 (전용색상 / 도시브랜드)
///
/// ── 색상 사용 규칙 ──────────────────────────────────────────
/// 1. navy      : 행동·선택에만 사용. 주요 버튼(화면당 1개), 선택 상태(탭·칩·라디오), 텍스트 링크.
///                장식용 아이콘·숫자·제목에는 쓰지 않는다.
/// 2. sun 그라데이션 : "성취"에만 사용. 완등 진행 링, 인증 스탬프, 하단 인증(카메라) 버튼.
/// 3. 의미색     : forest=인증완료/성공, error=오류·필수·안전경고, amber=주의 안내. 의미가 있을 때만.
/// 4. 그 외 전부 : 중립색(text / textSub / textMute / surfaceAlt). 아이콘·태그·카테고리는 기본 중립.
///    teal·blue·BI 색은 UI 강조에 쓰지 않는다 (지도 '내 위치' 점만 blue 관례 유지).
class GcColors {
  GcColors._();

  // ── CI 전용색상 ─────────────────────────────────────────
  /// CI 주색 – 심벌마크의 "감천·직지천" 물결 청색
  static const navy = Color(0xFF02347D);
  static const navyDeep = Color(0xFF01245A);

  /// CI 태양 그라데이션 (황 → 주황 → 적)
  static const sunYellow = Color(0xFFF3B603);
  static const sunOrange = Color(0xFFE6800D);
  static const sunVermilion = Color(0xFFD54018);
  static const sunRed = Color(0xFFC60023);

  /// CI 보조색
  static const forest = Color(0xFF088543);
  static const teal = Color(0xFF0A91AE);
  static const blue = Color(0xFF0070AF);
  static const amber = Color(0xFFEF9600);
  static const peach = Color(0xFFF9AD89);
  static const mint = Color(0xFF91CDCE);
  static const lavender = Color(0xFFB49EC4);
  static const cream = Color(0xFFFFD07E);

  // ── BI(Central Gimcheon) ───────────────────────────────
  static const biNavy = Color(0xFF004A8C);
  static const biCyan = Color(0xFF30A8C0);
  static const biGreen = Color(0xFF78C018);

  // ── 앱 UI 중립색 ───────────────────────────────────────
  static const bg = Color(0xFFF4F6FA);
  static const surface = Colors.white;
  static const surfaceAlt = Color(0xFFEEF2F8);
  static const line = Color(0xFFE2E7EF);
  static const text = Color(0xFF191F28);
  static const textSub = Color(0xFF4E5968);
  static const textMute = Color(0xFF8B95A1);
  static const disabled = Color(0xFFC5CCD6);
  static const error = Color(0xFFD32F2F);

  /// 상태색
  static const certified = forest;
  static const pending = amber;

  static const sunGradient = LinearGradient(
    begin: Alignment.bottomCenter,
    end: Alignment.topCenter,
    colors: [sunYellow, sunOrange, sunVermilion, sunRed],
    stops: [0, .3, .55, .85],
  );

  static const sunGradientH = LinearGradient(colors: [sunYellow, sunOrange, sunRed]);

  static const navyGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0A4A9E), navy, navyDeep],
  );
}
