import '../core/formatters.dart';

/// A row from `/notifications/:phone` or `/get-user-notifications`.
class NotificationItem {
  NotificationItem(this.raw);

  final Map<String, dynamic> raw;

  factory NotificationItem.fromJson(Map<String, dynamic> json) =>
      NotificationItem(json);

  String get id => raw['_id']?.toString() ?? '';
  String get message => raw['message']?.toString() ?? '';
  String? get ppcId {
    final v = raw['ppcId']?.toString().trim();
    return (v == null || v.isEmpty || v == 'null') ? null : v;
  }

  String? get title => raw['title']?.toString();
  bool get isRead => raw['isRead'] == true;
  String get createdAtRaw => raw['createdAt']?.toString() ?? '';
  DateTime? get createdAt => Fmt.parseDate(raw['createdAt']);

  /// Dedupe key used by the web screen (`${ppcId}_${message}`).
  String get dedupeKey => '${ppcId ?? ''}_$message';

  NotificationItem markedRead() =>
      NotificationItem({...raw, 'isRead': true});
}

/// `/profile/mobile/:phone` — MyProfile screen.
class UserProfile {
  UserProfile({
    this.name = '',
    this.email = '',
    this.address = '',
    this.mobile = '',
    this.exists = false,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        address: json['address']?.toString() ?? '',
        mobile: json['mobile']?.toString() ?? '',
        exists: true,
      );

  String name;
  String email;
  String address;
  String mobile;

  /// False when the backend 404s — the screen then shows "create" instead of
  /// "update", matching MyProfile.jsx.
  bool exists;

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'address': address,
        'mobile': mobile,
      };

  String get initial => name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();
}

/// An owner or buyer subscription plan (`/active-plans`, `/plans-by-phone/:p`).
class Plan {
  Plan(this.raw);

  final Map<String, dynamic> raw;

  factory Plan.fromJson(Map<String, dynamic> json) => Plan(json);

  String get id => raw['_id']?.toString() ?? '';
  String get name =>
      (raw['name'] ?? raw['planName'] ?? raw['title'] ?? 'Plan').toString();

  num get amount {
    final v = raw['amount'] ?? raw['price'] ?? raw['planPrice'] ?? 0;
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
  }

  String? get duration =>
      (raw['duration'] ?? raw['validity'] ?? raw['planDuration'])?.toString();

  String? get description => raw['description']?.toString();

  /// Plans expose their perks under a handful of different keys depending on
  /// which admin screen created them.
  List<String> get features {
    for (final key in ['features', 'planFeatures', 'benefits', 'points']) {
      final v = raw[key];
      if (v is List && v.isNotEmpty) {
        return v.map((e) => e.toString()).where((e) => e.isNotEmpty).toList();
      }
      if (v is String && v.trim().isNotEmpty) {
        return v.split(RegExp(r'[\n,]')).map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      }
    }
    return const [];
  }

  String? get status => raw['status']?.toString() ?? raw['planStatus']?.toString();
  DateTime? get createdAt => Fmt.parseDate(raw['createdAt'] ?? raw['planCreatedAt']);
  DateTime? get expiryDate =>
      Fmt.parseDate(raw['expiryDate'] ?? raw['expiredAt'] ?? raw['endDate']);
}

/// A points pricing pack (`/points-plans`).
class PointsPlan {
  PointsPlan(this.raw);

  final Map<String, dynamic> raw;

  factory PointsPlan.fromJson(Map<String, dynamic> json) => PointsPlan(json);

  String get id => raw['_id']?.toString() ?? '';
  String get name => (raw['name'] ?? raw['planName'] ?? 'Points Pack').toString();

  num get amount => _num(raw['amount'] ?? raw['price'] ?? 0);
  num get points => _num(raw['points'] ?? raw['pointsCount'] ?? raw['credits'] ?? 0);
  num get bonus => _num(raw['bonus'] ?? raw['bonusPoints'] ?? 0);

  String? get description => raw['description']?.toString();

  static num _num(dynamic v) {
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
  }
}

/// A points ledger entry (`/points-transactions/:phone`).
class PointsTransaction {
  PointsTransaction(this.raw);

  final Map<String, dynamic> raw;

  factory PointsTransaction.fromJson(Map<String, dynamic> json) =>
      PointsTransaction(json);

