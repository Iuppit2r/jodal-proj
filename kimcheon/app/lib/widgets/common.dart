import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../theme/gc_colors.dart';

/// 김천시 심벌마크 (태양·산·물결)
class GcSymbol extends StatelessWidget {
  const GcSymbol({super.key, this.height = 40});
  final double height;

  @override
  Widget build(BuildContext context) =>
      Image.asset('assets/brand/symbol_mark.png', height: height, semanticLabel: '김천시 심벌마크');
}

/// 김천시 로고타입 (심벌 + 김천시 GIMCHEON CITY)
class GcLogo extends StatelessWidget {
  const GcLogo({super.key, this.height = 28, this.white = false});
  final double height;
  final bool white;

  @override
  Widget build(BuildContext context) => Image.asset(
    white ? 'assets/brand/logo_gimcheon_white.png' : 'assets/brand/logo_gimcheon.png',
    height: height,
    semanticLabel: '김천시',
  );
}

/// 태양 그라데이션 진행 링
class SunProgressRing extends StatelessWidget {
  const SunProgressRing({
    super.key,
    required this.value,
    this.size = 120,
    this.stroke = 12,
    this.trackColor = GcColors.surfaceAlt,
    this.child,
  });

  final double value;
  final double size;
  final double stroke;
  final Color trackColor;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.clamp(0, 1)),
        duration: const Duration(milliseconds: 900),
        curve: Curves.easeOutCubic,
        builder: (context, v, _) => CustomPaint(
          painter: _RingPainter(v, stroke, trackColor),
          child: Center(child: child),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value, this.stroke, this.track);
  final double value;
  final double stroke;
  final Color track;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = (Offset.zero & size).deflate(stroke / 2);
    canvas.drawArc(
      rect,
      0,
      math.pi * 2,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..color = track,
    );
    if (value <= 0) return;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      math.pi * 2 * value,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = const SweepGradient(
          startAngle: -math.pi / 2,
          endAngle: math.pi * 1.5,
          colors: [GcColors.sunYellow, GcColors.sunOrange, GcColors.sunRed, GcColors.sunYellow],
          stops: [0, .45, .9, 1],
          transform: GradientRotation(-math.pi / 2),
        ).createShader(rect),
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value;
}

/// 스탬프북 산 배지 – 인증 여부를 아이콘으로 표시 (SFR-005)
class SummitBadge extends StatelessWidget {
  const SummitBadge({super.key, required this.certified, this.size = 64, this.label});

  final bool certified;
  final double size;
  final String? label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label == null ? null : '$label ${certified ? '인증 완료' : '미인증'}',
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: certified ? GcColors.sunGradient : null,
          color: certified ? null : GcColors.surfaceAlt,
          border: certified ? null : Border.all(color: GcColors.line, width: 1.5),
          boxShadow: certified
              ? [
                  BoxShadow(
                    color: GcColors.sunOrange.withValues(alpha: .35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: CustomPaint(
          painter: _PeakGlyph(certified),
          child: certified
              ? Align(
                  alignment: const Alignment(.78, -.78),
                  child: Container(
                    width: size * .32,
                    height: size * .32,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: const [BoxShadow(color: Color(0x26000000), blurRadius: 4, offset: Offset(0, 1))],
                    ),
                    child: Icon(LucideIcons.check300, size: size * .2, color: GcColors.navy),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

class _PeakGlyph extends CustomPainter {
  _PeakGlyph(this.on);
  final bool on;

  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height;
    final peak = Path()
      ..moveTo(w * .18, h * .70)
      ..lineTo(w * .44, h * .34)
      ..lineTo(w * .54, h * .46)
      ..lineTo(w * .62, h * .40)
      ..lineTo(w * .84, h * .70)
      ..close();
    canvas.drawPath(peak, Paint()..color = on ? Colors.white : GcColors.disabled);
    final wave = Path()
      ..moveTo(w * .14, h * .80)
      ..quadraticBezierTo(w * .5, h * .66, w * .86, h * .78)
      ..quadraticBezierTo(w * .5, h * .72, w * .14, h * .80)
      ..close();
    canvas.drawPath(
      wave,
      Paint()
        ..color = on ? GcColors.navy : GcColors.disabled
        ..style = PaintingStyle.stroke
        ..strokeWidth = w * .05
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_PeakGlyph old) => old.on != on;
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onAction, this.padding});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.fromLTRB(20, 28, 12, 12),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 18)),
            ),
          ),
          if (actionLabel != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(foregroundColor: GcColors.textSub),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [Text(actionLabel!), const Icon(LucideIcons.chevronRight300, size: 18)],
              ),
            ),
        ],
      ),
    );
  }
}

class Tag extends StatelessWidget {
  const Tag(this.label, {super.key, this.color = GcColors.textSub, this.filled = false, this.icon});

  final String label;
  final Color color;
  final bool filled;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: filled ? color : color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 12, color: filled ? Colors.white : color), const SizedBox(width: 3)],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: filled ? Colors.white : color,
                letterSpacing: -0.2,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DifficultyTag extends StatelessWidget {
  const DifficultyTag(this.d, {super.key});
  final Difficulty d;

  @override
  Widget build(BuildContext context) => Tag(d.label);
}

class CertifiedTag extends StatelessWidget {
  const CertifiedTag({super.key, required this.certified, this.onImage = false});
  final bool certified;

  /// 사진·일러스트 위에 올릴 때는 가독성을 위해 채움 스타일
  final bool onImage;

  @override
  Widget build(BuildContext context) => certified
      ? Tag('인증완료', color: GcColors.certified, filled: onImage, icon: LucideIcons.check300)
      : Tag('미인증', color: onImage ? const Color(0x73000000) : GcColors.textMute, filled: onImage);
}

/// 흰 카드 컨테이너
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.margin, this.onTap});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin ?? EdgeInsets.zero,
      child: Material(
        color: GcColors.surface,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: GcColors.textMute),
          const SizedBox(width: 10),
          SizedBox(
            width: 72,
            child: Text(
              label,
              style: const TextStyle(color: GcColors.textMute, fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: GcColors.text, fontSize: 14, fontWeight: FontWeight.w600, height: 1.45),
            ),
          ),
        ],
      ),
    );
  }
}

/// 하단 고정 CTA 영역
class BottomCta extends StatelessWidget {
  const BottomCta({super.key, required this.child, this.top});
  final Widget child;
  final Widget? top;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: GcColors.surface,
        border: Border(top: BorderSide(color: GcColors.line)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.paddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (top != null) ...[top!, const SizedBox(height: 10)],
          child,
        ],
      ),
    );
  }
}

Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String ok = '확인',
  String cancel = '취소',
}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      content: Text(message, style: const TextStyle(fontSize: 15, color: GcColors.textSub, height: 1.5)),
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      actions: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(cancel),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(ok),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  return r ?? false;
}
