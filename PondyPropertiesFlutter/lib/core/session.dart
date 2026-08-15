import 'package:shared_preferences/shared_preferences.dart';

/// Persistent key/value store — the Flutter stand-in for the web app's
/// `localStorage`. Key names are kept identical so behaviour is easy to
/// reason about against the React source.
class Session {
  Session._();

  static const String kPhoneNumber = 'phoneNumber'; // e.g. "+919876543210"
  static const String kCountryCode = 'countryCode';
  static const String kFreshLogin = 'freshLogin';
  static const String kLastActiveContent = 'lastActiveContent';
  static const String kReadNotifications = 'readNotifications';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static SharedPreferences get _p {
    final p = _prefs;
    if (p == null) {
      throw StateError('Session.init() must be awaited before use.');
    }
    return p;
  }

  static String? getString(String key) => _p.getString(key);
  static bool getBool(String key, {bool fallback = false}) =>
      _p.getBool(key) ?? fallback;
  static List<String> getStringList(String key) =>
      _p.getStringList(key) ?? const [];

  static Future<void> setString(String key, String value) =>
      _p.setString(key, value);
  static Future<void> setBool(String key, bool value) => _p.setBool(key, value);
  static Future<void> setStringList(String key, List<String> value) =>
      _p.setStringList(key, value);
  static Future<void> remove(String key) => _p.remove(key);

  /// Per-property one-shot flags the detail screen sets after an action
  /// (`interestSent-<ppcId>`, `isHeartClicked-<ppcId>`, …).
  static bool flag(String name, dynamic ppcId) =>
      getBool('$name-$ppcId', fallback: false);

  static Future<void> setFlag(String name, dynamic ppcId, bool value) =>
      setBool('$name-$ppcId', value);
}
