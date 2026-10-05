import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// 완등 인증 회차 (SFR-009)
class CertRound {
  const CertRound({required this.id, required this.name, required this.start, required this.end});

  final String id;
  final String name;
  final DateTime start;
  final DateTime end;

  bool isActiveAt(DateTime now) => !now.isBefore(start) && !now.isAfter(end);
}

enum Difficulty {
  easy('쉬움'),
  normal('보통'),
  hard('어려움');

  const Difficulty(this.label);
  final String label;
}

/// 등산코스 (SFR-008)
class Course {
  const Course({
    required this.name,
    required this.start,
    required this.distanceKm,
    required this.minutes,
    required this.difficulty,
  });

  final String name;
  final String start;
  final double distanceKm;
  final int minutes;
  final Difficulty difficulty;
}

/// 인증지점 – 봉우리/정상석 (SFR-010)
class SummitPoint {
  const SummitPoint({required this.name, required this.height, this.lat, this.lng});

  final String name;
  final int height;

  /// 좌표 미확보 봉우리는 null – 관리 프로그램(SFR-010)에서 등록 전까지 인증 불가
  final double? lat;
  final double? lng;

  bool get hasCoord => lat != null && lng != null;
}

/// 봉우리 사진 + 저작자 표시 정보 (CC BY 계열은 표시 의무)
class PeakPhoto {
  const PeakPhoto({
    required this.asset,
    required this.author,
    required this.license,
    required this.licenseUrl,
    required this.sourceUrl,
    this.title,
  });

  final String asset;
  final String author;
  final String license;
  final String licenseUrl;
  final String sourceUrl;
  final String? title;

  String get credit => '© $author · $license';
}

class Mountain {
  const Mountain({
    required this.id,
    required this.name,
    required this.region,
    required this.summit,
    required this.intro,
    this.alias,
    this.hanja,
    this.ridge,
    this.courses = const [],
    this.transport,
    this.parking,
    this.distanceFromMeKm,
    this.source,
    this.photo,
    required this.hue,
  });

  final String id;

  /// 화면 표시명 (동명 봉우리는 정상 이름 또는 지역으로 구분)
  final String name;
  final String region;
  final SummitPoint summit;
  final String intro;

  /// 다른 이름
  final String? alias;
  final String? hanja;

  /// 산줄기 (백두대간, 금오지맥 등)
  final String? ridge;

  /// 아래 항목은 관리 프로그램 등록 전까지 비어 있음
  final List<Course> courses;
  final String? transport;
  final String? parking;

  /// 현재 위치로부터의 직선거리 (좌표 없으면 null)
  final double? distanceFromMeKm;

  /// 자료 출처 URL
  final String? source;

  /// 실사진 (없으면 일러스트)
  final PeakPhoto? photo;

  /// 대표 이미지(일러스트) 색조 – 실제 사진 연동 전 임시
  final double hue;

  int get height => summit.height;
  bool get canCertify => summit.hasCoord;

  /// 산 이름 + 정상 이름 (같으면 한 번만) – 예: 황악산 비로봉 / 고성산
  String get fullName => name.endsWith(summit.name) ? name : '$name ${summit.name}';

  /// 소재지 표기 – 예: 김천시 남면 / 김천시·영동군 경계
  String get regionLabel => isOuterBorder ? '김천시·$region' : (region == '김천시' ? region : '김천시 $region');

  /// 다른 시·군과의 경계에 있는 봉우리 (예: 영동군 경계)
  bool get isOuterBorder => RegExp(r'[군시] 경계$').hasMatch(region);
}

/// 인증사진 기록 (SFR-005)
class CertRecord {
  const CertRecord({required this.mountainId, required this.takenAt, required this.distanceM});

  final String mountainId;
  final DateTime takenAt;

  /// 촬영 시 정상석과의 거리(m)
  final int distanceM;
}

/// 인증물품 (SFR-012)
class Reward {
  const Reward({required this.id, required this.name, required this.desc, required this.icon, this.enabled = true});

  final String id;
  final String name;
  final String desc;
  final IconData icon;
  final bool enabled;
}

enum ApplicationStatus {
  applied('신청완료'),
  preparing('지급준비'),
  received('수령완료');

  const ApplicationStatus(this.label);
  final String label;
}

/// 인증서·인증물품 신청서 (SFR-006)
class CertApplication {
  CertApplication({
    required this.name,
    required this.birth,
    required this.phone,
    required this.zipcode,
    required this.address,
    required this.addressDetail,
    required this.receiveDate,
    required this.rewardId,
    required this.submittedAt,
    this.status = ApplicationStatus.applied,
  });

  String name;
  String birth;
  String phone;
  String zipcode;
  String address;
  String addressDetail;
  DateTime receiveDate;
  String rewardId;
  DateTime submittedAt;
  ApplicationStatus status;
}

enum PlaceType {
  food('음식점', LucideIcons.utensils300),
  stay('숙박', LucideIcons.bedDouble300),
  tour('관광지', LucideIcons.camera300);

  const PlaceType(this.label, this.icon);
  final String label;
  final IconData icon;
}

/// 주변 관광정보 (SFR-007) – 김천 문화관광 누리집 연계 데이터
class Place {
  const Place({
    required this.type,
    required this.name,
    required this.category,
    required this.address,
    required this.phone,
    required this.distanceKm,
    required this.nearMountainId,
  });

  final PlaceType type;
  final String name;
  final String category;
  final String address;
  final String phone;
  final double distanceKm;
  final String nearMountainId;
}

class Notice {
  const Notice({
    required this.id,
    required this.title,
    required this.body,
    required this.date,
    required this.views,
    this.pinned = false,
    this.category = '공지',
  });

  final String id;
  final String title;
  final String body;
  final DateTime date;
  final int views;
  final bool pinned;
  final String category;
}

class GuestbookPost {
  const GuestbookPost({
    required this.id,
    required this.author,
    required this.mountainId,
    required this.body,
    required this.date,
    required this.likes,
    this.hasPhoto = false,
  });

  final String id;
  final String author;
  final String mountainId;
  final String body;
  final DateTime date;
  final int likes;
  final bool hasPhoto;
}

class UserProfile {
  const UserProfile({required this.name, required this.birth, required this.phone, required this.verifiedBy});

  final String name;
  final String birth;
  final String phone;
  final String verifiedBy;
}
