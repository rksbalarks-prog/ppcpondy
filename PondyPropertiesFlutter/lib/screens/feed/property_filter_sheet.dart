import 'package:flutter/material.dart';

import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/property.dart';

/// The filter state behind the feed's "Simple / Advanced search" modals.
///
/// The web keeps two overlapping filter objects (`filters` + `advancedFilters`)
/// and re-derives the list on every render; this collapses them into one
/// immutable value with the same matching rules.
class PropertyFilters {
  const PropertyFilters({
    this.ppcId,
    this.propertyModes = const {},
    this.propertyTypes = const {},
    this.minPrice,
    this.maxPrice,
    this.bedrooms,
    this.floorNo,
    this.city,
    this.bankLoan,
    this.negotiation,
    this.propertyApproved,
    this.furnished,
    this.facing,
    this.ownership,
    this.carParking,
    this.lift,
    this.minTotalArea,
    this.withPhotosOnly = false,
    this.withLocationOnly = false,
    this.sort = PropertySort.newest,
  });

  final String? ppcId;
  final Set<String> propertyModes;
  final Set<String> propertyTypes;
  final num? minPrice;
  final num? maxPrice;
  final String? bedrooms;
  final String? floorNo;
  final String? city;
  final String? bankLoan;
  final String? negotiation;
  final String? propertyApproved;
  final String? furnished;
  final String? facing;
  final String? ownership;
  final String? carParking;
  final String? lift;
  final num? minTotalArea;
  final bool withPhotosOnly;
  final bool withLocationOnly;
  final PropertySort sort;

  PropertyFilters copyWith({
    Object? ppcId = _sentinel,
    Set<String>? propertyModes,
    Set<String>? propertyTypes,
    Object? minPrice = _sentinel,
    Object? maxPrice = _sentinel,
    Object? bedrooms = _sentinel,
    Object? floorNo = _sentinel,
    Object? city = _sentinel,
    Object? bankLoan = _sentinel,
    Object? negotiation = _sentinel,
    Object? propertyApproved = _sentinel,
    Object? furnished = _sentinel,
    Object? facing = _sentinel,
    Object? ownership = _sentinel,
    Object? carParking = _sentinel,
    Object? lift = _sentinel,
    Object? minTotalArea = _sentinel,
    bool? withPhotosOnly,
    bool? withLocationOnly,
    PropertySort? sort,
  }) {
    return PropertyFilters(
      ppcId: ppcId == _sentinel ? this.ppcId : ppcId as String?,
      propertyModes: propertyModes ?? this.propertyModes,
      propertyTypes: propertyTypes ?? this.propertyTypes,
      minPrice: minPrice == _sentinel ? this.minPrice : minPrice as num?,
      maxPrice: maxPrice == _sentinel ? this.maxPrice : maxPrice as num?,
      bedrooms: bedrooms == _sentinel ? this.bedrooms : bedrooms as String?,
      floorNo: floorNo == _sentinel ? this.floorNo : floorNo as String?,
      city: city == _sentinel ? this.city : city as String?,
      bankLoan: bankLoan == _sentinel ? this.bankLoan : bankLoan as String?,
      negotiation:
          negotiation == _sentinel ? this.negotiation : negotiation as String?,
      propertyApproved: propertyApproved == _sentinel
          ? this.propertyApproved
          : propertyApproved as String?,
      furnished: furnished == _sentinel ? this.furnished : furnished as String?,
      facing: facing == _sentinel ? this.facing : facing as String?,
      ownership: ownership == _sentinel ? this.ownership : ownership as String?,
      carParking:
          carParking == _sentinel ? this.carParking : carParking as String?,
      lift: lift == _sentinel ? this.lift : lift as String?,
      minTotalArea:
          minTotalArea == _sentinel ? this.minTotalArea : minTotalArea as num?,
      withPhotosOnly: withPhotosOnly ?? this.withPhotosOnly,
      withLocationOnly: withLocationOnly ?? this.withLocationOnly,
      sort: sort ?? this.sort,
    );
  }

  static const Object _sentinel = Object();

  int get activeCount => [
        ppcId,
        propertyModes.isEmpty ? null : propertyModes,
        propertyTypes.isEmpty ? null : propertyTypes,
        minPrice,
        maxPrice,
        bedrooms,
        floorNo,
        city,
        bankLoan,
        negotiation,
        propertyApproved,
        furnished,
        facing,
        ownership,
        carParking,
        lift,
        minTotalArea,
        withPhotosOnly ? true : null,
        withLocationOnly ? true : null,
        sort == PropertySort.newest ? null : sort,
      ].whereType<Object>().length;

