import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/city_base.dart';
import '../core/session.dart';
import '../core/theme.dart';
import '../routes.dart';
import '../services/auth_service.dart';
import '../state/session_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/app_navbar.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/category_bar.dart';
import '../widgets/common.dart';
import 'buyer/buyer_assistance_form_screen.dart';
import 'buyer/buyer_list_screen.dart';
import 'feed/matrimony_screen.dart';
import 'feed/property_feed_screen.dart';
import 'feed/property_map_screen.dart';
import 'feed/property_video_screen.dart';
import 'menu/menu_screen.dart';
import 'property/my_property_screen.dart';

/// Main.jsx — the app shell: city switcher, navbar, category strip, swappable
/// content area and the bottom navigation.
class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialTab});

  final String? initialTab;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late String _active;

  /// The top-bar strip, in the same order as `topBarItems` in Main.jsx.
  static const List<CategoryItem> _categories = [
    CategoryItem(
        id: 'topPyProperty',
        label: 'Py Property',
        asset: 'assets/images/ppc_sentyourinterest.png'),
    CategoryItem(
        id: 'topChennaiProperty',
        label: 'Chennai Property',
        asset: 'assets/images/ppc_sentyourinterest.png'),
    CategoryItem(
        id: 'topAllProperty',
        label: 'All Property',
        asset: 'assets/images/allprop50.png'),
    CategoryItem(
        id: 'topPropertyMap',
        label: 'Property Map',
        asset: 'assets/images/locations.png'),
    CategoryItem(
        id: 'topMBuyerList', label: 'Buyer List', asset: 'assets/images/bl50.png'),
    CategoryItem(
        id: 'topSaleProperty',
        label: 'Rent Property',
        asset: 'assets/images/rent_property-01.png'),
    CategoryItem(
        id: 'topFeatureProperty',
        label: 'Feature Property',
        asset: 'assets/images/fprop50.png'),
    CategoryItem(id: 'topGroom', label: 'Groom', asset: 'assets/images/groom.png'),
    CategoryItem(id: 'topBride', label: 'Bride', asset: 'assets/images/groom.png'),
    CategoryItem(
        id: 'topPropertyVideo',
        label: 'Property Video',
        asset: 'assets/images/groom.png'),
    CategoryItem(
        id: 'topNotViewedProperty',
        label: 'Not Viewed Property',
        asset: 'assets/images/nvprop50.png'),
    CategoryItem(
        id: 'topMyProperty', label: 'My Property', asset: 'assets/images/my50.png'),
    CategoryItem(
        id: 'topOwnerMenu', label: 'Owner Menu', asset: 'assets/images/seller50.png'),
    CategoryItem(
        id: 'topBuyerMenu', label: 'Buyer Menu', asset: 'assets/images/buyer50.png'),
  ];

  @override
  void initState() {
    super.initState();
    _active = widget.initialTab ??
        Session.getString(Session.kLastActiveContent) ??
        'topPyProperty';
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final session = context.read<SessionProvider>();
      AuthService.recordView(session.phoneNumber, 'Main');
      if (Session.getBool(Session.kFreshLogin)) _askRole();
    });
  }

  /// The one-time "Are you a Seller / Buyer / Visitor?" prompt the web shows
  /// on the first feed render after login (AllProperty.jsx `showRolePopup`).
  Future<void> _askRole() async {
    final role = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'What brings you here?',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _roleTile(ctx, 'Seller', 'I want to list a property',
                Icons.add_home_work_outlined),
            _roleTile(ctx, 'Buyer', 'I am looking to buy or rent',
                Icons.search),
            _roleTile(ctx, 'Visitor', 'Just browsing for now',
                Icons.visibility_outlined),
          ],
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Skip'),
          ),
        ],
      ),
    );

    await Session.setBool(Session.kFreshLogin, false);
    await Session.setString('userRole', role ?? 'Visitor');
    if (!mounted) return;

    switch (role) {
      case 'Seller':
        Navigator.pushNamed(context, AppRoutes.addProperty);
      case 'Buyer':
        _setActive(AppBottomNav.buyer);
      default:
        _setActive(AppBottomNav.home);
    }
  }

  Widget _roleTile(
    BuildContext ctx,
    String role,
    String subtitle,
    IconData icon,
  ) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.searchBottom,
        child: Icon(icon, size: 18, color: AppColors.teal),
      ),
      title: Text(
        role,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      onTap: () => Navigator.pop(ctx, role),
    );
  }

  void _setActive(String id) {
    if (id == _active) return;
    setState(() => _active = id);
    Session.setString(Session.kLastActiveContent, id);
  }

  /// renderContent() from Main.jsx.
  Widget _content() {
    switch (_active) {
      case 'topPyProperty':
        return const PropertyFeedScreen(
          key: ValueKey('py'),
          source: FeedSource.pondicherry,
        );
      case 'topChennaiProperty':
        return const PropertyFeedScreen(
          key: ValueKey('ch'),
          source: FeedSource.chennai,
        );
      case 'topAllProperty':
      case AppBottomNav.home:
        return const PropertyFeedScreen(
          key: ValueKey('all'),
          source: FeedSource.all,
          showAds: true,
        );
      case 'topPropertyMap':
        return const PropertyMapScreen(embedded: true);
      case 'topMBuyerList':
        return const BuyerListScreen(key: ValueKey('buyers'));
      case 'topSaleProperty':
        return const PropertyFeedScreen(
          key: ValueKey('sale'),
          source: FeedSource.rent,
        );
      case 'topFeatureProperty':
        return const PropertyFeedScreen(
          key: ValueKey('featured'),
          source: FeedSource.featured,
        );
      case 'topGroom':
        return const MatrimonyScreen(key: ValueKey('groom'), bride: false);
      case 'topBride':
        return const MatrimonyScreen(key: ValueKey('bride'), bride: true);
      case 'topPropertyVideo':
        return const PropertyVideoScreen(key: ValueKey('videos'));
      case 'topNotViewedProperty':
        return const PropertyFeedScreen(
          key: ValueKey('zero'),
          source: FeedSource.zeroView,
        );
      case 'topMyProperty':
      case AppBottomNav.property:
        return const MyPropertyScreen(key: ValueKey('mine'), embedded: true);
      case 'topOwnerMenu':
        return const MenuScreen(
          key: ValueKey('ownerMenu'),
          initialTab: MenuTab.ownerMenu,
          embedded: true,
        );
      case 'topBuyerMenu':
        return const MenuScreen(
          key: ValueKey('buyerMenu'),
          initialTab: MenuTab.buyerMenu,
          embedded: true,
        );
      case AppBottomNav.buyer:
        return const BuyerAssistanceFormScreen(
          key: ValueKey('assist'),
          embedded: true,
        );
      case AppBottomNav.more:
        return const MenuScreen(
          key: ValueKey('more'),
          initialTab: MenuTab.myAccount,
          embedded: true,
        );
      default:
        return const EmptyState(message: 'Page not found');
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await confirmDialog(
          context,
          message: 'Are you sure you want to exit the app?',
        );
        if (!leave || !mounted) return;
        // ignore: use_build_context_synchronously
        Navigator.maybePop(context);
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        drawer: const AppDrawer(),
        body: Column(
          children: [
            _citySwitcher(session),
            const AppNavbar(),
            CategoryBar(
              items: _categories,
              activeId: _active,
              onSelect: _setActive,
            ),
            Expanded(child: _content()),
          ],
        ),
        bottomNavigationBar: AppBottomNav(
          activeId: _active,
          onSelect: (id) {
            if (id == AppBottomNav.add) {
              Navigator.pushNamed(context, AppRoutes.addProperty);
              return;
            }
            _setActive(id);
          },
        ),
      ),
    );
  }

  /// The purple Pondicherry/Chennai pill bar at the very top (MoblieViews.jsx).
  Widget _citySwitcher(SessionProvider session) {
    return Container(
      color: AppColors.indigo,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      child: SafeArea(
        bottom: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: CityBase.bases.map((base) {
            final active = base == session.activeBase;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: GestureDetector(
                onTap: active ? null : () => _switchCity(session, base),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: active ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white),
                  ),
                  child: Text(
                    '📍 ${CityBase.cityName(base)}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: active ? AppColors.indigo : Colors.white,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Future<void> _switchCity(SessionProvider session, String base) async {
    await session.switchCity(base);
    if (!mounted) return;
    // The web does a full reload here so the feed re-fetches with the new base;
    // rebuilding the content with a fresh key achieves the same thing.
    setState(() {
      _active = base == 'CH' ? 'topChennaiProperty' : 'topPyProperty';
    });
    Session.setString(Session.kLastActiveContent, _active);
  }
}
