import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_art.dart';
import '../shell/main_shell.dart';

/// 김천시 본인인증 (휴대폰 / 아이핀) – SFR-004
class VerifyScreen extends StatelessWidget {
  const VerifyScreen({super.key, this.popOnDone = false});

  /// 앱 사용 중 인증이 필요해 진입한 경우 인증 후 이전 화면으로 복귀
  final bool popOnDone;

  void _done(BuildContext context, String method) {
    AppScope.read(
      context,
    ).verify(UserProfile(name: sampleUser.name, birth: sampleUser.birth, phone: sampleUser.phone, verifiedBy: method));
    if (popOnDone) {
      Navigator.of(context).pop(true);
    } else {
      _goHome(context);
    }
  }

  void _goHome(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const MainShell()), (_) => false);
  }

  Future<void> _startVerify(BuildContext context, String method) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _VerifySheet(method: method),
    );
    if (ok == true && context.mounted) _done(context, method);
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          SizedBox(
            height: 300 + top,
            child: MountainArt(
              hue: 205,
              seed: 2,
              horizon: .7,
              child: Padding(
                padding: EdgeInsets.fromLTRB(24, top + 12, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (popOnDone)
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(LucideIcons.x300),
                            tooltip: '닫기',
                          )
                        else
                          const GcLogo(height: 26),
                      ],
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      '정상에 오른 순간,\n김천이 기록합니다',
                      style: TextStyle(
                        fontSize: 28,
                        height: 1.3,
                        fontWeight: FontWeight.w800,
                        color: GcColors.navyDeep,
                        letterSpacing: -1,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('본인인증', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    const Text(
                      '완등 인증 기록 관리와 개인정보 보호를 위해\n김천시 본인인증을 진행합니다.',
                      style: TextStyle(fontSize: 15, color: GcColors.textSub, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: () => _startVerify(context, '휴대폰 본인인증'),
                      icon: const Icon(LucideIcons.smartphone300),
                      label: const Text('휴대폰으로 인증'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () => _startVerify(context, '아이핀(i-PIN) 인증'),
                      icon: const Icon(LucideIcons.idCard300),
                      label: const Text('아이핀(i-PIN)으로 인증'),
                    ),
                    const Spacer(),
                    if (!popOnDone)
                      TextButton(
                        onPressed: () => _goHome(context),
                        child: const Text(
                          '인증 없이 둘러보기',
                          style: TextStyle(color: GcColors.textSub, decoration: TextDecoration.underline),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 본인인증 기관 연동 화면 자리 (실제로는 인증기관 WebView 호출)
class _VerifySheet extends StatefulWidget {
  const _VerifySheet({required this.method});
  final String method;

  @override
  State<_VerifySheet> createState() => _VerifySheetState();
}

class _VerifySheetState extends State<_VerifySheet> {
  bool _agreeAll = false;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + MediaQuery.paddingOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.method, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('인증기관 화면으로 이동하여 본인인증을 진행합니다.', style: TextStyle(color: GcColors.textSub)),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: GcColors.line),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                CheckboxListTile(
                  value: _agreeAll,
                  onChanged: (v) => setState(() => _agreeAll = v ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('필수 약관 전체 동의', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                const Divider(height: 1),
                for (final t in const ['개인정보 수집·이용 동의', '고유식별정보 처리 동의', '본인확인 서비스 이용약관'])
                  ListTile(
                    dense: true,
                    leading: Icon(LucideIcons.check300, color: _agreeAll ? GcColors.navy : GcColors.disabled, size: 20),
                    title: Text('[필수] $t', style: const TextStyle(fontSize: 14)),
                    trailing: const Icon(LucideIcons.chevronRight300, color: GcColors.textMute),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: !_agreeAll || _loading
                ? null
                : () async {
                    setState(() => _loading = true);
                    await Future.delayed(const Duration(milliseconds: 900));
                    if (context.mounted) Navigator.pop(context, true);
                  },
            child: _loading
                ? const SizedBox.square(
                    dimension: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                  )
                : const Text('동의하고 인증하기'),
          ),
        ],
      ),
    );
  }
}
