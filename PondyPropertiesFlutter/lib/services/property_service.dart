import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../core/formatters.dart';
import '../models/misc_models.dart';
import '../models/property.dart';
import 'response_utils.dart';

/// Everything property-related: feeds, detail, actions, add/edit, my listings.
class PropertyService {
  PropertyService._();

  static final _api = ApiClient.instance;

  // ───────────────────────── Feeds ─────────────────────────

  /// The home feed. Ports the merge in AllProperty.jsx / PropertyCards.jsx:
  /// featured properties first (flagged `isFeatured`), then active listings
  /// with the featured duplicates removed, all sorted newest-first.
  static Future<List<Property>> fetchHomeFeed() async {
    final results = await Future.wait([
      _api.get('/fetch-featured-properties-on-demand').catchError((_) => null),
      _api.get('/fetch-active-users-on-demand').catchError((_) => null),
    ]);

    final featured = asList(results[0], preferKey: 'properties')
        .map((e) => Property({...e, 'isFeatured': true}))
        .toList();
    final featuredIds = featured.map((p) => p.ppcId).toSet();

    final active = asList(results[1], preferKey: 'users')
        .map((e) => Property({...e, 'isFeatured': false}))
        .where((p) => !featuredIds.contains(p.ppcId))
        .toList();

    final all = [...featured, ...active];
    _sortNewestFirst(all);
    return all;
  }

  /// Pondicherry feed (`topPyProperty`).
  static Future<List<Property>> fetchPondicherryProperties() async {
    final body = await _api.get('/fetch-Pudhucherry-properties-on-demand');
    return _sorted(asList(body));
  }

  /// Chennai feed (`topChennaiProperty`).
  static Future<List<Property>> fetchChennaiProperties() async {
    final body = await _api.get('/fetch-chennai-properties-on-demand');
    return _sorted(asList(body));
  }

  /// Featured only (`topFeatureProperty`).
  static Future<List<Property>> fetchFeaturedProperties() async {
    final body = await _api.get('/fetch-featured-properties-on-demand');
    return _sorted(asList(body).map((e) => {...e, 'isFeatured': true}).toList());
  }

  /// Properties nobody has opened yet (`topNotViewedProperty` / ZeroView).
  static Future<List<Property>> fetchZeroViewProperties() async {
    final body = await _api.get('/zero-view-properties-on-demand');
    return _sorted(asList(body));
  }

  /// Every active listing (used by the map + "All Property" sources).
  static Future<List<Property>> fetchActiveProperties() async {
    final body = await _api.get('/fetch-active-users-on-demand');
    return _sorted(asList(body, preferKey: 'users'));
  }

  /// Rent/sale listings surfaced by the "Rent Property" top-bar tab.
  static Future<List<Property>> fetchSaleProperties() async {
    final all = await fetchActiveProperties();
    final rent = all.where((p) {
      final mode = (p.propertyMode ?? '').toLowerCase();
      return mode.contains('rent') || mode.contains('lease');
    }).toList();
    return rent.isEmpty ? all : rent;
  }

  // Curated "sort" feeds used by the More / sort screens.
  static Future<List<Property>> fetchBankLoanProperties() async =>
      _sorted(asList(await _api.get('/get-bankloan-properties')));

  static Future<List<Property>> fetchHousesBelow30L() async =>
      _sorted(asList(await _api.get('/get-houses-below-30l')));

  static Future<List<Property>> fetchLocationAppliedProperties() async =>
      _sorted(asList(await _api.get('/get-location-applied-properties')));

  static Future<List<Property>> fetchMostViewed(String phone) async =>
      _sorted(asList(await _api.get('/user-most-viewed-properties/$phone')));

  static Future<List<Property>> fetchLastViewed(String phone) async =>
      _sorted(asList(await _api.get('/user-last-30-days-views/$phone')));

  // ───────────────────────── Detail ─────────────────────────

