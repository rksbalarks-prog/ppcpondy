import '../core/api_client.dart';
import '../models/buyer_assistance.dart';
import '../models/misc_models.dart';
import 'response_utils.dart';

/// Buyer-assistance (buyer requirement) endpoints — ports BuyerAssistance.jsx,
/// BuyerLists.jsx, BuyerList.jsx and the "Buyer Menu" screens.
class BuyerService {
  BuyerService._();

  static final _api = ApiClient.instance;

  /// Public buyer list shown under the "Buyer List" top-bar tab.
  static Future<List<BuyerAssistance>> fetchAll() async {
    final body = await _api.get('/get-buyerAssistances');
    return _sorted(asList(body));
  }

  /// Only the records an admin has activated.
  static Future<List<BuyerAssistance>> fetchActive() async {
    try {
      final body = await _api.get('/baActive-buyerAssistance-all-plans');
      final items = _sorted(asList(body));
      if (items.isNotEmpty) return items;
    } catch (_) {}
    final all = await fetchAll();
    return all.where((b) => b.isActive).toList();
  }

  /// The signed-in user's own requirements.
  static Future<List<BuyerAssistance>> fetchMine(String phoneNumber) async {
    final body = await _api.get('/get-buyerAssistance', query: {
      'phoneNumber': phoneNumber,
    });
    return _sorted(asList(body));
  }

  static Future<BuyerAssistance?> fetchById(String baId) async {
    try {
      final json = asObject(await _api.get('/fetch-buyerAssistance/$baId'));
      if (json != null && json.isNotEmpty) return BuyerAssistance(json);
    } catch (_) {}
    try {
      final json = asObject(await _api.get('/get-buyerAssistance/$baId'));
      if (json != null && json.isNotEmpty) return BuyerAssistance(json);
    } catch (_) {}
    return null;
  }

  static Future<int> countMine(String phoneNumber) async {
    try {
      return asCount(await _api.get('/count-buyerAssistance/$phoneNumber'));
    } catch (_) {
      return 0;
    }
  }

  static Future<void> create(Map<String, dynamic> payload) =>
      _api.post('/add-buyerAssistance', data: payload);

  static Future<void> update(String baId, Map<String, dynamic> payload) =>
      _api.put('/update-buyerAssistance/$baId', data: payload);

  static Future<void> remove(String baId) =>
      _api.delete('/delete-buyerAssistance/$baId');

  /// "Send interest" against a buyer requirement.
  static Future<void> sendInterest({
    required String baId,
    required String phoneNumber,
  }) =>
      _api.post('/buyer-assistance-interests', data: {
        'ba_id': baId,
        'phoneNumber': phoneNumber,
      });

  /// Interests this user has sent to buyer requirements.
  static Future<List<ActivityEntry>> fetchMyInterests(String phoneNumber) async {
    final body = await _api.get('/buyer-assistance-interests-phone', query: {
      'phoneNumber': phoneNumber,
    });
    return asList(body).map(ActivityEntry.fromJson).toList();
  }

  /// Owner-side: who viewed my requirement.
  static Future<List<ActivityEntry>> fetchViews(String phoneNumber) async {
    final body = await _api.get('/get-buyer-assist-views', query: {
      'phoneNumber': phoneNumber,
    });
    return asList(body).map(ActivityEntry.fromJson).toList();
  }

  static Future<void> logView({
    required String baId,
    required String phoneNumber,
  }) async {
    try {
      await _api.post('/log-buyer-assist-view', data: {
        'ba_id': baId,
        'phoneNumber': phoneNumber,
      });
    } catch (_) {}
  }

  /// Owner contacting a buyer from the Buyer List card.
  static Future<void> contactBuyer({
    required String phoneNumber,
    required String buyerPhoneNumber,
    String? baId,
  }) async {
    await _api.post('/contact-buyer-send', data: {
      'phoneNumber': phoneNumber,
      'buyerPhoneNumber': buyerPhoneNumber,
      if (baId != null) 'ba_id': baId,
    });
  }

  /// Whether this user's plan lets them see buyer contact details.
  static Future<bool> hasBuyerAccess(String phoneNumber) async {
    try {
      final body = await _api.get('/check-user-access-buyer-assistance', query: {
        'phoneNumber': phoneNumber,
      });
      if (body is Map) {
        final v = body['hasAccess'] ?? body['access'] ?? body['allowed'];
        if (v is bool) return v;
        if (v != null) return v.toString().toLowerCase() == 'true';
      }
    } catch (_) {}
    return false;
  }

  static List<BuyerAssistance> _sorted(List<Map<String, dynamic>> rows) {
    final items = rows.map(BuyerAssistance.fromJson).toList();
    items.sort((a, b) {
      final ad = a.createdAt, bd = b.createdAt;
      if (ad == null && bd == null) return 0;
      if (ad == null) return 1;
      if (bd == null) return -1;
      return bd.compareTo(ad);
    });
    return items;
  }
}
