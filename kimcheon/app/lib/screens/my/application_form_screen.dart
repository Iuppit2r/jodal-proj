import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/app_state.dart';
import '../../data/mock_data.dart';
import '../../data/models.dart';
import '../../theme/gc_colors.dart';
import '../../widgets/common.dart';
import 'application_status_screen.dart';

/// 완등 인증서 · 인증물품 신청서 (SFR-006)
class ApplicationFormScreen extends StatefulWidget {
  const ApplicationFormScreen({super.key, this.editing});

  /// 제출한 신청서 수정 시
  final CertApplication? editing;

  @override
  State<ApplicationFormScreen> createState() => _ApplicationFormScreenState();
}

class _ApplicationFormScreenState extends State<ApplicationFormScreen> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController();
  late final _birth = TextEditingController();
  late final _phone = TextEditingController();
  late final _zip = TextEditingController();
  late final _addr = TextEditingController();
  late final _addrDetail = TextEditingController();
  DateTime? _receiveDate;
  String? _rewardId;
  bool? _agree;
  bool _tried = false;

  List<Reward> get _activeRewards => rewards.where((r) => r.enabled).toList();

  @override
  void initState() {
    super.initState();
    final e = widget.editing;
    final user = AppScope.read(context).user;
    _name.text = e?.name ?? user?.name ?? '';
    _birth.text = e?.birth ?? user?.birth ?? '';
    _phone.text = e?.phone ?? user?.phone ?? '';
    _zip.text = e?.zipcode ?? '';
    _addr.text = e?.address ?? '';
    _addrDetail.text = e?.addressDetail ?? '';
    _receiveDate = e?.receiveDate;
    _rewardId = e?.rewardId;
    _agree = e == null ? null : true;
    for (final c in [_name, _birth, _phone, _zip, _addr, _addrDetail]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _birth, _phone, _zip, _addr, _addrDetail]) {
      c.dispose();
    }
    super.dispose();
  }

  bool get _filled =>
      _name.text.trim().isNotEmpty &&
      _birth.text.trim().isNotEmpty &&
      _phone.text.trim().isNotEmpty &&
      _zip.text.isNotEmpty &&
      _addrDetail.text.trim().isNotEmpty &&
      _receiveDate != null &&
      _rewardId != null &&
      _agree == true;

  Future<void> _submit() async {
    setState(() => _tried = true);
    if (!_form.currentState!.validate() || !_filled) return;
    final editing = widget.editing != null;
    final ok = await confirmDialog(
      context,
      title: editing ? '신청 내용을 수정할까요?' : '완등 인증을 신청할까요?',
      message: '입력하신 정보로 ${editing ? '신청 내용이 수정' : '인증서 및 인증물품 신청이 접수'}됩니다.',
      ok: editing ? '수정' : '신청',
    );
    if (!ok || !mounted) return;

    final s = AppScope.read(context);
    s.submitApplication(
      CertApplication(
        name: _name.text.trim(),
        birth: _birth.text.trim(),
        phone: _phone.text.trim(),
        zipcode: _zip.text,
        address: _addr.text,
        addressDetail: _addrDetail.text.trim(),
        receiveDate: _receiveDate!,
        rewardId: _rewardId!,
        submittedAt: widget.editing?.submittedAt ?? DateTime.now(),
        status: widget.editing?.status ?? ApplicationStatus.applied,
      ),
    );
    if (editing) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('신청 내용이 수정되었습니다.')));
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ApplicationStatusScreen(justSubmitted: true)),
      );
    }
  }

  Future<void> _searchAddress() async {
    // 실서비스: 행정안전부 도로명주소 API 연동
    final picked = await showModalBottomSheet<(String, String)>(
      context: context,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('주소 검색', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(hintText: '도로명, 건물명 또는 지번 입력', prefixIcon: Icon(LucideIcons.search300)),
            ),
            const SizedBox(height: 8),
            for (final a in const [
              ('39520', '경상북도 김천시 시청1길 1 (신음동, 김천시청)'),
              ('39660', '경상북도 김천시 혁신8로 23 (율곡동)'),
              ('39532', '경상북도 김천시 김천로 111 (평화동)'),
            ])
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(a.$2, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                subtitle: Text('우편번호 ${a.$1}'),
                onTap: () => Navigator.pop(ctx, a),
              ),
          ],
        ),
      ),
    );
    if (picked != null) {
      _zip.text = picked.$1;
      _addr.text = picked.$2;
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime(2026, 9, 30);
    final d = await showDatePicker(
      context: context,
      initialDate: _receiveDate ?? now.add(const Duration(days: 7)),
      firstDate: now.add(const Duration(days: 3)),
      lastDate: DateTime(2027, 1, 31),
      helpText: '수령 희망일 선택',
      selectableDayPredicate: (d) => d.weekday < 6,
    );
    if (d != null) setState(() => _receiveDate = d);
  }

  String? _req(String? v, String label) => (v == null || v.trim().isEmpty) ? '$label을(를) 입력해 주세요' : null;

  @override
  Widget build(BuildContext context) {
    final editing = widget.editing != null;
    return Scaffold(
      backgroundColor: GcColors.surface,
      appBar: AppBar(title: Text(editing ? '신청 내용 수정' : '완등 인증 신청')),
      body: Form(
        key: _form,
        autovalidateMode: _tried ? AutovalidateMode.onUserInteraction : AutovalidateMode.disabled,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            if (!editing) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: [
                    const Icon(LucideIcons.trophy300, color: GcColors.text, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${AppScope.read(context).round.name}\n${mountains.length}개 산 완등을 축하합니다!',
                        style: const TextStyle(
                          color: GcColors.text,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
            const _Legend(),
            _Section('신청자 정보'),
            _Label('이름', required: true),
            TextFormField(
              controller: _name,
              validator: (v) => _req(v, '이름'),
              decoration: const InputDecoration(hintText: '이름'),
            ),
            _Label('생년월일', required: true),
            TextFormField(
              controller: _birth,
              keyboardType: TextInputType.datetime,
              validator: (v) {
                final r = _req(v, '생년월일');
                if (r != null) return r;
                return RegExp(r'^\d{4}\.\d{2}\.\d{2}$').hasMatch(v!.trim()) ? null : 'YYYY.MM.DD 형식으로 입력해 주세요';
              },
              decoration: const InputDecoration(hintText: '예) 1985.04.12'),
            ),
            _Label('휴대전화', required: true),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              validator: (v) {
                final r = _req(v, '휴대전화 번호');
                if (r != null) return r;
                return RegExp(r'^01[016789]-?\d{3,4}-?\d{4}$').hasMatch(v!.trim()) ? null : '휴대전화 번호 형식이 올바르지 않습니다';
              },
              decoration: const InputDecoration(hintText: '010-0000-0000'),
            ),
            _Label('주소', required: true, help: '인증물품 우편 발송 시 사용됩니다'),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _zip,
                    readOnly: true,
                    onTap: _searchAddress,
                    validator: (v) => (v == null || v.isEmpty) ? '주소를 검색해 주세요' : null,
                    decoration: const InputDecoration(hintText: '우편번호'),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 54,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(96, 54)),
                    onPressed: _searchAddress,
                    child: const Text('주소 검색'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _addr,
              readOnly: true,
              onTap: _searchAddress,
              decoration: const InputDecoration(hintText: '기본주소'),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _addrDetail,
              validator: (v) => _req(v, '상세주소'),
              decoration: const InputDecoration(hintText: '상세주소 입력'),
            ),

            _Section('인증물품 선택'),
            _Label('인증물품', required: true, help: '1인 1개 선택 가능'),
            for (final r in _activeRewards)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _RewardOption(
                  reward: r,
                  selected: _rewardId == r.id,
                  onTap: () => setState(() => _rewardId = r.id),
                ),
              ),
            if (_tried && _rewardId == null) const _ErrorText('인증물품을 선택해 주세요'),
            _Label('수령 희망일', required: true, help: '평일만 선택 가능 · 김천시청 산림과 방문 수령'),
            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(12),
              child: InputDecorator(
                isEmpty: _receiveDate == null,
                decoration: InputDecoration(
                  hintText: '날짜 선택',
                  suffixIcon: const Icon(LucideIcons.calendarDays300),
                  errorText: _tried && _receiveDate == null ? '수령 희망일을 선택해 주세요' : null,
                ),
                child: _receiveDate == null
                    ? null
                    : Text(
                        '${fmtDate(_receiveDate!)} (${weekdayKo[_receiveDate!.weekday - 1]})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),

            _Section('개인정보 수집·이용 동의'),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: GcColors.bg, borderRadius: BorderRadius.circular(12)),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ConsentRow('수집 목적', '완등 인증서 발급 및 인증물품 지급'),
                  _ConsentRow('수집 항목', '이름, 생년월일, 휴대전화 번호, 주소'),
                  _ConsentRow('보유 기간', '인증 회차 종료 후 1년 (이후 즉시 파기)'),
                  SizedBox(height: 6),
                  Text(
                    '귀하는 개인정보 수집·이용에 동의하지 않을 권리가 있으며, 동의하지 않을 경우 신청이 제한됩니다.',
                    style: TextStyle(fontSize: 13, color: GcColors.textSub, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _AgreeOption(
                    label: '동의함',
                    selected: _agree == true,
                    onTap: () => setState(() => _agree = true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _AgreeOption(
                    label: '동의하지 않음',
                    selected: _agree == false,
                    onTap: () => setState(() => _agree = false),
                  ),
                ),
              ],
            ),
            if (_agree == false) const _ErrorText('개인정보 수집·이용에 동의하지 않으면 신청서를 제출할 수 없습니다.'),
            if (_tried && _agree == null) const _ErrorText('개인정보 수집·이용 동의 여부를 선택해 주세요'),
          ],
        ),
      ),
      bottomNavigationBar: BottomCta(
        child: FilledButton(
          // 필수 항목 미완성 시 비활성 스타일로 표시하되, 누르면 누락 항목을 안내한다.
          // 개인정보 '동의하지 않음' 선택 시에는 제출 불가.
          onPressed: _agree == false ? null : _submit,
          style: _filled ? null : FilledButton.styleFrom(backgroundColor: GcColors.disabled),
          child: Text(editing ? '수정 완료' : '제출하기'),
        ),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.only(top: 8),
    child: Align(
      alignment: Alignment.centerRight,
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: '* ',
              style: TextStyle(color: GcColors.error, fontWeight: FontWeight.w700),
            ),
            TextSpan(text: '필수 입력 항목'),
          ],
        ),
        style: TextStyle(fontSize: 12, color: GcColors.textMute),
      ),
    ),
  );
}

