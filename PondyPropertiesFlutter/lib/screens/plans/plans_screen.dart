import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../routes.dart';
import '../../services/account_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// Which plan list a [PlansScreen] shows.
enum PlansKind {
  /// Buyable owner plans (AddPlan.jsx / PricingPlans.jsx).
  owner,

  /// Buyable buyer-assistance plans (BuyerPlan.jsx).
  buyer,

  /// Plans this user already owns (MyPlan.jsx).
  myOwner,

  /// Buyer plans this user already owns (MyBuyerPlan.jsx).
  myBuyer,

  /// Expired plans (ExpiredPlans.jsx).
  expired;

  String get title => switch (this) {
        PlansKind.owner => 'Pricing Plans',
        PlansKind.buyer => 'Buyer Assistant Plans',
        PlansKind.myOwner => 'My Plan',
        PlansKind.myBuyer => 'My Buyer Assistant Plan',
        PlansKind.expired => 'Expired Plans',
      };

  bool get isPurchasable => this == PlansKind.owner || this == PlansKind.buyer;
}

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key, required this.kind, this.ppcId});

  final PlansKind kind;

  /// Set when arriving from a specific listing, so the plan is applied to it.
  final String? ppcId;

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  List<Plan> _plans = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Reachable from a `.then()` after navigating away, so re-check first.
    if (!mounted) return;
    final session = context.read<SessionProvider>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final plans = switch (widget.kind) {
        PlansKind.owner => await AccountService.activePlans(),
        PlansKind.buyer => await AccountService.buyerPlans(),
        PlansKind.myOwner => session.isLoggedIn
            ? await AccountService.myPlans(session.phoneNumber!)
            : <Plan>[],
        PlansKind.myBuyer => session.isLoggedIn
            ? await AccountService.myBuyerPlans(session.phoneNumber!)
            : <Plan>[],
        PlansKind.expired => session.isLoggedIn
            ? await AccountService.expiredPlans(session.phoneNumber!)
            : <Plan>[],
      };
      if (mounted) {
        setState(() {
          _plans = plans;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = describeError(e);
          _loading = false;
        });
      }
    }
  }

  Future<void> _buy(Plan plan) async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      showToast(context, 'Please log in first.', error: true);
      return;
    }

    if (plan.amount <= 0) {
      // Free plans are applied directly — no PayU round-trip needed.
      try {
        await AccountService.selectPlan(
          phoneNumber: session.phoneNumber!,
          planId: plan.id,
          ppcId: widget.ppcId,
          planName: plan.name,
        );
        if (!mounted) return;
        showToast(context, '${plan.name} activated.');
        await _load();
      } catch (e) {
        if (mounted) showToast(context, describeError(e), error: true);
      }
      return;
    }

    final isBuyer = widget.kind == PlansKind.buyer;
    Navigator.pushNamed(
      context,
      AppRoutes.payuCheckout,
      arguments: <String, dynamic>{
        'endpoint': isBuyer ? '/payu/payment-buyer' : '/payu/payment',
        'laterEndpoint':
            isBuyer ? '/payu/payment-later-buyer' : '/payu/payment-later',
        'planName': plan.name,
        'planId': plan.id,
        'amount': plan.amount.toString(),
        'phone': session.phoneDigits,
        'ppcId': widget.ppcId ?? '',
        'productinfo': plan.name,
      },
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: Text(widget.kind.title),
        actions: [
          if (widget.kind == PlansKind.myOwner)
            TextButton(
              onPressed: () =>
                  Navigator.pushNamed(context, AppRoutes.pricingPlans),
              child: const Text('Buy plan'),
            ),
        ],
      ),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _plans.isEmpty
                  ? EmptyState(
                      message: switch (widget.kind) {
                        PlansKind.owner => 'No plans available right now.',
                        PlansKind.buyer =>
                          'No buyer assistant plans available right now.',
                        PlansKind.myOwner => "You don't have an active plan yet.",
                        PlansKind.myBuyer =>
                          "You don't have a buyer assistant plan yet.",
                        PlansKind.expired => 'No expired plans.',
                      },
                      action: widget.kind == PlansKind.myOwner
                          ? FilledButton(
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.teal,
                              ),
                              onPressed: () => Navigator.pushNamed(
                                context,
                                AppRoutes.pricingPlans,
                              ),
                              child: const Text('View plans'),
                            )
                          : null,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        itemCount: _plans.length,
                        itemBuilder: (_, i) => _planCard(_plans[i], i),
                      ),
                    ),
    );
  }

  Widget _planCard(Plan plan, int index) {
    // The middle plan gets the "popular" treatment, like the web pricing grid.
    final highlight = widget.kind.isPurchasable &&
        _plans.length > 2 &&
        index == (_plans.length ~/ 2);

    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: highlight
                    ? [AppColors.teal, AppColors.tealSoft]
                    : [AppColors.searchTop, AppColors.searchBottom],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        plan.name,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: highlight ? Colors.white : AppColors.tealDark,
                        ),
                      ),
                      if (plan.duration != null)
                        Text(
                          plan.duration!,
                          style: TextStyle(
                            fontSize: 12,
                            color: highlight ? Colors.white70 : AppColors.textMuted,
                          ),
                        ),
                    ],
                  ),
                ),
                Text(
                  plan.amount <= 0 ? 'FREE' : '₹${Fmt.indianNumber(plan.amount)}',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: highlight ? Colors.white : AppColors.tealDark,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (plan.description != null) ...[
                  Text(
                    plan.description!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                ...plan.features.map(
                  (f) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle,
                            size: 15, color: AppColors.tealSoft),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            f,
                            style: const TextStyle(fontSize: 12.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (!widget.kind.isPurchasable) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (plan.createdAt != null)
                        Expanded(
                          child: Text(
                            'Started ${Fmt.date(plan.createdAt)}',
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: AppColors.textFaint,
                            ),
                          ),
                        ),
                      if (plan.expiryDate != null)
                        Text(
                          'Expires ${Fmt.date(plan.expiryDate)}',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: widget.kind == PlansKind.expired
                                ? AppColors.onDemand
                                : AppColors.tealDark,
                          ),
                        ),
                    ],
                  ),
                ],
                if (widget.kind.isPurchasable) ...[
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => _buy(plan),
                      style: FilledButton.styleFrom(
                        backgroundColor:
                            highlight ? AppColors.teal : AppColors.tealSoft,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                      child: Text(
                        plan.amount <= 0 ? 'ACTIVATE FREE PLAN' : 'BUY THIS PLAN',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
