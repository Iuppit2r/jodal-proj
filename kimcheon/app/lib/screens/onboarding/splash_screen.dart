import 'package:flutter/material.dart';

import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import 'permission_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 500),
          pageBuilder: (_, a, __) => FadeTransition(opacity: a, child: const PermissionScreen()),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Spacer(flex: 3),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutBack,
              builder: (_, v, child) => Opacity(
                opacity: v.clamp(0, 1),
                child: Transform.translate(offset: Offset(0, 16 * (1 - v)), child: child),
              ),
              child: const Center(child: GcSymbol(height: 96)),
            ),
            const SizedBox(height: 28),
            const Text(
              '김천 산악 완등',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: GcColors.navy, letterSpacing: -1),
            ),
            const SizedBox(height: 8),
            const Text(
              '정상에서 남기는 나의 김천 산행 기록',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: GcColors.textSub, fontWeight: FontWeight.w500),
            ),
            const Spacer(flex: 4),
            Center(
              child: Image.asset(
                'assets/brand/slogan_central_gimcheon.png',
                height: 44,
                semanticLabel: 'Central Gimcheon',
              ),
            ),
            const SizedBox(height: 14),
            const Center(child: GcLogo(height: 26)),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }
}
