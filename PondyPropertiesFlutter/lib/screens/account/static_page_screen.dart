import 'package:flutter/material.dart';

import '../../core/config.dart';
import '../../core/theme.dart';
import '../../services/account_service.dart';
import '../../widgets/common.dart';

/// The informational pages: About, Refund Policy, Terms, Privacy, Shipping,
/// FAQ, Business Opportunity and Our Support.
///
/// Each has a bundled fallback so the page still reads correctly if the CMS
/// endpoint (`/get-text/:key`) is unavailable.
enum StaticPage {
  about,
  refund,
  terms,
  privacy,
  shipping,
  faq,
  business,
  support;

  String get title => switch (this) {
        StaticPage.about => 'About Us',
        StaticPage.refund => 'Refund Policy',
        StaticPage.terms => 'Terms & Conditions',
        StaticPage.privacy => 'Privacy Policy',
        StaticPage.shipping => 'Shipping & Delivery',
        StaticPage.faq => 'Frequently Asked Questions',
        StaticPage.business => 'Business Opportunity',
        StaticPage.support => 'Our Support',
      };

  /// The key the backend stores this block under.
  String get remoteKey => switch (this) {
        StaticPage.about => 'about',
        StaticPage.refund => 'refund',
        StaticPage.terms => 'terms',
        StaticPage.privacy => 'privacy',
        StaticPage.shipping => 'shipping',
        StaticPage.faq => 'faq',
        StaticPage.business => 'business',
        StaticPage.support => 'support',
      };
}

class StaticPageScreen extends StatefulWidget {
  const StaticPageScreen({super.key, required this.page});

  final StaticPage page;

  @override
  State<StaticPageScreen> createState() => _StaticPageScreenState();
}

class _StaticPageScreenState extends State<StaticPageScreen> {
  String? _remote;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final text = await AccountService.fetchText(widget.page.remoteKey);
    if (mounted) {
      setState(() {
        _remote = text;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text(widget.page.title)),
      body: _loading
          ? const AppLoader()
          : ListView(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
              children: [
                if (widget.page == StaticPage.faq)
                  ..._faqSection()
                else
                  Text(
                    _stripHtml(_remote) ?? _fallback,
                    style: const TextStyle(fontSize: 13.5, height: 1.7),
                  ),
                const SizedBox(height: 28),
                const Divider(),
                const SizedBox(height: 12),
                _contactBlock(),
              ],
            ),
    );
  }

  /// The CMS stores rich text; strip the markup so it reads cleanly here.
  String? _stripHtml(String? html) {
    if (html == null) return null;
    final text = html
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</(p|div|li|h[1-6])>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n')
        .trim();
    return text.isEmpty ? null : text;
  }