  bool get isActive => activeCount > 0;

  List<String> get chips => [
        if (ppcId != null) 'ID: $ppcId',
        ...propertyModes,
        ...propertyTypes,
        if (minPrice != null) 'Min ${Fmt.price(minPrice)}',
        if (maxPrice != null) 'Max ${Fmt.price(maxPrice)}',
        if (bedrooms != null) '$bedrooms BHK',
        if (floorNo != null) 'Floor ${Fmt.ordinalFloor(floorNo)}',
        if (city != null) city!,
        if (bankLoan != null) 'Bank loan: $bankLoan',
        if (negotiation != null) 'Negotiable: $negotiation',
        if (propertyApproved != null) 'Approved: $propertyApproved',
        if (furnished != null) furnished!,
        if (facing != null) '$facing facing',
        if (ownership != null) ownership!,
        if (carParking != null) 'Parking: $carParking',
        if (lift != null) 'Lift: $lift',
        if (minTotalArea != null) 'Area ≥ $minTotalArea',
        if (withPhotosOnly) 'With photos',
        if (withLocationOnly) 'With location',
        if (sort != PropertySort.newest) sort.label,
      ];

  /// The equivalent of getFilteredProperties() on the web.
  List<Property> apply(List<Property> input) {
    var items = input.where((p) {
      if (ppcId != null && !p.ppcId.contains(ppcId!)) return false;

      if (propertyModes.isNotEmpty &&
          !propertyModes.any((m) =>
              (p.propertyMode ?? '').toLowerCase() == m.toLowerCase())) {
        return false;
      }
      if (propertyTypes.isNotEmpty &&
          !propertyTypes.any((t) =>
              (p.propertyType ?? '').toLowerCase() == t.toLowerCase())) {
        return false;
      }

      final price = p.price;
      if (price is num) {
        if (minPrice != null && price < minPrice!) return false;
        if (maxPrice != null && price > maxPrice!) return false;
      } else if (minPrice != null || maxPrice != null) {
        // "On Demand" listings have no comparable price.
        return false;
      }

      if (bedrooms != null && p.bedrooms != bedrooms) return false;
      if (floorNo != null && p.floorNo != floorNo) return false;
      if (city != null &&
          !(p.city ?? '').toLowerCase().contains(city!.toLowerCase())) {
        return false;
      }
      if (!_matches(bankLoan, p.bankLoan)) return false;
      if (!_matches(negotiation, p.negotiation)) return false;
      if (!_matches(propertyApproved, p.propertyApproved)) return false;
      if (!_matches(furnished, p.furnished)) return false;
      if (!_matches(facing, p.facing)) return false;
      if (!_matches(ownership, p.ownership)) return false;
      if (!_matches(carParking, p.carParking)) return false;
      if (!_matches(lift, p.lift)) return false;

      if (minTotalArea != null && (p.totalArea ?? 0) < minTotalArea!) return false;
      if (withPhotosOnly && p.photoUrls.isEmpty) return false;
      if (withLocationOnly && p.coordinates == null) return false;

      return true;
    }).toList();

    items.sort(sort.comparator);
    return items;
  }

  static bool _matches(String? filter, String? value) {
    if (filter == null) return true;
    return (value ?? '').toLowerCase() == filter.toLowerCase();
  }
}

/// The sort options exposed by SortProperty.jsx and its sibling routes.
enum PropertySort {
  newest('Newest first'),
  oldest('Oldest first'),
  priceLowToHigh('Price: low to high'),
  priceHighToLow('Price: high to low'),
  mostViewed('Most viewed');

  const PropertySort(this.label);

  final String label;

  int Function(Property, Property) get comparator => switch (this) {
        PropertySort.newest => (a, b) => _byDate(b, a),
        PropertySort.oldest => (a, b) => _byDate(a, b),
        PropertySort.priceLowToHigh => (a, b) => _byPrice(a, b),
        PropertySort.priceHighToLow => (a, b) => _byPrice(b, a),
        PropertySort.mostViewed => (a, b) => b.views.compareTo(a.views),
      };