  String get id => raw['_id']?.toString() ?? '';
  String get type => (raw['type'] ?? raw['txnType'] ?? '').toString();
  String get reason =>
      (raw['reason'] ?? raw['note'] ?? raw['description'] ?? type).toString();

  num get points {
    final v = raw['points'] ?? raw['amount'] ?? 0;
    if (v is num) return v;
    return num.tryParse(v.toString()) ?? 0;
  }

  /// Credits are positive, deductions negative — the API is inconsistent about
  /// the sign, so infer it from the type when needed.
  bool get isCredit {
    if (points < 0) return false;
    final t = type.toLowerCase();
    if (t.contains('deduct') || t.contains('debit') || t.contains('spend')) {
      return false;
    }
    return true;
  }

  String? get ppcId => raw['ppcId']?.toString();
  DateTime? get createdAt => Fmt.parseDate(raw['createdAt'] ?? raw['date']);
}

/// A promotional banner from `/get-uploadimages-ads` (and friends).
class AdImage {
  AdImage(this.raw);

  final Map<String, dynamic> raw;

  factory AdImage.fromJson(Map<String, dynamic> json) => AdImage(json);

  String get id => raw['_id']?.toString() ?? '';

  String? get imageUrl {
    for (final key in ['img', 'image', 'imagePath', 'photo', 'url']) {
      final url = Fmt.mediaUrl(raw[key]);
      if (url != null) return url;
    }
    return null;
  }

  String? get link => raw['link']?.toString() ?? raw['redirectUrl']?.toString();
  DateTime? get uploadDate => Fmt.parseDate(raw['uploadDate'] ?? raw['createdAt']);
}

/// A generic "activity" row shared by the Owner/Buyer menu list screens
/// (interested buyers, contacted, offers, photo requests, ...).
///
/// Those endpoints all return slightly different envelopes, so this model
/// normalises the handful of fields the list UI actually renders.
class ActivityEntry {
  ActivityEntry(this.raw);

  final Map<String, dynamic> raw;

  factory ActivityEntry.fromJson(Map<String, dynamic> json) =>
      ActivityEntry(json);

  String get id => (raw['_id'] ?? raw['id'] ?? '').toString();

  String? get ppcId {
    for (final key in ['ppcId', 'propertyId', 'ppcid']) {
      final v = raw[key]?.toString().trim();
      if (v != null && v.isNotEmpty && v != 'null') return v;
    }
    final prop = raw['property'];
    if (prop is Map) return prop['ppcId']?.toString();
    return null;
  }

  String? get phone {
    for (final key in [
      'phoneNumber',
      'buyerPhoneNumber',
      'ownerPhoneNumber',
      'postedPhoneNumber',
      'interestedPhoneNumber',
      'userPhoneNumber',
      'phone',
    ]) {
      final v = raw[key]?.toString().trim();
      if (v != null && v.isNotEmpty && v != 'null') return v;
    }
    return null;
  }

  String? get name {
    for (final key in ['name', 'ownerName', 'buyerName', 'baName', 'userName']) {
      final v = raw[key]?.toString().trim();
      if (v != null && v.isNotEmpty && v != 'null') return v;
    }
    return null;
  }

  /// Nested property payload, when the endpoint embeds one.
  Map<String, dynamic>? get property {
    for (final key in ['property', 'propertyDetails', 'propertyData']) {
      final v = raw[key];
      if (v is Map<String, dynamic>) return v;
      if (v is Map) return Map<String, dynamic>.from(v);
    }
    // Some endpoints return the property document flattened onto the row.
    if (raw.containsKey('propertyType') || raw.containsKey('price')) return raw;
    return null;
  }

  String? get note {
    for (final key in [
      'comment',
      'reason',
      'selectReasons',
      'selectHelpReason',
      'message',
      'offerPrice',
      'description',
    ]) {
      final v = raw[key]?.toString().trim();
      if (v != null && v.isNotEmpty && v != 'null') return v;
    }
    return null;
  }

  num? get offerAmount {
    final v = raw['offerPrice'] ?? raw['offerAmount'] ?? raw['amount'];
    if (v == null) return null;
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll(RegExp(r'[^0-9.]'), ''));
  }

  String? get statusLabel => raw['status']?.toString();

  DateTime? get date => Fmt.parseDate(
        raw['date'] ??
            raw['createdAt'] ??
            raw['requestedAt'] ??
            raw['sentAt'] ??
            raw['viewedAt'],
      );
}