  Widget _contactBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Need help?',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppColors.teal,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => dialPhone(context, AppConfig.supportPhone),
          child: Row(
            children: [
              const Icon(Icons.phone, size: 16, color: AppColors.teal),
              const SizedBox(width: 8),
              Text(
                AppConfig.supportPhone,
                style: const TextStyle(fontSize: 13, color: AppColors.tealDark),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () => launchExternal(context, 'mailto:${AppConfig.supportEmail}'),
          child: Row(
            children: [
              const Icon(Icons.mail_outline, size: 16, color: AppColors.teal),
              const SizedBox(width: 8),
              Text(
                AppConfig.supportEmail,
                style: const TextStyle(fontSize: 13, color: AppColors.tealDark),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _faqSection() {
    const faqs = <({String q, String a})>[
      (
        q: 'How do I list my property?',
        a: 'Tap the centre button on the bottom bar, fill in the six-step form '
            'and submit. Our team verifies the details before publishing.'
      ),
      (
        q: 'What is a PPC-ID?',
        a: 'A PPC-ID is the unique reference number assigned to every property '
            'on Pondy Property. Quote it when you contact us about a listing.'
      ),
      (
        q: 'Why can I only see a limited number of owner contacts per day?',
        a: 'Contact reveals are capped per day based on your plan. Upgrade from '
            'Pricing Plans to increase the limit.'
      ),
      (
        q: 'What are points used for?',
        a: 'Points are deducted for premium actions such as revealing buyer '
            'contact details. Buy more from Points Pricing.'
      ),
      (
        q: 'How does Buyer Assistance work?',
        a: 'Post what you are looking for and owners with matching properties '
            'contact you directly. You can also browse the Buyer List as an owner.'
      ),
      (
        q: 'I removed a property by mistake. Can I restore it?',
        a: 'Yes — open Removed Property from the menu and tap Restore.'
      ),
      (
        q: 'How do I switch between Pondicherry and Chennai?',
        a: 'Use the city pills at the very top of the home screen. All listings '
            'and searches then apply to that city.'
      ),
    ];

    return faqs
        .map(
          (f) => Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(bottom: 12),
              title: Text(
                f.q,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    f.a,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.6,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
        )
        .toList();
  }

  String get _fallback => switch (widget.page) {
        // FAQ renders as an expandable list, so it never reads this.
        StaticPage.faq => '',
        StaticPage.about => '''
Pondy Property is Pondicherry's dedicated property marketplace, now also serving Chennai.

We connect genuine property owners with genuine buyers — no middlemen, no inflated listings. Every property is verified by our team before it goes live, and every buyer requirement is matched against new listings automatically.

What we offer
• Verified property listings for sale, rent and lease
• Buyer Assistance — post what you need and let owners come to you
• Direct owner contact, with no brokerage on our side
• Support with loans, valuation, documentation and registration

Our promise is simple: honest listings, direct contact, and a team you can actually reach on the phone.''',
        StaticPage.refund => '''
Refund Policy

1. Subscription plans and points packs are digital services activated immediately after a successful payment.

2. If a payment is deducted but the plan or points are not credited to your account, the amount is refunded in full to the original payment method within 5–7 working days. Contact us with your transaction ID.

3. Once a plan is active and has been used (a listing published, contacts revealed, or points spent), the fee is non-refundable.

4. If your property listing is rejected during our verification process, any plan fee paid for that listing is refunded in full.

5. Refunds are always issued to the original payment method. We do not issue cash refunds or transfers to third-party accounts.

To request a refund, contact our support team with your registered mobile number and the transaction reference.''',
        StaticPage.terms => '''
Terms & Conditions

1. Eligibility — You must be 18 or older and provide a valid mobile number to use Pondy Property.

2. Accuracy of listings — You are responsible for the accuracy of any property or requirement you post. Misleading, duplicate or fraudulent listings are removed without refund.

3. Verification — Every listing is reviewed before publication. We may request supporting documents and may decline to publish a listing at our discretion.

4. Our role — Pondy Property is a listing platform. We are not a party to any transaction between an owner and a buyer, and we do not guarantee the completion, price or legality of any deal.

5. Contact limits — Owner contact reveals and buyer contact reveals are limited per day according to your active plan.

6. Prohibited use — You may not scrape the platform, resell data, post another person's contact details, or use the service to send unsolicited marketing.

7. Account suspension — We may suspend or remove any account that breaches these terms.

8. Changes — These terms may be updated from time to time; continued use constitutes acceptance of the updated terms.''',
        StaticPage.privacy => '''
Privacy Policy

What we collect
• Your mobile number, used to sign you in and to contact you about your listings
• Profile details you choose to add (name, email, address)
• Property and buyer-requirement details you post
• Basic usage data such as which screens you open and which listings you view

How we use it
• To operate the service — publishing your listings and matching them to buyers
• To send you OTPs, listing status updates and match notifications over SMS and WhatsApp
• To enforce daily contact limits and prevent abuse

What we share
• An owner's contact number is shown to a buyer only after the buyer taps "View Owner Contact" — and vice versa for buyer details
• We never sell your personal data to third parties
• We share data with payment providers only as required to process a transaction

Your choices
• You can edit or delete your profile and listings at any time
• You can request account deletion by contacting support
• You can opt out of promotional messages while continuing to receive transactional ones

Retention & security
Your data is stored on secured servers and retained for as long as your account is active, or as required by law.''',
        StaticPage.shipping => '''
Shipping & Delivery

Pondy Property sells digital services only — property listing subscriptions, buyer assistance plans and points packs. Nothing is physically shipped.

Delivery timeline
• Plans and points are credited to your account immediately after a successful payment, usually within seconds.
• If a payment succeeds but nothing is credited within 30 minutes, contact support with your transaction ID and it will be resolved or refunded.

Service activation
• A listing plan is applied to the specific PPC-ID you selected at checkout.
• Points are credited to your account balance and can be spent on any premium action.

Access
Your active plans and points balance are always visible under My Plan and My Points History.''',
        StaticPage.business => '''
Business Opportunity

Partner with Pondy Property

We work with local agents, builders and franchise partners across Pondicherry and Chennai.

Franchise partner
Run Pondy Property in your town or district. You get the brand, the platform, onboarding support and a share of every subscription sold in your area.

Channel partner / agent
List your inventory, get verified buyer leads matched to your properties, and use the Buyer List to find buyers actively searching in your locality.

Builder partner
Showcase your projects as Featured Properties, get priority placement in the feed, and receive matched buyer leads directly.

Advertising
Promote your business to thousands of active property seekers with banner placements across the app.

Interested? Call our team and we will walk you through the commercials.''',
        StaticPage.support => '''
Our Support

Our team is available seven days a week to help with anything on the platform.

What we help with
• Listing your property and getting it verified quickly
• Choosing the right plan for how many properties you have
• Finding buyers for a specific property
• Home-loan guidance and lender introductions
• Property valuation and price benchmarking
• Document verification, EC, patta name change and registration help
• Booking and coordinating property visits

How to reach us
Call or WhatsApp our support number, or use the Contact Us form in the menu — we usually reply the same day.

You can also raise a request against any specific listing using the "Need Help" button on its detail page; it reaches us with the property already attached.''',
      };
}
