import '../core/api_client.dart';
import '../models/misc_models.dart';
import 'response_utils.dart';

/// Profile, notifications, plans, points and the Owner/Buyer menu counters.
class AccountService {
  AccountService._();

  static final _api = ApiClient.instance;

  // ───────────────────────── Profile ─────────────────────────

  static Future<UserProfile> fetchProfile(String phoneNumber) async {
    try {
      final json = asObject(await _api.get('/profile/mobile/$phoneNumber'));
      if (json != null && json.isNotEmpty && json['mobile'] != null) {
        return UserProfile.fromJson(json);
      }
    } on ApiException catch (e) {
      // 404 => no profile yet; the screen switches to "create" mode.
      if (e.statusCode != 404) rethrow;
    }
    return UserProfile(mobile: phoneNumber, exists: false);
  }

  static Future<UserProfile> createProfile(UserProfile profile) async {
    final json = asObject(await _api.post('/profile-create', data: profile.toJson()));
    return json == null ? (profile..exists = true) : UserProfile.fromJson(json);
  }

  static Future<void> updateProfile(UserProfile profile) => _api.put(
        '/profile/${profile.mobile}',
        data: {
          'name': profile.name,
          'email': profile.email,
          'address': profile.address,
        },
      );

  // ───────────────────────── Notifications ─────────────────────────

  static Future<List<NotificationItem>> fetchNotifications(
      String phoneNumber) async {
    final rows = <Map<String, dynamic>>[];

    try {
      rows.addAll(asList(await _api.get('/notifications/$phoneNumber')));
    } catch (_) {}
    try {
      rows.addAll(asList(await _api.get('/get-user-notifications',
          query: {'phoneNumber': phoneNumber})));
    } catch (_) {}

    // Same dedupe the web screen does: one row per (ppcId, message).
    final seen = <String, NotificationItem>{};
    for (final row in rows) {
      final item = NotificationItem(row);
      seen.putIfAbsent(item.dedupeKey, () => item);
    }
    final items = seen.values.toList()
      ..sort((a, b) {
        final ad = a.createdAt, bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return bd.compareTo(ad);
      });
    return items;
  }

  static Future<int> unreadCount(String phoneNumber) async {
    try {
      return asCount(await _api.get('/notification-unread-count',
          query: {'phoneNumber': phoneNumber}));
    } catch (_) {
      return 0;
    }
  }

  static Future<void> markRead(String notificationId) =>
      _api.put('/mark-single-notification-read/$notificationId');

  static Future<void> deleteByTime(String createdAt) =>
      _api.delete('/delete-notification-by-time', data: {'createdAt': createdAt});

  // ───────────────────────── Points ─────────────────────────

  static Future<num> pointsBalance(String phoneNumber) async {
    try {
      final body = await _api.get('/points-balance/$phoneNumber');
      if (body is Map) {
        final v = body['balance'] ?? body['points'] ?? 0;
        if (v is num) return v;
        return num.tryParse(v.toString()) ?? 0;
      }
    } catch (_) {}
    return 0;
  }

  /// POST /points-deduct — the gate behind "View owner contact details".
  ///
  /// Note the route answers **HTTP 200 with `success: false`** when the balance
  /// is short rather than a 4xx, so callers must branch on `success`; a bare
  /// try/catch would silently treat "insufficient points" as a reveal.
  static Future<PointsDeduction> pointsDeduct({
    required String phoneNumber,
    required int points,
    String? rentId,
    String reason = 'deduct',
  }) async {
    final body = await _api.post('/points-deduct', data: {
      'phoneNumber': phoneNumber,
      'points': points,
      if (rentId != null) 'rentId': rentId,
      'reason': reason,
    });
    final map = body is Map ? body : const {};
    final raw = map['balance'] ?? 0;
    return PointsDeduction(
      success: map['success'] == true,
      balance: raw is num ? raw : (num.tryParse(raw.toString()) ?? 0),
      message: map['message']?.toString(),
    );
  }