  /// Full property document for the detail screen.
  static Future<Property?> fetchByPpcId(String ppcId) async {
    // `/fetch-data-on-demand` is what DetailProperty.jsx uses; `/property/:id`
    // is the fallback that also works for admin-created records.
    for (final call in <Future<dynamic> Function()>[
      () => _api.get('/fetch-data-on-demand', query: {'ppcId': ppcId}),
      () => _api.get('/get-property-data', query: {'ppcId': ppcId}),
      () => _api.get('/property/$ppcId'),
    ]) {
      try {
        final json = asObject(await call());
        if (json != null && json.isNotEmpty && json['ppcId'] != null) {
          return Property(json);
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  /// Number of photos on a listing (the little camera badge on the card).
  static Future<int> fetchImageCount(String ppcId) async {
    try {
      final body = await _api.get('/uploads-count', query: {'ppcId': ppcId});
      if (body is Map) {
        final v = body['uploadedImagesCount'] ?? body['count'];
        if (v is num) return v.toInt();
        return int.tryParse(v?.toString() ?? '') ?? 0;
      }
    } catch (_) {}
    return 0;
  }

  /// Batch the badge counts for a page of cards (Promise.all on the web).
  static Future<Map<String, int>> fetchImageCounts(List<Property> items) async {
    final entries = await Future.wait(items.map((p) async {
      final c = await fetchImageCount(p.ppcId);
      return MapEntry(p.ppcId, c);
    }));
    return Map.fromEntries(entries);
  }

  /// Records that a user opened a listing (drives "viewed by" reports).
  static Future<void> saveView({
    required String phoneNumber,
    required String ppcId,
  }) async {
    try {
      await _api.post('/save-property-view', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
      });
    } catch (_) {}
    try {
      await _api.post('/user-view-property', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
      });
    } catch (_) {}
  }

  static Future<List<String>> fetchPropertyVideos(String ppcId) async {
    try {
      final body = await _api.get('/get-property-video/$ppcId');
      final list = asList(body);
      final urls = <String>[];
      for (final row in list) {
        for (final key in ['video', 'videos', 'url', 'path']) {
          final v = row[key];
          if (v is List) {
            urls.addAll(v.map(Fmt.mediaUrl).whereType<String>());
          } else {
            final url = Fmt.mediaUrl(v);
            if (url != null) urls.add(url);
          }
        }
      }
      return urls.toSet().toList();
    } catch (_) {
      return const [];
    }
  }

  // ───────────────────── Detail-screen actions ─────────────────────

  /// Reveal the owner's number. Returns the whole envelope because the screen
  /// shows the remaining daily quota from it.
  static Future<Map<String, dynamic>> contactOwner({
    required String phoneNumber,
    required String ppcId,
  }) async {
    final body = await _api.post('/contact', data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
    });
    return body is Map ? Map<String, dynamic>.from(body) : {};
  }

  static Future<String> sendInterest({
    required String phoneNumber,
    required String ppcId,
  }) async {
    final body = await _api.post('/send-interests', data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
    });
    return asString(body, 'status') ?? '';
  }

