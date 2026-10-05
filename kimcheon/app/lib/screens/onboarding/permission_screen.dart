import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/gc_colors.dart';
import '../auth/verify_screen.dart';

/// 앱 접근권한 안내 (정보통신망법 제22조의2)
class PermissionScreen extends StatelessWidget {
  const PermissionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 40, 24, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '앱 사용을 위해\n접근 권한을 허용해 주세요',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1.35, letterSpacing: -0.8),
              ),
              const SizedBox(height: 12),
              const Text('정상석 위치 확인과 인증사진 촬영에 꼭 필요한 권한입니다.', style: TextStyle(fontSize: 15, color: GcColors.textSub)),
              const SizedBox(height: 36),
              const _Section('필수 접근권한'),
              const _PermItem(icon: LucideIcons.locateFixed300, title: '위치', desc: '정상석 반경 내 도착 여부 확인, 주변 관광정보 안내'),
              const _PermItem(icon: LucideIcons.camera300, title: '카메라', desc: '정상석 인증사진 촬영'),
              const SizedBox(height: 20),
              const _Section('선택 접근권한'),
              const _PermItem(
                icon: LucideIcons.bell300,
                title: '알림',
                desc: '정상 도착 알림, 공지사항 및 신청 처리 결과 안내',
                optional: true,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(12)),
                child: const Text(
                  '선택 권한은 허용하지 않아도 앱을 이용할 수 있으며, 휴대폰 [설정 > 애플리케이션]에서 언제든 변경할 수 있습니다.',
                  style: TextStyle(fontSize: 13, color: GcColors.textSub, height: 1.5),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () =>
                    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const VerifyScreen())),
                child: const Text('확인'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      text,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: GcColors.navy),
    ),
  );
}

class _PermItem extends StatelessWidget {
  const _PermItem({required this.icon, required this.title, required this.desc, this.optional = false});

  final IconData icon;
  final String title;
  final String desc;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: optional ? GcColors.surfaceAlt : GcColors.navy.withValues(alpha: .08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: optional ? GcColors.textSub : GcColors.navy),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 14, color: GcColors.textSub, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