class _Section extends StatelessWidget {
  const _Section(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 24, bottom: 4),
    child: Semantics(
      header: true,
      child: Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
    ),
  );
}

class _Label extends StatelessWidget {
  const _Label(this.text, {this.required = false, this.help});
  final String text;
  final bool required;
  final String? help;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 16, bottom: 8),
    child: Row(
      children: [
        Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        if (required)
          const Text(
            ' *',
            style: TextStyle(color: GcColors.error, fontWeight: FontWeight.w700),
          ),
        if (help != null) ...[
          const SizedBox(width: 8),
          Flexible(
            child: Text(help!, style: const TextStyle(fontSize: 12, color: GcColors.textMute)),
          ),
        ],
      ],
    ),
  );
}

class _ErrorText extends StatelessWidget {
  const _ErrorText(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 6, left: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(LucideIcons.circleAlert300, size: 16, color: GcColors.error),
        const SizedBox(width: 4),
        Expanded(
          child: Text(text, style: const TextStyle(fontSize: 13, color: GcColors.error)),
        ),
      ],
    ),
  );
}

class _ConsentRow extends StatelessWidget {
  const _ConsentRow(this.k, this.v);
  final String k;
  final String v;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(k, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        ),
        Expanded(
          child: Text(v, style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
        ),
      ],
    ),
  );
}

