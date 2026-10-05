import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../theme/gc_theme.dart';
import '../../widgets/common.dart';
import '../../widgets/mountain_art.dart';
import '../../widgets/mountain_image.dart';
import '../tour/nearby_tour_screen.dart';

/// 정상석 인증사진 촬영 · 등록 (SFR-005)
///
/// 1) GPS로 정상석과의 거리 확인 → 반경 내 진입 시 알림 + 카메라 활성화
/// 2) 앱 내 카메라로 촬영 (갤러리 사진 불가)
/// 3) 촬영 일시 · 위치 확인 후 등록
class CertifyScreen extends StatefulWidget {
  const CertifyScreen({super.key, this.initialMountainId});
  final String? initialMountainId;

  /// 인증 가능 반경(m) – 관리자 설정값
  static const radiusM = 50;

  @override
  State<CertifyScreen> createState() => _CertifyScreenState();
}

enum _Step { locate, camera, confirm, done }

class _CertifyScreenState extends State<CertifyScreen> {
  _Step _step = _Step.locate;
  late Mountain _target;
  DateTime? _shotAt;

  @override
  void initState() {
    super.initState();
    final s = AppScope.read(context);
    _target = widget.initialMountainId != null
        ? mountainById(widget.initialMountainId!)
        : (mountains.where((m) => !s.isCertified(m.id) && m.canCertify).toList()..sort(compareByDistance))
                  .firstOrNull ??
              mountains.first;
  }

