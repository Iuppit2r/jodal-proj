import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../../widgets/map_placeholder.dart';
import '../../widgets/mountain_image.dart';
import 'mountain_detail_screen.dart';

enum _Filter { all, todo, done }

enum _Sort {
  near('가까운순'),
  high('높은순'),
  name('이름순');

  const _Sort(this.label);
  final String label;
}

/// 완등 인증이 가능한 산 목록 (SFR-005, SFR-008)
class MountainListScreen extends StatefulWidget {
  const MountainListScreen({super.key});

  @override
  State<MountainListScreen> createState() => _MountainListScreenState();
}

class _MountainListScreenState extends State<MountainListScreen> {
  _Filter _filter = _Filter.all;
  _Sort _sort = _Sort.near;
  bool _mapView = false;
  String _query = '';
  String? _selectedId;

  List<Mountain> _items(AppState s) {
    final list = mountains.where((m) {
      if (_query.isNotEmpty && !m.name.contains(_query) && !m.region.contains(_query)) return false;
      return switch (_filter) {
        _Filter.all => true,
        _Filter.todo => !s.isCertified(m.id),
        _Filter.done => s.isCertified(m.id),
      };
    }).toList();
    list.sort(switch (_sort) {
      _Sort.near => compareByDistance,
      _Sort.high => (a, b) => b.height.compareTo(a.height),
      _Sort.name => (a, b) => a.name.compareTo(b.name),
    });
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final items = _items(s);

    return Scaffold(
      appBar: AppBar(
        title: const Text('산 정보'),
        actions: [
          IconButton(
            tooltip: _mapView ? '목록으로 보기' : '지도로 보기',
            onPressed: () => setState(() => _mapView = !_mapView),
            icon: Icon(_mapView ? LucideIcons.list300 : LucideIcons.map300),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: GcColors.surface,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() => _query = v.trim()),
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: '산 이름 또는 지역(읍·면·동) 검색',
                    prefixIcon: const Icon(LucideIcons.search300, color: GcColors.textMute),
                    fillColor: GcColors.bg,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    for (final f in _Filter.values) ...[
                      ChoiceChip(
                        label: Text(switch (f) {
                          _Filter.all => '전체 ${mountains.length}',
                          _Filter.todo => '미인증 ${s.remaining}',
                          _Filter.done => '인증완료 ${s.done}',
                        }),
                        selected: _filter == f,
                        labelStyle: TextStyle(
                          color: _filter == f ? Colors.white : GcColors.textSub,
                          fontWeight: FontWeight.w600,
                        ),
                        onSelected: (_) => setState(() => _filter = f),
                      ),
                      const SizedBox(width: 6),
                    ],
                    const Spacer(),
                    PopupMenuButton<_Sort>(
                      initialValue: _sort,
                      onSelected: (v) => setState(() => _sort = v),
                      itemBuilder: (_) => [for (final v in _Sort.values) PopupMenuItem(value: v, child: Text(v.label))],
                      child: Row(
                        children: [
                          Text(
                            _sort.label,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: GcColors.textSub),
                          ),
                          const Icon(LucideIcons.chevronDown300, size: 20, color: GcColors.textSub),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: items.isEmpty
                ? const _Empty()
                : _mapView
                ? _MapView(items: items, selectedId: _selectedId, onSelect: (m) => setState(() => _selectedId = m.id))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => MountainTile(m: items[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

class MountainTile extends StatelessWidget {
  const MountainTile({super.key, required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final rec = s.recordOf(m.id);
    return Panel(
      padding: const EdgeInsets.all(12),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MountainDetailScreen(mountain: m))),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 84,
              height: 84,
              child: MountainImage(mountain: m, showSun: rec != null),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        m.name,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${m.height}m',
                      style: const TextStyle(fontSize: 14, color: GcColors.textSub, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  m.summit.name == m.name ? m.region : '${m.region} · 정상 ${m.summit.name}',
                  style: const TextStyle(fontSize: 13, color: GcColors.textMute),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    CertifiedTag(certified: rec != null),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Align(alignment: Alignment.centerLeft, child: m.ridge == null ? null : Tag(m.ridge!)),
                    ),
                    const SizedBox(width: 6),
                    const Icon(LucideIcons.navigation300, size: 14, color: GcColors.textMute),
                    const SizedBox(width: 2),
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
    );
  }
}

class _MapView extends StatelessWidget {
  const _MapView({required this.items, required this.selectedId, required this.onSelect});
  final List<Mountain> items;
  final String? selectedId;
  final ValueChanged<Mountain> onSelect;

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final selected = items.where((m) => m.id == selectedId).firstOrNull ?? items.first;
    return Stack(
      children: [
        Positioned.fill(
          child: MapPlaceholder(
            mountains: items,
            isCertified: s.isCertified,
            selectedId: selected.id,
            onTapMountain: onSelect,
          ),
        ),
        Positioned(
          right: 16,
          top: 16,
          child: Column(
            children: [
              _MapBtn(icon: LucideIcons.locateFixed300, tooltip: '내 위치'),
              const SizedBox(height: 8),
              _MapBtn(icon: LucideIcons.layers300, tooltip: '지도 유형'),
            ],
          ),
        ),
        Positioned(left: 16, right: 16, bottom: 16, child: MountainTile(m: selected)),
      ],
    );
  }
}

class _MapBtn extends StatelessWidget {
  const _MapBtn({required this.icon, required this.tooltip});
  final IconData icon;
  final String tooltip;

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: const CircleBorder(),
    elevation: 2,
    child: IconButton(
      onPressed: () {},
      tooltip: tooltip,
      icon: Icon(icon, color: GcColors.text),
    ),
  );
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) => const Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.searchX300, size: 48, color: GcColors.disabled),
        SizedBox(height: 12),
        Text(
          '검색 결과가 없습니다',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: GcColors.textSub),
        ),
        SizedBox(height: 4),
        Text('산 이름이나 읍·면·동 이름으로 검색해 보세요', style: TextStyle(fontSize: 14, color: GcColors.textMute)),
      ],
    ),
  );
}
