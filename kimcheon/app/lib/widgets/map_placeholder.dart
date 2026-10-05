import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../theme/gc_colors.dart';

/// 지도 SDK(카카오맵 + 대체 지도 이중화, SFR-004) 연동 전 임시 지도.
class MapPlaceholder extends StatelessWidget {
  const MapPlaceholder({
    super.key,
    required this.mountains,
    required this.isCertified,
    this.onTapMountain,
    this.selectedId,
  });

  final List<Mountain> mountains;
  final bool Function(String id) isCertified;
  final void Function(Mountain m)? onTapMountain;
  final String? selectedId;

  @override
  Widget build(BuildContext context) {
    final mountains = this.mountains.where((m) => m.summit.hasCoord).toList();
    if (mountains.isEmpty) return const ColoredBox(color: Color(0xFFE8EFE6));
    final lats = mountains.map((m) => m.summit.lat!);
    final lngs = mountains.map((m) => m.summit.lng!);
    final minLat = lats.reduce((a, b) => a < b ? a : b), maxLat = lats.reduce((a, b) => a > b ? a : b);
    final minLng = lngs.reduce((a, b) => a < b ? a : b), maxLng = lngs.reduce((a, b) => a > b ? a : b);

    return LayoutBuilder(
      builder: (context, c) {
        Offset pos(Mountain m) {
          final x = (m.summit.lng! - minLng) / ((maxLng - minLng).abs() + 1e-6);
          final y = 1 - (m.summit.lat! - minLat) / ((maxLat - minLat).abs() + 1e-6);
          return Offset(28 + x * (c.maxWidth - 56), 40 + y * (c.maxHeight - 90));
        }

        return Stack(
          children: [
            const Positioned.fill(child: CustomPaint(painter: _TerrainPainter())),
            for (final m in mountains)
              Positioned(
                left: pos(m).dx - 12,
                top: pos(m).dy - 30,
                child: _Pin(
                  mountain: m,
                  certified: isCertified(m.id),
                  selected: m.id == selectedId,
                  onTap: onTapMountain == null ? null : () => onTapMountain!(m),
                ),
              ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .85),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('지도 영역 (지도 API 연동 예정)', style: TextStyle(fontSize: 11, color: GcColors.textMute)),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin({required this.mountain, required this.certified, required this.selected, this.onTap});

  final Mountain mountain;
  final bool certified;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = certified ? GcColors.forest : GcColors.textSub;
    return Semantics(
      button: true,
      label: '${mountain.name} ${certified ? '인증완료' : '미인증'}',
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedScale(
          scale: selected ? 1.25 : 1,
          duration: const Duration(milliseconds: 200),
          alignment: Alignment.bottomCenter,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: selected ? GcColors.navy : color,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.5),
                  boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2))],
                ),
                child: Icon(certified ? LucideIcons.check300 : LucideIcons.mountain300, size: 12, color: Colors.white),
              ),
              Container(width: 2, height: 6, color: selected ? GcColors.navy : color),
            ],
          ),
        ),
      ),
    );
  }
}

class _TerrainPainter extends CustomPainter {
  const _TerrainPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = const Color(0xFFEAF1E7));
    final contour = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = const Color(0xFFCFDDC8);
    for (var i = 0; i < 9; i++) {
      final r = Rect.fromCenter(
        center: Offset(size.width * (.25 + (i % 3) * .28), size.height * (.25 + (i ~/ 3) * .27)),
        width: size.width * .5,
        height: size.height * .32,
      );
      for (var k = 0; k < 4; k++) {
        canvas.drawOval(r.deflate(k * 14.0), contour);
      }
    }
    // 하천(감천)
    final river = Path()
      ..moveTo(-10, size.height * .55)
      ..cubicTo(
        size.width * .3,
        size.height * .45,
        size.width * .55,
        size.height * .75,
        size.width + 10,
        size.height * .6,
      );
    canvas.drawPath(
      river,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 8
        ..color = const Color(0xFFB9D8EA),
    );
    // 도로
    final road = Path()
      ..moveTo(size.width * .1, -10)
      ..lineTo(size.width * .45, size.height * .5)
      ..lineTo(size.width * .9, size.height + 10);
    canvas.drawPath(
      road,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..color = Colors.white,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
