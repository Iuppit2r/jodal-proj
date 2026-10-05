import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_image.dart';
import '../shell/main_shell.dart';
import '../tour/nearby_tour_screen.dart';

/// 산 소개 · 등산코스 · 교통/주차 · 주변 관광 (SFR-007, SFR-008)
class MountainDetailScreen extends StatelessWidget {
  const MountainDetailScreen({super.key, required this.mountain});
  final Mountain mountain;

  @override
  Widget build(BuildContext context) {
    final m = mountain;
    final s = AppScope.of(context);
    final rec = s.recordOf(m.id);

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: GcColors.surface,
        body: NestedScrollView(
          headerSliverBuilder: (context, inner) => [
            SliverAppBar(
              pinned: true,
              backgroundColor: GcColors.surface,
              foregroundColor: GcColors.text,
              title: inner ? Text(m.name) : null,
              actions: [IconButton(onPressed: () {}, tooltip: '공유', icon: const Icon(LucideIcons.share300))],
            ),
            // 대표 이미지 – 사진은 원본 비율 그대로(자르지 않음), 위에 아무것도 올리지 않음
            SliverToBoxAdapter(
              child: AspectRatio(
                aspectRatio: 4 / 3,
                child: MountainImage(mountain: m),
              ),
            ),
            if (m.photo != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
                  child: Text(
                    m.photo!.credit,
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontSize: 11, color: GcColors.textMute),
                  ),
                ),
              ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CertifiedTag(certified: rec != null),
                        const SizedBox(width: 6),
                        if (m.ridge != null) Flexible(child: Tag(m.ridge!)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      m.name,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.8),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${m.regionLabel} · 해발 ${m.height}m',
                      style: const TextStyle(fontSize: 15, color: GcColors.textSub),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _SummitCard(m: m, rec: rec),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabHeader(
                const TabBar(
                  tabs: [
                    Tab(text: '소개'),
                    Tab(text: '등산코스'),
                    Tab(text: '교통·주차'),
                    Tab(text: '주변정보'),
                  ],
                ),
              ),
            ),
          ],
          body: TabBarView(
            children: [
              _IntroTab(m: m),
              _CourseTab(m: m),
              _TransportTab(m: m),
              _NearbyTab(m: m),
            ],
          ),
        ),
        bottomNavigationBar: BottomCta(
          child: rec == null
              ? FilledButton.icon(
                  onPressed: () => MainShell.openCertify(context, mountainId: m.id),
                  icon: const Icon(LucideIcons.camera300),
                  label: const Text('정상 인증사진 촬영'),
                )
              : FilledButton.icon(
                  style: FilledButton.styleFrom(
                    disabledBackgroundColor: GcColors.forest.withValues(alpha: .1),
                    disabledForegroundColor: GcColors.forest,
                  ),
                  onPressed: null,
                  icon: const Icon(LucideIcons.badgeCheck300),
                  label: Text('${fmtDateTime(rec.takenAt)} 인증완료'),
                ),
        ),
      ),
    );
  }
}