  int _distanceM(AppState s) => s.simulateAtSummit ? 18 : ((_target.distanceFromMeKm ?? 0) * 1000).round();

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    return switch (_step) {
      _Step.locate => _locate(s),
      _Step.camera => _camera(s),
      _Step.confirm => _confirm(s),
      _Step.done => _done(s),
    };
  }

  // ── 1. 위치 확인 ─────────────────────────────────────────
  Widget _locate(AppState s) {
    final dist = _distanceM(s);
    // 정상석 좌표가 등록되지 않은 봉우리는 위치 판정 불가 → 인증 불가
    final noCoord = !_target.canCertify;
    final inRange = !noCoord && dist <= CertifyScreen.radiusM;
    final already = s.isCertified(_target.id);
    final canShoot = inRange && !already && s.roundActive;

    return Scaffold(
      backgroundColor: GcColors.surface,
      appBar: AppBar(
        title: const Text('정상 인증'),
        leading: IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(LucideIcons.x300), tooltip: '닫기'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // 인증지점 선택
          Material(
            color: GcColors.bg,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: _pickTarget,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(width: 48, height: 48, child: MountainImage(mountain: _target, seed: 1)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '인증지점',
                            style: TextStyle(fontSize: 12, color: GcColors.textMute, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${_target.fullName} 정상석',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    const Text(
                      '변경',
                      style: TextStyle(color: GcColors.navy, fontWeight: FontWeight.w700),
                    ),
                    const Icon(LucideIcons.chevronRight300, color: GcColors.navy),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (inRange && !already) _ArrivalBanner(m: _target) else const SizedBox(height: 0),
          const SizedBox(height: 8),
          Center(
            child: _Radar(distanceM: dist, inRange: inRange, showMe: !noCoord),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              already
                  ? '이미 인증을 완료한 지점입니다'
                  : noCoord
                  ? '정상석 위치 등록 전이에요'
                  : inRange
                  ? '정상석 반경 ${CertifyScreen.radiusM}m 안에 있어요'
                  : '정상석까지 ${dist >= 1000 ? '${(dist / 1000).toStringAsFixed(1)}km' : '${dist}m'} 남았어요',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: GcColors.text),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              already
                  ? '${fmtDateTime(s.recordOf(_target.id)!.takenAt)}에 인증했어요'
                  : noCoord
                  ? '관리자가 정상석 좌표를 등록하면 인증할 수 있어요'
                  : inRange
                  ? '정상석이 잘 보이도록 인증사진을 촬영해 주세요'
                  : '반경 ${CertifyScreen.radiusM}m 이내로 이동하면 카메라가 활성화됩니다',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: GcColors.textSub),
            ),
          ),
          const SizedBox(height: 20),
          const _GuideList(),
        ],
      ),
      bottomNavigationBar: BottomCta(
        top: _DemoSwitch(on: s.simulateAtSummit, onTap: s.toggleSimulateAtSummit),
        child: FilledButton.icon(
          onPressed: canShoot ? () => setState(() => _step = _Step.camera) : null,
          icon: Icon(canShoot ? LucideIcons.camera300 : LucideIcons.lock300),
          label: Text(
            already
                ? '인증 완료된 지점'
                : noCoord
                ? '인증지점 등록 전'
                : (canShoot ? '인증사진 촬영하기' : '정상석 근처에서 촬영 가능'),
          ),
        ),
      ),
    );
  }

  Future<void> _pickTarget() async {
    final s = AppScope.read(context);
    final list = [...mountains]..sort(compareByDistance);
    final picked = await showModalBottomSheet<Mountain>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: .7,
        builder: (_, sc) => ListView(
          controller: sc,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('인증지점 선택', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ),
            for (final m in list)
              ListTile(
                leading: SummitBadge(certified: s.isCertified(m.id), size: 40),
                title: Text(m.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${m.region} · ${m.height}m'),
                trailing: Text(
                  fmtKm(m.distanceFromMeKm),
                  style: const TextStyle(color: GcColors.textSub, fontWeight: FontWeight.w600),
                ),
                onTap: () => Navigator.pop(ctx, m),
              ),
          ],
        ),
      ),
    );
    if (picked != null) setState(() => _target = picked);
  }

  // ── 2. 카메라 ────────────────────────────────────────────
  Widget _camera(AppState s) {
    final top = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.fromLTRB(8, top + 4, 16, 8),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => setState(() => _step = _Step.locate),
                  icon: const Icon(LucideIcons.chevronLeft300, color: Colors.white),
                  tooltip: '뒤로',
                ),
                Expanded(
                  child: Text(
                    _target.fullName,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
                const Tag('GPS 정상', color: Colors.white, icon: LucideIcons.locateFixed300),
              ],
            ),
          ),
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                MountainArt(hue: _target.hue, seed: 7, dusk: false),
                // 촬영 가이드 프레임
                Center(
                  child: FractionallySizedBox(
                    widthFactor: .78,
                    heightFactor: .62,
                    child: CustomPaint(painter: _GuideFramePainter()),
                  ),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  top: 16,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                      child: const Text(
                        '정상석이 프레임 안에 보이도록 촬영하세요',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.fromLTRB(32, 20, 32, 20 + bottom),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 48, child: Icon(LucideIcons.zap300, color: Colors.white70)),
                Semantics(
                  button: true,
                  label: '촬영',
                  child: GestureDetector(
                    onTap: () => setState(() {
                      _shotAt = DateTime.now();
                      _step = _Step.confirm;
                    }),
                    child: Container(
                      width: 76,
                      height: 76,
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                      ),
                      child: const DecoratedBox(
                        decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 48, child: Icon(LucideIcons.switchCamera300, color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. 촬영 확인 · 등록 ─────────────────────────────────
  Widget _confirm(AppState s) {
    final at = _shotAt!;
    final dist = _distanceM(s);
    return Scaffold(
      backgroundColor: GcColors.surface,
      appBar: AppBar(
        title: const Text('인증사진 확인'),
        leading: IconButton(
          onPressed: () => setState(() => _step = _Step.camera),
          icon: const Icon(LucideIcons.arrowLeft300),
          tooltip: '다시 촬영',
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AspectRatio(
            aspectRatio: 3 / 4,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MountainArt(hue: _target.hue, seed: 7),
                  Positioned(
                    left: 14,
                    bottom: 14,
                    child: _PhotoStamp(m: _target, at: at),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: [
                InfoRow(icon: LucideIcons.flag300, label: '인증지점', value: '${_target.fullName} (${_target.height}m)'),
                InfoRow(
                  icon: LucideIcons.calendar300,
                  label: '촬영일시',
                  value: '${fmtDateTime(at)} (${weekdayKo[at.weekday - 1]})',
                ),
                InfoRow(icon: LucideIcons.locateFixed300, label: '촬영위치', value: '정상석으로부터 ${dist}m · 반경 내 확인'),
                InfoRow(icon: LucideIcons.calendarRange300, label: '인증회차', value: s.round.name),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '· 등록한 인증사진은 관리자 검토 과정에서 확인됩니다.\n· 정상석이 식별되지 않는 사진은 인증이 취소될 수 있습니다.',
            style: TextStyle(fontSize: 13, color: GcColors.textMute, height: 1.6),
          ),
        ],
      ),
      bottomNavigationBar: BottomCta(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(onPressed: () => setState(() => _step = _Step.camera), child: const Text('다시 촬영')),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: FilledButton(
                onPressed: () async {
                  final ok = await confirmDialog(
                    context,
                    title: '인증사진을 등록할까요?',
                    message: '${_target.name} 인증사진을 등록합니다.\n등록 후에는 같은 회차에 다시 촬영할 수 없습니다.',
                    ok: '등록',
                  );
                  if (!ok || !mounted) return;
                  s.addRecord(CertRecord(mountainId: _target.id, takenAt: at, distanceM: dist));
                  setState(() => _step = _Step.done);
                },
                child: const Text('인증사진 등록'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 4. 등록 완료 ─────────────────────────────────────────
  Widget _done(AppState s) {
    return Scaffold(
      backgroundColor: GcColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x300),
                  tooltip: '닫기',
                ),
              ),
              const Spacer(),
              SunProgressRing(
                value: s.progress,
                size: 180,
                stroke: 14,
                child: SummitBadge(certified: true, size: 110, label: _target.name),
              ),
              const SizedBox(height: 28),
              Text(
                '${_target.name} 인증 완료!',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.8),
              ),
              const SizedBox(height: 8),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: const TextStyle(fontFamily: GcTheme.font, fontSize: 16, color: GcColors.textSub, height: 1.5),
                  children: [
                    const TextSpan(text: '지금까지 '),
                    TextSpan(
                      text: '${s.done}개',
                      style: const TextStyle(color: GcColors.text, fontWeight: FontWeight.w800),
                    ),
                    TextSpan(text: ' 산을 올랐어요\n'),
                    TextSpan(text: s.isComplete ? '모든 산을 완등했습니다. 인증서를 신청하세요!' : '완등까지 ${s.remaining}개 남았어요'),
                  ],
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(14)),
                child: Row(
                  children: [
                    const Icon(LucideIcons.utensils300, color: GcColors.textSub),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text('하산 후 주변 맛집·숙소를 둘러보세요', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => NearbyTourScreen(mountain: _target)),
                      ),
                      child: const Text('보기'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(onPressed: () => Navigator.pop(context), child: const Text('확인')),
            ],
          ),
        ),
      ),
    );
  }
}

class _ArrivalBanner extends StatelessWidget {
  const _ArrivalBanner({required this.m});
  final Mountain m;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: GcColors.forest.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GcColors.forest.withValues(alpha: .25)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.bellRing300, color: GcColors.forest),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${m.summit.name} 정상에 도착했어요!',
                  style: const TextStyle(color: GcColors.text, fontSize: 15, fontWeight: FontWeight.w800),
                ),
                const Text('지금 인증사진을 촬영할 수 있습니다', style: TextStyle(color: GcColors.textSub, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Radar extends StatelessWidget {
  const _Radar({required this.distanceM, required this.inRange, this.showMe = true});
  final int distanceM;
  final bool inRange;

  /// 정상석 좌표가 없으면 내 위치 점을 표시하지 않음
  final bool showMe;

  @override
  Widget build(BuildContext context) {
    // 거리(로그 스케일) → 반경 위치
    final t = inRange ? .16 : (math.log(distanceM / 50) / math.log(40000 / 50)).clamp(.15, 1.0);
    return SizedBox.square(
      dimension: 240,
      child: Stack(
        alignment: Alignment.center,
        children: [
          for (final r in [1.0, .72, .44])
            Container(
              width: 240 * r,
              height: 240 * r,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (inRange ? GcColors.forest : GcColors.textMute).withValues(alpha: r == .44 ? .12 : .05),
                border: Border.all(color: (inRange ? GcColors.forest : GcColors.textMute).withValues(alpha: .18)),
              ),
            ),
          // 인증 반경
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: GcColors.surface,
              border: Border.all(color: GcColors.text.withValues(alpha: .35), width: 1.5),
            ),
          ),
          const Icon(LucideIcons.flag300, color: GcColors.text, size: 26),
          // 내 위치
          if (showMe)
            Transform.translate(
              offset: Offset(math.cos(-.9) * 110 * t, math.sin(-.9) * 110 * t),
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: GcColors.blue,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [BoxShadow(color: GcColors.blue.withValues(alpha: .4), blurRadius: 10, spreadRadius: 4)],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _GuideList extends StatelessWidget {
  const _GuideList();

  @override
  Widget build(BuildContext context) {
    const items = [
      (LucideIcons.locateFixed300, '휴대폰 위치(GPS)를 켜 주세요. 산 정상에서는 수신이 늦을 수 있어요.'),
      (LucideIcons.camera300, '앱 카메라로 직접 촬영한 사진만 등록할 수 있어요.'),
      (LucideIcons.mountain300, '정상석의 산 이름이 보이도록 촬영해 주세요.'),
    ];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: GcColors.line),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('인증 안내', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          for (final it in items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(it.$1, size: 18, color: GcColors.textSub),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(it.$2, style: const TextStyle(fontSize: 14, height: 1.45, color: GcColors.textSub)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// UI 시안 시연용 토글 (실서비스에서 제거)
class _DemoSwitch extends StatelessWidget {
  const _DemoSwitch({required this.on, required this.onTap});
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: GcColors.bg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: GcColors.line),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.flaskConical300, size: 16, color: GcColors.textMute),
            const SizedBox(width: 6),
            const Expanded(
              child: Text(
                '시연용 · 정상 도착 시뮬레이션',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: GcColors.textSub),
              ),
            ),
            Switch(value: on, onChanged: (_) => onTap(), activeTrackColor: GcColors.navy),
          ],
        ),
      ),
    );
  }
}

class _PhotoStamp extends StatelessWidget {
  const _PhotoStamp({required this.m, required this.at});
  final Mountain m;
  final DateTime at;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: .55), borderRadius: BorderRadius.circular(10)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: const GcSymbol(height: 22),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${m.fullName} ${m.height}m',
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
              ),
              Text(fmtDateTime(at), style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuideFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    const l = 28.0;
    final w = size.width, h = size.height;
    for (final c in [
      [Offset.zero, const Offset(l, 0), const Offset(0, l)],
      [Offset(w, 0), Offset(w - l, 0), const Offset(0, l) + Offset(w, 0)],
      [Offset(0, h), Offset(l, h), Offset(0, h - l)],
      [Offset(w, h), Offset(w - l, h), Offset(w, h - l)],
    ]) {
      canvas
        ..drawLine(c[0], c[1], p)
        ..drawLine(c[0], c[2], p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
