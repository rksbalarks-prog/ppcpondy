import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../routes.dart';
import '../../services/account_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// PointsHistory.jsx — balance plus the points ledger.
class PointsHistoryScreen extends StatefulWidget {
  const PointsHistoryScreen({super.key});

  @override
  State<PointsHistoryScreen> createState() => _PointsHistoryScreenState();
}

class _PointsHistoryScreenState extends State<PointsHistoryScreen> {
  List<PointsTransaction> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      setState(() {
        _loading = false;
        _error = 'Please log in first.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final items = await AccountService.pointsTransactions(session.phoneNumber!);
    await session.refreshPoints();
    if (mounted) {
      setState(() {
        _items = items;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: const Text('My Points'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.pointsPlans),
            child: const Text('Buy points'),
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
                      _balance(session.pointsBalance),
                      const SectionHeading('Transaction history'),
                      if (_items.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 30),
                          child: EmptyState(
                            message: 'No points transactions yet.',
                            icon: Icons.receipt_long_outlined,
                          ),
                        )
                      else
                        ..._items.map(_tile),
                    ],
                  ),
                ),
    );
  }

  Widget _balance(num balance) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 4),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: AppColors.pointsGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Available balance',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 6),
          Text(
            Fmt.indianNumber(balance),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Text(
            'points',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _tile(PointsTransaction t) {
    final credit = t.isCredit;
    final color = credit ? const Color(0xFF2E7D32) : AppColors.onDemand;
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: color.withValues(alpha: 0.12),
            child: Icon(
              credit ? Icons.arrow_downward : Icons.arrow_upward,
              size: 16,
              color: color,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Fmt.cap(t.reason),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    if (t.ppcId != null) ...[
                      Text(
                        'PPC-${t.ppcId}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.tealDark,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      Fmt.dateTime(t.createdAt),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textFaint,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            '${credit ? '+' : '-'}${Fmt.indianNumber(t.points.abs())}',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
