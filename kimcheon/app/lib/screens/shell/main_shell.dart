import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/gc_colors.dart';
import '../auth/require_verified.dart';
import '../certify/certify_screen.dart';
import '../home/home_screen.dart';
import '../more/more_screen.dart';
import '../mountains/mountain_list_screen.dart';
import '../my/my_cert_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  static void switchTab(BuildContext context, int index) =>
      context.findAncestorStateOfType<_MainShellState>()?._select(index);

  static Future<void> openCertify(BuildContext context, {String? mountainId}) async {
    if (!await requireVerified(context, reason: '인증사진 촬영')) return;
    if (!context.mounted) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(fullscreenDialog: true, builder: (_) => CertifyScreen(initialMountainId: mountainId)));
  }

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _tabs = [
    (LucideIcons.house300, LucideIcons.house400, '홈'),
    (LucideIcons.mountain300, LucideIcons.mountain400, '산 정보'),
    (null, null, '인증'),
    (LucideIcons.medal300, LucideIcons.medal400, '나의 완등'),
    (LucideIcons.menu300, LucideIcons.menu400, '더보기'),
  ];

  void _select(int i) {
    if (i == 2) {
      MainShell.openCertify(context);
      return;
    }
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [HomeScreen(), MountainListScreen(), SizedBox.shrink(), MyCertScreen(), MoreScreen()],
      ),
      bottomNavigationBar: _BottomBar(index: _index, onTap: _select),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.index, required this.onTap});
  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Container(
      height: 66 + bottom,
      padding: EdgeInsets.only(bottom: bottom),
      decoration: const BoxDecoration(
        color: GcColors.surface,
        border: Border(top: BorderSide(color: GcColors.line, width: .8)),
      ),
      child: Row(
        children: [
          for (var i = 0; i < _MainShellState._tabs.length; i++)
            Expanded(
              child: i == 2
                  ? _CertifyItem(onTap: () => onTap(2))
                  : _TabItem(i: i, selected: index == i, onTap: () => onTap(i)),
            ),
        ],
      ),
    );
  }
}

/// 아이콘 영역(30) + 간격(4) + 라벨 – 모든 탭이 같은 기준선에 정렬되도록 공통 사용
class _NavCell extends StatelessWidget {
  const _NavCell({required this.icon, required this.label, required this.onTap, this.selected = false});
  final Widget icon;
  final Widget label;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(height: 32, child: Center(child: icon)),
          const SizedBox(height: 4),
          label,
        ],
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({required this.i, required this.selected, required this.onTap});
  final int i;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = _MainShellState._tabs[i];
    final color = selected ? GcColors.navy : GcColors.textMute;
    return Semantics(
      selected: selected,
      button: true,
      label: t.$3,
      excludeSemantics: true,
      child: _NavCell(
        onTap: onTap,
        selected: selected,
        // 선택 표시: 아이콘 뒤 옅은 알약
        icon: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          width: selected ? 52 : 36,
          height: 30,
          decoration: BoxDecoration(
            color: selected ? GcColors.navy.withValues(alpha: .08) : Colors.transparent,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Icon(selected ? t.$2 : t.$1, color: color, size: 22),
        ),
        label: _Label(t.$3, color: color, bold: selected),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text, {required this.color, this.bold = false});
  final String text;
  final Color color;
  final bool bold;

  @override
  Widget build(BuildContext context) => Text(
    text,
    maxLines: 1,
    style: TextStyle(
      fontSize: 11.5,
      height: 1.2,
      letterSpacing: -0.2,
      fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
      color: color,
    ),
  );
}

/// 가운데 인증 버튼 – 성취색(태양 그라데이션) 원 + 라벨
class _CertifyItem extends StatelessWidget {
  const _CertifyItem({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '정상 인증사진 촬영',
      excludeSemantics: true,
      child: _NavCell(
        onTap: onTap,
        icon: Container(
          width: 40,
          height: 32,
          decoration: BoxDecoration(
            gradient: GcColors.sunGradientH,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: GcColors.sunOrange.withValues(alpha: .25), blurRadius: 8, offset: const Offset(0, 2)),
            ],
          ),
          child: const Icon(LucideIcons.camera300, color: Colors.white, size: 20),
        ),
        label: const _Label('정상 인증', color: GcColors.textSub),
      ),
    );
  }
}
