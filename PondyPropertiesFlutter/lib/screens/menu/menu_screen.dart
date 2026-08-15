import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../routes.dart';
import '../../services/account_service.dart';
import '../../services/auth_service.dart';
import '../../state/session_provider.dart';
import '../feed/property_feed_screen.dart';

enum MenuTab { myAccount, ownerMenu, buyerMenu }

/// MoreComponent.jsx / OwnerMenu.jsx / BuyerMenu.jsx — the three-tab hub with
/// live badge counts on every row.
class MenuScreen extends StatefulWidget {
  const MenuScreen({
    super.key,
    this.initialTab = MenuTab.myAccount,
    this.embedded = false,
  });

  final MenuTab initialTab;
  final bool embedded;

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  late MenuTab _tab = widget.initialTab;
  Map<String, int> _counts = const {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AuthService.recordView(
        context.read<SessionProvider>().phoneNumber,
        'More Menu',
      );
    });
  }

  Future<void> _load() async {
    // Reachable from a `.then()` after navigating away, so re-check first.
    if (!mounted) return;
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    final counts = await AccountService.fetchMenuCounts(session.phoneNumber!);
    if (mounted) {
      setState(() {
        _counts = counts;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: body,
    );
  }

  String get _title => switch (_tab) {
        MenuTab.myAccount => 'My Account',
        MenuTab.ownerMenu => 'Owner Menu',
        MenuTab.buyerMenu => 'Buyer Menu',
      };

  Widget _body() {
    return Column(
      children: [
        _tabs(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(12, 14, 12, 24),
              children: [
                if (_loading) const LinearProgressIndicator(minHeight: 2),
                switch (_tab) {
                  MenuTab.myAccount => _myAccountCard(),
                  MenuTab.ownerMenu => _ownerMenuCard(),
                  MenuTab.buyerMenu => _buyerMenuCard(),
                },
                const SizedBox(height: 18),
                Image.asset(
                  'assets/images/bottom.png',
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _tabs() {
    Widget tab(MenuTab value, String label) {
      final active = _tab == value;
      return Expanded(
        child: InkWell(
          onTap: () => setState(() => _tab = value),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: active ? AppColors.teal : Colors.white,
              border: const Border(
                right: BorderSide(color: Color(0xFFCCCCCC)),
                bottom: BorderSide(color: Color(0xFFCCCCCC)),
              ),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: active ? Colors.white : Colors.black,
              ),
            ),
          ),
        ),
      );
    }

    return Row(
      children: [
        tab(MenuTab.myAccount, 'MY ACCOUNT'),
        tab(MenuTab.ownerMenu, 'OWNER MENU'),
        tab(MenuTab.buyerMenu, 'BUYER MENU'),
      ],
    );
  }

  Widget _card(String title, String asset, List<Widget> rows) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(color: Color(0x4D007BFF), blurRadius: 8),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.teal,
                ),
              ),
              Image.asset(
                asset,
                height: 40,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...rows,
        ],
      ),
    );
  }

  Widget _row(String label, {int? count, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFEEEEEE))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMuted,
                ),
              ),
            ),
            if (count != null && count > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.teal,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$count',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, size: 20, color: Color(0xFFAAAAAA)),
          ],
        ),
      ),
    );
  }

  void _go(String route, [Object? args]) =>
      Navigator.pushNamed(context, route, arguments: args).then((_) => _load());

  Widget _myAccountCard() {
    return _card('My Account', 'assets/images/myaccountmore.png', [
      _row('ADD PROPERTY', onTap: () => _go(AppRoutes.addProperty)),
      _row('My Property',
          count: _counts['myProperty'], onTap: () => _go(AppRoutes.myProperty)),
      _row('My Profile', onTap: () => _go(AppRoutes.myProfile)),
      _row('My Plan', count: _counts['myPlan'], onTap: () => _go(AppRoutes.myPlan)),
      _row(
        'Notifications',
        count: (_counts['notifications'] ?? 0) +
            (_counts['notificationsUnread'] ?? 0),
        onTap: () => _go(AppRoutes.notifications),
      ),
      _row('Removed Property',
          count: _counts['removedProperty'],
          onTap: () => _go(AppRoutes.removedProperty)),
      _row('Expired Plans',
          count: _counts['expiredPlan'], onTap: () => _go(AppRoutes.expiredPlans)),
      _row('Add Plans (Owners)',
          count: _counts['allPlans'], onTap: () => _go(AppRoutes.pricingPlans)),
      _row('Points Pricing', onTap: () => _go(AppRoutes.pointsPlans)),
      _row('My Points History', onTap: () => _go(AppRoutes.pointsHistory)),
      _row('Contact Us', onTap: () => _go(AppRoutes.contactUs)),
      _row('Bank Loan Properties',
          onTap: () => _go(AppRoutes.curatedFeed, FeedSource.bankLoan)),
      _row('Houses Below ₹30 Lakhs',
          onTap: () => _go(AppRoutes.curatedFeed, FeedSource.housesBelow30L)),
      _row('Properties With Location',
          onTap: () => _go(AppRoutes.curatedFeed, FeedSource.withLocation)),
      _row('Property Map', onTap: () => _go(AppRoutes.propertyMap)),
    ]);
  }

  Widget _ownerMenuCard() {
    return _card('Owner Menu', 'assets/images/sellermore.png', [
      _row('Interested Buyers',
          count: _counts['interestedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'interestedBuyers')),
      _row('Matched Buyers',
          count: _counts['matchedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'matchedBuyers')),
      _row('Offers From Buyers',
          count: _counts['offersFromBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'offersFromBuyers')),
      _row('Contacted Buyers',
          count: _counts['contactedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'contactedBuyers')),
      _row('Photo Requested Buyers',
          count: _counts['photoRequestedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'photoRequestedBuyers')),
      _row('Shortlisted Buyers',
          count: _counts['shortlistedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'shortlistedBuyers')),
      _row('Viewed Buyers',
          count: _counts['viewedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'viewedBuyers')),
      _row('Address Requests',
          count: _counts['addressRequestsOwner'],
          onTap: () => _go(AppRoutes.activityList, 'addressRequestsOwner')),
      _row('Sold-Out Reports',
          count: _counts['soldOutBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'soldOutBuyers')),
      _row('Reported By Buyers',
          count: _counts['reportedBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'reportedBuyers')),
      _row('Help Requests From Buyers',
          count: _counts['helpBuyers'],
          onTap: () => _go(AppRoutes.activityList, 'helpBuyers')),
    ]);
  }

  Widget _buyerMenuCard() {
    return _card('Buyer Menu', 'assets/images/buyermore.png', [
      _row('Add Buyer Assistance',
          onTap: () => _go(AppRoutes.buyerAssistanceForm)),
      _row('My Buyer Assistance',
          count: _counts['myBuyerAssistance'],
          onTap: () => _go(AppRoutes.myBuyerAssistance)),
      _row('My Sent Interest',
          count: _counts['mySentInterest'],
          onTap: () => _go(AppRoutes.activityList, 'mySentInterest')),
      _row('My Matched Properties',
          count: _counts['myMatchedProperties'],
          onTap: () => _go(AppRoutes.activityList, 'myMatchedProperties')),
      _row('My Photo Requests',
          count: _counts['myPhotoRequests'],
          onTap: () => _go(AppRoutes.activityList, 'myPhotoRequests')),
      _row('My Contacted',
          count: _counts['myContacted'],
          onTap: () => _go(AppRoutes.activityList, 'myContacted')),
      _row('My Offers',
          count: _counts['myOffers'],
          onTap: () => _go(AppRoutes.activityList, 'myOffers')),
      _row('My Shortlisted Properties',
          count: _counts['myShortlist'],
          onTap: () => _go(AppRoutes.activityList, 'myShortlist')),
      _row('My Last Viewed Property',
          count: _counts['myLastViewed'],
          onTap: () => _go(AppRoutes.curatedFeed, FeedSource.lastViewed)),
      _row('My Most Viewed Property',
          count: _counts['myMostViewed'],
          onTap: () => _go(AppRoutes.curatedFeed, FeedSource.mostViewed)),
      _row('My Called List',
          count: _counts['myCalls'],
          onTap: () => _go(AppRoutes.activityList, 'myCalls')),
      _row('My Address Requests',
          count: _counts['addressRequestsBuyer'],
          onTap: () => _go(AppRoutes.activityList, 'addressRequestsBuyer')),
      _row('My Sold-Out Reports',
          count: _counts['mySoldOutReports'],
          onTap: () => _go(AppRoutes.activityList, 'mySoldOutReports')),
      _row('My Reported Properties',
          count: _counts['myReports'],
          onTap: () => _go(AppRoutes.activityList, 'myReports')),
      _row('My Help Requests',
          count: _counts['myHelpRequests'],
          onTap: () => _go(AppRoutes.activityList, 'myHelpRequests')),
      _row('My Buyer Assistant Plan',
          onTap: () => _go(AppRoutes.myBuyerPlan)),
    ]);
  }
}
