import 'package:flutter/material.dart';

import '../data/models.dart';
import 'mountain_art.dart';

/// 봉우리 대표 이미지 – 실사진이 있으면 사진, 없으면 일러스트
class MountainImage extends StatelessWidget {
  const MountainImage({super.key, required this.mountain, this.seed, this.showSun = true, this.child});

  final Mountain mountain;
  final int? seed;
  final bool showSun;

  /// 일러스트 위에만 표시 (사진 위에는 올리지 않음)
  final Widget? child;

  /// 사진 여백 색
  static const letterbox = Color(0xFFE9EDF2);

  @override
  Widget build(BuildContext context) {
    final art = MountainArt(hue: mountain.hue, seed: seed ?? mountain.id.length, showSun: showSun);
    final photo = mountain.photo;
    return Stack(
      fit: StackFit.expand,
      children: [
        if (photo == null) ...[
          art,
          if (child != null) child!,
        ] else
          // 공공누리 제3유형(변경금지) 준수: 자르지 않고 원본 비율 그대로, 사진 위에 오버레이 없음
          ColoredBox(
            color: letterbox,
            child: Image.asset(
              photo.asset,
              fit: BoxFit.contain,
              semanticLabel: '${mountain.name} 사진',
              errorBuilder: (_, __, ___) => art,
            ),
          ),
      ],
    );
  }
}
