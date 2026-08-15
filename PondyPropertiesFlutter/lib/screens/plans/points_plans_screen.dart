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

/// PointsPlans.jsx — buy points packs used for premium actions.
class PointsPlansScreen extends StatefulWidget {
  const PointsPlansScreen({super.key, this.autoBuy});

  /// Set when the InsufficientPointsModal sent the user straight here to buy a
  /// specific pack (`{price: 100, points: 100}`), skipping the plan picker.
  final Map<String, dynamic>? autoBuy;

  @override
  State<PointsPlansScreen> createState() => _PointsPlansScreenState();
}

class _PointsPlansScreenState extends State<PointsPlansScreen> {
  List<PointsPlan> _plans = const [];
  bool _loading = true;
  String? _error;

  /// Guards the auto-buy hand-off so a rebuild can't fire it twice.
  bool _autoBuyTriggered = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final plans = await AccountService.pointsPlans();
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _loading = false;
      });
      context.read<SessionProvider>().refreshPoints();
      _maybeAutoBuy();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  /// Resolve the requested pack and jump straight to PayU, matching the web's
  /// `autoBuy` effect: exact price+points first, then either on its own.
  void _maybeAutoBuy() {
    final auto = widget.autoBuy;
    if (auto == null || _autoBuyTriggered || _plans.isEmpty) return;

    final wantPrice = num.tryParse('${auto['price']}');
    final wantPoints = num.tryParse('${auto['points']}');

    PointsPlan? target;
    for (final p in _plans) {
      if (p.amount == wantPrice && p.points == wantPoints) {
        target = p;
        break;
      }
    }
    target ??= _plans.where((p) => p.amount == wantPrice).firstOrNull ??
        _plans.where((p) => p.points == wantPoints).firstOrNull;

    if (target == null) return;
    _autoBuyTriggered = true;
    _buy(target);
  }

  Future<void> _buy(PointsPlan plan) async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      showToast(context, 'Please log in first.', error: true);
      return;
    }
    try {
      await AccountService.selectPointsPlan(
        phoneNumber: session.phoneNumber!,
        planId: plan.id,
      );
    } catch (_) {
      /* selection is advisory; the payment is what matters */
    }
    if (!mounted) return;
    Navigator.pushNamed(
      context,
      AppRoutes.payuCheckout,
      arguments: <String, dynamic>{
        'endpoint': '/payu/points-payment',
        'planName': plan.name,
        'planId': plan.id,
        'amount': plan.amount.toString(),
        'phone': session.phoneDigits,
        'productinfo': '${plan.points} points',
      },
    ).then((_) {
      if (mounted) context.read<SessionProvider>().refreshPoints();
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: const Text('Points Pricing'),
        actions: [
          IconButton(
            tooltip: 'Points history',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.pointsHistory),
            icon: const Icon(Icons.history),
          ),
        ],
      ),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    children: [
                      _balanceCard(session.pointsBalance),
                      if (_plans.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: EmptyState(
                            message: 'No points packs available right now.',
                            icon: Icons.monetization_on_outlined,
                          ),
                        )
                      else
                        ..._plans.map(_planCard),
                      const SizedBox(height: 10),
                      _infoCard(),
                    ],
                  ),
                ),
    );
  }

  Widget _balanceCard(num balance) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: AppColors.pointsGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: AppColors.coinGradient),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Text('🪙', style: TextStyle(fontSize: 22)),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your balance',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              Text(
                '${Fmt.indianNumber(balance)} pts',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _planCard(PointsPlan plan) {
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${Fmt.indianNumber(plan.points)} points'
                  '${plan.bonus > 0 ? ' + ${Fmt.indianNumber(plan.bonus)} bonus' : ''}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.tealDark,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (plan.description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    plan.description!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          Column(
            children: [
              Text(
                '₹${Fmt.indianNumber(plan.amount)}',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.tealDark,
                ),
              ),
              const SizedBox(height: 6),
              FilledButton(
                onPressed: () => _buy(plan),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: const Text('BUY', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoCard() {
    return AppCard(
      color: AppColors.searchTop,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Row(
            children: [
              Icon(Icons.info_outline, size: 17, color: AppColors.teal),
              SizedBox(width: 8),
              Text(
                'How points work',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.bold,
                  color: AppColors.teal,
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          Text(
            'Points are deducted for premium actions such as revealing buyer '
            'contact details or unlocking extra owner contacts beyond your daily '
            'plan limit. Your balance never expires.',
            style: TextStyle(fontSize: 12.5, height: 1.5, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}
