import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/auth_service.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/property_card.dart';
import 'property_filter_sheet.dart';

/// Which backend feed a [PropertyFeedScreen] instance shows.
enum FeedSource {
  all,
  pondicherry,
  chennai,
  featured,
  zeroView,
  rent,

  // Curated collections — the web's `/sort/*` routes.
  bankLoan,
  housesBelow30L,
  withLocation,
  mostViewed,
  lastViewed;

  /// Title used when the feed is opened as its own page.
  String get title => switch (this) {
        FeedSource.all => 'All Property',
        FeedSource.pondicherry => 'Pondicherry Property',
        FeedSource.chennai => 'Chennai Property',
        FeedSource.featured => 'Featured Property',
        FeedSource.zeroView => 'Not Viewed Property',
        FeedSource.rent => 'Rent Property',
        FeedSource.bankLoan => 'Bank Loan Properties',
        FeedSource.housesBelow30L => 'Houses Below ₹30 Lakhs',
        FeedSource.withLocation => 'Properties With Location',
        FeedSource.mostViewed => 'My Most Viewed',
        FeedSource.lastViewed => 'My Last Viewed',
      };
}

/// The listing feed — AllProperty.jsx / PyProperty.jsx / ChennaiProperty.jsx /
/// FeatureProperty.jsx / ZeroView.jsx, which are the same screen against
/// different endpoints.
class PropertyFeedScreen extends StatefulWidget {
  const PropertyFeedScreen({
    super.key,
    required this.source,
    this.showAds = false,
    this.title,
  });

  final FeedSource source;

  /// The home feed splices promo banners between every 6th card.
  final bool showAds;

  /// When set the screen renders standalone (with its own AppBar).
  final String? title;

  @override
  State<PropertyFeedScreen> createState() => _PropertyFeedScreenState();
}