  static Future<List<PointsPlan>> pointsPlans() async {
    try {
      return asList(await _api.get('/points-plans')).map(PointsPlan.fromJson).toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<List<PointsTransaction>> pointsTransactions(
      String phoneNumber) async {
    try {
      final body = await _api.get('/points-transactions/$phoneNumber',
          query: {'limit': 200});
      return asList(body).map(PointsTransaction.fromJson).toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<void> selectPointsPlan({
    required String phoneNumber,
    required String planId,
  }) =>
      _api.post('/select-points-plan', data: {
        'phoneNumber': phoneNumber,
        'planId': planId,
      });

  // ───────────────────────── Plans ─────────────────────────

  /// Plans an owner can buy (Pricing Plans screen).
  static Future<List<Plan>> activePlans() async {
    try {
      return asList(await _api.get('/active-plans')).map(Plan.fromJson).toList();
    } catch (_) {
      return const [];
    }
  }

  /// Buyer-assistance plans.
  static Future<List<Plan>> buyerPlans() async {
    try {
      return asList(await _api.get('/buyer-plans-active')).map(Plan.fromJson).toList();
    } catch (_) {
      return const [];
    }
  }

  /// The plans this user already owns.
  static Future<List<Plan>> myPlans(String phoneNumber) async {
    try {
      return asList(await _api.get('/plans-by-phone/$phoneNumber'))
          .map(Plan.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<List<Plan>> myBuyerPlans(String phoneNumber) async {
    try {
      return asList(await _api.get('/get-buyer-plan-by-phone-buyer/$phoneNumber'))
          .map(Plan.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<List<Plan>> expiredPlans(String phoneNumber) async {
    try {
      return asList(await _api.get('/expired-plans-by-phone',
              query: {'phoneNumber': phoneNumber}))
          .map(Plan.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<void> selectPlan({
    required String phoneNumber,
    required String planId,
    String? ppcId,
    String? planName,
  }) =>
      _api.post('/select-plan', data: {
        'phoneNumber': phoneNumber,
        'planId': planId,
        if (ppcId != null) 'ppcId': ppcId,
        if (planName != null) 'planName': planName,
      });

  // ───────────────────── PayU checkout ─────────────────────

  /// Ask the backend to sign a PayU transaction. The returned map is POSTed to
  /// PayU's hosted page (see PayuCheckoutScreen), exactly like PayUForm.jsx.
  static Future<Map<String, dynamic>> initiatePayU({
    required String endpoint,
    required Map<String, dynamic> payload,
  }) async {
    final body = await _api.post(endpoint, data: payload);
    if (body is Map) return Map<String, dynamic>.from(body);
    throw ApiException('Payment could not be initialised.');
  }

  static Future<void> payLater({
    required String endpoint,
    required Map<String, dynamic> payload,
  }) =>
      _api.post(endpoint, data: payload);

  // ───────────────── Contact us / support ─────────────────

  static Future<void> submitContactUs(Map<String, dynamic> payload) =>
      _api.post('/contactUs', data: payload);

  /// Static CMS text blocks (about, terms, privacy, refund, ...).
  static Future<String?> fetchText(String key) async {
    try {
      final body = await _api.get('/get-text/$key');
      if (body is Map) {
        for (final k in ['text', 'content', 'html', 'value', 'description']) {
          final v = body[k];
          if (v is String && v.trim().isNotEmpty) return v;
        }
        final data = body['data'];
        if (data is Map) {
          for (final k in ['text', 'content', 'html', 'value']) {
            final v = data[k];
            if (v is String && v.trim().isNotEmpty) return v;
          }
        }
      }
      if (body is String && body.trim().isNotEmpty) return body;
    } catch (_) {}
    return null;
  }

  // ───────────────── Owner / Buyer menu counters ─────────────────

  /// Every badge on the More screen, fetched in parallel. Individual failures
  /// resolve to 0 so one bad endpoint can't blank the whole menu.
  static Future<Map<String, int>> fetchMenuCounts(String phoneNumber) async {
    final p = phoneNumber;
    final specs = <String, Future<int> Function()>{
      // My account
      'myProperty': () => _count('/property-count', query: {'phoneNumber': p}),
      'myPlan': () => _count('/plans/count/$p'),
      'notifications': () => _count('/notifications/count/$p'),
      'notificationsUnread': () =>
          _count('/notification-user-count', query: {'phoneNumber': p}),
      'removedProperty': () =>
          _count('/fetch-delete-status-count', query: {'phoneNumber': p}),
      'expiredPlan': () =>
          _count('/expired-plan-count-by-phone', query: {'phoneNumber': p}),
      'allPlans': () => _count('/get-all-plan-count'),

      // Owner menu (people acting on MY properties)
      'interestedBuyers': () => _count('/interest-buyers-count/$p'),
      'matchedBuyers': () =>
          _count('/count-matched-datas-buyer', query: {'phoneNumber': p}),
      'offersFromBuyers': () => _count('/offers/buyer/count/$p'),
      'contactedBuyers': () =>
          _count('/get-contact-buyer-count', query: {'postedPhoneNumber': p}),
      'photoRequestedBuyers': () => _count('/photo-requests/buyer/count/$p'),
      'shortlistedBuyers': () =>
          _count('/get-favorite-buyer-count', query: {'postedPhoneNumber': p}),
      'viewedBuyers': () =>
          _count('/property-buyer-viewed-count', query: {'phoneNumber': p}),
      'soldOutBuyers': () =>
          _count('/get-soldout-buyer-count', query: {'postedPhoneNumber': p}),
      'reportedBuyers': () =>
          _count('/get-reportproperty-buyer-count', query: {'postedPhoneNumber': p}),
      'helpBuyers': () =>
          _count('/get-help-as-buyer-count', query: {'postedPhoneNumber': p}),
      'addressRequestsOwner': () => _count('/address-requests/count/owner/$p'),

      // Buyer menu (MY activity on other people's properties)
      'myBuyerAssistance': () => _count('/count-buyerAssistance/$p'),
      'mySentInterest': () =>
          _count('/get-interest-sent-count', query: {'phoneNumber': p}),
      'myMatchedProperties': () =>
          _count('/fetch-owner-matched-properties/count', query: {'phoneNumber': p}),
      'myPhotoRequests': () => _count('/photo-requests/owner/count/$p'),
      'myContacted': () =>
          _count('/get-contact-owner-count', query: {'phoneNumber': p}),
      'myOffers': () => _count('/offers/owner/count/$p'),
      'myShortlist': () =>
          _count('/get-favorite-owner-count', query: {'phoneNumber': p}),
      'myShortlistRemoved': () =>
          _count('/get-favorite-removed-owner-count', query: {'phoneNumber': p}),
      'myLastViewed': () => _count('/user-view-count/$p'),
      'myMostViewed': () =>
          _count('/get-most-viewed-properties-count', query: {'phoneNumber': p}),
      'myInterestSend': () => _count('/buyer-assistance-interests-phone/count',
          query: {'phoneNumber': p}),
      'mySoldOutReports': () =>
          _count('/get-soldout-owner-count', query: {'phoneNumber': p}),
      'myReports': () =>
          _count('/get-reportproperty-owner-count', query: {'phoneNumber': p}),
      'myHelpRequests': () =>
          _count('/get-help-as-owner-count', query: {'phoneNumber': p}),
      'myCalls': () => _count('/user-call/property-owner/$p/count'),
      'addressRequestsBuyer': () => _count('/address-requests/count/buyer/$p'),
    };

    final keys = specs.keys.toList();
    final values = await Future.wait(keys.map((k) => specs[k]!()));
    return Map.fromIterables(keys, values);
  }

  static Future<int> _count(String path, {Map<String, dynamic>? query}) async {
    try {
      return asCount(await _api.get(path, query: query));
    } catch (_) {
      return 0;
    }
  }
}

/// Result of [AccountService.pointsDeduct].
///
/// `success == false` with a non-null [balance] is the "not enough points"
/// case — the server reports it as a 200, not an error status.
class PointsDeduction {
  const PointsDeduction({
    required this.success,
    required this.balance,
    this.message,
  });

  final bool success;
  final num balance;
  final String? message;
}