class _SummitCard extends StatelessWidget {
  const _SummitCard({required this.m, required this.rec});
  final Mountain m;
  final CertRecord? rec;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            SummitBadge(certified: rec != null, size: 56, label: m.summit.name),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '인증지점',
                    style: TextStyle(fontSize: 12, color: GcColors.textMute, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${m.summit.name} 정상석 (${m.height}m)',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    rec == null
                        ? '정상석 반경 50m 이내에서 촬영할 수 있어요'
                        : '${fmtDateTime(rec!.takenAt)} 인증 · 정상석과 ${rec!.distanceM}m',
                    style: TextStyle(
                      fontSize: 13,
                      color: rec == null ? GcColors.textSub : GcColors.forest,
                      fontWeight: FontWeight.w500,
                    ),
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

class _TabHeader extends SliverPersistentHeaderDelegate {
  _TabHeader(this.tabBar);
  final TabBar tabBar;

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) =>
      ColoredBox(color: GcColors.surface, child: tabBar);

  @override
  bool shouldRebuild(_TabHeader oldDelegate) => false;
}

class _IntroTab extends StatelessWidget {
  const _IntroTab({required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(m.intro, style: const TextStyle(fontSize: 16, height: 1.7, color: GcColors.text)),
        const SizedBox(height: 24),
        Row(
          children: [
            _Stat(label: '해발고도', value: '${m.height}m'),
            _Stat(label: '산줄기', value: m.ridge ?? '-'),
            _Stat(label: '인증지점', value: m.canCertify ? '등록' : '미등록'),
          ],
        ),
        const SizedBox(height: 24),
        const Text('위치 정보', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        InfoRow(icon: LucideIcons.mapPin300, label: '소재지', value: m.regionLabel),
        if (m.alias != null) InfoRow(icon: LucideIcons.tag300, label: '다른 이름', value: m.alias!),
        InfoRow(icon: LucideIcons.flag300, label: '정상', value: '${m.summit.name} (${m.height}m)'),
        InfoRow(
          icon: LucideIcons.locateFixed300,
          label: '좌표',
          value: m.summit.hasCoord
              ? 'N ${m.summit.lat!.toStringAsFixed(4)}  E ${m.summit.lng!.toStringAsFixed(4)}'
              : '미등록 (관리 프로그램에서 등록 예정)',
        ),
        const SizedBox(height: 12),
        Text(
          '자료: 김천 100명산(2020년 김천시 지정) · 매일신문 「김천의 100산 100설」'
          '${m.summit.hasCoord ? '\n정상 좌표: © OpenStreetMap contributors' : ''}',
          style: const TextStyle(fontSize: 12, height: 1.6, color: GcColors.textMute),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: GcColors.amber.withValues(alpha: .1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(LucideIcons.triangleAlert300, color: GcColors.amber, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  '산행 전 기상정보와 입산통제 여부를 확인하고, 일몰 2시간 전에는 하산을 시작하세요.',
                  style: TextStyle(fontSize: 14, height: 1.5, color: GcColors.text),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: Border.all(color: GcColors.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                maxLines: 1,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: GcColors.text),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 12, color: GcColors.textMute)),
        ],
      ),
    ),
  );
}

class _CourseTab extends StatelessWidget {
  const _CourseTab({required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    if (m.courses.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(32, 40, 32, 24),
        children: const [
          Column(
            children: [
              Icon(LucideIcons.route300, size: 40, color: GcColors.disabled),
              SizedBox(height: 12),
              Text(
                '등산코스 정보 준비중',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: GcColors.textSub),
              ),
              SizedBox(height: 4),
              Text(
                '코스·구간 거리는 관리 프로그램에서 등록되면 표시됩니다.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: GcColors.textMute),
              ),
            ],
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: m.courses.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final c = m.courses[i];
        final h = c.minutes ~/ 60, min = c.minutes % 60;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: GcColors.line),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(color: GcColors.surfaceAlt, shape: BoxShape.circle),
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(c.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                  DifficultyTag(c.difficulty),
                ],
              ),
              const SizedBox(height: 14),
              _CourseLine(start: c.start, end: '${m.summit.name} 정상석'),
              const SizedBox(height: 14),
              Row(
                children: [
                  _Metric(icon: LucideIcons.ruler300, text: '${c.distanceKm.toStringAsFixed(1)}km'),
                  const SizedBox(width: 16),
                  _Metric(icon: LucideIcons.clock300, text: '편도 ${h > 0 ? '$h시간 ' : ''}${min > 0 ? '$min분' : ''}'),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CourseLine extends StatelessWidget {
  const _CourseLine({required this.start, required this.end});
  final String start;
  final String end;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(LucideIcons.circleDot300, size: 16, color: GcColors.textMute),
        const SizedBox(width: 6),
        Flexible(
          child: Text(start, style: const TextStyle(fontSize: 14, color: GcColors.textSub)),
        ),
        const Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Divider(color: GcColors.disabled, thickness: 1.5),
          ),
        ),
        const Icon(LucideIcons.flag300, size: 16, color: GcColors.text),
        const SizedBox(width: 4),
        Flexible(
          child: Text(end, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 16, color: GcColors.textMute),
      const SizedBox(width: 4),
      Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
    ],
  );
}

class _TransportTab extends StatelessWidget {
  const _TransportTab({required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _InfoBlock(icon: LucideIcons.bus300, color: GcColors.textSub, title: '대중교통', body: m.transport ?? _pending),
        const SizedBox(height: 12),
        _InfoBlock(
          icon: LucideIcons.squareParking300,
          color: GcColors.textSub,
          title: '주차 정보',
          body: m.parking ?? _pending,
        ),
        const SizedBox(height: 12),
        _InfoBlock(
          icon: LucideIcons.car300,
          color: GcColors.textSub,
          title: '자가용',
          body: '내비게이션에 "${m.region} ${m.name} 등산로 입구"를 검색하세요.',
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(LucideIcons.navigation300),
          label: const Text('길찾기 (지도 앱 연결)'),
        ),
      ],
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.icon, required this.color, required this.title, required this.body});
  final IconData icon;
  final Color color;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      border: Border.all(color: GcColors.line),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: GcColors.surfaceAlt, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(body, style: const TextStyle(fontSize: 14, height: 1.6, color: GcColors.textSub)),
            ],
          ),
        ),
      ],
    ),
  );
}

class _NearbyTab extends StatelessWidget {
  const _NearbyTab({required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    final list = places.where((p) => p.nearMountainId == m.id).toList();
    final data = list.isEmpty ? places : list; // 샘플 데이터가 없는 산은 황악산 데이터로 대체 표시
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final t in PlaceType.values) ...[
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8),
            child: Row(
              children: [
                Icon(t.icon, size: 18, color: GcColors.textSub),
                const SizedBox(width: 6),
                Text(t.label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          for (final p in data.where((p) => p.type == t).take(2)) PlaceTile(place: p, dense: true),
          const SizedBox(height: 12),
        ],
        OutlinedButton(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NearbyTourScreen(mountain: m))),
          child: const Text('주변 관광정보 전체보기'),
        ),
      ],
    );
  }
}

const _pending = '관리 프로그램에서 등록 예정인 정보입니다.';
