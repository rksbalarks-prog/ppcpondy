import '../core/formatters.dart';

/// A buyer-requirement record from `BuyerAssistance/BuyerAssistanceModel.js`.
class BuyerAssistance {
  BuyerAssistance(this.raw);

  final Map<String, dynamic> raw;

  factory BuyerAssistance.fromJson(Map<String, dynamic> json) =>
      BuyerAssistance(json);

  String? _s(String key) {
    final v = raw[key];
    if (v == null) return null;
    final s = v.toString().trim();
    return s.isEmpty || s.toLowerCase() == 'null' || s.toLowerCase() == 'n/a'
        ? null
        : s;
  }

  num? _n(String key) {
    final v = raw[key];
    if (v == null) return null;
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll(',', '').trim());
  }

  String get id => _s('_id') ?? '';
  String get baId => _s('ba_id') ?? '';
  String? get name => _s('baName');
  String? get phoneNumber => _s('phoneNumber');
  String? get altPhoneNumber => _s('altPhoneNumber') ?? _s('alternatePhone');
  String? get assignedPhoneNumber => _s('assignedPhoneNumber');
  bool get setPpcId => raw['setPpcId'] == true;

  String? get displayContact =>
      setPpcId ? (assignedPhoneNumber ?? phoneNumber) : phoneNumber;

  String? get city => _s('city');
  String? get area => _s('area');
  String? get state => _s('state');
  String? get pincode => _s('pincode') ?? _s('pinCode');

  String? get propertyMode => _s('propertyMode');
  String? get propertyType => _s('propertyType');
  String? get propertyAge => _s('propertyAge');
  String? get propertyApproved => _s('propertyApproved');
  String? get bedrooms => _s('bedrooms') ?? _s('BHK');
  String? get totalArea => _s('totalArea');
  String? get areaUnit => _s('areaUnit');
  String? get bankLoan => _s('bankLoan');
  String? get loanInput => _s('loanInput');
  String? get facing => _s('facing');
  String? get paymentType => _s('paymentType');
  String? get description => _s('description');

  num? get minPrice => _n('minPrice');
  num? get maxPrice => _n('maxPrice');

  /// "₹25.00 Lakhs – ₹40.00 Lakhs"
  String get budgetLabel {
    final lo = minPrice, hi = maxPrice;
    if (lo == null && hi == null) return 'Budget not specified';
    if (lo != null && hi != null) return '${Fmt.price(lo)} – ${Fmt.price(hi)}';
    return Fmt.price(lo ?? hi);
  }

  String get locationLine {
    final parts = [area, city, state]
        .where((v) => v != null && v.trim().isNotEmpty)
        .map(Fmt.titleCase)
        .toList();
    return parts.isEmpty ? 'N/A' : parts.join(', ');
  }

  String get status => _s('ba_status') ?? 'baPending';
  bool get isActive => status == 'baActive';
  String get postedBy => _s('ba_postBy') ?? 'User';

  List<String> get interestedUserPhones {
    final v = raw['interestedUserPhone'];
    if (v is List) {
      return v.map((e) => e.toString()).where((e) => e.isNotEmpty).toList();
    }
    return const [];
  }

  DateTime? get createdAt => Fmt.parseDate(raw['createdAt']);
  DateTime? get updatedAt => Fmt.parseDate(raw['updatedAt']);
}
