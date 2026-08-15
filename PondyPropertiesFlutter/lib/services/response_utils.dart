/// The PPC backend wraps list payloads in a different key on almost every
/// endpoint (`properties`, `users`, `data`, `notifications`, `requests`, ...).
/// These helpers pull the list/count out without each screen having to care.
library;

const List<String> _listKeys = [
  'properties',
  'users',
  'data',
  'notifications',
  'requests',
  'offers',
  'photoRequests',
  'favorites',
  'contacts',
  'interests',
  'buyerAssistances',
  'buyerAssistance',
  'result',
  'results',
  'records',
  'items',
  'list',
  'plans',
  'transactions',
  'views',
  'matchedProperties',
  'matchedBuyers',
  'addressRequests',
  'videos',
];

/// Extract a list of maps from any envelope shape the backend uses.
List<Map<String, dynamic>> asList(dynamic body, {String? preferKey}) {
  if (body == null) return const [];

  if (body is List) return _mapify(body);

  if (body is Map) {
    if (preferKey != null && body[preferKey] is List) {
      return _mapify(body[preferKey] as List);
    }
    for (final key in _listKeys) {
      final v = body[key];
      if (v is List) return _mapify(v);
    }
    // Some endpoints nest one level deeper, e.g. { data: { properties: [...] } }
    for (final v in body.values) {
      if (v is Map) {
        for (final key in _listKeys) {
          final inner = v[key];
          if (inner is List) return _mapify(inner);
        }
      }
    }
    // A single object response — treat it as a one-item list.
    if (body.isNotEmpty && body.values.any((v) => v is! List)) {
      return _mapify([body]);
    }
  }
  return const [];
}

List<Map<String, dynamic>> _mapify(List raw) => raw
    .whereType<Object>()
    .map((e) => e is Map<String, dynamic>
        ? e
        : (e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{}))
    .where((e) => e.isNotEmpty)
    .toList();

/// Extract a single object payload.
Map<String, dynamic>? asObject(dynamic body, {String? preferKey}) {
  if (body is Map) {
    if (preferKey != null && body[preferKey] is Map) {
      return Map<String, dynamic>.from(body[preferKey] as Map);
    }
    for (final key in ['property', 'user', 'data', 'result', 'profile']) {
      final v = body[key];
      if (v is Map) return Map<String, dynamic>.from(v);
      if (v is List && v.isNotEmpty && v.first is Map) {
        return Map<String, dynamic>.from(v.first as Map);
      }
    }
    return Map<String, dynamic>.from(body);
  }
  if (body is List && body.isNotEmpty && body.first is Map) {
    return Map<String, dynamic>.from(body.first as Map);
  }
  return null;
}

/// Extract a numeric count from `{ count: n }`-ish payloads.
int asCount(dynamic body) {
  if (body is num) return body.toInt();
  if (body is Map) {
    for (final key in ['count', 'total', 'totalCount', 'length', 'result']) {
      final v = body[key];
      if (v is num) return v.toInt();
      if (v is String) {
        final parsed = int.tryParse(v);
        if (parsed != null) return parsed;
      }
    }
    for (final key in _listKeys) {
      if (body[key] is List) return (body[key] as List).length;
    }
  }
  if (body is List) return body.length;
  return 0;
}

/// Read a string field out of a response body.
String? asString(dynamic body, String key) {
  if (body is Map) {
    final v = body[key];
    if (v == null) return null;
    final s = v.toString().trim();
    return s.isEmpty ? null : s;
  }
  return null;
}
