import 'package:flutter/widgets.dart';

import 'mock_data.dart';
import 'models.dart';

/// UI 시안용 앱 상태. 기능 개발 단계에서 API/저장소 연동으로 교체한다.
class AppState extends ChangeNotifier {
  AppState() : _records = {for (final r in sampleRecords) r.mountainId: r};

  UserProfile? user;
  final Map<String, CertRecord> _records;
  CertApplication? application;

  /// 시연용: 정상석 반경 진입 여부 시뮬레이션
  bool simulateAtSummit = false;

  bool get isVerified => user != null;
  CertRound get round => currentRound;
  bool get roundActive => round.isActiveAt(DateTime(2026, 9, 30));

  int get total => mountains.length;
  int get done => _records.length;
  int get remaining => total - done;
  double get progress => total == 0 ? 0 : done / total;
  bool get isComplete => done >= total;

  CertRecord? recordOf(String mountainId) => _records[mountainId];
  bool isCertified(String mountainId) => _records.containsKey(mountainId);

  List<CertRecord> get recordsLatestFirst => _records.values.toList()..sort((a, b) => b.takenAt.compareTo(a.takenAt));

  void verify(UserProfile profile) {
    user = profile;
    notifyListeners();
  }

  void logout() {
    user = null;
    notifyListeners();
  }

  void addRecord(CertRecord r) {
    _records[r.mountainId] = r;
    notifyListeners();
  }

  void submitApplication(CertApplication a) {
    application = a;
    notifyListeners();
  }

  void toggleSimulateAtSummit() {
    simulateAtSummit = !simulateAtSummit;
    notifyListeners();
  }

  /// 시연용: 전체 완등 상태로 전환 / 샘플 상태로 복원
  void demoCompleteAll() {
    for (final m in mountains) {
      _records.putIfAbsent(
        m.id,
        () => CertRecord(mountainId: m.id, takenAt: DateTime(2026, 9, 28, 11, 30), distanceM: 10),
      );
    }
    notifyListeners();
  }

  void demoReset() {
    _records
      ..clear()
      ..addAll({for (final r in sampleRecords) r.mountainId: r});
    application = null;
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;

  static AppState read(BuildContext context) => context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
