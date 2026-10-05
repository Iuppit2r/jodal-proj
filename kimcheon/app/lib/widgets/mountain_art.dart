import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/gc_colors.dart';

/// 실사 사진 연동 전까지 사용하는 산 일러스트.
/// CI 심벌의 "태양 · 산 · 물결" 모티브를 레이어드 능선으로 재해석했다.
class MountainArt extends StatelessWidget {
  const MountainArt({
    super.key,
    required this.hue,
    this.seed = 0,
    this.showSun = true,
    this.dusk = false,
    this.horizon = .48,
    this.child,
  });

  final double hue;
  final int seed;
  final bool showSun;
  final bool dusk;

  /// 능선이 시작되는 높이 비율 (0=상단, 1=하단)
  final double horizon;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _MountainPainter(hue: hue, seed: seed, showSun: showSun, dusk: dusk, horizon: horizon),
      child: child ?? const SizedBox.expand(),
    );
  }
}

class _MountainPainter extends CustomPainter {
  _MountainPainter({
    required this.hue,
    required this.seed,
    required this.showSun,
    required this.dusk,
    required this.horizon,
  });

  final double hue;
  final int seed;
  final bool showSun;
  final bool dusk;
  final double horizon;

  Color _c(double s, double l, [double dh = 0]) => HSLColor.fromAHSL(1, (hue + dh) % 360, s, l).toColor();

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final sky = dusk
        ? const [Color(0xFFFFD9A8), Color(0xFFF7A26B), Color(0xFF5A6FA8)]
        : [const Color(0xFFFFF4E0), _c(.55, .86, 10), _c(.45, .74, 20)];
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: sky,
        ).createShader(rect),
    );

    if (showSun) {
      final r = size.shortestSide * .22;
      final c = Offset(size.width * (.68 + (seed % 3) * .06), size.height * (horizon - .06));
      canvas.drawCircle(
        c,
        r,
        Paint()
          ..shader = GcColors.sunGradient.createShader(Rect.fromCircle(center: c, radius: r))
          ..color = Colors.white.withValues(alpha: .9),
      );
    }

    final rnd = math.Random(seed * 31 + hue.round());
    const layers = 4;
    for (var i = 0; i < layers; i++) {
      final t = i / (layers - 1);
      final span = 1 - horizon;
      final baseY = size.height * (horizon + t * span * .42);
      final amp = size.height * span * (.38 - t * .15);
      final path = Path()..moveTo(0, size.height);
      path.lineTo(0, baseY);
      const steps = 7;
      for (var s = 1; s <= steps; s++) {
        final x = size.width * s / steps;
        final peak = s.isOdd;
        final y = baseY - (peak ? amp * (.6 + rnd.nextDouble() * .5) : amp * rnd.nextDouble() * .25);
        final cx = size.width * (s - .5) / steps;
        path.quadraticBezierTo(cx, y + (peak ? -amp * .15 : amp * .1), x, y);
      }
      path
        ..lineTo(size.width, size.height)
        ..close();
      final color = dusk
          ? Color.lerp(const Color(0xFF6D6FA8), GcColors.navyDeep, t)!
          : Color.lerp(_c(.35, .62, -10), _c(.55, .22, -20), t)!;
      canvas.drawPath(path, Paint()..color = color);
    }

    // 하단 물결 (CI 청색 붓터치)
    final wave = Path()
      ..moveTo(-10, size.height * .93)
      ..quadraticBezierTo(size.width * .45, size.height * .80, size.width + 10, size.height * .90)
      ..lineTo(size.width + 10, size.height)
      ..lineTo(-10, size.height)
      ..close();
    canvas.drawPath(wave, Paint()..color = GcColors.navy.withValues(alpha: .88));
  }

  @override
  bool shouldRepaint(_MountainPainter old) =>
      old.hue != hue || old.seed != seed || old.showSun != showSun || old.dusk != dusk || old.horizon != horizon;
}
