import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';

/// 공지사항 게시판 (SFR-008)
class NoticeScreen extends StatefulWidget {
  const NoticeScreen({super.key});

  @override
  State<NoticeScreen> createState() => _NoticeScreenState();
}

class _NoticeScreenState extends State<NoticeScreen> {
  String _cat = '전체';

  @override
  Widget build(BuildContext context) {
    final cats = [
      '전체',
      ...{for (final n in notices) n.category},
    ];
    final list = notices.where((n) => _cat == '전체' || n.category == _cat).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('공지사항')),
      body: Column(
        children: [
          Container(
            color: GcColors.surface,
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                for (final c in cats)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(c),
                      selected: _cat == c,
                      labelStyle: TextStyle(
                        color: _cat == c ? Colors.white : GcColors.textSub,
                        fontWeight: FontWeight.w600,
                      ),
                      onSelected: (_) => setState(() => _cat = c),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(indent: 20, endIndent: 20),
              itemBuilder: (_, i) {
                final n = list[i];
                return Material(
                  color: n.pinned ? const Color(0xFFF7F9FD) : GcColors.surface,
                  child: InkWell(
                    onTap: () =>
                        Navigator.push(context, MaterialPageRoute(builder: (_) => NoticeDetailScreen(notice: n))),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (n.pinned) ...[
                                const Icon(LucideIcons.pin300, size: 14, color: GcColors.textSub),
                                const SizedBox(width: 4),
                              ],
                              Tag(n.category, color: n.category == '안전' ? GcColors.error : GcColors.textSub),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(n.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4)),
                          const SizedBox(height: 6),
                          Text(
                            '${fmtDate(n.date)} · 조회 ${n.views}',
                            style: const TextStyle(fontSize: 13, color: GcColors.textMute),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class NoticeDetailScreen extends StatelessWidget {
  const NoticeDetailScreen({super.key, required this.notice});
  final Notice notice;

  @override
  Widget build(BuildContext context) {
    final n = notice;
    return Scaffold(
      backgroundColor: GcColors.surface,
      appBar: AppBar(title: const Text('공지사항')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Tag(n.category, color: n.category == '안전' ? GcColors.error : GcColors.textSub),
          const SizedBox(height: 10),
          Text(
            n.title,
            style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800, height: 1.4, letterSpacing: -0.5),
          ),
          const SizedBox(height: 10),
          Text(
            '김천시 산림과 · ${fmtDate(n.date)} · 조회 ${n.views}',
            style: const TextStyle(fontSize: 13, color: GcColors.textMute),
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider()),
          Text(n.body, style: const TextStyle(fontSize: 16, height: 1.8, color: GcColors.text)),
        ],
      ),
    );
  }
}
