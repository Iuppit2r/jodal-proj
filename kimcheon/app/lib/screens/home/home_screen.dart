import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../theme/gc_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_image.dart';
import '../auth/require_verified.dart';
import '../board/guestbook_screen.dart';
import '../board/notice_screen.dart';
import '../more/help_screen.dart';
import '../mountains/mountain_detail_screen.dart';
import '../shell/main_shell.dart';
import '../tour/nearby_tour_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final nearby = [...mountains]..sort(compareByDistance);

    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        titleSpacing: 20,
        title: const GcLogo(height: 28),
        actions: [
          IconButton(
            tooltip: '알림',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeScreen())),
            icon: const Badge(smallSize: 7, backgroundColor: GcColors.sunRed, child: Icon(LucideIcons.bell300)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: _ProgressHero(state: state),
          ),
          const _QuickMenu(),
          SectionHeader(title: '가까운 인증지점', actionLabel: '전체보기', onAction: () => MainShell.switchTab(context, 1)),
          SizedBox(
            height: 222,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 6,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => _NearbyCard(m: nearby[i], certified: state.isCertified(nearby[i].id)),
            ),
          ),
          SectionHeader(
            title: '공지사항',
            actionLabel: '더보기',
            onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoticeScreen())),
          ),
          Panel(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                for (final n in notices.take(3))
                  ListTile(
                    onTap: () =>
                        Navigator.push(context, MaterialPageRoute(builder: (_) => NoticeDetailScreen(notice: n))),
                    title: Row(
                      children: [
                        if (n.pinned) ...[
                          Tag(n.category, color: n.category == '안전' ? GcColors.error : GcColors.textSub),
                          const SizedBox(width: 8),
                        ],
                        Expanded(
                          child: Text(
                            n.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    trailing: Text(
                      fmtDate(n.date).substring(5),
                      style: const TextStyle(color: GcColors.textMute, fontSize: 13),
                    ),
                  ),
              ],
            ),
          ),
          SectionHeader(
            title: '완등 후기',
            actionLabel: '방명록',
            onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GuestbookScreen())),
          ),
          SizedBox(
            height: 150,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: guestbook.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => _ReviewCard(p: guestbook[i]),
            ),
          ),
          const SizedBox(height: 36),
          Center(
            child: Opacity(opacity: .9, child: Image.asset('assets/brand/slogan_central_gimcheon.png', height: 36)),
          ),
          const SizedBox(height: 10),
          const Center(
            child: Text('김천시 산림과 · 054-420-6615', style: TextStyle(fontSize: 12, color: GcColors.textMute)),
          ),
        ],
      ),
    );
  }
}

