import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';

/// 온라인 도움말 (SIR-001)
class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key, this.initialTab = 0});
  final int initialTab;

  static const _steps = [
    (LucideIcons.shieldCheck300, '본인인증', '휴대폰 또는 아이핀으로 김천시 본인인증을 진행합니다. 인증 기록은 본인인증 정보로 관리됩니다.'),
    (LucideIcons.footprints300, '산 정상 도착', '산 정보에서 등산코스를 확인하고 산행을 시작하세요. 정상석 반경 50m 안에 들어오면 알림이 옵니다.'),
    (LucideIcons.camera300, '인증사진 촬영·등록', '앱 카메라로 정상석이 보이도록 촬영합니다. 촬영 일시와 위치가 자동으로 기록됩니다.'),
    (LucideIcons.medal300, '진행현황 확인', '나의 완등에서 인증한 산과 남은 산을 스탬프로 확인할 수 있습니다.'),
    (LucideIcons.award300, '완등 인증 신청', '모든 산을 인증하면 신청 버튼이 활성화됩니다. 신청서를 작성해 인증서와 인증물품을 받으세요.'),
  ];

  static const _faq = [
    ('정상석 근처인데 카메라가 활성화되지 않아요.', '산 정상에서는 GPS 수신이 지연될 수 있습니다. 휴대폰 위치 설정을 "정확한 위치"로 켜고 잠시 기다린 뒤 다시 시도해 주세요.'),
    ('갤러리에 있는 사진으로 인증할 수 있나요?', '인증의 공정성을 위해 앱 카메라로 정상석 반경 내에서 직접 촬영한 사진만 등록할 수 있습니다.'),
    ('인증기간이 지나면 기록은 어떻게 되나요?', '회차 인증기간이 지나면 해당 회차의 신규 인증은 불가하며, 기존 인증 기록은 나의 완등에서 계속 확인할 수 있습니다.'),
    ('신청한 인증물품을 변경하고 싶어요.', '신청 내역의 상태가 "신청완료"인 경우 신청 내역 화면에서 직접 수정할 수 있습니다.'),
    ('인증물품은 어디서 받나요?', '신청서에 입력한 수령 희망일에 김천시청 산림과에서 수령하실 수 있습니다. (문의 054-420-6615)'),
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      initialIndex: initialTab,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('이용안내'),
          bottom: const TabBar(
            tabs: [
              Tab(text: '완등 인증 방법'),
              Tab(text: '자주 묻는 질문'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            ListView(
              padding: const EdgeInsets.all(20),
              children: [
                for (var i = 0; i < _steps.length; i++)
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Column(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(color: GcColors.surfaceAlt, shape: BoxShape.circle),
                              child: Icon(_steps[i].$1, color: GcColors.text, size: 22),
                            ),
                            if (i < _steps.length - 1) Expanded(child: Container(width: 2, color: GcColors.line)),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'STEP ${i + 1}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: GcColors.textMute,
                                  ),
                                ),
                                Text(_steps[i].$2, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                                const SizedBox(height: 4),
                                Text(
                                  _steps[i].$3,
                                  style: const TextStyle(fontSize: 14, height: 1.6, color: GcColors.textSub),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final f in _faq)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Panel(
                      padding: EdgeInsets.zero,
                      child: Theme(
                        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          leading: const Text(
                            'Q',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: GcColors.textMute),
                          ),
                          title: Text(f.$1, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          expandedCrossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(f.$2, style: const TextStyle(fontSize: 14, height: 1.6, color: GcColors.textSub)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
