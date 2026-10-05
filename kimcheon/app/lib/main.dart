import 'dart:ui' show PointerDeviceKind;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'data/app_state.dart';
import 'data/mock_data.dart';
import 'screens/onboarding/splash_screen.dart';
import 'screens/shell/main_shell.dart';
import 'theme/gc_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  final state = AppState();
  _applyMockStart(state);
  runApp(GimcheonSummitApp(state: state));
}

class GimcheonSummitApp extends StatelessWidget {
  const GimcheonSummitApp({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: MaterialApp(
        title: '김천 산악 완등',
        debugShowCheckedModeBanner: false,
        scrollBehavior: const _AppScrollBehavior(),
        theme: GcTheme.light(),
        locale: const Locale('ko', 'KR'),
        supportedLocales: const [Locale('ko', 'KR')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: _mockDevice ? _withMockSafeArea : null,
        home: _mockStart == null ? const SplashScreen() : const MainShell(),
      ),
    );
  }
}

/// 웹 폰 목업(web_mockup/index.html) 안에서 실행 중인지 – iframe src에 ?device=mock
final _mockDevice = kIsWeb && Uri.base.queryParameters['device'] == 'mock';

/// 웹 목업 시작 상태 – ?start=home (로그인 후 홈) | ?start=complete (로그인 + 전체 완등)
/// 없으면 스플래시부터 시작
final String? _mockStart = kIsWeb ? Uri.base.queryParameters['start'] : null;

void _applyMockStart(AppState state) {
  if (_mockStart == null) return;
  state.verify(sampleUser);
  if (_mockStart == 'complete') state.demoCompleteAll();
}

/// 목업 프레임의 상태표시줄·홈 인디케이터 영역만큼 안전영역을 부여 (iPhone 15 기준)
Widget _withMockSafeArea(BuildContext context, Widget? child) {
  const pad = EdgeInsets.only(top: 47, bottom: 34);
  final mq = MediaQuery.of(context);
  return MediaQuery(
    data: mq.copyWith(padding: pad, viewPadding: pad),
    child: child!,
  );
}

/// 웹 목업에서 마우스 드래그로도 스크롤되도록 허용
class _AppScrollBehavior extends MaterialScrollBehavior {
  const _AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {...super.dragDevices, PointerDeviceKind.mouse, PointerDeviceKind.trackpad};
}
