// UI 시안 화면 캡처용 테스트.
// 실행: flutter test test/screenshots_test.dart --update-goldens
// 결과: test/goldens/*.png
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gimcheon_summit/data/app_state.dart';
import 'package:gimcheon_summit/data/mock_data.dart';
import 'package:gimcheon_summit/data/models.dart';
import 'package:gimcheon_summit/screens/auth/verify_screen.dart';
import 'package:gimcheon_summit/screens/board/guestbook_screen.dart';
import 'package:gimcheon_summit/screens/board/notice_screen.dart';
import 'package:gimcheon_summit/screens/certify/certify_screen.dart';
import 'package:gimcheon_summit/screens/more/help_screen.dart';
import 'package:gimcheon_summit/screens/more/photo_credits_screen.dart';
import 'package:gimcheon_summit/screens/mountains/mountain_detail_screen.dart';
import 'package:gimcheon_summit/screens/my/application_form_screen.dart';
import 'package:gimcheon_summit/screens/my/application_status_screen.dart';
import 'package:gimcheon_summit/screens/onboarding/permission_screen.dart';
import 'package:gimcheon_summit/screens/onboarding/splash_screen.dart';
import 'package:gimcheon_summit/screens/shell/main_shell.dart';
import 'package:gimcheon_summit/screens/tour/nearby_tour_screen.dart';
import 'package:gimcheon_summit/theme/gc_theme.dart';

Future<void> _loadFonts() async {
  final pre = FontLoader('Pretendard');
  for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) {
    pre.addFont(Future.value(ByteData.sublistView(File('assets/fonts/Pretendard-$w.otf').readAsBytesSync())));
  }
  await pre.load();

  final flutterRoot = Platform.environment['FLUTTER_ROOT'] ?? '${Platform.environment['HOME']}/development/flutter';
  final icons = FontLoader('MaterialIcons')
    ..addFont(Future.value(ByteData.sublistView(
        File('$flutterRoot/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf').readAsBytesSync())));
  await icons.load();

  final lucideDir = '${Platform.environment['HOME']}/.pub-cache/hosted/pub.dev/lucide_icons_flutter-3.1.20/assets';
  for (final w in ['300', '400']) {
    final loader = FontLoader('packages/lucide_icons_flutter/Lucide$w')
      ..addFont(Future.value(ByteData.sublistView(File('$lucideDir/build_font/LucideVariable-w$w.ttf').readAsBytesSync())));
    await loader.load();
  }
}

const _assets = [
  'assets/brand/symbol_mark.png',
  'assets/brand/logo_gimcheon.png',
  'assets/brand/logo_gimcheon_white.png',
  'assets/brand/slogan_central_gimcheon.png',
  'assets/peaks/geumo.jpg',
  'assets/peaks/hwangak.jpg',
];

Widget _app(AppState state, Widget home) => AppScope(
      state: state,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: GcTheme.light(),
        locale: const Locale('ko', 'KR'),
        supportedLocales: const [Locale('ko', 'KR')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: home,
      ),
    );

AppState _verified() => AppState()..verify(sampleUser);

Future<void> _shot(
  WidgetTester tester,
  String name,
  Widget home, {
  AppState? state,
  Future<void> Function(WidgetTester t)? act,
  double height = 844,
  Duration settle = const Duration(seconds: 2),
}) async {
  tester.view.physicalSize = Size(390 * 3, height * 3);
  tester.view.devicePixelRatio = 3;
  tester.view.padding = const FakeViewPadding(top: 47 * 3, bottom: 34 * 3);
  addTearDown(tester.view.reset);

  await tester.pumpWidget(_app(state ?? _verified(), home));
  await tester.runAsync(() async {
    final ctx = tester.element(find.byType(MaterialApp));
    for (final a in _assets) {
      await precacheImage(AssetImage(a), ctx);
    }
  });
  await tester.pump(settle);
  if (act != null) await act(tester);
  await tester.pump(settle);
  await expectLater(find.byType(MaterialApp), matchesGoldenFile('goldens/$name.png'));
}