  static int _byDate(Property a, Property b) {
    final ad = a.displayDate, bd = b.displayDate;
    if (ad == null && bd == null) return 0;
    if (ad == null) return 1;
    if (bd == null) return -1;
    return ad.compareTo(bd);
  }

  static int _byPrice(Property a, Property b) {
    final ap = a.price is num ? a.price as num : double.infinity;
    final bp = b.price is num ? b.price as num : double.infinity;
    return ap.compareTo(bp);
  }
}

/// Bottom-sheet version of the web's filter modals. Options are derived from
/// the loaded feed so they always reflect real data.
class PropertyFilterSheet extends StatefulWidget {
  const PropertyFilterSheet({
    super.key,
    required this.initial,
    required this.source,
  });

  final PropertyFilters initial;
  final List<Property> source;

  @override
  State<PropertyFilterSheet> createState() => _PropertyFilterSheetState();
}

class _PropertyFilterSheetState extends State<PropertyFilterSheet> {
  late PropertyFilters _f = widget.initial;
  late final TextEditingController _ppcIdController =
      TextEditingController(text: widget.initial.ppcId ?? '');

  /// Price buckets from utils/pricingBuckets.js.
  static const List<({String label, num? min, num? max})> _priceRanges = [
    (label: 'Below ₹10 Lakhs', min: null, max: 1000000),
    (label: '₹10L – ₹25L', min: 1000000, max: 2500000),
    (label: '₹25L – ₹50L', min: 2500000, max: 5000000),
    (label: '₹50L – ₹1 Cr', min: 5000000, max: 10000000),
    (label: '₹1 Cr – ₹2 Cr', min: 10000000, max: 20000000),
    (label: 'Above ₹2 Cr', min: 20000000, max: null),
  ];

  @override
  void dispose() {
    _ppcIdController.dispose();
    super.dispose();
  }

