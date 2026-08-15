import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/buyer_assistance.dart';
import '../../services/buyer_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// DetailBuyerAssis.jsx — the full buyer requirement, plus "send interest" for
/// owners who have a matching property.
class BuyerAssistanceDetailScreen extends StatefulWidget {
  const BuyerAssistanceDetailScreen({super.key, required this.baId});

  final String baId;

  @override
  State<BuyerAssistanceDetailScreen> createState() =>
      _BuyerAssistanceDetailScreenState();
}

class _BuyerAssistanceDetailScreenState
    extends State<BuyerAssistanceDetailScreen> {
  BuyerAssistance? _buyer;
  bool _loading = true;
  bool _interestSent = false;
  String? _error;

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
      final buyer = await BuyerService.fetchById(widget.baId);
      if (!mounted) return;
      if (buyer == null) {
        setState(() {
          _error = 'This requirement is no longer available.';
          _loading = false;
        });
        return;
      }
      setState(() {
        _buyer = buyer;
        _loading = false;
      });

      final session = context.read<SessionProvider>();
      if (session.isLoggedIn) {
        unawaited(BuyerService.logView(
          baId: widget.baId,
          phoneNumber: session.phoneNumber!,
        ));
        setState(() => _interestSent = buyer.interestedUserPhones
            .any((p) => Fmt.plainPhone(p) == session.phoneDigits));
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  Future<void> _sendInterest() async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      showToast(context, 'Please log in first.', error: true);
      return;
    }
    final ok = await confirmDialog(
      context,
      message: 'Send your interest to this buyer?',
    );
    if (!ok) return;
    try {
      await BuyerService.sendInterest(
        baId: widget.baId,
        phoneNumber: session.phoneNumber!,
      );
      if (!mounted) return;
      setState(() => _interestSent = true);
      showToast(context, 'Interest sent to the buyer.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(title: Text('Buyer BA-${widget.baId}')),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _content(_buyer!),
    );
  }

  Widget _content(BuyerAssistance b) {
    return ListView(
      padding: const EdgeInsets.only(top: 12, bottom: 28),
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.searchBottom,
                    child: Text(
                      (b.name ?? 'B').characters.first.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.tealDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          b.name ?? 'Buyer',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Posted ${Fmt.date(b.createdAt)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textFaint,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Text(
                b.budgetLabel,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.bold,
                  color: AppColors.tealDark,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Looking for ${Fmt.cap(b.propertyType)} '
                '(${Fmt.cap(b.propertyMode)}) in ${b.locationLine}',
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Requirement Details',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.teal,
                ),
              ),
              const Divider(height: 18),
              _row('Property Mode', b.propertyMode, Icons.home_work_outlined),
              _row('Property Type', b.propertyType, Icons.house_siding),
              _row('Bedrooms', b.bedrooms, Icons.bed_outlined),
              _row(
                'Total Area',
                b.totalArea == null
                    ? null
                    : '${b.totalArea} ${b.areaUnit ?? ''}'.trim(),
                Icons.square_foot,
              ),
              _row('Property Age', b.propertyAge, Icons.timer_outlined),
              _row('Approved', b.propertyApproved, Icons.verified_outlined),
              _row('Facing', b.facing, Icons.explore_outlined),
              _row('Bank Loan', b.bankLoan, Icons.account_balance_outlined),
              _row('Loan Notes', b.loanInput, Icons.notes),
              _row('Payment Type', b.paymentType, Icons.payments_outlined),
              _row('State', b.state, Icons.map_outlined),
              _row('City', b.city, Icons.location_city),
              _row('Area', b.area, Icons.place_outlined),
              _row('Pin Code', b.pincode, Icons.markunread_mailbox_outlined),
            ],
          ),
        ),
        if ((b.description ?? '').isNotEmpty)
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Notes from the buyer',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.teal,
                  ),
                ),
                const Divider(height: 18),
                Text(
                  b.description!,
                  style: const TextStyle(fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
          child: Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: _interestSent ? null : _sendInterest,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.teal,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.thumb_up_alt_outlined, size: 17),
                  label: Text(_interestSent ? 'Interest Sent' : 'Send Interest'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => dialPhone(context, b.displayContact),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.tealDark,
                    side: const BorderSide(color: AppColors.tealSoft),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.call, size: 17),
                  label: const Text('Call Buyer'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _row(String label, String? value, IconData icon) {
    if (value == null || value.trim().isEmpty || value == 'N/A') {
      return const SizedBox.shrink();
    }
    return SpecRow(label: label, value: Fmt.cap(value), icon: icon);
  }
}
