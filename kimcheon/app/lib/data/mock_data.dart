import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'gimcheon_peaks.dart';
import 'peak_photos.dart';
import 'models.dart';

// ─────────────────────────────────────────────────────────────
// UI 시안용 데이터
// - 산·봉우리: 김천 100명산 실제 목록(98개) → gimcheon_peaks.dart
// - 인증기록·관광정보·게시글·사용자: 샘플
// ─────────────────────────────────────────────────────────────

final currentRound = CertRound(
  id: 'r2026',
  name: '2026년 김천 산악 완등 인증',
  start: DateTime(2026, 3, 1),
  end: DateTime(2026, 12, 31),
);

/// 목업 현재 위치 (김천시청)
const mockMyLat = 36.1398, mockMyLng = 128.1136;

double _distanceKm(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  final a =
      math.pow(math.sin(dLat / 2), 2) + math.cos(rad(lat1)) * math.cos(rad(lat2)) * math.pow(math.sin(dLng / 2), 2);
  return 2 * r * math.asin(math.sqrt(a));
}

Mountain _fromPeak(PeakRecord p, int index) {
  final dup = gimcheonPeaks.where((o) => o.name == p.name).length > 1;
  final name = !dup ? p.name : (p.summit != p.name ? '${p.name} ${p.summit}' : '${p.name}(${p.region ?? ''})');
  final region = p.region ?? '김천시';
  final where = RegExp(r'[군시] 경계$').hasMatch(region) ? '김천시와 ${region.replaceAll(' 경계', '')}의 경계' : '김천시 $region';
  final ridge = p.ridge == null ? '' : ' ${p.ridge} 줄기에 속하며,';
  return Mountain(
    id: p.id,
    name: name,
    region: region,
    summit: SummitPoint(name: p.summit, height: p.heightM, lat: p.lat, lng: p.lng),
    alias: p.alias,
    hanja: p.hanja,
    ridge: p.ridge,
    intro:
        '$name${p.hanja != null ? '(${p.hanja})' : ''}은(는) $where에 있는 해발 ${p.heightM}m의 봉우리입니다.$ridge '
        '2020년 김천시가 지정한 「김천 100명산」에 포함되어 있습니다.',
    distanceFromMeKm: p.lat == null ? null : _distanceKm(mockMyLat, mockMyLng, p.lat!, p.lng!),
    source: p.source,
    photo: peakPhotos[p.id],
    hue: 90 + (index * 29) % 140,
  );
}

/// 김천 100명산 (확인된 98개)
final mountains = [for (var i = 0; i < gimcheonPeaks.length; i++) _fromPeak(gimcheonPeaks[i], i)];

Mountain mountainById(String id) => mountains.firstWhere((m) => m.id == id);

/// 거리순 비교 (좌표 없는 봉우리는 뒤로)
int compareByDistance(Mountain a, Mountain b) =>
    (a.distanceFromMeKm ?? double.infinity).compareTo(b.distanceFromMeKm ?? double.infinity);

/// 샘플 사용자 인증 기록
final sampleRecords = <CertRecord>[
  CertRecord(mountainId: 'goseong', takenAt: DateTime(2026, 3, 14, 10, 42), distanceM: 12),
  CertRecord(mountainId: 'dalbong', takenAt: DateTime(2026, 3, 21, 9, 15), distanceM: 7),
  CertRecord(mountainId: 'guhwa', takenAt: DateTime(2026, 3, 28, 16, 40), distanceM: 11),
  CertRecord(mountainId: 'nanham', takenAt: DateTime(2026, 4, 5, 11, 18), distanceM: 8),
  CertRecord(mountainId: 'geumo', takenAt: DateTime(2026, 4, 26, 12, 55), distanceM: 21),
  CertRecord(mountainId: 'mangwol', takenAt: DateTime(2026, 5, 17, 9, 30), distanceM: 15),
  CertRecord(mountainId: 'daedeok', takenAt: DateTime(2026, 7, 12, 13, 21), distanceM: 18),
  CertRecord(mountainId: 'samdo', takenAt: DateTime(2026, 9, 13, 12, 10), distanceM: 27),
  CertRecord(mountainId: 'sudo', takenAt: DateTime(2026, 9, 20, 13, 2), distanceM: 14),
];