class _RewardOption extends StatelessWidget {
  const _RewardOption({required this.reward, required this.selected, required this.onTap});
  final Reward reward;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected ? GcColors.navy.withValues(alpha: .05) : GcColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? GcColors.navy : GcColors.line, width: selected ? 1.6 : 1),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: GcColors.surfaceAlt, borderRadius: BorderRadius.circular(12)),
                child: Icon(reward.icon, color: GcColors.textSub),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(reward.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    Text(reward.desc, style: const TextStyle(fontSize: 13, color: GcColors.textSub)),
                  ],
                ),
              ),
              Icon(
                selected ? LucideIcons.circleDot300 : LucideIcons.circle300,
                color: selected ? GcColors.navy : GcColors.disabled,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AgreeOption extends StatelessWidget {
  const _AgreeOption({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Container(
      height: 50,
      decoration: BoxDecoration(
        color: selected ? GcColors.navy.withValues(alpha: .05) : GcColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: selected ? GcColors.navy : GcColors.line, width: selected ? 1.6 : 1),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            selected ? LucideIcons.circleDot300 : LucideIcons.circle300,
            size: 20,
            color: selected ? GcColors.navy : GcColors.disabled,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: selected ? GcColors.navy : GcColors.textSub,
            ),
          ),
        ],
      ),
    ),
  );
}