void main() {
  setUpAll(_loadFonts);

  testWidgets('01 splash', (t) async {
    await _shot(t, '01_splash', const SplashScreen(), settle: const Duration(milliseconds: 450));
    await t.pump(const Duration(seconds: 3));
  });
  testWidgets('02 permission', (t) => _shot(t, '02_permission', const PermissionScreen()));
  testWidgets('03 verify', (t) => _shot(t, '03_verify', const VerifyScreen(), state: AppState()));
  testWidgets('04 home', (t) => _shot(t, '04_home', const MainShell(), height: 1500));
  testWidgets('05 mountains', (t) => _shot(t, '05_mountains', const MainShell(), act: (t) async {
        MainShell.switchTab(t.element(find.byType(Scaffold).first), 1);
        await t.pump();
      }));
  testWidgets('06 mountains map', (t) => _shot(t, '06_mountains_map', const MainShell(), act: (t) async {
        MainShell.switchTab(t.element(find.byType(Scaffold).first), 1);
        await t.pump();
        await t.tap(find.byTooltip('지도로 보기'));
        await t.pump();
      }));
  testWidgets('07 mountain detail', (t) => _shot(t, '07_mountain_detail', MountainDetailScreen(mountain: mountainById('hwangak'))));
  testWidgets('07b mountain detail photo', (t) => _shot(t, '07b_mountain_photo', MountainDetailScreen(mountain: mountainById('geumo'))));
  testWidgets('23 photo credits', (t) => _shot(t, '23_photo_credits', const PhotoCreditsScreen()));
  testWidgets('08 mountain course', (t) => _shot(t, '08_mountain_course', MountainDetailScreen(mountain: mountainById('hwangak')),
          act: (t) async {
        await t.tap(find.widgetWithText(Tab, '등산코스'));
        await t.pumpAndSettle();
      }));
  testWidgets('09 certify locate', (t) => _shot(t, '09_certify_far', const CertifyScreen(initialMountainId: 'hwangak')));
  testWidgets('10 certify in range', (t) {
    final s = _verified()..toggleSimulateAtSummit();
    return _shot(t, '10_certify_near', const CertifyScreen(initialMountainId: 'hwangak'), state: s);
  });
  testWidgets('11 certify camera', (t) {
    final s = _verified()..toggleSimulateAtSummit();
    return _shot(t, '11_certify_camera', const CertifyScreen(initialMountainId: 'hwangak'), state: s, act: (t) async {
      await t.tap(find.text('인증사진 촬영하기'));
      await t.pump();
    });
  });
  testWidgets('12 certify confirm', (t) {
    final s = _verified()..toggleSimulateAtSummit();
    return _shot(t, '12_certify_confirm', const CertifyScreen(initialMountainId: 'hwangak'), state: s, act: (t) async {
      await t.tap(find.text('인증사진 촬영하기'));
      await t.pump();
      await t.tap(find.bySemanticsLabel('촬영'));
      await t.pump();
    });
  });
  testWidgets('13 certify done', (t) {
    final s = _verified()..toggleSimulateAtSummit();
    return _shot(t, '13_certify_done', const CertifyScreen(initialMountainId: 'hwangak'), state: s, act: (t) async {
      await t.tap(find.text('인증사진 촬영하기'));
      await t.pump();
      await t.tap(find.bySemanticsLabel('촬영'));
      await t.pump();
      await t.tap(find.text('인증사진 등록'));
      await t.pumpAndSettle();
      await t.tap(find.text('등록'));
      await t.pumpAndSettle();
    });
  });
  testWidgets('09b certify no coord', (t) => _shot(t, '09b_certify_nocoord', CertifyScreen(initialMountainId: mountains.firstWhere((m) => !m.canCertify).id)));
  testWidgets('14 my stamps', (t) => _shot(t, '14_my_stamps', const MainShell(), height: 1300, act: (t) async {
        MainShell.switchTab(t.element(find.byType(Scaffold).first), 3);
        await t.pump();
      }));
  testWidgets('15 my complete', (t) {
    final s = _verified()..demoCompleteAll();
    return _shot(t, '15_my_complete', const MainShell(), state: s, act: (t) async {
      MainShell.switchTab(t.element(find.byType(Scaffold).first), 3);
      await t.pump();
    });
  });
  testWidgets('16 application form', (t) {
    final s = _verified()..demoCompleteAll();
    return _shot(t, '16_application_form', const ApplicationFormScreen(), state: s, height: 1700);
  });
  testWidgets('17 application status', (t) {
    final s = _verified()..demoCompleteAll();
    s.submitApplication(CertApplication(
      name: '홍길동',
      birth: '1985.04.12',
      phone: '010-1234-5678',
      zipcode: '39520',
      address: '경상북도 김천시 시청1길 1',
      addressDetail: '101동 1001호',
      receiveDate: DateTime(2026, 10, 14),
      rewardId: 'cert',
      submittedAt: DateTime(2026, 9, 30, 14, 20),
    ));
    return _shot(t, '17_application_status', const ApplicationStatusScreen(justSubmitted: true), state: s, height: 1800);
  });
  testWidgets('18 nearby tour', (t) => _shot(t, '18_nearby_tour', const NearbyTourScreen()));
  testWidgets('19 notice', (t) => _shot(t, '19_notice', const NoticeScreen()));
  testWidgets('20 guestbook', (t) => _shot(t, '20_guestbook', const GuestbookScreen(), height: 1300));
  testWidgets('21 help', (t) => _shot(t, '21_help', const HelpScreen()));
  testWidgets('22 more', (t) => _shot(t, '22_more', const MainShell(), height: 1300, act: (t) async {
        MainShell.switchTab(t.element(find.byType(Scaffold).first), 4);
        await t.pump();
      }));
}