class _PropertyFeedScreenState extends State<PropertyFeedScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  List<Property> _all = const [];
  List<AdImage> _ads = const [];
  Map<String, int> _imageCounts = const {};
  Set<String> _visited = {};

  bool _loading = true;
  String? _error;

  List<String> _suggestions = const [];
  String _areaQuery = '';
  Timer? _debounce;

  PropertyFilters _filters = const PropertyFilters();

  @override
  void initState() {
    super.initState();
    _visited = Session.getStringList('visitedProperties').toSet();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<SessionProvider>();
      AuthService.recordView(session.phoneNumber, _analyticsName);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String get _analyticsName => switch (widget.source) {
        FeedSource.all => 'Mobile Home',
        FeedSource.pondicherry => 'Py Property',
        FeedSource.chennai => 'Chennai Property',
        FeedSource.featured => 'Feature Property',
        FeedSource.zeroView => 'Zero View Property',
        FeedSource.rent => 'Rent Property',
        _ => widget.source.title,
      };

  Future<List<Property>> _fetch() {
    final phone = context.read<SessionProvider>().phoneNumber;
    return switch (widget.source) {
      FeedSource.all => PropertyService.fetchHomeFeed(),
      FeedSource.pondicherry => PropertyService.fetchPondicherryProperties(),
      FeedSource.chennai => PropertyService.fetchChennaiProperties(),
      FeedSource.featured => PropertyService.fetchFeaturedProperties(),
      FeedSource.zeroView => PropertyService.fetchZeroViewProperties(),
      FeedSource.rent => PropertyService.fetchSaleProperties(),
      FeedSource.bankLoan => PropertyService.fetchBankLoanProperties(),
      FeedSource.housesBelow30L => PropertyService.fetchHousesBelow30L(),
      FeedSource.withLocation =>
        PropertyService.fetchLocationAppliedProperties(),
      FeedSource.mostViewed => phone == null
          ? Future.value(const <Property>[])
          : PropertyService.fetchMostViewed(phone),
      FeedSource.lastViewed => phone == null
          ? Future.value(const <Property>[])
          : PropertyService.fetchLastViewed(phone),
    };
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await _fetch();
      if (!mounted) return;
      setState(() {
        _all = items;
        _loading = false;
      });

      // Photo-count badges and banners load after the cards, like the web.
      unawaited(_loadImageCounts(items));
      if (widget.showAds) unawaited(_loadAds());
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  Future<void> _loadImageCounts(List<Property> items) async {
    final counts = await PropertyService.fetchImageCounts(items.take(40).toList());
    if (mounted) setState(() => _imageCounts = counts);
  }

  Future<void> _loadAds() async {
    final ads = await PropertyService.fetchFeedAds();
    if (mounted) setState(() => _ads = ads);
  }

  void _onSearchChanged(String value) {
    setState(() => _areaQuery = value);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      if (value.trim().length < 2) {
        if (mounted) setState(() => _suggestions = const []);
        return;
      }
      final remote = await PropertyService.searchAreas(value);
      // Fall back to what's already on screen so suggestions still work when
      // the /areas endpoint is unavailable.
      final local = _all
          .expand((p) => [p.area, p.city, p.district, p.nagar, p.pinCode])
          .whereType<String>()
          .where((s) => s.toLowerCase().contains(value.toLowerCase()))
          .toSet()
          .toList();
      if (mounted) {
        setState(() =>
            _suggestions = {...remote, ...local}.take(8).toList(growable: false));
      }
    });
  }

  /// getFilteredProperties() — area/pincode text plus the filter sheet values.
  List<Property> get _filtered {
    var items = _all;

    final q = _areaQuery.trim().toLowerCase();
    if (q.isNotEmpty) {
      items = items.where((p) {
        final haystack = [
          p.ppcId,
          p.area,
          p.city,
          p.district,
          p.nagar,
          p.state,
          p.pinCode,
          p.streetName,
          p.propertyType,
          p.propertyMode,
        ].whereType<String>().join(' ').toLowerCase();
        return haystack.contains(q);
      }).toList();
    }

    return _filters.apply(items);
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<PropertyFilters>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PropertyFilterSheet(initial: _filters, source: _all),
    );
    if (result != null) setState(() => _filters = result);
  }

  Future<void> _openProperty(Property p) async {
    setState(() => _visited = {..._visited, p.ppcId});
    Session.setStringList('visitedProperties', _visited.toList());

    final session = context.read<SessionProvider>();
    if (session.isLoggedIn) {
      unawaited(PropertyService.saveView(
        phoneNumber: session.phoneNumber!,
        ppcId: p.ppcId,
      ));
    }
    if (!mounted) return;
    // Hand over the visible list so the detail screen's swipe-left walks the
    // same order the user is looking at, like the web's `state.properties`.
    await Navigator.pushNamed(
      context,
      AppRoutes.propertyDetail,
      arguments: {
        'ppcId': p.ppcId,
        'siblings': _filtered.map((e) => e.ppcId).toList(),
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (widget.title == null) return body;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title!)),
      body: body,
    );
  }

  Widget _body() {
    if (_loading) return const AppLoader(label: 'Loading properties…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);

    final items = _filtered;

    return Column(
      children: [
        _searchBar(),
        if (_filters.isActive) _activeFilterStrip(),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.teal,
            onRefresh: _load,
            child: items.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 60),
                      EmptyState(
                        message: _areaQuery.isEmpty && !_filters.isActive
                            ? 'No properties available right now.'
                            : 'No properties match your search criteria.',
                        action: (_areaQuery.isNotEmpty || _filters.isActive)
                            ? OutlinedButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _areaQuery = '';
                                    _filters = const PropertyFilters();
                                    _suggestions = const [];
                                  });
                                },
                                child: const Text('Clear search'),
                              )
                            : null,
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.only(top: 10, bottom: 24),
                    itemCount: items.length + _adSlots(items.length),
                    itemBuilder: (context, index) => _row(items, index),
                  ),
          ),
        ),
      ],
    );
  }

  /// One banner after every 6 cards, when banners are enabled and available.
  /// Banners cycle if there are fewer of them than slots.
  int _adSlots(int cardCount) {
    if (!widget.showAds || _ads.isEmpty) return 0;
    return cardCount ~/ 6;
  }

  Widget _row(List<Property> items, int index) {
    if (widget.showAds && _ads.isNotEmpty) {
      // Position 6, 13, 20 … are banners (6 cards then 1 banner, repeating).
      const blockSize = 7;
      final positionInBlock = index % blockSize;
      final blockIndex = index ~/ blockSize;
      if (positionInBlock == 6) {
        final ad = _ads[blockIndex % _ads.length];
        return AdBannerCard(
          imageUrl: ad.imageUrl!,
          onTap: ad.link == null ? null : () => launchExternal(context, ad.link!),
        );
      }
      final cardIndex = blockIndex * 6 + positionInBlock;
      if (cardIndex >= items.length) return const SizedBox.shrink();
      return _card(items[cardIndex]);
    }
    return _card(items[index]);
  }

  Widget _card(Property p) => PropertyCard(
        property: p,
        imageCount: _imageCounts[p.ppcId],
        visited: _visited.contains(p.ppcId),
        onTap: () => _openProperty(p),
      );

  Widget _searchBar() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 6, 14, 2),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [AppColors.searchTop, AppColors.searchBottom],
                    ),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.searchBorder),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x142F747F),
                        blurRadius: 6,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.only(left: 12, right: 6),
                  child: Row(
                    children: [
                      const Icon(Icons.search, size: 17, color: AppColors.tealDark),
                      const SizedBox(width: 6),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: _onSearchChanged,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: Color(0xFF1F3A3F),
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Search area, pincode or PPC-ID',
                            filled: false,
                            isDense: true,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      if (_areaQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() {
                              _areaQuery = '';
                              _suggestions = const [];
                            });
                          },
                          child: const CircleAvatar(
                            radius: 11,
                            backgroundColor: AppColors.tealDark,
                            child: Icon(Icons.close, size: 12, color: Colors.white),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _filterButton(),
            ],
          ),
        ),
        if (_suggestions.isNotEmpty) _suggestionList(),
      ],
    );
  }

  Widget _filterButton() {
    return Stack(
      children: [
        Material(
          color: AppColors.tealDark,
          borderRadius: BorderRadius.circular(999),
          child: InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: _openFilters,
            child: const Padding(
              padding: EdgeInsets.all(9),
              child: Icon(Icons.tune, size: 18, color: Colors.white),
            ),
          ),
        ),
        if (_filters.activeCount > 0)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: AppColors.orangeRed,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
              child: Text(
                '${_filters.activeCount}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _suggestionList() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14),
      constraints: const BoxConstraints(maxHeight: 200),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.searchBorder),
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(color: Color(0x1F2F747F), blurRadius: 18, offset: Offset(0, 6)),
        ],
      ),
      child: ListView.builder(
        shrinkWrap: true,
        padding: const EdgeInsets.symmetric(vertical: 4),
        itemCount: _suggestions.length,
        itemBuilder: (_, i) => InkWell(
          onTap: () {
            _searchController.text = _suggestions[i];
            setState(() {
              _areaQuery = _suggestions[i];
              _suggestions = const [];
            });
            FocusScope.of(context).unfocus();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            child: Text(
              _suggestions[i],
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF1F3A3F)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _activeFilterStrip() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        children: [
          ..._filters.chips.map(
            (chip) => Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Chip(
                label: Text(chip, style: const TextStyle(fontSize: 11)),
                backgroundColor: AppColors.searchBottom,
                side: const BorderSide(color: AppColors.searchBorder),
                visualDensity: VisualDensity.compact,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
          TextButton(
            onPressed: () => setState(() => _filters = const PropertyFilters()),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.orangeRed,
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            child: const Text('Clear all', style: TextStyle(fontSize: 11)),
          ),
        ],
      ),
    );
  }
}
