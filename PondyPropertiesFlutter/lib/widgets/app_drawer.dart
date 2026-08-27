import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/config.dart';
import '../core/theme.dart';
import '../routes.dart';
import '../state/session_provider.dart';
import 'common.dart';

/// The 300px slide-in sidebar from Navbar.jsx, entry-for-entry.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();
    final phone = session.phoneNumber ?? '';

    return Drawer(
      width: 300,
      backgroundColor: Colors.white,
      child: Column(
        children: [
          _header(context, phone),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(bottom: 24),
              children: [
                _item(context, Icons.account_circle, 'My Profile',
                    () => Navigator.pushNamed(context, AppRoutes.myProfile)),
                _item(context, Icons.apartment, 'My Property',
                    () => Navigator.pushNamed(context, AppRoutes.myProperty)),
                _item(context, Icons.lightbulb_outline, 'My Plan',
                    () => Navigator.pushNamed(context, AppRoutes.myPlan)),
                _item(context, Icons.rocket_launch_outlined, 'Pricing Plans',
                    () => Navigator.pushNamed(context, AppRoutes.pricingPlans)),
                _item(context, Icons.monetization_on_outlined, 'Points Pricing',
                    () => Navigator.pushNamed(context, AppRoutes.pointsPlans)),
                _item(context, Icons.history, 'My Points History',
                    () => Navigator.pushNamed(context, AppRoutes.pointsHistory)),
                _item(context, Icons.workspace_premium_outlined,
                    'My Buyer Assistant Plan',
                    () => Navigator.pushNamed(context, AppRoutes.myBuyerPlan)),
                _item(context, Icons.storefront_outlined, 'Owner Menu',
                    () => Navigator.pushNamed(context, AppRoutes.ownerMenu)),
                _item(context, Icons.people_outline, 'Buyer Menu',
                    () => Navigator.pushNamed(context, AppRoutes.buyerMenu)),
                _item(context, Icons.notifications_none, 'Notifications',
                    () => Navigator.pushNamed(context, AppRoutes.notifications)),
                const Divider(height: 20),
                _item(context, Icons.phone, 'Contact Us',
                    () => Navigator.pushNamed(context, AppRoutes.contactUs)),
                _item(context, Icons.info_outline, 'About Us',
                    () => Navigator.pushNamed(context, AppRoutes.about)),
                _item(context, Icons.policy_outlined, 'Refund Policy',
                    () => Navigator.pushNamed(context, AppRoutes.refundPolicy)),
                _item(context, Icons.description_outlined, 'Terms And Conditions',
                    () => Navigator.pushNamed(context, AppRoutes.terms)),
                _item(context, Icons.privacy_tip_outlined, 'Privacy Policy',
                    () => Navigator.pushNamed(context, AppRoutes.privacy)),
                _item(context, Icons.local_shipping_outlined, 'Shipping & Delivery',
                    () => Navigator.pushNamed(context, AppRoutes.shipping)),
                _item(context, Icons.help_outline, 'FAQ',
                    () => Navigator.pushNamed(context, AppRoutes.faq)),
                const Divider(height: 20),
                _item(context, Icons.apps, 'More App',
                    () => launchExternal(context, AppConfig.devPlayStoreUrl),
                    closeDrawer: false),
                _item(context, Icons.share, 'Share App',
                    () => launchExternal(context, AppConfig.devPlayStoreUrl),
                    closeDrawer: false),
                _item(context, Icons.star_border, 'Rate App',
                    () => launchExternal(context, AppConfig.devPlayStoreUrl),
                    closeDrawer: false),
                _item(context, Icons.verified_user_outlined, 'Business Opportunity',
                    () => Navigator.pushNamed(context, AppRoutes.business)),
                _item(context, Icons.groups_outlined, 'Our Support',
                    () => Navigator.pushNamed(context, AppRoutes.ourSupport)),
                const Divider(height: 20),
                _item(context, Icons.logout, 'Logout', () => _logout(context)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _header(BuildContext context, String phone) {
    return Container(
      color: AppColors.teal,
      padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/images/ppc_logo.jpg',
                width: 68,
                height: 68,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 68,
                  height: 68,
                  color: Colors.white24,
                  child: const Icon(Icons.home, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Pondy Property',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Buy and sell your Property in Pondicherry',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  if (phone.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.phone, size: 12, color: Colors.white),
                        const SizedBox(width: 5),
                        Text(
                          phone,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _item(
    BuildContext context,
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool closeDrawer = true,
  }) {
    return ListTile(
      dense: true,
      visualDensity: const VisualDensity(vertical: -1),
      leading: Icon(icon, size: 20, color: AppColors.teal),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      onTap: () {
        if (closeDrawer) Navigator.pop(context);
        onTap();
      },
    );
  }

  /// [_item] pops the drawer BEFORE invoking this, so the drawer subtree —
  /// and this `context` with it — is unmounted as soon as the close animation
  /// finishes, about a quarter of a second later. That is always long before
  /// the user answers the confirm dialog, so the old `!context.mounted` guards
  /// fired every single time and swallowed the logout without a word.
  ///
  /// The navigator and the session both outlive the drawer, so capture them
  /// while the context is still alive and never touch it across the await.
  /// The dialog goes on the root navigator (showDialog's default), which is
  /// why it appeared even though the context behind it was already dying.
  Future<void> _logout(BuildContext context) async {
    final navigator = Navigator.of(context, rootNavigator: true);
    final session = context.read<SessionProvider>();

    final ok = await confirmDialog(
      navigator.context,
      message: 'Are you sure you want to logout?',
    );
    if (!ok) return;

    await session.signOut();
    navigator.pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
  }
}
