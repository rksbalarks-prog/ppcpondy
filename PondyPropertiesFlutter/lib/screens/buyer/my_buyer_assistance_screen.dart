import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/buyer_assistance.dart';
import '../../routes.dart';
import '../../services/buyer_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/buyer_card.dart';
import '../../widgets/common.dart';

/// BuyerAssisBuyer.jsx — the signed-in user's own buyer requirements.
class MyBuyerAssistanceScreen extends StatefulWidget {
  const MyBuyerAssistanceScreen({super.key});

  @override
  State<MyBuyerAssistanceScreen> createState() =>
      _MyBuyerAssistanceScreenState();
}

class _MyBuyerAssistanceScreenState extends State<MyBuyerAssistanceScreen> {
  List<BuyerAssistance> _items = const [];
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
    try {
      final items = await BuyerService.fetchMine(session.phoneNumber!);
      if (mounted) {
        setState(() {
          _items = items;
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

  Future<void> _delete(BuyerAssistance b) async {
    final ok = await confirmDialog(
      context,
      title: 'Delete requirement',
      message: 'Delete requirement BA-${b.baId}?',
      yes: 'Delete',
      no: 'Cancel',
    );
    if (!ok) return;
    try {
      await BuyerService.remove(b.baId);
      if (!mounted) return;
      setState(() => _items = _items.where((x) => x.baId != b.baId).toList());
      showToast(context, 'Requirement deleted.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Buyer Assistance')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        onPressed: () =>
            Navigator.pushNamed(context, AppRoutes.buyerAssistanceForm)
                .then((_) => _load()),
        icon: const Icon(Icons.add),
        label: const Text('New requirement'),
      ),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyState(
                      message: "You haven't added any requirement yet.",
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(0, 10, 0, 90),
                        itemCount: _items.length,
                        itemBuilder: (_, i) => BuyerCard(
                          buyer: _items[i],
                          onTap: () => Navigator.pushNamed(
                            context,
                            AppRoutes.buyerAssistanceDetail,
                            arguments: _items[i].baId,
                          ),
                          onEdit: () => Navigator.pushNamed(
                            context,
                            AppRoutes.buyerAssistanceForm,
                            arguments: _items[i].raw,
                          ).then((_) => _load()),
                          onDelete: () => _delete(_items[i]),
                        ),
                      ),
                    ),
    );
  }
}