class _ProgressHero extends StatelessWidget {
  const _ProgressHero({required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    final round = state.round;
    final verified = state.isVerified;

    return Container(
      decoration: BoxDecoration(
        gradient: GcColors.navyGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: GcColors.navy.withValues(alpha: .25), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // CI 태양 모티브 – 은은한 동심원
          for (final (size, alpha) in const [(260.0, .05), (190.0, .06), (120.0, .08)])
            Positioned(
              right: -size / 2 + 20,
              top: -size / 2 + 20,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: alpha),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: state.roundActive ? .18 : .1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        state.roundActive ? '진행중' : '기간 외',
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        round.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '인증기간 ${fmtDate(round.start)} ~ ${fmtDate(round.end)}',
                  style: TextStyle(color: Colors.white.withValues(alpha: .7), fontSize: 12),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    SunProgressRing(
                      value: verified ? state.progress : 0,
                      size: 104,
                      stroke: 10,
                      trackColor: Colors.white.withValues(alpha: .15),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            verified ? '${(state.progress * 100).round()}%' : '-',
                            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                          ),
                          Text('완등률', style: TextStyle(color: Colors.white.withValues(alpha: .7), fontSize: 12)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: verified
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${state.user!.name}님의 완등 기록',
                                  style: TextStyle(color: Colors.white.withValues(alpha: .8), fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                RichText(
                                  text: TextSpan(
                                    style: const TextStyle(fontFamily: GcTheme.font, color: Colors.white),
                                    children: [
                                      TextSpan(
                                        text: '${state.done}',
                                        style: const TextStyle(
                                          fontSize: 34,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      ),
                                      TextSpan(
                                        text: ' / ${state.total}개 산',
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  state.isComplete ? '축하합니다! 완등 인증을 신청하세요' : '완등까지 ${state.remaining}개 남았어요',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: .85),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '김천의 산,\n함께 완등해요',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                    height: 1.3,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '본인인증 후 인증 기록이 저장됩니다',
                                  style: TextStyle(color: Colors.white.withValues(alpha: .75), fontSize: 13),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: GcColors.navy,
                      minimumSize: const Size.fromHeight(50),
                    ),
                    onPressed: verified
                        ? () => MainShell.openCertify(context)
                        : () => requireVerified(context, reason: '완등 인증'),
                    icon: Icon(verified ? LucideIcons.camera300 : LucideIcons.shieldCheck300, size: 20),
                    label: Text(verified ? '정상 인증사진 촬영하기' : '본인인증하고 시작하기'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickMenu extends StatelessWidget {
  const _QuickMenu();

  @override
  Widget build(BuildContext context) {
    void push(Widget w) => Navigator.push(context, MaterialPageRoute(builder: (_) => w));
    final items = <(IconData, String, Color, VoidCallback)>[
      (LucideIcons.mountain300, '산 정보', GcColors.text, () => MainShell.switchTab(context, 1)),
      (LucideIcons.medal300, '나의 완등', GcColors.text, () => MainShell.switchTab(context, 3)),
      (LucideIcons.utensils300, '주변 맛집·숙박', GcColors.text, () => push(const NearbyTourScreen())),
      (LucideIcons.megaphone300, '공지사항', GcColors.text, () => push(const NoticeScreen())),
      (LucideIcons.notebookPen300, '방명록', GcColors.text, () => push(const GuestbookScreen())),
      (LucideIcons.circleHelp300, '이용안내', GcColors.text, () => push(const HelpScreen())),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Panel(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        child: GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.35,
          children: [
            for (final it in items)
              InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: it.$4,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(color: GcColors.surfaceAlt, borderRadius: BorderRadius.circular(14)),
                      child: Icon(it.$1, color: it.$3, size: 24),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      it.$2,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: GcColors.text),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NearbyCard extends StatelessWidget {
  const _NearbyCard({required this.m, required this.certified});
  final Mountain m;
  final bool certified;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Material(
        color: GcColors.surface,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MountainDetailScreen(mountain: m))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 110, child: MountainImage(mountain: m)),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text('${m.region} · ${m.height}m', style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        CertifiedTag(certified: certified),
                        const Spacer(),
                        const Icon(LucideIcons.navigation300, size: 14, color: GcColors.textMute),
                        const SizedBox(width: 3),
                        Text(
                          fmtKm(m.distanceFromMeKm),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: GcColors.textSub),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.p});
  final GuestbookPost p;

  @override
  Widget build(BuildContext context) {
    final m = mountainById(p.mountainId);
    return SizedBox(
      width: 260,
      child: Panel(
        padding: const EdgeInsets.all(16),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GuestbookScreen())),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Tag(m.name, icon: LucideIcons.mountain300),
                const Spacer(),
                Text(p.author, style: const TextStyle(fontSize: 13, color: GcColors.textMute)),
              ],
            ),
            const SizedBox(height: 10),
            Expanded(
              child: Text(
                p.body,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, height: 1.5, color: GcColors.text),
              ),
            ),
            Row(
              children: [
                const Icon(LucideIcons.heart300, size: 14, color: GcColors.textMute),
                const SizedBox(width: 4),
                Text('${p.likes}', style: const TextStyle(fontSize: 12, color: GcColors.textSub)),
                const Spacer(),
                Text(fmtDate(p.date), style: const TextStyle(fontSize: 12, color: GcColors.textMute)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
