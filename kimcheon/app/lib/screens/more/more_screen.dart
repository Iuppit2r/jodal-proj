import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../auth/require_verified.dart';
import '../board/guestbook_screen.dart';
import '../board/notice_screen.dart';
import '../my/application_status_screen.dart';
import '../tour/nearby_tour_screen.dart';
import 'help_screen.dart';
import 'photo_credits_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    void push(Widget w) => Navigator.push(context, MaterialPageRoute(builder: (_) => w));

    return Scaffold(
      appBar: AppBar(title: const Text('더보기')),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Panel(
              onTap: s.isVerified ? null : () => requireVerified(context, reason: '완등 인증'),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: GcColors.navy.withValues(alpha: .08),
                    child: const Icon(LucideIcons.user300, color: GcColors.navy, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: s.isVerified
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${s.user!.name}님',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(LucideIcons.shieldCheck300, size: 14, color: GcColors.forest),
                                  const SizedBox(width: 4),
                                  Text(
                                    s.user!.verifiedBy,
                                    style: const TextStyle(fontSize: 13, color: GcColors.textSub),
                                  ),
                                ],
                              ),
                            ],
                          )
                        : const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('본인인증이 필요합니다', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                              SizedBox(height: 2),
                              Text('휴대폰 또는 아이핀으로 인증하기', style: TextStyle(fontSize: 13, color: GcColors.textSub)),
                            ],
                          ),
                  ),
                  if (!s.isVerified) const Icon(LucideIcons.chevronRight300, color: GcColors.textMute),
                ],
              ),
            ),
          ),
          _Group(
            title: '완등 인증',
            items: [
              _Item(
                LucideIcons.receiptText300,
                '인증서·인증물품 신청 내역',
                s.application == null
                    ? () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('신청 내역이 없습니다.')))
                    : () => push(const ApplicationStatusScreen()),
              ),
              _Item(LucideIcons.utensils300, '주변 음식점·숙박·관광지', () => push(const NearbyTourScreen())),
            ],
          ),
          _Group(
            title: '소식',
            items: [
              _Item(LucideIcons.megaphone300, '공지사항', () => push(const NoticeScreen())),
              _Item(LucideIcons.notebookPen300, '방명록', () => push(const GuestbookScreen())),
            ],
          ),
          _Group(
            title: '고객지원',
            items: [
              _Item(LucideIcons.circleHelp300, '이용안내', () => push(const HelpScreen())),
              _Item(LucideIcons.messageCircleQuestion300, '자주 묻는 질문', () => push(const HelpScreen(initialTab: 1))),
              _Item(LucideIcons.phone300, '문의전화 054-420-6615', () {}),
            ],
          ),
          _Group(
            title: '설정',
            items: [
              _Item(LucideIcons.bell300, '알림 설정', () {}),
              _Item(LucideIcons.shield300, '개인정보처리방침', () {}),
              _Item(LucideIcons.fileText300, '이용약관', () {}),
              _Item(LucideIcons.image300, '사진 출처', () => push(const PhotoCreditsScreen())),
              _Item(LucideIcons.info300, '앱 버전 1.0.0', null),
              if (s.isVerified) _Item(LucideIcons.logOut300, '본인인증 해제', s.logout),
            ],
          ),
          _Group(
            title: 'UI 시연용 (개발 단계 전용)',
            items: [
              _Item(LucideIcons.trophy300, '전체 완등 상태로 전환', s.demoCompleteAll),
              _Item(LucideIcons.rotateCcw300, '샘플 상태로 초기화', s.demoReset),
            ],
          ),
          const SizedBox(height: 28),
          Center(child: Image.asset('assets/brand/slogan_central_gimcheon.png', height: 34)),
          const SizedBox(height: 8),
          const Center(child: GcLogo(height: 22)),
        ],
      ),
    );
  }
}

class _Item {
  const _Item(this.icon, this.label, this.onTap);
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.items});
  final String title;
  final List<_Item> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
          child: Text(
            title,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: GcColors.textMute),
          ),
        ),
        Panel(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                ListTile(
                  onTap: items[i].onTap,
                  leading: Icon(items[i].icon, color: GcColors.textSub),
                  title: Text(items[i].label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  trailing: items[i].onTap == null
                      ? null
                      : const Icon(LucideIcons.chevronRight300, color: GcColors.disabled),
                ),
                if (i < items.length - 1) const Divider(indent: 56),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
