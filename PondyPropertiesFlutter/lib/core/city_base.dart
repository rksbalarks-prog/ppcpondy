import 'package:shared_preferences/shared_preferences.dart';

/// City-base ('PY' = Pondicherry, 'CH' = Chennai) helpers.
///
/// Port of `src/utils/cityBase.js`. On the web the active base is derived from
/// the URL (`/chennai` -> CH) and mirrored into localStorage; here there is no
/// URL, so the stored value *is* the source of truth. Every backend call gets
/// `?base=PY|CH` appended by [ApiClient]'s interceptor, exactly like the axios
/// interceptor does on the web.
class CityBase {
  CityBase._();

  static const List<String> bases = ['PY', 'CH'];
  static const String _storageKey = 'activeBase';

  /// In-memory mirror so the Dio interceptor stays synchronous.
  static String _active = 'PY';

  static String get active => _active;

  static String cityName(String base) =>
      base == 'CH' ? 'Chennai' : 'Pondicherry';

  /// 'chennai' / 'pondicherry' -> 'CH' / 'PY'.
  static String fromCitySlug(String slug) =>
      slug.toLowerCase() == 'chennai' ? 'CH' : 'PY';

  static String toCitySlug(String base) =>
      base == 'CH' ? 'chennai' : 'pondicherry';

  /// Load the persisted base at app startup (call before the first request).
  static Future<String> load() async {
    final prefs = await SharedPreferences.getInstance();
    _active = prefs.getString(_storageKey) == 'CH' ? 'CH' : 'PY';
    return _active;
  }

  /// Persist the active base. Anything other than 'CH' is treated as 'PY'.
  static Future<void> setActive(String base) async {
    _active = base == 'CH' ? 'CH' : 'PY';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, _active);
  }
}