const rewards = <Reward>[
  Reward(id: 'cert', name: '완등 인증서 + 인증 배지', desc: '김천시장 명의 인증서와 금속 기념 배지', icon: LucideIcons.award300),
  Reward(id: 'towel', name: '완등 기념 손수건', desc: '김천 심벌 디자인 등산용 쿨 손수건', icon: LucideIcons.shirt300),
  Reward(id: 'grape', name: '김천 샤인머스캣 교환권', desc: '지역 농산물 판매장 사용 (2kg)', icon: LucideIcons.gift300),
  Reward(id: 'stick', name: '등산 스틱', desc: '재고 소진으로 지급 중단', icon: LucideIcons.footprints300, enabled: false),
];

final places = <Place>[
  const Place(
    type: PlaceType.food,
    name: '직지사 산채정식',
    category: '한식 · 산채비빔밥',
    address: '김천시 대항면 직지사길 95',
    phone: '054-436-0000',
    distanceKm: 0.4,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.food,
    name: '황악산 두부마을',
    category: '한식 · 두부요리',
    address: '김천시 대항면 운수리 212',
    phone: '054-436-1111',
    distanceKm: 0.9,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.food,
    name: '대항 지례흑돼지',
    category: '한식 · 흑돼지구이',
    address: '김천시 대항면 향천리 88',
    phone: '054-436-2222',
    distanceKm: 2.1,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.food,
    name: '감천 추어탕',
    category: '한식 · 추어탕',
    address: '김천시 대항면 복전리 31',
    phone: '054-436-3333',
    distanceKm: 3.4,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.stay,
    name: '직지문화모텔',
    category: '모텔',
    address: '김천시 대항면 직지사길 20',
    phone: '054-436-4444',
    distanceKm: 0.7,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.stay,
    name: '황악산 하늘숲 펜션',
    category: '펜션 · 12객실',
    address: '김천시 대항면 운수리 501',
    phone: '054-436-5555',
    distanceKm: 1.8,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.stay,
    name: '직지사 템플스테이',
    category: '템플스테이',
    address: '김천시 대항면 직지사길 95',
    phone: '054-429-1716',
    distanceKm: 0.3,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.tour,
    name: '직지사',
    category: '사찰 · 문화재',
    address: '김천시 대항면 직지사길 95',
    phone: '054-429-1700',
    distanceKm: 0.3,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.tour,
    name: '직지문화공원',
    category: '공원 · 조각공원',
    address: '김천시 대항면 운수리 1570',
    phone: '054-420-6000',
    distanceKm: 0.6,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.tour,
    name: '사명대사공원',
    category: '공원 · 평화의탑',
    address: '김천시 대항면 운수리 1618',
    phone: '054-420-6001',
    distanceKm: 1.1,
    nearMountainId: 'hwangak',
  ),
  const Place(
    type: PlaceType.tour,
    name: '세계도자기박물관',
    category: '박물관',
    address: '김천시 대항면 직지사길 32',
    phone: '054-420-6002',
    distanceKm: 0.8,
    nearMountainId: 'hwangak',
  ),
];