  static Future<String> reportSoldOut({
    required String phoneNumber,
    required String ppcId,
  }) async {
    final body = await _api.post('/report-sold-out', data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
    });
    return asString(body, 'status') ?? '';
  }

  static Future<String> reportProperty({
    required String phoneNumber,
    required String ppcId,
    String? reason,
    String? comment,
  }) async {
    final body = await _api.post('/report-property', data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
      if (reason != null) 'selectReasons': reason,
      if (comment != null) 'reason': comment,
    });
    return asString(body, 'status') ?? '';
  }

  static Future<String> needHelp({
    required String phoneNumber,
    required String ppcId,
    String? reason,
    String? comment,
  }) async {
    final body = await _api.post('/need-help', data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
      if (reason != null) 'selectHelpReason': reason,
      if (comment != null) 'comment': comment,
    });
    return asString(body, 'status') ?? '';
  }

  /// Heart toggle — add-favorite / remove-favorite, returns the new status.
  static Future<String> toggleFavorite({
    required String phoneNumber,
    required String ppcId,
    required bool currentlyFavorite,
  }) async {
    final path = currentlyFavorite ? '/remove-favorite' : '/add-favorite';
    final body = await _api.post(path, data: {
      'phoneNumber': phoneNumber,
      'ppcId': ppcId,
    });
    return asString(body, 'status') ?? '';
  }

  static Future<void> requestPhotos({
    required String phoneNumber,
    required String ppcId,
  }) =>
      _api.post('/photo-request', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
      });

  static Future<void> requestAddress({
    required String phoneNumber,
    required String ppcId,
  }) =>
      _api.post('/request-address', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
      });

  static Future<void> makeOffer({
    required String phoneNumber,
    required String ppcId,
    required num amount,
  }) =>
      _api.post('/offer', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
        'offerPrice': amount,
      });

  /// Records that the buyer tapped the owner's number, immediately before the
  /// dialler opens. Best-effort on the web too — the call is placed either way.
  static Future<void> logContactSend({
    required String userPhone,
    required String postedUserPhone,
    required String ppcId,
  }) =>
      _api.post('/contact-send-property', data: {
        'userPhone': userPhone,
        'postedUserPhone': postedUserPhone,
        'ppcId': ppcId,
        'status': 'contactSend',
      });

  static Future<void> logCallExperience({
    required String phoneNumber,
    required String ppcId,
    required String reason,
    String? comment,
  }) =>
      _api.post('/called-experience', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
        'selectCalledReasons': reason,
        if (comment != null) 'reasonCalled': comment,
      });

  // ───────────────────── My properties ─────────────────────

  /// Listings belonging to the signed-in user, with their plan/payment state.
  static Future<List<Property>> fetchMyProperties(String phoneNumber) async {
    final body = await _api.get(
      '/fetch-status-with-payment',
      query: {'phoneNumber': phoneNumber},
    );
    return _sorted(asList(body));
  }

  /// Soft-deleted listings ("Removed Property").
  static Future<List<Property>> fetchRemovedProperties(String phoneNumber) async {
    final body = await _api.get(
      '/fetch-delete-status',
      query: {'phoneNumber': phoneNumber},
    );
    return _sorted(asList(body));
  }

  static Future<void> deleteProperty({
    required String phoneNumber,
    required String ppcId,
    String? reason,
  }) =>
      _api.post('/delete-property', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
        if (reason != null) 'deletionReason': reason,
      });

  static Future<void> undoDelete({
    required String phoneNumber,
    required String ppcId,
  }) =>
      _api.post('/undo-delete', data: {
        'phoneNumber': phoneNumber,
        'ppcId': ppcId,
      });

  // ───────────────────── Add / edit ─────────────────────

  /// Step 0 of the add-property wizard: reserve a PPC-ID for this user.
  static Future<String> reservePpcId(String phoneNumber) async {
    final body = await _api.post('/store-data', data: {'phoneNumber': phoneNumber});
    final id = asString(body, 'ppcId');
    if (id == null) throw ApiException('Could not reserve a PPC-ID.');
    return id;
  }

  /// Save wizard progress / final submit. Photos + videos ride along as
  /// multipart, exactly like the web `update-property` call.
  static Future<void> updateProperty({
    required String ppcId,
    required Map<String, dynamic> fields,
    List<MultipartFile> photos = const [],
    List<MultipartFile> videos = const [],
  }) async {
    final form = FormData();
    form.fields.add(MapEntry('ppcId', ppcId));
    fields.forEach((key, value) {
      if (value == null) return;
      form.fields.add(MapEntry(key, value.toString()));
    });
    for (final photo in photos) {
      form.files.add(MapEntry('photos', photo));
    }
    for (final video in videos) {
      form.files.add(MapEntry('video', video));
    }
    await _api.postMultipart('/update-property', form);
  }

  /// Dropdown option lists (`/fetch` returns `{ field, value }` rows).
  static Future<Map<String, List<String>>> fetchDropdowns() async {
    final body = await _api.get('/fetch');
    final rows = asList(body);
    final grouped = <String, List<String>>{};
    for (final row in rows) {
      final field = row['field']?.toString();
      final value = row['value']?.toString();
      if (field == null || value == null || value.isEmpty) continue;
      grouped.putIfAbsent(field, () => []).add(value);
    }
    return grouped;
  }

  /// Area / pincode autocomplete on the feed search bar.
  static Future<List<String>> searchAreas(String query) async {
    if (query.trim().isEmpty) return const [];
    try {
      final body = await _api.get('/areas', query: {'search': query});
      return _stringSuggestions(body);
    } catch (_) {
      return const [];
    }
  }

  static Future<List<String>> searchCities(String query) async {
    if (query.trim().isEmpty) return const [];
    try {
      final body = await _api.get('/cities', query: {'search': query});
      return _stringSuggestions(body);
    } catch (_) {
      return const [];
    }
  }

  static List<String> _stringSuggestions(dynamic body) {
    if (body is List) {
      return body
          .map((e) => e is Map ? (e['name'] ?? e['area'] ?? e['value']) : e)
          .map((e) => e?.toString().trim() ?? '')
          .where((e) => e.isNotEmpty)
          .toList();
    }
    return asList(body)
        .map((e) =>
            (e['name'] ?? e['area'] ?? e['city'] ?? e['value'])?.toString() ?? '')
        .where((e) => e.isNotEmpty)
        .toList();
  }

  // ───────────────────── Ads / banners ─────────────────────

  static Future<List<AdImage>> fetchFeedAds() => _fetchAds('/get-uploadimages-ads');
  static Future<List<AdImage>> fetchDetailAds() =>
      _fetchAds('/get-uploadimages-ads-detail');
  static Future<List<AdImage>> fetchBanners() => _fetchAds('/get-uploadimages');
  static Future<List<AdImage>> fetchGroomImages() => _fetchAds('/get-uploadimages');
  static Future<List<AdImage>> fetchBrideImages() =>
      _fetchAds('/get-uploadimages-bride');

  static Future<List<AdImage>> _fetchAds(String path) async {
    try {
      final ads = asList(await _api.get(path)).map(AdImage.fromJson).toList();
      ads.sort((a, b) {
        final ad = a.uploadDate, bd = b.uploadDate;
        if (ad == null || bd == null) return 0;
        return bd.compareTo(ad);
      });
      return ads.where((a) => a.imageUrl != null).toList();
    } catch (_) {
      return const [];
    }
  }

  // ───────────────────── helpers ─────────────────────

  static List<Property> _sorted(List<Map<String, dynamic>> rows) {
    final items = rows.map(Property.fromJson).toList();
    _sortNewestFirst(items);
    return items;
  }

  static void _sortNewestFirst(List<Property> items) {
    items.sort((a, b) {
      final ad = a.displayDate, bd = b.displayDate;
      if (ad == null && bd == null) return 0;
      if (ad == null) return 1;
      if (bd == null) return -1;
      return bd.compareTo(ad);
    });
  }
}
