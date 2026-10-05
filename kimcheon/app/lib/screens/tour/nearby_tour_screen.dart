import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';

/// 완등 지점 주변 음식점 · 숙박 · 관광지 (SFR-007)
/// 데이터 출처: 김천 문화관광 누리집 연계
class NearbyTourScreen extends StatefulWidget {
  const NearbyTourScreen({super.key, this.mountain});
  final Mountain? mountain;

  @override
  State<NearbyTourScreen> createState() => _NearbyTourScreenState();
}

class _NearbyTourScreenState extends State<NearbyTourScreen> {
  static const _radii = [1.0, 3.0, 5.0];
  double _radius = 3;
  late Mountain _base = widget.mountain ?? mountainById('hwangak');

  Future<void> _pickBase() async {
    final picked = await showModalBottomSheet<Mountain>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: .6,
        builder: (_, sc) => ListView(
          controller: sc,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('기준 인증지점 선택', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ),
            for (final m in mountains)
              ListTile(
                title: Text(m.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${m.regionLabel} · ${m.height}m'),
                trailing: m.id == _base.id ? const Icon(LucideIcons.check300, color: GcColors.navy) : null,
                onTap: () => Navigator.pop(ctx, m),
              ),
          ],
        ),
      ),
    );
    if (picked != null) setState(() => _base = picked);
  }

  @override
  Widget build(BuildContext context) {
    // 샘플 데이터는 황악산 주변만 존재 → 다른 산 선택 시에도 동일 목록 노출
    final all = places.where((p) => p.distanceKm <= _radius).toList()
      ..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));

    return DefaultTabController(
      length: PlaceType.values.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('주변 관광정보'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(140),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Material(
                    color: GcColors.bg,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: _pickBase,
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.flag300, size: 18, color: GcColors.textSub),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                _base.fullName,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                            ),
                            const Text(' 기준', style: TextStyle(fontSize: 16, color: GcColors.textSub)),
                            const Spacer(),
                            const Text(
                              '변경',
                              style: TextStyle(fontSize: 14, color: GcColors.navy, fontWeight: FontWeight.w700),
                            ),
                            const Icon(LucideIcons.chevronDown300, color: GcColors.navy, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 16, 4),
                  child: Row(
                    children: [
                      const Text(
                        '반경',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: GcColors.textSub),
                      ),
                      const SizedBox(width: 4),
                      for (final r in _radii)
                        Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: ChoiceChip(
                            visualDensity: VisualDensity.compact,
                            label: Text('${r.toInt()}km'),
                            selected: _radius == r,
                            labelStyle: TextStyle(
                              color: _radius == r ? Colors.white : GcColors.textSub,
                              fontWeight: FontWeight.w600,
                            ),
                            onSelected: (_) => setState(() => _radius = r),
                          ),
                        ),
                    ],
                  ),
                ),
                TabBar(
                  tabs: [
                    for (final t in PlaceType.values) Tab(text: '${t.label} ${all.where((p) => p.type == t).length}'),
                  ],
                ),
              ],
            ),
          ),
        ),
        body: TabBarView(
          children: [
            for (final t in PlaceType.values)
              Builder(
                builder: (_) {
                  final list = all.where((p) => p.type == t).toList();
                  if (list.isEmpty) {
                    return Center(
                      child: Text(
                        '반경 ${_radius.toInt()}km 내 ${t.label} 정보가 없습니다',
                        style: const TextStyle(color: GcColors.textMute),
                      ),
                    );
                  }
                  return ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      for (final p in list) ...[PlaceTile(place: p), const SizedBox(height: 10)],
                      const SizedBox(height: 8),
                      const Text(
                        '자료제공: 김천시 문화관광 누리집',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: GcColors.textMute),
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class PlaceTile extends StatelessWidget {
  const PlaceTile({super.key, required this.place, this.dense = false});
  final Place place;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final p = place;
    return Container(
      margin: dense ? const EdgeInsets.only(bottom: 8) : EdgeInsets.zero,
      decoration: BoxDecoration(
        color: GcColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GcColors.line),
      ),
      padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: GcColors.surfaceAlt, borderRadius: BorderRadius.circular(12)),
            child: Icon(p.type.icon, color: GcColors.textSub),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        p.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Tag(fmtKm(p.distanceKm)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(p.category, style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                if (!dense) ...[
                  const SizedBox(height: 4),
                  Text(p.address, style: const TextStyle(fontSize: 13, color: GcColors.textMute)),
                  Text(p.phone, style: const TextStyle(fontSize: 13, color: GcColors.textMute)),
                ],
              ],
            ),
          ),
          IconButton(
            onPressed: () {},
            tooltip: '${p.name} 전화걸기',
            icon: const Icon(LucideIcons.phone300, color: GcColors.textSub),
          ),
        ],
      ),
    );
  }
}