final notices = <Notice>[
  Notice(
    id: 'n1',
    title: '2026년 김천 산악 완등 인증 운영 안내',
    body:
        '2026년 완등 인증 회차가 3월 1일부터 12월 31일까지 운영됩니다.\n\n'
        '• 인증 방법: 앱에서 본인인증 후, 각 산 정상석 반경 50m 이내에서 앱 카메라로 인증사진을 촬영·등록\n'
        '• 완등 기준: 지정된 인증지점 사진을 모두 등록\n'
        '• 완등 혜택: 완등 인증서 및 인증물품 신청 가능\n\n'
        '안전한 산행을 위해 기상 상황을 반드시 확인하시기 바랍니다.',
    date: DateTime(2026, 2, 24),
    views: 3412,
    pinned: true,
  ),
  Notice(
    id: 'n2',
    title: '[안전] 가을철 산불조심기간 입산 통제구역 안내',
    body: '11월 1일부터 12월 15일까지 가을철 산불조심기간으로 일부 등산로의 입산이 통제됩니다. 통제구역 내 인증지점은 기간 동안 인증이 제한될 수 있습니다.',
    date: DateTime(2026, 9, 25),
    views: 842,
    pinned: true,
    category: '안전',
  ),
  Notice(
    id: 'n3',
    title: '인증물품 "등산 스틱" 조기 소진 안내',
    body: '준비된 수량이 모두 소진되어 신청이 마감되었습니다. 다른 인증물품을 선택해 주세요.',
    date: DateTime(2026, 9, 18),
    views: 1203,
  ),
  Notice(
    id: 'n4',
    title: '수도산 등산로 정비공사에 따른 우회 안내 (10.5.~10.30.)',
    body: '수도암 기점 등산로 정비공사로 인해 청암사 기점 코스를 이용해 주시기 바랍니다.',
    date: DateTime(2026, 9, 10),
    views: 655,
    category: '등산로',
  ),
  Notice(
    id: 'n5',
    title: '앱 업데이트 (v1.1) – 인증사진 촬영 안정성 개선',
    body: '일부 기기에서 GPS 수신이 지연되던 현상을 개선했습니다.',
    date: DateTime(2026, 8, 30),
    views: 401,
    category: '앱',
  ),
];

final guestbook = <GuestbookPost>[
  GuestbookPost(
    id: 'g1',
    author: '김*수',
    mountainId: 'samdo',
    body: '세 도가 만나는 삼도봉! 날씨가 맑아서 덕유산까지 선명하게 보였습니다. 정상석 앞에서 바로 인증 완료 👍',
    date: DateTime(2026, 9, 14),
    likes: 42,
    hasPhoto: true,
  ),
  GuestbookPost(
    id: 'g2',
    author: '이*영',
    mountainId: 'hwangak',
    body: '직지사 코스로 올랐어요. 운수봉까지는 완만하고 비로봉 직전이 조금 가파릅니다. 하산 후 산채정식 추천!',
    date: DateTime(2026, 9, 12),
    likes: 31,
    hasPhoto: true,
  ),
  GuestbookPost(
    id: 'g3',
    author: '박*호',
    mountainId: 'goseong',
    body: '시내에서 가까워서 퇴근길에 가볍게 다녀왔습니다. 야경이 예뻐요.',
    date: DateTime(2026, 9, 8),
    likes: 18,
  ),
  GuestbookPost(
    id: 'g4',
    author: '최*진',
    mountainId: 'sudo',
    body: '수도산은 역시 쉽지 않네요. 물 넉넉히 챙기세요. 20번째 인증 달성!',
    date: DateTime(2026, 9, 1),
    likes: 57,
    hasPhoto: true,
  ),
];

const sampleUser = UserProfile(name: '홍길동', birth: '1985.04.12', phone: '010-1234-5678', verifiedBy: '휴대폰 본인인증');

String fmtDate(DateTime d) => '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')}';

String fmtDateTime(DateTime d) =>
    '${fmtDate(d)} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

String fmtKm(double? km) => km == null ? '위치 미등록' : (km < 1 ? '${(km * 1000).round()}m' : '${km.toStringAsFixed(1)}km');

const weekdayKo = ['월', '화', '수', '목', '금', '토', '일'];

Color hueColor(double hue, {double s = .45, double l = .42}) => HSLColor.fromAHSL(1, hue % 360, s, l).toColor();
