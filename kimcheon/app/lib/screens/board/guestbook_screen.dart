import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_art.dart';
import '../auth/require_verified.dart';

/// 방명록 – 본인인증 후 후기 작성 (SFR-008)
class GuestbookScreen extends StatelessWidget {
  const GuestbookScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('방명록')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: GcColors.navy,
        foregroundColor: Colors.white,
        onPressed: () async {
          if (!await requireVerified(context, reason: '방명록 작성')) return;
          if (!context.mounted) return;
          Navigator.push(
            context,
            MaterialPageRoute(fullscreenDialog: true, builder: (_) => const GuestbookWriteScreen()),
          );
        },
        icon: const Icon(LucideIcons.pencil300),
        label: const Text('후기 쓰기', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        itemCount: guestbook.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _PostCard(p: guestbook[i]),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.p});
  final GuestbookPost p;

  @override
  Widget build(BuildContext context) {
    final m = mountainById(p.mountainId);
    return Panel(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: GcColors.surfaceAlt,
                child: Text(
                  p.author.characters.first,
                  style: const TextStyle(color: GcColors.textSub, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.author, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    Text(fmtDate(p.date), style: const TextStyle(fontSize: 12, color: GcColors.textMute)),
                  ],
                ),
              ),
              Tag(m.name, icon: LucideIcons.mountain300),
            ],
          ),
          const SizedBox(height: 12),
          Text(p.body, style: const TextStyle(fontSize: 15, height: 1.6, color: GcColors.text)),
          if (p.hasPhoto) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: MountainArt(hue: m.hue, seed: p.id.hashCode % 5),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              TextButton.icon(
                onPressed: () {},
                style: TextButton.styleFrom(foregroundColor: GcColors.textSub, padding: EdgeInsets.zero),
                icon: const Icon(LucideIcons.heart300, size: 18),
                label: Text('${p.likes}'),
              ),
              const Spacer(),
              IconButton(
                onPressed: () {},
                tooltip: '신고',
                icon: const Icon(LucideIcons.ellipsis300, color: GcColors.textMute),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class GuestbookWriteScreen extends StatefulWidget {
  const GuestbookWriteScreen({super.key});

  @override
  State<GuestbookWriteScreen> createState() => _GuestbookWriteScreenState();
}

class _GuestbookWriteScreenState extends State<GuestbookWriteScreen> {
  final _body = TextEditingController();
  String? _mountainId;

  @override
  void dispose() {
    _body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final certified = mountains.where((m) => s.isCertified(m.id)).toList();
    final canSubmit = _mountainId != null && _body.text.trim().length >= 10;

    return Scaffold(
      backgroundColor: GcColors.surface,
      appBar: AppBar(
        title: const Text('후기 쓰기'),
        leading: IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(LucideIcons.x300), tooltip: '닫기'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('다녀온 산', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final m in certified)
                ChoiceChip(
                  label: Text(m.name),
                  selected: _mountainId == m.id,
                  labelStyle: TextStyle(
                    color: _mountainId == m.id ? Colors.white : GcColors.textSub,
                    fontWeight: FontWeight.w600,
                  ),
                  onSelected: (_) => setState(() => _mountainId = m.id),
                ),
            ],
          ),
          const SizedBox(height: 6),
          const Text('인증을 완료한 산만 선택할 수 있어요', style: TextStyle(fontSize: 12, color: GcColors.textMute)),
          const SizedBox(height: 20),
          const Text('후기', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextField(
            controller: _body,
            onChanged: (_) => setState(() {}),
            maxLines: 8,
            maxLength: 500,
            decoration: const InputDecoration(hintText: '등산로 상태, 풍경, 팁 등을 자유롭게 남겨주세요 (10자 이상)'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () {},
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            icon: const Icon(LucideIcons.imagePlus300),
            label: const Text('사진 첨부 (최대 3장)'),
          ),
          const SizedBox(height: 16),
          const Text(
            '· 개인정보(연락처, 주민번호 등)가 포함된 글은 자동으로 차단됩니다.\n· 욕설, 비방, 광고성 게시물은 관리자에 의해 삭제될 수 있습니다.',
            style: TextStyle(fontSize: 13, color: GcColors.textMute, height: 1.6),
          ),
        ],
      ),
      bottomNavigationBar: BottomCta(
        child: FilledButton(
          onPressed: canSubmit
              ? () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('후기가 등록되었습니다.')));
                }
              : null,
          child: const Text('등록하기'),
        ),
      ),
    );
  }
}
