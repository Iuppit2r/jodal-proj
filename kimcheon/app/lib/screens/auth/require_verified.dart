import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../theme/gc_colors.dart';
import 'verify_screen.dart';

/// 본인인증이 필요한 기능 진입 전 호출. 인증되어 있으면 true.
Future<bool> requireVerified(BuildContext context, {String reason = '이 기능'}) async {
  final state = AppScope.read(context);
  if (state.isVerified) return true;

  final go = await showModalBottomSheet<bool>(
    context: context,
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + MediaQuery.paddingOf(ctx).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: GcColors.navy.withValues(alpha: .08), shape: BoxShape.circle),
            child: const Icon(LucideIcons.shieldCheck300, color: GcColors.navy, size: 28),
          ),
          const SizedBox(height: 16),
          const Text(
            '본인인증이 필요해요',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            '$reason은(는) 김천시 본인인증 후 이용할 수 있습니다.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: GcColors.textSub),
          ),
          const SizedBox(height: 24),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('본인인증 하기')),
          const SizedBox(height: 4),
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('다음에 할게요')),
        ],
      ),
    ),
  );
  if (go != true || !context.mounted) return false;
  final ok = await Navigator.of(
    context,
  ).push<bool>(MaterialPageRoute(fullscreenDialog: true, builder: (_) => const VerifyScreen(popOnDone: true)));
  return ok == true;
}