  List<String> _distinct(String? Function(Property) pick) {
    final values = widget.source
        .map(pick)
        .whereType<String>()
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty && s.toLowerCase() != 'n/a')
        .toSet()
        .toList()
      ..sort();
    return values;
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            _handle(),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                children: [
                  _label('PPC-ID'),
                  TextField(
                    controller: _ppcIdController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'e.g. 10245'),
                    onChanged: (v) => setState(
                      () => _f = _f.copyWith(ppcId: v.trim().isEmpty ? null : v.trim()),
                    ),
                  ),
                  _multiSection(
                    'Property Mode',
                    _distinct((p) => p.propertyMode),
                    _f.propertyModes,
                    (set) => setState(() => _f = _f.copyWith(propertyModes: set)),
                  ),
                  _multiSection(
                    'Property Type',
                    _distinct((p) => p.propertyType),
                    _f.propertyTypes,
                    (set) => setState(() => _f = _f.copyWith(propertyTypes: set)),
                  ),
                  _label('Budget'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: _priceRanges.map((r) {
                      final selected =
                          _f.minPrice == r.min && _f.maxPrice == r.max;
                      return ChoiceChip(
                        label: Text(r.label, style: const TextStyle(fontSize: 12)),
                        selected: selected,
                        onSelected: (_) => setState(() {
                          _f = selected
                              ? _f.copyWith(minPrice: null, maxPrice: null)
                              : _f.copyWith(minPrice: r.min, maxPrice: r.max);
                        }),
                        selectedColor: AppColors.searchBottom,
                        side: const BorderSide(color: Color(0xFFDDDDDD)),
                      );
                    }).toList(),
                  ),
                  _singleSection(
                    'Bedrooms (BHK)',
                    _distinct((p) => p.bedrooms),
                    _f.bedrooms,
                    (v) => setState(() => _f = _f.copyWith(bedrooms: v)),
                  ),
                  _singleSection(
                    'Floor',
                    _distinct((p) => p.floorNo),
                    _f.floorNo,
                    (v) => setState(() => _f = _f.copyWith(floorNo: v)),
                    labelBuilder: Fmt.ordinalFloor,
                  ),
                  _singleSection(
                    'City',
                    _distinct((p) => p.city),
                    _f.city,
                    (v) => setState(() => _f = _f.copyWith(city: v)),
                  ),
                  _singleSection(
                    'Ownership',
                    _distinct((p) => p.ownership),
                    _f.ownership,
                    (v) => setState(() => _f = _f.copyWith(ownership: v)),
                  ),
                  _singleSection(
                    'Bank Loan',
                    _distinct((p) => p.bankLoan),
                    _f.bankLoan,
                    (v) => setState(() => _f = _f.copyWith(bankLoan: v)),
                  ),
                  _singleSection(
                    'Negotiation',
                    _distinct((p) => p.negotiation),
                    _f.negotiation,
                    (v) => setState(() => _f = _f.copyWith(negotiation: v)),
                  ),
                  _singleSection(
                    'Property Approved',
                    _distinct((p) => p.propertyApproved),
                    _f.propertyApproved,
                    (v) => setState(() => _f = _f.copyWith(propertyApproved: v)),
                  ),
                  _singleSection(
                    'Furnished',
                    _distinct((p) => p.furnished),
                    _f.furnished,
                    (v) => setState(() => _f = _f.copyWith(furnished: v)),
                  ),
                  _singleSection(
                    'Facing',
                    _distinct((p) => p.facing),
                    _f.facing,
                    (v) => setState(() => _f = _f.copyWith(facing: v)),
                  ),
                  _singleSection(
                    'Car Parking',
                    _distinct((p) => p.carParking),
                    _f.carParking,
                    (v) => setState(() => _f = _f.copyWith(carParking: v)),
                  ),
                  _singleSection(
                    'Lift',
                    _distinct((p) => p.lift),
                    _f.lift,
                    (v) => setState(() => _f = _f.copyWith(lift: v)),
                  ),
                  _label('Quick filters'),
                  SwitchListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: AppColors.teal,
                    title: const Text('Only with photos',
                        style: TextStyle(fontSize: 13)),
                    value: _f.withPhotosOnly,
                    onChanged: (v) =>
                        setState(() => _f = _f.copyWith(withPhotosOnly: v)),
                  ),
                  SwitchListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: AppColors.teal,
                    title: const Text('Only with map location',
                        style: TextStyle(fontSize: 13)),
                    value: _f.withLocationOnly,
                    onChanged: (v) =>
                        setState(() => _f = _f.copyWith(withLocationOnly: v)),
                  ),
                  _label('Sort by'),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: PropertySort.values
                        .map((s) => ChoiceChip(
                              label: Text(s.label,
                                  style: const TextStyle(fontSize: 12)),
                              selected: _f.sort == s,
                              onSelected: (_) =>
                                  setState(() => _f = _f.copyWith(sort: s)),
                              selectedColor: AppColors.searchBottom,
                              side: const BorderSide(color: Color(0xFFDDDDDD)),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
            _actions(),
          ],
        ),
      ),
    );
  }

  Widget _handle() => Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 42,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Text(
              'Filter Properties',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.tealDark,
              ),
            ),
          ),
        ],
      );

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 8),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.tealDark,
          ),
        ),
      );

  Widget _multiSection(
    String title,
    List<String> options,
    Set<String> selected,
    ValueChanged<Set<String>> onChanged,
  ) {
    if (options.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('$title (${selected.length})'),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: options.map((o) {
            final isOn = selected.contains(o);
            return FilterChip(
              label: Text(Fmt.cap(o), style: const TextStyle(fontSize: 12)),
              selected: isOn,
              onSelected: (_) {
                final next = {...selected};
                isOn ? next.remove(o) : next.add(o);
                onChanged(next);
              },
              selectedColor: AppColors.searchBottom,
              side: const BorderSide(color: Color(0xFFDDDDDD)),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _singleSection(
    String title,
    List<String> options,
    String? selected,
    ValueChanged<String?> onChanged, {
    String Function(String)? labelBuilder,
  }) {
    if (options.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(title),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: options.map((o) {
            final isOn = selected == o;
            return ChoiceChip(
              label: Text(
                labelBuilder?.call(o) ?? Fmt.cap(o),
                style: const TextStyle(fontSize: 12),
              ),
              selected: isOn,
              onSelected: (_) => onChanged(isOn ? null : o),
              selectedColor: AppColors.searchBottom,
              side: const BorderSide(color: Color(0xFFDDDDDD)),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _actions() {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  _ppcIdController.clear();
                  setState(() => _f = const PropertyFilters());
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.tealSoft,
                  side: const BorderSide(color: AppColors.tealSoft),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                child: const Text('CLEAR ALL'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: () => Navigator.pop(context, _f),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.tealSoft,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                child: const Text('SEARCH'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
