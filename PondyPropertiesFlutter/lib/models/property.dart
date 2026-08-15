import '../core/formatters.dart';

/// A property document from `AddModel` (PPC/AddModel.js).
///
/// The backend returns loosely-typed JSON (numbers arrive as strings, `price`
/// can be the literal "On Demand", arrays may be missing), so every field is
/// read defensively — same as the React screens do.
class Property {
  Property(this.raw);

  final Map<String, dynamic> raw;

  factory Property.fromJson(Map<String, dynamic> json) => Property(json);

  dynamic operator [](String key) => raw[key];

  String? _s(String key) {
    final v = raw[key];
    if (v == null) return null;
    final s = v.toString().trim();
    return s.isEmpty || s.toLowerCase() == 'null' ? null : s;
  }

  num? _n(String key) {
    final v = raw[key];
    if (v == null) return null;
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll(',', '').trim());
  }

  String get id => _s('_id') ?? '';
  String get ppcId => _s('ppcId') ?? '';
  String? get phoneNumber => _s('phoneNumber');
  String? get alternatePhone => _s('alternatePhone');
  String? get assignedPhoneNumber => _s('assignedPhoneNumber');
  bool get setPpcId => raw['setPpcId'] == true;

  String get status => _s('status') ?? '';
  String? get planName => _s('planName');

  /// The feed marks featured rows client-side after merging the two endpoints.
  bool get isFeatured =>
      raw['isFeatured'] == true || (_s('featureStatus')?.toLowerCase() == 'yes');

  int get views => (_n('views') ?? 0).toInt();

  // ── Basic info ──────────────────────────────────────────────────────────
  String? get propertyMode => _s('propertyMode');
  String? get propertyType => _s('propertyType');
  String? get propertyAge => _s('propertyAge');
  String? get ownership => _s('ownership');
  String? get propertyApproved => _s('propertyApproved');
  String? get bankLoan => _s('bankLoan');
  String? get negotiation => _s('negotiation');
  num? get length => _n('length');
  num? get breadth => _n('breadth');
  num? get totalArea => _n('totalArea');
  String? get areaUnit => _s('areaUnit');

  /// `price` is Number in the schema but admins can flip a property to
  /// "On Demand", in which case the API returns that string.
  dynamic get price {
    final v = raw['price'];
    if (v is String && v.trim().toLowerCase() == 'on demand') return 'On Demand';
    if (raw['onDemand'] == true) return 'On Demand';
    return _n('price');
  }

  bool get isOnDemand => price is String;
  String get priceLabel => Fmt.price(price);

  // ── Features ────────────────────────────────────────────────────────────
  String? get bedrooms => _s('bedrooms');
  String? get floorNo => _s('floorNo');
  String? get kitchen => _s('kitchen');
  String? get kitchenType => _s('kitchenType');
  String? get balconies => _s('balconies');
  String? get numberOfFloors => _s('numberOfFloors');
  String? get western => _s('western');
  String? get attachedBathrooms => _s('attachedBathrooms');
  String? get carParking => _s('carParking');
  String? get lift => _s('lift');
  String? get furnished => _s('furnished');
  String? get facing => _s('facing');
  String? get salesMode => _s('salesMode');
  String? get salesType => _s('salesType');
  String? get postedBy => _s('postedBy');
  String? get description => _s('description');
  String? get bestTimeToCall => _s('bestTimeToCall');
  String? get ownerName => _s('ownerName');
  String? get email => _s('email');

  // ── Location ────────────────────────────────────────────────────────────
  String? get country => _s('country');
  String? get state => _s('state');
  String? get city => _s('city');
  String? get district => _s('district');
  String? get nagar => _s('nagar');
  String? get area => _s('area');
  String? get streetName => _s('streetName');
  String? get doorNumber => _s('doorNumber');
  String? get pinCode => _s('pinCode');
  String? get locationCoordinates => _s('locationCoordinates');

  /// "lat,lng" -> (lat, lng); tolerant of the loose formats stored in Mongo.
  ({double lat, double lng})? get coordinates {
    final raw = locationCoordinates;
    if (raw == null) return null;
    final m = RegExp(r'([+-]?\d+(?:\.\d+)?)[^\d+-]+([+-]?\d+(?:\.\d+)?)')
        .firstMatch(raw);
    if (m == null) return null;
    final lat = double.tryParse(m.group(1)!);
    final lng = double.tryParse(m.group(2)!);
    if (lat == null || lng == null) return null;
    return (lat: lat, lng: lng);
  }

  /// First three non-empty location parts, exactly like the feed card:
  /// nagar, area, city, district, state.
  String get locationLine {
    final parts = [nagar, area, city, district, state]
        .where((v) => v != null && v.trim().isNotEmpty)
        .map((v) => Fmt.titleCase(v))
        .toList();
    if (parts.isEmpty) return 'N/A, N/A';
    return parts.take(3).join(', ');
  }

  /// Full address used on the detail screen.
  String get fullAddress {
    final parts = [doorNumber, streetName, nagar, area, city, district, state, pinCode]
        .where((v) => v != null && v.trim().isNotEmpty)
        .toList();
    return parts.isEmpty ? 'N/A' : parts.join(', ');
  }

  // ── Media ───────────────────────────────────────────────────────────────
  List<String> get photoPaths => _stringList('photos');
  List<String> get videoPaths => _stringList('video');

  List<String> get photoUrls =>
      photoPaths.map(Fmt.mediaUrl).whereType<String>().toList();
  List<String> get videoUrls =>
      videoPaths.map(Fmt.mediaUrl).whereType<String>().toList();

  String? get coverPhotoUrl => photoUrls.isEmpty ? null : photoUrls.first;

  List<String> _stringList(String key) {
    final v = raw[key];
    if (v is List) {
      return v
          .map((e) => e?.toString().trim() ?? '')
          .where((e) => e.isNotEmpty)
          .toList();
    }
    if (v is String && v.trim().isNotEmpty) return [v.trim()];
    return const [];
  }

  // ── Timestamps ──────────────────────────────────────────────────────────
  DateTime? get createdAt => Fmt.parseDate(raw['createdAt']);
  DateTime? get updatedAt => Fmt.parseDate(raw['updatedAt']);

  /// The card shows updatedAt when it differs from createdAt.
  DateTime? get displayDate {
    final u = updatedAt, c = createdAt;
    if (u != null && c != null && u != c) return u;
    return c ?? u;
  }

  /// The number a buyer should actually dial (PPCID masking honoured).
  String? get displayContact =>
      setPpcId ? (assignedPhoneNumber ?? phoneNumber) : phoneNumber;

  /// Phone lists the backend embeds on the document.
  List<String> phonesIn(String key) {
    final v = raw[key];
    if (v is! List) return const [];
    return v
        .map((e) => e is Map ? e['phoneNumber']?.toString() : e?.toString())
        .whereType<String>()
        .where((e) => e.trim().isNotEmpty)
        .toList();
  }

  bool isFavoritedBy(String? phone) {
    if (phone == null) return false;
    final plain = Fmt.plainPhone(phone);
    return phonesIn('favoriteRequests').any((p) => Fmt.plainPhone(p) == plain);
  }

  bool hasInterestFrom(String? phone) {
    if (phone == null) return false;
    final plain = Fmt.plainPhone(phone);
    return phonesIn('interestRequests').any((p) => Fmt.plainPhone(p) == plain);
  }
}
