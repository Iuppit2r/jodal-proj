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
import '../mountains/mountain_detail_screen.dart';
import 'application_form_screen.dart';
import 'application_status_screen.dart';

/// 나의 완등 – 인증 진행현황 · 인증기록 · 완등 인증 신청 (SFR-005, SFR-006)
class MyCertScreen extends StatefulWidget {
  const MyCertScreen({super.key});

  @override
  State<MyCertScreen> createState() => _MyCertScreenState();
}

class _MyCertScreenState extends State<MyCertScreen> {
  bool _gridView = true;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);

    if (!s.isVerified) {
      return Scaffold(
        appBar: AppBar(title: const Text('나의 완등')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SummitBadge(certified: false, size: 88),
                const SizedBox(height: 20),
                const Text('본인인증 후 확인할 수 있어요', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text(
                  '인증 기록은 본인인증 정보로 안전하게 관리됩니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: GcColors.textSub),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size(200, 52)),
                  onPressed: () => requireVerified(context, reason: '나의 완등'),
                  child: const Text('본인인증 하기'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('나의 완등')),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _Summary(s: s)),
          SliverToBoxAdapter(child: _ApplyCard(s: s)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 12, 8),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('인증 현황', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  ),
                  SegmentedButton<bool>(
                    showSelectedIcon: false,
                    style: SegmentedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      selectedBackgroundColor: GcColors.navy,
                      selectedForegroundColor: Colors.white,
                      side: const BorderSide(color: GcColors.line),
                    ),
                    segments: const [
                      ButtonSegment(value: true, icon: Icon(LucideIcons.layoutGrid300, size: 18), tooltip: '스탬프로 보기'),
                      ButtonSegment(value: false, icon: Icon(LucideIcons.list300, size: 18), tooltip: '인증기록으로 보기'),
                    ],
                    selected: {_gridView},
                    onSelectionChanged: (v) => setState(() => _gridView = v.first),
                  ),
                ],
              ),
            ),
          ),
          if (_gridView)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              sliver: SliverGrid.count(
                crossAxisCount: 4,
                mainAxisSpacing: 16,
                crossAxisSpacing: 8,
                childAspectRatio: .7,
                children: [
                  for (final m in mountains)
                    InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () =>
                          Navigator.push(context, MaterialPageRoute(builder: (_) => MountainDetailScreen(mountain: m))),
                      child: Column(
                        children: [
                          SummitBadge(certified: s.isCertified(m.id), size: 64, label: m.name),
                          const SizedBox(height: 6),
                          Text(
                            m.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: s.isCertified(m.id) ? GcColors.text : GcColors.textMute,
                            ),
                          ),
                          Text(
                            s.isCertified(m.id) ? fmtDate(s.recordOf(m.id)!.takenAt).substring(5) : '${m.height}m',
                            style: TextStyle(
                              fontSize: 11,
                              color: s.isCertified(m.id) ? GcColors.textSub : GcColors.textMute,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              sliver: SliverList.separated(
                itemCount: s.recordsLatestFirst.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _RecordTile(r: s.recordsLatestFirst[i], index: s.done - i),
              ),
            ),
        ],
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.s});
  final AppState s;

  @override
  Widget build(BuildContext context) {
    final highest = s.recordsLatestFirst.isEmpty
        ? 0
        : s.recordsLatestFirst.map((r) => mountainById(r.mountainId).height).reduce((a, b) => a > b ? a : b);
    final totalHeight = s.recordsLatestFirst.fold<int>(0, (a, r) => a + mountainById(r.mountainId).height);

    return Container(
      color: GcColors.surface,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        children: [
          // 회차 선택
          InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  s.round.name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: GcColors.textSub),
                ),
                const Icon(LucideIcons.chevronDown300, size: 18, color: GcColors.textSub),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SunProgressRing(
            value: s.progress,
            size: 168,
            stroke: 14,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontFamily: GcTheme.font, color: GcColors.text),
                    children: [
                      TextSpan(
                        text: '${s.done}',
                        style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: GcColors.text),
                      ),
                      TextSpan(
                        text: '/${s.total}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: GcColors.textMute),
                      ),
                    ],
                  ),
                ),
                Text(
                  '인증 완료',
                  style: const TextStyle(fontSize: 13, color: GcColors.textSub, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _MiniStat(label: '남은 산', value: '${s.remaining}개'),
              _divider(),
              _MiniStat(label: '최고 높이', value: '${highest}m'),
              _divider(),
              _MiniStat(label: '누적 고도', value: '${(totalHeight / 1000).toStringAsFixed(1)}km'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(width: 1, height: 28, color: GcColors.line);
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 12, color: GcColors.textMute)),
      ],
    ),
  );
}

/// 완등 인증 신청 – 지정 개수 모두 등록 시 활성화
class _ApplyCard extends StatelessWidget {
  const _ApplyCard({required this.s});
  final AppState s;

  @override
  Widget build(BuildContext context) {
    final app = s.application;
    if (app != null) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Panel(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicationStatusScreen())),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: GcColors.surfaceAlt, borderRadius: BorderRadius.circular(14)),
                child: const Icon(LucideIcons.award300, color: GcColors.text),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('완등 인증 신청', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 6),
                        Tag(app.status.label, color: GcColors.forest),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${fmtDate(app.submittedAt)} 신청 · 수령예정 ${fmtDate(app.receiveDate)}',
                      style: const TextStyle(fontSize: 13, color: GcColors.textSub),
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight300, color: GcColors.textMute),
            ],
          ),
        ),
      );
    }

    final enabled = s.isComplete;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: GcColors.surface, borderRadius: BorderRadius.circular(18)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(LucideIcons.award300, color: enabled ? GcColors.text : GcColors.disabled, size: 28),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        enabled ? '완등을 축하합니다!' : '완등 인증서 · 인증물품',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: GcColors.text),
                      ),
                      Text(
                        enabled ? '인증서와 인증물품을 신청할 수 있어요' : '${s.remaining}개 산을 더 인증하면 신청할 수 있어요',
                        style: const TextStyle(fontSize: 13, color: GcColors.textSub),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
              onPressed: enabled
                  ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ApplicationFormScreen()))
                  : null,
              child: Text(enabled ? '완등 인증 신청하기' : '완등 인증 신청 (${s.done}/${s.total})'),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecordTile extends StatelessWidget {
  const _RecordTile({required this.r, required this.index});
  final CertRecord r;
  final int index;

  @override
  Widget build(BuildContext context) {
    final m = mountainById(r.mountainId);
    return Panel(
      padding: const EdgeInsets.all(12),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MountainDetailScreen(mountain: m))),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(width: 72, height: 72, child: MountainImage(mountain: m, seed: 7)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '#$index',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: GcColors.textMute),
                ),
                Text(m.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(LucideIcons.clock300, size: 14, color: GcColors.textMute),
                    const SizedBox(width: 4),
                    Text(
                      '${fmtDateTime(r.takenAt)} (${weekdayKo[r.takenAt.weekday - 1]})',
                      style: const TextStyle(fontSize: 13, color: GcColors.textSub),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight300, color: GcColors.disabled),
        ],
      ),
    );
  }
}
