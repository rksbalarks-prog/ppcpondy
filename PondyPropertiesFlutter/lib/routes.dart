import 'package:flutter/material.dart';

import 'screens/account/contact_us_screen.dart';
import 'screens/account/my_profile_screen.dart';
import 'screens/account/notifications_screen.dart';
import 'screens/account/static_page_screen.dart';
import 'screens/buyer/buyer_assistance_detail_screen.dart';
import 'screens/buyer/buyer_assistance_form_screen.dart';
import 'screens/buyer/my_buyer_assistance_screen.dart';
import 'screens/feed/property_feed_screen.dart';
import 'screens/feed/property_map_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'screens/menu/activity_list_screen.dart';
import 'screens/menu/menu_screen.dart';
import 'screens/plans/payu_checkout_screen.dart';
import 'screens/plans/plans_screen.dart';
import 'screens/plans/points_history_screen.dart';
import 'screens/plans/points_plans_screen.dart';
import 'screens/property/add_property_screen.dart';
import 'screens/property/my_property_screen.dart';
import 'screens/property/property_detail_screen.dart';
import 'screens/property/removed_property_screen.dart';
import 'screens/splash_screen.dart';

/// Named routes — one per React Router path in `Components/RouterPage.jsx`.
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String home = '/mobileviews';

  static const String propertyDetail = '/details';
  static const String addProperty = '/add-form';
  static const String myProperty = '/my-property';
  static const String removedProperty = '/removed-property';

  static const String buyerAssistanceForm = '/buyer-assistance';
  static const String myBuyerAssistance = '/buyer-assis-buyer';
  static const String buyerAssistanceDetail = '/detail-buyer-assis';

  static const String ownerMenu = '/owner-menu';
  static const String buyerMenu = '/buyer-menu';
  static const String activityList = '/activity';

  static const String myProfile = '/my-profile';
  static const String notifications = '/notification';

  static const String pricingPlans = '/add-plan';
  static const String myPlan = '/my-plan';
  static const String myBuyerPlan = '/my-buyer-plan';
  static const String buyerPlans = '/buyer-plan';
  static const String expiredPlans = '/expired-plans';
  static const String pointsPlans = '/points-plans';
  static const String pointsHistory = '/points-history';
  static const String payuCheckout = '/payu-form';

  static const String propertyMap = '/property-map';

  /// Curated collections — the web's `/sort/*` routes. Argument: a [FeedSource].
  static const String curatedFeed = '/sort';

  static const String about = '/about-mobile';
  static const String refundPolicy = '/refund-mobile';
  static const String terms = '/terms-conditions';
  static const String privacy = '/privacy-policy';
  static const String shipping = '/shiping-delivery-app';
  static const String faq = '/Frequently-Asked-Questions';
  static const String business = '/business';
  static const String ourSupport = '/our-support';
  static const String contactUs = '/contactus';

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    final args = settings.arguments;

    Widget page;
    switch (settings.name) {
      case splash:
        page = const SplashScreen();
      case login:
        page = LoginScreen(forcedCity: args is String ? args : null);
      case home:
        page = MainShell(initialTab: args is String ? args : null);

      case propertyDetail:
        // Either a bare ppcId, or {ppcId, siblings} when the caller can hand
        // over the list being browsed so swipe-left has somewhere to go.
        if (args is Map) {
          page = PropertyDetailScreen(
            ppcId: '${args['ppcId']}',
            siblings: (args['siblings'] as List?)?.cast<String>() ?? const [],
          );
        } else {
          page = PropertyDetailScreen(ppcId: '$args');
        }
      case addProperty:
        page = const AddPropertyScreen();
      case myProperty:
        page = const MyPropertyScreen();
      case removedProperty:
        page = const RemovedPropertyScreen();

      case buyerAssistanceForm:
        page = BuyerAssistanceFormScreen(
          existing: args is Map<String, dynamic> ? args : null,
        );
      case myBuyerAssistance:
        page = const MyBuyerAssistanceScreen();
      case buyerAssistanceDetail:
        page = BuyerAssistanceDetailScreen(baId: '$args');

      case ownerMenu:
        page = const MenuScreen(initialTab: MenuTab.ownerMenu);
      case buyerMenu:
        page = const MenuScreen(initialTab: MenuTab.buyerMenu);
      case activityList:
        page = ActivityListScreen(feedKey: '$args');

      case myProfile:
        page = const MyProfileScreen();
      case notifications:
        page = const NotificationsScreen();

      case pricingPlans:
        page = PlansScreen(
          kind: PlansKind.owner,
          ppcId: args is String ? args : null,
        );
      case buyerPlans:
        page = const PlansScreen(kind: PlansKind.buyer);
      case myPlan:
        page = const PlansScreen(kind: PlansKind.myOwner);
      case myBuyerPlan:
        page = const PlansScreen(kind: PlansKind.myBuyer);
      case expiredPlans:
        page = const PlansScreen(kind: PlansKind.expired);
      case pointsPlans:
        // Args carry the InsufficientPointsModal's autoBuy request, if any.
        page = PointsPlansScreen(
          autoBuy: args is Map<String, dynamic> ? args : null,
        );
      case pointsHistory:
        page = const PointsHistoryScreen();
      case payuCheckout:
        page = PayuCheckoutScreen(params: args as Map<String, dynamic>);

      case propertyMap:
        page = const PropertyMapScreen();
      case curatedFeed:
        final source = args is FeedSource ? args : FeedSource.all;
        page = PropertyFeedScreen(source: source, title: source.title);

      case about:
        page = const StaticPageScreen(page: StaticPage.about);
      case refundPolicy:
        page = const StaticPageScreen(page: StaticPage.refund);
      case terms:
        page = const StaticPageScreen(page: StaticPage.terms);
      case privacy:
        page = const StaticPageScreen(page: StaticPage.privacy);
      case shipping:
        page = const StaticPageScreen(page: StaticPage.shipping);
      case faq:
        page = const StaticPageScreen(page: StaticPage.faq);
      case business:
        page = const StaticPageScreen(page: StaticPage.business);
      case ourSupport:
        page = const StaticPageScreen(page: StaticPage.support);
      case contactUs:
        page = const ContactUsScreen();

      default:
        return null;
    }

    return MaterialPageRoute(builder: (_) => page, settings: settings);
  }
}
