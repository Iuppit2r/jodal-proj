import 'package:flutter/material.dart';

import '../../data/mock_data.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_image.dart';

/// 사진 출처 – 자유이용 라이선스(CC BY 등) 저작자 표시
class PhotoCreditsScreen extends StatelessWidget {
  const PhotoCreditsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final list = mountains.where((m) => m.photo != null).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('사진 출처')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(4, 0, 4, 12),
            child: Text(
              '앱에 사용된 봉우리 사진은 자유이용 라이선스(공공누리 제1유형, 크리에이티브 커먼즈 등)로 공개된 저작물입니다. '
              '사진이 없는 봉우리는 일러스트로 표시됩니다.',
              style: TextStyle(fontSize: 13, height: 1.6, color: GcColors.textSub),
            ),
          ),
          if (list.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text('등록된 사진이 없습니다', style: TextStyle(color: GcColors.textMute)),
              ),
            ),
          for (final m in list)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Panel(
                padding: const EdgeInsets.all(12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 64,
                        height: 64,
                        color: MountainImage.letterbox,
                        // 원본 비율 유지 (변경금지 저작물 포함)
                        child: Image.asset(m.photo!.asset, fit: BoxFit.contain),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.fullName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text('저작자 ${m.photo!.author}', style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                          Text(m.photo!.license, style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                          SelectableText(
                            m.photo!.sourceUrl,
                            style: const TextStyle(fontSize: 11, color: GcColors.textMute),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
