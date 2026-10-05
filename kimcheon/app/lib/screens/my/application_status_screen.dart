import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import 'application_form_screen.dart';

/// 제출한 신청서 확인 · 수정 · 진행상태 (SFR-006, SFR-013)
class ApplicationStatusScreen extends StatelessWidget {
  const ApplicationStatusScreen({super.key, this.justSubmitted = false});
  final bool justSubmitted;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final a = s.application!;
    final reward = rewards.firstWhere((r) => r.id == a.rewardId);

    return Scaffold(
      appBar: AppBar(title: const Text('신청 내역')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          if (justSubmitted)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: GcColors.forest),
                    child: const Icon(LucideIcons.check300, color: Colors.white, size: 40),
                  ),
                  const SizedBox(height: 16),
                  const Text('신청이 접수되었습니다', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  const Text('처리 결과는 알림으로 안내해 드려요', style: TextStyle(color: GcColors.textSub)),
                ],
              ),
            ),
          _CertificatePreview(name: a.name, round: s.round.name),
          const SizedBox(height: 16),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('진행 상태', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                _Stepper(current: a.status),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('신청 정보', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                    if (a.status == ApplicationStatus.applied)
                      TextButton.icon(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ApplicationFormScreen(editing: a)),
                        ),
                        icon: const Icon(LucideIcons.pencil300, size: 16),
                        label: const Text('수정'),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                InfoRow(icon: LucideIcons.user300, label: '이름', value: a.name),
                InfoRow(icon: LucideIcons.cake300, label: '생년월일', value: a.birth),
                InfoRow(icon: LucideIcons.smartphone300, label: '휴대전화', value: _maskPhone(a.phone)),
                InfoRow(
                  icon: LucideIcons.house300,
                  label: '주소',
                  value: '(${a.zipcode}) ${a.address} ${a.addressDetail}',
                ),
                const Divider(height: 24),
                InfoRow(icon: LucideIcons.gift300, label: '인증물품', value: reward.name),
                InfoRow(
                  icon: LucideIcons.calendarCheck300,
                  label: '수령희망일',
                  value: '${fmtDate(a.receiveDate)} (${weekdayKo[a.receiveDate.weekday - 1]})',
                ),
                InfoRow(icon: LucideIcons.clock300, label: '신청일시', value: fmtDateTime(a.submittedAt)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '· 신청완료 상태에서만 신청 내용을 수정할 수 있습니다.\n· 방문 수령: 김천시청 산림과 (평일 09:00~18:00)\n· 문의: 054-420-6615',
            style: TextStyle(fontSize: 13, color: GcColors.textMute, height: 1.7),
          ),
        ],
      ),
    );
  }

  static String _maskPhone(String p) {
    final d = p.replaceAll('-', '');
    if (d.length < 10) return p;
    return '${d.substring(0, 3)}-****-${d.substring(d.length - 4)}';
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({required this.current});
  final ApplicationStatus current;

  @override
  Widget build(BuildContext context) {
    const steps = ApplicationStatus.values;
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i <= current.index ? GcColors.navy : GcColors.surfaceAlt,
                ),
                child: i < current.index
                    ? const Icon(LucideIcons.check300, color: Colors.white, size: 18)
                    : Center(
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            color: i <= current.index ? Colors.white : GcColors.textMute,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
              ),
              const SizedBox(height: 6),
              Text(
                steps[i].label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: i == current.index ? FontWeight.w700 : FontWeight.w500,
                  color: i <= current.index ? GcColors.navy : GcColors.textMute,
                ),
              ),
            ],
          ),
          if (i < steps.length - 1)
            Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.only(bottom: 22, left: 4, right: 4),
                color: i < current.index ? GcColors.navy : GcColors.line,
              ),
            ),
        ],
      ],
    );
  }
}

/// 완등 인증서 미리보기
class _CertificatePreview extends StatelessWidget {
  const _CertificatePreview({required this.name, required this.round});
  final String name;
  final String round;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1 / 1.1,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFFFDF7),
          borderRadius: BorderRadius.circular(18),
          boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 16, offset: Offset(0, 6))],
        ),
        padding: const EdgeInsets.all(10),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: GcColors.sunOrange.withValues(alpha: .6), width: 1.5),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          child: Stack(
            children: [
              Positioned.fill(
                child: Opacity(
                  opacity: .06,
                  child: Center(child: Image.asset('assets/brand/symbol_mark.png', width: 240)),
                ),
              ),
              Column(
                children: [
                  const Text(
                    'CERTIFICATE',
                    style: TextStyle(
                      fontSize: 11,
                      letterSpacing: 4,
                      color: GcColors.sunOrange,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '완 등 인 증 서',
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: GcColors.navy, letterSpacing: 2),
                  ),
                  const SizedBox(height: 18),
                  Text('성명  $name', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  Text(
                    '위 사람은 「$round」에서\n김천시 ${mountains.length}개 산의 정상을 모두 올라\n완등하였기에 이 인증서를 드립니다.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, height: 1.8, color: GcColors.text),
                  ),
                  const Spacer(),
                  Text(fmtDate(DateTime(2026, 9, 30)), style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const GcSymbol(height: 28),
                      const SizedBox(width: 8),
                      const Text(
                        '김 천 시 장',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 2),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          border: Border.all(color: GcColors.sunRed, width: 1.5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          '印',
                          style: TextStyle(color: GcColors.sunRed, fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
